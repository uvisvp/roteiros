'use strict';
/* Diagnóstico por imagem — uma ou mais modalidades (12/11/2026, como em Alimentos e Odontologia): um
   roteiro e um relatório para o serviço com várias modalidades. As modalidades marcadas no perfil abrem
   a parte comum (uma vez) e a seção da IN de cada uma; sem modalidade, só a identificação. Nada do
   conteúdo dos seis roteiros por modalidade some: todas as perguntas e infrações estão no roteiro único,
   e os seis continuam no card. Uso: node scripts/e2e/imagem-servico.cjs */
const T = require('./lib.cjs');
const ok = (c, m) => { if (c) console.log('ok  ' + m); else T.falha(m); };
const SEIS = require('../../imagem/roteiro.cjs').slice(1);
const marca = (f, v, on) => f.evaluate(([v, on]) => { UvisPadrao.vai({aba: 'roteiro', secao: 'ident', item: 'perfil'}); const x = document.querySelector('[data-rs-check="p_mod"][value="' + v + '"]'); if (x.checked !== on) { x.checked = on; x.dispatchEvent(new Event('change', {bubbles: true})); } }, [v, on]);
const secoes = f => f.evaluate(() => UvisPadrao.lista().map(s => s.id));
/* perguntas na tela, item por item */
const perguntas = f => f.evaluate(() => { const ids = []; UvisPadrao.lista().forEach(s => s.itens.forEach(i => { UvisPadrao.vai({aba: 'roteiro', secao: s.id, item: i.id}); document.querySelectorAll('#pu-conteudo [data-rs-q]').forEach(q => ids.push(q.dataset.rsQ)); })); return ids; });
const doRoteiro = app => new Set(SEIS.find(D => D.app === app).secoes.flatMap(s => s.itens.flatMap(i => (i.perguntas || []).map(q => q.id))));

