'use strict';
/* Central de Consultas: modo “DM não regularizado” — lista da Anvisa de produtos não regularizados
   como dispositivos médicos (base-vigilancia/dados/produtos_nao_regulados/lista.json). Base simulada.
   Uso: node scripts/e2e/central-naoreg.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
const LISTA={atualizado_na_fonte:'24/07/2024',total:3,categorias:[
 {numero:2,titulo:'PRODUTOS PARA APOIO DE ATIVIDADE LABORATORIAL GERAL',itens:[{n:24,texto:'Centrífuga, exceto indicada para uso em laboratório clínico (IVD)',sub:['Centrifuga, exceto indicada para uso em bancos de sangue']},{n:18,texto:'Balança para laboratório'}]},
 {numero:9,titulo:'PARTES E ACESSÓRIOS PARA PRODUTOS NÃO CONSIDERADOS PRODUTOS PARA SAÚDE',itens:[]}]};
(async()=>{const b=await T.navegador();const ctx=await b.newContext({viewport:{width:1000,height:1400}});
 await ctx.route(/base-vigilancia\/(main\/)?dados\//,r=>{const u=r.request().url();
  if(/produtos_nao_regulados\/lista\.json/.test(u))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(LISTA)});
  if(/manifest\.json/.test(u))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({gerado_em:'2026-10-22T00:00:00Z',bases:{}})});
  return r.fulfill({status:404,body:''})});
 const p=await ctx.newPage();const erros=[];p.on('pageerror',e=>erros.push(String(e.message).slice(0,200)));p.on('dialog',d=>d.accept());
 await p.goto(T.INDEX);await p.waitForTimeout(900);await p.evaluate(()=>window.__cascaAbrirRoteiro('Central de Consultas','central-consultas','Central de Consultas'));await p.waitForTimeout(4000);
 const f=p.frames().find(x=>x!==p.mainFrame());
 async function busca(v){await f.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  if(!await f.evaluate(()=>document.querySelector('[data-mode="naoreg"]').classList.contains('on'))){await f.evaluate(()=>document.querySelector('[data-mode="naoreg"]').click());await p.waitForTimeout(600)}
  await f.evaluate(()=>{const r=document.querySelector('#results');if(r)r.innerHTML=''});
  await f.fill('#q',v);await p.waitForTimeout(150);await f.evaluate(()=>document.querySelector('#search').click());
  for(let i=0;i<30;i++){await p.waitForTimeout(250);const t=await f.evaluate(()=>(document.querySelector('#results')?.innerText||'')+' '+(document.querySelector('#status')?.innerText||''));if(/resultado|Nenhuma|ao menos/.test(t))return t}
  return f.evaluate(()=>(document.querySelector('#results')?.innerText||'')+' '+(document.querySelector('#status')?.innerText||''))}
 ok(await f.evaluate(()=>!!document.querySelector('[data-mode="naoreg"]')),'botão do modo “DM não regularizado”');
 let t=await busca('centrifuga');
 ok(/Centrífuga, exceto indicada para uso em laboratório clínico/.test(t)&&/Categoria 2/.test(t)&&/Leia a exceção/.test(t)&&/bancos de sangue/.test(t),'centrífuga sem acento: item, categoria, subitem e aviso da exceção');
 ok(await f.evaluate(()=>document.querySelector('#q').inputMode==='text'),'teclado de texto no modo');
 t=await busca('balança laboratório');
 ok(/Balança para laboratório/.test(t)&&!/Leia a exceção/.test(t),'duas palavras: item sem exceção, sem aviso');
 t=await busca('acessórios');
 ok(/A categoria inteira consta da lista/.test(t),'categoria sem itens (Categoria 9) aparece pela regra do título');
 t=await busca('ab');
 ok(/ao menos 3 letras/.test(t),'menos de 3 letras: pede mais caracteres');
 if(erros.length)T.falha('erros de página: '+erros.join(' / '));
 await b.close()})();
