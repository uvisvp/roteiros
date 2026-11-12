/* Inspeção de alimentos por setor (pedido de 11/11/2026).
   O perfil passa a ser a lista de SETORES do estabelecimento (um hipermercado marca açougue,
   padaria, frios…; uma lanchonete marca só cozinha e salão). Cada setor:
   - marca os processos que ele implica (açougue → alimento cru e cadeia fria);
   - libera o seu módulo de verificações (seção “Setores do estabelecimento” do roteiro);
   - entra nas condições das verificações gerais (o que não se aplica fica escondido).
   Lido por scripts/repack-alimentos-setores.cjs, que grava a configuração no módulo
   app--servicos-alimentacao-roteiro. Texto e item de cada verificação: Portaria SMS nº 2.619/2011
   (texto consolidado, com a Portaria SMS nº 328/2024) e Portaria SMS nº 266/2025 (licenciamento). */
'use strict';

/* grupos das listas recolhíveis da tela de setores */
const GRUPOS = [
  ['comercio', 'Comércio'],
  ['producao', 'Produção e preparo'],
  ['servico', 'Serviço ao consumidor'],
  ['logistica', 'Depósito e transporte']
];

/* setores: id, rótulo, descrição, grupo, processos implicados, CNAE que sugerem o setor */
const SETORES = [
  {id: 'mercearia', label: 'Mercearia e produtos embalados', description: 'Secos, enlatados, laticínios e congelados industrializados.', grupo: 'comercio', flags: [], cnae: ['4711-3/01', '4711-3/02', '4712-1/00', '4729-6/99']},
  {id: 'hortifruti', label: 'Hortifrúti', description: 'Frutas, verduras e legumes; inclui os minimamente processados.', grupo: 'comercio', flags: [], cnae: ['4724-5/00']},
  {id: 'frios', label: 'Frios e laticínios fatiados', description: 'Fatiamento e fracionamento de frios, embutidos e queijos.', grupo: 'comercio', flags: ['hotCold'], cnae: ['4721-1/03']},
  {id: 'acougue', label: 'Açougue', description: 'Corte, moagem, tempero e venda de carnes.', grupo: 'comercio', flags: ['rawPrep', 'hotCold'], cnae: ['4722-9/01']},
  {id: 'peixaria', label: 'Peixaria', description: 'Pescados frescos, congelados, salgados e secos.', grupo: 'comercio', flags: ['rawPrep', 'hotCold'], cnae: ['4722-9/02']},
  {id: 'granel', label: 'Venda a granel', description: 'Grãos, farinhas, doces, castanhas e similares fracionados à vista do consumidor.', grupo: 'comercio', flags: ['bulk'], cnae: []},
  {id: 'bebidas', label: 'Bebidas alcoólicas', description: 'Venda ou consumo no local.', grupo: 'comercio', flags: [], cnae: ['4723-7/00', '5611-2/04', '5611-2/05']},
  {id: 'padaria', label: 'Padaria e confeitaria', description: 'Produção própria de pães, doces, salgados e confeitaria.', grupo: 'producao', flags: ['hotCold'], cnae: ['1091-1/02', '4721-1/02']},
  {id: 'rotisseria', label: 'Rotisseria e comida pronta', description: 'Pratos prontos, assados e porções vendidos para levar.', grupo: 'producao', flags: ['rawPrep', 'hotCold'], cnae: ['5620-1/04']},
  {id: 'cozinha', label: 'Cozinha de restaurante, lanchonete ou bar', description: 'Pré-preparo e preparo de refeições e lanches.', grupo: 'producao', flags: ['rawPrep', 'hotCold'], cnae: ['5611-2/01', '5611-2/03']},
  {id: 'institucional', label: 'Cozinha industrial ou institucional', description: 'Escola, creche, hospital, empresa, cantina ou equipamento social.', grupo: 'producao', flags: ['rawPrep', 'hotCold'], cnae: ['5620-1/01', '5620-1/03']},
  {id: 'salao', label: 'Salão, balcão ou área de consumo', description: 'Mesas, balcão, refeitório ou praça de alimentação.', grupo: 'servico', flags: [], cnae: []},
  {id: 'selfservice', label: 'Self-service ou bufê no salão', description: 'Alimentos expostos para o consumidor se servir.', grupo: 'servico', flags: ['selfService', 'hotCold'], cnae: []},
  {id: 'bufe', label: 'Bufê ou evento', description: 'Produção para eventos, com transporte e montagem.', grupo: 'servico', flags: ['hotCold', 'deliveryTransport'], cnae: ['5620-1/02']},
  {id: 'delivery', label: 'Delivery ou cozinha sem salão', description: 'Produção destinada à entrega.', grupo: 'servico', flags: ['deliveryTransport'], cnae: []},
  {id: 'movel', label: 'Unidade móvel ou comida de rua', description: 'Food truck, carrinho ou trailer.', grupo: 'servico', flags: [], cnae: ['5612-1/00']},
  {id: 'deposito', label: 'Depósito ou distribuidora de alimentos', description: 'Recebimento, armazenamento e expedição.', grupo: 'logistica', flags: [], cnae: ['4637-1/99', '4639-7/01', '4639-7/02']},
  {id: 'transporte', label: 'Transporte próprio de alimentos', description: 'Veículos do estabelecimento.', grupo: 'logistica', flags: ['deliveryTransport'], cnae: []}
];

