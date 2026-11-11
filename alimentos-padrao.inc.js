/* ——— Serviços de alimentação no Padrão UVIS (padrao-uvis.js) ———
   Fragmento inserido no fim do script principal do app--servicos-alimentacao-roteiro por
   scripts/repack-alimentos-setores.cjs. Estado (uvis-alimentos-estab-v1), respostas, notas, fotos,
   infrações e texto do relatório continuam os mesmos.
   · Perfil por SETORES (11/11/2026, alimentos/setores.cjs): o fiscal marca os setores do local
     (atalhos para supermercado, restaurante…); cada setor marca os processos que implica e libera o
     seu módulo na seção “Setores do estabelecimento”. Identificação com o licenciamento sanitário
     (Portaria SMS nº 266/2025: CMVS, CLI, MEI, isento).
   · O perfil ESCONDE o que não se aplica (revisto em 11/11/2026; antes só avisava). Verificação
     respondida e depois fora do perfil continua à vista, com aviso, e entra no relatório.
   · Seções do percurso: cada bloco da Portaria SMS nº 2.619/2011 é um item. */
var PADRAO = !!(window.UvisPadrao && window.__uvsPadrao);
var SA_GRUPOS = [
  { id: 'docs', titulo: 'Identificação e documentos', icone: 'folder', blocos: ['opening'] },
  { id: 'estrutura', titulo: 'Estrutura, água, resíduos e higiene', icone: 'building', blocos: ['structure', 'environment'] },
  { id: 'armazenamento', titulo: 'Recebimento e armazenamento', icone: 'box', blocos: ['storage'] },
  { id: 'manipulacao', titulo: 'Manipulação, preparo e exposição', icone: 'food', blocos: ['handlers', 'preparation', 'exposure'] },
  { id: 'setores', titulo: 'Setores do estabelecimento', icone: 'box', blocos: 'modulos' },
  { id: 'transporte', titulo: 'Transporte e encerramento', icone: 'truck', blocos: ['transport', 'closing'] }
];
var SA_RESP = [['ok', 'Sim'], ['nao', 'Não'], ['na', 'Não se aplica']];
/* tipos antigos (até 11/11/2026) → setores */
var SA_TIPOS_ANTIGOS = { restaurant: ['cozinha', 'salao'], bakery: ['padaria'], butcher: ['acougue'], market: ['mercearia'], institutional: ['institucional'], buffet: ['bufe'], mobile: ['movel'], delivery: ['delivery'], warehouse: ['deposito'] };
var casaPerfil = casa;
if (PADRAO) casa = function () { return true; };

function saEsc(s) { return UvisPadrao.esc(s); }
function saBloco(id) { return (cfg.sections || []).filter(function (s) { return s.id === id; })[0]; }
function saModulos() { return (cfg.sections || []).filter(function (s) { return s.setor; }); }
function saTitulo(s) { return String(s.title || s.id).replace(/^\s*\d+\.\s*/, ''); }
function saSetor(id) { return (cfg.profile.types || []).filter(function (x) { return x.id === id; })[0]; }
/* setores marcados (st.tipos guarda os ids dos setores) */
function saTipos() {
  if (!Array.isArray(st.tipos)) st.tipos = st.tipo ? [st.tipo] : [];
  if (st.tipos.some(function (t) { return SA_TIPOS_ANTIGOS[t]; })) {
    var novo = [];
    st.tipos.forEach(function (t) { (SA_TIPOS_ANTIGOS[t] || [t]).forEach(function (x) { if (novo.indexOf(x) < 0 && saSetor(x)) novo.push(x); }); });
    st.tipos = novo; st.tipo = novo[0] || '';
  }
  return st.tipos;
}
function saValores(id) { var v = st.valores[id]; if (!Array.isArray(v)) v = st.valores[id] = v ? [v] : []; return v; }
function saRotuloTipos() { return saTipos().map(function (id) { var t = saSetor(id); return t ? t.label : ''; }).filter(Boolean).join('; '); }
function saTipo() { var r = saRotuloTipos(); return r ? { label: r } : null; }
/* licenciamento: o campo guarda o rótulo (é o que sai no relatório); a condição usa o id */
function saRegime() { var f = (cfg.profile.fields || []).filter(function (x) { return x.id === 'regime'; })[0], v = st.meta.regime || '', ids = cfg.profile.regimes || [];
  for (var i = 0; i < ids.length; i++) if (ids[i].label === v) return ids[i].id;
  return f && v ? 'outro' : ''; }
