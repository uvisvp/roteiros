'use strict';
/* Produtos (distribuidor de dispositivos médicos): relatórios e Anexo III no modelo do
   POP-O-SNVS-013 rev. 9 (scripts/repack-produtos-relatorio.cjs). Captura o HTML que vai ao Word
   e confere: cabeçalho do modelo sem a linha do nome do modelo nem avisos de minuta, datas
   dd/mm/aaaa, subitens do Anexo I com “Não aplicável” e evidência em negrito, NC sem categoria no
   relatório, quadros do Anexo II, e todas as linhas do quadro de NC no Anexo III. */
const T = require('./lib.cjs');
const ok = (c, m) => c ? console.log('ok  ' + m) : T.falha(m);
(async () => {
  const {b, p, f: f0, erros} = await T.abre('Produtos', 'produtos-correlatos', 'Atacadista / distribuidor', 'atividade=atacadista');
  await f0.evaluate(() => {
    const e = JSON.parse(localStorage.getItem('uvis-produtos-v2')); e.profile.flags.cls_disp = true; e.answers = {dq1: 'no', dq3: 'yes'}; e.notes = {dq1: {evidence: 'Manual sem revisão desde 2019.'}};
    localStorage.setItem('uvis-produtos-v2', JSON.stringify(e));
    localStorage.setItem('uvis-produtos-pop13-report-v1', JSON.stringify({orgao: 'UVIS Teste', razao: 'Empresa Teste Ltda', inicio: '2026-10-20', fim: '2026-10-21'}));
    localStorage.setItem('uvis-produtos-pop13-capa-v1', JSON.stringify({ncs: [{id: 'n1', numero: '1', tema: 'armazenamento', norma: 'RDC Anvisa nº 665/2022, art. 117', descricao: 'Sem registros de temperatura.', evidencia: 'Planilha de outubro incompleta.', categoria: 'maior'}], conclusao: {}}));
  });
  const docs = {};
  for (const modelo of ['completo', 'simplificado']) {
    await f0.evaluate(m => localStorage.setItem('uvis-produtos-pop13-v1', JSON.stringify({objetivo: 'boas_praticas', modelo: m, linhas: [], riscos: [], outro: ''})), modelo);
    await p.evaluate(() => window.__cascaAbrirRoteiro('Produtos', 'produtos-correlatos', 'Atacadista / distribuidor', 'atividade=atacadista')); await p.waitForTimeout(4500);
    const f = p.frames().find(x => x !== p.mainFrame());
    docs[modelo] = await f.evaluate(async () => { let h = ''; RoteiroDocuments.downloadElement = async el => { h = el.innerHTML; };
      UvisPadrao.vai({aba: 'roteiro', secao: 'dados', item: 'enq'}); await new Promise(r => setTimeout(r, 600));
      document.querySelector('[data-open-prod-report]').click(); await new Promise(r => setTimeout(r, 500)); document.querySelector('[data-pr-doc]').click(); await new Promise(r => setTimeout(r, 800)); return h; });
    if (modelo === 'simplificado') docs.anexo3 = await f.evaluate(async () => { let h = ''; RoteiroDocuments.downloadElement = async el => { h = el.innerHTML; };
      document.querySelector('#prodReportDlg')?.close?.(); document.querySelector('[data-open-capa]').click(); await new Promise(r => setTimeout(r, 500)); document.querySelector('[data-pc-doc]').click(); await new Promise(r => setTimeout(r, 800)); return h; });
  }
  const c = docs.completo, s = docs.simplificado, a3 = docs.anexo3;
  ok(/<h1>RELATÓRIO DE INSPEÇÃO<\/h1>/.test(c) && /UVIS Teste/.test(c) && /Período de Inspeção:<\/b> 20\/10\/2026 a 21\/10\/2026/.test(c), 'completo: cabeçalho do modelo, com órgão e datas dd/mm/aaaa');
  ok(!/Modelo de Relatório|MINUTA/.test(c), 'completo: sem a linha do nome do modelo e sem aviso de minuta no documento');
  ok(/<h3>8\.1 Manual da Qualidade<\/h3>/.test(c) && /<h3>16\.2 Assistência técnica<\/h3>/.test(c), 'completo: subitens do Anexo I (8.1 a 16.2)');
  ok(/<h3>8\.4 Gerenciamento de Risco<\/h3><p>Não aplicável\.<\/p>/.test(c), 'completo: subitem sem conteúdo sai “Não aplicável”');
  ok(/<b>Evidência: Manual sem revisão desde 2019\.<\/b>/.test(c), 'completo: evidência da resposta Não cumpre em negrito');
  ok(/NC nº 1/.test(c) && !/Maior|Crítica/.test(c.replace(/Maior Relevância/g, '')), 'completo: NC citada sem categoria (só no Anexo III)');
  ok(/<h3>Documentos Avaliados<\/h3>/.test(s) && /<h3>Descrição das Não Conformidades<\/h3>/.test(s) && /Quadro não preenchido/.test(s), 'simplificado: quadros do Anexo II, com justificativa quando vazios');
  ok(/Ação Corretiva proposta \(preenchimento empresa\)/.test(a3) && /Data do monitoramento/.test(a3) && /☒ Maior/.test(a3), 'Anexo III: todas as linhas do quadro, inclusive as da empresa, e categorização marcada');
  ok(/1\. IDENTIFICAÇÃO DA EMPRESA/.test(a3) && /3\. EQUIPE INSPETORA/.test(a3) && /ASSINATURAS/.test(a3), 'Anexo III: identificação, equipe e assinaturas');
  if (erros.length) T.falha('erros: ' + erros.join(' | '));
  await b.close();
})().catch(e => { T.falha(e.stack || e); process.exit(1); });
