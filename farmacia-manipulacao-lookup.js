/* Farmácia de Manipulação — consultas regulatórias compartilhadas.
 * CNPJ/AFE/AE reutilizam a base pública já consumida pela Drogaria.
 * A classificação da Portaria 344/98 usa a base operacional compartilhada e
 * só preenche a lista em correspondência exata e única da substância.
 * IFA permanece bloqueado até validação do esquema oficial específico.
 */
(function(window, document){
  'use strict';
  var FM=window.FarmaciaManipulacao;
  if(!FM||FM.lookupAdapter)return;

  var DATA_BASES=[
    'https://uvisvp.github.io/base-vigilancia/dados/',
    'https://raw.githubusercontent.com/uvisvp/base-vigilancia/main/dados/'
  ];
  var controlledPromise=null;

  function E(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  function clean(v){return String(v==null?'':v).trim();}
  function unique(values){var out=[];(values||[]).forEach(function(v){v=clean(v);if(v&&!out.some(function(x){return x===v;}))out.push(v);});return out;}
  function digits(v){return clean(v).replace(/\D/g,'');}
  function formatCnpj(v){var d=digits(v);return /^\d{14}$/.test(d)?d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,'$1.$2.$3/$4-$5'):clean(v);}
  function normSubstance(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[()\[\]{},.;:]/g,' ').replace(/[–—_-]+/g,' ').replace(/\s+/g,' ').trim();}

  function dialog(){
    var d=document.getElementById('fm-lookup-dialog');
    if(!d){d=document.createElement('dialog');d.id='fm-lookup-dialog';d.className='fm-dialog';document.body.appendChild(d);}
    d.innerHTML='';
    return d;
  }
  function closeButton(d){var b=E('button','','Fechar ×');b.type='button';b.addEventListener('click',function(){d.close();});return b;}
  function input(label,value,opts){opts=opts||{};var l=E('label','fm-field');l.appendChild(E('span','fm-field-label',label));var i=opts.textarea?document.createElement('textarea'):document.createElement('input');if(opts.textarea)i.rows=opts.rows||3;else i.type=opts.type||'text';i.className='fm-input';i.value=value||'';if(opts.placeholder)i.placeholder=opts.placeholder;l.appendChild(i);l.input=i;return l;}

  function fetchJson(relative){
    var errors=[];
    return DATA_BASES.reduce(function(p,base){
      return p.catch(function(){
        var url=base+relative;
        return fetch(url,{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status+' em '+url);return r.json();}).catch(function(err){errors.push(err.message||String(err));throw err;});
      });
    },Promise.reject(new Error('início'))).catch(function(){throw new Error('Não foi possível carregar '+relative+'. '+errors.join(' | '));});
  }

  function loadControlledBase(){
    if(controlledPromise)return controlledPromise;
    controlledPromise=fetchJson('controlados_portaria344/listas.json').then(function(data){
      var index={},all=[];
      (data.listas||[]).forEach(function(list){
        (list.substancias||[]).forEach(function(s){
          var item={id:s.id||'',nome:clean(s.nome),lista:clean(s.lista||list.lista),numero:clean(s.numero),tipo:clean(s.tipo),titulo:clean(list.titulo)};
          var key=normSubstance(item.nome);if(!key)return;
          (index[key]||(index[key]=[])).push(item);all.push(item);
        });
      });
      return {raw:data,index:index,items:all,source:{schema:data.schema||'',normaBase:data.norma_base||'',normaFonte:data.norma_fonte||'',fonteOficial:data.fonte_oficial||'',geradoEm:data.gerado_em||''}};
    }).catch(function(err){controlledPromise=null;throw err;});
    return controlledPromise;
  }

  function classificarControlado(nome){
    var original=clean(nome),key=normSubstance(original);
    if(!key)return Promise.resolve({query:original,exact:false,matches:[],lista:'',source:null});
    return loadControlledBase().then(function(base){
      var matches=(base.index[key]||[]).slice();
      var exact=matches.length===1;
      return {query:original,exact:exact,matches:matches,lista:exact?matches[0].lista:'',substancia:exact?matches[0]:null,source:base.source};
    });
  }

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

  function openIfaReserved(){
    var d=dialog(),head=E('header');head.appendChild(E('strong','','IFA — Insumo Farmacêutico Ativo'));head.appendChild(closeButton(d));d.appendChild(head);var body=E('div','fm-dialog-body');
    body.appendChild(E('p','fm-helper-text','A pesquisa IFA permanece desativada nesta etapa. A tabela oficial de fabricantes já teve os campos básicos identificados, porém ela não estabelece sozinha a relação substância/IFA → fabricante. O esquema da tabela oficial de IFA ainda precisa ser validado antes de unir substância, fabricante e identificador regulatório. Nenhum dado será inferido a partir do registro do medicamento acabado.'));
    d.appendChild(body);d.showModal();
  }

  function request(detail){detail=detail||{};var type=detail.lookupType||'';if(type==='cnpj'||type==='afe'||type==='ae')return openCompanyLookup(detail);if(type==='ifa')return openIfaReserved();var d=dialog(),h=E('header');h.appendChild(E('strong','','Consulta'));h.appendChild(closeButton(d));d.appendChild(h);var b=E('div','fm-dialog-body');b.appendChild(E('p','fm-helper-text','Consulta ainda não implementada para este tipo.'));d.appendChild(b);d.showModal();}

  FM.lookupAdapter=Object.freeze({
    request:request,
    empresa:function(cnpj){return ensureAnvisaTools().then(function(t){return t.anvisa.empresa(cnpj);});},
    classificarControlado:classificarControlado,
    carregarBaseControlados:loadControlledBase
  });
})(window,document);