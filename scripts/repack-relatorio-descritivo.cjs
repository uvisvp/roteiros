'use strict';
/* Relatórios em tom descritivo, como os do site Medicamentos (pedido de
   17/10/2026). Os módulos que emitiam o Word em tabela (Requisito | Dispositivo
   | Resultado) ou em lista de verificação passam a escrever, por seção, um
   parágrafo com uma frase por verificação respondida — “Cumpre” como
   constatação, “Não cumpre” como negativa (window.UvsFrase, em
   campo/relatorio-frases.js) — e as irregularidades numeradas com o
   fundamento. Itens sem resposta e “Não se aplica” não entram.
   Idempotente. Uso: node scripts/repack-relatorio-descritivo.cjs */
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
function troca(s, de, para, rot) {
  /* blocos com quebra CRLF: o trecho procurado e o novo seguem a mesma quebra */
  if (s.includes('\r\n') && de.includes('\n') && !de.includes('\r\n')) { de = de.replace(/\n/g, '\r\n'); para = para.replace(/\n/g, '\r\n'); }
  if (para ? s.includes(para) : !s.includes(de)) return s;
  if (s.split(de).length !== 2) throw Error(rot + ': esperava 1 ocorrência, achei ' + (s.split(de).length - 1));
  return s.replace(de, () => para);
}
const F = "(window.UvsFrase||function(t){return t})";

/* ---------- Odontologia ---------- */
bloco('app--odontologia', s => {
  s = troca(s, "B.push({t:'title',x:'ROTEIRO DE INSPEÇÃO SANITÁRIA — SERVIÇO ODONTOLÓGICO'});",
    "B.push({t:'title',x:'RELATÓRIO DE INSPEÇÃO SANITÁRIA — SERVIÇO ODONTOLÓGICO'});", 'odonto título');
  s = troca(s, "[['Razão social','company'],['CNPJ','cnpj'],['Endereço','address'],['CEVS','cevs'],['Responsável legal','legal'],['Responsável técnico / CRO','technical'],['Data da inspeção','date'],['SEI nº','sei'],['Equipe inspetora','team']].forEach(([k,id])=>B.push({t:'kv',k,v:state.meta[id]||'________________________________________________'}));",
    "[['Razão social','company'],['CNPJ','cnpj'],['Endereço','address'],['CEVS','cevs'],['Responsável legal','legal'],['Responsável técnico / CRO','technical'],['Data da inspeção','date'],['SEI nº','sei'],['Equipe inspetora','team']].forEach(([k,id])=>{const v=String(state.meta[id]||'').trim();if(v)B.push({t:'kv',k,v:id==='date'&&/^\\d{4}-\\d\\d-\\d\\d$/.test(v)?v.split('-').reverse().join('/'):v})});", 'odonto identificação');
  s = troca(s, "B.push({t:'h1',x:'3 RESULTADO DA VERIFICAÇÃO'});", "B.push({t:'h1',x:'3 VERIFICAÇÕES REALIZADAS'});", 'odonto seção 3');
  s = troca(s, "    if(!o.incNA)rows=rows.filter(r=>r.a!=='na');\n    if(!rows.length)return;",
    "    if(!o.incNA)rows=rows.filter(r=>r.a!=='na');\n    rows=rows.filter(r=>r.a);\n    if(!rows.length)return;", 'odonto sem não avaliados');
  s = troca(s, "    B.push({t:'table',widths:[4300,2100,2200],head:['Requisito','Dispositivo','Resultado'],\n      rows:rows.map(r=>{const nt=String(state.evidence?.[r.i.id]||'').trim();return [r.i.t,r.i.c,RES[r.a]+(nt?'. '+nt.charAt(0).toUpperCase()+nt.slice(1).replace(/\\.?$/,'.'):'')]})});",
    "    /* descritivo: uma frase por verificação, como nos roteiros do site Medicamentos */\n    B.push({t:'p',x:rows.map(r=>{const nt=String(state.evidence?.[r.i.id]||'').trim();const fr=r.a==='ok'?" + F + "(r.i.t,'c'):r.a==='nao'?" + F + "(r.i.t,'nc'):'Não se aplica ao serviço: '+String(r.i.t).replace(/^\\s*\\d+[.)]\\s*/,'').replace(/\\.?$/,'.');return fr+(nt?' '+nt.charAt(0).toUpperCase()+nt.slice(1).replace(/\\.?$/,'.'):'')}).join(' ')});", 'odonto parágrafo');
  s = troca(s, "B.push({t:'h1',x:'4 AVALIAÇÃO DAS CONSTATAÇÕES'});", "B.push({t:'h1',x:'4 IRREGULARIDADES OBSERVADAS'});", 'odonto seção 4');
  s = troca(s, "pending.forEach(i=>B.push({t:'p',x:'Observação / avaliação pendente: '+i.t+' Evidência: '+(state.evidence?.[i.id]||'Não registrada')+' Base indicada: '+i.c}));",
    "pending.forEach(i=>B.push({t:'p',x:'Em avaliação: '+" + F + "(i.t,'nc')+' Evidência: '+(state.evidence?.[i.id]||'não registrada').replace(/\\.?$/,'.')+' Base indicada: '+String(i.c).replace(/\\.?$/,'.')}));", 'odonto pendentes');
  s = troca(s, "B.push({t:'num',n:k+1,x:`Requisito não atendido: ${i.t} Dispositivo descumprido: ${i.c}.`});",
    "B.push({t:'num',n:k+1,x:" + F + "(i.t,'nc')+' Fundamento: '+String(i.c).replace(/\\.?$/,'.')});", 'odonto irregularidades');
  s = troca(s, "});else B.push({t:'p',x:'Nenhum enquadramento foi confirmado com evidência registrada nos itens verificados.'});",
    "});else B.push({t:'p',x:'Não foram registradas irregularidades com evidência nesta inspeção.'});", 'odonto sem irregularidade');
  return s;
});

