'use strict';
/* Auditoria do núcleo Medicamentos (18/10/2026).
   Lei 13.725/2004 em toda irregularidade:
   - Drogaria: o item “11 Irregularidades observadas” saía só com a norma federal; passa a
     somar “Lei Municipal nº 13.725/2004, arts. 46 e 50” quando a referência não traz a Lei
     (rec--drogaria-report-final.js e rec--drogaria-review.js, e os arquivos-fonte).
   - Farmácia com manipulação: idem nas irregularidades do relatório (licença sanitária:
     art. 90, e § 1º quando a licença não contempla a atividade) e na capitulação da aba
     Infrações (Anexo VII da RDC 67/2007 + arts. 46 e 50). No roteiro, o botão da Lei só
     aparece quando a pergunta não tem norma específica (bloco app--farmacia-manipulacao e
     farmacia-manipulacao-v2.js).
   - Serviços assistenciais: o art. 22 que escapou do repack-lei13725 (“arts. 22 e 65” e
     “art. 22, II, da Lei”): elevador → art. 65; guarda de saneantes → art. 69.
   Gases medicinais: leiBase em gases/roteiro.cjs (repack-medicamentos).
   Livro de fotos (código herdado da Drogaria, também na Manipulação, no Atacadista e no
   EAC Tipo I): o arquivo levava “Drogaria” no nome em todos; passa a levar o título do
   roteiro, sem acento.
   “Para saber mais” (saber-mais.js, com fonte em cada linha): a cópia embutida nos blocos
   rec--saber-mais.js, app--farmacia-manipulacao e app--distribuidoras-transportadoras é
   trocada pelo arquivo atual.
   Farmacopeia Brasileira 8ª ed. (RDC nº 1.026/2026, em vigor desde 01/07/2026) no lugar da
   6ª ed. nas dicas da Manipulação (MED_HINTS) e nas orientações do núcleo.
   Idempotente. Uso: node scripts/repack-medicamentos-auditoria.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
function bloco(id, fn) {
  const re = new RegExp('(<script type="text/plain" id="' + id.replace(/[.]/g, '\\.') + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  const a = lz.decompressFromBase64(m[2].trim()); if (!a) throw Error('descompactação ' + id);
  const b = fn(a); if (b === a) return;
  const enc = lz.compressToBase64(b); if (lz.decompressFromBase64(enc) !== b) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]);
}
function fonte(nome, fn) { const p = path.join(root, nome), a = fs.readFileSync(p, 'utf8'), b = fn(a); if (b !== a) fs.writeFileSync(p, b); }
function troca(s, de, para, rot) {
  if (s.includes(para)) return s;
  if (s.split(de).length !== 2) throw Error(rot + ': esperava 1 ocorrência, achei ' + (s.split(de).length - 1));
  return s.replace(de, () => para);
}
const BASE = 'Lei Municipal nº 13.725/2004, arts. 46 e 50';

/* ---------- Drogaria ---------- */
const drogFinal = s => troca(s,
  "const legal=(r.refs||[]).map(id=>cat.referencias?.[id]).filter(Boolean).map(x=>`${x.norma}, ${x.dispositivo}`);if(legal.length)t+=' Fundamento: '+legal.join('; ')+'.';",
  "const legal=(r.refs||[]).map(id=>cat.referencias?.[id]).filter(Boolean).map(x=>`${x.norma}, ${x.dispositivo}`);/* toda irregularidade cita a Lei 13.725/2004 */if(!legal.some(x=>/13\\.725/.test(x)))legal.push('" + BASE + "');t+=' Fundamento: '+legal.join('; ')+'.';",
  'drogaria: relatório final');
const drogReview = s => troca(s,
  "' Fundamento: '+r.refs.map(id=>{const q=cat.referencias[id];return q.norma+', '+q.dispositivo;}).join('; ')+'.'",
  "' Fundamento: '+(f=>f.some(x=>/13\\.725/.test(x))?f:f.concat('" + BASE + "'))(r.refs.map(id=>{const q=cat.referencias[id];return q.norma+', '+q.dispositivo;})).join('; ')+'.'",
  'drogaria: revisão');
