'use strict';
/* Checklist de documentos (pedido de 25/10/2026; padrão revisto em 28/10/2026 a partir das listas
   de solicitação de documentos da UVIS — Drogaria, Manipulação, ampliação para SBIT, Distribuidoras e
   Transporte). Os documentos estáticos que o estabelecimento deve ter, para pedir e conferir; não
   analisa o conteúdo, não capitula infração e não mexe no roteiro.

   Padrão:
   - nome do documento como ele é pedido (“Cartão CNPJ atualizado”, “Certificado de limpeza do
     reservatório de água”, “PCMSO”), sem frase descritiva;
   - blocos das solicitações: Documentação legal e administrativa, Gestão de pessoal, Infraestrutura
     e higiene, Sistema de gestão da qualidade, Qualificações e validações, POPs (um item por POP) e
     Laudos, análises e comprovantes;
   - o que é geral fica nesses blocos; o que depende de uma atividade (aplicação de injetáveis,
     homeopatia, SBIT, frota própria…) vai em “Específico — atividade”, no fim da lista (campo esp);
   - só documentos estáticos (licenças, certidões, programas, manuais, POPs, contratos, certificados,
     laudos e relatórios), sem quantidade (na inspeção a conferência é por rastreabilidade);
     registros de rotina conferidos na inspeção (notas fiscais, livros, receitas, planilhas de
     temperatura, limpeza e cloro, fichas de reclamação, PAR-Q e atestados dos alunos) ficam no roteiro.

   Cada documento: g (bloco), n (nome), o (o que deve conter), q (condição: “Se aplicável: …”),
   esp (atividade específica), r (fundamento: ids do banco v12 'norma::artigo::N…' ou do banco v11
   'norma:nó') e, quando a exigência não está em norma do banco, fonte (texto da citação, sem texto
   embutido). Os textos são embutidos por scripts/documentos-checklist.cjs, que falha se um id não
   existir. Serviços assistenciais: a lista de cada modalidade vem do próprio módulo. */
const VERSAO = '2026-10-28b';
const L90 = 'lei-municipal-13725-2004::artigo::90';
const BOMB = ['decreto-estadual-sp-69118-2024::artigo::15::inciso::v', 'decreto-estadual-sp-69118-2024::artigo::3::inciso::xxvi'];
const R63 = i => 'rdc-63-2011::artigo::23::inciso::' + i;
const D44 = n => 'rdc-44-2009::artigo::' + n;
const M67 = i => 'rdc-67-2007::anexo-i::anexo::i::item::' + i;
const M67x = (a, i) => 'rdc-67-2007::anexo-' + a + '::anexo::' + a + '::item::' + i;
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
const NR7 = 'NR-7 (Ministério do Trabalho e Emprego) — norma trabalhista, sem texto no banco';
const NR1 = 'NR-1 (Ministério do Trabalho e Emprego), Programa de Gerenciamento de Riscos — norma trabalhista, sem texto no banco';

const GRUPOS = [
  ['leg', 'Documentação legal e administrativa'],
  ['pes', 'Gestão de pessoal'],
  ['infra', 'Infraestrutura e higiene'],
  ['sgq', 'Sistema de gestão da qualidade'],
  ['qual', 'Qualificações e validações'],
  ['pop', 'Procedimentos Operacionais Padrão (POPs)'],
  ['reg', 'Laudos, análises e comprovantes']
];

