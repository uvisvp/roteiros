'use strict';
/* “Como sai no relatório” (previa-relatorio.js): injeta a prévia por item no fim
   de cada roteiro de inspeção, entre marcadores. Idempotente.
   Uso: node scripts/repack-previa.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const APPS = ['drogaria', 'distribuidoras-transportadoras', 'odontologia', 'servicos-alimentacao-roteiro', 'produtos-correlatos', 'servicos-assistenciais'];
/* Ganchos de leitura do relatório onde a função fica fechada no módulo (sem efeito na tela). */
const GANCHOS = {
  'servicos-alimentacao-roteiro': [["function montaRelatorio() {\r\n  if (montados.rel) return; montados.rel = true;\r\n  pintaRelatorio(pRel);\r\n}",
    "function montaRelatorio() {\r\n  if (montados.rel) return; montados.rel = true;\r\n  pintaRelatorio(pRel);\r\n}\r\n/* prévia “Como sai no relatório” (previa-relatorio.js) */\nwindow.__uvsRelTexto = function () { var d = document.createElement('div'); pintaRelatorio(d); var t = d.querySelector('textarea'); return t ? t.value : ''; };"]]
};
const START = '<!--PREVIA_INICIO-->', END = '<!--PREVIA_FIM-->';
const code = fs.readFileSync(path.join(root, 'previa-relatorio.js'), 'utf8').replace(/<\/(script)/gi, '<\\/$1');
for (const a of APPS) {
  const id = 'app--' + a;
  const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação ' + id);
  for (const [de, para] of GANCHOS[a] || []) { if (app.includes(para) || (para.includes('window.__uvsRelTexto') && app.includes('window.__uvsRelTexto'))) continue; if (app.split(de).length !== 2) throw Error('gancho não localizado em ' + id); app = app.replace(de, () => para); }
  const i0 = app.indexOf(START); if (i0 >= 0) app = app.slice(0, i0) + app.slice(app.indexOf(END) + END.length);
  const k = app.lastIndexOf('</body>'); if (k < 0) throw Error('</body> não localizado em ' + id);
  app = app.slice(0, k) + START + '<script>' + code + '</script>' + END + app.slice(k);
  const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]);
}
/* Produtos: o relatório é montado em rec--roteiro-guiado.js (função fechada); exporta as linhas. */
{ const id = 'rec--roteiro-guiado.js';
  const re = new RegExp('(<script type="text/plain" id="' + id.replace(/\./g, '\\.') + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  let g = lz.decompressFromBase64(m[2]); if (!g) throw Error('descompactação ' + id);
  const de = '  function renderActive() {';
  const para = '  /* prévia “Como sai no relatório” (previa-relatorio.js): as linhas do relatório, sem abrir a folha */\n' +
    '  window.__uvsRelLinhas = () => { const out = []; (cfg.profile.fields || []).forEach((f) => { if (state.meta[f.id]) out.push({ x: f.label + \': \' + state.meta[f.id] }); });\n' +
    '    allItems().filter((item) => state.answers[item._id]).forEach((item) => { const n = state.notes[item._id] || {}; out.push({ x: item._sectionTitle + \' — \' + item.text + \': \' + answerLabel(state.answers[item._id]) + (n.note ? \'. Anotação: \' + n.note : \'\') + (n.evidence ? \'. Evidência: \' + n.evidence : \'\') }); });\n' +
    '    infractionCatalog().filter((it) => matchesInfraction(it.when) && state.selectedInfractions[it.id]).forEach((it) => out.push({ x: \'Infração selecionada: \' + it.text + (it.legal ? \' — \' + it.legal : \'\') })); return out; };\n\n' + de;
  if (!g.includes('window.__uvsRelLinhas')) { if (g.split(de).length !== 2) throw Error('renderActive não localizado'); g = g.replace(de, () => para); }
  const enc = lz.compressToBase64(g); if (lz.decompressFromBase64(enc) !== g) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]); }
fs.writeFileSync(file, html);
console.log('Prévia “Como sai no relatório” injetada: ' + APPS.join(', '));
