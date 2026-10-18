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
   - Tela inicial (pedido seguinte, “as cores da tela inicial mais vivas”): os
     cards dos núcleos usam a mesma paleta, e a marca (botão Consultas, símbolo
     do topo) passa a azul vivo, o mesmo do ícone (scripts/icones-cor.py).
   - Central de Consultas (18/10/2026): o mesmo azul vivo da marca.
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
  const novo = ':root{\n  --brand:#126AE0;--brand-strong:#0D54B5;--brand-mid:#25535B;--brand-soft:#E6F0FC;\n'
    + Object.entries(PALETA).map(([k, [c, d, w]]) => `  --t-${k}:${c};--t-${k}-d:${d};--t-${k}-w:${w};`).join('\n') + '\n';
  html = html.slice(0, a) + novo + html.slice(b);
}
/* tela inicial: cards dos núcleos e botão Consultas sem os tons fixos acinzentados */
{
  const ini = html.indexOf('<style id="home-option-b-overrides">'), fim = html.indexOf('</style>', ini);
  let css = html.slice(ini, fim);
  const sub = (re, para, rot) => { if (!re.test(css)) throw Error('tela inicial: ' + rot); css = css.replace(re, para); };
  const K = {Medicamentos: 'med', Alimentos: 'ali', 'Serviços': 'ser', Produtos: 'pro', 'Serviços assistenciais': 'ass', Odontologia: 'odo'};
  for (const [n, k] of Object.entries(K)) {
    sub(new RegExp(`(\\.nucleus-card\\[data-nucleo="${n}"\\]\\{background:)[^!]+(!important\\})`), `$1var(--t-${k})$2`, n);
    sub(new RegExp(`(\\.nucleus-card\\[data-nucleo="${n}"\\] \\.nucleus-symbol\\{color:)[^!]+(!important\\})`), `$1var(--t-${k})$2`, n + ' símbolo');
  }
  sub(/(\.quick-action\.primary\{background:)[^!]+(!important;color:#fff!important;border-color:)[^!]+(!important)/, '$1var(--brand)$2var(--brand)$3', 'Consultas');
  sub(/(\.quick-action\.primary:hover,\.quick-action\.primary:focus-visible\{background:)[^!]+(!important;border-color:)[^!]+(!important)/, '$1var(--brand-strong)$2var(--brand-strong)$3', 'Consultas hover');
  html = html.slice(0, ini) + css + html.slice(fim);
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
/* paleta antiga do padrão (rec--padrao.css, módulos com body.p-on, como Produtos): os mesmos tons vivos */
const P_TONE = {medicamentos: 'med', alimentos: 'ali', servicos: 'ser', produtos: 'pro', 'servicos-assistenciais': 'ass', odontologia: 'odo'};
bloco('rec--padrao.css', s => {
  for (const [n, k] of Object.entries(P_TONE)) {
    const re = new RegExp(`html\\[data-nucleo="${n}"\\]\\{--p-tone:#[0-9a-fA-F]{6};--p-tone-ink:#[0-9a-fA-F]{6}\\}`);
    if (!re.test(s)) throw Error('paleta p-tone: ' + n);
    s = s.replace(re, `html[data-nucleo="${n}"]{--p-tone:${PALETA[k][0]};--p-tone-ink:${PALETA[k][1]}}`);
  }
  return s;
});
/* cor do núcleo vinda da casca; o cinza padrão é escrito em partes porque __uvisTom
   troca os tons ardósia escritos por extenso no código do módulo (e trocava o do teste) */
const VELHA_COR = "/* cor do núcleo vinda da casca (paleta única); sem casca, a do roteiro */var cor=cfg.cor;try{var ap=document.documentElement.getAttribute('data-uvis-app'),tm=ap&&parent!==window&&parent.__uvisTemaApp?parent.__uvisTemaApp(ap):null;if(tm&&tm[0]&&!/^#2f4655$/i.test(tm[0]))cor=tm[0]}catch(e){}if(cor)document.documentElement.style.setProperty('--pu-cor',cor);";
const NOVA_COR = "/* cor do núcleo vinda da casca (paleta única); sem casca, a do roteiro */var cor=cfg.cor;try{var ap=document.documentElement.getAttribute('data-uvis-app'),tm=ap&&parent!==window&&parent.__uvisTemaApp?parent.__uvisTemaApp(ap):null;if(tm&&tm[0]&&String(tm[0]).toLowerCase()!=='#'+'2f'+'4655')cor=tm[0]}catch(e){}if(cor)document.documentElement.style.setProperty('--pu-cor',cor);";
bloco('rec--padrao-uvis.js', s => s.includes(VELHA_COR) ? s.replace(VELHA_COR, () => NOVA_COR) : troca(s, "if(cfg.cor)document.documentElement.style.setProperty('--pu-cor',cfg.cor);",
  NOVA_COR, 'padrão cor'));
html = troca(html, "    try { fonte = montar(app); if(window.__uvisCampoInjeta)",
  "    try { fonte = montar(app); if(nucleoAtual && window.__uvisTom) fonte = window.__uvisTom(fonte, css(VAR_NUCLEO[nucleoAtual], ''), css(VAR_NUCLEO[nucleoAtual] + '-d', '')); if(window.__uvisCampoInjeta)", 'tom ao abrir');
html = troca(html, '<style id="home-option-b-overrides">',
  `<script id="uvis-tom">/* tom do núcleo nos módulos com o ardósia fixo no código (drogaria, manipulação, distribuidora) */
window.__uvisTom=function(fonte,tom,tomD){if(!tom||!tomD)return fonte;return fonte.replace(/#(365B73|2F4655|304F63|2B485C|205777|263F50)\\b/gi,function(m,h){h=h.toUpperCase();return (h==='365B73'||h==='2F4655')?tom:tomD;});};
</script>
<style id="home-option-b-overrides">`, 'tom script');
/* Central de Consultas (pedido de 18/10/2026, “as cores vividas também na tela de
   consultas”): o azul vivo da marca, o mesmo do botão Consultas da tela inicial, no lugar
   do ardósia — cabeçalho, modos de busca e botão Pesquisar */
bloco('app--central-consultas', s => {
  s = troca(s, '--tone:var(--ui-blue,#365B73); --tone-dark:var(--ui-navy,#304F63);', '--tone:#126AE0; --tone-dark:#0D54B5;', 'consultas: tom');
  return troca(s, '</head>', '<style id="consultas-cores-vivas">html,html.uvis-layout{--ui-navy:#126AE0!important;--ui-blue:#126AE0!important}</style></head>', 'consultas: cabeçalho');
});
fs.writeFileSync(file, html);
console.log('Cores aplicadas.');
