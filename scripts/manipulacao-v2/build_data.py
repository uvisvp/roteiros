"""Gera farmacia-manipulacao-v2-dados.json (APP_DATA da Manipulação v2).

Fontes: estrutura.py (blocos aprovados no protótipo), frases.py (texto do relatório),
app-data-v1.json (perguntas e citações da v1) e inventario-revisado.json.
Uso: python3 scripts/manipulacao-v2/build_data.py
"""
import json, os, re, sys

SP = os.path.dirname(os.path.abspath(__file__)) + '/'
sys.path.insert(0, SP)
import estrutura  # noqa: E402
from frases import F  # noqa: E402
from orientacao import ORIENT, SIT, OUTRO, PRE  # noqa: E402

V1 = json.load(open(SP + 'app-data-v1.json'))
INV = json.load(open(SP + 'inventario-revisado.json'))
REQ = estrutura.REQ

# Perguntas novas: id estável por texto
NEW_IDS = {
    'Foram apresentados os ASO admissionais dos funcionários amostrados?': 'n001',
    'Os ASO periódicos estão dentro da periodicidade definida no PCMSO?': 'n002',
    'Os ASO atestam aptidão para a função efetivamente exercida?': 'n003',
    'Para quem manipula hormônios, antibióticos, citostáticos ou controlados, o ASO contempla os exames específicos previstos no PCMSO?': 'n004',
    'A coleta e a destinação são feitas por empresa licenciada, com comprovantes (CTR/manifesto) dos últimos meses?': 'n010',
    'Os resíduos de medicamentos e insumos hormonais, antimicrobianos, citostáticos e demais do art. 59 são segregados e destinados como resíduo químico (Grupo B)?': 'n011',
    'Insumos e produtos vencidos, reprovados ou devolvidos aguardam descarte segregados e identificados?': 'n012',
    'O lixo e os resíduos da manipulação são esvaziados fora da área de manipulação?': 'n013',
    'Os saneantes em uso são regularizados na Anvisa (notificados/registrados)?': 'n014',
    'Há local para lavagem dos materiais de limpeza?': 'n015',
    'O abrigo temporário é identificado, de acesso restrito, com piso e paredes laváveis e coletores tampados?': 'n016',
    'O vestiário tem armários para guarda de pertences e é separado das áreas de manipulação?': 'n020',
    'A copa/refeitório é separada dos demais ambientes?': 'n021',
    'A geladeira da copa é de uso exclusivo para alimentos (sem medicamentos, insumos ou amostras)?': 'n022',
    'A área de descanso é separada dos demais ambientes e não é usada para guarda de materiais?': 'n023',
    'A ordem de manipulação corresponde à prescrição (fármacos, concentrações, quantidades e forma farmacêutica), sem alteração não autorizada?': 'n030',
    'A dispensação é feita com orientação farmacêutica ao paciente?': 'n031',
    'Possui licença sanitária para a atividade?': 'n041',
    'Apresentou POP de venda remota?': 'n042',
    'A venda remota de controlados e/ou antimicrobianos segue a legislação vigente?': 'n043',
    'A entrega é feita por meio próprio ou transportadora contratada, com condições que preservem o produto?': 'n044',
    'As prescrições aviadas são de preparações magistrais, sem manipulação em substituição a medicamento industrializado prescrito (referência, genérico ou similar)?': 'n050',
    'A transformação de especialidade farmacêutica, quando ocorre, é excepcional (matéria-prima indisponível e sem especialidade na dose ou forma necessária) e justificada tecnicamente?': 'n051',
}
# A pergunta "realiza venda remota?" virou seleção na Caracterização.
DROP_TEXT = {'O estabelecimento realiza venda remota (solicitação por telefone, internet ou aplicativo)?'}

COND = {
    'Dispensa industrializados': 'industrializados', 'Serviços farmacêuticos': 'servicos', 'Copa / refeitório': 'copa',
    'Área de descanso': 'descanso', 'Semissólidas ou líquidas': 'semiliquidos', 'Sólidas': 'solidos', 'Grupo II': 'sbit',
    'Grupo III': 'sensibilizantes', 'Hormônios': 'hormonios', 'Antibióticos': 'antibioticos', 'Citostáticos': 'citostaticos',
    'Grupo V': 'homeopatia', 'Sólidas ou Grupo III': 'exaustao', 'Controle especial': 'controle', 'Semissólidas': 'semissolida',
    'Líquidas': 'liquida', 'Matéria-prima vegetal': 'vegetal',
}
ITEM_COND = {'11.3': 'anexo3', '12.1': 'remota'}

