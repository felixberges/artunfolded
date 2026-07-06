// ObjectViewer.jsx
// Visor 3D de OBJETO (relieve) — a diferencia de ModelViewer (unlit), este SÍ
// se ilumina: MeshStandardMaterial + normal map, con una luz rasante movible
// para revelar el relieve. Pensado para piezas casi planas (relieves, lápidas).
//
// Navegación: PANEO en el plano frontal (perpendicular a la mirada cámara->centro).
// El ratón (y el dedo en táctil) SIEMPRE panea — eye y poi se mueven en paralelo,
// sin excepción de botón ni de modificador. La órbita alrededor del centro es
// EXCLUSIVA de los dos sliders (azimut / altura); nunca se dispara con el ratón.
// Zoom = lente en mm. Gestos sin rueda: botones +/- y pinch.
// Luz: dirección por azimut/elevación, anclada al frente de la pieza. Para moverla,
// activa "Mover luz" — mientras esté activo, los TRES botones del ratón (y el dedo
// en táctil) mueven la luz en vez de panear; al desactivarlo, los tres panean igual.
//
// Coordenadas en el sistema del glB (Y arriba). Datos desde monuments.generated.json:
//   camera: { center:[x,y,z], position:[x,y,z], limitX:[min,max], limitY:[min,max],
//             focal?, focalRange? }
//   light:  { azimuth?, elevation?, intensity?, ambient? }
//   color:  { gain?:[r,g,b], gamma?:[r,g,b] } — corrección de color sobre el albedo
//   options:{ normalMap?, normalStrength?, normalBlur? } — normalMap:false apaga el
//           relieve ('mapa normal'); normalStrength multiplica normalScale ('mapa
//           normal fuerza'); normalBlur difumina en GPU ('mapa normal desenfoque'),
//           radio en texeles, para limar el ruido de grano de la captura

import { Suspense, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, AdaptiveDpr } from '@react-three/drei';
import * as THREE from 'three';
import { KTX2Loader } from 'three-stdlib';
import './objectviewer.css';

const BASIS_PATH = '/basis/';
const DRACO_PATH = '/draco/';
const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// --- Tunables ---
const PAN_SENS = 0.0015;   // m por píxel (paneo); se escala con la distancia/lente
const ZOOM_K = 0.001;      // rueda (multiplicativo)
const ZOOM_BTN = 1.15;     // botón +/-
const LIGHT_SENS = 0.4;    // grados de luz por píxel al arrastrar la luz
// Si el relieve sale HUNDIDO en vez de en resalte, pon a true (invierte el verde
// del normal map -> convención DirectX). Empezamos en false (OpenGL, lo normal).
const FLIP_GREEN = false;
// Exposición e intensidades por defecto (three reciente necesita bastante luz).
const EXPOSURE = 1.3;
const DEF_INTENSITY = 3.0;
const DEF_AMBIENT = 0.35;

// Lente full aperture (Super-35) -> conversión focal(mm) <-> FOV.
const FULL_APERTURE_W = 24.576;
const focalToFovV = (focal, aspect) => {
  const fovH = 2 * Math.atan((FULL_APERTURE_W / 2) / focal);
  return (2 * Math.atan(Math.tan(fovH / 2) / aspect)) / DEG;
};

// KTX2Loader singleton (igual que ModelViewer; evita "Multiple active KTX2 loaders").
let _ktx2 = null;
function getKTX2Loader(gl) {
  if (!_ktx2) _ktx2 = new KTX2Loader().setTranscoderPath(BASIS_PATH);
  _ktx2.detectSupport(gl);
  return _ktx2;
}

