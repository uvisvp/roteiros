'use strict';
/* Checklist de documentos (pedido de 25/10/2026): os documentos estáticos que o estabelecimento
   deve ter — da licença aos POPs —, por roteiro. Serve para lembrar o que pedir e para dividir a
   inspeção (uma equipe na área física, outra na documentação). Não analisa o conteúdo, não capitula
   infração e não mexe no roteiro: o resultado é um relatório à parte, que o fiscal copia para o
   roteiro se quiser.
   Cada documento: g (grupo), n (nome), o (o que deve conter), q (quando se aplica; vazio = sempre),
   r (fundamento: ids do banco v12 'norma::artigo::N…' ou do banco v11 'norma:nó').
   Os textos são embutidos por scripts/documentos-checklist.cjs, que falha se um id não existir.
   Serviços assistenciais: a lista de cada modalidade vem do próprio módulo (DATA.services[].doc).
   Documentos verificados durante a inspeção (notas fiscais, licença de fornecedores e clientes,
   receitas) ficam no roteiro. */
const VERSAO = '2026-10-25';
const L90 = 'lei-municipal-13725-2004::artigo::90';
const BOMB = ['decreto-estadual-sp-69118-2024::artigo::15::inciso::v', 'decreto-estadual-sp-69118-2024::artigo::3::inciso::xxvi'];
const R63 = i => 'rdc-63-2011::artigo::23::inciso::' + i;
const D44 = n => 'rdc-44-2009::artigo::' + n;
const M67 = i => 'rdc-67-2007::anexo-i::anexo::i::item::' + i;
const A16 = (i, a) => 'rdc-16-2014::artigo::28::inciso::' + i + '::alinea::' + a;
const F16 = (i, a) => 'rdc-16-2014::artigo::27::inciso::' + i + '::alinea::' + a;
const G887 = n => 'rdc-887-2024::artigo::' + n;
const R430 = n => 'rdc-430-2020::artigo::' + n;
const R611 = n => 'rdc-611-2022::artigo::' + n;
const R978 = n => 'rdc-978-2025::artigo::' + n;
const P1101 = n => 'portaria-sms-sp-1101-2015::item::' + n;
const O1002 = n => 'rdc-anvisa-1002-2025:' + n;
const P2619 = n => 'portaria-sms-2619-2011:' + n;
const C48 = n => 'rdc-anvisa-48-2013:' + n;
const D665 = n => 'rdc-anvisa-665-2022:' + n;

const GRUPOS = [
  ['reg', 'Licenciamento e regularização'],
  ['rt', 'Responsabilidade técnica e pessoal'],
  ['edif', 'Edificação e segurança'],
  ['proc', 'Manuais e procedimentos (POPs)'],
  ['prog', 'Planos e programas'],
  ['contr', 'Contratos e terceirizados'],
  ['regs', 'Registros, laudos e certificados']
];

