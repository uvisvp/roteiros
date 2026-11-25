'use strict';
/* Atacadista de medicamentos: documentos nos modelos oficiais da Anvisa (POP-O-SNVS-011 rev. 3,
   Anexos I, II e III; POP-O-SNVS-023 rev. 6, Anexo II) e revisão do roteiro.
   1. Injeta distribuidora-modelos.js no fim da região de documentos do bloco do aplicativo
      (entre marcadores próprios). As funções de mesmo nome declaradas ali prevalecem sobre as
      anteriores: ddAnexoIMontar, ddAnexo2Nodes, exportAnexo2, exportPeer, exportAlert, ddPrevia,
      exportFinal e ddNcTexto.
   2. Motor do Word (ddTbl, ddNodeXml, ddNodeHtml, ddPackage), por troca pontual:
      - tabela sem bordas (o.nb), cabeçalho sem sombreamento (o.hf), célula mesclada na vertical
        (c.vm) e célula sem algumas bordas (c.sb);
      - rodapé com o texto do modelo e “Página X de Y” na linha de baixo (o.rodape), ou só o
        texto (o.rodapeSo), como nos anexos publicados.
   Não usar scripts/repack-distribuidora-docs.cjs: ele reinjeta as fontes antigas e apaga as
   trocas feitas pelos outros scripts dentro da região.
      3. Injeta também distribuidora-xivh.js (licença inicial pelo Formulário XIV.H), na mesma região.
   Idempotente. Uso: node scripts/repack-atacadista-modelos.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const ID = 'app--distribuidoras-transportadoras';
const INI = '/*__DIST_MODELOS_INICIO__*/', FIM = '/*__DIST_MODELOS_FIM__*/', ANCORA = '/*__DIST_DOCS_FIM__*/';
const modelos = fs.readFileSync(path.join(root, 'distribuidora-modelos.js'), 'utf8');
new Function('state', 'DATA', 'document', 'window', modelos.replace(/\ndmRoteiro\(\);[\s\S]*$/, ''));
/* Formulário XIV.H (trilha “xivh”, card “Atacadista — licença inicial”): só compila aqui, roda no bloco */
const xivh = fs.readFileSync(path.join(root, 'distribuidora-xivh.js'), 'utf8');
new Function(xivh.replace(/\nxhIniciar\(\);[\s\S]*$/, ''));
/* Gases medicinais (classe 20): perguntas específicas de gás reaproveitadas do card de Gases
   (medicamentos/roteiros/gases-medicinais.cjs), com a citação montada pelo gases/legislacao.json.
   Ficam fora as que repetem a base do Atacadista e as de dispensação (fora do Formulário XIV.H). */
const GAS = require(path.join(root, 'medicamentos', 'roteiros', 'gases-medicinais.cjs'));
const GLEG = JSON.parse(fs.readFileSync(path.join(root, 'gases', 'legislacao.json'), 'utf8'));
const gq = id => { for (const s of GAS.secoes) for (const i of s.itens) for (const q of i.perguntas || []) if (q.id === id) return q; throw Error('gases: pergunta ' + id); };
const glegal = r => { const ids = r.filter(x => !r.some(y => y !== x && y.startsWith(x + '::'))); return ids.map(x => { const L = GLEG[x]; if (!L) throw Error('gases: citação ' + x); return L.norma + ', ' + L.disp; }).join('; '); };
const GSEC = [
  ['xh-gas-reg', '11.2', 'Gases medicinais — autorização, fornecedores, clientes e produtos', 'gas', ['afe', 'fornecedores', 'clientes', 'regularizados*', 'entre_distrib', 'envase', 'industrial']],
  ['xh-gas-areas', '9.2', 'Gases medicinais — áreas, recebimento e armazenagem', 'gas', ['areas_minimas', 'segregacao', 'ventilacao', 'pragas', 'conferencia', 'avariados*']],
  ['xh-gas-rast', '11.3', 'Gases medicinais — rastreabilidade, lacres, rotulagem, devoluções e recolhimento', 'gas', ['sistema', 'devolucoes', 'furto', 'notas*', 'lacre*', 'rotulo*', 'cilindros*', 'simulacao*']],
  ['xh-gas-transp', '10', 'Gases medicinais — transporte', 'gas-trp', ['segregacao_transp', 'instrucoes', 'veiculos', 'sinistro', 'registro_transp*', 'entrega_limpa*']]
];
const XH_GAS = GSEC.map(([id, item, title, quando, ids]) => ({ id, item, title, quando, q: ids.map(k => { const reg = k.endsWith('*'), q = gq(k.replace('*', '')); return ['xg-' + q.id, q.t, glegal(q.r || []), String(q.nc).replace(/\.\s*$/, ''), reg ? 1 : 0]; }) }));
const fonte = modelos.trimEnd() + '\nconst XH_GAS_SECOES=' + JSON.stringify(XH_GAS) + ';\n' + xivh;

