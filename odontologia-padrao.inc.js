/* ——— Odontologia no Padrão UVIS (padrao-uvis.js) ———
   Fragmento inserido no fim do script principal do app--odontologia por
   scripts/repack-padrao.cjs. Troca só a tela: estado (odonto-rdc1002-v1), respostas,
   evidências, enquadramentos, relatório e tabela de infrações continuam os mesmos, com os
   mesmos atributos (data-a, data-meta, data-psel, data-p, data-evidence, data-assessment,
   data-legal) tratados pelos ouvintes originais.
   · Seção 1 “Perfil e identificação”: identificação e perfil do serviço (situação,
     tipologia, organização, processamento, características).
   · Seções 2 a 5: as etapas da RDC nº 1.002/2025 agrupadas por área; cada etapa é um item.
   · O perfil não esconde etapas (decisão da equipe): o que não corresponde ao perfil
     marcado traz aviso e pode ser marcado como “Não se aplica”. */
const ODO_PADRAO=!!(window.UvisPadrao&&window.__uvsPadrao);
const ODO_GRUPOS=[
 {id:'docs',titulo:'Licenciamento e ambientes de apoio',icone:'folder',etapas:['lic','apoio']},
 {id:'assist',titulo:'Assistência, equipamentos e radiologia',icone:'tooth',etapas:['fin','cco','eq','emer','rx']},
 {id:'processa',titulo:'Processamento de dispositivos médicos',icone:'lab',etapas:['estr','proc','est','des','arm','terc']},
 {id:'gestao',titulo:'Qualidade, resíduos e atendimento externo',icone:'shield',etapas:['qual','res','extra']}
];
/* avaliação do perfil sem depender de ok() (que passa a aceitar tudo) */
function odoNoPerfil(w){
 if(!w||!Object.keys(w).length)return true;
 if(w.or)return Object.entries(w.or).some(([k,v])=>odoNoPerfil({[k]:v}));
 const P=state.p;
 if(w.tip&&!w.tip.includes(P.tip))return false;
 if(w.tipNot&&w.tipNot.includes(P.tip))return false;
 if(w.org&&!w.org.includes(P.org))return false;
 if(w.proc&&!w.proc.includes(P.proc))return false;
 if(w.procNot&&w.procNot.includes(P.proc))return false;
 if(w.flag&&!w.flag.every(f=>P.flags[f]))return false;
 if(w.flagAny&&!w.flagAny.some(f=>P.flags[f]))return false;
 return true;
}
function odoMotivo(w){
 if(!w||!state.p.tip||odoNoPerfil(w))return '';
 const L=[],nomes=a=>a.map(v=>LBL[v]||v).join(' / ');
 (function junta(x){if(!x)return;
  if(x.tip)L.push('tipologia '+nomes(x.tip));if(x.tipNot)L.push('tipologia diferente de '+nomes(x.tipNot));
  if(x.org)L.push('organização '+nomes(x.org));if(x.proc)L.push('processamento '+nomes(x.proc));if(x.procNot)L.push('processamento que não seja '+nomes(x.procNot));
  if(x.flag)L.push(nomes(x.flag));if(x.flagAny)L.push(nomes(x.flagAny));
  if(x.or)Object.entries(x.or).forEach(([k,v])=>junta({[k]:v}));})(w);
 return L.join('; ')||'perfil marcado';
}
if(ODO_PADRAO)ok=function(){return true};
const odoEtapa=id=>DATA.route.find(s=>s.id===id);
const odoFora=(s,i)=>odoMotivo(s.when)||odoMotivo(i.when);

function odoSecoes(){
 const P=state.p,campos=Object.keys(DEF.meta);
 const perfil={id:'perfil',titulo:'Perfil e identificação',curto:'Perfil',icone:'building',
  resumo:(P.tip?LBL[P.tip]:'Tipologia não escolhida')+(state.meta.company?' · '+state.meta.company:''),
  itens:[
   {id:'ident',titulo:'Identificação da inspeção',curto:'Identificação',feitos:campos.filter(k=>state.meta[k]).length,total:campos.length},
   {id:'perfil',titulo:'Perfil do serviço',curto:'Perfil do serviço',resumo:'Situação, tipologia, organização, processamento e características.',feitos:['situacao','tip','org','proc'].filter(k=>P[k]).length,total:4}
  ]};
 const lista=[perfil];
 ODO_GRUPOS.forEach(g=>{
  const itens=g.etapas.map(odoEtapa).filter(Boolean).map(s=>{
   const fora=odoMotivo(s.when);
   return {id:s.id,titulo:s.title,curto:s.title,resumo:fora?'Fora do perfil marcado':s.place,feitos:s.items.filter(i=>state.a[i.id]).length,total:s.items.length};
  });
  if(itens.length)lista.push({id:g.id,titulo:g.titulo,curto:g.titulo,icone:g.icone,itens});
 });
 return lista;
}

