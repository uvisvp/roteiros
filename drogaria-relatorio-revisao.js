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
