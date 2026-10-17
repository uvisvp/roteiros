# -*- coding: utf-8 -*-
"""Gera medicamentos/estereis/cartao13.json: o bloco 13 "Manipulação de estéreis" no
formato de APP_DATA.cards do roteiro de manipulação (roteiros/farmacia-manipulacao).
O bloco só aparece quando a caracterização marca a preparação "Estéreis"
(condição estereis, incluída no módulo por scripts/repack-medicamentos.cjs).

Uso: python3 medicamentos/estereis/gerar.py [caminho/base-vigilancia] [caminho/roteiros]
Confere: toda pergunta do Anexo VII item 18 aparece uma vez, os números existem no
anexo7.json do roteiros e todo item do Anexo IV citado existe no banco v12.
"""
import json, os, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
BASE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, '..', 'base-vigilancia')
ROT = sys.argv[2] if len(sys.argv) > 2 else RAIZ
sys.path.insert(0, AQUI)
from perguntas import SECOES, P  # noqa: E402

URL67 = ('https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&tipo=RDC&numeroAto=00000067'
         '&seqAto=002&valorAno=2007&orgao=RDC/DC/ANVISA/MS&cod_modulo=310&cod_menu=8542')
CLASSE = {'I': 'imprescindível', 'N': 'necessário', 'R': 'recomendável', 'INF': 'informativo'}

# Anexo IV no v12: itens “x.y.z” e, entre eles, alíneas e blocos (continuações de frase).
v12 = json.load(open(os.path.join(BASE, 'dados', 'legislacao_v12', 'normas', 'rdc-67-2007.json')))
nos = sorted([n for n in v12['nos'] if '::anexo-iv::' in n['id']], key=lambda n: n['ordem'])
ANEXO4 = {}
atual = None
for n in nos:
    if n['tipo'] == 'item':
        m = re.match(r'^(\d+(?:\.\d+)*)\.?\s', n['texto'])
        if not m:
            atual = None
            continue
        atual = m.group(1)
        ANEXO4[atual] = [n['texto'].strip()]
    elif atual and n['tipo'] in ('alinea', 'bloco'):
        t = n['texto'].strip()
        if re.match(r'^[a-z]\)\s', t):
            ANEXO4[atual].append(t)
        else:
            ANEXO4[atual][-1] += ('' if re.match(r'^[,.;:]', t) else ' ') + t

A7 = json.load(open(os.path.join(ROT, 'scripts', 'manipulacao-v2', 'anexo7.json')))
oficiais = [k for k in A7 if k.startswith('18.')]
nums = [p[0] for p in P]
assert len(nums) == len(set(nums)), 'número repetido'
faltam = [k for k in oficiais if k not in nums]
sobram = [k for k in nums if k not in A7]
assert not faltam and not sobram, (faltam, sobram)

def secao_de(num):
    for s in SECOES:
        for pref in s[3]:
            if num == pref or num.startswith(pref + '.'):
                return s[0]
    raise SystemExit('sem seção: ' + num)

secoes = []
for num_s, titulo, cond, _ in SECOES:
    reqs = []
    for num, cls, texto, pos, neg, itens in P:
        if secao_de(num) != num_s:
            continue
        assert cls == A7[num][0], (num, cls, A7[num][0])
        refs = []
        for it in itens:
            if it not in ANEXO4:
                raise SystemExit('Anexo IV sem item ' + it + ' (pergunta ' + num + ')')
            refs.append({'law': 'RDC nº 67/2007', 'device': 'Anexo IV · Item ' + it, 'text': '\n'.join(ANEXO4[it]), 'url': URL67})
        refs.append({'law': 'RDC nº 67/2007', 'device': 'Anexo VII · Item ' + num})
        reqs.append({'id': 'e' + num.replace('.', '_'), 'text': texto + ' (Anexo VII ' + num + ': ' + CLASSE[cls] + ')', 'condition': None, 'refs': refs,
                     'informativo': cls == 'INF', 'pos': pos, 'neg': neg, 'classe': cls})
    secoes.append({'code': 'v2-' + num_s, 'num': num_s, 'title': titulo, 'condition': 'estereis', 'hint': cond,
                   'item': 'i' + num_s, 'itemNum': num_s, 'itemTitle': titulo, 'requirements': reqs})

# Componentes de cada item, como nos blocos 1–12: cabeçalho com “Não se aplica”
# do item, observações gerais e a prévia “Como sai no relatório”.
extras = []
for s in secoes:
    extras += [{'fn': 'manV2', 'into': s['item'], 'antes': True, 'c': {'t': 'itemhead', 'na': True}},
               {'fn': 'manV2', 'into': s['item'], 'antes': False, 'c': {'t': 'obs', 'label': 'Observações gerais do item'}},
               {'fn': 'manV2', 'into': s['item'], 'c': {'t': 'preview'}}]
cartao = {'title': 'Manipulação de estéreis', 'subtitle': 'RDC 67/2007, Anexo IV — roteiro do Anexo VII, item 18',
          'icon': 'lab', 'sections': secoes, 'extraItems': extras}
json.dump(cartao, open(os.path.join(AQUI, 'cartao13.json'), 'w'), ensure_ascii=False, indent=1)
print('cartao13.json:', len(secoes), 'itens,', sum(len(s['requirements']) for s in secoes), 'perguntas')
