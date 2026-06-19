import { useState } from "react";
import { monuments } from "./monuments";
import Gallery from "./Gallery";
import DeepZoomViewer from "./DeepZoomViewer";
import Viewer3D from "./Viewer3D";
import "./styles.css";

// Navegación por estado, sin router: una sola vista activa a la vez.
// Suficiente para el prototipo y funciona offline y en Vercel sin configurar
// reescrituras de SPA. Si más adelante quieres URLs (/galatea), se cambia
// por react-router sin tocar Gallery ni los visores.

export default function App() {
  const [activeId, setActiveId] = useState(null);
  const active = monuments.find((m) => m.id === activeId) || null;

  if (!active) {
    return <Gallery monuments={monuments} onSelect={setActiveId} />;
  }

  return (
    <div className="viewer-screen">
      <header className="viewer-bar">
        <button className="back" onClick={() => setActiveId(null)}>
          <span aria-hidden="true">←</span> Archivo
        </button>
        <div className="viewer-label">
          <span className="viewer-plate">Lámina {active.plate}</span>
          <span className="viewer-title">{active.title}</span>
        </div>
      </header>

      {active.kind === "3d" ? (
        // El visor 3D rellena el mismo hueco que el 2D, bajo la barra.
        <div style={{ height: "calc(100vh - 65px)" }}>
          <Viewer3D src={active.model} />
        </div>
      ) : (
        <DeepZoomViewer
          tileSource={active.tileSource}
          height="calc(100vh - 65px)"
        />
      )}
    </div>
  );
}
