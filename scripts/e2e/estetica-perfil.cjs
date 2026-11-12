'use strict';
/* Estética pelo tipo de estabelecimento (12/11/2026, como em Alimentos): no interesse à saúde, as
   atividades (procedimentos estéticos, cabeleireiro ou barbeiro, manicure ou pedicure, depilação,
   maquiagem) — sem procedimentos estéticos, saem a formação do esteticista e a Lei 13.643/2018 (só do
   esteticista); a Lei 12.592/2012, art. 4º, vale para todas. O que o perfil põe em “Não se aplica”
   sai da tela (processamento terceirizado, sem medicamentos…); o já respondido fica. Nada do
   conteúdo some: 43 perguntas e toda pergunta aparece em algum perfil.
   Uso: node scripts/e2e/estetica-perfil.cjs */
const T = require('./lib.cjs');
const ok = (c, m) => { if (c) console.log('ok  ' + m); else T.falha(m); };
const sel = (f, id, v) => f.evaluate(([id, v]) => { UvisPadrao.vai({aba: 'roteiro', secao: 'ident', item: 'perfil'}); const s = document.querySelector('select[data-rs-meta="' + id + '"]'); s.value = v; s.dispatchEvent(new Event('change', {bubbles: true})); }, [id, v]);
const marca = (f, v, on) => f.evaluate(([v, on]) => { UvisPadrao.vai({aba: 'roteiro', secao: 'ident', item: 'perfil'}); const x = document.querySelector('[data-rs-check="p_ativ"][value="' + v + '"]'); if (x.checked !== on) { x.checked = on; x.dispatchEvent(new Event('change', {bubbles: true})); } }, [v, on]);
const itens = f => f.evaluate(() => UvisPadrao.lista().flatMap(s => s.itens.map(i => i.id)));
const cits = (f, sec, it, q) => f.evaluate(([sec, it, q]) => { UvisPadrao.vai({aba: 'roteiro', secao: sec, item: it}); const e = document.querySelector('[data-rs-q="' + q + '"]'); return e ? [...e.querySelectorAll('button.rs-cit')].map(b => b.textContent) : null; }, [sec, it, q]);
const rel = f => f.evaluate(() => { const e = UvisPadrao.estado(); UvisPadrao.vai({aba: 'relatorio'}); const t = (document.querySelector('.rs-relatorio') || {}).innerText || ''; UvisPadrao.vai(e); return t; });

