/* ——— Distribuidora: OCR padronizado ———
   OCR só nos documentos de modelo único da identificação: licença sanitária,
   CRT/CRF e AVCB/CLCB (motor comum OcrPadrao/DrogariaOcrTools). O leitor de
   texto genérico das perguntas sai: os documentos são conferidos pelo checklist
   da pergunta e, quando preciso, por foto para análise posterior. */
(function distOcr(){
 if(!window.OcrPadrao)return;
 var TIPO={lic:'licenca_sanitaria',crt:'certidao_regularidade_crf',avcb:'avcb_clcb'};
 function vazio(p){return !String(getPath(p)||'').trim()}
 function poe(p,v,soVazio){v=String(v||'').trim();if(!v)return;if(soVazio&&!vazio(p))return;setPath(p,v)}
 function aplica(doc,v,m){
  if(doc==='lic'){poe('distDocs.lic.number',v.numero_cevs_ou_cmvs);poe('distDocs.lic.validity',v.validade);
   poe('meta.company',v.razao_social,1);poe('meta.fantasy',v.nome_fantasia,1);poe('meta.cnpj',v.cnpj,1);
   poe('meta.address',[v.endereco,v.bairro,v.municipio&&(v.municipio+(v.estado?'/'+v.estado:'')),v.cep&&('CEP '+v.cep)].filter(Boolean).join(', '),1);
   poe('meta.legal',[v.responsavel_legal,v.cpf_responsavel_legal].filter(Boolean).join(' / '),1);
   poe('meta.rt',[v.responsavel_tecnico,v.numero_conselho_responsavel_tecnico&&('CRF '+v.numero_conselho_responsavel_tecnico)].filter(Boolean).join(' / '),1)}
  else if(doc==='crt'){poe('distDocs.crt.number',v.numero_certidao);poe('distDocs.crt.issueDate',m.iso(v.data_emissao));poe('distDocs.crt.activity',v.ramo_atividade);
   poe('distDocs.crt.technical',[v.responsavel_tecnico&&('RT: '+v.responsavel_tecnico+(v.numero_conselho_responsavel_tecnico?' (CRF '+v.numero_conselho_responsavel_tecnico+')':'')),v.responsavel_tecnico_substituto&&('Substituto: '+v.responsavel_tecnico_substituto+(v.numero_conselho_responsavel_tecnico_substituto?' (CRF '+v.numero_conselho_responsavel_tecnico_substituto+')':''))].filter(Boolean).join('\n'));
   poe('meta.rt',v.responsavel_tecnico&&[v.responsavel_tecnico,v.numero_conselho_responsavel_tecnico&&('CRF '+v.numero_conselho_responsavel_tecnico)].filter(Boolean).join(' / '),1)}
  else if(doc==='avcb'){poe('distDocs.avcb.number',[v.tipo_documento,v.numero].filter(Boolean).join(' '));poe('distDocs.avcb.validity',v.validade);poe('distDocs.avcb.issuer','Corpo de Bombeiros da Polícia Militar',1)}
  state.readings=state.readings||{};state.readings['doc-'+doc]={tipo:m.tipo,campos:v,em:new Date().toISOString()};
  save();if(typeof renderITab==='function')renderITab()}
 function politica(){
  document.querySelectorAll('[data-dist-read]').forEach(function(b){b.remove()});
  document.querySelectorAll('article.dist-doc-card').forEach(function(a){if(a.querySelector('[data-dist-ocr]'))return;var i=a.querySelector('[data-path^="distDocs."]');if(!i)return;var doc=i.dataset.path.split('.')[1];if(!TIPO[doc])return;
   var b=document.createElement('button');b.type='button';b.className='btn';b.dataset.distOcr=doc;b.textContent='📄 Ler documento (OCR)';var h=a.querySelector(':scope>div');(h||a).appendChild(b)})}
 document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-dist-ocr]');if(!b)return;e.preventDefault();var doc=b.dataset.distOcr;OcrPadrao.ler(TIPO[doc],{onApply:function(v,m){aplica(doc,v,m)}})});
 var t=null;new MutationObserver(function(){if(!t)t=setTimeout(function(){t=null;try{politica()}catch(x){}},30)}).observe(document.documentElement,{childList:true,subtree:true});
})();
