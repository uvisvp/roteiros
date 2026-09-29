'use strict';
/* Padrão UVIS de navegação (padrao-uvis.js/.css) nos núcleos convertidos.
   Idempotente. Uso: node scripts/repack-padrao.cjs
   1. blocos rec--padrao-uvis.js / rec--padrao-uvis.css (a partir dos arquivos da raiz);
   2. casca: nos módulos da lista PADRAO_APPS injeta uvis-layout.css + padrao-uvis.css/js e
      deixa de injetar a camada de três níveis (n3), substituída pelo padrão;
   3. Produtos: rec--roteiro-guiado.js ganha a tela padrão (produtos-padrao.inc.js). */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const PADRAO_APPS = ['produtos-correlatos', 'servicos-alimentacao-roteiro', 'odontologia', 'servicos-assistenciais'];

function bloco(id, src) {
  const enc = lz.compressToBase64(src); if (lz.decompressFromBase64(enc) !== src) throw Error('round-trip ' + id);
  const tag = '<script type="text/plain" id="' + id + '">' + enc + '</script>';
  const re = new RegExp('<script type="text/plain" id="' + id.replace(/[.]/g, '\\.') + '">[\\s\\S]*?</script>');
  if (re.test(html)) html = html.replace(re, () => tag);
  else { const ancora = '<script type="text/plain" id="rec--uvis-layout.css">'; if (html.split(ancora).length !== 2) throw Error('âncora rec--uvis-layout.css'); html = html.replace(ancora, () => tag + '\n' + ancora); }
}
function lerBloco(id) { const re = new RegExp('<script type="text/plain" id="' + id.replace(/[.]/g, '\\.') + '">([\\s\\S]*?)</script>'); const m = html.match(re); if (!m) throw Error(id); const t = lz.decompressFromBase64(m[1]); if (t == null) throw Error('descompactação ' + id); return t; }
function troca(txt, de, para, rot, velho) { if (txt.includes(para)) return txt; if (velho && txt.includes(velho)) return txt.replace(velho, () => para); if (txt.split(de).length !== 2) throw Error('Trecho não localizado de forma única: ' + rot); return txt.replace(de, () => para); }

/* 1 */
bloco('rec--padrao-uvis.js', fs.readFileSync(path.join(root, 'padrao-uvis.js'), 'utf8'));
bloco('rec--padrao-uvis.css', fs.readFileSync(path.join(root, 'padrao-uvis.css'), 'utf8'));

/* 2 — casca */
{ const lista = 'var padraoApps=' + JSON.stringify(PADRAO_APPS) + ';';
  const reLista = /var padraoApps=\[[^\]]*\];/;
  if (reLista.test(html)) html = html.replace(reLista, () => lista);
  else html = troca(html, "    var ownLayout=['drogaria','farmacia-manipulacao','central-consultas'].includes(app);",
    "    var ownLayout=['drogaria','farmacia-manipulacao','central-consultas'].includes(app);\n    " + lista, 'ownLayout');
  html = troca(html, "    if(tresNiveisCfg[app]){", "    if(tresNiveisCfg[app]&&!padraoApps.includes(app)){", 'n3');
  html = troca(html, "    if(ownLayout){cab += '<scr'+'ipt>'+rec('rec--uvis-layout.js')+'</scr'+'ipt>';s=s.replace('</head>','<style>'+rec('rec--uvis-layout.css')+'</style></head>');}",
    "    if(ownLayout){cab += '<scr'+'ipt>'+rec('rec--uvis-layout.js')+'</scr'+'ipt>';s=s.replace('</head>','<style>'+rec('rec--uvis-layout.css')+'</style></head>');}\n    if(padraoApps.includes(app)){s=s.replace(/<head[^>]*>/i,function(h){return h+'<scr'+'ipt>window.__uvsPadrao=true;document.documentElement.classList.add(\"pu-ativo\",\"uvis-layout\")</scr'+'ipt>'});cab += '<scr'+'ipt>'+rec('rec--padrao-uvis.js')+'</scr'+'ipt>';s=s.replace('</head>','<style>'+rec('rec--uvis-layout.css')+'</style><style>'+rec('rec--padrao-uvis.css')+'</style></head>');}", 'injeção do padrão'); }

