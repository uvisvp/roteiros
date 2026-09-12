/* Farmácia de Manipulação — Seção 5: Laboratórios. */
(() => {
  'use strict';
  if (window.ManipulacaoSection5) return;

  const start = () => {
    const C = window.ManipulacaoCore, U = window.ManipulacaoUI;
    if (!C || !U) return setTimeout(start, 25);
    const B = 'sections.5';
    const f = k => B + '.fields.' + k;
    const a = k => B + '.answers.' + k;
    const n = k => B + '.notes.' + k;
    const arr = k => C.field(f(k), []);
    const ref = text => '<p class="manip-reference">' + C.esc(text) + '</p>';

    function q(prefix, id, text, reference, help = '', requirement = '') {
      return U.question({ id: 's5_' + prefix + '_' + id, text, help, requirement, answerPath: a(prefix + '.' + id), notesPath: n(prefix + '.' + id), photoKey: 's5_' + prefix + '_' + id }) + ref(reference);
    }

    function equipmentRows(prefix, defaults = []) {
      const path = prefix + '.equipamentos';
      const rows = arr(path);
      const hint = defaults.length && !rows.length ? U.info('Sugestões: ' + defaults.join(', ') + '. Adicione somente os equipamentos efetivamente verificados.') : '';
      const items = rows.map((row, i) => '<section class="manip-repeat-row"><div class="manip-grid">' +
        U.input(f(path + '.' + i + '.equipamento'), 'Equipamento') +
        U.input(f(path + '.' + i + '.marca_modelo'), 'Marca / modelo') +
        U.input(f(path + '.' + i + '.identificacao'), 'Identificação') +
        U.input(f(path + '.' + i + '.certificado'), 'Certificado de calibração') +
        U.input(f(path + '.' + i + '.validade'), 'Validade', { type: 'date' }) +
        U.input(f(path + '.' + i + '.emitido_por'), 'Emitido por') +
      '</div><button type="button" data-manip-s5-remove="' + C.esc(path) + '|' + i + '">Remover equipamento</button></section>').join('');
      return hint + items + '<button type="button" data-manip-s5-add="' + C.esc(path) + '">+ Adicionar equipamento / instrumento</button>';
    }

    function balance(prefix) {
      return '<section class="manip-subcard"><h4>Verificação diária da balança</h4>' +
        U.requirement('Antes do início das atividades, utilizando peso padrão.', 'RDC 67/2007 · Anexo I · item 5.2.2') +
        U.grid(U.input(f(prefix + '.balanca_verificacao.identificacao'), 'Balança identificada como') +
          U.input(f(prefix + '.balanca_verificacao.pesos'), 'Peso(s) padrão utilizado(s)') +
          U.input(f(prefix + '.balanca_verificacao.resultado'), 'Resultado')) +
        '<div class="manip-mini-choice"><b>Registros mantidos?</b>' + U.choice(f(prefix + '.balanca_verificacao.registros'), [['c','Conforme'],['nc','Não conforme'],['na','Não se aplica']]) + '</div>' +
        U.photoNotes('s5_' + prefix + '_balanca', f(prefix + '.balanca_verificacao.anotacoes')) + '</section>';
    }

    function planilhas(prefix, config = {}) {
      const list = [
        ['temp_umidade','Monitoramento de temperatura e umidade com parâmetros, referência e campo de ação corretiva'],
        ['limpeza','Limpeza do laboratório, bancadas e equipamentos'],
        ['balanca','Verificação diária das balanças com peso padrão antes do início das atividades']
      ];
      if (config.fridge) list.push(['geladeira','Controle de temperatura do refrigerador com parâmetros e campo de ação corretiva']);
      if (config.purifier) list.push(['purificador','Limpeza e manutenção do sistema de purificação de água, incluindo troca de componentes e filtros']);
      if (config.exhaust) list.push(['exaustao','Limpeza e manutenção do sistema de exaustão, incluindo troca de filtros']);
      return '<section class="manip-subcard"><h4>Planilhas e registros deste laboratório</h4>' +
        U.info('As verificações de planilhas ficam dentro do laboratório correspondente. Não há OCR de planilhas.') +
        list.map(([id, label]) => q(prefix + '.planilhas', id, label + '?', 'RDC 67/2007 · itens correspondentes do roteiro')).join('') + '</section>';
    }

    function almoxarifado() {
      const p = 'almoxarifado';
      return U.box('5.1 Almoxarifado de matérias-primas e/ou materiais de embalagem',
        U.textarea(f(p + '.descricao'), 'Descrição do ambiente e fluxo') +
        q(p,'acesso','A área de armazenamento tem acesso restrito e capacidade suficiente para a estocagem ordenada de matérias-primas, embalagens e produtos manipulados?','RDC 67/2007 · Anexo I · item 4.2') +
        q(p,'condicoes','A área é mantida limpa, seca e em temperatura e umidade compatíveis, monitoradas e registradas?','RDC 67/2007 · Anexo I · item 4.2.1') +
        q(p,'afastamento','Os materiais são mantidos afastados do piso, paredes e teto, com espaçamento que permita limpeza e inspeção?','RDC 67/2007 · Anexo I · item 7.4.1') +
        q(p,'validade_status','As matérias-primas estão dentro do prazo de validade e identificadas quanto à situação interna?','RDC 67/2007 · Anexo I · itens 7.4.2 e 7.4.5') +
        q(p,'quarentena','Há área segregada e identificada para matérias-primas, embalagens e produtos em quarentena?','RDC 67/2007 · Anexo I · item 4.2.3') +
        q(p,'reprovados','Há área segregada e identificada para reprovados, devolvidos ou vencidos?','RDC 67/2007 · Anexo I · item 4.2.4') +
        q(p,'devolucao','Materiais reprovados no recebimento são segregados e devolvidos ao fornecedor conforme procedimento aplicável?','RDC 67/2007 · Anexo I · item 7.2.8') +
        q(p,'controlados','Há armário resistente e/ou sala própria, com chave, para substâncias e medicamentos sujeitos a controle especial?','RDC 67/2007 · Anexo I · item 4.2.5') +
        q(p,'sbit','As SBIT e demais substâncias sujeitas a diluição estão em local distinto, restrito, sob guarda do farmacêutico e claramente identificadas?','RDC 67/2007 · Anexo I · item 4.2.6') +
        q(p,'perigosos','Há local e equipamentos seguros para produtos inflamáveis, cáusticos, corrosivos e explosivos?','RDC 67/2007 · Anexo I · itens 4.2.7 e 7.4.4') +
        q(p,'pesagem','A pesagem das matérias-primas é feita em sala/local específico, dotado de exaustão e com prévia limpeza das embalagens?','RDC 67/2007 · Anexo I · itens 4.4 e 4.4.1') +
        q(p,'embalagens','Os materiais de embalagem possuem dados de rastreabilidade e de higienização?','RDC 67/2007 · Anexo I · itens 4.2.2 e 4.4.1') +
        q(p,'fornecedores','Há cadastro dos fornecedores dos materiais?','RDC 67/2007 · Anexo I · item 7.1.4') +
        q(p,'estoque','A farmácia mantém controle de estoque das matérias-primas, com entradas e saídas rastreáveis?','RDC 67/2007 · Anexo I · itens 7.4.7 a 7.4.9') +
        U.monitoring(f(p + '.monitoramento')) + U.refrigerator(f(p + '.refrigerador'), { title: 'Refrigerador do almoxarifado, se existente' }) +
        planilhas(p, { fridge: true }) + U.photoNotes('s5_almoxarifado_geral', n(p + '.geral'))
      );
    }

    function cq() {
      const p = 'cq';
      return U.box('5.2 Controle de Qualidade (CQ)',
        U.textarea(f(p + '.descricao'), 'Descrição da área, fluxo e atividades') +
        q(p,'area','A farmácia dispõe de área ou sala específica para as atividades de controle de qualidade?','RDC 67/2007 · Anexo I · item 4.3') +
        q(p,'pessoal','A área dispõe de pessoal capacitado e habilitado e está equipada para realizar as análises legalmente estabelecidas?','RDC 67/2007 · Anexo I · itens 7.3.1 e 7.3.5') +
        q(p,'instalacoes','Há instalações, instrumentos, equipamentos e procedimentos aprovados para amostragem, inspeção e ensaios?','RDC 67/2007 · Anexo I · item 7.3.2') +
        q(p,'referencias','As especificações e referências farmacopeicas/Codex ou outras reconhecidas estão disponíveis?','RDC 67/2007 · Anexo I · item 7.3.4') +
        q(p,'capela','Substâncias voláteis, tóxicas, corrosivas, cáusticas e irritantes são manipuladas em capela com exaustão quando aplicável?','RDC 67/2007 · Anexo I · item 4.5.1') +
        q(p,'fispq','Os solventes estão armazenados conforme as respectivas FISPQ?','RDC 67/2007 · requisitos de segurança') +
        q(p,'amostragem','A amostragem dos insumos é feita em local e condições que impeçam contaminação cruzada, com utensílios limpos e guardados adequadamente?','RDC 67/2007 · Anexo I · itens 7.3.20 e 7.3.21') +
        q(p,'segregacao','Quarentena, materiais reprovados e demais situações internas estão segregados e identificados?','RDC 67/2007 · controle de qualidade') +
        q(p,'reanalise','Quando aplicável, a reanálise de matérias-primas segue procedimento e critérios definidos?','RDC 67/2007 · controle de qualidade') +
        q(p,'reprovacao','Resultados de reprovação são tratados e comunicados conforme o procedimento aplicável?','RDC 67/2007 · controle de qualidade') +
        '<h4>Equipamentos e instrumentos — calibração</h4>' + equipmentRows(p, ['Balança','pHmetro','Ponto de fusão','Pesos padrão','Picnômetro','Vidrarias']) +
        balance(p) + U.monitoring(f(p + '.monitoramento')) + U.refrigerator(f(p + '.refrigerador'), { title: 'Refrigerador do CQ, se existente' }) +
        planilhas(p, { fridge: true, exhaust: true }) + U.photoNotes('s5_cq_geral', n(p + '.geral'))
      );
    }

    function semisolidos() {
      const p = 'semissolidos_liquidos';
      return U.box('5.3 Laboratório de Semissólidos e Líquidos',
        U.textarea(f(p + '.descricao'), 'Descrição do laboratório, bancadas, mobiliário e fluxo') +
        q(p,'segregacao','A sala está totalmente segregada dos demais laboratórios?','RDC 67/2007 · Anexo I · item 4.5') +
        q(p,'balanca','Há ao menos uma balança com capacidade/sensibilidade compatível e procedimentos contra contaminação cruzada e microbiana?','RDC 67/2007 · Anexo I · item 5.1.3') +
        q(p,'utensilios','Os utensílios estão diferenciados e identificados para uso interno e externo?','RDC 67/2007 · Anexo I · itens 5.4.1 e 5.4.2') +
        q(p,'materias','As matérias-primas estão dentro da validade e identificadas, incluindo a situação interna?','RDC 67/2007 · Anexo I · item 7.4.5') +
        q(p,'alertas','As matérias-primas diluídas e concentradas possuem os alertas previstos?','RDC 67/2007 · Anexo I · item 7.4.6') +
        q(p,'agua_24h','Há frasco de água purificada com data/hora de coleta, armazenada por menos de 24 horas e com sanitização do recipiente a cada troca?','RDC 67/2007 · Anexo I · item 7.5.2.5','','Uso inferior a 24 horas.') +
        q(p,'ambiente','A sala é mantida com temperatura e umidade compatíveis, monitoradas e registradas?','RDC 67/2007 · Anexo I · item 8.8') +
        '<section class="manip-subcard"><h4>Sistema purificador de água</h4>' + U.grid(
          U.input(f(p + '.purificador.metodo'), 'Método') + U.input(f(p + '.purificador.marca'), 'Marca') + U.input(f(p + '.purificador.modelo'), 'Modelo') +
          U.input(f(p + '.purificador.troca_por'), 'Troca de resina/carvão por') + U.input(f(p + '.purificador.troca_data'), 'Data da troca', { type: 'date' }) + U.input(f(p + '.purificador.validade'), 'Validade / próxima troca', { type: 'date' })
        ) + '</section>' +
        '<h4>Equipamentos e instrumentos — calibração</h4>' + equipmentRows(p, ['Balança','pHmetro de bancada']) + balance(p) +
        '<section class="manip-subcard"><h4>Bases galênicas / estoque mínimo</h4>' +
          U.requirement('Quando aplicável: identificação “uso em 30 dias”; amostra de referência mantida até 4 meses após o vencimento.', 'RDC 67/2007 · itens 8.1, 11.1, 11.2 e 11.3') +
          U.grid(U.input(f(p + '.bases.nome'), 'Base avaliada') + U.input(f(p + '.bases.lote'), 'Lote') + U.input(f(p + '.bases.validade'), 'Validade', { type: 'date' })) +
          U.question({ id:'s5_base', text:'Foram verificadas rastreabilidade dos insumos, identificação, controle em processo lote a lote e amostra de referência quando aplicáveis?', answerPath:a(p + '.bases_conformidade'), notesPath:n(p + '.bases_conformidade') }) + '</section>' +
        U.monitoring(f(p + '.monitoramento')) + U.refrigerator(f(p + '.refrigerador'), { title: 'Refrigerador do laboratório, se existente' }) +
        planilhas(p, { fridge: true, purifier: true, exhaust: true }) + U.photoNotes('s5_semissolidos_geral', n(p + '.geral'))
      );
    }

    function solidos() {
      const p = 'solidos';
      return U.box('5.4 Laboratório de Sólidos',
        U.textarea(f(p + '.descricao'), 'Descrição do laboratório, equipamentos e fluxo') +
        q(p,'segregacao','A sala está totalmente segregada dos demais laboratórios?','RDC 67/2007 · Anexo I · item 4.5') +
        q(p,'exaustao','Nas etapas com matérias-primas em pó, há sistema de exaustão qualificado e em funcionamento, evitando dispersão?','RDC 67/2007 · Anexo I · item 8.7') +
        q(p,'balanca','Há ao menos uma balança com capacidade/sensibilidade compatível?','RDC 67/2007 · Anexo I · item 5.1.3') +
        q(p,'utensilios','Os utensílios estão diferenciados e identificados para uso interno e externo?','RDC 67/2007 · Anexo I · itens 5.4.1 e 5.4.2') +
        q(p,'materias','As matérias-primas estão dentro da validade e identificadas, incluindo a situação interna?','RDC 67/2007 · Anexo I · item 7.4.5') +
        q(p,'alertas','As matérias-primas diluídas e concentradas possuem os alertas previstos?','RDC 67/2007 · Anexo I · item 7.4.6') +
        q(p,'excipientes','Os excipientes são padronizados pela farmácia, com embasamento técnico-científico?','RDC 67/2007 · Anexo I · item 8.2') +
        q(p,'peso_medio','É realizado controle de peso médio, com desvio padrão e coeficiente de variação, nas formulações sólidas?','RDC 67/2007 · Anexo I · itens 9.1.1 e 9.1.3') +
        q(p,'ambiente','A sala é mantida com temperatura e umidade compatíveis, monitoradas e registradas?','RDC 67/2007 · Anexo I · item 8.8') +
        q(p,'utensilios_controlados','Quando aplicável, os utensílios para controlados estão diferenciados e identificados por classe terapêutica?','RDC 67/2007 · Anexo I · item 5.4; Anexo III · item 2.10') +
        q(p,'guarda_controlados','Quando aplicável, há armário ou sala com dispositivo de segurança para matérias-primas controladas?','RDC 67/2007 · Anexo I · item 4.2.5') +
        '<div class="manip-actions"><button type="button" data-manip-s5-action="estoque_controlados">Confronto físico × escriturado → Seção 9.5</button></div>' +
        '<h4>Equipamentos e instrumentos — calibração</h4>' + equipmentRows(p, ['Balança','Equipamento de peso médio']) + balance(p) +
        U.monitoring(f(p + '.monitoramento')) + U.refrigerator(f(p + '.refrigerador'), { title: 'Refrigerador do laboratório, se existente' }) +
        planilhas(p, { fridge: true, exhaust: true }) + U.photoNotes('s5_solidos_geral', n(p + '.geral'))
      );
    }

    function lavagem() {
      const p = 'lavagem';
      return U.box('5.5 Área/local de lavagem de utensílios e materiais de embalagem',
        U.textarea(f(p + '.descricao'), 'Descrição da área, pia/bancada, fluxo e equipamentos') +
        q(p,'area','Há área específica para lavagem ou procedimento formal quando a lavagem ocorre no próprio laboratório em horário distinto da manipulação?','RDC 67/2007 · Anexo I · item 4.9') +
        q(p,'cronograma','Há cronograma de lavagem por classe e utensílios de limpeza separados por classe terapêutica?','RDC 67/2007 · prevenção de contaminação cruzada') +
        q(p,'purificador','Há equipamento de purificação de água instalado nesta área quando previsto no fluxo?','RDC 67/2007 · roteiro de inspeção') +
        q(p,'transporte','Os utensílios sujos são transportados em recipientes adequados e identificados, com segregação suficiente?','RDC 67/2007 · Boas Práticas de Manipulação') +
        U.grid(U.input(f(p + '.produtos'), 'Produtos utilizados na limpeza') + U.input(f(p + '.estufa'), 'Estufa / equipamento de secagem, se houver')) +
        U.refrigerator(f(p + '.refrigerador'), { title: 'Refrigerador nesta área, se existente' }) +
        planilhas(p, { purifier: true }) + U.photoNotes('s5_lavagem_geral', n(p + '.geral'))
      );
    }

    function homeopatia() {
      const p = 'homeopatia';
      return U.box('5.6 Laboratório de Homeopatia',
        U.localApplicability(f(p + '.aplicabilidade'), 'O laboratório de Homeopatia se aplica a esta inspeção?') +
        U.info('O bloco não é ocultado automaticamente pelo perfil informado na Seção 1.') +
        U.textarea(f(p + '.descricao'), 'Descrição do laboratório') +
        q(p,'sala','Há sala exclusiva para preparações homeopáticas, em área de baixa incidência de radiações e odores fortes?','RDC 67/2007 · Anexo V · itens 3.1 e 3.3.1') +
        q(p,'matrizes','As matrizes homeopáticas e tinturas estão dentro da validade e identificadas, incluindo situação interna?','RDC 67/2007 · Anexo V') +
        q(p,'equipamentos','A sala dispõe de alcoômetro de Gay-Lussac e balança de uso exclusivo, calibrados?','RDC 67/2007 · Anexo V · item 3.3.2') +
        q(p,'inativacao','Há área/local de lavagem e inativação dotado de estufa, com registros de temperatura e tempo?','RDC 67/2007 · Anexo V · itens 3.4.1 e 3.4.3') +
        q(p,'alcoois','A manipulação dos álcoois possui rastreabilidade e frascos identificados para uso em 30 dias?','RDC 67/2007 · item 8.1','','Uso em 30 dias.') +
        q(p,'cq_om','As ordens de manipulação possuem registros dos ensaios de controle de qualidade aplicáveis?','RDC 67/2007 · Anexo V') +
        q(p,'dinamizadas','As matrizes dinamizadas possuem registros que permitam sua rastreabilidade?','RDC 67/2007 · Anexo V') +
        q(p,'autoisoterapico','Quando aplicável, há sala específica para coleta e manipulação até 12CH/24DH, com monitoramento de inativação microbiana e POP de biossegurança?','RDC 67/2007 · Anexo V · itens 3.3.3 a 3.3.4') +
        '<h4>Equipamentos e instrumentos — calibração</h4>' + equipmentRows(p, ['Balança de uso exclusivo','Alcoômetro','Estufa de inativação']) + balance(p) +
        U.monitoring(f(p + '.monitoramento')) + U.refrigerator(f(p + '.refrigerador'), { title: 'Refrigerador de Homeopatia, se existente' }) +
        planilhas(p, { fridge: true }) + U.photoNotes('s5_homeopatia_geral', n(p + '.geral'))
      );
    }

    function sbit() {
      const p = 'sbit';
      return U.box('SBIT — Substâncias de Baixo Índice Terapêutico',
        U.localApplicability(f(p + '.aplicabilidade'), 'Os requisitos de SBIT se aplicam a esta inspeção?') +
        U.textarea(f(p + '.substancias'), 'SBIT manipuladas / avaliadas') +
        U.select(f(p + '.situacao_licenca'), 'Situação da licença para SBIT', [['licenciada','Licenciada'],['solicitacao','Em solicitação / ampliação'],['sem_licenca','Sem licença'],['na','Não se aplica']]) +
        q(p,'licenca','A situação da licença sanitária para manipulação de SBIT foi verificada pela equipe?','RDC 67/2007 · Anexo II · itens 2.1 e 2.7','O aplicativo registra o cenário sem emitir conclusão automática.') +
        q(p,'lista','As SBIT manipuladas foram confrontadas com a lista aplicável do Anexo II?','RDC 67/2007 · Anexo II · item 2.3') +
        q(p,'fornecedor','A aquisição é precedida da qualificação de fornecedores?','RDC 67/2007 · Anexo II · item 2.11.1') +
        q(p,'rotulo','Há identificação especial no recebimento alertando tratar-se de SBIT?','RDC 67/2007 · Anexo II · item 2.11.2') +
        q(p,'armazenamento','As SBIT são armazenadas em local distinto, restrito, sob guarda do farmacêutico e claramente identificadas?','RDC 67/2007 · Anexo I · item 4.2.6; Anexo II · item 2.11.3') +
        q(p,'dupla','Na pesagem para manipulação há dupla checagem, uma realizada pelo farmacêutico, com registro?','RDC 67/2007 · Anexo II · item 2.11.4') +
        q(p,'capsula','No encapsulamento são utilizadas cápsulas do menor tamanho compatível com a dosagem?','RDC 67/2007 · Anexo II · item 2.11.6') +
        q(p,'homogeneizacao','A homogeneização emprega os mesmos excipientes e metodologia do produto objeto do perfil de dissolução?','RDC 67/2007 · Anexo II · item 2.11.5') +
        q(p,'perfil','Há perfil de dissolução para os produtos sólidos manipulados com cada SBIT?','RDC 67/2007 · Anexo II · item 2.10') +
        q(p,'excipientes','Os excipientes são padronizados conforme compatibilidade documentada em fontes técnico-científicas?','RDC 67/2007 · Anexo II · item 2.10.1') +
        q(p,'atencao','A dispensação ocorre mediante atenção farmacêutica e acompanhamento do uso correto pelo paciente?','RDC 67/2007 · Anexo II · itens 2.6 e 2.11.8') +
        '<section class="manip-subcard"><h4>Baixa dosagem e alta potência</h4>' + U.requirement('Aplicável às substâncias indicadas no Anexo II, item 2.4.') +
          q(p + '.alta','dupla_diluicao','Na pesagem para diluição há dupla checagem do operador e farmacêutico, com registro?','RDC 67/2007 · Anexo II · item 2.12.1') +
          q(p + '.alta','geometrica','A diluição e a homogeneização empregam diluição geométrica e excipientes padronizados?','RDC 67/2007 · Anexo II · item 2.12.2') +
          q(p + '.alta','alertas','As SBIT diluídas estão identificadas com os alertas “concentrado” e “diluído”?','RDC 67/2007 · Anexo I · item 7.4.6') +
          q(p + '.alta','teor','São realizados teor após preparo e monitoramento trimestral do diluído armazenado, com coleta em pelo menos três pontos?','RDC 67/2007 · Anexo II · itens 2.12.3 e 2.12.3.1','','Trimestral; pelo menos três pontos.') + '</section>' +
        '<section class="manip-subcard"><h4>Monitoramento do processo — vínculo com Seção 8</h4>' +
          q(p + '.monitoramento','trimestral','É realizada análise completa de no mínimo uma formulação contendo SBIT a cada três meses, em sistema de rodízio?','RDC 67/2007 · Anexo II · itens 2.13 a 2.13.2','','No mínimo uma formulação a cada três meses.') +
          q(p + '.monitoramento','arquivo','Há POP da metodologia e os resultados são arquivados pelo período mínimo previsto?','RDC 67/2007 · Anexo II · itens 2.14 e 2.15','','Arquivamento mínimo de 2 anos.') +
          q(p + '.monitoramento','insatisfatorio','Em resultado insatisfatório, a efetividade das medidas é avaliada por nova análise, com registro?','RDC 67/2007 · Anexo II · item 2.16') +
          '<div class="manip-actions"><button type="button" data-manip-open-section="8">Abrir laudos / monitoramento → Seção 8</button></div></section>' +
        U.photoNotes('s5_sbit_geral', n(p + '.geral'))
      );
    }

    function render() { return almoxarifado() + cq() + semisolidos() + solidos() + lavagem() + homeopatia() + sbit(); }

    function add(path) {
      C.update(state => { const full=f(path), list=C.getPath(state,full,[]), next=Array.isArray(list)?list:[]; next.push({equipamento:'',marca_modelo:'',identificacao:'',certificado:'',validade:'',emitido_por:''}); C.setPath(state,full,next); }, {source:'section5-array-add'});
    }
    function remove(path, index) {
      C.update(state => { const full=f(path), list=C.getPath(state,full,[]); if(Array.isArray(list)) list.splice(Number(index),1); C.setPath(state,full,list); }, {source:'section5-array-remove'});
    }
    let installed=false;
    function install() {
      if(installed) return; installed=true;
      document.addEventListener('click', event => {
        const addBtn=event.target.closest?.('[data-manip-s5-add]'); if(addBtn){add(addBtn.dataset.manipS5Add);return;}
        const rem=event.target.closest?.('[data-manip-s5-remove]'); if(rem){const [path,i]=rem.dataset.manipS5Remove.split('|');remove(path,i);return;}
        const action=event.target.closest?.('[data-manip-s5-action]'); if(action?.dataset.manipS5Action==='estoque_controlados') C.render('9');
      });
    }

    C.registerSection('5',{title:'Laboratórios',shortTitle:'Laboratórios',render,afterRender:install});
    window.ManipulacaoSection5=Object.freeze({render,install});
    document.dispatchEvent(new CustomEvent('manipulacao:section5-ready'));
  };
  start();
})();
