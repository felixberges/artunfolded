// i18n.jsx — minimal, dependency-free internationalization.
// Pattern: a tiny React context holds the active language; `t()` resolves
// a localized field { es, it, en } to a string. No router, no i18n library —
// fully static / offline-friendly, consistent with the rest of the app.

import { createContext, useContext, useState } from 'react';

export const LANGS = ['es', 'it', 'en'];

export const LANG_LABELS = {
  es: 'Español',
  it: 'Italiano',
  en: 'English',
};

const LanguageContext = createContext({ lang: 'es', setLang: () => {} });

export function LanguageProvider({ children, initial = 'es' }) {
  const [lang, setLang] = useState(LANGS.includes(initial) ? initial : 'es');
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