function odoPergunta(s,i,n,porSala){
 const a=state.a[i.id]||'',fora=porSala&&odoDaSala(i)?'':odoFora(s,i);
 return `<div class="pu-q${fora?' pu-q-fora':''}" data-odo-q="${esc(i.id)}"><div><p class="pu-q-texto item-t"><b>${n}.</b> ${esc(i.t)}</p>`
  +(fora?`<div class="pu-tags"><span class="pu-tag pu-tag-fora">Fora do perfil marcado</span></div><p class="pu-q-ajuda">Depende de: ${esc(fora)}. Se não existir no serviço, marque “Não se aplica”.</p>`:'')
  +`<div class="cite pu-cit-odo">${uvisOdontoCitation(i.ch,i.c)}</div></div>`
  +`<div class="pu-resp" role="group" aria-label="Resultado">${[['ok','Cumpre'],['nao','Não cumpre'],['na','Não se aplica']].map(([v,l])=>`<button type="button" data-a="${esc(i.id)}" data-v="${v}" aria-pressed="${a===v}">${l}</button>`).join('')}</div>`
  +(a==='nao'?`<div class="pu-bloco pu-nc">${assessmentHtml(i)}</div>`:'')
  +`</div>`;
}
/* Ambiente finalístico: “uma resposta abre outra” — as exigências de área e instalação dependem
   do tipo de sala; o serviço pode ter mais de um (ex.: consultório Classe I + sala de imagem). */
