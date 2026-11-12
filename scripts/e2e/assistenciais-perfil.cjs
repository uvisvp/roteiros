'use strict';
/* Serviços assistenciais pelo perfil (12/11/2026, assistenciais-perfil.inc.js): nos demais acolhimentos, o
   que é de outra modalidade sai; em todas, “Não” numa característica do serviço (elevador, medicamentos,
   controlados, procedimentos, equipamentos) tira o que depende dela — sem resposta, nada sai; o já
   respondido fica. Uso: node scripts/e2e/assistenciais-perfil.cjs */
const T = require('./lib.cjs');
const ok = (c, m) => { if (c) console.log('ok  ' + m); else T.falha(m); };
const grupos = f => f.evaluate(() => UvisPadrao.lista().flatMap(s => s.itens.map(i => i.id)));
const carac = async (f, p, k, v) => { await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'ident', item: 'servico'})); await p.waitForTimeout(300); await f.evaluate(([k, v]) => document.querySelector('[data-as-carac="' + k + '"][data-v="' + v + '"]').click(), [k, v]); await p.waitForTimeout(400); };

(async () => {
  const b = await T.navegador();
  /* demais acolhimentos: modalidade */
  { const {p, f, erros} = await T.abre('Serviços assistenciais', 'servicos-assistenciais', 'X', 'servico=demais', {browser: b});
    const alvo = await f.evaluate(() => current.rot.findIndex(x => Array.isArray(x.sub) && x.sub.length === 1 && x.sub[0] === 'centro'));
    ok(alvo >= 0, 'há pergunta só do centro de acolhida');
    for (const [sub, deve] of [['republica', false], ['centro', true]]) {
      await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'ident', item: 'servico'})); await p.waitForTimeout(300);
      await f.evaluate(v => { const s = document.querySelector('[data-as-sub]'); s.value = v; s.dispatchEvent(new Event('change', {bubbles: true})); }, sub); await p.waitForTimeout(600);
      const vis = await f.evaluate(i => current.rot[i].rep == null && asGrupos('rot').some(g => g.idx.includes(i)), alvo);
      ok(vis === deve, 'demais acolhimentos (' + sub + '): pergunta só do centro de acolhida ' + (deve ? 'aparece' : 'fica fora'));
    }
    if (erros.length) T.falha('demais: erros de página — ' + erros.join(' | '));
    await p.close(); }
  /* ILPI: características */
  { const {p, f, erros} = await T.abre('Serviços assistenciais', 'servicos-assistenciais', 'X', 'servico=ilpi', {browser: b});
    let g = await grupos(f);
    ok(g.some(x => /Elevador ou plataforma/.test(x)), 'sem resposta, o elevador continua no roteiro');
    const total0 = await f.evaluate(() => ['doc', 'rot'].reduce((n, k) => n + current[k].filter(x => x.rep == null).length, 0));
    /* responde uma pergunta do elevador antes de dizer que não há */
    const ie = await f.evaluate(() => current.rot.findIndex(x => /elevador|plataforma/i.test(x.ap || '') && x.rep == null));
    await f.evaluate(i => { saved[k('rot', i)] = 'C'; persist(); }, ie);
    await carac(f, p, 'elevador', 'nao');
    await carac(f, p, 'medicamentos', 'nao');
    g = await grupos(f);
    const r = await f.evaluate(ie => ({resp: current.rot[ie].rep == null, outros: current.rot.filter((x, i) => i !== ie && /elevador|plataforma/i.test(x.ap || '') && x.rep == null).length,
      docEl: current.doc.filter(x => /^Elevador ou plataforma/.test(x.g) && x.rep == null).length, med: current.doc.filter(x => /^Medicamentos — quando/.test(x.g) && x.rep == null).length,
      total: ['doc', 'rot'].reduce((n, k) => n + current[k].filter(x => x.rep == null).length, 0)}), ie);
    ok(r.resp && !r.outros && !r.docEl, 'sem elevador: só a pergunta já respondida fica');
    ok(!r.med && r.total < total0, 'sem medicamentos: documentos de medicamentos fora (' + total0 + ' → ' + r.total + ')');
    const rel = await T.texto(f, 'servicos-assistenciais');
    ok(!/Relação dos medicamentos em uso/.test(rel), 'relatório sem o que saiu do perfil');
    ok(/Características do serviço declaradas — Elevador ou plataforma: não; Medicamentos guardados ou administrados pelo serviço: não/.test(rel), 'prévia com as características declaradas');
    const word = await f.evaluate(() => { buildReport(true); return document.getElementById('reportBody').textContent; });
    ok(/Características do serviço declaradas — Elevador ou plataforma: não/.test(word) && !/Relação dos medicamentos em uso/.test(word), 'relatório (Word) com as características e sem o que saiu do perfil');
    /* desfaz: volta tudo */
    await carac(f, p, 'medicamentos', 'nao');
    ok(await f.evaluate(() => current.doc.some(x => /^Medicamentos — quando/.test(x.g) && x.rep == null)), 'tirar o “Não” devolve as verificações');
    ok(await f.evaluate(() => current.rot.filter(x => x.rep === 'perfil').length === current.rot.filter(x => x.rep === 'perfil' && /elevador|plataforma/i.test(x.ap || '')).length), 'repetições já retiradas continuam retiradas');
    if (erros.length) T.falha('ilpi: erros de página — ' + erros.join(' | '));
    await p.close(); }
  await b.close();
  if (!process.exitCode) console.log('PASS: Serviços assistenciais — modalidade dos demais acolhimentos e características do serviço filtram o roteiro.');
})().catch(e => { console.error(e); process.exit(1); });
