/* ——— Atacadista de medicamentos: documentos nos modelos oficiais da Anvisa ———
   POP-O-SNVS-011 rev. 3 — Anexo I (relatório de inspeção), Anexo II (comunicação de não
   conformidades) e Anexo III (revisão por par técnico); POP-O-SNVS-023 rev. 6 — Anexo II
   (notificação de alerta rápido). Capa, numeração dos campos, quadros e rodapé seguem os
   arquivos publicados no portal da Anvisa. Este arquivo é injetado depois dos demais
   (scripts/repack-atacadista-modelos.cjs): as funções de mesmo nome daqui prevalecem.
   Também ajusta o roteiro: perguntas repetidas, citações e textos de não conformidade. */

const DM_RODAPE={
 I:'Anexo I – MODELO DO RELATÓRIO DE INSPEÇÃO - PROCEDIMENTO OPERACIONAL: Elaboração de Relatório de Inspeção de Distribuidoras ou Importadora, Armazenadoras e Transportadoras de Medicamentos. IDENTIFICADOR: POP-O-SNVS-011 - rev.3– AN-I-2',
 II:'Anexo II – FORMULÁRIO DE COMUNICAÇÃO DE NÃO CONFORMIDADES - PROCEDIMENTO OPERACIONAL: Elaboração de Relatório de Inspeção de Distribuidoras ou Importadoras, Armazenadoras e Transportadoras de Medicamentos. IDENTIFICADOR: POP-O-SNVS-011 - rev.3– AN-II-0',
 III:'Anexo III – FORMULÁRIO DE REVISÃO POR PAR TÉCNICO - PROCEDIMENTO OPERACIONAL: Elaboração de Relatório de Inspeção de Distribuidoras ou Importadoras, Armazenadoras e Transportadoras de Medicamentos. IDENTIFICADOR: POP-O-SNVS-011 - rev.3– AN-III-0',
 ALERTA:'Anexo II – Notificação de alerta rápido referente a desvio de qualidade/recolhimento – PROCEDIMENTO OPERACIONAL: Fluxo das Informações de Vigilância Sanitária Relacionadas aos Fabricantes, Distribuidores, Importadores, Armazenadores e Transportadores de Medicamentos e Insumos Farmacêuticos, Medidas Administrativas e Acompanhamento de Ações. IDENTIFICADOR: POP-O-SNVS-023 rev. 6 – AN-II-0'
};
const DM_MONITOR=['Avaliação Documental','Inspeção de Acompanhamento','Próxima Inspeção Planejada de BPDAIT conforme POP-O-SNVS-031','Sem necessidade de monitoramento'];

function dmBox(v,t){return (v?'☒ ':'☐ ')+t}
function dmDuas(v){const t=String(v||'').trim(),i=t.indexOf('/');return i<0?[t,'']:[t.slice(0,i).trim(),t.slice(i+1).trim()]}
/* Capa dos modelos: quadro do órgão, título, estabelecimento e local/data; o conteúdo começa na página seguinte. */
function dmCapa(nodes,titulo,comEstab){
 const m=state.meta;
 nodes.push({k:'p',t:'',after:500});
 nodes.push({k:'tbl',cols:[5800],o:{hf:''},rows:[[{runs:[[m.organ||'',{b:true,sz:14}]],t:m.organ||'',al:'left'}]]});
 nodes.push({k:'p',t:'',after:2200});
 nodes.push({k:'p',al:'left',after:comEstab?2200:400,runs:[[titulo,{b:true,sz:18}]]});
 if(comEstab){
  nodes.push({k:'p',al:'left',after:2200,runs:[['Estabelecimento: ',{b:true,sz:11}],[m.company||'',{sz:11}]]});
  nodes.push({k:'p',al:'center',runs:[[(m.city||'São Paulo')+', '+ddExtenso((state.report||{}).date)+'.',{sz:11}]]});
 }
 nodes.push({k:'pb'});
}

/* Evidência que termina em ponto não gera “..” no texto da não conformidade. */
function ddNcTexto(d){let t=String(d.text||'').trim(),ev=String(d.evidence||'').trim();if(t.includes('«evidência»')){t=t.replace('«evidência»',()=>ev.replace(/[.;\s]+$/,'')||'evidência não registrada');ev=''}t=ddFim(t);if(ev)t+=' Evidência: '+ddFim(ev.replace(/\s*\n\s*/g,'; '));if(d.legal&&!t.includes(String(d.legal).trim()))t=t.replace(/\.$/,'')+' ('+String(d.legal).trim().replace(/\.$/,'')+').';return t.replace(/\.{2,}$/,'.')}

