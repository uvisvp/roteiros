/* ——— Distribuidora: navegação no padrão do núcleo de medicamentos ———
   Três abas fixas, como na Drogaria e na Manipulação:
   Roteiro · Não conformidades (Anexo II) · Relatório.
   - Roteiro abre direto na grade de etapas (sem a tela inicial de dois cartões);
     Inventário de infrações e Normas continuam como abas internas do Roteiro.
   - Relatório reúne as etapas de fechamento (Anexo I, análise do plano, par
     técnico e fluxo SNVS). A trava do par técnico não muda.
   - Na grade de etapas, ← volta ao núcleo. */
(function distNavegacao(){
 const nav=document.createElement('nav');nav.className='dist-topnav';nav.setAttribute('aria-label','Seções do módulo');
 nav.innerHTML='<button type="button" data-dnav="roteiro">Roteiro</button><button type="button" data-dnav="nc">Não conformidades <small>Anexo II</small></button><button type="button" data-dnav="relatorio">Relatório</button>';
 const wrap=document.querySelector('.wrap');if(wrap)wrap.parentNode.insertBefore(nav,wrap);
 function marcar(){const atual=state.view==='closing'?'relatorio':(state.view==='inspection'&&state.itab==='anexo2')?'nc':'roteiro';nav.querySelectorAll('[data-dnav]').forEach(b=>b.setAttribute('aria-current',b.dataset.dnav===atual?'page':'false'))}
 const oldHome=renderHome;renderHome=function(){state.view='inspection';state.itab='roteiro';state.activeCard=null;save();renderInspection()};
 const oldI=renderInspection;renderInspection=function(){const r=oldI.apply(this,arguments);marcar();return r};
 const oldC=renderClosing;renderClosing=function(){const r=oldC.apply(this,arguments);marcar();return r};
 const oldIT=renderITab;renderITab=function(){const r=oldIT.apply(this,arguments);marcar();return r};
 const oldCT=renderCTab;renderCTab=function(){const r=oldCT.apply(this,arguments);marcar();return r};
 nav.addEventListener('click',function(e){const b=e.target.closest('[data-dnav]');if(!b)return;const d=b.dataset.dnav;
  if(d==='roteiro'){state.itab='roteiro';state.activeCard=null;save();renderInspection()}
  else if(d==='nc'){state.itab='anexo2';save();renderInspection()}
  else{if(state.view!=='closing'||!['report','plan','peer','snvs'].includes(state.ctab))state.ctab='report';save();renderClosing()}});
 /* “← Tela principal” das sub-telas leva à grade de etapas */
 document.addEventListener('click',function(e){const b=e.target.closest&&e.target.closest('[data-home]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();state.itab='roteiro';state.activeCard=null;save();renderInspection()},true);
 /* Barra inferior: na grade de etapas, ← volta ao núcleo */
 const oldD=distDock;distDock=function(){oldD();const inRoute=state.view==='inspection'&&state.itab==='roteiro';if(inRoute&&!state.activeCard){const back=byId('dockBack');back.onclick=()=>parentBack()}};
 const st=document.createElement('style');st.id='dist-topnav-style';st.textContent='.dist-topnav{position:sticky;top:0;z-index:30;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));background:#fff;border-bottom:1px solid var(--line,#d7e0e5)}.dist-topnav button{appearance:none;border:0;background:transparent;padding:12px 6px;font:inherit;font-weight:700;font-size:.92rem;color:#5f6d76;border-bottom:3px solid transparent;cursor:pointer;line-height:1.2}.dist-topnav button small{display:block;font-weight:600;font-size:.72rem;color:#8a969e}.dist-topnav button[aria-current="page"]{color:#22506C;border-bottom-color:#22506C;background:#f2f7fb}#home{display:none!important}#inspection>.subhead,#closing>.subhead{display:none!important}#inspectionTabs [data-itab="anexo2"]{display:none!important}';document.head.appendChild(st);
 if(state.view==='home'){state.view='inspection';state.itab=state.itab==='anexo2'?'roteiro':state.itab||'roteiro'}
})();
