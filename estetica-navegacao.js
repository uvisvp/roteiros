/* ——— Estética: navegação e inventário mais claros ———
   - Abas: “Estética — interesse à saúde”, “Serviço de saúde”, “Relatório (n)”.
   - Explicação de qual inventário usar, no topo do sumário.
   - Busca no inventário (o campo existia, mas não filtrava).
   - Etiquetas de citação completas: “§ 1º”, “inciso I”, “Parágrafo único”
     passam a trazer o artigo (“Art. 90, § 1º”). */
(function(){
 if(window.__esteticaNav)return;window.__esteticaNav=true;
 function nrm(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase()}
 /* 1. citações: completa o dispositivo com o artigo anterior da mesma norma */
 try{[].concat(typeof TODAS!=='undefined'?[TODAS]:[],['interest','health'].map(function(k){return (DATA[k]||[]).flatMap(function(g){return g.itens||[]})})).forEach(function(lista){lista.forEach(function(t){var ult={};(t.refs||[]).forEach(function(r){var d=String(r.display||'');
   if(/^Art\./i.test(d)){ult[r.law]=d.replace(/,.*$/,'');return}
   if(/^(§|inciso|al[íi]nea|par[áa]grafo)/i.test(d)&&ult[r.law])r.__art=ult[r.law]})})})}catch(e){}
 refButtons=function(t){return (t.refs||[]).map(function(r){var n=node(r.law,r.node),lbl=(n&&n.r)||r.display;if(r.__art&&/^(§|inciso|al[íi]nea|par[áa]grafo)/i.test(lbl))lbl=r.__art+', '+lbl.replace(/^Par[áa]grafo/,'parágrafo');var l=law(r.law);return '<button type="button" class="uvis-cite" data-ref-law="'+r.law+'" data-ref-node="'+r.node+'"'+(r.__art?' data-ref-art="'+esc(r.__art)+'"':'')+'>'+esc(UvisUI.label((l&&l.label)||r.law,lbl))+'</button>'}).join(' ')};
 var oLR=window.UvisLocalReferences;if(oLR)window.UvisLocalReferences=function(b){var r=oLR.apply(this,arguments);var art=b&&b.dataset&&b.dataset.refArt;if(art&&r&&r.length)r=r.map(function(x){return /^(§|inciso|al[íi]nea|par[áa]grafo)/i.test(String(x.device||''))?Object.assign({},x,{device:art+', '+String(x.device).replace(/^Par[áa]grafo/,'parágrafo')}):x});return r};
 /* 2. abas */
 var ROT={I:'Estética — interesse à saúde',S:'Serviço de saúde',R:'Relatório'};
 function rotulos(){document.querySelectorAll('.aba[data-bloco]').forEach(function(b){var k=b.dataset.bloco;if(!ROT[k])return;var n=(typeof escolhidas!=='undefined'&&k==='R')?escolhidas.size:0;b.textContent=ROT[k]+(k==='R'&&n?' ('+n+')':'')})}
 var oC=atualizarContagens;atualizarContagens=function(){var r=oC.apply(this,arguments);try{rotulos()}catch(e){}return r};
 /* 3. explicação no sumário */
 var AJ={I:'<b>Interesse à saúde</b>: estética sem procedimento invasivo, feita por esteticista ou técnico (Lei 13.643/2018). Use este inventário quando não há procedimento de saúde.',
         S:'<b>Serviço de saúde</b>: procedimentos invasivos, injetáveis ou com tecnologias em saúde, sob responsável técnico habilitado (RDC 63/2011). Use este inventário quando o local presta serviço de saúde.'};
 var oE=pintarEsquerda;pintarEsquerda=function(){var r=oE.apply(this,arguments);try{if(AJ[bloco]){var a=$('lista1');if(a&&!a.querySelector('.en-aj'))a.insertAdjacentHTML('afterbegin','<p class="en-aj">'+AJ[bloco]+'</p>')}}catch(e){}return r};
 /* 4. busca no inventário */
 function filtra(){var i=$('filtro');if(!i||!(bloco==='I'||bloco==='S'))return;var q=nrm(i.value).trim();
  document.querySelectorAll('#lista2 details.uvis-inventory').forEach(function(d){var vis=0;d.querySelectorAll(':scope>div>*').forEach(function(it){var ok=!q||nrm(it.textContent).indexOf(q)>=0;it.style.display=ok?'':'none';if(ok)vis++});var tema=q&&nrm(d.querySelector('summary').textContent).indexOf(q)>=0;
   if(tema)d.querySelectorAll(':scope>div>*').forEach(function(it){it.style.display=''});d.style.display=(!q||vis||tema)?'':'none';if(q&&(vis||tema))d.open=true})}
 var oM=pintarMeio;pintarMeio=function(){var r=oM.apply(this,arguments);try{var cx=$('caixaBusca');if(cx)cx.classList.toggle('en-on',bloco==='I'||bloco==='S');filtra()}catch(e){}return r};
 document.addEventListener('input',function(e){if(e.target&&e.target.id==='filtro')setTimeout(filtra,0)},true);
 var f=$('filtro');if(f)f.placeholder='Buscar infração, tema ou norma em todo o inventário';
 document.head.insertAdjacentHTML('beforeend','<style id="en-style">html body #caixaBusca.en-on{display:block!important}#caixaBusca.en-on label[for=buscaEscopo],#caixaBusca.en-on #buscaEscopo{display:none!important}#caixaBusca.en-on #filtro{display:block!important;width:100%;box-sizing:border-box;min-height:42px;padding:8px 12px;border:1px solid #b8c7d1;border-radius:10px;font:inherit}.en-aj{margin:10px 12px;padding:10px 12px;border:1px solid #d8e2e8;border-radius:10px;background:#f5f8fa;font-size:.86rem;line-height:1.45;color:#34495a}</style>');
 /* 5. faixa inferior (celular): o corpo reservava 76 px + área segura, mas a barra
    tem ~57 px, sobrando uma faixa vazia sob “Ver selecionadas”. A reserva passa a
    ser a altura real da barra, que agora inclui a área segura. O botão grande
    “Ver selecionadas” repetia o ☰ da barra: sai, e os ícones ganham nome. */
 var NOMES={prev:'Anterior',consulta:'Consulta',selecionadas:'Selecionadas',next:'Próximo'};
 function barra(){var tb=document.getElementById('uvis-estetica-toolbar');if(!tb)return;
  tb.querySelectorAll('[data-est-nav]').forEach(function(b){var k=b.getAttribute('data-est-nav');if(!NOMES[k])return;var sp=b.querySelector('.en-rot');if(!sp){sp=document.createElement('span');sp.className='en-rot';b.appendChild(sp)}
   var n=(k==='selecionadas'&&typeof escolhidas!=='undefined')?escolhidas.size:0;var t=NOMES[k]+(n?' ('+n+')':'');if(sp.textContent!==t)sp.textContent=t});
  document.documentElement.style.setProperty('--en-barra',Math.ceil(tb.getBoundingClientRect().height)+'px')}
 var oC2=atualizarContagens;atualizarContagens=function(){var r=oC2.apply(this,arguments);try{barra()}catch(e){}return r};
 window.addEventListener('resize',function(){try{barra()}catch(e){}});
 document.head.insertAdjacentHTML('beforeend','<style id="en-barra-style">html[data-uvis-app="estetica"] #uvis-estetica-toolbar{padding-bottom:calc(2px + env(safe-area-inset-bottom,0px))!important;min-height:0!important}html[data-uvis-app="estetica"] #uvis-estetica-toolbar button{flex-direction:column;gap:2px;min-height:50px!important}html[data-uvis-app="estetica"] #uvis-estetica-toolbar .en-rot{font:600 11px/1.1 system-ui;letter-spacing:0;white-space:nowrap}@media (max-width:600px){html[data-uvis-app="estetica"] body{padding-bottom:var(--en-barra,60px)!important}html[data-uvis-app="estetica"] #acoesMobile{display:none!important}}</style>');
 try{tudo();rotulos();barra();setTimeout(barra,300)}catch(e){}
})();
