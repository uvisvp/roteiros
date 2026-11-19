'use strict';
/* Correções declaradas no motor de citações (bloco nuc--citacoes.js), autorizadas em 18/11/2026.
   O bloco continua protegido: scripts/test-pwa-scope.cjs só aceita, em relação à main, exatamente
   estas trocas.
   1. Ordem dos dispositivos subordinados: o parágrafo vem antes dos seus incisos e alíneas
      (antes, no art. 12 da Lei 6.360/1976, os incisos do § 8º apareciam antes do § 8º).
   2. Rótulo do parágrafo: ordinal até o nono e cardinal a partir do décimo (§ 9º, § 10),
      como manda a LC 95/1998, art. 10, I.
   3. Sufixo técnico “b” (redação duplicada no banco) colado ao inciso ou à alínea — a101-ivb,
      n9-iii-ab: o dispositivo é lido como o inciso IV / a alínea “a” (variante), e não como uma
      alínea “ivb”. Antes, no ECA, art. 101, a redação vigente dos incisos IV, V, VII e VIII
      aparecia como “ivb”, “vb”, “viib”, “viiib”, depois do inciso IX (autorizado em 18/11/2026).
   4. Normas reconstruídas só com a redação vigente (banco: unico: 1; ver scripts/banco/correcoes.cjs):
      cada rótulo tem um só dispositivo, sem a busca por redações duplicadas; os subordinados saem na
      ordem do texto oficial; o rótulo gravado no banco (meta.r) vale quando o id não basta
      (art. 8º-A, § 1º-A, inciso XI-A, alínea dentro de inciso, numeração repetida no texto oficial).
   5. Artigo, parágrafo e inciso com letra: “18-B” vira a18bb (A = b, B = bb...) e “§ 2º-A” vira p2b;
      nas demais normas, onde o art. 47-B está gravado como a47b2, a busca também acha a47b2, e o
      rótulo sai “Art. 47-B” (antes, “art. 47-B” abria o art. 47-A). A letra só conta isolada:
      “art. 5 inciso III” não é mais lido como “art. 5-I”, nem “art. 10 da RDC” como “art. 10-D”; no
      inciso, a letra não pode ser número romano (“VIII-X” é intervalo) (autorizado em 18/11/2026).
   6. Lista de parágrafos seguida de parêntese ou de texto — “art. 35, §§ 2º e 3º)”, “art. 6º, §§ 2º a 7º
      (incluídos pela Lei...)”, “§§ 2º e 5º, incluídos pela” — abre todos os parágrafos, e não só o primeiro.
   7. Lista de artigos com subdivisão no último — “arts. 2º e 5º, § 1º”, “arts. 3º, 5º, § 3º, 15 e 44 a 61”:
      cada artigo da lista, e a subdivisão vai para o artigo que a precede (antes, só o primeiro artigo,
      com a subdivisão do outro). “art. 94, VII e § 1º” abre o inciso VII e o § 1º (antes, um “§ 1º, VII”
      inexistente).
   aplica(src) é idempotente. */
