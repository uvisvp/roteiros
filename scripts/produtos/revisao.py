"""Revisão do roteiro e do inventário de Produtos e correlatos.

Gera scripts/produtos/config-revisado.json a partir de config-original.json.
Uso: python3 scripts/produtos/revisao.py

Critérios da revisão (conferidos no texto das normas do banco normativo):
- Itens bons são mantidos com o mesmo id (respostas já salvas continuam válidas).
- Ids repetidos corrigidos (fp1–fp7 e dd1–dd5 apareciam em duas etapas e
  compartilhavam a resposta).
- Atacadista e Transportador passam a se apoiar no art. 28 da RDC 16/2014
  (requisitos técnicos de distribuidores, armazenadores e transportadores),
  antes ausente; o transporte ganha a declaração de veículos (Lei 13.725, art. 91).
- Citações corrigidas: responsável técnico (Lei 13.725, art. 93, não 92 — o 92
  é de assistência à saúde); art. 55 (notificação de eventos adversos) retirado
  de instalações, pragas e saúde do pessoal; RDC 665/2022 recebimento arts. 88
  a 91 (não 79 a 81, que são manutenção) e armazenamento arts. 107 a 111 (não
  80 a 83); validade expirada pela Lei 6.360/1976, art. 67, III; regularização
  pela Lei 6.360/1976, art. 12.
- Itens-resumo que repetiam os detalhados (p48_*) e a etapa de “requisitos
  básicos” (repetia outras etapas) saem; itens que eram instruções de uso
  (enquadramento por classe, escopo) viram texto de apoio.
"""
import json, os, copy, re

AQUI = os.path.dirname(os.path.abspath(__file__))
O = json.load(open(os.path.join(AQUI, 'config-original.json'), encoding='utf-8'))
OLD = {(s['id'], i['id']): i for s in O['sections'] for i in s['items']}

L = 'Lei Municipal nº 13.725/2004'
R16 = 'RDC Anvisa nº 16/2014'
R48 = 'RDC Anvisa nº 48/2013, Anexo II'
R665 = 'RDC Anvisa nº 665/2022'
L6360 = 'Lei Federal nº 6.360/1976'
FAB = {'types': ['fabricante'], 'flagsAll': ['cls_cosm']}
DIST = {'types': ['distribuidor']}
DISP = {'types': ['distribuidor'], 'flagsAll': ['cls_disp']}
TRANSP = {'types': ['transportadora']}


def I(id, text, legal, critical=False, when=None):
    x = {'id': id, 'text': text, 'legal': legal}
    if critical: x['critical'] = True
    if when: x['when'] = when
    return x


def old(sec, id, novo_id=None, **mud):
    x = copy.deepcopy(OLD[(sec, id)])
    if novo_id: x['id'] = novo_id
    x.update(mud)
    return x


def S(id, title, description, items, when=None):
    s = {'id': id, 'title': title, 'description': description, 'items': items}
    if when: s['when'] = when
    return s


sections = []

# ------------------------------------------------------------------ comum
sections.append(S('lic', 'Licença, AFE/AE e responsável técnico',
  'Confirme o enquadramento antes de percorrer o estabelecimento.', [
  old('lic', 'l1'),
  I('l9', 'Alterações de atividades, instalações ou equipamentos que repercutem na qualidade e na segurança foram comunicadas à vigilância sanitária.',
    f'{L}, art. 90, § 1º.'),
  I('l3', 'AFE vigente e compatível com as atividades e as classes de produtos efetivamente exercidas (empresa, pela matriz, para cosméticos e saneantes; por estabelecimento, para produtos para saúde).',
    f'{L6360}, art. 2º; {R16}, art. 3º, caput e parágrafo único, e art. 10, §§ 1º e 2º.', True),
  old('lic', 'l4'),
  I('l5', 'AE concedida para as substâncias sujeitas a controle especial movimentadas.',
    f'{R16}, art. 4º.', True, {'flagsAll': ['ae344']}),
  I('l6', 'Responsável técnico legalmente habilitado, com registro no conselho de classe e presente durante o funcionamento; no fabricante, substituto designado para as ausências.',
    f'{L}, art. 93; {R16}, art. 27, inciso I, alínea e (fabricante) ou art. 28, inciso I, alínea e (demais atividades); no fabricante, {R48}, item 11.9.', True),
  I('l7', 'Mudança de responsável técnico ou legal peticionada à Anvisa em até 30 dias; demais alterações de AFE/AE (atividades, classes, endereço, razão social) peticionadas.',
    f'{R16}, art. 11, § 1º, e art. 22.'),
  I('l8', 'Serviços terceirizados contratados somente com empresas autorizadas e licenciadas, com contrato ou documento equivalente.',
    f'{R16}, art. 27, inciso I, alínea f (fabricante) ou art. 28, inciso I, alínea d (demais atividades).', False, {'flagsAll': ['terc']}),
]))

