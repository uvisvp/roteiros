/* ——— Documentos do POP-O-SNVS-011 rev. 3 (Distribuidora / transportadora) ———
   Anexo I  — Relatório de inspeção: prévia a qualquer momento e versão final
              única (Anexo I + análise do plano de ação + registro fotográfico).
   Anexo II — Formulário de Comunicação de Não Conformidades, entregue à
              empresa ao fim da inspeção. Sem análise do plano e sem valores
              marcados por padrão: situação e estratégia são escolhas da equipe.
   Análise do plano de ação — documento Word próprio; na versão final entra
              como Anexo A do relatório.
   Injetado no módulo antes de distInstall() por scripts/repack-distribuidora-docs.cjs.
   Declarações de função com o mesmo nome substituem as do módulo. */

/* ---------- Word (OOXML) com cabeçalho, rodapé, tabelas e fotos ---------- */
function ddX(s){return String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function ddRun(t,o={}){const rpr=`<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>${o.b?'<w:b/>':''}${o.i?'<w:i/>':''}${o.color?`<w:color w:val="${o.color}"/>`:''}<w:sz w:val="${Math.round((o.sz||10)*2)}"/><w:szCs w:val="${Math.round((o.sz||10)*2)}"/></w:rPr>`;return String(t??'').split('\n').map((l,i)=>`<w:r>${rpr}${i?'<w:br/>':''}<w:t xml:space="preserve">${ddX(l)}</w:t></w:r>`).join('')}
function ddP(runs,o={}){const r=Array.isArray(runs)?runs.map(x=>typeof x==='string'?ddRun(x,o):ddRun(x[0],Object.assign({},o,x[1]))).join(''):ddRun(runs,o);return `<w:p><w:pPr>${o.keep?'<w:keepNext/>':''}${o.pb?'<w:pageBreakBefore/>':''}<w:spacing w:before="${o.before||0}" w:after="${o.after??100}" w:line="${o.line||264}" w:lineRule="auto"/>${o.ind?`<w:ind w:left="${o.ind}"/>`:''}<w:jc w:val="${o.al||'both'}"/></w:pPr>${r}</w:p>`}
function ddTbl(cols,rows,o={}){const tot=cols.reduce((a,b)=>a+b,0);const tr=rows.map((r,ri)=>{let ci=0;const head=o.head&&ri===0;return `<w:tr><w:trPr><w:cantSplit/>${head?'<w:tblHeader/>':''}</w:trPr>${r.map(c=>{c=c&&typeof c==='object'?c:{t:c};const span=c.span||1,w=cols.slice(ci,ci+span).reduce((a,b)=>a+b,0);ci+=span;const fill=c.fill||(head?'E7EEF3':'');return `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${span>1?`<w:gridSpan w:val="${span}"/>`:''}${fill?`<w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>`:''}</w:tcPr>${c.xml||ddP(c.runs||c.t,{sz:c.sz||9,b:c.b||head,al:c.al||'left',after:40})}</w:tc>`}).join('')}</w:tr>`}).join('');return `<w:tbl><w:tblPr><w:tblW w:w="${tot}" w:type="dxa"/><w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(b=>`<w:${b} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join('')}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${cols.map(c=>`<w:gridCol w:w="${c}"/>`).join('')}</w:tblGrid>${tr}</w:tbl>${ddP('',{after:60,sz:4})}`}
function ddB64(dataUrl){const b=atob(String(dataUrl).split(',')[1]||''),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
function ddImgXml(ctx,f,cm){const n=ctx.media.length+1;ctx.media.push({name:'image'+n+'.jpeg',bytes:ddB64(f.url)});let cx=Math.round(cm*360000),cy=Math.round(cx*f.h/f.w);const maxY=Math.round(cm*1.25*360000);if(cy>maxY){cx=Math.round(cx*maxY/cy);cy=maxY}return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="Foto ${n}"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${n}" name="image${n}.jpeg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdM${n}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`}
function ddPackage(body,o={}){
 const W='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
 const media=o.media||[],hdr=o.header||'',fld=(c)=>`<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:instrText xml:space="preserve"> ${c} </w:instrText></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="16"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>`;
 const header=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${W}>${hdr?ddP(hdr,{sz:8,al:'right',color:o.headerColor||'555555',after:0}):ddP('',{sz:8,after:0})}</w:hdr>`;
 const footer=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${W}><w:p><w:pPr><w:jc w:val="right"/></w:pPr>${ddRun((o.footer?o.footer+' · ':'')+'Página ',{sz:8})}${fld('PAGE')}${ddRun(' de ',{sz:8})}${fld('NUMPAGES')}</w:p></w:ftr>`;
 const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body>${body}<w:sectPr><w:headerReference w:type="default" r:id="rIdH"/><w:footerReference w:type="default" r:id="rIdF"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1418" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>`;
 const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>`;
 const ct=`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`;
 const rels=`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
 const drels=`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdH" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdF" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${media.map((m,i)=>`<Relationship Id="rIdM${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${m.name}"/>`).join('')}</Relationships>`;
 return zip([{nome:'[Content_Types].xml',dados:txt2u8(ct)},{nome:'_rels/.rels',dados:txt2u8(rels)},{nome:'word/document.xml',dados:txt2u8(doc)},{nome:'word/_rels/document.xml.rels',dados:txt2u8(drels)},{nome:'word/styles.xml',dados:txt2u8(styles)},{nome:'word/header1.xml',dados:txt2u8(header)},{nome:'word/footer1.xml',dados:txt2u8(footer)}].concat(media.map(m=>({nome:'word/media/'+m.name,dados:m.bytes}))));
}
function ddBaixar(bytes,name){const blob=new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);window.__ddUltimo={name,size:bytes.length,bytes}}

/* ---------- Documento em nós: um único conteúdo, saída em Word e em tela ---------- */
function ddDocx(nodes,o={}){const ctx={media:[]};const body=nodes.map(n=>ddNodeXml(n,ctx)).join('');return ddPackage(body,Object.assign({},o,{media:ctx.media}))}
function ddRunsOf(n){return n.runs||[[n.t||'',{}]]}
function ddNodeXml(n,ctx){
 if(n.k==='org')return ddP(n.t,{b:true,sz:11,al:'center',after:40});
 if(n.k==='title')return ddP(n.t,{b:true,sz:14,al:'center',before:160,after:160,pb:n.pb});
 if(n.k==='sub')return ddP(n.t,{sz:10,al:n.al||'left',after:n.after??60,b:n.b});
 if(n.k==='h1')return ddP((n.n?n.n+'. ':'')+n.t.toUpperCase(),{b:true,sz:11,al:'left',before:220,after:100,keep:true});
 if(n.k==='h2')return ddP((n.n?n.n+' ':'')+n.t,{b:true,sz:10,al:'left',before:140,after:80,keep:true});
 if(n.k==='p')return ddP(ddRunsOf(n),{sz:10,al:n.al||'both',i:n.i,ind:n.ind,after:n.after});
 if(n.k==='checks')return n.items.map(it=>ddP((it[1]?'☒ ':'☐ ')+it[0],{sz:10,al:'left',after:30,ind:it[2]?720:360})).join('');
 if(n.k==='tbl')return ddTbl(n.cols,n.rows,{head:n.head});
 if(n.k==='pb')return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
 if(n.k==='photos'){const rows=[];for(let i=0;i<n.list.length;i+=2){const par=n.list.slice(i,i+2);rows.push(par.map(f=>({xml:`<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="40"/></w:pPr>${ddImgXml(ctx,f,7.6)}</w:p>`+ddP('Foto '+f.num+' — '+f.cap,{sz:8,al:'left',after:40})})).concat(par.length<2?[{t:''}]:[]))}return rows.length?ddTbl([4677,4677],rows):''}
 return '';
}
function ddNodeHtml(n){
 const e=esc,runs=x=>ddRunsOf(x).map(r=>{const t=e(r[0]).replace(/\n/g,'<br>');return r[1]&&r[1].b?'<b>'+t+'</b>':r[1]&&r[1].i?'<i>'+t+'</i>':t}).join('');
 if(n.k==='org')return '<p class="dd-org">'+e(n.t)+'</p>';
 if(n.k==='title')return (n.pb?'<hr class="dd-pb">':'')+'<h2 class="dd-title">'+e(n.t)+'</h2>';
 if(n.k==='sub')return '<p class="dd-sub'+(n.al==='center'?' c':'')+'">'+(n.b?'<b>'+e(n.t)+'</b>':e(n.t))+'</p>';
 if(n.k==='h1')return '<h3 class="dd-h1">'+e((n.n?n.n+'. ':'')+n.t.toUpperCase())+'</h3>';
 if(n.k==='h2')return '<h4 class="dd-h2">'+e((n.n?n.n+' ':'')+n.t)+'</h4>';
 if(n.k==='p')return '<p class="dd-p'+(n.i?' i':'')+'">'+runs(n)+'</p>';
 if(n.k==='checks')return '<div class="dd-checks">'+n.items.map(it=>'<div'+(it[2]?' class="in"':'')+'>'+(it[1]?'☒ ':'☐ ')+e(it[0])+'</div>').join('')+'</div>';
 if(n.k==='tbl')return '<table class="dd-tbl">'+n.rows.map((r,ri)=>'<tr>'+r.map(c=>{c=c&&typeof c==='object'?c:{t:c};const tag=n.head&&ri===0?'th':'td';return '<'+tag+(c.span?' colspan="'+c.span+'"':'')+'>'+(c.runs?runs(c):e(c.t).replace(/\n/g,'<br>'))+'</'+tag+'>'}).join('')+'</tr>').join('')+'</table>';
 if(n.k==='pb')return '<hr class="dd-pb">';
 if(n.k==='photos')return '<div class="dd-photos">'+n.list.map(f=>'<figure><img src="'+f.url+'" alt=""><figcaption>Foto '+f.num+' — '+e(f.cap)+'</figcaption></figure>').join('')+'</div>';
 return '';
}
function ddNodeText(n){
 const r=x=>ddRunsOf(x).map(y=>y[0]).join('');
 if(n.k==='h1')return '\n'+(n.n?n.n+'. ':'')+n.t.toUpperCase();
 if(n.k==='h2')return '\n'+(n.n?n.n+' ':'')+n.t;
 if(['org','title','sub'].includes(n.k))return n.t;
 if(n.k==='p')return r(n);
 if(n.k==='checks')return n.items.map(it=>(it[2]?'   ':'')+(it[1]?'☒ ':'☐ ')+it[0]).join('\n');
 if(n.k==='tbl')return n.rows.map(row=>row.map(c=>c&&typeof c==='object'?(c.runs?r(c):c.t):c).join(' | ')).join('\n');
 if(n.k==='photos')return n.list.map(f=>'Foto '+f.num+' — '+f.cap).join('\n');
 return '';
}
function ddModal(title,nodes,avisos){byId('modalTitle').textContent=title;byId('modalBody').innerHTML=(avisos&&avisos.length?'<div class="note danger dd-avisos"><b>Pendências antes de emitir</b><ul>'+avisos.map(a=>'<li>'+esc(a)+'</li>').join('')+'</ul></div>':'')+'<div class="dd-doc">'+nodes.map(ddNodeHtml).join('')+'</div>';byId('modal').showModal()}

