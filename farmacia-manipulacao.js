(() => {
  'use strict';

  const VERSION = '0.1.0';
  const STORAGE_KEY = 'uvisvp.farmaciaManipulacao.v1';
  const DB_NAME = 'uvisvp-farmacia-manipulacao';
  const DB_STORE = 'attachments';

  const deepClone = (v) => JSON.parse(JSON.stringify(v));
  const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  const DEFAULT_STATE = {
    meta: { version: VERSION, updatedAt: null },
    section1: {
      inspection: { objective: '', protocols: '', date: '', team: '', contacts: '' },
      establishment: { reason: '', fantasy: '', cnpj: '', ie: '', address: '', phone: '', email: '' },
      legal: { name: '', cpf: '' },
      technical: { principal: { name: '', crf: '', uf: '', schedule: '' }, substitutes: [] },
      license: { number: '', validity: '', holder: '', cnpj: '', activities: '', groups: '', status: '' },
      crt: { number: '', company: '', cnpj: '', branch: '', establishmentSchedule: '', issueDate: '', principalSchedule: '' },
      afe: { number: '', process: '', activities: '', publicationDate: '' },
      ae: { applicable: '', number: '', process: '', activities: '', publicationDate: '' },
      profile: { homeopathic: false, phytotherapeutic: false, allopathic: false, officinal: false },
      categories: { hormones: false, antibiotics: false, penicillins: false, cephalosporins: false, cytostatics: false, controlled: false },
      sbit: { manipulates: '', substances: '' },
      dosageForms: { solid: false, semisolid: false, liquid: false },
      additional: { industrialized: '', pharmaServices: '', delivery: '' },
      production: { formulasPerDay: '', employeesTotal: '', roles: [] },
      water: { method: '', detail: '' },
      software: { name: '', version: '' },
      bases: { acquired: '', manipulated: '' },
      waste: { company: '', collection: '', generatorCode: '' },
      priorNc: { exists: '', description: '', actions: '' },
      notes: ''
    },
    section2: { characterization: { propertyType: '', floors: '', independentAccess: '', communicatesOther: '', externalId: '', particulars: '' }, checklist: {}, notes: '' },
    section3: {
      personnel: {},
      asos: [],
      pcmso: { presented: '', checklist: {}, notes: '' },
      pgr: { presented: '', checklist: {}, notes: '' },
      trainings: [],
      annexIII: { na: false, checklist: {}, notes: '' }
    },
    attachments: []
  };

  const S2_ITEMS = [
    ['sources', 'Ausência de fontes contaminantes/poluentes incompatíveis com a atividade'],
    ['surfaces', 'Paredes, pisos e tetos lisos, impermeáveis, sem rachaduras e laváveis'],
    ['maintenance', 'Instalações limpas, conservadas e em bom estado de manutenção'],
    ['utilities', 'Instalações elétricas e hidráulicas em condições adequadas'],
    ['flow', 'Layout e fluxo reduzem risco de contaminação e mistura'],
    ['lighting', 'Iluminação e ventilação adequadas às atividades'],
    ['support', 'Área de descanso/refeitório, quando existente, encontra-se separada'],
    ['fire', 'Sistemas/equipamentos de combate a incêndio presentes e em condição adequada'],
    ['identification', 'Identificação do estabelecimento visível ao público']
  ];

  const S3_PERSONNEL = [
    ['org', 'Organograma demonstra estrutura organizacional e pessoal suficiente'],
    ['roles', 'Atribuições e responsabilidades estão formalmente descritas, sem sobreposição'],
    ['admission', 'Admissão precedida de exames médicos e avaliações periódicas'],
    ['removal', 'Há afastamento quando lesão/enfermidade pode comprometer a preparação'],
    ['adornments', 'É observada a proibição de cosméticos, joias e adornos em pesagem/manipulação'],
    ['food', 'É observada a proibição de comer, beber, fumar, mascar e manter objetos pessoais nas áreas de pesagem/manipulação'],
    ['reportRisk', 'Trabalhadores são orientados a relatar condições de risco'],
    ['ppe', 'EPI é fornecido gratuitamente, em quantidade suficiente e com reposição'],
    ['gowning', 'Equipe de manipulação está adequadamente paramentada e realiza higiene de mãos/antebraços']
  ];

  const PCMSO_ITEMS = [
    ['company', 'Identificação da empresa'], ['coord', 'Médico coordenador/responsável'],
    ['program', 'Desenvolvimento do programa médico preventivo'], ['risk', 'Reconhecimento e análise dos riscos ocupacionais'],
    ['exams', 'Periodicidade dos exames clínicos e complementares'], ['annual', 'Planejamento anual'],
    ['recs', 'Recomendações à empresa'], ['function', 'Riscos descritos por função'],
    ['list', 'Lista de exames e periodicidades por função']
  ];

  const PGR_ITEMS = [
    ['legal', 'Bases legais e identificação da empresa'], ['evaluators', 'Responsáveis/avaliadores'],
    ['scope', 'Área de abrangência'], ['risk', 'Avaliação dos riscos'], ['methods', 'Instrumentos e métodos utilizados'],
    ['anticipation', 'Antecipação dos riscos'], ['inventory', 'Inventário de riscos'], ['goals', 'Metas e prioridades de controle'],
    ['records', 'Registro/divulgação dos dados'], ['recs', 'Recomendações'], ['function', 'Riscos por função/área'],
    ['mitigation', 'Medidas de mitigação e prevenção']
  ];

  const ANNEX_ITEMS = [
    ['specificExams', 'Trabalhadores diretamente envolvidos realizam exames médicos específicos previstos no PCMSO'],
    ['communicated', 'Responsáveis pela elaboração do PCMSO foram informados sobre a manipulação dessas substâncias']
  ];

  const listeners = new Set();
  let state = loadState();
  let mountRoot = null;

  function mergeDefaults(base, incoming) {
    if (Array.isArray(base)) return Array.isArray(incoming) ? incoming : deepClone(base);
    if (!base || typeof base !== 'object') return incoming === undefined ? base : incoming;
    const out = {};
    for (const k of Object.keys(base)) out[k] = mergeDefaults(base[k], incoming && Object.prototype.hasOwnProperty.call(incoming, k) ? incoming[k] : undefined);
    if (incoming && typeof incoming === 'object') for (const k of Object.keys(incoming)) if (!(k in out)) out[k] = incoming[k];
    return out;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return deepClone(DEFAULT_STATE);
      return mergeDefaults(DEFAULT_STATE, JSON.parse(raw));
    } catch (_) { return deepClone(DEFAULT_STATE); }
  }

  function saveState() {
    state.meta.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    listeners.forEach((fn) => { try { fn(deepClone(state)); } catch (_) {} });
  }

  function getPath(path) {
    return path.split('.').reduce((o, k) => o && o[k], state);
  }

  function setPath(path, value) {
    const parts = path.split('.');
    let o = state;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!o[parts[i]] || typeof o[parts[i]] !== 'object') o[parts[i]] = {};
      o = o[parts[i]];
    }
    o[parts[parts.length - 1]] = value;
    saveState();
  }

  function statusValue(path) {
    const v = getPath(path);
    return v && typeof v === 'object' ? v.status || '' : '';
  }

  function ensureChecklist(path, key) {
    let obj = getPath(path);
    if (!obj || typeof obj !== 'object') { setPath(path, {}); obj = getPath(path); }
    if (!obj[key]) obj[key] = { status: '', notes: '' };
    return obj[key];
  }

  async function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function storeAttachment(file, section, itemKey) {
    const id = uid('att');
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put({ id, file, section, itemKey, createdAt: new Date().toISOString() });
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    });
    const meta = { id, name: file.name || 'foto', type: file.type, size: file.size, section, itemKey, createdAt: new Date().toISOString() };
    state.attachments.push(meta); saveState(); render();
    return meta;
  }

  async function removeAttachment(id) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).delete(id);
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    });
    state.attachments = state.attachments.filter((x) => x.id !== id); saveState(); render();
  }

  function attachmentCount(section, itemKey) {
    return state.attachments.filter((x) => x.section === section && x.itemKey === itemKey).length;
  }

  function field(label, path, opts = {}) {
    const val = getPath(path) ?? '';
    const type = opts.type || 'text';
    const attrs = [opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : '', opts.inputmode ? `inputmode="${esc(opts.inputmode)}"` : ''].filter(Boolean).join(' ');
    if (type === 'textarea') return `<label class="fm-field fm-field--wide"><span>${esc(label)}</span><textarea data-fm-path="${esc(path)}" ${attrs}>${esc(val)}</textarea></label>`;
    if (type === 'select') return `<label class="fm-field"><span>${esc(label)}</span><select data-fm-path="${esc(path)}"><option value=""></option>${(opts.options || []).map((x) => `<option value="${esc(x)}"${String(val)===String(x)?' selected':''}>${esc(x)}</option>`).join('')}</select></label>`;
    return `<label class="fm-field"><span>${esc(label)}</span><input type="${esc(type)}" value="${esc(val)}" data-fm-path="${esc(path)}" ${attrs}></label>`;
  }

  function yesNo(label, path, na = false) {
    const val = getPath(path) ?? '';
    const options = na ? ['Sim','Não','Não se aplica'] : ['Sim','Não'];
    return `<div class="fm-field"><span>${esc(label)}</span><div class="fm-seg">${options.map((x) => `<button type="button" data-fm-set="${esc(path)}" data-value="${esc(x)}" class="${val===x?'is-active':''}">${esc(x)}</button>`).join('')}</div></div>`;
  }

  function checkbox(label, path) {
    const checked = !!getPath(path);
    return `<label class="fm-check"><input type="checkbox" data-fm-path="${esc(path)}"${checked?' checked':''}><span>${esc(label)}</span></label>`;
  }

  function statusButtons(path) {
    const v = statusValue(path);
    return `<div class="fm-status" role="group" aria-label="Situação"><button type="button" data-fm-status="${esc(path)}" data-value="C" class="${v==='C'?'is-active':''}">Conforme</button><button type="button" data-fm-status="${esc(path)}" data-value="NC" class="${v==='NC'?'is-active':''}">Não conforme</button><button type="button" data-fm-status="${esc(path)}" data-value="NA" class="${v==='NA'?'is-active':''}">Não se aplica</button></div>`;
  }

  function checklistItem(section, basePath, key, label, opts = {}) {
    const rec = ensureChecklist(basePath, key);
    const photoCount = attachmentCount(section, key);
    return `<article class="fm-item ${rec.status==='NC'?'is-nc':''}"><div class="fm-item__title">${esc(label)}</div>${opts.requirement ? `<div class="fm-requirement">Parâmetro/requisito: <strong>${esc(opts.requirement)}</strong></div>` : ''}${statusButtons(`${basePath}.${key}`)}<label class="fm-notes"><span>Anotações</span><textarea data-fm-path="${esc(`${basePath}.${key}.notes`)}">${esc(rec.notes || '')}</textarea></label><div class="fm-item__actions"><label class="fm-photo">📷 Foto${photoCount?` (${photoCount})`:''}<input type="file" accept="image/*" capture="environment" data-fm-photo-section="${esc(section)}" data-fm-photo-item="${esc(key)}"></label>${photoCount ? `<button type="button" class="fm-link" data-fm-remove-photos="${esc(section)}|${esc(key)}">Remover fotos</button>` : ''}</div></article>`;
  }

  function sectionCard(title, body, opts = {}) {
    return `<section class="fm-card"><header class="fm-card__header"><div><h3>${esc(title)}</h3>${opts.subtitle?`<p>${esc(opts.subtitle)}</p>`:''}</div>${opts.naPath ? `<label class="fm-na"><input type="checkbox" data-fm-path="${esc(opts.naPath)}"${getPath(opts.naPath)?' checked':''}> Não se aplica</label>`:''}</header><div class="fm-card__body ${opts.naPath && getPath(opts.naPath)?'is-disabled':''}">${body}</div></section>`;
  }

  function renderSection1() {
    const p = 'section1';
    return `<div class="fm-stack">
      ${sectionCard('1.1 Contexto da inspeção', `<div class="fm-grid">${field('Objetivo da inspeção', `${p}.inspection.objective`)}${field('Protocolos / SEI', `${p}.inspection.protocols`)}${field('Data', `${p}.inspection.date`, {type:'date'})}${field('Equipe inspetora', `${p}.inspection.team`)}${field('Pessoas contatadas no estabelecimento', `${p}.inspection.contacts`, {type:'textarea'})}</div>`)}
      ${sectionCard('1.2 Estabelecimento', `<div class="fm-grid">${field('Razão social', `${p}.establishment.reason`)}${field('Nome fantasia', `${p}.establishment.fantasy`)}${field('CNPJ', `${p}.establishment.cnpj`)}${field('Inscrição Estadual', `${p}.establishment.ie`)}${field('Endereço', `${p}.establishment.address`, {type:'textarea'})}${field('Telefone', `${p}.establishment.phone`)}${field('E-mail', `${p}.establishment.email`, {type:'email'})}</div>`)}
      ${sectionCard('1.3 Responsável legal', `<div class="fm-grid">${field('Nome', `${p}.legal.name`)}${field('CPF', `${p}.legal.cpf`)}</div>`)}
      ${sectionCard('1.4 Responsabilidade técnica', `${renderTechnical()}`)}
      ${sectionCard('1.5 Licença Sanitária', `<div class="fm-grid">${field('CMVS / CEVS', `${p}.license.number`)}${field('Validade', `${p}.license.validity`, {type:'date'})}${field('Titular', `${p}.license.holder`)}${field('CNPJ', `${p}.license.cnpj`)}${field('Atividades licenciadas', `${p}.license.activities`, {type:'textarea'})}${field('Grupos / categorias licenciadas', `${p}.license.groups`, {type:'textarea'})}</div><div class="fm-docslot" data-fm-ocr-slot="license"><strong>Leitor de Licença Sanitária</strong><span>OCR será aplicado somente após revisão dos campos extraídos.</span></div>`)}
      ${sectionCard('1.6 Certidão de Regularidade Técnica — CRF', `<div class="fm-grid">${field('Número da certidão', `${p}.crt.number`)}${field('Empresa', `${p}.crt.company`)}${field('CNPJ', `${p}.crt.cnpj`)}${field('Ramo de atividade', `${p}.crt.branch`)}${field('Horário do estabelecimento', `${p}.crt.establishmentSchedule`, {type:'textarea'})}${field('Data de emissão', `${p}.crt.issueDate`, {type:'date'})}</div><div class="fm-callout"><strong>CRT:</strong> não existe campo de validade neste formulário.</div><div class="fm-docslot" data-fm-ocr-slot="crt"><strong>Leitor de CRT</strong><span>Suporta RT principal e vários substitutos com horários próprios.</span></div>`)}
      ${sectionCard('1.7 Autorizações', `<div class="fm-two">${subAuth('AFE', `${p}.afe`)}${subAuth('AE', `${p}.ae`, true)}</div>`)}
      ${sectionCard('1.8 Perfil de manipulação', `<div class="fm-choice-group"><h4>Tipos</h4>${checkbox('Homeopáticos', `${p}.profile.homeopathic`)}${checkbox('Fitoterápicos', `${p}.profile.phytotherapeutic`)}${checkbox('Alopáticos', `${p}.profile.allopathic`)}${checkbox('Oficinais', `${p}.profile.officinal`)}</div><div class="fm-choice-group"><h4>Classes / grupos</h4>${checkbox('Hormônios', `${p}.categories.hormones`)}${checkbox('Antibióticos', `${p}.categories.antibiotics`)}${checkbox('Penicilínicos', `${p}.categories.penicillins`)}${checkbox('Cefalosporinas', `${p}.categories.cephalosporins`)}${checkbox('Citostáticos', `${p}.categories.cytostatics`)}${checkbox('Sujeitos a controle especial', `${p}.categories.controlled`)}</div><div class="fm-choice-group"><h4>Formas farmacêuticas</h4>${checkbox('Sólidas', `${p}.dosageForms.solid`)}${checkbox('Semissólidas', `${p}.dosageForms.semisolid`)}${checkbox('Líquidas', `${p}.dosageForms.liquid`)}</div><div class="fm-grid">${yesNo('Manipula SBIT?', `${p}.sbit.manipulates`)}${field('Quais SBIT', `${p}.sbit.substances`, {type:'textarea'})}</div>`)}
      ${sectionCard('1.9 Atividades adicionais', `<div class="fm-grid">${yesNo('Dispensa industrializados?', `${p}.additional.industrialized`)}${yesNo('Presta serviços farmacêuticos?', `${p}.additional.pharmaServices`)}${yesNo('Realiza entrega em domicílio?', `${p}.additional.delivery`)}</div><div class="fm-callout">Estas respostas não ocultam seções posteriores. Cada seção condicional terá seu próprio “Não se aplica”.</div>`)}
      ${sectionCard('1.10 Produção e pessoal', `<div class="fm-grid">${field('Média de fórmulas / dia', `${p}.production.formulasPerDay`, {type:'number'})}${field('Total de funcionários', `${p}.production.employeesTotal`, {type:'number'})}</div>${renderRoles()}`)}
      ${sectionCard('1.11 Água, sistema e bases', `<div class="fm-grid">${field('Método de obtenção de água purificada', `${p}.water.method`)}${field('Detalhes do sistema de água', `${p}.water.detail`, {type:'textarea'})}${field('Sistema informatizado', `${p}.software.name`)}${field('Versão', `${p}.software.version`)}${field('Bases/excipientes adquiridos', `${p}.bases.acquired`, {type:'textarea'})}${field('Bases/excipientes manipulados', `${p}.bases.manipulated`, {type:'textarea'})}</div>`)}
      ${sectionCard('1.12 Resíduos e histórico', `<div class="fm-grid">${field('Empresa de coleta', `${p}.waste.company`)}${field('Periodicidade/coleta', `${p}.waste.collection`)}${field('Código do gerador', `${p}.waste.generatorCode`)}${yesNo('Há não conformidades anteriores?', `${p}.priorNc.exists`)}${field('Descrição', `${p}.priorNc.description`, {type:'textarea'})}${field('Ações informadas/adotadas', `${p}.priorNc.actions`, {type:'textarea'})}</div>${field('Anotações gerais da seção', `${p}.notes`, {type:'textarea'})}`)}
    </div>`;
  }

  function subAuth(label, path, ae = false) {
    return `<div class="fm-subcard"><h4>${esc(label)}</h4>${ae?yesNo('Aplicável?', `${path}.applicable`, true):''}<div class="fm-grid">${field('Número', `${path}.number`)}${field('Processo', `${path}.process`)}${field('Atividades', `${path}.activities`, {type:'textarea'})}${field('Data de publicação', `${path}.publicationDate`, {type:'date'})}</div></div>`;
  }

  function renderTechnical() {
    const base = 'section1.technical';
    const rows = state.section1.technical.substitutes.map((r, i) => `<div class="fm-repeat-row"><div class="fm-grid">${field('Nome', `${base}.substitutes.${i}.name`)}${field('CRF', `${base}.substitutes.${i}.crf`)}${field('UF', `${base}.substitutes.${i}.uf`)}${field('Horário de assistência', `${base}.substitutes.${i}.schedule`, {type:'textarea'})}</div><button type="button" class="fm-danger" data-fm-remove-array="${base}.substitutes" data-index="${i}">Remover substituto</button></div>`).join('');
    return `<div class="fm-subcard"><h4>Responsável técnico principal</h4><div class="fm-grid">${field('Nome', `${base}.principal.name`)}${field('CRF', `${base}.principal.crf`)}${field('UF', `${base}.principal.uf`)}${field('Horário de assistência', `${base}.principal.schedule`, {type:'textarea'})}</div></div><div class="fm-subcard"><div class="fm-row-between"><h4>Farmacêuticos substitutos</h4><button type="button" class="fm-primary" data-fm-add="rt-substitute">+ Adicionar</button></div>${rows || '<p class="fm-muted">Nenhum substituto cadastrado.</p>'}</div>`;
  }

  function renderRoles() {
    const base = 'section1.production.roles';
    const rows = state.section1.production.roles.map((r, i) => `<div class="fm-repeat-row"><div class="fm-grid">${field('Função', `${base}.${i}.role`)}${field('Quantidade', `${base}.${i}.count`, {type:'number'})}</div><button type="button" class="fm-danger" data-fm-remove-array="${base}" data-index="${i}">Remover</button></div>`).join('');
    return `<div class="fm-subcard"><div class="fm-row-between"><h4>Composição por função</h4><button type="button" class="fm-primary" data-fm-add="role">+ Adicionar função</button></div>${rows || '<p class="fm-muted">Cadastre a composição da equipe quando necessário.</p>'}</div>`;
  }

  function renderSection2() {
    const c = 'section2.characterization';
    return `<div class="fm-stack">${sectionCard('2.1 Caracterização da edificação', `<div class="fm-grid">${field('Tipo de imóvel', `${c}.propertyType`)}${field('Número de pavimentos', `${c}.floors`, {type:'number'})}${yesNo('Acesso independente?', `${c}.independentAccess`, true)}${yesNo('Comunicação com outro estabelecimento/residência?', `${c}.communicatesOther`, true)}${field('Identificação externa visível', `${c}.externalId`, {type:'textarea'})}${field('Particularidades estruturais', `${c}.particulars`, {type:'textarea'})}</div>`)}${sectionCard('2.2 Condições gerais', S2_ITEMS.map(([k,l]) => checklistItem('section2', 'section2.checklist', k, l)).join(''))}${sectionCard('2.3 Anotações da seção', field('Anotações gerais', 'section2.notes', {type:'textarea'}))}</div>`;
  }

  function renderDocChecklist(title, base, items) {
    return sectionCard(title, `<div class="fm-grid">${yesNo('Documento apresentado?', `${base}.presented`, true)}</div>${items.map(([k,l]) => checklistItem('section3', `${base}.checklist`, k, l)).join('')}${field('Anotações do documento', `${base}.notes`, {type:'textarea'})}`);
  }

  function renderSection3() {
    const asoRows = state.section3.asos.map((r, i) => `<div class="fm-repeat-row"><div class="fm-grid">${field('Funcionário', `section3.asos.${i}.employee`)}${field('CPF', `section3.asos.${i}.cpf`)}${field('Função', `section3.asos.${i}.role`)}${field('Tipo de exame', `section3.asos.${i}.examType`)}${field('Data do exame', `section3.asos.${i}.examDate`, {type:'date'})}${field('Riscos/agentes descritos', `section3.asos.${i}.risks`, {type:'textarea'})}${field('Exames relacionados', `section3.asos.${i}.relatedExams`, {type:'textarea'})}${field('Resultado aptidão', `section3.asos.${i}.fitness`, {type:'select', options:['Apto','Inapto','Não consta']})}${field('Médico examinador', `section3.asos.${i}.doctor`)}${field('CRM', `section3.asos.${i}.crm`)}${field('Responsável PCMSO, se constar', `section3.asos.${i}.pcmsoDoctor`)}</div><button type="button" class="fm-danger" data-fm-remove-array="section3.asos" data-index="${i}">Remover ASO</button></div>`).join('');
    const trRows = state.section3.trainings.map((r, i) => `<div class="fm-repeat-row"><div class="fm-grid">${field('Tema', `section3.trainings.${i}.theme`)}${field('Data', `section3.trainings.${i}.date`, {type:'date'})}${field('Carga horária', `section3.trainings.${i}.hours`)}${field('Nº treinados', `section3.trainings.${i}.count`, {type:'number'})}${yesNo('Efetividade avaliada?', `section3.trainings.${i}.effectiveness`, true)}${field('Anotações', `section3.trainings.${i}.notes`, {type:'textarea'})}</div><button type="button" class="fm-danger" data-fm-remove-array="section3.trainings" data-index="${i}">Remover treinamento</button></div>`).join('');
    return `<div class="fm-stack">
      ${sectionCard('3.1 Pessoal e organização', S3_PERSONNEL.map(([k,l]) => checklistItem('section3', 'section3.personnel', k, l)).join(''))}
      ${sectionCard('3.2 ASO — Saúde ocupacional', `<div class="fm-row-between"><div><p class="fm-muted">O leitor de ASO extrai dados; não avalia conformidade.</p></div><button type="button" class="fm-primary" data-fm-add="aso">+ Adicionar ASO</button></div><div class="fm-docslot" data-fm-ocr-slot="aso"><strong>Leitor de ASO</strong><span>Nome, CPF, função, tipo/data do exame, riscos, exames, aptidão, médico e CRM.</span></div>${asoRows || '<p class="fm-muted">Nenhum ASO cadastrado.</p>'}`)}
      ${renderDocChecklist('3.2.1 PCMSO — checklist, sem OCR', 'section3.pcmso', PCMSO_ITEMS)}
      ${renderDocChecklist('3.2.2 PGR — checklist, sem OCR', 'section3.pgr', PGR_ITEMS)}
      ${sectionCard('3.3 Treinamentos — checklist, sem OCR', `<div class="fm-row-between"><p class="fm-muted">Registre apenas os dados necessários à conferência.</p><button type="button" class="fm-primary" data-fm-add="training">+ Adicionar treinamento</button></div>${trRows || '<p class="fm-muted">Nenhum treinamento cadastrado.</p>'}`)}
      ${sectionCard('3.4 Requisitos ocupacionais adicionais — Anexo III', ANNEX_ITEMS.map(([k,l]) => checklistItem('section3', 'section3.annexIII.checklist', k, l)).join('') + field('Anotações', 'section3.annexIII.notes', {type:'textarea'}), {naPath:'section3.annexIII.na'})}
    </div>`;
  }

  function render() {
    if (!mountRoot) return;
    const active = mountRoot.dataset.activeSection || '1';
    const sections = { '1': ['Identificação e informações gerais', renderSection1], '2': ['Edificações e instalações', renderSection2], '3': ['Pessoal, saúde ocupacional e treinamento', renderSection3] };
    const [title, fn] = sections[active] || sections['1'];
    mountRoot.innerHTML = `<div class="fm-app"><header class="fm-head"><div><p class="fm-eyebrow">Núcleo de Medicamentos</p><h2>Farmácia de Manipulação</h2><p>Implementação isolada · ${esc(VERSION)}</p></div><div class="fm-head__actions"><button type="button" class="fm-secondary" data-fm-action="export-json">Exportar dados</button><button type="button" class="fm-danger" data-fm-action="reset">Limpar teste</button></div></header><nav class="fm-tabs">${Object.entries(sections).map(([k,[t]]) => `<button type="button" data-fm-section="${k}" class="${active===k?'is-active':''}"><strong>${k}</strong><span>${esc(t)}</span></button>`).join('')}</nav><main><div class="fm-section-title"><span>Seção ${esc(active)}</span><h2>${esc(title)}</h2></div>${fn()}</main><footer class="fm-footer"><span>Salvamento local automático</span><span>${state.meta.updatedAt ? `Última alteração: ${esc(new Date(state.meta.updatedAt).toLocaleString('pt-BR'))}` : 'Ainda sem alterações'}</span></footer></div>`;
    bindEvents();
  }

  function bindEvents() {
    mountRoot.querySelectorAll('[data-fm-path]').forEach((el) => {
      const evt = el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input';
      el.addEventListener(evt, () => setPath(el.dataset.fmPath, el.type === 'checkbox' ? el.checked : el.value));
    });
    mountRoot.querySelectorAll('[data-fm-set]').forEach((b) => b.addEventListener('click', () => { setPath(b.dataset.fmSet, b.dataset.value); render(); }));
    mountRoot.querySelectorAll('[data-fm-status]').forEach((b) => b.addEventListener('click', () => { const path=b.dataset.fmStatus; ensureChecklist(path.split('.').slice(0,-1).join('.'), path.split('.').at(-1)); setPath(`${path}.status`, b.dataset.value); render(); }));
    mountRoot.querySelectorAll('[data-fm-section]').forEach((b) => b.addEventListener('click', () => { mountRoot.dataset.activeSection = b.dataset.fmSection; render(); window.scrollTo({top:0,behavior:'smooth'}); }));
    mountRoot.querySelectorAll('[data-fm-add]').forEach((b) => b.addEventListener('click', () => {
      const kind = b.dataset.fmAdd;
      if (kind === 'rt-substitute') state.section1.technical.substitutes.push({name:'',crf:'',uf:'',schedule:''});
      if (kind === 'role') state.section1.production.roles.push({role:'',count:''});
      if (kind === 'aso') state.section3.asos.push({employee:'',cpf:'',role:'',examType:'',examDate:'',risks:'',relatedExams:'',fitness:'',doctor:'',crm:'',pcmsoDoctor:''});
      if (kind === 'training') state.section3.trainings.push({theme:'',date:'',hours:'',count:'',effectiveness:'',notes:''});
      saveState(); render();
    }));
    mountRoot.querySelectorAll('[data-fm-remove-array]').forEach((b) => b.addEventListener('click', () => { const arr=getPath(b.dataset.fmRemoveArray); if(Array.isArray(arr)){arr.splice(Number(b.dataset.index),1); saveState(); render();} }));
    mountRoot.querySelectorAll('[data-fm-photo-section]').forEach((inp) => inp.addEventListener('change', async () => { if (inp.files && inp.files[0]) await storeAttachment(inp.files[0], inp.dataset.fmPhotoSection, inp.dataset.fmPhotoItem); inp.value=''; }));
    mountRoot.querySelectorAll('[data-fm-remove-photos]').forEach((b) => b.addEventListener('click', async () => { const [section,itemKey]=b.dataset.fmRemovePhotos.split('|'); const ids=state.attachments.filter(x=>x.section===section&&x.itemKey===itemKey).map(x=>x.id); for(const id of ids) await removeAttachment(id); }));
    mountRoot.querySelectorAll('[data-fm-action]').forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.fmAction === 'reset' && confirm('Limpar somente os dados de teste de Farmácia de Manipulação?')) { state=deepClone(DEFAULT_STATE); localStorage.removeItem(STORAGE_KEY); saveState(); render(); }
      if (b.dataset.fmAction === 'export-json') { const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='farmacia-manipulacao-dados.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); }
    }));
  }

  function mount(target) {
    mountRoot = typeof target === 'string' ? document.querySelector(target) : target;
    if (!mountRoot) throw new Error('Contêiner de Farmácia de Manipulação não encontrado.');
    if (!mountRoot.dataset.activeSection) mountRoot.dataset.activeSection = '1';
    render();
    return api;
  }

  const api = {
    version: VERSION,
    mount,
    render,
    getState: () => deepClone(state),
    setPath,
    reset: () => { state = deepClone(DEFAULT_STATE); localStorage.removeItem(STORAGE_KEY); saveState(); render(); },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    attachments: { store: storeAttachment, remove: removeAttachment }
  };

  window.FarmaciaManipulacao = api;
  document.addEventListener('DOMContentLoaded', () => {
    const auto = document.querySelector('[data-farmacia-manipulacao-auto]');
    if (auto) mount(auto);
  });
})();
