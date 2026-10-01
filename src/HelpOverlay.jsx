// HelpOverlay.jsx — botón "?" + panel de instrucciones por tipo de visor.
//
// Uso:  <HelpOverlay type="deepzoom" />          (esquina superior derecha)
//       <HelpOverlay type="path3d" corner="bl" /> (si choca con otros controles)
//       <HelpOverlay type="deepzoom" style={{ top: 112, right: 20 }} />
//         (style ajusta la posición exacta, p. ej. para apilarlo bajo otros botones)
//       <HelpOverlay type="model3d" corner="inline" />
//         (dentro de una fila flex de botones ya posicionada; el panel abre hacia abajo)
//
// Preferible colocarlo como HERMANO del div de OSD / del <Canvas> de R3F.
// Aun así, el componente corta en nativo (no solo en React) la rueda, el
// pulsar y el doble clic, así que tampoco llegan a un contenedor padre que
// escuche esos eventos (p. ej. el stage de PathViewer, con rueda nativa).
// El contenedor padre debe tener position: relative.
//
// Textos: ui.helpTitle, ui.helpOpen y ui.help<Tipo> en strings.js.
// Cada ui.help<Tipo> es { es: [...], it: [...], en: [...] } — una frase por línea.

import { useEffect, useRef, useState } from 'react';
import { useT } from './i18n';
import { ui } from './strings.js';
import './helpoverlay.css';

const KEY_BY_TYPE = {
  deepzoom: 'helpDeepzoom',
  model3d: 'helpModel3d',
  object3d: 'helpObject3d',
  path3d: 'helpPath3d',
};

const CORNERS = ['tr', 'tl', 'br', 'bl', 'inline'];

// Eventos que no deben salir del componente hacia el visor.
// 'click' NO se corta en nativo: React lo necesita para los botones.
const NATIVE_STOP = ['wheel', 'pointerdown', 'mousedown', 'touchstart', 'dblclick'];
const stop = (e) => e.stopPropagation();

export default function HelpOverlay({ type, corner = 'tr', style }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const closeRef = useRef(null);

  const key = KEY_BY_TYPE[type];
  const lines = key ? t(ui[key]) : null;

  // Corte nativo de gestos (los listeners nativos de OSD / PathViewer no
  // se enteran de un stopPropagation de React).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    NATIVE_STOP.forEach((ev) => el.addEventListener(ev, stop));
    return () => NATIVE_STOP.forEach((ev) => el.removeEventListener(ev, stop));
  }, []);

  // Esc cierra; clic fuera del panel cierra.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown, true);
    };
  }, [open]);

  // Foco: al abrir va al botón de cerrar; al cerrar vuelve al "?".
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) closeRef.current?.focus();
    else if (wasOpen.current) btnRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  if (!Array.isArray(lines) || lines.length === 0) return null;

  const pos = CORNERS.includes(corner) ? corner : 'tr';
  const panelId = `help-panel-${type}`;

  return (
    <div
      ref={rootRef}
      className={`help-root help-${pos}`}
      style={style}
      onClick={stop}
    >
      <button
        ref={btnRef}
        type="button"
        className={`help-btn${open ? ' is-open' : ''}`}
        aria-label={t(ui.helpOpen)}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        ?
      </button>

      {open && (
        <div id={panelId} className="help-panel" role="dialog" aria-label={t(ui.helpTitle)}>
          <div className="help-head">
            <h2 className="help-title">{t(ui.helpTitle)}</h2>
            <button
              ref={closeRef}
              type="button"
              className="help-close"
              aria-label={t(ui.close)}
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>
          <ul className="help-list">
            {lines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
