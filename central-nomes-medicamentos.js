/* Central de Consultas — busca leve por nome de medicamento, princípio ativo ou IFA.
   Não pesquisa empresas. A busca consulta apenas um fragmento por três letras e
   mostra listas da Portaria 344 somente quando o índice traz correspondência
   nominal confirmada. */
(() => {
  'use strict';
  if (window.__UVIS_CENTRAL_NOMES__) return;
  window.__UVIS_CENTRAL_NOMES__ = true;

  const BASE = 'https://uvisvp.github.io/base-vigilancia/dados';
  const LIMIT = 20;
  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = v => String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const compact = v => norm(v).replace(/\s/g, '');
  let timer = 0;
  let cacheManifest;

  function active() {
    const b = document.querySelector('.mode[data-uvis-nome-central="1"]');
    return !!(b && b.classList.contains('on'));
  }
  function setStatus(text, ok) {
    const el = $('status');
    if (el) { el.className = 'status' + (ok ? ' ok' : ''); el.textContent = text || ''; }
  }
  function clearDetect() { const el = $('detect'); if (el) el.innerHTML = ''; }
  function activate() {
    try { setMode('registro'); } catch (_) {}
    document.querySelectorAll('.mode').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
    const b = document.querySelector('.mode[data-uvis-nome-central="1"]');
    if (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
    const q = $('q');
    if (q) { q.value = ''; q.inputMode = 'search'; q.placeholder = 'Digite 3 ou mais letras do medicamento, princípio ativo ou IFA'; q.focus(); }
    clearDetect();
    const host = $('results');
    if (host) host.innerHTML = '<div class="empty"><b>Busca por nome</b><br>Pesquise medicamento, princípio ativo ou IFA. Empresas não entram nesta busca.</div>';
    setStatus('A busca começa a partir de três letras e consulta somente o fragmento necessário da base.', false);
  }
  function install() {
    if (document.querySelector('.mode[data-uvis-nome-central="1"]')) return;
    const modes = document.querySelectorAll('.mode');
    if (!modes.length) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'mode'; b.textContent = 'Nome';
    b.setAttribute('data-mode', 'uvis-nome'); b.setAttribute('data-uvis-nome-central', '1'); b.setAttribute('aria-pressed', 'false');
    b.title = 'Medicamento, princípio ativo ou IFA';
    b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); activate(); });
    const ifa = document.querySelector('.mode[data-mode="ifa"]');
    (ifa ? ifa.parentElement : modes[modes.length - 1].parentElement).insertBefore(b, ifa || null);
  }
  function listText(item) {
    const ls = Array.isArray(item.listas_portaria344) ? item.listas_portaria344 : [];
    if (!ls.length) return '<b>Portaria SVS/MS nº 344/1998</b><span>Lista não identificada na base por correspondência nominal exata.</span>';
    return '<b>Portaria SVS/MS nº 344/1998 — correspondência nominal</b><span>' + ls.map(x => esc(x.lista + ' — ' + x.substancia)).join('<br>') + '</span>';
  }
  function medCard(x, button) {
    const rows = [
      ['Princípio ativo', x.principio_ativo], ['Registro', x.registro], ['Processo', x.processo],
      ['Situação', x.situacao], ['Classe terapêutica', x.classe_terapeutica],
      ['Portaria / lista', '']
    ];
    const kv = rows.filter(r => r[0] === 'Portaria / lista' || r[1]).map(r => r[0] === 'Portaria / lista' ? listText(x) : '<b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span>').join('');
    return '<article class="result"' + (button ? '><button type="button" class="uvis-name-result" data-uvis-name-key="' + esc(button) + '">' : '>') + '<h4>' + esc(x.produto || 'Medicamento') + '</h4><div class="kv">' + kv + '</div>' + (button ? '</button>' : '') + '</article>';
  }
  function ifaCard(x, button) {
    const rows = [
      ['Fabricante do IFA', x.fabricante_ifa], ['Código do fabricante', x.codigo_fabricante_ifa],
      ['Processo Anvisa (IFA)', x.processo_anvisa], ['Detentor / peticionante', x.detentor_peticionante],
      ['Portaria / lista', '']
    ];
    const kv = rows.filter(r => r[0] === 'Portaria / lista' || r[1]).map(r => r[0] === 'Portaria / lista' ? listText(x) : '<b>' + esc(r[0]) + '</b><span>' + esc(r[1]) + '</span>').join('');
    return '<article class="result"' + (button ? '><button type="button" class="uvis-name-result" data-uvis-name-key="' + esc(button) + '">' : '>') + '<h4>IFA · ' + esc(x.ifa || 'Insumo farmacêutico ativo') + '</h4><div class="kv">' + kv + '</div>' + (button ? '</button>' : '') + '</article>';
  }
  async function manifest() {
    if (!cacheManifest) cacheManifest = fetch(BASE + '/indices/nome_medicamentos/manifest.json', {cache:'no-store'}).then(r => r.ok ? r.json() : null).catch(() => null);
    return cacheManifest;
  }
  function source(man) {
    const gerado = man && man.gerado_em ? ' Índice gerado em ' + esc(new Date(man.gerado_em).toLocaleString('pt-BR')) + '.' : '';
    return '<details class="sub-base"><summary>Fonte e atualização</summary><div class="sub-body"><p><b>Medicamentos:</b> base pública DADOS_ABERTOS_MEDICAMENTOS.csv da Anvisa.</p><p><b>IFA:</b> TA_EXPORT_IFA.csv da Anvisa; o identificador exibido é Processo Anvisa, não registro de medicamento.</p><p><b>Portaria:</b> indicação apenas quando houver correspondência nominal confirmada na base local do Anexo I da Portaria SVS/MS nº 344/1998. Não substitui a conferência de adendos, forma, concentração ou condição de aplicação.</p><p>Empresas não são pesquisadas neste modo.' + gerado + '</p></div></details>';
  }
  function render(items, term, man) {
    const host = $('results'); if (!host) return;
    if (!items.length) {
      host.innerHTML = '<div class="empty"><b>Nenhum resultado por nome nesta base.</b><br>Isso não equivale à ausência de regularização. Tente outro início do nome, registro ou Processo Anvisa.</div>' + source(man);
      setStatus('Consulta por nome concluída sem resultado no índice.', true); return;
    }
    window.__UVIS_NOME_ITEMS__ = items;
    const html = '<div class="summary"><div class="sum"><b>' + items.length + '</b><span>resultado(s) por nome</span></div><div class="sum"><b>3+</b><span>letras para busca</span></div><div class="sum"><b>Manual</b><span>conferência sanitária</span></div></div>' +
      '<div class="group"><div class="grouphead"><h3>Medicamentos e IFA</h3><span>toque em um resultado para detalhar</span></div>' +
      items.map((x, i) => x.tipo === 'ifa' ? ifaCard(x, String(i)) : medCard(x, String(i))).join('') + '</div>' + source(man);
    host.innerHTML = html;
    setStatus('Consulta por nome concluída. Classe e lista são informativas; a aplicação regulatória é conferida pela equipe.', true);
  }
  function detail(key) {
    const x = (window.__UVIS_NOME_ITEMS__ || [])[Number(key)]; if (!x) return;
    const host = $('results'); if (!host) return;
    host.innerHTML = '<div class="toolbar"><button type="button" class="btn" data-uvis-name-back>← Voltar aos resultados</button></div>' + (x.tipo === 'ifa' ? ifaCard(x) : medCard(x)) + '<p class="muted">A classificação e a indicação de lista não constituem decisão automática. Confirme o documento e as condições aplicáveis.</p>';
  }
  async function search() {
    const q = $('q'); const raw = q ? q.value : ''; const n = compact(raw);
    if (n.length < 3) { clearDetect(); setStatus('Digite pelo menos três letras para pesquisar por nome.', false); return; }
    const host = $('results'); if (host) host.innerHTML = '<div class="empty">Buscando resultados…</div>';
    setStatus('Consultando o fragmento “' + n.slice(0, 3).toUpperCase() + '”…', false);
    try {
      const [r, man] = await Promise.all([fetch(BASE + '/indices/nome_medicamentos/' + n.slice(0, 3) + '.json', {cache:'no-store'}), manifest()]);
      if (!r.ok) throw new Error('índice indisponível (' + r.status + ')');
      const payload = await r.json();
      const seen = new Set();
      const items = (payload.registros || []).filter(x => compact(x.termo).startsWith(n)).filter(x => {
        const id = x.tipo === 'ifa' ? 'ifa|' + x.processo_anvisa : 'med|' + x.registro + '|' + x.processo;
        if (seen.has(id)) return false; seen.add(id); return true;
      }).slice(0, LIMIT);
      render(items, raw, man);
    } catch (err) {
      const host = $('results'); if (host) host.innerHTML = '<div class="empty"><b>Não foi possível consultar o índice por nome.</b><br>' + esc((err && err.message) || err) + '</div>';
      setStatus('Falha ao consultar o índice por nome.', false);
    }
  }
  document.addEventListener('input', e => {
    if (!active() || !e.target || e.target.id !== 'q') return;
    e.stopImmediatePropagation(); clearDetect(); clearTimeout(timer); timer = setTimeout(search, 260);
  }, true);
  document.addEventListener('keydown', e => {
    if (!active() || e.key !== 'Enter' || !e.target || e.target.id !== 'q') return;
    e.preventDefault(); e.stopImmediatePropagation(); clearTimeout(timer); search();
  }, true);
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target.closest('[data-uvis-name-key],[data-uvis-name-back],#search,.mode') : null;
    if (!t) return;
    if (t.matches('.mode') && t.getAttribute('data-uvis-nome-central') !== '1') { const b = document.querySelector('.mode[data-uvis-nome-central="1"]'); if (b) b.classList.remove('on'); return; }
    if (!active()) return;
    if (t.matches('#search')) { e.preventDefault(); e.stopImmediatePropagation(); clearTimeout(timer); search(); }
    else if (t.hasAttribute('data-uvis-name-key')) { e.preventDefault(); detail(t.getAttribute('data-uvis-name-key')); }
    else if (t.hasAttribute('data-uvis-name-back')) { e.preventDefault(); const q = $('q'); if (q) search(); }
  }, true);
  const css = document.createElement('style');
  css.textContent = '.uvis-name-result{display:block;width:100%;border:0;background:transparent;color:inherit;padding:0;text-align:left;font:inherit;cursor:pointer}.uvis-name-result:hover h4{text-decoration:underline}.uvis-name-result:focus-visible{outline:3px solid #1769a6;outline-offset:4px;border-radius:8px}.result .kv b{margin-top:7px}.result .kv b+span{display:block}.result .kv b:nth-last-child(2){margin-top:10px}';
  document.head.appendChild(css);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
  new MutationObserver(install).observe(document.documentElement, {childList:true, subtree:true});
})();
