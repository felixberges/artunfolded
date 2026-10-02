// LanguageSelector.jsx — three-way switch for ES / IT / EN.
import { LANGS, useLang, useT } from './i18n';
import { ui } from './strings';

export default function LanguageSelector() {
  const { lang, setLang } = useLang();
  const t = useT();
  return (
    <div className="lang-selector" role="group" aria-label={t(ui.language)}>
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
