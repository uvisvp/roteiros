#!/usr/bin/env node
/* Checklist de documentos (pedido de 25/10/2026): gera campo/documentos-dados.json a partir de
   documentos/checklist.cjs, com o texto oficial de cada dispositivo citado embutido (o app não
   depende dos bancos em tempo de uso). Fontes do texto:
   - banco v12 (base-vigilancia), pelo scripts/legislacao-v12.cjs — ids 'norma::artigo::N…';
   - banco v11 embutido no app (bloco banco--v11), para as normas que o v12 não tem — ids
     'norma:nó' (ex.: 'rdc-anvisa-502-2021:a23', 'rdc-anvisa-1002-2025:a110');
   - Serviços assistenciais: a lista de cada modalidade é a do próprio módulo (DATA.services[].doc),
     que já cita o banco v11.
   Dispositivo sem texto em nenhum banco interrompe a geração.
   Uso: node scripts/documentos-checklist.cjs            (gera o JSON)
        node scripts/documentos-checklist.cjs --ver <id>… (mostra o texto, para conferência) */
'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const {execFileSync} = require('node:child_process');
const {unpack} = require('./integrated-html.cjs');
const RAIZ = path.resolve(__dirname, '..');
const SAIDA = path.join(RAIZ, 'campo', 'documentos-dados.json');
const VER = process.argv[2] === '--ver';

const {blocks} = unpack(path.join(RAIZ, 'index.html'));
/* objeto JSON literal que começa logo após a marca */
function jsonApos(s, marca) {
  const i = s.indexOf(marca) + marca.length; if (i < marca.length) throw Error('marca não localizada: ' + marca);
  let d = 0, q = false, e = false, j = i;
  for (; j < s.length; j++) { const c = s[j]; if (q) { if (e) e = false; else if (c === '\\') e = true; else if (c === '"') q = false; } else if (c === '"') q = true; else if (c === '{' || c === '[') d++; else if ((c === '}' || c === ']') && --d === 0) break; }
  return JSON.parse(s.slice(i, j + 1));
}

/* ---------- banco v11 ---------- */
const V11 = new Map(Object.values(JSON.parse(blocks.get('banco--v11')).g).flat().map(l => [l.i, l]));
const ROM = s => s.toUpperCase();
const ord = n => (+n < 10 ? n + 'º' : String(n));
/* 'a16-ii-a' → partes: artigo 16, inciso II, alínea a; 'a24p1' → § 1º; 'a8pu' → parágrafo único.
   Sufixo 'b' marca redação alterada (Lei 10.741: a48b). */