function saCasa(w) {
  if (!w) return true;
  if (w.any && w.any.length && !w.any.some(saCasa)) return false;
  if (w.all && w.all.length && !w.all.every(saCasa)) return false;
  var tipos = saTipos();
  if (w.types && w.types.length && !w.types.some(function (t) { return tipos.indexOf(t) >= 0; })) return false;
  if (w.notTypes && tipos.length && tipos.every(function (t) { return w.notTypes.indexOf(t) >= 0; })) return false;
  if (w.flagsAll && !w.flagsAll.every(function (f) { return st.flags[f]; })) return false;
  if (w.flagsAny && !w.flagsAny.some(function (f) { return st.flags[f]; })) return false;
  if (w.regime && w.regime.indexOf(saRegime()) < 0) return false;
  if (w.values) for (var k in w.values) if (Object.prototype.hasOwnProperty.call(w.values, k)) {
    var esp = [].concat(w.values[k]), sel = saValores(k);
    if (!sel.some(function (v) { return esp.indexOf(v) >= 0; })) return false;
  }
  return true;
}
/* o que aparece: aplicável ao perfil, ou já respondido (a resposta nunca some em silêncio) */
function saItemVisivel(it, b) { return !!st.resp[it.id] || ((!b || saCasa(b.when)) && saCasa(it.when)); }
function saItensVisiveis(b) { return (b.items || []).filter(function (it) { return saItemVisivel(it, b); }); }
function saForaDoPerfil(it, b) { return !!st.resp[it.id] && !((!b || saCasa(b.when)) && saCasa(it.when)); }
function saFeitos(b) { return saItensVisiveis(b).filter(function (i) { return st.resp[i.id]; }).length; }
/* relatório e contagens do motor: só o que está à vista */
if (PADRAO) itensVisiveis = function () {
  var out = [];
  (cfg.sections || []).forEach(function (s) { var itens = saItensVisiveis(s); if (itens.length) out.push({ secao: s, itens: itens }); });
  return out;
};

function saSecoes() {
  var tipo = saTipo(), campos = cfg.profile.fields || [];
  var perfil = { id: 'perfil', titulo: 'Perfil e identificação', curto: 'Perfil', icone: 'building',
    resumo: (tipo ? saTipos().length + (saTipos().length > 1 ? ' setores' : ' setor') : 'Setores não marcados') + (st.meta.establishment ? ' · ' + st.meta.establishment : ''),
    itens: [
      { id: 'ident', titulo: 'Identificação e licenciamento', curto: 'Identificação', feitos: campos.filter(function (f) { return st.meta[f.id]; }).length, total: campos.length },
      { id: 'tipo', titulo: 'Setores do estabelecimento', curto: 'Setores', resumo: tipo ? tipo.label : 'Marque os setores existentes no local', feitos: saTipos().length ? 1 : 0, total: 1 },
      { id: 'processos', titulo: 'Processos presentes no local', curto: 'Processos', resumo: 'Os setores já marcam o que implicam; confira os demais.', feitos: Object.keys(st.flags).some(function (k) { return st.flags[k]; }) ? 1 : 0, total: 1 }
    ] };
  var lista = [perfil];
  SA_GRUPOS.forEach(function (g) {
    var blocos = g.blocos === 'modulos' ? saModulos() : g.blocos.map(saBloco).filter(Boolean);
    var itens = blocos.filter(function (b) { return saItensVisiveis(b).length; }).map(function (b) {
      return { id: b.id, titulo: saTitulo(b), curto: saTitulo(b), resumo: b.description || '', feitos: saFeitos(b), total: saItensVisiveis(b).length };
    });
    if (itens.length) lista.push({ id: g.id, titulo: g.titulo, curto: g.titulo, icone: g.icone, itens: itens });
  });
  return lista;
}

