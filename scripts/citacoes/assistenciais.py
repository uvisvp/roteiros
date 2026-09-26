"""Serviços assistenciais — fundamentos revistos (setembro/2026).

1. Textos das normas embutidos no módulo:
   - Portaria GM/MS nº 3.090/2011 estava sem nenhum dispositivo. Ela alterou a
     Portaria GM/MS nº 106/2000, e as duas estão consolidadas na Portaria de
     Consolidação GM/MS nº 3/2017, Anexo V, Título V (arts. 77 a 91) e Anexo 4 do
     Anexo V — redação vigente após a Portaria GM/MS nº 757/2023, que revogou a
     Portaria nº 3.588/2017 e repristinou o art. 77, parágrafo único, o art. 80,
     § 1º, e o Anexo 4. A SRT passa a citar a Portaria de Consolidação.
   - Resolução Conjunta nº 6/2020 CMDCA-SP e COMAS-SP estava como "síntese";
     passa ao texto literal.
   - Todo dispositivo citado por um botão passa a existir no texto embutido
     (artigo inteiro, com parágrafos, incisos e alíneas), copiado do banco.
2. Art. 22 da Lei nº 13.725/2004 (edificações em geral) saiu onde há dispositivo
   próprio: arts. 61 e 65 (higiene; instalações e equipamentos), 63 (condições
   do serviço). Fica, com o inciso II (prevenção de acidentes e intoxicações),
   só na guarda de saneantes e no AVCB de SAICA e demais acolhimentos — é o
   dispositivo exato para esses dois casos. Comunicação de violência ao
   Conselho Tutelar e ao Ministério Público passa a citar só ECA e Estatuto da
   Pessoa Idosa, que é onde a obrigação está. O art. 46 (estabelecimentos de
   produtos) saiu da guarda de saneantes e da cozinha da SRT.
3. "Portaria SMS nº 266/2025, com a alteração da Portaria SMS nº 456/2025": a
   Portaria 456 só mudou a vigência (art. 45); o banco já tem o texto
   consolidado. Cita-se a Portaria 266 (texto consolidado).
4. SAICA e demais acolhimentos não são estabelecimentos de assistência à saúde:
   são de interesse indireto da saúde (art. 69 da Lei nº 13.725/2004, como já diz
   o enquadramento). Neles, os arts. 61 a 68 (Capítulo dos estabelecimentos de
   assistência à saúde) passam a art. 69; ILPI, Centro Dia, CT e SRT seguem nos
   arts. 61 a 68.

Uso: python3 assistenciais.py <modulo.txt> <banco.json> <normas.json> <saida.txt>
"""
import json, re, sys

L = 'lei-municipal-13725-2004'
P3 = 'portaria-consolidacao-gm-ms-3-2017'
P757 = 'portaria-gm-ms-757-2023'
ECA = 'lei-federal-8069-1990'
EI = 'lei-federal-10741-2003'
RC6 = 'resolucao-conjunta-6-2020'
R29 = 'rdc-anvisa-29-2011'
L10348 = 'lei-municipal-10348-1987'
OLD3090 = 'portaria-gm-ms-3090-2011'

ROM = {'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi',
       'xvii', 'xviii', 'xix', 'xx', 'xxi', 'xxii', 'xxiii', 'xxiv', 'xxv'}

P3_TXT = 'Portaria de Consolidação GM/MS nº 3/2017, Anexo V'
P3_A4 = 'Portaria de Consolidação GM/MS nº 3/2017, Anexo 4 do Anexo V'
LEI = 'Lei Municipal nº 13.725/2004'
ELEV_CAD = 'Lei Municipal nº 10.348/1987, arts. 3º a 5º.'
ELEV_CONS = 'Lei Municipal nº 13.725/2004, art. 65, c/c Lei Municipal nº 10.348/1987, arts. 6º, 9º e 11; Decreto Municipal nº 47.334/2006, arts. 1º, 2º e 6º.'
ECA94 = [(ECA, 'a94-vii'), (ECA, 'a94p1b')]

