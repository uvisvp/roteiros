'use strict';
/* Drogaria — revisão do núcleo de medicamentos:
   1. bloco rec--drogaria-relatorio-revisao.js (relatório sem lacunas, sem
      títulos vazios e com numeração sequencial), carregado após o relatório final;
   2. faixa e grade de itens sem numeração dupla (“1 · 4.1”): o número do
      item vem do próprio título quando ele já é numerado.
   Idempotente. Uso: node scripts/repack-drogaria-revisao.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..');
const file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
function change(text, from, to, label) {
  if (text.includes(to)) return text;
  if (!text.includes(from)) throw Error('Trecho esperado não localizado: ' + label);
  return text.replace(from, () => to);
}
for (const [id, arq] of [['rec--drogaria-relatorio-revisao.js', 'drogaria-relatorio-revisao.js'], ['rec--saber-mais.js', 'saber-mais.js'], ['rec--drogaria-report-final.js', 'drogaria-report-final.js'], ['rec--drogaria-final-bridge.js', 'drogaria-final-bridge.js'], ['rec--drogaria-review.js', 'drogaria-review.js']]) {
  const src = fs.readFileSync(path.join(root, arq), 'utf8');
  const enc = lz.compressToBase64(src);
  if (lz.decompressFromBase64(enc) !== src) throw Error('round-trip ' + arq);
  const tag = '<script type="text/plain" id="' + id + '">' + enc + '</script>';
  const re = new RegExp('<script type="text/plain" id="' + id.replace(/\./g, '\\.') + '">[\\s\\S]*?</script>');
  if (re.test(html)) html = html.replace(re, () => tag);
  else html = change(html, '<script type="text/plain" id="rec--drogaria-report-final.js">', tag + '\n<script type="text/plain" id="rec--drogaria-report-final.js">', 'posição do bloco ' + arq);
}
{ const alvo = "'drogaria-report-final.js','saber-mais.js','drogaria-relatorio-revisao.js'].forEach";
  if (!html.includes(alvo)) {
    for (const de of ["'drogaria-report-final.js','drogaria-relatorio-revisao.js'].forEach", "'drogaria-report-final.js'].forEach"]) if (html.includes(de)) { html = html.replace(de, () => alvo); break; }
    if (!html.includes(alvo)) throw Error('carregador da Drogaria não localizado');
  } }
/* numeração dupla */
html = change(html, `return '<button type="button" class="drg-item-card" data-drg-item="'+esc(x.id)+'"><span class="drg-item-number">'+(i+1)+'</span><strong>'+esc(x.title)+'</strong>'`,
  `var drgN=/^(\\d+(?:\\.\\d+)+)\\s+(.*)$/.exec(x.title||'');return '<button type="button" class="drg-item-card" data-drg-item="'+esc(x.id)+'"><span class="drg-item-number">'+(drgN?drgN[1]:(i+1))+'</span><strong>'+esc(drgN?drgN[2]:x.title)+'</strong>'`, 'grade de itens');
{ /* faixa de itens da Drogaria (a mesma sequência de texto existe na Distribuidora) */
  const ancora = `data-drg-item="'+esc(x.id)+'" style="flex:0 0 auto;white-space:nowrap;`;
  const i = html.indexOf(ancora); if (i < 0) throw Error('faixa de itens da Drogaria não localizada');
  const velho = `+(k+1)+' · '+esc(x.title)+'</button>'`, novo = `+(/^\\d+(?:\\.\\d+)+\\s/.test(x.title||'')?esc(x.title):(k+1)+' · '+esc(x.title))+'</button>'`;
  const j = html.indexOf(velho, i), k2 = html.indexOf(novo, i), fim = html.indexOf('</button>', i) + 12;
  if (!(k2 >= 0 && k2 < fim)) { if (j < 0 || j > fim) throw Error('rótulo da faixa da Drogaria não localizado'); html = html.slice(0, j) + novo + html.slice(j + velho.length); }
}
fs.writeFileSync(file, html);
console.log('Drogaria: revisão do relatório e da numeração aplicada.');
