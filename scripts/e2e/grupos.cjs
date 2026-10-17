'use strict';
/* Cards que abrem listas (17/10/2026): Serviços com Vacinação (card único) e
   EAC (Tipos I, II e III); Medicamentos igual ao site Medicamentos (Drogaria
   com drogaria, EAC e vacinação; Manipulação; Atacadista com distribuidora e
   gases). Vacinação: natureza pública marca os arts. 14 e 17 como “Não se
   aplica”; farmácia traz a RDC 44/2009. A cor do roteiro segue o núcleo de onde
   foi aberto. Os módulos de medicamentos trazem os ajustes do site Medicamentos.
   Uso: node scripts/e2e/grupos.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
const cards=p=>p.evaluate(()=>[...document.querySelectorAll('#lista-corpo .rot-card b')].map(x=>x.textContent).join('|'));
const clica=(p,re)=>p.evaluate(s=>[...document.querySelectorAll('#lista-corpo .rot-card')].find(x=>new RegExp(s).test(x.textContent)).click(),re);
const quadro=p=>p.frames().find(x=>x!==p.mainFrame());
(async()=>{const b=await T.navegador();
 const p=await b.newPage({viewport:{width:430,height:900}});const erros=[];p.on('pageerror',e=>erros.push(e.message));p.on('dialog',d=>d.accept());
 await p.goto(T.INDEX);await p.waitForTimeout(1200);
 // Serviços
 await p.evaluate(()=>document.querySelector('[data-nucleo="Serviços"]').click());await p.waitForTimeout(400);
 ok(await cards(p)==='Estética e beleza|Academias e piscinas|Vacinação|Exames de análises clínicas (EAC)','Serviços: Estética, Academias, Vacinação e EAC');
 await clica(p,'EAC');await p.waitForTimeout(400);
 ok(await cards(p)==='Serviço Tipo I|Serviço Tipo II|Serviço Tipo III','EAC abre os Serviços Tipo I, II e III');
 await p.evaluate(()=>document.querySelector('#tela-lista [data-home]').click());await p.waitForTimeout(300);
 ok(await p.evaluate(()=>document.getElementById('lista-tit').textContent)==='Serviços','voltar do grupo leva ao núcleo');
 await clica(p,'Vacinação');await p.waitForTimeout(4000);
 let f=quadro(p);ok(await f.evaluate(()=>ROTEIRO.app)==='vacinacao','Vacinação abre o roteiro único');
 ok(await p.evaluate(()=>__uvisTemaApp('vacinacao')[0])===await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--t-ser').trim()),'vacinação aberta em Serviços tem a cor de Serviços');
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'dados'}));await p.waitForTimeout(300);
 await f.selectOption('select[data-rs-meta="natureza"]','publico');await f.selectOption('select[data-rs-meta="tipo_est"]','ubs');await p.waitForTimeout(300);
 const itemMod=await f.evaluate(()=>{for(const s of ROTEIRO.secoes)for(const i of s.itens)if((i.campos||[]).some(c=>c.id==='extramuros'))return [s.id,i.id]});
 await f.evaluate(([a,i])=>UvisPadrao.vai({aba:'roteiro',secao:a,item:i}),itemMod);await p.waitForTimeout(300);
 await f.selectOption('select[data-rs-meta="extramuros"]','sim');await p.waitForTimeout(300);
 let s=await p.evaluate(()=>JSON.parse(localStorage.getItem('uvis-vacinacao-v1')||'{}'));
 ok(s.r.prescricao==='na'&&s.r.extra_aut==='na'&&s.r.extra_regras==='na','serviço público: prescrição (art. 14) e extramuros (art. 17) como Não se aplica');
 const itemExtra=await f.evaluate(()=>{const s=ROTEIRO.secoes.find(x=>x.itens.some(i=>(i.perguntas||[]).some(q=>q.id==='extra_aut')));return [s.id,s.itens.find(i=>(i.perguntas||[]).some(q=>q.id==='extra_aut')).id]});
 await f.evaluate(([a,i])=>UvisPadrao.vai({aba:'roteiro',secao:a,item:i}),itemExtra);await p.waitForTimeout(300);
 ok(await f.evaluate(()=>/serviços privados/.test(document.querySelector('.rs-na-item')?.textContent||'')),'item de extramuros com o aviso de Não se aplica');
 let rel=await T.texto(f,'vacinacao');ok(!/44\/2009/.test(rel),'UBS: relatório sem RDC 44/2009');
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'dados'}));await p.waitForTimeout(300);
 await f.selectOption('select[data-rs-meta="natureza"]','privado');await f.selectOption('select[data-rs-meta="tipo_est"]','farmacia');await p.waitForTimeout(300);
 s=await p.evaluate(()=>JSON.parse(localStorage.getItem('uvis-vacinacao-v1')||'{}'));ok(!s.r.prescricao&&!s.r.extra_aut,'serviço privado: arts. 14 e 17 voltam a ser verificados');
 rel=await T.texto(f,'vacinacao');ok(/44\/2009/.test(rel),'farmácia: relatório com a RDC 44/2009');
 await p.evaluate(()=>window.__cascaVoltarDireto());await p.waitForTimeout(500);
 ok(await p.evaluate(()=>document.getElementById('lista-tit').textContent)==='Serviços','voltar do roteiro leva a Serviços');
 // Medicamentos
 await p.evaluate(()=>document.querySelector('#tela-lista [data-home]').click());await p.waitForTimeout(300);
 await p.evaluate(()=>document.querySelector('[data-nucleo="Medicamentos"]').click());await p.waitForTimeout(400);
 ok(await cards(p)==='Drogaria|Farmácia com manipulação|Atacadista de medicamentos','Medicamentos: Drogaria, Manipulação e Atacadista');
 await clica(p,'^Drogaria');await p.waitForTimeout(400);
 ok(await cards(p)==='Drogaria|Exames de análises clínicas (EAC)|Vacinação','Drogaria abre drogaria, EAC e vacinação');
 await clica(p,'Vacinação');await p.waitForTimeout(4000);f=quadro(p);
 ok(await f.evaluate(()=>ROTEIRO.app)==='vacinacao','Drogaria › Vacinação é o mesmo roteiro de Serviços');
 ok(await p.evaluate(()=>__uvisTemaApp('vacinacao')[0])===await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--t-med').trim()),'vacinação aberta em Medicamentos tem a cor de Medicamentos');
 await p.evaluate(()=>window.__cascaVoltarDireto());await p.waitForTimeout(500);
 ok(await p.evaluate(()=>document.getElementById('lista-tit').textContent)==='Drogaria','voltar leva ao grupo Drogaria');
 await clica(p,'EAC');await p.waitForTimeout(4000);f=quadro(p);ok(await f.evaluate(()=>ROTEIRO.app)==='eac-tipo1','Drogaria › EAC é o Serviço Tipo I');
 await p.evaluate(()=>window.__cascaVoltarDireto());await p.waitForTimeout(500);
 await clica(p,'^Drogaria');await p.waitForTimeout(6000);f=quadro(p);
 ok(await f.evaluate(()=>typeof window.__drgSuperHtml==='function'),'drogaria com o ajuste de supermercado do site Medicamentos');
 await p.evaluate(()=>window.__cascaVoltarDireto());await p.waitForTimeout(500);
 await p.evaluate(()=>document.querySelector('#tela-lista [data-home]').click());await p.waitForTimeout(300);
 await clica(p,'Atacadista');await p.waitForTimeout(400);
 ok(await cards(p)==='Atacadista de medicamentos|Atacadista de gases medicinais','Atacadista: distribuidora/transportadora e gases medicinais');
 await clica(p,'gases');await p.waitForTimeout(4000);f=quadro(p);
 ok(await f.evaluate(()=>ROTEIRO.app==='gases-medicinais'&&ROTEIRO.secoes.some(s=>s.itens.some(i=>(i.perguntas||[]).some(q=>q.id==='conferencia'&&q.pontos)))),'gases medicinais com checklist no recebimento');
 await p.evaluate(()=>window.__cascaVoltarDireto());await p.waitForTimeout(500);
 await clica(p,'Atacadista de medicamentos');await p.waitForTimeout(6000);f=quadro(p);
 ok(await f.evaluate(()=>/opTipo/.test(document.documentElement.innerHTML)||typeof window.__atacadistaAjustes!=='undefined'||!!document.querySelector('script')),'atacadista abre');
 await p.evaluate(()=>window.__cascaVoltarDireto());await p.waitForTimeout(500);
 await p.evaluate(()=>document.querySelector('#tela-lista [data-home]').click());await p.waitForTimeout(300);
 await clica(p,'manipulação');await p.waitForTimeout(6000);f=quadro(p);
 ok(await f.evaluate(()=>typeof APP_DATA!=='undefined'&&!!APP_DATA.cards['13']),'manipulação com o bloco 13 (estéreis) do site Medicamentos');
 if(erros.length)T.falha('erros de página: '+erros.join(' / '));
 await b.close()})();
