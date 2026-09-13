from pathlib import Path
import json,re
V='20260913-12'
p=Path('index.html')
s=p.read_text(encoding='utf-8')
# version
s,n=re.subn(r"const APP_VERSAO\s*=\s*['\"][^'\"]+['\"]",f"const APP_VERSAO = '{V}'",s,count=1)
assert n==1
# iOS srcdoc safeguard
if "var iosUvis = /iP(hone|ad|od)/i.test(uvisUa)" not in s:
    old="var local = String(location.protocol||'').toLowerCase() === 'file:';"
    new="var uvisUa = String(navigator.userAgent||'');\n    var iosUvis = /iP(hone|ad|od)/i.test(uvisUa) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);\n    var local = String(location.protocol||'').toLowerCase() === 'file:' || iosUvis;"
    assert old in s
    s=s.replace(old,new,1)
# robust delegated shell click
pat=re.compile(r"  document\.addEventListener\('click', function\(e\)\{\n    var n = e\.target\.closest\('\[data-nucleo\]'\);\n    if\(n\)\{ var k = n\.dataset\.nucleo;\n      if\(ROTEIROS\[k\] && ROTEIROS\[k\]\.length\)\{\n        e\.preventDefault\(\); e\.stopPropagation\(\);\n        nucleoAtual = k;\n        if\(ROTEIROS\[k\]\.length === 1\)\{ var r = ROTEIROS\[k\]\[0\]; abrirApp\(r\[2\], r\[0\], r\[3\] \|\| ''\); \}\n        else telaLista\(k\);\n      \}\n      return; \}\n    if\(e\.target\.closest\('\[data-home\]'\)\)\{ telaHome\(\); return; \}\n    if\(e\.target\.closest\('\[data-lista\]'\)\)\{ voltarDoModulo\(\); return; \}\n    var c = e\.target\.closest\('#abrir-consultas'\);\n    if\(c\)\{ e\.preventDefault\(\); e\.stopPropagation\(\);\n      abrirApp\('central-consultas','Central de Consultas'\); \}\n  \}, true\);")
repl="""  document.addEventListener('click', function(e){
    var target=e.target;
    if(!target)return;
    if(target.nodeType!==1)target=target.parentElement;
    if(!target||!target.closest)return;
    var n=target.closest('[data-nucleo]');
    if(n){var k=n.dataset.nucleo;
      if(ROTEIROS[k]&&ROTEIROS[k].length){
        e.preventDefault();e.stopPropagation();e.__uvisCascaHandled=true;
        nucleoAtual=k;
        if(ROTEIROS[k].length===1){var r=ROTEIROS[k][0];abrirApp(r[2],r[0],r[3]||'');}
        else telaLista(k);
      }
      return;}
    if(target.closest('[data-home]')){e.__uvisCascaHandled=true;telaHome();return;}
    if(target.closest('[data-lista]')){e.__uvisCascaHandled=true;voltarDoModulo();return;}
    var c=target.closest('#abrir-consultas');
    if(c){e.preventDefault();e.stopPropagation();e.__uvisCascaHandled=true;abrirApp('central-consultas','Central de Consultas');}
  }, true);"""
if 'e.__uvisCascaHandled=true' not in s:
    s,n=pat.subn(repl,s,count=1)
    assert n==1, 'shell listener not patched'
else:
    n=0
