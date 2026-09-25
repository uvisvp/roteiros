/* ================================================================
   Farmácia com Manipulação v2 — 12 blocos.
   Inserido no bloco app--farmacia-manipulacao por
   scripts/repack-manipulacao-v2.cjs, antes de pharmacyInstall().
   Os dados vêm de APP_DATA (farmacia-manipulacao-v2-dados.json).
   Componentes gravam em state.v2 por caminho: data-v2="grupo|escopo|campo".
   ================================================================ */
const V2=APP_DATA.v2;
const V2_KEYS=['sit','sitout','itemNA','itemNAset','irr','eq','eqExtra','plan','obs','chips','fields','tables','rast','veg','emb','mon','out','chk','unid'];
function v2State(){state.v2=state.v2||{};for(const k of V2_KEYS)state.v2[k]=state.v2[k]||{};return state.v2}
function v2Get(path){let o=v2State();for(const k of path){if(o==null)return undefined;o=o[k]}return o}
function v2Set(path,val){let o=v2State();for(let i=0;i<path.length-1;i++){o[path[i]]=o[path[i]]&&typeof o[path[i]]==='object'?o[path[i]]:{};o=o[path[i]]}if(val===undefined||val===''||val===false)delete o[path[path.length-1]];else o[path[path.length-1]]=val}
const v2p=(...a)=>esc(a.join('|'));
function v2Val(...path){const v=v2Get(path);return v==null?'':v}

/* ---------- migração da v1 (6 cartões) ---------- */
(function v2Migrate(){
 if(state.v2schema===2)return;
 state.v2schema=2;state.openCard=null;v2State();
 const c=state.char||{};c.areas=c.areas||[];
 try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(e){}
 /* Fotos ligadas a perguntas mudam de cartão: move para o escopo do novo bloco. */
 if(!window.RoteiroEvidence||!window.fetch)return;
 const cardOf={};for(const[n,card]of Object.entries(APP_DATA.cards))for(const s of card.sections)for(const r of s.requirements)cardOf[r.id]=n;
 (async()=>{for(let old=1;old<=6;old++){let all={};try{all=await RoteiroEvidence.read('manipulacao-card-'+old)}catch(e){continue}
  for(const[k,url]of Object.entries(all)){const rid=k.split('::')[0],to=cardOf[rid];if(!to||Number(to)===old)continue;
   try{const blob=await (await fetch(url)).blob();await RoteiroEvidence.save('manipulacao-card-'+to,k,new File([blob],'foto.jpg',{type:'image/jpeg'}));await RoteiroEvidence.remove('manipulacao-card-'+old,k)}catch(e){}}}})();
})();

/* ---------- condições (caracterização) ---------- */
function conditionActive(cond){
 if(!cond)return true;const c=state.char||{};
 const cats=c.cats||[],forms=c.forms||[],preps=c.preps||[],groups=c.groups||[],areas=c.areas||[];
 const sens=cats.some(x=>['hormonios','antibioticos','penicilinicos','cefalosporinicos','citostaticos'].includes(x));
 const map={
  industrializados:!!c.industrializados,servicos:!!c.servicos,semiliquidos:forms.includes('semissolida')||forms.includes('liquida'),
  semissolida:forms.includes('semissolida'),liquida:forms.includes('liquida'),solidos:forms.includes('solida'),
  sensibilizantes:sens,hormonios:cats.includes('hormonios'),antibioticos:cats.some(x=>['antibioticos','penicilinicos','cefalosporinicos'].includes(x)),
  citostaticos:cats.includes('citostaticos'),autoisoterapicos:preps.includes('homeopaticas')&&!!c.autoisoterapicos,
  homeopatia:preps.includes('homeopaticas')||groups.includes('V'),
  sbit:c.sbit==='sim'||groups.includes('II')||(c.sbitList||[]).length>0,quimicos:c.quimicos==='sim',controle:cats.includes('controle'),
  exaustao:forms.includes('solida')||sens,vegetal:preps.includes('fitoterapicas')||!!c.vegetal,
  base_galenica:c.bases==='manipuladas'||c.bases==='ambas'||(c.basesList||[]).length>0,
  copa:areas.includes('copa'),descanso:areas.includes('descanso'),anexo3:sens||cats.includes('controle')||groups.includes('III'),remota:!!c.remota
 };return !!map[cond];
}

/* ---------- componentes ---------- */
function v2Tog(path,opts,cur){return '<div class="v2-tog">'+opts.map(([v,l,k])=>'<button type="button" data-v2t="'+esc(path+'|'+v)+'" class="'+(cur===v?k:'')+'" aria-pressed="'+(cur===v)+'">'+esc(l)+'</button>').join('')+'</div>'}
function v2Input(path,label,cls='',type='text',ph=''){const p=path.split('|');return '<label class="'+cls+'">'+esc(label)+'<input type="'+type+'" data-v2="'+esc(path)+'" value="'+esc(v2Get(p)??'')+'" placeholder="'+esc(ph)+'"></label>'}
function v2Check(path,label){return '<label class="v2-check"><input type="checkbox" data-v2="'+esc(path)+'"'+(v2Get(path.split('|'))?' checked':'')+'><span>'+esc(label)+'</span></label>'}
function v2Chip(path,label){return '<label class="chip"><input type="checkbox" data-v2="'+esc(path)+'"'+(v2Get(path.split('|'))?' checked':'')+'><span>'+esc(label)+'</span></label>'}
/* Foto com marcador: a legenda registra de qual item e de qual documento a foto foi tirada. */
function v2Photo(scope,kind,label,full){const lab=full||(v2ItemTitulo(scope)+' · '+(label||'Fotos'));return '<button type="button" class="btn v2-photo" data-med-photo="'+esc('v2:'+scope+':'+kind)+'" data-photo-label="'+esc(lab)+'">📷 '+esc(label||'Fotos')+'</button>'}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-med-photo][data-photo-label]');if(!b)return;const v=v2State();v.photoLabels=v.photoLabels||{};v.photoLabels[b.dataset.medPhoto]=b.dataset.photoLabel;save()},true);
function v2Slug(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)}
function v2Box(title,badge,body,cls='',open=false){return '<details class="v2-box '+cls+'" data-med-fechado="1" data-v2k="'+esc(title)+'"'+(open?' open':'')+'><summary><b>'+esc(title)+'</b>'+(badge?'<span class="tag">'+esc(badge)+'</span>':'')+'</summary><div class="v2-in">'+body+'</div></details>'}
function v2ListItems(keys){return keys.flatMap(k=>V2.lists[k]||[])}
const IRR_OPTS=[['I','Irregular','irr-on'],['NA','N/A','na-on']];