/* 3 — Produtos: motor com a tela padrão */
{ const id = 'rec--roteiro-guiado.js'; let rg = lerBloco(id);
  const frag = fs.readFileSync(path.join(root, 'produtos-padrao.inc.js'), 'utf8');
  const INI = '/*PU-INICIO*/', FIM = '/*PU-FIM*/';
  const i0 = rg.indexOf(INI);
  if (i0 >= 0) rg = rg.slice(0, i0) + INI + '\n' + frag + '\n' + FIM + rg.slice(rg.indexOf(FIM) + FIM.length);
  else { const de = '\n  setupShell();\n  renderActive();\n})();'; if (!rg.endsWith(de + '\n') && !rg.endsWith(de)) throw Error('fim do roteiro-guiado não localizado');
    rg = rg.slice(0, rg.lastIndexOf(de)) + '\n' + INI + '\n' + frag + '\n' + FIM + '\n})();\n'; }
  rg = troca(rg, "document.querySelectorAll('#panel-roteiro .item-legal:not([data-rg-hydrated])')", "document.querySelectorAll('.item-legal:not([data-rg-hydrated])')", 'citações do item');
  bloco(id, rg); }

/* 4 — padrao.js (compartilhado com alimentos): com a tela padrão ativa não reestrutura o
   cabeçalho nem fixa o CNAE no topo; o bloco do CNAE vai para a tela de enquadramento. */
{ const id = 'rec--padrao.js'; let pj = lerBloco(id);
  pj = troca(pj, '  const header = $("header") || $(".app-header") || $(".top");\n  if (header) {',
    '  const header = $("header") || $(".app-header") || $(".top");\n  const telaPadrao = !!(window.__uvsPadrao || window.UvisPadrao);\n  if (header && !telaPadrao) {', 'cabeçalho');
  pj = troca(pj, '  if (header && header.parentNode) header.parentNode.insertBefore(host, header.nextSibling);\n  else document.body.insertBefore(host, document.body.firstChild);',
    '  if (telaPadrao) window.padraoCnaeHost = host;\n  else if (header && header.parentNode) header.parentNode.insertBefore(host, header.nextSibling);\n  else document.body.insertBefore(host, document.body.firstChild);', 'cnae');
  pj = troca(pj, '  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", soPrimeiraAba);\n  else setTimeout(soPrimeiraAba, 0);',
    '  if (telaPadrao) {}\n  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", soPrimeiraAba);\n  else setTimeout(soPrimeiraAba, 0);', 'só primeira aba');
  bloco(id, pj); }

/* 5 — Produtos: os complementos do POP-O-SNVS-013 liam a caixa “Dispositivos/IVD” na tela; com
   a tela padrão ela fica em outro item. Passam a ler a marcação salva no estado do roteiro. */
{ const id = 'app--produtos-correlatos'; let ap = lerBloco(id);
  const de = "!!document.querySelector('[data-flag=cls_disp]:checked')";
  const para = "(function(){try{var e=JSON.parse(localStorage.getItem('uvis-produtos-v2')||'{}');if(e&&e.profile&&e.profile.flags)return !!e.profile.flags.cls_disp}catch(x){}return !!document.querySelector('[data-flag=cls_disp]:checked')})()";
  if (ap.includes(de)) ap = ap.split(de).join(para);
  bloco(id, ap); }

