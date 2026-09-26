'use strict';
/* Alimentos — rotulagem: injeta rotulagem-melhorias.js no fim do módulo
   (entre marcadores, idempotente). Uso: node scripts/repack-rotulagem.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const id = 'app--alimentos-integrado';
const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
const m = html.match(re); if (!m) throw Error(id);
let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação');
const START = '<!--ROTULAGEM_INICIO-->', END = '<!--ROTULAGEM_FIM-->';
const i0 = app.indexOf(START); if (i0 >= 0) app = app.slice(0, i0) + app.slice(app.indexOf(END) + END.length);
const code = fs.readFileSync(path.join(root, 'rotulagem-melhorias.js'), 'utf8').replace(/<\/(script)/gi, '<\\/$1');
const k = app.lastIndexOf('</body>'); if (k < 0) throw Error('</body> não localizado');
app = app.slice(0, k) + START + '<script>' + code + '</script>' + END + app.slice(k);
const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip');
html = html.replace(re, () => m[1] + enc + m[3]);
fs.writeFileSync(file, html);
console.log('Rotulagem: leitura por foto, busca e organização ajustadas.');
