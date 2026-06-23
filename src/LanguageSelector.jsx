// LanguageSelector.jsx — three-way switch for ES / IT / EN.
import { LANGS, useLang } from './i18n';

export default function LanguageSelector() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-selector" role="group" aria-label="Language">
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          className={'lang-btn' + (code === lang ? ' is-active' : '')}
          aria-pressed={code === lang}
          onClick={() => setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