function v2Ncl(scope,c){
 const items=v2ListItems(c.lists),kind=c.kind,marks=v2Get(['irr',scope])||{};
 const n=items.filter(x=>marks[x.id]==='I').length+(marks['x-'+kind]==='I'?1:0);
 const body='<p class="small muted">'+esc(c.sub||'')+'</p>'+items.map(x=>'<div class="v2-row"><div>'+esc(x.t)+'<small>'+esc(x.ref)+'</small></div>'+v2Tog(['irr',scope,x.id].join('|'),IRR_OPTS,marks[x.id])+'</div>').join('')
  +'<div class="v2-row"><div><input data-v2="'+v2p('out',scope,kind)+'" value="'+esc(v2Val('out',scope,kind))+'" placeholder="Outra irregularidade — descrever"></div>'+v2Tog(['irr',scope,'x-'+kind].join('|'),[IRR_OPTS[0]],marks['x-'+kind])+'</div>'
  +'<div class="toolrow">'+v2Photo(scope,kind,{amb:'Irregularidades do ambiente',reg:'Registros do laboratório',presc:'Receitas',rast:'Processo',mon:'Monitoramento'}[kind]||c.title||'Fotos')+'</div>';
 return v2Box(c.title,n?n+' marcada'+(n>1?'s':''):'nenhuma marcada',body,'v2-irr'+(n?' has':''));
}
/* Checklist Atende / Não atende / N/A: um ponto por linha; “Não atende” em ponto com citação vira irregularidade. */
const CHK_OPTS=[['C','Atende','ok-on'],['NC','Não atende','irr-on'],['NA','N/A','na-on']];
function v2ChkRows(base,items,marks){return items.map(x=>'<div class="v2-row"><div>'+esc(x.t)+'<small>'+esc(x.ref||'Informativo — não gera irregularidade')+'</small></div>'+v2Tog(base+'|'+x.id,CHK_OPTS,marks[x.id])+'</div>').join('')}
function v2ChkBadge(items,marks){const f=items.filter(x=>marks[x.id]).length,n=items.filter(x=>marks[x.id]==='NC').length;return f?(n?n+' não atende'+(n>1?'m':''):'sem não conformidade')+' · '+f+'/'+items.length:items.length+' pontos'}
function v2Chk(scope,c){const marks=v2Get(['chk',scope,c.key])||{};
 return v2Box(c.title,v2ChkBadge(c.items,marks),'<p class="small muted">'+esc(c.sub||'')+'</p>'+v2ChkRows(['chk',scope,c.key].join('|'),c.items,marks)+'<div class="toolrow">'+v2Photo(scope,'chk-'+c.key,c.title)+'</div>','v2-chk'+(Object.values(marks).includes('NC')?' has':''));
}
const UNID_USO=[['','— uso —'],['clientes','Clientes'],['funcionarios','Funcionários'],['ambos','Clientes e funcionários']],UNID_TIPO=[['','— tipo —'],['unissex','Unissex'],['masculino','Masculino'],['feminino','Feminino']];
function v2Sel(path,opts){const cur=v2Get(path.split('|'))||'';return '<select data-v2="'+esc(path)+'">'+opts.map(([v,l])=>'<option value="'+esc(v)+'"'+(cur===v?' selected':'')+'>'+esc(l)+'</option>').join('')+'</select>'}
function v2UnidNome(d,i){const u={clientes:'clientes',funcionarios:'funcionários',ambos:'clientes e funcionários'}[d.uso],t=d.tipo;return 'Sanitário '+(i+1)+(u||t||d.pcd?' — '+[u&&('de '+u),t,d.pcd&&'adaptado PCD'].filter(Boolean).join(', '):'')}
function v2UnidLista(scope,c){const o=v2Get(['unid',scope,c.key])||{};const n=Math.max(1,...Object.keys(o).map(k=>Number(k)+1));return Array.from({length:n},(_,i)=>o[i]||{}).map((d,i)=>[i,d]).filter(([,d])=>!d.del)}
function v2Unid(scope,c){
 const lista=v2UnidLista(scope,c);
 const rows=lista.map(([i,d])=>{const base=['unid',scope,c.key,i].join('|'),marks=d.chk||{},n=Object.values(marks).filter(v=>v==='NC').length;
  return '<details class="v2-eq" data-med-fechado="1" data-v2k="'+esc('unid:'+scope+':'+i)+'"><summary><b>'+esc(v2UnidNome(d,lista.findIndex(x=>x[0]===i)))+'</b><span class="tag'+(n?' bad':'')+'">'+v2ChkBadge(c.items,marks)+'</span></summary><div class="v2-in">'
   +'<div class="v2-grid"><label>Uso'+v2Sel(base+'|uso',UNID_USO)+'</label><label>Tipo'+v2Sel(base+'|tipo',UNID_TIPO)+'</label>'+v2Input(base+'|local','Localização','','text','Ex.: fundos, área comum do shopping')+'</div>'
   +v2Check(base+'|pcd','Adaptado para pessoa com deficiência (PCD)')
   +v2ChkRows(base+'|chk',c.items,marks)
   +'<div class="v2-row"><div><input data-v2="'+esc(base+'|outra')+'" value="'+esc(d.outra||'')+'" placeholder="Outra não conformidade — descrever"></div>'+v2Tog(base+'|xI',[IRR_OPTS[0]],d.xI)+'</div>'
   +'<div class="toolrow">'+v2Photo(scope,'unid-'+c.key+'-'+i,'Fotos',v2ItemTitulo(scope)+' · Sanitário '+(i+1))+'<button type="button" class="btn" data-v2-delunid="'+esc(scope+'|'+c.key+'|'+i)+'">Remover este sanitário</button></div></div></details>'}).join('');
 return v2Box(c.title,lista.length+' sanitário'+(lista.length>1?'s':''),'<p class="small muted">Um cartão por sanitário. O checklist de cada um indica onde está a não conformidade.</p>'+rows+'<div class="toolrow"><button type="button" class="btn" data-v2-addunid="'+esc(scope+'|'+c.key)+'">+ Incluir sanitário</button></div>','v2-eqbox',true);
}
function v2Equip(scope,c){
 const extra=v2Get(['eqExtra',scope])||[],names=c.names.concat(extra),irr=V2.lists.eq;
 const rows=names.map(nm=>{const d=v2Get(['eq',scope,nm])||{},marks=d.irr||{},n=Object.values(marks).filter(v=>v==='I').length+(d.xI==='I'?1:0);
  const base=['eq',scope,nm].join('|');
  return '<details class="v2-eq" data-med-fechado="1" data-v2k="'+esc('eq:'+scope+':'+nm)+'"><summary><b>'+esc(nm)+'</b><span class="tag'+(n?' bad':'')+'">'+(d.has==='NC'?'não possui':n?n+' irregularidade'+(n>1?'s':''):d.has==='C'?'sem irregularidades':'não conferido')+'</span></summary><div class="v2-in">'
   +v2Tog(base+'|has',[['C','Possui','ok-on'],['NC','Não possui','irr-on'],['NA','N/A','na-on']],d.has)
   +'<div class="v2-grid">'+v2Input(base+'|marca','Marca / modelo')+v2Input(base+'|serie','Nº série / patrimônio')+v2Input(base+'|cal','Calibração válida até','','date')+'</div>'
   +irr.map(x=>'<div class="v2-row"><div>'+esc(x.t)+'<small>'+esc(x.ref)+'</small></div>'+v2Tog(base+'|irr|'+x.id,IRR_OPTS,marks[x.id])+'</div>').join('')
   +'<div class="v2-row"><div><input data-v2="'+esc(base+'|outra')+'" value="'+esc(d.outra||'')+'" placeholder="Outra — descrever"></div>'+v2Tog(base+'|xI',[IRR_OPTS[0]],d.xI)+'</div>'
   +'<div class="toolrow">'+v2Photo(scope,'eq-'+v2Slug(nm),'Foto do equipamento / etiqueta',v2ItemTitulo(scope)+' · Equipamento: '+nm)+'<button type="button" class="read-btn" data-read-cal="'+esc('v2eq:'+scope+':'+nm)+'">📷 OCR do certificado</button></div></div></details>'}).join('');
 return v2Box('Equipamentos',names.length+' itens',rows+'<div class="toolrow"><button type="button" class="btn" data-v2-addeq="'+esc(scope)+'">+ Incluir equipamento</button></div>','v2-eqbox');
}
function v2Plan(){
 const p=v2Get(['plan'])||{};
 return '<div class="v2-grid">'+v2Input('fields|plan|de','Período conferido — de','','date')+v2Input('fields|plan|ate','até','','date')+'</div>'+V2.plan.map(([g,t,ref,rows])=>{
  const vals=rows.map((_,i)=>p[g+'-'+i]),nc=vals.filter(v=>v==='NC').length,pa=vals.filter(v=>v==='P').length;
  return v2Box(t,(nc||pa)?(nc?nc+' não apresentada'+(nc>1?'s':''):'')+(nc&&pa?' · ':'')+(pa?pa+' parcial'+(pa>1?'is':''):''):rows.length+' itens','<p class="small muted">'+esc(ref)+'</p>'+rows.map((r,i)=>'<div class="v2-row"><div>'+esc(r)+'</div>'+v2Tog(['plan',g+'-'+i].join('|'),[['C','Completa','ok-on'],['P','Parcial','par-on'],['NC','Não','irr-on'],['NA','N/A','na-on']],p[g+'-'+i])+'</div>').join('')
   +'<label class="v2-full">Observações — '+esc(t.toLowerCase())+'<textarea data-v2="'+v2p('obs','plan-'+g)+'">'+esc(v2Val('obs','plan-'+g))+'</textarea></label><div class="toolrow">'+v2Photo('plan',g,'Planilhas — '+t,'2.4 Planilhas e registros · '+t)+'</div>')}).join('');
}
function v2Table(scope,c){
 const key=scope+'-'+v2Slug(c.title),rows=v2Get(['tables',key])||{},n=Math.max(c.rows,Object.keys(rows).length);
 return '<h4 class="v2-h">'+esc(c.title)+'</h4><div style="overflow:auto"><table class="simple-table"><thead><tr>'+c.cols.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'
  +Array.from({length:n},(_,i)=>'<tr>'+c.cols.map((_,j)=>'<td><input data-v2="'+v2p('tables',key,i,j)+'" value="'+esc((rows[i]||{})[j]||'')+'"></td>').join('')+'</tr>').join('')
  +'</tbody></table></div><div class="toolrow"><button type="button" class="btn" data-v2-addrow="'+esc(key+'|'+n)+'">+ Linha</button></div>';
}
const ENS_MP=['Caracteres organolépticos','Volume','Solubilidade','Ponto de fusão','pH','Densidade','Peso','Avaliação do laudo de análise do fornecedor'];
const VEG_T=['Determinação dos caracteres organolépticos','Determinação de materiais estranhos','Pesquisa de contaminação microbiológica (contagem total, fungos e leveduras)','Umidade e determinação de cinzas totais','Caracteres macroscópicos (plantas íntegras ou grosseiramente rasuradas) — quando aplicável','Caracteres microscópicos (material fragmentado ou pó) — quando aplicável','Densidade (matéria-prima líquida de origem vegetal)'];
function v2Rotulo(){return APP_DATA.rotulo.map(x=>x[1]).concat(['Apresentou receita médica','Produto manipulado de acordo com a solicitação'])}
function v2Count(obj,list){return list.filter((_,i)=>obj&&obj[i]).length}
function v2Rast(scope,c){
 const d=v2Get(['rast',scope])||{},b='rast|'+scope,ins=d.ins||{},nIns=Math.max(6,Object.keys(ins).length),rot=v2Rotulo();
 return v2Box('Identificação da preparação '+c.form,d.prod||'',
   '<div class="v2-grid">'+v2Input(b+'|prod','Produto','v2-full')+v2Input(b+'|om','Ordem de manipulação nº')+v2Input(b+'|omData','de','','date')+v2Input(b+'|manip','Manipulado por')+'</div><div class="toolrow"><button type="button" class="read-btn" data-reader="ordem" data-target="'+esc('generic:'+scope+':om')+'">📄 Ler ordem de manipulação</button>'+v2Photo(scope,'om','Ordem de manipulação')+'</div>','',true)
  +v2Box('Rastreabilidade — excipientes e insumos','lote · validade · fabricante · NF','<div style="overflow:auto"><table class="simple-table"><thead><tr><th>Excipiente / insumo</th><th>Lote</th><th>Validade</th><th>Fabricante</th><th>Nota fiscal</th></tr></thead><tbody>'
   +Array.from({length:nIns},(_,i)=>'<tr>'+['n','lote','val','fab','nf'].map(k=>'<td><input data-v2="'+v2p('rast',scope,'ins',i,k)+'" value="'+esc((ins[i]||{})[k]||'')+'"></td>').join('')+'</tr>').join('')
   +'</tbody></table></div><div class="toolrow"><button type="button" class="btn" data-v2-addins="'+esc(scope+'|'+nIns)+'">+ Linha</button></div><div class="toolrow">'+v2Photo(scope,'danfe','DANFE / nota fiscal')+v2Photo(scope,'laudo-forn','Laudo do fornecedor')+'</div><p class="small muted">RDC 67/2007 · Anexo I · 8.1 e 8.4</p>')
  +v2Box('Controle de qualidade do produto acabado',v2Count(d.ens,c.ensaios)+' de '+c.ensaios.length,c.ensaios.map((e,i)=>v2Check(b+'|ens|'+i,e)).join('')+'<p class="small muted">RDC 67/2007 · Anexo I · 9.1.1, 9.1.2 e 9.1.3</p>')
  +v2Box('Controle de qualidade da matéria-prima',v2Count(d.mp,ENS_MP)+' de '+ENS_MP.length,'<div class="v2-grid">'+v2Input(b+'|mpProd','Produto','v2-full')+v2Input(b+'|mpLote','Lote')+'</div>'+ENS_MP.map((e,i)=>v2Check(b+'|mp|'+i,e)).join('')+'<p class="small muted">RDC 67/2007 · Anexo I · 7.3.10</p><div class="toolrow">'+v2Photo(scope,'cq-farm','Certificado de CQ da farmácia')+v2Photo(scope,'laudo-mp','Laudo do fornecedor da matéria-prima')+'<button type="button" class="read-btn" data-reader="cert_fornecedor" data-target="'+esc('generic:'+scope+':cert')+'">📄 Ler certificado de análise</button></div>')
  +v2Box('Análise da rotulagem',v2Count(d.rot,rot)+' de '+rot.length,rot.map((e,i)=>v2Check(b+'|rot|'+i,e)).join('')+'<p class="small muted">RDC 67/2007 · Anexo I · 12.1</p><div class="toolrow">'+v2Photo(scope,'rotulo','Rótulo')+'</div>');
}
function v2Veg(scope){return [0,1].map(i=>{const b='veg|'+scope+'|'+i,d=v2Get(['veg',scope,i])||{};return v2Box('Matéria-prima vegetal '+(i+1),d.prod||'','<div class="v2-grid">'+v2Input(b+'|prod','Produto','v2-full')+v2Input(b+'|lote','Lote')+v2Input(b+'|val','Validade','','date')+v2Input(b+'|fab','Fabricante')+'</div>'
 +v2Check(b+'|laudo','Laudo do fornecedor contém os testes exigidos: caracteres organolépticos, materiais estranhos, contaminação microbiológica, umidade e cinzas totais')
 +'<h4 class="v2-h">Controle de qualidade da farmácia</h4><div class="v2-grid">'+v2Input(b+'|cert','Certificado nº')+'</div>'+VEG_T.map((t,j)=>v2Check(b+'|t|'+j,t)).join('')+'<p class="small muted">RDC 67/2007 · Anexo I · 7.3.13</p><div class="toolrow"><button type="button" class="read-btn" data-reader="cert_fornecedor" data-target="'+esc('generic:'+scope+':veg'+i)+'">📄 Ler certificado</button></div><div class="toolrow">'+v2Photo(scope,'veg'+i+'-laudo','Laudo do fornecedor — MP vegetal '+(i+1))+v2Photo(scope,'veg'+i+'-cq','Certificado de CQ da farmácia — MP vegetal '+(i+1))+v2Photo(scope,'veg'+i+'-danfe','DANFE — MP vegetal '+(i+1))+'</div>',i===0)}).join('')}
