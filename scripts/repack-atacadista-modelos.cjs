'use strict';
/* Atacadista de medicamentos: documentos nos modelos oficiais da Anvisa (POP-O-SNVS-011 rev. 3,
   Anexos I, II e III; POP-O-SNVS-023 rev. 6, Anexo II) e revisão do roteiro.
   1. Injeta distribuidora-modelos.js no fim da região de documentos do bloco do aplicativo
      (entre marcadores próprios). As funções de mesmo nome declaradas ali prevalecem sobre as
      anteriores: ddAnexoIMontar, ddAnexo2Nodes, exportAnexo2, exportPeer, exportAlert, ddPrevia,
      exportFinal e ddNcTexto.
   2. Motor do Word (ddTbl, ddNodeXml, ddNodeHtml, ddPackage), por troca pontual:
      - tabela sem bordas (o.nb), cabeçalho sem sombreamento (o.hf), célula mesclada na vertical
        (c.vm) e célula sem algumas bordas (c.sb);
      - rodapé com o texto do modelo e “Página X de Y” na linha de baixo (o.rodape), ou só o
        texto (o.rodapeSo), como nos anexos publicados.
   Não usar scripts/repack-distribuidora-docs.cjs: ele reinjeta as fontes antigas e apaga as
   trocas feitas pelos outros scripts dentro da região.
   Idempotente. Uso: node scripts/repack-atacadista-modelos.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const ID = 'app--distribuidoras-transportadoras';
const INI = '/*__DIST_MODELOS_INICIO__*/', FIM = '/*__DIST_MODELOS_FIM__*/', ANCORA = '/*__DIST_DOCS_FIM__*/';
const fonte = fs.readFileSync(path.join(root, 'distribuidora-modelos.js'), 'utf8');
new Function('state', 'DATA', 'document', 'window', fonte.replace(/\ndmRoteiro\(\);[\s\S]*$/, ''));

const TROCAS = [
  /* ddTbl */
  ["const fill=c.fill||(head?'E7EEF3':'');",
   "const fill=c.fill||(head?(o.hf??'E7EEF3'):'');"],
  ["${span>1?`<w:gridSpan w:val=\"${span}\"/>`:''}${fill?",
   "${span>1?`<w:gridSpan w:val=\"${span}\"/>`:''}${c.vm?`<w:vMerge${c.vm===1?' w:val=\"restart\"':''}/>`:''}${c.sb?`<w:tcBorders>${['t','l','b','r'].filter(k=>c.sb.includes(k)).map(k=>`<w:${({t:'top',l:'left',b:'bottom',r:'right'})[k]} w:val=\"nil\"/>`).join('')}</w:tcBorders>`:''}${fill?"],
  ["map(b=>`<w:${b} w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"000000\"/>`).join('')}</w:tblBorders>",
   "map(b=>`<w:${b} w:val=\"${o.nb?'nil':'single'}\" w:sz=\"4\" w:space=\"0\" w:color=\"000000\"/>`).join('')}</w:tblBorders>"],
  /* ddNodeXml / ddNodeHtml */
  ["if(n.k==='tbl')return ddTbl(n.cols,n.rows,{head:n.head});",
   "if(n.k==='tbl')return ddTbl(n.cols,n.rows,Object.assign({head:n.head},n.o||{}));"],
  ["if(n.k==='tbl')return '<table class=\"dd-tbl\">'+",
   "if(n.k==='tbl')return '<table class=\"dd-tbl'+(n.o&&n.o.nb?' nb':'')+'\">'+"],
  /* ddPackage: rodapé */
  ["<w:p><w:pPr><w:jc w:val=\"right\"/></w:pPr>${ddRun((o.footer?o.footer+' · ':'')+'Página ',{sz:8})}${fld('PAGE')}${ddRun(' de ',{sz:8})}${fld('NUMPAGES')}</w:p></w:ftr>`;",
   "<w:p><w:pPr><w:jc w:val=\"right\"/></w:pPr>${o.rodapeSo?ddRun(o.rodapeSo,{sz:8}):(o.rodape?ddRun(o.rodape+'\\n',{sz:8})+ddRun('Página ',{sz:8,b:true}):ddRun((o.footer?o.footer+' · ':'')+'Página ',{sz:8}))+fld('PAGE')+ddRun(' de ',{sz:8})+fld('NUMPAGES')}</w:p></w:ftr>`;"]
];

let feito = false;
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== ID) return m;
  feito = true;
  const src = lz.decompressFromBase64(enc.trim());
  let s = src;
  for (const [de, para] of TROCAS) {
    if (s.includes(para)) continue;
    if (s.split(de).length !== 2) throw Error('Trecho não localizado de forma única: ' + de.slice(0, 70));
    s = s.replace(de, () => para);
  }
  const i = s.indexOf(INI), j = s.indexOf(FIM);
  if (i >= 0 && j > i) s = s.slice(0, i) + s.slice(j + FIM.length).replace(/^\n/, '');
  const k = s.indexOf(ANCORA);
  if (k < 0 || s.indexOf(ANCORA, k + 1) >= 0) throw Error('Âncora da região de documentos não localizada de forma única');
  s = s.slice(0, k) + INI + '\n' + fonte.trimEnd() + '\n' + FIM + '\n' + s.slice(k);
  if (s === src) return m;
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + ID);
  return a + novo + z;
});
if (!feito) throw Error('Bloco não localizado: ' + ID);
fs.writeFileSync(file, html);
console.log('Atacadista: documentos nos modelos da Anvisa e roteiro revisado.');
