/* Apagar dados da inspeção (revisão de 25/10/2026): o cartão que os roteiros do motor
   roteiro-simples e os de Medicamentos têm na tela inicial do roteiro, agora também em
   Odontologia, Produtos, Serviços de alimentação e Serviços assistenciais (navegação padrão,
   estado próprio de cada módulo). Usa a mesma limpeza do botão Salvas (UvisSalvas.apagarTudo:
   respostas, anotações e fotos da inspeção em andamento; as inspeções salvas ficam), que pede
   confirmação e reabre o roteiro em branco. Em Serviços assistenciais apaga a modalidade aberta. */
(function(){
 'use strict';
 if(window.__uvsApagarPadrao)return;window.__uvsApagarPadrao=true;
 var APPS=['odontologia','produtos-correlatos','servicos-alimentacao-roteiro','servicos-assistenciais'];
 var app=document.documentElement.dataset.uvisApp||window.__uvsApp||'';
 if(window.ROTEIRO||APPS.indexOf(app)<0)return;
 var CSS='.pu-secoes-grade .rs-apagar{grid-column:1/-1;margin-top:14px;padding:14px;border:1px dashed #d9a39e;border-radius:14px;background:#fffaf9;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;text-align:left}'
  +'.pu-secoes-grade .rs-apagar-txt{flex:1 1 240px;display:flex;flex-direction:column;gap:4px;min-width:0}'
  +'.pu-secoes-grade .rs-apagar-txt strong{color:#8b2f2a;font-size:.92rem}'
  +'.pu-secoes-grade .rs-apagar-txt span{color:#6b5a58;font-size:.76rem;line-height:1.35}'
  +'.pu-secoes-grade .rs-apagar .rs-apagar-btn{flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;gap:6px;width:auto!important;min-width:0!important;min-height:42px!important;height:auto!important;padding:9px 14px!important;border:1.5px solid #b9544d!important;border-radius:10px!important;background:#fff!important;color:#8b2f2a!important;box-shadow:none!important;font:inherit;font-size:.82rem!important;font-weight:800!important;text-align:center!important;cursor:pointer;white-space:nowrap}'
  +'.pu-secoes-grade .rs-apagar .rs-apagar-btn:hover,.pu-secoes-grade .rs-apagar .rs-apagar-btn:focus-visible{background:#b9544d!important;color:#fff!important}';
 function salvas(){try{return parent!==window&&parent.UvisSalvas||null}catch(e){return null}}
 function modalidade(){try{return typeof current!=='undefined'&&current?{id:current.id,nome:current.nome||current.id}:null}catch(e){return null}}
 function poe(){var g=document.querySelector('.pu-secoes-grade');if(!g||g.querySelector('[data-pu-apagar]')||!salvas())return;
  try{var n=UvisPadrao.estado();if(n.aba!=='roteiro'||n.secao)return}catch(e){return}
  var z=document.createElement('div');z.className='rs-apagar';z.innerHTML='<div class="rs-apagar-txt"><strong>Apagar dados da inspeção</strong><span>Remove todas as respostas, anotações, fotos e dados desta inspeção salvos neste aparelho. Não há como desfazer; para guardar, use antes o botão Salvas.</span></div><button type="button" class="rs-apagar-btn" data-pu-apagar><span aria-hidden="true">🗑</span> Apagar dados</button>';
  g.appendChild(z)}
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-pu-apagar]');if(!b)return;e.preventDefault();e.stopPropagation();
  var S=salvas();if(!S||!S.apagarTudo)return;var m=S.CFG&&S.CFG[app]&&S.CFG[app].modalidade?modalidade():null;S.apagarTudo(app,m?m.id:'',m?m.nome:'')},true);
 function inicia(){var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);poe();
  var tm=0;new MutationObserver(function(){clearTimeout(tm);tm=setTimeout(poe,80)}).observe(document.body,{childList:true,subtree:true})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inicia);else inicia();
})();
