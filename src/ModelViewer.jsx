// ModelViewer.jsx
// Visor 3D "unlit" para fotogrametría (albedo horneado).
// Render: MeshBasicMaterial + THREE.DoubleSide, sin luces (Canvas flat).
// Soporta texturas KTX2 (KHR_texture_basisu) vía KTX2Loader, y geometría Draco.
//
// DOS MODOS DE CÁMARA (prop `camera`, viene de monuments.generated.json):
//   · Órbita: OrbitControls. Si camera.orbit trae eye/target/fov, arranca ahí;
//     si no hay datos de cámara, usa el auto-encuadre (Bounds + Center) de antes.
//   · Eye-level: cámara CLAVADA en camera.eyeLevel.eye, mira a 'target' de inicio.
//     Arrastrar = pan/tilt (offsets sobre la mirada inicial, con topes).
//     Rueda = FOV. Solo aparece el toggle si camera.eyeLevel existe.
//
// IMPORTANTE: si hay datos de cámara, el modelo se renderiza en SUS coordenadas
// reales (sin Center/Bounds): eye/target están en el espacio del modelo (Blender),
// así que recentrar la malla descuadraría esas coordenadas.

import { Suspense, useMemo, useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF, Bounds, Center, AdaptiveDpr, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { KTX2Loader } from 'three-stdlib'; // misma fuente que usa drei internamente

// --- Rutas de decodificadores (offline-first) --------------------------------
const BASIS_PATH = '/basis/';
const DRACO_PATH = '/draco/';

// KTX2Loader como SINGLETON: evita el warning "Multiple active KTX2 loaders"
// y reutiliza el WASM del transcoder entre montajes.
let _ktx2 = null;
function getKTX2Loader(gl) {
  if (!_ktx2) {
    _ktx2 = new KTX2Loader().setTranscoderPath(BASIS_PATH);
  }
  _ktx2.detectSupport(gl);
  return _ktx2;
}

function Model({ url }) {
  const gl = useThree((s) => s.gl);

  const { scene } = useGLTF(
    url,
    DRACO_PATH, // useDraco: ruta (o true para CDN). Inofensivo si el .glb no lleva Draco.
    false,      // useMeshOpt
    (loader) => {
      // engancha el KTX2Loader ANTES de parsear las texturas basis
      loader.setKTX2Loader(getKTX2Loader(gl));
    }
  );

  // Conversión a unlit: la iluminación ya está horneada en el albedo.
  const prepared = useMemo(() => {
    scene.traverse((obj) => {
      if (!obj.isMesh) return;
      const src = obj.material;
      const map = src && src.map ? src.map : null;
      if (map) {
        map.colorSpace = THREE.SRGBColorSpace;
        obj.material = new THREE.MeshBasicMaterial({
          map,
          side: THREE.DoubleSide,
          transparent: !!src.transparent,
          alphaTest: src.alphaTest || 0,
        });
        if (src.dispose) src.dispose();
      } else if (src) {
        src.side = THREE.DoubleSide;
      }
    });
    return scene;
  }, [scene]);

  return <primitive object={prepared} />;
}

// =============================================================================
// Control EYE-LEVEL: cámara fija en 'eye', giro acotado (pan/tilt), rueda = FOV.
// =============================================================================
const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Sensibilidad y signos (si algún eje gira al revés, cambia el signo a -1).
const DRAG_SENS = 0.0025; // rad por píxel arrastrado
const ZOOM_K = 0.001;     // paso de zoom de la rueda (multiplicativo, ~10%/muesca)
const PAN_SIGN = 1;
const TILT_SIGN = 1;

// "No ver fuera del monumento": pan/tilt definen la EXTENSIÓN angular del
// monumento desde el ojo (hasta dónde hay geometría). El límite de la mirada es
// ese borde menos medio FOV -> el borde del encuadre nunca se sale. Margen extra
// opcional (grados) por si los bordes de la fotogrametría están deshilachados.
const EDGE_MARGIN_DEG = 0;
// Paso de zoom por pulsación de botón (+/-): factor de lente y de dolly.
const ZOOM_BTN = 1.15;
const ORBIT_DOLLY = 1.15;

// Ancho "full aperture" (Super-35 / cine), en mm. Referencia para la focal.
const FULL_APERTURE_W = 24.576;
// focal(mm) <-> FOV: la focal se mide sobre el FOV HORIZONTAL (ancho del gate).
const focalToFovV = (focal, aspect) => {
  const fovH = 2 * Math.atan((FULL_APERTURE_W / 2) / focal);
  return (2 * Math.atan(Math.tan(fovH / 2) / aspect)) / DEG; // three usa FOV vertical
};
const fovVToFocal = (fovV, aspect) => {
  const fovH = 2 * Math.atan(Math.tan((fovV * DEG) / 2) * aspect);
  return (FULL_APERTURE_W / 2) / Math.tan(fovH / 2);
};

// Dirección unitaria a partir de yaw (horizontal) y pitch (vertical).
// Con yaw=0,pitch=0 mira hacia -Z; pitch>0 mira hacia arriba.
function dirFromYawPitch(yaw, pitch) {
  const cp = Math.cos(pitch);
  return new THREE.Vector3(Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp);
}

function EyeLevelControls({ eye, target, pan, tilt, focal: initialFocal, focalRange, registerReset, registerZoom }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    const E = new THREE.Vector3(eye[0], eye[1], eye[2]);
    const T = target
      ? new THREE.Vector3(target[0], target[1], target[2])
      : new THREE.Vector3(eye[0], eye[1], eye[2] - 1);

    // Mirada inicial (yaw0/pitch0) = dirección eye -> target.
    const d = T.clone().sub(E).normalize();
    const pitch0 = Math.asin(clamp(d.y, -1, 1));
    const yaw0 = Math.atan2(d.x, -d.z);

    // Bordes del monumento (extensión angular desde el ojo), en radianes.
    const panMinEdge = (pan?.[0] ?? -180) * DEG;
    const panMaxEdge = (pan?.[1] ?? 180) * DEG;
    const tiltMinEdge = (tilt?.[0] ?? -89) * DEG;
    const tiltMaxEdge = (tilt?.[1] ?? 89) * DEG;
    const margin = EDGE_MARGIN_DEG * DEG;

    // Zoom en MILÍMETROS de lente (no en grados). Rango y lente inicial en mm.
    const el = gl.domElement;
    const aspectNow = () =>
      el.clientWidth && el.clientHeight ? el.clientWidth / el.clientHeight : 1.6;
    const focalMin = focalRange?.[0] ?? 12;
    const focalMax = focalRange?.[1] ?? 400;
    const focal0 = clamp(Number.isFinite(initialFocal) ? initialFocal : 35, focalMin, focalMax);
    let focal = focal0;

    // Medio FOV actual (h y v) a partir de la lente y el aspect.
    const halfFov = () => {
      const fovV = camera.fov * DEG;
      const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspectNow());
      return { h: fovH / 2, v: fovV / 2 };
    };
    // Límites de la MIRADA = borde del monumento - medio FOV (+ margen). Si el
    // FOV no cabe en el monumento, se bloquea en el centro.
    const curLimits = () => {
      const { h, v } = halfFov();
      let pMin = panMinEdge + h + margin, pMax = panMaxEdge - h - margin;
      if (pMin > pMax) { const m = (panMinEdge + panMaxEdge) / 2; pMin = pMax = m; }
      let tMin = tiltMinEdge + v + margin, tMax = tiltMaxEdge - v - margin;
      if (tMin > tMax) { const m = (tiltMinEdge + tiltMaxEdge) / 2; tMin = tMax = m; }
      return { pMin, pMax, tMin, tMax };
    };

    // Cámara clavada en el ojo + lente inicial.
    camera.position.copy(E);
    camera.fov = focalToFovV(focal, aspectNow());
    camera.updateProjectionMatrix();

    let yawOff = 0, pitchOff = 0;
    const apply = () => {
      const L = curLimits();
      const yaw = yaw0 + clamp(yawOff, L.pMin, L.pMax);
      const pitch = pitch0 + clamp(pitchOff, L.tMin, L.tMax);
      const dir = dirFromYawPitch(yaw, pitch);
      camera.lookAt(E.x + dir.x, E.y + dir.y, E.z + dir.z);
    };
    apply();

    // Aplica un cambio de lente y re-acota pan/tilt (los topes dependen del FOV).
    const setFocal = (f) => {
      focal = clamp(f, focalMin, focalMax);
      camera.fov = focalToFovV(focal, aspectNow());
      camera.updateProjectionMatrix();
      const L = curLimits();
      yawOff = clamp(yawOff, L.pMin, L.pMax);
      pitchOff = clamp(pitchOff, L.tMin, L.tMax);
      apply();
    };

    // Vuelta a inicio: pan/tilt a 0 y lente de partida.
    const unregister = registerReset?.(() => {
      yawOff = 0; pitchOff = 0; focal = focal0;
      camera.position.copy(E);
      camera.fov = focalToFovV(focal, aspectNow());
      camera.updateProjectionMatrix();
      apply();
    });

    // Zoom por botones +/- : un paso = factor ZOOM_BTN.
    const unregisterZoom = registerZoom?.((dir) => setFocal(focal * (dir > 0 ? ZOOM_BTN : 1 / ZOOM_BTN)));

    // --- Gestos: 1 dedo/ratón = pan/tilt; 2 dedos = pinch (zoom de lente) ---
    const pointers = new Map(); // pointerId -> {x,y}
    let dragging = false, lx = 0, ly = 0;
    let pinchDist0 = 0, pinchFocal0 = focal;

    const down = (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture?.(e.pointerId);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist0 = Math.hypot(a.x - b.x, a.y - b.y);
        pinchFocal0 = focal;
        dragging = false; // un pinch no arrastra
      } else if (pointers.size === 1) {
        lx = e.clientX; ly = e.clientY; dragging = true;
      }
    };
    const move = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist0 > 0) setFocal(pinchFocal0 * (dist / pinchDist0)); // separar dedos = tele
        return;
      }
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      const L = curLimits();
      yawOff = clamp(yawOff + PAN_SIGN * dx * DRAG_SENS, L.pMin, L.pMax);
      pitchOff = clamp(pitchOff + TILT_SIGN * -dy * DRAG_SENS, L.tMin, L.tMax);
      apply();
    };
    const up = (e) => {
      pointers.delete(e.pointerId);
      el.releasePointerCapture?.(e.pointerId);
      if (pointers.size < 2) pinchDist0 = 0;
      if (pointers.size === 0) dragging = false;
      else if (pointers.size === 1) { // reanudar arrastre con el dedo que queda
        const [p] = [...pointers.values()];
        lx = p.x; ly = p.y; dragging = true;
      }
    };
    const wheel = (e) => {
      e.preventDefault();
      // muesca arriba (deltaY<0) -> más mm (tele); abajo -> menos mm (gran angular)
      setFocal(focal * (1 - e.deltaY * ZOOM_K));
    };

    el.style.cursor = 'grab';
    el.style.touchAction = 'none'; // evita que el navegador robe el gesto
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });

    return () => {
      el.style.cursor = '';
      el.style.touchAction = '';
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
      unregister?.();
      unregisterZoom?.();
    };
  }, [eye, target, pan, tilt, initialFocal, focalRange, camera, gl, registerReset, registerZoom]);

  return null;
}

