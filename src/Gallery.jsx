// Gallery.jsx — normal photographs of the monument. Grid + click-to-enlarge.
import { useState } from 'react';
import { useT } from './i18n';
import { ui } from './strings';

export default function Gallery({ images = [] }) {
  const t = useT();
  const [open, setOpen] = useState(null); // index of enlarged image, or null

  if (!images.length) return null;

  return (
    <div className="gallery">
      <div className="photo-grid">
        {images.map((img, i) => (
          <figure className="photo-item" key={img.src} onClick={() => setOpen(i)}>
            <img src={img.src} alt={t(img.caption)} loading="lazy" />
            {img.caption && <figcaption>{t(img.caption)}</figcaption>}
          </figure>
        ))}
      </div>

      {open !== null && (
        <div className="lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <button className="lightbox-close" type="button" aria-label={t(ui.close)}>×</button>
          <figure className="lightbox-figure" onClick={(e) => e.stopPropagation()}>
            <img src={images[open].src} alt={t(images[open].caption)} />
            {images[open].caption && <figcaption>{t(images[open].caption)}</figcaption>}
          </figure>
        </div>
      )}
    </div>
  );
}