/* ---------- Serviços assistenciais ---------- */
bloco('app--servicos-assistenciais', s => {
  s = troca(s, "\nasync function buildReport(){", `\n/* relatório descritivo: parágrafo por assunto, irregularidades e enquadramento numerados */
function asDescritivo(rows){const F=${F},D=(window.UvsFrase&&UvsFrase.doc)||function(t,r){return (r==='nc'?'Não apresentou: ':'Apresentou: ')+t},nota=n=>n?' '+n.charAt(0).toUpperCase()+n.slice(1).replace(/\\.?$/,'.'):'';
 const verif=rows.filter(r=>r.kind!=='inf'&&r.res&&r.res!=='NA'),inf=rows.filter(r=>r.kind==='inf'),irr=verif.filter(r=>r.res==='NC');
 const frase=r=>(r.kind==='doc'?D(r.item,r.res==='C'?'c':'nc','O estabelecimento'):F(r.item,r.res==='C'?'c':'nc'))+nota(r.nota);
 let h='',n=0;
 [['doc','DOCUMENTAÇÃO APRESENTADA'],['rot','VERIFICAÇÕES REALIZADAS']].forEach(([k,tit])=>{const rs=verif.filter(r=>r.kind===k);if(!rs.length)return;n++;h+='<h3>'+n+' '+tit+'</h3>';const gs=[];rs.forEach(r=>{if(!gs.includes(r.group))gs.push(r.group)});gs.forEach(g=>{h+='<h4>'+esc(g)+'</h4><p>'+esc(rs.filter(r=>r.group===g).map(frase).join(' '))+'</p>'})});
 n++;h+='<h3>'+n+' IRREGULARIDADES OBSERVADAS</h3>'+(irr.length?irr.map((r,k)=>'<p>'+(k+1)+'. '+esc(frase(r)+' Fundamento: '+String(r.citation||'').replace(/\\.?$/,'.'))+'</p>').join(''):'<p>Não foram registradas irregularidades nesta inspeção.</p>');
 if(inf.length){n++;h+='<h3>'+n+' ENQUADRAMENTO DAS INFRAÇÕES SANITÁRIAS</h3>'+inf.map((r,k)=>'<p>'+(k+1)+'. '+esc(String(r.item).replace(/\\.?$/,'.')+' Dispositivos infringidos: '+String(r.citation||'').replace(/\\.?$/,'.'))+'</p>').join('')}
 return h}
async function buildReport(){`, 'assistenciais helper');
  s = troca(s, `if(st||nt)rows.push({kind,section:kind==="doc"?"Documentação":"Roteiro",group:item.g,item:item.i,citation:item.l,state:(st?status(kind,st):'Sem marcação')+(nt?' — '+nt:''),refs:item.refs,index:i})`,
    `if(st||nt)rows.push({kind,section:kind==="doc"?"Documentação":"Roteiro",group:item.g,item:item.i,citation:item.l,state:(st?status(kind,st):'Sem marcação')+(nt?' — '+nt:''),refs:item.refs,index:i,res:st,nota:nt})`, 'assistenciais linhas');
  s = troca(s, `$("#reportBody").innerHTML='<h2>Registro de inspeção — '+esc(current.nome)+'</h2><p><b>'+esc(current.titulo)+'</b></p><div class="report-meta"><p><b>Estabelecimento:</b> '+esc(m.name||"Não informado")+'</p><p><b>CNPJ/CPF:</b> '+esc(m.document||"Não informado")+'</p><p><b>CMVS/processo:</b> '+esc(m.cmvs||"Não informado")+'</p><p><b>Data/equipe:</b> '+esc((m.date||"")+" "+(m.team||""))+'</p><p><b>Endereço:</b> '+esc(m.address||"Não informado")+'</p><p><b>CNAE:</b> '+esc(c?(c.cod+" — "+c.desc):"Não definido")+'</p></div><table class="report-table"><thead><tr><th>Seção</th><th>Assunto</th><th>Constatação / item</th><th>Situação</th><th>Base legal</th></tr></thead><tbody>'+((rows.map(r=>'<tr><td>'+esc(r.section)+'</td><td>'+esc(r.group)+'</td><td>'+esc(r.item)+'</td><td>'+esc(r.state)+'</td><td>'+esc(r.citation)+'</td></tr>').join(""))||'<tr><td colspan="5">Nenhuma marcação ou infração selecionada.</td></tr>')+'</tbody></table>'+calc`,
    `const kv=(k,v)=>v?'<p><b>'+k+':</b> '+esc(v)+'</p>':'';$("#reportBody").innerHTML='<h2>Relatório de inspeção sanitária — '+esc(current.nome)+'</h2><p><b>'+esc(current.titulo)+'</b></p><div class="report-meta">'+kv('Estabelecimento',m.name)+kv('CNPJ/CPF',m.document)+kv('CMVS/processo',m.cmvs)+kv('Data da inspeção',/^\\d{4}-\\d\\d-\\d\\d$/.test(m.date||'')?m.date.split('-').reverse().join('/'):m.date)+kv('Equipe',m.team)+kv('Endereço',m.address)+kv('CNAE',c?(c.cod+" — "+c.desc):'')+'</div>'+(asDescritivo(rows)||'<p>Nenhuma verificação registrada.</p>')+calc`, 'assistenciais corpo');
  return s;
});

