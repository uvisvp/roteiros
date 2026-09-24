"""Gera o inventário de infrações revisado (Anexo VII + dispositivo material) com textos oficiais."""
import json, re

import os
SP = os.path.dirname(os.path.abspath(__file__)) + '/'
# Textos oficiais do repositório base-vigilancia (clone ao lado de roteiros).
TX = os.environ.get('BASE_TEXTOS', os.path.join(SP, '../../../base-vigilancia/textos/'))
L = [l.strip() for l in open(TX + 'RDC 67-2007--oficial.txt', encoding='utf-8').read().split('\n')]
RANGES = {'RT': (70, 467), 'AI': (467, 993), 'AII': (993, 1059), 'AIII': (1059, 1141), 'AV': (1346, 1431)}
LABEL = {'RT': 'Regulamento Técnico', 'AI': 'Anexo I', 'AII': 'Anexo II', 'AIII': 'Anexo III', 'AV': 'Anexo V'}


def rdc67(tag, num):
    a, b = RANGES[tag]
    pat = re.compile(r'^' + re.escape(num) + r'\.?(\s|$)')
    for i in range(a, b):
        if pat.match(L[i]):
            out = [L[i]]
            j = i + 1
            # junta alíneas e parágrafo seguinte até o próximo item numerado
            while j < b and not re.match(r'^\d+(\.\d+)*\.?\s', L[j]) and len(out) < 18:
                if L[j] and not L[j].startswith(('(Redação', 'Resolução', ')', '____', 'Redações')):
                    out.append(L[j])
                j += 1
            return '\n'.join(out)
    raise KeyError(tag + ' ' + num)


A7 = json.load(open(SP + 'anexo7.json'))  # itens do Anexo VII extraídos do texto oficial
EXTRA = {
    'L5991-15-1': ('Lei nº 5.991/1973 · art. 15, § 1º', 'Art. 15 - A farmácia e a drogaria terão, obrigatoriamente, a assistência de técnico responsável, inscrito no Conselho Regional de Farmácia, na forma da lei.\n§ 1º - A presença do técnico responsável será obrigatória durante todo o horário de funcionamento do estabelecimento.'),
    'R222-5': ('RDC nº 222/2018 · art. 5º', 'Art. 5º Todo serviço gerador deve dispor de um Plano de Gerenciamento de RSS (PGRSS), observando as regulamentações federais, estaduais, municipais ou do Distrito Federal.'),
    'P344-68-69': ('Portaria SVS/MS nº 344/1998 · arts. 68 e 69', 'Art. 68 O Balanço de Substâncias Psicoativas e Outras Substâncias Sujeitas a Controle Especial - BSPO (ANEXO XX), será preenchido com a movimentação do estoque das substâncias constantes das listas deste Regulamento Técnico [...]\n§ 1º O Balanço Anual deverá ser entregue até o dia 31 (trinta e um) de janeiro do ano seguinte [...]\nArt. 69 O Balanço de Medicamentos Psicoativos e de outros Sujeitos a Controle Especial - BMPO [...]'),
    'P344': ('Portaria SVS/MS nº 344/1998', 'Regulamento Técnico sobre substâncias e medicamentos sujeitos a controle especial — prescrição, notificação de receita, retenção e escrituração conforme a lista da substância.'),
}

