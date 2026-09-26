'use strict';
/* Produtos e correlatos: injeta produtos-navegacao.js no fim do módulo e
   corrige dois pontos do próprio módulo (idempotente):
   - cnaeMap usava a chave “fab_cosm”, mas o tipo da trilha é “fabricante”:
     o cartão de CNAE do fabricante mostrava os CNAEs de todas as trilhas;
   - o bloco do POP-O-SNVS-013 considerava “há dispositivos” pelo texto da
     página (que sempre contém o rótulo da opção): passa a olhar só a marcação.
   Uso: node scripts/repack-produtos.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const id = 'app--produtos-correlatos';
const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
const m = html.match(re); if (!m) throw Error(id);
let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação');
const troca = (de, para, rot) => { if (app.includes(para)) return; const n = app.split(de).length - 1; if (n !== 1) throw Error('Trecho ' + rot + ' encontrado ' + n + ' vezes'); app = app.replace(de, () => para); };
const trocaTodas = (de, para, rot) => { if (!app.includes(de)) { if (app.includes(para)) return; throw Error('Trecho ' + rot + ' ausente'); } app = app.split(de).join(para); };
troca('"cnaeMap": {"fab_cosm": {', '"cnaeMap": {"fabricante": {', 'cnaeMap fabricante');
trocaTodas("const hasDisp=()=>!!document.querySelector('[data-flag=cls_disp]:checked')||/dispositivos\\/IVD|dispositivos médicos.*diagnóstico in vitro/i.test(document.body?.innerText||'');",
  "const hasDisp=()=>!!document.querySelector('[data-flag=cls_disp]:checked');", 'hasDisp');
const START = '<!--PRODUTOS_NAV_INICIO-->', END = '<!--PRODUTOS_NAV_FIM-->';
const i0 = app.indexOf(START); if (i0 >= 0) app = app.slice(0, i0) + app.slice(app.indexOf(END) + END.length);
const code = fs.readFileSync(path.join(root, 'produtos-navegacao.js'), 'utf8').replace(/<\/(script)/gi, '<\\/$1');
const k = app.lastIndexOf('</body>'); if (k < 0) throw Error('</body> não localizado');
app = app.slice(0, k) + START + '<script>' + code + '</script>' + END + app.slice(k);
const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip');
html = html.replace(re, () => m[1] + enc + m[3]);
fs.writeFileSync(file, html);
console.log('Produtos: navegação e trilha ajustadas.');
