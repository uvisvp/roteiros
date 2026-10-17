/* Relatórios em preto e branco, sem faixas, títulos em negrito (pedido de
   17/10/2026, vale para todos os roteiros). Atua na hora de gerar o arquivo,
   sem mexer em cada módulo:
   - Word (.docx) montado com JSZip: antes de gerar, o XML do documento, dos
     cabeçalhos/rodapés e dos estilos perde sombreamentos (faixas e células
     coloridas) e realces; toda cor de texto e de borda vira preta; bordas de
     parágrafo grossas (barras) ficam finas; estilos de título ganham negrito;
   - geradores próprios de .docx (distribuidora): o mesmo tratamento no XML
     que passa por TextEncoder;
   - Word em HTML (.doc) e páginas de impressão/PDF: estilo que força texto
     preto, fundo branco e títulos em negrito.
   Cópia igual em roteiros/campo/relatorio-pb.js e medicamentos/modulos/relatorio-pb.js. */
(function(){
 if(window.__uvsRelPB) return; window.__uvsRelPB = true;
 function xml(x){
  return String(x)
   .replace(/<w:shd\b[^>]*\/>/g, '')
   .replace(/<w:highlight\b[^>]*\/>/g, '')
   .replace(/<w:color\b[^>]*\/>/g, '<w:color w:val="000000"/>')
   .replace(/\sw:(?:themeColor|themeShade|themeTint|themeFill|themeFillShade|themeFillTint)="[^"]*"/g, '')
   .replace(/(<w:(?:top|left|bottom|right|start|end|insideH|insideV|between|bar)\b[^>]*?\sw:color=")[^"]*"/g, '$1000000"')
   .replace(/<w:pBdr>[\s\S]*?<\/w:pBdr>/g, function(b){ return b.replace(/\sw:sz="(\d+)"/g, function(m, n){ return ' w:sz="' + Math.min(+n, 6) + '"'; }); });
 }
 /* estilos de título (Heading, Title, Titulo…): negrito */
 function estilos(x){
  return xml(x).replace(/<w:style\b[^>]*w:type="paragraph"[^>]*>[\s\S]*?<\/w:style>/g, function(s){
   if(!/w:styleId="[^"]*(Heading|Ttulo|Titulo|Title|Subtitle)/i.test(s) || /<w:b\/>|<w:b /.test(s)) return s;
   return /<w:rPr>/.test(s) ? s.replace('<w:rPr>', '<w:rPr><w:b/>') : s.replace('</w:style>', '<w:rPr><w:b/></w:rPr></w:style>');
  });
 }
 function docx(zip){
  var nomes = Object.keys(zip.files || {}).filter(function(n){ return /^word\/(document|header\d*|footer\d*|styles)\.xml$/.test(n); });
  if(!nomes.length || !zip.file('word/document.xml')) return Promise.resolve();
  return Promise.all(nomes.map(function(n){ return zip.file(n).async('string').then(function(t){ zip.file(n, n === 'word/styles.xml' ? estilos(t) : xml(t)); }); }));
 }
 function embrulhaZip(){
  var Z = window.JSZip; if(!Z || !Z.prototype || Z.prototype.generateAsync.__pb) return;
  var g = Z.prototype.generateAsync;
  Z.prototype.generateAsync = function(){ var z = this, a = arguments; return docx(z).then(function(){ return g.apply(z, a); }, function(){ return g.apply(z, a); }); };
  Z.prototype.generateAsync.__pb = true;
 }
 /* geradores próprios de .docx (distribuidora): o XML passa por TextEncoder */
 var TE = window.TextEncoder && TextEncoder.prototype;
 if(TE && !TE.encode.__pb){
  var enc = TE.encode;
  TE.encode = function(t){
   if(typeof t === 'string' && t.indexOf('<?xml') === 0 && t.indexOf('wordprocessingml') > 0){
    if(/<w:styles\b/.test(t)) t = estilos(t); else if(/<w:(document|hdr|ftr)\b/.test(t)) t = xml(t);
   }
   return enc.call(this, t);
  };
  TE.encode.__pb = true;
 }
 var CSS = 'body,p,div,span,td,th,li,h1,h2,h3,h4,h5,h6,table,tr,caption,b,strong,em,small,a{color:#000 !important;background:#fff !important;background-color:#fff !important;text-shadow:none !important;box-shadow:none !important}'
  + 'table,td,th,tr{border-color:#000 !important}h1,h2,h3,h4,h5,h6,th,caption{font-weight:bold !important}';
 /* Word em HTML: cores e fundos inline saem; o estilo acima entra no <head> */
 function html(t){
  t = t.replace(/\sbgcolor="[^"]*"/gi, '')
   .replace(/(style="[^"]*?)background(?:-color)?\s*:[^;"]*;?/gi, '$1')
   .replace(/((?:style="|;)\s*)color\s*:\s*[^;"]*/gi, '$1color:#000')
   .replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, function(m, a, c, b){ return a + c.replace(/background(?:-color)?\s*:[^;}]*;?/gi, '').replace(/([;{\s])color\s*:\s*[^;}]*/gi, '$1color:#000') + b; });
  var s = '<style>' + CSS + '</style>';
  return /<\/head>/i.test(t) ? t.replace(/<\/head>/i, s + '</head>') : s + t;
 }
 var B = window.Blob;
 if(B && !B.__pb){
  var N = function(partes, op){
   var tipo = String(op && op.type || '');
   if(Array.isArray(partes) && (/msword|text\/html/.test(tipo)) && partes.some(function(p){ return typeof p === 'string' && /urn:schemas-microsoft-com:office:word|<html/i.test(p) && /msword/.test(tipo); }))
    partes = partes.map(function(p){ return typeof p === 'string' && /<html|<body|<\/head>/i.test(p) ? html(p) : p; });
   return new B(partes, op);
  };
  N.prototype = B.prototype; N.__pb = true;
  try { window.Blob = N; } catch(e){}
 }
 /* impressão / Salvar como PDF */
 var st = document.createElement('style'); st.media = 'print';
 st.textContent = CSS.replace(/#fff !important;background-color:#fff/g, 'transparent !important;background-color:transparent') + '*{-webkit-print-color-adjust:economy !important;print-color-adjust:economy !important}';
 (document.head || document.documentElement).appendChild(st);
 embrulhaZip();
 document.addEventListener('pointerdown', embrulhaZip, true);
 document.addEventListener('click', embrulhaZip, true);
 window.__uvsRelPBXml = xml;
})();
