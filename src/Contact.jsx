// Contact.jsx — página "Contacto".
// Texto en strings.js (contactP1, contactP1b, contactP2). Sin formulario:
// la dirección es un enlace mailto con el asunto ya puesto, y al lado hay un
// botón para copiarla (en muchos ordenadores de oficina mailto no abre nada).

import { useEffect, useRef, useState } from 'react';
import { useT } from './i18n';
import { ui } from './strings';
import './contact.css';

const EMAIL = 'info@artunfolded.com';

// Copia al portapapeles. navigator.clipboard solo existe en contexto seguro
// (https o localhost); si falla, se usa un textarea temporal.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
}

function EmailBlock() {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onCopy = async () => {
    if (await copyText(EMAIL)) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2400);
    }
  };

  const href = `mailto:${EMAIL}?subject=${encodeURIComponent(t(ui.contactSubject))}`;

  return (
    <div className="contact-email">
      <a className="contact-address" href={href}>{EMAIL}</a>
      <button type="button" className="contact-copy" onClick={onCopy} aria-live="polite">
        {copied ? t(ui.contactCopied) : t(ui.contactCopy)}
      </button>
    </div>
  );
}

export default function Contact() {
  const t = useT();
  return (
    <main className="contact">
      <h1 className="contact-title">{t(ui.contactTitle)}</h1>

      <div className="contact-body">
        <p>{t(ui.contactP1)}</p>
        <p>{t(ui.contactP1b)}</p>

        <EmailBlock />

        <p className="contact-note">{t(ui.contactP2)}</p>
      </div>
    </main>
  );
}
