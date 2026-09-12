/* Farmácia de Manipulação — Seção 4: Áreas Físicas. */
(() => {
  'use strict';
  if (window.ManipulacaoSection4) return;

  const start = () => {
    const C = window.ManipulacaoCore, U = window.ManipulacaoUI;
    if (!C || !U) return setTimeout(start, 25);
    const B = 'sections.4';
    const f = k => B + '.fields.' + k;
    const a = k => B + '.answers.' + k;
    const n = k => B + '.notes.' + k;
    const arr = k => C.field(f(k), []);
    const ref = text => '<p class="manip-reference">' + C.esc(text) + '</p>';

    function q(prefix, id, text, reference, help = '') {
      return U.question({ id: 's4_' + prefix + '_' + id, text, help, answerPath: a(prefix + '.' + id), notesPath: n(prefix + '.' + id), photoKey: 's4_' + prefix + '_' + id }) + ref(reference);
    }

    function equipmentRows() {
      const rows = arr('servicos.equipamentos');
      if (!rows.length) return U.info('Nenhum equipamento de serviço farmacêutico cadastrado.');
      return rows.map((row, i) => '<section class="manip-repeat-row"><div class="manip-grid">' +
        U.input(f('servicos.equipamentos.' + i + '.equipamento'), 'Equipamento / aparelho') +
        U.input(f('servicos.equipamentos.' + i + '.registro'), 'Registro / notificação / cadastro Anvisa') +
        U.input(f('servicos.equipamentos.' + i + '.identificacao'), 'Identificação') +
        U.input(f('servicos.equipamentos.' + i + '.certificado'), 'Certificado de calibração') +
        U.input(f('servicos.equipamentos.' + i + '.validade'), 'Validade da calibração', { type: 'date' }) +
      '</div><button type="button" data-manip-s4-remove="servicos.equipamentos|' + i + '">Remover equipamento</button></section>').join('');
    }

    function reception() {
      const p = 'recepcao';
      return U.box('4.1 Recepção e área de vendas / dispensação',
        U.textarea(f(p + '.descricao'), 'Descrição do ambiente', { placeholder: 'Balcões, computadores, mobiliário, climatização, acomodação de clientes, guarda de fórmulas prontas e demais particularidades.' }) +
        q(p,'guarda','A área de dispensação possui local de guarda de produtos manipulados/fracionados organizado, protegido do calor, da umidade e da ação direta dos raios solares?','RDC 67/2007 · Anexo I · item 4.6') +
        q(p,'armario_magistrais','Há armário identificado, com dispositivo de segurança, para o armazenamento de preparações magistrais?','RDC 67/2007 · Anexo I · item 4.6.1') +
        q(p,'informacoes_publico','Estão expostos ao público os documentos e informações obrigatórios aplicáveis ao estabelecimento?','RDC 44/2009 · art. 60; RDC 67/2007 · item 15.7.2','Conferir placa antifumo, licença, CRT, AFE/AE quando aplicáveis, contatos institucionais, orientação sobre automedicação e demais informações do roteiro.') +
        q(p,'validade_expostos','Os produtos expostos à venda encontram-se dentro do prazo de validade, por amostragem?','Roteiro de inspeção · verificação por amostragem') +
        q(p,'promocao_manipulados','É respeitada a proibição de exposição ao público de produtos manipulados com objetivo de propaganda, publicidade ou promoção?','RDC 67/2007 · Regulamento Técnico · item 5.14') +
        q(p,'controlados_guarda','Quando aplicável, há área exclusiva e sob dispositivo de segurança para armazenamento de preparações/medicamentos sujeitos a controle especial?','RDC 67/2007 · Anexo I · item 4.2.5') +
        q(p,'dispensacao_controlados','Quando aplicável, a dispensação de controlados e antimicrobianos atende às condições legais verificadas pela equipe?','Portaria SVS/MS 344/1998 e legislação de antimicrobianos aplicável') +
        U.monitoring(f(p + '.monitoramento')) +
        U.refrigerator(f(p + '.refrigerador'), { title: 'Refrigerador da área, se existente' }) +
        '<div class="manip-actions"><button type="button" data-manip-s4-action="rastreabilidade">Selecionar fórmulas para rastreabilidade → Seção 9</button></div>' +
        U.info('Selecionar 2 ou 3 fórmulas prontas; se não houver, utilizar ordens recentes de preparações já dispensadas. A rastreabilidade é executada na Seção 9, sem duplicação.')
      );
    }

    function industrialized() {
      const p = 'industrializados';
      return U.box('4.2 Dispensação de industrializados / drogaria',
        U.localApplicability(f(p + '.aplicabilidade'), 'A dispensação de industrializados se aplica a esta inspeção?') +
        U.info('Este bloco permanece acessível mesmo quando marcado como “Não se aplica”. A resposta da Seção 1 não o oculta automaticamente.') +
        U.textarea(f(p + '.descricao'), 'Descrição da área / atividade') +
        q(p,'termolabeis','Os medicamentos/produtos que exigem temperatura abaixo da ambiente estão devidamente estocados, com registro regular da medição de temperatura do local?','RDC 44/2009 · art. 30') +
        q(p,'segregacao','Há área para segregação de produtos violados, vencidos, sob suspeita de falsificação ou adulteração, em ambiente seguro, diverso da dispensação e identificado quanto à condição e destino?','RDC 44/2009 · art. 28') +
        q(p,'circulacao_restrita','Os medicamentos, exceto os isentos de prescrição, estão armazenados em área de circulação restrita aos funcionários?','RDC 44/2009 · art. 24') +
        q(p,'genericos','Está à disposição dos usuários, em local visível, a lista atualizada dos medicamentos genéricos comercializados no país?','RDC 44/2009 · art. 47') +
        q(p,'controlados','Há sistema segregado, com chave e sob guarda do farmacêutico, para medicamentos sujeitos a controle especial?','RDC 67/2007 · Anexo I · item 4.2.5') +
        q(p,'estoque_escriturado','Confrontado por amostragem, o estoque físico coincide com o escriturado dos medicamentos controlados selecionados?','Portaria SVS/MS 344/1998 · conferência por amostragem','A ferramenta de conferência será chamada pelo botão abaixo; o resultado matemático não gera conclusão automática.') +
        q(p,'sngpc','Foi verificada a situação de transmissão/escrituração do SNGPC quando aplicável?','RDC 22/2014 · referência constante do roteiro, sujeita à revisão normativa final') +
        U.refrigerator(f(p + '.refrigerador'), { title: 'Refrigerador / termolábeis' }) +
        '<div class="manip-actions"><button type="button" data-manip-s4-action="estoque_industrializado">Abrir conferência de estoque de industrializados</button></div>' +
        U.photoNotes('s4_industrializados_geral', n(p + '.geral'))
      );
    }

    function services() {
      const p = 'servicos';
      return U.box('4.3 Sala de prestação de serviços farmacêuticos',
        U.localApplicability(f(p + '.aplicabilidade'), 'A prestação de serviços farmacêuticos se aplica a esta inspeção?') +
        U.textarea(f(p + '.descricao'), 'Descrição da sala / serviços executados') +
        q(p,'lavatório','Há lavatório com água corrente, toalha individual descartável, sabonete líquido, gel bactericida e lixeira com pedal e tampa?','RDC 44/2009 · requisitos para sala de serviços farmacêuticos') +
        q(p,'primeiros_socorros','Estão disponíveis materiais de primeiros socorros identificados e de fácil acesso e EPI aos funcionários envolvidos?','RDC 44/2009 · requisitos para serviços farmacêuticos') +
        q(p,'equipamentos','Os materiais e aparelhos de medição de parâmetros fisiológicos/bioquímicos estão regularizados quando exigido e possuem calibração aplicável?','RDC 44/2009 · requisitos para equipamentos de serviços farmacêuticos') +
        q(p,'perfurocortantes','Há recipiente adequado para descarte de perfurocortantes?','RDC 44/2009 · requisitos para serviços farmacêuticos') +
        q(p,'declaracao','Há formulários de declaração de serviços farmacêuticos em duas vias, com os itens mínimos e devidamente preenchidos?','RDC 44/2009 · serviços farmacêuticos') +
        q(p,'limpeza','Estão disponíveis os registros atualizados de limpeza do espaço?','RDC 44/2009 · serviços farmacêuticos') +
        q(p,'vacinacao','Quando aplicável, os profissionais que administram injetáveis apresentam vacinação ocupacional conferida pela equipe?','Roteiro de inspeção · carteira de vacinação') +
        q(p,'cartaz','Há cartaz com os serviços de saúde próximos?','RDC 44/2009 · serviços farmacêuticos') +
        q(p,'delegacao','Quando aplicável, há delegação formal assinada pelo RT e certificado de capacitação para administração de injetáveis dos funcionários que os aplicam?','Roteiro de inspeção · capacitação e delegação formal') +
        '<h4>Equipamentos / instrumentos</h4>' + equipmentRows() +
        '<button type="button" data-manip-s4-add="servicos.equipamentos">+ Adicionar equipamento</button>' +
        U.refrigerator(f(p + '.refrigerador'), { title: 'Refrigerador da sala, se existente' }) +
        U.photoNotes('s4_servicos_geral', n(p + '.geral'))
      );
    }

    function conference() {
      const p = 'conferencia';
      return U.box('4.4 Área ou local de conferência',
        U.grid(U.input(f(p + '.local'), 'Local da conferência') + U.input(f(p + '.responsavel'), 'Responsável habitual')) +
        U.textarea(f(p + '.organizacao'), 'Como a área é organizada') +
        q(p,'registro','A conferência das preparações é realizada com registro na ordem de manipulação e aprovação pelo farmacêutico antes da dispensação?','RDC 67/2007 · Anexo I · item 9.1.2') +
        q(p,'confronto','A área permite a conferência da ordem de manipulação frente à prescrição, incluindo composição, quantidades e rótulo?','RDC 67/2007 · Anexo I · item 8.4') +
        q(p,'troca_paciente','A área é organizada de forma a evitar troca ou mistura de preparações de pacientes distintos?','RDC 67/2007 · Boas Práticas de Manipulação') +
        U.info('A Ordem de Manipulação é lida e analisada na Seção 9. Aqui se verifica o processo físico e operacional da conferência.') +
        U.photoNotes('s4_conferencia_geral', n(p + '.geral'))
      );
    }

    function support() {
      const d = 'dml', s = 'sanitarios', p = 'paramentacao';
      return U.box('4.5 DML, Sanitários e Paramentação',
        '<section class="manip-subcard"><h4>DML</h4>' + U.localApplicability(f(d + '.aplicabilidade'), 'DML se aplica / existe no estabelecimento?') +
          U.textarea(f(d + '.descricao'), 'Descrição do DML') +
          q(d,'armazenamento','O DML está identificado, com materiais de limpeza e germicidas armazenados em local específico e regularizados quando exigido?','RDC 67/2007 · Anexo I · item 4.10') + U.photoNotes('s4_dml', n(d + '.geral')) + '</section>' +
        '<section class="manip-subcard"><h4>Sanitários e vestiário</h4>' + U.localApplicability(f(s + '.aplicabilidade'), 'Sanitários / vestiário se aplicam a esta inspeção?') +
          U.textarea(f(s + '.descricao'), 'Descrição dos sanitários / vestiário') +
          q(s,'acesso','Os sanitários são de fácil acesso, sem comunicação direta com as áreas de armazenamento, manipulação e controle de qualidade?','RDC 67/2007 · Anexo I · item 4.8') +
          q(s,'insumos','Os sanitários dispõem de toalha individual descartável, detergente líquido e lixeira com pedal e tampa?','RDC 67/2007 · Anexo I · item 4.8') +
          q(s,'vestiario','A farmácia dispõe de vestiário para guarda de pertences e colocação de uniformes?','RDC 67/2007 · Anexo I · item 3.3.10') + U.photoNotes('s4_sanitarios', n(s + '.geral')) + '</section>' +
        '<section class="manip-subcard"><h4>Paramentação</h4>' + U.localApplicability(f(p + '.aplicabilidade'), 'Área de paramentação se aplica a esta inspeção?') +
          U.textarea(f(p + '.descricao'), 'Descrição da área de paramentação') +
          q(p,'barreira','A sala de paramentação é ventilada, preferencialmente com dois ambientes (barreira sujo/limpo), servindo de acesso às áreas de pesagem e manipulação?','RDC 67/2007 · Anexo I · item 4.7') +
          q(p,'lavatório','Há lavatório de uso exclusivo, com sabonete líquido e antisséptico identificados e dispositivo para secagem das mãos?','RDC 67/2007 · Anexo I · item 4.7') +
          q(p,'epi','Há disponibilidade de EPI e delimitação de área suja/limpa?','RDC 67/2007 · Anexo I · item 3.3.7') + U.photoNotes('s4_paramentacao', n(p + '.geral')) + '</section>'
      );
    }

    function render() { return reception() + industrialized() + services() + conference() + support(); }

    function add(path) {
      const templates = { 'servicos.equipamentos': { equipamento: '', registro: '', identificacao: '', certificado: '', validade: '' } };
      C.update(state => {
        const full = f(path), list = C.getPath(state, full, []), next = Array.isArray(list) ? list : [];
        next.push(C.clone(templates[path] || {})); C.setPath(state, full, next);
      }, { source: 'section4-array-add' });
    }
    function remove(path, index) {
      C.update(state => { const full=f(path), list=C.getPath(state,full,[]); if(Array.isArray(list)) list.splice(Number(index),1); C.setPath(state,full,list); }, { source: 'section4-array-remove' });
    }

    let installed = false;
    function install() {
      if (installed) return; installed = true;
      document.addEventListener('click', event => {
        const addBtn = event.target.closest?.('[data-manip-s4-add]'); if (addBtn) { add(addBtn.dataset.manipS4Add); return; }
        const removeBtn = event.target.closest?.('[data-manip-s4-remove]'); if (removeBtn) { const [path,i]=removeBtn.dataset.manipS4Remove.split('|'); remove(path,i); return; }
        const action = event.target.closest?.('[data-manip-s4-action]'); if (!action) return;
        if (action.dataset.manipS4Action === 'rastreabilidade') C.render('9');
        if (action.dataset.manipS4Action === 'estoque_industrializado') document.dispatchEvent(new CustomEvent('manipulacao:drogaria-stock-request', { detail: { source: 'section4.2' } }));
      });
    }

    C.registerSection('4', { title: 'Áreas Físicas', shortTitle: 'Áreas físicas', render, afterRender: install });
    window.ManipulacaoSection4 = Object.freeze({ render, install });
    document.dispatchEvent(new CustomEvent('manipulacao:section4-ready'));
  };
  start();
})();
