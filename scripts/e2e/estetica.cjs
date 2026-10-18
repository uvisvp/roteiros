'use strict';
/* Estética no padrão dos demais roteiros (18/10/2026): perguntas do ROI de Estética da Anvisa
   (v1.3), perfil saúde/interesse à saúde no início filtrando roteiro e infrações, catálogo do
   módulo anterior com constatação, citações e relatório.
   Uso: node scripts/e2e/estetica.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
const CONST='agulhas de uso único reaproveitadas na sala 2, em 18/10/2026';
const perfil=(f,v)=>f.evaluate(v=>{UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'perfil'});const s=document.querySelector('select[data-rs-meta="p_tipo"]');s.value=v;s.dispatchEvent(new Event('change',{bubbles:true}))},v);
const responde=(f,id,val)=>f.evaluate(([id,val])=>{const q=document.querySelector('[data-rs-q="'+id+'"]');const bt=[...q.querySelectorAll('.pu-resp button')].find(b=>b.textContent.trim()===val);bt.click()},[id,val]);
(async()=>{const b=await T.navegador();
 const {p,f,erros}=await T.abre('Serviços','estetica','Estética e beleza','',{browser:b});
 const lista=()=>f.evaluate(()=>UvisPadrao.lista().map(s=>s.id));
 ok(JSON.stringify(await lista())==='["ident"]','sem classificação, só a Identificação');
 ok(await f.evaluate(()=>!!window.ROTEIRO&&ROTEIRO.app==='estetica'),'Estética no motor roteiro-simples (componente padrão)');
 /* serviço de saúde */
 await perfil(f,'saude');await p.waitForTimeout(500);
 const S=await f.evaluate(()=>UvisPadrao.lista());
 ok(S.length===9,'serviço de saúde: 9 seções ('+S.length+')');
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'regular',item:'licenca'}));await p.waitForTimeout(400);
 const q1=await f.evaluate(()=>{const q=document.querySelector('[data-rs-q="lic"]');return {n:q.querySelector('.pu-q-texto b').textContent,cits:[...q.querySelectorAll('button.rs-cit')].map(b=>b.textContent+(b.offsetParent?'':'[oculta]'))}});
 ok(q1.n==='2.1.1','numeração contínua (2.1.1)');
 ok(q1.cits.some(c=>/63\/2011/.test(c)&&!/oculta/.test(c))&&q1.cits.filter(c=>/13\.725/.test(c)).every(c=>/oculta/.test(c)),'licença: RDC 63/2011 na pergunta, Lei 13.725 só na capitulação');
 ok(!await f.evaluate(()=>!!document.querySelector('[data-rs-q="lic_i"]')),'pergunta de interesse à saúde fora do perfil de saúde');
 await responde(f,'lic','Não');await p.waitForTimeout(300);
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'proc',item:'interno'}));await p.waitForTimeout(400);
 await responde(f,'proc_s','Não');await p.waitForTimeout(300);
 /* infrações: só o catálogo de saúde, sugeridas pelas respostas, constatação */
 await f.evaluate(()=>UvisPadrao.vai({aba:'infracoes'}));await p.waitForTimeout(500);
 ok(await f.evaluate(()=>document.querySelectorAll('input[data-rs-inf]').length)===71,'aba Infrações: 71 enquadramentos de serviço de saúde');
 ok(await f.evaluate(()=>[...document.querySelectorAll('.rs-inf.rs-sug input')].map(x=>x.dataset.rsInf).includes('s01')),'licença “Não” sugere a infração de licença');
 await f.evaluate(()=>document.querySelector('[data-rs-sugeridas]').click());await p.waitForTimeout(400);
 ok(await f.evaluate(()=>!!document.querySelector('textarea[data-rs-inf-nota="s65"]')),'infração marcada abre o campo Constatação');
 await f.evaluate(t=>{const a=document.querySelector('textarea[data-rs-inf-nota="s65"]');a.value=t;a.dispatchEvent(new Event('input',{bubbles:true}))},CONST);
 await f.evaluate(()=>{const x=document.querySelector('input[data-rs-inf="s71"]');x.click()});await p.waitForTimeout(300);
 ok(await f.evaluate(()=>document.querySelector('input[data-rs-inf="s71"]').checked),'infração avulsa (bronzeamento UV) marcada na aba');
 /* relatório */
 await f.evaluate(()=>UvisPadrao.vai({aba:'relatorio'}));await p.waitForTimeout(800);
 const rel=await f.evaluate(()=>(document.querySelector('.rs-relatorio')||{}).innerText||'');
 const enq=rel.slice(rel.indexOf('ENQUADRAMENTO'));
 ok(/IRREGULARIDADES OBSERVADAS/.test(rel)&&/licença sanitária/i.test(rel),'relatório com as irregularidades do roteiro');
 ok(enq.includes('Agulhas de uso único reaproveitadas na sala 2, em 18/10/2026.'),'enquadramento descreve a infração pela constatação');
 ok(/Arts\. 46, 50 e 65 da Lei Municipal nº 13\.725\/2004 c\/c art\. 8º da RDC Anvisa nº 156\/2006/.test(enq),'capitulação do catálogo preservada');
 ok(/bronzeamento artificial/i.test(enq),'infração avulsa no enquadramento');
 const irr=rel.slice(rel.indexOf('IRREGULARIDADES OBSERVADAS'),rel.indexOf('ENQUADRAMENTO'));
 ok(/Fundamento: RDC Anvisa nº 63\/2011, art\. 10[^.]*Lei Municipal nº 13\.725\/2004, art\. 90/.test(irr),'fundamento da irregularidade com a RDC e a Lei 13.725');
 const dl=p.waitForEvent('download',{timeout:20000}).catch(()=>null);
 await f.evaluate(()=>document.querySelector('[data-rs-word]').click());await p.waitForTimeout(800);
 /* inspeção incompleta: a checagem de consistência pede confirmação */
 await f.evaluate(()=>{const x=[...document.querySelectorAll('button')].find(b=>/Emitir mesmo assim/.test(b.textContent));if(x)x.click()});
 const d=await dl;ok(!!d&&/\.docx$/i.test(d.suggestedFilename()),'Word baixado da aba Relatório'+(d?' ('+d.suggestedFilename()+')':''));
 /* interesse à saúde: outro catálogo; o que foi marcado no perfil de saúde sai do relatório */
 await perfil(f,'interesse');await p.waitForTimeout(500);
 ok((await lista()).length===8&&!(await f.evaluate(()=>UvisPadrao.lista().some(s=>s.itens.some(i=>i.id==='prontuario')))),'interesse à saúde: 8 seções, sem prontuário');
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'regular',item:'licenca'}));await p.waitForTimeout(400);
 const q2=await f.evaluate(()=>{const q=document.querySelector('[data-rs-q="lic_i"]');return q?{n:q.querySelector('.pu-q-texto b').textContent,cits:[...q.querySelectorAll('button.rs-cit')].filter(b=>b.offsetParent).map(b=>b.textContent)}:null});
 ok(q2&&q2.n==='2.1.1'&&q2.cits.length&&q2.cits.every(c=>/13\.725/.test(c)),'licença (interesse): só a Lei 13.725, que não tem norma específica, numerada 2.1.1');
 await f.evaluate(()=>UvisPadrao.vai({aba:'infracoes'}));await p.waitForTimeout(500);
 ok(await f.evaluate(()=>document.querySelectorAll('input[data-rs-inf]').length)===36,'aba Infrações: 36 enquadramentos de interesse à saúde');
 await f.evaluate(()=>UvisPadrao.vai({aba:'relatorio'}));await p.waitForTimeout(600);
 ok(!/ENQUADRAMENTO/.test(await f.evaluate(()=>(document.querySelector('.rs-relatorio')||{}).innerText||'')),'infrações do perfil de saúde fora do relatório de interesse à saúde');
 /* orientações com fonte (perfil e equipamentos) */
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'perfil'}));await p.waitForTimeout(400);
 const o1=await f.evaluate(()=>(document.querySelector('.rs-orient')||{}).textContent||'');
 ok(/Nota Técnica nº 2\/2024/.test(o1)&&/suspensa/.test(o1),'orientação: Nota Técnica 2/2024 suspensa');
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'equip',item:'equipamentos'}));await p.waitForTimeout(400);
 const o2=await f.evaluate(()=>[...document.querySelectorAll('.rs-orient li')].map(l=>l.textContent));
 ok(o2.length>=3&&o2.every(t=>/Fonte: \S/.test(t)),'orientações dos equipamentos com fonte');
 ok(o2.some(t=>/RDC Anvisa nº 56\/2009, art\. 1º/.test(t)),'bronzeamento UV proibido (RDC 56/2009) na orientação');
 ok(await f.evaluate(()=>!!document.querySelector('[data-rs-eq-buscar]')),'busca de equipamentos na Anvisa no item');
 if(erros.length)T.falha('erros de página: '+erros.join(' / '));
 await b.close()})();