# n: (itens Anexo VII corretos, dispositivos materiais, bloco novo, observação da revisão)
M = {
 1: (['3.2'], ['EX:L5991-15-1', 'RT 5.18.1'], 3, ''),
 2: (['2.3'], ['RT 5.17.1'], 9, ''),
 3: (['2.5'], ['RT 5.17.4'], 9, ''),
 4: (['2.6'], ['RT 5.13'], 9, ''),
 5: (['3.12'], ['AI 3.3.2'], 3, ''),
 6: (['5.3', '5.6'], ['AI 5.1.3'], 6, 'Vincular ao checklist de equipamentos (balança) de cada laboratório.'),
 7: (['5.5'], ['AI 5.1.3'], 6, ''),
 8: (['7.3.1'], ['AI 4.3'], 6, ''),
 9: (['7.3.4'], ['AI 7.3.1', 'AI 7.3.5'], 6, 'Anexo VII 7.3.4 cita o Anexo I 7.3.1, não 7.3.4 (que trata das especificações/farmacopeias).'),
 10: (['7.3.10'], ['AI 7.3.10'], 10, ''),
 11: (['7.3.20'], ['AI 7.3.10', 'AI 7.3.16'], 10, 'No Anexo I, 7.3.20 é amostragem; o registro das análises está em 7.3.10 e 7.3.16.'),
 12: (['7.3.33'], ['AI 7.3.22'], 6, ''),
 13: (['7.4.8'], ['AI 4.2.5'], 5, 'No Anexo I, 7.4.8 é o registro de entrada de estoque — não é armário de controlados.'),
 14: (['7.4.9'], ['AI 4.2.6'], 5, 'No Anexo I, 7.4.9 é o registro de saída pela ordem de manipulação.'),
 15: (['7.4.17'], ['AI 7.4.6'], 6, 'Anexo I não tem item 7.4.17.'),
 16: (['7.4.19'], ['AI 4.2.4', 'AI 7.4.5'], 5, 'Anexo I não tem 7.4.19; não há dispositivo que diga literalmente “dentro da validade” — usar o Anexo VII (RT 5.20.11) c/c 4.2.4.'),
 17: (['8.1.1'], ['AI 7.5.1'], 1, 'No Anexo I, 8.1.1 não existe (8.1 é rastreabilidade).'),
 18: (['8.2.1'], ['AI 7.5.2'], 11, ''),
 19: (['8.2.6'], ['AI 7.5.2.4'], 11, ''),
 20: (['9.9', '9.10'], ['AI 4.5'], 6, ''),
 21: (['9.17'], ['AI 8.3'], 9, ''),
 22: (['9.29'], ['AI 7.4.5'], 6, 'Anexo VII 9.29 (matéria-prima em uso vencida). Sem dispositivo literal no Anexo I — fundamentar no Anexo VII (RT 5.20.11).'),
 23: (['13.6'], ['AI 4.2.4'], 5, 'Anexo I 13.6 não existe.'),
 24: (['13.8'], ['AI 4.6.1', 'AI 4.2.5'], 5, ''),
 25: (['16.3'], ['AII 2.7'], 7, 'Numeração 16.x é do Anexo VII (capítulo SBIT), não do Anexo I.'),
 26: (['16.4', '16.7'], ['AII 2.10', 'AII 2.10.2'], 7, ''),
 27: (['16.13', '17.22'], ['AI 4.2.6', 'AII 2.11.3', 'AIII 2.15.2'], 7, ''),
 28: (['16.15', '16.17', '17.28'], ['AII 2.11.4', 'AII 2.12.1', 'AIII 2.15.6'], 7, ''),
 29: (['17.7'], ['AIII 2.4'], 1, ''),
 30: (['17.8'], ['AIII 2.7'], 7, ''),
 31: (['17.33.1'], ['RT 5.6', 'RT 5.17.3', 'EX:P344'], 9, ''),
 32: (['17.33.2', '17.33.5'], ['RT 5.6', 'AI 15.5.2', 'EX:P344-68-69'], 9, ''),
 33: (['17.33.6'], ['AI 7.4.7', 'RT 5.6'], 9, ''),
 34: (['18.3.20', '18.4.6'], [], 0, 'REMOVER: preparações estéreis (Anexo IV) estão fora do escopo do módulo. Além disso, 18.3.20 trata de sala “independente e exclusiva”, não de classificação ISO.'),
 35: (['18.7.2', '18.7.3'], [], 0, 'REMOVER: estéreis (Anexo IV) fora do escopo.'),
 36: (['18.8.2'], [], 0, 'REMOVER: estéreis (Anexo IV) fora do escopo.'),
 37: (['18.9.1', '18.9.4'], [], 0, 'REMOVER: estéreis (Anexo IV) fora do escopo.'),
 38: (['19.3'], ['AV 3.1'], 7, ''),
 39: (['19.14'], ['AV 5.2'], 7, ''),
 40: (['20.1'], [], 0, 'REMOVER: dose unitária (Anexo VI) fora do escopo.'),
 41: (['15.1'], ['AI 15.1'], 2, ''),
 42: (['15.2'], ['AI 15.3'], 2, 'No Anexo I o Manual é o 15.3 (15.2 é o conteúdo do SGQ).'),
 43: (['15.4'], ['AI 15.2'], 2, 'No Anexo I, 15.4 é prazo de validade.'),
 44: (['15.5'], ['AI 15.2'], 2, 'Alínea “b” do 15.2 (demanda compatível com a capacidade instalada).'),
 45: (['9.12'], ['RT 5.18.1.1'], 9, ''),
 46: (['9.13'], ['RT 5.18.6'], 9, ''),
 47: (['9.14'], ['AI 8'], 2, 'Caput do item 8 do Anexo I.'),
 48: (['9.15'], ['AI 8.1'], 10, ''),
 49: (['9.19', '9.20'], ['AI 8.3.2', 'AI 8.4'], 10, ''),
 50: (['9.21'], ['AI 8.5'], 6, ''),
 51: (['9.22'], ['AI 8.6'], 2, ''),
 52: (['9.23', '9.24'], ['AI 5.4.1', 'AI 5.4.2'], 6, ''),
 53: (['9.26'], ['AI 8.7'], 8, ''),
 54: (['9.27', '9.28'], ['AI 8.8'], 6, ''),
 55: (['4.2'], ['AI 4', 'AI 4.14'], 1, 'No Anexo I, 4.2 é a área de armazenamento — citação errada.'),
 56: (['4.3'], ['AI 4.13'], 5, 'No Anexo I, 4.3 é a sala de controle de qualidade.'),
 57: (['4.5'], ['AI 4.13', 'AI 6.2'], 5, 'Sem correspondente literal no Anexo I; fundamentar no Anexo VII 4.5 (RT 5.20.11).'),
 58: (['4.6'], ['AI 4.16'], 5, 'No Anexo I, 4.6 é a área de dispensação.'),
 59: (['4.10'], ['AI 4.15'], 5, 'No Anexo I, 4.10 é o DML.'),
 60: (['4.15'], ['AI 4.7'], 6, 'No Anexo I, 4.15 são os ralos.'),
 61: (['4.19'], ['AI 4.10'], 4, 'Anexo I não tem 4.19.'),
 62: (['4.21'], ['AI 4.11'], 5, 'Anexo I não tem 4.21.'),
 63: (['5.1'], ['AI 5.1.1'], 6, ''),
 64: (['5.6.1', '5.6.2'], ['AI 5.2.1'], 6, 'Vincular ao checklist de equipamentos.'),
 65: (['5.10', '5.12'], ['AI 5.2.1', 'AI 5.2.2'], 6, ''),
 66: (['5.18'], ['AI 3.3.6', 'AIII 2.11'], 3, ''),
 67: (['6.1'], ['AI 6'], 2, 'No Anexo I, 6.1 é limpeza de equipamentos; o POP de limpeza é o caput do item 6.'),
 68: (['6.5'], ['RT 5.2', 'EX:R222-5'], 4, ''),
 69: (['6.6'], ['AI 4.12'], 2, ''),
 70: (['7.1.1', '7.1.2'], ['AI 7.1.2', 'AI 7.1.3'], 10, ''),
 71: (['7.1.4', '7.1.5'], ['AI 7.1.5', 'AI 7.1.6'], 10, 'No Anexo I, 7.1.4 é o cadastro de fornecedores.'),
 72: (['7.2.2', '7.2.4'], ['AI 7.2.1'], 10, ''),
 73: (['7.2.6'], ['AI 7.2.4'], 10, 'No Anexo I, 7.2.6 é o conteúdo do certificado.'),
 74: (['7.2.7'], ['AI 7.2.7', 'AI 7.4.2'], 5, ''),
 75: (['7.4.3', '7.4.4'], ['AI 4.2.1'], 5, ''),
 76: (['7.4.6', '7.4.7'], ['AI 4.2.3', 'AI 4.2.4'], 5, 'No Anexo I, 7.4.6 são os alertas de diluição e 7.4.7 o controle de estoque.'),
 77: (['7.4.16'], ['AI 7.4.5'], 5, ''),
 78: (['7.4.18'], ['AI 7.4.7'], 5, ''),
 79: (['8.1.7'], ['AI 7.5.1.3'], 11, ''),
 80: (['8.2.4'], ['AI 7.5.2.2'], 11, ''),
 81: (['10.1.1'], ['AI 9.1.1'], 10, 'No Anexo I, 10.1.1 não existe (10 é estoque mínimo).'),
 82: (['10.2.2', '10.2.3', '10.2.4', '10.2.5', '10.2.6'], ['AI 9.2.1', 'AI 9.2.3', 'AI 9.2.3.1', 'AI 9.2.6', 'AI 9.2.7'], 11, 'Estava “10.2” — é título de capítulo do Anexo VII, não item avaliável.'),
 83: (['12.3'], ['AI 12.1', 'AI 12.2'], 10, 'No Anexo I, 12.3 são as advertências complementares.'),
 84: (['13.3'], ['AI 13.1'], 12, ''),
 85: (['14.2'], ['AI 14.2'], 9, ''),
 86: (['15.7.1', '15.7.3', '15.7.4', '15.7.6'], ['RT 5.19', 'AI 15.5.5', 'AI 15.5.6', 'AI 15.5.7'], 2, 'Estava “15.7” — é título (Documentação) no Anexo VII; no Anexo I, 15.7 é reclamações.'),
 87: (['15.8.1', '15.8.1.1', '15.8.3'], ['AI 3.2', 'AI 3.2.1'], 2, 'Estava “15.8” — título do Anexo VII; no Anexo I não existe 15.8.'),
 88: (['15.9.1', '15.9.2', '15.9.3'], ['AI 15.6', 'AI 15.6.1'], 2, 'Estava “15.9” — título do Anexo VII.'),
 89: (['15.10.1', '15.10.2', '15.10.3'], ['AI 15.7'], 2, 'Estava “15.10” — título do Anexo VII.'),
 90: (['3.9', '3.10'], ['AI 3.3.1'], 3, ''),
 91: (['3.16', '3.18'], ['AI 3.3.6', 'AI 3.3.7'], 3, ''),
 92: (['17.33.4'], ['RT 5.18.7', 'EX:P344'], 9, ''),
 93: (['2.1'], [], 5, 'Sem dispositivo no Anexo I; fundamentar no Anexo VII 2.1 (RT 5.20.11).'),
 94: (['3.3'], ['AI 3'], 3, 'Caput do item 3 do Anexo I.'),
 95: (['3.5'], ['AI 3.1'], 3, ''),
 96: (['3.8'], ['AI 3.3.9'], 3, ''),
 97: (['3.11'], ['AI 3.3.1'], 2, ''),
 98: (['3.20'], ['AI 3.3.7'], 3, ''),
 99: (['4.7'], [], 5, 'Sem dispositivo no Anexo I; fundamentar no Anexo VII 4.7 (RT 5.20.11).'),
 100: (['4.9.1'], ['AI 5.1.2'], 5, ''),
 101: (['4.11'], ['AI 4.8'], 5, ''),
 102: (['4.14'], ['AI 3.3.10', 'AI 4.8'], 5, ''),
 103: (['4.16'], ['AI 4.9'], 5, ''),
 104: (['4.20'], ['AI 4.10'], 4, ''),
 105: (['4.22'], ['AI 4.1'], 5, ''),
 106: (['5.7'], ['AI 5.1'], 6, ''),
 107: (['5.14', '5.15', '5.16'], ['AI 5.3'], 2, ''),
 108: (['5.19', '5.20', '5.21'], ['AI 4.18', 'AI 5.1.4'], 5, ''),
 109: (['5.23'], ['AI 5.5'], 5, ''),
 110: (['6.3.1'], ['AI 6.2'], 4, ''),
 111: (['7.1.3'], ['AI 7.1.4'], 10, ''),
 112: (['7.3.7'], ['AI 8.8', 'AI 4.2.1'], 6, ''),
 113: (['7.3.25', '7.3.26', '7.3.27', '7.3.28'], ['AI 7.3.18', 'AI 7.3.19'], 6, ''),
 114: (['9.4'], ['AI 4.4.1'], 6, ''),
 115: (['9.12.3'], ['RT 5.18.4'], 9, ''),
 116: (['9.18'], ['AI 8.3.1'], 9, ''),
 117: (['10.1.4'], ['AI 9.1.3'], 10, ''),
 118: (['12.2'], ['AI 12'], 10, 'Caput do item 12 do Anexo I (12.2 é rótulo de oficinal).'),
 119: (['14.3'], ['RT 5.17.5', 'RT 5.17.5.1'], 9, 'O item 14.3 do Anexo I foi revogado (RDC 87/2008); a obrigação está no RT 5.17.5.'),
 120: (['15.6.1', '15.6.2'], ['AI 15.4.1'], 2, ''),
}

