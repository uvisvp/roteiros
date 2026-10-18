#!/usr/bin/env node
/* Gera estetica/legislacao.json: o texto de cada dispositivo citado pelo roteiro de estética
   (estetica/roteiro.cjs: perguntas do ROI e catálogo de infrações), no formato do motor
   roteiro-simples ({norma, disp, texto, url}). Fontes:
   - estetica/normas.json: banco de normas do antigo módulo de Estética (texto oficial,
     verificado em 31/08/2026), mais a Lei 6.360/1976 e a RDC 751/2022 do banco embutido;
   - Lei Municipal nº 13.725/2004: legislacao/lei-municipal-13725-2004.json (texto oficial,
     arts. 1º a 109) e, na falta, o banco embutido no app (bloco banco--v11), como na academia.
   Ids: '<norma>::<nó>' (ex.: 'rdc-anvisa-63-2011::a23-x') e, para a Lei 13.725,
   'lei-municipal-13725-2004::artigo::90::paragrafo::1'.
   Uso: node scripts/estetica-legislacao.cjs */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {unpack} = require('./integrated-html.cjs');

const RAIZ = path.resolve(__dirname, '..');
const D = require(path.join(RAIZ, 'estetica', 'roteiro.cjs'));
const NORMAS = require(path.join(RAIZ, 'estetica', 'normas.json')).leis;
const LEI = 'lei-municipal-13725-2004';
const URL_LEI = 'https://legislacao.prefeitura.sp.gov.br/leis/lei-13725-de-09-de-janeiro-de-2004';

const refs = new Set();
D.secoes.forEach(s => s.itens.forEach(i => (i.perguntas || []).forEach(q => q.r.forEach(r => refs.add(r)))));
D.infracoes.forEach(i => i.r.forEach(r => refs.add(r)));
(D.leiBase || []).forEach(r => refs.add(r));

/* Lei 13.725/2004: banco embutido e, por cima, o texto oficial dos arts. 1º a 109 */
const municipal = {};
(function () {
  const {blocks} = unpack(path.join(RAIZ, 'index.html'));
  const src = blocks.get('banco--v11');
  const i = src.indexOf(LEI);
  if (i < 0) throw Error('Lei 13.725 não encontrada no banco--v11');
  const ini = src.lastIndexOf('{', i);
  let d = 0, q = '', e = false, j = ini;
  for (; j < src.length; j++) { const c = src[j]; if (q) { if (e) e = false; else if (c === '\\') e = true; else if (c === q) q = ''; } else if (c === '"' || c === "'") q = c; else if (c === '{') d++; else if (c === '}' && --d === 0) break; }
  const o = Function('return ' + src.slice(ini, j + 1))();
  for (const [k, t] of o.n) {
    const m = /^a(\d+)(?:p(\d+|u))?$/.exec(k); if (!m) continue;
    municipal[LEI + '::artigo::' + m[1] + (m[2] ? '::paragrafo::' + (m[2] === 'u' ? 'unico' : m[2]) : '')] = t;
  }
})();
Object.assign(municipal, require(path.join(RAIZ, 'legislacao', 'lei-municipal-13725-2004.json')).textos);

const ord = n => (n < 10 ? n + 'º' : String(n));
/* rótulo de um nó: 'Art. 23' → 'art. 23'; '§ 1º'; 'Parágrafo único' → 'parágrafo único'; 'X'; 'a)' → 'alínea “a”'; '5.17' → 'Anexo I, item 5.17' */
function rotulo(n) {
  const r = String(n.r || '').trim();
  if (n.t === 'art') { const m = /^Art\.?\s*(\d+)\s*[º°]?(-[A-Z])?/i.exec(r); return m ? 'art. ' + ord(+m[1]) + (m[2] || '') : r; }
  if (n.t === 'par') return /único/i.test(r) ? 'parágrafo único' : r.replace(/^§\s*(\d+)\s*[º°]?$/, (x, d) => '§ ' + ord(+d));
  if (n.t === 'ali') return 'alínea “' + r.replace(/\)$/, '') + '”';
  if (/^n\d/.test(n.id)) return 'Anexo I, item ' + r;
  return r;
}
function dispositivo(lei, id) {
  const L = NORMAS[lei], porId = new Map(L.nos.map(n => [n.id, n])), cadeia = [];
  for (let n = porId.get(id); n; n = n.p ? porId.get(n.p) : null) cadeia.unshift(n);
  /* itens do regulamento (5.17, 5.18.4): basta o último número */
  if (/^n\d/.test(id)) return rotulo(cadeia[cadeia.length - 1]);
  return cadeia.map(rotulo).join(', ');
}
function texto(lei, id) {
  const L = NORMAS[lei], porId = new Map(L.nos.map(n => [n.id, n])), filhos = new Map();
  for (const n of L.nos) if (n.p) (filhos.get(n.p) || filhos.set(n.p, []).get(n.p)).push(n);
  const n = porId.get(id), linha = x => { const r = String(x.r || '').trim(); return !r ? x.x : r + (x.t === 'inc' && !/^n\d/.test(x.id) ? ' - ' : ' ') + x.x; };
  const l = [linha(n)];
  (function desce(p) { (filhos.get(p) || []).forEach(f => { l.push(linha(f)); desce(f.id); }); })(id);
  /* parágrafo, inciso ou alínea citados sozinhos levam antes o caput (e o inciso da alínea) */
  const acima = [];
  for (let p = n.p ? porId.get(n.p) : null; p; p = p.p ? porId.get(p.p) : null) acima.unshift(linha(p));
  return acima.concat(l).join('\n');
}

const saida = {}, faltam = [];
for (const id of [...refs].sort()) {
  if (id.startsWith(LEI + '::')) {
    const a = +id.split('::')[2];
    if (a > 109 || a === 22) throw Error('Lei 13.725: artigo não permitido (' + id + ')');
    if (!municipal[id]) { faltam.push(id); continue; }
    const p = id.split('::');
    saida[id] = {norma: 'Lei Municipal nº 13.725/2004', disp: 'art. ' + ord(a) + (p[3] === 'paragrafo' ? ', ' + (p[4] === 'unico' ? 'parágrafo único' : '§ ' + ord(+p[4])) : ''), texto: municipal[id], url: URL_LEI};
    continue;
  }
  const [lei, no] = id.split('::'), L = NORMAS[lei];
  if (!L || !L.nos.some(n => n.id === no)) { faltam.push(id); continue; }
  saida[id] = {norma: L.label, disp: dispositivo(lei, no), texto: texto(lei, no), url: L.url};
}
if (faltam.length) { console.error('Dispositivos ausentes no banco:\n  ' + faltam.join('\n  ')); process.exit(1); }
fs.writeFileSync(path.join(RAIZ, 'estetica', 'legislacao.json'), JSON.stringify(saida, null, 1) + '\n');
console.log('estetica/legislacao.json:', Object.keys(saida).length, 'dispositivos');
