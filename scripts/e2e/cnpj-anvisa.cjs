'use strict';
/* Busca do estabelecimento na base de AFE/AE da Anvisa pelo CNPJ (19/10/2026): botão automático
   nos roteiros do motor roteiro-simples e nos módulos próprios (Odontologia, Serviços
   assistenciais, Produtos). A base é simulada (rota interceptada); nada vai à rede.
   Uso: node scripts/e2e/cnpj-anvisa.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
const CNPJ='00145307000180',FMT='00.145.307/0001-80';
const REG=[{cnpj:CNPJ,razao_social:'EMPRESA TESTE LTDA',nome_fantasia:'TESTE',endereco:'RUA A, 10',bairro:'CENTRO',municipio:'SAO PAULO',uf:'SP',cep:'01001000',responsavel_legal:'FULANO',responsavel_tecnico:'BELTRANA',autorizacao:'1234567',autorizacao_especial:'N',ativo:'SIM'},
 {cnpj:CNPJ,razao_social:'EMPRESA TESTE LTDA',autorizacao:'7654321',autorizacao_especial:'S',ativo:'SIM'}];
async function rota(p){await p.route(/afe_ae\/\d{3}\.json/,r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(REG)}))}
(async()=>{const b=await T.navegador();
 /* motor roteiro-simples: imagem, transporte, academia e gases (AFE e AE em campos próprios) */
 for(const [n,a,t] of [['Serviços','imagem-tomografia','Tomografia computadorizada'],['Serviços','transporte-biologico','Transporte de material biológico'],['Serviços','academia-piscina','Academias e piscinas'],['Medicamentos','gases-medicinais','Atacadista de gases medicinais']]){
  const {p,f,erros}=await T.abre(n,a,t,'',{browser:b});await rota(p);
  await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'dados'}));await p.waitForTimeout(300);
  ok(await f.evaluate(()=>!!document.querySelector('[data-rs-acao="anvisa_cnpj"]')),a+': botão de busca na Anvisa');
  await f.fill('[data-rs-meta="cnpj"]',FMT);await f.click('[data-rs-acao="anvisa_cnpj"]');await p.waitForTimeout(800);
  const s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}'),'uvis-'+a+'-v1');
  ok(s.meta&&s.meta.razao==='EMPRESA TESTE LTDA'&&/RUA A, 10/.test(s.meta.endereco||''),a+': razão social e endereço preenchidos');
  if(a==='gases-medicinais')ok(/AFE 1234567/.test(s.meta.afe||'')&&/AE 7654321/.test(s.meta.ae||'')&&!/7654321/.test(s.meta.afe||''),'gases: AFE e AE em campos separados');
  if(erros.length)T.falha('erros de página ('+a+'): '+erros.join(' / '));await p.close()}
 /* módulos próprios */
 for(const [n,a,t,q,sec,it,rs] of [['Odontologia','odontologia','Odontologia','','perfil','ident',/Razão social/],['Serviços assistenciais','servicos-assistenciais','ILPI','servico=ilpi','ident','dados',/^Estabelecimento/],['Produtos','produtos-correlatos','Atacadista / distribuidor','atividade=atacadista','dados','ident',/^Estabelecimento/]]){
  const {p,f,erros}=await T.abre(n,a,t,q,{browser:b});await rota(p);
  if(sec){await f.evaluate(([s,i])=>UvisPadrao.vai({aba:'roteiro',secao:s,item:i}),[sec,it]);await p.waitForTimeout(500)}
  await p.waitForTimeout(500);
  const tem=await f.evaluate(()=>!!document.querySelector('.uvs-cnpj-btn'));ok(tem,a+': botão “Buscar dados na Anvisa pelo CNPJ”');
  if(tem){await f.evaluate(v=>{const b=document.querySelector('.uvs-cnpj-btn');const sc=b.closest('fieldset,form,section,.pu-bloco,.meta-grid,.card')||document;const i=[...sc.querySelectorAll('input')].find(x=>/^CNPJ/i.test(((x.closest('label')||{}).textContent||'').trim()));i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}))},FMT);
   await f.click('.uvs-cnpj-btn');await p.waitForTimeout(800);
   const v=await f.evaluate(re=>{const r=new RegExp(re);const i=[...document.querySelectorAll('input')].find(x=>x.offsetParent&&r.test(((x.closest('label')||{}).textContent||x.placeholder||'').trim()));return i&&i.value},rs.source);
   ok(v==='EMPRESA TESTE LTDA',a+': razão social preenchida ('+v+')');
   ok(/Base da Anvisa: EMPRESA TESTE LTDA/.test(await f.evaluate(()=>document.querySelector('.uvs-cnpj-msg')?.textContent||'')),a+': mensagem com AFE/AE')}
  if(erros.length)T.falha('erros de página ('+a+'): '+erros.join(' / '));await p.close()}
 /* quem já tinha busca própria não ganha outro botão */
 {const {p,f}=await T.abre('Medicamentos','drogaria','Drogaria','',{browser:b});ok(!(await f.evaluate(()=>!!document.querySelector('.uvs-cnpj-btn'))),'drogaria: sem botão duplicado');await p.close()}
 await b.close()})();
