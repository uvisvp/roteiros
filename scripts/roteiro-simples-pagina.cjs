'use strict';
/* Página de um roteiro no motor roteiro-simples (roteiro-simples/, cópia do
   site Medicamentos): valida os dados e devolve o HTML do bloco app--<app>.
   Usado por repack-academia.cjs e repack-vacina.cjs. */
const fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..');
const le = f => fs.readFileSync(path.join(root, f), 'utf8');
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

function valida(D, LEGAL) {
  const refs = new Set();
  D.secoes.forEach(s => s.itens.forEach(i => (i.perguntas || []).forEach(q => q.r.forEach(r => refs.add(r)))));
  D.infracoes.forEach(i => i.r.forEach(r => refs.add(r)));
  const legal = {};
  for (const r of refs) { if (!LEGAL[r]) throw Error(`${D.app}: dispositivo sem texto (${r})`); legal[r] = LEGAL[r]; }
  const ids = D.secoes.flatMap(s => s.itens.flatMap(i => (i.perguntas || []).map(q => q.id)));
  const rep = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (rep.length) throw Error(`${D.app}: perguntas com id repetido: ${rep.join(', ')}`);
  const campos = new Set(D.secoes.flatMap(s => s.itens.flatMap(i => (i.campos || []).map(c => c.id))));
  for (const s of D.secoes) for (const i of s.itens) for (const q of i.perguntas || []) {
    for (const f of q.inf || []) if (!D.infracoes.some(x => x.id === f)) throw Error(`${D.app}: infração inexistente ${f} em ${q.id}`);
    for (const c of [q.naSe, q.se]) if (c && !campos.has(c.campo)) throw Error(`${D.app}: condição com campo inexistente em ${q.id}`);
  }
  for (const x of D.infracoes) if (!D.secoes.some(s => s.itens.some(i => (i.perguntas || []).some(q => (q.inf || []).includes(x.id))))) throw Error(`${D.app}: infração sem pergunta: ${x.id}`);
  return legal;
}
function pagina(D, LEGAL, cor, blocks) {
  const legal = valida(D, LEGAL);
  const dados = JSON.stringify({...D, cor, legal}).replace(/<\//g, '<\\/');
  return {legal, html: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(D.titulo)}</title>`
    + `<style>${le('roteiro-simples/roteiro-simples.css')}</style></head><body>`
    + `<script>${blocks.get('rec--jszip.js')}</script>`
    + `<script>${le('relatorio-fotos.js')}</script>`
    + `<script>window.ROTEIRO=${dados};</script>`
    + `<script>${le('roteiro-simples/roteiro-simples.js')}</script></body></html>`};
}
/* grava (ou troca) o bloco app--<app> antes da Central de Consultas */
function gravaBloco(html, lz, app, pag) {
  const enc = lz.compressToBase64(pag);
  if (lz.decompressFromBase64(enc) !== pag) throw Error('round-trip do bloco ' + app);
  const tag = `<script type="text/plain" id="app--${app}">`;
  const re = new RegExp(`<script type="text/plain" id="app--${app}">[\\s\\S]*?</script>\\n?`);
  if (re.test(html)) return html.replace(re, () => tag + enc + '</script>\n');
  const ancora = '<script type="text/plain" id="app--central-consultas">';
  if (html.split(ancora).length !== 2) throw Error('âncora do bloco');
  return html.replace(ancora, () => tag + enc + '</script>\n' + ancora);
}
module.exports = {pagina, gravaBloco};
