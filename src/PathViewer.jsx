// PathViewer.jsx
// Visor de RECORRIDO (tipo 'path3d'): cámara sobre un raíl (polilínea) con
// altura libre, pensado para recorrer una bóveda por dentro.
//
// Render: SIN iluminar (albedo horneado). MeshBasicMaterial + Canvas `flat`,
// igual que ModelViewer (Trastevere). Iluminar reventaría la luz ya horneada.
//
// Controles (cada gesto, una sola cosa — sin multiplexar, perfecto en táctil):
//   · Slider inferior  -> AVANCE por el arco (fracción 0..1 del rango navegable).
//   · Slider lateral   -> ALTURA (sube hacia la bóveda, en las unidades del modelo).
//   · Arrastre (ratón / un dedo) -> MIRAR (azimut + elevación, acotados).
//   · Rueda            -> zoom de lente en mm (secundario).
//   · Botón Inicio     -> reset de posición y mirada.
//
// MODO AFINADO (solo en desarrollo, import.meta.env.DEV): panel con los valores
// listos para el .txt (avance/altura/mirada iniciales + lente) y botón para
// copiar el bloque. La mirada se muestra AL SOLTAR el arrastre; los sliders, en vivo.
//
// Props (las inyecta ViewRenderer desde monuments.generated.json):
//   model   : url del .glb (servido desde /)
//   points  : [[x,y,z], ...] polilínea ya ordenada (la hornea build-monuments)
//   path    : { axis, side, look, lookInit:[yaw,pitch]º, lookLimits:[±yaw,±pitch]º,
//               height:[min,max], heightInit, advance:[min,max], advanceInit,
//               smooth, focal, focalRange:[min,max], console:'fija'|'atenua' }
//   color   : { gain?:[r,g,b], gamma?:[r,g,b] } — corrección de color sobre el albedo

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { KTX2Loader } from 'three-stdlib';
import * as THREE from 'three';
import { DebugPanel } from './debug';
import HelpOverlay from './HelpOverlay';
import './pathviewer.css';

// Apertura de película (mm) para la conversión lente->fov. Igual que ObjectViewer,
// para que el valor de 'lente' se sienta consistente entre visores.
const APERTURE = 24.576;
const SENS = 0.0026; // rad por píxel de arrastre

// Modo afinado: solo en desarrollo (invisible en la web publicada / el pitch).
const DEV = !!(import.meta && import.meta.env && import.meta.env.DEV);

const deg2rad = (d) => (d * Math.PI) / 180;
const rad2deg = (r) => (r * 180) / Math.PI;
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const clamp01 = (v) => clamp(v, 0, 1);
const focalToFov = (mm) => (2 * Math.atan(APERTURE / (2 * mm)) * 180) / Math.PI;

// --- Singleton KTX2 (mismo patrón que ModelViewer) -------------------------
let _ktx2 = null;
function getKTX2(gl) {
  if (!_ktx2) _ktx2 = new KTX2Loader().setTranscoderPath('/basis/');
  _ktx2.detectSupport(gl);
  return _ktx2;
}

// --- Geometría del raíl ----------------------------------------------------
function centroid(pts) {
  const c = new THREE.Vector3();
  for (const p of pts) c.add(p);
  return c.multiplyScalar(1 / Math.max(pts.length, 1));
}

// Normal del plano de la polilínea (método de Newell; robusto en mallas planas).
function newellNormal(pts) {
  const n = new THREE.Vector3();
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i], nxt = pts[(i + 1) % pts.length];
    n.x += (cur.y - nxt.y) * (cur.z + nxt.z);
    n.y += (cur.z - nxt.z) * (cur.x + nxt.x);
    n.z += (cur.x - nxt.x) * (cur.y + nxt.y);
  }
  if (n.lengthSq() < 1e-9) n.set(0, 1, 0); // degenerado -> Y por defecto
  return n.normalize();
}

