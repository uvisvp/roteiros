/* ——— Volta ao roteiro depois de abrir um arquivo gerado ———
   No celular, abrir o PDF de fotos ou o Word gerado pelo roteiro pode mostrar o
   arquivo por cima do app e, ao fechar, recarregar o app na tela inicial. Antes
   de cada download feito dentro de um roteiro, a casca anota qual roteiro estava
   aberto; se o app recarregar em até 30 minutos, reabre esse roteiro (as
   respostas já ficam gravadas no aparelho). A anotação some quando o app volta
   sem recarregar ou quando o usuário sai do roteiro.
   Inserido no index.html por scripts/repack-retorno.cjs. */
(function(){
 if(window.__uvsRetorno)return;window.__uvsRetorno=true;
 var K='uvis-retorno-roteiro',MAX=30*60*1000;
 function tela(){return document.getElementById('tela-app')}
 function aberto(){var t=tela();return !!(t&&t.classList.contains('on'))}
 function marca(){var a=window.__cascaAtual;if(!a||!a.app||!aberto())return;try{localStorage.setItem(K,JSON.stringify({nucleo:a.nucleo,app:a.app,titulo:a.titulo,qs:a.qs||'',ts:Date.now()}))}catch(e){}}
 function limpa(){try{localStorage.removeItem(K)}catch(e){}}
 function ehArquivo(a){var h=a.getAttribute('href')||'';return a.hasAttribute('download')||/^(blob|data):/i.test(h)}
 function liga(w){var d;try{d=w.document}catch(e){return}if(!d||d.__uvsRetorno)return;d.__uvsRetorno=true;
  d.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(a&&ehArquivo(a))marca()},true);
  try{var abre=w.open;w.open=function(u){if(/^(blob|data):/i.test(String(u||'')))marca();return abre.apply(this,arguments)}}catch(e){}}
 function inicia(){
  var q=document.getElementById('quadro');if(q)q.addEventListener('load',function(){liga(q.contentWindow)});
  var t=tela();if(t)new MutationObserver(function(){if(!aberto())limpa()}).observe(t,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')setTimeout(limpa,1500)});
  var r=null;try{r=JSON.parse(localStorage.getItem(K)||'null')}catch(e){}
  limpa();
  if(r&&r.app&&Date.now()-r.ts<MAX&&typeof window.__cascaAbrirRoteiro==='function')setTimeout(function(){window.__cascaAbrirRoteiro(r.nucleo,r.app,r.titulo,r.qs)},300);
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',inicia):inicia();
})();
