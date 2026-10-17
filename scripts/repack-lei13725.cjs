'use strict';
/* Relatórios dos roteiros de motor próprio (pedido de 17/10/2026):
   - toda irregularidade cita a Lei Municipal nº 13.725/2004, só até o art. 109: o
     fundamento passa por window.UvsLei (campo/relatorio-frases.js), que acrescenta o
     artigo do assunto quando a verificação não cita a lei — Odontologia, Serviços
     assistenciais, Alimentos e Produtos;
   - sem lista de normas no relatório (Odontologia: “Normas de referência”; Alimentos:
     “Legislação de referência”); a aba de normas do módulo continua;
   - Serviços assistenciais: o art. 22 da Lei 13.725 que restava (SAICA, demais
     acolhimentos e residência terapêutica) dá lugar ao art. 69 e ao art. 65;
   - Estética: com a constatação preenchida, o Word descreve a infração pela
     constatação (o fato encontrado), e não pelo texto genérico do catálogo.
   Idempotente. Uso: node scripts/repack-lei13725.cjs */
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
  if (s.includes('\r\n') && de.includes('\n') && !de.includes('\r\n')) { de = de.replace(/\n/g, '\r\n'); para = para.replace(/\n/g, '\r\n'); }
  if (para ? s.includes(para) : !s.includes(de)) return s;
  if (s.split(de).length !== 2) throw Error(rot + ': esperava 1 ocorrência, achei ' + (s.split(de).length - 1));
  return s.replace(de, () => para);
}
const L = "(window.UvsLei||function(c){return c||''})";

/* ---------- Odontologia ---------- */
bloco('app--odontologia', s => {
  s = troca(s, "(i.t,'nc'))+' Fundamento: '+String(i.c).replace(/\\.?$/,'.')});",
    "(i.t,'nc'))+' Fundamento: '+String(" + L + "(i.c,i.id)).replace(/\\.?$/,'.')});", 'odonto fundamento');
  s = troca(s, "B.push({t:'h1',x:'NORMAS DE REFERÊNCIA'});\n  B.push({t:'table',widths:[2300,3300,3000],head:['Norma','Objeto','Endereço oficial'],rows:DATA.norms.map(n=>[n.title,n.desc,n.url])});",
    "/* sem lista de normas no relatório (17/10/2026): cada irregularidade traz o seu fundamento */", 'odonto normas');
  return s;
});

/* ---------- Serviços assistenciais ---------- */
bloco('app--servicos-assistenciais', s => {
  s = troca(s, "' Fundamento: '+String(r.citation||'').replace(/\\.?$/,'.'))+'</p>').join('')",
    "' Fundamento: '+String(" + L + "(r.citation,current.id,r.group)).replace(/\\.?$/,'.'))+'</p>').join('')", 'assist fundamento');
  /* art. 22 que restava: SAICA e demais acolhimentos → art. 69; residência terapêutica (elevador) → art. 65 */
  s = s.split('"l":"Lei Municipal nº 13.725/2004, art. 22, c/c Lei Municipal nº 10.348/1987, arts. 3º a 5º."').join('"l":"Lei Municipal nº 13.725/2004, art. 65, c/c Lei Municipal nº 10.348/1987, arts. 3º a 5º."');
  s = s.split('"l":"Lei Municipal nº 13.725/2004, art. 22, II."').join('"l":"Lei Municipal nº 13.725/2004, art. 69."');
  s = s.split('"l":"Lei Municipal nº 13.725/2004, art. 22, II"').join('"l":"Lei Municipal nº 13.725/2004, art. 69"');
  s = s.split('{"law":"lei-municipal-13725-2004","node":"a22-ii","label":"Lei Municipal nº 13.725/2004","display":"Art. 22, II"}').join('{"law":"lei-municipal-13725-2004","node":"a69","label":"Lei Municipal nº 13.725/2004","display":"Art. 69"}');
  s = s.split('{"law":"lei-municipal-13725-2004","node":"a22","label":"Lei Municipal nº 13.725/2004","display":"Art. 22"}').join('{"law":"lei-municipal-13725-2004","node":"a65","label":"Lei Municipal nº 13.725/2004","display":"Art. 65"}');
  if (/13\.725\/2004, art\. 22/.test(s)) throw Error('assist: art. 22 ainda citado');
  return s;
});

/* ---------- Alimentos ---------- */
bloco('app--servicos-alimentacao-roteiro', s => {
  s = troca(s, "L.push((k + 1) + '. ' + frase(i) + (i.legal ? ' Fundamento: ' + String(i.legal).replace(/\\.?$/, '.') : ''));",
    "L.push((k + 1) + '. ' + frase(i) + (function (f) { return f ? ' Fundamento: ' + f.replace(/\\.?$/, '.') : ''; })(String(" + L + "(i.legal, i.id))));", 'alimentos fundamento');
  s = troca(s, "L.push((infs.length ? '4' : '3') + ' LEGISLAÇÃO DE REFERÊNCIA');\n  (cfg.norms || []).forEach(function (n) { L.push('• ' + n.title); });\n  L.push('');",
    "/* sem lista de normas no relatório (17/10/2026) */", 'alimentos legislação');
  return s;
});

/* ---------- Produtos ---------- */
bloco('rec--roteiro-guiado.js', s => troca(s,
  'esc(frase(item) + (item.legal ? " Fundamento: " + String(item.legal).replace(/\\.?$/, ".") : ""))',
  'esc(frase(item) + ((f) => f ? " Fundamento: " + f.replace(/\\.?$/, ".") : "")(String(' + L + '(item.legal, item._id || item.id))))', 'produtos fundamento'));

/* ---------- Estética: a constatação descreve a infração ---------- */
bloco('app--estetica', s => troca(s,
  "h+='<p>'+(++n)+'. '+esc(pt(t.i)+(c?' Constatação: '+pt(c.charAt(0).toUpperCase()+c.slice(1)):'')+' Dispositivo legal infringido: '+pt(t.l))+'</p>'",
  "/* com a constatação, ela descreve a infração (o fato encontrado, sem o “ou” do catálogo) */h+='<p>'+(++n)+'. '+esc((c?pt(c.charAt(0).toUpperCase()+c.slice(1)):pt(t.i))+' Dispositivo legal infringido: '+pt(t.l))+'</p>'", 'estética constatação'));

fs.writeFileSync(file, html);
console.log('Lei 13.725 nos relatórios de odontologia, assistenciais, alimentos e produtos; sem lista de normas; estética pela constatação.');
