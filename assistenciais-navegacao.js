/* ——— Serviços assistenciais: navegação simplificada ———
   São inspeções simples. Três abas fixas, como nos demais roteiros:
   Roteiro · Infrações · Relatório. Dentro do Roteiro, atalhos para
   Documentos, Inspeção e (quando existe) Dimensionamento de pessoal.
   O cabeçalho do serviço fica compacto: enquadramento, alerta e CNAE
   vão para “Sobre este serviço”. Contagem única em cada grupo. */
(function(){
 if(window.__assistNav)return;window.__assistNav=true;
 var SUB=[['doc','Documentos'],['rot','Inspeção'],['calc','Dimensionamento de pessoal']];
 function naRoteiro(){return tab==='doc'||tab==='rot'||tab==='calc'}
 tabDefs=function(){return [['rot','Roteiro'],['inf','Infrações'],['relatorio','Relatório']]};
 renderTabs=function(){
  var sel=naRoteiro()?'rot':tab;
  $('#tabs').innerHTML=tabDefs().map(function(d){return '<button class="tab" aria-selected="'+(sel===d[0])+'" data-tab="'+d[0]+'">'+d[1]+'</button>'}).join('');
  $$('[data-tab]').forEach(function(b){b.onclick=function(){var t=b.dataset.tab;tab=(t==='rot'&&naRoteiro())?tab:(t==='rot'?'doc':t);query='';openGroups.clear();render()}});
 };
 function subnav(){
  var c=$('#content');if(!c||!current||!naRoteiro()||c.querySelector('.an-sub'))return;
  var opts=SUB.filter(function(s){return s[0]!=='calc'||current.calc});
  c.insertAdjacentHTML('afterbegin','<nav class="an-sub" aria-label="Partes do roteiro">'+opts.map(function(s){return '<button type="button" data-an-sub="'+s[0]+'" aria-current="'+(tab===s[0])+'">'+s[1]+'</button>'}).join('')+'</nav>');
 }
 function compacta(){
  var h=document.querySelector('#app .service-head');if(!h||h.querySelector('.an-sobre'))return;
  var mov=[].slice.call(h.children).filter(function(e){return e.tagName==='P'||e.classList.contains('notice')||e.classList.contains('cnae')});
  if(!mov.length)return;
  var d=document.createElement('details');d.className='an-sobre';d.innerHTML='<summary>Sobre este serviço — enquadramento, norma e CNAE</summary>';
  mov.forEach(function(e){d.appendChild(e)});
  var top=h.querySelector('.service-head-top');(top&&top.nextSibling)?h.insertBefore(d,top.nextSibling):h.appendChild(d);
 }
 var oR=render;render=function(){var r=oR.apply(this,arguments);try{compacta();subnav()}catch(e){}return r};
 var oL=renderList;renderList=function(){var r=oL.apply(this,arguments);try{subnav()}catch(e){}return r};
 var oC=renderCalc;renderCalc=function(){var r=oC.apply(this,arguments);try{subnav()}catch(e){}return r};
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-an-sub]');if(!b)return;tab=b.dataset.anSub;query='';openGroups.clear();render();window.scrollTo(0,0)});
 document.head.insertAdjacentHTML('beforeend','<style id="an-style">.an-sub{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0 4px}.an-sub button{flex:1 1 auto;min-height:42px;padding:8px 12px;border:1px solid #c9d5dd;border-radius:10px;background:#fff;color:#35505f;font:600 .88rem/1.2 inherit;cursor:pointer}.an-sub button[aria-current="true"]{background:#2f3b45;border-color:#2f3b45;color:#fff}.an-sobre{margin:10px 0;border:1px solid #e3e8ec;border-radius:10px;padding:0 12px;background:#fafbfc}.an-sobre>summary{cursor:pointer;padding:10px 0;font-weight:700;font-size:.9rem;color:#4b5d68}.an-sobre[open]{padding-bottom:10px}.group h3 small{display:none}</style>');
 try{if(current)render()}catch(e){}
})();
