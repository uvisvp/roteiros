/* Farmácia de Manipulação — Seção 2: Edificações e Instalações. */
(() => {
  'use strict';
  if (window.ManipulacaoSection2) return;

  const start = () => {
    const C = window.ManipulacaoCore, U = window.ManipulacaoUI;
    if (!C || !U) return setTimeout(start, 25);
    const B = 'sections.2';
    const f = k => B + '.fields.' + k;
    const a = k => B + '.answers.' + k;
    const n = k => B + '.notes.' + k;
    const ref = text => '<p class="manip-reference">' + C.esc(text) + '</p>';

    function q(id, text, reference, help = '') {
      return U.question({ id: 's2_' + id, text, help, answerPath: a(id), notesPath: n(id), photoKey: 's2_' + id }) + ref(reference);
    }

    function render() {
      return U.box('Caracterização da edificação',
        U.info('Descrição geral do imóvel. Esta caracterização alimenta o texto narrativo do relatório; não substitui as verificações sanitárias abaixo.') +
        U.grid(
          U.select(f('caracterizacao.tipo_imovel'), 'Tipo de imóvel', [
            ['rua','Imóvel comercial / de rua'],['galeria','Galeria comercial'],['shopping','Shopping center'],['predio','Pavimento de prédio comercial'],['outro','Outro']
          ]) +
          U.input(f('caracterizacao.pavimentos'), 'Número de pavimentos', { type: 'number', min: 1 }) +
          U.input(f('caracterizacao.acesso'), 'Acesso ao estabelecimento', { placeholder: 'Ex.: único, livre e independente' }) +
          U.input(f('caracterizacao.comunicacao'), 'Comunicação com outro estabelecimento/residência') +
          U.input(f('caracterizacao.identificacao_externa'), 'Identificação externa / placa') +
          U.input(f('caracterizacao.reservatorio'), 'Localização do reservatório de água')
        ) +
        U.textarea(f('caracterizacao.particularidades'), 'Particularidades estruturais', { placeholder: 'Mezanino, depósitos, escadas, circulação, outras características relevantes.' }) +
        U.photoNotes('s2_caracterizacao', n('caracterizacao'))
      ) +
      U.box('Condições gerais da edificação e instalações',
        q('fontes_contaminantes', 'A empresa encontra-se instalada em área livre de focos contaminantes e poluentes?', 'RDC 67/2007 · Anexo I · item 4') +
        q('superficies', 'As superfícies internas (paredes, pisos e teto) são lisas, impermeáveis, sem rachaduras, resistentes aos agentes sanitizantes e facilmente laváveis?', 'RDC 67/2007 · Anexo I · item 4.13', 'Observar trincas, infiltrações, descascamentos, superfícies porosas ou danificadas.') +
        q('limpeza_conservacao', 'As instalações estão limpas e em bom estado de conservação?', 'RDC 67/2007 · Anexo I · requisitos de edificações e instalações') +
        q('eletrica_hidraulica', 'As instalações elétricas e hidráulicas estão em bom estado de conservação?', 'RDC 67/2007 · Anexo I · requisitos de edificações e instalações') +
        q('fluxo_layout', 'As áreas e instalações estão organizadas de forma a evitar riscos de contaminação e misturas de componentes, garantindo a sequência das operações?', 'RDC 67/2007 · Anexo I · item 4.14') +
        q('iluminacao_ventilacao', 'A iluminação e a ventilação são compatíveis com as operações e os materiais manuseados?', 'RDC 67/2007 · Anexo I · item 4.16') +
        q('descanso_refeitorio', 'As salas de descanso e refeitório, quando existentes, estão separadas dos demais ambientes?', 'RDC 67/2007 · Anexo I · item 4.17') +
        q('incendio', 'Existem sistemas/equipamentos para combate a incêndio, conforme legislação específica?', 'RDC 67/2007 · Anexo I · item 4.18', 'Aqui é verificada a condição física e disponibilidade dos equipamentos. O AVCB/CLCB é analisado na Seção 7.') +
        q('identificacao_publico', 'Há sistema de identificação do estabelecimento visível ao público?', 'RDC 67/2007 · Anexo I · identificação do estabelecimento')
      ) +
      U.box('Observações estruturais complementares',
        U.textarea(f('observacoes_estruturais'), 'Descrição complementar da edificação', { rows: 4 }) +
        '<div class="manip-actions"><button type="button" data-manip-open-section="7">Ir para Documentos — AVCB/CLCB</button></div>' +
        U.photoNotes('s2_geral', n('geral'))
      );
    }

    C.registerSection('2', { title: 'Edificações e Instalações', shortTitle: 'Edificações', render });
    window.ManipulacaoSection2 = Object.freeze({ render });
    document.dispatchEvent(new CustomEvent('manipulacao:section2-ready'));
  };
  start();
})();
