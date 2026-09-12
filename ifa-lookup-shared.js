/* Consulta compartilhada — IFA / Insumo Farmacêutico Ativo.
 * Consumida pela Central de Consultas e por Farmácia de Manipulação (9.5).
 * Fonte: visão pública gerada em uvisvp/base-vigilancia a partir de TA_EXPORT_IFA.csv (Anvisa).
 */
(function(window){
  'use strict';
  if(window.UvisIfaLookup)return;

  var URLS=[
    'https://uvisvp.github.io/base-vigilancia/dados/ifa/registros.json',
    'https://raw.githubusercontent.com/uvisvp/base-vigilancia/main/dados/ifa/registros.json'
  ];
  var cachePromise=null;

  function clean(v){return String(v==null?'':v).replace(/\s+/g,' ').trim();}
  function norm(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function digits(v){return clean(v).replace(/\D/g,'');}
  function uniq(a){var seen={},out=[];(a||[]).forEach(function(x){var k=JSON.stringify(x);if(!seen[k]){seen[k]=1;out.push(x);}});return out;}

  async function fetchJson(url){
    var r=await fetch(url,{cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status+' em '+url);
    return r.json();
  }
  async function load(){
    if(cachePromise)return cachePromise;
    cachePromise=(async function(){
      var last=null;
      for(var i=0;i<URLS.length;i++){
        try{
          var payload=await fetchJson(URLS[i]);
          if(!payload||!Array.isArray(payload.registros))throw new Error('Formato inesperado da base IFA.');
          return {
            registros:payload.registros,
            fonte:payload.fonte||'Anvisa — TA_EXPORT_IFA.csv',
            observacao:payload.observacao||'',
            gerado_em:payload.gerado_em||'',
            url:URLS[i]
          };
        }catch(e){last=e;}
      }
      cachePromise=null;
      throw last||new Error('Base IFA indisponível.');
    })();
    return cachePromise;
  }

  function score(r,q,qDigits){
    var fields=[r.ifa,r.fabricante_ifa,r.codigo_fabricante_ifa,r.processo_anvisa,r.detentor_peticionante,r.cnpj_detentor_peticionante,r.assunto];
    var nq=norm(q),best=0;
    fields.forEach(function(v){
      var nv=norm(v);if(!nv)return;
      if(nv===nq)best=Math.max(best,100);
      else if(nv.indexOf(nq)===0)best=Math.max(best,80);
      else if(nv.indexOf(nq)>=0)best=Math.max(best,60);
      var dv=digits(v);if(qDigits&&dv){if(dv===qDigits)best=Math.max(best,100);else if(dv.indexOf(qDigits)>=0)best=Math.max(best,70);}
    });
    return best;
  }
  async function search(query,options){
    options=options||{};
    var q=clean(query),nq=norm(q),qd=digits(q);
    if(!q||(!nq&&!qd))return {query:q,resultados:[],total:0};
    var data=await load(),limit=Math.max(1,Math.min(Number(options.limit)||25,100));
    var hits=[];
    data.registros.forEach(function(r){var s=score(r,q,qd);if(s>0)hits.push({score:s,item:r});});
    hits.sort(function(a,b){if(b.score!==a.score)return b.score-a.score;return norm(a.item.ifa).localeCompare(norm(b.item.ifa),'pt-BR');});
    var all=uniq(hits.map(function(h){return h.item;}));
    return {
      query:q,
      resultados:all.slice(0,limit),
      total:all.length,
      fonte:data.fonte,
      observacao:data.observacao,
      gerado_em:data.gerado_em,
      url:data.url
    };
  }
  function formatResult(r){
    r=r||{};
    return {
      ifa:clean(r.ifa),
      fabricante_ifa:clean(r.fabricante_ifa),
      codigo_fabricante_ifa:clean(r.codigo_fabricante_ifa),
      pais_fabricante:clean(r.pais_fabricante),
      endereco_fabricante:clean(r.endereco_fabricante),
      processo_anvisa:clean(r.processo_anvisa),
      identificador_tipo:clean(r.identificador_tipo)||'processo_anvisa',
      identificador:clean(r.identificador)||clean(r.processo_anvisa),
      detentor_peticionante:clean(r.detentor_peticionante),
      cnpj_detentor_peticionante:clean(r.cnpj_detentor_peticionante),
      assunto_codigo:clean(r.assunto_codigo),
      assunto:clean(r.assunto)
    };
  }

  window.UvisIfaLookup=Object.freeze({
    version:'1.0.0',
    load:load,
    search:search,
    formatResult:formatResult,
    normalize:norm,
    dataUrls:URLS.slice()
  });
})(window);