LAW = {'RDC 67/2007': 'RDC nº 67/2007', 'RDC 222/2018': 'RDC nº 222/2018', 'RDC 44/2009': 'RDC nº 44/2009',
       'Lei 6.360/1976': 'Lei nº 6.360/1976', 'RDC 471/2021': 'RDC nº 471/2021'}
TX = {k: v['x'] for k, v in INV['texts'].items()}
TAG = {'RT': 'Regulamento Técnico', 'Anexo I': 'Anexo I', 'Anexo II': 'Anexo II', 'Anexo III': 'Anexo III', 'Anexo V': 'Anexo V', 'Anexo VII': 'Anexo VII'}
KEY = {'Regulamento Técnico': 'RT', 'Anexo I': 'AI', 'Anexo II': 'AII', 'Anexo III': 'AIII', 'Anexo V': 'AV'}


def ref_obj(s):
    """'RDC 67/2007 · Anexo I · 4.17' -> {law, device, text?}."""
    parts = [p.strip() for p in s.split('·')]
    law = LAW.get(parts[0], parts[0])
    if len(parts) == 3:
        an = TAG.get(parts[1], parts[1])
        dev = an + ' · Item ' + parts[2]
        o = {'law': law, 'device': dev}
        k = KEY.get(an, '') + ' ' + parts[2]
        if k in TX:
            o['text'] = TX[k]
        return o
    dev = parts[1] if len(parts) > 1 else ''
    dev = re.sub(r'^art\.', 'Art.', dev)
    return {'law': law, 'device': dev}


def requirement(p):
    if p.get('id'):
        base = REQ[p['id']]
        r = {'id': p['id'], 'text': p['text'], 'condition': base.get('condition'), 'refs': base.get('refs', []),
             'informativo': bool(base.get('informativo'))}
        if p.get('old'):
            r['refs'] = [ref_obj(x) for x in p['refs']] if p['refs'] != [estrutura.short(x) for x in base.get('refs', [])] else base.get('refs', [])
    else:
        rid = NEW_IDS[p['text']]
        r = {'id': rid, 'text': p['text'], 'condition': None, 'refs': [ref_obj(x) for x in p['refs']], 'informativo': False}
    pos, neg = F[r['id']]
    r['pos'], r['neg'] = pos, neg
    return r


ICONS = ['building', 'folder', 'people', 'clear', 'plan', 'lab', 'bottle', 'cold', 'note', 'shield', 'menu', 'truck']
cards, labels = {}, dict(V1['conditionLabels'])
labels.update({'copa': 'Possui copa / refeitório', 'descanso': 'Possui área de descanso', 'anexo3': 'Manipula substâncias do Anexo III',
               'remota': 'Realiza venda remota', 'sbit': 'Manipula substâncias de baixo índice terapêutico (Grupo II)'})