/* atalhos: um toque marca vários setores; o fiscal desmarca o que não existe */
const PRESETS = [
  {id: 'super', label: 'Supermercado ou hipermercado', setores: ['mercearia', 'hortifruti', 'frios', 'acougue', 'padaria', 'rotisseria', 'bebidas']},
  {id: 'mini', label: 'Minimercado ou mercearia', setores: ['mercearia', 'hortifruti', 'bebidas']},
  {id: 'restaurante', label: 'Restaurante, lanchonete ou bar', setores: ['cozinha', 'salao', 'bebidas']},
  {id: 'padlanch', label: 'Padaria com lanchonete', setores: ['padaria', 'cozinha', 'salao']},
  {id: 'acougue', label: 'Açougue', setores: ['acougue']},
  {id: 'institucional', label: 'Cozinha institucional', setores: ['institucional', 'salao']},
  {id: 'distribuidora', label: 'Distribuidora', setores: ['deposito', 'transporte']}
];

/* licenciamento sanitário (Portaria SMS nº 266/2025, arts. 4º, 5º, 7º, 8º e 23) */
const REGIMES = [
  {id: 'cmvs', label: 'Licença de Funcionamento Sanitária com CMVS (Nível de Risco III – alto)'},
  {id: 'cli', label: 'CLI emitido no Portal Integrador (Nível de Risco II – médio)'},
  {id: 'mei', label: 'MEI dispensado pelo CCMEI (Nível de Risco II – médio)'},
  {id: 'isento', label: 'Isento: atividade fora do Anexo I (Nível de Risco I – baixo)'},
  {id: 'sem', label: 'Não apresentou licença nem dispensa'}
];