/* 6 — Serviços de alimentação: motor do próprio módulo com a tela padrão (alimentos-padrao.inc.js) */
{ const id = 'app--servicos-alimentacao-roteiro'; let sa = lerBloco(id);
  const frag = fs.readFileSync(path.join(root, 'alimentos-padrao.inc.js'), 'utf8');
  const INI = '/*SA-PU-INICIO*/', FIM = '/*SA-PU-FIM*/';
  const i0 = sa.indexOf(INI);
  if (i0 >= 0) sa = sa.slice(0, i0) + INI + '\n' + frag + '\n' + FIM + sa.slice(sa.indexOf(FIM) + FIM.length);
  else { const de = /\r?\nmonta\(\);\r?\nwindow\.CARD_ESTABELECIMENTO = \{ monta: monta \};/;
    if (!de.test(sa)) throw Error('fim do roteiro de alimentos não localizado');
    sa = sa.replace(de, () => '\n' + INI + '\n' + frag + '\n' + FIM + '\nif (PADRAO) iniciaPadrao(); else monta();\nwindow.CARD_ESTABELECIMENTO = { monta: monta };'); }
  /* relatório: todas as atividades e formas de operação marcadas (o perfil passou a aceitar várias) */
  sa = troca(sa, "  if (tipo) L.push('Tipo de serviço: ' + tipo.label);",
    "  var tiposSel = (Array.isArray(st.tipos) && st.tipos.length ? st.tipos : (st.tipo ? [st.tipo] : [])).map(function (id) { var t = cfg.profile.types.filter(function (x) { return x.id === id; })[0]; return t ? t.label : ''; }).filter(Boolean);\n  if (tiposSel.length) L.push((tiposSel.length > 1 ? 'Atividades: ' : 'Tipo de serviço: ') + tiposSel.join('; '));\n  (cfg.profile.selectors || []).forEach(function (sel) { var v = [].concat(st.valores[sel.id] || []), r = (sel.options || []).filter(function (o) { return v.indexOf(o.id) >= 0; }).map(function (o) { return o.label; }); if (r.length) L.push((r.length > 1 ? 'Formas de operação' : sel.label) + ': ' + r.join('; ')); });",
    'relatório de alimentos: atividades');
  bloco(id, sa); }

/* 7 — Odontologia: tela padrão (odontologia-padrao.inc.js) depois da montagem original; a caixa
   “Para saber mais” (ABNT) passa a encontrar as perguntas também na tela padrão. */
{ const id = 'app--odontologia'; let od = lerBloco(id);
  const frag = fs.readFileSync(path.join(root, 'odontologia-padrao.inc.js'), 'utf8');
  const INI = '/*ODO-PU-INICIO*/', FIM = '/*ODO-PU-FIM*/';
  const i0 = od.indexOf(INI);
  if (i0 >= 0) od = od.slice(0, i0) + INI + '\n' + frag + '\n' + FIM + od.slice(od.indexOf(FIM) + FIM.length);
  else { const de = 'window.__ODO__={DATA,state:()=>state,reportBlocks,invBlocks,toText,makeDocx,opts,secs,secItems,allItems};';
    if (od.split(de).length !== 2) throw Error('fim do roteiro de odontologia não localizado');
    od = od.replace(de, () => de + '\n' + INI + '\n' + frag + '\n' + FIM); }
  od = troca(od, `var b=document.querySelector('.item [data-a="'+id+'"]');if(!b)return;var art=b.closest('.item');`,
    `var b=document.querySelector('.item [data-a="'+id+'"],.pu-q [data-a="'+id+'"]');if(!b)return;var art=b.closest('.item,.pu-q');`, 'saber mais odontologia');
  bloco(id, od); }

/* 8 — Serviços assistenciais: cada modalidade vira um cartão do núcleo (servico=<id>) e abre na
   tela padrão (assistenciais-padrao.inc.js). Sem servico, continua a tela antiga. */
{ const id = 'app--servicos-assistenciais'; let as = lerBloco(id);
  const frag = fs.readFileSync(path.join(root, 'assistenciais-padrao.inc.js'), 'utf8');
  const INI = '/*AS-PU-INICIO*/', FIM = '/*AS-PU-FIM*/';
  const boot = 'const params=new URLSearchParams(window.__QS||location.search),initial=params.get("servico");\nif(AS_PADRAO&&initial&&SERVICES.some(s=>s.id===initial))asInicia(initial);else{document.documentElement.classList.remove("pu-ativo");initial&&SERVICES.some(s=>s.id===initial)?openService(initial):renderHome()}';
  const i0 = as.indexOf(INI);
  if (i0 >= 0) as = as.slice(0, i0) + INI + '\n' + frag + '\n' + FIM + as.slice(as.indexOf(FIM) + FIM.length);
  else { const de = /const params=new URLSearchParams\(location\.search\),initial=params\.get\("servico"\);initial&&SERVICES\.some\(s=>s\.id===initial\)\?openService\(initial\):renderHome\(\);/;
    if (!de.test(as)) throw Error('início do roteiro de assistenciais não localizado');
    as = as.replace(de, () => INI + '\n' + frag + '\n' + FIM + '\n' + boot); }
  bloco(id, as); }
