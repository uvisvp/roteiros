'use strict';
/* Conferência das citações com o texto oficial (17/11/2026) — correções.
   1. Banco de legislação (banco--v11): as correções declaradas em scripts/banco/correcoes.cjs
      (Portaria SMS 2.619/2011, itens 9.9, 9.9.2, 9.24, 16.1, 16.1.2 e 16.1.4; Lei 6.360/1976,
      arts. 12 e 67; Lei 13.725/2004, art. 49).
   2. Cópias desses textos dentro dos módulos:
      - Serviços de alimentação: o banco compacto embutido (banco--local-food) recebe as mesmas correções.
      - Serviços assistenciais (banco próprio do módulo): mesmos ajustes da Portaria 2.619 nos itens 9.9,
        9.9.2 e 9.24; ECA, art. 22, na redação da Lei 15.240/2025.
      - Estética: Lei 6.360/1976, art. 12, sem o § 1º revogado.
      - Checklist de documentos (fonte campo/documentos-dados.json; o bloco é regerado por
        scripts/repack-campo.cjs): Portaria 2.619, item 16.1, sem o texto revogado do 16.1.2 e com o 16.1.4 vigente.
   Idempotente. Roda depois de scripts/repack-assistenciais-perfil.cjs.
   Uso: node scripts/repack-legislacao-conferencia.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const {CORRECOES, aplica} = require('./banco/correcoes.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const conta = {};

function bloco(id, fn) {
  let feito = false;
  html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, bid, enc, z) => {
    if (bid !== id) return m;
    feito = true;
    const src = lz.decompressFromBase64(enc.trim()); if (!src) throw Error(id + ': descompactação');
    const out = fn(src);
    if (out === src) return m;
    const novo = lz.compressToBase64(out); if (lz.decompressFromBase64(novo) !== out) throw Error(id + ': round-trip');
    return a + novo + z;
  });
  if (!feito) throw Error(id + ' não encontrado');
}
/* objeto JSON compacto numa linha "const NOME=...;" */
function editaConst(src, nome, fn) {
  const tag = 'const ' + nome + '=', i = src.indexOf(tag);
  if (i < 0 || src.indexOf(tag, i + 1) >= 0) throw Error(tag + ' não localizado de forma única');
  const j = src.indexOf('\n', i), bruto = src.slice(i + tag.length, j), txt = bruto.replace(/;\s*$/, ''), D = JSON.parse(txt);
  if (JSON.stringify(D) !== txt) throw Error(nome + ' não está em JSON compacto');
  fn(D);
  return src.slice(0, i + tag.length) + JSON.stringify(D) + bruto.slice(txt.length) + src.slice(j);
}
const poe = (lei, id) => { const c = CORRECOES.find(x => x.norma === lei), p = c && (c.poe || c.vigente).find(x => x[0] === id); if (!p) throw Error(lei + ': ' + id + ' fora das correções'); return p[1]; };

/* 1. banco */
bloco('banco--v11', src => {
  const B = JSON.parse(src); conta.banco = aplica(B);
  return conta.banco ? JSON.stringify(B) : src;
});

/* 1b. banco compacto embutido no módulo de Serviços de alimentação (bloco interno banco--local-food) */
bloco('app--servicos-alimentacao-roteiro', src => {
  const tag = '<script type="text/plain" id="banco--local-food">', i = src.indexOf(tag);
  if (i < 0 || src.indexOf(tag, i + 1) >= 0) throw Error('alimentação: banco--local-food não localizado de forma única');
  const j = i + tag.length, e = src.indexOf('</script>', j), enc = src.slice(j, e);
  const B = JSON.parse(lz.decompressFromBase64(enc.trim())); conta.alimentos = aplica(B, true);
  if (!conta.alimentos) return src;
  const txt = JSON.stringify(B), novo = lz.compressToBase64(txt); if (lz.decompressFromBase64(novo) !== txt) throw Error('alimentação: round-trip do banco');
  return src.slice(0, j) + novo + src.slice(e);
});

