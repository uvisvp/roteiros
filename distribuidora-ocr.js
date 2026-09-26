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
 /* AFE/AE puxadas do banco, separadas por tipo */
 window.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-dist-company]');if(!b||!window.MedBanco)return;e.preventDefault();e.stopImmediatePropagation();
  MedBanco.consultaCnpj(state.meta.cnpj,{onApply:function(r){poe('meta.company',r.razao,1);poe('meta.fantasy',r.fantasia,1);
   [['afe',r.afe],['ae',r.ae]].forEach(function(p){var k=p[0],x=p[1];if(!x)return;setPath('distDocs.'+k+'.status','Possui');poe('distDocs.'+k+'.number',x.numero);poe('distDocs.'+k+'.process',x.processo);poe('distDocs.'+k+'.statusOfficial',x.situacao);poe('distDocs.'+k+'.authorizationDate',String(x.autorizacao||'').slice(0,10));poe('distDocs.'+k+'.publicationDate',String(x.publicacao||'').slice(0,10));poe('distDocs.'+k+'.class',x.classe);poe('distDocs.'+k+'.activities',x.atividades);poe('distDocs.'+k+'.sourceUpdate',String(x.carga||'').slice(0,10))});
   state.readings=state.readings||{};state.readings.company={afe:r.afe,ae:r.ae,todas:r.todas,queriedAt:r.consulta};save();if(typeof renderITab==='function')renderITab()}})},true);
 var t=null;new MutationObserver(function(){if(!t)t=setTimeout(function(){t=null;try{politica()}catch(x){}},30)}).observe(document.documentElement,{childList:true,subtree:true});
})();
/* ——— Conferência de estoque (iframe #med-stock-dialog): sugestão de nomes do banco
   ao digitar o produto; ao escolher, preenche nome e registro. Com registro de 9
   dígitos e apresentação vazia, lista as apresentações da CMED para escolher
   (apresentação, laboratório e EAN). ——— */
(function(){
 if(window.__distEstoqueBanco)return;window.__distEstoqueBanco=true;
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
 function dig(v){return String(v||'').replace(/\D/g,'')}
 function poe(el,v,forcar){if(!el||!v||(el.value&&!forcar))return;el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}
 function lista(doc,input,itens,render,onPick){var box=doc.getElementById('mb-lista');if(box)box.remove();if(!itens.length)return;box=doc.createElement('div');box.id='mb-lista';box.className='mb-lista';
  box.innerHTML=itens.map(function(x,i){return '<button type="button" data-i="'+i+'">'+render(x)+'</button>'}).join('');
  input.insertAdjacentElement('afterend',box);box.addEventListener('mousedown',function(e){e.preventDefault()});
  box.addEventListener('click',function(e){var b=e.target.closest('[data-i]');if(!b)return;var x=itens[+b.dataset.i];box.remove();onPick(x)})}
 function fecha(doc){var b=doc.getElementById('mb-lista');if(b)b.remove()}
 function oferecerApresentacoes(doc,alvo){var reg=doc.getElementById('reg'),ap=doc.getElementById('apres');if(!reg||!ap||ap.value||dig(reg.value).length<9||!window.MedBanco||!MedBanco.apresentacoes)return;
  MedBanco.apresentacoes(reg.value).then(function(aps){if(!aps.length||ap.value)return;
   if(aps.length===1){aplicaApr(doc,aps[0]);return}
   lista(doc,alvo||ap,aps,function(a){return '<b>'+esc(a.apresentacao)+'</b><span>'+esc([a.registro_apresentacao&&('reg. '+a.registro_apresentacao),a.laboratorio,a.ean&&('EAN '+a.ean)].filter(Boolean).join(' · '))+'</span>'},function(a){aplicaApr(doc,a)})})}
 function aplicaApr(doc,a){poe(doc.getElementById('apres'),a.apresentacao,true);poe(doc.getElementById('fab'),a.laboratorio);var e=doc.getElementById('ean');if(e&&a.ean&&!dig(e.value))poe(e,a.ean)}
 function ligar(fr){var doc;try{doc=fr.contentDocument}catch(e){return}if(!doc||!doc.getElementById('nome')||doc.body.dataset.mbLigado)return;doc.body.dataset.mbLigado='1';
  var st=doc.createElement('style');st.textContent='.mb-lista{display:grid;gap:4px;margin-top:4px;max-height:280px;overflow:auto;padding:4px;border:1px solid #d6d2c8;border-radius:10px;background:#fff;box-shadow:0 8px 20px #0002}.mb-lista button{text-align:left;padding:8px 10px;border:0;border-radius:8px;background:#f5f6f7;cursor:pointer;font:inherit}.mb-lista button:hover{background:#eef0f2}.mb-lista b{display:block;font-size:.82rem}.mb-lista span{display:block;font-size:.7rem;color:#686b70}';doc.head.appendChild(st);
  var nome=doc.getElementById('nome'),reg=doc.getElementById('reg'),ap=doc.getElementById('apres'),tm=null;nome.setAttribute('autocomplete','off');
  nome.addEventListener('input',function(){clearTimeout(tm);if(nome.dataset.mbPausa){delete nome.dataset.mbPausa;return}var v=nome.value;if(v.replace(/\W/g,'').length<3||!window.MedBanco){fecha(doc);return}
   tm=setTimeout(function(){MedBanco.nomes(v,'medicamento').then(function(ls){if(doc.activeElement!==nome)return;
    lista(doc,nome,ls,function(x){return '<b>'+esc(x.nome)+'</b><span>'+esc(x.detalhe||'')+'</span>'},function(x){nome.dataset.mbPausa='1';poe(nome,x.nome,true);if(x.registro)poe(reg,x.registro,true);if(ap&&x.registro)ap.value='';oferecerApresentacoes(doc,ap)})}).catch(function(){})},250)});
  nome.addEventListener('blur',function(){setTimeout(function(){if(doc.activeElement!==nome)fecha(doc)},200)});
  reg.addEventListener('change',function(){oferecerApresentacoes(doc,ap)});
  ap.addEventListener('focus',function(){oferecerApresentacoes(doc,ap)});
  /* A consulta própria do módulo preenche o registro: oferece as apresentações logo depois. */
  var lk=doc.getElementById('lookup');if(lk)lk.addEventListener('click',function(){setTimeout(function(){oferecerApresentacoes(doc,ap)},1500)})}
 new MutationObserver(function(){var fr=document.querySelector('#med-stock-dialog iframe');if(!fr)return;if(fr.contentDocument&&fr.contentDocument.readyState==='complete')ligar(fr);if(!fr.dataset.mbLoad){fr.dataset.mbLoad='1';fr.addEventListener('load',function(){ligar(fr)})}}).observe(document.body,{childList:true,subtree:true});
})();