/* ---------- Utilitários de texto ---------- */
const DD_MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
function ddData(v){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(v||''));return m?m[3]+'/'+m[2]+'/'+m[1]:String(v||'')}
function ddExtenso(v){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(v||''));const d=m?new Date(+m[1],+m[2]-1,+m[3]):new Date();return d.getDate()+' de '+DD_MESES[d.getMonth()]+' de '+d.getFullYear()}
function ddPeriodo(a,b){a=ddData(a);b=ddData(b);return a&&b?a+' a '+b:(a||b||'')}
function ddTem(v){return !!String(v??'').trim()}
function ddLista(v){return String(v||'').split('|').filter(Boolean)}
function ddParas(t){return String(t||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean)}
function ddFim(t){t=String(t||'').trim();return !t?'':/[.!?:;)]$/.test(t)?t:t+'.'}
function ddCap(t){t=String(t||'').trim();return t.charAt(0).toUpperCase()+t.slice(1)}
function ddLc(t){t=String(t||'');return /^[A-ZÀ-Ú][a-zà-ú]/.test(t)?t.charAt(0).toLowerCase()+t.slice(1):t}
function ddJoin(a){return a.length>1?a.slice(0,-1).join(', ')+' e '+a[a.length-1]:a[0]||''}

/* ---------- Estrutura do Anexo I e roteamento das seções do roteiro ---------- */
const DD_ITENS={
 '7':['terceirizacao'],'8':['pessoal'],
 '9.1':['recebimento'],'9.2':['armazenamento','termolabeis','qt-area','qt-equip','insumos_gerais','insumos_ifa'],'9.3':['expedicao'],
 '10':['transporte'],'10.1':['qt-veiculo','qt-rota'],
 '11':['sgq'],'11.1':['documentacao'],'11.2':['fornecedores','ifa-rastreabilidade'],'11.3':['recolhimento'],'11.4':['autoinspecao'],'11.5':['residuos'],'11.6':['desvios'],'11.7':['reclamacoes'],'11.8':['sistemas','qualificacao-sistemas'],'11.9':['controlados'],
 '12.1':['cq_instalacoes'],'12.2':['cq_atividades'],'12.3':['cq_padroes'],'12.4':['cq_oos'],'12.5':['cq_liberacao']
};
/* Perguntas que o modelo rev. 3 descreve em outro item. */
const DD_ROTA={'q189':'9.1','dist-id-licenca':'1','dist-id-afe':'2','dist-id-ae':'2','q291':'10.1','q292':'10.1','q293':'10.1','q294':'10.1','q295':'10.1','t64-p3':'10.1'};
const DD_ORDEM=['1','2','7','8','9.1','9.2','9.3','10','10.1','11','11.1','11.2','11.3','11.4','11.5','11.6','11.7','11.8','11.9','12.1','12.2','12.3','12.4','12.5'];
const DD_TIT={'7':'Terceirização e prestação de serviços','7.1':'Qualificação do prestador de serviço','8':'Pessoal','8.1':'Higiene pessoal e saúde do trabalhador','9':'Áreas físicas','9.1':'Recepção','9.2':'Armazenamento','9.3':'Expedição','10':'Transporte','10.1':'Qualificação de transporte','11':'Sistema de gestão da qualidade','11.1':'Gerenciamento das documentações','11.2':'Cadastro de fornecedores e clientes','11.3':'Recolhimento e devolução','11.4':'Autoinspeção','11.5':'Gerenciamento de resíduos','11.6':'Sistema de investigação de desvios e controle de ações corretivas','11.7':'Gerenciamento de reclamações','11.8':'Sistemas computadorizados','11.9':'Mecanismos de gerenciamento de medicamentos sujeitos ao controle especial','12':'Controle de qualidade','12.1':'Instalações','12.2':'Atividades','12.3':'Padrões de referência e especificações','12.4':'Investigação de resultados fora de especificação','12.5':'Liberação de lotes'};
/* Frase afirmativa quando a leitura direta da pergunta inverteria o sentido. */
const DD_POS={
 q272:'O transportador fornece todos os dados de monitoramento ao contratante',
 q273:'O transportador provê acesso restrito à carga durante o transporte',
 q274:'O transportador recebe e entrega medicamentos apenas para empresas autorizadas',
 q288:'O transporte de outras categorias de produtos (não medicamentos) não interfere na qualidade dos medicamentos',
 q388:'As áreas dos laboratórios (físico-químico e microbiológico) são separadas e independentes'
};
function ddSec(id){return DATA.sections.find(x=>x.id===id)}
function ddItemDe(secId,qId){if(DD_ROTA[qId])return DD_ROTA[qId];for(const k of DD_ORDEM)if((DD_ITENS[k]||[]).includes(secId))return k;return secId==='dist-identificacao-preparacao'?'1':'11'}
function ddPerguntas(item){const out=[];for(const sec of DATA.sections)for(const q of sec.questions)if(ddItemDe(sec.id,q.id)===item)out.push({sec,q});return out}
function ddAfirma(q){if(DD_POS[q.id])return DD_POS[q.id]+'.';let t=String(q.text||'').trim().replace(/\?\s*(\([^)]*\))\s*$/,' $1?').replace(/\?\s*$/,'').replace(/^[a-z]\)\s*/,'');return ddCap(t)+'.'}
function ddEscopo(q){const v=typeof distEscopoValor==='function'?distEscopoValor(q.id):'';const t=String(q.text||'').replace(/\?\s*$/,'').trim();if(v==='sim')return ddCap(t)+'.';if(v==='nao')return 'Não '+ddLc(t.replace(/^Existe\b/,'existe').replace(/^Há\b/,'há'))+'.';return ''}

/* Numeração das NC: a mesma do Anexo II (ordem de allNCs). */
function ddNcMapa(){const ncs=allNCs(),map={};ncs.forEach((n,i)=>{map[n.id]={num:i+1,n,head:true};(n.members||[]).forEach(m=>{if(m!==n.id)map[m]={num:i+1,n,head:false}})});return {ncs,map}}
function ddNcTexto(d){let t=String(d.text||'').trim(),ev=String(d.evidence||'').trim();if(t.includes('«evidência»')){t=t.replace('«evidência»',ev||'evidência não registrada');ev=''}t=ddFim(t);if(ev)t+=' Evidência: '+ddFim(ev.replace(/\s*\n\s*/g,'; '));if(d.legal&&!t.includes(String(d.legal).trim()))t=t.replace(/\.$/,'')+' ('+String(d.legal).trim().replace(/\.$/,'')+').';return t}
function ddNcPara(k,n,ref){const d=ncData(n);let t=ddNcTexto(d);if(ref)t=t.replace(/\.$/,'')+ref+'.';return {k:'p',runs:[['Não conformidade nº '+k+(d.category?' — '+d.category.toLowerCase():'')+': ',{b:true}],[t,{}]]}}

