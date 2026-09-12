/* Farmácia de Manipulação — Seção 3: Pessoal, Saúde Ocupacional e Treinamento. */
(() => {
  'use strict';
  if (window.ManipulacaoSection3) return;

  const start = () => {
    const C = window.ManipulacaoCore, U = window.ManipulacaoUI;
    if (!C || !U) return setTimeout(start, 25);
    const B = 'sections.3';
    const f = k => B + '.fields.' + k;
    const a = k => B + '.answers.' + k;
    const n = k => B + '.notes.' + k;
    const arr = k => C.field(f(k), []);
    const ref = text => '<p class="manip-reference">' + C.esc(text) + '</p>';

    function q(id, text, reference, help = '') {
      return U.question({ id: 's3_' + id, text, help, answerPath: a(id), notesPath: n(id), photoKey: 's3_' + id }) + ref(reference);
    }

    function asoRows() {
      const rows = arr('saude.asos');
      if (!rows.length) return U.info('Nenhum ASO registrado nesta inspeção. É possível adicionar manualmente ou utilizar o leitor documental.');
      return rows.map((row, i) => '<section class="manip-repeat-row"><h5>ASO ' + (i + 1) + '</h5><div class="manip-grid">' +
        U.input(f('saude.asos.' + i + '.nome_funcionario'), 'Funcionário') +
        U.input(f('saude.asos.' + i + '.cpf'), 'CPF') +
        U.input(f('saude.asos.' + i + '.funcao'), 'Função') +
        U.select(f('saude.asos.' + i + '.tipo_exame'), 'Tipo de exame', [['admissional','Admissional'],['periodico','Periódico'],['retorno','Retorno ao trabalho'],['mudanca','Mudança de risco ocupacional'],['demissional','Demissional'],['outro','Outro']]) +
        U.input(f('saude.asos.' + i + '.data_exame'), 'Data do exame', { type: 'date' }) +
        U.select(f('saude.asos.' + i + '.aptidao'), 'Conclusão', [['apto','Apto'],['inapto','Inapto'],['nao_consta','Não consta / ilegível']]) +
        U.input(f('saude.asos.' + i + '.medico_examinador'), 'Médico examinador') +
        U.input(f('saude.asos.' + i + '.crm'), 'CRM / UF') +
        U.input(f('saude.asos.' + i + '.medico_pcmsO'), 'Responsável pelo PCMSO, se constar') +
      '</div>' +
      U.textarea(f('saude.asos.' + i + '.riscos'), 'Riscos / agentes descritos') +
      U.textarea(f('saude.asos.' + i + '.exames'), 'Exames ocupacionais relacionados') +
      U.photoNotes('s3_aso_' + i, f('saude.asos.' + i + '.anotacoes')) +
      '<div class="manip-actions"><button type="button" data-manip-s3-remove="saude.asos|' + i + '">Remover ASO</button></div></section>').join('');
    }

    function trainingRows() {
      const rows = arr('treinamentos.registros');
      if (!rows.length) return U.info('Nenhum registro de treinamento lançado.');
      return rows.map((row, i) => '<section class="manip-repeat-row"><div class="manip-grid">' +
        U.input(f('treinamentos.registros.' + i + '.tema'), 'Treinamento / tema') +
        U.input(f('treinamentos.registros.' + i + '.data'), 'Data', { type: 'date' }) +
        U.input(f('treinamentos.registros.' + i + '.carga_horaria'), 'Carga horária') +
        U.input(f('treinamentos.registros.' + i + '.numero_treinados'), 'Nº de treinados', { type: 'number', min: 0 }) +
        U.select(f('treinamentos.registros.' + i + '.efetividade'), 'Efetividade avaliada?', [['sim','Sim'],['nao','Não'],['nao_consta','Não consta']]) +
      '</div>' + U.textarea(f('treinamentos.registros.' + i + '.anotacoes'), 'Anotações') +
      '<button type="button" data-manip-s3-remove="treinamentos.registros|' + i + '">Remover treinamento</button></section>').join('');
    }

    function docChecklist(prefix, items) {
      return '<div class="manip-check-grid">' + items.map(([key, label]) => U.checkbox(f(prefix + '.checklist.' + key), label)).join('') + '</div>';
    }

    function render() {
      const pcmsOItems = [
        ['identificacao','Identificação da empresa'],['responsavel','Médico / responsável pelo programa'],['desenvolvimento','Desenvolvimento e planejamento preventivo'],
        ['riscos','Reconhecimento e análise dos riscos ocupacionais'],['periodicidade','Periodicidade de exames clínicos e complementares'],['planejamento','Planejamento anual'],
        ['recomendacoes','Recomendações à empresa'],['funcoes','Riscos por função'],['exames','Relação de exames e periodicidade por função']
      ];
      const pgrItems = [
        ['identificacao','Identificação / base do programa'],['avaliadores','Responsáveis / avaliadores'],['escopo','Escopo'],['avaliacao','Avaliação de riscos'],
        ['metodos','Instrumentos e métodos'],['antecipacao','Antecipação / reconhecimento de riscos'],['inventario','Inventário de riscos'],['controle','Metas, prioridades e medidas de controle'],
        ['registro','Registro e divulgação dos dados'],['recomendacoes','Recomendações'],['funcoes','Riscos por função / área'],['prevencao','Medidas de prevenção e mitigação'],['anexos','Anexos aplicáveis']
      ];

      return U.box('3.1 Pessoal e organização',
        q('organograma', 'A farmácia possui organograma demonstrando estrutura organizacional e pessoal suficiente?', 'RDC 67/2007 · Anexo I · item 3') +
        q('responsabilidades', 'As atribuições e responsabilidades individuais estão formalmente descritas, sem sobreposição?', 'RDC 67/2007 · Anexo I · item 3.1') +
        q('admissao_periodicos', 'A admissão dos funcionários é precedida de exames médicos, com avaliações periódicas (PCMSO)?', 'RDC 67/2007 · Anexo I · item 3.3.1') +
        q('afastamento', 'Em caso de lesão exposta, suspeita ou confirmação de enfermidade que possa comprometer a preparação, o funcionário é afastado, conforme legislação?', 'RDC 67/2007 · Anexo I · item 3.3.2') +
        q('adornos', 'É observada a proibição de uso de cosméticos, joias e adornos nas áreas de pesagem e salas de manipulação?', 'RDC 67/2007 · Anexo I · item 3.3.3') +
        q('conduta', 'É observada a proibição de comer, beber, fumar, mascar e manter alimentos, objetos pessoais ou medicamentos nas salas de pesagem e manipulação?', 'RDC 67/2007 · Anexo I · item 3.3.4') +
        q('reporte_risco', 'Os empregados são instruídos a reportar condições de risco relativas ao produto, ambiente, equipamento ou pessoal?', 'RDC 67/2007 · Anexo I · item 3.3.5') +
        q('epi', 'A farmácia distribui EPI gratuitamente, em quantidade suficiente e com reposição periódica?', 'RDC 67/2007 · Anexo I · item 3.3.6') +
        q('paramentacao', 'Os funcionários da manipulação estão adequadamente paramentados, com EPI, e realizam higiene das mãos e antebraços antes da manipulação?', 'RDC 67/2007 · Anexo I · itens 3.3.7 e 3.3.8')
      ) +
      U.box('3.2 Saúde ocupacional — ASO',
        U.info('O leitor de ASO apenas extrai dados estruturados. A equipe confere e aplica; o OCR não decide conformidade.') +
        '<div class="manip-actions"><button type="button" class="primary" data-manip-s3-action="ocr_aso">📄 Adicionar ASO por OCR</button><button type="button" data-manip-s3-add="saude.asos">+ Adicionar ASO manualmente</button></div>' +
        asoRows()
      ) +
      U.box('3.2 Saúde ocupacional — PCMSO',
        U.info('PCMSO: sem OCR de conteúdo. Registrar apresentação e utilizar o checklist de conferência.') +
        '<div class="manip-mini-choice"><b>PCMSO apresentado?</b>' + U.choice(f('saude.pcmso.apresentado'), [['sim','Sim'],['nao','Não'],['na','Não se aplica']]) + '</div>' +
        U.grid(U.input(f('saude.pcmso.titulo'), 'Título / identificação') + U.input(f('saude.pcmso.responsavel'), 'Responsável') + U.input(f('saude.pcmso.emissao'), 'Emissão / revisão', { type: 'date' })) +
        docChecklist('saude.pcmso', pcmsOItems) + U.textarea(f('saude.pcmso.anotacoes'), 'Anotações sobre o PCMSO') + U.photoNotes('s3_pcmsO', n('pcmso'))
      ) +
      U.box('3.2 Saúde ocupacional — PGR',
        U.info('PGR: sem OCR de conteúdo. Registrar apresentação e utilizar o checklist de conferência.') +
        '<div class="manip-mini-choice"><b>PGR apresentado?</b>' + U.choice(f('saude.pgr.apresentado'), [['sim','Sim'],['nao','Não'],['na','Não se aplica']]) + '</div>' +
        U.grid(U.input(f('saude.pgr.titulo'), 'Título / identificação') + U.input(f('saude.pgr.responsavel'), 'Responsável') + U.input(f('saude.pgr.emissao'), 'Emissão / revisão', { type: 'date' })) +
        docChecklist('saude.pgr', pgrItems) + U.textarea(f('saude.pgr.anotacoes'), 'Anotações sobre o PGR') + U.photoNotes('s3_pgr', n('pgr'))
      ) +
      U.box('3.3 Treinamento de pessoal',
        q('treinamento_programa', 'Há programa de treinamento baseado em levantamento de necessidades, com registros de atividades, data, carga horária, conteúdo, trabalhadores treinados, assinaturas e identificação de quem treinou?', 'RDC 67/2007 · Anexo I · item 3.2') +
        q('treinamento_inicial_continuado', 'Todo o pessoal, inclusive limpeza e manutenção, recebeu treinamento inicial e continuado em higiene, saúde, conduta e noções de microbiologia?', 'RDC 67/2007 · Anexo I · item 3.2.1') +
        q('treinamento_especifico', 'Foram realizados treinamentos específicos para as atividades dos diferentes anexos desenvolvidas pela farmácia, como sensibilizantes, SBIT e homeopatia?', 'RDC 67/2007 · Anexo I · item 3.2.3') +
        q('treinamento_acidentes', 'Os treinamentos incluíram procedimentos em caso de acidente/incidente e informações sobre riscos?', 'RDC 67/2007 · Anexo I · item 3.2.4') +
        q('treinamento_efetividade', 'Os treinamentos realizados tiveram sua efetividade avaliada?', 'RDC 67/2007 · Anexo I · item 3.2.6', 'O roteiro informa que registro sem avaliação de efetividade deve ser tratado como não conforme no item 3.2.6.') +
        '<h4>Registros de treinamento — sem OCR</h4>' + trainingRows() +
        '<button type="button" data-manip-s3-add="treinamentos.registros">+ Adicionar treinamento</button>'
      ) +
      U.box('3.4 Requisitos ocupacionais adicionais — Anexo III',
        U.localApplicability(f('anexo_iii.aplicabilidade'), 'Os requisitos ocupacionais específicos do Anexo III se aplicam a esta inspeção?') +
        U.info('A aplicabilidade é controlada aqui. A seção não é omitida automaticamente por respostas de outras partes do roteiro, nem é condicionada à situação da licença sanitária.') +
        q('anexo_iii_exames', 'Os funcionários diretamente envolvidos são submetidos a exames médicos específicos no PCMSO, recomendando-se sistema de rodízio?', 'RDC 67/2007 · Anexo III · item 2.12') +
        q('anexo_iii_pcmsO', 'Os responsáveis pela elaboração do PCMSO foram comunicados da manipulação dessas substâncias?', 'RDC 67/2007 · Anexo III · item 2.12.1')
      );
    }

    function add(path) {
      const templates = {
        'saude.asos': { nome_funcionario: '', cpf: '', funcao: '', tipo_exame: '', data_exame: '', riscos: '', exames: '', aptidao: '', medico_examinador: '', crm: '', medico_pcmsO: '', anotacoes: '' },
        'treinamentos.registros': { tema: '', data: '', carga_horaria: '', numero_treinados: '', efetividade: '', anotacoes: '' }
      };
      C.update(state => {
        const full = f(path), list = C.getPath(state, full, []);
        const next = Array.isArray(list) ? list : [];
        next.push(C.clone(templates[path] || {}));
        C.setPath(state, full, next);
      }, { source: 'section3-array-add' });
    }

    function remove(path, index) {
      C.update(state => {
        const full = f(path), list = C.getPath(state, full, []);
        if (Array.isArray(list)) list.splice(Number(index), 1);
        C.setPath(state, full, list);
      }, { source: 'section3-array-remove' });
    }

    let installed = false;
    function install() {
      if (installed) return;
      installed = true;
      document.addEventListener('click', event => {
        const addBtn = event.target.closest?.('[data-manip-s3-add]');
        if (addBtn) { add(addBtn.dataset.manipS3Add); return; }
        const removeBtn = event.target.closest?.('[data-manip-s3-remove]');
        if (removeBtn) { const [path, i] = removeBtn.dataset.manipS3Remove.split('|'); remove(path, i); return; }
        const action = event.target.closest?.('[data-manip-s3-action]');
        if (action?.dataset.manipS3Action === 'ocr_aso') {
          document.dispatchEvent(new CustomEvent('manipulacao:ocr-request', { detail: { section: '3', documentType: 'aso', destination: f('saude.asos'), multiple: true } }));
        }
      });
    }

    C.registerSection('3', { title: 'Pessoal, Saúde Ocupacional e Treinamento', shortTitle: 'Pessoal e saúde', render, afterRender: install });
    window.ManipulacaoSection3 = Object.freeze({ render, install });
    document.dispatchEvent(new CustomEvent('manipulacao:section3-ready'));
  };
  start();
})();
