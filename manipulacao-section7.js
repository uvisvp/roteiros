/* Farmácia de Manipulação — Seção 7: Documentos Apresentados. */
(() => {
  'use strict';
  if (window.ManipulacaoSection7) return;

  const start = () => {
    const C = window.ManipulacaoCore, U = window.ManipulacaoUI;
    if (!C || !U) return setTimeout(start, 25);
    const B='sections.7';
    const f=k=>B+'.fields.'+k, n=k=>B+'.notes.'+k;
    const arr=k=>C.field(f(k),[]);

    const DOCS = [
      ['crt','Certidão de Regularidade Técnica — CRF','simple','certidao_regularidade_crf'],
      ['mbpm','Manual de Boas Práticas de Manipulação','complex'],
      ['mbpf','Manual de Boas Práticas Farmacêuticas, quando aplicável','complex'],
      ['pcmso','PCMSO','complex'],['pgr','PGR','complex'],['pgrss','PGRSS','complex'],
      ['caixa_agua','Comprovante de limpeza da caixa d’água','simple','limpeza_reservatorio'],
      ['pragas','Comprovante de controle de pragas','simple','controle_pragas'],
      ['pmoc','PMOC do sistema de climatização','complex'],['planta','Planta baixa / croqui das áreas','complex'],
      ['avcb','AVCB / CLCB','simple','avcb_clcb'],['spregula','Cadastro SPREGULA / AMLURB, quando aplicável','simple','documento_generico'],
      ['controlados','Licenças para produtos químicos controlados — Polícia Civil / Federal / Exército','simple','licenca_controlados'],
      ['mapa','Registro / licença MAPA, quando aplicável','simple','licenca_mapa'],
      ['afe_ae','AFE / AE','simple','afe_ae'],['mapas_balancos','Mapas e balanços da Portaria 344/98','simple','mapas_balancos'],
      ['reclamacoes','Registros de reclamações de clientes','complex'],['autoinspecao','Registro da última autoinspeção','complex'],
      ['treinamentos','Programa e registros de treinamento','complex'],['fornecedores','Qualificação completa de fornecedores','complex'],
      ['contrato_laboratorio','Contrato com laboratório de análises terceirizadas','complex'],['manutencao','Programa de manutenção preventiva','complex']
    ];

    const COMPLEX_CHECKS = {
      mbpm:['identificação e revisão','organograma e responsabilidades','fluxograma e fluxo das operações','estrutura e áreas','pessoal e treinamento','equipamentos e calibrações','limpeza e sanitização','água','matérias-primas e fornecedores','armazenamento','manipulação','controle de qualidade','garantia da qualidade','gestão documental','autoinspeção','validade e reclamações'],
      pcmso:['identificação da empresa','responsável pelo programa','riscos ocupacionais','exames e periodicidades','planejamento anual','riscos por função','recomendações'],
      pgr:['identificação e responsáveis','escopo','avaliação e inventário de riscos','métodos e instrumentos','medidas de controle','registro e divulgação','riscos por função/área','recomendações e anexos'],
      pgrss:['identificação e responsável','classificação de resíduos','segregação e acondicionamento','coleta e armazenamento','transporte e destinação','treinamento','rotinas de contingência'],
      pmoc:['identificação do sistema','responsável técnico','equipamentos abrangidos','rotinas de manutenção','frequências','registros e execução'],
      planta:['layout e identificação das áreas','fluxos','exaustão e climatização','tubulações independentes quando aplicável'],
      fornecedores:['critérios de qualificação','documentação sanitária','auditoria / evidência de BPF, fracionamento ou distribuição quando aplicável','reavaliação periódica'],
      autoinspecao:['data e responsável','abrangência','achados','ações corretivas','acompanhamento'],
      treinamentos:['tema','data','carga horária','conteúdo','trabalhadores treinados','assinaturas','instrutor','avaliação de efetividade'],
      contrato_laboratorio:['partes e CNPJ','objeto','ensaios abrangidos','vigência','situação sanitária / licenciamento do laboratório'],
      manutencao:['equipamentos abrangidos','frequências','preventiva e corretiva','responsáveis','registros de execução'],
      reclamacoes:['identificação da reclamação','produto/lote quando aplicável','investigação','medidas adotadas','conclusão e acompanhamento']
    };

    const POPS = [
      ['rh_paramentacao','RH e Paramentação','Processo de paramentação; Higiene e conduta pessoal; Treinamento e capacitação'],
      ['materias','Matérias-primas e Embalagens','Recebimento e inspeção; Qualificação de fornecedores; Amostragem; Diluição geométrica; Padronização de excipientes; Controle de estoque'],
      ['laboratorios','Laboratórios e Manipulação','Formas farmacêuticas; Controlados; Sensibilizantes; SBIT; Bases galênicas; Contaminação cruzada; Verificação diária das balanças'],
      ['cq_agua','Controle de Qualidade e Água','Ensaios de insumos/embalagens; Produto acabado; Monitoramento magistral; Amostragem de água; Medidas para laudo insatisfatório; Purificador'],
      ['equipamentos','Equipamentos, Limpeza e Estrutura','Manutenção preventiva/corretiva; Exaustão; Limpeza/sanitização; Temperatura e umidade'],
      ['dispensacao','Dispensação, Garantia da Qualidade e Atendimento','Avaliação da prescrição; Cálculos; Conservação/transporte; Reclamações; Autoinspeção']
    ];

    function status(path,label='Situação') {
      return '<div class="manip-mini-choice"><b>'+C.esc(label)+'</b>'+U.choice(path,[['apresentado','Apresentado e conferido'],['observacao','Apresentado com observação'],['pendente','Não apresentado / pendente'],['atualizar','Necessita atualização / complementação'],['na','Não se aplica']])+'</div>';
    }

    function simpleDoc([key,label,type,ocrType]) {
      const base='documentos.'+key;
      const ocr = ocrType ? '<button type="button" class="primary" data-manip-s7-ocr="'+C.esc(ocrType)+'|'+C.esc(base)+'">📄 Extrair dados</button>' : '';
      return '<section class="manip-subcard"><h4>'+C.esc(label)+'</h4>'+status(f(base+'.status'))+
        '<div class="manip-grid">'+U.input(f(base+'.numero'),'Número / identificação')+U.input(f(base+'.emissao'),'Emissão',{type:'date'})+U.input(f(base+'.validade'),'Validade, quando houver',{type:'date'})+U.input(f(base+'.emitido_por'),'Emitido por / responsável')+'</div>'+
        '<div class="manip-actions">'+ocr+'</div>'+U.textarea(f(base+'.descricao'),'Dados / observações do documento')+U.photoNotes('s7_'+key,n(base))+'</section>';
    }

    function complexDoc([key,label]) {
      const base='documentos.'+key, checks=COMPLEX_CHECKS[key]||[];
      return '<section class="manip-subcard"><h4>'+C.esc(label)+'</h4>'+status(f(base+'.status'))+
        U.info('Documento complexo: sem OCR de conteúdo. Registrar identificação e conferir por checklist.')+
        '<div class="manip-grid">'+U.input(f(base+'.titulo'),'Título / identificação')+U.input(f(base+'.codigo'),'Código / nº')+U.input(f(base+'.revisao'),'Revisão')+U.input(f(base+'.data'),'Data / emissão',{type:'date'})+U.input(f(base+'.responsavel'),'Responsável')+'</div>'+
        '<div class="manip-check-grid">'+checks.map((label,i)=>U.checkbox(f(base+'.checklist.'+i),label)).join('')+'</div>'+U.textarea(f(base+'.anotacoes'),'Anotações de conferência')+U.photoNotes('s7_'+key,n(base))+'</section>';
    }

    function pops() {
      return U.box('7.1 Procedimentos Operacionais Padronizados — POPs',
        U.info('Não é obrigatório existir um POP separado para cada assunto. Um requisito pode estar contemplado em POP geral ou em documento que reúna várias atividades. Sem OCR de conteúdo.')+
        POPS.map(([key,title,topics])=>'<section class="manip-subcard"><h4>'+C.esc(title)+'</h4><p class="manip-info">'+C.esc(topics)+'</p>'+status(f('pops.'+key+'.status'),'Situação do grupo')+
          '<div class="manip-grid">'+U.input(f('pops.'+key+'.numero'),'POP nº / identificação')+U.input(f('pops.'+key+'.revisao'),'Revisão')+U.input(f('pops.'+key+'.data'),'Data',{type:'date'})+U.input(f('pops.'+key+'.titulo'),'Título do documento que contempla o requisito')+'</div>'+U.choice(f('pops.'+key+'.corresponde_pratica'),[['sim','Corresponde à prática observada'],['nao','Não corresponde'],['na','Não se aplica']])+U.textarea(f('pops.'+key+'.anotacoes'),'Anotações')+U.photoNotes('s7_pop_'+key,n('pops.'+key))+'</section>').join('')
      );
    }

    function exhaustRows() {
      const rows=arr('exaustao.manutencoes');
      const names=['Controle de Qualidade','Semissólidos e Líquidos','Sólidos','Cabine de Hormônios','Cabine de Antibióticos','Cabine de Citostáticos','Cabine de Penicilínicos'];
      const hint=!rows.length?U.info('Sugestões de locais: '+names.join(', ')+'.'):'';
      return hint+rows.map((r,i)=>'<section class="manip-repeat-row"><div class="manip-grid">'+U.input(f('exaustao.manutencoes.'+i+'.local'),'Local / exaustor')+U.input(f('exaustao.manutencoes.'+i+'.limpeza'),'Última limpeza',{type:'date'})+U.input(f('exaustao.manutencoes.'+i+'.filtro'),'Última troca de filtro',{type:'date'})+U.input(f('exaustao.manutencoes.'+i+'.responsavel'),'Responsável')+'</div><button type="button" data-manip-s7-remove="exaustao.manutencoes|'+i+'">Remover linha</button></section>').join('')+'<button type="button" data-manip-s7-add="exaustao.manutencoes">+ Adicionar exaustor / ambiente</button>';
    }

    function exhaust() {
      return U.box('7.2 Qualificação e Manutenção do Sistema de Exaustão de Ar',
        status(f('exaustao.status'),'Qualificação apresentada?')+
        U.info('A análise documental da qualificação fica centralizada aqui; os laboratórios apenas registram presença/uso do sistema.')+
        '<div class="manip-grid">'+U.input(f('exaustao.empresa'),'Empresa executora')+U.input(f('exaustao.responsavel'),'Responsável técnico')+U.input(f('exaustao.registro'),'Registro profissional')+U.input(f('exaustao.numero'),'Nº da qualificação')+U.input(f('exaustao.data'),'Data',{type:'date'})+U.input(f('exaustao.validade'),'Validade, se houver',{type:'date'})+'</div>'+
        U.question({id:'s7_qp',text:'Qualificação de Projeto (QP) — o projeto foi avaliado e aprovado antes da instalação?',answerPath:f('exaustao.qp'),notesPath:n('exaustao.qp')})+
        U.question({id:'s7_qi',text:'Qualificação de Instalação (QI) — o sistema foi instalado conforme o projeto aprovado?',answerPath:f('exaustao.qi'),notesPath:n('exaustao.qi')})+
        U.question({id:'s7_qo',text:'Qualificação de Operação (QO) — o sistema opera conforme os parâmetros especificados?',answerPath:f('exaustao.qo'),notesPath:n('exaustao.qo')})+
        U.question({id:'s7_qd',text:'Qualificação de Desempenho (QD/QDP) — o sistema desempenha sua função em condições reais de uso?',answerPath:f('exaustao.qd'),notesPath:n('exaustao.qd')})+
        U.checkbox(f('exaustao.checklist.planta'),'Planta / fluxo de ar e dutos conferidos')+U.checkbox(f('exaustao.checklist.pontos'),'Pontos de exaustão e áreas abrangidas conferidos')+U.checkbox(f('exaustao.checklist.independencia'),'Independência dos sistemas quando exigida conferida')+U.checkbox(f('exaustao.checklist.parametros'),'Parâmetros medidos e identificação dos equipamentos conferidos')+U.checkbox(f('exaustao.checklist.conclusoes'),'Conclusões e registros de manutenção conferidos')+
        '<h4>Manutenção por ambiente</h4>'+exhaustRows()+U.photoNotes('s7_exaustao',n('exaustao'))
      );
    }

    function render() {
      return U.box('Documentos solicitados / apresentados',
        U.info('Todos os documentos podem receber foto e anotações. Documentos simples podem usar OCR apenas para metadados; documentos complexos são avaliados por checklist.')+
        DOCS.map(doc=>doc[2]==='simple'?simpleDoc(doc):complexDoc(doc)).join('')+
        '<div class="manip-actions"><button type="button" class="primary" data-manip-copy-section="7">📋 Copiar texto desta seção</button></div>'
      ) + pops() + exhaust();
    }

    function add(path){C.update(state=>{const full=f(path),list=C.getPath(state,full,[]),next=Array.isArray(list)?list:[];next.push({local:'',limpeza:'',filtro:'',responsavel:''});C.setPath(state,full,next);},{source:'section7-array-add'});}
    function remove(path,index){C.update(state=>{const full=f(path),list=C.getPath(state,full,[]);if(Array.isArray(list))list.splice(Number(index),1);C.setPath(state,full,list);},{source:'section7-array-remove'});}
    let installed=false;
    function install(){if(installed)return;installed=true;document.addEventListener('click',event=>{const o=event.target.closest?.('[data-manip-s7-ocr]');if(o){const[type,destination]=o.dataset.manipS7Ocr.split('|');document.dispatchEvent(new CustomEvent('manipulacao:ocr-request',{detail:{section:'7',documentType:type,destination:f(destination),metadataOnly:true}}));return;}const ad=event.target.closest?.('[data-manip-s7-add]');if(ad){add(ad.dataset.manipS7Add);return;}const rm=event.target.closest?.('[data-manip-s7-remove]');if(rm){const[path,i]=rm.dataset.manipS7Remove.split('|');remove(path,i);}});}

    C.registerSection('7',{title:'Documentos Apresentados',shortTitle:'Documentos',render,afterRender:install});
    window.ManipulacaoSection7=Object.freeze({render,install});
    document.dispatchEvent(new CustomEvent('manipulacao:section7-ready'));
  };
  start();
})();
