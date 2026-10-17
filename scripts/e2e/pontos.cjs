'use strict';
/* Checklist por ponto nos roteiros de motor próprio (17/10/2026): em cada um,
   todo ponto cadastrado corresponde a uma pergunta do módulo; numa pergunta com
   checklist, um ponto “Não atende” marca “Não cumpre” pelo botão do módulo e o
   relatório traz a frase com o ponto; todos atendidos marcam “Cumpre”.
   Uso: node scripts/e2e/pontos.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
const CASOS=[['Odontologia','odontologia','Odontologia',''],['Alimentos','servicos-alimentacao-roteiro','Inspeção do estabelecimento',''],
 ['Produtos','produtos-correlatos','Atacadista / distribuidor','atividade=atacadista'],['Serviços assistenciais','servicos-assistenciais','ILPI','servico=ilpi']];
/* textos/ids das perguntas do módulo */
const PERGUNTAS={
 odontologia:()=>DATA.route.flatMap(r=>r.items.map(i=>i.id)),
 'servicos-alimentacao-roteiro':()=>JSON.parse(document.getElementById('roteiro-sa-config').textContent).sections.flatMap(s=>s.items.map(i=>i.id)),
 'produtos-correlatos':()=>ROTEIRO_CONFIG.sections.flatMap(s=>(s.items||[]).map(i=>i.id))
};
(async()=>{const b=await T.navegador();
 for(const [n,app,t,q] of CASOS){
  const {p,f,erros}=await T.abre(n,app,t,q,{browser:b});
  const chaves=await f.evaluate(()=>Object.keys(window.__UVS_PONTOS.q));
  if(PERGUNTAS[app]){const ids=new Set(await f.evaluate(PERGUNTAS[app]));const fora=chaves.filter(k=>!ids.has(k));ok(!fora.length,app+': '+chaves.length+' perguntas com checklist, todas existem no roteiro'+(fora.length?' — fora: '+fora.join(', '):''));}
  else ok(chaves.length>0,app+': '+chaves.length+' perguntas com checklist');
  /* primeira pergunta com checklist na navegação */
  const achou=await f.evaluate(async()=>{for(const s of UvisPadrao.lista())for(const i of s.itens){UvisPadrao.vai({aba:'roteiro',secao:s.id,item:i.id});await new Promise(r=>setTimeout(r,250));const box=document.querySelector('.uvs-pontos');if(box)return box.getAttribute('data-uvs-q')}return null});
  ok(!!achou,app+': checklist aparece na pergunta');if(!achou){await p.close();continue}
  const pts=await f.evaluate(id=>[...document.querySelectorAll('[data-uvs-q="'+CSS.escape(id)+'"] [data-uvs-pt$="¦C"]')].map(x=>x.getAttribute('data-uvs-pt')),achou);
  for(const [k,pt] of pts.entries()){const alvo=k===0?pt.replace(/¦C$/,'¦NC'):pt;await f.evaluate(a=>document.querySelector('[data-uvs-pt="'+CSS.escape(a)+'"]').click(),alvo);await p.waitForTimeout(250)}
  await p.waitForTimeout(400);
  const pressionado=await f.evaluate(id=>{const q=document.querySelector('[data-uvs-q="'+CSS.escape(id)+'"]').closest('.pu-q');return [...q.querySelectorAll('.pu-resp button')].findIndex(x=>x.getAttribute('aria-pressed')==='true')},achou);
  ok(pressionado===1,app+': um ponto “Não atende” marca “Não cumpre”');
  const frase=await f.evaluate(id=>UvsPontos.frase(id),achou);
  const rel=await T.texto(f,app);
  ok(frase&&rel.includes(frase.slice(0,40)),app+': relatório com a frase do ponto ('+frase.slice(0,70)+'…)');
  await f.evaluate(a=>document.querySelector('[data-uvs-pt="'+CSS.escape(a)+'"]').click(),pts[0]);await p.waitForTimeout(500);
  const pr2=await f.evaluate(id=>{const q=document.querySelector('[data-uvs-q="'+CSS.escape(id)+'"]').closest('.pu-q');return [...q.querySelectorAll('.pu-resp button')].findIndex(x=>x.getAttribute('aria-pressed')==='true')},achou);
  ok(pr2===0,app+': todos atendidos marca “Cumpre”');
  if(erros.length)T.falha(app+': erros de página: '+erros.join(' / '));
  await p.close()}
 /* assistenciais: toda chave corresponde a uma pergunta de alguma modalidade */
 const textos=new Set();let chaves=[];
 for(const sv of ['ilpi','centrodia','ct','srt','saica','demais']){const {p,f}=await T.abre('Serviços assistenciais','servicos-assistenciais','X','servico='+sv,{browser:b});
  (await f.evaluate(()=>current.doc.concat(current.rot).map(i=>i.i))).forEach(x=>textos.add(x));chaves=await f.evaluate(()=>Object.keys(window.__UVS_PONTOS.q));await p.close()}
 const sem=chaves.filter(k=>![...textos].some(t=>t.startsWith(k)));
 ok(!sem.length,'assistenciais: '+chaves.length+' chaves, todas com pergunta'+(sem.length?' — sem: '+sem.slice(0,3).join(' | '):''));
 await b.close()})();
