'use strict';
/* Checklist por ponto nas perguntas compostas dos roteiros de motor próprio
   (17/10/2026): Odontologia, Serviços assistenciais, Produtos e Alimentos.
   - grava em cada módulo os pontos (pontos/<app>.cjs) e o runtime
     campo/pontos.js, entre <!--UVS-PONTOS--> e <!--/UVS-PONTOS--> (troca a
     cada execução);
   - nos relatórios descritivos (scripts/repack-relatorio-descritivo.cjs), a
     frase de “Não cumpre” passa a listar os pontos não atendidos;
   - a chave uvis-pontos-<app> entra nas Inspeções salvas e na limpeza.
   Idempotente. Uso: node scripts/repack-pontos.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const RUNTIME = fs.readFileSync(path.join(root, 'campo', 'pontos.js'), 'utf8');
const APPS = ['odontologia', 'servicos-assistenciais', 'produtos-correlatos', 'servicos-alimentacao-roteiro']
  .filter(a => fs.existsSync(path.join(root, 'pontos', a + '.cjs')));
const P = 'window.UvsPontos&&UvsPontos.frase';

function troca(s, de, para, rot) {
  if (s.includes(para)) return s;
  const n = s.split(de).length - 1;
  if (n !== 1) throw Error(`${rot}: esperava 1 ocorrência, achei ${n}`);
  return s.replace(de, () => para);
}
function bloco(id, fn) {
  const rx = new RegExp(`(<script type="text/plain" id="${id.replace(/[.]/g, '\\.')}">)([\\s\\S]*?)(</script>)`);
  const m = html.match(rx);
  if (!m) throw Error('bloco ' + id);
  const novo = fn(lz.decompressFromBase64(m[2].trim()));
  const enc = lz.compressToBase64(novo);
  if (lz.decompressFromBase64(enc) !== novo) throw Error('round-trip ' + id);
  html = html.replace(rx, (_, a, __, c) => a + enc + c);
}
/* relatório: frase de “Não cumpre” com os pontos não atendidos */
const RELATORIO = {
  odontologia: s => {
    s = troca(s, "r.a==='nao'?(window.UvsFrase||function(t){return t})(r.i.t,'nc')",
      `r.a==='nao'?((${P}(r.i.id))||(window.UvsFrase||function(t){return t})(r.i.t,'nc'))`, 'odonto: frase');
    s = troca(s, "pending.forEach(i=>B.push({t:'p',x:'Em avaliação: '+(window.UvsFrase||function(t){return t})(i.t,'nc')",
      `pending.forEach(i=>B.push({t:'p',x:'Em avaliação: '+((${P}(i.id))||(window.UvsFrase||function(t){return t})(i.t,'nc'))`, 'odonto: em avaliação');
    return troca(s, "B.push({t:'num',n:k+1,x:(window.UvsFrase||function(t){return t})(i.t,'nc')+' Fundamento: '",
      `B.push({t:'num',n:k+1,x:((${P}(i.id))||(window.UvsFrase||function(t){return t})(i.t,'nc'))+' Fundamento: '`, 'odonto: irregularidade');
  },
  'servicos-assistenciais': s => troca(s, "const frase=r=>(r.kind==='doc'?D(r.item,r.res==='C'?'c':'nc','O estabelecimento'):F(r.item,r.res==='C'?'c':'nc'))+nota(r.nota);",
    `const frase=r=>((r.res==='NC'&&${P}(current.id+'|'+r.item))||(r.kind==='doc'?D(r.item,r.res==='C'?'c':'nc','O estabelecimento'):F(r.item,r.res==='C'?'c':'nc')))+nota(r.nota);`, 'assistenciais: frase'),
  'servicos-alimentacao-roteiro': s => troca(s, "var frase = function (i) { return F(i.text, st.resp[i.id] === 'ok' ? 'c' : 'nc') + ",
    `var frase = function (i) { return ((st.resp[i.id] === 'nao' && ${P}(i.id)) || F(i.text, st.resp[i.id] === 'ok' ? 'c' : 'nc')) + `, 'alimentos: frase')
};
for (const app of APPS) {
  const q = require(path.join(root, 'pontos', app + '.cjs'));
  for (const [id, x] of Object.entries(q)) {
    if (!/\{\}/.test(x.nc) || !x.p.length) throw Error(`${app}/${id}: frase sem {} ou sem pontos`);
    if (x.p.length < 2) throw Error(`${app}/${id}: checklist com um ponto só`);
  }
  const dados = JSON.stringify({app, chave: 'uvis-pontos-' + app, q, porTexto: app === 'servicos-assistenciais'}).replace(/<\//g, '<\\/');
  const inj = '<!--UVS-PONTOS--><script>window.__UVS_PONTOS=' + dados + ';</script><script>' + RUNTIME.replace(/<\/script/gi, '<\\/script') + '</script><!--/UVS-PONTOS-->';
  bloco('app--' + app, s => {
    s = s.replace(/<!--UVS-PONTOS-->[\s\S]*?<!--\/UVS-PONTOS-->/, '');
    const k = s.lastIndexOf('</body>');
    if (k < 0) throw Error(app + ': sem </body>');
    s = s.slice(0, k) + inj + s.slice(k);
    return RELATORIO[app] ? RELATORIO[app](s) : s;
  });
  /* Inspeções salvas e limpeza */
  const chave = `'uvis-pontos-${app}'`;
  const cfg = new RegExp(`(\\n  '${app}':\\{nome:'[^']*',nucleo:'[^']*',ls:\\[)([^\\]]*)\\]`);
  html = html.replace(cfg, (m, a, b) => b.includes(chave) ? m : a + b + ',' + chave + ']');
  const lim = new RegExp(`(\\n    '${app}':\\[)([^\\]]*)\\]`);
  html = html.replace(lim, (m, a, b) => b.includes(chave) ? m : a + b + ',' + chave + ']');
  if (!html.includes(chave)) throw Error(app + ': chave fora das Salvas');
  console.log(`${app}: ${Object.keys(q).length} perguntas com checklist.`);
}
/* Produtos: o relatório é do motor roteiro-guiado (bloco à parte) */
if (APPS.includes('produtos-correlatos')) bloco('rec--roteiro-guiado.js', s => troca(s,
  "const frase = (item) => F(item.text, state.answers[item._id] === 'yes' ? 'c' : 'nc') + nota(item);",
  `const frase = (item) => ((state.answers[item._id] === 'no' && ${P}(item._id)) || F(item.text, state.answers[item._id] === 'yes' ? 'c' : 'nc')) + nota(item);`, 'produtos: frase'));
/* prévia “Como sai no relatório” de Produtos (gancho de repack-previa.cjs): frase descritiva, com os pontos */
if (APPS.includes('produtos-correlatos')) bloco('rec--roteiro-guiado.js', s => troca(s,
  "out.push({ x: item._sectionTitle + ' — ' + item.text + ': ' + answerLabel(state.answers[item._id]) + (n.note ? '. Anotação: ' + n.note : '') + (n.evidence ? '. Evidência: ' + n.evidence : '') });",
  "const F = window.UvsFrase || ((t) => t), a = state.answers[item._id]; out.push({ x: (a === 'na' ? 'Não se aplica: ' + item.text : ((a === 'no' && window.UvsPontos && UvsPontos.frase(item._id)) || F(item.text, a === 'yes' ? 'c' : 'nc'))) + (n.note ? ' ' + n.note : '') + (n.evidence ? ' Evidência: ' + n.evidence : '') });",
  'produtos: prévia'));
fs.writeFileSync(file, html);
