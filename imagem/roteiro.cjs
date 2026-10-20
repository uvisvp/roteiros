/* Diagnóstico por imagem — núcleo Serviços (pedido de 19/10/2026): um card que abre seis roteiros,
   um por modalidade, todos sobre a RDC Anvisa nº 611/2022 (organização e funcionamento dos
   serviços de radiologia diagnóstica ou intervencionista) e a Instrução Normativa própria:
   - radiologia convencional: IN Anvisa nº 90/2021;
   - mamografia: IN Anvisa nº 92/2021 e Programa Nacional de Qualidade em Mamografia
     (Portaria de Consolidação GM/MS nº 5/2017, arts. 206 a 224);
   - tomografia computadorizada: IN Anvisa nº 93/2021;
   - ressonância magnética: IN Anvisa nº 97/2021;
   - ultrassonografia diagnóstica e terapêutica: IN Anvisa nº 96/2021;
   - hemodinâmica (fluoroscopia e radiologia intervencionista): IN Anvisa nº 91/2021 e RDC Anvisa
     nº 36/2013 (segurança do paciente).
   A seção de proteção radiológica e as proibições do uso de raios X só entram nas modalidades
   com radiação ionizante. Perguntas com m:[…] só entram nessas modalidades; sem m, nas seis.
   Textos de RDC e IN do AnvisaLegis (banco legislacao_v12). Toda irregularidade cita a Lei
   Municipal nº 13.725/2004 (serviço de saúde: arts. 42, 63 a 66, 68, 90 e 92, conforme o assunto). */
'use strict';
const R = (art, ...resto) => 'rdc-611-2022::artigo::' + art + (resto.length ? '::' + resto.join('::') : '');
const RI = (art, inc) => R(art, 'inciso', inc);
const RP = (art, par) => R(art, 'paragrafo', par);
const N = n => (art, ...resto) => 'in-' + n + '-2021::artigo::' + art + (resto.length ? '::' + resto.join('::') : '');
const N90 = N(90), N91 = N(91), N92 = N(92), N93 = N(93), N96 = N(96), N97 = N(97);
const R36 = (art, ...resto) => 'rdc-36-2013::artigo::' + art + (resto.length ? '::' + resto.join('::') : '');
const PRC = (art, ...resto) => 'portaria-de-consolidacao-ms-5-2017::artigo::' + art + (resto.length ? '::' + resto.join('::') : '');
const LM = (art, ...resto) => 'lei-municipal-13725-2004::artigo::' + art + (resto.length ? '::' + resto.join('::') : '');
const SN = [['sim', 'Sim'], ['nao', 'Não']];
const NAO = campo => ({campo, igual: 'nao'});
const SIM = campo => ({campo, igual: 'sim'});
const NAO_FUNC = 'O serviço ainda não está em funcionamento.';
const ION = ['conv', 'mamo', 'tc', 'hemo'];

const MOD = {
  conv: {app: 'imagem-convencional', titulo: 'Radiologia convencional', curto: 'Radiologia_Convencional', inN: 'IN Anvisa nº 90/2021', desc: 'radiografia médica convencional',
    tipos: ['Raios X fixo', 'Raios X móvel', 'Sistema de radiografia digital (DR)', 'Digitalizador (CR)', 'Processadora de filmes', 'Monitor de laudo', 'Outro']},
  mamo: {app: 'imagem-mamografia', titulo: 'Mamografia', curto: 'Mamografia', inN: 'IN Anvisa nº 92/2021', desc: 'mamografia',
    tipos: ['Mamógrafo', 'Mamógrafo com tomossíntese', 'Digitalizador (CR)', 'Monitor de laudo para mamografia', 'Processadora exclusiva de mamografia', 'Outro']},
  tc: {app: 'imagem-tomografia', titulo: 'Tomografia computadorizada', curto: 'Tomografia', inN: 'IN Anvisa nº 93/2021', desc: 'tomografia computadorizada médica',
    tipos: ['Tomógrafo', 'Bomba injetora de contraste', 'Monitor de laudo', 'Outro']},
  rm: {app: 'imagem-ressonancia', titulo: 'Ressonância magnética', curto: 'Ressonancia', inN: 'IN Anvisa nº 97/2021', desc: 'ressonância magnética nuclear',
    tipos: ['Equipamento de ressonância magnética', 'Detector de metais', 'Bomba injetora compatível com RM', 'Monitor de sinais vitais compatível com RM', 'Monitor de laudo', 'Outro']},
  us: {app: 'imagem-ultrassom', titulo: 'Ultrassonografia', curto: 'Ultrassonografia', inN: 'IN Anvisa nº 96/2021', desc: 'ultrassom diagnóstico ou terapêutico',
    tipos: ['Ultrassom diagnóstico', 'Ultrassom terapêutico', 'Transdutor', 'Outro']},
  hemo: {app: 'imagem-hemodinamica', titulo: 'Hemodinâmica e radiologia intervencionista', curto: 'Hemodinamica', inN: 'IN Anvisa nº 91/2021', desc: 'fluoroscopia e radiologia intervencionista',
    tipos: ['Angiógrafo fixo', 'Arco cirúrgico (arco em C)', 'Fluoroscópio', 'Bomba injetora de contraste', 'Monitor de laudo', 'Outro']}
};

/* identificação */
function dados(m) {
  return [
    {id: 'razao', rotulo: 'Razão social / mantenedora'}, {id: 'fantasia', rotulo: 'Nome fantasia / unidade'},
    {id: 'cnpj', rotulo: 'CNPJ', tipo: 'cnpj'}, {id: 'endereco', rotulo: 'Endereço', largo: true},
    {id: 'licenca', rotulo: 'Licença sanitária (CEVS) nº'}, {id: 'cnes', rotulo: 'CNES'},
    {id: 'rl', rotulo: 'Responsável legal'}, {id: 'rt', rotulo: 'Responsável técnico do setor (nome e registro)'},
    {id: 'rt_subst', rotulo: 'Substituto do responsável técnico (nome e registro)'},
    ION.includes(m) ? {id: 'spr', rotulo: 'Supervisor de proteção radiológica (nome e registro)'} : null,
    {id: 'horario', rotulo: 'Horário de funcionamento', largo: true},
    {id: 'acompanhou', rotulo: 'Acompanhou a inspeção'},
    {id: 'data', rotulo: 'Data da inspeção', tipo: 'date'}, {id: 'equipe', rotulo: 'Equipe de inspeção', largo: true}
  ].filter(Boolean);
}
function perfil(m) {
  return [
    {id: 'p_nivel', rotulo: 'Nível de atenção do serviço', tipo: 'select', opcoes: [['primaria', 'Atenção primária'], ['sec', 'Atenção secundária ou terciária (ambulatório especializado ou hospital)']], rel: false},
    {id: 'p_laudo', rotulo: 'O serviço emite laudos no próprio local?', tipo: 'select', opcoes: SN, desc: {sim: 'emissão de laudos no local'}},
    {id: 'p_digital', rotulo: 'Tem sistema de armazenamento das imagens digitais (PACS ou similar)?', tipo: 'select', opcoes: SN, desc: {sim: 'armazenamento digital das imagens'}},
    {id: 'p_tele', rotulo: 'Usa telerradiologia ou comando remoto de equipamento?', tipo: 'select', opcoes: SN, desc: {sim: 'telerradiologia'}},
    {id: 'p_itin', rotulo: 'Mantém serviço itinerante (unidade móvel)?', tipo: 'select', opcoes: SN, desc: {sim: 'serviço itinerante'}},
    m === 'tc' ? {id: 'p_pediatria', rotulo: 'Atende pacientes pediátricos?', tipo: 'select', opcoes: SN, desc: {sim: 'atendimento pediátrico'}} : null,
    m === 'us' ? {id: 'p_terap', rotulo: 'Usa ultrassom terapêutico?', tipo: 'select', opcoes: SN, desc: {sim: 'ultrassom terapêutico'}} : null,
    m === 'us' ? {id: 'p_diag', rotulo: 'Usa ultrassom diagnóstico?', tipo: 'select', opcoes: SN, desc: {sim: 'ultrassom diagnóstico'}} : null,
    ['tc', 'rm', 'hemo'].includes(m) ? {id: 'p_contraste', rotulo: 'Usa meio de contraste?', tipo: 'select', opcoes: SN, desc: {sim: 'uso de meio de contraste'}} : null,
    m === 'rm' ? {id: 'p_cripo', rotulo: 'O equipamento usa líquido criogênico (hélio)?', tipo: 'select', opcoes: SN, desc: {sim: 'magneto com líquido criogênico'}} : null,
    m === 'conv' ? {id: 'p_filme', rotulo: 'Usa filme radiográfico com processadora?', tipo: 'select', opcoes: SN, desc: {sim: 'filme radiográfico com processamento'}} : null
  ].filter(Boolean);
}

