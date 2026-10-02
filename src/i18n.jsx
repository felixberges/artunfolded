// i18n.jsx — minimal, dependency-free internationalization.
// Pattern: a tiny React context holds the active language; `t()` resolves
// a localized field { es, it, en } to a string. No router, no i18n library —
// fully static / offline-friendly, consistent with the rest of the app.

import { createContext, useContext, useEffect, useState } from 'react';

export const LANGS = ['es', 'it', 'en'];

export const LANG_LABELS = {
  es: 'Español',
  it: 'Italiano',
  en: 'English',
};

const LanguageContext = createContext({ lang: 'es', setLang: () => {} });

// Idioma inicial, por orden: el que el visitante eligió la última vez (guardado
// en el navegador); el idioma del navegador si es es / it / en (catalán, gallego
// y euskera -> español); cualquier otro idioma del navegador -> inglés.
// `initial` solo se usa si no se puede leer nada de lo anterior.
const STORAGE_KEY = 'au-lang';
const TO_ES = ['ca', 'gl', 'eu'];

function detectLang(initial) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch { /* sin acceso a localStorage */ }
  const prefs = (typeof navigator !== 'undefined' && (navigator.languages?.length ? navigator.languages : [navigator.language])) || [];
  for (const p of prefs) {
    const code = String(p || '').toLowerCase().split('-')[0];
    if (LANGS.includes(code)) return code;
    if (TO_ES.includes(code)) return 'es';
  }
  if (prefs.length && prefs[0]) return 'en';
  return LANGS.includes(initial) ? initial : 'es';
}

export function LanguageProvider({ children, initial = 'es' }) {
  const [lang, setLang] = useState(() => detectLang(initial));

  // Recordar la elección y mantener <html lang> al día (lectores de pantalla,
  // traductores automáticos, buscadores).
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* sin persistencia */ }
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}

// Resolve a localized field for a given language, with graceful fallback.
// Accepts a plain string (returned as-is) or an object { es, it, en }.
export function pick(field, lang) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  return field[lang] ?? field.es ?? field.en ?? Object.values(field)[0] ?? '';
}

// Hook that returns a `t` bound to the current language: t(view.label) -> string.
export function useT() {
  const { lang } = useLang();
  return (field) => pick(field, lang);
}
