/* Farmácia de Manipulação — adaptadores de OCR, documentos e fotos.
 * Reutiliza o motor OCR já validado em Drogaria para leitura de PDF/imagem.
 * Nenhum dado é aplicado sem revisão expressa da equipe.
 */
(function (window, document) {
  'use strict';
  var FM = window.FarmaciaManipulacao;
  if (!FM || window.FarmaciaManipulacaoOCR) return;

  var DOC_DB = 'farmacia-manipulacao-documentos-v1';
  var DOC_STORE = 'docs';
  var docDbPromise = null;
  var activeFile = null;

  function E(tag, cls, text) { var e=document.createElement(tag); if(cls)e.className=cls; if(text!=null)e.textContent=text; return e; }
  function txt(v){ return String(v==null?'':v).replace(/\r/g,''); }
  function clean(v){ return txt(v).replace(/[ \t]+/g,' ').replace(/^\s+|\s+$/g,''); }
  function norm(v){ return txt(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
  function digits(v){ return txt(v).replace(/\D/g,''); }
  function first(rx,s){ var m=txt(s).match(rx); return m?clean(m[1]||m[0]):''; }
  function toIso(v){
    if (/^\d{4}-\d{2}-\d{2}$/.test(txt(v))) return txt(v);
    var m=txt(v).match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
    return m?m[3]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[1]).padStart(2,'0'):'';
  }
  function dateIn(s){ return first(/\b(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4})\b/,s); }
  function afterLabel(raw, labels, max){
    var lines=txt(raw).split('\n');
    var rx=new RegExp('(?:'+labels+')\\s*[:\\-]?\\s*(.*)$','i');
    for(var i=0;i<lines.length;i++){var m=lines[i].match(rx);if(m&&clean(m[1]))return clean(m[1]).slice(0,max||500);}
    return '';
  }
  function between(raw,start,end,max){
    var n=norm(raw),a=n.search(start); if(a<0)return ''; var tail=txt(raw).slice(a); var tn=norm(tail),b=end?tn.search(end):-1; var out=b>0?tail.slice(0,b):tail; return clean(out.replace(/\s*\n\s*/g,'\n')).slice(0,max||4000);
  }
  function unique(arr){ return Array.from(new Set((arr||[]).map(clean).filter(Boolean))); }
  function cnpjIn(raw){var m=txt(raw).match(/\b(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/);return m?m[1]:'';}
  function cpfIn(raw){var m=txt(raw).match(/\b(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/);return m?m[1]:'';}
  function result(title,type,fields,raw,source){return {documentTitle:title,documentType:type,fields:fields||{},rawText:txt(raw),source:source||{},status:'conferencia_obrigatoria'};}

  function openDb(){
    if(docDbPromise)return docDbPromise;
    docDbPromise=new Promise(function(resolve,reject){
      var r=indexedDB.open(DOC_DB,1);
      r.onupgradeneeded=function(){if(!r.result.objectStoreNames.contains(DOC_STORE))r.result.createObjectStore(DOC_STORE,{keyPath:'id'});};
      r.onsuccess=function(){resolve(r.result);}; r.onerror=function(){reject(r.error);};
    });
    return docDbPromise;
  }
  async function saveOriginal(file,type,destination){
    if(!file)return null;var db=await openDb(),id='fmdoc_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8),record={id:id,type:type,destination:destination||'',filename:file.name||'',mime:file.type||'',size:file.size||0,createdAt:new Date().toISOString(),blob:file};
    await new Promise(function(resolve,reject){var tx=db.transaction(DOC_STORE,'readwrite');tx.objectStore(DOC_STORE).put(record);tx.oncomplete=resolve;tx.onerror=function(){reject(tx.error);};});
    return {id:id,filename:record.filename,mime:record.mime,size:record.size,createdAt:record.createdAt};
  }
  function parseAso(base){
    var raw=base.rawText||'', f=Object.assign({},base.fields||{}), n=norm(raw);
    f.cpf = afterLabel(raw,'cpf(?:\\s+do\\s+(?:funcionario|trabalhador))?',80) || cpfIn(raw);
    f.funcao = afterLabel(raw,'fun[cç][aã]o|cargo|fun[cç][aã]o exercida',160);
    f.riscos_agentes = afterLabel(raw,'riscos?(?:\\s+ocupacionais?)?|agentes?\\s+de\\s+risco',700) || between(raw,/riscos? ocupacionais?|agentes? de risco/,/exames?|procedimentos?|aptid/,1200);
    f.exames_relacionados = between(raw,/exames? (?:complementares?|realizados?|ocupacionais?)|procedimentos? realizados?/,/apto|inapto|conclusao|medico/,1600);
    var apt=n.match(/\b(inapto|apto)\b/); f.aptidao=apt?(apt[1]==='inapto'?'Inapto':'Apto'):'';
    f.medico_examinador = f.medico_assinante || afterLabel(raw,'m[eé]dico\\s+examinador|m[eé]dico\\s+respons[aá]vel',220);
    var crm=afterLabel(raw,'crm',60); if(crm&&f.medico_examinador&&norm(f.medico_examinador).indexOf('crm')<0)f.medico_examinador+=' — CRM '+crm.replace(/[^0-9A-Za-z\/-]/g,'');
    var pcm=between(raw,/pcmso/,/examinador|assinatura|aso|$ /,500); f.medico_pcmso=afterLabel(pcm,'m[eé]dic[oa](?:\\s+coordenador[ae]?)?|respons[aá]vel',220) || '';
    return result('ASO — Atestado de Saúde Ocupacional','aso',{
      funcionario:f.nome_funcionario||'', cpf:f.cpf||'', funcao:f.funcao||'', tipoExame:f.tipo||'', dataExame:f.data_exame||f.data_emissao||'', riscos:f.riscos_agentes||'', exames:f.exames_relacionados||'', aptidao:f.aptidao||'', medico:f.medico_examinador||'', medicoPcmso:f.medico_pcmso||'', empresa:f.empresa_responsavel||''
    },raw,base.source);
  }

  function splitPeople(value){
    return txt(value).split(/;|\n/).map(clean).filter(function(x){return x&&x!=='?';});
  }
  function personLineMatches(line,name){
    var n=norm(name).replace(/^dr?a?\.?\s+/,'').trim();if(!n)return false;
    var l=norm(line),parts=n.split(/\s+/).filter(Boolean);if(l.indexOf(n)>=0)return true;
    return parts.length>1&&l.indexOf(parts[0])>=0&&l.indexOf(parts[parts.length-1])>=0;
  }
  function scheduleForPerson(raw,name,otherNames){
    if(!name)return '';
    var lines=txt(raw).split('\n').map(clean).filter(Boolean),start=-1;
    for(var i=0;i<lines.length;i++){if(personLineMatches(lines[i],name)){start=i;break;}}
    if(start<0)return '';
    var end=lines.length,others=(otherNames||[]).filter(function(x){return x&&norm(x)!==norm(name);});
    for(var j=start+1;j<lines.length;j++){
      var nl=norm(lines[j]);
      if(/esta certidao|validade.*portal|certificamos que|sao paulo.*20\d{2}/.test(nl)){end=j;break;}
      if(/farmaceutic.*substitut/.test(nl)&&j>start+1){end=j;break;}
      if(others.some(function(o){return personLineMatches(lines[j],o);})){end=j;break;}
    }
    var out=[];
    for(var k=start+1;k<end;k++){
      var n=norm(lines[k]);
      if((/rotina|plantao|horario de assistencia|intervalo/.test(n))&&/\d{1,2}\s*[:h]\s*\d{2}/i.test(lines[k]))out.push(lines[k]);
    }
    return unique(out).join(' | ');
  }
  function reviewedPeople(value){
    return txt(value).split('\n').map(clean).filter(Boolean).map(function(line){
      var parts=line.split(/\s*\|\s*/).map(clean),name=parts.shift()||'',crf='',hours=[];
      parts.forEach(function(part){var m=part.match(/^CRF\s*[:#-]?\s*([0-9A-Za-z./-]+)/i);if(m&&!crf)crf=m[1];else if(part)hours.push(part);});
      return {nome:name,crf:crf,horario:hours.join(' | ')};
    }).filter(function(x){return x.nome;});
  }
  function peopleReviewText(people){
    return (people||[]).map(function(x){return [x.nome,x.crf&&('CRF '+x.crf),x.horario].filter(Boolean).join(' | ');}).join('\n');
  }
  function parseCrt(base){
    var raw=base.rawText||'',f=base.fields||{},names=splitPeople(f.responsavel_tecnico_substituto),crfs=splitPeople(f.numero_conselho_responsavel_tecnico_substituto),all=[f.responsavel_tecnico||''].concat(names).filter(Boolean);
    var subs=names.map(function(name,i){return {nome:name,crf:crfs[i]&&crfs[i]!=='?'?crfs[i]:'',horario:scheduleForPerson(raw,name,all)};});
    return result('Certidão de Regularidade Técnica — CRF','crt-crf',{
      numeroCertidao:f.numero_certidao||'',razaoSocial:f.razao_social||'',cnpj:f.cnpj||'',ramoAtividade:f.ramo_atividade||'',horarioEstabelecimento:f.rotina||'',rtNome:f.responsavel_tecnico||'',rtCrf:f.numero_conselho_responsavel_tecnico||'',rtHorario:scheduleForPerson(raw,f.responsavel_tecnico,all),substitutos:peopleReviewText(subs),dataEmissao:f.data_emissao||''
    },raw,base.source);
  }
  function parseLicense(base){
    var f=base.fields||{},names=splitPeople(f.responsavel_tecnico_substituto),crfs=splitPeople(f.numero_conselho_responsavel_tecnico_substituto),subs=names.map(function(name,i){return {nome:name,crf:crfs[i]&&crfs[i]!=='?'?crfs[i]:'',horario:''};});
    return result('Licença Sanitária','licenca-sanitaria',{
      numero:f.numero_cevs_ou_cmvs||'',validade:f.validade||'',titular:f.razao_social||'',cnpj:f.cnpj||'',atividades:f.atividades_licenciadas||'',grupos:'',rtNome:f.responsavel_tecnico||'',rtCrf:f.numero_conselho_responsavel_tecnico||'',substitutos:peopleReviewText(subs)
    },base.rawText,base.source);
  }

  function parseCalibration(base){var f=base.fields||{};return result('Certificado de calibração','certificado-calibracao',{instrumento:f.instrumento_equipamento||'',identificacao:f.identificacao||'',certificado:f.numero_certificado||'',validade:f.validade||'',emitidoPor:f.empresa_responsavel||'',numeroSerie:f.numero_serie||'',marca:f.marca_fabricante||'',modelo:f.modelo||'',dataCalibracao:f.data_calibracao||''},base.rawText,base.source);}
  function parseSimple(base,type){return result(base.documentTitle||type,type,Object.assign({},base.fields||{}),base.rawText,base.source);}
  function parseDanfe(base){
    var raw=base.rawText||'',f=base.fields||{},prod=between(raw,/dados dos produtos|produtos\s*\/\s*servicos|descricao dos produtos/,/calculo do issqn|dados adicionais|transportador|fatura|duplicata/,4500);
    return result('DANFE / Nota Fiscal','danfe',{numeroNota:f.numero_nota||afterLabel(raw,'n[ºo]\\.?\\s*da\\s*nota|n[uú]mero\\s+da\\s+nota',80),serie:afterLabel(raw,'s[eé]rie',60),dataEmissao:f.data_emissao||afterLabel(raw,'data\\s+de\\s+emiss[aã]o',80),emitente:f.razao_social_emitente||'',cnpjEmitente:f.cnpj_emitente||'',destinatario:afterLabel(raw,'destinat[aá]rio\\s*\/\\s*remetente|nome\\s*\/\\s*raz[aã]o\\s+social',250),cnpjDestinatario:afterLabel(raw,'cnpj\\s*\/\\s*cpf',80),produtos:prod||''},raw,base.source);
  }
  function parseCoa(raw,source){
    var title=afterLabel(raw,'produto|mat[eé]ria[- ]prima|subst[aâ]ncia|nome\\s+do\\s+produto',250), lot=afterLabel(raw,'lote(?:\\s+do\\s+fabricante)?',120), num=afterLabel(raw,'certificado(?:\\s+de\\s+an[aá]lise)?\\s*n?[ºo]?|relat[oó]rio\\s+de\\s+ensaio\\s*n?[ºo]?',120);
    var params=between(raw,/ensaio|par[aâ]metro|an[aá]lise|especifica[cç][aã]o/,/conclus[aã]o|parecer|observa[cç][oõ]es|assinatura/,5000);
    return result('Certificado de Análise','certificado-analise',{material:title,loteFabricante:lot,loteInterno:afterLabel(raw,'lote\\s+interno|lote\\s+farm[aá]cia',120),fabricante:afterLabel(raw,'fabricante|manufacturer',250),numeroCertificado:num,dataFabricacao:afterLabel(raw,'data\\s+de\\s+fabrica[cç][aã]o|fabrica[cç][aã]o',100),validade:afterLabel(raw,'validade|vencimento',100),dataAnalise:afterLabel(raw,'data\\s+da\\s+an[aá]lise|analisado\\s+em',100),parametros:params,conclusao:afterLabel(raw,'conclus[aã]o|resultado\\s+final|parecer',500)},raw,source);
  }
  function parseOm(raw,source){
    var number=afterLabel(raw,'ordem\\s+de\\s+manipula[cç][aã]o|requisi[cç][aã]o|n[ºo]\\s+da\\s+ordem',100), date=afterLabel(raw,'data\\s+da\\s+manipula[cç][aã]o|data\\s+de\\s+manipula[cç][aã]o|data\\s*:',100), patient=afterLabel(raw,'paciente|cliente',220), product=afterLabel(raw,'produto|f[oó]rmula|prepara[cç][aã]o',300), manip=afterLabel(raw,'manipulado\\s+por|manipulador|t[eé]cnico',220);
    var components=between(raw,/composi[cç][aã]o|componentes?|mat[eé]rias?[- ]primas?|f[oó]rmula/,/controle de qualidade|rotulagem|confer[eê]ncia|farmac[eê]utico|observa[cç]/,5000);
    return result('Ordem de Manipulação','ordem-manipulacao',{numero:number,data:dateIn(date)||date,paciente:patient,produto:product,manipulador:manip,componentes:components},raw,source);
  }
  function parseAssay(raw,source,profile){
    var number=afterLabel(raw,'relat[oó]rio\\s+de\\s+ensaios?\\s*n?[ºo]?|certificado\\s*n?[ºo]?',140), sample=afterLabel(raw,'amostra(?:\\(s\\))?|produto\\s*\/\\s*amostra',300), code=afterLabel(raw,'c[oó]digo',100), lot=afterLabel(raw,'lote',120), collection=afterLabel(raw,'coleta(?:\\s+em)?|data\\s+de\\s+coleta',160), receipt=afterLabel(raw,'recep[cç][aã]o|recebimento',120), issued=afterLabel(raw,'emitido\\s+em|data\\s+de\\s+emiss[aã]o',120), point=afterLabel(raw,'ponto\\s+de\\s+coleta|local\\s+de\\s+coleta|origem\\s+da\\s+amostra',300), validity=afterLabel(raw,'validade|vencimento',120);
    if(!point&&sample){var pm=sample.match(/-\s*(.+?)(?:\s+c[oó]digo\b|\s+coleta\b|$)/i);if(pm)point=clean(pm[1]);}
    var tests=between(raw,/ensaio\s+resultado|par[aâ]metro\s+resultado|ensaio/,/interpreta[cç][aã]o de resultados|conclus[aã]o|legenda|observa[cç]/,6500);
    var conclusion=afterLabel(raw,'interpreta[cç][aã]o\\s+de\\s+resultados|conclus[aã]o|resultado\\s+final',1000);
    return result('Relatório de Ensaio','relatorio-ensaio',{perfil:profile||'',relatorio:number,amostra:sample,pontoColeta:point,codigoAmostra:code,lote:lot,fabricante:afterLabel(raw,'fabricante',250),validade:validity,coleta:collection,recebimento:receipt,emissao:issued,conclusao:conclusion,ensaios:tests},raw,source);
  }
  function parseHomeo(raw,source){return result('Documento de matriz / insumo homeopático','matriz-homeopatica',{matriz:afterLabel(raw,'matriz|tintura[- ]m[aã]e|insumo',280),lote:afterLabel(raw,'lote',120),dinamizacao:afterLabel(raw,'dinamiza[cç][aã]o|pot[eê]ncia',120),escala:afterLabel(raw,'escala',100),metodo:afterLabel(raw,'m[eé]todo',180),teorAlcoolico:afterLabel(raw,'teor\\s+alco[oó]lico|alcool',140),origem:afterLabel(raw,'origem|fabricante',280),validade:afterLabel(raw,'validade',100),certificado:afterLabel(raw,'certificado|relat[oó]rio',140)},raw,source);}

  async function genericText(file,progress){
    var D=window.DrogariaOcrTools;if(!D)throw new Error('Motor OCR da Drogaria ainda não está disponível.');
    return await D.read('sumario_documentos',file,progress||function(){});
  }
  async function readDocument(detail,file,progress){
    var D=window.DrogariaOcrTools;if(!D)throw new Error('Motor OCR compartilhado não carregado.');
    var type=detail.documentType||'',base;
    if(type==='licenca-sanitaria'){base=await D.read('licenca_sanitaria',file,progress);return parseLicense(base);}
    if(type==='crt-crf'){base=await D.read('certidao_regularidade_crf',file,progress);return parseCrt(base);}
    if(type==='aso'){base=await D.read('aso',file,progress);return parseAso(base);}
    if(type==='certificado-calibracao'){base=await D.read('calibracao_termohigrometro',file,progress);return parseCalibration(base);}
    if(type==='avcb-clcb'){base=await D.read('avcb_clcb',file,progress);return parseSimple(base,type);}
    if(type==='controle-pragas'){base=await D.read('controle_pragas_urbanas',file,progress);return parseSimple(base,type);}
    if(type==='limpeza-caixa-dagua'){base=await D.read('higienizacao_caixa_agua',file,progress);return parseSimple(base,type);}
    if(type==='danfe'){base=await D.read('danfe_nfe',file,progress);return parseDanfe(base);}
    base=await genericText(file,progress);
    if(type==='certificado-analise')return parseCoa(base.rawText,base.source);
    if(type==='ordem-manipulacao')return parseOm(base.rawText,base.source);
    if(type==='relatorio-ensaio')return parseAssay(base.rawText,base.source,detail.profile);
    if(type==='matriz-homeopatica')return parseHomeo(base.rawText,base.source);
    return result(base.documentTitle||type,type,Object.assign({},base.fields||{}),base.rawText,base.source);
  }

  function labelFor(k){var map={funcionario:'Funcionário',cpf:'CPF',funcao:'Função',tipoExame:'Tipo de exame',dataExame:'Data do exame',riscos:'Riscos / agentes',exames:'Exames relacionados',aptidao:'Aptidão',medico:'Médico examinador',medicoPcmso:'Responsável PCMSO',empresa:'Empresa',instrumento:'Instrumento',identificacao:'Identificação',certificado:'Certificado',validade:'Validade',emitidoPor:'Emitido por',numeroNota:'Nº da nota',serie:'Série',dataEmissao:'Data de emissão',emitente:'Emitente',cnpjEmitente:'CNPJ emitente',destinatario:'Destinatário',cnpjDestinatario:'CNPJ destinatário',produtos:'Produtos / itens extraídos',material:'Material / substância',loteFabricante:'Lote do fabricante',loteInterno:'Lote interno',fabricante:'Fabricante',numeroCertificado:'Nº certificado',dataFabricacao:'Fabricação',dataAnalise:'Data da análise',parametros:'Parâmetros / resultados',conclusao:'Conclusão textual',numero:'Número',data:'Data',paciente:'Paciente',produto:'Produto',manipulador:'Manipulador',componentes:'Componentes / insumos',perfil:'Perfil',relatorio:'Relatório nº',amostra:'Amostra',pontoColeta:'Ponto de coleta / origem',codigoAmostra:'Código da amostra',coleta:'Coleta',recebimento:'Recebimento',emissao:'Emissão',ensaios:'Ensaios',matriz:'Matriz / insumo',dinamizacao:'Dinamização',escala:'Escala',metodo:'Método',teorAlcoolico:'Teor alcoólico',origem:'Origem'};return map[k]||k.replace(/_/g,' ');}
  function reviewDialog(res,detail,file){
    return new Promise(function(resolve){
      var d=document.getElementById('fm-ocr-review');if(!d){d=document.createElement('dialog');d.id='fm-ocr-review';d.className='fm-dialog';document.body.appendChild(d);}d.innerHTML='';
      var h=E('header');h.appendChild(E('strong','',res.documentTitle||'Conferência do documento'));var close=E('button','', 'Cancelar ×');close.type='button';h.appendChild(close);d.appendChild(h);
      var body=E('div','fm-dialog-body'),note=E('p','fm-helper-text','Confira e edite os dados antes de aplicar. O OCR não realiza julgamento sanitário.');body.appendChild(note);
      var fields=Object.assign({},res.fields||{}),grid=E('div','fm-field-grid');Object.keys(fields).forEach(function(k){var l=E('label','fm-field');l.appendChild(E('span','fm-field-label',labelFor(k)));var val=txt(fields[k]),input=(val.length>140||/parametros|ensaios|produtos|componentes|conclusao|riscos|exames/i.test(k))?document.createElement('textarea'):document.createElement('input');if(input.tagName==='TEXTAREA')input.rows=4;input.className='fm-input';input.value=val;input.addEventListener('input',function(){fields[k]=input.value;});l.appendChild(input);grid.appendChild(l);});body.appendChild(grid);
      var det=document.createElement('details');var sum=document.createElement('summary');sum.textContent='Texto extraído do documento';det.appendChild(sum);var raw=document.createElement('textarea');raw.rows=12;raw.readOnly=true;raw.value=res.rawText||'';det.appendChild(raw);body.appendChild(det);
      var actions=E('div','fm-document-actions'),apply=E('button','fm-secondary-button','Conferir e aplicar');apply.type='button';actions.appendChild(apply);body.appendChild(actions);d.appendChild(body);
      function done(v){if(d.open)d.close();resolve(v);}close.onclick=function(){done(null);};d.addEventListener('cancel',function(e){e.preventDefault();done(null);},{once:true});apply.onclick=function(){done({fields:fields,result:res,file:file,detail:detail});};d.showModal();
    });
  }

  function applyExisting(type,dest,fields,docRef){
    if(type==='licenca-sanitaria'){
      FM.set(dest,{numero:fields.numero||'',validade:toIso(fields.validade),titular:fields.titular||'',cnpj:fields.cnpj||'',atividades:fields.atividades||'',grupos:fields.grupos||'',rtNome:fields.rtNome||'',rtCrf:fields.rtCrf||'',substitutos:reviewedPeople(fields.substitutos),sourceDocument:docRef},{source:'ocr-reviewed'});return;
    }
    if(type==='crt-crf'){
      FM.set(dest,{numeroCertidao:fields.numeroCertidao||'',razaoSocial:fields.razaoSocial||'',cnpj:fields.cnpj||'',ramoAtividade:fields.ramoAtividade||'',horarioEstabelecimento:fields.horarioEstabelecimento||'',rtNome:fields.rtNome||'',rtCrf:fields.rtCrf||'',rtHorario:fields.rtHorario||'',dataEmissao:toIso(fields.dataEmissao),substitutos:reviewedPeople(fields.substitutos),sourceDocument:docRef},{source:'ocr-reviewed'});return;
    }
    FM.set(dest,Object.assign({},fields,{sourceDocument:docRef}),{source:'ocr-reviewed'});
  }
  function applyResult(detail,fields,docRef){
    var dest=detail.destination||'',type=detail.documentType||'';
    if(type==='aso'){
      var rows=FM.get(dest,[]);if(!Array.isArray(rows))rows=[];rows.push({funcionario:fields.funcionario||'',cpf:fields.cpf||'',funcao:fields.funcao||'',tipoExame:fields.tipoExame||'',dataExame:fields.dataExame||'',riscos:fields.riscos||'',exames:fields.exames||'',aptidao:fields.aptidao||'',medico:fields.medico||'',medicoPcmso:fields.medicoPcmso||'',empresa:fields.empresa||'',sourceDocument:docRef});FM.set(dest,rows,{source:'ocr-reviewed'});return;
    }
    if(type==='certificado-calibracao'){
      var inst=FM.get(dest,[]);if(!Array.isArray(inst))inst=[];inst.push({instrumento:fields.instrumento||'',identificacao:fields.identificacao||'',certificado:fields.certificado||'',validade:fields.validade||'',emitidoPor:fields.emitidoPor||'',numeroSerie:fields.numeroSerie||'',marca:fields.marca||'',modelo:fields.modelo||'',sourceDocument:docRef});FM.set(dest,inst,{source:'ocr-reviewed'});return;
    }
    if(type==='relatorio-ensaio'){
      var ev=FM.get(dest,[]);if(!Array.isArray(ev))ev=[];ev.push({coleta:fields.coleta||'',pontoColeta:fields.pontoColeta||'',certificados:fields.relatorio||'',amostra:fields.amostra||'',codigoAmostra:fields.codigoAmostra||'',lote:fields.lote||'',fabricante:fields.fabricante||'',validade:fields.validade||'',recebimento:fields.recebimento||'',emissao:fields.emissao||'',resultado:fields.conclusao||'',ensaios:fields.ensaios||'',sourceDocument:docRef});FM.set(dest,ev,{source:'ocr-reviewed'});return;
    }
    applyExisting(type,dest,fields,docRef);
  }

  async function request(detail){
    detail=detail||{};var accept='image/*,.pdf,.docx,.xml',input=document.createElement('input');input.type='file';input.accept=accept;input.capture=detail.source==='camera'?'environment':undefined;input.style.display='none';document.body.appendChild(input);
    input.onchange=async function(){var file=input.files&&input.files[0];input.remove();if(!file)return;activeFile=file;var progressBox=E('p','fm-helper-text','Preparando leitura…');var d=document.getElementById('fm-ocr-progress');if(!d){d=document.createElement('dialog');d.id='fm-ocr-progress';d.className='fm-dialog';document.body.appendChild(d);}d.innerHTML='';var h=E('header');h.appendChild(E('strong','', 'Lendo documento'));d.appendChild(h);var body=E('div','fm-dialog-body');body.appendChild(progressBox);d.appendChild(body);d.showModal();try{var res=await readDocument(detail,file,function(m){progressBox.textContent=m;});d.close();var reviewed=await reviewDialog(res,detail,file);if(!reviewed)return;var docRef=await saveOriginal(file,detail.documentType,detail.destination);applyResult(detail,reviewed.fields,docRef);FM.emit('ocr-applied',{documentType:detail.documentType,destination:detail.destination,fields:reviewed.fields,document:docRef});}catch(err){if(d.open)d.close();alert('Não foi possível ler o documento: '+(err&&err.message||err));console.error(err);}finally{activeFile=null;}};input.click();
  }

  async function persistPhotos(event){
    var detail=event.detail||{},path=detail.path||'',files=detail.files||[];if(!files.length||!window.DrogariaOcrTools||!window.DrogariaOcrTools.fotos)return;var scope='farmacia-manipulacao';var stored=FM.get(path+'.storedPhotos',[]);if(!Array.isArray(stored))stored=[];for(var i=0;i<files.length;i++){try{var rec=await window.DrogariaOcrTools.fotos.save(scope,files[i],{section:path,caption:FM.get(path+'.notes','')});stored.push({id:rec.id,filename:rec.filename,mime:rec.mime,size:rec.size,capturedAt:rec.capturedAt});}catch(err){console.warn('[FarmaciaManipulacao] Foto não persistida',err);}}FM.set(path+'.storedPhotos',stored,{source:'photo-adapter'});
  }

  var adapter={request:request,readDocument:readDocument,saveOriginal:saveOriginal,parsers:{parseCrt:parseCrt,parseLicense:parseLicense}};
  FM.registerOCRAdapter(adapter);
  FM.on('photoselected',persistPhotos);
  window.FarmaciaManipulacaoOCR=Object.freeze(adapter);
})(window,document);