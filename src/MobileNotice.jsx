// MobileNotice.jsx — franja discreta bajo la app-bar que avisa, solo en
// teléfonos, de que la web está pensada para ordenador o tableta.
//
// Se considera teléfono una pantalla táctil cuyo lado corto mide menos de
// 600 px (en vertical o en horizontal). Las tabletas (744 px o más de lado
// corto) y los ordenadores no lo ven.
// Al pulsar «Entendido» se guarda en el navegador y no vuelve a salir.

import { useState } from 'react';
import { useT } from './i18n';
import { ui } from './strings';

const STORAGE_KEY = 'au-mobile-notice-dismissed';

function isPhone() {
  if (typeof window === 'undefined') return false;
  const touch = window.matchMedia?.('(pointer: coarse)').matches;
  const shortSide = Math.min(window.screen.width, window.screen.height);
  return Boolean(touch) && shortSide < 600;
}

function wasDismissed() {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; }
  catch { return false; }
}

export default function MobileNotice() {
  const t = useT();
  const [visible, setVisible] = useState(() => isPhone() && !wasDismissed());

  if (!visible) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* sin almacenamiento: solo se oculta */ }
    setVisible(false);
  };

  return (
    <div className="mobile-notice" role="note">
      <p className="mobile-notice-text">{t(ui.mobileNotice)}</p>
      <button type="button" className="mobile-notice-ok" onClick={dismiss}>
        {t(ui.mobileNoticeOk)}
      </button>
    </div>
  );
}