/* catálogo: nome e fundamento padrão; cada roteiro pode trocar o fundamento, o texto ou a condição */
const DOCS = {
  cnpj: {g: 'leg', n: 'Cartão CNPJ atualizado', o: 'Comprovante de inscrição no CNPJ, atualizado, com a atividade econômica exercida no endereço.', r: ['portaria-sms-sp-266-2025::artigo::29']},
  contrato_social: {g: 'leg', n: 'Contrato social atualizado', o: 'Contrato social (ou ata de constituição) registrado, com as alterações posteriores à última licença.', r: ['portaria-sms-sp-266-2025::artigo::2::inciso::xl']},
  licenca: {g: 'leg', n: 'Licença de Funcionamento Sanitária', o: 'Licença vigente, com o endereço, a razão social e todas as atividades (CNAE) exercidas no local.', r: [L90]},
  afe: {g: 'leg', n: 'AFE — Autorização de Funcionamento da Anvisa (publicação)', o: 'Publicação da AFE com as atividades e as classes de produtos exercidas e o endereço inspecionado.', r: ['rdc-16-2014::artigo::3']},
  ae: {g: 'leg', n: 'AE — Autorização Especial da Anvisa (publicação)', q: 'Se aplicável: atividades com substâncias ou medicamentos sujeitos a controle especial (Portaria SVS/MS 344/1998).', o: 'Publicação da AE no DOU, compatível com as atividades com controlados.', r: ['rdc-16-2014::artigo::4']},
  cnes: {g: 'leg', n: 'CNES — Cadastro Nacional de Estabelecimentos de Saúde', o: 'Cadastro ativo, com endereço, serviços e profissionais atualizados.', r: ['rdc-63-2011::artigo::13']},
  crt: {g: 'leg', n: 'Certidão de Regularidade Técnica (CRT) do conselho de classe', o: 'Certidão vigente em nome do responsável técnico e do estabelecimento.', r: [A16('i', 'e')]},
  avcb: {g: 'leg', n: 'AVCB ou CLCB (Corpo de Bombeiros)', o: 'Auto de Vistoria (AVCB) ou Certificado de Licença (CLCB) do Corpo de Bombeiros vigente para a área ocupada, salvo dispensa prevista no regulamento estadual.', r: BOMB},
  dcff: {g: 'leg', n: 'DCFF — Declaração de Conformidade Físico-Funcional', q: 'Se aplicável: atividade (CNAE) que exige o documento 17 no Anexo I da Portaria SMS 266/2025.', o: 'DCFF autodeclaratória, com responsável técnico pelo projeto, compatível com a edificação e as atividades (Portaria SMS/COVISA 404/2024).', r: ['portaria-sms-sp-266-2025::artigo::2::inciso::xii']},
  amlurb: {g: 'leg', n: 'Código gerador Amlurb (SP Regula)', o: 'Cadastro ativo como gerador de resíduos de serviços de saúde no órgão municipal de limpeza urbana.', r: ['lei-municipal-sp-13478-2002::artigo::144']},
  rt: {g: 'pes', n: 'Designação do responsável técnico e do substituto', o: 'Responsável técnico legalmente habilitado e substituto, com horário de presença compatível com o funcionamento.', r: ['lei-municipal-13725-2004::artigo::92']},
  pcmso: {g: 'pes', n: 'PCMSO — Programa de Controle Médico de Saúde Ocupacional', o: 'Programa vigente, elaborado por médico do trabalho, com os exames previstos para cada função.', r: [], fonte: NR7},
  pgr: {g: 'pes', n: 'PGR — Programa de Gerenciamento de Riscos', o: 'Inventário de riscos ocupacionais e plano de ação vigentes (substituiu o PPRA).', r: [], fonte: NR1},
  aso: {g: 'pes', n: 'ASO — Atestado de Saúde Ocupacional dos funcionários', o: 'ASO admissional e periódico de todos os funcionários, dentro da validade.', r: [], fonte: NR7},
  treinamento: {g: 'pes', n: 'Registro de treinamento dos funcionários', o: 'Registro de cada treinamento: data, carga horária, conteúdo, participantes e quem ministrou.', r: [R63('iii')]},
  reservatorio: {g: 'infra', n: 'Certificado de limpeza do reservatório de água (caixa d’água)', o: 'Certificado ou registro da limpeza e desinfecção do reservatório, no mínimo a cada seis meses; em caixa d’água coletiva, cópia do documento do condomínio.', r: ['rdc-63-2011::artigo::39::paragrafo::1', 'rdc-63-2011::artigo::39::paragrafo::2']},
  pragas: {g: 'infra', n: 'Certificado de controle de pragas urbanas (desinsetização e desratização)', o: 'Certificado válido da empresa controladora de pragas licenciada, com data, produtos usados e validade do serviço.', r: [R63('viii')]},
  calibracao: {g: 'infra', n: 'Certificado de calibração dos termo-higrômetros e termômetros', o: 'Certificado de calibração dentro da validade (ou nota fiscal de aquisição com até 12 meses), por laboratório com rastreabilidade.', r: [R63('ix')]},
  pgrss: {g: 'infra', n: 'PGRSS — Plano de Gerenciamento de Resíduos de Serviços de Saúde', o: 'Plano conforme a RDC 222/2018: estimativa dos resíduos por grupo; manejo da geração à disposição final; emergências; capacitação; contrato e licença ambiental das empresas de coleta e destinação. Quem gera só resíduo do Grupo D pode substituí-lo por notificação.', r: ['rdc-222-2018::artigo::5', 'rdc-222-2018::artigo::6']},
  pmoc: {g: 'infra', n: 'Comprovante de manutenção do ar-condicionado (PMOC)', q: 'Se aplicável: ambiente com ar-condicionado.', o: 'Plano de Manutenção, Operação e Controle e o registro da última manutenção.', r: ['lei-federal-13589-2018:a1']},
  manutencao: {g: 'infra', n: 'Registros de manutenção preventiva dos equipamentos', o: 'Programa e registros (ordens de serviço, laudos) da manutenção preventiva e corretiva dos equipamentos.', r: [R63('ix')]},
  edif_manut: {g: 'infra', n: 'Registros de manutenção da edificação e das instalações', o: 'Registros da manutenção preventiva e corretiva da edificação e das instalações (elétrica, hidráulica, climatização).', r: [R63('vii')]},
  manual: {g: 'sgq', n: 'Manual de Boas Práticas', o: 'Manual próprio do estabelecimento, atualizado, que descreva as atividades, as responsabilidades e os procedimentos adotados.', r: [D44(85)]},
  autoinspecao: {g: 'sgq', n: 'Relatório de autoinspeção', o: 'Relatório da autoinspeção, com as conclusões e as ações corretivas.', r: [R430(37), R430(39)]},
  fornecedores: {g: 'sgq', n: 'Qualificação de fornecedores', o: 'Documentação da qualificação dos fornecedores (licença sanitária, AFE, CRT e, quando couber, AE).', r: [R430('18::inciso::x')]},
  clientes: {g: 'sgq', n: 'Qualificação de clientes', o: 'Comprovação de que os clientes são licenciados e autorizados para as atividades (licença, AFE e, quando couber, AE).', r: [R430(6), R430('18::inciso::x')]},
  terceiros: {g: 'sgq', n: 'Contratos de terceirização', q: 'Se aplicável: serviço ou atividade terceirizada.', o: 'Contrato vigente de cada serviço terceirizado, com as responsabilidades das partes; contratada regularizada na vigilância quando couber.', r: ['rdc-63-2011::artigo::11']},
  psp: {g: 'sgq', n: 'Plano de Segurança do Paciente', o: 'Estratégias de gestão de risco do serviço (identificação do paciente, higiene das mãos, prevenção de infecções, eventos adversos e notificação).', r: ['rdc-36-2013::artigo::4', 'rdc-36-2013::artigo::5']},
  pgt: {g: 'sgq', n: 'Plano de Gerenciamento de Tecnologias em Saúde', o: 'Plano que cubra equipamentos, produtos para saúde, medicamentos e saneantes, com responsável, inventário e manutenções.', r: [O1002('a131')]},
  pops: {g: 'pop', n: 'POPs das atividades do estabelecimento', o: 'POPs escritos, aprovados, datados e assinados pelo responsável técnico, atualizados e disponíveis nos locais de uso.', r: [R63('xviii')]},
  pops_ciencia: {g: 'pop', n: 'Comprovante de ciência dos POPs pelos funcionários', o: 'Registro de divulgação do conteúdo dos POPs aos funcionários, conforme as atividades de cada um.', r: [D44('88::inciso::iii')]}
};
/* POP numa linha própria: pop('Recebimento de produtos', [ref…], {o, q, esp}) */
let nPop = 0;
const pop = (n, r, x = {}) => ['pop' + (++nPop), {g: 'pop', n, o: x.o || 'Procedimento escrito, aprovado, datado e assinado pelo responsável técnico, atualizado e disponível no local de uso.', r, ...x}];

