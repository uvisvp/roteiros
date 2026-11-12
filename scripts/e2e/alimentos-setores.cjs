'use strict';
/* Inspeção de alimentos por setor (11/11/2026): atalhos, módulos por setor, filtragem real,
   resposta mantida quando o perfil muda, licenciamento (Portaria SMS nº 266/2025), conversão do
   estado antigo (tipos → setores), relatório com o setor e a tela parada ao responder.
   Uso: node scripts/e2e/alimentos-setores.cjs */
const T = require('./lib.cjs');
const APP = ['Alimentos', 'servicos-alimentacao-roteiro', 'Inspeção do estabelecimento', ''];
const CH = 'uvis-alimentos-estab-v1';
let falhas = 0;
const ok = (c, m) => { console.log((c ? 'ok  ' : 'FALHA: ') + m); if (!c) falhas++; };
const nav = f => f.evaluate(() => { const o = {}; UvisPadrao.lista().forEach(s => s.itens.forEach(i => { o[i.id] = i.total; })); return o; });
const vai = (f, secao, item) => f.evaluate(([s, i]) => UvisPadrao.vai({aba: 'roteiro', secao: s, item: i}), [secao, item]);
const ids = f => f.evaluate(() => [...document.querySelectorAll('#pu-conteudo [data-sa-q]')].map(x => x.dataset.saQ));

