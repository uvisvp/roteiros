/* Farmácia de Manipulação — Seção 9: Rastreabilidade e Controle de Qualidade.
 * Cadeia documental: prescrição → OM → insumo/lote → DANFE → CoA → CQ recebimento → produto acabado/rótulo.
 * Diferenças numéricas e consultas regulatórias não produzem julgamento sanitário automático.
 */
(() => {
  'use strict';
  const FM=window.FarmaciaManipulacao;
  if(!FM || window.FarmaciaManipulacaoSection9) return;
  const {field,textarea,select,question,localApplicability,refrigeratorCard,esc,uid}=FM.ui;
  const photo=(s,id)=>`<button type="button" data-fm-photo="${esc(s)}|${esc(id)}">📷</button>`;
  const copyButton=()=>'<button type="button" class="primary" data-fm-copy-section="9">📋 Copiar texto desta seção</button>';

  function sectionState(s){ return FM.ensureSection(FM.getState(),s); }
  function rows(s,type){ return (sectionState(s).records||[]).filter(r=>r.record_type===type); }
  function recInput(s,r,key,label,type='text',attrs=''){return `<label class="field"><span>${esc(label)}</span><input type="${esc(type)}" data-fm-rastreio-field="${esc(s)}|${esc(r.id)}|${esc(key)}" value="${esc(r[key]??'')}" ${attrs}></label>`;}
  function recTextarea(s,r,key,label,lines=3){return `<label class="field"><span>${esc(label)}</span><textarea rows="${lines}" data-fm-rastreio-field="${esc(s)}|${esc(r.id)}|${esc(key)}">${esc(r[key]??'')}</textarea></label>`;}
  function recSelect(s,r,key,label,opts){const v=String(r[key]??'');return `<label class="field"><span>${esc(label)}</span><select data-fm-rastreio-field="${esc(s)}|${esc(r.id)}|${esc(key)}">${opts.map(o=>{const x=Array.isArray(o)?o:[o,o];return `<option value="${esc(x[0])}"${v===String(x[0])?' selected':''}>${esc(x[1])}</option>`;}).join('')}</select></label>`;}
  function qInline(s,r,key,label,nsa=true){
    const v=r.checks?.[key]||'';
    return `<div class="q fm-question"><b class="q-title">${esc(label)}</b><div class="answers fm-answers"><button type="button" data-fm-rastreio-check="${esc(s)}|${esc(r.id)}|${esc(key)}|c" aria-pressed="${v==='c'}">Conforme</button><button type="button" data-fm-rastreio-check="${esc(s)}|${esc(r.id)}|${esc(key)}|nc" aria-pressed="${v==='nc'}">Não conforme</button>${nsa?`<button type="button" data-fm-rastreio-check="${esc(s)}|${esc(r.id)}|${esc(key)}|na" aria-pressed="${v==='na'}">Não se aplica</button>`:''}</div>${recTextarea(s,r,'note_'+key,'Anotações',2)}</div>`;
  }
  function header(s,title){return `<div class="subbar"><span class="badge">${esc(s)} · Rastreabilidade</span><button type="button" data-fm-open-section="9">Rastreabilidade</button><button type="button" data-fm-home>Todos</button></div><h2>${esc(s)} ${esc(title)}</h2>`;}

  function render9(){
    const defs=FM.SUBSECTIONS['9']||[];
    return `<div class="panel fm-panel"><div class="subbar"><span class="badge">9 · Rastreabilidade</span><button type="button" data-fm-home>Todos</button></div><h2>9 Rastreabilidade e Controle de Qualidade</h2><p>Partir das formulações amostradas e seguir o rastro até os insumos, documentos de aquisição, certificados e controles internos. OCR organiza os dados; a equipe define a situação sanitária.</p><div class="cards fm-section-cards">${defs.map(([id,t])=>`<button class="card-button" type="button" data-fm-open-subsection="${esc(id)}"><span class="number">${esc(id)}</span><span><strong>${esc(t)}</strong></span></button>`).join('')}</div>${copyButton()}</div>`;
  }

  function render91(){
    const s='9.1',sec=sectionState(s);
    const body=`<section class="box"><h3>Prescrição / receita amostrada</h3>
      <div class="grid">${field(s,'sample_description','Preparação / prescrição amostrada')}${field(s,'prescription_date','Data da prescrição','date')}${field(s,'prescriber','Prescritor')}${field(s,'patient_reference','Paciente / referência')}</div>
      <div class="actions">${photo(s,'prescricao')}<button type="button" data-fm-doc-request="9.1|prescricao_consulta">📄 Anexar para consulta</button></div>
      <p class="muted">A imagem/documento serve para consulta. A avaliação da legalidade é feita pelo checklist, não por julgamento automático do OCR.</p>
    </section>
    <section class="box"><h3>Avaliação da prescrição</h3>
      ${question(s,'legibility','A prescrição está legível e sem rasuras relevantes, permitindo a conferência dos dados exigidos?',{nsa:false})}
      ${question(s,'prescriber_patient','Constam identificação do prescritor, registro profissional/endereço e identificação do paciente conforme o caso?',{nsa:false})}
      ${question(s,'active_and_directions','Constam substância ativa por DCB/DCI, concentração, forma farmacêutica, quantidades, posologia, duração quando aplicável, local/data e assinatura?',{nsa:false})}
      ${question(s,'calculations','Os cálculos de manipulação — fatores de conversão, correção e equivalência — foram realizados e registrados na OM quando aplicáveis?',{nsa:true})}
      ${question(s,'continuous_duration','Em tratamento continuado, a duração foi expressamente indicada pelo prescritor?',{nsa:true})}
      ${question(s,'controlled_prescription','Para substâncias sujeitas a controle especial, a prescrição/notificação e a retenção/escrituração aplicáveis foram conferidas?',{nsa:true})}
      ${question(s,'antimicrobial','Para antimicrobianos, foram conferidas retenção da via, prazo e escrituração aplicáveis?',{nsa:true,requirement:'O roteiro analisado informa validade de 10 dias; referência normativa será conferida na revisão global antes da versão final.'})}
      ${question(s,'digital_signature','Em prescrição digital, a assinatura eletrônica foi validada e o arquivo digital foi arquivado quando aplicável?',{nsa:true})}
    </section>${copyButton()}`;
    return `<div class="panel fm-panel">${header(s,'Avaliação da prescrição')}${localApplicability(s,'Não se aplica a esta inspeção')}${sec.applicable===false?'<p class="muted">Subseção marcada como não aplicável.</p>':body}</div>`;
  }

  const FORM_CONFIG={
    '9.2.1':{title:'Rastreabilidade — formulação sólida',kind:'solida',finished:['Descrição','Aspecto','Caracteres organolépticos','Peso médio','DP','CV']},
    '9.2.2':{title:'Rastreabilidade — formulação semissólida',kind:'semissolida',finished:['Descrição','Aspecto','Caracteres organolépticos','pH quando aplicável','Peso']},
    '9.2.3':{title:'Rastreabilidade — formulação líquida',kind:'liquida',finished:['Descrição','Aspecto','Caracteres organolépticos','pH','Peso ou volume antes do envase']}
  };

  function componentCard(s,fr,c){
    const cid=c.id;
    return `<div class="box fm-component" data-fm-component="${esc(cid)}"><div class="subbar"><strong>Componente</strong><button type="button" data-fm-component-remove="${esc(s)}|${esc(fr.id)}|${esc(cid)}">Remover</button></div>
      <div class="grid">${componentSelect(s,fr,c,'type','Tipo',[['principio_ativo','Princípio ativo'],['excipiente','Excipiente'],['embalagem','Material de embalagem'],['outro','Outro']])}${componentInput(s,fr,c,'name','Insumo / material')}${componentInput(s,fr,c,'lot_internal','Lote interno / fornecedor')}${componentInput(s,fr,c,'lot_manufacturer','Lote do fabricante')}</div>
      <div class="grid">${componentInput(s,fr,c,'validity','Validade','date')}${componentInput(s,fr,c,'manufacturer','Fabricante')}${componentInput(s,fr,c,'supplier','Fornecedor')}${componentInput(s,fr,c,'invoice','DANFE / NF')}</div>
      <div class="grid">${componentInput(s,fr,c,'quantity_weighed','Quantidade pesada')}${componentInput(s,fr,c,'coa_number','Certificado de análise nº')}${componentInput(s,fr,c,'pharmacy_cq','CQ interno / certificado nº')}</div>
      <div class="actions"><button type="button" data-fm-component-doc="${esc(s)}|${esc(fr.id)}|${esc(cid)}|danfe">📄 DANFE</button><button type="button" data-fm-component-doc="${esc(s)}|${esc(fr.id)}|${esc(cid)}|coa">📄 Certificado de análise</button>${photo(s,'componente_'+cid)}</div>
      <p class="muted">Fornecedor, fabricante, lote interno e lote do fabricante são campos distintos. O aplicativo não deve fundi-los automaticamente.</p>
    </div>`;
  }
  function componentInput(s,fr,c,key,label,type='text'){return `<label class="field"><span>${esc(label)}</span><input type="${esc(type)}" data-fm-component-field="${esc(s)}|${esc(fr.id)}|${esc(c.id)}|${esc(key)}" value="${esc(c[key]??'')}"></label>`;}
  function componentSelect(s,fr,c,key,label,opts){const v=String(c[key]??'');return `<label class="field"><span>${esc(label)}</span><select data-fm-component-field="${esc(s)}|${esc(fr.id)}|${esc(c.id)}|${esc(key)}">${opts.map(x=>`<option value="${esc(x[0])}"${v===x[0]?' selected':''}>${esc(x[1])}</option>`).join('')}</select></label>`;}

  function formulaCard(s,r,cfg){
    r.components ||= [];
    const assays=cfg.finished.map(x=>`<label class="check"><input type="checkbox" data-fm-formula-assay="${esc(s)}|${esc(r.id)}|${esc(x)}" ${(r.finished_assays||[]).includes(x)?'checked':''}><span>${esc(x)}</span></label>`).join('');
    return `<article class="box fm-formula"><div class="subbar"><strong>Formulação amostrada</strong><button type="button" data-fm-rastreio-remove="${esc(s)}|${esc(r.id)}">Remover</button></div>
      <div class="grid">${recInput(s,r,'product','Produto / preparação')}${recInput(s,r,'om_number','Ordem de Manipulação nº')}${recInput(s,r,'om_date','Data da OM','date')}${recInput(s,r,'manipulator','Manipulado por')}</div>
      <div class="grid">${recInput(s,r,'patient','Paciente / referência')}${recInput(s,r,'prescription_reference','Prescrição / receita relacionada')}${recInput(s,r,'book_number','Registro / livro de receituário')}</div>
      <div class="actions"><button type="button" data-fm-formula-doc="${esc(s)}|${esc(r.id)}|om">📄 Ler Ordem de Manipulação</button>${photo(s,'om_'+r.id)}</div>
      ${qInline(s,r,'om_complete','A OM contém os insumos com lote, fornecedor, quantidade pesada, assinaturas/vistos e aprovação farmacêutica aplicáveis?',false)}
      <section><h4>Insumos / excipientes / embalagem</h4><button type="button" data-fm-component-add="${esc(s)}|${esc(r.id)}">+ Adicionar componente</button>${(r.components||[]).map(c=>componentCard(s,r,c)).join('')||'<p class="muted">Nenhum componente cadastrado.</p>'}</section>
      <section class="box"><h4>Controle de qualidade do produto acabado</h4><div class="checks">${assays}</div>${qInline(s,r,'finished_cq_approved','As informações/ensaios de CQ do produto acabado foram registrados e aprovados pelo farmacêutico?',true)}</section>
      <section class="box"><h4>CQ no recebimento e rastreabilidade do material amostrado</h4>
        ${qInline(s,r,'receiving_inspection','Houve inspeção de recebimento com identificação, integridade/limpeza e correspondência entre pedido, nota e rótulo?',true)}
        ${qInline(s,r,'coa','O certificado de análise do fornecedor/fabricante está datado, identificado e arquivado pelo período aplicável?',true)}
        <p class="fm-requirement"><strong>Prazo informado no roteiro:</strong> certificado arquivado por 6 meses após a validade do último produto; 2 anos quando se tratar de controle especial.</p>
        ${qInline(s,r,'internal_cq','A farmácia realizou o controle de qualidade próprio da matéria-prima no recebimento?',true)}
        ${qInline(s,r,'packaging_cq','Para material de embalagem, foi realizado CQ no recebimento e verificada a compatibilidade/atoxicidade aplicável?',true)}
        ${qInline(s,r,'quarantine','O material permaneceu em quarentena até a liberação pelo Controle de Qualidade?',true)}
        ${recTextarea(s,r,'raw_material_assays','Ensaios da matéria-prima realizados: caracteres organolépticos, solubilidade, pH, peso, volume, ponto de fusão, densidade, avaliação do laudo etc.',3)}
      </section>
      <section class="box"><h4>Rotulagem</h4>${recTextarea(s,r,'label_items','Itens presentes no rótulo: prescritor, paciente, registro, manipulação/validade, componentes/quantidades, unidades/peso/volume, posologia, identificação da farmácia/CNPJ/endereço, RT/CRF etc.',3)}${qInline(s,r,'label_check','A rotulagem foi conferida pela equipe conforme os requisitos aplicáveis?',true)}</section>
      ${recTextarea(s,r,'notes_general','Observações da formulação/rastreabilidade',3)}
    </article>`;
  }

  function renderFormula(s){
    const cfg=FORM_CONFIG[s],sec=sectionState(s),list=rows(s,'formula');
    return `<div class="panel fm-panel">${header(s,cfg.title)}${localApplicability(s,'Não se aplica a esta inspeção')}${sec.applicable===false?'<p class="muted">Subseção marcada como não aplicável.</p>':`<p>Para cada formulação, amostrar ao menos um princípio ativo, um excipiente e um material de embalagem, quando existentes, seguindo a cadeia documental até aquisição e CQ.</p><div class="actions"><button class="primary" type="button" data-fm-rastreio-add="${esc(s)}|formula">+ Adicionar formulação</button>${copyButton()}</div>${list.map(r=>formulaCard(s,r,cfg)).join('')||'<p class="muted">Nenhuma formulação cadastrada.</p>'}`}${copyButton()}</div>`;
  }

  function vegetalCard(s,r){
    return `<article class="box"><div class="subbar"><strong>Matéria-prima vegetal</strong><button type="button" data-fm-rastreio-remove="${esc(s)}|${esc(r.id)}">Remover</button></div>
      <div class="grid">${recInput(s,r,'name','Matéria-prima vegetal')}${recInput(s,r,'lot','Lote')}${recInput(s,r,'validity','Validade','date')}${recInput(s,r,'manufacturer','Fabricante')}</div>
      <div class="grid">${recInput(s,r,'supplier','Fornecedor')}${recInput(s,r,'invoice','DANFE / NF nº')}${recInput(s,r,'manufacturer_coa','Certificado do fabricante nº')}${recInput(s,r,'pharmacy_cq','CQ interno / laboratório nº')}</div>
      <div class="actions"><button type="button" data-fm-rastreio-doc="${esc(s)}|${esc(r.id)}|danfe_vegetal">📄 DANFE de aquisição</button><button type="button" data-fm-rastreio-doc="${esc(s)}|${esc(r.id)}|coa_fabricante_vegetal">📄 Certificado de CQ do fabricante</button>${photo(s,'vegetal_'+r.id)}</div>
      ${qInline(s,r,'basic_tests','Foram conferidos caracteres organolépticos, materiais estranhos, contaminação microbiológica, umidade e cinzas totais?',false)}
      ${qInline(s,r,'macro_micro','Foram avaliadas caracterização macroscópica e microscópica conforme a apresentação do material?',true)}
      ${qInline(s,r,'density','Para matéria-prima vegetal líquida, foi avaliada densidade?',true)}
      ${recTextarea(s,r,'results','Resultados / observações dos controles apresentados',3)}
    </article>`;
  }
  function render93(){
    const s='9.3',sec=sectionState(s),list=rows(s,'vegetal');
    return `<div class="panel fm-panel">${header(s,'Controle de Qualidade de Matéria-Prima Vegetal')}${localApplicability(s,'Não se aplica a esta inspeção')}${sec.applicable===false?'<p class="muted">Subseção marcada como não aplicável.</p>':`<p>Cada matéria-prima vegetal mantém dois documentos de origem separados: <strong>DANFE de aquisição</strong> e <strong>certificado de controle de qualidade emitido pelo fabricante</strong>. O controle complementar da própria farmácia/laboratório permanece identificável separadamente.</p><button class="primary" type="button" data-fm-rastreio-add="9.3|vegetal">+ Adicionar matéria-prima vegetal</button>${list.map(r=>vegetalCard(s,r)).join('')||'<p class="muted">Nenhuma matéria-prima vegetal cadastrada.</p>'}`}${copyButton()}</div>`;
  }

  function homeopathyCard(s,r){
    return `<article class="box"><div class="subbar"><strong>Matriz / insumo homeopático</strong><button type="button" data-fm-rastreio-remove="${esc(s)}|${esc(r.id)}">Remover</button></div>
      <div class="grid">${recInput(s,r,'name','Matriz / tintura / insumo')}${recInput(s,r,'lot','Lote')}${recInput(s,r,'validity','Validade','date')}${recInput(s,r,'origin','Origem / fabricante')}</div>
      <div class="grid">${recInput(s,r,'dynamization','Dinamização')}${recInput(s,r,'scale_method','Escala / método')}${recInput(s,r,'alcohol_content','Teor alcoólico')}${recInput(s,r,'certificate','Certificado / documento nº')}</div>
      ${recTextarea(s,r,'lineage','Rastreabilidade / cadeia de origem: matriz → dinamização intermediária → preparação utilizada',4)}
      ${qInline(s,r,'traceability','A identificação e a rastreabilidade das matrizes/tinturas/insumos foram conferidas?',false)}
      ${qInline(s,r,'alcohol','O teor alcoólico foi avaliado conforme a referência aplicável?',true)}
      <div class="actions"><button type="button" data-fm-rastreio-doc="${esc(s)}|${esc(r.id)}|homeopatia">📄 Ler documento / certificado</button>${photo(s,'homeopatia_'+r.id)}</div>
    </article>`;
  }
  function render94(){
    const s='9.4',sec=sectionState(s),list=rows(s,'homeopatia');
    return `<div class="panel fm-panel">${header(s,'Controle de Qualidade de Matéria-Prima Homeopática')}${localApplicability(s,'Não se aplica a esta inspeção')}${sec.applicable===false?'<p class="muted">Subseção marcada como não aplicável.</p>':`<p>A estrutura admite cadeia de origem e dinamizações sucessivas; o OCR não deve reduzir a rastreabilidade a um único lote.</p><button class="primary" type="button" data-fm-rastreio-add="9.4|homeopatia">+ Adicionar matriz / insumo</button>${list.map(r=>homeopathyCard(s,r)).join('')||'<p class="muted">Nenhum item cadastrado.</p>'}`}${copyButton()}</div>`;
  }

  function parseNumber(v){
    let x=String(v??'').trim().replace(/\s/g,'');
    if(!x) return NaN;
    if(x.includes(',')&&x.includes('.')) x=x.lastIndexOf(',')>x.lastIndexOf('.')?x.replace(/\./g,'').replace(',','.'):x.replace(/,/g,'');
    else if(x.includes(',')) x=x.replace(',','.');
    return Number(x);
  }
  function difference(r){const a=parseNumber(r.physical),b=parseNumber(r.system);return Number.isFinite(a)&&Number.isFinite(b)?a-b:null;}
  function fmtDiff(v){if(v===null)return '';return new Intl.NumberFormat('pt-BR',{maximumFractionDigits:6}).format(v);}

  function stockCard(s,r){
    const diff=difference(r);
    return `<article class="box fm-stock-row"><div class="subbar"><strong>Substância controlada</strong><button type="button" data-fm-rastreio-remove="${esc(s)}|${esc(r.id)}">Remover</button></div>
      <div class="grid">${recInput(s,r,'substance','Substância')}${recInput(s,r,'list','Lista / classificação Portaria 344')}${recInput(s,r,'manufacturer','Fabricante')}${recInput(s,r,'lot','Lote')}</div>
      <div class="grid">${recInput(s,r,'ifa_identifier_type','Tipo de identificador Anvisa/IFA')}${recInput(s,r,'ifa_identifier','Registro / identificador Anvisa do IFA')}${recInput(s,r,'unit','Unidade')}</div>
      <div class="grid three">${recInput(s,r,'physical','Estoque físico')}${recInput(s,r,'system','Estoque escriturado / sistema')}<label class="field"><span>Diferença — físico − escriturado</span><input readonly value="${esc(fmtDiff(diff))}"></label></div>
      <p class="muted">A diferença é apenas cálculo aritmético. Valor diferente de zero não é convertido automaticamente em NC.</p>
      <div class="actions"><button type="button" data-fm-controlled-lookup="${esc(s)}|${esc(r.id)}">Consultar classificação Portaria 344</button><button type="button" data-fm-ifa-lookup="${esc(s)}|${esc(r.id)}">Consultar IFA — Anvisa</button>${photo(s,'estoque_'+r.id)}</div>
      ${recTextarea(s,r,'source_comparison','Comparação documento × fonte oficial / divergências encontradas',2)}
      ${recSelect(s,r,'inspection_status','Situação definida pela equipe',[['','Não avaliado'],['c','Conforme'],['nc','Não conforme'],['na','Não se aplica']])}
      ${recTextarea(s,r,'inspection_notes','Anotações da equipe',2)}
    </article>`;
  }
  function render95(){
    const s='9.5',sec=sectionState(s),list=rows(s,'stock_controlled');
    return `<div class="panel fm-panel">${header(s,'Confronto estoque físico × escriturado — Portaria 344/98')}${localApplicability(s,'Não se aplica a esta inspeção')}${sec.applicable===false?'<p class="muted">Subseção marcada como não aplicável.</p>':`<p>O mecanismo registra a pesagem/contagem física, o saldo escriturado e calcula a diferença. A consulta regulatória auxilia na classificação da substância e, quando a fonte oficial permitir, na identificação do IFA/fabricante, sem substituir a conferência de rótulo, DANFE ou certificado.</p><button class="primary" type="button" data-fm-rastreio-add="9.5|stock_controlled">+ Adicionar substância</button>${list.map(r=>stockCard(s,r)).join('')||'<p class="muted">Nenhuma substância cadastrada.</p>'}<p class="muted">A integração IFA somente utilizará chaves e campos confirmados na fonte oficial; não será inferido fabricante de IFA a partir do detentor do medicamento acabado.</p>`}${copyButton()}</div>`;
  }

  function render96(){
    const s='9.6',sec=sectionState(s);
    const body=`<section class="box"><h3>Conservação e transporte</h3>
      ${question(s,'written_procedures','Há procedimentos escritos de conservação/transporte que preservem especificações e integridade até a dispensação?',{nsa:false})}
      ${question(s,'thermosensitive','Termossensíveis, quando existentes, são mantidos/transportados em temperatura compatível, com registros e meio térmico qualificado quando exigido?',{nsa:true})}
      ${question(s,'incompatibles','Os manipulados não são armazenados/transportados junto a materiais incompatíveis como alimentos, animais, solventes, gases, corrosivos/tóxicos, pesticidas ou radioativos?',{nsa:false})}
      <div class="grid">${field(s,'delivery_provider','Transportadora / responsável pela entrega')}${field(s,'vehicle_container','Veículo / baú / recipiente')}${field(s,'adopted_temperature_range','Faixa de temperatura adotada, quando aplicável')}</div>
      ${question(s,'delivery_cleaning_records','Há registros de limpeza do baú/recipiente utilizado nas entregas quando aplicável?',{nsa:true})}
      ${question(s,'delivery_environment_records','Há registros de temperatura/umidade do meio de transporte quando aplicável?',{nsa:true})}
      ${textarea(s,'transport_notes','Observações sobre logística/entrega',3)}${photo(s,'transporte')}
      ${refrigeratorCard(s)}
    </section>
    <section class="box"><h3>Dispensação</h3>
      ${question(s,'prescription_stamp','As receitas aviadas possuem a identificação/registros de dispensação exigidos conforme o caso?',{nsa:true})}
      ${question(s,'repeat_treatment','A repetição do atendimento da mesma receita ocorre apenas quando compatível com a duração expressamente indicada pelo prescritor?',{nsa:true})}
      ${question(s,'pharmacist_review_delivery','Quando há entrega em domicílio, a dispensação/liberação ocorre após análise farmacêutica e os registros necessários são mantidos?',{nsa:true})}
    </section>${copyButton()}`;
    return `<div class="panel fm-panel">${header(s,'Conservação, Transporte e Dispensação')}${localApplicability(s,'Não se aplica a esta inspeção')}${sec.applicable===false?'<p class="muted">Subseção marcada como não aplicável.</p>':body}</div>`;
  }

  function addRecord(s,type){
    FM.mutate(st=>{const sec=FM.ensureSection(st,s);const r={id:uid(type),record_type:type,created_at:new Date().toISOString(),checks:{}};if(type==='formula')r.components=[];sec.records.push(r);});
  }
  function locate(st,s,id){return (FM.ensureSection(st,s).records||[]).find(r=>r.id===id);}

  document.addEventListener('click',e=>{
    const sub=e.target.closest('[data-fm-open-subsection]');if(sub){FM.setActive('9',sub.dataset.fmOpenSubsection||'');return;}
    const add=e.target.closest('[data-fm-rastreio-add]');if(add){const [s,t]=(add.dataset.fmRastreioAdd||'').split('|');addRecord(s,t);return;}
    const rem=e.target.closest('[data-fm-rastreio-remove]');if(rem){const [s,id]=(rem.dataset.fmRastreioRemove||'').split('|');FM.mutate(st=>{const sec=FM.ensureSection(st,s);sec.records=(sec.records||[]).filter(r=>r.id!==id);});return;}
    const chk=e.target.closest('[data-fm-rastreio-check]');if(chk){const [s,id,key,val]=(chk.dataset.fmRastreioCheck||'').split('|');FM.mutate(st=>{const r=locate(st,s,id);if(r){r.checks ||= {};r.checks[key]=val;}});return;}
    const ca=e.target.closest('[data-fm-component-add]');if(ca){const [s,id]=(ca.dataset.fmComponentAdd||'').split('|');FM.mutate(st=>{const r=locate(st,s,id);if(r){r.components ||= [];r.components.push({id:uid('comp'),type:'principio_ativo'});}});return;}
    const cr=e.target.closest('[data-fm-component-remove]');if(cr){const [s,id,cid]=(cr.dataset.fmComponentRemove||'').split('|');FM.mutate(st=>{const r=locate(st,s,id);if(r)r.components=(r.components||[]).filter(c=>c.id!==cid);});return;}
    const fd=e.target.closest('[data-fm-formula-doc]');if(fd){const [s,id,kind]=(fd.dataset.fmFormulaDoc||'').split('|');window.dispatchEvent(new CustomEvent('farmacia-manipulacao:document-requested',{detail:{section:s,recordId:id,kind:kind==='om'?'ordem_manipulacao':kind}}));return;}
    const cd=e.target.closest('[data-fm-component-doc]');if(cd){const [s,id,cid,kind]=(cd.dataset.fmComponentDoc||'').split('|');window.dispatchEvent(new CustomEvent('farmacia-manipulacao:document-requested',{detail:{section:s,recordId:id,componentId:cid,kind:kind==='danfe'?'danfe':'certificado_analise'}}));return;}
    const rd=e.target.closest('[data-fm-rastreio-doc]');if(rd){const [s,id,kind]=(rd.dataset.fmRastreioDoc||'').split('|');window.dispatchEvent(new CustomEvent('farmacia-manipulacao:document-requested',{detail:{section:s,recordId:id,kind}}));return;}
    const ctl=e.target.closest('[data-fm-controlled-lookup]');if(ctl){const [s,id]=(ctl.dataset.fmControlledLookup||'').split('|');const r=rows(s,'stock_controlled').find(x=>x.id===id);window.dispatchEvent(new CustomEvent('farmacia-manipulacao:controlled-lookup-requested',{detail:{section:s,recordId:id,substance:r?.substance||''}}));return;}
    const ifa=e.target.closest('[data-fm-ifa-lookup]');if(ifa){const [s,id]=(ifa.dataset.fmIfaLookup||'').split('|');const r=rows(s,'stock_controlled').find(x=>x.id===id);window.dispatchEvent(new CustomEvent('farmacia-manipulacao:ifa-lookup-requested',{detail:{section:s,recordId:id,substance:r?.substance||'',manufacturer:r?.manufacturer||''}}));return;}
    const copy=e.target.closest('[data-fm-copy-section]');if(copy)window.dispatchEvent(new CustomEvent('farmacia-manipulacao:copy-section',{detail:{section:'9'}}));
  });

  document.addEventListener('input',e=>{
    const rf=e.target.closest('[data-fm-rastreio-field]');if(rf){const [s,id,key]=(rf.dataset.fmRastreioField||'').split('|');FM.mutate(st=>{const r=locate(st,s,id);if(r)r[key]=rf.value;},{render:false});return;}
    const cf=e.target.closest('[data-fm-component-field]');if(cf){const [s,id,cid,key]=(cf.dataset.fmComponentField||'').split('|');FM.mutate(st=>{const r=locate(st,s,id),c=(r?.components||[]).find(x=>x.id===cid);if(c)c[key]=cf.value;},{render:false});}
  });
  document.addEventListener('change',e=>{
    const rf=e.target.closest('[data-fm-rastreio-field]');if(rf){const [s,id,key]=(rf.dataset.fmRastreioField||'').split('|');FM.mutate(st=>{const r=locate(st,s,id);if(r)r[key]=rf.value;});return;}
    const cf=e.target.closest('[data-fm-component-field]');if(cf){const [s,id,cid,key]=(cf.dataset.fmComponentField||'').split('|');FM.mutate(st=>{const r=locate(st,s,id),c=(r?.components||[]).find(x=>x.id===cid);if(c)c[key]=cf.value;});return;}
    const a=e.target.closest('[data-fm-formula-assay]');if(a){const [s,id,name]=(a.dataset.fmFormulaAssay||'').split('|');FM.mutate(st=>{const r=locate(st,s,id);if(!r)return;r.finished_assays ||= [];r.finished_assays=a.checked?[...new Set([...r.finished_assays,name])]:r.finished_assays.filter(x=>x!==name);});}
  });

  FM.registerRenderer('9',render9);
  FM.registerRenderer('9.1',render91);
  Object.keys(FORM_CONFIG).forEach(s=>FM.registerRenderer(s,()=>renderFormula(s)));
  FM.registerRenderer('9.3',render93);
  FM.registerRenderer('9.4',render94);
  FM.registerRenderer('9.5',render95);
  FM.registerRenderer('9.6',render96);
  window.FarmaciaManipulacaoSection9={render9,render91,renderFormula,render93,render94,render95,render96};
  FM.render();
})();