/* campos da identificação (substituem os antigos; a ordem é a da tela) */
const CAMPOS = [
  {id: 'establishment', label: 'Estabelecimento', placeholder: 'Razão social / nome fantasia'},
  {id: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00'},
  {id: 'address', label: 'Endereço', placeholder: 'Endereço inspecionado'},
  {id: 'regime', label: 'Licenciamento sanitário', type: 'select', options: REGIMES.map(r => r.label), full: true},
  {id: 'cmvs', label: 'Nº CMVS ou CLI', placeholder: 'Número da licença ou do certificado'},
  {id: 'cnaeLic', label: 'Atividades (CNAE) da licença', placeholder: 'Códigos ou descrições da licença ou do CLI', full: true},
  {id: 'responsible', label: 'Responsável presente', placeholder: 'Nome e função'},
  {id: 'date', label: 'Data da inspeção', type: 'date'},
  {id: 'team', label: 'Equipe inspetora'},
  {id: 'dateTeam', label: 'Data e equipe — registro anterior (opcional)', placeholder: 'Data e responsáveis pela inspeção', full: true}
];

/* verificações gerais: novas condições, por setor (os ids de tipo antigos saem) */
const COM_EXPOSICAO = ['mercearia', 'hortifruti', 'frios', 'acougue', 'peixaria', 'granel', 'padaria', 'rotisseria', 'cozinha', 'institucional', 'salao', 'selfservice', 'bufe', 'movel'];
const COM_PREPARO = ['padaria', 'rotisseria', 'cozinha', 'institucional', 'bufe', 'delivery', 'movel'];
const WHEN = {
  section: {
    preparation: {any: [{types: COM_PREPARO}, {flagsAll: ['rawPrep']}]},
    exposure: {any: [{types: COM_EXPOSICAO}, {flagsAll: ['selfService']}]},
    transport: {any: [{flagsAll: ['deliveryTransport']}, {types: ['delivery', 'bufe', 'deposito', 'transporte']}]}
  },
  item: {
    a1: {regime: ['cmvs', 'cli', 'sem', '', 'outro']},
    f2: {types: COM_PREPARO},
    f4: {types: COM_PREPARO},
    f7: {types: COM_PREPARO},
    g6: {types: ['mercearia', 'frios', 'acougue', 'peixaria', 'padaria', 'rotisseria', 'hortifruti']},
    h4: {types: ['delivery', 'bufe', 'institucional']},
    i4: {types: ['deposito']}
  }
};

/* Abertura: a licença fica concreta (Portaria SMS nº 266/2025) e os documentos saem das perguntas
   — Manual de Boas Práticas, POPs, responsável técnico e demais documentos são conferidos só no
   checklist de documentos (decisão de 11/11/2026). */
const REMOVER = ['a3', 'a4', 'a5', 'a6'];
const TEXTO = {
  a1: {text: 'A licença sanitária (CMVS) ou o CLI está afixado em local visível e corresponde às atividades, ao endereço e ao funcionamento observados.',
    legal: 'Portaria SMS nº 266/2025, arts. 8º, parágrafo único, e 41; Lei Municipal nº 13.725/2004, art. 90.'}
};
const NOVOS = {
  opening: [
    {id: 'a8', text: 'A dispensa de licença sanitária é compatível com as atividades exercidas no local.', legal: 'Portaria SMS nº 266/2025, arts. 4º, § 2º, 5º e 23.', critical: true, when: {regime: ['mei', 'isento']}}
  ],
  storage: [
    {id: 'e8', text: 'As câmaras frias atendem aos requisitos de construção, vedação, segurança e controle de temperatura.', legal: 'Portaria SMS nº 2.619/2011, item 6.23.', when: {types: ['acougue', 'peixaria', 'frios', 'mercearia', 'rotisseria', 'cozinha', 'institucional', 'deposito', 'padaria']}}
  ]
};

/* módulos por setor: cada um vira um item da seção “Setores do estabelecimento” */
const MODULOS = [
  /* Açougue: Portaria SMS nº 2.619/2011 (municipal) e o Regulamento estadual (Decreto nº 12.342/1978, arts. 461 a 461-K,
     redação dos Decretos nº 66.634/2022 e nº 66.739/2022), que revogou o Decreto nº 45.248/2000. Onde as duas divergem,
     vale a mais restritiva: o estadual veda empanados e preparações à base de carne moída no açougue (art. 461-K, I);
     a moagem prévia e a embalagem da carne moída bovina no próprio açougue seguem os arts. 461-B a 461-H. */
  {id: 'm-acougue', setor: 'acougue', title: 'Açougue', items: [
    {id: 'ac1', text: 'As carnes recebidas têm rotulagem íntegra, registro no serviço oficial de inspeção, temperatura dentro do limite (resfriadas até 7 °C; congeladas até 12 °C, ou conforme o fabricante) e procedência que permite rastrear a peça original.', legal: 'Portaria SMS nº 2.619/2011, itens 5.7 e 5.8; Decreto Estadual nº 12.342/1978 (redação do Decreto nº 66.634/2022), art. 461-A.', critical: true},
    {id: 'ac2', text: 'Os produtos cárneos, como carne seca, carne de sol e charque, são provenientes de estabelecimento com registro no órgão oficial competente.', legal: 'Portaria SMS nº 2.619/2011, item 9.12.', critical: true},
    {id: 'ac3', text: 'As carnes manipuladas cruas, inclusive as temperadas, ficam a no máximo 4 °C por até 3 dias, e espetos e bife rolê, por até 2 dias, salvo indicação do fabricante.', legal: 'Portaria SMS nº 2.619/2011, itens 6.30, III e IV, e 6.31.1.', critical: true},
    {id: 'ac4', text: 'A carne moída vendida sem embalagem é moída na presença do comprador, no tipo por ele pedido.', legal: 'Portaria SMS nº 2.619/2011, itens 9.10 e 9.10.1; Decreto Estadual nº 12.342/1978 (redação do Decreto nº 66.634/2022), arts. 461-I, 461-J e 461-K, IV e VII.', critical: true},
    {id: 'ac9', text: 'A carne moída resfriada de bovino moída, embalada e rotulada no próprio açougue atende às exigências.', legal: 'Decreto Estadual nº 12.342/1978 (redação do Decreto nº 66.634/2022), arts. 461-B a 461-H e 461-K, parágrafo único.', critical: true},
    {id: 'ac5', text: 'O preparo e o tempero de carnes atendem às exigências, com responsável treinado e certificado apresentado à autoridade sanitária.', legal: 'Portaria SMS nº 2.619/2011, itens 9.11, 9.11.1, 8.2.2 e 17.3, III; Decreto Estadual nº 12.342/1978 (redação do Decreto nº 66.634/2022), art. 461, § 1º, item 3, e § 2º; Resolução Conjunta SS/SAA nº 1/2001, arts. 1º a 3º.', critical: true},
    {id: 'ac10', text: 'O açougue se limita às atividades permitidas.', legal: 'Decreto Estadual nº 12.342/1978, art. 461-K (Decretos nº 66.634/2022 e nº 66.739/2022); Portaria SMS nº 2.619/2011, item 9.11.1.', critical: true},
    {id: 'ac6', text: 'A carne descongelada exposta à venda segue a recomendação do fabricante, em equipamento próprio, identificada como descongelada, com a data do descongelamento e o aviso de não recongelar.', legal: 'Portaria SMS nº 2.619/2011, itens 9.13 e 9.14.'},
    {id: 'ac7', text: 'Moedores, serras e fatiadores são desmontados para a higienização, o moedor ao menos uma vez ao dia, e têm proteção nas zonas de corte.', legal: 'Portaria SMS nº 2.619/2011, itens 3.21 e 4.2; Decreto Estadual nº 12.342/1978 (redação do Decreto nº 66.634/2022), art. 461-D.'},
    {id: 'ac8', text: 'No corte de carnes são usados luva de malha de aço e avental plástico, limpos e guardados protegidos.', legal: 'Portaria SMS nº 2.619/2011, itens 15.10 e 15.17.'}
  ]},
  {id: 'm-peixaria', setor: 'peixaria', title: 'Peixaria', items: [
    {id: 'px1', text: 'Os pescados recebidos têm rotulagem íntegra, registro no serviço oficial de inspeção e temperatura dentro do limite (resfriados crus até 3 °C; congelados até 12 °C), ou conforme o fabricante.', legal: 'Portaria SMS nº 2.619/2011, itens 5.7 e 5.8.', critical: true},
    {id: 'px2', text: 'Os pescados manipulados crus ficam a no máximo 2 °C por até 3 dias, e os pós-cocção, a 2 °C por até 1 dia, salvo indicação do fabricante.', legal: 'Portaria SMS nº 2.619/2011, itens 6.30, V e IX, e 6.31.1.', critical: true},
    {id: 'px3', text: 'Peixes salgados e secos em embalagem de madeira estão rotulados e em equipamento de refrigeração exclusivo ou separados dos demais produtos.', legal: 'Portaria SMS nº 2.619/2011, item 6.25.'},
    {id: 'px4', text: 'O avental plástico usado na manipulação de pescados é mantido limpo, conservado e longe de fonte de calor.', legal: 'Portaria SMS nº 2.619/2011, item 15.10.'}
  ]},
  {id: 'm-frios', setor: 'frios', title: 'Frios e laticínios fatiados', items: [
    {id: 'fr1', text: 'Frios e embutidos fatiados, picados ou moídos ficam a no máximo 4 °C por até 3 dias, e leite e derivados abertos, a 7 °C por até 5 dias, salvo indicação do fabricante.', legal: 'Portaria SMS nº 2.619/2011, itens 6.30, I e VII, e 6.31.1.', critical: true},
    {id: 'fr2', text: 'Os produtos fatiados e embalados na presença do consumidor trazem denominação, marca, ingredientes, validade após o fracionamento e condições de conservação.', legal: 'Portaria SMS nº 2.619/2011, item 8.2.2.'},
    {id: 'fr3', text: 'Os produtos fracionados e embalados na ausência do consumidor trazem a rotulagem completa, com lote, validade e condições de conservação garantidas pelo fracionador.', legal: 'Portaria SMS nº 2.619/2011, item 8.2.1.'},
    {id: 'fr4', text: 'Os fatiadores são desmontados para a higienização e têm proteção na zona de corte.', legal: 'Portaria SMS nº 2.619/2011, itens 3.21 e 4.2.'}
  ]},
  {id: 'm-hortifruti', setor: 'hortifruti', title: 'Hortifrúti', items: [
    {id: 'hf1', text: 'Há pia exclusiva para a higienização das mãos no setor de frutas, verduras e legumes.', legal: 'Portaria SMS nº 2.619/2011, item 2.4.19.'},
    {id: 'hf2', text: 'Frutas, verduras e legumes higienizados, fracionados ou descascados, sucos e polpas ficam a no máximo 5 °C por até 3 dias.', legal: 'Portaria SMS nº 2.619/2011, itens 6.30, XII, e 6.31.1.', critical: true},
    {id: 'hf3', text: 'Os hortifrutícolas minimamente processados no local são manipulados e embalados conforme os critérios do regulamento e estão rotulados.', legal: 'Portaria SMS nº 2.619/2011, itens 7.13 e 8.2.'}
  ]},
  {id: 'm-padaria', setor: 'padaria', title: 'Padaria e confeitaria', items: [
    {id: 'pd1', text: 'A área de produção é separada da área de venda, com fluxo ordenado e acesso restrito ao pessoal do setor.', legal: 'Portaria SMS nº 2.619/2011, itens 2.4 e 2.4.2.'},
    {id: 'pd2', text: 'Os produtos com cobertura ou recheio que exija refrigeração são mantidos a no máximo 5 °C por até 5 dias.', legal: 'Portaria SMS nº 2.619/2011, itens 5.7, VI, f, 6.30, VI, e 6.31.1.', critical: true},
    {id: 'pd3', text: 'Pães e similares em autosserviço ficam em recipientes com protetores higiênicos, com pegadores, data de fabricação e validade afixadas e aviso para não tocar os alimentos com as mãos.', legal: 'Portaria SMS nº 2.619/2011, itens 9.9, 9.9.1 e 9.9.2.', critical: true},
    {id: 'pd4', text: 'Os produtos de fabricação própria embalados trazem denominação, ingredientes, validade e condições de conservação.', legal: 'Portaria SMS nº 2.619/2011, itens 8.2.1 e 8.2.2.'},
    {id: 'pd5', text: 'Cilindros, masseiras, batedeiras e fatiadores têm proteção nas zonas de perigo e são desmontados para a higienização.', legal: 'Portaria SMS nº 2.619/2011, itens 3.21 e 4.2.'}
  ]},
  {id: 'm-rotisseria', setor: 'rotisseria', title: 'Rotisseria e comida pronta', items: [
    {id: 'rt1', text: 'Os pratos prontos embalados para levar trazem denominação, ingredientes, validade e condições de conservação.', legal: 'Portaria SMS nº 2.619/2011, itens 8.2.1 e 8.2.2.'},
    {id: 'rt2', text: 'As preparações com carnes ou pescados crus ficam expostas separadas, por no máximo 2 horas a 5 °C.', legal: 'Portaria SMS nº 2.619/2011, itens 9.25 e 9.26.', critical: true},
    {id: 'rt3', text: 'Os alimentos preparados guardados para venda posterior respeitam temperatura e prazo: até 4 °C por 3 dias; pescados, até 2 °C por 1 dia; maionese e misturas, até 4 °C por 2 dias.', legal: 'Portaria SMS nº 2.619/2011, itens 6.30, VIII, IX e XI, e 6.31.1.', critical: true}
  ]},
  {id: 'm-selfservice', setor: 'selfservice', title: 'Self-service ou bufê no salão', items: [
    {id: 'ss1', text: 'O balcão térmico está limpo, com água trocada diariamente entre 80 °C e 90 °C, cubas que alcançam a água e alimentos colocados só com a água a 80 °C ou mais.', legal: 'Portaria SMS nº 2.619/2011, itens 9.22 e 9.22.1.', critical: true},
    {id: 'ss2', text: 'Cada preparação tem utensílio próprio de servir, de cabo longo.', legal: 'Portaria SMS nº 2.619/2011, item 9.1.2.'},
    {id: 'ss3', text: 'As temperaturas dos pratos expostos são aferidas e registradas de 2 em 2 horas.', legal: 'Portaria SMS nº 2.619/2011, item 14.3.1.'}
  ]},
  {id: 'm-salao', setor: 'salao', title: 'Salão e área de consumo', items: [
    {id: 'sl1', text: 'Há pia exclusiva para a higienização das mãos na área de consumo.', legal: 'Portaria SMS nº 2.619/2011, item 2.4.18.'},
    {id: 'sl2', text: 'Os sanitários do público têm descarga em funcionamento, vaso com assento e tampa, lixeiras sem contato manual e papel, e há ao menos um banheiro acessível.', legal: 'Portaria SMS nº 2.619/2011, itens 2.4.22 e 2.4.22.1.'},
    {id: 'sl3', text: 'Ornamentos e plantas não ficam sobre balcões e mesas de distribuição nem no fluxo de ar sobre os alimentos.', legal: 'Portaria SMS nº 2.619/2011, itens 9.2 e 9.2.1.'}
  ]},
  {id: 'm-granel', setor: 'granel', title: 'Venda a granel', items: [
    {id: 'gr1', text: 'Os recipientes de produtos a granel estão limpos, conservados, protegidos e são de material sanitário.', legal: 'Portaria SMS nº 2.619/2011, item 9.15.'},
    {id: 'gr2', text: 'Os utensílios de porcionamento do granel, exceto de grãos e secos, são retirados dos recipientes e lavados após o uso.', legal: 'Portaria SMS nº 2.619/2011, item 9.17.'}
  ]},
  {id: 'm-bebidas', setor: 'bebidas', title: 'Bebidas alcoólicas', items: [
    {id: 'bb1', text: 'Há avisos visíveis da proibição de venda, oferta e consumo de bebida alcoólica por menores de 18 anos.', legal: 'Portaria SMS nº 2.619/2011, item 9.28.'},
    {id: 'bb2', text: 'No autosserviço, as bebidas alcoólicas ficam em local ou estande específico, separado dos demais produtos e sinalizado.', legal: 'Portaria SMS nº 2.619/2011, item 9.28.1.'}
  ]},
  {id: 'm-deposito', setor: 'deposito', title: 'Depósito e distribuição', items: [
    {id: 'dp1', text: 'Os veículos não entram nas áreas de armazenamento e não há alimentos guardados nos pátios e nas plataformas de recebimento.', legal: 'Portaria SMS nº 2.619/2011, itens 5.2 e 5.5.'},
    {id: 'dp2', text: 'As embalagens dos alimentos armazenados estão limpas, íntegras, sem deformações e sem sinais de umidade ou bolor.', legal: 'Portaria SMS nº 2.619/2011, item 6.24.'}
  ]}
];

module.exports = {GRUPOS, SETORES, PRESETS, REGIMES, CAMPOS, WHEN, REMOVER, TEXTO, NOVOS, MODULOS};