function saPergunta(it, n, b) {
  var v = st.resp[it.id] || '', fora = saForaDoPerfil(it, b), foto = st.fotos && st.fotos[it.id], nota = st.notas[it.id];
  var h = '<div class="pu-q' + (fora ? ' pu-q-fora' : '') + '" data-sa-q="' + saEsc(it.id) + '"><p class="pu-q-texto"><b>' + n + '.</b> ' + saEsc(it.text) + '</p>';
  if (it.critical || fora) h += '<div class="pu-tags">' + (it.critical ? '<span class="pu-tag">Prioritário</span>' : '') + (fora ? '<span class="pu-tag pu-tag-fora">Fora do perfil atual</span>' : '') + '</div>';
  if (fora) h += '<p class="pu-q-ajuda">Respondida antes da mudança do perfil. Mantenha, se a verificação foi feita, ou <button type="button" class="pu-link" data-sa-apaga="' + saEsc(it.id) + '">apague a resposta</button>.</p>';
  h += '<div class="pu-cit"></div>';
  h += '<div class="pu-resp" role="group" aria-label="Resposta">' + SA_RESP.map(function (r) { return '<button type="button" data-sa-resp="' + saEsc(it.id) + '" data-v="' + r[0] + '" aria-pressed="' + (v === r[0]) + '">' + r[1] + '</button>'; }).join('') + '</div>';
  h += '<details class="pu-mais"><summary>Foto, nota e fontes' + (foto || nota ? ' ✓' : '') + '</summary><div>'
    + '<div class="pu-foto-acoes"><button type="button" class="pu-btn" data-sa-foto="' + saEsc(it.id) + '">📷 ' + (foto ? 'Trocar foto' : 'Tirar ou anexar foto') + '</button>' + (foto ? '<button type="button" class="pu-btn" data-sa-sem-foto="' + saEsc(it.id) + '">Remover foto</button>' : '') + '</div>'
    + (foto ? '<img class="photo-thumb" alt="Foto vinculada ao item" src="' + saEsc(foto) + '">' : '')
    + '<label class="pu-campo">Nota factual<textarea data-sa-nota="' + saEsc(it.id) + '" rows="3" placeholder="Anotação factual, no momento da constatação.">' + saEsc(nota || '') + '</textarea></label>'
    + ((it.links || []).length ? (it.links || []).map(function (lk) { return '<a class="prov-nota" style="display:block;margin:6px 0" href="' + saEsc(lk.url) + '" target="_blank" rel="noopener noreferrer">' + saEsc(lk.label) + ' ↗</a>'; }).join('') : '')
    + (it.legal ? '<p class="pu-q-ajuda">Referência: ' + saEsc(it.legal) + '</p>' : '')
    + '</div></details></div>';
  return h;
}

function saItemBloco(el, b) {
  var vis = saItensVisiveis(b);
  el.innerHTML = (b.description ? '<p class="pu-desc">' + saEsc(b.description) + '</p>' : '')
    + (b.id === 'opening' ? '<p class="pu-desc">Manual de Boas Práticas, POPs, responsável técnico, ASO e demais documentos: conferir no checklist de documentos.</p>' : '')
    + (vis.length ? vis.map(function (it, i) { return saPergunta(it, i + 1, b); }).join('')
      + '<div class="pu-acoes-item"><button type="button" class="pu-btn" data-sa-na="pendentes">Marcar pendentes como Não se aplica</button></div>'
      : '<p class="pu-q-ajuda">Nenhuma verificação deste bloco se aplica aos setores e processos marcados no perfil.</p>');
  /* citação por dispositivo: o mesmo botão dos demais roteiros */
  vis.forEach(function (it) {
    if (!it.legal) return;
    var alvo = el.querySelector('[data-sa-q="' + it.id + '"] .pu-cit');
    if (alvo) alvo.appendChild(botaoCitacao(it.legal));
  });
}

