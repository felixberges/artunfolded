// Carousel.jsx — tercer tipo de vista: carrusel de imagenes [CARRUSEL].
// Sin dependencias (consistente con el resto: offline-first). Consume:
//   images:  [{ src, caption? }]            (caption localizado, opcional)
//   options: { fit, autoplay, loop, thumbnails, start }
//
//   fit         'contain' (def., se ve la imagen entera) | 'cover' (rellena)
//   autoplay    ms entre pases; 0 = manual
//   loop        true (def.) vuelve al principio tras la ultima
//   thumbnails  true (def.) muestra tira de miniaturas
//   start       indice inicial (def. 0)
//
// Teclado: izquierda / derecha cambian de imagen cuando el carrusel tiene foco.
// Respeta prefers-reduced-motion (sin autoplay ni transicion).

import { useEffect, useRef, useState } from 'react';
import { useT } from './i18n';
import './carousel.css';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function Carousel({ images = [], options = {} }) {
  const t = useT();
  const {
    fit = 'contain',
    autoplay = 0,
    loop = true,
    thumbnails = true,
    start = 0,
  } = options;

  const count = images.length;
  const [index, setIndex] = useState(Math.min(Math.max(start, 0), Math.max(count - 1, 0)));
  const rootRef = useRef(null);
  const [paused, setPaused] = useState(false);

  const go = (n) => {
    if (count === 0) return;
    setIndex((i) => {
      const next = i + n;
      if (loop) return (next + count) % count;
      return Math.min(Math.max(next, 0), count - 1);
    });
  };

  // Autoplay (se pausa al pasar el raton / enfocar, y si reduced-motion).
  useEffect(() => {
    if (!autoplay || count <= 1 || paused || prefersReducedMotion()) return;
    const id = setInterval(() => go(1), autoplay);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, count, paused, loop]);

  // Si cambia el set de imagenes, reencuadra el indice.
  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(count - 1, 0)));
  }, [count]);

  if (count === 0) return null;

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
  };

  const atStart = index === 0;
  const atEnd = index === count - 1;
  const current = images[index];

  return (
    <div
      className="carousel"
      ref={rootRef}
      role="group"
      aria-roledescription="carrusel"
      aria-label={`Imagen ${index + 1} de ${count}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="carousel-stage">
        <img
          className="carousel-img"
          src={current.src}
          alt={t(current.caption) || `Imagen ${index + 1}`}
          style={{ objectFit: fit }}
          loading="lazy"
        />

        {count > 1 && (
          <>
            <button
              type="button"
              className="carousel-arrow carousel-prev"
              onClick={() => go(-1)}
              disabled={!loop && atStart}
              aria-label="Imagen anterior"
            >
              &#8249;
            </button>
            <button
              type="button"
              className="carousel-arrow carousel-next"
              onClick={() => go(1)}
              disabled={!loop && atEnd}
              aria-label="Imagen siguiente"
            >
              &#8250;
            </button>
            <span className="carousel-counter">{index + 1} / {count}</span>
          </>
        )}
      </div>

      {current.caption && (
        <p className="carousel-caption">{t(current.caption)}</p>
      )}

      {count > 1 && thumbnails && (
        <div className="carousel-thumbs" role="tablist" aria-label="Miniaturas">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={'carousel-thumb' + (i === index ? ' is-active' : '')}
              onClick={() => setIndex(i)}
              aria-label={t(img.caption) || `Ir a la imagen ${i + 1}`}
            >
              <img src={img.src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {count > 1 && !thumbnails && (
        <div className="carousel-dots" role="tablist" aria-label="Posicion">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              className={'carousel-dot' + (i === index ? ' is-active' : '')}
              onClick={() => setIndex(i)}
              aria-label={`Ir a la imagen ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
