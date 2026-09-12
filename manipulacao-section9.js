/* Farmácia de Manipulação — Seção 9: Rastreabilidade e Controle de Qualidade. */
(() => {
  'use strict';
  if (window.ManipulacaoSection9) return;

  const start=()=>{
    const C=window.ManipulacaoCore,U=window.ManipulacaoUI;
    if(!C||!U)return setTimeout(start,25);
    const B='sections.9';
    const f=k=>B+'.fields.'+k,n=k=>B+'.notes.'+k,a=k=>B+'.answers.'+k;
    const arr=k=>C.field(f(k),[]);
    const ref=t=>'<p class="manip-reference">'+C.esc(t)+'</p>';

    function q(prefix,id,text,reference,help='',requirement=''){
      return U.question({id:'s9_'+prefix+'_'+id,text,help,requirement,answerPath:a(prefix+'.'+id),notesPath:n(prefix+'.'+id),photoKey:'s9_'+prefix+'_'+id})+ref(reference);
    }

    function prescription(){
      const p='prescricao';
      return U.box('9.1 Avaliação da prescrição quanto à legalidade',
        U.info('A receita pode ser fotografada para consulta, mas não haverá OCR de julgamento. A avaliação é feita pelo fiscal por checklist.')+
        '<div class="manip-actions"><button type="button" data-manip-photo="s9_prescricao">📷 Fotografar prescrição</button></div>'+
        q(p,'legibilidade','A prescrição é legível, sem rasuras, e apresenta identificação do prescritor e do paciente conforme aplicável?','RDC 67/2007 · Anexo I · item 5.18.4')+
        q(p,'conteudo','A prescrição identifica substância ativa por DCB/DCI, concentração, forma farmacêutica, quantidades, posologia, duração, local/data e assinatura do prescritor?','RDC 67/2007 · Anexo I · item 5.18.4')+
        q(p,'calculos','Os cálculos de manipulação, fatores de conversão, correção e equivalência foram realizados e registrados na Ordem de Manipulação quando aplicáveis?','RDC 67/2007 · Anexo I · item 5.18.6')+
        q(p,'continuado','Em tratamento continuado, a duração foi expressamente indicada na receita?','RDC 67/2007 · Anexo I · item 5.17.5')+
        q(p,'controlados','Para substâncias sujeitas a controle especial, a prescrição/notificação e a escrituração atendem à legislação específica?','Portaria SVS/MS 344/1998')+
        q(p,'antimicrobianos','Para antimicrobianos, foram conferidos os requisitos de validade e retenção previstos no roteiro?','Referência normativa de antimicrobianos constante do roteiro; revisar na etapa normativa final','','Validade indicada no roteiro: 10 dias.')+
        q(p,'digital','Quando utilizada prescrição digital, a assinatura eletrônica foi validada e o arquivo digital foi arquivado pela farmácia?','Roteiro de inspeção · prescrição digital')+
        U.textarea(f(p+'.observacoes'),'Observações sobre as prescrições amostradas')
      );
    }

    function insumoRows(type,fi){
      const path='formulacoes.'+type+'.'+fi+'.insumos',rows=arr(path);
      if(!rows.length)return U.info('Nenhum insumo/excipiente/embalagem registrado nesta formulação.');
      return rows.map((r,ii)=>'<section class="manip-repeat-row"><div class="manip-grid">'+
        U.select(f(path+'.'+ii+'.tipo'),'Tipo',[['principio_ativo','Princípio ativo'],['excipiente','Excipiente'],['embalagem','Embalagem'],['outro','Outro']])+
        U.input(f(path+'.'+ii+'.nome'),'Insumo / material')+U.input(f(path+'.'+ii+'.lote'),'Lote')+U.input(f(path+'.'+ii+'.validade'),'Validade',{type:'date'})+
        U.input(f(path+'.'+ii+'.fabricante'),'Fabricante')+U.input(f(path+'.'+ii+'.fornecedor'),'Fornecedor')+U.input(f(path+'.'+ii+'.nota_fiscal'),'Nota fiscal / DANFE')+
      '</div><div class="manip-actions"><button type="button" data-manip-s9-ocr="danfe|'+C.esc(type)+'|'+fi+'|'+ii+'">📄 Ler DANFE</button><button type="button" data-manip-s9-ocr="certificado_fornecedor|'+C.esc(type)+'|'+fi+'|'+ii+'">📄 Ler certificado</button><button type="button" data-manip-s9-remove-insumo="'+C.esc(type)+'|'+fi+'|'+ii+'">Remover item</button></div></section>').join('');
    }

    function finishedProductChecks(type,fi){
      const base='formulacoes.'+type+'.'+fi+'.cq_produto';
      const labels=type==='solida' ? ['Descrição','Aspecto','Caracteres organolépticos','Peso médio','Desvio padrão','Coeficiente de variação','Informações da OM assinadas/aprovadas pelo farmacêutico'] :
        type==='semissolida' ? ['Descrição','Aspecto','Caracteres organolépticos','pH quando aplicável','Peso','Informações da OM assinadas/aprovadas pelo farmacêutico'] :
        ['Descrição','Aspecto','Caracteres organolépticos','pH','Peso ou volume antes do envase','Informações da OM assinadas/aprovadas pelo farmacêutico'];
      return '<div class="manip-check-grid">'+labels.map((label,i)=>U.checkbox(f(base+'.'+i),label)).join('')+'</div>';
    }

    function formulaRows(type,label){
      const path='formulacoes.'+type,rows=arr(path);
      if(!rows.length)return U.info('Nenhuma formulação '+label.toLowerCase()+' adicionada.');
      return rows.map((r,i)=>'<section class="manip-subcard"><h4>'+C.esc(label)+' — amostra '+(i+1)+'</h4><div class="manip-grid">'+
        U.input(f(path+'.'+i+'.produto'),'Produto / preparação')+U.input(f(path+'.'+i+'.om_numero'),'Ordem de Manipulação nº')+U.input(f(path+'.'+i+'.om_data'),'Data da OM',{type:'date'})+U.input(f(path+'.'+i+'.manipulado_por'),'Manipulado por')+
      '</div><div class="manip-actions"><button type="button" class="primary" data-manip-s9-ocr="ordem_manipulacao|'+C.esc(type)+'|'+i+'">📄 Ler Ordem de Manipulação</button><button type="button" data-manip-s9-add-insumo="'+C.esc(type)+'|'+i+'">+ Adicionar insumo/material</button><button type="button" data-manip-s9-remove-formula="'+C.esc(type)+'|'+i+'">Remover formulação</button></div>'+insumoRows(type,i)+
        q('formula_'+type+'_'+i,'om','A Ordem de Manipulação contém os insumos, lotes, fornecedor, quantidade pesada, assinaturas e visto farmacêutico aplicáveis?','RDC 67/2007 · Anexo I · item 8.4')+
        '<h5>Controle de qualidade do produto acabado</h5>'+finishedProductChecks(type,i)+
        '<h5>Controle de qualidade no recebimento — amostragem</h5>'+q('formula_'+type+'_'+i,'recebimento','Foi verificada a inspeção de recebimento quanto a identificação, integridade/limpeza e correspondência pedido/nota/rótulo?','RDC 67/2007 · Anexo I · item 7.2.1')+
        q('formula_'+type+'_'+i,'certificado','O certificado de análise do fornecedor foi conferido e está arquivado pelo prazo aplicável?','RDC 67/2007 · Anexo I · itens 7.2.4 e 7.2.5','','6 meses após a validade do último produto; 2 anos se controle especial.')+
        q('formula_'+type+'_'+i,'cq_mp','A farmácia realizou o controle de qualidade próprio da matéria-prima no recebimento?','RDC 67/2007 · Anexo I · item 7.3.10')+
        q('formula_'+type+'_'+i,'embalagem','Para o material de embalagem, foi verificado CQ no recebimento e compatibilidade do recipiente?','RDC 67/2007 · Anexo I · itens 7.3.2 e 7.1.9')+
        q('formula_'+type+'_'+i,'quarentena','O material permaneceu em quarentena até liberação pelo controle de qualidade?','RDC 67/2007 · Anexo I · item 7.2.7')+
        U.photoNotes('s9_formula_'+type+'_'+i,f(path+'.'+i+'.anotacoes'))+'</section>').join('');
    }

    function formulations(){
      return U.box('9.2 Rastreabilidade por formulação amostrada',
        U.info('Para cada formulação, escolher ao menos um princípio ativo, um excipiente e um material de embalagem e seguir OM → lote → DANFE/NF → certificado do fornecedor/fabricante → CQ de recebimento → produto acabado → rótulo.')+
        '<h3>9.2.1 Formulação Sólida</h3><button type="button" data-manip-s9-add-formula="solida">+ Adicionar formulação sólida</button>'+formulaRows('solida','Formulação Sólida')+
        '<h3>9.2.2 Formulação Semissólida</h3><button type="button" data-manip-s9-add-formula="semissolida">+ Adicionar formulação semissólida</button>'+formulaRows('semissolida','Formulação Semissólida')+
        '<h3>9.2.3 Formulação Líquida</h3><button type="button" data-manip-s9-add-formula="liquida">+ Adicionar formulação líquida</button>'+formulaRows('liquida','Formulação Líquida')
      );
    }

    function vegetalRows(){
      const rows=arr('vegetal.amostras');
      if(!rows.length)return U.info('Nenhuma matéria-prima vegetal amostrada.');
      return rows.map((r,i)=>'<section class="manip-repeat-row"><div class="manip-grid">'+U.input(f('vegetal.amostras.'+i+'.nome'),'Matéria-prima vegetal')+U.input(f('vegetal.amostras.'+i+'.lote'),'Lote')+U.input(f('vegetal.amostras.'+i+'.fabricante'),'Fabricante')+U.input(f('vegetal.amostras.'+i+'.validade'),'Validade',{type:'date'})+U.input(f('vegetal.amostras.'+i+'.nf'),'DANFE / NF')+U.input(f('vegetal.amostras.'+i+'.certificado'),'Certificado do fabricante')+'</div><div class="manip-actions"><button type="button" class="primary" data-manip-s9-ocr="vegetal_danfe|'+i+'">📄 Ler DANFE de aquisição</button><button type="button" class="primary" data-manip-s9-ocr="vegetal_certificado|'+i+'">📄 Ler certificado do fabricante</button><button type="button" data-manip-s9-remove="vegetal.amostras|'+i+'">Remover amostra</button></div>'+U.textarea(f('vegetal.amostras.'+i+'.resultado'),'Dados/resultados extraídos e conferidos')+U.photoNotes('s9_vegetal_'+i,f('vegetal.amostras.'+i+'.anotacoes'))+'</section>').join('');
    }

    function vegetal(){
      return U.box('9.3 Controle de Qualidade de Matéria-Prima Vegetal',
        U.localApplicability(f('vegetal.aplicabilidade'),'Matéria-prima vegetal se aplica à amostragem desta inspeção?')+
        q('vegetal','ensaios','Foram verificados caracteres organolépticos, materiais estranhos, contaminação microbiológica, umidade e cinzas totais?','RDC 67/2007 · Anexo I · item 7.3.13')+
        q('vegetal','caracterizacao','Foi verificada caracterização macroscópica e microscópica e, para matérias-primas vegetais líquidas, densidade?','RDC 67/2007 · Anexo I · item 7.3.13')+
        '<div class="manip-actions"><button type="button" data-manip-s9-add="vegetal.amostras">+ Adicionar matéria-prima vegetal</button></div>'+vegetalRows()
      );
    }

    function homeoRows(){
      const rows=arr('homeopatica.amostras');
      if(!rows.length)return U.info('Nenhuma matriz/tintura/insumo homeopático registrado.');
      return rows.map((r,i)=>'<section class="manip-repeat-row"><div class="manip-grid">'+U.input(f('homeopatica.amostras.'+i+'.nome'),'Matriz / tintura / insumo')+U.input(f('homeopatica.amostras.'+i+'.lote'),'Lote')+U.input(f('homeopatica.amostras.'+i+'.dinamizacao'),'Dinamização')+U.input(f('homeopatica.amostras.'+i+'.origem'),'Matriz / origem anterior')+U.input(f('homeopatica.amostras.'+i+'.teor_alcoolico'),'Teor alcoólico')+U.input(f('homeopatica.amostras.'+i+'.certificado'),'Certificado / documento')+'</div><button type="button" class="primary" data-manip-s9-ocr="homeopatia|'+i+'">📄 Extrair dados do documento</button><button type="button" data-manip-s9-remove="homeopatica.amostras|'+i+'">Remover</button>'+U.photoNotes('s9_homeopatia_'+i,f('homeopatica.amostras.'+i+'.anotacoes'))+'</section>').join('');
    }

    function homeopatia(){
      return U.box('9.4 Controle de Qualidade de Matéria-Prima Homeopática',
        U.localApplicability(f('homeopatica.aplicabilidade'),'Matéria-prima homeopática se aplica a esta inspeção?')+
        q('homeopatica','rastreabilidade','As matrizes, tinturas-mãe e insumos homeopáticos possuem identificação e rastreabilidade conforme a referência aplicável?','RDC 67/2007 · Anexo V')+
        q('homeopatica','alcool','O teor alcoólico das matrizes estocadas foi conferido em relação à referência aplicável?','RDC 67/2007 · Anexo V')+
        '<button type="button" data-manip-s9-add="homeopatica.amostras">+ Adicionar matriz / insumo</button>'+homeoRows()
      );
    }

    function stockRows(){
      const rows=arr('estoque.itens');
      if(!rows.length)return U.info('Nenhuma substância selecionada para confronto.');
      return rows.map((r,i)=>'<section class="manip-repeat-row"><div class="manip-grid">'+
        U.input(f('estoque.itens.'+i+'.substancia'),'Substância')+U.input(f('estoque.itens.'+i+'.lista'),'Lista / classificação Portaria 344/98')+U.input(f('estoque.itens.'+i+'.fabricante'),'Fabricante')+U.input(f('estoque.itens.'+i+'.ifa_tipo'),'Tipo do identificador Anvisa/IFA')+U.input(f('estoque.itens.'+i+'.ifa_numero'),'Identificador Anvisa/IFA')+U.input(f('estoque.itens.'+i+'.lote'),'Lote')+U.input(f('estoque.itens.'+i+'.fisico'),'Estoque físico',{type:'number',step:'0.0001'})+U.input(f('estoque.itens.'+i+'.sistema'),'Estoque escriturado / sistema',{type:'number',step:'0.0001'})+U.input(f('estoque.itens.'+i+'.diferenca'),'Diferença físico − escriturado',{type:'number',step:'0.0001'})+
      '</div><div class="manip-actions"><button type="button" data-manip-s9-controlado="'+i+'">Classificar substância</button><button type="button" data-manip-s9-ifa="'+i+'">Consultar IFA / Anvisa</button><button type="button" data-manip-s9-remove="estoque.itens|'+i+'">Remover</button></div>'+U.photoNotes('s9_estoque_'+i,f('estoque.itens.'+i+'.anotacoes'))+'</section>').join('');
    }

    function stock(){
      return U.box('9.5 Confronto estoque físico × escriturado — Portaria 344/98',
        U.info('A diferença é matemática. Valor diferente de zero não é convertido automaticamente em não conformidade. Fabricante documental e fabricante localizado em fonte oficial permanecem separados quando divergirem.')+
        '<button type="button" data-manip-s9-add="estoque.itens">+ Adicionar substância</button>'+stockRows()+
        '<div class="manip-mini-choice"><b>Conclusão da equipe sobre a amostragem de estoque</b>'+U.choice(f('estoque.situacao'),[['c','Conforme'],['nc','Não conforme'],['na','Não se aplica']])+'</div>'+U.textarea(f('estoque.observacoes'),'Observações / justificativa da equipe')
      );
    }

    function transport(){
      const p='transporte';
      return U.box('9.6 Conservação, Transporte e Dispensação',
        U.localApplicability(f(p+'.aplicabilidade'),'Conservação/transporte/entrega se aplica a esta inspeção?')+
        q(p,'procedimentos','Há procedimentos escritos de conservação e transporte que garantam as especificações e a integridade até a dispensação?','RDC 67/2007 · item 13')+
        q(p,'termossensiveis','Os medicamentos termossensíveis são mantidos e transportados em temperatura compatível, com registros e controles e meio qualificado quando aplicável?','RDC 67/2007 · item 13.1')+
        q(p,'incompatibilidade','Os manipulados não são armazenados/transportados junto a materiais incompatíveis como alimentos, animais, solventes, gases, corrosivos/tóxicos, pesticidas ou radioativos?','RDC 67/2007 · item 13.2')+
        q(p,'carimbo','As receitas aviadas recebem identificação do estabelecimento, data da dispensação e número de registro da manipulação quando exigido?','RDC 67/2007 · item 14.2')+
        q(p,'repeticao','A repetição de atendimento da mesma receita ocorre somente quando expressamente autorizada pela duração do tratamento prescrita?','RDC 67/2007 · item 14.3')+
        U.grid(U.input(f(p+'.responsavel'),'Responsável / transportadora')+U.input(f(p+'.cnpj'),'CNPJ')+U.input(f(p+'.meio'),'Meio / recipiente de transporte')+U.input(f(p+'.faixa'),'Faixa de temperatura adotada, se aplicável'))+
        U.refrigerator(f(p+'.refrigerador'),{title:'Controle de termossensíveis / meio refrigerado, se aplicável'})+U.photoNotes('s9_transporte',n(p+'.geral'))
      );
    }

    function render(){return prescription()+formulations()+vegetal()+homeopatia()+stock()+transport()+'<div class="manip-actions"><button type="button" class="primary" data-manip-copy-section="9">📋 Copiar texto desta seção</button></div>';}

    function addFormula(type){C.update(state=>{const path=f('formulacoes.'+type),list=C.getPath(state,path,[]),next=Array.isArray(list)?list:[];next.push({produto:'',om_numero:'',om_data:'',manipulado_por:'',insumos:[],cq_produto:{},anotacoes:''});C.setPath(state,path,next);},{source:'section9-formula-add'});}
    function addInsumo(type,fi){C.update(state=>{const path=f('formulacoes.'+type+'.'+fi+'.insumos'),list=C.getPath(state,path,[]),next=Array.isArray(list)?list:[];next.push({tipo:'',nome:'',lote:'',validade:'',fabricante:'',fornecedor:'',nota_fiscal:''});C.setPath(state,path,next);},{source:'section9-insumo-add'});}
    function removePath(path,index){C.update(state=>{const full=f(path),list=C.getPath(state,full,[]);if(Array.isArray(list))list.splice(Number(index),1);C.setPath(state,full,list);},{source:'section9-remove'});}
    function addGeneric(path){const seed=path==='estoque.itens'?{substancia:'',lista:'',fabricante:'',ifa_tipo:'',ifa_numero:'',lote:'',fisico:'',sistema:'',diferenca:'',anotacoes:''}:{};C.update(state=>{const full=f(path),list=C.getPath(state,full,[]),next=Array.isArray(list)?list:[];next.push(seed);C.setPath(state,full,next);},{source:'section9-add'});}
    function updateDifference(i){const fis=Number(C.field(f('estoque.itens.'+i+'.fisico'),'')),sys=Number(C.field(f('estoque.itens.'+i+'.sistema'),''));if(Number.isFinite(fis)&&Number.isFinite(sys))C.setField(f('estoque.itens.'+i+'.diferenca'),String(fis-sys),{render:false,source:'stock-calc'});}

    let installed=false;
    function install(){if(installed)return;installed=true;
      document.addEventListener('click',event=>{
        const af=event.target.closest?.('[data-manip-s9-add-formula]');if(af){addFormula(af.dataset.manipS9AddFormula);return;}
        const ai=event.target.closest?.('[data-manip-s9-add-insumo]');if(ai){const[t,i]=ai.dataset.manipS9AddInsumo.split('|');addInsumo(t,i);return;}
        const rf=event.target.closest?.('[data-manip-s9-remove-formula]');if(rf){const[t,i]=rf.dataset.manipS9RemoveFormula.split('|');removePath('formulacoes.'+t,i);return;}
        const ri=event.target.closest?.('[data-manip-s9-remove-insumo]');if(ri){const[t,fi,ii]=ri.dataset.manipS9RemoveInsumo.split('|');removePath('formulacoes.'+t+'.'+fi+'.insumos',ii);return;}
        const ag=event.target.closest?.('[data-manip-s9-add]');if(ag){addGeneric(ag.dataset.manipS9Add);return;}
        const rg=event.target.closest?.('[data-manip-s9-remove]');if(rg){const[path,i]=rg.dataset.manipS9Remove.split('|');removePath(path,i);return;}
        const ocr=event.target.closest?.('[data-manip-s9-ocr]');if(ocr){const parts=ocr.dataset.manipS9Ocr.split('|');document.dispatchEvent(new CustomEvent('manipulacao:ocr-request',{detail:{section:'9',kind:parts[0],args:parts.slice(1)}}));return;}
        const cls=event.target.closest?.('[data-manip-s9-controlado]');if(cls){document.dispatchEvent(new CustomEvent('manipulacao:controlled-query',{detail:{index:Number(cls.dataset.manipS9Controlado),substancia:C.field(f('estoque.itens.'+cls.dataset.manipS9Controlado+'.substancia'),'')}}));return;}
        const ifa=event.target.closest?.('[data-manip-s9-ifa]');if(ifa){const i=Number(ifa.dataset.manipS9Ifa);document.dispatchEvent(new CustomEvent('manipulacao:ifa-query',{detail:{index:i,substancia:C.field(f('estoque.itens.'+i+'.substancia'),''),fabricante:C.field(f('estoque.itens.'+i+'.fabricante'),'')}}));}
      });
      document.addEventListener('input',event=>{const field=event.target.closest?.('[data-manip-field]');if(!field)return;const m=/sections\.9\.fields\.estoque\.itens\.(\d+)\.(fisico|sistema)$/.exec(field.dataset.manipField||'');if(m)setTimeout(()=>updateDifference(Number(m[1])),0);});
    }

    C.registerSection('9',{title:'Rastreabilidade e Controle de Qualidade',shortTitle:'Rastreabilidade',render,afterRender:install});
    window.ManipulacaoSection9=Object.freeze({render,install});
    document.dispatchEvent(new CustomEvent('manipulacao:section9-ready'));
  };
  start();
})();