(async () => {
  const b = await T.navegador();
  const {p, f, erros} = await T.abre('Serviços', 'imagem-servico', 'Uma ou mais modalidades', '', {browser: b});
  ok(JSON.stringify(await secoes(f)) === '["ident"]', 'sem modalidade marcada, só a identificação');
  /* conteúdo íntegro: tudo dos seis está no único */
  const tem = await f.evaluate(() => ({q: ROTEIRO.secoes.flatMap(s => s.itens.flatMap(i => (i.perguntas || []).map(q => q.id))), inf: ROTEIRO.infracoes.map(i => i.id)}));
  const todasQ = new Set(SEIS.flatMap(D => [...doRoteiro(D.app)])), todasI = new Set(SEIS.flatMap(D => D.infracoes.map(i => i.id)));
  ok([...todasQ].every(x => tem.q.includes(x)) && tem.q.length === todasQ.size && [...todasI].every(x => tem.inf.includes(x)), 'conteúdo íntegro: ' + tem.q.length + ' perguntas e ' + tem.inf.length + ' infrações, as dos seis roteiros');
  /* radiologia convencional + ultrassonografia: as mesmas perguntas dos dois roteiros, a parte comum uma vez */
  await marca(f, 'conv', true); await marca(f, 'us', true); await p.waitForTimeout(400);
  const s = await secoes(f);
  ok(s.includes('protecao') && s.includes('mod_conv') && s.includes('mod_us') && !s.includes('mod_mamo') && !s.includes('mod_hemo'), 'convencional + ultrassom: proteção radiológica e as duas seções de IN (' + s.join(',') + ')');
  const q = await perguntas(f), esperado = new Set([...doRoteiro('imagem-convencional'), ...doRoteiro('imagem-ultrassom')]);
  ok(q.length === esperado.size && q.every(x => esperado.has(x)), 'perguntas = união dos dois roteiros, sem repetição (' + q.length + ')');
  /* infração com a IN da modalidade: só a IN marcada no fundamento */
  await f.evaluate(() => UvisPadrao.vai({aba: 'infracoes'})); await p.waitForTimeout(400);
  const inf = await f.evaluate(() => { const x = document.querySelector('input[data-rs-inf="im_equip_in"]'); return x ? x.closest('.rs-inf').textContent : ''; });
  ok(/90\/2021/.test(inf) && !/9[123]\/2021/.test(inf), 'infração da IN: só a IN 90/2021 da modalidade marcada');
  /* relatório: modalidades e a irregularidade da IN */
  const id = await f.evaluate(() => ROTEIRO.secoes.find(s => s.id === 'mod_conv').itens[0].perguntas[0].id);
  await f.evaluate(id => { UvisPadrao.vai({aba: 'roteiro', secao: 'mod_conv', item: 'esp_conv'}); const e = document.querySelector('[data-rs-q="' + id + '"]'); [...e.querySelectorAll('.pu-resp button')].find(b => /^(Não|Não atende)$/.test(b.textContent.trim())).click(); }, id); await p.waitForTimeout(300);
  const rel = await f.evaluate(() => { UvisPadrao.vai({aba: 'relatorio'}); return (document.querySelector('.rs-relatorio') || {}).innerText || ''; });
  ok(/Modalidades do serviço: Radiologia convencional, Ultrassonografia/.test(rel), 'relatório: modalidades do serviço');
  ok(/IN Anvisa nº 90\/2021/.test(rel.slice(rel.indexOf('IRREGULARIDADES'))), 'relatório: irregularidade com a IN 90/2021');
  /* só ultrassom: sai a radiação ionizante */
  await marca(f, 'conv', false); await p.waitForTimeout(400);
  const s2 = await secoes(f);
  ok(!s2.includes('protecao') && !s2.includes('mod_conv') && s2.includes('mod_us'), 'só ultrassom: sem proteção radiológica e sem a IN 90');
  const q2 = await perguntas(f);
  ok(q2.length === doRoteiro('imagem-ultrassom').size && q2.every(x => doRoteiro('imagem-ultrassom').has(x)), 'só ultrassom: as perguntas do roteiro de ultrassonografia (' + q2.length + ')');
  /* as seis: todas as perguntas */
  for (const m of ['conv', 'mamo', 'tc', 'rm', 'us', 'hemo']) await marca(f, m, true);
  await p.waitForTimeout(400);
  ok((await perguntas(f)).length === todasQ.size, 'as seis modalidades: todas as ' + todasQ.size + ' perguntas');
  if (erros.length) T.falha('erros de página: ' + erros.join(' | '));
  await p.close();
  /* o card abre direto o roteiro único; os seis por modalidade saíram do card, mas ainda abrem (inspeção salva) */
  { const q = await b.newPage({viewport: {width: 430, height: 900}}); q.on('dialog', d => d.accept());
    await q.goto(T.INDEX); await q.waitForTimeout(1200);
    await q.evaluate(() => document.querySelector('[data-nucleo="Serviços"]').click()); await q.waitForTimeout(400);
    await q.evaluate(() => [...document.querySelectorAll('#lista-corpo .rot-card')].find(x => /Diagnóstico por imagem/.test(x.textContent)).click()); await q.waitForTimeout(4500);
    const g = q.frames().find(x => x !== q.mainFrame());
    ok(!!g && await g.evaluate(() => window.ROTEIRO && ROTEIRO.app) === 'imagem-servico', 'card “Diagnóstico por imagem” abre direto o roteiro único');
    await q.close(); }
  const r = await T.abre('Serviços', 'imagem-convencional', 'Radiologia convencional', '', {browser: b});
  ok((await secoes(r.f)).includes('modalidade'), 'roteiro por modalidade fora do card ainda abre (inspeção salva)');
  await r.p.close();
  await b.close();
  if (!process.exitCode) console.log('PASS: Diagnóstico por imagem — um roteiro para uma ou mais modalidades, conteúdo íntegro.');
})().catch(e => { console.error(e); process.exit(1); });
