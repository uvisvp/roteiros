'use strict';
/* Manipulação v2 (12 blocos): troca APP_DATA, injeta farmacia-manipulacao-v2.js,
   remove as funções substituídas e ajusta a casca (itens, fotos, limpeza total).
   Idempotente: pode ser executado de novo sobre o index.html já convertido.
   Uso: python3 scripts/manipulacao-v2/build_data.py && node scripts/repack-manipulacao-v2.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..');
const file = path.join(root, 'index.html');
let {html, blocks, lz} = unpack(file);

function change(text, from, to, label) {
  if (text.includes(to)) return text;
  if (!text.includes(from)) throw Error('Trecho esperado não localizado: ' + (label || String(from).slice(0, 100)));
  return text.replace(from, () => to);
}
/* Remove a declaração "function nome(" inteira, contando chaves (ignora strings e templates simples). */
function dropFunction(src, name) {
  const re = new RegExp('(^|\\n)(async )?function ' + name + '\\(', 'g');
  const m = re.exec(src);
  if (!m) return src;
  const start = m.index + m[1].length;
  let i = src.indexOf('{', start), depth = 0, q = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) break;
  }
  return src.slice(0, start) + src.slice(i + 1);
}

let app = blocks.get('app--farmacia-manipulacao');
const data = fs.readFileSync(path.join(root, 'farmacia-manipulacao-v2-dados.json'), 'utf8');
JSON.parse(data);
/* 1. Dados */
app = app.replace(/const APP_DATA=\{[^\n]*\};?\n/, () => 'const APP_DATA=' + data.replace(/<\/(script)/gi, '<\\/$1') + ';\n');
if (!app.includes('"structure":"12 blocos"')) throw Error('APP_DATA não substituído');
/* 2. Funções substituídas pela v2 */
const START = '/*__MANIP_V2_INICIO__*/', END = '/*__MANIP_V2_FIM__*/';
const i0 = app.indexOf(START);
if (i0 >= 0) app = app.slice(0, i0) + app.slice(app.indexOf(END) + END.length);
for (const fn of ['conditionActive', 'renderCardGrid', 'pharmacyClear', 'renderInfra', 'renderPreview', 'inventoryType', 'inventoryNormButtons', 'openReader'])
  app = dropFunction(app, fn);
