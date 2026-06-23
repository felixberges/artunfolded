// parse-page.mjs
// Parser del formato de autoría de páginas de Art Unfolded.
// Entrada: texto de un fichero content/{id}.txt
// Salida: objeto de página { id, title, location, views[] }
//
// Reglas (ver borrador de especificación):
// - Cabecera de bloque: [TIPO] en su propia línea.
// - Dentro del bloque, pares clave: valor.
// - Texto localizado en sub-líneas es: / it: / en: ...
//   · "es: texto"   -> valor de una sola línea.
//   · "es:" (vacío) -> abre captura multilínea hasta la siguiente marca o línea en blanco.
// - "titulo:" / "ubicacion:" abren un campo localizado.
//   · Si llevan valor en la misma línea (p. ej. "titulo: desplegable de la cupula")
//     ese valor es COMPARTIDO entre idiomas y se guarda bajo la clave "*".
// - "punto: x, y [-> destino]" abre una anotación; sus sub-líneas es:/it:/en: son su texto.
// - "foto: archivo" abre un elemento de galería; sus sub-líneas son el pie.
// - "imagen: archivo" en [CARRUSEL] abre un elemento; "pie:" abre su pie localizado.
//   "carpeta:" fija la subcarpeta de public/carrusel/ y "opciones:" se traduce en el build.
// - Una LÍNEA EN BLANCO cierra el campo localizado actual y vuelve al cuerpo por defecto.
//   (por eso, en [TEXTO], el cuerpo tras "titulo:" necesita una línea en blanco de separación)
// - Las líneas que empiezan por # son comentarios.
// - El orden de los bloques = el orden de las pestañas (vistas).

const LANGS = ['es', 'it', 'en', 'fr', 'de', 'pt', 'ca'];
const LANG_RE = new RegExp(`^(${LANGS.join('|')})\\s*:(.*)$`);
const KEY_RE = /^([A-Za-z_][\w\- ]*?)\s*:(.*)$/;
const BLOCK_RE = /^\[(.+?)\]$/;

// Tipo de bloque (cabecera) -> tipo de vista en la app. Nombres provisionales.
const BLOCK_TYPES = {
  'TITULO': 'title',
  'TEXTO': 'article',
  'VISOR 2D': 'deepzoom',
  'VISOR 3D': 'model3d',
  'GALERIA': 'gallery',
  'ESQUEMA': 'diagram',
  'CARRUSEL': 'carousel',
};

const POINT_RE = /^([0-9]*\.?[0-9]+)\s*,\s*([0-9]*\.?[0-9]+)\s*(?:->\s*(\S+))?$/;

// Lista de números: tolera comas y/o espacios e ignora comentarios '#'.
//   "1.2, 3, -4" | "1.2 3 -4" | "15 105  # comentario" -> [..]
const numList = (v) =>
  String(v).split('#')[0].split(/[\s,]+/).map((s) => parseFloat(s)).filter((n) => !Number.isNaN(n));

export function parsePage(text, { id = null } = {}) {
  const warnings = [];
  const warn = (msg) => warnings.push(msg);

  // --- 1. Trocear en bloques crudos respetando el orden ---
  const rawLines = text.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let current = null;

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) continue; // comentario

    const mBlock = trimmed.match(BLOCK_RE);
    if (mBlock) {
      const header = mBlock[1].trim();
      const type = BLOCK_TYPES[header];
      if (!type) warn(`Bloque desconocido [${header}] (línea ${i + 1}); se ignora.`);
      current = { header, type, lines: [], lineNo: i + 1 };
      if (type) blocks.push(current);
      else current = null;
      continue;
    }
    if (current) current.lines.push({ text: line, no: i + 1 });
  }

  // --- 2. Parsear cada bloque ---
  const views = [];
  let pageTitle = {};
  let pageLocation = null;

  for (const block of blocks) {
    const parsed = parseBlock(block, warn);
    if (block.type === 'title') {
      pageTitle = parsed.title || {};
      pageLocation = parsed.location || null;
    } else {
      views.push(parsed.view);
    }
  }

  return { id, title: pageTitle, location: pageLocation, views, warnings };
}

