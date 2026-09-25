"""Monta a estrutura dos 12 blocos do protótipo de Manipulação (somente visualização)."""
import json

import os
SP = os.path.dirname(os.path.abspath(__file__)) + '/'
D = json.load(open(SP + 'app-data-v1.json'))
REQ = {}
for c in D['cards'].values():
    for s in c['sections']:
        for r in s['requirements']:
            REQ[r['id']] = r


def short(ref):
    law = ref['law'].replace('RDC nº 67/2007', 'RDC 67/2007').replace('RDC ANVISA nº', 'RDC').replace('RDC nº', 'RDC')
    dev = ref['device'].replace('Regulamento Técnico', 'RT').replace(' · Item ', ' · ')
    return law + ' · ' + dev


def q(rid, text=None, tag=None, refs=None, orient=None):
    r = REQ[rid]
    out = {'t': 'q', 'id': rid, 'text': text or r['text'], 'refs': refs or [short(x) for x in r.get('refs', [])]}
    if tag:
        out['tag'] = tag
    if text and text != r['text']:
        out['old'] = r['text']
    if orient:
        out['orient'] = orient
    return out


def nq(text, refs, tag='novo', orient=None):
    out = {'t': 'q', 'text': text, 'refs': refs, 'tag': tag}
    if orient:
        out['orient'] = orient
    return out


def note(text, kind='info'):
    return {'t': 'note', 'text': text, 'k': kind}


def fields(*f):
    return {'t': 'fields', 'f': [list(x) for x in f]}


def chips(title, opts, help=None, other=False):
    return {'t': 'chips', 'title': title, 'opts': opts, 'help': help, 'other': other}


# Irregularidades gerais — checklist de infração (Irregular / Não se aplica)
G_AMB = [
    ['Paredes, piso ou teto com rachaduras, descascamento ou superfície não lavável', 'RDC 67/2007 · Anexo I · 4.13'],
    ['Infiltração, mofo ou umidade aparente', 'RDC 67/2007 · Anexo VII · 4.5'],
    ['Sujidade, poeira ou acúmulo de materiais sem uso', 'RDC 67/2007 · Anexo VII · 4.4'],
    ['Ralo sem sifão, sem tampa escamoteável ou danificado', 'RDC 67/2007 · Anexo I · 4.15'],
    ['Sem proteção contra insetos, roedores e poeira (telas, vedação de portas)', 'RDC 67/2007 · Anexo I · 4.11'],
    ['Vestígios de pragas', 'RDC 67/2007 · Anexo I · 4.12'],
    ['Instalação elétrica em mau estado (fios expostos, tomadas soltas, extensões)', 'RDC 67/2007 · Anexo VII · 4.7'],
    ['Vazamento ou instalação hidráulica / esgoto em mau estado', 'RDC 67/2007 · Anexo VII · 4.8'],
    ['Tubulação exposta sem identificação', 'RDC 67/2007 · Anexo I · 5.1.2'],
    ['Iluminação insuficiente ou ventilação inadequada', 'RDC 67/2007 · Anexo I · 4.16'],
    ['Desorganização com risco de troca ou mistura de materiais / fluxo inadequado', 'RDC 67/2007 · Anexo I · 4.14'],
    ['POP de limpeza e sanitização não disponível no local', 'RDC 67/2007 · Anexo I · 6'],
    ['Lixeira sem tampa', 'RDC 67/2007 · Anexo I · 6.2'],
    ['Lixeira sem abertura sem contato manual (pedal)', 'RDC 222/2018 · art. 17'],
    ['Lixeira sem identificação do grupo de resíduo', 'RDC 67/2007 · Anexo I · 6.2'],
    ['Mobiliário em excesso, danificado ou de material não lavável', 'RDC 67/2007 · Anexo I · 5.5'],
    ['Extintor ausente, vencido, sem sinalização ou com acesso obstruído', 'RDC 67/2007 · Anexo I · 4.18'],
]
G_LAB_EXTRA = [
    ['Alimentos, bebidas, objetos pessoais ou medicamentos de uso pessoal no laboratório', 'RDC 67/2007 · Anexo I · 3.3.4'],
    ['Pessoa sem paramentação completa no laboratório', 'RDC 67/2007 · Anexo I · 3.3.7'],
    ['Superfícies de trabalho não limpas antes/após a manipulação', 'RDC 67/2007 · Anexo I · 8.5'],
]
REG_LAB = [
    ['Sem registro de limpeza das bancadas', 'RDC 67/2007 · Anexo I · 8.5'],
    ['Sem registro de limpeza de equipamentos e utensílios', 'RDC 67/2007 · Anexo I · 6.1'],
    ['Sem registro de limpeza do exaustor / capela', 'RDC 67/2007 · Anexo I · 8.7'],
    ['Sem registro de troca de filtros do exaustor', 'RDC 67/2007 · Anexo I · 5.3'],
    ['Sem registro de temperatura e umidade da sala', 'RDC 67/2007 · Anexo I · 8.8'],
    ['Sem registro de verificação diária da balança', 'RDC 67/2007 · Anexo I · 5.2.2'],
    ['Sem registro de temperatura da geladeira', 'RDC 67/2007 · Anexo I · 7.4.3'],
]


def irreg(extra=None, title='Irregularidades gerais do ambiente'):
    return {'t': 'ncl', 'title': title, 'items': G_AMB + (extra or []), 'sub': 'Marque só o que foi constatado neste ambiente. O que não for marcado não entra no relatório.'}


def regs():
    return {'t': 'ncl', 'title': 'Registros e planilhas do laboratório', 'items': REG_LAB, 'sub': 'Registros que deveriam estar disponíveis neste laboratório.'}


EQ_IRR = [
    ['Ausente / não disponível neste laboratório', 'RDC 67/2007 · Anexo I · 5.1.1'],
    ['Sem calibração vigente (etiqueta ou certificado)', 'RDC 67/2007 · Anexo I · 5.2.1'],
    ['Sem registro da verificação diária', 'RDC 67/2007 · Anexo I · 5.2.2'],
    ['Capacidade ou sensibilidade incompatível', 'RDC 67/2007 · Anexo I · 5.1.3'],
    ['Fora do programa de manutenção preventiva', 'RDC 67/2007 · Anexo I · 5.3'],
    ['Sujo, com resíduos ou mal conservado', 'RDC 67/2007 · Anexo I · 6.1'],
    ['Instalado de forma que dificulta limpeza ou manutenção', 'RDC 67/2007 · Anexo I · 5.1'],
    ['Temperatura sem registro ou fora da faixa (geladeira)', 'RDC 67/2007 · Anexo I · 7.4.3'],
    ['Guarda de alimentos ou itens estranhos (geladeira)', 'RDC 67/2007 · Anexo I · 3.3.4'],
    ['Vidraria trincada, quebrada ou com graduação ilegível', 'RDC 67/2007 · Anexo I · 5.1.1'],
    ['Utensílios de uso interno e externo não diferenciados', 'RDC 67/2007 · Anexo I · 5.4.1'],
]


def equip(names):
    return {'t': 'equip', 'names': names, 'irr': EQ_IRR}


def obs(label='Observações gerais do item'):
    return {'t': 'obs', 'label': label}


def chk(key, title, items, sub=None):
    """Checklist Atende / Não atende / N/A. items: (texto afirmativo, frase negativa, citação ou None = informativo)."""
    return {'t': 'chk', 'key': key, 'title': title, 'sub': sub or 'Marque cada ponto conferido. Só “Não atende” em ponto com citação gera irregularidade; pontos sem citação são informativos.',
            'items': [{'id': '%s%02d' % (key, i + 1), 't': t, 'neg': n, 'ref': r or '', 'info': not r} for i, (t, n, r) in enumerate(items)]}


def ncl(key, title, items, sub=None):
    return {'t': 'ncl', 'key': key, 'title': title, 'items': items, 'sub': sub or 'Marque só o que foi constatado na amostragem.'}


A67 = 'RDC 67/2007 · Anexo I · '
R222 = 'RDC 222/2018 · art. '
P344 = 'Portaria 344/1998 · art. '