/* ---------- motor roteiro-guiado (Produtos e correlatos) ---------- */
bloco('rec--roteiro-guiado.js', s => {
  s = troca(s, '    const meta = (cfg.profile.fields || []).map((field) => `<div><strong>${esc(field.label)}:</strong> ${esc(state.meta[field.id] || "Não informado")}</div>`).join("");',
    '    const meta = (cfg.profile.fields || []).filter((field) => String(state.meta[field.id] || "").trim()).map((field) => `<div><strong>${esc(field.label)}:</strong> ${esc(state.meta[field.id])}</div>`).join("");\n' +
    '    /* descritivo (como os relatórios do site Medicamentos): parágrafo por etapa, irregularidades e enquadramento numerados */\n' +
    "    const F = " + F + ", cap = (t) => t.charAt(0).toUpperCase() + t.slice(1).replace(/\\.?$/, '.'), resp = items.filter((item) => ['yes', 'no'].includes(state.answers[item._id]));\n" +
    "    const nota = (item) => { const n = state.notes[item._id] || {}; return (n.note ? ' ' + cap(String(n.note).trim()) : '') + (n.evidence ? ' Evidência: ' + cap(String(n.evidence).trim()) : ''); };\n" +
    "    const frase = (item) => F(item.text, state.answers[item._id] === 'yes' ? 'c' : 'nc') + nota(item);\n" +
    "    const etapas = []; resp.forEach((item) => { if (!etapas.includes(item._sectionTitle)) etapas.push(item._sectionTitle); });\n" +
    "    const irr = resp.filter((item) => state.answers[item._id] === 'no');\n" +
    "    const verif = etapas.map((e) => `<h4>${esc(e)}</h4><p>${esc(resp.filter((item) => item._sectionTitle === e).map(frase).join(' '))}</p>`).join('');", 'guiado meta e frases');
  s = troca(s, '<div class="report-meta">${meta}<div><strong>Progresso:</strong> ${c.answered}/${c.total} respondidos</div><div><strong>Não conformidades:</strong> ${c.nc}</div></div><table><thead><tr><th>Etapa</th><th>Verificação / base legal</th><th>Situação</th><th>Anotação / evidência</th></tr></thead><tbody>${rows || `<tr><td colspan="4">Nenhum item respondido.</td></tr>`}</tbody></table>${selected.length ? `<h3>Infrações selecionadas</h3><ul>${selected.map((item) => `<li>${esc(item.text)}${item.legal ? ` — ${esc(item.legal)}` : ""}</li>`).join("")}</ul>` : ""}',
    '<div class="report-meta">${meta}</div><h3>1 VERIFICAÇÕES REALIZADAS</h3>${verif || "<p>Nenhuma verificação registrada.</p>"}<h3>2 IRREGULARIDADES OBSERVADAS</h3>${irr.length ? irr.map((item, k) => `<p>${k + 1}. ${esc(frase(item) + (item.legal ? " Fundamento: " + String(item.legal).replace(/\\.?$/, ".") : ""))}</p>`).join("") : "<p>Não foram registradas irregularidades nesta inspeção.</p>"}${selected.length ? `<h3>3 ENQUADRAMENTO DAS INFRAÇÕES SANITÁRIAS</h3>${selected.map((item, k) => `<p>${k + 1}. ${esc(String(item.text).replace(/\\.?$/, ".") + (item.legal ? " Dispositivos infringidos: " + String(item.legal).replace(/\\.?$/, ".") : ""))}</p>`).join("")}` : ""}', 'guiado corpo');
  return s;
});

