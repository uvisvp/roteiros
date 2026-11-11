'use strict';
/* Respostas Sim / Não / Não se aplica em todos os núcleos (pedido de 11/11/2026; já valia em
   Medicamentos desde 09/11/2026). Só muda o rótulo dos botões e do resumo: os valores gravados
   (ok/nao/na, yes/no/na, C/NC/NA) e as frases do relatório não mudam. O motor roteiro-simples
   recebe o padrão em scripts/roteiro-simples-pagina.cjs.
   Idempotente. Uso: node scripts/repack-respostas-simnao.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const TROCAS = {
  'app--odontologia': [
    ["[['ok','Cumpre'],['nao','Não cumpre'],['na','Não se aplica']]", "[['ok','Sim'],['nao','Não'],['na','Não se aplica']]"],
    ['<div class="pu-campo">Não cumpre<b>${c.nao}</b>', '<div class="pu-campo">Irregulares<b>${c.nao}</b>']
  ],
  'app--servicos-alimentacao-roteiro': [
    ["var SA_RESP = [['ok', 'Cumpre'], ['nao', 'Não cumpre'], ['na', 'Não se aplica']];", "var SA_RESP = [['ok', 'Sim'], ['nao', 'Não'], ['na', 'Não se aplica']];"],
    ["<div class=\"pu-campo\">Não cumpre<b>' + nc + '</b>", "<div class=\"pu-campo\">Irregulares<b>' + nc + '</b>"]
  ],
  'app--servicos-assistenciais': [
    ["{doc:[['C','Apresentou'],['NC','Não apresentou'],['NA','Não se aplica']],rot:[['C','Cumpre'],['NC','Não cumpre'],['NA','Não se aplica']]}",
     "{doc:[['C','Sim'],['NC','Não'],['NA','Não se aplica']],rot:[['C','Sim'],['NC','Não'],['NA','Não se aplica']]}"]
  ],
  'rec--roteiro-guiado.js': [
    ['[["yes", "Cumpre"], ["no", "Não cumpre"], ["na", "Não se aplica"]]', '[["yes", "Sim"], ["no", "Não"], ["na", "Não se aplica"]]']
  ]
};
const feitos = new Set();
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (!TROCAS[id]) return m;
  feitos.add(id);
  const src = lz.decompressFromBase64(enc.trim());
  let s = src;
  for (const [de, para] of TROCAS[id]) {
    if (s.includes(para)) continue;
    if (s.split(de).length !== 2) throw Error(id + ': trecho não localizado de forma única — ' + de.slice(0, 60));
    s = s.replace(de, () => para);
  }
  if (s === src) return m;
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + id);
  return a + novo + z;
});
for (const id of Object.keys(TROCAS)) if (!feitos.has(id)) throw Error('Bloco não localizado: ' + id);
fs.writeFileSync(file, html);
console.log('Respostas Sim / Não / Não se aplica em Odontologia, Alimentos, Produtos e Serviços assistenciais.');