/* ——— perfil ——— */
function saCampo(f) {
  var v = st.meta[f.id] || '', est = f.full ? ' style="grid-column:1/-1"' : '';
  if (f.type === 'select') return '<label' + est + '>' + saEsc(f.label) + '<select data-sa-meta="' + saEsc(f.id) + '"><option value="">Selecione…</option>'
    + (f.options || []).map(function (o) { return '<option' + (o === v ? ' selected' : '') + '>' + saEsc(o) + '</option>'; }).join('')
    + (v && (f.options || []).indexOf(v) < 0 ? '<option selected>' + saEsc(v) + '</option>' : '') + '</select></label>';
  return '<label' + est + '>' + saEsc(f.label) + '<input type="' + saEsc(f.type || 'text') + '" data-sa-meta="' + saEsc(f.id) + '" value="' + saEsc(v) + '" placeholder="' + saEsc(f.placeholder || '') + '"></label>';
}
/* setores sugeridos pelos CNAE (da licença digitados, ou da Receita na busca do CNPJ) */
function saSugeridos() {
  var txt = String(st.meta.cnaeLic || '') + ' ' + (st.cnaesReceita || []).join(' '), cod = txt.match(/\d{4}-?\d\/?\d{2}/g) || [], marcados = saTipos();
  cod = cod.map(function (c) { var d = c.replace(/\D/g, ''); return d.slice(0, 4) + '-' + d.charAt(4) + '/' + d.slice(5); });
  return (cfg.profile.types || []).filter(function (s) { return marcados.indexOf(s.id) < 0 && (s.cnae || []).some(function (c) { return cod.indexOf(c) >= 0; }); });
}
function saPerfil(el, id) {
  if (id === 'ident') {
    el.innerHTML = '<div class="pu-bloco"><h3>Dados do estabelecimento</h3><div class="pu-campos">' + (cfg.profile.fields || []).map(saCampo).join('') + '</div>'
      + '<p class="pu-q-ajuda">Licenciamento: Portaria SMS nº 266/2025. Nível de Risco II (médio) recebe o CLI automático no Portal Integrador; Nível III (alto) tem licença com CMVS; MEI de risco II é dispensado pelo CCMEI; atividade fora do Anexo I é isenta.</p></div>';
    if (window.padraoCnaeHost) el.appendChild(window.padraoCnaeHost);
  } else if (id === 'tipo') {
    var sel = saTipos(), grupos = cfg.profile.groups || [], sug = saSugeridos();
    var h = '<div class="pu-bloco"><h3>Atalhos</h3><p>Um toque marca os setores típicos; depois desmarque o que não existe no local.</p><div class="sa-atalhos">'
      + (cfg.profile.presets || []).map(function (p) { return '<button type="button" class="pu-btn" data-sa-preset="' + saEsc(p.id) + '">' + saEsc(p.label) + '</button>'; }).join('') + '</div>'
      + (sug.length ? '<p class="pu-q-ajuda"><b>Sugeridos pelos CNAE:</b> ' + sug.map(function (s) { return '<button type="button" class="pu-btn" data-sa-sugere="' + saEsc(s.id) + '">+ ' + saEsc(s.label) + '</button>'; }).join(' ') + '</p>' : '')
      + '</div>';
    h += '<div class="pu-bloco"><h3>Setores do estabelecimento' + (sel.length ? ' <small>(' + sel.length + ' marcado' + (sel.length > 1 ? 's' : '') + ')</small>' : '') + '</h3><p>Cada setor marcado traz as suas verificações; o que não se aplica sai do roteiro.</p>'
      + grupos.map(function (g) {
        var ss = (cfg.profile.types || []).filter(function (s) { return s.grupo === g[0]; }), n = ss.filter(function (s) { return sel.indexOf(s.id) >= 0; }).length;
        return '<details class="sa-grupo" data-sa-grupo="' + saEsc(g[0]) + '"' + (n || !sel.length ? ' open' : '') + '><summary>' + saEsc(g[1]) + (n ? ' <span class="sa-n">' + n + '</span>' : '') + '</summary><div class="pu-marcas">'
          + ss.map(function (x) { return '<label class="pu-marca"><input type="checkbox" data-sa-tipo="' + saEsc(x.id) + '"' + (sel.indexOf(x.id) >= 0 ? ' checked' : '') + '><span><strong>' + saEsc(x.label) + '</strong>' + (x.description ? '<small>' + saEsc(x.description) + '</small>' : '') + '</span></label>'; }).join('')
          + '</div></details>';
      }).join('') + '</div>';
    el.innerHTML = h;
  } else if (id === 'processos') {
    var auto = st.flagsAuto || {};
    el.innerHTML = '<div class="pu-bloco"><h3>Processos presentes no local</h3><p>Os marcados “pelo setor” vêm dos setores escolhidos; ajuste se o local for diferente. Verificações de processo não marcado ficam fora do roteiro.</p><div class="pu-marcas">'
      + (cfg.profile.flags || []).map(function (f) { return '<label class="pu-marca"><input type="checkbox" data-sa-flag="' + saEsc(f.id) + '"' + (st.flags[f.id] ? ' checked' : '') + '><span><strong>' + saEsc(f.label) + '</strong>' + (st.flags[f.id] && auto[f.id] ? '<small>pelo setor</small>' : '') + '</span></label>'; }).join('') + '</div></div>';
  }
}
/* marcar/desmarcar setor: processos implicados acompanham (só os que o próprio setor marcou) */
function saMarcaSetor(id, on) {
  var ts = saTipos(), p = ts.indexOf(id), s = saSetor(id); if (!s) return;
  st.flagsAuto = st.flagsAuto || {};
  if (on && p < 0) { ts.push(id); (s.flags || []).forEach(function (f) { if (!st.flags[f]) { st.flags[f] = true; st.flagsAuto[f] = true; } }); }
  if (!on && p >= 0) {
    ts.splice(p, 1);
    (s.flags || []).forEach(function (f) {
      if (!st.flagsAuto[f]) return;
      var outro = ts.some(function (t) { return ((saSetor(t) || {}).flags || []).indexOf(f) >= 0; });
      if (!outro) { st.flags[f] = false; delete st.flagsAuto[f]; }
    });
  }
  st.tipo = ts[0] || '';
}