/* catálogo: o fundamento padrão; cada roteiro pode trocar o fundamento, o texto ou a condição */
const DOCS = {
  licenca: {g: 'reg', n: 'Licença de Funcionamento Sanitária (CMVS)', o: 'Licença vigente, com o endereço, a razão social e todas as atividades (CNAE) exercidas no local; alterações de atividade, endereço ou responsável comunicadas à vigilância.', r: [L90]},
  afe: {g: 'reg', n: 'Autorização de Funcionamento (AFE) da Anvisa', o: 'AFE publicada, com as atividades e as classes de produtos efetivamente exercidas e o endereço inspecionado.', r: ['rdc-16-2014::artigo::3']},
  ae: {g: 'reg', n: 'Autorização Especial (AE) da Anvisa', q: 'Quando houver atividade com substâncias ou medicamentos sujeitos a controle especial (Portaria SVS/MS 344/1998).', o: 'AE publicada no DOU, compatível com as atividades com substâncias e medicamentos controlados.', r: ['rdc-16-2014::artigo::4']},
  cnes: {g: 'reg', n: 'Inscrição no CNES', o: 'Cadastro Nacional de Estabelecimentos de Saúde ativo, com dados atualizados (endereço, serviços e profissionais).', r: ['rdc-63-2011::artigo::13']},
  crt: {g: 'rt', n: 'Certidão de Regularidade Técnica do Conselho Regional', o: 'Certidão vigente, em nome do responsável técnico e do estabelecimento, afixada em local visível quando a norma exigir.', r: [D44('2::inciso::iv')]},
  rt: {g: 'rt', n: 'Designação do responsável técnico e do substituto', o: 'Documento de designação do responsável técnico legalmente habilitado (registro no conselho de classe) e do substituto, com o horário de presença compatível com o funcionamento.', r: ['lei-municipal-13725-2004::artigo::92']},
  equipe: {g: 'rt', n: 'Relação da equipe e comprovantes de habilitação', o: 'Relação nominal da equipe com atribuições, qualificação, registro no conselho (quando houver) e carga horária.', r: [R978('117::inciso::iv')]},
  aso: {g: 'rt', n: 'Controle de saúde ocupacional (PCMSO e ASO)', o: 'Programa de controle médico e atestados de saúde ocupacional admissionais e periódicos dos funcionários.', r: [R63('ii')]},
  avcb: {g: 'edif', n: 'AVCB ou CLCB (Corpo de Bombeiros)', o: 'Auto de Vistoria (AVCB) ou Certificado de Licença (CLCB) do Corpo de Bombeiros vigente para a edificação ou área ocupada, salvo dispensa prevista no regulamento estadual.', r: BOMB},
  dcff: {g: 'edif', n: 'Declaração de Conformidade Físico-Funcional (DCFF)', q: 'Quando a atividade (CNAE) exigir o documento 17 no Anexo I da Portaria SMS 266/2025.', o: 'DCFF autodeclaratória, com responsável técnico pelo projeto, compatível com a edificação e as atividades (Portaria SMS/COVISA 404/2024).', r: ['portaria-sms-sp-266-2025::artigo::2::inciso::xii']},
  manual: {g: 'proc', n: 'Manual de Boas Práticas', o: 'Manual próprio do estabelecimento, atualizado, que descreva as atividades realizadas, as responsabilidades e os procedimentos adotados.', r: [D44(85)]},
  pops: {g: 'proc', n: 'Procedimentos Operacionais Padrão (POPs)', o: 'POPs escritos, aprovados, datados e assinados pelo responsável técnico, atualizados e disponíveis nos locais de uso, cobrindo as atividades exigidas pela norma.', r: [R63('xviii')]},
  pops_ciencia: {g: 'proc', n: 'Comprovante de ciência dos POPs pelos funcionários', o: 'Registro de divulgação do conteúdo dos POPs aos funcionários, conforme as atividades de cada um.', r: [D44('88::inciso::iii')]},
  pgrss: {g: 'prog', n: 'Plano de Gerenciamento de Resíduos de Serviços de Saúde (PGRSS)', o: 'PGRSS do serviço com: estimativa dos resíduos por grupo; manejo da geração à disposição final; ações em emergência; controle de pragas; capacitação; contrato e licença ambiental das empresas de coleta e destinação (RDC 222/2018, art. 6º). Quem gera só resíduo do Grupo D pode substituí-lo por notificação.', r: ['rdc-222-2018::artigo::5', 'rdc-222-2018::artigo::6']},
  spregula: {g: 'reg', n: 'Cadastro de gerador de resíduos de serviços de saúde (SP Regula, antiga Amlurb)', o: 'Cadastro ativo do estabelecimento como gerador de resíduos de serviços de saúde no órgão municipal de limpeza urbana.', r: ['lei-municipal-sp-13478-2002::artigo::144']},
  coleta: {g: 'contr', n: 'Contrato e licença ambiental da coleta e destinação dos resíduos', o: 'Cópia do contrato com a empresa de coleta, transporte e destinação dos resíduos e da licença ambiental dela.', r: ['rdc-222-2018::artigo::6::inciso::xi']},
  pragas: {g: 'contr', n: 'Controle de vetores e pragas: comprovante de execução', o: 'Comprovante (certificado ou ordem de serviço) da aplicação por empresa controladora de pragas licenciada, com data, produtos usados e validade do serviço; registros do programa preventivo.', r: [R63('viii')]},
  reservatorio: {g: 'regs', n: 'Comprovante de limpeza e desinfecção do reservatório de água', o: 'Comprovante ou registro da limpeza e desinfecção do reservatório (no mínimo a cada seis meses), com a capacidade do reservatório; em caixa d’água coletiva, cópia do documento do condomínio.', r: ['rdc-63-2011::artigo::39::paragrafo::1', 'rdc-63-2011::artigo::39::paragrafo::2']},
  terceiros: {g: 'contr', n: 'Contratos dos serviços terceirizados', q: 'Quando houver serviço ou atividade terceirizada (limpeza, manutenção, esterilização, laboratório, lavanderia etc.).', o: 'Contrato de cada serviço terceirizado, vigente, com as responsabilidades das partes; a empresa contratada regularizada na vigilância sanitária quando couber.', r: ['rdc-63-2011::artigo::11']},
  manutencao: {g: 'regs', n: 'Registros de manutenção preventiva e corretiva dos equipamentos', o: 'Programa e registros (ordens de serviço, laudos) da manutenção preventiva e corretiva dos equipamentos e instrumentos.', r: [R63('ix')]},
  calibracao: {g: 'regs', n: 'Certificados de calibração dos instrumentos', o: 'Certificados de calibração dos instrumentos de medição (termômetros, balanças etc.), dentro da validade, por laboratório com rastreabilidade.', r: [D44('88::inciso::v')]},
  edif_manut: {g: 'regs', n: 'Registros de manutenção da edificação e das instalações', o: 'Registros da manutenção preventiva e corretiva da edificação e das instalações (elétrica, hidráulica, climatização).', r: [R63('vii')]},
  treinamento: {g: 'rt', n: 'Programa e registros de capacitação da equipe', o: 'Programa de educação permanente ou capacitação e os registros de cada treinamento: data, carga horária, conteúdo, participantes e quem ministrou.', r: [R63('iii')]},
  psp: {g: 'prog', n: 'Plano de Segurança do Paciente', o: 'Plano com as estratégias de gestão de risco do serviço (identificação do paciente, higiene das mãos, prevenção de infecções, eventos adversos e sua notificação).', r: ['rdc-36-2013::artigo::4', 'rdc-36-2013::artigo::5']},
  pgt: {g: 'prog', n: 'Plano de Gerenciamento de Tecnologias em Saúde', o: 'Plano que cubra equipamentos, produtos para saúde, medicamentos e saneantes usados no serviço, com responsável, inventário e manutenções.', r: [O1002('a131')]},
  autoinspecao: {g: 'regs', n: 'Relatórios de autoinspeção', o: 'Programa de autoinspeções com frequência, responsáveis e abrangência, os relatórios das últimas autoinspeções e as ações corretivas.', r: [R430(37)]},
  sgq: {g: 'proc', n: 'Manual ou documentos do Sistema de Gestão da Qualidade', o: 'Descrição do sistema da qualidade: organograma, responsabilidades, gestão de documentos, desvios, mudanças, reclamações e recolhimento.', r: [R430(14)]}
};

/* ---------- conjuntos comuns ---------- */
const SAUDE = ['avcb', 'pgrss', 'spregula', 'coleta', 'pragas', 'reservatorio', 'terceiros', 'manutencao', 'edif_manut', 'treinamento', 'aso'];

