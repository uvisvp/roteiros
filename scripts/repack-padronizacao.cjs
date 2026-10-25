'use strict';
/* Padronização da navegação entre os roteiros (revisão geral de 25/10/2026):
   1. Cabeçalho: Campo, Fotos e Salvas com ícone e rótulo em todos os roteiros de navegação
      padrão (motor roteiro-simples, Odontologia, Produtos, Alimentação, Serviços assistenciais),
      como já era na Drogaria, Manipulação e Atacadista; no celular (até 560 px) só o ícone.
   2. Drogaria e Manipulação: “x/y respondidas” nos cartões das seções, como nos demais.
   3. Atacadista: faixa de etapas (Todas + etapas) também na grade de etapas e, na barra
      inferior, os mesmos quatro botões dos demais roteiros (←, limpar, todas as seções, →).
   4. Resposta marcada (Cumpre / Não cumpre / Não se aplica) nas mesmas cores em todos: verde,
      vermelho e cinza; o Atacadista marcava Cumpre em azul e a Manipulação em tom claro.
      A ordem já era a mesma em todos (conforme, não conforme, não se aplica).
   O botão Campo e o cartão “Apagar dados” dos quatro módulos de navegação padrão vêm de
   campo/campo.js e campo/apagar-padrao.js (repack-campo).
   Idempotente. Uso: node scripts/repack-padronizacao.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);

function troca(s, de, para, rot) {
  if (s.includes(para)) return s;
  if (s.split(de).length !== 2) throw Error('Trecho não localizado de forma única: ' + rot);
  return s.replace(de, () => para);
}
function bloco(id, fn) {
  const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error('Bloco não localizado: ' + id);
  const src = lz.decompressFromBase64(m[2].trim()); if (!src) throw Error('descompactação ' + id);
  const s = fn(src);
  if (s === src) return;
  const enc = lz.compressToBase64(s); if (lz.decompressFromBase64(enc) !== s) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]);
}

/* 1. rótulos no cabeçalho (o botão Campo copia as regras do de Fotos) */
const MARCA_CAB = '/* padronização (25/10/2026): Campo, Fotos e Salvas com rótulo */';
const CSS_CAB = '\n' + MARCA_CAB + '\n'
  + '.pu-ativo .pu-acoes #uvs-botao span:not(.n),.pu-ativo .pu-acoes #uvs-fotos span:not(.n){display:inline!important}\n'
  + '.pu-ativo .pu-acoes #uvs-botao,.pu-ativo .pu-acoes #uvs-fotos{width:auto;gap:6px;padding:6px 11px!important;font:600 13px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;white-space:nowrap}\n'
  + '@media(max-width:560px){.pu-ativo .pu-acoes #uvs-botao span,.pu-ativo .pu-acoes #uvs-fotos span,.pu-ativo .pu-acoes #uvs-botao span:not(.n),.pu-ativo .pu-acoes #uvs-fotos span:not(.n){display:none!important}.pu-ativo .pu-acoes #uvs-botao,.pu-ativo .pu-acoes #uvs-fotos{width:44px;padding:0!important}}\n';
bloco('rec--padrao-uvis.css', s => {
  const i = s.indexOf(MARCA_CAB);
  if (i >= 0) { const j = s.indexOf('\n/*', i + MARCA_CAB.length); s = s.slice(0, i - 1) + (j >= 0 ? s.slice(j) : ''); }
  return s + CSS_CAB;
});

/* 2a. Drogaria: perguntas do catálogo da seção (achados de marcar ficam fora) */
bloco('app--drogaria', s => {
  s = troca(s, "function home(){return '<div class=\"ui-card-grid\">'",
    "function progCard(id){try{const r=E.instances(catalog,state).filter(i=>i.q.card===id&&i.q.tipo!=='achado'),f=r.filter(i=>state.answers[i.key]).length;return r.length?'<small class=\"pu-prog\">'+f+'/'+r.length+' respondidas</small>':''}catch(e){return ''}}\n"
    + "function home(){return '<div class=\"ui-card-grid\">'", 'Drogaria: função de progresso');
  s = troca(s, "<strong>'+esc(c.titulo.replace(/^\\d+[. ]*/,''))+'</strong></span></button>'",
    "<strong>'+esc(c.titulo.replace(/^\\d+[. ]*/,''))+'</strong>'+progCard(c.id)+'</span></button>'", 'Drogaria: progresso no cartão');
  s = troca(s, '<!--css:med-tools.css--></head>',
    '<!--css:med-tools.css--><style id="drg-prog">.ui-card-grid .pu-prog{display:block;margin-top:4px;font-size:.72rem;font-weight:750;color:#5b6f7c}</style></head>', 'Drogaria: estilo do progresso');
  return s;
});

/* 2b. Manipulação (casca, navegação em três níveis): soma dos itens da seção */
html = troca(html, "        var refreshOriginal=pharmacyRefresh;pharmacyRefresh=function(){renderCardGrid();",
  "        var gradeOriginal=renderCardGrid;renderCardGrid=function(){gradeOriginal();document.querySelectorAll('#cardGrid [data-open-card]').forEach(function(b){var t=0,d=0;itens(b.dataset.openCard).forEach(function(x){var q=contagem(x);t+=q.t;d+=q.d});var sp=b.querySelector('span:last-child');if(t&&sp&&!sp.querySelector('.pu-prog'))sp.insertAdjacentHTML('beforeend','<small class=\"pu-prog\">'+d+'/'+t+' respondidas</small>')})};\n"
  + "        var refreshOriginal=pharmacyRefresh;pharmacyRefresh=function(){renderCardGrid();", 'Manipulação: progresso nas seções');