item_block = {}
for b in estrutura.BLOCKS:
    n = str(b['n'])
    sections, extras = [], []
    for it in b['items']:
        iid = 'i' + it['code']
        item_block[iid] = b['n']
        cond = ITEM_COND.get(it['code']) or COND.get(it.get('cond')) or COND.get(b.get('cond'))
        reqs = []
        for p in it['parts']:
            if p['t'] == 'q':
                if p['text'] in DROP_TEXT:
                    continue
                reqs.append(requirement(p))
            elif p['t'] == 'docs':
                for row in p['rows']:
                    rid = next(k for k, v in REQ.items() if v['text'] == row['text'])
                    reqs.append(requirement({'id': rid, 'text': row['text']}))
            elif p['t'] == 'note':
                if p['k'] in ('info', 'warn') and 'protótipo' not in p['text']:
                    extras.append({'fn': 'manV2', 'into': iid, 'antes': True, 'c': {'t': 'note', 'text': p['text'], 'k': p['k']}})
            else:
                c = dict(p)
                antes = c['t'] in ('fields', 'chips', 'doc')
                if c['t'] == 'pops':
                    extras.append({'fn': 'renderPops', 'into': iid}); continue
                if c['t'] == 'table' and c['title'] == 'Confronto de estoque (amostragem)':
                    extras.append({'fn': 'renderStock', 'into': iid}); continue
                extras.append({'fn': 'manV2', 'into': iid, 'antes': antes, 'c': c})
        if it['code'] == '1.1':
            extras.insert(0, {'fn': 'manV2', 'into': iid, 'antes': True, 'c': {'t': 'ident'}})
        if it['code'] == '2.3':
            extras.insert(len(extras) - 1, {'fn': 'renderTraining', 'into': iid})
        for rq in reqs:
            if rq.get('condition'):
                rq['hint'], rq['condition'] = rq['condition'], None
        sections.append({'code': 'v2-' + it['code'], 'num': it['code'], 'title': it['title'], 'condition': None, 'hint': cond,
                         'item': iid, 'itemNum': it['code'], 'itemTitle': it['title'], 'requirements': reqs})
        if it['code'] == '10.6':
            sections.append({'code': 'v2-10.7', 'num': '10.7', 'title': 'Verificação de matéria-prima', 'condition': None, 'hint': None,
                             'item': 'i10.7', 'itemNum': '10.7', 'itemTitle': 'Verificação de matéria-prima', 'requirements': []})
            extras.append({'fn': 'renderTraceability', 'into': 'i10.7'})
            item_block['i10.7'] = b['n']
    cards[n] = {'title': b['title'], 'subtitle': b['sub'], 'icon': ICONS[b['n'] - 1], 'sections': sections, 'extraItems': extras}

# Caracterização: a seleção substitui chips genéricos do protótipo por componente próprio ligado a state.char
for e in cards['1']['extraItems']:
    if e['into'] == 'i1.2' and e['c'].get('t') in ('chips', 'fields'):
        e['c']['t'] = 'skip'
cards['1']['extraItems'] = [e for e in cards['1']['extraItems'] if e['c'].get('t') != 'skip'
                            and not (e['into'] == 'i1.1' and e['c'].get('t') in ('fields', 'doc', 'chips'))]
cards['1']['extraItems'].insert(1, {'fn': 'manV2', 'into': 'i1.2', 'antes': True, 'c': {'t': 'carac'}})

NO_NA = {'i1.1', 'i1.2', 'i2.1', 'i2.3', 'i3.1'}
for c in cards.values():
    heads = [{'fn': 'manV2', 'into': s['item'], 'antes': True, 'c': {'t': 'itemhead', 'na': s['item'] not in NO_NA}} for s in c['sections']]
    tails = [{'fn': 'manV2', 'into': s['item'], 'c': {'t': 'preview'}} for s in c['sections']]
    c['extraItems'] = heads + c['extraItems'] + tails
SITDATA = {k: [{'q': q, 'pre': PRE.get(k, ''), 'opts': [list(o) for o in opts] + [list(OUTRO)]} for q, opts in v] for k, v in SIT.items()}

# Listas de irregularidades com ids estáveis
def lst(items, prefix):
    return [{'id': '%s%02d' % (prefix, i + 1), 't': t, 'ref': r} for i, (t, r) in enumerate(items)]

MON_DROP = {'Amostras sem rodízio de manipuladores, fármacos e dosagens'}  # virou o checklist de rodízio (11.5)
LISTS = {'amb': lst(estrutura.G_AMB, 'a'), 'lab': lst(estrutura.G_LAB_EXTRA, 'l'), 'reg': lst(estrutura.REG_LAB, 'g'),
         'eq': lst(estrutura.EQ_IRR, 'e'), 'presc': [x for x in lst(estrutura.PRESC_IRR, 'p') if x['t'] not in estrutura.PRESC_DROP],
         'rast': lst(estrutura.RAST_IRR, 'r'), 'mon': [x for x in lst(estrutura.MON_IRR, 'm') if x['t'] not in MON_DROP]}
for k, _, it in estrutura.RECEITAS:
    LISTS[k] = lst(it, k)
TITLES = {k: t for k, t, _ in estrutura.RECEITAS}
LIST_OF = {id(estrutura.G_AMB): 'amb', id(estrutura.REG_LAB): 'reg', id(estrutura.PRESC_IRR): 'presc',
           id(estrutura.RAST_IRR): 'rast', id(estrutura.MON_IRR): 'mon'}
