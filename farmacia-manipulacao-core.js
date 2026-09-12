/* Farmácia de Manipulação — núcleo funcional.
 * Implementação isolada do módulo. Não altera Drogaria nem demais núcleos.
 * Regras centrais:
 * - aplicabilidade é local; nenhuma seção é omitida por resposta externa;
 * - OCR apenas propõe dados, nunca conclui conformidade;
 * - foto/anotação não criam NC;
 * - conclusão sanitária é sempre escolhida pela autoridade sanitária.
 */
(() => {
  'use strict';
  if (window.FarmaciaManipulacao) return;

  const STORAGE_KEY = 'inspecao_farmacia_manipulacao_v1';
  const VERSION = '0.1.0';
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean = v => String(v == null ? '' : v).trim();
  const uid = prefix => (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
  const clone = obj => typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));

  const SECTION_DEFS = [
    ['1','Identificação do Estabelecimento e Informações Gerais'],
    ['2','Edificações e Instalações'],
    ['3','Pessoal, Saúde Ocupacional e Treinamento'],
    ['4','Áreas Físicas'],
    ['5','Laboratórios'],
    ['6','Laboratórios de Sensibilizantes'],
    ['7','Documentos Apresentados'],
    ['8','Monitoramento do Processo Magistral e da Água'],
    ['9','Rastreabilidade e Controle de Qualidade']
  ];

  const SUBSECTIONS = {
    '4': [
      ['4.1','Recepção e área de vendas (dispensação)'],
      ['4.2','Dispensação de industrializados / drogaria'],
      ['4.3','Sala de prestação de serviços farmacêuticos'],
      ['4.4','Área ou local de conferência'],
      ['4.5','DML, Sanitários e Paramentação']
    ],
    '5': [
      ['5.1','Almoxarifado de matérias-primas e/ou materiais de embalagem'],
      ['5.2','Controle de Qualidade (CQ)'],
      ['5.3','Laboratório de Semissólidos e Líquidos'],
      ['5.4','Laboratório de Sólidos'],
      ['5.5','Lavagem de utensílios e materiais de embalagem'],
      ['5.6','Laboratório de Homeopatia'],
      ['5.7','Substâncias de Baixo Índice Terapêutico (SBIT)']
    ],
    '6': [
      ['6.1','Requisitos gerais dos laboratórios de sensibilizantes'],
      ['6.2','Cabine de Hormônios'],
      ['6.3','Cabine de Antibióticos'],
      ['6.4','Cabine de Citostáticos'],
      ['6.5','Cabine de Penicilínicos']
    ],
    '7': [
      ['7.1','Procedimentos Operacionais Padronizados (POPs)'],
      ['7.2','Qualificação e Manutenção do Sistema de Exaustão']
    ],
    '8': [
      ['8.1','Água Purificada — mensal'],
      ['8.2','Água Potável — semestral'],
      ['8.3','Pureza microbiológica de base galênica — mensal'],
      ['8.4','Teor e uniformidade de fármaco ≤ 25 mg — bimestral'],
      ['8.5','Teor de diluído preparado — trimestral'],
      ['8.6','Teor e uniformidade de sensibilizantes — trimestral / rodízio'],
      ['8.7','Água — verificações complementares']
    ],
    '9': [
      ['9.1','Avaliação da prescrição'],
      ['9.2.1','Rastreabilidade — formulação sólida'],
      ['9.2.2','Rastreabilidade — formulação semissólida'],
      ['9.2.3','Rastreabilidade — formulação líquida'],
      ['9.3','Controle de Qualidade de Matéria-Prima Vegetal'],
      ['9.4','Controle de Qualidade de Matéria-Prima Homeopática'],
      ['9.5','Confronto estoque físico × escriturado — Portaria 344/98'],
      ['9.6','Conservação, Transporte e Dispensação']
    ]
  };

  const DEFAULT_STATE = () => ({
    schema: 1,
    version: VERSION,
    updated_at: new Date().toISOString(),
    active_section: '1',
    active_subsection: '',
    fields: {},
    sections: {},
    documents: [],
    ocr_reviews: [],
    photos: [],
    occurrences: [],
    pending_documents: [],
    conclusion: {
      classification: '',
      risk_assessment: '',
      orientations: '',
      measures: [],
      inspectors: []
    }
  });

  function ensureSection(state, key) {
    return state.sections[key] ||= {
      applicable: true,
      answers: {},
      fields: {},
      notes: {},
      photos: [],
      documents: [],
      refrigerators: [],
      instruments: [],
      records: []
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_STATE();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return DEFAULT_STATE();
      return Object.assign(DEFAULT_STATE(), parsed, {updated_at: parsed.updated_at || new Date().toISOString()});
    } catch (_) {
      return DEFAULT_STATE();
    }
  }

  let state = load();

  function persist() {
    state.updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('farmacia-manipulacao:state', {detail: clone(state)}));
  }

  function getState() { return clone(state); }
  function setState(next, opts={}) {
    state = clone(next || DEFAULT_STATE());
    persist();
    if (opts.render !== false) render();
  }
  function mutate(fn, opts={}) {
    const draft = clone(state);
    fn(draft);
    state = draft;
    persist();
    if (opts.render !== false) render();
    return getState();
  }

  function setActive(section, subsection='') {
    mutate(s => { s.active_section=String(section); s.active_subsection=String(subsection||''); });
  }

  function setApplicable(key, applicable) {
    mutate(s => { ensureSection(s,key).applicable=!!applicable; });
  }

  function setAnswer(key, id, value) {
    mutate(s => { ensureSection(s,key).answers[id]=value; });
  }

  function setField(key, id, value, opts={}) {
    mutate(s => { ensureSection(s,key).fields[id]=value; }, opts);
  }

  function setNote(key, id, value) {
    mutate(s => { ensureSection(s,key).notes[id]=value; }, {render:false});
  }

  function addPhoto(key, meta={}) {
    const photo={id:uid('photo'), section:key, created_at:new Date().toISOString(), ...meta};
    mutate(s=>{ ensureSection(s,key).photos.push(photo); s.photos.push(photo); });
    return photo;
  }

  function addDocument(doc={}) {
    const item={id:uid('doc'), kind:'generic', title:'Documento', status:'review', source:'manual', fields:{}, created_at:new Date().toISOString(), ...doc};
    mutate(s=>s.documents.push(item));
    return item;
  }

  function addOCRReview(review={}) {
    const item={id:uid('ocr'), kind:'generic', status:'pending', proposed:{}, accepted:{}, created_at:new Date().toISOString(), ...review};
    mutate(s=>s.ocr_reviews.push(item));
    return item;
  }

  function acceptOCR(id, acceptedFields) {
    mutate(s=>{
      const r=s.ocr_reviews.find(x=>x.id===id);
      if(!r) return;
      r.accepted=clone(acceptedFields||r.proposed||{});
      r.status='accepted';
      r.accepted_at=new Date().toISOString();
    });
  }

  function occurrenceKey(section, item) { return `${section}::${item}`; }
  function upsertOccurrence(section, item, payload={}) {
    mutate(s=>{
      const key=occurrenceKey(section,item);
      let o=s.occurrences.find(x=>x.key===key);
      if(!o){ o={id:uid('occ'),key,section,item,status:'open',created_at:new Date().toISOString()}; s.occurrences.push(o); }
      Object.assign(o,payload,{updated_at:new Date().toISOString()});
    });
  }

  function removeOccurrence(section,item){
    mutate(s=>{const key=occurrenceKey(section,item);s.occurrences=s.occurrences.filter(x=>x.key!==key);});
  }

  function answerButtons(section,id,{nsa=true,labels={}}={}) {
    const value=ensureSection(state,section).answers[id]||'';
    const vals=['c','nc'].concat(nsa?['na']:[]);
    const lab={c:'Conforme',nc:'Não conforme',na:'Não se aplica',...labels};
    return `<div class="answers fm-answers">${vals.map(v=>`<button type="button" data-fm-answer="${esc(section)}|${esc(id)}|${v}" aria-pressed="${value===v}">${esc(lab[v])}</button>`).join('')}</div>`;
  }

  function question(section,id,label,opts={}) {
    const sec=ensureSection(state,section);
    const note=sec.notes[id]||'';
    const req=opts.requirement?`<p class="fm-requirement"><strong>Parâmetro / requisito:</strong> ${esc(opts.requirement)}</p>`:'';
    return `<div class="q fm-question" data-fm-question="${esc(section)}|${esc(id)}"><b class="q-title">${esc(label)}</b>${req}${answerButtons(section,id,{nsa:opts.nsa!==false})}<div class="fm-q-actions"><button type="button" data-fm-photo="${esc(section)}|${esc(id)}" title="Fotografar">📷</button></div><label class="field"><span>Anotações</span><textarea rows="2" data-fm-note="${esc(section)}|${esc(id)}">${esc(note)}</textarea></label></div>`;
  }

  function field(section,id,label,type='text',attrs='') {
    const value=ensureSection(state,section).fields[id]??'';
    return `<label class="field"><span>${esc(label)}</span><input type="${esc(type)}" data-fm-field="${esc(section)}|${esc(id)}" value="${esc(value)}" ${attrs}></label>`;
  }

  function textarea(section,id,label,rows=3) {
    const value=ensureSection(state,section).fields[id]??'';
    return `<label class="field"><span>${esc(label)}</span><textarea rows="${rows}" data-fm-field="${esc(section)}|${esc(id)}">${esc(value)}</textarea></label>`;
  }

  function select(section,id,label,options=[]) {
    const value=ensureSection(state,section).fields[id]??'';
    return `<label class="field"><span>${esc(label)}</span><select data-fm-field="${esc(section)}|${esc(id)}">${options.map(o=>{const v=Array.isArray(o)?o[0]:o,t=Array.isArray(o)?o[1]:o;return `<option value="${esc(v)}"${String(value)===String(v)?' selected':''}>${esc(t)}</option>`;}).join('')}</select></label>`;
  }

  function localApplicability(section,label='Não se aplica a esta inspeção') {
    const sec=ensureSection(state,section);
    return `<div class="fm-applicability"><label class="check"><input type="checkbox" data-fm-nsa="${esc(section)}"${sec.applicable===false?' checked':''}><span>${esc(label)}</span></label>${sec.applicable===false?'<p class="muted">Conteúdo recolhido. A seção permanece disponível e pode ser reativada a qualquer momento.</p>':''}</div>`;
  }

  function refrigeratorCard(section) {
    const sec=ensureSection(state,section);
    const has=sec.fields.has_refrigerator||'';
    let body=`<div class="fm-refrigerator box"><h4>Refrigerador</h4>${select(section,'has_refrigerator','Possui refrigerador neste ambiente?',[['','Selecione'],['nao','Não'],['sim','Sim']])}`;
    if(has==='sim'){
      body+=`<div class="grid">${field(section,'refrigerator_id','Identificação do refrigerador')}${field(section,'refrigerator_use','Uso / finalidade')}${field(section,'refrigerator_range_min','Faixa adotada — mínima (°C)','number','step="0.1"')}${field(section,'refrigerator_range_max','Faixa adotada — máxima (°C)','number','step="0.1"')}</div>`;
      body+=question(section,'refrigerator_organization','O refrigerador está organizado e os itens estão identificados/segregados?');
      body+=question(section,'refrigerator_cleaning','O refrigerador apresenta condições adequadas de limpeza e higienização?');
      body+=question(section,'refrigerator_records','Há registros de monitoramento de temperatura e, quando necessário, ações corretivas?');
      body+=`<div class="grid three">${field(section,'refrigerator_temp_now','Temperatura no momento (°C)','number','step="0.1"')}${field(section,'refrigerator_temp_max','Máxima (°C)','number','step="0.1"')}${field(section,'refrigerator_temp_min','Mínima (°C)','number','step="0.1"')}</div>`;
      body+=`<div class="grid">${field(section,'refrigerator_instrument','Termômetro / registrador')}${field(section,'refrigerator_instrument_id','Identificação do instrumento')}${field(section,'refrigerator_cal_cert','Certificado de calibração nº')}${field(section,'refrigerator_cal_validity','Validade da calibração','date')}</div>`;
      body+=textarea(section,'refrigerator_corrective_action','Ação corretiva / observações',3);
      body+=`<button type="button" data-fm-photo="${esc(section)}|refrigerator">📷 Fotografar</button>`;
    }
    return body+'</div>';
  }

  function pressureCard(section) {
    return `<div class="box fm-pressure"><h4>Diferencial de pressão</h4><p class="fm-requirement"><strong>Parâmetro operacional informado:</strong> -5 a -120 Pa. Este intervalo não será atribuído automaticamente à RDC sem fonte normativa correspondente.</p><div class="grid">${field(section,'pressure_value','Valor aferido (Pa)','number','step="0.1"')}${field(section,'pressure_instrument','Instrumento utilizado')}${field(section,'pressure_instrument_id','Identificação do instrumento')}${field(section,'pressure_cal_cert','Certificado de calibração nº')}${field(section,'pressure_cal_validity','Validade da calibração','date')}</div>${question(section,'pressure_status','O diferencial de pressão foi avaliado pela equipe conforme o parâmetro aplicável?',{requirement:'Pressão negativa; referência operacional informada: -5 a -120 Pa'})}</div>`;
  }

  function sectionHub() {
    return `<div class="panel fm-panel"><h2>Farmácia de Manipulação</h2><p class="muted">Roteiro estruturado para inspeção, documentos, monitoramento, rastreabilidade e relatório.</p><div class="cards fm-section-cards">${SECTION_DEFS.map(([id,title])=>`<button class="card-button" type="button" data-fm-open-section="${id}"><span class="number">${id}</span><span><strong>${esc(title)}</strong><small>${SUBSECTIONS[id]?.length?SUBSECTIONS[id].length+' subseções':'Abrir seção'}</small></span></button>`).join('')}</div></div>`;
  }

  function subsectionHub(section) {
    const def=SECTION_DEFS.find(x=>x[0]===section);
    const subs=SUBSECTIONS[section]||[];
    return `<div class="panel fm-panel"><div class="subbar"><span class="badge">Seção ${esc(section)} de 9</span><button type="button" data-fm-home>Todos</button></div><h2>${esc(def?.[1]||'')}</h2><div class="cards fm-subsection-cards">${subs.map(([id,title])=>`<button class="card-button" type="button" data-fm-open-subsection="${esc(section)}|${esc(id)}"><span class="number">${esc(id)}</span><span><strong>${esc(title)}</strong></span></button>`).join('')}</div></div>`;
  }

  const renderers={};
  function registerRenderer(key,fn){ renderers[key]=fn; }

  function render() {
    const root=document.querySelector('[data-farmacia-manipulacao-root]') || document.getElementById('farmacia-manipulacao-root');
    if(!root) return false;
    const section=state.active_section||'1', sub=state.active_subsection||'';
    let html='';
    if(section==='home') html=sectionHub();
    else if(sub && renderers[sub]) html=renderers[sub](getState());
    else if(renderers[section]) html=renderers[section](getState());
    else if(SUBSECTIONS[section]?.length) html=subsectionHub(section);
    else html=`<div class="panel"><p class="muted">Seção ${esc(section)} ainda não carregada.</p></div>`;
    root.innerHTML=html;
    return true;
  }

  document.addEventListener('click', e=>{
    const s=e.target.closest('[data-fm-open-section]'); if(s){setActive(s.dataset.fmOpenSection);return;}
    const ss=e.target.closest('[data-fm-open-subsection]'); if(ss){const [sec,sub]=ss.dataset.fmOpenSubsection.split('|');setActive(sec,sub);return;}
    if(e.target.closest('[data-fm-home]')){setActive('home','');return;}
    const a=e.target.closest('[data-fm-answer]'); if(a){const [sec,id,val]=a.dataset.fmAnswer.split('|');setAnswer(sec,id,val); if(val==='nc')upsertOccurrence(sec,id,{finding:ensureSection(state,sec).notes[id]||''}); else removeOccurrence(sec,id);return;}
    const nsa=e.target.closest('[data-fm-nsa]'); if(nsa){setApplicable(nsa.dataset.fmNsa,!nsa.checked);return;}
    const p=e.target.closest('[data-fm-photo]'); if(p){const [sec,item]=p.dataset.fmPhoto.split('|');window.dispatchEvent(new CustomEvent('farmacia-manipulacao:photo-request',{detail:{section:sec,item}}));return;}
  });

  document.addEventListener('input', e=>{
    if(e.target.matches('[data-fm-note]')){const [sec,id]=e.target.dataset.fmNote.split('|');setNote(sec,id,e.target.value);const key=occurrenceKey(sec,id);const o=state.occurrences.find(x=>x.key===key);if(o){o.finding=e.target.value;persist();}return;}
    if(e.target.matches('[data-fm-field]')){const [sec,id]=e.target.dataset.fmField.split('|');setField(sec,id,e.target.value,{render:false});return;}
  });
  document.addEventListener('change', e=>{
    if(e.target.matches('select[data-fm-field]')){const [sec,id]=e.target.dataset.fmField.split('|');setField(sec,id,e.target.value);}
  });

  window.FarmaciaManipulacao={
    VERSION, STORAGE_KEY, SECTION_DEFS, SUBSECTIONS,
    getState,setState,mutate,render,setActive,setApplicable,setAnswer,setField,setNote,
    addPhoto,addDocument,addOCRReview,acceptOCR,upsertOccurrence,removeOccurrence,
    registerRenderer,ensureSection,
    ui:{esc,clean,uid,question,field,textarea,select,localApplicability,refrigeratorCard,pressureCard,sectionHub,subsectionHub}
  };

  window.addEventListener('DOMContentLoaded',()=>render(),{once:true});
})();
