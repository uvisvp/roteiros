'use strict';
/* Regras do app conferidas a cada publicação (CI, sem navegador e sem rede).
   1. Lei Municipal nº 13.725/2004: nenhum módulo cita o art. 22, o art. 129 ou artigo acima do 109.
   2. Núcleo Medicamentos: toda irregularidade cita a Lei 13.725 — Drogaria e Manipulação somam a
      Lei quando a referência não a traz; nos roteiros do motor roteiro-simples, toda pergunta
      cita a Lei ou o roteiro tem leiBase.
   3. PWA: tudo o que o service worker põe em cache existe; o módulo antigo de Manipulação
      (farmacia-manipulacao-app/core/section…, substituído pelo v2 do index.html) não volta.
   4. Versão igual em versao.json, sw.js e index.html.
   5. “Para saber mais” do núcleo Medicamentos: toda linha cita a fonte, e os blocos que o
      embutem (rec--saber-mais.js, Manipulação, Distribuidora) trazem a versão atual de
      saber-mais.js. Farmacopeia Brasileira só na 8ª ed. e Homeopática só na 4ª ed.
   Uso: node scripts/test-regras.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..');
const {html, blocks} = unpack(path.join(root, 'index.html'));
const falhas = [];
const ok = (c, msg) => { if (!c) falhas.push(msg); };

/* 1. artigos vedados da Lei 13.725 */
const RE = /13\.725(?:\/2004)?,?\s*arts?\.\s*(\d+)(?:\s*e\s*(\d+))?|arts?\.\s*(\d+)[^"\n;]{0,40}?da Lei Municipal nº 13\.725|lei-municipal-13725-2004(?:::artigo::|","node":"a)(\d+)/g;
for (const [id, b] of blocks) {
  if (!/^(app|rec)--/.test(id)) continue;
  for (const m of b.matchAll(RE)) for (const a of [m[1], m[2], m[3], m[4]].filter(Boolean).map(Number))
    ok(!(a === 22 || a === 129 || a > 109), id + ': Lei 13.725 cita o art. ' + a);
}

/* 2. Lei 13.725 em toda irregularidade do núcleo Medicamentos */
ok(blocks.get('rec--drogaria-report-final.js').includes("legal.push('Lei Municipal nº 13.725/2004, arts. 46 e 50')"), 'Drogaria: relatório sem a Lei 13.725 nas irregularidades');
const manip = blocks.get('app--farmacia-manipulacao');
ok(/function v2ComLei\(/.test(manip) && manip.includes('cit:v2ComLei(texto,cit)'), 'Manipulação: irregularidades sem a Lei 13.725');
ok(manip.includes("dev.push({law:'Lei Municipal nº 13.725/2004'"), 'Manipulação: aba Infrações sem a Lei 13.725');
/* roteiros do motor roteiro-simples (dados que geram os blocos app--) */
for (const arq of ['academia/roteiro.cjs', 'vacina/roteiro.cjs', 'eac/roteiro.cjs', 'gases/roteiro.cjs', 'estetica/roteiro.cjs', 'transporte/roteiro.cjs', 'imagem/roteiro.cjs']) {
  const m = require(path.join(root, arq));
  for (const R of Array.isArray(m) ? m : [m]) {
    if (R.leiBase && R.leiBase.length) continue;
    const sem = [];
    R.secoes.forEach(s => s.itens.forEach(it => (it.perguntas || []).forEach(p => { if (!(p.r || []).some(r => /13725/.test(r))) sem.push(p.id); })));
    ok(!sem.length, R.app + ': perguntas sem a Lei 13.725 e roteiro sem leiBase (' + sem.slice(0, 5).join(', ') + (sem.length > 5 ? '…' : '') + ')');
  }
}
/* redação (diretriz de 20/10/2026): a pergunta cuja resposta conforme é “Atende”/“Sim” não pode ser a negação
   de uma irregularidade (“O serviço não usa…?”, “Nenhum equipamento…?”): pergunta-se pela condição correta.
   Perguntas de escopo com Sim = não conforme (sim: 'nc') ficam de fora. */
const NEGA = /^(Nenhum|Nenhuma|Não |O serviço não|A empresa não|O estabelecimento não|O laboratório não)/;
for (const arq of ['academia/roteiro.cjs', 'vacina/roteiro.cjs', 'eac/roteiro.cjs', 'gases/roteiro.cjs', 'estetica/roteiro.cjs', 'transporte/roteiro.cjs', 'imagem/roteiro.cjs']) {
  const m = require(path.join(root, arq));
  for (const R of Array.isArray(m) ? m : [m]) {
    const neg = [];
    R.secoes.forEach(s => s.itens.forEach(it => (it.perguntas || []).forEach(p => { if (p.sim !== 'nc' && NEGA.test(p.t || '')) neg.push(p.id); })));
    ok(!neg.length, R.app + ': pergunta formulada como negação de irregularidade (' + neg.join(', ') + ')');
  }
}

/* 3. cache do PWA */
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const ess = [...sw.slice(sw.indexOf('const ESSENCIAIS'), sw.indexOf('];', sw.indexOf('const ESSENCIAIS'))).matchAll(/'\.\/([^']+)'/g)].map(m => m[1]);
ok(ess.length > 0, 'sw.js: lista ESSENCIAIS não encontrada');
ess.forEach(f => ok(fs.existsSync(path.join(root, f)), 'sw.js põe em cache um arquivo que não existe: ' + f));
const ANTIGO = /farmacia-manipulacao-(app|core|lookup|ocr|report|section\d)\.js/;
ok(!ANTIGO.test(sw), 'sw.js: módulo antigo de Manipulação de volta ao cache');
ok(!ANTIGO.test(html), 'index.html: módulo antigo de Manipulação referenciado');

/* 4. versão */
const v = JSON.parse(fs.readFileSync(path.join(root, 'versao.json'), 'utf8')).versao;
ok(sw.includes("const VERSAO = '" + v + "'"), 'sw.js com versão diferente de versao.json (' + v + ')');
ok(html.includes("const APP_VERSAO = '" + v + "'"), 'index.html com versão diferente de versao.json (' + v + ')');

/* 5. Para saber mais: fonte em cada linha e cópias em dia */
const SMF = fs.readFileSync(path.join(root, 'saber-mais.js'), 'utf8');
{
  const w = {}, doc = {getElementById: () => null, createElement: () => ({}), head: {appendChild() {}}};
  new Function('window', 'document', SMF)(w, doc);
  const EQ = new Function('return ' + SMF.slice(SMF.indexOf('const EQ=') + 9, SMF.indexOf('];\n function equip') + 1))();
  const FONTE = /\b(RDC|Lei|Portaria|Decreto|Resolução|IN|NR-?\s?\d+|Farmacopeia|ABNT|NBR|ISO|OMS|USP|ICH|OIML|NIOSH|FDA|NSF|ISTA|GAMP|ISPE|Referência)\b/;
  const linhas = [];
  for (const o of Object.values(w.SaberMais.dados)) (Array.isArray(o) ? o.map(x => x[1]) : Object.values(o)).forEach(a => a.forEach(l => linhas.push(l)));
  EQ.forEach(x => x[1].forEach(l => linhas.push(l)));
  const sem = linhas.filter(([t, x]) => !FONTE.test(t + ' ' + x)).map(([t]) => t);
  ok(linhas.length > 100, 'saber-mais.js: dados não lidos');
  ok(!sem.length, 'Para saber mais sem fonte: ' + sem.slice(0, 5).join('; ') + (sem.length > 5 ? '…' : ''));
  ok(blocks.get('rec--saber-mais.js') === SMF.trimEnd() || blocks.get('rec--saber-mais.js') === SMF, 'rec--saber-mais.js diferente de saber-mais.js (rode repack-medicamentos-auditoria)');
  for (const id of ['app--farmacia-manipulacao', 'app--distribuidoras-transportadoras']) ok(blocks.get(id).includes(SMF.trimEnd()), id + ': cópia do saber-mais.js desatualizada (rode repack-medicamentos-auditoria)');
}
for (const [id, b] of [['casca', html], ...blocks]) {
  ok(!/Farmacopeia Brasileira,? \(?[1-7]ª/.test(b), id + ': Farmacopeia Brasileira em edição anterior à 8ª');
  ok(!/Farmacopeia Homeopática Brasileira,? \(?[1-3]ª/.test(b), id + ': Farmacopeia Homeopática Brasileira em edição anterior à 4ª');
}

if (falhas.length) { console.error('FALHA:\n  ' + falhas.join('\n  ')); process.exit(1); }
console.log('Regras OK: Lei 13.725 (artigos e irregularidades), Para saber mais com fonte, Farmacopeia vigente, cache do PWA e versão ' + v + '.');