// Desenfoque del normal map, EN GPU (render target + blur separable en dos
// pasadas). A diferencia de un <canvas>, esto funciona igual con texturas
// comprimidas (KTX2/UASTC): el sampler de la GPU las descomprime de forma
// transparente al leerlas, así que no necesitamos una imagen "dibujable" en
// CPU (que es justo lo que no hay si el normal map viene comprimido).
// 'radiusPx' = radio del blur en texeles (se acota a 1..8 por el propio bucle
// del shader). Devuelve una textura NUEVA; el original no se toca.
function blurNormalMapGPU(gl, srcTex, radiusPx) {
  const img = srcTex?.image;
  const w = img?.width || 1024;
  const h = img?.height || 1024;
  const radius = Math.min(8, Math.max(1, radiusPx));

  const rtOpts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false };
  const rtA = new THREE.WebGLRenderTarget(w, h, rtOpts);
  const rtB = new THREE.WebGLRenderTarget(w, h, rtOpts);
  const geometry = new THREE.PlaneGeometry(2, 2);

  const blurShader = {
    uniforms: { tDiffuse: { value: null }, texel: { value: new THREE.Vector2(1 / w, 1 / h) }, dir: { value: new THREE.Vector2(1, 0) }, radius: { value: radius } },
    // Vertex directo a NDC: el plano ya cubre [-1,1], no hace falta cámara real.
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
    fragmentShader: `
      precision highp float;
      uniform sampler2D tDiffuse;
      uniform vec2 texel;
      uniform vec2 dir;
      uniform float radius;
      varying vec2 vUv;
      void main() {
        vec4 sum = vec4(0.0);
        float total = 0.0;
        for (int i = -8; i <= 8; i++) {
          float fi = float(i);
          if (abs(fi) > radius) continue;
          sum += texture2D(tDiffuse, vUv + dir * texel * fi);
          total += 1.0;
        }
        gl_FragColor = sum / max(total, 1.0);
      }
    `,
  };
  const matH = new THREE.ShaderMaterial({ ...blurShader, uniforms: THREE.UniformsUtils.clone(blurShader.uniforms), depthTest: false, depthWrite: false });
  const matV = new THREE.ShaderMaterial({ ...blurShader, uniforms: THREE.UniformsUtils.clone(blurShader.uniforms), depthTest: false, depthWrite: false });
  matV.uniforms.dir.value.set(0, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(geometry, matH);
  scene.add(quad);

  const prevTarget = gl.getRenderTarget();

  // Pasada horizontal: srcTex -> rtA
  matH.uniforms.tDiffuse.value = srcTex;
  gl.setRenderTarget(rtA);
  gl.render(scene, camera);

  // Pasada vertical: rtA -> rtB
  quad.material = matV;
  matV.uniforms.tDiffuse.value = rtA.texture;
  gl.setRenderTarget(rtB);
  gl.render(scene, camera);

  gl.setRenderTarget(prevTarget);

  // Limpieza de recursos intermedios (rtB.texture es el resultado, no se toca).
  matH.dispose(); matV.dispose(); geometry.dispose(); rtA.dispose();

  rtB.texture.colorSpace = THREE.NoColorSpace; // dato, no color
  rtB.texture.wrapS = srcTex.wrapS;
  rtB.texture.wrapT = srcTex.wrapT;
  rtB.texture.needsUpdate = true;
  return { texture: rtB.texture, dispose: () => rtB.dispose() };
}