# (serviço, tipo, índice): (texto novo de fundamentação, dispositivos da Lei 13.725,
#  refs acrescentadas, normas cujos refs antigos saem, refs antigos que saem)
S = {}
def spec(sv, k, i, l, lei=(), add=(), drop_laws=(), drop=()):
    S[(sv, k, i)] = dict(l=l, lei=list(lei), add=list(add), drop_laws=set(drop_laws) | {OLD3090}, drop=set(drop))

# ILPI
spec('ilpi', 'inf', 10, LEI + ', art. 63, c/c art. 18 da RDC nº 502/2021.', ['a63'])
spec('ilpi', 'inf', 12, LEI + ', arts. 61 e 65, c/c art. 21 da RDC nº 502/2021.', ['a61', 'a65'])
spec('ilpi', 'inf', 59, ELEV_CAD)
spec('ilpi', 'inf', 60, ELEV_CONS, ['a65'])
# Centro Dia
spec('centrodia', 'rot', 2, 'Item 7.1.3 do Regulamento anexo à Portaria SMS nº 5/2019; arts. 61 e 65 da ' + LEI, ['a61', 'a65'])
spec('centrodia', 'inf', 10, LEI + ', arts. 61 e 65, c/c item 7.1.3 do Regulamento anexo à Portaria SMS nº 5/2019.', ['a61', 'a65'])
spec('centrodia', 'inf', 12, LEI + ', art. 65, c/c item 7.2.2 do Regulamento anexo à Portaria SMS nº 5/2019.', ['a65'])
spec('centrodia', 'inf', 52, ELEV_CAD)
spec('centrodia', 'inf', 53, ELEV_CONS, ['a65'])
# Comunidade terapêutica
spec('ct', 'doc', 5, 'Art. 11 da RDC nº 29/2011')
spec('ct', 'rot', 7, 'Art. 12 da RDC nº 29/2011; arts. 61 e 65 da ' + LEI, ['a61', 'a65'])
spec('ct', 'inf', 15, LEI + ', art. 63, c/c art. 19, incisos V e VI, da RDC nº 29/2011.', ['a63'],
     add=[(R29, 'a19-vi')])
spec('ct', 'inf', 16, LEI + ', art. 63, c/c art. 20, incisos I e IV, da RDC nº 29/2011.', ['a63'], add=[(R29, 'a20-iv')])
spec('ct', 'inf', 17, LEI + ', arts. 61 e 65, c/c art. 20, inciso III, da RDC nº 29/2011.', ['a61', 'a65'])
spec('ct', 'inf', 23, LEI + ', arts. 61 e 65, c/c art. 12 da RDC nº 29/2011.', ['a61', 'a65'])
spec('ct', 'inf', 30, LEI + ', art. 65, c/c art. 14, § 2º, da RDC nº 29/2011.', ['a65'])
spec('ct', 'inf', 40, ELEV_CAD)
spec('ct', 'inf', 41, ELEV_CONS, ['a65'])
# SAICA
A22II = LEI + ', art. 22, II'
spec('saica', 'doc', 4, A22II, ['a22-ii'])
spec('saica', 'rot', 3, 'art. 65 da ' + LEI + '; art. 94, VII e § 1º, da Lei Federal nº 8.069/1990', ['a65'], add=ECA94)
spec('saica', 'rot', 4, 'art. 65 da ' + LEI + '; art. 4º, alínea “i”, da Resolução Conjunta nº 6/2020 CMDCA-SP e COMAS-SP', ['a65'], add=[(RC6, 'a4-i')])
spec('saica', 'rot', 7, 'arts. 61 e 65 da ' + LEI + '; art. 94, VII e § 1º, da Lei Federal nº 8.069/1990', ['a61', 'a65'], add=ECA94)
spec('saica', 'rot', 8, 'arts. 61 e 65 da ' + LEI + '; art. 94, VII e § 1º, da Lei Federal nº 8.069/1990', ['a61', 'a65'], add=ECA94)
spec('saica', 'rot', 17, 'art. 65 da ' + LEI + '; art. 94, VII e § 1º, da Lei Federal nº 8.069/1990', ['a65'], add=ECA94)
spec('saica', 'rot', 18, 'art. 22, II, da ' + LEI, ['a22-ii'])
spec('saica', 'inf', 3, LEI + ', art. 65, c/c arts. 13 e 14 da Resolução Conjunta nº 6/2020 CMDCA-SP e COMAS-SP.', ['a65'])
spec('saica', 'inf', 13, LEI + ', art. 63, c/c art. 18-A da Lei Federal nº 8.069/1990 e art. 4º, alínea “m”, da Resolução Conjunta nº 6/2020 CMDCA-SP e COMAS-SP.',
     ['a63'], add=[(ECA, 'a18b'), (RC6, 'a4-m')], drop={(ECA, 'a18')})
