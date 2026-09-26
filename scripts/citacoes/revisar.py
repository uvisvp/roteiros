"""Revisão dos botões de citação (refs) dos módulos fora do núcleo de medicamentos.

Os botões de citação de cada item foram gerados automaticamente a partir do
texto de fundamentação do item (campo "l" ou "c") e, em alguns módulos, o
gerador atribuiu números à norma errada — por exemplo, “Lei 13.725, art. 65,
c/c art. 92 do ECA” gerou também “ECA, art. 65” (adolescente aprendiz), e
“Art. 29, inciso I, itens 1, 2 e 4, da RDC 502/2021” gerou arts. 1, 2 e 4.

Regra aplicada, item a item: um botão só permanece se o texto de fundamentação
do próprio item citar aquele artigo/item naquela norma. Nunca se remove o
último botão de uma norma citada; quando o texto cita um artigo que ainda não
tem botão e o dispositivo existe no texto normativo embutido no módulo, o
botão é criado.

Uso: python3 revisar.py <modulo> <entrada.txt> <saida.txt>   (chamado por aplicar.cjs)
"""
import re, sys, json, unicodedata

LAWKEY = {
 'lei-municipal-13725-2004': [r'13\.?725'], 'lei-federal-8069-1990': [r'8\.?069', r'\beca\b'],
 'lei-federal-10741-2003': [r'10\.?741', r'estatuto da pessoa idosa', r'estatuto do idoso'],
 'lei-federal-15378-2026': [r'15\.?378'], 'lei-federal-10216-2001': [r'10\.?216'], 'lei-municipal-10348-1987': [r'10\.?348'],
 'decreto-municipal-47334-2006': [r'47\.?334'], 'portaria-sms-2619-2011': [r'2\.?619'], 'portaria-sms-5-2019': [r'\b5/2019'],
 'portaria-sms-266-2025': [r'266/2025'], 'rdc-anvisa-29-2011': [r'29/2011'], 'rdc-anvisa-502-2021': [r'502/2021'],
 'rdc-anvisa-63-2011': [r'63/2011'], 'rdc-anvisa-222-2018': [r'222/2018'], 'rdc-anvisa-42-2010': [r'42/2010'],
 'portaria-svs-ms-344-1998': [r'344/1998', r'344/98'], 'resolucao-conjunta-6-2020': [r'conjunta n?º? ?6/2020', r'\b6/2020'],
 'resolucao-conjunta-2-2014': [r'conjunta n?º? ?2/2014', r'\b2/2014'], 'rdc-anvisa-15-2012': [r'15/2012'],
 'lei-federal-13146-2015': [r'13\.?146'], 'rdc-anvisa-36-2013': [r'36/2013'], 'rdc-anvisa-1002-2025': [r'1\.?002/2025'],
 'rdc-anvisa-509-2021': [r'509/2021'], 'rdc-anvisa-156-2006': [r'156/2006'], 'lei-federal-13643-2018': [r'13\.?643'],
 'rdc-anvisa-56-2009': [r'56/2009'], 'rdc-anvisa-67-2007': [r'67/2007'],
}

# Correções de digitação no texto de fundamentação (conferidas no texto da lei).
TEXTO = {
 'app--servicos-assistenciais': [
   ('Lei Municipal nº 13.725/2004, arts. 19 e 2, c/c', 'Lei Municipal nº 13.725/2004, art. 19, § 2º, c/c'),
   ('arts. 19 e 2 da Lei Municipal nº 13.725/2004', 'art. 19, § 2º, da Lei Municipal nº 13.725/2004'),
   ('Lei Municipal nº 13.725/2004, arts. 50 e 1, c/c', 'Lei Municipal nº 13.725/2004, art. 50, § 1º, c/c'),
 ],
}


def nrm(t):
    return ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn').lower()


def numeros(seg):
    seg = re.sub(r'(\d)\s*[ºo°]', r'\1', nrm(seg))
    toks = re.findall(r'arts?\.?|artigos?|ite(?:m|ns)|incisos?|§+|al[ií]neas?|par[aá]grafos?|\d+/\d+|\d+(?:\.\d+)*|\ba\b|[;,]|[^\s,;]+', seg)
    arts, itens = set(), set()
    modo, ult, faixa, prev = 'art', None, False, []
    for t in toks:
        p1 = prev[-1] if prev else ''
        p2 = prev[-2] if len(prev) > 1 else ''
        prev.append(t)
        if re.match(r'\d+/\d+$', t): continue
        if re.match(r'arts?\.?$|artigos?$', t): modo = 'art'; continue
        if re.match(r'ite(?:m|ns)$', t): modo = 'item'; continue
        if re.match(r'incisos?$|§+$|al[ií]neas?$|par[aá]grafos?$', t): modo = 'x'; continue
        if t == 'a' and ult: faixa = True; continue
        if re.match(r'\d+(?:\.\d+)*$', t):
            if modo == 'x' and (p1 == ',' or (p1 == 'e' and p2 == ',')): modo = 'art'
            if modo == 'art' and '.' not in t:
                if faixa and ult and ult[0] == 'art':
                    arts.update(str(n) for n in range(int(ult[1]), int(t) + 1))
                arts.add(t); ult = ('art', t)
            elif modo == 'item':
                itens.add(t); ult = ('item', t)
            faixa = False
            continue
        if t in ('e', ',', 'caput', 'da', 'do', 'de', 'lei', 'n', 'nº'): continue
        faixa = False
    return arts, itens