sections.append(S('reg', 'Regularidade dos produtos',
  'Confira por amostragem no estoque. A consulta de regularização fica no fim do roteiro.', [
  I('r1', 'Dispositivos médicos (não IVD) regularizados conforme a classe de risco: classes I e II por notificação; classes III e IV por registro.',
    f'{L6360}, art. 12; RDC Anvisa nº 751/2022, arts. 5º a 7º.', True, {'flagsAll': ['cls_disp']}),
  I('r1ivd', 'Dispositivos para diagnóstico in vitro (IVD) regularizados conforme a classe de risco (notificação ou registro).',
    f'{L6360}, art. 12; RDC Anvisa nº 830/2023.', True, {'flagsAll': ['cls_disp']}),
  I('r2', 'Cosméticos, produtos de higiene e perfumes regularizados: registro para os grupos do art. 34 (protetor solar, repelente, alisante, bronzeador, gel antisséptico etc.); comunicação prévia para os demais.',
    f'{L6360}, art. 12; RDC Anvisa nº 907/2024, arts. 34 e 35.', True, {'flagsAll': ['cls_cosm']}),
  I('r3', 'Saneantes regularizados conforme o risco: risco 1 por notificação; risco 2 (antimicrobianos, desinfestantes, corrosivos, pH extremo etc.) por registro.',
    f'{L6360}, art. 12; RDC Anvisa nº 989/2025, arts. 8º e 12.', True, {'flagsAll': ['cls_san']}),
  I('r4', 'Produtos dentro do prazo de validade, com embalagem íntegra e identificação legível.',
    f'{L}, art. 46; {L6360}, art. 67, inciso III.', True),
  I('r5', 'Não há produto sem procedência comprovada, sem rotulagem ou de fornecedor não autorizado.',
    f'{L6360}, art. 2º; {L}, art. 46.', True),
]))

# ------------------------------------------------------------ fabricante
F = lambda s, i, **k: old(s, i, **k)
sections += [
 S('f_gq', 'Gestão e garantia da qualidade', 'Documentos do sistema da qualidade, validações e estabilidade.',
   [F('f_gq', x) for x in ['fgq1', 'fgq2', 'fgq3', 'fgq4', 'fgq5', 'fgq6', 'fgq7', 'fgq8']], FAB),
 S('f_pes', 'Pessoal e responsabilidades', 'Organograma, treinamento e independência entre produção e controle da qualidade.',
   [F('f_pes', 'fp1'), F('f_pes', 'fp2'), F('f_pes', 'fp3'), F('f_pes', 'fp4'), F('f_pes', 'fp5'), F('f_pes', 'fp7')], FAB),
 S('f_saude', 'Saúde, higiene, vestuário e conduta', 'Observe durante a visita às áreas.',
   [F('f_saude', x) for x in ['fs1', 'fs2', 'fs3', 'fs4', 'fs5', 'fs6', 'fs7']], FAB),
 S('f_inst', 'Instalações e áreas auxiliares', 'Percorra a planta: conservação, pragas, ralos, áreas de apoio.',
   [F('f_inst', x) for x in ['fi1', 'fi2', 'fi3', 'fi4', 'fi5', 'fi6', 'fi7', 'fi8']] +
   [F('f_aux', x) for x in ['fx11', 'fx12', 'fx13', 'fx14']], FAB),
 S('f_agua', 'Sistema de água', 'Especificação, monitoramento e manutenção.',
   [F('f_agua', x) for x in ['fw1', 'fw2', 'fw3', 'fw4', 'fw5']], FAB),
 S('f_arm', 'Recebimento, armazenamento e amostragem', 'Almoxarifado, quarentena, identificação e plano de amostragem.',
   [F('f_arm', x) for x in ['fm1', 'fm2', 'fm3', 'fm4', 'fm5', 'fm6', 'fm7', 'fm8', 'fm9', 'fm10', 'fm11', 'fm12', 'fm13']] +
   [F('f_amo', x) for x in ['fn1', 'fn2', 'fn3', 'fn4', 'fn5']], FAB),
 S('f_prod', 'Produção, equipamentos e envase', 'Pesagem, equipamentos, ordem de fabricação, controles em processo e envase.',
   [F('f_prod', 'fp%d' % n, novo_id='fpr%d' % n) for n in range(1, 11)], FAB),
 S('f_cq', 'Controle da qualidade e amostras de retenção', 'Laboratório, especificações, liberação e retenção.',
   [F('f_cq', x) for x in ['fcq1', 'fcq2', 'fcq3', 'fcq4', 'fcq5', 'fcq6']] + [F('f_ret', 'frt1')], FAB),
 S('f_doc', 'Documentação e registros', 'Fórmula padrão, registros de lote e POPs.',
   [F('f_doc', x) for x in ['fo1', 'fo2', 'fo3', 'fo4', 'fo5', 'fo6', 'fo7']], FAB),
 S('f_rec', 'Reclamações, devoluções e cosmetovigilância', 'Fluxo pós-mercado do fabricante.',
   [F('f_rec', x) for x in ['fr1', 'fr2', 'fr3', 'fr4', 'fr5']] + [F('f_dev', x) for x in ['fd1', 'fd2', 'fd3', 'fd4']], FAB),
 S('f_recolhe', 'Recolhimento de produtos', 'Sistema, responsável, comunicação e reconciliação.',
   [F('f_recolhe', x) for x in ['fx1', 'fx2', 'fx3', 'fx4', 'fx5', 'fx6']], FAB),
 S('f_auto', 'Autoinspeção', 'Programa anual, relatório e plano de ação.',
   [F('f_auto', x) for x in ['fa1', 'fa2', 'fa3', 'fa4', 'fa5']], FAB),
]