/* 2a. Serviços assistenciais */
const P = 'portaria-sms-2619-2011';
const ECA22 = 'Aos pais incumbe o dever de sustento, guarda, convivência, assistência material e afetiva e educação dos filhos menores, cabendo-lhes ainda, no interesse destes, a obrigação de cumprir e fazer cumprir as determinações judiciais. (Redação dada pela Lei nº 15.240, de 2025)';
/* [id, pai, tipo, rótulo, depoisDe] — estrutura do banco do módulo */
const NOS_2619 = [
  ['n9.9', 'n9', 'inc', '9.9', null],
  ['n9.9.2-i', 'n9.9.2', 'inc', 'I', 'n9.9.2'],
  ['n9.9.2-ii', 'n9.9.2', 'inc', 'II', 'n9.9.2-i'],
  ['n9.9.2-iii', 'n9.9.2', 'inc', 'III', 'n9.9.2-ii'],
  ['n9.24-i', 'n9.24', 'inc', 'I', 'n9.24'],
  ['n9.24-i-a', 'n9.24-i', 'ali', 'a)', 'n9.24-i'],
  ['n9.24-i-b', 'n9.24-i', 'ali', 'b)', 'n9.24-i-a'],
  ['n9.24-ii', 'n9.24', 'inc', 'II', 'n9.24-i-b'],
  ['n9.24-ii-a', 'n9.24-ii', 'ali', 'a)', 'n9.24-ii'],
  ['n9.24-ii-b', 'n9.24-ii', 'ali', 'b)', 'n9.24-ii-a']
];
const TIRA_2619 = ['n9.9b', 'n9-i', 'n9-ii', 'n9-iii', 'n9-iii-a', 'n9-iii-b', 'n9-iii-ab', 'n9-iii-bb'];
bloco('app--servicos-assistenciais', src => editaConst(src, 'DATA', D => {
  let n = 0;
  const L = D.laws[P]; if (!L) throw Error('assistenciais: ' + P + ' ausente');
  const antes = L.nos.length; L.nos = L.nos.filter(x => !TIRA_2619.includes(x.id)); n += antes - L.nos.length;
  for (const [id, p, t, r, depois] of NOS_2619) {
    const novo = {id, p, t, r, x: poe(P, id)}, k = L.nos.findIndex(x => x.id === id);
    if (k >= 0) { if (JSON.stringify(L.nos[k]) !== JSON.stringify(novo)) { L.nos[k] = novo; n++; } continue; }
    const d = L.nos.findIndex(x => x.id === depois); if (d < 0) throw Error('assistenciais: ' + depois + ' ausente');
    L.nos.splice(d + 1, 0, novo); n++;
  }
  for (const x of L.nos) if (x.p && !L.nos.some(y => y.id === x.p)) throw Error('assistenciais: ' + x.id + ' sem pai ' + x.p);
  const e = D.laws['lei-federal-8069-1990'].nos.find(x => x.id === 'a22'); if (!e) throw Error('assistenciais: ECA a22 ausente');
  if (e.x !== ECA22) { e.x = ECA22; n++; }
  if (D.cited && D.cited[P]) D.cited[P] = D.cited[P].filter(c => L.nos.some(x => x.id === c));
  /* nenhuma citação sem dispositivo */
  for (const s of D.services) for (const kind of ['doc', 'rot', 'inf']) for (const x of s[kind] || []) for (const r of x.refs || [])
    if (r.law && r.node && D.laws[r.law] && !D.laws[r.law].nos.some(y => y.id === r.node)) throw Error('assistenciais: citação sem dispositivo — ' + r.law + ' ' + r.node);
  conta.assistenciais = n;
}));

/* 2b. Estética e 2c. checklist de documentos: textos de citação já montados */
const L6360 = 'lei-federal-6360-1976';
bloco('app--estetica', src => {
  const velho = 'Art. 12 Nenhum dos produtos de que trata esta Lei, inclusive os importados, poderá ser industrializado, exposto à venda ou entregue ao consumo antes de registrado no Ministério da Saúde. § 1º - O registro a que se refere este artigo terá validade por 5 (cinco) anos e poderá ser revalidado por períodos iguais e sucessivos, mantido o número do registro inicial.';
  const novo = 'Art. 12 ' + poe(L6360, 'a12');
  const q = JSON.stringify(velho).slice(1, -1), k = src.split(q).length - 1;
  if (k === 0) { if (!src.includes(JSON.stringify(novo).slice(1, -1))) throw Error('estética: art. 12 da Lei 6.360 não localizado'); conta.estetica = 0; return src; }
  if (k !== 1) throw Error('estética: art. 12 da Lei 6.360 em ' + k + ' lugares');
  conta.estetica = 1; return src.replace(q, JSON.stringify(novo).slice(1, -1));
});
/* o bloco campo--documentos é gerado de campo/documentos-dados.json (scripts/repack-campo.cjs): corrige a fonte */
const CAMPO = path.join(__dirname, '..', 'campo', 'documentos-dados.json');
(src => {
  const ini = '16.1.2. A Empresa de Pequeno Porte - EPP', fim = 'Secretaria da Educação do Estado de São Paulo.\\n16.1.5.';
  const i = src.indexOf(ini);
  if (i < 0) { conta.documentos = 0; return; }
  if (src.indexOf(ini, i + 1) >= 0) throw Error('documentos: 16.1.2 em mais de um lugar');
  const j = src.indexOf(fim, i); if (j < 0 || j - i > 4000) throw Error('documentos: fim do 16.1.4 não localizado');
  const troca = '16.1.2. ' + poe(P, 'n16.1.2') + '\\n16.1.3. Os documentos que comprovem o vínculo empregatício ou o contrato de prestação de serviços entre a empresa e o responsável técnico devem permanecer no estabelecimento à disposição da autoridade sanitária.\\n16.1.4. - ' + JSON.stringify(poe(P, 'n16.1.4')).slice(1, -1) + '\\n16.1.5.';
  const meio = src.slice(i, j + fim.length);
  if (!meio.includes('16.1.3. Os documentos que comprovem')) throw Error('documentos: 16.1.3 fora do lugar esperado');
  conta.documentos = 1;
  const out = src.slice(0, i) + troca + src.slice(j + fim.length); JSON.parse(out);
  fs.writeFileSync(CAMPO, out);
})(fs.readFileSync(CAMPO, 'utf8'));

