/* Roteiro — Atacadista de gases medicinais (distribuição, armazenagem,
   transporte e dispensação).
   Base: RDC Anvisa nº 887/2024 (boas práticas; em vigor desde julho de 2026,
   24 meses após a publicação) e RDC Anvisa nº 870/2024 (regularização,
   rotulagem, cilindros e válvulas). Base sancionatória: Lei Municipal nº
   13.725/2004. Mesmo formato de eac.cjs; perguntas com “se” aparecem conforme
   as atividades marcadas na identificação. */
'use strict';
const A = (art, ...resto) => ['rdc-887-2024::artigo::' + art].concat(resto.length ? [resto.join('::')] : []).join('::');
const I = (art, inc) => A(art, 'inciso', inc);
const P = (art, par) => A(art, 'paragrafo', par);
const R870 = (art, ...resto) => ['rdc-870-2024::artigo::' + art].concat(resto.length ? [resto.join('::')] : []).join('::');
const LM = art => 'lei-municipal-13725-2004::artigo::' + art;
const TEM = at => ({campo: 'atividades', inclui: at});

module.exports = {
  app: 'gases-medicinais',
  titulo: 'Atacadista de gases medicinais',
  tituloCurto: 'Gases_medicinais',
  store: 'med-gases-v1',
  relatorio: {
    titulo: 'RELATÓRIO DE INSPEÇÃO SANITÁRIA',
    subtitulo: 'Distribuição, armazenagem, transporte e dispensação de gases medicinais (RDC Anvisa nº 887/2024)',
    objetivo: 'Verificar as boas práticas de distribuição, armazenagem, transporte e dispensação de gases medicinais adotadas pelo estabelecimento, nos termos da RDC Anvisa nº 887/2024, e a regularidade e a rotulagem dos gases medicinais, nos termos da RDC Anvisa nº 870/2024.',
    conclusao: 'Diante do exposto, as atividades com gases medicinais do estabelecimento foram avaliadas conforme os itens acima. As irregularidades relacionadas devem ser corrigidas nos prazos fixados pela autoridade sanitária.'
  },
  normas: [
    ['RDC Anvisa nº 887/2024', 'Boas práticas de distribuição, armazenagem, transporte e dispensação de gases medicinais.'],
    ['RDC Anvisa nº 870/2024', 'Notificação, registro, rotulagem e requisitos dos gases medicinais enquadrados como medicamentos.'],
    ['Lei Municipal nº 13.725/2004', 'Código Sanitário do Município de São Paulo.']
  ],
  secoes: [
    {
      id: 'ident', titulo: 'Identificação e atividades', curto: 'Identificação', icone: 'building',
      itens: [
        {id: 'dados', titulo: 'Dados do estabelecimento e da inspeção', curto: 'Dados', campos: [
          {id: 'razao', rotulo: 'Razão social'}, {id: 'fantasia', rotulo: 'Nome fantasia'},
          {id: 'cnpj', rotulo: 'CNPJ', tipo: 'cnpj'}, {id: 'endereco', rotulo: 'Endereço', largo: true},
          {id: 'licenca', rotulo: 'Licença sanitária (CEVS) nº'}, {id: 'afe', rotulo: 'AFE nº (classe gases medicinais)'},
          {id: 'ae', rotulo: 'AE nº (quando aplicável)'}, {id: 'rl', rotulo: 'Responsável legal'},
          {id: 'rt', rotulo: 'Responsável técnico (nome e registro no conselho)'}, {id: 'acompanhou', rotulo: 'Acompanhou a inspeção'},
          {id: 'data', rotulo: 'Data da inspeção', tipo: 'date'}, {id: 'equipe', rotulo: 'Equipe de inspeção', largo: true}
        ]},
        {id: 'atividades', titulo: 'Atividades e produtos', curto: 'Atividades', campos: [
          {id: 'atividades', rotulo: 'Atividades exercidas com gases medicinais', tipo: 'checks', opcoes: [
            ['distribuir', 'Distribuir'], ['armazenar', 'Armazenar'], ['transportar', 'Transportar'],
            ['fracionar', 'Fracionar (abastecer tanques de clientes a partir do granel)'], ['dispensar', 'Dispensar ao usuário final / assistência domiciliar']]},
          {id: 'nao_medicinais', rotulo: 'Comercializa também gases não medicinais (industriais)?', tipo: 'select', opcoes: [['sim', 'Sim'], ['nao', 'Não']]},
          {id: 'gases', rotulo: 'Gases medicinais', tipo: 'checks', opcoes: [
            ['oxigenio', 'Oxigênio'], ['ar', 'Ar medicinal'], ['oxido_nitroso', 'Óxido nitroso'], ['nitrogenio', 'Nitrogênio'],
            ['co2', 'Dióxido de carbono'], ['misturas', 'Misturas'], ['outros', 'Outros']]},
          {id: 'formas', rotulo: 'Formas de apresentação', tipo: 'checks', opcoes: [
            ['cilindros', 'Cilindros'], ['tanques_moveis', 'Tanques criogênicos móveis / domiciliares'], ['granel', 'Granel (caminhões-tanque)']]},
          {id: 'observacoes', rotulo: 'Observações sobre as atividades (frota, filiais, clientes)', tipo: 'textarea', largo: true}
        ]}
      ]
    },
    {
      id: 'regular', titulo: 'Regularidade e organização', curto: 'Regularidade', icone: 'folder',
      itens: [
        {id: 'autorizacoes', titulo: 'Licença, AFE e responsabilidade técnica', curto: 'Autorizações', perguntas: [
          {id: 'licenca', t: 'A licença sanitária contempla as atividades exercidas com gases medicinais?', r: [LM(90), LM(90) + '::paragrafo::1'],
            c: 'A licença sanitária contempla as atividades exercidas com gases medicinais.', nc: 'A licença sanitária não contempla as atividades exercidas com gases medicinais.', inf: ['gas_lic']},
          {id: 'afe', t: 'Há AFE (e AE, quando aplicável) para as atividades exercidas, com a classe gases medicinais distinta da de medicamentos?', r: [A(9), P(9, '1')],
            c: 'Há AFE para as atividades exercidas, com a classe gases medicinais.', nc: 'Não há AFE para as atividades exercidas ou a AFE não contempla a classe gases medicinais.', inf: ['gas_afe']},
          {id: 'rt', t: 'A responsabilidade técnica é de profissional legalmente habilitado (farmacêutico, quando há dispensação)?', r: [A(13), P(13, 'unico')],
            c: 'A responsabilidade técnica é de profissional legalmente habilitado.', nc: 'A responsabilidade técnica não é de profissional legalmente habilitado para as atividades exercidas.', inf: ['gas_rt']},
          {id: 'organograma', t: 'Há organograma e descrição das responsabilidades de cada cargo?', r: [A(12), P(12, 'unico')],
            c: 'Há organograma e descrição das responsabilidades de cada cargo.', nc: 'Não há organograma ou descrição das responsabilidades dos cargos.', inf: ['gas_sgq']},
          {id: 'estrutura', t: 'Há locais, instalações, veículos e pessoal adequados e suficientes para as operações?', r: [I(8, 'ii'), I(8, 'iii')],
            c: 'Há locais, instalações, veículos e pessoal adequados e suficientes para as operações.', nc: 'Os locais, instalações, veículos ou pessoal não são adequados ou suficientes para as operações.', inf: ['gas_estrutura']}
        ]},
        {id: 'cadeia', titulo: 'Fornecedores, clientes e produtos', curto: 'Cadeia', perguntas: [
          {id: 'fornecedores', t: 'Os gases são recebidos ou adquiridos somente de empresas licenciadas e autorizadas?', r: [A(5), I(19, 'x')],
            c: 'Os gases são recebidos ou adquiridos somente de empresas licenciadas e autorizadas.', nc: 'Foram constatados gases recebidos ou adquiridos de empresa sem licença ou autorização.', inf: ['gas_cadeia']},
          {id: 'clientes', t: 'A expedição é feita somente a empresas licenciadas e autorizadas (exceto estabelecimentos de saúde)?', r: [A(6), P(6, 'unico')], se: TEM('distribuir'),
            c: 'A expedição é feita somente a empresas licenciadas e autorizadas ou a estabelecimentos de saúde.', nc: 'Foi constatada expedição a empresa sem licença ou autorização.', inf: ['gas_cadeia']},
          {id: 'regularizados', t: 'Os gases medicinais comercializados estão notificados ou registrados na Anvisa? (prazo de adequação até 31/03/2027)', r: [R870(4), R870(63)], na: true,
            c: 'Os gases medicinais comercializados estão notificados ou registrados na Anvisa.', nc: 'Foram constatados gases medicinais comercializados sem notificação ou registro na Anvisa.', inf: ['gas_produto']},
          {id: 'entre_distrib', t: 'Na venda a outra distribuidora, ambas têm AFE para distribuição (e, no granel, cumprem as boas práticas de fabricação)?', r: [A(78), P(78, 'unico')], na: true, se: TEM('distribuir'),
            c: 'A comercialização entre distribuidoras ocorre entre empresas com AFE para distribuição.', nc: 'Foi constatada comercialização com distribuidora sem AFE para distribuição.', inf: ['gas_cadeia']},
          {id: 'envase', t: 'A empresa não envasa gases (o envase exige boas práticas de fabricação)?', r: [P(2, '3'), A(11), A(63)],
            c: 'A empresa não realiza envase de gases medicinais.', nc: 'A empresa realiza envase de gases medicinais sem atender às boas práticas de fabricação.', inf: ['gas_envase']}
        ]}
      ]
    },
    {
      id: 'pessoal', titulo: 'Pessoal', curto: 'Pessoal', icone: 'people',
      itens: [
        {id: 'equipe', titulo: 'Equipe e treinamento', curto: 'Equipe', perguntas: [
          {id: 'quadro', t: 'O número e a qualificação dos funcionários são adequados, sem acúmulo de responsabilidades que ponha em risco a qualidade?', r: [A(14)],
            c: 'O número e a qualificação dos funcionários são adequados às atividades.', nc: 'O número ou a qualificação dos funcionários não são adequados às atividades.', inf: ['gas_pessoal']},
          {id: 'saude', t: 'Há requisitos estabelecidos de saúde, higiene e vestuário conforme as atividades?', r: [A(15)],
            c: 'Há requisitos de saúde, higiene e vestuário estabelecidos.', nc: 'Não há requisitos de saúde, higiene e vestuário estabelecidos.', inf: ['gas_pessoal']},
          {id: 'treinamento', t: 'A sistemática de treinamento está descrita, com treinamento inicial, periódico e contínuo e matriz de treinamento por cargo?', r: [A(16), P(16, '1'), P(16, '3')],
            c: 'A sistemática de treinamento está descrita, com treinamento inicial, periódico e contínuo e matriz por cargo.', nc: 'Não há sistemática descrita de treinamento inicial, periódico e contínuo com matriz por cargo.', inf: ['gas_pessoal']},
          {id: 'registros_trein', t: 'Os registros de treinamento identificam o treinando, data, carga horária, estratégia, assuntos e avaliação da eficácia?', r: [P(16, '4')],
            c: 'Os registros de treinamento contêm as informações exigidas.', nc: 'Os registros de treinamento não contêm as informações exigidas.', inf: ['gas_pessoal']},
          {id: 'domiciliar', t: 'O treinamento inclui os cuidados de assistência domiciliar?', r: [P(16, '2')], se: TEM('dispensar'),
            c: 'O treinamento inclui os cuidados de assistência domiciliar.', nc: 'O treinamento não inclui os cuidados de assistência domiciliar.', inf: ['gas_pessoal']},
          {id: 'conduta', t: 'Nas áreas de recepção, armazenagem, expedição e devolução não há fumo, alimentos, bebidas (exceto água em local próprio), plantas ou objetos estranhos?', r: [A(17)],
            c: 'As áreas operacionais estão livres de fumo, alimentos, plantas e objetos estranhos.', nc: 'Foram constatados fumo, alimentos, plantas ou objetos estranhos nas áreas operacionais.', inf: ['gas_pessoal']}
        ]}
      ]
    },
    {
      id: 'qualidade', titulo: 'Gestão da qualidade', curto: 'Qualidade', icone: 'shield',
      itens: [
        {id: 'sgq', titulo: 'Sistema de Gestão da Qualidade', curto: 'SGQ', perguntas: [
          {id: 'sgq', t: 'O SGQ está documentado, cobre todos os aspectos que influenciam a qualidade e tem plano de contingência para desabastecimento?', r: [A(18), P(18, '2'), I(8, 'i')],
            c: 'O Sistema de Gestão da Qualidade está documentado, abrangente e tem plano de contingência para desabastecimento.', nc: 'O Sistema de Gestão da Qualidade não está documentado, não é abrangente ou não tem plano de contingência para desabastecimento.', inf: ['gas_sgq']},
          {id: 'autonomia', t: 'A área da qualidade tem autonomia hierárquica e recursos para as funções previstas?', r: [A(19)],
            c: 'A área da qualidade tem autonomia hierárquica e recursos.', nc: 'A área da qualidade não tem autonomia hierárquica ou recursos.', inf: ['gas_sgq']},
          {id: 'mudancas', t: 'Há controle e gerenciamento de mudanças e registro, investigação e ações corretivas e preventivas para as não conformidades?', r: [I(19, 'ix'), I(19, 'xii')],
            c: 'Há controle de mudanças e tratamento das não conformidades com ações corretivas e preventivas.', nc: 'Não há controle de mudanças ou tratamento das não conformidades com ações corretivas e preventivas.', inf: ['gas_sgq']},
          {id: 'pragas', t: 'Há programa de controle de pragas com produtos regularizados e sem risco de contaminação dos gases?', r: [I(19, 'xv'), P(54, 'unico')],
            c: 'Há programa de controle de pragas com produtos regularizados e seguros.', nc: 'Não há programa de controle de pragas com produtos regularizados e seguros.', inf: ['gas_instalacoes']},
          {id: 'residuos', t: 'Há procedimento de gerenciamento de resíduos?', r: [I(8, 'v'), I(19, 'xiii')],
            c: 'Há procedimento de gerenciamento de resíduos.', nc: 'Não há procedimento de gerenciamento de resíduos.', inf: ['gas_sgq']}
        ]},
        {id: 'documentos', titulo: 'Documentação e registros', curto: 'Documentação', perguntas: [
          {id: 'gestao_doc', t: 'Há sistemática de elaboração, revisão, aprovação, distribuição, guarda e obsolescência dos documentos?', r: [A(20)],
            c: 'Há sistemática de gestão dos documentos da qualidade.', nc: 'Não há sistemática de gestão dos documentos da qualidade.', inf: ['gas_documentos']},
          {id: 'pops', t: 'Os POPs são compreensíveis, cobrem todas as atividades, estão atualizados e disponíveis nos locais de trabalho?', r: [A(21), A(22), A(23)],
            c: 'Os POPs são compreensíveis, completos, atualizados e disponíveis nos locais de trabalho.', nc: 'Os POPs não são compreensíveis, completos, atualizados ou disponíveis nos locais de trabalho.', inf: ['gas_documentos']},
          {id: 'registros', t: 'As atividades são registradas de forma rastreável e os registros são guardados por, no mínimo, um ano após a validade do produto?', r: [A(24), P(24, 'unico')],
            c: 'As atividades são registradas de forma rastreável e os registros são guardados pelo prazo exigido.', nc: 'As atividades não são registradas de forma rastreável ou os registros não são guardados pelo prazo exigido.', inf: ['gas_documentos']},
          {id: 'integridade', t: 'Os registros são protegidos contra alteração não autorizada, com correção justificada, backup e acesso por senha individual?', r: [A(25), P(25, '1'), P(25, '2'), P(25, '3')],
            c: 'Os registros são protegidos, com correção justificada, backup e acesso por senha individual.', nc: 'Os registros não são protegidos contra alteração não autorizada ou não há backup e acesso por senha.', inf: ['gas_documentos']}
        ]},
        {id: 'autoinspecao', titulo: 'Autoinspeção, qualificação e calibração', curto: 'Autoinspeção', perguntas: [
          {id: 'programa', t: 'Há programa de autoinspeção que cubra todos os processos da qualidade em até 2 anos?', r: [A(42), P(42, 'unico')],
            c: 'Há programa de autoinspeção que cobre os processos da qualidade em até 2 anos.', nc: 'Não há programa de autoinspeção que cubra os processos da qualidade em até 2 anos.', inf: ['gas_autoinspecao']},
          {id: 'independencia', t: 'As autoinspeções são feitas por profissionais capacitados e sem vínculo com o setor inspecionado, com relatórios completos?', r: [A(43), A(44)],
            c: 'As autoinspeções são independentes, feitas por profissionais capacitados e registradas em relatórios completos.', nc: 'As autoinspeções não são independentes, feitas por pessoal capacitado ou registradas em relatórios completos.', inf: ['gas_autoinspecao']},
          {id: 'qualificacao', t: 'Equipamentos, processos e sistemas informatizados que influenciam a qualidade foram qualificados ou validados?', r: [A(45)],
            c: 'Equipamentos, processos e sistemas informatizados que influenciam a qualidade foram qualificados ou validados.', nc: 'Há equipamentos, processos ou sistemas informatizados sem qualificação ou validação.', inf: ['gas_qualificacao']},
          {id: 'calibracao', t: 'Os instrumentos de medição com impacto na qualidade são calibrados com frequência justificada?', r: [A(46)],
            c: 'Os instrumentos de medição são calibrados com frequência justificada.', nc: 'Os instrumentos de medição não são calibrados com frequência justificada.', inf: ['gas_qualificacao']},
          {id: 'manutencao', t: 'Há programa de manutenção preventiva dos equipamentos com impacto na qualidade?', r: [A(47)],
            c: 'Há programa de manutenção preventiva dos equipamentos.', nc: 'Não há programa de manutenção preventiva dos equipamentos.', inf: ['gas_qualificacao']}
        ]}
      ]
    },
    {
      id: 'rastreio', titulo: 'Reclamações, recolhimento e rastreabilidade', curto: 'Rastreabilidade', icone: 'note',
      itens: [
        {id: 'reclamacoes', titulo: 'Reclamações', curto: 'Reclamações', perguntas: [
          {id: 'sac', t: 'Há serviço de atendimento divulgado aos clientes e usuários para receber reclamações?', r: [A(26)],
            c: 'Há serviço de atendimento divulgado para receber reclamações.', nc: 'Não há serviço de atendimento divulgado para receber reclamações.', inf: ['gas_reclamacao']},
          {id: 'investigacao', t: 'As reclamações de qualidade e eventos adversos são registradas, investigadas até a causa raiz e classificadas como procedentes ou não?', r: [A(27), P(27, '2'), P(27, '3')],
            c: 'As reclamações são registradas e investigadas até a causa raiz.', nc: 'As reclamações não são registradas ou investigadas até a causa raiz.', inf: ['gas_reclamacao']},
          {id: 'pop_reclamacao', t: 'Há procedimento escrito para reclamação de desvio de qualidade, inclusive quando exige recolhimento?', r: [A(28)],
            c: 'Há procedimento escrito para reclamações de desvio de qualidade.', nc: 'Não há procedimento escrito para reclamações de desvio de qualidade.', inf: ['gas_reclamacao']},
          {id: 'separacao', t: 'As reclamações de desvio de qualidade são registradas à parte, revisadas periodicamente e repassadas ao fabricante ou detentor do registro?', r: [A(29), A(30), P(30, 'unico')],
            c: 'As reclamações de desvio de qualidade são registradas à parte, revisadas e repassadas ao fabricante.', nc: 'As reclamações de desvio de qualidade não são registradas à parte, revisadas ou repassadas ao fabricante.', inf: ['gas_reclamacao']}
        ]},
        {id: 'recolhimento', titulo: 'Recolhimento, devoluções e desvios', curto: 'Recolhimento', perguntas: [
          {id: 'pop_recall', t: 'Há procedimento de recolhimento que define as responsabilidades ao longo da cadeia?', r: [A(33), I(8, 'iv'), A(32)],
            c: 'Há procedimento de recolhimento com as responsabilidades da cadeia definidas.', nc: 'Não há procedimento de recolhimento com as responsabilidades da cadeia definidas.', inf: ['gas_recolhimento']},
          {id: 'mapa', t: 'Os mapas de distribuição são prontamente recuperáveis, com dados de contato dos clientes atualizados?', r: [A(34), P(34, '1')], se: TEM('distribuir'),
            c: 'Os mapas de distribuição são prontamente recuperáveis, com contatos atualizados.', nc: 'Os mapas de distribuição não são prontamente recuperáveis ou os contatos não estão atualizados.', inf: ['gas_recolhimento']},
          {id: 'simulacao', t: 'É feita simulação de recolhimento a cada 2 anos, para granel e para cilindros?', r: [P(34, '2')], se: TEM('distribuir'),
            c: 'É feita simulação de recolhimento a cada 2 anos.', nc: 'Não é feita simulação de recolhimento a cada 2 anos.', inf: ['gas_recolhimento']},
          {id: 'devolucoes', t: 'Há procedimento de devolução, que só aceita produtos lacrados e avalia motivo, condições, embalagem e validade antes de reintegrar ao estoque?', r: [A(37), A(38), A(39), A(40)], na: true,
            c: 'Há procedimento de devolução com avaliação dos produtos antes da reintegração ao estoque.', nc: 'Não há procedimento de devolução com avaliação dos produtos antes da reintegração ao estoque.', inf: ['gas_recolhimento']},
          {id: 'furto', t: 'Há procedimento para notificar de imediato a autoridade sanitária e o fabricante em suspeita de falsificação, adulteração, roubo ou furto, com rejeição dos gases recuperados?', r: [A(41), P(41, '1'), P(41, '2'), A(31)],
            c: 'Há procedimento de notificação e rejeição em casos de falsificação, adulteração, roubo ou furto.', nc: 'Não há procedimento de notificação e rejeição em casos de falsificação, adulteração, roubo ou furto.', inf: ['gas_desvio']},
          {id: 'industrial', t: 'Cilindro de gás industrial possivelmente usado como medicinal é isolado, identificado e notificado à vigilância sanitária?', r: [A(79)],
            c: 'Há conduta de isolar, identificar e notificar cilindro de gás industrial usado como medicinal.', nc: 'Não há conduta de isolar, identificar e notificar cilindro de gás industrial usado como medicinal.', inf: ['gas_desvio']}
        ]},
        {id: 'rastreabilidade', titulo: 'Rastreabilidade, lacres e rotulagem', curto: 'Rastreabilidade', perguntas: [
          {id: 'sistema', t: 'Há sistema de registro que garante a rastreabilidade de lotes e cilindros até o ponto de consumo?', r: [A(48), I(19, 'xiv')],
            c: 'Há sistema de registro que garante a rastreabilidade de lotes e cilindros até o consumo.', nc: 'Não há sistema de registro que garanta a rastreabilidade de lotes e cilindros até o consumo.', inf: ['gas_rastreab']},
          {id: 'notas', t: 'As notas fiscais trazem os números de lote e as quantidades comercializadas?', r: [A(50)],
            c: 'As notas fiscais trazem os números de lote e as quantidades.', nc: 'As notas fiscais não trazem os números de lote e as quantidades.', inf: ['gas_rastreab']},
          {id: 'fracionamento', t: 'Há histórico das entregas relacionadas a cada lote fracionado?', r: [A(49)], se: TEM('fracionar'),
            c: 'Há histórico das entregas de cada lote fracionado.', nc: 'Não há histórico das entregas de cada lote fracionado.', inf: ['gas_rastreab']},
          {id: 'lacre', t: 'O lacre original só é removido pelo cliente ou usuário, e toda violação anterior à entrega é investigada e documentada?', r: [A(10), P(10, 'unico')],
            c: 'O lacre original é preservado até o cliente e as violações são investigadas.', nc: 'Foram constatados cilindros com lacre violado antes da entrega sem investigação documentada.', inf: ['gas_rastreab']},
          {id: 'rotulo', t: 'Os cilindros e tanques trazem rótulo com as informações exigidas para gases notificados ou registrados (exceto caminhões-tanque e tanques fixos)?', r: [R870(56), R870(57), R870(59)],
            c: 'Os cilindros e tanques trazem rótulo com as informações exigidas.', nc: 'Foram constatados cilindros ou tanques sem as informações de rotulagem exigidas.', inf: ['gas_produto']},
          {id: 'cilindros', t: 'Os cilindros e válvulas atendem às normas técnicas e as válvulas integradas estão regularizadas na Anvisa?', r: [R870(7), R870(7, 'paragrafo', 'unico')],
            c: 'Os cilindros e válvulas atendem às normas técnicas.', nc: 'Foram constatados cilindros ou válvulas em desacordo com as normas técnicas ou válvulas integradas sem regularização.', inf: ['gas_produto']}
        ]}
      ]
    },
    {
      id: 'instalacoes', titulo: 'Instalações, recebimento e expedição', curto: 'Instalações', icone: 'box',
      itens: [
        {id: 'areas', titulo: 'Áreas e armazenagem', curto: 'Áreas', perguntas: [
          {id: 'areas_minimas', t: 'Há áreas de recebimento, armazenagem geral, recolhidos e devolvidos (separada e restrita), expedição e administração, e apoio sem comunicação com a armazenagem?', r: [A(52)],
            c: 'O estabelecimento dispõe das áreas mínimas exigidas.', nc: 'O estabelecimento não dispõe de todas as áreas mínimas exigidas.', inf: ['gas_instalacoes']},
          {id: 'controlados', t: 'Os gases sujeitos a controle especial ficam em área separada e de acesso restrito?', r: [I(52, 'iv'), A(80)], na: true,
            c: 'Os gases sujeitos a controle especial ficam em área separada e de acesso restrito.', nc: 'Os gases sujeitos a controle especial não ficam em área separada e de acesso restrito.', inf: ['gas_instalacoes']},
          {id: 'segregacao', t: 'A área é proporcional ao volume e segrega gases medicinais e não medicinais, os diferentes gases e os recipientes cheios e vazios?', r: [A(53), A(7)],
            c: 'A área é proporcional ao volume e há segregação de gases medicinais e não medicinais, dos diferentes gases e dos recipientes cheios e vazios.', nc: 'A área não é proporcional ao volume ou não há segregação entre gases medicinais e não medicinais, diferentes gases ou recipientes cheios e vazios.', inf: ['gas_instalacoes']},
          {id: 'ventilacao', t: 'As áreas de cilindros e tanques são ventiladas, cobertas e protegidas do tempo, e os espaços circundantes são pavimentados?', r: [A(54), A(55)],
            c: 'As áreas de cilindros e tanques são ventiladas, cobertas e protegidas, com entorno pavimentado.', nc: 'As áreas de cilindros e tanques não são ventiladas, cobertas ou protegidas, ou o entorno não é pavimentado.', inf: ['gas_instalacoes']},
          {id: 'conservacao', t: 'As instalações estão em bom estado de conservação e limpeza?', r: [A(56)],
            c: 'As instalações estão em bom estado de conservação e limpeza.', nc: 'As instalações não estão em bom estado de conservação e limpeza.', inf: ['gas_instalacoes']},
          {id: 'avariados', t: 'Itens avariados ou danificados são retirados do estoque e armazenados separadamente?', r: [A(57)],
            c: 'Os itens avariados são retirados do estoque e armazenados separadamente.', nc: 'Os itens avariados não são segregados do estoque.', inf: ['gas_instalacoes']},
          {id: 'inventario', t: 'São feitos inventários periódicos, com investigação das discrepâncias?', r: [A(58)],
            c: 'São feitos inventários periódicos, com investigação das discrepâncias.', nc: 'Não são feitos inventários periódicos com investigação das discrepâncias.', inf: ['gas_instalacoes']}
        ]},
        {id: 'recebimento', titulo: 'Recebimento e expedição', curto: 'Recebimento', perguntas: [
          {id: 'areas_separadas', t: 'Recebimento e expedição ocorrem em áreas separadas (ou com procedimento que evite a troca de produtos)?', r: [A(59), P(59, 'unico')],
            c: 'Recebimento e expedição ocorrem em áreas separadas ou com procedimento que evita troca de produtos.', nc: 'Recebimento e expedição não são separados nem há procedimento que evite troca de produtos.', inf: ['gas_recebimento']},
          {id: 'conferencia', t: 'O procedimento de recebimento verifica condições de transporte e segregação, lote, validade e quantidade da nota, integridade da carga e limpeza do caminhão?', r: [A(60), A(61)],
            c: 'O recebimento verifica as condições de transporte, lote, validade, quantidade, integridade da carga e limpeza do veículo.', nc: 'O recebimento não verifica todas as condições exigidas.', inf: ['gas_recebimento']},
          {id: 'quarentena', t: 'Cargas fora dos requisitos ficam em quarentena até a avaliação da qualidade?', r: [P(61, 'unico')],
            c: 'As cargas fora dos requisitos ficam em quarentena até a avaliação da qualidade.', nc: 'As cargas fora dos requisitos não ficam em quarentena até a avaliação da qualidade.', inf: ['gas_recebimento']},
          {id: 'expedicao', t: 'Cada expedição é registrada, com dados do transportador, do cliente e dos gases?', r: [A(62)],
            c: 'Cada expedição é registrada com dados do transportador, do cliente e dos gases.', nc: 'As expedições não são registradas com dados do transportador, do cliente e dos gases.', inf: ['gas_rastreab']}
        ]}
      ]
    },
    {
      id: 'transporte', titulo: 'Transporte e fracionamento', curto: 'Transporte', icone: 'truck',
      itens: [
        {id: 'transporte', titulo: 'Transporte', curto: 'Transporte', vazio: 'O estabelecimento não informou a atividade Transportar (Identificação › Atividades).', perguntas: [
          {id: 'registro_transp', t: 'As operações de transporte, armazenagem temporária e recepção pelos veículos são registradas?', r: [I(65, 'i')], se: TEM('transportar'),
            c: 'As operações de transporte e armazenagem temporária são registradas.', nc: 'As operações de transporte e armazenagem temporária não são registradas.', inf: ['gas_transporte']},
          {id: 'segregacao_transp', t: 'No transporte, os gases medicinais ficam segregados dos não medicinais e nas condições do fabricante?', r: [I(65, 'ii')], se: TEM('transportar'),
            c: 'No transporte, os gases medicinais ficam segregados dos não medicinais e nas condições do fabricante.', nc: 'No transporte, os gases medicinais não ficam segregados dos não medicinais ou fora das condições do fabricante.', inf: ['gas_transporte']},
          {id: 'instrucoes', t: 'Há instruções de conservação durante o transporte e a armazenagem temporária?', r: [I(65, 'iii')], se: TEM('transportar'),
            c: 'Há instruções de conservação durante o transporte e a armazenagem temporária.', nc: 'Não há instruções de conservação durante o transporte e a armazenagem temporária.', inf: ['gas_transporte']},
          {id: 'veiculos', t: 'Há procedimentos de operação, manutenção, limpeza e segurança dos veículos e equipamentos de transporte?', r: [A(71)], se: TEM('transportar'),
            c: 'Há procedimentos de operação, manutenção, limpeza e segurança dos veículos.', nc: 'Não há procedimentos de operação, manutenção, limpeza e segurança dos veículos.', inf: ['gas_transporte']},
          {id: 'entrega_limpa', t: 'Cilindros e tanques são entregues limpos e compatíveis com o ambiente e o uso?', r: [A(68)], se: TEM('transportar'),
            c: 'Cilindros e tanques são entregues limpos e compatíveis com o uso.', nc: 'Cilindros ou tanques não são entregues limpos e compatíveis com o uso.', inf: ['gas_transporte']},
          {id: 'sinistro', t: 'Há procedimento para comunicar de imediato sinistro, roubo ou furto ao contratante e à autoridade sanitária?', r: [A(67)], se: TEM('transportar'),
            c: 'Há procedimento para comunicar de imediato sinistro, roubo ou furto.', nc: 'Não há procedimento para comunicar de imediato sinistro, roubo ou furto.', inf: ['gas_transporte']},
          {id: 'testes_descarga', t: 'Testes de qualidade nos pontos de descarga usam equipamentos calibrados, com dados disponíveis ao contratante?', r: [A(72), P(72, '2')], na: true, se: TEM('transportar'),
            c: 'Os testes nos pontos de descarga usam equipamentos calibrados, com dados disponíveis ao contratante.', nc: 'Os testes nos pontos de descarga não usam equipamentos calibrados ou os dados não estão disponíveis ao contratante.', inf: ['gas_transporte']}
        ]},
        {id: 'fracionamento', titulo: 'Abastecimento de tanques (fracionamento)', curto: 'Fracionamento', vazio: 'O estabelecimento não informou a atividade Fracionar (Identificação › Atividades).', perguntas: [
          {id: 'purga', t: 'O sistema de conexão (bombas e mangueiras) é purgado, com evidência, antes de abastecer tanques criogênicos?', r: [A(69)], se: TEM('fracionar'),
            c: 'O sistema de conexão é purgado, com evidência, antes do abastecimento de tanques.', nc: 'O sistema de conexão não é purgado com evidência antes do abastecimento de tanques.', inf: ['gas_fracionamento']},
          {id: 'pressao', t: 'As transferências são feitas só para tanques com pressão positiva e gás residual da mesma qualidade?', r: [A(70)], se: TEM('fracionar'),
            c: 'As transferências são feitas para tanques com pressão positiva e gás residual da mesma qualidade.', nc: 'Foram feitas transferências para tanques sem pressão positiva ou com gás residual de qualidade diversa.', inf: ['gas_fracionamento']},
          {id: 'retencao', t: 'Há válvula de retenção no circuito entre o tanque móvel e o estacionário?', r: [A(73), P(73, 'unico')], se: TEM('fracionar'),
            c: 'Há válvula de retenção no circuito de abastecimento.', nc: 'Não há válvula de retenção no circuito de abastecimento.', inf: ['gas_fracionamento']}
        ]}
      ]
    },
    {
      id: 'dispensacao', titulo: 'Dispensação e assistência domiciliar', curto: 'Dispensação', icone: 'water',
      itens: [
        {id: 'dispensacao', titulo: 'Dispensação ao usuário final', curto: 'Dispensação', vazio: 'O estabelecimento não informou a atividade Dispensar (Identificação › Atividades).', perguntas: [
          {id: 'prescricao', t: 'A dispensação segue a prescrição médica e os preceitos de controle sanitário de medicamentos?', r: [A(75), A(76)], se: TEM('dispensar'),
            c: 'A dispensação segue a prescrição médica e o controle sanitário de medicamentos.', nc: 'A dispensação não segue a prescrição médica ou o controle sanitário de medicamentos.', inf: ['gas_dispensacao']},
          {id: 'autorizacao', t: 'O enchimento ou a troca de cilindros e tanques domiciliares só ocorre com autorização do usuário ou do responsável pela assistência?', r: [A(74)], se: TEM('dispensar'),
            c: 'O enchimento ou a troca de cilindros e tanques domiciliares ocorre com autorização do usuário.', nc: 'O enchimento ou a troca de cilindros e tanques domiciliares ocorre sem autorização do usuário.', inf: ['gas_dispensacao']},
          {id: 'atencao', t: 'A atenção farmacêutica considera os aspectos de segurança do uso dos gases?', r: [A(77)], se: TEM('dispensar'),
            c: 'A atenção farmacêutica considera os aspectos de segurança do uso dos gases.', nc: 'A atenção farmacêutica não considera os aspectos de segurança do uso dos gases.', inf: ['gas_dispensacao']}
        ]}
      ]
    }
  ],
  infracoes: [
    {id: 'gas_lic', grupo: 'Regularidade e organização', texto: 'Exercer atividades com gases medicinais sem licença sanitária que as contemple.', r: [LM(90), LM(90) + '::paragrafo::1']},
    {id: 'gas_afe', grupo: 'Regularidade e organização', texto: 'Exercer atividades com gases medicinais sem AFE (e AE, quando aplicável) com a classe gases medicinais.', r: [LM(50), A(9)]},
    {id: 'gas_rt', grupo: 'Regularidade e organização', texto: 'Manter atividades com gases medicinais sem responsável técnico legalmente habilitado.', r: [LM(50), A(13)]},
    {id: 'gas_estrutura', grupo: 'Regularidade e organização', texto: 'Manter locais, instalações, veículos ou pessoal inadequados ou insuficientes para as operações com gases medicinais.', r: [LM(46), A(8)]},
    {id: 'gas_cadeia', grupo: 'Regularidade e organização', texto: 'Adquirir, receber ou expedir gases medicinais de ou para empresa sem licença ou autorização sanitária.', r: [LM(46), A(5), A(6), A(78)]},
    {id: 'gas_produto', grupo: 'Regularidade e organização', texto: 'Comercializar gases medicinais sem notificação ou registro, sem a rotulagem exigida ou em cilindros e válvulas fora das normas técnicas.', r: [LM(46), R870(4), R870(7), R870(56)]},
    {id: 'gas_envase', grupo: 'Regularidade e organização', texto: 'Envasar gases medicinais sem atender às boas práticas de fabricação.', r: [LM(46), P(2, '3'), A(63)]},
    {id: 'gas_pessoal', grupo: 'Pessoal', texto: 'Deixar de manter pessoal qualificado, treinado e com requisitos de saúde, higiene e conduta.', r: [LM(50), A(14), A(15), A(16), A(17)]},
    {id: 'gas_sgq', grupo: 'Gestão da qualidade', texto: 'Deixar de implantar e documentar o Sistema de Gestão da Qualidade com as funções exigidas.', r: [LM(46), A(18), A(19)]},
    {id: 'gas_documentos', grupo: 'Gestão da qualidade', texto: 'Deixar de manter documentação, POPs e registros íntegros e rastreáveis pelo prazo exigido.', r: [LM(50), A(20), A(22), A(24), A(25)]},
    {id: 'gas_autoinspecao', grupo: 'Gestão da qualidade', texto: 'Deixar de realizar e registrar autoinspeções independentes na periodicidade exigida.', r: [LM(46), A(42), A(43), A(44)]},
    {id: 'gas_qualificacao', grupo: 'Gestão da qualidade', texto: 'Utilizar equipamentos, processos, sistemas ou instrumentos sem qualificação, validação, calibração ou manutenção preventiva.', r: [LM(46), A(45), A(46), A(47)]},
    {id: 'gas_reclamacao', grupo: 'Reclamações e recolhimento', texto: 'Deixar de receber, registrar e investigar reclamações de qualidade e eventos adversos.', r: [LM(46), A(26), A(27), A(28)]},
    {id: 'gas_recolhimento', grupo: 'Reclamações e recolhimento', texto: 'Deixar de manter procedimento de recolhimento, mapas de distribuição, simulações ou controle de devoluções.', r: [LM(46), A(33), A(34), A(37)]},
    {id: 'gas_desvio', grupo: 'Reclamações e recolhimento', texto: 'Deixar de notificar e segregar gases suspeitos de falsificação, adulteração, roubo ou furto, ou cilindros de gás industrial usados como medicinal.', r: [LM(55), A(41), A(79)]},
    {id: 'gas_rastreab', grupo: 'Rastreabilidade', texto: 'Deixar de garantir a rastreabilidade de lotes e cilindros, os registros de expedição, as notas com lote ou a integridade dos lacres.', r: [LM(46), A(10), A(48), A(50), A(62)]},
    {id: 'gas_instalacoes', grupo: 'Instalações e armazenagem', texto: 'Manter áreas de armazenagem sem as condições, segregações, conservação e controle de pragas exigidos.', r: [LM(46), A(52), A(53), A(54), A(56)]},
    {id: 'gas_recebimento', grupo: 'Instalações e armazenagem', texto: 'Receber ou expedir gases medicinais sem as conferências, a separação de áreas ou a quarentena exigidas.', r: [LM(46), A(59), A(61)]},
    {id: 'gas_transporte', grupo: 'Transporte e dispensação', texto: 'Transportar gases medicinais sem registros, segregação, instruções de conservação ou procedimentos de veículos e comunicação de sinistros.', r: [LM(46), A(65), A(67), A(71)]},
    {id: 'gas_fracionamento', grupo: 'Transporte e dispensação', texto: 'Abastecer tanques de clientes sem purga do sistema, sem pressão positiva ou sem válvula de retenção.', r: [LM(46), A(69), A(70), A(73)]},
    {id: 'gas_dispensacao', grupo: 'Transporte e dispensação', texto: 'Dispensar gases medicinais sem prescrição, sem autorização do usuário para enchimento ou troca ou sem atenção farmacêutica.', r: [LM(50), A(74), A(75), A(77)]}
  ]
};