const APPS = {
  /* ---------------- Medicamentos ---------------- */
  'drogaria': [
    ['cnpj', {r: ['lei-5991-1973::artigo::22::alinea::a']}],
    ['contrato_social', {r: ['lei-5991-1973::artigo::22::alinea::a']}],
    ['licenca', {r: [D44('2::inciso::iii'), L90]}],
    ['afe', {r: [D44('2::inciso::i')]}],
    ['ae', {r: [D44('2::inciso::ii')]}],
    ['crt', {n: 'Certidão de Regularidade Técnica (CRT) do CRF', r: [D44('2::inciso::iv'), D44('2::paragrafo::1')]}],
    'avcb', 'amlurb',
    ['rt', {o: 'Farmacêutico responsável técnico e substituto com inscrição no CRF, presentes durante todo o horário de funcionamento.', r: ['lei-5991-1973::artigo::15']}],
    ['treinamento', {n: 'Registro de treinamento de pessoal (RDC 44/2009, Seção III)', o: 'Registros dos cursos e treinamentos com descrição, data, carga horária, participantes e quem ministrou.', r: [D44(28), D44('88::inciso::i')]}],
    ['aso', {o: 'ASO admissional e periódico de todos os funcionários.', r: [], fonte: NR7}],
    ['pragas', {r: [D44(7), D44('88::inciso::iv')]}],
    'reservatorio',
    ['calibracao', {r: [D44('35::paragrafo::4'), D44('88::inciso::v')]}],
    ['pgrss', {n: 'PGRSS — Plano de Gerenciamento de Resíduos de Serviços de Saúde (RDC 222/2018)', r: [D44(97), 'rdc-222-2018::artigo::5']}],
    'pmoc',
    ['manual', {r: [D44('2::inciso::v'), D44(85)]}],
    ['fornecedores', {n: 'Qualificação de fornecedores (licença, AFE e CRT)', o: 'Licença sanitária, AFE e CRT de fornecedores (distribuidores) da drogaria.', r: [D44('31::paragrafo::1')]}],
    pop('Higiene e limpeza dos ambientes', [D44('86::inciso::i')]),
    pop('Aquisição, recebimento e armazenamento de produtos', [D44('86::inciso::ii'), D44(32)]),
    pop('Monitoramento de temperatura e umidade', [D44('35::paragrafo::4'), D44('35::paragrafo::5')]),
    pop('Exposição e organização dos produtos', [D44('86::inciso::iii')]),
    pop('Dispensação de medicamentos', [D44('86::inciso::iv')]),
    pop('Destino dos produtos com prazo de validade vencido', [D44('86::inciso::v')]),
    pop('Produtos próximos ao vencimento', [D44('86::inciso::vi'), D44(51)]),
    pop('Materiais descartáveis e sua destinação', [D44('86::inciso::viii')]),
    pop('Transporte e entrega de medicamentos', [D44('56::paragrafo::3')], {q: 'Se aplicável: entrega em domicílio ou venda remota.'}),
    'pops_ciencia',
    ['mapas', {g: 'reg', n: 'Comprovante de envio dos mapas e balanços à COVISA (Portaria 344/1998)', q: 'Se aplicável: dispensação de medicamentos sujeitos a controle especial.', o: 'Comprovantes de envio dos balanços (BMPO) e mapas dos períodos solicitados.', r: ['portaria-svs-ms-344-1998::artigo::69', 'portaria-svs-ms-344-1998::artigo::64']}],
    /* específicos */
    ['srv_licenca', {g: 'leg', esp: 'Serviços farmacêuticos', n: 'Serviços farmacêuticos indicados na licença', o: 'Licença com cada serviço farmacêutico prestado; vacinação e exames de análises clínicas com licença e requisitos próprios (RDC 197/2017 e RDC 978/2025).', r: [D44('61::paragrafo::3'), 'rdc-197-2017::artigo::4', R978(73)]}],
    ['srv_equip', {g: 'infra', esp: 'Serviços farmacêuticos', n: 'Lista dos equipamentos dos serviços farmacêuticos, com lote e registro na Anvisa', o: 'Relação dos equipamentos com lote e registro na Anvisa, acompanhada da nota fiscal com até 12 meses de aquisição ou do certificado de calibração anual.', r: [D44(71), D44(77), D44('88::inciso::v')]}],
    pop('Serviços farmacêuticos prestados', [D44('86::inciso::vii'), D44(72)], {esp: 'Serviços farmacêuticos'}),
    ['inj_delegacao', {g: 'pes', esp: 'Aplicação de injetáveis', n: 'Delegação formal aos profissionais que aplicam medicamentos injetáveis', o: 'Documento de delegação, pelo farmacêutico responsável técnico, aos farmacêuticos que aplicam injetáveis.', r: [D44('20::paragrafo::unico')]}],
    ['inj_curso', {g: 'pes', esp: 'Aplicação de injetáveis', n: 'Certificado do curso de técnica de aplicação de medicamentos injetáveis', o: 'Certificado de capacitação de cada profissional que aplica injetáveis.', r: [D44(21)]}],
    ['inj_vacina', {g: 'pes', esp: 'Aplicação de injetáveis', n: 'Carteira de vacinação dos aplicadores (hepatite B e dupla adulto)', o: 'Comprovante de vacinação contra hepatite B e dupla adulto (difteria e tétano) dos profissionais que aplicam injetáveis.', r: ['nr-32:n32.2.4.17.1']}]
  ],
  'farmacia-manipulacao': [
    ['cnpj', {n: 'Cartão CNPJ', r: ['lei-5991-1973::artigo::22::alinea::a']}],
    ['contrato_social', {n: 'Contrato social (se houve alteração após a última licença)', r: ['lei-5991-1973::artigo::22::alinea::a']}],
    ['licenca', {o: 'Licença vigente com todos os grupos de atividade manipulados (sólidos, semissólidos, líquidos, estéreis, hormônios, antibióticos, citostáticos, homeopatia) e, se houver, venda remota.', r: ['rdc-67-2007::regulamento-tecnico::item::5-1', L90]}],
    ['afe', {r: ['rdc-67-2007::regulamento-tecnico::item::5-1', 'rdc-16-2014::artigo::3']}],
    ['ae', {r: [M67x('iii', '2-4')]}],
    ['crt', {n: 'Certidão de Regularidade Técnica (CRT) do CRF', r: [D44('2::inciso::iv')]}],
    ['avcb', {r: [M67('4-18')].concat(BOMB)}],
    'dcff',
    ['clf_pf', {g: 'leg', n: 'CLF — Certificado de Licença de Funcionamento da Polícia Federal', q: 'Se aplicável: produtos químicos controlados pela Polícia Federal.', o: 'Certificado vigente para as atividades com produtos químicos controlados.', r: ['lei-10357-2001::artigo::4']}],
    ['policia_civil', {g: 'leg', n: 'Licença da Polícia Civil do Estado de São Paulo para solventes', q: 'Se aplicável: uso de solventes controlados.', o: 'Licença vigente para os solventes usados.', r: [], fonte: 'Licenciamento estadual de produtos químicos pela Polícia Civil de SP — dispositivo não consta do banco'}],
    ['informatizacao', {g: 'leg', n: 'Autorização de informatização dos livros (publicação no Diário Oficial)', q: 'Se aplicável: escrituração informatizada.', o: 'Publicação da aprovação do sistema informatizado de escrituração.', r: ['portaria-svs-ms-344-1998::artigo::63::paragrafo::1']}],
    ['amlurb', {n: 'Cadastro Amlurb'}],
    ['pcmso', {r: [M67('3-3-1')]}],
    'pgr',
    ['aso', {r: [M67('3-3-1')]}],
    ['treinamento', {n: 'Programa anual e comprovante de treinamento, com avaliação da efetividade', o: 'Programa anual de treinamento (inicial e continuado, inclusive limpeza e manutenção), comprovantes e avaliação da efetividade.', r: [M67('3-2-1'), M67('3-2-6')]}],
    ['reservatorio', {n: 'Comprovante de limpeza da caixa d’água', r: [M67('7-5-1'), M67('7-5-1-1')]}],
    ['pragas', {n: 'Comprovante de sanitização (desratização e desinsetização)', r: [M67('4-12')]}],
    ['planta', {g: 'infra', n: 'Planta baixa com a instalação da exaustão e do ar-condicionado', o: 'Planta das áreas da farmácia com os equipamentos de exaustão e de ar-condicionado e as tubulações (independentes nos laboratórios de sensibilizantes).', r: [M67x('iii', '2-7'), M67('8-7')]}],
    ['pgrss', {n: 'Programa de Gerenciamento de Resíduos, com fluxograma', o: 'PGRSS com fluxograma, contemplando o descarte dos solventes do laboratório de controle de qualidade.', r: ['rdc-67-2007::regulamento-tecnico::item::5-2', 'rdc-222-2018::artigo::5']}],
    ['manutencao', {n: 'Programa de manutenção preventiva (purificador de água, exaustores e ar-condicionado)', o: 'Programa de manutenção preventiva, próprio ou de empresa terceirizada, com os modelos de registro de troca e limpeza.', r: [M67('5-3-1'), M67('7-5-2-1'), M67('7-3-18')]}],
    ['calibracao', {n: 'Certificados de calibração das balanças e instrumentos de medição', o: 'Calibração anual por empresa certificada, com padrões rastreáveis à Rede Brasileira de Calibração.', r: [M67('5-2-1')]}],
    ['manual', {o: 'Manual de Boas Práticas de Manipulação com organograma e fluxograma da farmácia.', r: [M67('15-3')]}],
    ['autoinspecao', {n: 'Relatório de autoinspeção, com conclusões e ações corretivas', r: [M67('15-6-1')]}],
    ['fornecedores', {n: 'Qualificação completa de fornecedores, com auditoria', o: 'Qualificação com auditoria de cumprimento das Boas Práticas de Fracionamento e Distribuição de Insumos.', r: [M67('7-1-7')]}],
    ['contrato_lab', {g: 'sgq', n: 'Contrato com o laboratório das análises terceirizadas, com cronograma', o: 'Contrato com o laboratório que realiza as análises do monitoramento do processo magistral, com o cronograma dos ensaios.', r: [M67('7-3-15'), M67('9-2-4')]}],
    ['lab_licenca', {g: 'sgq', n: 'Licença ou declaração da vigilância de que o laboratório terceirizado segue a RDC 11/2012', q: 'Se aplicável: laboratório de controle de qualidade terceirizado.', o: 'Documento de licenciamento do laboratório ou declaração da vigilância local.', r: [M67('7-3-15-3')], fonte: 'RDC Anvisa nº 11/2012 (laboratórios analíticos) — texto não consta do banco'}],
    ['exaustao', {g: 'qual', n: 'Qualificação do sistema de exaustão de ar (QP, QI, QO e QD)', q: 'Se aplicável: etapas com matérias-primas em pó.', o: 'Qualificação de projeto, instalação, operação e desempenho, com parâmetros críticos definidos por análise de risco, conforme os guias da Anvisa.', r: [M67('8-7')]}],
    pop('Processo de paramentação', [M67('3-3-7'), M67('3-3-8')]),
    pop('Recebimento de matérias-primas e materiais de embalagem (inspeção de recebimento)', [M67('7-2-1')]),
    pop('Amostragem de insumos e material de embalagem', [M67('7-3-20')]),
    pop('Ensaios de controle de qualidade de matérias-primas, embalagens e preparações (com modelos de laudo)', [M67('7-3-2'), M67('7-3-10')]),
    pop('Qualificação de fornecedores', [M67('7-1-7')]),
    pop('Amostragem da água potável e purificada (parâmetros e periodicidade)', [M67('7-5-1-2'), M67('7-5-2-3')]),
    pop('Medidas em caso de laudo insatisfatório da água', [M67('7-5-1-6'), M67('7-5-2-4')]),
    pop('Manipulação das formas farmacêuticas', [M67('15-5-3')]),
    pop('Manipulação de substâncias controladas', ['rdc-67-2007::regulamento-tecnico::item::5-6'], {q: 'Se aplicável: manipulação de controlados.'}),
    pop('Preparação de bases', [M67('11-2-4')], {q: 'Se aplicável: preparo de bases galênicas.'}),
    pop('Prevenção de contaminação cruzada', [M67('8-6')]),
    pop('Diluição geométrica de matérias-primas', [M67x('iii', '2-15-4')]),
    pop('Padronização de excipientes', [M67('8-2')]),
    pop('Reclamação de cliente (com modelo de ficha)', [M67('15-7-1')]),
    pop('Autoinspeção', [M67('15-6-1')]),
    pop('Monitoramento do processo magistral', [M67('9-2-6')]),
    pop('Entrega e transporte de medicamentos manipulados e industrializados', [M67('13-1'), M67('13-2')], {q: 'Se aplicável: entrega ou transporte.'}),
    pop('Registros de temperatura e umidade (laboratórios, geladeiras e almoxarifado), com modelo de planilha', [M67('4-2-1'), M67('8-8'), M67('7-4-3')]),
    pop('Manutenção preventiva dos equipamentos (registros e cronograma)', [M67('5-3-1'), M67('7-3-18')]),
    pop('Limpeza dos ambientes e equipamentos (com modelo de planilha)', [M67('6-1'), M67('8-5')]),
    ['agua_analises', {g: 'reg', n: 'Laudos das análises semestrais da água potável', o: 'Laudos físico-químicos e microbiológicos semestrais da água de abastecimento.', r: [M67('7-5-1-3')]}],
    ['agua_purificada', {g: 'reg', n: 'Laudos das análises mensais da água purificada', o: 'Laudos físico-químicos e microbiológicos mensais da água purificada.', r: [M67('7-5-2-2')]}],
    ['monit_teor', {g: 'reg', n: 'Laudos das análises bimestrais de teor e uniformidade de conteúdo (fármaco ≤ 25 mg)', o: 'Análises de teor e uniformidade de conteúdo de fórmulas com fármaco em quantidade igual ou inferior a 25 mg, com prioridade para as de menos de 5 mg.', r: [M67('9-2-1'), M67('9-2-3'), M67('9-2-3-1')]}],
    ['monit_sensib', {g: 'reg', n: 'Laudos das análises trimestrais de teor e uniformidade (antibióticos, hormônios e citostáticos)', q: 'Se aplicável: manipulação de substâncias sensibilizantes (pode ser rodiziada).', o: 'Análises trimestrais de cada classe terapêutica de sensibilizantes manipulada.', r: [M67x('iii', '2-16'), M67x('iii', '2-16-1')]}],
    ['monit_micro', {g: 'reg', n: 'Laudos das análises mensais de pureza microbiológica (bases galênicas e preparações)', o: 'Monitoramento da pureza microbiológica de bases galênicas e de preparações magistrais e oficinais.', r: [M67('11-2-4')]}],
    ['mapas', {g: 'reg', n: 'Comprovante de envio dos mapas e balanços à COVISA (Portaria 344/1998)', q: 'Se aplicável: medicamentos e substâncias sujeitos a controle especial.', o: 'Comprovantes de envio pelo Portal 156 dos balanços (BSPO/BMPO) e mapas.', r: ['portaria-svs-ms-344-1998::artigo::68', 'portaria-svs-ms-344-1998::artigo::69']}],
    /* específicos */
    pop('Procedimentos específicos da manipulação homeopática', [M67x('v', '6-8')], {esp: 'Homeopatia'}),
    ['homeo_cq', {g: 'reg', esp: 'Homeopatia', n: 'Laudos do controle de qualidade dos insumos inertes e ativos homeopáticos', o: 'Avaliação dos insumos inertes e ativos conforme o item 9 do Anexo V.', r: [M67x('v', '9-1'), M67x('v', '9-2')]}],
    ['sbit_lista', {g: 'sgq', esp: 'Substâncias de baixo índice terapêutico (SBIT)', n: 'Lista das substâncias de baixo índice terapêutico manipuladas', o: 'Relação das SBIT que a farmácia manipula ou pretende manipular.', r: [M67x('ii', '2-10')]}],
    ['sbit_dissolucao', {g: 'qual', esp: 'Substâncias de baixo índice terapêutico (SBIT)', n: 'Estudo do perfil de dissolução', o: 'Comprovação da formulação dos sólidos com cada SBIT por perfil de dissolução.', r: [M67x('ii', '2-10')]}],
    ['sbit_excip', {g: 'qual', esp: 'Substâncias de baixo índice terapêutico (SBIT)', n: 'Relação e estudo de padronização e compatibilidade dos excipientes', o: 'Excipientes padronizados e compatíveis com cada formulação, com o estudo que os fundamenta.', r: [M67x('ii', '2-10-1')]}],
    ['sbit_bula', {g: 'sgq', esp: 'Substâncias de baixo índice terapêutico (SBIT)', n: 'Modelo da bula simplificada / informação ao paciente', o: 'Modelo da informação que acompanha os medicamentos com SBIT, nos padrões mínimos do item 3 do Anexo II.', r: [M67x('ii', '3-1')]}],
    ['sbit_treino', {g: 'pes', esp: 'Substâncias de baixo índice terapêutico (SBIT)', n: 'Comprovantes de capacitação da equipe para SBIT', o: 'Treinamento específico da equipe na atividade (Anexo I, item 3.2).', r: [M67('3-2-3')]}],
    pop('POPs específicos para SBIT (aquisição, armazenamento segregado, pesagem com dupla checagem, diluição geométrica, controle do diluído, controle de qualidade, monitoramento e dispensação)', [M67x('ii', '2-11'), M67x('ii', '2-12'), M67x('ii', '2-14')], {esp: 'Substâncias de baixo índice terapêutico (SBIT)'})
  ],
  'distribuidoras-transportadoras': [
    ['afe', {n: 'Publicação da AFE'}],
    ['ae', {n: 'Publicação da AE'}],
    ['cnpj', {n: 'Cartão CNPJ', r: [A16('i', 'b')]}],
    ['licenca'],
    ['avcb', {r: [A16('i', 'c')].concat(BOMB)}],
    ['crt', {n: 'Certidão de Regularidade Técnica (CRT) do CRF'}],
    'dcff',
    ['pcmso', {r: [R430(11)]}],
    'pgr',
    ['aso', {r: [R430(11)]}],
    ['treinamento', {r: [R430(12), R430('18::inciso::v')]}],
    ['reservatorio', {n: 'Certificado de limpeza da caixa d’água'}],
    ['pragas', {n: 'Certificado de controle de pragas — área', r: [R430('18::inciso::xv')]}],
    ['calibracao', {n: 'Certificado de calibração de todos os instrumentos', r: [R430('43::paragrafo::4'), R430('18::inciso::xi')]}],
    ['pgrss', {r: [A16('ii', 'j'), 'rdc-222-2018::artigo::5']}],
    'pmoc',
    ['manual', {n: 'Manual de Boas Práticas de Distribuição e Armazenagem', r: [A16('i', 'f')]}],
    'autoinspecao', 'fornecedores', 'clientes',
    ['recall', {g: 'sgq', n: 'Relatório anual de simulação de recolhimento (recall)', o: 'Relatório da simulação anual de recolhimento e de reconciliação para o pior caso da rede de distribuição.', r: [R430('18::inciso::vi'), R430('30::paragrafo::2')]}],
    ['transportadora', {g: 'sgq', n: 'Transportadora: contrato de terceirização, licença, AFE e AE', q: 'Se aplicável: transporte terceirizado.', o: 'Contrato aprovado pela Garantia da Qualidade, com as responsabilidades das partes, e a regularização da transportadora.', r: [R430(72), R430(73), R430('63::inciso::i')]}],
    ['qt_areas', {g: 'qual', n: 'Qualificação térmica das áreas de armazenamento', o: 'Estudo de qualificação térmica que define a posição dos instrumentos de monitoramento.', r: [R430('43::paragrafo::1')]}],
    ['qt_refrig', {g: 'qual', n: 'Qualificação dos equipamentos de cadeia fria (instalação, operação e desempenho)', q: 'Se aplicável: geladeiras ou freezers de medicamentos.', o: 'Qualificação de instalação, operação e desempenho dos refrigeradores e freezers.', r: [R430(40)]}],
    ['qt_embal', {g: 'qual', n: 'Qualificação térmica das embalagens de transporte de termolábeis', q: 'Se aplicável: transporte de termolábeis.', o: 'Estudo que demonstre a manutenção da faixa de temperatura nas rotas e embalagens usadas.', r: [R430('64::paragrafo::1')]}],
    ['qt_sistema', {g: 'qual', n: 'Qualificação e validação do sistema informatizado', o: 'Qualificação e validação do sistema informatizado de rastreabilidade antes do uso e após mudanças.', r: [R430(40)]}],
    pop('Treinamento de funcionários', [R430(12)]),
    pop('Higiene, saúde e vestuário do pessoal', [R430(11)]),
    pop('Gerenciamento de documentação', [R430(19)]),
    pop('Recepção e inspeção de produtos', [R430(56), A16('ii', 'd')]),
    pop('Armazenamento e segregação de produtos', [R430(42), R430(49)]),
    pop('Monitoramento de temperatura e umidade', [R430(43)]),
    pop('Expedição e conferência', [R430(59)]),
    pop('Verificação de transporte terceirizado ou do cliente', [R430('63::inciso::i')]),
    pop('Qualificação de fornecedores e clientes', [R430('18::inciso::x'), R430(6)]),
    pop('Gerenciamento de reclamações', [R430(26), R430(27)]),
    pop('Devoluções', [R430(34)]),
    pop('Recolhimento de produtos (recall)', [R430('18::inciso::vi'), R430(33)]),
    pop('Autoinspeção', [R430(37), R430(38)]),
    pop('Investigação de desvios e ações corretivas (CAPA)', [R430('18::inciso::xii'), R430('26::paragrafo::5')]),
    pop('Limpeza e sanitização das instalações', [R430(46)]),
    pop('Controle de insetos e roedores (pragas)', [R430('18::inciso::xv')]),
    pop('Manutenção preventiva e calibração de equipamentos', [R430(41), R430('43::paragrafo::4')]),
    pop('Gerenciamento de resíduos', [A16('ii', 'j')]),
    pop('Plano de contingência (falha de energia ou dos equipamentos de frio)', [R430(80)], {q: 'Se aplicável: termolábeis.'}),
    /* específicos */
    ['veic_lista', {g: 'leg', esp: 'Frota própria', n: 'Relação dos veículos, com RENAVAM e licenciamento atual', o: 'Relação e identificação dos veículos próprios ou de terceiros sob responsabilidade da empresa, com os equipamentos de manutenção das condições de transporte.', r: [A16('ii', 'm')]}],
    ['veic_pragas', {g: 'infra', esp: 'Frota própria', n: 'Certificado de controle de pragas — veículos', o: 'Certificado de controle de pragas dos veículos.', r: [R430('18::inciso::xv')]}],
  ],
  'gases-medicinais': [
    'cnpj', 'licenca',
    ['afe', {o: 'Publicação da AFE (e AE, quando aplicável) com a classe de gases medicinais distinta da de medicamentos e as atividades executadas.', r: [G887(9)]}],
    ['crt', {r: [G887(13)]}],
    'avcb', 'dcff',
    ['rt', {o: 'Responsável técnico legalmente habilitado pelo conselho de classe; farmacêutico quando houver dispensação.', r: [G887(13)]}],
    ['pcmso', {r: [], fonte: NR7}], 'pgr', ['aso', {r: [], fonte: NR7}],
    ['treinamento', {r: [G887(16)]}],
    ['pragas', {r: [G887('19::inciso::xv')]}],
    ['calibracao', {n: 'Certificados de calibração dos instrumentos de medição', r: [G887(46)]}],
    ['manutencao', {r: [G887(47)]}],
    ['manual', {n: 'Manual da qualidade (Sistema de Gestão da Qualidade)', o: 'Sistema de Gestão da Qualidade que cubra armazenagem, distribuição, transporte e dispensação.', r: [G887(18), G887(20)]}],
    ['autoinspecao', {r: [G887(42)]}],
    ['fornecedores', {r: [G887(6)]}], ['clientes', {r: [G887(6)]}],
    pop('Gerenciamento de documentação', [G887(20)]),
    pop('Recebimento e expedição', [G887(61)]),
    pop('Reclamações por desvio de qualidade', [G887(28)]),
    pop('Recolhimento', [G887(33)]),
    pop('Produtos devolvidos', [G887(37)]),
    pop('Autoinspeção', [G887(42)]),
    pop('Rastreabilidade e integridade dos registros', [G887(48)]),
    pop('Operação e manutenção dos veículos e equipamentos de transporte', [G887(71)], {q: 'Se aplicável: transporte próprio.'}),
  ],

  /* ---------------- Serviços ---------------- */
  'vacinacao': [
    'cnpj',
    ['licenca', {o: 'Licença vigente que contemple a vacinação (e a vacinação extramuros, se houver).', r: ['rdc-197-2017::artigo::4', L90]}],
    ['cnes', {r: ['rdc-197-2017::artigo::5']}],
    'avcb', 'amlurb',
    ['rt', {o: 'Responsável técnico e substituto formalmente designados pelo responsável legal.', r: ['rdc-197-2017::artigo::7']}],
    ['pcmso', {r: [R63('ii')]}], 'pgr', ['aso', {r: [R63('ii')]}],
    ['treinamento', {n: 'Registro das capacitações em vacinação', o: 'Capacitações periódicas (conservação, administração, eventos adversos, resíduos, registros, calendário), com data, horário, carga horária, conteúdo e quem ministrou.', r: ['rdc-197-2017::artigo::9', 'rdc-197-2017::artigo::9::paragrafo::unico']}],
    'reservatorio', 'pragas',
    ['calibracao', {n: 'Certificado de calibração dos termômetros das câmaras e refrigeradores de vacinas', r: ['rdc-197-2017::artigo::11::inciso::ii']}],
    'pgrss', 'pmoc', 'manutencao', 'edif_manut', 'terceiros',
    ['pops', {n: 'POPs do serviço de vacinação (conservação, transporte, administração, eventos adversos, limpeza e resíduos)', r: [R63('xviii'), 'rdc-197-2017::artigo::12']}],
  ],
  'eac-tipo1': eac(1), 'eac-tipo2': eac(2), 'eac-tipo3': eac(3),
  'estetica': [
    'cnpj',
    ['licenca', {o: 'Licença (serviço de saúde) ou CMVS (serviço de interesse da saúde) vigente, com todas as atividades (CNAE) executadas.', r: ['rdc-63-2011::artigo::10', L90]}],
    ['cnes', {q: 'Se aplicável: serviço de saúde (procedimentos por profissional de saúde).'}],
    'avcb', 'amlurb',
    ['rt', {q: 'Se aplicável: serviço de saúde.', o: 'Responsável técnico e substituto de nível superior, designados conforme os conselhos de classe.', r: ['rdc-63-2011::artigo::16', 'lei-municipal-13725-2004::artigo::92']}],
    ['habilitacao', {g: 'pes', n: 'Comprovantes de formação dos profissionais', o: 'Registro no conselho (profissionais de saúde) ou certificado de técnico em estética, esteticista ou cosmetólogo (serviço de interesse da saúde).', r: ['rdc-63-2011::artigo::17', 'lei-federal-13643-2018:a3']}],
    ['pcmso', {r: [R63('ii')]}], 'pgr', ['aso', {r: [R63('ii')]}], 'treinamento',
    'reservatorio', 'pragas', 'pgrss', 'pmoc', 'manutencao',
    ['psp', {q: 'Se aplicável: serviço de saúde.', r: ['rdc-63-2011::artigo::8']}],
    ['pgt', {q: 'Se aplicável: serviço de saúde.', r: ['rdc-anvisa-509-2021:a5']}],
    ['terceiros', {o: 'Contratos dos serviços terceirizados (inclusive processamento externo de materiais), com empresas regularizadas.'}],
    ['pops', {n: 'POPs dos procedimentos, da limpeza e desinfecção, do processamento de instrumentais e do uso de EPIs', r: [R63('xviii'), 'lei-federal-13643-2018:a8']}],
    pop('Atendimento a emergências', ['rdc-63-2011::artigo::51'], {q: 'Se aplicável: serviço de saúde.'})
  ],
  'academia-piscina': [
    ['cnpj', {r: [P1101('14-2')]}],
    'licenca', 'avcb',
    ['rt', {n: 'Responsável técnico (CREF) ou técnico credenciado pela federação', o: 'Profissional de educação física habilitado ou técnico credenciado pela federação, responsável pela supervisão.', r: ['lei-municipal-sp-11383-1993::artigo::1', P1101('12-1')]}],
    ['operador', {g: 'pes', n: 'Certificado do curso de operador de piscinas', q: 'Se aplicável: piscina.', o: 'Certificado de quem mantém e supervisiona a qualidade da água.', r: [P1101('12-2'), P1101('14-2-1')]}],
    ['atualizacao', {g: 'pes', n: 'Comprovantes de atualização profissional dos funcionários', o: 'Documentos de participação em atividades de atualização profissional.', r: [P1101('14-2')]}],
    ['dea', {g: 'pes', n: 'Comprovantes de capacitação no uso do desfibrilador (DEA)', q: 'Se aplicável: estabelecimento obrigado a manter DEA (Lei 13.945/2005).', o: 'Certificados do curso, conforme as recomendações do Conselho Nacional de Ressuscitação.', r: ['lei-municipal-sp-13945-2005::artigo::1']}],
    ['reservatorio', {r: [P1101('9-3'), P1101('9-4')]}],
    ['pragas', {r: [P1101('10-2')]}],
    pop('Higienização das instalações, equipamentos, móveis e utensílios', [P1101('14-3')]),
    pop('Limpeza e desinfecção do reservatório de água', [P1101('14-3')]),
    pop('Tratamento e controle da qualidade da água da piscina', [P1101('14-4')], {q: 'Se aplicável: piscina.'}),
    pop('Higienização do tanque em caso de acidentes (vômito, fezes, sangue)', [P1101('14-4')], {q: 'Se aplicável: piscina.'}),
    pop('Higienização de banheiras e saunas', [P1101('7-12')], {q: 'Se aplicável: banheiras ou saunas.'}),
    ['pops_ciencia', {r: [P1101('14-2')]}],
    ['agua_alt', {g: 'reg', n: 'Laudos de potabilidade da água de solução alternativa', q: 'Se aplicável: poço, caminhão-pipa ou outra solução alternativa.', o: 'Comprovantes de tratamento e controle da potabilidade e laudos dos fornecedores, arquivados por no mínimo 6 meses.', r: [P1101('14-2-1')]}]
  ],
  'transporte-biologico': [
    'cnpj',
    ['licenca', {o: 'Licença vigente que contemple o transporte de material biológico humano.', r: ['rdc-504-2021::artigo::7::paragrafo::1', L90]}],
    'avcb',
    ['supervisor', {g: 'pes', n: 'Designação do supervisor técnico', o: 'Profissional capacitado e designado para implantar, executar e monitorar os processos de transporte.', r: ['rdc-504-2021::artigo::7::paragrafo::2']}],
    'pcmso', 'pgr', 'aso',
    ['treinamento', {o: 'Registros atualizados do treinamento específico do pessoal de cada etapa do transporte.', r: ['rdc-504-2021::artigo::9', 'rdc-504-2021::artigo::39']}],
    ['contrato', {g: 'sgq', n: 'Contrato (instrumento escrito) com cada remetente', o: 'Responsabilidades de cada parte: documentação de expedição, biossegurança, conservação, tempo de transporte, treinamento e documentos à disposição da vigilância.', r: ['rdc-504-2021::artigo::7', 'rdc-504-2021::artigo::26', 'rdc-504-2021::artigo::8::paragrafo::unico']}],
    ['validacao', {g: 'qual', n: 'Validação do acondicionamento', o: 'Relatório de validação da etapa de acondicionamento, por tipo de material e finalidade do transporte.', r: ['rdc-504-2021::artigo::11']}],
    pop('Instruções escritas das operações de transporte', ['rdc-504-2021::artigo::5'], {o: 'Instruções escritas e padronizadas, disponíveis a todo o pessoal e revisadas anualmente ou quando o procedimento mudar.'}),
  ],
  'imagem-convencional': imagem('convencional'), 'imagem-mamografia': imagem('mamografia'), 'imagem-tomografia': imagem('tomografia'),
  'imagem-ressonancia': imagem('ressonancia'), 'imagem-ultrassom': imagem('ultrassom'), 'imagem-hemodinamica': imagem('hemodinamica'),
  'odontologia': [
    'cnpj',
    ['licenca', {r: [O1002('a8'), L90]}],
    'cnes', 'avcb', 'amlurb',
    ['rt', {o: 'Cirurgião-dentista responsável técnico designado pelo responsável legal; alteração de RT ou substituto comunicada à vigilância.', r: [O1002('a5'), O1002('a7')]}],
    ['pcmso', {r: [R63('ii')]}], 'pgr', ['aso', {r: [R63('ii')]}],
    ['treinamento', {o: 'Registros da capacitação admissional e periódica sobre as rotinas, protocolos e POPs.', r: [O1002('a114')]}],
    'reservatorio', 'pragas',
    ['pgrss', {r: [O1002('a122'), 'rdc-222-2018::artigo::5']}],
    'pmoc',
    ['manutencao', {o: 'Manutenções preventivas e corretivas comprovadas por laudo, ordem de serviço ou registro do prestador.', r: [O1002('a130')]}],
    ['radiometrico', {g: 'infra', n: 'Laudo de levantamento radiométrico', q: 'Se aplicável: raios X sem distância de 2 m do operador nem disparador fora da sala.', o: 'Laudo que indique a posição da equipe em área livre.', r: [O1002('a15p1')]}],
    ['sdbpf', {g: 'sgq', n: 'Série de Documentos de Boas Práticas de Funcionamento (SDBPF)', o: 'Rotinas, protocolos, POPs e planos do serviço, elaborados pelo RT e adequados à assistência prestada.', r: [O1002('a110'), O1002('a112'), O1002('a113')]}],
    ['psp', {r: [O1002('a118')]}], 'pgt',
    ['processadora', {g: 'sgq', n: 'Contrato com a empresa processadora', q: 'Se aplicável: processamento terceirizado.', o: 'Contrato com empresa processadora licenciada e o POP de preparo prévio definido em conjunto.', r: [O1002('a105'), O1002('a105pu'), O1002('a106p1')]}],
    pop('Processamento dos dispositivos médicos (cada etapa)', [O1002('a57'), O1002('a82')]),
    pop('Protocolo de urgências e emergências', [O1002('a116')]),
    pop('Protocolo de acidente com material biológico', [O1002('a115')])
  ],

  /* ---------------- Alimentos ---------------- */
  'servicos-alimentacao-roteiro': [
    'cnpj', 'licenca', 'avcb',
    ['rt', {n: 'Responsável técnico ou certificado do curso de Boas Práticas do responsável', o: 'Responsável técnico legalmente habilitado ou, nas empresas dispensadas, proprietário ou designado com certificado de curso de Boas Práticas de Manipulação.', r: [P2619('n16.1'), P2619('n16.1.4b')]}],
    ['pcmso', {r: [P2619('n17.2')]}],
    'pgr',
    ['aso', {n: 'Atestados de saúde dos manipuladores', r: [P2619('n17.2')]}],
    ['treinamento', {n: 'Programa e comprovantes de capacitação dos manipuladores', r: [P2619('n15.37'), P2619('n15.38')]}],
    ['reservatorio', {r: [P2619('n11.5'), P2619('n17.2')]}],
    ['pragas', {r: [P2619('n12.4.2')]}],
    ['manual', {o: 'Manual que descreva as operações reais do estabelecimento, atualizado e disponível.', r: [P2619('n16.2')]}],
    ['auditoria', {g: 'sgq', n: 'Auditorias internas de Boas Práticas', o: 'Auditorias periódicas com lista de verificação e planos de ação com prazos e responsáveis.', r: [P2619('n14.2')]}],
    ['recolhimento', {g: 'sgq', n: 'Programa de recolhimento de alimentos', q: 'Se aplicável: indústria ou produtos com marca própria.', o: 'Programa para suspeita ou constatação de alimento que possa causar dano à saúde.', r: [P2619('n14.7')]}],
    pop('Higienização das instalações, equipamentos, móveis e utensílios', [P2619('n14.10')]),
    pop('Capacitação, higiene e saúde dos manipuladores', [P2619('n14.10')]),
    pop('Controle integrado de vetores e pragas urbanas', [P2619('n14.10')]),
    pop('Higienização do reservatório de água', [P2619('n14.10')]),
    pop('Controle da potabilidade da água de fonte alternativa', [P2619('n14.10')], {q: 'Se aplicável: fonte alternativa de água.'})
  ],

  /* ---------------- Produtos ---------------- */
  'produtos-correlatos': {modalidades: {
    fabricante: {nome: 'Fabricante de cosméticos', lista: [
      ['cnpj', {r: [F16('i', 'b')]}], ['contrato_social', {r: [F16('i', 'a')]}], 'licenca', ['afe'],
      ['avcb', {r: [F16('i', 'c')].concat(BOMB)}],
      ['crt', {r: [F16('i', 'e')]}],
      ['rt', {r: ['lei-municipal-13725-2004::artigo::93'], o: 'Responsável técnico legalmente habilitado, presente durante o funcionamento.'}],
      ['organograma', {g: 'pes', n: 'Organograma e definição de cargos', o: 'Organograma e definição dos cargos, responsabilidades e qualificação necessária.', r: [F16('i', 'd')]}],
      ['pcmso', {r: [C48('n5.2')]}], 'pgr', ['aso', {r: [C48('n5.2')]}],
      ['treinamento', {n: 'Programa escrito de treinamento e registros', r: [C48('n11.3')]}],
      ['pragas', {r: [C48('n12.8')]}],
      ['manual', {n: 'Documentação de Boas Práticas de Fabricação', o: 'Documentação elaborada, aprovada, atualizada e distribuída com controle de emissão e revisão.', r: [C48('n10.4')]}],
      ['autoinspecao', {r: [C48('n9.2'), C48('n9.4')]}],
      ['fornecedores', {r: [C48('n3.3.5')]}],
      ['terceiros', {r: [F16('i', 'f')]}],
      ['agua', {g: 'reg', n: 'Laudos do monitoramento da qualidade da água', o: 'Procedimentos e registros do monitoramento periódico nos pontos críticos.', r: [C48('n13.6')]}],
      pop('POPs de recebimento, amostragem, lote, ensaios, limpeza, armazenamento, calibração e manutenção', [C48('n10.11'), F16('ii', 'h')]),
      pop('Reclamações e recolhimento', [C48('n6.1'), C48('n7.3')])
    ]},
    distribuidor: {nome: 'Atacadista / distribuidor', lista: [
      ['cnpj', {r: [A16('i', 'b')]}], ['contrato_social', {r: [A16('i', 'a')]}], 'licenca', 'afe',
      ['avcb', {r: [A16('i', 'c')].concat(BOMB)}],
      'crt',
      ['rt', {r: ['lei-municipal-13725-2004::artigo::93'], o: 'Responsável técnico legalmente habilitado, presente durante o funcionamento.'}],
      'pcmso', 'pgr', 'aso',
      ['treinamento', {r: [A16('ii', 'b')]}],
      ['pragas', {r: [D665('a74')]}],
      ['calibracao', {r: [A16('ii', 'a')]}],
      ['pgrss', {n: 'Plano de gerenciamento de resíduos', o: 'Plano de gerenciamento dos resíduos (produtos vencidos, avariados e embalagens), com destinação e contratos.', r: [A16('ii', 'j')]}],
      ['manual', {n: 'Manual de Boas Práticas de Distribuição e Armazenagem', q: 'Se aplicável: produtos para saúde (dispositivos médicos e IVD).', r: [A16('i', 'f')]}],
      ['manual_q', {g: 'sgq', n: 'Manual da qualidade (dispositivos médicos)', q: 'Se aplicável: dispositivos médicos ou IVD.', o: 'Política da qualidade descrita em manual, com sistema de qualidade e procedimentos próprios.', r: [D665('a4'), D665('a5')]}],
      ['autoinspecao', {r: [A16('ii', 'e')]}],
      ['fornecedores', {r: [A16('ii', 'l')]}], ['clientes', {r: [A16('ii', 'l')]}],
      ['terceiros', {r: [A16('i', 'd')]}],
      pop('Recepção, identificação, controle de estoque e armazenamento (acabados, devolvidos e recolhidos)', [A16('ii', 'd')])
    ]},
    transportadora: {nome: 'Transportador', lista: [
      ['cnpj', {r: [A16('i', 'b')]}], ['contrato_social', {r: [A16('i', 'a')]}], 'licenca',
      ['afe', {o: 'Publicação da AFE para transporte, ou enquadramento comprovado na dispensa para transportador.', r: ['rdc-16-2014::artigo::3', 'rdc-16-2014::artigo::5::inciso::vi']}],
      'crt', 'avcb', 'pcmso', 'pgr', 'aso',
      ['treinamento', {r: [A16('ii', 'b')]}],
      ['calibracao', {r: [A16('ii', 'a')]}],
      ['autoinspecao', {r: [A16('ii', 'e')]}],
      ['terceiros', {r: [A16('i', 'd')]}],
      ['veiculos', {g: 'leg', n: 'Relação dos veículos, com RENAVAM e licenciamento atual', o: 'Relação e identificação dos veículos próprios ou de terceiros, com os equipamentos de manutenção das condições de transporte.', r: [A16('ii', 'm')]}],
      pop('Recepção, conservação da carga, segregação e controle em trânsito', [A16('ii', 'd')])
    ]}
  }}
};

