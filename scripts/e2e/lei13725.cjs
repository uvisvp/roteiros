'use strict';
/* Lei Municipal nº 13.725/2004 nos relatórios dos roteiros de motor próprio
   (17/10/2026): com verificações marcadas como “Não cumpre”, toda irregularidade
   do relatório cita a lei, nenhuma cita artigo acima do 109, e o relatório não traz
   lista de normas. O artigo é o do assunto (49 rotulagem, 50 controle especial no
   comércio, 50-A expositor refrigerado, 66, § 2º, equipamento sem condições de uso, 67
   controlados no serviço de saúde, 69 SAICA); em EAC e vacinação, os da infração do
   roteiro de Medicamentos somados aos do serviço de saúde (71, 55 e 56, 85, 37, I).
   Uso: node scripts/e2e/lei13725.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
const CASOS=[['Odontologia','odontologia','Odontologia',''],['Alimentos','servicos-alimentacao-roteiro','Inspeção do estabelecimento',''],
 ['Produtos','produtos-correlatos','Atacadista / distribuidor','atividade=atacadista'],['Serviços assistenciais','servicos-assistenciais','SAICA','servico=saica']];
/* artigo pelo assunto: [fundamento, id, grupo, texto] → trecho esperado */
const ASSUNTO={
 odontologia:[[['RDC Anvisa nº 1.002/2025, art. 39, parágrafo único','eq6','','Equipamentos e móveis sem condições de uso mantidos fora da área de trabalho.'],'art. 66, § 2º'],
  [['RDC Anvisa nº 1.002/2025, art. 5º','lic2','','Responsável Técnico cirurgião-dentista designado pelo Responsável Legal.'],'art. 92']],
 'servicos-alimentacao-roteiro':[[['Portaria SMS nº 2.619/2011, item 9.18','g6','','Expositores refrigerados e congelados permitem ao consumidor visualizar a temperatura do ar interior.'],'art. 50-A'],
  [['Portaria SMS nº 2.619/2011, item 9.16','g5','','Produtos a granel apresentam denominação, marca e validade de forma clara ao consumidor.'],'arts. 46 e 49'],
  [['Portaria SMS nº 2.619/2011, item 2','b2','','Pisos, paredes, tetos, portas, janelas, ralos e demais superfícies são íntegros, laváveis e mantidos limpos.'],'art. 50']],
 'produtos-correlatos':[[['RDC Anvisa nº 16/2014, art. 28, II, “f”.','ds7','','Produtos sujeitos a controle especial em área separada, identificada e de acesso restrito.'],'art. 50, § 1º'],
  [['RDC Anvisa nº 48/2013, Anexo II, item 17.20.','fpr10','','Envase, embalagem e rotulagem são realizados em área apropriada.'],'arts. 46 e 49'],
  /* infração do catálogo sem a lei, no enquadramento */
  [['RDC Anvisa nº 16/2014, art. 4º.','p05','1. Licença, AFE e responsável técnico','Por movimentar substâncias sujeitas a controle especial sem Autorização Especial.'],'art. 50, § 1º'],
  [['RDC Anvisa nº 16/2014, art. 27.','p48','1. Licença, AFE e responsável técnico','Por contratar serviço terceirizado com empresa não autorizada.'],'art. 46']],
 'servicos-assistenciais':[[['Portaria SVS/MS nº 344/1998','ilpi','Medicamentos e insumos','Controle dos medicamentos sujeitos a controle especial.'],'art. 67'],
  [['Art. 32 da Resolução Conjunta nº 2/2014','saica','Acolhidos','Guia de Acolhimento Institucional individual.'],'art. 69'],
  [['Arts. 10, 11 e 16 da RDC nº 502/2021','ilpi','Pessoas, cuidado e registros','Registro no conselho de classe dos profissionais de saúde da equipe.'],'art. 64'],
  [['Lei Municipal nº 10.348/1987, arts. 3º a 5º.','ilpi','Elevador ou plataforma — se houver','Manter elevador ou plataforma em uso sem cadastro municipal de funcionamento.'],'art. 65']]
};
/* EAC e vacinação (motor roteiro-simples): artigos da pergunta */
const PERGUNTAS=[['Serviços','eac-tipo3','EAC — Serviço Tipo III',{aso:['37::inciso::i','50'],dnc:['71'],notivisa:['55','56'],fracionados:['46','49','65'],pba:['24','50','65']}],
 ['Serviços','vacinacao','Vacinação',{cartao_sistema:['50','68','85'],descarte:['50','62','65'],eapv:['55','56'],rt:['50','92']}]];
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
  for(const [a,esp] of ASSUNTO[app]){const r=await f.evaluate(a=>window.UvsLei(...a),a);ok(r.endsWith('13.725/2004, '+esp),app+': '+a[1]+' → '+esp+(r.endsWith('13.725/2004, '+esp)?'':' (saiu: '+r.replace(/^.*13\.725\/2004, /,'')+')'))}
  if(erros.length)T.falha(app+': erros de página: '+erros.join(' / '));
  await p.close()}
 for(const [n,app,t,esp] of PERGUNTAS){const {p,f,erros}=await T.abre(n,app,t,'',{browser:b});
  const refs=await f.evaluate(ids=>{const o={};window.ROTEIRO.secoes.forEach(s=>s.itens.forEach(it=>(it.perguntas||[]).forEach(q=>{if(ids.includes(q.id))o[q.id]=q.r.filter(x=>/^lei-municipal-13725-2004::/.test(x)).map(x=>x.replace('lei-municipal-13725-2004::artigo::',''))})));return o},Object.keys(esp));
  for(const [q,arts] of Object.entries(esp)){const r=refs[q]||[];ok(arts.every(x=>r.includes(x))&&r.length===arts.length,app+': '+q+' cita os arts. '+arts.join(', ')+(r.join()===arts.join()?'':' (cita: '+r.join(', ')+')'))}
  if(erros.length)T.falha(app+': erros de página: '+erros.join(' / '));await p.close()}
 await b.close()})();
