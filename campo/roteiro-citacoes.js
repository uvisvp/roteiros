/* Lei Municipal nº 13.725/2004 fora dos botões de citação do Roteiro (pedido de 18/10/2026):
   na aba Roteiro, cada pergunta mostra só a norma específica da exigência (RDC, Portaria,
   lei federal…); a Lei 13.725 aparece só quando a pergunta não cita outra norma (licença,
   CMVS). Ela continua na aba Infrações (capitulação) e no relatório (fundamento da
   irregularidade): o filtro é só de tela, os dados e o relatório não mudam. Vale para os
   botões do componente padrão (.uvis-cite) e do motor roteiro-simples (.rs-cit), por
   pergunta (.pu-q). Botão que junta várias normas (“Lei 13.725 · art. 46 ; Lei 6.360 · …”,
   em Produtos) perde só o trecho da Lei 13.725. A prévia “Como sai no relatório” fica como
   está, porque mostra o fundamento. */
(function(){
 if(window.__uvsCitRoteiro) return; window.__uvsCitRoteiro = true;
 var LEI = /13\.725/;
 /* início de outra norma dentro de data-uvis-citation (“…, art. 2º; RDC Anvisa nº 16/2014, …”) */
 var NORMA = /;\s*(?=(?:Lei|RDC|Portaria|Decreto|Instrução|IN|Resolução|ABNT|NBR|Nota|Código|Constituição)\b)/;
 function partes(t){ return String(t || '').split(/\s;\s/); }
 function semLei(t){ return partes(t).filter(function(p){ return !LEI.test(p); }); }
 function noRoteiro(){ try { return !!(window.UvisPadrao && UvisPadrao.estado && UvisPadrao.estado().aba === 'roteiro'); } catch(e){ return false; } }
 function filtra(){
  if(!noRoteiro()) return;
  var grupos = [], botoes = [];
  document.querySelectorAll('#pu-conteudo button.uvis-cite, #pu-conteudo button.rs-cit').forEach(function(b){
   if(b.closest('.rs-previa,.uvs-previa')) return;
   var g = b.closest('.pu-q') || b.parentElement, i = grupos.indexOf(g);
   if(i < 0){ grupos.push(g); botoes.push([b]); } else botoes[i].push(b);
  });
  botoes.forEach(function(bs){
   if(!bs.some(function(b){ return semLei(b.textContent).length; })) return;
   bs.forEach(function(b){
    var ps = partes(b.textContent), fica = semLei(b.textContent);
    if(fica.length === ps.length) return;
    /* estilo no próprio botão, com prioridade: os módulos fixam o display dos botões com !important */
    if(!fica.length){ b.setAttribute('data-uvs-lei-oculta', ''); b.style.setProperty('display', 'none', 'important'); return; }
    b.textContent = fica.join(' ; ');
    if(b.title) b.title = semLei(b.title).join(' ; ');
    if(b.dataset.uvisCitation) b.dataset.uvisCitation = b.dataset.uvisCitation.split(NORMA).filter(function(p){ return !LEI.test(p); }).join('; ');
    b.setAttribute('data-uvs-lei-retirada', '');
   });
  });
 }
 var agenda = 0;
 function depois(){ if(agenda) return; agenda = setTimeout(function(){ agenda = 0; filtra(); }, 30); }
 function liga(){ filtra(); new MutationObserver(depois).observe(document.body, {childList: true, subtree: true}); }
 if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', liga); else liga();
})();
