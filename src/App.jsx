// App.jsx (capital A — Vercel is case-sensitive)
// Archivo (láminas)  ->  detalle de monumento.
// En el detalle: los [TEXTO] (article) van como encabezado encima de las
// pestañas; las pestañas son los visores; cada visor comparte la columna
// derecha de anotaciones. La selección de punto se coordina entre el visor
// (pines) y el panel (lista).

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './unfolded-ui.css';
import { monuments } from './monuments';
import { LanguageProvider, useT } from './i18n';
import { ui } from './strings';
import LanguageSelector from './LanguageSelector';
import ViewSwitcher from './ViewSwitcher';
import ViewRenderer from './ViewRenderer';
import Article from './Article';
import Team from './Team';
import Method from './Method';
import Project from './Project';
import News from './News';
import Contact from './Contact';

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
        {activeView?.type === 'deepzoom' && (
          <AnnotationsPanel annotations={annotations} activeAnno={activeAnno} onSelect={setActiveAnno} />
        )}
      </section>
    </main>
  );
}

// --- Direcciones (hash) ---------------------------------------------------
// Cada página y cada lámina tiene su dirección: #/proyecto, #/metodologia,
// #/noticias, #/equipo, #/contacto, #/<id de la lámina> (el nombre del .txt). Así el botón
// «atrás» del navegador vuelve a donde estabas, y se puede enviar un enlace
// directo a una lámina. Con hash no hace falta configurar nada en Vercel.
const PAGE_SLUGS = { project: 'proyecto', method: 'metodologia', news: 'noticias', about: 'equipo', contact: 'contacto' };
const SLUG_TO_PAGE = Object.fromEntries(Object.entries(PAGE_SLUGS).map(([k, v]) => [v, k]));

function parseHash() {
  const slug = decodeURIComponent(window.location.hash.replace(/^#\/?/, '')).split('/')[0];
  if (!slug) return { page: null, monumentId: null };
  if (SLUG_TO_PAGE[slug]) return { page: SLUG_TO_PAGE[slug], monumentId: null };
  if (monuments.some((m) => m.id === slug)) return { page: null, monumentId: slug };
  return { page: null, monumentId: null };   // dirección desconocida -> portada
}

function useHashRoute() {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const navigate = (path) => {
    const target = '#/' + path;
    if (window.location.hash === target) return;
    window.location.hash = target;            // añade una entrada al historial
  };
  return [route, navigate];
}

function AppInner() {
  const t = useT();
  const [{ page, monumentId }, navigate] = useHashRoute();
  const monument = monuments.find((m) => m.id === monumentId) ?? null;

  const goHome = () => navigate('');
  const openPage = (name) => navigate(PAGE_SLUGS[name]);
  const selectMonument = (id) => navigate(id);

  const inDetail = Boolean(monument || page);

  // Scroll: al volver a la portada, se recupera la posición en la que estabas
  // entre las láminas; al abrir cualquier otra cosa, se empieza arriba.
  const archiveScroll = useRef(0);
  useLayoutEffect(() => {
    if (!inDetail) window.scrollTo(0, archiveScroll.current);
    else window.scrollTo(0, 0);
  }, [page, monumentId, inDetail]);
  useEffect(() => {
    if (inDetail) return;
    const onScroll = () => { archiveScroll.current = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [inDetail]);

  // Título de la pestaña del navegador (y de cada entrada del historial).
  useEffect(() => {
    const name = monument ? t(monument.title)
      : page === 'project' ? t(ui.projectNav)
      : page === 'method' ? t(ui.methodNav)
      : page === 'news' ? t(ui.newsNav)
      : page === 'about' ? t(ui.aboutNav)
      : page === 'contact' ? t(ui.contactNav)
      : '';
    document.title = name ? `${name} · Art Unfolded` : 'Art Unfolded';
  });

  return (
    <div className={'app' + (inDetail ? ' is-detail' : '')}>
      <header className="app-bar">
        <div className="app-bar-left">
          {inDetail && (
            <button type="button" className="back-button" onClick={goHome}>
              <span className="arrow" aria-hidden="true">←</span> {t(ui.back)}
            </button>
          )}
          <span className="app-mark">Art Unfolded</span>
        </div>
        <div className="app-bar-right">
          <button type="button" className={`about-link${page === 'project' ? ' is-active' : ''}`} onClick={() => openPage('project')}>{t(ui.projectNav)}</button>
          <button type="button" className={`about-link${page === 'method' ? ' is-active' : ''}`} onClick={() => openPage('method')}>{t(ui.methodNav)}</button>
          <button type="button" className={`about-link${page === 'news' ? ' is-active' : ''}`} onClick={() => openPage('news')}>{t(ui.newsNav)}</button>
          <button type="button" className={`about-link${page === 'about' ? ' is-active' : ''}`} onClick={() => openPage('about')}>{t(ui.aboutNav)}</button>
          <button type="button" className={`about-link${page === 'contact' ? ' is-active' : ''}`} onClick={() => openPage('contact')}>{t(ui.contactNav)}</button>
          <LanguageSelector />
        </div>
      </header>

      {page === 'project'
        ? <Project />
        : page === 'method'
        ? <Method />
        : page === 'news'
        ? <News />
        : page === 'about'
        ? <Team />
        : page === 'contact'
        ? <Contact />
        : monument
          ? <MonumentDetail key={monument.id} monument={monument} />
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
