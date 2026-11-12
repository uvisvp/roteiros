/* Serviço de estética (núcleo Serviços) — roteiro no padrão dos demais (pedido de 18/10/2026).
   Perguntas: os 25 indicadores do Roteiro Objetivo de Inspeção da Anvisa “Serviços de Estética
   classificados como Serviços de Saúde” (versão 1.3, 16/12/2025), sem a pontuação de 0 a 5 nem a
   classificação crítico/não crítico: cada indicador vira a pergunta do nível 3 (o que a norma
   exige), com o marco regulatório do ROI nas citações e os níveis 0 a 2 como pontos do checklist.
   O perfil do início (serviço de saúde ou de interesse à saúde) filtra o roteiro e o catálogo de
   infrações: no interesse à saúde ficam as perguntas cabíveis, com a Lei Federal 13.643/2018, a
   RDC 222/2018, a Lei 6.360/1976 e o Código Sanitário Municipal. Infrações: o catálogo do antigo
   módulo de Estética (estetica/infracoes.json), com a capitulação já redigida e a constatação.
   Textos dos dispositivos: estetica/legislacao.json (scripts/estetica-legislacao.cjs).
   Normas que o ROI cita sem texto no banco do app (RDC 50/2002, Portaria GM/MS 888/2021,
   RE 2.606/2006) ficam nas orientações técnicas, com a fonte. */
'use strict';
const CAT = require('./infracoes.json');
const LM = (a, ...r) => 'lei-municipal-13725-2004::artigo::' + a + (r.length ? '::' + r.join('::') : '');
const N = lei => (...nos) => nos.map(n => lei + '::' + n);
const R63 = N('rdc-anvisa-63-2011'), R509 = N('rdc-anvisa-509-2021'), R222 = N('rdc-anvisa-222-2018'), R42 = N('rdc-anvisa-42-2010');
const R15 = N('rdc-anvisa-15-2012'), R156 = N('rdc-anvisa-156-2006'), R67 = N('rdc-anvisa-67-2007'), R751 = N('rdc-anvisa-751-2022'), P344 = N('portaria-svs-ms-344-1998');
const L13643 = N('lei-federal-13643-2018'), L6360 = N('lei-federal-6360-1976');
const SN = [['sim', 'Sim'], ['nao', 'Não']];
const SAUDE = {campo: 'p_tipo', igual: 'saude'}, INT = {campo: 'p_tipo', igual: 'interesse'};
const NAO = campo => ({campo, igual: 'nao'});
const ROI = 'Roteiro Objetivo de Inspeção — Serviços de Estética classificados como Serviços de Saúde (Anvisa, versão 1.3, 16/12/2025)';
/* esteticista: biossegurança e legislação sanitária (Lei 13.643, art. 8º) + Código Sanitário, art. 69 */
const INT_BIO = [...L13643('a8'), LM(69)];

/* Inventário dos ambientes (como na academia): os ambientes que o estabelecimento possui e,
   em cada um, só as irregularidades encontradas — uma irregularidade por linha. A mesma lista
   serve aos dois perfis; muda o fundamento: no serviço de saúde, a RDC 63/2011 (e a RDC 42/2010
   na preparação alcoólica) com os arts. 61 a 65 da Lei 13.725; no interesse à saúde, a Lei
   13.643/2018, art. 8º, com o art. 69. Resíduos: RDC 222/2018 nos dois. [id, texto, saúde, interesse]
   — fundamento: [refs, infração]; null: a linha não vale para o perfil. */
const AMBIENTES = ['Recepção e espera', 'Sala de procedimentos', 'Sanitário', 'DML (material de limpeza)', 'Processamento de instrumentais', 'Guarda de produtos e materiais', 'Copa'];
const EST = [[...R63('a36'), LM(65)], 's26'], EST_I = [INT_BIO, 'i21'];
const LISTA_AMB = [
  ['—', 'Estrutura e conservação'],
  ['piso', 'Piso danificado', EST, EST_I],
  ['parede', 'Paredes danificadas', EST, EST_I],
  ['teto', 'Teto ou forro danificado', EST, EST_I],
  ['infiltra', 'Infiltração ou umidade', EST, EST_I],
  ['mofo', 'Mofo ou bolor', EST, EST_I],
  ['movel', 'Mobiliário ou maca danificados', EST, EST_I],
  ['—', 'Limpeza e organização'],
  ['sujo', 'Ambiente sujo', [[...R63('a52'), LM(61)], 's52'], EST_I],
  ['desorg', 'Ambiente desorganizado', [[...R63('a36'), LM(63)], 's26'], [INT_BIO, 'i22']],
  ['alheio', 'Objetos alheios à atividade', [[...R63('a36'), LM(63)], 's26'], [INT_BIO, 'i22']],
  ['—', 'Instalações'],
  ['fios', 'Fiação elétrica exposta', EST, EST_I],
  ['luz', 'Iluminação insuficiente', [[...R63('a38'), LM(63)], 's27'], [INT_BIO, 'i24']],
  ['vent', 'Ventilação insuficiente', [[...R63('a38'), LM(63)], 's27'], [INT_BIO, 'i24']],
  ['—', 'Higiene das mãos'],
  ['pia', 'Sem pia para higiene das mãos', [[...R63('a59'), LM(61)], 's47'], [INT_BIO, 'i27']],
  ['sabonete', 'Pia sem sabonete líquido', [[...R63('a59'), LM(61)], 's47'], [INT_BIO, 'i27']],
  ['papel', 'Pia sem papel toalha', [[...R63('a59'), LM(61)], 's47'], [INT_BIO, 'i27']],
  ['alcool', 'Sem preparação alcoólica no ponto de assistência', [[...R42('a5'), LM(61)], 's48'], null],
  ['—', 'Pragas e resíduos'],
  ['pragas', 'Sinais de pragas (insetos, roedores, fezes)', [[...R63('a63'), LM(61)], 's28'], [INT_BIO, 'i25']],
  ['lixeira', 'Lixeira sem tampa de abertura sem contato manual', [[...R222('a17'), LM(62)], 's68'], [[...R222('a17'), LM(69)], 'i33']],
  ['perfuro', 'Perfurocortante descartado fora de coletor rígido', [[...R222('a86'), LM(62)], 's68'], [[...R222('a86'), LM(69)], 'i33']],
  ['coletor', 'Coletor de perfurocortante acima de 3/4 da capacidade', [[...R222('a87'), LM(62)], 's68'], [[...R222('a87'), LM(69)], 'i33']]
];
const inventario = (id, saude) => ({id, rotulo: 'Ambientes do estabelecimento', tipo: 'ambientes', largo: true, ambientes: AMBIENTES,
  r: saude ? EST[0] : INT_BIO, inf: [saude ? 's26' : 'i21'],
  lista: LISTA_AMB.filter(x => x[0] === '—' || x[saude ? 2 : 3]).map(x => x[0] === '—' ? x : [x[0], x[1], x[saude ? 2 : 3][0], [x[saude ? 2 : 3][1]]])});

