// strings.js — UI chrome strings (not monument content; that lives in monuments.js).
// Each entry is a localized field consumed via t(ui.xxx).

export const ui = {
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
  archiveEyebrow: { es: 'Otra manera de mirar el arte', it: 'Un altro modo di guardare l\'arte', en: 'A new way to look at art' },
  archiveThesis:  {
    es: 'Hay obras que nunca se ven enteras: bóvedas altísimas, relieves inaccesibles, fachadas demasiado grandes para un solo vistazo. Aquí se despliegan, y cada una recibe una mirada hecha a su medida: una imagen, un visor, un recorrido diseñados expresamente para ella. Así se pueden contemplar de cerca, con calma y en toda su belleza, como si estuvieran al alcance de la mano.',
    it: 'Ci sono opere che non si vedono mai per intero: volte altissime, rilievi inaccessibili, facciate troppo grandi per un solo sguardo. Qui si dispiegano, e ognuna riceve un modo di guardarla fatto su misura: un\'immagine, un visore, un percorso pensati espressamente per lei. Così si possono contemplare da vicino, con calma e in tutta la loro bellezza, come se fossero a portata di mano.',
    en: 'Some works are never seen whole: vaults too high, reliefs out of reach, façades too vast for a single glance. Here they unfold, each given a way of seeing made to measure: an image, a viewer, a walkthrough designed for that work alone. So they can be contemplated up close, unhurried, in all their beauty, as if within arm\'s reach.',
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
  aboutNav:  { es: 'Quiénes somos', it: 'Chi siamo', en: 'About us' },
  methodNav: { es: 'Metodología', it: 'Metodologia', en: 'Methodology' },
  projectNav: { es: 'El proyecto', it: 'Il progetto', en: 'The project' },
  contactNav: { es: 'Contacto', it: 'Contatti', en: 'Contact' },
  newsNav: { es: 'Noticias', it: 'Notizie', en: 'News' },
  newsTitle: { es: 'Noticias', it: 'Notizie', en: 'News' },

  // --- Página El proyecto (Project.jsx) ---------------------------------------
  projectTitle: { es: 'El proyecto', it: 'Il progetto', en: 'The project' },
  projectP0: {
    es: 'Nada sustituye a estar delante de la obra. Lo que sí podemos hacer es aprovechar la tecnología actual para mirarla de otra manera, y en eso trabajamos: buscamos formas de disfrutarla desde una pantalla que no son posibles en el propio lugar.',
    it: 'Niente sostituisce il trovarsi davanti all\'opera. Quello che possiamo fare è sfruttare la tecnologia attuale per guardarla in un altro modo, ed è su questo che lavoriamo: cerchiamo modi di goderla da uno schermo che sul posto non sono possibili.',
    en: 'Nothing replaces standing in front of the work. What we can do is use current technology to look at it in a different way, and that is what we are working on: finding ways to enjoy it on a screen that are not possible on site.',
  },
  projectP1: {
    es: 'Art Unfolded nace de una pregunta sencilla: qué puede aportar una pantalla a una obra pensada para un lugar concreto. Desplegar una bóveda permite abarcarla de un vistazo y seguir su relato de principio a fin; acercarse a un mosaico deja ver las teselas, los materiales y la mano de quien lo hizo. Son otras formas de acercarse a la misma obra, y se suman a la experiencia de verla en su sitio.',
    it: 'Art Unfolded nasce da una domanda semplice: che cosa può aggiungere uno schermo a un\'opera pensata per un luogo preciso. Distendere una volta permette di abbracciarla con un solo sguardo e di seguirne il racconto dall\'inizio alla fine; avvicinarsi a un mosaico lascia vedere le tessere, i materiali e la mano di chi lo ha realizzato. Sono altri modi di accostarsi alla stessa opera, e si aggiungono all\'esperienza di vederla nel suo luogo.',
    en: 'Art Unfolded starts from a simple question: what can a screen add to a work made for a specific place? Unfolding a vault makes it possible to take it in at a glance and follow its story from beginning to end; moving close to a mosaic reveals the tesserae, the materials and the hand of whoever made it. These are other ways of approaching the same work, and they add to the experience of seeing it where it belongs.',
  },
  projectP1b: {
    es: 'Cada obra plantea un problema distinto, y la forma de presentarla se decide a partir de ese problema. En algunos casos la respuesta es una imagen plana de muy alta resolución, en otros un modelo tridimensional que se puede recorrer, y en otros una secuencia que acompaña al espectador a lo largo de un espacio. Lo que sigue es un catálogo de los tipos de trabajo que abordamos.',
    it: 'Ogni opera pone un problema diverso, e la forma in cui presentarla si decide a partire da quel problema. In alcuni casi la risposta è un\'immagine piana ad altissima risoluzione, in altri un modello tridimensionale da esplorare, in altri ancora una sequenza che accompagna lo spettatore lungo uno spazio. Quello che segue è un catalogo dei tipi di lavoro che affrontiamo.',
    en: 'Each work poses a different problem, and the way it is presented is decided from that problem. Sometimes the answer is a flat image at very high resolution, sometimes a three-dimensional model that can be explored, and sometimes a sequence that guides the viewer through a space. What follows is a catalogue of the kinds of work we undertake.',
  },
  // Catálogo de tipos de trabajo (Project.jsx -> CATALOG)
  projectCat1Title: { es: 'Bóvedas y techos pintados', it: 'Volte e soffitti dipinti', en: 'Vaults and painted ceilings' },
  projectCat1Body: {
    es: 'Superficies curvas que el ojo solo puede recorrer por partes. Las desplegamos sobre un plano para leerlas enteras, o las reconstruimos en tres dimensiones para conservar su geometría.',
    it: 'Superfici curve che l\'occhio può percorrere solo a tratti. Le sviluppiamo su un piano per leggerle per intero, oppure le ricostruiamo in tre dimensioni per conservarne la geometria.',
    en: 'Curved surfaces the eye can only take in piece by piece. We unfold them onto a plane so they can be read as a whole, or reconstruct them in three dimensions to preserve their geometry.',
  },
  projectCat2Title: { es: 'Mosaicos', it: 'Mosaici', en: 'Mosaics' },
  projectCat2Body: {
    es: 'Miles de teselas cuyo brillo cambia con el ángulo de la luz. Requieren una captura muy controlada para que el color y el relieve de cada pieza se mantengan legibles de cerca y en conjunto.',
    it: 'Migliaia di tessere la cui brillantezza cambia con l\'angolo della luce. Richiedono una ripresa molto controllata perché il colore e il rilievo di ogni tessera restino leggibili sia da vicino sia nell\'insieme.',
    en: 'Thousands of tesserae whose sheen changes with the angle of the light. They require carefully controlled capture so that the colour and relief of each piece remain legible both up close and as a whole.',
  },
  projectCat3Title: { es: 'Relieves y escultura', it: 'Rilievi e scultura', en: 'Reliefs and sculpture' },
  projectCat3Body: {
    es: 'Aquí la forma importa tanto como el color. El modelo permite mover la luz y observar cómo aparecen y desaparecen los volúmenes, algo que en sala depende de una iluminación fija.',
    it: 'Qui la forma conta quanto il colore. Il modello permette di spostare la luce e osservare come i volumi appaiono e scompaiono, cosa che in sala dipende da un\'illuminazione fissa.',
    en: 'Here form matters as much as colour. The model lets you move the light and watch volumes appear and disappear, something that in a gallery depends on fixed lighting.',
  },
  projectCat4Title: { es: 'Fachadas sin tiro', it: 'Facciate senza distanza', en: 'Façades with no vantage point' },
  projectCat4Body: {
    es: 'Muchas fachadas de catedrales se levantan frente a calles estrechas o plazas pequeñas: no hay distancia suficiente para verlas completas ni para fotografiarlas de una vez. Las reconstruimos por partes hasta obtener una vista frontal continua, sin la deformación de mirar desde abajo.',
    it: 'Molte facciate di cattedrali si affacciano su strade strette o piazze piccole: manca lo spazio per vederle per intero o per fotografarle in un solo scatto. Le ricostruiamo per parti fino a ottenere una vista frontale continua, senza la deformazione dello sguardo dal basso.',
    en: 'Many cathedral façades face narrow streets or small squares: there is not enough distance to see them whole or to photograph them in a single shot. We reconstruct them in sections until we obtain a continuous frontal view, free from the distortion of looking up from below.',
  },
  projectCat5Title: { es: 'Calles y conjuntos urbanos', it: 'Strade e insiemi urbani', en: 'Streets and urban ensembles' },
  projectCat5Body: {
    es: 'La idea de una ortofoto de una calle entera, de un kilómetro o más, con todas sus fachadas en un solo alzado continuo. Una forma de ver la ciudad que no existe desde ningún punto real.',
    it: 'L\'idea di un\'ortofoto di un\'intera strada, di un chilometro o più, con tutte le sue facciate in un unico prospetto continuo. Un modo di vedere la città che non esiste da nessun punto reale.',
    en: 'The idea of an orthophoto of an entire street, a kilometre or more long, with all its façades in a single continuous elevation. A way of seeing the city that exists from no real viewpoint.',
  },
  projectCat6Title: { es: 'Corredores y galerías', it: 'Corridoi e gallerie', en: 'Corridors and galleries' },
  projectCat6Body: {
    es: 'Espacios que se entienden al caminarlos. En lugar de una imagen fija, proponemos un recorrido guiado en el que se puede avanzar y levantar la mirada.',
    it: 'Spazi che si comprendono camminandoci dentro. Invece di un\'immagine fissa, proponiamo un percorso guidato in cui si può avanzare e alzare lo sguardo.',
    en: 'Spaces that are understood by walking through them. Instead of a still image, we offer a guided route along which you can move forward and look up.',
  },
  projectCat7Title: { es: 'Interiores completos', it: 'Interni completi', en: 'Complete interiors' },
  projectCat7Body: {
    es: 'Bibliotecas, capillas o salas en las que la decoración forma un conjunto. El objetivo es mostrar la relación entre las partes, no solo cada pieza por separado.',
    it: 'Biblioteche, cappelle o sale in cui la decorazione forma un insieme. L\'obiettivo è mostrare il rapporto tra le parti, non solo ogni elemento separatamente.',
    en: 'Libraries, chapels or halls where the decoration forms a whole. The aim is to show how the parts relate to one another, not just each piece on its own.',
  },
  projectP2: {
    es: 'Es un proyecto sin ánimo de lucro. No hay un producto detrás. Lo hacemos por el placer de mirar despacio cosas bellas y de poder compartirlas.',
    it: 'È un progetto senza scopo di lucro. Non c\'è un prodotto dietro. Lo facciamo per il piacere di guardare senza fretta cose belle e di poterle condividere.',
    en: 'It is a non-profit project. There is no product behind it. We do it for the pleasure of looking slowly at beautiful things, and of being able to share them.',
  },
  projectP3: {
    es: 'Art Unfolded es una idea personal de Magoga y de Félix. Ella viene del mundo del arte y de la imagen, y él de la programación primero y del cine después. Lo que sabe el uno enriquece el trabajo del otro.',
    it: 'Art Unfolded è un\'idea personale di Magoga e di Félix. Lei viene dal mondo dell\'arte e dell\'immagine, lui prima dalla programmazione e poi dal cinema. Ciò che sa l\'uno arricchisce il lavoro dell\'altro.',
    en: 'Art Unfolded is a personal idea shared by Magoga and Félix. She comes from the world of art and images, and he came first from programming, then from film. What one knows enriches the other\'s work.',
  },
  projectP5: {
    es: 'Los próximos trabajos nos llevan a Italia, en concreto a Venecia, Padua, Rávena y Bolonia, y a varios lugares de Andalucía.',
    it: 'I prossimi lavori ci portano in Italia, a Venezia, Padova, Ravenna e Bologna, e in diversi luoghi dell\'Andalusia.',
    en: 'Our next projects take us to Italy, to Venice, Padua, Ravenna and Bologna, and to several places in Andalusia.',
  },
  // Pies y textos alternativos de las imágenes (los pies se rellenan al elegirlas)
  // Tira de detalles al inicio de la página
  projectDetail1Caption: { es: 'Villa Farnesina, Loggia di Galatea', it: 'Villa Farnesina, Loggia di Galatea', en: 'Villa Farnesina, Loggia di Galatea' },
  projectDetail1Alt:     { es: 'Pinturas de la bóveda de la Loggia di Galatea', it: 'Pitture della volta della Loggia di Galatea', en: 'Paintings on the vault of the Loggia di Galatea' },
  projectDetail2Caption: { es: 'Santa Maria in Trastevere, mosaico del ábside', it: 'Santa Maria in Trastevere, mosaico dell\'abside', en: 'Santa Maria in Trastevere, apse mosaic' },
  projectDetail2Alt:     { es: 'Mosaico del ábside de Santa Maria in Trastevere', it: 'Mosaico dell\'abside di Santa Maria in Trastevere', en: 'Apse mosaic of Santa Maria in Trastevere' },
  projectDetail4Caption: { es: 'Villa Giulia, pórtico del hemiciclo', it: 'Villa Giulia, portico dell\'emiciclo', en: 'Villa Giulia, hemicycle portico' },
  projectDetail4Alt:     { es: 'Bóveda pintada como una pérgola, con putti entre las vides', it: 'Volta dipinta come un pergolato, con putti tra le viti', en: 'Vault painted as a pergola, with putti among the vines' },
  projectDetail3Caption: { es: 'Palazzo Barberini, león en relieve', it: 'Palazzo Barberini, leone a rilievo', en: 'Palazzo Barberini, lion in relief' },
  projectDetail3Alt:     { es: 'Relieve de un león en piedra', it: 'Rilievo di un leone in pietra', en: 'Stone relief of a lion' },
  projectImgFieldCaption:   { es: '', it: '', en: '' },
  projectImgFieldAlt:       { es: 'Trabajo de campo', it: 'Lavoro sul campo', en: 'Fieldwork' },
  // Pareja del proceso: modelo fotogramétrico -> bóveda desplegada
  projectProcessModelCaption:  { es: 'Modelo fotogramétrico de la bóveda', it: 'Modello fotogrammetrico della volta', en: 'Photogrammetric model of the vault' },
  projectProcessModelAlt:      { es: 'Modelo fotogramétrico 3D de la bóveda de la Villa Farnesina', it: 'Modello fotogrammetrico 3D della volta di Villa Farnesina', en: '3D photogrammetric model of the Villa Farnesina vault' },
  projectProcessResultCaption: { es: 'La misma bóveda, desplegada', it: 'La stessa volta, dispiegata', en: 'The same vault, unfolded' },
  projectProcessResultAlt:     { es: 'Bóveda de la Villa Farnesina desplegada en un solo plano', it: 'Volta di Villa Farnesina dispiegata su un unico piano', en: 'Villa Farnesina vault unfolded onto a single plane' },

  // --- Página Metodología ---------------------------------------------------
  methodTitle: { es: 'Cómo se hizo la lámina de Villa Farnesina', it: 'Come è nata la tavola di Villa Farnesina', en: 'How the Villa Farnesina plate was made' },

  // Pestañas y casos de estudio (Method.jsx -> TABS, CASES)
  methodIntroCaption: { es: 'La bóveda vista desde el suelo de la sala', it: 'La volta vista dal pavimento della sala', en: 'The vault seen from the floor of the room' },
  methodIntroImgAlt:  { es: 'La bóveda de la Loggia di Galatea fotografiada desde abajo, con los lunetos y las ventanas', it: 'La volta della Loggia di Galatea fotografata dal basso, con le lunette e le finestre', en: 'The vault of the Loggia di Galatea photographed from below, with the lunettes and windows' },
  methodCase1Title: { es: 'Villa Farnesina, Loggia di Galatea', it: 'Villa Farnesina, Loggia di Galatea', en: 'Villa Farnesina, Loggia di Galatea' },
  methodCase1Body: {
    es: 'La bóveda de la Loggia di Galatea, pintada por Baldassarre Peruzzi hacia 1511, representa según la lectura más aceptada el horóscopo de Agostino Chigi, el banquero que mandó construir la villa.',
    it: 'La volta della Loggia di Galatea, dipinta da Baldassarre Peruzzi intorno al 1511, rappresenta secondo la lettura più accreditata l\'oroscopo di Agostino Chigi, il banchiere che fece costruire la villa.',
    en: 'The vault of the Loggia di Galatea, painted by Baldassarre Peruzzi around 1511, represents, according to the most widely accepted reading, the horoscope of Agostino Chigi, the banker who had the villa built.',
  },
  // Final del caso Farnesina: el visor diseñado para esta bóveda
  methodCase1ViewerTitle: { es: 'Un visor pensado para esta bóveda', it: 'Un visore pensato per questa volta', en: 'A viewer designed for this vault' },
  methodCase1ViewerP1: {
    es: 'Cada obra tiene un visor diseñado para ella, a partir de cómo está construida y de cómo se mira en su sitio.',
    it: 'Ogni opera ha un visore progettato per lei, a partire da come è costruita e da come la si guarda nel suo luogo.',
    en: 'Each work has a viewer designed for it, based on how it is built and how it is seen in its place.',
  },
  methodCase1ViewerP2: {
    es: 'Las escenas de la bóveda miran hacia distintas zonas de la sala, así que en el desplegado unas quedan de lado y otras boca abajo. El visor permite girar la imagen hasta poner cada escena del derecho, y los rótulos se mantienen siempre legibles.',
    it: 'Le scene della volta sono rivolte verso zone diverse della sala, per cui nella distesa alcune risultano di lato e altre capovolte. Il visore permette di ruotare l\'immagine fino a raddrizzare ogni scena, e le etichette restano sempre leggibili.',
    en: 'The scenes on the vault face different parts of the room, so in the unfolded image some lie on their side and others upside down. The viewer lets you rotate the image until each scene is upright, and the labels always remain legible.',
  },
  methodCase1ViewerP3: {
    es: 'Para orientarse en el horóscopo de Chigi, el visor acompaña la imagen con una lista de anotaciones: al elegir una, la imagen se centra en la escena y la señala. Los puntos aparecen al acercarse, para no cubrir la pintura.',
    it: 'Per orientarsi nell\'oroscopo di Chigi, il visore accompagna l\'immagine con un elenco di annotazioni: scegliendone una, l\'immagine si centra sulla scena e la segnala. I punti compaiono avvicinandosi, per non coprire la pittura.',
    en: 'To find one\'s way through Chigi\'s horoscope, the viewer pairs the image with a list of annotations: choosing one centres the image on the scene and marks it. The points appear as you move closer, so they do not cover the painting.',
  },
  methodCase1ViewerImgCaption: {
    es: 'El visor de la Loggia di Galatea: la bóveda desplegada y, a la derecha, la lista de anotaciones.',
    it: 'Il visore della Loggia di Galatea: la volta distesa e, a destra, l\'elenco delle annotazioni.',
    en: 'The Loggia di Galatea viewer: the unfolded vault and, on the right, the list of annotations.',
  },
  methodCase1ViewerImgAlt: { es: 'Captura del visor con la bóveda desplegada y la lista de anotaciones', it: 'Schermata del visore con la volta distesa e l\'elenco delle annotazioni', en: 'Screenshot of the viewer with the unfolded vault and the list of annotations' },
  methodCase1RotateCaption: {
    es: 'Hércules y la Hidra, desde su orientación en el desplegado hasta quedar del derecho. El rótulo se mantiene horizontal.',
    it: 'Ercole e l\'Idra, dall\'orientamento che ha nella distesa fino a tornare dritta. L\'etichetta resta orizzontale.',
    en: 'Hercules and the Hydra, from its orientation in the unfolded image until it stands upright. The label stays horizontal.',
  },
  methodCase1RotateAlt1: { es: 'Hércules y la Hidra boca abajo, como aparece en el desplegado', it: 'Ercole e l\'Idra capovolti, come appaiono nella distesa', en: 'Hercules and the Hydra upside down, as they appear in the unfolded image' },
  methodCase1RotateAlt2: { es: 'La misma escena a mitad del giro', it: 'La stessa scena a metà della rotazione', en: 'The same scene halfway through the rotation' },
  methodCase1RotateAlt3: { es: 'La escena del derecho', it: 'La scena dritta', en: 'The scene upright' },
  methodCase1ListCaption: {
    es: 'Al elegir una anotación, el visor centra y señala la escena.',
    it: 'Scegliendo un\'annotazione, il visore centra e segnala la scena.',
    en: 'Choosing an annotation centres and marks the scene in the viewer.',
  },
  methodCase1ListAlt: { es: 'Baco y Ariadna señalados en la imagen y resaltados en la lista', it: 'Bacco e Arianna segnalati nell\'immagine ed evidenziati nell\'elenco', en: 'Bacchus and Ariadne marked on the image and highlighted in the list' },

  methodStep1Num:     { es: 'paso 1', it: 'passo 1', en: 'step 1' },
  methodStep1Title:   { es: 'Fotografiar', it: 'Fotografare', en: 'Photograph' },
  methodStep1Body: {
    es: 'La captura es sistemática: cada superficie se fotografía con un solape amplio entre tomas, con referencias de color y con la luz lo más estable posible. Después, las fotografías se igualan en color y exposición, para que el color final sea el de la obra y no el de la cámara.',
    it: 'La ripresa è sistematica: ogni superficie viene fotografata con un\'ampia sovrapposizione tra gli scatti, con riferimenti di colore e con una luce il più possibile stabile. Poi le fotografie vengono uniformate per colore ed esposizione, perché il colore finale sia quello dell\'opera e non quello della fotocamera.',
    en: 'Capture is systematic: each surface is photographed with generous overlap between shots, with colour references and with the light kept as stable as possible. The photographs are then matched in colour and exposure, so that the final colour is that of the work and not of the camera.',
  },
  methodStep1Caption: { es: 'Cobertura fotográfica — Villa Farnesina, Loggia di Psiche', it: 'Copertura fotografica — Villa Farnesina, Loggia di Psiche', en: 'Photographic coverage — Villa Farnesina, Loggia di Psiche' },
  methodStep1ImgAlt:  { es: 'Cobertura fotográfica de la Loggia de Psique', it: 'Copertura fotografica della Loggia di Psiche', en: 'Photographic coverage of the Loggia of Psyche' },

  methodStep2Num:     { es: 'paso 2', it: 'passo 2', en: 'step 2' },
  methodStep2Title:   { es: 'Reconstruir en tres dimensiones', it: 'Ricostruire in tre dimensioni', en: 'Reconstruct in three dimensions' },
  methodStep2Body: {
    es: 'La fotogrametría compara los puntos comunes entre fotografías y deduce la forma exacta de la superficie. En relieves y esculturas se generan además mapas de normales, que permiten iluminarla de nuevo.',
    it: 'La fotogrammetria confronta i punti comuni tra le fotografie e ne ricava la forma esatta della superficie. Per rilievi e sculture si generano inoltre mappe delle normali, che permettono di illuminarla di nuovo.',
    en: 'Photogrammetry compares the points shared between photographs and derives the exact shape of the surface. For reliefs and sculptures, normal maps are also generated, which allow the surface to be relit.',
  },
  methodStep2Caption: { es: 'Modelo fotogramétrico — Blender', it: 'Modello fotogrammetrico — Blender', en: 'Photogrammetric model — Blender' },
  methodStep2ImgAlt:  { es: 'Modelo fotogramétrico 3D, vista exterior', it: 'Modello fotogrammetrico 3D, vista esterna', en: '3D photogrammetric model, exterior view' },
  methodStep2ImgAlt2: { es: 'Modelo fotogramétrico 3D, vista cenital', it: 'Modello fotogrammetrico 3D, vista zenitale', en: '3D photogrammetric model, top view' },

  methodStep3Num:     { es: 'paso 3', it: 'passo 3', en: 'step 3' },
  methodStep3Title:   { es: 'Desplegar', it: 'Dispiegare', en: 'Unfold' },
  methodStep3Body: {
    es: 'Las imágenes se proyectan sobre esa geometría y, cuando la obra lo permite, la superficie se despliega sobre un plano. Es un proceso parecido a hacer un mapa de la Tierra: si las piezas son suficientemente pequeñas, la distorsión es mínima.',
    it: 'Le immagini vengono proiettate su quella geometria e, quando l\'opera lo consente, la superficie viene sviluppata su un piano. È un processo simile alla creazione di una mappa della Terra: se i pezzi sono sufficientemente piccoli, la distorsione è minima.',
    en: 'The images are projected onto that geometry and, where the work allows it, the surface is unfolded onto a plane. It is a process similar to making a map of the Earth: if the pieces are small enough, the distortion is minimal.',
  },
  methodStep3Caption: { es: 'Planos de proyección — Blender', it: 'Piani di proiezione — Blender', en: 'Projection planes — Blender' },
  methodStep3ImgAlt:  { es: 'Planos de proyección en Blender', it: 'Piani di proiezione in Blender', en: 'Projection planes in Blender' },
  methodStep3ImgAlt2: { es: 'Verificación de cobertura de los planos', it: 'Verifica della copertura dei piani', en: 'Coverage verification of the planes' },

  methodStep4Num:     { es: 'paso 4', it: 'passo 4', en: 'step 4' },
  methodStep4Title: { es: 'Retocar', it: 'Ritoccare', en: 'Retouch' },
  methodStep4Body: {
    es: 'El retoque se limita a lo que es ajeno a la obra: uniones entre fotografías, reflejos, sombras y elementos añadidos, como cables o focos. No se reconstruyen zonas perdidas. Lo que se ve en pantalla es lo que hay en el muro.',
    it: 'Il ritocco si limita a ciò che è estraneo all\'opera: giunzioni tra le fotografie, riflessi, ombre ed elementi aggiunti, come cavi o fari. Non si ricostruiscono le parti perdute. Ciò che si vede sullo schermo è ciò che c\'è sul muro.',
    en: 'Retouching is limited to what is foreign to the work: seams between photographs, reflections, shadows and added elements such as cables or lights. Lost areas are not reconstructed. What you see on screen is what is on the wall.',
  },
  methodStep4Caption: { es: 'Los cinco planos — antes y después de componer', it: 'I cinque piani — prima e dopo la composizione', en: 'The five planes — before and after composing' },
  methodStep4ImgAlt:  { es: 'Los cinco planos antes de componer', it: 'I cinque piani prima della composizione', en: 'The five planes before composing' },
  methodStep4ImgAlt2: { es: 'Los cinco planos compuestos', it: 'I cinque piani composti', en: 'The five planes composed' },

  methodResultTitle: { es: 'El resultado', it: 'Il risultato', en: 'The result' },
  methodResultBody: {
    es: 'Cada resultado se prepara para verse en la web a plena resolución, sin programas adicionales, de modo que cualquiera pueda acercarse al detalle como lo haría un restaurador subido al andamio.',
    it: 'Ogni risultato viene preparato per essere visto sul web a piena risoluzione, senza programmi aggiuntivi, così che chiunque possa avvicinarsi al dettaglio come farebbe un restauratore sul ponteggio.',
    en: 'Each result is prepared to be viewed on the web at full resolution, with no additional software, so that anyone can move in on the detail as a restorer on the scaffolding would.',
  },
  methodResultImgAlt: { es: 'Resultado final — Loggia di Psiche desplegada', it: 'Risultato finale — Loggia di Psiche dispiegata', en: 'Final result — Loggia di Psiche unfolded' },

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

  // --- Carrusel (Carousel.jsx). {n} y {total} se sustituyen en el código.
  carouselPrev:     { es: 'Imagen anterior', it: 'Immagine precedente', en: 'Previous image' },
  carouselNext:     { es: 'Imagen siguiente', it: 'Immagine successiva', en: 'Next image' },
  carouselThumbs:   { es: 'Miniaturas', it: 'Miniature', en: 'Thumbnails' },
  carouselPosition: { es: 'Posición', it: 'Posizione', en: 'Position' },
  carouselImageOf:  { es: 'Imagen {n} de {total}', it: 'Immagine {n} di {total}', en: 'Image {n} of {total}' },
  carouselGoTo:     { es: 'Ir a la imagen {n}', it: 'Vai all\'immagine {n}', en: 'Go to image {n}' },

  // --- Botones del visor 2D (DeepZoomViewer.jsx) --------------------------
  viewerZoomIn:      { es: 'Acercar', it: 'Ingrandisci', en: 'Zoom in' },
  viewerZoomOut:     { es: 'Alejar', it: 'Riduci', en: 'Zoom out' },
  viewerHome:        { es: 'Vista inicial', it: 'Vista iniziale', en: 'Initial view' },
  viewerFsEnter:     { es: 'Pantalla completa', it: 'Schermo intero', en: 'Full screen' },
  viewerFsExit:      { es: 'Salir de pantalla completa', it: 'Esci da schermo intero', en: 'Exit full screen' },
  viewerFsHint:      { es: 'Pulsa Esc para salir de la pantalla completa', it: 'Premi Esc per uscire dallo schermo intero', en: 'Press Esc to exit full screen' },
  viewerFsExitShort: { es: 'Salir', it: 'Esci', en: 'Exit' },
  viewerRotateCCW:   { es: 'Girar a la izquierda', it: 'Ruota a sinistra', en: 'Rotate left' },
  viewerRotateCW:    { es: 'Girar a la derecha', it: 'Ruota a destra', en: 'Rotate right' },
  // visores 3D
  viewerModeOrbit:      { es: 'Objeto 3D', it: 'Oggetto 3D', en: '3D object' },
  viewerModeEye:        { es: 'Desde el suelo', it: 'Dal pavimento', en: 'From the floor' },
  viewerMoveLight:      { es: 'Mover luz', it: 'Muovi luce', en: 'Move light' },
  viewerMovingLight:    { es: 'Moviendo luz', it: 'Luce in movimento', en: 'Moving light' },
  viewerMoveLightTitle: { es: 'Actívalo para mover la luz arrastrando', it: 'Attivalo per muovere la luce trascinando', en: 'Turn on to move the light by dragging' },
  viewerLightDir:       { es: 'Dirección de la luz', it: 'Direzione della luce', en: 'Light direction' },
  viewerHeightCap:      { es: 'altura', it: 'altezza', en: 'height' },
  viewerCamHeight:      { es: 'Altura de la cámara', it: 'Altezza della camera', en: 'Camera height' },
  viewerCamAzimuth:     { es: 'Azimut de la cámara', it: 'Azimut della camera', en: 'Camera azimuth' },
  pathCeiling:          { es: 'techo', it: 'soffitto', en: 'ceiling' },
  pathHeight:           { es: 'Altura', it: 'Altezza', en: 'Height' },
  pathAdvance:          { es: 'Avance por el recorrido', it: 'Avanzamento lungo il percorso', en: 'Progress along the path' },
  pathDragHint:         { es: 'arrastra para mirar', it: 'trascina per guardare', en: 'drag to look around' },

  // --- Página Contacto (Contact.jsx) -------------------------------------
  contactTitle: { es: 'Contacto', it: 'Contatti', en: 'Contact' },
  contactP1: {
    es: 'Cualquier persona puede escribirnos para comentar los trabajos publicados, hacer una pregunta o señalar un error.',
    it: 'Chiunque può scriverci per commentare i lavori pubblicati, porre una domanda o segnalare un errore.',
    en: 'Anyone is welcome to write to us to comment on the published work, ask a question or point out an error.',
  },
  contactP1b: {
    es: 'Si representa a una universidad, un museo, una administración pública o una fundación dedicada al patrimonio, puede además proponernos una obra o plantear una colaboración.',
    it: 'Se rappresentate un\'università, un museo, un ente pubblico o una fondazione impegnata nella tutela del patrimonio, potete anche proporci un\'opera o avviare una collaborazione.',
    en: 'If you represent a university, a museum, a public administration or a heritage foundation, you can also propose a work or discuss a collaboration.',
  },
  contactP2: {
    es: 'Los mensajes los leen directamente Magoga y Félix.',
    it: 'I messaggi vengono letti direttamente da Magoga e Félix.',
    en: 'Messages are read directly by Magoga and Félix.',
  },
  contactCopy:    { es: 'Copiar dirección', it: 'Copia indirizzo', en: 'Copy address' },
  contactCopied:  { es: 'Dirección copiada', it: 'Indirizzo copiato', en: 'Address copied' },
  contactSubject: { es: 'Art Unfolded', it: 'Art Unfolded', en: 'Art Unfolded' },

  // --- Ayuda de los visores (HelpOverlay.jsx) -----------------------------
  // Cada help<Tipo> es una lista: una frase por línea del panel.
  helpTitle: { es: 'Cómo usar este visor', it: 'Come usare questo visore', en: 'How to use this viewer' },
  helpOpen:  { es: 'Mostrar ayuda', it: 'Mostra aiuto', en: 'Show help' },
  helpDeepzoom: {
    es: ['Arrastra para desplazarte.', 'Rueda, pellizco o + − para acercar y alejar.', 'Gira la imagen con ↺ ↻.', 'Al acercarte aparecen puntos marcados: púlsalos para ver su descripción.', '⌂ vuelve a la vista inicial.', 'El botón de las cuatro esquinas abre la pantalla completa (Esc para salir).'],
    it: ['Trascina per spostarti.', 'Rotella, pizzico o + − per ingrandire e ridurre.', 'Ruota l’immagine con ↺ ↻.', 'Avvicinandoti compaiono dei punti segnati: toccali per leggerne la descrizione.', '⌂ torna alla vista iniziale.', 'Il pulsante dei quattro angoli apre lo schermo intero (Esc per uscire).'],
    en: ['Drag to pan.', 'Scroll, pinch or + − to zoom in and out.', 'Rotate the image with ↺ ↻.', 'Marked points appear as you zoom in: select one to read its description.', '⌂ returns to the initial view.', 'The four-corners button opens full screen (Esc to exit).'],
  },
  helpModel3d: {
    es: ['Arrastra para orbitar.', 'Rueda, pellizco o + − para acercar y alejar.', '⌂ vuelve a la vista inicial.', 'El botón de las cuatro esquinas abre la pantalla completa (Esc para salir).'],
    it: ['Trascina per ruotare attorno al modello.', 'Rotella, pizzico o + − per ingrandire e ridurre.', '⌂ torna alla vista iniziale.', 'Il pulsante dei quattro angoli apre lo schermo intero (Esc per uscire).'],
    en: ['Drag to orbit.', 'Scroll, pinch or + − to zoom in and out.', '⌂ returns to the initial view.', 'The four-corners button opens full screen (Esc to exit).'],
  },
  helpObject3d: {
    es: ['Arrastra para desplazarte.', 'Deslizadores de azimut y altura para girar.', 'Activa «Mover luz» para cambiar la dirección de la luz rasante.', 'Rueda, pellizco o + − para acercar y alejar.', '⌂ vuelve a la vista inicial.', 'El botón de las cuatro esquinas abre la pantalla completa (Esc para salir).'],
    it: ['Trascina per spostarti.', 'Cursori di azimut e altezza per ruotare.', 'Attiva «Muovi luce» per cambiare la direzione della luce radente.', 'Rotella, pizzico o + − per ingrandire e ridurre.', '⌂ torna alla vista iniziale.', 'Il pulsante dei quattro angoli apre lo schermo intero (Esc per uscire).'],
    en: ['Drag to pan.', 'Azimuth and height sliders to rotate.', 'Turn on “Move light” to change the direction of the raking light.', 'Scroll, pinch or + − to zoom in and out.', '⌂ returns to the initial view.', 'The four-corners button opens full screen (Esc to exit).'],
  },
  helpPath3d: {
    es: ['Arrastra para mirar alrededor.', 'Deslizador inferior para avanzar, lateral para la altura.', 'Rueda, pellizco o + − para acercar y alejar.', '⌂ vuelve a la vista inicial.', 'El botón de las cuatro esquinas abre la pantalla completa (Esc para salir).'],
    it: ['Trascina per guardarti intorno.', 'Cursore in basso per avanzare, laterale per l’altezza.', 'Rotella, pizzico o + − per ingrandire e ridurre.', '⌂ torna alla vista iniziale.', 'Il pulsante dei quattro angoli apre lo schermo intero (Esc per uscire).'],
    en: ['Drag to look around.', 'Bottom slider to move forward, side slider for height.', 'Scroll, pinch or + − to zoom in and out.', '⌂ returns to the initial view.', 'The four-corners button opens full screen (Esc to exit).'],
  },
};