/* Parágrafos de um item: texto manual da seção (se houver) ou rascunho das respostas
   Cumpre; as NCs saem sempre, numeradas como no Anexo II. */
function ddItemNodes(item,ctx){
 const nodes=[],porSec=new Map();for(const x of ddPerguntas(item)){if(!porSec.has(x.sec.id))porSec.set(x.sec.id,[]);porSec.get(x.sec.id).push(x.q)}
 const principal=(DD_ITENS[item]||[])[0];let houve=false,todasNA=true,alguma=false;
 for(const [sid,qs] of porSec){const sec=ddSec(sid),manual=String(state.narratives[sid]||'').trim(),frases=[],ncs=[];
  for(const q of qs){const a=state.answers[q.id]||{};
   if(q.escopo){const t=ddEscopo(q);if(t){frases.push(t);alguma=true;todasNA=false}continue}
   if(a.status)alguma=true;if(a.status&&a.status!=='NA')todasNA=false;
   const fotos=ctx.fotosQ[q.id]||[],ref=fotos.length?' ('+(fotos.length>1?'fotos ':'foto ')+ddJoin(fotos.map(String))+')':'';
   if(a.status==='C'){let f=ddAfirma(q),ev=String(a.evidence||'').trim().replace(/\s*\n\s*/g,'; ');if(ev&&ev.length<=180)f=f.replace(/\.$/,'')+' ('+ev.replace(/\.$/,'')+').';else if(ev)f+=' '+ddFim('Constatação: '+ev);frases.push(f.replace(/\.$/,'')+ref+'.')}
   else if(a.status==='NC'){const m=ctx.nc.map[q.id];if(m&&m.head){ncs.push(ddNcPara(m.num,m.n,ref));ctx.ncUsadas.add(m.num)}else if(m)ncs.push({k:'p',t:'Ver não conformidade nº '+m.num+'.'})}}
  const lead=sid!==principal&&(DD_ITENS[item]||[]).includes(sid)&&porSec.size>1&&sec?[[sec.title+'. ',{b:true}]]:[];
  const corpo=manual?ddParas(manual):frases.length?[frases.join(' ')]:[];
  corpo.forEach((t,i)=>nodes.push({k:'p',runs:(i===0?lead:[]).concat([[t,{}]])}));
  if(!corpo.length&&ncs.length&&lead.length)nodes.push({k:'p',runs:lead});
  nodes.push(...ncs);if(corpo.length||ncs.length)houve=true;
 }
 return {nodes,houve,todasNA:alguma&&todasNA};
}
function ddVazio(item,r){if(r.todasNA)return 'Não se aplica.';if(/^12/.test(item)&&!(state.meta.activities||[]).includes('Importar'))return 'Não se aplica: o estabelecimento não realiza importação.';if(item==='7'||item==='7.1')return 'Não aplicável.';return 'Não avaliado nesta inspeção.'}

/* ---------- Fotos: redução para o documento e legenda pela pergunta ---------- */
function ddReduz(url){return new Promise(res=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1000/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*k));c.height=Math.max(1,Math.round(im.naturalHeight*k));const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);res({url:c.toDataURL('image/jpeg',.65),w:c.width,h:c.height})};im.onerror=()=>res(null);im.src=url})}
async function ddFotos(){
 const brutas=[];if(window.RoteiroEvidence)for(let c=1;c<=DIST_CARDS.length;c++){try{const all=await RoteiroEvidence.read('dist-card-'+c);for(const [k,url] of Object.entries(all||{}))brutas.push({key:k,qid:String(k).split('::')[0],url})}catch(e){}}
 const lugar={};DATA.sections.forEach(sec=>sec.questions.forEach(q=>{lugar[q.id]={sec,q,item:ddItemDe(sec.id,q.id)}}));
 const ordem=q=>{const l=lugar[q];if(!l)return 9999;const i=DD_ORDEM.indexOf(l.item);return (i<0?99:i)*1000+DATA.sections.indexOf(l.sec)*10+l.sec.questions.indexOf(l.q)/100};
 brutas.sort((a,b)=>ordem(a.qid)-ordem(b.qid)||String(a.key).localeCompare(String(b.key)));
 const list=[],fotosQ={};for(const b of brutas){const r=await ddReduz(b.url);if(!r)continue;const l=lugar[b.qid],num=list.length+1;const tit=l?(l.item+' '+(DD_TIT[l.item]||l.sec.title)):'Registro da inspeção';list.push(Object.assign(r,{num,cap:tit+' · '+(l?String(l.q.text).replace(/\?\s*$/,''):b.qid)}));(fotosQ[b.qid]=fotosQ[b.qid]||[]).push(num)}
 return {list,fotosQ};
}

