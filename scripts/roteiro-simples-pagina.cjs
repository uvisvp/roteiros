'use strict';
/* Página de um roteiro no motor roteiro-simples (roteiro-simples/, cópia do
   site Medicamentos): valida os dados e devolve o HTML do bloco app--<app>.
   Usado por repack-academia, repack-vacina, repack-eac, repack-medicamentos, repack-transporte e repack-imagem. */
const fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..');
const le = f => fs.readFileSync(path.join(root, f), 'utf8');
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

function valida(D, LEGAL) {
  const refs = new Set();
  D.secoes.forEach(s => s.itens.forEach(i => (i.perguntas || []).forEach(q => q.r.forEach(r => refs.add(r)))));
  D.infracoes.forEach(i => i.r.forEach(r => refs.add(r)));
  /* citações dos campos (inventário por ambiente: c.r e as de cada irregularidade) */
  D.secoes.forEach(s => s.itens.forEach(i => (i.campos || []).forEach(c => { (c.r || []).forEach(r => refs.add(r));
    [c.lista || []].concat(Object.values(c.tipos || {}).map(t => t.lista || [])).forEach(l => l.forEach(x => (Array.isArray(x[2]) ? x[2] : []).forEach(r => refs.add(r)))); })));
  (D.leiBase || []).forEach(r => refs.add(r));
  const legal = {};
  for (const r of refs) { if (!LEGAL[r]) throw Error(`${D.app}: dispositivo sem texto (${r})`); legal[r] = LEGAL[r]; }
  const ids = D.secoes.flatMap(s => s.itens.flatMap(i => (i.perguntas || []).map(q => q.id)));
  const rep = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (rep.length) throw Error(`${D.app}: perguntas com id repetido: ${rep.join(', ')}`);
  const campos = new Set(D.secoes.flatMap(s => s.itens.flatMap(i => (i.campos || []).map(c => c.id))));
  /* condições de perfil do item (it.se) e da infração (i.se) */
  for (const s of D.secoes) for (const i of s.itens) if (i.se && !campos.has(i.se.campo)) throw Error(`${D.app}: condição com campo inexistente no item ${i.id}`);
  for (const x of D.infracoes) if (x.se && !campos.has(x.se.campo)) throw Error(`${D.app}: condição com campo inexistente na infração ${x.id}`);
  for (const s of D.secoes) for (const i of s.itens) for (const q of i.perguntas || []) {
    for (const f of q.inf || []) if (!D.infracoes.some(x => x.id === f)) throw Error(`${D.app}: infração inexistente ${f} em ${q.id}`);
    for (const c of [q.naSe, q.se]) if (c && !campos.has(c.campo)) throw Error(`${D.app}: condição com campo inexistente em ${q.id}`);
  }
  /* infrações sugeridas pelas perguntas e pelo inventário de ambientes (c.inf e o 4º elemento de cada irregularidade) */
  const usadas = new Set();
  for (const s of D.secoes) for (const i of s.itens) {
    for (const q of i.perguntas || []) (q.inf || []).forEach(f => usadas.add(f));
    for (const c of i.campos || []) { (c.inf || []).forEach(f => usadas.add(f));
      [c.lista || []].concat(Object.values(c.tipos || {}).map(t => t.lista || [])).forEach(l => l.forEach(x => [].concat(x[3] || []).forEach(f => usadas.add(f)))); }
  }
  for (const f of usadas) if (!D.infracoes.some(x => x.id === f)) throw Error(`${D.app}: infração inexistente ${f}`);
  /* x.avulsa: infração do catálogo sem pergunta correspondente (marcada direto na aba Infrações) */
  for (const x of D.infracoes) if (!usadas.has(x.id) && !x.avulsa) throw Error(`${D.app}: infração sem pergunta nem irregularidade de ambiente: ${x.id}`);
  return legal;
}
function pagina(D, LEGAL, cor, blocks) {
  const legal = valida(D, LEGAL);
  const dados = JSON.stringify({...D, cor, legal}).replace(/<\//g, '<\\/');
  return {legal, html: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(D.titulo)}</title>`
    + `<style>${le('roteiro-simples/roteiro-simples.css')}</style></head><body>`
    + `<script>${blocks.get('rec--jszip.js')}</script>`
    + `<script>${le('relatorio-fotos.js')}</script>`
    /* D.ocr: leitor de documentos (certidão do conselho etc.), o mesmo motor da drogaria */
    + (D.ocr ? ['rec--drogaria-ocr-tools.js', 'rec--ocr-extractors.js', 'rec--ocr-padrao.js'].map(b => `<script>${blocks.get(b).replace(/<\/script/gi, '<\\/script')}</script>`).join('') : '')
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