# ---------------------------------------------- atacadista / distribuidor
A28 = f'{R16}, art. 28'
sections += [
 S('d_rec', 'Recebimento, fornecedores e clientes', 'Requisitos técnicos do distribuidor (RDC 16/2014, art. 28), válidos para todas as classes.', [
   I('df1', 'Há mecanismo que assegure que fornecedores e clientes estejam regularizados (AFE e licença sanitária), com registros da verificação.',
     f'{A28}, inciso II, alínea l; {L6360}, art. 2º.', True),
   I('df5', 'Áreas de recebimento e expedição adequadas e protegidas contra variações climáticas.',
     f'{A28}, inciso II, alínea k.'),
   I('df2', 'No recebimento são conferidos identificação do produto, lote, validade, integridade da embalagem e condições de transporte, conforme procedimento escrito.',
     f'{A28}, inciso II, alínea d.'),
   I('df4', 'Dispositivos/IVD: conformidade verificada no recebimento; produto não é liberado ao estoque antes da verificação.',
     f'{R665}, arts. 88 a 91.', False, {'flagsAll': ['cls_disp']}),
 ], DIST),
 S('d_arm', 'Armazenamento e controle de estoque', 'Condições de conservação, segregação e inventário.', [
   I('ds1', 'Instalações, equipamentos e instrumentos adequados às atividades, com qualificação e calibração quando exigidas (termômetros, câmaras, climatização).',
     f'{A28}, inciso II, alínea a.'),
   I('ds3', 'Condições de higiene, armazenamento e operação adequadas ao produto (temperatura, umidade e luz conforme a rotulagem), sem risco de contaminação ou alteração.',
     f'{A28}, inciso II, alínea c.', True),
   I('ds4', 'Produtos que exigem controle de temperatura: registros contínuos demonstram a faixa especificada durante o armazenamento.',
     f'{A28}, inciso II, alíneas a e c.', True, {'flagsAll': ['temp']}),
   I('ds2', 'Produtos vencidos, avariados, devolvidos, recolhidos ou interditados identificados e segregados, sem possibilidade de expedição.',
     f'{A28}, inciso II, alínea d.', True),
   I('ds6', 'Sistema de controle de estoque que permite emitir inventários periódicos.',
     f'{A28}, inciso II, alínea g.'),
   I('ds7', 'Produtos sujeitos a controle especial em área separada, identificada e de acesso restrito.',
     f'{A28}, inciso II, alínea f.', True, {'flagsAll': ['ae344']}),
   I('ds5', 'Dispositivos/IVD: procedimentos evitam trocas, danos e deterioração; somente produtos aprovados são distribuídos; o mais próximo do vencimento sai primeiro.',
     f'{R665}, arts. 107 a 111.', True, {'flagsAll': ['cls_disp']}),
 ], DIST),
 S('d_qual', 'Qualidade, desvios, rastreabilidade e recolhimento', 'Sistema da qualidade, investigação de desvios e capacidade de localizar produtos.', [
   I('dq11', 'Sistema da qualidade estabelecido, com procedimentos operacionais padrão aprovados para recepção, identificação, estoque, armazenamento e produtos devolvidos ou recolhidos.',
     f'{A28}, inciso II, alíneas d e i.'),
   I('dq12', 'Sistema formal de investigação de desvios de qualidade, com causas identificadas e medidas preventivas e corretivas registradas.',
     f'{A28}, inciso II, alínea h.'),
   I('dq13', 'Programa de autoinspeção com abrangência, frequência, responsáveis e ações decorrentes das não conformidades.',
     f'{A28}, inciso II, alínea e.'),
   I('dr1', 'Os registros permitem identificar entrada, fornecedor, lote, quantidade e destino dos produtos distribuídos.',
     f'{L}, art. 46.'),
   I('dr3', 'A empresa consegue localizar produtos distribuídos e executar bloqueio ou recolhimento determinado pelo titular ou pela autoridade sanitária.',
     f'{L}, art. 46.', True),
   I('dd3', 'Reclamações e eventos adversos recebidos são registrados, encaminhados ao titular da regularização e, quando houver dano à saúde, notificados à vigilância.',
     f'{L}, art. 55.'),
 ], DIST),
 S('d_pes', 'Pessoal, manual e resíduos', 'Capacitação, manual de boas práticas e gerenciamento de resíduos.', [
   I('dd2', 'Pessoal qualificado e capacitado para as atividades, com registros de treinamento.',
     f'{A28}, inciso II, alínea b.'),
   I('dd6', 'Manual de Boas Práticas de Distribuição e Armazenagem disponível e compatível com a rotina.',
     f'{A28}, inciso I, alínea f.', False, {'flagsAll': ['cls_disp']}),
   I('dd7', 'Plano de gerenciamento de resíduos implantado (produtos vencidos, avariados e embalagens).',
     f'{A28}, inciso II, alínea j; {L}, art. 31.'),
 ], DIST),
]

