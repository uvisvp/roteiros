'use strict';
/* Revisão dos botões de citação (scripts/citacoes/revisar.py) aplicada aos módulos listados;
   nos Serviços assistenciais, também os fundamentos de scripts/citacoes/assistenciais.py.
   Rodar depois de scripts/banco/aplicar-banco.cjs.
   Estética e Odontologia foram conferidas e não têm botões divergentes do texto: ficam de fora.
   Idempotente. Uso: node scripts/citacoes/aplicar.cjs */
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), {execFileSync} = require('node:child_process');
const {unpack} = require('../integrated-html.cjs');
const root = path.join(__dirname, '..', '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
for (const id of ['app--servicos-assistenciais']) {
  const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  const app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação ' + id);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cit-')), ent = path.join(tmp, 'e.txt'), sai = path.join(tmp, 's.txt');
  fs.writeFileSync(ent, app);
  process.stdout.write(execFileSync('python3', [path.join(__dirname, 'revisar.py'), id, ent, sai], {encoding: 'utf8'}));
  if (id === 'app--servicos-assistenciais') {
    /* Fundamentos revistos (art. 22, SRT na Portaria de Consolidação nº 3/2017, textos literais).
       Depende do banco já atualizado por scripts/banco/aplicar-banco.cjs. */
    const bm = html.match(/<script type="text\/plain" id="banco--v11">([\s\S]*?)<\/script>/);
    const bj = path.join(tmp, 'b.json'), nj = path.join(tmp, 'n.json'), s2 = path.join(tmp, 's2.txt');
    fs.writeFileSync(bj, lz.decompressFromBase64(bm[1]));
    fs.writeFileSync(nj, execFileSync('python3', [path.join(__dirname, '..', 'banco', 'estruturar.py')], {encoding: 'utf8', maxBuffer: 64 << 20}));
    process.stdout.write(execFileSync('python3', [path.join(__dirname, 'assistenciais.py'), sai, bj, nj, s2], {encoding: 'utf8'}));
    fs.copyFileSync(s2, sai);
  }
  const novo = fs.readFileSync(sai, 'utf8'); fs.rmSync(tmp, {recursive: true, force: true});
  if (novo === app) continue;
  const enc = lz.compressToBase64(novo); if (lz.decompressFromBase64(enc) !== novo) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]);
}
/* Odontologia: três itens tinham parágrafos lidos como artigos (“art. 14, §§ 1º a 3º” abria o art. 3º;
   “art. 84, § 1º” abria o art. 2º, § 1º). Botões apontam agora para os parágrafos certos. */
{ const id = 'app--odontologia';
  const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação ' + id);
  const b = (n, t) => '<button class=\\"cite inline-cite\\" data-legal=\\"rdc-anvisa-1002-2025:' + n + '\\">' + t + '</button>';
  const r = (ns) => '"refs":[' + ns.map(n => '"rdc-anvisa-1002-2025:' + n + '"').join(',') + ']';
  /* Os parágrafos não estão na cópia de dispositivos embutida no módulo: o botão fica no
     artigo (que exibe os parágrafos) e os parágrafos passam a texto simples. */
  const trocas = [
    [r(['a14', 'a3']), r(['a14']),
     'art. ' + b('a14', '14') + ', §§ 1º a ' + b('a3', '3') + 'º', 'art. ' + b('a14', '14') + ', §§ 1º a 3º'],
    [r(['a75', 'a4']), r(['a75']),
     'art. ' + b('a75', '75') + ', §§ 3º e ' + b('a4', '4') + 'º', 'art. ' + b('a75', '75') + ', §§ 3º e 4º'],
    [r(['a84', 'a2', 'a2p1']), r(['a84']),
     'art. ' + b('a84', '84') + ', §' + b('a2p1', '§ 1º') + ' e ' + b('a2', '2') + 'º', 'art. ' + b('a84', '84') + ', §§ 1º e 2º'],
  ];
  /* Item fi17 citava a RDC nº 50/2002, que não está no banco (a Anvisalegis não tem o texto
     estruturado). A exigência é a do art. 14, § 3º, da RDC nº 1.002/2025, aberto pelo botão,
     cujo texto faz a remissão à RDC nº 50/2002. */
  { const de = 'fixados em carrinho de transporte e armazenados conforme a RDC Anvisa nº 50/2002 quando fora de uso.',
      para = 'fixados em carrinho de transporte e, quando fora de uso, armazenados em ambiente que atenda ao art. 14, § 3º.';
    if (app.includes(de)) app = app.split(de).join(para); }
  for (const [r0, r1, c0, c1] of trocas) {
    for (const [de, para] of [[r0, r1], [c0, c1]]) {
      if (!app.includes(de)) continue;
      app = app.split(de).join(para);
    }
  }
  const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]); }
/* Serviços de alimentação: reservatório de água citava “itens 11.4 e 11.5”; o item 11.4 trata de
   gelo vendido a terceiros. Reservatório = itens 11.5 (frequência) e 11.6 (método). */
{ const id = 'app--servicos-alimentacao-roteiro';
  const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação ' + id);
  const antes = app;
  const de = 'Portaria SMS nº 2.619/2011, itens 11.4 e 11.5.', para = 'Portaria SMS nº 2.619/2011, itens 11.5 e 11.6.';
  if (app.includes(de)) app = app.split(de).join(para);
  /* Nas infrações, a nota de aplicabilidade vinha colada à citação (“item 11. · Aplicável quando…”)
     e o motor de citações não achava o item; com o travessão, a nota fica fora da leitura do dispositivo.
     “item 11 e itens 14.9 e 14.10” perdia o item 14.9. */
  app = app.replace(/("legal": "Portaria SMS nº 2\.619\/2011, [^"]*?)\. · (Aplicável[^"]*")/g, '$1 — $2');
  app = app.split('Portaria SMS nº 2.619/2011, item 11 e itens 14.9 e 14.10').join('Portaria SMS nº 2.619/2011, itens 11, 14.9 e 14.10');
  if (app !== antes) {
    const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip ' + id);
    html = html.replace(re, () => m[1] + enc + m[3]);
  } }
fs.writeFileSync(file, html);
console.log('Citações revisadas.');
