/* Central de Consultas — buscas leves e separadas por nome de Medicamento e de IFA.
   Medicamentos: nome comercial, princípio ativo e componentes de associações.
   IFA: nome do insumo. Fragmentos grandes são roteados adaptativamente. */
(() => {
  'use strict';
  if (window.__UVIS_CENTRAL_NOMES__) return;
  window.__UVIS_CENTRAL_NOMES__ = true;

  const BASE = 'https://uvisvp.github.io/base-vigilancia/dados';
  const LIMIT = 20;
  const MODES = {
    medicamento: {
      rotulo: 'Medicamento',
      botao: 'Medicamento',
      pasta: 'indices/nome_medicamentos',
      placeholder: 'Digite 3 ou mais letras do medicamento ou princípio ativo',
      vazio: 'Pesquise por nome comercial, princípio ativo ou componente de uma associação.'
    },
    ifa: {
      rotulo: 'IFA',
      botao: 'IFA por nome',
      pasta: 'indices/nome_ifas',
      fallback: 'indices/nome_medicamentos',
      placeholder: 'Digite 3 ou mais letras do IFA',
      vazio: 'Pesquise pelo nome do insumo farmacêutico ativo.'
    }
  };

  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
  const norm = v => String(v == null ? '' : v)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const compact = v => norm(v).replace(/\s/g, '');

  let timer = 0;
  let filtroSituacao = 'todos';
  let ultimo = null;
  const manifests = {};

  function activeType() {
    const b = document.querySelector('.mode[data-uvis-nome-tipo].on');
    return b ? b.getAttribute('data-uvis-nome-tipo') : '';
  }

  function setStatus(text, ok) {
    const el = $('status');
    if (!el) return;
    el.className = 'status' + (ok ? ' ok' : '');
    el.textContent = text || '';
  }

  function clearDetect() {
    const el = $('detect');
    if (el) el.innerHTML = '';
  }

  function statusKind(valor) {
    const s = norm(valor);
    if (!s) return '';
    if (/^(ativo|ativa|valido|valida|vigente)\b/.test(s)) return 'ativo';
    if (/^(inativo|inativa|cancelado|cancelada|caducado|caducada)\b/.test(s)) return 'inativo';
    return '';
  }

  function statusChip(valor) {
    if (!valor) return '';
    const k = statusKind(valor);
    return '<span class="uvis-sit' + (k ? ' ' + k : '') + '">' + esc(valor) + '</span>';
  }

  function activate(tipo) {
    const cfg = MODES[tipo];
    if (!cfg) return;
    try { setMode('registro'); } catch (_) {}

    document.querySelectorAll('.mode').forEach(x => {
      x.classList.remove('on');
      x.setAttribute('aria-pressed', 'false');
    });
    const b = document.querySelector('.mode[data-uvis-nome-tipo="' + tipo + '"]');
    if (b) {
      b.classList.add('on');
      b.setAttribute('aria-pressed', 'true');
    }

    filtroSituacao = 'todos';
    ultimo = null;
    const q = $('q');
    if (q) {
      q.value = '';
      q.inputMode = 'search';
      q.placeholder = cfg.placeholder;
      q.focus();
    }
    clearDetect();

    const host = $('results');
    if (host) {
      host.innerHTML = '<div class="empty"><b>Busca por nome — ' + esc(cfg.rotulo) +
        '</b><br>' + esc(cfg.vazio) + '</div>';
    }
    setStatus('A busca começa a partir de três letras e consulta somente o fragmento necessário da base.', false);
  }

  function makeButton(tipo) {
    if (document.querySelector('.mode[data-uvis-nome-tipo="' + tipo + '"]')) return;
    const modes = document.querySelectorAll('.mode');
    if (!modes.length) return;

    const cfg = MODES[tipo];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mode';
    b.textContent = cfg.botao;
    b.setAttribute('data-mode', 'uvis-nome-' + tipo);
    b.setAttribute('data-uvis-nome-tipo', tipo);
    b.setAttribute('aria-pressed', 'false');
    b.title = tipo === 'medicamento'
      ? 'Buscar medicamento por nome comercial ou princípio ativo'
      : 'Buscar IFA pelo nome do insumo';
    b.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      activate(tipo);
    });

    const ifaNativo = document.querySelector('.mode[data-mode="ifa"]');
    const parent = ifaNativo ? ifaNativo.parentElement : modes[modes.length - 1].parentElement;
    parent.insertBefore(b, ifaNativo || null);
  }

  function install() {
    makeButton('medicamento');
    makeButton('ifa');
  }

  function listText(item) {
    const ls = Array.isArray(item.listas_portaria344) ? item.listas_portaria344 : [];
    if (!ls.length) {
      return '<b>Portaria SVS/MS nº 344/1998</b><span>Lista não identificada na base por correspondência nominal exata.</span>';
    }
    return '<b>Portaria SVS/MS nº 344/1998 — correspondência nominal</b><span>' +
      ls.map(x => esc(x.lista + ' — ' + x.substancia)).join('<br>') + '</span>';
  }

  function medCard(x, button) {
    const rows = [
      ['Princípio ativo', x.principio_ativo],
      ['Registro', x.registro],
      ['Processo', x.processo],
      ['Situação', x.situacao],
      ['Classe terapêutica', x.classe_terapeutica],
      ['Portaria / lista', '']
    ];
    const kv = rows
      .filter(r => r[0] === 'Portaria / lista' || r[1])
      .map(r => r[0] === 'Portaria / lista'
        ? listText(x)
        : '<b>' + esc(r[0]) + '</b><span>' +
          (r[0] === 'Situação' ? statusChip(r[1]) : esc(r[1])) + '</span>')
      .join('');

    const titulo = esc(x.produto || 'Medicamento') + (x.situacao ? ' ' + statusChip(x.situacao) : '');
    return '<article class="result"' +
      (button != null
        ? '><button type="button" class="uvis-name-result" data-uvis-name-key="' + esc(button) + '">'
        : '>') +
      '<h4>' + titulo + '</h4><div class="kv">' + kv + '</div>' +
      (button != null ? '</button>' : '') + '</article>';
  }

  function ifaCard(x, button) {
    const situacao = x.situacao || 'Não informada nesta base';
    const rows = [
      ['Situação', situacao],
      ['Fabricante do IFA', x.fabricante_ifa],
      ['Código do fabricante', x.codigo_fabricante_ifa],
      ['Processo Anvisa (IFA)', x.processo_anvisa],
      ['Detentor / peticionante', x.detentor_peticionante],
      ['Portaria / lista', '']
    ];
    const kv = rows
      .filter(r => r[0] === 'Portaria / lista' || r[1])
      .map(r => r[0] === 'Portaria / lista'
        ? listText(x)
        : '<b>' + esc(r[0]) + '</b><span>' +
          (r[0] === 'Situação' && x.situacao ? statusChip(r[1]) : esc(r[1])) + '</span>')
      .join('');

    const titulo = 'IFA · ' + esc(x.ifa || 'Insumo farmacêutico ativo') +
      (x.situacao ? ' ' + statusChip(x.situacao) : '');
    return '<article class="result"' +
      (button != null
        ? '><button type="button" class="uvis-name-result" data-uvis-name-key="' + esc(button) + '">'
        : '>') +
      '<h4>' + titulo + '</h4><div class="kv">' + kv + '</div>' +
      (button != null ? '</button>' : '') + '</article>';
  }

  async function manifest(tipo, pastaUsada) {
    const pasta = pastaUsada || MODES[tipo].pasta;
    const key = tipo + '|' + pasta;
    if (!manifests[key]) {
      manifests[key] = fetch(BASE + '/' + pasta + '/manifest.json', {cache:'no-store'})
        .then(r => r.ok ? r.json() : null)
        .catch(() => null);
    }
    return manifests[key];
  }

  async function obterJson(pasta, caminho) {
    const r = await fetch(BASE + '/' + pasta + '/' + caminho, {cache:'no-store'});
    if (!r.ok) throw new Error('índice indisponível (' + r.status + ')');
    return r.json();
  }

  async function fetchIndex(tipo, prefixo, termoCompacto) {
    const cfg = MODES[tipo];
    const pastas = [cfg.pasta];
    if (cfg.fallback) pastas.push(cfg.fallback);
    let last = null;

    for (const pasta of pastas) {
      try {
        let payload = await obterJson(pasta, prefixo + '.json');
        let passos = 0;

        while (payload && payload.subfragmentado && passos < 32) {
          const profundidade = Number(payload.profundidade);
          if (!Number.isFinite(profundidade) || termoCompacto.length <= profundidade) break;

          const caractere = termoCompacto.charAt(profundidade);
          const proximo = payload.fragmentos && payload.fragmentos[caractere];
          if (!proximo) break;

          payload = await obterJson(pasta, proximo);
          passos += 1;
        }
        return {payload, pasta, passos};
      } catch (e) {
        last = e;
      }
    }
    throw last || new Error('índice indisponível');
  }

  function source(tipo, man, pastaUsada) {
    const gerado = man && man.gerado_em
      ? ' Índice gerado em ' + esc(new Date(man.gerado_em).toLocaleString('pt-BR')) + '.'
      : '';

    if (tipo === 'medicamento') {
      return '<details class="sub-base"><summary>Fonte e atualização</summary><div class="sub-body">' +
        '<p><b>Medicamentos:</b> base pública DADOS_ABERTOS_MEDICAMENTOS.csv da Anvisa.</p>' +
        '<p><b>Busca:</b> nome do produto, princípio ativo completo e cada componente nominal das associações.</p>' +
        '<p><b>Situação:</b> Ativo/Inativo conforme o campo publicado na base de medicamentos.</p>' +
        '<p><b>Desempenho:</b> índices grandes são subdivididos automaticamente; a Central baixa somente o ramo necessário.</p>' +
        '<p><b>Portaria:</b> indicação somente por correspondência nominal confirmada na base local do Anexo I da Portaria SVS/MS nº 344/1998.</p>' +
        '<p>Empresas não são pesquisadas neste modo.' + gerado + '</p></div></details>';
    }

    const situacao = man && man.situacao_disponivel;
    const transicao = pastaUsada === MODES.ifa.fallback
      ? '<p><b>Transição:</b> usando temporariamente o índice anterior até a publicação do índice separado de IFA.</p>'
      : '';
    return '<details class="sub-base"><summary>Fonte e atualização</summary><div class="sub-body">' +
      '<p><b>IFA:</b> TA_EXPORT_IFA.csv da Anvisa; o identificador exibido é Processo Anvisa, não registro de medicamento.</p>' +
      '<p><b>Situação:</b> ' +
      (situacao
        ? 'exibida somente quando publicada pela fonte.'
        : 'a exportação usada nesta visão não informa situação regulatória; o sistema não infere Ativo/Inativo.') +
      '</p>' +
      '<p><b>Desempenho:</b> índices grandes são subdivididos automaticamente; a Central baixa somente o ramo necessário.</p>' +
      '<p><b>Portaria:</b> indicação somente por correspondência nominal confirmada. Não substitui a conferência das condições de aplicação.</p>' +
      transicao +
      '<p>Ausência no índice não prova ausência de regularização por outra via.' + gerado + '</p></div></details>';
  }

  function filterBar(items, tipo) {
    const comSituacao = items.some(x => !!statusKind(x.situacao));
    const desabilitar = tipo === 'ifa' && !comSituacao;
    const mk = (valor, texto) =>
      '<button type="button" class="uvis-status-filter' +
      (filtroSituacao === valor ? ' on' : '') +
      '" data-uvis-status="' + valor + '"' +
      (valor !== 'todos' && desabilitar ? ' disabled aria-disabled="true"' : '') +
      '>' + texto + '</button>';

    return '<div class="uvis-status-row"><span><b>Situação</b></span>' +
      mk('todos', 'Todos') + mk('ativo', 'Ativos') + mk('inativo', 'Inativos') +
      (desabilitar ? '<small>Ativo/Inativo não é informado pela fonte IFA atual.</small>' : '') +
      '</div>';
  }

  function applyStatus(items) {
    if (filtroSituacao === 'todos') return items;
    return items.filter(x => statusKind(x.situacao) === filtroSituacao);
  }

  function render(items, term, man, tipo, pastaUsada) {
    const host = $('results');
    if (!host) return;

    ultimo = {items, term, man, tipo, pastaUsada};
    const filtrados = applyStatus(items);
    const exibidos = filtrados.slice(0, LIMIT);
    window.__UVIS_NOME_ITEMS__ = exibidos;

    const filtro = filterBar(items, tipo);
    if (!items.length) {
      host.innerHTML = filtro +
        '<div class="empty"><b>Nenhum resultado por nome nesta base.</b><br>' +
        'Isso não equivale à ausência de regularização. Tente outro início do nome ou outro modo de consulta.</div>' +
        source(tipo, man, pastaUsada);
      setStatus('Consulta por nome concluída sem resultado no índice.', true);
      return;
    }

    if (!exibidos.length) {
      host.innerHTML = filtro +
        '<div class="empty"><b>Nenhum resultado com este filtro de situação.</b><br>' +
        'Altere para Todos, Ativos ou Inativos.</div>' +
        source(tipo, man, pastaUsada);
      setStatus('Há resultados por nome, mas nenhum corresponde ao filtro de situação.', true);
      return;
    }

    const cfg = MODES[tipo];
    host.innerHTML =
      filtro +
      '<div class="summary"><div class="sum"><b>' + exibidos.length + '</b><span>resultado(s) exibido(s)</span></div>' +
      '<div class="sum"><b>' + items.length + '</b><span>correspondência(s) carregada(s)</span></div>' +
      '<div class="sum"><b>3+</b><span>letras para busca</span></div></div>' +
      '<div class="group"><div class="grouphead"><h3>' + esc(cfg.rotulo) +
      '</h3><span>toque em um resultado para detalhar</span></div>' +
      exibidos.map((x, i) => tipo === 'ifa' ? ifaCard(x, String(i)) : medCard(x, String(i))).join('') +
      '</div>' + source(tipo, man, pastaUsada);

    setStatus(
      tipo === 'medicamento'
        ? 'Consulta de medicamentos concluída. Associações podem ser encontradas por qualquer componente indexado.'
        : 'Consulta de IFA concluída. A situação só é mostrada quando publicada pela fonte.',
      true
    );
  }

  function rerender() {
    if (!ultimo) return;
    render(ultimo.items, ultimo.term, ultimo.man, ultimo.tipo, ultimo.pastaUsada);
  }

  function detail(key) {
    const x = (window.__UVIS_NOME_ITEMS__ || [])[Number(key)];
    if (!x) return;
    const tipo = activeType();
    const host = $('results');
    if (!host) return;

    host.innerHTML =
      '<div class="toolbar"><button type="button" class="btn" data-uvis-name-back>← Voltar aos resultados</button></div>' +
      (tipo === 'ifa' ? ifaCard(x) : medCard(x)) +
      '<p class="muted">As classificações exibidas são informativas. Confirme a fonte e as condições regulatórias aplicáveis.</p>';
  }

  async function search() {
    const tipo = activeType();
    if (!MODES[tipo]) return;

    const q = $('q');
    const raw = q ? q.value : '';
    const n = compact(raw);
    if (n.length < 3) {
      clearDetect();
      setStatus('Digite pelo menos três letras para pesquisar por nome.', false);
      return;
    }

    const host = $('results');
    if (host) host.innerHTML = '<div class="empty">Buscando resultados…</div>';
    setStatus('Consultando o fragmento “' + n.slice(0, 3).toUpperCase() + '”…', false);

    try {
      const achado = await fetchIndex(tipo, n.slice(0, 3), n);
      const man = await manifest(tipo, achado.pasta);
      const seen = new Set();
      const items = (achado.payload.registros || [])
        .filter(x => x.tipo === tipo)
        .filter(x => compact(x.termo).startsWith(n))
        .filter(x => {
          const id = tipo === 'ifa'
            ? 'ifa|' + x.processo_anvisa + '|' + x.ifa + '|' + x.fabricante_ifa
            : 'med|' + x.registro + '|' + x.processo;
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });

      /* A exportação pública de IFA da Anvisa tem poucos registros: sem resultado,
         mostra os medicamentos registrados com esse princípio ativo. */
      if (tipo === 'ifa' && !items.length) {
        try {
          const alt = await fetchIndex('medicamento', n.slice(0, 3), n);
          const vistos = new Set();
          const meds = (alt.payload.registros || [])
            .filter(x => x.tipo === 'medicamento' && compact(x.termo).startsWith(n))
            .filter(x => { const id = x.registro + '|' + x.processo; if (vistos.has(id)) return false; vistos.add(id); return true; });
          if (meds.length) {
            render(meds, raw, await manifest('medicamento', alt.pasta), 'medicamento', alt.pasta);
            const h = $('results');
            if (h) h.insertAdjacentHTML('afterbegin', '<div class="empty">A base pública de IFA da Anvisa tem poucos registros e não localizou “' + esc(raw) + '”. Abaixo, os medicamentos registrados com este princípio ativo.</div>');
            return;
          }
        } catch (e) { /* segue para a mensagem padrão */ }
      }
      render(items, raw, man, tipo, achado.pasta);
    } catch (err) {
      if (host) {
        host.innerHTML = '<div class="empty"><b>Não foi possível consultar o índice por nome.</b><br>' +
          esc((err && err.message) || err) + '</div>';
      }
      setStatus('Falha ao consultar o índice por nome.', false);
    }
  }

  document.addEventListener('input', e => {
    if (!activeType() || !e.target || e.target.id !== 'q') return;
    e.stopImmediatePropagation();
    clearDetect();
    clearTimeout(timer);
    timer = setTimeout(search, 260);
  }, true);

  document.addEventListener('keydown', e => {
    if (!activeType() || e.key !== 'Enter' || !e.target || e.target.id !== 'q') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    clearTimeout(timer);
    search();
  }, true);

  document.addEventListener('click', e => {
    const t = e.target && e.target.closest
      ? e.target.closest('[data-uvis-name-key],[data-uvis-name-back],[data-uvis-status],#search,.mode')
      : null;
    if (!t) return;

    if (t.matches('.mode') && !t.hasAttribute('data-uvis-nome-tipo')) {
      document.querySelectorAll('.mode[data-uvis-nome-tipo]').forEach(b => b.classList.remove('on'));
      return;
    }
    if (!activeType()) return;

    if (t.matches('#search')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      clearTimeout(timer);
      search();
    } else if (t.hasAttribute('data-uvis-name-key')) {
      e.preventDefault();
      detail(t.getAttribute('data-uvis-name-key'));
    } else if (t.hasAttribute('data-uvis-name-back')) {
      e.preventDefault();
      rerender();
    } else if (t.hasAttribute('data-uvis-status') && !t.disabled) {
      e.preventDefault();
      filtroSituacao = t.getAttribute('data-uvis-status') || 'todos';
      rerender();
    }
  }, true);

  const css = document.createElement('style');
  css.textContent =
    '.uvis-name-result{display:block;width:100%;border:0;background:transparent;color:inherit;padding:0;text-align:left;font:inherit;cursor:pointer}' +
    '.uvis-name-result:hover h4{text-decoration:underline}' +
    '.uvis-name-result:focus-visible{outline:3px solid #1769a6;outline-offset:4px;border-radius:8px}' +
    '.result .kv b{margin-top:7px}.result .kv b+span{display:block}' +
    '.uvis-status-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 14px;padding:10px 12px;border:1px solid #d7dce2;border-radius:10px;background:#fff}' +
    '.uvis-status-row small{flex-basis:100%;color:#5d6670}' +
    '.uvis-status-filter{border:1px solid #aeb8c3;border-radius:999px;background:#fff;padding:6px 11px;font:inherit;cursor:pointer}' +
    '.uvis-status-filter.on{font-weight:700;border-color:#1769a6;box-shadow:0 0 0 1px #1769a6 inset}' +
    '.uvis-status-filter:disabled{opacity:.45;cursor:not-allowed}' +
    '.uvis-sit{display:inline-block;margin-left:6px;padding:2px 7px;border-radius:999px;border:1px solid currentColor;font-size:.78em;font-weight:700;vertical-align:middle}' +
    '.uvis-sit.ativo{color:#176b36}.uvis-sit.inativo{color:#9a2f2f}';
  document.head.appendChild(css);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  new MutationObserver(install).observe(document.documentElement, {childList:true, subtree:true});
})();