CLS = {'I': 'Imprescindível', 'N': 'Necessário', 'R': 'Recomendável', 'INF': 'Informativo'}
data = json.load(open(SP + 'app-data-v1.json'))
texts = {}
out = []
for inf in data['infractions']:
    n = inf['n']
    a7, devs, block, note = M[n]
    cls = [A7[x][0] for x in a7 if x in A7]
    for x in a7:
        if x not in A7:
            raise SystemExit('Anexo VII sem item ' + x)
        texts['A7 ' + x] = ('RDC nº 67/2007 · Anexo VII · item ' + x + ' (' + (A7[x][0] or '') + ')', A7[x][1])
    dev_keys = []
    for d in devs:
        if d.startswith('EX:'):
            k = d[3:]
            texts[k] = EXTRA[k]
        else:
            tag, num = d.split()
            k = d
            texts[k] = ('RDC nº 67/2007 · ' + LABEL[tag] + ' · item ' + num, rdc67(tag, num))
        dev_keys.append(k)
    old = inf['item']
    status = 'remover' if block == 0 else ('corrigido' if (note and not note.startswith('Vincular')) else 'ok')
    out.append({'n': n, 'd': inf['description'], 'old': old, 'a7': a7,
                'cls': (cls[0] if cls else ''), 'dev': dev_keys, 'b': block, 'note': note, 'st': status})

