'use strict';
/* Odontologia: injeta odontologia-orientacoes.js (Para saber mais: ABNT e climatização) no fim do módulo
   (entre marcadores, idempotente). Uso: node scripts/repack-odontologia.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const id = 'app--odontologia';
const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
const m = html.match(re); if (!m) throw Error(id);
let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação');
const START = '<!--ODONTO_ORIENT_INICIO-->', END = '<!--ODONTO_ORIENT_FIM-->';
const i0 = app.indexOf(START); if (i0 >= 0) app = app.slice(0, i0) + app.slice(app.indexOf(END) + END.length);
const code = fs.readFileSync(path.join(root, 'odontologia-orientacoes.js'), 'utf8').replace(/<\/(script)/gi, '<\\/$1');
const k = app.lastIndexOf('</body>'); if (k < 0) throw Error('</body> não localizado');
app = app.slice(0, k) + START + '<script>' + code + '</script>' + END + app.slice(k);
const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip');
html = html.replace(re, () => m[1] + enc + m[3]);
fs.writeFileSync(file, html);
console.log('Odontologia: orientações injetadas.');
