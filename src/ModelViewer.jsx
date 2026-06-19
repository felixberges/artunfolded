import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Bounds } from '@react-three/drei'
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js'
import { REVISION } from 'three'

// KTX2Loader como singleton: drei no configura KTX2 en useGLTF por su cuenta,
// y crear uno por modelo dispara el aviso de "multiple active KTX2 loaders".
// El transcoder (Basis) se sirve por CDN para online; para demos OFFLINE hay
// que alojarlo en /public/basis/ y cambiar la ruta (paso 3 del roadmap).
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

// Carga el modelo (Draco en geometría + KTX2 en texturas) y sustituye sus
// materiales por MeshBasicMaterial, de modo que la textura horneada (albedo
// sRGB) se muestra tal cual, sin que ninguna luz de escena la altere. Ideal
// para inspección fiel del color en fotogrametría de pintura / arquitectura.
function Model({ url }) {
  const { gl } = useThree()
  // (url, useDraco, useMeshOpt, extendLoader) → añadimos el loader de KTX2
  const { scene } = useGLTF(url, true, true, (loader) => {
    loader.setKTX2Loader(ktx2For(gl))
  })

  useMemo(() => {
    scene.traverse((o) => {
      if (o.isMesh && o.material?.map) {
        // El map conserva su colorSpace (sRGB para baseColor), así que el
        // color se mantiene 1:1 al pasar a MeshBasicMaterial.
        o.material = new THREE.MeshBasicMaterial({ map: o.material.map })
      }
    })
  }, [scene])

  return <primitive object={scene} />
}

// `flat` desactiva el tone mapping (color 1:1).
// `Bounds` encuadra y centra el modelo automáticamente.
export default function ModelViewer({ url = '/models/trastevere/trastevere.glb' }) {
  return (
    <Canvas
      flat
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ width: '100%', height: '100vh' }}
    >
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.2}>
          <Model url={url} />
        </Bounds>
      </Suspense>
      <OrbitControls makeDefault />
    </Canvas>
  )
}
