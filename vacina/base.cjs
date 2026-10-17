/* Roteiro — Serviço de vacinação humana em farmácia e drogaria.
   Base: RDC Anvisa nº 197/2017 (requisitos mínimos dos serviços de vacinação).
   Base sancionatória: Lei Municipal nº 13.725/2004. Mesmo formato de eac.cjs. */
'use strict';
const A = (art, ...resto) => ['rdc-197-2017::artigo::' + art].concat(resto.length ? [resto.join('::')] : []).join('::');
const I = (art, inc) => A(art, 'inciso', inc);
const P = (art, par) => A(art, 'paragrafo', par);
const AL = l => A(10, 'inciso', 'iii', 'alinea', l);
const LM = art => 'lei-municipal-13725-2004::artigo::' + art;

module.exports = {
  app: 'vacina',
  titulo: 'Vacinação',
  tituloCurto: 'Vacinacao',
  store: 'med-vacina-v1',
  relatorio: {
    titulo: 'RELATÓRIO DE INSPEÇÃO SANITÁRIA',
    subtitulo: 'Serviço de vacinação humana em farmácia (RDC Anvisa nº 197/2017)',
    objetivo: 'Verificar as condições de funcionamento do serviço de vacinação humana prestado pelo estabelecimento, nos termos da RDC Anvisa nº 197/2017.',
    conclusao: 'Diante do exposto, o serviço de vacinação do estabelecimento foi avaliado conforme os itens acima. As irregularidades relacionadas devem ser corrigidas nos prazos fixados pela autoridade sanitária.'
  },
  normas: [
    ['RDC Anvisa nº 197/2017', 'Requisitos mínimos para o funcionamento dos serviços de vacinação humana.'],
    ['RDC Anvisa nº 44/2009', 'Boas práticas farmacêuticas e serviços farmacêuticos em farmácias e drogarias.'],
    ['RDC Anvisa nº 222/2018', 'Gerenciamento dos resíduos de serviços de saúde.'],
    ['Lei Municipal nº 13.725/2004', 'Código Sanitário do Município de São Paulo.']
  ],
  secoes: [
    {
      id: 'ident', titulo: 'Identificação e serviço', curto: 'Identificação', icone: 'building',
      itens: [
        {id: 'dados', titulo: 'Dados do estabelecimento e da inspeção', curto: 'Dados', campos: [
          {id: 'razao', rotulo: 'Razão social'}, {id: 'fantasia', rotulo: 'Nome fantasia'},
          {id: 'cnpj', rotulo: 'CNPJ', tipo: 'cnpj'}, {id: 'endereco', rotulo: 'Endereço', largo: true},
          {id: 'licenca', rotulo: 'Licença sanitária (CEVS) nº'}, {id: 'cnes', rotulo: 'CNES'},
          {id: 'rl', rotulo: 'Responsável legal'}, {id: 'rt', rotulo: 'Responsável técnico (nome e registro)'},
          {id: 'rt_sub', rotulo: 'Responsável técnico substituto'}, {id: 'acompanhou', rotulo: 'Acompanhou a inspeção'},
          {id: 'data', rotulo: 'Data da inspeção', tipo: 'date'}, {id: 'equipe', rotulo: 'Equipe de inspeção', largo: true}
        ]},
        {id: 'servico', titulo: 'Vacinas e modalidades', curto: 'Serviço', campos: [
          {id: 'vacinas', rotulo: 'Vacinas oferecidas', tipo: 'checks', opcoes: [
            ['influenza', 'Influenza'], ['covid', 'COVID-19'], ['hpv', 'HPV'], ['hepatites', 'Hepatites A e B'],
            ['meningo', 'Meningocócicas'], ['pneumo', 'Pneumocócicas'], ['dtpa', 'dTpa / dT'], ['zoster', 'Herpes-zóster'],
            ['varicela', 'Varicela / tríplice viral'], ['outra', 'Outras']]},
          {id: 'vacinas_outras', rotulo: 'Outras vacinas', largo: true},
          {id: 'extramuros', rotulo: 'Realiza vacinação extramuros?', tipo: 'select', opcoes: [['sim', 'Sim'], ['nao', 'Não']]},
          {id: 'civp', rotulo: 'Emite Certificado Internacional de Vacinação (CIVP)?', tipo: 'select', opcoes: [['sim', 'Sim'], ['nao', 'Não']]}
        ]}
      ]
    },
    {
      id: 'organizacao', titulo: 'Organização e pessoal', curto: 'Organização', icone: 'people',
      itens: [
        {id: 'regularidade', titulo: 'Licenciamento e informação ao usuário', curto: 'Licenciamento', perguntas: [
          {id: 'lic', t: 'O estabelecimento está licenciado para a atividade de vacinação?', r: [A(4)],
            c: 'O estabelecimento está licenciado para a atividade de vacinação.', nc: 'O estabelecimento não está licenciado para a atividade de vacinação.', inf: ['vac_lic']},
          {id: 'cnes', t: 'O estabelecimento está inscrito no CNES, com dados atualizados?', r: [A(5)],
            c: 'O estabelecimento está inscrito no CNES, com dados atualizados.', nc: 'O estabelecimento não comprovou inscrição atualizada no CNES.', inf: ['vac_cnes']},
          {id: 'calendario', t: 'O Calendário Nacional de Vacinação do SUS está afixado em local visível, indicando as vacinas dele disponibilizadas?', r: [A(6)],
            c: 'O Calendário Nacional de Vacinação do SUS está afixado em local visível ao usuário.', nc: 'O Calendário Nacional de Vacinação do SUS não está afixado em local visível ao usuário.', inf: ['vac_calend']}
        ]},
        {id: 'pessoal', titulo: 'Responsáveis e capacitação', curto: 'Pessoal', perguntas: [
          {id: 'rt', t: 'Há responsável técnico e substituto designados para o serviço de vacinação?', r: [A(7)],
            c: 'Há responsável técnico e substituto designados para o serviço de vacinação.', nc: 'Não há responsável técnico ou substituto designado para o serviço de vacinação.', inf: ['vac_rt']},
          {id: 'habilitado', t: 'Há profissional legalmente habilitado para vacinar durante todo o período em que o serviço é oferecido?', r: [A(8)],
            c: 'Há profissional legalmente habilitado durante todo o período em que o serviço de vacinação é oferecido.',
            nc: 'Não há profissional legalmente habilitado durante todo o período em que o serviço de vacinação é oferecido.', inf: ['vac_rt']},
          {id: 'capacitacao', t: 'Os profissionais são capacitados periodicamente nos temas exigidos (conservação, preparo e administração, resíduos, registros, eventos adversos, calendário, higiene das mãos, intercorrências)?', r: [A(9)],
            c: 'Os profissionais são capacitados periodicamente nos temas exigidos.', nc: 'Os profissionais não são capacitados periodicamente em todos os temas exigidos.', inf: ['vac_capacit']},
          {id: 'registro_capac', t: 'As capacitações estão registradas com data, horário, carga horária, conteúdo, instrutor e participantes?', r: [P(9, 'unico')],
            c: 'As capacitações estão registradas com os dados exigidos.', nc: 'As capacitações não estão registradas com os dados exigidos.', inf: ['vac_capacit']}
        ]}
      ]
    },
    {
      id: 'infra', titulo: 'Infraestrutura', curto: 'Infraestrutura', icone: 'plan',
      itens: [
        {id: 'ambientes', titulo: 'Ambientes', curto: 'Ambientes', perguntas: [
          {id: 'recepcao', t: 'Há área de recepção dimensionada à demanda e separada da sala de vacinação?', r: [I(10, 'i')],
            c: 'Há área de recepção dimensionada à demanda e separada da sala de vacinação.', nc: 'Não há área de recepção separada da sala de vacinação.', inf: ['vac_infra']},
          {id: 'sanitario', t: 'Há sanitário?', r: [I(10, 'ii')], c: 'Há sanitário.', nc: 'Não há sanitário.', inf: ['vac_infra']},
          {id: 'sala', t: 'Há sala de vacinação fechada por paredes em todo o perímetro e com porta?', r: [I(10, 'iii'), I(3, 'xi')],
            c: 'Há sala de vacinação fechada por paredes em todo o perímetro e com porta.', nc: 'Não há sala de vacinação fechada por paredes em todo o perímetro e com porta.', inf: ['vac_infra']}
        ]},
        {id: 'sala', titulo: 'Sala de vacinação', curto: 'Sala', perguntas: [
          {id: 'pia', t: 'A sala tem pia de lavagem?', r: [AL('a')], c: 'A sala de vacinação tem pia de lavagem.', nc: 'A sala de vacinação não tem pia de lavagem.', inf: ['vac_infra']},
          {id: 'mobiliario', t: 'A sala tem bancada, mesa, cadeira e maca?', r: [AL('b'), AL('c'), AL('d'), AL('i')],
            c: 'A sala de vacinação tem bancada, mesa, cadeira e maca.', nc: 'A sala de vacinação não tem bancada, mesa, cadeira ou maca.', inf: ['vac_infra']},
          {id: 'guarda', t: 'Há local para a guarda dos materiais de administração das vacinas?', r: [AL('g')],
            c: 'Há local para a guarda dos materiais de administração das vacinas.', nc: 'Não há local para a guarda dos materiais de administração das vacinas.', inf: ['vac_infra']},
          {id: 'descarte', t: 'Há recipientes para descarte de perfurocortantes e de resíduos biológicos?', r: [AL('h')],
            c: 'Há recipientes para descarte de perfurocortantes e de resíduos biológicos.', nc: 'Não há recipientes adequados para descarte de perfurocortantes e de resíduos biológicos.', inf: ['vac_infra']},
          {id: 'caixa', t: 'Há caixa térmica de fácil higienização e termômetro de momento, máxima e mínima, com cabo extensor para as caixas térmicas?', r: [AL('e'), AL('j')],
            c: 'Há caixa térmica de fácil higienização e termômetro de momento, máxima e mínima, com cabo extensor.',
            nc: 'Não há caixa térmica de fácil higienização ou termômetro de momento, máxima e mínima, com cabo extensor.', inf: ['vac_infra']}
        ]},
        {id: 'refrigeracao', titulo: 'Equipamento de refrigeração', curto: 'Refrigeração',
          descricao: 'Cadastre cada equipamento que guarda vacinas: busque pelo registro na Anvisa ou pelo processo, ou digite os dados. Os equipamentos saem em tabela no relatório.',
          /* legado: o texto livre que ficava em 1.2 (meta.refrigeracao) vira o primeiro equipamento */
          campos: [{id: 'equip_refrig', rotulo: 'Equipamentos de refrigeração das vacinas', tipo: 'equipamentos', perfil: 'refrigeracao', largo: true, legado: 'refrigeracao',
            tipos: ['Câmara refrigerada para imunobiológicos', 'Refrigerador doméstico', 'Freezer / congelador', 'Caixa térmica', 'Outro']}],
          perguntas: [
          {id: 'exclusivo', t: 'As vacinas ficam em equipamento de refrigeração exclusivo, com termômetro de momento, máxima e mínima?', r: [AL('f')],
            c: 'As vacinas ficam em equipamento de refrigeração exclusivo, com termômetro de momento, máxima e mínima.',
            nc: 'As vacinas não ficam em equipamento de refrigeração exclusivo com termômetro de momento, máxima e mínima.', inf: ['vac_refrig']},
          {id: 'regularizado', t: 'O equipamento de refrigeração está regularizado na Anvisa?', r: [P(10, '2')],
            c: 'O equipamento de refrigeração das vacinas está regularizado na Anvisa.', nc: 'O equipamento de refrigeração das vacinas não está regularizado na Anvisa.', inf: ['vac_refrig']},
          {id: 'energia', t: 'Há meios eficazes para manter a conservação das vacinas mesmo em falta de energia elétrica?', r: [I(11, 'i')],
            c: 'Há meios eficazes para manter a conservação das vacinas mesmo em falta de energia elétrica.',
            nc: 'Não há meios eficazes para manter a conservação das vacinas em falta de energia elétrica.', inf: ['vac_refrig']},
          {id: 'temperatura', t: 'As temperaturas máxima e mínima são registradas diariamente, com instrumento calibrado e monitoramento contínuo?', r: [I(11, 'ii')],
            c: 'As temperaturas máxima e mínima são registradas diariamente, com instrumento calibrado e monitoramento contínuo.',
            nc: 'As temperaturas máxima e mínima não são registradas diariamente com instrumento calibrado e monitoramento contínuo.', inf: ['vac_refrig']}
        ]}
      ]
    },
    {
      id: 'processos', titulo: 'Vacinas e processos', curto: 'Processos', icone: 'shield',
      itens: [
        {id: 'produtos', titulo: 'Vacinas e prescrição', curto: 'Vacinas',
          descricao: 'Liste as vacinas em estoque: busque pelo registro na Anvisa ou pelo processo (preenche nome, princípio ativo, detentor, situação e vencimento do registro), informe lote e validade. A lista sai em tabela no relatório.',
          campos: [{id: 'vacinas_lista', rotulo: 'Vacinas em estoque', tipo: 'equipamentos', perfil: 'vacina', largo: true}],
          perguntas: [
          {id: 'registro_anvisa', t: 'Só são utilizadas vacinas registradas ou autorizadas pela Anvisa?', r: [I(11, 'iii')],
            c: 'Só são utilizadas vacinas registradas ou autorizadas pela Anvisa.', nc: 'Foram constatadas vacinas sem registro ou autorização da Anvisa.', inf: ['vac_vacina']},
          {id: 'origem', t: 'Estão disponíveis os documentos que comprovam a origem das vacinas?', r: [I(15, 'iii')],
            c: 'Estão disponíveis os documentos que comprovam a origem das vacinas.', nc: 'Não estão disponíveis os documentos que comprovam a origem das vacinas.', inf: ['vac_origem']},
          {id: 'prescricao', t: 'Vacinas fora do Calendário Nacional do SUS só são aplicadas com prescrição médica, e a dispensação é sempre vinculada à aplicação?', r: [A(14), P(14, 'unico')],
            c: 'Vacinas fora do Calendário Nacional do SUS só são aplicadas com prescrição médica, e a dispensação é vinculada à aplicação.',
            nc: 'Foram aplicadas vacinas fora do Calendário Nacional do SUS sem prescrição médica, ou houve dispensação de vacina não vinculada à aplicação.', inf: ['vac_prescr']}
        ]},
        {id: 'transporte', titulo: 'Transporte e intercorrências', curto: 'Transporte', perguntas: [
          {id: 'transporte', t: 'Quando as vacinas são transportadas, usam-se caixas térmicas que mantêm a conservação, com registro das temperaturas mínima e máxima?', r: [A(12), P(12, '1'), P(12, '2')], na: true,
            c: 'As vacinas são transportadas em caixas térmicas que mantêm a conservação, com registro das temperaturas mínima e máxima.',
            nc: 'O transporte das vacinas não é feito em caixas térmicas adequadas ou sem registro das temperaturas mínima e máxima.', inf: ['vac_transp']},
          {id: 'intercorrencia', t: 'O serviço garante atendimento imediato às intercorrências e o encaminhamento a serviço de maior complexidade, quando necessário?', r: [A(13), P(13, 'unico')],
            c: 'O serviço garante atendimento imediato às intercorrências e o encaminhamento a serviço de maior complexidade.',
            nc: 'O serviço não garante atendimento imediato às intercorrências ou o encaminhamento a serviço de maior complexidade.', inf: ['vac_interc']}
        ]}
      ]
    },
    {
      id: 'registros', titulo: 'Registros e notificações', curto: 'Registros', icone: 'note',
      itens: [
        {id: 'registros', titulo: 'Registro das vacinas aplicadas', curto: 'Registros', perguntas: [
          {id: 'cartao_sistema', t: 'As vacinas aplicadas são registradas no cartão de vacinação e no sistema de informação do Ministério da Saúde?', r: [I(15, 'i')],
            c: 'As vacinas aplicadas são registradas no cartão de vacinação e no sistema de informação do Ministério da Saúde.',
            nc: 'As vacinas aplicadas não são registradas no cartão de vacinação ou no sistema de informação do Ministério da Saúde.', inf: ['vac_registro']},
          {id: 'prontuario', t: 'Há prontuário individual com todas as vacinas aplicadas, acessível ao usuário e à autoridade sanitária?', r: [I(15, 'ii')],
            c: 'Há prontuário individual com todas as vacinas aplicadas.', nc: 'Não há prontuário individual com todas as vacinas aplicadas.', inf: ['vac_registro']},
          {id: 'cartao', t: 'O cartão traz, de forma legível, dados do vacinado, vacina, dose, data, lote, fabricante, estabelecimento, vacinador e próxima dose?', r: [A(16)],
            c: 'O cartão de vacinação traz, de forma legível, as informações mínimas exigidas.', nc: 'O cartão de vacinação não traz todas as informações mínimas exigidas.', inf: ['vac_registro']}
        ]},
        {id: 'notificacoes', titulo: 'Eventos adversos e erros de vacinação', curto: 'Notificações', perguntas: [
          {id: 'eapv', t: 'Há sistemática para notificar eventos adversos pós-vacinação conforme o Ministério da Saúde?', r: [I(15, 'iv')],
            c: 'Há sistemática para notificar eventos adversos pós-vacinação.', nc: 'Não há sistemática para notificar eventos adversos pós-vacinação.', inf: ['vac_notif']},
          {id: 'erros', t: 'Os erros de vacinação são notificados no sistema da Anvisa e investigados?', r: [I(15, 'v'), I(15, 'vi')],
            c: 'Os erros de vacinação são notificados no sistema da Anvisa e investigados.', nc: 'Os erros de vacinação não são notificados no sistema da Anvisa ou não são investigados.', inf: ['vac_notif']}
        ]}
      ]
    },
    {
      id: 'especiais', titulo: 'Extramuros e CIVP', curto: 'Extramuros e CIVP', icone: 'truck',
      descricao: 'Aparece conforme o marcado em Identificação › Vacinas e modalidades.',
      itens: [
        {id: 'extramuros', titulo: 'Vacinação extramuros', curto: 'Extramuros', vazio: 'O estabelecimento não informou vacinação extramuros (Identificação › Vacinas e modalidades).', perguntas: [
          {id: 'extra_aut', t: 'A vacinação extramuros tem autorização da autoridade sanitária e é feita pelo estabelecimento licenciado?', r: [A(17), P(17, '2')], se: {campo: 'extramuros', igual: 'sim'},
            c: 'A vacinação extramuros tem autorização da autoridade sanitária e é feita pelo estabelecimento licenciado.',
            nc: 'A vacinação extramuros é realizada sem autorização da autoridade sanitária ou por estabelecimento não licenciado.', inf: ['vac_extra']},
          {id: 'extra_regras', t: 'A vacinação extramuros segue as mesmas regras de pessoal, conservação, registros e notificações?', r: [P(17, '1')], se: {campo: 'extramuros', igual: 'sim'},
            c: 'A vacinação extramuros segue as mesmas regras de pessoal, conservação, registros e notificações.',
            nc: 'A vacinação extramuros não segue as regras de pessoal, conservação, registros ou notificações.', inf: ['vac_extra']}
        ]},
        {id: 'civp', titulo: 'Certificado Internacional de Vacinação (CIVP)', curto: 'CIVP', vazio: 'O estabelecimento não informou emissão de CIVP (Identificação › Vacinas e modalidades).', perguntas: [
          {id: 'civp_cred', t: 'O serviço é credenciado pela Anvisa para emitir o CIVP?', r: [A(18), P(18, 'unico')], se: {campo: 'civp', igual: 'sim'},
            c: 'O serviço é credenciado pela Anvisa para emitir o CIVP.', nc: 'O serviço emite o CIVP sem credenciamento da Anvisa.', inf: ['vac_civp']},
          {id: 'civp_emissao', t: 'O CIVP é emitido gratuitamente, no padrão da Anvisa, e registrado no sistema da Anvisa?', r: [A(19), P(19, '1'), P(19, '2')], se: {campo: 'civp', igual: 'sim'},
            c: 'O CIVP é emitido gratuitamente, no padrão da Anvisa, e registrado no sistema da Anvisa.',
            nc: 'O CIVP não é emitido gratuitamente, no padrão da Anvisa, ou não é registrado no sistema da Anvisa.', inf: ['vac_civp']}
        ]}
      ]
    }
  ],
  infracoes: [
    {id: 'vac_lic', grupo: 'Licenciamento e pessoal', texto: 'Realizar vacinação sem licença sanitária para a atividade.', r: [LM(90), LM(90) + '::paragrafo::1', A(4)]},
    {id: 'vac_cnes', grupo: 'Licenciamento e pessoal', texto: 'Realizar vacinação sem inscrição atualizada no Cadastro Nacional de Estabelecimentos de Saúde.', r: [LM(50), A(5)]},
    {id: 'vac_calend', grupo: 'Licenciamento e pessoal', texto: 'Deixar de afixar o Calendário Nacional de Vacinação do SUS em local visível ao usuário.', r: [LM(50), A(6)]},
    {id: 'vac_rt', grupo: 'Licenciamento e pessoal', texto: 'Manter serviço de vacinação sem responsável técnico e substituto, ou sem profissional legalmente habilitado durante todo o funcionamento.', r: [LM(50), A(7), A(8)]},
    {id: 'vac_capacit', grupo: 'Licenciamento e pessoal', texto: 'Deixar de capacitar periodicamente os profissionais da vacinação ou de registrar as capacitações.', r: [LM(50), A(9)]},
    {id: 'vac_infra', grupo: 'Infraestrutura e conservação', texto: 'Manter serviço de vacinação sem os ambientes e itens de infraestrutura obrigatórios.', r: [LM(50), A(10)]},
    {id: 'vac_refrig', grupo: 'Infraestrutura e conservação', texto: 'Conservar vacinas sem equipamento de refrigeração exclusivo e regularizado, sem meios para falta de energia ou sem registro diário das temperaturas.', r: [LM(46), AL('f'), P(10, '2'), I(11, 'i'), I(11, 'ii')]},
    {id: 'vac_transp', grupo: 'Infraestrutura e conservação', texto: 'Transportar vacinas sem caixas térmicas adequadas ou sem monitoramento das temperaturas.', r: [LM(46), A(12)]},
    {id: 'vac_vacina', grupo: 'Vacinas e processos', texto: 'Utilizar vacina sem registro ou autorização da Anvisa.', r: [LM(46), I(11, 'iii')]},
    {id: 'vac_origem', grupo: 'Vacinas e processos', texto: 'Deixar de manter os documentos que comprovam a origem das vacinas.', r: [LM(46), I(15, 'iii')]},
    {id: 'vac_prescr', grupo: 'Vacinas e processos', texto: 'Aplicar vacina fora do Calendário Nacional do SUS sem prescrição médica ou dispensar vacina sem vinculá-la à aplicação.', r: [LM(50), A(14)]},
    {id: 'vac_interc', grupo: 'Vacinas e processos', texto: 'Deixar de garantir atendimento imediato às intercorrências relacionadas à vacinação.', r: [LM(50), A(13)]},
    {id: 'vac_registro', grupo: 'Registros e notificações', texto: 'Deixar de registrar as vacinas aplicadas no cartão, no sistema do Ministério da Saúde ou no prontuário, ou emitir cartão sem as informações mínimas.', r: [LM(50), I(15, 'i'), I(15, 'ii'), A(16)]},
    {id: 'vac_notif', grupo: 'Registros e notificações', texto: 'Deixar de notificar eventos adversos pós-vacinação ou erros de vacinação, ou de investigá-los.', r: [LM(55), I(15, 'iv'), I(15, 'v'), I(15, 'vi')]},
    {id: 'vac_extra', grupo: 'Extramuros e CIVP', texto: 'Realizar vacinação extramuros sem autorização da autoridade sanitária ou fora das regras do serviço.', r: [LM(50), A(17)]},
    {id: 'vac_civp', grupo: 'Extramuros e CIVP', texto: 'Emitir o CIVP sem credenciamento da Anvisa, mediante cobrança ou sem registro no sistema da Anvisa.', r: [LM(50), A(18), A(19)]}
  ]
};
