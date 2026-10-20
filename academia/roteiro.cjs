/* Roteiro — Academias, clubes e piscinas de uso coletivo (núcleo Serviços).
   Base: Portaria SMS nº 1.101/2015 (regulamento técnico: lutas, ginástica,
   musculação, natação, saunas e outras atividades em academias e clubes),
   Lei Municipal nº 11.383/1993 (responsável técnico e PAR-Q, redação da Lei
   15.681/2013), Lei 17.105/2019 (sistema hidráulico de piscinas — NBR 10339),
   Lei 13.993/2005 (profundidade nas bordas), Lei 16.059/2014 (salva-vidas ou
   guardião), Lei 13.945/2005 (desfibrilador) e Lei 13.725/2004 (Código
   Sanitário): toda irregularidade cita o art. 69 (estabelecimento de interesse
   indireto da saúde; leiBase/leiSempre) e, conforme o assunto, o art. 19, § 2º
   (animais sinantrópicos), o art. 27, I (água), o art. 90 (licença) e o
   art. 100 (documentos). Nenhum artigo acima do 109 (pedido de 17/10/2026).
   Instalações: os ambientes que o estabelecimento possui e, em cada um, as
   irregularidades encontradas; as condições que mudam de um ambiente para
   outro (limpeza, sinantrópicos, elétrica, ventilação, ralos, lixeiras, pisos,
   equipamentos, espelhos, itens de sanitários e vestiários) ficam só no
   inventário por ambiente, não em pergunta geral.
   Perfil na Seção 1: o que o estabelecimento não tem (piscina, sauna, lutas,
   avaliação física, alimentos…) passa a “Não se aplica” sozinho (naSe).
   Pílulas “Para saber mais” (orient) com conteúdo técnico geral das ABNT NBR
   10818:2016 e NBR 10339:2018 — sem transcrição da norma; cada uma pede
   conferência no texto da ABNT. Formato igual ao do motor roteiro-simples
   (site Medicamentos): {id, t, r, c, nc, na, inf, naSe, checks}. */
'use strict';
const P = it => 'portaria-sms-sp-1101-2015::item::' + it.replace(/\./g, '-');
const PI = (it, inc) => P(it) + '::inciso::' + inc;
const L11 = (a, ...r) => 'lei-municipal-sp-11383-1993::artigo::' + a + (r.length ? '::' + r.join('::') : '');
const L17 = a => 'lei-municipal-sp-17105-2019::artigo::' + a;
const L139 = a => 'lei-municipal-sp-13993-2005::artigo::' + a;
const L160 = (a, ...r) => 'lei-municipal-sp-16059-2014::artigo::' + a + (r.length ? '::' + r.join('::') : '');
const L1394 = (a, ...r) => 'lei-municipal-sp-13945-2005::artigo::' + a + (r.length ? '::' + r.join('::') : '');
const LM = (a, ...r) => 'lei-municipal-13725-2004::artigo::' + a + (r.length ? '::' + r.join('::') : '');
const SN = [['sim', 'Sim'], ['nao', 'Não']];
const ABNT1 = 'ABNT NBR 10818:2016 (Qualidade da água de piscina) — conteúdo geral, conferir na norma';
const ABNT2 = 'ABNT NBR 10339:2018 (Piscina — Projeto, execução e manutenção) — conteúdo geral, conferir na norma';
const SEM_PISC = 'O estabelecimento não possui piscina.';

