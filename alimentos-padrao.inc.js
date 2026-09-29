/* ——— Serviços de alimentação no Padrão UVIS (padrao-uvis.js) ———
   Fragmento inserido no fim do script principal do app--servicos-alimentacao-roteiro por
   scripts/repack-padrao.cjs. Troca só a tela: estado (uvis-alimentos-estab-v1), respostas,
   notas, fotos, infrações e texto do relatório continuam os mesmos.
   · Seção 1 “Perfil e identificação”: identificação, tipo de serviço e operação, processos.
   · Seções 2 a 6: o percurso da visita; cada bloco da Portaria SMS nº 2.619/2011 é um item.
   · O perfil não esconde verificações (decisão da equipe): as que dependem de processo ou tipo
     não marcado trazem aviso e podem ser marcadas como “Não se aplica”. */
var PADRAO = !!(window.UvisPadrao && window.__uvsPadrao);
var SA_GRUPOS = [
  { id: 'docs', titulo: 'Identificação e documentos', icone: 'folder', blocos: ['opening'] },
  { id: 'estrutura', titulo: 'Estrutura, água, resíduos e higiene', icone: 'building', blocos: ['structure', 'environment'] },
  { id: 'armazenamento', titulo: 'Recebimento e armazenamento', icone: 'box', blocos: ['storage'] },
  { id: 'manipulacao', titulo: 'Manipulação, preparo e exposição', icone: 'food', blocos: ['handlers', 'preparation', 'exposure'] },
  { id: 'transporte', titulo: 'Transporte e encerramento', icone: 'truck', blocos: ['transport', 'closing'] }
];
var SA_RESP = [['ok', 'Cumpre'], ['nao', 'Não cumpre'], ['na', 'Não se aplica']];
var casaPerfil = casa;
if (PADRAO) casa = function () { return true; };

function saEsc(s) { return UvisPadrao.esc(s); }
function saBloco(id) { return (cfg.sections || []).filter(function (s) { return s.id === id; })[0]; }
function saTitulo(s) { return String(s.title || s.id).replace(/^\s*\d+\.\s*/, ''); }
function saFeitos(b) { return (b.items || []).filter(function (i) { return st.resp[i.id]; }).length; }
function saTipo() { return (cfg.profile.types || []).filter(function (x) { return x.id === st.tipo; })[0]; }
/* por que a verificação pode não se aplicar ao perfil marcado */
function saForaDoPerfil(when) {
  if (!when || !st.tipo || casaPerfil(when)) return '';
  var nomes = [];
  (function junta(w) {
    if (!w) return;
    (w.flagsAll || []).concat(w.flagsAny || []).forEach(function (f) {
      var d = (cfg.profile.flags || []).filter(function (x) { return x.id === f; })[0];
      if (d && !st.flags[f] && nomes.indexOf(d.label) < 0) nomes.push(d.label);
    });
    if (w.types && w.types.indexOf(st.tipo) < 0) nomes.push('tipo de serviço: ' + w.types.map(function (t) { var d = (cfg.profile.types || []).filter(function (x) { return x.id === t; })[0]; return d ? d.label : t; }).join(' / '));
    if (w.values) Object.keys(w.values).forEach(function (k) { var sel = (cfg.profile.selectors || []).filter(function (x) { return x.id === k; })[0]; if (sel) nomes.push(sel.label.toLowerCase()); });
    (w.any || []).concat(w.all || []).forEach(junta);
  })(when);
  return nomes.length ? nomes.join('; ') : 'perfil marcado';
}

function saSecoes() {
  var tipo = saTipo(), campos = cfg.profile.fields || [];
  var perfil = { id: 'perfil', titulo: 'Perfil e identificação', curto: 'Perfil', icone: 'building',
    resumo: (tipo ? tipo.label : 'Tipo de serviço não escolhido') + (st.meta.establishment ? ' · ' + st.meta.establishment : ''),
    itens: [
      { id: 'ident', titulo: 'Identificação do estabelecimento', curto: 'Identificação', feitos: campos.filter(function (f) { return st.meta[f.id]; }).length, total: campos.length },
      { id: 'tipo', titulo: 'Tipo de serviço e forma de operação', curto: 'Tipo de serviço', resumo: tipo ? tipo.label : 'Escolha a atividade predominante', feitos: (st.tipo ? 1 : 0) + (cfg.profile.selectors || []).filter(function (s) { return st.valores[s.id]; }).length, total: 1 + (cfg.profile.selectors || []).length },
      { id: 'processos', titulo: 'Processos presentes no local', curto: 'Processos', resumo: 'Registro do que existe no local. Não esconde verificações.', feitos: Object.keys(st.flags).some(function (k) { return st.flags[k]; }) ? 1 : 0, total: 1 }
    ] };
  var lista = [perfil];
  SA_GRUPOS.forEach(function (g) {
    var itens = g.blocos.map(saBloco).filter(Boolean).map(function (b) {
      return { id: b.id, titulo: saTitulo(b), curto: saTitulo(b), resumo: b.description || '', feitos: saFeitos(b), total: (b.items || []).length };
    });
    if (itens.length) lista.push({ id: g.id, titulo: g.titulo, curto: g.titulo, icone: g.icone, itens: itens });
  });
  return lista;
}