TREIN = [
    ('Documentação das atividades de capacitação realizadas', 'os registros de treinamento não documentam as atividades de capacitação realizadas', A67 + '3.2'),
    ('Data de realização e carga horária', 'os registros de treinamento não informam data de realização e carga horária', A67 + '3.2'),
    ('Conteúdo ministrado', 'os registros de treinamento não informam o conteúdo ministrado', A67 + '3.2'),
    ('Trabalhadores treinados e respectivas assinaturas', 'os registros de treinamento não identificam os trabalhadores treinados com as respectivas assinaturas', A67 + '3.2'),
    ('Identificação da equipe que ministrou cada treinamento', 'os registros de treinamento não identificam a equipe que ministrou cada atividade', A67 + '3.2'),
]
TREIN_CONT = [
    ('Instruções de higiene', 'o treinamento não contempla instruções de higiene', A67 + '3.2.1'),
    ('Instruções de saúde', 'o treinamento não contempla instruções de saúde', A67 + '3.2.1'),
    ('Instruções de conduta', 'o treinamento não contempla instruções de conduta', A67 + '3.2.1'),
    ('Elementos básicos de microbiologia', 'o treinamento não contempla elementos básicos de microbiologia', A67 + '3.2.1'),
]
PGRSS = [
    ('Estimativa da quantidade de RSS gerados, por grupo', 'o PGRSS não estima a quantidade de RSS gerados por grupo', R222 + '6º, I'),
    ('Procedimentos de geração, segregação, acondicionamento, identificação, coleta, armazenamento, transporte, tratamento e disposição final', 'o PGRSS não descreve todas as etapas do manejo dos RSS', R222 + '6º, II'),
    ('Conformidade com ações de proteção à saúde pública, do trabalhador e do meio ambiente', 'o PGRSS não contempla as ações de proteção à saúde pública, do trabalhador e do meio ambiente', R222 + '6º, III'),
    ('Conformidade com a regulamentação sanitária e ambiental e com as normas da coleta municipal', 'o PGRSS não está conforme a regulamentação sanitária e ambiental e as normas da coleta municipal', R222 + '6º, IV'),
    ('Procedimentos de logística reversa, quando aplicável', 'o PGRSS não contempla os procedimentos de logística reversa aplicáveis', R222 + '6º, V'),
    ('Compatibilidade com as rotinas de higienização e limpeza do serviço', 'o PGRSS não é compatível com as rotinas de higienização e limpeza vigentes', R222 + '6º, VI'),
    ('Ações em situações de emergência e acidentes', 'o PGRSS não descreve as ações em situações de emergência e acidentes', R222 + '6º, VII'),
    ('Medidas de controle integrado de vetores e pragas (tecnologia e periodicidade)', 'o PGRSS não descreve as medidas de controle integrado de vetores e pragas', R222 + '6º, VIII'),
    ('Programas de capacitação, inclusive do setor de limpeza e conservação', 'o PGRSS não descreve os programas de capacitação', R222 + '6º, IX'),
    ('Comprovante de capacitação dos funcionários de limpeza e conservação (guarda de 5 anos)', 'não foi apresentado comprovante de capacitação dos funcionários de limpeza e conservação', R222 + '6º, X e parágrafo único'),
    ('Cópia do contrato e da licença ambiental das empresas de coleta e destinação', 'não foi apresentada cópia do contrato e da licença ambiental das empresas de coleta e destinação', R222 + '6º, XI'),
    ('Comprovante de venda ou doação de RSS para reciclagem ou logística reversa, quando houver (guarda de 5 anos)', 'não foi apresentado comprovante de venda ou doação de RSS destinados a reciclagem ou logística reversa', R222 + '6º, XII e parágrafo único'),
]
DML = [
    ('Local especificamente designado e identificado', 'o local de guarda do material de limpeza não é especificamente designado e identificado', A67 + '4.10'),
    ('Materiais de limpeza e germicidas guardados só nesse local, sem contato com matérias-primas, embalagens ou produtos', 'materiais de limpeza e germicidas estavam fora do local designado ou junto de matérias-primas, embalagens ou produtos', A67 + '4.10'),
    ('Saneantes em uso regularizados na Anvisa (notificados ou registrados)', 'havia saneante em uso sem regularização na Anvisa', 'Lei 6.360/1976 · art. 12'),
    ('Saneantes fracionados ou diluídos com rótulo (produto, diluição, data)', 'havia saneante fracionado ou diluído sem identificação', None),
    ('Panos, baldes e mops separados por área (laboratórios × áreas comuns)', 'panos, baldes e mops não são separados por área', None),
    ('Material de limpeza limpo e em bom estado', 'o material de limpeza estava sujo ou mal conservado', None),
]
LAV = [
    ('Pia e bancada de material liso, impermeável, resistente e de fácil limpeza', 'a pia ou a bancada da área de lavagem não é de material liso, impermeável, resistente e de fácil limpeza', A67 + '4.13'),
    ('Utensílios de uso interno diferenciados dos de uso externo', 'os utensílios de uso interno não são diferenciados dos de uso externo', A67 + '5.4.1'),
    ('Utensílios identificados para uso interno e externo', 'os utensílios não são identificados para uso interno e externo', A67 + '5.4.2'),
    ('Utensílios de hormônios, antibióticos e citostáticos separados e identificados por classe terapêutica', 'os utensílios não são separados e identificados por classe terapêutica', 'RDC 67/2007 · Anexo III · 2.10'),
    ('Caixa de transporte identificada para os utensílios de cada laboratório', 'não há caixa de transporte identificada para os utensílios de cada laboratório', A67 + '8.6'),
    ('Detergente líquido disponível', 'não havia detergente líquido na área de lavagem', None),
    ('Panos ou papel descartáveis para secagem', 'a secagem não é feita com panos ou papel descartáveis', None),
    ('Estufa para secagem de utensílios e vidrarias', 'não há estufa para secagem de utensílios e vidrarias', None),
    ('Utensílios limpos guardados protegidos, separados dos sujos', 'utensílios limpos não estavam guardados protegidos e separados dos sujos', A67 + '5.1.1'),
]
SAN = [
    ('Fácil acesso', 'o sanitário não é de fácil acesso', A67 + '4.8'),
    ('Sem comunicação direta com armazenamento, manipulação e controle de qualidade', 'o sanitário tem comunicação direta com área de armazenamento, manipulação ou controle de qualidade', A67 + '4.8'),
    ('Toalha de uso individual (descartável)', 'o sanitário não dispõe de toalha descartável', A67 + '4.8'),
    ('Detergente líquido', 'o sanitário não dispõe de detergente líquido', A67 + '4.8'),
    ('Lixeira identificada, com pedal e tampa', 'o sanitário não dispõe de lixeira identificada com pedal e tampa', A67 + '4.8'),
    ('Limpo e em bom estado de conservação', 'o sanitário estava sujo ou mal conservado', 'RDC 67/2007 · Anexo VII · 4.4'),
    ('Papel higiênico disponível', 'não havia papel higiênico', None),
]
QUIM = [
    ('Periculosidade dos produtos químicos identificada (FISPQ disponível para corrosivos, cáusticos, inflamáveis, reativos e tóxicos)', 'a periculosidade dos produtos químicos não é identificada (FISPQ indisponível)', R222 + '56 e parágrafo único'),
    ('Resíduos químicos líquidos não são lançados na pia ou na rede de esgoto sem tratamento', 'resíduos químicos líquidos são descartados na pia ou na rede de esgoto sem tratamento', R222 + '58'),
    ('Acondicionados em recipientes compatíveis, rígidos, estanques e tampados', 'resíduos químicos não são acondicionados em recipientes compatíveis, rígidos, estanques e tampados', R222 + '18 e 19'),
    ('Recipientes identificados com a simbologia de risco', 'os recipientes de resíduos químicos não têm a identificação de risco', R222 + '22 e Anexo II'),
    ('Incompatibilidades químicas respeitadas (ex.: ácidos × bases, oxidantes × inflamáveis)', 'resíduos químicos incompatíveis são acondicionados juntos', R222 + '60'),
    ('Embalagens e materiais contaminados manejados como o produto que os contaminou', 'embalagens e materiais contaminados por produto químico não recebem o mesmo manejo do produto', R222 + '61'),
    ('Destinação por empresa licenciada: sólidos perigosos para aterro Classe I, líquidos tratados antes da disposição', 'não há comprovação de destinação adequada dos resíduos químicos perigosos', R222 + '57 e 58'),
]
ABT = [
    ('Piso e paredes de material resistente, lavável e impermeável', 'o abrigo temporário não tem piso e paredes de material resistente, lavável e impermeável', R222 + '29, I'),
    ('Iluminação artificial, ponto de água, tomada alta e ralo sifonado com tampa', 'o abrigo temporário não tem iluminação, ponto de água, tomada alta ou ralo sifonado com tampa', R222 + '29, II'),
    ('Ventilação com tela contra roedores e vetores (se houver abertura)', 'a ventilação do abrigo temporário não tem tela contra roedores e vetores', R222 + '29, III'),
    ('Porta compatível com as dimensões dos coletores', 'a porta do abrigo temporário não é compatível com os coletores', R222 + '29, IV'),
    ('Identificado como “ABRIGO TEMPORÁRIO DE RESÍDUOS”', 'o abrigo temporário não está identificado', R222 + '29, V'),
    ('Sacos dentro de coletores com tampa fechada', 'havia sacos fora de coletores ou coletores abertos no abrigo temporário', R222 + '27'),
]
ABE = [
    ('Fácil acesso ao transporte interno', 'o abrigo externo não permite fácil acesso ao transporte interno', R222 + '35, I'),
    ('Fácil acesso aos veículos de coleta externa', 'o abrigo externo não permite fácil acesso aos veículos de coleta', R222 + '35, II'),
    ('Capacidade para ao menos uma coleta perdida', 'o abrigo externo não comporta o volume de uma coleta regular não realizada', R222 + '35, III'),
    ('Piso, paredes e teto resistentes, laváveis e de fácil higienização, com ventilação telada', 'o abrigo externo não tem piso, paredes e teto laváveis ou ventilação com tela', R222 + '35, IV'),
    ('Identificado conforme os grupos de RSS armazenados', 'o abrigo externo não está identificado conforme os grupos de RSS', R222 + '35, V'),
    ('Acesso restrito às pessoas do manejo', 'o abrigo externo não tem acesso restrito', R222 + '35, VI'),
    ('Porta abrindo para fora, com proteção inferior contra roedores', 'a porta do abrigo externo não abre para fora ou não tem proteção inferior contra roedores', R222 + '35, VII'),
    ('Ponto de iluminação', 'o abrigo externo não tem ponto de iluminação', R222 + '35, VIII'),
    ('Canaletas para a rede de esgoto com ralo sifonado com tampa', 'o abrigo externo não tem canaletas com ralo sifonado', R222 + '35, IX'),
    ('Área coberta com ponto de água para higienização dos coletores', 'não há área coberta com ponto de água para higienização dos coletores', R222 + '35, XI'),
    ('Coletores tampados, sem sacos no chão', 'havia coletores abertos ou sacos fora dos coletores no abrigo externo', R222 + '27 e 37'),
    ('Grupo B: segregação por incompatibilidade química', 'no abrigo do Grupo B não há segregação por incompatibilidade química', R222 + '36, I'),
    ('Grupo B: simbologia de risco', 'o abrigo do Grupo B não tem a simbologia de risco', R222 + '36, II'),
    ('Grupo B: caixa de retenção ou contenção para líquidos', 'o abrigo do Grupo B não tem caixa de retenção para líquidos', R222 + '36, III'),
    ('Grupo B: sistema elétrico e de combate a incêndio adequados', 'o abrigo do Grupo B não tem sistema elétrico e de combate a incêndio adequados', R222 + '36, IV'),
]
ROD = [  # detalhe da pergunta do rodízio (n053): informativo, para não duplicar a irregularidade
    ('Diferentes manipuladores', 'as amostras não contemplam rodízio de manipuladores', None),
    ('Diferentes fármacos (fórmulas)', 'as amostras não contemplam rodízio de fármacos', None),
    ('Diferentes dosagens / concentrações', 'as amostras não contemplam rodízio de dosagens ou concentrações', None),
    ('Diferentes formas farmacêuticas', 'as amostras não contemplam rodízio de formas farmacêuticas', None),
    ('Registro de qual manipulador preparou cada amostra enviada', 'não há registro do manipulador de cada amostra enviada', None),
]