/* ---------- Anexo I — relatório de inspeção ---------- */
function ddAnexoIMontar(o,fotos){
 const m=state.meta,R=state.report||{},D=state.distDocs||{},nodes=[],nc=ddNcMapa(),ctx={nc,fotosQ:fotos.fotosQ,ncUsadas:new Set()};
 dmCapa(nodes,'RELATÓRIO DE INSPEÇÃO',true);
 const it=(n,t)=>nodes.push({k:'h1',n,t}),sub=(n,t)=>nodes.push({k:'h2',n,t}),p=t=>nodes.push({k:'p',t});
 const campo=(n,rot,v,b)=>nodes.push({k:'p',al:'left',runs:[[n+' '+rot+': ',{b:!!b}],[String(v??'').trim()||'—',{}]]});
 const blocoItem=(item)=>{const r=ddItemNodes(item,ctx);if(r.houve)nodes.push(...r.nodes);else p(ddVazio(item,r));return r};
 const cel=t=>({t,sz:10}),acts=['Distribuir','Transportar','Importar','Armazenar','Expedir'];
 const linhaAtiv=sel=>({k:'tbl',cols:[1870,1871,1871,1871,1871],o:{nb:true,hf:''},rows:[acts.map(a=>cel(dmBox(sel.includes(a),a)))]});
 /* 1 */
 it(1,'Identificação do estabelecimento');
 campo('1.1.','Nome Fantasia',m.fantasy);campo('1.2.','Razão Social',m.company);
 nodes.push({k:'p',al:'left',runs:[['1.3. CNPJ: ',{}],[(m.cnpj||'—')+'     '+dmBox(m.unit==='Matriz','Matriz')+'     '+dmBox(m.unit==='Filial','Filial'),{}]]});
 campo('1.4.','Endereço',m.address);campo('1.5.','Fone',m.phone);campo('1.6.','E-mail',m.email);
 {const [a,b]=dmDuas(m.legal);nodes.push({k:'p',al:'left',runs:[['1.7. Responsável legal: ',{}],[a||'—',{}],[' / CPF: ',{}],[b||'—',{}]]})}
 {const [a,b]=dmDuas(m.rt);nodes.push({k:'p',al:'left',runs:[['1.8. Responsável técnico: ',{}],[a||'—',{}],[' / CRF/UF: ',{}],[b||'—',{}],[ddTem(m.rtAlternate)?'; substituto(s): '+m.rtAlternate:'',{}]]})}
 const lic=D.lic||{},semLic=R.licSituacao==='Não possui licença';
 nodes.push({k:'p',al:'left',runs:[['1.9. Licença de Funcionamento n° ',{}],[(semLic?'—':(lic.number||m.license||'—')),{}],['   Data: ',{}],[semLic?'—':(ddData(lic.date)||'—'),{}],[!semLic&&ddTem(lic.validity)?' (validade: '+(ddData(lic.validity)||lic.validity)+')':'',{}],['  -  '+dmBox(semLic,'Não possui Licença.'),{}]]});
 const la=ddLista(R.licAct),ck=a=>dmBox(la.includes(a),a);
 nodes.push({k:'p',al:'left',after:40,t:'1.10. Atividades Licenciadas:'});
 nodes.push({k:'tbl',cols:[1870,1871,1871,1871,1871],o:{hf:''},rows:[[cel(ck('Distribuir')),cel(ck('Transportar')+'\n'+ck('Transporte próprio')+'\n'+ck('Transporte para terceiros')),cel(ck('Importar')),cel(ck('Armazenar')+'\n'+ck('Armazenamento próprio')+'\n'+ck('Armazenamento para terceiros')),cel(ck('Expedir'))]]});
 campo('1.11.','Relação dos demais estabelecimentos',m.otherUnits||'Não se aplica');campo('1.12.','Documentos anexos',R.docsAnexos||'Não há.');
 const r1=ddItemNodes('1',ctx);if(r1.houve)nodes.push(...r1.nodes);
 /* 2 */
 it(2,'Dados da autorização de funcionamento');
 const af=D.afe||{},ae=D.ae||{};
 const detalhe=x=>{const dd=[ddTem(x.process)&&'processo '+x.process,ddTem(x.class)&&'classe '+x.class,ddTem(x.statusOfficial)&&'situação na fonte oficial: '+x.statusOfficial,ddTem(x.activities)&&'atividades autorizadas: '+String(x.activities).replace(/\s*\n\s*/g,'; ')].filter(Boolean);if(dd.length)nodes.push({k:'p',ind:360,t:ddFim(dd.join('; ').replace(/^./,c=>c.toUpperCase()))})};
 const aut=(n,rot,x,re)=>{if(x.status==='Não possui'||x.status==='Não se aplica'){nodes.push({k:'p',al:'left',runs:[[n+' ',{b:true}],[rot+': '+(x.status==='Não possui'?'não possui.':'não aplicável.'),{}]]});return}
  nodes.push({k:'p',al:'left',runs:[[n+' ',{b:true}],[rot+' n° ',{}],[x.number||'—',{}],[' publicada em ',{}],[ddData(x.publicationDate)||'—',{}],[ddTem(re)?' (RE nº '+re+')':'',{}],['.',{}]]});detalhe(x)};
 aut('2.1.','Autorização de Funcionamento',af,R.afeRe);
 nodes.push({k:'p',al:'left',after:40,runs:[['2.2. ',{b:true}],['Atividades:',{}]]},linhaAtiv(ddLista(R.afeAct)));
 aut('2.3.','Autorização Especial',ae,R.aeRe);
 nodes.push({k:'p',al:'left',after:40,runs:[['2.4. ',{b:true}],['Atividades:',{}]]},linhaAtiv(ddLista(R.aeAct)));
 const r2=ddItemNodes('2',ctx);if(r2.houve)nodes.push(...r2.nodes);
 /* 3 */
 it(3,'Dados da inspeção');
 campo('3.1.','Período',ddPeriodo(m.start,m.end),true);
 {const av=Array.isArray(m.activities)?m.activities:ddLista(m.activities);
  campo('3.2.','Objetivo da inspeção',[m.objective,m.inspectionType&&('Tipo: '+m.inspectionType),av.length&&('Atividades verificadas: '+ddJoin(av.map(ddLc))),ddTem(m.process)&&('Processo SEI / solicitação: '+m.process)].filter(Boolean).map(ddFim).join(' '),true)}
 const primeira=m.first==='Sim'||R.primeira==='Sim';campo('3.3.','Período da última inspeção',primeira?'—':(m.last||m.previousInspection||'—'),true);
 nodes.push({k:'checks',items:[['O estabelecimento está sendo inspecionado pela primeira vez.',primeira]]});
 /* 4 */
 it(4,'Pessoas contactadas');
 const cont=(m.contacts||[]).filter(x=>x&&ddTem(x.name));
 (cont.length?cont:[{}]).forEach(x=>nodes.push({k:'p',al:'left',t:'Nome: '+(x.name||'')+'      Cargo: '+(x.role||'')+'      Contato: '+(x.contact||'')}));
 if(ddTem(m.contactInspection))p('Pessoas contatadas nesta inspeção: '+ddFim(m.contactInspection));
 /* 5 e 6 */
 it(5,'Informações gerais');{const rg=ddRascunhoGeral(),g=ddTem(R.general)?R.general:rg;ddParas(g).forEach(t=>p(t));const fg=ddTem(R.general)?ddFaltantes(R.general,rg):'';if(fg)p('Dados registrados na etapa 1: '+fg);if(!ddTem(g))p('Não informado.')}
 it(6,'Não conformidades anteriores');{const ra=ddRascunhoAnterior(),q=ddTem(R.previous)?R.previous:ra;ddParas(q).forEach(t=>p(t));const fq=ddTem(R.previous)?ddFaltantes(R.previous,ra):'';if(fq)p('Histórico registrado na etapa 1: '+fq);if(!ddTem(q))p(primeira?'Não se aplica: primeira inspeção.':'Não informado.')}
 /* 7 */
 it(7,'Terceirização e prestação de serviços');
 const ter=(Array.isArray(R.outsource)?R.outsource:Object.values(R.outsource||{})).filter(x=>x&&Object.values(x).some(ddTem));
 const r7=ddItemNodes('7',ctx);if(r7.houve)nodes.push(...r7.nodes);
 if(ter.length)nodes.push({k:'tbl',head:true,o:{hf:''},cols:[1900,2000,1500,1150,1150,1654],rows:[['Atividades Terceirizadas','Empresa(s) Contratada(s)','CNPJ','AFE','AE','Produto/Ensaio']].concat(ter.map(x=>[x.atividade||'',x.empresa||'',x.cnpj||'',x.afe||'',x.ae||'',x.produto||'']))});
 if(!r7.houve&&!ter.length)p(ddVazio('7',r7));
 sub('7.1',DD_TIT['7.1']);ddParas(R.terceirizacao_qual).forEach(t=>p(t));if(!ddTem(R.terceirizacao_qual))p(ter.length?'Não informado.':'Não aplicável.');
 /* 8 */
 it(8,'Pessoal');blocoItem('8');
 sub('8.1',DD_TIT['8.1']);ddParas(R.higiene).forEach(t=>p(t));if(!ddTem(R.higiene))p('Não informado.');
 /* 9 */
 it(9,'Áreas físicas');
 sub('9.1',DD_TIT['9.1']);blocoItem('9.1');
 sub('9.2',DD_TIT['9.2']);blocoItem('9.2');
 const tq=(state.thermalQualifications||[]).filter(x=>x&&Object.values(x).some(ddTem));
 if(tq.length){p('Qualificações térmicas avaliadas:');nodes.push({k:'tbl',head:true,cols:[1700,1700,1500,1100,1800,1554],rows:[['Objeto','Identificação','Documento / revisão','Data','Faixa / condição','Resultado']].concat(tq.map(x=>[[x.kind,x.purpose].filter(ddTem).join(' — '),x.identification||'',x.document||'',ddData(x.date),x.range||'',[x.result,ddTem(x.risk)?'pior caso: '+x.risk:'',x.observations].filter(ddTem).join(' — ')]))})}
 const st=(state.stockBasket||[]).flatMap(pr=>(pr.lotes&&pr.lotes.length?pr.lotes:[{}]).map(l=>[pr.nome||'',[pr.registro,pr.ean].filter(Boolean).join(' / '),l.lote||'',ddData(l.validade),l.fisicoRaw??'',l.escrituradoRaw??'',l.diferenca??'']));
 if(st.length){p('Conferência de estoque por amostragem:');nodes.push({k:'tbl',head:true,cols:[2100,1700,1100,1100,1100,1100,1054],rows:[['Produto','Registro / EAN','Lote','Validade','Físico','Escriturado','Diferença']].concat(st.map(r=>r.map(String)))})}
 sub('9.3',DD_TIT['9.3']);blocoItem('9.3');
 /* 10 */
 it(10,'Transporte');blocoItem('10');sub('10.1',DD_TIT['10.1']);blocoItem('10.1');
 /* 11 */
 it(11,'Sistema de gestão da qualidade');blocoItem('11');
 for(const k of ['11.1','11.2','11.3','11.4','11.5','11.6','11.7','11.8','11.9']){sub(k,DD_TIT[k]);blocoItem(k);if(k==='11.2'&&typeof ifaTabelaRelatorio==='function'){const t=ifaTabelaRelatorio();if(t){p('Amostragem de IFA e insumos verificada na inspeção:');nodes.push(t)}}}
 /* 12 */
 it(12,'Controle de qualidade');
 if(!(m.activities||[]).includes('Importar')&&!['12.1','12.2','12.3','12.4','12.5'].some(k=>ddPerguntas(k).some(x=>(state.answers[x.q.id]||{}).status)))p('Não se aplica: item exclusivo de estabelecimentos importadores, e o estabelecimento não realiza importação.');
 else for(const k of ['12.1','12.2','12.3','12.4','12.5']){sub(k,DD_TIT[k]);blocoItem(k)}
 /* NCs sem lugar no roteiro (manuais) */
 const soltas=nc.ncs.map((n,i)=>({n,num:i+1})).filter(x=>!ctx.ncUsadas.has(x.num)&&!DATA.sections.some(s=>s.questions.some(q=>q.id===x.n.id&&(state.answers[q.id]||{}).status==='NC')));
 /* 13 */
 it(13,'Considerações finais / avaliação de riscos');
 if(soltas.length){p('Não conformidades registradas fora dos itens do roteiro:');soltas.forEach(x=>nodes.push(ddNcPara(x.num,x.n)))}
 ddParas(state.plan.risk).forEach(t=>p(t));
 if(nc.ncs.length)nodes.push({k:'tbl',head:true,cols:[700,4854,2400,1400],rows:[['Nº','Não conformidade','Norma e artigo','Categoria']].concat(nc.ncs.map((n,i)=>{const d=ncData(n);return [String(i+1),String(d.text||'').replace('«evidência»','(ver evidência)'),d.legal||'',d.category||'Não categorizada']}))});
 if(!ddTem(state.plan.risk)&&!nc.ncs.length)p('Não foram constatadas não conformidades.');else if(!ddTem(state.plan.risk))p('Avaliação de risco não informada.');
 /* 14 */
 it(14,'Conclusão');
 const cl=state.plan.classification||'',ativ=state.plan.activities||(m.activities||[]).join(', ');
 nodes.push({k:'p',al:'left',t:R.emAtividade==='Não'?'Estabelecimento em atividade: não.':'Estabelecimento em atividade'});
 nodes.push({k:'tbl',cols:[4677,4677],o:{hf:''},rows:[['14.1','Cumpre as Boas Práticas','14.1.1'],['14.3','Cumpre as Boas Práticas com Ação Corretiva','14.3.1'],['14.4','Não cumpre as Boas Práticas','14.4.1']].map(([n,t,na])=>[{sz:10,runs:[[n+' '+t+' '+(cl===t?'☒':'☐'),{b:true}]]},{sz:10,runs:[[na+' ATIVIDADES(S): ',{b:true}],[cl===t?ativ:'',{}]]}])});
 /* 15 */
 it(15,'Medidas adotadas/ documentos emitidos');
 const com=state.cycle&&state.cycle.communication;const med=[];
 if(com)med.push('Emitido e entregue à empresa o Formulário de Comunicação de Não Conformidades (Anexo II do POP-O-SNVS-011) em '+ddData(String(com.issuedAt).slice(0,10))+(state.delivery2&&state.delivery2.date?', recebido em '+ddData(state.delivery2.date):'')+'.');
 if(o.final&&nc.ncs.length)med.push('O plano de ação apresentado pela empresa'+(state.plan.receivedDate?', recebido em '+ddData(state.plan.receivedDate)+(state.plan.sei?' ('+state.plan.sei+')':''):'')+', foi analisado pela equipe inspetora; a análise integra este relatório como Anexo A.');
 med.forEach(p);ddParas(state.plan.measures).forEach(t=>p(t));if(!med.length&&!ddTem(state.plan.measures))p('Não informado.');
 /* 16 */
 it(16,'Anexos');
 const anexos=[];if(nc.ncs.length)anexos.push(o.final?'Anexo A — Análise do plano de ação.':'Análise do plano de ação — será anexada na versão final do relatório.');if(fotos.list.length)anexos.push((o.final&&nc.ncs.length?'Anexo B':'Anexo A')+' — Registro fotográfico ('+fotos.list.length+' foto'+(fotos.list.length>1?'s':'')+'), em arquivo PDF à parte.');
 anexos.forEach(p);ddParas(state.plan.attachments).forEach(t=>p(t));if(!anexos.length&&!ddTem(state.plan.attachments))p('Não há.');
 /* 17 */
 it(17,'Equipe inspetora');
 const eq=ddEquipeRows();nodes.push({k:'tbl',head:true,o:{hf:''},cols:[4200,2000,3154],rows:[['Inspetores/ Instituição','Matrícula','Assinatura']].concat((eq.length?eq:[{}]).map(x=>[(x.name||'')+(x.role==='Observador'?' (observador)':'')+(x.institution?'\n'+x.institution:''),x.code||'','\n\n']))});
 /* 18 */
 it(18,'Registro de revisão pelo par técnico');
 const pr=state.peer||{};if(pr.name&&pr.date&&pr.status)p('Revisão realizada por '+pr.name+' em '+ddData(pr.date)+'. Resultado: '+pr.status.toLowerCase()+'.');else p(o.final?'Não registrado.':'Pendente.');
 /* 19 */
 it(19,'Registro de entrega do relatório, termos e autos');
 const dv=state.delivery||{};p('19.1 Termos e autos entregues: '+(dv.terms||'______________________________________'));p('19.2 Recebido em: '+(ddData(dv.date)||'____/____/______')+'.');p('19.3 Nome do Responsável Legal ou Técnico: '+(dv.receiver||'______________________________________'));p('19.4 Documento de identificação: '+(dv.document||'______________________________'));p('19.5 Assinatura: ______________________________________');
 return {nodes,fotos,nc};
}

