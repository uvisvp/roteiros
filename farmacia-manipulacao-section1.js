/*
 * Farmácia de Manipulação — Seção 1
 * Identificação do estabelecimento e informações gerais.
 * Depende de farmacia-manipulacao-core.js.
 */
(function (window, document) {
  'use strict';

  var FM = window.FarmaciaManipulacao;
  if (!FM) {
    console.error('[FarmaciaManipulacao] Core não carregado antes da Seção 1.');
    return;
  }

  var BASE = 'sections.s1';

  function E(tag, className, text) {
    return FM.dom.el(tag, className, text);
  }

  function sectionCard(title, subtitle) {
    var card = E('section', 'fm-section-card');
    card.appendChild(E('h3', 'fm-section-card-title', title));
    if (subtitle) card.appendChild(E('p', 'fm-section-card-subtitle', subtitle));
    return card;
  }

  function field(path, labelText, options) {
    options = options || {};
    var label = E('label', 'fm-field');
    label.appendChild(E('span', 'fm-field-label', labelText));
    var input;
    if (options.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = options.rows || 3;
    } else if (options.type === 'select') {
      input = document.createElement('select');
      (options.options || []).forEach(function (opt) {
        var option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        input.appendChild(option);
      });
    } else {
      input = document.createElement('input');
      input.type = options.type || 'text';
    }
    input.className = 'fm-input';
    input.placeholder = options.placeholder || '';
    input.value = FM.get(path, options.defaultValue || '');
    if (options.autocomplete) input.autocomplete = options.autocomplete;
    if (options.inputMode) input.inputMode = options.inputMode;
    input.addEventListener(options.type === 'select' ? 'change' : 'input', function () {
      FM.set(path, input.value, { source: 'section1-field' });
      FM.emit('section1-fieldchange', { path: path, value: input.value });
    });
    label.appendChild(input);
    label.input = input;
    return label;
  }

  function checkbox(path, labelText) {
    var label = E('label', 'fm-checkbox');
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!FM.get(path, false);
    input.addEventListener('change', function () {
      FM.set(path, input.checked, { source: 'section1-checkbox' });
    });
    label.appendChild(input);
    label.appendChild(E('span', '', labelText));
    return label;
  }

  function grid() {
    return E('div', 'fm-field-grid');
  }

  function appendFields(target, fields) {
    fields.forEach(function (item) { target.appendChild(item); });
  }

  function actionButton(label, eventName, detail) {
    var button = E('button', 'fm-secondary-button', label);
    button.type = 'button';
    button.addEventListener('click', function () {
      FM.emit(eventName, detail || {});
    });
    return button;
  }

  function ocrActions(documentType, destination) {
    var actions = E('div', 'fm-document-actions');
    actions.appendChild(actionButton('📄 Selecionar documento', 'ocr-request', {
      documentType: documentType,
      destination: destination,
      source: 'file'
    }));
    actions.appendChild(actionButton('📷 Fotografar documento', 'ocr-request', {
      documentType: documentType,
      destination: destination,
      source: 'camera'
    }));
    var note = E('span', 'fm-helper-text', 'A extração só é aplicada após conferência da equipe.');
    actions.appendChild(note);
    return actions;
  }

  function lookupButton(label, lookupType, destination) {
    return actionButton(label, 'lookup-request', {
      lookupType: lookupType,
      destination: destination
    });
  }

  function optionGroup(title, basePath, values) {
    var wrap = E('div', 'fm-option-group');
    wrap.appendChild(E('h4', 'fm-option-group-title', title));
    var list = E('div', 'fm-checkbox-grid');
    values.forEach(function (item) {
      list.appendChild(checkbox(basePath + '.' + item.key, item.label));
    });
    wrap.appendChild(list);
    return wrap;
  }

  function compareSources(container) {
    FM.dom.clear(container);
    container.appendChild(E('h4', 'fm-option-group-title', 'Conferência entre fontes'));
    container.appendChild(E('p', 'fm-helper-text', 'O sistema apenas aponta diferenças. A equipe escolhe qual informação aplicar.'));

    var comparisons = [
      {
        label: 'CNPJ',
        sources: [
          ['Identificação', FM.get(BASE + '.estabelecimento.cnpj', '')],
          ['Licença Sanitária', FM.get(BASE + '.licenca.cnpj', '')],
          ['CRT/CRF', FM.get(BASE + '.crt.cnpj', '')]
        ]
      },
      {
        label: 'Razão social',
        sources: [
          ['Identificação', FM.get(BASE + '.estabelecimento.razaoSocial', '')],
          ['Licença Sanitária', FM.get(BASE + '.licenca.titular', '')],
          ['CRT/CRF', FM.get(BASE + '.crt.razaoSocial', '')]
        ]
      },
      {
        label: 'Responsável técnico principal',
        sources: [
          ['Cadastro da inspeção', FM.get(BASE + '.rt.nome', '')],
          ['Licença Sanitária', FM.get(BASE + '.licenca.rtNome', '')],
          ['CRT/CRF', FM.get(BASE + '.crt.rtNome', '')]
        ]
      }
    ];

    comparisons.forEach(function (entry) {
      var values = entry.sources.filter(function (source) { return String(source[1] || '').trim(); });
      if (!values.length) return;
      var unique = [];
      values.forEach(function (source) {
        var normalized = String(source[1]).trim().toUpperCase();
        if (unique.indexOf(normalized) < 0) unique.push(normalized);
      });
      var row = E('div', 'fm-source-comparison');
      row.appendChild(E('strong', '', entry.label + ': '));
      row.appendChild(E('span', unique.length > 1 ? 'fm-conflict' : 'fm-consistent', unique.length > 1 ? '⚠️ Divergência entre fontes' : '✓ Valores compatíveis'));
      var details = E('ul', 'fm-source-values');
      values.forEach(function (source) {
        details.appendChild(E('li', '', source[0] + ': ' + source[1]));
      });
      row.appendChild(details);
      container.appendChild(row);
    });
  }

  function render(target) {
    FM.dom.clear(target);
    target.classList.add('fm-manipulation-module', 'fm-section1');

    var header = E('header', 'fm-section-header');
    header.appendChild(E('h2', 'fm-section-title', '1. Identificação do Estabelecimento e Informações Gerais'));
    header.appendChild(E('p', 'fm-section-intro', 'Dados da inspeção, identificação, responsabilidade técnica, situação regulatória e perfil da manipulação.'));
    target.appendChild(header);

    var context = sectionCard('1.1 Contexto da inspeção');
    var contextGrid = grid();
    appendFields(contextGrid, [
      field(BASE + '.contexto.objetivo', 'Objetivo da inspeção', { type: 'textarea', rows: 2 }),
      field(BASE + '.contexto.protocolos', 'Protocolos / SEI'),
      field(BASE + '.contexto.data', 'Data da inspeção', { type: 'date' }),
      field(BASE + '.contexto.equipe', 'Equipe inspetora'),
      field(BASE + '.contexto.contatos', 'Pessoas contatadas no estabelecimento', { type: 'textarea', rows: 2 }),
      field(BASE + '.contexto.observacaoContatos', 'Observação sobre os contatos', { placeholder: 'Ex.: pessoas contatadas não correspondem aos responsáveis técnicos' })
    ]);
    context.appendChild(contextGrid);
    target.appendChild(context);

    var estabelecimento = sectionCard('1.2 Estabelecimento');
    var estGrid = grid();
    appendFields(estGrid, [
      field(BASE + '.estabelecimento.razaoSocial', 'Razão social'),
      field(BASE + '.estabelecimento.nomeFantasia', 'Nome fantasia'),
      field(BASE + '.estabelecimento.cnpj', 'CNPJ', { inputMode: 'numeric' }),
      field(BASE + '.estabelecimento.ie', 'Inscrição Estadual'),
      field(BASE + '.estabelecimento.endereco', 'Endereço completo'),
      field(BASE + '.estabelecimento.telefone', 'Telefone'),
      field(BASE + '.estabelecimento.email', 'E-mail', { type: 'email' })
    ]);
    estabelecimento.appendChild(estGrid);
    var estActions = E('div', 'fm-document-actions');
    estActions.appendChild(lookupButton('Consultar CNPJ', 'cnpj', BASE + '.estabelecimento'));
    estabelecimento.appendChild(estActions);
    target.appendChild(estabelecimento);

    var legal = sectionCard('1.3 Responsável legal');
    var legalGrid = grid();
    appendFields(legalGrid, [
      field(BASE + '.responsavelLegal.nome', 'Nome'),
      field(BASE + '.responsavelLegal.cpf', 'CPF', { inputMode: 'numeric' })
    ]);
    legal.appendChild(legalGrid);
    target.appendChild(legal);

    var rt = sectionCard('1.4 Responsabilidade técnica');
    var rtGrid = grid();
    appendFields(rtGrid, [
      field(BASE + '.rt.nome', 'Responsável técnico principal'),
      field(BASE + '.rt.crf', 'CRF'),
      field(BASE + '.rt.uf', 'UF'),
      field(BASE + '.rt.horario', 'Horário de assistência farmacêutica')
    ]);
    rt.appendChild(rtGrid);
    rt.appendChild(E('h4', 'fm-option-group-title', 'Responsáveis técnicos substitutos'));
    rt.appendChild(FM.createRepeatableTable({
      path: BASE + '.rt.substitutos',
      addLabel: '+ Adicionar substituto',
      columns: [
        { key: 'nome', label: 'Nome' },
        { key: 'crf', label: 'CRF' },
        { key: 'uf', label: 'UF' },
        { key: 'horario', label: 'Horário próprio de assistência' }
      ]
    }));
    target.appendChild(rt);

    var licenca = sectionCard('1.5 Licença Sanitária', 'Os dados extraídos do documento ficam disponíveis para conferência antes de serem aplicados.');
    licenca.appendChild(ocrActions('licenca-sanitaria', BASE + '.licenca'));
    var licGrid = grid();
    appendFields(licGrid, [
      field(BASE + '.licenca.numero', 'CMVS / CEVS'),
      field(BASE + '.licenca.validade', 'Validade', { type: 'date' }),
      field(BASE + '.licenca.titular', 'Titular / Razão social'),
      field(BASE + '.licenca.cnpj', 'CNPJ'),
      field(BASE + '.licenca.atividades', 'Atividades licenciadas', { type: 'textarea', rows: 3 }),
      field(BASE + '.licenca.grupos', 'Grupos / categorias autorizados', { type: 'textarea', rows: 3 }),
      field(BASE + '.licenca.rtNome', 'RT constante da licença'),
      field(BASE + '.licenca.rtCrf', 'CRF do RT')
    ]);
    licenca.appendChild(licGrid);
    target.appendChild(licenca);

    var crt = sectionCard('1.6 Certidão de Regularidade Técnica — CRT/CRF', 'A CRT não possui campo de validade neste módulo. Quando constar, registrar a data de emissão.');
    crt.appendChild(ocrActions('crt-crf', BASE + '.crt'));
    var crtGrid = grid();
    appendFields(crtGrid, [
      field(BASE + '.crt.numeroCertidao', 'Número da certidão'),
      field(BASE + '.crt.razaoSocial', 'Empresa / razão social'),
      field(BASE + '.crt.cnpj', 'CNPJ'),
      field(BASE + '.crt.ramoAtividade', 'Ramo de atividade'),
      field(BASE + '.crt.horarioEstabelecimento', 'Horário do estabelecimento', { type: 'textarea', rows: 2 }),
      field(BASE + '.crt.rtNome', 'Responsável técnico principal'),
      field(BASE + '.crt.rtCrf', 'CRF do RT principal'),
      field(BASE + '.crt.rtHorario', 'Horário de assistência do RT principal'),
      field(BASE + '.crt.dataEmissao', 'Data de emissão', { type: 'date' })
    ]);
    crt.appendChild(crtGrid);
    crt.appendChild(E('h4', 'fm-option-group-title', 'Substitutos constantes da CRT'));
    crt.appendChild(FM.createRepeatableTable({
      path: BASE + '.crt.substitutos',
      addLabel: '+ Adicionar substituto da CRT',
      columns: [
        { key: 'nome', label: 'Nome' },
        { key: 'crf', label: 'CRF' },
        { key: 'horario', label: 'Horário próprio' }
      ]
    }));
    target.appendChild(crt);

    var autorizacoes = sectionCard('1.7 Autorizações sanitárias — AFE e AE');
    var afeBlock = E('div', 'fm-subcard');
    afeBlock.appendChild(E('h4', 'fm-option-group-title', 'AFE'));
    var afeActions = E('div', 'fm-document-actions');
    afeActions.appendChild(lookupButton('Consultar AFE na base regulatória', 'afe', BASE + '.afe'));
    afeBlock.appendChild(afeActions);
    var afeGrid = grid();
    appendFields(afeGrid, [
      field(BASE + '.afe.numero', 'Número / autorização'),
      field(BASE + '.afe.processo', 'Processo'),
      field(BASE + '.afe.atividades', 'Atividades', { type: 'textarea', rows: 2 }),
      field(BASE + '.afe.dataPublicacao', 'Data de publicação', { type: 'date' })
    ]);
    afeBlock.appendChild(afeGrid);
    autorizacoes.appendChild(afeBlock);

    var aeBlock = E('div', 'fm-subcard');
    aeBlock.appendChild(E('h4', 'fm-option-group-title', 'AE'));
    var aeActions = E('div', 'fm-document-actions');
    aeActions.appendChild(lookupButton('Consultar AE na base regulatória', 'ae', BASE + '.ae'));
    aeBlock.appendChild(aeActions);
    var aeGrid = grid();
    appendFields(aeGrid, [
      field(BASE + '.ae.numero', 'Número / autorização'),
      field(BASE + '.ae.processo', 'Processo'),
      field(BASE + '.ae.atividades', 'Atividades', { type: 'textarea', rows: 2 }),
      field(BASE + '.ae.dataPublicacao', 'Data de publicação', { type: 'date' })
    ]);
    aeBlock.appendChild(aeGrid);
    autorizacoes.appendChild(aeBlock);
    target.appendChild(autorizacoes);

    var perfil = sectionCard('1.8 Perfil da manipulação e atividades');
    perfil.appendChild(optionGroup('Tipos de preparação', BASE + '.perfil.tipos', [
      { key: 'homeopatica', label: 'Homeopática' },
      { key: 'fitoterapica', label: 'Fitoterápica' },
      { key: 'alopatica', label: 'Alopática' },
      { key: 'oficinal', label: 'Oficinal' }
    ]));
    perfil.appendChild(optionGroup('Classes / grupos manipulados', BASE + '.perfil.classes', [
      { key: 'hormonios', label: 'Hormônios' },
      { key: 'antibioticos', label: 'Antibióticos' },
      { key: 'penicilinicos', label: 'Penicilínicos' },
      { key: 'cefalosporinas', label: 'Cefalosporinas' },
      { key: 'citostaticos', label: 'Citostáticos' },
      { key: 'controlados', label: 'Sujeitos a controle especial' }
    ]));
    perfil.appendChild(optionGroup('Formas farmacêuticas', BASE + '.perfil.formas', [
      { key: 'solidas', label: 'Sólidas' },
      { key: 'semissolidas', label: 'Semissólidas' },
      { key: 'liquidas', label: 'Líquidas' }
    ]));
    perfil.appendChild(optionGroup('Atividades adicionais', BASE + '.perfil.atividadesAdicionais', [
      { key: 'industrializados', label: 'Dispensação de industrializados / drogaria' },
      { key: 'servicosFarmaceuticos', label: 'Prestação de serviços farmacêuticos' },
      { key: 'entregaDomicilio', label: 'Entrega em domicílio' }
    ]));
    var sbitGrid = grid();
    appendFields(sbitGrid, [
      field(BASE + '.perfil.sbit.situacao', 'Manipulação de SBIT', {
        type: 'select',
        options: [
          { value: '', label: 'Selecione' },
          { value: 'SIM', label: 'Sim' },
          { value: 'NAO', label: 'Não' }
        ]
      }),
      field(BASE + '.perfil.sbit.substancias', 'SBIT / substâncias', { type: 'textarea', rows: 2 })
    ]);
    perfil.appendChild(sbitGrid);
    target.appendChild(perfil);

    var producao = sectionCard('1.9 Produção, pessoal e sistema');
    var prodGrid = grid();
    appendFields(prodGrid, [
      field(BASE + '.producao.formulasDia', 'Média de fórmulas por dia', { type: 'number' }),
      field(BASE + '.producao.totalFuncionarios', 'Total de funcionários', { type: 'number' }),
      field(BASE + '.producao.sistemaNome', 'Sistema informatizado'),
      field(BASE + '.producao.sistemaVersao', 'Versão do sistema')
    ]);
    producao.appendChild(prodGrid);
    producao.appendChild(E('h4', 'fm-option-group-title', 'Composição da equipe'));
    producao.appendChild(FM.createRepeatableTable({
      path: BASE + '.producao.composicaoEquipe',
      addLabel: '+ Adicionar função',
      columns: [
        { key: 'funcao', label: 'Função / categoria' },
        { key: 'quantidade', label: 'Quantidade', type: 'number' },
        { key: 'observacao', label: 'Observação' }
      ]
    }));
    target.appendChild(producao);

    var agua = sectionCard('1.10 Água purificada, bases e excipientes');
    var aguaGrid = grid();
    appendFields(aguaGrid, [
      field(BASE + '.agua.metodo', 'Método de obtenção da água purificada'),
      field(BASE + '.agua.observacoes', 'Informações gerais sobre o sistema de água', { type: 'textarea', rows: 2 }),
      field(BASE + '.bases.aquisicao', 'Bases galênicas adquiridas', { type: 'textarea', rows: 2 }),
      field(BASE + '.bases.manipuladas', 'Bases / excipientes manipulados no estabelecimento', { type: 'textarea', rows: 2 })
    ]);
    agua.appendChild(aguaGrid);
    agua.appendChild(E('p', 'fm-helper-text', 'A análise detalhada do sistema de água e dos respectivos laudos ocorre nas seções específicas.'));
    target.appendChild(agua);

    var residuos = sectionCard('1.11 Resíduos e coleta');
    var resGrid = grid();
    appendFields(resGrid, [
      field(BASE + '.residuos.empresa', 'Empresa / serviço responsável'),
      field(BASE + '.residuos.codigoGerador', 'Código do gerador'),
      field(BASE + '.residuos.frequencia', 'Frequência / forma de coleta'),
      field(BASE + '.residuos.observacoes', 'Observações', { type: 'textarea', rows: 2 })
    ]);
    residuos.appendChild(resGrid);
    target.appendChild(residuos);

    var anteriores = sectionCard('1.12 Não conformidades anteriores');
    anteriores.appendChild(field(BASE + '.historico.naoConformidadesAnteriores', 'Registro de NCs anteriores, providências e situação atual', { type: 'textarea', rows: 4 }));
    target.appendChild(anteriores);

    var conferencia = sectionCard('1.13 Conferência entre documentos e fontes');
    var comparison = E('div', 'fm-source-comparison-container');
    compareSources(comparison);
    conferencia.appendChild(comparison);
    var refresh = E('button', 'fm-secondary-button', 'Atualizar conferência');
    refresh.type = 'button';
    refresh.addEventListener('click', function () { compareSources(comparison); });
    conferencia.appendChild(refresh);
    target.appendChild(conferencia);

    var notes = sectionCard('1.14 Registros da seção');
    notes.appendChild(FM.createPhotoNotesControl({
      path: BASE + '.registrosGerais',
      multiple: true,
      rows: 4
    }));
    target.appendChild(notes);

    FM.emit('section-rendered', { section: 1, target: target });
    return target;
  }

  FM.sections = FM.sections || {};
  FM.sections.section1 = {
    id: 'section1',
    title: 'Identificação do Estabelecimento e Informações Gerais',
    render: render,
    statePath: BASE
  };

  FM.renderSection1 = render;
})(window, document);