function partesV11(no) {
  /* itens de regulamento (Portaria SMS 2.619/2011: 'n14.10', 'n14.10-iii') */
  const it = /^n(\d+(?:\.\d+)*)b?((?:-[a-z0-9]+)*)$/.exec(no);
  if (it) return {item: it[1], par: '', segs: it[2] ? it[2].slice(1).split('-') : []};
  const m = /^a(\d+(?:-[A-Z])?)(b?)((?:pu|p\d+)?)(b?)((?:-[a-z0-9]+)*)$/.exec(no);
  if (!m) return null;
  const segs = m[5] ? m[5].slice(1).split('-') : [];
  return {art: m[1], par: m[3] ? (m[3] === 'pu' ? 'pu' : m[3].slice(1)) : '', segs};
}
/* itens que estão num anexo da norma (RDC 48/2013: o regulamento técnico é o Anexo II) */
const ANEXO_V11 = {'rdc-anvisa-48-2013': 'Anexo II, '};
function dispV11(no, lei) {
  const p = partesV11(no); if (!p) return no;
  const out = [p.item ? (ANEXO_V11[lei] || '') + 'item ' + p.item : 'art. ' + ord(p.art)];
  if (p.par) out.push(p.par === 'pu' ? 'parágrafo único' : '§ ' + ord(p.par));
  p.segs.forEach((s, i) => out.push(i === 0 ? ROM(s) : i === 1 ? 'alínea “' + s + '”' : 'item ' + s));
  return out.join(', ');
}
function rotV11(no) {
  const p = partesV11(no); if (!p) return '';
  if (p.segs.length) { const s = p.segs[p.segs.length - 1]; return p.segs.length === 1 ? ROM(s) + ' -' : p.segs.length === 2 ? s + ')' : s + '.'; }
  if (p.par) return p.par === 'pu' ? 'Parágrafo único.' : '§ ' + ord(p.par);
  return p.item ? p.item + '.' : 'Art. ' + ord(p.art);
}
function textoV11(lei, no) {
  const L = V11.get(lei); if (!L) return null;
  const nos = L.n, i = nos.findIndex(x => x[0] === no); if (i < 0) return null;
  const linha = x => (rotV11(x[0]) + ' ' + x[1]).trim();
  const l = [linha(nos[i])];
  const p = partesV11(no), filho = p && p.item ? /^[.-]/ : /^[p-]/;
  for (const x of nos) if (x[0] !== no && x[0].startsWith(no) && filho.test(x[0].slice(no.length)) && !/b/.test(x[0].slice(no.length).replace(/pub?/, ''))) l.push(linha(x));
  /* parágrafo, inciso ou alínea citados sozinhos levam antes o caput do artigo (ou do item) */
  if (p && (p.par || p.segs.length)) { const cap = nos.find(x => x[0] === (p.item ? 'n' + p.item : 'a' + p.art)); if (cap) l.unshift(linha(cap)); }
  return {norma: L.l, disp: dispV11(no, lei), texto: l.join('\n'), url: L.u || ''};
}

/* normas que só o módulo de Serviços assistenciais traz (DATA.laws: nós {id, p, t, r, x}) */
let LEIS_MOD = {};
function textoMod(lei, no) {
  const L = LEIS_MOD[lei]; if (!L) return null;
  const nos = Array.isArray(L.nos) ? L.nos : Object.values(L.nos || {}), n = nos.find(x => x.id === no); if (!n) return null;
  const l = [], desce = x => { l.push(((x.r || '') + ' ' + (x.x || '')).trim()); nos.filter(f => f.p === x.id).forEach(desce); };
  desce(n);
  return {norma: L.label, disp: n.r || no, texto: l.join('\n'), url: L.url || ''};
}

