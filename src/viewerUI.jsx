// viewerUI.jsx — piezas comunes de los visores (2D y 3D):
//   - Icon: iconos SVG de trazo para la barra de botones.
//   - ToolButton: botón cuadrado de 40 px con el estilo común.
//   - useFullscreen(ref): pantalla completa con la API del navegador sobre el
//     contenedor del visor (así botones, ayuda y deslizadores siguen visibles).
//   - FullscreenHint: aviso fijo abajo mientras dura la pantalla completa, con
//     botón de salir (en tabletas no hay tecla Esc).
// Estilos de .au-tool, .au-fs-root y .dz-fs-hint en unfolded-ui.css.

import { useCallback, useEffect, useState } from 'react';
import { useT } from './i18n';
import { ui } from './strings';

// --- pantalla completa: API estándar y prefijo webkit (Safari / iPad) -------
const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
const fsEnabled = () => Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const fsRequest = (el) => (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
export const fsExit = () => (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);

export function useFullscreen(ref) {
  const [isFs, setIsFs] = useState(false);
  const [canFs] = useState(fsEnabled);

  useEffect(() => {
    const node = ref.current;   // copia: en la limpieza ref.current ya puede ser null
    const onChange = () => setIsFs(ref.current != null && fsElement() === ref.current);
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
      // si el visor se desmonta estando a pantalla completa, salir
      if (node && fsElement() === node) fsExit();
    };
  }, [ref]);

  const toggle = useCallback(() => {
    if (fsElement()) fsExit();
    else if (ref.current) fsRequest(ref.current);
  }, [ref]);

  return { isFs, canFs, toggle, exit: fsExit };
}

// --- iconos -------------------------------------------------------------------
const ICONS = {
  zoomIn:  'M12 5v14M5 12h14',
  zoomOut: 'M5 12h14',
  home:    'M4 11.5 12 4.5l8 7M6.5 9.5V19.5h11V9.5',
  fsEnter: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  fsExit:  'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
  close:   'M6.5 6.5l11 11M17.5 6.5l-11 11',
  rotCCW:  'M4.5 9.5A8 8 0 1 1 4 13M4.5 4.5v5h5',
  rotCW:   'M19.5 9.5A8 8 0 1 0 20 13M19.5 4.5v5h-5',
};

export function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

// Botón cuadrado con icono. label = texto para title y aria-label.
export function ToolButton({ icon, label, onClick, style }) {
  return (
    <button type="button" className="au-tool" style={style} onClick={onClick} title={label} aria-label={label}>
      <Icon name={icon} />
    </button>
  );
}

// Barra estándar (arriba a la izquierda): acercar, alejar, inicio, pantalla
// completa. Pasa null en onZoom / onHome para no mostrar esos botones.
export function ViewerToolbar({ onZoom, onHome, fs, style }) {
  const t = useT();
  return (
    <div className="au-toolbar" style={style}>
      {onZoom && <ToolButton icon="zoomIn" label={t(ui.viewerZoomIn)} onClick={() => onZoom(1)} />}
      {onZoom && <ToolButton icon="zoomOut" label={t(ui.viewerZoomOut)} onClick={() => onZoom(-1)} />}
      {onHome && (
        <ToolButton icon="home" label={t(ui.viewerHome)} onClick={onHome}
          style={onZoom ? { marginTop: 6 } : undefined} />
      )}
      {fs?.canFs && (
        <ToolButton icon={fs.isFs ? 'fsExit' : 'fsEnter'}
          label={t(fs.isFs ? ui.viewerFsExit : ui.viewerFsEnter)} onClick={fs.toggle} />
      )}
    </div>
  );
}

export function FullscreenHint({ fs }) {
  const t = useT();
  if (!fs?.isFs) return null;
  return (
    <div className="dz-fs-hint" role="status">
      <span className="dz-fs-hint-text">{t(ui.viewerFsHint)}</span>
      <button type="button" className="dz-fs-exit" onClick={fs.exit}>
        <Icon name="close" size={15} />
        <span>{t(ui.viewerFsExitShort)}</span>
      </button>
    </div>
  );
}