/* ---------- Anexo I ---------- */
function ddCab(nodes,titulo){const m=state.meta;if(ddTem(m.organ))nodes.push({k:'org',t:m.organ});nodes.push({k:'title',t:titulo});nodes.push({k:'sub',t:'Estabelecimento: '+(m.company||''),b:true});nodes.push({k:'sub',t:(m.city||'São Paulo')+', '+ddExtenso(state.report.date)+'.',after:160})}
function ddEquipeRows(){return (state.meta.team||[]).filter(x=>x&&ddTem(x.name))}
async function ddAnexoI(o={}){return ddAnexoIMontar(o,o.fotos||await ddFotos())}
function ddAnexoIMontar(o,fotos){
 const m=state.meta,R=state.report||{},D=state.distDocs||{},nodes=[],nc=ddNcMapa(),ctx={nc,fotosQ:fotos.fotosQ,ncUsadas:new Set()};
 ddCab(nodes,'RELATÓRIO DE INSPEÇÃO');
 const it=(n,t)=>nodes.push({k:'h1',n,t}),sub=(n,t)=>nodes.push({k:'h2',n,t}),p=t=>nodes.push({k:'p',t}),kv=(k,v)=>nodes.push({k:'p',runs:[[k+': ',{b:true}],[String(v||'').trim()||'—',{}]]});
 const blocoItem=(item)=>{const r=ddItemNodes(item,ctx);if(r.houve)nodes.push(...r.nodes);else p(ddVazio(item,r));return r};
 /* 1 */
 it(1,'Identificação do estabelecimento');
 kv('Nome fantasia',m.fantasy);kv('Razão social',m.company);
 nodes.push({k:'p',runs:[['CNPJ: ',{b:true}],[(m.cnpj||'—')+'   '+(m.unit==='Matriz'?'☒':'☐')+' Matriz   '+(m.unit==='Filial'?'☒':'☐')+' Filial',{}]]});
 kv('Endereço',m.address);kv('Fone',m.phone);kv('E-mail',m.email);kv('Responsável legal / CPF',m.legal);kv('Responsável técnico / CRF/UF',[m.rt,m.rtAlternate&&('substituto(s): '+m.rtAlternate)].filter(Boolean).join('; '));
 const lic=D.lic||{},semLic=R.licSituacao==='Não possui licença';
 nodes.push({k:'p',runs:[['Licença de Funcionamento nº ',{b:true}],[(semLic?'—':(lic.number||m.license||'—')),{}],['   Data: ',{b:true}],[semLic?'—':(ddData(lic.date)||'—'),{}],['   '+(semLic?'☒':'☐')+' Não possui Licença.',{}]]});
 const la=ddLista(R.licAct);nodes.push({k:'p',runs:[['Atividades licenciadas:',{b:true}]]});
 const ck=a=>(la.includes(a)?'☒ ':'☐ ')+a;nodes.push({k:'p',ind:360,after:30,t:[ck('Distribuir'),ck('Importar'),ck('Expedir')].join('     ')},{k:'p',ind:360,after:30,t:ck('Transportar')+'  ('+ck('Transporte próprio')+'   '+ck('Transporte para terceiros')+')'},{k:'p',ind:360,t:ck('Armazenar')+'  ('+ck('Armazenamento próprio')+'   '+ck('Armazenamento para terceiros')+')'});
 kv('Relação dos demais estabelecimentos',m.otherUnits||'Não se aplica');kv('Documentos anexos',R.docsAnexos||'Não há.');
 const r1=ddItemNodes('1',ctx);if(r1.houve)nodes.push(...r1.nodes);
 /* 2 */
 it(2,'Dados da autorização de funcionamento');
 const af=D.afe||{},ae=D.ae||{},acts=['Distribuir','Transportar','Importar','Armazenar','Expedir'];
 nodes.push({k:'p',runs:[['Autorização de Funcionamento nº ',{b:true}],[af.status==='Não possui'?'não possui':(af.number||'—'),{}],[' publicada em ',{b:true}],[ddData(af.publicationDate)||'—',{}],[R.afeRe?' (RE nº '+R.afeRe+')':'',{}],['.',{}]]});
 nodes.push({k:'p',runs:[['Atividades: ',{b:true}],[acts.map(a=>(ddLista(R.afeAct).includes(a)?'☒ ':'☐ ')+a).join('   '),{}]]});
 nodes.push({k:'p',runs:[['Autorização Especial nº ',{b:true}],[ae.status==='Não possui'?'não possui':ae.status==='Não se aplica'?'não se aplica':(ae.number||'—'),{}],[' publicada em ',{b:true}],[ddData(ae.publicationDate)||'—',{}],[R.aeRe?' (RE nº '+R.aeRe+')':'',{}],['.',{}]]});
 nodes.push({k:'p',runs:[['Atividades: ',{b:true}],[acts.map(a=>(ddLista(R.aeAct).includes(a)?'☒ ':'☐ ')+a).join('   '),{}]]});
 const r2=ddItemNodes('2',ctx);if(r2.houve)nodes.push(...r2.nodes);
 /* 3 */
 it(3,'Dados da inspeção');
 kv('Período',ddPeriodo(m.start,m.end));kv('Objetivo da inspeção',[m.objective,m.inspectionType&&('Tipo: '+m.inspectionType)].filter(Boolean).join('. '));
 const primeira=m.first==='Sim'||R.primeira==='Sim';kv('Período da última inspeção',primeira?'—':(m.last||m.previousInspection||'—'));
 nodes.push({k:'checks',items:[['O estabelecimento está sendo inspecionado pela primeira vez.',primeira]]});
 /* 4 */
 it(4,'Pessoas contactadas');
 const cont=(m.contacts||[]).filter(x=>x&&ddTem(x.name));nodes.push({k:'tbl',head:true,cols:[3800,2800,2754],rows:[['Nome','Cargo','Contato']].concat(cont.length?cont.map(x=>[x.name,x.role||'',x.contact||'']):[['','','']])});
 /* 5 e 6 */
 it(5,'Informações gerais');ddParas(R.general).forEach(t=>p(t));if(!ddTem(R.general))p('Não informado.');
 it(6,'Não conformidades anteriores');ddParas(R.previous).forEach(t=>p(t));if(!ddTem(R.previous))p(primeira?'Não se aplica: primeira inspeção.':'Não informado.');
 /* 7 */
 it(7,'Terceirização e prestação de serviços');
 const ter=(Array.isArray(R.outsource)?R.outsource:Object.values(R.outsource||{})).filter(x=>x&&Object.values(x).some(ddTem));
 const r7=ddItemNodes('7',ctx);if(r7.houve)nodes.push(...r7.nodes);
 if(ter.length)nodes.push({k:'tbl',head:true,cols:[1900,2000,1500,1150,1150,1654],rows:[['Atividades terceirizadas','Empresa(s) contratada(s)','CNPJ','AFE','AE','Produto/Ensaio']].concat(ter.map(x=>[x.atividade||'',x.empresa||'',x.cnpj||'',x.afe||'',x.ae||'',x.produto||'']))});
 if(!r7.houve&&!ter.length)p(ddVazio('7',r7));
 sub('7.1',DD_TIT['7.1']);ddParas(R.terceirizacao_qual).forEach(t=>p(t));if(!ddTem(R.terceirizacao_qual))p(ter.length?'Não informado.':'Não aplicável.');
 /* 8 */
 it(8,'Pessoal');blocoItem('8');
 sub('8.1',DD_TIT['8.1']);ddParas(R.higiene).forEach(t=>p(t));if(!ddTem(R.higiene))p('Não informado.');
 /* 9 */
 it(9,'Áreas físicas');
 sub('9.1',DD_TIT['9.1']);blocoItem('9.1');
 sub('9.2',DD_TIT['9.2']);blocoItem('9.2');
 const tq=(state.thermalQualifications||[]).filter(x=>x&&Object.values(x).some(ddTem));
 if(tq.length){p('Qualificações térmicas avaliadas:');nodes.push({k:'tbl',head:true,cols:[1700,1700,1500,1100,1800,1554],rows:[['Objeto','Identificação','Documento / revisão','Data','Faixa / condição','Resultado']].concat(tq.map(x=>[x.kind||'',x.identification||'',x.document||'',ddData(x.date),x.range||'',[x.result,x.observations].filter(ddTem).join(' — ')]))})}
 const st=(state.stockBasket||[]).flatMap(pr=>(pr.lotes&&pr.lotes.length?pr.lotes:[{}]).map(l=>[pr.nome||'',[pr.registro,pr.ean].filter(Boolean).join(' / '),l.lote||'',ddData(l.validade),l.fisicoRaw??'',l.escrituradoRaw??'',l.diferenca??'']));
 if(st.length){p('Conferência de estoque por amostragem:');nodes.push({k:'tbl',head:true,cols:[2100,1700,1100,1100,1100,1100,1054],rows:[['Produto','Registro / EAN','Lote','Validade','Físico','Escriturado','Diferença']].concat(st.map(r=>r.map(String)))})}
 sub('9.3',DD_TIT['9.3']);blocoItem('9.3');
 /* 10 */
 it(10,'Transporte');blocoItem('10');sub('10.1',DD_TIT['10.1']);blocoItem('10.1');
 /* 11 */
 it(11,'Sistema de gestão da qualidade');blocoItem('11');
 for(const k of ['11.1','11.2','11.3','11.4','11.5','11.6','11.7','11.8','11.9']){sub(k,DD_TIT[k]);blocoItem(k)}
 /* 12 */
 it(12,'Controle de qualidade');
 if(!(m.activities||[]).includes('Importar')&&!['12.1','12.2','12.3','12.4','12.5'].some(k=>ddPerguntas(k).some(x=>(state.answers[x.q.id]||{}).status)))p('Não se aplica: item exclusivo de estabelecimentos importadores, e o estabelecimento não realiza importação.');
 else for(const k of ['12.1','12.2','12.3','12.4','12.5']){sub(k,DD_TIT[k]);blocoItem(k)}
 /* NCs sem lugar no roteiro (manuais) */
 const soltas=nc.ncs.map((n,i)=>({n,num:i+1})).filter(x=>!ctx.ncUsadas.has(x.num)&&!DATA.sections.some(s=>s.questions.some(q=>q.id===x.n.id&&(state.answers[q.id]||{}).status==='NC')));
 /* 13 */
 it(13,'Considerações finais / avaliação de riscos');
 if(soltas.length){p('Não conformidades registradas fora dos itens do roteiro:');soltas.forEach(x=>nodes.push(ddNcPara(x.num,x.n)))}
 ddParas(state.plan.risk).forEach(t=>p(t));
 if(nc.ncs.length)nodes.push({k:'tbl',head:true,cols:[700,4854,2400,1400],rows:[['Nº','Não conformidade','Norma e artigo','Categoria']].concat(nc.ncs.map((n,i)=>{const d=ncData(n);return [String(i+1),String(d.text||'').replace('«evidência»','(ver evidência)'),d.legal||'',d.category||'Não categorizada']}))});
 if(!ddTem(state.plan.risk)&&!nc.ncs.length)p('Não foram constatadas não conformidades.');else if(!ddTem(state.plan.risk))p('Avaliação de risco não informada.');
 /* 14 */
 it(14,'Conclusão');
 const cl=state.plan.classification||'',ativ=state.plan.activities||(m.activities||[]).join(', ');
 nodes.push({k:'checks',items:[['Estabelecimento em atividade',R.emAtividade==='Sim']]});
 [['14.1','Cumpre as Boas Práticas','14.1.1'],['14.3','Cumpre as Boas Práticas com Ação Corretiva','14.3.1'],['14.4','Não cumpre as Boas Práticas','14.4.1']].forEach(([n,t,na])=>{nodes.push({k:'p',runs:[[(cl===t?'☒ ':'☐ ')+n+' '+t,{b:cl===t}]]});nodes.push({k:'p',ind:360,t:na+' ATIVIDADE(S): '+(cl===t?ativ:'')})});
 /* 15 */
 it(15,'Medidas adotadas / documentos emitidos');
 const com=state.cycle&&state.cycle.communication;const med=[];
 if(com)med.push('Emitido e entregue à empresa o Formulário de Comunicação de Não Conformidades (Anexo II do POP-O-SNVS-011) em '+ddData(String(com.issuedAt).slice(0,10))+(state.delivery2&&state.delivery2.date?', recebido em '+ddData(state.delivery2.date):'')+'.');
 if(o.final&&nc.ncs.length)med.push('O plano de ação apresentado pela empresa'+(state.plan.receivedDate?', recebido em '+ddData(state.plan.receivedDate)+(state.plan.sei?' ('+state.plan.sei+')':''):'')+', foi analisado pela equipe inspetora; a análise integra este relatório como Anexo A.');
 med.forEach(p);ddParas(state.plan.measures).forEach(t=>p(t));if(!med.length&&!ddTem(state.plan.measures))p('Não informado.');
 /* 16 */
 it(16,'Anexos');
 const anexos=[];if(nc.ncs.length)anexos.push(o.final?'Anexo A — Análise do plano de ação.':'Análise do plano de ação — será anexada na versão final do relatório.');if(fotos.list.length)anexos.push((o.final&&nc.ncs.length?'Anexo B':'Anexo A')+' — Registro fotográfico ('+fotos.list.length+' foto'+(fotos.list.length>1?'s':'')+').');
 anexos.forEach(p);ddParas(state.plan.attachments).forEach(t=>p(t));if(!anexos.length&&!ddTem(state.plan.attachments))p('Não há.');
 /* 17 */
 it(17,'Equipe inspetora');
 const eq=ddEquipeRows();nodes.push({k:'tbl',head:true,cols:[4200,2000,3154],rows:[['Inspetores / Instituição','Matrícula','Assinatura']].concat((eq.length?eq:[{}]).map(x=>[(x.name||'')+(x.role==='Observador'?' (observador)':'')+(x.institution?'\n'+x.institution:''),x.code||'','\n\n']))});
 /* 18 */
 it(18,'Registro de revisão pelo par técnico');
 const pr=state.peer||{};if(pr.name&&pr.date&&pr.status)p('Revisão realizada por '+pr.name+' em '+ddData(pr.date)+'. Resultado: '+pr.status.toLowerCase()+'.');else p(o.final?'Não registrado.':'Pendente.');
 /* 19 */
 it(19,'Registro de entrega do relatório, termos e autos');
 const dv=state.delivery||{};p('19.1 Termos e autos entregues: '+(dv.terms||'______________________________________'));p('19.2 Recebido em: '+(ddData(dv.date)||'____/____/______')+'.');p('19.3 Nome do Responsável Legal ou Técnico: '+(dv.receiver||'______________________________________'));p('19.4 Documento de identificação: '+(dv.document||'______________________________'));p('19.5 Assinatura: ______________________________________');
 return {nodes,fotos,nc};
}