spec('saica', 'inf', 14, LEI + ', arts. 61 e 65, c/c art. 94, VII e § 1º, da Lei Federal nº 8.069/1990.', ['a61', 'a65'], add=ECA94)
spec('saica', 'inf', 17, LEI + ', arts. 61 e 65, c/c art. 94, VII e § 1º, da Lei Federal nº 8.069/1990.', ['a61', 'a65'], add=ECA94)
spec('saica', 'inf', 18, LEI + ', art. 65, c/c art. 94, VII e § 1º, da Lei Federal nº 8.069/1990.', ['a65'], add=ECA94)
spec('saica', 'inf', 19, A22II + '.', ['a22-ii'])
spec('saica', 'inf', 20, LEI + ', art. 65, c/c art. 94, VII e § 1º, da Lei Federal nº 8.069/1990.', ['a65'], add=ECA94)
spec('saica', 'inf', 33, 'Lei Federal nº 8.069/1990, arts. 13 e 94-A.', add=[(ECA, 'a13b'), (ECA, 'a94b')], drop={(ECA, 'a13')})
spec('saica', 'inf', 34, LEI + ', art. 65, c/c art. 4º, alínea “i”, da Resolução Conjunta nº 6/2020 CMDCA-SP e COMAS-SP.', ['a65'], add=[(RC6, 'a4-i')])
spec('saica', 'inf', 39, ELEV_CAD)
spec('saica', 'inf', 40, ELEV_CONS, ['a65'])
# Demais acolhimentos
spec('demais', 'doc', 3, A22II, ['a22-ii'])
spec('demais', 'rot', 2, 'art. 65 da ' + LEI, ['a65'])
spec('demais', 'rot', 5, 'arts. 61 e 65 da ' + LEI, ['a61', 'a65'])
spec('demais', 'rot', 6, 'arts. 61 e 65 da ' + LEI, ['a61', 'a65'])
spec('demais', 'rot', 12, 'art. 65 da ' + LEI, ['a65'])
spec('demais', 'rot', 14, 'art. 65 da ' + LEI, ['a65'])
spec('demais', 'rot', 15, 'art. 22, II, da ' + LEI, ['a22-ii'])
spec('demais', 'rot', 40, 'art. 13 da Lei Federal nº 8.069/1990; art. 19 da Lei Federal nº 10.741/2003',
     add=[(ECA, 'a13b')], drop={(ECA, 'a13')})
spec('demais', 'inf', 11, LEI + ', arts. 61 e 65.', ['a61', 'a65'])
spec('demais', 'inf', 13, LEI + ', art. 65.', ['a65'])
spec('demais', 'inf', 15, LEI + ', art. 65.', ['a65'])
spec('demais', 'inf', 16, LEI + ', arts. 61 e 65.', ['a61', 'a65'])
spec('demais', 'inf', 17, A22II + '.', ['a22-ii'])
spec('demais', 'inf', 18, LEI + ', art. 65.', ['a65'])
spec('demais', 'inf', 33, 'Lei Federal nº 8.069/1990, art. 13, e Lei Federal nº 10.741/2003, art. 19.',
     add=[(ECA, 'a13b')], drop={(ECA, 'a13')})
spec('demais', 'inf', 38, ELEV_CAD)
spec('demais', 'inf', 39, ELEV_CONS, ['a65'])