const TROCAS = [
  ["      var ordem = { artigo: 0, inciso: 1, alinea: 2, paragrafo: 3 };",
   "      var ordem = { artigo: 0, paragrafo: 1, inciso: 2, alinea: 3 };"],
  ["    else if (a.paragrafo) t += ', § ' + a.paragrafo + 'º';",
   "    else if (a.paragrafo) t += ', § ' + a.paragrafo + (a.paragrafo < 10 ? 'º' : '');"],
  ["function ehRomano(s) { return ROMANOS.indexOf(s) >= 0; }",
   "function ehRomano(s) { return ROMANOS.indexOf(s) >= 0; }\n" +
   "  /* Sufixo técnico \"b\" de redação duplicada colado ao inciso ou à alínea (a101-ivb, n9-iii-ab):\n" +
   "     o rótulo é o do inciso ou da alínea (IV, “a”), não “ivb”. */\n" +
   "  function semVariante(s) {\n" +
   "    var m = /^([a-z]+?)(b+)$/.exec(s || '');\n" +
   "    if (!m || ehRomano(s)) return s;\n" +
   "    return (ehRomano(m[1]) || m[1].length === 1) ? m[1] : s;\n" +
   "  }"],
  ["      var subs = m[2].slice(1).split('-');",
   "      var subs = m[2].slice(1).split('-').map(semVariante);"],
  ["    var par = m[3] || '', sub = m[5] || '';",
   "    var par = m[3] || '', sub = semVariante(m[5] || ''), varSub = sub !== (m[5] || '');"],
  ["      variante: !!(m[2] || m[4] || m[6]),",
   "      variante: !!(m[2] || m[4] || m[6] || varSub),"],
  /* 4 */
  ["          mapa[y[0]] = { x: y[1], s: (y[2] && y[2].s) || null, obs: (y[2] && y[2].obs) || null };",
   "          mapa[y[0]] = { x: y[1], s: (y[2] && y[2].s) || null, obs: (y[2] && y[2].obs) || null, r: (y[2] && y[2].r) || null };"],
  ["  function rotuloDoNo(id, no) {\n    var r = rotuloDe(id), a = analisaId(id);\n",
   "  function rotuloDoNo(id, no, mapa) {\n    if (no && no.r) return no.r;   /* rótulo gravado no banco */\n    var r = rotuloDe(id), a = analisaId(id);\n" +
   "    /* artigo com letra gravado como a22b (A) ou a47b2 (B), e seus parágrafos, incisos e alíneas */\n" +
   "    var ml = /^a(\\d+)b(\\d*)((?:p|-)[\\w-]*)?$/.exec(id), art = ml && mapa && mapa['a' + ml[1] + 'b' + ml[2]];\n" +
   "    var letra = art && /^([A-Z])\\.\\s/.exec(String(art.x || ''));\n" +
   "    if (letra && (ml[2] || letra[1] === 'A') && (ml[2] || ml[3])) return rotuloDe('a' + ml[1] + (ml[3] || '')).replace(/^Art\\.\\s*\\d+/, 'Art. ' + ml[1] + '-' + letra[1]);\n"],
  ["      id: id, rotulo: rotuloDoNo(id, no), encontrado: true,",
   "      id: id, rotulo: rotuloDoNo(id, no, mapa), encontrado: true,"],
  ["        return { id: k, rotulo: rotuloDe(k), texto: f.x,",
   "        return { id: k, rotulo: rotuloDoNo(k, f, mapa), texto: f.x,"],
  ["    return filhos.sort(function (p, q) {",
   "    if (PORID[normaId] && PORID[normaId].unico) return filhos;   /* ordem do texto oficial */\n    return filhos.sort(function (p, q) {"],
  ["      var cands = candidatos(mapa, id);",
   "      var cands = n.unico ? (mapa[id] ? [id] : []) : candidatos(mapa, letraGravada(mapa, id));"],
  ["        var so = Object.keys(mapa).filter(",
   "        var so = n.unico ? [] : Object.keys(mapa).filter("],
  ["  function idDeArtigo(corpo) {",
   "  /* Letra do dispositivo em sufixo b: A = b, B = bb, C = bbb. */\n" +
   "  function letraB(l) { return l ? new Array(String(l).toLowerCase().charCodeAt(0) - 95).join('b') : ''; }\n" +
   "  /* Fora das normas reconstruídas, o art. 47-B está gravado como a47b2 (C = a47b3). */\n" +
   "  function letraGravada(mapa, id) {\n" +
   "    var m = /^(a\\d+)b(b+)(.*)$/.exec(id);\n" +
   "    if (!m || mapa[id]) return id;\n" +
   "    var alt = m[1] + 'b' + (m[2].length + 1) + m[3];\n" +
   "    return mapa[alt] ? alt : id;\n" +
   "  }\n\n  function idDeArtigo(corpo) {"],
  /* 5 */
  ["    var m = corpo.match(/^(\\d+)(?:[- ]([a-z]))?(.*)$/i);",
   "    var m = corpo.match(/^(\\d+)(?:-([a-z])(?![a-z])|\\s([b-df-np-z])(?![a-z])(?!\\s*\\d))?(.*)$/i);"],
  ["    var id = 'a' + m[1] + (m[2] ? 'b' : ''), resto = m[3] ||",
   "    var id = 'a' + m[1] + letraB(m[2] || m[3]), resto = m[4] ||"],
  ["    var mp = resto.match(/§\\s*(\\d+)|paragrafo unico|par\\.?\\s*unico/);\n    if (mp) id += mp[1] ? ('p' + mp[1]) : 'pu';",
   "    var mp = resto.match(/§\\s*(\\d+)(?:\\s*-\\s*([a-z])(?![a-z]))?|paragrafo unico|par\\.?\\s*unico/);\n    if (mp) id += mp[1] ? ('p' + mp[1] + letraB(mp[2])) : 'pu';"],
  ["    var mi = resto.match(/[,\\s](x{0,3}(?:ix|iv|v?i{0,3}))\\b/);\n    if (mi && mi[1] && ehRomano(mi[1])) id += '-' + mi[1];",
   "    var mi = resto.match(/[,\\s](x{0,3}(?:ix|iv|v?i{0,3}))\\b(?:-([abefghjknopqrstuwyz])(?![a-z]))?/);\n    if (mi && mi[1] && ehRomano(mi[1])) id += '-' + mi[1] + letraB(mi[2]);"],
  ["      if (u) { out.push({ de: pref + u[1] + (u[2] ? 'b' : '') }); return; }",
   "      if (u) { out.push({ de: pref + u[1] + letraB(u[2]) }); return; }"],
  /* 6 */
  ["      var mpp = corpo.match(/^(\\d+)\\s*,?\\s*§§?\\s*([\\d\\s,ea]+)$/);",
   "      var mpp = corpo.replace(/\\s*[()].*$/, '').replace(/\\.\\s.*$/, '').replace(/,\\s*(?!e\\s|a\\s)[a-z].*$/, '').match(/^(\\d+)\\s*,?\\s*§§?\\s*([\\d\\s,ea]+)$/);"],
  /* 7 */
  ["      if (/[§]|paragrafo|par\\.?\\s*unico|alinea/.test(corpo) ||",
   "      /* \"art. 3 e paragrafo unico\", \"art. 12 e incisos i e ii\": o artigo inteiro */\n" +
   "      var me = corpo.match(/^(\\d+)(?:-([a-z]))?\\s+e\\s+(?:§|paragrafo|par\\.|incisos?\\b|alineas?\\b)/);\n" +
   "      if (me) return { tipo: 'artigos', partes: [{ de: 'a' + me[1] + letraB(me[2]) }], anexo: anexo };\n" +
   "      /* \"art. 94, vii e § 1\", \"art. 100, caput e § 1\": dois dispositivos do mesmo artigo */\n" +
   "      var md = corpo.replace(/,\\s*d[aeo]s?\\s.*$/, '').match(/^(\\d+(?:-[a-z])?)\\s*,\\s*([^,]+?)\\s+e\\s+((?:§|paragrafo|par\\.)[^,]*)$/);\n" +
   "      if (md) { var d1 = idDeArtigo(md[1] + ', ' + md[2]);   /* \"caput e § 1\": o artigo inteiro já traz o § 1 */\n" +
   "        return { tipo: 'artigos', partes: d1 === idDeArtigo(md[1]) ? [{ de: d1 }] : [{ de: d1 }, { de: idDeArtigo(md[1] + ', ' + md[3]) }], anexo: anexo }; }\n" +
   "      if (!/^\\d+(?:-[a-z])?\\s*(?:,|\\se\\s)\\s*(?:arts?\\.?\\s*)?\\d/.test(corpo) && /[§]|paragrafo|par\\.?\\s*unico|alinea/.test(corpo) ||"],
  ["      if (pref === 'a') {\n        var s = idDeArtigo(p);\n        if (s) out.push({ de: s });\n      }",
   "      /* subdivisão solta na lista (\"2 e 5, § 1\", \"53, § 1, iii\"): vai para o dispositivo que a precede;\n" +
   "         se o motor não a lê (\"incisos ii e iii\"), fica o artigo inteiro */\n" +
   "      p = p.replace(/^arts?\\.?\\s*(?=\\d)/, '');\n" +
   "      if (pref === 'a' && out.length && !out[out.length - 1].faixa && !/^\\d/.test(p)) {\n" +
   "        var ult = out[out.length - 1], mb = /^a(\\d+)(b*)(p(?:u|\\d+))?/.exec(ult.de);\n" +
   "        if (mb && !ult.inteiro && !/^caput\\b/.test(p)) {\n" +
   "          var art = 'a' + mb[1] + mb[2], par = /^[ivxl]+\\b/.test(p) && mb[3] ? (mb[3] === 'pu' ? 'paragrafo unico' : '§ ' + mb[3].slice(1)) + ', ' : '';\n" +
   "          var sub = idDeArtigo(mb[1] + (mb[2] ? '-' + String.fromCharCode(96 + mb[2].length) : '') + ', ' + par + p);\n" +
   "          if (!sub || sub === art) { ult.de = art; ult.inteiro = true; }\n" +
   "          else if (ult.de === art) ult.de = sub; else out.push({ de: sub });\n" +
   "        }\n" +
   "        return;\n" +
   "      }\n" +
   "      if (pref === 'a') {\n        var s = idDeArtigo(p);\n        if (s) out.push({ de: s });\n      }"]
];
function aplica(src) {
  for (const [de, para] of TROCAS) {
    const nDe = src.split(de).length - 1, nPara = src.split(para).length - 1;
    if (nPara === 1) continue;   /* já aplicada (o trecho novo pode conter o antigo) */
    if (nDe !== 1 || nPara !== 0) throw Error('motor de citações: trecho não localizado de forma única — ' + de.trim());
    src = src.replace(de, () => para);
  }
  return src;
}
module.exports = {TROCAS, aplica};
