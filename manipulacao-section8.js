/* Farmácia de Manipulação — Seção 8: Monitoramento do Processo Magistral e da Água. */
(() => {
  'use strict';
  if (window.ManipulacaoSection8) return;

  const start=()=>{
    const C=window.ManipulacaoCore,U=window.ManipulacaoUI;
    if(!C||!U)return setTimeout(start,25);
    const B='sections.8';
    const f=k=>B+'.fields.'+k,n=k=>B+'.notes.'+k,a=k=>B+'.answers.'+k;
    const arr=k=>C.field(f(k),[]);

    const TYPES=[
      ['agua_purificada','8.1 Água Purificada','Mensal','item 7.5.2.2','agua_purificada'],
      ['agua_potavel','8.2 Água Potável','Semestral','item 7.5.1.3','agua_potavel'],
      ['base_galenica','8.3 Pureza microbiológica de base galênica','Mensal','item 11.2.4','base_galenica'],
      ['farmaco_25mg','8.4 Teor e Uniformidade de fármaco ≤ 25 mg, prioridade ≤ 5 mg','Bimestral','item 9.2.3.1','farmaco_25mg'],
      ['diluido','8.5 Teor de Diluído Preparado','Trimestral','itens 9.2.2/9.2.5','diluido'],
      ['sensibilizante','8.6 Teor e Uniformidade de substâncias sensibilizantes — rodízio','Trimestral','referência constante do roteiro revisado','sensibilizante']
    ];

    function eventRows(type){
      const rows=arr(type+'.eventos');
      if(!rows.length)return U.info('Nenhum evento de amostragem registrado. Solicitar, no mínimo, as duas últimas análises de cada tipo para conferência da periodicidade.');
      return rows.map((row,i)=>'<section class="manip-repeat-row"><h5>Evento de amostragem '+(i+1)+'</h5><div class="manip-grid">'+
        U.input(f(type+'.eventos.'+i+'.laboratorio'),'Laboratório')+U.input(f(type+'.eventos.'+i+'.cnpj_laboratorio'),'CNPJ do laboratório')+
        U.input(f(type+'.eventos.'+i+'.produto_amostra'),'Produto / amostra')+U.input(f(type+'.eventos.'+i+'.codigo_amostra'),'Código da amostra')+
        U.input(f(type+'.eventos.'+i+'.lote'),'Lote')+U.input(f(type+'.eventos.'+i+'.fabricante'),'Fabricante, quando constar')+
        U.input(f(type+'.eventos.'+i+'.validade'),'Validade, quando constar',{type:'date'})+U.input(f(type+'.eventos.'+i+'.recebimento'),'Recebimento, quando constar',{type:'date'})+
        U.input(f(type+'.eventos.'+i+'.coleta_data'),'Data da coleta',{type:'date'})+U.input(f(type+'.eventos.'+i+'.coleta_hora'),'Hora da coleta',{type:'time'})+
        U.input(f(type+'.eventos.'+i+'.ponto_coleta'),'Ponto de coleta')+U.input(f(type+'.eventos.'+i+'.responsavel_coleta'),'Responsável pela coleta')+
      '</div>'+U.textarea(f(type+'.eventos.'+i+'.relatorios'),'Relatório(s) / certificado(s) vinculados',{placeholder:'Ex.: 5398/26 — físico-químico; 5395/26 — microbiológico'})+
      U.textarea(f(type+'.eventos.'+i+'.resultado'),'Conclusão / resultado textual do laboratório')+
      U.textarea(f(type+'.eventos.'+i+'.parametros'),'Parâmetros e resultados extraídos',{placeholder:'Preservar exatamente símbolos como <1,0, Ausente, unidades, limites e traços.'})+
      '<div class="manip-mini-choice"><b>Situação definida pela equipe de inspeção</b>'+U.choice(f(type+'.eventos.'+i+'.situacao'),[['c','Conforme'],['nc','Não conforme'],['na','Não se aplica']])+'</div>'+U.photoNotes('s8_'+type+'_'+i,f(type+'.eventos.'+i+'.anotacoes'))+
      '<div class="manip-actions"><button type="button" data-manip-s8-ocr="'+C.esc(type)+'|'+i+'">📄 Adicionar laudo a este evento</button><button type="button" data-manip-s8-remove="'+C.esc(type)+'|'+i+'">Remover evento</button></div></section>').join('');
    }

    function typeCard([type,title,period,reference,profile]){
      return U.box(title,
        U.requirement('Periodicidade informada no roteiro: '+period+'.','RDC 67/2007 · '+reference)+
        U.info('A periodicidade é verificada pela data de coleta. Relatórios físico-químico e microbiológico da mesma coleta devem permanecer vinculados a um único evento de amostragem.')+
        '<div class="manip-actions"><button type="button" class="primary" data-manip-s8-new="'+C.esc(type)+'">+ Novo evento de amostragem</button><button type="button" data-manip-s8-ocr-new="'+C.esc(type)+'">📄 Ler laudo e criar evento</button></div>'+eventRows(type)
      );
    }

    function complementary(){
      return U.box('8.7 Água — verificações complementares',
        U.question({id:'s8_pop_agua',text:'Há POP de amostragem e periodicidade das análises de água potável e purificada?',answerPath:a('agua.pop'),notesPath:n('agua.pop')})+
        U.question({id:'s8_ponto',text:'Um dos pontos de amostragem da água purificada é o local utilizado para armazenamento?',answerPath:a('agua.ponto_armazenamento'),notesPath:n('agua.ponto_armazenamento')})+
        U.question({id:'s8_parametros_potavel',text:'As análises da água potável contemplam os parâmetros previstos no roteiro, incluindo pH, cor aparente, turbidez, cloro residual livre, sólidos totais dissolvidos, contagem bacteriana, coliformes totais, E. coli e coliformes termorresistentes?',answerPath:a('agua.parametros_potavel'),notesPath:n('agua.parametros_potavel')})+
        U.question({id:'s8_medidas_potavel',text:'Em caso de laudo insatisfatório da água potável, há registro das medidas adotadas?',answerPath:a('agua.medidas_potavel'),notesPath:n('agua.medidas_potavel')})+
        U.question({id:'s8_medidas_purificada',text:'Em caso de laudo insatisfatório da água purificada, as medidas são registradas e a efetividade é avaliada por nova análise?',answerPath:a('agua.medidas_purificada'),notesPath:n('agua.medidas_purificada')})+
        U.photoNotes('s8_agua_complementar',n('agua.geral'))
      );
    }

    function render(){
      return U.box('Laboratório terceirizado / contexto dos ensaios',
        U.grid(U.input(f('laboratorio.nome'),'Laboratório principal')+U.input(f('laboratorio.cnpj'),'CNPJ')+U.input(f('laboratorio.licenca'),'Licença / CEVS / identificação')+U.select(f('laboratorio.situacao'),'Situação verificada',[['c','Licenciado / situação conferida'],['nc','Situação não conforme'],['pendente','Pendente de conferência']]))+
        U.info('Solicitar, no mínimo, as duas últimas análises de cada tipo. O OCR extrai dados e parâmetros; a conclusão sanitária é da equipe.')
      )+TYPES.map(typeCard).join('')+complementary()+'<div class="manip-actions"><button type="button" class="primary" data-manip-copy-section="8">📋 Copiar texto desta seção</button></div>';
    }

    function addEvent(type,seed={}){
      C.update(state=>{const path=f(type+'.eventos'),list=C.getPath(state,path,[]),next=Array.isArray(list)?list:[];next.push(Object.assign({laboratorio:'',cnpj_laboratorio:'',produto_amostra:'',codigo_amostra:'',lote:'',fabricante:'',validade:'',recebimento:'',coleta_data:'',coleta_hora:'',ponto_coleta:'',responsavel_coleta:'',relatorios:'',resultado:'',parametros:'',situacao:'',anotacoes:''},seed));C.setPath(state,path,next);},{source:'section8-event-add'});
    }
    function removeEvent(type,index){C.update(state=>{const path=f(type+'.eventos'),list=C.getPath(state,path,[]);if(Array.isArray(list))list.splice(Number(index),1);C.setPath(state,path,list);},{source:'section8-event-remove'});}
    function requestOcr(type,index=null){document.dispatchEvent(new CustomEvent('manipulacao:ocr-request',{detail:{section:'8',documentType:'laudo_ensaio',profile:type,eventIndex:index,destination:f(type+'.eventos')}}));}

    let installed=false;
    function install(){if(installed)return;installed=true;document.addEventListener('click',event=>{const add=event.target.closest?.('[data-manip-s8-new]');if(add){addEvent(add.dataset.manipS8New);return;}const newOcr=event.target.closest?.('[data-manip-s8-ocr-new]');if(newOcr){requestOcr(newOcr.dataset.manipS8OcrNew,null);return;}const ocr=event.target.closest?.('[data-manip-s8-ocr]');if(ocr){const[type,i]=ocr.dataset.manipS8Ocr.split('|');requestOcr(type,Number(i));return;}const rm=event.target.closest?.('[data-manip-s8-remove]');if(rm){const[type,i]=rm.dataset.manipS8Remove.split('|');removeEvent(type,i);}});}

    C.registerSection('8',{title:'Monitoramento do Processo Magistral e da Água',shortTitle:'Monitoramento',render,afterRender:install});
    window.ManipulacaoSection8=Object.freeze({render,install});
    document.dispatchEvent(new CustomEvent('manipulacao:section8-ready'));
  };
  start();
})();
