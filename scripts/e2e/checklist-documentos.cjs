'use strict';
/* Checklist de documentos (campo/documentos.js, 25/10/2026): cartão logo após o primeiro da grade,
   painel com a lista do roteiro, marcação que não mexe no roteiro, foto, relatório Word à parte
   (arquivo válido, com apresentados, pendentes, observação e foto), exportação e importação entre
   aparelhos (vale a marcação mais recente, conflito avisado), inspeção salva e modalidades. */
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const {execFileSync} = require('node:child_process');
const T = require('./lib.cjs');
const ok = (c, m) => c ? console.log('ok  ' + m) : T.falha(m);
const DADOS = require('../../campo/documentos-dados.json');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC', 'base64');

(async () => {
  const b = await T.navegador();
  const {p, f, erros} = await T.abre('Serviços', 'vacinacao', 'Vacinação', '', {browser: b});
  await f.evaluate(() => localStorage.removeItem('uvs-docs-vacinacao'));
  const antes = await f.evaluate(() => localStorage.getItem(ROTEIRO.store));
  const g = await f.evaluate(async () => { UvisPadrao.vai({aba: 'roteiro', secao: null, item: null}); await new Promise(r => setTimeout(r, 700));
    const c = document.querySelector('.uvs-docs-card'); return c && {pos: [...c.parentElement.children].indexOf(c), txt: c.textContent}; });
  ok(g && g.pos === 1 && /0 de \d+ conferidos/.test(g.txt), 'cartão logo após o de identificação, com a contagem');
  const n = await f.evaluate(async () => { document.querySelector('.uvs-docs-card').click(); await new Promise(r => setTimeout(r, 300)); return document.querySelectorAll('#uvs-docs .d').length; });
  ok(n === DADOS.apps.vacinacao.lista.length, 'painel com todos os documentos do roteiro (' + n + ')');
  const r1 = await f.evaluate(async () => {
    const d = [...document.querySelectorAll('#uvs-docs .d')], st = (i, s) => d[i].querySelector('.st [data-s=' + s + ']').click();
    st(0, 'a'); await new Promise(r => setTimeout(r, 60));
    let x = [...document.querySelectorAll('#uvs-docs .d')]; x[1].querySelector('.st [data-s=p]').click(); await new Promise(r => setTimeout(r, 60));
    x = [...document.querySelectorAll('#uvs-docs .d')]; x[2].querySelector('.st [data-s=n]').click(); await new Promise(r => setTimeout(r, 60));
    const ta = document.querySelectorAll('#uvs-docs .d')[0].querySelector('textarea'); ta.value = 'Licença nº 123, validade 31/12/2026'; ta.dispatchEvent(new Event('input', {bubbles: true}));
    const info = document.querySelectorAll('#uvs-docs .d')[2]; info.querySelector('[data-a=info]').click();
    return {res: document.querySelector('#uvs-docs .resumo').textContent, info: !info.querySelector('.info').hidden && /Art\. 5º/.test(info.querySelector('.info').textContent),
      pend: /Marcar como pendente/.test(document.getElementById('uvs-docs').textContent), nomes: [...document.querySelectorAll('#uvs-docs .d .nm b')].slice(0, 3).map(b => b.textContent),
      solic: window.__uvsDocsSolicitacao(), bloco: document.querySelector('#uvs-docs h3').textContent};
  });
  ok(/Apresentados: 1/.test(r1.res) && /Pendentes: 1/.test(r1.res) && /Não se aplica: 1/.test(r1.res), 'Apresentado, Pendente e Não se aplica contados');
  ok(r1.info, '“O que deve conter” abre o conteúdo e o texto do dispositivo (RDC 197/2017, art. 5º)');
  ok(!r1.pend, 'botões do checklist não recebem o “Marcar como pendente” do botão Campo');
  ok(r1.nomes[0] === 'Cartão CNPJ atualizado' && /^Documentação legal e administrativa/.test(r1.bloco), 'nomes e blocos no padrão das solicitações da UVIS (' + r1.nomes.join(' | ') + ')');
  ok(/^Solicitamos o envio dos documentos listados abaixo:\n\n1\. Documentação legal e administrativa:\n   a\) Licença de Funcionamento Sanitária;/.test(r1.solic), 'Solicitar pendentes: blocos numerados e documentos em letras');
  const inp = await f.$('#uvs-docs .d [data-foto-doc]');
  await inp.setInputFiles({name: 'doc.png', mimeType: 'image/png', buffer: PNG}); await p.waitForTimeout(900);
  const foto = await f.evaluate(() => ({th: document.querySelectorAll('#uvs-docs .th img').length, ls: JSON.parse(localStorage.getItem('uvs-docs-vacinacao'))}));
  const k0 = Object.keys(foto.ls.itens).find(k => foto.ls.itens[k].nota);
  ok(foto.th === 1 && foto.ls.itens[k0].fotos.length === 1, 'foto do documento gravada (banco de evidências) e mostrada');
  ok((await f.evaluate(() => localStorage.getItem(ROTEIRO.store))) === antes, 'o roteiro não é alterado pela marcação do checklist');
  ok(await f.evaluate(() => { document.querySelector('#uvs-docs [data-a=fecha]').click(); return /3 de \d+ conferidos · 1 pendente/.test(document.querySelector('.uvs-docs-card').textContent); }), 'cartão atualizado ao voltar');

  /* Word */
  const b64 = await f.evaluate(async () => { const bl = await window.__uvsDocsDocx(); const u = new Uint8Array(await bl.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chk-')), arq = path.join(tmp, 'c.docx'); fs.writeFileSync(arq, Buffer.from(b64, 'base64'));
  let valido = '';
  try { valido = execFileSync('python3', ['-c', 'import zipfile,sys,xml.dom.minidom as m;z=zipfile.ZipFile(sys.argv[1]);[m.parseString(z.read(n)) for n in z.namelist() if n.endswith((".xml",".rels"))];print(len([n for n in z.namelist() if n.startswith("word/media/")]))', arq]).toString().trim(); } catch (e) { valido = 'erro ' + e.message; }
  ok(valido === '1', 'Word: pacote e XML válidos, com a foto embutida (' + valido + ')');
  let txt = '';
  try { txt = execFileSync('pandoc', ['-t', 'plain', arq]).toString(); } catch (e) { txt = ''; }
  ok(/CHECKLIST DE DOCUMENTOS/.test(txt) && /Documentos apresentados \(1\)/.test(txt) && /Documentos pendentes \(1\)/.test(txt) && /Licença nº 123/.test(txt) && /Fundamento: RDC Anvisa nº 197\/2017, art\. 4º/.test(txt), 'Word: apresentados, pendentes com fundamento e observação');
  ok(/Não\s+constitui\s+análise\s+do\s+conteúdo/.test(txt), 'Word: aviso de que não é análise nem capitulação');
  fs.rmSync(tmp, {recursive: true, force: true});

  /* exportar e importar */
  const imp = await f.evaluate(async () => {
    const pk = await window.__uvsDocsPacote(), ks = Object.keys(pk.itens), out = {n: ks.length, fotos: Object.keys(pk.fotos).length};
    const outro = JSON.parse(JSON.stringify(pk)), futuro = new Date(Date.now() + 60000).toISOString(), passado = '2000-01-01T00:00:00.000Z';
    const kp = ks.find(k => pk.itens[k].s === 'p'), kn = ks.find(k => pk.itens[k].s === 'n');
    outro.itens[kp] = {s: 'a', nota: 'Apresentado à equipe 2', fotos: [], t: futuro};         /* outro aparelho, mais recente */
    outro.itens[kn] = {s: 'a', nota: '', fotos: [], t: passado};                              /* outro aparelho, mais antigo */
    const novo = DOCS_LISTA().find(k => !pk.itens[k]); outro.itens[novo] = {s: 'p', nota: 'Pedir na segunda visita', fotos: [], t: futuro};
    const r = await window.__uvsDocsImporta(JSON.stringify(outro)), ls = JSON.parse(localStorage.getItem('uvs-docs-vacinacao')).itens;
    out.r = {novos: r.novos, atual: r.atual, mantidos: r.mantidos, conf: r.conflitos.length};
    out.kp = ls[kp].s; out.kn = ls[kn].s; out.novo = ls[novo].s; out.msg = document.querySelector('#uvs-docs .msg') ? document.querySelector('#uvs-docs .msg').textContent : '';
    try { await window.__uvsDocsImporta(JSON.stringify({...outro, roteiro: 'drogaria'})); out.outroRot = 'aceitou'; } catch (e) { out.outroRot = e.message; }
    return out;
    function DOCS_LISTA() { return window.__uvsDocs.lista.map(d => d.id); }
  });
  ok(imp.n === 3 && imp.fotos === 1, 'exportação leva as marcações e a foto');
  ok(imp.kp === 'a' && imp.kn === 'n' && imp.novo === 'p', 'importação: vale a marcação mais recente de cada documento e entra o que faltava');
  ok(imp.r.novos === 1 && imp.r.atual === 1 && imp.r.mantidos === 2 && imp.r.conf === 2, 'importação: resumo com novos, atualizados, mantidos e conflitos (' + JSON.stringify(imp.r) + ')');
  ok(/outro roteiro/.test(imp.outroRot), 'importação de arquivo de outro roteiro é recusada');

  /* inspeção salva */
  ok(await p.evaluate(() => UvisSalvas.CFG.vacinacao.ls.includes('uvs-docs-vacinacao') && UvisSalvas.CFG['servicos-assistenciais'].ls.includes('uvs-docs-servicos-assistenciais')), 'a marcação entra na inspeção salva (todos os roteiros)');
  if (erros.length) T.falha('erros: ' + erros.join(' | '));
  await p.close();

  /* modalidades: lista da modalidade aberta */
  for (const [srv, nome] of [['ilpi', 'ILPI'], ['ct', 'Comunidade Terapêutica']]) {
    const x = await T.abre('Serviços assistenciais', 'servicos-assistenciais', nome, 'servico=' + srv, {browser: b});
    const r = await x.f.evaluate(async () => { const c = document.querySelector('.uvs-docs-card'); if (!c) return null; c.click(); await new Promise(r => setTimeout(r, 300));
      return {n: document.querySelectorAll('#uvs-docs .d').length, sub: document.querySelector('#uvs-docs .cab small').textContent}; });
    ok(r && r.n === DADOS.apps['servicos-assistenciais'].modalidades[srv].lista.length && r.sub.includes(DADOS.apps['servicos-assistenciais'].modalidades[srv].nome), 'Serviços assistenciais — ' + nome + ': lista da modalidade (' + (r && r.n) + ')');
    await x.p.close();
  }
  const y = await T.abre('Produtos', 'produtos-correlatos', 'Fabricante de cosméticos', 'atividade=fab_cosm', {browser: b});
  const ry = await y.f.evaluate(async () => { const c = document.querySelector('.uvs-docs-card'); if (!c) return null; c.click(); await new Promise(r => setTimeout(r, 300)); return document.querySelector('#uvs-docs .cab small').textContent; });
  ok(/Fabricante de cosméticos/.test(ry || ''), 'Produtos: lista da atividade (fabricante)');
  const z = await T.abre('Medicamentos', 'drogaria', 'Drogaria', '', {browser: b});
  const rz = await z.f.evaluate(async () => { document.querySelector('.uvs-docs-card').click(); await new Promise(r => setTimeout(r, 300)); return [...document.querySelectorAll('#uvs-docs h3')].map(h => h.textContent.replace(/\s*\d+\/\d+$/, '')); });
  ok(rz.includes('Procedimentos Operacionais Padrão (POPs)') && rz.slice(-2).join('|') === 'Específico — Serviços farmacêuticos|Específico — Aplicação de injetáveis', 'Drogaria: POPs em bloco próprio e específicos (serviços farmacêuticos, injetáveis) no fim (' + rz.join(' | ') + ')');
  await z.p.close();
  await y.p.close();
  await b.close();
})().catch(e => { T.falha(e.stack || e); process.exit(1); });
