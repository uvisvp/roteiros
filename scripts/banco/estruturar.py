"""Estrutura, no formato do banco v11, as normas que faltavam para os roteiros
fora do núcleo de medicamentos. O texto de cada norma está em fontes/, copiado
da fonte oficial indicada em NORMAS (a data da cópia fica em "vd").

Formato de saída (igual ao do banco): {i, l, u, alt, n: [[id, texto, meta?]],
s: [[id, título]], st, vd, gr}. Ids: aN · aNpu · aNpN · aN-i · aN-a · aNpN-i ·
aN-i-a — a mesma gramática que o motor de citações (nuc--citacoes.js) lê.

Anexos: o banco guarda dispositivos, não anexos. O texto dos anexos que os
roteiros usam fica em "anexos" (lido só pelos módulos que embutem o texto).

Uso: python3 estruturar.py > normas.json   (chamado por aplicar-banco.cjs)
"""
import json, re, sys
from pathlib import Path

FONTES = Path(__file__).with_name('fontes')
VD = '2026-09-26'

NORMAS = [
    {'i': 'rdc-anvisa-551-2021', 'l': 'RDC Anvisa nº 551/2021', 'gr': 'RDC ANVISA',
     'arq': 'rdc-anvisa-551-2021.txt',
     'u': 'https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&link=S&tipo=RDC&numeroAto=00000551&seqAto=000&valorAno=2021&orgao=RDC/DC/ANVISA/MS&cod_modulo=310&cod_menu=9431'},
    {'i': 'resolucao-conjunta-6-2020', 'l': 'Resolução Conjunta nº 6/2020 CMDCA-SP e COMAS-SP', 'gr': 'RESOLUCOES CONJUNTAS',
     'arq': 'resolucao-conjunta-6-2020.txt',
     'u': 'https://legislacao.prefeitura.sp.gov.br/resolucao-conjunta-secretaria-municipal-de-direitos-humanos-e-cidadania-smdhc-cmdca-sp-secretaria-municipal-de-assistencia-e-desenvolvimento-social-smads-comas-6-de-11-de-dezembro-de-2020'},
    {'i': 'portaria-gm-ms-757-2023', 'l': 'Portaria GM/MS nº 757/2023', 'gr': 'PORTARIAS GM/MS',
     'arq': 'portaria-gm-ms-757-2023.txt',
     'u': 'https://www.in.gov.br/en/web/dou/-/portaria-gm/ms-n-757-de-21-de-junho-de-2023-491629280'},
    # Só o Título V do Anexo V (Serviços Residenciais Terapêuticos), na redação vigente:
    # as redações da Portaria GM/MS nº 3.588/2017 foram revogadas e as anteriores
    # repristinadas pela Portaria GM/MS nº 757/2023 (art. 4º, IV a VI).
    {'i': 'portaria-consolidacao-gm-ms-3-2017', 'l': 'Portaria de Consolidação GM/MS nº 3/2017 — Anexo V, Título V (SRT)',
     'gr': 'PORTARIAS GM/MS', 'arq': 'portaria-consolidacao-gm-ms-3-2017-anexo-v-srt.txt',
     'u': 'https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prc0003_03_10_2017.html'},
]

ROM = r'(?:X{0,3})(?:IX|IV|V?I{0,3})'
RE_ART = re.compile(r'^Art\.\s*(\d+)\s*(?:[º°o]|\.)?\s*[-–.]?\s*(.*)$')
RE_PAR = re.compile(r'^§\s*(\d+)\s*[º°o]?\s*[-–.]?\s*(.*)$')
RE_PU = re.compile(r'^Par[aá]grafo\s+[uú]nico\s*[.:\-–]?\s*(.*)$', re.I)
RE_INC = re.compile(r'^(' + ROM + r')\s*[-–]\s*(.*)$')
RE_ALI = re.compile(r'^([a-z])\)\s*(.*)$')
RE_SEC = re.compile(r'^(T[ÍI]TULO|CAP[ÍI]TULO|Cap[íi]tulo|SE[ÇC][ÃA]O|Se[çc][ãa]o)\s+([IVXLC]+)\b\s*[-–.]?\s*(.*)$')


def estrutura(texto):
    nos, secs, anexos = [], [], {}
    art = par = inc = None
    anexo = None
    for linha in texto.splitlines():
        linha = linha.strip()
        if not linha:
            continue
        if (secs and re.fullmatch(r'(T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O)\s+[IVXLC]+', secs[-1][1], re.I)
                and not RE_ART.match(linha) and not RE_SEC.match(linha)):
            secs[-1][1] += ' - ' + linha      # denominação na linha seguinte ao número do título
            continue
        m = re.match(r'^ANEXO\s+(\S+)(?:\s+DO\s+ANEXO\s+(\S+))?', linha)
        if m:
            anexo = linha
            anexos[anexo] = []
            continue
        if anexo:
            anexos[anexo].append(linha)
            continue
        m = RE_SEC.match(linha)
        if m and not RE_ART.match(linha):
            tipo = m.group(1)[0].lower()
            secs.append([tipo + m.group(2).lower(), linha])
            continue
        m = RE_ART.match(linha)
        if m:
            art, par, inc = 'a' + m.group(1), None, None
            nos.append([art, m.group(2)])
            continue
        if art is None:
            continue                      # ementa, preâmbulo
        m = RE_PU.match(linha)
        if m:
            par, inc = art + 'pu', None
            nos.append([par, m.group(1)])
            continue
        m = RE_PAR.match(linha)
        if m:
            par, inc = art + 'p' + m.group(1), None
            nos.append([par, m.group(2)])
            continue
        m = RE_INC.match(linha)
        if m and m.group(1):
            inc = (par or art) + '-' + m.group(1).lower()
            nos.append([inc, m.group(2)])
            continue
        m = RE_ALI.match(linha)
        if m:
            nos.append([(inc or par or art) + '-' + m.group(1), m.group(2)])
            continue
        # continuação do dispositivo anterior (quebra de linha da fonte)
        nos[-1][1] += ' ' + linha
    ids = [n[0] for n in nos]
    dup = {x for x in ids if ids.count(x) > 1}
    if dup:
        raise SystemExit('ids repetidos: %s' % sorted(dup))
    return nos, secs, anexos


def gera():
    out = []
    for n in NORMAS:
        nos, secs, anexos = estrutura((FONTES / n['arq']).read_text(encoding='utf-8'))
        e = {'i': n['i'], 'l': n['l'], 'u': n['u'], 'alt': None, 'n': nos, 's': secs,
             'st': 'vigente', 'vd': VD, 'gr': n['gr']}
        if anexos:
            e['anexos'] = anexos
        out.append(e)
    return out


if __name__ == '__main__':
    json.dump(gera(), sys.stdout, ensure_ascii=False)