const secoes = [
  {
    id: 'ident', titulo: 'Identificação e perfil', curto: 'Identificação', icone: 'building',
    descricao: 'Dados do estabelecimento e a classificação do serviço. A classificação abre as verificações e o catálogo de infrações correspondente.',
    itens: [
      {id: 'dados', titulo: 'Dados do estabelecimento e da inspeção', curto: 'Dados',
        campos: [
          {id: 'razao', rotulo: 'Razão social'}, {id: 'fantasia', rotulo: 'Nome fantasia'},
          {id: 'cnpj', rotulo: 'CNPJ', tipo: 'cnpj'}, {id: 'endereco', rotulo: 'Endereço', largo: true},
          {id: 'cmvs', rotulo: 'Licença sanitária / CMVS nº'},
          {id: 'rl', rotulo: 'Responsável legal'}, {id: 'rt', rotulo: 'Responsável técnico (nome e conselho)'},
          {id: 'horario', rotulo: 'Horário de funcionamento'},
          {id: 'procedimentos', rotulo: 'Procedimentos oferecidos', largo: true},
          {id: 'data', rotulo: 'Data da inspeção', tipo: 'date'}, {id: 'acompanhou', rotulo: 'Acompanhou a inspeção'},
          {id: 'equipe', rotulo: 'Equipe de inspeção', largo: true}
        ]},
      {id: 'perfil', titulo: 'Classificação e perfil do serviço', curto: 'Perfil',
        descricao: 'Comece pela classificação: ela abre as verificações do roteiro. As demais respostas marcam “Não se aplica” no que o serviço não faz (pode ser alterado depois).',
        campos: [
          {id: 'p_tipo', rotulo: 'Classificação do serviço', tipo: 'select', largo: true,
            opcoes: [['saude', 'Serviço de saúde — procedimentos estéticos executados por profissional de saúde'], ['interesse', 'Serviço de interesse à saúde — estética e embelezamento sem profissional de saúde']],
            desc: {saude: 'serviço de estética classificado como serviço de saúde', interesse: 'serviço de estética e embelezamento de interesse à saúde'}},
          {id: 'p_equip', rotulo: 'Usa equipamentos estéticos (laser, luz pulsada, radiofrequência, ultrassom, criolipólise etc.)?', tipo: 'select', opcoes: SN, desc: {sim: 'uso de equipamentos estéticos'}},
          {id: 'p_proc', rotulo: 'Instrumentais reutilizáveis: onde são processados?', tipo: 'select',
            opcoes: [['interno', 'No próprio estabelecimento'], ['externo', 'Em empresa processadora (terceirizado)'], ['ambos', 'Parte no local, parte terceirizado'], ['nao', 'Não há: só material de uso único']],
            desc: {interno: 'processamento de instrumentais no local', externo: 'processamento terceirizado de instrumentais', ambos: 'processamento de instrumentais no local e terceirizado'}},
          {id: 'p_med', rotulo: 'Usa ou administra medicamentos (inclusive injetáveis e anestésicos)?', tipo: 'select', opcoes: SN, desc: {sim: 'uso de medicamentos'}},
          {id: 'p_manip', rotulo: 'Usa medicamentos manipulados?', tipo: 'select', opcoes: SN, desc: {sim: 'uso de medicamentos manipulados'}},
          {id: 'p_344', rotulo: 'Mantém medicamentos sujeitos a controle especial (Portaria 344/1998)?', tipo: 'select', opcoes: SN, desc: {sim: 'medicamentos sujeitos a controle especial'}},
          {id: 'p_terc', rotulo: 'Tem serviços terceirizados (limpeza, resíduos, manutenção, esterilização etc.)?', tipo: 'select', opcoes: SN, desc: {sim: 'serviços terceirizados'}}
        ],
        orient: [
          {t: 'Serviço de saúde é o estabelecimento destinado a prestar assistência à população na prevenção de doenças, no tratamento, na recuperação e na reabilitação. O serviço de estética em que o procedimento é executado por profissional de saúde, dentro do que o respectivo conselho autoriza, segue as boas práticas da RDC 63/2011 e é o objeto do ROI de Estética da Anvisa.', f: 'RDC Anvisa nº 63/2011, art. 4º, XII; ' + ROI},
          {t: 'Técnico em estética e esteticista e cosmetólogo trabalham com produtos cosméticos, técnicas e equipamentos com registro na Anvisa; a lei deles não abrange a estética médica. O estabelecimento só com esses profissionais é de interesse à saúde: cumpre a biossegurança e a legislação sanitária, mas não as exigências próprias de serviço de saúde (RT de nível superior, prontuário, plano de segurança do paciente).', f: 'Lei Federal nº 13.643/2018, arts. 1º, parágrafo único, 5º, I, e 8º; Lei Municipal nº 13.725/2004, art. 69'},
          {t: 'A Nota Técnica nº 2/2024/GGTES/Anvisa (orientações sobre serviços de estética e embelezamento) está suspensa desde 23/09/2026, enquanto um Grupo de Trabalho reavalia o tema. As normas sanitárias continuam valendo, e a suspensão não autoriza procedimento, produto ou prática vedados. Este roteiro não usa a nota: a classificação se apoia nas normas citadas.', f: 'Anvisa, notícia “Anvisa suspende temporariamente Nota Técnica sobre serviços de estética” (23/09/2026)'}
        ]}
    ]
  },
  {
    id: 'regular', titulo: 'Licença, responsabilidade técnica e pessoal', curto: 'Licença e pessoal', icone: 'people',
    descricao: 'Indicadores 1 a 4 do ROI: licença sanitária, responsável técnico, profissionais e capacitação.',
    itens: [
      {id: 'licenca', titulo: 'Licença sanitária', curto: 'Licença',
        perguntas: [
          {id: 'lic', se: SAUDE, t: 'O serviço possui licença sanitária atualizada, afixada em local visível ao público e que contempla todas as atividades (CNAEs) executadas?', r: [...R63('a10'), LM(90), LM(90, 'paragrafo', '1')],
            c: 'O serviço possui licença sanitária atualizada, afixada em local visível e compatível com as atividades executadas.', nc: 'A licença sanitária do serviço não atende às exigências.',
            pontos: [['vigente', 'licença sanitária vigente (ou renovação pedida no prazo)', 'O serviço não possui licença sanitária vigente.'], ['visivel', 'afixada em local visível ao público', 'A licença sanitária não está afixada em local visível ao público.'], ['atividades', 'contempla todas as atividades executadas', 'O serviço realiza procedimentos que não constam da licença sanitária.']],
            inf: ['s01', 's02', 's03']},
          {id: 'lic_i', se: INT, t: 'O estabelecimento possui inscrição no CMVS ou licença sanitária, quando exigível, compatível com as atividades executadas?', r: [LM(90), LM(90, 'paragrafo', '1')],
            c: 'O estabelecimento possui cadastro ou licença sanitária compatível com as atividades executadas.', nc: 'O estabelecimento não atende às exigências de cadastro e licenciamento sanitário.',
            pontos: [['cadastro', 'CMVS ou licença sanitária', 'O estabelecimento não possui CMVS ou licença sanitária.'], ['atividades', 'compatível com as atividades executadas', 'O estabelecimento executa atividades não declaradas à vigilância sanitária.']],
            inf: ['i01', 'i02']}
        ]},
      {id: 'rt', se: SAUDE, titulo: 'Responsável técnico e profissional legalmente habilitado', curto: 'Responsável técnico',
        perguntas: [
          {id: 'rt_q', t: 'O serviço dispõe de responsável técnico e substituto de nível superior, designados conforme os respectivos conselhos, e de profissional legalmente habilitado que responda pelas questões operacionais durante todo o funcionamento?', r: [...R63('a14', 'a16', 'a31'), LM(92)],
            c: 'O serviço dispõe de responsável técnico e substituto, e de profissional legalmente habilitado durante todo o funcionamento.', nc: 'A responsabilidade técnica do serviço não atende às exigências.',
            pontos: [['rt', 'responsável técnico de nível superior', 'O serviço não possui responsável técnico.'], ['subst', 'responsável técnico substituto', 'O serviço não possui responsável técnico substituto.'], ['operacional', 'profissional legalmente habilitado durante todo o funcionamento', 'Não há profissional legalmente habilitado respondendo pelas questões operacionais durante todo o funcionamento.'], ['cadastro', 'RT e substituto iguais aos registrados na vigilância sanitária', 'O responsável técnico ou o substituto difere do registrado na vigilância sanitária.']],
            inf: ['s04', 's05', 's06']}
        ]},
      {id: 'rh', titulo: 'Profissionais', curto: 'Profissionais',
        perguntas: [
          {id: 'rh_s', se: SAUDE, t: 'Os profissionais de saúde que atuam no serviço são legalmente habilitados, têm registro no conselho de classe e só realizam procedimentos estéticos autorizados por ele, com os comprovantes disponíveis?', r: [...R63('a17', 'a31'), LM(64)],
            c: 'Os profissionais de saúde são legalmente habilitados, registrados no conselho e atuam nos limites autorizados, com comprovantes disponíveis.', nc: 'Os profissionais de saúde do serviço não atendem às exigências de habilitação.',
            pontos: [['habilitados', 'legalmente habilitados para as atividades', 'Há profissionais de saúde sem habilitação para as atividades executadas.'], ['conselho', 'registro no conselho de classe', 'Há profissionais de saúde sem registro no conselho de classe.'], ['limites', 'procedimentos autorizados pelo conselho', 'Há profissionais de saúde realizando procedimentos estéticos não autorizados pelo seu conselho de classe.'], ['comprovantes', 'comprovantes disponíveis', 'Os comprovantes de formação e registro dos profissionais não foram apresentados.']],
            inf: ['s07', 's08', 's09']},
          {id: 'rh_i', se: INT, t: 'Quem executa os procedimentos tem a formação exigida (técnico em estética, esteticista e cosmetólogo) e trabalha só com cosméticos, técnicas e equipamentos registrados, nos limites da profissão, com comprovantes disponíveis?', r: [...L13643('a3', 'a4', 'a5', 'a5-i', 'a6'), LM(69)],
            c: 'Os procedimentos são executados por profissionais com formação compatível, nos limites da Lei 13.643/2018, com comprovantes disponíveis.', nc: 'Os profissionais que executam os procedimentos não atendem às exigências de formação e de limites de atuação.',
            pontos: [['formacao', 'formação de técnico em estética ou de esteticista e cosmetólogo', 'Há procedimento estético executado por pessoa sem a formação exigida.'], ['comprovantes', 'comprovantes de formação disponíveis', 'Os comprovantes de formação dos profissionais não foram apresentados.'], ['injetavel', 'sem medicamento ou substância injetável', 'Esteticista ou técnico em estética administra medicamento ou substância injetável.'], ['cosmeticos', 'só produtos cosméticos regularizados', 'Esteticista ou técnico em estética usa produto que não é cosmético.']],
            inf: ['i03', 'i04', 'i05', 'i06']}
        ],
        orient: [
          {t: 'Confira o registro de cada profissional de saúde no site do respectivo conselho e se o procedimento observado está entre os que o conselho autoriza àquela profissão.', f: 'RDC Anvisa nº 63/2011, art. 31; ' + ROI + ', indicador 3'},
          {t: 'Técnico em estética: curso técnico em estética. Esteticista e cosmetólogo: curso superior em estética e cosmética. Ambos usam produtos cosméticos, técnicas e equipamentos com registro na Anvisa; o esteticista e cosmetólogo pode ser responsável técnico de centro de estética. Procedimento invasivo e aplicação de injetáveis ficam fora dessas atribuições.', f: 'Lei Federal nº 13.643/2018, arts. 3º a 6º'}
        ]},
      {id: 'capacita', se: SAUDE, titulo: 'Capacitação de pessoal', curto: 'Capacitação',
        perguntas: [
          {id: 'cap', t: 'O serviço capacita os profissionais antes do início das atividades e de forma permanente, com registro de data, horário, carga horária, conteúdo, instrutor e participantes?', r: [...R63('a32', 'a32pu', 'a33'), LM(64)],
            c: 'O serviço capacita os profissionais antes do início das atividades e de forma permanente, com registros completos.', nc: 'A capacitação dos profissionais não atende às exigências.',
            pontos: [['registro', 'registros de capacitação', 'Não há registro de capacitação dos profissionais.'], ['todos', 'abrange todos os profissionais', 'Há registros de capacitação só de parte dos profissionais.'], ['dados', 'registros completos e com temas das atividades do serviço', 'Os registros de capacitação estão incompletos ou não tratam das atividades do serviço.']],
            inf: ['s10', 's11']}
        ]}
    ]
  },
  {
    id: 'documentos', titulo: 'Procedimentos, prontuário e segurança do paciente', curto: 'POP e prontuário', icone: 'folder',
    descricao: 'Indicadores 7, 8 e 9 do ROI.',
    itens: [
      {id: 'pops', titulo: 'Procedimentos Operacionais Padrão (POPs)', curto: 'POPs',
        perguntas: [
          {id: 'pop_s', se: SAUDE, t: 'O serviço dispõe de POPs para todos os procedimentos realizados, aprovados, vigentes, atualizados e disponíveis à equipe?', r: [...R63('a7-ii-d', 'a23-xviii', 'a51'), LM(63)],
            c: 'O serviço dispõe de POPs aprovados, vigentes, atualizados e disponíveis para todos os procedimentos.', nc: 'Os POPs do serviço não atendem às exigências.',
            pontos: [['todos', 'POP de todos os procedimentos realizados', 'Não há POP para todos os procedimentos realizados.'], ['atualizados', 'aprovados, vigentes e atualizados', 'Há POPs desatualizados ou em elaboração.'], ['acesso', 'disponíveis à equipe', 'Os POPs não estão disponíveis à equipe.']],
            inf: ['s12', 's13']},
          {id: 'pop_i', se: INT, t: 'O estabelecimento dispõe de procedimentos escritos e atualizados para as atividades realizadas (procedimentos, limpeza, processamento de instrumentais)?', r: [...INT_BIO],
            c: 'O estabelecimento dispõe de procedimentos escritos e atualizados para as atividades realizadas.', nc: 'O estabelecimento não dispõe de procedimentos escritos e atualizados para as atividades realizadas.',
            inf: ['i26']}
        ]},
      {id: 'prontuario', se: SAUDE, titulo: 'Prontuário do paciente', curto: 'Prontuário',
        perguntas: [
          {id: 'pront', t: 'Há prontuário (físico ou eletrônico) de todos os pacientes, identificado e assinado pelo profissional, com data, procedimento, região tratada, produto (lote, validade, volume) ou equipamento usado e intercorrências, acessível ao paciente e à autoridade sanitária?', r: [...R63('a24', 'a25', 'a26', 'a27', 'a28'), LM(68)],
            c: 'Há prontuário completo de todos os pacientes, identificado, assinado e acessível.', nc: 'Os prontuários do serviço não atendem às exigências.',
            pontos: [['todos', 'prontuário de todos os pacientes', 'Não há prontuário de todos os pacientes.'], ['profissional', 'identificação e assinatura do profissional', 'O prontuário não identifica o profissional que realizou o procedimento.'], ['conteudo', 'procedimento, região, produto (lote, validade, volume) ou equipamento e intercorrências', 'O prontuário não registra o procedimento, o produto ou o equipamento usado e as intercorrências.'], ['legivel', 'informações legíveis e completas', 'O prontuário tem informações ilegíveis ou ausentes.'], ['acesso', 'guardado e acessível ao paciente e à autoridade sanitária', 'O prontuário não é guardado de forma acessível ao paciente e à autoridade sanitária.']],
            inf: ['s14', 's15', 's16', 's17', 's18', 's38']}
        ]},
      {id: 'seguranca', se: SAUDE, titulo: 'Plano de segurança do paciente', curto: 'Segurança do paciente',
        perguntas: [
          {id: 'psp', t: 'O serviço possui e implementa plano de segurança do paciente e protocolos voltados à prevenção de eventos adversos dos procedimentos realizados (identificação do paciente, higiene das mãos, uso seguro de medicamentos)?', r: [...R63('a8', 'a8-i', 'a8-ii', 'a8-iii', 'a8-v'), LM(63)],
            c: 'O serviço possui e implementa plano de segurança do paciente e protocolos de prevenção de eventos adversos.', nc: 'O plano de segurança do paciente não atende às exigências.',
            pontos: [['plano', 'plano de segurança do paciente', 'O serviço não possui plano de segurança do paciente.'], ['atual', 'plano atualizado', 'O plano de segurança do paciente está em elaboração ou desatualizado.'], ['protocolos', 'protocolos implementados', 'Há protocolos de segurança do paciente não implementados.']],
            inf: ['s19', 's20', 's21']}
        ]}
    ]
  },
  {
    id: 'equip', titulo: 'Equipamentos e tecnologias', curto: 'Equipamentos', icone: 'lab',
    descricao: 'Indicadores 5 e 6 do ROI.',
    itens: [
      /* a lista de equipamentos é campo: sem a condição, o item apareceria antes de escolher o perfil */
      {id: 'equipamentos', se: {campo: 'p_tipo', em: ['saude', 'interesse']}, titulo: 'Gestão dos equipamentos', curto: 'Equipamentos',
        descricao: 'Liste os equipamentos estéticos: busque pelo registro ou pelo processo na Anvisa, ou digite os dados. A lista sai em tabela no relatório.',
        campos: [{id: 'equip_lista', rotulo: 'Equipamentos estéticos em uso', tipo: 'equipamentos', perfil: 'estetica', largo: true,
          tipos: ['Laser', 'Luz intensa pulsada (LIP)', 'Radiofrequência', 'Ultrassom / ultrassom focado (HIFU)', 'Criolipólise', 'Eletroterapia / correntes', 'Dermógrafo / microagulhamento', 'Autoclave', 'Outro']}],
        perguntas: [
          {id: 'eq_s', se: SAUDE, t: 'Os equipamentos usados nos procedimentos são regularizados na Anvisa, catalogados, em boas condições, usados só para o fim a que se destinam, por pessoal qualificado e conforme o fabricante, com manutenção preventiva e corretiva registrada?', r: [...R63('a7-ii-c', 'a23-ix', 'a53', 'a55'), ...R751('a2'), LM(65)],
            c: 'Os equipamentos são regularizados, catalogados, em boas condições, usados na finalidade e com manutenção registrada.', nc: 'A gestão dos equipamentos do serviço não atende às exigências.',
            naSe: NAO('p_equip'), na: 'O serviço não usa equipamentos estéticos.',
            pontos: [['regular', 'regularizados na Anvisa', 'Há equipamento sem regularização na Anvisa.'], ['condicoes', 'em boas condições de operação', 'Há equipamento sem boas condições de operação.'], ['finalidade', 'usados só para o fim a que se destinam, por pessoal qualificado', 'Há equipamento usado fora da finalidade ou por profissional não qualificado.'], ['manutencao', 'manutenção preventiva e corretiva registrada, conforme o fabricante', 'Não há registro de manutenção preventiva e corretiva dos equipamentos.']],
            inf: ['s31', 's32', 's33', 's34']},
          {id: 'eq_i', se: INT, t: 'Os equipamentos estéticos têm registro na Anvisa, estão em condições seguras e de higiene, são usados na finalidade indicada pelo fabricante, por profissional habilitado, com manutenção comprovada?', r: [...L6360('a12'), ...L13643('a5-i'), LM(46), LM(50)],
            c: 'Os equipamentos estéticos são registrados, seguros, usados na finalidade e com manutenção comprovada.', nc: 'Os equipamentos estéticos não atendem às exigências.',
            naSe: NAO('p_equip'), na: 'O estabelecimento não usa equipamentos estéticos.',
            pontos: [['registro', 'registro na Anvisa', 'Há equipamento estético sem registro na Anvisa.'], ['condicoes', 'condições seguras e de higiene', 'Há equipamento sem condições seguras de funcionamento ou de higiene.'], ['finalidade', 'usado na finalidade, por profissional habilitado', 'Há equipamento usado fora da finalidade indicada pelo fabricante ou por profissional sem habilitação.'], ['manutencao', 'manutenção comprovada', 'Não foram apresentados os comprovantes de manutenção dos equipamentos.']],
            inf: ['i07', 'i12', 'i13', 'i14', 'i15', 'i16', 'i17']}
        ],
        orient: [
          {t: 'Equipamentos que emitem energia (laser, luz intensa pulsada, radiofrequência, ultrassom, criolipólise) são dispositivos médicos: precisam de notificação ou registro na Anvisa, conforme a classe de risco. Confira o número na etiqueta ou no manual com a busca deste item ou na Central de Consultas.', f: 'Lei Federal nº 6.360/1976, art. 12; RDC Anvisa nº 751/2022, art. 2º'},
          {t: 'Peça o manual em português, o plano ou os registros de manutenção e confira se o uso observado corresponde à finalidade indicada pelo fabricante.', f: 'RDC Anvisa nº 63/2011, arts. 23, IX, e 55; ' + ROI + ', indicador 5'},
          {t: 'São proibidos o uso, a importação, o recebimento em doação, o aluguel e a comercialização de equipamentos de bronzeamento artificial por radiação ultravioleta com finalidade estética. Constatado, marque a infração na aba Infrações (Atividade proibida).', f: 'RDC Anvisa nº 56/2009, art. 1º'}
        ]},
      {id: 'tecnologias', se: SAUDE, titulo: 'Gerenciamento de tecnologias', curto: 'Tecnologias',
        perguntas: [
          {id: 'pgt', t: 'O serviço tem plano de gerenciamento das tecnologias em saúde (equipamentos, produtos para saúde, produtos de higiene, medicamentos e saneantes), sob profissional de nível superior, com seleção, aquisição, armazenamento, instalação, funcionamento, manutenção, notificação de queixas técnicas e eventos adversos, descarte e rastreabilidade?', r: [...R509('a5', 'a5p3', 'a7', 'a7p2'), ...R63('a54'), LM(65)],
            c: 'O serviço gerencia suas tecnologias em saúde com plano completo, sob responsável de nível superior.', nc: 'O gerenciamento de tecnologias do serviço não atende às exigências.',
            pontos: [['plano', 'plano de gerenciamento de tecnologias', 'O serviço não possui plano de gerenciamento de tecnologias.'], ['atual', 'plano atualizado e com as etapas exigidas', 'O plano de gerenciamento de tecnologias está desatualizado ou não atende à RDC 509/2021.'], ['responsavel', 'profissional de nível superior responsável', 'Não há profissional de nível superior responsável pelo plano de gerenciamento de tecnologias.'], ['rastreabilidade', 'rastreabilidade dos produtos', 'Não há rastreabilidade das tecnologias desde o recebimento até o uso e o descarte.']],
            inf: ['s35', 's44']}
        ]}
    ]
  },
  {
    id: 'infra', titulo: 'Estrutura física e condições ambientais', curto: 'Estrutura', icone: 'plan',
    descricao: 'Ambientes do estabelecimento e indicadores 11, 13, 14 e 15 do ROI.',
    itens: [
      /* conservação, limpeza, iluminação, ventilação, higiene das mãos, pragas e resíduos de cada
         ambiente ficam no inventário; as perguntas tratam do que não é de um ambiente só */
      {id: 'ambientes', se: SAUDE, titulo: 'Ambientes e irregularidades', curto: 'Ambientes',
        campos: [inventario('amb_s', true)]},
      {id: 'ambientes_i', se: INT, titulo: 'Ambientes e irregularidades', curto: 'Ambientes',
        campos: [inventario('amb_i', false)]},
      {id: 'estrutura', se: SAUDE, titulo: 'Projeto e estrutura física', curto: 'Estrutura física',
        perguntas: [
          {id: 'pba', t: 'A estrutura física tem projeto básico de arquitetura (PBA) aprovado pela vigilância sanitária, executado e atualizado conforme as atividades, com os ambientes mínimos bem dimensionados?', r: [...R63('a17', 'a34'), LM(63)],
            c: 'A estrutura física corresponde ao PBA aprovado e atualizado, com os ambientes mínimos bem dimensionados.', nc: 'A estrutura física do serviço não atende às exigências.',
            pontos: [['pba', 'PBA aprovado pela vigilância sanitária', 'O serviço não possui projeto básico de arquitetura aprovado.'], ['executado', 'estrutura corresponde ao PBA atualizado', 'A estrutura do serviço não corresponde ao PBA aprovado ou o PBA está desatualizado.'], ['ambientes', 'ambientes mínimos bem dimensionados', 'O serviço não possui os ambientes mínimos para as atividades ou eles estão subdimensionados.']],
            inf: ['s25', 's26']}
        ],
        orient: [
          {t: 'O PBA de serviço de saúde segue a RDC 50/2002 (regulamento técnico para projetos físicos de estabelecimentos assistenciais de saúde), que traz os ambientes, dimensões e instalações exigidos.', f: 'RDC Anvisa nº 50/2002; RDC Anvisa nº 63/2011, art. 34'},
          {t: 'No Município de São Paulo, a avaliação do projeto físico pela vigilância (o antigo Laudo Técnico de Avaliação, LTA) foi substituída pela Declaração de Conformidade Físico-Funcional (DCFF): documento autodeclaratório, sem aprovação nem laudo, assinado pelo responsável legal e pelo engenheiro ou arquiteto, com a ART ou RRT e o memorial descritivo de atividades, exigido na licença inicial, na alteração de endereço e na ampliação que altere a estrutura física e o fluxo.', f: 'Portaria SMS/COVISA nº 404/2024, arts. 3º a 5º; Portaria SMS nº 266/2025, art. 2º, XII, e Anexo IV (documento 17)'},
          {t: 'Quem precisa da DCFF é definido pelo documento 17 na coluna “Documentos” do Anexo I da Portaria SMS nº 266/2025 (site da Covisa, Licenciamento Sanitário – CMVS). Estética não médica, inclusive a de profissional de nível superior da saúde (CNAE 9602-5/02), é licenciada pelo CLI ou por DCA, sem DCFF: não há projeto aprovado a cobrar, e a estrutura é conferida na inspeção. Serviço médico com recursos cirúrgicos ou exames complementares (CNAE 8630-5/01 e 8630-5/02) exige a DCFF: confira-a no processo de licenciamento e se os ambientes vistos correspondem ao declarado.', f: 'Portaria SMS nº 266/2025, art. 13 e Anexo I (CNAE 9602-5/02, 8630-5/01 e 8630-5/02)'}
        ]},
      {id: 'agua', titulo: 'Controle de qualidade da água', curto: 'Água',
        perguntas: [
          {id: 'agua_s', se: SAUDE, t: 'O serviço garante a qualidade da água, limpa os reservatórios a cada seis meses e mantém registro da capacidade e das limpezas?', r: [...R63('a23-vi', 'a39', 'a39p1', 'a39p2'), LM(63)],
            c: 'O serviço garante a qualidade da água, com limpeza semestral e registro dos reservatórios.', nc: 'O controle de qualidade da água não atende às exigências.',
            pontos: [['qualidade', 'documentação do controle de qualidade da água', 'Não há registro do controle de qualidade da água.'], ['limpeza', 'limpeza dos reservatórios a cada seis meses', 'A limpeza dos reservatórios de água não foi feita nos últimos seis meses.'], ['registro', 'registro da capacidade e das limpezas', 'Não há registro da capacidade e da limpeza periódica dos reservatórios.']],
            inf: ['s22', 's23', 's24']},
          {id: 'agua_i', se: INT, t: 'O abastecimento de água é adequado às atividades realizadas?', r: [...INT_BIO],
            c: 'O abastecimento de água é adequado às atividades.', nc: 'O abastecimento de água não é adequado às atividades.', inf: ['i23']}
        ],
        orient: [
          {t: 'O padrão de potabilidade da água para consumo humano é o da Portaria GM/MS nº 888/2021; a limpeza do reservatório é semestral, com registro.', f: 'Portaria GM/MS nº 888/2021; RDC Anvisa nº 63/2011, art. 39, §§ 1º e 2º'}
        ]},
      {id: 'emergencia', se: SAUDE, titulo: 'Situações de emergência', curto: 'Emergência',
        perguntas: [
          {id: 'emerg', t: 'O serviço dispõe de infraestrutura, equipamentos e insumos de suporte à vida, fluxos e protocolos conhecidos para emergências (energia de emergência, rotas de fuga, contrato de serviço de retaguarda para atendimento e remoção do paciente)?', r: [...R63('a51', 'a53', 'a58'), LM(65)],
            c: 'O serviço dispõe de infraestrutura, insumos de suporte à vida, fluxos e protocolos para emergências.', nc: 'O atendimento de situações de emergência não atende às exigências.',
            pontos: [['suporte', 'equipamentos e insumos de suporte à vida', 'O serviço não possui equipamentos e insumos de suporte à vida.'], ['infra', 'energia de emergência, rotas de fuga e retaguarda para remoção', 'O serviço não possui infraestrutura para emergências (energia de emergência, rotas de fuga ou contrato de retaguarda para remoção).'], ['protocolos', 'fluxos e protocolos conhecidos pela equipe', 'Não há fluxos e protocolos de atendimento de emergências.']],
            inf: ['s29', 's30']}
        ]}
    ]
  },
  {
    id: 'bio', titulo: 'Biossegurança, limpeza e resíduos', curto: 'Biossegurança', icone: 'shield',
    descricao: 'Indicadores 10, 12, 16, 22 e 23 do ROI.',
    itens: [
      {id: 'maos', se: SAUDE, titulo: 'Higiene das mãos', curto: 'Higiene das mãos',
        descricao: 'Pias, sabonete, papel toalha e preparação alcoólica de cada ambiente: no inventário dos ambientes (Estrutura).',
        perguntas: [
          {id: 'maos_s', t: 'O serviço estabelece orientações escritas (protocolo) para a higiene das mãos?', r: [...R63('a8-ii'), LM(61)],
            c: 'O serviço estabelece orientações escritas para a higiene das mãos.', nc: 'O serviço não estabelece orientações escritas para a higiene das mãos.',
            inf: ['s49']}
        ]},
      {id: 'epi', titulo: 'Equipamentos de proteção individual (EPI)', curto: 'EPI',
        perguntas: [
          {id: 'epi_s', se: SAUDE, t: 'Os EPIs são fornecidos em número suficiente, adequados às atividades, padronizados nos POPs e usados corretamente?', r: [...R63('a47'), LM(64)],
            c: 'Os EPIs são fornecidos em número suficiente, padronizados e usados corretamente.', nc: 'O fornecimento ou o uso de EPI não atende às exigências.',
            pontos: [['fornece', 'EPI disponível em número suficiente', 'O serviço não dispõe de EPI em número suficiente.'], ['adequado', 'EPI adequado às atividades e padronizado nos POPs', 'O EPI não é adequado às atividades ou não está padronizado.'], ['uso', 'uso correto', 'O EPI é usado de modo inadequado.']],
            inf: ['s50', 's51']},
          {id: 'epi_i', se: INT, t: 'Há EPI compatível com o risco das atividades, e higiene pessoal e vestimenta adequadas?', r: [...INT_BIO],
            c: 'Há EPI compatível com o risco e higiene pessoal e vestimenta adequadas.', nc: 'O EPI, a higiene pessoal ou a vestimenta não é compatível com o risco das atividades.', inf: ['i28', 'i29']}
        ]},
      {id: 'limpeza', titulo: 'Limpeza e desinfecção de áreas e superfícies', curto: 'Limpeza',
        perguntas: [
          {id: 'limp_s', se: SAUDE, t: 'Há POP de limpeza e desinfecção conforme a criticidade das áreas, com registro de treinamento da equipe?', r: [...R63('a51', 'a52'), LM(61)],
            c: 'Há POP de limpeza e desinfecção conforme a criticidade das áreas, com equipe treinada.', nc: 'O POP de limpeza e desinfecção não atende às exigências.',
            pontos: [['pop', 'POP de limpeza conforme a criticidade das áreas', 'Não há POP de limpeza e desinfecção ou ele não considera a criticidade das áreas.'], ['treino', 'registro de treinamento da equipe', 'Não há registro de treinamento da equipe no POP de limpeza.']],
            inf: ['s52']},
          {id: 'limp_i', se: INT, t: 'Mobiliário, equipamentos e utensílios estão limpos e em boas condições de higiene?', r: [...INT_BIO],
            c: 'Mobiliário, equipamentos e utensílios estão limpos.', nc: 'Mobiliário, equipamentos ou utensílios não estão em condições adequadas de higiene.', inf: ['i21', 'i14']}
        ]},
      {id: 'saneantes', titulo: 'Saneantes e cosméticos', curto: 'Saneantes',
        perguntas: [
          {id: 'san_s', se: SAUDE, t: 'Os saneantes usados estão regularizados na Anvisa, constam dos POPs e são usados conforme o fabricante?', r: [...R63('a17', 'a51'), ...L6360('a12'), LM(61)],
            c: 'Os saneantes são regularizados, constam dos POPs e são usados conforme o fabricante.', nc: 'Os saneantes do serviço não atendem às exigências.',
            pontos: [['regular', 'regularizados na Anvisa', 'Há saneante sem regularização na Anvisa.'], ['pop', 'constam dos POPs', 'Os saneantes não constam dos POPs.'], ['uso', 'usados conforme o fabricante', 'Há saneante usado em desacordo com o fabricante.']],
            inf: ['s53', 's54']},
          {id: 'san_i', se: INT, t: 'Cosméticos, saneantes e produtos usados estão regularizados, rotulados e dentro da validade, sem alteração ou deterioração?', r: [...L6360('a12'), LM(46), LM(49), LM(50)],
            c: 'Os produtos usados estão regularizados, rotulados, dentro da validade e íntegros.', nc: 'Os produtos usados não atendem às exigências de regularização, rotulagem e validade.',
            pontos: [['regular', 'regularizados', 'Há produto sem comprovação de regularização sanitária.'], ['rotulo', 'rotulados e identificados', 'Há produto sem rótulo ou identificação.'], ['validade', 'dentro da validade', 'Há produto com prazo de validade expirado.'], ['integro', 'sem alteração ou deterioração', 'Há produto alterado, adulterado ou deteriorado.']],
            inf: ['i07', 'i08', 'i09', 'i10']}
        ]},
      {id: 'residuos', titulo: 'Gerenciamento de resíduos (PGRSS)', curto: 'Resíduos',
        perguntas: [
          {id: 'pgrss_s', se: SAUDE, t: 'O serviço tem PGRSS implementado, que descreve geração, segregação, acondicionamento, coleta, armazenamento, transporte e destinação, condizente com a rotina, e empresa licenciada para coleta e destinação?', r: [...R63('a23-x'), ...R222('a5', 'a6', 'a6-ii', 'a6-xi'), LM(62)],
            c: 'O serviço tem PGRSS implementado, condizente com a rotina, e empresa licenciada para coleta e destinação.', nc: 'O gerenciamento de resíduos do serviço não atende às exigências.',
            pontos: [['pgrss', 'PGRSS elaborado', 'O serviço não possui PGRSS.'], ['completo', 'PGRSS completo e implementado', 'O PGRSS está incompleto ou não implementado.'], ['pratica', 'PGRSS condizente com a rotina', 'O PGRSS não corresponde à rotina do estabelecimento.'], ['empresa', 'empresa licenciada para coleta e destinação', 'Não foi apresentado contrato com empresa licenciada para coleta e destinação dos resíduos.']],
            inf: ['s66', 's67', 's68']},
          {id: 'pgrss_i', se: INT, t: 'O estabelecimento tem PGRSS (ou notificação, se gera só resíduo comum), maneja os resíduos conforme a RDC 222/2018 e mantém o contrato e a licença ambiental da empresa de destinação?', r: [...R222('a2', 'a5', 'a5p1', 'a6-xi'), LM(69)],
            c: 'O estabelecimento tem PGRSS ou notificação, maneja corretamente os resíduos e mantém o contrato da empresa de destinação.', nc: 'O gerenciamento de resíduos do estabelecimento não atende às exigências.',
            pontos: [['pgrss', 'PGRSS ou notificação de resíduo só do Grupo D', 'O estabelecimento não possui PGRSS nem notificação de geração exclusiva de resíduo comum.'], ['manejo', 'segregação, acondicionamento e identificação corretos', 'A segregação, o acondicionamento ou a identificação dos resíduos está em desacordo com a RDC 222/2018.'], ['contrato', 'contrato e licença ambiental da empresa de destinação', 'O PGRSS não traz o contrato e a licença ambiental da empresa de destinação.']],
            inf: ['i32', 'i33', 'i34']}
        ],
        orient: [
          {t: 'A RDC 222/2018 alcança os salões de beleza e estética. Se o serviço gerar só resíduos do Grupo D (comuns), o PGRSS pode ser substituído por notificação dessa condição à vigilância sanitária.', f: 'RDC Anvisa nº 222/2018, arts. 2º e 5º, § 1º'},
          {t: 'Agulhas, lancetas e lâminas vão para recipiente rígido, identificado, com tampa e resistente a punctura, ruptura e vazamento, trocado ao atingir 3/4 da capacidade ou conforme o fabricante.', f: 'RDC Anvisa nº 222/2018, arts. 86 e 87'}
        ]}
    ]
  },
  {
    id: 'proc', titulo: 'Processamento de dispositivos médicos', curto: 'Processamento', icone: 'check',
    descricao: 'Indicadores 17 e 18 do ROI.',
    itens: [
      {id: 'interno', se: {campo: 'p_tipo', em: ['saude', 'interesse']}, titulo: 'Processamento no próprio estabelecimento', curto: 'Processamento interno',
        descricao: 'Do uso ao armazenamento: classificação do material, limpeza, desinfecção, esterilização, monitoramento, identificação dos estéreis e guarda.',
        campos: [
          {id: 'proc_ester', rotulo: 'Esterilização no local — método', tipo: 'select',
            opcoes: [['vacuo', 'Autoclave a vapor com bomba de vácuo (pré-vácuo)'], ['grav', 'Autoclave a vapor gravitacional'], ['estufa', 'Estufa (calor seco)'], ['quimica', 'Esterilização química líquida'], ['nao', 'Não esteriliza no local']]},
          {id: 'proc_autoclave', rotulo: 'Autoclave: marca, modelo e capacidade (litros)', largo: true},
          {id: 'proc_desinf', rotulo: 'Desinfecção de instrumentos ou acessórios', tipo: 'select',
            opcoes: [['quimica', 'Química (imersão em desinfetante)'], ['termica', 'Térmica (termodesinfetadora)'], ['nao', 'Não faz desinfecção']]},
          {id: 'proc_produtos', rotulo: 'Detergente e desinfetante em uso: nome, nº de registro ou notificação na Anvisa, diluição e tempo de contato', largo: true}
        ],
        perguntas: [
          /* ——— serviço de saúde: RDC 15/2012 (CME do serviço de saúde) e RDC 63/2011, art. 57 ——— */
          {id: 'proc_class', se: SAUDE, t: 'Cada produto é processado conforme a sua classificação de risco?', r: [...R15('a11', 'a12', 'a14'), ...R63('a57'), LM(65)],
            c: 'Os produtos são processados conforme a classificação de risco: críticos esterilizados, semicríticos com desinfecção de alto nível, no mínimo, e não críticos limpos.', nc: 'O processamento não corresponde à classificação de risco dos produtos.', ncPontos: 'Não se cumpre a classificação de risco: {}.',
            pontos: [['criticos', 'críticos (penetram pele ou mucosa: agulhas de microagulhamento reutilizáveis, pinças, curetas, extratores) esterilizados', 'Produtos críticos não são esterilizados.'], ['semicriticos', 'semicríticos (contato com mucosa ou pele não íntegra) com desinfecção de alto nível, no mínimo', 'Produtos semicríticos não recebem, no mínimo, desinfecção de alto nível.'], ['naocriticos', 'não críticos (pele íntegra: ponteiras e manoplas de equipamentos) limpos e desinfetados conforme o fabricante', 'Produtos não críticos não são limpos e desinfetados conforme o fabricante.']],
            naSe: {campo: 'p_proc', em: ['externo', 'nao']}, na: 'Não há processamento de instrumentais no local.', inf: ['s57']},
          {id: 'proc_unico', se: SAUDE, t: 'Os produtos de uso único e os de reprocessamento proibido são descartados após o uso?', r: [...R156('a8', 'a8-i', 'a8-ii'), ...R15('a9'), LM(65)],
            c: 'Os produtos de uso único e os de reprocessamento proibido são descartados após o uso, e só se processam produtos regularizados na Anvisa.', nc: 'Há reprocessamento de produto cujo reprocessamento é proibido.', ncPontos: 'Há reprocessamento proibido: {}.',
            pontos: [['rotulo', 'produto com “Proibido Reprocessar” no rótulo descartado após o uso', 'Há reprocessamento de produto rotulado “Proibido Reprocessar”.'], ['lista', 'produto da lista da RE 2.605/2006 (agulhas, lâminas e outros) descartado após o uso', 'Há reprocessamento de produto da lista de reprocessamento proibido da RE 2.605/2006.'], ['regularizado', 'só processa produto regularizado na Anvisa', 'Há processamento de produto não regularizado na Anvisa.']],
            na: 'Só há material de uso único, descartado após o uso.', inf: ['s65']},
          {id: 'proc_estrut', se: SAUDE, t: 'A área de processamento, os POPs, os EPIs e a capacitação da equipe atendem às exigências?', r: [...R15('a15', 'a24', 'a24pu', 'a29', 'a31', 'a46'), LM(65)],
            c: 'O processamento segue fluxo da área suja para a limpa, com POP por etapa, EPI conforme a área e equipe capacitada.', nc: 'A estrutura ou a organização do processamento não atende às exigências.', ncPontos: 'No processamento, não há: {}.',
            pontos: [['fluxo', 'fluxo da área suja para a limpa, com barreira técnica no mínimo', 'O processamento não segue fluxo da área suja para a limpa, nem com barreira técnica.'], ['pop', 'POP escrito para cada etapa, disponível para consulta', 'Não há POP escrito para cada etapa do processamento, disponível para consulta.'], ['epi', 'EPI conforme a área (óculos, máscara, luva de borracha cano longo e avental impermeável na limpeza; luva térmica na autoclave)', 'A equipe não usa o EPI exigido para cada área do processamento.'], ['capacita', 'capacitação periódica registrada (classificação, limpeza, esterilização, monitoramento, rastreabilidade)', 'Não há registro de capacitação periódica da equipe do processamento.']],
            naSe: {campo: 'p_proc', em: ['externo', 'nao']}, na: 'Não há processamento de instrumentais no local.', inf: ['s55', 's56']},
          {id: 'proc_limp', se: SAUDE, t: 'A limpeza dos produtos atende às exigências?', r: [...R15('a65', 'a66', 'a68', 'a70', 'a73', 'a76'), LM(65)],
            c: 'Os produtos são limpos antes da desinfecção ou esterilização, com acessório não abrasivo, enxágue com água potável, secagem com ar filtrado e inspeção com lente de aumento.', nc: 'A limpeza dos produtos não atende às exigências.', ncPontos: 'Na limpeza, não se atende: {}.',
            pontos: [['antes', 'limpeza antes da desinfecção ou esterilização', 'Os produtos não são limpos antes da desinfecção ou da esterilização.'], ['acessorio', 'escovas e acessórios não abrasivos, que não soltam partículas', 'A limpeza usa acessórios abrasivos ou que soltam partículas.'], ['agua', 'enxágue com água potável', 'O enxágue não é feito com água potável.'], ['secagem', 'secagem com ar comprimido medicinal ou ar filtrado, seco e sem óleo', 'A secagem não é feita com ar comprimido medicinal ou ar filtrado, seco e sem óleo.'], ['inspecao', 'inspeção com lente de no mínimo 8 vezes de aumento', 'A limpeza não é inspecionada com lente de, no mínimo, 8 vezes de aumento.'], ['monit', 'monitoramento da limpeza com periodicidade definida em protocolo', 'A limpeza não é monitorada com periodicidade definida em protocolo.']],
            naSe: {campo: 'p_proc', em: ['externo', 'nao']}, na: 'Não há processamento de instrumentais no local.', inf: ['s56', 's57']},
          {id: 'proc_ester_q', se: SAUDE, t: 'O equipamento e o ciclo de esterilização atendem às exigências?', r: [...R15('a37', 'a91', 'a92', 'a93', 'a94', 'a97'), LM(65)],
            c: 'A esterilização é feita em autoclave qualificada anualmente, sem estufa, com teste de Bowie & Dick no primeiro ciclo do dia (autoclave com vácuo) e registro dos parâmetros de cada ciclo.', nc: 'A esterilização não atende às exigências.', ncPontos: 'Na esterilização, não se atende: {}.',
            pontos: [['estufa', 'sem uso de estufa', 'Há uso de estufa para esterilização, o que é proibido.'], ['grav', 'autoclave gravitacional só até 100 litros', 'Há autoclave gravitacional com capacidade acima de 100 litros, o que é proibido.'], ['qualif', 'qualificação de instalação, operação e desempenho, no mínimo anual', 'A autoclave não tem qualificação de instalação, operação e desempenho anual.'], ['bowie', 'teste de Bowie & Dick no primeiro ciclo do dia (autoclave com bomba de vácuo)', 'Não é feito o teste de Bowie & Dick no primeiro ciclo do dia da autoclave com bomba de vácuo.'], ['param', 'parâmetros do ciclo sem alteração e registrados a cada ciclo', 'Os parâmetros dos ciclos não são registrados a cada ciclo ou foram alterados em relação aos da qualificação.']],
            naSe: {campo: 'proc_ester', igual: 'nao'}, na: 'O estabelecimento não esteriliza no local.', inf: ['s57', 's58']},
          {id: 'proc_monit', se: SAUDE, t: 'O monitoramento da esterilização e os registros atendem às exigências?', r: [...R15('a26', 'a26pu', 'a42', 'a96', 'a98', 'a99'), LM(65)],
            c: 'A esterilização é monitorada com integrador químico em cada carga e indicador biológico diário, com incubadora e registros guardados por cinco anos.', nc: 'O monitoramento da esterilização não atende às exigências.', ncPontos: 'No monitoramento da esterilização, não há: {}.',
            pontos: [['quimico', 'integrador químico (classe 5 ou 6) em pacote desafio a cada carga', 'Não há integrador químico (classe 5 ou 6) em pacote desafio a cada carga.'], ['biologico', 'indicador biológico diário, no ponto de maior desafio', 'Não há monitoramento diário com indicador biológico.'], ['incubadora', 'incubadora para leitura do indicador biológico', 'Não há incubadora para a leitura do indicador biológico.'], ['registro', 'registros do monitoramento guardados por no mínimo cinco anos', 'Os registros do monitoramento não são guardados por, no mínimo, cinco anos.']],
            naSe: {campo: 'proc_ester', igual: 'nao'}, na: 'O estabelecimento não esteriliza no local.', inf: ['s58', 's60']},
          {id: 'proc_embal', se: SAUDE, t: 'A embalagem e a identificação dos produtos esterilizados atendem às exigências?', r: [...R15('a77', 'a78', 'a79', 'a80', 'a81', 'a83', 'a84', 'a85'), LM(65)],
            c: 'Os estéreis estão em embalagem regularizada para esterilização, selada, com rótulo legível que traz o nome do produto, o lote, a data da esterilização, a data limite de uso, o método e o responsável pelo preparo.', nc: 'A embalagem ou a identificação dos produtos esterilizados não atende às exigências.', ncPontos: 'Nos produtos esterilizados, não há: {}.',
            pontos: [['embalagem', 'embalagem regularizada na Anvisa para esterilização (sem papel kraft, papel toalha, alumínio, plástico comum ou caixa metálica sem furos)', 'Os produtos são esterilizados em embalagem não regularizada para esterilização ou proibida (papel kraft, papel toalha, alumínio, plástico comum ou caixa metálica sem furos).'], ['selagem', 'selagem por termosseladora ou conforme o fabricante', 'A selagem das embalagens não é feita por termosseladora ou conforme o fabricante.'], ['nome', 'nome do produto no rótulo', 'O rótulo dos produtos esterilizados não traz o nome do produto.'], ['lote', 'número do lote', 'O rótulo dos produtos esterilizados não traz o número do lote.'], ['data', 'data da esterilização', 'O rótulo dos produtos esterilizados não traz a data da esterilização.'], ['limite', 'data limite de uso', 'O rótulo dos produtos esterilizados não traz a data limite de uso.'], ['metodo', 'método de esterilização', 'O rótulo dos produtos esterilizados não traz o método de esterilização.'], ['resp', 'nome do responsável pelo preparo', 'O rótulo dos produtos esterilizados não traz o nome do responsável pelo preparo.']],
            naSe: {campo: 'proc_ester', igual: 'nao'}, na: 'O estabelecimento não esteriliza no local.', inf: ['s59']},
          {id: 'proc_guarda', se: SAUDE, t: 'A guarda dos produtos esterilizados atende às exigências?', r: [...R15('a60', 'a61', 'a101', 'a102'), LM(65)],
            c: 'Os estéreis ficam em local exclusivo, limpo, seco e de acesso restrito, sem luz solar direta, em prateleira não porosa, dentro da data limite de uso e com a embalagem íntegra.', nc: 'A guarda dos produtos esterilizados não atende às exigências.', ncPontos: 'Na guarda dos estéreis, não se atende: {}.',
            pontos: [['local', 'local exclusivo e de acesso restrito, fora da circulação', 'Os produtos esterilizados não ficam em local exclusivo e de acesso restrito.'], ['condicao', 'limpo, seco e sem luz solar direta', 'O local de guarda dos estéreis não é limpo e seco, ou recebe luz solar direta.'], ['prateleira', 'prateleira de material não poroso', 'As prateleiras dos estéreis não são de material não poroso.'], ['validade', 'nenhum produto vencido ou com embalagem violada, úmida ou rasgada', 'Há produto esterilizado vencido ou com embalagem violada, úmida ou rasgada.']],
            naSe: {campo: 'proc_ester', igual: 'nao'}, na: 'O estabelecimento não esteriliza no local.', inf: ['s59']},
          {id: 'proc_desinf_q', se: SAUDE, t: 'A desinfecção química atende às exigências?', r: [...R15('a86', 'a87', 'a89', 'a90', 'a90p1', 'a90p2'), LM(65)],
            c: 'A desinfecção química é feita em sala exclusiva, com desinfetante usado conforme o registro, concentração ou pH conferidos e registrados diariamente e enxágue com água potável.', nc: 'A desinfecção química não atende às exigências.', ncPontos: 'Na desinfecção química, não se atende: {}.',
            pontos: [['sala', 'sala exclusiva para a desinfecção química', 'A desinfecção química não é feita em sala exclusiva.'], ['produto', 'desinfetante regularizado, usado conforme o registro (diluição, tempo de contato, validade da solução)', 'O desinfetante não é usado conforme o registro (diluição, tempo de contato ou validade da solução).'], ['monit', 'concentração ou pH conferidos todo dia antes das atividades, com registro guardado por cinco anos', 'A concentração ou o pH do desinfetante não são conferidos e registrados diariamente antes das atividades.'], ['enxague', 'enxágue com água potável', 'O enxágue após a desinfecção química não é feito com água potável.'], ['seguranca', 'medidas de segurança do fabricante do saneante (EPI, ventilação)', 'Não são adotadas as medidas de segurança do fabricante do saneante.']],
            naSe: {campo: 'proc_desinf', em: ['termica', 'nao']}, na: 'Não há desinfecção química no local.', inf: ['s57', 's60']},
          /* ——— interesse à saúde: biossegurança (Lei 13.643/2018, art. 8º) ——— */
          {id: 'proc_i', se: INT, t: 'A limpeza, a desinfecção e a esterilização de utensílios e instrumentos atendem às boas práticas de biossegurança?', r: [...INT_BIO],
            c: 'Utensílios e instrumentos são limpos e, conforme o risco, desinfetados ou esterilizados, com identificação dos esterilizados e descarte do material de uso único.', nc: 'A limpeza, a desinfecção ou a esterilização dos utensílios e instrumentos não atende às exigências.', ncPontos: 'No processamento de utensílios e instrumentos, não se atende: {}.',
            pontos: [['limpeza', 'limpeza de todo utensílio reutilizável antes da desinfecção ou esterilização', 'Os utensílios reutilizáveis não são limpos antes da desinfecção ou da esterilização.'], ['esteril', 'instrumento que perfura ou corta a pele (alicate, espátula de cutícula, cureta, pinça de extração) esterilizado em autoclave', 'Instrumento que perfura ou corta a pele não é esterilizado em autoclave.'], ['estufa', 'sem estufa, forno ou equipamento de UV como “esterilizador”', 'Há uso de estufa, forno ou equipamento de luz ultravioleta como esterilizador.'], ['ident', 'pacotes esterilizados íntegros e identificados com a data da esterilização e o prazo de uso', 'Os pacotes esterilizados não estão íntegros ou não trazem a data da esterilização e o prazo de uso.'], ['desinf', 'desinfetante regularizado na Anvisa, usado conforme o rótulo (diluição e tempo de contato)', 'O desinfetante não é regularizado na Anvisa ou não é usado conforme o rótulo.'], ['uso_unico', 'material de uso único (lixas, palitos, lâminas, agulhas) descartado após o uso', 'Há reutilização de material de uso único.']],
            naSe: {campo: 'p_proc', em: ['externo', 'nao']}, na: 'Não há processamento de instrumentais no local.',
            inf: ['i30', 'i31']}
        ],
        orient: [
          {t: 'A RDC 15/2012 vale para os Centros de Material e Esterilização dos serviços de saúde e para as empresas processadoras; o parágrafo único do art. 3º exclui consultórios individualizados não vinculados a serviços de saúde. Fora desse âmbito, valem a RDC 63/2011 (qualidade da desinfecção e da esterilização) e as instruções do fabricante.', f: 'RDC Anvisa nº 15/2012, art. 3º e parágrafo único; RDC Anvisa nº 63/2011, art. 57'},
          {t: 'Instrumento que penetra pele ou mucosa é esterilizado, em regra em autoclave com monitoramento por indicadores químicos e biológicos; produto de uso único não é reprocessado.', f: 'RDC Anvisa nº 15/2012, como referência técnica; RE Anvisa nº 2.605/2006 (lista de produtos de reprocessamento proibido)'}
        ]},
      {id: 'externo', se: SAUDE, titulo: 'Processamento em empresa processadora', curto: 'Processamento externo',
        perguntas: [
          {id: 'proc_ext', t: 'O processamento externo é feito por empresa regularizada na vigilância sanitária, com contrato que formaliza todas as etapas, pré-limpeza dos dispositivos antes do envio e rastreabilidade?', r: [...R63('a11'), ...R15('a16', 'a18', 'a19', 'a25'), LM(94)],
            c: 'O processamento externo é feito por empresa regularizada, com contrato, pré-limpeza e rastreabilidade.', nc: 'O processamento externo de dispositivos médicos não atende às exigências.',
            naSe: {campo: 'p_proc', em: ['interno', 'nao']}, na: 'O processamento de instrumentais não é terceirizado.',
            pontos: [['empresa', 'empresa processadora regularizada', 'O processamento externo é feito por empresa não regularizada como processadora.'], ['contrato', 'contrato formal com todas as etapas', 'Não há contrato formal com a empresa processadora.'], ['licenca', 'licença sanitária vigente da empresa', 'A empresa processadora não tem licença sanitária vigente.'], ['prelimpeza', 'pré-limpeza antes do envio, conforme POP', 'Os dispositivos não passam por pré-limpeza antes do envio à empresa processadora.'], ['rastreio', 'rastreabilidade dos processos', 'Não há rastreabilidade do processamento externo.']],
            inf: ['s61', 's62', 's63', 's64']}
        ],
        orient: [
          {t: 'A RE 2.606/2006 traz as diretrizes para os protocolos de reprocessamento de produtos médicos, citadas pelo ROI para o processamento externo.', f: 'RE Anvisa nº 2.606/2006; ' + ROI + ', indicador 18'}
        ]}
    ]
  },
  {
    id: 'med', titulo: 'Medicamentos e produtos', curto: 'Medicamentos', icone: 'lab',
    descricao: 'Produtos em uso e indicadores 19, 20, 21 e 24 do ROI.',
    itens: [
      /* lista de produtos: campo; a condição evita o item antes de escolher o perfil */
      {id: 'produtos', se: {campo: 'p_tipo', em: ['saude', 'interesse']}, titulo: 'Produtos em uso', curto: 'Produtos',
        descricao: 'Liste cosméticos, saneantes, medicamentos e dispositivos médicos em uso: escolha a categoria, busque pelo registro ou pelo processo na Anvisa ou digite os dados. A lista sai em tabela no relatório.',
        campos: [{id: 'prod_lista', rotulo: 'Produtos em uso', tipo: 'equipamentos', perfil: 'produto', largo: true}],
        orient: [
          {t: 'Cosméticos, saneantes, medicamentos e produtos para saúde só podem ser expostos ao uso depois de regularizados na Anvisa. A busca consulta as bases de dados abertos da Anvisa (cosméticos, saneantes, medicamentos e produtos para saúde); produto não localizado deve ser conferido na consulta oficial antes de concluir pela irregularidade.', f: 'Lei Federal nº 6.360/1976, art. 12; Portal de Dados Abertos da Anvisa (dados.anvisa.gov.br)'}
        ]},
      {id: 'medicamentos', se: SAUDE, titulo: 'Uso de medicamentos', curto: 'Medicamentos',
        perguntas: [
          {id: 'med_uso', t: 'Os medicamentos usados são registrados, preparados e administrados por profissional legalmente habilitado, com protocolo e POPs de uso seguro conforme o fabricante e a legislação?', r: [...R63('a8-v', 'a17', 'a53'), LM(67)],
            c: 'Os medicamentos são registrados, administrados por profissional habilitado, com protocolo e POPs de uso seguro.', nc: 'O uso de medicamentos no serviço não atende às exigências.',
            naSe: NAO('p_med'), na: 'O serviço não usa medicamentos.',
            pontos: [['registro', 'medicamentos registrados', 'Há medicamento sem registro.'], ['habilitado', 'preparo e administração por profissional habilitado', 'Há medicamento administrado por profissional não habilitado.'], ['protocolo', 'protocolo e POPs de uso seguro', 'Não há protocolo e POPs de uso seguro de medicamentos.'], ['fabricante', 'conforme as instruções do fabricante', 'As instruções do fabricante não são seguidas no preparo e na administração.']],
            inf: ['s36', 's37', 's39', 's21']}
        ]},
      {id: 'manipulados', se: SAUDE, titulo: 'Medicamentos manipulados', curto: 'Manipulados',
        perguntas: [
          {id: 'manip', t: 'Os medicamentos manipulados podem ser manipulados, têm prescrição individualizada por profissional habilitado e rotulagem com todos os itens obrigatórios?', r: [...R67('n5.17', 'n5.18.4'), LM(67)],
            c: 'Os medicamentos manipulados estão regulares, com prescrição individualizada e rotulagem completa.', nc: 'Os medicamentos manipulados não atendem às exigências.',
            naSe: NAO('p_manip'), na: 'O serviço não usa medicamentos manipulados.',
            pontos: [['permitido', 'manipulação permitida', 'Foi encontrado medicamento ou produto de manipulação proibida.'], ['prescricao', 'prescrição individualizada por profissional habilitado', 'Há medicamento manipulado sem prescrição individualizada ou com prescrição inadequada.'], ['rotulo', 'rotulagem com os itens obrigatórios', 'A rotulagem do medicamento manipulado não traz os itens obrigatórios.']],
            inf: ['s40', 's41']}
        ],
        orient: [
          {t: 'Preparação magistral é individualizada: prescrita para o paciente, por profissional habilitado. Estoque de manipulado “para uso no consultório”, sem paciente identificado, não atende a essa regra.', f: 'RDC Anvisa nº 67/2007, Anexo I, itens 5.17 e 5.18'}
        ]},
      {id: 'armazena', titulo: 'Guarda e controle de produtos', curto: 'Guarda de produtos',
        perguntas: [
          {id: 'arm_s', se: SAUDE, t: 'Medicamentos e dispositivos médicos estão armazenados conforme o fabricante, dentro da validade, em local exclusivo, com controle e registro de temperatura e validade?', r: [...R63('a54'), ...R509('a2-iii', 'a14'), LM(65)],
            c: 'Medicamentos e dispositivos médicos estão armazenados conforme o fabricante, com controle de temperatura e validade.', nc: 'A guarda de medicamentos e dispositivos médicos não atende às exigências.',
            pontos: [['validade', 'dentro da validade', 'Há medicamento ou dispositivo médico vencido.'], ['local', 'armazenados conforme o fabricante, em local exclusivo', 'Há medicamento ou dispositivo médico armazenado fora das condições indicadas pelo fabricante.'], ['temperatura', 'controle e registro de temperatura', 'Não há monitoramento ou registro da temperatura de armazenamento.'], ['desvio', 'medidas corretivas quando a temperatura sai da faixa', 'Há registros de temperatura fora da faixa sem medida corretiva.']],
            inf: ['s42', 's43', 's37']},
          {id: 'arm_i', se: INT, t: 'Produtos e materiais estão identificados, organizados e conservados conforme o fabricante, com controle de temperatura quando exigido e sem alimento ou objeto pessoal junto?', r: [LM(46), LM(50)],
            c: 'Produtos e materiais estão identificados, organizados e conservados conforme o fabricante.', nc: 'A guarda de produtos e materiais não atende às exigências.',
            pontos: [['conserva', 'conservados conforme o fabricante', 'Há produto conservado em desacordo com o fabricante.'], ['organiza', 'identificados e organizados', 'Produtos e materiais estão sem identificação ou organização.'], ['temperatura', 'controle de temperatura quando exigido', 'Não há controle da temperatura exigida pelo fabricante.'], ['alimentos', 'sem alimento ou objeto pessoal junto', 'Há alimento ou objeto pessoal no equipamento de conservação dos produtos.']],
            inf: ['i11', 'i18', 'i19', 'i20']}
        ]},
      {id: 'controlados', se: SAUDE, titulo: 'Medicamentos sujeitos a controle especial', curto: 'Controle especial',
        perguntas: [
          {id: 'c344', t: 'Os medicamentos sujeitos a controle especial ficam em local exclusivo, sob chave ou outro dispositivo de segurança, e são escriturados?', r: [...P344('a62', 'a67'), LM(67)],
            c: 'Os medicamentos sujeitos a controle especial ficam em local exclusivo, sob chave, e são escriturados.', nc: 'A guarda e a escrituração dos medicamentos sujeitos a controle especial não atendem às exigências.',
            naSe: NAO('p_344'), na: 'O serviço não mantém medicamentos sujeitos a controle especial.',
            pontos: [['exclusivo', 'local exclusivo', 'Os medicamentos sujeitos a controle especial não ficam em local exclusivo.'], ['chave', 'sob chave ou dispositivo de segurança', 'Os medicamentos sujeitos a controle especial não ficam sob chave ou outro dispositivo de segurança.'], ['escrituracao', 'escrituração', 'A movimentação dos medicamentos sujeitos a controle especial não é escriturada.']],
            inf: ['s45', 's46']}
        ]}
    ]
  },
  {
    id: 'terc', titulo: 'Serviços terceirizados', curto: 'Terceirizados', icone: 'folder',
    descricao: 'Indicador 25 do ROI.',
    itens: [
      {id: 'terceirizados', se: SAUDE, titulo: 'Contratos de serviços terceirizados', curto: 'Contratos',
        perguntas: [
          {id: 'terc_q', t: 'Há contratos de todos os serviços e atividades terceirizados, vigentes, com empresas regularizadas na vigilância sanitária quando couber?', r: [...R63('a11', 'a23-v'), LM(94)],
            c: 'Há contratos vigentes de todos os serviços terceirizados, com empresas regularizadas.', nc: 'Os contratos de serviços terceirizados não atendem às exigências.',
            naSe: NAO('p_terc'), na: 'O serviço não tem serviços terceirizados.',
            pontos: [['contratos', 'contrato de todos os serviços terceirizados', 'Não há contrato de todos os serviços e atividades terceirizados.'], ['vigentes', 'contratos vigentes', 'Há contratos de serviços terceirizados vencidos.'], ['regular', 'empresas regularizadas na vigilância sanitária', 'Há serviço terceirizado com empresa não regularizada na vigilância sanitária.']],
            inf: ['s69', 's70']}
        ]}
    ]
  }
];

