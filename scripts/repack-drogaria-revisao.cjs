'use strict';
/* Drogaria — revisão do núcleo de medicamentos:
   1. bloco rec--drogaria-relatorio-revisao.js (relatório sem lacunas, sem
      títulos vazios e com numeração sequencial), carregado após o relatório final;
   2. faixa e grade de itens sem numeração dupla (“1 · 4.1”): o número do
      item vem do próprio título quando ele já é numerado.
   Idempotente. Uso: node scripts/repack-drogaria-revisao.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..');
const file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
function change(text, from, to, label) {
  if (text.includes(to)) return text;
  if (!text.includes(from)) throw Error('Trecho esperado não localizado: ' + label);
  return text.replace(from, () => to);
}
for (const [id, arq] of [['rec--drogaria-relatorio-revisao.js', 'drogaria-relatorio-revisao.js'], ['rec--saber-mais.js', 'saber-mais.js'], ['rec--drogaria-report-final.js', 'drogaria-report-final.js'], ['rec--drogaria-final-bridge.js', 'drogaria-final-bridge.js'], ['rec--drogaria-review.js', 'drogaria-review.js'], ['rec--drogaria-ocr-tools.js', 'drogaria-ocr-tools.js'], ['rec--drogaria-section1.js', 'drogaria-section1.js'], ['rec--drogaria-servicos-documentos.js', 'drogaria-servicos-documentos.js'], ['rec--ocr-padrao.js', 'ocr-padrao.js'], ['rec--medicamentos-banco.js', 'medicamentos-banco.js'], ['rec--drogaria-ocr-politica.js', 'drogaria-ocr-politica.js']]) {
  const src = fs.readFileSync(path.join(root, arq), 'utf8');
  const enc = lz.compressToBase64(src);
  if (lz.decompressFromBase64(enc) !== src) throw Error('round-trip ' + arq);
  const tag = '<script type="text/plain" id="' + id + '">' + enc + '</script>';
  const re = new RegExp('<script type="text/plain" id="' + id.replace(/\./g, '\\.') + '">[\\s\\S]*?</script>');
  if (re.test(html)) html = html.replace(re, () => tag);
  else html = change(html, '<script type="text/plain" id="rec--drogaria-report-final.js">', tag + '\n<script type="text/plain" id="rec--drogaria-report-final.js">', 'posição do bloco ' + arq);
}
{ const alvo = "'drogaria-report-final.js','saber-mais.js','drogaria-relatorio-revisao.js','ocr-padrao.js','medicamentos-banco.js','drogaria-ocr-politica.js'].forEach";
  if (!html.includes(alvo)) {
    for (const de of ["'drogaria-report-final.js','saber-mais.js','drogaria-relatorio-revisao.js','ocr-padrao.js','drogaria-ocr-politica.js'].forEach", "'drogaria-report-final.js','saber-mais.js','drogaria-relatorio-revisao.js'].forEach", "'drogaria-report-final.js','drogaria-relatorio-revisao.js'].forEach", "'drogaria-report-final.js'].forEach"]) if (html.includes(de)) { html = html.replace(de, () => alvo); break; }
    if (!html.includes(alvo)) throw Error('carregador da Drogaria não localizado');
  } }
/* numeração dupla */
html = change(html, `return '<button type="button" class="drg-item-card" data-drg-item="'+esc(x.id)+'"><span class="drg-item-number">'+(i+1)+'</span><strong>'+esc(x.title)+'</strong>'`,
  `var drgN=/^(\\d+(?:\\.\\d+)+)\\s+(.*)$/.exec(x.title||'');return '<button type="button" class="drg-item-card" data-drg-item="'+esc(x.id)+'"><span class="drg-item-number">'+(drgN?drgN[1]:(i+1))+'</span><strong>'+esc(drgN?drgN[2]:x.title)+'</strong>'`, 'grade de itens');
{ /* faixa de itens da Drogaria (a mesma sequência de texto existe na Distribuidora) */
  const ancora = `data-drg-item="'+esc(x.id)+'" style="flex:0 0 auto;white-space:nowrap;`;
  const i = html.indexOf(ancora); if (i < 0) throw Error('faixa de itens da Drogaria não localizada');
  const velho = `+(k+1)+' · '+esc(x.title)+'</button>'`, novo = `+(/^\\d+(?:\\.\\d+)+\\s/.test(x.title||'')?esc(x.title):(k+1)+' · '+esc(x.title))+'</button>'`;
  const j = html.indexOf(velho, i), k2 = html.indexOf(novo, i), fim = html.indexOf('</button>', i) + 12;
  if (!(k2 >= 0 && k2 < fim)) { if (j < 0 || j > fim) throw Error('rótulo da faixa da Drogaria não localizado'); html = html.slice(0, j) + novo + html.slice(j + velho.length); }
}
/* Conferência de estoque: registro de 13 dígitos (registro + apresentação, como impresso na
   embalagem) consulta pelo registro do produto (9 primeiros); a apresentação e o laboratório
   vindos da CMED (consulta por EAN) entram no campo “Produto / apresentação”. */
{ const id = 'app--drogaria';
  const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação ' + id);
  const troca = (de, para, rot) => { if (app.includes(para)) return; if (!app.includes(de)) throw Error('Trecho não localizado: ' + rot); app = app.replace(de, () => para); };
  troca("let results;if(queryTarget.startsWith('stock:')&&gtinValid(n)){",
    "let results;const n9=queryTarget.startsWith('stock:')&&n.length===13&&/^1/.test(n)?n.slice(0,9):'';if(n9){const man=await getVisaManifest(),prefix=Number(man.bases?.medicamentos?.prefixo_fragmento||man.bases?.medicamentos?.prefixo||4),data=await visaJSON('medicamentos/'+n9.slice(0,prefix)+'.json');results=(data||[]).filter(x=>digits(x.registro)===n9).map(x=>({...x,_base:'medicamentos',registro_apresentacao:n}))}else if(queryTarget.startsWith('stock:')&&gtinValid(n)){", 'busca por registro de 13 dígitos');
  troca("name:firstVal(x,['produto','nome_produto','nome_comercial','nome']),registro:x.registro||'',",
    "name:[firstVal(x,['produto','nome_produto','nome_comercial','nome']),x.apresentacao].filter(Boolean).join(' — '),registro:x.registro_apresentacao||x.registro||'',", 'apresentação no nome');
  troca("fabricante:firstVal(x,['fabricante','empresa','razao_social','detentor'])",
    "fabricante:firstVal(x,['fabricante','laboratorio','empresa','razao_social','detentor'])", 'laboratório');
  /* OCR da embalagem (estoque): lê EAN, registro Anvisa (só dígitos) e processo; ao aplicar, já consulta o banco. */
  troca(" if(target.startsWith('stock:')){const candidates=text.match(/\\b\\d{8,14}\\b/g)||[];return {ean:candidates.find(gtinValid)||'',registro:(text.match(/(?:registro|MS)\\s*[:.]?\\s*([\\d. -]{9,20})/i)||[])[1]||'',name:'',lote:(text.match(/(?:lote|lot)\\s*[:.]?\\s*([A-Z0-9-]+)/i)||[])[1]||'',nf:''}}",
    " if(target.startsWith('stock:')){const candidates=text.match(/\\b\\d{8,14}\\b/g)||[];const ean=candidates.find(x=>x.length>=12&&/^7/.test(x)&&gtinValid(x))||candidates.find(gtinValid)||'';const rg=(text.match(/(?:reg(?:istro)?\\.?\\s*(?:no?\\s*)?(?:m\\.?\\s?s\\.?|anvisa)?|\\bm\\.?\\s?s\\.?)\\s*(?:n[º°o.]*)?\\s*[:.\\-]?\\s*(\\d[\\d .\\-]{7,20}\\d)/i)||[])[1]||'';const pr=(text.match(/\\b(25\\d{3}[.\\s]?\\d{6}[\\/\\s]?\\d{4}[-\\s]?\\d{2})\\b/)||[])[1]||'';return {ean,registro:rg.replace(/\\D/g,'').slice(0,13),processo:pr.replace(/\\D/g,''),name:'',lote:(text.match(/(?:lote|lot)\\s*[:.]?\\s*([A-Z0-9-]+)/i)||[])[1]||'',nf:''}}", 'OCR da embalagem');
  troca("registro:'Registro Anvisa',texto:'Texto reconhecido'}", "registro:'Registro Anvisa',processo:'Processo Anvisa',texto:'Texto reconhecido'}", 'rótulo do processo');
  troca("save();byId('modal').close();render();if(ocrTarget.startsWith('supplier:')&&validateCnpj(ocrFields.cnpj))",
    "save();byId('modal').close();render();if(ocrTarget.startsWith('stock:')&&(ocrFields.ean||ocrFields.registro||ocrFields.processo)){const alvo=ocrTarget;setTimeout(async()=>{openQuery(alvo);await productSearch()},60)}if(ocrTarget.startsWith('supplier:')&&validateCnpj(ocrFields.cnpj))", 'consulta automática após OCR');
  /* Apresentações por registro (índice apresentacoes_registro, da CMED): a consulta do estoque
     por registro de 9 dígitos lista uma linha por apresentação; com 13 dígitos, só a apresentação
     impressa na embalagem. */
  troca("async function productSearch(){",
    "async function expandeApresentacoes(rs,n){if(!queryTarget.startsWith('stock:'))return rs;const out=[];for(const x of rs){if(x.apresentacao||x._base!=='medicamentos'){out.push(x);continue}const reg=digits(x.registro);let aps=[];try{const d=await visaJSON('indices/apresentacoes_registro/'+reg.slice(0,4)+'.json');aps=(d&&d[reg])||[]}catch(e){}if(n.length===13){const f=aps.filter(a=>a.registro_apresentacao===n);if(f.length)aps=f}if(!aps.length){out.push(x);continue}aps.forEach(a=>{const e=(a.eans||[]).map(v=>String(v).replace(/^0+(?=\\d{13}$)/,'')).find(v=>/^7/.test(v))||'';out.push({...x,apresentacao:a.apresentacao,registro_apresentacao:a.registro_apresentacao,laboratorio:a.laboratorio||x.laboratorio,ean:e||x.ean})})}return out}\nasync function productSearch(){", 'função de apresentações');
  troca("queryResults=results;state.queries.push({kind:queryTarget,value:n,",
    "results=await expandeApresentacoes(results,n);queryResults=results;state.queries.push({kind:queryTarget,value:n,", 'expande apresentações');
  troca("<strong>${esc(firstVal(x,['produto','nome_produto','nome_comercial','nome']))}</strong><small>Registro ${esc(x.registro)}",
    "<strong>${esc(firstVal(x,['produto','nome_produto','nome_comercial','nome']))}</strong>${x.apresentacao?`<small>${esc(x.apresentacao)}${x.registro_apresentacao?' · reg. apres. '+esc(x.registro_apresentacao):''}${x.laboratorio?' · '+esc(x.laboratorio):''}</small>`:''}<small>Registro ${esc(x.registro)}", 'apresentação na lista');
  const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]);
}
fs.writeFileSync(file, html);
console.log('Drogaria: revisão do relatório e da numeração aplicada.');