// Modelo iluminado: conserva color + normal map, material mate (piedra).
// 'color' (opcional): { gain:[r,g,b], gamma:[r,g,b] } — corrección sobre el
// albedo ya muestreado (viene del .txt como 'color gain'/'color gamma', horneado
// en monuments.generated.json). Sin corrección si no se especifica (1,1,1).
// 'options.normalMap' (opcional, def. true): a false apaga el relieve del
// normal map para comparar CON/SIN — mismo material, sin esa textura.
// 'options.normalStrength' (opcional, def. 1): multiplicador de normalScale —
// útil para diagnosticar en un extremo (p.ej. 5) si hay señal real en el mapa.
// 'options.normalBlur' (opcional, def. 1): radio de un desenfoque hecho en GPU
// (render target, no toca el .glb ni la textura original) — limar ruido fino
// conservando el relieve grueso. Funciona igual con normal maps comprimidos.
function ReliefModel({ url, color, options }) {
  const gl = useThree((s) => s.gl);
  const { scene } = useGLTF(url, DRACO_PATH, false, (loader) => {
    loader.setKTX2Loader(getKTX2Loader(gl));
  });

  const useNormalMap = options?.normalMap !== false;
  const normalStrength = Number.isFinite(options?.normalStrength) ? options.normalStrength : 1;
  const normalBlur = Number.isFinite(options?.normalBlur) ? options.normalBlur : 1;
  const gain = useMemo(() => new THREE.Vector3(...(color?.gain ?? [1, 1, 1])), [color]);
  const gamma = useMemo(() => new THREE.Vector3(...(color?.gamma ?? [1, 1, 1])), [color]);

  const prepared = useMemo(() => {
    scene.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      const src = obj.material;
      const map = src.map || null;
      const normalMap = useNormalMap ? (src.normalMap || null) : null;
      if (map) map.colorSpace = THREE.SRGBColorSpace;
      if (normalMap) normalMap.colorSpace = THREE.NoColorSpace; // dato, no color

      const mat = new THREE.MeshStandardMaterial({
        map,
        normalMap,
        side: THREE.DoubleSide,
        roughness: 0.95,   // piedra mate
        metalness: 0.0,
      });
      if (normalMap) {
        mat.normalScale = new THREE.Vector2(normalStrength, (FLIP_GREEN ? -1 : 1) * normalStrength);
      }

      // MeshStandardMaterial no tiene uniforms propios para esto -> se inyecta
      // en el fragment shader. gain = multiplicador; gamma = curva (pow(1/gamma),
      // así que gamma>1 aclara medios tonos, gamma<1 los oscurece). Se aplica
      // justo después de muestrear la textura (map_fragment), antes de PBR/luces.
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

      obj.material = mat;
      if (src.dispose) src.dispose();
    });
    return scene;
  }, [scene, gain, gamma, useNormalMap, normalStrength]);

  // Desenfoque del normal map, EN GPU, DESPUÉS del montaje (no durante el
  // render de React): recorre los materiales ya preparados y les sustituye
  // normalMap por la versión difuminada. Con try/catch -> si algo falla (GPU
  // rara, formato inesperado...) se queda con el normal map sin difuminar en
  // vez de tumbar el visor entero. Al limpiar (deps cambian o se desmonta),
  // RESTAURA el normalMap original ANTES de liberar el difuminado -> si bajas
  // 'mapa normal desenfoque' a 1, el material vuelve al mapa nítido, no se
  // queda apuntando a una textura ya liberada.
  useEffect(() => {
    const created = [];   // render targets a limpiar
    const restores = [];  // vuelve cada material a su normalMap original

    if (normalBlur > 1) {
      try {
        prepared.traverse((obj) => {
          if (!obj.isMesh || !obj.material?.normalMap) return;
          const original = obj.material.normalMap;
          const result = blurNormalMapGPU(gl, original, normalBlur);
          created.push(result);
          obj.material.normalMap = result.texture;
          obj.material.needsUpdate = true;
          restores.push(() => { obj.material.normalMap = original; obj.material.needsUpdate = true; });
        });
      } catch (err) {
        console.warn("'mapa normal desenfoque': fallo al difuminar en GPU; se deja el normal map sin difuminar.", err);
      }
    }

    return () => {
      restores.forEach((fn) => fn());
      created.forEach((r) => r.dispose());
    };
  }, [prepared, normalBlur, gl]);

  return <primitive object={prepared} />;
}

// Coloca cámara + paneo en el plano frontal + zoom de lente. La órbita alrededor
// del centro (azimut/altura) es absoluta y solo la disparan los sliders — no hay
// gesto de ratón/dedo que orbite.
// Gestos:
//   Arrastrar (cualquier botón / un dedo)  -> paneo (deslizarse por el relieve)
//   Pinch (cambio de distancia)            -> zoom
//   Rueda                                  -> zoom
// Si moveMode=true, el paneo cede y la luz recibe el gesto.
const ORBIT_MAX_H = 35;   // límite del slider de azimut, en grados (±)
const ORBIT_MAX_V = 25;   // límite del slider de altura, en grados (±)