(async () => {
  const b = await T.navegador();
  { const {p, f, erros} = await T.abre(...APP, {browser: b, viewport: {width: 820, height: 1180}});
    let n = await nav(f);
    ok(!n['m-acougue'] && !n.preparation, 'sem setor: módulos e preparo fora do roteiro');
    await vai(f, 'docs', 'opening'); await p.waitForTimeout(300);
    let q = await ids(f);
    ok(!q.some(x => /^a[3-6]$/.test(x)), 'documentos (Manual, POPs, RT) fora das perguntas: ' + q.join(','));
    ok(q.includes('a1') && !q.includes('a8'), 'sem regime informado: pergunta da licença (a1)');
    /* regime MEI: a1 sai, a8 entra */
    await vai(f, 'perfil', 'ident'); await p.waitForTimeout(300);
    await f.evaluate(() => { const s = document.querySelector('select[data-sa-meta=regime]'); s.value = [...s.options].find(o => /^MEI/.test(o.textContent)).textContent; s.dispatchEvent(new Event('input', {bubbles: true})); s.dispatchEvent(new Event('change', {bubbles: true})); });
    await vai(f, 'docs', 'opening'); await p.waitForTimeout(300); q = await ids(f);
    ok(q.includes('a8') && !q.includes('a1'), 'MEI: pergunta da dispensa (a8) no lugar da licença');
    /* CNAE da licença sugere setores */
    await vai(f, 'perfil', 'ident'); await p.waitForTimeout(300);
    await f.evaluate(() => { const i = document.querySelector('input[data-sa-meta=cnaeLic]'); i.value = '4722-9/01; 5611-2/01'; i.dispatchEvent(new Event('input', {bubbles: true})); });
    /* atalho Supermercado */
    await vai(f, 'perfil', 'tipo'); await p.waitForTimeout(300);
    ok(await f.evaluate(() => !!document.querySelector('[data-sa-sugere=acougue]') && !!document.querySelector('[data-sa-sugere=cozinha]')), 'CNAE da licença sugere açougue e cozinha');
    await f.evaluate(() => [...document.querySelectorAll('[data-sa-preset]')].find(x => /Supermercado/.test(x.textContent)).click()); await p.waitForTimeout(300);
    n = await nav(f);
    ok(['m-acougue', 'm-padaria', 'm-frios', 'm-hortifruti', 'm-rotisseria', 'm-bebidas'].every(k => n[k]), 'supermercado: módulos de açougue, padaria, frios, hortifrúti, rotisseria e bebidas');
    ok(!n['m-peixaria'] && !n['m-selfservice'] && !n.transport, 'supermercado: sem peixaria, self-service e transporte');
    const st = await f.evaluate(k => JSON.parse(localStorage.getItem(k)), CH);
    ok(st.flags.rawPrep && st.flags.hotCold && st.flagsAuto.rawPrep, 'processos marcados pelos setores (cru, cadeia fria)');
    ok(await f.evaluate(() => document.querySelectorAll('details.sa-grupo').length === 4), 'setores em 4 listas recolhíveis');
    /* responder no açougue: tela parada */
    await vai(f, 'setores', 'm-acougue'); await p.waitForTimeout(400);
    await f.evaluate(() => document.querySelector('[data-sa-q=ac4]').scrollIntoView({block: 'center'})); await p.waitForTimeout(200);
    const bx = await f.evaluate(() => { const r = document.querySelector('[data-sa-resp=ac4][data-v=nao]').getBoundingClientRect(); return {x: r.x + r.width / 2, y: r.y + r.height / 2}; });
    await p.mouse.click(bx.x, bx.y); await p.waitForTimeout(400);
    const y2 = await f.evaluate(() => document.querySelector('[data-sa-resp=ac4][data-v=nao]').getBoundingClientRect().y + document.querySelector('[data-sa-resp=ac4][data-v=nao]').getBoundingClientRect().height / 2);
    ok(Math.abs(y2 - bx.y) < 4, 'responder não desloca a tela (' + Math.round(y2 - bx.y) + ' px)');
    /* tirar o açougue: a resposta fica, com aviso */
    await vai(f, 'perfil', 'tipo'); await p.waitForTimeout(300);
    await f.evaluate(() => document.querySelector('[data-sa-tipo=acougue]').click()); await p.waitForTimeout(300);
    n = await nav(f);
    ok(n['m-acougue'] === 1, 'sem açougue: só a verificação já respondida continua (' + n['m-acougue'] + ')');
    await vai(f, 'setores', 'm-acougue'); await p.waitForTimeout(300);
    ok(await f.evaluate(() => /Fora do perfil atual/.test(document.getElementById('pu-conteudo').textContent)), 'resposta fora do perfil atual vem com aviso');
    /* relatório */
    await f.evaluate(() => UvisPadrao.vai({aba: 'relatorio'})); await p.waitForTimeout(800);
    const rel = await f.evaluate(() => [...document.querySelectorAll('textarea')].map(x => x.value).find(v => /RELAT/i.test(v)) || '');
    ok(/^Setores: Mercearia/m.test(rel), 'relatório: linha dos setores');
    ok(/Licenciamento sanitário: MEI/.test(rel), 'relatório: licenciamento');
    ok(/^1\. Açougue: .*carne moída.*Lei Municipal nº 13\.725\/2004, art\./m.test(rel), 'relatório: irregularidade com o setor e a Lei 13.725');
    ok(!/peixaria/i.test(rel), 'relatório: nada de setor não marcado');
    ok(!erros.length, 'sem erros de página ' + JSON.stringify(erros.slice(0, 2)));
    await p.close(); }
  /* estado antigo: tipos restaurant + butcher viram setores */
  { const {p, f} = await T.abre(...APP, {browser: b});
    await f.evaluate(k => { localStorage.setItem(k, JSON.stringify({v: 1, tipo: 'restaurant', tipos: ['restaurant', 'butcher'], valores: {operation: ['full']}, flags: {rawPrep: true}, meta: {establishment: 'Teste'}, resp: {f1: 'ok'}, notas: {}, inf: {}})); }, CH);
    await p.evaluate(a => window.__cascaAbrirRoteiro(...a), APP); await p.waitForTimeout(4000);
    const g = p.frames().filter(x => x !== p.mainFrame()).pop();
    const n = await g.evaluate(() => { const o = {}; UvisPadrao.lista().forEach(s => s.itens.forEach(i => { o[i.id] = i.total; })); return o; });
    const st = await g.evaluate(k => JSON.parse(localStorage.getItem(k) || '{}'), CH);
    ok(n['m-acougue'] && n['m-salao'] && n.preparation, 'estado antigo: restaurante + açougue abrem cozinha, salão e açougue');
    ok(st.resp && st.resp.f1 === 'ok', 'estado antigo: respostas preservadas');
    await p.close(); }
  await b.close();
  console.log(falhas ? falhas + ' falha(s)' : 'PASS: setores, módulos, filtragem, licenciamento, conversão do estado antigo e relatório.');
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