# SRT — Portaria de Consolidação GM/MS nº 3/2017, Anexo V (Título V e Anexo 4)
def srt(k, i, l, lei=(), p3=()):
    spec('srt', k, i, l, lei, add=[(P3, n) for n in p3], drop_laws={L})
srt('doc', 2, P3_TXT + ', art. 83, IV, e Anexo 4', p3=['a83-iv', 'anx4'])
srt('doc', 3, P3_TXT + ', art. 83, IV, e Anexo 4', p3=['a83-iv', 'anx4'])
srt('doc', 5, P3_TXT + ', art. 80, §§ 1º e 2º', p3=['a80p1', 'a80p2'])
srt('doc', 6, P3_TXT + ', art. 82, e Anexo 4', p3=['a82', 'anx4'])
srt('doc', 9, P3_TXT + ', art. 80, § 4º, e Anexo 4 (SRT Tipo II)', p3=['a80p4', 'anx4-t2'])
srt('doc', 11, P3_TXT + ', art. 85', p3=['a85'])
srt('rot', 1, P3_TXT + ', art. 83, IV, e Anexo 4', p3=['a83-iv', 'anx4'])
srt('rot', 2, 'art. 65 da ' + LEI + '; ' + P3_A4 + ' (SRT Tipo II)', ['a65'], ['anx4-t2'])
srt('rot', 6, 'arts. 61 e 65 da ' + LEI, ['a61', 'a65'])
srt('rot', 8, P3_TXT + ', art. 84, II', p3=['a84-ii'])
srt('rot', 9, P3_TXT + ', art. 84, II, “c”', p3=['a84-ii-c'])
srt('rot', 10, 'art. 65 da ' + LEI + '; ' + P3_A4 + ' (SRT Tipo II)', ['a65'], ['anx4-t2'])
srt('rot', 17, LEI + ', arts. 63 e 65; Lei Federal nº 15.378/2026, arts. 8º e 9º; ' + P3_TXT + ', art. 80, § 4º',
    ['a63', 'a65'], ['a80p4'])
srt('rot', 21, P3_TXT + ', art. 77, parágrafo único, art. 80, § 5º, e art. 84, I', p3=['a77pu', 'a80p5', 'a84-i'])
srt('rot', 22, P3_TXT + ', art. 80, §§ 1º e 2º (§ 1º na redação repristinada pelo art. 4º, V, da Portaria GM/MS nº 757/2023)',
    p3=['a80p1', 'a80p2'])
srt('rot', 23, P3_TXT + ', art. 83, IV', p3=['a83-iv'])
srt('rot', 24, P3_TXT + ', art. 82', p3=['a82'])
srt('rot', 27, 'art. 63 da ' + LEI + '; ' + P3_TXT + ', art. 83, III', ['a63'], ['a83-iii'])
srt('rot', 29, P3_TXT + ', art. 80, § 4º, e Anexo 4', p3=['a80p4', 'anx4'])
srt('rot', 31, P3_TXT + ', art. 85', p3=['a85'])
srt('inf', 1, LEI + ', art. 63, c/c ' + P3_TXT + ', art. 77, parágrafo único, e art. 80, § 5º.', ['a63'], ['a77pu', 'a80p5'])
srt('inf', 2, LEI + ', art. 63, c/c ' + P3_TXT + ', art. 80, §§ 1º e 2º (§ 1º na redação repristinada pelo art. 4º, V, da Portaria GM/MS nº 757/2023).',
    ['a63'], ['a80p1', 'a80p2'])
