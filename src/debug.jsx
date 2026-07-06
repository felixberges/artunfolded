// debug.jsx
// Interruptor de DEBUG a nivel de página (solo en desarrollo).
//
// Piezas:
//   · DebugProvider  -> envuelve la app. Mantiene el flag global (persistido en
//                       localStorage). En producción el flag es SIEMPRE false.
//   · DebugToggle    -> botón flotante para encender/apagar (solo se ve en DEV).
//   · useDebug()     -> hook que devuelve { debug, dev, toggle, setDebug }.
//   · DebugPanel     -> panel reutilizable que CADA visor puede pintar con lo que
//                       le interese; se muestra solo cuando debug está activo.
//
// Uso (una vez, en el arranque — main.jsx o el root de App):
//   import { DebugProvider, DebugToggle } from './debug';
//   <DebugProvider>
//     <App />
//     <DebugToggle />
//   </DebugProvider>
//
// Uso en un visor cualquiera:
//   import { DebugPanel } from './debug';
//   <DebugPanel title="cámara" copyText={bloque}>
//     <pre>{bloque}</pre>
//   </DebugPanel>

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import './debug.css';

const DEV = !!(import.meta && import.meta.env && import.meta.env.DEV);
const KEY = 'au_debug';

const DebugContext = createContext({ debug: false, dev: false, toggle: () => {}, setDebug: () => {} });

export function DebugProvider({ children }) {
  const [on, setOn] = useState(() => {
    if (!DEV) return false;
    try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    if (!DEV) return;
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* sin persistencia */ }
  }, [on]);

  const toggle = useCallback(() => setOn((d) => !d), []);

  // debug efectivo: solo true si estamos en DEV Y el flag está encendido.
  const value = { debug: DEV && on, dev: DEV, toggle, setDebug: setOn };
  return <DebugContext.Provider value={value}>{children}</DebugContext.Provider>;
}

export function useDebug() {
  return useContext(DebugContext);
}

// Botón flotante global. Invisible fuera de desarrollo.
export function DebugToggle() {
  const { debug, dev, toggle } = useDebug();
  if (!dev) return null;
  return (
    <button
      type="button"
      className={`debug-toggle${debug ? ' is-on' : ''}`}
      onClick={toggle}
      title="Modo debug (solo desarrollo)"
    >
      {debug ? '● debug' : '○ debug'}
    </button>
  );
}

// Panel reutilizable. Se pinta solo con debug activo. Si se le pasa copyText,
// muestra un botón para copiarlo al portapapeles.
export function DebugPanel({ title = 'debug', children, copyText = null, className = '' }) {
  const { debug } = useDebug();
  const [copied, setCopied] = useState(false);
  if (!debug) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`debug-panel ${className}`} onPointerDown={(e) => e.stopPropagation()}>
      <div className="debug-panel-title">{title}</div>
      <div className="debug-panel-body">{children}</div>
      {copyText != null && (
        <button type="button" className="debug-panel-copy" onClick={copy}>
          {copied ? '✓ copiado' : 'copiar bloque'}
        </button>
      )}
    </div>
  );
}

export default DebugProvider;
