import { useEffect, useRef } from "react";
import OpenSeadragon from "openseadragon";

/**
 * Visor de zoom profundo (deep-zoom) basado en OpenSeadragon.
 *
 * OpenSeadragon es imperativo: manipula el DOM directamente, por eso se
 * envuelve en un useEffect con su función de limpieza (destroy).
 *
 * Props:
 *   tileSource — ruta al .dzi (p. ej. "/tiles/farnesina/galatea.dzi")
 *                o un objeto de configuración de tileSource de OpenSeadragon.
 *   height     — altura del contenedor (por defecto "100vh").
 */
export default function DeepZoomViewer({ tileSource, height = "100vh" }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    viewerRef.current = OpenSeadragon({
      element: containerRef.current,
      tileSources: tileSource, // ojo: la opción es plural aunque sea una sola fuente
      // Imágenes de los botones de control (zoom, home, fullscreen).
      // Servidas desde CDN para no tener que copiar nada al repo.
      // Para demos offline: copia esta carpeta a public/ y cambia la ruta.
      prefixUrl:
        "https://cdn.jsdelivr.net/npm/openseadragon@5/build/openseadragon/images/",
      showNavigator: true,
      maxZoomPixelRatio: 2, // permite acercarse más allá del 100% (útil para inspección)
      visibilityRatio: 1,
      gestureSettingsTouch: { pinchToZoom: true }, // soporte táctil para tablet
    });

    return () => {
      // Imprescindible: evita fugas de memoria y visores duplicados
      // (React StrictMode monta el efecto dos veces en desarrollo).
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [tileSource]);

  return <div ref={containerRef} style={{ width: "100%", height }} />;
}
