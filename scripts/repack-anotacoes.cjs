'use strict';
/* Caixa de texto (digitada ou ditada) em cada pergunta — pedido de 16/10/2026.
   - Odontologia: “Anotação” em toda verificação (a mesma caixa vira “Evidência da
     constatação” no Não cumpre; antes só existia no Não cumpre). Sai no relatório,
     na coluna Resultado.
   - Serviços assistenciais: “Anotação” em cada documento e item do roteiro;
     sai no relatório junto da situação (chave <modalidade>|nota|<tipo>|<n>).
   - Estética: “Constatação” em cada infração marcada; sai no relatório abaixo
     da infração (localStorage estetica-constatacoes-v1).
   - Drogaria: “Anotação e evidência” das perguntas do catálogo fica disponível
     antes de responder e também no NSA (antes só depois de Sim/Não).
   Fontes: odontologia-padrao.inc.js e assistenciais-padrao.inc.js recebem a
   mesma troca, para o repack-padrao não desfazer. Idempotente.
   Uso: node scripts/repack-anotacoes.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
function troca(s, de, para, rot) {
  if (s.includes(para)) return s;
  const n = s.split(de).length - 1;
  if (n !== 1) throw Error(rot + ': esperava 1 ocorrência, achei ' + n);
  return s.replace(de, () => para);
}
function bloco(id, fn) {
  const re = new RegExp('(<script type="text/plain" id="' + id.replace(/[.]/g, '\\.') + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  const a = lz.decompressFromBase64(m[2].trim()); if (!a) throw Error('descompactação ' + id);
  const b = fn(a); if (b === a) return;
  const enc = lz.compressToBase64(b); if (lz.decompressFromBase64(enc) !== b) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]);
}
function fonte(f, fn) { const p = path.join(root, f), a = fs.readFileSync(p, 'utf8'), b = fn(a); if (b !== a) fs.writeFileSync(p, b); }
const CSS = '<style id="uvs-anot-css">.pu-anot,.anot{display:block;margin:8px 0 4px;font-size:13px;font-weight:600;color:#3b4652}'
  + '.pu-anot small,.anot small{font-weight:400;color:#6b7580}'
  + '.pu-anot textarea,.anot textarea{display:block;width:100%;box-sizing:border-box;margin-top:4px;min-height:58px;padding:8px 10px;border:1px solid #cfd6dd;border-radius:8px;font:inherit;font-weight:400;font-size:14px;line-height:1.4;resize:vertical;background:#fff}'
  + '.pu-anot textarea:focus,.anot textarea:focus{outline:2px solid #6b8fb5;outline-offset:0;border-color:#6b8fb5}</style>';
const comCss = s => s.includes('id="uvs-anot-css"') ? s : s.replace(/<\/head>/i, CSS + '</head>');

/* ---------- Odontologia ---------- */
const ODO_NOTA = "function odoNotaHtml(i){const a=state.a[i.id]||'',nc=a==='nao';"
  + "return `<label class=\"pu-anot\">${nc?'Evidência da constatação':'Anotação'} <small>(digite ou dite)</small><textarea rows=\"2\" data-evidence=\"${esc(i.id)}\" placeholder=\"${nc?'O que foi constatado, onde, documento conferido…':'Opcional: o que foi visto ou conferido'}\">${esc(state.evidence?.[i.id]||'')}</textarea></label>`}\n";
const odoFonte = s => {
  s = troca(s, "  +odoFotoHtml(i.id)\n", "  +odoNotaHtml(i)\n  +odoFotoHtml(i.id)\n", 'odontologia: anotação na pergunta');
  return troca(s, "let odoFotoAberta='';", ODO_NOTA + "let odoFotoAberta='';", 'odontologia: função da anotação');
};
fonte('odontologia-padrao.inc.js', odoFonte);
bloco('app--odontologia', s => {
  s = comCss(odoFonte(s));
  s = troca(s, "<label>Evidência da constatação<textarea rows=\"3\" data-evidence=\"${esc(i.id)}\" style=\"display:block;width:100%\">${esc(state.evidence?.[i.id]||'')}</textarea></label>",
    "<p class=\"pu-q-ajuda\">A evidência vai na caixa “Evidência da constatação”, logo abaixo.</p>", 'odontologia: evidência única');
  return troca(s, "B.push({t:'table',widths:[4900,2400,1300],head:['Requisito','Dispositivo','Resultado'],\n      rows:rows.map(r=>[r.i.t,r.i.c,RES[r.a]])});",
    "B.push({t:'table',widths:[4300,2100,2200],head:['Requisito','Dispositivo','Resultado'],\n      rows:rows.map(r=>{const nt=String(state.evidence?.[r.i.id]||'').trim();return [r.i.t,r.i.c,RES[r.a]+(nt?'. '+nt.charAt(0).toUpperCase()+nt.slice(1).replace(/\\.?$/,'.'):'')]})});",
    'odontologia: anotação no relatório');
});