bloco('rec--drogaria-report-final.js', drogFinal); fonte('drogaria-report-final.js', drogFinal);
bloco('rec--drogaria-review.js', drogReview); fonte('drogaria-review.js', drogReview);

/* ---------- Farmácia com manipulação ---------- */
const L = require(path.join(root, 'legislacao', 'lei-municipal-13725-2004.json')).textos;
const TXT = [L['lei-municipal-13725-2004::artigo::46'], L['lei-municipal-13725-2004::artigo::50']].map(t => t.split('\n')[0]).join('\n');
const manip = s => {
  s = troca(s, "const irr=[];const addIrr=(texto,cit)=>{irr.push({texto,cit});return irr.length};",
    "const irr=[];const addIrr=(texto,cit)=>{irr.push({texto,cit:v2ComLei(texto,cit)});return irr.length};", 'manipulação: addIrr');
  /* versões anteriores deste trecho saem antes de inserir a atual */
  s = s.replace(/\/\* toda irregularidade cita a Lei 13\.725\/2004:[^\n]*\n(\/\*[^\n]*\*\/\n)*function v2ComLei\([^\n]*\n/g, '');
  s = troca(s, "function v2Cite(t){",
    "/* toda irregularidade cita a Lei 13.725/2004. Artigo pelo assunto da frase (sem o título do item):\n" +
    "   licença sanitária → art. 90 (§ 1º quando não contempla a atividade); CRT do responsável técnico → art. 93;\n" +
    "   guarda de controlados → art. 50, § 1º; estoque, escrituração, SNGPC, mapas e balanços → art. 50, § 2º; demais → arts. 46 e 50 */\n" +
    "function v2ComLei(texto,cit){cit=String(cit||'').trim().replace(/\\.$/,'');if(/13\\.725/.test(cit))return cit;const f=String(texto||'').replace(/^[^:]{0,140}:\\s*/,''),ctl=/controle especial|controlad|SNGPC|Portaria 344/i.test(f);" +
    "const art=/licen[çc]a sanit[áa]ria/i.test(f)?(/n[ãa]o (contempla|corresponde|est[áa] contemplad)/i.test(f)?'art. 90, § 1º':'art. 90'):/Certid[ãa]o de Regularidade T[ée]cnica/i.test(f)?'art. 93':ctl&&/chave|dispositivo de seguran[çc]a|arm[áa]rio|segregad/i.test(f)?'art. 50, § 1º':ctl&&/estoque|escritura|SNGPC|mapas e balan/i.test(f)?'art. 50, § 2º':'arts. 46 e 50';" +
    "return (cit?cit+'; ':'')+'Lei Municipal nº 13.725/2004, '+art}\n" +
    "function v2Cite(t){", 'manipulação: v2ComLei');
  s = troca(s, " return {a7,dev};\n}\nfunction infraCitacao(x)",
    " if(!dev.some(r=>/13\\.725/.test(r.law)))dev.push({law:'Lei Municipal nº 13.725/2004',device:'Arts. 46 e 50',text:" + JSON.stringify(TXT) + "});\n return {a7,dev};\n}\nfunction infraCitacao(x)", 'manipulação: infrações');
  return s;
};
bloco('app--farmacia-manipulacao', s => troca(manip(s), "function legalButtons(refs){const lista=refs||[];",
  "function legalButtons(refs){/* no roteiro, a Lei 13.725 só aparece quando não há norma específica */const todas=refs||[],lista=todas.some(r=>!/13\\.725/.test(r.law))?todas.filter(r=>!/13\\.725/.test(r.law)):todas;",
  'manipulação: botões'));
fonte('farmacia-manipulacao-v2.js', manip);

/* ---------- Serviços assistenciais: art. 22 restante ---------- */
bloco('app--servicos-assistenciais', s => s
  .split('Lei Municipal nº 13.725/2004, arts. 22 e 65, c/c').join('Lei Municipal nº 13.725/2004, art. 65, c/c')
  .split('"l":"art. 22, II, da Lei Municipal nº 13.725/2004"').join('"l":"art. 69 da Lei Municipal nº 13.725/2004"'));

/* ---------- livro de fotos: nome do arquivo pelo roteiro ---------- */
const FOTO_DE = "link.download = 'Fotografias_da_inspecao_Drogaria.doc';";
const FOTO_PARA = "link.download = 'Fotografias_da_inspecao_' + (String(document.title || 'inspecao').split(/ [—–-] /)[0].normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'inspecao') + '.doc';";
for (const id of [...require('./integrated-html.cjs').unpackText(html).blocks.keys()]) bloco(id, s => s.split(FOTO_DE).join(FOTO_PARA));
fonte('drogaria-ocr-tools.js', s => s.split(FOTO_DE).join(FOTO_PARA));

/* ---------- Para saber mais: blocos com a versão atual de saber-mais.js ---------- */
const SM = fs.readFileSync(path.join(root, 'saber-mais.js'), 'utf8');
const SM_INI = '/* ——— Para saber mais: conceitos e referências técnicas ———', SM_FIM = 'window.SaberMais={html,equip,dados:S,estilo};\n})();';
if (!SM.startsWith(SM_INI) || !SM.trimEnd().endsWith(SM_FIM)) throw Error('saber-mais.js: marcadores de início e fim');
if (/<\/script/i.test(SM)) throw Error('saber-mais.js com </script');
for (const id of ['rec--saber-mais.js', 'app--farmacia-manipulacao', 'app--distribuidoras-transportadoras']) bloco(id, s => {
  const i = s.indexOf(SM_INI), j = s.indexOf(SM_FIM, i);
  if (i < 0 || j < 0 || s.indexOf(SM_INI, i + 1) >= 0) throw Error(id + ': cópia do saber-mais.js não encontrada (ou duplicada)');
  return s.slice(0, i) + SM.trimEnd() + s.slice(j + SM_FIM.length);
});

/* ---------- Farmacopeia Brasileira: 8ª edição ---------- */
bloco('app--farmacia-manipulacao', s => s.split('(Farmacopeia Brasileira, 6ª ed., 5.2.1)').join('(Farmacopeia Brasileira, 8ª ed., 5.2.1)')
  /* orientações de estéreis (i13.1 e i13.11), injetadas uma vez pelo repack-medicamentos */
  .split('Farmacopeia Brasileira, 6ª ed. (esterilidade').join('Farmacopeia Brasileira, 8ª ed. (esterilidade')
  .split('além de teor e aspecto — Farmacopeia Brasileira, 6ª ed.').join('além de teor e aspecto — Farmacopeia Brasileira, 8ª ed.'));

/* nenhuma citação do art. 22 ou do art. 129, nem de artigo acima de 109, em qualquer forma */
const {blocks} = require('./integrated-html.cjs').unpackText(html);
const RUINS = [];
for (const [id, b] of blocks) {
  if (!/^(app|rec)--/.test(id)) continue;
  for (const m of b.matchAll(/13\.725(?:\/2004)?,?\s*arts?\.\s*(\d+)(?:\s*e\s*(\d+))?|arts?\.\s*(\d+)[^"\n;]{0,40}?da Lei Municipal nº 13\.725|lei-municipal-13725-2004(?:::artigo::|","node":"a)(\d+)/g)) {
    for (const a of [m[1], m[2], m[3], m[4]].filter(Boolean).map(Number)) if (a === 22 || a === 129 || a > 109) RUINS.push(id + ': art. ' + a);
  }
}
if (RUINS.length) throw Error('Lei 13.725 com artigo vedado:\n  ' + [...new Set(RUINS)].join('\n  '));

fs.writeFileSync(file, html);
console.log('Auditoria Medicamentos: Lei 13.725 (Drogaria, Manipulação, assistenciais), livro de fotos, Para saber mais e Farmacopeia 8ª ed.');
