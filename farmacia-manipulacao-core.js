/*
 * Farmácia de Manipulação — núcleo funcional compartilhado
 * Projeto INSPEÇÃO SANITÁRIA
 *
 * Este arquivo é deliberadamente isolado do módulo Drogaria.
 * Ele fornece estado, componentes e utilitários para as seções da inspeção
 * de Farmácia de Manipulação, sem montar telas automaticamente e sem
 * realizar qualquer julgamento sanitário automático.
 */
(function (window, document) {
  'use strict';

  var NS = window.FarmaciaManipulacao = window.FarmaciaManipulacao || {};

  NS.VERSION = '1.0.0';
  NS.SCHEMA_VERSION = 1;
  NS.STORAGE_KEY = 'inspecao-sanitaria:manipulacao:v1';
  NS.EVENT_PREFIX = 'farmacia-manipulacao:';

  var memoryState = null;

  function nowIso() {
    return new Date().toISOString();
  }

  function freshState() {
    return {
      schemaVersion: NS.SCHEMA_VERSION,
      updatedAt: nowIso(),
      sections: {},
      meta: {
        module: 'farmacia-manipulacao',
        version: NS.VERSION
      }
    };
  }

  function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  function clone(value) {
    if (value === undefined) return undefined;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (err) {
      return value;
    }
  }

  function normalizePath(path) {
    if (Array.isArray(path)) return path.filter(Boolean).map(String);
    if (typeof path !== 'string') return [];
    return path.split('.').map(function (part) { return part.trim(); }).filter(Boolean);
  }

  function getAtPath(source, path, fallback) {
    var parts = normalizePath(path);
    var cursor = source;
    for (var i = 0; i < parts.length; i += 1) {
      if (cursor == null || !Object.prototype.hasOwnProperty.call(cursor, parts[i])) {
        return fallback;
      }
      cursor = cursor[parts[i]];
    }
    return cursor === undefined ? fallback : cursor;
  }

  function setAtPath(target, path, value) {
    var parts = normalizePath(path);
    if (!parts.length) return target;
    var cursor = target;
    for (var i = 0; i < parts.length - 1; i += 1) {
      if (!isPlainObject(cursor[parts[i]]) && !Array.isArray(cursor[parts[i]])) {
        cursor[parts[i]] = {};
      }
      cursor = cursor[parts[i]];
    }
    cursor[parts[parts.length - 1]] = value;
    return target;
  }

  function storageAvailable() {
    try {
      var key = '__fm_test__';
      window.localStorage.setItem(key, '1');
      window.localStorage.removeItem(key);
      return true;
    } catch (err) {
      return false;
    }
  }

  NS.loadState = function () {
    if (memoryState) return clone(memoryState);
    var state = freshState();
    if (storageAvailable()) {
      try {
        var raw = window.localStorage.getItem(NS.STORAGE_KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && parsed.schemaVersion === NS.SCHEMA_VERSION) {
            state = parsed;
          }
        }
      } catch (err) {
        console.warn('[FarmaciaManipulacao] Não foi possível carregar o estado salvo.', err);
      }
    }
    memoryState = state;
    return clone(memoryState);
  };

  NS.saveState = function (state, options) {
    options = options || {};
    var next = clone(state || freshState());
    next.schemaVersion = NS.SCHEMA_VERSION;
    next.updatedAt = nowIso();
    next.meta = next.meta || {};
    next.meta.module = 'farmacia-manipulacao';
    next.meta.version = NS.VERSION;
    memoryState = next;

    if (storageAvailable()) {
      try {
        window.localStorage.setItem(NS.STORAGE_KEY, JSON.stringify(next));
      } catch (err) {
        console.warn('[FarmaciaManipulacao] Não foi possível salvar o estado.', err);
      }
    }

    if (!options.silent) {
      NS.emit('statechange', { state: clone(next), source: options.source || 'saveState' });
    }
    return clone(next);
  };

  NS.get = function (path, fallback) {
    return clone(getAtPath(NS.loadState(), path, fallback));
  };

  NS.set = function (path, value, options) {
    var state = NS.loadState();
    setAtPath(state, path, clone(value));
    return NS.saveState(state, options);
  };

  NS.update = function (path, updater, options) {
    if (typeof updater !== 'function') return NS.loadState();
    var state = NS.loadState();
    var current = clone(getAtPath(state, path));
    var nextValue = updater(current, clone(state));
    setAtPath(state, path, clone(nextValue));
    return NS.saveState(state, options);
  };

  NS.reset = function () {
    memoryState = freshState();
    if (storageAvailable()) {
      try { window.localStorage.removeItem(NS.STORAGE_KEY); } catch (err) { /* noop */ }
    }
    NS.emit('statechange', { state: clone(memoryState), source: 'reset' });
    return clone(memoryState);
  };

  NS.escapeHtml = function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  NS.uid = function (prefix) {
    prefix = prefix || 'fm';
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  };

  NS.emit = function (name, detail) {
    try {
      window.dispatchEvent(new CustomEvent(NS.EVENT_PREFIX + name, { detail: detail || {} }));
    } catch (err) {
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent(NS.EVENT_PREFIX + name, false, false, detail || {});
      window.dispatchEvent(event);
    }
  };

  NS.on = function (name, handler) {
    if (typeof handler !== 'function') return function () {};
    var eventName = NS.EVENT_PREFIX + name;
    window.addEventListener(eventName, handler);
    return function () { window.removeEventListener(eventName, handler); };
  };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  NS.dom = {
    el: el,
    clear: function (node) {
      while (node && node.firstChild) node.removeChild(node.firstChild);
      return node;
    }
  };

  NS.requirementHint = function (text, options) {
    options = options || {};
    var wrap = el('div', 'fm-requirement-hint');
    wrap.setAttribute('role', 'note');
    wrap.dataset.referenceOnly = options.referenceOnly === false ? 'false' : 'true';
    var strong = el('strong', '', options.label || 'Parâmetro de referência: ');
    var span = el('span', '', text || '');
    wrap.appendChild(strong);
    wrap.appendChild(span);
    return wrap;
  };

  NS.createStatusControl = function (options) {
    options = options || {};
    var path = options.path || '';
    var choices = options.choices || [
      { value: 'C', label: 'Conforme' },
      { value: 'NC', label: 'Não conforme' },
      { value: 'NA', label: 'Não se aplica' }
    ];
    var current = options.value != null ? options.value : (path ? NS.get(path, '') : '');
    var wrap = el('div', 'fm-status-control');
    wrap.setAttribute('role', 'group');
    if (options.ariaLabel) wrap.setAttribute('aria-label', options.ariaLabel);

    function apply(value) {
      current = value;
      Array.prototype.forEach.call(wrap.querySelectorAll('button[data-value]'), function (button) {
        var selected = button.dataset.value === value;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      if (path) NS.set(path, value, { source: 'status-control' });
      if (typeof options.onChange === 'function') options.onChange(value);
      NS.emit('statuschange', { path: path, value: value });
    }

    choices.forEach(function (choice) {
      var button = el('button', 'fm-status-button', choice.label);
      button.type = 'button';
      button.dataset.value = choice.value;
      button.setAttribute('aria-pressed', choice.value === current ? 'true' : 'false');
      if (choice.value === current) button.classList.add('is-selected');
      button.addEventListener('click', function () { apply(choice.value); });
      wrap.appendChild(button);
    });

    wrap.getValue = function () { return current; };
    wrap.setValue = apply;
    return wrap;
  };

  NS.createApplicabilityControl = function (options) {
    options = options || {};
    var path = options.path || '';
    var isNA = options.value != null ? !!options.value : !!(path ? NS.get(path, false) : false);
    var wrap = el('div', 'fm-applicability-control');
    var button = el('button', 'fm-applicability-button', options.label || 'Não se aplica a esta inspeção');
    button.type = 'button';
    button.setAttribute('aria-pressed', isNA ? 'true' : 'false');
    wrap.appendChild(button);

    function updateTarget() {
      var target = options.target;
      if (!target) return;
      target.hidden = isNA;
      target.setAttribute('aria-hidden', isNA ? 'true' : 'false');
      target.classList.toggle('is-not-applicable', isNA);
    }

    function set(value) {
      isNA = !!value;
      button.classList.toggle('is-selected', isNA);
      button.setAttribute('aria-pressed', isNA ? 'true' : 'false');
      if (path) NS.set(path, isNA, { source: 'applicability-control' });
      updateTarget();
      if (typeof options.onChange === 'function') options.onChange(isNA);
      NS.emit('applicabilitychange', { path: path, notApplicable: isNA });
    }

    button.addEventListener('click', function () { set(!isNA); });
    set(isNA);
    wrap.getValue = function () { return isNA; };
    wrap.setValue = set;
    return wrap;
  };

  NS.createPhotoNotesControl = function (options) {
    options = options || {};
    var basePath = options.path || '';
    var wrap = el('div', 'fm-photo-notes');
    var actions = el('div', 'fm-photo-actions');
    var photoButton = el('label', 'fm-photo-button', options.photoLabel || '📷 Fotografar');
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = options.capture || 'environment';
    input.multiple = !!options.multiple;
    input.hidden = true;
    photoButton.appendChild(input);
    actions.appendChild(photoButton);

    var status = el('span', 'fm-photo-status', '');
    actions.appendChild(status);
    wrap.appendChild(actions);

    var label = el('label', 'fm-notes-label', options.notesLabel || 'Anotações');
    var textarea = document.createElement('textarea');
    textarea.className = 'fm-notes';
    textarea.rows = options.rows || 3;
    textarea.placeholder = options.placeholder || 'Anotações da equipe de inspeção';
    textarea.value = basePath ? NS.get(basePath + '.notes', '') : (options.notes || '');
    label.appendChild(textarea);
    wrap.appendChild(label);

    input.addEventListener('change', function () {
      var files = Array.prototype.slice.call(input.files || []);
      var meta = files.map(function (file) {
        return { name: file.name, type: file.type, size: file.size, lastModified: file.lastModified };
      });
      status.textContent = meta.length ? (meta.length + (meta.length === 1 ? ' foto selecionada' : ' fotos selecionadas')) : '';
      if (basePath) NS.set(basePath + '.photos', meta, { source: 'photo-selection' });
      NS.emit('photoselected', { path: basePath, files: files, metadata: meta });
      if (typeof options.onPhoto === 'function') options.onPhoto(files, meta);
    });

    textarea.addEventListener('input', function () {
      if (basePath) NS.set(basePath + '.notes', textarea.value, { source: 'notes' });
      if (typeof options.onNotes === 'function') options.onNotes(textarea.value);
    });

    wrap.photoInput = input;
    wrap.notesInput = textarea;
    return wrap;
  };

  NS.createRepeatableTable = function (options) {
    options = options || {};
    var path = options.path || '';
    var columns = options.columns || [];
    var rows = path ? NS.get(path, []) : clone(options.rows || []);
    if (!Array.isArray(rows)) rows = [];

    var wrap = el('div', 'fm-repeatable-table');
    var table = el('table', 'fm-table');
    var thead = document.createElement('thead');
    var headRow = document.createElement('tr');
    columns.forEach(function (column) {
      headRow.appendChild(el('th', '', column.label || column.key || ''));
    });
    headRow.appendChild(el('th', 'fm-table-actions-head', ''));
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = document.createElement('tbody');
    table.appendChild(tbody);
    wrap.appendChild(table);

    var addButton = el('button', 'fm-add-row', options.addLabel || '+ Adicionar');
    addButton.type = 'button';
    wrap.appendChild(addButton);

    function persist() {
      if (path) NS.set(path, rows, { source: 'repeatable-table' });
      if (typeof options.onChange === 'function') options.onChange(clone(rows));
    }

    function render() {
      NS.dom.clear(tbody);
      rows.forEach(function (row, rowIndex) {
        var tr = document.createElement('tr');
        columns.forEach(function (column) {
          var td = document.createElement('td');
          var input = column.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
          if (column.type !== 'textarea') input.type = column.type || 'text';
          input.className = 'fm-table-input';
          input.placeholder = column.placeholder || '';
          input.value = row && row[column.key] != null ? row[column.key] : '';
          input.addEventListener('input', function () {
            rows[rowIndex] = rows[rowIndex] || {};
            rows[rowIndex][column.key] = input.value;
            persist();
          });
          td.appendChild(input);
          tr.appendChild(td);
        });
        var actionTd = document.createElement('td');
        var remove = el('button', 'fm-remove-row', 'Remover');
        remove.type = 'button';
        remove.addEventListener('click', function () {
          rows.splice(rowIndex, 1);
          persist();
          render();
        });
        actionTd.appendChild(remove);
        tr.appendChild(actionTd);
        tbody.appendChild(tr);
      });
    }

    addButton.addEventListener('click', function () {
      var row = {};
      columns.forEach(function (column) { row[column.key] = ''; });
      rows.push(row);
      persist();
      render();
    });

    wrap.getRows = function () { return clone(rows); };
    wrap.setRows = function (nextRows) {
      rows = Array.isArray(nextRows) ? clone(nextRows) : [];
      persist();
      render();
    };
    render();
    return wrap;
  };

  NS.createInstrumentTable = function (options) {
    options = options || {};
    return NS.createRepeatableTable({
      path: options.path,
      addLabel: options.addLabel || '+ Adicionar instrumento',
      columns: options.columns || [
        { key: 'instrumento', label: 'Instrumento' },
        { key: 'identificacao', label: 'Identificação' },
        { key: 'certificado', label: 'Certificado nº' },
        { key: 'validade', label: 'Validade' },
        { key: 'emitidoPor', label: 'Emitido por' }
      ],
      onChange: options.onChange
    });
  };

  NS.createRefrigeratorCard = function (options) {
    options = options || {};
    var path = options.path || '';
    var wrap = el('section', 'fm-refrigerator-card');
    var title = el('h4', 'fm-card-title', options.title || 'Refrigerador');
    wrap.appendChild(title);

    var question = el('div', 'fm-inline-question');
    question.appendChild(el('span', 'fm-question-label', options.question || 'Possui refrigerador neste ambiente?'));
    var presence = NS.createStatusControl({
      path: path ? path + '.presenca' : '',
      choices: [
        { value: 'SIM', label: 'Sim' },
        { value: 'NAO', label: 'Não' }
      ]
    });
    question.appendChild(presence);
    wrap.appendChild(question);

    var details = el('div', 'fm-refrigerator-details');
    wrap.appendChild(details);

    function field(labelText, key, type) {
      var label = el('label', 'fm-field');
      label.appendChild(el('span', 'fm-field-label', labelText));
      var input = document.createElement('input');
      input.type = type || 'text';
      input.value = path ? NS.get(path + '.' + key, '') : '';
      input.addEventListener('input', function () {
        if (path) NS.set(path + '.' + key, input.value, { source: 'refrigerator' });
      });
      label.appendChild(input);
      return label;
    }

    var grid = el('div', 'fm-field-grid');
    grid.appendChild(field('Identificação', 'identificacao'));
    grid.appendChild(field('Uso / finalidade', 'finalidade'));
    grid.appendChild(field('Faixa/parâmetro adotado pelo estabelecimento', 'faixa'));
    grid.appendChild(field('Temperatura no momento (°C)', 'temperaturaMomento', 'number'));
    grid.appendChild(field('Máxima (°C)', 'temperaturaMaxima', 'number'));
    grid.appendChild(field('Mínima (°C)', 'temperaturaMinima', 'number'));
    grid.appendChild(field('Instrumento / termômetro', 'instrumento'));
    grid.appendChild(field('Identificação do instrumento', 'instrumentoId'));
    grid.appendChild(field('Certificado de calibração', 'certificado'));
    grid.appendChild(field('Validade da calibração', 'calibracaoValidade'));
    details.appendChild(grid);

    var checks = [
      { key: 'organizacao', label: 'Organização interna' },
      { key: 'segregacao', label: 'Segregação e identificação dos itens' },
      { key: 'limpeza', label: 'Limpeza / higienização' },
      { key: 'monitoramento', label: 'Monitoramento de temperatura' },
      { key: 'registros', label: 'Registros apresentados e preenchidos' },
      { key: 'acaoCorretiva', label: 'Campo/registro de ação corretiva quando necessário' }
    ];
    var checklist = el('div', 'fm-refrigerator-checklist');
    checks.forEach(function (item) {
      var row = el('div', 'fm-check-row');
      row.appendChild(el('span', 'fm-check-label', item.label));
      row.appendChild(NS.createStatusControl({ path: path ? path + '.checklist.' + item.key : '' }));
      checklist.appendChild(row);
    });
    details.appendChild(checklist);
    details.appendChild(NS.createPhotoNotesControl({ path: path ? path + '.evidenciaLocal' : '' }));

    function syncPresence(value) {
      var show = value === 'SIM';
      details.hidden = !show;
      details.setAttribute('aria-hidden', show ? 'false' : 'true');
    }
    syncPresence(presence.getValue());
    var originalSet = presence.setValue;
    presence.setValue = function (value) {
      originalSet(value);
      syncPresence(value);
    };
    presence.addEventListener('click', function () { syncPresence(presence.getValue()); });

    return wrap;
  };

  NS.createCopyButton = function (options) {
    options = options || {};
    var button = el('button', 'fm-copy-button', options.label || '📋 Copiar texto desta seção');
    button.type = 'button';
    button.addEventListener('click', function () {
      var text = typeof options.getText === 'function' ? String(options.getText() || '') : String(options.text || '');
      if (!text) return;
      var done = function () {
        button.classList.add('is-copied');
        var old = button.textContent;
        button.textContent = '✓ Texto copiado';
        window.setTimeout(function () {
          button.textContent = old;
          button.classList.remove('is-copied');
        }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
      } else {
        fallbackCopy(text, done);
      }
    });
    return button;
  };

  function fallbackCopy(text, done) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); if (done) done(); } catch (err) { console.warn(err); }
    document.body.removeChild(area);
  }

  NS.mount = function (target, renderer, options) {
    var node = typeof target === 'string' ? document.querySelector(target) : target;
    if (!node) throw new Error('FarmaciaManipulacao.mount: destino não encontrado.');
    if (typeof renderer !== 'function') throw new Error('FarmaciaManipulacao.mount: renderer inválido.');
    return renderer(node, options || {}, NS);
  };

  NS.registerPhotoAdapter = function (adapter) {
    if (adapter && typeof adapter === 'object') NS.photoAdapter = adapter;
    return NS.photoAdapter;
  };

  NS.registerOCRAdapter = function (adapter) {
    if (adapter && typeof adapter === 'object') NS.ocrAdapter = adapter;
    return NS.ocrAdapter;
  };

  // Regras explícitas do módulo: helpers informativos para os renderizadores.
  NS.rules = Object.freeze({
    automaticSanitaryJudgment: false,
    automaticNonCompliance: false,
    autoHideSectionsFromOtherAnswers: false,
    crtHasValidityField: false,
    sensitizerPressureOperationalReference: '-5 a -120 Pa',
    requireInspectorReviewBeforeOCRApply: true
  });

  NS.emit('core-ready', { version: NS.VERSION });
})(window, document);