/* ---------- banco v12 (via legislacao-v12.cjs) ---------- */
function textosV12(ids) {
  if (!ids.length) return {};
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-')), mod = path.join(tmp, 'r.cjs'), out = path.join(tmp, 'o.json');
  fs.writeFileSync(mod, 'module.exports=' + JSON.stringify({secoes: [{itens: [{perguntas: [{r: ids}]}]}], infracoes: []}));
  execFileSync(process.execPath, [path.join(__dirname, 'legislacao-v12.cjs'), out, mod], {stdio: ['ignore', 'ignore', 'inherit'], env: {...process.env, LEGIS_TOLERANTE: VER ? '1' : ''}});
  const j = JSON.parse(fs.readFileSync(out, 'utf8')); fs.rmSync(tmp, {recursive: true, force: true});
  /* nomes que o legislacao-v12.cjs não traz, e itens de anexo/regulamento (RDC 67/2007, Portaria 1.101/2015) */
  for (const [id, x] of Object.entries(j)) {
    const ch = id.split('::')[0];
    if (NOMES[ch]) x.norma = NOMES[ch];
    const l = x.texto.split('\n');
    if (/^Art\.?\s*\d+[º°]?\.?$/.test(l[0].trim())) { const c = caputBloco(id); if (c) x.texto = l[0].trim() + ' ' + c + '\n' + l.slice(1).join('\n'); }
    const m = /::(?:anexo-([ivx]+)::anexo::[ivx]+|regulamento-tecnico)::item::([\d-]+)(.*)$/.exec(id);
    if (m) x.disp = (m[1] ? 'Anexo ' + m[1].toUpperCase() + ', item ' : 'Regulamento Técnico, item ') + m[2].replace(/-/g, '.') + (m[3] ? ', ' + m[3].split('::').filter(Boolean).filter((v, i) => i % 2).map(v => v.toUpperCase()).join(', ') : '');
    else x.disp = x.disp.replace(/item (\d+(?:-\d+)+)/, (a, n) => 'item ' + n.replace(/-/g, '.'));
  }
  return j;
}
const NOMES = {
  'decreto-estadual-sp-69118-2024': 'Decreto Estadual SP nº 69.118/2024', 'rdc-16-2014': 'RDC Anvisa nº 16/2014', 'rdc-166-2017': 'RDC Anvisa nº 166/2017',
  'rdc-204-2006': 'RDC Anvisa nº 204/2006', 'rdc-497-2021': 'RDC Anvisa nº 497/2021', 'rdc-653-2022': 'RDC Anvisa nº 653/2022', 'rdc-58-2007': 'RDC Anvisa nº 58/2007',
  'rdc-21-2009': 'RDC Anvisa nº 21/2009', 'rdc-327-2019': 'RDC Anvisa nº 327/2019', 'rdc-471-2021': 'RDC Anvisa nº 471/2021', 'rdc-1000-2025': 'RDC Anvisa nº 1.000/2025',
  'rdc-973-2025': 'RDC Anvisa nº 973/2025', 'rdc-786-2023': 'RDC Anvisa nº 786/2023', 'rdc-429-2020': 'RDC Anvisa nº 429/2020', 'rdc-133-2016': 'RDC Anvisa nº 133/2016',
  'portaria-svs-ms-344-1998': 'Portaria SVS/MS nº 344/1998', 'portaria-svs-ms-6-1999': 'Portaria SVS/MS nº 6/1999', 'portaria-sms-sp-1101-2015': 'Portaria SMS nº 1.101/2015',
  'lei-municipal-sp-11383-1993': 'Lei Municipal nº 11.383/1993', 'lei-10357-2001': 'Lei Federal nº 10.357/2001', 'lei-9965-2000': 'Lei Federal nº 9.965/2000',
  'lei-estadual-sp-15266-2013': 'Lei Estadual SP nº 15.266/2013', 'in-62-2020': 'IN Anvisa nº 62/2020', 'in-75-2020': 'IN Anvisa nº 75/2020', 'in-360-2025': 'IN Anvisa nº 360/2025',
  'in-94-2021': 'IN Anvisa nº 94/2021', 'in-95-2021': 'IN Anvisa nº 95/2021', 'rdc-87-2008': 'RDC Anvisa nº 87/2008', 'rdc-57-2009': 'RDC Anvisa nº 57/2009',
  'rdc-359-2020': 'RDC Anvisa nº 359/2020', 'rdc-361-2020': 'RDC Anvisa nº 361/2020', 'rdc-362-2020': 'RDC Anvisa nº 362/2020', 'rdc-565-2021': 'RDC Anvisa nº 565/2021',
  'rdc-672-2022': 'RDC Anvisa nº 672/2022', 'rdc-670-2022': 'RDC Anvisa nº 670/2022', 'rdc-1015-2026': 'RDC Anvisa nº 1.015/2026', 'rdc-1023-2026': 'RDC Anvisa nº 1.023/2026',
  'rdc-1028-2026': 'RDC Anvisa nº 1.028/2026', 'rdc-1039-2026': 'RDC Anvisa nº 1.039/2026', 'rdc-22-2014': 'RDC Anvisa nº 22/2014',
  'lei-municipal-sp-13945-2005': 'Lei Municipal nº 13.945/2005', 'lei-municipal-sp-13993-2005': 'Lei Municipal nº 13.993/2005',
  'lei-municipal-sp-16059-2014': 'Lei Municipal nº 16.059/2014', 'lei-municipal-sp-17105-2019': 'Lei Municipal nº 17.105/2019', 'lei-municipal-sp-15681-2013': 'Lei Municipal nº 15.681/2013'
};
/* caput que o estruturador do v12 deixou num nó “bloco” logo após o artigo (Decreto 69.118/2024, art. 15) */
const BASE = path.resolve(process.env.BASE_VIGILANCIA || path.join(RAIZ, '..', 'base-vigilancia'), 'dados', 'legislacao_v12', 'normas');
function caputBloco(id) {
  const m = /^(([^:]+)::artigo::[^:]+)::/.exec(id); if (!m) return '';
  const j = JSON.parse(fs.readFileSync(path.join(BASE, m[2] + '.json'), 'utf8')), i = j.nos.findIndex(n => n.id === m[1]);
  const b = i >= 0 && j.nos[i + 1];
  return b && b.tipo === 'bloco' && /^[A-ZÀ-Ú]/.test(b.texto || '') ? String(b.texto).trim() : '';
}
function resolve(ids) {
  const v12 = ids.filter(x => x.includes('::')), out = textosV12([...new Set(v12)]), faltam = [];
  for (const id of ids) {
    if (id.includes('::')) continue;
    const [lei, no] = id.split(':'), t = textoV11(lei, no) || textoMod(lei, no);
    if (!t) faltam.push(id); else out[id] = t;
  }
  for (const id of ids) {
    if (/^lei-municipal-13725-2004/.test(id)) { const a = +(/(?:artigo::|:a)(\d+)/.exec(id) || [])[1]; if (a > 109 || a === 22) throw Error('Lei 13.725: artigo não permitido (' + id + ')'); }
  }
  if (faltam.length && VER) console.error('Ausentes no banco v11: ' + faltam.join(' '));
  else if (faltam.length) throw Error('Dispositivos ausentes no banco v11:\n  ' + faltam.join('\n  '));
  return out;
}

