'use strict';
/* Correções declaradas no catálogo integrado da Drogaria (VISA_LOCAL, bloco app--drogaria).
   O VISA_LOCAL é protegido: test-pwa-scope exige que fique igual ao da main, salvo as correções
   desta lista, cada uma com o motivo e a data da autorização. Aplicadas por
   scripts/repack-medicamentos.cjs. Idempotente: correção já aplicada não muda nada. */
const CORRECOES = [
  {arquivo: 'roteiros/drogaria-inventario.json', item: 'interdicao', campo: 'citation',
    de: 'Lei Municipal nº 13.725/2004, art. 100, caput e § 1º.',
    para: 'Lei Municipal nº 13.725/2004, art. 109, caput e § 1º.',
    motivo: 'Descumprir interdição: o art. 100 trata do livre acesso da autoridade sanitária e não tem parágrafos; o assunto é o art. 109 (caput: produto, equipamento e utensílio interditados; § 1º: local), já referência do item (lm109).',
    autorizado: '2026-11-19'}
];
function aplica(visa) {
  for (const c of CORRECOES) {
    const it = (visa[c.arquivo] && visa[c.arquivo].itens || []).find(x => x.id === c.item);
    if (!it) throw Error('VISA_LOCAL: item ' + c.item + ' não localizado em ' + c.arquivo);
    if (it[c.campo] === c.de) it[c.campo] = c.para;
    else if (it[c.campo] !== c.para) throw Error('VISA_LOCAL: ' + c.item + '.' + c.campo + ' inesperado: ' + it[c.campo]);
  }
  return visa;
}
module.exports = {CORRECOES, aplica};
