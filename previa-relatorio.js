/* ——— “Como sai no relatório”: prévia por item, em todos os roteiros ———
   Como funciona: a cada resposta, o texto do relatório é gerado de novo e
   comparado com o anterior; as frases que surgiram ficam associadas ao item
   que estava aberto. A prévia do item mostra essas frases, na ordem do
   relatório, desde que continuem no relatório atual (resposta desfeita ou
   alterada = frase antiga some). Enquanto o item não tiver frases
   associadas (ex.: inspeção iniciada antes desta versão), a prévia mostra a
   seção do relatório com o mesmo título do item, quando houver.
   A associação fica em localStorage (uvis-previa-<roteiro>) e vai junto nas
   inspeções salvas. Não altera o relatório.
   Cada roteiro tem um adaptador: linhas() = texto atual do relatório
   [{x, h?}] (h = título) e item() = {chave, titulo, alvo} do item aberto.
   Inserido nos módulos por scripts/repack-previa.cjs. */
(function(){
 'use strict';
 if(window.__uvsPrevia)return;window.__uvsPrevia=true;
 function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function norm(t){return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/^\s*(?:se[cç][aã]o\s*)?\d+(?:\.\d+)*\s*[.·—–-]?\s*/i,'').replace(/\s+/g,' ').trim().toLowerCase()}
 function txt(e){return e?String(e.textContent||'').replace(/\s+/g,' ').trim():''}
 function limpa(t){return String(t==null?'':t).replace(/\s+/g,' ').trim()}
 /* linhas de um relatório em HTML (renderizado fora da tela) */
 function linhasHtml(raiz){var out=[];if(!raiz)return out;
  raiz.querySelectorAll('h1,h2,h3,h4,p,li,tr,dt,dd,.kv').forEach(function(e){
   if(e.closest('li')&&e.tagName!=='LI')return;if(e.tagName==='P'&&e.closest('td,th'))return;
   var x=limpa(e.tagName==='TR'?[].map.call(e.children,function(c){return limpa(c.textContent)}).filter(Boolean).join(' · '):e.textContent);
   if(x)out.push({x:x,h:/^H[1-4]$/.test(e.tagName)})});return out}
 function linhasTexto(s){return String(s||'').split(/\n+/).map(limpa).filter(Boolean).map(function(x){return {x:x,h:/^(\d+(\.\d+)*\.?\s+)?[A-ZÀ-Ú0-9 ,/()–—-]{6,}$/.test(x)&&x===x.toUpperCase()}})}
 var $=function(s,r){return (r||document).querySelector(s)};

 /* ---------------- adaptadores ---------------- */
 function blocos(bs){var out=[];(bs||[]).forEach(function(b){if(!b)return;
   if(b.t==='h1'||b.t==='h2'||b.t==='h3')out.push({x:limpa(b.x),h:true});else if(b.t==='kv')out.push({x:limpa(b.k)+': '+limpa(b.v)});else if(b.x)out.push({x:limpa(b.x)})});return out}
 function visivel(e){return !!(e&&(e.offsetParent||e.getClientRects().length))}
 /* camada de três níveis da casca (Odontologia, Alimentos, Produtos): o item é a etapa aberta */
 function itemN3(){var e=window.__n3estado;if(!e||!e.item)return null;var tela=[].filter.call(document.querySelectorAll('.n3-tela'),visivel)[0];if(!tela)return null;
  var h=tela.querySelector('h2,h3');return {chave:'n3:'+(e.bloco||'')+'|'+e.item,titulo:txt(h),alvo:tela}}
 var A={
  'drogaria':{
   ok:function(){return window.DrogariaAPI&&DrogariaAPI.report},
   linhas:function(){var r=DrogariaAPI.report(),out=blocos(r&&r.blocks);
    (r&&r.irregularities||[]).forEach(function(x){if(x.frase_relatorio)out.push({x:limpa(x.frase_relatorio)})});return out},
   item:function(){var tela=$('#content .drg-item-screen'),chip=$('#content .lvl-chips [aria-current="step"]');
    if(tela&&chip)return {chave:'item:'+(chip.dataset.drgItem||txt(chip)),titulo:txt(chip),alvo:tela};
    var pn=$('#content .sd-panel')||$('#content .fb-panel'),aba=$('button[data-card][aria-current="page"]');
    if(pn&&aba)return {chave:'secao:'+aba.dataset.card,titulo:txt(aba).replace(/^SE[ÇC][ÃA]O\s*\d+\s*/i,''),alvo:pn};return null}
  },
  'distribuidoras-transportadoras':{
   ok:function(){return typeof reportText==='function'},
   linhas:function(){return linhasTexto(reportText())},
   item:function(){var chip=$('[data-dist-section][aria-current="step"]'),tela=$('.dist-section-screen');
    return chip&&visivel(tela)?{chave:'sec:'+chip.dataset.distSection,titulo:txt(chip),alvo:tela}:null}
  },
  'odontologia':{
   ok:function(){return typeof reportBlocks==='function'},
   linhas:function(){var o={};try{o=typeof opts==='function'?(opts().rep||{}):{}}catch(e){}return blocos(reportBlocks(o))},
   item:itemN3
  },
  'servicos-alimentacao-roteiro':{
   ok:function(){return typeof window.__uvsRelTexto==='function'},
   linhas:function(){return String(window.__uvsRelTexto()||'').split('\n').filter(function(l){return l.trim()}).map(function(l){return {x:limpa(l),h:!/^\s/.test(l)&&!/[:\]]/.test(l)}})},
   item:itemN3
  },
  'produtos-correlatos':{
   ok:function(){return typeof window.__uvsRelLinhas==='function'},
   linhas:function(){return window.__uvsRelLinhas()},
   item:itemN3
  },
  'servicos-assistenciais':{
   ok:function(){try{return typeof mark==='function'&&typeof status==='function'}catch(e){return false}},
   linhas:function(){var out=[];if(!current)return out;
    ['doc','rot'].forEach(function(k){(current[k]||[]).forEach(function(it,i){var st=mark(k,i);if(st)out.push({x:limpa(it.i)+' — '+status(k,st)+'. Base legal: '+limpa(it.l)})})});
    (current.inf||[]).forEach(function(it,i){if(mark('inf',i)==='SEL')out.push({x:'Infração selecionada: '+limpa(it.i)+' — '+limpa(it.l)})});return out},
   /* vários grupos podem estar abertos ao mesmo tempo: uma prévia por grupo aberto */
   itens:function(){var sc=typeof scope==='function'?scope():'';return [].filter.call(document.querySelectorAll('#content section.group'),function(g){return !g.classList.contains('closed')&&visivel(g)}).map(function(g){
     return {chave:sc+'|'+(typeof tab!=='undefined'?tab:'')+'|'+(g.dataset.groupSection||txt(g.querySelector('h3'))),titulo:g.dataset.groupSection||'',alvo:g.querySelector('.items')||g}})},
   chaveDe:function(t){var g=t&&t.closest&&t.closest('#content section.group');if(!g)return null;var sc=typeof scope==='function'?scope():'';return sc+'|'+(typeof tab!=='undefined'?tab:'')+'|'+(g.dataset.groupSection||txt(g.querySelector('h3')))}
  }
 };
 window.UvsPreviaAdaptadores=A;

 /* ---------------- núcleo ---------------- */
 function appAtual(){var d=document.documentElement.dataset.uvisApp||'';if(A[d])return d;for(var k in A)if(A[k].detecta&&A[k].detecta())return k;return ''}
 var app='',ad=null,CH='',mapa={},antes=null,itemEvt=null,abertos={},agendado=0,pintando=false;
 function carrega(){try{mapa=JSON.parse(localStorage.getItem(CH)||'{}')||{}}catch(e){mapa={}}}
 function grava(){try{localStorage.setItem(CH,JSON.stringify(mapa))}catch(e){}}
 function linhas(){try{return ad.linhas()||[]}catch(e){return null}}
 function itens(){try{var r=ad.itens?ad.itens():[ad.item()];return (r||[]).filter(function(x){return x&&x.alvo})}catch(e){return []}}
 function chaveDe(t){try{if(ad.chaveDe)return ad.chaveDe(t);var l=itens();return l.length===1?l[0].chave:null}catch(e){return null}}
 function conta(ls){var m={};ls.forEach(function(l){if(!l.h)m[l.x]=(m[l.x]||0)+1});return m}
 /* depois de uma ação do usuário: frases novas vão para o item em que ela ocorreu */
 function confere(){var ls=linhas();if(!ls)return;var agora=conta(ls);
  if(antes&&itemEvt){var novas=[],forma=function(x){return x.replace(/\d+/g,'#')},saiu={};
   Object.keys(antes).forEach(function(x){if(!agora[x])saiu[forma(x)]=x});
   Object.keys(agora).forEach(function(x){if(agora[x]>(antes[x]||0))novas.push(x)});
   var mudou=false;
   novas.forEach(function(x){var velha=saiu[forma(x)];
    /* frase que só trocou um número (contagens, totais): fica com quem já tinha a anterior */
    if(velha!==undefined){Object.keys(mapa).forEach(function(k){if(mapa[k].indexOf(velha)>=0&&mapa[k].indexOf(x)<0){mapa[k].push(x);mudou=true}});return}
    var l=mapa[itemEvt]||(mapa[itemEvt]=[]);if(l.indexOf(x)<0){l.push(x);mudou=true}});
   if(mudou){/* guarda só o que ainda está no relatório, para não crescer sem limite */
    Object.keys(mapa).forEach(function(k){mapa[k]=mapa[k].filter(function(x){return agora[x]}).slice(-300);if(!mapa[k].length)delete mapa[k]});grava()}}
  antes=agora;pintaTudo(ls)}
 function secaoPorTitulo(ls,titulo){var t=norm(titulo);if(!t)return [];var i=-1;
  for(var k=0;k<ls.length;k++)if(ls[k].h&&norm(ls[k].x)===t){i=k;break}
  if(i<0)for(k=0;k<ls.length;k++)if(ls[k].h&&t.length>5&&(norm(ls[k].x).indexOf(t)===0||t.indexOf(norm(ls[k].x))===0)&&norm(ls[k].x).length>5){i=k;break}
  if(i<0)return [];var out=[];for(k=i+1;k<ls.length&&!ls[k].h;k++)out.push(ls[k]);return out}
 /* trechos do próprio item (texto das perguntas) que o relatório repete */
 function trechos(alvo){var out={};[].forEach.call(alvo.querySelectorAll('*'),function(e){if(e.closest('.uvs-previa,.sm-box,details.legal,button,select,option,textarea,input'))return;
   if(e.children.length&&[].some.call(e.children,function(c){return /^(DIV|P|SECTION|ARTICLE|UL|LI|H\d)$/.test(c.tagName)}))return;
   var t=limpa(e.textContent);if(t.length>=25&&t.length<=500)out[t]=1});return Object.keys(out)}
 function corpo(ls,it){var minhas={},sel=[],titulo='';(mapa[it.chave]||[]).forEach(function(x){minhas[x]=1});
  var tr=trechos(it.alvo);
  ls.forEach(function(l){if(l.h){titulo=l.x;return}
   if(minhas[l.x]||tr.some(function(t){return l.x.indexOf(t)>=0})){sel.push({x:l.x,t:titulo})}});
  if(sel.length){var html='',ult=null,vistos={};sel.forEach(function(s){if(vistos[s.x])return;vistos[s.x]=1;if(s.t!==ult){if(s.t)html+='<p class="uvs-pv-h">'+esc(s.t)+'</p>';ult=s.t}html+='<p>'+esc(s.x)+'</p>'});return html}
  var sec=secaoPorTitulo(ls,it.titulo);
  if(sec.length)return '<p class="uvs-pv-nota">Trecho do relatório com o título deste item:</p>'+sec.map(function(l){return '<p>'+esc(l.x)+'</p>'}).join('');
  return '<p class="uvs-pv-nota">Nada deste item no relatório por enquanto. Ao responder, as frases que ele gerar aparecem aqui (itens conformes podem não gerar frase).</p>'}
 function pinta1(it,ls){var html=corpo(ls,it),box=it.alvo.querySelector(':scope > .uvs-previa'),sig=it.chave+'|'+html;
  if(box&&box.__sig===sig&&box===it.alvo.lastElementChild)return;
  if(!box){box=document.createElement('details');box.className='uvs-previa';box.addEventListener('toggle',function(){abertos[box.dataset.chave]=box.open})}
  box.dataset.chave=it.chave;box.open=!!abertos[it.chave];
  box.innerHTML='<summary>👁 Como sai no relatório</summary><div class="uvs-pv-corpo">'+html+'</div>';box.__sig=sig;
  if(box!==it.alvo.lastElementChild)it.alvo.appendChild(box)}
 function pintaTudo(ls){var l=itens();if(!l.length)return;ls=ls||linhas();if(!ls)return;pintando=true;
  try{l.forEach(function(it){pinta1(it,ls)})}finally{setTimeout(function(){pintando=false},0)}}
 var pinta=pintaTudo;
 function agenda(ms){clearTimeout(agendado);agendado=setTimeout(confere,ms||200)}
 function evento(e){if(!ad)return;var t=e.target;if(t&&t.closest&&t.closest('.uvs-previa'))return;
  itemEvt=chaveDe(t);agenda(e.type==='input'?600:250)}
 var css='.uvs-previa{border:1px dashed #9fb3c2;border-radius:10px;background:#fbfcfd;margin:12px 0 4px;padding:0 12px;text-align:left}.uvs-previa>summary{cursor:pointer;padding:9px 0;font-weight:700;color:#365B73;font-size:.86rem}.uvs-previa p{font-size:.84rem;line-height:1.5;margin:0 0 7px;color:#22303a}.uvs-previa .uvs-pv-h{font-weight:700;font-size:.78rem;text-transform:uppercase;letter-spacing:.02em;color:#52606b;margin-top:4px}.uvs-previa .uvs-pv-nota{color:#6b7780;font-style:italic}@media print{.uvs-previa{display:none!important}}';
 function inicia(){app=appAtual();if(!app){if(inicia.n=(inicia.n||0)+1,inicia.n<80)setTimeout(inicia,250);return}
  ad=A[app];if(ad.ok&&!ad.ok()){setTimeout(inicia,250);return}
  CH='uvis-previa-'+app;carrega();
  var st=document.createElement('style');st.textContent=css;(document.head||document.documentElement).appendChild(st);
  ['click','change','input'].forEach(function(k){document.addEventListener(k,evento,true)});
  var ls=linhas();antes=ls?conta(ls):null;pinta(ls);
  var tm=0;new MutationObserver(function(ms){if(pintando)return;if(ms.every(function(m){return m.target.closest&&m.target.closest('.uvs-previa')}))return;if(tm)return;tm=setTimeout(function(){tm=0;pinta()},150)}).observe(document.body,{childList:true,subtree:true});
 }
 window.UvsPrevia={mapa:function(){return mapa},confere:confere,pinta:function(){pintaTudo()},linhas:function(){return linhas()},itens:function(){return itens()}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inicia);else inicia();
})();
