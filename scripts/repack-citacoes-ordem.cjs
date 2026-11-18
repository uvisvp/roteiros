'use strict';
/* Motor de citações (nuc--citacoes.js): aplica as correções declaradas em
   scripts/citacoes/nucleo-correcoes.cjs (parágrafo antes dos seus incisos; § 10 sem ordinal).
   Idempotente. Uso: node scripts/repack-citacoes-ordem.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const {aplica} = require('./citacoes/nucleo-correcoes.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const ID = 'nuc--citacoes.js';
let feito = false, mudou = false;
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== ID) return m;
  feito = true;
  const src = lz.decompressFromBase64(enc.trim()), out = aplica(src);
  if (out === src) return m;
  const novo = lz.compressToBase64(out); if (lz.decompressFromBase64(novo) !== out) throw Error('round-trip');
  mudou = true; return a + novo + z;
});
if (!feito) throw Error(ID + ' não encontrado');
fs.writeFileSync(file, html);
console.log('Motor de citações: ' + (mudou ? 'correções aplicadas.' : 'já atualizado.'));
