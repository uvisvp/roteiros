/* Farmácia de Manipulação — Seção 6: Laboratórios de Sensibilizantes.
 * Cada classe possui aplicabilidade e situação regulatória próprias.
 * Nenhuma cabine é omitida por resposta de outra seção.
 */
(() => {
  'use strict';
  const FM=window.FarmaciaManipulacao;
  if(!FM || window.FarmaciaManipulacaoSection6) return;
  const {field,textarea,select,question,localApplicability,refrigeratorCard,pressureCard,esc}=FM.ui;
  const photo=(s,id,label='📷 Fotografar')=>`<button type="button" data-fm-photo="${esc(s)}|${esc(id)}">${label}</button>`;
  const doc=(s,kind,label)=>`<button type="button" data-fm-doc-request="${esc(s)}|${esc(kind)}">📄 ${esc(label)}</button>`;

  function shell(id,title,body,{applicable=false}={}){
    const sec=FM.ensureSection(FM.getState(),id);
    const app=applicable?localApplicability(id,'Não se aplica a esta inspeção / a esta cabine'):'';
    const content=applicable && sec.applicable===false
      ? '<p class="muted">Bloco marcado como não aplicável. Ele permanece disponível e pode ser reativado a qualquer momento.</p>'
      : body;
    return `<div class="panel fm-panel"><div class="subbar"><span class="badge">${esc(id)} · Sensibilizantes</span><button type="button" data-fm-open-section="6">Sensibilizantes</button><button type="button" data-fm-home>Todos</button></div><h2>${esc(id)} ${esc(title)}</h2>${app}${content}</div>`;
  }

  function environmental(s){
    return `<section class="box"><h3>Monitoramento ambiental</h3>
      <div class="grid three">${field(s,'env_temp_now','Temperatura — momento (°C)','number','step="0.1"')}${field(s,'env_temp_max','Temperatura — máxima (°C)','number','step="0.1"')}${field(s,'env_temp_min','Temperatura — mínima (°C)','number','step="0.1"')}</div>
      <div class="grid three">${field(s,'env_humidity_now','Umidade — momento (%)','number','step="0.1"')}${field(s,'env_humidity_max','Umidade — máxima (%)','number','step="0.1"')}${field(s,'env_humidity_min','Umidade — mínima (%)','number','step="0.1"')}</div>
      <div class="grid">${field(s,'env_instrument','Termo-higrômetro')}${field(s,'env_instrument_id','Identificação')}${field(s,'env_cal_cert','Certificado de calibração nº')}${field(s,'env_cal_validity','Validade da calibração','date')}</div>
      ${question(s,'env_records','Há registros diários de temperatura e umidade com parâmetros e ação corretiva quando necessária?',{nsa:true})}
      <div class="actions">${doc(s,'calibracao_termohigrometro','Ler certificado do termo-higrômetro')}${photo(s,'monitoramento_ambiental')}</div>
    </section>`;
  }

  function balance(s){
    return `<section class="box"><h3>Balança da cabine</h3>
      <div class="grid">${field(s,'balance_id','Identificação')}${field(s,'balance_brand_model','Marca / modelo')}${field(s,'balance_cal_cert','Certificado de calibração nº')}${field(s,'balance_cal_validity','Validade da calibração','date')}</div>
      ${question(s,'balance_dedicated','A balança utilizada é compatível com a atividade e sua utilização previne contaminação cruzada?',{nsa:false})}
      ${question(s,'balance_daily_check','A balança é verificada diariamente com peso padrão e o resultado é registrado?',{nsa:false,requirement:'Verificação diária antes do início das atividades, conforme requisito aplicável.'})}
      <div class="grid">${field(s,'balance_standard_weight','Peso(s) padrão')}${field(s,'balance_daily_result','Resultado observado')}</div>
      <div class="actions">${doc(s,'calibracao_balanca','Ler certificado da balança')}${photo(s,'balanca')}</div>
    </section>`;
  }

  function records(s){
    return `<section class="box"><h3>Planilhas e registros da cabine</h3>
      ${question(s,'records_temperature_humidity','Registros de temperatura e umidade estão disponíveis e preenchidos?',{nsa:false})}
      ${question(s,'records_pressure','Registros de pressão negativa/diferencial estão disponíveis e preenchidos?',{nsa:false})}
      ${question(s,'records_surface_cleaning','Há registros de limpeza de pisos, bancadas e superfícies?',{nsa:false})}
      ${question(s,'records_balance','Há registros de aferição/verificação e limpeza da balança?',{nsa:false})}
      ${question(s,'records_filters','Há registros de limpeza, verificação de saturação e troca de filtros do sistema de exaustão quando aplicável?',{nsa:true})}
      ${question(s,'records_corrective_action','As planilhas possuem parâmetro/referência e campo para ação corretiva quando necessário?',{nsa:false})}
      ${photo(s,'planilhas_registros')}
    </section>`;
  }

  function regulatory(s,className){
    return `<section class="box"><h3>Situação da classe / cabine</h3>
      <div class="grid">${select(s,'manipulates','Manipula esta classe?',[['','Selecione'],['sim','Sim'],['nao','Não']])}${select(s,'license_status','Situação da licença',[['','Selecione'],['licenciada','Licenciada'],['solicitacao','Em solicitação / ampliação'],['sem_licenca','Sem licença'],['na','Não se aplica']])}${select(s,'cabin_exists','Cabine existente?',[['','Selecione'],['sim','Sim'],['nao','Não']])}${field(s,'cabin_id','Identificação / cor / etiqueta da cabine')}</div>
      ${field(s,'class_materials',`Substâncias / matérias-primas de ${className} observadas`)}
      ${textarea(s,'regulatory_notes','Observações sobre atividade/licença',2)}
      <p class="muted">A situação regulatória é apenas registrada. O aplicativo não conclui conformidade ou irregularidade automaticamente.</p>
    </section>`;
  }

  function cabinChecklist(s,className){
    return `<section class="box"><h3>Infraestrutura e processo — ${esc(className)}</h3>
      ${textarea(s,'area_description','Descrição da cabine, antecâmara, fluxo e equipamentos',3)}
      ${question(s,'antechamber_ppe','A cabine possui antecâmara/área de acesso com paramentação e EPI compatíveis com o risco?',{nsa:false})}
      ${question(s,'surfaces','Paredes, teto, piso, bancadas e superfícies encontram-se íntegras, limpas e compatíveis com sanitização?',{nsa:false})}
      ${question(s,'independent_air','O sistema de insuflamento/exaustão é independente e encontra-se em funcionamento conforme o projeto/uso previsto?',{nsa:false})}
      ${question(s,'negative_pressure','A cabine é mantida sob pressão negativa em relação às áreas adjacentes?',{nsa:false,requirement:'Pressão negativa. Referência operacional informada no aplicativo: -5 a -120 Pa.'})}
      ${question(s,'raw_material_validity','As matérias-primas correspondem à classe, estão dentro da validade e possuem identificação/situação interna?',{nsa:false})}
      ${question(s,'pure_diluted_storage','Quando aplicável, substâncias puras e diluídas estão identificadas e segregadas adequadamente?',{nsa:true})}
      ${question(s,'restricted_storage','O armazenamento de matérias-primas da classe ocorre em local de acesso restrito/sob guarda compatível?',{nsa:true})}
      ${question(s,'dedicated_utensils','Utensílios e placas encapsuladoras estão separados e identificados para esta classe terapêutica?',{nsa:false})}
      ${question(s,'dirty_transport','Há recipiente exclusivo/identificado para transporte de utensílios sujos à sala de lavagem?',{nsa:true})}
      ${question(s,'weighing_in_cabin','A pesagem é efetuada na área/cabine dedicada conforme o fluxo previsto?',{nsa:false})}
      ${question(s,'double_check','A pesagem/manipulação possui dupla checagem, incluindo farmacêutico quando exigido, com registro?',{nsa:false})}
      ${question(s,'cross_contamination_pop','Há procedimento implantado para prevenção de contaminação cruzada específico/abrangente para a atividade?',{nsa:false})}
      ${question(s,'standardized_excipients','Os excipientes utilizados na classe são padronizados de acordo com a metodologia definida quando aplicável?',{nsa:true})}
      ${photo(s,'area_geral')}
    </section>`;
  }

  function render61(){
    const s='6.1';
    const body=`
      <section class="box"><h3>Requisitos gerais</h3>
        ${textarea(s,'general_description','Descrição geral da estrutura dedicada aos sensibilizantes, antecâmaras e fluxo',3)}
        ${question(s,'dedicated_rooms','As classes sensibilizantes manipuladas dispõem de salas/cabines dedicadas conforme o risco e a atividade?',{nsa:false})}
        ${question(s,'anterooms','As áreas dedicadas possuem antecâmaras/controle de acesso e paramentação compatíveis?',{nsa:false})}
        ${question(s,'independent_exhaust','Os sistemas de ar/exaustão das áreas dedicadas são independentes quando exigido?',{nsa:false})}
        ${question(s,'negative_pressure_general','As salas/cabines operam sob pressão negativa em relação às áreas adjacentes?',{nsa:false,requirement:'Pressão negativa; referência operacional informada no aplicativo: -5 a -120 Pa.'})}
        ${question(s,'dedicated_weighing','A pesagem ocorre na respectiva área dedicada?',{nsa:false})}
        ${question(s,'cleaning_before_after','Balanças, bancadas e superfícies são limpas antes/depois das operações conforme procedimento?',{nsa:false})}
        ${question(s,'utensils_by_class','Utensílios e materiais de processo são separados/identificados por classe terapêutica?',{nsa:false})}
        ${question(s,'ppe_by_risk','Os EPI utilizados são compatíveis com a classe e o risco das operações?',{nsa:false})}
        ${question(s,'cross_contamination_control','Há medidas e procedimentos implantados para prevenção de contaminação cruzada?',{nsa:false})}
        ${question(s,'excipient_standardization','Há padronização dos excipientes/metodologias quando aplicável às classes manipuladas?',{nsa:true})}
        ${photo(s,'estrutura_geral')}
        <p class="muted">A qualificação documental dos sistemas de exaustão é analisada na Seção 7.2. Este bloco verifica a condição física e operacional observada.</p>
        <button type="button" data-fm-jump-section="7.2">Ir para Qualificação do Sistema de Exaustão →</button>
      </section>`;
    return shell(s,'Requisitos gerais dos laboratórios de sensibilizantes',body,{applicable:true});
  }

  function cabinRenderer(s,title,className){
    const body=`${regulatory(s,className)}${cabinChecklist(s,className)}${pressureCard(s)}${balance(s)}${environmental(s)}${refrigeratorCard(s)}${records(s)}`;
    return shell(s,title,body,{applicable:true});
  }

  function render62(){ return cabinRenderer('6.2','Cabine de Hormônios','hormônios'); }
  function render63(){ return cabinRenderer('6.3','Cabine de Antibióticos','antibióticos'); }
  function render64(){ return cabinRenderer('6.4','Cabine de Citostáticos','citostáticos'); }
  function render65(){
    const html=cabinRenderer('6.5','Cabine de Penicilínicos','penicilínicos');
    return html.replace('</h2>','</h2><p class="muted">Bloco específico mantido no aplicativo por decisão do projeto. O roteiro revisado analisado não apresenta um bloco próprio equivalente para penicilínicos; os requisitos técnicos são estruturados segundo o mesmo padrão das demais classes sensibilizantes, sem criar referência normativa inexistente.</p>');
  }

  document.addEventListener('click',e=>{
    const j=e.target.closest('[data-fm-jump-section]');
    if(!j) return;
    const target=j.dataset.fmJumpSection||'';
    const main=target.split('.')[0];
    FM.setActive(main,target.includes('.')?target:'');
  });

  FM.registerRenderer('6.1',render61);
  FM.registerRenderer('6.2',render62);
  FM.registerRenderer('6.3',render63);
  FM.registerRenderer('6.4',render64);
  FM.registerRenderer('6.5',render65);
  window.FarmaciaManipulacaoSection6={render61,render62,render63,render64,render65};
  FM.render();
})();
