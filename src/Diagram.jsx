// Diagram.jsx — schematic showing where the piece sits in the building.
// Hotspots are positioned by 0..1 fractions; clicking one can jump to another
// view via onNavigateView(linksTo).
import { useT } from './i18n';

export default function Diagram({ view, onNavigateView }) {
  const t = useT();
  if (!view?.image) return null;

  return (
    <div className="diagram">
      <figure className="diagram-stage">
        <img src={view.image} alt={t(view.caption)} />
        {(view.hotspots ?? []).map((h, i) => (
          <button
            key={i}
            type="button"
            className="hotspot"
            style={{ left: `${h.x * 100}%`, top: `${h.y * 100}%` }}
            title={t(h.label)}
            onClick={() => h.linksTo && onNavigateView?.(h.linksTo)}
          >
            <span className="hotspot-dot" aria-hidden="true" />
            <span className="hotspot-label">{t(h.label)}</span>
          </button>
        ))}
        {view.caption && <figcaption>{t(view.caption)}</figcaption>}
      </figure>
    </div>
  );
}