/* ——— base comum: RDC 611/2022 ——— */
const ORG = [
  {id: 'lic', t: 'O serviço possui licença sanitária vigente que contempla a modalidade?', r: [LM(90)],
    c: 'O serviço possui licença sanitária vigente que contempla a modalidade.', nc: 'O serviço funciona sem licença sanitária que contemple a modalidade.',
    na: 'Trata-se de licença inicial; a licença sanitária ainda não foi emitida.', inf: ['im_lic']},
  {id: 'rt', t: 'O responsável legal designou formalmente o responsável técnico do setor e o substituto, com as atividades delegadas definidas?', r: [R(13), RP(13, '2'), RP(13, '3')],
    c: 'O responsável técnico do setor e o substituto foram designados formalmente, com as atividades delegadas definidas.',
    nc: 'O responsável técnico do setor e o substituto não foram designados formalmente.',
    pontos: [['rt', 'responsável técnico designado formalmente', 'Não há designação formal do responsável técnico do setor.'], ['subst', 'substituto designado formalmente', 'Não há designação formal do substituto do responsável técnico.'], ['ativ', 'atividades delegadas definidas no ato de designação', 'O ato de designação não define as atividades delegadas.']],
    na: NAO_FUNC, inf: ['im_rt']},
  {id: 'spr', m: ION, t: 'Há supervisor de proteção radiológica designado formalmente, com substituto, membro legalmente habilitado da equipe?', r: [R(14), RP(14, '3'), RP(14, '4')],
    c: 'Há supervisor de proteção radiológica e substituto designados formalmente.', nc: 'Não há supervisor de proteção radiológica designado formalmente, com substituto.',
    na: NAO_FUNC, inf: ['im_spr']},
  {id: 'programas', t: 'O serviço implementou os programas obrigatórios?', r: [R(5)],
    c: 'O serviço implementou os programas obrigatórios.', nc: 'O serviço não implementou os programas obrigatórios.', ncPontos: 'O serviço não implementou: {}.',
    pontos: [['pgq', 'Programa de Garantia da Qualidade'], ['pep', 'Programa de Educação Permanente'], ['ppr', 'Programa de Proteção Radiológica (radiação ionizante)']],
    na: NAO_FUNC, inf: ['im_programas']},
  {id: 'documentos', t: 'Os documentos exigidos estão atualizados e disponíveis?', r: [R(17), R(16)],
    c: 'Os documentos exigidos estão atualizados e disponíveis.', nc: 'Os documentos exigidos não estão atualizados e disponíveis.', ncPontos: 'Não estão atualizados e disponíveis: {}.',
    pontos: [['pba', 'Projeto Básico de Arquitetura e memorial descritivo aprovados'], ['registros', 'relação e registros dos procedimentos, normas, rotinas e protocolos'], ['inventario', 'inventário dos produtos com a comprovação de regularização na Anvisa'], ['equipe', 'relação nominal da equipe, com atribuições, qualificações e carga horária'], ['assent', 'assentamentos dos Programas de Educação Permanente, Garantia da Qualidade e Proteção Radiológica']],
    na: NAO_FUNC, inf: ['im_docs']},
  {id: 'blindagem', m: ['conv', 'mamo', 'tc', 'rm', 'hemo'], t: 'O projeto de blindagem, assinado por profissional habilitado, foi aprovado pela vigilância sanitária?', r: [R(7), R(8)],
    c: 'O projeto de blindagem, assinado por profissional habilitado, foi aprovado pela vigilância sanitária.', nc: 'O serviço não tem projeto de blindagem aprovado pela vigilância sanitária.',
    na: 'O serviço dispõe apenas de equipamentos móveis, dispensados da aprovação do projeto de blindagem.', inf: ['im_projeto']},
  {id: 'modificacao', t: 'Toda modificação nas instalações, troca ou inclusão de equipamento foi aprovada pela autoridade sanitária antes de feita?', r: [R(10), R(11)],
    c: 'As modificações nas instalações e nos equipamentos foram aprovadas pela autoridade sanitária antes de feitas.', nc: 'Houve modificação nas instalações ou nos equipamentos sem aprovação prévia da autoridade sanitária.',
    na: 'Não houve modificação nas instalações nem nos equipamentos desde a última aprovação.', inf: ['im_projeto']}
];
const PESSOAL = [
  {id: 'equipe', t: 'A equipe multiprofissional é dimensionada de acordo com o perfil de demanda?', r: [R(12)],
    c: 'A equipe multiprofissional é dimensionada de acordo com o perfil de demanda.', nc: 'A equipe não é dimensionada de acordo com o perfil de demanda.',
    na: NAO_FUNC, inf: ['im_equipe']},
  {id: 'habilitado', t: 'Os procedimentos e a operação dos equipamentos são feitos por profissionais legalmente habilitados (ou em treinamento sob supervisão)?', r: [R(34), R(78)],
    c: 'Os procedimentos e a operação dos equipamentos são feitos por profissionais legalmente habilitados.', nc: 'Foram constatados procedimentos ou operação de equipamento por profissional não habilitado.',
    na: 'Não havia procedimento em andamento durante a inspeção.', inf: ['im_equipe']},
  {id: 'pep', t: 'O Programa de Educação Permanente atende ao mínimo exigido, com registro?', r: [R(15), RP(15, '1'), RP(15, '2'), RP(15, '3')],
    c: 'O Programa de Educação Permanente atende ao mínimo exigido, com registro das capacitações.', nc: 'O Programa de Educação Permanente não atende ao mínimo exigido.',
    pontos: [['anual', 'capacitação inicial e periódica, no mínimo anual', 'Não há capacitação inicial e periódica, no mínimo anual.'], ['novos', 'capacitação antes de novos processos, tecnologias ou pessoas', 'Não há capacitação antes de novos processos, tecnologias ou pessoas.'], ['eficacia', 'avaliação da eficácia das capacitações', 'A eficácia das capacitações não é avaliada.'], ['temas', 'temas mínimos (POPs, segurança do paciente, riscos, PGQ, proteção radiológica)', 'As capacitações não cobrem os temas mínimos exigidos.'], ['registro', 'registro com data, carga horária, conteúdo, instrutor e participantes', 'As capacitações não são registradas com os dados exigidos.']],
    na: NAO_FUNC, inf: ['im_pep']},
  {id: 'menor', m: ION, t: 'Todos os que trabalham com raios X no serviço têm 18 anos ou mais?', r: [R(47)],
    c: 'Todos os que trabalham com raios X no serviço têm 18 anos ou mais.', nc: 'Foi constatado menor de 18 anos trabalhando com raios X.',
    na: NAO_FUNC, inf: ['im_ocupacional']},
  {id: 'gestante', m: ION, t: 'Há procedimento para a trabalhadora gestante notificar a gravidez e ter as condições de trabalho revistas?', r: [R(46)],
    c: 'Há procedimento para notificação da gravidez e revisão das condições de trabalho da gestante.', nc: 'Não há procedimento para notificação da gravidez e revisão das condições de trabalho da gestante.',
    na: NAO_FUNC, inf: ['im_ocupacional']}
];
const QUALIDADE = [
  {id: 'regularizados', t: 'Os equipamentos e demais produtos estão regularizados na Anvisa e são usados conforme as instruções do fabricante e para o fim a que se destinam?', r: [R(25), RP(25, 'unico'), R(26)],
    c: 'Os equipamentos e produtos estão regularizados na Anvisa e são usados conforme as instruções do fabricante.', nc: 'Foram constatados equipamentos ou produtos sem regularização na Anvisa ou usados fora das instruções do fabricante.',
    na: NAO_FUNC, inf: ['im_produtos']},
  {id: 'tecnologias', t: 'Há gerenciamento das tecnologias (seleção, recebimento, instalação, uso, manutenção preventiva e corretiva, descarte)?', r: [R(27), RP(28, 'unico')],
    c: 'Há gerenciamento das tecnologias, com manutenções preventivas e corretivas.', nc: 'Não há gerenciamento das tecnologias com manutenções preventivas e corretivas.',
    na: NAO_FUNC, inf: ['im_testes']},
  {id: 'testes', t: 'Os testes de aceitação e de constância são feitos por protocolo oficial, nas periodicidades da IN da modalidade e do fabricante, com registro?', r: [R(28), R(29), R(31)],
    c: 'Os testes de aceitação e de constância são feitos por protocolo oficial, nas periodicidades exigidas, com registro.', nc: 'Os testes de aceitação e de constância não são feitos nas periodicidades exigidas.',
    pontos: [['aceitacao', 'teste de aceitação de cada equipamento', 'Não há teste de aceitação de todos os equipamentos.'], ['constancia', 'testes de constância nas periodicidades exigidas', 'Os testes de constância não são feitos nas periodicidades exigidas.'], ['ajuste', 'testes após ajuste ou reparo', 'Não são feitos testes após ajuste ou reparo do equipamento.'], ['imagem', 'padrões de qualidade de imagem estabelecidos', 'Não há padrões de qualidade de imagem estabelecidos.']],
    na: NAO_FUNC, inf: ['im_testes']},
  {id: 'calibracao', t: 'Os instrumentos usados na avaliação dos equipamentos e das instalações estão calibrados em laboratório credenciado?', r: [R(30)],
    c: 'Os instrumentos de avaliação estão calibrados em laboratório credenciado.', nc: 'Os instrumentos de avaliação não estão calibrados em laboratório credenciado.',
    na: 'Os testes são feitos por empresa contratada, que apresentou os certificados de calibração dos seus instrumentos.', inf: ['im_testes']},
  {id: 'restricao', t: 'Quando um equipamento atinge nível de restrição, o uso é suspenso (ou restrito a urgência com parecer) e as ações corretivas são registradas?', r: [R(33)],
    c: 'Equipamento em nível de restrição tem o uso suspenso e as ações corretivas registradas.', nc: 'Equipamento em nível de restrição continua em uso sem as medidas exigidas.',
    na: 'Nenhum equipamento atingiu nível de restrição nos testes.', inf: ['im_restricao']},
  {id: 'terceiros', t: 'As empresas de manutenção, assistência técnica, controle de qualidade e proteção radiológica registram cada intervenção e certificam a restituição do equipamento?', r: [R(77)],
    c: 'As empresas contratadas registram cada intervenção e certificam a restituição do equipamento às condições de uso.', nc: 'As intervenções das empresas contratadas não são registradas e certificadas.',
    na: 'Não houve intervenção de empresa contratada no período.', inf: ['im_testes']},
  {id: 'pops', t: 'Há normas, rotinas, protocolos e procedimentos operacionais escritos para todas as atividades, atualizados e acessíveis à equipe?', r: [R(38), RP(38, '3'), RP(38, '4')],
    c: 'Há normas, rotinas, protocolos e procedimentos operacionais escritos, atualizados e acessíveis à equipe.', nc: 'Não há normas, rotinas, protocolos e procedimentos operacionais escritos, atualizados e acessíveis à equipe.',
    na: NAO_FUNC, inf: ['im_pop']},
  {id: 'riscos', t: 'O gerenciamento de riscos identifica falhas e erros, investiga os incidentes de forma documentada e executa as ações corretivas?', r: [R(41)],
    c: 'O gerenciamento de riscos identifica falhas, investiga os incidentes de forma documentada e executa as ações corretivas.', nc: 'Não há gerenciamento de riscos com investigação documentada dos incidentes.',
    na: NAO_FUNC, inf: ['im_riscos']},
  {id: 'comite', t: 'Há Comitê de Gerenciamento de Riscos em Radiologia, que revisa sistematicamente os programas?', r: [R(39), RP(39, 'unico')], naSe: {campo: 'p_nivel', igual: 'primaria'},
    c: 'Há Comitê de Gerenciamento de Riscos em Radiologia, que revisa sistematicamente os programas.', nc: 'O serviço de atenção secundária ou terciária não instituiu o Comitê de Gerenciamento de Riscos em Radiologia.',
    na: 'O serviço é de atenção primária, dispensado do comitê.', inf: ['im_riscos']}
];
const PROTECAO = [
  {id: 'ppr', t: 'O Programa de Proteção Radiológica está implementado, com medidas de prevenção, controle, vigilância e monitoramento?', r: [R(42), R(50)],
    c: 'O Programa de Proteção Radiológica está implementado, com medidas de prevenção, controle, vigilância e monitoramento.', nc: 'O Programa de Proteção Radiológica não está implementado.',
    pontos: [['areas', 'classificação das áreas (livre, supervisionada, controlada)', 'As áreas não estão classificadas em livres, supervisionadas e controladas.'], ['avalia', 'avaliação contínua das condições de trabalho', 'Não há avaliação contínua das condições de trabalho quanto à proteção radiológica.'], ['acesso', 'controle de acesso às áreas controladas', 'Não há controle de acesso às áreas controladas.']],
    na: NAO_FUNC, inf: ['im_ppr']},
  {id: 'justificacao', t: 'Os procedimentos só são feitos com solicitação de profissional habilitado, e o serviço observa justificação e otimização (técnica, colimação, protocolo)?', r: [R(35), R(43), R(44)],
    c: 'Os procedimentos são feitos com solicitação de profissional habilitado, com justificação e otimização.', nc: 'Foram constatados procedimentos sem solicitação de profissional habilitado ou sem otimização.',
    na: 'Não havia procedimento em andamento durante a inspeção.', inf: ['im_justificacao']},
  {id: 'sala', t: 'A sala de exames é área controlada, com acesso restrito e apenas os equipamentos indispensáveis, e só um equipamento opera por vez?', r: [R(51), RI(81, 'i')],
    c: 'A sala de exames é área controlada, com acesso restrito, só os equipamentos indispensáveis e um procedimento por vez.', nc: 'A sala de exames não atende às exigências de área controlada.',
    pontos: [['acesso', 'acesso restrito à equipe, ao paciente e ao acompanhante necessário', 'O acesso à sala de exames não é restrito.'], ['indisp', 'só os equipamentos e acessórios indispensáveis', 'Há na sala equipamentos ou materiais alheios ao procedimento.'], ['simult', 'sem procedimentos simultâneos em equipamentos distintos na mesma sala', 'Há procedimentos simultâneos em equipamentos distintos na mesma sala.']],
    na: NAO_FUNC, inf: ['im_sala']},
  {id: 'sinal_luz', t: 'A sinalização luminosa vermelha acima da porta acende durante a exposição, com o símbolo da radiação ionizante e as inscrições na porta?', r: [R(52)],
    c: 'A sinalização luminosa vermelha acima da porta acende durante a exposição, com o símbolo e as inscrições exigidas.', nc: 'A sinalização luminosa da sala de exames não atende às exigências.',
    pontos: [['luz', 'luz vermelha acima da porta, acionada na exposição', 'Não há luz vermelha acima da porta acionada durante a exposição.'], ['simbolo', 'símbolo internacional da radiação ionizante na porta', 'Não há o símbolo internacional da radiação ionizante na porta.'], ['inscricao', 'inscrições de advertência na porta', 'Não há as inscrições de advertência na porta.']],
    na: 'O serviço só usa equipamento móvel ocasionalmente, dispensado da sinalização luminosa.', inf: ['im_sinalizacao']},
  {id: 'quadro', t: 'Há, na sala e na porta, o quadro com as orientações de proteção radiológica?', r: [R(53)],
    c: 'Há, na sala e na porta, o quadro com as orientações de proteção radiológica.', nc: 'Não há o quadro com as orientações de proteção radiológica.', ncPontos: 'O quadro de orientações não traz: {}.',
    pontos: [['vest', 'uso de vestimenta plumbífera pelo paciente'], ['acomp', 'proibição de acompanhante, salvo se necessário e autorizado'], ['contencao', 'vestimenta plumbífera para o acompanhante que contém o paciente'], ['um', 'um paciente por vez na sala'], ['gravida', 'aviso às gestantes ou com suspeita de gravidez']],
    na: NAO_FUNC, inf: ['im_sinalizacao']},
  {id: 'comando', t: 'O comando permite ao operador ver e se comunicar com o paciente (visor ou sistema eletrônico com reserva) e notar quem entra na sala?', r: [R(54)],
    c: 'O comando permite ao operador ver e se comunicar com o paciente e notar quem entra na sala.', nc: 'O comando não permite ao operador ver e se comunicar com o paciente ou notar quem entra na sala.',
    na: 'O serviço só usa equipamento móvel.', inf: ['im_sala']},
  {id: 'acompanhante', t: 'Acompanhante só permanece quando imprescindível, sem ser gestante, menor de 18 anos ou acompanhante habitual, e usa EPI?', r: [R(37), R(56), R(57)],
    c: 'Acompanhante só permanece quando imprescindível, nas condições permitidas, usando EPI.', nc: 'Acompanhante permanece na sala fora das condições permitidas ou sem EPI.',
    na: 'Não houve procedimento com acompanhante durante a inspeção.', inf: ['im_acompanhante']},
  {id: 'epi', t: 'Há EPI em quantidade suficiente e com a atenuação exigida para todos os profissionais e acompanhantes, e meios de imobilização do paciente?', r: [R(58), R(59), RP(56, '4')],
    c: 'Há EPI suficiente e com a atenuação exigida para profissionais e acompanhantes, e meios de imobilização.', nc: 'O EPI não é suficiente ou não tem a atenuação exigida, ou faltam meios de imobilização.',
    pontos: [['qtd', 'EPI suficiente para o uso simultâneo de todas as salas', 'O EPI não é suficiente para o uso simultâneo de todas as salas.'], ['atenua', 'EPI com atenuação compatível (mínimo 0,25 mm Pb)', 'Há EPI sem a atenuação mínima exigida.'], ['integro', 'EPI íntegro e guardado sem dobras', 'Há EPI danificado ou guardado dobrado.'], ['imobiliza', 'meios de imobilização mecânica do paciente', 'Não há meios de imobilização mecânica do paciente.']],
    na: NAO_FUNC, inf: ['im_epi']},
  {id: 'blind_paciente', t: 'O serviço protege os órgãos mais radiossensíveis do paciente com blindagem de, no mínimo, 0,5 mm equivalente de chumbo, quando não prejudica o exame?', r: [R(61)],
    c: 'Os órgãos mais radiossensíveis do paciente são protegidos com blindagem adequada.', nc: 'O serviço não protege os órgãos mais radiossensíveis do paciente com blindagem adequada.',
    na: 'Não havia procedimento em andamento durante a inspeção.', inf: ['im_epi']},
  {id: 'levantamento', t: 'Há laudo de levantamento radiométrico com o conteúdo exigido, refeito após mudança na instalação, nos equipamentos ou nos processos?', r: [R(63), R(64), R(49)],
    c: 'Há laudo de levantamento radiométrico com o conteúdo exigido e atualizado.', nc: 'Não há laudo de levantamento radiométrico atualizado com o conteúdo exigido.',
    pontos: [['laudo', 'laudo de levantamento radiométrico', 'Não há laudo de levantamento radiométrico.'], ['conteudo', 'croqui, equipamento, instrumentos, fatores de operação, leituras e conclusões', 'O laudo de levantamento radiométrico não traz o conteúdo exigido.'], ['atual', 'refeito após modificação', 'O levantamento radiométrico não foi refeito após modificação.'], ['assina', 'assinado pelo responsável pelo laudo e pelo responsável legal', 'O laudo de levantamento radiométrico não está assinado pelos responsáveis.']],
    na: NAO_FUNC, inf: ['im_levantamento']},
  {id: 'dosimetro', t: 'Cada trabalhador exposto usa dosímetro individual, trocado mensalmente e guardado com o dosímetro padrão em área livre?', r: [R(65), R(66)],
    c: 'Cada trabalhador exposto usa dosímetro individual, trocado mensalmente e guardado com o dosímetro padrão.', nc: 'O controle da dosimetria individual não atende às exigências.',
    pontos: [['uso', 'dosímetro individual em uso por todo trabalhador exposto', 'Há trabalhador exposto sem dosímetro individual.'], ['mensal', 'troca mensal', 'Os dosímetros não são trocados mensalmente.'], ['unico', 'dosímetro de uso individual e exclusivo do serviço', 'Há dosímetro compartilhado ou usado em outro serviço.'], ['guarda', 'guarda com o dosímetro padrão em local seguro de área livre', 'Os dosímetros não são guardados com o dosímetro padrão em área livre.']],
    na: NAO_FUNC, inf: ['im_dosimetria']},
  {id: 'doses', t: 'As doses que atingem o nível de investigação são investigadas, e as mensais acima de 20 mSv são comunicadas à autoridade sanitária?', r: [R(69), RP(69, '1'), RP(69, '2'), R(68)],
    c: 'As doses que atingem o nível de investigação são investigadas e comunicadas quando exigido.', nc: 'As doses que atingem o nível de investigação não são investigadas e comunicadas.',
    na: 'Não houve dose no nível de investigação nos relatórios de dosimetria.', inf: ['im_dosimetria']}
];
const IMAGENS = [
  {id: 'foto', t: 'As imagens usadas em laudo ou registro são obtidas e digitalizadas só por equipamento próprio para esse fim (sem fotografar, filmar ou usar escâner comum)?', r: [R(72)],
    c: 'As imagens destinadas a laudo ou registro são obtidas e digitalizadas por equipamento próprio para esse fim.', nc: 'Imagens destinadas a laudo ou registro são fotografadas, filmadas ou digitalizadas com escâner não específico para esse fim.',
    na: NAO_FUNC, inf: ['im_imagens']},
  {id: 'impressao', m: ['conv', 'mamo', 'tc', 'rm', 'hemo'], t: 'Sem armazenamento digital, as imagens são entregues em filme de tamanho original (não só em papel nem só em filme reduzido)?', r: [R(73)], naSe: SIM('p_digital'),
    c: 'Sem armazenamento digital, as imagens são impressas em filme de tamanho original.', nc: 'Sem armazenamento digital, as imagens são impressas apenas em papel ou em filme reduzido.',
    na: 'O serviço tem sistema de armazenamento das imagens digitais.', inf: ['im_imagens']},
  {id: 'monitor', t: 'Os monitores de laudo são específicos para esse fim e compatíveis com a modalidade, e a iluminação da sala de laudos é adequada à leitura da imagem?', r: [R(74), R(9)], naSe: NAO('p_laudo'),
    c: 'Os monitores de laudo são específicos e compatíveis com a modalidade, com iluminação adequada da sala de laudos.', nc: 'São usados monitores convencionais, não específicos, para laudo.',
    na: 'O serviço não emite laudos no local.', inf: ['im_imagens']},
  {id: 'tele', t: 'A telerradiologia tem infraestrutura de armazenamento e transmissão segura, consentimento do paciente e padrão DICOM/HL7?', r: [R(70), R(71), RP(71, 'unico')], naSe: NAO('p_tele'),
    c: 'A telerradiologia atende às exigências de infraestrutura, consentimento e padrões de comunicação.', nc: 'A telerradiologia não atende às exigências de infraestrutura, consentimento ou padrões de comunicação.',
    na: 'O serviço não usa telerradiologia.', inf: ['im_tele']},
  {id: 'itinerante', t: 'O serviço itinerante está vinculado a serviço com instalação fixa e faz os testes de constância em cada local de parada, com registro por 5 anos?', r: [R(75), R(76)], naSe: NAO('p_itin'),
    c: 'O serviço itinerante está vinculado a serviço fixo e faz os testes de constância em cada parada, com registro.', nc: 'O serviço itinerante não atende às exigências de vínculo e de testes em cada parada.',
    na: 'O serviço não mantém unidade itinerante.', inf: ['im_itinerante']}
];
const PROIBE = [
  {id: 'proibidos', t: 'Os equipamentos e as práticas observados respeitam as vedações dos arts. 80 e 81 da RDC 611/2022?', r: [R(80), R(81)],
    c: 'Os equipamentos e as práticas observados respeitam as vedações da RDC 611/2022: os cassetes têm tela intensificadora, o disparo permite interromper a exposição, o receptor de imagem fica em suporte durante a exposição, o equipamento móvel é usado como móvel e os geradores são de onda completa ou de alta frequência.',
    nc: 'Foram constatados equipamentos ou práticas vedados pela RDC 611/2022.',
    pontos: [['cassete', 'cassetes com tela intensificadora; sem abreugrafia', 'Há cassete sem tela intensificadora ou equipamento de abreugrafia.'], ['retardo', 'disparo que permite interromper a exposição (sem retardo)', 'Há disparo com retardo que impede interromper a exposição.'], ['segurar', 'receptor de imagem em suporte, sem ser segurado com a mão', 'O receptor de imagem é segurado com a mão durante a exposição.'], ['movel', 'equipamento móvel usado como móvel (não como fixo)', 'Equipamento móvel é usado como fixo.'], ['meia', 'gerador de onda completa ou alta frequência (sem autorretificado ou meia onda)', 'Há equipamento com gerador autorretificado ou de retificação de meia onda.']],
    na: NAO_FUNC, inf: ['im_proibido']},
  {id: 'revelacao', m: ['conv', 'mamo'], t: 'O processamento dos filmes é automático (o manual só em urgência, com parecer)?', r: [R(82)],
    c: 'O processamento dos filmes é automático.', nc: 'O serviço faz processamento manual de filmes radiográficos.',
    na: 'O serviço não usa filme radiográfico.', inf: ['im_proibido']},
  {id: 'tempo', m: ['conv', 'mamo'], t: 'O controle da duração da exposição é eletrônico, limitado a 5 segundos e permite interromper a exposição a qualquer momento?', r: [R(83), RP(83, 'unico')],
    c: 'O controle da duração da exposição é eletrônico, limitado a 5 segundos e permite interromper a exposição.', nc: 'O controle da duração da exposição não atende às exigências.',
    na: NAO_FUNC, inf: ['im_proibido']}
];

