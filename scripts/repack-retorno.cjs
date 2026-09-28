'use strict';
/* Insere retorno-roteiro.js na casca do index.html (antes de </body>). Idempotente.
   Uso: node scripts/repack-retorno.cjs */
const fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const src = fs.readFileSync(path.join(root, 'retorno-roteiro.js'), 'utf8').replace(/<\/(script)/gi, '<\\/$1');
const tag = '<script id="retorno-roteiro">\n' + src + '\n</script>';
const re = /<script id="retorno-roteiro">[\s\S]*?<\/script>/;
if (re.test(html)) html = html.replace(re, () => tag);
else { const i = html.lastIndexOf('</body>'); if (i < 0) throw Error('</body> não localizado'); html = html.slice(0, i) + tag + '\n' + html.slice(i); }
fs.writeFileSync(file, html);
console.log('Retorno ao roteiro inserido na casca.');
