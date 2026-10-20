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
/* CNES (base mensal do DATASUS, município de São Paulo), também simulado */
const CN={cnes:'2077485',razao_social:'EMPRESA TESTE LTDA',nome_fantasia:'TESTE',cnpj:CNPJ,tipo_unidade:'CLINICA/CENTRO DE ESPECIALIDADE',logradouro:'RUA A',numero:'10',bairro:'CENTRO',cep:'01001000',licenca_sanitaria:{numero:'CEVS123',validade:'2027-01-31'},situacao:'ativo',data_atualizacao:'2026-09-15',equipamentos:[{equipamento:'TOMOGRAFO COMPUTADORIZADO',existentes:1,em_uso:1,sus:false}]};
async function rotaCnes(p,com){await p.route(/cnes\/cnpj\/\d{3}\.json/,r=>com?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({[CNPJ]:['2077485']})}):r.fulfill({status:404,body:''}));
 await p.route(/cnes\/estabelecimentos\/\d{3}\.json/,r=>com?r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({'2077485':CN})}):r.fulfill({status:404,body:''}))}
async function rota(p){await p.route(/afe_ae\/\d{3}\.json/,r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(REG)}));await rotaCnes(p,true)}
(async()=>{const b=await T.navegador();
 /* motor roteiro-simples: imagem, transporte, academia e gases (AFE e AE em campos próprios) */
 for(const [n,a,t] of [['Serviços','imagem-tomografia','Tomografia computadorizada'],['Serviços','transporte-biologico','Transporte de material biológico'],['Serviços','academia-piscina','Academias e piscinas'],['Medicamentos','gases-medicinais','Atacadista de gases medicinais']]){
  const {p,f,erros}=await T.abre(n,a,t,'',{browser:b});await rota(p);
  await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'dados'}));await p.waitForTimeout(300);
  ok(await f.evaluate(()=>!!document.querySelector('[data-rs-acao="anvisa_cnpj"]')),a+': botão de busca na Anvisa');
  await f.fill('[data-rs-meta="cnpj"]',FMT);await f.click('[data-rs-acao="anvisa_cnpj"]');await p.waitForTimeout(800);
  const s=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}'),'uvis-'+a+'-v1');
  ok(s.meta&&s.meta.razao==='EMPRESA TESTE LTDA'&&/RUA A, 10/.test(s.meta.endereco||''),a+': razão social e endereço preenchidos');
  if(a==='imagem-tomografia'){ok(s.meta.cnes==='2077485','tomografia: CNES preenchido pelo CNPJ');ok(/CNES 2077485.*CEVS123/.test(await f.evaluate(()=>document.querySelector('.rs-acoes')?.textContent||'')),'tomografia: mensagem com CNES e licença declarada')}
  if(a==='gases-medicinais')ok(/AFE 1234567/.test(s.meta.afe||'')&&/AE 7654321/.test(s.meta.ae||'')&&!/7654321/.test(s.meta.afe||''),'gases: AFE e AE em campos separados');
  if(erros.length)T.falha('erros de página ('+a+'): '+erros.join(' / '));await p.close()}
 /* módulos próprios */
 for(const [n,a,t,q,sec,it,rs] of [['Odontologia','odontologia','Odontologia','','perfil','ident',/Razão social/],['Serviços assistenciais','servicos-assistenciais','ILPI','servico=ilpi','ident','dados',/^Estabelecimento/],['Produtos','produtos-correlatos','Atacadista / distribuidor','atividade=atacadista','dados','ident',/^Estabelecimento/]]){
  const {p,f,erros}=await T.abre(n,a,t,q,{browser:b});await rota(p);
  if(sec){await f.evaluate(([s,i])=>UvisPadrao.vai({aba:'roteiro',secao:s,item:i}),[sec,it]);await p.waitForTimeout(500)}
  await p.waitForTimeout(500);
  const tem=await f.evaluate(()=>!!document.querySelector('.uvs-cnpj-btn'));ok(tem,a+': botão “Buscar dados pelo CNPJ (Anvisa, CNES e Receita)”');
  if(tem){await f.evaluate(v=>{const b=document.querySelector('.uvs-cnpj-btn');const sc=b.closest('fieldset,form,section,.pu-bloco,.meta-grid,.card')||document;const i=[...sc.querySelectorAll('input')].find(x=>/^CNPJ/i.test(((x.closest('label')||{}).textContent||'').trim()));i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}))},FMT);
   await f.click('.uvs-cnpj-btn');await p.waitForTimeout(800);
   const v=await f.evaluate(re=>{const r=new RegExp(re);const i=[...document.querySelectorAll('input')].find(x=>x.offsetParent&&r.test(((x.closest('label')||{}).textContent||x.placeholder||'').trim()));return i&&i.value},rs.source);
   ok(v==='EMPRESA TESTE LTDA',a+': razão social preenchida ('+v+')');
   ok(/Base da Anvisa: EMPRESA TESTE LTDA/.test(await f.evaluate(()=>document.querySelector('.uvs-cnpj-msg')?.textContent||'')),a+': mensagem com AFE/AE')}
  if(erros.length)T.falha('erros de página ('+a+'): '+erros.join(' / '));await p.close()}
 /* sem AFE/AE: Receita Federal (BrasilAPI simulada) — motor (ressonância) e módulo próprio (Serviços de alimentação) */
 const RF={cnpj:CNPJ,razao_social:'CLINICA RECEITA LTDA',nome_fantasia:'CLINICA R',descricao_tipo_de_logradouro:'RUA',logradouro:'B',numero:'20',bairro:'SE',municipio:'SAO PAULO',uf:'SP',cep:'01002000',cnae_fiscal:8640205,cnae_fiscal_descricao:'Serviços de diagnóstico por imagem com uso de radiação ionizante',descricao_situacao_cadastral:'ATIVA',qsa:[{nome_socio:'SOCIA ADM',qualificacao_socio:'Sócio-Administrador'}]};
 async function rotaRF(p,cnes){await rotaCnes(p,!!cnes);await p.route(/afe_ae\/\d{3}\.json/,r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));await p.route(/brasilapi\.com\.br\/api\/cnpj\/v1\//,r=>r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(RF)}))}
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
 /* sem AFE/AE, com CNES: identificação pelo CNES e a Receita completa o sócio administrador */
 {const {p,f,erros}=await T.abre('Serviços','imagem-ultrassom','Ultrassonografia','',{browser:b});await rotaRF(p,true);
  await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'dados'}));await p.waitForTimeout(300);
  await f.fill('[data-rs-meta="cnpj"]',FMT);await f.click('[data-rs-acao="anvisa_cnpj"]');await p.waitForTimeout(1200);
  const s=await p.evaluate(()=>JSON.parse(localStorage.getItem('uvis-imagem-ultrassom-v1')||'{}'));
  ok(s.meta.razao==='EMPRESA TESTE LTDA'&&s.meta.cnes==='2077485'&&/RUA A, 10/.test(s.meta.endereco||'')&&s.meta.rl==='SOCIA ADM','ultrassom: sem AFE, CNES preenche a identificação e a Receita o sócio administrador');
  ok(/CNES 2077485/.test(await f.evaluate(()=>document.querySelector('.rs-acoes')?.textContent||'')),'ultrassom: mensagem cita o CNES');
  if(erros.length)T.falha('erros de página (ultrassom CNES): '+erros.join(' / '));await p.close()}
 /* sem CNPJ: busca pelo número do CNES */
 {const {p,f,erros}=await T.abre('Serviços','imagem-mamografia','Mamografia','',{browser:b});await rotaRF(p,true);
  await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'dados'}));await p.waitForTimeout(300);
  await f.fill('[data-rs-meta="cnes"]','2077485');await f.click('[data-rs-acao="anvisa_cnpj"]');await p.waitForTimeout(1000);
  const s=await p.evaluate(()=>JSON.parse(localStorage.getItem('uvis-imagem-mamografia-v1')||'{}'));
  ok(s.meta.cnpj===FMT&&s.meta.razao==='EMPRESA TESTE LTDA','mamografia: pelo número do CNES, CNPJ e razão social preenchidos');
  if(erros.length)T.falha('erros de página (mamografia CNES): '+erros.join(' / '));await p.close()}
 /* quem já tinha busca própria não ganha outro botão */
 {const {p,f}=await T.abre('Medicamentos','drogaria','Drogaria','',{browser:b});ok(!(await f.evaluate(()=>!!document.querySelector('.uvs-cnpj-btn'))),'drogaria: sem botão duplicado');await p.close()}
 await b.close()})();
