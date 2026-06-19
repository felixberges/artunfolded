// Anotaciones por monumento, indexadas por el id de monuments.js.
// Va en: src/data/annotations.js
//
// Coordenadas en FRACCIONES de la imagen (0..1), NO en píxeles:
//   x, y → esquina superior izquierda de la región
//   w, h → ancho y alto
// Se expresan así para no depender de la resolución del .dzi: el visor
// las convierte a coordenadas de imagen reales al cargar (sabe el tamaño
// del item de OpenSeadragon). Así el mismo dato vale aunque recortes o
// reexportes la imagen a otra resolución.
//
// title → overlay breve (nombre corto; se revela al acercarse).
// place → línea secundaria del panel (autoría, ubicación, fecha…).
// body  → ficha completa (se abre en el panel al pulsar el marcador).
//
// Para colocar regiones reales sin adivinar: abre la web con ?author=1 y
// haz clic sobre la imagen; la consola imprime las fracciones del punto.
// Para una región: clic en la esquina sup-izq y en la inf-der, y calcula
// w = x2 - x1 ,  h = y2 - y1.
//
// OJO: las 3 regiones de abajo son de PRUEBA (coordenadas inventadas sobre
// Galatea). Sustitúyelas por las reales con el modo autor.

export const annotations = {
  galatea: [
    {
      id: 'galatea-galatea',
      x: 0.44, y: 0.30, w: 0.16, h: 0.24,
      title: 'Galatea sobre la concha',
      place: 'Rafael · Villa Farnesina, c. 1512',
      body:
        'La ninfa Galatea avanza sobre una concha tirada por delfines, ' +
        'rodeada del cortejo marino. (Texto de prueba: sustituir por la ' +
        'ficha real — descripción, simbolismo, autoría y contexto.)',
    },
    {
      id: 'galatea-tritones',
      x: 0.18, y: 0.46, w: 0.20, h: 0.22,
      title: 'Tritones y nereidas',
      place: 'Detalle del cortejo marino',
      body:
        'Texto de prueba para el segundo marcador. Aquí iría la explicación ' +
        'del grupo de tritones que acompaña a Galatea por la izquierda.',
    },
    {
      id: 'galatea-putti',
      x: 0.58, y: 0.08, w: 0.14, h: 0.16,
      title: 'Putti con arcos',
      place: 'Parte superior de la composición',
      body:
        'Texto de prueba para el tercer marcador. Los amorcillos disparan ' +
        'sus flechas hacia la ninfa desde lo alto de la escena.',
    },
  ],

  // trastevere: [ ... ]  ← añade aquí cuando toque
}

// Referencia estable para monumentos sin anotaciones: así el array vacío
// no cambia de identidad entre renders y no rearranca el visor (efecto).
const EMPTY = []

export function annotationsFor(id) {
  return annotations[id] ?? EMPTY
}
