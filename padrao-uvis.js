/* ——— Padrão UVIS de navegação (o mesmo da drogaria e da manipulação) ———
   Componente único, dirigido por dados. Cada núcleo informa as seções, os itens e
   desenha o conteúdo de cada item; o componente cuida do resto:
   · cabeçalho (seta de voltar, título centralizado, espaço para Fotos e Salvas),
     na cor do núcleo;
   · abas Roteiro / Infrações / Relatório;
   · faixa de seções (Todas + seções), rolagem horizontal;
   · três níveis: lista de seções › grade de itens numerados › tela do item, com a
     faixa de itens da seção;
   · rodapé fixo: ← anterior, limpar, grade (todas as seções), → próximo;
   · cada tela nova começa no topo; o voltar do celular volta um nível;
   · layout fluido (celular, tablet, computador).
   Uso:
     UvisPadrao.monta({
       titulo:'ATACADISTA / DISTRIBUIDOR', cor:'#6b4a1f',
       abas:[{id:'roteiro',rotulo:'Roteiro'},{id:'infracoes',rotulo:'Infrações'},{id:'relatorio',rotulo:'Relatório'}],
       secoes:()=>[{id,titulo,resumo,icone,itens:[{id,titulo,resumo,feitos,total}]}],
       item:(secao,item,el)=>{…desenha o item em el…},
       aba:(id,el)=>{…desenha Infrações/Relatório em el…},
       limpar:(secao,item)=>{…}  // opcional
     });
     UvisPadrao.atualiza()  → redesenha a tela atual (progresso etc.)
     UvisPadrao.vai({aba,secao,item}) → navega
   Inserido nos módulos pela casca (rec--padrao-uvis.js / rec--padrao-uvis.css). */