# dispositivos/IVD — etapas específicas (RDC 665/2022, recorte do art. 2º, § 2º)
def renum(sec, pares):
    return [old(sec, a, novo_id=b) if b else old(sec, a) for a, b in pares]
sections += [
 S('d_sq', 'Sistema da qualidade — dispositivos/IVD', 'RDC 665/2022, Capítulo II (recorte do distribuidor, art. 2º, § 2º).',
   [old('d_sq', 'dq%d' % n) for n in range(1, 11)], DISP),
 S('d_doc', 'Documentos e registros — dispositivos/IVD', 'Controle de documentos e guarda de registros.',
   renum('d_doc', [('dd1', 'ddc1'), ('dd2', 'ddc2'), ('dd3', 'ddc3'), ('dd4', 'ddc4'), ('dd5', 'ddc5')]), DISP),
 S('d_inst', 'Instalações, higiene e pessoal — dispositivos/IVD', 'Arts. 67 a 77.',
   [old('d_inst', 'di%d' % n) for n in range(1, 10)], DISP),
 S('d_man', 'Manuseio, armazenamento e rastreabilidade — dispositivos/IVD', 'Capítulo VI (exceto art. 119).',
   [old('d_arm', x) for x in ['da1', 'da2', 'da3', 'da4', 'da5', 'da6', 'da7', 'da8', 'da9', 'da12']], DISP),
 S('d_capa', 'Reclamações, CAPA e ações de campo — dispositivos/IVD', 'Capítulo VII.',
   [old('d_capa', x) for x in ['dc1', 'dc2', 'dc3', 'dc4', 'dc5', 'dc6']], DISP),
 S('d_at', 'Instalação e assistência técnica — dispositivos/IVD', 'Capítulo VIII, quando a empresa instala ou presta assistência.',
   [old('d_at', x) for x in ['dt1', 'dt2', 'dt3']], DISP),
]

# ---------------------------------------------------------- transportador
sections += [
 S('t_veic', 'Veículos e proteção da carga', 'Requisitos do transportador (RDC 16/2014, art. 28) e cadastro municipal dos veículos.', [
   I('tv2', 'Cada veículo usado no transporte de produtos de interesse da saúde foi declarado à vigilância sanitária, com equipamentos e recursos humanos.',
     f'{L}, art. 91.', True),
   I('tv1', 'Relação atualizada dos veículos próprios e de terceiros, com os equipamentos necessários às condições de transporte de cada produto.',
     f'{A28}, inciso II, alínea m.', True),
   I('tv4', 'Compartimento de carga limpo, conservado e que protege contra intempéries, poeira e animais, inclusive na carga e descarga.',
     f'{A28}, inciso II, alínea c; {L}, art. 46.', True),
   I('tv5', 'Cargas incompatíveis segregadas; produto perigoso transportado segundo o regulamento próprio, sem contato com produto sujeito à vigilância sanitária.',
     f'{A28}, inciso II, alínea c; Resolução ANTT nº 5.998/2022, quando houver produto perigoso.', True),
   I('tv7', 'Terceirização do transporte somente com empresas autorizadas e licenciadas, com responsabilidades sobre a carga definidas em contrato.',
     f'{A28}, inciso I, alínea d.', False, {'flagsAll': ['terc']}),
 ], TRANSP),
 S('t_temp', 'Temperatura e instrumentos', 'Somente quando há produto com exigência de temperatura.', [
   I('tt1', 'Equipamento de refrigeração ou isolamento térmico dimensionado e em funcionamento para a carga transportada.',
     f'{A28}, inciso II, alínea m.', True, {'flagsAll': ['temp']}),
   I('tt2', 'Registradores ou termômetros calibrados, com registro da temperatura durante todo o trajeto.',
     f'{A28}, inciso II, alínea a.', True, {'flagsAll': ['temp']}),
   I('tt3', 'Qualificação térmica do compartimento ou da embalagem realizada, com protocolo e resultados.',
     f'{A28}, inciso II, alínea a.', False, {'flagsAll': ['temp']}),
 ], TRANSP),
 S('t_rast', 'Rastreabilidade, ocorrências e pessoal', 'Registros de coleta e entrega, desvios, treinamento e autoinspeção.', [
   I('tr1', 'Registro de coleta e entrega com remetente, destinatário, identificação e quantidade da carga, datas e documento fiscal.',
     f'{L}, art. 46.', True),
   I('tr3', 'Devoluções, avarias, extravios, roubos e desvios de temperatura investigados e registrados, com segregação do produto afetado.',
     f'{A28}, inciso II, alínea h.', True),
   I('tr6', 'Procedimentos operacionais padrão para recebimento, identificação, guarda temporária e entrega da carga.',
     f'{A28}, inciso II, alínea d.'),
   I('tr5', 'Motoristas e ajudantes capacitados para o manuseio e a conservação da carga, com registros.',
     f'{A28}, inciso II, alínea b.'),
   I('tr7', 'Programa de autoinspeção com abrangência, frequência, responsáveis e ações decorrentes.',
     f'{A28}, inciso II, alínea e.'),
 ], TRANSP),
]

