'use strict';
/* Produtos (12/11/2026): inventário ligado às perguntas. Insere produtos-sugestoes.inc.js no
   rec--roteiro-guiado.js, depois da tela padrão (/*PU-FIM*\/), entre /*PROD-SUG-INICIO*\/ e
   /*PROD-SUG-FIM*\/: a resposta “Não” sugere, na pergunta e no topo da aba Infrações, as
   infrações que a verificação aponta em `inf` (scripts/produtos/revisao.py). Idempotente.
   Uso: node scripts/repack-produtos-sugestoes.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const rid = 'rec--roteiro-guiado.js';
const re = new RegExp('(<script type="text/plain" id="' + rid.replace(/[.]/g, '\\.') + '">)([\\s\\S]*?)(</script>)');
const m = html.match(re); if (!m) throw Error(rid);
let rg = lz.decompressFromBase64(m[2]); if (!rg) throw Error('descompactação ' + rid);
const frag = fs.readFileSync(path.join(root, 'produtos-sugestoes.inc.js'), 'utf8').replace(/\s+$/, '');
const INI = '/*PROD-SUG-INICIO*/', FIM = '/*PROD-SUG-FIM*/';
const bloco = INI + '\n' + frag + '\n' + FIM + '\n';
const k0 = rg.indexOf(INI);
if (k0 >= 0) {
  const k1 = rg.indexOf(FIM, k0); if (k1 < 0) throw Error('fim do fragmento não localizado');
  rg = rg.slice(0, k0) + bloco + rg.slice(k1 + FIM.length + 1);
} else {
  const ancora = '/*PU-FIM*/\n';
  if (rg.split(ancora).length !== 2) throw Error('âncora /*PU-FIM*/ não única');
  rg = rg.replace(ancora, () => ancora + bloco);
}
const enc = lz.compressToBase64(rg); if (lz.decompressFromBase64(enc) !== rg) throw Error('round-trip ' + rid);
html = html.replace(re, () => m[1] + enc + m[3]);
/* Rótulo do botão de citação (todos os módulos): em “art. 46, c/c RDC …” o dispositivo vinha
   com a vírgula do “c/c” e o botão mostrava “Art. 46, ;”. Tira vírgula, ponto e vírgula e “c/c”
   do fim do dispositivo. */
{ const uid = 'rec--uvis-ui.js';
  const ure = new RegExp('(<script type="text/plain" id="' + uid.replace(/[.]/g, '\\.') + '">)([\\s\\S]*?)(</script>)');
  const um = html.match(ure); if (!um) throw Error(uid);
  let ui = lz.decompressFromBase64(um[2]); if (!ui) throw Error('descompactação ' + uid);
  const de = "const deviceName = s => String(s || '').trim().replace(/\\.$/,'')";
  const para = "const deviceName = s => String(s || '').trim().replace(/(?:[\\s,;]|\\bc\\/c\\b)+$/i,'').replace(/\\.$/,'')";
  if (!ui.includes(para)) { if (ui.split(de).length !== 2) throw Error('deviceName não único'); ui = ui.replace(de, () => para);
    const uenc = lz.compressToBase64(ui); if (lz.decompressFromBase64(uenc) !== ui) throw Error('round-trip ' + uid);
    html = html.replace(ure, () => um[1] + uenc + um[3]); } }
fs.writeFileSync(file, html);
console.log('Produtos: infrações sugeridas pela resposta “Não” (na pergunta e no topo do inventário).');
