'use strict';
/* Resolvedor de citações (rec--legis-v12.js) — três defeitos achados na auditoria do Atacadista:
   1. Artigo repetido na fonte. No banco v12, a menção do preâmbulo ("art. 15, III e IV ... da Lei
      nº 9.782") ficou com o identificador do artigo (…::artigo::15) e o artigo verdadeiro foi
      gravado como …::artigo::15::ocorrencia-2; o botão abria a menção do preâmbulo. Ocorre na
      RDC 430/2020 (arts. 15 e 53), RDC 359/2020, RDC 497/2021 e RDC 361/2020. Agora, se o nó
      simples não começa por "Art." e a ocorrência 2 começa, o identificador simples (e os filhos)
      aponta para a ocorrência 2.
   2. Citação no plural ("arts. 40 e 41", "arts. 72 a 76", "arts. 40, 72 a 74") não abria nada:
      a expressão só reconhecia "art.". Agora a lista é desdobrada artigo a artigo.
   3. Itens do regulamento técnico da RDC 204/2006: o banco grava …::regulamento-tecnico::inciso::
      dci::item::12-3-3 e o resolvedor procurava …::regulamento-tecnico::item::12-3-3; além disso,
      os números do nome da norma ("204", "14 de novembro") eram lidos como itens. Agora o
      identificador curto é aceito e só se leem os números depois de "Anexo"/"item".
   Idempotente. Uso: node scripts/repack-legis-resolvedor.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const ID = 'rec--legis-v12.js';
const MARCA = '/* resolvedor: artigo repetido, plural e itens de regulamento */';
const TROCAS = [
  ['j.nos.forEach(function (no) { mapa[no.id] = no; });',
   'j.nos.forEach(function (no) { mapa[no.id] = no; });\n        ' + MARCA + '\n'
   + "        j.nos.forEach(function (no) {\n"
   + "          var r = no.id.replace(/(::regulamento-tecnico)::inciso::[a-z]+(::item::)/, '$1$2');\n"
   + "          if (r !== no.id && !mapa[r]) mapa[r] = no;\n"
   + "          var k = no.id.indexOf('::ocorrencia-2');\n"
   + "          if (k < 0) return;\n"
   + "          var base = no.id.slice(0, k), raiz = mapa[base + '::ocorrencia-2'], simples = mapa[base];\n"
   + "          if (!raiz || !/^Art\\./.test(String(raiz.texto || ''))) return;\n"
   + "          if (simples && simples.ocorrencia === 1 && /^Art\\./.test(String(simples.texto || ''))) return;\n"
   + "          mapa[base + no.id.slice(k + 14)] = no;\n"
   + "        });"],
  ["if (regTec) {\n      return (dev.match(/\\d+(?:\\.\\d+)*/g) || [])",
   "if (regTec) {\n      return (dev.slice(Math.max(0, dev.search(/regulamento\\s+t|\\banexo\\b|\\bite(m|ns)\\b/i))).match(/\\d+(?:\\.\\d+)*/g) || [])"],
  ["var arts = [];\n    var reArt = /art\\.?\\s*(\\d+)/gi, mArt;",
   "dev = dev.replace(/arts\\.?\\s*((?:\\d+\\s*[º°]?\\s*(?:,|\\be\\b|\\ba\\b)?\\s*)+)/gi, function (m, lista) {\n"
   + "      var out = [], re = /(\\d+)\\s*[º°]?\\s*(,|e\\b|a\\b)?/g, x, de = null;\n"
   + "      while ((x = re.exec(lista))) {\n"
   + "        var n = +x[1];\n"
   + "        if (de !== null && n > de && n - de <= 15) { for (var q = de + 1; q <= n; q++) out.push(q); } else out.push(n);\n"
   + "        de = x[2] === 'a' ? n : null;\n"
   + "      }\n"
   + "      var cauda = (lista.match(/(?:,|\\be\\b|\\ba\\b)?\\s*$/) || [''])[0];\n"
   + "      return out.map(function (n) { return 'art. ' + n; }).join(', ') + (/,/.test(cauda) ? ', ' : ' ');\n"
   + "    });\n"
   + "    var arts = [];\n    var reArt = /art\\.?\\s*(\\d+)/gi, mArt;"]
];
/* 4. Roteiro de inspeção da RDC 67/2007 (Anexo VII) e demais anexos em quadro: o banco guarda cada linha do
      quadro em três blocos seguidos — o número (“18.1.1.”), a classificação (I, N, R ou INF) e o texto do item —,
      sem identificador de item. As 163 citações “Anexo VII · Item …” da Manipulação não abriam nada. No
      carregamento, cada trio vira um item (…::anexo-vii::anexo::vii::item::18-1-1) com o número, o texto e a
      classificação por extenso. (11/11/2026) */
const MARCA2 = '/* resolvedor: itens de anexo em quadro (número, classificação, texto) */';
const ANCORA2 = "          mapa[base + no.id.slice(k + 14)] = no;\n        });";
const QUADRO = ANCORA2 + "\n        " + MARCA2 + "\n"
  + "        var CLASSE = {I: 'imprescindível', N: 'necessário', R: 'recomendável', INF: 'informativo'};\n"
  + "        for (var qi = 0; qi + 1 < j.nos.length; qi++) {\n"
  + "          var nb = j.nos[qi], mb = /^(.+?::anexo-([ivx]+))::bloco::/.exec(nb.id), nu = String(nb.texto || '').trim();\n"
  + "          if (!mb || !/^\\d+(\\.\\d+)*\\.?$/.test(nu)) continue;\n"
  + "          var c1 = j.nos[qi + 1], c2 = j.nos[qi + 2], cl = c1 && String(c1.texto || '').trim(), temCl = !!CLASSE[cl];\n"
  + "          var tx = temCl ? c2 : c1;\n"
  + "          if (!tx || tx.id.indexOf(mb[1] + '::bloco::') !== 0 || /^\\d+(\\.\\d+)*\\.?$/.test(String(tx.texto || '').trim())) continue;\n"
  + "          var idItem = mb[1] + '::anexo::' + mb[2] + '::item::' + nu.replace(/\\.$/, '').replace(/\\./g, '-');\n"
  + "          if (mapa[idItem]) continue;\n"
  + "          mapa[idItem] = {id: idItem, norma: nb.norma, tipo: 'item', rotulo: 'Anexo ' + mb[2].toUpperCase() + ', item ' + nu.replace(/\\.$/, ''),\n"
  + "            texto: nu.replace(/\\.$/, '') + '. ' + String(tx.texto || '').trim() + (temCl ? ' (' + CLASSE[cl] + ')' : ''), status_vigencia: nb.status_vigencia};\n"
  + "        }";
let feito = false;
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== ID) return m;
  feito = true;
  const src = lz.decompressFromBase64(enc.trim());
  let s = src;
  if (!s.includes(MARCA)) for (const [de, para] of TROCAS) {
    if (s.split(de).length !== 2) throw Error('Trecho não localizado de forma única: ' + de.slice(0, 60));
    s = s.replace(de, () => para);
  }
  if (!s.includes(MARCA2)) {
    if (s.split(ANCORA2).length !== 2) throw Error('âncora do quadro não localizada');
    s = s.replace(ANCORA2, () => QUADRO);
  }
  if (s === src) return m;
  new Function(s);
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + ID);
  return a + novo + z;
});
if (!feito) throw Error('Bloco não localizado: ' + ID);
fs.writeFileSync(file, html);
console.log('rec--legis-v12.js: artigo repetido na fonte, citação no plural e itens de regulamento resolvidos.');
