// strings.js — UI chrome strings (not monument content; that lives in monuments.js).
// Each entry is a localized field consumed via t(ui.xxx).

export const ui = {
  archive:        { es: 'Archivo', it: 'Archivio', en: 'Archive' },
  back:           { es: 'Archivo', it: 'Archivio', en: 'Archive' }, // arrow is rendered separately
  language:       { es: 'Idioma', it: 'Lingua', en: 'Language' },
  views:          { es: 'Vistas', it: 'Viste', en: 'Views' },
  layers:         { es: 'Capas', it: 'Livelli', en: 'Layers' },
  source:         { es: 'Imagen', it: 'Immagine', en: 'Image' },
  annotations:    { es: 'Anotaciones', it: 'Annotazioni', en: 'Annotations' },
  comingSoon:     { es: 'Próximamente', it: 'Prossimamente', en: 'Coming soon' },
  close:          { es: 'Cerrar', it: 'Chiudi', en: 'Close' },
  loading:        { es: 'Cargando…', it: 'Caricamento…', en: 'Loading…' },
  noView:         { es: 'Vista no disponible.', it: 'Vista non disponibile.', en: 'View unavailable.' },

  // --- Portada / Archivo (App.jsx) ---------------------------------------
  archiveEyebrow: { es: 'Archivo visual de superficies', it: 'Archivio visivo di superfici', en: 'A visual archive of surfaces' },
  archiveThesis:  {
    es: 'Arquitectura y pintura antiguas, desplegadas en superficies planas de altísima resolución para inspeccionarlas de cerca.',
    it: 'Architettura e pittura antiche, distese su superfici piane ad altissima risoluzione per essere osservate da vicino.',
    en: 'Ancient architecture and painting, unfolded onto flat, ultra-high-resolution surfaces for close inspection.',
  },
  archivePrototype: { es: 'prototipo de archivo', it: 'prototipo di archivio', en: 'archive prototype' },
  plateLabel:       { es: 'Lámina', it: 'Tavola', en: 'Plate' },
  openViewerFor:    { es: 'Abrir el visor de', it: 'Apri il visualizzatore di', en: 'Open the viewer for' },
  openViewerCta:    { es: 'Abrir visor', it: 'Apri visualizzatore', en: 'Open viewer' },

  // --- Etiquetas de tipo de visor (lámina de archivo, specFor) -----------
  specDeepzoom:  { es: 'imagen desplegada', it: 'immagine distesa', en: 'unfolded image' },
  specModel3d:   { es: 'fotogrametría', it: 'fotogrammetria', en: 'photogrammetry' },
  specObject3d:  { es: 'relieve', it: 'rilievo', en: 'relief' },
  specPath3d:    { es: 'recorrido', it: 'percorso', en: 'walkthrough' },
  specGallery:   { es: 'fotografías', it: 'fotografie', en: 'photographs' },
  specDiagram:   { es: 'situación', it: 'ubicazione', en: 'location' },
  specCarousel:  { es: 'carrusel', it: 'carosello', en: 'carousel' },
};
