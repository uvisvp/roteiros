/* Orientações técnicas por item — normas técnicas (ABNT, ISO), Inmetro,
   Farmacopeia Brasileira, manuais do Ministério da Saúde e demais normas
   oficiais. Aparecem como “Orientação técnica” no item; não entram no
   relatório. Montadas por build/montar.cjs:
   - rs: roteiros simples (EAC, vacinação, gases medicinais), por item;
   - estereis: bloco 13 da manipulação (v2.orient, texto por item);
   - transporte: seções de transporte do módulo da distribuidora (Atacadista e
     Transportadora), caixa recolhível na seção.
   Cada orientação: {t: texto, f: fonte}. Valores e prazos citados são os das
   normas indicadas; quando a norma remete a documento que muda (bula,
   calendário, guia), o texto manda conferir a versão vigente. */
'use strict';
const NR32 = 'NR-32 (Segurança e saúde no trabalho em serviços de saúde)';
const REDE_FRIO = 'Manual de Rede de Frio do Programa Nacional de Imunizações (Ministério da Saúde, 6ª ed., 2025)';
const RBC = 'ABNT NBR ISO/IEC 17025; laboratórios acreditados pela Cgcre/Inmetro (Rede Brasileira de Calibração — RBC)';
const FB = 'Farmacopeia Brasileira, 6ª edição';
const NORMAS_VAC = 'Manual de Normas e Procedimentos para Vacinação (Ministério da Saúde, 2ª ed. revisada, 2024)';