def segs(l, law):
    keys = LAWKEY.get(law)
    if not keys: return None
    return [p for p in re.split(r';|\bc/c\b', nrm(l)) if any(re.search(k, p) for k in keys)]


def base(node):
    m = re.match(r'a(\d+)', node)
    if m: return 'a', m.group(1)
    m = re.match(r'n([\d.]+)', node)
    if m: return 'n', m.group(1).rstrip('.')
    return None, node


def valido(l, law, node):
    ss = segs(l, law)
    if ss is None: return None          # norma sem chave conhecida: não se julga
    if not ss: return False
    if all(not any(numeros(s)) for s in ss): return True   # norma citada sem número
    t, num = base(node)
    for s in ss:
        arts, itens = numeros(s)
        if t == 'a' and num in arts: return True
        if t == 'n' and (num in itens or any(i.startswith(num + '.') or num.startswith(i + '.') for i in itens)): return True
    return False


def embutidos(s):
    """Dispositivos do texto normativo embutido no módulo: {lei: {nó: rótulo}}."""
    out = {}
    for m in re.finditer(r'"([a-z0-9-]+)":\{"id":"\1","label":"', s):
        lei = m.group(1)
        fim = s.find('"alterador"', m.end())
        if fim < 0: continue
        out[lei] = {n: r for n, r in re.findall(r'\{"id":"([a-z0-9.-]+)","p":(?:null|"[^"]*"),"t":"[a-z]+","r":"([^"]*)"', s[m.end():fim])}
    return out


def revisar(mod, s):
    for de, para in TEXTO.get(mod, []):
        s = s.replace(de, para)
    emb = embutidos(s)
    stats = {'removidos': 0, 'criados': 0, 'itens': 0}
    rotulo = {}
    for law, lab in re.findall(r'"law":"([^"]+)","node":"[^"]+","label":"([^"]*)"', s):
        rotulo.setdefault(law, lab)

    def novo_refs(l, refs):
        keep = []
        porlei = {}
        for r in refs: porlei.setdefault(r['law'], []).append(r)
        sem = {}
        for law, rs in porlei.items():
            ok = [r for r in rs if valido(l, law, r['node']) is not False]
            if not ok: sem[law] = rs               # decide depois de tentar criar o botão certo
            keep += ok
        # cria botões de artigos citados no texto que ficaram sem botão
        for law in list(LAWKEY):
            ss = segs(l, law)
            if not ss or law not in emb: continue
            cobertos = {base(r['node']) for r in keep if r['law'] == law}
            for sg in ss:
                arts, itens = numeros(sg)
                for a in sorted(arts, key=int):
                    if ('a', a) in cobertos or ('a' + a) not in emb[law]: continue
                    keep.append({'law': law, 'node': 'a' + a, 'label': rotulo.get(law, law), 'display': 'Art. ' + a})
                    cobertos.add(('a', a)); stats['criados'] += 1
                for i in sorted(itens):
                    if ('n', i) in cobertos or ('n' + i) not in emb[law]: continue
                    keep.append({'law': law, 'node': 'n' + i, 'label': rotulo.get(law, law), 'display': 'item ' + i})
                    cobertos.add(('n', i)); stats['criados'] += 1
        for law, rs in sem.items():                # nunca some a norma inteira
            if not any(r['law'] == law for r in keep): keep += rs
        keep.sort(key=lambda r: [x['law'] for x in refs].index(r['law']) if r['law'] in [x['law'] for x in refs] else 99)
        stats['removidos'] += len(refs) - len([r for r in keep if r in refs])
        return keep

    def troca(m):
        l = json.loads('"' + m.group(2) + '"')
        refs = json.loads('[' + m.group(4) + ']')
        nov = novo_refs(l, refs)
        if nov == refs: return m.group(0)
        stats['itens'] += 1
        return m.group(1) + json.dumps(nov, ensure_ascii=False, separators=(',', ':')) + m.group(5)

    s = re.sub(r'("l":"((?:[^"\\]|\\.)*)"(?:,"dn":\{[^{}]*\})?((?:(?!"refs":)[^{}\[\]])*)"refs":)\[((?:\{[^{}]*\},?)*)\](\})',
               lambda m: troca(m), s)
    return s, stats


if __name__ == '__main__':
    mod, ent, sai = sys.argv[1:4]
    s = open(ent, encoding='utf-8').read()
    novo, st = revisar(mod, s)
    open(sai, 'w', encoding='utf-8').write(novo)
    print(mod, json.dumps(st, ensure_ascii=False))
