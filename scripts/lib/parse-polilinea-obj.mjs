// ============================================================================
//  Art Unfolded — scripts/lib/parse-polilinea-obj.mjs
//
//  Lee un OBJ que contiene UNA polilinea ABIERTA y devuelve sus puntos en
//  ORDEN de recorrido. Pensado para el visor [VISOR RECORRIDO] (path3d).
//
//  Maneja los dos casos tipicos de exportacion:
//    A) Una sola sentencia "l" con los indices en orden:  l 1 2 3 ... n
//       -> orden inequivoco, no hay nada que adivinar.
//    B) "Sopa de aristas": muchas "l a b" sueltas y en cualquier orden
//       (lo que suele soltar Blender). Se reconstruye el orden por
//       adyacencia: en una linea ABIERTA hay exactamente dos extremos
//       (vertices con un solo vecino) y se recorre de uno a otro.
//
//  EL PROBLEMA DEL "ULTIMO-PRIMERO": si el export incluye por error la arista
//  que cierra el ciclo (ultimo punto -> primer punto), TODOS los vertices
//  pasan a tener 2 vecinos y la linea se vuelve un bucle sin extremos. En ese
//  caso este parser AVISA y abre el ciclo por su sitio mas probable, pero lo
//  ideal es borrar esa arista en Blender para que la linea nazca abierta.
//
//  Uso como modulo:
//      import parsePolilineaObj from './parse-polilinea-obj.mjs';
//      const { puntos, aviso } = parsePolilineaObj(textoObj, { id });
//
//  Uso como CLI (para validar tu export mientras preparas el modelo):
//      node scripts/lib/parse-polilinea-obj.mjs ruta/al/recorrido.obj
// ============================================================================

const EPS = 1e-6;          // dos puntos mas cercanos que esto = el mismo punto
const REDONDEO = 6;        // decimales que guardamos en el JSON final

// Resuelve un indice OBJ (1-based, admite negativos relativos) a 0-based.
function resolverIndice(raw, total) {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n === 0) return null;
  return n > 0 ? n - 1 : total + n;   // -1 -> ultimo vertice
}