# ------------------------------------------------------------- inventário
G1, G2, G3, G4, G5, G6 = ('1. Licença, AFE e responsável técnico', '2. Regularidade e rotulagem dos produtos',
  '3. Boas práticas de fabricação', '4. Armazenamento, distribuição e transporte',
  '5. Qualidade, reclamações e recolhimento', '6. Pessoal, higiene e resíduos')
P = 'ATENÇÃO PRIORITÁRIA — '
ANY_FD = {'any': [FAB, DISP]}
NAO_FAB = {'types': ['distribuidor', 'transportadora']}
inf = [
 (G1, 'p01', P + 'Por iniciar ou manter a atividade sem licença sanitária municipal, ou sem requerer sua renovação no prazo.', f'{L}, art. 90.'),
 (G1, 'p02', 'Por exercer atividade diversa daquela licenciada, ou em endereço diverso do constante da licença, sem comunicação à autoridade sanitária.', f'{L}, art. 90, caput e § 1º.'),
 (G1, 'p03', P + 'Por realizar atividade sujeita à Autorização de Funcionamento sem AFE vigente na Anvisa.', f'{L6360}, art. 2º, c/c {R16}, art. 3º.'),
 (G1, 'p04', 'Por manter AFE incompatível com a classe de produto ou com a atividade efetivamente realizada.', f'{R16}, arts. 3º e 22.'),
 (G1, 'p05', P + 'Por movimentar substâncias sujeitas a controle especial sem Autorização Especial.', f'{R16}, art. 4º, c/c Portaria SVS/MS nº 344/1998.', {'flagsAll': ['ae344']}),
 (G1, 'p06', 'Por funcionar sem responsável técnico legalmente habilitado presente, ou, no fabricante, sem substituto designado.', f'{L}, art. 93, c/c {R16}, art. 27 ou 28, inciso I, alínea e; no fabricante, {R48}, item 11.9.'),
 (G1, 'p07', 'Por deixar de peticionar à Anvisa a alteração de responsável técnico ou legal no prazo, ou demais alterações de AFE/AE.', f'{R16}, art. 11, § 1º, e art. 22.'),
 (G1, 'p48', 'Por contratar serviço terceirizado com empresa não autorizada ou não licenciada.', f'{R16}, art. 27, inciso I, alínea f, ou art. 28, inciso I, alínea d.', {'flagsAll': ['terc']}),
 (G2, 'p09', P + 'Por manter, expor ou distribuir dispositivo médico ou produto para diagnóstico in vitro sem notificação ou registro na Anvisa.', f'{L6360}, art. 12, c/c RDC Anvisa nº 751/2022, arts. 6º e 7º, ou RDC Anvisa nº 830/2023.', {'flagsAll': ['cls_disp']}),
 (G2, 'p10', P + 'Por manter, expor ou distribuir cosmético, produto de higiene ou perfume sem regularização na Anvisa.', f'{L6360}, art. 12, c/c RDC Anvisa nº 907/2024, arts. 34 e 35.', {'flagsAll': ['cls_cosm']}),
 (G2, 'p11', P + 'Por manter, expor ou distribuir saneante sem regularização na Anvisa.', f'{L6360}, art. 12, c/c RDC Anvisa nº 989/2025, arts. 8º e 12.', {'flagsAll': ['cls_san']}),
 (G2, 'p12', P + 'Por manter, expor ou distribuir produto com prazo de validade expirado.', f'{L6360}, art. 67, inciso III; {L}, art. 46.'),
 (G2, 'p13', 'Por manter ou distribuir produto com embalagem violada, danificada ou com identificação ilegível.', f'{L}, art. 46.'),
 (G2, 'p14', P + 'Por manter produto sem procedência comprovada, sem rotulagem ou recebido de fornecedor não autorizado.', f'{L6360}, art. 2º; {L}, art. 46.'),
 (G2, 'p15', 'Por manter ou distribuir produto com rotulagem ou instruções de uso em desacordo com a norma da classe.', f'{L}, art. 49.'),
 (G3, 'p16', 'Por fabricar sem sistema de gestão da qualidade estabelecido, documentado e implementado.', f'{L}, art. 46, c/c {R48}, item 3.2.2.', FAB),
 (G3, 'p17', P + 'Por liberar produto ao consumo antes de concluídas as etapas de controle e liberação.', f'{L}, art. 46, c/c {R48}, item 3.3.4.', FAB),
 (G3, 'p18', 'Por deixar de manter fórmula padrão ou registro de produção por lote, impedindo a rastreabilidade.', f'{L}, art. 46, c/c {R48}, itens 10.9 e 10.10.', FAB),
 (G3, 'p19', P + 'Por manter instalações em condição que permita contaminação cruzada, acúmulo de sujidade ou acesso de animais.', f'{L}, art. 46, c/c {R48}, itens 12.2, 12.4 e 12.8.', FAB),
 (G3, 'p20', P + 'Por utilizar água sem especificação definida ou sem monitoramento da qualidade nos pontos críticos.', f'{L}, art. 46, c/c {R48}, itens 13.2 e 13.6.', FAB),
 (G3, 'p21', P + 'Por não dispor de laboratório de controle da qualidade próprio e independente da produção, nem de terceirização regular.', f'{L}, art. 46, c/c {R48}, item 18.1.', FAB),
 (G3, 'p22', 'Por deixar de reter amostras de produtos acabados na quantidade e pelo prazo exigidos.', f'{L}, art. 46, c/c {R48}, item 19.', FAB),
 (G3, 'p23', P + 'Por manter pessoa com enfermidade ou lesão exposta manuseando matéria-prima, embalagem ou produto.', f'{L}, art. 46, c/c {R48}, item 5.4.', FAB),
 (G3, 'p24', 'Por não realizar autoinspeção anual, ou por não implementar as ações corretivas do relatório.', f'{L}, art. 46, c/c {R48}, itens 9.4 e 9.6.', FAB),
 (G3, 'p25', 'Por manter os responsáveis pela produção e pelo controle de qualidade sem independência entre si.', f'{L}, art. 46, c/c {R48}, item 11.8.', FAB),
 (G3, 'p26', 'Por deixar de calibrar balanças e instrumentos de medição, ou de manter os respectivos registros.', f'{L}, art. 46, c/c {R48}, itens 15.7 e 17.17.4.', FAB),
 (G3, 'p27', 'Por reprocessar produto sem procedimento autorizado, sem avaliação de risco ou sem registro.', f'{L}, art. 46, c/c {R48}, item 17.19.9.', FAB),
 (G4, 'p28', P + 'Por armazenar produto em condição que não preserve sua integridade, ou sem o controle de temperatura e umidade exigido.', f'{L}, art. 46, c/c {R48}, item 15.2 (fabricante), {A28}, inciso II, alínea c (distribuidor), e {R665}, art. 111 (dispositivos/IVD).', {'types': ['fabricante', 'distribuidor']}),
 (G4, 'p29', P + 'Por deixar de segregar e identificar produtos reprovados, vencidos, avariados, devolvidos, recolhidos ou interditados.', f'{L}, art. 46, c/c {R48}, item 15.9 (fabricante), {A28}, inciso II, alínea d (distribuidor), e {R665}, arts. 115 a 118 (dispositivos/IVD).', {'types': ['fabricante', 'distribuidor']}),
 (G4, 'p30', P + 'Por distribuir dispositivo/IVD não aprovado, com validade expirada ou sem verificação de conformidade.', f'{R665}, arts. 108 e 109.', DISP),
 (G4, 'p31', 'Por não manter registros de distribuição de dispositivos/IVD que identifiquem destinatário, quantidade, data e lote ou série.', f'{R665}, arts. 112 e 114.', DISP),
 (G4, 'p32', 'Por armazenar produto diretamente sobre o piso, encostado às paredes ou sem empilhamento seguro.', f'{L}, art. 46, c/c {R48}, itens 15.16 e 15.25.', FAB),
 (G4, 'p49', P + 'Por não dispor de mecanismo que assegure a regularidade sanitária de fornecedores e clientes.', f'{A28}, inciso II, alínea l.', DIST),
 (G4, 'p50', 'Por não dispor de procedimentos operacionais padrão de recepção, identificação, estoque e armazenamento de produtos acabados, devolvidos ou recolhidos.', f'{A28}, inciso II, alínea d.', NAO_FAB),
 (G4, 'p51', 'Por não dispor de sistema de controle de estoque que permita inventários periódicos.', f'{A28}, inciso II, alínea g.', DIST),
 (G4, 'p52', P + 'Por armazenar produto sujeito a controle especial fora de área separada, identificada e de acesso restrito.', f'{A28}, inciso II, alínea f.', {'types': ['distribuidor'], 'flagsAll': ['ae344']}),
 (G4, 'p53', P + 'Por transportar produto de interesse da saúde em veículo não declarado à autoridade sanitária.', f'{L}, art. 91.', TRANSP),
 (G4, 'p33', P + 'Por transportar produto em veículo sujo, deteriorado ou que não proteja a carga contra intempéries, poeira e animais.', f'{L}, art. 46, c/c {A28}, inciso II, alíneas c e m.', TRANSP),
 (G4, 'p34', 'Por transportar produto sujeito à vigilância sanitária junto com carga incompatível ou perigosa, sem segregação.', f'{L}, art. 46, c/c {A28}, inciso II, alínea c, e Resolução ANTT nº 5.998/2022.', TRANSP),
 (G4, 'p35', P + 'Por transportar produto que exige temperatura controlada sem equipamento em funcionamento ou sem registro de temperatura.', f'{A28}, inciso II, alíneas a e m.', {'types': ['transportadora'], 'flagsAll': ['temp']}),
 (G5, 'p36', P + 'Por não dispor de sistema capaz de recolher produto do mercado, ou por não executar o recolhimento determinado.', f'{L}, art. 46, c/c {R48}, item 7.1 (fabricante) e {R665}, art. 120, inciso VIII (dispositivos/IVD).', ANY_FD),
 (G5, 'p37', 'Por deixar de comunicar à autoridade sanitária a decisão de recolhimento de produto.', f'{L}, art. 46, c/c {R48}, item 7.4.', FAB),
 (G5, 'p38', 'Por não registrar, investigar ou arquivar reclamações sobre desvio de qualidade.', f'{L}, art. 46, c/c {R48}, item 6.1, ou {R665}, art. 121.', ANY_FD),
 (G5, 'p54', 'Por não dispor de sistema formal de investigação de desvios de qualidade, com medidas preventivas e corretivas.', f'{A28}, inciso II, alínea h.', NAO_FAB),
 (G5, 'p55', 'Por não dispor de programa de autoinspeção com abrangência, frequência e responsáveis definidos.', f'{A28}, inciso II, alínea e.', NAO_FAB),
 (G5, 'p39', P + 'Por deixar de examinar imediatamente reclamação relativa a óbito, lesão ou ameaça à saúde pública.', f'{L}, art. 55, c/c {R665}, art. 121, § 2º.', DISP),
 (G5, 'p40', 'Por deixar de registrar, avaliar ou encaminhar ao detentor da regularização reclamação, queixa técnica ou evento adverso sobre dispositivo médico/IVD.', f'{L}, art. 55; {R665}, art. 121, incisos I a V e § 1º.', DISP),
 (G5, 'p41', 'Por não manter sistema de cosmetovigilância (fabricante) ou por não encaminhar ao titular e à vigilância os eventos adversos recebidos (distribuidor).', f'{L}, art. 55, c/c {R48}, item 6.7, e RDC Anvisa nº 894/2024, art. 6º.', {'any': [FAB, {'types': ['distribuidor'], 'flagsAll': ['cls_cosm']}]}),
 (G5, 'p42', 'Por não manter documentos e registros de dispositivos/IVD pelo prazo exigido.', f'{L}, art. 46, c/c {R665}, art. 37.', DISP),
 (G6, 'p43', 'Por manter pessoal sem capacitação documentada para as atividades desempenhadas.', f'{L}, art. 46, c/c {R48}, itens 11.3 e 11.6 (fabricante), {A28}, inciso II, alínea b (distribuidor e transportador), ou {R665}, art. 15 (dispositivos/IVD).'),
 (G6, 'p44', P + 'Por não dispor de programa de controle de pragas, ou por aplicar agentes químicos que afetem a qualidade do produto.', f'{L}, art. 46, c/c {R48}, itens 12.8 e 12.10 (fabricante), ou {R665}, art. 74 (dispositivos/IVD).', ANY_FD),
 (G6, 'p45', 'Por não dispor de plano de gerenciamento de resíduos ou dar destinação irregular a resíduos, efluentes ou embalagens.', f'{L}, art. 31, c/c {R48}, item 17.21 (fabricante), {A28}, inciso II, alínea j (distribuidor), ou {R665}, art. 75 (dispositivos/IVD).', {'types': ['fabricante', 'distribuidor']}),
 (G6, 'p46', 'Por não fornecer equipamento de proteção individual compatível com a atividade.', f'{L}, art. 46, c/c {R48}, item 5.8, ou {R665}, art. 77.', ANY_FD),
 (G6, 'p47', 'Por permitir consumo de alimentos ou bebidas em área de produção, armazenamento ou controle de qualidade.', f'{L}, art. 46, c/c {R48}, item 5.9, ou {R665}, art. 72.', ANY_FD),
]
infractions = []
for x in inf:
    g, id, t, l = x[:4]
    d = {'id': id, 'group': g, 'text': t, 'legal': l}
    if len(x) > 4 and x[4]: d['when'] = x[4]
    infractions.append(d)
