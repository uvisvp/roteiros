'use strict';
/* Redação positiva nos blocos do app (pedido de 20/10/2026): troca, em todos os blocos
   app-- e rec--, as perguntas e frases de conformidade escritas como ausência do erro
   pela condição correta (scripts/redacao-positiva.json). As fontes dos roteiros recebem
   as mesmas trocas; este passo cobre os módulos cujos dados só existem no index.html.
   Idempotente. Rodar por último na cadeia. Uso: node scripts/repack-redacao.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
const {trocas} = JSON.parse(fs.readFileSync(path.join(__dirname, 'redacao-positiva.json'), 'utf8'));
let {html, lz} = unpack(file);
const usadas = new Set();
html = html.replace(/(<script type="text\/plain" id="((?:app|rec)--[^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  const src = lz.decompressFromBase64(enc.trim());
  if (!src) return m;
  let s = src;
  trocas.forEach(([de, para], i) => { if (s.includes(de)) { s = s.split(de).join(para); usadas.add(i); } if (s.includes(para)) usadas.add(i); });
  if (s === src) return m;
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + id);
  return a + novo + z;
});
const nunca = trocas.filter((t, i) => !usadas.has(i)).map(t => t[0]);
if (nunca.length) { console.error('Frases da tabela não localizadas em nenhum bloco:\n- ' + nunca.join('\n- ')); process.exit(1); }
fs.writeFileSync(file, html);
console.log('Redação positiva: ' + trocas.length + ' trocas conferidas nos blocos.');