BLOCKS = []


def block(title, sub, items, cond=None):
    BLOCKS.append({'n': len(BLOCKS) + 1, 'title': title, 'sub': sub, 'items': items, 'cond': cond})


def item(code, title, parts, origin=None, cond=None):
    return {'code': code, 'title': title, 'parts': parts, 'origin': origin, 'cond': cond}


# ───────────────────────── 1 IDENTIFICAÇÃO E CARACTERIZAÇÃO
block('Identificação e caracterização', 'Dados, autorizações e perfil das atividades', [
    item('1.1', 'Identificação', [
        fields(('Razão social', 'Conforme CNPJ', 2), ('CNPJ', '00.000.000/0000-00', 1), ('Nome fantasia', '', 2), ('CEVS / Licença sanitária nº', '', 1),
               ('Endereço completo', '', 3), ('Responsável técnico', '', 2), ('CRF-SP nº', '', 1), ('Responsável legal', '', 2), ('Telefone / e-mail', '', 1)),
        {'t': 'doc', 'labels': ['📄 Ler licença sanitária', '📄 Ler CRT/CRF', '📄 Ler AFE', '📄 Ler AE']},
        fields(('AFE nº', '', 1), ('AFE publicada em', 'dd/mm/aaaa', 1), ('Atividades da AFE', '', 1), ('AE nº', '', 1), ('AE publicada em', 'dd/mm/aaaa', 1), ('Classes da AE', '', 1)),
        chips('Atividades licenciadas (licença sanitária)', ['Manipular', 'Fracionar', 'Dispensar', 'Armazenar', 'Grupo I', 'Grupo II', 'Grupo III', 'Grupo V', 'Serviços farmacêuticos', 'Dispensação de industrializados'], other=True),
        note('As três perguntas abaixo eram o item 1.2 “AFE / AE”. Ficam aqui, logo depois dos dados de AFE/AE, sem tela própria.', 'mov'),
        q('r001'), q('r002'), q('r003'),
        q('r175', text='Apresentou Certidão de Regularidade Técnica do CRF vigente, em nome do responsável técnico?'),
        obs(),
    ], origin='Antigo 1.1 renomeado; recebe as perguntas do antigo 1.2 AFE/AE.'),
    item('1.2', 'Caracterização', [
        note('Caracterize a atividade por seleção. Essas informações são consolidadas no relatório; C/NC/NA fica apenas nos requisitos técnicos do roteiro.', 'info'),
        chips('Grupos de atividade — RDC 67/2007 · Regulamento Técnico · item 3', ['I', 'II', 'III', 'V'],
              help='I — insumos, inclusive de origem vegetal. II — substâncias de baixo índice terapêutico. III — antibióticos, hormônios, citostáticos e substâncias sujeitas a controle especial. V — preparações homeopáticas. Cada grupo marcado abre o anexo correspondente.'),
        chips('Preparações', ['Homeopáticas', 'Fitoterápicas', 'Alopáticas', 'Oficinais', 'Prepara auto-isoterápicos']),
        chips('Categorias alopáticas', ['Hormônios', 'Antibióticos gerais', 'Penicilínicos', 'Cefalosporínicos', 'Citostáticos', 'Sujeitas a controle especial']),
        chips('Formas farmacêuticas', ['Sólidas', 'Semissólidas', 'Líquidas']),
        chips('Outras atividades e insumos', ['Dispensa industrializados', 'Serviços farmacêuticos', 'Entregas em domicílio', 'Venda remota', 'Matéria-prima vegetal', 'Produtos químicos controlados (PF/PC/Exército)']),
        chips('Baixo índice terapêutico manipulado (Anexo II · 2.3)', ['Ácido valproico', 'Aminofilina', 'Carbamazepina', 'Ciclosporina', 'Clindamicina', 'Clonidina', 'Clozapina', 'Colchicina', 'Digitoxina', 'Digoxina', 'Disopiramida', 'Fenitoína', 'Lítio', 'Minoxidil', 'Oxcarbazepina', 'Prazosina', 'Primidona', 'Procainamida', 'Quinidina', 'Teofilina', 'Varfarina', 'Verapamil'], other=True),
        chips('Bases galênicas utilizadas', ['Creme não iônico', 'Creme aniônico', 'Gel de natrosol', 'Gel de carbopol', 'Loção', 'Pomada', 'Xarope simples', 'Veículo oral', 'Shampoo base'], other=True),
        chips('Excipientes padronizados', ['Celulose microcristalina', 'Amido', 'Lactose', 'Talco', 'Estearato de magnésio', 'Dióxido de silício', 'Excipiente padrão SBIT'], other=True),
        chips('Áreas existentes no estabelecimento', ['Administrativa', 'Armazenamento / almoxarifado', 'Controle de qualidade', 'Pesagem', 'Lab. sólidos', 'Lab. semissólidos e líquidos', 'Cabine de hormônios', 'Cabine de antibióticos', 'Cabine de citostáticos', 'Homeopatia', 'Dispensação', 'Paramentação', 'Vestiário', 'Sanitários', 'Lavagem', 'DML', 'Copa / refeitório', 'Área de descanso', 'Abrigo de resíduos'],
              help='As áreas marcadas aqui definem quais itens aparecem nos blocos Áreas físicas e Laboratórios.'),
        note('Duas perguntas vieram do extinto item “Edificação e instalações”.', 'mov'),
        q('r021'), q('r027'),
        fields(('Nº de funcionários', '', 1), ('Nº de farmacêuticos', '', 1), ('Horário de funcionamento', '', 1), ('Média de fórmulas/dia', '', 1), ('Sistema informatizado', '', 1), ('Filiais', '', 1)),
        obs(),
    ], origin='Novo item (antigo 1.2 AFE/AE foi absorvido pelo 1.1).'),
])