/* ---------- Alimentos: serviço de alimentação ---------- */
bloco('app--servicos-alimentacao-roteiro', s => {
  s = troca(s, `  var vis = itensVisiveis();
  var rot = { ok: 'Atende', nao: 'Não atende', ver: 'Verificação pendente', na: 'Não se aplica' };
  vis.forEach(function (g) {
    var linhas = g.itens.filter(function (i) { return st.resp[i.id] && st.resp[i.id] !== 'na'; });
    if (!linhas.length) return;
    L.push(g.secao.title);
    linhas.forEach(function (i) {
      L.push('  [' + rot[st.resp[i.id]] + '] ' + i.text);
      if (i.legal) L.push('      Ref.: ' + i.legal);
      if (st.notas[i.id]) L.push('      Nota: ' + st.notas[i.id]);
    });
    L.push('');
  });
  var infs = cfg.infractions.filter(function (i) { return st.inf[i.id]; });
  if (infs.length) {
    L.push('INFRAÇÕES CONSTATADAS (' + infs.length + ')');
    infs.forEach(function (i) { L.push('  - ' + i.text); L.push('      Capitulação: ' + i.legal); });
    L.push('');
  }
  L.push('Fontes legais citadas: texto integral disponível no aplicativo, não reproduzido aqui.');
  (cfg.norms || []).forEach(function (n) { L.push('  · ' + n.title + (n.url ? ' — ' + n.url : '')); });
  L.push('');`,
  `  var vis = itensVisiveis();
  /* descritivo (como os relatórios do site Medicamentos): parágrafo por seção,
     irregularidades e enquadramento numerados; títulos numerados em maiúsculas
     viram cabeçalho no Word */
  var F = ${F}, cap = function (t) { t = String(t).trim(); return t.charAt(0).toUpperCase() + t.slice(1).replace(/\\.?$/, '.'); };
  var frase = function (i) { return F(i.text, st.resp[i.id] === 'ok' ? 'c' : 'nc') + (st.notas[i.id] ? ' ' + cap(st.notas[i.id]) : ''); };
  var irr = [], ns = 0;
  L.push('1 VERIFICAÇÕES REALIZADAS');
  vis.forEach(function (g) {
    var linhas = g.itens.filter(function (i) { return st.resp[i.id] === 'ok' || st.resp[i.id] === 'nao'; });
    if (!linhas.length) return;
    ns++; L.push('1.' + ns + ' ' + String(g.secao.title).replace(/^\\s*\\d+[.)]?\\s*/, '').toUpperCase());
    L.push(linhas.map(frase).join(' '));
    linhas.forEach(function (i) { if (st.resp[i.id] === 'nao') irr.push(i); });
    L.push('');
  });
  if (!ns) { L.push('Nenhuma verificação registrada.'); L.push(''); }
  L.push('2 IRREGULARIDADES OBSERVADAS');
  if (irr.length) irr.forEach(function (i, k) { L.push((k + 1) + '. ' + frase(i) + (i.legal ? ' Fundamento: ' + String(i.legal).replace(/\\.?$/, '.') : '')); });
  else L.push('Não foram registradas irregularidades nesta inspeção.');
  L.push('');
  var infs = cfg.infractions.filter(function (i) { return st.inf[i.id]; });
  if (infs.length) {
    L.push('3 ENQUADRAMENTO DAS INFRAÇÕES SANITÁRIAS');
    infs.forEach(function (i, k) { L.push((k + 1) + '. ' + cap(i.text) + ' Dispositivos infringidos: ' + String(i.legal).replace(/\\.?$/, '.')); });
    L.push('');
  }
  L.push((infs.length ? '4' : '3') + ' LEGISLAÇÃO DE REFERÊNCIA');
  (cfg.norms || []).forEach(function (n) { L.push('• ' + n.title); });
  L.push('');`, 'alimentos texto');
  s = troca(s, "var blocks=ta.value.split('\\n').map(function(text,i){return {type:i?'p':'title',text:text}});",
    "var blocks=ta.value.split('\\n').map(function(text,i){return {type:i?(/^\\d+(\\.\\d+)?\\s+[^a-zà-ú]+$/.test(text)?'heading':'p'):'title',text:text}});", 'alimentos cabeçalhos');
  return s;
});

