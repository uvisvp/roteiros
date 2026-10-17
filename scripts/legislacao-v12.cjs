#!/usr/bin/env node
/* Extrai do banco legislativo v12 (repositório base-vigilancia) o texto oficial
   de cada dispositivo citado por um roteiro do motor roteiro-simples e grava o
   JSON indicado. Adaptado de medicamentos/build/legislacao.cjs (mesmas regras:
   redação mais recente, alínea solta, caput antes de inciso/parágrafo). O site não depende do banco em tempo de uso: o
   texto vai embutido no módulo, e o botão da citação abre o texto e o link
   da fonte oficial.
   A Lei Municipal nº 13.725/2004 não está no v12 como arquivo próprio; seus
   artigos vêm de legislacao/lei-municipal-13725-2004.json (texto oficial,
   arts. 1º a 109) e, na falta, do banco já embutido nos módulos (drogaria e
   odontologia).
   Uso: node scripts/legislacao-v12.cjs <saida.json> <roteiro.cjs>... */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const RAIZ = path.resolve(__dirname, '..');
const BASE = path.resolve(process.env.BASE_VIGILANCIA || path.join(RAIZ, '..', 'base-vigilancia'));
const ROT = RAIZ;
const [SAIDA, ...FONTES] = process.argv.slice(2);
if (!SAIDA || !FONTES.length) { console.error('Uso: node scripts/legislacao-v12.cjs <saida.json> <roteiro.cjs>...'); process.exit(2); }
const NORMAS = path.join(BASE, 'dados', 'legislacao_v12', 'normas');

const NOMES = {
  'rdc-978-2025': 'RDC Anvisa nº 978/2025', 'rdc-44-2009': 'RDC Anvisa nº 44/2009', 'rdc-197-2017': 'RDC Anvisa nº 197/2017',
  'rdc-222-2018': 'RDC Anvisa nº 222/2018', 'rdc-430-2020': 'RDC Anvisa nº 430/2020', 'rdc-67-2007': 'RDC Anvisa nº 67/2007',
  'rdc-887-2024': 'RDC Anvisa nº 887/2024', 'rdc-870-2024': 'RDC Anvisa nº 870/2024', 'lei-5991-1973': 'Lei Federal nº 5.991/1973',
  'lei-municipal-13725-2004': 'Lei Municipal nº 13.725/2004', 'rdc-63-2011': 'RDC Anvisa nº 63/2011',
  'lei-municipal-sp-13478-2002': 'Lei Municipal nº 13.478/2002', 'rdc-50-2002': 'RDC Anvisa nº 50/2002'
};
const ROMANO = s => /^[ivxlcdm]+$/i.test(s) ? s.toUpperCase() : s;
const ORD = n => /^\d$/.test(n) ? n + 'º' : n;
/* 'rdc-978-2025::artigo::10::inciso::i' → 'art. 10, I' */
function dispositivo(id) {
  const p = id.split('::').slice(1), out = [];
  for (let i = 0; i < p.length; i += 2) {
    const t = p[i], v = p[i + 1];
    if (t === 'anexo') out.push('Anexo ' + ROMANO(v));
    else if (t === 'artigo') out.push('art. ' + ORD(v));
    else if (t === 'paragrafo') out.push(v === 'unico' ? 'parágrafo único' : '§ ' + ORD(v));
    else if (t === 'inciso') out.push(ROMANO(v));
    else if (t === 'alinea') out.push('alínea ' + v);
    else if (t === 'item') out.push('item ' + v);
    else out.push(t + ' ' + v);
  }
  return out.join(', ');
}

