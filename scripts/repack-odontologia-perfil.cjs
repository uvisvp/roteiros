'use strict';
/* Odontologia: perfil pelo tipo de estabelecimento e roteiro filtrado (12/11/2026, como em Alimentos).
   1. tela padrão (odontologia-padrao.inc.js) entre /*ODO-PU-INICIO*\/ e /*ODO-PU-FIM*\/ — antes
      gravada por scripts/repack-padrao.cjs, que não roda mais; o arquivo é a fonte;
   2. relatório: “Tipologia” lista todas as salas marcadas (o serviço pode ter mais de uma).
   Perguntas, citações, enquadramentos e respostas gravadas não mudam.
   Idempotente. Uso: node scripts/repack-odontologia-perfil.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const id = 'app--odontologia';
const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
const m = html.match(re); if (!m) throw Error(id);
let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação');
const troca = (de, para, rot) => { if (app.includes(para)) return; const n = app.split(de).length - 1; if (n !== 1) throw Error('Trecho ' + rot + ' encontrado ' + n + ' vezes'); app = app.replace(de, () => para); };

/* 1 — tela padrão */
const frag = fs.readFileSync(path.join(root, 'odontologia-padrao.inc.js'), 'utf8').trim();
const INI = '/*ODO-PU-INICIO*/', FIM = '/*ODO-PU-FIM*/';
const k0 = app.indexOf(INI), k1 = app.indexOf(FIM);
if (k0 < 0 || k1 < k0 || app.indexOf(INI, k0 + 1) >= 0) throw Error('marcadores da tela padrão não localizados');
app = app.slice(0, k0) + INI + '\n' + frag + '\n' + app.slice(k1);

/* 2 — relatório */
troca("B.push({t:'kv',k:'Tipologia',v:LBL[P.tip]||'—'});",
  "B.push({t:'kv',k:'Tipologia',v:(typeof odoSalasTexto==='function'&&odoSalasTexto())||LBL[P.tip]||'—'});", 'tipologia no relatório');

const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip');
html = html.replace(re, () => m[1] + enc + m[3]);
fs.writeFileSync(file, html);
console.log('Odontologia: perfil pelo tipo de estabelecimento (atalhos, salas, listas recolhíveis) e roteiro filtrado.');
