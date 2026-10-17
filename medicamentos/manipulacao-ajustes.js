/* Manipulação — ajustes do site Medicamentos (build/montar.cjs coloca no fim
   do módulo).
   “Outra irregularidade — descrever” / “Outra falha — descrever”: o texto só
   entra no relatório com o botão “Irregular” da mesma linha marcado. Ao
   preencher o texto, o botão é marcado sozinho (desmarcar continua possível). */
(function(){
  'use strict';
  window.addEventListener('change', function(e){
    var t = e.target;
    if(!t || t.tagName !== 'INPUT' || !/^Outra (irregularidade|falha|não conformidade) — descrever$/.test(t.placeholder || '') || !t.value.trim()) return;
    var linha = t.closest('.v2-row'), b = linha && linha.querySelector('button[data-v2t$="|I"]');
    if(b && b.getAttribute('aria-pressed') !== 'true') setTimeout(function(){
      /* o módulo pode redesenhar a linha ao salvar o texto: busca o botão de novo */
      var x = document.querySelector('button[data-v2t="' + b.dataset.v2t + '"]') || b;
      if(x.getAttribute('aria-pressed') !== 'true') x.click();
    }, 60);
  }, true);
})();

/* Bloco 13 (estéreis): conceitos no “Para saber mais” de cada item — o que é
   ISO 5/7/8, fluxo laminar, cabine de segurança biológica, HEPA, antecâmara,
   diferencial de pressão, simulação asséptica. Não é norma e não entra no
   relatório (mesmo papel do SaberMais nos blocos 1–12). */
(function(){
  'use strict';
  function poe(){
    var S = window.SaberMais && SaberMais.dados;
    if(!S || !S.manip){ if((poe.n = (poe.n || 0) + 1) < 40) setTimeout(poe, 250); return; }
    var CLASSES = ['Classes ISO de limpeza do ar', 'A ABNT NBR ISO 14644-1 classifica a sala pelo número máximo de partículas no ar, contadas por metro cúbico. Para partículas de 0,5 µm ou maiores: ISO 5 até 3.520/m³; ISO 7 até 352.000/m³; ISO 8 até 3.520.000/m³. Quanto menor o número, mais limpo o ar. Nomes antigos equivalentes: ISO 5 = “classe 100”, ISO 7 = “classe 10.000”, ISO 8 = “classe 100.000”. Nas boas práticas de fabricação, grau A corresponde a ISO 5 e grau C a ISO 7.'];
    var ARRANJO = ['Como a área de estéreis é montada', 'A manipulação acontece dentro de uma zona ISO 5 (fluxo laminar ou cabine de segurança biológica), que fica numa sala ISO 7. Entre a sala e o restante da farmácia há antecâmara, onde a pessoa se paramenta e os materiais são limpos antes de entrar. Cada passagem vai de uma área menos limpa para uma mais limpa, com portas que não abrem ao mesmo tempo.'];
    var PRESSAO = ['Diferencial de pressão', 'A sala mais limpa fica com pressão de ar maior que a vizinha, para que, ao abrir a porta, o ar saia dela e não entre sujeira. O valor usual entre salas de classes diferentes é de 10 a 15 Pa, lido num manômetro diferencial (mostrador na parede) e registrado. Em citostáticos a lógica muda: a área é mantida em pressão negativa ou em cascata com antecâmara positiva, para o medicamento não escapar (RDC 220/2004).'];
    var HEPA = ['Filtro HEPA', 'Filtro de ar de alta eficiência, que retém no mínimo 99,97% das partículas de 0,3 µm. É ele que gera o ar limpo do fluxo laminar e da sala. Precisa de teste de integridade periódico (em geral semestral ou anual, e após troca), feito por empresa qualificada, com laudo.'];
    var FLUXO = ['Capela de fluxo laminar × cabine de segurança biológica', 'Capela (ou bancada) de fluxo laminar: sopra ar filtrado por HEPA em linhas paralelas sobre a área de trabalho, criando uma zona ISO 5; protege só o produto — no fluxo horizontal o ar vai em direção ao operador. Cabine de segurança biológica (CSB) classe II: fluxo vertical com cortina de ar na abertura frontal, protege produto, operador e ambiente. O tipo B2 exaure 100% do ar para fora do prédio, sem recircular, e é o exigido para citostáticos (RDC 220/2004). Velocidade do ar usual na zona ISO 5: cerca de 0,45 m/s (0,36 a 0,54 m/s).'];
    var PARAM = ['Paramentação', 'Roupa que não solta fibras (avental ou macacão, gorro, máscara, propés, luvas estéreis sem talco), vestida na antecâmara numa ordem definida, de cima para baixo. A pessoa é o maior gerador de partículas na sala: por isso a técnica é treinada e avaliada.'];
    var MEDIA = ['Simulação asséptica (media fill)', 'O operador repete a manipulação trocando o medicamento por meio de cultura estéril. As unidades são incubadas: se crescer microrganismo, a técnica ou o ambiente falhou. Qualifica o operador e o processo, na admissão e periodicamente.'];
    var MONIT = ['Monitoramento ambiental', 'Contagem de partículas (contador eletrônico) e microbiológica: placas de sedimentação (abertas no ambiente), placas de contato (em superfícies e luvas) e amostrador de ar ativo. Os limites e a frequência ficam em procedimento; resultados fora do limite geram investigação (ABNT NBR ISO 14698).'];
    var ESTER = ['Esterilização e filtração esterilizante', 'Calor úmido (autoclave) é o método preferido quando o produto aguenta; quando não, filtração por membrana de 0,22 µm. O filtro é testado depois do uso (teste de integridade, ex.: ponto de bolha) para confirmar que não se rompeu. Cada método é validado: ABNT NBR ISO 17665 (calor úmido), 11135 (óxido de etileno), 11137 (radiação).'];
    var AGUA = ['Água para injetáveis', 'Água de maior pureza da Farmacopeia, obtida por destilação ou processo equivalente validado, com limite de endotoxinas bacterianas de 0,25 UI/mL. Endotoxina é resto de parede de bactéria que causa febre quando injetado — por isso o ensaio LAL.'];
    var CQ = ['Ensaios de estéreis', 'Esterilidade (ausência de microrganismos viáveis), endotoxinas bacterianas (LAL), partículas visíveis e subvisíveis, além de teor e aspecto — Farmacopeia Brasileira, 6ª ed.'];
    var X = {
      'i13.1': [ARRANJO, CLASSES], 'i13.2': [PARAM], 'i13.3': [PARAM], 'i13.4': [ARRANJO],
      'i13.5': [CLASSES, ARRANJO, PRESSAO, HEPA], 'i13.6': [FLUXO, HEPA], 'i13.7': [ARRANJO],
      'i13.8': [AGUA], 'i13.9': [MEDIA, MONIT, FLUXO], 'i13.10': [ESTER], 'i13.11': [CQ, AGUA],
      'i13.12': [MEDIA, MONIT], 'i13.13': [FLUXO, PRESSAO]
    };
    Object.keys(X).forEach(function(k){ if(!S.manip[k]) S.manip[k] = X[k]; });
  }
  poe();
})();
