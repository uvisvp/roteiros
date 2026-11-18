'use strict';
/* Serviços assistenciais — redação vigente nas citações (auditoria de 14/11/2026, E05).
   O banco embutido no módulo trazia, lado a lado, a redação original e as posteriores do mesmo
   dispositivo, e sete citações apontavam para a antiga: ECA, arts. 11, 13, 92 e 93 (o art. 93 com
   o prazo de “2º dia útil”, hoje 24 horas); Estatuto da Pessoa Idosa, art. 48, parágrafo único, e
   art. 50, I e XV. Aqui:
   - a citação passa a apontar para a redação vigente (PLANO[lei].refs);
   - o artigo citado fica só com a redação vigente do caput e dos seus parágrafos e incisos, copiada
     do banco integrado (banco--v11, texto oficial do Planalto), que não é alterado;
   - as redações superadas dos artigos citados saem do banco do módulo (PLANO[lei].tira), para o
     texto aberto pelo botão da citação não misturar versões.
   Perguntas, respostas e demais citações não mudam. Roda depois de
   scripts/repack-assistenciais-repeticao.cjs. Idempotente.
   Uso: node scripts/repack-assistenciais-vigente.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz, blocks} = unpack(file);
const ID = 'app--servicos-assistenciais';
const PAR = n => ['par', n === 'u' ? 'Parágrafo único' : '§ ' + n + 'º'];
const INC = r => ['inc', r];
/* [id no banco, tipo, rótulo] dos filhos vigentes, na ordem do texto */
const PLANO = {
  'lei-federal-8069-1990': {
    refs: {a11: 'a11b2', a13: 'a13b', a92: 'a92b', a93: 'a93b'},
    arts: [
      {raiz: 'a11b2', r: 'Art. 11', filhos: [['a11b2p1b', ...PAR(1)], ['a11b2p2b', ...PAR(2)], ['a11b2p3', ...PAR(3)]]},
      {raiz: 'a13b', r: 'Art. 13', filhos: [['a13bp1', ...PAR(1)], ['a13bp2', ...PAR(2)]]},
      {raiz: 'a92b', r: 'Art. 92', filhos: [['a92b-ib', ...INC('I')], ['a92b-ii', ...INC('II')], ['a92b-iii', ...INC('III')], ['a92b-iv', ...INC('IV')], ['a92b-v', ...INC('V')],
        ['a92b-vi', ...INC('VI')], ['a92b-vii', ...INC('VII')], ['a92b-viii', ...INC('VIII')], ['a92b-ix', ...INC('IX')],
        ['a92bp1', ...PAR(1)], ['a92bp2', ...PAR(2)], ['a92bp3', ...PAR(3)], ['a92bp4', ...PAR(4)], ['a92bp5', ...PAR(5)], ['a92bp6', ...PAR(6)], ['a92bp7', ...PAR(7)]]},
      {raiz: 'a93b', r: 'Art. 93', filhos: [['a93bpu', ...PAR('u')]]}
    ],
    /* redações superadas: arts. 11, 13, 92 e 93 originais; art. 13, parágrafo único (hoje § 1º); art. 90, incisos e
       parágrafo único anteriores às Leis 12.010/2009 e 12.594/2012; art. 94, § 1º original */
    tira: ['a11', 'a13', 'a13bpu', 'a92', 'a93', 'a90-v', 'a90-vb', 'a90-vi', 'a90-vii', 'a90pu', 'a94p1']
  },
  'lei-federal-10741-2003': {
    refs: {a48bpu: 'a48bpub', 'a50-i': 'a50-ib', 'a50-xv': 'a50-xvb'},
    arts: [],
    /* redações anteriores à Lei 14.423/2022 */
    tira: ['a48bpu', 'a50-i', 'a50-ii', 'a50-viii', 'a50-xii', 'a50-xiv', 'a50-xv', 'a19b2-iii', 'a19b2-iv', 'a19b2-v', 'a19b2p1']
  }
};
/* nome do conselho no documento da ILPI, como na redação vigente do art. 48, parágrafo único (Lei 14.423/2022) */
const TEXTOS = [['ilpi', 'doc', 'Comprovante de inscrição do programa junto ao Conselho Municipal do Idoso.', 'Comprovante de inscrição do programa junto ao Conselho Municipal da Pessoa Idosa.']];
const BANCO = [].concat(...Object.values(JSON.parse(blocks.get('banco--v11')).g));
/* Leis já reconstruídas só com a redação vigente (scripts/banco/vigente, texto atualizado da Câmara,
   18/11/2026): o texto vem de lá, onde o rótulo não leva sufixo de redação (a11b2 -> a11, a92b-ib -> a92-i).
   Assim o resultado não depende de o banco integrado já ter sido trocado. */
