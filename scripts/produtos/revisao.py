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
- 12/11/2026: inventário por requisito (56 → 142 infrações), cada verificação
  ligada às suas infrações (`inf`, sugeridas pela resposta “Não” —
  produtos-sugestoes.inc.js); atacadista com pisos, estrados, pragas,
  saneantes/perigosos segregados, venda de saneante profissional (RDC 989/2025,
  art. 25), fracionamento sem AFE e conferência na expedição; transportador com
  estiva, carga/descarga protegida e regularidade de remetentes e destinatários;
  todos com os documentos de localização e segurança (RDC 16/2014, art. 27/28,
  I, c) e a rotulagem da classe.
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


def legal_de(x, legal):
    if isinstance(legal, dict):
        x['legal'] = legal.get('distribuidor') or next(iter(legal.values()))
        x['legalTipo'] = legal
    else:
        x['legal'] = legal
    return x


def I(id, text, legal, critical=False, when=None):
    x = legal_de({'id': id, 'text': text}, legal)
    if critical: x['critical'] = True
    if when: x['when'] = when
    return x


def old(sec, id, novo_id=None, **mud):
    x = copy.deepcopy(OLD[(sec, id)])
    if novo_id: x['id'] = novo_id
    x.update(mud)
    return x


def T3(fab, outros, transp=None):
    """fundamento por atividade: o motor (produtos-sugestoes.inc.js) usa o da trilha aberta"""
    return {'fabricante': fab, 'distribuidor': outros, 'transportadora': transp or outros}


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
    T3(f'{L}, art. 93; {R16}, art. 27, inciso I, alínea e; {R48}, item 11.9.', f'{L}, art. 93; {R16}, art. 28, inciso I, alínea e.'), True),
  I('l7', 'Mudança de responsável técnico ou legal peticionada à Anvisa em até 30 dias; demais alterações de AFE/AE (atividades, classes, endereço, razão social) peticionadas.',
    f'{R16}, art. 11, § 1º, e art. 22.'),
  I('l8', 'Serviços terceirizados contratados somente com empresas autorizadas e licenciadas, com contrato ou documento equivalente.',
    T3(f'{R16}, art. 27, inciso I, alínea f.', f'{R16}, art. 28, inciso I, alínea d.'), False, {'flagsAll': ['terc']}),
  I('l10', 'Autorização ou alvará de localização e ocupação, de proteção ambiental e de segurança das instalações (AVCB ou CLCB) e dos trabalhadores disponíveis.',
    T3(f'{R16}, art. 27, inciso I, alínea c.', f'{R16}, art. 28, inciso I, alínea c.')),
]))

