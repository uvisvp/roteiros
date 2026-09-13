from pathlib import Path
import json,re,subprocess

V='20260913-17'
p=Path('index.html')

# Ajuste estrutural dentro do bloco comprimido de Serviços > Estética.
subprocess.run(['node','scripts/fix-estetica-final.cjs'],check=True)
s=p.read_text(encoding='utf-8')

s,n=re.subn(r"const APP_VERSAO\s*=\s*['\"][^'\"]+['\"]",f"const APP_VERSAO = '{V}'",s,count=1)
assert n==1, 'APP_VERSAO não localizado'

for marker in ('__UVIS_IFA_DIRECT_V13__','estetica-toolbar-v13','uvis-rot-icons-v13','home-option-b-overrides'):
    assert marker in s, f'{marker} ausente'

# Estética: nenhuma reserva extra criada pela casca.
s=re.sub(
    r'padding-bottom:calc\(62px \+ env\(safe-area-inset-bottom,0px\)\)!important',
    'padding-bottom:0!important',
    s,
    count=1
)

# A toolbar já estava compacta na versão anterior; aceitar as duas formas para
# manter a publicação idempotente.
old_pad='padding:4px max(8px,env(safe-area-inset-left)) calc(4px + env(safe-area-inset-bottom,0px));'
new_pad='padding:4px 8px;'
if old_pad in s:
    s=s.replace(old_pad,new_pad,1)
assert new_pad in s[s.find('estetica-toolbar-v13'):s.find('estetica-toolbar-v13')+1800], 'padding compacto da toolbar Estética ausente'

# Voltar a usar o botão nativo "Ver selecionadas" na faixa de ações da Estética.
# O dock antigo de Consulta continua oculto; somente #acoesMobile é reexibido.
old_hide=r'html[data-uvis-app=\"estetica\"] #estetica-consulta-dock,html[data-uvis-app=\"estetica\"] #acoesMobile{display:none!important}'
new_hide=r'html[data-uvis-app=\"estetica\"] #estetica-consulta-dock{display:none!important}'
if old_hide in s:
    s=s.replace(old_hide,new_hide,1)
else:
    # Aceitar também a forma sem escapes, caso a casca seja recomposta assim.
    old_plain='html[data-uvis-app="estetica"] #estetica-consulta-dock,html[data-uvis-app="estetica"] #acoesMobile{display:none!important}'
    new_plain='html[data-uvis-app="estetica"] #estetica-consulta-dock{display:none!important}'
    if old_plain in s:
        s=s.replace(old_plain,new_plain,1)
assert '#estetica-consulta-dock,html[data-uvis-app=' not in s[s.find('estetica-toolbar-v13'):s.find('estetica-toolbar-v13')+1000], 'acoesMobile ainda está oculto pela casca'

# Home: preservar exatamente a compactação já aprovada (~20% menor). O bloco
# abaixo só evita regressão porque publicar_ifa_cores.py recompõe a base antiga.
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
v['correcoes']=17
v['notas']='Serviços > Estética: restaurado o botão nativo Ver selecionadas na faixa inferior móvel, sem ampliar a faixa com safe-area; removida a abertura automática do primeiro grupo Licenciamento e regularidade no iPhone nas abas Interesse à saúde e Serviços de saúde. Demais núcleos preservados.'
vp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(V)
