'use strict';
// Reempacota apenas os recursos autorizados dentro do index.html integrado vigente.
// Não lê Index.html nem cria um HTML alternativo.
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..');
let {html, blocks, lz} = unpack();
function change(text, from, to) {
  if (text.includes(to)) return text;
  if (!text.includes(from)) throw Error('Trecho esperado não localizado: ' + String(from).slice(0,100));
  return text.replace(from, to);
}
let app = blocks.get('app--drogaria');
app = change(app, /function cardVisible\(id,s\)\{[^\n]+\}/.exec(app)[0], 'function cardVisible(id,s){return id>=1&&id<=8}');
app = change(app, 'setState:s=>{state=sanitizeDraft(s);save();render()}', 'setState:(s,options={})=>{state=sanitizeDraft(s);window.DrogariaReview?.sync(state);save();if(options.render!==false)render()}');
app = change(app, 'render,changeView,queryProduct,lookupEstablishment', "render,changeView,rooms,physicalChecklist,areaCard,coldCard,questions:ids=>E.instances(catalog,state).filter(x=>ids.includes(x.q.id)).map(question).join(''),queryProduct,lookupEstablishment");
app = change(app, 'const r=catalog.referencias[id],d=bank[r.arquivo]', "const r=catalog.referencias[id];if(!r){status('Referência não localizada no catálogo; enquadramento pendente de conferência.','warn');return}const d=bank[r.arquivo]");
app = change(app,"if(!confirm('Limpar os dados do card '+active+'? Os dados dos outros cards serão preservados.'))return;", "if(!confirm('Limpar os dados da seção '+active+'? As demais seções serão preservadas.'))return;window.DrogariaReview?.clearSection(state,active);");
app = change(app,"if(active===1){state.hours={};state.roomArchive=[...(state.roomArchive||[]),...state.rooms];state.rooms=[]}","if(active===1){state.hours={}}if(active===2){state.roomArchive=[...(state.roomArchive||[]),...state.rooms];state.rooms=[]}");
app = app.replace('Selecione um card','Selecione uma seção').replaceAll('Todos os cards','Todas as seções').replaceAll('no Card 1','na seção correspondente').replaceAll('Card ${active} de 8','Seção ${active} de 8');
// As setas percorrem primeiro as páginas internas das seções que possuem subitens.
app = change(app,"byId('back').onclick=()=>{save();if(tab!=='roteiro'||active)","byId('back').onclick=()=>{save();if(tab==='roteiro'&&(window.DrogariaAreaFisica?.navigate(active,-1)||window.DrogariaServicosDocumentos?.navigate(active,-1)))return;if(tab!=='roteiro'||active)");
app = change(app,"byId('next').onclick=()=>{if(tab==='roteiro'&&active)","byId('next').onclick=()=>{if(tab==='roteiro'&&(window.DrogariaAreaFisica?.navigate(active,1)||window.DrogariaServicosDocumentos?.navigate(active,1)))return;if(tab==='roteiro'&&active)");
blocks.set('app--drogaria',app);
let stock=blocks.get('app--estoque-produtos');
stock=change(stock,"bases:['dispositivos','saneantes']","bases:['dispositivos','saneantes','cosmeticos']");
stock=change(stock,"function fragmento(base,value){const n=prefixoDe(base),number=digits(value);return number.slice(0,n).padStart(n,'0')}","function fragmento(base,value){const n=prefixoDe(base),number=digits(value);return base==='cosmeticos'?number.slice(5,5+n):number.slice(0,n).padStart(n,'0')}");
stock=change(stock,'group.regs.has(digits(item.registro))&&digits(item.processo)===processo','group.regs.has(digits(group.base===\'cosmeticos\'?item.processo:item.registro))&&digits(item.processo)===processo');
stock=change(stock,'mesmoRegistro(item.registro,registro)',"base!=='cosmeticos'&&mesmoRegistro(item.registro,registro)");
stock=change(stock,"if(registro)result.items=await byRegistration(registro);\n    else if(processo){if(processo.length<12)throw new Error('Digite o processo completo.');result=await byProcess(processo)}", "if(processo){if(processo.length<12)throw new Error('Digite o processo completo.');result=await byProcess(processo)}\n    else if(registro)result.items=await byRegistration(registro);");
blocks.set('app--estoque-produtos',stock);
html=change(html,'if(b.dataset.tab==="achados")b.textContent="Infrações";if(b.dataset.tab==="relatorio")b.textContent="Relatório";', 'if(b.dataset.tab==="achados"&&b.textContent!=="Infrações")b.textContent="Infrações";if(b.dataset.tab==="relatorio"&&b.textContent!=="Relatório")b.textContent="Relatório";');
html=html.replaceAll('html[data-uvis-app="drogaria"] header','html[data-uvis-app="drogaria"] body>header');
html=change(html,'var h=document.querySelector("header");if(h&&h.textContent', 'var h=document.querySelector("body>header");if(h&&h.textContent');
const reviewScript="      try{cab += '<scr'+'ipt>'+rec('rec--drogaria-review.js')+'</scr'+'ipt>';}catch(e){}\n";
if(!html.includes("rec('rec--drogaria-review.js')"))html=html.replace("      try{cab += '<scr'+'ipt>'+rec('rec--drogaria-section1.js')",reviewScript+"      try{cab += '<scr'+'ipt>'+rec('rec--drogaria-section1.js')");
const finalReportScript="      try{cab += '<scr'+'ipt>'+rec('rec--drogaria-report-final.js')+'</scr'+'ipt>';}catch(e){}\n";
if(!html.includes("rec('rec--drogaria-report-final.js')")){
  const anchor="      try{cab += '<scr'+'ipt>'+rec('rec--drogaria-final-bridge.js')+'</scr'+'ipt>';}catch(e){}";
  if(!html.includes(anchor))throw Error('Loader do final bridge da Drogaria não localizado.');
  html=html.replace(anchor,anchor+'\n'+finalReportScript.trimEnd());
}
for(const name of ['drogaria-ocr-tools','drogaria-review','drogaria-section1','drogaria-area-fisica','drogaria-servicos-documentos','drogaria-final-bridge','drogaria-report-final'])blocks.set('rec--'+name+'.js',fs.readFileSync(path.join(root,name+'.js'),'utf8'));
for(const [id,source] of blocks) {
  const re=new RegExp('(<script type="text/plain" id="'+id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'">)[\\s\\S]*?(</script>)');
  let old=html.match(re);
  if(!old){
    if(!['rec--drogaria-review.js','rec--drogaria-report-final.js'].includes(id))throw Error(id);
    html=html.replace('</html>','<script type="text/plain" id="'+id+'"></script>\n</html>');old=html.match(re);
  }
  const encoded=lz.compressToBase64(source);
  if(lz.decompressFromBase64(encoded)!==source)throw Error('Falha de round-trip '+id);
  html=html.replace(re,()=>old[1]+encoded+old[2]);
}
fs.writeFileSync(path.join(root,'index.html'),html);
console.log('Blocos reempacotados no index.html vigente; demais módulos preservados.');
