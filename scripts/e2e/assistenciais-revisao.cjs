'use strict';
/* Serviços assistenciais — revisão de 12/11/2026 (scripts/assistenciais/revisao.cjs): perguntas na
   redação direta e frase do relatório “Não se constatou que…”; licença pedida uma vez por modalidade
   (sem CMVS repetido); perguntas que repetiam documento fora da tela; Centro Dia no art. 69 da Lei
   13.725; Estatuto dos Direitos do Paciente (Lei 15.378/2026) só nos cuidados de saúde da ILPI e da SRT.
   Uso: node scripts/e2e/assistenciais-revisao.cjs */
const T = require('./lib.cjs');
const ok = (c, m) => { if (c) console.log('ok  ' + m); else T.falha(m); };
async function vaiAte(f, p, sel) {
  const lista = await f.evaluate(() => UvisPadrao.lista());
  for (const s of lista) for (const i of s.itens) { await f.evaluate(([a, b]) => UvisPadrao.vai({aba: 'roteiro', secao: a, item: b}), [s.id, i.id]); await p.waitForTimeout(200); if (await f.evaluate(q => !!document.querySelector(q), sel)) return true; }
  return false;
}
const telaToda = (f, p) => f.evaluate(async () => { const out = []; for (const s of UvisPadrao.lista()) for (const it of s.itens) { UvisPadrao.vai({aba: 'roteiro', secao: s.id, item: it.id}); await new Promise(r => setTimeout(r, 90)); out.push(document.getElementById('pu-conteudo').innerText); } return out.join('\n'); });

(async () => {
  const b = await T.navegador();
  for (const sv of ['ilpi', 'centrodia', 'ct', 'srt', 'saica', 'demais']) {
    const {p, f, erros} = await T.abre('Serviços assistenciais', 'servicos-assistenciais', 'X', 'servico=' + sv, {browser: b});
    const d = await f.evaluate(() => ({rot: current.rot.filter(x => x.rep == null).map(x => x.i), doc: current.doc.filter(x => x.rep == null).map(x => x.i),
      cit: current.doc.concat(current.rot, current.inf).filter(x => x.rep == null).map(x => x.l)}));
    ok(!d.rot.some(t => /^(Está atendida a exigência|O cálculo confirma)/.test(t)), sv + ': ' + d.rot.length + ' perguntas na redação direta');
    const lic = d.doc.filter(t => /CMVS|^Licença|^Alvará sanitário|Laudo ou licença/.test(t));
    ok(lic.length === 1, sv + ': um documento de licença (' + lic.join(' | ') + ')');
    const tela = await telaToda(f, p);
    ok(!/Está atendida a exigência|Cadastro Municipal de Vigilância em Saúde \(CMVS\)/.test(tela), sv + ': tela sem a redação antiga e sem o CMVS repetido');
    if (['centrodia', 'ct', 'saica', 'demais'].includes(sv)) ok(!d.cit.some(l => /15\.378/.test(l)), sv + ': sem a Lei 15.378/2026 (não é serviço de saúde)');
    if (sv === 'centrodia') ok(!d.cit.some(l => /Lei Municipal nº 13\.725\/2004, arts?\. 6[1-8]\b|\barts?\. 6[1-8](?:(?:,| e) \d+)* da Lei Municipal nº 13\.725/.test(l)), 'centrodia: Lei 13.725 só no art. 69 (interesse da saúde), sem os arts. 61 a 68');
    if (sv === 'ilpi') {
      ok(d.cit.some(l => /15\.378\/2026, arts\. 8º e 9º/.test(l)) && !d.cit.some(l => /15\.378[^;]*\b(11|12|19)\b/.test(l)), 'ilpi: Lei 15.378/2026 só com os arts. 8º e 9º (e 17) nos cuidados de saúde');
      ok(!d.rot.some(t => /projeto arquitetônico/.test(t)), 'ilpi: sem a pergunta de aprovação do projeto (contradizia o documento da estrutura física)');
      ok(!d.cit.some(l => /da itens 2\.4 e 7\.1/.test(l)), 'ilpi: citação da Portaria 2.619/2011 sem o trecho truncado');
      /* “Não” numa pergunta reescrita: frase do relatório */
      const i = await f.evaluate(() => current.rot.findIndex(x => /^As portas têm vão livre/.test(x.i)));
      ok(i >= 0 && await vaiAte(f, p, '[data-as-mark="NC"][data-kind="rot"][data-index="' + i + '"]'), 'ilpi: pergunta das portas na tela');
      await f.evaluate(q => document.querySelector(q).click(), '[data-as-mark="NC"][data-kind="rot"][data-index="' + i + '"]'); await p.waitForTimeout(400);
      const rel = await T.texto(f, 'servicos-assistenciais');
      ok(/Não se constatou que as portas têm vão livre mínimo de 1,10 m e travamento simples, sem trancas ou chaves/.test(rel), 'ilpi: relatório com “Não se constatou que as portas…”');
      ok(!/Não está atendida a exigência/.test(rel), 'ilpi: relatório sem “Não está atendida a exigência”');
    }
    if (erros.length) T.falha(sv + ': erros de página — ' + erros.join(' | '));
    await p.close();
  }
  await b.close();
  if (!process.exitCode) console.log('PASS: Serviços assistenciais — redação direta, licença uma vez, repetições fora da tela e fundamentos revistos.');
})().catch(e => { console.error(e); process.exit(1); });
