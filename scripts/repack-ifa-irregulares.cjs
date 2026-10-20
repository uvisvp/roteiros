'use strict';
/* Conferência de IFA da distribuidora (rec--insumo-check.js), fase 4: a consulta a
   produtos irregulares só carregava o manifesto e mandava conferir à mão. Passa a buscar
   de fato, pelos mesmos índices da Central de Consultas: CNPJ do fornecedor
   (indices/irregulares_cnpj) e lotes informados — declarado, do certificado, da nota e
   da embalagem (indices/irregulares_lote, só correspondência exata). Pedido de 20/10/2026.
   Idempotente. Rodar depois de repack-sem-alertas. Uso: node scripts/repack-ifa-irregulares.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const ID = 'rec--insumo-check.js';

function troca(s, de, para, rotulo) {
  if (s.includes(para)) return s;
  if (!s.includes(de)) throw Error('Trecho não localizado: ' + rotulo);
  return s.split(de).join(para);
}

const CONSULTA_DE = `  function consultarFase4() {
    st.busca4 = { rodando: true };
    pintar();
    Promise.all([
      baixaPrimeiro(['produtos_irregulares/manifest.json'])
    ]).then(function (r) {
      st.busca4 = {
        rodando: false,
        feita: new Date().toLocaleString('pt-BR'),
        irregOk: !!r[0],
        irregManifest: r[0] || null
      };
      pintar();
    });
  }`;
const CONSULTA_PARA = `  /* Produtos irregulares pelos índices da base (os mesmos da Central de Consultas):
     CNPJ do fornecedor e lotes informados, só correspondência exata. */
  function chaveLote(t) { return norm(t).replace(/ /g, ''); }
  function dataIso(v) { var m = /^(\\d{4})-(\\d{2})-(\\d{2})/.exec(String(v || '')); return m ? m[3] + '/' + m[2] + '/' + m[1] : ''; }
  function consultarFase4() {
    var d = st.d, cnpj = soDig(d.cnpj), lotes = [];
    [d.lote, d.coaLote, d.nfLote, d.estoqueLote].forEach(function (l) {
      var k = chaveLote(l);
      if (k.length >= 3 && lotes.indexOf(k) < 0) lotes.push(k);
    });
    st.busca4 = { rodando: true };
    pintar();
    var tarefas = [];
    if (cnpj.length === 14 && !/^0+$/.test(cnpj)) tarefas.push(baixa('indices/irregulares_cnpj/' + cnpj.slice(0, 3) + '.json').then(function (idx) {
      return { ok: !!idx, por: 'CNPJ do fornecedor', refs: (idx && idx[cnpj]) || [] };
    }));
    lotes.forEach(function (k) {
      tarefas.push(baixa('indices/irregulares_lote/' + k.slice(0, 2) + '.json').then(function (idx) {
        return { ok: !!idx, por: 'lote ' + k.toUpperCase(), refs: (idx && idx[k]) || [] };
      }));
    });
    Promise.all(tarefas).then(function (rs) {
      var porProcesso = {};
      rs.forEach(function (r) {
        r.refs.forEach(function (ref) {
          var p = soDig(typeof ref === 'string' ? ref : (ref.p || ref.processo || ref.r));
          if (!p) return;
          (porProcesso[p] = porProcesso[p] || []).indexOf(r.por) < 0 && porProcesso[p].push(r.por);
        });
      });
      var processos = Object.keys(porProcesso).slice(0, 20);
      return Promise.all(processos.map(function (p) {
        return baixa('produtos_irregulares/' + p.slice(5, 8) + '.json').then(function (j) {
          var x = j && j[p];
          if (!x) return null;
          var prods = Array.isArray(x.produtos) ? x.produtos : [];
          var e = x.empresa && typeof x.empresa === 'object' ? x.empresa : {};
          return {
            processo: p, por: porProcesso[p].join(' e '),
            produto: prods.map(function (y) { return y && y.produto; }).filter(Boolean).slice(0, 3).join(' · ') || x.produto_resumo || 'Produto com medida fiscal',
            empresa: e.razao_social || '', acoes: x.acoes_resumo || '',
            data: dataIso(x.data_ultima_medida), aviso: x.observacao || ''
          };
        });
      })).then(function (itens) {
        st.busca4 = {
          rodando: false,
          feita: new Date().toLocaleString('pt-BR'),
          semChave: !tarefas.length,
          irregOk: rs.length > 0 && rs.every(function (r) { return r.ok; }),
          pesquisado: rs.map(function (r) { return r.por; }),
          achados: itens.filter(Boolean),
          total: Object.keys(porProcesso).length
        };
        pintar();
      });
    });
  }`;

const RESULT_DE = `    out += sit(b.irregOk ? 'pend' : 'na', b.irregOk ? '\\u26A0' : '\\u25CB',
      'Produtos irregulares: consulta por fragmentos',
      b.irregOk
        ? 'O manifesto foi carregado, mas a base é fragmentada em centenas de arquivos e não expõe índice de busca direta. Consulte em dados/produtos_irregulares/ antes de concluir.'
        : 'Base indisponível no momento.');
