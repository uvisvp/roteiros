'use strict';
/* Reempacota correções de apresentação que vivem nos blocos integrados. */
const fs=require('node:fs');
const path=require('node:path');
const {unpack}=require('./integrated-html.cjs');
const root=path.join(__dirname,'..');
const file=path.join(root,'index.html');
const {html,blocks,lz}=unpack(file);
function replaceOnce(source,from,to,label){if(!source.includes(from)){console.warn('Trecho já aplicado ou ausente: '+label);return source;}return source.replace(from,to);}
let farm=blocks.get('app--farmacia-manipulacao');
farm=farm.replace("Limpar somente os dados do card '+card+'?","Limpar somente os dados da seção '+card+'?");
farm=farm.replaceAll('Anotações e foto','Anotações e fotos');
blocks.set('app--farmacia-manipulacao',farm);
let cit=blocks.get('nuc--citacoes.js');
cit=replaceOnce(cit,
`function candidatos(mapa, id) {\n    var out = [];\n    for (var suf = ''; ; suf += 'b') {\n      var k = id + suf;\n      if (!mapa[k]) { if (suf === '') continue; break; }\n      out.push(k);\n      if (suf.length > 3) break;\n    }\n    return out;\n  }`,
`function candidatos(mapa, id) {\n    var out = [];\n    for (var suf = ''; ; suf += 'b') {\n      var k = id + suf;\n      if (!mapa[k]) { if (suf === '') continue; break; }\n      /* Artigos com letra (ex.: Art. 50-A) usam o mesmo sufixo técnico\n         que duplicidades antigas. O prefixo "A." no texto oficial permite\n+         separá-los sem marcar o artigo-base como ambíguo. */\n      if (suf && /^A\\.\\s/.test(String(mapa[k].x||'')) && /^a\\d+$/.test(id)) { suf += 'b'; continue; }\n      out.push(k);\n      if (suf.length > 3) break;\n    }\n    return out;\n  }`, 'candidatos de rótulo');
cit=replaceOnce(cit,
`function rotuloDe(id) {\n    var a = analisaId(id);`,
`function rotuloDe(id) {\n    var a = analisaId(id);`, 'rotuloDe');
cit=replaceOnce(cit,
`var u = p.match(/^([\\d.]+)$/);\n      if (u) { out.push({ de: pref + u[1] }); return; }`,
`var u = p.match(/^([\\d.]+)(?:[- ]([a-z]))?$/i);\n      if (u) { out.push({ de: pref + u[1] + (u[2] ? u[2].toLowerCase() : '') }); return; }`, 'artigos com letra');
cit=replaceOnce(cit,
`var m = corpo.match(/^(\\d+)(.*)$/);\n    if (!m) return null;\n    var id = 'a' + m[1], resto = m[2] || '';`,
`var m = corpo.match(/^(\\d+)(?:[- ]([a-z]))?(.*)$/i);\n    if (!m) return null;\n    var id = 'a' + m[1] + (m[2] ? m[2].toLowerCase() : ''), resto = m[3] || '';`, 'id de artigo com letra');
cit=replaceOnce(cit,
`function montaDispositivo(normaId, mapa, id, ambiguo) {\n    var no = mapa[id];\n    if (!no) return { id: id, rotulo: rotuloDe(id), encontrado: false };\n    return {\n      id: id, rotulo: rotuloDe(id), encontrado: true,`,
`function rotuloDoNo(id, no) {\n    var r = rotuloDe(id), a = analisaId(id);\n    if (a.tipo === 'artigo' && a.variante && /^A\\.\\s/.test(String(no && no.x || ''))) {\n      r = r.replace(/^Art\\.\\s*\\d+/, 'Art. ' + a.artigo + '-A');\n    }\n    return r;\n  }\n\n  function montaDispositivo(normaId, mapa, id, ambiguo) {\n    var no = mapa[id];\n    if (!no) return { id: id, rotulo: rotuloDe(id), encontrado: false };\n    return {\n      id: id, rotulo: rotuloDoNo(id, no), encontrado: true,`, 'rótulo pelo conteúdo');
/* O banco usa o sufixo técnico "b" para a ocorrência com letra no artigo. */
cit=cit.replace("u[2] ? u[2].toLowerCase() : ''", "u[2] ? 'b' : ''");
cit=cit.replace("m[2] ? m[2].toLowerCase() : ''", "m[2] ? 'b' : ''");
cit=cit.replace('+         separá-los sem marcar', '         separá-los sem marcar');
blocks.set('nuc--citacoes.js',cit);
let out=html;
for(const [id,source] of blocks){
  if(!source)continue;
  const safe=id.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&');
  const re=new RegExp('(<script type="text/plain" id="'+safe+'">)[\\s\\S]*?(</script>)');
  const m=out.match(re); if(!m)continue;
  const encoded=lz.compressToBase64(source);
  if(lz.decompressFromBase64(encoded)!==source)throw new Error('round-trip '+id);
  out=out.replace(re,()=>m[1]+encoded+m[2]);
}
fs.writeFileSync(file,out);
console.log('Blocos visuais e citações reempacotados.');