const APPS = {
  /* ---------------- Medicamentos ---------------- */
  'drogaria': [
    ['licenca', {r: [D44('2::inciso::iii'), L90]}],
    ['afe', {r: [D44('2::inciso::i')]}],
    ['ae', {r: [D44('2::inciso::ii')]}],
    'crt',
    ['rt', {o: 'Farmacêutico responsável técnico (e substituto) com inscrição no CRF, presente durante todo o horário de funcionamento.', r: ['lei-5991-1973::artigo::15']}],
    ['avcb', {}],
    ['manual', {n: 'Manual de Boas Práticas Farmacêuticas', o: 'Manual específico do estabelecimento, com as atribuições e responsabilidades, a política de produtos próximos ao vencimento e as atividades realizadas.', r: [D44('2::inciso::v'), D44(85)]}],
    ['pops', {o: 'POPs aprovados, assinados e datados pelo farmacêutico, com revisão periódica, no mínimo sobre: higiene dos ambientes; aquisição, recebimento e armazenamento; exposição; dispensação; vencidos e próximos ao vencimento; serviços farmacêuticos; descartáveis.', r: [D44(86), D44(87)]}],
    'pops_ciencia',
    ['treinamento', {o: 'Registros de cursos e treinamentos com descrição, data, carga horária, participantes e quem ministrou.', r: [D44(28), D44('88::inciso::i')]}],
    ['pgrss', {r: [D44(97), 'rdc-222-2018::artigo::5']}],
    'spregula', 'coleta',
    ['pragas', {o: 'Comprovante da desratização e desinsetização por empresa licenciada e os registros do programa.', r: [D44(7), D44('88::inciso::iv')]}],
    ['calibracao', {n: 'Manutenção e calibração de aparelhos e equipamentos', q: 'Quando houver equipamentos que exijam (termômetros, aparelho de pressão, glicosímetro etc.).', o: 'Registros de manutenção e certificados de calibração dos aparelhos usados nos serviços farmacêuticos e no controle de temperatura.'}],
    ['servicos', {g: 'reg', n: 'Serviços farmacêuticos indicados na licença', q: 'Quando houver serviços farmacêuticos (aferição de parâmetros, aplicação de injetáveis, perfuração de lóbulo, vacinação, EAC).', o: 'Licença com cada serviço farmacêutico prestado; para vacinação e exames de análises clínicas, licença e requisitos próprios (RDC 197/2017 e RDC 978/2025).', r: [D44('61::paragrafo::3'), 'rdc-197-2017::artigo::4', R978(73)]}]
  ],
  'farmacia-manipulacao': [
    ['licenca', {o: 'Licença vigente com todos os grupos de atividade manipulados (sólidos, semissólidos, líquidos, estéreis, hormônios, antibióticos, citostáticos, homeopatia) e, se houver, a drogaria.', r: ['rdc-67-2007::regulamento-tecnico::item::5-1', L90]}],
    ['afe', {r: ['rdc-67-2007::regulamento-tecnico::item::5-1', 'rdc-16-2014::artigo::3']}],
    ['ae', {r: ['rdc-67-2007::anexo-iii::anexo::iii::item::2-4']}],
    'crt',
    ['rt', {o: 'Farmacêutico responsável técnico (e substituto) com inscrição no CRF, presente durante todo o horário de funcionamento.', r: ['lei-5991-1973::artigo::15']}],
    ['avcb', {r: [M67('4-18')].concat(BOMB)}],
    'dcff',
    ['planta', {g: 'edif', n: 'Planta ou croqui das áreas', q: 'Quando manipular hormônios, antibióticos ou citostáticos (salas dedicadas com antecâmara e ar independente).', o: 'Planta ou croqui que identifique as áreas de manipulação e os sistemas de ar independentes de cada classe.', r: ['rdc-67-2007::anexo-iii::anexo::iii::item::2-7']}],
    ['manual', {n: 'Manual de Boas Práticas de Manipulação', o: 'Manual com as diretrizes de gerenciamento da qualidade, organograma, fluxograma, atribuições do pessoal e os procedimentos adotados (item 15.3).', r: [M67('15-3')]}],
    ['manual_44', {g: 'proc', n: 'Manual de Boas Práticas Farmacêuticas (drogaria)', q: 'Quando houver dispensação de industrializados ou serviços farmacêuticos.', o: 'Manual específico da drogaria e dos serviços farmacêuticos.', r: [D44(85)]}],
    ['pops', {o: 'POPs aprovados e atualizados para as atividades de manipulação, controle de qualidade, limpeza, paramentação, prevenção de contaminação cruzada, água e equipamentos, mantidos em arquivo (item 15.5.3).', r: [M67('15-5-3'), M67('8-6')]}],
    ['agua_pop', {g: 'proc', n: 'Procedimento e laudos de análise da água (potável e purificada)', o: 'Procedimento de amostragem e periodicidade das análises da água potável e purificada, especificações e os laudos das análises.', r: [M67('7-5-1-2'), M67('7-5-2-3')]}],
    ['treinamento', {o: 'Programa de treinamento inicial e continuado de todo o pessoal (inclusive limpeza e manutenção), treinamentos específicos dos anexos e avaliação da efetividade.', r: [M67('3-2-1'), M67('3-2-3'), M67('3-2-6')]}],
    ['aso', {o: 'Exames médicos admissionais e periódicos de todos os funcionários (PCMSO e ASO).', r: [M67('3-3-1')]}],
    ['pgrss', {r: ['rdc-67-2007::regulamento-tecnico::item::5-2', 'rdc-222-2018::artigo::5']}],
    ['spregula', {r: ['lei-municipal-sp-13478-2002::artigo::144']}],
    'coleta',
    ['pragas', {o: '“Programa de Controle Integrado de Pragas e Vetores” com comprovante da aplicação por empresa licenciada e registros.', r: [M67('4-12')]}],
    ['reservatorio', {o: 'Comprovante da limpeza da caixa d’água; em caixa d’água coletiva, cópia do documento do condomínio.', r: [M67('7-5-1'), M67('7-5-1-1')]}],
    ['climatizacao', {g: 'regs', n: 'Registros de manutenção e limpeza da climatização', q: 'Quando houver sistema de climatização.', o: 'Registros de limpeza, manutenção e controle do sistema de climatização (e do exaustor das cabines).', r: [M67('5-3-1')]}],
    ['calibracao', {o: 'Certificados de calibração anual das balanças e instrumentos de medição por empresa certificada (Rede Brasileira de Calibração).', r: [M67('5-2-1')]}],
    ['manutencao', {o: 'Programa e registros de manutenção preventiva e corretiva dos equipamentos do laboratório de controle de qualidade e da manipulação.', r: [M67('7-3-18')]}],
    ['fornecedores', {g: 'regs', n: 'Qualificação de fornecedores', o: 'Documentação da qualificação dos fabricantes e fornecedores de matérias-primas e embalagens, com os critérios mínimos do item 7.1.7.', r: [M67('7-1-7')]}],
    ['autoinspecao', {o: 'Relatórios das autoinspeções (no mínimo anuais), conclusões e ações corretivas.', r: [M67('15-6-1')]}]
  ],
  'distribuidoras-transportadoras': [
    'licenca', ['afe', {r: ['rdc-16-2014::artigo::3']}], 'ae',
    ['crt', {r: [A16('i', 'e')], o: 'Comprovação do registro de responsabilidade técnica junto ao conselho de classe (certidão vigente).'}],
    ['rt', {r: ['lei-municipal-13725-2004::artigo::93'], o: 'Responsável técnico legalmente habilitado, presente durante o funcionamento, e substituto designado.'}],
    ['contrato_social', {g: 'reg', n: 'Contrato social e CNPJ', o: 'Contrato social (ou ata de constituição) registrado e alterações; CNPJ com a atividade econômica exercida.', r: [A16('i', 'a'), A16('i', 'b')]}],
    ['avcb', {r: [A16('i', 'c')].concat(BOMB)}],
    'dcff',
    ['manual', {n: 'Manual de Boas Práticas de Distribuição e Armazenagem', o: 'Manual com as práticas de distribuição e armazenagem da empresa.', r: [A16('i', 'f')]}],
    ['organograma', {g: 'rt', n: 'Organograma e descrição de cargos', o: 'Estrutura organizacional em organograma e descrição das responsabilidades de cada cargo.', r: [R430(9)]}],
    'sgq',
    ['pops', {o: 'POPs aprovados pela Garantia da Qualidade, atualizados e disponíveis nos locais de trabalho: recebimento, armazenagem, expedição, transporte, devoluções, recolhimento, reclamações, limpeza, pragas, temperatura e umidade.', r: [R430('18::inciso::iii'), R430(20), A16('ii', 'd')]}],
    ['treinamento', {o: 'Programa de treinamento inicial e periódico e registros, de acordo com a função.', r: [R430(12), R430('18::inciso::v')]}],
    'autoinspecao',
    ['qualificacao_termica', {g: 'regs', n: 'Qualificação térmica das áreas e equipamentos de temperatura controlada', o: 'Estudo de qualificação térmica (mapeamento) das áreas de armazenagem, que define a posição dos instrumentos de monitoramento.', r: [R430('43::paragrafo::1'), R430(40)]}],
    ['calibracao', {o: 'Certificados de calibração dos instrumentos de monitoramento de temperatura e umidade, antes do uso e nos intervalos definidos.', r: [R430('43::paragrafo::4'), R430('18::inciso::xi')]}],
    ['manutencao', {o: 'Programa de manutenção preventiva dos equipamentos com impacto na qualidade e seus registros.', r: [R430(41)]}],
    ['pragas', {o: 'Programa de manejo de pragas com agentes regularizados e o comprovante da empresa aplicadora.', r: [R430('18::inciso::xv')]}],
    ['terceiros', {q: 'Quando houver atividade terceirizada (transporte, armazenagem, operador logístico).', o: 'Contrato aprovado pela Garantia da Qualidade, com as responsabilidades de cada parte, e a qualificação do contratado.', r: [R430(72), R430(73)]}],
    ['transportadores', {g: 'contr', n: 'Qualificação dos transportadores', q: 'Quando a empresa contratar transporte.', o: 'Registros da qualificação dos transportadores e das condições de transporte exigidas.', r: [R430('63::inciso::i')]}],
    ['pgrss', {n: 'Plano de gerenciamento de resíduos', o: 'Plano de gerenciamento dos resíduos (produtos vencidos, avariados, recolhidos e embalagens), com destinação e contratos.', r: [A16('ii', 'j'), 'rdc-222-2018::artigo::5']}],
    'coleta'
  ],
  'gases-medicinais': [
    'licenca',
    ['afe', {o: 'AFE (e AE, quando aplicável) com a classe de gases medicinais distinta da de medicamentos e as atividades executadas.', r: [G887(9)]}],
    ['rt', {o: 'Responsável técnico legalmente habilitado pelo conselho de classe; farmacêutico quando houver dispensação.', r: [G887(13)]}],
    'avcb', 'dcff',
    ['sgq', {o: 'Sistema de Gestão da Qualidade que cubra armazenagem, distribuição, transporte e dispensação, com gestão e controle de documentos.', r: [G887(18), G887(20)]}],
    ['pops', {o: 'POPs compreensíveis, que instruam todas as atividades, disponíveis nos locais de trabalho e atualizados.', r: [G887(21), G887(22), G887(23)]}],
    ['pop_reclamacao', {g: 'proc', n: 'Procedimentos de reclamações, recolhimento e devoluções', o: 'Procedimentos escritos para reclamações por desvio de qualidade, recolhimento e produtos devolvidos.', r: [G887(28), G887(33), G887(37)]}],
    ['treinamento', {o: 'Sistemática de treinamento definida e registros dos treinamentos.', r: [G887(16)]}],
    ['autoinspecao', {o: 'Procedimento e registros do programa de autoinspeções.', r: [G887(42)]}],
    ['calibracao', {o: 'Certificados de calibração dos instrumentos de medição com impacto na qualidade.', r: [G887(46)]}],
    ['manutencao', {o: 'Programa de manutenção preventiva dos equipamentos com impacto na qualidade e seus registros.', r: [G887(47)]}],
    ['veiculos', {g: 'proc', n: 'Procedimentos de operação e manutenção dos veículos e equipamentos de transporte', q: 'Quando houver transporte próprio.', o: 'Procedimentos de operação e manutenção dos veículos, tanques e equipamentos usados no transporte.', r: [G887(71)]}],
    ['pragas', {o: 'Programa de manejo de pragas com agentes regularizados e o comprovante da empresa aplicadora.', r: [G887('19::inciso::xv')]}]
  ],

  /* ---------------- Serviços ---------------- */
  'vacinacao': [
    ['licenca', {o: 'Licença vigente que contemple a atividade de vacinação (inclusive extramuros, se houver).', r: ['rdc-197-2017::artigo::4', L90]}],
    ['cnes', {r: ['rdc-197-2017::artigo::5']}],
    ['rt', {o: 'Responsável técnico e substituto formalmente designados pelo responsável legal.', r: ['rdc-197-2017::artigo::7']}],
    ['treinamento', {o: 'Registros das capacitações periódicas (conservação, administração, eventos adversos, resíduos, registros, calendário), com data, horário, carga horária, conteúdo e quem ministrou.', r: ['rdc-197-2017::artigo::9', 'rdc-197-2017::artigo::9::paragrafo::unico']}],
    ['pops', {o: 'Procedimentos escritos do serviço: conservação e transporte das vacinas, administração, eventos adversos, limpeza e resíduos.', r: [R63('xviii'), 'rdc-197-2017::artigo::12']}],
    ['calibracao', {o: 'Certificados de calibração dos termômetros dos equipamentos de conservação das vacinas.', r: ['rdc-197-2017::artigo::11::inciso::ii']}],
    ...SAUDE.filter(x => x !== 'treinamento')
  ],
  'eac-tipo1': eac(1), 'eac-tipo2': eac(2), 'eac-tipo3': eac(3),
  'estetica': [
    ['licenca', {o: 'Licença (serviço de saúde) ou CMVS (serviço de interesse da saúde) vigente, afixada em local visível, com todas as atividades (CNAE) executadas.', r: ['rdc-63-2011::artigo::10', L90]}],
    ['cnes', {q: 'Serviço de saúde (procedimentos realizados por profissional de saúde).'}],
    ['rt', {q: 'Serviço de saúde (procedimentos realizados por profissional de saúde).', o: 'Responsável técnico e substituto de nível superior, designados conforme os conselhos de classe.', r: ['rdc-63-2011::artigo::16', 'lei-municipal-13725-2004::artigo::92']}],
    ['habilitacao', {g: 'rt', n: 'Comprovantes de formação dos profissionais', o: 'Registro no conselho (profissionais de saúde) ou certificado de formação de técnico em estética, esteticista ou cosmetólogo (serviço de interesse da saúde).', r: ['rdc-63-2011::artigo::17', 'lei-federal-13643-2018:a3']}],
    'avcb',
    ['pops', {o: 'POPs de todos os procedimentos realizados, limpeza e desinfecção, processamento de instrumentais e uso de EPIs, aprovados, vigentes e disponíveis à equipe.', r: [R63('xviii'), 'lei-federal-13643-2018:a8']}],
    ['psp', {q: 'Serviço de saúde.', r: ['rdc-63-2011::artigo::8']}],
    ['pgt', {q: 'Serviço de saúde.', r: ['rdc-anvisa-509-2021:a5']}],
    ['emergencia', {g: 'proc', n: 'Protocolo de atendimento a emergências', q: 'Serviço de saúde.', o: 'Fluxos e protocolos para emergências, com os insumos e equipamentos de suporte à vida.', r: ['rdc-63-2011::artigo::51']}],
    ['pgrss', {o: 'PGRSS (ou notificação, se gera só resíduo comum), com o manejo conforme a RDC 222/2018 e o contrato e a licença ambiental da coleta.'}],
    'spregula', 'coleta', 'pragas', 'reservatorio',
    ['terceiros', {o: 'Contratos dos serviços terceirizados (inclusive o processamento externo de materiais), com empresas regularizadas na vigilância.'}],
    'manutencao', 'treinamento'
  ],
  'academia-piscina': [
    'licenca',
    ['cnpj', {g: 'reg', n: 'CNPJ atualizado', o: 'Cadastro Nacional da Pessoa Jurídica atualizado.', r: [P1101('14-2')]}],
    ['rt', {o: 'Profissional de educação física habilitado (CREF) ou técnico credenciado pela federação, responsável pela supervisão.', r: ['lei-municipal-sp-11383-1993::artigo::1', P1101('12-1')]}],
    ['operador', {g: 'rt', n: 'Certificado de curso de operador de piscinas', q: 'Quando houver piscina.', o: 'Certificado de participação em curso de operador de piscinas de quem mantém e supervisiona a qualidade da água.', r: [P1101('12-2'), P1101('14-2-1')]}],
    ['atualizacao', {g: 'rt', n: 'Comprovantes de atualização profissional dos funcionários', o: 'Documentos que comprovem que os funcionários passaram por atividade de atualização profissional.', r: [P1101('14-2')]}],
    ['dea', {g: 'rt', n: 'Comprovantes de capacitação no uso do desfibrilador (DEA)', q: 'Quando o estabelecimento for obrigado a manter DEA (Lei 13.945/2005).', o: 'Certificados do curso de uso do desfibrilador externo automático, conforme as recomendações do Conselho Nacional de Ressuscitação.', r: ['lei-municipal-sp-13945-2005::artigo::1']}],
    'avcb',
    ['pops', {o: 'POPs de higienização das instalações, equipamentos, móveis e utensílios e de limpeza e desinfecção do reservatório de água.', r: [P1101('14-3')]}],
    ['pop_piscina', {g: 'proc', n: 'POPs da piscina', q: 'Quando houver piscina.', o: 'POP de tratamento e controle da água do tanque (filtragem, pH, aspiração, algicida, bordas, retrolavagem, alcalinidade, cloração, clarificação, decantação) e POP de higienização em acidentes (vômito, fezes, sangue).', r: [P1101('14-4')]}],
    ['pop_sauna', {g: 'proc', n: 'POP de higienização de banheiras e saunas', q: 'Quando houver banheiras ou saunas.', o: 'Procedimento de higienização das banheiras e saunas.', r: [P1101('7-12')]}],
    ['pops_ciencia', {r: [P1101('14-2')]}],
    ['parq', {g: 'regs', n: 'Atestados médicos, PAR-Q e termos de responsabilidade dos alunos', o: 'Questionários de Prontidão para Atividade Física (renovados anualmente), termos de responsabilidade e atestados médicos (menores de 15 e maiores de 69 anos), organizados e disponíveis.', r: [P1101('14-2'), 'lei-municipal-sp-11383-1993::artigo::2::paragrafo::5']}],
    ['controle_cloro', {g: 'regs', n: 'Registros de cloro residual livre e pH', q: 'Quando houver piscina.', o: 'Planilhas de medição do cloro residual livre e do pH do tanque e do cloro do lava-pés, antes de cada período, com data, hora e assinatura.', r: [P1101('14-2-1'), P1101('6-20')]}],
    ['reservatorio', {o: 'Comprovantes de limpeza e desinfecção do reservatório (na instalação, em intercorrências e na periodicidade legal) ou registro próprio do estabelecimento.', r: [P1101('9-3'), P1101('9-4')]}],
    ['agua_alt', {g: 'regs', n: 'Comprovantes de potabilidade da água de solução alternativa', q: 'Quando usar poço, caminhão-pipa ou outra solução alternativa.', o: 'Comprovantes de tratamento e controle da potabilidade e laudos laboratoriais dos fornecedores, arquivados por no mínimo 6 meses.', r: [P1101('14-2-1')]}],
    ['pragas', {o: 'Comprovante da aplicação de saneantes desinfestantes por empresa controladora de pragas regularizada.', r: [P1101('10-2')]}]
  ],
  'transporte-biologico': [
    ['licenca', {o: 'Licença vigente que contemple o transporte de material biológico humano.', r: ['rdc-504-2021::artigo::7::paragrafo::1', L90]}],
    ['contrato', {g: 'contr', n: 'Instrumento escrito (contrato) com cada remetente', o: 'Contrato com cada remetente que defina as responsabilidades de cada parte: documentação de expedição, biossegurança, conservação, tempo de transporte, treinamento e quais documentos e registros ficam disponíveis à vigilância.', r: ['rdc-504-2021::artigo::7', 'rdc-504-2021::artigo::26', 'rdc-504-2021::artigo::8::paragrafo::unico']}],
    ['supervisor', {g: 'rt', n: 'Designação do supervisor técnico', o: 'Profissional capacitado e designado para implantar, executar e monitorar os processos de transporte.', r: ['rdc-504-2021::artigo::7::paragrafo::2']}],
    ['pops', {n: 'Instruções escritas das operações de transporte', o: 'Instruções escritas e padronizadas das operações de transporte, disponíveis a todo o pessoal e revisadas anualmente ou quando o procedimento mudar.', r: ['rdc-504-2021::artigo::5']}],
    ['validacao', {g: 'regs', n: 'Validação do acondicionamento', o: 'Relatório de validação da etapa de acondicionamento, considerando o tipo de material e a finalidade do transporte.', r: ['rdc-504-2021::artigo::11']}],
    ['nc_registro', {g: 'regs', n: 'Registros de não conformidades no transporte', o: 'Registro e investigação das não conformidades, com as medidas corretivas e preventivas.', r: ['rdc-504-2021::artigo::6']}],
    ['treinamento', {o: 'Registros atualizados do treinamento específico do pessoal envolvido em cada etapa do transporte.', r: ['rdc-504-2021::artigo::9', 'rdc-504-2021::artigo::39']}],
    'avcb'
  ],
  'imagem-convencional': imagem('convencional'), 'imagem-mamografia': imagem('mamografia'), 'imagem-tomografia': imagem('tomografia'),
  'imagem-ressonancia': imagem('ressonancia'), 'imagem-ultrassom': imagem('ultrassom'), 'imagem-hemodinamica': imagem('hemodinamica'),
  'odontologia': [
    ['licenca', {r: [O1002('a8'), L90]}],
    'cnes',
    ['rt', {o: 'Cirurgião-dentista responsável técnico designado pelo responsável legal; alteração de RT ou substituto comunicada à vigilância.', r: [O1002('a5'), O1002('a7')]}],
    'avcb',
    ['sdbpf', {g: 'proc', n: 'Série de Documentos de Boas Práticas de Funcionamento (SDBPF)', o: 'Rotinas, protocolos técnicos padronizados, POPs e planos do serviço, elaborados pelo RT e adequados à assistência prestada (recepção, limpeza, desinfecção, processamento, esterilização).', r: [O1002('a110'), O1002('a112'), O1002('a113')]}],
    ['pop_proc', {g: 'proc', n: 'POP de processamento dos dispositivos médicos', o: 'POP detalhado para cada etapa do processamento, elaborado pelo RT, com o prazo de validade da esterilização.', r: [O1002('a57'), O1002('a82')]}],
    ['protocolos', {g: 'proc', n: 'Protocolos de emergência e de acidente com material biológico', o: 'Protocolo de atendimento e encaminhamento de urgências e emergências e protocolo de encaminhamento em acidente de trabalho com exposição a material biológico.', r: [O1002('a116'), O1002('a115')]}],
    ['psp', {r: [O1002('a118')]}],
    'pgt',
    ['pgrss', {r: [O1002('a122'), 'rdc-222-2018::artigo::5']}],
    'spregula', 'coleta',
    ['treinamento', {o: 'Registros da capacitação admissional e periódica sobre as rotinas, protocolos e POPs da SDBPF.', r: [O1002('a114')]}],
    ['manutencao', {o: 'Manutenções preventivas e corretivas dos equipamentos comprovadas por laudo, ordem de serviço ou registro do prestador.', r: [O1002('a130')]}],
    ['radiometrico', {g: 'regs', n: 'Laudo de levantamento radiométrico', q: 'Quando houver equipamento de raios X e o operador não mantiver 2 m de distância nem dispuser de disparador fora da sala.', o: 'Laudo que indique a posição da equipe em área livre.', r: [O1002('a15p1')]}],
    ['processadora', {g: 'contr', n: 'Contrato com a empresa processadora', q: 'Quando o processamento dos dispositivos médicos for terceirizado.', o: 'Contrato de prestação de serviço com empresa processadora licenciada e o POP de preparo prévio definido em conjunto.', r: [O1002('a105'), O1002('a105pu'), O1002('a106p1')]}],
    'pragas', 'reservatorio'
  ],

  /* ---------------- Alimentos ---------------- */
  'servicos-alimentacao-roteiro': [
    'licenca',
    ['rt', {o: 'Responsável técnico legalmente habilitado, ou — nas empresas dispensadas — proprietário ou pessoa designada com certificado de curso de Boas Práticas de Manipulação.', r: [P2619('n16.1'), P2619('n16.1.4b')]}],
    ['manual', {o: 'Manual de Boas Práticas que descreva as operações reais do estabelecimento, atualizado e disponível.', r: [P2619('n16.2')]}],
    ['pops', {o: 'POPs exigíveis ao tipo de estabelecimento (higienização das instalações e utensílios; higiene e saúde dos manipuladores; pragas; reservatório; potabilidade da água de fonte alternativa; e os específicos da indústria e do atacado), com registros.', r: [P2619('n14.10'), P2619('n17.2')]}],
    ['capacitacao', {g: 'rt', n: 'Programa e comprovantes de capacitação dos manipuladores', o: 'Programa de capacitação em Boas Práticas e POPs para todos os envolvidos na manipulação, com comprovação.', r: [P2619('n15.37'), P2619('n15.38')]}],
    ['aso', {o: 'PCMSO e atestados de saúde dos manipuladores (com os exames exigidos).', r: [P2619('n17.2')]}],
    ['reclamacoes', {g: 'regs', n: 'Registros de reclamações dos consumidores', o: 'Registro das reclamações efetuadas por consumidores e das ações tomadas.', r: [P2619('n17.2')]}],
    ['reservatorio', {o: 'Comprovantes de lavagem e desinfecção do reservatório na instalação, a cada 6 meses e após acidentes.', r: [P2619('n11.5'), P2619('n17.2')]}],
    ['pragas', {o: 'Comprovante da aplicação por empresa controladora de pragas licenciada e os registros do controle integrado.', r: [P2619('n12.4.2')]}],
    ['recolhimento', {g: 'prog', n: 'Programa de recolhimento de alimentos', q: 'Indústria e estabelecimentos que distribuem produtos com marca própria.', o: 'Programa de recolhimento para suspeita ou constatação de alimento que possa causar dano à saúde.', r: [P2619('n14.7')]}],
    ['auditoria', {g: 'regs', n: 'Auditorias internas de Boas Práticas', o: 'Auditorias internas periódicas com roteiro ou lista de verificação e planos de ação com prazos e responsáveis.', r: [P2619('n14.2')]}],
    'avcb'
  ],

  /* ---------------- Produtos ---------------- */
  'produtos-correlatos': {modalidades: {
    fabricante: {nome: 'Fabricante de cosméticos', lista: [
      'licenca', ['afe', {r: ['rdc-16-2014::artigo::3']}],
      ['contrato_social', {g: 'reg', n: 'Contrato social e CNPJ', o: 'Contrato social (ou ata de constituição) registrado e alterações; CNPJ com a atividade econômica exercida.', r: [F16('i', 'a'), F16('i', 'b')]}],
      ['crt', {o: 'Comprovação do registro de responsabilidade técnica junto ao conselho de classe.', r: [F16('i', 'e')]}],
      ['rt', {r: ['lei-municipal-13725-2004::artigo::93'], o: 'Responsável técnico legalmente habilitado, presente durante o funcionamento.'}],
      ['organograma', {g: 'rt', n: 'Organograma e definição de cargos', o: 'Organograma e definição dos cargos, responsabilidades e qualificação necessária.', r: [F16('i', 'd')]}],
      ['avcb', {r: [F16('i', 'c')].concat(BOMB)}],
      ['sgq', {o: 'Documentação de Boas Práticas de Fabricação elaborada, aprovada, atualizada e distribuída com controle de emissão e revisão.', r: [C48('n10.4')]}],
      ['pops', {o: 'POPs e registros de recebimento, identificação, amostragem, numeração de lote, ensaios, limpeza, armazenamento, calibração, manutenção e demais operações.', r: [C48('n10.11'), F16('ii', 'h')]}],
      ['treinamento', {o: 'Programa escrito de treinamento, com planejamento e registros.', r: [C48('n11.3')]}],
      ['aso', {o: 'Exames de saúde admissionais e periódicos do pessoal.', r: [C48('n5.2')]}],
      ['fornecedores', {g: 'regs', n: 'Qualificação de fornecedores', o: 'Critérios definidos e registros da qualificação dos fornecedores.', r: [C48('n3.3.5')]}],
      ['agua', {g: 'regs', n: 'Monitoramento da qualidade da água', o: 'Procedimentos e registros do monitoramento periódico da qualidade da água nos pontos críticos.', r: [C48('n13.6')]}],
      ['reclamacoes', {g: 'proc', n: 'Procedimentos de reclamações e recolhimento', o: 'Procedimentos escritos de investigação de reclamações e de recolhimento, com registros.', r: [C48('n6.1'), C48('n7.3')]}],
      ['autoinspecao', {o: 'Procedimento escrito de autoinspeção e relatórios (no mínimo uma por ano).', r: [C48('n9.2'), C48('n9.4')]}],
      ['pragas', {o: 'Programa de prevenção contra insetos e animais e os registros.', r: [C48('n12.8')]}],
      ['terceiros', {o: 'Contratos de prestação de serviços com empresas autorizadas e licenciadas.', r: [F16('i', 'f')]}]
    ]},
    distribuidor: {nome: 'Atacadista / distribuidor', lista: [
      'licenca', ['afe', {r: ['rdc-16-2014::artigo::3']}],
      ['contrato_social', {g: 'reg', n: 'Contrato social e CNPJ', o: 'Contrato social (ou ata de constituição) registrado e alterações; CNPJ com a atividade econômica exercida.', r: [A16('i', 'a'), A16('i', 'b')]}],
      ['crt', {o: 'Comprovação do registro de responsabilidade técnica junto ao conselho de classe.', r: [A16('i', 'e')]}],
      ['rt', {r: ['lei-municipal-13725-2004::artigo::93'], o: 'Responsável técnico legalmente habilitado, presente durante o funcionamento.'}],
      ['avcb', {r: [A16('i', 'c')].concat(BOMB)}],
      ['manual', {n: 'Manual de Boas Práticas de Distribuição e Armazenagem', q: 'Distribuidor ou armazenador de produtos para saúde (dispositivos médicos/IVD).', o: 'Manual com as práticas de distribuição e armazenagem.', r: [A16('i', 'f')]}],
      ['sgq', {n: 'Manual da qualidade (dispositivos médicos)', q: 'Quando distribuir dispositivos médicos ou IVD.', o: 'Política da qualidade descrita em manual, com sistema de qualidade e procedimentos próprios.', r: [D665('a4'), D665('a5')]}],
      ['pops', {o: 'POPs aprovados para recepção, identificação, controle de estoque e armazenamento de produtos acabados, devolvidos ou recolhidos.', r: [A16('ii', 'd')]}],
      ['autoinspecao', {o: 'Programa de autoinspeção com abrangência, frequência, responsáveis e ações sobre as não conformidades.', r: [A16('ii', 'e')]}],
      ['treinamento', {o: 'Registros de capacitação do pessoal nas atividades da empresa.', r: [A16('ii', 'b')]}],
      ['calibracao', {o: 'Certificados de qualificação e calibração das instalações, equipamentos e instrumentos (termômetros, termo-higrômetros).', r: [A16('ii', 'a')]}],
      ['pgrss', {n: 'Plano de gerenciamento de resíduos', o: 'Plano de gerenciamento dos resíduos (produtos vencidos, avariados e embalagens), com destinação e contratos.', r: [A16('ii', 'j')]}],
      ['pragas', {o: 'Programa de controle de pragas com agentes que não afetem a qualidade do produto e o comprovante da empresa aplicadora.', r: [D665('a74')]}],
      ['terceiros', {o: 'Contratos de prestação de serviços com empresas autorizadas e licenciadas.', r: [A16('i', 'd')]}]
    ]},
    transportadora: {nome: 'Transportador', lista: [
      'licenca',
      ['afe', {o: 'AFE para a atividade de transporte, ou enquadramento comprovado na dispensa para transportador.', r: ['rdc-16-2014::artigo::3', 'rdc-16-2014::artigo::5::inciso::vi']}],
      ['contrato_social', {g: 'reg', n: 'Contrato social e CNPJ', o: 'Contrato social (ou ata de constituição) registrado e alterações; CNPJ com a atividade econômica exercida.', r: [A16('i', 'a'), A16('i', 'b')]}],
      ['crt', {o: 'Comprovação do registro de responsabilidade técnica junto ao conselho de classe.', r: [A16('i', 'e')]}],
      ['veiculos', {g: 'regs', n: 'Relação dos veículos', o: 'Relação e identificação dos veículos próprios ou de terceiros usados no transporte, com os equipamentos de manutenção das condições de transporte.', r: [A16('ii', 'm')]}],
      ['pops', {o: 'POPs de recepção, identificação, controle e armazenamento em trânsito, conservação da carga e segregação.', r: [A16('ii', 'd')]}],
      ['treinamento', {o: 'Registros de capacitação do pessoal.', r: [A16('ii', 'b')]}],
      ['calibracao', {o: 'Certificados de qualificação e calibração dos equipamentos e instrumentos de controle de temperatura.', r: [A16('ii', 'a')]}],
      ['autoinspecao', {o: 'Programa de autoinspeção com abrangência, frequência, responsáveis e ações.', r: [A16('ii', 'e')]}],
      ['terceiros', {o: 'Contratos com transportadores e demais prestadores, autorizados e licenciados.', r: [A16('i', 'd')]}],
      'avcb'
    ]}
  }}
};