/* ---------- Análise do plano de ação ---------- */
function ddPlanoNodes(o={}){
 const m=state.meta,ncs=allNCs(),nodes=[],p=t=>nodes.push({k:'p',t});
 if(o.anexo){nodes.push({k:'title',t:'ANEXO A — ANÁLISE DO PLANO DE AÇÃO',pb:true})}
 else{ddCab(nodes,'ANÁLISE DO PLANO DE AÇÃO');nodes.push({k:'sub',t:'Documento a ser anexado ao Relatório de Inspeção (Anexo I do POP-O-SNVS-011).',al:'center',after:140})}
 nodes.push({k:'tbl',cols:[3000,6354],rows:[[{t:'Razão social',b:true},m.company||''],[{t:'CNPJ',b:true},(m.cnpj||'')+(m.unit?' — '+m.unit:'')],[{t:'Endereço',b:true},m.address||''],[{t:'Período da inspeção',b:true},ddPeriodo(m.start,m.end)],[{t:'Comunicação de NC (Anexo II)',b:true},state.cycle&&state.cycle.communication?'Emitida em '+ddData(String(state.cycle.communication.issuedAt).slice(0,10)):'Não registrada'],[{t:'Plano de ação recebido em',b:true},[ddData(state.plan.receivedDate),state.plan.sei].filter(ddTem).join(' — ')||'—']]});
 if(!ncs.length){p('Não foram registradas não conformidades; não há plano de ação a analisar.');return nodes}
 const res={};ncs.forEach((n,i)=>{const d=ncData(n),pl=state.plan.items[n.id]||{},crit=pl.criteria||{};res[pl.result||'Não analisado']=(res[pl.result||'Não analisado']||0)+1;
  nodes.push({k:'h2',t:'Não conformidade nº '+(i+1)+(d.category?' — categoria '+d.category.toLowerCase():'')});
  nodes.push({k:'tbl',cols:[3000,6354],rows:[
   [{t:'Norma e artigo infringido',b:true},d.legal||''],
   [{t:'Requisito descumprido com a evidência',b:true},ddNcTexto(Object.assign({},d,{legal:''}))],
   [{t:'Justificativa da categoria',b:true},d.categoryReason||'—'],
   [{t:'Causa identificada pela empresa',b:true},pl.cause||'—'],
   [{t:'Correção e ação corretiva propostas',b:true},pl.action||'—'],
   [{t:'Responsável e prazo',b:true},[pl.responsible,pl.deadline].filter(ddTem).join(' — ')||'—'],
   [{t:'Evidência apresentada / documento SEI',b:true},pl.evidence||'—'],
   [{t:'Critérios de aceitação',b:true},DATA.planCriteria.map(c=>c[1]+': '+(crit[c[0]]||'não avaliado')).join('\n')],
   [{t:'Fundamentação da análise',b:true},pl.comments||'—'],
   [{t:'Resultado da análise',b:true},pl.result||'Não analisado'],
   [{t:'Risco residual',b:true},pl.residual||'—'],
   [{t:'Situação da NC',b:true},['Finalizada','Em andamento'].map(x=>(d.status===x?'☒ ':'☐ ')+x).join('   ')],
   [{t:'Estratégia de monitoramento',b:true},DD_MONITOR.map(x=>(d.monitor===x?'☒ ':'☐ ')+x).join('\n')],
   [{t:'Analisado por',b:true},[pl.reviewer,ddData(pl.reviewDate)].filter(ddTem).join(' em ')||'—']]})});
 nodes.push({k:'h2',t:'Síntese'});p(Object.entries(res).map(([k,v])=>k+': '+v).join('; ')+'.');
 if(state.plan.classification)p('Classificação técnica final: '+state.plan.classification+(state.plan.activities?' — atividades: '+state.plan.activities:'')+'.');
 if(!o.anexo){nodes.push({k:'h2',t:'Equipe inspetora'});const eq=ddEquipeRows();nodes.push({k:'tbl',head:true,cols:[4200,2000,3154],rows:[['Inspetores / Instituição','Matrícula','Assinatura']].concat((eq.length?eq:[{}]).map(x=>[(x.name||'')+(x.institution?'\n'+x.institution:''),x.code||'','\n\n']))})}
 return nodes;
}
function ddPlanoPendencias(){const out=[];allNCs().forEach((n,i)=>{const d=ncData(n),pl=state.plan.items[n.id]||{};if(!pl.result)out.push('NC nº '+(i+1)+': resultado da análise não informado.');if(!ddTem(pl.comments))out.push('NC nº '+(i+1)+': fundamentação da análise não informada.');if(!d.status||!d.monitor)out.push('NC nº '+(i+1)+': situação ou estratégia de monitoramento após a análise não escolhida.')});return out}

/* ---------- Anexo II — Formulário de Comunicação de Não Conformidades ---------- */
const DD_MONITOR=['Avaliação documental','Inspeção de acompanhamento','Próxima inspeção planejada de BPDAIT conforme POP-O-SNVS-031','Sem necessidade de monitoramento'];
function ncData(n){const x=state.ncExtra[n.id]||{};return {...{text:n.text,legal:n.legal,evidence:n.evidence,category:'',categoryReason:'',status:'',monitor:''},...x,evidence:[x.evidence||n.evidence,n.members?'Ocorrências consolidadas: '+n.members.join(', ')+'\n'+n.evidence:''].filter(Boolean).join('\n')}}
function ddAnexo2Pendencias(){const out=[],m=state.meta;if(!ddTem(m.company))out.push('Razão social não informada.');if(!ddTem(m.cnpj))out.push('CNPJ não informado.');if(!m.unit)out.push('Matriz ou filial não informado.');if(!ddTem(m.start)||!ddTem(m.end))out.push('Período da inspeção incompleto.');if(!ddEquipeRows().some(x=>ddTem(x.code)))out.push('Identifique o inspetor e o código.');
 allNCs().forEach((n,i)=>{const d=ncData(n);if(!ddTem(d.legal))out.push('NC nº '+(i+1)+': norma e artigo infringido não informados.');if(!ddTem(d.text))out.push('NC nº '+(i+1)+': requisito descumprido não informado.');if(!ddTem(d.evidence)&&!String(d.text||'').includes('«evidência»'))out.push('NC nº '+(i+1)+': evidência não registrada.');if(!d.status)out.push('NC nº '+(i+1)+': marque a situação (Finalizada ou Em andamento).');if(!d.monitor)out.push('NC nº '+(i+1)+': marque a estratégia de monitoramento.')});return out}
