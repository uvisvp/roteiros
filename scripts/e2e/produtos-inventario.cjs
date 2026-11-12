'use strict';
/* Produtos (12/11/2026): inventário por requisito, ligado às perguntas. Toda verificação
   aponta as infrações que o seu descumprimento configura; a resposta “Não” as sugere na
   própria pergunta (para marcar ali) e no topo da aba Infrações; voltar a “Sim” tira a
   sugestão sem desmarcar o que a equipe marcou. Perguntas novas do atacadista e do
   transportador e inventário de cada trilha. Uso: node scripts/e2e/produtos-inventario.cjs */
const T = require('./lib.cjs');
const ok = (c, m) => { if (c) console.log('ok  ' + m); else T.falha(m); };
const resp = (f, id, v) => f.evaluate(([id, v]) => document.querySelector(`[data-answer="${id}"][data-value="${v}"]`).click(), [id, v]);
const legalInf = (f, id) => f.evaluate((id) => { const l = document.querySelector('#panel-infracoes input[data-infraction="' + id + '"]')?.closest('label'); const b = l && l.querySelector('button.uvis-cite'); return b ? (b.getAttribute('data-uvis-citation') || '') + ' ¦ ' + b.textContent : ''; }, id);
const nInf = (f) => f.evaluate(() => document.querySelectorAll('#panel-infracoes input[data-infraction]').length);

