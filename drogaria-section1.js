/* Ponte de integração — Drogaria / Seção 1.
 * Carregada somente dentro do módulo Drogaria. Não altera outras seções. */
(() => {
  'use strict';
  if (window.DrogariaSection1) return;

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const clean = value => String(value == null ? '' : value).trim();
  const human = key => ({
    numero_cevs_ou_cmvs: 'Número CEVS / CMVS', validade: 'Validade', cnae: 'CNAE', atividade_economica: 'Atividade econômica', razao_social: 'Razão social', nome_fantasia: 'Nome fantasia', cnpj: 'CNPJ', endereco: 'Endereço', numero: 'Número', bairro: 'Bairro', municipio: 'Município', cep: 'CEP', estado: 'Estado', responsavel_legal: 'Responsável legal', cpf_responsavel_legal: 'CPF do responsável legal', responsavel_tecnico: 'Responsável técnico', numero_conselho_responsavel_tecnico: 'Número do conselho', responsavel_tecnico_substituto: 'Responsável técnico substituto', numero_conselho_responsavel_tecnico_substituto: 'Número do conselho do substituto', numero_certidao: 'Número da certidão', ramo_atividade: 'Ramo de atividade', rotina: 'Rotina', data_emissao: 'Data de emissão', tipo: 'Tipo de ASO', nome_funcionario: 'Nome do funcionário', empresa_responsavel: 'Empresa responsável', medico_assinante: 'Médico assinante'
  }[key] || key.replaceAll('_', ' '));
  const now = () => new Date().toISOString();
  const cite = (ref, label) => '<button type="button" class="cite" data-law="' + esc(ref) + '">' + esc(label) + '</button>';

  function api() { return window.DrogariaAPI; }
  function current() { return api().getState(); }
  function cloneState() { return structuredClone(current()); }
  function save(mutator, render = true) { const state = cloneState(); mutator(state); api().setState(state, {render}); }
  function input(path, label, value, type = 'text', extra = '') {
    return '<label class="field"><span>' + esc(label) + '</span><input data-s1-path="' + esc(path) + '" type="' + type + '" value="' + esc(value) + '" ' + extra + '></label>';
  }
  function select(path, label, value, options) {
    return '<label class="field"><span>' + esc(label) + '</span><select data-s1-path="' + esc(path) + '">' + options.map(option => '<option value="' + esc(option) + '"' + (value === option ? ' selected' : '') + '>' + esc(option === 'sim' ? 'Sim' : option === 'nao' ? 'Não' : option) + '</option>').join('') + '</select></label>';
  }
  function writePath(state, path, value) {
    const parts = path.split('.'); let target = state;
    for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]] ||= {};
    target[parts.at(-1)] = value;
  }
  function docs(state) { return state.meta.section1_documentos ||= []; }
  function replaceDocument(state, document) {
    const list = docs(state); const at = list.findIndex(item => item.kind === document.kind && (document.kind !== 'aso' || item.id === document.id));
    if (at >= 0) list[at] = document; else list.push(document);
  }
  function activities(raw) {
    return [...new Set(String(raw || '').split(/[;\n•]+/).map(clean).filter(item => item.length > 2))];
  }
  function selectedActivities(state) { return state.fields.atividades_licenciadas || []; }
  function documentList(state) {
    const list = docs(state); if (!list.length) return '<p class="muted">Nenhum documento foi lido nesta seção.</p>';
    return '<ul class="s1-doc-list">' + list.map(item => '<li><b>' + esc(item.title) + '</b>' + (item.fields?.nome_funcionario ? ' — ' + esc(item.fields.nome_funcionario) : '') + '<button type="button" data-s1-edit-doc="' + esc(item.id) + '">Conferir / editar</button><button type="button" data-s1-remove-doc="' + esc(item.id) + '" aria-label="Remover documento">Remover</button></li>').join('') + '</ul>';
  }

  function cardMarkup() {
    const state = current(), meta = state.meta || {}, licensed = activities(meta.atividade_licenciada || meta.cnae_atividade || '');
    const vaccine = state.answers?.vaccine || '', eac = state.answers?.eac || '';
    const asoList = docs(state).filter(item => item.kind === 'aso');
    return '<div class="panel s1-panel">'
      + '<div class="subbar"><span class="badge">Seção 1 de 8</span><button data-action="home">Todas as seções</button></div>'
      + '<h2>Dados da inspeção</h2>'
      + '<section class="box"><h3>Identificação do estabelecimento</h3>'
      + '<p class="muted">Os dados podem ser digitados ou conferidos após a leitura da licença sanitária e a consulta por CNPJ na base Anvisa.</p>'
      + '<div class="actions s1-actions"><button type="button" data-s1-read="licenca_sanitaria">Ler dados da licença sanitária</button><button type="button" data-s1-anvisa>Consultar dados Anvisa pelo CNPJ</button></div>'
      + '<p class="s1-citations">' + cite('rdc-44-2009::artigo::2::inciso::iii', 'RDC 44/2009, art. 2º, III') + '</p>'
      + '<div class="grid">'
      + input('meta.cnpj', 'CNPJ', meta.cnpj || '', 'text', 'inputmode="numeric" maxlength="18"')
      + input('meta.razao', 'Razão social', meta.razao || '') + input('meta.fantasia', 'Nome fantasia', meta.fantasia || '')
      + input('meta.endereco', 'Endereço', meta.endereco || '') + input('meta.endereco_numero', 'Número', meta.endereco_numero || '') + input('meta.bairro', 'Bairro', meta.bairro || '')
      + input('meta.municipio', 'Município', meta.municipio || '') + input('meta.cep', 'CEP', meta.cep || '') + input('meta.estado', 'Estado', meta.estado || '')
      + input('meta.cevs', 'Licença sanitária / CEVS ou CMVS', meta.cevs || '') + input('meta.lic_validade', 'Validade da licença', meta.lic_validade || '', 'date')
      + input('meta.cnae', 'CNAE', meta.cnae || '') + input('meta.afe', 'AFE', meta.afe || '') + input('meta.ae', 'AE', meta.ae || '')
      + '</div>'
      + '<h4>Atividades autorizadas pela Anvisa</h4><p>' + esc((meta.atividades_autorizadas || []).join('; ') || 'Não consultadas') + '</p>'
      + '<h4>Atividades licenciadas</h4><p class="muted">Confira as atividades reconhecidas na licença sanitária antes de selecioná-las.</p><p class="s1-citations">' + cite('rdc-44-2009::artigo::90', 'RDC 44/2009, art. 90') + '</p>'
      + '<label class="field"><span>Atividades constantes da licença (uma por linha)</span><textarea data-s1-path="meta.atividade_licenciada" rows="3">' + esc(meta.atividade_licenciada || '') + '</textarea></label>'
      + '<div class="check-list s1-activities">' + (licensed.length ? licensed.map(item => '<label class="check"><input type="checkbox" data-s1-activity="' + esc(item) + '"' + (selectedActivities(state).includes(item) ? ' checked' : '') + '><span>' + esc(item) + '</span></label>').join('') : '<p class="muted">A leitura da licença acrescentará as atividades para conferência.</p>') + '</div>'
      + '</section>'
      + '<section class="box"><h3>Dados da inspeção</h3><div class="grid three">'
      + input('meta.data', 'Data da inspeção', meta.data || '', 'date') + input('meta.processo', 'Protocolo SEI / solicitação', meta.processo || '')
      + select('meta.finalidade', 'Objetivo da inspeção', meta.finalidade || '', ['', 'Inspeção inicial para atendimento de solicitação de licença sanitária protocolada no SEI', 'Solicitação de ampliação de atividades', 'Renovação de licença sanitária', 'Atendimento a denúncias', 'Monitoramento', 'Reinspeção'])
      + input('meta.inicio','Início',meta.inicio || '', 'time') + input('meta.fim','Término',meta.fim || '', 'time') + input('meta.equipe','Equipe inspetora',meta.equipe || '') + input('meta.acompanhante','Pessoa contatada',meta.acompanhante || '') + input('meta.cargo','Cargo / função',meta.cargo || '')
      + input('meta.ultima_inspecao_periodo', 'Período da última inspeção', meta.ultima_inspecao_periodo || '')
      + '</div></section>'
      + '<section class="box"><h3>Atividades com licenciamento específico</h3>'
      + '<div class="grid">' + select('answers.vaccine', 'Realiza serviço de vacinação?', vaccine, ['', 'nao', 'sim']) + select('answers.eac', 'Executa Exames de Análises Clínicas (EAC)?', eac, ['', 'nao', 'sim']) + '</div>'
      + (vaccine === 'sim' ? '<div class="actions s1-actions"><button type="button" data-s1-special-license="vacinacao">Ler licença sanitária da vacinação</button></div>' + select('answers.vaccine_licensed', 'Possui licença sanitária específica para vacinação?', state.answers?.vaccine_licensed || '', ['', 'nao', 'sim']) : '')
      + (eac === 'sim' ? '<div class="actions s1-actions"><button type="button" data-s1-special-license="eac">Ler licença sanitária de EAC</button></div>' + select('answers.eac_licensed', 'Possui licença sanitária específica para EAC?', state.answers?.eac_licensed || '', ['', 'nao', 'sim']) : '')
      + '<p class="muted">Quando a atividade não é oferecida, ela não será descrita no relatório. Quando é oferecida sem licença específica, o registro permanece como não conformidade para a revisão do relatório.</p>'
      + '</section>'
      + '<section class="box"><h3>Considerações gerais</h3><p class="muted">Trata-se de um comércio varejista de produtos farmacêuticos sem manipulação de fórmulas (CNAE 4771-7/01).</p>'
      + '<div class="actions s1-actions"><button type="button" data-s1-read="certidao_regularidade_crf">Ler Certidão de Regularidade Técnica — CRF</button><button type="button" data-s1-read="aso">+ Adicionar ASO</button></div>'
      + '<p class="s1-citations">' + cite('rdc-44-2009::artigo::2::inciso::iv', 'RDC 44/2009, art. 2º, IV') + '</p>'
      + '<div class="grid">' + input('meta.horario_funcionamento', 'Horário de funcionamento', meta.horario_funcionamento || '') + input('meta.resp_legal', 'Responsável legal', meta.resp_legal || '') + input('meta.rt', 'Responsável técnico', meta.rt || '') + input('meta.crf', 'CRF / UF', meta.crf || '') + input('meta.substituto', 'Responsável técnico substituto / CRF', meta.substituto || '') + '</div>'
      + '<div class="grid">' + input('meta.cpf_resp_legal','CPF do responsável legal',meta.cpf_resp_legal || '') + input('meta.substituto_crf','CRF do substituto',meta.substituto_crf || '') + input('meta.funcionarios','Número de funcionários',meta.funcionarios || '', 'number') + input('meta.farmaceuticos','Número de farmacêuticos',meta.farmaceuticos || '', 'number') + '</div>'
      + api().questions(['doc_lfs','doc_crt','lic_match','rt_present','team_id','doc_aso','alteracao_estrutural','access_ind'])
      + '<label class="field"><span>Considerações gerais</span><textarea data-s1-path="meta.consideracoes_gerais" rows="4">' + esc(meta.consideracoes_gerais || '') + '</textarea></label>'
      + (asoList.length ? '<p class="muted">ASOs adicionados: ' + asoList.length + '.</p>' : '')
      + '</section>'
      + '<section class="box"><h3>Documentos lidos nesta seção</h3>' + documentList(state) + '</section>'
      + '</div>';
  }

  function ensureDialog() {
    let dialog = document.getElementById('drogaria-section1-dialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog'); dialog.id = 'drogaria-section1-dialog'; dialog.className = 'med-tools-dialog'; document.body.append(dialog); return dialog;
  }
  function closeDialog() { const dialog = document.getElementById('drogaria-section1-dialog'); if (dialog?.open) dialog.close(); }
  function reviewDocument(type, specialLicense, existingId) {
    const existing = docs(current()).find(d => d.id === existingId);
    window.DrogariaReview.read({type, existing, onApply: result => applyDocument(type,result,specialLicense,existingId)});
  }
  function applyDocument(type, result, specialLicense, existingId) {
    save(state => {
      const f = result.fields, docKind = specialLicense ? 'licenca_' + specialLicense : type, document = { id: existingId || (type === 'aso' ? 'aso_' + Date.now().toString(36) : docKind), kind: type === 'aso' ? 'aso' : docKind, title: specialLicense ? 'Licença sanitária — ' + (specialLicense === 'vacinacao' ? 'vacinação' : 'EAC') : result.documentTitle, fields: f, rawText: result.rawText, source: result.source, includeInReport: result.includeInReport !== false, readAt: now() };
      if (result.includeInReport === false) { replaceDocument(state,document); return; }
      if (specialLicense) {
        state.meta.licencas_especificas ||= {};
        state.meta.licencas_especificas[specialLicense] = { campos: f, texto: result.rawText, arquivo: result.source?.filename || '', lido_em: result.source?.readAt || now() };

      } else if (type === 'licenca_sanitaria') {
        Object.assign(state.meta, { cevs: f.numero_cevs_ou_cmvs || state.meta.cevs, lic_validade: f.validade || state.meta.lic_validade, cnae: f.cnae || state.meta.cnae, atividade_licenciada: f.atividade_economica || state.meta.atividade_licenciada, razao: f.razao_social || state.meta.razao, fantasia: f.nome_fantasia || state.meta.fantasia, cnpj: f.cnpj || state.meta.cnpj, endereco: f.endereco || state.meta.endereco, endereco_numero: f.numero || state.meta.endereco_numero, bairro: f.bairro || state.meta.bairro, municipio: f.municipio || state.meta.municipio, cep: f.cep || state.meta.cep, estado: f.estado || state.meta.estado, resp_legal: f.responsavel_legal || state.meta.resp_legal, cpf_resp_legal: f.cpf_responsavel_legal || state.meta.cpf_resp_legal, substituto_crf: f.numero_conselho_responsavel_tecnico_substituto || state.meta.substituto_crf, rt: f.responsavel_tecnico || state.meta.rt, crf: f.numero_conselho_responsavel_tecnico || state.meta.crf, substituto: f.responsavel_tecnico_substituto || state.meta.substituto });
        state.fields.atividades_licenciadas = activities(f.atividade_economica || state.meta.atividade_licenciada);

        state.evidence.doc_lfs = { ...(state.evidence.doc_lfs || {}), campos: f, texto: result.rawText, arquivo: result.source?.filename || '', metodo: result.source?.method || '', lido_em: result.source?.readAt || now() };
      }
      if (type === 'certidao_regularidade_crf') { Object.assign(state.meta, { crt: f.numero_certidao || state.meta.crt, rt: f.responsavel_tecnico || state.meta.rt, crf: f.numero_conselho_responsavel_tecnico || state.meta.crf, crt_emissao: f.data_emissao || state.meta.crt_emissao, ramo_atividade_crt: f.ramo_atividade || state.meta.ramo_atividade_crt, rotina_crt: f.rotina || state.meta.rotina_crt, horario_funcionamento: f.rotina || state.meta.horario_funcionamento }); state.evidence.doc_crt = { ...(state.evidence.doc_crt || {}), campos: f, texto: result.rawText, arquivo: result.source?.filename || '', metodo: result.source?.method || '', lido_em: result.source?.readAt || now() }; }
      replaceDocument(state, document);
    });
  }
  async function reviewAnvisa() {
    const cnpj = current().meta?.cnpj || ''; if (!cnpj) { alert('Informe o CNPJ antes da consulta Anvisa.'); return; }
    const dialog = ensureDialog(); dialog.innerHTML = '<header><h2>Dados Anvisa</h2><button type="button" data-s1-close>Fechar ×</button></header><div class="med-tools-body"><p data-s1-status>Consultando a base Anvisa…</p><div data-s1-anvisa-result></div></div>'; dialog.querySelector('[data-s1-close]').onclick = closeDialog; dialog.showModal();
    try {
      const result = await window.DrogariaOcrTools.anvisa.empresa(cnpj), host = dialog.querySelector('[data-s1-anvisa-result]');
      const activitiesFound = result.atividades || [];
      host.innerHTML = '<div class="grid"><label class="med-field">Razão social<input data-s1-anvisa-razao value="' + esc(result.razao_social) + '"></label><label class="med-field">AFE<input data-s1-anvisa-afe value="' + esc((result.numero_afe || []).join(' / ')) + '"></label><label class="med-field">AE<input data-s1-anvisa-ae value="' + esc((result.numero_ae || []).join(' / ')) + '"></label></div><h3>Atividades autorizadas</h3><div class="check-list">' + (activitiesFound.length ? activitiesFound.map(item => '<label class="check"><input type="checkbox" data-s1-anvisa-activity="' + esc(item) + '" checked><span>' + esc(item) + '</span></label>').join('') : '<p>Nenhuma atividade foi localizada.</p>') + '</div><button type="button" class="primary" data-s1-apply-anvisa>Aplicar dados conferidos</button>';
      dialog.querySelector('[data-s1-status]').textContent = 'Confira antes de aplicar.';
      host.querySelector('[data-s1-apply-anvisa]').onclick = () => { const picks = [...host.querySelectorAll('[data-s1-anvisa-activity]:checked')].map(input => input.dataset.s1AnvisaActivity); save(state => { state.meta.razao = host.querySelector('[data-s1-anvisa-razao]').value.trim() || state.meta.razao; state.meta.afe = host.querySelector('[data-s1-anvisa-afe]').value.trim(); state.meta.ae = host.querySelector('[data-s1-anvisa-ae]').value.trim(); state.meta.atividades_autorizadas = picks; state.meta.anvisa_consulta = {source:result.source,queriedAt:result.queriedAt,cnpj:result.cnpj}; }); closeDialog(); };
    } catch (error) { dialog.querySelector('[data-s1-status]').textContent = error.message; }
  }
  function installEvents() {
    document.addEventListener('input', event => { const field=event.target.closest('input[data-s1-path],textarea[data-s1-path]'); if(field)save(state=>writePath(state,field.dataset.s1Path,field.value),false); });
    document.addEventListener('change', event => {
      const field = event.target.closest('select[data-s1-path]'); if (field) save(state => writePath(state, field.dataset.s1Path, field.value));
      const activity = event.target.closest('[data-s1-activity]'); if (activity) save(state => { const set = new Set(selectedActivities(state)); activity.checked ? set.add(activity.dataset.s1Activity) : set.delete(activity.dataset.s1Activity); state.fields.atividades_licenciadas = [...set]; });
    });
    document.addEventListener('click', event => {
      const read = event.target.closest('[data-s1-read]'); if (read) { reviewDocument(read.dataset.s1Read); return; }
      const special = event.target.closest('[data-s1-special-license]'); if (special) { reviewDocument('licenca_sanitaria', special.dataset.s1SpecialLicense); return; }
      if (event.target.closest('[data-s1-anvisa]')) { reviewAnvisa(); return; }
      const edit=event.target.closest('[data-s1-edit-doc]'); if(edit){const d=docs(current()).find(x=>x.id===edit.dataset.s1EditDoc);if(d)reviewDocument(d.kind.startsWith('licenca_')?'licenca_sanitaria':d.kind,d.kind==='licenca_vacinacao'?'vacinacao':d.kind==='licenca_eac'?'eac':undefined,d.id);return;}
      const remove = event.target.closest('[data-s1-remove-doc]'); if (remove) save(state => state.meta.section1_documentos = docs(state).filter(item => item.id !== remove.dataset.s1RemoveDoc));
    });
  }
  function mount() {
    if (!api() || !window.DrogariaOcrTools) return false;
    const badge = [...document.querySelectorAll('.subbar .badge')].find(item => /Seção 1 de 8|Card 1 de 8/.test(item.textContent));
    if (!badge) return false;
    const panel = badge.closest('.panel'); if (!panel || panel.classList.contains('s1-panel')) return true;
    panel.outerHTML = cardMarkup(); return true;
  }
  function start() { installEvents(); let busy = false; const refresh = () => { if (busy) return; busy = true; try { mount(); } finally { busy = false; } }; refresh(); new MutationObserver(() => queueMicrotask(refresh)).observe(document.body, { childList: true, subtree: true }); document.addEventListener('click', () => setTimeout(refresh, 0), true); }
  document.addEventListener('DOMContentLoaded', () => { const wait = () => (api()?.getCatalog() && window.DrogariaOcrTools ? start() : setTimeout(wait, 50)); wait(); });
  window.DrogariaSection1 = Object.freeze({ mount, reviewDocument, reviewAnvisa });
})();