# ───────────────────────── 2 DOCUMENTAÇÃO
DOCS = [('r176', None), ('r177', None), ('r178', None), ('r179', None), ('r180', None), ('r182', None), ('r184', None), ('r185', None),
        ('r065', None), ('r190', None), ('r191', None), ('r193', None), ('r195', None), ('r201', None)]
block('Documentação', 'Documentos, POPs, treinamento e planilhas', [
    item('2.1', 'Documentos apresentados', [
        note('Antigo 6.1. Saíram daqui, por redundância: AFE/AE (já no 1.1), PGRSS e SPRegula (bloco Resíduos), mapas/balanços e Livro de Receituário (bloco Receitas), contrato de laboratório (bloco Monitoramento), programa de treinamento (item 2.3).', 'mov'),
        {'t': 'docs', 'rows': [{'text': REQ[r]['text'], 'refs': [short(x) for x in REQ[r].get('refs', [])]} for r, _ in DOCS]},
        q('r183', text='Apresentou PGRSS compatível com as atividades e os resíduos gerados?', refs=['RDC 67/2007 · RT · 5.2', 'RDC 222/2018 · art. 5º']),
        chk('pgrss', 'Conteúdo do PGRSS', PGRSS, 'Confira no documento. Um ponto ausente gera irregularidade própria, com o inciso do art. 6º.'),
        q('r186', text='Apresentou cadastro de gerador de resíduos (SPRegula)? Registre o número.'),
        nq('A coleta e a destinação são feitas por empresa licenciada, com comprovantes (CTR/manifesto) dos últimos meses?', ['RDC 222/2018 · art. 5º']),
        obs(),
    ], origin='Antigo 6.1 + documentos de resíduos'),
    item('2.2', 'Procedimentos Operacionais Padrão', [
        {'t': 'pops', 'groups': [{'code': p['code'], 'title': p['title'], 'rows': [r['name'] for r in p['rows']]} for p in D['pops']]},
        obs(),
    ], origin='Antigo 6.2'),
    item('2.3', 'Treinamento', [
        note('Saiu do bloco Pessoal e saúde ocupacional.', 'mov'),
        q('r016', text='Há programa de treinamento de todo o pessoal, elaborado com base em levantamento de necessidades?'),
        chk('trein', 'Registros de treinamento', TREIN),
        q('r017', text='Todo o pessoal, inclusive de limpeza e manutenção, recebeu treinamento inicial e continuado?'),
        chk('treic', 'Conteúdo do treinamento inicial e continuado', TREIN_CONT),
        q('r018'), q('r019'), q('r020'),
        obs(),
    ], origin='Antigo 5.1'),
    item('2.4', 'Planilhas e registros', [
        note('Lista por níveis: cada grupo abre e mostra o que conferir. Marque “Parcial” quando existe planilha, mas incompleta; o que não se aplica não gera NC.', 'info'),
        {'t': 'plan'},
    ], origin='Novo formato da lista de planilhas (antes era uma lista única).'),
])

# ───────────────────────── 3 PESSOAL
block('Pessoal e saúde ocupacional', 'Equipe, ASO, higiene, EPI e conduta', [
    item('3.1', 'Pessoal e saúde ocupacional', [
        q('r004'), q('r005'), q('r006'), q('r007'), q('r008'), q('r009'), q('r010'), q('r011'), q('r012'),
        q('r014'), q('r015'),
        obs(),
    ], origin='Antigo 5 (Treinamento saiu para Documentação).'),
    item('3.2', 'Atestados de saúde ocupacional — ASO', [
        note('Item novo. Conferência por amostragem dos funcionários da manipulação.', 'new'),
        nq('Foram apresentados os ASO admissionais dos funcionários amostrados?', ['RDC 67/2007 · Anexo I · 3.3.1']),
        nq('Os ASO periódicos estão dentro da periodicidade definida no PCMSO?', ['RDC 67/2007 · Anexo I · 3.3.1']),
        nq('Os ASO atestam aptidão para a função efetivamente exercida?', ['RDC 67/2007 · Anexo I · 3.3.1']),
        nq('Para quem manipula hormônios, antibióticos, citostáticos ou controlados, o ASO contempla os exames específicos previstos no PCMSO?', ['RDC 67/2007 · Anexo III · 2.12']),
        {'t': 'table', 'title': 'Funcionários amostrados', 'cols': ['Função', 'Iniciais', 'ASO admissional (data)', 'Último ASO periódico (data)', 'Apto?'], 'rows': 3},
        obs(),
    ]),
])

# ───────────────────────── 4 RESÍDUOS
block('Resíduos', 'Segregação, descarte, DML e abrigo', [
    item('4.1', 'Segregação e descarte', [
        note('Verificação física. O PGRSS, o cadastro de gerador e os comprovantes de coleta são conferidos em Documentação (2.1).', 'info'),
        nq('Os resíduos de medicamentos e insumos hormonais, antimicrobianos, citostáticos e demais do art. 59 são segregados e destinados como resíduo químico (Grupo B)?', ['RDC 222/2018 · art. 59']),
        nq('Insumos e produtos vencidos, reprovados ou devolvidos aguardam descarte segregados e identificados?', ['RDC 67/2007 · Anexo I · 4.2.4']),
        nq('O lixo e os resíduos da manipulação são esvaziados fora da área de manipulação?', ['RDC 67/2007 · Anexo I · 6.2']),
        chk('quim', 'Resíduos químicos perigosos — manejo e descarte', QUIM),
        obs(),
    ]),
    item('4.2', 'DML — Depósito de material de limpeza', [
        note('DML saiu de “DML, sanitários e paramentação” (Áreas físicas) e entra aqui no lugar do antigo item “armazenamento” da Drogaria.', 'mov'),
        chk('dml', 'DML — condições', DML),
        nq('Há local para lavagem dos materiais de limpeza?', ['RDC 67/2007 · Anexo I · 4.10']),
        irreg(),
        obs(),
    ]),
    item('4.3', 'Abrigo temporário de resíduos', [
        chk('abt', 'Abrigo temporário — requisitos', ABT),
        irreg(),
        obs(),
    ]),
    item('4.4', 'Abrigo externo de resíduos', [
        chk('abe', 'Abrigo externo — requisitos', ABE, 'Os pontos “Grupo B” valem para o abrigo de resíduos químicos. Em abrigo do condomínio ou shopping, avalie o que for usado pela farmácia.'),
        irreg(),
        obs(),
    ]),
])

