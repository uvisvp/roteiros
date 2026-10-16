/* Roteiro — Academias, clubes e piscinas de uso coletivo (núcleo Serviços).
   Base: Portaria SMS nº 1.101/2015 (regulamento técnico: lutas, ginástica,
   musculação, natação, saunas e outras atividades em academias e clubes),
   Lei Municipal nº 11.383/1993 (responsável técnico e PAR-Q, redação da Lei
   15.681/2013), Lei 17.105/2019 (sistema hidráulico de piscinas — NBR 10339),
   Lei 13.993/2005 (profundidade nas bordas), Lei 16.059/2014 (salva-vidas ou
   guardião), Lei 13.945/2005 (desfibrilador) e Lei 13.725/2004 (Código
   Sanitário; capitulação: dispositivo descumprido c/c art. 116).
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
  relatorio: {
    titulo: 'RELATÓRIO DE INSPEÇÃO SANITÁRIA',
    subtitulo: 'Estabelecimento de atividades físicas e esportivas — academias, clubes e piscinas de uso coletivo (Portaria SMS nº 1.101/2015)',
    objetivo: 'Verificar as condições higiênico-sanitárias do estabelecimento que presta serviços de lutas esportivas, ginástica, musculação, natação, saunas e atividades afins, nos termos da Portaria SMS nº 1.101/2015 e da legislação municipal correlata.',
    conclusao: 'Diante do exposto, o estabelecimento foi avaliado conforme os itens acima. As irregularidades relacionadas configuram infração sanitária (Portaria SMS nº 1.101/2015, art. 3º; Lei Municipal nº 13.725/2004, art. 116) e devem ser corrigidas nos prazos fixados pela autoridade sanitária.'
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
            {id: 'p_piscina', rotulo: 'Possui piscina?', tipo: 'select', opcoes: SN, rel: false},
            {id: 'p_uso', rotulo: 'Uso da piscina', tipo: 'select', rel: false, opcoes: [['restrito', 'Coletivo restrito (alunos, sócios, hóspedes)'], ['publico', 'Público (população em geral)']]},
            {id: 'p_sauna', rotulo: 'Possui sauna, banheira ou ofurô?', tipo: 'select', opcoes: SN, rel: false},
            {id: 'p_lutas', rotulo: 'Oferece lutas esportivas?', tipo: 'select', opcoes: SN, rel: false},
            {id: 'p_avaliacao', rotulo: 'Faz avaliação física / antropométrica?', tipo: 'select', opcoes: SN, rel: false},
            {id: 'p_quadra', rotulo: 'Possui quadras esportivas?', tipo: 'select', opcoes: SN, rel: false},
            {id: 'p_alimentos', rotulo: 'Manipula alimentos no local (lanchonete, cozinha)?', tipo: 'select', opcoes: SN, rel: false},
            {id: 'p_trocador', rotulo: 'Possui trocador de fraldas?', tipo: 'select', opcoes: SN, rel: false},
            {id: 'p_federado', rotulo: 'Atende atletas federados (entidade federativa)?', tipo: 'select', opcoes: SN, rel: false},
            {id: 'p_dea', rotulo: 'Clube ou academia com mais de 1.000 sócios?', tipo: 'select', opcoes: SN, rel: false},
            {id: 'p_alternativa', rotulo: 'Usa água de solução alternativa (poço, caminhão-pipa)?', tipo: 'select', opcoes: SN, rel: false}
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
              nc: 'O estabelecimento funciona sem cadastro ou licença sanitária, ou exerce atividade não comunicada à autoridade sanitária.', inf: ['lic']},
            {id: 'rt', t: 'Há responsável técnico — profissional de educação física habilitado (CREF) ou técnico credenciado pela federação — supervisionando as atividades?', r: [L11(1), P('12.1')],
              c: 'As atividades são supervisionadas por responsável técnico legalmente habilitado.',
              nc: 'Não há responsável técnico legalmente habilitado supervisionando as atividades físicas e esportivas.', inf: ['rt']},
            {id: 'cnpj_doc', t: 'O CNPJ atualizado está disponível no estabelecimento?', r: [PI('14.2', 'i')],
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
              c: 'Os alunos fora da faixa de 15 a 69 anos apresentaram atestado médico com nome completo e CRM do médico.', nc: 'Há alunos fora da faixa de 15 a 69 anos sem atestado médico, ou atestado sem o nome completo e o CRM do médico.',
              na: 'Não há alunos fora da faixa de 15 a 69 anos.', inf: ['parq']},
            {id: 'federado', t: 'Para atletas federados, há exame médico prévio renovado a cada seis meses, anotado nos registros, com atestado anexado e autorização dos responsáveis para menores?', r: [L11(2, 'alinea', 'a'), L11(2, 'paragrafo', '1'), L11(2, 'paragrafo', '2'), L11(2, 'paragrafo', '3')],
              c: 'Os atletas federados têm exame médico prévio renovado semestralmente, anotado nos registros, com atestado anexado e autorização dos responsáveis para os menores.',
              nc: 'Há atletas federados sem exame médico prévio semestral, sem anotação nos registros ou, quando menores, sem autorização dos responsáveis.',
              na: 'O estabelecimento não atende atletas federados.', naSe: {campo: 'p_federado', igual: 'nao'}, inf: ['parq']},
            {id: 'placa', t: 'Há placa visível com os dizeres “Antes de iniciar a prática de atividades físicas ou esportivas, verifique se você não tem contraindicação.”?', r: [L11('2-c')],
              c: 'Há placa visível com o aviso para verificar contraindicação antes da prática de atividades físicas.', nc: 'Não há placa visível com o aviso para verificar contraindicação antes da prática de atividades físicas.', inf: ['placa']},
            {id: 'parq_docs', t: 'Os atestados, PAR-Q e termos estão organizados e disponíveis para a autoridade sanitária?', r: [P('14.1'), PI('14.2', 'iv')],
              c: 'Os atestados médicos, PAR-Q e termos de responsabilidade estão organizados e disponíveis.', nc: 'Os atestados médicos, PAR-Q ou termos de responsabilidade não estavam organizados e disponíveis para a autoridade sanitária.', inf: ['docs']}
          ],
          orient: [
            {t: 'Desde a Lei 15.681/2013, a regra geral do praticante amador é o PAR-Q anual (15 a 69 anos). O atestado médico passou a ser exigido para quem está fora dessa faixa e para atividades no âmbito de entidades federativas (exame semestral). Atestado de médico de confiança do aluno deve ser aceito.', f: 'Lei Municipal nº 11.383/1993, art. 2º e 2º-A, redação da Lei nº 15.681/2013'},
            {t: 'Amostragem: peça as fichas de alguns alunos de turmas diferentes (inclusive matrículas recentes) e confira data do PAR-Q, respostas, termo quando houver “sim” e a idade.', f: 'Prática de inspeção'}
          ]}
      ]
    },
    {
      id: 'instal', titulo: 'Instalações, sanitários e vestiários', curto: 'Instalações', icone: 'plan',
      itens: [
        {id: 'gerais', titulo: 'Condições gerais das instalações', curto: 'Condições gerais',
          perguntas: [
            {id: 'limpeza', t: 'Edificações e dependências estão limpas, organizadas, conservadas, sem materiais em desuso e sem animais sinantrópicos ou sinais deles?', r: [P('3.1'), P('3.2'), P('3.2.1')],
              c: 'As edificações e dependências estão limpas, organizadas, em boas condições de conservação e sem sinais de animais sinantrópicos.', nc: 'Foram constatadas dependências sujas, desorganizadas, mal conservadas, com materiais em desuso ou com sinais de animais sinantrópicos.', inf: ['instal']},
            {id: 'eletrica', t: 'As instalações elétricas são embutidas e estão em bom estado de conservação e segurança?', r: [P('3.3')],
              c: 'As instalações elétricas são embutidas e estão em bom estado.', nc: 'Foram constatadas instalações elétricas aparentes ou em mau estado de conservação e segurança.', inf: ['instal']},
            {id: 'ambiente', t: 'Os ambientes são arejados e a iluminação propicia conforto visual?', r: [P('3.4'), P('3.5')],
              c: 'Os ambientes são arejados e bem iluminados.', nc: 'Há ambientes sem ventilação adequada ou com iluminação insuficiente.', inf: ['instal']},
            {id: 'ralos', t: 'Ralos e grelhas são suficientes para o escoamento e têm dispositivo que impede a passagem de animais?', r: [P('3.6')],
              c: 'Os ralos e grelhas são suficientes e dotados de dispositivo contra a passagem de animais.', nc: 'Há ralos ou grelhas insuficientes ou sem dispositivo contra a passagem de animais sinantrópicos.', inf: ['instal']},
            {id: 'animais', t: 'A presença de animais domésticos, quando permitida, não oferece risco aos usuários nem compromete a higiene?', r: [P('3.7')],
              c: 'A presença de animais domésticos não oferece risco nem compromete a higiene.', nc: 'A presença de animais domésticos oferece risco aos usuários ou compromete as condições higiênico-sanitárias.',
              na: 'Não há animais domésticos no estabelecimento.', inf: ['instal']}
          ]},
        {id: 'sanit', titulo: 'Sanitários e vestiários', curto: 'Sanitários e vestiários',
          perguntas: [
            {id: 'separados', t: 'Sanitários e vestiários são separados por sexo, suficientes para a demanda e têm ao menos um chuveiro e um vaso protegidos por portas e divisórias?', r: [P('4.1'), P('4.2')],
              c: 'Os sanitários e vestiários são separados por sexo, suficientes para a demanda e têm chuveiro e vaso protegidos por portas e divisórias.', nc: 'Os sanitários e vestiários não são separados por sexo, são insuficientes ou não têm chuveiro e vaso protegidos por portas e divisórias.', inf: ['sanit']},
            {id: 'san_itens', t: 'Os sanitários têm vaso sifonado com assento e tampa, descarga funcionando, lixeira com tampa sem contato manual, pia com sabonete líquido e secagem higiênica, e lixeira para papel toalha?', r: [P('4.3')],
              c: 'Os sanitários dispõem de todos os itens exigidos.', nc: 'Faltam itens obrigatórios nos sanitários.',
              checks: {rotulo: 'Itens em falta (vai ao relatório)', opcoes: [['vaso', 'Vaso sifonado com assento e tampa'], ['descarga', 'Descarga funcionando'], ['lixeira', 'Lixeira com tampa sem contato manual'], ['pia', 'Pia com sabonete líquido e secagem higiênica'], ['papel', 'Lixeira para papel toalha']], outro: 'Outros — descrever', frase: 'Itens dos sanitários verificados: {}.'},
              inf: ['sanit']},
            {id: 'vest_itens', t: 'Os vestiários têm chuveiro com regulação de temperatura, vaso sifonado com assento e tampa, descarga, lixeira com tampa sem contato manual, pia com sabonete e secagem higiênica e lixeira para papel toalha?', r: [P('4.4')],
              c: 'Os vestiários dispõem de todos os itens exigidos.', nc: 'Faltam itens obrigatórios nos vestiários.', inf: ['sanit']},
            {id: 'trocador', t: 'O trocador de fraldas tem pia próxima com sabonete e secagem higiênica, lixeira com tampa sem contato manual, revestimento impermeável e produto identificado para higienização fora do alcance das crianças?', r: [P('4.5'), P('4.5.1'), P('4.5.2'), P('4.5.2.1')],
              c: 'O trocador de fraldas atende às exigências de higiene.', nc: 'O trocador de fraldas não atende às exigências de higiene (pia, lixeira, revestimento ou produto de higienização).',
              na: 'Não há trocador de fraldas.', naSe: {campo: 'p_trocador', igual: 'nao'}, inf: ['sanit']},
            {id: 'armarios', t: 'Há armários para guarda de roupas e objetos pessoais dos usuários e funcionários?', r: [P('4.6')],
              c: 'Há armários para guarda de roupas e objetos pessoais.', nc: 'Não há armários para guarda de roupas e objetos pessoais dos usuários e funcionários.', inf: ['sanit']}
          ]}
      ]
    },
    {
      id: 'pratica', titulo: 'Áreas de prática e avaliação física', curto: 'Áreas de prática', icone: 'shield',
      itens: [
        {id: 'areas', titulo: 'Salas, pisos e equipamentos', curto: 'Salas e equipamentos',
          perguntas: [
            {id: 'barreiras', t: 'Há barreiras físicas nos locais com risco de queda?', r: [P('5.1')],
              c: 'Há barreiras físicas nos locais com risco de queda.', nc: 'Não há barreiras físicas em locais com risco de queda.', na: 'Não há locais com risco de queda.', inf: ['pratica']},
            {id: 'pisos', t: 'Os pisos das salas são apropriados e seguros para as atividades desenvolvidas?', r: [P('5.2')],
              c: 'Os pisos das salas são apropriados e seguros para as atividades.', nc: 'Há pisos inadequados ou inseguros para as atividades desenvolvidas.', inf: ['pratica']},
            {id: 'lutas', t: 'Nos espaços de lutas, o piso tem revestimento higienizável que amortece quedas e paredes e obstáculos de risco estão protegidos até 1,0 m de altura?', r: [P('5.2.1')],
              c: 'Os espaços de lutas têm piso higienizável que amortece quedas e paredes protegidas até 1,0 m.', nc: 'Os espaços de lutas não têm piso que amortece quedas ou paredes e obstáculos protegidos até 1,0 m de altura.',
              na: 'O estabelecimento não oferece lutas esportivas.', naSe: {campo: 'p_lutas', igual: 'nao'}, inf: ['pratica']},
            {id: 'equip', t: 'Os equipamentos de musculação e demais atividades estão limpos, seguros, conservados (sem ferrugem, rachaduras, umidade) e instalados de forma estável, com circulação segura?', r: [P('5.3'), P('5.3.1')],
              c: 'Os equipamentos estão limpos, conservados, seguros e bem instalados.', nc: 'Foram constatados equipamentos sujos, enferrujados, danificados ou instalados sem estabilidade, com risco aos usuários.', inf: ['pratica']},
            {id: 'anilhas', t: 'Anilhas, barras e materiais de apoio estão conservados e guardados em suportes apropriados, sem atrapalhar a circulação?', r: [P('5.4')],
              c: 'Anilhas, barras e materiais de apoio estão conservados e guardados em suportes apropriados.', nc: 'Há anilhas, barras ou materiais de apoio danificados ou fora dos suportes, com risco de acidentes.', inf: ['pratica']},
            {id: 'espelhos', t: 'Os espelhos estão íntegros e bem fixados?', r: [P('5.5')],
              c: 'Os espelhos estão íntegros e bem fixados.', nc: 'Há espelhos quebrados, trincados ou mal fixados.', na: 'Não há espelhos nas salas.', inf: ['pratica']},
            {id: 'colchonetes', t: 'Colchonetes e assentos estão conservados e são higienizados após cada uso com produto indicado, identificado e à disposição dos usuários, com separação entre higienizados e não higienizados?', r: [P('5.6'), P('5.6.1'), P('5.6.2'), P('5.6.2.1'), P('5.6.3')],
              c: 'Os colchonetes e assentos estão conservados e são higienizados após cada uso, com produto identificado à disposição e separação entre higienizados e não higienizados.',
              nc: 'Os colchonetes ou assentos não são higienizados após cada uso, não há produto identificado à disposição ou não há separação entre higienizados e não higienizados.', inf: ['higiene']},
            {id: 'quadras', t: 'As quadras estão conservadas, com piso sem rachaduras ou desníveis e equipamentos sem ferrugem ou saliências cortantes?', r: [P('5.7'), P('5.7.1'), P('5.7.2')],
              c: 'As quadras estão conservadas, com piso regular e equipamentos seguros.', nc: 'As quadras têm piso com rachaduras ou desníveis, ou equipamentos com ferrugem ou saliências cortantes.',
              na: 'O estabelecimento não possui quadras.', naSe: {campo: 'p_quadra', igual: 'nao'}, inf: ['pratica']}
          ],
          orient: [
            {t: 'Higienização de colchonetes: o produto (desinfetante ou álcool 70%) deve ser regularizado na Anvisa e usado conforme o rótulo (diluição e tempo de contato). Pergunte qual produto é usado e confira o rótulo.', f: 'Portaria SMS nº 1.101/2015, itens 5.6.2 e 8.2'}
          ]},
        {id: 'avaliacao', titulo: 'Avaliação física', curto: 'Avaliação física',
          perguntas: [
            {id: 'aval_hig', t: 'Colchonetes e equipamentos da avaliação física são higienizados após cada uso e há produto alcoólico para as mãos na sala?', r: [P('5.8'), P('5.8.1')],
              c: 'Os colchonetes e equipamentos da avaliação física são higienizados após cada uso e há produto alcoólico para as mãos na sala.',
              nc: 'Os colchonetes e equipamentos da avaliação física não são higienizados após cada uso ou não há produto alcoólico para as mãos na sala.',
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
            {t: 'Confira se o aparelho está carregado (luz/indicador de prontidão), com eletrodos dentro da validade e em local sinalizado e acessível.', f: 'Prática de inspeção'}
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
              c: 'A água está límpida, com visibilidade da parte mais funda, superfície sem matéria flutuante e fundo sem detritos.', nc: 'A água não permite ver a parte mais funda do tanque, ou há matéria flutuante na superfície ou detritos no fundo.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['agua']},
            {id: 'recirc', t: 'O tanque tem sistema de recirculação completo (entradas, grelhas de fundo, retentor de pelos, bombas, dosadores, filtros, cloração e entrada de água nova) e a água é tratada e recirculada no mínimo a cada 8 h (uso restrito) ou 6 h (uso público)?', r: [P('6.12'), P('6.13'), P('6.14')],
              c: 'O tanque tem sistema completo de recirculação e tratamento, com renovação da água no intervalo exigido.', nc: 'O sistema de recirculação e tratamento da água está incompleto ou não renova a água no intervalo exigido.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['agua']},
            {id: 'outros_metodos', t: 'Outros métodos de desinfecção associados ao cloro (ozônio, UV, sal, ionização) são operados conforme o fabricante?', r: [P('6.2.5')],
              c: 'Os métodos de desinfecção associados ao cloro são operados conforme o fabricante.', nc: 'Os métodos de desinfecção associados ao cloro não são operados conforme o fabricante.',
              na: 'A desinfecção é feita somente com cloro.', inf: ['agua']},
            {id: 'tanque_vazio', t: 'O tanque fora de uso, quando vazio, está limpo, sem acúmulo de líquidos ou resíduos?', r: [P('6.2.1'), P('6.2')],
              c: 'O tanque fora de uso está limpo, sem acúmulo de líquidos ou resíduos.', nc: 'O tanque fora de uso tem acúmulo de água ou resíduos, com risco de criadouro de vetores.', na: 'O tanque estava em uso.', inf: ['agua']},
            {id: 'analises', t: 'Com cloro ou pH fora da faixa, ou sem monitoramento, foram apresentadas análises microbiológicas e pesquisa de algas, leveduras e amebas de vida livre, de laboratório regularizado?', r: [P('6.6'), P('6.6.1')],
              c: 'Foram apresentadas as análises microbiológicas solicitadas, de laboratório regularizado.', nc: 'Não foram apresentadas as análises microbiológicas e a pesquisa de algas, leveduras e amebas de vida livre solicitadas.',
              na: 'O cloro e o pH estavam dentro da faixa e havia monitoramento; não foi necessário solicitar análises.', inf: ['agua']}
          ],
          orient: [
            {t: 'Em São Paulo o parâmetro exigível é o da Portaria SMS 1.101/2015: pH 6,7 a 7,9 e cloro residual livre 0,5 a 0,8 mg/L. A NBR 10818 traz faixas próprias de qualidade; use-as como referência técnica, não como base da autuação.', f: 'Portaria SMS nº 1.101/2015, itens 6.2.2 e 6.2.4; ' + ABNT1},
            {t: 'O pH governa a eficácia do cloro: quanto mais alto o pH, menor a fração de ácido hipocloroso (a forma que desinfeta). Cloro dentro da faixa com pH alto desinfeta mal.', f: ABNT1},
            {t: 'Cheiro forte de “cloro” e ardor nos olhos costumam indicar cloro combinado (cloraminas, formado com suor e urina), não excesso de cloro livre. A correção é oxidação (supercloração) e renovação de água, não reduzir o cloro.', f: ABNT1},
            {t: 'Alcalinidade total funciona como tampão do pH; alcalinidade baixa faz o pH oscilar. Ácido cianúrico (estabilizador) protege o cloro do sol, mas em excesso reduz sua eficácia.', f: ABNT1},
            {t: 'Como medir: kit DPD para cloro livre e vermelho de fenol para pH; coletar a cerca de 30 cm da superfície, longe dos retornos de água tratada, em mais de um ponto; ler logo após o reagente. Compare com o registro do dia.', f: 'Prática de inspeção — conferir o manual do kit'}
          ]},
        {id: 'seguranca', titulo: 'Segurança dos banhistas', curto: 'Segurança',
          perguntas: [
            {id: 'guardiao', t: 'Há profissional responsável pela segurança dos banhistas (salva-vidas ou guardião), habilitado e uniformizado, durante todo o funcionamento da piscina?', r: [P('12.3'), L160(1), L160(3), L160(3, 'paragrafo', 'unico')],
              c: 'Há salva-vidas ou guardião de piscina habilitado e uniformizado durante todo o funcionamento.', nc: 'Não há salva-vidas ou guardião de piscina habilitado e uniformizado durante todo o funcionamento da piscina.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['seguranca']},
            {id: 'placas_risco', t: 'Há placas informativas sobre o risco de acidentes na área da piscina?', r: [L160(2)],
              c: 'Há placas informativas sobre o risco de acidentes na área da piscina.', nc: 'Não há placas informativas sobre o risco de acidentes na área da piscina.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['seguranca']},
            {id: 'isolamento', t: 'A piscina é isolada por grade ou estrutura equivalente quando o responsável pela segurança está ausente?', r: [P('6.8')],
              c: 'A piscina é isolada quando o responsável pela segurança está ausente.', nc: 'A piscina não é isolada quando o responsável pela segurança dos banhistas está ausente.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['seguranca']},
            {id: 'profundidade', t: 'A profundidade está indicada nas bordas externas, nos pontos de menor, mediana e maior profundidade, com material antiderrapante, impermeável e de fácil visualização?', r: [P('6.9'), P('6.9.1'), L139(1), L139(2), L139(3)],
              c: 'A profundidade está indicada nas bordas nos pontos de menor, mediana e maior profundidade, de forma visível.', nc: 'A indicação de profundidade nas bordas está ausente, incompleta ou ilegível.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['seguranca']},
            {id: 'perimetro', t: 'O perímetro do tanque é pavimentado com material antiderrapante e a borda é elevada com caimento para fora?', r: [P('6.7')],
              c: 'O perímetro do tanque é antiderrapante e a borda é elevada com caimento para fora.', nc: 'O perímetro do tanque não é antiderrapante ou a borda não tem caimento para fora.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['seguranca']},
            {id: 'revest', t: 'O revestimento interno do tanque é resistente, liso, impermeável, sem falhas ou saliências, e as escadas têm corrimão e degraus antiderrapantes?', r: [P('6.10'), P('6.11')],
              c: 'O revestimento do tanque está íntegro e as escadas têm corrimão e degraus antiderrapantes.', nc: 'O revestimento do tanque tem falhas ou saliências, ou as escadas não têm corrimão ou piso antiderrapante.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['seguranca']},
            {id: 'hidraulico', t: 'O sistema hidráulico (ralos de fundo, grelhas, sucção) atende à ABNT NBR 10339, com proteção contra aprisionamento?', r: [L17(3), L17(5), P('6.13')],
              c: 'O sistema hidráulico da piscina atende à ABNT NBR 10339, com proteção contra aprisionamento.', nc: 'O sistema hidráulico da piscina não atende à ABNT NBR 10339 (ralos, grelhas ou sucção sem proteção contra aprisionamento).', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['hidraulico']},
            {id: 'restricao', t: 'O estabelecimento impede a entrada na piscina de pessoas com ferimentos abertos, curativos ou doenças transmissíveis pela água?', r: [P('6.18')],
              c: 'O estabelecimento impede a entrada na piscina de pessoas com ferimentos, curativos ou doenças transmissíveis.', nc: 'O estabelecimento não impede a entrada na piscina de pessoas com ferimentos, curativos ou doenças transmissíveis.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['seguranca']}
          ],
          orient: [
            {t: 'Aprisionamento por sucção (cabelo, membro, corpo) no ralo de fundo é o acidente que a Lei 17.105/2019 quer evitar. A NBR 10339 trata de ralos de fundo duplos ou de dispositivo de alívio de vácuo, grelhas com tampa fixada por parafuso e área aberta suficiente, velocidade de sucção limitada e botão de parada de emergência da bomba visível perto do tanque.', f: ABNT2},
            {t: 'O que pedir: projeto ou laudo do sistema hidráulico, ou ART do responsável, que declare conformidade com a NBR 10339; ver a grelha (fixa, sem quebra, sem parafuso faltando) e onde fica o botão de desligamento da bomba.', f: 'Lei Municipal nº 17.105/2019, art. 3º; ' + ABNT2},
            {t: 'A Lei 13.993/2005 tem multa própria (art. 5º); a Portaria repete a exigência da profundidade no item 6.9, o que permite capitular como infração sanitária.', f: 'Lei Municipal nº 13.993/2005; Portaria SMS nº 1.101/2015, item 6.9'}
          ]},
        {id: 'lavapes', titulo: 'Lava-pés', curto: 'Lava-pés',
          perguntas: [
            {id: 'lp_uso', t: 'O acesso ao tanque só é possível passando pelo lava-pés, com dimensão e profundidade que garantem a submersão dos pés?', r: [P('6.15'), P('6.16')],
              c: 'O acesso ao tanque passa obrigatoriamente pelo lava-pés, que submerge os pés.', nc: 'O lava-pés pode ser contornado ou não garante a submersão completa dos pés.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['lavapes']},
            {id: 'lp_cloro', t: 'A água do lava-pés está límpida e com cloro residual acima de 25 mg/L?', r: [P('6.15')],
              c: 'A água do lava-pés está límpida e com cloro residual acima de 25 mg/L.', nc: 'A água do lava-pés está turva ou com cloro residual abaixo de 25 mg/L.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['lavapes']},
            {id: 'lp_limpeza', t: 'O lava-pés é esvaziado, lavado e enxaguado diariamente (com troca mais frequente nos dias de maior uso) e mantido limpo e seco quando a piscina está fora de uso?', r: [P('6.17'), P('6.17.1')],
              c: 'O lava-pés é esvaziado e lavado diariamente e mantido seco quando a piscina está fora de uso.', nc: 'O lava-pés não é esvaziado e lavado diariamente, ou não é mantido seco quando a piscina está fora de uso.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['lavapes']}
          ],
          orient: [
            {t: 'Cloro acima de 25 mg/L está fora da faixa do kit DPD comum de piscina: use fita ou kit de faixa alta, ou dilua a amostra e multiplique o resultado.', f: 'Prática de inspeção — conferir o manual do kit'}
          ]},
        {id: 'maquinas', titulo: 'Casa de máquinas e operador', curto: 'Casa de máquinas',
          perguntas: [
            {id: 'cm_espaco', t: 'A casa de máquinas tem espaço para inspeção, operação e manutenção, é ventilada e iluminada, e não guarda produtos químicos nem materiais estranhos?', r: [P('6.19'), P('6.19.1')],
              c: 'A casa de máquinas tem espaço, ventilação e iluminação adequados e não guarda produtos químicos nem materiais estranhos.', nc: 'A casa de máquinas não tem espaço, ventilação ou iluminação adequados, ou guarda produtos químicos ou materiais estranhos à atividade.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['maquinas']},
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
              nc: 'As medições de pH e cloro do tanque e do lava-pés não são feitas a cada período ou não são registradas com data, hora e assinatura, disponíveis aos usuários e arquivadas por 6 meses.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['registros']},
            {id: 'reg_acidente', t: 'Acidentes com fezes, vômito ou animal morto no tanque são registrados (data e hora, abertura, banhistas, tanque, contaminante, cloro e pH no fechamento, tratamento e abertura, tempo de desinfecção)?', r: [P('6.5'), P('6.5.1'), P('6.5.2'), P('6.5.3'), P('6.5.4')],
              c: 'Os acidentes fecais, com vômito ou animal morto são registrados com as informações exigidas.', nc: 'Os acidentes fecais, com vômito ou animal morto não são registrados ou o registro não tem as informações exigidas.',
              na: 'Não houve acidente com contaminação do tanque.', naSe: {campo: 'p_piscina', igual: 'nao'}, inf: ['registros']},
            {id: 'pop_piscina', t: 'Há POP de tratamento e controle da água da piscina com todo o conteúdo exigido e POP de higienização em acidentes (vômito, fezes, animal morto)?', r: [P('14.4'), PI('14.4', 'i'), PI('14.4', 'ii')],
              c: 'Há POP de tratamento da água da piscina e de higienização em acidentes.', nc: 'Não há POP de tratamento da água da piscina ou de higienização em acidentes, ou o POP não tem o conteúdo exigido.', na: SEM_PISC, naSe: {campo: 'p_piscina', igual: 'nao'},
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
              c: 'As banheiras estão limpas, íntegras e são higienizadas a cada uso.', nc: 'As banheiras não estão limpas ou íntegras, ou não são higienizadas a cada uso.', na: 'Não há banheiras.', naSe: {campo: 'p_sauna', igual: 'nao'}, inf: ['sauna']},
            {id: 'sauna_estr', t: 'A sauna está limpa e conservada, com piso antiderrapante, porta sem fechadura, maçanetas que abrem dos dois lados e não conduzem calor, termômetro visível, lâmpadas protegidas e fonte de calor protegida e afastada?', r: [P('7.2'), P('7.3'), P('7.4'), P('7.5'), P('7.6'), P('7.7'), P('7.8')],
              c: 'A sauna atende aos requisitos de higiene e segurança.', nc: 'A sauna não atende aos requisitos de higiene e segurança.',
              checks: {rotulo: 'Itens em falta (vai ao relatório)', opcoes: [['limpeza', 'Limpeza e conservação'], ['piso', 'Piso antiderrapante'], ['fechadura', 'Porta sem fechadura'], ['macaneta', 'Maçanetas adequadas'], ['termometro', 'Termômetro visível'], ['lampada', 'Lâmpadas protegidas'], ['calor', 'Fonte de calor protegida e afastada']], outro: 'Outros — descrever', frase: 'Itens da sauna verificados: {}.'},
              na: 'Não há sauna.', naSe: {campo: 'p_sauna', igual: 'nao'}, inf: ['sauna']},
            {id: 'sauna_chuveiro', t: 'Há chuveiros próximos à sauna, a sauna úmida usa água potável e os aromatizantes são regularizados?', r: [P('7.9'), P('7.10'), P('7.11')],
              c: 'Há chuveiros próximos à sauna, a água é potável e os aromatizantes são regularizados.', nc: 'Não há chuveiros próximos à sauna, a sauna úmida não usa água potável ou os aromatizantes não são regularizados.', na: 'Não há sauna.', naSe: {campo: 'p_sauna', igual: 'nao'}, inf: ['sauna']},
            {id: 'sauna_pop', t: 'Há POP de higienização das banheiras e saunas?', r: [P('7.12')],
              c: 'Há POP de higienização das banheiras e saunas.', nc: 'Não há POP de higienização das banheiras e saunas.', na: 'Não há sauna nem banheiras.', naSe: {campo: 'p_sauna', igual: 'nao'}, inf: ['pop']}
          ]}
      ]
    },
    {
      id: 'apoio', titulo: 'Produtos, água, pragas e resíduos', curto: 'Produtos e água', icone: 'box',
      itens: [
        {id: 'produtos', titulo: 'Produtos e alimentos', curto: 'Produtos',
          perguntas: [
            {id: 'prod_reg', t: 'Os produtos de interesse da saúde (saneantes, cosméticos, alimentos, suplementos) usados ou vendidos são regularizados, dentro da validade e usados conforme o fabricante?', r: [P('8.2'), P('8.3'), P('8.4')],
              c: 'Os produtos de interesse da saúde são regularizados, estão dentro da validade e são usados conforme o fabricante.', nc: 'Foram constatados produtos de interesse da saúde sem regularização, vencidos ou usados fora das recomendações do fabricante.', inf: ['produtos']},
            {id: 'alimentos', t: 'Havendo manipulação de alimentos, há dependência exclusiva e as Boas Práticas estão implantadas?', r: [P('8.1'), P('8.1.1')],
              c: 'A manipulação de alimentos ocorre em dependência exclusiva, com Boas Práticas implantadas.', nc: 'A manipulação de alimentos ocorre sem dependência exclusiva ou sem Boas Práticas implantadas.',
              na: 'Não há manipulação de alimentos no local.', naSe: {campo: 'p_alimentos', igual: 'nao'}, inf: ['produtos']}
          ],
          orient: [
            {t: 'Suplementos vendidos na academia: confira a regularização (RDC 243/2018 — suplementos alimentares) e a rotulagem; produtos com alegação de “emagrecer” ou “anabolizante natural” merecem consulta na Central de Consultas.', f: 'Portaria SMS nº 1.101/2015, item 8.2'}
          ]},
        {id: 'agua', titulo: 'Água para consumo e reservatório', curto: 'Água e reservatório',
          perguntas: [
            {id: 'reservatorio', t: 'O reservatório de água potável é acessível, protegido, vedado, de material adequado e está limpo e conservado?', r: [P('9.1'), P('9.2')],
              c: 'O reservatório de água potável está protegido, vedado, limpo e conservado.', nc: 'O reservatório de água não está protegido, vedado, limpo ou conservado.', inf: ['agua_consumo']},
            {id: 'res_limpeza', t: 'Há comprovante ou registro da limpeza e desinfecção do reservatório (na instalação, em intercorrências e na periodicidade da legislação)?', r: [P('9.3'), P('9.4'), P('9.5'), PI('14.2', 'v')],
              c: 'Há comprovante da limpeza e desinfecção periódica do reservatório.', nc: 'Não há comprovante da limpeza e desinfecção periódica do reservatório de água.', inf: ['agua_consumo']},
            {id: 'alternativa', t: 'A água de solução alternativa (poço, caminhão-pipa) tem controle de potabilidade com laudos arquivados por 6 meses?', r: [P('9.6'), PI('14.2.1', 'i'), PI('14.2.1', 'ii')],
              c: 'A água de solução alternativa tem controle de potabilidade com laudos arquivados.', nc: 'A água de solução alternativa não tem controle de potabilidade comprovado por laudos.',
              na: 'O abastecimento é pela rede pública.', naSe: {campo: 'p_alternativa', igual: 'nao'}, inf: ['agua_consumo']},
            {id: 'bebedouros', t: 'Bebedouros e filtros estão limpos e conservados, com manutenção registrada conforme o fabricante?', r: [P('9.7'), P('9.7.1')],
              c: 'Os bebedouros e filtros estão limpos e conservados, com manutenção registrada.', nc: 'Os bebedouros ou filtros não estão limpos ou conservados, ou não há registro da manutenção.', na: 'Não há bebedouros nem filtros.', inf: ['agua_consumo']}
          ],
          orient: [
            {t: 'A limpeza da caixa d’água segue os métodos da Sabesp ou da Secretaria da Saúde; a Portaria cita os Comunicados CVS 006/2011 e CVS/SAMA 11/2015 (periodicidade semestral). Peça o comprovante da empresa ou o registro próprio.', f: 'Portaria SMS nº 1.101/2015, itens 9.3 a 9.5 e bibliografia'}
          ]},
        {id: 'pragas_res', titulo: 'Pragas e resíduos', curto: 'Pragas e resíduos',
          perguntas: [
            {id: 'pragas', t: 'Há controle integrado de pragas e, quando houve aplicação de desinfestantes, ela foi feita por empresa regularizada (com comprovante)?', r: [P('10.1'), P('10.2')],
              c: 'Há controle integrado de pragas, com aplicação de desinfestantes por empresa regularizada.', nc: 'Não há controle integrado de pragas ou a aplicação de desinfestantes não foi feita por empresa regularizada.', inf: ['pragas']},
            {id: 'lixeiras', t: 'As lixeiras de resíduos orgânicos têm tampa sem contato manual, são de fácil limpeza, com capacidade suficiente e revestidas com saco plástico retirado com regularidade?', r: [P('11.1'), P('11.2'), P('11.2.1')],
              c: 'As lixeiras têm tampa sem contato manual, capacidade suficiente e saco plástico retirado com regularidade.', nc: 'Há lixeiras sem tampa de acionamento sem contato manual, sem saco plástico ou transbordando.', inf: ['residuos']},
            {id: 'reciclaveis', t: 'Os recicláveis estão limpos e organizados em local protegido, e a área externa de resíduos é lavável, protegida e compatível com a geração?', r: [P('11.3'), P('11.4')],
              c: 'Os recicláveis e a área externa de resíduos estão organizados e protegidos.', nc: 'Os recicláveis ou a área externa de resíduos estão desorganizados, desprotegidos ou sem revestimento lavável.', inf: ['residuos']}
          ]}
      ]
    },
    {
      id: 'pessoal', titulo: 'Pessoal e documentação', curto: 'Pessoal e documentos', icone: 'folder',
      itens: [
        {id: 'equipe', titulo: 'Pessoal e EPIs', curto: 'Pessoal',
          perguntas: [
            {id: 'epi', t: 'Os EPIs necessários estão disponíveis em número suficiente, são usados conforme a função e não ficam guardados junto com produtos químicos?', r: [P('12.4'), P('12.5')],
              c: 'Os EPIs estão disponíveis em número suficiente, são usados corretamente e guardados separados dos produtos químicos.', nc: 'Os EPIs são insuficientes, não são usados corretamente ou ficam guardados junto com produtos químicos.', inf: ['epi']},
            {id: 'atualizacao', t: 'Os funcionários passam, no mínimo anualmente, por atualização profissional, com comprovante?', r: [P('12.7'), PI('14.2', 'vi')],
              c: 'Os funcionários passam por atualização profissional anual, com comprovante.', nc: 'Não há comprovante de atualização profissional anual dos funcionários.', inf: ['docs']}
          ]},
        {id: 'pops', titulo: 'POPs e documentos', curto: 'POPs',
          perguntas: [
            {id: 'pops_gerais', t: 'Há POPs de higienização das instalações, equipamentos, móveis e utensílios e de limpeza e desinfecção do reservatório, atualizados e de fácil acesso aos funcionários?', r: [P('14.3'), PI('14.3', 'i'), PI('14.3', 'ii'), P('14.5'), P('14.6')],
              c: 'Há POPs de higienização das instalações e de limpeza do reservatório, atualizados e acessíveis aos funcionários.', nc: 'Faltam POPs de higienização das instalações ou de limpeza do reservatório, ou eles não estão atualizados e acessíveis.',
              checks: {rotulo: 'POPs apresentados (vai ao relatório)', opcoes: [['higienizacao', 'Higienização das instalações, equipamentos, móveis e utensílios'], ['reservatorio', 'Limpeza e desinfecção do reservatório de água']], semOutro: true, frase: 'Foram apresentados os POPs de: {}.'},
              inf: ['pop']},
            {id: 'pops_ciencia', t: 'Há documento que comprove que os funcionários foram informados do conteúdo dos POPs?', r: [PI('14.2', 'iii'), P('14.6')],
              c: 'Há documento de ciência dos POPs pelos funcionários.', nc: 'Não há documento que comprove a ciência dos POPs pelos funcionários.', inf: ['pop']},
            {id: 'docs_disp', t: 'Os documentos exigidos estão no estabelecimento, organizados, atualizados e disponíveis para a autoridade sanitária?', r: [P('14.1'), P('14.2')],
              c: 'Os documentos exigidos estão organizados, atualizados e disponíveis.', nc: 'Os documentos exigidos não estavam organizados, atualizados ou disponíveis para a autoridade sanitária.', inf: ['docs']}
          ]}
      ]
    }
  ],
  infracoes: [
    {id: 'lic', grupo: 'Licenciamento e responsabilidade', texto: 'Exercer atividade de interesse da saúde sem cadastro ou licença sanitária, ou sem comunicar à autoridade sanitária a inclusão de atividades.', r: [LM(90), LM(90, 'paragrafo', '1'), LM(116)]},
    {id: 'rt', grupo: 'Licenciamento e responsabilidade', texto: 'Funcionar sem supervisão e responsabilidade técnica de profissional de educação física devidamente habilitado ou de técnico credenciado pela federação.', r: [L11(1), L11('2-b'), P('12.1'), LM(116)]},
    {id: 'parq', grupo: 'Controle de saúde', texto: 'Deixar de exigir dos alunos o PAR-Q, o Termo de Responsabilidade ou o atestado médico, conforme a idade e a modalidade.', r: [L11(2), L11('2-a'), L11('2-b'), P('13.1'), LM(116)]},
    {id: 'placa', grupo: 'Controle de saúde', texto: 'Deixar de afixar, em local visível, a placa de aviso sobre contraindicação para a prática de atividades físicas.', r: [L11('2-c'), L11('2-b'), LM(116)]},
    {id: 'instal', grupo: 'Instalações', texto: 'Manter instalações sujas, desorganizadas, mal conservadas, sem ventilação ou iluminação adequadas, ou com sinais de animais sinantrópicos.', r: [P('3.1'), P('3.3'), P('3.4'), P('3.5'), P('3.6'), LM(116)]},
    {id: 'sanit', grupo: 'Instalações', texto: 'Manter sanitários, vestiários ou trocador de fraldas sem os itens obrigatórios de higiene e separação.', r: [P('4.1'), P('4.2'), P('4.3'), P('4.4'), P('4.5'), P('4.6'), LM(116)]},
    {id: 'pratica', grupo: 'Áreas de prática', texto: 'Manter áreas de prática, pisos, quadras ou equipamentos em condições que comprometam a segurança dos usuários.', r: [P('5.1'), P('5.2'), P('5.2.1'), P('5.3'), P('5.4'), P('5.5'), P('5.7'), LM(116)]},
    {id: 'higiene', grupo: 'Áreas de prática', texto: 'Deixar de higienizar colchonetes, assentos e equipamentos de contato corporal após cada uso, ou de disponibilizar produto para essa higienização.', r: [P('5.6'), P('5.6.1'), P('5.6.2'), P('5.6.3'), P('5.8'), P('5.8.1'), LM(116)]},
    {id: 'dea', grupo: 'Áreas de prática', texto: 'Deixar de manter desfibrilador externo automático, ou pessoal capacitado para seu uso, em clube ou academia com mais de 1.000 sócios.', r: [L1394(1), L1394(1, 'paragrafo', '2'), L1394(3)]},
    {id: 'agua', grupo: 'Piscina', texto: 'Manter a água da piscina fora dos padrões de pH, cloro residual livre ou limpidez, ou sem o sistema de recirculação e tratamento exigido.', r: [P('6.2'), P('6.2.2'), P('6.2.4'), P('6.3'), P('6.4'), P('6.12'), P('6.13'), P('6.14'), LM(116)]},
    {id: 'seguranca', grupo: 'Piscina', texto: 'Manter piscina sem as condições de segurança dos banhistas (salva-vidas ou guardião, isolamento, indicação de profundidade, piso, borda, revestimento ou escadas).', r: [P('6.7'), P('6.8'), P('6.9'), P('6.10'), P('6.11'), P('6.18'), P('12.3'), L160(1), L139(1), LM(116)]},
    {id: 'hidraulico', grupo: 'Piscina', texto: 'Manter piscina com sistema hidráulico em desacordo com a ABNT NBR 10339, sem proteção contra aprisionamento.', r: [L17(3), L17(5), LM(116)]},
    {id: 'lavapes', grupo: 'Piscina', texto: 'Permitir o acesso ao tanque sem passagem por lava-pés abastecido, com cloro acima de 25 mg/L e higienizado diariamente.', r: [P('6.15'), P('6.16'), P('6.17'), LM(116)]},
    {id: 'maquinas', grupo: 'Piscina', texto: 'Manter casa de máquinas sem condições de operação ou com guarda de produtos químicos e materiais estranhos à atividade.', r: [P('6.19'), P('6.19.1'), LM(116)]},
    {id: 'operador', grupo: 'Piscina', texto: 'Manter a qualidade da água da piscina sob responsabilidade de profissional sem certificado de curso de operador de piscinas.', r: [P('12.2'), LM(116)]},
    {id: 'registros', grupo: 'Piscina', texto: 'Deixar de medir e registrar pH e cloro do tanque e do lava-pés, ou de registrar acidentes com contaminação do tanque.', r: [P('6.5.4'), P('6.20'), P('6.20.1'), P('6.20.2'), LM(116)]},
    {id: 'sauna', grupo: 'Saunas e banheiras', texto: 'Manter sauna ou banheira sem as condições de higiene e segurança exigidas.', r: [P('7.1'), P('7.2'), P('7.3'), P('7.4'), P('7.5'), P('7.6'), P('7.7'), P('7.8'), P('7.9'), P('7.10'), P('7.11'), LM(116)]},
    {id: 'produtos', grupo: 'Produtos e água', texto: 'Utilizar, armazenar ou comercializar produtos de interesse da saúde sem regularização, vencidos ou fora das recomendações do fabricante, ou manipular alimentos sem dependência exclusiva e Boas Práticas.', r: [P('8.1'), P('8.2'), P('8.3'), P('8.4'), LM(116)]},
    {id: 'agua_consumo', grupo: 'Produtos e água', texto: 'Manter reservatório, bebedouros ou filtros sem as condições de proteção, limpeza e desinfecção exigidas, ou água de solução alternativa sem controle de potabilidade.', r: [P('9.1'), P('9.2'), P('9.3'), P('9.4'), P('9.6'), P('9.7'), LM(116)]},
    {id: 'pragas', grupo: 'Produtos e água', texto: 'Deixar de adotar o controle integrado de pragas ou permitir a aplicação de desinfestantes por empresa não regularizada.', r: [P('10.1'), P('10.2'), LM(116)]},
    {id: 'residuos', grupo: 'Produtos e água', texto: 'Acondicionar ou armazenar resíduos sólidos sem as condições exigidas.', r: [P('11.1'), P('11.2'), P('11.3'), P('11.4'), LM(116)]},
    {id: 'epi', grupo: 'Pessoal e documentação', texto: 'Deixar de fornecer EPIs em número suficiente, permitir seu uso incorreto ou guardá-los junto com produtos químicos.', r: [P('12.4'), P('12.5'), P('12.6'), LM(116)]},
    {id: 'pop', grupo: 'Pessoal e documentação', texto: 'Deixar de elaborar, manter atualizados e dar ciência aos funcionários dos Procedimentos Operacionais Padronizados exigidos.', r: [P('7.12'), P('14.3'), P('14.4'), P('14.6'), LM(116)]},
    {id: 'docs', grupo: 'Pessoal e documentação', texto: 'Deixar de manter no estabelecimento, organizados e disponíveis à autoridade sanitária, os documentos exigidos.', r: [P('14.1'), P('14.2'), LM(116)]}
  ]
};
