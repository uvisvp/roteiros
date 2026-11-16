'use strict';
/* Auditoria de 14/11/2026, E01: a resposta principal e a lista de itens exigidos nunca se contradizem.
   Lista incompleta sem “Não atende” → resposta pendente (antes ficava a anterior e o relatório afirmava
   por inteiro o que teve a confirmação de um item retirada). Motor comum (Estética) e o componente dos
   quatro módulos de motor próprio (Odontologia, Assistenciais, Produtos, Alimentos).
   Transições: Sim → pendente; Não → pendente (retirado o único “Não atende”); N/A → pendente;
   completar de novo; mistura Atende/N/A; reabrir. Uso: node scripts/e2e/auditoria-pontos.cjs */
const T = require('./lib.cjs');
const ok = (c, m) => { if (c) console.log('ok  ' + m); else T.falha(m); };

(async () => {
  const b = await T.navegador();
  /* ——— motor comum ——— */
  { const {p, f, erros} = await T.abre('Serviços', 'estetica', 'Estética e beleza', '', {browser: b});
    await f.evaluate(() => { UvisPadrao.vai({aba: 'roteiro', secao: 'ident', item: 'perfil'}); const s = document.querySelector('select[data-rs-meta="p_tipo"]'); s.value = 'saude'; s.dispatchEvent(new Event('change', {bubbles: true})); }); await p.waitForTimeout(400);
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'regular', item: 'licenca'})); await p.waitForTimeout(300);
    const cl = s => f.evaluate(s => document.querySelector(s).click(), s).then(() => p.waitForTimeout(200));
    const est = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('uvis-estetica-v1') || '{}'); return {r: (s.r || {}).lic || '', pt: Object.assign({}, (s.pt || {}).lic)}; });
    const rel = () => f.evaluate(() => { const e = UvisPadrao.estado(); UvisPadrao.vai({aba: 'relatorio'}); const t = (document.querySelector('.rs-relatorio') || {}).innerText || ''; UvisPadrao.vai(e); return t; });
    await cl('[data-rs-r="lic|c"]');
    let e = await est();
    ok(e.r === 'c' && Object.values(e.pt).join() === 'C,C,C', 'motor comum: Sim marca os três itens como Atende');
    ok(/possui licença sanitária atualizada, afixada em local visível/.test(await rel()), 'motor comum: relatório afirma a conformidade');
    await cl('[data-rs-pt="lic|visivel|C"]');
    e = await est();
    ok(e.r === '' && Object.keys(e.pt).length === 2, 'motor comum: Sim → item retirado → resposta pendente, os outros itens ficam (' + JSON.stringify(e) + ')');
    ok(await f.evaluate(() => /2\/3 verificados/.test(document.querySelector('[data-rs-q="lic"]').textContent) && !document.querySelector('[data-rs-q="lic"] .pu-resp button[aria-pressed="true"]')), 'motor comum: tela com 2/3 e sem resposta marcada');
    ok(!/possui licença sanitária atualizada, afixada em local visível/.test(await rel()), 'motor comum: relatório não afirma o que ficou sem confirmação');
    await cl('[data-rs-pt="lic|visivel|NC"]');
    ok((await est()).r === 'nc', 'motor comum: item “Não atende” → resposta Não');
    await cl('[data-rs-pt="lic|visivel|NC"]');
    e = await est();
    ok(e.r === '' && Object.keys(e.pt).length === 2, 'motor comum: retirado o único “Não atende” → pendente (antes ficava Não)');
    await cl('[data-rs-pt="lic|visivel|NA"]');
    ok((await est()).r === 'c', 'motor comum: lista completa com Atende e N/A → Sim');
    await cl('[data-rs-r="lic|na"]');
    e = await est();
    ok(e.r === 'na' && Object.values(e.pt).join() === 'NA,NA,NA', 'motor comum: Não se aplica marca todos N/A');
    await cl('[data-rs-pt="lic|vigente|NA"]');
    ok((await est()).r === '', 'motor comum: N/A → item retirado → pendente');
    await cl('[data-rs-pt="lic|vigente|C"]');
    ok((await est()).r === 'c', 'motor comum: completar a lista devolve a resposta');
    if (erros.length) T.falha('estética: erros de página — ' + erros.join(' | '));
    await p.close(); }
  /* ——— motor próprio: componente de pontos ——— */
  for (const a of [['Odontologia', 'odontologia', 'Odontologia', ''], ['Serviços assistenciais', 'servicos-assistenciais', 'X', 'servico=saica'], ['Produtos', 'produtos-correlatos', 'X', ''], ['Alimentos', 'servicos-alimentacao-roteiro', 'X', '']]) {
    const {p, f, erros} = await T.abre(...a, {browser: b});
    const itens = await f.evaluate(() => UvisPadrao.lista().flatMap(s => s.itens.map(i => [s.id, i.id])));
    let onde = null;
    for (const [s, i] of itens) { await f.evaluate(([s, i]) => UvisPadrao.vai({aba: 'roteiro', secao: s, item: i}), [s, i]); await p.waitForTimeout(200);
      if (await f.evaluate(() => document.querySelectorAll('.pu-q .uvs-pontos').length)) { onde = [s, i]; break; } }
    if (!onde) { T.falha(a[1] + ': nenhuma pergunta com itens exigidos'); await p.close(); continue; }
    const est = () => f.evaluate(() => { const q = document.querySelector('.pu-q .uvs-pontos').closest('.pu-q'); return {resp: [...q.querySelector('.pu-resp').querySelectorAll('button')].slice(0, 3).findIndex(x => x.getAttribute('aria-pressed') === 'true'), pts: [...q.querySelectorAll('.uvs-ponto')].map(d => [...d.querySelectorAll('button')].findIndex(x => x.getAttribute('aria-pressed') === 'true'))}; });
    const resp = k => f.evaluate(k => { const q = document.querySelector('.pu-q .uvs-pontos').closest('.pu-q'); q.querySelector('.pu-resp').querySelectorAll('button')[k].click(); }, k).then(() => p.waitForTimeout(350));
    const ponto = (i, k) => f.evaluate(([i, k]) => { const q = document.querySelector('.pu-q .uvs-pontos').closest('.pu-q'); q.querySelectorAll('.uvs-ponto')[i].querySelectorAll('button')[k].click(); }, [i, k]).then(() => p.waitForTimeout(350));
    const antes = await T.texto(f, a[1]);
    await resp(0);
    let e = await est();
    ok(e.resp === 0 && e.pts.every(x => x === 0), a[1] + ': Sim marca todos os itens como Atende');
    const comSim = await T.texto(f, a[1]);
    await ponto(0, 0);
    e = await est();
    ok(e.resp === -1 && e.pts[0] === -1 && e.pts.slice(1).every(x => x === 0), a[1] + ': item retirado → resposta pendente, os outros itens ficam');
    ok(comSim !== antes && await T.texto(f, a[1]) === antes, a[1] + ': o relatório deixa de afirmar a conformidade');
    await ponto(0, 1);
    ok((await est()).resp === 1, a[1] + ': item “Não atende” → resposta Não');
    await ponto(0, 1);
    e = await est();
    ok(e.resp === -1 && e.pts.slice(1).every(x => x === 0), a[1] + ': retirado o único “Não atende” → pendente');
    await ponto(0, 2);
    ok((await est()).resp === 0, a[1] + ': lista completa com Atende e N/A → Sim');
    await ponto(1, 0);
    /* reabrir: o estado pendente e os itens marcados continuam */
    const e1 = await est();
    await p.evaluate(a => window.__cascaAbrirRoteiro(...a), a); await p.waitForTimeout(4000);
    const g = p.frames().filter(x => x !== p.mainFrame()).pop();
    await g.evaluate(([s, i]) => UvisPadrao.vai({aba: 'roteiro', secao: s, item: i}), onde); await p.waitForTimeout(500);
    const e2 = await g.evaluate(() => { const q = document.querySelector('.pu-q .uvs-pontos').closest('.pu-q'); return {resp: [...q.querySelector('.pu-resp').querySelectorAll('button')].slice(0, 3).findIndex(x => x.getAttribute('aria-pressed') === 'true'), pts: [...q.querySelectorAll('.uvs-ponto')].map(d => [...d.querySelectorAll('button')].findIndex(x => x.getAttribute('aria-pressed') === 'true'))}; });
    ok(e1.resp === -1 && JSON.stringify(e1) === JSON.stringify(e2), a[1] + ': reabrir mantém a resposta pendente e os itens marcados');
    if (erros.length) T.falha(a[1] + ': erros de página — ' + erros.join(' | '));
    await p.close(); }
  await b.close();
  if (!process.exitCode) console.log('PASS: resposta e itens exigidos coerentes em todas as transições (motor comum e módulos de motor próprio).');
})().catch(e => { console.error(e); process.exit(1); });