srt('inf', 3, LEI + ', art. 63, c/c ' + P3_TXT + ', art. 83, IV.', ['a63'], ['a83-iv'])
srt('inf', 5, LEI + ', art. 68, c/c ' + P3_TXT + ', art. 82.', ['a68'], ['a82'])
srt('inf', 8, LEI + ', art. 63, c/c ' + P3_TXT + ', art. 83, III.', ['a63'], ['a83-iii'])
srt('inf', 10, LEI + ', art. 64, c/c ' + P3_A4 + '.', ['a64'], ['anx4'])
srt('inf', 11, LEI + ', art. 64, c/c ' + P3_TXT + ', art. 80, § 4º, e Anexo 4 (SRT Tipo II).', ['a64'], ['a80p4', 'anx4-t2'])
srt('inf', 13, LEI + ', art. 64, c/c ' + P3_TXT + ', art. 85.', ['a64'], ['a85'])
srt('inf', 14, LEI + ', art. 65, c/c ' + P3_TXT + ', art. 84, II.', ['a65'], ['a84-ii'])
srt('inf', 15, LEI + ', art. 65, c/c ' + P3_A4 + ' (SRT Tipo II).', ['a65'], ['anx4-t2'])
srt('inf', 16, LEI + ', arts. 61 e 65.', ['a61', 'a65'])
srt('inf', 17, LEI + ', art. 63, c/c ' + P3_TXT + ', art. 84, II, “c”.', ['a63'], ['a84-ii-c'])
srt('inf', 27, LEI + ', art. 65, c/c ' + P3_TXT + ', art. 84, II, “a” e “c”.', ['a65'], ['a84-ii-a', 'a84-ii-c'])
srt('inf', 28, LEI + ', art. 65, c/c ' + P3_A4 + ' (SRT Tipo II).', ['a65'], ['anx4-t2'])
srt('inf', 29, LEI + ', art. 65, c/c ' + P3_TXT + ', art. 84, II, “d”.', ['a65'], ['a84-ii-d'])
srt('inf', 30, LEI + ', art. 65.', ['a65'])
srt('inf', 31, LEI + ', arts. 63 e 65, c/c Lei Federal nº 15.378/2026, arts. 8º e 9º, e ' + P3_TXT + ', art. 80, § 4º.',
    ['a63', 'a65'], ['a80p4'])
# A Portaria nº 757/2023 aparece junto do limite de moradores, que ela repristinou.
for k in (('srt', 'rot', 22), ('srt', 'inf', 2)):
    S[k]['add'].append((P757, 'a4-v'))

TROCA_L = [('Portaria SMS nº 266/2025, com a alteração da Portaria SMS nº 456/2025', 'Portaria SMS nº 266/2025 (texto consolidado)')]
NORM_E = {
    RC6: 'Procedimentos gerais e parâmetros de funcionamento dos serviços de acolhimento de crianças e adolescentes: capacidade (art. 13), educadores por plantão (art. 14) e projeto político-pedagógico (art. 17). Revogou a Resolução Conjunta nº 3/2016.',
}
NORM_P3 = {'n': 'Portaria de Consolidação GM/MS nº 3/2017 — Anexo V, Título V e Anexo 4', 't': 'vinculante',
           'e': 'Serviços Residenciais Terapêuticos: modalidades Tipo I (até 8 moradores) e Tipo II (até 10), características físico-funcionais, vínculo ao serviço de referência e diretrizes de funcionamento (Anexo 4). Consolida as Portarias GM/MS nº 106/2000 e nº 3.090/2011, na redação repristinada pela Portaria GM/MS nº 757/2023.',
           'u': 'https://bvsms.saude.gov.br/bvs/saudelegis/gm/2017/prc0003_03_10_2017.html', 'lawId': P3}
NORM_757 = 'Revogou a Portaria GM/MS nº 3.588/2017 e repristinou, no Anexo V da Portaria de Consolidação nº 3/2017, o art. 77, parágrafo único, o art. 80, § 1º (SRT Tipo I com até 8 moradores), e o Anexo 4.'


INDIRETOS = ('saica', 'demais')
RE_LEI_ANTES = re.compile(r'(arts?\. )(\d+(?:(?:, | e )\d+)*)( da ' + re.escape(LEI) + ')')
RE_LEI_DEPOIS = re.compile(r'(' + re.escape(LEI) + r', )(arts?\. )(\d+(?:(?:, | e )\d+)*)(?=[,;.]|$)')