async function ddPrevia(baixar){
 const r=await ddAnexoI({final:false}),nodes=r.nodes.slice();ddAnexoFotos(nodes,r.fotos,'A');
 if(!baixar){ddModal('Prévia do relatório — Anexo I',nodes,ddAnexoIPendencias(false));return}
 ddBaixar(ddDocx(nodes,{header:'PRÉVIA — sujeita a alteração · versão '+distVersion(),headerColor:'9B241C',rodape:DM_RODAPE.I}),ddNomeArq('Previa_Relatorio_Anexo_I'));
}
async function exportFinal(){const issues=distIssues();if(!peerApproved())issues.push('Registre a revisão aprovada desta versão da minuta.');if(!state.approval?.name||!state.approval?.date)issues.push('Registre a aprovação para emissão, com nome e data.');if(issues.length){preview('Pendências para liberação do relatório final',issues.join('\n'));return}
 const r=await ddAnexoI({final:true}),nodes=r.nodes.slice(),temNC=r.nc.ncs.length;if(temNC)nodes.push(...ddPlanoNodes({anexo:true}));ddAnexoFotos(nodes,r.fotos,temNC?'B':'A');
 state.cycle=state.cycle||{};state.cycle.final={snapshot:distSnapshot(),version:distVersion(),issuedAt:new Date().toISOString(),approvedBy:state.approval.name};save();
 ddBaixar(ddDocx(nodes,{rodape:DM_RODAPE.I}),ddNomeArq('Relatorio_Final_Anexo_I'));renderCTab();renderCycle()}