function PanControls({ center, position, limitX, limitY, focal, focalRange, moveMode, registerReset, registerZoom, registerOrbit }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const moveRef = useRef(moveMode);
  useEffect(() => { moveRef.current = moveMode; }, [moveMode]);

  useEffect(() => {
    const C = new THREE.Vector3(...center);
    const P0 = new THREE.Vector3(...position);
    const el = gl.domElement;
    const aspectNow = () =>
      el.clientWidth && el.clientHeight ? el.clientWidth / el.clientHeight : 1.6;

    // Base ortonormal del plano de paneo.
    const forward0 = C.clone().sub(P0).normalize();
    const worldUp = new THREE.Vector3(0, 1, 0);
    let right0 = new THREE.Vector3().crossVectors(forward0, worldUp);
    if (right0.lengthSq() < 1e-6) right0.set(1, 0, 0);
    right0.normalize();
    const up0 = new THREE.Vector3().crossVectors(right0, forward0).normalize();

    const focalMin = focalRange?.[0] ?? 20;
    const focalMax = focalRange?.[1] ?? 400;
    const lx = limitX || [-1, 1];
    const ly = limitY || [-1, 1];

    let focal0 = clamp(Number.isFinite(focal) ? focal : 50, focalMin, focalMax);
    let f = focal0;

    // Modelo POI (point of interest):
    //   eye    = posición de la cámara
    //   poi    = punto que mira (point of interest)
    // Paneo sin Alt: mueve EYE y POI juntos (traslación pura, misma orientación).
    // Órbita con Alt: mueve solo EYE alrededor de POI.
    let eye = P0.clone();
    let poi = C.clone();

    // right/up del frame inicial (fijos, no cambian).
    // Se usan para el paneo y para calcular la up de la cámara al orbitar.
    const apply = () => {
      camera.position.copy(eye);
      camera.up.copy(up0);
      camera.lookAt(poi);
      camera.fov = focalToFovV(f, aspectNow());
      camera.updateProjectionMatrix();
    };

    const doPan = (dx, dy) => {
      // Traslación pura: mueve eye Y poi en el plano right0/up0.
      const sc = PAN_SENS * eye.distanceTo(poi) * (50 / f);
      const delta = right0.clone().multiplyScalar(-dx * sc)
        .add(up0.clone().multiplyScalar(dy * sc));
      // Límites sobre el poi (el punto de mira no sale del relieve).
      const newPoi = poi.clone().add(delta);
      const dPoi = newPoi.clone().sub(C); // desplazamiento desde centro original
      const px2 = clamp(dPoi.dot(right0), lx[0], lx[1]);
      const py2 = clamp(dPoi.dot(up0), ly[0], ly[1]);
      const clampedDelta = right0.clone().multiplyScalar(px2)
        .add(up0.clone().multiplyScalar(py2));
      const diff = clampedDelta.clone().sub(poi.clone().sub(C));
      eye.add(diff);
      poi.add(diff);
      apply();
    };

    // Rotación de Rodrigues de v alrededor de axis (unitario) por angleRad.
    const rotateAround = (v, axis, angleRad) => {
      const cos = Math.cos(angleRad), sin = Math.sin(angleRad);
      const ax = axis.x, ay = axis.y, az = axis.z;
      const vx = v.x, vy = v.y, vz = v.z;
      return new THREE.Vector3(
        vx*(cos + ax*ax*(1-cos)) + vy*(ax*ay*(1-cos) - az*sin) + vz*(ax*az*(1-cos) + ay*sin),
        vx*(ay*ax*(1-cos) + az*sin) + vy*(cos + ay*ay*(1-cos)) + vz*(ay*az*(1-cos) - ax*sin),
        vx*(az*ax*(1-cos) - ay*sin) + vy*(az*ay*(1-cos) + ax*sin) + vz*(cos + az*az*(1-cos)),
      );
    };

    // Órbita ABSOLUTA alrededor de poi — nunca por arrastre, solo por los sliders.
    // Parte siempre del offset INICIAL fijo (P0-C, no del eye actual): así el
    // ángulo del slider mapea 1:1 a la vista, sin deriva acumulada. Gira alrededor
    // del poi ACTUAL, así que si has paneado antes, el giro sigue centrado donde
    // estás mirando.
    const offset0 = P0.clone().sub(C);
    const setOrbit = (azDeg, elDeg) => {
      const az = clamp(azDeg, -ORBIT_MAX_H, ORBIT_MAX_H) * DEG;
      const el = clamp(elDeg, -ORBIT_MAX_V, ORBIT_MAX_V) * DEG;
      const rotH = rotateAround(offset0, up0, az);
      const rotV = rotateAround(rotH, right0, -el);
      eye.copy(poi.clone().add(rotV));
      apply();
    };
    apply();

    const reset = () => {
      eye.copy(P0); poi.copy(C); f = focal0; apply();
    };
    const unregReset = registerReset?.(reset);
    const setFocal = (nf) => { f = clamp(nf, focalMin, focalMax); apply(); };
    const unregZoom = registerZoom?.((dir) => setFocal(f * (dir > 0 ? ZOOM_BTN : 1 / ZOOM_BTN)));
    const unregOrbit = registerOrbit?.(setOrbit);

    const pointers = new Map();
    let dragging = false, px = 0, py = 0;
    // Estado de dos dedos: solo distancia (zoom). Ya no hay gesto de órbita táctil
    // (antes usaba 'orbitH'/'orbitV', variables que no llegaron a declararse en
    // ningún sitio — un ReferenceError latente en cuanto alguien lo probara).
    let pinchD0 = 0, pinchF0 = f;
    let twoFingerMode = null; // null | 'zoom'

    // Los tres botones del ratón se comportan igual: panean, salvo en modo "Mover
    // luz" (moveMode), donde ceden el gesto entero a RakingLight.
    const wantsControl = (e) => !moveRef.current;

    const down = (e) => {
      if (e.pointerType === 'mouse' && !wantsControl(e)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture?.(e.pointerId);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchD0 = Math.hypot(a.x - b.x, a.y - b.y);
        pinchF0 = f;
        twoFingerMode = null;
        dragging = false;
      } else if (pointers.size === 1) {
        px = e.clientX; py = e.clientY; dragging = true;
      }
    };
    const move = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (!twoFingerMode && Math.abs(d - pinchD0) > 8) twoFingerMode = 'zoom';
        if (twoFingerMode === 'zoom' && pinchD0 > 0) {
          setFocal(pinchF0 * (pinchD0 / d));
        }
        return;
      }

      if (!dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py;
      px = e.clientX; py = e.clientY;
      doPan(dx, dy);
    };
    const upH = (e) => {
      pointers.delete(e.pointerId); el.releasePointerCapture?.(e.pointerId);
      if (pointers.size < 2) { pinchD0 = 0; twoFingerMode = null; }
      if (pointers.size === 0) dragging = false;
      else if (pointers.size === 1) {
        const [p] = [...pointers.values()]; px = p.x; py = p.y; dragging = true;
      }
    };
    const wheel = (e) => { e.preventDefault(); setFocal(f * (1 - e.deltaY * ZOOM_K)); };

    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    window.addEventListener('pointerup', upH);
    el.addEventListener('pointercancel', upH);
    el.addEventListener('wheel', wheel, { passive: false });

    return () => {
      el.style.touchAction = '';
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', upH);
      el.removeEventListener('pointercancel', upH);
      el.removeEventListener('wheel', wheel);
      unregReset?.(); unregZoom?.(); unregOrbit?.();
    };
  }, [center, position, limitX, limitY, focal, focalRange, camera, gl, registerReset, registerZoom, registerOrbit]);

  return null;
}

