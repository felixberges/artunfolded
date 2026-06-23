// DeepZoomViewer.jsx — OpenSeadragon + capa de anotaciones.
//   - sources (cambiador si hay >1) y overlays de imagen (IR/UV) con opacidad
//   - PINES de anotación: 'punto' en fracción 0..1 (0,0 = arriba-izquierda),
//     anclados a la imagen. Selección coordinada con el panel (activeAnno).
//   - REVELADO POR ZOOM: ocultos de lejos, aparecen con fundido al acercarse.
//   - ROTULO DEL PIN: muestra el "info visor" (region.label), ej. "1 · Título…".
//     El "info anotaciones" (region.text) va al panel derecho, no aquí.
//   - FOCO (spotlight): al SELECCIONAR un punto con máscara, se oscurece todo
//     menos su zona de interés. La máscara es una PNG de COBERTURA a marco
//     completo (blanco opaco = zona, transparente = fuera). El velo se construye
//     en runtime calando el agujero con esa máscara (destination-out). Un único
//     velo reutilizable, no uno por punto. Fuente de verdad: region.mask, que
//     escribe build-monuments si /masks/{id}/NN.png existe (NN = orden del punto).

import { useEffect, useRef, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import { useT, useLang } from './i18n';
import { ui } from './strings';
import './annotations.css';

const OSD_PREFIX = '/openseadragon/images/';

// Umbrales de revelado, en ratio zoom/zoom-de-ajuste (home).
//   < REVEAL_MIN  -> ocultos;  > REVEAL_MAX -> del todo visibles.
const REVEAL_MIN = 1.3;
const REVEAL_MAX = 2.2;
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// --- FOCO (spotlight) ---------------------------------------------------------
// Opacidad del velo oscuro FUERA de la zona (0..1). La zona queda al 100%.
const SPOTLIGHT_DARKNESS = 0.6;
// Fundido de entrada/salida del velo, en ms.
const SPOTLIGHT_FADE_MS = 220;

export default function DeepZoomViewer({ sources = [], activeAnno = null, onSelectAnno }) {
  const t = useT();
  const { lang } = useLang();
  const [activeId, setActiveId] = useState(sources[0]?.id);
  const active = sources.find((s) => s.id === activeId) ?? sources[0];

  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const pinsRef = useRef([]);     // botones (pin) DOM
  const labelsRef = useRef([]);   // <span> del rótulo de cada pin
  const pointsRef = useRef([]);   // OpenSeadragon.Point (viewport)
  const revealRef = useRef(() => {});
  const onSelectRef = useRef(onSelectAnno);
  const activeAnnoRef = useRef(activeAnno);
  onSelectRef.current = onSelectAnno;
  activeAnnoRef.current = activeAnno;

  // --- refs del foco ---
  const scrimRef = useRef(null);          // <div> velo, overlay a marco completo
  const scrimCanvasRef = useRef(null);    // <canvas> donde se cala el agujero
  const maskCacheRef = useRef(new Map()); // url -> Promise<HTMLImageElement>
  const spotTokenRef = useRef(0);         // anti-carrera al cambiar de selección
  const spotIndexRef = useRef(null);      // índice con foco activo (o null)
  const applySpotlightRef = useRef(() => {});

  const imageOverlays = (active?.overlays ?? []).filter((o) => o.type === 'image');
  const regions = (active?.overlays ?? []).find((o) => o.type === 'annotations')?.regions ?? [];

  // Rótulo del pin = "info visor" (label). Anteponemos el número para que el
  // punto del visor y el ítem del panel queden ligados (1 ↔ 1).
  // Si no quieres el número, deja:  return txt || String(i + 1);
  const pinLabel = (region, i) => {
    const txt = t(region?.label);
    return txt ? `${i + 1} · ${txt}` : String(i + 1);
  };

  const [opacities, setOpacities] = useState({});

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const tileSources = [
      { tileSource: active.tileSource, opacity: 1 },
      ...imageOverlays.map((o) => ({ tileSource: o.tileSource, opacity: o.opacity ?? 0 })),
    ];

    const viewer = OpenSeadragon({
      element: containerRef.current,
      prefixUrl: OSD_PREFIX,
      tileSources,
      showNavigationControl: true,
      showNavigator: false,
      gestureSettingsMouse: { clickToZoom: false },
      visibilityRatio: 1,
      minZoomImageRatio: 0.8,
    });
    viewerRef.current = viewer;

    const seed = {};
    imageOverlays.forEach((o) => { seed[o.id] = o.opacity ?? 0; });
    setOpacities(seed);

    // Opacidad de cada pin según el zoom (el activo siempre visible).
    // El velo del foco se desvanece con el mismo factor de revelado: al alejar
    // (por debajo del umbral) se va; al acercar, vuelve.
    const updateReveal = () => {
      const v = viewerRef.current;
      if (!v) return;
      const home = v.viewport.getHomeZoom();
      const ratio = home ? v.viewport.getZoom(true) / home : 1;
      const base = smoothstep(REVEAL_MIN, REVEAL_MAX, ratio);
      pinsRef.current.forEach((el, i) => {
        if (!el) return;
        const op = i === activeAnnoRef.current ? 1 : base;
        el.style.opacity = String(op);
        el.style.pointerEvents = op < 0.05 ? 'none' : 'auto';
      });
      // Velo del foco: visible solo si hay punto enfocado, modulado por zoom.
      if (scrimRef.current) {
        const on = spotIndexRef.current != null;
        scrimRef.current.style.opacity = on ? String(base) : '0';
      }
    };
    revealRef.current = updateReveal;

    // Ruta de la máscara de cobertura para la región i. La escribe
    // build-monuments en region.mask si /masks/{id}/NN.png existe; si no, null.
    const maskUrl = (i) => regions[i]?.mask ?? null;

    // Carga (con caché) de la imagen de máscara.
    const loadMask = (url) => {
      const cache = maskCacheRef.current;
      if (cache.has(url)) return cache.get(url);
      const p = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
      cache.set(url, p);
      return p;
    };

    // Velo oscuro a marco completo (overlay alineado a la imagen). Se calará el
    // agujero al seleccionar un punto. Pines por encima (se añaden después).
    const addScrim = () => {
      const item = viewer.world.getItemAt(0);
      if (!item) return;
      const el = document.createElement('div');
      el.className = 'au-spotlight';
      el.style.pointerEvents = 'none';
      el.style.opacity = '0';
      el.style.transition = `opacity ${SPOTLIGHT_FADE_MS}ms ease`;
      el.style.willChange = 'opacity';
      const canvas = document.createElement('canvas');
      canvas.className = 'au-spotlight-canvas';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      el.appendChild(canvas);
      scrimRef.current = el;
      scrimCanvasRef.current = canvas;
      viewer.addOverlay({ element: el, location: item.getBounds() });
    };

    // Prepara el velo para el índice i (o lo apaga si i==null o no hay máscara).
    // La opacidad final la pone updateReveal (modulada por zoom): aquí solo se
    // dibuja el agujero y se registra qué punto está enfocado.
    const applySpotlight = (i) => {
      const scrim = scrimRef.current;
      const canvas = scrimCanvasRef.current;
      if (!scrim || !canvas) return;
      const token = ++spotTokenRef.current; // invalida cargas anteriores en vuelo
      const url = i != null ? maskUrl(i) : null;
      if (!url) { spotIndexRef.current = null; updateReveal(); return; }
      loadMask(url)
        .then((img) => {
          if (token !== spotTokenRef.current) return; // la selección ya cambió
          const w = img.naturalWidth, h = img.naturalHeight;
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, w, h);
          // 1) velo uniforme oscuro
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = `rgba(0,0,0,${SPOTLIGHT_DARKNESS})`;
          ctx.fillRect(0, 0, w, h);
          // 2) calar el agujero donde la máscara es opaca (borde plumeado -> suave)
          ctx.globalCompositeOperation = 'destination-out';
          ctx.drawImage(img, 0, 0, w, h);
          ctx.globalCompositeOperation = 'source-over';
          spotIndexRef.current = i;
          updateReveal();
        })
        .catch(() => { if (token === spotTokenRef.current) { spotIndexRef.current = null; updateReveal(); } });
    };
    applySpotlightRef.current = applySpotlight;

    const addPins = () => {
      pinsRef.current = [];
      labelsRef.current = [];
      pointsRef.current = [];
      const item = viewer.world.getItemAt(0);
      if (!item) return;
      const size = item.getContentSize();
      regions.forEach((a, i) => {
        const pt = item.imageToViewportCoordinates(a.x * size.x, a.y * size.y);

        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'au-anno-pin';
        el.style.transition = 'none';       // el fundido lo da el zoom continuo
        el.style.opacity = '0';
        el.setAttribute('aria-label', t(a.label) || `Punto ${i + 1}`);

        // Construimos los nodos a mano (sin innerHTML) para volcar el texto de
        // datos de forma segura y poder reescribirlo al cambiar de idioma.
        const dot = document.createElement('span');
        dot.className = 'au-anno-dot';
        const lab = document.createElement('span');
        lab.className = 'au-anno-label';
        lab.textContent = pinLabel(a, i);
        el.append(dot, lab);

        el.addEventListener('pointerdown', (e) => e.stopPropagation());
        el.addEventListener('click', (e) => { e.stopPropagation(); onSelectRef.current?.(i); });
        viewer.addOverlay({ element: el, location: pt, placement: OpenSeadragon.Placement.CENTER });

        pinsRef.current[i] = el;
        labelsRef.current[i] = lab;
        pointsRef.current[i] = pt;
      });
      updateReveal();
    };

    // Al abrir: primero el velo (queda DEBAJO), luego los pines (ENCIMA), y
    // re-aplica el foco por si ya había un punto seleccionado.
    const onOpen = () => {
      addScrim();
      addPins();
      applySpotlight(activeAnnoRef.current);
    };

    viewer.addHandler('open', onOpen);
    viewer.addHandler('zoom', updateReveal);
    viewer.addHandler('animation', updateReveal);

    return () => {
      viewer.destroy();
      viewerRef.current = null;
      pinsRef.current = [];
      labelsRef.current = [];
      pointsRef.current = [];
      scrimRef.current = null;
      scrimCanvasRef.current = null;
      spotIndexRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id]);

  // Reescribe los rótulos al cambiar de idioma SIN reinicializar el visor
  // (los pines se montan de forma imperativa y su efecto no depende de lang).
  useEffect(() => {
    labelsRef.current.forEach((lab, i) => {
      if (lab) lab.textContent = pinLabel(regions[i], i);
    });
    pinsRef.current.forEach((el, i) => {
      if (el) el.setAttribute('aria-label', t(regions[i]?.label) || `Punto ${i + 1}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Resalta el pin seleccionado, lo fuerza visible, enciende el foco y centra.
  useEffect(() => {
    pinsRef.current.forEach((el, i) => el && el.classList.toggle('is-active', i === activeAnno));
    revealRef.current();
    applySpotlightRef.current(activeAnno);
    if (activeAnno != null && pointsRef.current[activeAnno] && viewerRef.current) {
      viewerRef.current.viewport.panTo(pointsRef.current[activeAnno], false);
    }
  }, [activeAnno]);

  function setOverlayOpacity(overlayId, value) {
    const idx = imageOverlays.findIndex((o) => o.id === overlayId);
    const item = viewerRef.current?.world.getItemAt(idx + 1);
    if (item) item.setOpacity(value);
    setOpacities((prev) => ({ ...prev, [overlayId]: value }));
  }

  if (!active) return null;

  const hasControls = sources.length > 1 || imageOverlays.length > 0;

  return (
    <div className="deepzoom">
      <div className="deepzoom-stage" ref={containerRef} />

      {hasControls && (
        <aside className="deepzoom-controls">
          {sources.length > 1 && (
            <section className="control-group">
              <h4 className="control-title">{t(ui.source)}</h4>
              {sources.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={'source-btn' + (s.id === activeId ? ' is-active' : '')}
                  onClick={() => setActiveId(s.id)}
                >
                  {t(s.label)}
                </button>
              ))}
            </section>
          )}

          {imageOverlays.length > 0 && (
            <section className="control-group">
              <h4 className="control-title">{t(ui.layers)}</h4>
              {imageOverlays.map((o) => (
                <label key={o.id} className="overlay-control">
                  <span>{t(o.label)}</span>
                  <input
                    type="range" min="0" max="1" step="0.01"
                    value={opacities[o.id] ?? 0}
                    onChange={(e) => setOverlayOpacity(o.id, Number(e.target.value))}
                  />
                </label>
              ))}
            </section>
          )}
        </aside>
      )}
    </div>
  );
}
