/* Farmácia de Manipulação — Seção 2: Edificações e Instalações */
(function (window, document) {
  'use strict';
  var FM = window.FarmaciaManipulacao;
  if (!FM) { console.error('[FarmaciaManipulacao] Core não carregado antes da Seção 2.'); return; }
  var BASE = 'sections.s2';
  var E = FM.dom.el;

  function card(title, subtitle) {
    var box = E('section', 'fm-section-card');
    box.appendChild(E('h3', 'fm-section-card-title', title));
    if (subtitle) box.appendChild(E('p', 'fm-section-card-subtitle', subtitle));
    return box;
  }
  function field(path, labelText, options) {
    options = options || {};
    var label = E('label', 'fm-field');
    label.appendChild(E('span', 'fm-field-label', labelText));
    var input = options.type === 'textarea' ? document.createElement('textarea') : document.createElement('input');
    if (options.type === 'textarea') input.rows = options.rows || 3;
    else input.type = options.type || 'text';
    input.className = 'fm-input';
    input.value = FM.get(path, '');
    input.addEventListener('input', function () { FM.set(path, input.value, { source: 'section2-field' }); });
    label.appendChild(input);
    return label;
  }
  function question(key, text, hint) {
    var row = E('article', 'fm-requirement-row');
    var head = E('div', 'fm-requirement-main');
    head.appendChild(E('div', 'fm-requirement-text', text));
    if (hint) head.appendChild(FM.requirementHint(hint));
    head.appendChild(FM.createStatusControl({ path: BASE + '.requirements.' + key + '.status', ariaLabel: text }));
    row.appendChild(head);
    var detail = document.createElement('details');
    detail.className = 'fm-requirement-details';
    var summary = document.createElement('summary');
    summary.textContent = 'Anotações e foto';
    detail.appendChild(summary);
    detail.appendChild(FM.createPhotoNotesControl({ path: BASE + '.requirements.' + key, multiple: true }));
    row.appendChild(detail);
    return row;
  }

  function render(target) {
    FM.dom.clear(target);
    target.classList.add('fm-manipulation-module', 'fm-section2');
    var header = E('header', 'fm-section-header');
    header.appendChild(E('h2', 'fm-section-title', '2. Edificações e Instalações'));
    header.appendChild(E('p', 'fm-section-intro', 'Caracterização geral do imóvel e condições estruturais. A análise documental de AVCB/CLCB permanece na Seção 7.'));
    target.appendChild(header);

    var description = card('2.1 Caracterização do imóvel', 'Registrar o que existe fisicamente; a conformidade é avaliada no checklist abaixo.');
    var grid = E('div', 'fm-field-grid');
    [
      [BASE + '.caracterizacao.tipoImovel', 'Tipo de imóvel'],
      [BASE + '.caracterizacao.pavimentos', 'Número de pavimentos'],
      [BASE + '.caracterizacao.acesso', 'Acesso livre / independente'],
      [BASE + '.caracterizacao.comunicacao', 'Comunicação com outro estabelecimento ou residência'],
      [BASE + '.caracterizacao.identificacao', 'Identificação externa / placa'],
      [BASE + '.caracterizacao.caixaAgua', 'Localização / informação estrutural da caixa d’água'],
      [BASE + '.caracterizacao.particularidades', 'Particularidades estruturais', { type: 'textarea', rows: 3 }]
    ].forEach(function (item) { grid.appendChild(field(item[0], item[1], item[2])); });
    description.appendChild(grid);
    description.appendChild(FM.createPhotoNotesControl({ path: BASE + '.caracterizacao.registros', multiple: true, notesLabel: 'Anotações gerais / fachada / circulação' }));
    target.appendChild(description);

    var checklist = card('2.2 Condições estruturais');
    [
      ['fontesContaminantes', 'O estabelecimento está protegido de fontes contaminantes ou poluentes incompatíveis com a atividade?'],
      ['superficies', 'Paredes, pisos e tetos possuem superfícies lisas, impermeáveis, laváveis e sem rachaduras que comprometam a higienização?'],
      ['conservacao', 'As instalações estão limpas e em bom estado de conservação?'],
      ['eletrica', 'As instalações elétricas estão em condições adequadas de conservação e segurança?'],
      ['hidraulica', 'As instalações hidráulicas estão em boas condições, sem vazamentos ou situações que comprometam as atividades?'],
      ['fluxo', 'O layout e o fluxo das operações evitam misturas, trocas e contaminação?'],
      ['iluminacao', 'A iluminação é suficiente e compatível com as operações realizadas?'],
      ['ventilacao', 'A ventilação/climatização é compatível com as atividades e ambientes?'],
      ['apoio', 'Áreas de repouso/refeitório, quando existentes, estão separadas das áreas técnicas?'],
      ['incendio', 'Os sistemas e equipamentos de combate a incêndio observados estão instalados e em condições físicas adequadas?'],
      ['identificacaoPublico', 'A identificação do estabelecimento é visível ao público?']
    ].forEach(function (item) { checklist.appendChild(question(item[0], item[1])); });
    target.appendChild(checklist);

    var relation = card('2.3 Documentos relacionados', 'Nesta seção verifica-se a condição física. A documentação comprobatória é analisada uma única vez na Seção 7.');
    relation.appendChild(E('p', 'fm-helper-text', 'AVCB/CLCB, comprovantes estruturais, planta/croqui e documentos correlatos não são relidos aqui. O aplicativo poderá exibir o status desses documentos por vínculo, sem duplicar armazenamento ou análise.'));
    target.appendChild(relation);

    FM.emit('section-rendered', { section: 2, target: target });
    return target;
  }

  FM.sections = FM.sections || {};
  FM.sections.section2 = { id: 'section2', title: 'Edificações e Instalações', render: render, statePath: BASE };
  FM.renderSection2 = render;
})(window, document);