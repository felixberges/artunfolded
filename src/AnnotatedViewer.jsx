// Visor de zoom profundo (OpenSeadragon) + capa de anotaciones (Fase 3).
// Va en: src/AnnotatedViewer.jsx
//
// Reúne las dos mecánicas del plan (§2.4):
//   · Descubrimiento pasivo: en vista general los marcadores están ocultos;
//     al acercarse a una región (según el zoom) hacen fade-in.
//   · Consulta activa: al pulsar un marcador se abre la ficha en un panel.
// Más un toggle "Información ON/OFF" que oculta la capa SIN tocar el visor,
// de modo que no se pierde ni el zoom ni la posición al cambiar.
//
// Sin anotaciones (annotations = []) se comporta como un visor 2D normal.
//
// Decisión: overlays propios de OpenSeadragon en vez de Annotorious. Las
// anotaciones son contenido de autor (datos), no se dibujan en pantalla; y
// el revelado por zoom + los dos niveles de info salen más limpios atados a
// los eventos de OSD, sin dependencias ni CDN extra (objetivo offline).

import { useEffect, useRef, useState, useCallback } from 'react'
import OpenSeadragon from 'openseadragon'
import './annotations.css'

// Umbrales de revelado, relativos al zoom "home" (la vista que encuadra la
// imagen entera). Por debajo de MIN: ocultos. Entre MIN y MAX: fade-in.
// A partir de MAX: 100 %. Súbelos/bájalos a gusto según cada imagen.
const REVEAL_MIN = 1.3
const REVEAL_MAX = 2.2

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