/* ——— seção específica de cada modalidade (IN) ——— */
const ESPEC = {
  conv: [
    {id: 'conv_equip', t: 'O equipamento possui os itens obrigatórios da IN 90/2021?', r: [N90(2)],
      c: 'O equipamento possui os itens obrigatórios da IN 90/2021.', nc: 'O equipamento não possui os itens obrigatórios da IN 90/2021.', ncPontos: 'O equipamento não possui: {}.',
      pontos: [['colim', 'diafragma regulável com localização luminosa'], ['dist', 'indicação da distância foco-receptor ou foco-pele'], ['tubo', 'indicação do tubo selecionado (mais de um tubo)'], ['cabo', 'cabo disparador de no mínimo 2 metros (móveis)'], ['suporte', 'suporte do cabeçote estável'], ['etiqueta', 'identificação dos componentes (marca, modelo, série)'], ['grade', 'grade antidifusora removível (uso pediátrico)']],
      na: NAO_FUNC, inf: ['im_equip_in']},
    {id: 'conv_painel', t: 'O painel indica o controle automático de exposição em uso e a emissão de raios X por sinal sonoro e luminoso?', r: [N90(3), N90(5), N90(7)],
      c: 'O painel indica o controle automático de exposição em uso e a emissão de raios X por sinal sonoro e luminoso.', nc: 'O painel não indica a emissão de raios X por sinal sonoro e luminoso ou o controle automático em uso.',
      na: NAO_FUNC, inf: ['im_equip_in']},
    {id: 'conv_tabela', t: 'Há no comando a tabela de exposição de cada exame, com os dados exigidos?', r: [N90(8)],
      c: 'Há no comando a tabela de exposição de cada exame, com os dados exigidos.', nc: 'Não há no comando a tabela de exposição com os dados exigidos.', ncPontos: 'A tabela de exposição não traz: {}.',
      pontos: [['tecnica', 'tipo de exame e fatores de técnica'], ['cae', 'parâmetros do controle automático de exposição'], ['receptor', 'tamanho e tipo de receptor de imagem'], ['dfr', 'distância foco-receptor'], ['blind', 'tipo e posição da blindagem do paciente']],
      na: NAO_FUNC, inf: ['im_equip_in']},
    {id: 'conv_disparo', t: 'O disparo tem dois estágios, só emite enquanto pressionado e interrompe a exposição ao fim do tempo, dose ou mAs selecionado?', r: [N90(9), N90(10)],
      c: 'O disparo tem dois estágios, só emite enquanto pressionado e interrompe a exposição ao fim do valor selecionado.', nc: 'O sistema de disparo não atende às exigências da IN 90/2021.',
      na: NAO_FUNC, inf: ['im_equip_in']},
    {id: 'conv_inabilita', t: 'Os equipamentos em uso atendem às condições mínimas de funcionamento (nenhuma das condições do checklist, que inabilitam o uso)?', r: [N90(11)],
      c: 'Os equipamentos em uso atendem às condições mínimas de funcionamento exigidas pela instrução normativa da modalidade.', nc: 'Há equipamento em uso em condição que inabilita o uso.', ncPontos: 'Há equipamento em uso com: {}.',
      pontos: [['colim', 'colimação ausente ou sem funcionar'], ['luz', 'luz de campo ausente ou sem funcionar'], ['filtro', 'falta de filtração adicional'], ['param', 'painel sem kV, mA e tempo (ou mAs)'], ['grade', 'bucky sem grade antidifusora'], ['dois', 'mais de um equipamento na mesma sala'], ['cabo', 'equipamento móvel sem cabo disparador'], ['continuo', 'disparo que permite feixe contínuo']],
      na: NAO_FUNC, inf: ['im_inabilita']},
    {id: 'conv_qualidade', t: 'A qualidade da imagem é avaliada com ferramenta de teste específica, com imagem de referência e os testes do Anexo I da IN 90/2021?', r: [N90(1), N90(12)],
      c: 'A qualidade da imagem é avaliada com ferramenta de teste específica, imagem de referência e os testes do Anexo I.', nc: 'A qualidade da imagem não é avaliada como exige a IN 90/2021.',
      na: NAO_FUNC, inf: ['im_testes']}
  ],
  mamo: [
    {id: 'mamo_equip', t: 'O mamógrafo possui os itens obrigatórios da IN 92/2021?', r: [N92(2), N92(3), N92(4)],
      c: 'O mamógrafo possui os itens obrigatórios da IN 92/2021.', nc: 'O mamógrafo não possui os itens obrigatórios da IN 92/2021.', ncPontos: 'O mamógrafo não possui: {}.',
      pontos: [['compr', 'dispositivo de compressão firme da mama'], ['cae', 'controle automático de exposição, indicado no painel'], ['gerador', 'gerador de alta frequência e tubo específico de mamografia'], ['espessura', 'indicação da espessura da mama comprimida (equipamentos novos)'], ['terminologia', 'parâmetros no painel em linguagem ou símbolo compreensível']],
      na: NAO_FUNC, inf: ['im_equip_in']},
    {id: 'mamo_sinal', t: 'A emissão de raios X é indicada por sinal sonoro e luminoso no painel?', r: [N92(5)],
      c: 'A emissão de raios X é indicada por sinal sonoro e luminoso no painel.', nc: 'A emissão de raios X não é indicada por sinal sonoro e luminoso no painel.',
      na: NAO_FUNC, inf: ['im_equip_in']},
    {id: 'mamo_inabilita', t: 'Os equipamentos em uso atendem às condições mínimas de funcionamento (nenhuma das condições do checklist, que inabilitam o uso)?', r: [N92(6)],
      c: 'Os equipamentos em uso atendem às condições mínimas de funcionamento exigidas pela instrução normativa da modalidade.', nc: 'Há equipamento em uso em condição que inabilita o uso.', ncPontos: 'Há equipamento em uso com: {}.',
      pontos: [['colim', 'colimação ausente ou sem funcionar'], ['filtro', 'falta de filtração adicional'], ['param', 'painel sem kVp, mA e tempo (ou mAs)'], ['compr', 'sem compressão automática ou bandeja danificada'], ['cae', 'sem controle automático de exposição funcionando'], ['dist', 'distância foco-receptor menor que 50 cm'], ['grade', 'bucky sem grade (fora de magnificação)'], ['manual', 'revelação manual'], ['dois', 'mais de um equipamento na sala'], ['monitor', 'monitor ou negatoscópio não específico para mamografia'], ['processadora', 'processadora não exclusiva de mamografia']],
      na: NAO_FUNC, inf: ['im_inabilita']},
    {id: 'mamo_testes', t: 'Os testes do Anexo I da IN 92/2021 são feitos nas periodicidades, tolerâncias e níveis de restrição fixados, inclusive a avaliação diária da imagem?', r: [N92(1), N92(7), N92(7, 'paragrafo', '1'), N92(7, 'paragrafo', '2')],
      c: 'Os testes do Anexo I da IN 92/2021 são feitos nas periodicidades fixadas, inclusive a avaliação diária da imagem.', nc: 'Os testes do Anexo I da IN 92/2021 não são feitos nas periodicidades fixadas.',
      na: NAO_FUNC, inf: ['im_testes']},
    {id: 'pnqm', t: 'O serviço participa do Programa Nacional de Qualidade em Mamografia?', r: [PRC(216), PRC(208)],
      c: 'O serviço participa do Programa Nacional de Qualidade em Mamografia.', nc: 'O serviço não cumpre as obrigações do Programa Nacional de Qualidade em Mamografia.',
      pontos: [['siscan', 'informações dos exames no SISCAN ou sistema vigente', 'O serviço não insere as informações dos exames no SISCAN ou no sistema vigente.'], ['relatorio', 'relatório anual do PGQ enviado à vigilância sanitária', 'O serviço não envia anualmente à vigilância sanitária o relatório do PGQ.'], ['amostra', 'amostra trienal de exames enviada ao INCA', 'O serviço não envia trienalmente ao INCA a amostra de exames.']],
      na: NAO_FUNC, inf: ['im_pnqm']}
  ],
  tc: [
    {id: 'tc_equip', t: 'O tomógrafo possui os itens obrigatórios da IN 93/2021?', r: [N93(2)],
      c: 'O tomógrafo possui os itens obrigatórios da IN 93/2021.', nc: 'O tomógrafo não possui os itens obrigatórios da IN 93/2021.', ncPontos: 'O tomógrafo não possui: {}.',
      pontos: [['plano', 'determinação visual do plano de referência'], ['interrompe', 'interrupção da aquisição a qualquer instante'], ['param', 'indicação dos parâmetros de técnica antes da série'], ['dose', 'indicação de CTDIvol e DLP (equipamentos novos)'], ['dicom', 'relatório de dose em DICOM (equipamentos novos)'], ['modulacao', 'modulação automática de corrente (equipamentos novos)']],
      na: NAO_FUNC, inf: ['im_equip_in']},
    {id: 'tc_sinal', t: 'A emissão de raios X é indicada por sinal sonoro e luminoso no painel?', r: [N93(3)],
      c: 'A emissão de raios X é indicada por sinal sonoro e luminoso no painel.', nc: 'A emissão de raios X não é indicada por sinal sonoro e luminoso no painel.',
      na: NAO_FUNC, inf: ['im_equip_in']},
    {id: 'tc_pediatria', t: 'O tomógrafo usado em pediatria tem protocolos pediátricos?', r: [N93(2, 'inciso', 'viii'), N93(4, 'inciso', 'ii')], naSe: NAO('p_pediatria'),
      c: 'O tomógrafo usado em pediatria tem protocolos pediátricos.', nc: 'O tomógrafo é usado em pediatria sem protocolos pediátricos.',
      na: 'O serviço não atende pacientes pediátricos.', inf: ['im_inabilita']},
    {id: 'tc_inabilita', t: 'Os tomógrafos comercializados após a IN têm modulação automática de corrente, indicação de CTDI e DLP e relatório de dose em DICOM?', r: [N93(4)],
      c: 'Os tomógrafos comercializados após a IN 93/2021 têm modulação automática de corrente, indicação de CTDI e DLP e relatório de dose em DICOM.', nc: 'Há tomógrafo em uso em condição que inabilita o uso.',
      na: 'Todos os tomógrafos foram comercializados antes da IN 93/2021.', inf: ['im_inabilita']},
    {id: 'tc_testes', t: 'Os testes do Anexo I da IN 93/2021 e os do fabricante são feitos e registrados?', r: [N93(1), RP(28, 'unico')],
      c: 'Os testes do Anexo I da IN 93/2021 e os do fabricante são feitos e registrados.', nc: 'Os testes do Anexo I da IN 93/2021 não são feitos e registrados.',
      na: NAO_FUNC, inf: ['im_testes']}
  ],
  rm: [
    {id: 'rm_zonas', t: 'Os ambientes estão classificados nas zonas I a IV, com restrição de acesso às zonas III e IV?', r: [N97(8), N97(10, 'inciso', 'i')],
      c: 'Os ambientes estão classificados nas zonas I a IV, com restrição de acesso às zonas III e IV.', nc: 'Os ambientes não estão classificados em zonas, ou o acesso às zonas III e IV não é restrito.',
      na: NAO_FUNC, inf: ['im_rm_acesso']},
    {id: 'rm_detector', t: 'Há sistema de detecção de metais para o acesso às zonas III e IV, compatível com o número de salas?', r: [N97(9)],
      c: 'Há sistema de detecção de metais para o acesso às zonas III e IV.', nc: 'Não há sistema de detecção de metais para o acesso às zonas III e IV.',
      na: NAO_FUNC, inf: ['im_rm_acesso']},
    {id: 'rm_triagem', t: 'Há triagem de implantes e objetos incompatíveis e dos critérios clínicos e de segurança antes do exame?', r: [N97(10)],
      c: 'Há triagem de implantes, objetos incompatíveis e critérios clínicos e de segurança antes do exame.', nc: 'Não há triagem de implantes, objetos incompatíveis e critérios de segurança antes do exame.',
      na: NAO_FUNC, inf: ['im_rm_acesso']},
    {id: 'rm_sinal', t: 'As portas da sala de exames informam os riscos e a proibição de entrada com implantes ou objetos incompatíveis?', r: [N97(5)],
      c: 'As portas da sala de exames informam os riscos e a proibição de entrada com implantes ou objetos incompatíveis.', nc: 'As portas da sala de exames não informam os riscos e a proibição de entrada.',
      na: NAO_FUNC, inf: ['im_rm_instal']},
    {id: 'rm_comunica', t: 'Há comunicação audiovisual entre o comando e a sala durante todo o exame?', r: [N97(7)],
      c: 'Há comunicação audiovisual entre o comando e a sala durante todo o exame.', nc: 'Não há comunicação audiovisual entre o comando e a sala durante o exame.',
      na: NAO_FUNC, inf: ['im_rm_instal']},
    {id: 'rm_ruido', t: 'A sala tem isolamento acústico, e o paciente e quem permanece na sala recebem proteção auditiva?', r: [N97(2), N97(12)],
      c: 'A sala tem isolamento acústico, e o paciente e quem permanece na sala recebem proteção auditiva.', nc: 'A sala não tem isolamento acústico ou não é fornecida proteção auditiva.',
      na: NAO_FUNC, inf: ['im_rm_instal']},
    {id: 'rm_criogenio', t: 'O equipamento com líquido criogênico tem sistema de evacuação massiva de gases e a porta da sala abre para fora?', r: [N97(6), N97(3)], naSe: NAO('p_cripo'),
      c: 'Há sistema de evacuação massiva de gases criogênicos, e a porta da sala abre para fora.', nc: 'Não há sistema de evacuação massiva de gases criogênicos ou a porta da sala não abre para fora.',
      na: 'O equipamento não usa líquido criogênico.', inf: ['im_rm_instal']},
    {id: 'rm_projeto', t: 'O projeto de blindagem traz a blindagem eletromagnética, o isolamento acústico, a evacuação de gases e o laudo de compatibilidade eletromagnética?', r: [N97(4)],
      c: 'O projeto de blindagem traz o conteúdo exigido pela IN 97/2021.', nc: 'O projeto de blindagem não traz o conteúdo exigido pela IN 97/2021.',
      na: NAO_FUNC, inf: ['im_projeto']},
    {id: 'rm_educacao', t: 'A educação permanente orienta toda a equipe sobre segurança e restrição de acesso às zonas III e IV?', r: [N97(11)],
      c: 'A educação permanente orienta toda a equipe sobre segurança e restrição de acesso às zonas III e IV.', nc: 'A educação permanente não orienta a equipe sobre segurança e acesso às zonas III e IV.',
      na: NAO_FUNC, inf: ['im_pep']},
    {id: 'rm_testes', t: 'Os testes do Anexo da IN 97/2021 e os do fabricante são feitos e registrados?', r: [N97(1)],
      c: 'Os testes do Anexo da IN 97/2021 e os do fabricante são feitos e registrados.', nc: 'Os testes do Anexo da IN 97/2021 não são feitos e registrados.',
      na: NAO_FUNC, inf: ['im_testes']}
  ],
  us: [
    {id: 'us_testes', t: 'Os testes de aceitação e controle de qualidade do Anexo da IN 96/2021 e os do fabricante são feitos nos equipamentos de ultrassom diagnóstico, com registro?', r: [N96(1)], naSe: NAO('p_diag'),
      c: 'Os testes do Anexo da IN 96/2021 e os do fabricante são feitos nos equipamentos de diagnóstico, com registro.', nc: 'Os testes do Anexo da IN 96/2021 não são feitos nos equipamentos de diagnóstico.',
      na: 'O serviço não usa ultrassom diagnóstico.', inf: ['im_testes']},
    {id: 'us_terap', t: 'Os testes de controle de qualidade do ultrassom terapêutico são feitos conforme o fabricante, com registro?', r: [N96(2)], naSe: NAO('p_terap'),
      c: 'Os testes de controle de qualidade do ultrassom terapêutico são feitos conforme o fabricante, com registro.', nc: 'Os testes de controle de qualidade do ultrassom terapêutico não são feitos conforme o fabricante.',
      na: 'O serviço não usa ultrassom terapêutico.', inf: ['im_testes']},
    {id: 'us_transdutor', t: 'Os transdutores estão íntegros (sem trincas, cabos danificados ou falhas na imagem) e passam por limpeza e desinfecção conforme o fabricante?', r: [RP(25, 'unico'), R(27)],
      c: 'Os transdutores estão íntegros e passam por limpeza e desinfecção conforme o fabricante.', nc: 'Há transdutor danificado ou sem limpeza e desinfecção conforme o fabricante.',
      na: NAO_FUNC, inf: ['im_produtos']}
  ],
  hemo: [
    {id: 'hemo_equip', t: 'O equipamento possui os itens obrigatórios da IN 91/2021?', r: [N91(2)],
      c: 'O equipamento possui os itens obrigatórios da IN 91/2021.', nc: 'O equipamento não possui os itens obrigatórios da IN 91/2021.', ncPontos: 'O equipamento não possui: {}.',
      pontos: [['tempo', 'controle do tempo acumulado de fluoroscopia'], ['diafragma', 'diafragma que restringe o campo ao receptor'], ['saiote', 'cortina ou saiote plumbífero íntegro (salas fixas)'], ['visor', 'visor plumbífero íntegro (salas fixas)'], ['cine', 'sinal sonoro e luminoso no modo cine'], ['dose', 'indicação de produto kerma-área ou kerma de referência (equipamentos novos)'], ['dfp', 'limitador da distância foco-pele'], ['etiqueta', 'identificação dos componentes']],
      na: NAO_FUNC, inf: ['im_equip_in']},
    {id: 'hemo_proib', t: 'Os equipamentos têm gerador de alta frequência, feixe pulsado e controle automático de intensidade?', r: [N91(3)],
      c: 'Os equipamentos têm gerador de alta frequência, feixe pulsado e controle automático de intensidade, como exige a IN 91/2021.', nc: 'Há equipamento sem gerador de alta frequência, sem feixe pulsado ou sem controle automático de intensidade, vedado pela IN 91/2021.',
      na: NAO_FUNC, inf: ['im_inabilita']},
    {id: 'hemo_sinal', t: 'A emissão de raios X é indicada por sinal luminoso no painel, dentro da sala e, nos fixos, do lado de fora da porta?', r: [N91(6), N91(6, 'paragrafo', 'unico')],
      c: 'A emissão de raios X é indicada por sinal luminoso no painel, na sala e do lado de fora da porta.', nc: 'A emissão de raios X não é indicada pelos sinais luminosos exigidos.',
      na: NAO_FUNC, inf: ['im_equip_in']},
    {id: 'hemo_inabilita', t: 'Os equipamentos em uso atendem às condições mínimas de funcionamento (nenhuma das condições do checklist, que inabilitam o uso)?', r: [N91(7)],
      c: 'Os equipamentos em uso atendem às condições mínimas de funcionamento exigidas pela instrução normativa da modalidade.', nc: 'Há equipamento em uso em condição que inabilita o uso.', ncPontos: 'Há equipamento em uso com: {}.',
      pontos: [['colim', 'colimação ausente ou sem funcionar'], ['campo', 'campo não restrito ao receptor de imagem'], ['filtro', 'falta de filtração adicional'], ['param', 'painel sem os parâmetros básicos'], ['dois', 'mais de um equipamento na sala'], ['detector', 'sem intensificador ou detector digital'], ['anteparo', 'intervencionista sem anteparo de teto ou visor e cortina plumbífera']],
      na: NAO_FUNC, inf: ['im_inabilita']},
    {id: 'hemo_qualidade', t: 'A qualidade da imagem é avaliada com ferramenta específica, imagem de referência e imagem semestral, e os testes do Anexo I são feitos?', r: [N91(1), N91(8)],
      c: 'A qualidade da imagem é avaliada com ferramenta específica, imagem de referência e imagem semestral.', nc: 'A qualidade da imagem não é avaliada como exige a IN 91/2021.',
      na: NAO_FUNC, inf: ['im_testes']},
    {id: 'hemo_epi', t: 'Os EPI da radiologia intervencionista são testados semestralmente, com laudo técnico de integridade e imagens?', r: [N91(9)],
      c: 'Os EPI são testados semestralmente, com laudo técnico de integridade.', nc: 'Os EPI não são testados semestralmente com laudo técnico de integridade.',
      na: NAO_FUNC, inf: ['im_epi']},
    {id: 'nsp', t: 'Há Núcleo de Segurança do Paciente constituído e Plano de Segurança do Paciente implantado, que alcança o serviço de hemodinâmica?', r: [R36(4), R36(5), R36(7, 'inciso', 'iv'), R36(8)],
      c: 'Há Núcleo de Segurança do Paciente constituído e Plano de Segurança do Paciente implantado, que alcança o serviço.', nc: 'Não há Núcleo de Segurança do Paciente ou Plano de Segurança do Paciente que alcance o serviço.',
      pontos: [['nsp', 'Núcleo de Segurança do Paciente nomeado', 'O Núcleo de Segurança do Paciente não foi constituído.'], ['psp', 'Plano de Segurança do Paciente implantado', 'Não há Plano de Segurança do Paciente implantado.'], ['protocolos', 'protocolos (identificação, cirurgia segura, medicamentos, quedas)', 'Os protocolos de segurança do paciente não estão implantados.'], ['notifica', 'eventos adversos notificados no Notivisa', 'Os eventos adversos não são notificados ao Sistema Nacional de Vigilância Sanitária.']],
      na: NAO_FUNC, inf: ['im_nsp']}
  ]
};

