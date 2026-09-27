'use strict';
/* Avaliação de risco (drogaria e manipulação): lista única de opções no relatório.
   Drogaria: troca as opções do campo “Avaliação de risco da equipe”.
   Manipulação: acrescenta o campo (state.report.risco) junto às considerações finais;
   a prévia/relatório o imprime (farmacia-manipulacao-v2.js). Idempotente.
   Uso: node scripts/repack-risco.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const LISTA = ['Não se aplica', 'Baixo', 'Satisfatório com restrições', 'Satisfatório', 'Insatisfatório', 'Insatisfatório com interdição parcial', 'Insatisfatório com interdição total'];
const JS = JSON.stringify(LISTA).replace(/"/g, "'");
const TROCAS = {
  'app--drogaria': [["['Baixo','Moderado','Alto','Crítico','Não foi possível concluir']", JS]],
  'app--farmacia-manipulacao': [
    ['const conclusions={"Satisfatório":"Satisfatório","Satisfatório com restrições":"Satisfatório com restrições","Insatisfatório":"Insatisfatório"};',
     'const conclusions={"Satisfatório":"Satisfatório","Satisfatório com restrições":"Satisfatório com restrições","Insatisfatório":"Insatisfatório"};\nconst RISCOS=' + JSON.stringify(LISTA) + ';'],
    ['<h3>Considerações finais / avaliação de risco</h3><div class="field"><textarea data-report-simple="consideracoes"',
     '<h3>Considerações finais / avaliação de risco</h3><div class="field"><label>Avaliação de risco</label><select data-report-simple="risco"><option value="">Selecione</option>${RISCOS.map(k=>`<option ${r.risco===k?"selected":""}>${esc(k)}</option>`).join("")}</select></div><div class="field"><textarea data-report-simple="consideracoes"']]
};
for (const [id, trocas] of Object.entries(TROCAS)) {
  const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação ' + id);
  for (const [de, para] of trocas) { if (app.includes(para)) continue; if (app.split(de).length !== 2) throw Error('Trecho não localizado em ' + id + ': ' + de.slice(0, 60)); app = app.replace(de, () => para); }
  const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]);
}
fs.writeFileSync(file, html);
console.log('Avaliação de risco: ' + LISTA.join(' · '));
