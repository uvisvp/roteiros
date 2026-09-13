from pathlib import Path
import json,re

V='20260913-14'
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Versão final desta rodada.
s,n=re.subn(r"const APP_VERSAO\s*=\s*['\"][^'\"]+['\"]",f"const APP_VERSAO = '{V}'",s,count=1)
assert n==1, 'APP_VERSAO não localizado'

# 1) IFA: não depender do carregamento do helper externo dentro do srcdoc do Safari/PWA.
# A consulta passa a ler diretamente a visão pública de IFA e procura também processo_anvisa.
marker='__UVIS_IFA_DIRECT_V13__'
if marker not in s:
    guard="if(!window.UvisIfaLookup||typeof window.UvisIfaLookup.search!=='function'){status('O motor compartilhado de IFA ainda não está disponível. Recarregue o aplicativo com conexão.',false);return;}\n          "
    s=s.replace(guard,'')
    old="window.UvisIfaLookup.search(term,{limit:50}).then(function(result){"
    assert old in s, 'chamada antiga do IFA não localizada'
    direct="""/* __UVIS_IFA_DIRECT_V13__ */
          fetch('https://uvisvp.github.io/base-vigilancia/dados/ifa/registros.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(function(payload){
            function n(v){return String(v==null?'':v).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
            function d(v){return String(v==null?'':v).replace(/\\D/g,'');}
            var qn=n(term),qd=d(term),all=payload&&Array.isArray(payload.registros)?payload.registros:[];
            var hits=all.filter(function(x){
              var fields=[x.ifa,x.fabricante_ifa,x.codigo_fabricante_ifa,x.processo_anvisa,x.detentor_peticionante,x.cnpj_detentor_peticionante,x.assunto];
              return fields.some(function(v){var nv=n(v),dv=d(v);return (qn&&nv.indexOf(qn)>=0)||(qd&&dv&&dv===qd);});
            }).slice(0,50);
            return {resultados:hits,total:hits.length,fonte:payload.fonte||'Anvisa — TA_EXPORT_IFA.csv',observacao:payload.observacao||'',gerado_em:payload.gerado_em||''};
          }).then(function(result){"""
    s=s.replace(old,direct,1)
    old_map="var list=(result.resultados||[]).map(function(x){return window.UvisIfaLookup.formatResult(x);});"
    new_map="var list=(result.resultados||[]).map(function(x){return (window.UvisIfaLookup&&typeof window.UvisIfaLookup.formatResult==='function')?window.UvisIfaLookup.formatResult(x):x;});"
    assert old_map in s, 'formatação IFA não localizada'
    s=s.replace(old_map,new_map,1)

