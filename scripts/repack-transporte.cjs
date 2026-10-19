'use strict';
/* Transporte de material biológico humano no núcleo Serviços — card único (19/10/2026):
   inspeção da transportadora pela RDC 504/2021 (transporte/roteiro.cjs). O texto dos
   dispositivos vem de transporte/legislacao.json (node scripts/legislacao-v12.cjs
   transporte/legislacao.json transporte/roteiro.cjs). Idempotente.
   Uso: node scripts/repack-transporte.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const {pagina, gravaBloco} = require('./roteiro-simples-pagina.cjs');
const C = require('./casca-apps.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz, blocks} = unpack(file);
const LEGAL = JSON.parse(fs.readFileSync(path.join(root, 'transporte', 'legislacao.json'), 'utf8'));
const D = require(path.join(root, 'transporte', 'roteiro.cjs'));
html = gravaBloco(html, lz, D.app, pagina(D, LEGAL, '#5B3CC4', blocks).html);
html = C.registra(html, {app: D.app, titulo: D.titulo, nucleo: 'Serviços', store: D.store, icone: C.ICONES.caminhao});
html = C.cartao(html, 'Serviços', ['Transporte de material biológico', 'Transportadora de amostras, sangue, tecidos e outros materiais biológicos humanos (RDC 504/2021).', D.app], 'grupo-eac');
fs.writeFileSync(file, html);
let n = 0; D.secoes.forEach(s => s.itens.forEach(i => n += (i.perguntas || []).length));
console.log(`${D.titulo}: ${n} perguntas, ${D.infracoes.length} infrações.`);