function parseBlock(block, warn) {
  const type = block.type;

  // Mapas localizados del bloque
  const title = {};
  const body = {};
  let location = null; // sólo en [TITULO]
  const annotations = []; // [VISOR 2D] / [ESQUEMA]
  const photos = []; // [GALERIA]
  const images = []; // [CARRUSEL]
  let tiles = null, model = null, image = null;
  let folder = null; // [CARRUSEL] carpeta
  let options = null; // [CARRUSEL] línea 'opciones' en crudo (la traduce el build)
  let blockId = null; // 'id:' opcional, para defaultView / destinos de '-> '
  // [VISOR 3D] cámara: órbita (inicial opcional) y eye-level (si hay 'ojo').
  const cam = { orbit: {}, eyeLevel: {} };

  // Campo por defecto al que van las sub-líneas es:/it:/en: sin marca previa.
  const defaultTarget = type === 'article' ? body : title;

  let currentTarget = defaultTarget; // mapa localizado activo
  let capture = null; // { target, lang } si hay captura multilínea abierta
  let currentAnno = null; // anotación activa, para sus sub-campos info visor/anotaciones
  let currentImage = null; // imagen activa del carrusel, para su 'pie'

  const endCapture = () => { capture = null; };

  for (const { text, no } of block.lines) {
    const trimmed = text.trim();

    // Línea en blanco: cierra captura y vuelve al cuerpo por defecto.
    if (trimmed === '') {
      endCapture();
      currentTarget = defaultTarget;
      continue;
    }

    // ¿Sub-línea de idioma?
    const mLang = trimmed.match(LANG_RE);
    if (mLang) {
      const lang = mLang[1];
      const value = mLang[2].trim();
      if (value !== '') {
        currentTarget[lang] = value; // valor de una línea
        endCapture();
      } else {
        currentTarget[lang] = ''; // abre multilínea
        capture = { target: currentTarget, lang };
      }
      continue;
    }

    // ¿Clave estructural / con nombre?
    const mKey = trimmed.match(KEY_RE);
    if (mKey) {
      endCapture();
      const key = mKey[1].trim().toLowerCase().replace(/\s+/g, ' ');
      const value = mKey[2].trim();

      switch (key) {
        case 'id':
          blockId = value; break;
        case 'tiles':
          tiles = value; break;
        case 'modelo':
        case 'model':
          model = value; break;
        case 'imagen':
        case 'image':
          if (type === 'carousel') {
            // En el carrusel, cada 'imagen:' abre un ítem; sus sub-líneas (vía 'pie:')
            // son el pie localizado. Comportamiento análogo a 'foto'/'punto'.
            const img = { file: value, caption: {} };
            images.push(img);
            currentImage = img;
            currentTarget = img.caption;
          } else {
            image = value; // [ESQUEMA]: imagen única del diagrama
          }
          break;
        case 'carpeta':
        case 'folder':
          folder = value; break;
        case 'opciones':
        case 'options':
          options = value; break; // se traduce en build-monuments.mjs
        case 'titulo':
        case 'title':
          currentTarget = title;
          if (value !== '') title['*'] = value; // compartido entre idiomas
          break;
        case 'ubicacion':
        case 'location':
          if (location === null) location = {};
          currentTarget = location;
          if (value !== '') location['*'] = value;
          break;
        case 'foto':
        case 'photo': {
          const photo = { file: value, caption: {} };
          photos.push(photo);
          currentTarget = photo.caption;
          break;
        }
        case 'punto':
        case 'point': {
          const mp = value.match(POINT_RE);
          if (!mp) {
            warn(`Punto mal formado en línea ${no}: "${value}"`);
            break;
          }
          // label = "info visor" (texto corto sobre la imagen)
          // text  = "info anotaciones" (texto largo del panel)
          const anno = { x: parseFloat(mp[1]), y: parseFloat(mp[2]), label: {}, text: {} };
          if (mp[3]) anno.target = mp[3];
          annotations.push(anno);
          currentAnno = anno;
          currentTarget = anno.text; // por defecto, si se escriben es:/it:/en: sin sub-clave
          break;
        }
        case 'info visor':
        case 'visor':
        case 'label':
          if (currentAnno) currentTarget = currentAnno.label;
          else warn(`"${key}" fuera de un punto en línea ${no}; se ignora.`);
          break;
        case 'info anotaciones':
        case 'anotaciones':
        case 'anotacion':
          if (currentAnno) currentTarget = currentAnno.text;
          else warn(`"${key}" fuera de un punto en línea ${no}; se ignora.`);
          break;
        case 'pie':
        case 'caption':
          if (currentImage) {
            currentTarget = currentImage.caption;
            if (value !== '') currentImage.caption['*'] = value; // compartido entre idiomas
          } else warn(`"${key}" fuera de una imagen en línea ${no}; se ignora.`);
          break;

        // --- [VISOR 3D] cámara ---
        // Órbita (cámara inicial opcional; si falta, auto-encuadre del visor):
        case 'orbita ojo':
        case 'orbit eye':
          cam.orbit.eye = numList(value); break;
        case 'orbita objetivo':
        case 'orbit target':
          cam.orbit.target = numList(value); break;
        case 'orbita fov':
        case 'orbit fov': {
          const n = parseFloat(value); if (!Number.isNaN(n)) cam.orbit.fov = n; break;
        }
        case 'orbita lente':
        case 'orbit lens': {
          const n = parseFloat(value); if (!Number.isNaN(n)) cam.orbit.focal = n; break;
        }
        case 'orbita lente limites':
        case 'orbit lens range':
          cam.orbit.focalRange = numList(value); break;
        // Eye-level (si hay 'ojo', el visor ofrece el toggle):
        case 'ojo':
        case 'eye':
          cam.eyeLevel.eye = numList(value); break;
        case 'objetivo':
        case 'target':
          cam.eyeLevel.target = numList(value); break;
        case 'pan':
          cam.eyeLevel.pan = numList(value); break;
        case 'tilt':
          cam.eyeLevel.tilt = numList(value); break;
        case 'fov': {
          const n = parseFloat(value); if (!Number.isNaN(n)) cam.eyeLevel.fov = n; break;
        }
        case 'fov limites':
        case 'fov range':
          cam.eyeLevel.fovRange = numList(value); break;
        // Zoom en milímetros de lente (full aperture). Preferido sobre fov.
        case 'lente':
        case 'lens': {
          const n = parseFloat(value); if (!Number.isNaN(n)) cam.eyeLevel.focal = n; break;
        }
        case 'lente limites':
        case 'lens range':
          cam.eyeLevel.focalRange = numList(value); break;

        default:
          warn(`Clave desconocida "${key}" en línea ${no}; se ignora.`);
      }
      continue;
    }

    // Línea suelta (no marca): continuación de captura multilínea.
    if (capture) {
      const prev = capture.target[capture.lang];
      capture.target[capture.lang] = prev ? prev + '\n' + trimmed : trimmed;
    } else {
      warn(`Línea sin contexto en ${no}: "${trimmed}"`);
    }
  }

  // Limpia mapas vacíos a undefined para una salida más limpia
  const clean = (m) => (m && Object.keys(m).length ? m : undefined);
  const cleanAnno = (a) => {
    const out = { x: a.x, y: a.y };
    if (clean(a.label)) out.label = a.label;
    if (clean(a.text)) out.text = a.text;
    if (a.target) out.target = a.target;
    return out;
  };

  if (type === 'title') {
    return { title: clean(title), location: clean(location) || null };
  }

  const view = { type, title: clean(title) || {} };
  if (blockId) view.id = blockId;
  if (type === 'article') view.body = clean(body) || {};
  if (type === 'deepzoom') { view.tiles = tiles; view.annotations = annotations.map(cleanAnno); }
  if (type === 'model3d') {
    view.model = model;
    // Cámara: orbit (todo opcional) y/o eyeLevel (solo si hay 'ojo').
    const camera = {};
    if (Object.keys(cam.orbit).length) camera.orbit = cam.orbit;
    if (cam.eyeLevel.eye) camera.eyeLevel = cam.eyeLevel;
    if (Object.keys(camera).length) view.camera = camera;
  }
  if (type === 'gallery') view.photos = photos;
  if (type === 'diagram') { view.image = image; view.points = annotations.map(cleanAnno); }
  if (type === 'carousel') {
    view.folder = folder;
    view.images = images.map((im) => ({ file: im.file, caption: clean(im.caption) || {} }));
    if (options != null) view.options = options; // crudo: lo traduce el build
  }
  return { view };
}

export default parsePage;
