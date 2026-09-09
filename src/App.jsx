// App.jsx (capital A — Vercel is case-sensitive)
// Archivo (láminas)  ->  detalle de monumento.
// En el detalle: los [TEXTO] (article) van como encabezado encima de las
// pestañas; las pestañas son los visores; cada visor comparte la columna
// derecha de anotaciones. La selección de punto se coordina entre el visor
// (pines) y el panel (lista).

import { useState } from 'react';
import './unfolded-ui.css';
import { monuments } from './monuments';
import { LanguageProvider, useT } from './i18n';
import { ui } from './strings';
import LanguageSelector from './LanguageSelector';
import ViewSwitcher from './ViewSwitcher';
import ViewRenderer from './ViewRenderer';
import Article from './Article';
import Team from './Team';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const roman = (n) => ROMAN[n] ?? String(n);

const SPEC = {
  deepzoom: ui.specDeepzoom,
  model3d: ui.specModel3d,
  object3d: ui.specObject3d,
  path3d: ui.specPath3d,
  gallery: ui.specGallery,
  diagram: ui.specDiagram,
  carousel: ui.specCarousel,
};
const specFor = (m, t) => m.views.map((v) => SPEC[v.type]).filter(Boolean).map(t).join(' · ');

// Anotaciones de una vista (solo deepzoom las trae, en el primer source).
function annotationsOf(view) {
  if (!view || view.type !== 'deepzoom') return [];
  const o = view.sources?.[0]?.overlays?.find((x) => x.type === 'annotations');
  return o?.regions ?? [];
}

function Archive({ onSelect }) {
  const t = useT();
  return (
    <main className="gallery">
      <header className="masthead">
        <p className="eyebrow">{t(ui.archiveEyebrow)}</p>
        <h1 className="wordmark">Art Unfolded</h1>
        <p className="thesis">{t(ui.archiveThesis)}</p>
      </header>

      <ul className="plates">
        {monuments.map((m, i) => {
          const title = t(m.title);
          const place = t(m.location);
          return (
            <li key={m.id} className="plate" style={{ '--i': i }}>
              <button
                className="plate-btn"
                type="button"
                onClick={() => onSelect(m.id)}
                aria-label={`${t(ui.openViewerFor)} ${title}`}
              >
                <span className="plate-num">{t(ui.plateLabel)} {roman(i + 1)}</span>

                <span className="plate-frame">
                  <img className="plate-img" src={m.thumb} alt={title} loading="lazy" />
                  <span className="plate-open" aria-hidden="true">{t(ui.openViewerCta)} ↗</span>
                </span>

                <span className="plate-meta">
                  <span className="plate-title">{title}</span>
                  {place && <span className="plate-place">{place}</span>}
                  <span className="plate-spec">{specFor(m, t)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <footer className="colophon">
        Art Unfolded · {t(ui.archivePrototype)} · {new Date().getFullYear()}
      </footer>
    </main>
  );
}

// Columna derecha: lista de puntos de información. Clic selecciona (y el visor
// resalta/centra el pin correspondiente).
function AnnotationsPanel({ annotations, activeAnno, onSelect }) {
  const t = useT();
  return (
    <aside className="anno-panel">
      <p className="anno-panel-eyebrow">{t(ui.annotations)}</p>
      {annotations.length === 0 ? (
        <p className="anno-panel-empty">{t(ui.comingSoon)}</p>
      ) : (
        <ol className="anno-list">
          {annotations.map((a, i) => (
            <li key={i}>
              <button
                type="button"
                className={'anno-item' + (i === activeAnno ? ' is-active' : '')}
                onClick={() => onSelect(i === activeAnno ? null : i)}
              >
                <span className="anno-item-num">{i + 1}</span>
                <span className="anno-item-text">{t(a.text)}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function MonumentDetail({ monument }) {
  const t = useT();

  const intro = monument.views.filter((v) => v.type === 'article');
  const tabs = monument.views.filter((v) => v.type !== 'article');

  const firstId = tabs.find((v) => v.id === monument.defaultView)?.id ?? tabs[0]?.id;
  const [activeViewId, setActiveViewId] = useState(firstId);
  const [activeAnno, setActiveAnno] = useState(null);

  const activeView = tabs.find((v) => v.id === activeViewId) ?? tabs[0];
  const annotations = annotationsOf(activeView);

  const changeTab = (id) => { setActiveViewId(id); setActiveAnno(null); };

  return (
    <main className="monument">
      <header className="monument-header">
        <div className="monument-heading">
          <h1 className="monument-title">{t(monument.title)}</h1>
          {t(monument.location) && <p className="monument-location">{t(monument.location)}</p>}
        </div>

        {intro.map((a) => (
          <div className="monument-intro" key={a.id}>
            {t(a.label) && <h2 className="monument-section">{t(a.label)}</h2>}
            <Article body={a.body} bodyPath={a.bodyPath} />
          </div>
        ))}

        <ViewSwitcher views={tabs} activeId={activeViewId} onChange={changeTab} />
      </header>

      <section className="monument-stage">
        <div className="stage-viewer">
          <ViewRenderer
            view={activeView}
            onNavigateView={changeTab}
            activeAnno={activeAnno}
            onSelectAnno={setActiveAnno}
          />
        </div>
        <AnnotationsPanel annotations={annotations} activeAnno={activeAnno} onSelect={setActiveAnno} />
      </section>
    </main>
  );
}

function AppInner() {
  const t = useT();
  const [selectedId, setSelectedId] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const monument = monuments.find((m) => m.id === selectedId) ?? null;

  const goHome = () => { setSelectedId(null); setShowAbout(false); };
  const openAbout = () => { setSelectedId(null); setShowAbout(true); };
  const selectMonument = (id) => { setSelectedId(id); setShowAbout(false); };

  return (
    <div className={'app' + (monument || showAbout ? ' is-detail' : '')}>
      <header className="app-bar">
        <div className="app-bar-left">
          {(monument || showAbout) && (
            <button type="button" className="back-button" onClick={goHome}>
              <span className="arrow" aria-hidden="true">←</span> {t(ui.back)}
            </button>
          )}
          <span className="app-mark">Art Unfolded</span>
        </div>
        <div className="app-bar-right">
          {!showAbout && (
            <button type="button" className="about-link" onClick={openAbout}>{t(ui.aboutNav)}</button>
          )}
          <LanguageSelector />
        </div>
      </header>

      {showAbout
        ? <Team />
        : monument
          ? <MonumentDetail monument={monument} />
          : <Archive onSelect={selectMonument} />}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider initial="es">
      <AppInner />
    </LanguageProvider>
  );
}
