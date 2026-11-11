'use strict';
/* Padronização de 11/11/2026 nos demais núcleos (o que já valia em Medicamentos):
   - a tela não anda ao responder: o controle tocado (resposta, item da lista, opção de perfil) fica no lugar;
   - a resposta e a lista de itens andam juntas, sem contradição, nos roteiros de motor próprio
     (campo/pontos.js) e em todos os do motor roteiro-simples (pontosSeguem por padrão);
   - o enunciado pergunta pelo conjunto e os itens ficam na lista (Academias, Transporte, Imagem);
   - Serviços assistenciais: a exigência repetida entre Documentos e Inspeção aparece uma vez só.
   Uso: node scripts/e2e/resposta-lista.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(!c)T.falha(m)};
/* abre o item do roteiro que contém o seletor */
async function vaiAte(f,p,sel){const lista=await f.evaluate(()=>UvisPadrao.lista());
 for(const s of lista)for(const i of s.itens){await f.evaluate(([a,b])=>UvisPadrao.vai({aba:'roteiro',secao:a,item:b}),[s.id,i.id]);await p.waitForTimeout(250);if(await f.evaluate(q=>!!document.querySelector(q),sel))return true}
 return false}
/* clica com o mouse (sem a rolagem automática da ferramenta) e mede o deslocamento do controle */
async function clicaEMede(f,p,sel){await f.evaluate(q=>document.querySelector(q).scrollIntoView({block:'center'}),sel);await p.waitForTimeout(300);
 const topo=()=>f.evaluate(q=>{const e=document.querySelector(q);return e?Math.round(e.getBoundingClientRect().top):null},sel);
 const t0=await topo(),bb=await (await f.$(sel)).boundingBox();await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);
 const med=[];for(const ms of [150,350,500]){await p.waitForTimeout(ms);med.push(await topo())}
 return {t0,med,max:Math.max(...med.map(x=>x===null?999:Math.abs(x-t0)))}}
