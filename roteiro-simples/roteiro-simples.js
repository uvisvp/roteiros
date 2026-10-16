/* Roteiro simples — motor genérico dos roteiros novos do site Medicamentos
   (EAC, vacinação e os que vierem). Dirigido por dados: window.ROTEIRO traz as
   seções, os itens, as perguntas com as frases do relatório, as infrações e o
   texto oficial dos dispositivos citados (montado em build/montar.cjs).

   Tela: componente padrão (UvisPadrao, injetado pela casca): seções › itens ›
   perguntas, com Cumpre / Não cumpre / Não se aplica (ou Sim / Não / Não se
   aplica, com D.respostas = 'simnao'), situação encontrada,
   foto, prévia “Como sai no relatório” e a citação clicável (data-voltar-nucleo
   fica no cabeçalho do componente).
   Relatório: Word (.docx) montado no aparelho; fotos em PDF à parte (botão
   Fotos do cabeçalho). Estado em localStorage (ROTEIRO.store), levado pelas
   Salvas da casca. */
(function(){
 'use strict';
 var D = window.ROTEIRO, STORE = D.store;
 var esc = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
 function novo(){ return {v: 1, meta: {}, r: {}, sit: {}, fotos: {}, inf: {}, concl: ''}; }
 function carrega(){ try { var x = JSON.parse(localStorage.getItem(STORE) || 'null'); if(x && x.v === 1) return Object.assign(novo(), x); } catch(e){} return novo(); }
 var st = carrega();
 /* campo de equipamentos que substituiu um texto livre (c.legado): o texto antigo vira o primeiro equipamento */
 D.secoes.forEach(function(s){ s.itens.forEach(function(it){ (it.campos || []).forEach(function(c){ if(c.tipo !== 'equipamentos' || !c.legado) return;
  var ant = String(st.meta[c.legado] || '').trim(); if(!ant) return; if(!(Array.isArray(st.meta[c.id]) && st.meta[c.id].length)) st.meta[c.id] = [{obs: ant}]; delete st.meta[c.legado]; }); }); });
 function salva(){ st.em = new Date().toISOString(); try { localStorage.setItem(STORE, JSON.stringify(st)); } catch(e){ aviso('Não foi possível salvar no aparelho (memória cheia?). Remova fotos ou exporte pelas Salvas.'); } }
 function aviso(t){ var a = document.getElementById('rs-aviso'); if(!a){ a = document.createElement('div'); a.id = 'rs-aviso'; a.setAttribute('role', 'status'); document.body.appendChild(a); } a.textContent = t; a.classList.add('on'); clearTimeout(aviso.t); aviso.t = setTimeout(function(){ a.classList.remove('on'); }, 3500); }

 /* ---------- dados derivados ---------- */
 var PERG = {}, ONDE = {}, ORDEM = [];
 D.secoes.forEach(function(s, si){ s.itens.forEach(function(it, ii){ (it.perguntas || []).forEach(function(q, qi){ PERG[q.id] = q; ONDE[q.id] = {s: s, it: it, n: (si + 1) + '.' + (ii + 1) + '.' + (qi + 1)}; ORDEM.push(q.id); }); }); });
 var INF = {}; D.infracoes.forEach(function(i){ INF[i.id] = i; });
 function visivel(q){ var c = q.se; if(!c) return true; var v = st.meta[c.campo]; if(c.inclui) return Array.isArray(v) && v.indexOf(c.inclui) >= 0; if(c.igual !== undefined) return v === c.igual; return true; }
 function perguntasDe(it){ return (it.perguntas || []).filter(visivel); }
 function campoPreenchido(c){ var v = st.meta[c.id]; return Array.isArray(v) ? v.some(function(x){ return x && typeof x === 'object' ? eqTem(x) : true; }) : !!String(v || '').trim(); }
 function progressoItem(it){ var ps = perguntasDe(it), cs = it.campos || []; return {feitos: ps.filter(function(q){ return st.r[q.id]; }).length + cs.filter(campoPreenchido).length, total: ps.length + cs.length}; }
 function nNC(){ return ORDEM.filter(function(id){ return st.r[id] === 'nc' && visivel(PERG[id]); }).length; }
 function sugeridas(){ var s = {}; ORDEM.forEach(function(id){ var q = PERG[id]; if(st.r[id] === 'nc' && visivel(q)) (q.inf || []).forEach(function(i){ (s[i] = s[i] || []).push(ONDE[id].n); }); }); return s; }
 function lista(xs){ return xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1]; }

 /* ---------- citações ---------- */
 function rotulo(id){ var l = D.legal[id]; return l ? l.norma.replace(/^(RDC|Lei) (Anvisa |Federal |Municipal )?nº /, '$1 ') + ' · ' + l.disp : id; }
 function citacao(id){ var l = D.legal[id]; return l ? l.norma + ', ' + l.disp : id; }
 function fundamento(refs){ /* agrupa por norma: “RDC Anvisa nº 978/2025, art. 10, I, e art. 173” */
  var g = [], m = {}; (refs || []).forEach(function(id){ var l = D.legal[id]; if(!l) return; if(!m[l.norma]){ m[l.norma] = []; g.push(l.norma); } if(m[l.norma].indexOf(l.disp) < 0) m[l.norma].push(l.disp); });
  return g.map(function(n){ return n + ', ' + m[n].join('; '); }).join('; '); }
 /* A janela padrão de citações (injetada pela casca) intercepta [data-legal] e
    pergunta o texto a window.UvisLocalReferences; o modal próprio fica de reserva. */
 window.UvisLocalReferences = function(b){ return String(b.dataset.legal || '').split(',').map(function(id){ return D.legal[id]; }).filter(Boolean).map(function(x){ return {law: x.norma, device: x.disp, text: x.texto, url: x.url}; }); };
 function botoesCit(refs){ return (refs || []).map(function(id){ return '<button type="button" class="rs-cit" data-legal="' + esc(id) + '">' + esc(rotulo(id)) + '</button>'; }).join(''); }
 function abreLegal(id){ var l = D.legal[id]; if(!l) return; var m = document.getElementById('rs-modal');
  if(!m){ m = document.createElement('div'); m.id = 'rs-modal'; m.innerHTML = '<div class="rs-modal-caixa" role="dialog" aria-modal="true"><header><b></b><button type="button" data-rs-fecha aria-label="Fechar">×</button></header><div class="rs-modal-corpo"></div></div>'; document.body.appendChild(m);
   m.addEventListener('click', function(e){ if(e.target === m || e.target.closest('[data-rs-fecha]')) m.classList.remove('on'); }); }
  m.querySelector('header b').textContent = l.norma + ' — ' + l.disp;
  m.querySelector('.rs-modal-corpo').innerHTML = l.texto.split('\n').map(function(p){ return '<p>' + esc(p) + '</p>'; }).join('') + (l.url ? '<p><a href="' + esc(l.url) + '" target="_blank" rel="noopener">Abrir a norma na fonte oficial ↗</a></p>' : '');
  m.classList.add('on'); }

 /* ---------- frases do relatório ---------- */
 /* q.checks: lista que abre com a resposta conforme e só complementa a frase (não gera infração).
    q.na em texto: frase própria do “Não se aplica” (ex.: “Não há produtos que exijam refrigeração.”) */
 function checksTxt(q){ var C = q.checks; if(!C) return ''; var a = Array.isArray(st.meta['chk_' + q.id]) ? st.meta['chk_' + q.id] : [], out = [];
  C.opcoes.forEach(function(o){ if(o[0] !== 'outro' && a.indexOf(o[0]) >= 0) out.push(o[2] || o[1].charAt(0).toLowerCase() + o[1].slice(1)); });
  var ou = String(st.meta['chk_' + q.id + '_outro'] || '').trim(); if(ou && (a.indexOf('outro') >= 0 || !C.opcoes.some(function(o){ return o[0] === 'outro'; }))) out.push(ou.replace(/\.$/, ''));
  return lista(out); }
 function frase(q){ var r = st.r[q.id]; if(r === 'c'){ var ck = checksTxt(q); return ck ? (q.checks.frase ? q.checks.frase.replace('{}', ck) : q.c.replace(/\.$/, '') + ': ' + ck + '.') : q.c; }
  if(r === 'na' && typeof q.na === 'string') return q.na;
  if(r === 'nc'){ var s = String(st.sit[q.id] || '').trim(); return q.nc + (s ? ' Situação encontrada: ' + s.replace(/\.?$/, '.') : ''); } if(r === 'na') return 'Não se aplica: ' + q.t.replace(/\?$/, '.'); return ''; }

 /* ---------- tela do item ---------- */
 function campoHtml(c){ var v = st.meta[c.id], cls = 'pu-campo rs-campo' + (c.largo ? ' rs-largo' : '');
  if(c.tipo === 'equipamentos') return equipHtml(c);
  if(c.tipo === 'checks'){ var a = Array.isArray(v) ? v : []; return '<fieldset class="' + cls + ' rs-largo"><legend>' + esc(c.rotulo) + '</legend><div class="rs-checks">' + c.opcoes.map(function(o){ return '<label><input type="checkbox" data-rs-check="' + esc(c.id) + '" value="' + esc(o[0]) + '"' + (a.indexOf(o[0]) >= 0 ? ' checked' : '') + '><span>' + esc(o[1]) + '</span></label>'; }).join('') + '</div></fieldset>'; }
  if(c.tipo === 'select') return '<label class="' + cls + '"><span>' + esc(c.rotulo) + '</span><select data-rs-meta="' + esc(c.id) + '">' + [['', 'Selecione']].concat(c.opcoes).map(function(o){ return '<option value="' + esc(o[0]) + '"' + (v === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
  if(c.tipo === 'textarea') return '<label class="' + cls + '"><span>' + esc(c.rotulo) + '</span><textarea data-rs-meta="' + esc(c.id) + '" rows="3">' + esc(v || '') + '</textarea></label>';
  return '<label class="' + cls + '"><span>' + esc(c.rotulo) + '</span><input type="' + (c.tipo === 'date' ? 'date' : 'text') + '"' + (c.tipo === 'cnpj' ? ' inputmode="numeric" maxlength="18" data-rs-cnpj' : '') + ' data-rs-meta="' + esc(c.id) + '" value="' + esc(v || '') + '"></label>'; }
 /* ---------- listas de produtos com busca nas bases públicas da Anvisa ----------
    Campo tipo 'equipamentos' com c.perfil: 'refrigeracao' (equipamentos de
    refrigeração das vacinas), 'teste' (testes rápidos e reagentes do EAC) e
    'vacina' (vacinas do serviço). Cada item: busca pelo registro ou pelo processo
    (dispositivos/<prefixo do registro>.json; medicamentos/<prefixo>.json;
    processo pelo índice indices/processos), preenchimento dos dados do registro e
    edição/digitação livre. Sai no relatório em tabela, sob o título do item. */
 var CAMPO = {}; D.secoes.forEach(function(s){ s.itens.forEach(function(it){ (it.campos || []).forEach(function(c){ CAMPO[c.id] = c; }); }); });
 function vencMA(v){ var m = /^(\d{2})(\d{4})$/.exec(String(v || '')); return m ? m[1] + '/' + m[2] : String(v || ''); }
 var PERFIS = {
  refrigeracao: {item: 'Equipamento', mais: '+ Adicionar equipamento', base: 'dispositivos',
   campos: [['tipo', 'Tipo', 'select'], ['nome', 'Nome comercial / produto'], ['modelo', 'Marca e modelo'], ['registro', 'Registro na Anvisa'], ['processo', 'Processo na Anvisa'],
    ['fabricante', 'Fabricante (país)'], ['detentor', 'Detentor do registro'], ['classe', 'Classe de risco'], ['serie', 'Nº de série / patrimônio'], ['local', 'Local e uso'], ['obs', 'Observações', 'textarea']],
   confere: function(x){ return /C[ÂA]MARA|REFRIGER|CONSERVA[ÇC][ÃA]O|FREEZER|CONGELA|GELADEIRA|T[ÉE]RMIC/i.test(x.produto || ''); }, estranho: 'o produto deste registro não parece ser equipamento de refrigeração',
   tipoAuto: function(x){ return /C[ÂA]MARA/i.test(x.produto || '') ? 'Câmara refrigerada para imunobiológicos' : ''; },
   head: ['Equipamento', 'Registro e processo na Anvisa', 'Fabricante e detentor', 'Série, local e observações'],
   linha: function(e){ return [[e.tipo, e.nome, e.modelo], [rot('Registro ', e.registro) || 'Registro não informado', rot('Processo ', e.processo), e.classe], [rot('Fabricante: ', e.fabricante), rot('Detentor: ', e.detentor)], [rot('Série / patrimônio: ', e.serie), rot('Local: ', e.local), e.obs]]; }},
  teste: {item: 'Produto', mais: '+ Adicionar teste ou reagente', base: 'dispositivos',
   campos: [['tipo', 'Tipo', 'select'], ['nome', 'Produto (nome comercial)'], ['exame', 'Exame / analito'], ['registro', 'Registro na Anvisa'], ['processo', 'Processo na Anvisa'],
    ['fabricante', 'Fabricante (país)'], ['detentor', 'Detentor do registro'], ['classe', 'Classe de risco'], ['lote', 'Lote'], ['validade', 'Validade do lote'], ['obs', 'Observações', 'textarea']],
   confere: function(x){ return /TESTE|R[ÁA]PID|IMUNO|REAGENTE|TIRA|GLIC|COLESTER|HEMOGLOB|LIP[ÍI]D|TRIGLI|ANALISADOR|MONITOR|CASSETE|KIT|SARS|COVID|HIV|HEPATITE|DENGUE|S[ÍI]FILIS|INFLUENZA|ANT[ÍI]GENO|ANTICORPO|IG[GM]|PCR|LACTATO|CETONA|[ÁA]CIDO [ÚU]RICO|BETA ?HCG|GRAVIDEZ|CONTROLE|CALIBRADOR/i.test(x.produto || ''); }, estranho: 'o produto deste registro não parece ser teste ou reagente para diagnóstico in vitro',
   head: ['Produto', 'Registro e processo na Anvisa', 'Fabricante e detentor', 'Lote, validade e observações'],
   linha: function(e){ return [[e.tipo, e.nome, rot('Exame: ', e.exame)], [rot('Registro ', e.registro) || 'Registro não informado', rot('Processo ', e.processo), e.classe], [rot('Fabricante: ', e.fabricante), rot('Detentor: ', e.detentor)], [rot('Lote: ', e.lote), rot('Validade: ', e.validade), e.obs]]; }},
  vacina: {item: 'Vacina', mais: '+ Adicionar vacina', base: 'medicamentos',
   campos: [['nome', 'Vacina (nome comercial)'], ['principio', 'Princípio ativo'], ['registro', 'Registro na Anvisa'], ['processo', 'Processo na Anvisa'], ['detentor', 'Detentor do registro'],
    ['situacao', 'Situação do registro'], ['vencimento', 'Vencimento do registro'], ['lote', 'Lote'], ['validade', 'Validade do lote'], ['obs', 'Observações', 'textarea']],
   confere: function(x){ return /VACINA/i.test([x.produto, x.principio_ativo, x.classe_terapeutica].join(' ')); }, estranho: 'o produto deste registro não parece ser vacina',
   head: ['Vacina', 'Registro e processo na Anvisa', 'Detentor e situação do registro', 'Lote, validade e observações'],
   linha: function(e){ return [[e.nome, e.principio], [rot('Registro ', e.registro) || 'Registro não informado', rot('Processo ', e.processo)], [e.detentor, rot('Situação: ', e.situacao), rot('Vencimento do registro: ', e.vencimento)], [rot('Lote: ', e.lote), rot('Validade: ', e.validade), e.obs]]; }}
 };
 function perfil(c){ return PERFIS[(c && c.perfil) || 'refrigeracao'] || PERFIS.refrigeracao; }
 function rot(pre, v){ return sv(v) ? pre + String(v).trim() : ''; }
 var eqMsg = {};
 function eqLista(id){ return Array.isArray(st.meta[id]) ? st.meta[id] : []; }
 function eqTem(e){ return Object.keys(e || {}).some(function(k){ return !/^(busca|consulta|consultaReg)$/.test(k) && sv(e[k]); }); }
 function equipHtml(c){ var P = perfil(c), L = eqLista(c.id), n = Math.max(L.length, 1), h = '';
  for(var i = 0; i < n; i++){ var e = L[i] || {}, k = c.id + '|' + i, m = eqMsg[k];
   h += '<div class="rs-eq"><div class="rs-eq-top"><b>' + esc(P.item) + ' ' + (i + 1) + '</b>' + (i < L.length ? '<button type="button" class="pu-btn" data-rs-eq-del="' + esc(k) + '">Remover</button>' : '') + '</div>'
    + '<div class="rs-eq-busca"><label class="pu-campo rs-campo"><span>Buscar na Anvisa pelo registro ou processo</span><input type="text" inputmode="numeric" data-rs-eq="' + esc(k) + '|busca" placeholder="Registro ou processo para pesquisar" value="' + esc(e.busca || '') + '"></label><button type="button" class="pu-btn pu-btn-pri" data-rs-eq-buscar="' + esc(k) + '">Buscar</button></div>'
    + (m ? '<p class="rs-eq-msg' + (m.tipo ? ' rs-eq-' + m.tipo : '') + '" role="status">' + esc(m.t) + '</p>' : '')
    + '<div class="rs-campos">' + P.campos.map(function(f){ var v = e[f[0]] || '', a = ' data-rs-eq="' + esc(k) + '|' + f[0] + '"';
      if(f[2] === 'select') return '<label class="pu-campo rs-campo"><span>' + f[1] + '</span><select' + a + '>' + [''].concat(c.tipos || []).map(function(o){ return '<option value="' + esc(o) + '"' + (v === o ? ' selected' : '') + '>' + esc(o || 'Selecione') + '</option>'; }).join('') + '</select></label>';
      if(f[2] === 'textarea') return '<label class="pu-campo rs-campo rs-largo"><span>' + f[1] + '</span><textarea rows="2"' + a + '>' + esc(v) + '</textarea></label>';
      return '<label class="pu-campo rs-campo"><span>' + f[1] + '</span><input type="text"' + a + ' value="' + esc(v) + '"></label>'; }).join('') + '</div>'
    + (e.consulta ? '<p class="pu-q-ajuda">Dados do registro conferidos na base de ' + (P.base === 'medicamentos' ? 'medicamentos' : 'produtos para saúde') + ' da Anvisa em ' + esc(fmtData(e.consulta)) + '.</p>' : '') + '</div>'; }
  return '<fieldset class="pu-campo rs-campo rs-largo rs-eqs"><legend>' + esc(c.rotulo) + '</legend>' + h + '<div><button type="button" class="pu-btn" data-rs-eq-add="' + esc(c.id) + '">' + esc(P.mais) + '</button></div></fieldset>'; }
 function eqSet(k, dados){ var p = k.split('|'), id = p[0], i = +p[1], L = eqLista(id).slice(); while(L.length <= i) L.push({}); var e = Object.assign({}, L[i], dados);
  /* registro trocado à mão depois da busca: a nota de conferência deixa de valer */
  if(e.consulta && dig(e.registro) !== e.consultaReg){ delete e.consulta; delete e.consultaReg; }
  L[i] = e; st.meta[id] = L; salva(); }
 var BASES = ['https://uvisvp.github.io/base-vigilancia/dados/', 'https://raw.githubusercontent.com/uvisvp/base-vigilancia/main/dados/'];
 function jget(path){ var i = 0; function tenta(){ var u = BASES[i++] + path; return fetch(u, {cache: 'no-store'}).then(function(r){ if(r.status === 404) return null; if(!r.ok) throw Error('HTTP ' + r.status); return r.json(); }).catch(function(e){ if(i < BASES.length) return tenta(); throw e; }); } return tenta(); }
 var manif = null; function prefixo(base){ if(!manif) manif = jget('manifest.json').catch(function(){ return null; }); return manif.then(function(m){ var n = Number(m && m.bases && m.bases[base] && m.bases[base].prefixo); return n > 0 && n < 10 ? n : (base === 'medicamentos' ? 4 : 5); }); }
 function dig(v){ return String(v || '').replace(/\D/g, ''); }
 function porRegistro(base, reg){ return prefixo(base).then(function(n){ return jget(base + '/' + reg.slice(0, n) + '.json'); }).then(function(d){ return (d || []).filter(function(x){ return dig(x.registro) === reg; }); }); }
 function buscaEquip(P, txt){ var d = dig(txt), base = P.base;
  if(d.length >= 15 || (/^25/.test(d) && d.length >= 13)) return jget('indices/processos/' + d.slice(5, 8) + '.json').then(function(idx){ var refs = (idx && idx[d]) || [];
   if(base === 'medicamentos') return (refs.length ? jget('medicamentos_processos/' + d.slice(5, 8) + '.json') : Promise.resolve([])).then(function(a){ return {por: 'processo', achados: (a || []).filter(function(x){ return dig(x.processo) === d; })}; });
   var regs = refs.filter(function(r){ return r && r.b === base; }).map(function(r){ return dig(r.r); });
   return Promise.all(regs.map(function(r){ return porRegistro(base, r); })).then(function(a){ return {por: 'processo', achados: [].concat.apply([], a).filter(function(x){ return dig(x.processo) === d; })}; }); });
  if(d.length < 7) return Promise.reject(Error('curto'));
  var curto = base === 'medicamentos' ? 9 : 11;
  return porRegistro(base, d).then(function(a){ return !a.length && d.length > curto ? porRegistro(base, d.slice(0, curto)) : a; }).then(function(a){ return {por: 'registro', achados: a}; }); }
 function eqBuscar(k){ var p = k.split('|'), c = CAMPO[p[0]], P = perfil(c), e = eqLista(p[0])[+p[1]] || {}, q = e.busca || e.registro || e.processo || '';
  var dica = P.base === 'medicamentos' ? 'o registro (9 ou 13 dígitos) ou o processo' : 'o registro (11 dígitos) ou o processo';
  if(!dig(q)){ eqMsg[k] = {t: 'Digite ' + dica + '.', tipo: 'aviso'}; redesenha(); return; }
  eqMsg[k] = {t: 'Consultando a base da Anvisa…'}; redesenha();
  buscaEquip(P, q).then(function(r){ /* a base repete o mesmo registro (com e sem fabricante): fica a linha mais completa */
   var u = {}; r.achados.forEach(function(y){ var kr = dig(y.registro) || JSON.stringify(y); if(!u[kr] || Object.keys(y).length > Object.keys(u[kr]).length) u[kr] = y; }); r.achados = Object.keys(u).map(function(kr){ return u[kr]; }); var x = r.achados[0];
   if(!x){ eqMsg[k] = {t: (r.por === 'processo' ? 'Processo' : 'Registro') + ' não localizado na base de ' + (P.base === 'medicamentos' ? 'medicamentos' : 'produtos para saúde') + ' da Anvisa. Confira o número na consulta oficial; os dados podem ser digitados.', tipo: 'aviso'}; redesenha(); return; }
   var atual = eqLista(p[0])[+p[1]] || {}, dados, obs = [];
   if(P.base === 'medicamentos'){ dados = {registro: x.registro || '', processo: x.processo || '', nome: x.produto || '', principio: x.principio_ativo || '', detentor: String(x.detentor || '').replace(/^\d{14}\s*-\s*/, ''), situacao: x.situacao || '', vencimento: vencMA(x.vencimento)};
    if(x.situacao && !/^ativ/i.test(x.situacao)) obs.push('registro ' + String(x.situacao).toLowerCase());
    var mv = /^(\d{2})(\d{4})$/.exec(String(x.vencimento || '')), hoje = new Date(); if(mv && (+mv[2] < hoje.getFullYear() || (+mv[2] === hoje.getFullYear() && +mv[1] < hoje.getMonth() + 1))) obs.push('registro vencido em ' + vencMA(x.vencimento)); }
   else { dados = {registro: x.registro || '', processo: x.processo || '', nome: x.produto || '', fabricante: [x.fabricante, x.pais].filter(Boolean).join(' — '), detentor: x.detentor || '', classe: x.classe ? 'Classe ' + x.classe : ''}; }
   if(P.tipoAuto && !atual.tipo && P.tipoAuto(x)) dados.tipo = P.tipoAuto(x);
   eqSet(k, dados); eqSet(k, {consulta: new Date().toISOString().slice(0, 10), consultaReg: dig(x.registro)});
   if(!P.confere(x)) obs.push(P.estranho);
   eqMsg[k] = {t: 'Encontrado: ' + String(x.produto || '').replace(/\.+$/, '') + (r.achados.length > 1 ? ' (' + r.achados.length + ' registros; usado o primeiro).' : '.') + (obs.length ? ' Atenção: ' + obs.join('; ') + '; confira.' : ''), tipo: obs.length ? 'aviso' : 'ok'};
   redesenha(); },
  function(err){ eqMsg[k] = {t: err && err.message === 'curto' ? 'Número curto demais: digite ' + dica + '.' : 'Não foi possível consultar a base agora (sem internet?). Preencha os dados à mão.', tipo: 'aviso'}; redesenha(); }); }
 function sv(x){ return !!String(x || '').trim(); }
 /* campo de item fora da identificação → blocos do relatório, sob o título do item */
 function campoRel(c){ var v = st.meta[c.id]; if(c.rel === false) return [];
  if(c.tipo === 'equipamentos'){ var P = perfil(c), L = (Array.isArray(v) ? v : []).filter(eqTem); if(!L.length) return [];
   var out = [{t: 'table', head: P.head, widths: [2500, 2200, 2500, 2100], rows: L.map(function(e){ return P.linha(e).map(function(cel){ return cel.filter(sv).join('\n') || '—'; }); })}];
   var cons = []; L.forEach(function(e){ if(e.consulta && cons.indexOf(fmtData(e.consulta)) < 0) cons.push(fmtData(e.consulta)); });
   if(cons.length) out.push({t: 'small', x: 'Dados de registro conferidos na base de ' + (P.base === 'medicamentos' ? 'medicamentos' : 'produtos para saúde') + ' da Anvisa em ' + lista(cons) + '.'});
   return out; }
  if(Array.isArray(v)) v = v.map(function(x){ var o = (c.opcoes || []).filter(function(p){ return p[0] === x; })[0]; return o ? o[1] : x; }).join(', ');
  if(c.tipo === 'select'){ var op = (c.opcoes || []).filter(function(o){ return o[0] === v; })[0]; if(op) v = op[1]; }
  if(c.tipo === 'date') v = fmtData(v);
  return sv(v) ? [{t: 'kv', k: c.rotulo.replace(/\?$/, ''), v: String(v).trim()}] : []; }
 var fotoAberta = '', previaAberta = {};
 function perguntaHtml(q){ var r = st.r[q.id] || '', f = st.fotos[q.id], o = ONDE[q.id];
  var simnao = D.respostas === 'simnao', vs = q.sim === 'nc' ? 'nc' : 'c', vn = vs === 'c' ? 'nc' : 'c', temNa = q.na || D.naSempre;
  var bt = (simnao ? [[vs, 'Sim', vs === 'c' ? 'ok' : 'nao'], [vn, 'Não', vn === 'c' ? 'ok' : 'nao']] : [['c', 'Cumpre', 'ok'], ['nc', 'Não cumpre', 'nao']]).concat(temNa ? [['na', 'Não se aplica', 'na']] : []);
  return '<div class="pu-q rs-q" data-rs-q="' + esc(q.id) + '"><div><p class="pu-q-texto"><b>' + esc(o.n) + '</b> ' + esc(q.t) + '</p><div class="rs-cits">' + botoesCit(q.r) + '</div></div>'
   + '<div class="pu-resp" role="group" aria-label="Resultado"' + (bt.length === 2 ? ' style="grid-template-columns:repeat(2,minmax(0,1fr))"' : '') + '>' + bt.map(function(b){ return '<button type="button" data-rs-r="' + esc(q.id) + '|' + b[0] + '" data-v="' + b[2] + '" aria-pressed="' + (r === b[0]) + '">' + b[1] + '</button>'; }).join('') + '</div>'
   + (r === 'c' && q.checks ? (function(){ var a = Array.isArray(st.meta['chk_' + q.id]) ? st.meta['chk_' + q.id] : [], temOutro = q.checks.opcoes.some(function(o){ return o[0] === 'outro'; });
      return '<fieldset class="pu-bloco rs-sub"><legend>' + esc(q.checks.rotulo || 'Detalhe (vai ao relatório; não gera infração)') + '</legend><div class="rs-checks">' + q.checks.opcoes.map(function(o){ return '<label><input type="checkbox" data-rs-check="chk_' + esc(q.id) + '" value="' + esc(o[0]) + '"' + (a.indexOf(o[0]) >= 0 ? ' checked' : '') + '><span>' + esc(o[1]) + '</span></label>'; }).join('') + '</div>'
       + (!q.checks.semOutro && (!temOutro || a.indexOf('outro') >= 0) ? '<label class="pu-campo rs-campo"><span>' + esc(q.checks.outro || 'Outro (descrever)') + '</span><input type="text" data-rs-meta="chk_' + esc(q.id) + '_outro" value="' + esc(st.meta['chk_' + q.id + '_outro'] || '') + '"></label>' : '') + '</fieldset>'; })() : '')
   + (r === 'nc' ? '<div class="pu-bloco pu-nc rs-nc"><label><span>Situação encontrada <small>(opcional — entra no relatório após a frase)</small></span><textarea data-rs-sit="' + esc(q.id) + '" rows="2" placeholder="Ex.: não havia registro de temperatura nos últimos 15 dias.">' + esc(st.sit[q.id] || '') + '</textarea></label>'
     + ((q.inf || []).length ? '<p class="pu-q-ajuda">Enquadramento sugerido na aba Infrações: ' + esc(q.inf.map(function(i){ return INF[i] ? INF[i].texto : i; }).join(' · ')) + '</p>' : '') + '</div>' : '')
   + '<details class="pu-mais"' + (fotoAberta === q.id ? ' open' : '') + '><summary>Foto' + (f ? ' ✓' : '') + '</summary><div><div class="pu-foto-acoes"><button type="button" class="pu-btn" data-rs-foto="' + esc(q.id) + '">📷 ' + (f ? 'Trocar foto' : 'Tirar ou anexar foto') + '</button>' + (f ? '<button type="button" class="pu-btn" data-rs-sem-foto="' + esc(q.id) + '">Remover foto</button>' : '') + '</div>' + (f ? '<img class="rs-foto" alt="Foto vinculada à verificação" src="' + esc(f) + '">' : '') + '<p class="pu-q-ajuda">As fotos saem à parte, no botão Fotos do cabeçalho.</p></div></details>'
   + (r ? '<details class="pu-mais rs-previa"' + (previaAberta[q.id] ? ' open' : '') + ' data-rs-previa="' + esc(q.id) + '"><summary>👁 Como sai no relatório</summary><div><p>' + esc(frase(q)) + '</p>' + (r === 'nc' ? '<p class="pu-q-ajuda">Fundamento: ' + esc(fundamento(q.r)) + '.</p>' : '') + '</div></details>' : '')
   + '</div>'; }
 /* item só de consulta (ex.: calendário de vacinação): texto e tabelas, sem respostas nem relatório */
 function consultaHtml(c){ return '<div class="pu-bloco rs-consulta">' + (c.nota ? '<p class="pu-q-ajuda">' + esc(c.nota) + '</p>' : '') + (c.blocos || []).map(function(b){
   return (b.h ? '<h4>' + esc(b.h) + '</h4>' : '') + (b.p ? '<p>' + esc(b.p) + '</p>' : '') + (b.rows ? '<div class="rs-tab"><table><thead><tr>' + b.head.map(function(x){ return '<th>' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>'
    + b.rows.map(function(r){ return '<tr>' + r.map(function(x){ return '<td>' + esc(x) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' : ''); }).join('') + (c.fonte ? '<p class="rs-fonte">Fonte: ' + esc(c.fonte) + '</p>' : '') + '</div>'; }
 /* ---------- ações da identificação ----------
    anvisa_cnpj: dados da AFE/AE pelo CNPJ (base afe_ae, a mesma da Central de Consultas);
    ocr_crt: leitura da Certidão de Regularidade Técnica do CRF (OcrPadrao, embutido com D.ocr).
    Só preenchem campos vazios; o que já foi digitado fica. */
 var acaoMsg = null;
 function preenche(pares){ var n = 0; pares.forEach(function(p){ var v = String(p[1] || '').trim(); if(v && !String(st.meta[p[0]] || '').trim()){ st.meta[p[0]] = v; n++; } }); salva(); return n; }
 function acaoAnvisa(){ var c = dig(st.meta.cnpj); if(c.length !== 14){ acaoMsg = {t: 'Digite o CNPJ completo (14 dígitos) antes de buscar.', tipo: 'aviso'}; redesenha(); return; }
  acaoMsg = {t: 'Consultando a base da Anvisa (AFE/AE)…'}; redesenha();
  jget('afe_ae/' + c.slice(0, 3) + '.json').then(function(d){ var a = (Array.isArray(d) ? d : (d && (d.registros || d.dados)) || []).filter(function(x){ return dig(x.cnpj) === c; });
   if(!a.length){ acaoMsg = {t: 'CNPJ sem AFE/AE na base da Anvisa. Confira o número; os dados podem ser digitados.', tipo: 'aviso'}; redesenha(); return; }
   var ativ = function(x){ return /^(sim|s|ativ)/i.test(String(x.ativo || x.situacao || '')); };
   a.sort(function(x, y){ return (ativ(y) - ativ(x)) || (String(x.tipo).toUpperCase() === 'AFE' ? -1 : 1); });
   var x = a[0], end = [x.endereco, x.bairro, x.municipio && (x.municipio + (x.uf ? '/' + x.uf : '')), x.cep && 'CEP ' + String(x.cep).replace(/^(\d{5})(\d{3})$/, '$1-$2')].filter(Boolean).join(', ');
   var afe = a.filter(function(y){ return y.autorizacao; }).map(function(y){ return (y.tipo || 'AFE') + ' ' + y.autorizacao + (y.situacao ? ' (' + String(y.situacao).toLowerCase() + ')' : ''); }).filter(function(v, i, l){ return l.indexOf(v) === i; }).join('; ');
   var n = preenche([['razao', x.razao_social], ['fantasia', x.nome_fantasia], ['endereco', end], ['rl', x.responsavel_legal], ['rt', x.responsavel_tecnico], ['afe', afe]]);
   acaoMsg = {t: 'Base da Anvisa: ' + (x.razao_social || 'estabelecimento') + (afe ? ' — ' + afe : '') + '. ' + (n ? n + ' campo(s) preenchido(s); confira.' : 'Os campos já estavam preenchidos; nada foi alterado.'), tipo: n ? 'ok' : ''};
   redesenha(); }, function(){ acaoMsg = {t: 'Não foi possível consultar a base agora (sem internet?). Preencha os dados à mão.', tipo: 'aviso'}; redesenha(); }); }
 function acaoCrt(){ if(!window.OcrPadrao){ acaoMsg = {t: 'Leitor de documentos indisponível neste roteiro.', tipo: 'aviso'}; redesenha(); return; }
  OcrPadrao.ler('certidao_regularidade_crf', {titulo: 'Ler Certidão de Regularidade Técnica — CRF', onApply: function(v, info){
   var rt = [v.responsavel_tecnico, v.numero_conselho_responsavel_tecnico && 'CRF ' + v.numero_conselho_responsavel_tecnico].filter(Boolean).join(' — ');
   var sub = [v.responsavel_tecnico_substituto, v.numero_conselho_responsavel_tecnico_substituto && 'CRF ' + v.numero_conselho_responsavel_tecnico_substituto].filter(Boolean).join(' — ');
   var crt = [v.numero_certidao && 'nº ' + v.numero_certidao, v.data_emissao && 'emitida em ' + v.data_emissao, v.ramo_atividade].filter(Boolean).join(', ');
   var n = preenche([['razao', v.razao_social], ['cnpj', v.cnpj && mascaraCnpj(v.cnpj)], ['rt', rt], ['rt_subst', sub], ['crt', crt], ['horario', v.rotina]]);
   acaoMsg = {t: 'Certidão do CRF lida: ' + (n ? n + ' campo(s) preenchido(s); confira.' : 'os campos já estavam preenchidos; nada foi alterado.'), tipo: n ? 'ok' : ''}; redesenha(); }}); }
 /* q.naSe {campo, igual}: ao escolher o valor no campo, a pergunta sem resposta passa a “Não se aplica” */
 function naAuto(){ ORDEM.forEach(function(id){ var q = PERG[id], c = q.naSe; if(c && !st.r[id] && st.meta[c.campo] === c.igual) st.r[id] = 'na'; }); }
 function desenhaItem(s, it, el){
  var ps = perguntasDe(it), h = it.descricao ? '<p class="pu-desc">' + esc(it.descricao) + '</p>' : (s.descricao ? '<p class="pu-desc">' + esc(s.descricao) + '</p>' : '');
  if(it.orient && it.orient.length) h += '<details class="pu-mais rs-orient"><summary>📘 Orientação técnica</summary><div><ul>' + it.orient.map(function(o){ return '<li>' + esc(o.t) + (o.f ? ' <small class="rs-fonte">Fonte: ' + esc(o.f) + '</small>' : '') + '</li>'; }).join('') + '</ul></div></details>';
  if(it.consulta) h += consultaHtml(it.consulta);
  if(it.acoes && it.acoes.length) h += '<div class="pu-bloco rs-acoes"><div class="pu-acoes-item">' + it.acoes.map(function(a){ return '<button type="button" class="pu-btn' + (a.pri ? ' pu-btn-pri' : '') + '" data-rs-acao="' + esc(a.id) + '">' + esc(a.rotulo) + '</button>'; }).join('') + '</div>' + (acaoMsg ? '<p class="rs-eq-msg' + (acaoMsg.tipo ? ' rs-eq-' + acaoMsg.tipo : '') + '" role="status">' + esc(acaoMsg.t) + '</p>' : '') + (it.acoesNota ? '<p class="pu-q-ajuda">' + esc(it.acoesNota) + '</p>' : '') + '</div>';
  if(it.campos && it.campos.length) h += '<div class="pu-bloco"><div class="pu-campos rs-campos">' + it.campos.map(campoHtml).join('') + '</div></div>';
  h += ps.map(perguntaHtml).join('');
  if(!ps.length && !(it.campos || []).length && !it.consulta) h += '<div class="pu-bloco pu-aviso"><p>' + esc(it.vazio || 'Nenhuma verificação se aplica a este item.') + '</p></div>';
  if(ps.length) h += '<div class="pu-acoes-item">' + (ps.some(function(q){ return q.na || D.naSempre; }) ? '<button type="button" class="pu-btn" data-rs-lote="na">Marcar pendentes como Não se aplica</button>' : '') + '<button type="button" class="pu-btn" data-rs-lote="c">' + (D.respostas === 'simnao' ? 'Marcar pendentes como conformes' : 'Marcar pendentes como Cumpre') + '</button></div>';
  el.innerHTML = h; }
 function redesenha(){ var n = UvisPadrao.estado(), c = document.getElementById('pu-conteudo');
  if(n.aba === 'roteiro' && n.item && c){ var s = D.secoes.filter(function(x){ return x.id === n.secao; })[0], it = s && s.itens.filter(function(x){ return x.id === n.item; })[0]; if(it){ var y = window.scrollY; desenhaItem(s, it, c); window.scrollTo(0, y); } }
  UvisPadrao.atualiza(); }

 /* ---------- relatório (blocos → Word / prévia / texto) ---------- */
 function fmtData(v){ var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? m[3] + '/' + m[2] + '/' + m[1] : (v || ''); }
 function blocos(){ var B = [], R = D.relatorio, sec = 0, irr = [];
  B.push({t: 'title', x: R.titulo}, {t: 'sub', x: R.subtitulo});
  B.push({t: 'h1', x: (++sec) + ' IDENTIFICAÇÃO'});
  D.secoes[0].itens.forEach(function(it){ (it.campos || []).forEach(function(c){ var v = st.meta[c.id]; if(Array.isArray(v)) v = v.map(function(x){ var o = (c.opcoes || []).filter(function(p){ return p[0] === x; })[0]; return o ? o[1] : x; }).join(', '); if(c.tipo === 'select'){ var op = (c.opcoes || []).filter(function(o){ return o[0] === v; })[0]; if(op) v = op[1]; } if(c.tipo === 'date') v = fmtData(v); if(String(v || '').trim()) B.push({t: 'kv', k: c.rotulo.replace(/\?$/, ''), v: String(v).trim()}); }); });
  B.push({t: 'h1', x: (++sec) + ' OBJETIVO E LEGISLAÇÃO DE REFERÊNCIA'}, {t: 'p', x: R.objetivo});
  D.normas.forEach(function(n){ B.push({t: 'num', n: '•', x: n[0] + ' — ' + n[1]}); });
  B.push({t: 'h1', x: (++sec) + ' VERIFICAÇÕES REALIZADAS'});
  var ns = 0;
  D.secoes.slice(1).forEach(function(s){ var partes = [];
   s.itens.forEach(function(it){ var ps = perguntasDe(it).filter(function(q){ return st.r[q.id]; }), cps = [].concat.apply([], (it.campos || []).map(campoRel)); if(!ps.length && !cps.length) return;
    var fr = ps.filter(function(q){ return st.r[q.id] !== 'na' || typeof q.na === 'string'; }).map(frase), na = ps.filter(function(q){ return st.r[q.id] === 'na' && typeof q.na !== 'string'; });
    partes.push({t: 'h2', x: sec + '.' + (ns + 1) + '.' + (partes.filter(function(p){ return p.t === 'h2'; }).length + 1) + ' ' + it.titulo});
    cps.forEach(function(b){ partes.push(b); });
    if(fr.length) partes.push({t: 'p', x: fr.join(' ')});
    if(na.length) partes.push({t: 'small', x: 'Não se aplicam ao estabelecimento: ' + lista(na.map(function(q){ return q.t.replace(/\?$/, '').replace(/^./, function(c){ return c.toLowerCase(); }); })) + '.'});
    ps.forEach(function(q){ if(st.r[q.id] === 'nc') irr.push(q); }); });
   if(partes.length){ ns++; B.push({t: 'h2', x: sec + '.' + ns + ' ' + s.titulo.toUpperCase()}); partes.forEach(function(p){ if(p.t === 'h2') p.x = p.x.replace(/^\d+\.\d+\.\d+/, function(m){ return m.split('.')[0] + '.' + ns + '.' + m.split('.')[2]; }); B.push(p); }); } });
  if(!ns) B.push({t: 'p', x: 'Nenhuma verificação foi registrada.'});
  B.push({t: 'h1', x: (++sec) + ' IRREGULARIDADES OBSERVADAS'});
  if(irr.length) irr.forEach(function(q, i){ B.push({t: 'num', n: i + 1, x: frase(q) + ' Fundamento: ' + fundamento(q.r) + '.'}); });
  else B.push({t: 'p', x: 'Não foram registradas irregularidades nesta inspeção.'});
  var sel = D.infracoes.filter(function(i){ return st.inf[i.id]; });
  if(sel.length){ B.push({t: 'h1', x: (++sec) + ' ENQUADRAMENTO DAS INFRAÇÕES SANITÁRIAS'}); B.push({t: 'table', head: ['Nº', 'Infração sanitária', 'Dispositivos infringidos'], widths: [600, 4700, 4000], rows: sel.map(function(i, k){ return [String(k + 1), i.texto, fundamento(i.r)]; })}); }
  B.push({t: 'h1', x: (++sec) + ' CONCLUSÃO'}, {t: 'p', x: String(st.concl || '').trim() || R.conclusao});
  if(st.meta.equipe) B.push({t: 'kv', k: 'Equipe de inspeção', v: st.meta.equipe});
  B.push({t: 'sign'});
  return B; }
 function blocosHtml(B){ return B.map(function(b){
  if(b.t === 'title') return '<h2 class="rs-r-tit">' + esc(b.x) + '</h2>'; if(b.t === 'sub') return '<p class="rs-r-sub">' + esc(b.x) + '</p>';
  if(b.t === 'h1') return '<h3 class="rs-r-h1">' + esc(b.x) + '</h3>'; if(b.t === 'h2') return '<h4 class="rs-r-h2">' + esc(b.x) + '</h4>';
  if(b.t === 'kv') return '<p><b>' + esc(b.k) + ':</b> ' + esc(b.v) + '</p>'; if(b.t === 'num') return '<p class="rs-r-num"><b>' + esc(b.n) + (b.n === '•' ? '' : '.') + '</b> ' + esc(b.x) + '</p>';
  if(b.t === 'small') return '<p class="rs-r-small">' + esc(b.x) + '</p>';
  if(b.t === 'table') return '<div class="rs-r-tab"><table><thead><tr>' + b.head.map(function(h){ return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + b.rows.map(function(r){ return '<tr>' + r.map(function(c){ return '<td>' + esc(c).replace(/\n/g, '<br>') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  if(b.t === 'sign') return '<p class="rs-r-small">Local, data e assinaturas da autoridade sanitária e do responsável pelo estabelecimento.</p>';
  return '<p>' + esc(b.x) + '</p>'; }).join(''); }
 function blocosTexto(B){ var L = []; B.forEach(function(b){
  if(b.t === 'title') L.push(b.x, ''); else if(b.t === 'sub') L.push(b.x, ''); else if(b.t === 'h1') L.push('', b.x, ''); else if(b.t === 'h2') L.push('', b.x, '');
  else if(b.t === 'kv') L.push(b.k + ': ' + b.v); else if(b.t === 'num') L.push(b.n + (b.n === '•' ? ' ' : '. ') + b.x); else if(b.t === 'table'){ L.push(b.head.join(' | ')); b.rows.forEach(function(r){ L.push(r.map(function(c){ return String(c).replace(/\n/g, '; '); }).join(' | ')); }); L.push(''); }
  else if(b.t === 'sign') L.push('', 'Local e data: ______________________________', '', '________________________________', 'Autoridade sanitária', '', '________________________________', 'Responsável pelo estabelecimento');
  else L.push(b.x, ''); }); return L.join('\n').replace(/\n{3,}/g, '\n\n').trim(); }

 /* docx mínimo (mesma estrutura do relatório da odontologia) */
 var xe = function(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]; }); };
 function wRun(t, o){ o = o || {}; var pr = (o.bold ? '<w:b/>' : '') + (o.italic ? '<w:i/>' : ''); return String(t == null ? '' : t).split('\n').map(function(p, i){ return '<w:r>' + (pr ? '<w:rPr>' + pr + '</w:rPr>' : '') + (i ? '<w:br/>' : '') + '<w:t xml:space="preserve">' + xe(p) + '</w:t></w:r>'; }).join(''); }
 function wP(t, s, o){ return '<w:p><w:pPr><w:pStyle w:val="' + (s || 'Body') + '"/></w:pPr>' + wRun(t, o) + '</w:p>'; }
 function wMix(ps, s){ return '<w:p><w:pPr><w:pStyle w:val="' + (s || 'Body') + '"/></w:pPr>' + ps.map(function(p){ return wRun(p.text, p); }).join('') + '</w:p>'; }
 function wCell(c, w, sh){ return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' + (sh ? '<w:shd w:val="clear" w:fill="' + sh + '"/>' : '') + '</w:tcPr>' + c + '</w:tc>'; }
 function wTable(head, rows, widths){ var total = widths.reduce(function(a, b){ return a + b; }, 0), c1 = PB ? '000000' : 'BFCBD2', c2 = PB ? '000000' : 'D6DEE3', bd = '<w:top w:val="single" w:sz="4" w:color="' + c1 + '"/><w:left w:val="single" w:sz="4" w:color="' + c1 + '"/><w:bottom w:val="single" w:sz="4" w:color="' + c1 + '"/><w:right w:val="single" w:sz="4" w:color="' + c1 + '"/><w:insideH w:val="single" w:sz="4" w:color="' + c2 + '"/><w:insideV w:val="single" w:sz="4" w:color="' + c2 + '"/>';
  return '<w:tbl><w:tblPr><w:tblW w:w="' + total + '" w:type="dxa"/><w:tblBorders>' + bd + '</w:tblBorders><w:tblCellMar><w:top w:w="70" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:bottom w:w="70" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' + widths.map(function(w){ return '<w:gridCol w:w="' + w + '"/>'; }).join('') + '</w:tblGrid>'
   + (head ? '<w:tr><w:trPr><w:tblHeader/></w:trPr>' + head.map(function(h, j){ return wCell(wP(h, 'CellHead', {bold: true}), widths[j], PB ? '' : 'E3ECF1'); }).join('') + '</w:tr>' : '')
   + rows.map(function(r){ return '<w:tr>' + r.map(function(c, j){ return wCell(wP(c, 'Cell'), widths[j]); }).join('') + '</w:tr>'; }).join('') + '</w:tbl>' + wP('', 'Gap'); }
 function toXml(B){ return B.map(function(b){
  if(b.t === 'title') return wP(b.x, 'Title'); if(b.t === 'sub') return wP(b.x, 'Subtitle'); if(b.t === 'h1') return wP(b.x, 'Heading1'); if(b.t === 'h2') return wP(b.x, 'Heading2');
  if(b.t === 'kv') return wMix([{text: b.k + ': ', bold: true}, {text: b.v}]); if(b.t === 'num') return wMix([{text: b.n + (b.n === '•' ? ' ' : '. '), bold: true}, {text: b.x}], 'Item');
  if(b.t === 'small') return wP(b.x, 'Small'); if(b.t === 'table') return wTable(b.head, b.rows, b.widths);
  if(b.t === 'sign') return wP('Local e data: ______________________________________________') + wP('', 'Gap') + wTable(null, [['\n________________________________________\nAutoridade sanitária', '\n________________________________________\nResponsável pelo estabelecimento']], [4650, 4650]);
  return wP(b.x); }).join(''); }
 var PB = D.estilo === 'pb', COR = PB ? '000000' : String(D.cor || '#1E5A8A').replace('#', '').toUpperCase();
 var STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'
  + '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>'
  + '<w:style w:type="paragraph" w:styleId="Body"><w:name w:val="Body"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="both"/></w:pPr></w:style>'
  + '<w:style w:type="paragraph" w:styleId="Item"><w:name w:val="Item"/><w:basedOn w:val="Body"/><w:pPr><w:spacing w:after="60"/><w:ind w:left="340" w:hanging="260"/></w:pPr></w:style>'
  + '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="60"/><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:color w:val="' + COR + '"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>'
  + '<w:style w:type="paragraph" w:styleId="Subtitle"><w:name w:val="Subtitle"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="240"/><w:jc w:val="center"/></w:pPr><w:rPr><w:color w:val="' + (PB ? '000000' : '4A5A64') + '"/><w:sz w:val="20"/></w:rPr></w:style>'
  + '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Body"/><w:qFormat/><w:pPr><w:keepNext/>' + (PB ? '' : '<w:shd w:val="clear" w:fill="E3ECF1"/>') + '<w:spacing w:before="300" w:after="120"/><w:ind w:left="80"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="' + (PB ? '000000' : '1B262D') + '"/><w:sz w:val="23"/></w:rPr></w:style>'
  + '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Body"/><w:qFormat/><w:pPr><w:keepNext/>' + (PB ? '' : '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="3" w:color="' + COR + '"/></w:pBdr>') + '<w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="' + COR + '"/><w:sz w:val="22"/></w:rPr></w:style>'
  + '<w:style w:type="paragraph" w:styleId="Small"><w:name w:val="Small"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="120"/></w:pPr><w:rPr>' + (PB ? '' : '<w:i/>') + '<w:color w:val="' + (PB ? '000000' : '5A6A72') + '"/><w:sz w:val="' + (PB ? '22' : '19') + '"/></w:rPr></w:style>'
  + '<w:style w:type="paragraph" w:styleId="Cell"><w:name w:val="Cell"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0"/></w:pPr><w:rPr><w:sz w:val="18"/></w:rPr></w:style>'
  + '<w:style w:type="paragraph" w:styleId="CellHead"><w:name w:val="Cell Head"/><w:basedOn w:val="Cell"/><w:rPr><w:b/><w:sz w:val="18"/></w:rPr></w:style>'
  + '<w:style w:type="paragraph" w:styleId="Gap"><w:name w:val="Gap"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="120" w:lineRule="auto"/></w:pPr></w:style></w:styles>';
 function docx(B, titulo){ var z = new JSZip(), X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  z.file('[Content_Types].xml', X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>');
  z.folder('_rels').file('.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>');
  z.folder('word').file('document.xml', X + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + toXml(B) + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1418" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>').file('styles.xml', STYLES)
   .folder('_rels').file('document.xml.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
  var agora = new Date().toISOString();
  z.folder('docProps').file('core.xml', X + '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + xe(titulo) + '</dc:title><dc:creator>Vigilância Sanitária</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">' + agora + '</dcterms:created></cp:coreProperties>');
  return z.generateAsync({type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE'}); }
 function nomeArq(ext){ var b = String(st.meta.fantasia || st.meta.razao || 'inspecao').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'inspecao'; return 'Relatorio_' + D.tituloCurto.replace(/[^A-Za-z0-9]+/g, '_') + '_' + b + '_' + new Date().toISOString().slice(0, 10) + '.' + ext; }
 function baixa(blob, nome){ var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 2000); }

 /* ---------- abas Infrações e Relatório ---------- */
 function abaInfracoes(el){ var sug = sugeridas(), grupos = [];
  D.infracoes.forEach(function(i){ if(grupos.indexOf(i.grupo) < 0) grupos.push(i.grupo); });
  var nsug = Object.keys(sug).filter(function(k){ return !st.inf[k]; }).length;
  el.innerHTML = '<div class="pu-bloco"><h3>Enquadramento das infrações</h3><p>Marque as infrações que serão enquadradas. As sugeridas vêm dos itens marcados como “Não cumpre”. O enquadramento sai no relatório, em tabela própria.</p>'
   + (nsug ? '<div class="pu-acoes-item"><button type="button" class="pu-btn pu-btn-pri" data-rs-sugeridas>Marcar as ' + nsug + ' sugeridas</button></div>' : '') + '</div>'
   + grupos.map(function(g){ return '<div class="pu-bloco rs-inf-grupo"><h3>' + esc(g) + '</h3>' + D.infracoes.filter(function(i){ return i.grupo === g; }).map(function(i){
     return '<label class="rs-inf' + (sug[i.id] ? ' rs-sug' : '') + '"><input type="checkbox" data-rs-inf="' + esc(i.id) + '"' + (st.inf[i.id] ? ' checked' : '') + '><span><b>' + esc(i.texto) + '</b><small>' + esc(fundamento(i.r)) + '</small>'
      + (sug[i.id] ? '<em>Sugerida — itens ' + esc(sug[i.id].join(', ')) + ' não cumpridos</em>' : '') + '</span></label>'; }).join('') + '</div>'; }).join(''); }
 function abaRelatorio(el){ var tot = ORDEM.filter(function(id){ return visivel(PERG[id]); }), resp = tot.filter(function(id){ return st.r[id]; }).length, ninf = D.infracoes.filter(function(i){ return st.inf[i.id]; }).length;
  el.innerHTML = '<div class="pu-bloco"><h3>Resumo</h3><div class="pu-campos"><div class="pu-campo">Respondidas<b>' + resp + ' de ' + tot.length + '</b></div><div class="pu-campo">' + (D.respostas === 'simnao' ? 'Irregulares' : 'Não cumpre') + '<b>' + nNC() + '</b></div><div class="pu-campo">Pendentes<b>' + (tot.length - resp) + '</b></div><div class="pu-campo">Infrações enquadradas<b>' + ninf + '</b></div></div>'
   + '<label class="pu-campo rs-largo"><span>Conclusão (se vazio, sai o texto padrão)</span><textarea data-rs-concl rows="4" placeholder="' + esc(D.relatorio.conclusao) + '">' + esc(st.concl || '') + '</textarea></label>'
   + '<div class="pu-acoes-item"><button type="button" class="pu-btn pu-btn-pri" data-rs-word>Baixar relatório em Word</button><button type="button" class="pu-btn" data-rs-copia>Copiar texto</button>' + (resp < tot.length ? '<button type="button" class="pu-btn" data-rs-pendente>Ir à próxima pendente</button>' : '') + '</div>'
   + '<p class="pu-q-ajuda">As fotos saem à parte, em PDF, no botão Fotos do cabeçalho.</p></div>'
   + '<div class="pu-bloco rs-relatorio' + (PB ? ' rs-pb' : '') + '"><h3>Prévia do relatório</h3>' + blocosHtml(blocos()) + '</div>'; }

 /* ---------- fotos ---------- */
 function foto(id){ var inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.style.display = 'none'; document.body.appendChild(inp);
  inp.onchange = function(){ var f = inp.files && inp.files[0]; inp.remove(); if(!f) return; var r = new FileReader();
   r.onload = function(){ var grava = function(url){ var ant = st.fotos[id]; st.fotos[id] = url; fotoAberta = id; try { localStorage.setItem(STORE, JSON.stringify(st)); } catch(e){ if(ant) st.fotos[id] = ant; else delete st.fotos[id]; aviso('Sem espaço para a foto neste aparelho. Remova fotos antigas ou exporte as Salvas.'); } redesenha(); };
    if(window.__uvsReduzFoto) window.__uvsReduzFoto(r.result, grava); else grava(r.result); };
   r.readAsDataURL(f); };
  inp.click(); }
 window.__uvsFotosMeta = function(){ return {estab: st.meta.fantasia || st.meta.razao || '', data: st.meta.data || ''}; };
 window.__uvsFotosItens = function(){ return ORDEM.filter(function(id){ return st.fotos[id]; }).map(function(id){ var o = ONDE[id]; return {src: st.fotos[id], legenda: o.s.titulo + ' — ' + o.it.titulo + ' — ' + o.n + ' ' + PERG[id].t}; }); };
 if(window.UvsFotosPDF && window.UvsFotosPDF.adaptadores) window.UvsFotosPDF.adaptadores[D.app] = {titulo: 'Relatório fotográfico — ' + D.titulo, meta: window.__uvsFotosMeta, fotos: function(){ return Promise.resolve(window.__uvsFotosItens()); }};

 /* ---------- eventos ---------- */
 function mascaraCnpj(v){ var d = String(v).replace(/\D/g, '').slice(0, 14); return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2'); }
 document.addEventListener('click', function(e){ var b;
  if((b = e.target.closest('[data-legal]'))){ e.preventDefault(); abreLegal(b.dataset.legal); return; }
  if((b = e.target.closest('[data-rs-r]'))){ var p = b.dataset.rsR.split('|'); st.r[p[0]] = st.r[p[0]] === p[1] ? '' : p[1]; if(!st.r[p[0]]) delete st.r[p[0]]; salva(); redesenha(); return; }
  if((b = e.target.closest('[data-rs-lote]'))){ var n = UvisPadrao.estado(), s = D.secoes.filter(function(x){ return x.id === n.secao; })[0], it = s && s.itens.filter(function(x){ return x.id === n.item; })[0];
   if(it) perguntasDe(it).forEach(function(q){ if(!st.r[q.id] && (b.dataset.rsLote === 'c' || q.na || D.naSempre)) st.r[q.id] = b.dataset.rsLote; }); salva(); redesenha(); return; }
  if((b = e.target.closest('[data-rs-acao]'))){ if(b.dataset.rsAcao === 'anvisa_cnpj') acaoAnvisa(); else if(b.dataset.rsAcao === 'ocr_crt') acaoCrt(); return; }
  if((b = e.target.closest('[data-rs-eq-buscar]'))){ eqBuscar(b.dataset.rsEqBuscar); return; }
  if((b = e.target.closest('[data-rs-eq-add]'))){ var La = eqLista(b.dataset.rsEqAdd).slice(); if(!La.length) La.push({}); La.push({}); st.meta[b.dataset.rsEqAdd] = La; salva(); redesenha(); return; }
  if((b = e.target.closest('[data-rs-eq-del]'))){ var pd = b.dataset.rsEqDel.split('|'), Ld = eqLista(pd[0]).slice(); Ld.splice(+pd[1], 1); st.meta[pd[0]] = Ld; eqMsg = {}; salva(); redesenha(); return; }
  if((b = e.target.closest('[data-rs-foto]'))){ foto(b.dataset.rsFoto); return; }
  if((b = e.target.closest('[data-rs-sem-foto]'))){ delete st.fotos[b.dataset.rsSemFoto]; fotoAberta = b.dataset.rsSemFoto; salva(); redesenha(); return; }
  if((b = e.target.closest('[data-rs-sugeridas]'))){ Object.keys(sugeridas()).forEach(function(k){ st.inf[k] = true; }); salva(); abaInfracoes(document.getElementById('pu-aba')); UvisPadrao.atualiza(); return; }
  if((b = e.target.closest('[data-rs-word]'))){ b.disabled = true; docx(blocos(), D.relatorio.titulo + ' — ' + D.titulo).then(function(blob){ baixa(blob, nomeArq('docx')); aviso('Relatório em Word gerado.'); }, function(){ aviso('Não foi possível gerar o Word.'); }).then(function(){ b.disabled = false; }); return; }
  if((b = e.target.closest('[data-rs-copia]'))){ var t = blocosTexto(blocos()); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function(){ aviso('Texto do relatório copiado.'); }, function(){ var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); aviso('Texto do relatório copiado.'); } catch(x){} ta.remove(); }); return; }
  if((b = e.target.closest('[data-rs-pendente]'))){ var id = ORDEM.filter(function(k){ return visivel(PERG[k]) && !st.r[k]; })[0]; if(id) UvisPadrao.vai({aba: 'roteiro', secao: ONDE[id].s.id, item: ONDE[id].it.id}); return; }
 });
 document.addEventListener('keydown', function(e){ var t = e.target; if(e.key === 'Enter' && t && t.matches && t.matches('[data-rs-eq$="|busca"]')){ e.preventDefault(); var q = t.dataset.rsEq.split('|'); eqBuscar(q[0] + '|' + q[1]); } });
 document.addEventListener('toggle', function(e){ var d = e.target; if(d && d.matches && d.matches('[data-rs-previa]')) previaAberta[d.dataset.rsPrevia] = d.open; }, true);
 document.addEventListener('input', function(e){ var t = e.target;
  if(t.matches('[data-rs-meta]')){ if(t.hasAttribute('data-rs-cnpj')){ var pos = t.value.length; t.value = mascaraCnpj(t.value); } st.meta[t.dataset.rsMeta] = t.value; salva(); UvisPadrao.atualiza(); return; }
  if(t.matches('[data-rs-eq]')){ var qe = t.dataset.rsEq.split('|'), de = {}; de[qe[2]] = t.value; eqSet(qe[0] + '|' + qe[1], de); UvisPadrao.atualiza(); return; }
  if(t.matches('[data-rs-sit]')){ st.sit[t.dataset.rsSit] = t.value; salva(); var pv = t.closest('.rs-q').querySelector('.rs-previa p'); if(pv) pv.textContent = frase(PERG[t.dataset.rsSit]); return; }
  if(t.matches('[data-rs-concl]')){ st.concl = t.value; salva(); return; } });
 document.addEventListener('change', function(e){ var t = e.target;
  if(t.matches('[data-rs-check]')){ var a = Array.isArray(st.meta[t.dataset.rsCheck]) ? st.meta[t.dataset.rsCheck].slice() : [], v = t.value; if(t.checked){ if(a.indexOf(v) < 0) a.push(v); } else a = a.filter(function(x){ return x !== v; }); st.meta[t.dataset.rsCheck] = a; salva(); if(/^chk_/.test(t.dataset.rsCheck)) redesenha(); else UvisPadrao.atualiza(); return; }
  if(t.matches('select[data-rs-eq]')){ var qs = t.dataset.rsEq.split('|'), ds = {}; ds[qs[2]] = t.value; eqSet(qs[0] + '|' + qs[1], ds); UvisPadrao.atualiza(); return; }
  if(t.matches('select[data-rs-meta]')){ st.meta[t.dataset.rsMeta] = t.value; naAuto(); salva(); redesenha(); return; }
  if(t.matches('[data-rs-inf]')){ st.inf[t.dataset.rsInf] = t.checked; if(!t.checked) delete st.inf[t.dataset.rsInf]; salva(); UvisPadrao.atualiza(); return; }
  if(t.matches('[data-rs-concl]')){ var r = document.querySelector('.rs-relatorio'); if(r) abaRelatorio(document.getElementById('pu-aba')); } });

 /* ---------- apagar dados da inspeção (tela inicial do roteiro) ----------
    Apaga a inspeção em andamento; as inspeções guardadas em Salvas ficam. */
 document.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('[data-rs-apagar]'); if(!b) return; e.preventDefault();
  if(!confirm('Apagar todos os dados desta inspeção?\n\nRespostas, anotações e fotos serão apagadas deste aparelho. As inspeções guardadas em Salvas não são afetadas. Não há como desfazer.')) return;
  var fim = function(){ st = novo(); try { localStorage.removeItem(STORE); } catch(err){} UvisPadrao.vai({aba: 'roteiro', secao: null, item: null}); aviso('Dados da inspeção apagados.'); };
  var S = null; try { S = parent !== window && parent.UvisSalvas; } catch(err){}
  if(S && S.novaInspecao && D.app) Promise.resolve(S.novaInspecao(D.app)).catch(function(){}).then(fim); else fim(); });

 /* ---------- montagem ---------- */
 function inicia(){
  var raiz = document.createElement('div'); raiz.id = 'pu-raiz'; document.body.insertBefore(raiz, document.body.firstChild);
  UvisPadrao.monta({
   raiz: raiz, titulo: D.titulo, cor: D.cor,
   abas: [{id: 'roteiro', rotulo: 'Roteiro'}, {id: 'infracoes', rotulo: 'Infrações'}, {id: 'relatorio', rotulo: 'Relatório'}],
   secoes: function(){ return D.secoes.map(function(s){ return {id: s.id, titulo: s.titulo, curto: s.curto, icone: s.icone, descricao: s.descricao, itens: s.itens.map(function(it){ var p = progressoItem(it); return {id: it.id, titulo: it.titulo, curto: it.curto, resumo: it.descricao, feitos: p.feitos, total: p.total}; })}; }); },
   item: function(s, it, el){ var S = D.secoes.filter(function(x){ return x.id === s.id; })[0], I = S.itens.filter(function(x){ return x.id === it.id; })[0]; desenhaItem(S, I, el); },
   aba: function(id, el){ if(id === 'infracoes') abaInfracoes(el); else if(id === 'relatorio') abaRelatorio(el); },
   contagem: function(id){ return id === 'roteiro' ? nNC() : id === 'infracoes' ? D.infracoes.filter(function(i){ return st.inf[i.id]; }).length : 0; },
   depois: function(nav){ if(nav.aba !== 'roteiro' || nav.secao) return; var g = document.querySelector('.pu-secoes-grade'); if(!g || g.querySelector('[data-rs-apagar]')) return;
    var z = document.createElement('div'); z.className = 'rs-apagar'; z.innerHTML = '<div class="rs-apagar-txt"><strong>Apagar dados da inspeção</strong><span>Remove todas as respostas, anotações, fotos e dados desta inspeção salvos neste aparelho. Não há como desfazer; para guardar, use antes o botão Salvas.</span></div><button type="button" class="rs-apagar-btn" data-rs-apagar><span aria-hidden="true">🗑</span> Apagar dados</button>'; g.appendChild(z); },
   limpar: function(s, it){ var S = D.secoes.filter(function(x){ return x.id === s.id; })[0];
    (it ? S.itens.filter(function(x){ return x.id === it.id; }) : S.itens).forEach(function(I){ (I.campos || []).forEach(function(c){ delete st.meta[c.id]; }); (I.perguntas || []).forEach(function(q){ delete st.r[q.id]; delete st.sit[q.id]; delete st.fotos[q.id]; }); });
    salva(); }
  });
  try { parent.postMessage({__casca: 'pronto'}, '*'); } catch(e){}
 }
 if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inicia); else inicia();
})();
