'use strict';
/* Exames de Análises Clínicas (EAC) no núcleo Serviços — 17/10/2026: um card
   que abre os Serviços Tipo I, II e III da RDC 978/2025 (eac/roteiro.cjs), no
   motor roteiro-simples. O Tipo I também aparece no núcleo Medicamentos, no
   grupo Drogaria (scripts/repack-medicamentos.cjs). Texto dos dispositivos em
   eac/legislacao.json (node scripts/legislacao-v12.cjs eac/legislacao.json
   eac/roteiro.cjs). Idempotente. Uso: node scripts/repack-eac.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const {pagina, gravaBloco} = require('./roteiro-simples-pagina.cjs');
const C = require('./casca-apps.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz, blocks} = unpack(file);
const LEGAL = JSON.parse(fs.readFileSync(path.join(root, 'eac', 'legislacao.json'), 'utf8'));
const TIPOS = require(path.join(root, 'eac', 'roteiro.cjs'));
const DESC = {
  'eac-tipo1': ['Serviço Tipo I', 'Farmácia ou consultório isolado: EAC no ato, em material capilar, oral ou de naso/orofaringe (arts. 8º a 18).'],
  'eac-tipo2': ['Serviço Tipo II', 'Posto de coleta ou consultório isolado vinculado a um Serviço Tipo III (arts. 19 a 32).'],
  'eac-tipo3': ['Serviço Tipo III', 'Laboratório clínico ou de anatomia patológica, com apoio, postos, itinerante e Central de Distribuição (arts. 33 a 53).']
};
for (const D of TIPOS) {
  html = gravaBloco(html, lz, D.app, pagina(D, LEGAL, '#5B3CC4', blocks).html);
  html = C.registra(html, {app: D.app, titulo: D.titulo, nucleo: 'Serviços', store: D.store, icone: C.ICONES.frasco});
}
html = C.grupo(html, 'grupo-eac', {titulo: 'Exames de análises clínicas (EAC)', itens: TIPOS.map(D => [DESC[D.app][0], DESC[D.app][1], D.app])});
html = C.icone(html, 'grupo-eac', C.ICONES.frasco);
html = C.cartao(html, 'Serviços', ['Exames de análises clínicas (EAC)', 'Serviços Tipo I, II e III: farmácia ou consultório, posto de coleta e laboratório (RDC 978/2025).', 'grupo-eac'], 'vacinacao');
fs.writeFileSync(file, html);
for (const D of TIPOS) { let n = 0; D.secoes.forEach(s => s.itens.forEach(i => n += (i.perguntas || []).length)); console.log(`${D.titulo}: ${n} perguntas, ${D.infracoes.length} infrações.`); }
