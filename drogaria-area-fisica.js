/* Ponte de integração — Drogaria / Área física e medicamentos termolábeis.
 * Mantém estes registros separados até a revisão textual do relatório. */
(() => {
  'use strict';
  if (window.DrogariaAreaFisica) return;

  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = () => structuredClone(window.DrogariaAPI.getState());
  const save = (mutator, render=true) => { const s = clone(); mutator(s); window.DrogariaAPI.setState(s,{render}); };
  const cite = (ref, label) => '<button type="button" class="cite" data-law="' + esc(ref) + '">' + esc(label) + '</button>';
  const stateFor = (state, name) => ((state.meta.drogaria_secoes ||= {})[name] ||= { answers:{}, fields:{}, docs:[] });
  const active = name => stateFor(window.DrogariaAPI.getState(), name);
  const setAnswer = (name, key, value) => save(s => stateFor(s, name).answers[key] = value);
  const setField = (name, key, value) => save(s => stateFor(s, name).fields[key] = value);
  const options = (name, key, value, nsa = true) => {
    const current = active(name).answers[key] || '';
    return '<div class="answers">' + ['sim','nao'].concat(nsa ? ['nsa'] : []).map(v => '<button type="button" data-af-answer="' + esc(name + '|' + key + '|' + v) + '" aria-pressed="' + (current === v) + '">' + ({sim:'Sim',nao:'Não',nsa:'Não se aplica'})[v] + '</button>').join('') + '</div>';
  };
  const field = (name, key, label, type = 'text', extra = '') => '<label class="field"><span>' + esc(label) + '</span><input type="' + type + '" value="' + esc(active(name).fields[key] || '') + '" data-af-field="' + esc(name + '|' + key) + '" ' + extra + '></label>';
  const check = (name, key, label) => '<label class="check"><input type="checkbox" data-af-check="' + esc(name + '|' + key) + '"' + (active(name).fields[key] ? ' checked' : '') + '><span>' + esc(label) + '</span></label>';
  const question = (name, key, label, ref, nsa = true) => '<div class="q"><b class="q-title">' + esc(label) + '</b>' + (ref ? '<p class="s1-citations">' + cite(ref[0], ref[1]) + '</p>' : '') + options(name, key, null, nsa) + '</div>';
  const docButton = (name, type, label) => '<button type="button" data-af-doc="' + esc(name + '|' + type) + '">Ler ' + esc(label) + '</button>';
  const docs = name => active(name).docs || [];
  const docList = name => docs(name).length ? '<ul class="s1-doc-list">' + docs(name).map(d => '<li><b>' + esc(d.title) + '</b> <button type="button" data-review-edit="' + esc(name + '|' + d.id) + '">Conferir / editar</button><button type="button" data-af-remove="' + esc(name + '|' + d.id) + '">Remover</button></li>').join('') + '</ul>' : '<p class="muted">Nenhum documento lido nesta seção.</p>';

  const areaCards = [
    ['recebimento','4.1 Área de recebimento de produtos','Área designada, conferência no recebimento e POP.'],
    ['dispensacao','4.2 Área de dispensação','Documentos expostos, ambiente, monitoramento e termohigrômetro.'],
    ['armazenamento','4.3 Área de armazenamento','Áreas existentes e verificação para cada área selecionada.'],
    ['residuos','4.4 Armazenamento temporário de resíduos','Abrigo isolado ou lixeiras até a coleta.'],
    ['vencidos','4.5 Produtos vencidos / violados','Segregação, identificação e destino.'],
    ['dml','4.6 Depósito de material de limpeza — DML','Localização e guarda de produtos de limpeza.'],
    ['refeitorio','4.7 Refeitório','Condições e equipamentos da área de refeições.'],
    ['sanitarios','4.8 Vestiários e sanitários','Quantidade, tipos, acessibilidade e condições gerais.']
  ];
  function openArea(id) {
    setField('area_fisica','active_card',id);
    window.scrollTo({top:0,behavior:'instant'});
  }
  function navigate(section,direction) {
    if(section!==2)return false;
    const index=areaCards.findIndex(c=>c[0]===active('area_fisica').fields.active_card);
    if(direction===1&&index<areaCards.length-1){openArea(areaCards[index+1][0]);return true;}
    if(direction===-1&&index>=0){openArea(index?areaCards[index-1][0]:'');return true;}
    return false;
  }
  function hub() {
    return '<div class="panel af-panel"><div class="subbar"><span class="badge">Seção 2 de 8</span><button data-action="home">Todas as seções</button></div><h2>Área física</h2><p class="muted">Selecione o ambiente para registrar a verificação. As respostas serão usadas na revisão posterior do relatório.</p><div class="cards af-cards">' + areaCards.map(([id,title,desc]) => '<button class="card-button" type="button" data-af-open="' + id + '"><span class="number">4</span><span><strong>' + esc(title) + '</strong><small>' + esc(desc) + '</small></span></button>').join('') + '</div><section class="box"><h3>Ambientes e pavimentos</h3>' + window.DrogariaAPI.rooms() + window.DrogariaAPI.physicalChecklist() + '</section><section class="box"><h3>Condições gerais e documentos</h3>' + question('area_geral','caixa_agua','Possui caixa d’água?',null,false) + (active('area_geral').answers.caixa_agua==='nao'?field('area_geral','origem_agua','Origem da água'):'') + question('area_geral','ar_condicionado','Apresentou manutenção do ar-condicionado?',null,true) + '<div class="actions">'+docButton('area_geral','controle_pragas_urbanas','certificado de controle de pragas')+docButton('area_geral','higienizacao_caixa_agua','certificado de higienização de caixa d’água')+docButton('area_geral','avcb_clcb','AVCB ou CLCB')+docButton('area_geral','pop_manual_pgrss','POP de higienização')+'</div>'+docList('area_geral')+'</section></div>';
  }
  function areaDetail(id) {
    let n = 'area_' + id; const title = areaCards.find(c => c[0] === id)[1];
    let body = '';
    if (id === 'recebimento') body =
      question(n,'area_identificada','O estabelecimento apresenta área designada e identificada para recebimento de produtos.',['rdc-44-2009::artigo::32','RDC 44/2009, art. 32'])
      + question(n,'conferencia','No recebimento são conferidos conservação, lote, validade, autenticidade e origem.',['rdc-44-2009::artigo::34','RDC 44/2009, art. 34'])
      + '<div class="actions s1-actions">' + docButton(n,'pop_manual_pgrss','POP de recebimento') + '</div>';
    if (id === 'dispensacao') body =
      '<h3>Documentos e avisos expostos</h3><div class="check-list">' + check(n,'crt_visivel','Certidão de Regularidade Técnica — CRF') + check(n,'aviso_medicamentos','Cartaz de orientação sobre automedicação') + check(n,'antifumo','Aviso de proibição de uso de fumígenos') + '</div>'
      + question(n,'extintor','O acesso ao extintor está livre e a recarga está válida.', ['rdc-44-2009::artigo::6::paragrafo::4','RDC 44/2009, art. 6º, § 4º'])
      + question(n,'higienizacao','Possui registros de higienização da área de dispensação.', ['rdc-44-2009::artigo::6::paragrafo::2','RDC 44/2009, art. 6º, § 2º'])
      + question(n,'monitoramento','As condições de conservação são controladas e monitoradas?', ['rdc-44-2009::artigo::35','RDC 44/2009, art. 35'])
      + question(n,'termohigrometro','Possui termohigrômetro?', null, false)
      + question(n,'planilha','Possui planilha de registros regular e dentro do intervalo preconizado?', ['rdc-44-2009::artigo::35','RDC 44/2009, art. 35'])
      + '<h3>Aferição no momento da inspeção</h3><div class="grid three">' + field(n,'temp_max','Temperatura máxima (°C)','number','step="0.1"') + field(n,'umid_max','Umidade máxima (%)','number','step="0.1"') + field(n,'temp_min','Temperatura mínima (°C)','number','step="0.1"') + field(n,'umid_min','Umidade mínima (%)','number','step="0.1"') + field(n,'temp_momento','Temperatura no momento (°C)','number','step="0.1"') + field(n,'umid_momento','Umidade no momento (%)','number','step="0.1"') + '</div>' + question(n,'orientou_reset','A equipe orientou a reinicialização das leituras após a aferição?',null,false) + '<p class="muted">Registre as medidas e orientações somente se realizadas durante a inspeção.</p>'
      + '<div class="actions s1-actions">' + docButton(n,'calibracao_termohigrometro','certificado de calibração') + docButton(n,'etiqueta_metrologica','etiqueta de calibração') + '</div>'
      + question(n,'organizacao','As áreas são organizadas, higienizadas e segregam adequadamente medicamentos, correlatos e demais produtos.', ['rdc-44-2009::artigo::35','RDC 44/2009, art. 35'])
      + question(n,'circulacao_restrita','Os medicamentos estão em área de circulação restrita aos funcionários.', null, false)
      + question(n,'genericos','Dispõe da lista de medicamentos genéricos registrada / ABC Farma ou on-line.', ['rdc-44-2009::artigo::42::paragrafo::1','RDC 44/2009, art. 42, § 1º'])
      + question(n,'mips','Os MIPs estão organizados e separados quando em autosserviço.', ['rdc-44-2009::artigo::41::paragrafo::2','RDC 44/2009, art. 41, § 2º']);
    if (id === 'armazenamento') {
      body = '<p>Selecione os ambientes e pavimentos na página anterior. Cada ambiente mantém instrumento, certificado, medições e achados próprios.</p>' + window.DrogariaAPI.areaCard();
    }
    if (id === 'residuos') body = '<h3>Forma de armazenamento</h3>' + options(n,'modelo',null,false) + '<p class="muted">Use Sim para abrigo isolado; Não para lixeiras até a coleta.</p>'
      + question(n,'abrigo','Quando há abrigo: é isolado, identificado, de acesso restrito e com piso/parede laváveis?', null, true)
      + question(n,'recipientes','Os recipientes do abrigo possuem tampa articulada?', null, true)
      + question(n,'lixeiras','Quando não há abrigo: as lixeiras possuem pedal e identificação do tipo de resíduo?', null, true)
      + question(n,'abrigo_externo','Há abrigo externo para resíduos, quando aplicável?', null, true);
    if (id === 'vencidos') body = question(n,'segregacao','Produtos violados, vencidos ou suspeitos estão segregados, identificados e em local seguro, fora da dispensação.', ['rdc-44-2009::artigo::38','RDC 44/2009, art. 38']);
    if (id === 'dml') body = question(n,'armazenamento','Materiais de limpeza e germicidas estão regularizados e guardados em local específico, designado e identificado.', ['rdc-44-2009::artigo::8','RDC 44/2009, art. 8º'])
      + '<h3>Local do DML</h3><div class="check-list">' + check(n,'sala','Sala') + check(n,'armario','Armário') + check(n,'outro','Outro') + '</div>';
    if (id === 'refeitorio') body =
      question(n,'separado','Salas de descanso e refeitório estão separadas dos demais ambientes.', null, true)
      + question(n,'lavagem_maos','A área para refeições possui lavagem de mãos com papel-toalha e sabonete líquido.', null, true)
      + question(n,'pia','Não há acondicionamento de alimentos na área do sifão da pia.', null, false)
      + '<h3>Equipamentos</h3><div class="check-list">' + check(n,'microondas','Aparelho de micro-ondas') + check(n,'refrigerador','Refrigerador') + check(n,'filtro','Filtro de água com trocas registradas') + '</div>';
    if (id === 'sanitarios') body =
      '<h3>Sanitários existentes</h3><div class="grid three">' + field(n,'clientes','Quantidade para clientes','number','min="0"') + field(n,'funcionarios','Quantidade para funcionários','number','min="0"') + field(n,'andar','Localização / andar') + '</div><div class="check-list">' + check(n,'unissex','Unissex') + check(n,'masculino','Masculino') + check(n,'feminino','Feminino') + check(n,'pcd','Sanitário PCD') + check(n,'barras','Barras de apoio') + check(n,'campainha','Campainha de emergência') + check(n,'lixeira_pcd','Lixeira adaptada/adequada') + '</div>'
      + question(n,'itens','Os sanitários possuem tampa e assento, lixeira com pedal, suporte para papel higiênico e papel-toalha.', null, true)
      + question(n,'armarios','Apresenta armários fechados para guarda de pertences pessoais.', ['rdc-44-2009::artigo::10','RDC 44/2009, art. 10'])
      + '<label class="field"><span>Irregularidades específicas por sanitário</span><textarea rows="4" data-af-text="' + n + '|irregularidades">' + esc(active(n).fields.irregularidades || '') + '</textarea></label>';
    return '<div class="panel af-panel"><div class="subbar"><button type="button" data-af-back>← Área física</button><span class="badge">Seção 2 de 8</span></div><h2>' + esc(title) + '</h2><section class="box">' + body + '</section><section class="box"><h3>Documentos lidos</h3><div class="actions s1-actions">' + docButton(n,'controle_pragas_urbanas','certificado de controle de pragas') + docButton(n,'higienizacao_caixa_agua','certificado de limpeza de caixa d’água') + docButton(n,'avcb_clcb','AVCB ou CLCB') + '</div>' + docList(n) + '</section></div>';
  }
  function thermo() {
    return '<div class="panel af-panel"><div class="subbar"><span class="badge">Seção 3 de 8</span><button data-action="home">Todas as seções</button></div><h2>Medicamentos termolábeis</h2>'+window.DrogariaAPI.coldCard()+'</div>';
  }
  function mount() {
    if (!window.DrogariaAPI || !window.DrogariaOcrTools) return false;
    const badge=[...document.querySelectorAll('.subbar .badge')].find(x=>/Seção [23] de 8|Card [23] de 8/.test(x.textContent));
    if (!badge) return false;
    const panel=badge.closest('.panel'); if(!panel || panel.classList.contains('af-panel')) return true;
    const isThermo=/Seção 3|Card 3/.test(badge.textContent);
    const selected = active('area_fisica').fields.active_card;
    panel.outerHTML=isThermo?thermo():(selected ? areaDetail(selected) : hub()); return true;
  }
  function dialog() { let d=document.getElementById('drogaria-af-dialog'); if(!d){d=document.createElement('dialog');d.id='drogaria-af-dialog';d.className='med-tools-dialog';document.body.append(d);}return d; }
  function reviewDoc(name,type) {
    window.DrogariaReview.readSection(name,type);
  }
  function install() {
    document.addEventListener('click',e=>{const o=e.target.closest('[data-af-open]');if(o){e.preventDefault();openArea(o.dataset.afOpen);return;}if(e.target.closest('[data-af-back]')){e.preventDefault();openArea('');return;}const a=e.target.closest('[data-af-answer]');if(a){const [n,k,v]=a.dataset.afAnswer.split('|');setAnswer(n,k,v);return;}const d=e.target.closest('[data-af-doc]');if(d){const [n,t]=d.dataset.afDoc.split('|');reviewDoc(n,t);return;}const rm=e.target.closest('[data-af-remove]');if(rm){const[n,id]=rm.dataset.afRemove.split('|');save(s=>stateFor(s,n).docs=stateFor(s,n).docs.filter(x=>x.id!==id));}});
    document.addEventListener('input',e=>{const f=e.target.closest('[data-af-field],[data-af-text]');if(f){const[n,k]=(f.dataset.afField||f.dataset.afText).split('|');save(s=>stateFor(s,n).fields[k]=f.value,false);}});
    document.addEventListener('change',e=>{const f=e.target.closest('[data-af-field]');if(f){const[n,k]=f.dataset.afField.split('|');save(s=>stateFor(s,n).fields[k]=f.value,false);return;}const c=e.target.closest('[data-af-check]');if(c){const[n,k]=c.dataset.afCheck.split('|');setField(n,k,c.checked);return;}const t=e.target.closest('[data-af-text]');if(t){const[n,k]=t.dataset.afText.split('|');save(s=>stateFor(s,n).fields[k]=t.value,false);}});
  }
  function start(){install();let busy=false;const refresh=()=>{if(busy)return;busy=true;try{mount()}finally{busy=false}};refresh();new MutationObserver(()=>queueMicrotask(refresh)).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',()=>setTimeout(refresh,0),true);}
  document.addEventListener('DOMContentLoaded',()=>{const wait=()=>window.DrogariaAPI?.getCatalog()&&window.DrogariaOcrTools?start():setTimeout(wait,50);wait();});
  window.DrogariaAreaFisica=Object.freeze({mount,navigate});
})();