module.exports = {
  app: 'academia-piscina',
  titulo: 'Academias, clubes e piscinas',
  tituloCurto: 'Academias e piscinas',
  store: 'uvis-academia-piscina-v1',
  naSempre: true,
  /* relatório descreve só o que o estabelecimento faz: perfil pelas respostas “Sim” e sem as verificações “Não se aplica” */
  relSemNa: true,
  /* Lei 13.725/2004, art. 69, em toda irregularidade */
  leiBase: [LM(69)], leiSempre: true,
  perfilRotulo: 'Atividades e estrutura',
  relatorio: {
    titulo: 'RELATÓRIO DE INSPEÇÃO SANITÁRIA',
    subtitulo: 'Estabelecimento de atividades físicas e esportivas — academias, clubes e piscinas de uso coletivo (Portaria SMS nº 1.101/2015)',
    objetivo: 'Verificar as condições higiênico-sanitárias do estabelecimento que presta serviços de lutas esportivas, ginástica, musculação, natação, saunas e atividades afins, nos termos da Portaria SMS nº 1.101/2015 e da legislação municipal correlata.',
    conclusao: 'Diante do exposto, o estabelecimento foi avaliado conforme os itens acima. As irregularidades relacionadas devem ser corrigidas nos prazos fixados pela autoridade sanitária.'
  },
  normas: [
    ['Portaria SMS nº 1.101/2015', 'Regulamento técnico das condições higiênico-sanitárias de academias, clubes e estabelecimentos de lutas, ginástica, musculação, natação e saunas.'],
    ['Lei Municipal nº 11.383/1993', 'Funcionamento de academias: responsável técnico, atestado médico e PAR-Q (redação dada pela Lei nº 15.681/2013).'],
    ['Lei Municipal nº 17.105/2019', 'Prevenção de acidentes no sistema hidráulico de piscinas (ABNT NBR 10339).'],
    ['Lei Municipal nº 13.993/2005', 'Indicação de profundidade nas bordas das piscinas.'],
    ['Lei Municipal nº 16.059/2014', 'Salva-vidas ou guardião de piscina.'],
    ['Lei Municipal nº 13.945/2005', 'Desfibrilador externo automático em locais de grande concentração de pessoas.'],
    ['Lei Municipal nº 13.725/2004', 'Código Sanitário do Município de São Paulo.']
  ],
  secoes: [
    {
      id: 'ident', titulo: 'Identificação e perfil', curto: 'Identificação', icone: 'building',
      descricao: 'Dados do estabelecimento e o que ele oferece. O perfil marca “Não se aplica” no que não existir.',
      itens: [
        {id: 'dados', titulo: 'Dados do estabelecimento e da inspeção', curto: 'Dados',
          campos: [
            {id: 'razao', rotulo: 'Razão social'}, {id: 'fantasia', rotulo: 'Nome fantasia'},
            {id: 'cnpj', rotulo: 'CNPJ', tipo: 'cnpj'}, {id: 'endereco', rotulo: 'Endereço', largo: true},
            {id: 'cmvs', rotulo: 'Licença / Cadastro Municipal de Vigilância em Saúde (CMVS) nº'},
            {id: 'rl', rotulo: 'Responsável legal'}, {id: 'rt', rotulo: 'Responsável técnico (nome e CREF)'},
            {id: 'operador', rotulo: 'Operador de piscina (nome e certificado)'},
            {id: 'horario', rotulo: 'Horário de funcionamento'}, {id: 'alunos', rotulo: 'Nº de alunos / sócios', tipo: 'number'},
            {id: 'data', rotulo: 'Data da inspeção', tipo: 'date'}, {id: 'acompanhou', rotulo: 'Acompanhou a inspeção'},
            {id: 'equipe', rotulo: 'Equipe de inspeção', largo: true}
          ]},
        {id: 'perfil', titulo: 'Perfil do estabelecimento', curto: 'Perfil',
          descricao: 'Responda o que existe no local. O que for “Não” passa a “Não se aplica” no roteiro (pode ser alterado depois).',
          campos: [
            {id: 'p_piscina', rotulo: 'Possui piscina?', tipo: 'select', opcoes: SN, desc: {sim: 'piscina{p_uso}'}},
            {id: 'p_uso', rotulo: 'Uso da piscina', tipo: 'select', rel: false, desc: {restrito: ' de uso coletivo restrito', publico: ' de uso público'}, opcoes: [['restrito', 'Coletivo restrito (alunos, sócios, hóspedes)'], ['publico', 'Público (população em geral)']]},
            {id: 'p_sauna', rotulo: 'Possui sauna, banheira ou ofurô?', tipo: 'select', opcoes: SN, desc: {sim: 'sauna ou banheira'}},
            {id: 'p_lutas', rotulo: 'Oferece lutas esportivas?', tipo: 'select', opcoes: SN, desc: {sim: 'lutas esportivas'}},
            {id: 'p_avaliacao', rotulo: 'Faz avaliação física / antropométrica?', tipo: 'select', opcoes: SN, desc: {sim: 'avaliação física'}},
            {id: 'p_quadra', rotulo: 'Possui quadras esportivas?', tipo: 'select', opcoes: SN, desc: {sim: 'quadras esportivas'}},
            {id: 'p_alimentos', rotulo: 'Manipula alimentos no local (lanchonete, cozinha)?', tipo: 'select', opcoes: SN, desc: {sim: 'manipulação de alimentos'}},
            {id: 'p_trocador', rotulo: 'Possui trocador de fraldas?', tipo: 'select', opcoes: SN, desc: {sim: 'trocador de fraldas'}},
            {id: 'p_federado', rotulo: 'Atende atletas federados (entidade federativa)?', tipo: 'select', opcoes: SN, desc: {sim: 'atendimento a atletas federados'}},
            {id: 'p_dea', rotulo: 'Clube ou academia com mais de 1.000 sócios?', tipo: 'select', opcoes: SN, desc: {sim: 'mais de 1.000 sócios'}},
            {id: 'p_alternativa', rotulo: 'Usa água de solução alternativa (poço, caminhão-pipa)?', tipo: 'select', opcoes: SN, desc: {sim: 'abastecimento de água por solução alternativa'}}
          ]}
      ]
    },
    {
      id: 'saude', titulo: 'Licenciamento, responsável técnico e saúde dos alunos', curto: 'Licença, RT e alunos', icone: 'people',
      descricao: 'Cadastro sanitário, responsável técnico, atestado médico, PAR-Q e termo de responsabilidade (Lei 13.725/2004; Lei 11.383/1993, com a redação da Lei 15.681/2013).',
      itens: [
        {id: 'lic', titulo: 'Licenciamento e responsabilidade técnica', curto: 'Licença e RT',
          perguntas: [
            {id: 'licenca', t: 'O estabelecimento possui licença sanitária ou Cadastro Municipal de Vigilância em Saúde (CMVS) compatível com as atividades exercidas?', r: [LM(90), LM(90, 'paragrafo', '1')],
              c: 'O estabelecimento possui cadastro/licença sanitária compatível com as atividades exercidas.',
              nc: 'O estabelecimento não atende às exigências de licenciamento sanitário.', inf: ['lic']},
            {id: 'rt', t: 'Há responsável técnico — profissional de educação física habilitado (CREF) ou técnico credenciado pela federação — supervisionando as atividades?', r: [L11(1), P('12.1')],
              c: 'As atividades são supervisionadas por responsável técnico legalmente habilitado.',
              nc: 'Não há responsável técnico legalmente habilitado supervisionando as atividades físicas e esportivas.', inf: ['rt']},
            {id: 'cnpj_doc', t: 'O CNPJ atualizado está disponível no estabelecimento?', r: [PI('14.2', 'i'), LM(100)],
              c: 'O CNPJ atualizado está disponível no estabelecimento.', nc: 'O CNPJ atualizado não estava disponível no estabelecimento.', inf: ['docs']}
          ],
          orient: [
            {t: 'O Código Sanitário exige que o estabelecimento de interesse da saúde declare suas atividades à autoridade sanitária antes de iniciá-las, para obter o Cadastro Municipal de Vigilância em Saúde, e comunique a inclusão de atividades (ex.: abrir piscina ou sauna depois do cadastro).', f: 'Lei Municipal nº 13.725/2004, art. 90 e § 1º'},
            {t: 'Responsável técnico: confira o registro no CREF (consulta pública no site do CREF4/SP) e se o profissional está de fato presente na rotina — escala, assinatura de fichas, supervisão das turmas.', f: 'Lei Municipal nº 11.383/1993, art. 1º; Portaria SMS nº 1.101/2015, item 12.1'}
          ]},
        {id: 'parq', titulo: 'Atestado médico, PAR-Q e placa', curto: 'PAR-Q e atestado',
          perguntas: [
            {id: 'parq_aplic', t: 'Os alunos de 15 a 69 anos respondem ao Questionário de Prontidão para Atividade Física (PAR-Q), renovado anualmente?', r: [L11(2, 'alinea', 'b'), L11(2, 'paragrafo', '5'), P('13.1')],
              c: 'Os alunos de 15 a 69 anos respondem ao PAR-Q, renovado anualmente.', nc: 'Não há PAR-Q respondido e renovado anualmente para os alunos de 15 a 69 anos.', inf: ['parq']},
            {id: 'parq_termo', t: 'Quem respondeu “sim” a alguma pergunta do PAR-Q assinou o Termo de Responsabilidade para Prática de Atividade Física?', r: [L11(2, 'paragrafo', '4')],
              c: 'Os alunos que responderam “sim” a alguma pergunta do PAR-Q assinaram o Termo de Responsabilidade.', nc: 'Há alunos com resposta positiva no PAR-Q sem o Termo de Responsabilidade assinado.',
              na: 'Nenhum dos PAR-Q verificados teve resposta positiva.', inf: ['parq']},
            {id: 'atestado_idade', t: 'Os alunos com menos de 15 ou mais de 69 anos apresentaram atestado médico com nome completo e CRM do médico?', r: [L11(2, 'paragrafo', '5'), L11('2-a')],
              c: 'Os alunos fora da faixa de 15 a 69 anos apresentaram atestado médico com nome completo e CRM do médico.', nc: 'Os atestados médicos dos alunos fora da faixa de 15 a 69 anos não atendem às exigências.',
              na: 'Não há alunos fora da faixa de 15 a 69 anos.', inf: ['parq']},
            {id: 'federado', t: 'Para atletas federados, há exame médico prévio renovado a cada seis meses, anotado nos registros, com atestado anexado e autorização dos responsáveis para menores?', r: [L11(2, 'alinea', 'a'), L11(2, 'paragrafo', '1'), L11(2, 'paragrafo', '2'), L11(2, 'paragrafo', '3')],
              c: 'Os atletas federados têm exame médico prévio renovado semestralmente, anotado nos registros, com atestado anexado e autorização dos responsáveis para os menores.',
              nc: 'Há atletas federados sem exame médico prévio semestral, sem anotação nos registros ou, quando menores, sem autorização dos responsáveis.',
              na: 'O estabelecimento não atende atletas federados.', naSe: {campo: 'p_federado', igual: 'nao'}, inf: ['parq']},
            {id: 'placa', t: 'Há placa visível com os dizeres “Antes de iniciar a prática de atividades físicas ou esportivas, verifique se você não tem contraindicação.”?', r: [L11('2-c')],
              c: 'Há placa visível com o aviso para verificar contraindicação antes da prática de atividades físicas.', nc: 'Não há placa visível com o aviso para verificar contraindicação antes da prática de atividades físicas.', inf: ['placa']},
            {id: 'parq_docs', t: 'Os atestados, PAR-Q e termos estão organizados e disponíveis para a autoridade sanitária?', r: [P('14.1'), PI('14.2', 'iv'), LM(100)],
              c: 'Os atestados médicos, PAR-Q e termos de responsabilidade estão organizados e disponíveis.', nc: 'Os atestados médicos, PAR-Q e termos de responsabilidade não estavam organizados e disponíveis para a autoridade sanitária.', inf: ['docs']}
          ],
          orient: [
            {t: 'Desde a Lei 15.681/2013, a regra geral do praticante amador é o PAR-Q anual (15 a 69 anos). O atestado médico passou a ser exigido para quem está fora dessa faixa e para atividades no âmbito de entidades federativas (exame semestral). Atestado de médico de confiança do aluno deve ser aceito.', f: 'Lei Municipal nº 11.383/1993, art. 2º e 2º-A, redação da Lei nº 15.681/2013'},
            {t: 'O que conferir em cada ficha: data do PAR-Q (renovação anual), respostas, Termo de Responsabilidade quando houver “sim” e idade (fora de 15 a 69 anos, atestado médico). Peça fichas de turmas diferentes, inclusive de matrículas recentes.', f: 'Lei Municipal nº 11.383/1993, art. 2º, §§ 4º e 5º, e art. 2º-A, redação da Lei nº 15.681/2013'}
          ]}
      ]
    },
    {
      id: 'instal', titulo: 'Instalações, sanitários e vestiários', curto: 'Instalações', icone: 'plan',
      itens: [
        {id: 'gerais', titulo: 'Animais domésticos', curto: 'Animais domésticos',
          perguntas: [
            {id: 'animais', t: 'Quando permitida, a presença de animais domésticos é compatível com a segurança dos usuários e com a higiene do local?', r: [P('3.7')],
              c: 'A presença de animais domésticos é compatível com a segurança dos usuários e com a higiene do local.', nc: 'A presença de animais domésticos não atende às condições de segurança e higiene.',
              na: 'Não há animais domésticos no estabelecimento.', inf: ['instal']}
          ]},
        {id: 'sanit', titulo: 'Sanitários e vestiários', curto: 'Sanitários e vestiários',
          perguntas: [
            {id: 'separados', t: 'Sanitários e vestiários são separados por sexo, suficientes para a demanda e têm ao menos um chuveiro e um vaso protegidos por portas e divisórias?', r: [P('4.1'), P('4.2')],
              c: 'Os sanitários e vestiários são separados por sexo, suficientes para a demanda e têm chuveiro e vaso protegidos por portas e divisórias.', nc: 'Os sanitários e vestiários não atendem às exigências de separação por sexo, quantidade e privacidade.', inf: ['sanit']},
            {id: 'trocador', t: 'O trocador de fraldas tem pia próxima com sabonete e secagem higiênica, lixeira com tampa sem contato manual, revestimento impermeável e produto identificado para higienização fora do alcance das crianças?', r: [P('4.5'), P('4.5.1'), P('4.5.2'), P('4.5.2.1')],
              c: 'O trocador de fraldas atende às exigências de higiene.', nc: 'O trocador de fraldas não atende às exigências de higiene.',
              na: 'Não há trocador de fraldas.', naSe: {campo: 'p_trocador', igual: 'nao'}, inf: ['sanit']},
            {id: 'armarios', t: 'Há armários para guarda de roupas e objetos pessoais dos usuários e funcionários?', r: [P('4.6')],
              c: 'Há armários para guarda de roupas e objetos pessoais.', nc: 'Não há armários para guarda de roupas e objetos pessoais dos usuários e funcionários.', inf: ['sanit']}
          ]}
      ]
    },
    {
      id: 'pratica', titulo: 'Higiene das áreas de prática e desfibrilador', curto: 'Áreas de prática', icone: 'shield',
      descricao: 'Pisos, equipamentos, espelhos, barreiras e quadras estão no inventário por ambiente (Instalações).',
      itens: [
        {id: 'areas', titulo: 'Higienização de colchonetes e assentos', curto: 'Colchonetes e assentos',
          perguntas: [
            {id: 'colchonetes', t: 'Colchonetes e assentos estão conservados e são higienizados após cada uso com produto indicado, identificado e à disposição dos usuários, com separação entre higienizados e não higienizados?', r: [P('5.6'), P('5.6.1'), P('5.6.2'), P('5.6.2.1'), P('5.6.3')],
              c: 'Os colchonetes e assentos estão conservados e são higienizados após cada uso, com produto identificado à disposição e separação entre higienizados e não higienizados.',
              nc: 'A higienização dos colchonetes e assentos não atende às exigências.', inf: ['higiene']}
          ],
          orient: [
            {t: 'Higienização de colchonetes: o produto (desinfetante ou álcool 70%) deve ser regularizado na Anvisa e usado conforme o rótulo (diluição e tempo de contato). Pergunte qual produto é usado e confira o rótulo.', f: 'Portaria SMS nº 1.101/2015, itens 5.6.2 e 8.2'}
          ]},
        {id: 'avaliacao', titulo: 'Avaliação física', curto: 'Avaliação física',
          perguntas: [
            {id: 'aval_hig', t: 'Colchonetes e equipamentos da avaliação física são higienizados após cada uso e há produto alcoólico para as mãos na sala?', r: [P('5.8'), P('5.8.1')],
              c: 'Os colchonetes e equipamentos da avaliação física são higienizados após cada uso e há produto alcoólico para as mãos na sala.',
              nc: 'A higienização na sala de avaliação física não atende às exigências.',
              na: 'O estabelecimento não faz avaliação física.', naSe: {campo: 'p_avaliacao', igual: 'nao'}, inf: ['higiene']}
          ]},
        {id: 'dea', titulo: 'Desfibrilador externo automático (DEA)', curto: 'Desfibrilador',
          descricao: 'Exigência para clubes e academias com mais de 1.000 sócios (Lei 13.945/2005, redação vigente).',
          perguntas: [
            {id: 'dea_tem', t: 'O estabelecimento mantém desfibrilador externo automático em condições de uso?', r: [L1394(1), L1394(2)],
              c: 'O estabelecimento mantém desfibrilador externo automático em condições de uso.', nc: 'O estabelecimento não mantém desfibrilador externo automático em condições de uso.',
              na: 'O estabelecimento não tem mais de 1.000 sócios.', naSe: {campo: 'p_dea', igual: 'nao'}, inf: ['dea']},
            {id: 'dea_capac', t: 'Há pessoal capacitado no uso do desfibrilador (CIPA, brigada e dois funcionários por turno, por aparelho)?', r: [L1394(1, 'paragrafo', '1'), L1394(1, 'paragrafo', '2')],
              c: 'Há pessoal capacitado no uso do desfibrilador.', nc: 'Não há pessoal capacitado no uso do desfibrilador em número suficiente.',
              na: 'O estabelecimento não tem mais de 1.000 sócios.', naSe: {campo: 'p_dea', igual: 'nao'}, inf: ['dea']}
          ],
          orient: [
            {t: 'A bibliografia da Portaria fala em “1.500 pessoas”, mas a redação vigente da Lei 13.945/2005 (alterada pelas Leis 14.621/2007 e 15.283/2010) exige o DEA de clubes e academias com mais de 1.000 sócios. A multa é a própria da Lei 13.945 (art. 3º).', f: 'Lei Municipal nº 13.945/2005, arts. 1º e 3º'},
            {t: 'A lei pede DEA em prontas condições de uso, com dispositivo que monitora bateria e componentes e alerta sobre reparos: confira o indicador de prontidão (autoteste) e a validade dos eletrodos e da bateria, que constam das instruções do fabricante.', f: 'Lei Municipal nº 13.945/2005, art. 2º, IV e V; instruções de uso do fabricante do DEA'}
          ]}
      ]
    },
    {
      id: 'piscina', titulo: 'Piscina', curto: 'Piscina', icone: 'water',
      descricao: 'Qualidade da água, segurança dos banhistas, lava-pés, casa de máquinas e registros (Portaria item 6; Leis 17.105, 13.993 e 16.059).',
      itens: [
        {id: 'agua_pisc', titulo: 'Qualidade e tratamento da água', curto: 'Água da piscina',
          campos: [
            {id: 'ph_medido', rotulo: 'pH medido no tanque (6,7 a 7,9)', tipo: 'number'},
            {id: 'crl_medido', rotulo: 'Cloro residual livre medido no tanque, mg/L (0,5 a 0,8)', tipo: 'number'},
            {id: 'crl_lavapes', rotulo: 'Cloro residual livre no lava-pés, mg/L (acima de 25)', tipo: 'number'}
          ],
          perguntas: [
            {id: 'ph', t: 'O pH da água do tanque está entre 6,7 e 7,9?', r: [P('6.2.2')],
              c: 'O pH da água do tanque está dentro da faixa de 6,7 a 7,9.', nc: 'O pH da água do tanque está fora da faixa de 6,7 a 7,9.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['agua']},
            {id: 'crl', t: 'O cloro residual livre está entre 0,5 e 0,8 mg/L em toda a extensão e profundidade do tanque?', r: [P('6.2.4')],
              c: 'O cloro residual livre da água do tanque está entre 0,5 e 0,8 mg/L.', nc: 'O cloro residual livre da água do tanque está fora da faixa de 0,5 a 0,8 mg/L.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['agua']},
            {id: 'limpidez', t: 'A água permite ver perfeitamente a parte mais funda, a superfície está livre de matéria flutuante e o fundo livre de detritos?', r: [P('6.3'), P('6.4')],
              c: 'A água está límpida, com visibilidade da parte mais funda, superfície sem matéria flutuante e fundo sem detritos.', nc: 'A água da piscina não atende às condições de limpidez.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['agua']},
            {id: 'recirc', t: 'O tanque tem sistema de recirculação completo (entradas, grelhas de fundo, retentor de pelos, bombas, dosadores, filtros, cloração e entrada de água nova) e a água é tratada e recirculada no mínimo a cada 8 h (uso restrito) ou 6 h (uso público)?', r: [P('6.12'), P('6.13'), P('6.14')],
              c: 'O tanque tem sistema completo de recirculação e tratamento, com renovação da água no intervalo exigido.', nc: 'O sistema de recirculação e tratamento da água da piscina não atende às exigências.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['agua']},
            {id: 'outros_metodos', t: 'Outros métodos de desinfecção associados ao cloro (ozônio, UV, sal, ionização) são operados conforme o fabricante?', r: [P('6.2.5')],
              c: 'Os métodos de desinfecção associados ao cloro são operados conforme o fabricante.', nc: 'Os métodos de desinfecção associados ao cloro não são operados conforme o fabricante.',
              na: 'A desinfecção é feita somente com cloro.', inf: ['agua']},
            {id: 'tanque_vazio', t: 'O tanque fora de uso, quando vazio, está limpo, sem acúmulo de líquidos ou resíduos?', r: [P('6.2.1'), P('6.2')],
              c: 'O tanque fora de uso está limpo, sem acúmulo de líquidos ou resíduos.', nc: 'O tanque fora de uso não está limpo e livre de acúmulo de líquidos e resíduos.', na: 'O tanque estava em uso.', inf: ['agua']},
            {id: 'analises', t: 'Com cloro ou pH fora da faixa, ou sem monitoramento, foram apresentadas análises microbiológicas e pesquisa de algas, leveduras e amebas de vida livre, de laboratório regularizado?', r: [P('6.6'), P('6.6.1'), LM(100)],
              c: 'Foram apresentadas as análises microbiológicas solicitadas, de laboratório regularizado.', nc: 'Não foram apresentadas as análises microbiológicas e a pesquisa de algas, leveduras e amebas de vida livre solicitadas.',
              na: 'O cloro e o pH estavam dentro da faixa e havia monitoramento; não foi necessário solicitar análises.', inf: ['agua']}
          ],
          orient: [
            {t: 'Em São Paulo o parâmetro exigível é o da Portaria SMS 1.101/2015: pH 6,7 a 7,9 e cloro residual livre 0,5 a 0,8 mg/L. A NBR 10818 traz faixas próprias de qualidade; use-as como referência técnica, não como base da autuação.', f: 'Portaria SMS nº 1.101/2015, itens 6.2.2 e 6.2.4; ' + ABNT1},
            {t: 'O pH governa a eficácia do cloro: quanto mais alto o pH, menor a fração de ácido hipocloroso (a forma que desinfeta). Cloro dentro da faixa com pH alto desinfeta mal.', f: ABNT1},
            {t: 'Cheiro forte de “cloro” e ardor nos olhos costumam indicar cloro combinado (cloraminas, formado com suor e urina), não excesso de cloro livre. A correção é oxidação (supercloração) e renovação de água, não reduzir o cloro.', f: ABNT1},
            {t: 'Alcalinidade total funciona como tampão do pH; alcalinidade baixa faz o pH oscilar. Ácido cianúrico (estabilizador) protege o cloro do sol, mas em excesso reduz sua eficácia.', f: ABNT1},
            {t: 'Como medir: kit DPD para cloro livre e vermelho de fenol para pH, conforme as instruções do kit. O cloro é exigido em toda a extensão e profundidade do tanque: colete em mais de um ponto, longe dos retornos de água tratada. Leia o cloro livre logo após o reagente DPD 1, porque com o tempo o cloro combinado também dá cor. Compare com o registro do dia.', f: 'Portaria SMS nº 1.101/2015, item 6.2.4; Standard Methods for the Examination of Water and Wastewater, método 4500-Cl G (DPD colorimétrico); instruções de uso do fabricante do kit'},
            {t: 'Cloro livre, total e combinado: o DPD 1 mede o cloro livre; com o DPD 3, mede-se o cloro total; a diferença (total menos livre) é o cloro combinado (cloraminas). A Portaria exige o cloro residual livre.', f: 'Standard Methods for the Examination of Water and Wastewater, método 4500-Cl G; Portaria SMS nº 1.101/2015, item 6.2.4'},
            {t: 'Outros métodos de desinfecção: a Portaria aceita ozônio, UV, salinização e ionização associados à cloração, operados conforme o fabricante; nenhum deles dispensa o cloro residual livre de 0,5 a 0,8 mg/L. Ozônio e UV desinfetam a água que passa pelo equipamento e não deixam residual no tanque; o gerador de cloro por eletrólise de sal produz cloro no próprio sistema (é cloração); ionização cobre-prata não substitui o cloro.', f: 'Portaria SMS nº 1.101/2015, itens 6.2.4 e 6.2.5; OMS, Guidelines for safe recreational water environments, vol. 2: Swimming pools and similar environments (2006), cap. 5'},
            {t: 'Bromo e biguanida (PHMB) não dão leitura de cloro residual livre e não atendem ao parâmetro da Portaria; a biguanida é incompatível com o cloro. O que pedir no método associado: manual do fabricante, registros de manutenção e, no UV, as horas de uso da lâmpada frente à vida útil indicada.', f: 'Portaria SMS nº 1.101/2015, itens 6.2.4 e 6.2.5; OMS, Guidelines for safe recreational water environments, vol. 2: Swimming pools and similar environments (2006), cap. 5; instruções de uso do fabricante'}
          ]},
        {id: 'seguranca', titulo: 'Segurança dos banhistas', curto: 'Segurança',
          perguntas: [
            {id: 'guardiao', t: 'Há profissional responsável pela segurança dos banhistas (salva-vidas ou guardião), habilitado e uniformizado, durante todo o funcionamento da piscina?', r: [P('12.3'), L160(1), L160(3), L160(3, 'paragrafo', 'unico')],
              c: 'Há salva-vidas ou guardião de piscina habilitado e uniformizado durante todo o funcionamento.', nc: 'Não há profissional responsável pela segurança dos banhistas durante todo o funcionamento da piscina, nas condições exigidas.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['seguranca']},
            {id: 'placas_risco', t: 'Há placas informativas sobre o risco de acidentes na área da piscina?', r: [L160(2)],
              c: 'Há placas informativas sobre o risco de acidentes na área da piscina.', nc: 'Não há placas informativas sobre o risco de acidentes na área da piscina.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['seguranca']},
            {id: 'isolamento', t: 'A piscina é isolada por grade ou estrutura equivalente quando o responsável pela segurança está ausente?', r: [P('6.8')],
              c: 'A piscina é isolada quando o responsável pela segurança está ausente.', nc: 'A piscina não é isolada quando o responsável pela segurança dos banhistas está ausente.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['seguranca']},
            {id: 'profundidade', t: 'A profundidade está indicada nas bordas externas, nos pontos de menor, mediana e maior profundidade, com material antiderrapante, impermeável e de fácil visualização?', r: [P('6.9'), P('6.9.1'), L139(1), L139(2), L139(3)],
              c: 'A profundidade está indicada nas bordas nos pontos de menor, mediana e maior profundidade, de forma visível.', nc: 'A indicação de profundidade nas bordas da piscina não atende às exigências.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['seguranca']},
            {id: 'perimetro', t: 'O perímetro do tanque é pavimentado com material antiderrapante e a borda é elevada com caimento para fora?', r: [P('6.7')],
              c: 'O perímetro do tanque é antiderrapante e a borda é elevada com caimento para fora.', nc: 'O perímetro e a borda do tanque não atendem às exigências.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['seguranca']},
            {id: 'revest', t: 'O revestimento interno do tanque é resistente, liso, impermeável, sem falhas ou saliências, e as escadas têm corrimão e degraus antiderrapantes?', r: [P('6.10'), P('6.11')],
              c: 'O revestimento do tanque está íntegro e as escadas têm corrimão e degraus antiderrapantes.', nc: 'O revestimento e as escadas do tanque não atendem às exigências.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['seguranca']},
            {id: 'hidraulico', t: 'O sistema hidráulico (ralos de fundo, grelhas, sucção) atende à ABNT NBR 10339, com proteção contra aprisionamento?', r: [L17(3), L17(5), P('6.13')],
              c: 'O sistema hidráulico da piscina atende à ABNT NBR 10339, com proteção contra aprisionamento.', nc: 'O sistema hidráulico da piscina não atende à ABNT NBR 10339.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['hidraulico']},
            {id: 'restricao', t: 'O estabelecimento impede a entrada na piscina de pessoas com ferimentos abertos, curativos ou doenças transmissíveis pela água?', r: [P('6.18')],
              c: 'O estabelecimento impede a entrada na piscina de pessoas com ferimentos, curativos ou doenças transmissíveis.', nc: 'O estabelecimento não controla a entrada na piscina de pessoas com ferimentos abertos, com curativos e com doenças transmissíveis pela água.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['seguranca']}
          ],
          orient: [
            {t: 'Aprisionamento por sucção (cabelo, membro, corpo) no ralo de fundo é o acidente que a Lei 17.105/2019 quer evitar. A NBR 10339 trata de ralos de fundo duplos ou de dispositivo de alívio de vácuo, grelhas com tampa fixada por parafuso e área aberta suficiente, velocidade de sucção limitada e botão de parada de emergência da bomba visível perto do tanque.', f: ABNT2},
            {t: 'O que pedir: projeto ou laudo do sistema hidráulico, ou ART do responsável, que declare conformidade com a NBR 10339; ver a grelha (fixa, sem quebra, sem parafuso faltando) e onde fica o botão de desligamento da bomba.', f: 'Lei Municipal nº 17.105/2019, art. 3º; ' + ABNT2},
            {t: 'A Lei 13.993/2005 tem multa própria (art. 5º); a Portaria repete a exigência da profundidade no item 6.9, o que permite capitular como infração sanitária.', f: 'Lei Municipal nº 13.993/2005; Portaria SMS nº 1.101/2015, item 6.9'}
          ]},
        {id: 'lavapes', titulo: 'Lava-pés', curto: 'Lava-pés',
          perguntas: [
            {id: 'lp_uso', t: 'O acesso ao tanque só é possível passando pelo lava-pés, com dimensão e profundidade que garantem a submersão dos pés?', r: [P('6.15'), P('6.16')],
              c: 'O acesso ao tanque passa obrigatoriamente pelo lava-pés, que submerge os pés.', nc: 'O lava-pés não atende às exigências de passagem obrigatória e submersão dos pés.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['lavapes']},
            {id: 'lp_cloro', t: 'A água do lava-pés está límpida e com cloro residual acima de 25 mg/L?', r: [P('6.15')],
              c: 'A água do lava-pés está límpida e com cloro residual acima de 25 mg/L.', nc: 'A água do lava-pés não atende às condições exigidas.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['lavapes']},
            {id: 'lp_limpeza', t: 'O lava-pés é esvaziado, lavado e enxaguado diariamente (com troca mais frequente nos dias de maior uso) e mantido limpo e seco quando a piscina está fora de uso?', r: [P('6.17'), P('6.17.1')],
              c: 'O lava-pés é esvaziado e lavado diariamente e mantido seco quando a piscina está fora de uso.', nc: 'A higienização do lava-pés não atende às exigências.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['lavapes']}
          ],
          orient: [
            {t: 'Cloro acima de 25 mg/L está fora da faixa do kit DPD comum de piscina e, muito alto, descora o reagente e dá leitura falsamente baixa: use fita ou kit de faixa alta, ou dilua a amostra em água sem cloro e multiplique o resultado pelo fator de diluição.', f: 'Portaria SMS nº 1.101/2015, item 6.15; Standard Methods for the Examination of Water and Wastewater, método 4500-Cl G; instruções de uso do fabricante do kit'}
          ]},
        {id: 'maquinas', titulo: 'Casa de máquinas e operador', curto: 'Casa de máquinas',
          perguntas: [
            {id: 'cm_espaco', t: 'A casa de máquinas tem espaço para inspeção, operação e manutenção, é ventilada e iluminada, e não guarda produtos químicos nem materiais estranhos?', r: [P('6.19'), P('6.19.1')],
              c: 'A casa de máquinas tem espaço, ventilação e iluminação adequados e não guarda produtos químicos nem materiais estranhos.', nc: 'A casa de máquinas não atende às exigências.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['maquinas']},
            {id: 'operador', t: 'A qualidade da água é mantida e supervisionada por profissional com certificado de curso de operador de piscinas?', r: [P('12.2'), PI('14.2.1', 'iii')],
              c: 'A qualidade da água é mantida por operador de piscinas com certificado de capacitação.', nc: 'A qualidade da água não é mantida por profissional com certificado de curso de operador de piscinas.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['operador']},
            {id: 'epi_operador', t: 'O operador usa os EPIs indicados pelo fabricante ao manipular os produtos de desinfecção?', r: [P('12.6')],
              c: 'O operador usa os EPIs indicados ao manipular os produtos de desinfecção.', nc: 'O operador não usa os EPIs indicados ao manipular os produtos de desinfecção da água.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['epi']}
          ],
          orient: [
            {t: 'Produtos de piscina (hipoclorito, ácido, algicida) são incompatíveis entre si — misturar cloro com ácido libera gás cloro. Por isso ficam fora da casa de máquinas (item 6.19.1), em local próprio, ventilado e separado.', f: 'Portaria SMS nº 1.101/2015, item 6.19.1'}
          ]},
        {id: 'registros', titulo: 'Registros, acidentes e POPs da piscina', curto: 'Registros e POPs',
          perguntas: [
            {id: 'reg_medicao', t: 'pH e cloro do tanque e cloro do lava-pés são medidos antes de cada período (manhã, tarde, noite) e anotados com data, hora e assinatura, em registro disponível aos usuários e arquivado por 6 meses?', r: [P('6.20'), P('6.20.1'), P('6.20.2'), PI('14.2.1', 'iv')],
              c: 'O pH e o cloro do tanque e do lava-pés são medidos a cada período e registrados com data, hora e assinatura, disponíveis aos usuários e arquivados por 6 meses.',
              nc: 'O registro das medições de pH e cloro não atende às exigências.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['registros']},
            {id: 'reg_acidente', t: 'Acidentes com fezes, vômito ou animal morto no tanque são registrados (data e hora, abertura, banhistas, tanque, contaminante, cloro e pH no fechamento, tratamento e abertura, tempo de desinfecção)?', r: [P('6.5'), P('6.5.1'), P('6.5.2'), P('6.5.3'), P('6.5.4')],
              c: 'Os acidentes fecais, com vômito ou animal morto são registrados com as informações exigidas.', nc: 'O registro dos acidentes com contaminação do tanque não atende às exigências.',
              na: 'Não houve acidente com contaminação do tanque.', naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['registros']},
            {id: 'pop_piscina', t: 'Há POP de tratamento e controle da água da piscina com todo o conteúdo exigido e POP de higienização em acidentes (vômito, fezes, animal morto)?', r: [P('14.4'), PI('14.4', 'i'), PI('14.4', 'ii')],
              c: 'Há POP de tratamento da água da piscina e de higienização em acidentes.', nc: 'Os POPs da piscina não atendem às exigências.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'},
              checks: {rotulo: 'O POP de tratamento contempla (marque o que há; vai ao relatório)', opcoes: [['filtragem', 'Filtragem'], ['ph', 'Controle de pH'], ['aspiracao', 'Aspiração'], ['algicida', 'Adição de algicida'], ['bordas', 'Higienização das bordas'], ['retro', 'Retrolavagem do filtro'], ['alcal', 'Controle da alcalinidade'], ['cloracao', 'Cloração'], ['clarif', 'Clarificação e decantação'], ['acidente', 'POP de acidentes (vômito, fezes, animal morto)']], semOutro: true, frase: 'Há POP de tratamento da água da piscina, que contempla: {}.'},
              inf: ['pop']}
          ],
          orient: [
            {t: 'Acidente com fezes formadas: cloro 2 mg/L, pH 7,2–7,5, 25 °C, por 30 minutos, com filtros ligados. Fezes diarreicas, vômito ou animal morto: cloro 20 mg/L por 12 h 45 min, com retrolavagem ou troca do filtro depois. Em ambos, reabrir só com o cloro de volta a 0,5–0,8 mg/L e registrar.', f: 'Portaria SMS nº 1.101/2015, itens 6.5.1 a 6.5.3'},
            {t: 'Retrolavagem (lavagem do filtro em contrafluxo) é feita quando a pressão do filtro sobe acima da indicação do fabricante; um registro de retrolavagem ajuda a ver se o filtro recebe manutenção.', f: ABNT2}
          ]}
      ]
    },
    {
      id: 'sauna', titulo: 'Saunas e banheiras', curto: 'Saunas e banheiras', icone: 'cold',
      itens: [
        {id: 'sauna_itens', titulo: 'Sauna e banheiras', curto: 'Sauna e banheiras',
          perguntas: [
            {id: 'banheiras', t: 'Banheiras e recipientes de banho estão limpos, com revestimento íntegro, são higienizados a cada uso e o sistema de retrolavagem, se houver, é acionado a cada limpeza?', r: [P('7.1'), P('7.1.1'), P('7.1.2')],
              c: 'As banheiras estão limpas, íntegras e são higienizadas a cada uso.', nc: 'As banheiras não atendem às condições de higiene exigidas.', na: 'Não há banheiras.', naSe: {campo: 'p_sauna', igual: 'nao'}, inf: ['sauna']},
            {id: 'sauna_estr', t: 'A sauna está limpa e conservada, com piso antiderrapante, porta sem fechadura, maçanetas que abrem dos dois lados e não conduzem calor, termômetro visível, lâmpadas protegidas e fonte de calor protegida e afastada?', r: [P('7.2'), P('7.3'), P('7.4'), P('7.5'), P('7.6'), P('7.7'), P('7.8')],
              c: 'A sauna atende aos requisitos de higiene e segurança.', nc: 'A sauna não atende aos requisitos de higiene e segurança.',
              checks: {rotulo: 'Itens em falta (vai ao relatório)', opcoes: [['limpeza', 'Limpeza e conservação'], ['piso', 'Piso antiderrapante'], ['fechadura', 'Porta sem fechadura'], ['macaneta', 'Maçanetas adequadas'], ['termometro', 'Termômetro visível'], ['lampada', 'Lâmpadas protegidas'], ['calor', 'Fonte de calor protegida e afastada']], outro: 'Outros — descrever', frase: 'Itens da sauna verificados: {}.'},
              na: 'Não há sauna.', naSe: {campo: 'p_sauna', igual: 'nao'}, inf: ['sauna']},
            {id: 'sauna_chuveiro', t: 'Há chuveiros próximos à sauna, a sauna úmida usa água potável e os aromatizantes são regularizados?', r: [P('7.9'), P('7.10'), P('7.11')],
              c: 'Há chuveiros próximos à sauna, a água é potável e os aromatizantes são regularizados.', nc: 'A sauna não atende às exigências de chuveiros, água e aromatizantes.', na: 'Não há sauna.', naSe: {campo: 'p_sauna', igual: 'nao'}, inf: ['sauna']},
            {id: 'sauna_pop', t: 'Há POP de higienização das banheiras e saunas?', r: [P('7.12')],
              c: 'Há POP de higienização das banheiras e saunas.', nc: 'Não há POP de higienização das banheiras e saunas.', na: 'Não há sauna nem banheiras.', naSe: {campo: 'p_sauna', igual: 'nao'}, inf: ['pop']}
          ]}
      ]
    },
    {
      id: 'apoio', titulo: 'Produtos, água e controle de pragas', curto: 'Produtos e água', icone: 'box',
      itens: [
        {id: 'produtos', titulo: 'Produtos e alimentos', curto: 'Produtos',
          perguntas: [
            {id: 'prod_reg', t: 'Os produtos de interesse da saúde (saneantes, cosméticos, alimentos, suplementos) usados ou vendidos são regularizados, dentro da validade e usados conforme o fabricante?', r: [P('8.2'), P('8.3'), P('8.4')],
              c: 'Os produtos de interesse da saúde são regularizados, estão dentro da validade e são usados conforme o fabricante.', nc: 'Os produtos de interesse da saúde não atendem às exigências de regularização, validade e uso.', inf: ['produtos']},
            {id: 'alimentos', t: 'Havendo manipulação de alimentos, há dependência exclusiva e as Boas Práticas estão implantadas?', r: [P('8.1'), P('8.1.1')],
              c: 'A manipulação de alimentos ocorre em dependência exclusiva, com Boas Práticas implantadas.', nc: 'A manipulação de alimentos não atende às exigências.',
              na: 'Não há manipulação de alimentos no local.', naSe: {campo: 'p_alimentos', igual: 'nao'}, inf: ['produtos']}
          ],
          orient: [
            {t: 'Suplementos vendidos na academia: confira a regularização (RDC 243/2018 — suplementos alimentares) e a rotulagem; produtos com alegação de “emagrecer” ou “anabolizante natural” merecem consulta na Central de Consultas.', f: 'Portaria SMS nº 1.101/2015, item 8.2'}
          ]},
        {id: 'agua', titulo: 'Água para consumo e reservatório', curto: 'Água e reservatório',
          perguntas: [
            {id: 'reservatorio', t: 'O reservatório de água potável é acessível, protegido, vedado, de material adequado e está limpo e conservado?', r: [P('9.1'), P('9.2'), LM(27, 'inciso', 'i')],
              c: 'O reservatório de água potável está protegido, vedado, limpo e conservado.', nc: 'O reservatório de água não atende às exigências de proteção, limpeza e conservação.', inf: ['agua_consumo']},
            {id: 'res_limpeza', t: 'Há comprovante ou registro da limpeza e desinfecção do reservatório (na instalação, em intercorrências e na periodicidade da legislação)?', r: [P('9.3'), P('9.4'), P('9.5'), PI('14.2', 'v'), LM(27, 'inciso', 'i')],
              c: 'Há comprovante da limpeza e desinfecção periódica do reservatório.', nc: 'Não há comprovante da limpeza e desinfecção periódica do reservatório de água.', inf: ['agua_consumo']},
            {id: 'alternativa', t: 'A água de solução alternativa (poço, caminhão-pipa) tem controle de potabilidade com laudos arquivados por 6 meses?', r: [P('9.6'), PI('14.2.1', 'i'), PI('14.2.1', 'ii'), LM(27, 'inciso', 'i')],
              c: 'A água de solução alternativa tem controle de potabilidade com laudos arquivados.', nc: 'A água de solução alternativa não tem controle de potabilidade comprovado por laudos.',
              na: 'O abastecimento é pela rede pública.', naSe: {campo: 'p_alternativa', igual: 'nao'}, inf: ['agua_consumo']},
            {id: 'bebedouros', t: 'Bebedouros e filtros estão limpos e conservados, com manutenção registrada conforme o fabricante?', r: [P('9.7'), P('9.7.1'), LM(27, 'inciso', 'i')],
              c: 'Os bebedouros e filtros estão limpos e conservados, com manutenção registrada.', nc: 'Os bebedouros e filtros não atendem às exigências de limpeza e manutenção.', na: 'Não há bebedouros nem filtros.', inf: ['agua_consumo']}
          ],
          orient: [
            {t: 'A limpeza da caixa d’água segue os métodos da Sabesp ou da Secretaria da Saúde; a Portaria cita os Comunicados CVS 006/2011 e CVS/SAMA 11/2015 (periodicidade semestral). Peça o comprovante da empresa ou o registro próprio.', f: 'Portaria SMS nº 1.101/2015, itens 9.3 a 9.5 e bibliografia'}
          ]},
        {id: 'pragas_res', titulo: 'Controle de pragas', curto: 'Controle de pragas',
          perguntas: [
            {id: 'pragas', t: 'Há controle integrado de pragas e, quando houve aplicação de desinfestantes, ela foi feita por empresa regularizada (com comprovante)?', r: [P('10.1'), P('10.2'), LM(19, 'paragrafo', '2')],
              c: 'Há controle integrado de pragas, com aplicação de desinfestantes por empresa regularizada.', nc: 'O controle de pragas não atende às exigências.', inf: ['pragas']}
          ]}
      ]
    },
    {
      id: 'pessoal', titulo: 'Pessoal e documentação', curto: 'Pessoal e documentos', icone: 'folder',
      itens: [
        {id: 'equipe', titulo: 'Pessoal e EPIs', curto: 'Pessoal',
          perguntas: [
            {id: 'epi', t: 'Os EPIs necessários estão disponíveis em número suficiente, são usados conforme a função e não ficam guardados junto com produtos químicos?', r: [P('12.4'), P('12.5')],
              c: 'Os EPIs estão disponíveis em número suficiente, são usados corretamente e guardados separados dos produtos químicos.', nc: 'O fornecimento, o uso e a guarda dos EPIs não atendem às exigências.', inf: ['epi']},
            {id: 'atualizacao', t: 'Os funcionários passam, no mínimo anualmente, por atualização profissional, com comprovante?', r: [P('12.7'), PI('14.2', 'vi')],
              c: 'Os funcionários passam por atualização profissional anual, com comprovante.', nc: 'Não há comprovante de atualização profissional anual dos funcionários.', inf: ['docs']}
          ]},
        {id: 'pops', titulo: 'POPs e documentos', curto: 'POPs',
          perguntas: [
            {id: 'pops_gerais', t: 'Há POPs de higienização das instalações, equipamentos, móveis e utensílios e de limpeza e desinfecção do reservatório, atualizados e de fácil acesso aos funcionários?', r: [P('14.3'), PI('14.3', 'i'), PI('14.3', 'ii'), P('14.5'), P('14.6')],
              c: 'Há POPs de higienização das instalações e de limpeza do reservatório, atualizados e acessíveis aos funcionários.', nc: 'Os POPs de higienização não atendem às exigências.',
              checks: {rotulo: 'POPs apresentados (vai ao relatório)', opcoes: [['higienizacao', 'Higienização das instalações, equipamentos, móveis e utensílios'], ['reservatorio', 'Limpeza e desinfecção do reservatório de água']], semOutro: true, frase: 'Foram apresentados os POPs de: {}.'},
              inf: ['pop']},
            {id: 'pops_ciencia', t: 'Há documento que comprove que os funcionários foram informados do conteúdo dos POPs?', r: [PI('14.2', 'iii'), P('14.6')],
              c: 'Há documento de ciência dos POPs pelos funcionários.', nc: 'Não há documento que comprove a ciência dos POPs pelos funcionários.', inf: ['pop']},
            {id: 'docs_disp', t: 'Os documentos exigidos estão no estabelecimento, organizados, atualizados e disponíveis para a autoridade sanitária?', r: [P('14.1'), P('14.2'), LM(100)],
              c: 'Os documentos exigidos estão organizados, atualizados e disponíveis.', nc: 'Os documentos exigidos não estavam organizados, atualizados e disponíveis para a autoridade sanitária.', inf: ['docs']}
          ]}
      ]
    }
  ],
  /* infrações: a conduta descrita pelo que a norma exige, sem alternativas (“ou”);
     a Lei 13.725/2004, art. 69, entra em todas pelo motor (leiBase) */
  infracoes: [
    {id: 'lic', grupo: 'Licenciamento e responsabilidade', texto: 'Exercer atividade de interesse da saúde sem licença sanitária (CMVS) compatível com as atividades exercidas.', r: [LM(90), LM(90, 'paragrafo', '1')]},
    {id: 'rt', grupo: 'Licenciamento e responsabilidade', texto: 'Funcionar sem a supervisão de responsável técnico legalmente habilitado.', r: [L11(1), L11('2-b'), P('12.1')]},
    {id: 'parq', grupo: 'Controle de saúde', texto: 'Deixar de exigir dos alunos o PAR-Q, o Termo de Responsabilidade e o atestado médico nos casos previstos em lei.', r: [L11(2), L11('2-a'), L11('2-b'), P('13.1')]},
    {id: 'placa', grupo: 'Controle de saúde', texto: 'Deixar de afixar, em local visível, a placa de aviso sobre contraindicação para a prática de atividades físicas.', r: [L11('2-c'), L11('2-b')]},
    {id: 'instal', grupo: 'Instalações', texto: 'Deixar de manter as instalações limpas, organizadas, conservadas, ventiladas, iluminadas e protegidas contra animais sinantrópicos.', r: [P('3.1'), P('3.2'), P('3.3'), P('3.4'), P('3.5'), P('3.6'), LM(19, 'paragrafo', '2')]},
    {id: 'sanit', grupo: 'Instalações', texto: 'Deixar de manter sanitários, vestiários e trocador de fraldas com os itens obrigatórios de higiene e separação.', r: [P('4.1'), P('4.2'), P('4.3'), P('4.4'), P('4.5'), P('4.6')]},
    {id: 'pratica', grupo: 'Áreas de prática', texto: 'Deixar de manter áreas de prática, pisos, quadras e equipamentos em condições seguras para os usuários.', r: [P('5.1'), P('5.2'), P('5.2.1'), P('5.3'), P('5.4'), P('5.5'), P('5.7')]},
    {id: 'higiene', grupo: 'Áreas de prática', texto: 'Deixar de higienizar colchonetes, assentos e equipamentos de contato corporal após cada uso, com produto à disposição dos usuários.', r: [P('5.6'), P('5.6.1'), P('5.6.2'), P('5.6.3'), P('5.8'), P('5.8.1')]},
    {id: 'dea', grupo: 'Áreas de prática', texto: 'Deixar de manter desfibrilador externo automático, com pessoal capacitado para seu uso, em estabelecimento com mais de 1.000 sócios.', r: [L1394(1), L1394(1, 'paragrafo', '2'), L1394(3)]},
    {id: 'agua', grupo: 'Piscina', texto: 'Manter a água da piscina fora dos padrões de pH, cloro residual livre e limpidez, sem o sistema de recirculação e tratamento exigido.', r: [P('6.2'), P('6.2.2'), P('6.2.4'), P('6.3'), P('6.4'), P('6.12'), P('6.13'), P('6.14')]},
    {id: 'seguranca', grupo: 'Piscina', texto: 'Deixar de manter as condições de segurança dos banhistas exigidas para a piscina.', r: [P('6.7'), P('6.8'), P('6.9'), P('6.10'), P('6.11'), P('6.18'), P('12.3'), L160(1), L139(1)]},
    {id: 'hidraulico', grupo: 'Piscina', texto: 'Manter piscina com sistema hidráulico em desacordo com a ABNT NBR 10339, sem proteção contra aprisionamento.', r: [L17(3), L17(5)]},
    {id: 'lavapes', grupo: 'Piscina', texto: 'Permitir o acesso ao tanque sem passagem por lava-pés abastecido, com cloro acima de 25 mg/L e higienizado diariamente.', r: [P('6.15'), P('6.16'), P('6.17')]},
    {id: 'maquinas', grupo: 'Piscina', texto: 'Deixar de manter a casa de máquinas com espaço, ventilação e iluminação adequados, livre de produtos químicos e de materiais estranhos à atividade.', r: [P('6.19'), P('6.19.1')]},
    {id: 'operador', grupo: 'Piscina', texto: 'Manter a qualidade da água da piscina sob responsabilidade de profissional sem certificado de curso de operador de piscinas.', r: [P('12.2')]},
    {id: 'registros', grupo: 'Piscina', texto: 'Deixar de medir e registrar o pH e o cloro do tanque e do lava-pés, e de registrar os acidentes com contaminação do tanque.', r: [P('6.5.4'), P('6.20'), P('6.20.1'), P('6.20.2')]},
    {id: 'sauna', grupo: 'Saunas e banheiras', texto: 'Deixar de manter sauna e banheiras nas condições de higiene e segurança exigidas.', r: [P('7.1'), P('7.2'), P('7.3'), P('7.4'), P('7.5'), P('7.6'), P('7.7'), P('7.8'), P('7.9'), P('7.10'), P('7.11')]},
    {id: 'produtos', grupo: 'Produtos e água', texto: 'Utilizar, armazenar e comercializar produtos de interesse da saúde em desacordo com a regularização, a validade e as recomendações do fabricante.', r: [P('8.1'), P('8.2'), P('8.3'), P('8.4')]},
    {id: 'agua_consumo', grupo: 'Produtos e água', texto: 'Deixar de manter o reservatório, os bebedouros e os filtros nas condições de proteção, limpeza e desinfecção exigidas, com controle da potabilidade da água.', r: [P('9.1'), P('9.2'), P('9.3'), P('9.4'), P('9.6'), P('9.7'), LM(27, 'inciso', 'i')]},
    {id: 'pragas', grupo: 'Produtos e água', texto: 'Deixar de adotar o controle integrado de pragas, com aplicação de desinfestantes por empresa regularizada.', r: [P('10.1'), P('10.2'), LM(19, 'paragrafo', '2')]},
    {id: 'residuos', grupo: 'Produtos e água', texto: 'Deixar de acondicionar e armazenar os resíduos sólidos nas condições exigidas.', r: [P('11.1'), P('11.2'), P('11.3'), P('11.4')]},
    {id: 'epi', grupo: 'Pessoal e documentação', texto: 'Deixar de fornecer EPIs em número suficiente, de exigir seu uso conforme a função e de guardá-los separados dos produtos químicos.', r: [P('12.4'), P('12.5'), P('12.6')]},
    {id: 'pop', grupo: 'Pessoal e documentação', texto: 'Deixar de elaborar, manter atualizados e dar ciência aos funcionários dos Procedimentos Operacionais Padronizados exigidos.', r: [P('7.12'), P('14.3'), P('14.4'), P('14.6')]},
    {id: 'docs', grupo: 'Pessoal e documentação', texto: 'Deixar de manter no estabelecimento, organizados e disponíveis à autoridade sanitária, os documentos exigidos.', r: [P('14.1'), P('14.2'), LM(100)]}
  ]
};

/* ---------- 17/10/2026: checklist com frase própria por ponto e ambientes ----------
   q.pontos [id, rótulo, frase]: cada ponto Atende / Não atende / N/A; o
   resultado da pergunta acompanha os pontos e o relatório traz só a frase dos
   pontos não atendidos (sem “X ou Y”). */
const PONTOS = {
  licenca: [['licenca', 'licença sanitária (CMVS) vigente', 'O estabelecimento não possui licença sanitária (CMVS).'], ['atividades', 'todas as atividades exercidas constam da licença', 'O estabelecimento exerce atividade que não consta da licença sanitária e não foi comunicada à autoridade sanitária.']],
  parq_aplic: [['respondido', 'PAR-Q respondido pelos alunos de 15 a 69 anos', 'Há alunos de 15 a 69 anos sem o PAR-Q respondido.'], ['anual', 'PAR-Q renovado anualmente', 'O PAR-Q não é renovado anualmente.']],
  atestado_idade: [['atestado', 'atestado médico dos alunos fora da faixa de 15 a 69 anos', 'Há alunos fora da faixa de 15 a 69 anos sem atestado médico.'], ['nome', 'nome completo do médico no atestado', 'Há atestados médicos sem o nome completo do médico.'], ['crm', 'número do CRM no atestado', 'Há atestados médicos sem o número do CRM do médico.']],
  federado: [['exame', 'exame médico prévio', 'Há atletas federados sem exame médico prévio.'], ['semestral', 'renovação a cada seis meses', 'O exame médico dos atletas federados não é renovado a cada seis meses.'], ['anotado', 'anotação do exame nos registros', 'O exame médico dos atletas federados não está anotado nos registros.'], ['atestado', 'atestado anexado', 'Os registros dos atletas federados não têm o atestado médico anexado.'], ['menores', 'autorização dos responsáveis, para menores', 'Há atletas federados menores de idade sem autorização dos responsáveis.']],
  parq_docs: [['atestados', 'atestados médicos organizados', 'Os atestados médicos não estavam organizados.'], ['parq', 'PAR-Q organizados', 'Os PAR-Q não estavam organizados.'], ['termos', 'termos de responsabilidade organizados', 'Os termos de responsabilidade não estavam organizados.'], ['disp', 'documentos apresentados à autoridade sanitária', 'Os atestados, PAR-Q e termos de responsabilidade não foram apresentados à autoridade sanitária.']],
  animais: [['risco', 'segurança dos usuários preservada', 'A presença de animais domésticos oferece risco aos usuários.'], ['higiene', 'condições de higiene preservadas', 'A presença de animais domésticos compromete as condições higiênico-sanitárias.']],
  separados: [['sexo', 'separação por sexo', 'Os sanitários e vestiários não são separados por sexo.'], ['demanda', 'quantidade suficiente para a demanda', 'Os sanitários e vestiários são insuficientes para a demanda.'], ['chuveiro', 'ao menos um chuveiro protegido por porta e divisória', 'Não há chuveiro protegido por porta e divisória.'], ['vaso', 'ao menos um vaso protegido por porta e divisória', 'Não há vaso sanitário protegido por porta e divisória.']],
  trocador: [['pia', 'pia próxima ao trocador', 'Não há pia próxima ao trocador de fraldas.'], ['sabonete', 'sabonete líquido na pia', 'A pia junto ao trocador de fraldas não tem sabonete líquido.'], ['secagem', 'secagem higiênica das mãos', 'A pia junto ao trocador de fraldas não tem meio de secagem higiênica das mãos.'], ['lixeira', 'lixeira com tampa sem contato manual', 'O trocador de fraldas não tem lixeira com tampa de acionamento sem contato manual.'], ['revestimento', 'revestimento impermeável', 'O trocador de fraldas não tem revestimento impermeável.'], ['produto', 'produto de higienização identificado', 'Não há produto identificado para a higienização do trocador de fraldas.'], ['alcance', 'produto fora do alcance das crianças', 'O produto de higienização do trocador de fraldas fica ao alcance das crianças.']],
  armarios: [['usuarios', 'armários para os usuários', 'Não há armários para a guarda de roupas e objetos pessoais dos usuários.'], ['funcionarios', 'armários para os funcionários', 'Não há armários para a guarda de roupas e objetos pessoais dos funcionários.']],
  colchonetes: [['apos_uso', 'higienização após cada uso', 'Os colchonetes e assentos não são higienizados após cada uso.'], ['produto', 'produto indicado, usado conforme o fabricante', 'O produto de higienização dos colchonetes e assentos não é usado conforme o fabricante.'], ['disposicao', 'recipiente do produto identificado e à disposição dos usuários', 'Não há recipiente identificado com o produto de higienização à disposição dos usuários.'], ['separacao', 'separação entre higienizados e não higienizados', 'Não há separação entre colchonetes e assentos higienizados e não higienizados.']],
  aval_hig: [['colchonetes', 'colchonetes higienizados após cada uso', 'Os colchonetes da avaliação física não são higienizados após cada uso.'], ['equipamentos', 'equipamentos higienizados após cada uso', 'Os equipamentos da avaliação física não são higienizados após cada uso.'], ['alcool', 'produto alcoólico para as mãos na sala', 'Não há produto alcoólico para as mãos na sala de avaliação física.']],
  dea_capac: [['cipa', 'membros da CIPA capacitados', 'Os membros da CIPA não são capacitados no uso do desfibrilador.'], ['brigada', 'brigada de incêndio capacitada', 'A brigada de incêndio não é capacitada no uso do desfibrilador.'], ['turno', 'dois funcionários capacitados por turno, por aparelho', 'Não há dois funcionários capacitados no uso do desfibrilador por turno, para cada aparelho.']],
  limpidez: [['visao', 'visão perfeita da parte mais funda', 'A água da piscina não permite ver a parte mais funda do tanque.'], ['superficie', 'superfície livre de matéria flutuante', 'Há matéria flutuante na superfície da água da piscina.'], ['fundo', 'fundo livre de detritos', 'Há detritos no fundo do tanque.']],
  recirc: [['entradas', 'entradas e grelhas de fundo', 'O sistema de recirculação não tem entradas e grelhas de fundo.'], ['retentor', 'retentor de pelos', 'O sistema de recirculação não tem retentor de pelos.'], ['bombas', 'bombas e dosadores', 'O sistema de recirculação não tem bombas e dosadores.'], ['filtros', 'filtros', 'O sistema de recirculação não tem filtros.'], ['cloracao', 'sistema de cloração', 'O sistema de recirculação não tem sistema de cloração.'], ['agua_nova', 'entrada de água nova', 'O sistema de recirculação não tem entrada de água nova.'], ['ciclo', 'tratamento e recirculação no intervalo exigido (8 h no uso restrito; 6 h no uso público)', 'A água do tanque não é tratada e recirculada no intervalo exigido (8 h no uso restrito; 6 h no uso público).']],
  tanque_vazio: [['liquidos', 'tanque vazio sem acúmulo de água', 'O tanque fora de uso tem acúmulo de água, com risco de criadouro de vetores.'], ['residuos', 'tanque vazio sem acúmulo de resíduos', 'O tanque fora de uso tem acúmulo de resíduos.']],
  analises: [['micro', 'análises microbiológicas', 'Não foram apresentadas as análises microbiológicas da água da piscina.'], ['algas', 'pesquisa de algas, leveduras e amebas de vida livre', 'Não foi apresentada a pesquisa de algas, leveduras e amebas de vida livre.'], ['lab', 'laboratório regularizado', 'As análises da água da piscina não são de laboratório regularizado.']],
  guardiao: [['presente', 'profissional presente durante todo o funcionamento', 'Não há profissional responsável pela segurança dos banhistas durante todo o funcionamento da piscina.'], ['habilitado', 'profissional habilitado', 'O profissional responsável pela segurança dos banhistas não é habilitado.'], ['uniforme', 'profissional uniformizado', 'O profissional responsável pela segurança dos banhistas não está uniformizado.']],
  profundidade: [['pontos', 'indicação nos pontos de menor, mediana e maior profundidade', 'A profundidade não está indicada nos pontos de menor, mediana e maior profundidade.'], ['bordas', 'indicação nas bordas externas', 'A indicação de profundidade não está nas bordas externas.'], ['material', 'material antiderrapante e impermeável', 'A indicação de profundidade não é de material antiderrapante e impermeável.'], ['visivel', 'indicação de fácil visualização', 'A indicação de profundidade não é de fácil visualização.']],
  perimetro: [['antiderrapante', 'perímetro pavimentado com material antiderrapante', 'O perímetro do tanque não é pavimentado com material antiderrapante.'], ['borda', 'borda elevada com caimento para fora', 'A borda do tanque não é elevada com caimento para fora.']],
  revest: [['revestimento', 'revestimento interno íntegro, liso e impermeável', 'O revestimento interno do tanque não está íntegro, liso e impermeável.'], ['corrimao', 'escadas com corrimão', 'As escadas do tanque não têm corrimão.'], ['degraus', 'degraus antiderrapantes', 'Os degraus das escadas do tanque não são antiderrapantes.']],
  hidraulico: [['ralos', 'ralos de fundo e grelhas conforme a NBR 10339', 'Os ralos de fundo e as grelhas não atendem à ABNT NBR 10339.'], ['aprisionamento', 'proteção contra aprisionamento por sucção', 'O sistema hidráulico não tem proteção contra aprisionamento por sucção.'], ['parada', 'meio de desligar a bomba em emergência', 'Não há meio de desligar a bomba em emergência.']],
  lp_uso: [['passagem', 'acesso ao tanque somente pelo lava-pés', 'O lava-pés pode ser contornado no acesso ao tanque.'], ['dimensao', 'dimensão e profundidade que garantem a submersão dos pés', 'O lava-pés não tem dimensão e profundidade que garantam a submersão dos pés.']],
  lp_cloro: [['limpida', 'água límpida', 'A água do lava-pés está turva.'], ['cloro', 'cloro residual acima de 25 mg/L', 'O cloro residual da água do lava-pés está abaixo de 25 mg/L.']],
  lp_limpeza: [['diaria', 'esvaziamento, lavagem e enxágue diários', 'O lava-pés não é esvaziado, lavado e enxaguado diariamente.'], ['frequencia', 'troca mais frequente nos dias de maior uso', 'A água do lava-pés não é trocada com mais frequência nos dias de maior uso.'], ['seco', 'mantido limpo e seco com a piscina fora de uso', 'O lava-pés não é mantido limpo e seco com a piscina fora de uso.']],
  cm_espaco: [['espaco', 'espaço para inspeção, operação e manutenção', 'A casa de máquinas não tem espaço para inspeção, operação e manutenção.'], ['ventilada', 'ventilação', 'A casa de máquinas não é ventilada.'], ['iluminada', 'iluminação', 'A casa de máquinas não é iluminada.'], ['quimicos', 'sem produtos químicos guardados', 'Há produtos químicos guardados na casa de máquinas.'], ['estranhos', 'sem materiais estranhos à atividade', 'Há materiais estranhos à atividade na casa de máquinas.']],
  reg_medicao: [['periodo', 'medição antes de cada período', 'As medições de pH e cloro não são feitas antes de cada período de funcionamento.'], ['tanque', 'pH e cloro do tanque registrados', 'O pH e o cloro do tanque não são registrados.'], ['lavapes', 'cloro do lava-pés registrado', 'O cloro do lava-pés não é registrado.'], ['assinatura', 'data, hora e assinatura', 'O registro das medições não tem data, hora e assinatura.'], ['usuarios', 'registro disponível aos usuários', 'O registro das medições não fica disponível aos usuários.'], ['arquivo', 'arquivo por 6 meses', 'O registro das medições não é arquivado por 6 meses.']],
  reg_acidente: [['data', 'data e hora do acidente e da reabertura'], ['banhistas', 'número de banhistas'], ['contaminante', 'tanque e tipo de contaminante'], ['parametros', 'cloro e pH no fechamento'], ['tratamento', 'tratamento aplicado'], ['tempo', 'tempo de desinfecção']],
  pop_piscina: [['filtragem', 'filtragem'], ['ph', 'controle de pH'], ['aspiracao', 'aspiração'], ['algicida', 'adição de algicida'], ['bordas', 'higienização das bordas'], ['retro', 'retrolavagem do filtro'], ['alcal', 'controle da alcalinidade'], ['cloracao', 'cloração'], ['clarif', 'clarificação e decantação'], ['acidente', 'POP de higienização em acidentes (vômito, fezes, animal morto)', 'Não há POP de higienização em acidentes com vômito, fezes e animal morto no tanque.']],
  banheiras: [['limpas', 'banheiras limpas', 'As banheiras não estão limpas.'], ['revestimento', 'revestimento íntegro', 'O revestimento das banheiras não está íntegro.'], ['cada_uso', 'higienização a cada uso', 'As banheiras não são higienizadas a cada uso.'], ['retro', 'retrolavagem acionada a cada limpeza, quando houver o sistema', 'O sistema de retrolavagem das banheiras não é acionado a cada limpeza.']],
  sauna_estr: [['limpa', 'sauna limpa', 'A sauna não está limpa.'], ['conservada', 'sauna conservada', 'A sauna não está conservada.'], ['piso', 'piso antiderrapante', 'O piso da sauna não é antiderrapante.'], ['fechadura', 'porta sem fechadura', 'A porta da sauna tem fechadura.'], ['macaneta', 'maçanetas que abrem dos dois lados', 'As maçanetas da sauna não abrem dos dois lados.'], ['calor_mac', 'maçanetas que não conduzem calor', 'As maçanetas da sauna conduzem calor.'], ['termometro', 'termômetro visível', 'Não há termômetro visível na sauna.'], ['lampada', 'lâmpadas protegidas', 'As lâmpadas da sauna não são protegidas.'], ['calor', 'fonte de calor protegida', 'A fonte de calor da sauna não é protegida.'], ['afastada', 'fonte de calor afastada dos usuários', 'A fonte de calor da sauna não fica afastada dos usuários.']],
  sauna_chuveiro: [['chuveiros', 'chuveiros próximos à sauna', 'Não há chuveiros próximos à sauna.'], ['agua', 'água potável na sauna úmida', 'A sauna úmida não usa água potável.'], ['aromatizantes', 'aromatizantes regularizados', 'Os aromatizantes usados na sauna não são regularizados.']],
  prod_reg: [['regularizados', 'produtos regularizados', 'Há produtos de interesse da saúde sem regularização.'], ['validade', 'produtos dentro da validade', 'Há produtos de interesse da saúde vencidos.'], ['uso', 'uso conforme o fabricante', 'Há produtos de interesse da saúde usados fora das recomendações do fabricante.']],
  alimentos: [['dependencia', 'dependência exclusiva para alimentos', 'A manipulação de alimentos não ocorre em dependência exclusiva.'], ['bp', 'Boas Práticas implantadas', 'Não há Boas Práticas implantadas na manipulação de alimentos.']],
  reservatorio: [['acessivel', 'reservatório acessível', 'O reservatório de água não é acessível para inspeção e limpeza.'], ['protegido', 'protegido e vedado', 'O reservatório de água não está protegido e vedado.'], ['material', 'material adequado', 'O reservatório de água não é de material adequado.'], ['limpo', 'limpo e conservado', 'O reservatório de água não está limpo e conservado.']],
  res_limpeza: [['comprovante', 'comprovante ou registro da limpeza e desinfecção', 'Não há comprovante da limpeza e desinfecção do reservatório de água.'], ['periodicidade', 'periodicidade da legislação (semestral)', 'A limpeza e a desinfecção do reservatório de água não seguem a periodicidade semestral.']],
  bebedouros: [['limpos', 'bebedouros e filtros limpos e conservados', 'Os bebedouros e filtros não estão limpos e conservados.'], ['manutencao', 'manutenção registrada conforme o fabricante', 'Não há registro da manutenção dos bebedouros e filtros conforme o fabricante.']],
  pragas: [['controle', 'controle integrado de pragas', 'Não há controle integrado de pragas.'], ['empresa', 'aplicação por empresa regularizada, com comprovante', 'A aplicação de desinfestantes não foi feita por empresa regularizada.']],
  epi: [['disponiveis', 'EPIs disponíveis em número suficiente', 'Os EPIs não estão disponíveis em número suficiente.'], ['uso', 'uso conforme a função', 'Os EPIs não são usados conforme a função.'], ['guarda', 'guarda separada dos produtos químicos', 'Os EPIs ficam guardados junto com produtos químicos.']],
  pops_gerais: [['higienizacao', 'POP de higienização das instalações, equipamentos, móveis e utensílios', 'Não há POP de higienização das instalações, equipamentos, móveis e utensílios.'], ['reservatorio', 'POP de limpeza e desinfecção do reservatório', 'Não há POP de limpeza e desinfecção do reservatório de água.'], ['atualizados', 'POPs atualizados', 'Os POPs não estão atualizados.'], ['acesso', 'POPs de fácil acesso aos funcionários', 'Os POPs não ficam de fácil acesso aos funcionários.']],
  docs_disp: [['presentes', 'documentos no estabelecimento', 'Os documentos exigidos não estavam no estabelecimento.'], ['organizados', 'organizados e atualizados', 'Os documentos exigidos não estavam organizados e atualizados.'], ['disponiveis', 'apresentados à autoridade sanitária', 'Os documentos exigidos não foram apresentados à autoridade sanitária.']]
};
/* pontos sem frase própria: a lista do que falta */
const NC_PONTOS = {
  reg_acidente: 'O registro dos acidentes com contaminação do tanque não traz: {}.', pop_piscina: 'O POP de tratamento da água da piscina não contempla: {}.'
};
const QS = {};
module.exports.secoes.forEach(s => s.itens.forEach(i => (i.perguntas || []).forEach(q => { QS[q.id] = q; })));
for (const [id, pts] of Object.entries(PONTOS)) {
  const q = QS[id]; if (!q) throw Error('pontos: pergunta ' + id);
  q.pontos = pts; delete q.checks;
  if (NC_PONTOS[id]) q.ncPontos = NC_PONTOS[id];
}
/* piscina: o perfil “não possui piscina” marca todas as verificações do tanque */
['outros_metodos', 'tanque_vazio', 'analises'].forEach(id => { QS[id].naSe = {campo: 'p_piscina', igual: 'nao'}; QS[id].na = SEM_PISC; });
/* ambientes do estabelecimento e irregularidades por ambiente: lista geral e listas por tipo de
   ambiente, cada irregularidade um problema só (sem “ou”) */
const SIN = LM(19, 'paragrafo', '2');
const PRATICA = [
  ['—', 'Piso e proteção contra quedas'], ['p01', 'Piso escorregadio', [P('5.2')], 'pratica'], ['p02', 'Piso solto', [P('5.2')], 'pratica'], ['p03', 'Piso desnivelado', [P('5.2')], 'pratica'],
  ['p04', 'Local com risco de queda sem barreira física', [P('5.1')], 'pratica'],
  ['—', 'Equipamentos'], ['p05', 'Equipamento sujo', [P('5.3')], 'pratica'], ['p06', 'Equipamento enferrujado', [P('5.3')], 'pratica'], ['p07', 'Equipamento danificado', [P('5.3')], 'pratica'],
  ['p08', 'Equipamento instalado sem estabilidade', [P('5.3')], 'pratica'], ['p09', 'Circulação entre os equipamentos obstruída', [P('5.3.1')], 'pratica'],
  ['p10', 'Anilhas e barras fora dos suportes', [P('5.4')], 'pratica'], ['p11', 'Anilhas e barras danificadas', [P('5.4')], 'pratica'],
  ['—', 'Espelhos, colchonetes e assentos'], ['p12', 'Espelho quebrado', [P('5.5')], 'pratica'], ['p13', 'Espelho trincado', [P('5.5')], 'pratica'], ['p14', 'Espelho mal fixado', [P('5.5')], 'pratica'],
  ['p15', 'Colchonetes danificados', [P('5.6')], 'higiene'], ['p16', 'Assentos danificados', [P('5.6')], 'higiene']
];
const SANIT = [
  ['s01', 'Vaso sanitário sem assento', [P('4.3')], 'sanit'], ['s02', 'Vaso sanitário sem tampa', [P('4.3')], 'sanit'], ['s03', 'Vaso sanitário sem sifão', [P('4.3')], 'sanit'],
  ['s04', 'Descarga sem funcionar', [P('4.3')], 'sanit'], ['s05', 'Pia sem sabonete líquido', [P('4.3')], 'sanit'], ['s06', 'Pia sem meio de secagem higiênica das mãos', [P('4.3')], 'sanit'],
  ['s07', 'Sem lixeira para papel toalha', [P('4.3')], 'sanit']
];
module.exports.secoes.find(s => s.id === 'instal').itens.unshift({
  id: 'inventario', titulo: 'Ambientes do estabelecimento', curto: 'Ambientes',
  descricao: 'Marque os ambientes que o estabelecimento possui e, em cada um, só o que estiver irregular. Limpeza, sinantrópicos, elétrica, ventilação, iluminação, ralos, lixeiras, pisos, equipamentos e itens de sanitários e vestiários são verificados aqui, ambiente por ambiente.',
  campos: [{id: 'amb_inv', rotulo: 'Ambientes do estabelecimento', tipo: 'ambientes', largo: true, inf: ['instal'], r: [P('3.1')],
    ambientes: [['Recepção', 'geral'], ['Sala de musculação', 'pratica'], ['Sala de ginástica / dança', 'pratica'], ['Sala de lutas', 'lutas'], ['Sala de avaliação física', 'pratica'],
      ['Área da piscina', 'geral'], ['Sauna', 'geral'], ['Vestiário masculino', 'vestiario'], ['Vestiário feminino', 'vestiario'], ['Sanitário masculino', 'sanitario'], ['Sanitário feminino', 'sanitario'],
      ['Quadra', 'quadra'], ['Depósito de material de limpeza', 'geral'], ['Área de resíduos', 'residuos'], ['Lanchonete / copa', 'geral']],
    lista: [
      ['—', 'Estrutura'], ['a01', 'Piso danificado', [P('3.1')]], ['a02', 'Paredes danificadas', [P('3.1')]], ['a03', 'Teto danificado', [P('3.1')]],
      ['a04', 'Infiltração', [P('3.1')]], ['a05', 'Mofo', [P('3.1')]],
      ['—', 'Limpeza e organização'], ['a06', 'Ambiente sujo', [P('3.1')]],
      ['a07', 'Materiais em desuso', [P('3.2.1')]], ['a08', 'Materiais alheios à atividade', [P('3.2.1')]], ['a09', 'Produtos, equipamentos e utensílios desorganizados', [P('3.2')]],
      ['—', 'Instalação elétrica'], ['a10', 'Instalação elétrica aparente', [P('3.3')]], ['a11', 'Fios expostos', [P('3.3')]], ['a12', 'Tomadas soltas', [P('3.3')]], ['a13', 'Extensões improvisadas', [P('3.3')]],
      ['—', 'Ventilação e iluminação'], ['a14', 'Ventilação insuficiente', [P('3.4')]], ['a15', 'Iluminação insuficiente', [P('3.5')]],
      ['—', 'Ralos e animais sinantrópicos'], ['a16', 'Ralo sem dispositivo que impede a passagem de animais', [P('3.6'), SIN]], ['a17', 'Ralos insuficientes para o escoamento', [P('3.6')]],
      ['a18', 'Presença de animais sinantrópicos', [P('3.1'), P('10.1'), SIN], 'pragas'], ['a19', 'Sinais de animais sinantrópicos (fezes, roeduras, ninhos)', [P('3.1'), P('10.1'), SIN], 'pragas'],
      ['—', 'Lixeiras'], ['a20', 'Lixeira sem tampa de acionamento sem contato manual', [P('11.1'), P('11.2')], 'residuos'], ['a21', 'Lixeira sem saco plástico', [P('11.2.1')], 'residuos'], ['a22', 'Lixeira transbordando', [P('11.2.1')], 'residuos']
    ],
    tipos: {
      pratica: {rotulo: 'Sala de atividades', lista: PRATICA},
      lutas: {rotulo: 'Sala de lutas', lista: [['l01', 'Piso sem revestimento que amortece quedas', [P('5.2.1')], 'pratica'], ['l02', 'Piso sem revestimento higienizável', [P('5.2.1')], 'pratica'], ['l03', 'Paredes e obstáculos sem proteção até 1,0 m de altura', [P('5.2.1')], 'pratica']].concat(PRATICA)},
      quadra: {rotulo: 'Quadra', lista: [['q01', 'Piso da quadra com rachaduras', [P('5.7.1')], 'pratica'], ['q02', 'Piso da quadra com desníveis', [P('5.7.1')], 'pratica'], ['q03', 'Equipamentos da quadra enferrujados', [P('5.7.2')], 'pratica'], ['q04', 'Equipamentos da quadra com saliências cortantes', [P('5.7.2')], 'pratica']]},
      sanitario: {rotulo: 'Sanitário', lista: SANIT},
      vestiario: {rotulo: 'Vestiário', lista: [['v00', 'Chuveiro sem regulação de temperatura', [P('4.4')], 'sanit']].concat(SANIT.map(x => ['v' + x[0].slice(1), x[1], [P('4.4')], x[3]]))},
      residuos: {rotulo: 'Área de resíduos', lista: [['r01', 'Recicláveis sujos', [P('11.3')], 'residuos'], ['r02', 'Recicláveis desorganizados', [P('11.3')], 'residuos'], ['r03', 'Recicláveis em local desprotegido', [P('11.3')], 'residuos'], ['r04', 'Área de resíduos sem revestimento lavável', [P('11.4')], 'residuos'], ['r05', 'Área de resíduos desprotegida', [P('11.4')], 'residuos'], ['r06', 'Área de resíduos incompatível com o volume gerado', [P('11.4')], 'residuos']]}
    }}]
});
