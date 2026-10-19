'use strict';
/* Serviços de alimentação (19/10/2026): campo CNPJ na identificação do estabelecimento, logo
   após “Estabelecimento”, para a busca dos dados pelo CNPJ (campo/cnpj-anvisa.js: Anvisa e,
   sem AFE/AE, Receita Federal) e para a máscara e o dígito verificador (campo/cnpj-guarda.js).
   Idempotente. Uso: node scripts/repack-alimentos-cnpj.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const id = 'app--servicos-alimentacao-roteiro';
const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
const m = html.match(re); if (!m) throw Error(id);
let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação');
const DE = '{"id": "establishment", "label": "Estabelecimento", "placeholder": "Razão social / nome fantasia"}, ';
const CNPJ = '{"id": "cnpj", "label": "CNPJ", "placeholder": "00.000.000/0000-00"}, ';
if (app.includes(DE + CNPJ)) { console.log('Serviços de alimentação: campo CNPJ já presente.'); process.exit(0); }
if (app.split(DE).length !== 2) throw Error('Serviços de alimentação: campo Estabelecimento não encontrado (1 ocorrência esperada)');
app = app.replace(DE, () => DE + CNPJ);
const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip');
html = html.replace(re, () => m[1] + enc + m[3]);
fs.writeFileSync(file, html);
console.log('Serviços de alimentação: campo CNPJ incluído na identificação.');
