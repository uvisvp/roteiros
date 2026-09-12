/* Farmácia de Manipulação — Seção 1
 * Identificação do Estabelecimento e Informações Gerais.
 */
(() => {
  'use strict';
  const FM=window.FarmaciaManipulacao;
  if(!FM || window.FarmaciaManipulacaoSection1) return;
  const {field,textarea,select,question,esc}=FM.ui;
  const section='1';

  const check = (id,label) => {
    const s=FM.ensureSection(FM.getState(),section);
    const v=!!s.fields[id];
    return `<label class="check"><input type="checkbox" data-fm-s1-check="${esc(id)}"${v?' checked':''}><span>${esc(label)}</span></label>`;
  };

  const docButton=(kind,label)=>`<button type="button" class="primary" data-fm-s1-doc="${esc(kind)}">📄 ${esc(label)}</button>`;
  const photoButton=(label)=>`<button type="button" data-fm-photo="1|${esc(label)}">📷</button>`;

  function peopleTable(state){
    const sec=FM.ensureSection(state,section);
    const list=sec.fields.staff_roles||[];
    return `<div class="fm-repeat"><div class="grid three"><label class="field"><span>Função</span><input data-fm-s1-staff-new="role"></label><label class="field"><span>Quantidade</span><input type="number" min="0" data-fm-s1-staff-new="qty"></label><div class="field"><span>&nbsp;</span><button type="button" data-fm-s1-add-staff>+ Adicionar</button></div></div>${list.length?`<table><thead><tr><th>Função</th><th>Quantidade</th><th></th></tr></thead><tbody>${list.map((x,i)=>`<tr><td>${esc(x.role)}</td><td>${esc(x.qty)}</td><td><button type="button" data-fm-s1-remove-staff="${i}">Remover</button></td></tr>`).join('')}</tbody></table>`:'<p class="muted">Nenhuma composição de equipe adicionada.</p>'}</div>`;
  }

  function substitutesTable(state){
    const sec=FM.ensureSection(state,section);
    const list=sec.fields.rt_substitutes||[];
    return `<div class="fm-repeat"><div class="grid"><label class="field"><span>Nome</span><input data-fm-s1-sub-new="name"></label><label class="field"><span>CRF / UF</span><input data-fm-s1-sub-new="crf"></label><label class="field"><span>Horário de assistência</span><input data-fm-s1-sub-new="schedule"></label><div class="field"><span>&nbsp;</span><button type="button" data-fm-s1-add-sub>+ Adicionar substituto</button></div></div>${list.length?`<table><thead><tr><th>Farmacêutico substituto</th><th>CRF</th><th>Horário</th><th></th></tr></thead><tbody>${list.map((x,i)=>`<tr><td>${esc(x.name)}</td><td>${esc(x.crf)}</td><td>${esc(x.schedule)}</td><td><button type="button" data-fm-s1-remove-sub="${i}">Remover</button></td></tr>`).join('')}</tbody></table>`:'<p class="muted">Nenhum substituto cadastrado.</p>'}</div>`;
  }

  function renderer(state){
    const sec=FM.ensureSection(state,section);
    const f=sec.fields;
    return `<div class="panel fm-panel fm-s1"><div class="subbar"><span class="badge">Seção 1 de 9</span><button type="button" data-fm-home>Todos</button></div>
      <h2>1 IDENTIFICAÇÃO DO ESTABELECIMENTO E INFORMAÇÕES GERAIS</h2>

      <section class="box"><h3>Contexto da inspeção</h3>
        <div class="grid">${select(section,'inspection_type','Tipo / finalidade da inspeção',[['','Selecione'],['Inicial','Inicial'],['Renovação','Renovação'],['Ampliação','Ampliação de atividade'],['Monitoramento','Monitoramento'],['Denúncia','Atendimento a denúncia'],['Outro','Outro']])}${field(section,'inspection_date','Data da inspeção','date')}${field(section,'sei','Protocolo / processo SEI')}${field(section,'team','Equipe inspetora')}</div>
        ${textarea(section,'objective','Objetivo da inspeção',3)}
        ${textarea(section,'contacts','Pessoas contatadas / presentes na inspeção',3)}
      </section>

      <section class="box"><h3>Identificação do estabelecimento</h3>
        <div class="actions s1-actions">${docButton('licenca_sanitaria','Selecionar / fotografar licença sanitária')}<button type="button" class="primary" data-fm-s1-cnpj>Consultar por CNPJ</button></div>
        <p class="muted">Os dados extraídos são propostas e só entram no relatório após conferência da equipe.</p>
        <div class="grid">${field(section,'cnpj','CNPJ')}${field(section,'razao_social','Razão social')}${field(section,'nome_fantasia','Nome fantasia')}${field(section,'ie','Inscrição estadual')}${field(section,'endereco','Endereço completo')}${field(section,'telefone','Telefone')}${field(section,'email','E-mail','email')}</div>
      </section>

      <section class="box"><h3>Responsável legal</h3><div class="grid">${field(section,'responsavel_legal','Nome')}${field(section,'cpf_responsavel_legal','CPF')}</div></section>

      <section class="box"><h3>Responsabilidade técnica</h3>
        <div class="actions s1-actions">${docButton('certidao_regularidade_crf','Selecionar / fotografar CRT')}</div>
        <div class="grid">${field(section,'rt_name','Responsável técnico')}${field(section,'rt_crf','CRF / UF')}${field(section,'rt_schedule','Horário de assistência do RT')}</div>
        <h4>Farmacêuticos substitutos</h4>${substitutesTable(state)}
        <p class="fm-requirement"><strong>CRT:</strong> não existe campo de validade no modelo do aplicativo. Quando constar, registrar apenas a data de emissão.</p>
        <div class="grid">${field(section,'crt_number','CRT nº')}${field(section,'crt_branch','Ramo / atividade')}${field(section,'crt_issue_date','Data de emissão da CRT','date')}${field(section,'establishment_schedule','Horário de funcionamento do estabelecimento')}</div>
      </section>

      <section class="box"><h3>Licença Sanitária</h3>
        <div class="grid">${field(section,'cmvs_cevs','CMVS / CEVS')}${field(section,'license_validity','Validade','date')}${field(section,'license_holder','Titular')}${field(section,'license_cnpj','CNPJ constante da licença')}</div>
        ${textarea(section,'licensed_activities','Atividades licenciadas',4)}${textarea(section,'licensed_groups','Grupos / categorias constantes da licença',3)}
      </section>

      <section class="box"><h3>Autorizações sanitárias</h3>
        <div class="grid">${field(section,'afe_number','AFE — número / autorização')}${field(section,'afe_process','AFE — processo')}${field(section,'afe_publication','AFE — data de publicação','date')}${field(section,'ae_number','AE — número / autorização')}${field(section,'ae_process','AE — processo')}${field(section,'ae_publication','AE — data de publicação','date')}</div>
        <p class="muted">Datas de publicação não serão inferidas a partir de outras datas do documento.</p>
      </section>

      <section class="box"><h3>Perfil de manipulação</h3>
        <h4>Tipos de preparação</h4><div class="check-list">${check('profile_homeopathic','Homeopáticas')}${check('profile_phytotherapeutic','Fitoterápicas')}${check('profile_allopathic','Alopáticas')}${check('profile_officinal','Oficinais')}</div>
        <h4>Classes / grupos</h4><div class="check-list">${check('class_hormones','Hormônios')}${check('class_antibiotics','Antibióticos')}${check('class_penicillins','Penicilínicos')}${check('class_cephalosporins','Cefalosporínicos')}${check('class_cytostatics','Citostáticos')}${check('class_controlled','Sujeitos a controle especial')}</div>
        <h4>Substâncias de Baixo Índice Terapêutico — SBIT</h4><div class="grid">${select(section,'sbit','Manipula SBIT?',[['','Selecione'],['nao','Não'],['sim','Sim']])}${field(section,'sbit_substances','Quais substâncias?')}</div>
        <h4>Formas farmacêuticas</h4><div class="check-list">${check('form_solid','Sólidas')}${check('form_semisolid','Semissólidas')}${check('form_liquid','Líquidas')}</div>
      </section>

      <section class="box"><h3>Atividades adicionais</h3>
        <div class="grid">${select(section,'industrialized','Dispensa produtos industrializados?',[['','Selecione'],['nao','Não'],['sim','Sim']])}${select(section,'pharma_services','Presta serviços farmacêuticos?',[['','Selecione'],['nao','Não'],['sim','Sim']])}${select(section,'delivery','Realiza entrega em domicílio?',[['','Selecione'],['nao','Não'],['sim','Sim']])}</div>
        <p class="muted">Essas respostas não ocultam outras seções. A aplicabilidade será definida dentro da própria subseção correspondente.</p>
      </section>

      <section class="box"><h3>Produção e pessoal</h3>
        <div class="grid">${field(section,'formulas_per_day','Média de fórmulas / dia','number','min="0"')}${field(section,'employees_total','Número total de funcionários','number','min="0"')}</div>
        <h4>Composição do quadro</h4>${peopleTable(state)}
      </section>

      <section class="box"><h3>Informações gerais do processo</h3>
        <div class="grid">${field(section,'purified_water_method','Método de obtenção de água purificada')}${field(section,'software','Sistema informatizado / versão')}${field(section,'waste_company','Empresa / serviço de coleta de resíduos')}${field(section,'waste_generator_code','Código do gerador')}</div>
        ${textarea(section,'bases_excipients','Bases galênicas / excipientes adquiridos ou manipulados',3)}${textarea(section,'previous_nc','Não conformidades / pendências da inspeção anterior',3)}
      </section>

      <section class="box"><h3>Conferência geral</h3>
        ${question(section,'license_matches','Os dados e atividades observados correspondem à licença sanitária?',{nsa:false})}
        ${question(section,'rt_presence','A assistência farmacêutica foi verificada conforme os horários informados?',{nsa:true})}
        ${textarea(section,'general_notes','Considerações gerais',4)}
        <div class="actions">${photoButton('identificacao_geral')}<span class="muted">Foto geral / identificação externa</span></div>
      </section>
    </div>`;
  }

  document.addEventListener('change',e=>{
    if(e.target.matches('[data-fm-s1-check]')){
      const id=e.target.dataset.fmS1Check;
      FM.mutate(s=>{FM.ensureSection(s,section).fields[id]=e.target.checked;});
    }
  });

  document.addEventListener('click',e=>{
    const doc=e.target.closest('[data-fm-s1-doc]');
    if(doc){window.dispatchEvent(new CustomEvent('farmacia-manipulacao:document-request',{detail:{section:'1',kind:doc.dataset.fmS1Doc}}));return;}
    if(e.target.closest('[data-fm-s1-cnpj]')){window.dispatchEvent(new CustomEvent('farmacia-manipulacao:cnpj-query-request',{detail:{section:'1'}}));return;}
    if(e.target.closest('[data-fm-s1-add-sub]')){
      const name=document.querySelector('[data-fm-s1-sub-new="name"]')?.value.trim()||'';
      const crf=document.querySelector('[data-fm-s1-sub-new="crf"]')?.value.trim()||'';
      const schedule=document.querySelector('[data-fm-s1-sub-new="schedule"]')?.value.trim()||'';
      if(!name&&!crf&&!schedule)return;
      FM.mutate(s=>{const sec=FM.ensureSection(s,section);(sec.fields.rt_substitutes||=[]).push({name,crf,schedule});});return;
    }
    const rs=e.target.closest('[data-fm-s1-remove-sub]');
    if(rs){FM.mutate(s=>{const sec=FM.ensureSection(s,section);(sec.fields.rt_substitutes||=[]).splice(Number(rs.dataset.fmS1RemoveSub),1);});return;}
    if(e.target.closest('[data-fm-s1-add-staff]')){
      const role=document.querySelector('[data-fm-s1-staff-new="role"]')?.value.trim()||'';
      const qty=document.querySelector('[data-fm-s1-staff-new="qty"]')?.value||'';
      if(!role&&!qty)return;
      FM.mutate(s=>{const sec=FM.ensureSection(s,section);(sec.fields.staff_roles||=[]).push({role,qty});});return;
    }
    const rst=e.target.closest('[data-fm-s1-remove-staff]');
    if(rst){FM.mutate(s=>{const sec=FM.ensureSection(s,section);(sec.fields.staff_roles||=[]).splice(Number(rst.dataset.fmS1RemoveStaff),1);});}
  });

  FM.registerRenderer('1',renderer);
  window.FarmaciaManipulacaoSection1={renderer};
  FM.render();
})();
