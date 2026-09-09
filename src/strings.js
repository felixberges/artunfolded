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
  archiveEyebrow: { es: 'Otra manera de mirar el arte antiguo', it: 'Un altro modo di guardare l\'arte antica', en: 'A new way to look at ancient art' },
  archiveThesis:  {
    es: 'Hay obras que nunca se ven enteras: bóvedas altísimas, relieves inaccesibles, fachadas demasiado grandes para un solo vistazo. Aquí se despliegan, cada una a su manera —imágenes desplegadas, visores en 3D, ortofotos por fotogrametría— para poder mirarlas de cerca, con calma, como si estuvieran al alcance de la mano.',
    it: 'Ci sono opere che non si vedono mai per intero: volte altissime, rilievi inaccessibili, facciate troppo grandi per un solo sguardo. Qui si dispiegano, ognuna a modo suo —immagini distese, visori in 3D, ortofoto da fotogrammetria— per poterle osservare da vicino, con calma, come se fossero a portata di mano.',
    en: 'Some works are never seen whole: vaults too high, reliefs out of reach, façades too vast for a single glance. Here they unfold, each in its own way —unfolded images, 3D viewers, photogrammetric orthophotos— so they can be examined up close, unhurried, as if within arm\'s reach.',
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

  // --- Página "Quiénes somos" ---------------------------------------------
  aboutNav: { es: 'Quiénes somos', it: 'Chi siamo', en: 'About us' },

  aboutIntro: {
    es: 'Este proyecto cruza dos miradas que llevan años trabajando juntas: el conocimiento del arte antiguo de Magoga Piñas y el oficio técnico de Félix Bergés, forjado durante más de tres décadas haciendo visible lo invisible en el cine.',
    it: 'Questo progetto incrocia due sguardi che lavorano insieme da anni: la conoscenza dell\'arte antica di Magoga Piñas e il mestiere tecnico di Félix Bergés, forgiato in oltre tre decenni rendendo visibile l\'invisibile nel cinema.',
    en: 'This project brings together two perspectives that have worked side by side for years: Magoga Piñas\'s knowledge of ancient art and Félix Bergés\'s technical craft, honed over three decades making the invisible visible on screen.',
  },

  magogaRole: {
    es: 'Comisaria de exposiciones y directora de audiovisuales para museos',
    it: 'Curatrice di mostre e regista di audiovisivi per musei',
    en: 'Exhibition curator and museum audiovisual director',
  },
  magogaBio: {
    es: 'Magoga Piñas Azpitarte dirige piezas audiovisuales para museos y exposiciones desde hace más de veinte años, para instituciones como el Museo Arqueológico Nacional, el Museo del Prado o la Real Academia de Bellas Artes de San Fernando —donde coordinó y dirigió los audiovisuales de la muestra sobre los códices de Leonardo da Vinci en la corte de los Austrias—. Su trabajo combina animación 3D, videomapping, teatros virtuales y recreaciones históricas para dar vida a piezas y espacios que de otro modo quedarían fuera del alcance del visitante. Formada en la UCLA, ha compaginado esta faceta con años de experiencia en efectos visuales para cine y televisión, un terreno que comparte con Félix desde hace mucho tiempo.',
    it: 'Magoga Piñas Azpitarte dirige da oltre vent\'anni produzioni audiovisive per musei e mostre, per istituzioni come il Museo Archeologico Nazionale, il Museo del Prado o la Reale Accademia di Belle Arti di San Fernando —dove ha coordinato e diretto gli audiovisivi della mostra sui codici di Leonardo da Vinci alla corte degli Asburgo—. Il suo lavoro unisce animazione 3D, videomapping, teatri virtuali e ricostruzioni storiche per dare vita a opere e spazi altrimenti fuori dalla portata del visitatore. Formatasi alla UCLA, ha affiancato a questa attività anni di esperienza negli effetti visivi per cinema e televisione, un terreno che condivide con Félix da molto tempo.',
    en: 'Magoga Piñas Azpitarte has spent more than twenty years directing audiovisual productions for museums and exhibitions, working with institutions such as the Museo Arqueológico Nacional, the Prado, and the Royal Academy of Fine Arts of San Fernando —where she coordinated and directed the audiovisual pieces for the exhibition on Leonardo da Vinci\'s codices at the Habsburg court—. Her work combines 3D animation, video mapping, virtual theatres and historical recreations to bring to life works and spaces otherwise out of the visitor\'s reach. Trained at UCLA, she has paired this with years of experience in visual effects for film and television, a field she has long shared with Félix.',
  },

  felixRole: {
    es: 'Supervisor de efectos visuales · cofundador de El Ranchito',
    it: 'Supervisore di effetti visivi · cofondatore de El Ranchito',
    en: 'Visual effects supervisor · co-founder of El Ranchito',
  },
  felixBio: {
    es: 'Félix Bergés es supervisor de efectos visuales y cofundador de El Ranchito, un estudio que lleva más de veinte años siendo parte de la historia de los efectos visuales al más alto nivel. Ha trabajado en películas como Ágora, Lo Imposible, Un monstruo viene a verme o La sociedad de la nieve, y en series como Juego de Tronos o The Mandalorian. Su trabajo ha sido reconocido con nueve premios Goya a los mejores efectos especiales y varios reconocimientos de la Visual Effects Society, y es miembro de la Academia de las Artes y las Ciencias Cinematográficas de España, de la Visual Effects Society y de la Academy of Motion Picture Arts and Sciences (los Oscar) de Estados Unidos. Físico de formación y apasionado de la fotografía, lleva toda una carrera buscando, plano a plano, otra manera de mirar.',
    it: 'Félix Bergés è supervisore di effetti visivi e cofondatore de El Ranchito, uno studio che da oltre vent\'anni fa parte della storia degli effetti visivi ai massimi livelli. Ha lavorato in film come Agora, The Impossible, A Monster Calls o La società della neve, e in serie come Il Trono di Spade o The Mandalorian. Il suo lavoro è stato premiato con nove Goya ai migliori effetti speciali e diversi riconoscimenti della Visual Effects Society, ed è membro dell\'Accademia delle Arti e delle Scienze Cinematografiche di Spagna, della Visual Effects Society e dell\'Academy of Motion Picture Arts and Sciences (gli Oscar) degli Stati Uniti. Fisico di formazione e appassionato di fotografia, ha dedicato tutta una carriera a cercare, inquadratura dopo inquadratura, un altro modo di guardare.',
    en: 'Félix Bergés is a visual effects supervisor and co-founder of El Ranchito, a studio that has spent more than twenty years at the highest level of visual effects history. He has worked on films such as Agora, The Impossible, A Monster Calls and Society of the Snow, and on series including Game of Thrones and The Mandalorian. His work has earned nine Goya Awards for Best Special Effects and several Visual Effects Society honours, and he is a member of the Spanish Academy of Motion Picture Arts and Sciences, the Visual Effects Society, and the U.S. Academy of Motion Picture Arts and Sciences (the Oscars). Trained as a physicist and a devoted photographer, he has spent an entire career looking, shot by shot, for another way of seeing.',
  },
};
