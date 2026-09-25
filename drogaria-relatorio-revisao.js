/* ——— Drogaria: revisão do relatório gerado ———
   Aplicada sobre o resultado final de DrogariaAPI.engine.report:
   - frases com dado ausente (“não informado”, “quantidade não informada”,
     “configuração não informada”) deixam de sair; o dado faltante vai para
     as pendências de emissão;
   - títulos sem conteúdo não saem; seções obrigatórias vazias saem com
     “Não informado.” e geram pendência;
   - a numeração é refeita em sequência (1, 2, 3… e 4.1, 4.2…), sem saltos. */
(function(){
  'use strict';
  var OBRIG=/^(IDENTIFICA|INSPE[ÇC][ÃA]O$|IRREGULARIDADES|MEDIDAS|CONSIDERA[ÇC][ÕO]ES FINAIS)/;
  function semNum(t){return String(t||'').replace(/^\s*\d+(?:\.\d+)*\.?\s+/,'')}
  function limparFrase(t,pend){
    var x=String(t||'');
    if(/^Horário de funcionamento:/.test(x)){
      var partes=x.replace(/^Horário de funcionamento:\s*/,'').replace(/\.$/,'').split(/;\s*/).filter(function(s){return !/não informad/.test(s)});
      if(!partes.length){pend.push('Horário de funcionamento não informado.');return ''}
      return 'Horário de funcionamento: '+partes.join('; ')+'.';
    }
    var m=/^Conta com (.+?) funcionários, entre eles (.+?) farmacêuticos\.?$/.exec(x);
    if(m){var f=/não informad/.test(m[1])?'':m[1],g=/não informad/.test(m[2])?'':m[2];
      if(!f&&!g){pend.push('Número de funcionários e de farmacêuticos não informado.');return ''}
      if(!g){pend.push('Número de farmacêuticos não informado.');return 'Conta com '+f+' funcionário(s).'}
      if(!f){pend.push('Número de funcionários não informado.');return 'Conta com '+g+' farmacêutico(s).'}
      return 'Conta com '+f+' funcionário(s), entre eles '+g+' farmacêutico(s).'}
    if(/não informad/i.test(x)){
      var frases=x.split(/(?<=\.)\s+/),boas=frases.filter(function(s){return !/não informad/i.test(s)});
      frases.filter(function(s){return /não informad/i.test(s)}).forEach(function(s){pend.push('Dado ausente no relatório: “'+s.trim()+'”')});
      return boas.join(' ');
    }
    return x;
  }
  function revisar(r){
    if(!r||!Array.isArray(r.blocks)||r.__revisado)return r;
    var pend=[],bl=[];
    r.blocks.forEach(function(b){
      if(!b)return;
      if(b.t==='p'){var t=limparFrase(b.x,pend);if(!t.trim())return;bl.push(Object.assign({},b,{x:t}));return}
      if(b.t==='kv'&&!String(b.v==null?'':b.v).trim())return;
      bl.push(b);
    });
    /* títulos vazios: primeiro subtítulos, depois títulos */
    function podar(lista,nivel){
      var out=[];
      for(var i=0;i<lista.length;i++){var b=lista[i];
        if(b.t===nivel){var tem=false;for(var j=i+1;j<lista.length;j++){var n=lista[j];if(n.t==='h1'||(nivel==='h2'&&n.t==='h2'))break;if(n.t!=='h1'&&n.t!=='h2'){tem=true;break}}
          if(!tem){if(nivel==='h1'&&OBRIG.test(semNum(b.x))){out.push(b,{t:'p',x:'Não informado.'});pend.push('Seção “'+semNum(b.x)+'” sem conteúdo.')}continue}}
        out.push(b)}
      return out}
    var out=podar(podar(bl,'h2'),'h1');
    /* numeração sequencial */
    var n1=0,n2=0;
    out=out.map(function(b){
      if(b.t==='h1'&&/^\s*\d/.test(b.x)){n1++;n2=0;return Object.assign({},b,{x:n1+' '+semNum(b.x)})}
      if(b.t==='h2'&&/^\s*\d+\.\d/.test(b.x)){n2++;return Object.assign({},b,{x:n1+'.'+n2+' '+semNum(b.x)})}
      if(b.t==='kv'&&/^\s*\d+\.\d+\.?\s/.test(b.k||'')){return Object.assign({},b,{k:String(b.k).replace(/^\s*\d+(\.\d+\.?)/,n1+'$1')})}
      return b;
    });
    r.blocks=out;r.__revisado=true;
    r.pending=(Array.isArray(r.pending)?r.pending:[]).concat(pend.filter(function(x,i,a){return a.indexOf(x)===i}));
    return r;
  }
  function instalar(){
    var api=window.DrogariaAPI;if(!api||!api.engine||!api.engine.report||!api.engine.report.__drogariaFinal)return false;
    if(api.engine.report.__revisao)return true;
    var orig=api.engine.report;
    var novo=function(){return revisar(orig.apply(this,arguments))};
    Object.keys(orig).forEach(function(k){novo[k]=orig[k]});novo.__revisao=true;novo.__drogariaFinal=true;
    api.engine.report=novo;
    if(window.DrogariaEngine&&window.DrogariaEngine.report===orig)window.DrogariaEngine.report=novo;
    try{if(typeof api.render==='function')api.render()}catch(e){}
    return true;
  }
  var tent=0;function vai(){if(instalar())return;if(++tent<400)setTimeout(vai,25)}vai();
  try{document.addEventListener('DOMContentLoaded',function(){instalar()})}catch(e){}
  window.DrogariaRelatorioRevisao={revisar:revisar,instalar:instalar};
})();