/* núcleo: um cartão por modalidade */
{ const de = '"Serviços assistenciais":[["ILPI e acolhimentos","ILPI, Centro Dia, comunidade terapêutica, SRT, SAICA e demais modalidades.","servicos-assistenciais"]]';
  const M = [['ILPI', 'Instituição de Longa Permanência para Idosos.', 'ilpi'], ['Centro Dia', 'Centro Dia para pessoas idosas.', 'centrodia'], ['Comunidade Terapêutica', 'Comunidade Terapêutica Acolhedora.', 'ct'], ['Residência Terapêutica', 'Serviço Residencial Terapêutico — SRT tipos I e II.', 'srt'], ['SAICA', 'Serviço de Acolhimento Institucional para Crianças e Adolescentes.', 'saica'], ['Demais acolhimentos', 'Centro de acolhida, república, residência inclusiva, casa de apoio e unidade de acolhimento da RAPS.', 'demais']];
  const para = '"Serviços assistenciais":' + JSON.stringify(M.map(([n, d, s]) => [n, d, 'servicos-assistenciais', 'servico=' + s]));
  if (!html.includes(para)) { if (html.split(de).length !== 2) throw Error('cartão de serviços assistenciais não localizado'); html = html.replace(de, () => para); } }

/* 9 — Distribuidora: só aparência no tamanho do padrão (distribuidora-visual.css), sem tocar no módulo */
bloco('rec--distribuidora-visual.css', fs.readFileSync(path.join(root, 'distribuidora-visual.css'), 'utf8'));
html = troca(html, "    if(app==='servicos-alimentacao-roteiro'){\n      cab += '<style>\\n'",
  "    if(app==='distribuidoras-transportadoras'){cab += '<style id=\"dist-visual-padrao\">'+rec('rec--distribuidora-visual.css')+'</style>';}\n    if(app==='servicos-alimentacao-roteiro'){\n      cab += '<style>\\n'", 'visual da distribuidora');

/* 10 — Distribuidora, tela de item: o checklist de perguntas deixa de ser <details> (título
   escondido) e vira um bloco comum. No iPhone, abrir “Para saber mais” ou uma orientação
   chegava a fechá-lo, e as perguntas sumiam sem como reabrir. */
{ const de = "chk.open=true;chk.classList.add('dist-chk-fixed')";
  const para = "var dv=chk.ownerDocument.createElement('div');dv.className='section-chk dist-chk-fixed dist-chk-bloco';dv.setAttribute('data-chk',chk.getAttribute('data-chk')||'');[].slice.call(chk.childNodes).forEach(function(n){if(!(n.nodeType===1&&n.tagName==='SUMMARY'))dv.appendChild(n)});chk.replaceWith(dv)";
  if (html.includes(de)) { const n = html.split(de).length - 1; if (n !== 2) throw Error('checklist da distribuidora: ' + n + ' ocorrências'); html = html.split(de).join(para); }
  else if (!html.includes(para)) throw Error('checklist da distribuidora não localizado'); }

/* 11 — Manipulação: um erro na prévia do relatório não pode travar o app. save() roda a cada
   ação e redesenhava a prévia sem proteção: um erro ali parava navegação, barras e relatório. */
{ const id = 'app--farmacia-manipulacao'; let fm = lerBloco(id);
  fm = troca(fm, 'function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){} updateSummary(); renderPreview();}',
    'function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){} try{updateSummary();}catch(e){console.error(e)} try{renderPreview();}catch(e){console.error(e)}}', 'save da manipulação');
  bloco(id, fm); }

fs.writeFileSync(file, html);
console.log('Padrão UVIS aplicado a: ' + PADRAO_APPS.join(', '));
