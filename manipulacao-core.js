/* Farmácia de Manipulação — núcleo de estado/renderização.
 * Implementação isolada: não altera Drogaria nem outros núcleos.
 */
(() => {
  'use strict';
  if (window.ManipulacaoCore) return;

  const VERSION = 'manipulacao-core-0.1.0';
  const STORAGE_KEY = 'uvisvp_manipulacao_rascunho_v1';
  const SCHEMA_VERSION = 1;
  const sectionRegistry = new Map();
  const listeners = new Set();
  let currentSection = '1';
  let mountTarget = null;
  let renderBusy = false;

  const clone = value => {
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  };
  const text = value => String(value == null ? '' : value);
  const clean = value => text(value).trim();
  const esc = value => text(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
  const now = () => new Date().toISOString();
  const isIndex = key => /^\d+$/.test(String(key));

  function blankState() {
    return {
      schema: SCHEMA_VERSION,
      module: 'farmacia_manipulacao',
      updated_at: now(),
      meta: {
        version: VERSION,
        inspection_id: '',
        active_section: '1'
      },
      sections: {
        '1': { fields: {}, answers: {}, notes: {}, photos: [], documents: [], items: {} },
        '2': { fields: {}, answers: {}, notes: {}, photos: [], documents: [], items: {} },
        '3': { fields: {}, answers: {}, notes: {}, photos: [], documents: [], items: {} },
        '4': { fields: {}, answers: {}, notes: {}, photos: [], documents: [], items: {} },
        '5': { fields: {}, answers: {}, notes: {}, photos: [], documents: [], items: {} },
        '6': { fields: {}, answers: {}, notes: {}, photos: [], documents: [], items: {} },
        '7': { fields: {}, answers: {}, notes: {}, photos: [], documents: [], items: {} },
        '8': { fields: {}, answers: {}, notes: {}, photos: [], documents: [], items: {} },
        '9': { fields: {}, answers: {}, notes: {}, photos: [], documents: [], items: {} }
      },
      pending_documents: [],
      nonconformities: [],
      risk_assessment: { text: '', orientations: '' },
      conclusion: { classification: '', decision: '', notes: '' },
      measures: [],
      inspectors: []
    };
  }

  function normalizeState(raw) {
    const base = blankState();
    if (!raw || typeof raw !== 'object') return base;
    const state = Object.assign(base, raw);
    state.meta = Object.assign(base.meta, raw.meta || {});
    state.sections = Object.assign(base.sections, raw.sections || {});
    for (let i = 1; i <= 9; i++) {
      const k = String(i);
      const src = state.sections[k] || {};
      state.sections[k] = Object.assign({ fields: {}, answers: {}, notes: {}, photos: [], documents: [], items: {} }, src);
    }
    state.pending_documents = Array.isArray(raw.pending_documents) ? raw.pending_documents : [];
    state.nonconformities = Array.isArray(raw.nonconformities) ? raw.nonconformities : [];
    state.measures = Array.isArray(raw.measures) ? raw.measures : [];
    state.inspectors = Array.isArray(raw.inspectors) ? raw.inspectors : [];
    return state;
  }

  function loadState() {
    try {
      const host = window.ManipulacaoHost;
      if (host && typeof host.getState === 'function') {
        return normalizeState(clone(host.getState()));
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      return normalizeState(raw ? JSON.parse(raw) : null);
    } catch (error) {
      console.warn('[Manipulação] Não foi possível carregar o rascunho.', error);
      return blankState();
    }
  }

  let state = loadState();

  function persist(options = {}) {
    state.updated_at = now();
    state.meta.version = VERSION;
    try {
      const host = window.ManipulacaoHost;
      if (host && typeof host.setState === 'function') host.setState(clone(state), options);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('[Manipulação] Não foi possível salvar o rascunho.', error);
    }
    listeners.forEach(fn => {
      try { fn(clone(state), options); } catch (error) { console.error(error); }
    });
    document.dispatchEvent(new CustomEvent('manipulacao:statechange', { detail: { state: clone(state), options } }));
    if (options.render !== false) render();
  }

  function getState() { return clone(state); }
  function setState(next, options = {}) {
    state = normalizeState(clone(next));
    persist(options);
  }
  function update(mutator, options = {}) {
    const next = clone(state);
    mutator(next);
    state = normalizeState(next);
    persist(options);
  }

  function parts(path) {
    return Array.isArray(path) ? path.map(String) : String(path || '').split('.').filter(Boolean);
  }
  function getPath(source, path, fallback = '') {
    let node = source;
    for (const key of parts(path)) {
      if (node == null || !(key in Object(node))) return fallback;
      node = node[key];
    }
    return node == null ? fallback : node;
  }
  function setPath(source, path, value) {
    const p = parts(path);
    if (!p.length) return source;
    let node = source;
    for (let i = 0; i < p.length - 1; i++) {
      const key = p[i], next = p[i + 1];
      if (node[key] == null || typeof node[key] !== 'object') node[key] = isIndex(next) ? [] : {};
      node = node[key];
    }
    node[p[p.length - 1]] = value;
    return source;
  }
  function deletePath(source, path) {
    const p = parts(path);
    if (!p.length) return;
    let node = source;
    for (let i = 0; i < p.length - 1; i++) {
      node = node?.[p[i]];
      if (node == null) return;
    }
    if (Array.isArray(node) && isIndex(p[p.length - 1])) node.splice(Number(p[p.length - 1]), 1);
    else if (node && typeof node === 'object') delete node[p[p.length - 1]];
  }

  function ensureSection(sectionId) {
    const id = String(sectionId);
    if (!state.sections[id]) state.sections[id] = { fields: {}, answers: {}, notes: {}, photos: [], documents: [], items: {} };
    return state.sections[id];
  }
  function section(sectionId) { return clone(ensureSection(sectionId)); }

  function field(path, fallback = '') { return getPath(state, path, fallback); }
  function setField(path, value, options = {}) {
    update(next => setPath(next, path, value), options);
  }

  function uid(prefix = 'm') {
    if (window.crypto?.randomUUID) return prefix + '-' + crypto.randomUUID();
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  function registerSection(id, config) {
    const key = String(id);
    sectionRegistry.set(key, Object.assign({ id: key, title: 'Seção ' + key, render: () => '' }, config || {}));
  }
  function sectionConfig(id) { return sectionRegistry.get(String(id)) || null; }
  function sections() { return [...sectionRegistry.values()].sort((a, b) => Number(a.id) - Number(b.id)); }

  function navigationMarkup() {
    const all = sections();
    if (!all.length) return '';
    return '<nav class="manip-section-nav" aria-label="Seções da inspeção">' + all.map(s => {
      const active = String(s.id) === String(currentSection);
      return '<button type="button" data-manip-open-section="' + esc(s.id) + '" aria-current="' + (active ? 'page' : 'false') + '">' +
        '<b>' + esc(s.id) + '</b><span>' + esc(s.shortTitle || s.title) + '</span></button>';
    }).join('') + '</nav>';
  }

  function shellMarkup(body, config) {
    return '<div class="manip-app" data-manip-module>' +
      '<header class="manip-header"><div><p class="manip-kicker">Núcleo de Medicamentos</p><h1>Farmácia de Manipulação</h1></div>' +
      '<div class="manip-header-actions"><button type="button" data-manip-home>Voltar ao Núcleo</button></div></header>' +
      navigationMarkup() +
      '<main class="manip-main"><div class="manip-section-head"><span class="manip-badge">Seção ' + esc(config?.id || currentSection) + ' de 9</span><h2>' + esc(config?.title || '') + '</h2></div>' + body + '</main>' +
      '<footer class="manip-footer"><button type="button" data-manip-prev>←</button><button type="button" data-manip-save>Salvar rascunho</button><button type="button" data-manip-next>→</button></footer>' +
      '</div>';
  }

  function render(sectionId = currentSection, target = mountTarget) {
    if (renderBusy || !target) return false;
    const key = String(sectionId || '1');
    const config = sectionRegistry.get(key);
    if (!config) return false;
    renderBusy = true;
    try {
      currentSection = key;
      state.meta.active_section = key;
      const body = config.render({ state: getState(), section: section(key), core: api });
      target.innerHTML = shellMarkup(body, config);
      config.afterRender?.({ target, state: getState(), core: api });
      return true;
    } finally {
      renderBusy = false;
    }
  }

  function mount(target, sectionId) {
    mountTarget = typeof target === 'string' ? document.querySelector(target) : target;
    if (!mountTarget) throw new Error('Contêiner da Farmácia de Manipulação não encontrado.');
    currentSection = String(sectionId || state.meta.active_section || '1');
    installEvents();
    return render(currentSection, mountTarget);
  }

  let eventsInstalled = false;
  function installEvents() {
    if (eventsInstalled) return;
    eventsInstalled = true;

    document.addEventListener('input', event => {
      const el = event.target.closest?.('[data-manip-field]');
      if (!el) return;
      const value = el.type === 'checkbox' ? el.checked : el.value;
      setField(el.dataset.manipField, value, { render: false, source: 'input' });
    });
    document.addEventListener('change', event => {
      const el = event.target.closest?.('[data-manip-field]');
      if (!el) return;
      const value = el.type === 'checkbox' ? el.checked : el.value;
      setField(el.dataset.manipField, value, { render: false, source: 'change' });
    });
    document.addEventListener('click', event => {
      const answer = event.target.closest?.('[data-manip-answer]');
      if (answer) {
        const [path, value] = answer.dataset.manipAnswer.split('|');
        setField(path, value, { source: 'answer' });
        return;
      }
      const open = event.target.closest?.('[data-manip-open-section]');
      if (open) { render(open.dataset.manipOpenSection); return; }
      if (event.target.closest?.('[data-manip-prev]')) {
        const n = Math.max(1, Number(currentSection) - 1); render(String(n)); return;
      }
      if (event.target.closest?.('[data-manip-next]')) {
        const n = Math.min(9, Number(currentSection) + 1); render(String(n)); return;
      }
      if (event.target.closest?.('[data-manip-save]')) {
        persist({ render: false, source: 'manual-save' });
        document.dispatchEvent(new CustomEvent('manipulacao:saved', { detail: { at: state.updated_at } }));
        return;
      }
      if (event.target.closest?.('[data-manip-home]')) {
        document.dispatchEvent(new CustomEvent('manipulacao:home'));
      }
      const photo = event.target.closest?.('[data-manip-photo]');
      if (photo) {
        document.dispatchEvent(new CustomEvent('manipulacao:photo', { detail: { key: photo.dataset.manipPhoto, section: currentSection } }));
      }
      const copy = event.target.closest?.('[data-manip-copy-section]');
      if (copy) {
        document.dispatchEvent(new CustomEvent('manipulacao:copysection', { detail: { section: copy.dataset.manipCopySection } }));
      }
    });
  }

  function resetSection(id) {
    update(next => {
      next.sections[String(id)] = { fields: {}, answers: {}, notes: {}, photos: [], documents: [], items: {} };
    });
  }
  function clearAll() {
    state = blankState();
    persist({ source: 'clear-all' });
  }

  const api = Object.freeze({
    VERSION, STORAGE_KEY, SCHEMA_VERSION,
    esc, clean, clone, uid,
    getState, setState, update, field, setField, getPath, setPath, deletePath,
    section, ensureSection,
    registerSection, sectionConfig, sections,
    mount, render, resetSection, clearAll,
    onChange(fn) { if (typeof fn === 'function') listeners.add(fn); return () => listeners.delete(fn); }
  });
  window.ManipulacaoCore = api;
})();
