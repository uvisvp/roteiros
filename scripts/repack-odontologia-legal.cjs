'use strict';
/* Odontologia — texto oficial nas citações de radiologia e de controlados (auditoria de 14/11/2026, E05).
   Oito citações abriam um resumo do artigo, e não o texto: RDC 611/2022, arts. 28, 62, 63 e 64; IN 95/2021,
   arts. 1º, 2º e 5º; Portaria SVS/MS 344/1998, art. 67. Aqui o texto passa a ser o do banco integrado
   (banco--v11, que não é alterado), conferido em 15/11/2026 com as páginas do AnvisaLegis — os 33
   dispositivos iguais. Na IN 95/2021, o banco guarda um trecho de tabela do Anexo I com o identificador
   a5b (“desta Instrução Normativa G Levantamento radiométrico…”); ele não é versão do art. 5º e fica
   de fora: a lista de dispositivos de cada artigo é explícita.
   Formato do texto: o do módulo (rótulo numa linha, texto na seguinte). Idempotente.
   Uso: node scripts/repack-odontologia-legal.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz, blocks} = unpack(file);
const ID = 'app--odontologia';
const R = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix'];
const inc = (a, n) => R.slice(0, n).map(r => a + '-' + r);
/* id da citação → dispositivos do banco, na ordem do texto */
const PLANO = {
  'rdc-anvisa-611-2022:a28': ['a28', 'a28pu'],
  'rdc-anvisa-611-2022:a62': ['a62', ...inc('a62', 2)],
  'rdc-anvisa-611-2022:a63': ['a63', ...inc('a63', 9)],
  'rdc-anvisa-611-2022:a64': ['a64'],
  'in-anvisa-95-2021:a1': ['a1', 'a1pu'],
  'in-anvisa-95-2021:a2': ['a2', ...inc('a2', 7), 'a2pu'],
  'in-anvisa-95-2021:a5': ['a5', ...inc('a5', 4)],
  'portaria-svs-ms-344-1998:a67': ['a67']
};
const BANCO = [].concat(...Object.values(JSON.parse(blocks.get('banco--v11')).g));
function rotulo(raiz, id) {
  if (id === raiz) return 'Art. ' + raiz.slice(1);
  const r = id.slice(raiz.length);
  if (r === 'pu') return 'Parágrafo único';
  let m = /^p(\d+)$/.exec(r); if (m) return '§ ' + m[1] + 'º';
  m = /^-([ivxl]+)$/.exec(r); if (m) return m[1].toUpperCase();
  throw Error('rótulo não reconhecido: ' + id);
}
let n = 0, feito = false;
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== ID) return m;
  feito = true;
  const src = lz.decompressFromBase64(enc.trim());
  const i = src.indexOf('const DATA='); if (i < 0 || src.indexOf('const DATA=', i + 1) >= 0) throw Error('const DATA não localizado de forma única');
  const j = src.indexOf('\n', i), bruto = src.slice(i + 11, j), txt = bruto.replace(/;\s*$/, ''), D = JSON.parse(txt);
  if (JSON.stringify(D) !== txt) throw Error('DATA não está em JSON compacto');
  for (const [cit, ids] of Object.entries(PLANO)) {
    const [lei, raiz] = cit.split(':'), L = BANCO.find(x => x.i === lei), e = D.legal.filter(x => x.id === cit);
    if (!L || e.length !== 1) throw Error(cit + ': citação ou norma não localizada');
    const texto = ids.map(nid => { const no = L.n.find(x => x[0] === nid); if (!no) throw Error(lei + ': ' + nid + ' não está no banco'); return rotulo(raiz, nid) + '\n' + String(no[1]).trim(); }).join('\n');
    if (e[0].text !== texto) { e[0].text = texto; n++; }
    if (L.u && e[0].url !== L.u) e[0].url = L.u;
  }
  const out = src.slice(0, i + 11) + JSON.stringify(D) + bruto.slice(txt.length) + src.slice(j);
  if (out === src) return m;
  const novo = lz.compressToBase64(out); if (lz.decompressFromBase64(novo) !== out) throw Error('round-trip');
  return a + novo + z;
});
if (!feito) throw Error(ID + ' não encontrado');
fs.writeFileSync(file, html);
console.log('Odontologia — texto oficial nas citações: ' + n + ' de ' + Object.keys(PLANO).length + ' atualizadas.');
