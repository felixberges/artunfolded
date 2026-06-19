// App raíz: navegación por estado, sin router.
// Va en: src/App.jsx  (capital A — Vercel distingue mayúsculas)
//
// - Sin monumento seleccionado → muestra la galería (el "archivo").
// - Al pulsar una lámina → abre el visor que corresponda según `kind`:
//     "2d" → AnnotatedViewer (OpenSeadragon + capa de anotaciones)
//     "3d" → ModelViewer (react-three-fiber)
//   con un botón "← Archivo" superpuesto para volver.

import { useState } from 'react'
import { monuments } from './monuments'
import Gallery from './Gallery'
import AnnotatedViewer from './AnnotatedViewer'
import ModelViewer from './ModelViewer'
import { annotationsFor } from './data/annotations'

// Modo autor: abre la web con ?author=1 y, al hacer clic sobre el visor 2D,
// la consola imprime las coordenadas (en fracciones de imagen) del punto.
// Sirve para colocar las regiones de las anotaciones sin adivinar.
const AUTHOR =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).has('author')

export default function App() {
  const [selectedId, setSelectedId] = useState(null)
  const selected = monuments.find((m) => m.id === selectedId)

  // Vista de archivo (portada)
  if (!selected) {
    return <Gallery monuments={monuments} onSelect={setSelectedId} />
  }

  // Vista de visor (un monumento abierto)
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <button
        onClick={() => setSelectedId(null)}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          padding: '0.55rem 0.95rem',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '0.72rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#e9e7e2',
          background: 'rgba(20, 18, 16, 0.72)',
          border: '1px solid rgba(233, 231, 226, 0.25)',
          borderRadius: 4,
          cursor: 'pointer',
          backdropFilter: 'blur(6px)',
        }}
      >
        ← Archivo
      </button>

      {selected.kind === '3d' ? (
        <ModelViewer url={selected.model} />
      ) : (
        <AnnotatedViewer
          tileSource={selected.tileSource}
          annotations={annotationsFor(selected.id)}
          author={AUTHOR}
        />
      )}
    </div>
  )
}