function v2Emb(scope){return [0,1].map(i=>{const b='emb|'+scope+'|'+i,d=v2Get(['emb',scope,i])||{};return v2Box('Embalagem '+(i+1),d.prod||'','<div class="v2-grid">'+v2Input(b+'|prod','Produto','v2-full')+v2Input(b+'|lote','Lote')+v2Input(b+'|val','Validade','','date')+v2Input(b+'|fab','Fabricante')+'</div>'
 +v2Check(b+'|laudo','Laudo de análise do fornecedor')+v2Check(b+'|cq','Controle de qualidade da farmácia')+'<div class="v2-grid">'+v2Input(b+'|cert','Certificado nº')+'</div><h4 class="v2-h">Análise das características</h4><div class="checks">'+['Cor','Dimensão','Peso','Volume','Defeitos'].map(x=>v2Chip(b+'|c|'+x,x)).join('')+'</div><p class="small muted">RDC 67/2007 · Anexo I · 7.3.2 e 7.1.9</p><div class="toolrow">'+v2Photo(scope,'emb'+i+'-laudo','Laudo do fornecedor — embalagem '+(i+1))+v2Photo(scope,'emb'+i+'-cq','Certificado de CQ da farmácia — embalagem '+(i+1))+v2Photo(scope,'emb'+i+'-danfe','DANFE — embalagem '+(i+1))+'</div>',i===0)}).join('')}
