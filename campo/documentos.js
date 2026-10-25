/* Checklist de documentos (pedido de 25/10/2026). Cartão logo após o de identificação, na grade de
   seções do roteiro, que abre a lista dos documentos que o estabelecimento deve ter, por tipo — da
   licença aos POPs. Cada documento: Apresentado, Pendente ou Não se aplica; observação (digitada ou
   ditada); foto; e, em “O que deve conter”, o conteúdo esperado e o texto do dispositivo legal.
   É lista para não esquecer o que pedir e para dividir a inspeção (área física e documentação):
   não analisa o documento, não capitula infração, não entra no progresso nem nos relatórios do
   roteiro. Sai em relatório próprio (Word) e em texto para copiar; exporta e importa a marcação
   (arquivo .json) para juntar o trabalho feito em outro aparelho.
   Dados: window.__uvsDocs, posto pela casca só com a lista do roteiro aberto
   (campo/documentos-dados.json, gerado por scripts/documentos-checklist.cjs).
   Marcação: localStorage 'uvs-docs-<roteiro>' (entra na inspeção salva). Fotos: banco de
   evidências (roteiro-evidencias-v1), com o prefixo de fotos do roteiro + 'checklist-documentos'. */
(function(){
 'use strict';
 if(window.__uvsDocsOn)return;window.__uvsDocsOn=true;
 var D=window.__uvsDocs,APP=window.__uvsApp||'';
 if(!D||!APP)return;
 var CH='uvs-docs-'+APP,EVI='roteiro-evidencias-v1';
 var PAI=(function(){try{return window.parent&&window.parent!==window&&window.parent.UvisSalvas?window.parent:null}catch(e){return null}})();
 var ST={s:{a:'Apresentado',p:'Pendente',n:'Não se aplica'}};
 function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function agora(){return new Date().toISOString()}
 function dataBr(iso){try{var d=iso?new Date(iso):new Date();return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}catch(e){return ''}}
 function novoId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}

 /* ---------- lista do roteiro (e da modalidade, quando houver) ---------- */
 function modAtual(){
  if(!D.modalidades)return '';
  var ks=Object.keys(D.modalidades),m='';
  try{if(typeof current!=='undefined'&&current&&current.id)m=current.id}catch(e){}
  if(!m)try{m=JSON.parse(localStorage.getItem('uvis-produtos-v2')||'{}').profile.type}catch(e){}
  return ks.indexOf(m)>=0?m:ks[0]}
 function lista(){var m=modAtual();return m?D.modalidades[m].lista:D.lista}
 function grupos(){var m=modAtual();return (m&&D.modalidades[m].grupos)||D.grupos}
 function chave(d){var m=modAtual();return (m?m+':':'')+d.id}
 function nomeRoteiro(){var c=null;try{c=PAI&&PAI.UvisSalvas.CFG[APP]}catch(e){}var m=modAtual();return ((c&&c.nome)||document.title||APP)+(m?' — '+D.modalidades[m].nome:'')}
 function citacao(d){var por={},ordem=[];d.r.forEach(function(r){var t=D.textos[r];if(!t)return;if(!por[t.norma]){por[t.norma]=[];ordem.push(t.norma)}if(por[t.norma].indexOf(t.disp)<0)por[t.norma].push(t.disp)});
  return ordem.map(function(n){return n+', '+por[n].join('; ')}).join('; ')}

 /* ---------- marcação ---------- */
 function le(){try{var o=JSON.parse(localStorage.getItem(CH)||'{}');if(o&&typeof o==='object'){o.itens=o.itens||{};return o}}catch(e){}return {itens:{}}}
 function grava(o){o.alterado=agora();try{localStorage.setItem(CH,JSON.stringify(o))}catch(e){aviso('Não foi possível gravar: '+e.message)}atualizaCartao()}
 function item(o,k){return o.itens[k]||(o.itens[k]={s:'',nota:'',fotos:[],t:''})}
 function conta(){var o=le(),c={a:0,p:0,n:0,x:0,tot:0};lista().forEach(function(d){var i=o.itens[chave(d)];c.tot++;if(i&&c[i.s]!=null)c[i.s]++;else c.x++});return c}

 /* ---------- fotos ---------- */
 function escopo(){var c=null;try{c=PAI&&PAI.UvisSalvas.CFG[APP]}catch(e){}var p=c&&c.fotos&&c.fotos[0];return (p||APP+'-campo-')+'checklist-documentos'}
 function idb(modo,fn){return new Promise(function(ok,no){var r=indexedDB.open(EVI,1);r.onupgradeneeded=function(){if(!r.result.objectStoreNames.contains('photos'))r.result.createObjectStore('photos',{keyPath:'key'})};
  r.onerror=function(){no(r.error)};r.onsuccess=function(){var db=r.result,t=db.transaction('photos',modo),s=t.objectStore('photos'),res,q=fn(s);if(q)q.onsuccess=function(){res=q.result};t.oncomplete=function(){db.close();ok(res)};t.onerror=function(){db.close();no(t.error)}}})}
 function gravaFoto(id,u){var sc=escopo();return idb('readwrite',function(s){return s.put({key:sc+'|'+id,scope:sc,id:id,dataUrl:u})})}
 function leFoto(id){var sc=escopo();return idb('readonly',function(s){return s.get(sc+'|'+id)}).then(function(r){return r&&r.dataUrl}).catch(function(){return null})}
 function apagaFoto(id){var sc=escopo();return idb('readwrite',function(s){return s.delete(sc+'|'+id)}).catch(function(){})}
 function reduz(file){return new Promise(function(ok,no){var u=URL.createObjectURL(file),im=new Image();im.onload=function(){var k=Math.min(1,1600/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.82))};im.onerror=function(){URL.revokeObjectURL(u);no(Error('Não foi possível abrir a imagem.'))};im.src=u})}

 /* ---------- estilo ---------- */
 var css=document.createElement('style');css.id='uvs-docs-css';
 css.textContent='.uvs-docs-card{display:flex;align-items:center;gap:12px;width:100%;min-height:74px;padding:14px 16px;text-align:left;font:inherit;color:inherit;cursor:pointer;border:1.5px dashed var(--uvis-theme,#2f6f73);border-radius:14px;background:color-mix(in srgb,var(--uvis-theme,#2f6f73) 6%,#fff)}'
  +'.uvs-docs-card.uvs-docs-card{border:1.5px dashed var(--uvis-theme,#2f6f73)!important;background:color-mix(in srgb,var(--uvis-theme,#2f6f73) 6%,#fff)!important;box-shadow:none!important}'
  +'.uvs-docs-card .ic{font-size:1.5rem;line-height:1}.uvs-docs-card b{display:block;font-size:1rem}.uvs-docs-card small{display:block;margin-top:2px;color:#5d6e7a;font-size:.8rem}'
  +'.uvs-docs-card .tag{margin-left:auto;font-size:.7rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--uvis-theme,#2f6f73);white-space:nowrap}'
  +'#uvs-docs{position:fixed;inset:0;z-index:99990;background:#f4f5f7;color:#1d2b33;overflow:auto;-webkit-overflow-scrolling:touch;font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}'
  +'#uvs-docs .cab{position:sticky;top:0;z-index:2;background:#fff;border-bottom:1px solid #dde2e6;padding:10px 16px calc(10px) max(16px,env(safe-area-inset-left))}'
  +'#uvs-docs .cab .l1{display:flex;align-items:center;gap:10px}#uvs-docs h2{margin:0;font-size:1.1rem;flex:1}#uvs-docs .cab small{color:#5d6e7a}'
  +'#uvs-docs .bar{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#uvs-docs .b{min-height:40px;padding:8px 12px;border:1px solid #c9d1d7;border-radius:10px;background:#fff;font:inherit;font-size:.86rem;cursor:pointer;color:inherit}'
  +'#uvs-docs .b.pri{background:var(--uvis-theme,#2f6f73);border-color:var(--uvis-theme,#2f6f73);color:#fff}#uvs-docs .b.on{outline:2px solid var(--uvis-theme,#2f6f73)}'
  +'#uvs-docs .corpo{max-width:900px;margin:0 auto;padding:12px 16px 80px}#uvs-docs .nota-geral{font-size:.84rem;color:#5d6e7a;margin:4px 0 10px}'
  +'#uvs-docs .resumo{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}#uvs-docs .resumo span{padding:4px 10px;border-radius:999px;background:#fff;border:1px solid #dde2e6;font-size:.8rem}'
  +'#uvs-docs label.f{display:block;font-size:.8rem;color:#5d6e7a;margin:6px 0}#uvs-docs label.f input{display:block;width:100%;box-sizing:border-box;margin-top:3px;padding:9px 10px;border:1px solid #c9d1d7;border-radius:9px;font:inherit}'
  +'#uvs-docs section{margin:16px 0}#uvs-docs h3{font-size:.95rem;margin:0 0 6px;display:flex;gap:8px;align-items:baseline}#uvs-docs h3 small{font-weight:400;color:#5d6e7a}'
  +'#uvs-docs .d{background:#fff;border:1px solid #dde2e6;border-left:4px solid #c9d1d7;border-radius:12px;padding:10px 12px;margin:8px 0}'
  +'#uvs-docs .d[data-s=a]{border-left-color:#13764f}#uvs-docs .d[data-s=p]{border-left-color:#b03749}#uvs-docs .d[data-s=n]{border-left-color:#5d6e7a}'
  +'#uvs-docs .d .nm b{display:block}#uvs-docs .d .nm small{display:block;color:#5d6e7a;font-size:.78rem;margin-top:2px}'
  +'#uvs-docs .st{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}#uvs-docs .st button{flex:1;min-width:110px;min-height:40px;border:1px solid #c9d1d7;border-radius:9px;background:#fff;font:inherit;font-size:.84rem;cursor:pointer;color:inherit}'
  +'#uvs-docs .st button[data-s=a].on{background:#13764f;border-color:#13764f;color:#fff}#uvs-docs .st button[data-s=p].on{background:#b03749;border-color:#b03749;color:#fff}#uvs-docs .st button[data-s=n].on{background:#5d6e7a;border-color:#5d6e7a;color:#fff}'
  +'#uvs-docs textarea{display:block;width:100%;box-sizing:border-box;min-height:40px;padding:8px 10px;border:1px solid #c9d1d7;border-radius:9px;font:inherit;font-size:.88rem;resize:vertical}'
  +'#uvs-docs .ac{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:6px}#uvs-docs .ac .b{min-height:36px;padding:6px 10px}'
  +'#uvs-docs .th{position:relative;display:inline-block}#uvs-docs .th img{width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #dde2e6;display:block}#uvs-docs .th button{position:absolute;top:-6px;right:-6px;width:24px;height:24px;border-radius:50%;border:0;background:#b03749;color:#fff;cursor:pointer;line-height:1}'
  +'#uvs-docs .info{margin-top:8px;padding:10px 12px;background:#f7f9fa;border-radius:9px;font-size:.86rem}#uvs-docs .info h4{margin:8px 0 4px;font-size:.82rem}#uvs-docs .info p{margin:0 0 6px}'
  +'#uvs-docs details{margin:4px 0}#uvs-docs summary{cursor:pointer;font-weight:600}#uvs-docs pre{white-space:pre-wrap;font:inherit;font-size:.82rem;margin:6px 0;padding:8px;background:#fff;border:1px solid #e3e7ea;border-radius:8px}'
  +'#uvs-docs .msg{margin:8px 0;padding:10px 12px;border-radius:9px;background:#fff6e0;border:1px solid #e8cf8a;font-size:.86rem;white-space:pre-line}'
  +'#uvs-docs .vazio{color:#5d6e7a;font-size:.86rem}'
  +'@media(max-width:520px){#uvs-docs .st button{min-width:0;padding:0 4px;font-size:.78rem}#uvs-docs .cab,#uvs-docs .corpo{padding-left:12px;padding-right:12px}}';
 (document.head||document.documentElement).appendChild(css);

 /* ---------- cartão na grade de seções ---------- */
 var GRADES=['.pu-secoes-grade','#cardGrid','.dist-card-menu','.ui-card-grid'];
 function grade(){for(var i=0;i<GRADES.length;i++){var l=document.querySelectorAll(GRADES[i]);for(var j=0;j<l.length;j++)if(l[j].offsetParent&&l[j].children.length&&!l[j].closest('#uvs-docs'))return l[j]}return null}
 function textoCartao(){var c=conta(),f=c.a+c.p+c.n;return f+' de '+c.tot+' conferidos'+(c.p?' · '+c.p+' pendente'+(c.p>1?'s':''):'')}
 function atualizaCartao(){[].forEach.call(document.querySelectorAll('.uvs-docs-card small'),function(s){s.textContent=textoCartao()})}
 function poeCartao(){var g=grade();if(!g||g.querySelector('.uvs-docs-card'))return;
  var b=document.createElement('button');b.type='button';b.className='uvs-docs-card';b.setAttribute('data-uvs-docs','');
  b.innerHTML='<span class="ic" aria-hidden="true">📋</span><span><b>Checklist de documentos</b><small>'+esc(textoCartao())+'</small></span><span class="tag">À parte do roteiro</span>';
  b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();abre()});
  var p=g.firstElementChild;if(p&&p.nextSibling)g.insertBefore(b,p.nextSibling);else g.appendChild(b)}
 var tm=0;new MutationObserver(function(){if(tm)return;tm=setTimeout(function(){tm=0;poeCartao()},250)}).observe(document.documentElement,{childList:true,subtree:true});
 setTimeout(poeCartao,300);

 /* ---------- painel ---------- */
 var filtro='',msg='';
 function aviso(t){msg=t;var m=document.querySelector('#uvs-docs .msg-box');if(m)m.innerHTML=t?'<div class="msg">'+esc(t)+'</div>':''}
 function abre(){var p=document.getElementById('uvs-docs');if(!p){p=document.createElement('div');p.id='uvs-docs';p.setAttribute('role','dialog');p.setAttribute('aria-label','Checklist de documentos');document.body.appendChild(p);liga(p)}
  var o=le();if(!o.estab){try{var n=window.__uvsNomeEstab&&window.__uvsNomeEstab();if(n){o.estab=n;localStorage.setItem(CH,JSON.stringify(o))}}catch(e){}}
  msg='';desenha();document.documentElement.style.overflow='hidden'}
 function fecha(){var p=document.getElementById('uvs-docs');if(p)p.remove();document.documentElement.style.overflow='';atualizaCartao()}
 function desenha(){var p=document.getElementById('uvs-docs');if(!p)return;var o=le(),c=conta(),gs=grupos(),l=lista(),y=p.scrollTop;
  var h='<div class="cab"><div class="l1"><h2>📋 Checklist de documentos</h2><button type="button" class="b" data-a="fecha">Voltar ao roteiro</button></div><small>'+esc(nomeRoteiro())+'</small>'
   +'<div class="bar"><button type="button" class="b pri" data-a="word">Relatório (Word)</button><button type="button" class="b" data-a="copia">Copiar texto</button><button type="button" class="b" data-a="exporta">Exportar marcação</button><button type="button" class="b" data-a="importa">Importar de outro aparelho</button><input type="file" accept="application/json,.json" data-imp hidden></div></div>'
   +'<div class="corpo"><p class="nota-geral">Lista dos documentos que o estabelecimento deve ter, para pedir e conferir. Não substitui o roteiro: a análise do conteúdo e as infrações ficam nele. O relatório sai à parte.</p>'
   +'<label class="f">Estabelecimento<input type="text" data-estab value="'+esc(o.estab||'')+'" placeholder="Nome ou razão social"></label>'
   +'<div class="resumo"><span>✓ Apresentados: <b>'+c.a+'</b></span><span>⏳ Pendentes: <b>'+c.p+'</b></span><span>— Não se aplica: <b>'+c.n+'</b></span><span>Sem marcação: <b>'+c.x+'</b></span></div>'
   +'<div class="bar"><button type="button" class="b'+(filtro===''?' on':'')+'" data-f="">Todos</button><button type="button" class="b'+(filtro==='x'?' on':'')+'" data-f="x">Sem marcação</button><button type="button" class="b'+(filtro==='p'?' on':'')+'" data-f="p">Pendentes</button></div>'
   +'<div class="msg-box">'+(msg?'<div class="msg">'+esc(msg)+'</div>':'')+'</div>';
  gs.forEach(function(g){var ds=l.filter(function(d){return d.g===g[0]});if(!ds.length)return;
   var vis=ds.filter(function(d){var i=o.itens[chave(d)],s=i&&i.s||'';return !filtro||(filtro==='x'?!s:s===filtro)});
   var feitos=ds.filter(function(d){var i=o.itens[chave(d)];return i&&i.s}).length;
   if(!vis.length)return;
   h+='<section><h3>'+esc(g[1])+' <small>'+feitos+'/'+ds.length+'</small></h3>'+vis.map(function(d){return linha(d,o.itens[chave(d)]||{})}).join('')+'</section>'});
  if(filtro&&!l.some(function(d){var i=o.itens[chave(d)],s=i&&i.s||'';return filtro==='x'?!s:s===filtro}))h+='<p class="vazio">Nenhum documento neste filtro.</p>';
  p.innerHTML=h+'</div>';p.scrollTop=y;miniaturas(p)}
 function linha(d,i){var s=i.s||'',k=chave(d),cit=citacao(d);
  return '<div class="d" data-k="'+esc(k)+'" data-s="'+s+'"><div class="nm"><b>'+esc(d.n)+'</b>'+(d.q?'<small>Quando: '+esc(d.q.replace(/^Quando\s+/i,''))+'</small>':'')+(cit?'<small>'+esc(cit)+'</small>':'')+'</div>'
   +'<div class="st">'+['a','p','n'].map(function(x){return '<button type="button" data-s="'+x+'" class="'+(s===x?'on':'')+'" aria-pressed="'+(s===x)+'">'+({a:'✓ ',p:'⏳ ',n:'— '})[x]+ST.s[x]+'</button>'}).join('')+'</div>'
   +'<textarea data-nota rows="1" placeholder="Observação: número, validade, o que falta…">'+esc(i.nota||'')+'</textarea>'
   +'<div class="ac"><button type="button" class="b" data-a="info">O que deve conter</button><button type="button" class="b" data-a="foto">📷 Foto</button><input type="file" accept="image/*" capture="environment" data-foto-doc data-sem-marca hidden><span class="ths" data-ths="'+esc((i.fotos||[]).join(','))+'"></span></div>'
   +'<div class="info" hidden>'+(d.o?'<p>'+esc(d.o)+'</p>':'')+'<h4>Fundamento legal</h4>'+d.r.map(function(r){var t=D.textos[r];if(!t)return '';return '<details><summary>'+esc(t.norma+', '+t.disp)+'</summary><pre>'+esc(t.texto)+'</pre>'+(t.url?'<a href="'+esc(t.url)+'" target="_blank" rel="noopener">Fonte oficial</a>':'')+'</details>'}).join('')+'</div></div>'}
 function miniaturas(p){[].forEach.call(p.querySelectorAll('[data-ths]'),function(sp){var ids=sp.getAttribute('data-ths').split(',').filter(Boolean);sp.innerHTML='';ids.forEach(function(id){leFoto(id).then(function(u){if(!u)return;var e=document.createElement('span');e.className='th';e.innerHTML='<img alt="Foto do documento" src="'+u+'"><button type="button" data-a="tira-foto" data-id="'+esc(id)+'" aria-label="Excluir foto">×</button>';sp.appendChild(e)})})})}
 function docDe(el){var k=el.closest('.d')&&el.closest('.d').getAttribute('data-k');return k}
 function liga(p){
  p.addEventListener('click',function(e){var t=e.target.closest('button');if(!t)return;var a=t.getAttribute('data-a'),k=docDe(t);
   if(t.hasAttribute('data-f')){filtro=t.getAttribute('data-f');desenha();return}
   if(t.parentElement&&t.parentElement.classList.contains('st')&&k){var o=le(),i=item(o,k),s=t.getAttribute('data-s');i.s=i.s===s?'':s;i.t=agora();grava(o);desenha();return}
   if(a==='fecha')return fecha();
   if(a==='info'){var inf=t.closest('.d').querySelector('.info');inf.hidden=!inf.hidden;t.textContent=inf.hidden?'O que deve conter':'Ocultar';return}
   if(a==='foto'){t.parentElement.querySelector('[data-foto-doc]').click();return}
   if(a==='tira-foto'){var id=t.getAttribute('data-id'),o2=le(),i2=item(o2,k);i2.fotos=(i2.fotos||[]).filter(function(x){return x!==id});i2.t=agora();grava(o2);apagaFoto(id).then(desenha);return}
   if(a==='word')return word();
   if(a==='copia')return copia();
   if(a==='exporta')return exporta();
   if(a==='importa'){p.querySelector('[data-imp]').click();return}});
  p.addEventListener('input',function(e){var t=e.target;
   if(t.hasAttribute('data-estab')){var o=le();o.estab=t.value;grava(o);return}
   if(t.hasAttribute('data-nota')){var k=docDe(t);if(!k)return;var o2=le(),i=item(o2,k);i.nota=t.value;i.t=agora();grava(o2)}});
  p.addEventListener('change',function(e){var t=e.target;
   if(t.hasAttribute('data-foto-doc')&&t.files&&t.files[0]){var k=docDe(t),f=t.files[0];t.value='';reduz(f).then(function(u){var id=novoId();return gravaFoto(id,u).then(function(){var o=le(),i=item(o,k);i.fotos=(i.fotos||[]).concat(id);i.t=agora();grava(o);desenha()})}).catch(function(er){aviso(er.message)});return}
   if(t.hasAttribute('data-imp')&&t.files&&t.files[0]){var f2=t.files[0];t.value='';f2.text().then(importa).catch(function(er){aviso('Arquivo inválido: '+er.message)})}})}

 /* ---------- texto (copiar) e Word ---------- */
 function secoes(){var o=le(),out={a:[],p:[],n:[],x:[]},gs=grupos();
  gs.forEach(function(g){lista().filter(function(d){return d.g===g[0]}).forEach(function(d){var i=o.itens[chave(d)]||{};out[i.s&&out[i.s]?i.s:'x'].push({d:d,i:i,g:g[1]})})});return out}
 var TIT={a:'Documentos apresentados',p:'Documentos pendentes',n:'Não se aplica',x:'Não conferidos'};
 function copia(){var s=secoes(),o=le(),t=['CHECKLIST DE DOCUMENTOS',nomeRoteiro(),(o.estab?'Estabelecimento: '+o.estab:''),'Data: '+dataBr(),''];
  ['a','p','n','x'].forEach(function(k){if(!s[k].length)return;t.push(TIT[k]+' ('+s[k].length+'):');s[k].forEach(function(x){t.push('- '+x.d.n+(x.i.nota?' — '+x.i.nota.trim():''))});t.push('')});
  var txt=t.filter(function(x,i){return x||t[i-1]}).join('\n');
  (navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(txt):Promise.reject()).then(function(){aviso('Texto copiado. Cole no roteiro (observações) ou onde precisar.')}).catch(function(){var ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');aviso('Texto copiado.')}catch(e){aviso('Não foi possível copiar.')}ta.remove()});
  return txt}
 window.__uvsDocsTexto=function(){var s=secoes(),o=le(),t=[];['a','p','n','x'].forEach(function(k){if(s[k].length){t.push(TIT[k]+':');s[k].forEach(function(x){t.push('- '+x.d.n+(x.i.nota?' — '+x.i.nota.trim():''))})}});return (o.estab||'')+'\n'+t.join('\n')};

 /* DOCX mínimo (ZIP sem compressão), independente do motor de documentos do roteiro */
 var CRC=(function(){var t=[],c;for(var n=0;n<256;n++){c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
 function crc32(u){var c=0xFFFFFFFF;for(var i=0;i<u.length;i++)c=CRC[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
 function zip(arqs){var enc=new TextEncoder(),partes=[],cen=[],off=0;
  arqs.forEach(function(f){var nome=enc.encode(f.n),d=typeof f.d==='string'?enc.encode(f.d):f.d,cr=crc32(d),h=new DataView(new ArrayBuffer(30));
   h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(8,0,true);h.setUint32(14,cr,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,nome.length,true);
   partes.push(new Uint8Array(h.buffer),nome,d);
   var c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint32(16,cr,true);c.setUint32(20,d.length,true);c.setUint32(24,d.length,true);c.setUint16(28,nome.length,true);c.setUint32(42,off,true);
   cen.push(new Uint8Array(c.buffer),nome);off+=30+nome.length+d.length});
  var tam=cen.reduce(function(s,x){return s+x.length},0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,arqs.length,true);e.setUint16(10,arqs.length,true);e.setUint32(12,tam,true);e.setUint32(16,off,true);
  return new Blob(partes.concat(cen,[new Uint8Array(e.buffer)]),{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}
 function x(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]}).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'')}
 function par(t,o){o=o||{};var rpr=(o.b?'<w:b/>':'')+(o.i?'<w:i/>':'')+(o.cor?'<w:color w:val="'+o.cor+'"/>':'')+'<w:sz w:val="'+(o.sz||22)+'"/>';
  return '<w:p><w:pPr>'+(o.jc?'<w:jc w:val="'+o.jc+'"/>':'')+'<w:spacing w:before="'+(o.antes||0)+'" w:after="'+(o.depois==null?80:o.depois)+'"/>'+(o.rec?'<w:ind w:left="'+o.rec+'"/>':'')+'</w:pPr>'
   +String(t).split('\n').map(function(l,i){return '<w:r><w:rPr>'+rpr+'</w:rPr>'+(i?'<w:br/>':'')+'<w:t xml:space="preserve">'+x(l)+'</w:t></w:r>'}).join('')+'</w:p>'}
 function imgPar(rid,n,w,h){var cx=Math.round(w*9525),cy=Math.round(h*9525);
  return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="'+cx+'" cy="'+cy+'"/><wp:docPr id="'+n+'" name="Foto '+n+'"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="'+n+'" name="foto'+n+'.jpeg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>'}
 function dim(u){return new Promise(function(ok){var im=new Image();im.onload=function(){ok([im.naturalWidth,im.naturalHeight])};im.onerror=function(){ok([4,3])};im.src=u})}
 function bytes(u){var b=atob(u.split(',')[1]),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
 function docx(){var s=secoes(),o=le(),c=conta(),corpo=[],midia=[],rels=[],n=0;
  corpo.push(par('CHECKLIST DE DOCUMENTOS',{b:true,sz:30,jc:'center',depois:60}),par(nomeRoteiro(),{jc:'center',sz:22,depois:200}));
  if(o.estab)corpo.push(par('Estabelecimento: '+o.estab,{b:true}));
  corpo.push(par('Data: '+dataBr()),par('Apresentados: '+c.a+'   ·   Pendentes: '+c.p+'   ·   Não se aplica: '+c.n+'   ·   Não conferidos: '+c.x,{depois:160}),
   par('Relação dos documentos solicitados e conferidos na inspeção. Não constitui análise do conteúdo dos documentos nem capitulação de infração; a avaliação consta do roteiro.',{i:true,sz:18,cor:'5D6E7A',depois:200}));
  var tarefas=[];
  ['a','p','n','x'].forEach(function(k){if(!s[k].length)return;corpo.push(par(TIT[k]+' ('+s[k].length+')',{b:true,sz:26,antes:200,depois:100}));var g='';
   s[k].forEach(function(e){if(e.g!==g){g=e.g;corpo.push(par(g,{b:true,sz:20,cor:'5D6E7A',antes:80,depois:40}))}
    corpo.push(par('– '+e.d.n,{rec:240,depois:20}));
    if(k==='p'){var cit=citacao(e.d);if(cit)corpo.push(par('Fundamento: '+cit,{rec:480,sz:18,cor:'5D6E7A',depois:20}))}
    if(e.i.nota&&e.i.nota.trim())corpo.push(par('Observação: '+e.i.nota.trim(),{rec:480,sz:20,depois:20}));
    if(k!=='x'&&e.i.fotos&&e.i.fotos.length){var lugar=corpo.length;corpo.push('');tarefas.push({lugar:lugar,fotos:e.i.fotos})}});
  });
  return Promise.all(tarefas.map(function(tf){return Promise.all(tf.fotos.map(leFoto)).then(function(us){us=us.filter(Boolean);return Promise.all(us.map(dim)).then(function(ds){
    var runs=us.map(function(u,i){n++;var rid='rIdImg'+n,w=Math.min(220,ds[i][0]),h=Math.round(w*ds[i][1]/ds[i][0]);midia.push({n:'word/media/foto'+n+'.jpeg',d:bytes(u)});rels.push('<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/foto'+n+'.jpeg"/>');return imgPar(rid,n,w,h)+'<w:r><w:t xml:space="preserve"> </w:t></w:r>'}).join('');
    corpo[tf.lugar]=runs?'<w:p><w:pPr><w:ind w:left="480"/><w:spacing w:after="80"/></w:pPr>'+runs+'</w:p>':''})})})).then(function(){
   var doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>'
    +corpo.join('')+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1418" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>';
   return zip([
    {n:'[Content_Types].xml',d:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'},
    {n:'_rels/.rels',d:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
    {n:'word/document.xml',d:doc},
    {n:'word/_rels/document.xml.rels',d:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+rels.join('')+'</Relationships>'}
   ].concat(midia))})}
 function nomeArq(base,ext){var e=String(le().estab||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40);return base+(e?'_'+e:'')+'_'+new Date().toISOString().slice(0,10)+ext}
 function baixa(blob,nome){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=nome;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},2000)}
 window.__uvsDocsDocx=docx;
 function word(){aviso('Gerando o relatório…');docx().then(function(b){baixa(b,nomeArq('Checklist_documentos','.docx'));aviso('Relatório gerado.')}).catch(function(e){aviso('Não foi possível gerar o relatório: '+e.message)})}

 /* ---------- exportar e importar (equipe dividida) ---------- */
 function pacote(){var o=le(),l=lista(),itens={},ids=[];l.forEach(function(d){var k=chave(d),i=o.itens[k];if(i&&(i.s||i.nota||(i.fotos||[]).length)){itens[k]=i;ids=ids.concat(i.fotos||[])}});
  return Promise.all(ids.map(function(id){return leFoto(id).then(function(u){return [id,u]})})).then(function(ps){var fotos={};ps.forEach(function(p){if(p[1])fotos[p[0]]=p[1]});
   return {formato:'uvs-checklist-documentos',versao:1,roteiro:APP,modalidade:modAtual(),estab:o.estab||'',exportado:agora(),itens:itens,fotos:fotos}})}
 window.__uvsDocsPacote=pacote;
 function exporta(){pacote().then(function(pk){var n=Object.keys(pk.itens).length;if(!n)return aviso('Nada marcado ainda para exportar.');
  var blob=new Blob([JSON.stringify(pk)],{type:'application/json'}),nome=nomeArq('Checklist_documentos','.json');
  var f=null;try{f=new File([blob],nome,{type:'application/json'})}catch(e){}
  if(f&&navigator.canShare&&navigator.canShare({files:[f]}))navigator.share({files:[f],title:'Checklist de documentos'}).catch(function(){baixa(blob,nome)});else baixa(blob,nome);
  aviso(n+' documento(s) exportado(s). No outro aparelho, abra o mesmo roteiro e use “Importar de outro aparelho”.')})}
 /* junta: vale a marcação mais recente de cada documento; quando os dois aparelhos marcaram o
    mesmo documento de forma diferente, fica a mais recente e o conflito é avisado */
 function importa(txt){var pk=typeof txt==='string'?JSON.parse(txt):txt;
  if(!pk||pk.formato!=='uvs-checklist-documentos')throw Error('não é uma exportação do checklist de documentos.');
  if(pk.roteiro!==APP)throw Error('o arquivo é de outro roteiro ('+pk.roteiro+').');
  var o=le(),novos=0,atual=0,mantidos=0,conf=[],fotos=[],nomes={};lista().forEach(function(d){nomes[chave(d)]=d.n});
  Object.keys(pk.itens||{}).forEach(function(k){if(!nomes[k])return;var r=pk.itens[k],l=o.itens[k];
   var difere=l&&l.s&&r.s&&l.s!==r.s;
   if(!l||(!l.s&&!l.nota&&!(l.fotos||[]).length)){o.itens[k]=r;novos++;fotos=fotos.concat(r.fotos||[])}
   else if(String(r.t||'')>String(l.t||'')){if(difere)conf.push(nomes[k]+': ficou “'+ST.s[r.s]+'” (outro aparelho, mais recente); aqui estava “'+ST.s[l.s]+'”');
    var fs=(l.fotos||[]).concat((r.fotos||[]).filter(function(x){return (l.fotos||[]).indexOf(x)<0}));
    var nota=l.nota&&r.nota&&l.nota.trim()!==r.nota.trim()&&r.nota.indexOf(l.nota.trim())<0?r.nota+'\n'+l.nota:(r.nota||l.nota||'');
    o.itens[k]={s:r.s,nota:nota,fotos:fs,t:r.t};atual++;fotos=fotos.concat(r.fotos||[])}
   else{if(difere)conf.push(nomes[k]+': ficou “'+ST.s[l.s]+'” (este aparelho, mais recente); no outro estava “'+ST.s[r.s]+'”');
    var fs2=(r.fotos||[]).filter(function(x){return (l.fotos||[]).indexOf(x)<0});if(fs2.length){l.fotos=(l.fotos||[]).concat(fs2);fotos=fotos.concat(fs2)}mantidos++}});
  if(!o.estab&&pk.estab)o.estab=pk.estab;
  return Promise.all(fotos.filter(function(id){return pk.fotos&&pk.fotos[id]}).map(function(id){return gravaFoto(id,pk.fotos[id])})).then(function(){grava(o);
   var t='Importado: '+novos+' novo(s), '+atual+' atualizado(s), '+mantidos+' mantido(s) daqui.'+(conf.length?'\nConflitos ('+conf.length+'), confira:\n'+conf.join('\n'):'');
   msg=t;desenha();return {novos:novos,atual:atual,mantidos:mantidos,conflitos:conf}})}
 window.__uvsDocsImporta=importa;
 window.__uvsDocsAbre=abre;
})();
