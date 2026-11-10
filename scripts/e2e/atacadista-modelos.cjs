'use strict';
/* Atacadista de medicamentos e de gases medicinais: documentos nos modelos da Anvisa
   (POP-O-SNVS-011 rev. 3, Anexos I, II e III; POP-O-SNVS-023 rev. 6, Anexo II), roteiro sem
   perguntas repetidas e textos de não conformidade objetivos. Uso: node scripts/e2e/atacadista-modelos.cjs */
const T=require('./lib.cjs');
const tem=(t,s,nome)=>{if(!t.includes(s))T.falha(nome+': falta “'+s+'”')};
const sem=(t,s,nome)=>{if(t.includes(s))T.falha(nome+': não deveria trazer “'+s+'”')};
(async()=>{
 const b=await T.navegador();
 /* ---------- Atacadista de medicamentos ---------- */
 {const {p,f,erros}=await T.abre('Medicamentos','distribuidoras-transportadoras','Atacadista de medicamentos','',{browser:b,viewport:{width:1100,height:1300}});
  const r=await f.evaluate(async()=>{
   Object.assign(state.meta,{organ:'UVIS Vila Prudente/Sapopemba',company:'Distribuidora Teste Ltda',fantasy:'DistriTeste',cnpj:'00.025.841/0001-53',unit:'Matriz',address:'Rua das Flores, 100',legal:'João da Silva / 000.000.000-00',rt:'Maria Souza / CRF-SP 12345',start:'2026-10-20',end:'2026-10-21',objective:'Verificação das boas práticas.',activities:['Distribuir','Armazenar'],team:[{name:'Inspetora Um',code:'1234567',institution:'UVIS',sphere:'Municipal'}],contacts:[{name:'Maria Souza',role:'RT',contact:'maria@teste.com.br'}]});
   state.report=Object.assign(state.report||{},{licSituacao:'Possui',licAct:'Distribuir|Armazenar',afeAct:'Distribuir|Armazenar',emAtividade:'Sim',date:'2026-10-22'});
   state.distDocs=Object.assign(state.distDocs||{},{lic:{number:'123',date:'2025-05-10'},afe:{number:'1.23456-7',publicationDate:'2020-03-02'},ae:{status:'Não se aplica'}});
   const qs=DATA.sections.flatMap(s=>s.questions.map(q=>Object.assign({sec:s.id},q)));
   const alvo=qs.find(q=>q.id==='q279');state.answers[alvo.id]={status:'NC',evidence:'veículo sem registro de limpeza.'};
   Object.assign(state.plan,{classification:'Cumpre as Boas Práticas com Ação Corretiva',activities:'Distribuir e armazenar medicamentos'});
   state.peer={name:'Par Técnico',date:'2026-11-08',status:'Aprovado',comments:'',axes:{}};
   save();
   const txt=n=>n.map(ddNodeText).join('\n'),a1=await ddAnexoI({final:false});
   const xml=n=>n.map(x=>ddNodeXml(x,{media:[]})).join('');
   return {a1:txt(a1.nodes),a2:txt(ddAnexo2Nodes()),a3:txt(dmPeerNodes()),al:txt(dmAlertaNodes({class:'Desvio de qualidade Classe I',product:'Dipirona',lot:'ABC',date:'2026-10-21',time:'15:00'})),
    alXml:xml(dmAlertaNodes({})),a1Xml:xml(a1.nodes),
    ids:qs.map(q=>q.id),vagos:qs.filter(q=>/A equipe registrou|requisito avaliado/.test(q.ncText||'')).map(q=>q.id),semNc:qs.filter(q=>!q.escopo&&!q.ncText).map(q=>q.id),
    plural:qs.filter(q=>/\barts\. \d+º? e \d|, incisos /.test(q.legal||'')&&/^(ifa|si)-|expedicao-documento|q417/.test(q.id)).map(q=>q.id),ponto:qs.filter(q=>/\.$/.test(q.legal||'')).map(q=>q.id),
    legais:qs.map(q=>[q.id,q.legal||'']),rod:[DM_RODAPE.I,DM_RODAPE.II,DM_RODAPE.III,DM_RODAPE.ALERTA]}});
  /* Anexo I */
  for(const s of ['RELATÓRIO DE INSPEÇÃO','Estabelecimento: Distribuidora Teste Ltda','1.1. Nome Fantasia: DistriTeste','1.2. Razão Social:','1.3. CNPJ:','☒ Matriz','1.7. Responsável legal: João da Silva / CPF: 000.000.000-00','1.8. Responsável técnico: Maria Souza / CRF/UF: CRF-SP 12345','1.9. Licença de Funcionamento n° 123','1.10. Atividades Licenciadas:','1.11. Relação dos demais estabelecimentos:','1.12. Documentos anexos:','2.1. Autorização de Funcionamento n° 1.23456-7 publicada em 02/03/2020','2.2. Atividades:','2.3. Autorização Especial: não aplicável.','2.4. Atividades:','3.1. Período: 20/10/2026 a 21/10/2026','3.2. Objetivo da inspeção:','3.3. Período da última inspeção:','Nome: Maria Souza      Cargo: RT      Contato: maria@teste.com.br','Estabelecimento em atividade','14.1 Cumpre as Boas Práticas ☐','14.3 Cumpre as Boas Práticas com Ação Corretiva ☒','14.3.1 ATIVIDADES(S): Distribuir e armazenar medicamentos','14.4 Não cumpre as Boas Práticas ☐','15. MEDIDAS ADOTADAS/ DOCUMENTOS EMITIDOS','Inspetores/ Instituição','19.5 Assinatura:'])tem(r.a1,s,'Anexo I');
  for(const s of ['..','não se aplica publicada em','Nome fantasia:'])sem(r.a1.replace(/\.{3,}|_+/g,''),s,'Anexo I');
  if(!/w:val="nil"/.test(r.a1Xml))T.falha('Anexo I: os quadros de atividades da AFE/AE (2.2 e 2.4) deveriam sair sem bordas');
  /* Anexo II */
  for(const s of ['Formulário de Comunicação de Não Conformidades','1.1. Razão Social: Distribuidora Teste Ltda','1.4. País: Brasil','\nPeríodo: 20/10/2026 a 21/10/2026','Nome do inspetor: Inspetora Um\nCódigo do inspetor: 1234567','Norma e Artigo Infringido | RDC Anvisa nº 430/2020, art. 68','Requisito regulamentar descumprido com a evidência','☐ Finalizada\n☐ Em andamento','☐ Avaliação Documental\n☐ Inspeção de Acompanhamento\n☐ Próxima Inspeção Planejada de BPDAIT conforme POP-O-SNVS-031\n☐ Sem necessidade de monitoramento','6. REGISTRO DE ENTREGA DO FORMULÁRIO, RELATÓRIO, TERMOS E AUTOS'])tem(r.a2,s,'Anexo II');
  for(const s of ['2.1 Período','limpeza..'])sem(r.a2,s,'Anexo II');
  /* Anexo III */
  for(const s of ['Formulário de Revisão por Par Técnico','I. Dados do Estabelecimento','II. Itens avaliados','Os itens avaliados estão adequados?','III. Nome da Equipe Inspetora','Nome: Inspetora Um','IV. Identificação do Par Técnico','Data da Devolução: 08/11/2026','V. Comentários (obrigatório o preenchimento no caso de reprovação)','VI. Status Final','☒ Aprovado','☐ Reprovado'])tem(r.a3,s,'Anexo III');
  /* alerta rápido */
  for(const s of ['Notificação de alerta rápido referente a desvio de qualidade/recolhimento','IMPORTANTE – ENCAMINHAR IMEDIATAMENTE','Número de referência','1. Para:','2. Trata-se de:','☒ Desvio de qualidade Classe I','☐ Desvio de qualidade Classe II','☐ Falsificação','☐ Outros','3. Número da notificação NOTIVISA/PERIWEB (se houver):','4. Produto: Dipirona','5. Número de registro:','6. Nome comercial:','7. Denominação comum internacional ou Nome genérico:','8. Forma farmacêutica:','9. Dose:','10. Número do lote (e do granel, se diferentes): ABC','11. Validade:','12. Apresentação comercial e número de unidades farmacotécnicas (por apresentação):','13. Data de fabricação:','14. Detentor do registro:','15.1. Fabricante:','15.2. Caso o desvio seja referente apenas a um local de fabricação','16. Empresa que está realizando o recolhimento (se diferente de 14 ou 15.1):','17. Número do recolhimento (se disponível):','18. Detalhes do desvio de qualidade/motivação do recolhimento:','19. Informações sobre a distribuição, incluindo exportações','20. Ação tomada pela autoridade emissora:','21. Ação proposta:','22. De (Autoridade emissora):','23. Pessoa de contato:','24. Assinatura:','25. Data: 21/10/2026','26. Hora: 15:00'])tem(r.al,s,'Alerta rápido');
  if(!/<w:vMerge w:val="restart"\/>/.test(r.alXml))T.falha('Alerta rápido: o campo 16 deveria ocupar as linhas dos campos 15.1 e 15.2');
  /* rodapés dos modelos */
  if(!/AN-I-2$/.test(r.rod[0])||!/AN-II-0$/.test(r.rod[1])||!/AN-III-0$/.test(r.rod[2])||!/POP-O-SNVS-023 rev\. 6 – AN-II-0$/.test(r.rod[3]))T.falha('rodapés dos modelos: '+JSON.stringify(r.rod.map(x=>x.slice(-30))));
  /* roteiro */
  for(const id of ['q291','q292','q294','q295','q290'])if(r.ids.includes(id))T.falha('pergunta repetida ainda no roteiro: '+id);
  for(const id of ['q293','qtv-01','qtv-02','qtr-01','qtr-02','q284','ifa-01','si-01'])if(!r.ids.includes(id))T.falha('pergunta ausente: '+id);
  if(r.vagos.length)T.falha('texto de não conformidade vago: '+r.vagos.join(', '));
  if(r.semNc.length)T.falha('pergunta sem texto de não conformidade: '+r.semNc.join(', '));
  if(r.plural.length)T.falha('citação não desdobrada: '+r.plural.join(', '));
  if(r.ponto.length)T.falha('citação terminada em ponto: '+r.ponto.join(', '));
  /* citações que o botão não abria */
  const res=await f.evaluate(async L=>{const out=[];if(!window.LegisV12)return ['LegisV12 ausente'];/* sem rede o banco não carrega: a conferência fica para o teste com rede */let base=null;try{base=await LegisV12.texto({law:'RDC Anvisa nº 430/2020, art. 14',device:'RDC Anvisa nº 430/2020, art. 14'})}catch(e){}if(!base)return ['SEM_REDE'];for(const [id,legal] of L)for(const parte of String(legal).split(';').map(x=>x.trim()).filter(Boolean)){if(/13\.725/.test(parte))continue;let a=null;try{a=await LegisV12.texto({law:parte,device:parte})}catch(e){}if(!(a&&a.some(x=>x.exato&&String(x.texto).trim())))out.push(id+': '+parte);else if(/430\/2020, art\. (15|53)\b/.test(parte)&&!/^Art\. (15|53)\./.test(a[0].texto))out.push(id+': abre o preâmbulo — '+parte)}return out},r.legais.filter(x=>/^(ifa|si)-|^q39[367]$|^q417$|^q402$|expedicao-documento|^q1[0-9]{2}$/.test(x[0])));
  if(res[0]==='SEM_REDE')console.log('aviso: banco de legislação inacessível neste ambiente; abertura das citações não conferida');else if(res.length)T.falha('citações sem texto: '+res.slice(0,8).join(' | '));
  if(erros.length)T.falha('erros na página (atacadista): '+erros.join(' | '));
  await p.close();}
 /* ---------- Atacadista de gases medicinais ---------- */
 {const {p,f,erros}=await T.abre('Medicamentos','gases-medicinais','Atacadista de gases medicinais','',{browser:b,viewport:{width:1100,height:1300}});
  const K='uvis-gases-medicinais-v1';
  await f.evaluate(K=>{const st=JSON.parse(localStorage.getItem(K)||'null')||{v:1,meta:{},r:{},sit:{},fotos:{},inf:{},infNota:{},concl:'',pt:{}};
   Object.assign(st.meta,{razao:'Gases Teste Ltda',fantasia:'GasTeste',cnpj:'00.025.841/0001-53',endereco:'Rua das Flores, 100',licenca:'123',afe:'1.23456-7',rl:'João da Silva / 000.000.000-00',rt:'Maria Souza / CRF-SP 12345',data:'2026-10-20',equipe:'Inspetora Um'});
   ROTEIRO.secoes.slice(1).forEach(s=>s.itens.forEach(it=>(it.perguntas||[]).forEach(q=>{st.r[q.id]='c'})));st.r.programa='nc';st.sit.programa='último relatório de 2022.';
   st.pop={orgao:'UVIS Vila Prudente/Sapopemba',unidade:'Filial',licSit:'Possui',licAct:['Distribuir'],afeSit:'Possui',afeAct:['Distribuir'],aeSit:'Não se aplica',primeira:'Sim',classificacao:'Cumpre as Boas Práticas com Ação Corretiva',ativConclusao:'Distribuir gases medicinais',nc:{programa:{cat:'Maior',sit:'Em andamento',mon:'Avaliação Documental',acao:'Refazer o programa',aval:'Aceita'}},par:{nome:'Par Técnico',data:'2026-11-08',status:'Aprovado',eixos:{formato:'Sim'}},planoRecebido:'2026-11-03'};
   localStorage.setItem(K,JSON.stringify(st))},K);
  await f.evaluate(()=>location.reload());await p.waitForTimeout(4000);
  const g=p.frames().find(x=>x!==p.mainFrame());
  await g.evaluate(()=>UvisPadrao.vai({aba:'relatorio'}));await p.waitForTimeout(700);
  const r=await g.evaluate(()=>({painel:!!document.querySelector('.p11'),botoes:[...document.querySelectorAll('[data-p11-doc]')].map(x=>x.dataset.p11Doc).join(','),ncs:document.querySelectorAll('.p11-nc').length,previa:!!document.querySelector('.rs-relatorio'),
   I:RsPop011.texto('I'),II:RsPop011.texto('II'),P:RsPop011.texto('plano'),III:RsPop011.texto('III'),pend:[RsPop011.pendencias('I'),RsPop011.pendencias('II'),RsPop011.pendencias('plano')]}));
  if(!r.painel||r.botoes!=='I,II,plano,III')T.falha('gases: painel dos documentos do POP-011 ausente na aba Relatório ('+r.botoes+')');
  if(r.ncs!==1)T.falha('gases: esperava 1 não conformidade no painel, veio '+r.ncs);
  if(!r.previa)T.falha('gases: a prévia do relatório do roteiro sumiu');
  if(r.pend.some(x=>x.length))T.falha('gases: pendências inesperadas: '+JSON.stringify(r.pend));
  for(const s of ['RELATÓRIO DE INSPEÇÃO','Estabelecimento: Gases Teste Ltda','1.1. Nome Fantasia: GasTeste','☒ Filial','1.7. Responsável legal: João da Silva / CPF: 000.000.000-00','1.10. Atividades Licenciadas:','2.1. Autorização de Funcionamento n° 1.23456-7','2.3. Autorização Especial: não aplicável.','3.1. Período: 20/10/2026','☒ O estabelecimento está sendo inspecionado pela primeira vez.','11.4 Autoinspeção','Não conformidade nº 1 — maior: Não há programa de autoinspeção','Situação encontrada: último relatório de 2022 (RDC Anvisa nº 887/2024, art. 42','14.3 Cumpre as Boas Práticas com Ação Corretiva ☒','14.3.1 ATIVIDADES(S): Distribuir gases medicinais','Inspetores/ Instituição','19.5 Assinatura:'])tem(r.I,s,'gases, Anexo I');
  sem(r.I,'..','gases, Anexo I');
  for(const s of ['Formulário de Comunicação de Não Conformidades','1.1. Razão Social: Gases Teste Ltda','Nome do inspetor: Inspetora Um','Norma e Artigo Infringido | RDC Anvisa nº 887/2024, art. 42','☐ Finalizada\n☒ Em andamento','☒ Avaliação Documental'])tem(r.II,s,'gases, Anexo II');
  sem(r.II,'13.725','gases, Anexo II (a não conformidade cita a norma específica)');
  for(const s of ['ANÁLISE DO PLANO DE AÇÃO','Ação proposta pela empresa | Refazer o programa','☒ Aceita'])tem(r.P,s,'gases, análise do plano');
  for(const s of ['Formulário de Revisão por Par Técnico','I. Dados do Estabelecimento','Nome do Par Técnico: Par Técnico','☒ Aprovado'])tem(r.III,s,'gases, Anexo III');
  /* os quatro arquivos baixam */
  const nomes=[];p.on('download',d=>nomes.push(d.suggestedFilename()));
  for(const k of ['I','II','plano','III']){await g.click('[data-p11-doc="'+k+'"]');await p.waitForTimeout(1800)}
  if(nomes.length!==4||!nomes.every(n=>/\.docx$/.test(n)))T.falha('gases: esperava 4 arquivos Word, vieram '+JSON.stringify(nomes));
  /* campo digitado grava no rascunho */
  await g.evaluate(()=>{document.querySelector('[data-p11-g="ident"]').open=true});await g.fill('[data-p11="fone"]','(11) 3333-4444');await p.waitForTimeout(300);
  const fone=await g.evaluate(K=>JSON.parse(localStorage.getItem(K)).pop.fone,K);if(fone!=='(11) 3333-4444')T.falha('gases: campo do painel não gravou ('+fone+')');
  if(erros.length)T.falha('erros na página (gases): '+erros.join(' | '));
  await p.close();}
 /* os demais roteiros do motor não ganham o painel */
 {const {p,f}=await T.abre('Medicamentos','vacina-drogaria','Vacinação em drogaria','',{browser:b});
  await f.evaluate(()=>UvisPadrao.vai({aba:'relatorio'}));await p.waitForTimeout(500);
  if(await f.evaluate(()=>!!document.querySelector('.p11')||!!window.RsPop011))T.falha('vacinação em drogaria não deveria ter o painel do POP-011');
  await p.close();}
 await b.close();
 if(!process.exitCode)console.log('PASS: Atacadista de medicamentos e de gases medicinais nos modelos da Anvisa (Anexos I, II e III do POP-O-SNVS-011; alerta rápido do POP-O-SNVS-023), roteiro sem repetição e citações que abrem.');
})();