/* refs usados pelos roteiros (o módulo pode exportar um roteiro ou uma lista) */
const refs = new Set();
for (const f of FONTES) {
  const m = require(path.resolve(f));
  for (const d of [].concat(m)) {
    d.secoes.forEach(s => s.itens.forEach(i => { (i.perguntas || []).forEach(q => q.r.forEach(r => refs.add(r)));
      (i.campos || []).forEach(c => { (c.r || []).forEach(r => refs.add(r));
        [c.lista || []].concat(Object.values(c.tipos || {}).map(t => t.lista || [])).forEach(l => l.forEach(x => (Array.isArray(x[2]) ? x[2] : []).forEach(r => refs.add(r)))); }); }));
    d.infracoes.forEach(i => i.r.forEach(r => refs.add(r)));
    (d.leiBase || []).forEach(r => refs.add(r));
  }
}

/* nós do v12, por norma */
const cache = {};
function norma(chave) {
  if (cache[chave] !== undefined) return cache[chave];
  const f = path.join(NORMAS, chave + '.json');
  if (!fs.existsSync(f)) return (cache[chave] = null);
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const porId = new Map(j.nos.map(n => [n.id, n])), filhos = new Map();
  for (const n of j.nos) if (n.pai) (filhos.get(n.pai) || filhos.set(n.pai, []).get(n.pai)).push(n);
  return (cache[chave] = {porId, filhos, url: j.proveniencia && j.proveniencia.fonte_oficial || ''});
}
/* Texto do dispositivo com os filhos. Nós “bloco” são o que o estruturador não
   classificou: títulos de seção/capítulo (e a linha de título seguinte) ficam
   de fora; alíneas “a)” viram linha própria; o resto é continuação de frase
   partida por link na fonte e é emendado à linha anterior. */
const TITULO = /^(CAP[ÍI]TULO|Se[çc][ãa]o|Subse[çc][ãa]o|T[ÍI]TULO|ANEXO)\b/i;
function textoCompleto(nm, n) {
  const linhas = [n.texto];
  let pulaTitulo = false;
  (function desce(id) {
    (nm.filhos.get(id) || []).sort((a, b) => a.ordem - b.ordem).forEach(f => {
      if (f.tipo === 'bloco') {
        const t = String(f.texto || '').trim();
        if (TITULO.test(t)) { pulaTitulo = true; return; }
        if (pulaTitulo) { pulaTitulo = false; return; }
        if (/^[a-z]\)\s/.test(t)) linhas.push(t);
        else linhas[linhas.length - 1] += (/^[,.;:]/.test(t) ? '' : ' ') + t;
      } else { pulaTitulo = false; linhas.push(f.texto); }
      desce(f.id);
    });
  })(n.id);
  return linhas.join('\n');
}
/* alínea não estruturada: procura, sob o dispositivo pai, o bloco que começa por “x)” */
function alineaSolta(nm, id) {
  const m = /^(.*)::alinea::([a-z])$/.exec(id);
  if (!m) return null;
  const f = (nm.filhos.get(m[1]) || []).find(x => new RegExp('^' + m[2] + '\\)\\s').test(String(x.texto || '').trim()));
  return f ? {...f, id} : null;
}

/* Lei Municipal 13.725/2004: odontologia (DATA.legal) e drogaria (VISA_LOCAL) */
const municipal = {};
(function () {
  const {unpack, scripts, visaLocal} = require(path.join(ROT, 'scripts', 'integrated-html.cjs'));
  const {blocks} = unpack(path.join(ROT, 'index.html'));
  const odo = scripts(blocks.get('app--odontologia'))[1].source;
  const i = odo.indexOf('const DATA=') + 11;
  let d = 0, q = false, e = false, j = i;
  for (; j < odo.length; j++) { const c = odo[j]; if (q) { if (e) e = false; else if (c === '\\') e = true; else if (c === '"') q = false; } else if (c === '"') q = true; else if (c === '{') d++; else if (c === '}' && --d === 0) break; }
  for (const x of JSON.parse(odo.slice(i, j + 1)).legal) {
    const m = /^lei-municipal-13725-2004:a(\d+)(?:p(\d+|u))?$/.exec(x.id);
    if (!m) continue;
    const id = 'lei-municipal-13725-2004::artigo::' + m[1] + (m[2] ? '::paragrafo::' + (m[2] === 'u' ? 'unico' : m[2]) : '');
    municipal[id] = {texto: x.text, url: x.url};
  }
  const lm = visaLocal(blocks.get('app--drogaria'))['legislacao_v12/normas/lei-municipal-13725-2004.json'];
  for (const n of lm.nos) if (!municipal[n.id]) municipal[n.id] = {texto: (n.rotulo ? n.rotulo + ' ' : '') + n.texto, url: 'https://legislacao.prefeitura.sp.gov.br/leis/lei-13725-de-09-de-janeiro-de-2004'};
})();

