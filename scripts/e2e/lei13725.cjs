'use strict';
/* Lei Municipal nº 13.725/2004 nos relatórios dos roteiros de motor próprio
   (17/10/2026): com verificações marcadas como “Não cumpre”, toda irregularidade
   do relatório cita a lei, nenhuma cita artigo acima do 109, e o relatório não traz
   lista de normas. Uso: node scripts/e2e/lei13725.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
const CASOS=[['Odontologia','odontologia','Odontologia',''],['Alimentos','servicos-alimentacao-roteiro','Inspeção do estabelecimento',''],
 ['Produtos','produtos-correlatos','Atacadista / distribuidor','atividade=atacadista'],['Serviços assistenciais','servicos-assistenciais','SAICA','servico=saica']];
/* texto do relatório final de cada módulo */
const RELATORIO={
 odontologia:()=>reportBlocks({}).map(b=>b.x||(b.rows?b.rows.map(r=>r.join(' | ')).join('\n'):b.head?b.head.join(' | '):'')).join('\n'),
 'servicos-alimentacao-roteiro':async()=>{UvisPadrao.vai({aba:'relatorio'});await new Promise(r=>setTimeout(r,600));const t=[...document.querySelectorAll('textarea')].map(x=>x.value).find(v=>/IRREGULARIDADES/.test(v));return t||document.body.innerText},
 'produtos-correlatos':async()=>{UvisPadrao.vai({aba:'relatorio'});await new Promise(r=>setTimeout(r,600));const bt=[...document.querySelectorAll('button')].find(e=>e.offsetParent&&/Visualizar relatório/.test(e.textContent));if(bt)bt.click();await new Promise(r=>setTimeout(r,500));const ps=document.querySelector('#print-sheet');return ps?ps.innerText:document.body.innerText},
 'servicos-assistenciais':async()=>{UvisPadrao.vai({aba:'relatorio'});await new Promise(r=>setTimeout(r,600));const h=await buildReport();const d=document.createElement('div');d.innerHTML=typeof h==='string'?h:'';return d.innerText||d.textContent||document.body.innerText}
};
(async()=>{const b=await T.navegador();
 for(const [n,app,t,q] of CASOS){
  const {p,f,erros}=await T.abre(n,app,t,q,{browser:b});
  const itens=[];(await f.evaluate(()=>UvisPadrao.lista())).forEach(s=>s.itens.forEach(i=>itens.push([s.id,i.id])));
  for(const [s,i] of itens.slice(0,8)){await f.evaluate(([s,i])=>UvisPadrao.vai({aba:'roteiro',secao:s,item:i}),[s,i]);await p.waitForTimeout(250);
   await f.evaluate(()=>document.querySelectorAll('#pu-conteudo .pu-resp').forEach(r=>{const bt=r.querySelectorAll('button')[1];if(bt&&bt.getAttribute('aria-pressed')!=='true')bt.click()}));await p.waitForTimeout(150);
   /* odontologia: a irregularidade entra no relatório confirmada, com evidência, situação e data */
   if(app==='odontologia')await f.evaluate(()=>{state.p.situacao=state.p.situacao||'rotina';state.meta.date=state.meta.date||'2026-10-17';state.assessment=state.assessment||{};state.evidence=state.evidence||{};
    Object.keys(state.a).forEach(k=>{if(state.a[k]==='nao'){state.assessment[k]='confirmado';if(!state.evidence[k])state.evidence[k]='constatado na inspeção'}})});}
  const rel=await f.evaluate(RELATORIO[app]);
  const i0=rel.search(/IRREGULARIDADES OBSERVADAS/i),fim=rel.slice(i0+30).search(/\n\s*\d+ [A-ZÁÉÍÓÚÇ ]{8,}\n/);
  const sec=i0<0?'':rel.slice(i0,fim<0?undefined:i0+30+fim);
  const linhas=sec.split('\n').filter(l=>/Fundamento:/.test(l));
  ok(linhas.length>0,app+': '+linhas.length+' irregularidades no relatório');
  const sem=linhas.filter(l=>!/13\.725\/2004/.test(l));
  ok(!sem.length,app+': todas citam a Lei 13.725/2004'+(sem.length?' — sem: '+sem[0].slice(0,140):''));
  const acima=[...rel.matchAll(/13\.725\/2004,? arts?\.\s*(\d+)/g)].map(m=>+m[1]).filter(x=>x>109);
  ok(!acima.length,app+': nenhum artigo da Lei 13.725 acima do 109'+(acima.length?' ('+acima.join(', ')+')':''));
  ok(!/LEGISLAÇÃO DE REFERÊNCIA|NORMAS DE REFERÊNCIA/i.test(rel),app+': sem lista de normas no relatório');
  if(erros.length)T.falha(app+': erros de página: '+erros.join(' / '));
  await p.close()}
 await b.close()})();
