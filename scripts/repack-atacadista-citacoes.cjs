'use strict';
/* Atacadista de medicamentos (app--distribuidoras-transportadoras): citações que o botão
   não abria (revisão geral de 25/10/2026). O botão separa a citação por “;” e procura cada
   parte no banco v12 pelo nome da norma; parte sem o nome (“…; Art. 25”) ou com vários
   artigos (“arts. 34 e 35”) não abria o texto. Cada parte passa a trazer a norma e um só
   artigo. Também:
   - q334 (POP de recolhimento) citava o art. 18, VII e o art. 25 (reclamações): passa ao
     art. 18, VI (recolhimento) e ao art. 29, parágrafo único;
   - q906: RDC 204/2006 sem dispositivo → art. 1º;
   - q396/q397: RDC 166/2017 sem dispositivo → arts. 5º e 7º (banco v12, AnvisaLegis).
   Idempotente. Uso: node scripts/repack-atacadista-citacoes.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const ID = 'app--distribuidoras-transportadoras';
const R = 'RDC Anvisa nº 430/2020, ';

const TROCAS = [
  ['"id":"q334","text":"Existe um POP para recolhimento que define claramente as responsabilidades?","legal":"' + R + 'art. 18, VII; Art. 25"',
    '"id":"q334","text":"Existe um POP para recolhimento que define claramente as responsabilidades?","legal":"' + R + 'art. 18, VI; ' + R + 'art. 29, parágrafo único"'],
  ['"id":"q396","text":"Métodos não farmacopeicos estão validados?","legal":"RDC 166/2017","ncText":"Não cumpre o requisito avaliado: Métodos não farmacopeicos estão validados? (RDC 166/2017)"',
    '"id":"q396","text":"Métodos não farmacopeicos estão validados?","legal":"RDC Anvisa nº 166/2017, art. 5º","ncText":"Não cumpre o requisito avaliado: Métodos não farmacopeicos estão validados? (RDC Anvisa nº 166/2017, art. 5º)"'],
  ['"legal":"RDC 166/2017","ncText":"Não cumpre o requisito avaliado: A adequabilidade dos métodos farmacopeicos foi verificada nas condições do laboratório? (RDC 166/2017)"',
    '"legal":"RDC Anvisa nº 166/2017, art. 7º","ncText":"Não cumpre o requisito avaliado: A adequabilidade dos métodos farmacopeicos foi verificada nas condições do laboratório? (RDC Anvisa nº 166/2017, art. 7º)"'],
  [R + 'art. 83; art. 64, III', R + 'art. 83; ' + R + 'art. 64, III'],
  [R + 'art. 18, VII; Art. 25', R + 'art. 18, VII; ' + R + 'art. 25'],
  [R + 'art. 18, IV; Art. 37', R + 'art. 18, IV; ' + R + 'art. 37'],
  [R + 'art. 18, XII; Art. 26, §5º', R + 'art. 18, XII; ' + R + 'art. 26, §5º'],
  ['RDC Anvisa nº 222/2018, arts. 17 e 22', 'RDC Anvisa nº 222/2018, art. 17; RDC Anvisa nº 222/2018, art. 22'],
  ['RDC Anvisa nº 204/2006, regulamento técnico', 'RDC Anvisa nº 204/2006, art. 1º'],
  [R + 'arts. 34, I a IV, e 35', R + 'art. 34, I a IV; ' + R + 'art. 35'],
  [R + 'arts. 34 e 35', R + 'art. 34; ' + R + 'art. 35'],
  [R + 'arts. 18, IX e 40', R + 'art. 18, IX; ' + R + 'art. 40'],
  [R + 'arts. 40, 72 a 74', R + 'art. 40; ' + R + 'art. 72; ' + R + 'art. 73; ' + R + 'art. 74'],
  [R + 'art. 73, Art. 74 e Art. 76', R + 'art. 73; ' + R + 'art. 74; ' + R + 'art. 76'],
  [R + 'art. 64, VI c/c Art. 72', R + 'art. 64, VI; ' + R + 'art. 72'],
  [R + 'art. 9º, Art. 18', R + 'art. 9º; ' + R + 'art. 18'],
  [R + 'art. 21 e Art. 22', R + 'art. 21; ' + R + 'art. 22'],
  [R + 'art. 6º e Art. 64, VI', R + 'art. 6º; ' + R + 'art. 64, VI'],
  [R + 'art. 6º, Art. 64, VI', R + 'art. 6º; ' + R + 'art. 64, VI'],
  [R + 'art. 8º e Art. 74', R + 'art. 8º; ' + R + 'art. 74']
];

let feito = false;
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== ID) return m;
  feito = true;
  const src = lz.decompressFromBase64(enc.trim());
  let s = src;
  for (const [de, para] of TROCAS) {
    if (s.includes(de)) s = s.split(de).join(para);
    else if (!s.includes(para)) throw Error('Trecho não localizado: ' + de.slice(0, 80));
  }
  if (s === src) return m;
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + ID);
  return a + novo + z;
});
if (!feito) throw Error('Bloco não localizado: ' + ID);
fs.writeFileSync(file, html);
console.log('Atacadista: cada parte da citação com a norma e um só artigo.');
