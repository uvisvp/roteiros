'use strict';
/* Distribuidora: injeta distribuidora-documentos.js (Anexo I rev. 3, Anexo II e
   análise do plano de ação) no módulo, antes de distInstall().
   Idempotente: substitui a injeção anterior entre os marcadores.
   Uso: node scripts/repack-distribuidora-docs.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..');
const file = path.join(root, 'index.html');
let {html, blocks, lz} = unpack(file);
const id = 'app--distribuidoras-transportadoras';
let app = blocks.get(id);
const START = '/*__DIST_DOCS_INICIO__*/', END = '/*__DIST_DOCS_FIM__*/';
const i0 = app.indexOf(START);
if (i0 >= 0) app = app.slice(0, i0) + app.slice(app.indexOf(END) + END.length);
const code = ['saber-mais.js', 'distribuidora-textos.js', 'distribuidora-documentos.js', 'distribuidora-ifa.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n').replace(/<\/(script)/gi, '<\\/$1');
const anchor = '\ndistInstall();\n';
if (app.split(anchor).length !== 2) throw Error('Ponto de instalação do módulo não localizado de forma única');
app = app.replace(anchor, () => '\n' + START + '\n' + code + '\n' + END + anchor);
const re = new RegExp('(<script type="text/plain" id="' + id + '">)[\\s\\S]*?(</script>)');
const old = html.match(re); if (!old) throw Error(id);
const encoded = lz.compressToBase64(app);
if (lz.decompressFromBase64(encoded) !== app) throw Error('Falha de round-trip ' + id);
html = html.replace(re, () => old[1] + encoded + old[2]);
fs.writeFileSync(file, html);
console.log('Distribuidora: documentos do POP-O-SNVS-011 injetados no index.html.');
