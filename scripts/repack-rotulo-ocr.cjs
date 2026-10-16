'use strict';
/* Alimentos — leitura automática do rótulo (16/10/2026).
   - O leitor (página embutida no módulo como base64, OCR64) passa a ter fonte
     própria: rotulagem-ocr.html. Mudanças: binarização com polaridade local
     (texto claro em fundo escuro), remoção das linhas da tabela, ampliação de
     foto pequena, 2 a 3 passes de leitura, tabela montada pelo texto com
     votação e recuperação de vírgula (100 g × porção e %VD), conferência dos
     dizeres com o texto de todas as fotos, “Obrigatório / Quando aplicável” e
     hipóteses de advertência deduzidas da lista de ingredientes.
   - Citações (nuc--citacoes.js): norma ausente do banco passa a oferecer a
     busca no Diário Oficial, em vez de só “não localizada”.
   Idempotente. Uso: node scripts/repack-rotulo-ocr.cjs */
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
const ocr = Buffer.from(fs.readFileSync(path.join(root, 'rotulagem-ocr.html'), 'utf8'), 'utf8').toString('base64');
bloco('app--alimentos-integrado', s => {
  const re = /var OCR64='[A-Za-z0-9+/=]+'/;
  if (!re.test(s)) throw Error('OCR64 não localizado');
  return s.replace(re, () => "var OCR64='" + ocr + "'");
});
bloco('nuc--citacoes.js', s => {
  const de = "        + 'A citação não pode ser exibida a partir do texto oficial.'));\n      return alvo;";
  if (s.includes('cit-busca-oficial')) return s;
  if (s.split(de).length !== 2) throw Error('citações: trecho da norma não localizada');
  return s.replace(de, () => "        + 'A citação não pode ser exibida a partir do texto oficial.'));\n"
    + "      /* sem o texto no banco: leva à busca na fonte oficial (Diário Oficial da União) */\n"
    + "      var bo = el('a', 'cit-ref cit-busca-oficial', 'Consultar na fonte oficial ↗');\n"
    + "      bo.href = 'https://www.in.gov.br/consulta/-/buscar/dou?q=' + encodeURIComponent('\"' + String(r.rotuloPedido || '').trim() + '\"') + '&s=todos&exactDate=all&sortType=0';\n"
    + "      bo.target = '_blank'; bo.rel = 'noopener noreferrer';\n"
    + "      var pb = el('p', 'cit-ausente'); pb.appendChild(bo); alvo.appendChild(pb);\n"
    + "      return alvo;");
});
fs.writeFileSync(file, html);
console.log('Rotulagem: leitor automático e citações atualizados.');