function clave(a, b) {                 // clave de arista sin direccion
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export default function parsePolilineaObj(texto, { id = 'recorrido' } = {}) {
  const vertices = [];                 // [[x,y,z], ...] 0-based
  const aristas = new Map();           // "a|b" -> [a, b]   (dedup)
  const ady = new Map();               // vert -> Set(vecinos)
  const primeraAparicion = new Map();  // vert -> orden en que se vio en una "l"
  let contadorAparicion = 0;

  const conecta = (a, b) => {
    if (a === b) return;               // ignora aristas de longitud cero
    const k = clave(a, b);
    if (aristas.has(k)) return;
    aristas.set(k, [a, b]);
    if (!ady.has(a)) ady.set(a, new Set());
    if (!ady.has(b)) ady.set(b, new Set());
    ady.get(a).add(b);
    ady.get(b).add(a);
    for (const v of [a, b]) {
      if (!primeraAparicion.has(v)) primeraAparicion.set(v, contadorAparicion++);
    }
  };

  // --- 1) Recorre el fichero linea a linea -----------------------------------
  for (const cruda of texto.split(/\r?\n/)) {
    const linea = cruda.trim();
    if (!linea || linea.startsWith('#')) continue;
    const tok = linea.split(/\s+/);

    if (tok[0] === 'v') {              // vertice (no vt / vn / vp)
      const x = parseFloat(tok[1]);
      const y = parseFloat(tok[2]);
      const z = parseFloat(tok[3]);
      if ([x, y, z].some(Number.isNaN)) continue;
      vertices.push([x, y, z]);
    } else if (tok[0] === 'l') {       // elemento de linea
      // admite forma "indice" o "indice/uv"; nos quedamos con lo de antes de "/"
      const idx = tok.slice(1)
        .map((t) => resolverIndice(t.split('/')[0], vertices.length))
        .filter((n) => n !== null && n >= 0 && n < vertices.length);
      for (let i = 0; i < idx.length - 1; i++) conecta(idx[i], idx[i + 1]);
    }
  }

  // --- 2) Validaciones de forma ---------------------------------------------
  if (aristas.size === 0) {
    throw new Error(
      `[${id}] el OBJ no contiene ninguna polilinea (no hay sentencias "l"). ` +
      `Exporta la curva como edges/line, no como malla.`
    );
  }

  // Bifurcaciones: ningun vertice puede tener mas de 2 vecinos.
  for (const [v, vecinos] of ady) {
    if (vecinos.size > 2) {
      throw new Error(
        `[${id}] el recorrido se bifurca en el vertice ${v + 1} ` +
        `(${vecinos.size} conexiones). Debe ser una linea simple, sin ramas.`
      );
    }
  }

  // Conectividad: un solo trozo. Detecta lineas sueltas o islas.
  const usados = [...ady.keys()];
  const visto = new Set();
  const pila = [usados[0]];
  while (pila.length) {
    const v = pila.pop();
    if (visto.has(v)) continue;
    visto.add(v);
    for (const w of ady.get(v)) if (!visto.has(w)) pila.push(w);
  }
  if (visto.size !== usados.length) {
    throw new Error(
      `[${id}] el OBJ tiene ${usados.length} vertices conectados pero forman ` +
      `varios trozos sueltos. Debe haber una sola polilinea continua.`
    );
  }

  // --- 3) Encuentra los extremos (vertices con un solo vecino) ---------------
  let extremos = usados.filter((v) => ady.get(v).size === 1);
  let aviso = null;

  if (extremos.length === 0) {
    // Bucle cerrado: llego la arista de cierre ultimo->primero. La abrimos.
    // Heuristica: quitamos la arista entre el vertice de indice mas bajo y el
    // mas alto (el patron habitual de cierre en exports secuenciales).
    const vs = usados.slice().sort((a, b) => a - b);
    const kCierre = clave(vs[0], vs[vs.length - 1]);
    const arista = aristas.get(kCierre) || aristas.values().next().value;
    const [a, b] = arista;
    ady.get(a).delete(b);
    ady.get(b).delete(a);
    aristas.delete(clave(a, b));
    extremos = usados.filter((v) => ady.get(v).size === 1);
    aviso =
      `el OBJ venia como bucle CERRADO (incluia la arista ultimo->primero). ` +
      `Se ha abierto automaticamente entre los vertices ${a + 1} y ${b + 1}, ` +
      `pero conviene borrar esa arista en Blender para que el inicio del ` +
      `recorrido sea deterministico.`;
  }

  if (extremos.length !== 2) {
    throw new Error(
      `[${id}] esperaba una linea abierta con 2 extremos y encontre ` +
      `${extremos.length}. Revisa que la curva no tenga puntos sueltos ni ` +
      `tramos duplicados.`
    );
  }

  // --- 4) Recorre de un extremo al otro --------------------------------------
  // Arranca por el extremo que aparecio antes en el fichero: respeta el
  // sentido en que dibujaste la curva (inicio -> final).
  const [e0, e1] = extremos;
  const inicio =
    (primeraAparicion.get(e0) ?? Infinity) <= (primeraAparicion.get(e1) ?? Infinity)
      ? e0 : e1;

  const ordenVert = [];
  let prev = -1;
  let actual = inicio;
  const guard = usados.length + 1;
  for (let i = 0; i <= guard && actual !== undefined; i++) {
    ordenVert.push(actual);
    let siguiente;
    for (const w of ady.get(actual)) { if (w !== prev) { siguiente = w; break; } }
    prev = actual;
    actual = siguiente;
  }

  // --- 5) Puntos finales: dedup de consecutivos y redondeo -------------------
  const puntos = [];
  for (const v of ordenVert) {
    const p = vertices[v].map((c) => +c.toFixed(REDONDEO));
    const u = puntos[puntos.length - 1];
    if (!u || Math.hypot(p[0] - u[0], p[1] - u[1], p[2] - u[2]) > EPS) puntos.push(p);
  }
  if (puntos.length < 2) {
    throw new Error(`[${id}] el recorrido tiene menos de 2 puntos utiles.`);
  }

  return { puntos, aviso };
}

// ----------------------------------------------------------------------------
//  Metricas utiles (bbox + longitud total). Sirven para confirmar la escala:
//  si la escena esta en metros, la longitud deberia coincidir con el largo
//  real del pasillo.
// ----------------------------------------------------------------------------
export function metricas(puntos) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  let largo = 0;
  for (let i = 0; i < puntos.length; i++) {
    const p = puntos[i];
    for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], p[k]); max[k] = Math.max(max[k], p[k]); }
    if (i > 0) {
      const q = puntos[i - 1];
      largo += Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    }
  }
  return { min, max, largo, nPuntos: puntos.length };
}

// ----------------------------------------------------------------------------
//  Modo CLI: node parse-polilinea-obj.mjs ruta.obj
// ----------------------------------------------------------------------------
async function main() {
  const fs = await import('node:fs');
  const ruta = process.argv[2];
  if (!ruta) { console.error('Uso: node parse-polilinea-obj.mjs ruta/al/recorrido.obj'); process.exit(1); }
  const texto = fs.readFileSync(ruta, 'utf8');
  const id = ruta.split(/[\\/]/).pop().replace(/\.obj$/i, '');
  try {
    const { puntos, aviso } = parsePolilineaObj(texto, { id });
    const m = metricas(puntos);
    console.log(`OK  ${id}`);
    console.log(`  puntos        : ${m.nPuntos}`);
    console.log(`  longitud total: ${m.largo.toFixed(3)}  (unidades del modelo)`);
    console.log(`  bbox min      : ${m.min.map((n) => n.toFixed(3)).join(', ')}`);
    console.log(`  bbox max      : ${m.max.map((n) => n.toFixed(3)).join(', ')}`);
    console.log(`  inicio        : ${puntos[0].join(', ')}`);
    console.log(`  fin           : ${puntos[puntos.length - 1].join(', ')}`);
    if (aviso) console.log(`  AVISO: ${aviso}`);
  } catch (e) {
    console.error(`ERROR  ${e.message}`);
    process.exit(2);
  }
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