/* EAC: comum aos três tipos, com o que é próprio do Tipo III */
function eac(tipo) {
  const l = [
    'cnpj',
    ['licenca', {o: 'Alvará de licenciamento indicando as atividades de EAC' + (tipo === 1 ? ' (na farmácia ou consultório isolado, além das atividades principais).' : '.'), r: [R978(73), L90]}],
    ['cnes', {r: [R978(74)]}],
    'avcb', 'amlurb',
    ['rt', {o: 'Responsável técnico legalmente habilitado e substituto; supervisor do pessoal técnico presente durante o funcionamento.', r: [R978(75), R978(122)]}],
    ['organograma', {g: 'pes', n: 'Estrutura organizacional documentada (organograma)', o: 'Organograma e descrição das responsabilidades.', r: [R978(76)]}],
    ['equipe', {g: 'pes', n: 'Relação nominal da equipe, com atribuições, qualificação e carga horária', o: 'Relação de toda a equipe e registros de formação e qualificação.', r: [R978('117::inciso::iv'), R978(123)]}],
    ['pcmso', {r: [R63('ii')]}], 'pgr', ['aso', {r: [R63('ii')]}],
    ['pep', {g: 'pes', n: 'Programa de Educação Permanente e registros', o: 'Programa para toda a equipe e registros de sua execução.', r: [R978(124), R978('117::inciso::v')]}],
    'reservatorio', 'pragas',
    ['calibracao', {n: 'Certificados de calibração dos equipamentos', o: 'Calibração na frequência do fabricante ou, na falta, anual, com procedimento documentado.', r: [R978(94)]}],
    ['pgrss', {r: [R978(111), 'rdc-222-2018::artigo::5']}],
    'pmoc',
    ['manutencao', {o: 'Registros da manutenção preventiva e corretiva e das verificações dos equipamentos.', r: [R978(92), R978(93)]}],
    'edif_manut',
    ['pgq', {g: 'sgq', n: 'Programa de Garantia da Qualidade (PGQ)', o: 'PGQ com os componentes mínimos e indicadores de desempenho monitorados pelo RT.', r: [R978(84), R978(86), R978(87)]}],
    pop('Instruções de biossegurança (EPI, EPC, acidentes e transporte de material)', [R978(110)]),
    pop('Limpeza, desinfecção e esterilização', [R978(112)]),
    pop('Registro e liberação de resultados e assinatura de laudos', [R978(119), R978(165)]),
    pop('Instruções de uso dos equipamentos em português', [R978(99)]),
    pop('Controle interno da qualidade', [R978(174)]),
    ['ceq', {g: 'reg', n: 'Relatórios de controle externo da qualidade (CEQ) e registros do controle interno', o: 'Relatórios do ensaio de proficiência/CEQ (no mínimo anuais) ou da forma alternativa, e registros do controle interno.', r: [R978('117::inciso::vi'), R978(185)]}]
  ];
  if (tipo === 3) l.push(
    'dcff',
    ['apoio', {g: 'sgq', n: 'Contratos com laboratórios de apoio', q: 'Se aplicável: envio de exames a laboratório de apoio ou prestação desse serviço.', o: 'Contrato escrito com responsabilidades, auditoria, rastreabilidade e comunicação de desvios.', r: [R978(37), R978(82)]}]
  );
  else l.push(['terceiros', {o: 'Contratos dos serviços terceirizados, inclusive com o laboratório da fase analítica, quando houver.', r: [R978(82), 'rdc-63-2011::artigo::11']}]);
  return l;
}
/* Diagnóstico por imagem: RDC 611/2022 e as IN específicas */
function imagem(m) {
  const ion = m !== 'ressonancia' && m !== 'ultrassom';
  const l = [
    'cnpj', 'licenca', 'cnes', 'avcb', 'amlurb',
    ['rt', {o: 'Designação formal, pelo responsável legal, do responsável técnico de cada setor e do substituto.', r: [R611(13)]}],
    ['pcmso', {r: [R63('ii')]}], 'pgr', ['aso', {r: [R63('ii')]}],
    ['pep', {g: 'pes', n: 'Registros do Programa de Educação Permanente', o: 'Registros dos treinamentos, no conteúdo e na periodicidade mínimos.', r: [R611(15)]}],
    'reservatorio', 'pragas',
    ['calibracao', {n: 'Certificados de calibração dos instrumentos de avaliação dos equipamentos', o: 'Calibração por laboratório credenciado.', r: [R611(30)]}],
    'pgrss', 'pmoc',
    ['manutencao', {r: [R63('ix'), R611('28::paragrafo::unico')]}],
    ['programas', {g: 'sgq', n: 'Programa de Garantia da Qualidade' + (ion ? ' e Programa de Proteção Radiológica' : ''), o: 'Programas implementados, com medidas de prevenção, controle, vigilância e monitoramento.', r: [R611(5)].concat(ion ? [R611(42)] : [])}],
    ['comite', {g: 'sgq', n: 'Atas do Comitê de Gerenciamento de Riscos em Radiologia', q: 'Se aplicável: exigido pelo porte do serviço.', o: 'Constituição do comitê e registros da revisão sistemática dos programas.', r: [R611(39)]}],
    'terceiros',
    pop('Normas, rotinas, protocolos e procedimentos de todas as atividades', [R611(38)]),
    ['testes', {g: 'reg', n: 'Relatórios dos testes de aceitação e de constância', o: 'Relatórios conforme a IN da modalidade e protocolos oficiais.', r: [R611('28::paragrafo::unico'), R611(29)]}]
  ];
  if (m !== 'ultrassom') l.push(['blindagem', {g: 'infra', n: 'Projeto de blindagem aprovado', o: 'Projeto elaborado e assinado por profissional habilitado, aprovado e assinado pelo responsável legal, com a aprovação da vigilância' + (m === 'ressonancia' ? '; na RM, com blindagem eletromagnética, isolamento acústico, evacuação de gases e laudo de compatibilidade eletromagnética.' : '.'), r: [R611(7), R611(8)].concat(m === 'ressonancia' ? ['in-97-2021::artigo::4'] : [])}]);
  if (ion) l.push(
    ['spr', {g: 'pes', n: 'Designação do supervisor de proteção radiológica e do substituto', o: 'Membros legalmente habilitados da equipe, formalmente designados.', r: [R611(14)]}],
    ['levantamento', {g: 'reg', n: 'Laudo de levantamento radiométrico', o: 'Laudo com croqui, equipamentos, pontos medidos e conclusões, refeito após mudança na instalação ou nos equipamentos.', r: [R611(63)]}]
  );
  if (m === 'mamografia') l.push(['pnqm', {g: 'sgq', n: 'Comprovante de participação no PNQM', o: 'Participação no Programa Nacional de Qualidade em Mamografia.', r: ['portaria-de-consolidacao-ms-5-2017::artigo::216']}]);
  if (m === 'hemodinamica') l.push(
    ['epi_laudo', {g: 'reg', n: 'Laudos semestrais de integridade dos EPI plumbíferos', o: 'Laudo técnico semestral dos aventais e demais EPI, com resultados e imagens.', r: ['in-91-2021::artigo::9']}],
    ['psp', {n: 'Núcleo e Plano de Segurança do Paciente', o: 'Ato de constituição do NSP e Plano de Segurança do Paciente que alcance a hemodinâmica.'}]
  );
  return l;
}

module.exports = {VERSAO, GRUPOS, DOCS, APPS};
