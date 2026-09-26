/* ——— Alimentos: rotulagem mais direta ———
   1. Leitura por foto → formulário: o leitor do rótulo ganha “Usar no formulário”,
      que leva o texto reconhecido, a lista de ingredientes, lote, validade, CNPJ,
      registro e os valores da porção (açúcares adicionados, gordura saturada,
      sódio) para os campos da análise. Só preenche campos vazios; a equipe confere.
   2. Busca inteligente: CNPJ, GTIN, processo e registro são reconhecidos e a
      consulta já é executada.
   3. Organização: subtítulos sem numeração antiga conflitante, identificação em
      duas colunas, fontes legais recolhidas, etapa de suplementos só quando o
      tipo de análise é suplemento. */
(function(){
 if(window.__rotulagemMelhorias)return;window.__rotulagemMelhorias=true;
 var $=function(s,r){return (r||document).querySelector(s)};
 function dig(s){return String(s||'').replace(/\D/g,'')}
 function status(msg){var s=$('#food-record-status');if(s)s.textContent=msg}
 function setCampo(elm,val,forcar){if(!elm||val==null||val==='')return false;if(elm.value&&!forcar)return false;elm.value=val;elm.dispatchEvent(new Event('input',{bubbles:true}));elm.dispatchEvent(new Event('change',{bubbles:true}));return true}
 function rec(id){return $('[data-food-record="'+id+'"]')}

 /* ---------- 1. extração do texto reconhecido ---------- */
 function extrai(t){var r={},m;var txt=String(t||'').replace(/\r/g,'');var uma=txt.replace(/\s+/g,' ');
  m=uma.match(/ingredientes?\s*:\s*(.+?)(?:\.\s*(?=al[ée]rg|cont[ée]m|n[ãa]o\s+cont[ée]m|pode\s+conter|informa[çc][ãa]o\s+nutricional|conservar|validade|lote|fabricado|$)|\s(?=al[ée]rgicos?\s*:)|\s(?=cont[ée]m\s+gl[úu]ten|n[ãa]o\s+cont[ée]m\s+gl[úu]ten)|$)/i);
  if(m)r.ingredientes=m[1].trim().replace(/\s*\.$/,'').slice(0,1500);
  m=uma.match(/\blote\s*[:.\-]?\s*([A-Z0-9][A-Z0-9\-\/.]{1,20})/i);if(m)r.lote=m[1].replace(/[.\-\/]$/,'');
  m=uma.match(/\b(?:val(?:idade)?|venc(?:imento)?|consumir\s+at[ée])\s*[:.\-]?\s*(\d{2}[\/.\-]\d{2}[\/.\-]\d{2,4}|\d{2}[\/.\-]\d{4}|\d{2}\s*(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\w*\s*\d{2,4})/i);if(m)r.validade=m[1];
  m=uma.match(/\b(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/);if(m&&dig(m[1]).length===14)r.cnpj=m[1];
  m=uma.match(/\b(?:reg(?:istro)?\.?\s*(?:no?\s*)?(?:m\.?\s*s\.?|anvisa)|m\.?\s*s\.?)\s*(?:n[º°o.]*\s*)?[:.\-]?\s*([\d][\d.\-\/]{7,18}\d)/i);if(m)r.registro=m[1];
  return r}
 function nutricao(doc){var out={};var t=doc.querySelector('#rt-saida table.rt-t');if(!t)return out;
  var ths=[].map.call(t.querySelectorAll('thead th'),function(th){return th.textContent.trim()});var col=-1;
  ths.forEach(function(h,i){if(col<0&&i>0&&/por[çc][ãa]o/i.test(h))col=i});
  var info=doc.querySelector('#rt-saida .rt-nota');var pm=info&&info.textContent.match(/Por[çc][ãa]o:\s*([\d.,]+)/i);if(pm)out.porcao=pm[1].replace('.',',');
  var c100=-1;ths.forEach(function(h,i){if(c100<0&&i>0&&/100\s*(g|ml)/i.test(h))c100=i});
  [].forEach.call(t.querySelectorAll('tbody tr'),function(tr){var tds=tr.children,rot=(tds[0]&&tds[0].textContent||'').toLowerCase();var chave=/a[çc][úu]cares\s+adicionados/.test(rot)?'acucar':/gorduras?\s+saturadas/.test(rot)?'gordura':/s[óo]dio/.test(rot)?'sodio':null;if(!chave||out[chave]!=null)return;
   function val(ci){var td=tds[ci];if(!td)return null;var inp=td.querySelector('input');var v=(inp?inp.value:td.textContent).trim();return v===''?null:v.replace('.',',')}
   var v=col>0?val(col):null;
   if(v==null&&c100>0&&out.porcao){var b=val(c100);var p=parseFloat(out.porcao.replace(',','.'));if(b!=null&&!isNaN(p)){var n=parseFloat(b.replace(',','.'))*p/100;if(!isNaN(n))v=String(Math.round(n*100)/100).replace('.',',')}}
   if(v!=null)out[chave]=v});
  var forma=doc.getElementById('rt-forma');if(forma)out.unidade=forma.value==='liquido'?'ml':'g';
  return out}
 function usarNoFormulario(m){var fr=m.querySelector('iframe');var doc=fr&&fr.contentDocument;if(!doc)return;
  var bruto=(doc.getElementById('rt-bruto')||{}).value||'';
  if(!bruto.trim()){alert('Analise o rótulo primeiro: escolha as fotos e toque em “Analisar rótulo”.');return}
  var feitos=[];var ot=rec('originalText');
  if(ot){if(!ot.value||confirm('Substituir o texto já registrado em “Texto original do rótulo” pelo texto desta leitura?')){setCampo(ot,bruto,true);feitos.push('texto do rótulo')}}
  var d=extrai(bruto);
  var ta=$('#rot-ingr');if(ta&&d.ingredientes&&(!ta.value.trim()||confirm('Substituir a lista de ingredientes já colada pela lista lida na foto?'))){ta.value=d.ingredientes;var det=ta.closest('details');if(det)det.open=true;feitos.push('lista de ingredientes')}
  if(setCampo(rec('lot'),d.lote))feitos.push('lote');
  if(setCampo(rec('expiry'),d.validade))feitos.push('validade');
  if(setCampo(rec('cnpj'),d.cnpj))feitos.push('CNPJ');
  if(setCampo(rec('registration'),d.registro))feitos.push('registro');
  var n=nutricao(doc);
  if(setCampo($('#nt-porcao'),n.porcao)){feitos.push('porção');var u=$('#nt-unidade');if(u&&n.unidade&&u.value!==n.unidade){u.value=n.unidade;u.dispatchEvent(new Event('change',{bubbles:true}))}}
  if(setCampo($('#nt-acucar'),n.acucar))feitos.push('açúcares adicionados');
  if(setCampo($('#nt-gordura'),n.gordura))feitos.push('gorduras saturadas');
  if(setCampo($('#nt-sodio'),n.sodio))feitos.push('sódio');
  m.hidden=true;
  var alvo=$('#food-evidencias');if(alvo){alvo.open=true;alvo.scrollIntoView({block:'start'})}
  status(feitos.length?'Preenchido a partir da foto: '+feitos.join(', ')+'. Confira cada campo com o rótulo antes de concluir; campos já preenchidos não foram alterados.':'A leitura não trouxe dados novos para o formulário. Confira o texto reconhecido e preencha manualmente.')}
 function prepararModal(){var m=$('#food-ocr-modal');if(!m||m.querySelector('[data-rm-usar]'))return;var head=m.querySelector('.food-ocr-head');if(!head)return;
  var b=document.createElement('button');b.type='button';b.setAttribute('data-rm-usar','');b.textContent='Usar no formulário';b.className='rm-usar';b.onclick=function(){usarNoFormulario(m)};
  var fechar=head.querySelector('#food-ocr-close');head.insertBefore(b,fechar||null)}
 new MutationObserver(prepararModal).observe(document.body,{childList:true});

 /* ---------- 2. busca inteligente ---------- */
 function cnpjOk(n){if(n.length!==14||/^(\d)\1+$/.test(n))return false;function dv(k){var w=k===12?[5,4,3,2,9,8,7,6,5,4,3,2]:[6,5,4,3,2,9,8,7,6,5,4,3,2],s=0;for(var i=0;i<k;i++)s+=+n[i]*w[i];var r=s%11;return r<2?0:11-r}return dv(12)===+n[12]&&dv(13)===+n[13]}
 function gtinOk(n){if([8,12,13,14].indexOf(n.length)<0)return false;var s=0,c=n.slice(0,-1).split('').reverse();c.forEach(function(d,i){s+=+d*(i%2?1:3)});return (10-s%10)%10===+n.slice(-1)}
 function modo(v){var n=dig(v);if(!n||/[a-zà-ÿ]/i.test(v.replace(/^(cnpj|gtin|ean|registro|reg|ms|processo)\s*/i,'')))return null;
  if(n.length===14&&cnpjOk(n))return 'cnpj';
  if(gtinOk(n)&&n.length!==11)return 'gtin';
  if(n.length>=15&&n.length<=17)return 'processo';
  if(n.length>=8&&n.length<=11)return 'registro';
  return null}
 function smart(){var q=$('#food-smart-q');if(!q)return;var v=(q.value||'').trim();var md=modo(v);if(!md)return;
  (function tenta(k){var t=$('#p-produto .consulta-tipo[data-tipo="'+md+'"]'),i=$('#pr-q');if(!t||!i){if(k<30)setTimeout(function(){tenta(k+1)},100);return}
   t.click();i.value=v;var bt=[].find.call(document.querySelectorAll('#p-produto button'),function(x){return x.textContent.trim()==='Consultar'});if(bt)bt.click()})(0)}
 document.addEventListener('click',function(e){if(e.target.closest&&e.target.closest('#food-smart-go'))setTimeout(smart,150)});
 document.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target&&e.target.id==='food-smart-q')setTimeout(smart,150)});

 /* ---------- 3. organização da conferência de rótulo ---------- */
 function organizar(){var id=$('#food-identificacao');if(!id)return false;
  document.querySelectorAll('#p-rotulo details.bloco h2').forEach(function(h){var t=h.textContent;if(/^\d+\.\s+/.test(t))h.textContent=t.replace(/^\d+\.\s+/,'')});
  if(!id.querySelector('.rm-grid')){var g=document.createElement('div');g.className='rm-grid';var ls=[].filter.call(id.children,function(x){return x.tagName==='LABEL'&&x.querySelector('[data-food-record]')});if(ls.length){id.insertBefore(g,ls[0]);ls.forEach(function(l){g.appendChild(l)})}}
  var nr=$('#p-rotulo .normas-rotulo');if(nr&&!nr.closest('.rm-fontes')){var d=document.createElement('details');d.className='rm-fontes';d.innerHTML='<summary>Fontes legais citadas nesta conferência</summary>';nr.parentNode.insertBefore(d,nr);d.appendChild(nr);var h=nr.querySelector('h2');if(h)h.style.display='none'}
  var ev=$('#food-evidencias>summary');if(ev&&!/Fotos/.test(ev.textContent))ev.textContent='2. Fotos e leitura do rótulo';
  document.querySelectorAll('#p-rotulo nav.chips .chip').forEach(function(c){if(/^2\. Evid/.test(c.textContent))c.textContent='2. Fotos e leitura do rótulo'});
  document.querySelectorAll('#p-rotulo button').forEach(function(b){var t=b.textContent.trim();if(t==='Ler foto por OCR'||t==='Ler foto do rótulo')b.textContent='📷 Ler rótulo por foto'});
  supl();return true}
 function supl(){var k=rec('kind');var on=!k||k.value==='Suplemento alimentar';var s=$('#food-suplemento');if(s)s.hidden=!on;var nc=(on?'6':'5')+'. Conclusão e relatório';document.querySelectorAll('#p-rotulo nav.chips .chip').forEach(function(c){if(/^5\. Supl/.test(c.textContent))c.hidden=!on;if(/^\d\. Conclus/.test(c.textContent))c.textContent=nc});var cs=$('#food-conclusao>summary');if(cs)cs.textContent=nc}
 document.addEventListener('change',function(e){if(e.target&&e.target.matches&&e.target.matches('[data-food-record="kind"]'))supl()});
 (function espera(n){if(organizar()||n>100)return;setTimeout(function(){espera(n+1)},100)})(0);

 document.head.insertAdjacentHTML('beforeend','<style id="rm-style">.rm-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:0 14px}.rm-fontes{margin:14px 0;border:1px solid #dce5e0;border-radius:12px;background:#fff;padding:0 14px}.rm-fontes>summary{cursor:pointer;padding:12px 0;font-weight:800;color:#28573e}.rm-fontes[open]{padding-bottom:10px}.rm-fontes .normas-rotulo{border:0;box-shadow:none;padding:0;margin:0}.food-ocr-head{gap:8px}.food-ocr-head b{flex:1}.food-ocr-head .rm-usar{border:0;border-radius:999px;background:#1f7a4d;color:#fff;font-weight:800;padding:8px 14px}</style>');
})();
