'use strict';
/* Cores vivas (pedido de 17/10/2026: “tá opaco; no app de medicamentos ficou
   mais vibrante”).
   - Paleta dos núcleos: a camada “home-option-b-overrides” trocava os tons por
     versões acinzentadas; passam a tons saturados (texto branco ≥ 4,5:1).
   - Componente padrão (rec--padrao-uvis.css): a cor do núcleo vai aos
     destaques (abas, faixa de itens, número do item, barra de navegação,
     botões, item concluído — antes verde). Respostas mantêm verde / vermelho
     / cinza.
   - rec--padrao-uvis.js: a cor do cabeçalho vem da casca (núcleo do roteiro).
   - Casca: os módulos com o ardósia fixo no código (drogaria, manipulação,
     distribuidora) recebem o tom do núcleo ao abrir (como no app Medicamentos).
   Idempotente. Uso: node scripts/repack-cores.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
function bloco(id, fn) {
  const re = new RegExp('(<script type="text/plain" id="' + id.replace(/[.]/g, '\\.') + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  const a = lz.decompressFromBase64(m[2].trim()); const b = fn(a); if (b === a) return;
  const enc = lz.compressToBase64(b); if (lz.decompressFromBase64(enc) !== b) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]);
}
function troca(s, de, para, rot) {
  if (s.includes(para)) return s;
  if (s.split(de).length !== 2) throw Error(rot + ': esperava 1 ocorrência, achei ' + (s.split(de).length - 1));
  return s.replace(de, () => para);
}
const PALETA = {
  med: ['#1F4E99', '#173B75', '#E7EDF8'], ali: ['#1B7A43', '#145C32', '#E5F4EB'], ser: ['#5B3CC4', '#452D9A', '#EEEAFC'],
  pro: ['#A65A06', '#7F4504', '#FDF0DF'], ass: ['#A8295F', '#811F49', '#FBE7F0'], odo: ['#0B7480', '#08565F', '#E1F3F5']
};
{
  const ini = html.indexOf('<style id="home-option-b-overrides">'); if (ini < 0) throw Error('overrides');
  const a = html.indexOf(':root{', ini), b = html.indexOf('}', a);
  const novo = ':root{\n  --brand:#174C68;--brand-strong:#103C54;--brand-mid:#25535B;--brand-soft:#E8F0F4;\n'
    + Object.entries(PALETA).map(([k, [c, d, w]]) => `  --t-${k}:${c};--t-${k}-d:${d};--t-${k}-w:${w};`).join('\n') + '\n';
  html = html.slice(0, a) + novo + html.slice(b);
}
const CSS = `
/* cores vivas (17/10/2026): cor do núcleo nos destaques */
.pu-ativo .pu-faixa button[aria-current=step]{background:var(--pu-cor);border-color:var(--pu-cor);box-shadow:0 0 0 2px color-mix(in srgb,var(--pu-cor) 30%,transparent)}
.pu-ativo .pu-item-card{border-color:color-mix(in srgb,var(--pu-cor) 26%,#d7e0e5)}
.pu-ativo .pu-item-card:hover{border-color:var(--pu-cor);background:color-mix(in srgb,var(--pu-cor) 5%,#fff)}
.pu-ativo .pu-item-card.pu-completo{border-color:color-mix(in srgb,var(--pu-cor) 55%,#fff);background:color-mix(in srgb,var(--pu-cor) 7%,#fff)}
.pu-ativo .pu-item-card.pu-completo .pu-num{background:var(--pu-cor)}
.pu-ativo .pu-item-card.pu-completo .pu-num::after{content:" ✓"}
.pu-ativo .pu-abrir,.pu-ativo .pu-btn,.pu-ativo .pu-mais>summary{color:var(--pu-cor)}
.pu-ativo .pu-btn{border-color:color-mix(in srgb,var(--pu-cor) 35%,#fff)}
.pu-ativo .pu-btn-pri,.pu-ativo .pu-btn-pri:hover{background:var(--pu-cor);border-color:var(--pu-cor);color:#fff}
.pu-ativo .pu-n{background:color-mix(in srgb,var(--pu-cor) 12%,#fff);color:var(--pu-cor)}
.pu-ativo .pu-bloco>h3,.pu-ativo .pu-campo b{color:var(--pu-cor)}
.pu-ativo .pu-rodape [data-pu-nav=prox]:not([disabled]){background:var(--pu-cor);border-color:var(--pu-cor);color:#fff}
.pu-ativo .pu-rodape button{color:var(--pu-cor)}
.pu-ativo .pu-rodape [data-pu-nav=prox]:not([disabled]) svg{color:#fff;stroke:#fff}
`;
bloco('rec--padrao-uvis.css', s => s.includes('cores vivas (17/10/2026)') ? s : s + CSS);
bloco('rec--padrao-uvis.js', s => troca(s, "if(cfg.cor)document.documentElement.style.setProperty('--pu-cor',cfg.cor);",
  "/* cor do núcleo vinda da casca (paleta única); sem casca, a do roteiro */var cor=cfg.cor;try{var ap=document.documentElement.getAttribute('data-uvis-app'),tm=ap&&parent!==window&&parent.__uvisTemaApp?parent.__uvisTemaApp(ap):null;if(tm&&tm[0]&&!/^#2f4655$/i.test(tm[0]))cor=tm[0]}catch(e){}if(cor)document.documentElement.style.setProperty('--pu-cor',cor);", 'padrão cor'));
html = troca(html, "    try { fonte = montar(app); if(window.__uvisCampoInjeta)",
  "    try { fonte = montar(app); if(nucleoAtual && window.__uvisTom) fonte = window.__uvisTom(fonte, css(VAR_NUCLEO[nucleoAtual], ''), css(VAR_NUCLEO[nucleoAtual] + '-d', '')); if(window.__uvisCampoInjeta)", 'tom ao abrir');
html = troca(html, '<style id="home-option-b-overrides">',
  `<script id="uvis-tom">/* tom do núcleo nos módulos com o ardósia fixo no código (drogaria, manipulação, distribuidora) */
window.__uvisTom=function(fonte,tom,tomD){if(!tom||!tomD)return fonte;return fonte.replace(/#(365B73|2F4655|304F63|2B485C|205777|263F50)\\b/gi,function(m,h){h=h.toUpperCase();return (h==='365B73'||h==='2F4655')?tom:tomD;});};
</script>
<style id="home-option-b-overrides">`, 'tom script');
fs.writeFileSync(file, html);
console.log('Cores aplicadas.');