function saPergunta(it, n) {
  var v = st.resp[it.id] || '', fora = saForaDoPerfil(it.when), foto = st.fotos && st.fotos[it.id], nota = st.notas[it.id];
  var h = '<div class="pu-q" data-sa-q="' + saEsc(it.id) + '"><p class="pu-q-texto"><b>' + n + '.</b> ' + saEsc(it.text) + '</p>';
  if (it.critical || fora) h += '<div class="pu-tags">' + (it.critical ? '<span class="pu-tag">Prioritário</span>' : '') + (fora ? '<span class="pu-tag pu-tag-leve">Fora do perfil marcado</span>' : '') + '</div>';
  if (fora) h += '<p class="pu-q-ajuda">Depende de: ' + saEsc(fora) + '. Se não existir no local, marque “Não se aplica”.</p>';
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
  var fora = (b.items || []).filter(function (i) { return saForaDoPerfil(i.when) && !st.resp[i.id]; }).length;
  el.innerHTML = (b.description ? '<p class="pu-desc">' + saEsc(b.description) + '</p>' : '')
    + (saForaDoPerfil(b.when) ? '<div class="pu-bloco pu-aviso"><p><b>Fora do perfil marcado</b> (' + saEsc(saForaDoPerfil(b.when)) + '). Se não existir no local, marque tudo como “Não se aplica”.</p><button type="button" class="pu-btn" data-sa-na="todos">Marcar tudo como Não se aplica</button></div>' : '')
    + (b.items || []).map(function (it, i) { return saPergunta(it, i + 1); }).join('')
    + '<div class="pu-acoes-item"><button type="button" class="pu-btn" data-sa-na="pendentes">Marcar pendentes como Não se aplica</button>'
    + (fora ? '<button type="button" class="pu-btn" data-sa-na="fora">Marcar as ' + fora + ' fora do perfil como Não se aplica</button>' : '') + '</div>';
  /* citação por dispositivo: o mesmo botão dos demais roteiros */
  (b.items || []).forEach(function (it) {
    if (!it.legal) return;
    var alvo = el.querySelector('[data-sa-q="' + it.id + '"] .pu-cit');
    if (alvo) alvo.appendChild(botaoCitacao(it.legal));
  });
}

