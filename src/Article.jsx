// Article.jsx — technical method text per monument.
// Accepts either `body` (inline localized markdown) or `bodyPath` (localized path
// to a local .md file fetched at runtime). Tiny built-in renderer for ## / ### and
// paragraphs keeps things dependency-free; swap in react-markdown if you need more.

import { useEffect, useState } from 'react';
import { useLang, useT, pick } from './i18n';
import { ui } from './strings';

function renderMarkdown(md) {
  if (!md) return null;
  const blocks = md.split(/\n\s*\n/); // blank-line separated
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (trimmed.startsWith('### ')) return <h4 key={i}>{trimmed.slice(4)}</h4>;
    if (trimmed.startsWith('## ')) return <h3 key={i}>{trimmed.slice(3)}</h3>;
    // keep single newlines as line breaks within a paragraph
    const lines = trimmed.split('\n');
    return (
      <p key={i}>
        {lines.map((line, j) => (
          <span key={j}>
            {line}
            {j < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
  });
}

export default function Article({ body, bodyPath }) {
  const t = useT();
  const { lang } = useLang();
  const [fetched, setFetched] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!bodyPath) { setFetched(null); return; }
    const path = pick(bodyPath, lang);
    if (!path) return;
    setLoading(true);
    fetch(path)
      .then((r) => (r.ok ? r.text() : ''))
      .then((text) => setFetched(text))
      .catch(() => setFetched(''))
      .finally(() => setLoading(false));
  }, [bodyPath, lang]);

  if (loading) return <div className="article"><p className="muted">{t(ui.loading)}</p></div>;

  const md = bodyPath ? fetched : t(body);
  return <article className="article">{renderMarkdown(md)}</article>;
}
