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
//   - GIRO DE VISTA (rotate CW/CCW): algunos desplegables no quedan "derechos"
//     a la vista por cómo se orientó la captura. Los botones giran el
//     viewport de OSD alrededor de su CENTRO ACTUAL (sin tocar el zoom, para
//     no marear). Los PINES se añaden con rotationMode: NO_ROTATION (nativo
//     de OSD): su POSICIÓN sigue la rotación (quedan anclados al punto real
//     de la imagen) pero su CONTENIDO no gira, así el rótulo es siempre
//     legible. El velo de foco (scrim) usa el modo por defecto (EXACT): debe
//     girar junto con la imagen porque está calado sobre ella. El botón Home
//     nativo de OSD no restaura la rotación (comportamiento conocido de la
//     librería), así que el evento 'home' del viewer se engancha para
//     forzarla a 0.
//   - AYUDA: <HelpOverlay type="deepzoom"/> es HERMANO del div de OSD (no
//     hijo), para que la rueda/doble clic sobre el panel no lleguen al visor.
//     Se apila en la columna de la derecha, bajo los botones de giro.
//   - BOTONES PROPIOS (arriba a la izquierda): acercar, alejar, inicio y
//     pantalla completa. Sustituyen a los de OSD (PNG pequeñas con degradado,
//     poco legibles); mismo estilo que los de giro. Iconos en SVG.
//   - PANTALLA COMPLETA con la API del navegador sobre el CONTENEDOR
//     (stage-wrap), no con la de OSD: así los botones, la ayuda y el aviso
//     siguen visibles, porque son hermanos del div de OSD. Mientras dura, un
//     aviso fijo abajo recuerda que se sale con Esc, con un botón de salir
//     para tabletas (sin tecla Esc). Si el navegador no la permite (iPhone),
//     el botón no aparece.

import { useEffect, useRef, useState } from 'react';
import OpenSeadragon from 'openseadragon';
import { useT, useLang } from './i18n';
import { ui } from './strings';
import HelpOverlay from './HelpOverlay';
import { ToolButton, ViewerToolbar, FullscreenHint, useFullscreen } from './viewerUI';
import './annotations.css';

const OSD_PREFIX = '/openseadragon/images/';

// Paso de giro por click, en grados. CCW = negativo, CW = positivo.
const ROTATE_STEP = 15;

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
const SPOTLIGHT_DARKNESS = 0.3;
// Fundido de entrada/salida del velo, en ms.
const SPOTLIGHT_FADE_MS = 220;

// Modo autor: activo cuando la URL contiene ?author=1 (o ?author=true).
// En producción (sin ese parámetro) es completamente invisible.
// Uso: abre la web con ?author=1, haz clic sobre la imagen -> la consola
// imprime la línea 'punto: x, y' lista para pegar en el .txt.
const AUTHOR_MODE = new URLSearchParams(window.location.search).get('author') === '1';

