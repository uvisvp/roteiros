/* Busca do estabelecimento na base da Anvisa pelo CNPJ (pedido de 19/10/2026), nos módulos
   próprios que não a tinham (Odontologia, Serviços assistenciais, Produtos, Serviços de alimentação). Os roteiros do
   motor roteiro-simples têm a busca no próprio motor; Drogaria, Manipulação e Atacadista
   têm a sua. A base é a de AFE/AE (a mesma da Central de Consultas): só traz quem tem
   Autorização de Funcionamento na Anvisa; sem AFE/AE, entram os dados públicos do CNPJ na Receita
   Federal (BrasilAPI: razão social, fantasia, endereço, sócio administrador e CNAE).
   - Ao lado do campo de CNPJ (rótulo “CNPJ” ou “CNPJ ou CPF”), um botão “Buscar na Anvisa”.
   - Preenche só os campos vazios da mesma tela, achados pelo rótulo: razão social /
     estabelecimento, nome fantasia, endereço, responsável legal e responsável técnico.
   - Dispara input/change, para o módulo gravar como se fosse digitado. */
(function(){
 'use strict';
 if(window.__uvsCnpjAnvisa)return;window.__uvsCnpjAnvisa=true;
 var PROPRIOS=['drogaria','farmacia-manipulacao','distribuidoras-transportadoras','central-consultas','estoque-medicamentos','estoque-produtos','alimentos-integrado','analise-produtos'];
 var BASES=['https://uvisvp.github.io/base-vigilancia/dados/','https://raw.githubusercontent.com/uvisvp/base-vigilancia/main/dados/'];
 function ativo(){return !window.ROTEIRO&&PROPRIOS.indexOf(window.__uvsApp)<0}
 function dig(v){return String(v||'').replace(/\D/g,'')}
 function rot(el){var l=el.closest('label'),t='';if(l){var c=l.cloneNode(true);[].forEach.call(c.querySelectorAll('input,select,textarea,button,small'),function(x){x.remove()});t=c.textContent}
  return String(t||el.placeholder||el.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim()}
 function ehCnpj(el){return el&&el.tagName==='INPUT'&&!el.readOnly&&!el.disabled&&/^(text|search|tel|)$/i.test(el.getAttribute('type')||'')&&!el.closest('#cmp-painel,#cmp-modal,.rs-eq')&&/^CNPJ( ou CPF)?\b/i.test(rot(el))}
 function jget(path){var i=0;function tenta(){var u=BASES[i++]+path;return fetch(u,{cache:'no-store'}).then(function(r){if(r.status===404)return null;if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).catch(function(e){if(i<BASES.length)return tenta();throw e})}return tenta()}
 /* campos da tela pelo rótulo */
 var ALVOS=[['razao',/^(raz[aã]o social|estabelecimento|empresa)\b/i],['fantasia',/fantasia/i],['endereco',/^endere[cç]o/i],['rl',/respons[aá]vel legal/i],['rt',/respons[aá]vel t[eé]cnico/i]];
 function escopo(el){var e=el.closest('fieldset,form,section,.pu-bloco,.meta-grid,.card');return e&&e.querySelectorAll('input,textarea').length>1?e:document}
 function poe(inp,v){if(!inp||!v||String(inp.value||'').trim())return 0;inp.value=v;inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}));return 1}
 function msg(btn,t,tipo){var m=btn.nextElementSibling;if(!(m&&m.classList.contains('uvs-cnpj-msg'))){m=document.createElement('small');m.className='uvs-cnpj-msg';m.setAttribute('role','status');btn.insertAdjacentElement('afterend',m)}m.textContent=t;m.dataset.tipo=tipo||''}
 function busca(btn,el){var c=dig(el.value);if(c.length!==14){msg(btn,'Digite o CNPJ completo (14 dígitos) antes de buscar.','aviso');return}
  msg(btn,'Consultando a base da Anvisa (AFE/AE)…');
  jget('afe_ae/'+c.slice(0,3)+'.json').then(function(d){var a=(Array.isArray(d)?d:(d&&(d.registros||d.dados))||[]).filter(function(x){return dig(x.cnpj)===c});
   if(!a.length){viaReceita(btn,el,c);return}
   a.sort(function(x,y){return (/^s/i.test(String(y.ativo||''))-/^s/i.test(String(x.ativo||'')))});
   var x=a[0],end=[x.endereco,x.bairro,x.municipio&&(x.municipio+(x.uf?'/'+x.uf:'')),x.cep&&'CEP '+String(x.cep).replace(/^(\d{5})(\d{3})$/,'$1-$2')].filter(Boolean).join(', ');
   var n=enche(el,{razao:x.razao_social,fantasia:x.nome_fantasia,endereco:end,rl:x.responsavel_legal,rt:x.responsavel_tecnico});
   var aut=a.filter(function(y){return y.autorizacao}).map(function(y){return (/^s/i.test(String(y.autorizacao_especial||''))?'AE ':'AFE ')+y.autorizacao}).filter(function(v,i,l){return l.indexOf(v)===i}).join('; ');
   msg(btn,'Base da Anvisa: '+(x.razao_social||'estabelecimento')+(aut?' — '+aut:'')+'. '+(n?n+' campo(s) preenchido(s); confira.':'Os campos já estavam preenchidos; nada foi alterado.'),n?'ok':'')},
  function(){msg(btn,'Não foi possível consultar a base agora (sem internet?). Preencha os dados à mão.','aviso')})}
 /* sem AFE/AE: dados públicos do CNPJ na Receita Federal (BrasilAPI) */
 function receita(c){return fetch('https://brasilapi.com.br/api/cnpj/v1/'+c,{cache:'no-store'}).then(function(r){if(r.status===404)return null;if(!r.ok)throw Error('HTTP '+r.status);return r.json()}).then(function(x){if(!x||!x.razao_social)return null;
   var log=[x.descricao_tipo_de_logradouro,x.logradouro].filter(Boolean).join(' '),end=[[log,x.numero].filter(Boolean).join(', '),x.complemento,x.bairro,x.municipio&&(x.municipio+(x.uf?'/'+x.uf:'')),x.cep&&'CEP '+String(x.cep).replace(/\D/g,'').replace(/^(\d{5})(\d{3})$/,'$1-$2')].filter(Boolean).join(', ');
   var adm=(x.qsa||[]).filter(function(q){return /administrador/i.test(q.qualificacao_socio||'')})[0]||(x.qsa||[])[0];
   return {razao:x.razao_social,fantasia:x.nome_fantasia,endereco:end,rl:adm&&adm.nome_socio,situacao:x.descricao_situacao_cadastral,cnae:x.cnae_fiscal?String(x.cnae_fiscal).replace(/^(\d{4})(\d)(\d{2})$/,'$1-$2/$3')+(x.cnae_fiscal_descricao?' — '+x.cnae_fiscal_descricao:''):''}})}
 function enche(el,val){var sc=escopo(el),n=0;[].forEach.call(sc.querySelectorAll('input,textarea'),function(inp){if(inp===el||!inp.offsetParent||/^(date|number|checkbox|radio|file)$/i.test(inp.type))return;var r=rot(inp);
   for(var k=0;k<ALVOS.length;k++)if(ALVOS[k][1].test(r)){n+=poe(inp,val[ALVOS[k][0]]);break}});return n}
 function viaReceita(btn,el,c){msg(btn,'Sem AFE/AE na Anvisa. Consultando os dados públicos do CNPJ na Receita Federal…');
  receita(c).then(function(x){if(!x){msg(btn,'CNPJ sem AFE/AE na Anvisa e não encontrado na Receita Federal. Confira o número; os dados podem ser digitados.','aviso');return}
   var n=enche(el,x);msg(btn,'Sem AFE/AE na Anvisa. Receita Federal (dados públicos do CNPJ, via BrasilAPI): '+x.razao+(x.situacao?' — situação '+String(x.situacao).toLowerCase():'')+(x.cnae?'; atividade principal '+x.cnae:'')+'. '+(n?n+' campo(s) preenchido(s); confira.':'Os campos já estavam preenchidos; nada foi alterado.'),n?'ok':'')},
  function(){msg(btn,'CNPJ sem AFE/AE na Anvisa, e a Receita Federal não respondeu agora (sem internet?). Os dados podem ser digitados.','aviso')})}
 function marca(){if(!ativo())return;[].forEach.call(document.querySelectorAll('input'),function(el){if(!ehCnpj(el)||el.dataset.uvsCnpjBtn)return;
  var sc=escopo(el);if([].some.call(sc.querySelectorAll('button'),function(b){return /(Buscar|Consultar).*CNPJ|CNPJ.*(Anvisa)/i.test(b.textContent)&&!b.classList.contains('uvs-cnpj-btn')}))return;
  el.dataset.uvsCnpjBtn='1';var b=document.createElement('button');b.type='button';b.className='uvs-cnpj-btn';b.textContent='Buscar dados na Anvisa pelo CNPJ';
  b.addEventListener('click',function(){busca(b,el)});var alvo=el.closest('label')||el;
  var av=alvo.nextElementSibling&&alvo.nextElementSibling.classList.contains('med-cnpj-aviso')?alvo.nextElementSibling:alvo;av.insertAdjacentElement('afterend',b)})}
 var t=0;new MutationObserver(function(){clearTimeout(t);t=setTimeout(marca,300)}).observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState!=='loading')marca();else document.addEventListener('DOMContentLoaded',marca);
 var st=document.createElement('style');st.textContent='.uvs-cnpj-btn{display:inline-flex;align-items:center;min-height:40px;margin:6px 0 0;padding:6px 14px;border:1px solid var(--accent,#5B3CC4);border-radius:10px;background:var(--accent,#5B3CC4);color:#fff;font:inherit;font-weight:600;cursor:pointer}.uvs-cnpj-msg{display:block;margin:4px 0 6px;font-size:.85rem;line-height:1.35}.uvs-cnpj-msg[data-tipo=aviso]{color:#8a5a00}.uvs-cnpj-msg[data-tipo=ok]{color:#1d6b3a}';
 (document.head||document.documentElement).appendChild(st);
})();
