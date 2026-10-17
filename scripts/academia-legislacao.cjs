#!/usr/bin/env node
/* Gera academia/legislacao.json: o texto oficial de cada dispositivo citado
   pelo roteiro de academias e piscinas (academia/roteiro.cjs), tirado do banco
   legislativo v12 (repositório base-vigilancia) e, para a Lei Municipal nº
   13.725/2004, do banco já embutido no app (bloco banco--v11).
   O app não depende do banco em tempo de uso: o texto vai embutido no bloco.
   Uso: node scripts/academia-legislacao.cjs [caminho/base-vigilancia] */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {unpack} = require('./integrated-html.cjs');

const RAIZ = path.resolve(__dirname, '..');
const BASE = path.resolve(process.argv[2] || path.join(RAIZ, '..', 'base-vigilancia'));
const NORMAS = path.join(BASE, 'dados', 'legislacao_v12', 'normas');
const D = require(path.join(RAIZ, 'academia', 'roteiro.cjs'));

const NOMES = {
  'portaria-sms-sp-1101-2015': ['Portaria SMS nº 1.101/2015', 'https://legislacao.prefeitura.sp.gov.br/leis/portaria-secretaria-municipal-da-saude-sms-1101-de-19-de-junho-de-2015'],
  'lei-municipal-sp-11383-1993': ['Lei Municipal nº 11.383/1993'],
  'lei-municipal-sp-17105-2019': ['Lei Municipal nº 17.105/2019'],
  'lei-municipal-sp-13993-2005': ['Lei Municipal nº 13.993/2005'],
  'lei-municipal-sp-16059-2014': ['Lei Municipal nº 16.059/2014'],
  'lei-municipal-sp-13945-2005': ['Lei Municipal nº 13.945/2005'],
  'lei-municipal-13725-2004': ['Lei Municipal nº 13.725/2004', 'https://legislacao.prefeitura.sp.gov.br/leis/lei-13725-de-09-de-janeiro-de-2004']
};
const ROMANO = s => /^[ivxlcdm]+$/i.test(s) ? s.toUpperCase() : s;
/* 'art. 2º-C', 'art. 10' */
const ART = v => { const m = /^(\d+)(?:-([a-z]))?$/.exec(v); if (!m) return v; return (+m[1] < 10 ? m[1] + 'º' : m[1]) + (m[2] ? '-' + m[2].toUpperCase() : ''); };
function dispositivo(id) {
  const p = id.split('::').slice(1), out = [];
  for (let i = 0; i < p.length; i += 2) {
    const t = p[i], v = p[i + 1];
    if (t === 'artigo') out.push('art. ' + ART(v));
    else if (t === 'paragrafo') out.push(v === 'unico' ? 'parágrafo único' : '§ ' + ART(v));
    else if (t === 'inciso') out.push(ROMANO(v));
    else if (t === 'alinea') out.push('alínea “' + v + '”');
    else if (t === 'item') out.push('Anexo, item ' + v.replace(/-/g, '.'));
    else out.push(t + ' ' + v);
  }
  return out.join(', ');
}

const refs = new Set();
D.secoes.forEach(s => s.itens.forEach(i => (i.perguntas || []).forEach(q => q.r.forEach(r => refs.add(r)))));
D.infracoes.forEach(i => i.r.forEach(r => refs.add(r)));

const cache = {};
function norma(chave) {
  if (cache[chave]) return cache[chave];
  const j = JSON.parse(fs.readFileSync(path.join(NORMAS, chave + '.json'), 'utf8'));
  const porId = new Map(j.nos.map(n => [n.id, n])), filhos = new Map();
  for (const n of j.nos) if (n.pai) (filhos.get(n.pai) || filhos.set(n.pai, []).get(n.pai)).push(n);
  for (const l of filhos.values()) l.sort((a, b) => a.ordem - b.ordem);
  return (cache[chave] = {porId, filhos, url: (j.proveniencia || {}).fonte_oficial || ''});
}
/* Texto do dispositivo com os filhos diretos e indiretos (incisos, alíneas,
   parágrafos; na Portaria, subitens). */
function texto(nm, n) {
  const l = [n.texto];
  (function desce(id) { (nm.filhos.get(id) || []).forEach(f => { l.push(f.texto); desce(f.id); }); })(n.id);
  return l.join('\n');
}

/* Lei 13.725/2004 do banco embutido: {i, l, u, n:[[id, texto]]}, id 'a116', 'a90p1', 'a90pu' */
const municipal = {};
(function () {
  const {blocks} = unpack(path.join(RAIZ, 'index.html'));
  const src = blocks.get('banco--v11');
  const i = src.indexOf("lei-municipal-13725-2004");
  if (i < 0) throw Error('Lei 13.725 não encontrada no banco--v11');
  const ini = src.lastIndexOf('{', i);
  let d = 0, q = '', e = false, j = ini;
  for (; j < src.length; j++) { const c = src[j]; if (q) { if (e) e = false; else if (c === '\\') e = true; else if (c === q) q = ''; } else if (c === '"' || c === "'") q = c; else if (c === '{') d++; else if (c === '}' && --d === 0) break; }
  const o = Function('return ' + src.slice(ini, j + 1))();
  for (const [k, t] of o.n) {
    const m = /^a(\d+)(?:p(\d+|u))?$/.exec(k); if (!m) continue;
    municipal['lei-municipal-13725-2004::artigo::' + m[1] + (m[2] ? '::paragrafo::' + (m[2] === 'u' ? 'unico' : m[2]) : '')] = t;
  }
})();

const saida = {}, faltam = [];
for (const id of [...refs].sort()) {
  const chave = id.split('::')[0], [nome, url] = NOMES[chave] || [chave];
  const base = {norma: nome, disp: dispositivo(id)};
  if (chave === 'lei-municipal-13725-2004') {
    if (!municipal[id]) { faltam.push(id); continue; }
    saida[id] = {...base, texto: municipal[id], url};
    continue;
  }
  const nm = norma(chave), n = nm.porId.get(id);
  if (!n) { faltam.push(id); continue; }
  let t = texto(nm, n);
  /* parágrafo, inciso ou alínea citados sozinhos levam o caput (ou o item-pai) antes */
  if (n.pai && !/^\s*Art\.?\s/i.test(t)) { const p = nm.porId.get(n.pai); if (p) t = String(p.texto).split('\n')[0] + '\n' + t; }
  saida[id] = {...base, texto: t, url: url || nm.url};
}
if (faltam.length) { console.error('Dispositivos ausentes no banco:\n  ' + faltam.join('\n  ')); process.exit(1); }
fs.writeFileSync(path.join(RAIZ, 'academia', 'legislacao.json'), JSON.stringify(saida, null, 1) + '\n');
console.log('academia/legislacao.json:', Object.keys(saida).length, 'dispositivos');
