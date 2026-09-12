/* Farmácia de Manipulação — Seção 8: Monitoramento do Processo Magistral e da Água */
(function (window, document) {
  'use strict';
  var FM=window.FarmaciaManipulacao;if(!FM){console.error('[FarmaciaManipulacao] Core não carregado antes da Seção 8.');return;}
  var BASE='sections.s8',E=FM.dom.el;
  function card(t,s){var c=E('section','fm-section-card');c.appendChild(E('h3','fm-section-card-title',t));if(s)c.appendChild(E('p','fm-section-card-subtitle',s));return c;}
  function q(p,t,h){var r=E('article','fm-requirement-row'),m=E('div','fm-requirement-main');m.appendChild(E('div','fm-requirement-text',t));if(h)m.appendChild(FM.requirementHint(h));m.appendChild(FM.createStatusControl({path:p+'.status',ariaLabel:t}));r.appendChild(m);var d=document.createElement('details');d.className='fm-requirement-details';var s=document.createElement('summary');s.textContent='Anotações e foto';d.appendChild(s);d.appendChild(FM.createPhotoNotesControl({path:p,multiple:true}));r.appendChild(d);return r;}
  function ocrButton(type,dest){var b=E('button','fm-secondary-button','📄 Ler relatório de ensaio');b.type='button';b.addEventListener('click',function(){FM.emit('ocr-request',{documentType:'relatorio-ensaio',profile:type,destination:dest});});return b;}
  function analysisBlock(key,title,period,helper){var p=BASE+'.'+key,c=card(title);c.appendChild(FM.requirementHint(period,{label:'Periodicidade informada no roteiro: '}));if(helper)c.appendChild(E('p','fm-helper-text',helper));var a=E('div','fm-document-actions');a.appendChild(ocrButton(key,p+'.eventos'));a.appendChild(E('span','fm-helper-text','O OCR extrai dados e resultados; não classifica a situação sanitária.'));c.appendChild(a);c.appendChild(FM.createRepeatableTable({path:p+'.eventos',addLabel:'+ Adicionar evento / laudo',columns:[{key:'coleta',label:'Data/hora da coleta'},{key:'pontoColeta',label:'Ponto de coleta / origem'},{key:'codigoAmostra',label:'Código da amostra'},{key:'certificados',label:'Relatório(s) / certificado(s)'},{key:'amostra',label:'Produto / amostra'},{key:'lote',label:'Lote'},{key:'fabricante',label:'Fabricante'},{key:'validade',label:'Validade'},{key:'recebimento',label:'Recebimento'},{key:'emissao',label:'Emissão'},{key:'resultado',label:'Conclusão textual',type:'textarea'},{key:'ensaios',label:'Parâmetro | resultado | unidade | limite | LQ | método | data',type:'textarea'}]}));c.appendChild(q(p+'.periodicidade','A periodicidade foi conferida pela data de coleta, considerando os eventos de amostragem e não a quantidade de PDFs?'));c.appendChild(FM.createPhotoNotesControl({path:p+'.registrosGerais',multiple:true}));return c;}
  function norm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();}
  function addUniqueText(a,b,sep){var parts=[];[a,b].forEach(function(v){String(v||'').split(sep==='\n'?/\n/:/\s*\/\s*|\s*\|\s*/).forEach(function(x){x=String(x||'').trim();if(x&&!parts.some(function(y){return norm(y)===norm(x);}))parts.push(x);});});return parts.join(sep||' / ');}
  function sameSamplingEvent(a,b){
    if(!a||!b)return false;
    var ca=norm(a.coleta),cb=norm(b.coleta);if(!ca||!cb||ca!==cb)return false;
    var aa=norm(a.amostra),ab=norm(b.amostra);
    if(aa&&ab&&(aa.indexOf(ab)<0&&ab.indexOf(aa)<0))return false;
    var pa=norm(a.pontoColeta),pb=norm(b.pontoColeta);
    if(pa&&pb&&(pa.indexOf(pb)<0&&pb.indexOf(pa)<0))return false;
    return true;
  }
  function mergeSamplingEvent(destination){
    var rows=FM.get(destination,[]);if(!Array.isArray(rows)||rows.length<2)return false;
    var last=rows[rows.length-1],at=-1;
    for(var i=0;i<rows.length-1;i+=1){if(sameSamplingEvent(rows[i],last)){at=i;break;}}
    if(at<0)return false;
    var first=rows[at];
    first.certificados=addUniqueText(first.certificados,last.certificados,' / ');
    first.amostra=first.amostra||last.amostra||'';
    first.pontoColeta=first.pontoColeta||last.pontoColeta||'';
    first.lote=first.lote||last.lote||'';
    first.fabricante=first.fabricante||last.fabricante||'';
    first.validade=first.validade||last.validade||'';
    first.recebimento=first.recebimento||last.recebimento||'';
    first.emissao=addUniqueText(first.emissao,last.emissao,' / ');
    first.resultado=addUniqueText(first.resultado,last.resultado,' | ');
    first.ensaios=addUniqueText(first.ensaios,last.ensaios,'\n');
    first.codigoAmostra=addUniqueText(first.codigoAmostra,last.codigoAmostra,' / ');
    var docs=[];
    function pushDoc(d){if(d&&d.id&&!docs.some(function(x){return x.id===d.id;}))docs.push(d);}
    (first.sourceDocuments||[]).forEach(pushDoc);pushDoc(first.sourceDocument);(last.sourceDocuments||[]).forEach(pushDoc);pushDoc(last.sourceDocument);
    first.sourceDocuments=docs;delete first.sourceDocument;
    rows.splice(rows.length-1,1);rows[at]=first;
    FM.set(destination,rows,{source:'section8-sampling-merge'});
    return true;
  }
  function refreshVisible(){window.setTimeout(function(){var target=document.querySelector('#fm-app.is-open .fm-app-content.fm-section8');if(target)render(target);},0);}
  function onOcrApplied(event){var d=event&&event.detail||{},dest=String(d.destination||'');if(d.documentType!=='relatorio-ensaio'||dest.indexOf(BASE+'.')!==0||!/\.eventos$/.test(dest))return;mergeSamplingEvent(dest);refreshVisible();}
  if(!window.__FM_SECTION8_EVENT_MERGE__){window.__FM_SECTION8_EVENT_MERGE__=true;window.addEventListener('farmacia-manipulacao:ocr-applied',onOcrApplied);}
  function text(){var s=FM.get(BASE,{}),lines=['MONITORAMENTO DO PROCESSO MAGISTRAL E DA ÁGUA'];[['aguaPurificada','Água purificada'],['aguaPotavel','Água potável'],['baseGalenica','Base galênica'],['baixaDose','Fármaco ≤ 25 mg'],['diluido','Diluído preparado'],['sensibilizantes','Sensibilizantes']].forEach(function(x){var ev=((s[x[0]]||{}).eventos)||[];if(ev.length)lines.push(x[1]+': '+ev.map(function(e){return [e.certificados,e.amostra,e.lote,e.coleta,e.pontoColeta,e.resultado].filter(Boolean).join(' · ');}).join('; '));});return lines.join('\n');}
  function render(target){FM.dom.clear(target);target.classList.add('fm-manipulation-module','fm-section8');var h=E('header','fm-section-header');h.appendChild(E('h2','fm-section-title','8. Monitoramento do Processo Magistral e da Água'));h.appendChild(E('p','fm-section-intro','Solicitar, no mínimo, as duas últimas análises de cada tipo e verificar a periodicidade pela data de coleta. Resultados do laboratório permanecem separados da conclusão da inspeção.'));h.appendChild(FM.createCopyButton({getText:text}));target.appendChild(h);
    target.appendChild(analysisBlock('aguaPurificada','8.1 Água Purificada','Mensal','Relatórios físico-químico e microbiológico da mesma coleta são vinculados automaticamente ao mesmo evento de amostragem quando a data/hora, a amostra e, quando informados, o ponto de coleta coincidem, sem contar dois períodos. Preservar literalmente resultados como <1,0, “Ausente”, “-” e “Não consta”.'));
    target.appendChild(analysisBlock('aguaPotavel','8.2 Água Potável','Semestral','Registrar ponto de coleta, parâmetros, limites, unidades e conclusão textual exatamente como constam nos relatórios.'));
    target.appendChild(analysisBlock('baseGalenica','8.3 Pureza microbiológica de base galênica','Mensal','Registrar base/amostra, lote, fabricante, validade, recebimento, coleta e resultados.'));
    target.appendChild(analysisBlock('baixaDose','8.4 Teor e uniformidade de fármaco ≤ 25 mg — prioridade ≤ 5 mg','Bimestral','A tela pode calcular/exibir o intervalo entre eventos como apoio, mas não marca NC automaticamente.'));
    target.appendChild(analysisBlock('diluido','8.5 Teor de Diluído Preparado','Trimestral','Quando o laudo apresentar resultados em vários pontos, preservar cada ponto separadamente.'));
    target.appendChild(analysisBlock('sensibilizantes','8.6 Teor e Uniformidade de Substâncias Sensibilizantes — rodízio','Trimestral','Registrar a substância/classe de cada evento para facilitar a conferência do sistema de rodízio sem julgamento automático.'));
    var agua=card('8.7 Água — verificações complementares');[['pop','Há POP de amostragem e periodicidade das análises de água potável e purificada?'],['ponto','Um dos pontos de amostragem da água purificada é o local usado para armazenamento?'],['parametros','A análise de água potável contempla os parâmetros previstos no roteiro — pH, cor aparente, turbidez, cloro residual livre, sólidos totais dissolvidos, contagem bacteriana, coliformes totais, E. coli e coliformes termorresistentes?'],['insatisfPotavel','Quando um laudo de água potável é insatisfatório, há registro das medidas adotadas?'],['insatisfPurificada','Quando um laudo de água purificada é insatisfatório, há registro das medidas e avaliação de efetividade por nova análise?']].forEach(function(x){agua.appendChild(q(BASE+'.aguaComplementar.'+x[0],x[1]));});target.appendChild(agua);
    var lab=card('Laboratório terceirizado / emissor');lab.appendChild(FM.createRepeatableTable({path:BASE+'.laboratorios',addLabel:'+ Adicionar laboratório',columns:[{key:'nome',label:'Laboratório'},{key:'cnpj',label:'CNPJ'},{key:'licenca',label:'Licença / condição verificada'},{key:'observacao',label:'Observação'}]}));target.appendChild(lab);
    FM.emit('section-rendered',{section:8,target:target});return target;
  }
  FM.sections=FM.sections||{};FM.sections.section8={id:'section8',title:'Monitoramento do Processo Magistral e da Água',render:render,statePath:BASE,getText:text};FM.renderSection8=render;
})(window,document);