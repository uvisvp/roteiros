/* Checklist por ponto (Atende / Não atende / N/A) nas perguntas compostas dos
   roteiros de motor próprio — Odontologia, Serviços assistenciais, Produtos e
   Alimentos (pedido de 17/10/2026, o mesmo padrão do motor roteiro-simples).
   Dados: window.__UVS_PONTOS = {app, chave, q: {id: {p: [[ponto, rótulo]…],
   nc: 'frase com {} no lugar dos pontos não atendidos'}}, porTexto} (pontos/<app>.cjs;
   com porTexto, as chaves são o início do texto da pergunta),
   gravado no módulo por scripts/repack-pontos.cjs).
   Cada pergunta (.pu-q) com pontos ganha o checklist logo depois dos botões de
   resposta; o resultado marca a resposta pelo próprio botão do módulo: algum
   “Não atende” → Não cumpre; todos verificados sem “Não atende” → Cumpre (ou
   Não se aplica, se todos N/A). O relatório usa UvsPontos.frase(id): a frase
   de irregularidade com os pontos não atendidos. Estado em localStorage (a
   chave vai nas Inspeções salvas); se o módulo apagar a resposta (Apagar tudo,
   Nova inspeção), os pontos da pergunta também saem. */
(function(){
 var D = window.__UVS_PONTOS; if(!D || window.UvsPontos) return;
 var KEY = D.chave, OPTS = [['C', 'Atende', 'ok'], ['NC', 'Não atende', 'nao'], ['NA', 'N/A', 'na']], RESP = ['c', 'nc', 'na'];
 var le = function(){ try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch(e){ return {}; } };
 var grava = function(s){ try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} };
 var esc = function(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); };
 var lista = function(xs){ return xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1]; };
 /* id da pergunta a partir do bloco .pu-q, conforme o módulo */
 function qid(el){
  switch(D.app){
   case 'odontologia': return el.getAttribute('data-odo-q');
   /* assistenciais: modalidade + texto da pergunta (os pontos valem pelo texto, em qualquer modalidade) */
   case 'servicos-assistenciais': { var k = (el.getAttribute('data-as-q') || '').split('|'), it = null, sv = '';
    try { sv = current.id; it = current[k[0]][+k[1]]; } catch(e){} return it && it.i ? sv + '|' + it.i : null; }
   case 'produtos-correlatos': return el.id && el.id.indexOf('item-') === 0 ? el.id.slice(5) : null;
   case 'servicos-alimentacao-roteiro': return el.getAttribute('data-sa-q');
  }
  return el.getAttribute('data-q');
 }
 /* definição dos pontos: pelo id ou, nos assistenciais, pelo início do texto da pergunta */
 var achado = {};
 function def(id){ if(!id) return null; if(D.q[id]) return D.q[id]; if(!D.porTexto) return null;
  if(achado[id] !== undefined) return achado[id];
  var t = id.slice(id.indexOf('|') + 1), k = Object.keys(D.q).filter(function(x){ return t.indexOf(x) === 0; }).sort(function(a, b){ return b.length - a.length; })[0];
  return (achado[id] = k ? D.q[k] : null); }
 function botoes(el){ var r = el.querySelector('.pu-resp'); return r ? r.querySelectorAll('button') : []; }
 function resposta(el){ var b = botoes(el); for(var i = 0; i < b.length && i < 3; i++) if(b[i].getAttribute('aria-pressed') === 'true') return RESP[i]; return ''; }
 function marca(el, v){ var b = botoes(el), i = RESP.indexOf(v); if(i >= 0 && b[i] && b[i].getAttribute('aria-pressed') !== 'true') b[i].click(); }
 function resultado(q, m){ var v = q.p.map(function(p){ return m[p[0]]; });
  if(v.indexOf('NC') >= 0) return 'nc';
  if(v.every(function(x){ return x === 'C' || x === 'NA'; })) return v.every(function(x){ return x === 'NA'; }) ? 'na' : 'c';
  return ''; }
 function caixa(id){ var q = def(id), m = le()[id] || {}, n = q.p.filter(function(p){ return m[p[0]]; }).length, x = q.p.filter(function(p){ return m[p[0]] === 'NC'; }).length;
  return '<p class="uvs-pontos-tit"><b>Checklist</b> <small>' + n + '/' + q.p.length + ' verificados' + (x ? ' · ' + x + ' não atende' + (x > 1 ? 'm' : '') : '') + ' — o resultado acompanha os pontos</small></p>'
   + q.p.map(function(p){ return '<div class="uvs-ponto' + (m[p[0]] === 'NC' ? ' uvs-ponto-nc' : '') + '"><span>' + esc(p[1].charAt(0).toUpperCase() + p[1].slice(1)) + '</span><div class="uvs-ponto-tog" role="group" aria-label="' + esc(p[1]) + '">'
    + OPTS.map(function(o){ return '<button type="button" data-uvs-pt="' + esc(id + '¦' + p[0] + '¦' + o[0]) + '" data-v="' + o[2] + '" aria-pressed="' + (m[p[0]] === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></div>'; }).join(''); }
 function injeta(){
  var s = null, mudou = false;
  document.querySelectorAll('.pu-q').forEach(function(el){
   var id = qid(el); if(!id || !def(id)) return;
   s = s || le();
   /* a resposta que o checklist marcou sumiu: o módulo apagou a pergunta */
   if(s[id] && s[id]._r && !resposta(el)){ delete s[id]; mudou = true; }
   var box = el.querySelector(':scope > .uvs-pontos');
   if(!box){ box = document.createElement('div'); box.className = 'uvs-pontos'; box.setAttribute('data-uvs-q', id);
    var r = el.querySelector('.pu-resp'); if(r && r.parentNode) r.parentNode.insertBefore(box, r.nextSibling); else el.appendChild(box); }
   if(mudou || !box.childNodes.length) box.innerHTML = caixa(id);
  });
  if(mudou) grava(s);
 }
 document.addEventListener('click', function(e){
  var b = e.target.closest && e.target.closest('[data-uvs-pt]'); if(!b) return;
  e.preventDefault(); e.stopPropagation();
  var pp = b.getAttribute('data-uvs-pt').split('¦'), id = pp[0], q = def(id); if(!q) return;
  var s = le(), m = s[id] = Object.assign({}, s[id]);
  if(m[pp[1]] === pp[2]) delete m[pp[1]]; else m[pp[1]] = pp[2];
  var res = resultado(q, m); if(res) m._r = res;
  grava(s);
  var el = b.closest('.pu-q'), box = b.closest('.uvs-pontos'); if(box) box.innerHTML = caixa(id);
  if(res && el) marca(el, res);
 }, true);
 var css = document.createElement('style');
 css.textContent = '.uvs-pontos{margin:10px 0 0;padding:10px 12px;border:1px solid color-mix(in srgb,var(--pu-cor,#1E5A8A) 28%,#fff);border-radius:10px;background:color-mix(in srgb,var(--pu-cor,#1E5A8A) 4%,#fff)}'
  + '.uvs-pontos-tit{margin:0 0 6px;font-size:.86rem;color:#26343d}.uvs-pontos-tit small{color:#5a6972}'
  + '.uvs-ponto{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 12px;align-items:center;padding:8px 0;border-top:1px solid #e3e9ed}.uvs-ponto:first-of-type{border-top:0}'
  + '.uvs-ponto>span{font-size:.9rem;line-height:1.35;color:#1b262d}.uvs-ponto-nc>span{color:#8a2433;font-weight:600}'
  + '.uvs-ponto-tog{display:inline-grid;grid-template-columns:repeat(3,auto);gap:4px}'
  + '.uvs-ponto-tog button{min-height:40px;min-width:40px;padding:6px 10px;border:1px solid #c7d5de;border-radius:8px;background:#fff;color:#466070;font:inherit;font-size:.8rem;font-weight:650;cursor:pointer}'
  + '.uvs-ponto-tog button[aria-pressed=true][data-v=ok]{background:#13764f;border-color:#13764f;color:#fff}'
  + '.uvs-ponto-tog button[aria-pressed=true][data-v=nao]{background:#b03749;border-color:#b03749;color:#fff}'
  + '.uvs-ponto-tog button[aria-pressed=true][data-v=na]{background:#5d6e7a;border-color:#5d6e7a;color:#fff}'
  + '@media(max-width:560px){.uvs-ponto{grid-template-columns:1fr}.uvs-ponto-tog{justify-self:stretch;grid-template-columns:repeat(3,minmax(0,1fr))}}';
 (document.head || document.documentElement).appendChild(css);
 var agenda = null;
 new MutationObserver(function(){ if(agenda) return; agenda = setTimeout(function(){ agenda = null; injeta(); }, 30); }).observe(document.documentElement, {childList: true, subtree: true});
 if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injeta); else injeta();
 window.UvsPontos = {
  tem: function(id){ return !!def(id); },
  nc: function(id){ var q = def(id), m = le()[id] || {}; return q ? q.p.filter(function(p){ return m[p[0]] === 'NC'; }).map(function(p){ return p[1]; }) : []; },
  /* frase de irregularidade com os pontos não atendidos ('' quando não há) */
  frase: function(id){ var l = this.nc(id); return l.length ? def(id).nc.replace('{}', lista(l)) : ''; }
 };
})();
