'use strict';
/* Odontologia (12/11/2026, como em Alimentos): perfil pelo tipo de estabelecimento — atalhos, salas
   (mais de uma tipologia), organização, processamento e características em listas recolhíveis — e
   roteiro filtrado; resposta dada fica na tela com aviso quando sai do perfil; estado antigo (só a
   tipologia) convertido; relatório com todas as salas. Nada do conteúdo some: 163 verificações, 51
   enquadramentos e 156 dispositivos, e toda verificação aparece em algum perfil.
   Uso: node scripts/e2e/odontologia-perfil.cjs */
const T = require('./lib.cjs');
const APP = ['Odontologia', 'odontologia', 'Odontologia', ''];
const CH = 'odonto-rdc1002-v1';
const ok = (c, m) => { if (c) console.log('ok  ' + m); else T.falha(m); };
const nav = f => f.evaluate(() => { const o = {}; UvisPadrao.lista().forEach(s => s.itens.forEach(i => { o[i.id] = i.total; })); return o; });
const atalho = async (f, p, a) => { await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'perfil', item: 'tipo'})); await p.waitForTimeout(300); await f.evaluate(a => document.querySelector('[data-odo-atalho="' + a + '"]').click(), a); await p.waitForTimeout(300); };

(async () => {
  const b = await T.navegador();
  { const {p, f, erros} = await T.abre(...APP, {browser: b, viewport: {width: 820, height: 1180}});
    ok(await f.evaluate(() => UvisPadrao.estado().item === 'tipo'), 'sem perfil, a inspeção abre no tipo de estabelecimento');
    const c = await f.evaluate(() => ({it: DATA.route.reduce((n, s) => n + s.items.length, 0), inf: DATA.infractions.length, leg: DATA.legal.length}));
    ok(c.it === 163 && c.inf === 51 && c.leg === 156, 'conteúdo íntegro: ' + c.it + ' verificações, ' + c.inf + ' enquadramentos, ' + c.leg + ' dispositivos');
    /* consultório isolado: sem centro cirúrgico, emergência e radiologia */
    await atalho(f, p, 'isolado');
    let n = await nav(f), q = await f.evaluate(() => counts().it.length);
    ok(!n.cco && !n.emer && !n.rx && n.fin && q < 163, 'consultório isolado: sem centro cirúrgico, emergência e radiologia (' + q + ' verificações)');
    /* centro cirúrgico */
    await atalho(f, p, 'cco');
    n = await nav(f);
    ok(n.cco && n.emer && n.rx, 'clínica com centro cirúrgico: centro cirúrgico, emergência e radiologia');
    ok(await f.evaluate(() => { const s = state.salas; return s.includes('classe1') && s.includes('cco') && state.p.tip === 'cco' && state.p.flags.p344; }), 'atalho marca as salas, a tipologia principal e as características');
    /* responder no centro cirúrgico e voltar ao consultório isolado: a resposta fica, com aviso */
    const id = await f.evaluate(() => DATA.route.find(s => s.id === 'cco').items[0].id);
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'assist', item: 'cco'})); await p.waitForTimeout(300);
    await f.evaluate(id => document.querySelector('[data-a="' + id + '"][data-v="nao"]').click(), id); await p.waitForTimeout(300);
    await atalho(f, p, 'isolado');
    ok(!(await f.evaluate(() => state.p.flags.p344)), 'trocar de atalho troca as características que o atalho marca');
    n = await nav(f);
    ok(n.cco === 1, 'fora do perfil: só a verificação já respondida continua (' + n.cco + ')');
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'assist', item: 'cco'})); await p.waitForTimeout(300);
    ok(await f.evaluate(() => /Fora do perfil atual/.test(document.getElementById('pu-conteudo').textContent)), 'a resposta fora do perfil vem com aviso');
    /* todas as verificações aparecem em algum perfil */
    const cob = await f.evaluate(() => { const vis = new Set(), salvo = JSON.stringify({p: state.p, salas: state.salas});
      state.salas = ['amb', 'classe1', 'classe1_sed', 'classe2', 'coletivo', 'imagem', 'cco'];
      const fl = {}; DATA.profile.find(g => g.id === 'flags').opts.forEach(([v]) => fl[v] = true); state.p.flags = fl;
      for (const o of DATA.profile.find(g => g.id === 'org').opts) for (const pr of DATA.profile.find(g => g.id === 'proc').opts) { state.p.org = o[0]; state.p.proc = pr[0]; allItems().forEach(i => vis.add(i.id)); }
      const s = JSON.parse(salvo); state.p = s.p; state.salas = s.salas;
      return DATA.route.flatMap(x => x.items.map(i => i.id)).filter(x => !vis.has(x)); });
    ok(!cob.length, 'toda verificação aparece em algum perfil' + (cob.length ? ' — faltam ' + cob.join(',') : ''));
    /* duas salas no relatório */
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'perfil', item: 'tipo'})); await p.waitForTimeout(300);
    await f.evaluate(() => { const x = document.querySelector('[data-odo-sala="imagem"]'); x.checked = true; x.dispatchEvent(new Event('change', {bubbles: true})); }); await p.waitForTimeout(300);
    ok((await nav(f)).rx, 'marcar a sala de imagem traz a radiologia');
    const rel = await f.evaluate(() => blocks().filter(b => b.t === 'kv' && b.k === 'Tipologia').map(b => b.v).join(''));
    ok(/Consultório individual Classe I; Sala de imagem odontológica/.test(rel), 'relatório: tipologia com as duas salas (' + rel + ')');
    if (erros.length) T.falha('erros de página: ' + erros.join(' | '));
    await p.close(); }
  /* estado antigo: só a tipologia única */
  { const {p, f} = await T.abre(...APP, {browser: b});
    await f.evaluate(k => { const s = JSON.parse(localStorage.getItem(k) || '{}'); s.p = {tip: 'classe2', org: 'clinica3', proc: 'salaunica', flags: {}}; delete s.salas; delete s.salasMarcadas; s.a = {lic1: 'ok'}; localStorage.setItem(k, JSON.stringify(s)); }, CH);
    await p.evaluate(a => window.__cascaAbrirRoteiro(...a), APP); await p.waitForTimeout(3500);
    const g = p.frames().filter(x => x !== p.mainFrame()).pop();
    const r = await g.evaluate(() => ({salas: state.salas, emer: UvisPadrao.lista().some(s => s.itens.some(i => i.id === 'emer')), a: state.a.lic1}));
    ok(r.salas.join() === 'classe2' && r.emer && r.a === 'ok', 'estado antigo: a tipologia vira sala, roteiro e respostas preservados');
    await p.close(); }
  await b.close();
  if (!process.exitCode) console.log('PASS: Odontologia — perfil pelo tipo de estabelecimento, roteiro filtrado, conteúdo íntegro.');
})().catch(e => { console.error(e); process.exit(1); });
