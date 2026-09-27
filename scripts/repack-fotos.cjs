'use strict';
/* Relatório fotográfico em PDF (relatorio-fotos.js): injeta o gerador nos roteiros
   com fotos e tira as fotos do relatório Word, que passa a indicar o PDF à parte.
   Alimentos: as fotos passam a ser reduzidas antes de gravar (antes, o original de
   3 a 6 MB estourava o espaço do navegador). Idempotente.
   Manipulação e distribuidora: ver farmacia-manipulacao-v2.js e distribuidora-documentos.js.
   Uso: node scripts/repack-fotos.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const APPS = ['drogaria', 'farmacia-manipulacao', 'distribuidoras-transportadoras', 'servicos-alimentacao-roteiro', 'produtos-correlatos', 'servicos-assistenciais'];
const START = '<!--FOTOS_PDF_INICIO-->', END = '<!--FOTOS_PDF_FIM-->';
const code = fs.readFileSync(path.join(root, 'relatorio-fotos.js'), 'utf8').replace(/<\/(script)/gi, '<\\/$1');
const NOTA = "foto(s) registrada(s) na inspeção, emitida(s) em relatório fotográfico à parte (PDF), com a legenda do item do roteiro.";
const TROCAS = {
  'servicos-alimentacao-roteiro': [
    ["r.onload=function(){st.fotos=st.fotos||{};st.fotos[it.id]=r.result;try{salva();}catch(e){}bf.textContent='📷 Foto ✓';var old=linha.querySelector('.photo-thumb');if(old)old.remove();var im=el('img','photo-thumb');im.src=r.result;im.alt='Foto vinculada ao item';linha.appendChild(im);};",
     "r.onload=function(){(window.__uvsReduzFoto||function(u,cb){cb(u)})(r.result,function(url){st.fotos=st.fotos||{};var antes=st.fotos[it.id];st.fotos[it.id]=url;var ok=true;try{salva();ok=(localStorage.getItem('uvis-alimentos-estab-v1')||'').indexOf(url.slice(-40))>=0;}catch(e){ok=false}if(!ok){if(antes)st.fotos[it.id]=antes;else delete st.fotos[it.id];try{salva();}catch(e){}alert('Não há mais espaço para fotos neste roteiro, no aparelho. Emita o relatório fotográfico (botão Fotos) e remova fotos antigas, ou use as inspeções salvas.');return}bf.textContent='📷 Foto ✓';var old=linha.querySelector('.photo-thumb');if(old)old.remove();var im=el('img','photo-thumb');im.src=url;im.alt='Foto vinculada ao item';linha.appendChild(im);});};", 'foto reduzida'],
    ["vis.forEach(function(g){g.itens.forEach(function(i){if(st.fotos&&st.fotos[i.id]){blocks.push({type:'image',src:st.fotos[i.id]});blocks.push({type:'p',text:i.text})}})});",
     "/* fotos: relatório fotográfico em PDF à parte (relatorio-fotos.js) */var nFotos=0;vis.forEach(function(g){g.itens.forEach(function(i){if(st.fotos&&st.fotos[i.id])nFotos++})});if(nFotos)blocks.push({type:'p',text:'Registro fotográfico: '+nFotos+' " + NOTA + "'});", 'Word sem fotos'],
    ["function montaRelatorio() {\r\n  if (montados.rel) return; montados.rel = true;\r\n  pintaRelatorio(pRel);\r\n}",
     "function montaRelatorio() {\r\n  if (montados.rel) return; montados.rel = true;\r\n  pintaRelatorio(pRel);\r\n}\r\n/* relatório fotográfico (relatorio-fotos.js): fotos na ordem do roteiro, com a seção e a verificação */\r\nwindow.__uvsFotosItens = function () { var out = []; itensVisiveis().forEach(function (g) { g.itens.forEach(function (i) { if (st.fotos && st.fotos[i.id]) out.push({ src: st.fotos[i.id], legenda: g.secao.title + ' — ' + i.text }); }); }); return out; };\r\nwindow.__uvsFotosMeta = function () { var m = st.meta || {}, n = '', d = ''; (cfg.profile.fields || []).forEach(function (f) { var v = m[f.id]; if (!v) return; if (!n && /nome|raz|estabelec|fantasia/i.test(f.label)) n = v; if (!d && /data/i.test(f.label)) d = v; }); return { estab: n, data: d }; };", 'ganchos das fotos']
  ],
  'servicos-assistenciais': [
    ["+(photos.length?'<h3>Registro fotográfico</h3><p>As imagens abaixo estão vinculadas ao item indicado.</p><section class=\"photo-appendix\">'+photoCards+'</section>':'')",
     "+(photos.length?'<h3>Registro fotográfico</h3><p>'+photos.length+' " + NOTA + "</p>':'')", 'relatório sem fotos']
  ]
};
function troca(txt, de, para, rot) { if (txt.includes(para) || (para.includes('window.__uvsFotosItens') && txt.includes('window.__uvsFotosItens'))) return txt; if (txt.split(de).length !== 2) throw Error('Trecho não localizado: ' + rot); return txt.replace(de, () => para); }
for (const a of APPS) {
  const id = 'app--' + a;
  const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação ' + id);
  for (const [de, para, rot] of TROCAS[a] || []) app = troca(app, de, para, a + ': ' + rot);
  const i0 = app.indexOf(START); if (i0 >= 0) app = app.slice(0, i0) + app.slice(app.indexOf(END) + END.length);
  const k = app.lastIndexOf('</body>'); if (k < 0) throw Error('</body> não localizado em ' + id);
  app = app.slice(0, k) + START + '<script>' + code + '</script>' + END + app.slice(k);
  const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]);
}
/* Produtos: fotos fora da folha do relatório; ganchos para o PDF (rec--roteiro-guiado.js). */
{ const id = 'rec--roteiro-guiado.js';
  const re = new RegExp('(<script type="text/plain" id="' + id.replace(/\./g, '\\.') + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  let g = lz.decompressFromBase64(m[2]); if (!g) throw Error('descompactação ' + id);
  g = troca(g, "${items.filter(i=>itemPhotos[i._id]).map(i=>`<figure style=\"break-inside:avoid\"><img src=\"${itemPhotos[i._id]}\" style=\"max-width:100%;max-height:450px\"><figcaption>${esc(i.text)}</figcaption></figure>`).join('')}",
    "${(n=>n?`<h3>Registro fotográfico</h3><p>${n} " + NOTA + "</p>`:'')(items.filter(i=>itemPhotos[i._id]).length)}", 'produtos: relatório sem fotos');
  const de = '  function renderActive() {';
  const para = '  /* relatório fotográfico (relatorio-fotos.js) */\n' +
    '  window.__uvsFotosItens = () => allItems().filter((item) => itemPhotos[item._id]).map((item) => ({ src: itemPhotos[item._id], legenda: item._sectionTitle + \' — \' + item.text }));\n' +
    '  window.__uvsFotosMeta = () => { let n = \'\', d = \'\'; (cfg.profile.fields || []).forEach((f) => { const v = state.meta[f.id]; if (!v) return; if (!n && /nome|raz|estabelec|fantasia|empresa/i.test(f.label)) n = v; if (!d && /data/i.test(f.label)) d = v; }); return { estab: n, data: d }; };\n\n' + de;
  if (!g.includes('window.__uvsFotosItens')) { if (g.split(de).length !== 2) throw Error('renderActive não localizado'); g = g.replace(de, () => para); }
  const enc = lz.compressToBase64(g); if (lz.decompressFromBase64(enc) !== g) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]); }
fs.writeFileSync(file, html);
console.log('Relatório fotográfico em PDF injetado: ' + APPS.join(', '));