// Fija posición y lente inicial de la cámara (modo órbita). focal en mm; si no,
// fov en grados.
function ApplyCamera({ position, focal, fov }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  useLayoutEffect(() => {
    if (position) camera.position.set(position[0], position[1], position[2]);
    const el = gl.domElement;
    const aspect = el.clientWidth && el.clientHeight ? el.clientWidth / el.clientHeight : 1.6;
    if (Number.isFinite(focal)) camera.fov = focalToFovV(focal, aspect);
    else if (Number.isFinite(fov)) camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [camera, gl, position, focal, fov]);
  return null;
}

// Vuelta a inicio en órbita + zoom por botones (dolly).
function OrbitHome({ eye, target, registerReset, registerZoom }) {
  const camera = useThree((s) => s.camera);
  const get = useThree((s) => s.get); // lectura perezosa: controls puede no existir aún
  useEffect(() => {
    const reset = () => {
      if (eye) camera.position.set(eye[0], eye[1], eye[2]);
      const controls = get().controls;
      if (controls && target) {
        controls.target.set(target[0], target[1], target[2]);
        controls.update();
      } else if (target) {
        camera.lookAt(target[0], target[1], target[2]);
      }
    };
    // Dolly por botones: acerca/aleja la cámara hacia el objetivo de órbita.
    const zoom = (dir) => {
      const controls = get().controls;
      const tgt = controls
        ? controls.target
        : new THREE.Vector3(target?.[0] ?? 0, target?.[1] ?? 0, target?.[2] ?? 0);
      const offset = camera.position.clone().sub(tgt);
      offset.multiplyScalar(dir > 0 ? 1 / ORBIT_DOLLY : ORBIT_DOLLY); // + = acercar
      camera.position.copy(tgt).add(offset);
      controls?.update();
    };
    const u1 = registerReset?.(reset);
    const u2 = registerZoom?.(zoom);
    return () => { u1?.(); u2?.(); };
  }, [camera, get, eye, target, registerReset, registerZoom]);
  return null;
}

// Lee la cámara cada frame y reporta {focal, fovH, fovV} al exterior.
function CameraReadout({ onChange }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const last = useRef('');
  useFrame(() => {
    const fovV = camera.fov;
    const aspect = size.width / size.height;
    const fovH = (2 * Math.atan(Math.tan((fovV * DEG) / 2) * aspect)) / DEG;
    const focal = fovVToFocal(fovV, aspect);
    // Evita re-render si nada cambió de forma apreciable.
    const key = `${focal.toFixed(1)}|${fovH.toFixed(1)}|${fovV.toFixed(1)}`;
    if (key !== last.current) {
      last.current = key;
      onChange({ focal, fovH, fovV });
    }
  });
  return null;
}

export default function ModelViewer({ model, options, camera }) {
  // `model` = URL pública del .glb. `camera` = { orbit?, eyeLevel? } o undefined.
  const hasCamera = !!camera;
  const hasEye = !!camera?.eyeLevel;
  const [mode, setMode] = useState('orbit'); // 'orbit' | 'eye'
  const [readout, setReadout] = useState(null); // { focal, fovH, fovV }

  // Registro de funciones "volver a inicio": cada control montado registra la
  // suya; el botón Inicio llama a todas las del modo activo.
  const resettersRef = useRef(new Set());
  const registerReset = useCallback((fn) => {
    resettersRef.current.add(fn);
    return () => resettersRef.current.delete(fn);
  }, []);
  const goHome = useCallback(() => {
    resettersRef.current.forEach((fn) => fn());
  }, []);

  // Registro de zoom (+/-): cada control montado registra su paso (lente o dolly).
  const zoomersRef = useRef(new Set());
  const registerZoom = useCallback((fn) => {
    zoomersRef.current.add(fn);
    return () => zoomersRef.current.delete(fn);
  }, []);
  const doZoom = useCallback((dir) => {
    zoomersRef.current.forEach((fn) => fn(dir));
  }, []);

  // Cámara de órbita: explícita si se dio; si no, cae a la del eye-level; si no, default.
  const orbitEye = camera?.orbit?.eye ?? camera?.eyeLevel?.eye ?? null;
  const orbitTarget = camera?.orbit?.target ?? camera?.eyeLevel?.target ?? [0, 0, 0];
  const orbitFocal = camera?.orbit?.focal ?? null;                 // lente inicial (mm)
  const orbitFov = camera?.orbit?.fov ?? 45;                       // compat (grados)

  const initialCam = useMemo(
    () => ({
      position: orbitEye ?? [0, 0, 4],
      fov: orbitFov,
      near: 0.01,
      far: 5000,
    }),
    // Identidad estable: solo cambia si cambian los datos de cámara del monumento.
    [orbitEye, orbitFov]
  );

  const eyeMode = hasEye && mode === 'eye';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {hasEye && (
        <div className="model-mode-toggle" style={toggleWrapStyle}>
          <button
            type="button"
            onClick={() => setMode('orbit')}
            aria-pressed={mode === 'orbit'}
            style={toggleBtnStyle(mode === 'orbit')}
          >
            Órbita
          </button>
          <button
            type="button"
            onClick={() => setMode('eye')}
            aria-pressed={mode === 'eye'}
            style={toggleBtnStyle(mode === 'eye')}
          >
            Eye-level
          </button>
        </div>
      )}

      {hasCamera && (
        <div className="model-home" style={homeWrapStyle}>
          <button type="button" onClick={goHome} style={toggleBtnStyle(false)} title="Volver a la posición inicial">
            ⌂ Inicio
          </button>
        </div>
      )}

      <Canvas flat dpr={[1, 2]} camera={initialCam}>
        <Suspense fallback={null}>
          {hasCamera ? (
            // Coordenadas reales del modelo (sin recentrar): eye/target son world-space.
            <Model url={model} />
          ) : (
            <Bounds fit clip observe margin={1.1}>
              <Center>
                <Model url={model} />
              </Center>
            </Bounds>
          )}
        </Suspense>

        {eyeMode ? (
          <EyeLevelControls {...camera.eyeLevel} registerReset={registerReset} registerZoom={registerZoom} />
        ) : (
          <>
            {hasCamera && <ApplyCamera key={mode} position={orbitEye} focal={orbitFocal} fov={orbitFov} />}
            {hasCamera && <OrbitHome eye={orbitEye} target={orbitTarget} registerReset={registerReset} registerZoom={registerZoom} />}
            {/* Órbita libre: rotación completa y rueda = dolly, sin topes. */}
            <OrbitControls makeDefault enableDamping target={orbitTarget} />
          </>
        )}

        <AdaptiveDpr pixelated />
        <CameraReadout onChange={setReadout} />
      </Canvas>

      {hasCamera && (
        <div className="model-zoom" style={zoomWrapStyle}>
          <button type="button" onClick={() => doZoom(1)} style={zoomBtnStyle} title="Acercar" aria-label="Acercar">+</button>
          <button type="button" onClick={() => doZoom(-1)} style={zoomBtnStyle} title="Alejar" aria-label="Alejar">−</button>
        </div>
      )}

      {readout && (
        <div className="model-cam-hud" style={hudStyle}>
          <span><b style={hudValStyle}>{readout.focal.toFixed(0)}</b> mm</span>
          <span style={hudDimStyle}>FOV {readout.fovH.toFixed(0)}° × {readout.fovV.toFixed(0)}°</span>
        </div>
      )}
    </div>
  );
}