if (process.argv[2] === '--ver') {
  const t = resolve(process.argv.slice(3));
  for (const [id, x] of Object.entries(t)) console.log('■ ' + id + ' — ' + x.norma + ', ' + x.disp + '\n' + x.texto.slice(0, +process.env.MAX || 700) + '\n');
  process.exit(0);
}

/* ---------- listas ---------- */
const C = require(path.join(RAIZ, 'documentos', 'checklist.cjs'));
const GRUPOS = C.GRUPOS.map(g => g[0]);
function item(ent) {
  const [chave, o] = Array.isArray(ent) ? ent : [ent, {}];
  /* documento próprio do roteiro (fora do catálogo): traz g, n, o e r */
  const d = {id: chave, ...(C.DOCS[chave] || {}), ...o};
  if (!d.n || !d.o) throw Error('documento sem nome ou conteúdo: ' + chave);
  if (!GRUPOS.includes(d.g)) throw Error(chave + ': grupo inválido ' + d.g);
  if (!d.r || !d.r.length) throw Error(chave + ': sem fundamento legal');
  return {id: d.id, g: d.g, n: d.n, o: d.o, q: d.q || '', r: d.r};
}
function lista(app, l0) {
  const l = l0.map(item), ids = new Set();
  l.forEach(d => { if (ids.has(d.id)) throw Error(app + ': documento repetido ' + d.id); ids.add(d.id); });
  return l;
}
const apps = {};
for (const [app, v] of Object.entries(C.APPS)) {
  if (Array.isArray(v)) { apps[app] = lista(app, v); continue; }
  const mod = {};
  for (const [k, m] of Object.entries(v.modalidades)) mod[k] = {nome: m.nome, lista: lista(app + '/' + k, m.lista)};
  apps[app] = {modalidades: mod};
}