# 2) Estética: remover os dois botões soltos problemáticos e usar uma única toolbar fixa.
# Ela contém: anterior, consulta, selecionadas, próximo.
# Importante: não reservar altura no <main>; isso criava a faixa vazia nas três telas.
est_marker="estetica-toolbar-v13"
if est_marker not in s:
    anchor="    if(app==='produtos-correlatos'){"
    assert anchor in s, 'âncora para Estética não localizada'
    inject=r'''    if(app==='estetica'){
      var estDock='<style id="estetica-toolbar-v13">'
        +'html[data-uvis-app="estetica"] #estetica-consulta-dock,html[data-uvis-app="estetica"] #acoesMobile{display:none!important}'
        +'html[data-uvis-app="estetica"] main{padding-bottom:0!important}'
        +'html[data-uvis-app="estetica"] .rolagem{scroll-padding-bottom:64px!important}'
        +'html[data-uvis-app="estetica"] .acoes:empty{display:none!important}'
        +'html[data-uvis-app="estetica"] #uvis-estetica-toolbar{position:fixed;left:0;right:0;bottom:0;z-index:80;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));min-height:56px;padding:4px max(8px,env(safe-area-inset-left)) calc(4px + env(safe-area-inset-bottom,0px));background:#fff;border-top:1px solid #cbd6dc;box-shadow:0 -3px 12px rgba(15,42,57,.08)}'
        +'html[data-uvis-app="estetica"] #uvis-estetica-toolbar button{display:flex;align-items:center;justify-content:center;min-width:0;min-height:48px;margin:0;border:0;border-radius:0;background:transparent;color:var(--roxo,#25535B);font:700 20px/1 system-ui;cursor:pointer;-webkit-tap-highlight-color:transparent}'
        +'html[data-uvis-app="estetica"] #uvis-estetica-toolbar button:active{background:rgba(37,83,91,.08)}'
        +'html[data-uvis-app="estetica"] #uvis-estetica-toolbar svg{width:23px;height:23px;display:block}'
        +'</style>'
        +'<nav id="uvis-estetica-toolbar" aria-label="Navegação rápida">'
        +'<button type="button" data-est-nav="prev" aria-label="Anterior" title="Anterior"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 5 8 12l7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
        +'<button type="button" data-est-nav="consulta" aria-label="Consulta" title="Consulta"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" stroke-width="2"/><path d="m15 15 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>'
        +'<button type="button" data-est-nav="selecionadas" aria-label="Ver selecionadas" title="Ver selecionadas"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 6.5h2.5M10 6.5h9M5 12h2.5M10 12h9M5 17.5h2.5M10 17.5h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m4.5 12 1.2 1.2L8 10.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
        +'<button type="button" data-est-nav="next" aria-label="Próximo" title="Próximo"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>'
        +'</nav>'
        +'<scr'+'ipt>(function(){function target(e){var t=e.target;if(t&&t.nodeType!==1)t=t.parentElement;return t&&t.closest?t.closest("[data-est-nav]"):null}function step(delta){try{if(typeof gruposAtuais!=="function"||typeof irGrupo!=="function")return;var gs=gruposAtuais()||[];if(!gs.length)return;var g=(typeof grupo==="number"?grupo:0)+delta;g=Math.max(0,Math.min(gs.length-1,g));irGrupo(g)}catch(_){}}document.addEventListener("click",function(e){var b=target(e);if(!b)return;e.preventDefault();e.stopPropagation();var a=b.getAttribute("data-est-nav");if(a==="consulta"){if(typeof irBloco==="function")irBloco("C");return}if(a==="selecionadas"){if(typeof ir==="function")ir(3,true);return}if(a==="prev"){var p3=document.getElementById("p3");if(p3&&p3.classList.contains("visivel")&&typeof ir==="function"){ir(2,true);return}step(-1);return}if(a==="next"){step(1);return}},true)})();</scr'+'ipt>';
      s=s.replace(/<\/body>/i,estDock+'</body>');
    }
'''
    s=s.replace(anchor,inject+anchor,1)

# 3) Ícones dos cards internos do núcleo: garantir fallback e visibilidade.
if "/* __UVIS_ROT_ICON_FALLBACK_V13__ */" not in s:
    old="    if(!d) return null;"
    assert old in s, 'fallback de ícones não localizado'
    new="    /* __UVIS_ROT_ICON_FALLBACK_V13__ */\n    if(!d) d='<path d=\"M5 4h14v16H5zM8 8h8M8 12h8M8 16h5\"/>';"
    s=s.replace(old,new,1)

# Reforço visual do ícone nos cards do seletor de atividade.
icon_css='<style id="uvis-rot-icons-v13">.rot-card .rot-ic{display:grid!important;place-items:center!important;opacity:1!important;background:#fff!important;color:var(--casca-tone,#174C68)!important}.rot-card .rot-ic svg{display:block!important;opacity:1!important}</style>'
if 'uvis-rot-icons-v13' not in s:
    idx=s.rfind('</body>');assert idx!=-1
    s=s[:idx]+icon_css+'\n'+s[idx:]

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
v['correcoes']=14
v['notas']='Estética: removida a faixa inferior vazia que era causada pela reserva de 62 px no main; mantida a toolbar fixa de quatro ícones sem alterar suas funções. Mantidas as correções IFA e os ícones internos.'
vp.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(V)
