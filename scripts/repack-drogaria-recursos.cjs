'use strict';
/* Drogaria — reempacota os recursos rec--drogaria-*.js a partir dos arquivos
   da raiz (fonte única). Não toca no app--drogaria nem no VISA_LOCAL.
   Rode antes da cadeia (repack-medicamentos etc.). Idempotente.
   Uso: node scripts/repack-drogaria-recursos.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, blocks, lz} = unpack(file);
const nomes = ['drogaria-ocr-tools', 'drogaria-review', 'drogaria-section1', 'drogaria-area-fisica', 'drogaria-servicos-documentos', 'drogaria-final-bridge', 'drogaria-report-final', 'drogaria-relatorio-revisao', 'drogaria-normas-extras', 'drogaria-ocr-politica'];
let n = 0;
for (const nome of nomes) {
  const id = 'rec--' + nome + '.js', src = fs.readFileSync(path.join(root, nome + '.js'), 'utf8');
  if (!blocks.has(id)) throw Error('bloco ausente: ' + id);
  if (blocks.get(id) === src) continue;
  const enc = lz.compressToBase64(src);
  if (lz.decompressFromBase64(enc) !== src) throw Error('round-trip ' + nome);
  const re = new RegExp('(<script type="text/plain" id="' + id.replace(/\./g, '\\.') + '">)[\\s\\S]*?(</script>)');
  if (!re.test(html)) throw Error('tag ausente: ' + id);
  html = html.replace(re, (_, a, b) => a + enc + b); n++;
}
fs.writeFileSync(file, html);
console.log('Drogaria: ' + n + ' recurso(s) reempacotado(s).');