/* Serviços assistenciais: a lista de documentos de cada modalidade, a do próprio módulo */
{
  const D = jsonApos(blocks.get('app--servicos-assistenciais'), 'const DATA=');
  LEIS_MOD = D.laws || {};
  /* os grupos são os do próprio módulo, na ordem em que aparecem */
  const mod = {};
  for (const sv of D.services) {
    const out = [], grupos = [];
    sv.doc.forEach((x, i) => {
      if (/conferida na inspeção/i.test(x.i)) return; /* estrutura física: não é documento */
      let g = grupos.findIndex(y => y[1] === x.g); if (g < 0) { grupos.push(['m' + grupos.length, x.g]); g = grupos.length - 1; }
      out.push({id: sv.id + '-' + (i + 1), g: grupos[g][0], n: x.i.replace(/\.$/, ''), o: '', q: x.ap === 'Condicional' ? 'Quando aplicável ao serviço.' : '', r: x.refs.map(r => r.law + ':' + r.node)});
    });
    mod[sv.id] = {nome: sv.nome, grupos, lista: out};
  }
  apps['servicos-assistenciais'] = {modalidades: mod};
}

const todos = new Set();
Object.values(apps).forEach(a => (Array.isArray(a) ? a : Object.values(a.modalidades).flatMap(m => m.lista)).forEach(d => d.r.forEach(r => todos.add(r))));
const textos = resolve([...todos].sort());
/* dispositivo citado por inteiro (capítulo ou item com todos os subitens): o texto embutido vai até
   ~4 mil caracteres e remete à fonte oficial pelo resto */
for (const x of Object.values(textos)) if (x.texto.length > 4000) x.texto = x.texto.slice(0, x.texto.lastIndexOf('\n', 4000)) + '\n[…] O texto continua na fonte oficial.';
/* a citação legível de cada documento vem dos textos: “RDC Anvisa nº 63/2011, art. 39; …” */
fs.writeFileSync(SAIDA, JSON.stringify({versao: C.VERSAO, grupos: C.GRUPOS, textos, apps}) + '\n');
/* documentos/LISTAS.md: as listas em texto, para conferência roteiro a roteiro */
{
  const cit = d => { const por = {}, ordem = []; d.r.forEach(r => { const t = textos[r]; if (!por[t.norma]) { por[t.norma] = []; ordem.push(t.norma); } if (!por[t.norma].includes(t.disp)) por[t.norma].push(t.disp); }); return ordem.map(n => n + ', ' + por[n].join('; ')).join('; '); };
  const bloco = (titulo, l, gs) => '## ' + titulo + '\n\n' + gs.map(([g, nome]) => { const ds = l.filter(d => d.g === g); return ds.length ? '### ' + nome + '\n\n' + ds.map(d => '- **' + d.n + '**' + (d.q ? ' — _' + d.q + '_' : '') + '  \n  ' + (d.o ? d.o + '  \n  ' : '') + 'Fundamento: ' + cit(d)).join('\n') + '\n' : ''; }).join('\n');
  const md = ['# Checklist de documentos — listas por roteiro', '', 'Gerado por `scripts/documentos-checklist.cjs` a partir de `documentos/checklist.cjs` (não editar à mão). Versão ' + C.VERSAO + '.', ''];
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8'), nome = a => a === 'servicos-alimentacao-roteiro' ? 'Serviços de alimentação' : ((new RegExp("'" + a + "':\\{nome:'([^']+)'").exec(html) || [])[1] || a);
  for (const [app, v] of Object.entries(apps)) {
    if (Array.isArray(v)) md.push(bloco(nome(app), v, C.GRUPOS));
    else for (const [k, m] of Object.entries(v.modalidades)) md.push(bloco(nome(app) + ' — ' + m.nome, m.lista, m.grupos || C.GRUPOS));
  }
  fs.writeFileSync(path.join(RAIZ, 'documentos', 'LISTAS.md'), md.join('\n') + '\n');
}
console.log('campo/documentos-dados.json:', Object.keys(apps).length, 'roteiros,', Object.keys(textos).length, 'dispositivos,', (fs.statSync(SAIDA).size / 1024).toFixed(0), 'KB');
