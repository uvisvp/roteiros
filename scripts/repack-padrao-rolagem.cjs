'use strict';
/* Padrão UVIS (rec--padrao-uvis.js): a faixa de seções/itens centraliza o chip atual só na
   horizontal. scrollIntoView também rolava a página para o topo a cada resposta ou lista
   suspensa (pedido de 09/11/2026). Aplica no bloco já empacotado o mesmo trecho de
   padrao-uvis.js (o repack-padrao antigo não roda mais no index atual). Idempotente.
   Uso: node scripts/repack-padrao-rolagem.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const id = 'rec--padrao-uvis.js';
const re = new RegExp('(<script type="text/plain" id="' + id.replace(/[.]/g, '\\.') + '">)([\\s\\S]*?)(</script>)');
const m = html.match(re); if (!m) throw Error(id);
let s = lz.decompressFromBase64(m[2].trim());
const fonte = fs.readFileSync(path.join(__dirname, '..', 'padrao-uvis.js'), 'utf8');
const ini = fonte.indexOf(' /* centraliza o chip atual'), fim = fonte.indexOf(' function faixaSecoes(){');
if (ini < 0 || fim < 0) throw Error('trecho centraliza em padrao-uvis.js');
const HELPER = fonte.slice(ini, fim);
if (!s.includes('function centraliza(at)')) {
  const pares = [["var at=el.querySelector('[aria-current=page]');if(at&&at.scrollIntoView)try{at.scrollIntoView({block:'nearest',inline:'center'})}catch(e){}}", "var at=el.querySelector('[aria-current=page]');centraliza(at)}"],
    ["var at=m.querySelector('.pu-faixa [aria-current=step]');if(at&&at.scrollIntoView)try{at.scrollIntoView({block:'nearest',inline:'center'})}catch(e){}}", "var at=m.querySelector('.pu-faixa [aria-current=step]');centraliza(at)}"],
    [' function faixaSecoes(){', HELPER + ' function faixaSecoes(){']];
  for (const [de, para] of pares) { if (s.split(de).length !== 2) throw Error('trecho não localizado: ' + de.slice(0, 60)); s = s.replace(de, () => para); }
  const enc = lz.compressToBase64(s); if (lz.decompressFromBase64(enc) !== s) throw Error('round-trip');
  html = html.replace(re, (_, a, __, c) => a + enc + c);
  fs.writeFileSync(file, html);
  console.log('padrão: faixa centraliza só na horizontal.');
} else console.log('padrão: já aplicado.');