const INFRACOES = [
  {id: 'im_lic', grupo: 'Organização e responsabilidade', texto: 'Manter serviço de diagnóstico por imagem sem licença sanitária que contemple a modalidade.', r: [LM(90)]},
  {id: 'im_rt', grupo: 'Organização e responsabilidade', texto: 'Deixar de designar formalmente o responsável técnico do setor e o seu substituto.', r: [R(13)]},
  {id: 'im_spr', grupo: 'Organização e responsabilidade', texto: 'Deixar de designar formalmente o supervisor de proteção radiológica e o seu substituto.', r: [R(14)]},
  {id: 'im_programas', grupo: 'Organização e responsabilidade', texto: 'Deixar de implementar os Programas de Garantia da Qualidade, de Educação Permanente e de Proteção Radiológica.', r: [R(5)]},
  {id: 'im_docs', grupo: 'Organização e responsabilidade', texto: 'Deixar de manter atualizados e disponíveis os documentos exigidos do serviço de diagnóstico por imagem.', r: [R(16), R(17)]},
  {id: 'im_projeto', grupo: 'Organização e responsabilidade', texto: 'Funcionar sem projeto de blindagem aprovado ou modificar instalações e equipamentos sem aprovação prévia da autoridade sanitária.', r: [R(7), R(8), R(10)]},
  {id: 'im_equipe', grupo: 'Pessoal', texto: 'Realizar procedimentos com equipe não dimensionada ou por profissional não legalmente habilitado.', r: [R(12), R(34), R(78)]},
  {id: 'im_pep', grupo: 'Pessoal', texto: 'Deixar de implementar o Programa de Educação Permanente com o conteúdo, a periodicidade e os registros exigidos.', r: [R(15)]},
  {id: 'im_ocupacional', grupo: 'Pessoal', texto: 'Deixar de proteger o trabalhador menor de 18 anos e a trabalhadora gestante da exposição aos raios X.', r: [R(46), R(47)]},
  {id: 'im_produtos', grupo: 'Garantia da qualidade', texto: 'Utilizar equipamento ou produto sem regularização na Anvisa ou em desacordo com as instruções do fabricante.', r: [R(25), R(26)]},
  {id: 'im_testes', grupo: 'Garantia da qualidade', texto: 'Deixar de realizar e registrar os testes de aceitação e de constância e as manutenções dos equipamentos.', r: [R(27), R(28), R(29), R(30)]},
  {id: 'im_restricao', grupo: 'Garantia da qualidade', texto: 'Manter em uso equipamento em nível de restrição sem as medidas exigidas.', r: [R(33)]},
  {id: 'im_pop', grupo: 'Garantia da qualidade', texto: 'Deixar de elaborar e implementar normas, rotinas, protocolos e procedimentos operacionais para as atividades.', r: [R(38)]},
  {id: 'im_riscos', grupo: 'Garantia da qualidade', texto: 'Deixar de realizar o gerenciamento de riscos em radiologia, com investigação documentada dos incidentes.', r: [R(39), R(41)]},
  {id: 'im_ppr', grupo: 'Proteção radiológica', texto: 'Deixar de implementar o Programa de Proteção Radiológica, com classificação e controle de acesso das áreas.', r: [R(42), R(50)]},
  {id: 'im_justificacao', grupo: 'Proteção radiológica', texto: 'Realizar procedimento radiológico sem solicitação de profissional habilitado ou sem justificação e otimização.', r: [R(35), R(43), R(44)]},
  {id: 'im_sala', grupo: 'Proteção radiológica', texto: 'Manter sala de exames e comando em desacordo com os requisitos de área controlada.', r: [R(51), R(54), R(81)]},
  {id: 'im_sinalizacao', grupo: 'Proteção radiológica', texto: 'Deixar de manter a sinalização luminosa e o quadro de orientações de proteção radiológica.', r: [R(52), R(53)]},
  {id: 'im_acompanhante', grupo: 'Proteção radiológica', texto: 'Permitir a permanência de acompanhante fora das condições permitidas ou sem equipamento de proteção individual.', r: [R(56), R(57)]},
  {id: 'im_epi', grupo: 'Proteção radiológica', texto: 'Deixar de prover equipamentos de proteção individual suficientes e íntegros e a blindagem do paciente.', r: [R(58), R(59), R(61)]},
  {id: 'im_levantamento', grupo: 'Proteção radiológica', texto: 'Deixar de manter laudo de levantamento radiométrico atualizado e com o conteúdo exigido.', r: [R(63), R(64)]},
  {id: 'im_dosimetria', grupo: 'Proteção radiológica', texto: 'Deixar de realizar a monitoração individual dos trabalhadores expostos e a investigação das doses.', r: [R(65), R(66), R(69)]},
  {id: 'im_proibido', grupo: 'Proteção radiológica', texto: 'Utilizar equipamento, material ou prática proibidos em radiologia diagnóstica ou intervencionista.', r: [R(80), R(81), R(82), R(83)]},
  {id: 'im_imagens', grupo: 'Imagens e laudos', texto: 'Registrar, armazenar ou laudar imagens em desacordo com a RDC nº 611/2022.', r: [R(72), R(73), R(74)]},
  {id: 'im_tele', grupo: 'Imagens e laudos', texto: 'Realizar telerradiologia sem a infraestrutura, o consentimento e os padrões de comunicação exigidos.', r: [R(71)]},
  {id: 'im_itinerante', grupo: 'Imagens e laudos', texto: 'Manter serviço itinerante sem vínculo com serviço fixo ou sem os testes de constância em cada local de parada.', r: [R(75), R(76)]},
  {id: 'im_equip_in', grupo: 'Equipamentos da modalidade', texto: 'Utilizar equipamento sem os itens obrigatórios previstos na Instrução Normativa da modalidade.', r: []},
  {id: 'im_inabilita', grupo: 'Equipamentos da modalidade', texto: 'Utilizar equipamento em condição que inabilita o seu uso, prevista na Instrução Normativa da modalidade.', r: []},
  {id: 'im_pnqm', grupo: 'Equipamentos da modalidade', texto: 'Deixar de cumprir as obrigações do serviço no Programa Nacional de Qualidade em Mamografia.', r: [PRC(216)]},
  {id: 'im_rm_acesso', grupo: 'Equipamentos da modalidade', texto: 'Deixar de classificar as zonas e de controlar o acesso de pessoas e objetos às zonas III e IV da ressonância magnética.', r: [N97(8), N97(9), N97(10)]},
  {id: 'im_rm_instal', grupo: 'Equipamentos da modalidade', texto: 'Manter sala de ressonância magnética sem a sinalização, a comunicação, a proteção acústica e a evacuação de gases exigidas.', r: [N97(2), N97(3), N97(5), N97(6), N97(7), N97(12)]},
  {id: 'im_nsp', grupo: 'Segurança do paciente', texto: 'Deixar de constituir o Núcleo de Segurança do Paciente e de implantar o Plano de Segurança do Paciente.', r: [R36(4), R36(7), R36(8)]}
];
/* artigos da IN da modalidade nas infrações genéricas de equipamento */
const INF_IN = {
  conv: {im_equip_in: [N90(2), N90(7), N90(8), N90(9)], im_inabilita: [N90(11)]},
  mamo: {im_equip_in: [N92(2), N92(5)], im_inabilita: [N92(6)]},
  tc: {im_equip_in: [N93(2), N93(3)], im_inabilita: [N93(4)]},
  rm: {}, us: {},
  hemo: {im_equip_in: [N91(2), N91(6)], im_inabilita: [N91(3), N91(7)]}
};
/* Lei 13.725/2004 (serviço de saúde): 42 (fatores de risco do trabalho, como as radiações), 63
   (condições para a atividade), 64 (profissionais), 65 (instalações e equipamentos), 66
   (funcionamento dos equipamentos), 68 (registros), 90 (licença) e 92 (responsável técnico). */
