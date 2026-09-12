#!/usr/bin/env python3
from pathlib import Path
import re

p=Path('farmacia-manipulacao-lookup.js')
s=p.read_text(encoding='utf-8')
s=s.replace(' * IFA permanece bloqueado até validação do esquema oficial específico.',' * IFA usa o motor compartilhado da Central de Consultas, alimentado pela base pública validada.')

novo=r'''  function ensureIfaTools(){
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
'''
pat=r"  function openIfaReserved\(\)\{.*?\n  \}\n\n  function request\(detail\)\{"
m=re.search(pat,s,flags=re.S)
if not m:
    raise SystemExit('Bloco openIfaReserved não localizado')
s=s[:m.start()]+novo+"\n  function request(detail){"+s[m.end():]
s=s.replace("if(type==='ifa')return openIfaReserved();","if(type==='ifa')return openIfaLookup(detail);")
old="FM.lookupAdapter=Object.freeze({request:request,empresa:function(cnpj){return ensureAnvisaTools().then(function(t){return t.anvisa.empresa(cnpj);});}});"
new="FM.lookupAdapter=Object.freeze({request:request,empresa:function(cnpj){return ensureAnvisaTools().then(function(t){return t.anvisa.empresa(cnpj);});},ifa:function(query,options){return ensureIfaTools().then(function(t){return t.search(query,options||{});});}});"
if old not in s:
    raise SystemExit('Adapter final não localizado')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')

p9=Path('farmacia-manipulacao-section9.js')
s9=p9.read_text(encoding='utf-8')
anchor="  if(!window.__FM_SECTION9_OCR_MAP__){window.__FM_SECTION9_OCR_MAP__=true;window.addEventListener('farmacia-manipulacao:ocr-applied',onOcrApplied);}\n"
if anchor not in s9:
    raise SystemExit('Âncora OCR da seção 9 não localizada')
extra=anchor+"  if(!window.__FM_SECTION9_LOOKUP_MAP__){window.__FM_SECTION9_LOOKUP_MAP__=true;window.addEventListener('farmacia-manipulacao:lookup-applied',function(event){var d=event&&event.detail||{};if(d.lookupType==='ifa'&&String(d.destination||'').indexOf(BASE+'.estoqueControlados')===0)refreshVisible();});}\n"
s9=s9.replace(anchor,extra,1)
s9=s9.replace("'Identificador regulatório do IFA','Tipo ID'","'Processo Anvisa (IFA)','Tipo do identificador'",1)
p9.write_text(s9,encoding='utf-8')