html = troca(html, '<style id="manipulacao-tres-niveis">#cardGrid{',
  '<style id="manipulacao-tres-niveis">#cardGrid .pu-prog{display:block;margin-top:4px;font-size:.72rem;font-weight:750;color:var(--muted)}'
  + '.seg button.on[data-v=C]{background:#13764f!important;border-color:#13764f!important;color:#fff!important}'
  + '.seg button.on[data-v=NC]{background:#b03749!important;border-color:#b03749!important;color:#fff!important}'
  + '.seg button.on[data-v=NA]{background:#5d6e7a!important;border-color:#5d6e7a!important;color:#fff!important}#cardGrid{', 'Manipulação: estilo do progresso e da resposta');

/* 3. Atacadista */
const GRADE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z"/></svg>';
const LIMPA = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4h12v16H9l-7-8 7-8M12 9l6 6M18 9l-6 6"/></svg>';
const DIST = '<style id="dist-padrao-nav">'
  + '.dist-faixa{margin:0 0 10px}.dist-faixa .dist-nav{margin:0}'
  + '.dockin{grid-template-columns:repeat(4,minmax(0,1fr))!important;max-width:none!important;gap:8px!important}'
  + '.dockin #distClear,.dockin #distTodas{display:grid;place-items:center;min-height:44px;padding:6px!important}'
  + '.dockin #distClear{color:#b9544d}.dockin #distClear:disabled{color:#d8b4b1}'
  + '.dockin #distTodas{background:#e8f0f7;border-color:#e8f0f7;color:#22506C}.dockin #distTodas:disabled{opacity:.55}'
  + '@media(max-width:600px){.dockin{grid-template-columns:repeat(4,minmax(0,1fr))!important}}'
  /* resposta marcada nas cores dos demais roteiros: verde, vermelho e cinza */
  + '.seg button[aria-pressed=true][data-v=C]{background:#13764f!important;border-color:#13764f!important;color:#fff!important}'
  + '.seg button[aria-pressed=true][data-v=NC]{background:#b03749!important;border-color:#b03749!important;color:#fff!important}'
  + '.seg button[aria-pressed=true][data-v=NA]{background:#5d6e7a!important;border-color:#5d6e7a!important;color:#fff!important}'
  + '</style><script id="dist-padrao-nav-js">\n'
  + '/* Padronização (25/10/2026): faixa “Todas + etapas” na grade de etapas e barra inferior\n'
  + '   com os quatro botões dos demais roteiros: ←, limpar, todas as seções, →. */\n'
  + '(function distPadraoNav(){\n'
  + " const navOriginal=distNav;distNav=function(atual){return navOriginal(atual).replace('<div class=\"dist-nav\">','<div class=\"dist-nav\"><button class=\"dist-nav-b'+(atual?'':' on')+'\" data-dist-todas aria-current=\"'+(atual?'false':'step')+'\">Todas</button>')};\n"
  + " const rvOriginal=roteiroView;roteiroView=function(){const h=rvOriginal.apply(this,arguments),c=Number(state.activeCard||0);return c>=1&&c<=8?h:'<div class=\"dist-faixa\">'+distNav(0)+'</div>'+h};\n"
  + " function todas(){state.view='inspection';state.itab='roteiro';state.activeCard=null;save();renderInspection();window.scrollTo(0,0)}\n"
  + " document.addEventListener('click',function(e){const b=e.target.closest&&e.target.closest('[data-dist-todas]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();todas()},true);\n"
  + " const dockOriginal=distDock;distDock=function(){dockOriginal();const clear=byId('distClear'),next=byId('dockNext');let g=byId('distTodas');\n"
  + "  if(!g){g=document.createElement('button');g.type='button';g.id='distTodas';g.className='btn';g.setAttribute('aria-label','Todas as seções');g.title='Todas as seções';g.innerHTML='" + GRADE + "';g.addEventListener('click',todas);next.parentElement.insertBefore(g,next)}\n"
  + "  if(clear){const t=clear.textContent.trim()||clear.getAttribute('aria-label')||'Limpar dados';clear.setAttribute('aria-label',t);clear.title=t;clear.innerHTML='" + LIMPA + "'}\n"
  + "  g.disabled=state.view==='inspection'&&state.itab==='roteiro'&&!Number(state.activeCard||0)};\n"
  + ' try{distDock()}catch(e){}\n'
  + '})();\n</script>';
bloco('app--distribuidoras-transportadoras', s => {
  s = s.replace(/<style id="dist-padrao-nav">[\s\S]*?<\/script>/, '');
  const k = s.lastIndexOf('</body></html>'); if (k < 0) throw Error('Atacadista: fim do documento');
  return s.slice(0, k) + DIST + s.slice(k);
});

fs.writeFileSync(file, html);
console.log('Padronização: rótulos no cabeçalho, progresso nas seções (Drogaria e Manipulação) e navegação do Atacadista.');