export default function AnnotatedViewer({
  tileSource,
  annotations = [],
  height = '100vh',
  author = false,
}) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const overlaysRef = useRef([]) // [{ ann, outlineEl, pinEl, rectVp }]
  const infoOnRef = useRef(true)

  const [infoOn, setInfoOn] = useState(true)
  const [selected, setSelected] = useState(null)

  const hasAnnotations = annotations.length > 0

  // El bucle imperativo (eventos OSD) lee el toggle vía ref para no quedar
  // con un valor obsoleto en el closure.
  useEffect(() => {
    infoOnRef.current = infoOn
  }, [infoOn])

  // Recalcula opacidad y "clicabilidad" de cada marcador según zoom y encuadre.
  const refresh = useCallback(() => {
    const viewer = viewerRef.current
    if (!viewer || !viewer.world.getItemAt(0)) return

    const vp = viewer.viewport
    const rel = vp.getZoom(true) / vp.getHomeZoom()
    const bounds = vp.getBounds(true)
    const base = smoothstep(REVEAL_MIN, REVEAL_MAX, rel)

    for (const o of overlaysRef.current) {
      // Visible sólo si: info activada, hemos hecho zoom suficiente y la
      // región está dentro de lo que se ve ahora mismo ("nos acercamos a ella").
      const visible =
        infoOnRef.current && base > 0 && rectsIntersect(bounds, o.rectVp)
      const op = visible ? base : 0
      o.outlineEl.style.opacity = String(op * 0.9)
      o.pinEl.style.opacity = String(op)
      o.pinEl.style.pointerEvents = op > 0.15 ? 'auto' : 'none'
    }
  }, [])

  // Montaje del visor + construcción de overlays.
  useEffect(() => {
    if (!containerRef.current) return

    const viewer = OpenSeadragon({
      element: containerRef.current,
      tileSources: tileSource,
      // Iconos de los controles por CDN (igual que el visor 2D original).
      // Pendiente de localizar para demos offline (paso 3 del roadmap).
      prefixUrl:
        'https://cdn.jsdelivr.net/npm/openseadragon@5/build/openseadragon/images/',
      showNavigator: true,
      navigatorPosition: 'BOTTOM_RIGHT', // libera la esquina sup-der para el toggle
      maxZoomPixelRatio: 2,
      visibilityRatio: 1,
      gestureSettingsTouch: { pinchToZoom: true },
    })
    viewerRef.current = viewer

    function buildOverlays() {
      const item = viewer.world.getItemAt(0)
      if (!item) return
      const size = item.getContentSize() // { x: W, y: H } en píxeles

      overlaysRef.current = annotations.map((ann) => {
        const rectPx = new OpenSeadragon.Rect(
          ann.x * size.x,
          ann.y * size.y,
          ann.w * size.x,
          ann.h * size.y
        )
        const rectVp = viewer.viewport.imageToViewportRectangle(rectPx)

        // 1) Contorno de la región — escala con el zoom (enmarca el elemento).
        const outlineEl = document.createElement('div')
        outlineEl.className = 'au-anno-outline'
        outlineEl.style.opacity = '0'
        viewer.addOverlay({ element: outlineEl, location: rectVp })

        // 2) Pin — tamaño fijo en pantalla, centrado en la región.
        const pinEl = document.createElement('button')
        pinEl.type = 'button'
        pinEl.className = 'au-anno-pin'
        pinEl.style.opacity = '0'
        pinEl.setAttribute('aria-label', ann.title)
        pinEl.innerHTML =
          '<span class="au-anno-dot"></span>' +
          `<span class="au-anno-label">${ann.title}</span>`
        pinEl.addEventListener('click', (e) => {
          e.stopPropagation()
          setSelected(ann)
        })
        viewer.addOverlay({
          element: pinEl,
          location: rectVp.getCenter(),
          placement: OpenSeadragon.Placement.CENTER,
        })

        return { ann, outlineEl, pinEl, rectVp }
      })

      refresh()
    }

    viewer.addHandler('open', buildOverlays)
    viewer.addHandler('animation', refresh)
    viewer.addHandler('zoom', refresh)
    viewer.addHandler('pan', refresh)

    // Modo autor: imprime en consola las fracciones del punto pulsado, para
    // colocar regiones sobre la imagen real. Para una región: clic en la
    // esquina sup-izq y en la inf-der → w = x2-x1, h = y2-y1.
    function onAuthorClick(event) {
      const item = viewer.world.getItemAt(0)
      if (!item) return
      const size = item.getContentSize()
      const vpPoint = viewer.viewport.pointFromPixel(event.position)
      const img = viewer.viewport.viewportToImageCoordinates(vpPoint)
      // eslint-disable-next-line no-console
      console.log(
        `[anotación] x: ${(img.x / size.x).toFixed(3)}, y: ${(
          img.y / size.y
        ).toFixed(3)}`
      )
    }
    if (author) viewer.addHandler('canvas-click', onAuthorClick)

    return () => {
      // destroy() ya retira los handlers y los overlays.
      viewer.destroy()
      viewerRef.current = null
      overlaysRef.current = []
    }
  }, [tileSource, annotations, author, refresh])

  // Al cambiar el toggle: recalcula y, si se apaga, cierra el panel.
  useEffect(() => {
    refresh()
    if (!infoOn) setSelected(null)
  }, [infoOn, refresh])

  // Cerrar el panel con Escape.
  useEffect(() => {
    if (!selected) return
    const onKey = (e) => {
      if (e.key === 'Escape') setSelected(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {hasAnnotations && (
        <button
          className="au-anno-toggle"
          onClick={() => setInfoOn((v) => !v)}
          aria-pressed={infoOn}
        >
          Información · {infoOn ? 'ON' : 'OFF'}
        </button>
      )}

      {selected && (
        <aside
          className="au-anno-panel"
          role="dialog"
          aria-label={selected.title}
        >
          <button
            className="au-anno-panel-close"
            onClick={() => setSelected(null)}
            aria-label="Cerrar ficha"
          >
            ✕
          </button>
          <p className="au-anno-panel-eyebrow">Elemento</p>
          <h2 className="au-anno-panel-title">{selected.title}</h2>
          {selected.place && (
            <p className="au-anno-panel-place">{selected.place}</p>
          )}
          <p className="au-anno-panel-body">{selected.body}</p>
        </aside>
      )}
    </div>
  )
}
