// News.jsx — página «Noticias». Los datos están en newsData.js.
// Cada noticia: fecha, título, texto (párrafos) y, opcionalmente, una imagen y
// un enlace a una lámina (un <a href="#/id">: lo resuelve el enrutado de App).

import { useLang, useT } from './i18n';
import { ui } from './strings';
import { news } from './newsData';   // no se llama news.js: en Windows chocaría con News.jsx
import './news.css';

const LOCALES = { es: 'es-ES', it: 'it-IT', en: 'en-GB' };

function formatDate(iso, lang) {
  const [y, m, d] = iso.split('-').map(Number);
  // mediodía UTC: evita que la zona horaria cambie el día
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat(LOCALES[lang] ?? lang, { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function NewsItem({ item }) {
  const t = useT();
  const { lang } = useLang();
  const paragraphs = t(item.body).split(/\n\s*\n/).filter(Boolean);
  return (
    <article className="news-item">
      <time className="news-date" dateTime={item.date}>{formatDate(item.date, lang)}</time>
      <h2 className="news-title">{t(item.title)}</h2>
      {item.image?.src && (
        <img className="news-img" src={item.image.src} alt={t(item.image.alt)} loading="lazy" />
      )}
      {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      {item.link?.monument && (
        <a className="news-link" href={`#/${item.link.monument}`}>{t(item.link.label)} →</a>
      )}
    </article>
  );
}

export default function News() {
  const t = useT();
  const items = [...news].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <main className="news">
      <h1 className="news-heading">{t(ui.newsTitle)}</h1>
      <div className="news-list">
        {items.map((item) => <NewsItem key={item.id} item={item} />)}
      </div>
    </main>
  );
}
