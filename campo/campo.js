/* Ferramentas de campo — entram no fim de cada roteiro do site Medicamentos
   (build/montar.cjs). Botão “Campo” com cinco abas:
   - Resumo: estabelecimento, início, respostas (C/NC/NA), pendências, achados,
     fotos; controle de completude, não é pontuação sanitária.
   - Pendências: perguntas marcadas “Pendente de verificação” (botão em cada
     pergunta; some ao responder) e lembretes livres, que não vão ao relatório.
   - Achados: o que foi visto antes de chegar à pergunta (local, texto, foto),
     vinculado depois ao item; o texto pode ir para o campo em edição.
   - Redação: construtor de constatação (fatos → uma frase, sem IA) e
     biblioteca de frases.
   - Verificações: equipamento/produto, padrão, esperado, encontrado,
     conclusão → texto corrido para o relatório.
   Fotos: o botão “Fotos” do cabeçalho abre a revisão antes do PDF — legenda
   automática (ponto do roteiro + data e hora do registro), complemento curto e
   tipo (evidência, documental, só consulta); só consulta fica fora do PDF.
   Ao baixar o relatório (Word, PDF, prévia .docx) com pendências em aberto,
   mostra a lista e pede confirmação.
   Dados: localStorage med-campo-<roteiro> (vai nas Salvas: a casca inclui a
   chave na lista de cada roteiro); fotos dos achados no mesmo banco das
   evidências (roteiro-evidencias-v1), com o prefixo de fotos do roteiro.
   Biblioteca de frases: localStorage da casca (med-frases-v1), comum a todos. */
