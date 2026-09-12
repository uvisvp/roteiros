/* Farmácia de Manipulação — Seção 6: Laboratórios de Sensibilizantes. */
(() => {
  'use strict';
  if (window.ManipulacaoSection6) return;

  const start = () => {
    const C = window.ManipulacaoCore, U = window.ManipulacaoUI;
    if (!C || !U) return setTimeout(start, 25);
    const B = 'sections.6';
    const f = k => B + '.fields.' + k;
    const a = k => B + '.answers.' + k;
    const n = k => B + '.notes.' + k;
    const ref = text => '<p class="manip-reference">' + C.esc(text) + '</p>';

    function q(prefix, id, text, reference, help = '', requirement = '') {
      return U.question({ id:'s6_' + prefix + '_' + id, text, help, requirement, answerPath:a(prefix + '.' + id), notesPath:n(prefix + '.' + id), photoKey:'s6_' + prefix + '_' + id }) + ref(reference);
    }

    function planilhas(prefix) {
      return '<section class="manip-subcard"><h4>Planilhas e registros da cabine</h4>' +
        q(prefix + '.planilhas','temp_umidade','Há registro de temperatura e umidade com parâmetros, referência e campo de ação corretiva?','RDC 67/2007 · itens 4.2.1 e 8.8') +
        q(prefix + '.planilhas','pressao','Há registro do diferencial de pressão da cabine?','RDC 67/2007 · Anexo III · item 2.7.2') +
        q(prefix + '.planilhas','limpeza','Há registros de limpeza de superfícies, cabine, bancada e balança?','RDC 67/2007 · Anexo III · item 2.9') +
        q(prefix + '.planilhas','balanca','Há verificação diária da balança com peso padrão antes do início das atividades?','RDC 67/2007 · Anexo I · item 5.2.2') +
        q(prefix + '.planilhas','filtros','Há registros de limpeza/manutenção do sistema de exaustão e troca de filtros?','RDC 67/2007 · Anexo I · item 8.7') +
        q(prefix + '.planilhas','acao','Os registros possuem campo de ação corretiva e ele é utilizado quando necessário?','RDC 67/2007 · registros de monitoramento') +
        '</section>';
    }

    function pressureBlock(prefix) {
      return '<section class="manip-subcard"><h4>Diferencial de pressão</h4>' +
        U.requirement('-5 a -120 Pa', 'Parâmetro operacional informado pela equipe para uso no aplicativo; não atribuído automaticamente à RDC 67/2007.') +
        U.grid(
          U.input(f(prefix + '.pressao.valor'), 'Valor aferido (Pa)', { type:'number', step:'0.1' }) +
          U.input(f(prefix + '.pressao.data_hora'), 'Data/hora da aferição', { type:'datetime-local' }) +
          U.input(f(prefix + '.pressao.observacao'), 'Observação da aferição')
        ) +
        '<h5>Manômetro utilizado</h5>' + U.calibration(f(prefix + '.pressao.manometro'), 'Manômetro') +
        U.info('O aplicativo pode destacar valor fora do parâmetro informado, mas a situação C/NC/NA continua sendo escolhida pela autoridade sanitária.') +
        U.photoNotes('s6_' + prefix + '_pressao', f(prefix + '.pressao.anotacoes')) + '</section>';
    }

    function balance(prefix) {
      return '<section class="manip-subcard"><h4>Balança da cabine</h4>' +
        U.calibration(f(prefix + '.balanca'), 'Balança') +
        U.grid(
          U.input(f(prefix + '.balanca_verificacao.pesos'), 'Peso(s) padrão utilizado(s)') +
          U.input(f(prefix + '.balanca_verificacao.resultado'), 'Resultado da verificação diária')
        ) +
        '<div class="manip-mini-choice"><b>Registros de verificação diária mantidos?</b>' + U.choice(f(prefix + '.balanca_verificacao.registros'), [['c','Conforme'],['nc','Não conforme'],['na','Não se aplica']]) + '</div>' +
        U.photoNotes('s6_' + prefix + '_balanca', f(prefix + '.balanca_verificacao.anotacoes')) + '</section>';
    }

    function classHeader(prefix, label) {
      return U.localApplicability(f(prefix + '.aplicabilidade'), 'A cabine de ' + label + ' se aplica a esta inspeção?') +
        '<div class="manip-choice-grid">' +
          '<div class="manip-mini-choice"><b>Manipula esta classe?</b>' + U.choice(f(prefix + '.manipula'), [['sim','Sim'],['nao','Não']]) + '</div>' +
          '<div class="manip-mini-choice"><b>Cabine existente?</b>' + U.choice(f(prefix + '.cabine_existe'), [['sim','Sim'],['nao','Não']]) + '</div>' +
        '</div>' +
        U.grid(
          U.select(f(prefix + '.situacao_licenca'), 'Situação da licença', [['licenciada','Licenciada'],['solicitacao','Em solicitação / ampliação'],['sem_licenca','Sem licença'],['na','Não se aplica']]) +
          U.input(f(prefix + '.identificacao'), 'Identificação da cabine / cor / etiqueta')
        ) +
        U.info('A situação da licença é registrada por classe e não gera conclusão automática. Uma classe pode estar licenciada e outra em solicitação ou sem licença.') +
        U.textarea(f(prefix + '.descricao'), 'Descrição da cabine e antecâmara');
    }

    function cabin(prefix, label, refSpecific) {
      return U.box('6.' + ({hormonios:'2',antibioticos:'3',citostaticos:'4',penicilinicos:'5'}[prefix]) + ' Cabine de ' + label,
        classHeader(prefix, label) +
        q(prefix,'antecâmara','Possui antecâmara adequada, provida dos elementos de paramentação/EPI exigidos para a atividade?','RDC 67/2007 · Anexo III · item 2.7') +
        q(prefix,'superficies','As superfícies e condições da cabine permitem limpeza e manutenção adequadas, sem sinais que comprometam o processo?','RDC 67/2007 · Anexo III · requisitos de área dedicada') +
        q(prefix,'exaustao','O sistema de exaustão/insuflamento está independente e em funcionamento para esta classe?','RDC 67/2007 · Anexo III · item 2.7') +
        q(prefix,'pressao_negativa','A cabine apresenta pressão negativa em relação às áreas adjacentes, impedindo dispersão de pós e contaminação cruzada?','RDC 67/2007 · Anexo III · item 2.7.2') +
        q(prefix,'materias','As matérias-primas estão dentro da validade, correspondem à classe terapêutica da cabine e estão identificadas quanto à situação interna?','RDC 67/2007 · Anexo I · item 7.4.5') +
        q(prefix,'armazenamento','As matérias-primas são mantidas em local de acesso restrito, sob guarda do farmacêutico, com segregação de puras e diluídas quando aplicável?','RDC 67/2007 · Anexo III · armazenamento e segregação') +
        q(prefix,'utensilios','Os utensílios e placas encapsuladoras estão diferenciados e identificados para esta classe?','RDC 67/2007 · Anexo I · item 5.4; Anexo III · item 2.10') +
        q(prefix,'transporte_sujos','Há recipiente exclusivo/identificado para transporte de utensílios sujos até a área de lavagem?','RDC 67/2007 · prevenção de contaminação cruzada') +
        q(prefix,'pesagem','A pesagem para manipulação é efetuada na sala dedicada, com dupla checagem e registro quando previsto?','RDC 67/2007 · Anexo III · requisitos específicos de pesagem') +
        (refSpecific ? ref(refSpecific) : '') +
        pressureBlock(prefix) + balance(prefix) + U.monitoring(f(prefix + '.monitoramento')) +
        U.refrigerator(f(prefix + '.refrigerador'), { title:'Refrigerador da cabine, se existente' }) +
        planilhas(prefix) + U.photoNotes('s6_' + prefix + '_geral', n(prefix + '.geral'))
      );
    }

    function general() {
      const p = 'geral';
      return U.box('6.1 Laboratórios de Sensibilizantes — requisitos gerais',
        U.localApplicability(f(p + '.aplicabilidade'), 'Os laboratórios de sensibilizantes se aplicam a esta inspeção?') +
        U.info('A Seção 6 nunca é ocultada automaticamente pelas respostas da Seção 1. Cada classe abaixo possui aplicabilidade própria.') +
        q(p,'salas_dedicadas','Há salas de manipulação dedicadas, com antecâmara, para as classes sensibilizantes efetivamente manipuladas?','RDC 67/2007 · Anexo III · item 2.7') +
        q(p,'sistemas_independentes','Os sistemas de ar/exaustão são independentes e de eficiência comprovada para as classes aplicáveis?','RDC 67/2007 · Anexo III · item 2.7') +
        q(p,'pressao','As salas mantêm pressão negativa em relação às áreas adjacentes?','RDC 67/2007 · Anexo III · item 2.7.2') +
        q(p,'pesagem','A pesagem de hormônios, antibióticos e citostáticos é efetuada na respectiva sala de manipulação, com procedimentos para evitar contaminação cruzada?','RDC 67/2007 · Anexo III · itens 2.8 e 2.8.1') +
        q(p,'limpeza','Há limpeza rigorosa de balanças, bancadas e superfícies entre manipulações, conforme procedimento?','RDC 67/2007 · Anexo III · item 2.9') +
        q(p,'utensilios','Utensílios e equipamentos de contato direto são separados/identificados por classe terapêutica?','RDC 67/2007 · Anexo III · item 2.10') +
        q(p,'epi','Os EPI utilizados são compatíveis com o risco de exposição às substâncias manipuladas?','RDC 67/2007 · Anexo III · requisitos de proteção ocupacional') +
        q(p,'pop_contaminacao','Há procedimento para prevenção de contaminação cruzada entre classes e demais áreas?','RDC 67/2007 · Anexo III') +
        q(p,'excipientes','Os excipientes utilizados nas preparações aplicáveis são padronizados conforme os critérios técnicos do estabelecimento?','RDC 67/2007 · Anexo III e Anexo II quando aplicável') +
        '<section class="manip-subcard"><h4>Manômetro de referência da área</h4>' + U.calibration(f(p + '.manometro'), 'Manômetro') + U.photoNotes('s6_manometro_geral', n(p + '.manometro')) + '</section>'
      );
    }

    function render() {
      return general() +
        cabin('hormonios','Hormônios','') +
        cabin('antibioticos','Antibióticos','') +
        cabin('citostaticos','Citostáticos','') +
        cabin('penicilinicos','Penicilínicos','O roteiro revisado utilizado como base não contém bloco específico independente para Penicilínicos; este cartão segue a estrutura técnica comum às cabines por decisão de projeto, sem atribuir numeração inexistente ao roteiro-fonte.');
    }

    C.registerSection('6',{title:'Laboratórios de Sensibilizantes',shortTitle:'Sensibilizantes',render});
    window.ManipulacaoSection6=Object.freeze({render});
    document.dispatchEvent(new CustomEvent('manipulacao:section6-ready'));
  };
  start();
})();
