'use strict';
/* Auditoria de 14/11/2026 — itens E02 a E06 (o E01 está em auditoria-pontos.cjs):
   E02 EAC com a RDC 1.043/2026: recebimento só proibido ao consultório isolado Tipo II; posto de coleta com
       itinerante; supervisão remota só na Central de Distribuição; texto legal consolidado;
   E03 CNPJ alfanumérico: a letra fica, a máscara e o dígito verificador valem para os dois formatos;
   E04 relatório sem verificações: conclusão de rascunho, não “foi avaliado”;
   E05 citações com a redação vigente (ECA, Estatuto da Pessoa Idosa) e com o texto oficial (IN 95/2021);
   E06 calculadora de dimensionamento: número negativo, fracionário ou incoerente não gera resultado.
   Uso: node scripts/e2e/auditoria-1411.cjs */
const T = require('./lib.cjs');
const ok = (c, m) => { if (c) console.log('ok  ' + m); else T.falha(m); };
const sel = (f, id, v) => f.evaluate(([id, v]) => { const s = document.querySelector('select[data-rs-meta="' + id + '"]'); s.value = v; s.dispatchEvent(new Event('change', {bubbles: true})); }, [id, v]);
const rel = f => f.evaluate(() => { const e = UvisPadrao.estado(); UvisPadrao.vai({aba: 'relatorio'}); const t = (document.querySelector('.rs-relatorio') || {}).innerText || ''; UvisPadrao.vai(e); return t; });

