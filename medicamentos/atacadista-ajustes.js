/* Atacadista de medicamentos — ajustes do site Medicamentos no módulo da
   distribuidora (build/montar.cjs coloca no fim do módulo).
   - Tipo de operação (Etapa 1 › Estabelecimento): distribuidora, só
     transportadora ou as duas. Os campos da trilha de transportadora
     (meta.transp…) só aparecem quando há transporte; nada é marcado como
     “Não se aplica” sozinho — a equipe marca o que não existir.
   - Cabeçalho: “Atacadista de medicamentos”, “Transportadora de medicamentos”
     ou “Distribuidora e transportadora de medicamentos”, conforme o tipo.
   - Orientação sobre AFE e cross-docking na tela do Estabelecimento quando há
     transporte. Não entra no relatório. */
(function(){
  'use strict';
  var TIT = {'Transportadora (somente transporte)': 'Transportadora de medicamentos', 'Distribuidora e transportadora': 'Distribuidora e transportadora de medicamentos'};
  var PADRAO = 'Atacadista de medicamentos';
  var ORIENT = [
    ['AFE da transportadora', 'A RDC 16/2014 exige AFE de quem transporta medicamentos (art. 3º); as dispensas do art. 5º não incluem transportadoras de medicamentos. Transporte de controlados exige também AE (art. 4º). Na renovação, transportadora sem armazenagem fica dispensada de apresentar licença do ano corrente quando a legislação local dispensar a renovação (art. 15, § 3º).'],
    ['Transporte para farmácias e drogarias', 'O transporte do medicamento dispensado a distância é responsabilidade da farmácia ou drogaria; se terceirizado, deve ser feito por empresa regularizada conforme a legislação vigente (RDC 44/2009, art. 56, § 4º). A entrega pelos Correios é permitida (art. 57).'],
    ['Armazenagem temporária (cross-docking)', 'Quem mantém medicamentos em doca, galpão ou veículo entre coleta e entrega está armazenando: aplicam-se as exigências de armazenagem da RDC 430/2020, inclusive qualificação térmica de áreas e equipamentos e controle de temperatura. Não marque essas verificações como “Não se aplica” sem confirmar que não há armazenagem.'],
    ['Veículos e rotas', 'Qualificação térmica de veículos, embalagens e rotas; transportador rodoviário remunerado inscrito no RNTRC/ANTT (Lei 11.442/2007); produtos perigosos seguem a Resolução ANTT 5.998/2022.']
  ];
  function esc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){ return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
  function tipo(){ try { return (state.meta && state.meta.opTipo) || ''; } catch(e){ return ''; } }
  function temTransporte(){ return /transportadora/i.test(tipo()); }
  function titulo(){
    var alvo = TIT[tipo()] || PADRAO, w = document.createTreeWalker(document.querySelector('header') || document.body, NodeFilter.SHOW_TEXT), n;
    while((n = w.nextNode())){
      var v = n.nodeValue, novo = v.replace(/distribuidora\s*\/\s*transportadora|Atacadista de medicamentos|Transportadora de medicamentos|Distribuidora e transportadora de medicamentos/i, alvo);
      if(novo !== v) n.nodeValue = novo;
    }
  }
  function trilha(){
    var t = temTransporte();
    [].forEach.call(document.querySelectorAll('[data-path^="meta.transp"],[data-checks^="meta.transp"]'), function(e){
      var cx = e.closest('.grid > *') || e.closest('label') || e.parentElement;
      if(cx && cx.hidden === t) cx.hidden = !t;
    });
    var chip = document.querySelector('[data-dist-section][aria-current="step"]'), tela = document.querySelector('.dist-section-screen');
    var corpo = tela && (tela.querySelector('.sectionbody') || tela), box = corpo && corpo.querySelector(':scope > .med-orient-transp');
    var aqui = !!(chip && chip.dataset.distSection === 't1-estabelecimento' && t);
    if(!aqui){ if(box) box.remove(); return; }
    if(box) return;
    var d = document.createElement('details');
    d.className = 'sm-box med-orient med-orient-transp';
    d.innerHTML = '<summary>📘 Orientação técnica — transportadora</summary>' + ORIENT.map(function(o){ return '<p><b>' + esc(o[0]) + '.</b> ' + esc(o[1]) + '</p>'; }).join('');
    corpo.insertBefore(d, corpo.firstChild);
  }
  function tudo(){ titulo(); trilha(); }
  var t = 0;
  new MutationObserver(function(ms){ if(ms.every(function(m){ return m.target.closest && m.target.closest('.med-orient'); })) return; clearTimeout(t); t = setTimeout(tudo, 100); }).observe(document.body, {childList: true, subtree: true});
  document.addEventListener('change', function(e){ if(e.target && e.target.getAttribute && e.target.getAttribute('data-path') === 'meta.opTipo') setTimeout(tudo, 50); }, true);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tudo); else { tudo(); setTimeout(tudo, 400); }
})();