(function(){
 if(window.UvisPadrao)return;
 var cfg=null,nav={aba:'roteiro',secao:null,item:null},raiz=null,montado=false,rolagem={};
 var ICON={back:'M14 5l-7 7 7 7M7 12h14',next:'M10 5l7 7-7 7M3 12h14',clear:'M9 4h12v16H9l-7-8 7-8M12 9l6 6M18 9l-6 6',menu:'M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z',
  building:'M4 21V5h16v16M2 21h20M8 9h2M14 9h2M8 13h2M14 13h2M10 21v-4h4v4',people:'M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M18 8a3 3 0 0 1 0 6M21 21v-2a4 4 0 0 0-3-3M13 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  plan:'M3 3h18v18H3zM3 11h8V3M11 16v5M16 11h5',lab:'M9 3h6M10 3v6l-6 10a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3M8 15h8',folder:'M3 7h7l2 2h9v12H3zM3 7V3h7l2 2h9v4',
  cold:'M12 2v20M3 7l18 10M3 17L21 7M9 4l3 3 3-3M9 20l3-3 3 3',shield:'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3M8 12l3 3 5-6',truck:'M2 5h12v12H2zM14 9h4l4 4v4h-8M7 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0M21 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  note:'M4 3h16v18H4zM8 8h8M8 12h8M8 16h5',box:'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10',water:'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z',food:'M6 3v8a2 2 0 0 0 4 0V3M8 11v10M16 3c-2 2-2 6 0 8v10',tooth:'M7 3c-2 0-4 2-4 5 0 4 2 5 2 9 0 2 1 4 2 4s2-3 3-6h4c1 3 2 6 3 6s2-2 2-4c0-4 2-5 2-9 0-3-2-5-4-5-2 0-3 1-5 1S9 3 7 3z',
  check:'M5 12l5 5 9-10'};
 function icone(n,cls){return '<svg class="'+(cls||'ui-icon')+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="'+(ICON[n]||ICON.note)+'"/></svg>'}
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function $(s,r){return (r||document).querySelector(s)}
 function secoes(){try{return (cfg.secoes()||[]).filter(function(s){return s&&s.itens})}catch(e){console.error(e);return []}}
 function acha(id){return secoes().filter(function(s){return s.id===id})[0]||null}
 function progresso(s){var f=0,t=0;s.itens.forEach(function(i){f+=i.feitos||0;t+=i.total||0});return {f:f,t:t}}
 /* ordem linear de todos os itens (para ← e →) */
 function linear(){var l=[];secoes().forEach(function(s){s.itens.forEach(function(i){l.push({secao:s.id,item:i.id})})});return l}

 function casca(){
  document.documentElement.classList.add('uvis-layout','pu-ativo');
  if(cfg.cor)document.documentElement.style.setProperty('--pu-cor',cfg.cor);
  var abas=(cfg.abas||[{id:'roteiro',rotulo:'Roteiro'},{id:'infracoes',rotulo:'Infrações'},{id:'relatorio',rotulo:'Relatório'}]);
  raiz.innerHTML='<div class="ui-chrome pu-chrome"><header class="ui-header pu-header"><button type="button" class="pu-voltar" data-voltar-nucleo aria-label="Voltar ao núcleo" title="Voltar ao núcleo">'+icone('back')+'</button><h1 class="pu-titulo">'+esc(cfg.titulo)+'</h1><div class="pu-acoes"></div></header>'
   +'<nav class="ui-tabs pu-abas" style="grid-template-columns:repeat('+abas.length+',minmax(0,1fr))" aria-label="Partes do roteiro">'+abas.map(function(a){return '<button type="button" data-pu-aba="'+esc(a.id)+'" aria-selected="false">'+esc(a.rotulo)+'<span class="pu-n" data-pu-n="'+esc(a.id)+'" hidden></span></button>'}).join('')+'</nav>'
   +'<nav class="ui-sections pu-secoes" aria-label="Seções"></nav></div>'
   +'<main class="ui-main pu-main" id="pu-main" tabindex="-1"></main>'
   +'<nav class="ui-toolbar pu-rodape" aria-label="Navegação"><button type="button" data-pu-nav="ant" aria-label="Anterior" title="Anterior">'+icone('back')+'</button><button type="button" class="ui-clear" data-pu-nav="limpar" aria-label="Limpar dados desta tela" title="Limpar dados desta tela">'+icone('clear')+'</button><button type="button" class="ui-all" data-pu-nav="todas" aria-label="Todas as seções" title="Todas as seções">'+icone('menu')+'</button><button type="button" class="ui-next" data-pu-nav="prox" aria-label="Próximo" title="Próximo">'+icone('next')+'</button></nav>';
  raiz.addEventListener('click',clique);
  /* altura real do cabeçalho fixo: a faixa de itens e o título do item ficam logo abaixo dele */
  var ch=$('.pu-chrome',raiz),mede=function(){if(ch)document.documentElement.style.setProperty('--pu-chrome-h',ch.getBoundingClientRect().height+'px')};mede();
  try{new ResizeObserver(mede).observe(ch)}catch(e){window.addEventListener('resize',mede)}
  window.addEventListener('popstate',function(e){var s=e.state&&e.state.pu;if(!s)return;nav={aba:s.aba,secao:s.secao,item:s.item};desenha(false)});
 }

 function faixaSecoes(){var el=$('.pu-secoes',raiz);if(!el)return;var ss=secoes();
  if(nav.aba!=='roteiro'){el.hidden=true;return}el.hidden=false;
  el.innerHTML='<button type="button" data-pu-secao=""'+(nav.secao?'':' aria-current="page"')+'>Todas</button>'+ss.map(function(s,i){return '<button type="button" data-pu-secao="'+esc(s.id)+'"'+(nav.secao===s.id?' aria-current="page"':'')+'>'+esc(s.curto||s.titulo)+'</button>'}).join('');
  var at=el.querySelector('[aria-current=page]');if(at&&at.scrollIntoView)try{at.scrollIntoView({block:'nearest',inline:'center'})}catch(e){}}

 function telaTodas(m){var ss=secoes();
  m.innerHTML=(cfg.topo?'<div class="pu-topo">'+cfg.topo()+'</div>':'')+'<div class="ui-card-grid pu-secoes-grade">'+ss.map(function(s,i){var p=progresso(s);return '<button type="button" data-pu-secao="'+esc(s.id)+'"><span class="ui-card-icon">'+icone(s.icone||'note')+'</span><span><span class="ui-card-index">SEÇÃO '+(i+1)+'</span><strong>'+esc(s.titulo)+'</strong>'+(s.resumo?'<small>'+esc(s.resumo)+'</small>':'')+(p.t?'<small class="pu-prog">'+p.f+'/'+p.t+' respondidos</small>':'')+'</span></button>'}).join('')+'</div>';}

 function telaSecao(m,s){var idx=secoes().findIndex(function(x){return x.id===s.id});
  if(s.itens.length===1&&s.direto){nav.item=s.itens[0].id;return telaItem(m,s,s.itens[0])}
  m.innerHTML='<div class="ui-section-heading pu-cab-secao">'+(idx+1)+' · '+esc(s.titulo)+'</div>'+(s.descricao?'<p class="pu-desc">'+esc(s.descricao)+'</p>':'')
   +'<div class="pu-itens">'+s.itens.map(function(it,k){var t=it.total||0,f=it.feitos||0;return '<button type="button" class="pu-item-card'+(t&&f>=t?' pu-completo':'')+'" data-pu-item="'+esc(it.id)+'"><span class="pu-num">'+(it.numero||((idx+1)+'.'+(k+1)))+'</span><span class="pu-item-txt"><strong>'+esc(it.titulo)+'</strong>'+(it.resumo?'<small>'+esc(it.resumo)+'</small>':'')+'<small class="pu-prog">'+(t?f+'/'+t+' respondidos':'Abrir item')+'</small></span><span class="pu-abrir" aria-hidden="true">Abrir →</span></button>'}).join('')+'</div>';}

 function telaItem(m,s,it){var idx=secoes().findIndex(function(x){return x.id===s.id}),k=s.itens.findIndex(function(x){return x.id===it.id});
  m.innerHTML='<div class="pu-fixo"><div class="pu-faixa" role="tablist" aria-label="Itens da seção">'+s.itens.map(function(x,j){return '<button type="button" data-pu-item="'+esc(x.id)+'"'+(x.id===it.id?' aria-current="step"':'')+'>'+esc(x.numero||((idx+1)+'.'+(j+1)))+' · '+esc(x.curto||x.titulo)+'</button>'}).join('')+'</div>'
   +'<div class="ui-section-heading pu-cab-item">'+esc(it.numero||((idx+1)+'.'+(k+1)))+' '+esc(it.titulo)+'</div></div><div class="pu-conteudo" id="pu-conteudo"></div>';
  var c=$('#pu-conteudo',m);try{cfg.item(s,it,c)}catch(e){console.error(e);c.innerHTML='<p class="pu-erro">Não foi possível abrir este item.</p>'}
  var at=m.querySelector('.pu-faixa [aria-current=step]');if(at&&at.scrollIntoView)try{at.scrollIntoView({block:'nearest',inline:'center'})}catch(e){}}

 function telaAba(m){m.innerHTML='<div class="pu-aba-conteudo" id="pu-aba"></div>';try{cfg.aba(nav.aba,$('#pu-aba',m))}catch(e){console.error(e)}}

 function botoes(){var t=$('.pu-rodape',raiz);if(!t)return;var r=nav.aba==='roteiro';t.hidden=!r;document.documentElement.classList.toggle('pu-sem-rodape',!r);if(!r)return;
  var L=linear(),i=L.findIndex(function(x){return x.secao===nav.secao&&x.item===nav.item});
  var ant=t.querySelector('[data-pu-nav=ant]'),prox=t.querySelector('[data-pu-nav=prox]'),lim=t.querySelector('[data-pu-nav=limpar]');
  ant.disabled=!nav.secao;prox.disabled=nav.item?i>=L.length-1:!secoes().length;lim.disabled=!nav.secao||!cfg.limpar}

 function abas(){[].forEach.call(raiz.querySelectorAll('[data-pu-aba]'),function(b){b.setAttribute('aria-selected',String(b.dataset.puAba===nav.aba))});
  if(cfg.contagem)[].forEach.call(raiz.querySelectorAll('[data-pu-n]'),function(s){var n=0;try{n=cfg.contagem(s.dataset.puN)||0}catch(e){}s.textContent=n;s.hidden=!n})}

 function desenha(historico){var m=$('#pu-main',raiz);if(!m)return;
  if(historico!==false){try{var st={pu:{aba:nav.aba,secao:nav.secao,item:nav.item}};history.pushState(st,'')}catch(e){}}
  abas();faixaSecoes();
  if(nav.aba!=='roteiro')telaAba(m);
  else{var s=nav.secao&&acha(nav.secao);if(!s){nav.secao=null;nav.item=null;telaTodas(m)}else{var it=nav.item&&s.itens.filter(function(x){return x.id===nav.item})[0];if(it)telaItem(m,s,it);else{nav.item=null;telaSecao(m,s)}}}
  botoes();
  try{window.scrollTo(0,0)}catch(e){}
  if(cfg.depois)try{cfg.depois(nav)}catch(e){}
  document.dispatchEvent(new CustomEvent('uvis-padrao:tela',{detail:{aba:nav.aba,secao:nav.secao,item:nav.item}}));}

 function vai(n,historico){nav={aba:n.aba||nav.aba,secao:n.secao===undefined?nav.secao:n.secao,item:n.item===undefined?nav.item:n.item};if(n.aba&&n.aba!=='roteiro'){}desenha(historico)}

 function clique(e){var b;
  if((b=e.target.closest('[data-pu-aba]'))){vai({aba:b.dataset.puAba,secao:nav.secao,item:nav.item});return}
  if((b=e.target.closest('[data-pu-secao]'))){vai({aba:'roteiro',secao:b.dataset.puSecao||null,item:null});return}
  if((b=e.target.closest('[data-pu-item]'))){vai({aba:'roteiro',secao:nav.secao,item:b.dataset.puItem});return}
  if((b=e.target.closest('[data-pu-nav]'))){var a=b.dataset.puNav,L=linear(),i=L.findIndex(function(x){return x.secao===nav.secao&&x.item===nav.item});
   if(a==='todas')vai({aba:'roteiro',secao:null,item:null});
   else if(a==='ant'){if(nav.item){if(i>0&&L[i-1].secao===nav.secao)vai({item:L[i-1].item});else vai({item:null})}else vai({secao:null,item:null})}
   else if(a==='prox'){if(nav.item){if(i<L.length-1)vai({secao:L[i+1].secao,item:L[i+1].item})}else if(nav.secao){var s=acha(nav.secao);if(s&&s.itens[0])vai({item:s.itens[0].id})}else{var s0=secoes()[0];if(s0)vai({secao:s0.id,item:null})}}
   else if(a==='limpar'&&cfg.limpar){var s2=acha(nav.secao),it=s2&&nav.item&&s2.itens.filter(function(x){return x.id===nav.item})[0];if(confirm(it?'Limpar as respostas deste item?':'Limpar as respostas desta seção?')){try{cfg.limpar(s2,it||null)}catch(err){console.error(err)}desenha(false)}}
   return}}

 window.UvisPadrao={
  monta:function(c){cfg=c;raiz=c.raiz||document.getElementById('app')||document.body;if(c.inicio)nav=Object.assign(nav,c.inicio);casca();montado=true;try{history.replaceState({pu:{aba:nav.aba,secao:nav.secao,item:nav.item}},'')}catch(e){}desenha(false)},
  atualiza:function(){if(!montado)return;var y=window.scrollY;abas();faixaSecoes();if(nav.aba==='roteiro'&&!nav.item){var m=$('#pu-main',raiz);var s=nav.secao&&acha(nav.secao);if(s)telaSecao(m,s);else telaTodas(m);window.scrollTo(0,y)}botoes()},
  vai:function(n){vai(n)},
  estado:function(){return {aba:nav.aba,secao:nav.secao,item:nav.item}},
  lista:function(){return secoes().map(function(x){return {id:x.id,titulo:x.titulo,itens:x.itens.map(function(i){return {id:i.id,titulo:i.titulo,feitos:i.feitos||0,total:i.total||0}})}})},
  icone:icone,esc:esc
 };
})();
