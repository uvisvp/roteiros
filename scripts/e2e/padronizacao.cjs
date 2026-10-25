'use strict';
/* Padronização da navegação (scripts/repack-padronizacao.cjs, campo/campo.js e
   campo/apagar-padrao.js): botão Campo e cartão “Apagar dados” nos módulos de navegação
   padrão, rótulos no cabeçalho, progresso nas seções da Drogaria e da Manipulação,
   faixa e barra inferior do Atacadista e cor da resposta marcada. */
const T = require('./lib.cjs');
const VERDE = 'rgb(19, 118, 79)';
const ok = (c, m) => c ? console.log('ok  ' + m) : T.falha(m);
(async () => {
  const b = await T.navegador();
  const vp = {width: 820, height: 1180};
  for (const [n, a, t] of [['Serviços', 'odontologia', 'Odontologia'], ['Produtos', 'produtos-correlatos', 'Produtos'], ['Alimentos', 'servicos-alimentacao-roteiro', 'Serviços de alimentação']]) {
    const {p, f, erros} = await T.abre(n, a, t, '', {browser: b, viewport: vp});
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: null, item: null})); await p.waitForTimeout(500);
    const r = await f.evaluate(() => {
      const c = document.getElementById('cmp-fab'), fo = document.getElementById('uvs-fotos');
      const vis = e => !!e && getComputedStyle(e).display !== 'none';
      return {campo: !!c && c.parentElement === (fo && fo.parentElement), rotulo: vis(c && c.querySelector('span')) && vis(fo && fo.querySelector('span')),
        apagar: !!document.querySelector('.pu-secoes-grade [data-pu-apagar]')};
    });
    ok(r.campo, a + ': botão Campo no cabeçalho, ao lado de Fotos');
    ok(r.rotulo, a + ': Campo e Fotos com rótulo no tablet');
    ok(r.apagar, a + ': cartão “Apagar dados” na tela das seções');
    if (a === 'produtos-correlatos') {
      const resumo = await f.evaluate(async () => {
        const L = UvisPadrao.lista(); let feito = false;
        for (const s of L) { for (const it of s.itens) { if (!it.total) continue; UvisPadrao.vai({aba: 'roteiro', secao: s.id, item: it.id}); await new Promise(r => setTimeout(r, 400));
          const bt = [...document.querySelectorAll('.pu-resp button')].find(x => x.textContent.trim() === 'Cumpre'); if (bt) { bt.click(); feito = true; break; } } if (feito) break; }
        await new Promise(r => setTimeout(r, 400)); MedCampo.abre('resumo'); await new Promise(r => setTimeout(r, 600));
        const t = (document.getElementById('cmp-painel') || {}).innerText || ''; return {cor: getComputedStyle([...document.querySelectorAll('.pu-resp button[aria-pressed=true]')][0] || document.body).backgroundColor, t};
      });
      ok(/\b1\s*respondidas/.test(resumo.t.replace(/\n/g, ' ')), 'produtos: resumo do Campo conta a resposta (' + resumo.t.slice(0, 80).replace(/\n/g, ' ') + ')');
      ok(resumo.cor === VERDE, 'produtos: Cumpre marcado em verde');
      /* Apagar dados: mesma limpeza das Salvas; o roteiro reabre em branco */
      const soma = fr => fr.evaluate(() => UvisPadrao.lista().reduce((a, s) => a + s.itens.reduce((x, i) => x + (i.feitos || 0), 0), 0));
      await f.evaluate(() => { const pn = document.getElementById('cmp-painel'); if (pn) pn.remove(); UvisPadrao.vai({aba: 'roteiro', secao: null, item: null}); }); await p.waitForTimeout(400);
      await f.evaluate(() => document.querySelector('[data-pu-apagar]').click()); await p.waitForTimeout(5000);
      ok(await soma(p.frames().find(x => x !== p.mainFrame())) === 0, 'produtos: “Apagar dados” apaga as respostas e reabre o roteiro');
    }
    if (erros.length) T.falha(a + ': erros ' + erros.join(' | '));
    await p.close();
  }
  /* motor: rótulo no tablet, só ícone no celular */
  for (const [w, quer] of [[820, true], [400, false]]) {
    const {p, f} = await T.abre('Serviços', 'vacinacao', 'Vacinação', '', {browser: b, viewport: {width: w, height: 900}});
    const v = await f.evaluate(() => ['cmp-fab', 'uvs-fotos', 'uvs-botao'].every(id => { const s = document.querySelector('#' + id + ' span'); return s && getComputedStyle(s).display !== 'none'; }));
    ok(v === quer, 'vacinação ' + w + ' px: ' + (quer ? 'rótulos visíveis' : 'só ícones'));
    await p.close();
  }
  /* Drogaria e Manipulação: progresso nas seções */
  for (const [a, t, sel] of [['drogaria', 'Drogaria', '.ui-card-grid [data-card] .pu-prog'], ['farmacia-manipulacao', 'Farmácia com Manipulação', '#cardGrid [data-open-card] .pu-prog']]) {
    const {p, f} = await T.abre('Medicamentos', a, t, '', {browser: b, viewport: vp});
    const r = await f.evaluate(s => [...document.querySelectorAll(s)].map(x => x.textContent), sel);
    ok(r.length >= 3 && r.every(x => /^\d+\/\d+ respondidas$/.test(x)), a + ': “x/y respondidas” nas seções (' + r.slice(0, 3).join(', ') + ')');
    await p.close();
  }
  /* Atacadista */
  {
    const {p, f, erros} = await T.abre('Medicamentos', 'distribuidoras-transportadoras', 'Atacadista de medicamentos', '', {browser: b, viewport: vp});
    let r = await f.evaluate(() => ({todas: !!document.querySelector('.dist-faixa [data-dist-todas].on'), botoes: [...document.querySelectorAll('.dockin button')].filter(x => getComputedStyle(x).display !== 'none').map(x => x.id),
      grade: document.getElementById('distTodas') && document.getElementById('distTodas').disabled}));
    ok(r.todas, 'atacadista: faixa “Todas + etapas” na grade de etapas');
    ok(r.botoes.join(',') === 'dockBack,distClear,distTodas,dockNext', 'atacadista: barra inferior ←, limpar, todas, → (' + r.botoes.join(',') + ')');
    ok(r.grade === true, 'atacadista: “Todas as seções” desativado na própria grade');
    await f.evaluate(() => document.querySelector('.dist-card-menu [data-dist-card="2"]').click()); await p.waitForTimeout(700);
    await f.evaluate(() => { const i = document.querySelector('.dist-subitem-menu .card'); if (i) i.click(); }); await p.waitForTimeout(700);
    r = await f.evaluate(() => { const c = document.querySelector('[data-answer][data-v="C"]'); c.click(); return true; }); await p.waitForTimeout(400);
    r = await f.evaluate(() => ({cor: getComputedStyle(document.querySelector('[data-answer][data-v="C"][aria-pressed=true]')).backgroundColor, grade: document.getElementById('distTodas').disabled}));
    ok(r.cor === VERDE, 'atacadista: Cumpre marcado em verde (' + r.cor + ')');
    ok(r.grade === false, 'atacadista: “Todas as seções” ativo dentro da etapa');
    await f.evaluate(() => document.getElementById('distTodas').click()); await p.waitForTimeout(600);
    r = await f.evaluate(() => !!document.querySelector('.dist-card-menu') && !Number(state.activeCard || 0));
    ok(r, 'atacadista: “Todas as seções” volta à grade de etapas');
    if (erros.length) T.falha('atacadista: erros ' + erros.join(' | '));
    await p.close();
  }
  await b.close();
})().catch(e => { T.falha(e.stack || e); process.exit(1); });
