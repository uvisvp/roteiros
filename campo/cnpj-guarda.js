/* Validação de CNPJ nos formulários de todos os roteiros (build/montar.cjs coloca
   no fim de cada módulo). Auditoria de 30/09/2026, F-01 e F-02: Drogaria,
   Manipulação e Atacadista aceitavam letras no CNPJ, e nenhum roteiro reprovava
   dígito verificador errado.
   - Campo de CNPJ: rótulo ou nome interno com “CNPJ”; rótulo misto (CPF, razão
     social, nome, “/”) fica de fora para não travar texto livre.
   - Ao digitar: aplica a máscara 00.000.000/0000-00 (até 14 caracteres) e tira o que não é
     letra nem número.
   - Ao sair do campo: tamanho e dígito verificador; aviso logo abaixo do campo.
   CNPJ alfanumérico (auditoria de 14/11/2026, E03): desde julho de 2026 a Receita Federal atribui
   CNPJ com letras maiúsculas nas 12 primeiras posições (raiz e ordem); os dois dígitos
   verificadores continuam numéricos e o cálculo é o mesmo módulo 11, com cada caractere valendo
   o código ASCII menos 48 (0 a 9 valem 0 a 9; A = 17 … Z = 42). Os CNPJ numéricos não mudam.
   Antes, a letra era apagada em silêncio e o identificador alterado ia para o relatório; agora
   a letra fica (em maiúscula), o campo abre o teclado de texto e o inválido recebe aviso.
   Fonte: Receita Federal/Serpro, “Cálculo dos dígitos verificadores de CNPJ alfanumérico”.
   - Na emissão: o CNPJ inválido entra na lista de pendências do painel Campo
     (window.__medCnpjInvalidos), que pede confirmação — a equipe pode emitir
     assim mesmo, se houver motivo. */
