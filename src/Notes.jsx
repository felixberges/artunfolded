// Notes.jsx — pestaña "Historia" de cada lámina.
// Muestra el cuerpo localizado del bloque [HISTORIA] del .txt.
// Mismo renderer de texto que Article.jsx (párrafos separados por línea en blanco),
// pero con un estilo visualmente distinto: monoespaciado, tono de cuaderno de trabajo.

import { useT } from './i18n';
import './notes.css';

function renderBody(md) {
  if (!md) return null;
  const blocks = md.split(/\n\s*\n/);
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
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

export default function Notes({ body }) {
  const t = useT();
  const text = body ? t(body) : null;
  return (
    <div className="notes">
      <div className="notes-body">
        {text ? renderBody(text) : null}
      </div>
    </div>
  );
}
