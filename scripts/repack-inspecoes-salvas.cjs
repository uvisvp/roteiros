'use strict';
/* Inspeções salvas: insere inspecoes-salvas.js na casca do index.html (antes de
   </body>) e expõe window.__cascaAbrirRoteiro para retomar um roteiro.
   Idempotente. Uso: node scripts/repack-inspecoes-salvas.cjs */
const fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..');
const file = path.join(root, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const src = fs.readFileSync(path.join(root, 'inspecoes-salvas.js'), 'utf8').replace(/<\/(script)/gi, '<\\/$1');
const tag = '<script id="inspecoes-salvas">\n' + src + '\n</script>';
const re = /<script id="inspecoes-salvas">[\s\S]*?<\/script>/;
if (re.test(html)) html = html.replace(re, () => tag);
else {
  const i = html.lastIndexOf('</body>');
  if (i < 0) throw Error('</body> não localizado');
  html = html.slice(0, i) + tag + '\n' + html.slice(i);
}
const ancora = 'window.__cascaVoltarDireto = voltarDoModulo;';
const hook = ancora + "\n  window.__cascaAbrirRoteiro = function(n, app, titulo, qs){ nucleoAtual = n; abrirApp(app, titulo, qs || ''); };";
if (!html.includes('window.__cascaAbrirRoteiro = function(')) {
  if (html.split(ancora).length !== 2) throw Error('âncora da casca não localizada de forma única');
  html = html.replace(ancora, () => hook);
}
const guiaDe = '<article class="guide-route"><b>Sem internet</b>';
const guia = '<article class="guide-route"><b>Inspeções salvas</b><p>Nos roteiros de Medicamentos, o botão Salvas no cabeçalho guarda a inspeção em andamento (respostas e fotos) neste aparelho e deixa o roteiro em branco para outra. Até 5 por roteiro. Para retomar, use Inspeções salvas na tela inicial ou o mesmo botão dentro do roteiro.</p></article>\n            ';
if (!html.includes('<b>Inspeções salvas</b>')) {
  if (html.split(guiaDe).length !== 2) throw Error('guia: âncora não localizada');
  html = html.replace(guiaDe, () => guia + guiaDe);
}
fs.writeFileSync(file, html);
console.log('Inspeções salvas inseridas na casca.');