/* 3. Código v2 antes da instalação */
const code = ['saber-mais.js', 'drogaria-ocr-tools.js', 'ocr-padrao.js', 'farmacia-manipulacao-v2.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
const anchor = '\npharmacyInstall();\nrenderCardGrid();';
app = change(app, anchor, '\n' + START + '\n' + code + '\n' + END + anchor, 'instalação do módulo');
/* 4. (removido) o leitor antigo foi substituído por openReader do OCR padronizado (farmacia-manipulacao-v2.js) */
/* 5. Fotos: invalida o cache do anexo fotográfico */
app = change(app, "await MedTools.photo('manipulacao-card-'+state.openCard,b.dataset.medPhoto,()=>toast('Fotos atualizadas.'))",
  "await MedTools.photo('manipulacao-card-'+state.openCard,b.dataset.medPhoto,()=>{v2InvalidarFotos();toast('Fotos atualizadas.')})", 'fotos');
/* 6. Relatório carrega fotos ao abrir a aba */
app = change(app, 'if(name==="relatorio"){renderReportForm();renderPreview()}', 'if(name==="relatorio"){renderReportForm();v2InvalidarFotos();renderPreview()}', 'aba relatório');
/* 7. Texto do inventário */
app = app.replace('Inventário da aba <b>Manipulação</b> da planilha de penalidades. A numeração do inventário é do Anexo VII; a capitulação do roteiro pode usar o Anexo I. A sugestão textual é apenas apoio e sempre exige conferência.',
  'Inventário revisado. Cada item mostra o item do <b>Roteiro de Inspeção (Anexo VII)</b>, com a classificação I/N/R (RT 5.20.4 a 5.20.6), e o dispositivo que cria a obrigação. Toque na citação para ler o texto oficial. A sugestão é apoio e sempre exige conferência.');
/* 7b. Formulário do relatório: texto e títulos sem numeração fixa */
app = app.replace(' requisito(s) marcado(s) como NC no roteiro. O relatório não transcreve respostas C uma a uma; ele consolida a caracterização e detalha as NCs.', ' requisito(s) marcado(s) como Não cumpre. O relatório transcreve Cumpre e Não cumpre por item, com as irregularidades numeradas e citadas.');
for (const [a, b] of [['<h3>4 · Documentação pendente', '<h3>Documentação pendente'], ['<h3>5 · Não conformidades', '<h3>Não conformidades'], ['<h3>6 · Considerações finais / avaliação de risco', '<h3>Considerações finais / avaliação de risco'], ['<h3>7 · Conclusão', '<h3>Conclusão'], ['<h3>8 · Medidas adotadas / documentos emitidos', '<h3>Medidas adotadas / documentos emitidos'], ['<h3>9 · Equipe inspetora', '<h3>Equipe inspetora']]) app = app.replace(a, b);
/* 7c. Fotos com marcador nos POPs e nos registros de treinamento */
app = change(app, '<button class="read-btn" data-reader="pop" data-target="pop:${key}">Ler POP</button>', '<button class="read-btn" data-reader="pop" data-target="pop:${key}">Ler POP</button> <button type="button" class="btn v2-photo" data-med-photo="pop:${key}" data-photo-label="2.2 Procedimentos Operacionais Padrão · ${esc(r.name)}">📷 Foto do POP</button>', 'foto do POP');
app = change(app, '<option ${r.efetividade==="NC"?"selected":""}>NC</option></select></label></div></details>', '<option ${r.efetividade==="NC"?"selected":""}>NC</option></select></label><label class="full"><button type="button" class="btn v2-photo" data-med-photo="trein:${i}" data-photo-label="2.3 Treinamento · registro ${i+1}${r.tema?" — "+esc(r.tema):""}">📷 Foto do registro de treinamento</button></label></div></details>', 'foto do treinamento');
/* 8. Estilo v2 (quebra de texto em tablet e componentes) */
const css = fs.readFileSync(path.join(root, 'farmacia-manipulacao-v2.css'), 'utf8');
app = app.replace(/<style id="man-v2-style">[\s\S]*?<\/style>/, '');
app = change(app, '</head>', '<style id="man-v2-style">' + css + '</style></head>', 'head');
blocks.set('app--farmacia-manipulacao', app);

/* Casca: itens com contexto, sem o item automático 1.1 antigo, limpeza total em 12 seções */
html = html.split("if(card===1)out.push({id:'extra-caracterizacao',num:'1.1',title:'Identificação e caracterização',fns:['renderCharacterization'],sections:[]});").join('');
if (html.includes("if(card===1)out.push({id:'extra-caracterizacao'")) throw Error('item 1.1 antigo permanece');
html = change(html, "return typeof window[nome]==='function'?window[nome]():''}", "return typeof window[nome]==='function'?window[nome](f,item):''}", 'exec com contexto');
html = change(html, "for(var k=1;k<=6;k++)await RoteiroEvidence.clear('manipulacao-card-'+k)", "for(var k=1;k<=12;k++)await RoteiroEvidence.clear('manipulacao-card-'+k)", 'limpeza total');

for (const [id, source] of [['app--farmacia-manipulacao', app]]) {
  const re = new RegExp('(<script type="text/plain" id="' + id + '">)[\\s\\S]*?(</script>)');
  const old = html.match(re); if (!old) throw Error(id);
  const encoded = lz.compressToBase64(source);
  if (lz.decompressFromBase64(encoded) !== source) throw Error('Falha de round-trip ' + id);
  html = html.replace(re, () => old[1] + encoded + old[2]);
}
fs.writeFileSync(file, html);
console.log('Manipulação v2 reempacotada no index.html.');
