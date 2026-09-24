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
const id = 'rec--drogaria-relatorio-revisao.js';
const src = fs.readFileSync(path.join(root, 'drogaria-relatorio-revisao.js'), 'utf8');
const enc = lz.compressToBase64(src);
if (lz.decompressFromBase64(enc) !== src) throw Error('round-trip');
const tag = '<script type="text/plain" id="' + id + '">' + enc + '</script>';
const re = new RegExp('<script type="text/plain" id="' + id.replace(/\./g, '\\.') + '">[\\s\\S]*?</script>');
if (re.test(html)) html = html.replace(re, () => tag);
else html = change(html, '<script type="text/plain" id="rec--drogaria-report-final.js">', tag + '\n<script type="text/plain" id="rec--drogaria-report-final.js">', 'posição do bloco');
html = change(html, "'drogaria-final-bridge.js','drogaria-report-final.js'].forEach(function(file){", "'drogaria-final-bridge.js','drogaria-report-final.js','drogaria-relatorio-revisao.js'].forEach(function(file){", 'carregador da Drogaria');
/* numeração dupla */
html = change(html, `return '<button type="button" class="drg-item-card" data-drg-item="'+esc(x.id)+'"><span class="drg-item-number">'+(i+1)+'</span><strong>'+esc(x.title)+'</strong>'`,
  `var drgN=/^(\\d+(?:\\.\\d+)+)\\s+(.*)$/.exec(x.title||'');return '<button type="button" class="drg-item-card" data-drg-item="'+esc(x.id)+'"><span class="drg-item-number">'+(drgN?drgN[1]:(i+1))+'</span><strong>'+esc(drgN?drgN[2]:x.title)+'</strong>'`, 'grade de itens');
html = change(html, `'" aria-current="'+(k===idx?'step':'false')+'">'+(k+1)+' · '+esc(x.title)+'</button>'`,
  `'" aria-current="'+(k===idx?'step':'false')+'">'+(/^\\d+(?:\\.\\d+)+\\s/.test(x.title||'')?esc(x.title):(k+1)+' · '+esc(x.title))+'</button>'`, 'faixa de itens');
fs.writeFileSync(file, html);
console.log('Drogaria: revisão do relatório e da numeração aplicada.');
