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
 /* sem AFE/AE: Receita Federal (BrasilAPI simulada) — motor (ressonância) e módulo próprio (Serviços de alimentação) */
 const RF={cnpj:CNPJ,razao_social:'CLINICA RECEITA LTDA',nome_fantasia:'CLINICA R',descricao_tipo_de_logradouro:'RUA',logradouro:'B',numero:'20',bairro:'SE',municipio:'SAO PAULO',uf:'SP',cep:'01002000',cnae_fiscal:8640205,cnae_fiscal_descricao:'Serviços de diagnóstico por imagem com uso de radiação ionizante',descricao_situacao_cadastral:'ATIVA',qsa:[{nome_socio:'SOCIA ADM',qualificacao_socio:'Sócio-Administrador'}]};
 async function rotaRF(p){await p.route(/afe_ae\/\d{3}\.json/,r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));await p.route(/brasilapi\.com\.br\/api\/cnpj\/v1\//,r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(RF)}))}
 {const {p,f,erros}=await T.abre('Serviços','imagem-ressonancia','Ressonância magnética','',{browser:b});await rotaRF(p);
  await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'dados'}));await p.waitForTimeout(300);
  await f.fill('[data-rs-meta="cnpj"]',FMT);await f.click('[data-rs-acao="anvisa_cnpj"]');await p.waitForTimeout(1000);
  const s=await p.evaluate(()=>JSON.parse(localStorage.getItem('uvis-imagem-ressonancia-v1')||'{}'));
  ok(s.meta.razao==='CLINICA RECEITA LTDA'&&/RUA B, 20/.test(s.meta.endereco||'')&&s.meta.rl==='SOCIA ADM','ressonância: sem AFE, dados da Receita (razão social, endereço, sócio administrador)');
  ok(/Receita Federal/.test(await f.evaluate(()=>document.querySelector('.rs-acoes')?.textContent||'')),'ressonância: mensagem cita a Receita Federal');
  if(erros.length)T.falha('erros de página (ressonância Receita): '+erros.join(' / '));await p.close()}
 {const {p,f,erros}=await T.abre('Alimentos','servicos-alimentacao-roteiro','Inspeção do estabelecimento','',{browser:b});await rotaRF(p);
  await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'perfil',item:'ident'}));await p.waitForTimeout(700);
  ok(await f.evaluate(()=>!!document.querySelector('[data-sa-meta="cnpj"]')),'alimentação: campo CNPJ na identificação');
  ok(await f.evaluate(()=>!!document.querySelector('.uvs-cnpj-btn')),'alimentação: botão de busca');
  await f.fill('[data-sa-meta="cnpj"]',FMT);await f.click('.uvs-cnpj-btn');await p.waitForTimeout(1000);
  ok((await f.evaluate(()=>document.querySelector('[data-sa-meta="establishment"]').value))==='CLINICA RECEITA LTDA','alimentação: estabelecimento preenchido pela Receita');
  if(erros.length)T.falha('erros de página (alimentação): '+erros.join(' / '));await p.close()}
 /* quem já tinha busca própria não ganha outro botão */
 {const {p,f}=await T.abre('Medicamentos','drogaria','Drogaria','',{browser:b});ok(!(await f.evaluate(()=>!!document.querySelector('.uvs-cnpj-btn'))),'drogaria: sem botão duplicado');await p.close()}
 await b.close()})();