// Muestreador por longitud de arco. smooth -> Catmull-Rom; si no, lineal.
function makeSampler(pts, smooth) {
  if (smooth && pts.length >= 2) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => p.clone()), false, 'centripetal');
    return {
      pointAt: (t) => curve.getPointAt(clamp01(t)),
      tangentAt: (t) => curve.getTangentAt(clamp01(t)).normalize(),
    };
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + pts[i].distanceTo(pts[i - 1]);
  const total = cum[cum.length - 1] || 1;
  const locate = (t) => {
    const d = clamp01(t) * total;
    let i = 1;
    while (i < cum.length && cum[i] < d) i++;
    const a = pts[i - 1], b = pts[Math.min(i, pts.length - 1)];
    const seg = (cum[i] - cum[i - 1]) || 1;
    return { a, b, f: (d - cum[i - 1]) / seg };
  };
  return {
    pointAt: (t) => { const { a, b, f } = locate(t); return a.clone().lerp(b, f); },
    tangentAt: (t) => { const { a, b } = locate(t); const d = b.clone().sub(a); return d.lengthSq() < 1e-9 ? new THREE.Vector3(1, 0, 0) : d.normalize(); },
  };
}

// --- Escena 3D (dentro del Canvas) -----------------------------------------
// 'color' (opcional): { gain:[r,g,b], gamma:[r,g,b] } — corrección sobre el
// albedo horneado (viene del .txt como 'color gain'/'color gamma', horneado en
// monuments.generated.json). Sin corrección si no se especifica (1,1,1).
function Stage3D({ url, points, path, controls, color }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);

  const { scene } = useGLTF(url, '/draco/', undefined, (loader) => {
    loader.setKTX2Loader(getKTX2(gl));
  });

  const gain = useMemo(() => new THREE.Vector3(...(color?.gain ?? [1, 1, 1])), [color]);
  const gamma = useMemo(() => new THREE.Vector3(...(color?.gamma ?? [1, 1, 1])), [color]);

  // Albedo horneado: convierte cada material a MeshBasicMaterial (sin iluminar).
  // Mide de paso la bbox para deducir el lado "techo" cuando arco lado=auto.
  const { obj, meshCenter } = useMemo(() => {
    scene.traverse((o) => {
      if (o.isMesh && o.material) {
        const map = o.material.map || null;
        if (map) map.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide, toneMapped: false });

        // MeshBasicMaterial no tiene uniforms propios para esto -> se inyecta
        // en el fragment shader. gain = multiplicador; gamma = curva (pow(1/gamma),
        // gamma>1 aclara medios tonos, gamma<1 los oscurece). Se aplica justo
        // después de muestrear la textura (map_fragment).
        mat.onBeforeCompile = (shader) => {
          shader.uniforms.uColorGain = { value: gain };
          shader.uniforms.uColorGamma = { value: gamma };
          shader.fragmentShader = shader.fragmentShader
            .replace(
              '#include <common>',
              '#include <common>\nuniform vec3 uColorGain;\nuniform vec3 uColorGamma;'
            )
            .replace(
              '#include <map_fragment>',
              `#include <map_fragment>
    diffuseColor.rgb *= uColorGain;
    diffuseColor.rgb = pow(max(diffuseColor.rgb, 0.0), 1.0 / uColorGamma);`
            );
        };

        o.material = mat;
        o.frustumCulled = false;
      }
    });
    const box = new THREE.Box3().setFromObject(scene);
    const c = new THREE.Vector3();
    box.getCenter(c);
    return { obj: scene, meshCenter: c };
  }, [scene, gain, gamma]);

  // Vectores del recorrido: eje de altura (con signo), muestreador y centro.
  const geom = useMemo(() => {
    const pts = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    let n;
    if (Array.isArray(path.axis) && path.axis.length === 3) n = new THREE.Vector3(...path.axis).normalize();
    else n = newellNormal(pts);

    let axis;
    if (path.side === '+') axis = n.clone();
    else if (path.side === '-') axis = n.clone().multiplyScalar(-1);
    else {
      // auto: hacia donde está la masa de la malla (la bóveda).
      const pc = centroid(pts);
      const toMesh = meshCenter.clone().sub(pc);
      axis = toMesh.dot(n) >= 0 ? n.clone() : n.clone().multiplyScalar(-1);
    }
    return { axis, center: centroid(pts), sampler: makeSampler(pts, path.smooth !== false) };
  }, [points, path, meshCenter]);

  // Bucle: coloca y orienta la cámara según los controles en vivo.
  const tmp = useMemo(() => ({
    fwd: new THREE.Vector3(), up: new THREE.Vector3(), right: new THREE.Vector3(),
    pos: new THREE.Vector3(), look: new THREE.Vector3(),
    qY: new THREE.Quaternion(), qP: new THREE.Quaternion(),
  }), []);

  useFrame(() => {
    const c = controls.current;
    const aRange = path.advance || [0, 1];
    const t = clamp(aRange[0] + c.advance * (aRange[1] - aRange[0]), 0, 1);

    const P = geom.sampler.pointAt(t);
    const tan = geom.sampler.tangentAt(t);
    const up0 = geom.axis;

    // posición = punto del raíl + altura a lo largo del eje hacia el techo
    tmp.pos.copy(P).addScaledVector(up0, c.height);

    // marco de mirada según el modo (siempre ortonormal)
    if (path.look === 'tangente') { tmp.fwd.copy(tan); tmp.up.copy(up0); }
    else if (path.look === 'radial') {
      tmp.fwd.copy(geom.center).sub(P);
      tmp.fwd.addScaledVector(up0, -tmp.fwd.dot(up0)); // proyecta al plano
      if (tmp.fwd.lengthSq() < 1e-9) tmp.fwd.copy(tan);
      tmp.fwd.normalize(); tmp.up.copy(up0);
    } else { tmp.fwd.copy(up0); tmp.up.copy(tan); } // 'arriba'

    tmp.right.crossVectors(tmp.fwd, tmp.up).normalize();
    // re-ortonormaliza el up para evitar deriva
    tmp.up.crossVectors(tmp.right, tmp.fwd).normalize();

    // aplica pitch (sobre right) y yaw (sobre up)
    tmp.qP.setFromAxisAngle(tmp.right, c.pitch);
    tmp.qY.setFromAxisAngle(tmp.up, c.yaw);
    const dir = tmp.fwd.clone().applyQuaternion(tmp.qP).applyQuaternion(tmp.qY);
    const camUp = tmp.up.clone().applyQuaternion(tmp.qP).applyQuaternion(tmp.qY);

    camera.position.copy(tmp.pos);
    camera.up.copy(camUp);
    camera.lookAt(tmp.look.copy(tmp.pos).add(dir));

    const fov = focalToFov(c.lens);
    if (Math.abs(camera.fov - fov) > 1e-3) { camera.fov = fov; camera.updateProjectionMatrix(); }
  });

  return <primitive object={obj} />;
}