/* ---------- Anexo II — formulário de comunicação de não conformidades ---------- */
function ddAnexo2Nodes(){
 const m=state.meta,ncs=allNCs(),nodes=[],dv=state.delivery2||{},eq=ddEquipeRows(),rot=t=>({t,sz:10}),val=t=>({t,sz:10});
 dmCapa(nodes,'Formulário de Comunicação de Não Conformidades',false);
 nodes.push({k:'h1',n:1,t:'Identificação da empresa'});
 nodes.push({k:'p',al:'left',runs:[['1.1. Razão Social: ',{b:true}],[m.company||'',{}]]},{k:'p',al:'left',runs:[['1.2. CNPJ: ',{b:true}],[(m.cnpj||'')+'     '+dmBox(m.unit==='Matriz','Matriz')+'     '+dmBox(m.unit==='Filial','Filial'),{}]]},{k:'p',al:'left',runs:[['1.3. Endereço: ',{b:true}],[m.address||'',{}]]},{k:'p',al:'left',runs:[['1.4. País: ',{b:true}],[m.country||'Brasil',{}]]});
 nodes.push({k:'h1',n:2,t:'Inspeção'},{k:'p',al:'left',runs:[['Período: ',{b:true}],[ddPeriodo(m.start,m.end),{}]]});
 nodes.push({k:'h1',n:3,t:'Equipe inspetora'});(eq.length?eq:[{},{}]).forEach(x=>nodes.push({k:'p',al:'left',after:40,runs:[['Nome do inspetor: ',{b:true}],[(x.name||'')+(x.role==='Observador'?' (observador)':''),{}]]},{k:'p',al:'left',runs:[['Código do inspetor: ',{b:true}],[x.code||'',{}]]}));
 nodes.push({k:'h1',n:4,t:'Não conformidades'});
 if(!ncs.length)nodes.push({k:'p',t:'Não foram constatadas não conformidades.'});
 ncs.forEach((n,i)=>{const d=ncData(n);nodes.push({k:'p',al:'left',after:60,runs:[['Não conformidade nº '+(i+1),{b:true}]]});
  nodes.push({k:'tbl',cols:[2600,6754],o:{hf:''},rows:[[rot('Norma e Artigo Infringido'),val(d.legal||'')],[rot('Requisito regulamentar descumprido com a evidência'),val(ddNcTexto(Object.assign({},d,{legal:''})))]]});
  nodes.push({k:'tbl',cols:[2600,6754],o:{hf:''},rows:[[rot('Situação da NC'),val(['Finalizada','Em andamento'].map(x=>dmBox(d.status===x,x)).join('\n'))]]});
  nodes.push({k:'tbl',cols:[2600,6754],o:{hf:''},rows:[[rot('Estratégia de Monitoramento'),val(DD_MONITOR.map((x,j)=>dmBox(d.monitor===x,DM_MONITOR[j]||x)).join('\n'))]]})});
 nodes.push({k:'h1',n:5,t:'Assinaturas'});
 nodes.push({k:'tbl',head:true,o:{hf:''},cols:[2900,2300,1800,2354],rows:[['Nome do Inspetor\n(informar se o inspetor atuou como observador)','Nome/Sigla da Instituição\n(a qual o inspetor pertence)','Esfera de Atuação do Inspetor\n(Federal, Estadual ou Municipal)','Assinatura'].map(t=>({t,al:'center'}))].concat((eq.length?eq:[{},{}]).map(x=>[(x.name||'')+(x.role==='Observador'?' (observador)':''),x.institution||'',x.sphere||'','\n\n']))});
 nodes.push({k:'h1',n:6,t:'Registro de entrega do formulário, relatório, termos e autos'});
 nodes.push({k:'p',al:'left',t:'Termos e autos entregues: '+(dv.terms||'______________________________________________')},{k:'p',al:'left',t:'Recebido em: '+(ddData(dv.date)||'____/____/______')+'.'},{k:'p',al:'left',t:'Nome e título do responsável pelo recebimento do relatório: '+(dv.receiver||'________________________________')},{k:'p',al:'left',t:'Documento de identificação: '+(dv.document||'______________________________')},{k:'p',al:'left',t:'Assinatura: ______________________________________'});
 return nodes;
}
function exportAnexo2(){const pend=ddAnexo2Pendencias();if(pend.length){ddModal('Anexo II — pendências antes de emitir',ddAnexo2Nodes(),pend);return}
 state.cycle=state.cycle||{};state.cycle.communication={issuedAt:new Date().toISOString(),version:distVersion()};save();
 ddBaixar(ddDocx(ddAnexo2Nodes(),{rodapeSo:DM_RODAPE.II}),'Anexo_II_POP_011_Comunicacao_NC.docx')}

