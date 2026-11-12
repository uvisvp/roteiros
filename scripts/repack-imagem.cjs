'use strict';
/* Diagnóstico por imagem no núcleo Serviços — 19/10/2026: um card que abre seis roteiros, um
   por modalidade, sobre a RDC 611/2022 e a IN própria (imagem/roteiro.cjs). Texto dos
   dispositivos em imagem/legislacao.json (node scripts/legislacao-v12.cjs
   imagem/legislacao.json imagem/roteiro.cjs). Idempotente. Uso: node scripts/repack-imagem.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const {pagina, gravaBloco} = require('./roteiro-simples-pagina.cjs');
const C = require('./casca-apps.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz, blocks} = unpack(file);
const LEGAL = JSON.parse(fs.readFileSync(path.join(root, 'imagem', 'legislacao.json'), 'utf8'));
const TIPOS = require(path.join(root, 'imagem', 'roteiro.cjs'));
const DESC = {
  /* 12/11/2026: um roteiro e um relatório para o serviço com uma ou mais modalidades (imagem/roteiro.cjs, montaMulti) */
  'imagem-servico': ['Uma ou mais modalidades', 'Marque as modalidades do serviço: a parte comum aparece uma vez e cada modalidade abre a sua IN. Um relatório.'],
  'imagem-convencional': ['Radiologia convencional', 'Raios X fixo e móvel, radiografia digital e com filme (IN 90/2021).'],
  'imagem-mamografia': ['Mamografia', 'Mamógrafo, testes do Anexo I e Programa Nacional de Qualidade em Mamografia (IN 92/2021).'],
  'imagem-tomografia': ['Tomografia computadorizada', 'Tomógrafo, protocolos pediátricos e indicação de dose (IN 93/2021).'],
  'imagem-ressonancia': ['Ressonância magnética', 'Zonas I a IV, detector de metais, triagem e gases criogênicos (IN 97/2021).'],
  'imagem-ultrassom': ['Ultrassonografia', 'Ultrassom diagnóstico e terapêutico (IN 96/2021).'],
  'imagem-hemodinamica': ['Hemodinâmica', 'Fluoroscopia e radiologia intervencionista, EPI e segurança do paciente (IN 91/2021).']
};
for (const D of TIPOS) {
  html = gravaBloco(html, lz, D.app, pagina(D, LEGAL, '#5B3CC4', blocks).html);
  html = C.registra(html, {app: D.app, titulo: D.titulo, nucleo: 'Serviços', store: D.store, icone: C.ICONES.imagem});
}
/* 12/11/2026: o card abre direto o roteiro único (uma ou mais modalidades); os seis por modalidade saem do card
   (pedido do usuário), mas continuam registrados, para que inspeção salva neles ainda abra em Salvas. */
html = C.grupo(html, 'grupo-imagem', null);
html = html.replace(/\n    "grupo-imagem": '[^\n]*',/, '');
if (!/"imagem-servico"\]/.test(html) && !/"grupo-imagem"\]/.test(html)) html = C.cartao(html, 'Serviços', ['Diagnóstico por imagem', '', 'imagem-servico'], 'transporte-biologico');
html = C.trocaCartao(html, 'Serviços', 'grupo-imagem', ['Diagnóstico por imagem', 'Radiologia, mamografia, tomografia, ressonância, ultrassom e hemodinâmica (RDC 611/2022): marque as modalidades do serviço.', 'imagem-servico']);
fs.writeFileSync(file, html);
for (const D of TIPOS) { let n = 0; D.secoes.forEach(s => s.itens.forEach(i => n += (i.perguntas || []).length)); console.log(`${D.titulo}: ${n} perguntas, ${D.infracoes.length} infrações.`); }
