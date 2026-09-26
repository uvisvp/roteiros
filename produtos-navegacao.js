/* ——— Produtos e correlatos: navegação mais clara ———
   - Cabeçalho com o nome da trilha (Fabricante de cosméticos, Atacadista…).
   - Um só botão para o perfil: “✎ Alterar perfil” no cabeçalho abre a trilha
     (antes, “Ajustar trilha” do topo não fazia nada e havia um segundo na busca).
   - A atividade vem do cartão do núcleo: o passo 1 (cartão único) sai da trilha
     e os passos são renumerados.
   - O bloco do POP-O-SNVS-013 aparece só quando há dispositivos médicos/IVD
     marcados, logo depois das características. */
(function(){
 if(window.__produtosNav)return;window.__produtosNav=true;
 var $=function(s,r){return (r||document).querySelector(s)};
 function trilhaNome(){var s=$('.trilha .type-card.active strong')||$('.trilha .type-card strong');return s?s.textContent.trim():''}
 function titulo(){var n=trilhaNome();if(!n)return;var b=$('.p-ident b');if(b&&b.textContent!==n)b.textContent=n;var h=$('header.app-header h1');if(h&&h.textContent!==n)h.textContent=n}
 function passos(){var c=$('#panel-roteiro .trilha .grid.two');if(!c)return;var cards=c.querySelectorAll(':scope>section.card');
  if(cards.length===2&&cards[0].querySelectorAll('.type-card').length===1&&!cards[0].classList.contains('pn-oculto')){cards[0].classList.add('pn-oculto');c.classList.add('pn-uma')}
  var st=$('#panel-roteiro .trilha').querySelectorAll('.step');[].forEach.call(st,function(s){var t=s.textContent;if(/^2 · Caracter/.test(t))s.textContent='1 · Classes e características';else if(/^3 · Identifica/.test(t))s.textContent='2 · Identificação'})}
 function pop13(){var alvo=$('#panel-roteiro .trilha .grid.two');if(!alvo)return;var disp=!!$('[data-flag=cls_disp]:checked'),ant=alvo;
  ['.prod-pop13-stage2','.prod-nc-launch','.prod-report-launch'].forEach(function(sel){var el=$('#panel-roteiro '+sel)||$(sel);if(!el)return;el.style.display=disp?'':'none';if(!disp)return;if(ant.nextElementSibling!==el)ant.insertAdjacentElement('afterend',el);ant=el})}
 function botoes(){var b=$('header.app-header [data-tab="inicio"]');if(b){b.textContent='✎ Alterar perfil';b.setAttribute('data-pn-perfil','');b.removeAttribute('data-tab')}}
 var ocupado=false;
 function tudo(){if(ocupado)return;ocupado=true;try{botoes();titulo();passos();pop13()}catch(e){}ocupado=false}
 function abrirTrilha(){var t=$('#panel-roteiro .trilha');if(t&&t.classList.contains('fechada')){var h=t.querySelector('[data-trilha]');if(h)h.click()}setTimeout(function(){var t2=$('#panel-roteiro .trilha');if(t2)t2.scrollIntoView({block:'start'})},60)}
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-pn-perfil]');if(!b)return;e.preventDefault();e.stopPropagation();
  var rt=$('.tab[data-tab="roteiro"]');if(rt&&rt.getAttribute('aria-selected')!=='true')rt.click();
  var n3=document.querySelector('[data-n3-perfil]');if(n3&&n3.offsetParent)n3.click();setTimeout(abrirTrilha,80)},true);
 document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-n3-perfil]'))setTimeout(abrirTrilha,120)});
 document.addEventListener('change',function(e){if(e.target&&e.target.matches&&e.target.matches('[data-flag]'))setTimeout(tudo,30)});
 function observar(){var p=$('#panel-roteiro');if(!p){setTimeout(observar,100);return}new MutationObserver(function(){if(!ocupado)setTimeout(tudo,0)}).observe(p,{childList:true,subtree:true});var h=$('header.app-header');if(h)new MutationObserver(function(){if(!ocupado)setTimeout(tudo,0)}).observe(h,{childList:true,subtree:true,characterData:true});tudo()}
 document.head.insertAdjacentHTML('beforeend','<style id="pn-style">#panel-roteiro .trilha .grid.two>section.card.pn-oculto{display:none}#panel-roteiro .trilha .grid.two.pn-uma{grid-template-columns:1fr}#panel-roteiro .toolbar [data-trilha]{display:none}#panel-roteiro .trilha .step{color:#876B3F!important;background:none!important;font-weight:800;font-size:.74rem;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}</style>');
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observar);else observar();
})();