def lista_69(nums):
    """'63 e 65 e 68' → '69'; '50 e 67' → '50 e 69'. None se nada muda."""
    ns = [int(x) for x in re.findall(r'\d+', nums)]
    if not any(61 <= n <= 68 for n in ns):
        return None
    out = []
    for n in ns:
        n = 69 if 61 <= n <= 68 else n
        if n not in out:
            out.append(n)
    out.sort()
    txt = [str(n) for n in out]
    return ('art. ' if len(txt) == 1 else 'arts. ') + (txt[0] if len(txt) == 1 else ', '.join(txt[:-1]) + ' e ' + txt[-1])


def texto_69(l):
    def antes(m):
        novo = lista_69(m.group(2))
        if novo is None:
            return m.group(0)
        if m.group(1)[0] == 'A':
            novo = novo[0].upper() + novo[1:]
        return novo + m.group(3)

    def depois(m):
        novo = lista_69(m.group(3))
        return m.group(0) if novo is None else m.group(1) + novo
    return RE_LEI_DEPOIS.sub(depois, RE_LEI_ANTES.sub(antes, l))


def refs_69(refs, ref):
    out, pos = [], None
    for r in refs:
        if r['law'] == L and re.fullmatch(r'a6[1-8](pu|p\d+|-.*)?', r['node'] or ''):
            if pos is None:
                pos = len(out)
            continue
        out.append(r)
    if pos is not None and not any(r['law'] == L and r['node'] == 'a69' for r in out):
        out.insert(pos, ref(L, 'a69'))
    return out


def rotulo(law, node, nos):
    """Rótulo do botão: 'Art. 80, § 1º', 'Art. 84, II, “c”', 'Anexo 4 — SRT Tipo II'."""
    if node.startswith('anx'):
        return next(n['r'] for n in nos if n['id'] == node)
    cad = []
    while node:
        n = next(x for x in nos if x['id'] == node)
        cad.append(n)
        node = n['p']
    partes = []
    for n in reversed(cad):
        r = n['r']
        if n['t'] == 'ali':
            r = '“' + r.rstrip(')') + '”'
        elif n['t'] == 'par' and r == 'Parágrafo único':
            r = 'parágrafo único'
        partes.append(r)
    return ', '.join(partes)


def sem_variante(ult):
    """'vb2' → 'v', 'ib' → 'i'; uma letra só ('b') é a própria alínea."""
    return re.sub(r'(?<=.)b\d*$', '', ult)


def tipo_filho(ult, irmaos, pai_t):
    base = sem_variante(ult)
    if pai_t == 'inc':
        return 'ali'
    if base in ROM and all(sem_variante(s) in ROM for s in irmaos):
        return 'inc'
    return 'ali'


def converte(banco_n):
    """Nós do banco [[id, texto, meta]] → nós do módulo {id, p, t, r, x}."""
    ids = [n[0] for n in banco_n]
    out, tipos = [], {}
    for n in banco_n:
        i, x = n[0], n[1]
        meta = n[2] if len(n) > 2 and isinstance(n[2], dict) else {}
        m = re.match(r'^(.*)-([a-z]+(?:b\d*)?)$', i)
        if m:
            pai, ult = m.group(1), m.group(2)
            irm = [re.match(r'^.*-([a-z]+(?:b\d*)?)$', j).group(1) for j in ids
                   if j.startswith(pai + '-') and re.match(r'^' + re.escape(pai) + r'-[a-z]+(?:b\d*)?$', j)]
            t = tipo_filho(ult, irm, tipos.get(pai))
            base = sem_variante(ult)
            r = base.upper() if t == 'inc' else base + ')'
        else:
            m = re.match(r'^(a\d+b*\d*?)p(u|\d+)b*\d*$', i)
            if m:
                pai, t = m.group(1), 'par'
                r = 'Parágrafo único' if m.group(2) == 'u' else '§ ' + m.group(2) + 'º'
            else:
                m = re.match(r'^a(\d+)(b\d*)?$', i)
                pai, t, r = None, 'art', 'Art. ' + m.group(1)
                ma = re.match(r'^([A-Z])\.\s+', x)
                if m.group(2) and ma:
                    r += '-' + ma.group(1)
                    x = x[ma.end():]
        tipos[i] = t
        no = {'id': i, 'p': pai, 't': t, 'r': r, 'x': x}
        if meta.get('s'):
            no['s'] = meta['s']
        out.append(no)
    return out