function ddAnexo2Nodes(){
 const m=state.meta,ncs=allNCs(),nodes=[],dv=state.delivery2||{},eq=ddEquipeRows();
 if(ddTem(m.organ))nodes.push({k:'org',t:m.organ});nodes.push({k:'title',t:'FORMULÁRIO DE COMUNICAÇÃO DE NÃO CONFORMIDADES'});
 nodes.push({k:'h1',n:1,t:'Identificação da empresa'});
 nodes.push({k:'p',runs:[['1.1 Razão Social: ',{b:true}],[m.company||'',{}]]},{k:'p',runs:[['1.2 CNPJ: ',{b:true}],[(m.cnpj||'')+'   '+(m.unit==='Matriz'?'☒':'☐')+' Matriz   '+(m.unit==='Filial'?'☒':'☐')+' Filial',{}]]},{k:'p',runs:[['1.3 Endereço: ',{b:true}],[m.address||'',{}]]},{k:'p',runs:[['1.4 País: ',{b:true}],[m.country||'Brasil',{}]]});
 nodes.push({k:'h1',n:2,t:'Inspeção'},{k:'p',runs:[['2.1 Período: ',{b:true}],[ddPeriodo(m.start,m.end),{}]]});
 nodes.push({k:'h1',n:3,t:'Equipe inspetora'});(eq.length?eq:[{},{}]).forEach(x=>nodes.push({k:'p',runs:[['Nome do inspetor: ',{b:true}],[(x.name||'')+(x.role==='Observador'?' (observador)':''),{}],['   Código do inspetor: ',{b:true}],[x.code||'',{}]]}));
 nodes.push({k:'h1',n:4,t:'Não conformidades'});
 if(!ncs.length)nodes.push({k:'p',t:'Não foram constatadas não conformidades.'});
 ncs.forEach((n,i)=>{const d=ncData(n);nodes.push({k:'h2',t:'Não conformidade nº '+(i+1)});
  nodes.push({k:'tbl',cols:[3000,6354],rows:[[{t:'Norma e Artigo Infringido',b:true,fill:'F2F2F2'},d.legal||''],[{t:'Requisito regulamentar descumprido com a evidência',b:true,fill:'F2F2F2'},ddNcTexto(Object.assign({},d,{legal:''}))]]});
  nodes.push({k:'tbl',cols:[3000,6354],rows:[[{t:'Situação da NC',b:true,fill:'F2F2F2'},['Finalizada','Em andamento'].map(x=>(d.status===x?'☒ ':'☐ ')+x).join('     ')]]});
  nodes.push({k:'tbl',cols:[3000,6354],rows:[[{t:'Estratégia de Monitoramento',b:true,fill:'F2F2F2'},DD_MONITOR.map(x=>(d.monitor===x?'☒ ':'☐ ')+x.replace('Avaliação documental','Avaliação Documental').replace('Inspeção de acompanhamento','Inspeção de Acompanhamento').replace('Próxima inspeção planejada','Próxima Inspeção Planejada')).join('\n')]]})});
 nodes.push({k:'h1',n:5,t:'Assinaturas'});
 nodes.push({k:'tbl',head:true,cols:[2900,2300,1800,2354],rows:[['Nome do Inspetor\n(informar se o inspetor atuou como observador)','Nome/Sigla da Instituição\n(a qual o inspetor pertence)','Esfera de Atuação do Inspetor\n(Federal, Estadual ou Municipal)','Assinatura']].concat((eq.length?eq:[{},{}]).map(x=>[(x.name||'')+(x.role==='Observador'?' (observador)':''),x.institution||'',x.sphere||'','\n\n']))});
 nodes.push({k:'h1',n:6,t:'Registro de entrega do formulário, relatório, termos e autos'});
 nodes.push({k:'p',t:'Termos e autos entregues: '+(dv.terms||'______________________________________________')},{k:'p',t:'Recebido em: '+(ddData(dv.date)||'____/____/______')+'.'},{k:'p',t:'Nome e título do responsável pelo recebimento do relatório: '+(dv.receiver||'________________________________')},{k:'p',t:'Documento de identificação: '+(dv.document||'______________________________')},{k:'p',t:'Assinatura: ______________________________________'});
 return nodes;
}
function exportAnexo2(){const pend=ddAnexo2Pendencias();if(pend.length){ddModal('Anexo II — pendências antes de emitir',ddAnexo2Nodes(),pend);return}
 state.cycle=state.cycle||{};state.cycle.communication={issuedAt:new Date().toISOString(),version:distVersion()};save();
 ddBaixar(ddDocx(ddAnexo2Nodes(),{footer:'Formulário de Comunicação de Não Conformidades — POP-O-SNVS-011 rev. 3, Anexo II'}),'Anexo_II_POP_011_Comunicacao_NC.docx')}

/* ---------- Pendências do relatório (aviso; a trava final segue distIssues) ---------- */
function ddAnexoIPendencias(final){
 const out=[],m=state.meta,R=state.report||{};
 if(!ddTem(m.organ))out.push('Cabeçalho: informe o órgão de vigilância sanitária.');
 if(!ddLista(R.licAct).length&&R.licSituacao!=='Não possui licença')out.push('Item 1: marque as atividades licenciadas.');
 if(!R.licSituacao)out.push('Item 1: informe se o estabelecimento possui licença de funcionamento.');
 if(!ddLista(R.afeAct).length&&(state.distDocs||{}).afe?.status!=='Não possui')out.push('Item 2: marque as atividades da AFE.');
 if(!ddTem(R.general))out.push('Item 5: informações gerais não preenchidas.');
 if(!ddTem(R.previous)&&m.first!=='Sim')out.push('Item 6: não conformidades anteriores não preenchidas.');
 if(!R.emAtividade)out.push('Item 14: informe se o estabelecimento está em atividade.');
 const vazios=DD_ORDEM.filter(k=>k!=='1'&&k!=='2'&&!/^12/.test(k)&&!ddItemNodes(k,{nc:ddNcMapa(),fotosQ:{},ncUsadas:new Set()}).houve);
 if(vazios.length)out.push('Itens sem descrição nem respostas (sairão como “Não avaliado nesta inspeção”): '+vazios.join(', ')+'.');
 allNCs().forEach((n,i)=>{if(!ncData(n).category)out.push('NC nº '+(i+1)+': categoria (POP-O-SNVS-032) não informada.')});
 if(final){if(!state.plan.classification)out.push('Item 14: classificação final não definida.');out.push(...ddPlanoPendencias())}
 return out;
}

/* ---------- Saídas ---------- */
function ddNomeArq(base){return base+'_'+String(state.meta.company||'estabelecimento').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40)+'.docx'}
function ddAnexoFotos(nodes,fotos,letra){if(!fotos.list.length)return;nodes.push({k:'title',t:'ANEXO '+letra+' — REGISTRO FOTOGRÁFICO',pb:true},{k:'sub',t:'As legendas indicam o item do relatório e a verificação em que cada foto foi registrada; o número da foto é citado no texto do item.',after:120},{k:'photos',list:fotos.list})}
async function ddPrevia(baixar){
 const r=await ddAnexoI({final:false}),nodes=r.nodes.slice();ddAnexoFotos(nodes,r.fotos,'A');
 if(!baixar){ddModal('Prévia do relatório — Anexo I',nodes,ddAnexoIPendencias(false));return}
 ddBaixar(ddDocx(nodes,{header:'PRÉVIA — sujeita a alteração · versão '+distVersion(),headerColor:'9B241C',footer:'Relatório de inspeção — prévia'}),ddNomeArq('Previa_Relatorio_Anexo_I'));
}
function ddBaixarPlano(){const pend=ddPlanoPendencias();if(pend.length&&!confirm('Há pendências na análise:\n\n'+pend.join('\n')+'\n\nBaixar mesmo assim?'))return;ddBaixar(ddDocx(ddPlanoNodes(),{footer:'Análise do plano de ação'}),ddNomeArq('Analise_Plano_de_Acao'))}
async function exportFinal(){const issues=distIssues();if(!peerApproved())issues.push('Registre a revisão aprovada desta versão da minuta.');if(!state.approval?.name||!state.approval?.date)issues.push('Registre a aprovação para emissão, com nome e data.');if(issues.length){preview('Pendências para liberação do relatório final',issues.join('\n'));return}
 const r=await ddAnexoI({final:true}),nodes=r.nodes.slice(),temNC=r.nc.ncs.length;if(temNC)nodes.push(...ddPlanoNodes({anexo:true}));ddAnexoFotos(nodes,r.fotos,temNC?'B':'A');
 state.cycle=state.cycle||{};state.cycle.final={snapshot:distSnapshot(),version:distVersion(),issuedAt:new Date().toISOString(),approvedBy:state.approval.name};save();
 ddBaixar(ddDocx(nodes,{footer:'Relatório de inspeção — POP-O-SNVS-011 rev. 3, Anexo I'}),ddNomeArq('Relatorio_Final_Anexo_I'));renderCTab();renderCycle()}