(function(){
 'use strict';
 if(window.__medCnpjGuarda)return;window.__medCnpjGuarda=true;
 var invalidos={};
 /* identificador sem pontuação: dígitos e letras maiúsculas */
 function dig(v){return String(v||'').toUpperCase().replace(/[^0-9A-Z]/g,'')}
 function dvOk(d){if(!/^[0-9A-Z]{12}\d{2}$/.test(d)||/^(\d)\1+$/.test(d))return false;var c=function(n){var s=0,p=n-7;for(var i=0;i<n;i++){s+=(d.charCodeAt(i)-48)*p--;if(p<2)p=9}var r=s%11;return r<2?0:11-r};return c(12)===+d[12]&&c(13)===+d[13]}
 function mascara(d){d=d.slice(0,14);return d.slice(0,2)+(d.length>2?'.'+d.slice(2,5):'')+(d.length>5?'.'+d.slice(5,8):'')+(d.length>8?'/'+d.slice(8,12):'')+(d.length>12?'-'+d.slice(12):'')}
 /* teclado de texto no campo de CNPJ (o numérico não deixa digitar as letras) */
 function teclado(el){if(el.getAttribute('inputmode')==='numeric'||el.getAttribute('type')==='tel'||el.getAttribute('type')==='number'){if(el.getAttribute('type')==='tel'||el.getAttribute('type')==='number')el.setAttribute('type','text');el.setAttribute('inputmode','text')}
  if(el.getAttribute('autocapitalize')!=='characters')el.setAttribute('autocapitalize','characters');
  var mx=+el.getAttribute('maxlength');if(mx&&mx<18)el.setAttribute('maxlength','18')}
 function semAviso(n){var c=n.cloneNode(true);[].forEach.call(c.querySelectorAll('.med-cnpj-aviso'),function(x){x.remove()});return c.textContent||''}
 function rotulo(el){var l=el.closest('label'),t=l?semAviso(l):'';if(!t&&el.id){var x=document.querySelector('label[for="'+el.id+'"]');if(x)t=semAviso(x)}
  if(!t){var p=el.previousElementSibling;while(p&&!t){if(!p.classList.contains('med-cnpj-aviso'))t=p.textContent||'';p=p.previousElementSibling}}
  return String(t||el.placeholder||el.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim()}
 function chave(el){return [el.name,el.id,el.getAttribute('data-path'),el.getAttribute('data-rs-meta'),el.getAttribute('data-field'),el.getAttribute('data-key')].filter(Boolean).join(' ')}
 function ehCnpj(el){if(!el||el.tagName!=='INPUT'||el.readOnly||el.disabled)return false;
  if(!/^(text|search|tel|number|)$/i.test(el.getAttribute('type')||''))return false;
  if(el.closest('#cmp-painel,#cmp-modal,.rs-eq'))return false;
  var r=rotulo(el);if(/CPF|raz[aã]o|nome|\//i.test(r))return false;
  return /\bCNPJ\b/i.test(r)||/cnpj/i.test(chave(el))}
 function id(el){return chave(el)||rotulo(el)}
 function aviso(el,msg){var n=el.nextElementSibling;if(!(n&&n.classList.contains('med-cnpj-aviso'))){if(!msg)return;n=document.createElement('small');n.className='med-cnpj-aviso';n.setAttribute('role','alert');el.insertAdjacentElement('afterend',n)}
  if(msg){n.textContent=msg;el.setAttribute('aria-invalid','true')}else{n.remove();el.removeAttribute('aria-invalid')}}
 function confere(el){var d=dig(el.value),k=id(el),r=rotulo(el)||'CNPJ';
  if(!d){delete invalidos[k];aviso(el,'');return}
  var erro=d.length!==14?'CNPJ incompleto: são 14 caracteres (há '+d.length+').':!/^\d{2}$/.test(d.slice(12))?'CNPJ inválido: os dois últimos caracteres (dígitos verificadores) são números.':!dvOk(d)?'CNPJ inválido: o dígito verificador não confere. Confira o documento antes de emitir o relatório.':'';
  if(erro){invalidos[k]=r.replace(/\s*\*$/,'')+': '+el.value;aviso(el,erro)}else{delete invalidos[k];aviso(el,'')}}
 window.__medCnpjInvalidos=function(){return Object.keys(invalidos).map(function(k){return invalidos[k]})};
 window.addEventListener('input',function(e){var el=e.target;if(!ehCnpj(el))return;
  var v=el.value,d=dig(v);
  /* caractere fora do CNPJ ou letra minúscula: regrava com a máscara, sem perder letra nem número */
  if(/[^0-9A-Z.\/\-\s]/.test(v))el.value=d.length<=14?mascara(d):v.toUpperCase().replace(/[^0-9A-Z.\/\-\s]/g,'');
  else if(d.length===14&&v!==mascara(d))el.value=mascara(d);
  if(el.nextElementSibling&&el.nextElementSibling.classList.contains('med-cnpj-aviso')&&dig(el.value).length===14)confere(el)},true);
 window.addEventListener('focusin',function(e){if(ehCnpj(e.target))teclado(e.target)},true);
 window.addEventListener('focusout',function(e){if(ehCnpj(e.target))confere(e.target)},true);
 window.addEventListener('change',function(e){if(ehCnpj(e.target))confere(e.target)},true);
 /* telas redesenhadas ou campos preenchidos por OCR/consulta: confere o que estiver visível */
 var t=0;new MutationObserver(function(ms){if(ms.every(function(m){return m.target.classList&&m.target.classList.contains('med-cnpj-aviso')}))return;clearTimeout(t);t=setTimeout(function(){
  [].forEach.call(document.querySelectorAll('input'),function(el){if(el.value){if(ehCnpj(el)){teclado(el);confere(el)}}else if(el.getAttribute('inputmode')==='numeric'&&ehCnpj(el))teclado(el)})},400)}).observe(document.body,{childList:true,subtree:true});
 var st=document.createElement('style');st.textContent='.med-cnpj-aviso{display:block;margin:4px 0 0;color:#9b1c2c;font-size:.8rem;font-weight:600;line-height:1.35}input[aria-invalid="true"]{border-color:#c0394b!important;box-shadow:0 0 0 2px rgba(192,57,75,.15)}';
 document.head.appendChild(st);
})();