/* ---------- Anexo III — formulário de revisão por par técnico ---------- */
function dmPeerNodes(){
 const m=state.meta,p=state.peer||{},ax=p.axes||{},eq=ddEquipeRows(),nodes=[],C=[5354,2000,2000];
 const barra=t=>[{t,b:true,fill:'D9D9D9',span:3,sz:10}],uma=(t,o)=>[Object.assign({t,span:3,sz:10},o||{})];
 const meio=(a,b,c)=>[{t:a,sz:10,sb:'tbr'},Object.assign({sz:10,al:'center',sb:'tblr'},b),Object.assign({sz:10,al:'center',sb:'tbl'},c)];
 dmCapa(nodes,'Formulário de Revisão por Par Técnico',false);
 const rows=[barra('I. Dados do Estabelecimento'),uma('Nome da empresa: '+(m.company||'')+'\n\nCNPJ: '+(m.cnpj||'')+'                    Data da Inspeção: '+ddPeriodo(m.start,m.end)+'\n'),
  barra('II. Itens avaliados'),[{t:'',sz:10,sb:'br'},{t:'Os itens avaliados estão adequados?',b:true,span:2,sz:10,al:'center',sb:'bl'}],meio('',{t:'Sim',b:true},{t:'Não',b:true})]
  .concat(DATA.peerAxes.map(a=>meio(a[1],{t:ax[a[0]]==='Sim'?'☒':'☐'},{t:ax[a[0]]==='Não'?'☒':'☐'})))
  .concat([barra('III. Nome da Equipe Inspetora'),uma((eq.length?eq:[{}]).map(e=>'Nome: '+(e.name||'')+(e.role==='Observador'?' (observador)':'')).join('\n\n')),
  barra('IV. Identificação do Par Técnico'),uma('Nome do Par Técnico: '+(p.name||'')+'\n\nData da Devolução: '+(ddData(p.date)||'____/____/______')+'\n'),
  barra('V. Comentários (obrigatório o preenchimento no caso de reprovação)'),uma((String(p.comments||'').trim()||'')+'\n\n'),
  barra('VI. Status Final'),[{t:'          '+dmBox(p.status==='Aprovado','Aprovado'),sz:10,sb:'r'},{t:dmBox(p.status==='Reprovado','Reprovado'),span:2,sz:10,sb:'l'}]]);
 nodes.push({k:'tbl',cols:C,o:{hf:''},rows});
 return nodes;
}
function exportPeer(){if((state.peer||{}).status==='Reprovado'&&!String(state.peer.comments||'').trim()){alert('Comentários são obrigatórios quando a revisão é reprovada.');return}
 ddBaixar(ddDocx(dmPeerNodes(),{rodapeSo:DM_RODAPE.III}),'Anexo_III_POP_011_Revisao_Par_Tecnico.docx')}