const LEI = {
  im_lic: [LM(90)], im_rt: [LM(92)], im_spr: [LM(42), LM(63)], im_programas: [LM(63)], im_docs: [LM(68)], im_projeto: [LM(65)],
  im_equipe: [LM(64)], im_pep: [LM(64)], im_ocupacional: [LM(42)], im_produtos: [LM(65)], im_testes: [LM(66)], im_restricao: [LM(66)],
  im_pop: [LM(63)], im_riscos: [LM(63)], im_ppr: [LM(42), LM(63)], im_justificacao: [LM(63)], im_sala: [LM(65)], im_sinalizacao: [LM(65)],
  im_acompanhante: [LM(63)], im_epi: [LM(42), LM(65)], im_levantamento: [LM(42), LM(65)], im_dosimetria: [LM(42)], im_proibido: [LM(65)],
  im_imagens: [LM(68)], im_tele: [LM(63)], im_itinerante: [LM(63)], im_equip_in: [LM(65), LM(66)], im_inabilita: [LM(66)],
  im_pnqm: [LM(63)], im_rm_acesso: [LM(63)], im_rm_instal: [LM(65)], im_nsp: [LM(63)]
};
function lei13725(secoes, infracoes) {
  const eLei = r => /^lei-municipal-13725-2004::/.test(r), uniq = l => l.filter((x, k) => l.indexOf(x) === k);
  const ordem = r => r.replace(/^lei-municipal-13725-2004::artigo::(\d+).*/, '$1') * 1, ord = l => l.sort((a, b) => ordem(a) - ordem(b));
  const final = {};
  infracoes.forEach(i => { final[i.id] = ord(uniq(i.r.filter(eLei).concat(LEI[i.id] || [LM(63)]))); i.r = i.r.filter(r => !eLei(r)).concat(final[i.id]); });
  secoes.forEach(s => s.itens.forEach(it => (it.perguntas || []).forEach(q => {
    const l = uniq([].concat(...(q.inf || []).map(f => final[f] || [])));
    q.r = q.r.filter(r => !eLei(r) || q.id === 'lic').concat(l.length ? ord(l) : [LM(63)]).filter((x, k, a) => a.indexOf(x) === k);
  })));
}