function v2Mon(c){
 const b='mon|'+c.code,d=v2Get(['mon',c.code])||{},rows=d.rows||{};
 const monTit=c.code+' '+c.title.split(' — ')[0],monItem=v2ItemTitulo('i'+c.code.split('.').slice(0,2).join('.'));const ph=i=>'<div class="toolrow">'+v2Photo('mon',c.code+'-a'+i,'Laudo da análise '+(i+1),monItem+' · '+monTit+' · laudo da análise '+(i+1))+'</div>';
 const one=i=>{const r='mon|'+c.code+'|rows|'+i;return c.kind==='agua'?'<div class="v2-grid">'+v2Input(r+'|cert','Certificado nº')+v2Input(r+'|coleta','Data de coleta','','date')+'</div>'+ph(i)
  :'<h4 class="v2-h">Análise '+(i+1)+'</h4><div class="v2-grid">'+v2Input(r+'|prod','Produto','v2-full')+v2Input(r+'|cert','Certificado (produto acabado) nº')+v2Input(r+'|lote','Lote')+v2Input(r+'|manip','Manipulada em','','date')+v2Input(r+'|val','Validade','','date')+v2Input(r+'|receb','Recebimento da amostra','','date')+v2Input(r+'|ini','Início da análise','','date')+v2Input(r+'|fim','Término da análise','','date')+'</div>'+ph(i)};
 const done=Array.from({length:c.n},(_,i)=>rows[i]&&(rows[i].cert||rows[i].prod)).filter(Boolean).length;
 return v2Box(c.code+' '+c.title,done+' de '+c.n,'<p class="small muted">'+esc(c.ref)+'</p>'+Array.from({length:c.n},(_,i)=>one(i)).join('')
  +'<div class="v2-grid">'+v2Input(b+'|emit','Emitidos por')+v2Input(b+'|cnpj','CNPJ')+v2Input(b+'|fb','Farmacopeia Brasileira — edição')+'<label>Resultado<select data-v2="'+esc(b+'|res')+'"><option value=""></option>'+['Amostra cumpre as especificações','Amostra não cumpre as especificações'].map(o=>'<option'+(d.res===o?' selected':'')+'>'+o+'</option>').join('')+'</select></label>'+v2Input(b+'|sign','Assinado por','v2-full')+'</div>'
  +['Periodicidade atendida','Rodízio de manipuladores, fármacos e dosagens','Laudos arquivados','Metodologia e especificação farmacopeica'].map((t,i)=>v2Check(b+'|chk|'+i,t)).join('')
  +'<div class="toolrow"><button type="button" class="read-btn" data-reader="laudo" data-target="'+esc('generic:mon:'+c.code)+'">📄 Ler laudo / OCR</button>'+v2Photo('mon',c.code,'Outros documentos',monItem+' · '+monTit+' · outros documentos')+'</div>',done<c.n);
}
function v2Ident(){
 const i=state.identity;
 return `<div class="field-grid">
 ${charField("razao","Razão Social",i.razao,"text","span2")}${charField("fantasia","Nome Fantasia",i.fantasia)}
 ${charField("cnpj","CNPJ",i.cnpj)}<div class="field"><button class="btn" data-company>Buscar CNPJ na base Anvisa</button><button class="read-btn" data-reader="licenca" data-target="identity">📄 Licença / 📷 OCR</button></div>${charField("cmvs","Licença Sanitária / CMVS",i.cmvs)}
 ${charField("endereco","Endereço",i.endereco,"text","span2")}${charField("validade","Validade da licença",i.validade,"date")}
 ${charField("fone","Fone",i.fone)}${charField("email","E-mail",i.email)}${charField("horario","Horário de funcionamento",i.horario)}
 ${charField("rl","Responsável Legal",i.rl)}${charField("cpf","CPF",i.cpf)}${charField("rt","Responsável Técnico",i.rt)}
 ${charField("crf","CRF/SP",i.crf)}${charField("afe","AFE nº",i.afe)}${charField("afeData","AFE publicada em",i.afeData,"date")}
 ${charField("ae","AE nº",i.ae)}${charField("aeData","AE publicada em",i.aeData,"date")}${charField("atividades","Atividades licenciadas",i.atividades)}
 <div class="field span3"><label>Informações gerais</label><textarea data-ident="infoGerais">${esc(i.infoGerais||"")}</textarea></div>
 <div class="field span3"><label>Não conformidades anteriores / ficha de referência</label><textarea data-ident="ncAnteriores">${esc(i.ncAnteriores||"")}</textarea></div>
 </div>`;
}
const SBIT_LIST=['Ácido valproico','Aminofilina','Carbamazepina','Ciclosporina','Clindamicina','Clonidina','Clozapina','Colchicina','Digitoxina','Digoxina','Disopiramida','Fenitoína','Lítio','Minoxidil','Oxcarbazepina','Prazosina','Primidona','Procainamida','Quinidina','Teofilina','Varfarina','Verapamil'];
const BASES_LIST=['Creme não iônico','Creme aniônico','Gel de natrosol','Gel de carbopol','Loção','Pomada','Xarope simples','Veículo oral','Shampoo base'];
const EXCIP_LIST=['Celulose microcristalina','Amido','Lactose','Talco','Estearato de magnésio','Dióxido de silício','Excipiente padrão SBIT'];
const AREAS_LIST=[['administrativa','Administrativa'],['armazenamento','Armazenamento / almoxarifado'],['cq','Controle de qualidade'],['pesagem','Pesagem'],['solidos','Lab. sólidos'],['semiliquidos','Lab. semissólidos e líquidos'],['hormonios','Cabine de hormônios'],['antibioticos','Cabine de antibióticos'],['citostaticos','Cabine de citostáticos'],['homeopatia','Homeopatia'],['dispensacao','Dispensação'],['paramentacao','Paramentação'],['vestiario','Vestiário'],['sanitarios','Sanitários'],['lavagem','Lavagem'],['dml','DML'],['copa','Copa / refeitório'],['descanso','Área de descanso'],['residuos','Abrigo de resíduos']];
function v2Carac(){
 const c=state.char;const has=(g,v)=>(c[g]||[]).includes(v);const chip=(g,v,l)=>checkboxChip(g,v,l,has(g,v));
 const bool=(k,l)=>'<label class="chip"><input type="checkbox" data-char-bool="'+k+'"'+(c[k]?' checked':'')+'><span>'+esc(l)+'</span></label>';
 return `<div class="check-block v2-carac">
 <h3>Grupos de atividade — RDC nº 67/2007 · Regulamento Técnico · Item 3</h3><p class="small muted">I — manipulação a partir de insumos, inclusive de origem vegetal. II — substâncias de baixo índice terapêutico. III — antibióticos, hormônios, citostáticos e substâncias sujeitas a controle especial. V — preparações homeopáticas. Cada grupo marcado abre o anexo correspondente.</p><div class="checks">${["I","II","III","V"].map(x=>chip("groups",x,x)).join("")}</div>
 <h3>Preparações</h3><div class="checks">${chip("preps","homeopaticas","Homeopáticas")}${chip("preps","fitoterapicas","Fitoterápicas")}${chip("preps","alopaticas","Alopáticas")}${chip("preps","oficinais","Oficinais")}${bool("autoisoterapicos","Prepara auto-isoterápicos")}</div>
 <h3>Categorias alopáticas</h3><div class="checks">${chip("cats","hormonios","Hormônios")}${chip("cats","antibioticos","Antibióticos gerais")}${chip("cats","penicilinicos","Penicilínicos")}${chip("cats","cefalosporinicos","Cefalosporínicos")}${chip("cats","citostaticos","Citostáticos")}${chip("cats","controle","Sujeitas a controle especial")}</div>
 <h3>Formas farmacêuticas</h3><div class="checks">${chip("forms","solida","Sólidas")}${chip("forms","semissolida","Semissólidas")}${chip("forms","liquida","Líquidas")}</div>
 <h3>Outras atividades e insumos</h3><div class="checks">${bool("industrializados","Dispensa industrializados")}${bool("servicos","Serviços farmacêuticos")}${bool("domicilio","Entregas em domicílio")}${bool("remota","Venda remota")}${bool("vegetal","Matéria-prima vegetal")}</div>
 ${manQuimicosHtml()}
 <h3>Baixo índice terapêutico manipulado — Anexo II · 2.3</h3><div class="checks">${SBIT_LIST.map(x=>chip("sbitList",x,x)).join("")}</div>
 <h3>Bases galênicas</h3><div class="field-grid" style="padding:0 0 8px"><div class="field"><label>Origem</label><select data-char-scalar="bases"><option value="">Selecione</option><option value="adquiridas" ${c.bases==="adquiridas"?"selected":""}>Adquiridas</option><option value="manipuladas" ${c.bases==="manipuladas"?"selected":""}>Manipuladas</option><option value="ambas" ${c.bases==="ambas"?"selected":""}>Adquiridas e manipuladas</option></select></div></div><div class="checks">${BASES_LIST.map(x=>chip("basesList",x,x)).join("")}</div>
 <h3>Excipientes padronizados</h3><div class="field-grid" style="padding:0 0 8px"><div class="field"><label>Origem</label><select data-char-scalar="excipientes"><option value="">Selecione</option><option value="adquiridos" ${c.excipientes==="adquiridos"?"selected":""}>Adquiridos</option><option value="manipulados" ${c.excipientes==="manipulados"?"selected":""}>Manipulados</option><option value="ambos" ${c.excipientes==="ambos"?"selected":""}>Adquiridos e manipulados</option></select></div></div><div class="checks">${EXCIP_LIST.map(x=>chip("excipList",x,x)).join("")}</div>
 <div class="v2-grid">${v2Input('fields|carac|outros','Outras substâncias, bases ou excipientes','v2-full')}</div>
 <h3>Áreas existentes no estabelecimento</h3><p class="small muted">As áreas marcadas definem a copa e a área de descanso em Áreas físicas.</p><div class="checks">${AREAS_LIST.map(([v,l])=>chip("areas",v,l)).join("")}</div>
 <div class="v2-grid">${v2Input('fields|carac|func','Nº de funcionários')}${v2Input('fields|carac|farm','Nº de farmacêuticos')}${v2Input('fields|carac|formulas','Média de fórmulas/dia')}${v2Input('fields|carac|sistema','Sistema informatizado')}${v2Input('fields|carac|filiais','Filiais')}</div>
 </div>`;
}
function v2Secao(iid){for(const[n,c]of Object.entries(APP_DATA.cards))for(const s of c.sections)if(s.item===iid)return {n,card:c,s};return null}
function v2ItemHead(scope,c){
 const v=v2State(),na=!!v.itemNA[scope],loc=v2Secao(scope),hint=loc&&loc.s.hint;let h='<div class="v2-head'+(na?' na':'')+'">';
 const o=V2.orient[scope];if(o)h+='<div class="v2-orient"><b>Orientação do item.</b> '+esc(o)+'</div>';if(window.SaberMais)h+=SaberMais.html('manip',scope);
 if(hint&&!conditionActive(hint)&&!na)h+='<div class="v2-hint">Não declarado na caracterização ('+esc(APP_DATA.conditionLabels[hint]||hint)+'). Confirme; se não existir no estabelecimento, marque o item como Não se aplica.</div>';
 if(c.na)h+='<div class="toolrow"><button type="button" class="btn v2-nabtn'+(na?' on':'')+'" data-v2-itemna="'+esc(scope)+'">'+(na?'↺ Item marcado como Não se aplica — desfazer':'Não se aplica a este estabelecimento')+'</button></div>';
 if(na){h+='<p class="small muted">Este item não entra no relatório. As perguntas foram marcadas como Não se aplica.</p></div>';return h}
 (V2.sit[scope]||[]).forEach((sq,qi)=>{const cur=(v.sit[scope]||{})[qi];
  h+='<div class="v2-sit"><h4>Situação encontrada — '+esc(sq.q)+'</h4><div class="v2-tog v2-sitopts">'+sq.opts.map(([k,l])=>'<button type="button" data-v2t="'+esc(['sit',scope,qi,k].join('|'))+'" class="'+(cur===k?'ok-on':'')+'" aria-pressed="'+(cur===k)+'">'+esc(l)+'</button>').join('')+'</div>';
  const op=sq.opts.find(x=>x[0]===cur);
  if(cur==='outro')h+='<div class="v2-grid">'+v2Input(['sitout',scope,qi].join('|'),'Descreva o local ou arranjo encontrado','v2-full')+'</div>';
  if(op&&op[3])h+='<div class="v2-hint ok">'+esc(op[3])+'</div>';
  h+='</div>'});
 return h+'</div>';
}
function v2PrevHtml(scope){const loc=v2Secao(scope);if(!loc)return '';const x=v2ItemCorpo(loc.n,loc.card,loc.s,()=>'…');return x||'<p class="muted">Ainda sem texto: responda as perguntas ou marque as listas.</p>'}
function v2Preview(scope){return '<details class="v2-box v2-prevbox" data-med-fechado="1" data-v2k="prev:'+esc(scope)+'"><summary><b>Como sai no relatório</b></summary><div class="v2-in v2-prev" data-item="'+esc(scope)+'">'+v2PrevHtml(scope)+'</div></details>'}
let v2PrevT=null;function v2RefreshPrev(){clearTimeout(v2PrevT);v2PrevT=setTimeout(()=>document.querySelectorAll('.v2-prev[data-item]').forEach(el=>{el.innerHTML=v2PrevHtml(el.dataset.item)}),150)}
function manV2(f,item){
 const c=f&&f.c;if(!c)return '';const scope=f.into,sec=item&&item.sections&&item.sections[0];
 if(sec&&!conditionActive(sec.condition)&&!state.manualOpen['sec:'+sec.code])return '';
 switch(c.t){
  case 'itemhead':return v2ItemHead(scope,c);
  case 'preview':return v2Preview(scope);
  case 'note':return '<div class="notice v2-note">'+esc(c.text)+'</div>';
  case 'ident':return v2Ident();
  case 'carac':return v2Carac();
  case 'obs':return '<label class="v2-obs">Observações gerais do item<textarea data-v2="'+v2p('obs',scope)+'" placeholder="Texto livre — entra no relatório ao final do item">'+esc(v2Val('obs',scope))+'</textarea></label>';
  case 'fields':return '<div class="v2-grid">'+c.f.map(([l,ph,s])=>v2Input('fields|'+scope+'|'+v2Slug(l),l,s>1?'v2-full':'',/data|validade/i.test(l)&&!/Laborat/.test(l)?'date':'text',ph)).join('')+'</div>';
  case 'chips':{const k=v2Slug(c.title);return '<h3 class="v2-h">'+esc(c.title)+'</h3>'+(c.help?'<p class="small muted">'+esc(c.help)+'</p>':'')+'<div class="checks">'+c.opts.map(o=>v2Chip('chips|'+scope+'|'+k+'|'+o,o)).join('')+'</div>'+(c.other?'<div class="v2-grid">'+v2Input('fields|'+scope+'|'+k+'-outros','Outros','v2-full')+'</div>':'')}
  case 'doc':return '<div class="toolrow">'+c.labels.map(l=>'<button type="button" class="read-btn" data-reader="generico" data-target="'+esc('generic:'+scope+':'+v2Slug(l))+'">'+esc(l)+'</button>').join('')+'</div>';
  case 'ncl':return v2Ncl(scope,c);
  case 'equip':return v2Equip(scope,c);
  case 'chk':return v2Chk(scope,c);
  case 'unid':return v2Unid(scope,c);
  case 'plan':return v2Plan();
  case 'table':return v2Table(scope,c);
  case 'rast':return v2Rast(scope,c);
  case 'veg':return v2Veg(scope);
  case 'emb':return v2Emb(scope);
  case 'mon':return v2Mon(c);
 }
 return '';
}

