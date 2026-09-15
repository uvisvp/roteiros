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


/* Central de Consultas — AFE/AE enriquecida (schema 3).
 * Mantém a arquitetura atual e só assume as pesquisas CNPJ e AFE/AE.
 */
(function(window,document){
  'use strict';
  if(window.__UVIS_AFE_V3_CENTRAL__)return;
  window.__UVIS_AFE_V3_CENTRAL__=true;
  var RAIZ='https://uvisvp.github.io/base-vigilancia/dados/';
  function E(id){return document.getElementById(id);}
  function dig(v){return String(v||'').replace(/\D/g,'');}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(x){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x];});}
  function dataBR(v){var m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:String(v||'');}
  function modo(){var b=document.querySelector('.mode.on');return b&&b.getAttribute('data-mode');}
  function ehAfe(){var m=modo();return m==='cnpj'||m==='afe'||m==='autorizacao';}
  function status(t,ok){var x=E('status');if(x){x.className='status '+(ok?'ok':'');x.textContent=t||'';}}
  async function json(url){var r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}
  async function porCnpj(v){
    var c=dig(v);if(c.length!==14)return [];
    var a=await json(RAIZ+'afe_ae/'+c.slice(0,3)+'.json');
    return (Array.isArray(a)?a:[]).filter(function(r){return dig(r.cnpj)===c;});
  }
  async function porAut(v){
    var a=dig(v);if(!a)return [];
    var idx=await json(RAIZ+'indices/autorizacoes/'+a.slice(0,3)+'.json'),refs=(idx&&idx[a])||[],out=[];
    for(var i=0;i<refs.length;i++){
      var rs=await porCnpj(refs[i].c||refs[i].cnpj||'');
      rs.forEach(function(r){if(dig(r.autorizacao)===a||dig(r.autorizacao_nova)===a)out.push(r);});
    }
    return out;
  }
  function chave(r){return [dig(r.cnpj),dig(r.autorizacao),dig(r.processo)].join('|');}
  async function completarAtividades(regs){
    var ps={};regs.forEach(function(r){var c=dig(r.cnpj);if(c.length===14)ps[c.slice(0,3)]=1;});
    var mapas={};await Promise.all(Object.keys(ps).map(async function(p){try{mapas[p]=await json(RAIZ+'afe_ae_atividades/'+p+'.json');}catch(e){mapas[p]={};}}));
    regs.forEach(function(r){r.__atividade=(mapas[dig(r.cnpj).slice(0,3)]||{})[chave(r)]||'';});
  }
  function linha(k,v){return v?'<b>'+esc(k)+'</b><span>'+esc(v)+'</span>':'';}
  function card(r){
    var tipo=r.tipo||((String(r.autorizacao_especial).toUpperCase()==='S')?'AE':'AFE');
    var sit=r.situacao||((String(r.ativo).toUpperCase()==='SIM')?'ATIVA':(String(r.ativo).toUpperCase()==='NAO'?'INATIVA':''));
    return '<article class="result" data-uvis-afe-v3="1"><h4>'+esc([tipo,sit].filter(Boolean).join(' · ')||'AFE/AE')+'</h4><div class="kv">'+
      linha('Razão social',r.razao_social)+linha('Nome fantasia',r.nome_fantasia)+linha('CNPJ',r.cnpj)+
      linha('Autorização',r.autorizacao)+linha('Autorização nova',r.autorizacao_nova)+linha('Processo',r.processo)+
      linha('Tipo',tipo)+linha('Situação',sit)+linha('Data da autorização',dataBR(r.data_autorizacao))+
      linha('Data da publicação',dataBR(r.data_publicacao))+linha('Data do cancelamento',dataBR(r.data_cancelamento))+
      linha('Classe',r.classe)+linha('Atividade / tipo',r.atividade_tipo)+linha('Atividades',r.__atividade||r.atividade)+
      linha('Município / UF',[r.municipio,r.uf].filter(Boolean).join(' / '))+linha('CEP',r.cep)+
      linha('Endereço',r.endereco)+linha('Bairro',r.bairro)+linha('Responsável técnico',r.responsavel_tecnico)+
      linha('Responsável legal',r.responsavel_legal)+'</div></article>';
  }
  async function executar(){
    if(!ehAfe())return false;var q=E('q'),host=E('results');if(!q||!host||!q.value.trim())return false;
    status('Consultando AFE/AE na base enriquecida…',false);
    try{
      var regs=modo()==='cnpj'?await porCnpj(q.value):await porAut(q.value);
      if(regs.length)await completarAtividades(regs);
      host.className='';host.innerHTML=regs.length?regs.map(card).join(''):'<div class="empty"><b>Nenhuma AFE/AE localizada.</b><br>Resultado vazio significa apenas que não houve correspondência nesta base.</div>';
      status(regs.length?'AFE/AE: '+regs.length+' autorização(ões) localizada(s).':'AFE/AE não localizada.',!!regs.length);
    }catch(e){status('Falha ao consultar AFE/AE: '+e.message,false);}
    return true;
  }
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest&&e.target.closest('#go,#buscar,[data-buscar]');if(!b||!ehAfe())return;
    e.preventDefault();e.stopImmediatePropagation();executar();
  },true);
  document.addEventListener('keydown',function(e){
    if(e.key!=='Enter'||!e.target||e.target.id!=='q'||!ehAfe())return;
    e.preventDefault();e.stopImmediatePropagation();executar();
  },true);
})(window,document);