(async () => {
  const b = await T.navegador();
  const {p, f, erros} = await T.abre('Serviços', 'estetica', 'Estética e beleza', '', {browser: b});
  /* conteúdo íntegro */
  const c = await f.evaluate(() => ({q: ROTEIRO.secoes.reduce((n, s) => n + s.itens.reduce((m, i) => m + (i.perguntas || []).length, 0), 0), inf: ROTEIRO.infracoes.length}));
  ok(c.q === 43 && c.inf === 107, 'conteúdo íntegro: ' + c.q + ' perguntas, ' + c.inf + ' infrações');
  /* serviço de saúde: processamento terceirizado tira o processamento no local; o já respondido fica */
  await sel(f, 'p_tipo', 'saude'); await p.waitForTimeout(400);
  await sel(f, 'p_proc', 'interno'); await p.waitForTimeout(300);
  await f.evaluate(() => { UvisPadrao.vai({aba: 'roteiro', secao: 'proc', item: 'interno'}); }); await p.waitForTimeout(300);
  await f.evaluate(() => { const q = document.querySelector('[data-rs-q="proc_limp"]'); [...q.querySelectorAll('.pu-resp button')].find(b => b.textContent.trim() === 'Sim').click(); }); await p.waitForTimeout(300);
  await sel(f, 'p_proc', 'externo'); await p.waitForTimeout(400);
  const vis = await f.evaluate(() => { UvisPadrao.vai({aba: 'roteiro', secao: 'proc', item: 'interno'}); return {q: [...document.querySelectorAll('#pu-conteudo [data-rs-q]')].map(x => x.dataset.rsQ), campos: !!document.querySelector('#pu-conteudo select[data-rs-meta="proc_ester"]')}; });
  ok(vis.q.includes('proc_limp') && !vis.q.includes('proc_class') && !vis.q.includes('proc_estrut') && !vis.campos, 'terceirizado: sai o processamento no local, fica a resposta já dada (' + vis.q.join(',') + ')');
  ok((await itens(f)).includes('externo'), 'terceirizado: processamento externo no roteiro');
  await sel(f, 'p_med', 'nao'); await sel(f, 'p_terc', 'nao'); await p.waitForTimeout(400);
  let it = await itens(f);
  ok(!it.includes('medicamentos') && !it.includes('terceirizados'), 'sem medicamentos e sem terceirizados: os itens saem da navegação');
  await sel(f, 'p_med', 'sim'); await p.waitForTimeout(400);
  ok((await itens(f)).includes('medicamentos'), 'mudar o perfil devolve o item');
  /* interesse à saúde: salão (cabeleireiro e manicure) */
  await sel(f, 'p_tipo', 'interesse'); await p.waitForTimeout(400);
  ok((await itens(f)).includes('rh'), 'atividades sem resposta: a formação do esteticista continua');
  await f.evaluate(() => UvisPadrao.vai({aba: 'infracoes'})); await p.waitForTimeout(400);
  let av = await f.evaluate(() => ({aviso: (document.querySelector('.rs-aviso-inf') || {}).textContent || '', cap: document.querySelector('input[data-rs-inf="i21"]').closest('.rs-inf').textContent}));
  ok(/Atividades do estabelecimento sem resposta/.test(av.aviso) && /art\. 4º da Lei Federal nº 12\.592\/2012 e, para esteticista e técnico em estética, art\. 8º da Lei Federal nº 13\.643\/2018/.test(av.cap), 'atividades sem resposta: aviso na aba Infrações e capitulação com as duas leis');
  await marca(f, 'cabelo', true); await marca(f, 'unhas', true); await p.waitForTimeout(400);
  it = await itens(f);
  ok(!it.includes('rh'), 'salão sem procedimentos estéticos: sai a formação do esteticista');
  const ci = await cits(f, 'bio', 'epi', 'epi_i');
  ok(ci && ci.some(x => /12\.592/.test(x)) && !ci.some(x => /13\.643/.test(x)), 'salão: citação pela Lei 12.592, sem a Lei 13.643 (' + (ci || []).join(' | ') + ')');
  await f.evaluate(() => UvisPadrao.vai({aba: 'infracoes'})); await p.waitForTimeout(400);
  const inf = await f.evaluate(() => [...document.querySelectorAll('input[data-rs-inf]')].map(x => x.dataset.rsInf));
  ok(inf.length === 32 && !inf.includes('i03') && inf.includes('i31'), 'salão: 32 enquadramentos, sem os da formação do esteticista');
  av = await f.evaluate(() => ({aviso: !!document.querySelector('.rs-aviso-inf'), cap: document.querySelector('input[data-rs-inf="i21"]').closest('.rs-inf').textContent}));
  ok(!av.aviso && /c\/c art\. 4º da Lei Federal nº 12\.592\/2012$/.test(av.cap.trim()) && !/13\.643/.test(av.cap), 'salão: capitulação só com a Lei 12.592, art. 4º, e sem o aviso');
  await f.evaluate(() => { UvisPadrao.vai({aba: 'roteiro', secao: 'bio', item: 'epi'}); const q = document.querySelector('[data-rs-q="epi_i"]'); [...q.querySelectorAll('.pu-resp button')].find(b => b.textContent.trim() === 'Não').click(); }); await p.waitForTimeout(300);
  let r = await rel(f);
  ok(/Atividades do estabelecimento: Cabeleireiro ou barbeiro, Manicure ou pedicure/.test(r), 'relatório: atividades do estabelecimento');
  ok(/Fundamento: Lei Federal nº 12\.592\/2012, art\. 4º; Lei Municipal nº 13\.725\/2004, art\. 69\./.test(r) && !/13\.643/.test(r), 'relatório do salão: fundamento pela Lei 12.592 e art. 69, sem a Lei 13.643');
  /* com procedimentos estéticos: volta tudo */
  await marca(f, 'estetica', true); await p.waitForTimeout(400);
  ok((await itens(f)).includes('rh'), 'com procedimentos estéticos: a formação do esteticista volta');
  r = await rel(f);
  ok(/Fundamento: Lei Federal nº 12\.592\/2012, art\. 4º; Lei Federal nº 13\.643\/2018, art\. 8º; Lei Municipal nº 13\.725\/2004, art\. 69\./.test(r), 'com procedimentos estéticos: Leis 12.592 e 13.643');
  /* toda pergunta aparece em algum perfil (condições do roteiro avaliadas aqui, como no motor) */
  const D = require('../../estetica/roteiro.cjs');
  const cond = (c, m) => { if (!c) return true; if (c.todos) return c.todos.every(x => cond(x, m)); if (c.algum) return c.algum.some(x => cond(x, m)); if (c.nao) return !cond(c.nao, m); const v = m[c.campo];
    if (c.vazio) return Array.isArray(v) ? !v.length : (v == null || v === ''); if (c.inclui) return Array.isArray(v) && v.includes(c.inclui); if (c.em) return c.em.includes(v); if (c.igual !== undefined) return v === c.igual; return true; };
  const vistas = new Set();
  for (const tipo of ['saude', 'interesse']) for (const ativ of [[], ['estetica'], ['cabelo']]) for (const proc of ['', 'interno', 'externo']) {
    const m = {p_tipo: tipo, p_ativ: ativ, p_proc: proc, p_equip: 'sim', p_med: 'sim', p_manip: 'sim', p_344: 'sim', p_terc: 'sim', proc_ester: 'vacuo', proc_desinf: 'quimica'};
    for (const s of D.secoes) for (const i of s.itens) if (cond(i.se, m)) for (const q of i.perguntas || []) if (cond(q.se, m) && !(q.naSe && cond(q.naSe, m))) vistas.add(q.id);
  }
  const faltam = D.secoes.flatMap(s => s.itens.flatMap(i => (i.perguntas || []).map(q => q.id))).filter(x => !vistas.has(x));
  ok(!faltam.length, 'toda pergunta aparece em algum perfil' + (faltam.length ? ' — faltam ' + faltam.join(',') : ''));
  if (erros.length) T.falha('erros de página: ' + erros.join(' | '));
  await b.close();
  if (!process.exitCode) console.log('PASS: Estética — atividades do estabelecimento, citação por atividade e roteiro pelo perfil.');
})().catch(e => { console.error(e); process.exit(1); });