/* Texto simples (API e prévias antigas) */
function reportText(){return ddAnexoIMontar({final:false},{list:[],fotosQ:{}}).nodes.map(ddNodeText).join('\n')}

/* ---------- Telas: aba Relatório, Anexo II e análise do plano ---------- */
function ddRelatorioView(){
 const m=state.meta,R=state.report=state.report||{};if(!Array.isArray(R.outsource))R.outsource=Object.values(R.outsource||{});if(!R.outsource.length)R.outsource.push({});
 const acts=['Distribuir','Transportar','Transporte próprio','Transporte para terceiros','Importar','Armazenar','Armazenamento próprio','Armazenamento para terceiros','Expedir'],a5=['Distribuir','Transportar','Importar','Armazenar','Expedir'];
 const ter=R.outsource.map((_,i)=>'<article class="dist-doc-card"><div class="statusline"><b>Prestador '+(i+1)+'</b>'+(R.outsource.length>1?'<button class="btn" type="button" data-dd-out-del="'+i+'">Remover</button>':'')+'</div><div class="grid three">'+field('report.outsource.'+i+'.atividade','Atividade terceirizada')+field('report.outsource.'+i+'.empresa','Empresa contratada (razão social)')+field('report.outsource.'+i+'.cnpj','CNPJ')+field('report.outsource.'+i+'.afe','AFE')+field('report.outsource.'+i+'.ae','AE')+field('report.outsource.'+i+'.produto','Produto / ensaio')+'</div></article>').join('');
 const itens=DD_ORDEM.filter(k=>k!=='1'&&k!=='2').map(k=>{const r=ddItemNodes(k,{nc:ddNcMapa(),fotosQ:{},ncUsadas:new Set()});const secs=(DD_ITENS[k]||[]).map(ddSec).filter(Boolean),manual=secs.some(s=>ddTem(state.narratives[s.id]));return '<details class="dd-item"><summary><b>'+k+' '+esc(DD_TIT[k]||'')+'</b><span class="dd-tag '+(r.houve?(manual?'m':'a'):'v')+'">'+(r.houve?(manual?'texto da equipe':'rascunho das respostas'):'sem dados')+'</span></summary><div class="dd-doc">'+(r.houve?r.nodes.map(ddNodeHtml).join(''):'<p class="dd-p i">'+esc(ddVazio(k,r))+'</p>')+'</div></details>'}).join('');
 return '<div class="panel"><h3>Relatório de inspeção — Anexo I (POP-O-SNVS-011 rev. 3)</h3><p class="mini">O relatório segue a numeração fixa do modelo (itens 1 a 19). Esta tela reúne os campos que não vêm do roteiro. Os itens 7 a 12 são montados com a “Descrição para o relatório” de cada bloco do roteiro; sem ela, o texto é redigido a partir das respostas Cumpre, e as não conformidades saem sempre, numeradas como no Anexo II.</p><ol class="dd-fluxo"><li><b>Prévia</b> — a qualquer momento, para conferência.</li><li><b>Anexo II</b> — entregue à empresa ao fim da inspeção (aba Anexo II do roteiro).</li><li><b>Análise do plano de ação</b> — documento Word próprio (aba Análise do plano de ação).</li><li><b>Par técnico e aprovação</b>.</li><li><b>Relatório final único</b> — Anexo I + Anexo A (análise do plano) + registro fotográfico.</li></ol><div class="toolbar"><button class="btn" type="button" data-dd-prev>Ver prévia</button><button class="btn primary" type="button" data-dd-prevdoc>Baixar prévia (.docx)</button></div></div>'+
 '<div class="panel"><h3>Cabeçalho</h3><div class="grid three">'+field('meta.organ','Órgão de vigilância sanitária (nome no cabeçalho)')+field('meta.city','Cidade')+field('report.date','Data do relatório','date')+'</div></div>'+
 '<div class="panel"><h3>1 · Identificação — licença e anexos</h3><p class="mini">Razão social, CNPJ, endereço e responsáveis vêm da etapa 1 do roteiro.</p><div class="grid three">'+field('report.licSituacao','Licença de funcionamento','select',['Possui','Não possui licença'])+field('distDocs.lic.number','Número da licença')+field('distDocs.lic.date','Data de publicação ou emissão','date')+'</div>'+field('report.licAct','Atividades licenciadas','checks',acts)+field('report.docsAnexos','Documentos anexos (ex.: lista mestra de documentos, relação de produtos, certificado ISO)','textarea')+'</div>'+
 '<div class="panel"><h3>2 · AFE e AE</h3><div class="grid three">'+field('distDocs.afe.number','AFE nº')+field('distDocs.afe.publicationDate','AFE publicada em','date')+field('report.afeRe','AFE — RE nº')+'</div>'+field('report.afeAct','Atividades da AFE','checks',a5)+'<div class="grid three">'+field('distDocs.ae.number','AE nº')+field('distDocs.ae.publicationDate','AE publicada em','date')+field('report.aeRe','AE — RE nº')+'</div>'+field('report.aeAct','Atividades da AE','checks',a5)+'</div>'+
 '<div class="panel"><h3>5 · Informações gerais</h3><p class="mini">Número de funcionários, área, prédios, arredores, setores, controle de pragas, caixa d’água, limpeza, organograma, cargos e documentos legais.</p>'+field('report.general','Texto do item 5','textarea')+'<div class="toolbar"><button class="btn" type="button" data-dd-general>Montar rascunho com a caracterização da etapa 1</button></div></div>'+
 '<div class="panel"><h3>6 · Não conformidades anteriores</h3>'+field('report.previous','Evidências da efetividade das ações corretivas de inspeções anteriores','textarea')+'<div class="toolbar"><button class="btn" type="button" data-dd-previous>Montar rascunho com o histórico da etapa 1</button></div></div>'+
 '<div class="panel"><h3>7 · Terceirização</h3><p class="mini">Uma linha por atividade terceirizada (ensaios de controle de qualidade, transporte, armazenamento, calibração). Sem terceirização, deixe em branco: o item sai como “Não aplicável”.</p>'+ter+'<div class="toolbar"><button class="btn" type="button" data-dd-out-add>＋ Incluir prestador</button></div>'+field('report.terceirizacao_qual','7.1 Qualificação do prestador de serviço','textarea')+'</div>'+
 '<div class="panel"><h3>8.1 · Higiene pessoal e saúde do trabalhador</h3>'+field('report.higiene','Texto do item 8.1','textarea')+'</div>'+
 '<div class="panel"><h3>Itens 7 a 12 — como sairão no relatório</h3><p class="mini">Para escrever o texto de um item, use “Descrição para o relatório” no bloco correspondente do roteiro. As fotos entram numeradas no anexo fotográfico e são citadas no item.</p>'+itens+'</div>'+
 '<div class="panel"><h3>14 · Conclusão e 17 · Equipe</h3><div class="grid three">'+field('report.emAtividade','Estabelecimento em atividade?','select',['Sim','Não'])+'</div><p class="mini">A classificação (14.1, 14.3 ou 14.4) e as atividades são registradas na aba Análise do plano de ação.</p><div class="grid three">'+ddEquipeRows().map((x,i)=>field('meta.team.'+(state.meta.team.indexOf(x))+'.role',(x.name||'Inspetor '+(i+1))+' — atuação','select',['Inspetor','Observador'])).join('')+'</div></div>'+
 '<div class="panel"><h3>Pendências da prévia</h3>'+(()=>{const p=ddAnexoIPendencias(false);return p.length?'<ul class="dd-pend">'+p.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p class="mini">Nenhuma pendência nos campos do relatório.</p>'})()+'</div>';
}
function ddRascunhoGeral(){const m=state.meta,D=state.distDocs||{},f=[];if(ddTem(m.workers))f.push('O estabelecimento conta com '+m.workers+' trabalhador(es)');if(ddTem(m.area))f.push((f.length?'e ':'O estabelecimento ')+'ocupa área total aproximada de '+m.area+' m²');let t=f.length?f.join(' ')+'.':'';
 const s=ddLista(m.sectors);if(s.length)t+=' As instalações compreendem: '+ddJoin(s.map(ddLc))+'.';if(ddTem(m.hours))t+=' Horário de funcionamento: '+ddFim(m.hours);
 const docs=[];if(D.crt&&D.crt.status)docs.push('Certidão de regularidade técnica: '+ddLc(D.crt.status)+(D.crt.number?' (nº '+D.crt.number+(D.crt.validity?', validade '+D.crt.validity:'')+')':''));if(D.avcb&&D.avcb.status)docs.push('AVCB/CLCB: '+ddLc(D.avcb.status)+(D.avcb.number?' (nº '+D.avcb.number+(D.avcb.validity?', validade '+D.avcb.validity:'')+')':''));if(docs.length)t+=' Documentos legais: '+docs.join('; ')+'.';
 if(ddTem(m.surroundings))t+='\n\n'+ddFim(m.surroundings);return t.trim()}
function ddRascunhoAnterior(){const m=state.meta,t=[];if(ddTem(m.previousInspection))t.push('Inspeção anterior: '+ddFim(m.previousInspection));if(ddTem(m.previousNC))t.push('Não conformidades anteriores e situação atual: '+ddFim(m.previousNC));if(ddTem(m.previousActions))t.push('Ações e evidências apresentadas: '+ddFim(m.previousActions));if(ddTem(m.historyEvaluation))t.push('Avaliação da equipe: '+ddFim(m.historyEvaluation));return t.join('\n\n')}

(function ddInstalar(){
 /* Aba Relatório no fechamento */
 const tabs=byId('closingTabs');if(tabs&&!tabs.querySelector('[data-ctab="report"]')){const b=document.createElement('button');b.className='tab';b.dataset.ctab='report';b.setAttribute('aria-pressed','false');b.textContent='Relatório · Anexo I';tabs.insertBefore(b,tabs.firstChild)}
 const oldCTab=renderCTab;renderCTab=function(){if(state.ctab!=='report')return oldCTab();document.querySelectorAll('[data-ctab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ctab==='report')));byId('closingContent').innerHTML=ddRelatorioView();dock()};
 /* Análise do plano: recebimento, documento próprio e relatório */
 const oldPlan=planView;planView=function(){let h=oldPlan();
  h=h.replace('<div class="panel"><h3>Análise do plano de ação</h3>','<div class="panel"><h3>Análise do plano de ação</h3><div class="grid three">'+field('plan.receivedDate','Plano recebido em','date')+field('plan.sei','Documento SEI do plano')+'</div>');
  h=h.replace(/<div class="toolbar"><button class="btn" data-action="previewReport">Prévia da minuta do Anexo I<\/button><button class="btn" data-dist-draft>Baixar minuta do Anexo I<\/button>/,'<div class="toolbar"><button class="btn primary" type="button" data-dd-plan>Baixar análise do plano de ação (.docx)</button><button class="btn" type="button" data-dd-prev>Prévia do relatório</button><button class="btn" data-dist-draft>Baixar prévia do relatório (.docx)</button>');
  return h.replace('Anexos do relatório','Outros anexos do relatório (a análise do plano e o registro fotográfico entram automaticamente)')};
 const oldPeer=peerView;peerView=function(){return oldPeer().replace('Baixar Relatório Final — Anexo I (.docx)','Baixar relatório final único (.docx)')};
 /* Anexo II: atuação da equipe e registro de entrega do formulário */
 const oldA2=anexo2View;anexo2View=function(){const h=oldA2(),eq=ddEquipeRows(),pend=allNCs().length?ddAnexo2Pendencias():[];
  return h.replace('</div></div>','</div><p class="mini">Situação e estratégia de monitoramento não vêm marcadas: a equipe escolhe em cada NC. O formulário não traz a categoria nem a análise do plano; essas informações ficam no relatório.</p>'+(pend.length?'<ul class="dd-pend">'+pend.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+'</div>')+
   '<div class="panel"><h3>Assinaturas e registro de entrega do formulário</h3><div class="grid three">'+eq.map((x,i)=>field('meta.team.'+state.meta.team.indexOf(x)+'.role',(x.name||'Inspetor '+(i+1))+' — atuação','select',['Inspetor','Observador'])).join('')+'</div><div class="grid three">'+field('delivery2.terms','Termos e autos entregues')+field('delivery2.date','Recebido em','date')+field('delivery2.receiver','Nome e título de quem recebeu')+field('delivery2.document','Documento de identificação')+'</div><p class="mini">Campos em branco saem com linha para preenchimento à mão.</p></div>'};
 /* Barra inferior: na aba Relatório, “Limpar dados” limpa só os campos desta aba e → segue para a análise do plano */
 const oldClear=distClear;distClear=async function(){if(!(state.view==='closing'&&state.ctab==='report'))return oldClear.apply(this,arguments);if(!confirm('Limpar os campos desta aba (cabeçalho, licença, AFE/AE, itens 5, 6, 7, 8.1 e 14)? O roteiro, as NCs e o plano não são alterados.'))return;state.report={};state.meta.organ='';save();renderCTab()};
 const oldDD=distDock;distDock=function(){oldDD();if(state.view==='closing'&&state.ctab==='report')byId('dockNext').onclick=()=>{state.ctab='plan';save();renderCTab()}};
 /* Botões */
 document.addEventListener('click',async function(e){
  const b=e.target.closest&&e.target.closest('[data-dd-prev],[data-dd-prevdoc],[data-dd-plan],[data-dd-out-add],[data-dd-out-del],[data-dd-general],[data-dd-previous],[data-dist-draft],[data-action="previewAnexo2"],[data-action="previewReport"]');if(!b)return;
  e.preventDefault();e.stopImmediatePropagation();
  const R=state.report=state.report||{};
  try{
   if(b.hasAttribute('data-dd-prev')||b.dataset.action==='previewReport')await ddPrevia(false);
   else if(b.hasAttribute('data-dd-prevdoc')||b.hasAttribute('data-dist-draft')){b.disabled=true;await ddPrevia(true);b.disabled=false}
   else if(b.hasAttribute('data-dd-plan'))ddBaixarPlano();
   else if(b.dataset.action==='previewAnexo2')ddModal('Prévia do Anexo II',ddAnexo2Nodes(),ddAnexo2Pendencias());
   else if(b.hasAttribute('data-dd-out-add')){R.outsource=Array.isArray(R.outsource)?R.outsource:Object.values(R.outsource||{});R.outsource.push({});save();renderCTab()}
   else if(b.hasAttribute('data-dd-out-del')){R.outsource.splice(+b.dataset.ddOutDel,1);save();renderCTab()}
   else if(b.hasAttribute('data-dd-general')){const t=ddRascunhoGeral();if(!t){alert('Preencha a caracterização na etapa 1 do roteiro.');return}if(ddTem(R.general)&&!confirm('Substituir o texto atual do item 5 pelo rascunho?'))return;R.general=t;save();renderCTab()}
   else if(b.hasAttribute('data-dd-previous')){const t=ddRascunhoAnterior();if(!t){alert('Preencha o histórico na etapa 1 do roteiro.');return}if(ddTem(R.previous)&&!confirm('Substituir o texto atual do item 6 pelo rascunho?'))return;R.previous=t;save();renderCTab()}
  }catch(err){b.disabled=false;alert('Não foi possível gerar o documento: '+err.message)}
 },true);
 const st=document.createElement('style');st.id='dd-style';st.textContent='.dd-doc{font:14px/1.5 Arial,sans-serif;color:#111}.dd-doc .dd-org{text-align:center;font-weight:700;margin:0}.dd-doc .dd-title{text-align:center;font-size:1.05rem;margin:10px 0}.dd-doc .dd-sub{margin:2px 0}.dd-doc .dd-sub.c{text-align:center}.dd-doc .dd-h1{font-size:.95rem;margin:16px 0 6px}.dd-doc .dd-h2{font-size:.9rem;margin:12px 0 4px}.dd-doc .dd-p{margin:0 0 7px;text-align:justify}.dd-doc .dd-p.i{color:#666;font-style:italic}.dd-checks div{margin:2px 0 2px 12px}.dd-checks div.in{margin-left:32px}.dd-tbl{border-collapse:collapse;width:100%;margin:4px 0 10px;table-layout:fixed}.dd-tbl td,.dd-tbl th{border:1px solid #333;padding:4px 6px;vertical-align:top;font-size:.8rem;overflow-wrap:anywhere;text-align:left}.dd-tbl th{background:#e7eef3}.dd-photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}.dd-photos figure{margin:0}.dd-photos img{width:100%;border:1px solid #ccc}.dd-photos figcaption{font-size:.75rem}.dd-pb{border:0;border-top:2px dashed #999;margin:18px 0}.dd-avisos ul,.dd-pend{margin:6px 0 0 18px;padding:0}.dd-avisos li,.dd-pend li{font-size:.84rem;margin:2px 0}.dd-fluxo{margin:8px 0 10px 18px;padding:0;font-size:.88rem}.dd-fluxo li{margin:3px 0}.dd-item{border:1px solid var(--line,#d9e2e8);border-radius:10px;padding:0 10px;margin:6px 0;background:#fff}.dd-item>summary{display:flex;gap:8px;align-items:center;justify-content:space-between;padding:9px 0;cursor:pointer}.dd-item .dd-doc{padding:0 0 10px}.dd-tag{font-size:.72rem;border-radius:99px;padding:2px 8px;white-space:nowrap}.dd-tag.m{background:#e3f1e8;color:#1d5b33}.dd-tag.a{background:#e8f0f7;color:#1d4b6b}.dd-tag.v{background:#fbeaea;color:#8b2019}';document.head.appendChild(st);
})();