/* ---------- eventos dos componentes ---------- */
function v2Rerender(){const y=window.pageYOffset;if(state.openCard)renderCard(state.openCard);window.scrollTo(0,y)}
function v2KeepOpen(){return [...document.querySelectorAll('#cardPanel details[open][data-v2k]')].map(d=>d.dataset.v2k)}
function v2Reopen(list){document.querySelectorAll('#cardPanel details[data-v2k]').forEach(d=>{if(list.includes(d.dataset.v2k))d.open=true})}
/* Atualiza o selo do quadro sem redesenhar a tela (a lista continua aberta). */
function v2Badge(btn){
 if(btn.dataset.v2t&&(btn.dataset.v2t.startsWith('chk|')||btn.dataset.v2t.startsWith('unid|'))){const p=btn.dataset.v2t.split('|');p.pop();p.pop();const marks=v2Get(p)||{};
  const holder=btn.dataset.v2t.startsWith('unid|')?btn.closest('.v2-eq'):btn.closest('.v2-box');const tag=holder&&holder.querySelector(':scope>summary .tag');
  if(tag){const rows=[...holder.querySelectorAll(':scope>.v2-in>.v2-row [data-v2t$="|C"]')].filter(b=>/^(chk|unid)\|/.test(b.dataset.v2t));const tot=rows.length,f=rows.filter(b=>b.parentNode.querySelector('.ok-on,.irr-on,.na-on')).length,n=rows.filter(b=>b.parentNode.querySelector('.irr-on')).length;
   tag.textContent=f?(n?n+' não atende'+(n>1?'m':''):'sem não conformidade')+' · '+f+'/'+tot:tot+' pontos';tag.classList.toggle('bad',!!n);holder.classList.toggle('has',!!n)}
  return}
 const eq=btn.closest('.v2-eq');
 if(eq){const tag=eq.querySelector(':scope>summary .tag'),n=eq.querySelectorAll('.v2-in .irr-on:not([data-v2t$="|has|NC"])').length,has=eq.querySelector('[data-v2t$="|has|C"].ok-on,[data-v2t$="|has|NC"].irr-on,[data-v2t$="|has|NA"].na-on');
  const hv=has?has.dataset.v2t.split('|').pop():'';tag.textContent=hv==='NC'?'não possui':n?n+' irregularidade'+(n>1?'s':''):hv==='C'?'sem irregularidades':'não conferido';tag.classList.toggle('bad',!!n||hv==='NC');return}
 const box=btn.closest('.v2-box');if(!box)return;const tag=box.querySelector(':scope>summary .tag');if(!tag)return;
 if(box.classList.contains('v2-irr')){const n=box.querySelectorAll('.irr-on').length;tag.textContent=n?n+' marcada'+(n>1?'s':''):'nenhuma marcada';box.classList.toggle('has',!!n);return}
 if(box.querySelector('[data-v2t^="plan|"]')){const nc=box.querySelectorAll('.irr-on').length,pa=box.querySelectorAll('.par-on').length,tot=box.querySelectorAll('.v2-row').length;tag.textContent=(nc||pa)?(nc?nc+' não apresentada'+(nc>1?'s':''):'')+(nc&&pa?' · ':'')+(pa?pa+' parcial'+(pa>1?'is':''):''):tot+' itens'}
}
document.addEventListener('click',e=>{
 const t=e.target.closest&&e.target.closest('[data-v2t],[data-v2-addeq],[data-v2-addrow],[data-v2-addins],[data-v2-itemna],[data-v2-addunid],[data-v2-delunid]');if(!t)return;
 if(t.dataset.v2Itemna){const iid=t.dataset.v2Itemna,v=v2State(),loc=v2Secao(iid),ids=loc?loc.s.requirements.map(r=>r.id):[];
  if(v.itemNA[iid]){for(const id of (v.itemNAset[iid]||[]))if(state.responses[id]&&state.responses[id].status==='NA')state.responses[id].status='';delete v.itemNA[iid];delete v.itemNAset[iid]}
  else{const set=[];for(const id of ids){const a=state.responses[id]=state.responses[id]||{};if(!a.status){a.status='NA';set.push(id)}}v.itemNA[iid]=true;v.itemNAset[iid]=set}
  save();v2Rerender();return}
 if(t.dataset.v2t&&t.dataset.v2t.startsWith('sit|')){const p=t.dataset.v2t.split('|'),val=p.pop();v2Set(p,v2Get(p)===val?undefined:val);save();const open=v2KeepOpen();v2Rerender();v2Reopen(open);return}
 if(t.dataset.v2t){const p=t.dataset.v2t.split('|'),v=p.pop(),on=v2Get(p)!==v;v2Set(p,on?v:undefined);
  t.parentNode.querySelectorAll('button').forEach(b=>{b.className='';b.setAttribute('aria-pressed','false')});
  if(on){const k={I:'irr-on',NC:'irr-on',NA:'na-on',C:'ok-on',P:'par-on'}[v];t.className=k;t.setAttribute('aria-pressed','true')}
  v2Badge(t);save();v2RefreshPrev();return}
 const open=v2KeepOpen();
 if(t.dataset.v2Addeq){const nm=(prompt('Nome do equipamento')||'').trim();if(!nm)return;const s=t.dataset.v2Addeq;const a=v2Get(['eqExtra',s])||[];if(!a.includes(nm))a.push(nm);v2Set(['eqExtra',s],a);open.push('eq:'+s+':'+nm)}
 else if(t.dataset.v2Addunid){const[s,k]=t.dataset.v2Addunid.split('|');const o=v2Get(['unid',s,k])||{};const n=Math.max(1,...Object.keys(o).map(x=>Number(x)+1));if(!o[0])v2Set(['unid',s,k,0,'novo'],true);v2Set(['unid',s,k,n,'novo'],true);open.push('unid:'+s+':'+n)}
 else if(t.dataset.v2Delunid){const[s,k,i]=t.dataset.v2Delunid.split('|');if(!confirm('Remover este sanitário e as marcações dele?'))return;v2Set(['unid',s,k,i],{del:true})}
 else if(t.dataset.v2Addrow){const[k,n]=t.dataset.v2Addrow.split('|');v2Set(['tables',k,n,0],' ')}
 else if(t.dataset.v2Addins){const[s,n]=t.dataset.v2Addins.split('|');v2Set(['rast',s,'ins',n,'n'],' ')}
 save();v2Rerender();v2Reopen(open);
});
function v2Field(e){const t=e.target;if(!t||!t.dataset||!t.dataset.v2)return;const p=t.dataset.v2.split('|');v2Set(p,t.type==='checkbox'?t.checked:t.value);save();v2RefreshPrev();
 if(t.type==='checkbox'){const box=t.closest('details');const tag=box&&box.querySelector(':scope>summary .tag');if(tag&&/ de \d+$/.test(tag.textContent)){const all=box.querySelectorAll(':scope>.v2-in>.v2-check input');tag.textContent=[...all].filter(x=>x.checked).length+' de '+all.length}}}
document.addEventListener('input',e=>{if(e.target.type!=='checkbox')v2Field(e)});
document.addEventListener('change',e=>{if(e.target.type==='checkbox'||e.target.tagName==='SELECT')v2Field(e)});

/* ---------- grade de seções ---------- */
function renderCardGrid(){
 $("#cardGrid").innerHTML=Object.entries(APP_DATA.cards).map(([n,c])=>`<button data-open-card="${n}"><span class="ui-card-icon">${UvisLayout.icon(c.icon||'note')}</span><span><small class="ui-card-index">SEÇÃO ${n}</small><strong>${esc(c.title)}</strong><small>${esc(c.subtitle)}</small></span></button>`).join("");
}

/* ---------- limpeza por seção ---------- */
async function pharmacyClear(){
 const card=state.activeTab==='roteiro'?Number(state.openCard):0;if(!card&&state.activeTab==='roteiro')return;
 if(!confirm(card?'Limpar somente os dados da seção '+card+'?':'Limpar somente os dados próprios desta aba?'))return;
 if(card){
  const c=APP_DATA.cards[card],scopes=c.sections.map(s=>s.item),ids=c.sections.flatMap(s=>s.requirements.map(r=>r.id)),codes=c.sections.map(s=>s.code);
  await RoteiroEvidence.clear('manipulacao-card-'+card);
  for(const id of ids){delete state.responses[id];if(state.readings)delete state.readings[id]}
  for(const code of codes){for(const k of ['env','equipment','balance'])delete state[k][code];delete state.manualOpen['sec:'+code]}
  const v=v2State();for(const k of V2_KEYS)for(const key of Object.keys(v[k]))if(scopes.some(s=>key===s||key.startsWith(s+'-')))delete v[k][key];
  if(card===1){state.identity=freshState().identity;state.char=freshState().char;state.char.areas=[];delete v.fields.carac}
  if(card===2){state.training=freshState().training;state.pops={};v.plan={};delete v.fields.plan;for(const k of Object.keys(v.obs))if(k.startsWith('plan-'))delete v.obs[k]}
  if(card===9){state.stock=[];state.stockBasket=[]}
  if(card===10)state.insumos=[];
  if(card===11)v.mon={};
  for(const key of Object.keys(state.readings||{}))if((card===1&&key==='identity')||(card===2&&(key==='training'||key.startsWith('pop:')))||scopes.some(s=>key.includes(':'+s+':')))delete state.readings[key];
 }
 else if(state.activeTab==='infracoes')state.selectedInfra=[];else state.report=freshState().report;
 save();pharmacyRefresh();renderInfra();toast('Dados do contexto atual limpos.');
}

/* ---------- inventário de infrações ---------- */
const CLS_NOME={I:'Imprescindível',N:'Necessário',R:'Recomendável'};
function infraRefs(x){
 const a7=x.a7.map(n=>{const t=APP_DATA.infraTexts['A7 '+n];return {law:'RDC nº 67/2007',device:'Anexo VII · Item '+n,text:t?t.x:''}});
 const dev=x.dev.map(k=>{const t=APP_DATA.infraTexts[k];const m=String(t.t).replace(' · item ',' · Item ').split(' · ');return {law:m[0],device:m.slice(1).join(' · '),text:t.x}});
 return {a7,dev};
}
function infraCitacao(x){const {a7,dev}=infraRefs(x);return 'RDC nº 67/2007, Anexo VII, item '+x.a7.join(', ')+(x.cls?' ('+x.cls+')':'')+(dev.length?'; '+dev.map(r=>r.law.replace('RDC nº 67/2007','').trim()?r.law+', '+r.device:r.device).join('; '):'')}
function renderInfra(){
 const q=($('#infraSearch')?.value||'').toLocaleLowerCase('pt-BR');
 const texto=x=>[x.description,x.a7.join(' '),x.note,(APP_DATA.cards[x.block]||{}).title].join(' ').toLocaleLowerCase('pt-BR');
 const arr=APP_DATA.infractions.filter(x=>(!selectedOnly||state.selectedInfra.includes(x.n))&&(!q||texto(x).includes(q)));
 $('#infraCount').textContent=arr.length+' de '+APP_DATA.infractions.length+' itens';
 const blocks=Object.keys(APP_DATA.cards).map(Number).filter(b=>arr.some(x=>x.block===b));
 if(!blocks.length){$('#infraList').innerHTML='<p class="muted">Nenhuma infração corresponde ao filtro.</p>';return}
 const btn=r=>'<button type="button" class="med-ref" data-med-ref="'+esc(JSON.stringify(r))+'">'+esc(r.law+' · '+r.device)+'</button>';
 $('#infraList').innerHTML=blocks.map(b=>{
  const itens=arr.filter(x=>x.block===b).sort((a,c)=>a.n-c.n),sel=itens.filter(x=>state.selectedInfra.includes(x.n)).length;
  return '<details class="med-inventory"'+(q?' open':'')+'><summary>'+b+'. '+esc(APP_DATA.cards[b].title)+' <span class="tag">'+itens.length+' iten'+(itens.length===1?'':'s')+(sel?' · '+sel+' selecionada'+(sel>1?'s':''):'')+'</span></summary>'
   +itens.map(x=>{const {a7,dev}=infraRefs(x);return '<article><p><b>'+x.n+'.</b> '+esc(x.description)+'</p>'+(x.cls?'<p class="muted">Classificação: '+x.cls+' — '+CLS_NOME[x.cls]+'</p>':'')
    +'<div class="infra-norm-box"><span>Roteiro de inspeção</span>'+a7.map(btn).join('')+(dev.length?'<span>Dispositivo que cria a obrigação</span>'+dev.map(btn).join(''):'')+'</div>'
    +(x.note?'<p class="small muted">'+esc(x.note)+'</p>':'')
    +'<p><button class="btn" data-pin-infra="'+x.n+'">'+(state.selectedInfra.includes(x.n)?'Retirar seleção':'Selecionar para consulta')+'</button></p></article>'}).join('')+'</details>';
 }).join('');
}

