/* ——— Drogaria: OCR padronizado ———
   OCR só para licença sanitária, CRT (identificação e perguntas doc_lfs/doc_crt)
   e DANFE (fornecedores). Fichas digitadas, sem OCR: controle de pragas,
   certificados de calibração (com foto), SNGPC e mapas/balanços. Sem leitura:
   ASO (checklist por amostragem, LGPD), POPs, Manual e PGRSS (checklists),
   embalagens do estoque (dados vêm do banco) e “extrair texto” genérico.
   Carregado depois de drogaria-review.js. */
(function(){
 if(window.__drgOcrPolitica||!window.OcrPadrao)return;window.__drgOcrPolitica=true;
 var OCR={doc_lfs:1,doc_crt:1,doc_invoice:1};
 var FICHA={doc_pragas:'controle_pragas',doc_therm_cal:'calibracao',doc_cold_cal:'calibracao',doc_sngpc_cert:'sngpc',sngpc_current:'sngpc',doc_bmpo_trim:'mapas'};
 function api(){return window.DrogariaAPI}
 function uid(){return Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9)}
 function box(s,n){var a=(s.meta.drogaria_secoes=s.meta.drogaria_secoes||{});return a[n]=a[n]||{answers:{},fields:{},docs:[],items:[]}}
 function chave(v){var p=String(v||'').split(':');return p[0]==='document'?(p[2]||''):''}
 function escopo(){var s=api().getState();if(!s.meta.inspecao_id){var x=structuredClone(s);x.meta.inspecao_id='drogaria_'+uid();api().setState(x,{render:false})}return api().getState().meta.inspecao_id}
 function ficha(key){var id=key.split('@')[0],tipo=FICHA[id];var q=(api().getCatalog().perguntas||[]).find(function(x){return x.id===id})||{};
  OcrPadrao.ficha(tipo,{
   foto:tipo==='calibracao'&&window.DrogariaOcrTools?function(f){return DrogariaOcrTools.fotos.save(escopo(),f,{section:q.pergunta||'',caption:OcrPadrao.FICHAS[tipo].titulo})}:null,
   onApply:function(v,m){var porRotulo={};Object.keys(v).forEach(function(k){if(String(v[k]||'').trim())porRotulo[m.rotulos[k]||k]=/^\d{4}-\d{2}-\d{2}$/.test(v[k])?OcrPadrao.util.isoParaBr(v[k]):v[k]});
    var s=structuredClone(api().getState());s.evidence=s.evidence||{};s.evidence[key]=Object.assign({},s.evidence[key]||{},{campos:porRotulo,texto:m.resumo,includeInReport:true});
    box(s,'native_'+(q.card||1)).docs.push({id:uid(),kind:tipo,title:m.titulo,fields:porRotulo,includeInReport:true,readAt:new Date().toISOString(),manual:true});
    api().setState(s,{render:true})}})}
 /* antes dos demais ouvintes (fase de captura na window) */
 window.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('[data-ocr]');if(!b)return;var v=b.dataset.ocr||'',k=chave(v),id=k.split('@')[0];
  if(v.indexOf('document:')===0){if(FICHA[id]){e.preventDefault();e.stopImmediatePropagation();ficha(k);return}if(!OCR[id]){e.preventDefault();e.stopImmediatePropagation()}return}
  if(/^stock:/.test(v)){e.preventDefault();e.stopImmediatePropagation()}},true);
 window.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('[data-sd-doc]');if(b&&String(b.dataset.sdDoc||'').split('|')[1]!=='danfe_nfe'){e.preventDefault();e.stopImmediatePropagation()}},true);
 window.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('[data-s1-read="aso"]');if(b){e.preventDefault();e.stopImmediatePropagation()}},true);
 function politica(){
  document.querySelectorAll('[data-ocr]').forEach(function(b){var v=b.dataset.ocr||'',id=chave(v).split('@')[0];
   if(v==='document:geral'||/^stock:/.test(v)){b.remove();return}
   if(v.indexOf('document:')===0){if(OCR[id])b.textContent='📄 Ler documento (OCR)';else if(FICHA[id])b.textContent='📝 Registrar dados do documento';else b.remove()}});
  document.querySelectorAll('[data-s1-read="aso"]').forEach(function(b){b.remove()});
  document.querySelectorAll('[data-sd-doc]').forEach(function(b){var t=String(b.dataset.sdDoc||'').split('|')[1];if(t==='danfe_nfe')b.textContent='📄 Ler DANFE / nota fiscal (OCR)';else b.remove()});
 }
 var t=null;new MutationObserver(function(){if(!t)t=setTimeout(function(){t=null;try{politica()}catch(x){}},30)}).observe(document.documentElement,{childList:true,subtree:true});
 try{politica()}catch(x){}
})();
