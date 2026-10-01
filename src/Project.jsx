// Project.jsx — página "El proyecto".
// Texto en strings.js (projectP0..P3 y projectCat1..7 para el catálogo).
// projectP5 (próximos trabajos) ya no se usa aquí: queda en strings.js como
// base para la futura página de noticias.
// Imágenes en public/proyecto/. Una figura con src null no se pinta, así que
// basta con poner la ruta cuando la imagen esté lista.

import { useT } from './i18n';
import { ui } from './strings';
import './project.css';

// Tira de detalles al inicio (pintura, mosaico, pintura, relieve).
const DETAILS = [
  { src: '/proyecto/detalle-farnesina.jpg',  alt: ui.projectDetail1Alt, caption: ui.projectDetail1Caption },
  { src: '/proyecto/detalle-trastevere.jpg', alt: ui.projectDetail2Alt, caption: ui.projectDetail2Caption },
  { src: '/proyecto/detalle-giulia.jpg',     alt: ui.projectDetail4Alt, caption: ui.projectDetail4Caption },
  { src: '/proyecto/detalle-leon.jpg',       alt: ui.projectDetail3Alt, caption: ui.projectDetail3Caption },
];

// Pareja del proceso. ratio = ancho/alto de cada imagen: sirve para que las
// dos queden a la misma altura. Si cambias una imagen, actualiza su ratio.
const PROCESS = [
  { src: '/proyecto/proceso-modelo.jpg',    ratio: 1.494, alt: ui.projectProcessModelAlt,  caption: ui.projectProcessModelCaption },
  { src: '/proyecto/proceso-resultado.jpg', ratio: 1.979, alt: ui.projectProcessResultAlt, caption: ui.projectProcessResultCaption },
];

// Catálogo de tipos de trabajo: título + texto. Para añadir o quitar
// entradas basta con tocar esta lista y sus claves en strings.js.
const CATALOG = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
  title: ui[`projectCat${n}Title`],
  body:  ui[`projectCat${n}Body`],
}));

// Imágenes intercaladas en el texto.
const IMAGES = {
  field: { src: null, alt: ui.projectImgFieldAlt, caption: ui.projectImgFieldCaption }, // p.ej. '/proyecto/campo.jpg'
};

function Figure({ img, className = 'project-figure' }) {
  const t = useT();
  if (!img?.src) return null;
  const caption = t(img.caption);
  return (
    <figure className={className}>
      <img src={img.src} alt={t(img.alt)} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function ProcessPair() {
  const items = PROCESS.filter((d) => d.src);
  if (items.length === 0) return null;
  return (
    <div className="project-process">
      {items.map((d) => (
        <div key={d.src} className="project-process-item" style={{ flexGrow: d.ratio }}>
          <Figure img={d} className="project-detail is-natural" />
        </div>
      ))}
    </div>
  );
}

function DetailStrip() {
  const items = DETAILS.filter((d) => d.src);
  if (items.length === 0) return null;
  return (
    <div className="project-details" style={{ '--n': items.length }}>
      {items.map((d) => (
        <Figure key={d.src} img={d} className="project-detail" />
      ))}
    </div>
  );
}

function Catalog() {
  const t = useT();
  return (
    <div className="project-catalog">
      {CATALOG.map((c, i) => (
        <section key={i} className="project-cat">
          <h2 className="project-cat-title">{t(c.title)}</h2>
          <p>{t(c.body)}</p>
        </section>
      ))}
    </div>
  );
}

export default function Project() {
  const t = useT();
  return (
    <main className="project">
      <h1 className="project-title">{t(ui.projectTitle)}</h1>

      <DetailStrip />

      <div className="project-body">
        <p className="project-lead">{t(ui.projectP0)}</p>
        <Figure img={IMAGES.field} />

        <p>{t(ui.projectP1)}</p>

        <p>{t(ui.projectP2)}</p>

        <p>{t(ui.projectP3)}</p>
      </div>

      <ProcessPair />

      <div className="project-body">
        <p>{t(ui.projectP1b)}</p>

        <Catalog />
      </div>
    </main>
  );
}