// --- Estilos del toggle (inline para no depender de CSS externo) -------------
const toggleWrapStyle = {
  position: 'absolute',
  top: 20,
  left: 20,
  zIndex: 11,
  display: 'flex',
  gap: 6,
};
const homeWrapStyle = {
  position: 'absolute',
  top: 20,
  right: 20,
  zIndex: 11,
};
const zoomWrapStyle = {
  position: 'absolute',
  bottom: 20,
  right: 20,
  zIndex: 11,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};
const zoomBtnStyle = {
  width: 40,
  height: 40,
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '1.2rem',
  lineHeight: 1,
  color: '#e9e7e2',
  background: 'rgba(20, 18, 16, 0.72)',
  border: '1px solid rgba(233, 231, 226, 0.25)',
  borderRadius: 4,
  cursor: 'pointer',
  backdropFilter: 'blur(6px)',
};
const toggleBtnStyle = (active) => ({
  padding: '0.55rem 0.95rem',
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.72rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: active ? '#e9e7e2' : '#9a9387',
  background: 'rgba(20, 18, 16, 0.72)',
  border: `1px solid rgba(233, 231, 226, ${active ? 0.25 : 0.12})`,
  borderRadius: 4,
  cursor: 'pointer',
  backdropFilter: 'blur(6px)',
});

