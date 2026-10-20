'use strict';
/* Conferência de IFA (distribuidora), fase 4: produtos irregulares pelo CNPJ do fornecedor
   e pelos lotes informados (scripts/repack-ifa-irregulares.cjs). Base simulada. */
const T = require('./lib.cjs');
const CNPJ = '00025841000153', PROC = '25351635034202284';
const BASE = {
  'indices/irregulares_cnpj/000.json': {[CNPJ]: [PROC]},
  'indices/irregulares_lote/ab.json': {ab12x: [PROC]},
  'indices/irregulares_lote/zz.json': {},
  'produtos_irregulares/635.json': {[PROC]: {processo: PROC, empresa: {razao_social: 'Insumos Teste Ltda'}, produtos: [{produto: 'Dipirona sódica'}], acoes_resumo: 'Recolhimento', data_ultima_medida: '2026-05-04T03:00:00+00:00'}}
};
(async () => {
  const {b, p, f, erros} = await T.abre('Medicamentos', 'distribuidoras-transportadoras', 'Atacadista de medicamentos');
  await p.context().route(/base-vigilancia\/dados\//, r => {
    const k = r.request().url().split('/dados/')[1];
    return BASE[k] ? r.fulfill({json: BASE[k]}) : r.fulfill({status: 404, body: ''});
  });
  const roda = async dados => {
    await f.evaluate(d => { InsumoCheck.abrir({contexto: 'atacadista', dados: d}); }, dados);
    await p.waitForTimeout(400);
    await f.evaluate(() => document.querySelector('[data-ick-consultar4]').click());
    await p.waitForTimeout(1500);
    return f.evaluate(() => document.querySelector('.ick').innerText);
  };
  let t = await roda({natureza: 'ativo', nome: 'Dipirona', cnpj: '00.025.841/0001-53', lote: 'AB-12x'});
  if (!/Medida fiscal: Dipirona sódica/.test(t)) T.falha('CNPJ e lote: medida não listada');
  if (!/CNPJ do fornecedor e lote AB12X/.test(t)) T.falha('não diz por onde foi localizada');
  if (!/04\/05\/2026/.test(t)) T.falha('data da última medida');
  if (/consulta por fragmentos|alerta/i.test(t)) T.falha('texto antigo na fase 4');
  else console.log('ok  IFA: medida fiscal pelo CNPJ do fornecedor e pelo lote');
  t = await roda({natureza: 'ativo', nome: 'Dipirona', lote: 'ZZ999'});
  if (!/Nenhuma medida fiscal localizada/.test(t) || !/lote ZZ999/.test(t)) T.falha('sem achado: mensagem');
  else console.log('ok  IFA: sem medida fiscal, diz o que foi pesquisado');
  t = await roda({natureza: 'ativo', nome: 'Dipirona'});
  if (!/Produtos irregulares não pesquisados/.test(t)) T.falha('sem CNPJ nem lote');
  else console.log('ok  IFA: sem CNPJ nem lote, não pesquisa');
  if (erros.length) T.falha('erros: ' + erros.join(' | '));
  await b.close();
})().catch(e => { T.falha(e.stack || e); process.exit(1); });