/* ---------- POP-O-SNVS-023, Anexo II — notificação de alerta rápido ---------- */
function dmAlertaNodes(a){
 a=a||{};const m=state.meta,v=x=>String(x??'').trim(),C=[1559,1559,1559,1559,1559,1559],cl=v(a.class);
 const tipo=/falsifi/i.test(cl)?'F':/classe\s*II\b|^II$/i.test(cl)?'II':/classe\s*I\b|^I$/i.test(cl)?'I':cl?'O':'';
 const c=(t,span,o)=>Object.assign({t,span:span||6,sz:10},o||{}),rv=(rot,x)=>rot+(v(x)?' '+v(x):'');
 const nodes=[{k:'p',al:'center',after:0,runs:[['Anexo II',{b:true,sz:11}]]},{k:'p',al:'center',after:300,runs:[['Notificação de alerta rápido referente a desvio de qualidade/recolhimento',{b:true,sz:11}]]},{k:'p',al:'left',after:120,runs:[['IMPORTANTE – ENCAMINHAR IMEDIATAMENTE',{sz:11}]]}];
 nodes.push({k:'tbl',cols:C,o:{hf:''},rows:[
  [c('',3,{sb:'tl'}),c('Número de referência\n[preenchimento pela Anvisa]',3)],
  [c(v(a.issuer)||v(m.organ)||'[Adicionar cabeçalho do remetente]')],
  [c(rv('1. Para:',a.to)+'\n(caso se trate de múltiplos destinatários, anexar lista)')],
  [c('2. Trata-se de:\n'+dmBox(tipo==='I','Desvio de qualidade Classe I')+'\n'+dmBox(tipo==='II','Desvio de qualidade Classe II')+'\n'+dmBox(tipo==='F','Falsificação')+'\n'+dmBox(tipo==='O','Outros')+(tipo==='O'?': '+cl:''),3),c(rv('3. Número da notificação NOTIVISA/PERIWEB (se houver):',a.notivisa),3)],
  [c(rv('4. Produto:',a.product),3),c(rv('5. Número de registro:',a.registration),3)],
  [c(rv('6. Nome comercial:',a.trade),3),c(rv('7. Denominação comum internacional ou Nome genérico:',a.generic),3)],
  [c(rv('8. Forma farmacêutica:',a.form),3),c(rv('9. Dose:',a.dose),3)],
  [c(rv('10. Número do lote (e do granel, se diferentes):',a.lot),3),c(rv('11. Validade:',a.validity),3)],
  [c(rv('12. Apresentação comercial e número de unidades farmacotécnicas (por apresentação):',a.presentation),3),c(rv('13. Data de fabricação:',a.manufacture),3)],
  [c(rv('14. Detentor do registro:',a.holder))],
  [c(rv('15.1. Fabricante:',a.manufacturer)+'\nResponsável técnico/legal:\nTelefone:',3),c(rv('16. Empresa que está realizando o recolhimento (se diferente de 14 ou 15.1):',a.recallCompany)+'\nResponsável técnico/legal:\nTelefone:',3,{vm:1})],
  [c(rv('15.2. Caso o desvio seja referente apenas a um local de fabricação, indicar o local (se diferente do 15.1):',a.site)+'\nResponsável técnico/legal:\nTelefone:',3),c('',3,{vm:2})],
  [c(rv('17. Número do recolhimento (se disponível):',a.recallNumber))],
  [c(rv('18. Detalhes do desvio de qualidade/motivação do recolhimento:',a.deviation))],
  [c(rv('19. Informações sobre a distribuição, incluindo exportações (tipo de consumidor, por exemplo: hospitais):',a.distribution))],
  [c(rv('20. Ação tomada pela autoridade emissora:',a.authorityAction))],
  [c(rv('21. Ação proposta:',a.proposedAction))],
  [c(rv('22. De (Autoridade emissora):',a.issuer),3),c(rv('23. Pessoa de contato:',a.contact)+'\nTelefone:',3)],
  [c(rv('24. Assinatura:',a.signature),2),c(rv('25. Data:',ddData(a.date)),2),c(rv('26. Hora:',a.time),2)]]});
 return nodes;
}
function exportAlert(){ddBaixar(ddDocx(dmAlertaNodes(state.alert),{rodapeSo:DM_RODAPE.ALERTA}),'Anexo_II_POP_023_Alerta_Rapido.docx')}