# ───────────────────────── 5 ÁREAS FÍSICAS
block('Áreas físicas', 'Dispensação, apoio, almoxarifado e lavagem', [
    item('5.1', 'Recepção e dispensação', [q('r030'), q('r031'), q('r032'), q('r033'), q('r034'), irreg(), obs()], origin='Antigo 4.1'),
    item('5.2', 'Dispensação de industrializados', [q('r037'), q('r038'), q('r039'), q('r040'), q('r041'), irreg(), obs()], origin='Antigo 4.2', cond='Dispensa industrializados'),
    item('5.3', 'Sala de serviços farmacêuticos', [q('r044'), q('r045'), q('r046'), q('r047'), q('r048'), q('r049'), q('r050'), q('r051'), irreg(), obs()], origin='Antigo 4.3', cond='Serviços farmacêuticos'),
    item('5.4', 'Sanitários', [{'t': 'unid', 'key': 'san', 'title': 'Sanitários', 'items': chk('san', '', SAN)['items']}, irreg(), obs()], origin='Separado do antigo 4.5'),
    item('5.5', 'Vestiários', [q('r059'), nq('O vestiário tem armários para guarda de pertences e é separado das áreas de manipulação?', ['RDC 67/2007 · Anexo I · 4.8']), irreg(), obs()], origin='Separado do antigo 4.5'),
    item('5.6', 'Copa / refeitório', [
        nq('A copa/refeitório é separada dos demais ambientes?', ['RDC 67/2007 · Anexo I · 4.17'], tag='novo'),
        nq('A geladeira da copa é de uso exclusivo para alimentos (sem medicamentos, insumos ou amostras)?', ['RDC 67/2007 · Anexo I · 3.3.4'], tag='novo'),
        irreg(), obs()], origin='Item novo', cond='Copa / refeitório'),
    item('5.7', 'Área de descanso', [
        nq('A área de descanso é separada dos demais ambientes e não é usada para guarda de materiais?', ['RDC 67/2007 · Anexo I · 4.17'], tag='novo'),
        irreg(), obs()], origin='Item novo', cond='Área de descanso'),
    item('5.8', 'Almoxarifado / armazenamento', [
        note('Saiu de Laboratórios. As duas perguntas de pesagem (r088/r089) foram para Laboratórios — ver consideração no plano.', 'mov'),
        q('r078'), q('r079'), q('r080'), q('r081'), q('r082'), q('r252'), q('r083'), q('r084'), q('r085'), q('r086'),
        q('r187'), q('r254'), q('r087'), q('r090'), q('r091'),
        equip(['Geladeira', 'Termo-higrômetro']),
        irreg(), obs()], origin='Antigo 4.7 (Laboratórios)'),
    item('5.9', 'Área de lavagem', [q('r092'), q('r093'), chk('lav', 'Área de lavagem — condições', LAV), irreg(), obs()], origin='Antigo 4.8 (Laboratórios)'),
])

# ───────────────────────── 6 LABORATÓRIOS
LAB_CQ = ['Balança analítica', 'pHmetro', 'Aparelho de ponto de fusão', 'Pesos padrão', 'Picnômetro / densímetro', 'Estufa', 'Vidrarias graduadas', 'Termo-higrômetro', 'Capela de exaustão']
LAB_SOL = ['Balança analítica', 'Balança semianalítica', 'Encapsuladora', 'Termo-higrômetro', 'Sistema de exaustão / capela', 'Utensílios (espátulas, gral e pistilo)', 'Vidrarias graduadas']
LAB_SEMI = ['Balança semianalítica', 'Agitador / misturador', 'Chapa aquecedora / banho-maria', 'pHmetro', 'Geladeira', 'Termo-higrômetro', 'Vidrarias graduadas', 'Utensílios (espátulas, gral e pistilo)']
block('Laboratórios', 'Paramentação, CQ, pesagem e salas de manipulação', [
    item('6.1', 'Paramentação', [q('r060'), q('r061'), q('r062'), irreg(), obs()], origin='Saiu de Áreas físicas (antigo 4.5)'),
    item('6.2', 'Controle de qualidade', [q('r067'), q('r068'), q('r069'), q('r070'), q('r071'), q('r072'), q('r073'), q('r074'), q('r075'), q('r076'), q('r077'),
                                          equip(LAB_CQ), irreg(G_LAB_EXTRA), regs(), obs()], origin='Antigo 4.6'),
    item('6.3', 'Pesagem', [q('r088'), q('r089'), equip(['Balança analítica', 'Balança semianalítica', 'Sistema de exaustão']), irreg(G_LAB_EXTRA), regs(), obs()], origin='Perguntas que estavam no Almoxarifado'),
    item('6.4', 'Semissólidos e líquidos', [q('r095'), q('r096'), q('r097'), q('r098'), q('r099'), q('r100'), q('r101'),
                                            equip(LAB_SEMI), irreg(G_LAB_EXTRA), regs(), obs()], origin='Antigo 4.9', cond='Semissólidas ou líquidas'),
    item('6.5', 'Sólidos', [q('r102'), q('r103'), q('r104'), q('r105'), q('r106'), q('r107'), q('r108'), q('r110'), q('r111'), q('r112'), q('r243'),
                            note('r109 (peso médio com DP e CV) foi para Rastreabilidade e CQ, junto com os ensaios do item 9.1.1.', 'mov'),
                            equip(LAB_SOL), irreg(G_LAB_EXTRA), regs(), obs()], origin='Antigo 4.10', cond='Sólidas'),
])

# ───────────────────────── 7 SBIT / SENSIBILIZANTES / HOMEOPATIA
SENS_EQ = ['Balança de uso exclusivo', 'Manômetro de diferencial de pressão', 'Encapsuladora', 'Termo-higrômetro']
block('Baixo índice terapêutico, sensibilizantes e homeopatia', 'Anexos II, III e V da RDC 67/2007', [
    item('7.1', 'Substâncias de baixo índice terapêutico', [q(r) for r in ['r156', 'r157', 'r158', 'r159', 'r160', 'r161', 'r162', 'r163', 'r164', 'r165', 'r166', 'r167', 'r168', 'r169', 'r170', 'r171', 'r172', 'r173', 'r174']] + [irreg(G_LAB_EXTRA), obs()], origin='Antigo 4.13 (sem alteração de perguntas)', cond='Grupo II'),
    item('7.2', 'Sensibilizantes — requisitos comuns', [q(r) for r in ['r119', 'r120', 'r121', 'r122', 'r123', 'r124', 'r125', 'r126']] + [obs()], origin='Antigo 4.11', cond='Grupo III'),
    item('7.3', 'Cabine de hormônios', [q(r) for r in ['r127', 'r128', 'r129', 'r130', 'r131', 'r132', 'r133']] + [equip(SENS_EQ), irreg(G_LAB_EXTRA), regs(), obs()], origin='Antigo 4.11.1', cond='Hormônios'),
    item('7.4', 'Cabine de antibióticos', [q(r) for r in ['r134', 'r135', 'r136', 'r137', 'r138', 'r139', 'r140']] + [equip(SENS_EQ), irreg(G_LAB_EXTRA), regs(), obs()], origin='Antigo 4.11.2', cond='Antibióticos'),
    item('7.5', 'Cabine de citostáticos', [q(r) for r in ['r141', 'r142', 'r143', 'r144', 'r145', 'r146', 'r147']] + [equip(SENS_EQ), irreg(G_LAB_EXTRA), regs(), obs()], origin='Antigo 4.11.3', cond='Citostáticos'),
    item('7.6', 'Homeopatia', [q(r) for r in ['r148', 'r149', 'r150', 'r151', 'r152', 'r153', 'r154', 'r155', 'r236', 'r237']] + [equip(['Balança de uso exclusivo', 'Alcoômetro de Gay-Lussac', 'Estufa de inativação', 'Termo-higrômetro']), irreg(G_LAB_EXTRA), obs()], origin='Antigo 4.12', cond='Grupo V'),
])

