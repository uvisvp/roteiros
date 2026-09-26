'use strict';
/* Central de Consultas — ajustes idempotentes no bloco app--central-consultas:
   1. Registro de 13 dígitos (registro da apresentação, impresso na embalagem):
      sem correspondência exata, busca pelo registro do produto (9 primeiros) e
      explica a origem no campo “Observação”.
   Uso: node scripts/repack-central.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const id = 'app--central-consultas';
const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
const m = html.match(re); if (!m) throw Error(id);
let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação');
const troca = (de, para, rot) => { if (app.includes(para)) return; if (!app.includes(de)) throw Error('Trecho não localizado: ' + rot); app = app.replace(de, () => para); };
troca("[r.main,r.alerts,r.irregular]=await Promise.all([baseByRegistro(v),alerts('registro',v),irregular('registro',v)])}",
  "[r.main,r.alerts,r.irregular]=await Promise.all([baseByRegistro(v),alerts('registro',v),irregular('registro',v)]);if(!r.main.length&&v.length===13){const v9=v.slice(0,9);r.main=(await baseByRegistro(v9)).map(x=>({...x,observacao:'Localizado pelo registro do produto ('+v9+'). O número informado ('+v+') é o registro da apresentação.'}))}}", 'registro de 13 dígitos');
troca("const order=['produto',", "const order=['observacao','produto',", 'ordem');
troca("const field={produto:'Produto',", "const field={observacao:'Observação',produto:'Produto',", 'rótulo');
const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip');
html = html.replace(re, () => m[1] + enc + m[3]);
fs.writeFileSync(file, html);
console.log('Central de Consultas: ajustes aplicados.');
