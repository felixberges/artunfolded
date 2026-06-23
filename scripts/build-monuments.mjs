// build-monuments.mjs
// content/*.txt  --parse-->  página neutra  --transform-->  monumento (forma de runtime)
//                 --validate (assets en public/)-->  src/data/monuments.generated.json
//
// La salida encaja 1:1 con lo que consumen App.jsx / ViewSwitcher / ViewRenderer:
//   { id, title, location, thumb, defaultView, views:[{ id, type, label, ...}] }
//
// Uso:  node scripts/build-monuments.mjs
// Ajusta rutas en CONFIG si tu árbol cambia. Los errores indican el fichero
// de página y la ruta EXACTA esperada (spec §7).

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, basename, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePage } from './lib/parse-page.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const CONFIG = {
  contentDir: join(ROOT, 'content'),
  publicDir: join(ROOT, 'public'),
  outFile: join(ROOT, 'src', 'data', 'monuments.generated.json'),

  // Rutas PÚBLICAS (lo que va en el JSON, servido desde /).
  // Convención real del repo: tiles anidados {id}/{source}/{source}.dzi
  pub: {
    tilesDzi: (id, tiles) => `/tiles/${id}/${tiles}.dzi`,
    model: (id, model) => `/models/${id}/${withGlb(model)}`,
    photo: (id, file) => `/photos/${id}/${file}`,
    diagram: (id, image) => `/diagrams/${id}/${image}`,
    // Carrusel: la ruta cuelga de la CARPETA del bloque, no del id del monumento.
    carousel: (folder, file) => `/carrusel/${folder}/${file}`,
    // Máscara de foco por punto: /masks/{id}/NN.png (NN = orden del punto, 1->01).
    mask: (id, n) => `/masks/${id}/${String(n).padStart(2, '0')}.png`,
    thumb: (id) => `/thumbs/${id}.jpg`,
  },
};

const withGlb = (m) => (extname(m) ? m : `${m}.glb`);

// Traduce la línea 'opciones:' del .txt a las opciones canónicas del carrusel.
//   ajuste=contain|cover -> fit · autoplay=<ms> -> autoplay (0=manual)
//   bucle -> loop:true   · miniaturas -> thumbnails:true · inicio=<n> -> start
function parseCarouselOptions(raw) {
  const opts = { fit: 'contain', autoplay: 0, loop: false, thumbnails: false };
  if (!raw) return opts;
  for (const tok of String(raw).split(',')) {
    const t = tok.trim();
    if (!t) continue;
    const eq = t.indexOf('=');
    const key = (eq === -1 ? t : t.slice(0, eq)).trim().toLowerCase();
    const val = (eq === -1 ? '' : t.slice(eq + 1)).trim();
    switch (key) {
      case 'ajuste': case 'fit':
        if (val === 'contain' || val === 'cover') opts.fit = val; break;
      case 'autoplay': {
        const n = parseInt(val, 10); if (!Number.isNaN(n)) opts.autoplay = n; break;
      }
      case 'bucle': case 'loop':
        opts.loop = true; break;
      case 'miniaturas': case 'thumbnails':
        opts.thumbnails = true; break;
      case 'inicio': case 'start': {
        const n = parseInt(val, 10); if (!Number.isNaN(n)) opts.start = n; break;
      }
      default: /* flag desconocida: se ignora en silencio */ break;
    }
  }
  return opts;
}

const slugByType = { article: 'article', deepzoom: 'deepzoom', model3d: 'model3d', gallery: 'gallery', diagram: 'diagram', carousel: 'carousel' };

let hadError = false;
const fail = (file, msg) => { hadError = true; console.error(`\n✗ ${basename(file)}: ${msg}`); };

