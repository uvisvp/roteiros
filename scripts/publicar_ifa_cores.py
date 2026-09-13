# Disparo de publicação 2026-09-13
from pathlib import Path
import json
import re

V = "20260913-11"

p = Path("index.html")
s = p.read_text(encoding="utf-8")

# Versão e cor da barra do navegador.
s, n = re.subn(r"const APP_VERSAO\s*=\s*['\"][^'\"]+['\"]", f"const APP_VERSAO = '{V}'", s, count=1)
assert n == 1, "APP_VERSAO não localizado uma única vez"
s = re.sub(r'<meta name="theme-color" content="[^"]+">', '<meta name="theme-color" content="#062D3E">', s, count=1)

# IFA: a ponte visual marcava IFA, mas o modo interno continuava Registro.
assert "data-uvis-ifa-central" in s, "ponte IFA da Central ausente"
marker = "try{mode='ifa';if(typeof nomeModo==='object')nomeModo.ifa='IFA';}"
if marker not in s:
    s, n = re.subn(
        r"function ativar\(\)\{\s*setMode\('registro'\);",
        "function ativar(){\n          setMode('registro');\n          try{mode='ifa';if(typeof nomeModo==='object')nomeModo.ifa='IFA';}catch(_e){}",
        s,
        count=1,
    )
    assert n == 1, "não foi possível corrigir o modo interno IFA"

s = s.replace(
    "if(q){q.value='';q.placeholder='IFA, fabricante, código, processo Anvisa ou CNPJ do peticionante';q.focus();}",
    "if(q){q.value='';q.inputMode='text';q.placeholder='IFA, fabricante, código, processo Anvisa ou CNPJ do peticionante';q.focus();}",
    1,
)

# Enquanto IFA estiver ativo, o detector genérico não pode sugerir mudar para Processo.
capture_marker = "if(ativo()&&e.target&&e.target.id==='q'){var box=E('detect');if(box)box.innerHTML='';e.stopImmediatePropagation();}"
if capture_marker not in s:
    anchor = """document.addEventListener('click',function(e){
          var mode=e.target&&e.target.closest&&e.target.closest('.mode');if(mode&&mode.getAttribute('data-mode')!=='ifa'){var ib=ifaButton();if(ib)ib.classList.remove('on');}
          if(ativo()&&e.target&&e.target.closest&&e.target.closest('#search')){e.preventDefault();e.stopImmediatePropagation();consultar();}
        },true);"""
    assert anchor in s, "âncora do listener IFA não localizada"
    fixed = """document.addEventListener('input',function(e){
          if(ativo()&&e.target&&e.target.id==='q'){var box=E('detect');if(box)box.innerHTML='';e.stopImmediatePropagation();}
        },true);
        document.addEventListener('click',function(e){
          var modeBtn=e.target&&e.target.closest&&e.target.closest('.mode');if(modeBtn&&modeBtn.getAttribute('data-mode')!=='ifa'){var ib=ifaButton();if(ib)ib.classList.remove('on');}
          if(ativo()&&e.target&&e.target.closest&&e.target.closest('#search')){e.preventDefault();e.stopImmediatePropagation();consultar();}
        },true);"""
    s = s.replace(anchor, fixed, 1)

# Se o processo IFA for digitado no modo Processo, a busca complementar também consulta IFA.
process_old = """Promise.all(FONTES.map(function(f){return fetch(RAIZ+f.p+'/'+fragmento+'.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];}).then(function(d){return {f:f,d:d};});})).then(function(p){inserir(p,processo);});"""
process_new = """var tarefas=FONTES.map(function(f){return fetch(RAIZ+f.p+'/'+fragmento+'.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():[];}).catch(function(){return [];}).then(function(d){return {f:f,d:d};});});
          tarefas.push(fetch(RAIZ+'ifa/registros.json',{cache:'no-store'}).then(function(r){return r.ok?r.json():null;}).then(function(p){var a=p&&Array.isArray(p.registros)?p.registros:[];var d=a.filter(function(x){return dig(x&&x.processo_anvisa)===processo;}).map(function(x){return {produto:x.ifa||'IFA',processo:x.processo_anvisa,categoria:'IFA',cnpj:x.cnpj_detentor_peticionante,detentor:x.detentor_peticionante,fabricante:x.fabricante_ifa,situacao:'',_ifa:true};});return {f:{p:'ifa',l:'IFA — Insumo Farmacêutico Ativo',f:'IFA'},d:d};}).catch(function(){return {f:{p:'ifa',l:'IFA — Insumo Farmacêutico Ativo',f:'IFA'},d:[]};}));
          Promise.all(tarefas).then(function(p){inserir(p,processo);});"""
if "tarefas.push(fetch(RAIZ+'ifa/registros.json'" not in s:
    assert process_old in s, "ponte de busca complementar por processo não localizada"
    s = s.replace(process_old, process_new, 1)

