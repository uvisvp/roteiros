/* ——— Produtos e correlatos: navegação mais clara ———
   - Cabeçalho com o nome da trilha (Fabricante de cosméticos, Atacadista…).
   - Um só botão para o perfil: “✎ Alterar perfil” no cabeçalho abre a trilha
     (antes, “Ajustar trilha” do topo não fazia nada e havia um segundo na busca).
   - A atividade vem do cartão do núcleo: o passo 1 (cartão único) sai da trilha
     e os passos são renumerados.
   - O bloco do POP-O-SNVS-013 aparece só quando há dispositivos médicos/IVD
     marcados, logo depois das características.
   - Telas mais limpas, por nível (perfil › blocos › etapas › itens, como no núcleo
     de medicamentos): cabeçalho fixo compacto; cartão do CNAE e consulta de
     regularização só no perfil e na lista de blocos (antes apareciam em todas as
     telas); perfil como na Odontologia: é a primeira tela do roteiro e, na lista
     de blocos, a faixa com o resumo do perfil traz “✎ Alterar perfil” (sem
     botão de perfil no cabeçalho); sem a
     “Base legal” que repetia o botão de citação do item; barra “Bloco n de N” nas etapas e itens;
     rodapé do roteiro sem botão cortado e fora das abas Infrações e Relatório. */
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
 function botoes(){var b=$('header.app-header [data-tab="inicio"]');if(b){b.textContent='✎ Perfil';b.setAttribute('data-pn-perfil','');b.removeAttribute('data-tab')}
  var p=$('header.app-header [data-pn-perfil]');if(p&&p.textContent!=='✎ Perfil'){p.textContent='✎ Perfil';p.title='Alterar perfil'}
  var v=$('header.app-header [data-voltar-nucleo]');if(v&&v.textContent!=='← Núcleo'){v.textContent='← Núcleo';v.title='Voltar ao núcleo'}}
 function nivel(){var n='perfil',w=$('#panel-roteiro .n3-wrap'),rt=$('.tab[data-tab="roteiro"]');
  if(rt&&rt.getAttribute('aria-selected')==='false')n='outra';
  else if(w){if(w.querySelector('.n3-tela'))n='itens';else if(w.querySelector('[data-n3-item]'))n='etapas';else if(w.querySelector('[data-n3-bloco]'))n='blocos'}
  if(document.documentElement.dataset.pnNivel!==n)document.documentElement.dataset.pnNivel=n}
 /* Barra dos blocos nas etapas e nos itens: mostra quantos são e em qual se está; toque leva ao bloco. */
 function barraBlocos(){var w=$('#panel-roteiro .n3-wrap'),cfg=window.UVIS_N3,est=window.__n3estado;if(!w||!cfg||!cfg.blocos)return;
  var velha=w.querySelector('.pn-blocos'),n=document.documentElement.dataset.pnNivel;
  if(n!=='etapas'&&n!=='itens'){if(velha)velha.remove();return}
  var ids={};[].forEach.call(document.querySelectorAll('#panel-roteiro section.route-section[id^="section-"]'),function(x){ids[x.id.slice(8)]=1});
  var bs=cfg.blocos.map(function(b,i){return {id:'b'+i,t:b[0],n:b[1].filter(function(s){return ids[s]}).length}}).filter(function(b){return b.n});
  var atual=est&&est.bloco,html=bs.map(function(b,i){return '<button type="button" data-n3-bloco="'+b.id+'"'+(b.id===atual?' class="on" aria-current="true"':'')+'><b>'+(i+1)+'</b> '+b.t.replace(/&/g,'&amp;').replace(/</g,'&lt;')+'</button>'}).join('');
  var cab='<span>Bloco '+(bs.map(function(b){return b.id}).indexOf(atual)+1)+' de '+bs.length+'</span>';
  if(velha&&velha.dataset.h===atual+html)return;if(velha)velha.remove();
  var d=document.createElement('nav');d.className='pn-blocos';d.setAttribute('aria-label','Blocos do roteiro');d.dataset.h=atual+html;d.innerHTML=cab+'<div>'+html+'</div>';w.insertBefore(d,w.firstChild);
  var on=d.querySelector('.on');if(on)try{on.scrollIntoView({inline:'center',block:'nearest'})}catch(e){}}
 function cnae(){var c=$('#p-cnae');if(!c)return;var d=c.querySelector('details'),nota=c.querySelector(':scope>.p-note');if(d&&nota)d.appendChild(nota)}
 var ocupado=false;
 function tudo(){if(ocupado)return;ocupado=true;try{botoes();titulo();passos();pop13();cnae();nivel();barraBlocos()}catch(e){}ocupado=false}
 function abrirTrilha(){var t=$('#panel-roteiro .trilha');if(t&&t.classList.contains('fechada')){var h=t.querySelector('[data-trilha]');if(h)h.click()}setTimeout(function(){var t2=$('#panel-roteiro .trilha');if(t2)t2.scrollIntoView({block:'start'})},60)}
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-pn-perfil]');if(!b)return;e.preventDefault();e.stopPropagation();
  var rt=$('.tab[data-tab="roteiro"]');if(rt&&rt.getAttribute('aria-selected')!=='true')rt.click();
  var n3=document.querySelector('[data-n3-perfil]');if(!n3){n3=document.createElement('button');n3.type='button';n3.hidden=true;n3.setAttribute('data-n3-perfil','');document.body.appendChild(n3);setTimeout(function(){n3.remove()},0)}n3.click();setTimeout(abrirTrilha,80)},true);
 document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('[data-n3-perfil]'))setTimeout(abrirTrilha,120)});
 document.addEventListener('change',function(e){if(e.target&&e.target.matches&&e.target.matches('[data-flag]'))setTimeout(tudo,30)});
 function observar(){var p=$('#panel-roteiro');if(!p){setTimeout(observar,100);return}new MutationObserver(function(){if(!ocupado)setTimeout(tudo,0)}).observe(p,{childList:true,subtree:true});document.addEventListener('click',function(){setTimeout(function(){nivel();barraBlocos()},60)});var h=$('header.app-header');if(h)new MutationObserver(function(){if(!ocupado)setTimeout(tudo,0)}).observe(h,{childList:true,subtree:true,characterData:true});tudo()}
 document.head.insertAdjacentHTML('beforeend','<style id="pn-style">#panel-roteiro .trilha .grid.two>section.card.pn-oculto{display:none}#panel-roteiro .trilha .grid.two.pn-uma{grid-template-columns:1fr}#panel-roteiro .toolbar [data-trilha]{display:none}#panel-roteiro .trilha .step{color:#876B3F!important;background:none!important;font-weight:800;font-size:.74rem;letter-spacing:.06em;text-transform:uppercase;margin-bottom:4px}html[data-pn-nivel=etapas] #p-cnae,html[data-pn-nivel=itens] #p-cnae,html[data-pn-nivel=outra] #p-cnae,html[data-pn-nivel=etapas] #panel-roteiro .consultas-contexto,html[data-pn-nivel=itens] #panel-roteiro .consultas-contexto{display:none!important}header.app-header [data-pn-perfil]{display:none!important}#panel-roteiro .route-item details.legal{display:none!important}header.app-header .p-bar{display:flex;align-items:center;gap:8px;padding:8px 12px!important;min-height:0!important}header.app-header .p-ident{flex:1;min-width:0}header.app-header .p-ident b{display:block;font-size:1rem!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}header.app-header .p-ident>span{display:none!important}header.app-header .p-acoes{display:flex;gap:6px;flex:0 0 auto;margin:0!important}header.app-header .p-acoes button{min-height:34px!important;padding:4px 11px!important;font-size:.82rem!important;border-radius:999px}header.app-header nav.tabs{padding-top:4px!important;padding-bottom:0!important}header.app-header nav.tabs .tab{min-height:40px!important;padding:6px 10px!important;font-size:.92rem!important}#p-cnae{padding:10px 14px!important;margin:10px 12px!important}#p-cnae .p-cnae-desc{font-size:.95rem}#p-cnae .p-tags{margin:6px 0!important}#p-cnae .p-tag{font-size:.75rem}#p-cnae details>summary{font-size:.85rem}#p-cnae details .p-note{margin-top:8px}#panel-roteiro .consultas-contexto{padding:0!important;margin:10px 12px!important}#panel-roteiro .consultas-contexto>summary{font-size:.95rem;padding:12px 14px!important}#panel-roteiro .consultas-contexto[open]{padding:0 12px 12px!important}#panel-roteiro .trilha .hero{padding:14px 16px!important}#panel-roteiro .trilha .hero h2{font-size:1.1rem!important;line-height:1.25}#panel-roteiro .trilha .hero p{font-size:.85rem!important;line-height:1.45}#panel-roteiro .trilha .hero .eyebrow{font-size:.7rem!important}html[data-pn-nivel=outra] #n3-dock{display:none!important}#n3-dock{gap:6px!important;padding-left:8px!important;padding-right:8px!important}#n3-dock>span{font-size:.8rem;white-space:nowrap}#n3-dock button{font-size:.84rem!important;padding-left:10px!important;padding-right:10px!important;white-space:nowrap;flex:0 0 auto}@media (max-width:430px){#n3-dock:has(button+button)>span{display:none}#n3-dock button[data-n3-ant]{font-size:0!important;width:46px;padding:0!important}#n3-dock button[data-n3-ant]::before{content:"←";font-size:1.15rem}}.pn-blocos{margin:0 0 8px;padding:6px 0}.pn-blocos>span{display:block;font-size:.72rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#876B3F;margin:0 2px 4px}.pn-blocos>div{display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px}.pn-blocos button{flex:0 0 auto;max-width:230px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border:1px solid #d9ccb8;border-radius:999px;background:#fff;color:#4a3a22;padding:6px 11px;font:600 .78rem/1.2 inherit;cursor:pointer}.pn-blocos button b{display:inline-block;min-width:1.2em;text-align:center}.pn-blocos button.on{background:#876B3F;border-color:#876B3F;color:#fff}.prod-pop13-stage2>label{display:block;border:1px solid #e2d3c2;border-radius:14px;padding:12px;margin:12px 0}.prod-pop13-stage2>label>b{display:block;margin-bottom:8px}.prod-pop13-stage2 fieldset{margin:14px 0!important}.prod-pop13-stage2 .lead{font-size:.9rem}</style>');
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observar);else observar();
})();
