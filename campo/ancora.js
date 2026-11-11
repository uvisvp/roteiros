/* Âncora de rolagem (10/11/2026; revista em 11/11/2026): ao responder uma pergunta (botão de
   resposta, item de checklist, caixa de marcar, opção de perfil ou lista suspensa), o controle
   tocado fica no mesmo lugar da tela. Os roteiros redesenham a tela a cada resposta e, logo
   depois, reinserem caixas (“Para saber mais”, prévia do relatório, avisos) acima do ponto em
   que se está; o navegador então mantinha a posição errada e a tela “andava sozinha”.
   Como funciona: guarda o controle tocado (pelos atributos data-*, ou pelo texto e pela ordem
   quando não há) e a posição dele na tela; durante cerca de 1 s, reencontra o controle e
   corrige a rolagem. Para se o usuário tocar ou rolar. Não age em botões de navegação (abrir
   item, abas, setas): só em controles de resposta, que continuam na tela depois do redesenho.
   Revisão de 11/11/2026 (levantamento nos demais núcleos):
   - a posição é guardada no toque (pointerdown), antes de qualquer redesenho. Nos roteiros em
     que o checklist por ponto redesenha a tela na fase de captura do clique, a posição era
     lida do botão já descartado (topo 0) e a própria âncora levava o botão ao topo da tela;
   - a correção roda a cada alteração da página (MutationObserver), antes de o navegador
     pintar: some o “pisca” de 50 a 100 px que aparecia quando as caixas eram reinseridas;
   - passa a valer também para as opções de perfil (chips) e para controles sem data-*;
   - a correção é instantânea mesmo onde a página usa rolagem suave (scroll-behavior:smooth). */
(function(){
 'use strict';
 if(window.__uvsAncora)return;window.__uvsAncora=true;
 var FORA=/^data-(drg-rot|centrado|cmp-|uvs-cnpj)/,GRUPO='.answers,.pu-resp,.seg,.rs-ponto-tog,.uvs-ponto-tog,.chips,[role=group],[role=radiogroup]';
 var alvo=null,quadro=0,pre=null,obs=null;
 function texto(e){return ((e.tagName==='INPUT'?(e.closest('label')||e).textContent:e.tagName==='SELECT'?(e.getAttribute('name')||e.id||''):e.textContent)||'').replace(/\s+/g,' ').trim().slice(0,80)}
 function dados(e){var o={},n=0;[].forEach.call(e.attributes,function(a){if(/^data-/.test(a.name)&&!FORA.test(a.name)){o[a.name]=a.value;n++}});
  if(e.tagName==='INPUT'&&e.hasAttribute('value')&&/^(checkbox|radio)$/.test(e.type)){o.value=e.getAttribute('value');}
  /* sem data-*: vale o texto do controle (e a ordem entre os de mesmo texto) */
  if(!n){o['@t']=texto(e)}return o}
 function bate(e,d){for(var k in d){if(k==='@t'){if(texto(e)!==d[k])return false}else if(e.getAttribute(k)!==d[k])return false}return true}
 function iguais(tag,d){return [].filter.call(document.getElementsByTagName(tag),function(e){return bate(e,d)})}
 function controle(t){if(!t||!t.closest)return null;if(t.closest('#uvs-docs,dialog,[role=dialog]'))return null;
  var e=t.closest('select,input[type=checkbox],input[type=radio]');if(e)return e;
  e=t.closest('label');if(e){var i=e.querySelector('input[type=checkbox],input[type=radio]');if(i)return i}
  e=t.closest('button');if(e&&(e.hasAttribute('aria-pressed')||e.closest(GRUPO)))return e;return null}
 function foto(e){if(!e.isConnected)return null;var d=dados(e),l=iguais(e.tagName,d);return {tag:e.tagName,d:d,i:Math.max(0,l.indexOf(e)),top:e.getBoundingClientRect().top,t:Date.now()}}
 /* toque: o usuário assumiu a tela (para a correção em curso) e a posição do controle é guardada */
 function toque(ev){solta();var e=ev.type==='pointerdown'||ev.type==='touchstart'?controle(ev.target):null;pre=e?foto(e):null}
 function marca(ev){var e=controle(ev.target),f=null,recente=pre&&Date.now()-pre.t<1500;
  if(e&&e.tagName==='SELECT')f=foto(e);                               /* lista: o toque que abriu a lista é antigo */
  else if(e&&recente&&e.tagName===pre.tag&&bate(e,pre.d))f=pre;        /* posição de antes do redesenho */
  else if(e)f=foto(e)||(recente?pre:null);
  else if(recente&&ev.type==='click'&&Date.now()-pre.t<700)f=pre;      /* o botão tocado foi trocado antes do clique */
  if(!f)return;
  alvo={tag:f.tag,d:f.d,i:f.i,top:f.top,fim:Date.now()+1000};
  if(!obs&&window.MutationObserver){obs=new MutationObserver(corrige);obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,characterData:true})}
  if(!quadro)quadro=requestAnimationFrame(laco)}
 function rolador(e){for(var p=e.parentElement;p&&p!==document.body&&p!==document.documentElement;p=p.parentElement){var o=getComputedStyle(p).overflowY;if((o==='auto'||o==='scroll')&&p.scrollHeight>p.clientHeight+1)return p}return null}
 function corrige(){if(!alvo)return;if(Date.now()>alvo.fim){solta();return}
  var l=iguais(alvo.tag,alvo.d),e=l[alvo.i]||l[0];
  if(e&&(e.offsetParent||e.getClientRects().length)){var dif=e.getBoundingClientRect().top-alvo.top;
   /* behavior 'instant': com scroll-behavior:smooth no roteiro (Produtos), a correção deslizava por ~300 ms */
   if(Math.abs(dif)>1){var r=rolador(e);if(r){var a=r.scrollTop;try{r.scrollTo({top:a+dif,behavior:'instant'})}catch(x){r.scrollTop=a+dif}dif-=r.scrollTop-a}
    if(Math.abs(dif)>1){try{window.scrollBy({top:dif,left:0,behavior:'instant'})}catch(x){window.scrollBy(0,dif)}}}}}
 function laco(){quadro=0;if(!alvo)return;corrige();if(alvo)quadro=requestAnimationFrame(laco)}
 function solta(){alvo=null;if(obs){obs.disconnect();obs=null}}
 document.addEventListener('click',marca,true);
 document.addEventListener('change',marca,true);
 ['touchstart','pointerdown','wheel','keydown'].forEach(function(n){window.addEventListener(n,toque,{capture:true,passive:true})});
})();
