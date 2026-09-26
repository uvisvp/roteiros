/* ——— Inspeções salvas no aparelho ———
   Permite guardar a inspeção em andamento de um roteiro e começar outra em
   branco, e retomar depois. Cada salva leva as respostas do roteiro
   (localStorage) e as fotos (IndexedDB roteiro-evidencias-v1), e fica em
   IndexedDB próprio (uvis-inspecoes-salvas-v1). Nada sai do aparelho.
   Roteiros: Medicamentos (drogaria, manipulação, distribuidora), Alimentos
   (inspeção do estabelecimento), Produtos (as três trilhas), Serviços
   assistenciais e Odontologia. Estética e rotulagem ficam de fora.
   - Dentro do roteiro: botão “Salvas” no cabeçalho.
   - Na tela de cada núcleo (lista de roteiros): botão “Inspeções salvas” com as
     salvas daquele núcleo. Não há mais botão na tela inicial.
   Limite: LIMITE salvas por roteiro.
   Inserido no index.html por scripts/repack-inspecoes-salvas.cjs. */
(function(){
 if(window.UvisSalvas)return;
 var LIMITE=5;
 var CFG={
  'drogaria':{nome:'Drogaria',nucleo:'Medicamentos',ls:['drogaria-inspecao-v4','drogaria-inspecao-v3'],fotos:['drogaria-']},
  'farmacia-manipulacao':{nome:'Farmácia com Manipulação',nucleo:'Medicamentos',ls:['uvisvp_manipulacao_v1'],fotos:['manipulacao-']},
  'distribuidoras-transportadoras':{nome:'Distribuidora / transportadora',nucleo:'Medicamentos',ls:['uvis-dist-bpdiat-v2','dist-anexo2-campos-v1','distribuidoras-transportadoras-v2'],fotos:['dist-']},
  'servicos-alimentacao-roteiro':{nome:'Inspeção do estabelecimento',nucleo:'Alimentos',ls:['uvis-alimentos-estab-v1'],fotos:[]},
  'produtos-correlatos':{nome:'Produtos e correlatos',nucleo:'Produtos',ls:['uvis-produtos-v2','uvis-produtos-pop13-v1','uvis-produtos-pop13-capa-v1','uvis-produtos-pop13-report-v1'],fotos:['uvis-produtos'],barra:'header.app-header .p-acoes'},
  'servicos-assistenciais':{nome:'Serviços assistenciais',nucleo:'Serviços assistenciais',ls:['uvis.servicos-assistenciais.v12'],fotos:[],fotosDb:{db:'uvis-assistenciais-fotos-v1',store:'photos',key:'key',indice:'scope'},barra:'.topbar .top-actions'},
  'odontologia':{nome:'Odontologia',nucleo:'Odontologia',ls:['odonto-rdc1002-v1'],fotos:[]}
 };
 function $(id){return document.getElementById(id)}
 function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function espera(ms){return new Promise(function(r){setTimeout(r,ms)})}

 /* ---------- IndexedDB ---------- */
 function abreDB(nome,store,key,indice){return new Promise(function(ok,no){var r=indexedDB.open(nome,1);r.onupgradeneeded=function(){if(!r.result.objectStoreNames.contains(store)){var os=r.result.createObjectStore(store,{keyPath:key});if(indice)os.createIndex(indice,indice)}};r.onsuccess=function(){ok(r.result)};r.onerror=function(){no(r.error)}})}
 function tx(nome,store,key,modo,fn,indice){return abreDB(nome,store,key,indice).then(function(db){return new Promise(function(ok,no){var t=db.transaction(store,modo),s=t.objectStore(store),res;var r=fn(s);if(r)r.onsuccess=function(){res=r.result};t.oncomplete=function(){db.close();ok(res)};t.onerror=t.onabort=function(){db.close();no(t.error||Error('Armazenamento interrompido'))}})})}
 var SAL=['uvis-inspecoes-salvas-v1','salvas','id'],EVI=['roteiro-evidencias-v1','photos','key'];
 function salvas(){return tx(SAL[0],SAL[1],SAL[2],'readonly',function(s){return s.getAll()}).then(function(a){return (a||[]).sort(function(x,y){return y.criado<x.criado?-1:1})})}
 function poeSalva(r){return tx(SAL[0],SAL[1],SAL[2],'readwrite',function(s){return s.put(r)})}
 function tiraSalva(id){return tx(SAL[0],SAL[1],SAL[2],'readwrite',function(s){return s.delete(id)})}
 function pegaSalva(id){return tx(SAL[0],SAL[1],SAL[2],'readonly',function(s){return s.get(id)})}
 function fotosDe(app){var p=CFG[app].fotos;if(!p.length)return Promise.resolve([]);return tx(EVI[0],EVI[1],EVI[2],'readonly',function(s){return s.getAll()}).then(function(a){return (a||[]).filter(function(x){return p.some(function(pre){return String(x.scope||'').indexOf(pre)===0})})})}

 /* fotos em banco próprio do roteiro (serviços assistenciais): o store inteiro é da inspeção */
 function fdb(app){return CFG[app].fotosDb}
 function fotosDbDe(app){var d=fdb(app);if(!d)return Promise.resolve([]);return tx(d.db,d.store,d.key,'readonly',function(s){return s.getAll()},d.indice).then(function(a){return a||[]})}
 function limpaFotosDb(app){var d=fdb(app);if(!d)return Promise.resolve();return tx(d.db,d.store,d.key,'readwrite',function(s){s.clear()},d.indice)}
 function gravaFotosDb(app,lista){var d=fdb(app);if(!d||!lista||!lista.length)return Promise.resolve();return tx(d.db,d.store,d.key,'readwrite',function(s){lista.forEach(function(x){s.put(x)})},d.indice)}

 /* ---------- retrato da inspeção atual ---------- */
 function retrato(app){var c=CFG[app],ls={};c.ls.forEach(function(k){var v=localStorage.getItem(k);if(v!=null)ls[k]=v});return Promise.all([fotosDe(app),fotosDbDe(app)]).then(function(v){return {ls:ls,fotos:v[0],fotosDb:v[1]}})}
 function nomeDe(r){var achado='',cnpj='';var pri=['fantasia','nomeFantasia','nome_fantasia','razao','razaoSocial','razao_social','empresa','estabelecimento','establishment','nomeEstabelecimento','razaoSocialEstabelecimento','company'];
  function busca(o,d){if(!o||typeof o!=='object'||d>4)return;for(var i=0;i<pri.length&&!achado;i++){var v=o[pri[i]];if(typeof v==='string'&&v.trim())achado=v.trim()}if(!cnpj&&typeof o.cnpj==='string'&&o.cnpj.trim())cnpj=o.cnpj.trim();for(var k in o)if(!achado&&o[k]&&typeof o[k]==='object')busca(o[k],d+1)}
  Object.keys(r.ls).forEach(function(k){try{busca(JSON.parse(r.ls[k]),0)}catch(e){}});return achado||(cnpj?'CNPJ '+cnpj:'')}
 /* Há conteúdo de inspeção? Fotos, nome do estabelecimento ou alguma resposta marcada. */
 function temConteudo(r){if(r.fotos.length||(r.fotosDb&&r.fotosDb.length))return true;if(!Object.keys(r.ls).length)return false;if(nomeDe(r))return true;
  return Object.keys(r.ls).some(function(k){return /"(status|resposta|answer|valor)"\s*:\s*"(C|NC|NA|sim|nao|nsa|conforme|[^"]{2,})"/i.test(r.ls[k])||/"(responses|answers|respostas|a)"\s*:\s*\{\s*"/.test(r.ls[k])||/":"(C|NC|NA|yes|no|na)"/.test(r.ls[k])})}
 function limpaAtual(app){var c=CFG[app];c.ls.forEach(function(k){localStorage.removeItem(k)});return fotosDe(app).then(function(f){if(!f.length)return;return tx(EVI[0],EVI[1],EVI[2],'readwrite',function(s){f.forEach(function(x){s.delete(x.key)})})}).then(function(){return limpaFotosDb(app)})}
 function gravaAtual(app,r){Object.keys(r.ls).forEach(function(k){localStorage.setItem(k,r.ls[k])});var p=r.fotos&&r.fotos.length?tx(EVI[0],EVI[1],EVI[2],'readwrite',function(s){r.fotos.forEach(function(x){s.put(x)})}):Promise.resolve();return p.then(function(){return gravaFotosDb(app,r.fotosDb)})}

 /* ---------- quadro do roteiro ---------- */
 function appAberto(){var t=$('tela-app');return t&&t.classList.contains('on')?t.dataset.uvisApp:''}
 function descarrega(){var q=$('quadro');if(!q)return Promise.resolve();try{q.removeAttribute('srcdoc');q.src='about:blank'}catch(e){}return espera(150)}
 /* reabre na mesma trilha em que foi salva (Produtos tem três trilhas no mesmo roteiro) */
 function reabre(app,abrir){var c=CFG[app],a=abrir||{};if(window.__cascaAbrirRoteiro)window.__cascaAbrirRoteiro(c.nucleo,app,a.titulo||c.nome,a.qs||'');else location.reload()}
 function atual(app){var a=window.__cascaAtual;return a&&a.app===app?{titulo:a.titulo,qs:a.qs}:null}
 function dataBR(iso){try{var d=new Date(iso);return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}catch(e){return iso}}
 function novoId(){return 's'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
 function registro(app,r,nome){var ab=atual(app);return {id:novoId(),app:app,nome:nome||nomeDe(r)||'Inspeção sem identificação',criado:new Date().toISOString(),nFotos:r.fotos.length+(r.fotosDb?r.fotosDb.length:0),ls:r.ls,fotos:r.fotos,fotosDb:r.fotosDb||[],abrir:ab,trilha:ab&&ab.titulo||''}}

 /* ---------- ações ---------- */
 function salvarENova(app){
  var voltar=appAberto()===app,ab=atual(app),reabre0=reabre;reabre=function(x){reabre0(x,ab)};
  var devolve=function(v){reabre=reabre0;return v};
  return descarrega().then(function(){return Promise.all([retrato(app),salvas()])}).then(function(v){var r=v[0],todas=v[1].filter(function(x){return x.app===app});
   if(!temConteudo(r)){aviso('Não há dados nesta inspeção para salvar.');if(voltar)reabre(app);return}
   if(todas.length>=LIMITE){aviso('Limite de '+LIMITE+' inspeções salvas neste roteiro. Retome ou exclua uma salva antes.');if(voltar)reabre(app);return}
   var nome=prompt('Nome para identificar esta inspeção salva:',nomeDe(r)||'');if(nome===null){if(voltar)reabre(app);return}
   return poeSalva(registro(app,r,nome.trim())).then(function(){return limpaAtual(app)}).then(function(){fecha();reabre(app);aviso('Inspeção salva no aparelho. O roteiro está em branco para a próxima.')})
  }).catch(function(e){aviso('Não foi possível salvar: '+(e&&e.message||e));if(voltar)reabre(app)}).then(devolve,devolve);
 }
 function retomar(id,modoAtual){
  return pegaSalva(id).then(function(s){if(!s)return;var app=s.app;
   return descarrega().then(function(){return retrato(app)}).then(function(atual){
    if(temConteudo(atual)&&!modoAtual){fecha();escolha(s,atual);return}
    var passo=Promise.resolve();
    if(modoAtual==='guardar'&&temConteudo(atual))passo=poeSalva(registro(app,atual));
    return passo.then(function(){return limpaAtual(app)}).then(function(){return gravaAtual(app,s)}).then(function(){return tiraSalva(id)}).then(function(){fecha();reabre(app,s.abrir);aviso('Inspeção retomada: '+s.nome+'.')});
   })}).catch(function(e){aviso('Não foi possível retomar: '+(e&&e.message||e))});
 }
 function excluir(id,app){if(!confirm('Excluir esta inspeção salva, com respostas e fotos? Não há como desfazer.'))return;tiraSalva(id).then(function(){app?painel(app):painel('',nucleoLista())})}

 /* ---------- interface (na casca) ---------- */
 var css='#uvs-fundo{position:fixed;inset:0;background:#0f2533a6;z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow:auto}#uvs-caixa{background:#fff;border-radius:14px;max-width:620px;width:100%;margin-top:4vh;box-shadow:0 12px 40px #0004;font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#263d4a}#uvs-caixa header{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #dde6ec}#uvs-caixa header h2{flex:1;margin:0;font-size:1.05rem}#uvs-caixa .x{border:0;background:#eef3f6;border-radius:8px;width:36px;height:36px;font-size:1.2rem;cursor:pointer;color:#35505f}#uvs-corpo{padding:14px 16px 18px}#uvs-corpo h3{font-size:.8rem;text-transform:uppercase;letter-spacing:.04em;color:#6a7d88;margin:16px 0 6px}#uvs-corpo p.nota{font-size:.85rem;color:#5b6d78;margin:4px 0 10px}.uvs-item{display:flex;gap:10px;align-items:center;border:1px solid #d6e1e8;border-radius:10px;padding:10px 12px;margin:8px 0}.uvs-item div{flex:1;min-width:0}.uvs-item b{display:block;overflow-wrap:anywhere}.uvs-item small{color:#62747f}.uvs-btn{min-height:40px;padding:8px 14px;border-radius:9px;border:1px solid #aabdc9;background:#fff;color:#294c62;font:600 .88rem/1.2 inherit;cursor:pointer}.uvs-btn.pri{background:#2f5870;border-color:#2f5870;color:#fff}.uvs-btn.del{color:#8a3434;border-color:#d5b3b3}.uvs-acoes{display:flex;gap:8px;flex-wrap:wrap}.uvs-vazio{color:#6a7d88;font-size:.9rem}#uvs-aviso{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#263d4a;color:#fff;padding:10px 16px;border-radius:10px;z-index:10000;font:14px/1.4 system-ui,Arial,sans-serif;max-width:90vw;box-shadow:0 6px 20px #0003}@media(max-width:560px){.uvs-item{flex-direction:column;align-items:stretch}}.uvs-lista{display:flex;align-items:center;gap:10px;width:100%;margin:14px 0 4px;padding:12px 14px;border:1px dashed #9fb2bf;border-radius:12px;background:#fff;color:#294c62;font:600 .95rem/1.3 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;cursor:pointer;text-align:left}.uvs-lista span:first-of-type{flex:1}.uvs-lista .uvs-n{min-width:22px;padding:1px 7px;border-radius:11px;background:#2f5870;color:#fff;font-size:.78rem;line-height:1.5;text-align:center}';
 function estilo(){if($('uvs-estilo'))return;var s=document.createElement('style');s.id='uvs-estilo';s.textContent=css;document.head.appendChild(s)}
 function fecha(){var f=$('uvs-fundo');if(f)f.remove()}
 function modal(titulo,html){estilo();fecha();var f=document.createElement('div');f.id='uvs-fundo';f.innerHTML='<section id="uvs-caixa" role="dialog" aria-modal="true" aria-label="'+esc(titulo)+'"><header><h2>'+esc(titulo)+'</h2><button type="button" class="x" data-uvs-fecha aria-label="Fechar">×</button></header><div id="uvs-corpo">'+html+'</div></section>';
  f.addEventListener('click',function(e){var t=e.target;if(t===f||t.closest('[data-uvs-fecha]')){fecha();return}var b=t.closest('[data-uvs]');if(!b)return;var a=b.dataset.uvs,id=b.dataset.id,app=b.dataset.app;
   if(a==='salvar')salvarENova(app);else if(a==='retomar')retomar(id);else if(a==='excluir')excluir(id,b.dataset.painel||'');else if(a==='guardar'||a==='descartar'){if(a==='descartar'&&!confirm('Descartar a inspeção em andamento? Respostas e fotos dela serão apagadas.'))return;retomar(id,a)}});
  document.body.appendChild(f)}
 var tAviso;function aviso(t){estilo();var a=$('uvs-aviso');if(!a){a=document.createElement('div');a.id='uvs-aviso';a.setAttribute('role','status');document.body.appendChild(a)}a.textContent=t;clearTimeout(tAviso);tAviso=setTimeout(function(){a.remove()},4500)}
 function linha(s,painelApp){var rot=s.trilha&&s.trilha!==(CFG[s.app]||{}).nome?s.trilha:(CFG[s.app]?CFG[s.app].nome:s.app);return '<div class="uvs-item"><div><b>'+esc(s.nome)+'</b><small>'+(painelApp&&!s.trilha?'':esc(rot)+' · ')+'salva em '+esc(dataBR(s.criado))+(s.nFotos?' · '+s.nFotos+' foto'+(s.nFotos>1?'s':''):'')+'</small></div><div class="uvs-acoes"><button type="button" class="uvs-btn pri" data-uvs="retomar" data-id="'+esc(s.id)+'">Retomar</button><button type="button" class="uvs-btn del" data-uvs="excluir" data-id="'+esc(s.id)+'" data-painel="'+esc(painelApp||'')+'">Excluir</button></div></div>'}
 /* app = painel de um roteiro (aberto de dentro dele); nucleo = salvas dos roteiros daquele núcleo (tela do núcleo) */
 function painel(app,nucleo){return salvas().then(function(todas){
  if(app&&CFG[app]){var d=todas.filter(function(x){return x.app===app});
   modal('Inspeções salvas — '+CFG[app].nome,'<p class="nota">Guarda a inspeção em andamento neste aparelho (respostas e fotos) e deixa o roteiro em branco para outra. Até '+LIMITE+' salvas por roteiro; ao finalizar, retome, gere o relatório e depois limpe.</p><div class="uvs-acoes"><button type="button" class="uvs-btn pri" data-uvs="salvar" data-app="'+esc(app)+'"'+(d.length>=LIMITE?' disabled title="Limite atingido"':'')+'>💾 Salvar esta e começar outra</button></div><h3>Salvas neste roteiro ('+d.length+' de '+LIMITE+')</h3>'+(d.length?d.map(function(s){return linha(s,app)}).join(''):'<p class="uvs-vazio">Nenhuma inspeção salva neste roteiro.</p>'));return}
  var html='<p class="nota">Inspeções guardadas neste aparelho para finalizar depois. Ao retomar, a inspeção volta para o roteiro; se houver outra em andamento nele, você escolhe guardá-la ou descartá-la. Para salvar a inspeção em andamento, use o botão Salvas dentro do roteiro.</p>';
  Object.keys(CFG).filter(function(k){return !nucleo||CFG[k].nucleo===nucleo}).forEach(function(k){var d=todas.filter(function(x){return x.app===k});html+='<h3>'+esc(CFG[k].nome)+' ('+d.length+' de '+LIMITE+')</h3>'+(d.length?d.map(function(s){return linha(s,'')}).join(''):'<p class="uvs-vazio">Nenhuma.</p>')});
  modal('Inspeções salvas'+(nucleo?' — '+nucleo:''),html)}).catch(function(e){aviso('Não foi possível ler as salvas: '+(e&&e.message||e))})}
 function escolha(s,atual){var nm=nomeDe(atual)||'sem identificação';
  modal('Retomar “'+s.nome+'”','<p>O roteiro '+esc(CFG[s.app].nome)+' tem uma inspeção em andamento (<b>'+esc(nm)+'</b>). O que fazer com ela?</p><div class="uvs-acoes"><button type="button" class="uvs-btn pri" data-uvs="guardar" data-id="'+esc(s.id)+'">Guardar nas salvas e retomar</button><button type="button" class="uvs-btn del" data-uvs="descartar" data-id="'+esc(s.id)+'">Descartar e retomar</button><button type="button" class="uvs-btn" data-uvs-fecha>Cancelar</button></div>');
  var c=$('uvs-fundo');if(c)c.querySelector('[data-uvs-fecha].uvs-btn').addEventListener('click',function(){reabreSeFechado(s.app)})}
 function reabreSeFechado(app){if(appAberto()===app){var q=$('quadro');if(q&&(!q.getAttribute('src')||q.getAttribute('src')==='about:blank')&&!q.getAttribute('srcdoc'))reabre(app)}}

 /* ---------- botão dentro do roteiro ---------- */
 function injeta(){var q=$('quadro'),app=appAberto();if(!q||!CFG[app])return;var d;try{d=q.contentDocument}catch(e){return}if(!d||!d.body||d.getElementById('uvs-botao'))return;
  var b=d.createElement('button');b.id='uvs-botao';b.type='button';b.title='Salvar esta inspeção no aparelho e começar outra';b.setAttribute('aria-label','Inspeções salvas');
  b.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/></svg><span>Salvas</span>';
  var st=d.createElement('style');st.textContent='#uvs-botao{position:fixed;top:6px;right:10px;z-index:2147483000;display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:6px 12px;border-radius:9px;border:1px solid #ffffff80;background:#ffffff1f;color:#fff;font:600 13px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;cursor:pointer}#uvs-botao:active{background:#ffffff40}#uvs-botao.uvs-fluxo{position:static;min-height:34px;padding:4px 11px;border-radius:999px}#uvs-botao.uvs-claro{position:static;flex:0 0 auto;margin-left:auto;border-color:#aabdc9;background:#fff;color:#294c62}@media(max-width:560px){#uvs-botao{padding:6px 9px}#uvs-botao span{display:none}}@media print{#uvs-botao{display:none!important}}';d.head.appendChild(st);
  b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();painel(app)});
  /* Cabeçalho claro (distribuidora): o botão entra no fluxo da barra, em cor escura. */
  var barra=d.querySelector('header.top .topin'),propria=CFG[app].barra&&d.querySelector(CFG[app].barra);
  if(barra){b.className='uvs-claro';barra.appendChild(b)}else if(propria){b.className='uvs-fluxo';propria.appendChild(b)}else d.body.appendChild(b)}
 function iniciaQuadro(){var q=$('quadro');if(!q||q.dataset.uvsLigado)return;q.dataset.uvsLigado='1';q.addEventListener('load',function(){setTimeout(injeta,300);setTimeout(injeta,1500)})}

 /* ---------- botão na tela do núcleo (lista de roteiros) ---------- */
 function nucleoLista(){var t=$('lista-tit');return t?t.textContent.trim():''}
 function temNucleo(n){return Object.keys(CFG).some(function(k){return CFG[k].nucleo===n})}
 function contaHome(){var b=$('abrir-salvas'),n=nucleoLista();if(!b)return;salvas().then(function(a){var q=a.filter(function(x){return CFG[x.app]&&CFG[x.app].nucleo===n}).length,s=b.querySelector('.uvs-n');if(s){s.textContent=q?String(q):'';s.hidden=!q}}).catch(function(){})}
 function iniciaLista(){var c=$('lista-corpo'),n=nucleoLista();if(!c)return;var velho=$('abrir-salvas');
  if(!temNucleo(n)||!c.querySelector('.rot-card')){if(velho)velho.remove();return}
  if(velho&&velho.parentNode===c&&velho.dataset.uvsNucleo===n)return;if(velho)velho.remove();estilo();
  var b=document.createElement('button');b.type='button';b.id='abrir-salvas';b.dataset.uvsNucleo=n;b.className='uvs-lista';
  b.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/></svg><span>Inspeções salvas deste núcleo</span><span class="uvs-n" hidden></span>';
  b.addEventListener('click',function(e){e.preventDefault();painel('',n)});c.appendChild(b);contaHome()}
 function inicia(){iniciaQuadro();var lc=$('lista-corpo');if(lc)new MutationObserver(function(){setTimeout(iniciaLista,0)}).observe(lc,{childList:true});iniciaLista();
  var velhaHome=$('abrir-salvas');if(velhaHome&&!velhaHome.dataset.uvsNucleo)velhaHome.remove()}
 window.UvisSalvas={painel:painel,salvarENova:salvarENova,retomar:retomar,salvas:salvas,conta:contaHome,CFG:CFG,LIMITE:LIMITE};
 var _fecha=fecha;fecha=function(){_fecha();contaHome()};
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',inicia):inicia();
})();