// --- Componente público -----------------------------------------------------
export default function PathViewer({ model, points = [], path = {}, color }) {
  const lookLimits = path.lookLimits || [60, 45];
  const height = path.height || [1.5, 3.0];
  const focalRange = path.focalRange || [24, 85];
  const hLo = Math.min(...height), hHi = Math.max(...height);

  // Estado inicial (clamp a límites).
  const yawLim = deg2rad(lookLimits[0]);
  const pitchLim = deg2rad(lookLimits[1]);
  const init = useMemo(() => ({
    advance: clamp01(path.advanceInit ?? 0),
    height: clamp(path.heightInit ?? hLo, hLo, hHi),
    yaw: clamp(deg2rad(path.lookInit?.[0] ?? 0), -yawLim, yawLim),
    pitch: clamp(deg2rad(path.lookInit?.[1] ?? 0), -pitchLim, pitchLim),
    lens: clamp(path.focal ?? 35, focalRange[0], focalRange[1]),
  }), [path, hLo, hHi, yawLim, pitchLim, focalRange]);

  const controls = useRef({ ...init });
  const [ui, setUi] = useState({ advance: init.advance, height: init.height, lens: init.lens });
  const [hint, setHint] = useState(true);
  const [dim, setDim] = useState(false);

  // Lectura del modo afinado (solo DEV). yaw/pitch en grados, AL SOLTAR.
  const [tune, setTune] = useState({
    advance: init.advance, height: init.height, lens: init.lens,
    yaw: rad2deg(init.yaw), pitch: rad2deg(init.pitch),
  });

  const stageRef = useRef(null);
  const drag = useRef(null);
  const idleTimer = useRef(null);

  // Consola que se atenúa al estar quieto (solo si consola: atenua).
  const poke = useCallback(() => {
    if (path.console !== 'atenua') return;
    setDim(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setDim(true), 2500);
  }, [path.console]);
  useEffect(() => () => clearTimeout(idleTimer.current), []);

  // Arrastre para mirar.
  const onPointerDown = (e) => {
    drag.current = { x: e.clientX, y: e.clientY };
    setHint(false); poke();
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    const c = controls.current;
    c.yaw = clamp(c.yaw - dx * SENS, -yawLim, yawLim);
    c.pitch = clamp(c.pitch - dy * SENS, -pitchLim, pitchLim);
    poke();
  };
  const endDrag = (e) => {
    if (!drag.current) return;
    drag.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    // Modo afinado: refresca la mirada AL SOLTAR.
    if (DEV) {
      const c = controls.current;
      setTune((s) => ({ ...s, yaw: rad2deg(c.yaw), pitch: rad2deg(c.pitch) }));
    }
  };

  // Rueda -> lente (zoom secundario). Listener no pasivo para no scrollear la página.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const c = controls.current;
      c.lens = clamp(c.lens - Math.sign(e.deltaY) * 2, focalRange[0], focalRange[1]);
      setUi((u) => ({ ...u, lens: c.lens }));
      if (DEV) setTune((s) => ({ ...s, lens: c.lens }));
      poke();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [focalRange, poke]);

  const onAdvance = (e) => {
    const v = parseFloat(e.target.value);
    controls.current.advance = v;
    setUi((u) => ({ ...u, advance: v }));
    if (DEV) setTune((s) => ({ ...s, advance: v }));
    setHint(false); poke();
  };
  const onHeight = (e) => {
    const v = parseFloat(e.target.value);
    controls.current.height = v;
    setUi((u) => ({ ...u, height: v }));
    if (DEV) setTune((s) => ({ ...s, height: v }));
    poke();
  };
  const reset = () => {
    controls.current = { ...init };
    setUi({ advance: init.advance, height: init.height, lens: init.lens });
    if (DEV) setTune({ advance: init.advance, height: init.height, lens: init.lens, yaw: rad2deg(init.yaw), pitch: rad2deg(init.pitch) });
    poke();
  };

  // Modo afinado: bloque de texto listo para pegar en el .txt.
  const tuneBlock = () =>
    `avance inicial: ${tune.advance.toFixed(3)}\n` +
    `altura inicial: ${tune.height.toFixed(2)}\n` +
    `mirada inicial: ${Math.round(tune.yaw)},${Math.round(tune.pitch)}\n` +
    `lente: ${Math.round(tune.lens)}`;

  return (
    <div className={`pathviewer${dim ? ' is-dim' : ''}`}>
      <div
        className="pv-stage"
        ref={stageRef}
        style={{ position: 'relative' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <Canvas
          flat
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={{ fov: focalToFov(init.lens), near: 0.05, far: 800, position: [0, 0, 0] }}
        >
          <Suspense fallback={null}>
            <Stage3D url={model} points={points} path={path} controls={controls} color={color} />
          </Suspense>
        </Canvas>

        {/* Ayuda arriba a la derecha. Es hija del stage (que tiene rueda y
            arrastre propios): HelpOverlay corta esos eventos en nativo. */}
        <HelpOverlay type="path3d" />

        {hint && (
          <div className="pv-hint">
            <span className="pv-hint-dot" /> arrastra para mirar
          </div>
        )}

        {/* Panel de afinado — global (solo se ve con el debug encendido en DEV) */}
        {DEV && (
          <DebugPanel title="afinado · valores para el .txt" copyText={tuneBlock()}>
            <pre className="pv-tune-block">{tuneBlock()}</pre>
            <div className="pv-tune-note">la mirada se actualiza al soltar el arrastre</div>
          </DebugPanel>
        )}
      </div>

      {/* Raíl lateral: altura (arriba = hacia el techo) + Inicio */}
      <div className="pv-rail">
        <span className="pv-rail-cap">techo</span>
        <input
          className="pv-height"
          type="range"
          min={hLo} max={hHi} step="0.01"
          value={ui.height}
          onChange={onHeight}
          aria-label="Altura"
        />
        <span className="pv-val">{ui.height.toFixed(1)}&#8201;m</span>
        <button className="pv-home" onClick={reset} aria-label="Inicio" title="Inicio">⌂</button>
      </div>

      {/* Franja inferior: avance por el arco */}
      <div className="pv-bottom">
        <input
          className="pv-advance"
          type="range"
          min="0" max="1" step="0.001"
          value={ui.advance}
          onChange={onAdvance}
          aria-label="Avance por el recorrido"
        />
        <span className="pv-val">{Math.round(ui.advance * 100)}%</span>
      </div>
    </div>
  );
}
