'use strict';
/* Distribuidora: cabeçalho no padrão dos demais roteiros de Medicamentos (drogaria e
   manipulação): faixa azul-escura, seta de voltar e título branco em maiúsculas.
   Só o cabeçalho muda; o resto da tela fica como está. Os botões Salvas e Fotos
   passam ao mesmo lugar e visual da drogaria (inspecoes-salvas.js).
   Idempotente. Uso: node scripts/repack-distribuidora-cabecalho.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const id = 'app--distribuidoras-transportadoras';
const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
const m = html.match(re); if (!m) throw Error(id);
let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação ' + id);
const SETA = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14 5l-7 7 7 7M7 12h14"/></svg>';
const CSS = '<style id="dist-cabecalho">'
  + 'header.top{background:#304F63!important;border-bottom:0!important;box-shadow:none!important;backdrop-filter:none!important;color:#fff}'
  + 'header.top .topin{max-width:none!important;min-height:56px;padding:6px max(8px,env(safe-area-inset-right)) 6px max(8px,env(safe-area-inset-left))!important;gap:8px}'
  + 'header.top .back{flex:0 0 44px;width:44px;min-height:44px;padding:0!important;border:0!important;border-radius:8px;background:transparent!important;color:#fff!important;display:grid;place-items:center}'
  + 'header.top .back:hover{background:#ffffff1f!important}'
  + 'header.top .title{text-align:center}'
  + 'header.top .title b{color:#fff;text-transform:uppercase;font-weight:680;letter-spacing:.015em;font-size:clamp(.94rem,2vw,1.14rem);line-height:1.25}'
  + 'header.top .title span{color:#ffffffb3}'
  + 'header.top .save{color:#ffffffcc}'
  + '@media(max-width:760px){header.top .title span{display:none}}'
  /* abas principais no tamanho das da drogaria */
  + '.dist-topnav button{min-height:46px!important;padding:6px 4px!important;font-size:.92rem!important;line-height:1.2!important}'
  + '.dist-topnav button small{display:inline!important;font-size:.7rem!important;margin-left:3px}'
  + '@media(max-width:560px){.dist-topnav{display:flex!important}.dist-topnav button{flex:1 1 auto!important;font-size:.86rem!important;white-space:nowrap!important;padding:6px 8px!important}.dist-topnav button small{display:none!important}}'
  + '</style>';
const velho = /<style id="dist-cabecalho">[\s\S]*?<\/style>/;
if (velho.test(app)) app = app.replace(velho, () => CSS);
function troca(de, para, rot) { if (app.includes(para)) return; if (app.split(de).length !== 2) throw Error('Trecho não localizado de forma única: ' + rot); app = app.replace(de, () => para); }
troca('<header class="top"><div class="topin"><button class="back" id="backTop">← Voltar ao núcleo</button>',
  CSS + '<header class="top"><div class="topin"><button class="back" id="backTop" aria-label="Voltar ao núcleo" title="Voltar ao núcleo">' + SETA + '</button>', 'cabeçalho');
troca('<div class="title"><b>Distribuidora / Transportadora de medicamentos</b>', '<div class="title"><b>Distribuidora / Transportadora</b>', 'título');
const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip ' + id);
html = html.replace(re, () => m[1] + enc + m[3]);
fs.writeFileSync(file, html);
console.log('Distribuidora: cabeçalho no padrão de Medicamentos.');