# Compatibilidade iPhone/iPad: dentro do PWA/Safari, Blob URL em iframe pode
# não renderizar de forma confiável após a troca do service worker. Nesses
# dispositivos usamos srcdoc diretamente, que já era o fallback do aplicativo.
ios_marker = "var iosUvis = /iP(hone|ad|od)/i.test(uvisUa) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);"
if ios_marker not in s:
    old = "var local = String(location.protocol||'').toLowerCase() === 'file:';"
    new = "var uvisUa = String(navigator.userAgent||'');\n    var iosUvis = /iP(hone|ad|od)/i.test(uvisUa) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);\n    var local = String(location.protocol||'').toLowerCase() === 'file:' || iosUvis;"
    assert old in s, "âncora da estratégia de renderização do iframe não localizada"
    s = s.replace(old, new, 1)

# Paleta final: fundos preenchidos e conteúdo branco.
style_id = "uvis-publish-vivid-20260913"
s = re.sub(r'<style id="' + re.escape(style_id) + r'">.*?</style>\s*', '', s, flags=re.S)
css = r'''<style id="uvis-publish-vivid-20260913">
:root{
  --brand:#062D3E;--brand-strong:#041F2B;--brand-mid:#25535B;--brand-soft:#E7EFF0;
  --t-med:#0D5E78;--t-med-d:#08485D;--t-med-w:#E5F1F5;
  --t-ali:#2E6B4F;--t-ali-d:#24543E;--t-ali-w:#E6F2EB;
  --t-ser:#3C5E88;--t-ser-d:#2F496B;--t-ser-w:#E8EEF7;
  --t-pro:#9A641F;--t-pro-d:#744913;--t-pro-w:#F7EEDD;
  --t-ass:#8B3F5F;--t-ass-d:#6A3048;--t-ass-w:#F7E8EE;
  --t-odo:#25535B;--t-odo-d:#193F46;--t-odo-w:#E5EFF0;
}
.nucleus-card{background:linear-gradient(145deg,var(--tone) 0%,var(--tone-dark) 100%)!important;border-color:color-mix(in srgb,var(--tone-dark) 82%,#0000)!important;color:#fff!important;box-shadow:0 9px 22px color-mix(in srgb,var(--tone-dark) 28%,transparent)!important}
.nucleus-card::before{content:""!important;display:block!important;position:absolute!important;inset:0!important;width:auto!important;height:auto!important;border-radius:inherit!important;background:radial-gradient(circle at 82% 12%,rgba(255,255,255,.15),transparent 38%)!important;opacity:1!important;pointer-events:none!important}
.nucleus-symbol{background:rgba(255,255,255,.13)!important;color:#fff!important;border:1px solid rgba(255,255,255,.24)!important;box-shadow:none!important}
.nucleus-content strong{color:#fff!important;font-weight:720!important;text-shadow:0 1px 1px rgba(0,0,0,.12)}
.nucleus-card:hover,.nucleus-card:focus-visible{border-color:rgba(255,255,255,.34)!important;filter:saturate(1.05) brightness(1.03)}
.rot-card{background:linear-gradient(135deg,var(--casca-tone,#062D3E),color-mix(in srgb,var(--casca-tone,#062D3E) 78%,#000))!important;border-color:color-mix(in srgb,var(--casca-tone,#062D3E) 72%,#000)!important;box-shadow:0 7px 18px color-mix(in srgb,var(--casca-tone,#062D3E) 20%,transparent)!important}
.rot-card b,.rot-card span,.rot-card i{color:#fff!important}.rot-card span{opacity:.88}.rot-ic{background:rgba(255,255,255,.14)!important;color:#fff!important;border:1px solid rgba(255,255,255,.22)!important}
</style>'''
assert "</body>" in s, "fechamento do body ausente"
s = s.replace("</body>", css + "\n</body>", 1)

p.write_text(s, encoding="utf-8")
Path("Index.html").write_text(s, encoding="utf-8")

# Service worker / versão pública.
sp = Path("sw.js")
sw = sp.read_text(encoding="utf-8")
sw, n = re.subn(r"const VERSAO = ['\"][^'\"]+['\"]", f"const VERSAO = '{V}'", sw, count=1)
assert n == 1, "VERSAO do SW não localizada"
assert "'./ifa-lookup-shared.js'" in sw, "IFA compartilhado não está no cache essencial"
sp.write_text(sw, encoding="utf-8")

vp = Path("versao.json")
v = json.loads(vp.read_text(encoding="utf-8"))
v["versao"] = V
v["banco"] = "12.1"
v["correcoes"] = 11
v["notas"] = "Correção emergencial de navegação no iPhone/iPad: módulos passam a abrir por srcdoc diretamente no Safari/PWA, evitando falha de Blob URL após atualização. Mantidas a correção IFA e a paleta de botões/cards preenchidos."
vp.write_text(json.dumps(v, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")