'use strict';
/* Projeto físico no Município de São Paulo (revisão de 25/10/2026). A RDC 1.002/2025, art. 13
   (odontologia), e a RDC 502/2021, art. 19 (ILPI), exigem projeto aprovado pela vigilância, mas no
   Município a análise do projeto segue a Portaria SMS/COVISA nº 404/2024 (DCFF, autodeclaratória), que
   pelo Anexo I da Portaria SMS nº 266/2025 não alcança a odontologia (CNAE 8630-5/04, licença por
   DCA) nem a ILPI (8711-5/02, inspeção prévia). A pergunta “projeto aprovado pela vigilância” não tinha
   como ser cumprida e induzia a marcar Não cumpre: passa a perguntar pela estrutura física
   conferida na inspeção. A orientação da DCFF fica em campo/roteiro-saber-mais.js.
   Idempotente. Uso: node scripts/repack-projeto-fisico.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);

const TROCAS = {
  'app--odontologia': [
    ['"t":"Projeto Básico de Arquitetura aprovado pela vigilância sanitária local."',
      '"t":"Estrutura física compatível com as atividades e com a RDC 1.002/2025, conferida na inspeção (no Município de São Paulo, o projeto do serviço odontológico não é aprovado pela vigilância nem exige DCFF)."']
  ],
  'app--servicos-assistenciais': [
    ['"i":"Projeto arquitetônico aprovado pela autoridade sanitária."',
      '"i":"Estrutura física compatível com a RDC 502/2021, conferida na inspeção (no Município de São Paulo, o projeto da ILPI não é aprovado pela vigilância nem exige DCFF; a licença inicial depende de inspeção prévia)."']
  ]
};

const feitos = new Set();
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (!TROCAS[id]) return m;
  feitos.add(id);
  const src = lz.decompressFromBase64(enc.trim());
  let s = src;
  for (const [de, para] of TROCAS[id]) {
    if (s.includes(de)) s = s.split(de).join(para);
    else if (!s.includes(para)) throw Error(id + ': trecho não localizado: ' + de.slice(0, 70));
  }
  if (s === src) return m;
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + id);
  return a + novo + z;
});
for (const id of Object.keys(TROCAS)) if (!feitos.has(id)) throw Error('Bloco não localizado: ' + id);
fs.writeFileSync(file, html);
console.log('Projeto físico: Odontologia e ILPI perguntam pela estrutura conferida na inspeção.');
