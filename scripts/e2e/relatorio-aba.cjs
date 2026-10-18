'use strict';
/* Prévia do relatório na própria aba Relatório (18/10/2026), em todos os roteiros fora do
   núcleo de Medicamentos: a aba mostra o documento, sem abrir janela nem folha por cima, e
   o botão de Word fica na aba e baixa o arquivo. Também: Central de Consultas no azul vivo
   da marca. Uso: node scripts/e2e/relatorio-aba.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
/* [núcleo, app, título, query, seletor da prévia, botão de Word] */
const CASOS=[
 ['Odontologia','odontologia','Odontologia','','.uvs-rel-previa','[data-odo-word]'],
 ['Produtos','produtos-correlatos','Atacadista / distribuidor','atividade=atacadista','.uvs-rel-previa','#pu-main [data-word-export]'],
 ['Serviços assistenciais','servicos-assistenciais','ILPI','servico=ilpi','.uvs-rel-previa','[data-as-word]'],
 ['Alimentos','servicos-alimentacao-roteiro','Inspeção do estabelecimento','','#sa-rel',null],
 ['Serviços','academia-piscina','Academias e piscinas','','.rs-relatorio',null],
 ['Serviços','vacinacao','Vacinação','','.rs-relatorio',null],
 ['Serviços','eac-tipo2','EAC — Serviço Tipo II','','.rs-relatorio',null]
];
const aberto=()=>!!document.querySelector('#print-sheet.active,dialog[open],#reportModal.open,#reportModal[aria-hidden="false"],#saida.ativo');
(async()=>{const b=await T.navegador();
 for(const [n,app,t,q,sel,word] of CASOS){const {p,f,erros}=await T.abre(n,app,t,q,{browser:b});
  /* três itens com “Não cumpre”, para haver irregularidade */
  const itens=[];(await f.evaluate(()=>UvisPadrao.lista())).forEach(s=>s.itens.forEach(i=>itens.push([s.id,i.id])));
  for(const [s,i] of itens.slice(0,4)){await f.evaluate(([s,i])=>UvisPadrao.vai({aba:'roteiro',secao:s,item:i}),[s,i]);await p.waitForTimeout(200);
   await f.evaluate(()=>document.querySelectorAll('#pu-conteudo .pu-resp').forEach(r=>{const bt=r.querySelectorAll('button')[1];if(bt&&bt.getAttribute('aria-pressed')!=='true')bt.click()}));await p.waitForTimeout(100)}
  await f.evaluate(()=>UvisPadrao.vai({aba:'relatorio'}));await p.waitForTimeout(1200);
  const r=await f.evaluate(sel=>{const e=document.querySelector(sel);const tx=e?(e.innerText+' '+[...e.querySelectorAll('textarea')].map(x=>x.value).join(' ')):'';return {tem:!!e,tx}},sel);
  ok(r.tem&&r.tx.length>200,app+': prévia do relatório na aba Relatório');
  ok(/IRREGULARIDADES|Não se constat|não apresentou|não cumpre|Não cumpre/i.test(r.tx),app+': a prévia traz as irregularidades marcadas');
  ok(!await f.evaluate(aberto),app+': nenhuma janela ou folha aberta por cima');
  if(word){ok(await f.evaluate(w=>!!document.querySelector(w),word),app+': botão de Word na aba');
   const dl=p.waitForEvent('download',{timeout:20000}).catch(()=>null);
   await f.evaluate(w=>document.querySelector(w).click(),word);
   const d=await dl;ok(!!d&&/\.docx$/i.test(d.suggestedFilename()),app+': Word baixado da aba'+(d?' ('+d.suggestedFilename()+')':''));
   await p.waitForTimeout(300);ok(!await f.evaluate(aberto),app+': baixar o Word não abre outra tela')}
  if(erros.length)T.falha(app+': erros de página: '+erros.join(' / '));await p.close()}
 /* Estética: inventário próprio; a aba Relatório mostra o documento do Word */
 {const {p,f,erros}=await T.abre('Serviços','estetica','Estética','',{browser:b});
  await f.evaluate(()=>{const g=[...document.querySelectorAll('button')].find(x=>/Licenciamento e regularidade/.test(x.textContent));g&&g.click()});await p.waitForTimeout(400);
  await f.evaluate(()=>{const i=document.querySelector('button.infra');i&&i.click()});await p.waitForTimeout(300);
  await f.evaluate(()=>{const r=[...document.querySelectorAll('button')].find(x=>x.offsetParent&&/^Relatório/.test(x.textContent.trim()));r&&r.click()});await p.waitForTimeout(700);
  const tx=await f.evaluate(()=>{const e=document.querySelector('.folha-previa');return e?e.innerText:''});
  ok(/Infrações constatadas/.test(tx)&&/Dispositivo legal infringido/.test(tx),'estética: prévia do relatório na aba Relatório');
  ok(!await f.evaluate(aberto),'estética: nenhuma folha aberta por cima');
  const dl=p.waitForEvent('download',{timeout:20000}).catch(()=>null);
  await f.evaluate(()=>document.querySelector('.acoes-rel [data-acao="word"]').click());
  const d=await dl;ok(!!d&&/\.docx$/i.test(d.suggestedFilename()),'estética: Word baixado da aba'+(d?' ('+d.suggestedFilename()+')':''));
  await p.waitForTimeout(300);ok(!await f.evaluate(aberto),'estética: baixar o Word não abre a folha');
  if(erros.length)T.falha('estética: erros de página: '+erros.join(' / '));await p.close()}
 /* Central de Consultas: azul vivo da marca */
 {const p=await b.newPage({viewport:{width:420,height:900}});await p.goto(T.INDEX);await p.waitForTimeout(900);
  await p.evaluate(()=>document.getElementById('abrir-consultas').click());await p.waitForTimeout(2500);
  const f=p.frames().find(x=>x!==p.mainFrame());
  const c=await f.evaluate(()=>{const bt=[...document.querySelectorAll('button')].find(x=>x.offsetParent&&/Pesquisar/.test(x.textContent)),h=document.querySelector('header');return {bt:bt&&getComputedStyle(bt).backgroundColor,h:h&&getComputedStyle(h).backgroundColor}});
  ok(c.bt==='rgb(18, 106, 224)','consultas: botão Pesquisar no azul vivo ('+c.bt+')');
  ok(c.h==='rgb(18, 106, 224)','consultas: cabeçalho no azul vivo ('+c.h+')');
  await p.close()}
 await b.close()})();
