/* Farmácia de Manipulação — Seção 5: Laboratórios.
 * Descrição → checklist → equipamentos/monitoramento → planilhas.
 * Aplicabilidade sempre local; nenhuma subseção é ocultada por resposta externa.
 */
(() => {
  'use strict';
  const FM=window.FarmaciaManipulacao;
  if(!FM || window.FarmaciaManipulacaoSection5) return;
  const {field,textarea,select,question,localApplicability,refrigeratorCard,esc}=FM.ui;

  const photo=(s,id,label='📷 Fotografar')=>`<button type="button" data-fm-photo="${esc(s)}|${esc(id)}">${label}</button>`;
  const doc=(s,kind,label)=>`<button type="button" data-fm-doc-request="${esc(s)}|${esc(kind)}">📄 ${esc(label)}</button>`;

  function shell(id,title,body,{applicable=false}={}){
    const sec=FM.ensureSection(FM.getState(),id);
    const app=applicable?localApplicability(id,'Não se aplica a esta inspeção'):'';
    const content=applicable && sec.applicable===false
      ? '<p class="muted">Subseção marcada como não aplicável. Ela permanece disponível e pode ser reativada a qualquer momento.</p>'
      : body;
    return `<div class="panel fm-panel"><div class="subbar"><span class="badge">${esc(id)} · Laboratórios</span><button type="button" data-fm-open-section="5">Laboratórios</button><button type="button" data-fm-home>Todos</button></div><h2>${esc(id)} ${esc(title)}</h2>${app}${content}</div>`;
  }

  function environment(s,{fridge=true}={}){
    return `<section class="box"><h3>Equipamentos e monitoramento ambiental</h3>
      <div class="grid three">${field(s,'env_temp_now','Temperatura — momento (°C)','number','step="0.1"')}${field(s,'env_temp_max','Temperatura — máxima (°C)','number','step="0.1"')}${field(s,'env_temp_min','Temperatura — mínima (°C)','number','step="0.1"')}</div>
      <div class="grid three">${field(s,'env_humidity_now','Umidade — momento (%)','number','step="0.1"')}${field(s,'env_humidity_max','Umidade — máxima (%)','number','step="0.1"')}${field(s,'env_humidity_min','Umidade — mínima (%)','number','step="0.1"')}</div>
      <div class="grid">${field(s,'env_instrument','Termo-higrômetro / instrumento')}${field(s,'env_instrument_id','Identificação')}${field(s,'env_cal_cert','Certificado de calibração nº')}${field(s,'env_cal_validity','Validade da calibração','date')}</div>
      ${question(s,'env_records','Há registros de temperatura e umidade com parâmetros definidos e campo para ação corretiva?',{nsa:true})}
      <div class="actions">${doc(s,'calibracao','Ler certificado de calibração')}${photo(s,'monitoramento_ambiental')}</div>
      ${fridge?refrigeratorCard(s):''}
    </section>`;
  }

  function balanceBlock(s){
    return `<section class="box"><h3>Balança — calibração e verificação diária</h3>
      <div class="grid">${field(s,'balance_id','Identificação da balança')}${field(s,'balance_brand_model','Marca / modelo')}${field(s,'balance_cal_cert','Certificado de calibração nº')}${field(s,'balance_cal_validity','Validade da calibração','date')}</div>
      ${question(s,'balance_compatible','A capacidade e a sensibilidade da balança são compatíveis com as operações realizadas?',{nsa:true})}
      <p class="fm-requirement"><strong>Requisito informado:</strong> verificação diária com peso padrão antes do início das atividades.</p>
      <div class="grid">${field(s,'balance_standard_weight','Peso(s) padrão utilizado(s)')}${field(s,'balance_daily_result','Resultado da verificação')}${select(s,'balance_daily_records','Registros mantidos?',[['','Selecione'],['sim','Sim'],['nao','Não'],['na','Não se aplica']])}</div>
      <div class="actions">${doc(s,'calibracao_balanca','Ler certificado da balança')}${photo(s,'balanca')}</div>
    </section>`;
  }

  function recordsBlock(s,extra=[]){
    const rows=[
      ['records_temp_humidity','Monitoramento de temperatura e umidade, com parâmetros/referência e ação corretiva'],
      ['records_cleaning','Limpeza do laboratório, bancadas e superfícies'],
      ['records_balance','Verificação diária e limpeza da balança, quando aplicável'],
      ['records_exhaust','Limpeza/manutenção do exaustor ou capela, quando aplicável'],
      ...extra
    ];
    return `<section class="box"><h3>Planilhas e registros disponíveis neste laboratório</h3>
      <p class="muted">As planilhas são conferidas dentro do próprio ambiente. Documento em branco ou sem os campos necessários deve ser registrado pela equipe conforme o caso.</p>
      ${rows.map(([id,label])=>question(s,id,label,{nsa:true})).join('')}
      ${photo(s,'planilhas_registros')}
    </section>`;
  }

  function equipmentFields(s){
    return `<section class="box"><h3>Equipamentos e instrumentos adicionais</h3>
      <p class="muted">Registrar apenas os equipamentos efetivamente existentes/avaliados. A qualificação documental do sistema de exaustão fica na Seção 7.2.</p>
      <div class="grid">${field(s,'equipment_1','Equipamento 1')}${field(s,'equipment_1_id','Identificação')}${field(s,'equipment_1_cert','Certificado nº')}${field(s,'equipment_1_validity','Validade','date')}</div>
      <div class="grid">${field(s,'equipment_2','Equipamento 2')}${field(s,'equipment_2_id','Identificação')}${field(s,'equipment_2_cert','Certificado nº')}${field(s,'equipment_2_validity','Validade','date')}</div>
      <div class="grid">${field(s,'equipment_3','Equipamento 3')}${field(s,'equipment_3_id','Identificação')}${field(s,'equipment_3_cert','Certificado nº')}${field(s,'equipment_3_validity','Validade','date')}</div>
      ${textarea(s,'equipment_other','Outros equipamentos / instrumentos e observações',3)}
      <div class="actions">${doc(s,'calibracao','Ler certificado de calibração')}${photo(s,'equipamentos')}</div>
    </section>`;
  }

  function render51(){
    const s='5.1';
    const body=`
      <section class="box"><h3>Descrição do almoxarifado</h3>
        ${textarea(s,'area_description','Descrição do ambiente, fluxo, estantes/armários e organização',3)}
        ${field(s,'storage_capacity','Capacidade / organização geral do armazenamento')}
        ${textarea(s,'special_storage','Locais especiais: controlados, SBIT, inflamáveis/corrosivos e outros',2)}
        ${photo(s,'area_geral')}
      </section>
      <section class="box"><h3>Checklist sanitário</h3>
        ${question(s,'restricted_access','O acesso ao almoxarifado é restrito a pessoal autorizado?',{nsa:false})}
        ${question(s,'adequate_capacity_clean','A área possui capacidade adequada, encontra-se limpa, organizada e com condições ambientais compatíveis?',{nsa:false})}
        ${question(s,'off_floor_walls','Matérias-primas e materiais de embalagem permanecem afastados do piso e organizados de forma a permitir limpeza e inspeção?',{nsa:false})}
        ${question(s,'identified_status_validity','Os materiais possuem identificação, validade e situação interna claramente definidas?',{nsa:false})}
        ${question(s,'quarantine','Há segregação/identificação dos materiais em quarentena até a liberação?',{nsa:true})}
        ${question(s,'rejected_expired','Materiais reprovados, devolvidos ou vencidos estão segregados, identificados e com destinação controlada?',{nsa:true})}
        ${question(s,'controlled_secure','Substâncias sujeitas a controle especial e, quando aplicável, SBIT permanecem sob guarda/segurança compatível?',{nsa:true})}
        ${question(s,'flammable_corrosive','Inflamáveis, corrosivos ou outros materiais de risco estão armazenados em condições seguras e segregadas?',{nsa:true})}
        ${question(s,'weighing_area','Quando há pesagem/transferência no setor, ela ocorre em local e condição que previnam contaminação e misturas?',{nsa:true})}
        ${question(s,'packaging_traceability','Os materiais de embalagem mantêm identificação e rastreabilidade até sua utilização?',{nsa:true})}
        ${question(s,'supplier_qualification','Os fornecedores utilizados estão cadastrados/qualificados conforme o sistema da qualidade?',{nsa:true})}
        ${question(s,'stock_entries_outputs','Há controle de entradas, saídas e saldo dos materiais armazenados?',{nsa:true})}
      </section>
      ${environment(s)}
      ${recordsBlock(s,[['records_stock','Registros de estoque, entradas/saídas e segregação/quarentena, quando aplicável']])}
    `;
    return shell(s,'Almoxarifado de matérias-primas e/ou materiais de embalagem',body);
  }

  function render52(){
    const s='5.2';
    const body=`
      <section class="box"><h3>Descrição do Controle de Qualidade</h3>
        ${textarea(s,'area_description','Descrição da área, bancada, fluxo, equipamentos e armazenamento de amostras/reagentes',3)}
        ${field(s,'responsible_staff','Responsável(is) / pessoal do CQ')}
        ${textarea(s,'references','Referências farmacopeicas / métodos disponíveis',2)}
        ${photo(s,'area_geral')}
      </section>
      <section class="box"><h3>Checklist sanitário</h3>
        ${question(s,'specific_area','Existe área específica e adequada para as atividades de Controle de Qualidade?',{nsa:false})}
        ${question(s,'trained_staff','O pessoal envolvido está treinado/capacitado para as atividades executadas?',{nsa:false})}
        ${question(s,'procedures_methods','Há procedimentos e métodos de análise disponíveis e compatíveis com os ensaios realizados?',{nsa:false})}
        ${question(s,'pharmacopoeial_references','Há referências farmacopeicas/compêndios aplicáveis disponíveis ao CQ?',{nsa:true})}
        ${question(s,'fume_hood','Quando há manipulação analítica de substâncias voláteis/tóxicas, há capela/exaustão apropriada?',{nsa:true})}
        ${question(s,'sds','As fichas de segurança/informações de risco dos produtos químicos utilizados estão disponíveis quando aplicável?',{nsa:true})}
        ${question(s,'sampling_cross_contamination','A amostragem é realizada de modo a evitar contaminação e contaminação cruzada?',{nsa:false})}
        ${question(s,'quarantine_rejected_samples','Amostras/materiais em quarentena, aprovados e reprovados estão identificados e segregados conforme a situação?',{nsa:true})}
        ${question(s,'reanalysis','Quando necessária, a reanálise possui critérios e registros definidos?',{nsa:true})}
        ${question(s,'supplier_rejection_notification','Há registro/tratamento das reprovações e comunicação ao fornecedor quando aplicável?',{nsa:true})}
        ${question(s,'equipment_calibrated','Os equipamentos e instrumentos que exigem calibração estão identificados e com calibração controlada?',{nsa:false})}
      </section>
      <section class="box"><h3>Equipamentos usuais do CQ</h3>
        <div class="grid">${field(s,'phmeter_id','pHmetro — identificação')}${field(s,'phmeter_cert','pHmetro — certificado')}${field(s,'phmeter_validity','pHmetro — validade','date')}${field(s,'melting_point','Ponto de fusão — identificação/certificado')}</div>
        <div class="grid">${field(s,'standard_weights','Pesos padrão — identificação/certificado')}${field(s,'pycnometer','Picnômetro — identificação')}${field(s,'glassware','Vidrarias / identificação')}${field(s,'hood_id','Capela/exaustor — identificação')}</div>
        ${textarea(s,'other_equipment','Outros equipamentos / instrumentos',2)}
        ${doc(s,'calibracao','Ler certificado de calibração')}
      </section>
      ${balanceBlock(s)}
      ${environment(s)}
      ${recordsBlock(s,[['records_phmeter','Verificação/calibração do pHmetro, quando aplicável'],['records_corrective_action','Registros possuem campo e preenchimento de ação corretiva quando necessário']])}
    `;
    return shell(s,'Controle de Qualidade (CQ)',body);
  }

  function render53(){
    const s='5.3';
    const body=`
      <section class="box"><h3>Descrição do laboratório</h3>
        ${textarea(s,'area_description','Descrição do laboratório de Semissólidos e Líquidos, fluxo, bancadas e equipamentos',3)}
        ${textarea(s,'utensils','Utensílios / identificação para uso interno e externo',2)}
        ${photo(s,'area_geral')}
      </section>
      <section class="box"><h3>Checklist sanitário</h3>
        ${question(s,'segregated_room','A sala está segregada dos demais laboratórios de forma compatível com as operações realizadas?',{nsa:false})}
        ${question(s,'utensils_identified','Os utensílios estão diferenciados e identificados conforme o uso e o risco de contaminação cruzada?',{nsa:false})}
        ${question(s,'raw_material_validity','As matérias-primas estão identificadas, dentro da validade e com situação interna definida?',{nsa:false})}
        ${question(s,'concentrated_diluted_alert','Matérias-primas concentradas e diluídas possuem os alertas/identificações previstos?',{nsa:true})}
        ${question(s,'purified_water_container','O frasco/recipiente de água purificada possui identificação da data e hora de coleta e é sanitizado a cada troca?',{nsa:true,requirement:'Uso da água armazenada por período inferior a 24 horas.'})}
        ${question(s,'cross_contamination','Os procedimentos e a organização do laboratório previnem contaminação cruzada e microbiológica?',{nsa:false})}
      </section>
      <section class="box"><h3>Sistema de purificação de água</h3>
        <div class="grid">${field(s,'purifier_method','Método de purificação')}${field(s,'purifier_brand','Marca')}${field(s,'purifier_model','Modelo')}${field(s,'purifier_id','Identificação')}</div>
        <div class="grid">${field(s,'purifier_component_change','Troca de resina/carvão/filtros — executada por')}${field(s,'purifier_change_date','Data da troca','date')}${field(s,'purifier_change_validity','Próxima troca / validade','date')}</div>
        ${question(s,'purifier_maintenance_records','Há registros de limpeza, manutenção e troca dos componentes/filtros do sistema de purificação?',{nsa:true})}
        ${photo(s,'purificador')}
      </section>
      ${balanceBlock(s)}
      ${equipmentFields(s)}
      ${environment(s)}
      <section class="box"><h3>Bases galênicas / estoque mínimo — quando aplicável</h3>
        ${field(s,'galenic_base_name','Base verificada')}${field(s,'galenic_base_lot','Lote')}${field(s,'galenic_base_validity','Validade','date')}
        ${question(s,'galenic_base_traceability','A ordem de manipulação da base permite rastrear os insumos e o processo?',{nsa:true})}
        ${question(s,'galenic_base_30_days','Quando aplicável ao estoque mínimo, a identificação e utilização observam o prazo definido?',{nsa:true,requirement:'Identificação de “uso em 30 dias”, quando aplicável.'})}
        ${question(s,'galenic_base_inprocess','Há controle em processo lote a lote conforme o requisito aplicável?',{nsa:true})}
        ${question(s,'galenic_reference_sample','A amostra de referência é mantida pelo período exigido?',{nsa:true,requirement:'Até 4 meses após o vencimento, quando aplicável ao estoque mínimo.'})}
      </section>
      ${recordsBlock(s,[['records_phmeter','Registros de verificação do pHmetro, quando aplicável'],['records_purifier','Limpeza/manutenção do purificador e troca de filtros/componentes'],['records_refrigerator','Controle do refrigerador, quando existente']])}
    `;
    return shell(s,'Laboratório de Semissólidos e Líquidos',body);
  }

  function render54(){
    const s='5.4';
    const body=`
      <section class="box"><h3>Descrição do laboratório</h3>
        ${textarea(s,'area_description','Descrição do laboratório de Sólidos, fluxo, bancadas, exaustão e equipamentos',3)}
        ${textarea(s,'utensils','Utensílios / placas encapsuladoras e identificação',2)}
        ${photo(s,'area_geral')}
      </section>
      <section class="box"><h3>Checklist sanitário</h3>
        ${question(s,'segregated_room','A sala está segregada dos demais laboratórios de forma compatível com as operações realizadas?',{nsa:false})}
        ${question(s,'powder_exhaust','Nas etapas com geração de pó, há sistema de exaustão em funcionamento e utilizado adequadamente?',{nsa:false})}
        ${question(s,'utensils_identified','Utensílios e equipamentos estão diferenciados/identificados de modo a prevenir contaminação cruzada?',{nsa:false})}
        ${question(s,'raw_material_validity','As matérias-primas estão identificadas, dentro da validade e com situação interna definida?',{nsa:false})}
        ${question(s,'concentrated_diluted_alert','Matérias-primas concentradas e diluídas possuem os alertas/identificações previstos?',{nsa:true})}
        ${question(s,'standardized_excipients','Os excipientes utilizados são padronizados conforme o processo/formulação?',{nsa:true})}
        ${question(s,'finished_weight_control','O controle do produto acabado contempla peso médio e seus registros estatísticos aplicáveis?',{nsa:true,requirement:'Registrar peso médio, desvio-padrão (DP) e coeficiente de variação (CV), quando aplicável.'})}
        ${question(s,'controlled_locked','Substâncias/preparações sujeitas a controle especial permanecem sob dispositivo de segurança e guarda do farmacêutico?',{nsa:true})}
      </section>
      ${balanceBlock(s)}
      ${equipmentFields(s)}
      ${environment(s)}
      <section class="box"><h3>Controlados — confronto de estoque</h3>
        <p class="muted">A condição física de guarda é conferida aqui. O confronto entre estoque físico e escriturado de matérias-primas controladas é centralizado na Seção 9.5, evitando duplicação.</p>
        <button type="button" data-fm-jump-section="9.5">Realizar confronto de estoque → Seção 9.5</button>
      </section>
      ${recordsBlock(s,[['records_weight_average','Registros de peso médio / DP / CV, quando aplicável'],['records_refrigerator','Controle do refrigerador, quando existente']])}
    `;
    return shell(s,'Laboratório de Sólidos',body);
  }

  function render55(){
    const s='5.5';
    const body=`
      <section class="box"><h3>Descrição da área de lavagem</h3>
        ${textarea(s,'area_description','Descrição do local, pia/bancada, fluxo e equipamentos',3)}
        ${field(s,'washing_products','Produtos utilizados na lavagem / sanitização')}
        ${field(s,'drying_equipment','Estufa / equipamento de secagem, quando houver')}
        ${photo(s,'area_geral')}
      </section>
      <section class="box"><h3>Checklist sanitário</h3>
        ${question(s,'specific_area','Há área específica para lavagem de utensílios e materiais de embalagem ou condição formalmente definida para execução no próprio laboratório?',{nsa:false})}
        ${question(s,'written_procedure_different_time','Quando a lavagem ocorre no próprio laboratório, há procedimento escrito e horário distinto da manipulação?',{nsa:true})}
        ${question(s,'schedule_by_class','Há cronograma/organização de lavagem por classe terapêutica quando necessário para prevenir contaminação cruzada?',{nsa:true})}
        ${question(s,'brushes_separated','Escovas, buchas e utensílios de limpeza estão separados e identificados por classe/uso quando necessário?',{nsa:true})}
        ${question(s,'dirty_transport','Existem recipientes exclusivos/identificados para transporte de utensílios sujos entre os laboratórios e a sala de lavagem?',{nsa:true})}
        ${question(s,'clean_dirty_flow','O fluxo de utensílios sujos e limpos é organizado de forma a evitar recontaminação?',{nsa:false})}
        ${question(s,'drying_storage','A secagem e a guarda dos utensílios limpos ocorrem em condições adequadas?',{nsa:true})}
      </section>
      ${refrigeratorCard(s)}
      ${recordsBlock(s,[['records_washing_schedule','Cronograma/registros de lavagem por classe ou tipo de utensílio, quando aplicável']])}
    `;
    return shell(s,'Lavagem de utensílios e materiais de embalagem',body);
  }

  function render56(){
    const s='5.6';
    const body=`
      <section class="box"><h3>Descrição da Homeopatia</h3>
        ${textarea(s,'area_description','Descrição da sala, fluxo, equipamentos e armazenamento das matrizes',3)}
        ${textarea(s,'matrices_storage','Matrizes / tinturas-mãe — organização e identificação',2)}
        ${photo(s,'area_geral')}
      </section>
      <section class="box"><h3>Checklist sanitário</h3>
        ${question(s,'exclusive_room','Há sala exclusiva para manipulação de preparações homeopáticas?',{nsa:false})}
        ${question(s,'low_odour_radiation','O ambiente está protegido de odores fortes e fontes/condições incompatíveis com as preparações homeopáticas?',{nsa:false})}
        ${question(s,'matrices_identified','Matrizes, tinturas-mãe e demais insumos estão identificados, dentro da validade e com rastreabilidade?',{nsa:false})}
        ${question(s,'exclusive_instruments','Balança, alcoômetro e outros instrumentos de uso específico/exclusivo estão identificados e controlados quando aplicável?',{nsa:true})}
        ${question(s,'inactivation_oven','Quando utilizada, a estufa de inativação possui controle e registros de tempo/temperatura?',{nsa:true})}
        ${question(s,'alcohol_traceability','Há rastreabilidade dos álcoois/veículos empregados nas preparações?',{nsa:true})}
        ${question(s,'dynamization_traceability','As dinamizações mantêm identificação e rastreabilidade desde a matriz de origem?',{nsa:false})}
        ${question(s,'homeopathy_qc','São realizados os controles de qualidade aplicáveis aos insumos/preparações homeopáticas?',{nsa:true})}
        ${question(s,'autoisotherapics','Quando houver autoisoterápicos, são observados os requisitos específicos aplicáveis?',{nsa:true})}
      </section>
      <section class="box"><h3>Instrumentos específicos</h3>
        <div class="grid">${field(s,'alcoholmeter_id','Alcoômetro — identificação')}${field(s,'alcoholmeter_cert','Alcoômetro — certificado')}${field(s,'alcoholmeter_validity','Alcoômetro — validade','date')}${field(s,'oven_id','Estufa — identificação')}</div>
        <div class="grid">${field(s,'oven_cert','Estufa — certificado')}${field(s,'oven_validity','Estufa — validade','date')}${field(s,'dynamizer','Dinamizador — identificação')}${field(s,'other_homeopathy_equipment','Outros equipamentos')}</div>
        ${doc(s,'calibracao','Ler certificado de calibração')}
      </section>
      ${balanceBlock(s)}
      ${environment(s)}
      ${recordsBlock(s,[['records_alcoholmeter','Registros/verificações do alcoômetro, quando aplicável'],['records_oven','Registros de tempo/temperatura da estufa, quando aplicável'],['records_dynamization','Registros de preparo/rastreabilidade das dinamizações']])}
    `;
    return shell(s,'Laboratório de Homeopatia',body,{applicable:true});
  }

  function render57(){
    const s='5.7';
    const body=`
      <section class="box"><h3>Caracterização da atividade SBIT</h3>
        <div class="grid">${select(s,'license_status','Situação da licença',[['','Selecione'],['licenciada','Licenciada'],['solicitacao','Em solicitação / ampliação'],['sem_licenca','Sem licença'],['na','Não se aplica']])}${field(s,'substances','Substância(s) de Baixo Índice Terapêutico manipulada(s)')}${field(s,'suppliers','Fornecedor(es)')}</div>
        ${textarea(s,'area_description','Local/fluxo utilizado e particularidades da manipulação de SBIT',3)}
        ${photo(s,'area_geral')}
        <p class="muted">A situação da licença é registrada para análise da equipe e não gera conclusão automática.</p>
      </section>
      <section class="box"><h3>Checklist SBIT</h3>
        ${question(s,'special_identification','As matérias-primas/preparações SBIT possuem identificação e alertas compatíveis com sua condição?',{nsa:false})}
        ${question(s,'restricted_storage','O armazenamento é segregado/restrito e sob controle do farmacêutico quando exigido?',{nsa:false})}
        ${question(s,'weighing_double_check','A pesagem para diluição possui dupla checagem, incluindo farmacêutico, com registro?',{nsa:true})}
        ${question(s,'capsule_adequacy','A escolha da cápsula e demais componentes é compatível com a formulação e o processo estabelecido?',{nsa:true})}
        ${question(s,'dissolution_profile','Há perfil de dissolução/estudo aplicável à formulação e ele é considerado na padronização do processo?',{nsa:true})}
        ${question(s,'standardized_excipients','Os excipientes são padronizados considerando o perfil de dissolução e a metodologia definida?',{nsa:true})}
        ${question(s,'pharmaceutical_care','A dispensação contempla atenção farmacêutica e orientações pertinentes ao uso da SBIT?',{nsa:true})}
      </section>
      <section class="box"><h3>SBIT de baixa dosagem e alta potência — requisitos adicionais</h3>
        <p class="fm-requirement"><strong>Aplicação específica:</strong> utilizar quando a substância/formulação estiver sujeita aos requisitos adicionais de baixa dosagem e alta potência.</p>
        ${question(s,'geometric_dilution','A diluição/homogeneização utiliza metodologia definida, incluindo diluição geométrica quando aplicável?',{nsa:true})}
        ${question(s,'diluted_identification','As SBIT diluídas estão claramente identificadas como concentrado/diluído conforme o caso?',{nsa:true})}
        ${question(s,'diluted_initial_assay','É realizada análise de teor de cada diluído após o preparo?',{nsa:true})}
        ${question(s,'diluted_quarterly','Há monitoramento do diluído armazenado, com coleta representativa?',{nsa:true,requirement:'Periodicidade trimestral; coleta em pelo menos três pontos, quando aplicável.'})}
        ${question(s,'full_formula_quarterly','É realizada análise completa de formulação contendo SBIT em sistema de rodízio?',{nsa:true,requirement:'No mínimo uma formulação a cada 3 meses, contemplando diferentes manipuladores, fármacos, dosagens e formas.'})}
        ${question(s,'monitoring_method_pop','Há procedimento/metodologia definida para o monitoramento do processo magistral de SBIT?',{nsa:true})}
        ${question(s,'results_retention','Os resultados do monitoramento são arquivados pelo período exigido?',{nsa:true,requirement:'Mínimo de 2 anos.'})}
        ${question(s,'unsatisfactory_reanalysis','Em resultado insatisfatório, há registro das medidas adotadas e avaliação da efetividade por nova análise?',{nsa:true})}
        <p class="muted">Os laudos/resultados detalhados de monitoramento são lançados na Seção 8 para evitar duplicação.</p>
        <button type="button" data-fm-jump-section="8">Ir para Monitoramento do Processo Magistral →</button>
      </section>
      ${environment(s)}
      ${recordsBlock(s,[['records_sbit_process','Registros operacionais de pesagem/diluição/homogeneização'],['records_sbit_monitoring','Registros do monitoramento trimestral e do sistema de rodízio']])}
    `;
    return shell(s,'Substâncias de Baixo Índice Terapêutico (SBIT)',body,{applicable:true});
  }

  document.addEventListener('click',e=>{
    const j=e.target.closest('[data-fm-jump-section]');
    if(!j) return;
    const target=j.dataset.fmJumpSection||'';
    const main=target.split('.')[0];
    FM.setActive(main,target.includes('.')?target:'');
  });

  FM.registerRenderer('5.1',render51);
  FM.registerRenderer('5.2',render52);
  FM.registerRenderer('5.3',render53);
  FM.registerRenderer('5.4',render54);
  FM.registerRenderer('5.5',render55);
  FM.registerRenderer('5.6',render56);
  FM.registerRenderer('5.7',render57);
  window.FarmaciaManipulacaoSection5={render51,render52,render53,render54,render55,render56,render57};
  FM.render();
})();