def artigo_de(node):
    m = re.match(r'^(a\d+(?:b\d*)?)(?=$|p|-)', node)
    return m.group(1) if m else node


def subarvore(nos_banco, art):
    return [n for n in nos_banco if n[0] == art or re.match(re.escape(art) + r'(p(u|\d+)|-)', n[0])]


def entrada_lei(bl, nos):
    return {'id': bl['i'], 'label': bl['l'], 'grupo': bl.get('gr'), 'url': bl['u'], 'status': bl.get('st') or 'vigente',
            'verificado_em': bl.get('vd'), 'fonte': 'texto oficial extraido de ' + bl['u'], 'modo_parser': 'artigos',
            'preambulo': '', 'secoes': [], 'nos': nos, 'alterador': False, 'anomalias': []}


def anexo4(normas):
    p3 = next(n for n in normas if n['i'] == P3)
    ln = p3['anexos']['ANEXO 4 DO ANEXO V']
    tit, corpo = ln[0], ln[1:]
    k1, k2 = corpo.index('SRT TIPO I'), corpo.index('SRT TIPO II')
    return [
        {'id': 'anx4', 'p': None, 't': 'anexo', 'r': 'Anexo 4 do Anexo V', 'x': tit + ' ' + ' '.join(corpo[:k1])},
        {'id': 'anx4-t1', 'p': 'anx4', 't': 'anexo', 'r': 'Anexo 4 — SRT Tipo I', 'x': ' '.join(corpo[k1 + 1:k2])},
        {'id': 'anx4-t2', 'p': 'anx4', 't': 'anexo', 'r': 'Anexo 4 — SRT Tipo II', 'x': ' '.join(corpo[k2 + 1:])},
    ]


