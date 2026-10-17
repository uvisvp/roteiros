/* Teclado sobre o campo (pedido de 17/10/2026): no celular e no tablet, ao tocar numa
   caixa de texto o teclado cobria o campo e não se via o que se digitava — o roteiro roda
   num quadro dentro da casca, e o navegador não rola o quadro até o campo.
   Enquanto se digita: as barras presas ao rodapé somem, as faixas grudadas no topo
   (itens, título do item) deixam de grudar, e o campo é levado para logo abaixo do topo
   fixo, na parte da tela que o teclado deixa livre; numa caixa que cresce, a linha atual
   segue visível. Só em tela de toque; vale para todos os roteiros (scripts/repack-campo.cjs). */
(function(){
 if(window.__uvsTeclado) return; window.__uvsTeclado = true;
 if(!(window.matchMedia && matchMedia('(pointer: coarse)').matches)) return;
 var TXT = /^(text|search|email|tel|url|number|password|date|datetime-local|month|time)$/i;
 function campo(e){ return !!e && (e.tagName === 'TEXTAREA' || (e.tagName === 'INPUT' && TXT.test(e.type || 'text')) || e.isContentEditable === true); }
 function vv(){ try { if(window.parent !== window && parent.visualViewport) return parent.visualViewport; } catch(e){} return window.visualViewport; }
 /* altura livre (acima do teclado) em coordenadas do quadro */
 function livre(){ var v = vv(), topo = 0; try { if(window.frameElement) topo = window.frameElement.getBoundingClientRect().top; } catch(e){}
  return v ? Math.min(innerHeight, v.height + (v.offsetTop || 0) - topo) : innerHeight * 0.55; }
 /* elementos fixos: os do topo dão a margem de cima; os do rodapé somem enquanto se digita */
 function fixos(){ var cima = 0, h = innerHeight; Array.prototype.forEach.call(document.body.getElementsByTagName('*'), function(x){
   var p = getComputedStyle(x).position; if(p !== 'fixed' && p !== 'sticky') return; var r = x.getBoundingClientRect(); if(!r.height || !r.width) return;
   if(p === 'fixed' && r.top > h * 0.5) x.setAttribute('data-uvs-rodape', ''); else if(r.top < h * 0.4 && r.bottom < h * 0.6 && r.bottom > cima) cima = r.bottom; });
  return cima; }
 function mostra(el){ if(!el || !el.getBoundingClientRect) return; var cima = fixos() + 10, baixo = livre() - 14, r = el.getBoundingClientRect();
  if(r.top >= cima && Math.min(r.bottom, r.top + 140) <= baixo) return;
  window.scrollBy({top: r.top - cima - Math.max(0, Math.min(36, (baixo - cima - r.height) / 3)), behavior: 'smooth'}); }
 var raiz = document.documentElement, t1 = null, t2 = null;
 document.addEventListener('focusin', function(e){ var el = e.target; if(!campo(el)) return;
  raiz.classList.add('uvs-digitando'); clearTimeout(t1); clearTimeout(t2);
  t1 = setTimeout(function(){ mostra(el); }, 320); t2 = setTimeout(function(){ if(document.activeElement === el) mostra(el); }, 750); }, true);
 document.addEventListener('focusout', function(){ setTimeout(function(){ if(!campo(document.activeElement)) raiz.classList.remove('uvs-digitando'); }, 180); }, true);
 document.addEventListener('input', function(e){ var el = e.target; if(el && el.tagName === 'TEXTAREA' && document.activeElement === el){ var r = el.getBoundingClientRect(); if(r.bottom > livre() - 14) mostra(el); } }, true);
 try { vv().addEventListener('resize', function(){ var el = document.activeElement; if(campo(el)) mostra(el); }); } catch(e){}
 var css = document.createElement('style');
 css.textContent = '.uvs-digitando [data-uvs-rodape]{visibility:hidden !important}'
  + '.uvs-digitando .pu-fixo{position:static !important;box-shadow:none !important}'
  + '.uvs-digitando body{padding-bottom:55vh !important}';
 (document.head || raiz).appendChild(css);
})();
