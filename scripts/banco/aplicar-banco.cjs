'use strict';
/* Acrescenta ao banco de legislação (bloco banco--v11) as normas estruturadas por
   scripts/banco/estruturar.py. Idempotente: cada norma é substituída pelo id.
   Os anexos (texto corrido, sem dispositivos) não entram no banco; ficam para os
   módulos que embutem o texto (ver scripts/citacoes/assistenciais.py).
   Uso: node scripts/banco/aplicar-banco.cjs */
const fs = require('node:fs'), path = require('node:path'), {execFileSync} = require('node:child_process');
const {unpack} = require('../integrated-html.cjs');
const root = path.join(__dirname, '..', '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const normas = JSON.parse(execFileSync('python3', [path.join(__dirname, 'estruturar.py')], {encoding: 'utf8', maxBuffer: 64 << 20}));
const re = /(<script type="text\/plain" id="banco--v11">)([\s\S]*?)(<\/script>)/;
const m = html.match(re); if (!m) throw Error('banco--v11');
const txt = lz.decompressFromBase64(m[2]); if (!txt) throw Error('descompactação do banco');
const B = JSON.parse(txt);
for (const n of normas) {
  const e = Object.assign({}, n); delete e.anexos;
  for (const g of Object.keys(B.g)) B.g[g] = B.g[g].filter(x => x.i !== e.i);
  (B.g[e.gr] = B.g[e.gr] || []).push(e);
  B.g[e.gr].sort((a, b) => a.i.localeCompare(b.i));
}
B.g = Object.fromEntries(Object.keys(B.g).sort().map(k => [k, B.g[k]]));
const nota = 'acréscimos 2026-09-26: ' + normas.map(n => n.i).join(', ');
B.reprocessado = B.reprocessado || {};
B.reprocessado.etapas = (B.reprocessado.etapas || []).filter(x => !x.startsWith('acréscimos 2026-09-26')).concat(nota);
const novo = JSON.stringify(B);
const enc = lz.compressToBase64(novo); if (lz.decompressFromBase64(enc) !== novo) throw Error('round-trip do banco');
html = html.replace(re, () => m[1] + enc + m[3]);
fs.writeFileSync(file, html);
console.log('Banco: ' + normas.map(n => n.i + ' (' + n.n.length + ' dispositivos)').join('; '));
