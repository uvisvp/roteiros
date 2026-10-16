'use strict';
/* Academias, clubes e piscinas (núcleo Serviços) — 16/10/2026.
   Monta o bloco app--academia-piscina com o motor roteiro-simples (cópia do
   site Medicamentos, em roteiro-simples/), os dados de academia/roteiro.cjs e o
   texto dos dispositivos de academia/legislacao.json (gerado por
   scripts/academia-legislacao.cjs a partir do banco v12). Registra o app na
   casca: card em Serviços, ícone, núcleo, componente padrão, limpeza e Salvas.
   Os literais que o build do site Medicamentos troca (padraoApps e a linha da
   odontologia nas Salvas) ficam intactos.
   Idempotente. Uso: node scripts/repack-academia.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
const APP = 'academia-piscina', COR = '#5452AA';
let {html, lz, blocks} = unpack(file);
const le = f => fs.readFileSync(path.join(root, f), 'utf8');
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

/* ---------- dados e validação ---------- */
const D = require(path.join(root, 'academia', 'roteiro.cjs'));
const LEGAL = JSON.parse(le('academia/legislacao.json'));
const refs = new Set();
D.secoes.forEach(s => s.itens.forEach(i => (i.perguntas || []).forEach(q => q.r.forEach(r => refs.add(r)))));
D.infracoes.forEach(i => i.r.forEach(r => refs.add(r)));
const legal = {};
for (const r of refs) { if (!LEGAL[r]) throw Error(`dispositivo sem texto (${r}); rode scripts/academia-legislacao.cjs`); legal[r] = LEGAL[r]; }
const ids = D.secoes.flatMap(s => s.itens.flatMap(i => (i.perguntas || []).map(q => q.id)));
const rep = ids.filter((x, i) => ids.indexOf(x) !== i);
if (rep.length) throw Error('perguntas com id repetido: ' + rep.join(', '));
const campos = new Set(D.secoes.flatMap(s => s.itens.flatMap(i => (i.campos || []).map(c => c.id))));
for (const s of D.secoes) for (const i of s.itens) for (const q of i.perguntas || []) {
  for (const f of q.inf || []) if (!D.infracoes.some(x => x.id === f)) throw Error(`infração inexistente ${f} em ${q.id}`);
  if (q.naSe && !campos.has(q.naSe.campo)) throw Error(`naSe com campo inexistente em ${q.id}`);
}
for (const x of D.infracoes) if (!D.secoes.some(s => s.itens.some(i => (i.perguntas || []).some(q => (q.inf || []).includes(x.id))))) throw Error('infração sem pergunta: ' + x.id);

/* ---------- página do app ---------- */
const dados = JSON.stringify({...D, cor: COR, legal}).replace(/<\//g, '<\\/');
const pagina = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(D.titulo)}</title>`
  + `<style>${le('roteiro-simples/roteiro-simples.css')}</style></head><body>`
  + `<script>${blocks.get('rec--jszip.js')}</script>`
  + `<script>${le('relatorio-fotos.js')}</script>`
  + `<script>window.ROTEIRO=${dados};</script>`
  + `<script>${le('roteiro-simples/roteiro-simples.js')}</script></body></html>`;
const enc = lz.compressToBase64(pagina);
if (lz.decompressFromBase64(enc) !== pagina) throw Error('round-trip do bloco');
const tag = `<script type="text/plain" id="app--${APP}">`;
const reBloco = new RegExp(`<script type="text/plain" id="app--${APP}">[\\s\\S]*?</script>\\n?`);
if (reBloco.test(html)) html = html.replace(reBloco, () => tag + enc + '</script>\n');
else {
  const ancora = '<script type="text/plain" id="app--central-consultas">';
  if (html.split(ancora).length !== 2) throw Error('âncora do bloco');
  html = html.replace(ancora, () => tag + enc + '</script>\n' + ancora);
}

/* ---------- casca ---------- */
function insere(depois, novo, rotulo, ja) {
  if (html.includes(ja || novo)) return;
  if (html.split(depois).length !== 2) throw Error(rotulo + ': esperava 1 ocorrência');
  html = html.replace(depois, () => depois + novo);
}
insere('"Serviços":[["Estética e beleza","Inventário de infrações, consulta de produtos e relatório.","estetica"]',
  ',["Academias e piscinas","Academias, clubes, piscinas e saunas: roteiro, infrações e relatório (Portaria SMS 1.101/2015).","academia-piscina"]', 'catálogo');
insere(`"estetica": '<path d="M6.5 4.5a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4M6.5 15.1a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4M8.4 7.6 19 18.6M8.4 16.4 19 5.4"/>',`,
  /* halter sobre ondas de água */
  `\n    "academia-piscina": '<path d="M3 7v5M6 5v9M18 5v9M21 7v5M6 9.5h12M3 19.5c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0"/>',`, 'ícone', '"academia-piscina": \'');
insere("    'estetica':'Serviços',", " 'academia-piscina':'Serviços',", 'núcleo');
insere('var padraoApps=["produtos-correlatos","servicos-alimentacao-roteiro","odontologia","servicos-assistenciais"];',
  ' padraoApps.push("academia-piscina");', 'componente padrão');
insere("    'estetica':['estetica-infracoes-v3'],", "\n    'academia-piscina':['uvis-academia-piscina-v1'],", 'limpeza', "'academia-piscina':['uvis-academia-piscina-v1']");
{
  const odo = "  'odontologia':{nome:'Odontologia',nucleo:'Odontologia',";
  const novo = "  'academia-piscina':{nome:'Academias e piscinas',nucleo:'Serviços',ls:['uvis-academia-piscina-v1'],fotos:[],barra:'.pu-header .pu-acoes'},\n";
  if (!html.includes(novo)) {
    if (html.split(odo).length !== 2) throw Error('Salvas: linha da odontologia');
    html = html.replace(odo, () => novo + odo);
  }
}
fs.writeFileSync(file, html);
let n = 0; D.secoes.forEach(s => s.itens.forEach(i => n += (i.perguntas || []).length));
console.log(`Academias e piscinas: ${D.secoes.length} seções, ${n} perguntas, ${D.infracoes.length} infrações, ${Object.keys(legal).length} dispositivos.`);
