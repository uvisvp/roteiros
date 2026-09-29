/* ——— Volta ao roteiro depois de abrir um arquivo gerado ———
   No celular, abrir o PDF de fotos ou o Word gerado pelo roteiro pode mostrar o
   arquivo por cima do app e, ao fechar, recarregar o app na tela inicial. Antes
   de cada download feito dentro de um roteiro, a casca anota qual roteiro estava
   aberto; se o app recarregar em até 30 minutos, reabre esse roteiro (as
   respostas já ficam gravadas no aparelho). A anotação some quando o app volta
   sem recarregar ou quando o usuário sai do roteiro.
   iPhone/iPad: abrir o arquivo dentro do app (PDF/Word por cima da tela) e fechar no “X”
   deixava o app travado. Nesses aparelhos o arquivo não é mais aberto na janela do app:
   ao ficar pronto, aparece a caixa “Arquivo pronto” e o botão abre a folha de
   compartilhamento do iOS (Arquivos, Pré-Visualização, WhatsApp…). O app não sai da tela.
   Android e computador continuam baixando como antes.
   Inserido no index.html por scripts/repack-retorno.cjs. */
(function(){
 if(window.__uvsRetorno)return;window.__uvsRetorno=true;
 var K='uvis-retorno-roteiro',MAX=30*60*1000;
 function tela(){return document.getElementById('tela-app')}
 function aberto(){var t=tela();return !!(t&&t.classList.contains('on'))}
 function marca(){var a=window.__cascaAtual;if(!a||!a.app||!aberto())return;try{localStorage.setItem(K,JSON.stringify({nucleo:a.nucleo,app:a.app,titulo:a.titulo,qs:a.qs||'',ts:Date.now()}))}catch(e){}}
 function limpa(){try{localStorage.removeItem(K)}catch(e){}}
 function ehArquivo(a){var h=a.getAttribute('href')||'';return a.hasAttribute('download')||/^(blob|data):/i.test(h)}
 /* ---------- iOS: entrega por compartilhamento, sem sair do app ---------- */
 var IOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
 var TIPOS={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',doc:'application/msword',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',csv:'text/csv',json:'application/json',txt:'text/plain',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',zip:'application/zip'};
 function podeCompartilhar(){return IOS&&typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&typeof File!=='undefined'}
 function baixa(blob,nome){marca();var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=nome;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},60000)}
 function caixa(f){var v=document.getElementById('uvs-arquivo');if(v)v.remove();
  var d=document.createElement('div');d.id='uvs-arquivo';d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
  d.innerHTML='<style>#uvs-arquivo{position:fixed;inset:0;z-index:2147483600;display:grid;place-items:center;padding:16px;background:rgba(15,25,35,.55)}#uvs-arquivo .c{width:min(100%,420px);background:#fff;border-radius:14px;padding:20px;box-shadow:0 12px 40px rgba(0,0,0,.3);font:15px/1.45 -apple-system,system-ui,sans-serif;color:#1d2b36}#uvs-arquivo h2{margin:0 0 6px;font-size:1.1rem}#uvs-arquivo p{margin:0 0 16px;color:#526470;word-break:break-word}#uvs-arquivo .b{display:grid;gap:8px}#uvs-arquivo button{min-height:48px;border-radius:10px;border:1px solid #bdd5e2;background:#fff;color:#1d4e6b;font:650 1rem system-ui,sans-serif}#uvs-arquivo button.p{background:#1d4e6b;border-color:#1d4e6b;color:#fff}</style>'
   +'<div class="c"><h2>Arquivo pronto</h2><p></p><div class="b"><button type="button" class="p" data-a="abrir">Abrir / compartilhar</button><button type="button" data-a="fechar">Fechar</button></div></div>';
  d.querySelector('p').textContent=f.name+' · '+Math.max(1,Math.round(f.size/1024))+' KB. Toque em “Abrir / compartilhar” para ver, salvar em Arquivos ou enviar.';
  d.addEventListener('click',function(e){var b=e.target.closest('button');if(!b&&e.target!==d)return;
   if(!b||b.dataset.a==='fechar'){d.remove();return}
   navigator.share({files:[f],title:f.name}).then(function(){d.remove()},function(err){if(!err||err.name!=='AbortError'){d.remove();baixa(f,f.name)}})});
  document.body.appendChild(d);d.querySelector('button.p').focus()}
 /* devolve true quando assumiu a entrega do arquivo */
 function entrega(href,nome){if(!podeCompartilhar()||!/^(blob|data):/i.test(String(href||'')))return false;
  nome=String(nome||'arquivo').trim()||'arquivo';
  fetch(href).then(function(r){return r.blob()}).then(function(b){var ext=(/\.([a-z0-9]+)$/i.exec(nome)||[])[1];var tipo=TIPOS[String(ext||'').toLowerCase()]||b.type||'application/octet-stream';
   var f=new File([b],nome,{type:tipo});var ok=false;try{ok=navigator.canShare({files:[f]})}catch(e){}
   if(ok)caixa(f);else baixa(b,nome)}).catch(function(){});
  return true}
 function liga(w){var d;try{d=w.document}catch(e){return}if(!d||d.__uvsRetorno)return;d.__uvsRetorno=true;
  d.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a||!ehArquivo(a))return;
   if(entrega(a.getAttribute('href'),a.getAttribute('download'))){e.preventDefault();return}marca()},true);
  /* âncora criada e clicada sem entrar no documento */
  try{var P=w.HTMLAnchorElement.prototype,clk=P.click;P.click=function(){if(!this.isConnected&&ehArquivo(this)&&entrega(this.getAttribute('href'),this.getAttribute('download')))return;return clk.apply(this,arguments)}}catch(e){}
  try{var abre=w.open;w.open=function(u){if(/^(blob|data):/i.test(String(u||''))){if(entrega(u,'arquivo'))return null;marca()}return abre.apply(this,arguments)}}catch(e){}}
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
