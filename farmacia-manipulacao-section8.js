/* Farmácia de Manipulação — Seção 8: Monitoramento do Processo Magistral e da Água.
 * OCR extrai dados; a equipe confere e define C/NC/NA. Laudos podem ser agrupados por evento de coleta.
 */
(() => {
  'use strict';
  const FM=window.FarmaciaManipulacao;
  if(!FM || window.FarmaciaManipulacaoSection8) return;
  const {field,textarea,select,question,localApplicability,esc,uid}=FM.ui;
  const photo=(s,id)=>`<button type="button" data-fm-photo="${esc(s)}|${esc(id)}">📷</button>`;
  const copyButton=()=>'<button type="button" class="primary" data-fm-copy-section="8">📋 Copiar texto desta seção</button>';

  const CONFIG={
    '8.1':{title:'Água Purificada',period:'Mensal',requirement:'Solicitar, no mínimo, as duas últimas análises/eventos de coleta para avaliação da periodicidade.',water:true},
    '8.2':{title:'Água Potável',period:'Semestral',requirement:'Solicitar, no mínimo, as duas últimas análises/eventos de coleta para avaliação da periodicidade.',water:true},
    '8.3':{title:'Pureza microbiológica de base galênica',period:'Mensal',requirement:'Monitoramento mensal.'},
    '8.4':{title:'Teor e uniformidade de fármaco ≤ 25 mg',period:'Bimestral',requirement:'Fármacos em quantidade igual ou inferior a 25 mg; prioridade para ≤ 5 mg.'},
    '8.5':{title:'Teor de diluído preparado',period:'Trimestral',requirement:'Monitoramento trimestral; preservar resultados de diferentes pontos de amostragem quando constarem.'},
    '8.6':{title:'Teor e uniformidade de substâncias sensibilizantes — rodízio',period:'Trimestral',requirement:'Monitoramento trimestral em sistema de rodízio.'}
  };

  function secState(s){ return FM.ensureSection(FM.getState(),s); }
  function reports(s){ return (secState(s).records||[]).filter(r=>r.record_type==='lab_report'); }
  function normalize(v){ return String(v||'').trim().toLowerCase().replace(/\s+/g,' '); }
  function eventKey(r){
    if(r.sampling_event) return r.sampling_event;
    const dt=(r.collection_datetime||'').slice(0,16);
    const point=normalize(r.sample_point);
    return dt && point ? `${dt}|${point}` : (dt||point||'');
  }
  function eventDates(s){
    const seen=new Map();
    reports(s).forEach(r=>{const k=eventKey(r); if(!k) return; const d=(r.collection_datetime||'').slice(0,10); if(d&&!seen.has(k)) seen.set(k,d);});
    return [...seen.values()].filter(Boolean).sort();
  }
  function intervals(s){
    const ds=eventDates(s).map(x=>new Date(x+'T00:00:00'));
    const out=[]; for(let i=1;i<ds.length;i++) out.push(Math.round((ds[i]-ds[i-1])/86400000));
    return out;
  }
  function summary(s){
    const rs=reports(s), keys=new Set(rs.map(eventKey).filter(Boolean)), ints=intervals(s);
    return `<div class="box"><h4>Resumo cronológico</h4><p><strong>Laudos cadastrados:</strong> ${rs.length} · <strong>Eventos de coleta identificados:</strong> ${keys.size}</p>${ints.length?`<p><strong>Intervalos entre eventos:</strong> ${ints.join(' / ')} dia(s). <span class="muted">Informação auxiliar; não gera NC automaticamente.</span></p>`:'<p class="muted">Cadastre ao menos duas coletas para visualizar o intervalo.</p>'}</div>`;
  }

  function recordInput(s,r,key,label,type='text',attrs=''){
    return `<label class="field"><span>${esc(label)}</span><input type="${esc(type)}" data-fm-monitor-field="${esc(s)}|${esc(r.id)}|${esc(key)}" value="${esc(r[key]??'')}" ${attrs}></label>`;
  }
  function recordTextarea(s,r,key,label,rows=3){
    return `<label class="field"><span>${esc(label)}</span><textarea rows="${rows}" data-fm-monitor-field="${esc(s)}|${esc(r.id)}|${esc(key)}">${esc(r[key]??'')}</textarea></label>`;
  }
  function recordSelect(s,r,key,label,opts){
    const v=String(r[key]??'');
    return `<label class="field"><span>${esc(label)}</span><select data-fm-monitor-field="${esc(s)}|${esc(r.id)}|${esc(key)}">${opts.map(o=>{const x=Array.isArray(o)?o:[o,o];return `<option value="${esc(x[0])}"${v===String(x[0])?' selected':''}>${esc(x[1])}</option>`;}).join('')}</select></label>`;
  }

  function reportCard(s,r,cfg){
    const derived=eventKey(r);
    return `<article class="box fm-monitor-record" data-fm-monitor-record="${esc(r.id)}"><div class="subbar"><strong>Relatório / certificado</strong><button type="button" data-fm-monitor-remove="${esc(s)}|${esc(r.id)}">Remover</button></div>
      <div class="grid">${recordInput(s,r,'report_no','Relatório / certificado nº')}${recordInput(s,r,'revision','Revisão')}${recordSelect(s,r,'analysis_profile','Perfil do laudo',[['','Selecione'],['fisico_quimico','Físico-químico'],['microbiologico','Microbiológico'],['completo','Completo'],['outro','Outro']])}${recordInput(s,r,'laboratory','Laboratório emissor')}</div>
      <div class="grid">${recordInput(s,r,'lab_cnpj','CNPJ do laboratório')}${recordInput(s,r,'sample','Produto / amostra')}${recordInput(s,r,'sample_code','Código da amostra')}${recordInput(s,r,'lot','Lote')}</div>
      <div class="grid">${recordInput(s,r,'manufacturer','Fabricante, quando constar')}${recordInput(s,r,'collection_datetime','Data/hora da coleta','datetime-local')}${recordInput(s,r,'reception_date','Recebimento','date')}${recordInput(s,r,'issue_date','Emissão do laudo','date')}</div>
      ${cfg.water?`<div class="grid">${recordInput(s,r,'sample_point','Ponto de coleta / origem')}${recordInput(s,r,'collector','Responsável pela coleta')}${recordInput(s,r,'reception_temperature','Temperatura no recebimento (°C)')}${recordInput(s,r,'sample_quantity','Quantidade / embalagem da amostra')}</div>`:`<div class="grid">${recordInput(s,r,'validity','Validade da amostra/insumo, quando constar','date')}${recordInput(s,r,'sample_point','Ponto / local / condição de amostragem')}</div>`}
      ${recordInput(s,r,'sampling_event','Identificador do evento de amostragem (opcional — para agrupar laudos da mesma coleta)')}
      ${derived?`<p class="muted"><strong>Evento usado no agrupamento:</strong> ${esc(derived)}. Laudos físico-químico e microbiológico da mesma coleta devem compartilhar este evento.</p>`:''}
      ${recordTextarea(s,r,'parameters','Ensaios / parâmetros — preservar Resultado | Unidade | Limite/Especificação | LQ | Método | Data',5)}
      <p class="muted">Preservar literalmente sinais e textos como “&lt;1,0”, “Ausente”, “-” e “Não consta”; não convertê-los em zero ou campo vazio.</p>
      ${recordTextarea(s,r,'conclusion_text','Conclusão / interpretação textual do laboratório',2)}
      ${recordSelect(s,r,'inspection_status','Situação definida pela equipe',[['','Não avaliado'],['c','Conforme'],['nc','Não conforme'],['na','Não se aplica']])}
      ${recordTextarea(s,r,'inspection_notes','Anotações da equipe',2)}
      <div class="actions"><button type="button" data-fm-monitor-ocr="${esc(s)}|${esc(r.id)}">📄 Ler laudo com OCR</button>${photo(s,'laudo_'+r.id)}</div>
    </article>`;
  }

  function mainHeader(s,cfg){
    return `<div class="subbar"><span class="badge">${esc(s)} · Monitoramento</span><button type="button" data-fm-open-section="8">Monitoramento</button><button type="button" data-fm-home>Todos</button></div><h2>${esc(s)} ${esc(cfg.title)}</h2><div class="fm-requirement"><strong>Periodicidade informada no roteiro:</strong> ${esc(cfg.period)}. ${esc(cfg.requirement)}</div>`;
  }

  function renderProfile(s){
    const cfg=CONFIG[s], sec=secState(s);
    return `<div class="panel fm-panel">${mainHeader(s,cfg)}${localApplicability(s,'Não se aplica a esta inspeção')}${sec.applicable===false?'<p class="muted">Subseção marcada como não aplicável.</p>':`
      <section class="box"><h3>Laboratório terceirizado / referência</h3><div class="grid">${field(s,'lab_name','Laboratório')}${field(s,'lab_cnpj','CNPJ')}${select(s,'lab_regular','Licenciado / situação conferida?',[['','Selecione'],['c','Conforme'],['nc','Não conforme'],['na','Não se aplica']])}</div><p class="muted">A situação do laboratório é marcada pela equipe; o OCR não decide regularidade.</p></section>
      ${summary(s)}
      <div class="actions"><button type="button" class="primary" data-fm-monitor-add="${esc(s)}">+ Adicionar laudo</button>${copyButton()}</div>
      <div class="fm-monitor-list">${reports(s).map(r=>reportCard(s,r,cfg)).join('')||'<p class="muted">Nenhum laudo cadastrado nesta subseção.</p>'}</div>
      <section class="box"><h3>Verificação da periodicidade e resposta ao resultado</h3>
        ${question(s,'periodicity_reviewed','A periodicidade foi avaliada pela equipe a partir das datas de coleta/eventos de amostragem?',{nsa:false,requirement:cfg.period})}
        ${question(s,'unsatisfactory_actions','Quando houve resultado insatisfatório, existem registros das medidas adotadas e da avaliação subsequente?',{nsa:true})}
      </section>`}${copyButton()}</div>`;
  }

  function render8(){
    const cards=Object.entries(CONFIG).map(([id,cfg])=>`<button class="card-button" type="button" data-fm-open-subsection="${id}"><span class="number">${id}</span><span><strong>${esc(cfg.title)}</strong><small>${esc(cfg.period)}</small></span></button>`).join('');
    return `<div class="panel fm-panel"><div class="subbar"><span class="badge">8 · Monitoramento</span><button type="button" data-fm-home>Todos</button></div><h2>8 Monitoramento do Processo Magistral e da Água</h2><p>Os laudos são lidos para extrair dados, não para produzir julgamento sanitário. Para avaliação de periodicidade, considerar o evento/data de coleta, evitando contar como dois períodos laudos físico-químico e microbiológico referentes à mesma coleta.</p><div class="cards fm-section-cards">${cards}<button class="card-button" type="button" data-fm-open-subsection="8.7"><span class="number">8.7</span><span><strong>Água — verificações complementares</strong><small>Checklist</small></span></button></div>${copyButton()}</div>`;
  }

  function render87(){
    const s='8.7', sec=secState(s);
    const body=`<section class="box"><h3>Água — verificações complementares</h3>
      ${question(s,'sampling_pop','Há POP/procedimento de amostragem e periodicidade das análises de água potável e purificada?',{nsa:false})}
      ${question(s,'purified_storage_point','Um dos pontos de amostragem da água purificada corresponde ao local utilizado para armazenamento?',{nsa:true})}
      ${question(s,'potable_parameters','A análise de água potável contempla os parâmetros requeridos?',{nsa:false,requirement:'pH, cor aparente, turbidez, cloro residual livre, sólidos totais dissolvidos, contagem total de bactérias, coliformes totais, E. coli e coliformes termorresistentes.'})}
      ${question(s,'potable_unsatisfactory_actions','Em caso de laudo insatisfatório de água potável, há registro das medidas adotadas?',{nsa:true})}
      ${question(s,'purified_unsatisfactory_retest','Em caso de laudo insatisfatório de água purificada, as medidas são registradas e a efetividade é avaliada por nova análise?',{nsa:true})}
      ${textarea(s,'notes_general','Observações complementares',3)}${photo(s,'verificacoes_agua')}
    </section>`;
    return `<div class="panel fm-panel"><div class="subbar"><span class="badge">8.7 · Monitoramento</span><button type="button" data-fm-open-section="8">Monitoramento</button><button type="button" data-fm-home>Todos</button></div><h2>8.7 Água — verificações complementares</h2>${localApplicability(s,'Não se aplica a esta inspeção')}${sec.applicable===false?'<p class="muted">Subseção marcada como não aplicável.</p>':body}${copyButton()}</div>`;
  }

  document.addEventListener('click',e=>{
    const sub=e.target.closest('[data-fm-open-subsection]');
    if(sub){FM.setActive('8',sub.dataset.fmOpenSubsection||'');return;}
    const add=e.target.closest('[data-fm-monitor-add]');
    if(add){const s=add.dataset.fmMonitorAdd;FM.mutate(st=>{const sec=FM.ensureSection(st,s);sec.records.push({id:uid('laudo'),record_type:'lab_report',created_at:new Date().toISOString(),analysis_profile:'',inspection_status:''});});return;}
    const rem=e.target.closest('[data-fm-monitor-remove]');
    if(rem){const [s,id]=(rem.dataset.fmMonitorRemove||'').split('|');FM.mutate(st=>{const sec=FM.ensureSection(st,s);sec.records=(sec.records||[]).filter(r=>r.id!==id);});return;}
    const ocr=e.target.closest('[data-fm-monitor-ocr]');
    if(ocr){const [s,id]=(ocr.dataset.fmMonitorOcr||'').split('|');window.dispatchEvent(new CustomEvent('farmacia-manipulacao:document-requested',{detail:{section:s,kind:'laudo_monitoramento',recordId:id,profile:s}}));return;}
    const copy=e.target.closest('[data-fm-copy-section]');
    if(copy) window.dispatchEvent(new CustomEvent('farmacia-manipulacao:copy-section',{detail:{section:'8'}}));
  });

  document.addEventListener('input',e=>{
    const el=e.target.closest('[data-fm-monitor-field]'); if(!el) return;
    const [s,id,key]=(el.dataset.fmMonitorField||'').split('|');
    FM.mutate(st=>{const sec=FM.ensureSection(st,s),r=(sec.records||[]).find(x=>x.id===id);if(r)r[key]=el.value;},{render:false});
  });
  document.addEventListener('change',e=>{
    const el=e.target.closest('[data-fm-monitor-field]'); if(!el) return;
    const [s,id,key]=(el.dataset.fmMonitorField||'').split('|');
    FM.mutate(st=>{const sec=FM.ensureSection(st,s),r=(sec.records||[]).find(x=>x.id===id);if(r)r[key]=el.value;});
  });

  FM.registerRenderer('8',render8);
  Object.keys(CONFIG).forEach(s=>FM.registerRenderer(s,()=>renderProfile(s)));
  FM.registerRenderer('8.7',render87);
  window.FarmaciaManipulacaoSection8={render8,renderProfile,render87};
  FM.render();
})();
