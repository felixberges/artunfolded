// Method.jsx — página "Metodología". Una sola página, sin pestañas, contada
// a través de un caso (Villa Farnesina):
//   1. Presentación de la obra, con una foto de la sala
//   2. Los 4 pasos (Fotografiar … Retocar) y el resultado
//   3. El visor diseñado para esta bóveda
// Las imágenes viven en public/method/ para que el bundler no las incruste.
import { useT } from './i18n';
import { ui } from './strings';
import './method.css';
import './method-cases.css';

const IMGS = {
  sala:        '/method/farnesina-sala.jpg',
  fotografia:  '/method/bmulti1.jpg',
  fotog1:      '/method/bfotog1.jpg',
  fotog2:      '/method/bfotog2.jpg',
  bake1:       '/method/bake3.jpg',
  bake2:       '/method/bake4.jpg',
  unidos1:     '/method/bunidos1.jpg',
  unidos2:     '/method/bunidos2.jpg',
  resultado:   '/method/resultado.jpg',
};

// Sección final: el visor. Bloques en orden: { h } subtítulo, { p } párrafo,
// { figs } imágenes a la misma altura (ratio = ancho/alto) con pie común.
const VIEWER = [
  { h: ui.methodCase1ViewerTitle },
  { p: ui.methodCase1ViewerP1 },
  { figs: [
      { src: '/method/farnesina-visor.jpg', ratio: 2.266, alt: ui.methodCase1ViewerImgAlt },
    ], caption: ui.methodCase1ViewerImgCaption },
  { p: ui.methodCase1ViewerP2 },
  { figs: [
      { src: '/method/farnesina-giro-1.jpg', ratio: 1.487, alt: ui.methodCase1RotateAlt1 },
      { src: '/method/farnesina-giro-2.jpg', ratio: 1.295, alt: ui.methodCase1RotateAlt2 },
      { src: '/method/farnesina-giro-3.jpg', ratio: 1.297, alt: ui.methodCase1RotateAlt3 },
    ], caption: ui.methodCase1RotateCaption },
  { p: ui.methodCase1ViewerP3 },
  { figs: [
      { src: '/method/farnesina-lista.jpg', ratio: 4.011, alt: ui.methodCase1ListAlt },
    ], caption: ui.methodCase1ListCaption },
];

// Presentación de la obra: mismo esquema de dos columnas que los pasos,
// sin número.
function Intro() {
  const t = useT();
  return (
    <section className="method-step method-intro">
      <div className="method-step-text">
        <h2>{t(ui.methodCase1Title)}</h2>
        <p>{t(ui.methodCase1Body)}</p>
      </div>
      <div className="method-step-img">
        <img src={IMGS.sala} alt={t(ui.methodIntroImgAlt)} loading="lazy" />
        <span className="method-caption">{t(ui.methodIntroCaption)}</span>
      </div>
    </section>
  );
}

function Process() {
  const t = useT();
  return (
    <>
      <section className="method-step method-step--flip">
        <div className="method-step-text">
          <span className="method-num">{t(ui.methodStep1Num)}</span>
          <h2>{t(ui.methodStep1Title)}</h2>
          <p>{t(ui.methodStep1Body)}</p>
        </div>
        <div className="method-step-img">
          <img src={IMGS.fotografia} alt={t(ui.methodStep1ImgAlt)} loading="lazy" />
          <span className="method-caption">{t(ui.methodStep1Caption)}</span>
        </div>
      </section>

      <section className="method-step">
        <div className="method-step-text">
          <span className="method-num">{t(ui.methodStep2Num)}</span>
          <h2>{t(ui.methodStep2Title)}</h2>
          <p>{t(ui.methodStep2Body)}</p>
        </div>
        <div className="method-step-img">
          <img src={IMGS.fotog1} alt={t(ui.methodStep2ImgAlt)} loading="lazy" />
          <img src={IMGS.fotog2} alt={t(ui.methodStep2ImgAlt2)} loading="lazy" />
          <span className="method-caption">{t(ui.methodStep2Caption)}</span>
        </div>
      </section>

      <section className="method-step method-step--flip">
        <div className="method-step-text">
          <span className="method-num">{t(ui.methodStep3Num)}</span>
          <h2>{t(ui.methodStep3Title)}</h2>
          <p>{t(ui.methodStep3Body)}</p>
        </div>
        <div className="method-step-img">
          <img src={IMGS.bake1} alt={t(ui.methodStep3ImgAlt)} loading="lazy" />
          <img src={IMGS.bake2} alt={t(ui.methodStep3ImgAlt2)} loading="lazy" />
          <span className="method-caption">{t(ui.methodStep3Caption)}</span>
        </div>
      </section>

      <section className="method-step">
        <div className="method-step-text">
          <span className="method-num">{t(ui.methodStep4Num)}</span>
          <h2>{t(ui.methodStep4Title)}</h2>
          <p>{t(ui.methodStep4Body)}</p>
        </div>
        <div className="method-step-img">
          <img src={IMGS.unidos1} alt={t(ui.methodStep4ImgAlt)} loading="lazy" />
          <img src={IMGS.unidos2} alt={t(ui.methodStep4ImgAlt2)} loading="lazy" />
          <span className="method-caption">{t(ui.methodStep4Caption)}</span>
        </div>
      </section>

      <div className="method-result">
        <div className="method-result-text">
          <h2>{t(ui.methodResultTitle)}</h2>
          <p>{t(ui.methodResultBody)}</p>
        </div>
        <div className="method-result-fullwidth">
          <img src={IMGS.resultado} alt={t(ui.methodResultImgAlt)} loading="lazy" />
        </div>
      </div>
    </>
  );
}

// Imágenes a la misma altura con un pie común debajo.
function FigRow({ figs, caption }) {
  const t = useT();
  const items = figs.filter((d) => d.src);
  if (items.length === 0) return null;
  const text = caption ? t(caption) : '';
  return (
    <figure className="method-case-row">
      <div className="method-case-pair">
        {items.map((d) => (
          <div key={d.src} className="method-case-fig" style={{ flexGrow: d.ratio }}>
            <img src={d.src} alt={t(d.alt)} loading="lazy" />
          </div>
        ))}
      </div>
      {text && <figcaption>{text}</figcaption>}
    </figure>
  );
}

function Viewer() {
  const t = useT();
  return (
    <section className="method-case">
      <div className="method-case-extra">
        {VIEWER.map((b, i) => {
          if (b.figs) return <FigRow key={i} figs={b.figs} caption={b.caption} />;
          if (b.h) return <h2 key={i} className="method-case-sub">{t(b.h)}</h2>;
          if (b.p) return <p key={i} className="method-case-p">{t(b.p)}</p>;
          return null;
        })}
      </div>
    </section>
  );
}

export default function Method() {
  const t = useT();
  return (
    <main className="method">
      <header className="method-hero">
        <h1>{t(ui.methodTitle)}</h1>
      </header>

      <Intro />
      <Process />
      <Viewer />
    </main>
  );
}
