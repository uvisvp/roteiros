/* Cópia automática da inspeção em andamento (página principal; build/montar.cjs coloca
   no fim do index.html).
   - Com um roteiro aberto, a cada 2 minutos (e ao sair do app ou trocar de tela),
     guarda uma cópia dos dados digitados (as mesmas chaves que as Salvas usam).
     Só grava se algo mudou; cópias com menos de 10 minutos entre si são
     substituídas pela mais nova, e ficam as 8 últimas por roteiro.
   - Antes de Apagar tudo, Nova inspeção, Salvar e nova e Retomar, grava uma cópia
     à parte, para desfazer um toque errado.
   - Restaurar (painel Campo › Resumo): a inspeção atual vira uma cópia, o roteiro
     é fechado, os dados da cópia são gravados e o roteiro reabre.
   - Fotos não entram na cópia (pesariam no aparelho); continuam no banco de fotos
     do roteiro até Nova inspeção ou Apagar tudo.
   - Pede ao navegador armazenamento persistente, para que ele não apague os dados
     do app quando o aparelho estiver com pouco espaço.
   Não protege contra limpar os dados do navegador ou perder o aparelho: para isso,
   Exportar nas Salvas. */
(function(){
 'use strict';
 if(window.MedCopias)return;
 var DB='med-copias-v1',ST='copias',MAX=8,JUNTA=10*60*1000,ultimo={};
 try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persisted().then(function(p){if(!p)navigator.storage.persist()}).catch(function(){})}catch(e){}

 function abre(){return new Promise(function(ok,no){var r=indexedDB.open(DB,1);r.onupgradeneeded=function(){var os=r.result.createObjectStore(ST,{keyPath:'id'});os.createIndex('app','app')};r.onsuccess=function(){ok(r.result)};r.onerror=function(){no(r.error)}})}
 function tx(modo,fn){return abre().then(function(db){return new Promise(function(ok,no){var t=db.transaction(ST,modo),s=t.objectStore(ST),res;var q=fn(s);if(q)q.onsuccess=function(){res=q.result};t.oncomplete=function(){db.close();ok(res)};t.onerror=t.onabort=function(){db.close();no(t.error)}})})}
 function lista(app){return tx('readonly',function(s){return s.index('app').getAll(app)}).then(function(a){return (a||[]).sort(function(x,y){return y.criado-x.criado})})}

 function cfg(app){var S=window.UvisSalvas;return S&&S.CFG&&S.CFG[app]}
 function appAberto(){var t=document.getElementById('tela-app'),a=window.__cascaAtual;return t&&t.classList.contains('on')&&a&&cfg(a.app)?a.app:''}
 function retrato(app){var c=cfg(app),ls={};c.ls.forEach(function(k){var v=localStorage.getItem(k);if(v!=null)ls[k]=v});return ls}
 function vazio(app,ls){if(!Object.keys(ls).length)return true;try{var b=localStorage.getItem('uvis-branco-'+app);if(b!=null&&b===JSON.stringify(ls))return true}catch(e){}
  return !Object.keys(ls).some(function(k){return /"[^"]{1,40}"\s*:\s*"[^"]{2,}"/.test(ls[k])})}
 function nome(ls){var pri=/"(fantasia|nomeFantasia|nome_fantasia|razao|razaoSocial|razao_social|empresa|estabelecimento|company)"\s*:\s*"([^"]{2,80})"/;for(var k in ls){var m=pri.exec(ls[k]);if(m)return m[2]}return ''}

 /* grava uma cópia; forca = entrada nova, sem juntar com a anterior */
 function copia(app,motivo,forca){app=app||appAberto();if(!app||!cfg(app))return Promise.resolve(null);
  var ls=retrato(app),sig=JSON.stringify(ls);if(vazio(app,ls))return Promise.resolve(null);
  return lista(app).then(function(a){var ant=a[0],agora=Date.now();
   if(ant&&ant.sig===sig)return null;
   var r={id:'c'+agora.toString(36)+Math.random().toString(36).slice(2,6),app:app,criado:agora,motivo:motivo||'automática',nome:nome(ls),ls:ls,sig:sig,bytes:sig.length};
   var junta=!forca&&ant&&ant.motivo==='automática'&&agora-ant.criado<JUNTA;
   return tx('readwrite',function(s){if(junta)s.delete(ant.id);s.put(r);
    var resto=a.filter(function(x){return !(junta&&x.id===ant.id)});resto.slice(MAX-1).forEach(function(x){s.delete(x.id)})}).then(function(){ultimo[app]=agora;return r})}).catch(function(){return null})}

 function restaura(id){return tx('readonly',function(s){return s.get(id)}).then(function(c){if(!c)throw Error('Cópia não encontrada.');var app=c.app,cf=cfg(app),at=window.__cascaAtual||{};
   return copia(app,'antes de restaurar',true).then(function(){var q=document.getElementById('quadro');try{q.removeAttribute('srcdoc');q.src='about:blank'}catch(e){}
    return new Promise(function(ok){setTimeout(ok,250)})}).then(function(){
    cf.ls.forEach(function(k){if(k in c.ls)localStorage.setItem(k,c.ls[k]);else localStorage.removeItem(k)});
    if(window.__cascaAbrirRoteiro)window.__cascaAbrirRoteiro(cf.nucleo,app,at.app===app&&at.titulo||cf.nome,at.app===app&&at.qs||'');else location.reload();
    return c})})}

 setInterval(function(){var a=appAberto();if(a&&document.visibilityState==='visible')copia(a)},120000);
 document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')copia()});
 window.addEventListener('pagehide',function(){copia()});
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button,a');if(!b)return;
  if(/Apagar tudo|Nova inspeção|Salvar e (nova|come)|Retomar/i.test(b.textContent||'')){var a=appAberto()||(window.__cascaAtual||{}).app;if(a)copia(a,'antes de: '+String(b.textContent).trim().slice(0,30),true)}},true);

 /* chamadas vindas de dentro do roteiro (botões do próprio app) passam pelas funções das Salvas */
 var n=0;(function embrulha(){var S=window.UvisSalvas;if(!S){if(++n<80)setTimeout(embrulha,150);return}
  ['apagarTudo','novaInspecao','salvarENova','retomar'].forEach(function(f){var o=S[f];if(typeof o!=='function'||o.__medCopia)return;S[f]=function(){var a=arguments,app=appAberto()||(window.__cascaAtual||{}).app,self=this;return Promise.resolve(app?copia(app,'antes de: '+f,true):null).catch(function(){}).then(function(){return o.apply(self,a)})};S[f].__medCopia=true})})();

 window.MedCopias={copia:copia,lista:lista,restaura:restaura};
})();