infractions += [i for i in O['infractions'] if i['id'] in ('aut100', 'aut109')]

# ------------------------------------------------------------------ normas
norms = [n for n in O['norms']]
nomes = [n['title'] for n in norms]
extra = [
 {'title': 'Lei Federal nº 6.360/1976.', 'description': 'Vigilância sanitária de produtos: empresa autorizada e estabelecimento licenciado (art. 2º), regularização antes da venda (art. 12) e infrações como a venda de produto vencido (art. 67, III).',
  'url': 'https://www.planalto.gov.br/ccivil_03/leis/l6360.htm'},
 {'title': 'Resolução ANTT nº 5.998/2022.', 'description': 'Transporte rodoviário de produtos perigosos — aplicada quando a carga inclui produto classificado como perigoso.',
  'url': 'https://anttlegis.antt.gov.br/action/ActionDatalegis.php?acao=detalharAto&tipo=RES&numeroAto=00005998&seqAto=000&valorAno=2022&orgao=DG/ANTT/MI&codTipo=&desItem=&desItemFim=&cod_menu=5408&cod_modulo=161&pesquisa=true'},
]
for e in extra:
    if e['title'] not in nomes: norms.append(e)
for n in norms:
    if n['title'].startswith('RDC Anvisa nº 16/2014'):
        n['description'] = 'AFE e AE. Art. 27: requisitos técnicos do fabricante; art. 28: requisitos técnicos de distribuidores, armazenadores e transportadores, verificados na inspeção local.'