// Luz rasante: direccional anclada al frente de la pieza (azimut/elevación), movible.
function RakingLight({ center, position, light, moveMode, lightDirRef, registerReset }) {
  const dirRef = useRef();
  const tgtRef = useRef();
  const gl = useThree((s) => s.gl);

  const az0 = Number.isFinite(light?.azimuth) ? light.azimuth : -60;
  const el0 = Number.isFinite(light?.elevation) ? light.elevation : 18;
  const intensity = Number.isFinite(light?.intensity) ? light.intensity : DEF_INTENSITY;
  const ambient = Number.isFinite(light?.ambient) ? light.ambient : DEF_AMBIENT;

  const frame = useMemo(() => {
    const C = new THREE.Vector3(...center);
    const P = new THREE.Vector3(...position);
    const forward = C.clone().sub(P).normalize();
    const worldUp = new THREE.Vector3(0, 1, 0);
    let right = new THREE.Vector3().crossVectors(forward, worldUp);
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    right.normalize();
    const up = new THREE.Vector3().crossVectors(right, forward).normalize();
    return { C, forward, right, up };
  }, [center, position]);

  const azRef = useRef(az0), elRef = useRef(el0);
  const moveRef = useRef(moveMode);
  useEffect(() => { moveRef.current = moveMode; }, [moveMode]);

  const place = () => {
    const lz = dirRef.current, tg = tgtRef.current; if (!lz || !tg) return;
    const az = azRef.current * DEG, ele = elRef.current * DEG;
    // Vector DESDE la pieza HACIA donde está la luz: del lado del observador
    // (-forward = hacia la cámara), desviado por azimut (right) y elevación (up).
    const toLight = frame.forward.clone().multiplyScalar(-1)
      .add(frame.right.clone().multiplyScalar(Math.sin(az) * Math.cos(ele)))
      .add(frame.up.clone().multiplyScalar(Math.sin(ele)))
      .normalize();
    // La luz se coloca en esa dirección, delante de la pieza, y apunta al centro.
    lz.position.copy(frame.C).add(toLight.multiplyScalar(3));
    tg.position.copy(frame.C);
    tg.updateMatrixWorld();
    lz.target = tg;
    // Sincroniza el widget de la bolita.
    if (lightDirRef) lightDirRef.current = { az: azRef.current, el: elRef.current };
  };

  useEffect(() => { azRef.current = az0; elRef.current = el0; place(); /* eslint-disable-next-line */ }, [frame, az0, el0]);

  useEffect(() => {
    const reset = () => { azRef.current = az0; elRef.current = el0; place(); };
    return registerReset?.(reset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, az0, el0, registerReset]);

  // Arrastre de la luz: solo en modo "Mover luz" (moveMode), con cualquier botón.
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false, lx = 0, ly = 0;
    const wantsLight = (e) => moveRef.current;
    const down = (e) => { if (!wantsLight(e)) return; dragging = true; lx = e.clientX; ly = e.clientY; e.preventDefault(); };
    const move = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
      azRef.current = clamp(azRef.current + dx * LIGHT_SENS, -150, 150);
      elRef.current = clamp(elRef.current - dy * LIGHT_SENS, 2, 88);
      place();
    };
    const up = () => { dragging = false; };
    const ctx = (e) => e.preventDefault();
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    el.addEventListener('contextmenu', ctx);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      el.removeEventListener('contextmenu', ctx);
    };
  }, [gl]);

  return (
    <>
      <ambientLight intensity={ambient} />
      <directionalLight ref={dirRef} intensity={intensity} />
      <object3D ref={tgtRef} />
    </>
  );
}