const {FONTES} = require('./banco/vigente/fontes.cjs');
const semRedacao = id => id.replace(/^(a\d+)b\d*/, '$1').replace(/(p\d+|pu|-[ivxl]+)b\d*/g, '$1');
const doBanco = (lei, id) => {
  if (FONTES[lei]) { const v = require('./banco/vigente/' + lei + '.json'), n = v.find(x => x[0] === semRedacao(id)); if (!n) throw Error(lei + ': ' + id + ' (' + semRedacao(id) + ') não está no texto vigente'); return String(n[1]); }
  const L = BANCO.find(x => x.i === lei), n = L && L.n.find(x => x[0] === id); if (!n) throw Error(lei + ': ' + id + ' não está no banco integrado'); return String(n[1]);
};

const conta = {refs: 0, nos: 0, tirados: 0, textos: 0};
let feito = false;
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== ID) return m;
  feito = true;
  const src = lz.decompressFromBase64(enc.trim());
  const i = src.indexOf('const DATA='); if (i < 0 || src.indexOf('const DATA=', i + 1) >= 0) throw Error('const DATA não localizado de forma única');
  const j = src.indexOf('\n', i), bruto = src.slice(i + 11, j), txt = bruto.replace(/;\s*$/, ''), D = JSON.parse(txt);
  if (JSON.stringify(D) !== txt) throw Error('DATA não está em JSON compacto');
  for (const [lei, P] of Object.entries(PLANO)) {
    const L = D.laws[lei]; if (!L) throw Error(lei + ' ausente do módulo');
    /* 1. artigos vigentes: caput e filhos, do banco integrado */
    for (const art of P.arts) {
      const novos = [{id: art.raiz, p: null, t: 'art', r: art.r, x: doBanco(lei, art.raiz)}].concat(art.filhos.map(([nid, t, r]) => ({id: nid, p: art.raiz, t, r, x: doBanco(lei, nid)})));
      const ids = new Set(novos.map(n => n.id));
      const atuais = L.nos.filter(n => ids.has(n.id));
      if (JSON.stringify(atuais.map(n => ({id: n.id, p: n.p, t: n.t, r: n.r, x: n.x}))) === JSON.stringify(novos)) continue;
      /* entra no lugar do artigo antigo (ou do próprio, se já estava em parte) */
      const antigo = Object.keys(P.refs).find(k => P.refs[k] === art.raiz);
      let k = L.nos.findIndex(n => n.id === antigo || ids.has(n.id)); if (k < 0) k = L.nos.length;
      L.nos = L.nos.filter(n => !ids.has(n.id));
      k = Math.min(k, L.nos.length);
      L.nos.splice(k, 0, ...novos); conta.nos += novos.length;
    }
    /* 2. citações */
    for (const s of D.services) for (const kind of ['doc', 'rot', 'inf']) for (const x of s[kind] || []) for (const r of x.refs || [])
      if (r.law === lei && P.refs[r.node]) { r.node = P.refs[r.node]; conta.refs++; }
    if (D.cited && D.cited[lei]) D.cited[lei] = [...new Set(D.cited[lei].map(n => P.refs[n] || n))];
    /* 3. redações superadas (nenhuma pode continuar citada nem ter filho) */
    const citados = new Set(); for (const s of D.services) for (const kind of ['doc', 'rot', 'inf']) for (const x of s[kind] || []) for (const r of x.refs || []) if (r.law === lei && r.node) citados.add(r.node);
    for (const t of P.tira) { if (citados.has(t)) throw Error(lei + ': ' + t + ' ainda é citado'); if (L.nos.some(n => n.p === t)) throw Error(lei + ': ' + t + ' ainda tem dispositivos subordinados'); }
    const antes = L.nos.length; L.nos = L.nos.filter(n => !P.tira.includes(n.id)); conta.tirados += antes - L.nos.length;
    for (const c of citados) if (!L.nos.some(n => n.id === c)) throw Error(lei + ': citação sem dispositivo — ' + c);
  }
  for (const [sv, kind, de, para] of TEXTOS) { const l = D.services.find(s => s.id === sv)[kind].filter(x => x.i === de || x.i === para);
    if (l.length !== 1) throw Error(sv + ' ' + kind + ': texto não localizado de forma única — ' + de); if (l[0].i === de) { l[0].i = para; conta.textos++; } }
  const out = src.slice(0, i + 11) + JSON.stringify(D) + bruto.slice(txt.length) + src.slice(j);
  if (out === src) return m;
  const novo = lz.compressToBase64(out); if (lz.decompressFromBase64(novo) !== out) throw Error('round-trip');
  return a + novo + z;
});
if (!feito) throw Error(ID + ' não encontrado');
fs.writeFileSync(file, html);
console.log('Serviços assistenciais — redação vigente: ' + conta.refs + ' citações reapontadas, ' + conta.nos + ' dispositivos vigentes gravados, ' + conta.tirados + ' redações superadas retiradas, ' + conta.textos + ' texto(s) atualizado(s).');