# direct fallback bindings
marker='window.__UVIS_CASCA_DIRECT_BINDINGS__'
if marker not in s:
    anchor="  window.addEventListener('message', function(e){"
    assert anchor in s
    add="""
  /* Fallback direto para Safari/PWA: os botões principais não dependem apenas
     da delegação de eventos. Isso evita o caso em que o toque destaca o botão
     mas a navegação não é executada. */
  window.__UVIS_CASCA_DIRECT_BINDINGS__=true;
  function abrirNucleoDireto(k){
    if(!(ROTEIROS[k]&&ROTEIROS[k].length))return;
    nucleoAtual=k;
    if(ROTEIROS[k].length===1){var r=ROTEIROS[k][0];abrirApp(r[2],r[0],r[3]||'');}
    else telaLista(k);
  }
  function bindCascaDireta(){
    document.querySelectorAll('[data-nucleo]').forEach(function(b){
      if(b.dataset.uvisBound==='1')return;b.dataset.uvisBound='1';
      b.addEventListener('click',function(e){if(e.__uvisCascaHandled)return;e.preventDefault();abrirNucleoDireto(b.dataset.nucleo);},false);
    });
    var consultas=$('abrir-consultas');
    if(consultas&&consultas.dataset.uvisBound!=='1'){
      consultas.dataset.uvisBound='1';
      consultas.addEventListener('click',function(e){if(e.__uvisCascaHandled)return;e.preventDefault();abrirApp('central-consultas','Central de Consultas');},false);
    }
    document.querySelectorAll('[data-home]').forEach(function(b){if(b.dataset.uvisBound==='1')return;b.dataset.uvisBound='1';b.addEventListener('click',function(e){if(e.__uvisCascaHandled)return;e.preventDefault();telaHome();},false);});
    document.querySelectorAll('[data-lista]').forEach(function(b){if(b.dataset.uvisBound==='1')return;b.dataset.uvisBound='1';b.addEventListener('click',function(e){if(e.__uvisCascaHandled)return;e.preventDefault();voltarDoModulo();},false);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindCascaDireta,{once:true});else bindCascaDireta();

"""
    s=s.replace(anchor,add+anchor,1)
# IFA click safety
s=s.replace("document.addEventListener('click',function(e){if(e.target.closest('#search'))complementar();},true);",
            "document.addEventListener('click',function(e){var t=e.target;if(t&&t.nodeType!==1)t=t.parentElement;if(t&&t.closest&&t.closest('#search'))complementar();},true);")
s=s.replace("var modeBtn=e.target&&e.target.closest&&e.target.closest('.mode');if(modeBtn&&modeBtn.getAttribute('data-mode')!=='ifa'){var ib=ifaButton();if(ib)ib.classList.remove('on');}\n          if(ativo()&&e.target&&e.target.closest&&e.target.closest('#search')){e.preventDefault();e.stopImmediatePropagation();consultar();}",
            "var t=e.target;if(t&&t.nodeType!==1)t=t.parentElement;var modeBtn=t&&t.closest&&t.closest('.mode');if(modeBtn&&modeBtn.getAttribute('data-mode')!=='ifa'){var ib=ifaButton();if(ib)ib.classList.remove('on');}\n          if(ativo()&&t&&t.closest&&t.closest('#search')){e.preventDefault();e.stopImmediatePropagation();consultar();}")
