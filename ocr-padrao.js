/* ——— OCR padronizado do núcleo de Medicamentos ———
   Regra (definida com a equipe): OCR só para documentos de modelo único, em que
   a extração é exata e o dado é reaproveitado — licença sanitária, Certidão de
   Regularidade Técnica do CRF, AVCB/CLCB e DANFE. Motor: DrogariaOcrTools.
   Os demais documentos viram FICHA digitada (poucos campos, sem OCR), checklist
   no próprio roteiro ou foto para análise posterior. ASO e receitas não têm OCR;
   as fotos continuam livres em todos os itens.
   API:
     OcrPadrao.ler(tipo, {titulo, onApply})   tipo ∈ OcrPadrao.OCR
     OcrPadrao.ficha(tipo, {titulo, valores, onApply, foto})   tipo ∈ OcrPadrao.FICHAS
     onApply(valores, {tipo, titulo, resumo, rotulos})
     foto: função(file) opcional — guarda foto do documento como evidência. */
(function(){
 if(window.OcrPadrao)return;
 var OCR={
  licenca_sanitaria:'Licença sanitária',
  certidao_regularidade_crf:'Certidão de Regularidade Técnica — CRF',
  avcb_clcb:'AVCB ou CLCB',
  danfe_nfe:'DANFE / nota fiscal'
 };
 var FICHAS={
  controle_pragas:{titulo:'Controle de pragas — certificado',campos:[['empresa','Empresa executora'],['cnpj','CNPJ da empresa'],['licenca','Licença sanitária da empresa'],['data','Data do serviço','date'],['validade','Validade / garantia','date']]},
  caixa_agua:{titulo:'Limpeza da caixa d’água — certificado',campos:[['empresa','Empresa executora'],['cnpj','CNPJ da empresa'],['licenca','Licença sanitária da empresa'],['data','Data da limpeza','date'],['validade','Validade / próxima limpeza','date']]},
  calibracao:{titulo:'Certificado de calibração',foto:true,campos:[['numero','Nº do certificado'],['laboratorio','Laboratório (acreditação RBC)'],['instrumento','Instrumento / nº de série'],['data','Data da calibração','date'],['validade','Validade (se definida)','date']]},
  mapas:{titulo:'Mapas e balanços — envio',campos:[['protocolo','Nº do protocolo'],['periodo','Período de referência'],['data','Data do envio','date']]},
  sngpc:{titulo:'SNGPC — certificado',campos:[['certificado','Certificado (escrituração / transmissão regular)'],['data','Data de adesão ou da última transmissão','date']]}
 };
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function dlg(titulo){
  if(window.MedTools&&MedTools.dialog)return MedTools.dialog(titulo);
  var d=document.getElementById('ocr-padrao-dialog');if(!d){d=document.createElement('dialog');d.id='ocr-padrao-dialog';d.className='med-tools-dialog';document.body.appendChild(d)}
  d.innerHTML='<header><h2></h2><button type="button" data-close>Fechar ×</button></header><div class="med-tools-body"></div>';d.querySelector('h2').textContent=titulo;d.querySelector('[data-close]').onclick=function(){d.close()};d.showModal();return d}
 function brParaIso(v){v=String(v||'').trim();var m=v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);if(m)return m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2);return /^\d{4}-\d{2}-\d{2}$/.test(v)?v:''}
 function isoParaBr(v){var m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:String(v||'')}
 function resumo(vals,rot){return Object.keys(vals).filter(function(k){return String(vals[k]||'').trim()}).map(function(k){return (rot[k]||k)+': '+(/^\d{4}-\d{2}-\d{2}$/.test(vals[k])?isoParaBr(vals[k]):vals[k])}).join(' | ')}
 function css(){if(document.getElementById('ocr-padrao-css'))return;var s=document.createElement('style');s.id='ocr-padrao-css';s.textContent='.ocp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0}.ocp-grid label{display:grid;gap:4px;font-size:.8rem;font-weight:700;color:#4f6270}.ocp-grid input,.ocp-grid textarea{width:100%;border:1px solid #b8c7d1;border-radius:8px;padding:8px 10px;font:inherit;font-weight:400;font-size:.92rem;background:#fff}.ocp-grid .ocp-full{grid-column:1/-1}.ocp-acoes{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.ocp-acoes button{min-height:42px;padding:8px 14px;border-radius:9px;border:1px solid #9fb3c0;background:#fff;color:#294c62;font:600 .9rem/1.2 inherit;cursor:pointer}.ocp-acoes button.pri{background:#2f5870;border-color:#2f5870;color:#fff}.ocp-nota{font-size:.84rem;color:#5b6d78}.ocp-alerta{background:#fff7e6;border:1px solid #e9c77b;border-radius:8px;padding:8px 10px;font-size:.84rem}@media(max-width:560px){.ocp-grid{grid-template-columns:1fr}}';document.head.appendChild(s)}

 /* Leitura por OCR (4 documentos de modelo único) */
 function ler(tipo,op){op=op||{};css();
  var T=window.DrogariaOcrTools;if(!OCR[tipo])throw Error('OCR não previsto para este documento.');
  var d=dlg(op.titulo||'Ler '+OCR[tipo]),b=d.querySelector('.med-tools-body'),res=null;
  b.innerHTML='<p class="ocp-nota">Fotografe ou selecione o documento. O texto é lido no próprio aparelho; confira e corrija cada campo antes de aplicar.</p><div class="ocp-acoes"><button type="button" class="pri" data-cam>📷 Fotografar</button><button type="button" data-arq>📄 PDF ou imagem</button><button type="button" data-man>Digitar sem ler</button></div><input type="file" hidden accept="image/*" capture="environment" data-cam-in><input type="file" hidden accept="image/*,.pdf,.docx,.xml" data-arq-in><p role="status" data-st class="ocp-nota"></p><div data-campos></div>';
  var st=function(t){var e=b.querySelector('[data-st]');if(e)e.textContent=t};
  function mostra(r){res=r;var rot=r.labels||{},f=r.fields||{},vaz=Object.keys(f).filter(function(k){return !String(f[k]||'').trim()});
   b.querySelector('[data-campos]').innerHTML='<div class="ocp-grid">'+Object.keys(f).map(function(k){var longo=/atividade|endereco|lista/.test(k);return '<label class="'+(longo?'ocp-full':'')+'">'+esc(rot[k]||k.replace(/_/g,' '))+(longo?'<textarea rows="3" data-k="'+esc(k)+'">'+esc(f[k])+'</textarea>':'<input data-k="'+esc(k)+'" value="'+esc(f[k])+'">')+'</label>'}).join('')+'</div>'+(vaz.length&&r.rawText?'<p class="ocp-alerta">Não localizados: '+esc(vaz.map(function(k){return rot[k]||k}).join(', '))+'. Digite a partir do documento.</p>':'')+(r.rawText?'<details><summary class="ocp-nota">Texto lido</summary><pre style="white-space:pre-wrap;font-size:.8rem">'+esc(r.rawText)+'</pre></details>':'')+'<div class="ocp-acoes"><button type="button" class="pri" data-aplica>Aplicar dados conferidos</button></div>'}
  function escolhe(e){var f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;if(!T){st('Leitor indisponível neste roteiro.');return}st('Lendo documento…');T.read(tipo,f,st).then(function(r){mostra(r);st('Confira antes de aplicar.')}).catch(function(x){st(x.message||String(x))})}
  b.querySelector('[data-cam]').onclick=function(){b.querySelector('[data-cam-in]').click()};
  b.querySelector('[data-arq]').onclick=function(){b.querySelector('[data-arq-in]').click()};
  b.querySelector('[data-cam-in]').onchange=escolhe;b.querySelector('[data-arq-in]').onchange=escolhe;
  b.querySelector('[data-man]').onclick=function(){if(T)mostra(T.extract(tipo,'',{method:'Preenchimento manual'}));};
  b.addEventListener('click',function(e){if(!e.target.closest('[data-aplica]')||!res)return;var v={};b.querySelectorAll('[data-k]').forEach(function(i){v[i.dataset.k]=i.value.trim()});var rot=res.labels||{};
   if(op.onApply)op.onApply(v,{tipo:tipo,titulo:OCR[tipo],resumo:resumo(v,rot),rotulos:rot,iso:function(x){return brParaIso(x)||(T&&T.util.toIso?T.util.toIso(x):'')}});d.close()});
  return d}

 /* Ficha digitada (sem OCR) */
 function ficha(tipo,op){op=op||{};css();var F=FICHAS[tipo];if(!F)throw Error('Ficha não prevista: '+tipo);
  var d=dlg(op.titulo||F.titulo),b=d.querySelector('.med-tools-body'),val=op.valores||{},rot={};F.campos.forEach(function(c){rot[c[0]]=c[1]});
  b.innerHTML='<p class="ocp-nota">Registre só os dados que importam para a conferência.'+(F.foto||op.foto?' A foto do documento fica como evidência para análise posterior.':'')+'</p><div class="ocp-grid">'+F.campos.map(function(c){return '<label>'+esc(c[1])+'<input data-k="'+esc(c[0])+'" type="'+(c[2]||'text')+'" value="'+esc(c[2]==='date'?(brParaIso(val[c[0]])||val[c[0]]||''):(val[c[0]]||''))+'"></label>'}).join('')+'</div>'+
   (op.foto?'<input type="file" hidden accept="image/*" capture="environment" data-foto-in><p role="status" data-st class="ocp-nota"></p>':'')+
   '<div class="ocp-acoes">'+(op.foto?'<button type="button" data-foto>📷 Foto do documento</button>':'')+'<button type="button" class="pri" data-aplica>Registrar</button></div>';
  if(op.foto){b.querySelector('[data-foto]').onclick=function(){b.querySelector('[data-foto-in]').click()};b.querySelector('[data-foto-in]').onchange=function(e){var f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;var s=b.querySelector('[data-st]');s.textContent='Guardando foto…';Promise.resolve(op.foto(f)).then(function(){s.textContent='Foto guardada como evidência.'}).catch(function(x){s.textContent='Não foi possível guardar a foto: '+(x&&x.message||x)})}}
  b.querySelector('[data-aplica]').onclick=function(){var v={};b.querySelectorAll('[data-k]').forEach(function(i){v[i.dataset.k]=i.value.trim()});if(op.onApply)op.onApply(v,{tipo:tipo,titulo:F.titulo,resumo:resumo(v,rot),rotulos:rot,iso:brParaIso});d.close()};
  return d}
 window.OcrPadrao={OCR:OCR,FICHAS:FICHAS,ler:ler,ficha:ficha,util:{brParaIso:brParaIso,isoParaBr:isoParaBr}};
})();
