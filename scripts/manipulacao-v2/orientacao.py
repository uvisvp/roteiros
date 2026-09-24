# Orientação por item e "situação encontrada" (itens em que a farmácia varia).
# SIT: lista de escolhas; cada opção = (chave, rótulo na tela, frase do relatório, orientação ao escolher).
# A opção "outro" é acrescentada automaticamente, com campo de texto.

ORIENT = {
 'i1.1': 'Confira licença sanitária, CRT, AFE e AE com os originais afixados ou apresentados. Use a busca por CNPJ para trazer AFE/AE e compare as atividades autorizadas com o que a farmácia de fato faz.',
 'i1.2': 'Marque o que a farmácia realmente exerce. A caracterização não esconde itens: ela só avisa, nos itens, o que não foi declarado. O que não existir no estabelecimento é marcado como Não se aplica no próprio item.',
 'i2.1': 'Peça os documentos em bloco no início da inspeção e confira aqui, sem sair do local. Registre número e validade em Anotações. O PGRSS, o cadastro de gerador e os comprovantes de coleta de resíduos também são conferidos aqui.',
 'i2.2': 'Marque cada POP como Apresentado, Pendente ou Não aplicável. Número, revisão e data ficam nas anotações de cada POP. POP que existe mas não é seguido na prática é registrado no item do ambiente onde foi observado.',
 'i2.3': 'Programa com levantamento de necessidades, registros assinados e avaliação de efetividade. Lista de presença não prova efetividade.',
 'i2.4': 'Confira as planilhas por grupo. Use Parcial quando a planilha existe mas está incompleta ou com lacunas no período. O que não se aplica à farmácia não gera irregularidade.',
 'i3.1': 'Observe os manipuladores em atividade: paramentação, adornos, alimentos e objetos pessoais nas salas. Organograma e atribuições são conferidos por documento.',
 'i3.2': 'Faça amostragem de pelo menos três funcionários da manipulação. No ASO, confira data, aptidão para a função e, para quem manipula substâncias do Anexo III, os exames específicos previstos no PCMSO.',
 'i4.1': 'Verificação física: como os resíduos são separados e para onde vão dentro da farmácia. Resíduos de hormônios, antimicrobianos e citostáticos são Grupo B (químicos), não lixo comum.',
 'i4.2': 'O DML pode ser sala própria ou local designado e identificado em outra área. O que importa é não misturar material de limpeza com matérias-primas, embalagens ou produtos.',
 'i4.3': 'Abrigo temporário é onde os coletores aguardam a coleta. Pode não existir em farmácias pequenas que entregam os resíduos diretamente à coleta; nesse caso marque Não se aplica.',
 'i5.1': 'A guarda das preparações prontas nem sempre fica na recepção: pode estar em área interna ou sala adjacente. Indique onde foi verificada e avalie as condições nesse local.',
 'i5.2': 'Só se a farmácia dispensa medicamentos industrializados. Aplicam-se as regras da RDC 44/2009 para esses produtos.',
 'i5.3': 'Só se a farmácia presta serviços farmacêuticos (aferições, injetáveis etc.). Os documentos da sala (declaração, registros) também são conferidos aqui.',
 'i5.4': 'Em galerias e shoppings o sanitário pode ser de uso comum do edifício. Avalie acesso, itens de higiene e ausência de comunicação direta com áreas de manipulação.',
 'i5.5': 'O vestiário é para guarda de pertences e troca de uniforme; não confunda com a sala de paramentação (item 6.1).',
 'i5.6': 'A copa deve ser separada dos demais ambientes. Abra a geladeira: medicamentos, insumos ou amostras junto a alimentos são irregularidade.',
 'i5.7': 'Área de descanso separada e sem guarda de materiais. Se não existir, marque Não se aplica.',
 'i5.8': 'Verifique acesso restrito, organização, afastamento de piso e parede, validade e situação das matérias-primas (quarentena, aprovado, reprovado). As substâncias controladas podem estar em armário no almoxarifado ou em sala própria; indique onde.',
 'i5.9': 'A lavagem pode ocorrer em área própria ou dentro do laboratório, desde que em horário distinto da manipulação e com procedimento escrito (Anexo I, 4.9).',
 'i6.1': 'A sala de paramentação dá acesso às áreas de pesagem e manipulação. Dois ambientes (barreira sujo/limpo) são preferenciais, não obrigatórios.',
 'i6.2': 'O controle de qualidade pode ser sala própria, área identificada ou ser centralizado em outro estabelecimento da mesma empresa (RT 5.5). Confira equipamentos, calibração e registros das análises.',
 'i6.3': 'A pesagem pode ser sala exclusiva, local específico dentro do laboratório ou central de pesagem que atende os laboratórios (Anexo I, 4.4 e 5.1.3). Em qualquer caso: exaustão e limpeza prévia das embalagens.',
 'i6.4': 'Laboratório de semissólidos e líquidos, totalmente segregado. A balança pode estar no laboratório ou em central de pesagem (Anexo I, 5.1.3). Confira a água purificada em uso (menos de 24 horas).',
 'i6.5': 'Laboratório de sólidos, totalmente segregado, com exaustão nas etapas com pós. A balança pode estar no laboratório ou em central de pesagem (Anexo I, 5.1.3).',
 'i7.1': 'Só se manipula substâncias de baixo índice terapêutico (Anexo II). Pontos críticos: dupla checagem na pesagem, perfil de dissolução, diluição geométrica e monitoramento.',
 'i7.2': 'Requisitos comuns às salas de hormônios, antibióticos e citostáticos (Anexo III).',
 'i7.3': 'A balança é obrigatória dentro da sala: a pesagem de hormônios deve ser feita na própria sala (Anexo III, 2.8). Central de pesagem não se aplica aqui.',
 'i7.4': 'A balança é obrigatória dentro da sala: a pesagem de antibióticos deve ser feita na própria sala (Anexo III, 2.8). Central de pesagem não se aplica aqui.',
 'i7.5': 'A balança é obrigatória dentro da sala: a pesagem de citostáticos deve ser feita na própria sala (Anexo III, 2.8). Central de pesagem não se aplica aqui.',
 'i7.6': 'Sala exclusiva, em área com baixa incidência de odores e radiação. Confira alcoômetro, balança exclusiva, inativação de vidraria e rastreabilidade das matrizes.',
 'i8.1': 'Peça os laudos de QP, QI, QO e QD e a data da última requalificação. Os registros de limpeza e troca de filtros são conferidos em cada laboratório.',
 'i9.1': 'Faça amostragem de receitas aviadas (comuns, controladas e antimicrobianos). Marque as irregularidades encontradas; cada marca vira frase no relatório.',
 'i9.2': 'Compare a ordem de manipulação com a prescrição: fármacos, concentrações, quantidades, cálculos registrados e aprovação do farmacêutico.',
 'i9.3': 'SNGPC, balanços, livros e confronto de estoque físico com o escriturado, por amostragem.',
 'i9.4': 'Carimbo nas receitas aviadas, repetição amparada na duração do tratamento e orientação ao paciente.',
 'i10.1': 'Escolha uma preparação sólida recente. Siga da ordem de manipulação até os lotes, certificados e rótulo.',
 'i10.2': 'Escolha uma preparação semissólida recente. Ensaios mínimos: descrição, aspecto, caracteres organolépticos, pH quando aplicável e peso.',
 'i10.3': 'Escolha uma preparação líquida recente. Ensaios mínimos: descrição, aspecto, caracteres organolépticos, pH quando aplicável e peso ou volume antes do envase.',
 'i10.4': 'Confira o laudo do fornecedor e os testes feitos pela farmácia na matéria-prima vegetal (Anexo I, 7.3.13).',
 'i10.5': 'Confira laudo do fornecedor e controle de qualidade da farmácia nas embalagens primárias.',
 'i10.6': 'Consolide aqui o que foi constatado nas formulações conferidas.',
 'i10.7': 'Verificação por amostragem de matérias-primas, com fornecedor, lote e certificado.',
 'i11.1': 'Mensal: pureza microbiológica de bases galênicas e água purificada. Confira as últimas três análises e as datas.',
 'i11.2': 'Bimestral: teor e uniformidade de conteúdo de fórmula com fármaco igual ou inferior a 25 mg, com prioridade abaixo de 5 mg.',
 'i11.3': 'Trimestral, em rodízio: uma análise completa de formulação de cada classe do Anexo III (hormônios, antibióticos, citostáticos e controlados).',
 'i11.4': 'Semestral: água potável, com todos os parâmetros exigidos.',
 'i11.5': 'Laboratório contratado, habilitação REBLAS e consolidação das irregularidades do monitoramento.',
 'i12.1': 'Venda remota inclui pedidos por telefone, WhatsApp, site e aplicativos. Se a farmácia não realiza, marque Não se aplica.',
 'i12.2': 'Como os manipulados são conservados e levados até o paciente, inclusive termossensíveis.',
}

