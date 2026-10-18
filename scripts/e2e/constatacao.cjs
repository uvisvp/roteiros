'use strict';
/* Infração descrita pela constatação, como na Estética (17/10/2026): em Produtos e em
   Serviços assistenciais, marcar a infração abre o campo “Constatação”; preenchido, o
   enquadramento do relatório e a prévia descrevem a infração pelo fato constatado, com os
   dispositivos do catálogo e a Lei 13.725. Sem constatação, sai o texto do catálogo, sem
   “ATENÇÃO PRIORITÁRIA”. Uso: node scripts/e2e/constatacao.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
const FATO='produto Alfa, lote 123, vencido em 08/2026, exposto na prateleira 3';
(async()=>{const b=await T.navegador();
 {const {p,f,erros}=await T.abre('Produtos','produtos-correlatos','Atacadista / distribuidor','atividade=atacadista',{browser:b});
  await f.evaluate(()=>UvisPadrao.vai({aba:'infracoes'}));await p.waitForTimeout(600);
  /* duas infrações: uma com constatação (validade expirada) e outra sem (AFE) */
  /* cada clique redesenha a lista: procura de novo a cada infração */
  const marcadas=[];
  for(const [re,v] of [['validade expirad',true],['Autorização de Funcionamento sem AFE',false]]){
   const id=await f.evaluate(re=>{const x=[...document.querySelectorAll('input[data-infraction]')].find(x=>new RegExp(re).test((x.closest('label')||{}).textContent||''));if(!x)return null;x.click();return x.dataset.infraction},re);
   await p.waitForTimeout(300);if(id)marcadas.push({id,v})}
  await p.waitForTimeout(400);
  ok(marcadas.length===2,'produtos: duas infrações marcadas');
  const idV=(marcadas.find(x=>x.v)||{}).id;
  ok(await f.evaluate(id=>!!document.querySelector('textarea[data-infraction-note="'+id+'"]'),idV),'produtos: a infração marcada abre o campo Constatação');
  await f.evaluate(([id,t])=>{const a=document.querySelector('textarea[data-infraction-note="'+id+'"]');a.value=t;a.dispatchEvent(new Event('input',{bubbles:true}))},[idV,FATO]);
  await f.evaluate(()=>UvisPadrao.vai({aba:'relatorio'}));await p.waitForTimeout(500);
  /* a prévia do relatório fica na própria aba (18/10/2026) */
  const t=await f.evaluate(()=>{const ps=document.querySelector('.uvs-rel-previa');return ps?ps.innerText:''});
  const enq=t.slice(t.indexOf('ENQUADRAMENTO'));
  ok(enq.includes('Produto Alfa, lote 123, vencido em 08/2026, exposto na prateleira 3. Dispositivos infringidos:'),'produtos: enquadramento descreve a infração pela constatação');
  ok(!/expor ou distribuir produto com prazo de validade/.test(enq),'produtos: sem o texto do catálogo quando há constatação');
  ok(/Por realizar atividade sujeita à Autorização de Funcionamento/.test(enq)&&!/ATENÇÃO PRIORITÁRIA/.test(enq),'produtos: sem constatação, texto do catálogo sem “ATENÇÃO PRIORITÁRIA”');
  ok(/13\.725\/2004/.test(enq.split('\n').find(l=>/Produto Alfa/.test(l))||''),'produtos: dispositivos com a Lei 13.725');
  const pv=await f.evaluate(()=>window.__uvsRelLinhas().map(l=>l.x).filter(x=>/Infração selecionada/.test(x)));
  ok(pv.some(x=>x.includes(FATO)),'produtos: prévia com a constatação');
  /* a constatação fica salva */
  ok(await p.evaluate(([id,t])=>Object.keys(localStorage).some(k=>{try{const s=JSON.parse(localStorage.getItem(k));return s&&s.infractionNotes&&s.infractionNotes[id]===t}catch(e){return false}}),[idV,FATO]),'produtos: constatação gravada no rascunho');
  if(erros.length)T.falha('produtos: erros de página: '+erros.join(' / '));await p.close()}
 {const {p,f,erros}=await T.abre('Serviços','servicos-assistenciais','ILPI','servico=ilpi',{browser:b});
  await f.evaluate(()=>UvisPadrao.vai({aba:'infracoes'}));await p.waitForTimeout(600);
  await f.evaluate(()=>{document.querySelectorAll('details.pu-inf-grupo').forEach(d=>d.open=true)});
  const i=await f.evaluate(()=>{const bt=document.querySelector('button[data-as-mark="SEL"][data-kind="inf"]');if(!bt)return -1;bt.click();return +bt.dataset.index});
  await p.waitForTimeout(500);await f.evaluate(()=>{document.querySelectorAll('details.pu-inf-grupo').forEach(d=>d.open=true)});
  ok(i>=0&&await f.evaluate(i=>!!document.querySelector('textarea[data-as-nota="inf|'+i+'"]'),i),'assistenciais: a infração selecionada abre o campo Constatação');
  await f.evaluate(i=>{const a=document.querySelector('textarea[data-as-nota="inf|'+i+'"]');a.value='quarto 2 sem campainha de chamada junto ao leito';a.dispatchEvent(new Event('input',{bubbles:true}))},i);
  /* buildReport desenha o relatório na aba Relatório */
  await f.evaluate(()=>UvisPadrao.vai({aba:'relatorio'}));await p.waitForTimeout(600);
  const rel=await f.evaluate(async()=>{await buildReport();await new Promise(r=>setTimeout(r,300));return document.body.innerText});
  const enq=rel.slice(rel.indexOf('ENQUADRAMENTO'));
  ok(/Quarto 2 sem campainha de chamada junto ao leito\. Dispositivos infringidos: .*13\.725\/2004/.test(enq),'assistenciais: enquadramento pela constatação, com a Lei 13.725');
  const pv=await f.evaluate(()=>UvsPrevia&&UvsPrevia.linhas?UvsPrevia.linhas().map(l=>l.x||''):[]).catch(()=>[]);
  if(pv.length)ok(pv.some(x=>/quarto 2 sem campainha/.test(x)),'assistenciais: prévia com a constatação');
  if(erros.length)T.falha('assistenciais: erros de página: '+erros.join(' / '));await p.close()}
 await b.close()})();
