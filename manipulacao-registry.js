/* Farmácia de Manipulação — registro das nove seções. */
(() => {
  'use strict';
  const start = () => {
    const C = window.ManipulacaoCore;
    if (!C) return setTimeout(start, 25);
    const titles = {
      1: ['Identificação do Estabelecimento e Informações Gerais', 'Identificação'],
      2: ['Edificações e Instalações', 'Edificações'],
      3: ['Pessoal, Saúde Ocupacional e Treinamento', 'Pessoal e saúde'],
      4: ['Áreas Físicas', 'Áreas físicas'],
      5: ['Laboratórios', 'Laboratórios'],
      6: ['Laboratórios de Sensibilizantes', 'Sensibilizantes'],
      7: ['Documentos Apresentados', 'Documentos'],
      8: ['Monitoramento do Processo Magistral e da Água', 'Monitoramento'],
      9: ['Rastreabilidade e Controle de Qualidade', 'Rastreabilidade']
    };
    Object.entries(titles).forEach(([id, [title, shortTitle]]) => {
      C.registerSection(id, {
        title, shortTitle,
        render: () => '<section class="manip-box"><p class="manip-info">Seção em implementação nesta ramificação de trabalho. Os dados das demais seções permanecem preservados.</p></section>'
      });
    });
    document.dispatchEvent(new CustomEvent('manipulacao:registry-ready'));
  };
  start();
})();
