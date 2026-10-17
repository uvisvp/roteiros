/* Central de Consultas — modo “Automático” (build/montar.cjs coloca no fim do
   módulo). Uma caixa só: o tipo é reconhecido pelo formato do que foi digitado
   e a consulta vai para o modo certo; os botões de cada modo continuam para
   escolher à mão (tocar num deles desliga o automático até tocar em Automático).
   - Números: reconhecidos ao pesquisar (o módulo apaga a caixa quando o modo
     muda; o texto é devolvido e a pesquisa segue). CNPJ e EAN/GTIN pelo dígito
     verificador; 7 dígitos = AFE/AE; 9 a 13 = registro; 15 a 17 = processo;
     25351.xxxxxx/aaaa-dd = processo. Ambíguo: pesquisa o mais provável e mostra
     os outros como opção.
   - O aviso próprio da Central (“Esse dado tem formato de…”, #detect) fica
     oculto enquanto o Automático está ligado, por ser a mesma informação.
   - Letras: passa na hora para Medicamento (sugestões a partir de 3 letras); o
     botão “IFA por nome” fica ao lado para trocar. Com letras e números
     misturados (lote, modelo), mantém o modo manual. */
(function(){
 'use strict';
 if(window.__centralAuto)return;window.__centralAuto=true;
 var NOMES={registro:'Registro',processo:'Processo',cnpj:'CNPJ',ean:'EAN / GTIN',afe:'AFE / AE','uvis-nome-medicamento':'Medicamento','uvis-nome-ifa':'IFA por nome',lote:'Lote / modelo'};
 function $(s){return document.querySelector(s)}
 function dig(t){return String(t||'').replace(/\D/g,'')}
 function cnpjOk(d){if(d.length!==14||/^(\d)\1+$/.test(d))return false;var calc=function(n){var s=0,p=n-7;for(var i=0;i<n;i++){s+=+d[i]*p--;if(p<2)p=9}var r=s%11;return r<2?0:11-r};return calc(12)===+d[12]&&calc(13)===+d[13]}
 function gtinOk(d){if([8,12,13,14].indexOf(d.length)<0)return false;var s=0;for(var i=0;i<d.length-1;i++){var peso=((d.length-1-i)%2)?3:1;s+=+d[i]*peso}return (10-s%10)%10===+d[d.length-1]}
 /* [modo provável, alternativas] ou null */
 function reconhece(t){t=String(t||'').trim();if(!t)return null;
  if(/[A-Za-zÀ-ú]/.test(t))return /\d/.test(t)?null:['uvis-nome-medicamento',['uvis-nome-ifa']];
  var d=dig(t);
  if(/^\d{5}\.\d{6}\/\d{4}-\d{2}$/.test(t))return ['processo',[]];
  if(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/.test(t)||d.length===14&&cnpjOk(d))return ['cnpj',gtinOk(d)?['ean']:[]];
  if(d.length===14)return gtinOk(d)?['ean',['processo']]:['processo',[]];
  if(d.length>=15&&d.length<=17)return ['processo',[]];
  if(d.length===13)return gtinOk(d)&&/^7[89]/.test(d)?['ean',['registro','processo']]:['registro',['processo','ean']];
  if(d.length===8||d.length===12)return gtinOk(d)?['ean',['registro']]:(d.length===12?['registro',[]]:null);
  if(d.length>=9&&d.length<=11)return ['registro',[]];
  if(d.length===7)return ['afe',[]];
  return null}
 var auto=true,btn,dica,trocando=false;
 function modoAtual(){var b=$('[data-mode].on');return b?b.dataset.mode:''}
 function vaiPara(modo,texto,pesquisa){var b=$('[data-mode="'+modo+'"]');if(!b)return;trocando=true;
  if(modoAtual()!==modo)b.click();var q=$('#q');q.value=texto;q.dispatchEvent(new Event('input',{bubbles:true}));trocando=false;
  pinta(modo);if(!pesquisa)return;
  /* a Central conclui a troca de modo depois do clique (e pode limpar a caixa): pesquisa só com o modo trocado e o texto no lugar */
  var n=0;setTimeout(function tenta(){var cx=$('#q');if(modoAtual()===modo&&cx.value.trim()){trocando=true;$('#search').click();trocando=false;return}
   if(modoAtual()===modo&&!cx.value.trim()){trocando=true;cx.value=texto;cx.dispatchEvent(new Event('input',{bubbles:true}));trocando=false}
   if(++n<40)setTimeout(tenta,50)},150)}
 function pinta(modo){if(!btn)return;btn.classList.toggle('auto-ativo',auto);document.documentElement.classList.toggle('central-auto-on',auto);
  /* aparência de botão ativo copiada do modo ativo da Central (não usa a classe “on”: a Central e a ponte de processos leem “.mode.on” como o modo da consulta) */
  var ref=$('[data-mode].on');if(auto&&ref){var cs=getComputedStyle(ref);btn.style.background=cs.backgroundColor;btn.style.color=cs.color;btn.style.borderColor=cs.borderColor}else{btn.style.background='';btn.style.color='';btn.style.borderColor=''}btn.setAttribute('aria-pressed',auto?'true':'false');
  var q=$('#q');if(auto&&q)q.setAttribute('inputmode','text');
  if(!dica)return;if(!auto){dica.innerHTML='';return}
  var r=reconhece(q&&q.value);
  if(!r){dica.innerHTML=q&&q.value.trim()?'Formato não reconhecido: escolha o tipo de consulta acima.':'Automático: digite CNPJ, registro, processo, EAN, AFE ou o nome do medicamento/IFA.';return}
  dica.innerHTML='Reconhecido: <b>'+NOMES[modo||r[0]]+'</b>'+(r[1].length?' · pesquisar como: '+r[1].map(function(m){return '<button type="button" class="central-auto-alt" data-auto-alt="'+m+'">'+NOMES[m]+'</button>'}).join(' '):'')}
 function antesDePesquisar(e){if(!auto||trocando)return;var q=$('#q'),r=reconhece(q.value);if(!r||r[0].indexOf('uvis-nome')===0)return;
  if(modoAtual()===r[0])return pinta(r[0]);e.preventDefault();e.stopImmediatePropagation();vaiPara(r[0],q.value,true)}
 function inicia(){var primeiro=$('[data-mode]'),q=$('#q');if(!primeiro||!q){if((inicia.n=(inicia.n||0)+1)<40)setTimeout(inicia,250);return}
  btn=document.createElement('button');btn.type='button';btn.className='mode';btn.dataset.autoModo='1';btn.textContent='Automático';primeiro.parentNode.insertBefore(btn,primeiro);
  dica=document.createElement('p');dica.className='central-auto-dica';dica.setAttribute('aria-live','polite');var bloco=q.closest('.query')||q.parentNode;bloco.parentNode.insertBefore(dica,bloco.nextSibling);
  var st=document.createElement('style');st.textContent='.central-auto-on #detect{display:none!important}.central-auto-dica{margin:6px 0 0;font-size:.86rem;color:#4a5a66}.central-auto-alt{padding:4px 10px;margin:2px;font-size:.8rem;border:1px solid #9fb3c2;border-radius:14px;background:#fff;color:#26394a;cursor:pointer}';document.head.appendChild(st);
  btn.addEventListener('click',function(){auto=true;var t=q.value;var r=reconhece(t);if(r&&r[0].indexOf('uvis-nome')===0)vaiPara(r[0],t,false);pinta();q.focus()});
  window.addEventListener('click',function(e){if(!e.target.closest)return;var alt=e.target.closest('[data-auto-alt]');if(alt){e.preventDefault();e.stopImmediatePropagation();vaiPara(alt.dataset.autoAlt,$('#q').value,true);return}
   var m=e.target.closest('[data-mode]');if(m&&!trocando){auto=false;pinta()}},true);
  window.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#search'))antesDePesquisar(e)},true);
  window.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target===q)antesDePesquisar(e)},true);
  /* nos modos numéricos o módulo apaga letras ao digitar: a letra é vista antes disso */
  q.addEventListener('beforeinput',function(e){if(!auto||trocando||!e.data||!/[A-Za-zÀ-ú]/.test(e.data))return;var m=modoAtual();if(m.indexOf('uvis-nome')===0||['lote','ifa','sivisa'].indexOf(m)>=0)return;
   var a=q.selectionStart==null?q.value.length:q.selectionStart,b=q.selectionEnd==null?a:q.selectionEnd,nv=q.value.slice(0,a)+e.data+q.value.slice(b),r=reconhece(nv);
   if(r&&r[0]==='uvis-nome-medicamento'){e.preventDefault();vaiPara(r[0],nv,false)}},true);
  document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#clearSearch'))setTimeout(function(){pinta()},50)});
  q.addEventListener('input',function(){if(!auto||trocando)return;var r=reconhece(q.value);
   /* letras: vai já para o modo de nome, para as sugestões aparecerem enquanto digita */
   if(r&&r[0]==='uvis-nome-medicamento'&&modoAtual().indexOf('uvis-nome')!==0)return vaiPara(r[0],q.value,false);
   pinta(modoAtual().indexOf('uvis-nome')===0?modoAtual():null)});
  pinta()}
 window.CentralAuto={reconhece:reconhece};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inicia);else inicia();
})();
