/* Âncora de rolagem (10/11/2026): ao responder uma pergunta (botão de resposta, item de
   checklist, caixa de marcar ou lista suspensa), o controle tocado fica no mesmo lugar da
   tela. Os roteiros redesenham a tela a cada resposta e, logo depois, reinserem caixas
   (“Para saber mais”, prévia do relatório, avisos) acima do ponto em que se está; o navegador
   então mantinha a posição errada e a tela “andava sozinha”.
   Como funciona: guarda o controle tocado (pelos atributos data-*) e a posição dele na tela;
   durante cerca de 1 s, a cada quadro, reencontra o controle e corrige a rolagem. Para se o
   usuário tocar ou rolar. Não age em botões de navegação (abrir item, abas, setas): só em
   controles de resposta, que continuam na tela depois do redesenho. */
(function(){
 'use strict';
 if(window.__uvsAncora)return;window.__uvsAncora=true;
 var FORA=/^data-(drg-rot|centrado|cmp-|uvs-cnpj)/,GRUPO='.answers,.pu-resp,.seg,.rs-ponto-tog,[role=group],[role=radiogroup]';
 var alvo=null,quadro=0;
 function dados(e){var o={},n=0;[].forEach.call(e.attributes,function(a){if(/^data-/.test(a.name)&&!FORA.test(a.name)){o[a.name]=a.value;n++}});if(e.tagName==='INPUT'&&e.hasAttribute('value')&&/^(checkbox|radio)$/.test(e.type)){o.value=e.getAttribute('value');}return n?o:null}
 function bate(e,d){for(var k in d)if(e.getAttribute(k)!==d[k])return false;return true}
 function iguais(tag,d){return [].filter.call(document.getElementsByTagName(tag),function(e){return bate(e,d)})}
 function controle(t){if(!t||!t.closest)return null;if(t.closest('#uvs-docs,dialog,[role=dialog]'))return null;
  var e=t.closest('select,input[type=checkbox],input[type=radio]');if(e)return e;
  e=t.closest('label');if(e){var i=e.querySelector('input[type=checkbox],input[type=radio]');if(i)return i}
  e=t.closest('button');if(e&&(e.hasAttribute('aria-pressed')||e.closest(GRUPO)))return e;return null}
 function marca(ev){var e=controle(ev.target);if(!e)return;var d=dados(e);if(!d)return;var l=iguais(e.tagName,d);
  alvo={tag:e.tagName,d:d,i:Math.max(0,l.indexOf(e)),top:e.getBoundingClientRect().top,fim:Date.now()+1000};
  if(!quadro)quadro=requestAnimationFrame(corrige)}
 function corrige(){quadro=0;if(!alvo)return;if(Date.now()>alvo.fim){alvo=null;return}
  var l=iguais(alvo.tag,alvo.d),e=l[alvo.i]||l[0];
  if(e&&(e.offsetParent||e.getClientRects().length)){var dif=e.getBoundingClientRect().top-alvo.top;if(Math.abs(dif)>1)window.scrollBy(0,dif)}
  quadro=requestAnimationFrame(corrige)}
 function solta(){alvo=null}
 document.addEventListener('click',marca,true);
 document.addEventListener('change',marca,true);
 ['touchstart','pointerdown','wheel','keydown'].forEach(function(n){document.addEventListener(n,solta,{capture:true,passive:true})});
})();
