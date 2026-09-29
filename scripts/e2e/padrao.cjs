'use strict';
/* Núcleos no Padrão UVIS: navegação e respostas.
   Uso: node scripts/e2e/padrao.cjs <núcleo> <app> <título> [qs]
   Verifica: → percorre todos os itens na ordem e ← volta; cada grupo de resposta (.pu-resp)
   de cada item altera o relatório (prévia); voltar do celular volta um nível; sem rolagem
   horizontal nem botões < 40 px nas larguras 375/430/800/1280; sem erro de página. */
const T=require('./lib.cjs');
const [nucleo,app,titulo,qs]=process.argv.slice(2);
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
(async()=>{const b=await T.navegador();
 const {p,f,erros}=await T.abre(nucleo,app,titulo,qs||'',{browser:b});
 const lista=await f.evaluate(()=>UvisPadrao.lista());
 const itens=[];lista.forEach(s=>s.itens.forEach(i=>itens.push({secao:s.id,item:i.id,titulo:i.titulo})));
 ok(lista.length>=2&&itens.length>=3,`estrutura: ${lista.length} seções, ${itens.length} itens`);
 // → percorre tudo
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:null,item:null}));await p.waitForTimeout(300);
 const vis=[];for(let k=0;k<itens.length+lista.length+3;k++){await f.evaluate(()=>{const b=document.querySelector('[data-pu-nav=prox]');if(b&&!b.disabled)b.click()});await p.waitForTimeout(150);const e=await f.evaluate(()=>UvisPadrao.estado());if(e.item&&(!vis.length||vis[vis.length-1]!==e.secao+'|'+e.item))vis.push(e.secao+'|'+e.item)}
 ok(vis.length===itens.length&&vis.every((v,i)=>v===itens[i].secao+'|'+itens[i].item),`→ percorre os ${itens.length} itens na ordem (${vis.length})`);
 ok(await f.evaluate(()=>document.querySelector('[data-pu-nav=prox]').disabled),'→ desabilitado no último item');
 await f.evaluate(()=>document.querySelector('[data-pu-nav=ant]').click());await p.waitForTimeout(200);
 const e1=await f.evaluate(()=>UvisPadrao.estado());const pen=itens[itens.length-2];
 ok(e1.item===pen.item||(!e1.item&&e1.secao===itens[itens.length-1].secao),'← volta ao item anterior da seção (ou à seção)');
 // voltar do celular
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:null,item:null}));await p.waitForTimeout(200);
 await f.evaluate(s=>UvisPadrao.vai({secao:s}),itens[0].secao);await p.waitForTimeout(200);
 await f.evaluate(i=>UvisPadrao.vai({item:i}),itens[0].item);await p.waitForTimeout(300);
 await f.evaluate(()=>history.back());await p.waitForTimeout(500);
 const e2=await f.evaluate(()=>UvisPadrao.estado());ok(e2.secao===itens[0].secao&&!e2.item,'voltar do celular: do item para a seção');
 await f.evaluate(()=>history.back());await p.waitForTimeout(500);
 const e3=await f.evaluate(()=>UvisPadrao.estado());ok(!e3.secao,'voltar do celular: da seção para a lista');
 // respostas → relatório
 let grupos=0,sem=[];
 for(const it of itens){await f.evaluate(([s,i])=>UvisPadrao.vai({aba:'roteiro',secao:s,item:i}),[it.secao,it.item]);await p.waitForTimeout(250);
  const n=await f.evaluate(()=>document.querySelectorAll('#pu-conteudo .pu-resp').length);
  for(let g=0;g<n;g++){grupos++;for(const alvo of [1,0]){const a=await T.texto(f,app);await f.evaluate(([g,alvo])=>{const r=document.querySelectorAll('#pu-conteudo .pu-resp')[g];const bt=r&&r.querySelectorAll('button')[alvo];if(bt&&bt.getAttribute('aria-pressed')!=='true')bt.click()},[g,alvo]);await p.waitForTimeout(120);if(await T.texto(f,app)===a)sem.push(it.titulo+' #'+(g+1)+' opção '+(alvo+1))}}}
 ok(grupos>0,`${grupos} perguntas encontradas nos itens`);ok(!sem.length,'toda resposta altera o relatório'+(sem.length?': '+sem.slice(0,5).join('; '):''));
 if(erros.length)T.falha('erros de página: '+erros.join(' / '));await p.close();
 // larguras
 for(const [w,h] of [[375,812],[430,932],[800,1280],[1280,900]]){const x=await T.abre(nucleo,app,titulo,qs||'',{browser:b,viewport:{width:w,height:h}});
  for(const alvo of [{secao:null,item:null},{secao:itens[0].secao,item:null},{secao:itens[Math.min(3,itens.length-1)].secao,item:itens[Math.min(3,itens.length-1)].item}]){await x.f.evaluate(a=>UvisPadrao.vai(Object.assign({aba:'roteiro'},a)),alvo);await x.p.waitForTimeout(400);
   const m=await x.f.evaluate(()=>({h:document.documentElement.scrollWidth>innerWidth+1,peq:[...document.querySelectorAll('.pu-chrome button,.pu-rodape button,.pu-main button')].filter(e=>{const r=e.getBoundingClientRect();return e.offsetParent&&r.height>0&&r.height<40&&!e.closest('.uvs-previa,.item-legal,.rg-citebar,summary')}).map(e=>e.textContent.trim().slice(0,20)).slice(0,4)}));
   ok(!m.h,`${w}px ${alvo.item?'item':alvo.secao?'seção':'lista'}: sem rolagem horizontal`);ok(!m.peq.length,`${w}px ${alvo.item?'item':alvo.secao?'seção':'lista'}: botões ≥ 40 px`+(m.peq.length?' ('+m.peq.join(', ')+')':''))}
  if(x.erros.length)T.falha(w+'px erros: '+x.erros.join(' / '));await x.p.close()}
 await b.close()})();
