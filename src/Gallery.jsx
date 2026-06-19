// Página de inicio: el "archivo". Una rejilla de láminas; al pulsar una,
// el padre (App) abre el visor de zoom profundo.

export default function Gallery({ monuments, onSelect }) {
  return (
    <main className="gallery">
      <header className="masthead">
        <p className="eyebrow">Archivo visual de superficies</p>
        <h1 className="wordmark">Art Unfolded</h1>
        <p className="thesis">
          Arquitectura y pintura antiguas, desplegadas en superficies planas de
          altísima resolución para inspeccionarlas de cerca.
        </p>
      </header>

      <ul className="plates">
        {monuments.map((m, i) => (
          <li key={m.id} className="plate" style={{ "--i": i }}>
            <button
              className="plate-btn"
              onClick={() => onSelect(m.id)}
              aria-label={`Abrir el visor de ${m.title}`}
            >
              <span className="plate-num">Lámina {m.plate}</span>

              <span className="plate-frame">
                <img
                  className="plate-img"
                  src={m.thumb}
                  alt={m.title}
                  loading="lazy"
                />
                <span className="plate-open" aria-hidden="true">
                  Abrir visor ↗
                </span>
              </span>

              <span className="plate-meta">
                <span className="plate-title">{m.title}</span>
                <span className="plate-place">{m.place}</span>
                <span className="plate-spec">{m.spec}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <footer className="colophon">
        Art Unfolded · prototipo de archivo · {new Date().getFullYear()}
      </footer>
    </main>
  );
}