/* ---------- relatório ---------- */
let v2Fotos=null,v2FotosCarga=null;
/* Fotos do relatório: reduzidas (lado maior 1100 px, JPEG 0,7) para o Word/PDF não crescer demais; os originais ficam no aparelho. */
function v2Reduz(url){return new Promise(res=>{const im=new Image();im.onload=()=>{const k=Math.min(1,1100/Math.max(im.naturalWidth,im.naturalHeight));if(k>=1&&url.length<260000){res(url);return}const c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k);c.height=Math.round(im.naturalHeight*k);const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.7))};im.onerror=()=>res(url);im.src=url})}
function v2CarregarFotos(){if(v2FotosCarga)return v2FotosCarga;v2FotosCarga=(async()=>{const out=[];if(window.RoteiroEvidence)for(const n of Object.keys(APP_DATA.cards)){try{const all=await RoteiroEvidence.read('manipulacao-card-'+n);for(const[k,url]of Object.entries(all))out.push({card:Number(n),key:k,url:await v2Reduz(url)})}catch(e){}}v2Fotos=out;renderPreview();return out})();return v2FotosCarga}
function v2InvalidarFotos(){v2Fotos=null;v2FotosCarga=null}
function v2Lc(t){t=String(t||'');return /^.[a-zà-ú]/.test(t)?t.charAt(0).toLowerCase()+t.slice(1):t}
function v2Cite(t){return String(t||'').replace(/RDC (\d)/,'RDC nº $1').replace(/ · /g,', ').replace(/(Anexo [IVX]+|RT), (\d[\d.]*)( e \d)/,'$1, itens $2$3').replace(/(Anexo [IVX]+|RT), (\d)/,'$1, item $2').replace(/^(.*), RT,/,'$1, Regulamento Técnico,')}
function v2Ir(t,k){return esc(String(t).replace(/\.$/,''))+' (irregularidade '+k+').'}
function v2Join(a){return a.length>1?a.slice(0,-1).join(', ')+' e '+a.at(-1):a[0]||''}
function v2Ne(o){return Object.values(o||{}).some(v=>v&&typeof v==='object'?v2Ne(v):String(v??'').trim())}
function v2ItemTitulo(iid){for(const[n,c]of Object.entries(APP_DATA.cards))for(const s of c.sections)if(s.item===iid)return s.itemNum+' '+s.itemTitle;return iid}
function v2RefTxt(refs){return (refs||[]).map(x=>x.law+', '+String(x.device).replace(' · Item ',', item ').replace(' · ',', ')).join('; ')}
/* Parágrafo(s) de um item no relatório. Não se aplica é omitido. */
/* Texto do checklist: pontos atendidos em lista; cada “Não atende” com citação vira irregularidade própria. */
function v2ChkTexto(iid,titulo,items,m,addIrr,curto){
 const ok=items.filter(x=>m[x.id]==='C'),nc=items.filter(x=>m[x.id]==='NC'&&!x.info),inf=items.filter(x=>m[x.id]==='NC'&&x.info);if(!ok.length&&!nc.length&&!inf.length)return '';
 const ctx=iid.includes(' — ')?v2ItemTitulo(iid.split(' — ')[0])+' — '+iid.split(' — ')[1]:v2ItemTitulo(iid);
 const cap=t=>t.charAt(0).toUpperCase()+t.slice(1);const out=[];
 if(ok.length)out.push((curto?'Atende: ':'Atende aos pontos: ')+esc(v2Join(ok.map(x=>v2Lc(x.t))))+'.');
 nc.forEach(x=>{const k=addIrr(ctx+': '+x.neg+'.',v2Cite(x.ref));out.push(esc(cap(x.neg))+' (irregularidade '+k+').')});
 inf.forEach(x=>out.push(esc(cap(x.neg))+'.'));
 return out.join(' ');
}
function v2ItemCorpo(n,card,s,addIrr){
 const iid=s.item,v=v2State(),refTxt=v2RefTxt;if(v.itemNA[iid])return '';
 let sitTxt=[];(V2.sit[iid]||[]).forEach((sq,qi)=>{const k=(v.sit[iid]||{})[qi];if(!k)return;const o=sq.opts.find(x=>x[0]===k);if(!o)return;if(k==='outro'){const t=((v.sitout[iid]||{})[qi]||'').trim();if(t)sitTxt.push(esc((sq.pre?sq.pre+' ':sq.q.replace(/\?$/,'')+': ')+t.replace(/\.$/,'')+'.'))}else sitTxt.push(esc(o[2]))});
  let corpo='';const frases=[];
  for(const q of s.requirements){if(!conditionActive(q.condition)&&!state.manualOpen[q.id])continue;const a=state.responses[q.id]||{};
   if(a.status==='C')frases.push(esc(q.pos));
   else if(a.status==='NC'){if(q.informativo)frases.push(esc(q.neg));else{const k=addIrr(v2ItemTitulo(iid)+': '+q.neg+(a.evidence&&a.evidence.trim()?' Evidência: '+a.evidence.trim().replace(/\s+/g,' ').replace(/\.$/,'')+'.':''),refTxt(q.refs));frases.push(v2Ir(q.neg,k))}}}
  if(frases.length)corpo+='<p>'+frases.join(' ')+'</p>';
  const extras=(card.extraItems||[]).filter(e=>e.into===iid);
  for(const e of extras){const comp=e.c;
   if(e.fn==='renderPops'){const pops=[];for(const ps of APP_DATA.pops)ps.rows.forEach((row,idx)=>{const d=state.pops[ps.code+'|'+idx];if(d&&d.status)pops.push([row.name,d.nr||'',manData(d.date),d.status])});if(pops.length){const pend=pops.filter(p=>p[3]==='Pendente');corpo+='<p>'+(pend.length?'Dos POPs conferidos, '+(pops.length-pend.length)+' foram apresentados; não foram apresentados: '+esc(v2Join(pend.map(p=>v2Lc(p[0]))))+'.':'Foram apresentados todos os '+pops.length+' POPs conferidos.')+'</p>'+medTable(pops,['POP','Nº / revisão','Data','Situação']);if(pend.length){const k=addIrr('POPs não apresentados: '+v2Join(pend.map(p=>v2Lc(p[0])))+'.','RDC nº 67/2007, Anexo I, item 8 e itens específicos de cada procedimento');corpo+='<p>(irregularidade '+k+')</p>'}}}
   if(e.fn==='renderTraining'){const t=(state.training||[]).filter(v2Ne);if(t.length)corpo+=medTable(t.map(x=>[x.tema||'',manData(x.data),x.carga||'',x.n||'',x.efetividade||'']),['Treinamento','Data','Carga horária','Treinados','Efetividade'])}
   if(e.fn==='renderStock'){const st=(state.stock||[]).filter(x=>x&&(x.substancia||x.lote||x.fisico||x.sistema));if(st.length)corpo+=medTable(st.map(x=>[x.substancia||'',x.lote||'',x.fisico||'',x.sistema||'']),['Substância / produto','Lote','Físico','Escriturado'])}
   if(e.fn==='renderTraceability'){const ins=(state.insumos||[]).filter(v2Ne);if(ins.length)corpo+=medTable(ins.map(x=>[x.nome||'',x.lote||'',x.fornecedor||'',x.coa||'',x.obs||'']),['Matéria-prima','Lote','Fornecedor','Certificado','Observações'])}
   if(!comp)continue;
   if(comp.t==='ncl'){const marks=v.irr[iid]||{},items=v2ListItems(comp.lists).filter(x=>marks[x.id]==='I');const out=v.out[iid]||{};
    const rec=/^p(?!resc)/.test(comp.kind);const lst=items.map(x=>{const k=addIrr(v2ItemTitulo(iid)+': '+v2Lc(x.t)+'.',v2Cite(x.ref));return esc(v2Lc(rec?x.t.replace(/^[A-C]\d?( tópico)?: /,''):x.t))+' (irregularidade '+k+')'});
    if(marks['x-'+comp.kind]==='I'&&out[comp.kind]){const k=addIrr(v2ItemTitulo(iid)+': '+out[comp.kind]+'.','');lst.push(esc(out[comp.kind])+' (irregularidade '+k+')')}
    if(lst.length)corpo+='<p>'+(comp.kind==='reg'?'Registros não apresentados: ':comp.kind==='amb'?'Irregularidades gerais do ambiente: ':esc(comp.title)+': ')+lst.join('; ')+'.</p>'}
   if(comp.t==='chk'){const m=((v.chk[iid]||{})[comp.key])||{};const tx=v2ChkTexto(iid,comp.title,comp.items,m,addIrr);if(tx)corpo+='<p><b>'+esc(comp.title)+'.</b> '+tx+'</p>'}
   if(comp.t==='unid'){const lista=v2UnidLista(iid,comp).filter(([,d])=>v2Ne(Object.assign({},d,{novo:''})));if(lista.length){const rows=[];
     const conta={};lista.forEach(([,d])=>{const u={clientes:'de clientes',funcionarios:'de funcionários',ambos:'de clientes e funcionários'}[d.uso]||'de uso não informado';conta[u]=(conta[u]||0)+1});
     corpo+='<p>Foram verificados '+lista.length+' sanitário'+(lista.length>1?'s':'')+': '+esc(v2Join(Object.entries(conta).map(([u,q])=>q+' '+u)))+'.</p>';
     lista.forEach(([i,d],k)=>{const nome='Sanitário '+(k+1);const car=[{clientes:'Clientes',funcionarios:'Funcionários',ambos:'Clientes e funcionários'}[d.uso],d.tipo&&d.tipo.charAt(0).toUpperCase()+d.tipo.slice(1),d.pcd&&'adaptado PCD',d.local].filter(Boolean).join(' · ')||'—';
      let sit=v2ChkTexto(iid+' — '+nome,'',comp.items,d.chk||{},addIrr,true);if(d.xI==='I'&&d.outra){const kk=addIrr(v2ItemTitulo(iid)+' — '+nome+': '+d.outra.trim().replace(/\.$/,'')+'.','');sit+=(sit?' ':'')+esc(d.outra.trim().replace(/\.$/,''))+' (irregularidade '+kk+').'}
      rows.push([nome,car,sit||'Não conferido'])});
     corpo+=medTable(rows,['Sanitário','Caracterização','Situação'])}}
   if(comp.t==='equip'){const names=comp.names.concat(v.eqExtra[iid]||[]),rows=[];
    for(const nm of names){const d=(v.eq[iid]||{})[nm];if(!d||!v2Ne(d))continue;const id=[d.marca,d.serie&&('série '+d.serie),d.cal&&('calibração até '+manData(d.cal))].filter(Boolean).join(' · ');
     const ir=V2.lists.eq.filter(x=>(d.irr||{})[x.id]==='I');let sit;
     if(d.has==='NC'){const k=addIrr(v2ItemTitulo(iid)+': '+v2Lc(nm)+' ausente.','RDC nº 67/2007, Anexo I, item 5.1.1');sit='Não possui (irregularidade '+k+')'}
     else if(ir.length||(d.xI==='I'&&d.outra)){sit=ir.map(x=>{const k=addIrr(v2ItemTitulo(iid)+' — '+nm+': '+v2Lc(x.t)+'.',v2Cite(x.ref));return x.t+' (irregularidade '+k+')'}).concat(d.xI==='I'&&d.outra?[d.outra+' (irregularidade '+addIrr(v2ItemTitulo(iid)+' — '+nm+': '+d.outra+'.','')+')']:[]).join('; ')}
     else sit=d.has==='NA'?'Não se aplica':'Sem irregularidades';
     rows.push([nm,id||'—',sit])}
    if(rows.length)corpo+=medTable(rows,['Equipamento','Identificação','Situação'])}
   if(comp.t==='plan'){const p=v.plan||{},fp=v.fields.plan||{};const partes=[];
    for(const[g,t,ref,itens]of V2.plan){const com=[],par=[],nao=[];itens.forEach((it,i)=>{const s=p[g+'-'+i];if(s==='C')com.push(v2Lc(it));if(s==='P')par.push(v2Lc(it));if(s==='NC')nao.push(v2Lc(it))});
     if(!com.length&&!par.length&&!nao.length)continue;let tx=t+': ';const seg=[];if(com.length)seg.push('completas — '+v2Join(com));if(par.length)seg.push('parciais — '+v2Join(par));if(nao.length){const k=addIrr('Planilhas de '+t.toLowerCase()+' não apresentadas: '+v2Join(nao)+'.',v2Cite(ref));seg.push('não apresentadas — '+v2Join(nao)+' (irregularidade '+k+')')}
     if(par.length){const k=addIrr('Planilhas de '+t.toLowerCase()+' incompletas: '+v2Join(par)+'.',v2Cite(ref));seg[seg.length-(nao.length?2:1)]+=' (irregularidade '+k+')'}
     partes.push(esc(tx+seg.join('; '))+'.'+(v.obs['plan-'+g]?' '+esc(v.obs['plan-'+g]):''))}
    if(partes.length)corpo+='<p>'+(fp.de||fp.ate?'Planilhas do período de '+manData(fp.de)+' a '+manData(fp.ate)+'. ':'Planilhas conferidas. ')+partes.join(' ')+'</p>'}
   if(comp.t==='table'){const key=iid+'-'+v2Slug(comp.title),rows=Object.values(v.tables[key]||{}).map(r=>comp.cols.map((_,j)=>String((r||{})[j]||'').trim())).filter(r=>r.some(Boolean));if(rows.length)corpo+='<p><b>'+esc(comp.title)+'</b></p>'+medTable(rows,comp.cols)}
   if(comp.t==='rast'){const d=v.rast[iid];if(d&&v2Ne(d)){const rot=v2Rotulo(),ins=Object.values(d.ins||{}).filter(x=>x&&String(x.n||'').trim());
     const ensF=comp.ensaios.filter((_,i)=>!(d.ens||{})[i]),rotF=rot.filter((_,i)=>!(d.rot||{})[i]);
     corpo+='<p>Preparação '+esc(comp.form)+': '+esc(d.prod||'produto não informado')+(d.om?', ordem de manipulação nº '+esc(d.om):'')+(d.omData?' de '+manData(d.omData):'')+(d.manip?', manipulada por '+esc(d.manip):'')+'.</p>';
     if(ins.length)corpo+=medTable(ins.map(x=>[x.n,x.lote||'',manData(x.val)||x.val||'',x.fab||'',x.nf||'']),['Excipiente / insumo','Lote','Validade','Fabricante','Nota fiscal']);
     const cqp=Object.values(d.ens||{}).some(Boolean);if(cqp)corpo+='<p>'+(ensF.length?'Controle de qualidade do produto acabado sem: '+esc(v2Join(ensF.map(v2Lc)))+' (irregularidade '+addIrr('Preparação '+comp.form+': ensaios não realizados ou não registrados — '+v2Join(ensF.map(v2Lc))+'.','RDC nº 67/2007, Anexo I, itens 9.1.1 e 9.1.2')+').':'Controle de qualidade do produto acabado completo.')+'</p>';
     const mpE=ENS_MP.filter((_,i)=>(d.mp||{})[i]);if(d.mpProd||mpE.length)corpo+='<p>Controle de qualidade da matéria-prima '+esc(d.mpProd||'')+(d.mpLote?' (lote '+esc(d.mpLote)+')':'')+': '+esc(mpE.length?v2Join(mpE.map(v2Lc)):'nenhum ensaio registrado')+'.</p>';
     const rotP=Object.values(d.rot||{}).some(Boolean);if(rotP)corpo+='<p>'+(rotF.length?'Rótulo sem: '+esc(v2Join(rotF.map(v2Lc)))+' (irregularidade '+addIrr('Preparação '+comp.form+': rótulo sem '+v2Join(rotF.map(v2Lc))+'.','RDC nº 67/2007, Anexo I, item 12.1')+').':'O rótulo contém todas as informações exigidas.')+'</p>'}}
   if(comp.t==='veg'||comp.t==='emb'){const arr=Object.values(v[comp.t][iid]||{}).filter(v2Ne);for(const d of arr){if(comp.t==='veg'){const ts=VEG_T.filter((_,j)=>(d.t||{})[j]);corpo+='<p>Matéria-prima vegetal '+esc(d.prod||'')+(d.lote?' (lote '+esc(d.lote)+')':'')+': '+(d.laudo?'laudo do fornecedor com os testes exigidos':'laudo do fornecedor sem todos os testes exigidos')+'; controle de qualidade da farmácia'+(d.cert?' (certificado '+esc(d.cert)+')':'')+': '+esc(ts.length?v2Join(ts.map(v2Lc)):'nenhum teste registrado')+'.</p>'}
     else{const cs=Object.keys(d.c||{}).filter(k=>d.c[k]);corpo+='<p>Embalagem '+esc(d.prod||'')+(d.lote?' (lote '+esc(d.lote)+')':'')+': '+[d.laudo?'laudo do fornecedor':'',d.cq?'controle de qualidade da farmácia'+(d.cert?' (certificado '+esc(d.cert)+')':''):''].filter(Boolean).join(' e ')+(cs.length?'; análise de '+esc(v2Join(cs.map(v2Lc))):'')+'.</p>'}}}
   if(comp.t==='mon'){const d=v.mon[comp.code];if(d&&v2Ne(d)){const rows=Object.values(d.rows||{}).filter(v2Ne);
     corpo+='<p><b>'+esc(comp.code+' '+comp.title)+'</b></p>'+(comp.kind==='agua'?medTable(rows.map(x=>[x.cert||'',manData(x.coleta)]),['Certificado','Coleta']):medTable(rows.map(x=>[x.prod||'',x.cert||'',x.lote||'',manData(x.manip),manData(x.ini)+(x.fim?' a '+manData(x.fim):'')]),['Produto','Certificado','Lote','Manipulada em','Análise']))
      +'<p>'+esc([d.emit&&('Emitidos por '+d.emit+(d.cnpj?', CNPJ '+d.cnpj:'')),d.fb&&('Farmacopeia Brasileira, '+d.fb+' edição'),d.res,d.sign&&('Assinado por '+d.sign)].filter(Boolean).join('. '))+(rows.length<comp.n?' Apresentadas '+rows.length+' de '+comp.n+' análises exigidas (irregularidade '+addIrr(comp.title.split(' — ')[0]+': apresentadas '+rows.length+' de '+comp.n+' análises.',comp.v2Cite(ref))+').':'')+'</p>';
     if(d.res==='Amostra não cumpre as especificações')corpo+='<p>Resultado insatisfatório (irregularidade '+addIrr(comp.title.split(' — ')[0]+': resultado insatisfatório.',comp.v2Cite(ref))+').</p>'}}
  }
  const env=state.env[s.code];if(env&&v2Ne(env))corpo+=medTable(medObjectRows({'Temperatura/umidade no momento':env}));
  if(v.obs[iid])corpo+='<p><b>Observações:</b> '+esc(v.obs[iid])+'</p>';
 if(sitTxt.length)corpo='<p>'+sitTxt.join(' ')+'</p>'+corpo;
 return corpo;
}
/* Anexo fotográfico: fotos agrupadas por item, na ordem do roteiro, com o marcador de onde foram tiradas. */
function v2FotoInfo(f){
 const v=v2State(),id=f.key.split('::')[0],labels=v.photoLabels||{};let iid='',leg=labels[id]||'';
 const reqs={};for(const card of Object.values(APP_DATA.cards))for(const s of card.sections)for(const q of s.requirements)reqs[q.id]=[s.item,s.itemNum+' '+s.itemTitle+' · '+q.text];
 if(reqs[id]){iid=reqs[id][0];leg=leg||reqs[id][1]}
 else if(id.startsWith('v2:')){const[,sc,k]=id.split(':');iid=sc==='mon'?'i'+k.split('.').slice(0,2).join('.'):sc==='plan'?'i2.4':sc;
  const d=(v.rast||{})[sc];if(d&&(d.prod||d.om))leg+=' — '+[d.prod,d.om&&('OM nº '+d.om)].filter(Boolean).join(', ');
  const m=/^(veg|emb)(\d)/.exec(k);if(m){const x=((v[m[1]]||{})[sc]||{})[m[2]]||{};if(x.prod||x.lote)leg+=' — '+[x.prod,x.lote&&('lote '+x.lote)].filter(Boolean).join(', ')}
  const a=/^(\d+\.\d+\.\d+)-a(\d)$/.exec(k);if(a){const r=(((v.mon||{})[a[1]]||{}).rows||{})[a[2]]||{};if(r.cert)leg+=' — certificado '+r.cert}
  if(!leg)leg=v2ItemTitulo(iid)}
 else if(id.startsWith('pop:')){iid='i2.2';leg=leg||'2.2 Procedimentos Operacionais Padrão'}
 else if(id.startsWith('trein:')){iid='i2.3';leg=leg||'2.3 Treinamento'}
 const ts=parseInt((f.key.split('::')[1]||'').slice(0,8),36)||0;
 return {iid,leg:leg||('Seção '+f.card),ts};
}
function v2AnexoFotos(){
 const ordem={};let n=0;for(const c of Object.values(APP_DATA.cards))for(const s of c.sections)ordem[s.item]=n++;
 const fotos=v2Fotos.map(f=>Object.assign({},f,v2FotoInfo(f))).filter(f=>!v2State().itemNA[f.iid]).sort((a,b)=>(a.card-b.card)||((ordem[a.iid]??999)-(ordem[b.iid]??999))||(a.ts-b.ts));
 if(!fotos.length)return '';let h='<h3>Anexo fotográfico</h3><p>'+fotos.length+' foto'+(fotos.length>1?'s':'')+', agrupadas por item do roteiro. A legenda indica o item e o documento ou local fotografado. As fotos estão em resolução reduzida; os originais ficam no aparelho.</p>',grupo=null,k=0;
 for(const f of fotos){if(f.iid!==grupo){grupo=f.iid;h+='<h4>'+esc(f.iid?v2ItemTitulo(f.iid):'Outras')+'</h4>'}k++;
  h+='<figure class="v2-foto"><img src="'+f.url+'" alt="Foto '+k+'"><figcaption>Foto '+k+' — '+esc(f.leg)+'</figcaption></figure>'}
 return h;
}
function renderPreview(){
 const root=$('#reportPreview');if(!root)return;const r=state.report,v=v2State(),c=state.char||{};
 const irr=[];const addIrr=(texto,cit)=>{irr.push({texto,cit});return irr.length};
 const refTxt=refs=>(refs||[]).map(x=>x.law+', '+String(x.device).replace(' · Item ',', item ').replace(' · ',', ')).join('; ');
 const ROT={razao:'Razão social',fantasia:'Nome fantasia',cnpj:'CNPJ',cmvs:'Licença sanitária / CMVS',validade:'Validade da licença',endereco:'Endereço',fone:'Telefone',email:'E-mail',horario:'Horário de funcionamento',rl:'Responsável legal',cpf:'CPF do responsável legal',rt:'Responsável técnico',crf:'CRF-SP',afe:'AFE nº',afeData:'AFE publicada em',ae:'AE nº',aeData:'AE publicada em',atividades:'Atividades licenciadas'};
 const fmt=x=>/^\d{4}-\d{2}-\d{2}$/.test(String(x))?manData(x):String(x);
 let h='<h2>RELATÓRIO DE INSPEÇÃO SANITÁRIA — FARMÁCIA COM MANIPULAÇÃO</h2>';
 h+='<h3>1 · Identificação da empresa</h3>'+medTable(Object.keys(ROT).filter(k=>String(state.identity[k]||'').trim()).map(k=>[ROT[k],fmt(state.identity[k])]));
 /* Caracterização */
 const L={homeopaticas:'homeopáticas',fitoterapicas:'fitoterápicas',alopaticas:'alopáticas',oficinais:'oficinais',hormonios:'hormônios',antibioticos:'antibióticos',penicilinicos:'penicilínicos',cefalosporinicos:'cefalosporínicos',citostaticos:'citostáticos',controle:'substâncias sujeitas a controle especial',solida:'sólidas',semissolida:'semissólidas',liquida:'líquidas'};
 const tr=a=>(a||[]).map(x=>L[x]||x);const car=[];
 if(c.groups?.length)car.push('O estabelecimento exerce as atividades do'+(c.groups.length>1?'s Grupos ':' Grupo ')+v2Join(c.groups)+' da RDC nº 67/2007');
 if(c.preps?.length)car.push('com preparações '+v2Join(tr(c.preps)));
 if(c.forms?.length)car.push('nas formas farmacêuticas '+v2Join(tr(c.forms)));
 let ptxt=car.length?car.join(', ')+'.':'';
 if(c.cats?.length)ptxt+=' Manipula '+v2Join(tr(c.cats))+'.';
 if(c.sbitList?.length)ptxt+=' Entre as substâncias de baixo índice terapêutico, manipula '+v2Join(c.sbitList.map(v2Lc))+'.';
 if(c.basesList?.length)ptxt+=' Utiliza as bases galênicas '+v2Join(c.basesList.map(v2Lc))+(c.bases?' ('+({adquiridas:'adquiridas',manipuladas:'manipuladas',ambas:'adquiridas e manipuladas'}[c.bases])+')':'')+'.';
 if(c.excipList?.length)ptxt+=' Excipientes padronizados: '+v2Join(c.excipList.map(v2Lc))+'.';
 const outras=[];if(c.industrializados)outras.push('dispensa medicamentos industrializados');if(c.servicos)outras.push('presta serviços farmacêuticos');if(c.domicilio)outras.push('realiza entregas em domicílio');if(c.remota)outras.push('realiza venda remota');if(c.vegetal)outras.push('utiliza matéria-prima vegetal');if(c.autoisoterapicos)outras.push('prepara auto-isoterápicos');if(c.quimicos==='sim')outras.push('utiliza produtos químicos controlados'+(state.identity.quimicosDesc?' ('+state.identity.quimicosDesc+')':''));
 if(outras.length)ptxt+=' '+v2Join(outras).replace(/^./,m=>m.toUpperCase())+'.';
 const fc=v.fields.carac||{};const nums=[];if(fc.func)nums.push(fc.func+' funcionários');if(fc.farm)nums.push(fc.farm+' farmacêuticos');if(fc.formulas)nums.push('média de '+fc.formulas+' fórmulas por dia');if(nums.length)ptxt+=' Conta com '+v2Join(nums)+'.';
 if(fc.sistema)ptxt+=' Sistema informatizado: '+fc.sistema+'.';if(fc.outros)ptxt+=' '+fc.outros+'.';
 h+='<h3>2 · Inspeção e caracterização da atividade</h3>'+(state.identity.infoGerais?'<p>'+esc(state.identity.infoGerais)+'</p>':'')+(ptxt.trim()?'<p>'+esc(ptxt.trim())+'</p>':'')+(state.identity.ncAnteriores?'<p><b>Não conformidades anteriores / referência:</b> '+esc(state.identity.ncAnteriores)+'</p>':'');
 /* Blocos */
 let num=2;
 for(const[n,card]of Object.entries(APP_DATA.cards)){
  let bloco='';
  for(const s of card.sections){
   const corpo=v2ItemCorpo(n,card,s,addIrr);
   if(corpo)bloco+='<h4>'+esc(s.itemNum+' '+s.itemTitle)+'</h4>'+corpo;
  }
  if(bloco){num++;h+='<h3>'+num+' · '+esc(card.title)+'</h3>'+bloco}
 }
 num++;h+='<h3>'+num+' · Irregularidades observadas</h3>'+(irr.length?'<ol>'+irr.map(x=>'<li>'+esc(x.texto)+(x.cit?' <i>'+esc(x.cit.replace(/\.$/,''))+'.</i>':'')+'</li>').join('')+'</ol>':'<p>Nenhuma irregularidade registrada.</p>');
 num++;h+='<h3>'+num+' · Documentação pendente</h3>'+medTable(r.pending.filter(x=>x.doc).map(x=>[x.doc,manData(x.prazo)]),['Documento','Prazo']);
 num++;h+='<h3>'+num+' · Considerações finais e avaliação de risco</h3><p>'+esc(r.consideracoes||'Não informado.')+'</p>';
 num++;h+='<h3>'+num+' · Conclusão</h3><p>'+esc(r.conclusao||'Não informada.')+'</p>';
 num++;h+='<h3>'+num+' · Medidas adotadas</h3>'+medTable(Object.entries({'Auto de Infração':r.medidas.auto,'Termo de Interdição':r.medidas.interdicao,'Tipo de interdição':r.medidas.interdicao?r.medidas.tipo:'','Outros':r.medidas.outros}).filter(x=>String(x[1]||'').trim()));
 num++;h+='<h3>'+num+' · Equipe inspetora</h3>'+medTable(r.equipe.filter(x=>x.nome).map(x=>[x.nome,x.matricula]),['Nome','Matrícula']);
 if(v2Fotos&&v2Fotos.length)h+=v2AnexoFotos();
 root.innerHTML=h;
 if(!v2Fotos&&state.activeTab==='relatorio')v2CarregarFotos();
}
