/* Farmácia de Manipulação — Seção 7: Documentos Apresentados.
 * Documentos complexos são avaliados por checklist; OCR somente para metadados quando útil.
 */
(() => {
  'use strict';
  const FM=window.FarmaciaManipulacao;
  if(!FM || window.FarmaciaManipulacaoSection7) return;
  const {field,textarea,select,question,localApplicability,esc}=FM.ui;
  const photo=(s,id)=>`<button type="button" data-fm-photo="${esc(s)}|${esc(id)}">📷</button>`;
  const doc=(s,kind,label='Extrair dados')=>`<button type="button" data-fm-doc-request="${esc(s)}|${esc(kind)}">📄 ${esc(label)}</button>`;
  const statusOpts=[['','Selecione'],['conferido','Apresentado e conferido'],['observacao','Apresentado com observação'],['nao_apresentado','Não apresentado'],['atualizar','Necessita atualização/complementação'],['na','Não se aplica']];

  function header(id,title){
    return `<div class="subbar"><span class="badge">${esc(id)} · Documentos</span><button type="button" data-fm-open-section="7">Documentos</button><button type="button" data-fm-home>Todos</button></div><h2>${esc(id)} ${esc(title)}</h2>`;
  }

  function copyButton(section='7'){
    return `<button type="button" class="primary" data-fm-copy-section="${esc(section)}">📋 Copiar texto desta seção</button>`;
  }

  function documentItem(s,id,title,{ocr='',meta=true,complex=false,checklist=[]}={}){
    return `<section class="box fm-doc-card"><h3>${esc(title)}</h3>
      <div class="grid">${select(s,id+'_status','Situação',statusOpts)}${meta?field(s,id+'_number','Número / identificação'):''}${meta?field(s,id+'_date','Emissão / revisão / validade ou período'):''}</div>
      ${meta?field(s,id+'_issuer','Emitente / responsável / empresa'):''}
      ${complex?textarea(s,id+'_identification','Identificação do documento: título, código, versão/revisão, data e responsável',2):''}
      ${checklist.map(([qid,label,req])=>question(s,id+'_'+qid,label,{nsa:true,requirement:req||''})).join('')}
      ${textarea(s,id+'_notes','Anotações / observações',2)}
      <div class="actions">${ocr?doc(s,ocr):''}${photo(s,id)}</div>
    </section>`;
  }

  function render7(){
    const s='7';
    const body=`<div class="panel fm-panel">${header('7','Documentos Apresentados')}
      <p class="muted">Registrar o documento uma única vez. Quando o mesmo documento comprovar requisito de outra seção, o aplicativo deve apenas relacioná-lo, sem nova leitura. OCR serve para extração de metadados e nunca para decisão sanitária.</p>
      <div class="actions"><button type="button" data-fm-open-subsection="7.1">Abrir 7.1 POPs</button><button type="button" data-fm-open-subsection="7.2">Abrir 7.2 Qualificação de Exaustão</button>${copyButton('7')}</div>
      ${documentItem(s,'crt','Certidão de Regularidade Técnica — CRF',{ocr:'crt',checklist:[['rt_match','A certidão corresponde ao estabelecimento e permite conferir RT e substitutos?'],['schedule','Os horários de assistência farmacêutica podem ser conferidos no documento?']]})}
      ${documentItem(s,'license','Licença Sanitária',{ocr:'licenca_sanitaria',checklist:[['holder','Titular/CNPJ correspondem ao estabelecimento?'],['activities','Atividades e grupos licenciados foram conferidos?']]})}
      ${documentItem(s,'avcb','AVCB / CLCB',{ocr:'avcb_clcb',checklist:[['valid','O documento apresentado está vigente/compatível com o estabelecimento?']]})}
      ${documentItem(s,'water_tank','Comprovante de limpeza da caixa d’água',{ocr:'limpeza_caixa_agua',checklist:[['service','Constam identificação do serviço, data de execução e empresa responsável?']]})}
      ${documentItem(s,'pests','Controle de pragas e vetores',{ocr:'controle_pragas',checklist:[['licensed_company','O serviço foi executado por empresa regular/licenciada conforme informação disponível?'],['scope','O comprovante identifica o serviço realizado e o estabelecimento atendido?']]})}
      ${documentItem(s,'pmoc','PMOC do sistema de climatização',{ocr:'pmoc_metadados',complex:true,checklist:[['equipment','Identifica os equipamentos/ambientes climatizados?'],['maintenance','Contempla manutenção preventiva e itens revistos?'],['revision','Há revisão/período de execução identificado?']]})}
      ${documentItem(s,'mbpm','Manual de Boas Práticas de Manipulação',{complex:true,checklist:[['identity','Contém identificação e atividades do estabelecimento?'],['infrastructure','Descreve infraestrutura, salas, equipamentos e fluxos?'],['human_resources','Contempla recursos humanos, responsabilidades e atribuições?'],['cleaning','Contempla limpeza/sanitização e uniformes?'],['environment_water','Contempla controle ambiental e água purificada?'],['raw_materials','Contempla aquisição, amostragem, CQ e armazenamento de matérias-primas/embalagens?'],['manipulation','Contempla condições de manipulação e laboratórios?'],['magistral_monitoring','Contempla monitoramento do processo magistral?'],['labelling_transport','Contempla rotulagem, embalagem, conservação e transporte?'],['quality_system','Contempla sistema da qualidade, gestão documental, autoinspeção e reclamações?'],['org_flow','Possui organograma e fluxograma?']]})}
      ${documentItem(s,'mbpf','Manual de Boas Práticas Farmacêuticas — quando houver drogaria/serviços',{complex:true,checklist:[['applicable_content','O conteúdo é compatível com as atividades de dispensação/serviços efetivamente realizadas?']]})}
      ${documentItem(s,'pcmsO','PCMSO — conferência detalhada na Seção 3',{complex:true,checklist:[['linked_review','O PCMSO analisado na Seção 3 foi apresentado e identificado nesta relação documental?']]})}
      ${documentItem(s,'pgr','PGR — conferência detalhada na Seção 3',{complex:true,checklist:[['linked_review','O PGR analisado na Seção 3 foi apresentado e identificado nesta relação documental?']]})}
      ${documentItem(s,'pgrss','PGRSS / Manual de Gerenciamento de Resíduos',{complex:true,checklist:[['identity_team','Identifica estabelecimento/equipe e responsabilidades?'],['classification','Classifica os grupos de resíduos gerados?'],['generation','Relaciona geração por ambiente e, quando disponível, estimativa de quantidade?'],['handling','Descreve segregação, acondicionamento, identificação, manejo e armazenamento?'],['incompatibility','Contempla incompatibilidades e substâncias que exigem segregação específica?'],['controlled_waste','Contempla destinação/inutilização de substâncias controladas quando aplicável?'],['current','O documento encontra-se atualizado em relação à estrutura e às atividades atuais?']]})}
      ${documentItem(s,'floor_plan','Planta baixa / croqui das áreas',{complex:true,checklist:[['areas','Representa os ambientes e fluxos observados?'],['air_system','Representa exaustão/ar-condicionado e, quando aplicável, sistemas/dutos independentes dos sensibilizantes?']]})}
      ${documentItem(s,'controlled_licenses','Licenças de produtos químicos controlados — Polícia Civil / Polícia Federal / Exército',{ocr:'licencas_controlados',checklist:[['scope','As autorizações apresentadas contemplam as substâncias/atividades aplicáveis?']]})}
      ${documentItem(s,'mapa','Registro / certificado MAPA — quando aplicável',{ocr:'mapa',checklist:[['identity','O documento corresponde ao estabelecimento/atividade declarada?']]})}
      ${documentItem(s,'afe_ae','Autorizações ANVISA — AFE e AE',{ocr:'afe_ae',checklist:[['afe','AFE foi conferida?'],['ae','AE foi conferida quando aplicável?']]})}
      ${documentItem(s,'maps_balances','Comprovantes dos mapas e balanços — Portaria 344/98',{meta:false,checklist:[['last_three','Foram apresentados os comprovantes/registros recentes solicitados pela equipe?']]})}
      ${documentItem(s,'complaints','Registros de reclamações de clientes',{meta:false,checklist:[['records','Há registros com dados da reclamação, investigação/análise e medidas adotadas?']]})}
      ${documentItem(s,'self_inspection','Registro da última autoinspeção',{meta:true,checklist:[['annual','A autoinspeção foi realizada na periodicidade mínima prevista?', 'Periodicidade informada no roteiro: mínimo anual.'],['actions','As constatações e ações decorrentes estão registradas quando aplicável?']]})}
      ${documentItem(s,'training','Programa e registros de treinamento — conferência detalhada na Seção 3',{meta:false,checklist:[['linked_review','Os registros analisados na Seção 3 estão identificados nesta relação documental?']]})}
      ${documentItem(s,'suppliers','Qualificação de fornecedores',{complex:true,checklist:[['criteria','Há critérios e registros de qualificação dos fornecedores utilizados?'],['audit','Quando aplicável, foram apresentadas auditorias/avaliações de BPF, fracionamento ou distribuição?'],['validity','A situação/validade das avaliações foi conferida?']]})}
      ${documentItem(s,'third_party_lab','Contrato com laboratório terceirizado para monitoramento magistral',{complex:true,checklist:[['object','O objeto contratual contempla as análises terceirizadas realizadas?'],['lab_identity','Laboratório/CNPJ estão identificados?'],['license','Foi conferida a regularidade/licença aplicável do laboratório?']]})}
      ${documentItem(s,'maintenance_program','Programa de manutenção preventiva',{complex:true,checklist:[['equipment','Abrange os equipamentos críticos existentes?'],['purifier','Inclui o sistema de purificação de água quando existente?'],['exhaust','Inclui exaustores/sistemas de ar quando existentes?'],['air_conditioning','Inclui climatização quando aplicável?'],['records','Há registros de execução/manutenção?']]})}
      ${documentItem(s,'raw_material_list','Relação alfabética das matérias-primas utilizadas',{meta:false,checklist:[['updated','A relação apresentada está atualizada e coerente com as matérias-primas observadas por amostragem?']]})}
      ${documentItem(s,'book_system','Sistema informatizado / Livro de Receituário e termos',{meta:false,checklist:[['system','Sistema/livro utilizado foi identificado?'],['opening_closing','Termos de abertura/encerramento foram apresentados quando aplicáveis?'],['authorization','Autorização de informatização foi apresentada quando aplicável?']]})}
      ${documentItem(s,'corporate','Cartão CNPJ / Contrato Social / alterações',{meta:false,checklist:[['identity','Os dados societários necessários à inspeção foram conferidos?']]})}
      ${copyButton('7')}
    </div>`;
    return body;
  }

  const popGroups=[
    ['RH e Paramentação',[
      ['paramentacao','Processo de paramentação','Itens 3.3.7/3.3.8'],['higiene','Higiene e conduta pessoal','Item 3.3'],['treinamento','Treinamento e capacitação','Item 3.2']]],
    ['Matérias-primas e Embalagens',[
      ['recebimento','Recebimento e inspeção','Item 7.2'],['fornecedores','Qualificação de fornecedores','Item 7.1.6'],['amostragem','Amostragem de insumos','Item 7.3.20'],['diluicao','Diluição geométrica','Item 7.4.6'],['excipientes','Padronização de excipientes','Item 8.2'],['estoque','Controle de estoque — entradas/saídas','Itens 7.4.7 a 7.4.9']]],
    ['Laboratórios e Manipulação',[
      ['formas','Manipulação das formas farmacêuticas','Item 8'],['controlados','Manipulação de controlados','Portaria 344/98'],['sensibilizantes','Manipulação de sensibilizantes','Anexo III'],['sbit','Manipulação de SBIT','Anexo II'],['bases','Preparação de bases galênicas','Itens 10 e 11'],['cross','Prevenção de contaminação cruzada','Item 8.6'],['balancas','Verificação diária das balanças','Item 5.2.2']]],
    ['Controle de Qualidade e Água',[
      ['cq_insumos','Ensaios de CQ de insumos/embalagens','Item 7.3.2'],['cq_produto','Ensaios mínimos do produto acabado','Item 9.1.1'],['monitoramento','Metodologia do monitoramento magistral','Item 9.2.6'],['agua','Amostragem de água purificada/potável','Itens 7.5.1.2/7.5.2.3'],['agua_nc','Medidas para laudo de água insatisfatório','Itens 7.5.1.6/7.5.2.4'],['purificador','Limpeza/manutenção do purificador','Item 7.5.2.1']]],
    ['Equipamentos, Limpeza e Estrutura',[
      ['manutencao','Manutenção preventiva/corretiva dos equipamentos','Item 5.3'],['exaustor','Qualificação/manutenção do exaustor e filtros','Item 8.7'],['limpeza','Limpeza e sanitização de ambientes','Item 6'],['temp_umidade','Registro de temperatura e umidade','Itens 4.2.1/8.8']]],
    ['Dispensação, Garantia da Qualidade e Atendimento',[
      ['prescricao','Avaliação farmacêutica da prescrição','Item 5.18.4'],['calculos','Fatores de conversão/correção/equivalência','Item 5.18.6'],['transporte','Conservação/transporte de medicamentos','Item 13'],['reclamacao','Reclamação de cliente','Item 15.7'],['autoinspecao','Autoinspeção','Itens 3.1.1 “u” e 15.6']]]
  ];

  function popRow(s,id,title,reference){
    return `<div class="box fm-pop-row"><h4>${esc(title)}</h4><div class="grid">${select(s,id+'_status','Situação',[['','Selecione'],['sim','Apresentado'],['nao','Não apresentado'],['observacao','Apresentado com observação'],['na','Não se aplica']])}${field(s,id+'_number','POP nº / código')}${field(s,id+'_revision','Revisão / versão')}${field(s,id+'_date','Data')}</div><p class="muted">Referência do roteiro: ${esc(reference)}. O conteúdo pode estar em POP geral ou em documento que contemple várias atividades; não é exigido um POP separado só por causa desta linha.</p>${field(s,id+'_covered_by','Se contemplado em outro POP, indicar qual')}${select(s,id+'_matches_practice','Corresponde à prática observada?',[['','Selecione'],['sim','Sim'],['nao','Não'],['na','Não avaliado / NA']])}${textarea(s,id+'_notes','Anotações',2)}${photo(s,id)}</div>`;
  }

  function render71(){
    const s='7.1';
    return `<div class="panel fm-panel">${header(s,'Procedimentos Operacionais Padronizados (POPs)')}${localApplicability(s,'Não se aplica a esta inspeção')}${FM.ensureSection(FM.getState(),s).applicable===false?'<p class="muted">Subseção marcada como não aplicável.</p>':popGroups.map(([group,items])=>`<section><h3>${esc(group)}</h3>${items.map(([id,t,r])=>popRow(s,id,t,r)).join('')}</section>`).join('')}${copyButton('7')}</div>`;
  }

  function render72(){
    const s='7.2';
    const sec=FM.ensureSection(FM.getState(),s);
    const content=`<section class="box"><h3>Identificação da qualificação</h3><div class="grid">${field(s,'document_numbers','Nº(s) do documento / qualificação')}${field(s,'execution_date','Data de execução','date')}${field(s,'company','Empresa executora')}${field(s,'responsible','Responsável técnico')}</div><div class="grid">${field(s,'professional_registration','Registro profissional')}${field(s,'validity','Validade / revisão, se houver')}</div>${textarea(s,'areas_covered','Áreas / exaustores abrangidos',3)}${photo(s,'documento_qualificacao')}</section>
      <section class="box"><h3>Etapas e conteúdo</h3>
        ${question(s,'qp','A documentação contempla Qualificação de Projeto — QP?',{nsa:true})}
        ${question(s,'qi','A documentação contempla Qualificação de Instalação — QI?',{nsa:true})}
        ${question(s,'qo','A documentação contempla Qualificação de Operação — QO?',{nsa:true})}
        ${question(s,'qd','A documentação contempla Qualificação de Desempenho/Performance — QD/QDP?',{nsa:true})}
        ${question(s,'floor_plan_airflow','Há planta/representação com fluxo de ar, pontos de exaustão e dutos?',{nsa:true})}
        ${question(s,'independent_systems','Nos sensibilizantes, a documentação demonstra independência dos sistemas quando exigida?',{nsa:true})}
        ${question(s,'measured_parameters','Os parâmetros medidos e respectivos resultados estão identificados no documento?',{nsa:false})}
        ${question(s,'equipment_identification','Os equipamentos/exaustores avaliados estão identificados de forma rastreável?',{nsa:false})}
        ${question(s,'conclusions','O relatório apresenta conclusões/resultados para os sistemas avaliados?',{nsa:false})}
      </section>
      <section class="box"><h3>Manutenção, filtros e registros</h3>
        ${question(s,'cleaning_records','Há registros de limpeza dos sistemas/exaustores separados ou identificados por setor/equipamento?',{nsa:true})}
        ${question(s,'filter_saturation','Há controle/teste de saturação dos filtros quando aplicável?',{nsa:true})}
        ${question(s,'filter_change','Há registros de troca dos filtros e identificação da data/equipamento?',{nsa:true})}
        ${textarea(s,'maintenance_matrix','Ambiente/exaustor | identificação | última limpeza | troca de filtro | responsável | registro apresentado',5)}
        ${photo(s,'registros_exaustao')}
      </section><p class="muted">A condição física e o uso da exaustão são verificados nos respectivos laboratórios. Esta subseção concentra a análise documental da qualificação/manutenção.</p>${copyButton('7')}`;
    return `<div class="panel fm-panel">${header(s,'Qualificação e Manutenção do Sistema de Exaustão')}${localApplicability(s,'Não se aplica a esta inspeção')}${sec.applicable===false?'<p class="muted">Subseção marcada como não aplicável.</p>':content}</div>`;
  }

  document.addEventListener('click',e=>{
    const sub=e.target.closest('[data-fm-open-subsection]');
    if(sub){ FM.setActive('7',sub.dataset.fmOpenSubsection||''); return; }
    const copy=e.target.closest('[data-fm-copy-section]');
    if(copy) window.dispatchEvent(new CustomEvent('farmacia-manipulacao:copy-section',{detail:{section:copy.dataset.fmCopySection}}));
  });

  FM.registerRenderer('7',render7);
  FM.registerRenderer('7.1',render71);
  FM.registerRenderer('7.2',render72);
  window.FarmaciaManipulacaoSection7={render7,render71,render72};
  FM.render();
})();
