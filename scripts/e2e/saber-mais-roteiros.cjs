'use strict';
/* “Para saber mais” com fonte e Lei 13.725 só na capitulação (18/10/2026).
   - Roteiro: a Lei 13.725 sai dos botões de citação da pergunta que cita outra norma
     (e do trecho do botão que junta normas, em Produtos); fica quando é a única norma.
     Na aba Infrações ela continua.
   - Caixas “Para saber mais” nas perguntas certas, cada linha com “Fonte:”; nos
     Assistenciais, a norma muda com a modalidade.
   - Motor roteiro-simples: Academia sem “Prática de inspeção” e com outros métodos de
     desinfecção; Estética com as orientações dos itens (nota técnica suspensa, RDC 56/2009…); Vacinação com o alarme como recomendação (a RDC não exige); EAC com
     transporte, água reagente, valores críticos e notificação compulsória.
   Uso: node scripts/e2e/saber-mais-roteiros.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
/* [núcleo, app, título, query, caixas esperadas, caixas que não podem aparecer] */
const CASOS=[
 ['Odontologia','odontologia','Odontologia','',['od-clima','od-pcd','od-ester','od-rx','od-agua','od-res'],[]],
 ['Produtos','produtos-correlatos','Atacadista / distribuidor','atividade=atacadista',['pr-reg','pr-afe','pr-temp','pr-recolhe'],[]],
 ['Alimentos','servicos-alimentacao-roteiro','Inspeção do estabelecimento','',['al-temp','al-horti','al-oleo','al-pragas','al-caixa'],[]],
 ['Serviços assistenciais','servicos-assistenciais','ILPI','servico=ilpi',['as-grau','as-med','as-sentinela'],['as-ct','as-grau-cd']],
 ['Serviços assistenciais','servicos-assistenciais','CT','servico=ct',['as-med','as-ct'],['as-grau','as-sentinela']],
 ['Serviços assistenciais','servicos-assistenciais','Centro-Dia','servico=centrodia',['as-med','as-grau-cd'],['as-grau','as-ct']],
 ['Serviços','academia-piscina','Academias e piscinas','',[],[]],
 ['Serviços','vacinacao','Vacinação','',[],[]],
 ['Serviços','eac-tipo2','EAC — Serviço Tipo II','',[],[]],
 ['Serviços','eac-tipo3','EAC — Serviço Tipo III','',[],[]],
 ['Serviços','estetica','Estética e beleza','p_tipo=saude',[],[]],
 ['Serviços','estetica','Estética e beleza','p_tipo=interesse',[],[]]
];
/* texto que precisa estar (e não estar) nas orientações do roteiro-simples */
const ORIENT={
 'academia-piscina':{tem:['Outros métodos de desinfecção','Cloro livre, total e combinado','Standard Methods','Lei Municipal nº 13.945/2005, art. 2º, IV e V'],nao:['Prática de inspeção']},
 vacinacao:{tem:['A RDC não exige alarme','Recomendação técnica do Manual de Rede de Frio','Excursão de temperatura','Manual de Normas e Procedimentos para Vacinação'],nao:['deve ter registrador eletrônico']},
 'eac-tipo2':{tem:['UN 3373','Valores críticos','Notificação compulsória'],nao:['CLSI GP40']},
 'eac-tipo3':{tem:['UN 3373','CLSI GP40','Valores críticos','Notificação compulsória'],nao:[]},
 /* Estética (roteiro-simples): as orientações dos itens, com fonte */
 estetica:{tem:['Nota Técnica nº 2/2024','RDC Anvisa nº 56/2009, art. 1º','Lei Federal nº 6.360/1976, art. 12','RDC Anvisa nº 222/2018, arts. 2º e 5º, § 1º'],nao:[]}
};
(async()=>{const b=await T.navegador();
 for(const [n,app,t,q,esperadas,proibidas] of CASOS){const {p,f,erros}=await T.abre(n,app,t,q,{browser:b});
  const itens=[];(await f.evaluate(()=>UvisPadrao.lista())).forEach(s=>s.itens.forEach(i=>itens.push([s.id,i.id])));
  const achou=new Set(),semFonte=[],misturado=[],orient=[];let retirada=0,retiradaComLei=0,antigo=0;
  for(const [s,i] of itens){await f.evaluate(([s,i])=>UvisPadrao.vai({aba:'roteiro',secao:s,item:i}),[s,i]);await p.waitForTimeout(250);
   const r=await f.evaluate(()=>{const o={sm:[],semFonte:[],mist:[],ret:0,retLei:0,antigo:document.querySelectorAll('.od-orient').length,orient:(document.querySelector('#pu-conteudo')||document.body).textContent};
    document.querySelectorAll('#pu-conteudo [data-uvs-sm]').forEach(d=>{o.sm.push(d.dataset.uvsSm);
     [...d.querySelectorAll('p')].filter(x=>!x.classList.contains('uvs-sm-nota')).forEach(x=>{if(!/Fonte: \S/.test(x.textContent))o.semFonte.push(d.dataset.uvsSm)})});
    document.querySelectorAll('#pu-conteudo .pu-q').forEach(q=>{const vis=[...q.querySelectorAll('button.uvis-cite,button.rs-cit')].filter(b=>b.offsetParent).map(b=>b.textContent);
     if(vis.some(x=>/13\.725/.test(x))&&vis.some(x=>x.split(/\s;\s/).some(y=>!/13\.725/.test(y))))o.mist.push(vis.join(' | ').slice(0,160))});
    document.querySelectorAll('#pu-conteudo [data-uvs-lei-retirada]').forEach(b=>{o.ret++;if(/13\.725/.test(b.textContent+(b.dataset.uvisCitation||'')+(b.title||'')))o.retLei++});
    return o});
   r.sm.forEach(x=>achou.add(x));semFonte.push(...r.semFonte);misturado.push(...r.mist.map(x=>s+'/'+i+': '+x));retirada+=r.ret;retiradaComLei+=r.retLei;antigo+=r.antigo;orient.push(r.orient)}
  const rot=app+(q?' ('+q+')':'');
  ok(!misturado.length,rot+': nenhuma pergunta mostra a Lei 13.725 junto de outra norma'+(misturado.length?' — '+misturado.slice(0,3).join(' || '):''));
  if(app==='produtos-correlatos')ok(retirada>0&&!retiradaComLei,rot+': botão que junta normas perde só o trecho da Lei 13.725 ('+retirada+')');
  for(const x of esperadas)ok(achou.has(x),rot+': “Para saber mais” '+x);
  for(const x of proibidas)ok(!achou.has(x),rot+': sem a caixa '+x+' (outra modalidade)');
  if(esperadas.length)ok(!semFonte.length,rot+': toda linha do “Para saber mais” tem fonte'+(semFonte.length?' — '+[...new Set(semFonte)].join(', '):''));
  if(app==='odontologia')ok(!antigo,rot+': sem a caixa antiga da tela anterior');
  const o=ORIENT[app];if(o){const tx=orient.join('\n');
   for(const x of o.tem)ok(tx.includes(x),rot+': orientação traz “'+x+'”');
   for(const x of o.nao)ok(!tx.includes(x),rot+': orientação sem “'+x+'”')}
  /* aba Infrações: a capitulação continua com a Lei 13.725; nenhuma caixa fora do Roteiro */
  await f.evaluate(()=>UvisPadrao.vai({aba:'infracoes'}));await p.waitForTimeout(500);
  const inf=await f.evaluate(()=>({lei:((document.querySelector('#pu-conteudo')||document.body).textContent.match(/13\.725/g)||[]).length,sm:document.querySelectorAll('#pu-conteudo [data-uvs-sm]').length,oculta:document.querySelectorAll('#pu-conteudo [data-uvs-lei-oculta],#pu-conteudo [data-uvs-lei-retirada]').length}));
  if(['academia-piscina','vacinacao','eac-tipo2','eac-tipo3','odontologia','estetica'].includes(app))ok(inf.lei>0,rot+': aba Infrações com a Lei 13.725');
  ok(!inf.sm&&!inf.oculta,rot+': aba Infrações sem “Para saber mais” e sem citação filtrada');
  if(erros.length)T.falha(rot+': erros de página: '+erros.join(' / '));await p.close()}
 await b.close()})();
