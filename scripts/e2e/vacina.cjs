'use strict';
/* Vacinação em Serviços: o card abre os três roteiros e volta ao grupo; cada
   roteiro guarda as respostas à parte; a UBS não tem prescrição (art. 14) nem
   extramuros (art. 17), que a RDC 197/2017 restringe aos serviços privados;
   o calendário de consulta está presente. Uso: node scripts/e2e/vacina.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
(async()=>{const b=await T.navegador();
 const p=await b.newPage({viewport:{width:430,height:900}});const erros=[];p.on('pageerror',e=>erros.push(e.message));
 await p.goto(T.INDEX);await p.waitForTimeout(1200);
 await p.evaluate(()=>document.querySelector('[data-nucleo="Serviços"]').click());await p.waitForTimeout(400);
 ok(await p.evaluate(()=>[...document.querySelectorAll('#lista-corpo .rot-card b')].map(x=>x.textContent).join('|'))==='Estética e beleza|Academias e piscinas|Vacinação','Serviços com 3 cards');
 await p.evaluate(()=>[...document.querySelectorAll('#lista-corpo .rot-card')].find(x=>/Vacinação/.test(x.textContent)).click());await p.waitForTimeout(400);
 ok(await p.evaluate(()=>document.querySelectorAll('#lista-corpo .rot-card').length)===3,'Vacinação abre 3 roteiros');
 await p.evaluate(()=>[...document.querySelectorAll('#lista-corpo .rot-card')].find(x=>/Unidade Básica/.test(x.textContent)).click());await p.waitForTimeout(4000);
 const f=p.frames().find(x=>x!==p.mainFrame());
 const d=await f.evaluate(()=>({ids:ROTEIRO.secoes.flatMap(s=>s.itens.flatMap(i=>(i.perguntas||[]).map(q=>q.id))),itens:ROTEIRO.secoes.flatMap(s=>s.itens.map(i=>i.id)),normas:ROTEIRO.normas.map(n=>n[0]).join('|'),inf:ROTEIRO.infracoes.map(i=>i.id)}));
 ok(!d.ids.includes('prescricao')&&!d.itens.includes('extramuros')&&!d.inf.includes('vac_prescr')&&!d.inf.includes('vac_extra'),'UBS sem prescrição (art. 14) e sem extramuros (art. 17)');
 ok(!/44\/2009/.test(d.normas),'UBS sem RDC 44/2009');ok(d.itens.includes('consulta')||d.itens.length>0&&await f.evaluate(()=>ROTEIRO.secoes.some(s=>s.id==='consulta')),'calendários de consulta');
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'dados'}));await p.waitForTimeout(300);
 await f.fill('input[data-rs-meta="fantasia"]','UBS Teste');await p.waitForTimeout(200);
 await p.evaluate(()=>window.__cascaVoltarDireto());await p.waitForTimeout(500);
 ok(await p.evaluate(()=>document.getElementById('lista-tit').textContent)==='Vacinação','voltar do roteiro leva ao grupo');
 await p.evaluate(()=>[...document.querySelectorAll('#lista-corpo .rot-card')].find(x=>/drogaria/.test(x.textContent)).click());await p.waitForTimeout(4000);
 const f2=p.frames().find(x=>x!==p.mainFrame());
 const d2=await f2.evaluate(()=>({ids:ROTEIRO.secoes.flatMap(s=>s.itens.flatMap(i=>(i.perguntas||[]).map(q=>q.id))),normas:ROTEIRO.normas.map(n=>n[0]).join('|')}));
 ok(d2.ids.includes('prescricao')&&d2.ids.includes('extra_aut')&&/44\/2009/.test(d2.normas),'drogaria igual ao Medicamentos (prescrição, extramuros, RDC 44)');
 ok(!await f2.evaluate(()=>(document.querySelector('input[data-rs-meta="fantasia"]')||{}).value),'drogaria não herda dados da UBS');
 ok(/UBS Teste/.test(await p.evaluate(()=>localStorage.getItem('uvis-vacinacao-ubs-v1'))),'UBS guarda à parte');
 if(erros.length)T.falha('erros de página: '+erros.join(' / '));
 await b.close()})();
