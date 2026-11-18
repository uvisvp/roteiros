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
   "      variante: !!(m[2] || m[4] || m[6] || varSub),"]
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