/* Para saber mais (Drogaria): caixa de conceitos no topo do item ou da seção aberta. */
(function(){
  'use strict';
  function aplicar(){
    if(!window.SaberMais)return;
    var alvo=document.querySelector('#content .drg-item-screen')||document.querySelector('#content .sd-panel')||document.querySelector('#content .fb-panel');
    if(!alvo||alvo.querySelector(':scope > .sm-box'))return;
    var chip=document.querySelector('#content .lvl-chips [aria-current="step"]'),aba=document.querySelector('button[data-card][aria-current="page"]');
    var chave=[aba&&aba.textContent,chip&&chip.textContent,(alvo.querySelector('h2,h3')||{}).textContent].filter(Boolean).join(' ');
    var h=SaberMais.html('drog',chave);if(h)alvo.insertAdjacentHTML('afterbegin',h);
  }
  var t=0;function agenda(){clearTimeout(t);t=setTimeout(aplicar,60)}
  try{new MutationObserver(agenda).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
  try{document.addEventListener('drogaria:render',agenda)}catch(e){}
})();

/* Respostas: nos requisitos (resposta negativa gera irregularidade), os botões
   passam a Cumpre / Não cumpre / Não se aplica. Perguntas descritivas e de
   escopo (“realiza vacinação?”, “há venda remota?”) continuam Sim / Não.
   Os valores gravados não mudam (sim / nao / nsa). */
(function(){
  'use strict';
  var REQ={
    s1:['lic_match','team_uniform','rt_present','rt_id'],
    area_geral:['acesso'],
    area_recebimento:['area_identificada','conferencia','pop'],
    area_dispensacao:['extintor','higienizacao','monitoramento','termohigrometro','planilha','organizacao','mips','genericos'],
    area_armazenamento:['organizado','piso_parede','luz','monitoramento','inflamaveis'],
    area_vencidos:['segregacao'],area_dml:['armazenamento'],area_refeitorio:['separado'],area_sanitarios:['itens'],
    termolabeis:['pop'],
    documentos_qualidade:['treinamentos','pop_aquisicao','pop_vencimento','criterios','distribuidores','licenca_fornecedor'],
    documentos_rastreabilidade:['registro_receita','correspondencia_sistema'],
    documentos_remota:['licenca','pop','remota_classes_legal','site_portaria344'],
    documentos_descarte:['pgrss','coleta_servicos'],
    servicos_farmaceuticos:['licenca','ambiente','lavatório','primeiros_socorros','materiais','perfuro','orientacao','epi','limpeza','rede_publica','declaracao','injecao','vacinacao'],
    transporte:['licenca_entrega','controle_temperatura','qualificacao']
  };
  var ROT={sim:'Cumpre',nao:'Não cumpre',nsa:'Não se aplica'};
  var catalogo=null;
  function cat(){if(catalogo)return catalogo;try{var c=window.DrogariaAPI&&DrogariaAPI.getCatalog&&DrogariaAPI.getCatalog();if(c&&c.perguntas){catalogo={};c.perguntas.forEach(function(q){catalogo[q.id]=q})}}catch(e){}return catalogo||{}}
  function ehReq(bt){
    var d=bt.dataset,v,p;
    if(d.s1Answer){p=d.s1Answer.split('|');return REQ.s1.indexOf(p[0])>=0}
    v=d.afAnswer||d.sdAnswer||d.fbAnswer;
    if(v){p=v.split('|');return (REQ[p[0]]||[]).indexOf(p[1])>=0}
    if(d.answer!=null&&d.value){var id=String(d.answer).split(/::|@|#/)[0],q=cat()[id]||cat()[d.answer];return !!(q&&q.gera_irregularidade&&!q.informativo&&q.tipo!=='escopo')}
    return false;
  }
  function valor(bt){var d=bt.dataset;if(d.value)return d.value;var v=d.s1Answer||d.afAnswer||d.sdAnswer||d.fbAnswer||'';return v.split('|').pop()}
  function aplicar(){
    document.querySelectorAll('#content [data-s1-answer],#content [data-af-answer],#content [data-sd-answer],#content [data-fb-answer],#content button[data-answer][data-value]').forEach(function(bt){
      if(bt.dataset.drgRot)return;var v=valor(bt);if(!ROT[v])return;
      if(ehReq(bt)){bt.textContent=ROT[v];bt.dataset.drgRot='req'}else bt.dataset.drgRot='desc';
    });
    /* Termo de inutilização: fora do escopo da inspeção */
    document.querySelectorAll('#content [data-sd-answer^="documentos_descarte|termo|"]').forEach(function(bt){var q=bt.closest('.q')||bt.parentElement&&bt.parentElement.parentElement;if(q&&!q.hidden)q.hidden=true});
  }
  var t=0;function agenda(){clearTimeout(t);t=setTimeout(aplicar,40)}
  try{new MutationObserver(agenda).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
})();

/* Prévia por item: “Como sai no relatório”, no fim do item aberto. */
(function(){
  'use strict';
  function sn(t){return String(t||'').replace(/^\s*\d+(?:\.\d+)*\.?\s+/,'').replace(/^\d+\s*·\s*/,'').trim().toLowerCase()}
  function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var ultimo='';
  function aplicar(){
    var tela=document.querySelector('#content .drg-item-screen');if(!tela||!window.DrogariaAPI||!DrogariaAPI.report)return;
    var chip=document.querySelector('#content .lvl-chips [aria-current="step"]');if(!chip)return;
    var alvo=sn(chip.textContent),estado='';try{estado=JSON.stringify(DrogariaAPI.getState())}catch(e){}
    var chave=alvo+'|'+estado.length+'|'+estado.slice(-200);var box=tela.querySelector(':scope > .drg-previa');
    if(box&&box.dataset.chave===chave)return;
    var r;try{r=DrogariaAPI.report()}catch(e){return}
    var bl=r&&r.blocks||[],i=bl.findIndex(function(b){return (b.t==='h2'||b.t==='h1')&&sn(b.x)===alvo}),corpo=[];
    if(i>=0)for(var j=i+1;j<bl.length&&bl[j].t!=='h1'&&bl[j].t!=='h2';j++)corpo.push(bl[j]);
    var irr=(r.irregularities||[]).filter(function(x){return sn(x.grupo)===alvo});
    var html='<details class="drg-previa" data-chave="'+esc(chave)+'"'+(box&&box.open?' open':'')+'><summary>👁 Como sai no relatório</summary>'+
      (corpo.length?corpo.map(function(b){return b.t==='kv'?'<p><b>'+esc(b.k)+':</b> '+esc(b.v)+'</p>':'<p>'+esc(b.x||'')+'</p>'}).join(''):'<p class="muted">Ainda sem texto para este item: responda as perguntas.</p>')+
      (irr.length?'<p><b>Irregularidades deste item:</b></p><ul>'+irr.map(function(x){return '<li>'+esc(x.frase_relatorio)+'</li>'}).join('')+'</ul>':'')+'</details>';
    if(box)box.outerHTML=html;else tela.insertAdjacentHTML('beforeend',html);
  }
  var t=0;function agenda(){clearTimeout(t);t=setTimeout(aplicar,120)}
  try{new MutationObserver(function(m){if(m.every(function(x){return x.target.closest&&x.target.closest('.drg-previa')}))return;agenda()}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']})}catch(e){}
  try{var st=document.createElement('style');st.textContent='.drg-previa{border:1px dashed #9fb3c2;border-radius:10px;background:#fbfcfd;margin:12px 0 4px;padding:0 12px}.drg-previa>summary{cursor:pointer;padding:9px 0;font-weight:700;color:#365B73;font-size:.86rem}.drg-previa p,.drg-previa li{font-size:.84rem;line-height:1.5;margin:0 0 7px}.drg-previa .muted{color:#6b7780;font-style:italic}';(document.head||document.documentElement).appendChild(st)}catch(e){}
})();
