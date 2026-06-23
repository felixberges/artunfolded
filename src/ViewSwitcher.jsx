// ViewSwitcher.jsx — tabs to move between a monument's views. State-based, no router.
import { useT } from './i18n';

export default function ViewSwitcher({ views, activeId, onChange }) {
  const t = useT();
  if (!views || views.length <= 1) return null;
  return (
    <nav className="view-switcher" aria-label="Views">
      {views.map((v) => (
        <button
          key={v.id}
          type="button"
          className={'view-tab' + (v.id === activeId ? ' is-active' : '')}
          aria-current={v.id === activeId ? 'true' : undefined}
          onClick={() => onChange(v.id)}
        >
          {t(v.label)}
        </button>
      ))}
    </nav>
  );
}
