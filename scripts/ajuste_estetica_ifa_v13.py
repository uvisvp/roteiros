from pathlib import Path
import json,re

V='20260913-16'
p=Path('index.html')
s=p.read_text(encoding='utf-8')

s,n=re.subn(r"const APP_VERSAO\s*=\s*['\"][^'\"]+['\"]",f"const APP_VERSAO = '{V}'",s,count=1)
assert n==1, 'APP_VERSAO não localizado'

for marker in ('__UVIS_IFA_DIRECT_V13__','estetica-toolbar-v13','uvis-rot-icons-v13','home-option-b-overrides'):
    assert marker in s, f'{marker} ausente'

# Estética: nenhuma reserva extra no conteúdo.
s=re.sub(
    r'padding-bottom:calc\(62px \+ env\(safe-area-inset-bottom,0px\)\)!important',
    'padding-bottom:0!important',
    s,
    count=1
)

# O restante da faixa percebida no iPhone vinha da própria toolbar: o padding
# inferior somava a safe-area do iOS, criando uma área branca sem ícones.
old_pad='padding:4px max(8px,env(safe-area-inset-left)) calc(4px + env(safe-area-inset-bottom,0px));'
new_pad='padding:4px 8px;'
assert old_pad in s, 'padding com safe-area da toolbar Estética não localizado'
s=s.replace(old_pad,new_pad,1)

# Home: manter os cards ~20% menores. O código aceita tanto a base grande quanto
# uma execução já compactada, para ser idempotente.
m=re.search(r'(<style id="home-option-b-overrides">)(.*?)(</style>)',s,re.S)
assert m, 'CSS home-option-b-overrides não localizado'
css=m.group(2)
for old,new in (
    ('.nuclei-grid{gap:16px!important}', '.nuclei-grid{gap:12px!important}'),
    ('gap:14px!important;min-height:166px!important;padding:22px 18px 20px!important', 'gap:11px!important;min-height:133px!important;padding:17px 14px 16px!important'),
    ('width:66px!important;height:66px!important', 'width:53px!important;height:53px!important'),
    ('width:31px!important;height:31px!important', 'width:25px!important;height:25px!important'),
    ('font-size:1.05rem!important', 'font-size:.98rem!important')
):
    if old in css:
        css=css.replace(old,new,1)
s=s[:m.start(2)]+css+s[m.end(2):]

assert 'calc(4px + env(safe-area-inset-bottom,0px))' not in s[s.find('estetica-toolbar-v13'):s.find('estetica-toolbar-v13')+1800]
assert 'min-height:133px!important' in s

p.write_text(s,encoding='utf-8')
Path('Index.html').write_text(s,encoding='utf-8')

sp=Path('sw.js')
sw=sp.read_text(encoding='utf-8')
sw,n=re.subn(r"const VERSAO = ['\"][^'\"]+['\"]",f"const VERSAO = '{V}'",sw,count=1)
assert n==1, 'VERSAO do SW não localizada'
sp.write_text(sw,encoding='utf-8')

vp=Path('versao.json')
v=json.loads(vp.read_text(encoding='utf-8'))
v['versao']=V
v['banco']='12.1'
v['correcoes']=16
v['notas']='Estética: eliminada também a faixa inferior específica do iPhone, removendo o padding de safe-area que aumentava a altura da toolbar sem conteúdo. Mantida a toolbar fixa de quatro ícones. Home: cards dos núcleos mantidos cerca de 20% menores.'
vp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(V)