export default function DeepZoomViewer({ sources = [], activeAnno = null, onSelectAnno, options = {} }) {
  const t = useT();
  const { lang } = useLang();
  const [activeId, setActiveId] = useState(sources[0]?.id);
  const active = sources.find((s) => s.id === activeId) ?? sources[0];

  const containerRef = useRef(null);
  const wrapRef = useRef(null);   // stage-wrap: lo que se pone a pantalla completa
  const fs = useFullscreen(wrapRef);
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
  const spotMaskImgRef = useRef(null);    // imagen de máscara cargada (para repintar)
  const applySpotlightRef = useRef(() => {});
  const updateMaskPositionRef = useRef(() => {});

  // --- refs del giro de vista ---
  const rotateByRef = useRef(() => {});   // expone la función de giro al JSX

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
  const [authorPoints, setAuthorPoints] = useState([]); // modo autor: puntos acumulados

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
      showNavigationControl: false,   // botones propios (ver toolbar)
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
      const hasActive = activeAnnoRef.current != null;
      pinsRef.current.forEach((el, i) => {
        if (!el) return;
        // Con selección: solo el pin activo visible. Sin selección: todos con zoom.
        const op = hasActive ? (i === activeAnnoRef.current ? 1 : 0) : base;
        el.style.opacity = String(op);
        el.style.pointerEvents = op < 0.05 ? 'none' : 'auto';
      });
      // Velo: siempre al 70% al seleccionar, sin depender del zoom.
      if (scrimRef.current) {
        scrimRef.current.style.opacity = spotIndexRef.current != null ? '1' : '0';
      }
    };
    revealRef.current = updateReveal;

    // Gira el viewport desde su centro actual, sin cambiar el zoom.
    const rotateBy = (deltaDeg) => {
      const v = viewerRef.current;
      if (!v) return;
      const vp = v.viewport;
      const current = vp.getRotation();
      vp.setRotation(current + deltaDeg, vp.getCenter(true));
    };
    rotateByRef.current = rotateBy;

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
    // Sistema de velo con DOS CAPAS CSS fuera de OSD — sin canvas, sin overlay OSD.
    // El overlay de OSD se mueve con la imagen (correcto para pins), pero para el
    // velo necesitamos cubrir el VIEWPORT completo, no la imagen. Por eso usamos
    // un div CSS position:absolute sobre el contenedor del viewer.
    //
    // Capa 1: div oscuro uniforme (el velo)
    // Capa 2: <img> de la máscara PNG con mix-blend-mode:screen — donde la máscara
    //         es blanca, 'screen' contra el negro del velo = negro (sin efecto).
    //         Donde la máscara es negra/transparente, el velo oscuro se ve completo.
    //         Así el "agujero" es donde la máscara es blanca/opaca: justo lo que queremos.
    //
    // La máscara se posiciona como overlay de OSD (sobre la imagen) para que
    // se mueva y escale con el zoom — solo la capa oscura es fija sobre el viewport.

    const addScrim = () => {
      const container = containerRef.current;
      if (!container) return;
      container.style.position = 'relative';
      const canvas = document.createElement('canvas');
      canvas.style.cssText = `position:absolute;inset:0;z-index:5;
        pointer-events:none;opacity:0;
        transition:opacity ${SPOTLIGHT_FADE_MS}ms ease;will-change:opacity;`;
      container.appendChild(canvas);
      scrimRef.current = canvas;
      scrimCanvasRef.current = canvas;
    };

    const applySpotlight = (i) => {
      if (!scrimRef.current) return;
      const token = ++spotTokenRef.current;
      const url = i != null ? maskUrl(i) : null;
      if (!url) { spotIndexRef.current = null; spotMaskImgRef.current = null; updateReveal(); return; }
      loadMask(url).then((img) => {
        if (token !== spotTokenRef.current) return;
        spotMaskImgRef.current = img;
        spotIndexRef.current = i;
        paintScrim();
        updateReveal();
      }).catch(() => {
        if (token === spotTokenRef.current) { spotIndexRef.current = null; spotMaskImgRef.current = null; updateReveal(); }
      });
    };
    applySpotlightRef.current = applySpotlight;

    // Pinta el velo + agujero de máscara en el canvas, con rotación real de OSD.
    const paintScrim = () => {
      const canvas = scrimCanvasRef.current;
      const img = spotMaskImgRef.current;
      const v = viewerRef.current;
      const container = containerRef.current;
      if (!canvas || !v || !container) return;
      const cw = container.offsetWidth;
      const ch = container.offsetHeight;
      if (!cw || !ch) return;
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, cw, ch);
      // Pintar siempre el velo oscuro, con o sin máscara.
      ctx.fillStyle = `rgba(0,0,0,${SPOTLIGHT_DARKNESS})`;
      ctx.fillRect(0, 0, cw, ch);
      if (!img || spotIndexRef.current == null) return;

      const item = v.world.getItemAt(0);
      if (!item) return;

      // Obtener los 4 vértices de la imagen en coordenadas del elemento viewer
      // (píxeles relativos al div contenedor) — funciona con cualquier versión de OSD.
      const imgSize = item.getContentSize();
      const toEl = (ix, iy) => {
        const vp = item.imageToViewportCoordinates(ix, iy);
        return v.viewport.viewportToViewerElementCoordinates(vp);
      };
      const tl = toEl(0, 0);
      const tr = toEl(imgSize.x, 0);
      const bl = toEl(0, imgSize.y);

      // Construir la matriz de transformación 2D que mapea coordenadas de imagen
      // a coordenadas del canvas (incluye zoom, paneo y rotación).
      const ax = tr.x - tl.x, ay = tr.y - tl.y;
      const bx = bl.x - tl.x, by = bl.y - tl.y;

      ctx.save();
      ctx.transform(ax / imgSize.x, ay / imgSize.x,
                    bx / imgSize.y, by / imgSize.y,
                    tl.x, tl.y);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(img, 0, 0, imgSize.x, imgSize.y);
      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
    };
    updateMaskPositionRef.current = paintScrim;

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
        viewer.addOverlay({
          element: el,
          location: pt,
          placement: OpenSeadragon.Placement.CENTER,
          rotationMode: OpenSeadragon.OverlayRotationMode.NO_ROTATION,
        });

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

    // El botón Home nativo de OSD no restaura la rotación por sí solo
    // (comportamiento conocido de la librería) — la forzamos a 0 aquí.
    const onHome = () => {
      viewerRef.current?.viewport.setRotation(0, viewerRef.current.viewport.getCenter(true));
    };

    viewer.addHandler('open', onOpen);
    const onZoomOrPan = () => { updateReveal(); updateMaskPositionRef.current(); };
    viewer.addHandler('zoom', onZoomOrPan);
    viewer.addHandler('animation', onZoomOrPan);
    viewer.addHandler('home', onHome);
    viewer.addHandler('rotate', onZoomOrPan);
    // Al entrar/salir de pantalla completa cambia el tamaño: repinta el velo.
    viewer.addHandler('resize', onZoomOrPan);

    // --- Modo autor: doble clic -> añade punto al panel superpuesto -----------
    if (AUTHOR_MODE) {
      const container = containerRef.current;
      if (container) container.style.cursor = 'crosshair';

      const onAuthorClick = (event) => {
        const item = viewer.world.getItemAt(0);
        if (!item) return;
        const size = item.getContentSize();
        const vpPoint = viewer.viewport.pointFromPixel(event.position);
        const img = viewer.viewport.viewportToImageCoordinates(vpPoint);
        const x = (img.x / size.x).toFixed(4);
        const y = (img.y / size.y).toFixed(4);
        setAuthorPoints((prev) => [...prev, `punto:${x}, ${y}`]);
      };
      viewer.addHandler('canvas-double-click', onAuthorClick);
    }

    return () => {
      viewer.destroy();
      viewerRef.current = null;
      pinsRef.current = [];
      labelsRef.current = [];
      pointsRef.current = [];
      if (scrimRef.current?.parentNode) scrimRef.current.parentNode.removeChild(scrimRef.current);
      scrimRef.current = null;
      scrimCanvasRef.current = null;
      spotIndexRef.current = null;
      spotMaskImgRef.current = null;
      rotateByRef.current = () => {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

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
    pinsRef.current.forEach((el, i) => {
      if (!el) return;
      el.classList.toggle('is-active', i === activeAnno);
      if (activeAnno != null) {
        el.style.opacity = i === activeAnno ? '1' : '0';
        el.style.pointerEvents = i === activeAnno ? 'auto' : 'none';
      }
    });
    // Mostrar el scrim inmediatamente al seleccionar (sin esperar a loadMask).
    // applySpotlight pintará el agujero cuando la máscara cargue; si no hay
    // máscara quedará el velo sólido, que también es válido.
    if (scrimRef.current) {
      scrimRef.current.style.opacity = activeAnno != null ? '1' : '0';
    }
    revealRef.current();
    applySpotlightRef.current(activeAnno);
    if (activeAnno != null && pointsRef.current[activeAnno] && viewerRef.current) {
      viewerRef.current.viewport.panTo(pointsRef.current[activeAnno], false);
    }
  }, [activeAnno]);

  // dir: +1 acercar, -1 alejar
  const zoomStep = (dir) => {
    const factor = dir > 0 ? 1.5 : 1 / 1.5;
    const vp = viewerRef.current?.viewport;
    if (!vp) return;
    vp.zoomBy(factor);
    vp.applyConstraints();
  };
  const goHome = () => {
    const vp = viewerRef.current?.viewport;
    if (!vp) return;
    vp.setRotation(0, vp.getCenter(true));
    vp.goHome();
  };
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
      <div className={'deepzoom-stage-wrap au-fs-root' + (fs.isFs ? ' is-fullscreen' : '')} style={stageWrap} ref={wrapRef}>
        <div className="deepzoom-stage" ref={containerRef} />

        <ViewerToolbar onZoom={zoomStep} onHome={goHome} fs={fs} style={wrapTL} />
        <FullscreenHint fs={fs} />

        {AUTHOR_MODE && (
          <div style={authorPanel}>
            <div style={authorHeader}>
              <span>✎ AUTOR — doble clic = punto</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  style={authorBtn}
                  onClick={() => {
                    navigator.clipboard?.writeText(authorPoints.join('\n'));
                  }}
                  title="Copiar todo al portapapeles"
                >
                  copiar
                </button>
                <button
                  type="button"
                  style={authorBtn}
                  onClick={() => setAuthorPoints([])}
                  title="Limpiar lista"
                >
                  limpiar
                </button>
              </div>
            </div>
            <pre style={authorPre}>
              {authorPoints.length === 0
                ? '(doble clic sobre la imagen)'
                : authorPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}
            </pre>
          </div>
        )}

        {options.rotate !== false && (
          <div style={wrapTR}>
            <ToolButton icon="rotCCW" label={t(ui.viewerRotateCCW)} onClick={() => rotateByRef.current(-ROTATE_STEP)} />
            <ToolButton icon="rotCW" label={t(ui.viewerRotateCW)} onClick={() => rotateByRef.current(ROTATE_STEP)} />
          </div>
        )}

        <HelpOverlay
          type="deepzoom"
          style={options.rotate !== false ? helpBelowRotate : helpTR}
        />
      </div>

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