/* ---------- Serviços assistenciais ---------- */
const asFonte = s => {
  s = troca(s, "  +`<details class=\"pu-mais\"><summary>Foto${foto?' ✓':''}</summary><div>${photoHtml(kind,i)}</div></details></div>`;",
    "  +`<label class=\"pu-anot\">Anotação <small>(digite ou dite)</small><textarea rows=\"2\" data-as-nota=\"${kind}|${i}\" placeholder=\"Opcional: o que foi visto ou conferido\">${esc(saved[scope()+'|nota|'+kind+'|'+i]||'')}</textarea></label>`\n"
    + "  +`<details class=\"pu-mais\"><summary>Foto${foto?' ✓':''}</summary><div>${photoHtml(kind,i)}</div></details></div>`;", 'assistenciais: anotação na pergunta');
  return troca(s, "if(t.dataset.asMeta){meta()[t.dataset.asMeta]=t.value;persist();UvisPadrao.atualiza()}",
    "if(t.dataset.asMeta){meta()[t.dataset.asMeta]=t.value;persist();UvisPadrao.atualiza()}if(t.dataset.asNota){const kn=scope()+'|nota|'+t.dataset.asNota;if(t.value.trim())saved[kn]=t.value;else delete saved[kn];persist()}",
    'assistenciais: gravar anotação');
};
fonte('assistenciais-padrao.inc.js', asFonte);
bloco('app--servicos-assistenciais', s => {
  s = comCss(asFonte(s));
  return troca(s, "const st=mark(kind,i);if(st)rows.push({kind,section:kind===\"doc\"?\"Documentação\":\"Roteiro\",group:item.g,item:item.i,citation:item.l,state:status(kind,st),refs:item.refs,index:i})",
    "const st=mark(kind,i),nt=String(saved[scope()+'|nota|'+kind+'|'+i]||'').trim();if(st||nt)rows.push({kind,section:kind===\"doc\"?\"Documentação\":\"Roteiro\",group:item.g,item:item.i,citation:item.l,state:(st?status(kind,st):'Sem marcação')+(nt?' — '+nt:''),refs:item.refs,index:i})",
    'assistenciais: anotação no relatório');
});

/* ---------- Estética ---------- */
/* desde 18/10/2026 a Estética é roteiro-simples (scripts/repack-estetica.cjs): o ajuste do módulo antigo não se aplica */
bloco('app--estetica', s => {
  if (/window\.ROTEIRO=/.test(s)) return s;
  s = comCss(s);
  s = troca(s, "function htmlInfra(t){",
    "let notas={};try{notas=JSON.parse(localStorage.getItem('estetica-constatacoes-v1')||'{}')||{}}catch(e){}\n"
    + "document.addEventListener('input',e=>{const t=e.target;if(t&&t.dataset&&t.dataset.nota){if(t.value.trim())notas[t.dataset.nota]=t.value;else delete notas[t.dataset.nota];try{localStorage.setItem('estetica-constatacoes-v1',JSON.stringify(notas))}catch(_){}}});\n"
    + "function htmlInfra(t){", 'estética: constatações');
  s = troca(s, "'</span></button><p class=\"lei\">'+refButtons(t)+'</p>'",
    "'</span></button><p class=\"lei\">'+refButtons(t)+'</p>'+(marcada?'<label class=\"anot\">Constatação <small>(digite ou dite)</small><textarea rows=\"2\" data-nota=\"'+t.id+'\" placeholder=\"O que foi constatado, onde, documento ou produto envolvido\">'+esc(notas[t.id]||'')+'</textarea></label>':'')",
    'estética: caixa da constatação');
  return troca(s, "return h+'<tr><td>'+esc(t.i)+'</td><td class=\"lei\">'",
    "return h+'<tr><td>'+esc(t.i)+(String(notas[t.id]||'').trim()?'<br><em>Constatação: '+esc(String(notas[t.id]).trim())+'</em>':'')+'</td><td class=\"lei\">'",
    'estética: constatação no relatório');
});

/* ---------- Drogaria ---------- */
bloco('app--drogaria', s => troca(s,
  "${a&&a!=='nsa'?`<details class=\"detail\"${state.notes[key]?' open':''}><summary>Observação e evidência${state.notes[key]?' · registrada':''}</summary>${input('notes.'+key,'Observação factual (opcional)','textarea')}",
  "${q.tipo!=='achado'?`<details class=\"detail\"${state.notes[key]?' open':''}><summary>Anotação e evidência${state.notes[key]?' · registrada':' (digite ou dite)'}</summary>${input('notes.'+key,'Anotação factual (opcional)','textarea')}",
  'drogaria: anotação sempre disponível'));

fs.writeFileSync(file, html);
console.log('Anotações: odontologia, serviços assistenciais, estética e drogaria.');
