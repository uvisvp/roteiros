/* Orientações técnicas de transporte no módulo da distribuidora (Atacadista e
   Transportadora): caixa recolhível “Orientação técnica” no topo da seção
   aberta (recebimento, termolábeis, expedição, transporte, qualificação de
   veículos e de rotas). Dados em window.__ORIENT_TRANSP, vindos de
   modulos/orientacoes/orientacoes.cjs (build/montar.cjs). Não entra no relatório. */
(function(){
  'use strict';
  var O = window.__ORIENT_TRANSP || {};
  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){ return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function poe(){
    var chip = document.querySelector('[data-dist-section][aria-current="step"]'), tela = document.querySelector('.dist-section-screen');
    if(!chip || !tela) return;
    var id = chip.dataset.distSection, l = O[id], corpo = tela.querySelector('.sectionbody') || tela;
    /* só a caixa desta seção: a orientação da transportadora (atacadista-ajustes.js)
       também é .med-orient e, removida aqui, voltava lá — a tela piscava sem parar */
    var velho = corpo.querySelector(':scope > .med-orient:not(.med-orient-transp)');
    if(velho && velho.dataset.sec === id) return;
    if(velho) velho.remove();
    if(!l) return;
    var d = document.createElement('details');
    d.className = 'sm-box med-orient'; d.dataset.sec = id;
    d.innerHTML = '<summary>📘 Orientação técnica</summary><ul>' + l.map(function(o){ return '<li>' + esc(o.t) + (o.f ? '<br><small>Fonte: ' + esc(o.f) + '</small>' : '') + '</li>'; }).join('') + '</ul>';
    corpo.insertBefore(d, corpo.firstChild);
  }
  var st = document.createElement('style');
  st.textContent = '.med-orient{margin:0 0 10px}.med-orient ul{margin:6px 0 4px;padding-left:18px}.med-orient li{margin:6px 0;line-height:1.45}.med-orient small{color:#5b6b78}';
  document.head.appendChild(st);
  var t = 0;
  new MutationObserver(function(ms){ if(ms.every(function(m){ return m.target.closest && m.target.closest('.med-orient'); })) return; clearTimeout(t); t = setTimeout(poe, 120); }).observe(document.body, {childList: true, subtree: true});
  poe();
})();
