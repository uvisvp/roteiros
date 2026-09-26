/* ——— Consultas ao banco (núcleo de Medicamentos) ———
   Dados que já existem na base pública (uvisvp/base-vigilancia) são puxados
   do banco, não lidos por OCR:
   - AFE/AE por CNPJ: uma linha por autorização; o tipo vem de row.tipo e o
     número de row.autorizacao (autorizacao_especial é só indicador S/N).
   - Nomes de medicamentos (comercial e princípio ativo) e de IFA, para a
     conferência de estoque (sugestão ao digitar 3 letras).
   API: MedBanco.consultaCnpj(cnpj,{onApply}), MedBanco.afeAe(cnpj),
        MedBanco.nomes(termo,tipo), MedBanco.sugerir(input,{tipo,onPick}). */
(function(){
 if(window.MedBanco)return;
 var BASE='https://uvisvp.github.io/base-vigilancia/dados/';
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function dig(v){return String(v||'').replace(/\D/g,'')}
 function norm(v){return String(v==null?'':v).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
 function compact(v){return norm(v).replace(/\s/g,'')}
 var cache={};
 function json(caminho){if(!cache[caminho])cache[caminho]=fetch(BASE+caminho,{cache:'no-store'}).then(function(r){if(r.status===404)return null;if(!r.ok)throw Error('Base indisponível ('+r.status+')');return r.json()}).catch(function(e){delete cache[caminho];throw e});return cache[caminho]}
 function isoBr(v){var m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[3]+'/'+m[2]+'/'+m[1]:String(v||'')}
 function ativa(s){return /ativ/i.test(s||'')&&!/inativ|cancel|suspen/i.test(s||'')}

 /* ---------- AFE / AE ---------- */
 function afeAe(cnpj){var n=dig(cnpj);if(n.length!==14)return Promise.reject(Error('Informe o CNPJ com 14 dígitos.'));
  return json('afe_ae/'+n.slice(0,3)+'.json').then(function(rows){rows=(Array.isArray(rows)?rows:((rows&&(rows.registros||rows.dados))||[])).filter(function(r){return dig(r.cnpj)===n});
   var lin=rows.map(function(r){return {tipo:String(r.tipo||'').toUpperCase()==='AE'?'AE':'AFE',numero:r.autorizacao||'',nova:r.autorizacao_nova||'',classe:r.classe||'',situacao:r.situacao||'',ativa:ativa(r.situacao),atividades:r.atividade_tipo||'',autorizacao:r.data_autorizacao||'',publicacao:r.data_publicacao||'',processo:r.processo||'',carga:r.data_carga_fonte||'',rt:r.responsavel_tecnico||''}});
   var ord=function(a,b){return ((/medicament/i.test(a.classe)?0:1)+(a.ativa?0:2))-((/medicament/i.test(b.classe)?0:1)+(b.ativa?0:2))};
   var r0=rows[0]||{};
   return {cnpj:n,razao:r0.razao_social||'',fantasia:r0.nome_fantasia||'',afe:lin.filter(function(x){return x.tipo==='AFE'}).sort(ord),ae:lin.filter(function(x){return x.tipo==='AE'}).sort(ord),consulta:new Date().toISOString()}})}
 function dlg(t){if(window.MedTools&&MedTools.dialog)return MedTools.dialog(t);var d=document.createElement('dialog');d.className='med-tools-dialog';d.innerHTML='<header><h2></h2><button type="button" data-close>Fechar ×</button></header><div class="med-tools-body"></div>';d.querySelector('h2').textContent=t;d.querySelector('[data-close]').onclick=function(){d.close()};document.body.appendChild(d);d.showModal();return d}
 function tabela(lista,nome){if(!lista.length)return '<p class="muted">Nenhuma '+nome+' localizada para este CNPJ.</p>';
  return '<div style="overflow:auto"><table class="simple-table" style="width:100%;font-size:.86rem"><thead><tr><th></th><th>Nº</th><th>Classe</th><th>Situação</th><th>Atividades</th><th>Publicação</th></tr></thead><tbody>'+lista.map(function(x,i){return '<tr><td><input type="radio" name="mb-'+nome+'" value="'+i+'"'+(i===0?' checked':'')+'></td><td>'+esc(x.numero)+'</td><td>'+esc(x.classe)+'</td><td'+(x.ativa?'':' style="color:#9b2c2c;font-weight:700"')+'>'+esc(x.situacao||'—')+'</td><td>'+esc(x.atividades)+'</td><td>'+esc(isoBr(x.publicacao))+'</td></tr>'}).join('')+'<tr><td><input type="radio" name="mb-'+nome+'" value="-1"></td><td colspan="5"><i>Não aplicar '+nome+'</i></td></tr></tbody></table></div>'}
 function consultaCnpj(cnpj,op){op=op||{};var d=dlg('AFE e AE — base Anvisa'),b=d.querySelector('.med-tools-body');b.innerHTML='<p>Consultando…</p>';
  afeAe(cnpj).then(function(r){if(!d.open)return;
   b.innerHTML='<p class="muted">Cópia da base pública da Anvisa (dados abertos). Ausência de resultado não comprova irregularidade; confira no portal oficial quando necessário. As autorizações da classe Medicamento e ativas aparecem primeiro.</p>'+(r.razao?'<p><b>'+esc(r.razao)+'</b>'+(r.fantasia?' · '+esc(r.fantasia):'')+'</p>':'')+
    '<h3>AFE</h3>'+tabela(r.afe,'AFE')+'<h3>AE</h3>'+tabela(r.ae,'AE')+'<div class="actions" style="margin-top:10px"><button type="button" class="primary" data-mb-aplica>Aplicar selecionadas</button> <a href="https://consultas.anvisa.gov.br/#/empresas/empresas/" target="_blank" rel="noopener">Consulta oficial ↗</a></div>';
   var ap=b.querySelector('[data-mb-aplica]');if(!r.afe.length&&!r.ae.length&&!r.razao)ap.disabled=true;
   ap.onclick=function(){var pick=function(nome,lista){var i=Number((b.querySelector('input[name="mb-'+nome+'"]:checked')||{}).value);return i>=0?lista[i]:null};
    if(op.onApply)op.onApply({razao:r.razao,fantasia:r.fantasia,afe:pick('AFE',r.afe),ae:pick('AE',r.ae),todas:r.afe.concat(r.ae),consulta:r.consulta,isoBr:isoBr});d.close()}
  }).catch(function(e){b.innerHTML='<p>'+esc(e.message||e)+'. Os campos continuam disponíveis para digitação.</p>'})}

 /* ---------- Nomes de medicamentos e IFA ---------- */
 var PASTA={medicamento:'indices/nome_medicamentos',ifa:'indices/nome_ifas'};
 function fragmento(pasta,termo){var pre=termo.slice(0,3);return json(pasta+'/'+pre+'.json').then(function pass(p,passos){passos=passos||0;
  if(p&&p.subfragmentado&&passos<32){var prof=Number(p.profundidade);if(!isFinite(prof)||termo.length<=prof)return p;var prox=p.fragmentos&&p.fragmentos[termo.charAt(prof)];if(!prox)return p;return json(pasta+'/'+prox).then(function(x){return pass(x,passos+1)})}return p})}
 function nomes(termo,tipo){var n=compact(termo);tipo=tipo||'medicamento';if(n.length<3)return Promise.resolve([]);
  var tipos=tipo==='ambos'?['medicamento','ifa']:[tipo];
  return Promise.all(tipos.map(function(t){return fragmento(PASTA[t],n).catch(function(){return t==='ifa'?fragmento(PASTA.medicamento,n).catch(function(){return null}):null}).then(function(p){var vis={};return ((p&&p.registros)||[]).filter(function(x){return x.tipo===t&&compact(x.termo).indexOf(n)===0}).filter(function(x){var k=t+'|'+(x.registro||x.processo_anvisa||'')+'|'+(x.produto||x.ifa||'');if(vis[k])return false;vis[k]=1;return true}).map(function(x){return t==='ifa'?{tipo:'ifa',nome:x.ifa||x.termo,detalhe:[x.fabricante_ifa,x.processo_anvisa&&('proc. '+x.processo_anvisa)].filter(Boolean).join(' · '),processo:x.processo_anvisa||'',listas:x.listas_portaria344||[]}:{tipo:'medicamento',nome:x.produto,ativo:x.principio_ativo||'',registro:x.registro||'',processo:x.processo||'',situacao:x.situacao||'',listas:x.listas_portaria344||[],detalhe:[x.principio_ativo,x.situacao,x.registro&&('reg. '+x.registro)].filter(Boolean).join(' · ')}})})})).then(function(a){var n2=n;return [].concat.apply([],a).sort(function(x,y){var ax=/inativ/i.test(x.situacao||'')?1:0,ay=/inativ/i.test(y.situacao||'')?1:0;if(ax!==ay)return ax-ay;var px=compact(x.nome).indexOf(n2)===0?0:1,py=compact(y.nome).indexOf(n2)===0?0:1;return px-py}).slice(0,20)})}
 var cssOk=false;function css(){if(cssOk)return;cssOk=true;var s=document.createElement('style');s.textContent='.mb-sug{position:absolute;z-index:99999;background:#fff;border:1px solid #b8c7d1;border-radius:9px;box-shadow:0 8px 24px #0002;max-height:300px;overflow:auto;min-width:260px}.mb-sug button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #eef2f5;background:#fff;padding:8px 10px;font:inherit;font-size:.88rem;cursor:pointer}.mb-sug button:hover,.mb-sug button:focus{background:#eef5fa}.mb-sug small{display:block;color:#5b6d78;font-size:.76rem}.mb-sug .mb-344{color:#8a3434;font-weight:700}';document.head.appendChild(s)}
 var caixa=null,alvo=null,tmr=null;
 function fecha(){if(caixa){caixa.remove();caixa=null}alvo=null}
 function sugerir(input,op){op=op||{};if(!input||input.dataset.mbLigado)return;input.dataset.mbLigado='1';input.setAttribute('autocomplete','off');
  input.addEventListener('input',function(){clearTimeout(tmr);if(input.dataset.mbPausa){delete input.dataset.mbPausa;return}var v=input.value;if(compact(v).length<3){fecha();return}tmr=setTimeout(function(){nomes(v,op.tipo).then(function(lst){if(document.activeElement!==input||!lst.length){if(!lst.length)fecha();return}css();fecha();alvo=input;caixa=document.createElement('div');caixa.className='mb-sug';
   caixa.innerHTML=lst.map(function(x,i){return '<button type="button" data-i="'+i+'">'+esc(x.nome)+(x.listas&&x.listas.length?' <span class="mb-344">· Portaria 344: '+esc(x.listas.map(function(l){return typeof l==='object'?(l.lista||'')+(l.substancia?' ('+l.substancia+')':''):l}).join(', '))+'</span>':'')+'<small>'+esc(x.detalhe||'')+'</small></button>'}).join('');
   var r=input.getBoundingClientRect();caixa.style.left=(r.left+window.scrollX)+'px';caixa.style.top=(r.bottom+window.scrollY+2)+'px';caixa.style.width=Math.max(r.width,280)+'px';document.body.appendChild(caixa);
   caixa.addEventListener('mousedown',function(e){e.preventDefault()});
   caixa.addEventListener('click',function(e){var b=e.target.closest('[data-i]');if(!b)return;var x=lst[+b.dataset.i];fecha();input.dataset.mbPausa='1';if(op.onPick)op.onPick(x,input);else{input.value=x.nome;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))}})}).catch(function(){fecha()})},250)});
  input.addEventListener('blur',function(){setTimeout(function(){if(alvo===input)fecha()},200)})}
 window.MedBanco={afeAe:afeAe,consultaCnpj:consultaCnpj,nomes:nomes,sugerir:sugerir};
})();
