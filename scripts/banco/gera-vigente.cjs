'use strict';
/* Gera scripts/banco/vigente/<norma>.json a partir do texto atualizado da Câmara dos Deputados
   (Legislação Informatizada, "norma atualizada"), que traz só a redação vigente.
   Os HTML baixados ficam fora do repositório; o JSON gerado é o que entra no banco
   (scripts/banco/correcoes.cjs, entradas com `vigente`).
   Uso: node scripts/banco/gera-vigente.cjs <pasta com os HTML baixados> */
const fs = require('node:fs'), path = require('node:path');
const {le} = require('./camara.cjs');
const {FONTES} = require('./vigente/fontes.cjs');
const dir = process.argv[2];
if (!dir) throw Error('informe a pasta com os HTML baixados da Câmara');
for (const [norma, f] of Object.entries(FONTES)) {
  const arq = path.join(dir, f.arquivo);
  const n = le(fs.readFileSync(arq, 'utf8'));
  const out = path.join(__dirname, 'vigente', norma + '.json');
  fs.writeFileSync(out, '[\n' + n.map(x => JSON.stringify(x)).join(',\n') + '\n]\n');
  console.log(norma + ': ' + n.length + ' dispositivos');
}