(async () => {
  const b = await T.navegador();
  /* atacadista */
  { const {p, f, erros} = await T.abre('Produtos', 'produtos-correlatos', 'Atacadista / distribuidor', 'atividade=atacadista', {browser: b});
    await p.waitForTimeout(800);
    const c = await f.evaluate(() => { const c = ROTEIRO_CONFIG, ids = new Set(c.infractions.map((i) => i.id)), it = c.sections.flatMap((s) => s.items);
      return {sem: it.filter((i) => !(i.inf || []).length).map((i) => i.id), orf: it.flatMap((i) => (i.inf || []).filter((x) => !ids.has(x))), n: c.infractions.length}; });
    ok(!c.sem.length, 'toda verificação aponta ao menos uma infração' + (c.sem.length ? ': faltam ' + c.sem.join(',') : ''));
    ok(!c.orf.length, 'as ligações apontam infrações existentes' + (c.orf.length ? ': ' + c.orf.join(',') : ''));
    ok(c.n >= 140, 'inventário com ' + c.n + ' infrações');
    /* perguntas novas do atacadista */
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'oper', item: 'd_arm'})); await p.waitForTimeout(400);
    const novas = await f.evaluate(() => ['ds14', 'ds13', 'ds12', 'ds11', 'ds8', 'ds15'].filter((id) => !document.getElementById('item-' + id)));
    ok(!novas.length, 'armazenamento: pisos, estrados, pragas, saneantes/perigosos, venda profissional e fracionamento' + (novas.length ? ' — faltam ' + novas.join(',') : ''));
    /* “Não” na validade: sugestão na pergunta */
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'regular', item: 'reg'})); await p.waitForTimeout(400);
    ok(await f.evaluate(() => !document.querySelector('.prod-inf-sug')), 'sem resposta “Não”, nenhuma infração sugerida');
    await resp(f, 'r4', 'no'); await p.waitForTimeout(400);
    const sug = await f.evaluate(() => [...document.querySelectorAll('#item-r4 .prod-inf-sug input[data-infraction]')].map((x) => x.dataset.infraction));
    ok(sug.join() === 'p12,p13', '“Não” na validade sugere, na pergunta, vencido e embalagem danificada (' + sug.join() + ')');
    await f.evaluate(() => document.querySelector('#item-r4 .prod-inf-sug input[data-infraction="p12"]').click()); await p.waitForTimeout(400);
    const marc = await f.evaluate(() => ({cb: document.querySelector('#item-r4 .prod-inf-sug input[data-infraction="p12"]')?.checked, nao: document.querySelector('[data-answer="r4"][data-value="no"]').getAttribute('aria-pressed'),
      st: (JSON.parse(localStorage.getItem(ROTEIRO_CONFIG.storageKey) || '{}').selectedInfractions || {}).p12}));
    ok(marc.cb && marc.st && marc.nao === 'true', 'marcada na pergunta: gravada, e a resposta continua “Não”');
    /* aba Infrações: sugeridas no topo */
    await f.evaluate(() => UvisPadrao.vai({aba: 'infracoes'})); await p.waitForTimeout(500);
    const topo = await f.evaluate(() => { const d = document.querySelector('#panel-infracoes details.uvis-inventory'); return d ? {sug: d.classList.contains('prod-sugeridas'), open: d.open, ids: [...d.querySelectorAll('input[data-infraction]')].map((x) => x.dataset.infraction + (x.checked ? '*' : '')), txt: d.textContent} : null; });
    ok(topo && topo.sug && topo.open && topo.ids.join() === 'p12*,p13', 'aba Infrações: sugeridas abertas no topo, a marcada continua marcada (' + (topo && topo.ids.join()) + ')');
    ok(topo && /Resposta “Não”: Produtos dentro do prazo de validade/.test(topo.txt), 'a sugestão mostra a pergunta de origem');
    ok(await f.evaluate(() => /sugerida pela|sugeridas pelas/.test(document.querySelector('#panel-infracoes .report-note').textContent)), 'contagem das sugeridas no painel');
    const nDist = await nInf(f);
    const l32 = await legalInf(f, 'p32');
    ok(/16\/2014/.test(l32) && !/48\/2013/.test(l32), 'atacadista: a infração do piso cita só a RDC 16/2014, sem a BPF do fabricante (' + l32.split(' ¦ ')[0] + ')');
    ok(!/,\s*;|, *$/.test(l32.split(' ¦ ')[1] || ''), 'botão da citação sem “Art. 46, ;” (' + (l32.split(' ¦ ')[1] || '') + ')');
    ok(nDist >= 60, 'atacadista: ' + nDist + ' enquadramentos disponíveis');
    /* volta a “Sim”: a sugestão sai, a marcação fica */
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'regular', item: 'reg'})); await p.waitForTimeout(400);
    await resp(f, 'r4', 'yes'); await p.waitForTimeout(400);
    ok(await f.evaluate(() => !document.querySelector('#item-r4 .prod-inf-sug')), '“Sim”: a sugestão sai da pergunta');
    await f.evaluate(() => UvisPadrao.vai({aba: 'infracoes'})); await p.waitForTimeout(500);
    ok(await f.evaluate(() => !document.querySelector('#panel-infracoes details.prod-sugeridas') && document.querySelector('#panel-infracoes input[data-infraction="p12"]').checked), '“Sim”: sem bloco de sugeridas; a infração marcada pela equipe continua marcada');
    await f.evaluate(() => UvisPadrao.vai({aba: 'relatorio'})); await p.waitForTimeout(600);
    const rel = await f.evaluate(() => (document.querySelector('.uvs-rel-previa') || document.body).innerText);
    ok(/ENQUADRAMENTO[\s\S]*prazo de validade expirado[\s\S]*13\.725/.test(rel), 'relatório: enquadramento da infração marcada, com a Lei 13.725');
    if (erros.length) T.falha('atacadista: erros de página: ' + erros.join(' / '));
    await p.close(); }
  /* fabricante: inventário da BPF de cosméticos */
  { const {p, f, erros} = await T.abre('Produtos', 'produtos-correlatos', 'Fabricante de cosméticos', 'atividade=fab_cosm', {browser: b});
    await p.waitForTimeout(800);
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'fabr', item: 'f_arm'})); await p.waitForTimeout(400);
    await resp(f, 'fm7', 'no'); await p.waitForTimeout(400);
    const s = await f.evaluate(() => [...document.querySelectorAll('#item-fm7 .prod-inf-sug input[data-infraction]')].map((x) => x.dataset.infraction));
    ok(s.join() === 'p110', 'fabricante: “Não” em inflamáveis sugere a infração própria (' + s.join() + ')');
    await f.evaluate(() => UvisPadrao.vai({aba: 'infracoes'})); await p.waitForTimeout(500);
    const n = await nInf(f);
    ok(n >= 90, 'fabricante: ' + n + ' enquadramentos disponíveis');
    const l32 = await legalInf(f, 'p32');
    ok(/48\/2013/.test(l32) && !/16\/2014/.test(l32), 'fabricante: a infração do piso cita a RDC 48/2013 (' + l32.split(' ¦ ')[0] + ')');
    if (erros.length) T.falha('fabricante: erros de página: ' + erros.join(' / '));
    await p.close(); }
  /* transportador: perguntas novas e inventário próprio */
  { const {p, f, erros} = await T.abre('Produtos', 'produtos-correlatos', 'Transportador', 'atividade=transportadora', {browser: b});
    await p.waitForTimeout(800);
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'transp', item: 't_veic'})); await p.waitForTimeout(400);
    ok(await f.evaluate(() => ['tv13', 'tv12'].every((id) => document.getElementById('item-' + id))), 'transportador: estiva da carga e carga/descarga protegidas');
    await resp(f, 'tv1', 'no'); await p.waitForTimeout(400);
    const s = await f.evaluate(() => [...document.querySelectorAll('#item-tv1 .prod-inf-sug input[data-infraction]')].map((x) => x.dataset.infraction));
    ok(s.join() === 'p138', 'transportador: “Não” na relação de veículos sugere a infração própria (' + s.join() + ')');
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'transp', item: 't_rast'})); await p.waitForTimeout(400);
    ok(await f.evaluate(() => !!document.getElementById('item-tr8')), 'transportador: regularidade de remetentes e destinatários');
    await f.evaluate(() => UvisPadrao.vai({aba: 'infracoes'})); await p.waitForTimeout(500);
    const ids = await f.evaluate(() => [...document.querySelectorAll('#panel-infracoes input[data-infraction]')].map((x) => x.dataset.infraction));
    ok(['p53', 'p138', 'p142', 'p139', 'p140', 'p64', 'p66'].every((x) => ids.includes(x)) && !ids.includes('p110') && !ids.includes('p68'), 'transportador: ' + ids.length + ' enquadramentos, sem os de fabricante e de dispositivos');
    if (erros.length) T.falha('transportador: erros de página: ' + erros.join(' / '));
    await p.close(); }
  await b.close();
  if (!process.exitCode) console.log('PASS: Produtos — inventário por requisito ligado às perguntas, sugestão pela resposta “Não”, perguntas novas e relatório.');
})().catch((e) => { console.error(e); process.exit(1); });
