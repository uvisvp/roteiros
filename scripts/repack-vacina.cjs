'use strict';
/* Vacinação no núcleo Serviços — card único (17/10/2026; antes, 16/10, eram três
   roteiros: drogaria, UBS e serviço privado). A RDC 197/2017 é a mesma para
   todos; a identificação escolhe a natureza e o tipo de estabelecimento
   (vacina/roteiro.cjs). Tira os três apps antigos e o grupo que os abria.
   O texto dos dispositivos vem de vacina/legislacao.json
   (node scripts/legislacao-v12.cjs vacina/legislacao.json vacina/roteiro.cjs).
   Idempotente. Uso: node scripts/repack-vacina.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const {pagina, gravaBloco} = require('./roteiro-simples-pagina.cjs');
const C = require('./casca-apps.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz, blocks} = unpack(file);
const LEGAL = JSON.parse(fs.readFileSync(path.join(root, 'vacina', 'legislacao.json'), 'utf8'));
const D = require(path.join(root, 'vacina', 'roteiro.cjs'));
for (const velho of ['vacinacao-drogaria', 'vacinacao-ubs', 'vacinacao-privado']) html = C.remove(html, velho);
html = C.grupo(html, 'vacinacao', null).replace(' padraoApps.push("vacinacao-drogaria","vacinacao-ubs","vacinacao-privado");', '');
html = gravaBloco(html, lz, D.app, pagina(D, LEGAL, '#5B3CC4', blocks).html);
html = C.registra(html, {app: D.app, titulo: D.titulo, nucleo: 'Serviços', store: D.store, icone: C.ICONES.seringa});
html = C.cartao(html, 'Serviços', ['Vacinação', 'Farmácias, clínicas, unidades públicas e demais serviços de vacinação humana (RDC 197/2017).', 'vacinacao'], 'academia-piscina');
fs.writeFileSync(file, html);
let n = 0; D.secoes.forEach(s => s.itens.forEach(i => n += (i.perguntas || []).length));
console.log(`${D.titulo}: ${n} perguntas, ${D.infracoes.length} infrações.`);