/* ---------- Estética: inventário de infrações ---------- */
bloco('app--estetica', s => troca(s,
  `root.innerHTML='<h1>Infrações e legislação relacionada</h1><p>'+esc($("metaSaida").textContent)+'</p><table><thead><tr><th>Descrição da infração</th><th>Dispositivo legal infringido</th></tr></thead><tbody>'+$("corpoSaida").innerHTML+'</tbody></table>';`,
  `/* descritivo: infrações numeradas por bloco, com a constatação e o dispositivo infringido */const xs=TODAS.filter(t=>escolhidas.has(t.id)),pt=v=>String(v).trim().replace(/\\.?$/,'.');let last='',n=0,h='<h1>Relatório de inspeção sanitária — serviços de estética</h1><p>'+esc($("metaSaida").textContent)+'</p><h2>Infrações constatadas</h2>';xs.forEach(t=>{const k=t.bloco+' — '+t.tema;if(k!==last){h+='<h3>'+esc(k)+'</h3>';last=k}const c=String(notas[t.id]||'').trim();h+='<p>'+(++n)+'. '+esc(pt(t.i)+(c?' Constatação: '+pt(c.charAt(0).toUpperCase()+c.slice(1)):'')+' Dispositivo legal infringido: '+pt(t.l))+'</p>'});if(!n)h+='<p>Nenhuma infração selecionada.</p>';root.innerHTML=h;`, 'estética'));

/* ---------- “O relatório é só o relatório” (17/10/2026): sem anexo com texto
   de lei e sem avisos internos; a citação fica nas irregularidades e no
   enquadramento, como no EAC ---------- */
bloco('app--servicos-assistenciais', s => troca(s,
  `+(refs.length?'<section class="legal-appendix"><h3>Dispositivos legais citados</h3>'+reportLegal(refs)+'</section>':'')+'<p><b>Conferência obrigatória:</b> antes da lavratura, confirmar aplicabilidade, vigência, competência e correspondência entre o fato e todos os dispositivos citados.</p>';`,
  `;/* relatório sem anexo de texto legal nem aviso interno */`, 'assistenciais sem anexo'));
bloco('app--odontologia', s => troca(s, "  if(o.transc&&nc.length){\n    B.push({t:'h1',x:'7 DISPOSITIVOS DESCUMPRIDOS'});",
  "  if(false&&o.transc&&nc.length){/* sem transcrição de norma no relatório */\n    B.push({t:'h1',x:'7 DISPOSITIVOS DESCUMPRIDOS'});", 'odonto sem transcrição'));
bloco('rec--roteiro-guiado.js', s => troca(s,
  '<p class="report-note">Instrumento de apoio. A conclusão e a capitulação final dependem da constatação, da aplicabilidade ao caso, da competência do órgão e da redação vigente das normas.</p>', '', 'guiado sem nota'));
bloco('app--servicos-alimentacao-roteiro', s => troca(s,
  "  L.push('Instrumento de apoio. A conclusão, a aplicabilidade ao caso e a capitulação dependem da constatação da equipe.');\n", '', 'alimentos sem nota'));

fs.writeFileSync(file, html);
console.log('Relatórios descritivos aplicados.');
