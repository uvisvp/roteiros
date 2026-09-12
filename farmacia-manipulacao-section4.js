/* Farmácia de Manipulação — Seção 4: Áreas Físicas.
 * Mantém aplicabilidade local, sem ocultação automática por respostas de outras seções.
 */
(() => {
  'use strict';
  const FM=window.FarmaciaManipulacao;
  if(!FM || window.FarmaciaManipulacaoSection4) return;
  const {field,textarea,select,question,localApplicability,refrigeratorCard,esc}=FM.ui;

  function shell(id,title,body,{applicable=false}={}){
    const sec=FM.ensureSection(FM.getState(),id);
    const app=applicable?localApplicability(id,'Não se aplica a esta inspeção'):'';
    const content=applicable && sec.applicable===false
      ? '<p class="muted">Subseção marcada como não aplicável. Ela permanece disponível e pode ser reativada a qualquer momento.</p>'
      : body;
    return `<div class="panel fm-panel"><div class="subbar"><span class="badge">${esc(id)} · Áreas Físicas</span><button type="button" data-fm-open-section="4">Áreas físicas</button><button type="button" data-fm-home>Todos</button></div><h2>${esc(id)} ${esc(title)}</h2>${app}${content}</div>`;
  }

  function monitoring(section,{refrigerator=true}={}){
    return `<section class="box"><h3>Monitoramento ambiental</h3>
      <p class="muted">Registrar os valores observados no momento da inspeção. O certificado de calibração identifica o instrumento, mas não substitui a aferição do ambiente.</p>
      <div class="grid three">${field(section,'env_temp_now','Temperatura — momento (°C)','number','step="0.1"')}${field(section,'env_temp_max','Temperatura — máxima (°C)','number','step="0.1"')}${field(section,'env_temp_min','Temperatura — mínima (°C)','number','step="0.1"')}</div>
      <div class="grid three">${field(section,'env_humidity_now','Umidade — momento (%)','number','step="0.1"')}${field(section,'env_humidity_max','Umidade — máxima (%)','number','step="0.1"')}${field(section,'env_humidity_min','Umidade — mínima (%)','number','step="0.1"')}</div>
      <div class="grid">${field(section,'env_instrument','Instrumento')}${field(section,'env_instrument_id','Identificação do instrumento')}${field(section,'env_cal_cert','Certificado de calibração nº')}${field(section,'env_cal_validity','Validade da calibração','date')}</div>
      ${question(section,'env_records','Há registros de temperatura e umidade, com parâmetros definidos e campo para ação corretiva?',{nsa:true})}
      <div class="actions"><button type="button" data-fm-doc-request="${esc(section)}|calibracao">📄 Ler certificado de calibração</button><button type="button" data-fm-photo="${esc(section)}|monitoramento_ambiental">📷 Fotografar monitoramento</button></div>
      ${refrigerator?refrigeratorCard(section):''}
    </section>`;
  }

  function render41(){
    const s='4.1';
    const body=`
      <section class="box"><h3>Descrição do ambiente</h3>
        ${textarea(s,'area_description','Descrição geral da recepção / dispensação',3)}
        <div class="grid">${field(s,'counters','Balcões / postos de atendimento')}${field(s,'terminals','Terminais / computadores')}${field(s,'furniture','Mobiliário / acomodação de clientes')}${field(s,'climate_system','Climatização / ventilação')}</div>
        ${field(s,'ready_formula_storage','Local de guarda das fórmulas prontas para dispensação')}
        ${textarea(s,'particularities','Outras particularidades observadas',2)}
        <button type="button" data-fm-photo="4.1|area_geral">📷 Foto do ambiente</button>
      </section>
      <section class="box"><h3>Condições sanitárias e dispensação</h3>
        ${question(s,'protected_storage','As preparações e produtos permanecem armazenados de forma organizada e protegidos de calor, umidade e luz incompatíveis?',{nsa:false})}
        ${question(s,'magistral_cabinet','Há local/armário identificado e com dispositivo de segurança para guarda das preparações magistrais prontas?',{nsa:false})}
        ${question(s,'public_information','As informações e documentos que devem permanecer visíveis ao público estão afixados e legíveis?',{nsa:true})}
        ${question(s,'expiry_display','Os produtos eventualmente expostos encontram-se dentro do prazo de validade e em condições adequadas?',{nsa:true})}
        ${question(s,'no_promotion','É respeitada a proibição de exposição de preparações manipuladas com finalidade de propaganda, publicidade ou promoção?',{nsa:false})}
        ${question(s,'controlled_storage','Quando houver preparações sujeitas a controle especial, a guarda ocorre em área exclusiva e sob dispositivo de segurança?',{nsa:true})}
      </section>
      ${monitoring(s)}
      <section class="box"><h3>Amostragem para rastreabilidade</h3>
        <p>Selecionar, quando possível, duas ou três fórmulas prontas para seguir a rastreabilidade na Seção 9. Na ausência de fórmulas prontas, utilizar ordens de manipulação recentes de preparações já dispensadas.</p>
        ${textarea(s,'traceability_samples','Fórmulas / ordens selecionadas para rastreabilidade',3)}
        <button type="button" class="primary" data-fm-jump-section="9">Ir para Rastreabilidade e Controle de Qualidade →</button>
      </section>`;
    return shell(s,'Recepção e área de vendas (dispensação)',body);
  }

  function render42(){
    const s='4.2';
    const body=`
      <section class="box"><h3>Caracterização</h3>
        ${textarea(s,'area_description','Descrição da área de dispensação de industrializados',3)}
        ${field(s,'storage_location','Local de armazenamento dos medicamentos industrializados')}
        <button type="button" data-fm-photo="4.2|area_geral">📷 Foto do ambiente</button>
      </section>
      <section class="box"><h3>Boas Práticas Farmacêuticas</h3>
        ${question(s,'thermolabile_storage','Medicamentos termolábeis, quando existentes, são mantidos nas condições de conservação definidas?',{nsa:true})}
        ${question(s,'segregated_products','Produtos violados, vencidos, suspeitos de falsificação/adulteração ou impróprios estão segregados, identificados e em local seguro?',{nsa:true})}
        ${question(s,'restricted_circulation','As áreas internas de armazenamento possuem circulação compatível com o acesso autorizado?',{nsa:true})}
        ${question(s,'generic_list','A lista atualizada de medicamentos genéricos está disponível em local visível ao usuário, quando aplicável?',{nsa:true})}
        ${question(s,'controlled_industrialized','Medicamentos sujeitos a controle especial permanecem em sistema segregado, sob chave e guarda do farmacêutico?',{nsa:true})}
        ${question(s,'stock_check','Foi realizado confronto por amostragem do estoque físico e escriturado de medicamentos controlados industrializados?',{nsa:true})}
        ${question(s,'sngpc','A escrituração/transmissão aplicável ao SNGPC foi conferida?',{nsa:true})}
        <p class="muted">O confronto de medicamentos industrializados reutilizará o mecanismo da Drogaria na etapa de integração; o confronto de matérias-primas controladas da manipulação permanece na Seção 9.5.</p>
      </section>
      ${monitoring(s)}
    `;
    return shell(s,'Dispensação de industrializados / drogaria',body,{applicable:true});
  }

  function render43(){
    const s='4.3';
    const body=`
      <section class="box"><h3>Descrição do ambiente e serviços</h3>
        ${textarea(s,'area_description','Descrição da sala / área de serviços farmacêuticos',3)}
        ${field(s,'services','Serviços farmacêuticos realizados')}
        ${textarea(s,'equipment','Equipamentos utilizados',2)}
        <button type="button" data-fm-photo="4.3|area_geral">📷 Foto do ambiente</button>
      </section>
      <section class="box"><h3>Condições e registros</h3>
        ${question(s,'sink_hygiene','Há lavatório com água corrente e insumos adequados para higiene das mãos, além de lixeira com tampa e acionamento sem contato manual?',{nsa:false})}
        ${question(s,'first_aid_ppe','Há materiais de primeiros socorros e EPI compatíveis com os serviços prestados?',{nsa:true})}
        ${question(s,'regulated_devices','Os aparelhos utilizados possuem regularização sanitária quando exigida e estão em condições adequadas de uso?',{nsa:true})}
        ${question(s,'calibrated_devices','Os equipamentos de medição que exigem calibração possuem controle/calibração vigente?',{nsa:true})}
        ${question(s,'sharps','Há recipiente adequado para descarte de perfurocortantes quando o serviço gerar esse resíduo?',{nsa:true})}
        ${question(s,'service_statement','É fornecida declaração/registro dos serviços farmacêuticos realizados, quando exigido?',{nsa:true})}
        ${question(s,'cleaning_records','Há registros atualizados de limpeza do ambiente?',{nsa:false})}
        ${question(s,'vaccination','Os profissionais que aplicam injetáveis possuem vacinação ocupacional pertinente atualizada?',{nsa:true})}
        ${question(s,'health_services_poster','As informações obrigatórias relativas aos serviços de saúde estão disponíveis ao usuário?',{nsa:true})}
        ${question(s,'injectable_training','Quando há administração de injetáveis por trabalhador habilitado, foram conferidas capacitação e eventual delegação formal pelo RT?',{nsa:true})}
        <div class="actions"><button type="button" data-fm-doc-request="4.3|calibracao">📄 Ler certificado de calibração de equipamento</button></div>
      </section>
      ${monitoring(s)}
    `;
    return shell(s,'Sala de prestação de serviços farmacêuticos',body,{applicable:true});
  }

  function render44(){
    const s='4.4';
    const body=`
      <section class="box"><h3>Organização da conferência</h3>
        ${field(s,'conference_location','Local da conferência')}
        ${textarea(s,'area_description','Como a área é organizada e como ocorre o fluxo de conferência',3)}
        ${field(s,'usual_responsible','Responsável habitual / função')}
        <button type="button" data-fm-photo="4.4|area_geral">📷 Foto do local</button>
      </section>
      <section class="box"><h3>Verificações</h3>
        ${question(s,'om_record_approval','A conferência é registrada na ordem de manipulação e há aprovação farmacêutica antes da dispensação?',{nsa:false})}
        ${question(s,'prescription_label_match','O processo permite confrontar ordem de manipulação, prescrição e rótulo antes da liberação?',{nsa:false})}
        ${question(s,'patient_separation','A organização evita troca ou mistura de preparações pertencentes a pacientes distintos?',{nsa:false})}
        <p class="muted">A Ordem de Manipulação é lida e analisada na Seção 9; aqui é verificado o processo físico e operacional da conferência.</p>
        <button type="button" data-fm-jump-section="9">Ir para a Seção 9 →</button>
      </section>
      ${refrigeratorCard(s)}
    `;
    return shell(s,'Área ou local de conferência',body);
  }

  function supportCard(key,title,body){
    const sec=FM.ensureSection(FM.getState(),key);
    const app=localApplicability(key,`Não se aplica — ${title}`);
    return `<section class="box"><h3>${esc(title)}</h3>${app}${sec.applicable===false?'<p class="muted">Bloco marcado como não aplicável.</p>':body}</section>`;
  }

  function render45(){
    const s='4.5';
    const dml=supportCard('4.5.dml','DML — Depósito de Material de Limpeza',`
      ${textarea('4.5.dml','description','Descrição do DML / local de guarda',2)}
      ${question('4.5.dml','identified','O DML/local encontra-se identificado e destinado ao armazenamento dos materiais de limpeza?',{nsa:false})}
      ${question('4.5.dml','segregated','Materiais e saneantes de limpeza estão armazenados de forma organizada e segregada das áreas/produtos incompatíveis?',{nsa:false})}
      ${question('4.5.dml','regular_products','Os produtos utilizados na limpeza apresentam identificação e regularidade/uso compatíveis com sua finalidade?',{nsa:true})}
      ${textarea('4.5.dml','uniform_washing','Lavagem/guarda de uniformes — descrição, quando aplicável',2)}
      <button type="button" data-fm-photo="4.5.dml|area_geral">📷 Fotografar DML</button>`);

    const sanitary=supportCard('4.5.sanitarios','Sanitários e vestiários',`
      ${textarea('4.5.sanitarios','description','Descrição dos sanitários / vestiários',2)}
      ${question('4.5.sanitarios','no_direct_communication','Os sanitários não possuem comunicação direta com áreas de armazenamento, manipulação ou controle de qualidade?',{nsa:false})}
      ${question('4.5.sanitarios','hygiene_supplies','Há sabonete/detergente líquido, meio de secagem descartável e lixeira com tampa e acionamento sem contato manual?',{nsa:false})}
      ${question('4.5.sanitarios','ventilation','Há ventilação adequada, natural ou por exaustão?',{nsa:true})}
      ${question('4.5.sanitarios','belongings','Há local/vestiário adequado para guarda de pertences e troca/colocação de uniformes?',{nsa:false})}
      <button type="button" data-fm-photo="4.5.sanitarios|area_geral">📷 Fotografar sanitário / vestiário</button>`);

    const gowning=supportCard('4.5.paramentacao','Paramentação',`
      ${textarea('4.5.paramentacao','description','Descrição da área de paramentação',2)}
      ${question('4.5.paramentacao','ventilation','A área de paramentação é ventilada e apresenta organização compatível com barreira entre condição suja/limpa?',{nsa:false})}
      ${question('4.5.paramentacao','technical_access','A paramentação organiza o acesso às áreas de pesagem/manipulação sem fluxo inadequado?',{nsa:false})}
      ${question('4.5.paramentacao','exclusive_sink','Há lavatório de uso exclusivo para higiene das mãos/antebraços associado à paramentação?',{nsa:false})}
      ${question('4.5.paramentacao','hygiene_inputs','Estão disponíveis sabonete líquido/antisséptico e meio adequado de secagem?',{nsa:false})}
      ${question('4.5.paramentacao','ppe','Os EPI e vestimentas necessários encontram-se disponíveis e organizados?',{nsa:false})}
      <button type="button" data-fm-photo="4.5.paramentacao|area_geral">📷 Fotografar paramentação</button>`);

    const general=`<section class="box"><h3>Condições gerais observadas nas áreas físicas</h3>
      <p class="muted">Verificação física. Certificados e programas correspondentes são analisados documentalmente na Seção 7.</p>
      ${question(s,'drains','Os ralos, quando existentes nas áreas avaliadas, são sifonados e possuem sistema de fechamento/tampa compatível?',{nsa:true})}
      ${question(s,'pest_barriers','Áreas de armazenamento, manipulação e CQ possuem proteção física contra entrada de aves, insetos, roedores e poeira?',{nsa:false})}
      ${question(s,'pest_program_observed','Há evidências de execução do controle integrado de pragas e vetores compatíveis com a estrutura observada?',{nsa:true})}
      ${question(s,'waste_bins','Lixeiras e recipientes para resíduos encontram-se identificados/segregados conforme o grupo e em condições adequadas?',{nsa:true})}
      <button type="button" data-fm-photo="4.5|condicoes_gerais">📷 Fotografar condição geral</button>
    </section>`;

    return shell(s,'DML, Sanitários e Paramentação',`${dml}${sanitary}${gowning}${general}`);
  }

  document.addEventListener('click',e=>{
    const j=e.target.closest('[data-fm-jump-section]');
    if(j){FM.setActive(j.dataset.fmJumpSection,'');}
  });

  FM.registerRenderer('4.1',render41);
  FM.registerRenderer('4.2',render42);
  FM.registerRenderer('4.3',render43);
  FM.registerRenderer('4.4',render44);
  FM.registerRenderer('4.5',render45);
  window.FarmaciaManipulacaoSection4={render41,render42,render43,render44,render45};
  FM.render();
})();
