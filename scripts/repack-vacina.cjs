'use strict';
/* Vacinação no núcleo Serviços — 16/10/2026.
   Um card “Vacinação” que abre três roteiros (vacina/variantes.cjs): drogaria,
   Unidade Básica de Saúde e serviço privado, cada um com bloco, Salvas e
   armazenamento próprios, no motor roteiro-simples. O texto dos dispositivos
   vem de vacina/legislacao.json (mesmo texto do site Medicamentos).
   Na casca: GRUPOS (card que abre uma lista) e a navegação de volta
   (lista do grupo ← núcleo ← início). Idempotente.
   Uso: node scripts/repack-vacina.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const {pagina, gravaBloco} = require('./roteiro-simples-pagina.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
const COR = '#5452AA';
let {html, lz, blocks} = unpack(file);
const LEGAL = JSON.parse(fs.readFileSync(path.join(root, 'vacina', 'legislacao.json'), 'utf8'));
const VAR = require(path.join(root, 'vacina', 'variantes.cjs'));
const DESC = {
  'vacinacao-drogaria': 'Serviço de vacinação em farmácia ou drogaria (RDC 197/2017).',
  'vacinacao-ubs': 'Sala de vacinação de Unidade Básica de Saúde (RDC 197/2017).',
  'vacinacao-privado': 'Clínica ou serviço privado de vacinação (RDC 197/2017).'
};
for (const D of VAR) html = gravaBloco(html, lz, D.app, pagina(D, LEGAL, COR, blocks).html);

function insere(depois, novo, rotulo, ja) {
  if (html.includes(ja || novo)) return;
  if (html.split(depois).length !== 2) throw Error(rotulo + ': esperava 1 ocorrência');
  html = html.replace(depois, () => depois + novo);
}
function troca(de, para, rotulo) {
  if (html.includes(para)) return;
  if (html.split(de).length !== 2) throw Error(rotulo + ': esperava 1 ocorrência');
  html = html.replace(de, () => para);
}
const SERINGA = '<path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3a1 1 0 0 1-1.4 0l-2.6-2.6a1 1 0 0 1 0-1.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6"/>';
/* catálogo: o card do grupo depois de Academias e piscinas */
insere(',["Academias e piscinas","Academias, clubes, piscinas e saunas: roteiro, infrações e relatório (Portaria SMS 1.101/2015).","academia-piscina"]',
  ',["Vacinação","Drogaria, Unidade Básica de Saúde ou serviço privado (RDC 197/2017).","vacinacao"]', 'catálogo');
/* grupos: lista que o card abre */
const grupos = {vacinacao: {titulo: 'Vacinação', itens: VAR.map(D => [D.titulo, DESC[D.app], D.app])}};
{
  const re = /\n  var GRUPOS = \{[^\n]*\};\n  var grupoAtual = null;/;
  const linha = `\n  var GRUPOS = ${JSON.stringify(grupos)};\n  var grupoAtual = null;`;
  if (re.test(html)) html = html.replace(re, () => linha);
  else { const m = html.match(/\n  var ROTEIROS = \{[^\n]*\};/); if (!m) throw Error('ROTEIROS'); html = html.replace(m[0], () => m[0] + linha); }
}
insere(`\n    "academia-piscina": '<path d="M3 7v5M6 5v9M18 5v9M21 7v5M6 9.5h12M3 19.5c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0"/>',`, `\n    "vacinacao": '${SERINGA}',` + VAR.map(D => `\n    "${D.app}": '${SERINGA}',`).join(''), 'ícones', '"vacinacao": \'');
insere(" 'academia-piscina':'Serviços',", VAR.map(D => ` '${D.app}':'Serviços',`).join(''), 'núcleo');
insere(' padraoApps.push("academia-piscina");', ' padraoApps.push(' + VAR.map(D => JSON.stringify(D.app)).join(',') + ');', 'componente padrão');
insere("\n    'academia-piscina':['uvis-academia-piscina-v1'],", VAR.map(D => `\n    '${D.app}':['${D.store}'],`).join(''), 'limpeza', `'${VAR[0].app}':['`);
{
  const ancora = "  'academia-piscina':{nome:'Academias e piscinas',";
  const novo = VAR.map(D => `  '${D.app}':{nome:'${D.titulo}',nucleo:'Serviços',ls:['${D.store}'],fotos:[],barra:'.pu-header .pu-acoes'},\n`).join('');
  if (!html.includes(novo)) { if (html.split(ancora).length !== 2) throw Error('Salvas'); html = html.replace(ancora, () => novo + ancora); }
}
/* navegação: telaLista(núcleo, grupo) */
troca("  function telaLista(nucleo){\n    nucleoAtual = nucleo; aplicaCorNucleo(nucleo);\n    var lista = ROTEIROS[nucleo] || [];\n    $('lista-tit').textContent = nucleo;",
  "  function telaLista(nucleo, grupo){\n    nucleoAtual = nucleo; aplicaCorNucleo(nucleo);\n    grupoAtual = grupo && GRUPOS[grupo] ? grupo : null;\n    var G = grupoAtual ? GRUPOS[grupoAtual] : null;\n    var lista = G ? G.itens : (ROTEIROS[nucleo] || []);\n    $('lista-tit').textContent = G ? G.titulo : nucleo;\n    var vh = document.querySelector('#tela-lista [data-home]'); if(vh) vh.textContent = G ? '‹ ' + nucleo : '‹ Início';", 'telaLista');
troca("    var h = document.createElement('h2'); h.textContent = nucleo; c.appendChild(h);",
  "    var h = document.createElement('h2'); h.textContent = G ? G.titulo : nucleo; c.appendChild(h);", 'título da lista');
troca("      b.onclick = function(){ abrirApp(r[2], r[0], r[3] || ''); };",
  "      b.onclick = function(){ if(GRUPOS[r[2]]) telaLista(nucleo, r[2]); else abrirApp(r[2], r[0], r[3] || ''); };", 'card do grupo');
troca("    if(nucleoAtual && ROTEIROS[nucleoAtual]) telaLista(nucleoAtual); else telaHome();",
  "    if(nucleoAtual && ROTEIROS[nucleoAtual]) telaLista(nucleoAtual, grupoAtual); else telaHome();", 'voltar do módulo');
troca("    if(target.closest('[data-home]')){e.__uvisCascaHandled=true;telaHome();return;}",
  "    if(target.closest('[data-home]')){e.__uvisCascaHandled=true;if(grupoAtual&&target.closest('#tela-lista')){telaLista(nucleoAtual);return;}telaHome();return;}", 'voltar do grupo');
troca("  function telaHome(){\n    nucleoAtual = null;", "  function telaHome(){\n    nucleoAtual = null; grupoAtual = null;", 'início zera o grupo');
fs.writeFileSync(file, html);
for (const D of VAR) { let n = 0; D.secoes.forEach(s => s.itens.forEach(i => n += (i.perguntas || []).length)); console.log(`${D.titulo}: ${n} perguntas, ${D.infracoes.length} infrações.`); }