// --- estilos inline (coherentes con ObjectViewer/ModelViewer) ---
const stageWrap = { position: 'relative', width: '100%', height: '100%' };
// Ayuda en la misma columna que los botones de giro (2 × 40px + 2 × 6px de gap).
const helpTR = { top: 20, right: 20 };
const helpBelowRotate = { top: 20 + 2 * 40 + 2 * 6, right: 20 };
const wrapTL = { position: 'absolute', top: 20, left: 20, zIndex: 11 };
const wrapTR = { position: 'absolute', top: 20, right: 20, zIndex: 11, display: 'flex', flexDirection: 'column', gap: 6 };
const authorPanel = {
  position: 'absolute', bottom: 16, left: 16, zIndex: 20,
  width: 280, maxHeight: 220,
  display: 'flex', flexDirection: 'column',
  background: 'rgba(20,10,5,0.92)', border: '1px solid rgba(176,137,83,0.5)',
  borderRadius: 6, backdropFilter: 'blur(8px)', overflow: 'hidden',
};
const authorHeader = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '6px 10px',
  fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.68rem',
  letterSpacing: '0.08em', color: '#b08953',
  borderBottom: '1px solid rgba(176,137,83,0.25)',
};
const authorBtn = {
  fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.65rem',
  padding: '2px 7px', borderRadius: 3, cursor: 'pointer',
  background: 'rgba(176,137,83,0.18)', border: '1px solid rgba(176,137,83,0.4)',
  color: '#d8b988',
};
const authorPre = {
  margin: 0, padding: '8px 10px',
  fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.7rem',
  lineHeight: 1.6, color: '#e9e7e2',
  overflowY: 'auto', flex: 1,
  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
};