cfg = copy.deepcopy(O)
cfg['sections'] = sections
cfg['infractions'] = infractions
cfg['norms'] = norms
cfg['inventarioRevisado'] = True  # desliga a geração automática “Não atendimento ao requisito: …”
cfg['startDescription'] = ('A atividade vem do cartão do núcleo. Marque as classes de produtos presentes: '
  'o roteiro mostra só as verificações aplicáveis. Fabricante: cosméticos, produtos de higiene e perfumes (RDC 48/2013). '
  'Atacadista e transportador: requisitos técnicos da RDC 16/2014, art. 28; com dispositivos/IVD, também a RDC 665/2022.')

# conferências
ids = [i['id'] for s in sections for i in s['items']]
assert len(ids) == len(set(ids)), [k for k in ids if ids.count(k) > 1]
iids = [i['id'] for i in infractions]
assert len(iids) == len(set(iids))
# Forma das citações lida pelo motor de citações (nuc--citacoes.js): "art. 28, II, “d”" abre o
# inciso com as alíneas; "inciso II, alínea d" não é reconhecido e aparecia como não localizado.
def forma(t):
    t = re.sub(r'inciso ([IVX]+), alíneas ([a-z]) e ([a-z])\b', r'\1, “\2” e “\3”', t)
    t = re.sub(r'inciso ([IVX]+), alínea ([a-z])\b', r'\1, “\2”', t)
    # qualificador entre parênteses depois do dispositivo quebra a leitura do dispositivo
    for q, por in (('fabricante', 'no fabricante'), ('distribuidor e transportador', 'no distribuidor e no transportador'),
                   ('distribuidor', 'no distribuidor'), ('dispositivos/IVD', 'em dispositivos/IVD'),
                   ('demais atividades', 'nas demais atividades')):
        t = t.replace(' (' + q + ')', ', ' + por)
    return t.replace('arts. 125, 126, parágrafo único, e 127', 'arts. 125 a 127')
for sec in sections:
    for it in sec['items']:
        it['legal'] = forma(it['legal'])
for inf in infractions:
    inf['legal'] = forma(inf['legal'])
json.dump(cfg, open(os.path.join(AQUI, 'config-revisado.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('seções', len(sections), 'itens', len(ids), 'infrações', len(infractions))