OUTRO = ('outro', 'Outro local / arranjo', '', '')
SIT = {
 'i4.2': [('Onde fica o DML?', [
   ('sala', 'Sala própria', 'O DML é sala própria.', ''),
   ('local', 'Local designado em outra área', 'O material de limpeza fica em local designado e identificado, dentro de outra área.', 'Confira se o local é identificado e não mistura material de limpeza com matérias-primas, embalagens ou produtos.')])],
 'i5.1': [('Onde fica a guarda das preparações com controlados?', [
   ('disp', 'Na área de dispensação', 'As preparações com substâncias controladas ficam guardadas na área de dispensação.', ''),
   ('interna', 'Em área interna', 'As preparações com substâncias controladas ficam guardadas em área interna.', 'Avalie as condições de guarda no local indicado; registre em Anotações qual é a área.'),
   ('adjacente', 'Em sala adjacente', 'As preparações com substâncias controladas ficam guardadas em sala adjacente à dispensação.', 'Avalie as condições de guarda no local indicado.'),
   ('nao', 'Não há preparações com controlados', 'Não há preparações com substâncias controladas aguardando dispensação.', 'Marque Não se aplica na pergunta sobre armário com chave.')])],
 'i5.4': [('Onde ficam os sanitários?', [
   ('proprio', 'Dentro da farmácia', 'Os sanitários ficam dentro da farmácia.', ''),
   ('comum', 'Área comum do edifício (galeria, shopping)', 'Os sanitários são de uso comum do edifício.', 'Avalie acesso e itens de higiene no sanitário comum usado pelos funcionários.')])],
 'i5.6': [('Como é a área de refeição?', [
   ('copa', 'Copa separada', 'A farmácia dispõe de copa separada dos demais ambientes.', ''),
   ('compartilhada', 'Área de refeição em ambiente compartilhado', 'As refeições são feitas em ambiente compartilhado com outras atividades.', 'Registre com que ambiente é compartilhado; a separação é exigida (Anexo I, 4.17).')])],
 'i5.8': [('Onde ficam as substâncias sujeitas a controle especial?', [
   ('armario', 'Armário com chave no almoxarifado', 'As substâncias sujeitas a controle especial ficam em armário com chave no almoxarifado.', ''),
   ('sala', 'Sala própria com chave', 'As substâncias sujeitas a controle especial ficam em sala própria, com chave.', ''),
   ('lab', 'Armário no laboratório', 'As substâncias sujeitas a controle especial ficam em armário com chave no laboratório.', 'Avalie também no item do laboratório correspondente.'),
   ('nao', 'Não há substâncias controladas', 'Não há substâncias sujeitas a controle especial em estoque.', 'Marque Não se aplica na pergunta sobre armário com chave.')])],
 'i5.9': [('Onde é feita a lavagem de embalagens e utensílios?', [
   ('area', 'Área própria de lavagem', 'A lavagem de embalagens e utensílios é feita em área própria.', ''),
   ('lab', 'No laboratório, em horário distinto', 'A lavagem é feita dentro do laboratório, em horário distinto da manipulação.', 'Admitido pelo Anexo I, 4.9, desde que haja procedimento escrito e horário distinto. Confira o POP.')])],
 'i6.1': [('Como é a paramentação?', [
   ('dois', 'Sala com dois ambientes (sujo/limpo)', 'A sala de paramentação tem dois ambientes, com barreira sujo/limpo.', ''),
   ('um', 'Sala com um ambiente', 'A sala de paramentação tem um único ambiente.', 'Dois ambientes são preferenciais, não obrigatórios (Anexo I, 4.7). Confira ventilação, lavatório e delimitação de área suja/limpa.')])],
 'i6.2': [('Como é o controle de qualidade?', [
   ('sala', 'Sala própria', 'O controle de qualidade funciona em sala própria.', ''),
   ('area', 'Área identificada em outro ambiente', 'O controle de qualidade funciona em área identificada dentro de outro ambiente.', ''),
   ('central', 'Centralizado em outro estabelecimento da empresa', 'O controle de qualidade é centralizado em outro estabelecimento da mesma empresa.', 'Permitido pelo RT 5.5, sem prejuízo dos controles em processo nesta farmácia. Registre o endereço em Anotações; os equipamentos avaliados aqui são os do controle em processo.')])],
 'i6.3': [('Como é feita a pesagem?', [
   ('sala', 'Sala exclusiva de pesagem', 'A pesagem é feita em sala exclusiva.', ''),
   ('local', 'Local específico dentro do laboratório', 'A pesagem é feita em local específico dentro do laboratório de manipulação.', ''),
   ('central', 'Central de pesagem que atende os laboratórios', 'A pesagem é feita em central de pesagem que atende os laboratórios.', 'Admitida pelo Anexo I, 5.1.3. Avalie aqui as balanças da central; nos laboratórios de sólidos e semissólidos marque a balança como central.')])],
 'i6.4': [('Onde fica a balança usada neste laboratório?', [
   ('lab', 'No próprio laboratório', 'O laboratório dispõe de balança própria.', ''),
   ('central', 'Na central de pesagem (item 6.3)', 'As pesagens deste laboratório são feitas na central de pesagem.', 'Admitido pelo Anexo I, 5.1.3. A falta de balança aqui não é irregularidade; marque Não se aplica na pergunta sobre balança e avalie as balanças no item 6.3.')])],
 'i6.5': [('Onde fica a balança usada neste laboratório?', [
   ('lab', 'No próprio laboratório', 'O laboratório dispõe de balança própria.', ''),
   ('central', 'Na central de pesagem (item 6.3)', 'As pesagens deste laboratório são feitas na central de pesagem.', 'Admitido pelo Anexo I, 5.1.3. A falta de balança aqui não é irregularidade; marque Não se aplica na pergunta sobre balança e avalie as balanças no item 6.3.')])],
}
for cab, nome in (('i7.3', 'hormônios'), ('i7.4', 'antibióticos'), ('i7.5', 'citostáticos')):
    SIT[cab] = [('Como é a sala de ' + nome + '?', [
        ('ante', 'Sala dedicada com antecâmara', 'A manipulação de ' + nome + ' é feita em sala dedicada, com antecâmara.', ''),
        ('exc', 'Sala dedicada na exceção do item 2.7.3', 'A manipulação de ' + nome + ' é feita em sala dedicada, na exceção prevista no Anexo III, 2.7.3.', 'Confira se a solução adotada atende integralmente aos itens 2.7.3.1 e 2.7.3.2.')])]
