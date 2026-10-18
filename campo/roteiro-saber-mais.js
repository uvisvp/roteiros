/* “Para saber mais” nos roteiros de motor próprio (pedido de 18/10/2026): Odontologia,
   Produtos, Alimentos e Serviços assistenciais (a Estética passou ao motor roteiro-simples e
   leva as orientações nos próprios itens, em estetica/roteiro.cjs). Mesma ideia da “Orientação
   técnica” do motor roteiro-simples: conceito e modo de verificar, cada linha com a sua
   fonte (norma ou documento técnico publicado). Não é exigência por si, não capitula
   infração e não entra no relatório.
   Cada caixa vai na primeira pergunta do item aberto cujo texto casa com `re` (componente
   padrão, .pu-q na aba Roteiro). Na Odontologia, substitui o antigo odontologia-orientacoes.js (retirado do módulo
   por scripts/repack-odontologia.cjs). */
(function(){
 if(window.__uvsSaberMais) return; window.__uvsSaberMais = true;
 var RDC1002 = 'RDC Anvisa nº 1.002/2025';
 var S = {
  odontologia: [
   {id: 'od-clima', re: /NBR 7256/, tit: 'climatização e renovação de ar', l: [
    ['Consultório sem anestesia: ventilação natural com circulação e renovação de ar, ou climatização conforme a ABNT NBR 7256. Centro Cirúrgico Odontológico: sistema de ventilação e climatização conforme a NBR 7256.', RDC1002 + ', arts. 14 e 24, VI'],
    ['Renovar o ar é trazer ar exterior: para ambientes climatizados de uso coletivo, a Anvisa adota taxa mínima de 27 m³/h por pessoa. O ar-condicionado tipo split resfria e recircula o ar da própria sala, sem ar externo; sozinho, não faz essa renovação.', 'Resolução RE Anvisa nº 9/2003; ABNT NBR 7256'],
    ['Havendo climatização artificial, o ambiente precisa de Plano de Manutenção, Operação e Controle (PMOC), que obedece a parâmetros de qualidade do ar: confira o PMOC e os registros de limpeza e de troca de filtros.', 'Lei Federal nº 13.589/2018, arts. 1º e 3º'],
    ['A NBR 7256 é norma da ABNT (texto pago, fora do banco do app): confira pelo projeto ou pelo laudo apresentado pelo serviço, e não por valores de memória.', 'ABNT NBR 7256']]},
   {id: 'od-pcd', re: /NBR 9050/, tit: 'sanitário acessível', l: [
    ['Clínica com até 2 consultórios individuais pode ter um único sanitário, desde que adaptado para pessoa com deficiência conforme a ABNT NBR 9050.', RDC1002 + ', art. 18'],
    ['Pontos usuais para conferir: área livre para giro da cadeira de rodas (círculo de 1,50 m de diâmetro), porta com vão livre de pelo menos 0,80 m, barras de apoio junto à bacia (lateral e de fundo) e lavatório sem coluna.', 'ABNT NBR 9050 (acessibilidade a edificações, mobiliário, espaços e equipamentos urbanos)']]},
   {id: 'od-ester', re: /Bowie|indicador biológico|integrador químico/i, tit: 'indicadores de esterilização', l: [
    ['O indicador químico tipo 1, obrigatório na embalagem de cada pacote, só mostra que o pacote passou pelo processo; não prova a esterilização.', RDC1002 + ', art. 78; ABNT NBR ISO 11140-1 (indicadores químicos)'],
    ['Os integradores químicos (tipos 5 e 6) reagem aos parâmetros críticos do ciclo. Vão no pacote teste: toda semana, no primeiro ciclo do dia, junto com o indicador biológico; nos ciclos seguintes, sozinhos. O pacote teste usa embalagem dupla de papel grau cirúrgico e fica no ponto de menor circulação de calor indicado pelo fabricante.', RDC1002 + ', arts. 89 e 90; ABNT NBR ISO 11140-1'],
    ['O indicador biológico (esporos de Geobacillus stearothermophilus, para vapor) é o que comprova a inativação microbiana. O registro de cada carga traz data, lote, equipamento, resultado do pacote teste, pacotes esterilizados, operador e parâmetros físicos.', RDC1002 + ', arts. 89 e 91; ABNT NBR ISO 11138-1 (indicadores biológicos)'],
    ['O teste de Bowie & Dick avalia a remoção do ar na autoclave assistida por bomba de vácuo e é feito no primeiro ciclo do dia.', RDC1002 + ', art. 88']]},
   {id: 'od-rx', re: /proteção radiológica/i, tit: 'proteção radiológica', l: [
    ['A RDC 611/2022 traz os requisitos sanitários da radiologia diagnóstica e o controle das exposições; a IN 95/2021, a garantia da qualidade e a segurança da radiologia odontológica intraoral.', 'RDC Anvisa nº 611/2022; IN Anvisa nº 95/2021'],
    ['O que pedir: programa de proteção radiológica, monitoração individual (dosímetro) dos que operam o equipamento, quando exigida, testes de aceitação e de controle de qualidade do equipamento e levantamento radiométrico das instalações.', 'RDC Anvisa nº 611/2022, arts. 28, 62 e 63; IN Anvisa nº 95/2021']]},
   {id: 'od-agua', re: /Água de abastecimento do equipo|Reservatórios de água e mangueiras/i, tit: 'água do equipo', l: [
    ['Água parada nas mangueiras e no reservatório do equipo favorece biofilme. Por isso a RDC exige água potável, manutenção registrada do sistema de purificação (quando houver), mangueiras íntegras e sem sujidade, troca conforme o fabricante e reservatórios e mangueiras drenados e vazios ao fim do expediente.', RDC1002 + ', arts. 40 a 42']]},
   {id: 'od-res', re: /Resíduos segregados/i, tit: 'resíduos do consultório', l: [
    ['Resíduos com mercúrio (amálgama) e os efluentes de revelação radiográfica (revelador e fixador) são do Grupo B (químicos): acondicionamento e identificação próprios e destinação por empresa licenciada, previstos no PGRSS.', 'RDC Anvisa nº 222/2018, Anexo I'],
    ['Perfurocortantes (Grupo E) vão para recipiente identificado, rígido, com tampa e resistente a punctura, ruptura e vazamento, trocado no limite de preenchimento marcado no coletor.', 'RDC Anvisa nº 222/2018, art. 86; ABNT NBR 13853 (coletores para perfurocortantes)']]}
  ],
  'produtos-correlatos': [
   {id: 'pr-reg', re: /regularizad\w* conforme a classe de risco|registro para os grupos do art\. 34|regularizad\w* conforme o risco/i, tit: 'notificação e registro na Anvisa', l: [
    ['Dispositivos médicos (exceto diagnóstico in vitro): classes I e II são regularizadas por notificação; classes III e IV, por registro. Os de diagnóstico in vitro têm regra própria.', 'RDC Anvisa nº 751/2022, arts. 5º a 7º; RDC Anvisa nº 830/2023'],
    ['Cosméticos, produtos de higiene e perfumes: registro para os grupos listados no art. 34 (protetor solar, repelente, alisante, bronzeador, gel antisséptico, entre outros); comunicação prévia para os demais.', 'RDC Anvisa nº 907/2024, arts. 34 e 35'],
    ['Saneantes: risco 1 por notificação; risco 2 (antimicrobianos, desinfestantes, corrosivos, pH extremo, entre outros) por registro.', 'RDC Anvisa nº 989/2025, arts. 8º e 12'],
    ['Produto sujeito a vigilância sanitária só é industrializado, exposto à venda ou entregue ao consumo depois de regularizado. Confira o número no rótulo e consulte na Central de Consultas do app.', 'Lei Federal nº 6.360/1976, art. 12']]},
   {id: 'pr-afe', re: /\bAFE vigente/, tit: 'licença, AFE e AE', l: [
    ['Licença sanitária municipal: exigida de todo estabelecimento antes de iniciar a atividade (não há norma federal específica para ela).', 'Lei Municipal nº 13.725/2004, art. 90'],
    ['AFE (Autorização de Funcionamento, da Anvisa): para cosméticos e saneantes, é da empresa, concedida pela matriz; para produtos para saúde, é por estabelecimento.', 'Lei Federal nº 6.360/1976, art. 2º; RDC Anvisa nº 16/2014, arts. 3º e 10'],
    ['AE (Autorização Especial): exigida de quem movimenta substâncias sujeitas a controle especial.', 'RDC Anvisa nº 16/2014, art. 4º; Portaria SVS/MS nº 344/1998'],
    ['Há dispensa de AFE para o transporte entre o comércio varejista e o consumidor final: confira o enquadramento antes de apontar a falta.', 'RDC Anvisa nº 16/2014, art. 5º, VI e parágrafo único']]},
   {id: 'pr-temp', re: /controle de temperatura/i, tit: 'temperatura controlada', l: [
    ['Produto com faixa de temperatura indicada pelo fabricante: os registros precisam ser contínuos e mostrar a faixa durante todo o armazenamento, com ação registrada quando houver desvio.', 'RDC Anvisa nº 16/2014, art. 28, II, “a” e “c”'],
    ['O mapeamento (qualificação) térmico mostra se todos os pontos da área ficam dentro da faixa; o sensor de rotina fica no ponto crítico encontrado. A RDC 430/2020 trata disso para medicamentos e serve de referência técnica.', 'RDC Anvisa nº 430/2020; OMS, WHO Technical Report Series nº 961, Anexo 9 (armazenamento e transporte de produtos sensíveis a tempo e temperatura)']]},
   {id: 'pr-recolhe', re: /recolhimento e ações de campo/i, tit: 'recolhimento e vigilância pós-mercado', l: [
    ['Ação de campo de dispositivo médico (recolhimento, correção, alerta) é conduzida pelo detentor do registro; o distribuidor precisa localizar o que distribuiu e executar o bloqueio ou o recolhimento.', 'RDC Anvisa nº 551/2021, art. 12; RDC Anvisa nº 665/2022, art. 120, VIII'],
    ['Reclamação, queixa técnica e evento adverso recebidos pelo distribuidor são registrados, avaliados e encaminhados ao detentor da regularização; nos cosméticos, vale a cosmetovigilância.', 'RDC Anvisa nº 665/2022, art. 121, I a V e § 1º; RDC Anvisa nº 894/2024, arts. 6º, 18 e 19']]}
  ],
  'servicos-alimentacao-roteiro': [
   {id: 'al-temp', re: /74 ?°C|60 ?°C a 10 ?°C/, tit: 'tempo e temperatura', l: [
    ['Cocção: 74 °C em todas as partes do alimento, ou combinação equivalente de tempo e temperatura. Para conferir “todas as partes”, meça no centro geométrico da peça, a última a aquecer.', 'Portaria SMS nº 2.619/2011, item 7.21'],
    ['Resfriamento: de 60 °C a 10 °C em até duas horas, antes da refrigeração ou do congelamento.', 'Portaria SMS nº 2.619/2011, item 7.22'],
    ['Distribuição: alimentos quentes entram no equipamento acima de 60 °C; frios e quentes respeitam os limites de tempo e temperatura de exposição.', 'Portaria SMS nº 2.619/2011, itens 9.23 e 9.24, I e II']]},
   {id: 'al-horti', re: /Frutas, verduras e legumes/i, tit: 'higienização de hortifrúti', l: [
    ['Hortifrúti consumido cru: lavagem em água potável, desinfecção com produto regularizado na Anvisa para esse fim, na concentração e no tempo indicados no rótulo, e enxágue; o procedimento fica descrito no POP.', 'Portaria SMS nº 2.619/2011, itens 7 e 17.2, VI, alínea i'],
    ['Confira o rótulo do produto em uso (finalidade, diluição e tempo) e compare com o preparo observado.', 'Portaria SMS nº 2.619/2011, item 7']]},
   {id: 'al-oleo', re: /Óleos e gorduras de fritura/i, tit: 'óleo de fritura', l: [
    ['Óleo é trocado quando há alteração de cor, odor ou sabor, formação de espuma ou fumaça. A Anvisa recomenda não passar de 180 °C e descartar quando os compostos polares totais passam de 25%; fitas de teste ajudam a decidir a troca.', 'Portaria SMS nº 2.619/2011, item 7; Informe Técnico Anvisa nº 11/2004 (óleos e gorduras utilizados em frituras)']]},
   {id: 'al-pragas', re: /controle integrado de vetores e pragas/i, tit: 'controle de pragas', l: [
    ['O serviço químico é feito por empresa especializada licenciada; o comprovante traz pragas-alvo, produtos usados (com registro na Anvisa), concentração, áreas tratadas, data, responsável técnico e orientações.', 'Portaria SMS nº 2.619/2011, item 12; RDC Anvisa nº 622/2022 (empresas de controle de vetores e pragas urbanas)']]},
   {id: 'al-caixa', re: /reservatório de água/i, tit: 'reservatório de água', l: [
    ['A higienização do reservatório é comprovada a cada seis meses, por registro próprio ou comprovante da empresa, e o reservatório fica tampado e protegido.', 'Portaria SMS nº 2.619/2011, itens 11.5 e 11.6']]}
  ],
  /* Assistenciais: a norma muda com a modalidade (?servico=); linha com 3º elemento só vale nas modalidades listadas */
  'servicos-assistenciais': [
   {id: 'as-grau', re: /grau(s)? de dependência/i, serv: ['ilpi'], tit: 'graus de dependência e cuidadores', l: [
    ['Grau I: idoso independente, mesmo com equipamento de autoajuda. Grau II: dependência em até três atividades de autocuidado, sem comprometimento cognitivo ou com alteração cognitiva controlada. Grau III: dependência em todas as atividades de autocuidado e/ou comprometimento cognitivo.', 'RDC Anvisa nº 502/2021, art. 3º, IV'],
    ['O número de cuidadores por grau e por turno está na RDC; a calculadora deste roteiro aplica essas proporções. Confira a listagem dos residentes por grau e a escala dos cuidadores em todos os turnos.', 'RDC Anvisa nº 502/2021, art. 16, II']]},
   {id: 'as-grau-cd', re: /grau(s)? de dependência/i, serv: ['centrodia'], tit: 'cuidadores por grau de dependência', l: [
    ['No Centro-Dia, o número de cuidadores por grau de dependência dos idosos segue o Regulamento da Portaria SMS 5/2019; a calculadora deste roteiro aplica essas proporções. Confira a relação dos idosos por grau e a escala dos cuidadores em todo o horário de funcionamento.', 'Portaria SMS nº 5/2019, Regulamento anexo, item 11.2']]},
   {id: 'as-med', re: /medicamentos controlados permanecem sob chave|Controle d[eo]s? medicamentos sujeitos a controle especial/i, tit: 'medicamentos', l: [
    ['O Responsável Técnico responde pelos medicamentos em uso pelos idosos, respeitadas as normas de guarda e administração; é vedado manter estoque de medicamento sem prescrição médica.', 'RDC Anvisa nº 502/2021, art. 40', ['ilpi']],
    ['O Responsável Técnico responde pelos medicamentos em uso pelos residentes; é vedado manter estoque de medicamento sem prescrição médica.', 'RDC Anvisa nº 29/2011, art. 17', ['ct']],
    ['A Anvisa publicou esclarecimentos sobre medicamentos e prestação de serviços de saúde nas comunidades terapêuticas.', 'Nota Técnica Anvisa nº 3/2024', ['ct']],
    ['Local seguro e de acesso restrito à equipe; os medicamentos trazidos pelos usuários ficam com cópia do receituário, também na pasta individual; o RT responde pela guarda e pelo controle, e é vedado estoque sem prescrição.', 'Portaria SMS nº 5/2019, Regulamento anexo, itens 7.3.9.1 a 7.3.9.3', ['centrodia']],
    ['Termolábeis: geladeira exclusiva com termômetro de máxima, mínima e momento, planilha com dois registros diários e registro das providências quando houver alteração.', 'Portaria SMS nº 5/2019, Regulamento anexo, item 7.3.9.5', ['centrodia']],
    ['Nesta modalidade não há norma sanitária específica sobre a guarda de medicamentos; a exigência geral é a do Código Sanitário Municipal.', 'Lei Municipal nº 13.725/2004, art. 67', ['srt']],
    ['Nesta modalidade não há norma sanitária específica sobre a guarda de medicamentos; a exigência geral é a do Código Sanitário Municipal.', 'Lei Municipal nº 13.725/2004, art. 69', ['saica', 'demais']],
    ['Medicamentos sujeitos a controle especial (listas da Portaria 344) ficam guardados sob chave ou outro dispositivo que ofereça segurança, em local exclusivo para esse fim.', 'Portaria SVS/MS nº 344/1998, art. 67']]},
   {id: 'as-sentinela', re: /eventos sentinela/i, serv: ['ilpi'], tit: 'eventos sentinela', l: [
    ['Na ILPI, queda com lesão e tentativa de suicídio são eventos sentinela, com notificação imediata à vigilância sanitária local.', 'RDC Anvisa nº 502/2021, art. 55, I e II'],
    ['Além disso, a ILPI avalia continuamente o seu desempenho pelos indicadores do Anexo da RDC e envia todo mês de janeiro o consolidado do ano anterior à vigilância sanitária.', 'RDC Anvisa nº 502/2021, arts. 58 a 60']]},
   {id: 'as-ct', re: /permanência voluntária/i, serv: ['ct'], tit: 'comunidade terapêutica', l: [
    ['A permanência é voluntária e o residente pode interromper o tratamento a qualquer momento, salvo risco imediato de vida para si ou para terceiros ou intoxicação por substâncias psicoativas, avaliados e documentados por médico.', 'RDC Anvisa nº 29/2011, art. 19, III e IV'],
    ['São proibidos castigos físicos, psíquicos ou morais.', 'RDC Anvisa nº 29/2011, art. 20, IV'],
    ['O serviço define critérios para alta terapêutica, desistência (alta a pedido), desligamento (administrativo ou por mandado judicial) e evasão.', 'RDC Anvisa nº 29/2011, art. 21'],
    ['A Anvisa publicou esclarecimentos atuais sobre voluntariedade, escopo e aplicação da RDC 29/2011.', 'Nota Técnica Anvisa nº 3/2024']]}
  ]
 };
 var SERV = ((window.__QS || location.search || '').match(/servico=([a-z]+)/) || [])[1] || '';
 var vale = function(x){ return !x || !SERV || x.indexOf(SERV) >= 0; };
 var R = (S[window.__uvsApp] || []).filter(function(r){ return vale(r.serv); }).map(function(r){ return Object.assign({}, r, {l: r.l.filter(function(x){ return vale(x[2]); })}); }).filter(function(r){ return r.l.length; });
 if(!R.length) return;
 function esc(t){ return String(t == null ? '' : t).replace(/[&<>"]/g, function(c){ return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); }
 function caixa(r){ return '<details class="pu-mais uvs-sm" data-uvs-sm="' + r.id + '"><summary>📘 Para saber mais — ' + esc(r.tit) + '</summary>'
  + r.l.map(function(x){ return '<p>' + esc(x[0]) + '<br><small class="uvs-sm-f">Fonte: ' + esc(x[1]) + '</small></p>'; }).join('')
  + '<p class="uvs-sm-nota">Orientação técnica: não capitula infração e não entra no relatório.</p></details>'; }
 var CSS = '.uvs-sm{margin:8px 0 0}.uvs-sm p{margin:0 0 8px;font-size:.86rem;line-height:1.5}.uvs-sm-f{color:#55636b}.uvs-sm-nota{font-size:.78rem!important;color:#6b7780;font-style:italic}';
 function poe(){
  if(!document.getElementById('uvs-sm-css')){ var st = document.createElement('style'); st.id = 'uvs-sm-css'; st.textContent = CSS; document.head.appendChild(st); }
  try { if(!(window.UvisPadrao && UvisPadrao.estado && UvisPadrao.estado().aba === 'roteiro')) return; } catch(e){ return; }
  var qs = document.querySelectorAll('#pu-conteudo .pu-q');
  R.forEach(function(r){
   if(document.querySelector('#pu-conteudo [data-uvs-sm="' + r.id + '"]')) return;
   for(var i = 0; i < qs.length; i++){ var tx = (qs[i].querySelector('.pu-q-texto') || qs[i].firstElementChild || qs[i]).textContent;
    if(r.re.test(tx)){ qs[i].insertAdjacentHTML('beforeend', caixa(r)); break; } }
  });
 }
 var agenda = 0;
 function depois(){ if(agenda) return; agenda = setTimeout(function(){ agenda = 0; poe(); }, 40); }
 function liga(){ poe(); new MutationObserver(depois).observe(document.body, {childList: true, subtree: true}); }
 if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', liga); else liga();
})();