function saPerfil(el, id) {
  if (id === 'ident') {
    el.innerHTML = '<div class="pu-bloco"><h3>Dados do estabelecimento</h3><div class="pu-campos">' + (cfg.profile.fields || []).map(function (f) {
      return '<label>' + saEsc(f.label) + '<input type="' + saEsc(f.type || 'text') + '" data-sa-meta="' + saEsc(f.id) + '" value="' + saEsc(st.meta[f.id] || '') + '" placeholder="' + saEsc(f.placeholder || '') + '"></label>';
    }).join('') + '</div></div>';
    if (window.padraoCnaeHost) el.appendChild(window.padraoCnaeHost);
  } else if (id === 'tipo') {
    var t = saTipo();
    el.innerHTML = '<div class="pu-bloco"><h3>' + saEsc(cfg.startTitle || 'Que serviço está sendo inspecionado?') + '</h3><p>' + saEsc(cfg.profile.typeHelp || '') + '</p><div class="pu-marcas">'
      + (cfg.profile.types || []).map(function (x) { return '<label class="pu-marca"><input type="radio" name="sa-tipo" data-sa-tipo="' + saEsc(x.id) + '"' + (st.tipo === x.id ? ' checked' : '') + '><span><strong>' + saEsc(x.label) + '</strong>' + (x.description ? '<small>' + saEsc(x.description) + '</small>' : '') + '</span></label>'; }).join('')
      + '</div>' + (t && t.spotlight && t.spotlight.length ? '<p class="pu-q-ajuda">Pontos de atenção: ' + saEsc(t.spotlight.join(' · ')) + '</p>' : '') + '</div>'
      + (cfg.profile.selectors || []).map(function (s) {
        return '<div class="pu-bloco"><h3>' + saEsc(s.label) + '</h3>' + (s.help ? '<p>' + saEsc(s.help) + '</p>' : '') + '<div class="pu-marcas">'
          + (s.options || []).map(function (o) { return '<label class="pu-marca"><input type="radio" name="sa-sel-' + saEsc(s.id) + '" data-sa-valor="' + saEsc(s.id) + '" value="' + saEsc(o.id) + '"' + (st.valores[s.id] === o.id ? ' checked' : '') + '><span><strong>' + saEsc(o.label) + '</strong></span></label>'; }).join('') + '</div></div>';
      }).join('');
  } else if (id === 'processos') {
    el.innerHTML = '<div class="pu-bloco"><h3>Processos presentes no local</h3><p>Marque o que existe. Todas as verificações continuam no roteiro; as ligadas a processo não marcado aparecem com o aviso “Fora do perfil marcado”.</p><div class="pu-marcas">'
      + (cfg.profile.flags || []).map(function (f) { return '<label class="pu-marca"><input type="checkbox" data-sa-flag="' + saEsc(f.id) + '"' + (st.flags[f.id] ? ' checked' : '') + '><span><strong>' + saEsc(f.label) + '</strong></span></label>'; }).join('') + '</div></div>';
  }
}

function saRelatorio(el) {
  var total = 0, resp = 0, nc = 0, na = 0;
  (cfg.sections || []).forEach(function (s) { (s.items || []).forEach(function (i) { total++; var v = st.resp[i.id]; if (v) resp++; if (v === 'nao') nc++; if (v === 'na') na++; }); });
  var inf = Object.keys(st.inf || {}).length;
  el.innerHTML = '<div class="pu-bloco"><h3>Resumo da inspeção</h3><p>' + saEsc((saTipo() || {}).label || 'Tipo de serviço não escolhido') + (st.meta.establishment ? ' · ' + saEsc(st.meta.establishment) : '') + '</p>'
    + '<div class="pu-campos"><div class="pu-campo">Respondidas<b>' + resp + ' de ' + total + '</b></div><div class="pu-campo">Não cumpre<b>' + nc + '</b></div><div class="pu-campo">Não se aplica<b>' + na + '</b></div><div class="pu-campo">Infrações selecionadas<b>' + inf + '</b></div></div>'
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
  ['body > header', 'body > nav.abas', 'body > main'].forEach(function (q) { var n = document.querySelector(q); if (n) { n.hidden = true; n.setAttribute('data-pu-oculto', ''); } });
  var raiz = document.createElement('div'); raiz.id = 'pu-raiz'; document.body.insertBefore(raiz, document.body.firstChild);
  var semTipo = !st.tipo;
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
        if (!it || it.id === 'tipo') { st.tipo = ''; st.valores = {}; }
        if (!it || it.id === 'processos') st.flags = ini.flags;
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
    if ((b = e.target.closest('[data-sa-foto]'))) { saFoto(b.dataset.saFoto); return; }
    if ((b = e.target.closest('[data-sa-sem-foto]'))) { if (confirm('Remover a foto deste item?')) { if (st.fotos) delete st.fotos[b.dataset.saSemFoto]; salva(); saRedesenha(); } return; }
    if ((b = e.target.closest('[data-sa-na]'))) {
      var bl = saItemAberto(); if (!bl) return; var modo = b.dataset.saNa;
      (bl.items || []).forEach(function (q) {
        if (st.resp[q.id] && modo !== 'todos') return;
        if (modo === 'fora' && !saForaDoPerfil(q.when)) return;
        st.resp[q.id] = 'na';
      });
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
    if (t.dataset.saTipo) { st.tipo = t.dataset.saTipo; salva(); saRedesenha(); }
    else if (t.dataset.saValor) { st.valores[t.dataset.saValor] = t.value; salva(); UvisPadrao.atualiza(); }
    else if (t.dataset.saFlag) { st.flags[t.dataset.saFlag] = t.checked; salva(); UvisPadrao.atualiza(); }
    else if (t.dataset.saMeta) UvisPadrao.atualiza();
  });
}