function saRelatorio(el) {
  var total = 0, resp = 0, nc = 0, na = 0;
  itensVisiveis().forEach(function (g) { g.itens.forEach(function (i) { total++; var v = st.resp[i.id]; if (v) resp++; if (v === 'nao') nc++; if (v === 'na') na++; }); });
  var inf = Object.keys(st.inf || {}).length;
  el.innerHTML = '<div class="pu-bloco"><h3>Resumo da inspeção</h3><p>' + saEsc((saTipo() || {}).label || 'Setores não marcados') + (st.meta.establishment ? ' · ' + saEsc(st.meta.establishment) : '') + '</p>'
    + '<div class="pu-campos"><div class="pu-campo">Respondidas<b>' + resp + ' de ' + total + '</b></div><div class="pu-campo">Irregulares<b>' + nc + '</b></div><div class="pu-campo">Não se aplica<b>' + na + '</b></div><div class="pu-campo">Infrações selecionadas<b>' + inf + '</b></div></div>'
    + '<div class="pu-acoes-item"><button type="button" class="pu-btn" data-sa-pendente>Ir à próxima verificação pendente</button></div></div><div id="sa-rel"></div>'
    + '<p class="pu-q-ajuda">As fotos saem à parte, no botão Fotos do cabeçalho.</p>';
  pintaRelatorio(el.querySelector('#sa-rel'));
}

function saDesenhaItem(secao, item, el) {
  if (secao === 'perfil') saPerfil(el, item);
  else { var b = saBloco(item); if (b) saItemBloco(el, b); else el.innerHTML = '<p class="pu-q-ajuda">Bloco não disponível.</p>'; }
}
function saRedesenha() {
  var n = UvisPadrao.estado(), c = document.getElementById('pu-conteudo');
  if (n.aba === 'roteiro' && n.item && c) {
    var y = window.scrollY, abertos = [].map.call(c.querySelectorAll('details[open]'), function (d) { var q = d.closest('[data-sa-q]'); return q ? q.dataset.saQ : ''; });
    saDesenhaItem(n.secao, n.item, c);
    abertos.forEach(function (id) { var d = id && c.querySelector('[data-sa-q="' + id + '"] details'); if (d) d.open = true; });
    window.scrollTo(0, y);
  }
  UvisPadrao.atualiza();
}
function saItemAberto() { var n = UvisPadrao.estado(); return n.secao !== 'perfil' && n.item ? saBloco(n.item) : null; }