// HUD inferior con los datos de cámara (provisional).
const hudStyle = {
  position: 'absolute',
  bottom: 20,
  left: 20,
  zIndex: 11,
  display: 'flex',
  alignItems: 'baseline',
  gap: 14,
  padding: '0.5rem 0.85rem',
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.72rem',
  letterSpacing: '0.08em',
  color: '#e9e7e2',
  background: 'rgba(20, 18, 16, 0.72)',
  border: '1px solid rgba(233, 231, 226, 0.18)',
  borderRadius: 4,
  backdropFilter: 'blur(6px)',
  pointerEvents: 'none',
};
const hudValStyle = { fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.02em' };
const hudDimStyle = { color: '#9a9387' };

// Opcional: precarga para arrancar la descarga antes de montar el visor.
// useGLTF.preload('/models/trastevere/trastevere.glb', DRACO_PATH);

// =============================================================================
// NOTA — decodificadores en public/ (modo offline). El .glb requiere
// KHR_texture_basisu, así que el transcoder basis es OBLIGATORIO en public/basis/.
//   mkdir public\basis ; copy node_modules\three\examples\jsm\libs\basis\*  public\basis\
//   mkdir public\draco ; copy node_modules\three\examples\jsm\libs\draco\*  public\draco\
// =============================================================================
