/* Farmácia de Manipulação — complemento específico do OCR de CRT/CRF.
 * Mantém o motor OCR compartilhado, mas estrutura os horários por profissional.
 * A CRT não recebe campo de validade; todos os dados continuam sujeitos a revisão.
 */
(function(window,document){
  'use strict';
  var FM=window.FarmaciaManipulacao,base=FM&&FM.ocrAdapter;
  if(!FM||!base||window.__FM_CRT_OCR_PATCH__)return;
  window.__FM_CRT_OCR_PATCH__=true;

  function E(tag,cls,text){var e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
  function txt(v){return String(v==null?'':v).replace(/\r/g,'');}
  function clean(v){return txt(v).replace(/[ \t]+/g,' ').trim();}
  function norm(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
  function toIso(v){if(/^\d{4}-\d{2}-\d{2}$/.test(clean(v)))return clean(v);var m=clean(v).match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);return m?m[3]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[1]).padStart(2,'0'):'';}
  function unique(a){var out=[];(a||[]).forEach(function(v){v=clean(v);if(v&&out.indexOf(v)<0)out.push(v);});return out;}
  function splitNames(v){var s=txt(v);var p=s.split(/;|\n|\s{3,}/).map(clean).filter(Boolean);if(p.length>1)return p;var hits=s.match(/(?:Dr(?:a)?\.?\s+)[^;\n]+?(?=(?:\s+Dr(?:a)?\.?\s+)|$)/gi);return hits&&hits.length?hits.map(clean):p;}
  function splitCrfs(v){var a=txt(v).match(/\b\d{4,8}\b/g);return unique(a||txt(v).split(/;|\n|\//));}
  function lines(raw){return txt(raw).split('\n').map(clean).filter(Boolean);}
  function findAnchor(ls,name,crf,from){var nn=norm(name),cd=String(crf||'').replace(/\D/g,'');for(var i=from||0;i<ls.length;i++){var ln=norm(ls[i]);if(nn&&nn.length>4&&ln.indexOf(nn)>=0)return i;if(cd&&ls[i].replace(/\D/g,'').indexOf(cd)>=0)return i;}return -1;}
  function collectSchedule(ls,start,end){var out=[];start=Math.max(0,start||0);end=Math.min(ls.length,end==null?ls.length:end);for(var i=start;i<end;i++){var n=norm(ls[i]);if(/rotina|plantao|intervalo|seg\b|ter\b|qua\b|qui\b|sex\b|sab\b|dom\b|segunda|terca|quarta|quinta|sexta|sábado|sabado|domingo/.test(n))out.push(ls[i]);}return unique(out).join(' | ');}
  function establishmentSchedule(ls,fallback){var a=-1,b=ls.length;for(var i=0;i<ls.length;i++){var n=norm(ls[i]);if(a<0&&/horario.*funcionamento.*estabelecimento/.test(n))a=i+1;else if(a>=0&&/responsavel tecnico/.test(n)){b=i;break;}}var out=a>=0?collectSchedule(ls,a,b):'';return out||clean(fallback);}
  function structured(baseResult){
    var f=Object.assign({},baseResult.fields||{}),raw=baseResult.rawText||'',ls=lines(raw),names=splitNames(f.responsavel_tecnico_substituto),crfs=splitCrfs(f.numero_conselho_responsavel_tecnico_substituto),rtName=clean(f.responsavel_tecnico),rtCrf=clean(f.numero_conselho_responsavel_tecnico),people=[];
    if(rtName||rtCrf)people.push({kind:'rt',nome:rtName,crf:rtCrf});
    for(var i=0;i<Math.max(names.length,crfs.length);i++)people.push({kind:'sub',nome:names[i]||'',crf:crfs[i]||''});
    var anchors=[];people.forEach(function(p,idx){var at=findAnchor(ls,p.nome,p.crf,0);anchors.push({idx:idx,at:at});});
    anchors.sort(function(a,b){if(a.at<0)return 1;if(b.at<0)return -1;return a.at-b.at;});
    anchors.forEach(function(a,pos){if(a.at<0)return;var next=pos+1<anchors.length&&anchors[pos+1].at>=0?anchors[pos+1].at:ls.length;people[a.idx].horario=collectSchedule(ls,a.at+1,next);});
    var subs=people.filter(function(p){return p.kind==='sub'&&(p.nome||p.crf);});
    return {
      numero_certidao:f.numero_certidao||'',
      razao_social:f.razao_social||'',
      cnpj:f.cnpj||'',
      ramo_atividade:f.ramo_atividade||'',
      horario_estabelecimento:establishmentSchedule(ls,f.rotina||''),
      responsavel_tecnico:rtName,
      numero_conselho_responsavel_tecnico:rtCrf,
      horario_rt:(people.filter(function(p){return p.kind==='rt';})[0]||{}).horario||'',
      substitutos:subs.map(function(p){return [p.nome,p.crf,p.horario||''].join(' | ');}).join('\n'),
      data_emissao:f.data_emissao||''
    };
  }
  function label(k){return ({numero_certidao:'Número da certidão',razao_social:'Razão social',cnpj:'CNPJ',ramo_atividade:'Ramo de atividade',horario_estabelecimento:'Horário do estabelecimento',responsavel_tecnico:'Responsável técnico principal',numero_conselho_responsavel_tecnico:'CRF do RT principal',horario_rt:'Horário de assistência do RT principal',substitutos:'Substitutos — Nome | CRF | Horário',data_emissao:'Data de emissão'})[k]||k;}
  function review(fields,raw){return new Promise(function(resolve){var d=document.getElementById('fm-crt-review');if(!d){d=document.createElement('dialog');d.id='fm-crt-review';d.className='fm-dialog';document.body.appendChild(d);}d.innerHTML='';var h=E('header');h.appendChild(E('strong','','CRT/CRF — conferir dados e horários'));var close=E('button','','Cancelar ×');close.type='button';h.appendChild(close);d.appendChild(h);var body=E('div','fm-dialog-body');body.appendChild(E('p','fm-helper-text','Cada substituto permanece em linha própria no formato Nome | CRF | Horário. A CRT não possui campo de validade. Confira todos os horários antes de aplicar.'));var grid=E('div','fm-field-grid');Object.keys(fields).forEach(function(k){var l=E('label','fm-field');l.appendChild(E('span','fm-field-label',label(k)));var val=clean(fields[k]),i=(k==='substitutos'||k.indexOf('horario')>=0)?document.createElement('textarea'):document.createElement('input');if(i.tagName==='TEXTAREA')i.rows=k==='substitutos'?6:3;i.className='fm-input';i.value=val;i.addEventListener('input',function(){fields[k]=i.value;});l.appendChild(i);grid.appendChild(l);});body.appendChild(grid);var det=document.createElement('details'),sum=document.createElement('summary');sum.textContent='Texto integral extraído';det.appendChild(sum);var ta=document.createElement('textarea');ta.rows=12;ta.readOnly=true;ta.value=raw||'';det.appendChild(ta);body.appendChild(det);var apply=E('button','fm-secondary-button','Conferir e aplicar');apply.type='button';body.appendChild(apply);d.appendChild(body);function done(v){if(d.open)d.close();resolve(v);}close.onclick=function(){done(null);};d.addEventListener('cancel',function(e){e.preventDefault();done(null);},{once:true});apply.onclick=function(){done(fields);};d.showModal();});}
  function parseSubstitutes(text){return txt(text).split('\n').map(clean).filter(Boolean).map(function(line){var p=line.split('|').map(clean);return {nome:p[0]||'',crf:p[1]||'',horario:p.slice(2).join(' | ')||''};});}
  function progressDialog(){var d=document.getElementById('fm-crt-progress');if(!d){d=document.createElement('dialog');d.id='fm-crt-progress';d.className='fm-dialog';document.body.appendChild(d);}d.innerHTML='';var h=E('header');h.appendChild(E('strong','','Lendo CRT/CRF'));d.appendChild(h);var body=E('div','fm-dialog-body'),p=E('p','fm-helper-text','Preparando leitura…');body.appendChild(p);d.appendChild(body);return {dialog:d,status:p};}
  function requestCrt(detail){var input=document.createElement('input');input.type='file';input.accept='image/*,.pdf';input.capture=detail.source==='camera'?'environment':undefined;input.style.display='none';document.body.appendChild(input);input.onchange=async function(){var file=input.files&&input.files[0];input.remove();if(!file)return;var prog=progressDialog();prog.dialog.showModal();try{var res=await base.readDocument(detail,file,function(m){prog.status.textContent=m;});if(prog.dialog.open)prog.dialog.close();var fields=structured(res),checked=await review(fields,res.rawText||'');if(!checked)return;var ref=await base.saveOriginal(file,'crt-crf',detail.destination);FM.set(detail.destination,{numeroCertidao:checked.numero_certidao||'',razaoSocial:checked.razao_social||'',cnpj:checked.cnpj||'',ramoAtividade:checked.ramo_atividade||'',horarioEstabelecimento:checked.horario_estabelecimento||'',rtNome:checked.responsavel_tecnico||'',rtCrf:checked.numero_conselho_responsavel_tecnico||'',rtHorario:checked.horario_rt||'',dataEmissao:toIso(checked.data_emissao),substitutos:parseSubstitutes(checked.substitutos),sourceDocument:ref},{source:'ocr-reviewed'});FM.emit('ocr-applied',{documentType:'crt-crf',destination:detail.destination,fields:checked,document:ref});}catch(err){if(prog.dialog.open)prog.dialog.close();alert('Não foi possível ler a CRT/CRF: '+(err&&err.message||err));console.error(err);}};input.click();}

  var wrapped={
    request:function(detail){detail=detail||{};return detail.documentType==='crt-crf'?requestCrt(detail):base.request(detail);},
    readDocument:base.readDocument,
    saveOriginal:base.saveOriginal
  };
  FM.registerOCRAdapter(wrapped);
})(window,document);