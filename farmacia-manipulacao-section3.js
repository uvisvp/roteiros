/* Farmácia de Manipulação — Seção 3: Pessoal, Saúde Ocupacional e Treinamento */
(function (window, document) {
  'use strict';
  var FM = window.FarmaciaManipulacao;
  if (!FM) { console.error('[FarmaciaManipulacao] Core não carregado antes da Seção 3.'); return; }
  var BASE = 'sections.s3';
  var E = FM.dom.el;

  function card(title, subtitle) {
    var box = E('section', 'fm-section-card');
    box.appendChild(E('h3', 'fm-section-card-title', title));
    if (subtitle) box.appendChild(E('p', 'fm-section-card-subtitle', subtitle));
    return box;
  }
  function question(path, text, options) {
    options = options || {};
    var row = E('article', 'fm-requirement-row');
    var main = E('div', 'fm-requirement-main');
    main.appendChild(E('div', 'fm-requirement-text', text));
    if (options.hint) main.appendChild(FM.requirementHint(options.hint));
    main.appendChild(FM.createStatusControl({ path: path + '.status', ariaLabel: text }));
    row.appendChild(main);
    var detail = document.createElement('details');
    detail.className = 'fm-requirement-details';
    var summary = document.createElement('summary');
    summary.textContent = 'Anotações e foto';
    detail.appendChild(summary);
    detail.appendChild(FM.createPhotoNotesControl({ path: path, multiple: true }));
    row.appendChild(detail);
    return row;
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
    input.addEventListener('input', function () { FM.set(path, input.value, { source: 'section3-field' }); });
    label.appendChild(input);
    return label;
  }
  function ocrButton(label, documentType, destination) {
    var button = E('button', 'fm-secondary-button', label);
    button.type = 'button';
    button.addEventListener('click', function () {
      FM.emit('ocr-request', { documentType: documentType, destination: destination, source: 'file-or-camera' });
    });
    return button;
  }
  function conditionalBlock(title, applicabilityPath, content) {
    var box = card(title);
    var body = E('div', 'fm-conditional-body');
    box.appendChild(FM.createApplicabilityControl({ path: applicabilityPath, target: body, label: 'Não se aplica a esta inspeção' }));
    content(body);
    box.appendChild(body);
    return box;
  }

  function render(target) {
    FM.dom.clear(target);
    target.classList.add('fm-manipulation-module', 'fm-section3');
    var header = E('header', 'fm-section-header');
    header.appendChild(E('h2', 'fm-section-title', '3. Pessoal, Saúde Ocupacional e Treinamento'));
    header.appendChild(E('p', 'fm-section-intro', 'ASO possui leitor de extração de dados. PCMSO, PGR e treinamentos são avaliados por checklist, sem OCR de conteúdo.'));
    target.appendChild(header);

    var staff = card('3.1 Pessoal e organização');
    [
      ['organograma', 'A farmácia possui estrutura organizacional/organograma compatível com as atividades e pessoal suficiente?'],
      ['atribuicoes', 'As atribuições e responsabilidades individuais estão formalmente descritas, sem sobreposição inadequada?'],
      ['admissao', 'A admissão é precedida de exames médicos e há avaliações periódicas conforme o programa ocupacional?'],
      ['afastamento', 'Há previsão de afastamento quando lesão exposta ou enfermidade puder comprometer a preparação?'],
      ['adornos', 'É observada a proibição de cosméticos, joias e adornos nas áreas de pesagem e manipulação?'],
      ['comida', 'É observada a proibição de comer, beber, fumar, mascar ou manter alimentos/objetos pessoais/medicamentos nas áreas de pesagem e manipulação?'],
      ['risco', 'Os trabalhadores são orientados a comunicar condições de risco relacionadas a produto, ambiente, equipamento ou pessoal?'],
      ['epi', 'A farmácia fornece EPI gratuitamente, em quantidade suficiente e com reposição periódica?'],
      ['paramentacao', 'Os trabalhadores da manipulação utilizam paramentação/EPI adequados e realizam higiene de mãos e antebraços antes das atividades?']
    ].forEach(function (item) { staff.appendChild(question(BASE + '.pessoal.' + item[0], item[1])); });
    target.appendChild(staff);

    var health = card('3.2 Saúde ocupacional');
    var aso = E('div', 'fm-subcard');
    aso.appendChild(E('h4', 'fm-option-group-title', 'Atestados de Saúde Ocupacional — ASO'));
    var actions = E('div', 'fm-document-actions');
    actions.appendChild(ocrButton('📄 Selecionar / fotografar ASO', 'aso', BASE + '.saude.asos'));
    actions.appendChild(E('span', 'fm-helper-text', 'O leitor deve apenas extrair dados estruturados; a equipe confere antes de aplicar.'));
    aso.appendChild(actions);
    aso.appendChild(FM.createRepeatableTable({
      path: BASE + '.saude.asos',
      addLabel: '+ Adicionar ASO manualmente',
      columns: [
        { key: 'funcionario', label: 'Funcionário' },
        { key: 'cpf', label: 'CPF' },
        { key: 'funcao', label: 'Função' },
        { key: 'tipoExame', label: 'Tipo de exame' },
        { key: 'dataExame', label: 'Data' },
        { key: 'riscos', label: 'Riscos / agentes' },
        { key: 'aptidao', label: 'Apto / inapto' },
        { key: 'medico', label: 'Médico / CRM' }
      ]
    }));
    health.appendChild(aso);

    var pcmso = E('div', 'fm-subcard');
    pcmso.appendChild(E('h4', 'fm-option-group-title', 'PCMSO — checklist, sem OCR'));
    pcmso.appendChild(question(BASE + '.saude.pcmso.apresentado', 'PCMSO foi apresentado e está dentro do período informado no documento?'));
    [
      ['identificacao', 'Identifica o estabelecimento e o responsável/coordenador do programa?'],
      ['riscos', 'Contém reconhecimento/análise dos riscos ocupacionais e riscos por função?'],
      ['exames', 'Define exames clínicos/complementares e respectivas periodicidades?'],
      ['planejamento', 'Contém planejamento, medidas preventivas e recomendações à empresa?']
    ].forEach(function (item) { pcmso.appendChild(question(BASE + '.saude.pcmso.' + item[0], item[1])); });
    health.appendChild(pcmso);

    var pgr = E('div', 'fm-subcard');
    pgr.appendChild(E('h4', 'fm-option-group-title', 'PGR — checklist, sem OCR'));
    pgr.appendChild(question(BASE + '.saude.pgr.apresentado', 'PGR foi apresentado e está dentro do período informado no documento?'));
    [
      ['identificacao', 'Contém identificação da empresa, responsáveis/avaliadores e escopo?'],
      ['avaliacao', 'Contém avaliação e inventário de riscos, instrumentos/métodos e antecipação de riscos?'],
      ['controle', 'Define metas/prioridades de controle, medidas de prevenção/mitigação e recomendações?'],
      ['funcoes', 'Relaciona riscos por função e por ambiente de trabalho?']
    ].forEach(function (item) { pgr.appendChild(question(BASE + '.saude.pgr.' + item[0], item[1])); });
    health.appendChild(pgr);
    target.appendChild(health);

    var training = card('3.3 Treinamentos', 'Os documentos de treinamento não serão submetidos a OCR; a equipe confere os registros e a efetividade.');
    [
      ['programa', 'Há programa de treinamento baseado em levantamento das necessidades?'],
      ['conteudoRegistro', 'Os registros contêm atividade/tema, data, carga horária, conteúdo, trabalhadores treinados, assinaturas e identificação de quem treinou?'],
      ['inicialContinuado', 'Todo o pessoal, inclusive limpeza e manutenção, recebe treinamento inicial e continuado em higiene, saúde, conduta e microbiologia?'],
      ['especificos', 'São realizados treinamentos específicos para os anexos aplicáveis — sensibilizantes, SBIT e homeopatia?'],
      ['acidentes', 'Os treinamentos incluem procedimentos em caso de acidente/incidente e informações sobre riscos?'],
      ['efetividade', 'A efetividade dos treinamentos é avaliada?']
    ].forEach(function (item) { training.appendChild(question(BASE + '.treinamentos.' + item[0], item[1])); });
    training.appendChild(E('h4', 'fm-option-group-title', 'Registros de treinamento verificados'));
    training.appendChild(FM.createRepeatableTable({
      path: BASE + '.treinamentos.registros',
      addLabel: '+ Adicionar treinamento',
      columns: [
        { key: 'tema', label: 'Tema' },
        { key: 'data', label: 'Data', type: 'date' },
        { key: 'cargaHoraria', label: 'Carga horária' },
        { key: 'numeroTreinados', label: 'Nº treinados', type: 'number' },
        { key: 'efetividade', label: 'Efetividade avaliada?' },
        { key: 'observacoes', label: 'Anotações' }
      ]
    }));
    target.appendChild(training);

    target.appendChild(conditionalBlock('3.4 Requisitos ocupacionais específicos — Anexo III', BASE + '.anexoIII.naoSeAplica', function (body) {
      body.appendChild(E('p', 'fm-helper-text', 'A aplicabilidade é decidida aqui. A seção não é ocultada com base em respostas de outras telas nem pela situação da licença.'));
      body.appendChild(question(BASE + '.anexoIII.exames', 'Os trabalhadores diretamente envolvidos são submetidos a exames médicos específicos previstos no PCMSO, conforme a atividade?'));
      body.appendChild(question(BASE + '.anexoIII.comunicacao', 'Os responsáveis pela elaboração do PCMSO foram informados sobre a manipulação das substâncias abrangidas?'));
    }));

    var notes = card('3.5 Registros gerais da seção');
    notes.appendChild(FM.createPhotoNotesControl({ path: BASE + '.registrosGerais', multiple: true, rows: 4 }));
    target.appendChild(notes);

    FM.emit('section-rendered', { section: 3, target: target });
    return target;
  }

  FM.sections = FM.sections || {};
  FM.sections.section3 = { id: 'section3', title: 'Pessoal, Saúde Ocupacional e Treinamento', render: render, statePath: BASE };
  FM.renderSection3 = render;
})(window, document);