def revisar(s, banco, normas):
    ini = s.index('const DATA=') + len('const DATA=')
    D, fim = json.JSONDecoder().raw_decode(s[ini:])
    BL = {x['i']: x for g in banco['g'].values() for x in g}
    laws = D['laws']
    st = {'itens': 0, 'dispositivos': 0}

    # textos que passam a ser literais (substituídos a partir do banco)
    laws[RC6] = entrada_lei(BL[RC6], [])
    laws[P3] = entrada_lei(BL[P3], anexo4(normas))
    laws.setdefault(P757, entrada_lei(BL[P757], []))

    def ref(law, node):
        return {'law': law, 'node': node, 'label': BL[law]['l'] if law in BL else laws[law]['label'], 'display': None}

    for sv in D['services']:
        for k in ('doc', 'rot', 'inf'):
            for i, it in enumerate(sv[k]):
                for de, para in TROCA_L:
                    if de in it['l']:
                        it['l'] = it['l'].replace(de, para); st['itens'] += 1
                sp = S.get((sv['id'], k, i))
                if not sp:
                    continue
                if it['l'] == (texto_69(sp['l']) if sv['id'] in INDIRETOS else sp['l']):
                    continue                                   # já aplicado
                refs = []
                for r in it['refs']:
                    if r['law'] in sp['drop_laws'] or (r['law'], r['node']) in sp['drop']:
                        continue
                    if r['law'] == L and sp['lei'] is not None and (r['node'] in ('a22', 'a46') or r['node'] not in sp['lei']):
                        continue
                    refs.append(r)
                tem = {(r['law'], r['node']): r for r in refs}
                lei = [tem.get((L, n)) or ref(L, n) for n in sp['lei']]
                outros = [r for r in refs if r['law'] != L] + [ref(*x) for x in sp['add'] if x not in tem]
                it['refs'] = lei + outros
                it['l'] = sp['l']
                st['itens'] += 1
        # interesse indireto da saúde: arts. 61 a 68 → art. 69
        if sv['id'] in INDIRETOS:
            for k in ('doc', 'rot', 'inf'):
                for it in sv[k]:
                    l, refs = texto_69(it['l']), refs_69(it['refs'], ref)
                    if l != it['l'] or refs != it['refs']:
                        it['l'], it['refs'] = l, refs
                        st['itens'] += 1
                    if re.search(r'\bart[s]?\. [^;]*\b6[1-8]\b[^;]*13\.725|13\.725/2004, arts?\. [\d ,e]*\b6[1-8]\b', it['l']):
                        raise SystemExit('arts. 61 a 68 restantes em %s: %s' % (sv['id'], it['l']))
        # lista de normas do serviço
        for n in sv['norm']:
            if n.get('lawId') in NORM_E:
                n['e'] = NORM_E[n['lawId']]
            if n.get('lawId') == OLD3090:
                n.clear(); n.update(NORM_P3)
            if n.get('n') == 'Portaria GM/MS nº 757/2023':
                n['lawId'], n['e'], n['u'] = P757, NORM_757, BL[P757]['u']

    # cada dispositivo citado existe no texto embutido (artigo inteiro, do banco)
    usados = {}
    for sv in D['services']:
        for k in ('doc', 'rot', 'inf'):
            for it in sv[k]:
                for r in it['refs']:
                    if r['node']:
                        usados.setdefault(r['law'], []).append(r['node'])
    for law, nodes in usados.items():
        if law not in laws:
            if law not in BL:
                raise SystemExit('norma sem texto: ' + law)
            laws[law] = entrada_lei(BL[law], [])
        tem = {n['id'] for n in laws[law]['nos']}
        falta_art = []
        for nd in nodes:
            if nd in tem or nd.startswith('anx'):
                continue
            a = artigo_de(nd)
            if a not in falta_art:
                falta_art.append(a)
        if falta_art:
            if law not in BL:
                raise SystemExit('dispositivo sem texto: %s %s' % (law, falta_art))
            novos = []
            for a in falta_art:
                novos += [n for n in subarvore(BL[law]['n'], a) if n[0] not in tem]
            conv = converte(novos)
            laws[law]['nos'] += conv
            st['dispositivos'] += len(conv)
            # ordem do banco
            ordem = {n[0]: j for j, n in enumerate(BL[law]['n'])}
            laws[law]['nos'].sort(key=lambda n: (n['id'].startswith('anx'), ordem.get(n['id'], 10 ** 6)))
        tem = {n['id'] for n in laws[law]['nos']}
        faltam = sorted({nd for nd in nodes if nd not in tem})
        if faltam:
            raise SystemExit('dispositivos ausentes em %s: %s' % (law, faltam))

    # no banco, o art. 69 traz colado o título do capítulo seguinte ("DAS DOENÇAS E AGRAVOS À SAÚDE")
    for n in laws[L]['nos']:
        if n['id'] == 'a69':
            n['x'] = re.sub(r'\s+E AGRAVOS À SAÚDE$', '', n['x'])
    laws.pop(OLD3090, None)
    D['cited'].pop(OLD3090, None)
    for law, nodes in usados.items():
        c = D['cited'].setdefault(law, [])
        for nd in nodes:
            if nd not in c:
                c.append(nd)
    for law in list(D['cited']):
        if law not in usados:
            D['cited'].pop(law)

    # rótulos dos botões novos
    for sv in D['services']:
        for k in ('doc', 'rot', 'inf'):
            for it in sv[k]:
                for r in it['refs']:
                    if r['display'] is None:
                        r['display'] = rotulo(r['law'], r['node'], laws[r['law']]['nos'])
    novo = json.dumps(D, ensure_ascii=False, separators=(',', ':'))
    return s[:ini] + novo + s[ini + fim:], st


if __name__ == '__main__':
    mod, banco, normas, sai = sys.argv[1:5]
    s = open(mod, encoding='utf-8').read()
    novo, st = revisar(s, json.load(open(banco, encoding='utf-8')), json.load(open(normas, encoding='utf-8')))
    open(sai, 'w', encoding='utf-8').write(novo)
    print('app--servicos-assistenciais (fundamentos)', json.dumps(st, ensure_ascii=False))