SIT['i12.2'] = [('Como é feita a entrega ao paciente?', [
    ('balcao', 'Só retirada no balcão', 'As preparações são retiradas pelo paciente na farmácia.', ''),
    ('propria', 'Entrega com veículo ou entregador próprio', 'A entrega é feita por meio próprio da farmácia.', ''),
    ('terceiro', 'Entrega por transportadora ou aplicativo', 'A entrega é feita por transportadora ou aplicativo contratado.', 'Confira o contrato e as condições de transporte, inclusive dos termossensíveis.')])]

# Início da frase do relatório quando a opção escolhida é "Outro".
PRE = {
 'i4.2': 'O material de limpeza fica em', 'i5.1': 'As preparações com substâncias controladas ficam guardadas em',
 'i5.4': 'Os sanitários ficam em', 'i5.6': 'As refeições são feitas em', 'i5.8': 'As substâncias sujeitas a controle especial ficam em',
 'i5.9': 'A lavagem de embalagens e utensílios é feita em', 'i6.1': 'A paramentação é feita em', 'i6.2': 'O controle de qualidade funciona em',
 'i6.3': 'A pesagem é feita em', 'i6.4': 'As pesagens deste laboratório são feitas em', 'i6.5': 'As pesagens deste laboratório são feitas em',
 'i7.3': 'A manipulação de hormônios é feita em', 'i7.4': 'A manipulação de antibióticos é feita em', 'i7.5': 'A manipulação de citostáticos é feita em',
 'i12.2': 'A entrega ao paciente é feita por',
}
