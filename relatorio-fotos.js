/* ——— Relatório fotográfico em PDF, à parte do relatório Word ———
   As fotos deixam de entrar no Word e são emitidas, quando a equipe quiser,
   num PDF próprio: duas fotos por página, cada uma com a legenda do ponto do
   roteiro em que foi registrada (bloco/seção e item/pergunta).
   O PDF é montado no próprio aparelho, sem internet e sem biblioteca externa:
   as fotos são reduzidas (lado maior 1280 px, JPEG 0,75) e gravadas direto no
   arquivo, o que o deixa menor que o Word com as mesmas fotos.
   Botão “Fotos” no cabeçalho do roteiro, ao lado de “Salvas”.
   Também oferece __uvsReduzFoto(url, cb), usado para reduzir as fotos de
   Alimentos antes de gravá-las.
   Inserido nos módulos por scripts/repack-fotos.cjs. */
(function(){
 'use strict';
 if(window.UvsFotosPDF)return;
 var LADO=1280,QUAL=.75;
 function limpa(t){return String(t==null?'':t).replace(/\s+/g,' ').trim()}

 /* ---------- redução ---------- */
 function carrega(src){return new Promise(function(ok,no){var u=src,rev=false;if(typeof Blob!=='undefined'&&src instanceof Blob){u=URL.createObjectURL(src);rev=true}
  var im=new Image();im.onload=function(){if(rev)URL.revokeObjectURL(u);ok(im)};im.onerror=function(){if(rev)URL.revokeObjectURL(u);no(new Error('imagem ilegível'))};im.src=u})}
 function reduz(src,lado,q){return carrega(src).then(function(im){var k=Math.min(1,lado/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');
  c.width=Math.max(1,Math.round(im.naturalWidth*k));c.height=Math.max(1,Math.round(im.naturalHeight*k));var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);
  return {url:c.toDataURL('image/jpeg',q),w:c.width,h:c.height}})}
 window.__uvsReduzFoto=function(src,cb){reduz(src,LADO,.72).then(function(r){cb(r.url)},function(){cb(src)})};

 /* ---------- PDF mínimo (A4, Helvetica, WinAnsi, imagens JPEG) ---------- */
 var WIN={'€':128,'‚':130,'ƒ':131,'„':132,'…':133,'†':134,'‡':135,'ˆ':136,'‰':137,'Š':138,'‹':139,'Œ':140,'Ž':142,'‘':145,'’':146,'“':147,'”':148,'•':149,'–':150,'—':151,'˜':152,'™':153,'š':154,'›':155,'œ':156,'ž':158,'Ÿ':159};
 function win(s){var o=[];s=String(s).normalize('NFC');for(var i=0;i<s.length;i++){var ch=s[i],c=s.charCodeAt(i);if(WIN[ch])c=WIN[ch];else if(c>255)c=63;if(c===40||c===41||c===92)o.push(92);o.push(c)}return o}
 function quebra(t,tam,larg){var max=Math.max(10,Math.floor(larg/(tam*.5))),pal=limpa(t).split(' '),ls=[],l='';
  pal.forEach(function(p){if((l+' '+p).trim().length>max&&l){ls.push(l);l=p}else l=(l+' '+p).trim()});if(l)ls.push(l);return ls}
 function b64bytes(url){var s=atob(url.split(',')[1]),u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u}
 function pdf(meta,fotos){
  var W=595.28,H=841.89,M=42,partes=[],tam=0,off=[],objs=0;
  function bin(x){if(typeof x==='string'){var u=new Uint8Array(x.length);for(var i=0;i<x.length;i++)u[i]=x.charCodeAt(i)&255;x=u}partes.push(x);tam+=x.length}
  function novoObj(){return ++objs}
  var conteudos=[],paginas=[],imgs=[];
  function txt(ops,x,y,t,sz,neg){ops.push('BT /'+(neg?'F2':'F1')+' '+sz+' Tf '+x.toFixed(1)+' '+y.toFixed(1)+' Td (');ops.push(win(t));ops.push(') Tj ET\n')}
  /* layout: cabeçalho na 1ª página; duas fotos por página */
  var porPag=2,npag=Math.max(1,Math.ceil(fotos.length/porPag));
  for(var p=0;p<npag;p++){var ops=[],y=H-M;
   if(p===0){txt(ops,M,y-14,meta.titulo,14,true);y-=34;
    [meta.estab?'Estabelecimento: '+meta.estab:'',meta.data?'Data da inspeção: '+meta.data:'','Total de fotografias: '+fotos.length+'. A legenda indica o ponto do roteiro em que cada foto foi registrada.'].filter(Boolean).forEach(function(l){quebra(l,9,W-2*M).forEach(function(q){txt(ops,M,y,q,9);y-=12})});y-=6}
   var util=y-M-18,slot=util/porPag;
   for(var k=0;k<porPag;k++){var f=fotos[p*porPag+k];if(!f)break;var topo=y-k*slot,leg=quebra('Foto '+f.n+' — '+f.legenda,9,W-2*M).slice(0,4),altLeg=leg.length*11+8;
    var bw=W-2*M,bh=slot-altLeg-14,esc=Math.min(bw/f.w,bh/f.h),iw=f.w*esc,ih=f.h*esc,ix=M+(bw-iw)/2,iy=topo-ih;
    ops.push('q '+iw.toFixed(1)+' 0 0 '+ih.toFixed(1)+' '+ix.toFixed(1)+' '+iy.toFixed(1)+' cm /Im'+f.n+' Do Q\n');
    var ly=iy-12;leg.forEach(function(l,i){txt(ops,M,ly,l,9,i===0&&false);ly-=11});
    imgs.push(f)}
   txt(ops,W/2-30,M-18,'Página '+(p+1)+' de '+npag,8);
   conteudos.push(ops)}
  /* objetos */
  bin('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  var cat=novoObj(),pags=novoObj(),f1=novoObj(),f2=novoObj(),ids={};
  imgs.forEach(function(f){ids[f.n]=novoObj()});
  var pagIds=conteudos.map(function(){return [novoObj(),novoObj()]});
  function obj(id,corpo){off[id]=tam;bin(id+' 0 obj\n');corpo();bin('\nendobj\n')}
  obj(cat,function(){bin('<< /Type /Catalog /Pages '+pags+' 0 R >>')});
  obj(pags,function(){bin('<< /Type /Pages /Count '+pagIds.length+' /Kids ['+pagIds.map(function(x){return x[0]+' 0 R'}).join(' ')+'] >>')});
  obj(f1,function(){bin('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')});
  obj(f2,function(){bin('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')});
  imgs.forEach(function(f){obj(ids[f.n],function(){bin('<< /Type /XObject /Subtype /Image /Width '+f.w+' /Height '+f.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+f.bytes.length+' >>\nstream\n');bin(f.bytes);bin('\nendstream')})});
  conteudos.forEach(function(ops,i){var s=[];ops.forEach(function(o){if(typeof o==='string')for(var j=0;j<o.length;j++)s.push(o.charCodeAt(j)&255);else s.push.apply(s,o)});var u=new Uint8Array(s);
   var nas=imgs.filter(function(f){return Math.ceil(f.n/porPag)-1===i});
   obj(pagIds[i][0],function(){bin('<< /Type /Page /Parent '+pags+' 0 R /MediaBox [0 0 '+W+' '+H+'] /Resources << /Font << /F1 '+f1+' 0 R /F2 '+f2+' 0 R >> /XObject << '+nas.map(function(f){return '/Im'+f.n+' '+ids[f.n]+' 0 R'}).join(' ')+' >> >> /Contents '+pagIds[i][1]+' 0 R >>')});
   obj(pagIds[i][1],function(){bin('<< /Length '+u.length+' >>\nstream\n');bin(u);bin('\nendstream')})});
  var xref=tam,l='xref\n0 '+(objs+1)+'\n0000000000 65535 f \n';for(var i=1;i<=objs;i++)l+=String(off[i]).padStart(10,'0')+' 00000 n \n';
  bin(l+'trailer\n<< /Size '+(objs+1)+' /Root '+cat+' 0 R >>\nstartxref\n'+xref+'\n%%EOF');
  return new Blob(partes,{type:'application/pdf'})}

 /* ---------- adaptadores: fotos de cada roteiro, na ordem do roteiro ---------- */
 function tenta(f,d){try{var v=f();return v==null?d:v}catch(e){return d}}
 function primeiro(){for(var i=0;i<arguments.length;i++){var v=arguments[i];if(v&&limpa(v))return limpa(v)}return ''}
 function evid(scopes){if(!window.RoteiroEvidence)return Promise.resolve([]);return Promise.all(scopes.map(function(s){return RoteiroEvidence.read(s).then(function(a){return Object.keys(a||{}).map(function(k){return {scope:s,key:k,src:a[k]}})},function(){return []})})).then(function(x){return [].concat.apply([],x)})}
 var A={
  'drogaria':{
   titulo:'Relatório fotográfico — Drogaria',
   meta:function(){var m=tenta(function(){return DrogariaAPI.getState().meta},{});return {estab:primeiro(m.razao,m.fantasia),data:primeiro(m.data)}},
   fotos:function(){var m=tenta(function(){return DrogariaAPI.getState().meta},{}),cards={};
    [].forEach.call(document.querySelectorAll('button[data-card]'),function(b){cards[b.dataset.card]=limpa(b.textContent).replace(/^SE[ÇC][ÃA]O\s*\d+\s*/i,'')});
    var cat=tenta(function(){var c={};DrogariaAPI.getCatalog().perguntas.forEach(function(q){c[q.id]=q});return c},{});
    var gal=(window.DrogariaOcrTools&&m.inspecao_id)?DrogariaOcrTools.fotos.list(m.inspecao_id).then(function(l){return l.map(function(p){DrogariaOcrTools.fotos.revokePreview(p);return {src:p.blob,legenda:[p.section||'Inspeção',p.caption].filter(Boolean).join(' — ')}})},function(){return []}):Promise.resolve([]);
    var it=evid([1,2,3,4,5,6,7,8].map(function(n){return 'drogaria-card-'+n})).then(function(l){return l.map(function(x){var n=x.scope.split('-').pop(),id=x.key.split('::')[0],q=cat[id];return {src:x.src,legenda:[cards[n]||('Seção '+n),q?limpa(q.pergunta):id].join(' — ')}})});
    return Promise.all([it,gal]).then(function(v){return v[0].concat(v[1])})}
  },
  'farmacia-manipulacao':{
   titulo:'Relatório fotográfico — Farmácia com Manipulação',
   meta:function(){var c=tenta(function(){return state.char},{})||{},m=tenta(function(){return state.meta},{})||{};return {estab:primeiro(c.razao,c.fantasia,c.nome,m.razao,m.fantasia),data:primeiro(c.data,m.data)}},
   fotos:function(){return Promise.resolve(v2CarregarFotos()).then(function(){var ordem={},n=0;Object.values(APP_DATA.cards).forEach(function(c){c.sections.forEach(function(s){ordem[s.item]=n++})});
    return (v2Fotos||[]).map(function(f){return Object.assign({},f,v2FotoInfo(f))}).filter(function(f){return !v2State().itemNA[f.iid]}).sort(function(a,b){return (a.card-b.card)||((ordem[a.iid]!=null?ordem[a.iid]:999)-(ordem[b.iid]!=null?ordem[b.iid]:999))||(a.ts-b.ts)})
     .map(function(f){var t=f.iid?v2ItemTitulo(f.iid):'';return {src:f.url,legenda:(t&&String(f.leg).indexOf(t)!==0?t+' — ':'')+f.leg}})})}
  },
  'distribuidoras-transportadoras':{
   titulo:'Anexo — Registro fotográfico',
   meta:function(){return {estab:primeiro(tenta(function(){return state.meta.company},'')),data:primeiro(tenta(function(){return state.report.date},''))}},
   /* mesma numeração citada no texto do relatório (“foto 3”) */
   fotos:function(){return ddFotos().then(function(r){return r.list.map(function(f){return {src:f.url,legenda:f.cap}})})}
  },
  'servicos-alimentacao-roteiro':{
   titulo:'Relatório fotográfico — Serviço de alimentação',
   meta:function(){return window.__uvsFotosMeta?window.__uvsFotosMeta():{}},
   fotos:function(){return Promise.resolve(window.__uvsFotosItens?window.__uvsFotosItens():[])}
  },
  'produtos-correlatos':{
   titulo:'Relatório fotográfico — Produtos',
   meta:function(){return window.__uvsFotosMeta?window.__uvsFotosMeta():{}},
   fotos:function(){return Promise.resolve(window.__uvsFotosItens?window.__uvsFotosItens():[])}
  },
  'servicos-assistenciais':{
   titulo:'Relatório fotográfico — Serviços assistenciais',
   meta:function(){var m=tenta(function(){return meta()},{})||{};return {estab:primeiro(m.name,m.nome,m.establishment,m.razao),data:primeiro(m.date,m.data)}},
   fotos:function(){if(typeof current==='undefined'||!current)return Promise.reject(new Error('Abra a modalidade (ILPI, SAICA…) para emitir as fotos dela.'));
    var tipo={doc:'Documentação',rot:'Roteiro',inf:'Infração'};
    return Promise.resolve([].concat(Array.from(photoIndex.values())).sort(function(a,b){var x=a.item.split('|'),y=b.item.split('|');return (x[0]>y[0]?1:x[0]<y[0]?-1:0)||(+x[1]-+y[1])}).map(function(p){var s=p.item.split('|'),it=current[s[0]]&&current[s[0]][+s[1]];
     return {src:p.dataUrl,legenda:current.nome+' — '+(tipo[s[0]]||s[0])+(it&&it.g?' · '+it.g:'')+' — '+(it?limpa(it.i):'Item '+(+s[1]+1))}}))}
  }
 };
 function app(){return document.documentElement.dataset.uvisApp||''}
 function aviso(t){var a=document.getElementById('uvs-fotos-aviso');if(!a){a=document.createElement('div');a.id='uvs-fotos-aviso';a.setAttribute('role','status');a.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#263d4a;color:#fff;padding:10px 16px;border-radius:10px;z-index:2147483600;font:14px/1.4 system-ui,Arial,sans-serif;max-width:90vw;box-shadow:0 6px 20px #0003';document.body.appendChild(a)}
  a.textContent=t;clearTimeout(aviso.t);aviso.t=setTimeout(function(){a.remove()},5000)}
 function nomeArq(meta){var b=String(meta.estab||'inspecao').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40)||'inspecao';return 'Relatorio_fotografico_'+b+'_'+new Date().toISOString().slice(0,10)+'.pdf'}
 var ocupado=false;
 function gerar(){var ad=A[app()];if(!ad){aviso('Este roteiro não tem fotos.');return Promise.resolve(null)}if(ocupado)return Promise.resolve(null);ocupado=true;aviso('Montando o relatório fotográfico…');
  return Promise.resolve().then(ad.fotos).then(function(l){l=(l||[]).filter(function(f){return f&&f.src});if(!l.length){aviso('Nenhuma foto registrada nesta inspeção.');return null}
   var out=[],p=Promise.resolve();l.forEach(function(f,i){p=p.then(function(){return reduz(f.src,LADO,QUAL).then(function(r){out.push({n:out.length+1,legenda:f.legenda||'Registro da inspeção',w:r.w,h:r.h,bytes:b64bytes(r.url)})},function(){})})});
   return p.then(function(){if(!out.length){aviso('Não foi possível ler as fotos.');return null}var m=tenta(ad.meta,{})||{};var iso=/^(\d{4})-(\d{2})-(\d{2})/.exec(m.data||'');if(iso)m.data=iso[3]+'/'+iso[2]+'/'+iso[1];var blob=pdf({titulo:ad.titulo,estab:m.estab,data:m.data},out);
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=nomeArq(m);document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},2000);
    aviso('Relatório fotográfico gerado: '+out.length+' foto'+(out.length>1?'s':'')+', '+Math.max(1,Math.round(blob.size/1024))+' KB.');return blob})})
  .catch(function(e){aviso(e&&e.message||'Não foi possível gerar o relatório fotográfico.');return null}).then(function(r){ocupado=false;return r})}

 /* ---------- botão ao lado de “Salvas” ---------- */
 var ICONE='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h3l2-2.5h6L17 7h3v12H4z"/><circle cx="12" cy="13" r="3.5"/></svg><span>Fotos</span>';
 function poeBotao(){if(!A[app()])return;var s=document.getElementById('uvs-botao');if(!s||document.getElementById('uvs-fotos'))return;
  var b=document.createElement('button');b.type='button';b.id='uvs-fotos';b.className=s.className;b.title='Relatório fotográfico em PDF, à parte do relatório';b.setAttribute('aria-label','Relatório fotográfico em PDF');b.innerHTML=ICONE;
  b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();gerar()});
  /* mesmo visual do botão Salvas: copia a folha de estilo dele trocando o id */
  var orig=[].filter.call(document.querySelectorAll('style'),function(x){return x.textContent.indexOf('#uvs-botao{')>=0})[0];
  var st=document.createElement('style');st.textContent=(orig?orig.textContent.replace(/#uvs-botao/g,'#uvs-fotos'):'')+'#uvs-fotos{margin-right:6px}';document.head.appendChild(st);
  s.insertAdjacentElement('beforebegin',b);
  /* cabeçalho com título centralizado e botões fixos à direita: o título ganha margem simétrica para não ficar sob os botões */
  function abreEspaco(){var r=b.getBoundingClientRect();if(!r.width)return;var cy=r.top+r.height/2,falta=window.innerWidth-r.left+4;
   [].forEach.call(document.querySelectorAll('h1,h2,.title,.app-title,header strong'),function(t){if(t.closest('#uvs-fotos,#uvs-botao'))return;var q=t.getBoundingClientRect();if(!q.width||q.top>cy||q.bottom<cy||q.right<=r.left)return;
    var cs=getComputedStyle(t),pr=parseFloat(cs.paddingRight)||0,pl=parseFloat(cs.paddingLeft)||0,alvo=pr+(q.right-r.left)+4;if(alvo>pr)t.style.paddingRight=alvo+'px'})}
  function posiciona(){if(getComputedStyle(s).position==='fixed'){var r=s.getBoundingClientRect();b.style.position='fixed';b.style.top=r.top+'px';b.style.right=(window.innerWidth-r.left+6)+'px';abreEspaco()}else{b.style.position='';b.style.right='';b.style.top=''}}
  posiciona();setTimeout(posiciona,300);window.addEventListener('resize',posiciona)}
 new MutationObserver(function(){if(!document.getElementById('uvs-fotos')&&document.getElementById('uvs-botao'))poeBotao()}).observe(document.documentElement,{childList:true,subtree:true});
 window.UvsFotosPDF={gerar:gerar,pdf:pdf,reduz:reduz,adaptadores:A};
})();
