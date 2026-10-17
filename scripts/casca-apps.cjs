'use strict';
/* Registro de roteiros na casca do index.html (17/10/2026), usado por
   repack-vacina, repack-eac e repack-medicamentos. Tudo idempotente.
   - registra(html, {app, titulo, nucleo, store, icone}): ícone, núcleo (cor),
     componente padrão (UvisPadrao), limpeza da tela e Inspeções salvas;
   - remove(html, app): tira o bloco app--<app> e esses registros;
   - icone(html, chave, svg): ícone de um card de grupo;
   - grupo(html, chave, def | null): GRUPOS[chave] (card que abre uma lista);
   - catalogo(html, nucleo, lista): ROTEIROS[nucleo];
   - cartao(html, nucleo, linha, depois): põe ou atualiza um card do núcleo
     (linha = [título, descrição, app ou grupo]) depois do card “depois”. */
const ICONE_ANCORA = `\n    "academia-piscina": '`;
const unico = (html, de, rotulo) => { const n = html.split(de).length - 1; if (n !== 1) throw Error(`${rotulo}: esperava 1 ocorrência, achei ${n}`); };
const esc1 = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function insere(html, ancora, novo, ja, rotulo) {
  if (html.includes(ja)) return html;
  unico(html, ancora, rotulo);
  return html.replace(ancora, () => ancora + novo);
}
function icone(html, chave, svg) {
  const re = new RegExp(`\\n    "${reEsc(chave)}": '[^\\n]*',`);
  const linha = `\n    "${chave}": '${svg}',`;
  if (re.test(html)) return html.replace(re, () => linha);
  unico(html, ICONE_ANCORA, 'ícone ' + chave);
  return html.replace(ICONE_ANCORA, () => linha + ICONE_ANCORA);
}
function registra(html, {app, titulo, nucleo, store, icone: svg}) {
  html = icone(html, app, svg);
  html = insere(html, " 'academia-piscina':'Serviços',", ` '${app}':'${nucleo}',`, ` '${app}':'`, 'núcleo ' + app);
  html = insere(html, ' padraoApps.push("academia-piscina");', ` padraoApps.push("${app}");`, `padraoApps.push("${app}")`, 'padrão ' + app);
  html = insere(html, "\n    'academia-piscina':['uvis-academia-piscina-v1'],", `\n    '${app}':['${store}'],`, `\n    '${app}':['`, 'limpeza ' + app);
  const ancora = "  'odontologia':{nome:'Odontologia',nucleo:'Odontologia',";
  const linha = `  '${app}':{nome:'${esc1(titulo)}',nucleo:'${esc1(nucleo)}',ls:['${store}'],fotos:[],barra:'.pu-header .pu-acoes'},\n`;
  const re = new RegExp(`  '${reEsc(app)}':\\{nome:'[^\\n]*\\},\\n`);
  if (re.test(html)) return html.replace(re, () => linha);
  unico(html, ancora, 'Salvas ' + app);
  return html.replace(ancora, () => linha + ancora);
}
function remove(html, app) {
  const a = reEsc(app);
  return html
    .replace(new RegExp(`<script type="text/plain" id="app--${a}">[\\s\\S]*?</script>\\n?`), '')
    .replace(new RegExp(`\\n    "${a}": '[^\\n]*',`), '')
    .replace(new RegExp(` '${a}':'[^']*',`), '')
    .replace(new RegExp(` padraoApps\\.push\\("${a}"\\);`), '')
    .replace(new RegExp(`\\n    '${a}':\\['[^\\]]*\\],`), '')
    .replace(new RegExp(`  '${a}':\\{nome:'[^\\n]*\\},\\n`), '');
}
function linhaJson(html, re, rotulo) {
  const m = html.match(re);
  if (!m) throw Error(rotulo + ' não encontrado');
  return {m, obj: JSON.parse(m[1])};
}
function grupo(html, chave, def) {
  const re = /\n  var GRUPOS = (\{[^\n]*\});\n/;
  const {m, obj} = linhaJson(html, re, 'GRUPOS');
  if (def) obj[chave] = def; else delete obj[chave];
  return html.replace(m[0], () => `\n  var GRUPOS = ${JSON.stringify(obj)};\n`);
}
function catalogo(html, nucleo, lista) {
  const re = /\n  var ROTEIROS = (\{[^\n]*\});/;
  const {m, obj} = linhaJson(html, re, 'ROTEIROS');
  obj[nucleo] = lista;
  return html.replace(m[0], () => `\n  var ROTEIROS = ${JSON.stringify(obj)};`);
}
function cartao(html, nucleo, linha, depois) {
  const re = /\n  var ROTEIROS = (\{[^\n]*\});/;
  const {m, obj} = linhaJson(html, re, 'ROTEIROS');
  const lista = obj[nucleo] || (obj[nucleo] = []);
  const i = lista.findIndex(r => r[2] === linha[2] && (r[3] || '') === (linha[3] || ''));
  if (i >= 0) lista[i] = linha;
  else { const j = lista.findIndex(r => r[2] === depois); lista.splice(j >= 0 ? j + 1 : lista.length, 0, linha); }
  return html.replace(m[0], () => `\n  var ROTEIROS = ${JSON.stringify(obj)};`);
}
const ICONES = {
  seringa: '<path d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3a1 1 0 0 1-1.4 0l-2.6-2.6a1 1 0 0 1 0-1.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6"/>',
  frasco: '<path d="M9 3h6M10 3v5l-4.5 9a2.5 2.5 0 0 0 2.2 3.6h8.6a2.5 2.5 0 0 0 2.2-3.6L14 8V3M7.5 14h9"/>',
  cilindro: '<path d="M9 7h6v13a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1zM10 7V4.5A1.5 1.5 0 0 1 11.5 3h1A1.5 1.5 0 0 1 14 4.5V7M9 11h6"/>',
  drogaria: '<path d="M4 9h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 9l1.6-5h12.8L20 9M12 12v5M9.5 14.5h5"/>',
  atacadista: '<path d="M3 21V9l9-5 9 5v12M7 21v-7h10v7M7 17h10"/>'
};
module.exports = {registra, remove, icone, grupo, catalogo, cartao, ICONES};
