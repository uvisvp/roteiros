'use strict';
/* Teclado sobre o campo (17/10/2026): num celular (tela de toque), ao tocar numa
   anotação no fim da tela e o teclado abrir (a tela encolhe), o campo fica visível
   acima dele, a barra inferior some enquanto se digita e volta ao sair do campo.
   Uso: node scripts/e2e/teclado.cjs */
const T=require('./lib.cjs');
const log=console.log;console.log=(m,...r)=>{if(/^FALHA/.test(String(m)))T.falha(String(m).replace(/^FALHA:?\s*/,''));else log(m,...r)};
(async()=>{const b=await T.navegador();const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const p=await ctx.newPage();const erros=[];p.on('pageerror',e=>erros.push(e.message));
 await p.goto(T.INDEX);await p.waitForTimeout(900);await p.evaluate(()=>window.__cascaAbrirRoteiro('Serviços','academia-piscina','Academias e piscinas',''));await p.waitForTimeout(4500);
 const f=p.frames().find(x=>x!==p.mainFrame());
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'saude',item:'parq'}));await p.waitForTimeout(400);
 // abre a anotação da última pergunta e rola para que ela fique no fim da tela
 const id=await f.evaluate(()=>{const qs=[...document.querySelectorAll('[data-rs-anot]')];const d=qs[qs.length-1];d.open=true;return d.dataset.rsAnot});
 await p.waitForTimeout(200);
 await f.evaluate(id=>{const t=document.querySelector('textarea[data-rs-sit="'+id+'"]');const r=t.getBoundingClientRect();window.scrollBy(0,r.bottom-innerHeight+40)},id);await p.waitForTimeout(300);
 await f.tap('textarea[data-rs-sit="'+id+'"]');await p.waitForTimeout(150);
 // “teclado”: a tela encolhe
 await p.setViewportSize({width:390,height:420});await p.waitForTimeout(1200);
 const r=await f.evaluate(id=>{const t=document.querySelector('textarea[data-rs-sit="'+id+'"]').getBoundingClientRect();const rod=document.querySelector('[data-uvs-rodape]');return {top:t.top,bottom:t.bottom,h:innerHeight,classe:document.documentElement.classList.contains('uvs-digitando'),rodape:rod?getComputedStyle(rod).visibility:'sem'}},id);
  console.log(r.classe?'ok  digitando: classe ligada':'FALHA: classe');
 console.log(r.rodape==='hidden'?'ok  barra inferior escondida':'FALHA: barra inferior '+r.rodape);
 console.log(r.bottom<=420&&r.top>=0?'ok  campo visível acima do “teclado”':'FALHA: campo fora da área visível');
 
 await f.evaluate(()=>document.activeElement.blur());await p.waitForTimeout(400);
 console.log(await f.evaluate(()=>!document.documentElement.classList.contains('uvs-digitando'))?'ok  ao sair do campo, volta ao normal':'FALHA: classe ficou ligada');
 if(erros.length)T.falha('erros de página: '+erros.join(' / '));await b.close()})();