// Widget SVG de la bolita: muestra la dirección de la luz sin Canvas extra
// (evita el WebGL context loss que produce tener dos Canvas en la misma página).
// Usa shading CSS (gradiente radial) para simular el relieve esférico.
function LightBallWidget({ lightDirRef }) {
  const [pos, setPos] = useState({ x: 50, y: 50, r: 38 });

  useEffect(() => {
    let raf;
    const update = () => {
      const az = (lightDirRef.current?.az ?? -60) * DEG;
      const el = (lightDirRef.current?.el ?? 18) * DEG;
      // Proyectamos la dirección de la luz en el plano de pantalla del widget.
      // right = +X de pantalla, up = -Y de pantalla (SVG Y crece hacia abajo).
      const lx = Math.sin(az) * Math.cos(el);
      const ly = -Math.sin(el);
      // Punto de luz: dentro del círculo, offset desde el centro.
      const r = 38;
      setPos({ x: 50 + lx * r * 0.7, y: 50 + ly * r * 0.7, r });
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [lightDirRef]);

  const gid = 'lb-grad';
  return (
    <svg viewBox="0 0 100 100" width="80" height="80" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={gid} cx={pos.x} cy={pos.y} r={pos.r * 1.4} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f5f3ef" />
          <stop offset="55%" stopColor="#c8c4bc" />
          <stop offset="100%" stopColor="#3a3630" />
        </radialGradient>
        <clipPath id="lb-clip"><circle cx="50" cy="50" r="38" /></clipPath>
      </defs>
      <circle cx="50" cy="50" r="38" fill={`url(#${gid})`} clipPath="url(#lb-clip)" />
      <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(233,231,226,0.18)" strokeWidth="1" />
    </svg>
  );
}

export default function ObjectViewer({ model, camera, light, color, options }) {
  const [moveLight, setMoveLight] = useState(false);

  // Ref compartida: RakingLight la escribe en cada place(), LightBall la lee.
  const lightDirRef = useRef({ az: light?.azimuth ?? -60, el: light?.elevation ?? 18 });

  const resetters = useRef(new Set());
  const registerReset = useCallback((fn) => { resetters.current.add(fn); return () => resetters.current.delete(fn); }, []);
  const zoomers = useRef(new Set());
  const registerZoom = useCallback((fn) => { zoomers.current.add(fn); return () => zoomers.current.delete(fn); }, []);
  const doZoom = useCallback((dir) => zoomers.current.forEach((fn) => fn(dir)), []);

  // Órbita de la cámara alrededor del centro: EXCLUSIVA de estos dos sliders
  // (azimut / altura). El ratón nunca orbita, solo panea (ver PanControls).
  const [orbitAz, setOrbitAz] = useState(0);
  const [orbitEl, setOrbitEl] = useState(0);
  const orbiters = useRef(new Set());
  const registerOrbit = useCallback((fn) => { orbiters.current.add(fn); return () => orbiters.current.delete(fn); }, []);
  const setOrbitAll = useCallback((az, el) => orbiters.current.forEach((fn) => fn(az, el)), []);

  // "Inicio" recentra TODO: paneo/zoom (via resetters) y también los sliders de órbita.
  const goHome = useCallback(() => {
    resetters.current.forEach((fn) => fn());
    setOrbitAz(0); setOrbitEl(0); setOrbitAll(0, 0);
  }, [setOrbitAll]);

  const onAzChange = useCallback((e) => {
    const v = parseFloat(e.target.value);
    setOrbitAz(v); setOrbitAll(v, orbitEl);
  }, [orbitEl, setOrbitAll]);
  const onElChange = useCallback((e) => {
    const v = parseFloat(e.target.value);
    setOrbitEl(v); setOrbitAll(orbitAz, v);
  }, [orbitAz, setOrbitAll]);

  const center = camera?.center ?? [0, 0, 0];
  const position = camera?.position ?? [0, 0, 5];
  const initialCam = useMemo(() => ({ position, fov: 45, near: 0.01, far: 5000 }), [position]);

  return (
    <div className="objectviewer">
      <div className="ov-stage">
        <div style={wrapTL}>
          <button type="button" onClick={() => setMoveLight((v) => !v)} style={btn(moveLight)}
            title="Activa para mover la luz arrastrando (con cualquier botón)">
            {moveLight ? 'Moviendo luz' : 'Mover luz'}
          </button>
        </div>
        <div style={wrapTR}>
          <button type="button" onClick={goHome} style={btn(false)} title="Volver a la vista inicial">⌂ Inicio</button>
        </div>

        <Canvas
          dpr={[1, 2]}
          camera={initialCam}
          gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: EXPOSURE }}
        >
          <Suspense fallback={null}>
            <ReliefModel url={model} color={color} options={options} />
          </Suspense>
          <PanControls
            center={center}
            position={position}
            limitX={camera?.limitX}
            limitY={camera?.limitY}
            focal={camera?.focal}
            focalRange={camera?.focalRange}
            moveMode={moveLight}
            registerReset={registerReset}
            registerZoom={registerZoom}
            registerOrbit={registerOrbit}
          />
          <RakingLight
            center={center}
            position={position}
            light={light}
            moveMode={moveLight}
            lightDirRef={lightDirRef}
            registerReset={registerReset}
          />
          <AdaptiveDpr pixelated />
        </Canvas>

        {/* Bolita indicadora de la dirección de la luz — abajo izquierda */}
        <div style={wrapBL} title="Dirección de la luz">
          <LightBallWidget lightDirRef={lightDirRef} />
        </div>

        <div style={wrapBR}>
          <button type="button" onClick={() => doZoom(1)} style={zbtn} title="Acercar" aria-label="Acercar">+</button>
          <button type="button" onClick={() => doZoom(-1)} style={zbtn} title="Alejar" aria-label="Alejar">−</button>
        </div>
      </div>

      {/* Raíl lateral: slider de ALTURA (fuera del lienzo, como en pathviewer) */}
      <div className="ov-rail">
        <span className="ov-rail-cap">altura</span>
        <input
          className="ov-height"
          type="range"
          min={-ORBIT_MAX_V}
          max={ORBIT_MAX_V}
          step={0.5}
          value={orbitEl}
          onChange={onElChange}
          aria-label="Altura de la cámara"
        />
        <span className="ov-val">{orbitEl.toFixed(0)}°</span>
      </div>

      {/* Franja inferior: slider de AZIMUT (fuera del lienzo, como en pathviewer) */}
      <div className="ov-bottom">
        <input
          className="ov-azimuth"
          type="range"
          min={-ORBIT_MAX_H}
          max={ORBIT_MAX_H}
          step={0.5}
          value={orbitAz}
          onChange={onAzChange}
          aria-label="Azimut de la cámara"
        />
        <span className="ov-val">{orbitAz.toFixed(0)}°</span>
      </div>
    </div>
  );
}

