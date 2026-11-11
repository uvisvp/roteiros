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
let feito = false;
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== ID) return m;
  feito = true;
  const src = lz.decompressFromBase64(enc.trim());
  if (src.includes(MARCA)) return m;
  let s = src;
  for (const [de, para] of TROCAS) {
    if (s.split(de).length !== 2) throw Error('Trecho não localizado de forma única: ' + de.slice(0, 60));
    s = s.replace(de, () => para);
  }
  new Function(s);
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + ID);
  return a + novo + z;
});
if (!feito) throw Error('Bloco não localizado: ' + ID);
fs.writeFileSync(file, html);
console.log('rec--legis-v12.js: artigo repetido na fonte, citação no plural e itens de regulamento resolvidos.');
