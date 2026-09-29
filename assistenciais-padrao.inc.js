/* ——— Serviços assistenciais no Padrão UVIS (padrao-uvis.js) ———
   Fragmento inserido no script principal do app--servicos-assistenciais por
   scripts/repack-padrao.cjs. Cada modalidade é aberta direto do cartão do núcleo
   (servico=<id>); a tela da modalidade segue o padrão:
   · Seção 1 “Identificação e serviço”: dados do estabelecimento; modalidade (demais
     acolhimentos), enquadramento, alerta e CNAE.
   · Seção 2 “Documentos” e Seção 3 “Inspeção”: cada grupo do instrumento é um item.
   · Seção 4 “Dimensionamento de pessoal”, quando a modalidade tem calculadora.
   Estado, chaves por modalidade (salvas por modalidade), fotos, relatório e art. 69
   continuam os mesmos. */
const AS_PADRAO=!!(window.UvisPadrao&&window.__uvsPadrao);
const asCalcOriginal=renderCalc;
function asGrupos(kind){const by=[];current[kind].forEach((x,i)=>{let g=by.find(b=>b.g===x.g);if(!g){g={g:x.g,idx:[]};by.push(g)}g.idx.push(i)});return by}
const asSemSub=()=>current.id==='demais'&&!profile().subtype;
const AS_CAMPOS=['name','document','cmvs','address','date','team'];
function asSecoes(){
 const m=meta(),sub=current.sub&&profile().subtype?(current.sub.find(s=>s.k===profile().subtype)||{}).r:'';
 const s1={id:'ident',titulo:'Identificação e serviço',curto:'Identificação',icone:'building',resumo:current.titulo+(m.name?' · '+m.name:''),itens:[
  {id:'dados',titulo:'Identificação do estabelecimento',curto:'Estabelecimento',feitos:AS_CAMPOS.filter(k=>m[k]).length,total:AS_CAMPOS.length},
  Object.assign({id:'servico',titulo:current.sub?'Modalidade e enquadramento':'Sobre este serviço',curto:current.sub?'Modalidade':'Sobre o serviço',resumo:current.sub?(sub||'Escolha a modalidade para continuar'):'Enquadramento, alerta e CNAE'},current.sub?{feitos:sub?1:0,total:1}:{})
 ]};
 if(asSemSub())return [s1];
 const L=[s1];
 [['doc','Documentos','folder'],['rot','Inspeção','plan']].forEach(([kind,tit,ic])=>L.push({id:kind,titulo:tit,curto:tit,icone:ic,
  resumo:kind==='doc'?'Documentos apresentados na inspeção.':'Verificação dos ambientes, do cuidado e dos registros.',
  itens:asGrupos(kind).map(g=>({id:kind+':'+g.g,titulo:g.g,curto:g.g,feitos:g.idx.filter(i=>mark(kind,i)).length,total:g.idx.length}))}));
 if(current.calc)L.push({id:'calc',titulo:'Dimensionamento de pessoal',curto:'Dimensionamento',icone:'people',itens:[{id:'calc',titulo:current.calc.titulo||'Dimensionamento de pessoal',curto:'Calculadora'}]});
 return L;
}
const AS_VAL={doc:[['C','Apresentou'],['NC','Não apresentou'],['NA','Não se aplica']],rot:[['C','Cumpre'],['NC','Não cumpre'],['NA','Não se aplica']]};
function asPergunta(kind,i,n){
 const it=current[kind][i],st=mark(kind,i),foto=photoIndex.get(photoItem(kind,i));
 return `<div class="pu-q" data-as-q="${kind}|${i}"><p class="pu-q-texto"><b>${n}.</b> ${esc(it.i)}</p><div class="cite">${refButtons(it)}</div>`
  +`<div class="pu-resp" role="group" aria-label="Resultado">${AS_VAL[kind].map(([v,l])=>`<button type="button" data-as-mark="${v}" data-kind="${kind}" data-index="${i}" data-v="${v}" aria-pressed="${st===v}">${l}</button>`).join('')}</div>`
  +`<details class="pu-mais"><summary>Foto${foto?' ✓':''}</summary><div>${photoHtml(kind,i)}</div></details></div>`;
}
function asItemGrupo(el,kind,g){
 const grupo=asGrupos(kind).find(x=>x.g===g);if(!grupo){el.innerHTML='<p class="pu-q-ajuda">Grupo não disponível.</p>';return}
 el.innerHTML=grupo.idx.map((i,n)=>asPergunta(kind,i,n+1)).join('')
  +`<div class="pu-acoes-item"><button type="button" class="pu-btn" data-as-na="${esc(kind)}">Marcar pendentes como Não se aplica</button></div>`;
}
function asIdent(el,id){
 if(id==='dados'){const m=meta();const L=[['name','Estabelecimento'],['document','CNPJ ou CPF'],['cmvs','CMVS / processo'],['address','Endereço'],['date','Data','date'],['team','Equipe']];
  el.innerHTML='<div class="pu-bloco"><h3>Dados do estabelecimento</h3><p>Opcional. Sai no cabeçalho do relatório.</p><div class="pu-campos">'+L.map(([k,l,t])=>`<label>${l}<input data-as-meta="${k}"${t?` type="${t}"`:''}${k==='document'?' inputmode="numeric"':''} value="${esc(m[k]||'')}"></label>`).join('')+'</div></div>';return}
 el.innerHTML=(current.sub?`<div class="pu-bloco"><h3>Modalidade do acolhimento</h3><p>Cada modalidade tem o próprio instrumento e as próprias respostas.</p><div class="pu-campos"><label>Modalidade<select data-as-sub><option value="">Escolher para continuar</option>${current.sub.map(s=>`<option value="${esc(s.k)}"${profile().subtype===s.k?' selected':''}>${esc(s.r)}</option>`).join('')}</select></label></div></div>`:'')
  +`<div class="pu-bloco"><h3>${esc(current.titulo)}</h3><p class="pu-q-ajuda">${esc(current.review||'')}</p><p><b>Enquadramento:</b> ${esc(current.enquadramento)}</p><div class="pu-bloco pu-aviso"><p><b>Atenção:</b> ${esc(current.nota)}</p></div>${cnaeHtml()}</div>`;
}
function asCalc(el){el.innerHTML='<div id="content"></div>';asCalcOriginal()}
function asDesenhaItem(secao,item,el){
 if(secao==='ident')asIdent(el,item);
 else if(secao==='calc')asCalc(el);
 else{const p=item.indexOf(':');asItemGrupo(el,item.slice(0,p),item.slice(p+1))}
}
function asRedesenha(){
 const n=UvisPadrao.estado(),c=document.getElementById('pu-conteudo');
 if(n.aba==='roteiro'&&n.item&&c&&n.secao!=='calc'&&!(n.secao==='ident'&&c.contains(document.activeElement)&&document.activeElement.matches('input,select,textarea'))){const y=window.scrollY,ab=[].map.call(c.querySelectorAll('details[open]'),d=>d.closest('[data-as-q]')?.dataset.asQ);asDesenhaItem(n.secao,n.item,c);ab.forEach(q=>{const d=q&&c.querySelector('[data-as-q="'+q+'"] details');if(d)d.open=true});window.scrollTo(0,y)}
 if(n.aba==='infracoes'){const a=document.getElementById('pu-aba');if(a)asInfracoes(a)}
 UvisPadrao.atualiza();
}
const asInfAbertos=new Set();
function asInfracoes(el){
 const by=asGrupos('inf'),n=current.inf.filter((_,i)=>mark('inf',i)==='SEL').length;
 el.innerHTML=`<div class="pu-bloco"><h3>Infrações</h3><p>Redação de apoio: marque somente o que foi constatado e confirme o fato. Nenhuma resposta do roteiro marca infração sozinha. ${n} selecionada(s).</p></div>`
  +by.map(g=>{const sel=g.idx.filter(i=>mark('inf',i)==='SEL').length;return `<details class="pu-mais pu-inf-grupo" data-as-inf="${esc(g.g)}"${asInfAbertos.has(g.g)?' open':''}><summary>${esc(g.g)} · ${g.idx.length} ${g.idx.length===1?'item':'itens'}${sel?' · '+sel+' selecionada(s)':''}</summary><div>`
   +g.idx.map(i=>{const it=current.inf[i],on=mark('inf',i)==='SEL';return `<div class="pu-q"><p class="pu-q-texto">${esc(it.i)}</p><div class="cite">${refButtons(it)}</div><div class="pu-acoes-item"><button type="button" class="pu-btn${on?' pu-btn-pri':''}" data-as-mark="SEL" data-kind="inf" data-index="${i}" aria-pressed="${on}">${on?'✓ Selecionada':'Selecionar'}</button></div></div>`}).join('')
   +'</div></details>'}).join('');
}
function asRelatorio(el){
 let f=0,t=0,nc=0;['doc','rot'].forEach(kind=>current[kind].forEach((_,i)=>{t++;const v=mark(kind,i);if(v)f++;if(v==='NC')nc++}));
 const inf=current.inf.filter((_,i)=>mark('inf',i)==='SEL').length;
 el.innerHTML=`<div class="pu-bloco"><h3>Resumo da inspeção</h3><p>${esc(current.titulo)}${meta().name?' · '+esc(meta().name):''}</p>
  <div class="pu-campos"><div class="pu-campo">Respondidos<b>${f} de ${t}</b></div><div class="pu-campo">Não conformes<b>${nc}</b></div><div class="pu-campo">Infrações selecionadas<b>${inf}</b></div><div class="pu-campo">Fotos<b>${photoIndex.size}</b></div></div>
  <div class="pu-acoes-item"><button type="button" class="pu-btn pu-btn-pri" data-as-rel>Gerar Word / PDF</button><button type="button" class="pu-btn" data-as-pendente>Ir à próxima verificação pendente</button></div></div>`;
}
function asBotoes(){const a=document.querySelector('.pu-header .pu-acoes');if(!a)return;['uvs-fotos','uvs-botao'].forEach(id=>{const b=document.getElementById(id);if(b&&b.parentNode!==a){b.classList.add('uvs-fluxo');a.appendChild(b)}})}
async function asInicia(id){
 current=SERVICES.find(s=>s.id===id);tab='inf';query='';openGroups.clear();
 ['body > header','body > main#app','#bottom'].forEach(q=>{const n=document.querySelector(q);if(n){n.hidden=true;n.setAttribute('data-pu-oculto','')}});
 await loadPhotos();
 /* as rotinas originais redesenham a lista depois de marcar, fotografar etc. */
 renderList=asRedesenha;render=asRedesenha;renderHome=asRedesenha;
 const velho=document.querySelector('main#app');if(velho)velho.innerHTML='';
 const raiz=document.createElement('div');raiz.id='pu-raiz';document.body.insertBefore(raiz,document.body.firstChild);
 UvisPadrao.monta({
  raiz,titulo:current.nome,cor:'#80566B',
  abas:[{id:'roteiro',rotulo:'Roteiro'},{id:'infracoes',rotulo:'Infrações'},{id:'relatorio',rotulo:'Relatório'}],
  inicio:asSemSub()?{aba:'roteiro',secao:'ident',item:'servico'}:null,
  secoes:asSecoes,
  item:(s,it,el)=>asDesenhaItem(s.id,it.id,el),
  aba:(id,el)=>{if(id==='infracoes')asInfracoes(el);else if(id==='relatorio')asRelatorio(el)},
  contagem:id=>id==='roteiro'?['doc','rot'].reduce((n,kind)=>n+current[kind].filter((_,i)=>mark(kind,i)==='NC').length,0):id==='infracoes'?current.inf.filter((_,i)=>mark('inf',i)==='SEL').length:0,
  limpar:async(s,it)=>{
   if(s.id==='ident'){if(!it||it.id==='dados')delete saved[scope()+'|meta'];if((!it||it.id==='servico')&&current.sub){profile().subtype=''}}
   else if(s.id==='calc')delete saved[scope()+'|calc'];
   else{for(const x of (it?[it]:s.itens)){const p=x.id.indexOf(':'),kind=x.id.slice(0,p),g=asGrupos(kind).find(y=>y.g===x.id.slice(p+1));for(const i of (g?g.idx:[])){delete saved[k(kind,i)];await deletePhoto(photoItem(kind,i))}}}
   persist();asRedesenha();
  }
 });
 [400,1500,3000].forEach(t=>setTimeout(asBotoes,t));
 new MutationObserver(asBotoes).observe(document.body,{childList:true});
 raiz.addEventListener('click',async e=>{
  const t=e.target,mk=t.closest('[data-as-mark]');
  if(mk){const kind=mk.dataset.kind,i=+mk.dataset.index,v=mk.dataset.asMark;saved[k(kind,i)]=mark(kind,i)===v?'':v;persist();asRedesenha();return}
  const lg=t.closest('[data-law][data-node]');if(lg){e.preventDefault();openLegal(lg.dataset.law,lg.dataset.node);return}
  const rp=t.closest('[data-remove-photo]');if(rp){await deletePhoto(rp.dataset.removePhoto);asRedesenha();return}
  const na=t.closest('[data-as-na]');if(na){const n=UvisPadrao.estado(),p=n.item.indexOf(':'),kind=n.item.slice(0,p),g=asGrupos(kind).find(y=>y.g===n.item.slice(p+1));(g?g.idx:[]).forEach(i=>{if(!mark(kind,i))saved[k(kind,i)]='NA'});persist();asRedesenha();return}
  if(t.closest('[data-as-rel]')){buildReport();showModal('reportModal');return}
  if(t.closest('[data-as-pendente]')){for(const s of asSecoes())for(const it of s.itens)if(it.total&&it.feitos<it.total){UvisPadrao.vai({aba:'roteiro',secao:s.id,item:it.id});return}alert('Todas as verificações foram respondidas.');return}
 });
 raiz.addEventListener('toggle',e=>{const d=e.target.closest&&e.target.closest('[data-as-inf]');if(d){if(d.open)asInfAbertos.add(d.dataset.asInf);else asInfAbertos.delete(d.dataset.asInf)}},true);
 raiz.addEventListener('input',e=>{const t=e.target;if(t.dataset.asMeta){meta()[t.dataset.asMeta]=t.value;persist();UvisPadrao.atualiza()}});
 raiz.addEventListener('change',async e=>{const t=e.target;
  if(t.matches('[data-photo]')){onPhoto(t);return}
  if(t.matches('[data-as-sub]')){profile().subtype=t.value;persist();await loadPhotos();asRedesenha();if(t.value)UvisPadrao.vai({aba:'roteiro',secao:null,item:null});return}
 });
}