/* catálogo: o perfil de cada infração vira condição; as que não têm pergunta nem linha do
   inventário (bronzeamento UV) ficam avulsas, marcadas direto na aba Infrações */
const usadas = new Set();
secoes.forEach(s => s.itens.forEach(i => {
  (i.perguntas || []).forEach(q => (q.inf || []).forEach(f => usadas.add(f)));
  (i.campos || []).forEach(c => { (c.inf || []).forEach(f => usadas.add(f)); (c.lista || []).forEach(x => [].concat(x[3] || []).forEach(f => usadas.add(f))); });
}));
const infracoes = CAT.infracoes.map(x => Object.assign({id: x.id, grupo: x.grupo, texto: x.texto, fund: x.fund, r: x.r, se: x.perfil === 'saude' ? SAUDE : INT}, usadas.has(x.id) ? {} : {avulsa: true}));

module.exports = {
  app: 'estetica',
  titulo: 'Serviços de estética',
  tituloCurto: 'Estética',
  store: 'uvis-estetica-v1',
  respostas: 'simnao',
  naSempre: true,
  relSemNa: true,
  filtroPerfil: true,
  constatacao: true,
  perfilRotulo: 'Classificação e atividades',
  relatorio: {
    titulo: 'RELATÓRIO DE INSPEÇÃO SANITÁRIA',
    subtitulo: 'Serviço de estética — verificações do Roteiro Objetivo de Inspeção de Serviços de Estética (Anvisa, versão 1.3) e da legislação sanitária',
    objetivo: 'Verificar as condições higiênico-sanitárias e o cumprimento da legislação sanitária pelo serviço de estética, com base no Roteiro Objetivo de Inspeção de Serviços de Estética da Anvisa (versão 1.3, de 16/12/2025), na legislação federal e no Código Sanitário do Município de São Paulo (Lei nº 13.725/2004).',
    conclusao: 'Diante do exposto, o serviço de estética foi avaliado conforme os itens acima. As irregularidades relacionadas devem ser corrigidas nos prazos fixados pela autoridade sanitária.'
  },
  normas: [
    ['RDC Anvisa nº 63/2011', 'Boas práticas de funcionamento para os serviços de saúde.'],
    ['Lei Federal nº 13.643/2018', 'Profissões de esteticista e cosmetólogo e de técnico em estética.'],
    ['RDC Anvisa nº 509/2021', 'Gerenciamento de tecnologias em saúde.'],
    ['RDC Anvisa nº 222/2018', 'Gerenciamento dos resíduos de serviços de saúde.'],
    ['RDC Anvisa nº 42/2010', 'Preparação alcoólica para higiene das mãos.'],
    ['RDC Anvisa nº 15/2012', 'Processamento de produtos para saúde.'],
    ['RDC Anvisa nº 751/2022', 'Regularização de dispositivos médicos.'],
    ['RDC Anvisa nº 56/2009', 'Proibição do bronzeamento artificial por radiação ultravioleta.'],
    ['Portaria SVS/MS nº 344/1998', 'Substâncias e medicamentos sujeitos a controle especial.'],
    ['Lei Federal nº 6.360/1976', 'Vigilância sanitária de medicamentos, cosméticos, saneantes e produtos para saúde.'],
    ['Lei Municipal nº 13.725/2004', 'Código Sanitário do Município de São Paulo.']
  ],
  secoes,
  infracoes
};
