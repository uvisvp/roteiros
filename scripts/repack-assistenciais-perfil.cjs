'use strict';
/* Serviços assistenciais: roteiro pelo perfil do serviço (12/11/2026). Insere assistenciais-perfil.inc.js
   depois da tela padrão (/*AS-PU-FIM*\/), antes da abertura da modalidade, entre /*AS-PERFIL-INICIO*\/
   e /*AS-PERFIL-FIM*\/. Idempotente. Uso: node scripts/repack-assistenciais-perfil.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const id = 'app--servicos-assistenciais';
const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
const m = html.match(re); if (!m) throw Error(id);
let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação');
const frag = fs.readFileSync(path.join(root, 'assistenciais-perfil.inc.js'), 'utf8').trim().replace(/<\/(script)/gi, '<\\/$1');
const INI = '/*AS-PERFIL-INICIO*/', FIM = '/*AS-PERFIL-FIM*/', bloco = INI + '\n' + frag + '\n' + FIM + '\n';
const k0 = app.indexOf(INI);
if (k0 >= 0) { const k1 = app.indexOf(FIM, k0); if (k1 < 0) throw Error('fim do fragmento'); app = app.slice(0, k0) + bloco + app.slice(k1 + FIM.length + 1); }
else { const ancora = '/*AS-PU-FIM*/\n'; if (app.split(ancora).length !== 2) throw Error('âncora /*AS-PU-FIM*/ não única'); app = app.replace(ancora, () => ancora + bloco); }
/* relatório: características declaradas no cabeçalho, depois do CNAE */
{ const de = "kv('CNAE',c?(c.cod+\" — \"+c.desc):'')+'</div>'", para = "kv('CNAE',c?(c.cod+\" — \"+c.desc):'')+(typeof asCaracTexto==='function'&&asCaracTexto()?'<p>'+esc(asCaracTexto())+'</p>':'')+'</div>'";
  if (!app.includes(para)) { if (app.split(de).length !== 2) throw Error('cabeçalho do relatório'); app = app.replace(de, () => para); } }
const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip');
html = html.replace(re, () => m[1] + enc + m[3]);
fs.writeFileSync(file, html);
console.log('Serviços assistenciais: roteiro pelo perfil (modalidade dos demais acolhimentos e características do serviço).');