/* texto oficial dos arts. 1º a 109 (legislacao/lei-municipal-13725-2004.json, gerado por
   scripts/lei13725.cjs): vale sobre o dos bancos embutidos. Os roteiros não citam artigo
   acima do 109 (infrações e penalidades). */
{ const L = require(path.join(ROT, 'legislacao', 'lei-municipal-13725-2004.json')); for (const [id, t] of Object.entries(L.textos)) municipal[id] = {texto: t, url: L.fonte}; }

const saida = {}, faltam = [];
for (const id of [...refs].sort()) {
  const chave = id.split('::')[0];
  const base = {norma: NOMES[chave] || chave, disp: dispositivo(id)};
  if (chave === 'lei-municipal-13725-2004') {
    if (+id.split('::')[2] > 109) throw Error('Lei 13.725: artigo acima do 109 (' + id + ')');
    const m = municipal[id];
    if (!m) { faltam.push(id); continue; }
    saida[id] = {...base, texto: m.texto, url: m.url};
    continue;
  }
  /* dispositivo com nova redação: o banco guarda as versões como “::ocorrencia-N”; vale a mais recente */
  const nm = norma(chave), ult = nm && [...Array(9).keys()].reverse().map(i => nm.porId.get(id + '::ocorrencia-' + (i + 2))).find(x => x && !/\.{8,}/.test(x.texto || '') && /[a-zà-ú]{4,}/i.test(x.texto || ''));
  const n = nm && (ult || nm.porId.get(id) || alineaSolta(nm, id));
  if (!n) { faltam.push(id); continue; }
  saida[id] = {...base, texto: textoCompleto(nm, n), url: nm.url};
}
/* Inciso, parágrafo ou alínea citados sozinhos: o texto vem precedido do caput do
   artigo (e do inciso, no caso de alínea), para a citação ter contexto — ex.:
   “Art. 10. Os requisitos obrigatórios … são:” antes de “III - não realizar …”. */
for (const id of Object.keys(saida)) {
  const m = /^(.*?::artigo::[^:]+)(::.+)$/.exec(id); if (!m) continue;
  const t = saida[id].texto; if (/^\s*Art\.?\s/i.test(t)) continue;
  const chave = id.split('::')[0], ctx = [];
  const caput = chave === 'lei-municipal-13725-2004' ? (municipal[m[1]] || {}).texto : (() => { const nm = norma(chave), n = nm && nm.porId.get(m[1]); return n && n.texto; })();
  if (caput) { const l = String(caput).split('\n').map(x => x.trim()); ctx.push(/^Art\.?\s*\d+[º°]?\.?$/i.test(l[0]) && l[1] ? l[0] + ' ' + l[1] : l[0]); }
  const inc = /^(.*::inciso::[^:]+)::alinea::/.exec(id);
  if (inc) { const nm = norma(chave), n = nm && nm.porId.get(inc[1]); if (n) ctx.push(String(n.texto).split('\n')[0].trim()); }
  if (ctx.length) saida[id].texto = ctx.join('\n') + '\n' + t;
}
if (faltam.length) { console.error('Dispositivos ausentes no banco:\n  ' + faltam.join('\n  ')); process.exit(1); }
fs.writeFileSync(path.resolve(SAIDA), JSON.stringify(saida, null, 1) + '\n');
console.log(SAIDA + ':', Object.keys(saida).length, 'dispositivos');
