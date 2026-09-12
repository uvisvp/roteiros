/* Farmácia de Manipulação — infraestrutura do roteiro RDC 67/2007.
 * Branch de desenvolvimento. Não interfere no estado da Drogaria.
 *
 * Princípios:
 * - seções condicionais nunca são ocultadas por respostas de outra seção;
 * - cada bloco condicional possui seu próprio “Não se aplica”;
 * - foto/anotação não geram NC automaticamente;
 * - valores objetivos podem ser sinalizados, mas a conclusão é sempre do fiscal;
 * - OCR somente propõe dados; aplicação depende de revisão humana.
 */
(() => {
  'use strict';
  if (window.ManipulacaoApp) return;

  const VERSION = 'manipulacao-core-0.1';
  const STORAGE_KEY = 'uvisvp_manipulacao_rdc67_v1';
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clean = value => String(value == null ? '' : value).trim();
  const clone = value => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  const uid = prefix => `${prefix || 'id'}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;

  const SECTION_TITLES = {
    1: 'Identificação do Estabelecimento e Informações Gerais',
    2: 'Edificações e Instalações',
    3: 'Pessoal, Saúde Ocupacional e Treinamento',
    4: 'Áreas Físicas',
    5: 'Laboratórios',
    6: 'Laboratórios de Sensibilizantes',
    7: 'Documentos Apresentados',
    8: 'Monitoramento do Processo Magistral e da Água',
    9: 'Rastreabilidade e Controle de Qualidade'
  };

  function emptySection() {
    return { answers:{}, fields:{}, notes:{}, photos:{}, docs:[], items:[], applicability:{} };
  }

  function initialState() {
    const sections = {};
    Object.keys(SECTION_TITLES).forEach(n => sections[n] = emptySection());
    return {
      version: 1,
      activeSection: 1,
      meta: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        inspectorConclusion: '',
        finalRiskNotes: '',
        pendingDocuments: [],
        measures: [],
        team: []
      },
      sections
    };
  }

  let state = loadState();
  let mountedRoot = null;
  let observer = null;
  let renderTimer = null;

  function normalizeState(raw) {
    const next = raw && typeof raw === 'object' ? raw : initialState();
    next.meta ||= {};
    next.sections ||= {};
    Object.keys(SECTION_TITLES).forEach(n => {
      const current = next.sections[n] || {};
      next.sections[n] = Object.assign(emptySection(), current);
      next.sections[n].answers ||= {};
      next.sections[n].fields ||= {};
      next.sections[n].notes ||= {};
      next.sections[n].photos ||= {};
      next.sections[n].docs ||= [];
      next.sections[n].items ||= [];
      next.sections[n].applicability ||= {};
    });
    next.activeSection = Number(next.activeSection) >= 1 && Number(next.activeSection) <= 9 ? Number(next.activeSection) : 1;
    return next;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return normalizeState(raw ? JSON.parse(raw) : initialState());
    } catch (e) {
      console.warn('[Manipulação] Não foi possível recuperar o rascunho.', e);
      return normalizeState(initialState());
    }
  }

  function persist() {
    state.meta.updatedAt = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { console.warn('[Manipulação] Não foi possível salvar o rascunho.', e); }
  }

  function getState() { return state; }
  function setState(next, {render=true} = {}) {
    state = normalizeState(clone(next));
    persist();
    if (render) scheduleRender();
    document.dispatchEvent(new CustomEvent('manipulacao:statechange', { detail:{ state:getState() } }));
  }
  function update(mutator, {render=true} = {}) {
    const next = clone(state);
    mutator(next);
    setState(next, {render});
  }
  function section(n) { return state.sections[String(n)] || state.sections[n]; }

  function setPath(object, path, value) {
    const parts = String(path).split('.');
    let target = object;
    for (let i=0;i<parts.length-1;i++) target = target[parts[i]] ||= {};
    target[parts[parts.length-1]] = value;
  }
  function getPath(object, path, fallback='') {
    let target = object;
    for (const p of String(path).split('.')) {
      if (target == null || !(p in target)) return fallback;
      target = target[p];
    }
    return target == null ? fallback : target;
  }

  function answerButtons(sectionNo, key, {labels={c:'Conforme',nc:'Não conforme',na:'Não se aplica'}, values=['c','nc','na']} = {}) {
    const current = section(sectionNo).answers[key] || '';
    return `<div class="m-answers" role="group" aria-label="Situação">${values.map(v => `<button type="button" data-m-answer="${sectionNo}|${esc(key)}|${esc(v)}" aria-pressed="${current===v}">${esc(labels[v] || v)}</button>`).join('')}</div>`;
  }

  function yesNoButtons(sectionNo, key, {nsa=false} = {}) {
    const labels = {sim:'Sim',nao:'Não',na:'Não se aplica'};
    return answerButtons(sectionNo, key, { labels, values:['sim','nao'].concat(nsa?['na']:[]) });
  }

  function notePhoto(sectionNo, key, {photoLabel='Foto'} = {}) {
    const note = section(sectionNo).notes[key] || '';
    const photoCount = (section(sectionNo).photos[key] || []).length;
    return `<div class="m-support"><button type="button" class="m-photo" data-m-photo="${sectionNo}|${esc(key)}">📷 ${esc(photoLabel)}${photoCount ? ` (${photoCount})` : ''}</button><label class="m-note"><span>Anotações</span><textarea rows="2" data-m-note="${sectionNo}|${esc(key)}">${esc(note)}</textarea></label></div>`;
  }

  function requirement(text, {kind='info'} = {}) {
    return `<div class="m-requirement ${esc(kind)}"><b>Parâmetro de referência:</b> ${esc(text)}</div>`;
  }

  function field(sectionNo, key, label, {type='text', placeholder='', inputmode='', step='', min='', max='', value} = {}) {
    const v = value == null ? section(sectionNo).fields[key] || '' : value;
    const attrs = [inputmode && `inputmode="${esc(inputmode)}"`, step && `step="${esc(step)}"`, min!=='' && `min="${esc(min)}"`, max!=='' && `max="${esc(max)}"`].filter(Boolean).join(' ');
    return `<label class="m-field"><span>${esc(label)}</span><input type="${esc(type)}" data-m-field="${sectionNo}|${esc(key)}" value="${esc(v)}" placeholder="${esc(placeholder)}" ${attrs}></label>`;
  }

  function textarea(sectionNo, key, label, {rows=3, placeholder=''} = {}) {
    const v = section(sectionNo).fields[key] || '';
    return `<label class="m-field"><span>${esc(label)}</span><textarea rows="${rows}" data-m-field="${sectionNo}|${esc(key)}" placeholder="${esc(placeholder)}">${esc(v)}</textarea></label>`;
  }

  function select(sectionNo, key, label, options, {value} = {}) {
    const v = value == null ? section(sectionNo).fields[key] || '' : value;
    return `<label class="m-field"><span>${esc(label)}</span><select data-m-field="${sectionNo}|${esc(key)}">${options.map(o => {const opt=Array.isArray(o)?o:[o,o];return `<option value="${esc(opt[0])}"${String(v)===String(opt[0])?' selected':''}>${esc(opt[1])}</option>`;}).join('')}</select></label>`;
  }

  function applicability(sectionNo, key, title, bodyHtml, {label='Não se aplica a esta inspeção'} = {}) {
    const disabled = section(sectionNo).applicability[key] === 'na';
    return `<section class="m-card m-applicability${disabled?' is-na':''}" data-m-app-card="${sectionNo}|${esc(key)}"><header class="m-card-head"><div><h3>${esc(title)}</h3></div><button type="button" class="m-na-toggle" data-m-na="${sectionNo}|${esc(key)}" aria-pressed="${disabled}">${disabled?'Reabrir seção':esc(label)}</button></header><div class="m-card-body"${disabled?' hidden':''}>${bodyHtml}</div>${disabled?'<p class="m-na-note">Marcado como não aplicável. O conteúdo permanece preservado e pode ser reaberto.</p>':''}</section>`;
  }

  function refrigerator(sectionNo, key) {
    const yes = section(sectionNo).answers[`${key}_possui`] === 'sim';
    let body = `<div class="m-question"><b>Possui refrigerador neste ambiente?</b>${yesNoButtons(sectionNo, `${key}_possui`)}</div>`;
    if (yes) {
      body += `<div class="m-refrigerator"><div class="m-grid">${field(sectionNo,`${key}_identificacao`,'Identificação do refrigerador')}${field(sectionNo,`${key}_finalidade`,'Uso / finalidade')}${field(sectionNo,`${key}_faixa_min`,'Faixa adotada — mínima (°C)',{type:'number',step:'0.1'})}${field(sectionNo,`${key}_faixa_max`,'Faixa adotada — máxima (°C)',{type:'number',step:'0.1'})}${field(sectionNo,`${key}_momento`,'Temperatura no momento (°C)',{type:'number',step:'0.1'})}${field(sectionNo,`${key}_maxima`,'Máxima registrada (°C)',{type:'number',step:'0.1'})}${field(sectionNo,`${key}_minima`,'Mínima registrada (°C)',{type:'number',step:'0.1'})}${field(sectionNo,`${key}_instrumento`,'Termômetro / registrador')}${field(sectionNo,`${key}_instrumento_id`,'Identificação do instrumento')}${field(sectionNo,`${key}_certificado`,'Certificado de calibração')}${field(sectionNo,`${key}_calibracao_validade`,'Validade da calibração',{type:'date'})}</div>`;
      const checks = [
        ['organizacao','Organização interna adequada'],
        ['segregacao','Itens segregados e identificados'],
        ['limpeza','Limpeza / higienização adequada'],
        ['monitoramento','Monitoramento de temperatura realizado'],
        ['registros','Registros apresentados e preenchidos'],
        ['acao_corretiva','Há previsão/registro de ação corretiva para desvios']
      ];
      body += `<div class="m-check-stack">${checks.map(([k,t]) => `<div class="m-question"><b>${esc(t)}</b>${answerButtons(sectionNo,`${key}_${k}`)}</div>`).join('')}</div>${notePhoto(sectionNo,key)}</div>`;
    }
    return `<section class="m-card m-fridge"><h3>Refrigerador</h3>${body}</section>`;
  }

  function pressureControl(sectionNo, key, {reference='-5 a -120 Pa'} = {}) {
    return `<section class="m-card"><h3>Diferencial de pressão</h3>${requirement(`${reference} — parâmetro operacional informado para conferência; não atribuído automaticamente à RDC sem fonte específica.`)}<div class="m-grid">${field(sectionNo,`${key}_valor`,'Valor aferido (Pa)',{type:'number',step:'0.1'})}${field(sectionNo,`${key}_instrumento`,'Manômetro utilizado')}${field(sectionNo,`${key}_instrumento_id`,'Identificação do instrumento')}${field(sectionNo,`${key}_certificado`,'Certificado de calibração')}${field(sectionNo,`${key}_validade`,'Validade da calibração',{type:'date'})}</div>${answerButtons(sectionNo,`${key}_situacao`)}${notePhoto(sectionNo,key)}</section>`;
  }

  function sectionMenu() {
    return `<div class="m-section-menu">${Object.entries(SECTION_TITLES).map(([n,t]) => `<button type="button" data-m-section="${n}" class="${Number(n)===state.activeSection?'active':''}"><span>${n}</span><b>${esc(t)}</b></button>`).join('')}</div>`;
  }

  function sectionPlaceholder(n) {
    const external = window.ManipulacaoSections;
    if (external && typeof external.render === 'function') {
      try { return external.render(Number(n), api); } catch (e) { console.error('[Manipulação] Falha ao renderizar seção.', e); }
    }
    return `<section class="m-card"><h2>${n}. ${esc(SECTION_TITLES[n])}</h2><p>Estrutura carregada. O conteúdo funcional desta seção será incorporado na próxima etapa.</p></section>`;
  }

  function injectStyle() {
    if (document.getElementById('manipulacao-core-style')) return;
    const style = document.createElement('style');
    style.id = 'manipulacao-core-style';
    style.textContent = `
      #manipulacao-rdc67-root{--m-border:#d8dde6;--m-muted:#5d6675;--m-bg:#f5f7fa;--m-accent:#111827;font-family:inherit;color:#172033}
      #manipulacao-rdc67-root *{box-sizing:border-box}
      .m-shell{max-width:1280px;margin:0 auto;padding:12px 12px 88px}
      .m-head{position:sticky;top:0;z-index:15;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border-bottom:1px solid var(--m-border);padding:10px 0 8px}
      .m-head-row{display:flex;gap:10px;align-items:center;justify-content:space-between}.m-head h1{font-size:1.25rem;margin:0}.m-head p{margin:3px 0 0;color:var(--m-muted);font-size:.9rem}
      .m-section-menu{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0}.m-section-menu button{display:flex;text-align:left;gap:9px;align-items:flex-start;border:1px solid var(--m-border);background:#fff;border-radius:12px;padding:9px;min-height:58px}.m-section-menu button.active{outline:2px solid #111827}.m-section-menu span{display:grid;place-items:center;min-width:25px;height:25px;border-radius:50%;background:#111827;color:#fff;font-weight:800}.m-section-menu b{font-size:.82rem;line-height:1.2}
      .m-content{display:grid;gap:12px}.m-card{background:#fff;border:1px solid var(--m-border);border-radius:14px;padding:14px;box-shadow:0 1px 2px rgba(0,0,0,.03)}.m-card h2,.m-card h3{margin-top:0}.m-card-head{display:flex;gap:10px;align-items:flex-start;justify-content:space-between}.m-card.is-na{background:#f7f7f8}.m-na-note{color:var(--m-muted);font-size:.9rem;margin-bottom:0}
      .m-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.m-field{display:grid;gap:5px}.m-field>span,.m-note>span{font-size:.82rem;font-weight:700}.m-field input,.m-field select,.m-field textarea,.m-note textarea{width:100%;border:1px solid #c9d0da;border-radius:9px;padding:9px;background:#fff;font:inherit}.m-question{border-top:1px solid #edf0f4;padding:10px 0}.m-question:first-child{border-top:0}.m-answers{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}.m-answers button,.m-na-toggle,.m-photo,.m-nav button{border:1px solid #bec6d2;background:#fff;border-radius:9px;padding:7px 10px;font:inherit}.m-answers button[aria-pressed=true],.m-na-toggle[aria-pressed=true]{background:#111827;color:#fff;border-color:#111827}.m-support{display:grid;grid-template-columns:auto 1fr;gap:9px;align-items:start;margin-top:9px}.m-note{display:grid;gap:4px}.m-requirement{border-left:4px solid #111827;background:#f3f4f6;padding:8px 10px;border-radius:6px;margin:8px 0;font-size:.88rem}.m-check-stack{margin-top:10px}.m-refrigerator{margin-top:8px}.m-nav{position:fixed;z-index:30;left:50%;bottom:max(8px,env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;gap:8px;background:rgba(255,255,255,.96);border:1px solid var(--m-border);padding:7px;border-radius:14px;box-shadow:0 6px 30px rgba(0,0,0,.14)}.m-nav button{font-weight:700}.m-nav .primary{background:#111827;color:#fff}.m-meta-badge{display:inline-flex;align-items:center;border-radius:999px;background:#eef1f5;padding:4px 8px;font-size:.78rem;font-weight:700}
      @media(max-width:720px){.m-section-menu{grid-template-columns:1fr}.m-grid{grid-template-columns:1fr}.m-support{grid-template-columns:1fr}.m-shell{padding-left:8px;padding-right:8px}.m-head h1{font-size:1.05rem}.m-section-menu b{font-size:.88rem}}
    `;
    document.head.appendChild(style);
  }

  function render() {
    if (!mountedRoot || !document.contains(mountedRoot)) return;
    injectStyle();
    const n = state.activeSection;
    mountedRoot.innerHTML = `<div class="m-shell"><header class="m-head"><div class="m-head-row"><div><span class="m-meta-badge">Farmácia de Manipulação · seção ${n} de 9</span><h1>${n}. ${esc(SECTION_TITLES[n])}</h1><p>Roteiro não estéril · preenchimento e conclusão sob responsabilidade da equipe inspetora.</p></div><button type="button" data-m-all-sections>Todas as seções</button></div></header>${sectionMenu()}<main class="m-content">${sectionPlaceholder(n)}</main><nav class="m-nav"><button type="button" data-m-prev ${n<=1?'disabled':''}>←</button><button type="button" data-m-clear-section>Limpar seção</button><button type="button" class="primary" data-m-next ${n>=9?'disabled':''}>→</button></nav></div>`;
  }

  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(render, 0);
  }

  function text(el) { return clean(el && el.textContent).replace(/\s+/g,' '); }

  function candidateManipulationContainer() {
    const explicit = document.querySelector('[data-module="manipulacao"],[data-nucleo="manipulacao"],[data-module="farmacia-manipulacao"],#farmacia-manipulacao,#manipulacao-app');
    if (explicit) return explicit;
    const headings = [...document.querySelectorAll('h1,h2,h3,.title,.panel-title,.subbar,.badge')];
    const marker = headings.find(el => /farm[aá]cia\s+de\s+manipula[cç][aã]o|manipula[cç][aã]o\s+de\s+f[oó]rmulas/i.test(text(el)));
    if (!marker) return null;
    return marker.closest('.panel,.module,.screen,.page,main,section') || marker.parentElement;
  }

  function ensureRoot() {
    const target = candidateManipulationContainer();
    if (!target) return false;
    if (target.id === 'manipulacao-rdc67-root') { mountedRoot = target; return true; }
    let root = target.querySelector(':scope > #manipulacao-rdc67-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'manipulacao-rdc67-root';
      root.dataset.manipulacaoEnhanced = 'true';
      // Preserva a tela original apenas no DOM para recuperação durante desenvolvimento.
      const original = document.createElement('div');
      original.hidden = true;
      original.dataset.manipulacaoOriginal = 'true';
      while (target.firstChild) original.appendChild(target.firstChild);
      target.appendChild(original);
      target.appendChild(root);
    }
    mountedRoot = root;
    render();
    return true;
  }

  function unmount() {
    if (!mountedRoot) return;
    const target = mountedRoot.parentElement;
    const original = target && target.querySelector(':scope > [data-manipulacao-original="true"]');
    if (target && original) {
      mountedRoot.remove();
      while (original.firstChild) target.insertBefore(original.firstChild, original);
      original.remove();
    }
    mountedRoot = null;
  }

  function capturePhoto(sectionNo, key) {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const descriptor = { id:uid('foto'), name:file.name || 'foto', type:file.type, size:file.size, takenAt:new Date().toISOString() };
      // Nesta infraestrutura guardamos o vínculo/metadado. O arquivo binário será integrado ao repositório local de evidências já usado pelo app.
      update(s => { const sec=s.sections[String(sectionNo)]; (sec.photos[key] ||= []).push(descriptor); });
    };
    input.click();
  }

  function clearSection(n) {
    if (!confirm(`Limpar somente a seção ${n} — ${SECTION_TITLES[n]}?`)) return;
    update(s => { s.sections[String(n)] = emptySection(); });
  }

  function installEvents() {
    if (document.documentElement.dataset.manipulacaoCoreEvents === '1') return;
    document.documentElement.dataset.manipulacaoCoreEvents = '1';
    document.addEventListener('click', e => {
      const secBtn=e.target.closest('[data-m-section]');
      if(secBtn){ update(s=>s.activeSection=Number(secBtn.dataset.mSection)); return; }
      if(e.target.closest('[data-m-prev]')){ update(s=>s.activeSection=Math.max(1,s.activeSection-1)); return; }
      if(e.target.closest('[data-m-next]')){ update(s=>s.activeSection=Math.min(9,s.activeSection+1)); return; }
      if(e.target.closest('[data-m-all-sections]')){ scheduleRender(); return; }
      if(e.target.closest('[data-m-clear-section]')){ clearSection(state.activeSection); return; }
      const ans=e.target.closest('[data-m-answer]');
      if(ans){ const [n,k,v]=ans.dataset.mAnswer.split('|'); update(s=>s.sections[n].answers[k]=v); return; }
      const na=e.target.closest('[data-m-na]');
      if(na){ const [n,k]=na.dataset.mNa.split('|'); update(s=>{const a=s.sections[n].applicability;a[k]=a[k]==='na'?'':'na';}); return; }
      const photo=e.target.closest('[data-m-photo]');
      if(photo){ const [n,k]=photo.dataset.mPhoto.split('|'); capturePhoto(n,k); return; }
    });
    document.addEventListener('input', e => {
      const f=e.target.closest('[data-m-field]');
      if(f){ const [n,k]=f.dataset.mField.split('|'); update(s=>s.sections[n].fields[k]=f.value,{render:false}); return; }
      const note=e.target.closest('[data-m-note]');
      if(note){ const [n,k]=note.dataset.mNote.split('|'); update(s=>s.sections[n].notes[k]=note.value,{render:false}); }
    });
    document.addEventListener('change', e => {
      const f=e.target.closest('[data-m-field]');
      if(f){ const [n,k]=f.dataset.mField.split('|'); update(s=>s.sections[n].fields[k]=f.value); }
    });
  }

  function startObserver() {
    if (observer) return;
    let busy=false;
    const tryMount=()=>{
      if(busy)return; busy=true;
      try {
        if (mountedRoot && !document.contains(mountedRoot)) mountedRoot=null;
        if (!mountedRoot) ensureRoot();
      } finally { busy=false; }
    };
    observer = new MutationObserver(() => queueMicrotask(tryMount));
    observer.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',()=>setTimeout(tryMount,0),true);
    tryMount();
  }

  const api = Object.freeze({
    version: VERSION,
    titles: SECTION_TITLES,
    getState,
    setState,
    update,
    section,
    getPath,
    setPath,
    components:Object.freeze({answerButtons,yesNoButtons,notePhoto,requirement,field,textarea,select,applicability,refrigerator,pressureControl}),
    render:scheduleRender,
    mount:ensureRoot,
    unmount,
    uid
  });
  window.ManipulacaoApp = api;

  function boot(){ injectStyle(); installEvents(); startObserver(); document.dispatchEvent(new CustomEvent('manipulacao:ready',{detail:{api}})); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
