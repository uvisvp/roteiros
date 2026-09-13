from pathlib import Path
import json,re

V='20260913-15'
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Esta etapa roda depois de publicar_ifa_cores.py. A correção é incondicional:
# o bloco estetica-toolbar-v13 já existe e a versão anterior pulava sua troca.
s,n=re.subn(r"const APP_VERSAO\s*=\s*['\"][^'\"]+['\"]",f"const APP_VERSAO = '{V}'",s,count=1)
assert n==1, 'APP_VERSAO não localizado'

for marker in ('__UVIS_IFA_DIRECT_V13__','estetica-toolbar-v13','uvis-rot-icons-v13','home-option-b-overrides'):
    assert marker in s, f'{marker} ausente'

# Estética: remove a reserva visual antiga de 62px + safe-area, independentemente
# de como as aspas do seletor estejam escapadas no JavaScript que monta o srcdoc.
s,n=re.subn(
    r'padding-bottom:calc\(62px \+ env\(safe-area-inset-bottom,0px\)\)!important',
    'padding-bottom:0!important',
    s,
    count=1
)
assert n==1, 'reserva antiga de 62px da Estética não localizada'

# Home: reduz aproximadamente 20% os cards dos núcleos, sem mexer em cores,
# links ou lógica de navegação.
m=re.search(r'(<style id="home-option-b-overrides">)(.*?)(</style>)',s,re.S)
assert m, 'CSS home-option-b-overrides não localizado'
css=m.group(2)
changes={
    '.nuclei-grid{gap:16px!important}':'.nuclei-grid{gap:12px!important}',
    'gap:14px!important;min-height:166px!important;padding:22px 18px 20px!important':'gap:11px!important;min-height:133px!important;padding:17px 14px 16px!important',
    'width:66px!important;height:66px!important':'width:53px!important;height:53px!important',
    'width:31px!important;height:31px!important':'width:25px!important;height:25px!important',
    'font-size:1.05rem!important':'font-size:.98rem!important'
}
for old,new in changes.items():
    assert old in css, f'padrão da home não localizado: {old}'
    css=css.replace(old,new,1)
s=s[:m.start(2)]+css+s[m.end(2):]

assert 'padding-bottom:calc(62px + env(safe-area-inset-bottom,0px))!important' not in s
assert 'min-height:133px!important' in s

p.write_text(s,encoding='utf-8')
Path('Index.html').write_text(s,encoding='utf-8')

# PWA/service worker.
sp=Path('sw.js')
sw=sp.read_text(encoding='utf-8')
sw,n=re.subn(r"const VERSAO = ['\"][^'\"]+['\"]",f"const VERSAO = '{V}'",sw,count=1)
assert n==1, 'VERSAO do SW não localizada'
sp.write_text(sw,encoding='utf-8')

vp=Path('versao.json')
v=json.loads(vp.read_text(encoding='utf-8'))
v['versao']=V
v['banco']='12.1'
v['correcoes']=15
v['notas']='Estética: removida de fato a reserva antiga de 62 px + safe-area que permanecia no HTML publicado e causava a faixa vazia, sobretudo no iPhone. Home: cards dos núcleos reduzidos em cerca de 20% para melhor caber na tela. Mantidas toolbar, IFA e ícones internos.'
vp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(V)