function saFoto(id) {
  var fi = document.createElement('input'); fi.type = 'file'; fi.accept = 'image/*'; fi.setAttribute('capture', 'environment'); fi.style.display = 'none';
  fi.onchange = function () {
    var f = fi.files && fi.files[0]; if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      (window.__uvsReduzFoto || function (u, cb) { cb(u); })(r.result, function (url) {
        st.fotos = st.fotos || {}; var antes = st.fotos[id]; st.fotos[id] = url; var ok = true;
        try { salva(); ok = (localStorage.getItem(CHAVE) || '').indexOf(url.slice(-40)) >= 0; } catch (e) { ok = false; }
        if (!ok) { if (antes) st.fotos[id] = antes; else delete st.fotos[id]; try { salva(); } catch (e) {} alert('Não há mais espaço para fotos neste aparelho. Gere o relatório fotográfico e remova fotos antigas.'); }
        saRedesenha();
      });
    };
    r.readAsDataURL(f);
  };
  document.body.appendChild(fi); fi.click(); setTimeout(function () { fi.remove(); }, 60000);
}

function iniciaPadrao() {
  if (!carregaCfg()) { document.body.appendChild(el('div', 'erro-box', 'Configuração do roteiro não carregou.')); return; }
  st = carregaEstado();
  saTipos(); /* converte os tipos antigos em setores */
  ['body > header', 'body > nav.abas', 'body > main'].forEach(function (q) { var n = document.querySelector(q); if (n) { n.hidden = true; n.setAttribute('data-pu-oculto', ''); } });
  var css = document.createElement('style');
  css.textContent = '.pu-ativo .sa-atalhos{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}'
    + '.pu-ativo .sa-grupo{border:1px solid var(--ui-line,#d9e2e8);border-radius:10px;margin:10px 0;background:#fff}'
    + '.pu-ativo .sa-grupo>summary{min-height:44px;display:flex;align-items:center;gap:8px;padding:0 14px;font-weight:700;cursor:pointer}'
    + '.pu-ativo .sa-grupo>.pu-marcas{padding:0 12px 12px}'
    + '.pu-ativo .sa-n{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:var(--pu-cor,#426551);color:#fff;font-size:.78rem}'
    + '.pu-ativo .pu-link{border:0;background:none;padding:0;color:inherit;text-decoration:underline;font:inherit;cursor:pointer}';
  document.head.appendChild(css);
  /* CNAE da Receita (busca pelo CNPJ, campo/cnpj-anvisa.js): sugere setores */
  window.addEventListener('uvs-cnpj-cnaes', function (e) { st.cnaesReceita = (e.detail || []).slice(0, 40); salva(); var n = UvisPadrao.estado(); if (n.secao === 'perfil') saRedesenha(); });
  var raiz = document.createElement('div'); raiz.id = 'pu-raiz'; document.body.insertBefore(raiz, document.body.firstChild);
  var semTipo = !saTipos().length;
  UvisPadrao.monta({
    raiz: raiz,
    titulo: cfg.shortTitle || 'Serviços de alimentação',
    cor: cfg.theme || '#426551',
    abas: [{ id: 'roteiro', rotulo: 'Roteiro' }, { id: 'infracoes', rotulo: 'Infrações' }, { id: 'relatorio', rotulo: 'Relatório' }],
    inicio: semTipo ? { aba: 'roteiro', secao: 'perfil', item: null } : null,
    secoes: saSecoes,
    item: function (s, it, e) { saDesenhaItem(s.id, it.id, e); },
    aba: function (id, e) { if (id === 'infracoes') pintaInfracoes(e); else if (id === 'relatorio') saRelatorio(e); },
    contagem: function (id) {
      if (id === 'roteiro') return Object.keys(st.resp).filter(function (k) { return st.resp[k] === 'nao'; }).length;
      if (id === 'infracoes') return Object.keys(st.inf || {}).length;
      return 0;
    },
    limpar: function (s, it) {
      if (s.id === 'perfil') {
        var ini = estadoInicial();
        if (!it || it.id === 'ident') st.meta = ini.meta;
        if (!it || it.id === 'tipo') { st.tipo = ''; st.tipos = []; st.valores = {}; Object.keys(st.flagsAuto || {}).forEach(function (f) { st.flags[f] = false; }); st.flagsAuto = {}; }
        if (!it || it.id === 'processos') { st.flags = ini.flags; st.flagsAuto = {}; }
      } else {
        (it ? [it.id] : s.itens.map(function (x) { return x.id; })).forEach(function (bid) {
          ((saBloco(bid) || {}).items || []).forEach(function (q) { delete st.resp[q.id]; delete st.notas[q.id]; if (st.fotos) delete st.fotos[q.id]; });
        });
      }
      salva();
    }
  });

  var raizEl = raiz;
  raizEl.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-sa-resp]'))) {
      var id = b.dataset.saResp, v = b.dataset.v;
      st.resp[id] = v; salva();
      [].forEach.call(b.parentNode.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      UvisPadrao.atualiza(); return;
    }
    if ((b = e.target.closest('[data-sa-apaga]'))) { var ap = b.dataset.saApaga; delete st.resp[ap]; delete st.notas[ap]; salva(); saRedesenha(); return; }
    if ((b = e.target.closest('[data-sa-preset]'))) {
      var pr = (cfg.profile.presets || []).filter(function (x) { return x.id === b.dataset.saPreset; })[0];
      if (pr) { pr.setores.forEach(function (sid) { saMarcaSetor(sid, true); }); salva(); saRedesenha(); }
      return;
    }
    if ((b = e.target.closest('[data-sa-sugere]'))) { saMarcaSetor(b.dataset.saSugere, true); salva(); saRedesenha(); return; }
    if ((b = e.target.closest('[data-sa-foto]'))) { saFoto(b.dataset.saFoto); return; }
    if ((b = e.target.closest('[data-sa-sem-foto]'))) { if (confirm('Remover a foto deste item?')) { if (st.fotos) delete st.fotos[b.dataset.saSemFoto]; salva(); saRedesenha(); } return; }
    if ((b = e.target.closest('[data-sa-na]'))) {
      var bl = saItemAberto(); if (!bl) return;
      saItensVisiveis(bl).forEach(function (q) { if (!st.resp[q.id]) st.resp[q.id] = 'na'; });
      salva(); saRedesenha(); return;
    }
    if (e.target.closest('[data-sa-pendente]')) {
      var secs = saSecoes();
      for (var i = 0; i < secs.length; i++) for (var j = 0; j < secs[i].itens.length; j++) { var x = secs[i].itens[j]; if (x.total && x.feitos < x.total) { UvisPadrao.vai({ aba: 'roteiro', secao: secs[i].id, item: x.id }); return; } }
      alert('Todas as verificações foram respondidas.'); return;
    }
  });
  raizEl.addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset.saMeta) { st.meta[t.dataset.saMeta] = t.value; salva(); }
    else if (t.dataset.saNota) { st.notas[t.dataset.saNota] = t.value; if (!t.value) delete st.notas[t.dataset.saNota]; salva(); }
  });
  raizEl.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.saTipo) { saMarcaSetor(t.dataset.saTipo, t.checked); salva(); saRedesenha(); }
    else if (t.dataset.saValor) { var vs = saValores(t.dataset.saValor), q = vs.indexOf(t.value); if (t.checked && q < 0) vs.push(t.value); if (!t.checked && q >= 0) vs.splice(q, 1); salva(); UvisPadrao.atualiza(); }
    else if (t.dataset.saFlag) { st.flags[t.dataset.saFlag] = t.checked; if (st.flagsAuto) delete st.flagsAuto[t.dataset.saFlag]; salva(); saRedesenha(); }
    else if (t.dataset.saMeta) { st.meta[t.dataset.saMeta] = t.value; salva(); UvisPadrao.atualiza(); }
  });
}