for c in cards.values():
    for e in c['extraItems']:
        comp = e.get('c')
        if not comp:
            continue
        if comp['t'] == 'ncl' and comp.get('key'):
            comp.pop('items'); comp['lists'] = [comp['key']]; comp['kind'] = comp.pop('key')
            continue
        if comp['t'] == 'ncl':
            n_amb = len(estrutura.G_AMB)
            items = comp.pop('items')
            texts = [x[0] for x in items]
            keys = []
            for k in ('amb', 'lab', 'reg', 'presc', 'rast', 'mon'):
                if any(x['t'] in texts for x in LISTS[k]):
                    keys.append(k)
            comp['lists'] = keys
            comp['kind'] = 'reg' if keys == ['reg'] else ('amb' if 'amb' in keys else keys[0])
        if comp['t'] == 'equip':
            comp.pop('irr', None)

PLAN = [
    ['limpeza', 'Limpeza e sanitização', 'RDC 67/2007 · Anexo I · 6 e 8.5', ['Bancadas', 'Balanças', 'Utensílios e vidrarias', 'Pisos', 'Paredes e teto', 'Exaustores / capelas', 'Geladeiras', 'Pias e lavatórios', 'Sanitários', 'Caixa d’água (semestral)', 'Recipiente de água purificada (a cada troca)']],
    ['tu', 'Temperatura e umidade', 'RDC 67/2007 · Anexo I · 4.2.1, 8.8 e 7.4.3', ['Almoxarifado', 'Laboratório de sólidos', 'Laboratório de semissólidos e líquidos', 'Controle de qualidade', 'Dispensação', 'Cabines de sensibilizantes', 'Homeopatia', 'Geladeira(s)']],
    ['verif', 'Verificação e calibração de equipamentos', 'RDC 67/2007 · Anexo I · 5.2.1 e 5.2.2', ['Verificação diária das balanças (peso padrão)', 'Certificados de calibração das balanças', 'Calibração de termo-higrômetros', 'Calibração do pHmetro']],
    ['agua', 'Água purificada', 'RDC 67/2007 · Anexo I · 7.5.2.1 e 7.5.2.5', ['Troca de filtros e componentes do purificador', 'Sanitização do sistema', 'Controle em processo (condutividade)']],
    ['exaust', 'Sistema de exaustão', 'RDC 67/2007 · Anexo I · 8.7 e 5.3', ['Limpeza dos exaustores / capelas', 'Troca de filtros']],
    ['sens', 'Sensibilizantes', 'RDC 67/2007 · Anexo III · 2.7.2 e 2.9', ['Limpeza de balança e bancada antes e após cada pesagem', 'Medição do diferencial de pressão das cabines']],
    ['pragas', 'Pragas e manutenção', 'RDC 67/2007 · Anexo I · 4.12, 5.3 e 5.3.1', ['Certificado de controle de pragas', 'Manutenção preventiva de equipamentos', 'Manutenção e limpeza do ar-condicionado (PMOC)']],
]

INV_ITEMS = [{'n': o['n'], 'description': o['d'], 'a7': o['a7'], 'cls': o['cls'], 'dev': o['dev'], 'block': o['b'], 'note': o['note']}
             for o in INV['items'] if o['b']]
monitor_areas = []
for c in cards.values():
    for s in c['sections']:
        if s['item'] in ('i5.1', 'i5.8', 'i6.2', 'i6.4', 'i6.5', 'i7.3', 'i7.4', 'i7.5', 'i7.6'):
            monitor_areas.append(s['code'] + ' ' + s['title'])

data = dict(V1)
data.update({
    'cards': cards, 'conditionLabels': labels, 'equipment': {}, 'monitorAreas': monitor_areas,
    'infractions': INV_ITEMS, 'infraTexts': INV['texts'],
    'v2': {'lists': LISTS, 'plan': PLAN, 'itemBlock': item_block, 'orient': ORIENT, 'sit': SITDATA},
    'meta': dict(V1['meta'], version=2, structure='12 blocos', infractions=len(INV_ITEMS)),
})
out = os.path.join(SP, '..', '..', 'farmacia-manipulacao-v2-dados.json')
json.dump(data, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
nreq = sum(len(s['requirements']) for c in cards.values() for s in c['sections'])
print('ok', os.path.getsize(out), 'bytes;', len(cards), 'blocos;', nreq, 'perguntas;', len(INV_ITEMS), 'infrações')