const ODO_SALAS=['amb','classe1','classe1_sed','classe2','coletivo','imagem','cco'];
function odoSalas(){if(!Array.isArray(state.salas)||(!state.salas.length&&!state.salasMarcadas))state.salas=ODO_SALAS.includes(state.p.tip)?[state.p.tip]:[];return state.salas}
const odoDaSala=i=>!!(i.when&&i.when.tip&&Object.keys(i.when).length===1);
function odoItemSalas(el,s){
 const salas=odoSalas(),mostra=i=>!odoDaSala(i)||!salas.length||i.when.tip.some(t=>salas.includes(t));
 const vis=[],outras=[];s.items.forEach((i,k)=>(mostra(i)?vis:outras).push([i,k+1]));
 const pend=outras.filter(([i])=>!state.a[i.id]).length;
 el.innerHTML=`<p class="pu-desc">${esc(s.place||'')}</p>`
  +`<div class="pu-bloco pu-salas"><h3>Salas existentes no serviço</h3><p>Marque todos os tipos de sala do estabelecimento. As exigências de área e instalação de cada tipo aparecem abaixo; as dos demais tipos ficam recolhidas no fim.</p><div class="pu-marcas">`
  +ODO_SALAS.map(t=>`<label class="pu-marca"><input type="checkbox" data-odo-sala="${esc(t)}"${salas.includes(t)?' checked':''}><span><strong>${esc(LBL[t]||t)}</strong></span></label>`).join('')+`</div></div>`
  +vis.map(([i,n])=>odoPergunta(s,i,n,true)).join('')
  +(outras.length?`<details class="pu-mais pu-outras-salas"><summary>Exigências de outros tipos de sala (${outras.length}${pend?' · '+pend+' pendente(s)':''})</summary><div>${pend?`<div class="pu-acoes-item"><button type="button" class="pu-btn" data-odo-na="salas">Marcar as ${pend} pendentes como Não se aplica</button></div>`:''}${outras.map(([i,n])=>odoPergunta(s,i,n,true)).join('')}</div></details>`:'')
  +`<div class="pu-acoes-item"><button type="button" class="pu-btn" data-odo-na="pendentes">Marcar pendentes como Não se aplica</button></div>`;
}
function odoItemEtapa(el,s){
 if(s.id==='fin')return odoItemSalas(el,s);
 const fora=s.items.filter(i=>odoFora(s,i)&&!state.a[i.id]).length,motivo=odoMotivo(s.when);
 el.innerHTML=`<p class="pu-desc">${esc(s.place||'')}</p>`
  +(motivo?`<div class="pu-bloco pu-aviso"><p><b>Fora do perfil marcado</b> (${esc(motivo)}). Se a etapa não existir no serviço, marque tudo como “Não se aplica”.</p><button type="button" class="pu-btn" data-odo-na="todos">Marcar tudo como Não se aplica</button></div>`:'')
  +s.items.map((i,k)=>odoPergunta(s,i,k+1)).join('')
  +`<div class="pu-acoes-item"><button type="button" class="pu-btn" data-odo-na="pendentes">Marcar pendentes como Não se aplica</button>`
  +(fora&&!motivo?`<button type="button" class="pu-btn" data-odo-na="fora">Marcar as ${fora} fora do perfil como Não se aplica</button>`:'')+`</div>`;
}
/* os campos originais (com seus ouvintes) são levados para a tela do item */
const odoNos={};
function odoNo(chave,sel){if(!odoNos[chave])odoNos[chave]=document.querySelector(sel);return odoNos[chave]}
function odoPerfil(el,id){
 if(id==='ident'){el.innerHTML='<div class="pu-bloco"><h3>Dados do serviço e da inspeção</h3></div>';const g=odoNo('meta','#mcard .meta-grid');if(g){g.classList.add('pu-campos');el.firstChild.appendChild(g)}renderMeta();return}
 const fora=allItems().filter(i=>{const s=DATA.route.find(x=>x.items.includes(i));return s&&odoFora(s,i)&&!state.a[i.id]}).length;
 el.innerHTML=`<div class="pu-bloco"><h3>Perfil do serviço</h3><p>Todas as etapas continuam no roteiro. O que não corresponder ao perfil aparece com o aviso “Fora do perfil marcado”.</p><div id="odo-pf"></div><p class="pu-q-ajuda">${esc(adaptationNote())}</p></div>`
  +(fora?`<div class="pu-bloco pu-aviso"><p>${fora} verificação(ões) pendente(s) fora do perfil marcado.</p><button type="button" class="pu-btn" data-odo-na="perfil">Marcar todas como Não se aplica</button></div>`:'');
 const pf=odoNo('pf','#pfields');if(pf)el.querySelector('#odo-pf').appendChild(pf);renderProfile();
}
function odoDesenhaItem(secao,item,el){
 if(secao==='perfil')odoPerfil(el,item);
 else{const s=odoEtapa(item);if(s)odoItemEtapa(el,s);else el.innerHTML='<p class="pu-q-ajuda">Etapa não disponível.</p>'}
}
function odoRedesenha(){
 const n=UvisPadrao.estado(),c=document.getElementById('pu-conteudo');
 if(n.aba==='roteiro'&&n.item&&c&&!(n.secao==='perfil'&&c.contains(document.activeElement)&&document.activeElement.matches('input,select,textarea'))){const y=window.scrollY;odoDesenhaItem(n.secao,n.item,c);window.scrollTo(0,y)}
 UvisPadrao.atualiza();
}
function odoRelatorio(el){
 const c=counts(),n=nSel();
 el.innerHTML=`<div class="pu-bloco"><h3>Resumo da inspeção</h3><p>${esc(state.p.tip?LBL[state.p.tip]:'Tipologia não escolhida')}${state.meta.company?' · '+esc(state.meta.company):''}</p>
  <div class="pu-campos"><div class="pu-campo">Respondidos<b>${c.ans} de ${c.it.length}</b></div><div class="pu-campo">Não cumpre<b>${c.nao}</b></div><div class="pu-campo">Não avaliados<b>${c.pend}</b></div><div class="pu-campo">Enquadramentos selecionados<b>${n}</b></div></div>
  <div class="pu-acoes-item"><button type="button" class="pu-btn pu-btn-pri" data-odo-gen>Gerar relatório</button><button type="button" class="pu-btn" data-odo-pendente>Ir à próxima verificação pendente</button></div>
  <p class="pu-q-ajuda">O relatório usa apenas o roteiro. A tabela de infrações é emitida na aba Infrações.</p></div>`;
}
function iniciaPadrao(){
 ['body > header.top','body > main','body > .dock'].forEach(q=>{const n=document.querySelector(q);if(n){n.hidden=true;n.setAttribute('data-pu-oculto','')}});
 const raiz=document.createElement('div');raiz.id='pu-raiz';document.body.insertBefore(raiz,document.body.firstChild);
 const inf=byId('p-infracoes');
 UvisPadrao.monta({
  raiz,titulo:'Odontologia',cor:'#35565B',
  abas:[{id:'roteiro',rotulo:'Roteiro'},{id:'infracoes',rotulo:'Infrações'},{id:'relatorio',rotulo:'Relatório'}],
  inicio:state.p.tip?null:{aba:'roteiro',secao:'perfil',item:null},
  secoes:odoSecoes,
  item:(s,it,el)=>odoDesenhaItem(s.id,it.id,el),
  aba:(id,el)=>{ui.tab=id;
   if(id==='infracoes'){inf.classList.add('active');el.appendChild(inf);if(!byId('odo-emite')){const b=document.createElement('div');b.id='odo-emite';b.className='pu-acoes-item';b.innerHTML='<button type="button" class="pu-btn pu-btn-pri" data-odo-gen>Emitir tabela de infrações</button>';inf.appendChild(b)}renderInf()}
   else if(id==='relatorio')odoRelatorio(el)},
  contagem:id=>id==='roteiro'?counts().nao:id==='infracoes'?nSel():0,
  limpar:(s,it)=>{
   if(s.id==='perfil'){if(!it||it.id==='ident')state.meta=Object.assign({},DEF.meta);if(!it||it.id==='perfil'){state.p=structuredClone(DEF.p);state.assessment={};delete state.salas;delete state.salasMarcadas}}
   else (it?[it.id]:s.itens.map(x=>x.id)).forEach(eid=>{(odoEtapa(eid)?.items||[]).forEach(i=>{delete state.a[i.id];delete state.evidence?.[i.id];delete state.assessment?.[i.id]})});
   save();renderProfile();renderMeta();
  },
  depois:n=>{if(n.aba==='roteiro')ui.tab='roteiro'}
 });
 /* os ouvintes originais chamam renderRot() depois de cada mudança */
 const rotOriginal=renderRot;
 renderRot=function(){rotOriginal();odoRedesenha()};
 const infOriginal=renderInf;
 renderInf=function(){infOriginal();UvisPadrao.atualiza()};
 raiz.addEventListener('click',e=>{
  const na=e.target.closest('[data-odo-na]');
  if(na){const modo=na.dataset.odoNa,n=UvisPadrao.estado();
   const alvo=modo==='perfil'?DATA.route:[odoEtapa(n.item)].filter(Boolean);
   const salas=odoSalas();
   alvo.forEach(s=>s.items.forEach(i=>{if(state.a[i.id]&&modo!=='todos')return;if((modo==='fora'||modo==='perfil')&&!odoFora(s,i))return;if(modo==='salas'&&!(odoDaSala(i)&&salas.length&&!i.when.tip.some(t=>salas.includes(t))))return;state.a[i.id]='na'}));
   save();odoRedesenha();return}
  if(e.target.closest('[data-odo-gen]')){openGen();return}
  if(e.target.closest('[data-odo-pendente]')){for(const s of odoSecoes())for(const it of s.itens)if(it.total&&it.feitos<it.total){UvisPadrao.vai({aba:'roteiro',secao:s.id,item:it.id});return}toast('Todas as verificações foram respondidas.');return}
 });
 raiz.addEventListener('input',e=>{if(e.target.matches('[data-meta]'))UvisPadrao.atualiza()});
 raiz.addEventListener('change',e=>{const c=e.target.closest('[data-odo-sala]');if(!c)return;const l=odoSalas(),t=c.dataset.odoSala,p=l.indexOf(t);if(c.checked&&p<0)l.push(t);if(!c.checked&&p>=0)l.splice(p,1);state.salasMarcadas=true;save();odoRedesenha()});
}
if(ODO_PADRAO)iniciaPadrao();