/* “Para saber mais”: cada linha com a sua fonte */
const CNEN = 'Norma CNEN NN 3.01 (Resolução CNEN nº 323/2024), art. 52';
const MAIS = {
  protecao: [
    {t: 'Limites de dose da CNEN, aos quais remete a RDC: trabalhador exposto (IOE) — dose efetiva de 20 mSv por ano, em média de 5 anos consecutivos, sem passar de 50 mSv em nenhum ano; cristalino 20 mSv/ano; pele 500 mSv/ano; mãos e pés 500 mSv/ano. Público — dose efetiva de 1 mSv/ano; cristalino 15 mSv/ano; pele 50 mSv/ano.', f: CNEN + '; RDC Anvisa nº 611/2022, arts. 45 e 48'},
    {t: 'Restrições de dose para o projeto de blindagem e o levantamento radiométrico: 0,5 mSv/ano em área livre e 5 mSv/ano em área controlada. Dose efetiva mensal acima de 20 mSv: investigar e comunicar à vigilância sanitária; acima de 100 mSv: avaliação clínica e exames, inclusive dosimetria citogenética.', f: 'RDC Anvisa nº 611/2022, arts. 49 e 69'},
    {t: 'Justificação, otimização e limitação de dose: o exame só é feito com pedido de profissional habilitado e no mínimo necessário; a otimização usa técnica, colimação, protocolos e os níveis de referência de diagnóstico. O que pedir: pedidos médicos de uma amostra de exames, a tabela ou protocolo de técnica e o uso de protetores no paciente.', f: 'RDC Anvisa nº 611/2022, arts. 35, 43 e 44'}
  ],
  testes: [
    {t: 'Cada IN traz no Anexo a lista mínima de testes de aceitação e de controle de qualidade, com periodicidade, tolerância e nível de restrição; a lista é completada pelos testes do fabricante. Peça os relatórios dos testes do último ano e confira a data de cada um com a periodicidade da IN.', f: 'RDC Anvisa nº 611/2022, arts. 28 e 29; INs Anvisa nº 90, 91, 92, 93, 96 e 97/2021, art. 1º'}
  ],
  conv: [],
  mamo: [
    {t: 'Programa Nacional de Qualidade em Mamografia: vale para todo serviço que faz mamografia, público ou privado, do SUS ou não. O serviço insere os exames no SISCAN, envia por ano o relatório do PGQ à vigilância sanitária e, a cada três anos, uma amostra de exames ao INCA; é aprovado quando cumpre os critérios do PGQ e da qualidade da imagem e do laudo.', f: 'Portaria de Consolidação GM/MS nº 5/2017, arts. 206, 208, 216 e 224'}
  ],
  tc: [
    {t: 'Meio de contraste: antes da injeção, triagem de alergia prévia e de função renal nos pacientes de risco; serviço preparado para reação adversa, com material e medicamentos de emergência e equipe treinada.', f: 'American College of Radiology, ACR Manual on Contrast Media (2024); RDC Anvisa nº 36/2013, art. 8º'}
  ],
  rm: [
    {t: 'As zonas I a IV vêm do modelo de segurança do ACR: a zona III só é acessada sob supervisão de pessoal treinado, e a zona IV é a sala do magneto, que está sempre ligado. Objeto ferromagnético na zona IV vira projétil; a triagem de implantes é feita antes da zona III.', f: 'IN Anvisa nº 97/2021, arts. 8º a 10; American College of Radiology, ACR Manual on MR Safety (2024)'},
    {t: 'Meio de contraste à base de gadolínio: triagem de função renal nos pacientes de risco e serviço preparado para reação adversa.', f: 'American College of Radiology, ACR Manual on Contrast Media (2024)'}
  ],
  us: [
    {t: 'Princípio ALARA no ultrassom: usar a menor potência de saída e o menor tempo de exposição que deem a informação diagnóstica; acompanhar os índices térmico (TI) e mecânico (MI) na tela; começar pelos ajustes de fábrica (presets) do tipo de exame e evitar tempo de permanência desnecessário sobre tecidos sensíveis.', f: 'American Institute of Ultrasound in Medicine (AIUM), As Low As Reasonably Achievable (ALARA) Principle, declaração oficial reaprovada em 19/05/2020'},
    {t: 'O ultrassom terapêutico entra na mesma IN: os testes de controle de qualidade seguem o que o fabricante estabelece.', f: 'IN Anvisa nº 96/2021, arts. 1º e 2º'}
  ],
  hemo: [
    {t: 'Cardiologia intervencionista: o operador usa avental plumbífero e óculos plumbíferos (o cristalino é sensível), além de anteparo suspenso e saiote na mesa; o dosímetro de tórax vai sobre o avental, conforme o Programa de Proteção Radiológica. No paciente, acompanha-se a dose de pele em procedimento longo.', f: 'ICRP, Publicação 120, Radiological protection in cardiology (2013); RDC Anvisa nº 611/2022, arts. 59 e 66; IN Anvisa nº 91/2021, arts. 2º e 9º'},
    {t: 'Limite de dose no cristalino do trabalhador: 20 mSv por ano.', f: CNEN}
  ]
};

