/* Farmácia de Manipulação — bootstrap, navegação e fechamento do relatório */
(function (window, document) {
  'use strict';
  if (window.__FARMACIA_MANIPULACAO_APP__) return;
  window.__FARMACIA_MANIPULACAO_APP__ = true;

  var FILES = [
    'farmacia-manipulacao-core.js',
    'farmacia-manipulacao-lookup.js',
    'farmacia-manipulacao-section1.js',
    'farmacia-manipulacao-section2.js',
    'farmacia-manipulacao-section3.js',
    'farmacia-manipulacao-section4.js',
    'farmacia-manipulacao-section5.js',
    'farmacia-manipulacao-section6.js',
    'farmacia-manipulacao-section7.js',
    'farmacia-manipulacao-section8.js',
    'farmacia-manipulacao-section9.js',
    'farmacia-manipulacao-report.js'
  ];
  var loaded = null;
  var root = null;
  var active = 'section1';

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-fm-module="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === '1') return resolve();
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      var s = document.createElement('script');
      s.src = './' + src;
      s.defer = true;
      s.dataset.fmModule = src;
      s.onload = function () { s.dataset.loaded = '1'; resolve(); };
      s.onerror = function () { reject(new Error('Falha ao carregar ' + src)); };
      document.head.appendChild(s);
    });
  }
  function ensureModules() {
    if (loaded) return loaded;
    loaded = FILES.reduce(function (p, f) { return p.then(function () { return loadScript(f); }); }, Promise.resolve());
    return loaded;
  }

  function norm(v) {
    return String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  }
  function isLauncher(target) {
    if (!target || (root && root.contains(target))) return false;
    var card = target.closest('button,a,[role="button"],.card,.module-card,.menu-card,.hub-card,.app-card,.feature-card,.menu-item');
    if (!card) return false;
    var text = norm(card.textContent);
    var img = card.querySelector('img');
    var imgText = norm((img && img.alt || '') + ' ' + (img && img.getAttribute('src') || ''));
    return text.indexOf('farmacia de manipulacao') >= 0 || imgText.indexOf('farmacia-manipulacao') >= 0;
  }

  function injectStyle() {
    if (document.getElementById('farmacia-manipulacao-style')) return;
    var s = document.createElement('style');
    s.id = 'farmacia-manipulacao-style';
    s.textContent = `
#fm-app{position:fixed;inset:0;z-index:2147482000;background:#f5f6f8;color:#171717;font:15px/1.45 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:none}
#fm-app.is-open{display:grid;grid-template-rows:auto 1fr}.fm-app-head{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#101112;color:#fff;box-shadow:0 1px 0 #0005}.fm-app-head h1{font-size:18px;margin:0;flex:1}.fm-app-head button{border:1px solid #555;background:#222;color:#fff;border-radius:9px;padding:9px 11px}.fm-app-body{min-height:0;display:grid;grid-template-columns:280px minmax(0,1fr)}.fm-app-nav{background:#fff;border-right:1px solid #dfe1e5;padding:10px;overflow:auto}.fm-app-nav button{display:block;width:100%;border:0;background:#f1f2f4;border-radius:9px;padding:10px;margin:3px 0;text-align:left;color:#202124}.fm-app-nav button[aria-current="true"]{background:#111;color:#fff}.fm-app-content{overflow:auto;padding:18px;min-width:0}.fm-app-content>.fm-manipulation-module,.fm-final-section{max-width:1180px;margin:0 auto}.fm-section-header{margin-bottom:15px}.fm-section-title{margin:0 0 6px;font-size:24px}.fm-section-intro,.fm-section-card-subtitle,.fm-helper-text{color:#666c74}.fm-section-card{background:#fff;border:1px solid #dfe2e6;border-radius:12px;padding:14px;margin:0 0 14px;box-shadow:0 1px 2px #00000008}.fm-section-card-title{margin:0 0 10px;font-size:18px}.fm-subcard{border-top:1px solid #eceef1;padding-top:12px;margin-top:12px}.fm-option-group-title{margin:8px 0}.fm-field-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.fm-field{display:flex;flex-direction:column;gap:4px;min-width:0}.fm-field-label{font-weight:600}.fm-field input,.fm-field textarea,.fm-field select,.fm-input,.fm-notes,.fm-table-input,.fm-final-section textarea{box-sizing:border-box;width:100%;padding:9px;border:1px solid #cdd1d5;border-radius:8px;background:#fff;color:#111}.fm-requirement-row,.fm-document-row{border-top:1px solid #eceef1;padding:11px 0}.fm-requirement-row:first-child,.fm-document-row:first-child{border-top:0}.fm-requirement-main{display:flex;gap:10px;align-items:flex-start;justify-content:space-between}.fm-requirement-text{font-weight:600;flex:1}.fm-status-control{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.fm-status-button,.fm-secondary-button,.fm-add-row,.fm-remove-row,.fm-copy-button,.fm-photo-button,.fm-applicability-button{border:1px solid #c7cbd0;background:#fff;border-radius:8px;padding:7px 9px;cursor:pointer}.fm-status-button.is-selected,.fm-status-button[aria-pressed="true"]{background:#111;color:#fff;border-color:#111}.fm-applicability-button.is-selected,.fm-applicability-button[aria-pressed="true"]{background:#666b72;color:#fff}.fm-requirement-details{margin-top:6px}.fm-photo-notes{margin-top:8px}.fm-photo-actions,.fm-document-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:8px 0}.fm-notes-label{display:flex;flex-direction:column;gap:4px}.fm-requirement-hint{margin:6px 0;padding:7px 9px;border-left:4px solid #b88b00;background:#fff8db;border-radius:6px;font-size:13px}.fm-table{width:100%;border-collapse:collapse;margin:8px 0;display:block;overflow:auto}.fm-table th,.fm-table td{border:1px solid #e0e2e5;padding:6px;min-width:120px;vertical-align:top}.fm-table th{background:#f4f5f6;text-align:left}.fm-inline-question{display:flex;align-items:center;justify-content:space-between;gap:10px}.fm-refrigerator-card,.fm-monitor-card{margin-top:12px;padding:12px;border:1px solid #e2e4e7;border-radius:10px;background:#f8f9fa}.fm-check-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid #e6e8ea}.fm-source-comparison{padding:8px 0;border-top:1px solid #eee}.fm-conflict{color:#9a4e00}.fm-consistent{color:#276535}.fm-checkbox-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.fm-checkbox{display:flex;gap:7px;align-items:flex-start}.fm-final-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.fm-final-card{background:#fff;border:1px solid #dfe2e6;border-radius:12px;padding:14px;margin-bottom:14px}.fm-final-card h3{margin-top:0}.fm-final-list li{margin-bottom:8px}.fm-classifications{display:grid;gap:7px}.fm-classifications label{display:flex;gap:8px;align-items:flex-start;padding:8px;border:1px solid #e1e3e5;border-radius:8px}.fm-final-actions{display:flex;gap:8px;flex-wrap:wrap}.fm-dialog{max-width:min(920px,94vw);max-height:88vh;border:0;border-radius:14px;padding:0;box-shadow:0 16px 60px #0008}.fm-dialog::backdrop{background:#0008}.fm-dialog header{display:flex;justify-content:space-between;gap:10px;align-items:center;background:#111;color:#fff;padding:12px 14px}.fm-dialog .fm-dialog-body{padding:14px;overflow:auto}.fm-dialog textarea{width:100%;box-sizing:border-box;min-height:55vh}.fm-stock-diff{font-weight:700}
@media(max-width:780px){#fm-app.is-open{grid-template-rows:auto 1fr}.fm-app-body{grid-template-columns:1fr;grid-template-rows:auto 1fr}.fm-app-nav{display:flex;gap:5px;overflow:auto;border-right:0;border-bottom:1px solid #ddd;padding:6px}.fm-app-nav button{min-width:205px;margin:0}.fm-app-content{padding:11px}.fm-field-grid,.fm-checkbox-grid,.fm-final-grid{grid-template-columns:1fr}.fm-requirement-main{display:block}.fm-status-control{justify-content:flex-start;margin-top:7px}.fm-section-title{font-size:21px}.fm-app-head h1{font-size:15px}}
`;
    document.head.appendChild(s);
  }

  function E(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function ensureRoot() {
    if (root) return root;
    injectStyle();
    root = E('div'); root.id = 'fm-app';
    var head = E('header','fm-app-head');
    var back = E('button','', '← Voltar ao Núcleo'); back.type='button'; back.addEventListener('click', close); head.appendChild(back);
    head.appendChild(E('h1','', 'Farmácia de Manipulação · Inspeção Sanitária'));
    var save = E('button','', 'Salvar'); save.type='button'; save.addEventListener('click', function(){ var FM=window.FarmaciaManipulacao; if(FM)FM.saveState(FM.loadState(),{source:'manual-save'}); flash(save,'✓ Salvo'); }); head.appendChild(save);
    root.appendChild(head);
    var body=E('div','fm-app-body'), nav=E('nav','fm-app-nav'), main=E('main','fm-app-content');body.appendChild(nav);body.appendChild(main);root.appendChild(body);document.body.appendChild(root);
    return root;
  }
  function flash(button,text){var old=button.textContent;button.textContent=text;window.setTimeout(function(){button.textContent=old;},1000);}

  var NAV = [
    ['section1','1. Identificação e informações gerais'],['section2','2. Edificações e instalações'],['section3','3. Pessoal, saúde e treinamento'],['section4','4. Áreas físicas'],['section5','5. Laboratórios'],['section6','6. Sensibilizantes'],['section7','7. Documentos apresentados'],['section8','8. Monitoramento magistral e água'],['section9','9. Rastreabilidade e CQ'],['final','✓ Fechamento do relatório']
  ];
  function renderNav(){var nav=ensureRoot().querySelector('.fm-app-nav');nav.innerHTML='';NAV.forEach(function(item){var b=E('button','',item[1]);b.type='button';b.dataset.section=item[0];b.setAttribute('aria-current',active===item[0]?'true':'false');b.addEventListener('click',function(){show(item[0]);});nav.appendChild(b);});}

  function humanPath(path){
    var sectionNames={s1:'Identificação e informações gerais',s2:'Edificações e instalações',s3:'Pessoal, saúde e treinamento',s4:'Áreas físicas',s5:'Laboratórios',s6:'Sensibilizantes',s7:'Documentos apresentados',s8:'Monitoramento magistral e água',s9:'Rastreabilidade e controle de qualidade'};
    var special={requirements:'Condições estruturais',req:'Requisitos',documentos:'Documentos',checklists:'Checklist',pessoal:'Pessoal e organização',saude:'Saúde ocupacional',treinamentos:'Treinamentos',recepcao:'Recepção/dispensação',industrializados:'Industrializados/drogaria',servicos:'Serviços farmacêuticos',conferencia:'Conferência',dml:'DML',sanitarios:'Sanitários/vestiários',paramentacao:'Paramentação',almoxarifado:'Almoxarifado',cq:'Controle de Qualidade',semissolidos:'Semissólidos e líquidos',solidos:'Sólidos',lavagem:'Lavagem',homeopatia:'Homeopatia',sbit:'SBIT',hormonios:'Hormônios',antibioticos:'Antibióticos',citostaticos:'Citostáticos',penicilinicos:'Penicilínicos',aguaPurificada:'Água purificada',aguaPotavel:'Água potável',baseGalenica:'Base galênica',baixaDose:'Fármaco ≤ 25 mg',diluido:'Diluído preparado',sensibilizantes:'Sensibilizantes',prescricao:'Prescrição',rastreabilidade:'Rastreabilidade',vegetal:'Matéria-prima vegetal',estoqueControlados:'Confronto de estoque',transporte:'Conservação/transporte/dispensação'};
    var parts=String(path||'').split('.').filter(function(x){return x&&x!=='sections'&&x!=='status';});
    return parts.map(function(p){if(sectionNames[p])return sectionNames[p];if(special[p])return special[p];return p.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ').replace(/^./,function(c){return c.toUpperCase();});}).join(' — ');
  }
  function walkStatuses(obj,path,out){
    if(!obj||typeof obj!=='object')return;
    if(Object.prototype.hasOwnProperty.call(obj,'status')){
      var st=obj.status;
      if(st==='NC') out.nc.push({path:path,label:humanPath(path),status:st,notes:obj.notes||''});
      if(st==='NAO'||st==='ATUALIZAR') out.pending.push({path:path,label:humanPath(path),status:st,notes:obj.notes||obj.observacao||''});
    }
    Object.keys(obj).forEach(function(k){if(k!=='status'&&k!=='photos')walkStatuses(obj[k],path?path+'.'+k:k,out);});
  }
  function collectFinal(){var FM=window.FarmaciaManipulacao,state=FM.loadState(),out={nc:[],pending:[]};walkStatuses(state.sections||{},'sections',out);return out;}
  function finalField(path,label,rows){var FM=window.FarmaciaManipulacao,l=E('label','fm-field');l.appendChild(E('span','fm-field-label',label));var t=document.createElement('textarea');t.rows=rows||4;t.value=FM.get(path,'');t.addEventListener('input',function(){FM.set(path,t.value,{source:'final-field'});});l.appendChild(t);return l;}
  function reportText(){
    var FM=window.FarmaciaManipulacao, result=collectFinal(), lines=['RELATÓRIO DE INSPEÇÃO — FARMÁCIA DE MANIPULAÇÃO'];
    for(var i=1;i<=9;i+=1){var s=FM.sections&&FM.sections['section'+i];if(s&&typeof s.getText==='function'){var txt=s.getText();if(txt)lines.push('\n'+txt);}else lines.push('\nSEÇÃO '+i+' — dados registrados no aplicativo.');}
    lines.push('\nDOCUMENTAÇÃO PENDENTE');
    if(result.pending.length)result.pending.forEach(function(x,n){lines.push((n+1)+'. '+x.label+' — '+(x.status==='NAO'?'Não apresentado':'Necessita atualização/complementação')+(x.notes?' — '+x.notes:''));});else lines.push('Nenhuma pendência consolidada até o momento.');
    lines.push('\nNÃO CONFORMIDADES');
    if(result.nc.length)result.nc.forEach(function(x,n){lines.push((n+1)+'. '+x.label+(x.notes?' — '+x.notes:' — constatação ainda sem anotação.'));});else lines.push('Nenhuma não conformidade marcada até o momento.');
    lines.push('\nCONSIDERAÇÕES FINAIS / AVALIAÇÃO DE RISCO\n'+(FM.get('sections.final.consideracoes','')||''));
    lines.push('\nCONCLUSÃO\n'+(FM.get('sections.final.classificacao','')||'Não selecionada'));
    lines.push('\nMEDIDAS ADOTADAS / DOCUMENTOS EMITIDOS\n'+(FM.get('sections.final.medidas','')||''));
    lines.push('\nEQUIPE INSPETORA\n'+(FM.get('sections.final.equipe','')||''));
    return lines.join('\n');
  }
  function dialog(title, bodyNode){var d=document.getElementById('fm-app-dialog');if(!d){d=document.createElement('dialog');d.id='fm-app-dialog';d.className='fm-dialog';document.body.appendChild(d);}d.innerHTML='';var h=E('header');h.appendChild(E('strong','',title));var x=E('button','', 'Fechar ×');x.type='button';x.addEventListener('click',function(){d.close();});h.appendChild(x);d.appendChild(h);var body=E('div','fm-dialog-body');if(typeof bodyNode==='string')body.innerHTML=bodyNode;else body.appendChild(bodyNode);d.appendChild(body);d.showModal();return d;}
  function renderFinal(target){var FM=window.FarmaciaManipulacao,result=collectFinal();target.innerHTML='';var wrap=E('section','fm-final-section');wrap.appendChild(E('h2','fm-section-title','Fechamento do relatório'));
    var pend=E('section','fm-final-card');pend.appendChild(E('h3','', '10. Documentação Pendente'));if(result.pending.length){var ul=E('ol','fm-final-list');result.pending.forEach(function(x){var li=E('li','',x.label+' — '+(x.status==='NAO'?'Não apresentado':'Necessita atualização/complementação')+(x.notes?' — '+x.notes:''));ul.appendChild(li);});pend.appendChild(ul);}else pend.appendChild(E('p','fm-helper-text','Nenhum documento pendente consolidado até o momento.'));pend.appendChild(E('p','fm-helper-text','“Apresentado com observação” não entra automaticamente como documentação pendente; a equipe define a necessidade de complementação.'));pend.appendChild(finalField('sections.final.pendenciasComplementares','Complementos, prazos e observações de documentação',5));wrap.appendChild(pend);
    var nc=E('section','fm-final-card');nc.appendChild(E('h3','', '11. Não Conformidades'));if(result.nc.length){var ncul=E('ol','fm-final-list');result.nc.forEach(function(x){ncul.appendChild(E('li','',x.label+(x.notes?' — '+x.notes:' — constatação ainda sem anotação.')));});nc.appendChild(ncul);}else nc.appendChild(E('p','fm-helper-text','Nenhum item marcado como Não Conforme até o momento.'));nc.appendChild(E('p','fm-helper-text','A consolidação não cria NC a partir de foto, OCR, campo vazio ou anotação isolada. Apenas itens expressamente marcados como NC entram nesta lista.'));wrap.appendChild(nc);
    var risk=E('section','fm-final-card');risk.appendChild(E('h3','', '12. Considerações Finais / Avaliação de Risco'));risk.appendChild(finalField('sections.final.consideracoes','Avaliação de risco, orientações prestadas e avaliação geral das Boas Práticas',7));wrap.appendChild(risk);
    var cls=E('section','fm-final-card');cls.appendChild(E('h3','', '13. Conclusão'));cls.appendChild(E('p','fm-helper-text','A classificação é escolhida expressamente pela autoridade sanitária. O aplicativo não decide automaticamente.'));var options=['Satisfatório','Satisfatório com restrições','Insatisfatório','Insatisfatório com Interdição Parcial','Insatisfatório com Interdição Total'],current=FM.get('sections.final.classificacao',''),list=E('div','fm-classifications');options.forEach(function(v){var l=E('label'),r=document.createElement('input');r.type='radio';r.name='fm-classificacao';r.value=v;r.checked=current===v;r.addEventListener('change',function(){if(r.checked)FM.set('sections.final.classificacao',v,{source:'final-classification'});});l.appendChild(r);l.appendChild(E('span','',v));list.appendChild(l);});cls.appendChild(list);wrap.appendChild(cls);
    var measures=E('section','fm-final-card');measures.appendChild(E('h3','', '14. Medidas Adotadas / Documentos Emitidos'));measures.appendChild(finalField('sections.final.medidas','Auto de Infração, Termo de Interdição e outros documentos/medidas',5));wrap.appendChild(measures);
    var team=E('section','fm-final-card');team.appendChild(E('h3','', '15. Equipe Inspetora'));team.appendChild(finalField('sections.final.equipe','Autoridades sanitárias / matrículas',5));wrap.appendChild(team);
    var actions=E('div','fm-final-actions'),preview=E('button','fm-secondary-button','Gerar prévia textual do relatório');preview.type='button';preview.addEventListener('click',function(){var ta=document.createElement('textarea');ta.value=reportText();dialog('Prévia textual do relatório',ta);});actions.appendChild(preview);wrap.appendChild(actions);target.appendChild(wrap);
  }

  function show(id){var FM=window.FarmaciaManipulacao;if(!FM)return;active=id||'section1';FM.set('meta.activeSection',active,{source:'navigation',silent:true});renderNav();var main=ensureRoot().querySelector('.fm-app-content');main.innerHTML='';if(active==='final'){renderFinal(main);return;}var section=FM.sections&&FM.sections[active];if(!section||typeof section.render!=='function'){main.appendChild(E('p','fm-helper-text','Seção ainda não carregada.'));return;}section.render(main);main.scrollTop=0;}
  function open(){ensureModules().then(function(){ensureRoot();var FM=window.FarmaciaManipulacao;active=FM.get('meta.activeSection','section1')||'section1';root.classList.add('is-open');document.documentElement.style.overflow='hidden';show(active);}).catch(function(err){console.error(err);alert('Não foi possível abrir o módulo de Farmácia de Manipulação. Atualize a página e tente novamente.');});}
  function close(){if(!root)return;root.classList.remove('is-open');document.documentElement.style.overflow='';}

  document.addEventListener('click',function(e){if(isLauncher(e.target)){e.preventDefault();e.stopImmediatePropagation();open();}},true);
  window.addEventListener('farmacia-manipulacao:navigate-request',function(e){var section=e.detail&&e.detail.section;if(section&&/^section[1-9]$/.test(section)){open();ensureModules().then(function(){show(section);});}});
  window.addEventListener('farmacia-manipulacao:ocr-request',function(e){var FM=window.FarmaciaManipulacao;if(FM&&FM.ocrAdapter&&typeof FM.ocrAdapter.request==='function'){FM.ocrAdapter.request(e.detail||{});return;}var p=E('p','', 'O leitor específico para este documento será conectado na etapa de OCR. Nenhum dado será aplicado automaticamente sem conferência.');dialog('Leitor de documento',p);});
  window.addEventListener('farmacia-manipulacao:lookup-request',function(e){var FM=window.FarmaciaManipulacao;if(FM&&FM.lookupAdapter&&typeof FM.lookupAdapter.request==='function'){FM.lookupAdapter.request(e.detail||{});return;}var p=E('p','', (e.detail&&e.detail.lookupType==='ifa')?'A consulta IFA está reservada para a fonte oficial compartilhada. O esquema da base será validado antes de ativar a pesquisa.':'Consulta reservada para integração com as bases compartilhadas.');dialog('Consulta',p);});

  window.openFarmaciaManipulacao = open;
  window.closeFarmaciaManipulacao = close;
})(window, document);