json.dump({'items': out, 'texts': {k: {'t': v[0], 'x': v[1]} for k, v in texts.items()}},
          open(SP + 'inventario-revisado.json', 'w'), ensure_ascii=False)

# Tabela markdown para a revisão
rows = ['| Nº | Infração | Como está | Roteiro (Anexo VII) | Dispositivo material | Bloco novo | Observação |', '|---|---|---|---|---|---|---|']
BN = {0: '— (remover)', 1: '1 Identificação', 2: '2 Documentação', 3: '3 Pessoal', 4: '4 Resíduos', 5: '5 Áreas físicas', 6: '6 Laboratórios', 7: '7 SBIT/sensib./homeo', 8: '8 Exaustão', 9: '9 Receitas', 10: '10 Rastreab./CQ', 11: '11 Monitoramento', 12: '12 Venda remota'}
for o in out:
    dv = '; '.join(texts[k][0].replace('RDC nº 67/2007 · ', '') for k in o['dev']) or '(só Anexo VII)'
    a7s = ', '.join(o['a7']) + (' (' + o['cls'] + ')' if o['cls'] else '')
    rows.append(f"| {o['n']} | {o['d']} | Anexo I · {o['old']} | {a7s} | {dv} | {BN[o['b']]} | {o['note']} |")
open(SP + 'inventario-revisado.md', 'w').write('\n'.join(rows))
from collections import Counter
print(Counter(o['st'] for o in out), len(texts))
