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
    autorizado: '2026-11-19'},
  /* Inutilização de controlados: a Portaria 344/1998 em vigor não trata do assunto (arts. 82 e 84
     revogados pela RDC 768/2022; art. 83, bulas); arts. 100 e 109 da Lei 13.725 também não. A perda é
     escriturada com justificativa, entre elas o Termo de inutilização da vigilância sanitária
     (Portaria SVS/MS 6/1999, art. 93, § 4º, “c”, AnvisaLegis, conferido em 19/11/2026); resíduos de
     controlados seguem a regulamentação sanitária (RDC 222/2018, art. 65); registro de estoque de
     controlados (Lei 13.725/2004, art. 50, § 2º). Nenhuma norma localizada obriga a lavratura do termo
     em toda inutilização: o texto deixa de afirmar isso. */
  {arquivo: 'roteiros/drogaria-inventario.json', item: 'ctrl_inutiliza', campo: 'citation',
    de: 'Portaria SVS/MS nº 344/1998, arts. 82 a 84; Lei Municipal nº 13.725/2004, arts. 100 e 109.',
    para: 'Portaria SVS/MS nº 6/1999, art. 93, § 4º, alínea “c”; RDC Anvisa nº 222/2018, art. 65; Lei Municipal nº 13.725/2004, art. 50, § 2º.',
    motivo: 'Dispositivos citados revogados ou de outro assunto.', autorizado: '2026-11-19'},
  {arquivo: 'roteiros/drogaria-inventario.json', item: 'ctrl_inutiliza', campo: 'refs',
    de: ['r344_67_69', 'lm100', 'lm109'], para: ['p6_93', 'r222_65', 'lm50'],
    motivo: 'Referências internas da nova citação.', autorizado: '2026-11-19'},
  {arquivo: 'roteiros/drogaria-inventario.json', item: 'ctrl_inutiliza', campo: 'text',
    de: 'Promover a inutilização ou o descarte de medicamentos sujeitos a controle especial sem a lavratura do Termo de Inutilização pela autoridade sanitária.',
    para: 'Inutilizar ou descartar medicamentos sujeitos a controle especial sem documento que justifique a perda na escrituração, como o Termo de Inutilização expedido pela vigilância sanitária, ou em desacordo com a regulamentação de resíduos.',
    motivo: 'O texto exigia termo lavrado pela autoridade sanitária em toda inutilização, o que a norma citada não prevê.', autorizado: '2026-11-19'}
];
function aplica(visa) {
  for (const c of CORRECOES) {
    const it = (visa[c.arquivo] && visa[c.arquivo].itens || []).find(x => x.id === c.item);
    if (!it) throw Error('VISA_LOCAL: item ' + c.item + ' não localizado em ' + c.arquivo);
    const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    if (igual(it[c.campo], c.de)) it[c.campo] = JSON.parse(JSON.stringify(c.para));
    else if (!igual(it[c.campo], c.para)) throw Error('VISA_LOCAL: ' + c.item + '.' + c.campo + ' inesperado: ' + JSON.stringify(it[c.campo]));
  }
  return visa;
}
module.exports = {CORRECOES, aplica};