module.exports = {
 rs: {
  eac: {
   lic: [
    {t: 'A licença sanitária precisa citar a atividade de exames de análises clínicas; a licença só de farmácia/drogaria não cobre o serviço.', f: 'RDC Anvisa nº 978/2025'},
    {t: 'Confira se os dados do CNES (quando houver) coincidem com o endereço e as atividades licenciadas.', f: 'Cadastro Nacional de Estabelecimentos de Saúde (CNES)'}
   ],
   resp: [
    {t: 'O responsável técnico deve ter habilitação legal no conselho profissional e responder pelo serviço durante o funcionamento; confira a certidão de regularidade técnica e a escala.', f: 'RDC Anvisa nº 978/2025'}
   ],
   tipo1: [
    {t: 'Serviço Tipo I em farmácia: exames executados no ponto de atendimento (testes laboratoriais remotos — TLR), com leitura imediata e sem processamento de amostras em laboratório.', f: 'RDC Anvisa nº 978/2025'},
    {t: 'Referência técnica para TLR: requisitos de qualidade e competência para exames realizados fora do laboratório, junto com a norma geral de laboratórios clínicos.', f: 'ABNT NBR ISO 22870; ABNT NBR ISO 15189'}
   ],
   ambientes: [
    {t: 'Ambientes com superfícies lisas, laváveis e resistentes aos saneantes; iluminação e ventilação adequadas; separação entre área de atendimento e área de coleta.', f: 'RDC Anvisa nº 978/2025; RDC Anvisa nº 50/2002 (referência para projetos de estabelecimentos de saúde)'}
   ],
   salacoleta: [
    {t: 'Lavatório com água corrente, sabonete líquido, papel-toalha e lixeira com tampa acionada sem contato manual; cadeira de coleta com braçadeira; bancada lavável.', f: 'RDC Anvisa nº 978/2025; ' + NR32},
    {t: 'É vedado reencapar ou desconectar manualmente agulhas; o descarte é feito logo após o uso, no coletor de perfurocortantes ao alcance do profissional.', f: NR32}
   ],
   pgq: [
    {t: 'O programa de garantia da qualidade deve prever: procedimentos escritos, controle interno e externo, manutenção e calibração, gestão de não conformidades e indicadores.', f: 'RDC Anvisa nº 978/2025; ABNT NBR ISO 15189'}
   ],
   produtos: [
    {t: 'Produtos para diagnóstico in vitro (tiras, testes rápidos, controles) devem estar regularizados na Anvisa (notificação ou registro, conforme a classe de risco); confira no rótulo o número e a validade.', f: 'RDC Anvisa nº 830/2023 (dispositivos médicos para diagnóstico in vitro)'},
    {t: 'Glicosímetros: requisito internacional de exatidão para sistemas de monitoramento de glicemia; use o equipamento e as tiras do mesmo fabricante, com controle conforme a instrução de uso.', f: 'ISO 15197'},
    {t: 'Refrigerador de reagentes com termômetro de máxima e mínima calibrado e registro diário; termômetros e pipetas calibrados em laboratório acreditado.', f: RBC}
   ],
   biosseg: [
    {t: 'Resíduos: perfurocortantes (grupo E) em coletor rígido, respeitando a linha de preenchimento; resíduos com sangue (grupo A) em saco branco leitoso identificado; tudo previsto no PGRSS.', f: 'RDC Anvisa nº 222/2018; ABNT NBR 13853 (coletores para perfurocortantes)'},
    {t: 'Trabalhadores vacinados contra hepatite B, tétano e difteria, com registro; EPI (luvas, jaleco, óculos quando houver risco de respingo); proibido o uso de adornos.', f: NR32}
   ],
   documentos: [
    {t: 'O laudo deve identificar o paciente, o exame, a metodologia, o resultado com unidade e valores de referência, a data e o profissional responsável; confira a guarda dos registros pelo prazo da norma.', f: 'RDC Anvisa nº 978/2025'}
   ],
   equipe: [
    {t: 'Capacitação antes do início das atividades e de forma continuada, com registro de conteúdo, carga horária e participantes.', f: NR32 + '; RDC Anvisa nº 978/2025'}
   ],
   pre: [
    {t: 'Identifique o paciente com pelo menos dois identificadores (ex.: nome completo e data de nascimento) antes da coleta e ao liberar o resultado.', f: 'Protocolo de Identificação do Paciente — Programa Nacional de Segurança do Paciente (Ministério da Saúde/Anvisa, 2013)'},
    {t: 'Orientação de preparo (jejum, medicamentos em uso) por escrito ou em linguagem acessível; registre intercorrências da coleta.', f: 'RDC Anvisa nº 978/2025'}
   ],
   analitica: [
    {t: 'Resultado fora da faixa crítica definida no procedimento deve ser comunicado ao paciente com orientação de procurar atendimento; o exame de triagem não substitui o diagnóstico.', f: 'RDC Anvisa nº 978/2025; ABNT NBR ISO 22870'}
   ],
   gcq: [
    {t: 'Registre lote e validade de controles e reagentes, os resultados obtidos e a decisão (aceito/rejeitado) com a ação corretiva tomada.', f: 'ABNT NBR ISO 15189'}
   ],
   ciq: [
    {t: 'Controle interno: amostras-controle em pelo menos dois níveis quando o fabricante disponibilizar, a cada novo lote, nova embalagem e na frequência definida; para métodos quantitativos, critérios de aceitação estatísticos (ex.: regras de Westgard).', f: 'ABNT NBR ISO 15189; ABNT NBR ISO 22870'}
   ],
   ceq: [
    {t: 'Controle externo: participação em ensaio de proficiência de provedor (ex.: PNCQ, Controllab) ou comparação interlaboratorial; guarde relatórios e ações corretivas.', f: 'ABNT NBR ISO 15189; ABNT NBR ISO/IEC 17043 (ensaios de proficiência)'}
   ]
  },
  vacina: {
   regularidade: [
    {t: 'O Calendário Nacional de Vacinação afixado deve ser o vigente; confira a data da Instrução Normativa do Ministério da Saúde. O item “Calendários de vacinação”, ao fim deste roteiro, traz o calendário para consulta.', f: 'RDC Anvisa nº 197/2017; Ministério da Saúde (Calendário Nacional de Vacinação)'}
   ],
   pessoal: [
    {t: 'Vacinador capacitado em técnica de aplicação, rede de frio e atendimento a eventos adversos; RT com habilitação legal; trabalhadores vacinados (hepatite B, tétano, difteria).', f: 'RDC Anvisa nº 197/2017; ' + NR32}
   ],
   sala: [
    {t: 'A sala de vacinação é área semicrítica e exclusiva para administrar imunobiológicos. Área mínima de 6 m² (RDC 50/2002); recomendada de 9 m². Acessível a pessoas com deficiência.', f: NORMAS_VAC},
    {t: 'Piso e paredes lisos, contínuos e laváveis; teto com forro resistente à lavagem; bancada de material não poroso; ralos com tampa; iluminação, temperatura e ventilação adequadas (ar-condicionado).', f: NORMAS_VAC},
    {t: 'Duas pias: uma para lavar materiais e caixas térmicas (cuba funda) e outra exclusiva para as mãos, com torneira sem contato manual, sabonete líquido e papel-toalha. Tomada exclusiva e aterrada para cada equipamento, a no mínimo 1,30 m do piso.', f: NORMAS_VAC},
    {t: 'Equipamentos e insumos básicos: câmara refrigerada cadastrada na Anvisa, exclusiva para imunobiológicos; freezer para bobinas; termômetro de momento, máxima e mínima com cabo extensor para cada caixa térmica e câmara (mais um reserva); caixa coletora de perfurocortantes com suporte; álcool 70%; lixeira com pedal; maca ou acesso a maca para emergência.', f: NORMAS_VAC}
   ],
   ambientes: [
    {t: 'Limpeza concorrente da sala de vacinação pelo menos duas vezes ao dia (área semicrítica) e sempre que necessário; limpeza terminal no mínimo a cada 15 dias (piso, teto, paredes, portas, janelas, mobiliário, luminárias e filtros do ar-condicionado); panos exclusivos para piso e demais superfícies.', f: NORMAS_VAC},
    {t: 'Limpeza das câmaras refrigeradas mensalmente ou conforme o uso, de preferência no início da semana e com estoque reduzido, seguindo o fabricante e remanejando as vacinas antes.', f: NORMAS_VAC + '; ' + REDE_FRIO}
   ],
   refrigeracao: [
    {t: 'É proibido guardar vacinas em refrigerador de uso doméstico ou frigobar. O equipamento deve ser câmara científica refrigerada regularizada na Anvisa (ou pré-qualificada pela OMS), de uso exclusivo para imunobiológicos; o freezer científico, quando houver, guarda só as bobinas reutilizáveis. Encontrado equipamento doméstico, a substituição deve ser imediata.', f: 'RDC Anvisa nº 197/2017, art. 10, § 2º; ' + REDE_FRIO},
    {t: 'A câmara refrigerada opera entre 2 °C e 8 °C, com set point de 5 °C; deve ter registrador eletrônico de temperatura contínuo, controlador de alta e baixa temperatura com alarme visual e sonoro e bateria, e ventilação por ar forçado.', f: REDE_FRIO},
    {t: 'Leitura e registro da temperatura no mapa diário, no mínimo duas vezes ao dia (início e fim da jornada); datalogger em paralelo ao registrador do equipamento; verificação diária de porta, alarmes e alimentação elétrica ao fim do expediente; calibração periódica (e após intervenção) por laboratório da Rede Brasileira de Calibração (RBC/Inmetro).', f: REDE_FRIO},
    {t: 'Equipamento longe da luz solar direta, em ambiente ventilado, com no mínimo 15 cm livres ao redor; identificado, com “mapa ilustrativo” (vacina, lote, laboratório, validade, quantidade) e organização “primeiro a vencer, primeiro a sair”; plano de contingência para falha de energia ou do equipamento, conhecido pela equipe.', f: REDE_FRIO}
   ],
   produtos: [
    {t: 'Vacinas regularizadas na Anvisa e adquiridas de distribuidor com AFE; frascos multidose abertos usados dentro do prazo da bula, com data e hora de abertura anotadas.', f: 'RDC Anvisa nº 197/2017; bula do produto'}
   ],
   transporte: [
    {t: 'Caixa térmica de poliuretano (na sala de vacinação, capacidade mínima de 12 litros) com bobinas reutilizáveis ambientadas: retiradas do freezer até sumir a névoa e confirmado 0 °C com termômetro de cabo extensor, secas antes de entrar na caixa; vacinas mantidas entre 2 °C e 8 °C.', f: REDE_FRIO},
    {t: 'Datalogger em todas as caixas térmicas durante o transporte, mesmo nas qualificadas, posicionado no centro da carga; registro das temperaturas e das intercorrências.', f: REDE_FRIO}
   ],
   registros: [
    {t: 'Registre em caderneta/comprovante: vacina, dose, lote, validade, data, local e vacinador; e no sistema de informação definido pelo Ministério da Saúde.', f: 'RDC Anvisa nº 197/2017'}
   ],
   notificacoes: [
    {t: 'Eventos supostamente atribuíveis à vacinação ou imunização (ESAVI) e erros de imunização devem ser notificados no sistema indicado pelo Ministério da Saúde (e-SUS Notifica).', f: 'Manual de Vigilância Epidemiológica de Eventos Supostamente Atribuíveis à Vacinação ou Imunização (Ministério da Saúde, 4ª ed.)'}
   ],
   extramuros: [
    {t: 'Na vacinação extramuros, mantenha a cadeia de frio (caixa térmica com bobinas ambientadas e datalogger), o registro das doses e o material para atendimento de reações; confira a comunicação/autorização exigida pela vigilância local.', f: 'RDC Anvisa nº 197/2017; ' + REDE_FRIO}
   ],
   civp: [
    {t: 'O Certificado Internacional de Vacinação ou Profilaxia segue o Regulamento Sanitário Internacional; para febre amarela, a dose única vale por toda a vida (Anexo 7 do RSI, emenda em vigor desde 2016). Confira o credenciamento do serviço para emissão.', f: 'Regulamento Sanitário Internacional (RSI 2005), Anexo 7; Anvisa'}
   ]
  },
  'gases-medicinais': {
   autorizacoes: [
    {t: 'A AFE de gases medicinais é uma classe própria, distinta da de medicamentos; confira as atividades autorizadas (distribuir, armazenar, transportar, fracionar, dispensar) com as exercidas.', f: 'RDC Anvisa nº 887/2024, art. 9º'}
   ],
   cadeia: [
    {t: 'Oxigênio, ar medicinal, óxido nitroso, nitrogênio e dióxido de carbono têm monografia na Farmacopeia Brasileira; o laudo do fabricante deve comprovar o atendimento à monografia (teor e impurezas).', f: FB},
    {t: 'A notificação ou registro dos gases medicinais é exigida pela RDC 870/2024; o prazo de adequação vai até 31/03/2027.', f: 'RDC Anvisa nº 870/2024, arts. 4º e 63'}
   ],
   equipe: [
    {t: 'Treinamento em manuseio seguro de cilindros, riscos do oxigênio (comburente) e dos gases criogênicos (queimadura por frio, asfixia em ambiente fechado); EPI: luvas, calçado de segurança, óculos e, no criogênico, luvas e protetor facial próprios.', f: 'RDC Anvisa nº 887/2024; fichas de informações de segurança (FDS) dos gases'}
   ],
   autoinspecao: [
    {t: 'Manômetros, analisadores de oxigênio e balanças usados no controle devem ter calibração rastreável, em laboratório acreditado.', f: RBC}
   ],
   rastreabilidade: [
    {t: 'Cilindros identificados pelo conteúdo (cores e rótulo), conforme norma técnica; confira também o rótulo exigido para gases notificados ou registrados.', f: 'ABNT NBR 12176 (cilindros para gases — identificação do conteúdo); RDC Anvisa nº 870/2024, arts. 56 e 57'},
    {t: 'Válvulas e conexões com roscas padronizadas por gás, impedindo a troca de conexão entre gases diferentes.', f: 'ABNT NBR 11725 (conexões e roscas para válvulas de cilindros para gases comprimidos)'},
    {t: 'Confira a data do último ensaio (requalificação periódica) gravada no cilindro; cilindro com prazo vencido não deve ser envasado nem expedido.', f: 'Normas técnicas de requalificação de cilindros (ABNT) e RDC Anvisa nº 870/2024, art. 7º'}
   ],
   areas: [
    {t: 'Cilindros em pé, presos por corrente ou suporte, com capacete de proteção da válvula; área ventilada, coberta e longe de fontes de calor; cheios separados de vazios e gases medicinais separados dos industriais.', f: 'RDC Anvisa nº 887/2024, arts. 7º, 53 e 54'},
    {t: 'Oxigênio é comburente: sem óleo ou graxa em válvulas e conexões; separação de inflamáveis; sinalização de “proibido fumar”.', f: 'ABNT NBR 14619 (incompatibilidade química); fichas de informações de segurança (FDS)'}
   ],
   recebimento: [
    {t: 'No recebimento confira: lote e validade na nota fiscal, lacre íntegro, rótulo, cor e data de requalificação do cilindro; carga fora do padrão vai para quarentena.', f: 'RDC Anvisa nº 887/2024, arts. 60 e 61'}
   ],
   transporte: [
    {t: 'Gases são produtos perigosos (classe 2 da ONU): o transporte rodoviário segue o regulamento da ANTT, com rótulos de risco e painéis de segurança, ficha de emergência, conjunto de equipamentos para emergência e motorista com curso MOPP, respeitadas as isenções por quantidade.', f: 'Resolução ANTT nº 5.998/2022; ABNT NBR 7500, NBR 7503 e NBR 9735'},
    {t: 'Cilindros fixados na posição vertical, com capacete, em veículo ventilado; nunca transportar cilindros em compartimento fechado junto ao motorista.', f: 'Resolução ANTT nº 5.998/2022; RDC Anvisa nº 887/2024, art. 65'}
   ],
   fracionamento: [
    {t: 'Tanques criogênicos estacionários são vasos de pressão: prontuário, inspeções de segurança periódicas e profissional habilitado.', f: 'NR-13 (Caldeiras, vasos de pressão, tubulações e tanques metálicos de armazenamento)'},
    {t: 'Purga do sistema de conexão antes do abastecimento, transferência só para tanque com pressão positiva e válvula de retenção no circuito.', f: 'RDC Anvisa nº 887/2024, arts. 69, 70 e 73'}
   ],
   dispensacao: [
    {t: 'Oxigenoterapia domiciliar — orientar: não fumar nem ter chamas no ambiente, manter o equipamento longe de fontes de calor, não usar cremes ou óleos derivados de petróleo no rosto, cilindro preso e ambiente ventilado; telefone de emergência do fornecedor.', f: 'RDC Anvisa nº 887/2024, art. 77; fichas de informações de segurança (FDS)'}
   ]
  }
 },

 estereis: {
  'i13.1': 'Referências: RDC 67/2007, Anexo IV; RDC 220/2004 (terapia antineoplásica); Farmacopeia Brasileira, 6ª ed. (esterilidade, endotoxinas bacterianas, partículas). O capítulo USP <797> é referência internacional útil, não obrigatória no Brasil.',
  'i13.2': 'Higienização de mãos e antebraços com antisséptico antes da paramentação; unhas curtas, sem esmalte e sem adornos (NR-32). Pessoa com lesão de pele ou infecção respiratória não manipula.',
  'i13.3': 'Paramentação estéril de baixa liberação de partículas (avental, gorro, máscara, propés, luvas estéreis sem talco), vestida na antecâmara em sequência definida em POP; a técnica do operador é qualificada por inspeção e simulação asséptica.',
  'i13.4': 'Paredes, pisos e tetos lisos, impermeáveis e sem reentrâncias; sanitizantes regularizados, com rodízio e uso periódico de agente esporicida; registros de limpeza.',
  'i13.5': 'Classificação por partículas: ABNT NBR ISO 14644-1 (classificação) e 14644-2 (monitoramento). Manipulação sob fluxo unidirecional ISO 5 em sala ISO 7, com antecâmara; diferencial de pressão entre salas registrado (valor usual de 10 a 15 Pa). Para citostáticos, o arranjo de pressão segue a RDC 220/2004.',
  'i13.6': 'Fluxo laminar e cabines com certificação periódica por empresa qualificada: integridade dos filtros HEPA, velocidade do ar e contagem de partículas. Para citostáticos, cabine de segurança biológica classe II tipo B2 (RDC 220/2004). Instrumentos calibrados em laboratório acreditado (ABNT NBR ISO/IEC 17025).',
  'i13.7': 'Materiais e insumos estéreis de uso único, regularizados; embalagem externa desinfetada (ex.: álcool 70% estéril) antes de entrar na área limpa.',
  'i13.8': 'Água para injetáveis conforme monografia da Farmacopeia Brasileira (inclui limite de endotoxinas bacterianas de 0,25 UI/mL, condutividade e carbono orgânico total), obtida por destilação ou processo equivalente validado.',
  'i13.9': 'Simulação asséptica (media fill) com meio de cultura para qualificar operadores e processo, na admissão e periodicamente; monitoramento microbiológico do ambiente e das superfícies (placas de sedimentação, contato e ar ativo) — ABNT NBR ISO 14698.',
  'i13.10': 'Esterilização validada: calor úmido (ABNT NBR ISO 17665), óxido de etileno (ABNT NBR ISO 11135) ou radiação (ABNT NBR ISO 11137); filtração esterilizante em 0,22 µm com teste de integridade (ponto de bolha) após o uso.',
  'i13.11': 'Ensaios farmacopeicos de produto estéril: esterilidade, endotoxinas bacterianas (LAL), partículas visíveis e subvisíveis, além de teor e aspecto — Farmacopeia Brasileira, 6ª ed.',
  'i13.12': 'Validação de processos, limpeza e sistemas críticos; prazo de uso da preparação com base técnica (estudo ou literatura). Como referência de prazos de uso (BUD), a USP <797> é útil, sem valor normativo no Brasil.',
  'i13.13': 'Citostáticos: RDC 220/2004; NR-32 — riscos químicos dos antineoplásicos: kit de derramamento, EPI específico, é vedado a gestantes e nutrizes manipular antineoplásicos; resíduos do grupo B (RDC 222/2018).'
 },

 transporte: {
  recebimento: [
   {t: 'Faixas de conservação da Farmacopeia Brasileira (Generalidades): temperatura ambiente de 15 °C a 30 °C; local fresco de 8 °C a 15 °C; refrigerador de 2 °C a 8 °C. A condição exigida é a do rótulo do produto.', f: FB},
   {t: 'No recebimento, confira a temperatura registrada durante o transporte (registrador ou relatório do transportador) antes de liberar a carga.', f: 'RDC Anvisa nº 430/2020'}
  ],
  termolabeis: [
   {t: 'Monitoramento contínuo com registradores de temperatura (data loggers) calibrados, com alarme e registro dos desvios; mapeamento térmico das áreas e equipamentos.', f: 'RDC Anvisa nº 430/2020; ' + RBC}
  ],
  expedicao: [
   {t: 'Confira lote, validade e quantidade com a nota fiscal (DANFE), integridade das embalagens e lacres, e separação por faixa de temperatura; embalagem e acondicionamento qualificados para a rota.', f: 'RDC Anvisa nº 430/2020'}
  ],
  transporte: [
   {t: 'Transportador rodoviário remunerado de cargas precisa de inscrição no RNTRC (ANTT).', f: 'Lei nº 11.442/2007'},
   {t: 'Veículo limpo, fechado, sem cargas incompatíveis (alimentos, saneantes, produtos com risco de contaminação), com controle de temperatura quando exigido; produtos perigosos (ex.: inflamáveis) seguem o regulamento da ANTT.', f: 'RDC Anvisa nº 430/2020; Resolução ANTT nº 5.998/2022'},
   {t: 'Medicamentos sujeitos a controle especial: documentação e segurança no transporte conforme a Portaria SVS/MS nº 344/1998.', f: 'Portaria SVS/MS nº 344/1998'}
  ],
  'qt-veiculo': [
   {t: 'Qualificação térmica do veículo ou da embalagem: protocolo com número e posição dos sensores, condições extremas (verão e inverno), carga máxima e mínima, portas abertas; sensores calibrados.', f: 'RDC Anvisa nº 430/2020; OMS, WHO TRS 961, Anexo 9 (armazenamento e transporte de produtos sensíveis a tempo e temperatura)'}
  ],
  'qt-rota': [
   {t: 'Qualificação de rota: perfil de temperatura, duração e paradas previstas, com margem de segurança; requalificar quando mudar rota, veículo ou embalagem.', f: 'OMS, WHO TRS 961, Anexo 9; RDC Anvisa nº 430/2020'}
  ]
 }
};
