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
  'VISOR OBJETO': 'object3d',
  'VISOR RECORRIDO': 'path3d',
  'GALERIA': 'gallery',
  'ESQUEMA': 'diagram',
  'CARRUSEL': 'carousel',
};

const POINT_RE = /^([0-9]*\.?[0-9]+)\s*,\s*([0-9]*\.?[0-9]+)\s*(?:->\s*(\S+))?$/;

// Lista de números: tolera comas y/o espacios e ignora comentarios '#'.
//   "1.2, 3, -4" | "1.2 3 -4" | "15 105  # comentario" -> [..]
const numList = (v) =>
  String(v).split('#')[0].split(/[\s,]+/).map((s) => parseFloat(s)).filter((n) => !Number.isNaN(n));

// Booleano del formato (sí/no). Devuelve undefined si no reconoce el valor.
const parseBool = (v) => {
  const s = String(v).split('#')[0].trim().toLowerCase();
  if (['si', 'sí', 'true', '1', 'yes'].includes(s)) return true;
  if (['no', 'false', '0'].includes(s)) return false;
  return undefined;
};

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
  // [VISOR OBJETO] cámara (paneo en plano frontal, coords del glB Y-up) y luz.
  // options.normalMap: toggle para comparar CON/SIN relieve del normal map
  // (deja el mismo MeshStandardMaterial pero sin esa textura -> superficie plana).
  // options.normalStrength: multiplicador de normalScale (def. 1) — para
  // diagnosticar en un extremo absurdo (p.ej. 5) si hay señal real en el mapa.
  // options.normalBlur: radio (en texeles) de un desenfoque en GPU del normal
  // map (def. 1 = sin cambio) — difumina el ruido fino de la captura
  // conservando el relieve grueso.
  const obj = { camera: {}, light: {}, options: {} };
  // [VISOR RECORRIDO] cámara sobre raíl (recorrido = polilínea, altura libre).
  const path = {};
  // Corrección de color (gain/gamma por canal RGB). Compartida entre VISOR 3D,
  // VISOR OBJETO y VISOR RECORRIDO — se aplica sobre el albedo horneado.
  const color = {};

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

        // --- [VISOR OBJETO] cámara (paneo en plano frontal) ---
        case 'objeto centro':
        case 'object center':
          obj.camera.center = numList(value); break;
        case 'camara':
        case 'camera':
          obj.camera.position = numList(value); break;
        case 'limite x':
        case 'limit x':
          obj.camera.limitX = numList(value); break;
        case 'limite y':
        case 'limit y':
          obj.camera.limitY = numList(value); break;
        // 'lente' / 'lente limites' del objeto comparten clave con eye-level;
        // se desambigua por el tipo de bloque en el ensamblado (abajo).
        // --- [VISOR OBJETO] luz rasante ---
        case 'luz azimut':
        case 'light azimuth': {
          const n = parseFloat(value); if (!Number.isNaN(n)) obj.light.azimuth = n; break;
        }
        case 'luz elevacion':
        case 'light elevation': {
          const n = parseFloat(value); if (!Number.isNaN(n)) obj.light.elevation = n; break;
        }
        case 'luz intensidad':
        case 'light intensity': {
          const n = parseFloat(value); if (!Number.isNaN(n)) obj.light.intensity = n; break;
        }
        case 'luz ambiente':
        case 'light ambient': {
          const n = parseFloat(value); if (!Number.isNaN(n)) obj.light.ambient = n; break;
        }
        case 'mapa normal':
        case 'normal map': {
          const b = parseBool(value); if (b !== undefined) obj.options.normalMap = b; break;
        }
        case 'mapa normal fuerza':
        case 'normal map strength': {
          const n = parseFloat(value); if (!Number.isNaN(n)) obj.options.normalStrength = n; break;
        }
        case 'mapa normal desenfoque':
        case 'normal map blur': {
          const n = parseFloat(value); if (!Number.isNaN(n)) obj.options.normalBlur = n; break;
        }

        // --- [VISOR RECORRIDO] cámara sobre raíl ---
        // 'modelo' (la bóveda) y 'lente'/'lente limites' se reutilizan de arriba.
        case 'recorrido':
        case 'path':
          path.recorrido = value; break;            // fichero .obj de la polilínea
        case 'arco eje':
        case 'arc axis':
          path.axis = value.toLowerCase() === 'auto' ? 'auto' : numList(value); break;
        case 'arco lado':
        case 'arc side':
          path.side = value.trim(); break;           // auto | + | -
        case 'mirada':
        case 'look':
          path.look = value.trim().toLowerCase(); break; // arriba | tangente | radial
        case 'mirada inicial':
        case 'look init':
          path.lookInit = numList(value); break;     // [yaw, pitch] grados
        case 'mirada limites':
        case 'look limits':
          path.lookLimits = numList(value); break;   // [±yaw, ±pitch] grados
        case 'altura':
        case 'height':
          path.height = numList(value); break;        // [min, max]
        case 'altura inicial':
        case 'height init': {
          const n = parseFloat(value); if (!Number.isNaN(n)) path.heightInit = n; break;
        }
        case 'avance':
        case 'advance':
          path.advance = numList(value); break;       // [min, max] fracción de arco
        case 'avance inicial':
        case 'advance init': {
          const n = parseFloat(value); if (!Number.isNaN(n)) path.advanceInit = n; break;
        }
        case 'avance suave':
        case 'advance smooth': {
          const b = parseBool(value); if (b !== undefined) path.smooth = b; break;
        }
        case 'consola':
        case 'console':
          path.console = value.trim().toLowerCase(); break; // fija | atenua

        // --- Corrección de color (VISOR 3D / VISOR OBJETO / VISOR RECORRIDO) ---
        // Multiplicador y curva por canal RGB, sobre el albedo horneado (unlit).
        case 'color gain':
        case 'ganancia color':
          color.gain = numList(value); break;   // [r, g, b] multiplicador, def. 1,1,1
        case 'color gamma':
        case 'gamma color':
          color.gamma = numList(value); break;  // [r, g, b] curva, def. 1,1,1

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
    if (Object.keys(color).length) view.color = color;
  }
  if (type === 'object3d') {
    view.model = model;
    // 'lente'/'lente limites' caen en cam.eyeLevel.focal/focalRange (clave compartida).
    if (Number.isFinite(cam.eyeLevel.focal)) obj.camera.focal = cam.eyeLevel.focal;
    if (cam.eyeLevel.focalRange) obj.camera.focalRange = cam.eyeLevel.focalRange;
    if (Object.keys(obj.camera).length) view.camera = obj.camera;
    if (Object.keys(obj.light).length) view.light = obj.light;
    if (Object.keys(obj.options).length) view.options = obj.options;
    if (Object.keys(color).length) view.color = color;
  }
  if (type === 'path3d') {
    view.model = model;
    view.recorrido = path.recorrido;
    const pcfg = {};
    if (path.axis !== undefined) pcfg.axis = path.axis;
    if (path.side !== undefined) pcfg.side = path.side;
    if (path.look !== undefined) pcfg.look = path.look;
    if (path.lookInit) pcfg.lookInit = path.lookInit;
    if (path.lookLimits) pcfg.lookLimits = path.lookLimits;
    if (path.height) pcfg.height = path.height;
    if (Number.isFinite(path.heightInit)) pcfg.heightInit = path.heightInit;
    if (path.advance) pcfg.advance = path.advance;
    if (Number.isFinite(path.advanceInit)) pcfg.advanceInit = path.advanceInit;
    if (typeof path.smooth === 'boolean') pcfg.smooth = path.smooth;
    if (path.console !== undefined) pcfg.console = path.console;
    // 'lente'/'lente limites' compartidas con eye-level.
    if (Number.isFinite(cam.eyeLevel.focal)) pcfg.focal = cam.eyeLevel.focal;
    if (cam.eyeLevel.focalRange) pcfg.focalRange = cam.eyeLevel.focalRange;
    view.path = pcfg;
    if (Object.keys(color).length) view.color = color;
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
