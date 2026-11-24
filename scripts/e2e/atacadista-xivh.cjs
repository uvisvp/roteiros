'use strict';
/* Atacadista — licença inicial pelo Formulário XIV.H (trilha “xivh”): triagem dos itens VIII e IX,
   sincronização com as atividades e condições do roteiro, “não aplicável — atividade não iniciada”
   só para perguntas de registro de operação, e conclusão por atividade e classe no item 14
   (RDC 16/2014, art. 15, I, “c”, e § 4º). Uso: node scripts/e2e/atacadista-xivh.cjs */
const T=require('./lib.cjs');
(async()=>{
 const b=await T.navegador();
 /* card no menu do grupo */
 {const {unpack}=require('../integrated-html.cjs');const {html}=unpack(require('path').join(__dirname,'..','..','index.html'));
  const i=html.indexOf('"grupo-atacadista":'),g=i<0?'':html.slice(i,i+1500);
  if(!/Atacadista — licença inicial \(Formulário XIV\.H\)/.test(g)||!/"trilha=xivh"/.test(g))T.falha('menu: card da licença inicial ausente do grupo Atacadista');}
 /* trilha xivh */
 {const {p,f,erros}=await T.abre('Medicamentos','distribuidoras-transportadoras','Atacadista — licença inicial (Formulário XIV.H)','trilha=xivh',{browser:b,viewport:{width:1100,height:1300}});
  const r=await f.evaluate(async()=>{const o={};
   o.on=xhOn();o.tela0=distTela1View();
   const x=xh();x.ativ=['dist','imp','frac','dep'];x.classes=['01','02','03','15','20'];x.inicial='Sim';xhSync();
   o.acts=state.meta.activities.slice();o.flags=state.meta.flags.slice();o.emAt=state.report.emAtividade;o.tela=distTela1View();
   /* não aplicável em lote: só perguntas de registro */
   const pend=xhRegistroPendentes().length;document.querySelector('body').insertAdjacentHTML('beforeend','<button id="xhna" data-xh-na="1"></button>');document.getElementById('xhna').click();
   const na=Object.entries(state.answers).filter(([k,a])=>a.evidence===XH_NA||a.evidence===XH_NA_AUT).map(([k])=>k);o.pend=pend;o.naFora=na.filter(k=>!XH_REGISTRO.includes(k)&&!XH_AUT.includes(k));o.naQtd=na.length;o.aut=XH_AUT.filter(k=>(state.answers[k]||{}).evidence!==XH_NA_AUT);o.docs=[(state.distDocs.afe||{}).status,(state.distDocs.ae||{}).status];
   o.temSistema=['q343','q157','q199','q368','q319'].filter(k=>(state.answers[k]||{}).evidence===XH_NA);
   /* uso indevido: estrutura marcada como não iniciada */
   state.answers.q343={status:'NA',evidence:XH_NA};o.pIndevido=xhPendencias().filter(t=>/^q343:/.test(t));
   delete state.answers.q343;
   /* matriz e item 14 */
   o.cel=xhCelulas();o.pVazio=xhPendencias().filter(t=>/Item 14: falta a conclusão/.test(t));
   for(const k of o.cel)state.plan.xh[k]='Cumpre as Boas Práticas';
   state.plan.xh['frac|03']='Não cumpre as Boas Práticas';state.plan.xh['frac|15']='Não cumpre as Boas Práticas';state.plan.xh['imp|20']='Cumpre as Boas Práticas com Ação Corretiva';
   o.plan=planView();o.conc=xhConclusao();o.pend2=ddAnexoIPendencias(false).filter(t=>/classificação final|Item 14: falta/.test(t));
   Object.assign(state.meta,{company:'Distribuidora Inicial Ltda',cnpj:'00.025.841/0001-53',address:'Rua A, 1',start:'2026-11-24',end:'2026-11-24'});save();
   const a1=await ddAnexoI({final:false});o.a1=a1.nodes.map(ddNodeText).join('\n');
   return o});
  if(!r.on)T.falha('trilha xivh: modo não ativado');
  if(!/Formulário XIV\.H — atividades e classes declaradas/.test(r.tela0))T.falha('etapa 1: painel do Formulário XIV.H ausente');
  if(/data-array="meta\.activities"/.test(r.tela))T.falha('etapa 1: na trilha xivh, as atividades vêm do Formulário XIV.H, não das caixas antigas');
  for(const a of ['Distribuir','Expedir','Importar','Armazenar'])if(!r.acts.includes(a))T.falha('sincronização: falta a atividade '+a+': '+r.acts);
  if(r.acts.includes('Transportar'))T.falha('sincronização: transporte próprio não marcado');
  for(const fl of ['controlados','insumos','xh_frac','xh_gases'])if(!r.flags.includes(fl))T.falha('sincronização: falta a condição '+fl);
  if(r.emAt!=='Não')T.falha('licença inicial: “estabelecimento em atividade” deveria vir como Não');
  for(const s of ['laboratório de controle da qualidade próprio','classe gases medicinais','Portaria SVS/MS nº 344/1998, art. 2º, § 7º','não cabe no CNAE 4644-3/01','Marcar '])if(!r.tela.includes(s))T.falha('etapa 1: falta “'+s+'”');
  if(!r.pend||r.naQtd!==r.pend)T.falha('não aplicável em lote: marcou '+r.naQtd+' de '+r.pend);
  if(r.aut.length)T.falha('licença inicial: licença, AFE e AE deveriam ir como não aplicáveis, com o motivo próprio: '+r.aut.join(', '));
  if(r.docs.join('|')!=='Não possui|Não possui')T.falha('licença inicial: AFE e AE (com controlados) deveriam vir como “Não possui”: '+r.docs);
  if(r.naFora.length)T.falha('não aplicável em lote: marcou pergunta que não é de registro: '+r.naFora.join(', '));
  if(r.temSistema.length)T.falha('não aplicável em lote: pergunta de sistema marcada: '+r.temSistema.join(', '));
  if(!r.pIndevido.length)T.falha('pendência: “atividade não iniciada” em pergunta de estrutura deveria ser apontada');
  if(r.cel.includes('frac|01')||r.cel.includes('frac|20')||!r.cel.includes('frac|03'))T.falha('matriz: fracionar só com insumos: '+r.cel);
  if(!r.pVazio.length)T.falha('pendência: matriz vazia deveria ser apontada');
  if(r.pend2.length)T.falha('pendências do Anexo I com a matriz preenchida: '+r.pend2.join(' | '));
  if(!/Conclusão por atividade e classe/.test(r.plan)||!/data-xh-cel="dist\|01"/.test(r.plan))T.falha('análise do plano: quadro de conclusão ausente');
  const a1=r.a1;
  for(const s of ['14.1 Cumpre as Boas Práticas ☒','14.3 Cumpre as Boas Práticas com Ação Corretiva ☒','14.4 Não cumpre as Boas Práticas ☒','Fracionar insumo farmacêutico: insumos farmacêuticos, insumos farmacêuticos sujeitos ao controle especial','Importar: gases medicinais','Estabelecimento em atividade: não.','cumpre os requisitos de controle especial da Portaria SVS/MS nº 344/1998 e da Portaria SVS/MS nº 6/1999','(RDC Anvisa nº 16/2014, art. 15, § 4º)','Autorização de Funcionamento: não possui.','a licença sanitária só será deferida após a publicação da AFE (Portaria SMS nº 266/2025, art. 17, § 1º)','Licença inicial: foram verificados'])if(!a1.includes(s))T.falha('Anexo I, item 14: falta “'+s+'”');
  /* módulo de insumos, importação de insumos, fracionamento e laboratório */
  const m=await f.evaluate(async()=>{const o={};const x=xh();
   x.ativ=['dist','arm'];x.classes=['01'];xhSync();o.sem=DATA.sections.filter(s=>s.__xh).map(s=>s.id);dmCartao8();o.card8sem=DIST_CARDS[7][0];
   x.classes=['01','03'];xhSync();o.ins=DATA.sections.filter(s=>s.__xh).map(s=>s.id);
   x.ativ=['dist','arm','imp','frac'];x.classes=['01','03','15'];xhSync();dmCartao8();o.tudo=DATA.sections.filter(s=>s.__xh).map(s=>s.id);o.card8=DIST_CARDS[7].slice();
   const qs=DATA.sections.filter(s=>s.__xh).flatMap(s=>s.questions);o.n=qs.length;o.ids=qs.map(q=>q.id);
   o.mal=qs.filter(q=>!q.legal||!/«evidência» \(/.test(q.ncText||'')||!/\?$/.test(q.text)).map(q=>q.id);
   o.reg=['xi-13','xr-07','xa-08','xo-10','xl-13'].filter(k=>!XH_REGISTRO.includes(k));o.sis=['xl-01','xf-01','xm-02'].filter(k=>XH_REGISTRO.includes(k));
   state.answers['xf-04']={status:'NC',evidence:'ralo na sala de fracionamento de sólidos.'};state.answers['xl-01']={status:'NC',evidence:'análises microbiológicas feitas fora da empresa.'};state.answers['xm-02']={status:'C'};save();
   o.item92=ddPerguntas('9.2').map(z=>z.q.id);o.item121=ddPerguntas('12.1').map(z=>z.q.id);o.item122=ddPerguntas('12.2').map(z=>z.q.id);
   const a1=await ddAnexoI({final:false});o.a1=a1.nodes.map(ddNodeText).join('\n');
   /* citações: abrem o texto no banco de legislação, quando ele carrega */
   o.cit=[];let base=null;try{base=await LegisV12.texto({law:'RDC Anvisa nº 430/2020, art. 14',device:'RDC Anvisa nº 430/2020, art. 14'})}catch(e){}
   if(!base)o.cit=['SEM_REDE'];else for(const q of qs)for(const parte of String(q.legal).split(';').map(s=>s.trim()).filter(z=>z&&!/^Guia CNEN/.test(z))){let a=null;try{a=await LegisV12.texto({law:parte,device:parte})}catch(e){}if(!(a&&a.some(z=>z.exato&&String(z.texto).trim())))o.cit.push(q.id+': '+parte)}
   return o});
  if(m.sem.length)T.falha('módulo de insumos: sem classe 03/15 não deveria haver blocos: '+m.sem);
  if(!/^Controle de qualidade/i.test(m.card8sem))T.falha('etapa 8 sem insumos deveria manter o título original: '+m.card8sem);
  for(const s of ['xh-ins-geral','xh-ins-receb','xh-ins-arm','xh-ins-exp'])if(!m.ins.includes(s))T.falha('módulo de insumos: falta o bloco '+s);
  for(const s of ['xh-ins-imp','xh-frac-area','xh-lab-inst'])if(m.ins.includes(s))T.falha('módulo de insumos: bloco '+s+' sem importar/fracionar marcado');
  for(const s of ['xh-ins-imp','xh-frac-area','xh-frac-op','xh-frac-val','xh-lab-inst','xh-lab-ativ'])if(!m.tudo.includes(s))T.falha('módulo completo: falta o bloco '+s);
  if(!/^Insumos, fracionamento/.test(m.card8[0])||!m.card8[1].includes('xh-frac-op')||!m.card8[1].includes('insumos_gerais'))T.falha('etapa 8: '+JSON.stringify(m.card8));
  if(new Set(m.ids).size!==m.ids.length)T.falha('módulo: ids repetidos');
  if(m.mal.length)T.falha('módulo: pergunta sem citação, sem texto de NC ou sem interrogação: '+m.mal.join(', '));
  if(m.reg.length||m.sis.length)T.falha('módulo: classificação registro/sistema errada: '+m.reg.concat(m.sis).join(', '));
  if(!m.item92.includes('xf-04')||!m.item121.includes('xl-01')||!m.item122.includes('xm-02'))T.falha('módulo: perguntas fora do item do relatório');
  for(const s of ['Há ralo em sala de fracionamento: ralo na sala de fracionamento de sólidos','RDC Anvisa nº 204/2006, Anexo, item 4.3.9','A fracionadora não possui laboratório de controle da qualidade próprio'])if(!m.a1.includes(s))T.falha('Anexo I: falta “'+s+'”');
  if(m.cit[0]==='SEM_REDE')console.log('aviso: banco de legislação inacessível; abertura das citações do módulo não conferida');else if(m.cit.length)T.falha('citações do módulo que não abrem texto ('+m.cit.length+'): '+m.cit.slice(0,12).join(' | '));
  /* controle especial (02/15) e gases medicinais (20) */
  const g=await f.evaluate(async()=>{const o={};const x=xh();
   x.ativ=['dist','trp'];x.classes=['02','20'];xhSync();dmCartao8();o.secs=DATA.sections.filter(s=>s.__xh).map(s=>s.id);o.card8=DIST_CARDS[7][0];
   const qs=DATA.sections.filter(s=>s.__xh).flatMap(s=>s.questions);o.ids=qs.map(q=>q.id);o.legal=Object.fromEntries(qs.map(q=>[q.id,q.legal]));
   o.mal=qs.filter(q=>!q.legal||!/«evidência» \(/.test(q.ncText||'')).map(q=>q.id);o.reg=['xg-notas','xg-lacre','xg-rotulo','xc-09'].filter(k=>!XH_REGISTRO.includes(k));
   x.ativ=['dist'];x.classes=['15'];xhSync();o.so15=DATA.sections.filter(s=>s.__xh).flatMap(s=>s.questions).map(q=>q.id);
   o.cit=[];let base=null;try{base=await LegisV12.texto({law:'RDC Anvisa nº 430/2020, art. 14',device:'RDC Anvisa nº 430/2020, art. 14'})}catch(e){}
   if(!base)o.cit=['SEM_REDE'];else for(const q of qs)for(const parte of String(q.legal).split(';').map(s=>s.trim()).filter(z=>z&&!/^Guia CNEN/.test(z))){let a=null;try{a=await LegisV12.texto({law:parte,device:parte})}catch(e){}if(!(a&&a.some(z=>z.exato&&String(z.texto).trim())))o.cit.push(q.id+': '+parte)}
   return o});
  for(const s of ['xh-ce','xh-gas-reg','xh-gas-areas','xh-gas-rast','xh-gas-transp'])if(!g.secs.includes(s))T.falha('controle especial e gases: falta o bloco '+s);
  for(const s of ['xh-ins-geral','xh-frac-op'])if(g.secs.includes(s))T.falha('classes 02 e 20 não deveriam abrir '+s);
  if(g.card8!=='Controlados e gases')T.falha('etapa 8: título '+g.card8);
  if(g.ids.includes('xc-04')||!g.ids.includes('xc-07'))T.falha('controle especial: xc-04 só com classe 15 e xc-07 só com classe 02');
  if(!g.so15.includes('xc-04')||g.so15.includes('xc-07'))T.falha('controle especial, classe 15: '+g.so15.filter(x=>/^xc-/.test(x)));
  if(!/^RDC Anvisa nº 887\/2024, art\. 9º, § 1º$/.test(g.legal['xg-afe']||''))T.falha('gases: citação da AFE '+g.legal['xg-afe']);
  if(/dispens|prescri/.test(g.ids.join(' ')))T.falha('gases: dispensação fora do Formulário XIV.H');
  if(g.mal.length||g.reg.length)T.falha('controle especial e gases: '+g.mal.concat(g.reg).join(', '));
  if(g.cit[0]!=='SEM_REDE'&&g.cit.length)T.falha('citações de controle especial e gases que não abrem texto ('+g.cit.length+'): '+g.cit.slice(0,12).join(' | '));
  if(erros.length)T.falha('erros na página: '+erros.slice(0,3).join(' | '));
  await p.close()}
 /* item IX: categorias (radiofármacos, hemoderivados, soros e vacinas); painel uma vez só; aviso no outro card */
 {const {p,f,erros}=await T.abre('Medicamentos','distribuidoras-transportadoras','Atacadista — licença inicial (Formulário XIV.H)','trilha=xivh',{browser:b});
  const r=await f.evaluate(async()=>{const o={};const x=xh();x.ativ=['dist','imp','arm'];x.classes=['01','02'];x.cat=['244','145','006','005','013'];xhSync();save();
   o.cat=x.cat.slice();o.tela=distTela1View();o.painel=(o.tela.match(/Formulário XIV\.H — atividades/g)||[]).length;o.equipe=(o.tela.match(/<h4>Equipe inspetora/g)||[]).length;
   o.secs=DATA.sections.filter(s=>s.__xh).map(s=>s.id);dmCartao8();o.card8=DIST_CARDS[7][0];
   const qs=DATA.sections.filter(s=>s.__xh&&/^xh-(radio|bio)/.test(s.id)).flatMap(s=>s.questions);o.ids=qs.map(q=>q.id);
   o.mal=qs.filter(q=>!q.legal||!/«evidência» \(/.test(q.ncText||'')||!/\?$/.test(q.text)).map(q=>q.id);o.reg=['xn-11','xb-04','xb-05'].filter(k=>!XH_REGISTRO.includes(k));
   o.avisos=xhAvisos().join(' ');o.semCat=(x.cat=[],xhPendencias().filter(t=>/categorias da classe/.test(t)).length);x.cat=['244','145','006','005'];xhSync();
   for(const k of xhCelulas())state.plan.xh[k]='Cumpre as Boas Práticas';Object.assign(state.meta,{company:'Distribuidora Inicial Ltda',cnpj:'00.025.841/0001-53',start:'2026-11-24',end:'2026-11-24'});save();
   const a1=await ddAnexoI({final:false});o.a1=a1.nodes.map(ddNodeText).join('\n');
   x.ativ=['dist','arm'];xhSync();o.semImp=DATA.sections.filter(s=>s.__xh).map(s=>s.id);
   o.cit=[];let base=null;try{base=await LegisV12.texto({law:'RDC Anvisa nº 430/2020, art. 14',device:'RDC Anvisa nº 430/2020, art. 14'})}catch(e){}
   if(!base)o.cit=['SEM_REDE'];else for(const q of qs)for(const parte of String(q.legal).split(';').map(s=>s.trim()).filter(z=>z&&!/^Guia CNEN/.test(z))){let a=null;try{a=await LegisV12.texto({law:parte,device:parte})}catch(e){}if(!(a&&a.some(z=>z.exato&&String(z.texto).trim())))o.cit.push(q.id+': '+parte)}
   return o});
  if(r.painel!==1||r.equipe!==1)T.falha('etapa 1: painel do XIV.H ('+r.painel+') e equipe ('+r.equipe+') deveriam aparecer uma vez');
  if(r.cat.includes('013'))T.falha('categorias: código de outra classe não deveria ficar marcado');
  for(const s of ['Categorias da classe 01 (item IX)','244 – Radiofármacos','145 – Soros e vacinas','006 – Hemoderivados','Categorias da classe 02 (item IX)'])if(!r.tela.includes(s))T.falha('etapa 1: falta “'+s+'”');
  for(const s of ['xh-radio','xh-bio-imp'])if(!r.secs.includes(s))T.falha('categorias: falta o bloco '+s);
  if(r.semImp.includes('xh-bio-imp')||!r.semImp.includes('xh-radio'))T.falha('categorias: importação de biológicos só com importar marcado: '+r.semImp);
  for(const k of ['xn-01','xn-06','xn-10','xb-01','xb-02','xb-03'])if(!r.ids.includes(k))T.falha('categorias: falta a pergunta '+k);
  if(r.mal.length||r.reg.length)T.falha('categorias: '+r.mal.concat(r.reg).join(', '));
  if(!/radiofármacos/.test(r.card8))T.falha('etapa 8: título sem radiofármacos: '+r.card8);
  for(const s of ['RDC Anvisa nº 430/2020, art. 6º, parágrafo único','ANSN','marque “Trabalha com termolábeis”'])if(!r.avisos.includes(s))T.falha('avisos: falta “'+s+'”');
  if(r.semCat!==2)T.falha('pendência: classes 01 e 02 sem categoria deveriam ser apontadas ('+r.semCat+')');
  if(!r.a1.includes('Categorias de produto declaradas no Formulário XIV.H, item IX: 244 – radiofármacos; 145 – soros e vacinas; 006 – hemoderivados; 005 – entorpecentes.'))T.falha('Anexo I: categorias do item IX ausentes do item 14');
  if(r.cit[0]==='SEM_REDE')console.log('aviso: banco de legislação inacessível; citações das categorias não conferidas');else if(r.cit.length)T.falha('citações das categorias que não abrem texto: '+r.cit.join(' | '));
  /* o card comum, na mesma inspeção em andamento: aviso, sem o modo XIV.H */
  await p.evaluate(()=>window.__cascaVoltarDireto());await p.waitForTimeout(500);
  await p.evaluate(()=>window.__cascaAbrirRoteiro('Medicamentos','distribuidoras-transportadoras','Atacadista de medicamentos',''));await p.waitForTimeout(4500);
  const g=p.frames().find(x=>x!==p.mainFrame()),c=await g.evaluate(()=>{const t=distTela1View();return {on:xhOn(),aviso:/Inspeção começada no card “Atacadista — licença inicial/.test(t),equipe:(t.match(/<h4>Equipe inspetora/g)||[]).length,xh:DATA.sections.filter(s=>s.__xh).length}});
  if(c.on||!c.aviso||c.equipe!==1||c.xh)T.falha('card comum com inspeção do XIV.H: '+JSON.stringify(c));
  if(erros.length)T.falha('erros na página: '+erros.slice(0,3).join(' | '));
  await p.close()}
 /* card comum: sem o painel do XIV.H numa inspeção nova */
 {const {p,f}=await T.abre('Medicamentos','distribuidoras-transportadoras','Atacadista de medicamentos','',{browser:b});
  const r=await f.evaluate(()=>{state=blank();save();return {on:xhOn(),tela:distTela1View(),conc:xhConclusao()}});
  if(r.on||/Formulário XIV\.H — atividades/.test(r.tela)||r.conc)T.falha('card comum: não deveria mostrar o Formulário XIV.H');
  await p.close()}
 await b.close();
 console.log(process.exitCode?'atacadista-xivh: FALHOU':'atacadista-xivh: OK');
})();
