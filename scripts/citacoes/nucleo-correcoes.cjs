'use strict';
/* Correções declaradas no motor de citações (bloco nuc--citacoes.js), autorizadas em 18/11/2026.
   O bloco continua protegido: scripts/test-pwa-scope.cjs só aceita, em relação à main, exatamente
   estas trocas.
   1. Ordem dos dispositivos subordinados: o parágrafo vem antes dos seus incisos e alíneas
      (antes, no art. 12 da Lei 6.360/1976, os incisos do § 8º apareciam antes do § 8º).
   2. Rótulo do parágrafo: ordinal até o nono e cardinal a partir do décimo (§ 9º, § 10),
      como manda a LC 95/1998, art. 10, I.
   aplica(src) é idempotente. */
const TROCAS = [
  ["      var ordem = { artigo: 0, inciso: 1, alinea: 2, paragrafo: 3 };",
   "      var ordem = { artigo: 0, paragrafo: 1, inciso: 2, alinea: 3 };"],
  ["    else if (a.paragrafo) t += ', § ' + a.paragrafo + 'º';",
   "    else if (a.paragrafo) t += ', § ' + a.paragrafo + (a.paragrafo < 10 ? 'º' : '');"]
];
function aplica(src) {
  for (const [de, para] of TROCAS) {
    const nDe = src.split(de).length - 1, nPara = src.split(para).length - 1;
    if (nDe === 0 && nPara === 1) continue;
    if (nDe !== 1 || nPara !== 0) throw Error('motor de citações: trecho não localizado de forma única — ' + de.trim());
    src = src.replace(de, () => para);
  }
  return src;
}
module.exports = {TROCAS, aplica};
