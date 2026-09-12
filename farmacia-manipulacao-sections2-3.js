/* Farmácia de Manipulação — Seções 2 e 3 */
(() => {
  'use strict';
  const FM=window.FarmaciaManipulacao;
  if(!FM || window.FarmaciaManipulacaoSections23) return;
  const {field,textarea,select,question,localApplicability,esc}=FM.ui;

  function docAction(kind,label,section){return `<button type="button" class="primary" data-fm-doc-request="${esc(section)}|${esc(kind)}">📄 ${esc(label)}</button>`;}
  function checkField(section,id,label){const sec=FM.ensureSection(FM.getState(),section),v=!!sec.fields[id];return `<label class="check"><input type="checkbox" data-fm-bool="${esc(section)}|${esc(id)}"${v?' checked':''}><span>${esc(label)}</span></label>`;}

  function render2(state){
    const s='2';
    return `<div class="panel fm-panel"><div class="subbar"><span class="badge">Seção 2 de 9</span><button type="button" data-fm-home>Todos</button></div>
      <h2>2 EDIFICAÇÕES E INSTALAÇÕES</h2>
      <section class="box"><h3>Caracterização da edificação</h3>
        <div class="grid">${select(s,'property_type','Tipo de imóvel',[['','Selecione'],['predio_comercial','Prédio comercial'],['loja_rua','Loja / imóvel de rua'],['galeria','Galeria / centro comercial'],['shopping','Shopping center'],['outro','Outro']])}${field(s,'floors','Número de pavimentos')}${select(s,'independent_access','Acesso livre e independente?',[['','Selecione'],['sim','Sim'],['nao','Não']])}${select(s,'communication','Comunicação direta com outro estabelecimento/residência?',[['','Selecione'],['nao','Não'],['sim','Sim']])}</div>
        ${field(s,'external_identification','Identificação externa / placa visível')}
        ${textarea(s,'structural_particularities','Particularidades estruturais / entrepiso / mezanino / circulação',3)}
        ${field(s,'water_tank_location','Localização da caixa d’água / reservatório, quando existente')}
        <button type="button" data-fm-photo="2|edificacao_geral">📷 Foto geral / fachada / circulação</button>
      </section>
      <section class="box"><h3>Estrutura e conservação</h3>
        ${question(s,'contaminating_sources','As instalações estão afastadas/protegidas de fontes contaminantes ou poluentes?',{nsa:true})}
        ${question(s,'surfaces','Pisos, paredes e tetos apresentam superfícies lisas, impermeáveis, laváveis e em bom estado?',{nsa:false})}
        ${question(s,'clean_conserved','As instalações estão limpas, organizadas e em bom estado de conservação?',{nsa:false})}
        ${question(s,'hydraulic','As instalações hidráulicas apresentam condições adequadas de conservação e funcionamento?',{nsa:false})}
        ${question(s,'electrical','As instalações elétricas apresentam condições adequadas de conservação e segurança?',{nsa:false})}
      </section>
      <section class="box"><h3>Fluxo, iluminação e ventilação</h3>
        ${question(s,'layout_flow','O leiaute e o fluxo das operações reduzem risco de mistura, contaminação e cruzamento inadequado?',{nsa:false})}
        ${question(s,'lighting','A iluminação é compatível com as atividades realizadas?',{nsa:false})}
        ${question(s,'ventilation','A ventilação / climatização é adequada às atividades e ambientes?',{nsa:false})}
        ${textarea(s,'layout_notes','Descrição complementar de fluxo / layout',3)}
      </section>
      <section class="box"><h3>Áreas de apoio e segurança</h3>
        ${question(s,'rest_separation','Área de descanso/refeitório, quando existente, encontra-se separada das áreas técnicas?',{nsa:true})}
        ${question(s,'fire_equipment','Os sistemas/equipamentos de combate a incêndio estão acessíveis e em condições físicas adequadas?',{nsa:true})}
        ${question(s,'public_identification','A identificação do estabelecimento está visível ao público?',{nsa:false})}
        <p class="muted">AVCB/CLCB será analisado documentalmente na Seção 7; aqui é verificada apenas a condição física observada.</p>
      </section>
    </div>`;
  }

  function trainingTable(state){
    const sec=FM.ensureSection(state,'3'); const rows=sec.fields.trainings||[];
    return `<div class="fm-repeat"><div class="grid"><label class="field"><span>Tema</span><input data-fm-training-new="theme"></label><label class="field"><span>Data</span><input type="date" data-fm-training-new="date"></label><label class="field"><span>Carga horária</span><input data-fm-training-new="hours"></label><label class="field"><span>Nº treinados</span><input type="number" min="0" data-fm-training-new="people"></label><label class="field"><span>Efetividade avaliada?</span><select data-fm-training-new="effect"><option value="">Selecione</option><option value="sim">Sim</option><option value="nao">Não</option></select></label><div class="field"><span>&nbsp;</span><button type="button" data-fm-add-training>+ Adicionar</button></div></div>${rows.length?`<table><thead><tr><th>Tema</th><th>Data</th><th>Carga horária</th><th>Nº treinados</th><th>Efetividade</th><th></th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${esc(r.theme)}</td><td>${esc(r.date)}</td><td>${esc(r.hours)}</td><td>${esc(r.people)}</td><td>${r.effect==='sim'?'Sim':r.effect==='nao'?'Não':''}</td><td><button type="button" data-fm-remove-training="${i}">Remover</button></td></tr>`).join('')}</tbody></table>`:'<p class="muted">Nenhum treinamento registrado.</p>'}</div>`;
  }

  function asoList(state){
    const docs=(state.documents||[]).filter(d=>d.kind==='aso');
    return docs.length?`<table><thead><tr><th>Funcionário</th><th>Tipo</th><th>Data</th><th>Aptidão</th><th>Médico</th></tr></thead><tbody>${docs.map(d=>`<tr><td>${esc(d.fields?.employee||d.fields?.nome_funcionario||'')}</td><td>${esc(d.fields?.exam_type||d.fields?.tipo_exame||'')}</td><td>${esc(d.fields?.exam_date||d.fields?.data_exame||'')}</td><td>${esc(d.fields?.fitness||'')}</td><td>${esc(d.fields?.doctor||d.fields?.medico_examinador||'')}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">Nenhum ASO lido nesta inspeção.</p>';
  }

  function render3(state){
    const s='3';
    return `<div class="panel fm-panel"><div class="subbar"><span class="badge">Seção 3 de 9</span><button type="button" data-fm-home>Todos</button></div>
      <h2>3 PESSOAL, SAÚDE OCUPACIONAL E TREINAMENTO</h2>
      <section class="box"><h3>3.1 Pessoal e organização</h3>
        ${question(s,'organogram','A farmácia possui estrutura organizacional/organograma e pessoal suficiente para as atividades?',{nsa:false})}
        ${question(s,'responsibilities','As atribuições e responsabilidades individuais estão formalmente descritas, sem sobreposição inadequada?',{nsa:false})}
        ${question(s,'occupational_exams','A admissão é precedida de avaliação médica e há avaliações periódicas conforme o programa ocupacional?',{nsa:false})}
        ${question(s,'illness_removal','Há procedimento para afastamento de trabalhador com condição que possa comprometer a preparação?',{nsa:false})}
        ${question(s,'no_adornments','É observada a proibição de cosméticos, joias e adornos nas áreas de pesagem/manipulação?',{nsa:false})}
        ${question(s,'no_food','É observada a proibição de comer, beber, fumar, mascar e manter alimentos/objetos pessoais/medicamentos nas áreas técnicas?',{nsa:false})}
        ${question(s,'risk_reporting','Os trabalhadores são orientados a reportar condições de risco relativas a produto, ambiente, equipamento ou pessoal?',{nsa:false})}
        ${question(s,'ppe_supply','A farmácia fornece EPI gratuitamente, em quantidade suficiente e com reposição periódica?',{nsa:false})}
        ${question(s,'gowning_hands','Os trabalhadores da manipulação estão adequadamente paramentados e higienizam mãos/antebraços antes das atividades?',{nsa:false})}
      </section>

      <section class="box"><h3>3.2 Saúde ocupacional</h3>
        <div class="actions s1-actions">${docAction('aso','Adicionar ASO — OCR','3')}</div>
        <p class="muted">O OCR do ASO extrai dados estruturados. Não interpreta condição de saúde nem decide conformidade.</p>
        ${asoList(state)}
        <h4>PCMSO — checklist, sem OCR</h4>
        ${question(s,'pcms_o_present','PCMSO apresentado e vigente?',{nsa:false})}
        <div class="check-list">${checkField(s,'pc_identification','Identificação da empresa')}${checkField(s,'pc_responsible','Médico/coordenador responsável')}${checkField(s,'pc_risks','Reconhecimento/análise dos riscos ocupacionais')}${checkField(s,'pc_exams','Exames clínicos/complementares e periodicidades')}${checkField(s,'pc_plan','Planejamento anual')}${checkField(s,'pc_functions','Riscos e exames por função')}${checkField(s,'pc_recommendations','Recomendações à empresa')}</div>
        <h4>PGR — checklist, sem OCR</h4>
        ${question(s,'pgr_present','PGR apresentado e vigente?',{nsa:false})}
        <div class="check-list">${checkField(s,'pgr_basis','Base legal e identificação')}${checkField(s,'pgr_evaluators','Responsáveis / avaliadores')}${checkField(s,'pgr_scope','Abrangência')}${checkField(s,'pgr_risk_assessment','Avaliação dos riscos')}${checkField(s,'pgr_methods','Instrumentos / métodos')}${checkField(s,'pgr_inventory','Inventário de riscos')}${checkField(s,'pgr_priorities','Metas e prioridades de controle')}${checkField(s,'pgr_functions','Riscos por função / ambiente')}${checkField(s,'pgr_mitigation','Medidas de mitigação / prevenção')}</div>
      </section>

      <section class="box"><h3>3.3 Treinamentos</h3>
        <p class="muted">Treinamentos são conferidos por checklist e registro estruturado; não há OCR de conteúdo.</p>
        ${question(s,'training_program','Há programa de treinamento baseado em levantamento de necessidades, com registros adequados?',{nsa:false})}
        ${question(s,'training_initial_continuous','Todo o pessoal, inclusive limpeza/manutenção, recebeu treinamento inicial e continuado compatível com as funções?',{nsa:false})}
        ${question(s,'training_annexes','Foram realizados treinamentos específicos para as atividades dos anexos aplicáveis?',{nsa:true})}
        ${question(s,'training_incidents','Os treinamentos incluem procedimentos em caso de acidente/incidente e informações sobre riscos?',{nsa:false})}
        ${question(s,'training_effectiveness','A efetividade dos treinamentos foi avaliada?',{nsa:false,requirement:'Registro de treinamento deve permitir verificar a avaliação de efetividade.'})}
        ${trainingTable(state)}
      </section>

      <section class="box"><h3>3.4 Requisitos ocupacionais adicionais — Anexo III</h3>
        ${localApplicability('3.4','Não se aplica a esta inspeção')}
        ${FM.ensureSection(state,'3.4').applicable===false?'':`${question('3.4','specific_exams','Os trabalhadores diretamente envolvidos são submetidos aos exames médicos específicos previstos no PCMSO?',{nsa:false})}${question('3.4','pcms_o_informed','Os responsáveis pela elaboração do PCMSO foram informados sobre a manipulação dessas substâncias?',{nsa:false})}${question('3.4','rotation','Foi avaliada a adoção de sistema de rodízio dos trabalhadores diretamente envolvidos?',{nsa:true})}`}
      </section>
    </div>`;
  }

  document.addEventListener('change',e=>{
    if(e.target.matches('[data-fm-bool]')){const [sec,id]=e.target.dataset.fmBool.split('|');FM.mutate(s=>{FM.ensureSection(s,sec).fields[id]=e.target.checked;});}
  });
  document.addEventListener('click',e=>{
    const d=e.target.closest('[data-fm-doc-request]');if(d){const [section,kind]=d.dataset.fmDocRequest.split('|');window.dispatchEvent(new CustomEvent('farmacia-manipulacao:document-request',{detail:{section,kind}}));return;}
    if(e.target.closest('[data-fm-add-training]')){
      const get=k=>document.querySelector(`[data-fm-training-new="${k}"]`)?.value||'';
      const row={theme:get('theme').trim(),date:get('date'),hours:get('hours').trim(),people:get('people'),effect:get('effect')};
      if(!Object.values(row).some(Boolean))return;
      FM.mutate(s=>{(FM.ensureSection(s,'3').fields.trainings||=[]).push(row);});return;
    }
    const r=e.target.closest('[data-fm-remove-training]');if(r){FM.mutate(s=>(FM.ensureSection(s,'3').fields.trainings||=[]).splice(Number(r.dataset.fmRemoveTraining),1));}
  });

  FM.registerRenderer('2',render2);
  FM.registerRenderer('3',render3);
  window.FarmaciaManipulacaoSections23={render2,render3};
  FM.render();
})();
