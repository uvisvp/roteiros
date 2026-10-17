#!/usr/bin/env node
/* Gera legislacao/lei-municipal-13725-2004.json: texto oficial da Lei Municipal
   nº 13.725/2004 (Código Sanitário do Município de São Paulo), arts. 1º a 109,
   tirado da página da Prefeitura. Os roteiros citam só dispositivos até o
   art. 109 (pedido de 17/10/2026; do art. 110 em diante são infrações e
   penalidades, usadas só na autuação).
   Chaves no formato do motor: lei-municipal-13725-2004::artigo::27,
   …::artigo::19::paragrafo::2, …::artigo::27::inciso::i. Texto de cada chave:
   artigo → caput com todos os parágrafos e incisos; parágrafo → o parágrafo e
   seus incisos; inciso → caput (ou parágrafo) e o inciso.
   Uso: node scripts/lei13725.cjs [pagina.html]  (sem arquivo, baixa a página) */
'use strict';
const fs = require('node:fs'), path = require('node:path'), {execFileSync} = require('node:child_process');
const URL = 'https://legislacao.prefeitura.sp.gov.br/leis/lei-13725-de-09-de-janeiro-de-2004';
const SAIDA = path.join(__dirname, '..', 'legislacao', 'lei-municipal-13725-2004.json');
const html = process.argv[2] ? fs.readFileSync(process.argv[2], 'utf8') : execFileSync('curl', ['-sSL', '--max-time', '90', URL], {encoding: 'utf8', maxBuffer: 1 << 26});
const ent = {nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', ordm: 'º', ordf: 'ª', sect: '§'};
const txt = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
  .replace(/<br\s*\/?>|<\/(p|div|li|h\d)>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&([a-z]+);/gi, (m, n) => ent[n.toLowerCase()] ?? m)
  .replace(/[ \t ]+/g, ' ').split('\n').map(l => l.trim()).filter(Boolean);
const ROM = /^([IVXLC]+) - /;
const K = 'lei-municipal-13725-2004::artigo::';
const arts = []; let art = null, par = null;
for (const l of txt) {
  let m;
  if ((m = /^Art\. (\d+)(?:º)?(-A)?\.? ?-? ?(.*)$/.exec(l)) && /^Art\. \d/.test(l)) {
    if (+m[1] > 109) break;
    art = {n: m[1] + (m[2] ? '-a' : ''), linhas: [l], pars: [], incs: []}; par = null; arts.push(art); continue;
  }
  if (!art) continue;
  /* títulos de Título, Capítulo e Seção: linhas sem minúsculas */
  if (/^(TÍTULO|CAPÍTULO|SEÇÃO|SUBSEÇÃO)\b/.test(l) || (!/[a-zà-ÿ]/.test(l) && l.length >= 4)) continue;
  if ((m = /^(§ ?(\d+)º?|Parágrafo único) ?-? ?/.exec(l))) { par = {p: m[2] || 'unico', linhas: [l], incs: []}; art.pars.push(par); art.linhas.push(l); continue; }
  if ((m = ROM.exec(l))) { const alvo = par || art; alvo.incs.push({i: m[1].toLowerCase(), l}); (par ? par.linhas : art.linhas).push(l); if (par) art.linhas.push(l); continue; }
  /* alíneas e continuação: ficam no texto do artigo e do parágrafo atual */
  art.linhas.push(l); if (par) par.linhas.push(l);
}
const out = {};
for (const a of arts) {
  out[K + a.n] = a.linhas.join('\n');
  const caput = a.linhas[0];
  for (const i of a.incs) out[K + a.n + '::inciso::' + i.i] = caput + '\n' + i.l;
  for (const p of a.pars) {
    out[K + a.n + '::paragrafo::' + p.p] = p.linhas.join('\n');
    for (const i of p.incs) out[K + a.n + '::paragrafo::' + p.p + '::inciso::' + i.i] = p.linhas[0] + '\n' + i.l;
  }
}
const n = Object.keys(out).filter(k => !k.includes('::', K.length)).length;
if (n < 100) throw Error('poucos artigos lidos: ' + n);
fs.mkdirSync(path.dirname(SAIDA), {recursive: true});
fs.writeFileSync(SAIDA, JSON.stringify({fonte: URL, nota: 'Arts. 1º a 109; texto da página oficial da Prefeitura de São Paulo.', textos: out}, null, 1) + '\n');
console.log(SAIDA, n, 'artigos,', Object.keys(out).length, 'dispositivos');