// --- estilos inline (coherentes con ModelViewer) ---
const wrapTL = { position: 'absolute', top: 20, left: 20, zIndex: 11, display: 'flex', gap: 6 };
const wrapTR = { position: 'absolute', top: 20, right: 20, zIndex: 11 };
const wrapBL = { position: 'absolute', bottom: 20, left: 20, zIndex: 11, width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '1px solid rgba(233,231,226,0.18)', background: 'rgba(20,18,16,0.55)', backdropFilter: 'blur(6px)' };
const wrapBR = { position: 'absolute', bottom: 20, right: 20, zIndex: 11, display: 'flex', flexDirection: 'column', gap: 6 };
const btn = (active) => ({
  padding: '0.55rem 0.95rem', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem',
  letterSpacing: '0.14em', textTransform: 'uppercase', color: active ? '#e9e7e2' : '#9a9387',
  background: 'rgba(20, 18, 16, 0.72)', border: `1px solid rgba(233, 231, 226, ${active ? 0.25 : 0.12})`,
  borderRadius: 4, cursor: 'pointer', backdropFilter: 'blur(6px)',
});
const zbtn = {
  width: 40, height: 40, fontFamily: "'IBM Plex Mono', monospace", fontSize: '1.2rem', lineHeight: 1,
  color: '#e9e7e2', background: 'rgba(20, 18, 16, 0.72)', border: '1px solid rgba(233, 231, 226, 0.25)',
  borderRadius: 4, cursor: 'pointer', backdropFilter: 'blur(6px)',
};
