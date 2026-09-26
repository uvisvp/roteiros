'use strict';
/* Produtos e correlatos: injeta produtos-navegacao.js no fim do módulo e
   corrige dois pontos do próprio módulo (idempotente):
   - cnaeMap usava a chave “fab_cosm”, mas o tipo da trilha é “fabricante”:
     o cartão de CNAE do fabricante mostrava os CNAEs de todas as trilhas;
   - o bloco do POP-O-SNVS-013 considerava “há dispositivos” pelo texto da
     página (que sempre contém o rótulo da opção): passa a olhar só a marcação.
   Uso: node scripts/repack-produtos.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const id = 'app--produtos-correlatos';
const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
const m = html.match(re); if (!m) throw Error(id);
let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação');
const troca = (de, para, rot) => { if (app.includes(para)) return; const n = app.split(de).length - 1; if (n !== 1) throw Error('Trecho ' + rot + ' encontrado ' + n + ' vezes'); app = app.replace(de, () => para); };
const trocaTodas = (de, para, rot) => { if (!app.includes(de)) { if (app.includes(para)) return; throw Error('Trecho ' + rot + ' ausente'); } app = app.split(de).join(para); };
/* Roteiro e inventário revisados (scripts/produtos/revisao.py → config-revisado.json). */
{ const novo = JSON.parse(fs.readFileSync(path.join(root, 'scripts', 'produtos', 'config-revisado.json'), 'utf8'));
  const ini = 'window.ROTEIRO_CONFIG=', i = app.indexOf(ini); if (i < 0) throw Error('ROTEIRO_CONFIG não localizado');
  const f = app.indexOf(';</script>', i); if (f < 0) throw Error('fim do ROTEIRO_CONFIG não localizado');
  app = app.slice(0, i + ini.length) + JSON.stringify(novo) + app.slice(f); }
troca('"cnaeMap": {"fab_cosm": {', '"cnaeMap": {"fabricante": {', 'cnaeMap fabricante');
trocaTodas("const hasDisp=()=>!!document.querySelector('[data-flag=cls_disp]:checked')||/dispositivos\\/IVD|dispositivos médicos.*diagnóstico in vitro/i.test(document.body?.innerText||'');",
  "const hasDisp=()=>!!document.querySelector('[data-flag=cls_disp]:checked');", 'hasDisp');
const START = '<!--PRODUTOS_NAV_INICIO-->', END = '<!--PRODUTOS_NAV_FIM-->';
const i0 = app.indexOf(START); if (i0 >= 0) app = app.slice(0, i0) + app.slice(app.indexOf(END) + END.length);
const code = fs.readFileSync(path.join(root, 'produtos-navegacao.js'), 'utf8').replace(/<\/(script)/gi, '<\\/$1');
const k = app.lastIndexOf('</body>'); if (k < 0) throw Error('</body> não localizado');
app = app.slice(0, k) + START + '<script>' + code + '</script>' + END + app.slice(k);
const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip');
html = html.replace(re, () => m[1] + enc + m[3]);
/* Inventário: o roteiro-guiado acrescentava, para Produtos, uma “infração” por item do
   roteiro (“Não atendimento ao requisito: …”). Com o inventário revisado, fica só a lista curada. */
{ const rid = 'rec--roteiro-guiado.js';
  const rre = new RegExp('(<script type="text/plain" id="' + rid.replace(/[.]/g, '\\.') + '">)([\\s\\S]*?)(</script>)');
  const rm = html.match(rre); if (!rm) throw Error(rid);
  let rg = lz.decompressFromBase64(rm[2]); if (!rg) throw Error('descompactação ' + rid);
  const de = 'if (cfg.id !== "produtos-correlatos") return cfg.infractions || [];';
  const para = 'if (cfg.id !== "produtos-correlatos" || cfg.inventarioRevisado) return cfg.infractions || [];';
  if (!rg.includes(para)) { if (!rg.includes(de)) throw Error('infractionCatalog não localizado'); rg = rg.replace(de, para); }
  const renc = lz.compressToBase64(rg); if (lz.decompressFromBase64(renc) !== rg) throw Error('round-trip ' + rid);
  html = html.replace(rre, () => rm[1] + renc + rm[3]); }
/* Caixa de citação (comum a todos os módulos): quando a citação tem “Anexo II, item 15.2”, o motor
   devolve duas leituras da mesma norma — o aviso de anexo e o item. O aviso só aparece se a norma
   não tiver nenhum dispositivo localizado (antes a RDC 48/2013 surgia duas vezes, uma vazia). */
{ const uid = 'rec--uvis-ui.js';
  const ure = new RegExp('(<script type="text/plain" id="' + uid.replace(/[.]/g, '\\.') + '">)([\\s\\S]*?)(</script>)');
  const um = html.match(ure); if (!um) throw Error(uid);
  let ui = lz.decompressFromBase64(um[2]); if (!ui) throw Error('descompactação ' + uid);
  const de = "return Citacoes.deTexto(text).flatMap(b=>(b.resolucoes||[]).map(r=>({law:r.norma?.label||b.norma?.l,device:r.referencia||'',resolution:r})));";
  const para = "const out=Citacoes.deTexto(text).flatMap(b=>(b.resolucoes||[]).map(r=>({law:r.norma?.label||b.norma?.l,device:r.referencia||'',resolution:r})));\n    return out.filter(x=>!(x.resolution&&x.resolution.semDispositivo&&out.some(y=>y!==x&&y.resolution&&y.resolution.norma&&x.resolution.norma&&y.resolution.norma.id===x.resolution.norma.id&&(y.resolution.dispositivos||[]).length)));";
  if (!ui.includes(para)) { if (ui.split(de).length !== 2) throw Error('trecho fromText não único'); ui = ui.replace(de, () => para);
    const enc = lz.compressToBase64(ui); if (lz.decompressFromBase64(enc) !== ui) throw Error('round-trip ' + uid);
    html = html.replace(ure, () => um[1] + enc + um[3]); }
  /* Alínea dentro de inciso (id “a28-ii-a”) aparecia com o código interno do banco. */
  const de2 = 'if(r.resolution){Citacoes.render(a,r.resolution);';
  const para2 = 'if(r.resolution){Citacoes.render(a,r.resolution);a.querySelectorAll("*").forEach(x=>{if(x.children.length)return;const t=x.textContent.trim();if(!/^a\\d+[a-z0-9]*(-[a-z]+\\d*)+$/.test(t))return;const ps=t.split("-"),u=ps[ps.length-1].replace(/b\\d*$/,"")||ps[ps.length-1];x.textContent=ps.length<3&&/^[ivxlc]+$/.test(u)?u.toUpperCase():"“"+u+"”"});';
  if (!ui.includes(para2)) { if (ui.split(de2).length !== 2) throw Error('trecho render não único'); ui = ui.replace(de2, () => para2);
    const enc2 = lz.compressToBase64(ui); if (lz.decompressFromBase64(enc2) !== ui) throw Error('round-trip ' + uid);
    html = html.replace(ure, () => um[1] + enc2 + um[3]); } }
fs.writeFileSync(file, html);
console.log('Produtos: navegação e trilha ajustadas.');
