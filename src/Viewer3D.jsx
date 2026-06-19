import { Suspense } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import {
  useGLTF,
  OrbitControls,
  Bounds,
  Center,
  Html,
  AdaptiveDpr,
  Stats,
} from '@react-three/drei'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { REVISION } from 'three'

/* ------------------------------------------------------------------
   Visor 3D aislado — Fase 2.
   Carga un .glb (Draco para geometría + KTX2 para texturas) y permite
   rotar / zoom / desplazar con ratón y con dedos en tablet.

   Uso:  <Viewer3D src="/models/galatea/galatea.glb" />
   El .glb debe vivir bajo public/ (igual que los tiles del visor 2D).
------------------------------------------------------------------ */

/* KTX2Loader como singleton: drei NO configura KTX2 en useGLTF por su
   cuenta, y crear uno nuevo por modelo dispara el aviso de
   "multiple active KTX2 loaders". El transcoder se sirve por CDN para
   la prueba; en producción conviene alojarlo en /public/basis/. */
let _ktx2
function ktx2For(gl) {
  if (!_ktx2) {
    _ktx2 = new KTX2Loader().setTranscoderPath(
      `https://www.unpkg.com/three@0.${REVISION}.x/examples/jsm/libs/basis/`
    )
  }
  _ktx2.detectSupport(gl)
  return _ktx2
}

function Model({ src }) {
  const { gl } = useThree()
  // (src, useDraco, useMeshOpt, extendLoader)
  const { scene } = useGLTF(src, true, true, (loader) => {
    loader.setKTX2Loader(ktx2For(gl))
  })
  return <primitive object={scene} />
}

function Loading() {
  return (
    <Html center>
      <div
        style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.72rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#6b6358',
          whiteSpace: 'nowrap',
        }}
      >
        Cargando modelo…
      </div>
    </Html>
  )
}

export default function Viewer3D({ src, showStats = true }) {
  return (
    <Canvas
      dpr={[1, 2]} // tope de resolución: evita malgastar en pantallas retina
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 4], fov: 45, near: 0.01, far: 1000 }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      {/* fondo neutro: el modelo lee mejor que sobre blanco puro */}
      <color attach="background" args={['#e9e7e2']} />

      {/* luz plana y neutra para textura baked (sin doble sombreado) */}
      <ambientLight intensity={0.85} />
      <hemisphereLight intensity={0.5} groundColor="#b9b4ab" />
      <directionalLight position={[3, 5, 4]} intensity={0.45} />

      <Suspense fallback={<Loading />}>
        {/* auto-encuadra el modelo venga con la escala/posición que venga */}
        <Bounds fit clip observe margin={1.15}>
          <Center>
            <Model src={src} />
          </Center>
        </Bounds>
      </Suspense>

      {/* makeDefault: necesario para que <Bounds> controle esta cámara.
          OrbitControls ya trae gestos táctiles: 1 dedo rota, 2 dedos
          desplazan/zoom (pinch). */}
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />

      {/* baja la resolución mientras se mueve el modelo → más fluido en tablet */}
      <AdaptiveDpr pixelated />

      {/* lectura de FPS para validar el hito en tablet. Quítalo al cerrar la fase. */}
      {showStats && <Stats />}
    </Canvas>
  )
}