/* 2d. Checklist de documentos: os textos das leis reconstruídas (ECA e Estatuto da Pessoa Idosa) misturavam a
   redação antiga e a vigente (dois parágrafos únicos no art. 48 da Lei 10.741; incisos antigos e novos no art. 90
   do ECA). Passam a vir do texto vigente (scripts/banco/vigente). A chave fica (é o que os itens citam). */
{
  const {FONTES} = require('./banco/vigente/fontes.cjs');
  const semRedacao = id => id.replace(/^(a\d+)b\d*/, '$1').replace(/(p\d+|pu|-[ivxl]+)b\d*/g, '$1');
  const ROM = /^[ivxlc]+$/, letra = b => b ? '-' + String.fromCharCode(64 + b.length) : '';
  /* rótulo da linha pelo último segmento do id; um segmento só é alínea quando o pai tem alínea “a” */
  const rot = (id, V) => {
    let m;
    if ((m = /p(\d+)(b*)(?:_\d+)?$/.exec(id))) return '§ ' + m[1] + (+m[1] < 10 ? 'º' : '') + letra(m[2]) + ' ';
    if (/pu(?:_\d+)?$/.test(id)) return 'Parágrafo único. ';
    m = /^(.*)-([a-z]+?)(b*)(?:_\d+)?$/.exec(id); if (!m) return '';
    const segs = id.replace(/^a\d+b*(?:p(?:u|\d+)b*)?/, '').split('-').filter(Boolean);
    const inciso = segs.length === 1 && ROM.test(m[2]) && !V.some(x => x[0] === m[1] + '-a');
    return inciso ? m[2].toUpperCase() + letra(m[3]) + ' - ' : m[2] + letra(m[3]) + ') ';
  };
  const C = JSON.parse(fs.readFileSync(CAMPO, 'utf8')); let n = 0;
  for (const k of Object.keys(C.textos)) {
    const [lei, id] = k.split(':'); if (!FONTES[lei] || !id) continue;
    const V = require('./banco/vigente/' + lei + '.json'), vid = semRedacao(id);
    const art = /^a\d+b*/.exec(vid)[0], caput = V.find(x => x[0] === art); if (!caput) throw Error('documentos: ' + k + ' sem artigo vigente');
    const ehArt = vid === art, raiz = V.find(x => x[0] === vid); if (!raiz) throw Error('documentos: ' + k + ' (' + vid + ') fora do texto vigente');
    const filhos = V.filter(x => x[0] !== art && (ehArt ? (x[0].startsWith(art + 'p') || x[0].startsWith(art + '-')) : (x[0] === vid || x[0].startsWith(vid + '-'))));
    const numArt = art.slice(1).replace(/b+$/, b => '-' + String.fromCharCode(64 + b.length));
    const texto = ['Art. ' + numArt + ' ' + caput[1]].concat(filhos.map(x => rot(x[0], V) + x[1])).join('\n');
    const disp = 'art. ' + numArt + (ehArt ? '' : ', ' + rot(vid, V).replace(/^Parágrafo único\. $/, 'parágrafo único').replace(/ - $/, '').replace(/\) $/, '').trim());
    const T = C.textos[k];
    if (T.texto !== texto || T.disp !== disp) { T.texto = texto; T.disp = disp; n++; }
  }
  conta.documentos2 = n;
  if (n) fs.writeFileSync(CAMPO, JSON.stringify(C) + '\n');
}

fs.writeFileSync(file, html);
console.log('Conferência de 17/11/2026 — banco: ' + conta.banco + ' mudança(s); banco de Alimentos: ' + conta.alimentos + '; assistenciais: ' + conta.assistenciais +
  '; estética: ' + conta.estetica + '; checklist de documentos: ' + conta.documentos + ' + ' + conta.documentos2 + ' texto(s) de lei.');
