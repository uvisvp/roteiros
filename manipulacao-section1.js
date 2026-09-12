/* Farmácia de Manipulação — Seção 1: identificação e informações gerais. */
(() => {
  'use strict';
  if (window.ManipulacaoSection1) return;

  const start = () => {
    const C = window.ManipulacaoCore;
    const U = window.ManipulacaoUI;
    if (!C || !U) return setTimeout(start, 25);

    const B = 'sections.1';
    const f = key => B + '.fields.' + key;
    const a = key => B + '.answers.' + key;
    const n = key => B + '.notes.' + key;
    const arr = key => C.field(f(key), []);
    const esc = C.esc;

    const inspectionTypes = [
      ['inicial','Inicial'],['renovacao','Renovação'],['monitoramento','Monitoramento'],
      ['ampliacao','Ampliação de atividade'],['denuncia','Atendimento a denúncia'],['outro','Outro']
    ];

    function actionButton(action, label, extra = '') {
      return '<button type="button" class="primary" data-manip-s1-action="' + esc(action) + '" ' + extra + '>' + esc(label) + '</button>';
    }

    function contactRows() {
      const rows = arr('contexto.contatos');
      if (!rows.length) return '<p class="manip-info">Nenhuma pessoa contatada registrada.</p>';
      return rows.map((row, index) => '<div class="manip-repeat-row"><div class="manip-grid">' +
        U.input(f('contexto.contatos.' + index + '.nome'), 'Nome') +
        U.input(f('contexto.contatos.' + index + '.funcao'), 'Função / vínculo') +
        U.input(f('contexto.contatos.' + index + '.documento'), 'Documento') +
        U.input(f('contexto.contatos.' + index + '.telefone'), 'Telefone', { type: 'tel' }) +
        U.input(f('contexto.contatos.' + index + '.email'), 'E-mail', { type: 'email' }) +
        '</div><button type="button" data-manip-s1-remove="contexto.contatos|' + index + '">Remover pessoa</button></div>').join('');
    }

    function substituteRows() {
      const rows = arr('rt.substitutos');
      if (!rows.length) return '<p class="manip-info">Nenhum farmacêutico substituto registrado.</p>';
      return rows.map((row, index) => '<div class="manip-repeat-row"><div class="manip-grid">' +
        U.input(f('rt.substitutos.' + index + '.nome'), 'Nome') +
        U.input(f('rt.substitutos.' + index + '.crf'), 'CRF / UF') +
        U.input(f('rt.substitutos.' + index + '.horario'), 'Horário de assistência') +
        '</div><button type="button" data-manip-s1-remove="rt.substitutos|' + index + '">Remover substituto</button></div>').join('');
    }

    function staffRows() {
      const rows = arr('producao.composicao_equipe');
      if (!rows.length) return '<p class="manip-info">A composição detalhada da equipe ainda não foi informada.</p>';
      return rows.map((row, index) => '<div class="manip-repeat-row"><div class="manip-grid">' +
        U.input(f('producao.composicao_equipe.' + index + '.funcao'), 'Função') +
        U.input(f('producao.composicao_equipe.' + index + '.quantidade'), 'Quantidade', { type: 'number', min: 0 }) +
        U.input(f('producao.composicao_equipe.' + index + '.observacao'), 'Observação') +
        '</div><button type="button" data-manip-s1-remove="producao.composicao_equipe|' + index + '">Remover linha</button></div>').join('');
    }

    function profileChecks() {
      return '<div class="manip-check-grid">' +
        U.checkbox(f('perfil.homeopaticos'), 'Homeopáticos') +
        U.checkbox(f('perfil.fitoterapicos'), 'Fitoterápicos') +
        U.checkbox(f('perfil.alopaticos'), 'Alopáticos') +
        U.checkbox(f('perfil.oficinais'), 'Oficinais') + '</div>';
    }

    function classChecks() {
      return '<div class="manip-check-grid">' +
        U.checkbox(f('classes.hormonios'), 'Hormônios') +
        U.checkbox(f('classes.antibioticos'), 'Antibióticos') +
        U.checkbox(f('classes.penicilinicos'), 'Penicilínicos') +
        U.checkbox(f('classes.cefalosporinicos'), 'Cefalosporínicos') +
        U.checkbox(f('classes.citostaticos'), 'Citostáticos') +
        U.checkbox(f('classes.controlados'), 'Substâncias sujeitas a controle especial') + '</div>';
    }

    function formChecks() {
      return '<div class="manip-check-grid">' +
        U.checkbox(f('formas.solidos'), 'Sólidos') +
        U.checkbox(f('formas.semissolidos'), 'Semissólidos') +
        U.checkbox(f('formas.liquidos'), 'Líquidos') + '</div>';
    }

    function activityChoices() {
      const block = (key, label) => '<div class="manip-mini-choice"><b>' + esc(label) + '</b>' + U.choice(f('atividades_adicionais.' + key), [['sim','Sim'],['nao','Não']]) + '</div>';
      return '<div class="manip-choice-grid">' +
        block('industrializados', 'Dispensa produtos industrializados?') +
        block('servicos_farmaceuticos', 'Realiza serviços farmacêuticos?') +
        block('entrega_domicilio', 'Realiza entrega domiciliar?') + '</div>' +
        '<p class="manip-info">Estas respostas descrevem o estabelecimento. Elas não ocultam automaticamente as seções correspondentes do roteiro; cada seção possui sua própria opção “Não se aplica”.</p>';
    }

    function documentTools() {
      return '<div class="manip-doc-tools">' +
        actionButton('ocr_licenca', '📄 Ler licença sanitária') +
        actionButton('ocr_crt', '📄 Ler CRT / CRF') +
        actionButton('consulta_cnpj', 'Consultar CNPJ / Anvisa') +
        '<p>Os dados extraídos ficam em conferência antes de serem aplicados. O CRT não possui campo de validade; quando constar, registra-se a data de emissão.</p>' +
        '</div>';
    }

    function render() {
      const blocks = [];

      blocks.push(U.box('Contexto da inspeção',
        U.grid(
          U.select(f('contexto.objetivo'), 'Objetivo / tipo da inspeção', inspectionTypes) +
          U.input(f('contexto.protocolo_sei'), 'Protocolo / processo SEI') +
          U.input(f('contexto.data_inspecao'), 'Data da inspeção', { type: 'date' }) +
          U.input(f('contexto.inicio'), 'Início', { type: 'time' }) +
          U.input(f('contexto.termino'), 'Término', { type: 'time' }) +
          U.input(f('contexto.equipe'), 'Equipe inspetora')
        ) +
        U.textarea(f('contexto.objetivo_detalhe'), 'Objetivo / escopo complementar') +
        '<h4>Pessoas contatadas durante a inspeção</h4>' + contactRows() +
        '<button type="button" data-manip-s1-add="contexto.contatos">+ Adicionar pessoa contatada</button>'
      ));

      blocks.push(U.box('Identificação do estabelecimento',
        documentTools() +
        U.grid(
          U.input(f('estabelecimento.razao_social'), 'Razão social') +
          U.input(f('estabelecimento.nome_fantasia'), 'Nome fantasia') +
          U.input(f('estabelecimento.cnpj'), 'CNPJ', { inputmode: 'numeric' }) +
          U.input(f('estabelecimento.inscricao_estadual'), 'Inscrição Estadual') +
          U.input(f('estabelecimento.endereco'), 'Endereço completo') +
          U.input(f('estabelecimento.bairro'), 'Bairro') +
          U.input(f('estabelecimento.municipio'), 'Município') +
          U.input(f('estabelecimento.cep'), 'CEP') +
          U.input(f('estabelecimento.telefone'), 'Telefone', { type: 'tel' }) +
          U.input(f('estabelecimento.email'), 'E-mail', { type: 'email' })
        ) +
        U.photoNotes('s1_estabelecimento', n('estabelecimento'))
      ));

      blocks.push(U.box('Responsável legal e responsabilidade técnica',
        U.grid(
          U.input(f('responsavel_legal.nome'), 'Responsável legal') +
          U.input(f('responsavel_legal.cpf'), 'CPF') +
          U.input(f('rt.principal.nome'), 'Responsável técnico principal') +
          U.input(f('rt.principal.crf'), 'CRF / UF') +
          U.input(f('rt.principal.horario'), 'Horário de assistência farmacêutica')
        ) +
        '<h4>Farmacêuticos substitutos</h4>' + substituteRows() +
        '<button type="button" data-manip-s1-add="rt.substitutos">+ Adicionar substituto</button>' +
        U.photoNotes('s1_rt', n('rt'))
      ));

      blocks.push(U.box('Licença Sanitária',
        U.grid(
          U.input(f('licenca.numero'), 'CMVS / CEVS') +
          U.input(f('licenca.validade'), 'Validade', { type: 'date' }) +
          U.input(f('licenca.titular'), 'Titular') +
          U.input(f('licenca.cnpj'), 'CNPJ constante da licença')
        ) +
        U.textarea(f('licenca.atividades'), 'Atividades licenciadas', { rows: 3 }) +
        U.textarea(f('licenca.grupos_categorias'), 'Grupos / categorias licenciados', { rows: 3 }) +
        '<div class="manip-actions">' + actionButton('ocr_licenca', '📄 Ler / revisar licença') + '</div>' +
        U.photoNotes('s1_licenca', n('licenca'))
      ));

      blocks.push(U.box('Certidão de Regularidade Técnica — CRF',
        U.info('A CRT é usada para conferência de empresa, ramo de atividade, horários e responsabilidade técnica. Não será criado campo de validade para a CRT.') +
        U.grid(
          U.input(f('crt.numero_certidao'), 'Número da certidão') +
          U.input(f('crt.razao_social'), 'Empresa') +
          U.input(f('crt.cnpj'), 'CNPJ') +
          U.input(f('crt.ramo_atividade'), 'Ramo de atividade') +
          U.input(f('crt.data_emissao'), 'Data de emissão', { type: 'date' })
        ) +
        U.textarea(f('crt.horario_estabelecimento'), 'Horário / rotina do estabelecimento') +
        '<div class="manip-actions">' + actionButton('ocr_crt', '📄 Ler / revisar CRT') + '</div>' +
        U.photoNotes('s1_crt', n('crt'))
      ));

      blocks.push(U.box('Autorizações sanitárias federais',
        '<div class="manip-two-columns"><div><h4>AFE</h4>' +
          U.grid(U.input(f('afe.numero'), 'AFE') + U.input(f('afe.processo'), 'Processo') + U.input(f('afe.publicacao'), 'Data de publicação', { type: 'date' })) +
          U.textarea(f('afe.atividades'), 'Atividades autorizadas') + '</div>' +
        '<div><h4>AE</h4>' + U.localApplicability(f('ae.aplicabilidade'), 'A Autorização Especial se aplica ao estabelecimento?') +
          U.grid(U.input(f('ae.numero'), 'AE') + U.input(f('ae.processo'), 'Processo') + U.input(f('ae.publicacao'), 'Data de publicação', { type: 'date' })) +
          U.textarea(f('ae.atividades'), 'Atividades autorizadas') + '</div></div>' +
        U.info('Datas de publicação só devem ser preenchidas quando a fonte consultada efetivamente informar a publicação; o aplicativo não deve inferi-las a partir de outras datas.') +
        U.photoNotes('s1_afe_ae', n('afe_ae'))
      ));

      blocks.push(U.box('Perfil de manipulação',
        '<h4>Tipos de preparação</h4>' + profileChecks() +
        '<h4>Classes / grupos manipulados</h4>' + classChecks() +
        '<h4>Formas farmacêuticas</h4>' + formChecks() +
        '<div class="manip-mini-choice"><b>Manipula substâncias de baixo índice terapêutico (SBIT)?</b>' + U.choice(f('sbit.manipula'), [['sim','Sim'],['nao','Não']]) + '</div>' +
        U.textarea(f('sbit.substancias'), 'SBIT manipuladas / pretendidas', { placeholder: 'Relacionar as substâncias. O campo permanece disponível independentemente da resposta anterior.' }) +
        U.photoNotes('s1_perfil', n('perfil'))
      ));

      blocks.push(U.box('Atividades adicionais', activityChoices() + U.photoNotes('s1_atividades', n('atividades_adicionais'))));

      blocks.push(U.box('Produção e pessoal',
        U.grid(
          U.input(f('producao.formulas_dia'), 'Média de fórmulas por dia', { type: 'number', min: 0 }) +
          U.input(f('producao.funcionarios_total'), 'Número total de funcionários', { type: 'number', min: 0 }) +
          U.input(f('producao.farmaceuticos_total'), 'Número de farmacêuticos', { type: 'number', min: 0 })
        ) +
        '<h4>Composição da equipe</h4>' + staffRows() +
        '<button type="button" data-manip-s1-add="producao.composicao_equipe">+ Adicionar função</button>' +
        U.photoNotes('s1_producao', n('producao'))
      ));

      blocks.push(U.box('Água, sistema, bases/excipientes e resíduos',
        U.grid(
          U.input(f('agua.metodo_purificacao'), 'Método de obtenção de água purificada') +
          U.input(f('sistema.nome'), 'Sistema informatizado') +
          U.input(f('sistema.versao'), 'Versão do sistema') +
          U.input(f('residuos.empresa'), 'Empresa coletora de resíduos') +
          U.input(f('residuos.frequencia'), 'Frequência de coleta') +
          U.input(f('residuos.codigo_gerador'), 'Código / identificação do gerador')
        ) +
        U.textarea(f('bases_excipientes.descricao'), 'Bases e excipientes adquiridos e/ou manipulados') +
        U.textarea(f('residuos.observacoes'), 'Observações sobre resíduos') +
        U.photoNotes('s1_apoio', n('apoio'))
      ));

      blocks.push(U.box('Inspeções anteriores e observações gerais',
        '<div class="manip-mini-choice"><b>Havia não conformidades / pendências de inspeção anterior?</b>' + U.choice(a('pendencia_anterior'), [['sim','Sim'],['nao','Não'],['na','Não se aplica']]) + '</div>' +
        U.textarea(f('historico.pendencias'), 'Pendências anteriores / providências informadas', { rows: 4 }) +
        U.textarea(f('observacoes_gerais'), 'Observações gerais da Seção 1', { rows: 4 }) +
        U.photoNotes('s1_geral', n('geral'))
      ));

      return blocks.join('');
    }

    function addItem(path) {
      const templates = {
        'contexto.contatos': { nome: '', funcao: '', documento: '', telefone: '', email: '' },
        'rt.substitutos': { nome: '', crf: '', horario: '' },
        'producao.composicao_equipe': { funcao: '', quantidade: '', observacao: '' }
      };
      C.update(state => {
        const full = f(path);
        const list = C.getPath(state, full, []);
        const next = Array.isArray(list) ? list : [];
        next.push(C.clone(templates[path] || {}));
        C.setPath(state, full, next);
      }, { source: 'section1-array-add' });
    }

    function removeItem(path, index) {
      C.update(state => {
        const full = f(path);
        const list = C.getPath(state, full, []);
        if (Array.isArray(list)) list.splice(Number(index), 1);
        C.setPath(state, full, list);
      }, { source: 'section1-array-remove' });
    }

    let installed = false;
    function install() {
      if (installed) return;
      installed = true;
      document.addEventListener('click', event => {
        const add = event.target.closest?.('[data-manip-s1-add]');
        if (add) { addItem(add.dataset.manipS1Add); return; }
        const remove = event.target.closest?.('[data-manip-s1-remove]');
        if (remove) {
          const [path, index] = remove.dataset.manipS1Remove.split('|');
          removeItem(path, index);
          return;
        }
        const action = event.target.closest?.('[data-manip-s1-action]');
        if (!action) return;
        const type = action.dataset.manipS1Action;
        if (type === 'ocr_licenca') {
          document.dispatchEvent(new CustomEvent('manipulacao:ocr-request', { detail: { section: '1', documentType: 'licenca_sanitaria', destination: f('licenca') } }));
        } else if (type === 'ocr_crt') {
          document.dispatchEvent(new CustomEvent('manipulacao:ocr-request', { detail: { section: '1', documentType: 'certidao_regularidade_crf', destination: f('crt') } }));
        } else if (type === 'consulta_cnpj') {
          document.dispatchEvent(new CustomEvent('manipulacao:anvisa-query', { detail: { section: '1', cnpj: C.field(f('estabelecimento.cnpj'), '') } }));
        }
      });
    }

    C.registerSection('1', {
      title: 'Identificação do Estabelecimento e Informações Gerais',
      shortTitle: 'Identificação',
      render,
      afterRender: install
    });

    window.ManipulacaoSection1 = Object.freeze({ render, install });
    document.dispatchEvent(new CustomEvent('manipulacao:section1-ready'));
  };

  start();
})();