# ───────────────────────── 8 EXAUSTÃO
block('Qualificação do sistema de exaustão', 'QP, QI, QO, QD e requalificação', [
    item('8.1', 'Qualificação do sistema de exaustão', [
        q('r114'), q('r115'), q('r116'), q('r117'),
        q('r118', text='A qualificação do sistema de exaustão está vigente, com requalificação ou manutenção preventiva no prazo?', tag='texto alterado', refs=['RDC 67/2007 · Anexo I · 8.7', 'RDC 67/2007 · Anexo I · 5.3']),
        note('Registros de limpeza e troca de filtros dos exaustores viraram checklist em cada laboratório (“Registros e planilhas do laboratório”).', 'mov'),
        fields(('Empresa qualificadora', '', 2), ('Data da última qualificação', 'dd/mm/aaaa', 1), ('Validade / próxima requalificação', '', 1), ('Laboratórios atendidos', '', 2)),
        {'t': 'doc', 'labels': ['📄 Ler laudo de qualificação']},
        obs(),
    ], origin='Antigo 4.15 — vira bloco próprio'),
], cond='Sólidas ou Grupo III')

# ───────────────────────── 9 RECEITAS
PRESC_IRR = [
    ['Receita ilegível ou com rasura', 'RDC 67/2007 · RT · 5.18.4'],
    ['Sem identificação do prescritor (nome, conselho, endereço)', 'RDC 67/2007 · RT · 5.18.4'],
    ['Sem identificação do paciente', 'RDC 67/2007 · RT · 5.18.4'],
    ['Substância sem DCB/DCI, concentração, forma ou quantidade', 'RDC 67/2007 · RT · 5.18.4'],
    ['Sem posologia ou duração do tratamento', 'RDC 67/2007 · RT · 5.18.4'],
    ['Sem data ou assinatura do prescritor', 'RDC 67/2007 · RT · 5.18.4'],
    ['Fórmula em código, símbolo, nome de fantasia ou sigla', 'RDC 67/2007 · RT · 5.17.4'],
    ['Prescrição por profissional não habilitado para a substância', 'RDC 67/2007 · RT · 5.17.1'],
    ['Cálculos (fator de correção/equivalência) não registrados na OM', 'RDC 67/2007 · RT · 5.18.6'],
    ['Controlado: receita/notificação inadequada ao tipo da lista', 'Portaria 344/1998 · RDC 67/2007 · RT 5.18.7'],
    ['Controlado: notificação ou receita vencida', 'Portaria 344/1998'],
    ['Controlado: quantidade acima do limite sem justificativa', 'Portaria 344/1998'],
    ['Controlado: sem retenção da via exigida', 'Portaria 344/1998'],
    ['Antimicrobiano: receita fora do prazo de validade', 'RDC 471/2021 · art. 6º'],
    ['Antimicrobiano: sem retenção/registro da dispensação', 'RDC 471/2021 · art. 9º'],
    ['Receita eletrônica sem assinatura digital válida', 'Lei 5.991/1973 · art. 35 (Lei 14.063/2020)'],
    ['Repetição sem duração indicada ou confirmação do prescritor', 'RDC 67/2007 · RT · 5.17.5.1'],
    ['Receita aviada sem carimbo (estabelecimento, data, nº de registro)', 'RDC 67/2007 · Anexo I · 14.2'],
    ['Fator de equivalência base/sal aplicado sem as quantidades identificadas no rótulo', 'Portaria 344/1998 · art. 52, § 4º'],
]
# Itens genéricos substituídos pelas listas por tipo de receituário (ids mantidos para não deslocar marcações)
PRESC_DROP = {'Controlado: receita/notificação inadequada ao tipo da lista', 'Controlado: notificação ou receita vencida',
              'Controlado: quantidade acima do limite sem justificativa', 'Controlado: sem retenção da via exigida',
              'Antimicrobiano: receita fora do prazo de validade', 'Antimicrobiano: sem retenção/registro da dispensação',
              'Receita eletrônica sem assinatura digital válida'}
R471 = 'RDC 471/2021 · art. '
L5991 = 'Lei 5.991/1973 · art. 35, § 2º'


def rec471(prazo, ref_prazo):
    return [
        ['Prescrição sem identificação do paciente', R471 + '6º, parágrafo único, I'],
        ['Prescrição sem dados do medicamento, posologia ou quantidade', R471 + '6º, parágrafo único, II'],
        ['Prescrição sem identificação do emitente', R471 + '6º, parágrafo único, III'],
        ['Prescrição sem data de emissão', R471 + '6º, parágrafo único, IV'],
        ['Prescrição aviada fora do prazo de ' + prazo, ref_prazo],
        ['Prescrição simultânea com controlado em desacordo com a norma', R471 + '8º'],
        ['Retenção incorreta da via da receita física', R471 + '10'],
        ['Prescrição ilegível ou com rasura', R471 + '10, § 2º'],
        ['Sem data de dispensação, quantidade, lote ou rubrica nas vias', R471 + '10, § 3º'],
        ['Quantidade aviada incompatível com o tratamento prescrito', R471 + '11'],
        ['Aviada com base apenas em fotografia, sem receita válida', L5991],
        ['Receita eletrônica sem assinatura avançada ou qualificada', L5991],
    ]


def rec344(lista, validade, limite):
    return [
        [lista + ': ausência do receituário exigido', P344 + '35'],
        [lista + ': receituário ilegível, com emenda ou rasura', P344 + '35, § 3º'],
        [lista + ': sem identificação numérica', P344 + '36, alínea b'],
        [lista + ': sem identificação do emitente', P344 + '36, alínea c'],
        [lista + ': sem identificação do usuário', P344 + '36, alínea d'],
        [lista + ': sem dados obrigatórios do medicamento', P344 + '36, alínea e'],
        [lista + ': sem data de emissão', P344 + '36, alínea g'],
        [lista + ': sem assinatura do prescritor', P344 + '36, alínea h'],
        [lista + ': sem identificação do comprador', P344 + '36, alínea i'],
        [lista + ': sem identificação do dispensador', P344 + '36, alínea j'],
        [lista + ': sem identificação da gráfica (formulário físico)', P344 + '36, alínea l'],
        [lista + ': sem anotação da quantidade aviada', P344 + '36, alínea m'],
        [lista + ': aviada após 30 dias da emissão', validade],
        [lista + ': quantidade acima do limite sem justificativa', limite],
    ]


def rec_c(lista):
    return [
        [lista + ': ausência do receituário exigido', P344 + '52 e 55'],
        [lista + ': receita ilegível, com emenda ou rasura', P344 + '52, § 1º'],
        [lista + ': sem identificação do emitente', P344 + '55, alínea a'],
        [lista + ': sem identificação do usuário', P344 + '55, alínea b'],
        [lista + ': sem dados obrigatórios do medicamento', P344 + '55, alínea c'],
        [lista + ': sem data de emissão', P344 + '55, alínea d'],
        [lista + ': sem assinatura do prescritor', P344 + '55, alínea e'],
        [lista + ': sem registro da quantidade aviada', P344 + '55, alínea f'],
        [lista + ': sem duas vias ou sem retenção da 1ª via', P344 + '52'],
        [lista + ': aviada após 30 dias da emissão', P344 + '52, § 1º'],
        [lista + ': quantidade acima do limite sem justificativa', P344 + '59 e 60'],
        [lista + ': aviada com item não preenchido', P344 + '52, § 2º'],
    ]


