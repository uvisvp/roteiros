/* Farmácia de Manipulação — componentes visuais reutilizáveis. */
(() => {
  'use strict';
  if (window.ManipulacaoUI) return;

  const core = () => window.ManipulacaoCore;
  const e = value => core().esc(value);
  const val = (path, fallback = '') => core().field(path, fallback);

  function input(path, label, options = {}) {
    const type = options.type || 'text';
    const value = val(path, options.value ?? '');
    const attrs = [
      options.placeholder ? 'placeholder="' + e(options.placeholder) + '"' : '',
      options.inputmode ? 'inputmode="' + e(options.inputmode) + '"' : '',
      options.step ? 'step="' + e(options.step) + '"' : '',
      options.min != null ? 'min="' + e(options.min) + '"' : '',
      options.max != null ? 'max="' + e(options.max) + '"' : '',
      options.autocomplete ? 'autocomplete="' + e(options.autocomplete) + '"' : ''
    ].filter(Boolean).join(' ');
    return '<label class="manip-field"><span>' + e(label) + '</span><input type="' + e(type) + '" data-manip-field="' + e(path) + '" value="' + e(value) + '" ' + attrs + '></label>';
  }

  function textarea(path, label, options = {}) {
    return '<label class="manip-field manip-field-wide"><span>' + e(label) + '</span><textarea data-manip-field="' + e(path) + '" rows="' + e(options.rows || 3) + '" placeholder="' + e(options.placeholder || '') + '">' + e(val(path, '')) + '</textarea></label>';
  }

  function select(path, label, options = [], config = {}) {
    const current = String(val(path, ''));
    const normalized = options.map(option => Array.isArray(option) ? option : [option, option]);
    const empty = config.empty === false ? '' : '<option value="">' + e(config.emptyLabel || 'Selecione') + '</option>';
    return '<label class="manip-field"><span>' + e(label) + '</span><select data-manip-field="' + e(path) + '">' + empty + normalized.map(([value, text]) =>
      '<option value="' + e(value) + '"' + (current === String(value) ? ' selected' : '') + '>' + e(text) + '</option>'
    ).join('') + '</select></label>';
  }

  function checkbox(path, label, description = '') {
    const checked = !!val(path, false);
    return '<label class="manip-check"><input type="checkbox" data-manip-field="' + e(path) + '"' + (checked ? ' checked' : '') + '><span><b>' + e(label) + '</b>' + (description ? '<small>' + e(description) + '</small>' : '') + '</span></label>';
  }

  function choice(path, options = [['c','Conforme'],['nc','Não conforme'],['na','Não se aplica']], config = {}) {
    const current = String(val(path, ''));
    return '<div class="manip-answers" role="group" aria-label="' + e(config.label || 'Situação') + '">' + options.map(([value, text]) =>
      '<button type="button" data-manip-answer="' + e(path + '|' + value) + '" aria-pressed="' + (current === String(value)) + '" data-value="' + e(value) + '">' + e(text) + '</button>'
    ).join('') + '</div>';
  }

  function requirement(text, source = '') {
    if (!text) return '';
    return '<div class="manip-requirement"><b>Requisito informado:</b> ' + e(text) + (source ? '<small>' + e(source) + '</small>' : '') + '</div>';
  }

  function photoNotes(key, notesPath, config = {}) {
    return '<div class="manip-photo-notes"><button type="button" data-manip-photo="' + e(key) + '" title="Fotografar">📷 Foto</button>' +
      '<label><span>Anotações</span><textarea data-manip-field="' + e(notesPath) + '" rows="' + e(config.rows || 2) + '" placeholder="' + e(config.placeholder || 'Anotações da equipe') + '">' + e(val(notesPath, '')) + '</textarea></label></div>';
  }

  function question(config) {
    const answers = config.answers || [['c','Conforme'],['nc','Não conforme'],['na','Não se aplica']];
    return '<article class="manip-question" data-question-id="' + e(config.id || '') + '">' +
      '<div class="manip-question-text"><b>' + e(config.text) + '</b>' + (config.help ? '<p>' + e(config.help) + '</p>' : '') + '</div>' +
      (config.requirement ? requirement(config.requirement, config.requirementSource || '') : '') +
      choice(config.answerPath, answers, { label: config.text }) +
      photoNotes(config.photoKey || config.id || config.answerPath, config.notesPath || config.answerPath.replace(/\.answers\./, '.notes.') + '_nota') +
      '</article>';
  }

  function localApplicability(path, label = 'Esta subseção se aplica à inspeção?') {
    const current = String(val(path, ''));
    return '<div class="manip-applicability"><b>' + e(label) + '</b>' +
      '<div class="manip-answers"><button type="button" data-manip-answer="' + e(path + '|sim') + '" aria-pressed="' + (current === 'sim') + '">Aplicável</button>' +
      '<button type="button" data-manip-answer="' + e(path + '|na') + '" aria-pressed="' + (current === 'na') + '">Não se aplica</button></div></div>';
  }

  function monitoring(basePath, config = {}) {
    const title = config.title || 'Monitoramento ambiental';
    const temp = basePath + '.temperatura';
    const hum = basePath + '.umidade';
    const inst = basePath + '.instrumento';
    return '<section class="manip-subcard"><h4>' + e(title) + '</h4>' +
      '<div class="manip-monitor-grid"><div><b>Temperatura (°C)</b>' +
        input(temp + '.faixa_min', 'Parâmetro mínimo', { type: 'number', step: '0.1' }) + input(temp + '.faixa_max', 'Parâmetro máximo', { type: 'number', step: '0.1' }) +
        input(temp + '.momento', 'Momento', { type: 'number', step: '0.1' }) + input(temp + '.maxima', 'Máxima', { type: 'number', step: '0.1' }) + input(temp + '.minima', 'Mínima', { type: 'number', step: '0.1' }) + '</div>' +
      '<div><b>Umidade relativa (%)</b>' +
        input(hum + '.faixa_min', 'Parâmetro mínimo', { type: 'number', step: '0.1' }) + input(hum + '.faixa_max', 'Parâmetro máximo', { type: 'number', step: '0.1' }) +
        input(hum + '.momento', 'Momento', { type: 'number', step: '0.1' }) + input(hum + '.maxima', 'Máxima', { type: 'number', step: '0.1' }) + input(hum + '.minima', 'Mínima', { type: 'number', step: '0.1' }) + '</div></div>' +
      '<div class="manip-grid">' + input(inst + '.tipo', 'Instrumento', { placeholder: 'Termo-higrômetro' }) + input(inst + '.identificacao', 'Identificação') + input(inst + '.certificado', 'Certificado de calibração') + input(inst + '.validade', 'Validade da calibração', { type: 'date' }) + '</div>' +
      photoNotes(basePath + '.monitoramento', basePath + '.anotacoes') + '</section>';
  }

  function calibration(basePath, equipmentLabel = 'Equipamento') {
    return '<div class="manip-grid">' +
      input(basePath + '.equipamento', equipmentLabel) + input(basePath + '.identificacao', 'Identificação') +
      input(basePath + '.certificado', 'Certificado nº') + input(basePath + '.validade', 'Validade', { type: 'date' }) + input(basePath + '.emitido_por', 'Emitido por') +
      '</div>';
  }

  function refrigerator(basePath, config = {}) {
    const hasPath = basePath + '.possui';
    const has = String(val(hasPath, ''));
    let details = '';
    if (has === 'sim') {
      details = '<div class="manip-refrigerator-details">' +
        '<div class="manip-grid">' + input(basePath + '.identificacao', 'Identificação do refrigerador') + input(basePath + '.finalidade', 'Uso / finalidade') +
        input(basePath + '.faixa_min', 'Faixa mínima adotada (°C)', { type: 'number', step: '0.1' }) + input(basePath + '.faixa_max', 'Faixa máxima adotada (°C)', { type: 'number', step: '0.1' }) +
        input(basePath + '.momento', 'Temperatura no momento (°C)', { type: 'number', step: '0.1' }) + input(basePath + '.maxima', 'Máxima (°C)', { type: 'number', step: '0.1' }) + input(basePath + '.minima', 'Mínima (°C)', { type: 'number', step: '0.1' }) + '</div>' +
        question({ id: basePath + '.organizacao', text: 'O refrigerador está organizado, com itens identificados e segregados de forma adequada?', answerPath: basePath + '.answers.organizacao', notesPath: basePath + '.notes.organizacao' }) +
        question({ id: basePath + '.limpeza', text: 'A limpeza/higienização está adequada e possui registro quando previsto?', answerPath: basePath + '.answers.limpeza', notesPath: basePath + '.notes.limpeza' }) +
        question({ id: basePath + '.registros', text: 'O monitoramento de temperatura está registrado e atualizado, com campo para ação corretiva?', answerPath: basePath + '.answers.registros', notesPath: basePath + '.notes.registros' }) +
        '<h5>Instrumento de medição</h5>' + calibration(basePath + '.termometro', 'Termômetro / registrador') +
        textarea(basePath + '.acao_corretiva', 'Ação corretiva / observações de desvio') +
        photoNotes(basePath + '.foto', basePath + '.anotacoes') + '</div>';
    }
    return '<section class="manip-subcard manip-refrigerator"><h4>' + e(config.title || 'Refrigerador') + '</h4>' +
      '<div class="manip-applicability"><b>Possui refrigerador neste ambiente?</b>' + choice(hasPath, [['sim','Sim'],['nao','Não']]) + '</div>' + details + '</section>';
  }

  function info(message) { return '<p class="manip-info">' + e(message) + '</p>'; }
  function grid(content, cls = '') { return '<div class="manip-grid ' + e(cls) + '">' + content + '</div>'; }
  function box(title, content, config = {}) {
    return '<section class="manip-box' + (config.className ? ' ' + e(config.className) : '') + '">' + (title ? '<h3>' + e(title) + '</h3>' : '') + content + '</section>';
  }

  window.ManipulacaoUI = Object.freeze({
    input, textarea, select, checkbox, choice, requirement, question,
    photoNotes, localApplicability, monitoring, calibration, refrigerator,
    info, grid, box
  });
})();
