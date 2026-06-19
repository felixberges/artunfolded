// Catálogo de láminas. Añadir un monumento = añadir un objeto aquí.
//
// kind        → "2d" abre el visor de zoom profundo (OpenSeadragon)
//               "3d" abre el visor de modelo (react-three-fiber)
// thumb       → imagen de previsualización en public/thumbs/ (JPEG, ~1200px de ancho)
// tileSource  → (solo 2d) ruta al .dzi en public/tiles/ (lo que genera `vips dzsave`)
// model       → (solo 3d) ruta al .glb en public/models/ (Draco + KTX2)
//
// El texto (title, place, spec) es editable: ajústalo a la realidad de cada
// monumento, son solo marcadores razonables para empezar.

export const monuments = [
  {
    id: "galatea",
    plate: "I",
    kind: "2d",
    title: "Loggia di Galatea",
    place: "Villa Farnesina · Roma",
    spec: "Fresco · ortofoto · zoom profundo",
    thumb: "/thumbs/galatea.jpg",
    tileSource: "/tiles/galatea/galatea.dzi",
  },
  {
    id: "trastevere",
    plate: "II",
    kind: "2d",
    title: "Santa Maria in Trastevere",
    place: "Trastevere · Roma",
    spec: "Bóveda · imagen desplegada · zoom profundo",
    thumb: "/thumbs/trastevere.jpg",
    tileSource: "/tiles/trastevere/trastevere.dzi",
  },
  {
    id: "trastevere_3d",
    plate: "III",
    kind: "3d",
    title: "Santa Maria in Trastevere",
    place: "Trastevere · Roma",
    spec: "Bóveda · modelo 3D · fotogrametría",
    thumb: "/thumbs/trastevere_3d.jpg",
    model: "/models/trastevere/trastevere.glb",
  },
];