/* ---------- Roteiro: perguntas repetidas, citações e textos de não conformidade ---------- */
/* Repetidas: as cinco abaixo perguntavam, no bloco Transporte, o mesmo que as seções “Qualificação
   de veículos e embalagens térmicas” e “Qualificação de rotas” (exibidas na mesma condição) ou
   que outra pergunta do próprio bloco. Ficam as das seções específicas. */
const DM_REPETIDAS={q291:'qtv-01 e qtv-02',q292:'qtr-01',q294:'qtr-01',q295:'qtv-02',q290:'q284'};
const DM_PERGUNTAS={
 'q293':{text:'A qualificação térmica do transporte considera as especificações dos produtos transportados?'},
 /* verificação em fontes públicas: ferramenta de apoio, sem dispositivo próprio — recomendação, como a q950 */
 'q916':{legal:'',recomendacao:true,noNC:true},
 'q396':{legal:'RDC Anvisa nº 166/2017, art. 5º'},
 'q397':{legal:'RDC Anvisa nº 166/2017, art. 7º'},
 'q417':{legal:'RDC Anvisa nº 670/2022, art. 4º; RDC Anvisa nº 670/2022, art. 9º, § 6º'},
 /* amostras de referência: o dispositivo é o art. 7º da RDC 670/2022 (o art. 50 da RDC 430/2020 trata das condições de armazenagem) */
 'q390':{legal:'RDC Anvisa nº 670/2022, art. 7º; RDC Anvisa nº 430/2020, art. 50'},
 'expedicao-documento':{legal:'RDC Anvisa nº 430/2020, art. 59, I a IX; RDC Anvisa nº 430/2020, art. 60'},
 'dist-id-licenca':{ncText:'A licença sanitária apresentada não identifica o estabelecimento ou não abrange as atividades inspecionadas.'},
 'dist-id-afe':{ncText:'A Autorização de Funcionamento (AFE) não abrange as atividades com medicamentos efetivamente realizadas.'},
 'dist-id-ae':{ncText:'A Autorização Especial (AE) não abrange a operação com medicamentos sujeitos a controle especial.'},
 'ifa-01':{legal:'RDC Anvisa nº 204/2006, art. 4º',ncText:'O destinatário do IFA não está identificado, autorizado ou licenciado para a atividade pertinente.'},
 'ifa-02':{legal:'RDC Anvisa nº 204/2006, art. 5º, caput e parágrafo único',ncText:'A finalidade de uso do IFA ou o seu respaldo regulatório não estão identificados.'},
 'ifa-03':{legal:'RDC Anvisa nº 204/2006, Anexo, item 7.2; Instrução Normativa nº 62/2020, art. 2º',ncText:'O fornecedor, o fabricante ou o insumo não foram aprovados documentalmente, com qualificação proporcional ao risco.'},
 'ifa-04':{legal:'Instrução Normativa nº 62/2020, art. 3º, caput e parágrafo único',ncText:'Não há acordo de qualidade ou especificação documentada que cubra os requisitos da operação.'},
 'ifa-05':{legal:'Instrução Normativa nº 62/2020, art. 4º, §§ 1º e 2º',ncText:'A cadeia de fornecimento do IFA e seus riscos não estão documentados ou não são verificados periodicamente.'},
 'ifa-06':{legal:'Instrução Normativa nº 62/2020, art. 4º, §§ 3º, 4º, 5º, 6º e 7º',ncText:'As auditorias de fabricantes e distribuidores de IFA não estão documentadas, ou a sua periodicidade não é justificada por risco.'},
 'ifa-07':{legal:'RDC Anvisa nº 204/2006, Anexo, itens 7.3.1 a 7.3.7 e 10.4',ncText:'O recebimento, a identificação, a quarentena, a aprovação ou a liberação do lote de IFA não estão registrados.'},
 'ifa-08':{legal:'Instrução Normativa nº 62/2020, art. 4º, § 8º',ncText:'As análises aplicáveis ao IFA importado não estão vinculadas ao lote examinado.'},
 'ifa-09':{legal:'Instrução Normativa nº 62/2020, art. 4º, § 9º',ncText:'Não é mantida amostra de referência do lote de IFA importado nas condições definidas.'},
 'ifa-10':{legal:'RDC Anvisa nº 204/2006, Anexo, item 12.3.3',ncText:'O certificado de análise não corresponde ao lote ou não traz os elementos de identificação, especificação e emissão.'},
 'ifa-11':{legal:'RDC Anvisa nº 204/2006, Anexo, itens 12.3.1 e 12.3.2; Instrução Normativa nº 62/2020, art. 4º, § 8º',ncText:'O certificado de análise disponibilizado não corresponde à operação realizada (fracionamento ou análise).'},
 'ifa-12':{legal:'RDC Anvisa nº 204/2006, art. 3º',ncText:'Houve fracionamento de insumo farmacêutico estéril, operação proibida.'},
 'ifa-13':{legal:'RDC Anvisa nº 204/2006, Anexo, itens 8.18, 12.2.1.1 e 12.2.1.2',ncText:'As análises e a liberação após o fracionamento não foram registradas antes da comercialização.'},
 'ifa-14':{legal:'RDC Anvisa nº 204/2006, Anexo, itens 12.1.3 a 12.2.3; Instrução Normativa nº 62/2020, art. 4º, § 8º',ncText:'A estrutura de controle da qualidade do fracionador não atende à atividade executada.'},
 'ifa-15':{legal:'RDC Anvisa nº 204/2006, Anexo, itens 8.16, 9.6, 9.7, 10.1 e 10.1.1',ncText:'As embalagens ou os rótulos não preservam a identidade do IFA ou, no fracionamento, não trazem os dados exigidos.'},
 'ifa-16':{legal:'RDC Anvisa nº 204/2006, Anexo, itens 8.17 e 10.5',ncText:'O lote de IFA não pode ser localizado ou reconciliado entre entrada, estoque, expedição e destinatário.'},
 'si-01':{legal:'RDC Anvisa nº 430/2020, art. 40',ncText:'Os sistemas com impacto na qualidade não foram identificados ou classificados conforme o impacto e o risco.'},
 'si-02':{ncText:'A validação ou qualificação do sistema não tem escopo e requisitos proporcionais ao uso pretendido e ao risco.'},
 'si-03':{ncText:'Os testes, os resultados, os desvios ou a aprovação do sistema não estão documentados antes do uso ou após mudança significativa.'},
 'si-04':{legal:'RDC Anvisa nº 430/2020, art. 18, IX; RDC Anvisa nº 430/2020, art. 40',ncText:'Não há controle de mudanças nem reavaliação do estado validado quando as alterações podem afetar a qualidade ou a rastreabilidade.'},
 'si-05':{ncText:'Os procedimentos de contingência e de recuperação de dados não estão definidos ou não foram testados conforme a criticidade do sistema.'},
 'si-06':{legal:'RDC Anvisa nº 430/2020, art. 40; RDC Anvisa nº 430/2020, arts. 72 a 74',ncText:'As responsabilidades e a rastreabilidade dos dados em sistema de fornecedor ou interface terceirizada não estão documentadas.'}
};
/* Os blocos de IFA, qualificação térmica e sistemas entram no roteiro depois deste arquivo
   (script que a casca acrescenta ao montar o módulo): a revisão é reaplicada quando a página
   termina de carregar. Reaplicar não muda o que já foi ajustado. */
