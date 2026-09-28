'use strict';
/* “Nova inspeção” da drogaria e da manipulação passa a apagar também as fotos
   (e a prévia) da inspeção, via UvisSalvas.novaInspecao (inspecoes-salvas.js,
   na casca). Idempotente. Uso: node scripts/repack-apagar.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const TROCAS = {
  'app--drogaria': [
    ["else if(action==='confirmNew'){state=E.fresh();save();byId('modal').close();changeView('roteiro',1)}",
     "else if(action==='confirmNew'){state=E.fresh();save();try{await window.parent.UvisSalvas?.novaInspecao('drogaria')}catch(e){}byId('modal').close();changeView('roteiro',1)}"],
    ["<p>Exporte uma cópia do rascunho atual antes de começar outra inspeção.</p>",
     "<p>Respostas e fotos desta inspeção serão apagadas deste aparelho. Para guardá-la, use o botão Salvas (Salvar esta e começar outra) ou exporte uma cópia antes.</p>"]],
  'app--farmacia-manipulacao': [
    ['if($("#resetState"))$("#resetState").onclick=()=>{if(confirm("Iniciar nova inspeção? Os dados salvos neste navegador serão apagados.")){state=freshState();',
     'if($("#resetState"))$("#resetState").onclick=async()=>{if(confirm("Iniciar nova inspeção? Respostas e fotos desta inspeção serão apagadas deste aparelho. Para guardá-la, use o botão Salvas.")){try{await window.parent.UvisSalvas?.novaInspecao("farmacia-manipulacao")}catch(e){}state=freshState();']]
};
for (const [id, trocas] of Object.entries(TROCAS)) {
  const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação ' + id);
  for (const [de, para] of trocas) { if (app.includes(para)) continue; if (app.split(de).length !== 2) throw Error('Trecho não localizado de forma única em ' + id + ': ' + de.slice(0, 60)); app = app.replace(de, () => para); }
  const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]);
}
/* Casca: “Apagar todos os dados” (drogaria, manipulação, distribuidora) apaga também a
   galeria da drogaria, as fotos de identificação da distribuidora e a prévia. */
{ const de = "var modulo=document.documentElement.dataset.uvisApp;";
  const para = de + "try{await (window.parent.UvisSalvas&&window.parent.UvisSalvas.novaInspecao(modulo))}catch(e){}";
  if (!html.includes(para)) { if (html.split(de).length !== 2) throw Error('limpeza total da casca não localizada'); html = html.replace(de, () => para); } }
fs.writeFileSync(file, html);
console.log('Nova inspeção apaga fotos: drogaria e manipulação.');