RECEITAS = [
    ('patm', 'Antimicrobianos (RDC 471/2021)', rec471('10 dias', 'IN 360/2025 · art. 1º, § 2º')),
    ('pglp', 'Agonistas de GLP-1 (IN 360/2025)', rec471('90 dias', 'IN 360/2025 · art. 2º, § 1º')),
    ('pa', 'Lista A (A1, A2, A3) — Notificação de Receita A', rec344('A', P344 + '41', P344 + '43')),
    ('pb1', 'Lista B1 — Notificação de Receita B', rec344('B1', P344 + '45', P344 + '46')),
    ('pb2', 'Lista B2 (anorexígenos) — Notificação de Receita B2', rec344('B2', 'RDC 58/2007 · art. 1º, § 2º', 'RDC 50/2014 · art. 5º, § 1º') + [
        ['B2: associação de anorexígenos entre si ou com ansiolíticos, antidepressivos, diuréticos, hormônios, laxantes ou outras substâncias vedadas', 'RDC 58/2007 · art. 3º'],
        ['B2: dose diária acima da dose diária recomendada', 'RDC 50/2014 · art. 3º'],
        ['B2: sibutramina sem termo de responsabilidade do prescritor', 'RDC 50/2014 · art. 6º'],
    ]),
    ('pc1', 'Lista C1 — Receita de Controle Especial', rec_c('C1')),
    ('pc2', 'Listas C2 e C3 (retinoides e imunossupressores)', [
        ['C2: retinoide manipulado para uso sistêmico (vedado)', P344 + '29'],
        ['C3: imunossupressor manipulado (vedado)', P344 + '29'],
        ['C2 tópico: sem Receita de Controle Especial', P344 + '52 e 55'],
    ]),
    ('pc5', 'Lista C5 (anabolizantes) — Receita de Controle Especial e Lei 9.965/2000', rec_c('C5') + [
        ['C5: receita de profissional não habilitado', 'Lei 9.965/2000 · art. 1º'],
        ['C5: sem CRM/CRO, CPF, endereço ou telefone do prescritor', 'Lei 9.965/2000 · art. 1º, parágrafo único'],
        ['C5: sem nome ou endereço do paciente', 'Lei 9.965/2000 · art. 1º, parágrafo único'],
        ['C5: sem o CID', 'Lei 9.965/2000 · art. 1º, parágrafo único'],
        ['C5: receita guardada por menos de 5 anos', 'Lei 9.965/2000 · art. 1º, parágrafo único'],
    ]),
    ('pele', 'Receituário eletrônico (SNCR)', [
        ['Notificação ou Receita de Controle Especial eletrônica sem assinatura qualificada', 'RDC 1.000/2025 · art. 8º, I'],
        ['Receituário eletrônico sem validação de autenticidade, integridade e assinatura', L5991],
        ['Numeração eletrônica não conferida no SNCR', 'RDC 1.000/2025 · art. 13, II'],
        ['Uso de receituário eletrônico não registrado no SNCR', 'RDC 1.000/2025 · art. 13, III'],
        ['Registros eletrônicos de utilização não guardados pelo prazo aplicável', 'RDC 1.000/2025 · art. 14'],
        ['Receituário eletrônico reutilizado após registro de uso no SNCR', 'RDC 1.000/2025 · art. 15'],
    ]),
]
block('Receitas, prescrição, escrituração e dispensação', 'Amostragem, avaliação farmacêutica, controlados e dispensação', [
    item('9.1', 'Amostragem de receitas', [
        note('Mesmo sistema da Drogaria: abra só os tipos de receita amostrados e marque o que foi constatado. Cada marca vira frase no relatório e sugestão de infração, com a norma do tipo de receituário.', 'info'),
        nq('As prescrições aviadas são de preparações magistrais, sem manipulação em substituição a medicamento industrializado prescrito (referência, genérico ou similar)?', ['RDC 67/2007 · RT · 5.13']),
        nq('A transformação de especialidade farmacêutica, quando ocorre, é excepcional (matéria-prima indisponível e sem especialidade na dose ou forma necessária) e justificada tecnicamente?', ['RDC 67/2007 · RT · 5.12', 'RDC 67/2007 · RT · 5.12.1']),
        {'t': 'ncl', 'title': 'Irregularidades gerais na prescrição', 'items': [x for x in PRESC_IRR if x[0] not in PRESC_DROP], 'sub': 'Valem para qualquer receita amostrada.'},
    ] + [ncl(k, t, it) for k, t, it in RECEITAS] + [
        obs(),
    ]),
    item('9.2', 'Avaliação farmacêutica e ordem de manipulação', [
        q('r208'), q('r209'), q('r210'), q('r211'),
        nq('A ordem de manipulação corresponde à prescrição (fármacos, concentrações, quantidades e forma farmacêutica), sem alteração não autorizada?', ['RDC 67/2007 · RT · 5.18.1.1', 'RDC 67/2007 · Anexo I · 8.4']),
        q('r054', text='Há procedimento de conferência da ordem de manipulação frente à prescrição (composição, quantidades, rótulo)?', tag='texto alterado', refs=['RDC 67/2007 · Anexo I · 8.4']),
        q('r053', tag='movido'),
        q('r215'),
        obs(),
    ], origin='Antigo 9 / 9.1 + perguntas da antiga “Ordem de manipulação, conferência e rotulagem”'),
    item('9.3', 'Controlados e antimicrobianos — escrituração e estoque', [
        q('r213'), q('r214'), q('r043'), q('r042'), q('r113'),
        q('r189', tag='movido'), q('r198', tag='movido'), q('r199', tag='movido'),
        {'t': 'table', 'title': 'Confronto de estoque (amostragem)', 'cols': ['Insumo / medicamento', 'Lista', 'Estoque escriturado', 'Estoque físico', 'Diferença'], 'rows': 3},
        obs(),
    ], origin='Antigo “Escrituração e estoque de controlados”', cond='Controle especial'),
    item('9.4', 'Dispensação', [
        note('Estas três perguntas saíram de “Conservação, transporte e dispensação”. A r212 (repetição de receita) foi fundida com a r242 — eram a mesma pergunta.', 'mov'),
        q('r036'), q('r241'), q('r242'),
        nq('A dispensação é feita com orientação farmacêutica ao paciente?', ['RDC 67/2007 · Anexo I · 14.1']),
        obs(),
    ]),
])

# ───────────────────────── 10 RASTREABILIDADE E CQ
def rast(code, title, form, ensaios, cond):
    return item(code, title, [
        {'t': 'rast', 'form': form, 'ensaios': ensaios},
        obs(),
    ], cond=cond)


ENS_SOL = ['Descrição', 'Aspecto', 'Caracteres organolépticos', 'Peso médio (com DP e CV)', 'Informações assinadas e aprovadas pelo farmacêutico']
ENS_SEMI = ['Descrição', 'Aspecto', 'Caracteres organolépticos', 'pH (quando aplicável)', 'Peso', 'Informações assinadas e aprovadas pelo farmacêutico']
ENS_LIQ = ['Descrição', 'Aspecto', 'Caracteres organolépticos', 'pH (quando aplicável)', 'Peso ou volume antes do envase', 'Informações assinadas e aprovadas pelo farmacêutico']
RAST_IRR = [
    ['OM sem lote, fabricante ou quantidade pesada de algum insumo', 'RDC 67/2007 · Anexo I · 8.4'],
    ['OM sem assinatura do manipulador ou visto do farmacêutico', 'RDC 67/2007 · Anexo I · 9.1.2'],
    ['Ensaios do 9.1.1 não realizados ou não registrados', 'RDC 67/2007 · Anexo I · 9.1.1'],
    ['Peso médio sem desvio padrão e coeficiente de variação', 'RDC 67/2007 · Anexo I · 9.1.3'],
    ['Matéria-prima sem CQ próprio no recebimento', 'RDC 67/2007 · Anexo I · 7.3.10'],
    ['Lote sem certificado de análise do fornecedor', 'RDC 67/2007 · Anexo I · 7.2.4'],
    ['Sem registro de inspeção de recebimento', 'RDC 67/2007 · Anexo I · 7.2.1'],
    ['Rótulo sem informação obrigatória', 'RDC 67/2007 · Anexo I · 12.1'],
    ['Embalagem sem CQ no recebimento / recipiente inadequado', 'RDC 67/2007 · Anexo I · 7.1.9'],
    ['Registro no Livro de Receituário incompleto', 'RDC 67/2007 · Anexo I · 8.3.2'],
    ['Produto sem rastreabilidade entre OM, livro e insumos', 'RDC 67/2007 · Anexo I · 8.1'],
]
block('Rastreabilidade e controle de qualidade', 'Três formulações, matéria-prima vegetal e embalagens', [
    rast('10.1', 'Preparação sólida', 'sólida', ENS_SOL, 'Sólidas'),
    rast('10.2', 'Preparação semissólida', 'semissólida', ENS_SEMI, 'Semissólidas'),
    rast('10.3', 'Preparação líquida', 'líquida', ENS_LIQ, 'Líquidas'),
    item('10.4', 'CQ de matérias-primas de origem vegetal', [{'t': 'veg'}, obs()], cond='Matéria-prima vegetal'),
    item('10.5', 'CQ de embalagens', [{'t': 'emb'}, obs()]),
    item('10.6', 'Irregularidades no processo', [
        note('As perguntas r216–r232 (ordem, recebimento, certificado, CQ próprio, embalagem — repetidas para cada forma) e r251/r253 (rótulo e ensaios mínimos) viraram checklist dentro de cada formulação e a lista abaixo.', 'mov'),
        {'t': 'ncl', 'title': 'Irregularidades na rastreabilidade e no controle de qualidade', 'items': RAST_IRR, 'sub': 'Marque o que foi constatado nas formulações conferidas.'},
        obs(),
    ]),
])

