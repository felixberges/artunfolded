// newsData.js — noticias de la página «Noticias» (News.jsx).
// Para añadir una: copia un bloque y ponlo ARRIBA (la página las ordena por
// fecha de todos modos, la más reciente primero).
//   id       identificador único, sin espacios
//   date     'AAAA-MM-DD'
//   title    { es, it, en }
//   body     { es, it, en } — párrafos separados por una línea en blanco (\n\n)
//   image    opcional: { src: '/news/archivo.jpg', alt: { es, it, en } }
//   link     opcional: enlace a una lámina, { monument: 'farnessina', label: { es, it, en } }

export const news = [
  {
    id: 'publicacion',
    date: '2026-10-02',
    title: {
      es: 'Art Unfolded, en línea',
      it: 'Art Unfolded è online',
      en: 'Art Unfolded is online',
    },
    body: {
      es: 'Publicamos Art Unfolded, un proyecto personal y sin ánimo de lucro de Magoga y Félix. Fotografiamos obras pensadas para un lugar concreto (bóvedas, mosaicos, relieves) y las presentamos en alta resolución, cada una con un visor diseñado para ella. Empezamos con cinco láminas, de El Escorial a Roma, y aquí iremos contando los trabajos nuevos.',
      it: 'Pubblichiamo Art Unfolded, un progetto personale e senza scopo di lucro di Magoga e Félix. Fotografiamo opere pensate per un luogo preciso (volte, mosaici, rilievi) e le presentiamo ad alta risoluzione, ognuna con un visore progettato per lei. Cominciamo con cinque tavole, dall\'Escorial a Roma, e qui racconteremo i nuovi lavori.',
      en: 'We are publishing Art Unfolded, a personal, non-profit project by Magoga and Félix. We photograph works made for a specific place (vaults, mosaics, reliefs) and present them in high resolution, each with a viewer designed for it. We are starting with five plates, from El Escorial to Rome, and this is where we will share new work.',
    },
  },
];