const TROCAS = [
  /* ddTbl */
  ["const fill=c.fill||(head?'E7EEF3':'');",
   "const fill=c.fill||(head?(o.hf??'E7EEF3'):'');"],
  ["${span>1?`<w:gridSpan w:val=\"${span}\"/>`:''}${fill?",
   "${span>1?`<w:gridSpan w:val=\"${span}\"/>`:''}${c.vm?`<w:vMerge${c.vm===1?' w:val=\"restart\"':''}/>`:''}${c.sb?`<w:tcBorders>${['t','l','b','r'].filter(k=>c.sb.includes(k)).map(k=>`<w:${({t:'top',l:'left',b:'bottom',r:'right'})[k]} w:val=\"nil\"/>`).join('')}</w:tcBorders>`:''}${fill?"],
  ["map(b=>`<w:${b} w:val=\"single\" w:sz=\"4\" w:space=\"0\" w:color=\"000000\"/>`).join('')}</w:tblBorders>",
   "map(b=>`<w:${b} w:val=\"${o.nb?'nil':'single'}\" w:sz=\"4\" w:space=\"0\" w:color=\"000000\"/>`).join('')}</w:tblBorders>"],
  /* ddNodeXml / ddNodeHtml */
  ["if(n.k==='tbl')return ddTbl(n.cols,n.rows,{head:n.head});",
   "if(n.k==='tbl')return ddTbl(n.cols,n.rows,Object.assign({head:n.head},n.o||{}));"],
  ["if(n.k==='tbl')return '<table class=\"dd-tbl\">'+",
   "if(n.k==='tbl')return '<table class=\"dd-tbl'+(n.o&&n.o.nb?' nb':'')+'\">'+"],
  /* ddPackage: rodapé */
  ["<w:p><w:pPr><w:jc w:val=\"right\"/></w:pPr>${ddRun((o.footer?o.footer+' · ':'')+'Página ',{sz:8})}${fld('PAGE')}${ddRun(' de ',{sz:8})}${fld('NUMPAGES')}</w:p></w:ftr>`;",
   "<w:p><w:pPr><w:jc w:val=\"right\"/></w:pPr>${o.rodapeSo?ddRun(o.rodapeSo,{sz:8}):(o.rodape?ddRun(o.rodape+'\\n',{sz:8})+ddRun('Página ',{sz:8,b:true}):ddRun((o.footer?o.footer+' · ':'')+'Página ',{sz:8}))+fld('PAGE')+ddRun(' de ',{sz:8})+fld('NUMPAGES')}</w:p></w:ftr>`;"],
  /* Situação da NC e estratégia de monitoramento: marcadas na análise do plano de ação, que o
     POP-O-SNVS-011 (item 8.3) manda registrar no próprio Anexo II. Na comunicação ao fim da
     inspeção, esses campos saem em branco; a exigência passa para o relatório final. */
  ["out.push('NC nº '+(i+1)+': evidência não registrada.');if(!d.status)out.push('NC nº '+(i+1)+': marque a situação (Finalizada ou Em andamento).');if(!d.monitor)out.push('NC nº '+(i+1)+': marque a estratégia de monitoramento.')})",
   "out.push('NC nº '+(i+1)+': evidência não registrada.')})"],
  ["Revise a redação, a evidência, a categorização, a situação e a estratégia de monitoramento antes de emitir.",
   "Revise a redação, a evidência e a categorização antes de emitir. A situação da NC e a estratégia de monitoramento são marcadas depois, na análise do plano de ação (POP-O-SNVS-011, item 8.3); até lá o Anexo II sai com esses campos em branco."],
  ["${selectLike(n.id,'status','Situação da NC',['Finalizada','Em andamento'],d.status)}${selectLike(n.id,'monitor','Estratégia de monitoramento',['Avaliação documental','Inspeção de acompanhamento','Próxima inspeção planejada de BPDAIT conforme POP-O-SNVS-031','Sem necessidade de monitoramento'],d.monitor)}</div><div class=\"toolbar\"><button class=\"btn\" data-nc-compose=",
   "</div><p class=\"mini\">Situação da NC e estratégia de monitoramento: marcadas na aba Análise do plano de ação.</p><div class=\"toolbar\"><button class=\"btn\" data-nc-compose="],
  ["issues.push(n.id+': registre a análise do plano, responsável e data.');",
   "issues.push(n.id+': registre a análise do plano, responsável e data.');if(!d.status||!d.monitor)issues.push(n.id+': marque a situação da NC e a estratégia de monitoramento na análise do plano.');"]
];

let feito = false;
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== ID) return m;
  feito = true;
  const src = lz.decompressFromBase64(enc.trim());
  let s = src;
  for (const [de, para] of TROCAS) {
    if (s.includes(para)) continue;
    if (s.split(de).length !== 2) throw Error('Trecho não localizado de forma única: ' + de.slice(0, 70));
    s = s.replace(de, () => para);
  }
  const i = s.indexOf(INI), j = s.indexOf(FIM);
  if (i >= 0 && j > i) s = s.slice(0, i) + s.slice(j + FIM.length).replace(/^\n/, '');
  const k = s.indexOf(ANCORA);
  if (k < 0 || s.indexOf(ANCORA, k + 1) >= 0) throw Error('Âncora da região de documentos não localizada de forma única');
  s = s.slice(0, k) + INI + '\n' + fonte.trimEnd() + '\n' + FIM + '\n' + s.slice(k);
  if (s === src) return m;
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + ID);
  return a + novo + z;
});
if (!feito) throw Error('Bloco não localizado: ' + ID);
/* Casca (fora do bloco): o progresso dos cartões das etapas seguia uma lista fixa de blocos por etapa;
   passa a seguir DIST_CARDS, que muda com o modo XIV.H (etapa 8) e com a importação de insumos. */
{
  const DE = 'var n=Number(card.dataset.distCard),ids=grupos[n-1]||[]';
  const PARA = "var n=Number(card.dataset.distCard),ids=(typeof DIST_CARDS!=='undefined'&&DIST_CARDS[n-1]?DIST_CARDS[n-1][1]:grupos[n-1])||[]";
  if (!html.includes(PARA)) {
    if (html.split(DE).length !== 2) throw Error('Casca: progresso das etapas não localizado de forma única');
    html = html.replace(DE, () => PARA);
  }
}
fs.writeFileSync(file, html);
console.log('Atacadista: documentos nos modelos da Anvisa e roteiro revisado.');