# ───────────────────────── 11 MONITORAMENTO
MON_IRR = [
    ['Análise fora da periodicidade exigida', 'RDC 67/2007 · Anexo I · 9.2.3.1'],
    ['Sem POP da metodologia do monitoramento', 'RDC 67/2007 · Anexo I · 9.2.6'],
    ['Resultados não arquivados por 2 anos', 'RDC 67/2007 · Anexo I · 9.2.7'],
    ['Laudo insatisfatório sem medida registrada / sem nova análise', 'RDC 67/2007 · Anexo I · 9.2.8'],
    ['Amostras sem rodízio de manipuladores, fármacos e dosagens', 'RDC 67/2007 · Anexo I · 9.2.5'],
    ['Laboratório sem contrato ou sem habilitação REBLAS', 'RDC 67/2007 · Anexo I · 9.2.4'],
    ['Água purificada sem análise mensal', 'RDC 67/2007 · Anexo I · 7.5.2.2'],
    ['Água potável sem análise semestral', 'RDC 67/2007 · Anexo I · 7.5.1.3'],
    ['Base galênica sem análise microbiológica mensal', 'RDC 67/2007 · Anexo I · 11.2.4'],
    ['Classes do Anexo III sem análise trimestral', 'RDC 67/2007 · Anexo III · 2.16.1'],
]
block('Monitoramento do processo magistral', 'Mensal, bimestral, trimestral e semestral', [
    item('11.1', 'Monitoramento mensal', [
        {'t': 'mon', 'code': '11.1.1', 'title': 'Pureza microbiológica de bases galênicas e preparações magistrais e oficinais — últimas 3 análises', 'n': 3, 'kind': 'produto', 'ref': 'RDC 67/2007 · Anexo I · 11.2.4'},
        {'t': 'mon', 'code': '11.1.2', 'title': 'Água purificada — últimas 3 análises', 'n': 3, 'kind': 'agua', 'ref': 'RDC 67/2007 · Anexo I · 7.5.2.2'},
        q('r203'), q('r204'), q('r207'),
        obs(),
    ]),
    item('11.2', 'Monitoramento bimestral', [
        {'t': 'mon', 'code': '11.2.1', 'title': 'Teor e uniformidade de conteúdo — fármaco(s) ≤ 25 mg (prioridade < 5 mg) — últimas 3 análises', 'n': 3, 'kind': 'produto', 'ref': 'RDC 67/2007 · Anexo I · 9.2.3 e 9.2.3.1'},
        obs(),
    ], cond='Sólidas'),
    item('11.3', 'Monitoramento trimestral', [
        {'t': 'mon', 'code': '11.3.1', 'title': 'Teor e uniformidade de conteúdo de cada classe terapêutica (pode ser rodiziada) — últimas 3 análises', 'n': 3, 'kind': 'produto', 'ref': 'RDC 67/2007 · Anexo III · 2.16 e 2.16.1'},
        note('O monitoramento trimestral de diluídos de SBIT (r171/r248) continua no item 7.1. A r248 citava o Anexo I 9.2.2, que foi revogado pela RDC 87/2008.', 'warn'),
        obs(),
    ], cond='Grupo III'),
    item('11.4', 'Monitoramento semestral', [
        {'t': 'mon', 'code': '11.4.1', 'title': 'Água potável — últimas 2 análises', 'n': 2, 'kind': 'agua', 'ref': 'RDC 67/2007 · Anexo I · 7.5.1.3'},
        q('r205'), q('r206'),
        obs(),
    ]),
    item('11.5', 'Laboratório contratado, cronograma e rodízio', [
        q('r194', text='Há contrato vigente com o laboratório que realiza as análises do monitoramento do processo magistral?', tag='movido'), q('r250'),
        nq('Há POP do monitoramento com cronograma das análises (periodicidade e fórmulas previstas em cada período)?', ['RDC 67/2007 · Anexo I · 9.2.6']),
        nq('As amostras seguem sistema de rodízio de manipuladores, fármacos e dosagens/concentrações?', ['RDC 67/2007 · Anexo I · 9.2.5']),
        chk('rod', 'Rodízio das amostras — o que foi conferido', ROD, 'Detalha a pergunta do rodízio: a irregularidade sai pela pergunta; aqui você registra o que faltou.'),
        {'t': 'ncl', 'title': 'Irregularidades no monitoramento', 'items': MON_IRR, 'sub': 'Marque o que foi constatado.'},
        obs(),
    ]),
])

# ───────────────────────── 12 VENDA REMOTA E TRANSPORTE
block('Venda remota e transporte', 'Solicitação remota, entrega e conservação', [
    item('12.1', 'Venda remota', [
        note('Mesmas perguntas do bloco de venda remota da Drogaria (RDC 44/2009 · arts. 52 a 56).', 'mov'),
        nq('O estabelecimento realiza venda remota (solicitação por telefone, internet ou aplicativo)?', ['RDC 44/2009 · art. 52'], tag='da Drogaria'),
        nq('Possui licença sanitária para a atividade?', ['RDC 44/2009 · art. 52'], tag='da Drogaria'),
        nq('Apresentou POP de venda remota?', ['RDC 44/2009 · art. 56, § 3º'], tag='da Drogaria'),
        chips('Meios utilizados', ['Telefone', 'WhatsApp', 'Site próprio', 'E-mail', 'Aplicativo de entrega', 'Marketplace'], other=True),
        chips('Produtos vendidos remotamente', ['Manipulados sem controle especial', 'Manipulados com controlados', 'Antimicrobianos', 'Termolábeis', 'Industrializados']),
        nq('A venda remota de controlados e/ou antimicrobianos segue a legislação vigente?', ['RDC 44/2009 · art. 52, § 2º'], tag='da Drogaria'),
        chips('Exigências verificadas', ['Prescrição conferida antes da manipulação', 'Retenção da via / registro quando exigido', 'Validação da assinatura digital', 'Registro da dispensação e rastreabilidade', 'Conservação e entrega compatíveis']),
        obs(),
    ]),
    item('12.2', 'Conservação e transporte', [
        q('r238'), q('r239'), q('r240'),
        nq('A entrega é feita por meio próprio ou transportadora contratada, com condições que preservem o produto?', ['RDC 67/2007 · Anexo I · 13'], tag='novo'),
        obs(),
    ], origin='Antigo 9.6, sem as perguntas de dispensação (foram para 9.4).'),
])

if __name__ == '__main__':
  used = set()
  for b in BLOCKS:
      for it in b['items']:
          for p in it['parts']:
              if p.get('t') == 'q' and p.get('id'):
                  used.add(p['id'])
          for p in it['parts']:
              if p.get('t') == 'docs':
                  pass
  used |= {r for r, _ in DOCS}
  missing = sorted(set(REQ) - used)
  print('blocos', len(BLOCKS), 'perguntas usadas', len(used), 'não usadas:', missing)
  for m in missing:
      print('  ', m, REQ[m]['text'][:110])