/* Importadora: laboratório de controle de qualidade próprio é exigência da RDC Anvisa nº 670/2022, art. 7º
   (pedido de 12/11/2026) — pergunta própria no início de “Controle de Qualidade — instalações”. */
const DM_NOVAS={cq_instalacoes:[{id:'cq-lab',text:'A importadora possui laboratório de controle de qualidade e local de armazenamento próprios, incluindo local específico para as amostras de referência?',legal:'RDC Anvisa nº 670/2022, art. 7º',ncText:'A importadora não possui laboratório de controle de qualidade e local de armazenamento próprios, com local específico para as amostras de referência.'}]};
function dmRoteiro(){
 try{if(typeof POP_ORIENT!=='undefined'&&POP_ORIENT.cq_instalacoes)POP_ORIENT.cq_instalacoes[0]='O Controle de Qualidade aplica-se apenas aos estabelecimentos importadores, que devem possuir laboratório de controle de qualidade e local de armazenamento próprios, incluindo local específico para amostras de referência (RDC Anvisa nº 670/2022, art. 7º).'}catch(e){}
 for(const s of DATA.sections){
  for(const n of (DM_NOVAS[s.id]||[]))if(!s.questions.some(q=>q.id===n.id))s.questions.unshift(Object.assign({},n));
  if(s.questions.some(q=>DM_REPETIDAS[q.id]))s.questions=s.questions.filter(q=>!DM_REPETIDAS[q.id]);
  for(const q of s.questions){const a=DM_PERGUNTAS[q.id];if(a)Object.assign(q,a);if(q.legal)q.legal=String(q.legal).trim().replace(/\.$/,'')}
 }
}
dmRoteiro();
document.addEventListener('DOMContentLoaded',dmRoteiro);window.addEventListener('load',dmRoteiro);
{const st=document.createElement('style');st.textContent='.dd-tbl.nb td,.dd-tbl.nb th{border:0}';document.head.appendChild(st)}