const marcados=(f,pre,v)=>f.evaluate(([pre,v])=>[...document.querySelectorAll('[data-uvs-pt^="'+pre+'"],[data-rs-pt^="'+pre+'"]')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>(b.dataset.uvsPt||b.dataset.rsPt).split(/[¦|]/).pop()).join(''),[pre,v]);
(async()=>{
 const b=await T.navegador(),V={viewport:{width:820,height:1180}};
 /* ---------- Odontologia (motor próprio) ---------- */
 {const {p,f,erros}=await T.abre('Odontologia','odontologia','Odontologia','',{browser:b,...V});
  ok(await vaiAte(f,p,'[data-uvs-pt="lic1¦b¦NC"]'),'odontologia: pergunta com lista de itens não encontrada');
  const tit=await f.evaluate(()=>document.querySelector('.uvs-pontos-tit').textContent);
  ok(/Itens exigidos/.test(tit)&&/a resposta acompanha os itens/.test(tit),'odontologia: título da lista — '+tit);
  let m=await clicaEMede(f,p,'[data-uvs-pt="lic1¦b¦NC"]');ok(m.max<=4,'odontologia: o item da lista saiu do lugar ao ser marcado ('+JSON.stringify(m)+')');
  ok(await f.evaluate(()=>document.querySelector('[data-a="lic1"][data-v="nao"]').getAttribute('aria-pressed')==='true'),'odontologia: “Não atende” na lista deveria marcar “Não cumpre”');
  m=await clicaEMede(f,p,'[data-a="lic1"][data-v="ok"]');ok(m.max<=4,'odontologia: a resposta saiu do lugar ('+JSON.stringify(m)+')');
  ok(await marcados(f,'lic1¦')==='CCCC','odontologia: “Cumpre” deveria marcar todos os itens como Atende ('+await marcados(f,'lic1¦')+')');
  await clicaEMede(f,p,'[data-a="lic1"][data-v="na"]');ok(await marcados(f,'lic1¦')==='NANANANA','odontologia: “Não se aplica” deveria marcar todos como N/A ('+await marcados(f,'lic1¦')+')');
  await clicaEMede(f,p,'[data-a="lic1"][data-v="nao"]');ok(await marcados(f,'lic1¦')==='','odontologia: “Não cumpre” sem item reprovado deveria limpar a lista ('+await marcados(f,'lic1¦')+')');
  await clicaEMede(f,p,'[data-uvs-pt="lic1¦a¦NC"]');await clicaEMede(f,p,'[data-uvs-pt="lic1¦b¦C"]');
  await clicaEMede(f,p,'[data-a="lic1"][data-v="nao"]');await p.waitForTimeout(200);
  /* opção de perfil (chip): também fica no lugar */
  if(await vaiAte(f,p,'button.chip[data-v="extra"]')){m=await clicaEMede(f,p,'button.chip[data-v="extra"]');ok(m.max<=4,'odontologia: a opção de perfil saiu do lugar ('+JSON.stringify(m)+')')}
  ok(!erros.length,'odontologia: erros de página — '+erros.join(' | '));await p.close()}
 /* ---------- Produtos (rolagem suave na página) ---------- */
 {const {p,f,erros}=await T.abre('Produtos','produtos-correlatos','Atacadista / distribuidor','atividade=atacadista',{browser:b,...V});
  ok(await vaiAte(f,p,'[data-uvs-pt="r4¦a¦NC"]'),'produtos: pergunta com lista de itens não encontrada');
  const m=await clicaEMede(f,p,'[data-uvs-pt="r4¦a¦NC"]');ok(m.max<=4,'produtos: o item da lista saiu do lugar ('+JSON.stringify(m)+')');
  await clicaEMede(f,p,'[data-answer="r4"][data-value="yes"]');ok(/^C+$/.test(await marcados(f,'r4¦')),'produtos: “Cumpre” deveria marcar todos os itens como Atende ('+await marcados(f,'r4¦')+')');
  ok(!erros.length,'produtos: erros de página — '+erros.join(' | '));await p.close()}
 /* ---------- Serviços assistenciais: exigência repetida ---------- */
 for(const [serv,n] of Object.entries({ilpi:13,centrodia:6,ct:13,srt:7,saica:4,demais:4})){
  const {p,f,erros}=await T.abre('Serviços assistenciais','servicos-assistenciais','x','servico='+serv,{browser:b,...V,carga:3500});
  const r=await f.evaluate(()=>({rep:current.rot.filter(x=>x.rep!=null).length,tot:current.rot.length,tela:asGrupos('rot').reduce((a,g)=>a+g.idx.length,0),
   pares:current.rot.filter(x=>x.rep!=null).every(x=>current.doc[x.rep]&&current.doc[x.rep].rep==null),prog:(()=>{updateProgress();return document.querySelector('#progress').textContent})(),docs:current.doc.length}));
  ok(r.rep===n,serv+': esperava '+n+' perguntas repetidas retiradas, achei '+r.rep);
  ok(r.tela===r.tot-r.rep,serv+': a seção Inspeção deveria mostrar '+(r.tot-r.rep)+' perguntas, mostra '+r.tela);
  ok(r.pares,serv+': pergunta retirada sem o documento correspondente');
  ok(new RegExp('de '+(r.docs+r.tot-r.rep)+' verificações').test(r.prog),serv+': contagem de verificações — '+r.prog);
  if(serv==='ilpi'){ /* a falta do documento sai uma vez no relatório; a pergunta retirada não aparece na tela */
   ok(await vaiAte(f,p,'[data-as-q^="doc|"]'),'ilpi: seção Documentos não encontrada');
   const i=await f.evaluate(()=>current.doc.findIndex(x=>/^Estatuto registrado/.test(x.i)));
   ok(await vaiAte(f,p,'[data-as-mark="NC"][data-kind="doc"][data-index="'+i+'"]'),'ilpi: documento “Estatuto registrado” não encontrado');
   const m=await clicaEMede(f,p,'[data-as-mark="NC"][data-kind="doc"][data-index="'+i+'"]');ok(m.max<=4,'ilpi: a resposta saiu do lugar ('+JSON.stringify(m)+')');
   const txt=await T.texto(f,'servicos-assistenciais');ok((txt.match(/[Ee]statuto registrado/g)||[]).length===1,'ilpi: a falta do Estatuto deveria sair uma vez no relatório ('+(txt.match(/[Ee]statuto registrado/g)||[]).length+')');
   const tela=await f.evaluate(async()=>{const L=UvisPadrao.lista();let n=0;for(const s of L.filter(x=>x.id==='rot'))for(const it of s.itens){UvisPadrao.vai({aba:'roteiro',secao:s.id,item:it.id});await new Promise(r=>setTimeout(r,120));n+=[...document.querySelectorAll('#pu-conteudo .pu-q')].filter(q=>/Está atendida a exigência de Estatuto registrado/.test(q.textContent)).length}return n});
   ok(tela===0,'ilpi: a pergunta repetida do Estatuto ainda aparece na Inspeção')}
  ok(!erros.length,serv+': erros de página — '+erros.join(' | '));await p.close()}
 /* ---------- motor roteiro-simples: Academias (enunciado e lista) e Vacinação (lista) ---------- */
 {const {p,f,erros}=await T.abre('Serviços','academia-piscina','Academias e piscinas','',{browser:b,...V});
  ok(await f.evaluate(()=>ROTEIRO.pontosSeguem===true),'academias: pontosSeguem deveria ser o padrão do motor');
  ok(await vaiAte(f,p,'[data-rs-pt^="separados|"]'),'academias: pergunta “separados” não encontrada');
  const q=await f.evaluate(()=>{const e=document.querySelector('[data-rs-q="separados"]');return {t:e.querySelector('.pu-q-texto').textContent,tit:e.querySelector('.rs-pontos-tit').textContent,n:e.querySelectorAll('.rs-ponto').length}});
  ok(/Os sanitários e vestiários atendem aos requisitos\?/.test(q.t),'academias: enunciado — '+q.t);ok(/Itens exigidos/.test(q.tit)&&q.n===4,'academias: lista de itens — '+q.tit+' ('+q.n+')');
  let m=await clicaEMede(f,p,'[data-rs-pt="separados|'+await f.evaluate(()=>ROTEIRO.secoes.flatMap(s=>s.itens.flatMap(i=>i.perguntas||[])).find(x=>x.id==='separados').pontos[1][0])+'|NC"]');
  ok(m.max<=4,'academias: o item da lista saiu do lugar ('+JSON.stringify(m)+')');
  ok(await f.evaluate(()=>JSON.parse(localStorage.getItem(ROTEIRO.store)).r.separados==='nc'),'academias: “Não atende” deveria marcar a resposta negativa');
  m=await clicaEMede(f,p,'[data-rs-r="separados|c"]');ok(m.max<=4,'academias: a resposta saiu do lugar ('+JSON.stringify(m)+')');
  ok(await marcados(f,'separados|')==='CCCC','academias: a resposta positiva deveria marcar todos os itens como Atende ('+await marcados(f,'separados|')+')');
  const rel=await T.texto(f,'padrao');ok(/separados por sexo|chuveiro e um vaso/.test(rel),'academias: a frase do relatório da pergunta reescrita deveria continuar descritiva');
  ok(!erros.length,'academias: erros de página — '+erros.join(' | '));await p.close()}
 for(const [app,tit] of [['vacinacao','Vacinação'],['eac-tipo3','EAC — Serviço Tipo III'],['imagem-convencional','Radiologia convencional'],['transporte-biologico','Transporte de material biológico'],['estetica','Estética e beleza']]){
  const {p,f,erros}=await T.abre('Serviços',app,tit,app==='estetica'?'p_tipo=saude':'',{browser:b,...V,carga:3500});
  const id=await f.evaluate(()=>{const q=ROTEIRO.secoes.flatMap(s=>s.itens.flatMap(i=>i.perguntas||[])).find(x=>x.pontos&&!x.se&&!x.naSe);return q&&q.id});
  ok(id&&await vaiAte(f,p,'[data-rs-pt^="'+id+'|"]'),app+': pergunta com lista de itens não encontrada');
  if(id){const n=await f.evaluate(id=>document.querySelectorAll('[data-rs-q="'+id+'"] .rs-ponto').length,id);
   await clicaEMede(f,p,'[data-rs-r="'+id+'|c"]');ok(await marcados(f,id+'|')==='C'.repeat(n),app+': a resposta positiva deveria marcar os '+n+' itens como Atende ('+await marcados(f,id+'|')+')');
   const m=await clicaEMede(f,p,'[data-rs-r="'+id+'|na"]');if(m.t0!==null&&m.med[2]!==null)ok(m.max<=4,app+': a resposta saiu do lugar ('+JSON.stringify(m)+')')}
  ok(!erros.length,app+': erros de página — '+erros.join(' | '));await p.close()}
 await b.close();
 if(!process.exitCode)console.log('PASS: tela parada ao responder, lista de itens acompanhando a resposta (motor próprio e roteiro-simples), enunciados pelo conjunto e Serviços assistenciais sem exigência repetida.');
})();