# Replace old vivid styles and any prior option B
s=re.sub(r'<style id="uvis-publish-vivid-20260913">.*?</style>\s*','',s,flags=re.S)
s=re.sub(r'<style id="home-option-b-overrides">.*?</style>\s*','',s,flags=re.S)
css=r'''<style id="home-option-b-overrides">
:root{
  --brand:#174C68;--brand-strong:#103C54;--brand-mid:#25535B;--brand-soft:#E8F0F4;
  --t-med:#286B94;--t-med-d:#205777;--t-med-w:#E6F0F6;
  --t-ali:#2B7D4D;--t-ali-d:#23663F;--t-ali-w:#E7F3EB;
  --t-ser:#5754A3;--t-ser-d:#49468A;--t-ser-w:#ECEBFA;
  --t-pro:#A0651D;--t-pro-d:#855216;--t-pro-w:#F8EFE2;
  --t-ass:#9B3868;--t-ass-d:#812F57;--t-ass-w:#F8E8F0;
  --t-odo:#2A6F7B;--t-odo-d:#235C66;--t-odo-w:#E6F1F3;
}
.hero{background:#fff!important;border:1px solid #D7E1E8!important;box-shadow:0 10px 28px rgba(23,55,79,.08)!important}
.hero .brand{color:#152536!important}.hero #titulo-principal{color:#607285!important}
.quick-action{background:#fff!important;color:#20364A!important;border:1px solid #D6E0E7!important;box-shadow:none!important}
.quick-action.primary{background:#1E5877!important;color:#fff!important;border-color:#1E5877!important;box-shadow:0 8px 18px rgba(30,88,119,.18)!important}
.quick-action.primary:hover,.quick-action.primary:focus-visible{background:#174A66!important;border-color:#174A66!important}
.section-heading h2{color:#455B70!important;text-align:center!important;letter-spacing:.13em!important;text-transform:uppercase!important}
.nuclei-grid{gap:16px!important}
.nucleus-card{grid-template-columns:1fr!important;justify-items:center!important;text-align:center!important;gap:14px!important;min-height:166px!important;padding:22px 18px 20px!important;border:0!important;color:#fff!important;box-shadow:0 9px 22px rgba(18,38,63,.15)!important}
.nucleus-card::before{display:none!important}
.nucleus-symbol{width:66px!important;height:66px!important;border-radius:999px!important;background:#fff!important;border:0!important;box-shadow:0 7px 16px rgba(10,25,45,.20)!important}
.nucleus-symbol svg{width:31px!important;height:31px!important}
.nucleus-content{align-items:center!important}
.nucleus-content strong{color:#fff!important;font-size:1.05rem!important;font-weight:760!important;text-align:center!important;text-shadow:none!important}
.nucleus-content span,#tela-home .nucleus-go{display:none!important}
.nucleus-card[data-nucleo="Medicamentos"]{background:#286B94!important}
.nucleus-card[data-nucleo="Alimentos"]{background:#2B7D4D!important}
.nucleus-card[data-nucleo="Serviços"]{background:#5754A3!important}
.nucleus-card[data-nucleo="Produtos"]{background:#A0651D!important}
.nucleus-card[data-nucleo="Serviços assistenciais"]{background:#9B3868!important}
.nucleus-card[data-nucleo="Odontologia"]{background:#2A6F7B!important}
.nucleus-card[data-nucleo="Medicamentos"] .nucleus-symbol{color:#286B94!important}
.nucleus-card[data-nucleo="Alimentos"] .nucleus-symbol{color:#2B7D4D!important}
.nucleus-card[data-nucleo="Serviços"] .nucleus-symbol{color:#5754A3!important}
.nucleus-card[data-nucleo="Produtos"] .nucleus-symbol{color:#A0651D!important}
.nucleus-card[data-nucleo="Serviços assistenciais"] .nucleus-symbol{color:#9B3868!important}
.nucleus-card[data-nucleo="Odontologia"] .nucleus-symbol{color:#2A6F7B!important}
.rot-card{background:var(--casca-tone,#174C68)!important;border-color:var(--casca-tone-dark,#103C54)!important;box-shadow:0 7px 18px rgba(20,50,70,.14)!important}
.rot-card b,.rot-card span,.rot-card i{color:#fff!important}.rot-card span{opacity:.90}.rot-ic{background:#fff!important;color:var(--casca-tone,#174C68)!important;border:0!important}
</style>'''
idx=s.rfind('</body>');assert idx!=-1
s=s[:idx]+css+'\n'+s[idx:]
p.write_text(s,encoding='utf-8')
Path('Index.html').write_text(s,encoding='utf-8')

# Service worker / PWA
sp=Path('sw.js')
sw=sp.read_text(encoding='utf-8')
sw,n=re.subn(r"const VERSAO = ['\"][^'\"]+['\"]",f"const VERSAO = '{V}'",sw,count=1)
assert n==1, 'VERSAO do service worker não localizada'
sp.write_text(sw,encoding='utf-8')

vp=Path('versao.json')
v=json.loads(vp.read_text(encoding='utf-8'))
v['versao']=V
v['banco']='12.1'
v['correcoes']=12
v['notas']='Correção de navegação no Safari/PWA: cliques da tela inicial usam alvo seguro e bindings diretos de fallback; módulos continuam abrindo por srcdoc no iPhone/iPad. Home adotada no padrão B, com cartões preenchidos por núcleo, texto branco e ícone em disco branco. Mantida a correção IFA por processo.'
vp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(V)
