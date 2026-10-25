'use strict';
/* Produtos e correlatos: citações sem dispositivo passam a citar o artigo, e a seção de
   regularidade aponta para a lista de produtos não regularizados como dispositivos médicos
   (pedido de 22/10/2026). As mesmas trocas estão em scripts/produtos/revisao.py
   (config-revisado.json); aqui vão direto ao bloco, sem regerar o roteiro inteiro.
   Idempotente. Uso: node scripts/repack-produtos-citacoes.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const ID = 'app--produtos-correlatos';
const TROCAS = [
  ['Lei Federal nº 6.360/1976, art. 12; RDC Anvisa nº 830/2023."', 'Lei Federal nº 6.360/1976, art. 12; RDC Anvisa nº 830/2023, arts. 6º e 7º."'],
  ['ou RDC Anvisa nº 830/2023."', 'ou RDC Anvisa nº 830/2023, arts. 6º e 7º."'],
  ['Resolução ANTT nº 5.998/2022, quando houver produto perigoso."', 'Resolução ANTT nº 5.998/2022, art. 2º, quando houver produto perigoso."'],
  ['e Resolução ANTT nº 5.998/2022."', 'e Resolução ANTT nº 5.998/2022, art. 2º."'],
  ['c/c Portaria SVS/MS nº 344/1998."', 'c/c Portaria SVS/MS nº 344/1998, art. 2º."'],
  ['A consulta de regularização fica no fim do roteiro."', 'A consulta de regularização fica no fim do roteiro. Produto que consta da lista da Anvisa de produtos não regularizados como dispositivos médicos não exige notificação nem registro: consulte na Central de Consultas, modo “DM não regularizado”, e leia a exceção do item."']
];
let feito = false;
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== ID) return m;
  feito = true;
  const src = lz.decompressFromBase64(enc.trim());
  let s = src;
  TROCAS.forEach(([de, para]) => {
    if (s.includes(de)) s = s.split(de).join(para);
    else if (!s.includes(para)) throw Error('Trecho não localizado em ' + ID + ': ' + de);
  });
  if (s === src) return m;
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + ID);
  return a + novo + z;
});
if (!feito) throw Error('Bloco não localizado: ' + ID);
fs.writeFileSync(file, html);
console.log('Produtos: citações com dispositivo e aviso da lista de não regularizados.');
