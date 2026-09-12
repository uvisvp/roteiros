/* Farmácia de Manipulação — consultas regulatórias compartilhadas.
 * CNPJ/AFE/AE reutilizam a base pública já consumida pela Drogaria.
 * IFA usa o motor compartilhado da Central de Consultas, alimentado pela base pública validada.
 */
(function(window, document){
  'use strict';
  var FM=window.FarmaciaManipulacao;
  if(!FM||FM.lookupAdapter)return;

  function E(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  function clean(v){return String(v==null?'':v).trim();}
  function unique(values){var out=[];(values||[]).forEach(function(v){v=clean(v);if(v&&!out.some(function(x){return x===v;}))out.push(v);});return out;}
  function digits(v){return clean(v).replace(/\D/g,'');}
  function formatCnpj(v){var d=digits(v);return /^\d{14}$/.test(d)?d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,'$1.$2.$3/$4-$5'):clean(v);}

  function dialog(){
    var d=document.getElementById('fm-lookup-dialog');
    if(!d){d=document.createElement('dialog');d.id='fm-lookup-dialog';d.className='fm-dialog';document.body.appendChild(d);}
    d.innerHTML='';
    return d;
  }
  function closeButton(d){var b=E('button','','Fechar ×');b.type='button';b.addEventListener('click',function(){d.close();});return b;}
  function input(label,value,opts){opts=opts||{};var l=E('label','fm-field');l.appendChild(E('span','fm-field-label',label));var i=opts.textarea?document.createElement('textarea'):document.createElement('input');if(opts.textarea)i.rows=opts.rows||3;else i.type=opts.type||'text';i.className='fm-input';i.value=value||'';if(opts.placeholder)i.placeholder=opts.placeholder;l.appendChild(i);l.input=i;return l;}

  function ensureAnvisaTools(){
    if(window.DrogariaOcrTools&&window.DrogariaOcrTools.anvisa&&typeof window.DrogariaOcrTools.anvisa.empresa==='function')return Promise.resolve(window.DrogariaOcrTools);
    return new Promise(function(resolve,reject){
      var existing=document.querySelector('script[data-fm-shared-anvisa]')||document.querySelector('script[src$="drogaria-ocr-tools.js"]');
      function ready(){if(window.DrogariaOcrTools&&window.DrogariaOcrTools.anvisa&&typeof window.DrogariaOcrTools.anvisa.empresa==='function')resolve(window.DrogariaOcrTools);else reject(new Error('O módulo compartilhado de consultas Anvisa não ficou disponível.'));}
      if(existing){if(window.DrogariaOcrTools)return ready();existing.addEventListener('load',ready,{once:true});existing.addEventListener('error',function(){reject(new Error('Não foi possível carregar a consulta compartilhada da Anvisa.'));},{once:true});return;}
      var s=document.createElement('script');s.src='./drogaria-ocr-tools.js';s.dataset.fmSharedAnvisa='1';s.onload=ready;s.onerror=function(){reject(new Error('Não foi possível carregar a consulta compartilhada da Anvisa.'));};document.head.appendChild(s);
    });
  }

  function existingCnpj(){return FM.get('sections.s1.estabelecimento.cnpj','')||FM.get('sections.s1.licenca.cnpj','')||FM.get('sections.s1.crt.cnpj','');}
  function sourceMeta(destination,result){
    FM.set(destination+'.consultaFonte',result.source||'Base pública Anvisa — AFE/AE',{source:'lookup-apply',silent:true});
    FM.set(destination+'.consultaEm',result.queriedAt||new Date().toISOString(),{source:'lookup-apply',silent:true});
  }
  function emitApplied(type,destination,fields,result){FM.emit('lookup-applied',{lookupType:type,destination:destination,fields:fields,source:result.source||'',queriedAt:result.queriedAt||''});}

  function openCompanyLookup(detail){
    detail=detail||{};var type=detail.lookupType||'cnpj',destination=detail.destination||'sections.s1.estabelecimento',d=dialog();
    var head=E('header');head.appendChild(E('strong','',type==='afe'?'Consulta AFE':type==='ae'?'Consulta AE':'Consulta por CNPJ — Anvisa'));head.appendChild(closeButton(d));d.appendChild(head);
    var body=E('div','fm-dialog-body');d.appendChild(body);
    body.appendChild(E('p','fm-helper-text','A consulta apenas propõe dados. Confira e edite antes de aplicar ao roteiro. Processo e data de publicação permanecem em branco quando a fonte compartilhada não os fornece de modo estruturado.'));
    var cnpjField=input('CNPJ',formatCnpj(existingCnpj()),{placeholder:'00.000.000/0000-00'});body.appendChild(cnpjField);
    var actions=E('div','fm-document-actions'),search=E('button','fm-secondary-button','Consultar base pública Anvisa');search.type='button';actions.appendChild(search);body.appendChild(actions);
    var status=E('p','fm-helper-text','');body.appendChild(status);var resultBox=E('div','');body.appendChild(resultBox);

    search.addEventListener('click',function(){
      var cnpj=cnpjField.input.value;if(digits(cnpj).length!==14){status.textContent='Informe um CNPJ com 14 dígitos.';return;}
      search.disabled=true;status.textContent='Consultando AFE/AE na base pública da Anvisa…';resultBox.innerHTML='';
      ensureAnvisaTools().then(function(tools){return tools.anvisa.empresa(cnpj);}).then(function(result){
        status.textContent='Consulta concluída. Revise os dados antes de aplicar.';
        var grid=E('div','fm-field-grid');
        var razao=input('Razão social',result.razao_social||'');
        var cnpjReview=input('CNPJ',formatCnpj(result.cnpj||cnpj));
        var afe=input('AFE encontrada(s)',unique(result.numero_afe).join(' / '));
        var ae=input('AE encontrada(s)',unique(result.numero_ae).join(' / '));
        var atividades=input('Atividades encontradas',unique(result.atividades).join('; '),{textarea:true,rows:4});
        [razao,cnpjReview,afe,ae,atividades].forEach(function(x){grid.appendChild(x);});resultBox.appendChild(grid);
        var meta=E('p','fm-helper-text',(result.source||'Base pública Anvisa — AFE/AE')+(result.queriedAt?' · consulta '+new Date(result.queriedAt).toLocaleString('pt-BR'):'')+'.');resultBox.appendChild(meta);
        var apply=E('button','fm-secondary-button','Conferir e aplicar');apply.type='button';resultBox.appendChild(apply);
        apply.addEventListener('click',function(){
          var fields={razaoSocial:razao.input.value,cnpj:cnpjReview.input.value,afe:afe.input.value,ae:ae.input.value,atividades:atividades.input.value};
          if(type==='cnpj'){
            if(fields.cnpj)FM.set(destination+'.cnpj',fields.cnpj,{source:'lookup-apply',silent:true});
            if(fields.razaoSocial)FM.set(destination+'.razaoSocial',fields.razaoSocial,{source:'lookup-apply',silent:true});
            sourceMeta(destination,result);
          }else if(type==='afe'){
            FM.set(destination+'.numero',fields.afe,{source:'lookup-apply',silent:true});
            FM.set(destination+'.atividades',fields.atividades,{source:'lookup-apply',silent:true});
            sourceMeta(destination,result);
          }else if(type==='ae'){
            FM.set(destination+'.numero',fields.ae,{source:'lookup-apply',silent:true});
            FM.set(destination+'.atividades',fields.atividades,{source:'lookup-apply',silent:true});
            sourceMeta(destination,result);
          }
          emitApplied(type,destination,fields,result);d.close();
        });
      }).catch(function(err){status.textContent='Não foi possível concluir a consulta: '+(err&&err.message?err.message:String(err));}).finally(function(){search.disabled=false;});
    });
    d.showModal();
  }

  function ensureIfaTools(){
    if(window.UvisIfaLookup&&typeof window.UvisIfaLookup.search==='function')return Promise.resolve(window.UvisIfaLookup);
    return new Promise(function(resolve,reject){
      var existing=document.querySelector('script[data-fm-shared-ifa]')||document.querySelector('script[src$="ifa-lookup-shared.js"]');
      function ready(){if(window.UvisIfaLookup&&typeof window.UvisIfaLookup.search==='function')resolve(window.UvisIfaLookup);else reject(new Error('O motor compartilhado de IFA não ficou disponível.'));}
      if(existing){if(window.UvisIfaLookup)return ready();existing.addEventListener('load',ready,{once:true});existing.addEventListener('error',function(){reject(new Error('Não foi possível carregar a consulta IFA.'));},{once:true});return;}
      var sc=document.createElement('script');sc.src='./ifa-lookup-shared.js';sc.dataset.fmSharedIfa='1';sc.onload=ready;sc.onerror=function(){reject(new Error('Não foi possível carregar a consulta IFA.'));};document.head.appendChild(sc);
    });
  }
  function normIfa(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function applyIfa(detail,item,meta){
    var destination=detail.destination||'sections.s9.estoqueControlados',r=(window.UvisIfaLookup&&window.UvisIfaLookup.formatResult)?window.UvisIfaLookup.formatResult(item):item;
    if(/\.estoqueControlados$/.test(destination)){
      var rows=FM.get(destination+'.rows',[]);if(!Array.isArray(rows))rows=[];
      var target=-1,needle=normIfa(r.ifa);
      for(var i=0;i<rows.length;i++){if(normIfa(rows[i]&&rows[i].substancia)===needle){target=i;break;}}
      if(target<0){for(var j=0;j<rows.length;j++){if(!clean(rows[j]&&rows[j].substancia)){target=j;break;}}}
      if(target<0){rows.push({substancia:'',lista:'',fabricante:'',ifa:'',tipoId:'',lote:'',fisico:'',sistema:'',diferenca:''});target=rows.length-1;}
      var row=rows[target]||{};
      if(!clean(row.substancia))row.substancia=r.ifa||'';
      row.fabricante=r.fabricante_ifa||row.fabricante||'';
      row.ifa=r.identificador||r.processo_anvisa||'';
      row.tipoId=r.identificador_tipo||'processo_anvisa';
      row.codigoFabricanteIfa=r.codigo_fabricante_ifa||'';
      row.paisFabricanteIfa=r.pais_fabricante||'';
      row.detentorPeticionante=r.detentor_peticionante||'';
      row.cnpjDetentorPeticionante=r.cnpj_detentor_peticionante||'';
      row.assuntoIfa=r.assunto||'';
      row.ifaFonte=meta.fonte||'';
      row.ifaGeradoEm=meta.gerado_em||'';
      rows[target]=row;
      FM.set(destination+'.rows',rows,{source:'ifa-lookup-apply'});
    }else{
      FM.set(destination+'.ifa',r.ifa||'',{source:'ifa-lookup-apply',silent:true});
      FM.set(destination+'.fabricante',r.fabricante_ifa||'',{source:'ifa-lookup-apply',silent:true});
      FM.set(destination+'.identificador',r.identificador||r.processo_anvisa||'',{source:'ifa-lookup-apply',silent:true});
      FM.set(destination+'.tipoId',r.identificador_tipo||'processo_anvisa',{source:'ifa-lookup-apply',silent:true});
      FM.set(destination+'.codigoFabricanteIfa',r.codigo_fabricante_ifa||'',{source:'ifa-lookup-apply',silent:true});
      FM.set(destination+'.consultaFonte',meta.fonte||'',{source:'ifa-lookup-apply',silent:true});
      FM.set(destination+'.consultaEm',new Date().toISOString(),{source:'ifa-lookup-apply'});
    }
    FM.emit('lookup-applied',{lookupType:'ifa',destination:destination,fields:r,source:meta.fonte||'',geradoEm:meta.gerado_em||''});
    return r;
  }
  function openIfaLookup(detail){
    detail=detail||{};var destination=detail.destination||'sections.s9.estoqueControlados',d=dialog();
    var head=E('header');head.appendChild(E('strong','','IFA — Insumo Farmacêutico Ativo'));head.appendChild(closeButton(d));d.appendChild(head);
    var body=E('div','fm-dialog-body');d.appendChild(body);
    body.appendChild(E('p','fm-helper-text','Consulta na visão pública de IFA da Anvisa. O identificador exibido é o Processo Anvisa do IFA/petição disponível na fonte; não é registro do medicamento acabado. Ausência de resultado não prova ausência de regularização por outra via.'));
    var q=input('IFA, fabricante, código do fabricante, processo Anvisa ou CNPJ do peticionante',detail.query||'',{placeholder:'Ex.: ampicilina sódica'});body.appendChild(q);
    var actions=E('div','fm-document-actions'),search=E('button','fm-secondary-button','Consultar IFA');search.type='button';actions.appendChild(search);body.appendChild(actions);
    var status=E('p','fm-helper-text','');body.appendChild(status);var box=E('div','');body.appendChild(box);
    function renderResult(result){
      box.innerHTML='';var list=result.resultados||[];
      status.textContent=list.length?(result.total+' resultado(s) localizado(s). Confira fabricante e processo antes de aplicar.'):'Nenhum resultado localizado nesta base pública. Isso não equivale a ausência de regularização.';
      if(result.observacao)box.appendChild(E('p','fm-helper-text',result.observacao));
      list.forEach(function(raw){
        var r=window.UvisIfaLookup.formatResult(raw),card=E('section','fm-section-card');
        card.appendChild(E('h3','fm-section-card-title',r.ifa||'IFA'));
        var lines=[
          ['Fabricante do IFA',r.fabricante_ifa],['Código do fabricante',r.codigo_fabricante_ifa],['País',r.pais_fabricante],
          ['Processo Anvisa (IFA)',r.processo_anvisa],['Detentor / peticionante',r.detentor_peticionante],['CNPJ do peticionante',r.cnpj_detentor_peticionante],['Assunto',r.assunto]
        ];
        lines.forEach(function(x){if(x[1])card.appendChild(E('p','fm-helper-text',x[0]+': '+x[1]));});
        var apply=E('button','fm-secondary-button','Conferir e aplicar');apply.type='button';apply.addEventListener('click',function(){applyIfa(detail,raw,result);d.close();});card.appendChild(apply);box.appendChild(card);
      });
      if(result.fonte)box.appendChild(E('p','fm-helper-text','Fonte: '+result.fonte+(result.gerado_em?' · base gerada em '+new Date(result.gerado_em).toLocaleString('pt-BR'):'')+'.'));
    }
    function run(){var term=q.input.value.trim();if(!term){status.textContent='Informe um termo para consulta.';return;}search.disabled=true;status.textContent='Consultando a base pública de IFA…';box.innerHTML='';ensureIfaTools().then(function(tools){return tools.search(term,{limit:25});}).then(renderResult).catch(function(err){status.textContent='Não foi possível concluir a consulta: '+(err&&err.message?err.message:String(err));}).finally(function(){search.disabled=false;});}
    search.addEventListener('click',run);q.input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();run();}});d.showModal();
  }

  function request(detail){detail=detail||{};var type=detail.lookupType||'';if(type==='cnpj'||type==='afe'||type==='ae')return openCompanyLookup(detail);if(type==='ifa')return openIfaLookup(detail);var d=dialog(),h=E('header');h.appendChild(E('strong','','Consulta'));h.appendChild(closeButton(d));d.appendChild(h);var b=E('div','fm-dialog-body');b.appendChild(E('p','fm-helper-text','Consulta ainda não implementada para este tipo.'));d.appendChild(b);d.showModal();}

  FM.lookupAdapter=Object.freeze({request:request,empresa:function(cnpj){return ensureAnvisaTools().then(function(t){return t.anvisa.empresa(cnpj);});},ifa:function(query,options){return ensureIfaTools().then(function(t){return t.search(query,options||{});});}});
})(window,document);