`;
const RESULT_PARA = `    if (b.semChave) out += sit('na', '\\u25CB', 'Produtos irregulares não pesquisados',
      'Informe o CNPJ do fornecedor ou um lote (declarado, do certificado, da nota ou da embalagem).');
    else if (!b.irregOk && !b.achados.length) out += sit('na', '\\u25CB', 'Produtos irregulares não puderam ser consultados', 'Base indisponível no momento. Indisponibilidade não é ausência de medida.');
    else if (!b.achados.length) out += sit('ok', '\\u2713', 'Nenhuma medida fiscal localizada',
      'Pesquisado por ' + esc(b.pesquisado.join(', ')) + ' nos produtos irregulares da Anvisa. Não localizar não atesta regularidade.');
    else out += b.achados.map(function (x) {
      return sit('inc', '\\u25CF', 'Medida fiscal: ' + esc(x.produto),
        'Localizada por ' + esc(x.por) + '. Processo ' + esc(x.processo) + (x.empresa ? '<br>Empresa: ' + esc(x.empresa) : '') +
        (x.acoes ? '<br>Medidas: ' + esc(x.acoes) : '') + (x.data ? '<br>Última medida: ' + esc(x.data) : '') +
        (x.aviso ? '<br>' + esc(x.aviso) : '') +
        '<br>Analisar no contexto: confirme se o produto e o lote são os mesmos do insumo inspecionado.');
    }).join('') + (b.total > b.achados.length ? '<p class="mini">Mostrando ' + b.achados.length + ' de ' + b.total + ' processos. Veja todos na Central de Consultas.</p>' : '');
`;

let feito = false;
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== ID) return m;
  feito = true;
  const src = lz.decompressFromBase64(enc.trim());
  let s = troca(src, CONSULTA_DE, CONSULTA_PARA, 'consulta da fase 4');
  s = troca(s, RESULT_DE, RESULT_PARA, 'resultado da fase 4');
  s = troca(s, "nome: 'Produtos irregulares',\n      nota: 'Resultado é analisado no contexto; não se estende a todos os lotes da empresa sem correspondência.' }",
    "nome: 'Produtos irregulares',\n      nota: 'Busca pelo CNPJ do fornecedor e pelos lotes informados. Resultado é analisado no contexto; não se estende a todos os lotes da empresa sem correspondência.' }", 'nota da base');
  try { new Function(s); } catch (e) { throw Error('JS inválido em ' + ID + ': ' + e.message); }
  if (s === src) return m;
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + ID);
  return a + novo + z;
});
if (!feito) throw Error('Bloco não localizado: ' + ID);
fs.writeFileSync(file, html);
console.log('Conferência de IFA: produtos irregulares por CNPJ do fornecedor e por lote.');