function checkAsset(file, pubPath) {
  // pubPath empieza por '/', cuelga de public/
  const abs = join(CONFIG.publicDir, pubPath.replace(/^\//, ''));
  if (!existsSync(abs)) fail(file, `falta asset, se esperaba public${pubPath}`);
}

// --- Cámara del [VISOR 3D] (validación BLANDA: descarta lo inválido, avisa,
// nunca detiene el build). vec3 = [x,y,z]; pair = [min,max]. ---
const vec3 = (a) => (Array.isArray(a) && a.length === 3 && a.every(Number.isFinite) ? a : null);
const pair = (a) => (Array.isArray(a) && a.length === 2 && a.every(Number.isFinite) ? a : null);

function sanitizeCamera(cam, file, vid) {
  if (!cam) return undefined;
  const out = {};

  if (cam.orbit) {
    const o = {};
    if (vec3(cam.orbit.eye)) o.eye = cam.orbit.eye;
    else if (cam.orbit.eye) console.warn(`  · aviso: [VISOR 3D] "${vid}" 'orbita ojo' necesita 3 números; se ignora.`);
    if (vec3(cam.orbit.target)) o.target = cam.orbit.target;
    else if (cam.orbit.target) console.warn(`  · aviso: [VISOR 3D] "${vid}" 'orbita objetivo' necesita 3 números; se ignora.`);
    if (Number.isFinite(cam.orbit.focal)) o.focal = cam.orbit.focal;            // lente inicial (mm)
    if (pair(cam.orbit.focalRange)) o.focalRange = cam.orbit.focalRange;         // rango de zoom (mm)
    if (Number.isFinite(cam.orbit.fov)) o.fov = cam.orbit.fov;                   // compat (grados)
    if (Object.keys(o).length) out.orbit = o;
  }

  if (cam.eyeLevel && cam.eyeLevel.eye) {
    const eye = vec3(cam.eyeLevel.eye);
    if (!eye) {
      console.warn(`  · aviso: [VISOR 3D] "${vid}" 'ojo' necesita 3 números; eye-level desactivado.`);
    } else {
      const e = { eye };
      if (vec3(cam.eyeLevel.target)) e.target = cam.eyeLevel.target;
      if (pair(cam.eyeLevel.pan)) e.pan = cam.eyeLevel.pan;
      if (pair(cam.eyeLevel.tilt)) e.tilt = cam.eyeLevel.tilt;
      if (Number.isFinite(cam.eyeLevel.focal)) e.focal = cam.eyeLevel.focal;       // lente inicial (mm)
      if (pair(cam.eyeLevel.focalRange)) e.focalRange = cam.eyeLevel.focalRange;    // rango de zoom (mm)
      if (Number.isFinite(cam.eyeLevel.fov)) e.fov = cam.eyeLevel.fov;             // compat (grados)
      if (pair(cam.eyeLevel.fovRange)) e.fovRange = cam.eyeLevel.fovRange;         // compat (grados)
      if (!e.pan || !e.tilt) console.warn(`  · aviso: [VISOR 3D] "${vid}" eye-level sin 'pan'/'tilt' completos; el visor usará rangos por defecto.`);
      out.eyeLevel = e;
    }
  }

  return Object.keys(out).length ? out : undefined;
}

// Asigna ids estables a las vistas: usa 'id:' si el autor lo puso, si no el tipo
// (con sufijo -2, -3… si se repite). Devuelve una función resolveId(view).
function makeIdAssigner() {
  const used = new Set();
  return (view) => {
    let base = view.id || slugByType[view.type] || view.type;
    let id = base, n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    return id;
  };
}

function transform(page, file) {
  const id = page.id;
  const assignId = makeIdAssigner();
  const views = [];

  for (const v of page.views) {
    const vid = assignId(v);
    const label = v.title && Object.keys(v.title).length ? v.title : { '*': v.type };

    if (v.type === 'article') {
      views.push({ id: vid, type: 'article', label, body: v.body || {} });

    } else if (v.type === 'deepzoom') {
      if (!v.tiles) { fail(file, `[VISOR 2D] "${vid}" sin 'tiles'`); continue; }
      checkAsset(file, CONFIG.pub.tilesDzi(id, v.tiles));
      const source = {
        id: 'base',
        label,
        tileSource: CONFIG.pub.tilesDzi(id, v.tiles),
      };
      // Las anotaciones del formato alimentan la capa que quedó sin cablear en
      // DeepZoomViewer. Las dejo inline en un overlay 'annotations' listo para pintar.
      if (v.annotations?.length) {
        // Máscara de foco OPCIONAL por punto, por convención posicional
        // (/masks/{id}/NN.png). Chequeo BLANDO: si existe, se anota region.mask;
        // si no, se omite y el build sigue (a diferencia del resto de assets).
        const regions = v.annotations.map((a, i) => {
          const pub = CONFIG.pub.mask(id, i + 1);
          const abs = join(CONFIG.publicDir, pub.replace(/^\//, ''));
          return existsSync(abs) ? { ...a, mask: pub } : a;
        });
        source.overlays = [{
          id: 'notes',
          type: 'annotations',
          label: { es: 'Anotaciones', it: 'Annotazioni', en: 'Annotations' },
          regions, // [{ x, y, label:{lang}, text:{lang}, target?, mask? }]
        }];
      }
      views.push({ id: vid, type: 'deepzoom', label, sources: [source] });

    } else if (v.type === 'model3d') {
      const model = v.model || id; // si se omite, se autodetecta por id
      checkAsset(file, CONFIG.pub.model(id, model));
      const out = { id: vid, type: 'model3d', label, model: CONFIG.pub.model(id, model), options: { unlit: true } };
      const camera = sanitizeCamera(v.camera, file, vid);
      if (camera) out.camera = camera;
      views.push(out);

    } else if (v.type === 'gallery') {
      const images = (v.photos || []).map((p) => {
        checkAsset(file, CONFIG.pub.photo(id, p.file));
        return { src: CONFIG.pub.photo(id, p.file), caption: p.caption || {} };
      });
      views.push({ id: vid, type: 'gallery', label, images });

    } else if (v.type === 'diagram') {
      if (v.image) checkAsset(file, CONFIG.pub.diagram(id, v.image));
      const hotspots = (v.points || []).map((p) => ({
        x: p.x, y: p.y, label: p.text || {}, ...(p.target ? { linksTo: p.target } : {}),
      }));
      views.push({ id: vid, type: 'diagram', label, image: v.image ? CONFIG.pub.diagram(id, v.image) : undefined, caption: label, hotspots });

    } else if (v.type === 'carousel') {
      if (!v.folder) { fail(file, `[CARRUSEL] "${vid}" sin 'carpeta'`); continue; }
      const images = (v.images || []).map((im) => {
        checkAsset(file, CONFIG.pub.carousel(v.folder, im.file));
        return { src: CONFIG.pub.carousel(v.folder, im.file), caption: im.caption || {} };
      });
      if (!images.length) fail(file, `[CARRUSEL] "${vid}" sin imágenes`);
      views.push({ id: vid, type: 'carousel', label, images, options: parseCarouselOptions(v.options) });
    }
  }

  // defaultView: la imagen desplegada si existe, si no la primera vista.
  const dz = views.find((v) => v.type === 'deepzoom');
  const defaultView = (dz || views[0])?.id;

  // Miniatura (aviso, no error)
  if (!existsSync(join(CONFIG.publicDir, CONFIG.pub.thumb(id).replace(/^\//, '')))) {
    console.warn(`  · aviso: sin miniatura, se esperaba public${CONFIG.pub.thumb(id)}`);
  }

  return {
    id,
    title: page.title || {},
    location: page.location || {},
    thumb: CONFIG.pub.thumb(id),
    defaultView,
    views,
  };
}

function build() {
  if (!existsSync(CONFIG.contentDir)) { console.error(`No existe ${CONFIG.contentDir}`); process.exit(1); }
  const files = readdirSync(CONFIG.contentDir).filter((f) => f.endsWith('.txt'));
  const monuments = [];

  for (const f of files) {
    const file = join(CONFIG.contentDir, f);
    const id = basename(f, '.txt');
    const page = parsePage(readFileSync(file, 'utf8'), { id });
    for (const w of page.warnings) console.warn(`  · ${f}: ${w}`);
    monuments.push(transform(page, file));
  }

  if (hadError) { console.error('\nBuild detenido: faltan assets (ver arriba).'); process.exitCode = 1; return; }

  mkdirSync(dirname(CONFIG.outFile), { recursive: true });
  writeFileSync(CONFIG.outFile, JSON.stringify(monuments, null, 2) + '\n');
  console.log(`✓ ${monuments.length} monumento(s) -> ${CONFIG.outFile.replace(ROOT + '/', '')}`);
}

build();