sections.append(S('reg', 'Regularidade dos produtos',
  'Confira por amostragem no estoque. A consulta de regularização fica no fim do roteiro. Produto que consta da lista da Anvisa de produtos não regularizados como dispositivos médicos não exige notificação nem registro: consulte na Central de Consultas, modo “DM não regularizado”, e leia a exceção do item.', [
  I('r1', 'Dispositivos médicos (não IVD) regularizados conforme a classe de risco: classes I e II por notificação; classes III e IV por registro.',
    f'{L6360}, art. 12; RDC Anvisa nº 751/2022, arts. 5º a 7º.', True, {'flagsAll': ['cls_disp']}),
  I('r1ivd', 'Dispositivos para diagnóstico in vitro (IVD) regularizados conforme a classe de risco (notificação ou registro).',
    f'{L6360}, art. 12; RDC Anvisa nº 830/2023, arts. 6º e 7º.', True, {'flagsAll': ['cls_disp']}),
  I('r2', 'Cosméticos, produtos de higiene e perfumes regularizados: registro para os grupos do art. 34 (protetor solar, repelente, alisante, bronzeador, gel antisséptico etc.); comunicação prévia para os demais.',
    f'{L6360}, art. 12; RDC Anvisa nº 907/2024, arts. 34 e 35.', True, {'flagsAll': ['cls_cosm']}),
  I('r3', 'Saneantes regularizados conforme o risco: risco 1 por notificação; risco 2 (antimicrobianos, desinfestantes, corrosivos, pH extremo etc.) por registro.',
    f'{L6360}, art. 12; RDC Anvisa nº 989/2025, arts. 8º e 12.', True, {'flagsAll': ['cls_san']}),
  I('r4', 'Produtos dentro do prazo de validade, com embalagem íntegra e identificação legível.',
    f'{L}, arts. 46 e 49; {L6360}, art. 67, inciso III.', True),
  I('r5', 'Todos os produtos têm procedência comprovada, rotulagem e fornecedor autorizado.',
    f'{L6360}, art. 2º; {L}, arts. 46 e 49.', True),
  I('r6', 'Rotulagem com as informações obrigatórias da classe, legíveis e em português; produtos importados com a adequação (etiqueta) aplicada antes da comercialização.',
    'Em cosméticos, RDC Anvisa nº 907/2024, arts. 13, 20 e 21; em dispositivos médicos e IVD, RDC Anvisa nº 751/2022, art. 46, inciso I, e RDC Anvisa nº 830/2023, art. 46, inciso I; em saneantes, RDC Anvisa nº 989/2025, arts. 33, 44 e 45.'),
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
   I('df4', 'Dispositivos/IVD: conformidade verificada no recebimento; o produto só é liberado ao estoque depois da verificação.',
     f'{R665}, arts. 88 a 91.', False, {'flagsAll': ['cls_disp']}),
   I('df6', 'Na expedição são conferidos produto, lote, quantidade e destinatário; só saem produtos regulares, dentro da validade e destinados a clientes regularizados.',
     f'{A28}, inciso II, alíneas d e l.'),
 ], DIST),
 S('d_arm', 'Armazenamento e controle de estoque', 'Condições de conservação, segregação e inventário.', [
   I('ds1', 'Instalações, equipamentos e instrumentos adequados às atividades, com qualificação e calibração quando exigidas (termômetros, câmaras, climatização).',
     f'{A28}, inciso II, alínea a.'),
   I('ds3', 'Condições de higiene, armazenamento e operação adequadas ao produto (temperatura, umidade e luz conforme a rotulagem), sem risco de contaminação ou alteração.',
     f'{A28}, inciso II, alínea c.', True),
   I('ds14', 'Área de armazenamento com pisos, paredes e tetos íntegros e limpos, sem infiltração e sem materiais estranhos à atividade.',
     f'{A28}, inciso II, alíneas a e c.'),
   I('ds13', 'Produtos sobre estrados, paletes ou prateleiras, afastados do piso e das paredes, com empilhamento dentro do limite indicado na embalagem.',
     f'{A28}, inciso II, alínea c.'),
   I('ds12', 'Área sem sinais de pragas, com controle de pragas programado e comprovantes de execução.',
     f'{A28}, inciso II, alínea c.'),
   I('ds11', 'Saneantes e produtos inflamáveis, corrosivos ou tóxicos armazenados segregados dos demais, em área identificada, com embalagens íntegras e sem vazamento.',
     f'{A28}, inciso II, alínea c.', True),
   I('ds8', 'Saneantes de venda restrita a profissionais comercializados somente a profissionais e empresas, fora de local de acesso direto do consumidor.',
     'RDC Anvisa nº 989/2025, art. 25.', False, {'flagsAll': ['cls_san']}),
   I('ds15', 'Fracionamento, reembalagem ou rerrotulagem de produtos realizados somente com AFE e licença sanitária para essa atividade.',
     f'{L6360}, art. 2º; {R16}, art. 3º.', True),
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
     f'{A28}, inciso II, alínea c; Resolução ANTT nº 5.998/2022, art. 2º, quando houver produto perigoso.', True),
   I('tv13', 'Carga acondicionada e estivada de modo a não se deslocar, cair ou tombar, com embalagens íntegras.',
     f'{A28}, inciso II, alínea c.'),
   I('tv12', 'Carga e descarga em local protegido contra intempéries; guarda temporária da carga em área adequada, limpa e segregada.',
     f'{A28}, inciso II, alíneas c e k.'),
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
   I('tr8', 'Há mecanismo que assegure que remetentes e destinatários da carga estejam regularizados junto à vigilância sanitária.',
     f'{A28}, inciso II, alínea l.'),
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
# Revisão de 12/11/2026: uma infração por requisito do roteiro (antes 56, quase nada do
# fabricante e do distribuidor). Cada verificação aponta, em `inf`, as infrações que o seu
# descumprimento configura (LIGA, abaixo); a resposta “Não” as sugere na própria pergunta e
# no topo da aba Infrações. Nada é marcado sem a equipe.
G1, G2, G3, G4, G5, G6, G7, G8, G9, G10, G11 = (
  '1. Licença, AFE e responsável técnico', '2. Regularidade e rotulagem dos produtos',
  '3. Fabricação — gestão da qualidade, pessoal e saúde', '4. Fabricação — instalações, água e áreas de apoio',
  '5. Fabricação — almoxarifado, amostragem e produção', '6. Fabricação — controle da qualidade e documentação',
  '7. Armazenamento, recebimento e expedição', '8. Dispositivos médicos e IVD', '9. Transporte',
  '10. Qualidade, reclamações e recolhimento', '11. Pessoal, higiene, pragas e resíduos')
P = 'ATENÇÃO PRIORITÁRIA — '
ANY_FD = {'any': [FAB, DISP]}
NAO_FAB = {'types': ['distribuidor', 'transportadora']}
FAB_DIST = {'types': ['fabricante', 'distribuidor']}
B = lambda itens: f'{L}, art. 46, c/c {R48}, {itens}.'
inf = [
 # 1 — licença, AFE, RT
 (G1, 'p01', P + 'Por iniciar ou manter a atividade sem licença sanitária municipal, ou sem requerer sua renovação no prazo.', f'{L}, art. 90.'),
 (G1, 'p02', 'Por exercer atividade diversa daquela licenciada, ou em endereço diverso do constante da licença, sem comunicação à autoridade sanitária.', f'{L}, art. 90, caput e § 1º.'),
 (G1, 'p03', P + 'Por realizar atividade sujeita à Autorização de Funcionamento sem AFE vigente na Anvisa.', f'{L6360}, art. 2º, c/c {R16}, art. 3º.'),
 (G1, 'p04', 'Por manter AFE incompatível com a classe de produto ou com a atividade efetivamente realizada.', f'{R16}, arts. 3º e 22.'),
 (G1, 'p143', P + 'Por fracionar, reembalar ou rerrotular produto sem autorização de funcionamento e licença para essa atividade.', f'{L}, art. 90, c/c {L6360}, art. 2º, e {R16}, art. 3º.', DIST),
 (G1, 'p05', P + 'Por movimentar substâncias sujeitas a controle especial sem Autorização Especial.', f'{R16}, art. 4º, c/c Portaria SVS/MS nº 344/1998, art. 2º.', {'flagsAll': ['ae344']}),
 (G1, 'p06', 'Por funcionar sem responsável técnico legalmente habilitado presente, ou, no fabricante, sem substituto designado.', T3(f'{L}, art. 93, c/c {R16}, art. 27, inciso I, alínea e, e {R48}, item 11.9.', f'{L}, art. 93, c/c {R16}, art. 28, inciso I, alínea e.')),
 (G1, 'p07', 'Por deixar de peticionar à Anvisa a alteração de responsável técnico ou legal no prazo, ou demais alterações de AFE/AE.', f'{R16}, art. 11, § 1º, e art. 22.'),
 (G1, 'p48', 'Por contratar serviço terceirizado com empresa não autorizada ou não licenciada.', T3(f'{R16}, art. 27, inciso I, alínea f.', f'{R16}, art. 28, inciso I, alínea d.'), {'flagsAll': ['terc']}),
 (G1, 'p56', 'Por não dispor de autorização ou alvará de localização e ocupação, proteção ambiental e segurança das instalações e dos trabalhadores.', T3(f'{L}, art. 50, c/c {R16}, art. 27, inciso I, alínea c.', f'{L}, art. 50, c/c {R16}, art. 28, inciso I, alínea c.')),
 # 2 — regularidade e rotulagem
 (G2, 'p09', P + 'Por manter, expor ou distribuir dispositivo médico ou produto para diagnóstico in vitro sem notificação ou registro na Anvisa.', f'{L6360}, art. 12, c/c RDC Anvisa nº 751/2022, arts. 6º e 7º; RDC Anvisa nº 830/2023, arts. 6º e 7º.', {'flagsAll': ['cls_disp']}),
 (G2, 'p10', P + 'Por manter, expor ou distribuir cosmético, produto de higiene ou perfume sem regularização na Anvisa.', f'{L6360}, art. 12, c/c RDC Anvisa nº 907/2024, arts. 34 e 35.', {'flagsAll': ['cls_cosm']}),
 (G2, 'p11', P + 'Por manter, expor ou distribuir saneante sem regularização na Anvisa.', f'{L6360}, art. 12, c/c RDC Anvisa nº 989/2025, arts. 8º e 12.', {'flagsAll': ['cls_san']}),
 (G2, 'p12', P + 'Por manter, expor ou distribuir produto com prazo de validade expirado.', f'{L6360}, art. 67, inciso III; {L}, art. 46.'),
 (G2, 'p13', 'Por manter ou distribuir produto com embalagem violada, danificada ou com identificação ilegível.', f'{L}, art. 46.'),
 (G2, 'p14', P + 'Por manter produto sem procedência comprovada, sem rotulagem ou recebido de fornecedor não autorizado.', f'{L6360}, art. 2º; {L}, arts. 46 e 49.'),
 (G2, 'p15', 'Por manter ou distribuir cosmético, produto de higiene ou perfume com rotulagem em desacordo com a norma: informações obrigatórias ausentes, ilegíveis ou fora do português, ou importado sem a adequação.', f'{L}, art. 49, c/c RDC Anvisa nº 907/2024, arts. 13, 20 e 21.', {'flagsAll': ['cls_cosm']}),
 (G2, 'p154', 'Por manter ou distribuir dispositivo médico ou IVD com rótulo ou instruções de uso sem as informações em português.', f'{L}, art. 49, c/c RDC Anvisa nº 751/2022, art. 46, inciso I; RDC Anvisa nº 830/2023, art. 46, inciso I.', {'flagsAll': ['cls_disp']}),
 (G2, 'p155', 'Por manter ou distribuir saneante com rotulagem em desacordo com a norma: informações obrigatórias ausentes ou fora do português, ou importado sem a etiqueta de adequação.', f'{L}, art. 49, c/c RDC Anvisa nº 989/2025, arts. 33, 44 e 45.', {'flagsAll': ['cls_san']}),
 (G2, 'p57', 'Por vender saneante de uso restrito a profissionais em local de acesso direto do consumidor.', f'{L}, art. 46, c/c RDC Anvisa nº 989/2025, art. 25.', {'types': ['distribuidor'], 'flagsAll': ['cls_san']}),
 # 3 — fabricação: gestão da qualidade, pessoal e saúde
 (G3, 'p16', 'Por fabricar sem sistema de gestão da qualidade estabelecido, documentado e implementado.', B('item 3.2'), FAB),
 (G3, 'p89', 'Por não manter sistema de garantia da qualidade com instalações, equipamentos e pessoal compatíveis com as atividades.', B('itens 3.3.1 a 3.3.3'), FAB),
 (G3, 'p17', P + 'Por liberar produto ao consumo antes de concluídas as etapas de controle e liberação.', B('item 3.3.4'), FAB),
 (G3, 'p90', 'Por deixar de reportar, investigar e registrar desvios, ou de adotar a ação corretiva.', B('item 3.3.4'), FAB),
 (G3, 'p91', 'Por não definir critérios para a qualificação de fornecedores.', B('item 3.3.5'), FAB),
 (G3, 'p92', 'Por não validar processos e métodos com protocolo e relatório aprovados, ou não avaliar a revalidação após mudanças.', B('itens 3.4.1 a 3.4.5 e 3.5'), FAB),
 (G3, 'p93', 'Por não realizar estudo de estabilidade dos produtos, com metodologia, condições e registros.', B('item 3.6'), FAB),
 (G3, 'p94', 'Por não manter organograma atualizado e responsabilidades funcionais documentadas.', B('itens 11.1 e 11.10 a 11.12'), FAB),
 (G3, 'p95', 'Por não dispor de pessoal treinado e qualificado em número suficiente para as atividades.', B('item 11.2'), FAB),
 (G3, 'p96', 'Por não treinar especificamente o pessoal que manipula materiais tóxicos e inflamáveis.', B('item 11.5'), FAB),
 (G3, 'p25', 'Por manter os responsáveis pela produção e pelo controle de qualidade sem independência entre si.', B('item 11.8'), FAB),
 (G3, 'p97', 'Por não realizar os exames de saúde admissionais e periódicos do pessoal conforme procedimento.', B('item 5.2'), FAB),
 (G3, 'p98', 'Por não treinar o pessoal nas práticas de higiene pessoal.', B('item 5.3'), FAB),
 (G3, 'p23', P + 'Por manter pessoa com enfermidade ou lesão exposta manuseando matéria-prima, embalagem ou produto.', B('item 5.4'), FAB),
 (G3, 'p99', 'Por permitir trabalho sem paramentação limpa e adequada à área e à atividade.', B('item 5.7'), FAB),
 (G3, 'p100', 'Por permitir a entrada de visitantes ou de pessoas não treinadas na produção sem paramentação ou sem acompanhamento.', B('item 5.11'), FAB),
 (G3, 'p137', 'Por não dispor de procedimento de autoinspeção, de equipe qualificada para executá-la ou de relatório com resultados, conclusões e ações corretivas.', B('itens 9.2, 9.3 e 9.5'), FAB),
 (G3, 'p24', 'Por não realizar autoinspeção anual, ou por não implementar as ações corretivas do relatório.', B('itens 9.4 e 9.6'), FAB),
 # 4 — fabricação: instalações, água, áreas de apoio
 (G4, 'p101', 'Por não dispor de planta arquitetônica aprovada pela autoridade sanitária competente.', f'{L}, art. 50, c/c {R48}, item 12.1.', FAB),
 (G4, 'p19', P + 'Por manter instalações em condição que permita contaminação cruzada, acúmulo de sujidade ou acesso de animais.', B('itens 12.2, 12.4, 12.8 e 15.3'), FAB),
 (G4, 'p102', 'Por não limpar e sanitizar as áreas conforme procedimento, ou por não registrar a limpeza.', B('item 12.3'), FAB),
 (G4, 'p103', 'Por não dispor de instalações de segurança contra incêndio, com extintores suficientes e de acesso livre.', f'{L}, art. 50, c/c {R48}, item 12.9.', FAB),
 (G4, 'p104', 'Por manter ralos sem proteção contra refluxo, ou canais abertos, nas áreas de fabricação.', B('item 12.11'), FAB),
 (G4, 'p105', 'Por manter descanso, refeitório, vestiários, sanitários ou manutenção comunicando-se com produção ou armazenamento, ou em número ou higiene insuficientes.', B('itens 14.1 a 14.3'), FAB),
 (G4, 'p106', 'Por não identificar as tubulações de água, vapor, gás, ar comprimido e eletricidade.', B('item 14.4'), FAB),
 (G4, 'p20', P + 'Por utilizar água sem especificação definida ou sem monitoramento da qualidade nos pontos críticos.', B('itens 13.2 e 13.6'), FAB),
 (G4, 'p107', 'Por manter o sistema de água sem procedimentos e registros de operação, limpeza, sanitização e manutenção, ou com tubulações em mau estado.', B('itens 13.3 e 13.5'), FAB),
 (G4, 'p108', 'Por não investigar nem corrigir resultado de água fora da especificação.', B('item 13.7.1'), FAB),
 # 5 — fabricação: almoxarifado, amostragem, produção
 (G5, 'p109', 'Por manter almoxarifado sem capacidade para estoque ordenado por categoria e por situação.', B('item 15.1'), FAB),
 (G5, 'p110', P + 'Por estocar materiais inflamáveis, explosivos ou perigosos fora de área segura, segregada e identificada.', B('item 15.12'), FAB),
 (G5, 'p112', 'Por manter material sem identificação de quarentena ou sem etiqueta com nome, lote, situação, validade e fornecedor.', B('itens 15.19 e 15.21'), FAB),
 (G5, 'p113', 'Por receber matéria-prima sem o laudo de análise do fabricante ou do fornecedor.', B('item 15.29'), FAB),
 (G5, 'p114', 'Por realizar amostragem sem plano e procedimento escrito, fora de área definida, por pessoa não autorizada ou sem identificação das amostras.', B('itens 16.1 a 16.8'), FAB),
 (G5, 'p26', 'Por deixar de calibrar balanças e instrumentos de medição, ou de manter os respectivos registros.', B('itens 15.7 e 17.17.4'), FAB),
 (G5, 'p115', P + 'Por produzir em área sem espaço, instalações, equipamentos, procedimentos aprovados ou controles em processo compatíveis com as operações.', B('itens 17.2 a 17.6'), FAB),
 (G5, 'p116', 'Por não monitorar, registrar e controlar temperatura e umidade da produção quando necessárias à estabilidade de materiais e produtos.', B('item 17.9'), FAB),
 (G5, 'p117', 'Por manter equipamentos inadequados, sem identificação ou sem limpeza e sanitização, ou equipamentos com defeito na área sem identificação.', B('itens 17.18.1 e 17.18.5 a 17.18.7'), FAB),
 (G5, 'p118', 'Por não dispor de programa de manutenção preventiva dos equipamentos, com registros.', B('item 17.18.8'), FAB),
 (G5, 'p119', P + 'Por produzir lote sem ordem de fabricação correspondente à fórmula padrão vigente.', B('itens 17.19.1 e 17.19.3'), FAB),
 (G5, 'p120', P + 'Por não definir controles em processo e limites de aceitação, ou por não investigar resultado fora do limite.', B('item 17.19.8'), FAB),
 (G5, 'p27', 'Por reprocessar produto sem procedimento autorizado, sem avaliação de risco ou sem registro.', B('item 17.19.9'), FAB),
 (G5, 'p121', 'Por manter produto a granel ou semielaborado fora de área definida, fora das condições especificadas ou além do tempo máximo de espera.', B('item 17.19.10'), FAB),
 (G5, 'p122', 'Por envasar, embalar ou rotular sem controles que previnam misturas, trocas e erros de identificação.', B('item 17.20'), FAB),
 # 6 — fabricação: controle da qualidade e documentação
 (G6, 'p21', P + 'Por não dispor de laboratório de controle da qualidade próprio e independente da produção, nem de terceirização regular.', B('item 18.1'), FAB),
 (G6, 'p123', P + 'Por realizar análises sem procedimento escrito, instrumentos calibrados, equipamentos adequados ou registro dos ensaios.', B('item 18.2'), FAB),
 (G6, 'p124', 'Por não definir e documentar as responsabilidades do controle e da garantia da qualidade.', B('item 18.3'), FAB),
 (G6, 'p125', 'Por manter o laboratório de controle da qualidade sem separação da produção, ou ensaios microbiológicos sem instalação independente.', B('item 18.4'), FAB),
 (G6, 'p126', 'Por não dispor de especificações, métodos de ensaio, procedimentos de amostragem, registros e certificados analíticos.', B('itens 18.8 a 18.13'), FAB),
 (G6, 'p127', P + 'Por liberar matéria-prima, material de embalagem ou produto acabado que não atende às especificações.', B('itens 18.16 e 18.23 a 18.26'), FAB),
 (G6, 'p22', 'Por deixar de reter amostras de produtos acabados na quantidade e pelo prazo exigidos.', B('item 19'), FAB),
 (G6, 'p18', 'Por deixar de manter fórmula padrão ou registro de produção por lote, impedindo a rastreabilidade.', B('itens 10.9 e 10.10'), FAB),
 (G6, 'p128', 'Por manter documentos sem controle de elaboração, aprovação, revisão e distribuição, ou registros alterados sem identificação do dado anterior, assinatura e data.', B('itens 10.4 e 10.5'), FAB),
 (G6, 'p129', 'Por não reter os registros de produção e de controle por, no mínimo, um ano após o vencimento do lote.', B('item 10.7'), FAB),
 (G6, 'p130', 'Por não registrar uso, limpeza, sanitização e manutenção dos equipamentos.', B('item 10.8'), FAB),
 (G6, 'p131', 'Por não dispor de procedimentos operacionais padrão implementados para as operações exigidas (recebimento, amostragem, numeração de lote, ensaios, limpeza, armazenamento, calibração).', f'{L}, art. 46, § 1º, c/c {R48}, item 10.11.', FAB),
 # 7 — armazenamento, recebimento e expedição
 (G7, 'p49', P + 'Por não dispor de mecanismo que assegure a regularidade sanitária de fornecedores e clientes (no transporte, de remetentes e destinatários).', f'{L}, art. 46, c/c {A28}, inciso II, alínea l.', NAO_FAB),
 (G7, 'p65', 'Por receber produtos sem a conferência, conforme procedimento, de identificação, lote, validade, integridade da embalagem e condições de transporte.', f'{L}, art. 46, c/c {A28}, inciso II, alínea d.', DIST),
 (G7, 'p64', 'Por manter áreas de recebimento e expedição, ou de carga e descarga, inadequadas ou desprotegidas contra variações climáticas.', f'{L}, art. 46, c/c {A28}, inciso II, alíneas c e k.', NAO_FAB),
 (G7, 'p60', 'Por expedir produto sem conferência de identificação, lote, quantidade e destinatário, ou produto irregular, vencido ou destinado a cliente não regularizado.', f'{L}, art. 46, c/c {A28}, inciso II, alíneas d e l.', DIST),
 (G7, 'p66', 'Por não dispor de instalações, equipamentos e instrumentos adequados, qualificados e calibrados (termômetros, câmaras, climatização, compartimentos de carga).', f'{L}, art. 50, c/c {A28}, inciso II, alínea a.', NAO_FAB),
 (G7, 'p59', 'Por manter área de armazenamento com pisos, paredes ou tetos danificados, sujos ou com infiltração, ou com materiais estranhos à atividade.', f'{L}, art. 50, c/c {A28}, inciso II, alíneas a e c.', DIST),
 (G7, 'p28', P + 'Por armazenar produto em condição que não preserve sua integridade, ou sem o controle de temperatura e umidade exigido.', T3(B('item 15.2'), f'{L}, art. 46, c/c {A28}, inciso II, alínea c.'), FAB_DIST),
 (G7, 'p67', P + 'Por armazenar produto que exige temperatura controlada sem registro contínuo, ou com registros fora da faixa especificada sem providência.', f'{L}, art. 46, c/c {A28}, inciso II, alíneas a e c.', {'types': ['distribuidor'], 'flagsAll': ['temp']}),
 (G7, 'p32', 'Por armazenar produto diretamente sobre o piso, encostado às paredes ou sem empilhamento seguro.', T3(B('itens 15.16 e 15.25'), f'{L}, art. 46, c/c {A28}, inciso II, alínea c.'), FAB_DIST),
 (G7, 'p58', P + 'Por armazenar saneantes ou produtos inflamáveis, corrosivos ou tóxicos sem segregação dos demais produtos, ou com embalagens danificadas ou com vazamento.', f'{L}, art. 46, c/c {A28}, inciso II, alínea c.', DIST),
 (G7, 'p29', P + 'Por deixar de segregar e identificar produtos reprovados, vencidos, avariados, devolvidos, recolhidos ou interditados.', T3(B('itens 7.6 e 15.9'), f'{L}, art. 46, c/c {A28}, inciso II, alínea d.'), FAB_DIST),
 (G7, 'p84', 'Por não adotar a rotatividade de estoque em que sai primeiro o produto mais próximo do vencimento.', B('item 15.13'), FAB),
 (G7, 'p51', 'Por não dispor de controle de estoque que permita inventários periódicos registrados.', T3(B('item 15.15'), f'{L}, art. 46, c/c {A28}, inciso II, alínea g.'), FAB_DIST),
 (G7, 'p61', 'Por não manter registros de entrada e de distribuição que identifiquem fornecedor, lote, quantidade e destino dos produtos.', f'{L}, art. 46, c/c {A28}, inciso II, alínea g.', DIST),
 (G7, 'p52', P + 'Por armazenar produto sujeito a controle especial fora de área separada, identificada e de acesso restrito.', f'{L}, art. 50, § 1º, c/c {A28}, inciso II, alínea f.', {'types': ['distribuidor'], 'flagsAll': ['ae344']}),
 (G7, 'p50', 'Por não dispor de procedimentos operacionais padrão de recepção, identificação, estoque e armazenamento de produtos acabados, devolvidos ou recolhidos.', f'{L}, art. 46, § 1º, c/c {A28}, inciso II, alínea d.', NAO_FAB),
 (G7, 'p63', 'Por não dispor de Manual de Boas Práticas de Distribuição e Armazenagem compatível com a rotina.', f'{L}, art. 46, § 1º, c/c {A28}, inciso I, alínea f.', DISP),
 # 8 — dispositivos médicos e IVD (RDC 665/2022, recorte do distribuidor)
 (G8, 'p68', P + 'Por não estabelecer e manter sistema de qualidade para dispositivos médicos/IVD, com instruções e procedimentos próprios.', f'{L}, art. 46, c/c {R665}, art. 4º.', DISP),
 (G8, 'p69', 'Por não definir política de qualidade em manual, compreendida pelo pessoal que pode afetar a qualidade do produto.', f'{L}, art. 46, c/c {R665}, arts. 5º a 7º.', DISP),
 (G8, 'p70', 'Por não representar a estrutura organizacional em organograma, com responsabilidades definidas e representante da gerência designado.', f'{L}, art. 46, c/c {R665}, arts. 8º e 9º.', DISP),
 (G8, 'p71', 'Por não realizar revisão gerencial do sistema de qualidade em intervalos definidos, com registro.', f'{L}, art. 46, c/c {R665}, arts. 10 a 12.', DISP),
 (G8, 'p72', 'Por contratar consultor sem qualificação comprovada ou fora do controle de compras.', f'{L}, art. 46, c/c {R665}, arts. 16 e 17.', DISP),
 (G8, 'p73', P + 'Por não definir critérios de avaliação de fornecedores nem manter registro dos fornecedores aprovados.', f'{L}, art. 46, c/c {R665}, arts. 22 e 23.', DISP),
 (G8, 'p74', 'Por não manter acordo em que o fornecedor se compromete a notificar alterações no produto ou no serviço.', f'{L}, art. 46, c/c {R665}, art. 24.', DISP),
 (G8, 'p75', 'Por não manter registros de pedidos de compra com referência às especificações, revisados e aprovados.', f'{L}, art. 46, c/c {R665}, arts. 25 a 27.', DISP),
 (G8, 'p76', 'Por não controlar documentos (aprovação, registro das alterações e relação dos vigentes).', f'{L}, art. 46, c/c {R665}, arts. 28 a 33.', DISP),
 (G8, 'p77', 'Por manter documentos ilegíveis, sem proteção contra dano e perda ou sem cópia de segurança dos arquivos digitais.', f'{L}, art. 46, c/c {R665}, arts. 34 e 35.', DISP),
 (G8, 'p42', 'Por não manter documentos e registros de dispositivos/IVD pelo prazo exigido.', f'{L}, art. 46, c/c {R665}, art. 37.', DISP),
 (G8, 'p78', P + 'Por manter instalações sem fluxo adequado de pessoas e materiais, permitindo trocas ou contaminação.', f'{L}, art. 50, c/c {R665}, art. 67.', DISP),
 (G8, 'p79', 'Por não controlar, monitorar e registrar as condições ambientais exigidas.', f'{L}, art. 46, c/c {R665}, art. 68.', DISP),
 (G8, 'p80', 'Por não dispor de procedimento e programação de limpeza e sanitização.', f'{L}, art. 46, c/c {R665}, art. 69.', DISP),
 (G8, 'p81', 'Por manter pessoal em contato com o produto sem limpeza, saúde ou vestimenta adequadas, ou sem afastamento quando a condição de saúde puder afetar o produto.', f'{L}, art. 46, c/c {R665}, arts. 70 e 71.', DISP),
 (G8, 'p82', 'Por não dispor de procedimentos que evitem contaminação por materiais de limpeza e substâncias perigosas.', f'{L}, art. 46, c/c {R665}, art. 73.', DISP),
 (G8, 'p83', 'Por não adotar procedimentos e identificação que evitem trocas, danos e deterioração no manuseio, armazenamento e distribuição.', f'{L}, art. 46, c/c {R665}, arts. 107, 110 e 113.', DISP),
 (G8, 'p30', P + 'Por distribuir dispositivo/IVD não aprovado, com validade expirada ou sem verificação de conformidade.', f'{R665}, arts. 108 e 109.', DISP),
 (G8, 'p31', 'Por não manter registros de distribuição de dispositivos/IVD que identifiquem destinatário, quantidade, data e lote ou série.', f'{R665}, arts. 112 e 114.', DISP),
 (G8, 'p145', P + 'Por armazenar dispositivo/IVD em condições físicas e ambientais que não previnam dano ou deterioração, ou sem o controle de temperatura e umidade exigido.', f'{L}, art. 46, c/c {R665}, art. 111.', DISP),
 (G8, 'p146', P + 'Por não identificar, avaliar e segregar dispositivo/IVD não conforme ou devolvido, ou não documentar sua disposição.', f'{L}, art. 46, c/c {R665}, arts. 115 a 118.', DISP),
 (G8, 'p153', 'Por não distribuir primeiro o dispositivo/IVD mais próximo do vencimento.', f'{L}, art. 46, c/c {R665}, art. 109.', DISP),
 (G8, 'p148', 'Por não dispor de pessoal em número suficiente, com treinamento documentado conduzido por pessoa qualificada.', f'{L}, art. 46, c/c {R665}, arts. 13 a 15.', DISP),
 (G8, 'p149', P + 'Por não dispor de programa de controle de pragas, ou aplicar agentes químicos que afetem a qualidade do dispositivo/IVD.', f'{L}, art. 46, c/c {R665}, art. 74.', DISP),
 (G8, 'p150', 'Por não tratar e destinar os resíduos conforme a legislação vigente.', f'{L}, art. 31, c/c {R665}, art. 75.', DISP),
 (G8, 'p151', 'Por descumprir as normas de saúde do trabalhador ou não fornecer EPI compatível com a atividade.', f'{L}, art. 46, c/c {R665}, art. 77.', DISP),
 (G8, 'p152', 'Por permitir consumo de alimentos e bebidas fora dos locais específicos, em áreas de produto.', f'{L}, art. 46, c/c {R665}, art. 72.', DISP),
 (G8, 'p147', P + 'Por não prever o recolhimento e as ações de campo de dispositivo/IVD já distribuído.', f'{L}, art. 46, c/c {R665}, art. 120, inciso VIII, e RDC Anvisa nº 551/2021, art. 12.', DISP),
 (G8, 'p85', 'Por não dispor de procedimentos de análise de dados, investigação de causa e ação corretiva e preventiva, com registro.', f'{L}, art. 46, c/c {R665}, art. 120, incisos I a VII.', DISP),
 (G8, 'p39', P + 'Por deixar de examinar imediatamente reclamação relativa a óbito, lesão ou ameaça à saúde pública.', f'{L}, art. 55, c/c {R665}, art. 121, § 2º.', DISP),
 (G8, 'p40', 'Por deixar de registrar, avaliar ou encaminhar ao detentor da regularização reclamação, queixa técnica ou evento adverso sobre dispositivo médico/IVD.', f'{L}, art. 55; {R665}, art. 121, incisos I a V e § 1º.', DISP),
 (G8, 'p86', 'Por não conduzir auditorias de qualidade documentadas, por pessoas sem responsabilidade direta sobre a matéria auditada.', f'{L}, art. 46, c/c {R665}, arts. 122 a 124.', DISP),
 (G8, 'p87', 'Por não dispor de instruções e procedimentos de instalação disponíveis com o produto, quando a empresa instala.', f'{L}, art. 46, c/c {R665}, arts. 125 a 127.', DISP),
 (G8, 'p88', 'Por não registrar a assistência técnica prestada ou não analisar os registros para ação corretiva diante de tendência de falha, óbito ou lesão grave.', f'{L}, art. 46, c/c {R665}, arts. 129 e 130.', DISP),
 # 9 — transporte
 (G9, 'p53', P + 'Por transportar produto de interesse da saúde em veículo não declarado à autoridade sanitária.', f'{L}, art. 91.', TRANSP),
 (G9, 'p138', 'Por não manter relação atualizada dos veículos próprios e de terceiros, com os equipamentos necessários às condições de transporte de cada produto.', f'{L}, art. 91, c/c {A28}, inciso II, alínea m.', TRANSP),
 (G9, 'p33', P + 'Por transportar produto em veículo sujo, deteriorado ou que não proteja a carga contra intempéries, poeira e animais.', f'{L}, art. 46, c/c {A28}, inciso II, alíneas c e m.', TRANSP),
 (G9, 'p142', 'Por transportar carga mal acondicionada ou estivada, sujeita a deslocamento, queda ou dano da embalagem.', f'{L}, art. 46, c/c {A28}, inciso II, alínea c.', TRANSP),
 (G9, 'p34', 'Por transportar produto sujeito à vigilância sanitária junto com carga incompatível ou perigosa, sem segregação.', f'{L}, art. 46, c/c {A28}, inciso II, alínea c, e Resolução ANTT nº 5.998/2022, art. 2º.', TRANSP),
 (G9, 'p35', P + 'Por transportar produto que exige temperatura controlada sem equipamento em funcionamento ou sem registro de temperatura.', f'{A28}, inciso II, alíneas a e m.', {'types': ['transportadora'], 'flagsAll': ['temp']}),
 (G9, 'p139', 'Por não qualificar termicamente o compartimento ou a embalagem usados no transporte de produto com temperatura controlada.', f'{L}, art. 46, c/c {A28}, inciso II, alínea a.', {'types': ['transportadora'], 'flagsAll': ['temp']}),
 (G9, 'p140', 'Por não registrar coleta e entrega com remetente, destinatário, identificação e quantidade da carga, datas e documento fiscal.', f'{L}, art. 46.', TRANSP),
 # 10 — qualidade, reclamações e recolhimento
 (G10, 'p62', 'Por não dispor de sistema da qualidade estabelecido para as atividades de distribuição e armazenagem.', f'{L}, art. 46, c/c {A28}, inciso II, alínea i.', DIST),
 (G10, 'p54', 'Por não dispor de sistema formal de investigação de desvios de qualidade, com medidas preventivas e corretivas.', f'{A28}, inciso II, alínea h.', NAO_FAB),
 (G10, 'p55', 'Por não dispor de programa de autoinspeção com abrangência, frequência e responsáveis definidos.', f'{A28}, inciso II, alínea e.', NAO_FAB),
 (G10, 'p38', 'Por não registrar, investigar ou arquivar reclamações sobre desvio de qualidade.', B('item 6.1'), FAB),
 (G10, 'p132', 'Por não designar responsável nem procedimento escrito para as reclamações, ou não revisar periodicamente seus registros.', B('itens 6.3, 6.4 e 6.6'), FAB),
 (G10, 'p41', 'Por não manter sistema de cosmetovigilância.', f'{L}, art. 55, c/c {R48}, item 6.7, e RDC Anvisa nº 894/2024, art. 6º.', FAB),
 (G10, 'p144', 'Por não registrar nem encaminhar ao titular da regularização as reclamações e os eventos adversos recebidos, ou por não notificar à vigilância sanitária o evento adverso com dano à saúde.', f'{L}, art. 55.', DIST),
 (G10, 'p134', 'Por não dispor de responsável e procedimento para devoluções, ou destinar produto devolvido sem inspeção ou análise registrada.', B('itens 8.1 a 8.4'), FAB),
 (G10, 'p36', P + 'Por não dispor de sistema capaz de recolher produto do mercado, ou por não executar o recolhimento determinado.', T3(B('item 7.1'), f'{L}, art. 46, c/c {A28}, inciso II, alínea d.'), FAB_DIST),
 (G10, 'p135', 'Por não designar responsável pelo recolhimento nem manter procedimentos escritos e atualizados, com o destino dos produtos recolhidos.', B('itens 7.2 e 7.3'), FAB),
 (G10, 'p37', 'Por deixar de comunicar à autoridade sanitária a decisão de recolhimento de produto.', B('item 7.4'), FAB),
 (G10, 'p136', 'Por não fazer a reconciliação entre as quantidades distribuída e recolhida, com relatório final.', B('item 7.5'), FAB),
 # 11 — pessoal, higiene, pragas e resíduos
 (G11, 'p43', 'Por manter pessoal sem capacitação documentada para as atividades desempenhadas.', T3(B('itens 11.3 e 11.6'), f'{L}, art. 46, c/c {A28}, inciso II, alínea b.')),
 (G11, 'p44', P + 'Por não dispor de controle de pragas, ou por aplicar agentes químicos que afetem a qualidade do produto.', T3(B('itens 12.8, 12.10 e 15.4'), f'{L}, art. 46, c/c {A28}, inciso II, alínea c.'), FAB_DIST),
 (G11, 'p45', 'Por não dispor de plano de gerenciamento de resíduos ou dar destinação irregular a resíduos, efluentes ou embalagens.', T3(f'{L}, art. 31, c/c {R48}, item 17.21.', f'{L}, art. 31, c/c {A28}, inciso II, alínea j.'), FAB_DIST),
 (G11, 'p46', 'Por não fornecer equipamento de proteção individual compatível com a atividade.', B('item 5.8'), FAB),
 (G11, 'p47', 'Por permitir consumo de alimentos ou bebidas em área de produção, armazenamento ou controle de qualidade.', B('item 5.9'), FAB),
]

# verificação → infrações que o seu descumprimento configura (sugeridas pela resposta “Não”)
LIGA = {
 'l1': ['p01', 'p02'], 'l9': ['p02'], 'l3': ['p03', 'p04'], 'l4': ['p03'], 'l5': ['p05'], 'l6': ['p06'], 'l7': ['p07'],
 'l8': ['p48'], 'l10': ['p56'],
 'r1': ['p09'], 'r1ivd': ['p09'], 'r2': ['p10'], 'r3': ['p11'], 'r4': ['p12', 'p13'], 'r5': ['p14', 'p15'], 'r6': ['p15', 'p154', 'p155'],
 # fabricante
 'fgq1': ['p16'], 'fgq2': ['p89'], 'fgq3': ['p17'], 'fgq4': ['p90'], 'fgq5': ['p91'], 'fgq6': ['p92'], 'fgq7': ['p92'], 'fgq8': ['p93'],
 'fp1': ['p94'], 'fp2': ['p95'], 'fp3': ['p43'], 'fp4': ['p96'], 'fp5': ['p25'], 'fp7': ['p94'],
 'fs1': ['p97'], 'fs2': ['p98'], 'fs3': ['p23'], 'fs4': ['p99'], 'fs5': ['p46'], 'fs6': ['p47'], 'fs7': ['p100'],
 'fi1': ['p101'], 'fi2': ['p19'], 'fi3': ['p102'], 'fi4': ['p19'], 'fi5': ['p44'], 'fi6': ['p103'], 'fi7': ['p44'], 'fi8': ['p104'],
 'fx11': ['p105'], 'fx12': ['p105'], 'fx13': ['p105'], 'fx14': ['p106'],
 'fw1': ['p20'], 'fw2': ['p107'], 'fw3': ['p107'], 'fw4': ['p20'], 'fw5': ['p108'],
 'fm1': ['p109'], 'fm2': ['p28'], 'fm3': ['p19'], 'fm4': ['p44'], 'fm5': ['p26'], 'fm6': ['p29'], 'fm7': ['p110'], 'fm8': ['p84'],
 'fm9': ['p51'], 'fm10': ['p32'], 'fm11': ['p112'], 'fm12': ['p112'], 'fm13': ['p113'],
 'fn1': ['p114'], 'fn2': ['p114'], 'fn3': ['p114'], 'fn4': ['p114'], 'fn5': ['p114'],
 'fpr1': ['p115'], 'fpr2': ['p116'], 'fpr3': ['p117'], 'fpr4': ['p118'], 'fpr5': ['p26'], 'fpr6': ['p119', 'p18'], 'fpr7': ['p120'],
 'fpr8': ['p27'], 'fpr9': ['p121'], 'fpr10': ['p122'],
 'fcq1': ['p21'], 'fcq2': ['p123'], 'fcq3': ['p124'], 'fcq4': ['p125'], 'fcq5': ['p126'], 'fcq6': ['p127'], 'frt1': ['p22'],
 'fo1': ['p128'], 'fo2': ['p128'], 'fo3': ['p129'], 'fo4': ['p130'], 'fo5': ['p18'], 'fo6': ['p18'], 'fo7': ['p131'],
 'fr1': ['p38'], 'fr2': ['p132'], 'fr3': ['p132'], 'fr4': ['p132'], 'fr5': ['p41'],
 'fd1': ['p134'], 'fd2': ['p134'], 'fd3': ['p134'], 'fd4': ['p134'],
 'fx1': ['p36'], 'fx2': ['p135'], 'fx3': ['p135'], 'fx4': ['p37'], 'fx5': ['p136'], 'fx6': ['p29'],
 'fa1': ['p137'], 'fa2': ['p137'], 'fa3': ['p24'], 'fa4': ['p137'], 'fa5': ['p24'],
 # atacadista / distribuidor
 'df1': ['p49'], 'df5': ['p64'], 'df2': ['p65'], 'df4': ['p30', 'p65'], 'df6': ['p60'],
 'ds1': ['p66'], 'ds3': ['p28'], 'ds14': ['p59'], 'ds13': ['p32'], 'ds12': ['p44'], 'ds11': ['p58'], 'ds8': ['p57'], 'ds15': ['p143'],
 'ds4': ['p67'], 'ds2': ['p29'], 'ds6': ['p51'], 'ds7': ['p52'], 'ds5': ['p83', 'p30', 'p153'],
 'dq11': ['p62', 'p50'], 'dq12': ['p54'], 'dq13': ['p55'], 'dr1': ['p61'], 'dr3': ['p36'], 'dd3': ['p144'],
 'dd2': ['p43'], 'dd6': ['p63'], 'dd7': ['p45'],
 # dispositivos/IVD
 'dq1': ['p68'], 'dq2': ['p69'], 'dq3': ['p70'], 'dq4': ['p70'], 'dq5': ['p71'], 'dq6': ['p148'], 'dq7': ['p72'], 'dq8': ['p73'],
 'dq9': ['p74'], 'dq10': ['p75'],
 'ddc1': ['p76'], 'ddc2': ['p76'], 'ddc3': ['p76'], 'ddc4': ['p77'], 'ddc5': ['p42'],
 'di1': ['p78'], 'di2': ['p79'], 'di3': ['p80'], 'di4': ['p81'], 'di5': ['p152'], 'di6': ['p82'], 'di7': ['p149'], 'di8': ['p150'], 'di9': ['p151'],
 'da1': ['p83'], 'da2': ['p30'], 'da3': ['p30', 'p153'], 'da4': ['p83'], 'da5': ['p145'], 'da6': ['p31'], 'da7': ['p83'], 'da8': ['p31'],
 'da9': ['p146'], 'da12': ['p145'],
 'dc1': ['p85'], 'dc2': ['p147'], 'dc3': ['p40'], 'dc4': ['p39'], 'dc5': ['p86'], 'dc6': ['p40'],
 'dt1': ['p87'], 'dt2': ['p88'], 'dt3': ['p88'],
 # transportador
 'tv2': ['p53'], 'tv1': ['p138'], 'tv4': ['p33'], 'tv5': ['p34'], 'tv13': ['p142'], 'tv12': ['p64'], 'tv7': ['p48'],
 'tt1': ['p35'], 'tt2': ['p35'], 'tt3': ['p139'],
 'tr1': ['p140'], 'tr8': ['p49'], 'tr3': ['p54'], 'tr6': ['p50'], 'tr5': ['p43'], 'tr7': ['p55'],
}
infractions = []
for x in inf:
    g, id, t, l = x[:4]
    d = legal_de({'id': id, 'group': g, 'text': t}, l)
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
assert len(iids) == len(set(iids)), [k for k in iids if iids.count(k) > 1]
# toda verificação aponta ao menos uma infração existente; toda infração do roteiro é alcançada
assert set(LIGA) == set(ids), ('sem ligação', sorted(set(ids) - set(LIGA)), 'ligação órfã', sorted(set(LIGA) - set(ids)))
for k, v in LIGA.items():
    for x in v: assert x in iids, (k, x)
soltas = sorted(set(iids) - {x for v in LIGA.values() for x in v} - {'aut100', 'aut109'})
assert not soltas, ('infrações sem pergunta', soltas)
for s in sections:
    for it in s['items']: it['inf'] = LIGA[it['id']]
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
for o in [it for sec in sections for it in sec['items']] + infractions:
    o['legal'] = forma(o['legal'])
    if 'legalTipo' in o:
        o['legalTipo'] = {k: forma(v) for k, v in o['legalTipo'].items()}
        o['legal'] = o['legalTipo'].get('distribuidor') or o['legal']
json.dump(cfg, open(os.path.join(AQUI, 'config-revisado.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('seções', len(sections), 'itens', len(ids), 'infrações', len(infractions))
