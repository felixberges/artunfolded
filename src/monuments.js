// monuments.js — registro de monumentos.
// Por ahora una sola página, generada desde content/trastevere.txt por
// scripts/build-monuments.mjs. Para regenerar:  node scripts/build-monuments.mjs
//
// (La entrada antigua escrita a mano queda sustituida por la generada. Cuando
//  el formato de página exprese múltiples sources / overlay IR, esto seguirá
//  saliendo del build sin tocar componentes.)

import generated from './data/monuments.generated.json';

export const monuments = generated;