/* EAC: comum aos três tipos, com o que é próprio do Tipo III */
function eac(tipo) {
  const l = [
    ['licenca', {o: 'Alvará de licenciamento indicando as atividades de EAC' + (tipo === 1 ? ' (na farmácia ou consultório isolado, além das atividades principais).' : '.'), r: [R978(73), L90]}],
    ['cnes', {r: [R978(74)]}],
    ['rt', {o: 'Responsável técnico legalmente habilitado e substituto para os impedimentos; supervisor do pessoal técnico presente durante o funcionamento.', r: [R978(75), R978(122)]}],
    ['organograma', {g: 'rt', n: 'Estrutura organizacional documentada', o: 'Organograma e descrição das responsabilidades.', r: [R978(76)]}],
    'equipe',
    ['pgq', {g: 'prog', n: 'Programa de Garantia da Qualidade (PGQ)', o: 'PGQ implantado com os componentes mínimos e indicadores de desempenho monitorados pelo RT.', r: [R978(84), R978(86), R978(87)]}],
    ['pep', {g: 'prog', n: 'Programa de Educação Permanente', o: 'Programa para toda a equipe e registros de sua execução.', r: [R978(124), R978('117::inciso::v')]}],
    ['biosseguranca', {g: 'proc', n: 'Instruções escritas de biossegurança', o: 'Instruções de segurança biológica, química, física, ocupacional e ambiental, uso de EPI e EPC, procedimentos em acidentes e transporte de material biológico.', r: [R978(110)]}],
    ['limpeza', {g: 'proc', n: 'Instruções de limpeza, desinfecção e esterilização', o: 'Instruções escritas para limpeza, desinfecção e esterilização de superfícies, instalações, equipamentos e artigos.', r: [R978(112)]}],
    ['liberacao', {g: 'proc', n: 'Procedimentos de registro e liberação de resultados e laudos', o: 'Procedimentos documentados, nos locais do exame, de registro e liberação de resultados, resultados críticos e assinatura dos laudos (rotina, plantões e urgências).', r: [R978(119), R978(165)]}],
    ['equip_instr', {g: 'proc', n: 'Instruções de uso dos equipamentos em português', o: 'Instruções escritas em língua portuguesa (ou manuais do fabricante) de cada equipamento.', r: [R978(99)]}],
    ['manutencao', {o: 'Registros da manutenção preventiva e corretiva e das medidas e verificações dos equipamentos.', r: [R978(92), R978(93)]}],
    ['calibracao', {o: 'Procedimentos documentados e registros da calibração dos equipamentos, na frequência do fabricante ou anual.', r: [R978(94)]}],
    ['controle_qual', {g: 'regs', n: 'Registros do controle interno e do controle externo da qualidade (CEQ)', o: 'Registros do controle interno da qualidade e relatórios do ensaio de proficiência/CEQ (no mínimo anuais), ou da forma alternativa de avaliação.', r: [R978(174), R978('117::inciso::vi'), R978(185)]}],
    ['pgrss', {r: [R978(111), 'rdc-222-2018::artigo::5']}],
    'spregula', 'coleta', 'avcb', 'pragas', 'reservatorio', 'edif_manut', 'aso'
  ];
  if (tipo === 3) l.push(
    ['dcff', {}],
    ['apoio', {g: 'contr', n: 'Contratos com laboratórios de apoio', q: 'Quando enviar exames a laboratório de apoio ou prestar esse serviço.', o: 'Contrato escrito com responsabilidades, auditoria, rastreabilidade e comunicação de desvios.', r: [R978(37), R978(82)]}]
  );
  else l.push(['terceiros', {o: 'Contratos dos serviços terceirizados, inclusive com o laboratório que realiza a fase analítica, quando houver.', r: [R978(82), 'rdc-63-2011::artigo::11']}]);
  return l;
}
/* Diagnóstico por imagem: RDC 611/2022 e as IN específicas */
function imagem(m) {
  const ion = m !== 'ressonancia' && m !== 'ultrassom';
  const l = [
    'licenca', 'cnes',
    ['rt', {o: 'Designação formal, pelo responsável legal, do responsável técnico de cada setor e do substituto, com as atividades delegadas.', r: [R611(13)]}],
    ['programas', {g: 'prog', n: 'Programas de Garantia da Qualidade' + (ion ? ' e de Proteção Radiológica' : ''), o: 'Programa de Garantia da Qualidade' + (ion ? ', Programa de Proteção Radiológica (prevenção, controle, vigilância e monitoramento)' : '') + ' e Programa de Educação Permanente implementados.', r: [R611(5)].concat(ion ? [R611(42)] : [])}],
    ['pep', {g: 'rt', n: 'Registros do Programa de Educação Permanente', o: 'Registros dos treinamentos do programa, no conteúdo e na periodicidade mínimos.', r: [R611(15)]}],
    ['pops', {o: 'Normas, rotinas, protocolos e procedimentos operacionais escritos para todas as atividades, atualizados e acessíveis à equipe.', r: [R611(38)]}],
    ['comite', {g: 'prog', n: 'Atas do Comitê de Gerenciamento de Riscos em Radiologia', q: 'Quando exigido pelo porte do serviço.', o: 'Constituição do comitê e registros da revisão sistemática dos programas.', r: [R611(39)]}],
    ['testes', {g: 'regs', n: 'Relatórios dos testes de aceitação e de constância', o: 'Relatórios dos testes de aceitação e constância dos equipamentos conforme a IN da modalidade e protocolos oficiais, com as manutenções.', r: [R611('28::paragrafo::unico'), R611(29)]}],
    ['calibracao', {o: 'Certificados de calibração dos instrumentos usados na avaliação dos equipamentos e das instalações, por laboratório credenciado.', r: [R611(30)]}]
  ];
  if (m !== 'ultrassom') l.push(['blindagem', {g: 'edif', n: 'Projeto de blindagem aprovado', o: 'Projeto de blindagem elaborado e assinado por profissional habilitado, aprovado e assinado pelo responsável legal, com a aprovação da vigilância' + (m === 'ressonancia' ? '; na RM, com blindagem eletromagnética, isolamento acústico, evacuação de gases e laudo de compatibilidade eletromagnética.' : '.'), r: [R611(7), R611(8)].concat(m === 'ressonancia' ? ['in-97-2021::artigo::4'] : [])}]);
  if (ion) l.push(
    ['spr', {g: 'rt', n: 'Designação do supervisor de proteção radiológica', o: 'Designação formal do supervisor de proteção radiológica e do substituto, membros legalmente habilitados da equipe.', r: [R611(14)]}],
    ['levantamento', {g: 'regs', n: 'Laudo de levantamento radiométrico', o: 'Laudo com croqui da instalação, equipamentos, pontos medidos e conclusões, refeito após mudança na instalação, nos equipamentos ou nos processos.', r: [R611(63)]}]
  );
  if (m === 'mamografia') l.push(['pnqm', {g: 'prog', n: 'Comprovante de participação no PNQM', o: 'Comprovante de participação no Programa Nacional de Qualidade em Mamografia.', r: ['portaria-de-consolidacao-ms-5-2017::artigo::216']}]);
  if (m === 'hemodinamica') l.push(
    ['epi_laudo', {g: 'regs', n: 'Laudos semestrais de integridade dos EPI plumbíferos', o: 'Laudo técnico semestral de integridade dos aventais e demais EPI, com os resultados e as imagens.', r: ['in-91-2021::artigo::9']}],
    ['psp', {n: 'Núcleo e Plano de Segurança do Paciente', o: 'Ato de constituição do NSP e Plano de Segurança do Paciente que alcance o serviço de hemodinâmica.'}]
  );
  return l.concat(['avcb', 'pgrss', 'spregula', 'coleta', 'pragas', 'reservatorio', 'terceiros', 'manutencao', 'aso'].map(x => x === 'manutencao' ? ['manutencao', {r: [R63('ix'), R611('28::paragrafo::unico')]}] : x));
}

module.exports = {VERSAO, GRUPOS, DOCS, APPS};
