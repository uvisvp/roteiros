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
   const na=Object.entries(state.answers).filter(([k,a])=>a.evidence===XH_NA).map(([k])=>k);o.pend=pend;o.naFora=na.filter(k=>!XH_REGISTRO.includes(k));o.naQtd=na.length;
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
  if(r.naFora.length)T.falha('não aplicável em lote: marcou pergunta que não é de registro: '+r.naFora.join(', '));
  if(r.temSistema.length)T.falha('não aplicável em lote: pergunta de sistema marcada: '+r.temSistema.join(', '));
  if(!r.pIndevido.length)T.falha('pendência: “atividade não iniciada” em pergunta de estrutura deveria ser apontada');
  if(r.cel.includes('frac|01')||r.cel.includes('frac|20')||!r.cel.includes('frac|03'))T.falha('matriz: fracionar só com insumos: '+r.cel);
  if(!r.pVazio.length)T.falha('pendência: matriz vazia deveria ser apontada');
  if(r.pend2.length)T.falha('pendências do Anexo I com a matriz preenchida: '+r.pend2.join(' | '));
  if(!/Conclusão por atividade e classe/.test(r.plan)||!/data-xh-cel="dist\|01"/.test(r.plan))T.falha('análise do plano: quadro de conclusão ausente');
  const a1=r.a1;
  for(const s of ['14.1 Cumpre as Boas Práticas ☒','14.3 Cumpre as Boas Práticas com Ação Corretiva ☒','14.4 Não cumpre as Boas Práticas ☒','Fracionar insumo farmacêutico: insumos farmacêuticos, insumos farmacêuticos sujeitos ao controle especial','Importar: gases medicinais','Estabelecimento em atividade: não.','cumpre os requisitos de controle especial da Portaria SVS/MS nº 344/1998 e da Portaria SVS/MS nº 6/1999','(RDC Anvisa nº 16/2014, art. 15, § 4º)','Licença inicial: foram verificados'])if(!a1.includes(s))T.falha('Anexo I, item 14: falta “'+s+'”');
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
