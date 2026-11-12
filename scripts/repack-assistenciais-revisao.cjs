'use strict';
/* Serviços assistenciais — revisão de 12/11/2026: redação das perguntas, repetições e fundamentos
   (o que muda e por quê: scripts/assistenciais/revisao.cjs). Roda antes de
   scripts/repack-assistenciais-repeticao.cjs, que procura os documentos pelo texto.
   Idempotente. Uso: node scripts/repack-assistenciais-revisao.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const {REDACAO, OCULTAR, TEXTOS, cita} = require('./assistenciais/revisao.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const ID = 'app--servicos-assistenciais';
const NOVO = new Map(REDACAO);

function objetoEm(a, i) { let d = 0, str = false, esc = false; for (let j = i; j < a.length; j++) { const c = a[j]; if (str) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') str = false; } else if (c === '"') str = true; else if (c === '{' || c === '[') d++; else if (c === '}' || c === ']') { d--; if (!d) return a.slice(i, j + 1); } } return null; }

let feito = false;
const conta = {ocultas: 0, reescritas: 0, citacoes: 0, textos: 0, modalidades: 0};
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== ID) return m;
  feito = true;
  const src = lz.decompressFromBase64(enc.trim());
  let s = src;
  const vistos = new Set(); let k = -1; const trocas = [];
  while ((k = s.indexOf('"doc":[', k + 1)) >= 0) {
    const i = s.lastIndexOf('{', k), txt = objetoEm(s, i); if (!txt || vistos.has(i)) continue; vistos.add(i);
    let o; try { o = JSON.parse(txt); } catch (e) { continue; }
    if (!o.rot || !o.id || !o.inf) continue;
    if (JSON.stringify(o) !== txt) throw Error('dados da modalidade ' + o.id + ' não estão em JSON compacto');
    conta.modalidades++;
    /* 1. textos de documento e de infração */
    for (const [sv, kind, de, para] of TEXTOS.filter(t => t[0] === o.id)) {
      const n = o[kind].filter(x => x.i === de || x.i === para);
      if (n.length !== 1) throw Error(sv + ' ' + kind + ': texto não localizado de forma única — ' + de.slice(0, 60));
      if (n[0].i === de) { n[0].i = para; conta.textos++; }
    }
    /* 2. repetições */
    for (const [sv, kind, ini, cobre] of OCULTAR.filter(t => t[0] === o.id)) {
      const n = o[kind].filter(x => x.i.startsWith(ini));
      if (n.length !== 1) throw Error(sv + ' ' + kind + ': ' + n.length + ' itens começam com — ' + ini);
      if (n[0].rep == null) { n[0].rep = cobre; conta.ocultas++; }
    }
    /* 3. redação das perguntas visíveis */
    for (const x of o.rot) if (x.rep == null && NOVO.has(x.i)) { x.i = NOVO.get(x.i); conta.reescritas++; }
    const resta = o.rot.filter(x => x.rep == null && /^(Está atendida a exigência|O cálculo confirma)/.test(x.i));
    if (resta.length) throw Error(o.id + ': pergunta sem a redação nova — ' + resta[0].i.slice(0, 80));
    /* 4. fundamentos */
    const refs266 = (o.doc.find(x => x.i.startsWith('Licença ou dispensa')) || {refs: []}).refs.filter(r => r.law === 'portaria-sms-266-2025');
    for (const kind of ['doc', 'rot', 'inf']) for (const x of o[kind]) {
      const r = cita(o.id, kind, x, refs266);
      if (r.l !== x.l || JSON.stringify(r.refs) !== JSON.stringify(x.refs)) { x.l = r.l; x.refs = r.refs; conta.citacoes++; }
    }
    const novo = JSON.stringify(o); if (novo !== txt) trocas.push([txt, novo]);
  }
  if (conta.modalidades !== 6) throw Error('modalidades localizadas: ' + conta.modalidades);
  for (const [de, para] of trocas) { if (s.split(de).length !== 2) throw Error('dados repetidos no bloco'); s = s.replace(de, () => para); }
  /* toda redação nova está no bloco (a pergunta pode estar oculta pela revisão: aí fica a antiga) */
  for (const [de, para] of REDACAO) if (!s.includes(JSON.stringify(para).slice(1, -1)) && !s.includes(JSON.stringify(de).slice(1, -1))) throw Error('pergunta ausente: ' + de.slice(0, 70));
  if (s === src) return m;
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + ID);
  return a + novo + z;
});
if (!feito) throw Error('Bloco não localizado: ' + ID);
fs.writeFileSync(file, html);
console.log('Serviços assistenciais: ' + conta.reescritas + ' perguntas reescritas, ' + conta.ocultas + ' repetições ocultas, ' + conta.textos + ' textos e ' + conta.citacoes + ' fundamentos corrigidos.');