/* orientação técnica dos demais itens: o que pedir e conferir, com o dispositivo */
const R611 = 'RDC Anvisa nº 611/2022';
const ORIENT = {
  org: [
    {t: 'O que pedir: a licença sanitária, o ato do responsável legal que designa o responsável técnico do setor e o substituto (com as atividades delegadas) e, nos raios X, o supervisor de proteção radiológica. Os três programas (Garantia da Qualidade, Educação Permanente e Proteção Radiológica) são documentos com execução registrada, não só um manual.', f: R611 + ', arts. 5º, 13, 14 e 17'},
    {t: 'Projeto de blindagem: confira se a sala, o equipamento e a carga de trabalho atuais são os do projeto aprovado. Troca ou inclusão de equipamento e mudança na sala precisam de aprovação antes; mudança de parâmetro do projeto é comunicada antes.', f: R611 + ', arts. 7º, 8º, 10 e 11'}
  ],
  pessoal: [
    {t: 'O que pedir: a relação nominal da equipe com qualificação e carga horária, os registros de habilitação no conselho de quem opera os equipamentos e os registros das capacitações do último ano (data, carga horária, conteúdo, instrutor e participantes), com a avaliação da eficácia.', f: R611 + ', arts. 12, 15, 17, IV, 34 e 78'}
  ],
  processos: [
    {t: 'O que pedir: os procedimentos operacionais da modalidade (preparo do paciente, protocolos de exame, limpeza, conduta em evento adverso), com data de revisão; o registro de incidentes com a investigação e as ações; e, em serviço de atenção secundária ou terciária, as atas do Comitê de Gerenciamento de Riscos em Radiologia.', f: R611 + ', arts. 38, 39 e 41'}
  ],
  epi: [
    {t: 'O que verificar: aventais, protetores de tireoide e óculos plumbíferos em número suficiente para todas as salas em uso ao mesmo tempo, íntegros e guardados pendurados (dobra trinca o chumbo). Peça o registro da última inspeção de integridade dos aventais.', f: R611 + ', arts. 57 a 59 e 61; IN Anvisa nº 91/2021, art. 9º (teste semestral na radiologia intervencionista)'}
  ],
  monitoracao: [
    {t: 'O que pedir: o laudo de levantamento radiométrico (croqui, equipamento, instrumentos calibrados, leituras, conclusões, assinaturas) e os relatórios mensais de dosimetria dos últimos meses. Confira se todo trabalhador exposto aparece no relatório e se o dosímetro padrão fica guardado com os demais, em área livre.', f: R611 + ', arts. 63 a 66 e 69'}
  ],
  imagens: [
    {t: 'O que verificar: se os laudos são feitos em monitor específico para laudo (não em tela comum de computador), se há armazenamento das imagens digitais e, na telerradiologia, o contrato, o consentimento do paciente e a transmissão em padrão DICOM.', f: R611 + ', arts. 70 a 74'}
  ],
  proibicoes: [
    {t: 'Durante a visita, observe um exame: ninguém deve segurar o receptor de imagem com a mão, só um equipamento opera por vez na sala e equipamento móvel não fica fixo na sala sem justificativa de urgência.', f: R611 + ', arts. 80 a 83'}
  ],
  conv: [
    {t: 'Na sala de raios X convencional, confira no próprio equipamento: luz de campo funcionando, indicação de kV, mA e tempo (ou mAs) no painel, grade no bucky, sinal sonoro e luminoso no disparo e a tabela de exposição colada no comando.', f: 'IN Anvisa nº 90/2021, arts. 2º, 7º, 8º e 11'}
  ]
};
MAIS.conv = ORIENT.conv;
const copia = x => JSON.parse(JSON.stringify(x));
function monta(m) {
  const x = MOD[m], ion = ION.includes(m);
  const de = lista => copia(lista).filter(q => !q.m || q.m.includes(m)).map(q => { delete q.m; return q; });
  const item = (id, titulo, curto, perguntas, extra) => {
    const it = Object.assign({id, titulo, curto}, extra || {}, {perguntas: de(perguntas)});
    if (!it.perguntas.length) delete it.perguntas;
    return it;
  };
  const secoes = [
    {id: 'ident', titulo: 'Identificação e perfil', curto: 'Identificação', icone: 'building',
      descricao: 'Dados do serviço e o que ele faz. O perfil marca “Não se aplica” no que não existir.',
      itens: [
        {id: 'dados', titulo: 'Dados do serviço e da inspeção', curto: 'Dados', campos: dados(m)},
        {id: 'perfil', titulo: 'Perfil do serviço', curto: 'Perfil', campos: perfil(m)}
      ]},
    {id: 'org', titulo: 'Organização e documentação', curto: 'Organização', icone: 'folder', itens: [
      Object.assign(item('org', 'Licença, responsáveis, programas e projeto', 'Organização', ORG), {orient: copia(ORIENT.org)}),
      Object.assign(item('pessoal', 'Equipe e educação permanente', 'Equipe', PESSOAL), {orient: copia(ORIENT.pessoal)})
    ]},
    {id: 'qualidade', titulo: 'Garantia da qualidade', curto: 'Qualidade', icone: 'shield', itens: [
      Object.assign(item('equipamentos', 'Equipamentos e testes', 'Equipamentos', QUALIDADE.slice(0, 6)), {
        descricao: 'Liste os equipamentos: busque pelo registro na Anvisa ou pelo processo, ou digite os dados, com as datas do último teste de constância' + (ion ? ' e do levantamento radiométrico' : '') + '. A lista sai em tabela no relatório.',
        campos: [{id: 'equip_lista', rotulo: 'Equipamentos em uso', tipo: 'equipamentos', perfil: 'imagem', largo: true, tipos: x.tipos, omite: ion ? [] : ['levantamento']}],
        orient: copia(MAIS.testes)}),
      Object.assign(item('processos', 'Procedimentos e gerenciamento de riscos', 'Riscos', QUALIDADE.slice(6)), {orient: copia(ORIENT.processos)})
    ]}
  ];
  if (ion) secoes.push({id: 'protecao', titulo: 'Proteção radiológica', curto: 'Proteção radiológica', icone: 'shield', itens: [
    Object.assign(item('ppr', 'Programa, sala e sinalização', 'Sala e sinalização', PROTECAO.slice(0, 6)), {orient: copia(MAIS.protecao)}),
    Object.assign(item('epi', 'Acompanhantes, EPI e blindagem', 'EPI', PROTECAO.slice(6, 9)), {orient: copia(ORIENT.epi)}),
    Object.assign(item('monitoracao', 'Levantamento radiométrico e dosimetria', 'Dosimetria', PROTECAO.slice(9)), {orient: copia(ORIENT.monitoracao)})
  ]});
  secoes.push({id: 'laudos', titulo: 'Imagens e laudos', curto: 'Imagens', icone: 'check', itens: [
    Object.assign(item('imagens', 'Registro, laudo, telerradiologia e itinerante', 'Imagens e laudos', IMAGENS), {orient: copia(ORIENT.imagens)})
  ]});
  /* cTodos: com todas as perguntas do item em “Atende”, uma frase só no relatório (diretriz de 20/10/2026) */
  const filme = ['conv', 'mamo'].includes(m);
  if (ion) secoes[secoes.length - 1].itens.push(Object.assign(item('proibicoes', 'Vedações e controle da exposição', 'Vedações', PROIBE), {orient: copia(ORIENT.proibicoes)},
    filme ? {cTodos: 'Os equipamentos e as práticas observados respeitam as vedações da RDC 611/2022: os cassetes têm tela intensificadora, o receptor de imagem fica em suporte durante a exposição, o equipamento móvel é usado como móvel e os geradores são de onda completa ou de alta frequência. O processamento dos filmes é automático, e o controle da duração da exposição é eletrônico, limitado a 5 segundos e permite interromper a exposição.'} : {}));
  secoes.push({id: 'modalidade', titulo: x.titulo + ' (' + x.inN + ')', curto: 'Modalidade', icone: 'lab',
    descricao: 'Requisitos próprios da modalidade. Na pergunta de condições que inabilitam o uso, marque “Não atende” no ponto encontrado.', itens: [
      Object.assign(item('especifica', 'Requisitos da ' + x.inN, x.inN, ESPEC[m]), MAIS[m].length ? {orient: copia(MAIS[m])} : {})
    ]});
  const usadas = new Set();
  secoes.forEach(s => s.itens.forEach(i => (i.perguntas || []).forEach(q => (q.inf || []).forEach(f => usadas.add(f)))));
  const infracoes = copia(INFRACOES).filter(i => usadas.has(i.id));
  infracoes.forEach(i => { if (INF_IN[m][i.id]) i.r = INF_IN[m][i.id].concat(i.r); });
  lei13725(secoes, infracoes);
  return {
    app: x.app, titulo: x.titulo, tituloCurto: x.curto, store: 'uvis-' + x.app + '-v1',
    respostas: 'simnao', naSempre: true, estilo: 'pb', relSemNa: true, perfilRotulo: 'Atividades',
    /* irregularidade sem artigo próprio da Lei 13.725/2004: art. 63 */
    leiBase: [LM(63)],
    relatorio: {
      titulo: 'RELATÓRIO DE INSPEÇÃO SANITÁRIA', subtitulo: 'Diagnóstico por imagem — ' + x.titulo + ' (RDC Anvisa nº 611/2022 e ' + x.inN + ')',
      objetivo: 'Verificar as condições de funcionamento do serviço de ' + x.desc + ', nos termos da RDC Anvisa nº 611/2022 e da ' + x.inN + (m === 'mamo' ? ', e o cumprimento do Programa Nacional de Qualidade em Mamografia' : '') + (m === 'hemo' ? ', e da RDC Anvisa nº 36/2013 (segurança do paciente)' : '') + '.',
      conclusao: 'Diante do exposto, o serviço de diagnóstico por imagem foi avaliado conforme os itens acima. As irregularidades relacionadas devem ser corrigidas nos prazos fixados pela autoridade sanitária.'
    },
    normas: [
      ['RDC Anvisa nº 611/2022', 'Requisitos sanitários para a organização e o funcionamento de serviços de radiologia diagnóstica ou intervencionista.'],
      [x.inN, 'Requisitos sanitários para a garantia da qualidade e da segurança em sistemas de ' + x.desc + '.'],
      m === 'mamo' ? ['Portaria de Consolidação GM/MS nº 5/2017', 'Programa Nacional de Qualidade em Mamografia (arts. 206 a 224).'] : null,
      m === 'hemo' ? ['RDC Anvisa nº 36/2013', 'Ações para a segurança do paciente em serviços de saúde.'] : null,
      ['Lei Municipal nº 13.725/2004', 'Código Sanitário do Município de São Paulo.']
    ].filter(Boolean),
    secoes, infracoes
  };
}
module.exports = ['conv', 'mamo', 'tc', 'rm', 'us', 'hemo'].map(monta);
module.exports.monta = monta;
