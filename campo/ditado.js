/* Ditado por voz em todas as caixas de texto do app (build/montar.cjs coloca no fim
   de cada roteiro, da Central, do estoque e da tela inicial): textos longos e campos
   de uma linha, inclusive número, CNPJ e busca.
   - Ao entrar num campo, aparece o botão de microfone no canto; um toque começa a ouvir,
     outro toque para. Sair do campo também para.
   - O texto entra onde está o cursor, com espaço e maiúscula ajustados.
   - Comandos falados: “vírgula”, “ponto final”, “ponto e vírgula”,
     “dois pontos”, “nova linha” / “novo parágrafo”.
   - Usa o reconhecimento de voz do navegador (Chrome no Android, Safari no
     iPad/iPhone). No Chrome, o reconhecimento depende de internet; sem rede,
     o botão avisa. Navegador sem reconhecimento de voz: o botão aparece e, ao
     toque, explica como usar o microfone do teclado. */
(function(){
 'use strict';
 if(window.__medDitado)return;window.__medDitado=true;
 function SR_(){return window.SpeechRecognition||window.webkitSpeechRecognition}
 var ICONE='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5.5 10.5v1a6.5 6.5 0 0 0 13 0v-1"/><path d="M12 18v3.5"/></svg>';
 var tocando=0,bt=null,alvo=null,rec=null,ouvindo=false,bolha=null,ultimoErro='';

 var st=document.createElement('style');
 st.textContent='.med-dit{position:absolute;z-index:2147483400;width:40px;height:40px;border-radius:50%;border:1px solid #c5ced6;background:#fff;color:var(--uvis-tone,#1f4e8c);font-size:19px;line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.18);cursor:pointer;padding:0}'
  +'.med-dit svg{display:block;pointer-events:none}.med-dit.curto{width:34px;height:34px}.med-dit.curto svg{width:17px;height:17px}'
  +'.med-dit[aria-pressed="true"]{background:#c0182b;border-color:#c0182b;color:#fff;animation:medDit 1.2s infinite}'
  +'@keyframes medDit{50%{box-shadow:0 0 0 7px rgba(192,24,43,.18)}}'
  +'.med-dit-b{position:absolute;z-index:2147483400;max-width:min(80vw,420px);background:#123;color:#fff;font:13px/1.35 system-ui,sans-serif;padding:6px 10px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.25);pointer-events:none}'
  +'@media (prefers-reduced-motion:reduce){.med-dit[aria-pressed="true"]{animation:none}}';
 document.head.appendChild(st);

 /* telas que se redesenham a cada digitação (Atacadista): reencontra o mesmo campo pelos atributos */
 function chaveSel(el){var a=[].slice.call(el.attributes).filter(function(x){return /^(data-|name$|id$)/.test(x.name)&&x.name!=='data-alvo'&&x.name!=='data-med-dit-pr'});return a.length?el.tagName.toLowerCase()+a.map(function(x){return '['+x.name+'="'+String(x.value).replace(/"/g,'\\"')+'"]'}).join(''):''}
 function reancora(){if(!alvo||alvo.isConnected)return !!alvo;var k=alvo.__medChave,n=null;try{n=k&&document.querySelector(k)}catch(e){}if(!n)return false;alvo=n;alvo.__medChave=k;folga(alvo,true);try{alvo.focus({preventScroll:true});var L=alvo.value.length;alvo.setSelectionRange(L,L)}catch(e){}setTimeout(posiciona,0);return true}
 /* qualquer caixa de texto: texto longo e campos de uma linha (inclusive número, CNPJ, busca) */
 function elegivel(el){if(!el||el.readOnly||el.disabled||el.closest('.mfm,#cmp-modal'))return false;if(el.tagName==='TEXTAREA')return true;
  return el.tagName==='INPUT'&&/^(text|search|tel|email|url|number|date|time|)$/i.test(el.getAttribute('type')||'')}
 function posiciona(){if(!bt||!alvo)return;if(!alvo.isConnected&&!reancora()){esconde();return}var r=alvo.getBoundingClientRect();
  if(!r.width||!r.height){esconde();return}
  var curto=r.height<56;bt.classList.toggle('curto',curto);
  bt.style.left=(window.scrollX+r.right-(curto?38:46))+'px';bt.style.top=(window.scrollY+(curto?r.top+(r.height-34)/2:r.bottom-46))+'px';
  if(bolha){bolha.style.left=(window.scrollX+Math.max(8,r.left))+'px';bolha.style.top=(window.scrollY+r.top-bolha.offsetHeight-6)+'px'}}
 function folga(el,on){if(!el)return;if(on){if(el.dataset.medDitPr==null)el.dataset.medDitPr=el.style.paddingRight||'';el.style.paddingRight=(el.tagName==='INPUT'?'42px':'48px')}else if(el.dataset.medDitPr!=null){el.style.paddingRight=el.dataset.medDitPr;delete el.dataset.medDitPr}}
 function mostra(el){if(alvo&&alvo!==el)folga(alvo,false);alvo=el;el.__medChave=chaveSel(el);folga(el,true);if(!bt){bt=document.createElement('button');bt.type='button';bt.className='med-dit';bt.innerHTML=ICONE;
   bt.setAttribute('aria-label','Ditar por voz');bt.setAttribute('aria-pressed','false');bt.title='Ditar por voz';
   bt.addEventListener('pointerdown',function(e){e.preventDefault();tocando=Date.now()});bt.addEventListener('mousedown',function(e){e.preventDefault();tocando=Date.now()});
   var ultimoToque=0;function alterna(){var t=Date.now();if(t-ultimoToque<600)return;ultimoToque=t;tocando=t;
    if(ouvindo){para();return}
    if(alvo&&(!alvo.isConnected||document.activeElement!==alvo)){if(!alvo.isConnected)reancora();else try{alvo.focus({preventScroll:true})}catch(e){}}comeca()}
   bt.addEventListener('pointerup',function(e){e.preventDefault();alterna()});bt.addEventListener('click',alterna)}
  if(!bt.isConnected)document.body.appendChild(bt);posiciona()}
 function esconde(){para();if(bt)bt.remove();folga(alvo,false);alvo=null}
 function aviso(t){if(!bolha){bolha=document.createElement('div');bolha.className='med-dit-b';bolha.setAttribute('role','status')}
  if(!t){bolha.remove();return}bolha.textContent=t;if(!bolha.isConnected)document.body.appendChild(bolha);posiciona()}

 function pontua(t){return t.replace(/\s*\bponto e v[íi]rgula\b\s*/gi,'; ').replace(/\s*\bv[íi]rgula\b\s*/gi,', ').replace(/\s*\bponto final\b\s*/gi,'. ').replace(/\s*\bdois pontos\b\s*/gi,': ')
  .replace(/\s*\bnov[ao] (linha|par[áa]grafo)\b\s*/gi,'\n').replace(/([.:;!?]\s+|\n)([a-zà-ú])/g,function(m,a,b){return a+b.toUpperCase()}).replace(/ +$/,'')}
 /* ---------- números falados ---------- */
 /* tipo do campo: quant (quantidade, temperatura…), id (CNPJ, registro, processo, telefone…),
    hora, data ou texto (sem conversão) */
 function rotulo(el){var l=el.closest('label'),t=l?l.textContent:'';if(!t&&el.id){try{var x=document.querySelector('label[for="'+el.id+'"]');if(x)t=x.textContent}catch(e){}}
  if(!t){var pv=el.previousElementSibling;if(pv&&pv.textContent.length<120)t=pv.textContent}
  return [t,el.name,el.id,el.placeholder,el.getAttribute('aria-label'),el.getAttribute('data-path'),el.getAttribute('data-field')].join(' ')}
 function tipoCampo(el){var ty=(el.getAttribute('type')||'').toLowerCase(),r=el.tagName==='TEXTAREA'?'':rotulo(el);
  if(ty==='date')return 'data';if(ty==='time')return 'hora';
  if(el.tagName==='TEXTAREA')return 'texto';
  if(/hor[áa]rio|\bhora\b|\bhoras\b/i.test(r))return 'hora';
  if(/\bdata\b|validade|vencimento|emiss[ãa]o|nascimento|fabrica[çc][ãa]o|admiss[ãa]o/i.test(r))return 'data';
  if(ty==='number'||/quantidade|\bqtd|\bqtde|n[úu]mero de (funcion|empregad|colaborad|pessoas|leitos|farmac|atendentes|balconistas|t[ée]cnicos|salas|unidades|caixas|geladeiras|lotes)|\btotal\b|funcion[áa]rios|idade|temperatura|umidade|capacidade|\bpeso\b|volume|metragem|[áa]rea \(m|m²|m2\b/i.test(r))return 'quant';
  if(/cnpj|cpf|cnes|\bcep\b|telefone|celular|\bfone|registro|processo|autoriza|\bafe\b|\bae\b|\bcrf\b|\blote\b|n[º°]|\bnúmero\b|\bnumero\b|licen[çc]a|cevs|danfe|nota fiscal|\bnf\b|placa/i.test(r))return 'id';
  return el.inputMode==='numeric'||el.inputMode==='decimal'||ty==='tel'?'id':'texto'}
 var UN={zero:0,um:1,uma:1,dois:2,duas:2,'três':3,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12,treze:13,quatorze:14,catorze:14,quinze:15,dezesseis:16,dezasseis:16,dezessete:17,dezoito:18,dezenove:19,vinte:20,trinta:30,quarenta:40,cinquenta:50,'cinqüenta':50,sessenta:60,setenta:70,oitenta:80,noventa:90,cem:100,cento:100,duzentos:200,duzentas:200,trezentos:300,trezentas:300,quatrocentos:400,quatrocentas:400,quinhentos:500,quinhentas:500,seiscentos:600,seiscentas:600,setecentos:700,setecentas:700,oitocentos:800,oitocentas:800,novecentos:900,novecentas:900};
 function mag(v){return v>=100?3:v>=10?2:1}
 /* troca sequências por extenso (“cento e vinte e cinco”, “dois mil e vinte e seis”) por algarismos */
 function numeros(t){var tk=String(t).match(/[A-Za-zÀ-ÿ]+|\d+|[^A-Za-zÀ-ÿ\d]+/g)||[],out=[],i=0;
  function num(w){if(/^\d+$/.test(w))return {v:+w,dig:true};w=w.toLowerCase();if(w==='mil')return {mil:true};var v=UN[w];return v==null?null:{v:v}}
  while(i<tk.length){var a=num(tk[i]);if(!a||(a.dig&&!(tk[i+2]&&/^mil$/i.test(tk[i+2])))){out.push(tk[i]);i++;continue}
   var total=0,grupo=0,ultimaMag=9,ultMil=false,fim=i,j=i;
   (function soma(x){if(x.mil){total+=(grupo||1)*1000;grupo=0;ultMil=true;ultimaMag=4}else{grupo+=x.v;ultimaMag=x.dig?4:mag(x.v);ultMil=false}})(a);
   while(true){var sep=tk[j+1],k=j+2,comE=false;if(sep==null||!/^\s+$/.test(sep))break;
    if(tk[k]&&/^e$/i.test(tk[k])&&tk[k+1]&&/^\s+$/.test(tk[k+1])){comE=true;k+=2}
    var b=tk[k]&&num(tk[k]);if(!b)break;
    var aceita=b.mil?!ultMil:((b.dig?(comE||ultMil):true)&&mag(b.v)<ultimaMag);if(!aceita)break;
    if(b.mil){total+=(grupo||1)*1000;grupo=0;ultMil=true;ultimaMag=4}else{grupo+=b.v;ultimaMag=b.dig?4:mag(b.v);ultMil=false}
    j=k;fim=k}
   out.push(String(total+grupo));i=fim+1}
  return out.join('')}
 var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
 function mes(w){w=String(w).toLowerCase().replace('marco','março');return MESES.indexOf(w)+1}
 var p2=function(n){n=+n;return (n<10?'0':'')+n};
 function lerData(t){var h=new Date(),x=t.toLowerCase().replace(/\bprimeiro\b/g,'1').replace(/\bdia\s+/g,'');
  if(/\bhoje\b/.test(x))return {d:h.getDate(),m:h.getMonth()+1,y:h.getFullYear()};
  if(/\bontem\b/.test(x)){h.setDate(h.getDate()-1);return {d:h.getDate(),m:h.getMonth()+1,y:h.getFullYear()}}
  var M='(janeiro|fevereiro|mar[çc]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)',r;
  if(r=new RegExp('(\\d{1,2})\\s*(?:de\\s+)?'+M+'(?:\\s*(?:de|/)?\\s*(\\d{2,4}))?').exec(x))return {d:+r[1],m:mes(r[2]),y:r[3]?ano(r[3]):h.getFullYear()};
  if(r=/(\d{1,2})\s*[\/.\- ]\s*(\d{1,2})\s*[\/.\- ]\s*(\d{2,4})/.exec(x))return {d:+r[1],m:+r[2],y:ano(r[3])};
  if(r=new RegExp(M+'\\s*(?:de|/)?\\s*(\\d{4})').exec(x))return {m:mes(r[1]),y:+r[2]};
  if(r=/^\s*(\d{1,2})\s*[\/ ]\s*(\d{4})\s*$/.exec(x))return {m:+r[1],y:+r[2]};
  return null}
 function ano(y){y=+y;return y<100?2000+y:y}
 function horas(x){x=x.replace(/meio[\s-]dia/gi,'12:00').replace(/meia[\s-]noite/gi,'00:00')
   .replace(/(\d{1,2})\s*(?:h|horas?)?\s+e\s+meia\b/gi,'$1:30')
   .replace(/(\d{1,2})\s*(?:h|horas?)\s*(?:e\s*)?(\d{1,2})\s*(?:min(?:utos)?)?\b/gi,'$1:$2')
   .replace(/(\d{1,2})\s+e\s+(\d{2})\b/g,'$1:$2')
   .replace(/(\d{1,2})\s*(?:h|horas?)\b/gi,'$1:00')
   .replace(/(^|\s)(das?|às|as|até|ate|ao|a partir das?)\s+(\d{1,2})(?![\d:])/gi,function(m,i,a,h){return +h<=24?i+a+' '+h+':00':m});
  return x.replace(/\b(\d{1,2}):(\d{1,2})\b/g,function(m,h,mi){return +h<=24&&+mi<60?p2(h)+':'+p2(mi):m})}
 /* devolve {valor} para trocar o conteúdo do campo, ou {txt} para inserir no cursor */
 function converte(txt,tipo,el){var t=numeros(txt.trim()),ty=(el.getAttribute('type')||'').toLowerCase();
  if(tipo==='quant'){t=t.replace(/(\d)\s*(?:v[íi]rgula|ponto)\s*(\d)/gi,'$1,$2');var m=/-?\d+(?:,\d+)?/.exec(t);if(!m)return {txt:t};return {valor:ty==='number'?m[0].replace(',','.'):m[0]}}
  if(tipo==='data'){var d=lerData(t);if(!d)return ty==='date'?{valor:null}:{txt:t};
   if(ty==='date')return {valor:d.y+'-'+p2(d.m)+'-'+p2(d.d||1)};return {valor:(d.d?p2(d.d)+'/':'')+p2(d.m)+'/'+d.y}}
  if(tipo==='hora'){var h=horas(t);if(ty==='time'){var mm=/(\d{2}):(\d{2})/.exec(h)||/^\s*(\d{1,2})\s*$/.exec(h);return {valor:mm?(mm[2]?mm[1]+':'+mm[2]:p2(mm[1])+':00'):null}}return {txt:h}}
  if(tipo==='id')return {txt:t.replace(/\s*\bbarra\b\s*/gi,'/').replace(/\s*\b(?:traço|tracinho|hífen|hifen)\b\s*/gi,'-').replace(/(\d)\s+(?=\d)/g,'$1')};
  return null}

 function insere(txt){reancora();var el=alvo;if(!el||!txt)return;
  var tipo=tipoCampo(el);if(tipo!=='texto'){var cv=converte(txt,tipo,el);if(cv){if('valor' in cv){if(cv.valor==null){aviso('Não entendi a '+(tipo==='data'?'data':'hora')+'. Ex.: “primeiro de outubro de 2026”, “oito e meia”.');return}
     el.value=cv.valor;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(reancora,0);return}
    txt=cv.txt;return insereTexto(el,txt,true)}}
  return insereTexto(el,txt,false)}
 function insereTexto(el,txt,cru){if(!txt)return;var s,e;try{s=el.selectionStart;e=el.selectionEnd}catch(x){}if(s==null)s=el.value.length;if(e==null)e=s;var antes=el.value.slice(0,s);
  txt=cru?txt.trim():pontua(txt.trim());if(el.tagName==='INPUT')txt=txt.replace(/\s*\n\s*/g,' ');if(el.type==='number')txt=txt.replace(/[^\d,.-]/g,'').replace(',','.');if(!txt)return;
  /* campos sem seleção de texto (número, e-mail): acrescenta ao fim */
  var semSel=false;try{if(el.selectionStart==null)semSel=true}catch(x){semSel=true}
  if(semSel){el.value=el.type==='number'?txt:(el.value?el.value.replace(/\s+$/,'')+' ':'')+txt;el.dispatchEvent(new Event('input',{bubbles:true}));setTimeout(reancora,0);return}
  if(!cru&&(!antes||/[.!?]\s*$|\n\s*$/.test(antes)))txt=txt.charAt(0).toUpperCase()+txt.slice(1);
  if(antes&&!/[\s\n]$/.test(antes)&&!/^[,.;:]/.test(txt))txt=' '+txt;
  el.setRangeText(txt,s,e,'end');el.dispatchEvent(new Event('input',{bubbles:true}));setTimeout(reancora,0)}

 /* Liga e desliga. Cada sessão tem dono (rec): eventos de uma sessão antiga são ignorados.
    No iPhone/iPad o reconhecimento encerra sozinho após cada frase (ou sem ouvir nada);
    por isso o reinício automático só acontece se a sessão durou ao menos 1,5 s, até 25
    vezes e por no máximo 3 minutos — sem isso, entrava em laço e travava a tela. */
 var IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),inicio=0,reinicios=0,sessao=0,vigia=0;
 function abre(){var SR=SR_(),r=new SR();r.lang='pt-BR';r.continuous=!IOS;r.interimResults=true;sessao=Date.now();
  r.onresult=function(ev){if(r!==rec)return;var parcial='';for(var i=ev.resultIndex;i<ev.results.length;i++){var x=ev.results[i];if(x.isFinal)insere(x[0].transcript);else parcial+=x[0].transcript}if(ouvindo)aviso(parcial?'… '+parcial:'Ouvindo…')};
  r.onerror=function(ev){if(r!==rec)return;ultimoErro=ev.error;if(ev.error==='not-allowed'||ev.error==='service-not-allowed'){aviso('Microfone bloqueado. Libere o microfone para este site nas configurações do aparelho.');para(true)}
   else if(ev.error==='network'){aviso('O ditado precisa de internet neste aparelho.');para(true)}
   else if(ev.error==='audio-capture'){aviso('Microfone indisponível (em uso por outro app?).');para(true)}};
  r.onend=function(){if(r!==rec)return;
   var durou=Date.now()-sessao;
   if(ouvindo&&alvo&&durou>=1500&&reinicios<25&&Date.now()-inicio<180000){reinicios++;try{rec=abre();rec.start();return}catch(e){}}
   if(ouvindo&&durou<1500&&ultimoErro==='no-speech')aviso('Não ouvi nada. Toque no microfone e fale.');
   encerra()};
  return r}
 function comeca(){if(!alvo)return;ultimoErro='';
  if(!SR_()){aviso('Este navegador não oferece ditado dentro da página. Use o microfone do próprio teclado (ícone de microfone no teclado do celular ou tablet).');setTimeout(function(){aviso('')},6000);return}
  if(navigator.onLine===false){aviso('O ditado precisa de internet neste aparelho.');setTimeout(function(){aviso('')},3500);return}
  inicio=Date.now();reinicios=0;
  try{rec=abre();rec.start();ouvindo=true;marca();aviso('Ouvindo… toque no microfone para parar');}catch(e){rec=null;ouvindo=false;marca();return}
  clearInterval(vigia);vigia=setInterval(function(){if(!ouvindo){clearInterval(vigia);return}
   if(document.hidden||Date.now()-inicio>180000){para();return}
   if(!alvo||(!alvo.isConnected&&!reancora())){esconde();return}
   var r=alvo.getBoundingClientRect();if(!r.width||!r.height){esconde();return}posiciona()},700)}
 /* encerra a sessão: o botão volta ao normal na hora, mesmo que o aparelho demore a liberar o microfone */
 function encerra(){var r=rec;rec=null;ouvindo=false;clearInterval(vigia);marca();
  if(!/not-allowed|network|audio-capture/.test(ultimoErro)&&!/Não ouvi/.test(bolha&&bolha.textContent||''))aviso('');else setTimeout(function(){aviso('')},4000);
  if(alvo)try{alvo.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}
  return r}
 function para(mantemAviso){if(!rec&&!ouvindo){marca();return}var r=rec;ouvindo=false;marca();if(!mantemAviso)aviso('');
  if(r){try{r.stop()}catch(e){}setTimeout(function(){if(rec===r){try{r.abort()}catch(e){}encerra()}},1200)}else encerra()}
 function marca(){if(bt)bt.setAttribute('aria-pressed',String(ouvindo))}

 document.addEventListener('focusin',function(e){if(elegivel(e.target)){if(alvo!==e.target)para();mostra(e.target)}});
 document.addEventListener('focusout',function(e){if(e.target===alvo)setTimeout(function(){if(!alvo)return;if(Date.now()-tocando<1500)return;if(!alvo.isConnected&&reancora())return;if(document.activeElement!==alvo&&document.activeElement!==bt)esconde()},150)});
 window.addEventListener('scroll',posiciona,true);window.addEventListener('resize',posiciona);
 document.addEventListener('input',function(e){if(e.target===alvo)posiciona()});

 /* para os testes (build/testar-ditado.cjs) */
 window.__medDitadoTeste={numeros:numeros,converte:converte,tipoCampo:tipoCampo,lerData:lerData,horas:horas};
})();
