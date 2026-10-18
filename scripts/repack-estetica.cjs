'use strict';
/* Serviços de estética no padrão dos demais roteiros (pedido de 18/10/2026).
   Monta o bloco app--estetica com o motor roteiro-simples (roteiro-simples/), os dados de
   estetica/roteiro.cjs (perguntas do ROI de Estética da Anvisa, perfil saúde/interesse à saúde,
   catálogo de infrações do módulo anterior) e o texto dos dispositivos de
   estetica/legislacao.json (scripts/estetica-legislacao.cjs). Na casca: card em Serviços,
   componente padrão, Salvas e limpeza com a nova chave; saem as três injeções que só serviam
   à tela antiga (barra inferior “Anterior / Consulta / Selecionadas / Próximo”, toque nas abas
   e cabeçalho compacto). O módulo antigo (inventário, abas Interesse/Serviços/Produtos/Infrações)
   e o estetica-navegacao.js deixam de existir; os enquadramentos dele estão em
   estetica/infracoes.json e as normas em estetica/normas.json.
   Idempotente. Uso: node scripts/repack-estetica.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const {pagina, gravaBloco} = require('./roteiro-simples-pagina.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
const APP = 'estetica', COR = '#5452AA';
let {html, lz, blocks} = unpack(file);

/* ---------- página do app ---------- */
const D = require(path.join(root, 'estetica', 'roteiro.cjs'));
const {legal, html: pag} = pagina(D, JSON.parse(fs.readFileSync(path.join(root, 'estetica', 'legislacao.json'), 'utf8')), COR, blocks);
html = gravaBloco(html, lz, APP, pag);

/* ---------- casca ---------- */
function troca(de, para, rotulo) {
  if (html.includes(para)) return;
  if (html.split(de).length !== 2) throw Error(rotulo + ': esperava 1 ocorrência');
  html = html.replace(de, () => para);
}
/* trecho entre duas âncoras (a primeira inclusa, a segunda inclusa) — some de vez */
function tira(ini, fim, rotulo) {
  const i = html.indexOf(ini); if (i < 0) return;
  if (html.indexOf(ini, i + 1) >= 0) throw Error(rotulo + ': âncora repetida');
  const j = html.indexOf(fim, i); if (j < 0) throw Error(rotulo + ': fim não localizado');
  html = html.slice(0, i) + html.slice(j + fim.length);
}
troca('["Estética e beleza","Inventário de infrações, consulta de produtos e relatório.","estetica"]',
  '["Estética e beleza","Roteiro do ROI da Anvisa (serviço de saúde ou de interesse à saúde), infrações e relatório.","estetica"]', 'catálogo');
troca(' padraoApps.push("vacinacao");', ' padraoApps.push("vacinacao"); padraoApps.push("estetica");', 'componente padrão');
troca("    'estetica':['estetica-infracoes-v3'],", "    'estetica':['uvis-estetica-v1','estetica-infracoes-v3','estetica-constatacoes-v1'],", 'limpeza');
{
  const odo = "  'odontologia':{nome:'Odontologia',nucleo:'Odontologia',";
  const novo = "  'estetica':{nome:'Estética e beleza',nucleo:'Serviços',ls:['uvis-estetica-v1'],fotos:[],barra:'.pu-header .pu-acoes'},\n";
  if (!html.includes(novo)) {
    if (html.split(odo).length !== 2) throw Error('Salvas: linha da odontologia');
    html = html.replace(odo, () => novo + odo);
  }
}
tira("    /* Revisão móvel 20260908-22 — Estética e faixa inferior por núcleo. */\n    if(app==='estetica'){", "      s=s.replace(/<\\/body>/i,estDock+'</body>');\n    }\n", 'barra inferior da estética antiga');
tira("    if(app==='estetica'){\n    cab += '<style>@media(max-width:900px){html[data-uvis-app=\"estetica\"] .aba", "</style>';\n  }\n", 'toque nas abas da estética antiga');
tira("    if(app==='estetica'){\n      s=s.replace(/<style id=\"uvis-estetica-mobile-v2[01]\">", "</style></head>');\n    }\n", 'cabeçalho da estética antiga');

fs.writeFileSync(file, html);
let n = 0; D.secoes.forEach(s => s.itens.forEach(i => n += (i.perguntas || []).length));
console.log(`Estética: ${D.secoes.length} seções, ${n} perguntas, ${D.infracoes.length} infrações (${D.infracoes.filter(i => i.avulsa).length} avulsas), ${Object.keys(legal).length} dispositivos.`);