(function(){
 'use strict';
 if(window.__medCampo)return;window.__medCampo=true;
 var APP=document.documentElement.dataset.uvisApp||'',APPS=window.__uvisAppSalvas||APP;
 var CH='med-campo-'+APPS,CH_SALVAS=CH;
 var PAI=(function(){try{return window.parent&&window.parent!==window&&window.parent.localStorage?window.parent:null}catch(e){return null}})();
 function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function limpa(t){return String(t==null?'':t).replace(/\s+/g,' ').trim()}
 function agora(){return new Date().toISOString()}
 function dataHora(iso){if(!iso)return '—';try{var d=new Date(iso);return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}catch(e){return iso}}
 function novoId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}

 /* ---------------- estado ---------------- */
 var C;
 function carrega(){try{C=JSON.parse(localStorage.getItem(CH)||'{}')||{}}catch(e){C={}}
  C.pend=C.pend||{};C.lemb=C.lemb||[];C.achados=C.achados||[];C.verif=C.verif||[];C.fotos=C.fotos||{};C.cons=C.cons||{local:'',itens:'',verbo:'verificou-se'}}
 function grava(){C.alterado=agora();try{localStorage.setItem(CH,JSON.stringify(C))}catch(e){aviso('Não foi possível gravar no aparelho (espaço cheio?).')}}
 function temConteudo(){return Object.keys(C.pend).length||C.lemb.length||C.achados.length||C.verif.length}
 /* inspeção apagada por Salvas / Nova inspeção: a chave some e o estado recomeça */
 function confereReinicio(){if(localStorage.getItem(CH)===null&&C&&(C.inicio||temConteudo())){carrega();C={pend:{},lemb:[],achados:[],verif:[],fotos:{},cons:{local:'',itens:'',verbo:'verificou-se'}};pintaFab()}}

 /* ---------------- adaptadores dos motores ---------------- */
 function motor(){
  if(window.ROTEIRO&&window.UvisPadrao)return 'rs';
  if(window.DrogariaAPI)return 'drogaria';
  try{if(typeof renderPreview==='function'&&typeof APP_DATA!=='undefined')return 'manip'}catch(e){}
  try{if(typeof reportText==='function'&&typeof state!=='undefined'&&state.answers)return 'dist'}catch(e){}
  return '';
 }
 function stRs(){try{return JSON.parse(localStorage.getItem(ROTEIRO.store)||'{}')||{}}catch(e){return {}}}
 function perguntasRs(){var out=[];ROTEIRO.secoes.forEach(function(s){s.itens.forEach(function(i){(i.perguntas||[]).forEach(function(q){out.push({q:q,item:i})})})});return out}
 /* {c, nc, na, resp} — resp = total respondido */
 function contagem(){var m=motor(),c=0,nc=0,na=0,resp=0;
  var soma=function(v){v=String(v&&typeof v==='object'?(v.status||v.value||v.v||''):v||'').toLowerCase();if(!v)return;resp++;if(v==='c'||v==='sim')c++;else if(v==='nc'||v==='nao')nc++;else if(v==='na'||v==='nsa')na++};
  try{
   if(m==='rs'){var r=stRs().r||{};Object.keys(r).forEach(function(k){soma(r[k])})}
   else if(m==='manip'){var rr=state.responses||{};Object.keys(rr).forEach(function(k){soma(rr[k])})}
   else if(m==='dist'){var a=state.answers||{};Object.keys(a).forEach(function(k){if(a[k]&&a[k].status)soma(a[k].status)})}
   else if(m==='drogaria'){var vis=function(o,d){if(!o||typeof o!=='object'||d>6)return;Object.keys(o).forEach(function(k){if(k==='answers'&&o[k]&&typeof o[k]==='object')Object.keys(o[k]).forEach(function(q){soma(o[k][q])});else vis(o[k],d+1)})};vis(DrogariaAPI.getState(),0);
    /* na drogaria há perguntas descritivas (Sim/Não); a contagem de NC vem das irregularidades do relatório */
    nc=irregularidades().length;c=Math.max(0,resp-nc-na)}
  }catch(e){}
  return {c:c,nc:nc,na:na,resp:resp,m:m};
 }
 /* textos das irregularidades, na ordem do relatório */
 function irregularidades(){var m=motor(),out=[];
  try{
   if(m==='rs'){var r=stRs().r||{};perguntasRs().forEach(function(x){if(r[x.q.id]==='nc')out.push(x.q.nc)})}
   else if(m==='drogaria'){(DrogariaAPI.report().irregularities||[]).forEach(function(x){if(x.frase_relatorio)out.push(limpa(x.frase_relatorio))})}
   else if(m==='dist'){String(reportText()).split(/\n+/).forEach(function(l){var k=l.match(/^\s*Não conformidade nº\s*\d+\s*:\s*(.+)$/i);if(k)out.push(limpa(k[1]))})}
   else if(m==='manip'){var raiz=document.getElementById('reportPreview'),tmp=null;
    if(!raiz){tmp=document.createElement('div');tmp.id='reportPreview';tmp.hidden=true;document.body.appendChild(tmp);raiz=tmp}
    try{renderPreview();[].forEach.call(raiz.querySelectorAll('h3'),function(h){if(/Irregularidades observadas/i.test(h.textContent)){var ol=h.nextElementSibling;if(ol&&ol.tagName==='OL')[].forEach.call(ol.children,function(li){out.push(limpa(li.textContent))})}})}finally{if(tmp)tmp.remove()}}
  }catch(e){}
  return out;
 }
 function nomeEstab(){var m=motor();
  try{
   if(m==='rs'){var mt=stRs().meta||{};return mt.fantasia||mt.razao||''}
   if(m==='manip'){var i=state.identity||{};return i.fantasia||i.razao||''}
  }catch(e){}
  var alvo=null;try{alvo=m==='drogaria'?DrogariaAPI.getState():(typeof state!=='undefined'?state:null)}catch(e){}
  var pri=['fantasia','nomeFantasia','nome_fantasia','razao','razaoSocial','razao_social','empresa','estabelecimento','establishment','company'],ach='';
  (function vis(o,d){if(ach||!o||typeof o!=='object'||d>5)return;for(var k=0;k<pri.length&&!ach;k++){var v=o[pri[k]];if(typeof v==='string'&&v.trim())ach=v.trim()}Object.keys(o).forEach(function(x){vis(o[x],d+1)})})(alvo,0);
  return ach;
 }
 /* item aberto na tela: {titulo} ou null */
 function itemAtual(){
  try{if(window.UvsPrevia){var l=UvsPrevia.itens();if(l&&l[0]&&l[0].titulo)return {titulo:limpa(l[0].titulo)}}}catch(e){}
  try{if(motor()==='rs'){var n=UvisPadrao.estado();if(n.item){var s=ROTEIRO.secoes.filter(function(x){return x.id===n.secao})[0],it=s&&s.itens.filter(function(x){return x.id===n.item})[0];if(it)return {titulo:it.titulo}}}}catch(e){}
  var chip=document.querySelector('[data-man-item][aria-current="step"],[data-man-item].on,[data-man-item].active,[data-man-item][aria-pressed="true"]');
  if(chip&&chip.offsetParent)return {titulo:limpa(chip.textContent).replace(/\s*\d+\/\d+ respondidas?.*$/i,'').replace(/Abrir item.*$/i,'')};
  var h=document.querySelector('.pu-cab-item,.drg-item-screen h2,.dist-section-screen h2');if(h&&h.offsetParent)return {titulo:limpa(h.textContent)};
  return null;
 }

 /* ---------------- fotos ---------------- */
 var EVI='roteiro-evidencias-v1';
 function cfgSalvas(){try{return PAI&&PAI.UvisSalvas&&PAI.UvisSalvas.CFG[APPS]||null}catch(e){return null}}
 function escopoFotos(){var c=cfgSalvas(),p=c&&c.fotos&&c.fotos[0];return (p||APPS+'-campo-')+'campo-achados'}
 function idb(modo,fn){return new Promise(function(ok,no){var r=indexedDB.open(EVI,1);r.onupgradeneeded=function(){if(!r.result.objectStoreNames.contains('photos'))r.result.createObjectStore('photos',{keyPath:'key'})};
  r.onerror=function(){no(r.error)};r.onsuccess=function(){var db=r.result,t=db.transaction('photos',modo),s=t.objectStore('photos'),res,q=fn(s);if(q)q.onsuccess=function(){res=q.result};t.oncomplete=function(){db.close();ok(res)};t.onerror=function(){db.close();no(t.error)}}})}
 function contaFotos(){var c=cfgSalvas();if(!c)return Promise.resolve(null);var pre=c.fotos||[];
  var p1=pre.length?idb('readonly',function(s){return s.getAll()}).then(function(a){return (a||[]).filter(function(x){return pre.some(function(p){return String(x.scope||'').indexOf(p)===0})}).length}):Promise.resolve(0);
  /* só lê: se o banco da drogaria ainda não existe, a abertura é abortada para não criá-lo vazio (sem a tabela de fotos) */
  var p2=c.fotosDb?new Promise(function(ok){var r=indexedDB.open(c.fotosDb.db);r.onupgradeneeded=function(){r.transaction.abort()};r.onerror=function(){ok(0)};r.onsuccess=function(){var db=r.result;if(!db.objectStoreNames.contains(c.fotosDb.store)){db.close();return ok(0)}var q=db.transaction(c.fotosDb.store).objectStore(c.fotosDb.store).count();q.onsuccess=function(){db.close();ok(q.result)};q.onerror=function(){db.close();ok(0)}}}):Promise.resolve(0);
  return Promise.all([p1,p2]).then(function(v){return v[0]+v[1]}).catch(function(){return null})}
 function reduz(file){return new Promise(function(ok,no){var u=URL.createObjectURL(file),im=new Image();im.onload=function(){var k=Math.min(1,1600/Math.max(im.naturalWidth,im.naturalHeight)),c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);var g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.82))};im.onerror=function(){URL.revokeObjectURL(u);no(Error('Não foi possível abrir a imagem.'))};im.src=u})}
 function gravaFoto(id,dataUrl){var sc=escopoFotos();return idb('readwrite',function(s){return s.put({key:sc+'|'+id,scope:sc,id:id,dataUrl:dataUrl})})}
 function leFoto(id){var sc=escopoFotos();return idb('readonly',function(s){return s.get(sc+'|'+id)}).then(function(r){return r&&r.dataUrl})}
 function apagaFoto(id){var sc=escopoFotos();return idb('readwrite',function(s){return s.delete(sc+'|'+id)})}

 /* ---------------- pendente por pergunta ---------------- */
 var RESP=/^(Cumpre|Não cumpre|Não se aplica|Sim|Não|Registrado|Recomendar|Parcial|C|NC|NA)$/;
 function grupos(){var g=[];[].forEach.call(document.querySelectorAll('button'),function(b){if(b.closest('#cmp-painel,#cmp-modal'))return;if(!RESP.test(b.textContent.trim()))return;var p=b.parentElement;if(p&&g.indexOf(p)<0)g.push(p)});
  return g.filter(function(p){return [].filter.call(p.children,function(x){return x.tagName==='BUTTON'&&RESP.test(x.textContent.trim())}).length>=2})}
 function chaveGrupo(p){var bs=[].filter.call(p.children,function(x){return x.tagName==='BUTTON'&&RESP.test(x.textContent.trim())});
  var pares=function(b,corta){return Object.keys(b.dataset).map(function(k){var v=b.dataset[k];if(corta&&v.indexOf('|')>=0)v=v.slice(0,v.lastIndexOf('|'));return k+'='+v})};
  for(var corta=0;corta<2;corta++){var com=pares(bs[0],corta);bs.slice(1).forEach(function(b){var o=pares(b,corta);com=com.filter(function(x){return o.indexOf(x)>=0})});if(com.length)return com.sort().join('&')}
  return 't:'+rotuloGrupo(p).slice(0,120)}
 function caixaGrupo(p){return p.closest('.q,.req,.rs-q,.qmain,.pu-q')||p.parentElement}
 function rotuloGrupo(p){var cx=caixaGrupo(p),cl=cx.cloneNode(true);[].forEach.call(cl.querySelectorAll('button,textarea,input,select,details,.cmp-pbtn,.uvs-previa'),function(e){e.remove()});return limpa(cl.textContent).slice(0,220)}
 var CSSP='.cmp-pbtn{display:inline-flex;align-items:center;gap:6px;margin:8px 0 2px;padding:6px 10px;border-radius:8px;border:1px dashed #b7791f;background:#fffaf0;color:#8a5a14;font:600 12px/1.2 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;cursor:pointer}.cmp-pbtn.on{border-style:solid;background:#fdf0d5;color:#6b4410}.cmp-pend{box-shadow:inset 4px 0 0 #d69e2e!important;background-image:linear-gradient(#fffaf0,#fffaf0)!important}';
 function varre(){if(varre.ocupado)return;varre.ocupado=true;
  try{grupos().forEach(function(p){var k=chaveGrupo(p),nx=p.nextElementSibling,on=!!C.pend[k];
   var btn=nx&&nx.classList&&nx.classList.contains('cmp-pbtn')?nx:null;
   if(!btn){btn=document.createElement('button');btn.type='button';btn.className='cmp-pbtn';p.insertAdjacentElement('afterend',btn)}
   if(btn.dataset.k!==k)btn.dataset.k=k;
   var txt=on?'⏳ Pendente de verificação — tocar para retirar':'⏳ Marcar como pendente';if(btn.textContent!==txt)btn.textContent=txt;
   if(btn.classList.contains('on')!==on)btn.classList.toggle('on',on);
   var cx=caixaGrupo(p);if(cx.classList.contains('cmp-pend')!==on)cx.classList.toggle('cmp-pend',on)})}
  finally{setTimeout(function(){varre.ocupado=false},0)}}
 function alternaPend(btn){var k=btn.dataset.k,p=btn.previousElementSibling;if(!k)return;
  if(C.pend[k])delete C.pend[k];else{var it=itemAtual();C.pend[k]={rotulo:p?rotuloGrupo(p):'',item:it?it.titulo:'',ts:agora()}}
  marcaInicio();grava();varre();pintaFab()}
 function respondeu(b){var p=b.parentElement;if(!p||!RESP.test(b.textContent.trim()))return;var nx=p.nextElementSibling;
  if(nx&&nx.classList&&nx.classList.contains('cmp-pbtn')&&C.pend[nx.dataset.k]){delete C.pend[nx.dataset.k];grava();pintaFab()}
  marcaInicio()}
 function marcaInicio(){if(!C.inicio){C.inicio=agora();grava()}}

 /* ---------------- campo de texto em edição ---------------- */
 var ultimo=null,ultimoDesc=null;
 function descritor(e){var a={tag:e.tagName,id:e.id,name:e.getAttribute('name'),data:{}};[].forEach.call(e.attributes,function(x){if(x.name.indexOf('data-')===0)a.data[x.name]=x.value});return a}
 function reencontra(d){if(!d)return null;if(d.id){var e=document.getElementById(d.id);if(e)return e}
  var sel=d.tag.toLowerCase()+Object.keys(d.data).map(function(k){return '['+k+'="'+(window.CSS&&CSS.escape?CSS.escape(d.data[k]):d.data[k])+'"]'}).join('')+(d.name?'[name="'+d.name+'"]':'');
  try{var l=document.querySelectorAll(sel);return l.length===1?l[0]:null}catch(e){return null}}
 function campoAlvo(){if(ultimo&&ultimo.isConnected)return ultimo;var e=reencontra(ultimoDesc);if(e)ultimo=e;return e}
 function rotuloCampo(e){if(!e)return '';var l=e.closest('label');var t=l?limpa(l.textContent).replace(limpa(e.value),''):'';if(!t&&e.id){var lb=document.querySelector('label[for="'+e.id+'"]');if(lb)t=limpa(lb.textContent)}return (t||e.getAttribute('placeholder')||e.getAttribute('aria-label')||'campo de texto').slice(0,80)}
 function insere(texto){var e=campoAlvo();if(!e){aviso('Toque primeiro no campo onde o texto deve entrar (situação encontrada, observações, NCs anteriores…) e volte aqui. Ou use Copiar.');return false}
  var v=e.value||'',sep=e.tagName==='TEXTAREA'?'\n':' ';e.value=(v.trim()?v.replace(/\s+$/,'')+sep:'')+texto;
  e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));fechaPainel();
  setTimeout(function(){var x=campoAlvo();if(x){x.scrollIntoView({block:'center'});try{x.focus()}catch(er){}}},60);aviso('Texto inserido em: '+rotuloCampo(e)+'.');return true}
 function copia(texto){var ok=function(){aviso('Texto copiado.')};
  try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(texto).then(ok,function(){copia2(texto);ok()})}catch(e){}
  copia2(texto);ok()}
 function copia2(texto){var t=document.createElement('textarea');t.value=texto;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch(e){}t.remove()}

 /* ---------------- redação ---------------- */
 var FRASES0=['Área em adequadas condições de higiene, conservação e organização.','Foi verificado que …','Não foi constatada a realização de …','Não foi apresentado(a) …','Foi apresentado(a) …, datado(a) de …','Os registros apresentados referem-se ao período de … a ….','No momento da inspeção, …','A equipe orientou quanto a …','O estabelecimento foi orientado a …','Não foram observadas irregularidades neste item.'];
 function lsCasca(){return PAI?PAI.localStorage:localStorage}
 function frases(){var f;try{f=JSON.parse(lsCasca().getItem('med-frases-v1')||'null')}catch(e){}return Array.isArray(f)?f:FRASES0.slice()}
 function gravaFrases(f){try{lsCasca().setItem('med-frases-v1',JSON.stringify(f))}catch(e){}}
 function minuscula(t){return /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]{2,}/.test(t)?t:t.charAt(0).toLowerCase()+t.slice(1)}
 function juntaLista(a){return a.length<2?a.join(''):a.slice(0,-1).join(', ')+' e '+a[a.length-1]}
 function constroi(cons){var itens=String(cons.itens||'').split(/\n+/).map(function(x){return limpa(x).replace(/[.;]+$/,'')}).filter(Boolean).map(minuscula);if(!itens.length)return '';
  var v=cons.verbo||'verificou-se',l=limpa(cons.local).replace(/[,.]+$/,'');
  var f=l?l+', '+v+' '+juntaLista(itens)+'.':v.charAt(0).toUpperCase()+v.slice(1)+' '+juntaLista(itens)+'.';return f.charAt(0).toUpperCase()+f.slice(1)}


 /* ---------------- verificações realizadas ---------------- */
 var TIPOS_V={
  balanca:['Balança','balança (marca, modelo, nº de série)','peso-padrão (valor nominal e certificado de calibração)','valor nominal ± tolerância','leitura obtida'],
  temperatura:['Temperatura (refrigerador, câmara)','refrigerador da área de … (identificação)','termômetro de referência (identificação e calibração)','faixa especificada (ex.: 2 °C a 8 °C)','temperatura lida'],
  termohigrometro:['Termo-higrômetro','termo-higrômetro da área de …','instrumento de referência ou registro diário','faixas especificadas de temperatura e umidade','valores lidos'],
  estoque:['Estoque','produto (nome, concentração, lote)','saldo escriturado (sistema, livro ou SNGPC)','quantidade escriturada','quantidade física contada'],
  rastreabilidade:['Rastreabilidade','produto ou insumo (nome, lote)','documentos conferidos (nota fiscal, laudo, ordem de manipulação)','dados coincidentes entre os documentos','dados encontrados'],
  outra:['Outra','equipamento, produto ou registro verificado','padrão, instrumento ou documento de referência','resultado esperado','resultado encontrado']};
 var CONCL=[['','Conclusão'],['conforme','De acordo com o esperado'],['nao','Em desacordo com o esperado'],['inconclusiva','Inconclusiva']];
 function sp(t){return limpa(t).replace(/[.;]+$/,'')}
 function textoVerif(v){v=v||{};var o=sp(v.obj);if(!o)return '';var t='Realizou-se verificação de '+o+(sp(v.pad)?', utilizando '+sp(v.pad):'')+'.';
  if(sp(v.esp))t+=' Resultado esperado: '+sp(v.esp)+'.';if(sp(v.enc))t+=' Resultado encontrado: '+sp(v.enc)+'.';
  t+={conforme:' O resultado encontrado está de acordo com o esperado.',nao:' O resultado encontrado está em desacordo com o esperado.',inconclusiva:' A verificação foi inconclusiva.'}[v.concl]||'';
  if(sp(v.obs)){var ob=sp(v.obs);t+=' '+ob.charAt(0).toUpperCase()+ob.slice(1)+'.'}return t}

 /* ---------------- fotos: legenda automática e tipo ---------------- */
 var TIPOS_F=[['evidencia','Evidência'],['documental','Documental'],['consulta','Só consulta (fora do PDF)']];
 function adFotos(){try{return window.UvsFotosPDF&&UvsFotosPDF.adaptadores[APP]||null}catch(e){return null}}
 function hashTxt(t){var h=2166136261,n=t.length,passo=Math.max(1,Math.floor(n/512));for(var i=0;i<n;i+=passo){h^=t.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return (h>>>0).toString(36)+'.'+n}
 function chaveFoto(f){var s=f.src;if(typeof s==='string')return 's'+hashTxt(s);if(s&&typeof s.size==='number')return 'b'+s.size+'.'+hashTxt(String(f.legenda||''));return 'x'+hashTxt(String(f.legenda||''))}
 /* lista do relatório fotográfico + fotos dos achados, cada uma com a chave */
 function listaFotos(){var ad=adFotos();var p1=ad?Promise.resolve().then(ad.fotos).catch(function(){return []}):Promise.resolve([]);
  var p2=Promise.all(C.achados.filter(function(a){return a.foto}).map(function(a){return leFoto(a.foto).then(function(u){return u?{src:u,legenda:'Achado'+(a.item?' — '+a.item:'')+' — '+(a.local?a.local+': ':'')+a.txt,ts:a.ts}:null},function(){return null})}));
  return Promise.all([p1,p2]).then(function(v){return (v[0]||[]).concat(v[1].filter(Boolean)).filter(function(f){return f&&f.src}).map(function(f){f.k=chaveFoto(f);return f})})}
 /* ao tirar/escolher foto no roteiro: guarda data, hora e item das fotos novas */
 var tFotos=0;
 function registraFotos(marcaHora){return listaFotos().then(function(l){var mud=false;l.forEach(function(f){if(!C.fotos[f.k]){var it=itemAtual();C.fotos[f.k]={ts:marcaHora?agora():(f.ts||null),item:marcaHora&&it?it.titulo:'',tipo:'evidencia'};mud=true}});if(mud)grava();return l})}
 function legendaFoto(f){var m=C.fotos[f.k]||{},ts=m.ts||f.ts;return limpa(f.legenda||'Registro da inspeção')+(sp(m.leg)?' — '+sp(m.leg):'')+(ts?' — '+dataHora(ts):'')}
 function gerarPdf(){var ad=adFotos();if(!ad||!window.UvsFotosPDF)return aviso('Este roteiro não tem relatório fotográfico.');aviso('Montando o relatório fotográfico…');
  return registraFotos(false).then(function(l){var ev=[],doc=[];l.forEach(function(f){var t=(C.fotos[f.k]||{}).tipo||'evidencia';if(t==='evidencia')ev.push(f);else if(t==='documental')doc.push(f)});
   var sel=ev.concat(doc);if(!sel.length)return aviso('Nenhuma foto marcada como evidência ou documental.');var out=[],p=Promise.resolve();
   sel.forEach(function(f){p=p.then(function(){return UvsFotosPDF.reduz(f.src,1280,.75).then(function(r){var s=atob(r.url.split(',')[1]),u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);
    var tipo=(C.fotos[f.k]||{}).tipo;out.push({n:out.length+1,legenda:(tipo==='documental'?'Documental — ':'')+legendaFoto(f),w:r.w,h:r.h,bytes:u})},function(){})})});
   return p.then(function(){if(!out.length)return aviso('Não foi possível ler as fotos.');var m={};try{m=ad.meta()||{}}catch(e){}var iso=/^(\d{4})-(\d{2})-(\d{2})/.exec(m.data||'');if(iso)m.data=iso[3]+'/'+iso[2]+'/'+iso[1];
    var blob=UvsFotosPDF.pdf({titulo:ad.titulo,estab:m.estab,data:m.data},out),a=document.createElement('a'),nome=String(m.estab||'inspecao').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40)||'inspecao';
    a.href=URL.createObjectURL(blob);a.download='Relatorio_fotografico_'+nome+'_'+new Date().toISOString().slice(0,10)+'.pdf';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},2000);
    aviso('Relatório fotográfico: '+out.length+' foto(s)'+(l.length>out.length?'; '+(l.length-out.length)+' só para consulta ficaram fora':'')+'.')})})}

 /* ---------------- pendências (para o resumo e o aviso ao emitir) ---------------- */
 function pendencias(){var out=[];
  Object.keys(C.pend).forEach(function(k){var p=C.pend[k];out.push({tipo:'Pergunta pendente',txt:(p.item?p.item+' › ':'')+p.rotulo})});
  C.lemb.forEach(function(l){if(!l.feito)out.push({tipo:'Lembrete',txt:l.txt})});
  C.achados.forEach(function(a){if(!a.item)out.push({tipo:'Achado sem item',txt:(a.local?a.local+': ':'')+a.txt})});
  /* CNPJ reprovado no formulário (modulos/cnpj-guarda.js) */
  if(window.__medCnpjInvalidos)window.__medCnpjInvalidos().forEach(function(x){out.push({tipo:'CNPJ inválido',txt:x})});
  return out}

 /* conferência do relatório (só na emissão e na aba Pendências, para não inflar o contador
    durante a inspeção): anotação em pergunta sem situação marcada, Não cumpre sem
    evidência e contradições entre a situação e os dados digitados (Atacadista). */
 function consistencia(){var out=[],m=motor(),tem=function(v){return v!=null&&String(v).trim()!==''},cur=function(t){t=limpa(t).replace(/\s*\?$/,'');return t.length>90?t.slice(0,87)+'…':t};
  var olha=function(rot,st,ev,nc,info){if(tem(ev)&&!st)out.push({tipo:'Anotação sem situação marcada',txt:cur(rot)});else if(st===nc&&!tem(ev)&&!info)out.push({tipo:'Não cumpre sem evidência',txt:cur(rot)})};
  try{
   if(m==='rs'){var S=stRs(),r=S.r||{},sit=S.sit||{};perguntasRs().forEach(function(x){olha(x.q.t,r[x.q.id],sit[x.q.id],'nc')})}
   else if(m==='manip'){var rr=state.responses||{};Object.keys(APP_DATA.cards).forEach(function(n){APP_DATA.cards[n].sections.forEach(function(se){se.requirements.forEach(function(q){var a=rr[q.id]||{};olha(q.text||q.pos||q.id,a.status,a.evidence,'NC',q.informativo)})})})}
   else if(m==='dist'){var an=state.answers||{};DATA.sections.forEach(function(se){se.questions.forEach(function(q){if(q.escopo)return;var a=an[q.id]||{};olha(q.text||q.id,a.status,a.evidence,'NC')})});
    var R=state.report||{},D=state.distDocs||{},L=D.lic||{};
    if(R.licSituacao==='Não possui licença'&&(tem(L.number)||tem(L.validity)))out.push({tipo:'Contradição',txt:'Licença marcada como “Não possui”, mas há número ou validade digitados — esses dados não saem no relatório.'});
    [['afe','AFE'],['ae','AE']].forEach(function(k){var d=D[k[0]]||{};if(/^Não (possui|se aplica)$/.test(d.status||'')&&tem(d.number))out.push({tipo:'Contradição',txt:k[1]+' marcada como “'+d.status+'”, mas há número digitado ('+d.number+').'})})}
  }catch(e){}
  return out}

 /* ---------------- interface ---------------- */
 var CSS='#cmp-fab.cmp-flutua{position:fixed;right:12px;bottom:84px;z-index:2147482000;display:inline-flex;align-items:center;gap:6px;min-height:42px;padding:8px 14px;border-radius:21px;border:0;background:var(--uvis-tone,#365B73);color:#fff;font:700 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;box-shadow:0 4px 14px #0003;cursor:pointer}#cmp-fab.cmp-flutua .n{min-width:20px;padding:3px 6px;border-radius:10px;background:#d69e2e;color:#1a1a1a;font-size:12px}#cmp-fab .n[hidden]{display:none}'
  +'#cmp-painel{position:fixed;inset:0;z-index:2147483100;background:#0006;display:flex;justify-content:center;align-items:flex-end}#cmp-painel .cx{background:#fff;color:#1f2a33;width:min(760px,100%);max-height:92vh;display:flex;flex-direction:column;border-radius:16px 16px 0 0;font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}'
  +'#cmp-painel header,#cmp-painel nav{flex:0 0 auto}#cmp-painel header{display:flex;align-items:center;gap:8px;padding:12px 14px 6px}#cmp-painel header b{flex:1;font-size:16px}#cmp-painel .x{border:0;background:#eef2f5;border-radius:8px;min-width:40px;min-height:36px;font-size:18px;cursor:pointer}'
  +'#cmp-painel nav{display:flex;gap:6px;padding:4px 12px 10px;overflow-x:auto;border-bottom:1px solid #e3e8ec}#cmp-painel nav button{flex:0 0 auto;border:1px solid #cfd8df;background:#fff;border-radius:18px;padding:7px 12px;font:600 13px/1 inherit;cursor:pointer;color:#34495a}#cmp-painel nav button.on{background:var(--uvis-tone,#365B73);border-color:transparent;color:#fff}'
  +'#cmp-painel .corpo{overflow:auto;padding:12px 14px 22px}#cmp-painel h4{margin:14px 0 6px;font-size:14px}#cmp-painel .grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}#cmp-painel .k{border:1px solid #e3e8ec;border-radius:10px;padding:8px 10px}#cmp-painel .k b{display:block;font-size:20px}#cmp-painel .k span{font-size:12px;color:#5b6b78}#cmp-painel .k.al{border-color:#d69e2e;background:#fffaf0}'
  +'#cmp-painel .lin{border:1px solid #e3e8ec;border-radius:10px;padding:8px 10px;margin:6px 0}#cmp-painel .lin small{display:block;color:#5b6b78}#cmp-painel .acoes{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}#cmp-painel .b{border:1px solid #cfd8df;background:#fff;border-radius:8px;padding:7px 10px;font:600 13px/1.1 inherit;cursor:pointer;color:#26394a}#cmp-painel .b.pri{background:var(--uvis-tone,#365B73);border-color:transparent;color:#fff}#cmp-painel .b.del{color:#9b2c2c}#cmp-painel .cmp-foto{display:inline-block;margin:6px 0}'
  +'#cmp-painel label.f{display:block;margin:8px 0}#cmp-painel label.f span{display:block;font-size:12px;font-weight:600;color:#3f5263;margin-bottom:3px}#cmp-painel input[type=text],#cmp-painel textarea,#cmp-painel select{width:100%;box-sizing:border-box;border:1px solid #cfd8df;border-radius:8px;padding:8px;font:15px/1.4 inherit}#cmp-painel .prev{background:#f6f8fa;border-radius:8px;padding:10px;white-space:pre-wrap}#cmp-painel .nota{color:#5b6b78;font-size:13px}#cmp-painel img.ft{max-width:120px;max-height:90px;border-radius:6px;display:block;margin-top:6px}'
  +'#cmp-modal{position:fixed;inset:0;z-index:2147483200;background:#0006;display:flex;align-items:center;justify-content:center;padding:16px}#cmp-modal .cx{background:#fff;border-radius:14px;max-width:560px;width:100%;max-height:85vh;overflow:auto;padding:16px;font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1f2a33}#cmp-modal li{margin:4px 0}#cmp-modal .acoes{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#cmp-modal button{border:1px solid #cfd8df;background:#fff;border-radius:8px;padding:9px 12px;font:600 14px/1 inherit;cursor:pointer}#cmp-modal button.pri{background:var(--uvis-tone,#365B73);color:#fff;border-color:transparent}'
  +'.sm-box{border-color:#cbd6e3!important;border-left-color:var(--uvis-tone,#34426E)!important;background:#f3f6fa!important}.sm-box>summary{color:var(--uvis-tone,#1f3b5c)!important}.sm-box p,.sm-box li{color:#1f2e3d!important}.sm-box .sm-nota{border-top-color:#cbd6e3!important;color:#5b6b78!important}'
  +'#cmp-aviso{position:fixed;left:50%;bottom:140px;transform:translateX(-50%);z-index:2147483300;background:#1f2a33;color:#fff;padding:10px 14px;border-radius:10px;font:14px/1.35 system-ui,sans-serif;max-width:90vw;box-shadow:0 4px 14px #0004}'+CSSP;
 function aviso(t){var a=document.getElementById('cmp-aviso');if(!a){a=document.createElement('div');a.id='cmp-aviso';document.body.appendChild(a)}a.textContent=t;clearTimeout(aviso.t);aviso.t=setTimeout(function(){a.remove()},4200)}
 function pintaFab(){var f=document.getElementById('cmp-fab');if(!f)return;var n=pendencias().length,s=f.querySelector('.n');s.textContent=n;s.hidden=!n;f.title=n?n+' pendência(s)':'Ferramentas de campo'}
 var aba='resumo',itemAoAbrir=null;
 function abrePainel(qual){confereReinicio();itemAoAbrir=itemAtual();if(qual)aba=qual;var p=document.getElementById('cmp-painel');if(!p){p=document.createElement('div');p.id='cmp-painel';document.body.appendChild(p);p.addEventListener('click',cliquePainel);
   /* os eventos do painel não seguem para os roteiros (que escutam input/change no document) */
   p.addEventListener('input',function(e){e.stopPropagation();entradaPainel(e)});p.addEventListener('change',function(e){e.stopPropagation();mudaPainel(e)})}pinta()}
 function fechaPainel(){var p=document.getElementById('cmp-painel');if(p)p.remove();pintaFab()}
 var ABAS=[['resumo','Resumo'],['pend','Pendências'],['achados','Achados'],['fotos','Fotos'],['redacao','Redação'],['verif','Verificações']];
 function pinta(){var p=document.getElementById('cmp-painel');if(!p)return;var np=pendencias().length;
  p.innerHTML='<div class="cx" role="dialog" aria-label="Ferramentas de campo"><header><b>Ferramentas de campo</b><button type="button" class="x" data-c="fecha" aria-label="Fechar">✕</button></header><nav>'
   +ABAS.map(function(a){return '<button type="button" data-aba="'+a[0]+'" class="'+(a[0]===aba?'on':'')+'">'+a[1]+(a[0]==='pend'&&np?' ('+np+')':'')+'</button>'}).join('')+'</nav><div class="corpo">'+corpo()+'</div></div>';
  if(aba==='resumo')contaFotos().then(function(n){var e=p.querySelector('[data-fotos]');if(e)e.textContent=n==null?'—':n});
  if(aba==='resumo')pintaCopias(p);
  if(aba==='achados')[].forEach.call(p.querySelectorAll('img[data-foto]'),function(im){leFoto(im.dataset.foto).then(function(u){if(u)im.src=u})});
  if(aba==='fotos')registraFotos(false).then(function(l){var e=p.querySelector('[data-lista-fotos]');if(!e)return;
   if(!l.length){e.innerHTML='<p class="nota">Nenhuma foto registrada nesta inspeção.</p>';return}
   var n={evidencia:0,documental:0,consulta:0};l.forEach(function(f){n[(C.fotos[f.k]||{}).tipo||'evidencia']++});
   e.innerHTML='<p class="nota">'+l.length+' foto(s): '+n.evidencia+' evidência, '+n.documental+' documental, '+n.consulta+' só consulta.</p>'+l.map(function(f,i){var m=C.fotos[f.k]||{};
    return '<div class="lin cmp-ft"><img class="ft" data-ft="'+i+'" alt="Foto '+(i+1)+'"><small>'+esc(legendaFoto(f))+'</small><label class="f"><span>Complemento da legenda</span><input type="text" data-foto2="'+esc(f.k)+'" data-campo="leg" placeholder="Ex.: balança MARK 50" value="'+esc(m.leg||'')+'"></label>'
     +'<label class="f"><span>Tipo</span><select data-foto2="'+esc(f.k)+'" data-campo="tipo">'+TIPOS_F.map(function(t){return '<option value="'+t[0]+'"'+((m.tipo||'evidencia')===t[0]?' selected':'')+'>'+t[1]+'</option>'}).join('')+'</select></label></div>'}).join('');
   l.forEach(function(f,i){var im=e.querySelector('[data-ft="'+i+'"]');if(!im)return;if(typeof f.src==='string')im.src=f.src;else try{im.src=URL.createObjectURL(f.src)}catch(er){}})});
  }
 function k(v,r,al){return '<div class="k'+(al?' al':'')+'"><b>'+v+'</b><span>'+r+'</span></div>'}
 function corpo(){
  if(aba==='resumo'){var n=contagem(),pend=pendencias(),ach=C.achados,vinc=ach.filter(function(a){return a.item}).length,nome=nomeEstab();
   var sec='';try{if(n.m==='rs'){var ss=UvisPadrao.secoes(),tot=0,ok=0;ss.forEach(function(s){s.itens.forEach(function(i){if(i.total){tot++;if(i.feitos>=i.total)ok++}})});sec=k(ok+'/'+tot,'itens concluídos')}}catch(e){}
   return '<div class="lin"><b>'+esc(nome||'Estabelecimento não identificado')+'</b><small>'+esc(document.title||'')+' · início '+esc(dataHora(C.inicio))+' · última alteração '+esc(dataHora(C.alterado))+'</small></div>'
    +'<h4>Respostas</h4><div class="grade">'+k(n.resp,'respondidas')+(n.m==='drogaria'?'':k(n.c,'conformes'))+k(n.nc,'não conformes'+(n.m==='drogaria'?' (irregularidades)':''),n.nc)+k(n.na,'não se aplica')+sec+'</div>'
    +'<h4>Controle</h4><div class="grade">'+k(Object.keys(C.pend).length,'perguntas pendentes',Object.keys(C.pend).length)+k(C.lemb.filter(function(l){return !l.feito}).length,'lembretes abertos',C.lemb.some(function(l){return !l.feito}))+k(vinc+'/'+ach.length,'achados vinculados',vinc<ach.length)+'<div class="k"><b data-fotos>…</b><span>fotos</span></div>'+k(C.verif.length,'verificações registradas')+'</div>'
    +(pend.length?'<h4>A resolver antes de encerrar ('+pend.length+')</h4>'+pend.slice(0,8).map(function(x){return '<div class="lin"><small>'+esc(x.tipo)+'</small>'+esc(x.txt)+'</div>'}).join('')+(pend.length>8?'<p class="nota">… e mais '+(pend.length-8)+' na aba Pendências.</p>':''):'<p class="nota">Nada pendente.</p>')
    +'<p class="nota">'+(n.m==='drogaria'?'Na drogaria há perguntas descritivas (Sim/Não); por isso o número de não conformes é o de irregularidades do relatório. ':'')+'Controle de completude da inspeção; não é pontuação sanitária.</p>'
    +'<h4>Cópias automáticas</h4><div data-copias><p class="nota">…</p></div>'}
  if(aba==='pend'){var ks=Object.keys(C.pend);
   return '<h4>Perguntas pendentes de verificação ('+ks.length+')</h4>'+(ks.length?ks.map(function(key){var p=C.pend[key];return '<div class="lin">'+(p.item?'<small>'+esc(p.item)+'</small>':'')+esc(p.rotulo)+'<div class="acoes"><button type="button" class="b" data-c="tira-pend" data-k="'+esc(key)+'">Retirar</button></div></div>'}).join(''):'<p class="nota">Nenhuma. Em cada pergunta há o botão “⏳ Marcar como pendente”; a marcação sai sozinha quando a pergunta é respondida.</p>')+(function(){var cs=consistencia();return cs.length?'<h4>Conferência do relatório ('+cs.length+')</h4><p class="nota">Não impede a emissão; confira se é isso mesmo.</p>'+cs.map(function(x){return '<div class="lin"><small>'+esc(x.tipo)+'</small>'+esc(x.txt)+'</div>'}).join(''):''})()
    +'<h4>Lembretes (não vão ao relatório)</h4><label class="f"><input type="text" data-novo-lemb placeholder="Ex.: voltar à geladeira; pedir certificado da balança; fotografar o DML"></label><div class="acoes"><button type="button" class="b pri" data-c="add-lemb">Adicionar lembrete</button></div>'
    +C.lemb.map(function(l,i){return '<div class="lin"><label><input type="checkbox" data-lemb="'+i+'"'+(l.feito?' checked':'')+'> '+(l.feito?'<s>'+esc(l.txt)+'</s>':esc(l.txt))+'</label><div class="acoes"><button type="button" class="b del" data-c="del-lemb" data-i="'+i+'">Excluir</button></div></div>'}).join('')}
  if(aba==='achados'){var it=itemAoAbrir;
   return '<p class="nota">O que foi visto antes de chegar à pergunta correspondente. Depois, vincule ao item e use o texto na situação encontrada ou nas observações. Achado sem item conta como pendência.</p>'
    +'<h4>Novo achado</h4><label class="f"><span>Local</span><input type="text" data-a="local" placeholder="Ex.: sanitário do mezanino" value="'+esc(C.rasc&&C.rasc.local||'')+'"></label><label class="f"><span>O que foi encontrado</span><textarea rows="3" data-a="txt" placeholder="Ex.: ralo danificado">'+esc(C.rasc&&C.rasc.txt||'')+'</textarea></label>'
    +'<label class="b cmp-foto"><input type="file" accept="image/*" capture="environment" data-a="foto" hidden><span data-foto-nome>📷 Tirar ou escolher foto (opcional)</span></label><div class="acoes"><button type="button" class="b pri" data-c="add-achado">Registrar achado</button></div>'
    +'<h4>Achados ('+C.achados.length+')</h4>'+(C.achados.length?C.achados.map(function(a,i){return '<div class="lin"><small>'+esc(dataHora(a.ts))+(a.item?' · item: '+esc(a.item):' · sem item')+'</small>'+(a.local?'<b>'+esc(a.local)+':</b> ':'')+esc(a.txt)+(a.foto?'<img class="ft" data-foto="'+esc(a.foto)+'" alt="Foto do achado">':'')
     +'<div class="acoes">'+(it?'<button type="button" class="b" data-c="vinc" data-i="'+i+'">Vincular a: '+esc(it.titulo.slice(0,40))+'</button>':'<span class="nota">Para vincular, abra o item no roteiro e volte aqui.</span>')+(a.item?'<button type="button" class="b" data-c="desvinc" data-i="'+i+'">Desvincular</button>':'')
     +'<button type="button" class="b" data-c="usa-achado" data-i="'+i+'">Inserir no campo</button><button type="button" class="b" data-c="cons-achado" data-i="'+i+'">Levar ao construtor</button><button type="button" class="b del" data-c="del-achado" data-i="'+i+'">Excluir</button></div></div>'}).join(''):'<p class="nota">Nenhum achado registrado.</p>')}
  if(aba==='redacao'){var c=C.cons,fr=frases(),alvo=campoAlvo(),res=constroi(c);
   return '<p class="nota">Campo de destino: <b>'+esc(alvo?rotuloCampo(alvo):'nenhum — toque no campo de texto do roteiro antes de abrir aqui')+'</b>.</p>'
    +'<h4>Construtor de constatação</h4><p class="nota">Informe os fatos; o texto é montado só com eles, sem IA.</p>'
    +'<label class="f"><span>Local (como deve sair no texto)</span><input type="text" data-cons="local" placeholder="Ex.: No sanitário localizado no mezanino" value="'+esc(c.local)+'"></label>'
    +'<label class="f"><span>Achados (um por linha)</span><textarea rows="4" data-cons="itens" placeholder="ralo danificado&#10;fiação exposta no chuveiro&#10;ausência de papel-toalha para secagem das mãos">'+esc(c.itens)+'</textarea></label>'
    +'<label class="f"><span>Verbo</span><select data-cons="verbo">'+['verificou-se','constatou-se','observou-se'].map(function(v){return '<option'+(c.verbo===v?' selected':'')+'>'+v+'</option>'}).join('')+'</select></label>'
    +'<div class="prev" data-cons-prev>'+esc(res||'O texto aparece aqui.')+'</div><div class="acoes"><button type="button" class="b pri" data-c="ins-cons">Inserir no campo</button><button type="button" class="b" data-c="cop-cons">Copiar</button><button type="button" class="b" data-c="limpa-cons">Limpar</button></div>'
    +'<h4>Frases</h4><p class="nota">Toque para inserir no campo e adapte o trecho “…”. A lista é comum a todos os roteiros deste aparelho.</p>'
    +fr.map(function(f,i){return '<div class="lin">'+esc(f)+'<div class="acoes"><button type="button" class="b pri" data-c="ins-frase" data-i="'+i+'">Inserir</button><button type="button" class="b" data-c="cop-frase" data-i="'+i+'">Copiar</button><button type="button" class="b del" data-c="del-frase" data-i="'+i+'">Excluir</button></div></div>'}).join('')
    +'<label class="f"><span>Nova frase</span><input type="text" data-nova-frase placeholder="Frase que você usa com frequência"></label><div class="acoes"><button type="button" class="b" data-c="add-frase">Adicionar frase</button><button type="button" class="b" data-c="frases-padrao">Restaurar frases padrão</button></div>'}
  if(aba==='fotos')return '<p class="nota">A legenda sai do ponto do roteiro em que a foto foi registrada, com data e hora (fotos tiradas a partir desta versão). Acrescente um complemento curto e escolha o tipo: evidência e documental entram no relatório fotográfico; “só consulta” fica fora.</p><div class="acoes"><button type="button" class="b pri" data-c="gera-pdf">Gerar relatório fotográfico (PDF)</button></div><div data-lista-fotos><p class="nota">Lendo as fotos…</p></div>';
  if(aba==='verif'){var v=C.vrasc||{tipo:'balanca'},tp=TIPOS_V[v.tipo]||TIPOS_V.outra,tv=textoVerif(v);
   return '<p class="nota">Registre a verificação feita na inspeção; o texto sai dos dados informados.</p>'
    +'<label class="f"><span>Tipo</span><select data-v="tipo">'+Object.keys(TIPOS_V).map(function(k){return '<option value="'+k+'"'+(v.tipo===k?' selected':'')+'>'+TIPOS_V[k][0]+'</option>'}).join('')+'</select></label>'
    +'<label class="f"><span>Equipamento, produto ou registro</span><input type="text" data-v="obj" placeholder="'+esc(tp[1])+'" value="'+esc(v.obj||'')+'"></label>'
    +'<label class="f"><span>Padrão ou referência utilizada</span><input type="text" data-v="pad" placeholder="'+esc(tp[2])+'" value="'+esc(v.pad||'')+'"></label>'
    +'<label class="f"><span>Resultado esperado</span><input type="text" data-v="esp" placeholder="'+esc(tp[3])+'" value="'+esc(v.esp||'')+'"></label>'
    +'<label class="f"><span>Resultado encontrado</span><input type="text" data-v="enc" placeholder="'+esc(tp[4])+'" value="'+esc(v.enc||'')+'"></label>'
    +'<label class="f"><span>Conclusão</span><select data-v="concl">'+CONCL.map(function(c){return '<option value="'+c[0]+'"'+((v.concl||'')===c[0]?' selected':'')+'>'+c[1]+'</option>'}).join('')+'</select></label>'
    +'<label class="f"><span>Observação (opcional)</span><input type="text" data-v="obs" placeholder="Ex.: a equipe orientou a recalibração" value="'+esc(v.obs||'')+'"></label>'
    +'<div class="prev" data-v-prev>'+esc(tv||'O texto aparece aqui.')+'</div><div class="acoes"><button type="button" class="b pri" data-c="ins-verif">Inserir no campo</button><button type="button" class="b" data-c="cop-verif">Copiar</button><button type="button" class="b" data-c="reg-verif">Registrar e limpar</button></div>'
    +'<h4>Verificações registradas ('+C.verif.length+')</h4>'+(C.verif.length?C.verif.map(function(x,i){return '<div class="lin"><small>'+esc(dataHora(x.ts))+' · '+esc((TIPOS_V[x.tipo]||TIPOS_V.outra)[0])+'</small>'+esc(textoVerif(x))+'<div class="acoes"><button type="button" class="b pri" data-c="ins-verif-i" data-i="'+i+'">Inserir no campo</button><button type="button" class="b" data-c="cop-verif-i" data-i="'+i+'">Copiar</button><button type="button" class="b del" data-c="del-verif" data-i="'+i+'">Excluir</button></div></div>'}).join(''):'<p class="nota">Nenhuma.</p>')}
  return ''}
 function cliquePainel(e){var b=e.target.closest('[data-aba],[data-c]');if(!b)return;if(e.target===e.currentTarget)return fechaPainel();
  if(b.dataset.aba){aba=b.dataset.aba;return pinta()}
  var c=b.dataset.c,i=+b.dataset.i,p=document.getElementById('cmp-painel');
  if(c==='fecha')return fechaPainel();
  if(c==='tira-pend'){delete C.pend[b.dataset.k];grava();varre();return pinta()}
  if(c==='add-lemb'){var inp=p.querySelector('[data-novo-lemb]'),t=limpa(inp.value);if(!t)return;C.lemb.push({txt:t,ts:agora()});marcaInicio();grava();return pinta()}
  if(c==='del-lemb'){C.lemb.splice(i,1);grava();return pinta()}
  if(c==='restaura'){var M=copias();if(!M)return;if(!confirm('Substituir a inspeção aberta por esta cópia? A inspeção atual é guardada antes como uma nova cópia, para poder voltar.'))return;
   M.restaura(b.dataset.k).catch(function(er){aviso('Não foi possível restaurar: '+(er&&er.message||er))});return}
  if(c==='add-achado'){var lo=limpa(p.querySelector('[data-a="local"]').value),tx=limpa(p.querySelector('[data-a="txt"]').value),fi=p.querySelector('[data-a="foto"]').files[0];
   if(!tx&&!fi)return aviso('Descreva o achado ou tire uma foto.');var a={id:novoId(),local:lo,txt:tx,ts:agora(),item:''};
   var fim=function(){C.achados.unshift(a);C.rasc=null;marcaInicio();grava();pinta();aviso('Achado registrado.')};
   if(!fi)return fim();b.disabled=true;return reduz(fi).then(function(u){return gravaFoto(a.id,u)}).then(function(){a.foto=a.id;fim()}).catch(function(er){b.disabled=false;aviso('Foto não gravada: '+(er&&er.message||er))})}
  if(c==='vinc'&&itemAoAbrir){C.achados[i].item=itemAoAbrir.titulo;grava();return pinta()}
  if(c==='desvinc'){C.achados[i].item='';grava();return pinta()}
  if(c==='usa-achado'){var ac=C.achados[i];return insere((ac.local?ac.local+': ':'')+ac.txt)}
  if(c==='cons-achado'){var ax=C.achados[i];if(ax.local&&!C.cons.local)C.cons.local=ax.local;C.cons.itens=(C.cons.itens?C.cons.itens.replace(/\s+$/,'')+'\n':'')+ax.txt;grava();aba='redacao';return pinta()}
  if(c==='del-achado'){if(!confirm('Excluir este achado?'))return;var d=C.achados.splice(i,1)[0];if(d&&d.foto)apagaFoto(d.foto).catch(function(){});grava();return pinta()}
  if(c==='ins-cons'){var tc=constroi(C.cons);return tc?insere(tc):aviso('Informe ao menos um achado.')}
  if(c==='cop-cons'){var tc2=constroi(C.cons);return tc2?copia(tc2):aviso('Informe ao menos um achado.')}
  if(c==='limpa-cons'){C.cons={local:'',itens:'',verbo:C.cons.verbo};grava();return pinta()}
  if(c==='ins-frase')return insere(frases()[i]);
  if(c==='cop-frase')return copia(frases()[i]);
  if(c==='del-frase'){var f=frases();f.splice(i,1);gravaFrases(f);return pinta()}
  if(c==='add-frase'){var nf=limpa(p.querySelector('[data-nova-frase]').value);if(!nf)return;var f2=frases();f2.push(nf);gravaFrases(f2);return pinta()}
  if(c==='gera-pdf')return gerarPdf();
  if(c==='ins-verif'||c==='cop-verif'){var tx=textoVerif(C.vrasc);if(!tx)return aviso('Informe ao menos o equipamento, produto ou registro verificado.');return c==='ins-verif'?insere(tx):copia(tx)}
  if(c==='reg-verif'){if(!textoVerif(C.vrasc))return aviso('Informe ao menos o equipamento, produto ou registro verificado.');var vr=Object.assign({},C.vrasc,{ts:agora()});C.verif.unshift(vr);C.vrasc={tipo:vr.tipo};marcaInicio();grava();return pinta()}
  if(c==='ins-verif-i')return insere(textoVerif(C.verif[i]));
  if(c==='cop-verif-i')return copia(textoVerif(C.verif[i]));
  if(c==='del-verif'){C.verif.splice(i,1);grava();return pinta()}
  if(c==='frases-padrao'){if(confirm('Restaurar as frases padrão? As frases que você incluiu serão apagadas.')){gravaFrases(FRASES0.slice());pinta()}return}
 }
 function entradaPainel(e){var t=e.target;
  if(t.dataset.cons){C.cons[t.dataset.cons]=t.value;grava();var pv=document.querySelector('[data-cons-prev]');if(pv)pv.textContent=constroi(C.cons)||'O texto aparece aqui.';return}
  if(t.dataset.a==='local'||t.dataset.a==='txt'){C.rasc=C.rasc||{};C.rasc[t.dataset.a]=t.value;grava();return}
  if(t.dataset.foto2&&t.dataset.campo==='leg'){var fm=C.fotos[t.dataset.foto2]=C.fotos[t.dataset.foto2]||{};fm.leg=t.value;grava();return}
  if(t.dataset.v){(C.vrasc=C.vrasc||{})[t.dataset.v]=t.value;grava();var pv=document.querySelector('[data-v-prev]');if(pv)pv.textContent=textoVerif(C.vrasc)||'O texto aparece aqui.';return}}
 function mudaPainel(e){var t=e.target;
  if(t.dataset.a==='foto'){var nm=document.querySelector('[data-foto-nome]');if(nm)nm.textContent=t.files[0]?'📷 Foto escolhida: '+t.files[0].name:'📷 Tirar ou escolher foto (opcional)';return}
  if(t.dataset.lemb!==undefined){C.lemb[+t.dataset.lemb].feito=t.checked;grava();return pinta()}
  if(t.dataset.v==='tipo'||t.dataset.v==='concl'){(C.vrasc=C.vrasc||{})[t.dataset.v]=t.value;grava();return pinta()}
  if(t.dataset.foto2){var fm=C.fotos[t.dataset.foto2]=C.fotos[t.dataset.foto2]||{};fm[t.dataset.campo]=t.value;grava();return}}

 /* cópias automáticas (modulos/copia-auto.js, na página principal) */
 function copias(){try{return window.parent&&window.parent!==window&&window.parent.MedCopias}catch(e){return null}}
 function pintaCopias(p){var e=p.querySelector('[data-copias]'),M=copias(),app=(function(){try{return window.parent.__cascaAtual.app}catch(x){return ''}})();if(!e)return;
  if(!M||!app){e.innerHTML='<p class="nota">Indisponível neste modo de abertura.</p>';return}
  M.copia(app).catch(function(){}).then(function(){return M.lista(app)}).then(function(l){
   e.innerHTML=(l.length?l.map(function(c){return '<div class="lin"><small>'+esc(dataHora(new Date(c.criado).toISOString()))+' · '+esc(c.motivo)+'</small>'+esc(c.nome||'Inspeção sem identificação')+'<div class="acoes"><button type="button" class="b" data-c="restaura" data-k="'+esc(c.id)+'">Restaurar</button></div></div>'}).join(''):'<p class="nota">Nenhuma cópia ainda.</p>')
    +'<p class="nota">O app guarda sozinho uma cópia do que foi digitado a cada 2 minutos (as 8 mais recentes) e antes de Apagar tudo, Nova inspeção e Salvar. Fotos não entram na cópia. Para guardar fora do aparelho, use Exportar nas Salvas.</p>'}).catch(function(){e.innerHTML='<p class="nota">Não foi possível ler as cópias.</p>'})}

 /* ---------------- aviso ao emitir o relatório ---------------- */
 var EMITE=/^(Baixar (o )?(Word|relatório|prévia|Anexo)|Baixar relatório para Word|Imprimir( \/ PDF)?|Gerar (Word|relatório))/i,liberado=0;
 function emissao(e){var b=e.target.closest&&e.target.closest('button,a');if(!b||b.closest('#cmp-painel,#cmp-modal'))return;
  if(!(b.matches('[data-rs-word]')||EMITE.test(limpa(b.textContent))))return;
  if(Date.now()<liberado)return;var pd=pendencias().concat(consistencia());if(!pd.length)return;
  e.preventDefault();e.stopImmediatePropagation();
  var m=document.createElement('div');m.id='cmp-modal';m.innerHTML='<div class="cx" role="alertdialog"><b>Há '+pd.length+' ponto(s) a conferir antes de emitir</b><ul>'+pd.slice(0,12).map(function(x){return '<li><small>'+esc(x.tipo)+':</small> '+esc(x.txt)+'</li>'}).join('')+'</ul>'+(pd.length>12?'<p>… e mais '+(pd.length-12)+'.</p>':'')
   +'<div class="acoes"><button type="button" class="pri" data-m="ver">Ver pendências</button><button type="button" data-m="emite">Emitir mesmo assim</button><button type="button" data-m="volta">Voltar</button></div></div>';
  document.body.appendChild(m);m.addEventListener('click',function(ev){var x=ev.target.closest('[data-m]');if(!x&&ev.target!==m)return;m.remove();if(!x)return;
   if(x.dataset.m==='ver')abrePainel('pend');else if(x.dataset.m==='emite'){liberado=Date.now()+1500;b.click()}})}


 /* ---------------- botão no cabeçalho, à esquerda de “Fotos” ---------------- */
 var ICONE='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4h6v3H9z"/><path d="M9 5.5H6v15h12v-15h-3"/><path d="M9 13l2 2 4-4"/></svg><span>Campo</span><span class="n" hidden></span>';
 function poeBotao(){var t=0,iv=setInterval(function(){t++;var fo=document.getElementById('uvs-fotos')||(t>20&&document.getElementById('uvs-botao'));
   if(fo&&!document.getElementById('cmp-fab')){clearInterval(iv);var b=document.createElement('button');b.id='cmp-fab';b.type='button';b.className=fo.className;b.setAttribute('aria-label','Ferramentas de campo');b.title='Ferramentas de campo';b.innerHTML=ICONE;
    b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();abrePainel()});
    /* mesma aparência do botão vizinho: copia as regras escritas para ele, trocando o id */
    var viz=fo.id,orig=[].filter.call(document.querySelectorAll('style'),function(x){return x.textContent.indexOf('#'+viz)>=0}),st=document.createElement('style');
    st.textContent=orig.map(function(x){return x.textContent.split('#'+viz).join('#cmp-fab')}).join('\n')+'#cmp-fab{margin-right:6px}#cmp-fab .n{min-width:18px;padding:2px 5px;border-radius:9px;background:#d69e2e;color:#1a1a1a;font-size:11px;line-height:1.2}#cmp-fab .n[hidden]{display:none}';document.head.appendChild(st);
    fo.insertAdjacentElement('beforebegin',b);pintaFab();
    /* botões fixos no topo (drogaria, manipulação): alinha à esquerda do de fotos e abre espaço no título */
    var posiciona=function(){if(getComputedStyle(fo).position!=='fixed'){b.style.position='';return}var r=fo.getBoundingClientRect();if(!r.width)return;b.style.position='fixed';b.style.top=r.top+'px';b.style.right=(window.innerWidth-r.left+6)+'px';
     var q=b.getBoundingClientRect(),cy=q.top+q.height/2;[].forEach.call(document.querySelectorAll('h1,h2,.title,.app-title,header strong'),function(h){if(h.closest('#cmp-fab,#uvs-fotos,#uvs-botao'))return;/* recuo calculado sempre a partir do original: somar a cada chamada alargava o título além da tela (rolagem lateral) */if(h.dataset.cmpPr==null){h.dataset.cmpPr=h.style.paddingRight||''}h.style.paddingRight=h.dataset.cmpPr;var z=h.getBoundingClientRect();if(!z.width||z.top>cy||z.bottom<cy||z.right<=q.left)return;var pr=parseFloat(getComputedStyle(h).paddingRight)||0,alvo=Math.min(pr+(z.right-q.left)+4,z.width*0.7);if(alvo>pr)h.style.paddingRight=alvo+'px'})};
    posiciona();[300,900,2000].forEach(function(ms){setTimeout(posiciona,ms)});window.addEventListener('resize',posiciona);return}
   /* sem cabeçalho com botões: botão flutuante */
   if(t>40&&!document.getElementById('cmp-fab')){clearInterval(iv);var f=document.createElement('button');f.id='cmp-fab';f.type='button';f.className='cmp-flutua';f.setAttribute('aria-label','Ferramentas de campo');f.innerHTML='<span>Campo</span><span class="n" hidden></span>';f.addEventListener('click',function(){abrePainel()});document.body.appendChild(f);pintaFab()}},150)}

 /* ---------------- início ---------------- */
 function inicia(){if(!motor()){if((inicia.n=(inicia.n||0)+1)<40)return setTimeout(inicia,250);return}
  carrega();var st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  poeBotao();
  window.addEventListener('focusin',function(e){var t0=e.target;if(!t0||!t0.closest)return;var t=e.target;if(t.closest('#cmp-painel,#cmp-modal'))return;if(t.tagName==='TEXTAREA'||(t.tagName==='INPUT'&&/^(text|search|)$/i.test(t.type||''))){ultimo=t;ultimoDesc=descritor(t)}},true);
  window.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('button');if(!b||b.closest('#cmp-painel,#cmp-modal'))return;
   if(b.id==='uvs-fotos'&&adFotos()){e.preventDefault();e.stopImmediatePropagation();return abrePainel('fotos')}
   if(b.classList.contains('cmp-pbtn')){e.preventDefault();e.stopImmediatePropagation();return alternaPend(b)}
   emissao(e);if(!e.defaultPrevented)respondeu(b);setTimeout(function(){confereReinicio();pintaFab()},300)},true);
  var tm=0;new MutationObserver(function(ms){if(varre.ocupado)return;if(ms.every(function(m){return m.target.closest&&m.target.closest('#cmp-painel,#cmp-modal,#cmp-aviso,#cmp-fab')}))return;clearTimeout(tm);tm=setTimeout(varre,120)}).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('change',function(e){var t=e.target;if(t&&t.type==='file'&&!t.closest('#cmp-painel')){clearTimeout(tFotos);tFotos=setTimeout(function(){registraFotos(true);tFotos=setTimeout(function(){registraFotos(true)},5000)},2500)}},true);
  /* fotos já existentes quando o roteiro abre ficam sem hora (não se sabe quando foram tiradas) */
  setTimeout(function(){registraFotos(false)},3000);
  varre()}
 window.MedCampo={pendencias:pendencias,consistencia:consistencia,contagem:contagem,irregularidades:irregularidades,abre:abrePainel,estado:function(){return C}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inicia);else inicia();
})();
