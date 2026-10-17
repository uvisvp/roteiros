'use strict';
/* Infração descrita pela constatação, como na Estética (pedido de 17/10/2026): o catálogo
   de infrações de Produtos e de Serviços assistenciais tipifica condutas alternativas
   (“manter, expor ou distribuir”, “sem cadastro ou licença”). Ao marcar a infração, abre
   o campo “Constatação” (digite ou dite); com ele preenchido, o enquadramento do
   relatório, o Word e a prévia descrevem a infração pelo fato constatado, e não pelo
   texto do catálogo. Os dispositivos infringidos continuam os do catálogo, com a Lei
   13.725 pelo assunto (UvsLei). Sem constatação, sai o texto do catálogo, sem o aviso
   “ATENÇÃO PRIORITÁRIA —”, que é só da tela.
   - Produtos (rec--roteiro-guiado.js): state.infractionNotes[id];
   - Serviços assistenciais: a anotação já gravada por item (<modalidade>|nota|inf|<n>),
     agora também na infração selecionada (assistenciais-padrao.inc.js e o bloco).
   Roda depois de scripts/repack-lei13725.cjs. Idempotente.
   Uso: node scripts/repack-constatacao.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
function bloco(id, fn) {
  const re = new RegExp('(<script type="text/plain" id="' + id.replace(/[.]/g, '\\.') + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  const a = lz.decompressFromBase64(m[2].trim()); if (!a) throw Error('descompactação ' + id);
  const b = fn(a); if (b === a) return;
  const enc = lz.compressToBase64(b); if (lz.decompressFromBase64(enc) !== b) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]);
}
function fonte(nome, fn) { const p = path.join(root, nome), a = fs.readFileSync(p, 'utf8'), b = fn(a); if (b !== a) fs.writeFileSync(p, b); }
function troca(s, de, para, rot) {
  if (s.includes(para)) return s;
  if (s.split(de).length !== 2) throw Error(rot + ': esperava 1 ocorrência, achei ' + (s.split(de).length - 1));
  return s.replace(de, () => para);
}

/* ---------- Produtos ---------- */
bloco('rec--roteiro-guiado.js', s => {
  s = troca(s, 'answers: {}, notes: {}, selectedInfractions: {},', 'answers: {}, notes: {}, selectedInfractions: {}, infractionNotes: {},', 'produtos: estado');
  s = troca(s, 'selectedInfractions: { ...(saved.selectedInfractions || {}) },',
    'selectedInfractions: { ...(saved.selectedInfractions || {}) }, infractionNotes: { ...(saved.infractionNotes || {}) },', 'produtos: estado salvo');
  s = troca(s, '      state.selectedInfractions = {};\n', '      state.selectedInfractions = {};\n      state.infractionNotes = {};\n', 'produtos: limpar tudo');
  s = troca(s, "if(state.tab==='infracoes')state.selectedInfractions={};", "if(state.tab==='infracoes'){state.selectedInfractions={};state.infractionNotes={}}", 'produtos: limpar infrações');
  /* o campo fica fora do <label> da infração: tocar nele não desmarca a infração */
  s = troca(s, '</small>` : ""}</span></label>`).join("")}</div></details>`',
    '</small>` : ""}</span></label>${state.selectedInfractions[item.id] ? `<label class="pu-anot" style="display:block;margin:2px 0 12px 32px">Constatação <small>(digite ou dite)</small><textarea rows="2" data-infraction-note="${attr(item.id)}" placeholder="O que foi constatado, onde, documento ou produto envolvido">${esc(state.infractionNotes[item.id] || "")}</textarea></label>` : ""}`).join("")}</div></details>`', 'produtos: campo da constatação');
  s = troca(s, 'if (event.target.matches("[data-route-search]"))',
    'if (event.target.matches("[data-infraction-note]")) { const v = event.target.value; if (v.trim()) state.infractionNotes[event.target.dataset.infractionNote] = v; else delete state.infractionNotes[event.target.dataset.infractionNote]; saveState(); }\n    if (event.target.matches("[data-route-search]"))', 'produtos: gravar constatação');
  s = troca(s, 'esc(String(item.text).replace(/\\.?$/, ".") + ((f) => f ? " Dispositivos infringidos: "',
    'esc(((c) => c ? c.charAt(0).toUpperCase() + c.slice(1) : String(item.text).replace(/^ATENÇÃO PRIORITÁRIA — /, ""))(String(state.infractionNotes[item.id] || "").trim()).replace(/\\.?$/, ".") + ((f) => f ? " Dispositivos infringidos: "', 'produtos: enquadramento pela constatação');
  s = troca(s, "out.push({ x: 'Infração selecionada: ' + it.text + ((f) =>",
    "out.push({ x: 'Infração selecionada: ' + (String(state.infractionNotes[it.id] || '').trim() || it.text.replace(/^ATENÇÃO PRIORITÁRIA — /, '')) + ((f) =>", 'produtos: prévia pela constatação');
  return s;
});

/* ---------- Serviços assistenciais ---------- */
const asFonte = s => troca(s,
  "aria-pressed=\"${on}\">${on?'✓ Selecionada':'Selecionar'}</button></div></div>`}).join('')",
  "aria-pressed=\"${on}\">${on?'✓ Selecionada':'Selecionar'}</button></div>${on?`<label class=\"pu-anot\">Constatação <small>(digite ou dite)</small><textarea rows=\"2\" data-as-nota=\"inf|${i}\" placeholder=\"O que foi constatado, onde, documento ou pessoa envolvida\">${esc(saved[scope()+'|nota|inf|'+i]||'')}</textarea></label>`:''}</div>`}).join('')",
  'assistenciais: campo da constatação');
fonte('assistenciais-padrao.inc.js', asFonte);
bloco('app--servicos-assistenciais', s => {
  s = asFonte(s);
  s = troca(s, 'current.inf.forEach((item,i)=>{if(mark("inf",i)==="SEL")rows.push({kind:"inf",section:"Infração selecionada",group:item.g,item:item.i,citation:item.l,state:"Selecionada",refs:item.refs,index:i})',
    'current.inf.forEach((item,i)=>{if(mark("inf",i)==="SEL")rows.push({kind:"inf",section:"Infração selecionada",group:item.g,item:item.i,citation:item.l,state:"Selecionada",refs:item.refs,index:i,nota:String(saved[scope()+\'|nota|inf|\'+i]||\'\').trim()})', 'assistenciais: constatação na linha');
  s = troca(s, "inf.map((r,k)=>'<p>'+(k+1)+'. '+esc(String(r.item).replace(/\\.?$/,'.')+' Dispositivos infringidos: '",
    "inf.map((r,k)=>'<p>'+(k+1)+'. '+esc(String(r.nota?r.nota.charAt(0).toUpperCase()+r.nota.slice(1):r.item).replace(/\\.?$/,'.')+' Dispositivos infringidos: '", 'assistenciais: enquadramento pela constatação');
  return s;
});

fs.writeFileSync(file, html);
console.log('Infrações de Produtos e Serviços assistenciais descritas pela constatação, quando preenchida.');