(async () => {
  const b = await T.navegador();
  /* ——— E02: EAC Tipo II ——— */
  { const {p, f, erros} = await T.abre('Serviços', 'eac-tipo2', 'Serviço Tipo II', '', {browser: b});
    const perguntas = () => f.evaluate(() => { const ids = []; UvisPadrao.lista().forEach(s => s.itens.forEach(i => { UvisPadrao.vai({aba: 'roteiro', secao: s.id, item: i.id}); document.querySelectorAll('#pu-conteudo [data-rs-q]').forEach(q => ids.push(q.dataset.rsQ)); })); return ids; });
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'ident', item: 'dados'})); await p.waitForTimeout(300);
    await sel(f, 'tipo_est', 'posto'); await p.waitForTimeout(400);
    let q = await perguntas();
    ok(!q.includes('recebe'), 'Tipo II, posto de coleta: sem a pergunta de recebimento de material (art. 25 só alcança o consultório isolado)');
    ok(q.includes('itin_reg') && q.includes('itin_exec') && q.includes('itin_destino'), 'Tipo II: item do serviço de EAC itinerante');
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'ident', item: 'dados'})); await p.waitForTimeout(300);
    await sel(f, 'tipo_est', 'consultorio'); await p.waitForTimeout(400);
    q = await perguntas();
    ok(q.includes('recebe'), 'Tipo II, consultório isolado: pergunta de recebimento presente');
    const r = await f.evaluate(() => { let o = null; ROTEIRO.secoes.forEach(s => s.itens.forEach(i => (i.perguntas || []).forEach(x => { if (x.id === 'recebe') o = {t: x.t, nc: x.nc, r: x.r}; }))); const itin = []; ROTEIRO.secoes.forEach(s => s.itens.forEach(i => (i.perguntas || []).forEach(x => { if (x.id === 'itin_reg') itin.push(...x.pontos.map(z => z[0])); })));
      return {q: o, itin, a25: ROTEIRO.legal['rdc-978-2025::artigo::25'].texto, a43: ROTEIRO.legal['rdc-978-2025::artigo::43'].texto, perfil: !!document.querySelector('nav') && ROTEIRO.secoes[0].itens.some(i => (i.campos || []).some(c => c.id === 'p_itinerante')), tudo: JSON.stringify(ROTEIRO)}; });
    ok(/consultório isolado/i.test(r.q.t) && /consultório isolado/i.test(r.q.nc) && r.q.r.includes('rdc-978-2025::artigo::25') && !r.q.r.some(x => /artigo::25::paragrafo/.test(x)), 'recebimento: pergunta e irregularidade do consultório isolado, sem o parágrafo único revogado');
    ok(/Consultório Isolado classificado como Serviço Tipo II/.test(r.a25) && /Revogado pela Resolução da Diretoria Colegiada Anvisa nº 1\.043/.test(r.a25), 'texto do art. 25 com a redação da RDC 1.043/2026');
    ok(/Serviço Tipo II \(Posto de Coleta\) e o Serviço Tipo III podem manter/.test(r.a43), 'texto do art. 43: posto de coleta e Tipo III podem manter itinerante');
    ok(r.perfil && r.itin.includes('quem'), 'Tipo II: perfil com o itinerante e conferência de quem o mantém (consultório isolado não pode)');
    ok(!/Somente o Serviço Tipo III pode manter|proibido ao Serviço Tipo II\.|Excetua-se do disposto no caput deste artigo, o recebimento/.test(r.tudo), 'Tipo II: sem a redação anterior');
    if (erros.length) T.falha('eac-tipo2: erros de página — ' + erros.join(' | '));
    await p.close(); }
  { const {p, f, erros} = await T.abre('Serviços', 'eac-tipo3', 'Serviço Tipo III', '', {browser: b});
    const r = await f.evaluate(() => { let cd = null, dest = null; ROTEIRO.secoes.forEach(s => s.itens.forEach(i => (i.perguntas || []).forEach(x => { if (x.id === 'cd_superv') cd = x; if (x.id === 'itin_destino') dest = x; })));
      return {cd: cd && cd.r, dest: dest && dest.c, p4: (ROTEIRO.legal['rdc-978-2025::artigo::122::paragrafo::4'] || {}).texto || '', tudo: JSON.stringify(ROTEIRO)}; });
    ok(r.cd && r.cd.includes('rdc-978-2025::artigo::122::paragrafo::4') && /forma remota somente para a Central de Distribuição/.test(r.p4), 'Tipo III: supervisão remota só na Central de Distribuição (art. 122, § 4º)');
    ok(/vai apenas ao Serviço Tipo III que o mantém/.test(r.dest) && !/Somente o Serviço Tipo III pode manter/.test(r.tudo), 'Tipo III: destino do material do itinerante e texto do art. 43 atualizados');
    if (erros.length) T.falha('eac-tipo3: erros de página — ' + erros.join(' | '));
    await p.close(); }
  /* ——— E03: CNPJ ——— */
  { const {p, f, erros} = await T.abre('Serviços', 'estetica', 'Estética e beleza', '', {browser: b});
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'ident', item: 'dados'})); await p.waitForTimeout(300);
    const campo = '#pu-conteudo input[data-rs-cnpj]';
    const digita = async v => { await f.fill(campo, ''); await f.type(campo, v, {delay: 5}); await f.evaluate(s => document.querySelector(s).blur(), campo); await p.waitForTimeout(300); return f.evaluate(s => { const e = document.querySelector(s), n = e.nextElementSibling; return {v: e.value, aviso: n && n.classList.contains('med-cnpj-aviso') ? n.textContent : '', modo: e.getAttribute('inputmode')}; }, campo); };
    let c = await digita('12abc34501de35');
    ok(c.v === '12.ABC.345/01DE-35' && !c.aviso && c.modo === 'text', 'motor comum: CNPJ alfanumérico preservado, em maiúsculas e com máscara (' + c.v + ')');
    ok((await p.evaluate(() => JSON.parse(localStorage.getItem('uvis-estetica-v1')).meta.cnpj)) === '12.ABC.345/01DE-35' && /12\.ABC\.345\/01DE-35/.test(await rel(f)), 'motor comum: o identificador vai inteiro para o estado e para o relatório');
    c = await digita('12ABC34501DE36');
    ok(/dígito verificador não confere/.test(c.aviso) && c.v === '12.ABC.345/01DE-36', 'CNPJ alfanumérico com dígito errado: aviso, sem alterar o que foi digitado');
    c = await digita('11222333000181');
    ok(c.v === '11.222.333/0001-81' && !c.aviso, 'CNPJ numérico continua válido e mascarado');
    c = await digita('11222333000182');
    ok(/dígito verificador não confere/.test(c.aviso), 'CNPJ numérico com dígito errado: aviso');
    if (erros.length) T.falha('estética (CNPJ): erros de página — ' + erros.join(' | '));
    await p.close(); }
  { const {p, f, erros} = await T.abre('Produtos', 'produtos-correlatos', 'X', '', {browser: b});
    const itens = await f.evaluate(() => UvisPadrao.lista().flatMap(s => s.itens.map(i => [s.id, i.id])));
    let achou = false;
    for (const [s, i] of itens) { await f.evaluate(([s, i]) => UvisPadrao.vai({aba: 'roteiro', secao: s, item: i}), [s, i]); await p.waitForTimeout(250);
      achou = await f.evaluate(() => { const e = [...document.querySelectorAll('#pu-conteudo input')].find(x => { const l = x.closest('label'); return l && /^\s*CNPJ\b/i.test(l.textContent) && !/CPF/i.test(l.textContent); }); if (e) { e.setAttribute('data-teste-cnpj', '1'); return true; } return false; });
      if (achou) break; }
    ok(achou, 'Produtos: campo de CNPJ localizado');
    if (achou) { await f.fill('[data-teste-cnpj]', ''); await f.type('[data-teste-cnpj]', '12ABC34501DE35', {delay: 5}); await p.waitForTimeout(400);
      const v = await f.evaluate(() => { const e = document.querySelector('[data-teste-cnpj]') || [...document.querySelectorAll('#pu-conteudo input')].find(x => /ABC/.test(x.value)); return e ? e.value : ''; });
      ok(v === '12.ABC.345/01DE-35', 'Produtos: CNPJ alfanumérico preservado (' + v + '; antes virava 12.345.013/5)'); }
    if (erros.length) T.falha('produtos (CNPJ): erros de página — ' + erros.join(' | '));
    await p.close(); }
  /* ——— E04: conclusão sem verificações ——— */
  { const {p, f, erros} = await T.abre('Serviços', 'imagem-servico', 'Diagnóstico por imagem', '', {browser: b});
    await f.evaluate(() => { UvisPadrao.vai({aba: 'roteiro', secao: 'ident', item: 'perfil'}); for (const v of ['conv', 'us']) { const x = document.querySelector('[data-rs-check="p_mod"][value="' + v + '"]'); x.checked = true; x.dispatchEvent(new Event('change', {bubbles: true})); } }); await p.waitForTimeout(400);
    let r = await rel(f), concl = r.slice(r.lastIndexOf('CONCLUSÃO'));
    ok(/Nenhuma verificação foi registrada: este relatório é um rascunho/.test(concl) && !/foi avaliado conforme os itens acima/.test(concl), 'relatório sem verificações: conclusão de rascunho');
    const id = await f.evaluate(() => ROTEIRO.secoes.find(s => s.id === 'org').itens[0].perguntas[0].id);
    await f.evaluate(id => { UvisPadrao.vai({aba: 'roteiro', secao: 'org', item: 'org'}); document.querySelector('[data-rs-r="' + id + '|c"]').click(); }, id); await p.waitForTimeout(300);
    r = await rel(f); concl = r.slice(r.lastIndexOf('CONCLUSÃO'));
    ok(/foi avaliado conforme os itens acima/.test(concl), 'com verificação registrada: conclusão padrão');
    if (erros.length) T.falha('imagem (conclusão): erros de página — ' + erros.join(' | '));
    await p.close(); }
  /* ——— E05: redação vigente e texto oficial ——— */
  { const {p, f, erros} = await T.abre('Serviços assistenciais', 'servicos-assistenciais', 'X', 'servico=saica', {browser: b});
    const d = await f.evaluate(() => { const L = DATA.laws['lei-federal-8069-1990'], t = id => (L.nos.find(n => n.id === id) || {}).x || '', I = DATA.laws['lei-federal-10741-2003'];
      const cit = new Set(); DATA.services.forEach(s => ['doc', 'rot', 'inf'].forEach(k => (s[k] || []).forEach(x => (x.refs || []).forEach(r => cit.add(r.law + ':' + r.node)))));
      const rot = L.nos.filter(n => !n.p).map(n => n.r);
      return {a11: t('a11b2'), a13: t('a13b'), a92: t('a92b'), a93: t('a93b'), antigos: ['a11', 'a13', 'a92', 'a93'].filter(i => L.nos.some(n => n.id === i) || cit.has('lei-federal-8069-1990:' + i)),
        idoso: ['a48bpu', 'a50-i', 'a50-xv'].filter(i => I.nos.some(n => n.id === i) || cit.has('lei-federal-10741-2003:' + i)), a48: (I.nos.find(n => n.id === 'a48bpub') || {}).x || '',
        repetidos: rot.filter((x, k) => rot.indexOf(x) !== k), eca: JSON.stringify(L.nos)}; });
    ok(/acesso integral às linhas de cuidado/.test(d.a11) && /castigo físico/.test(d.a13) && /acolhimento familiar ou institucional/.test(d.a92), 'ECA: arts. 11, 13 e 92 na redação vigente');
    ok(/em até 24 \(vinte e quatro\) horas/.test(d.a93) && !/2º dia útil/.test(d.eca), 'ECA, art. 93: prazo de 24 horas, sem o “2º dia útil” da redação antiga');
    ok(!d.antigos.length && !d.idoso.length && !d.repetidos.length, 'redações superadas fora do banco do módulo e das citações' + (d.antigos.concat(d.idoso, d.repetidos).length ? ' — ' + d.antigos.concat(d.idoso, d.repetidos).join(',') : ''));
    ok(/assistência à pessoa idosa ficam sujeitas à inscrição/.test(d.a48), 'Estatuto da Pessoa Idosa, art. 48, parágrafo único, na redação da Lei 14.423/2022');
    /* o botão da citação abre a redação vigente */
    const k = await f.evaluate(() => current.rot.findIndex(x => (x.refs || []).some(r => r.node === 'a11b2')));
    const g = await f.evaluate(k => { const gs = asGrupos('rot'); const gr = gs.find(g => g.idx.includes(k)); return gr ? gr.g : null; }, k);
    await f.evaluate(g => UvisPadrao.vai({aba: 'roteiro', secao: 'rot', item: 'rot:' + g}), g); await p.waitForTimeout(500);
    const abriu = await f.evaluate(k => { const q = document.querySelector('[data-as-q="rot|' + k + '"]'); const bt = q && [...q.querySelectorAll('button')].find(x => /8\.069|Art\. 11/.test(x.textContent) && /11/.test(x.textContent)); if (bt) { bt.click(); return bt.textContent; } return ''; }, k);
    await p.waitForTimeout(900);
    const modal = (await f.evaluate(() => document.body.innerText)) + (await p.evaluate(() => document.body.innerText));
    ok(!!abriu && /acesso integral às linhas de cuidado/.test(modal) && !/É assegurado atendimento médico à criança/.test(modal), 'SAICA: o botão do art. 11 do ECA abre a redação de 2016 (' + abriu.trim().slice(0, 40) + ')');
    if (erros.length) T.falha('saica (citações): erros de página — ' + erros.join(' | '));
    await p.close(); }
  /* ——— E06: calculadora (página nova: a janela da citação ficava por cima) ——— */
  { const {p, f, erros} = await T.abre('Serviços assistenciais', 'servicos-assistenciais', 'X', 'servico=saica', {browser: b});
    await f.evaluate(() => UvisPadrao.vai({aba: 'roteiro', secao: 'calc', item: 'calc'})); await p.waitForTimeout(500);
    const calc = async (n, esp) => { await f.fill('#calc-n', String(n)); await f.fill('#calc-esp', String(esp)); await p.waitForTimeout(300); return f.evaluate(() => ({t: document.getElementById('calcResults').innerText, rel: (buildReport(true), document.getElementById('reportBody').innerText)})); };
    let c = await calc(-21, '');
    ok(/Confira os números/.test(c.t) && !/-2\b/.test(c.t) && !/Calculadora/.test(c.rel), 'calculadora: −21 acolhidos não gera resultado (antes: −2 educadores), nem na tela nem no relatório');
    c = await calc(15, '0.5');
    ok(/número inteiro/.test(c.t) && !/educador\(es\)/.test(c.t.replace(/Confira[\s\S]*/, '')), 'calculadora: meia pessoa é recusada');
    c = await calc(5, 9);
    ok(/não podem ser mais que o total/.test(c.t), 'calculadora: demandas específicas acima do total são recusadas');
    c = await calc(21, 0);
    ok(/Educadores por plantão\s*3 educador/.test(c.t.replace(/\n/g, ' ')) && /Excedente\s*6 acolhido/.test(c.t.replace(/\n/g, ' ')) && /Calculadora/.test(c.rel), 'calculadora: números válidos calculam (21 acolhidos → 3 educadores, 6 acima do limite) e vão ao relatório');
    c = await calc('', '');
    ok(/Informe os números para calcular/.test(c.t) && !/Calculadora/.test(c.rel), 'calculadora vazia: pede os números e não entra no relatório');
    if (erros.length) T.falha('saica (calculadora): erros de página — ' + erros.join(' | '));
    await p.close(); }
  { const {p, f, erros} = await T.abre('Odontologia', 'odontologia', 'Odontologia', '', {browser: b});
    const d = await f.evaluate(() => { const t = id => (DATA.legal.find(x => x.id === id) || {}).text || ''; return {a5: t('in-anvisa-95-2021:a5'), a2: t('in-anvisa-95-2021:a2'), a63: t('rdc-anvisa-611-2022:a63'), a67: t('portaria-svs-ms-344-1998:a67'), resumo: DATA.legal.filter(x => /^(Estabelece|Dispõe sobre|Integra os requisitos)/.test(x.text)).map(x => x.id)}; });
    ok(/^Art\. 5\nAs avaliações da qualidade da imagem devem:\nI\n/.test(d.a5) && !/Levantamento radiométrico Teste/.test(d.a5), 'Odontologia: IN 95/2021, art. 5º, com o texto do artigo (sem o trecho de tabela)');
    ok(/Tensão nominal no tubo de raios X maior ou igual a 60 kV/.test(d.a2) && /croquis da instalação/.test(d.a63) && /deverão ser obrigatoriamente guardados sob chave/.test(d.a67) && !d.resumo.length, 'Odontologia: citações com o texto oficial, nenhuma com resumo' + (d.resumo.length ? ' — ' + d.resumo.join(',') : ''));
    if (erros.length) T.falha('odontologia (citações): erros de página — ' + erros.join(' | '));
    await p.close(); }
  await b.close();
  if (!process.exitCode) console.log('PASS: auditoria de 14/11/2026 — EAC (RDC 1.043/2026), CNPJ alfanumérico, conclusão de rascunho, citações vigentes e calculadora.');
})().catch(e => { console.error(e); process.exit(1); });
