/* Uso: node scripts/e2e/cliques.cjs '[["Medicamentos","drogaria","Drogaria",""]]' '{"width":390,"height":844}' 900
   Clica em todos os controles de cada roteiro (tela a tela) e aponta erros, travas e estouro de largura. */
/* Varredura profunda: a cada passo relê a tela, clica no primeiro controle ainda não clicado;
   quando a tela se esgota, avança (→). Registra erros, travas (6 s sem resposta) e estouro horizontal. */
const T=require('./lib.cjs');
const MODS=JSON.parse(process.argv[2]);const VP=JSON.parse(process.argv[3]||'{"width":390,"height":844}');const MAX=+(process.argv[4]||900);
const IGN=/ERR_CERT|net::|Failed to load resource|favicon|tesseract|pdf\.worker|ERR_NAME|ERR_INTERNET|CORS|fetch|Load failed|NetworkError|base-vigilancia|getUserMedia|NotAllowed|NotFoundError: Requested device|ResizeObserver loop/i;
const lim=(pr,ms)=>Promise.race([pr,new Promise((_,r)=>setTimeout(()=>r(Error('trav')),ms))]);
const COLETA=()=>{const r=[];let i=0;document.querySelectorAll('button,[role=button],summary,[role=tab],label.chip,.chip,input[type=checkbox],input[type=radio],select').forEach(el=>{const b=el.getBoundingClientRect();if(!b.width||!b.height||el.disabled)return;if(el.closest('dialog:not([open])'))return;
  const t=(el.innerText||el.getAttribute('aria-label')||el.title||el.value||'').trim().replace(/\s+/g,' ').slice(0,60);
  if(/apagar todos|apagar esta inspe|excluir tudo|voltar ao n[uú]cleo|imprimir|fotografar|📷|pdf ou imagem|escanear|c[aâ]mera|sair/i.test(t))return;if(el.closest('[data-voltar-nucleo]'))return;
  const nav=/^(→|próximo|continuar)$/i.test(t)||/pr[oó]ximo/i.test(el.getAttribute('aria-label')||'')||el.id==='next'||el.id==='dockNext'||el.dataset.puNav==='prox'||el.hasAttribute('data-med-next');
  const aba=/^(roteiro|infra[cç][oõ]es|relat[oó]rio|inventário|anexo ii|consulta|selecionadas|todas|todas as se[cç][oõ]es)$/i.test(t)||el.getAttribute('role')==='tab'||el.hasAttribute('data-med-all')||el.dataset.puNav==='todas'||el.hasAttribute('data-nav-card')||el.hasAttribute('data-pu-aba');
  el.dataset.mk=++i;r.push({i,t,nav,aba,sig:el.tagName+'|'+t+'|'+Object.keys(el.dataset).filter(k=>k!=='mk').sort().join(',')+'|'+(el.getAttribute('data-v')||el.getAttribute('data-status')||'')})});return r};
(async()=>{const b=await T.navegador();
for(const [nuc,app,tit,qs] of MODS){
 const {p,f,erros}=await T.abre(nuc,app,tit,qs||'',{browser:b,viewport:VP});const cons=[];
 p.on('console',m=>{if(m.type()==='error'&&!IGN.test(m.text()))cons.push(m.text().slice(0,260))});p.on('popup',pp=>pp.close().catch(()=>{}));
 const vistos=new Set();let cliques=0,avancos=0,trav=[],estouro=new Set(),antes=0,porClique=[],parado=0;
 while(cliques<MAX&&avancos<120){
  let alvos;try{alvos=await lim(f.evaluate(COLETA),8000)}catch(e){trav.push('tela sem resposta após '+cliques+' cliques');break}
  let a=alvos.find(x=>!x.nav&&!x.aba&&!vistos.has(x.sig));
  if(!a){a=alvos.find(x=>x.nav);if(!a){a=alvos.find(x=>x.aba&&!vistos.has(x.sig));if(a)vistos.add(a.sig);else break}else{avancos++;const h=await f.evaluate(()=>document.body.innerText.length+':'+location.hash).catch(()=>'');if(h===parado){a=alvos.find(x=>x.aba&&!vistos.has(x.sig));if(!a)break;vistos.add(a.sig)}else parado=h}}
  else vistos.add(a.sig);
  cliques++;
  try{await lim(f.evaluate(i=>{const el=document.querySelector('[data-mk="'+i+'"]');if(!el)return;if(el.tagName==='SELECT'){if(el.options.length>1){el.selectedIndex=el.options.length-1;el.dispatchEvent(new Event('change',{bubbles:true}));el.dispatchEvent(new Event('input',{bubbles:true}))}}else el.click()},a.i),6000);
   await p.waitForTimeout(90);
   const w=await lim(f.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>{try{d.close()}catch(e){}});const w=document.documentElement.scrollWidth-window.innerWidth;return w>4?w:0}),6000);
   if(w)estouro.add(a.t+' (+'+w+'px)');
  }catch(e){trav.push(a.t)}
  const n=erros.length+cons.length;if(n>antes){porClique.push({clique:a.t,novos:erros.concat(cons).slice(antes).map(x=>x.slice(0,200))});antes=n}
 }
 const r={app:app+(qs?'?'+qs:''),vp:VP.width,cliques,avancos,erros:[...new Set(erros)].slice(0,8),console:[...new Set(cons)].slice(0,8),travou:trav.slice(0,8),estouro:[...estouro].slice(0,8),porClique:porClique.slice(0,10)};
 console.log(JSON.stringify(r));await p.close().catch(()=>{});
}
await b.close()})().catch(e=>{console.error('FATAL',e);process.exit(1)});
