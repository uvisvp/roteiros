/* ——— Odontologia no Padrão UVIS (padrao-uvis.js) ———
   Fragmento inserido no fim do script principal do app--odontologia por
   scripts/repack-padrao.cjs. Troca só a tela: estado (odonto-rdc1002-v1), respostas,
   evidências, enquadramentos, relatório e tabela de infrações continuam os mesmos, com os
   mesmos atributos (data-a, data-meta, data-psel, data-p, data-evidence, data-assessment,
   data-legal) tratados pelos ouvintes originais.
   · Seção 1 “Perfil e identificação”: identificação e perfil do serviço (situação,
     tipologia, organização, processamento, características).
   · Seções 2 a 5: as etapas da RDC nº 1.002/2025 agrupadas por área; cada etapa é um item.
   · Perfil pelo tipo de estabelecimento (12/11/2026, como em Alimentos): atalhos (consultório,
     clínica, sedação, centro cirúrgico, radiologia, clínica-escola…), salas e ambientes existentes
     (mais de uma tipologia no mesmo serviço), organização, processamento, características e
     situação, em listas recolhíveis. O roteiro mostra só o que se aplica ao perfil; verificação já
     respondida que sai do perfil continua na tela, com o aviso “Fora do perfil atual”, e no
     relatório. Perguntas, citações e enquadramentos não mudam. */
const ODO_PADRAO=!!(window.UvisPadrao&&window.__uvsPadrao);
const ODO_GRUPOS=[
 {id:'docs',titulo:'Licenciamento e ambientes de apoio',icone:'folder',etapas:['lic','apoio']},
 {id:'assist',titulo:'Assistência, equipamentos e radiologia',icone:'tooth',etapas:['fin','cco','eq','emer','rx']},
 {id:'processa',titulo:'Processamento de dispositivos médicos',icone:'lab',etapas:['estr','proc','est','des','arm','terc']},
 {id:'gestao',titulo:'Qualidade, resíduos e atendimento externo',icone:'shield',etapas:['qual','res','extra']}
];
/* atalhos: tipos de estabelecimento comuns; marcam salas, organização e características típicas,
   que o inspetor ajusta. O processamento de DM é sempre escolhido (não se presume). */
const ODO_ATALHOS=[
 {id:'isolado',rot:'Consultório isolado',desc:'Um consultório Classe I (anestesia local).',salas:['classe1'],org:'individual'},
 {id:'isolado_rx',rot:'Consultório com raio-X',desc:'Consultório Classe I com raio-X intraoral na sala.',salas:['classe1'],org:'individual',flags:['rx_intraoral']},
 {id:'clinica2',rot:'Clínica com até 2 consultórios',desc:'Consultórios Classe I, raio-X intraoral.',salas:['classe1'],org:'clinica2',flags:['rx_intraoral']},
 {id:'clinica3',rot:'Clínica com 3 ou mais consultórios',desc:'Consultórios Classe I, raio-X intraoral.',salas:['classe1'],org:'clinica3',flags:['rx_intraoral']},
 {id:'sedacao',rot:'Clínica com sedação inalatória',desc:'Consultório Classe I com óxido nitroso.',salas:['classe1','classe1_sed'],flags:['rx_intraoral']},
 {id:'classe2',rot:'Sedação endovenosa (Classe II)',desc:'Sala Classe II, monitorização e emergência.',salas:['classe1','classe2'],flags:['rx_intraoral','p344']},
 {id:'cco',rot:'Clínica com centro cirúrgico',desc:'Centro Cirúrgico Odontológico além dos consultórios.',salas:['classe1','cco'],flags:['rx_intraoral','p344']},
 {id:'radiologia',rot:'Radiologia odontológica',desc:'Sala de imagem (panorâmica, tomografia), sem atendimento clínico.',salas:['imagem']},
 {id:'ensino',rot:'Clínica-escola',desc:'Consultório coletivo em instituição de ensino.',salas:['coletivo'],org:'ensino',flags:['rx_intraoral']},
 {id:'cowork',rot:'Consultório compartilhado',desc:'Coworking: profissionais diferentes no mesmo espaço.',salas:['classe1'],org:'compartilhado'},
 {id:'semanest',rot:'Ambiente sem anestesia',desc:'Atendimento sem anestesia (ex.: moldagem, ortodontia).',salas:['amb'],org:'individual'}
];
/* características que os atalhos marcam (trocadas a cada atalho; as demais ficam como o inspetor deixou) */
const ODO_FLAGS_ATALHO=[...new Set(ODO_ATALHOS.flatMap(a=>a.flags||[]))];
/* tipologia principal (a mais complexa entre as salas), usada no cabeçalho e nas rotinas antigas */
const ODO_ORDEM=['cco','classe2','classe1_sed','coletivo','classe1','imagem','amb'];
function odoSincTip(){const s=odoSalas();state.p.tip=ODO_ORDEM.find(t=>s.includes(t))||''}
function odoSalasTexto(){const s=odoSalas();return ODO_ORDEM.filter(t=>s.includes(t)).map(t=>LBL[t]||t).join('; ')}
/* avaliação do perfil: tipologia pelas salas marcadas (o serviço pode ter mais de uma) */
function odoNoPerfil(w){
 if(!w||!Object.keys(w).length)return true;
 if(w.or)return Object.entries(w.or).some(([k,v])=>odoNoPerfil({[k]:v}));
 const P=state.p,salas=odoSalas();
 if(w.tip&&!w.tip.some(t=>salas.includes(t)))return false;
 if(w.tipNot&&!salas.some(t=>!w.tipNot.includes(t)))return false;
 if(w.org&&!w.org.includes(P.org))return false;
 if(w.proc&&!w.proc.includes(P.proc))return false;
 if(w.procNot&&w.procNot.includes(P.proc))return false;
 if(w.flag&&!w.flag.every(f=>P.flags[f]))return false;
 if(w.flagAny&&!w.flagAny.some(f=>P.flags[f]))return false;
 return true;
}
function odoMotivo(w){
 if(!w||odoNoPerfil(w))return '';
 const L=[],nomes=a=>a.map(v=>LBL[v]||v).join(' / ');
 (function junta(x){if(!x)return;
  if(x.tip)L.push('sala '+nomes(x.tip));if(x.tipNot)L.push('tipologia diferente de '+nomes(x.tipNot));
  if(x.org)L.push('organização '+nomes(x.org));if(x.proc)L.push('processamento '+nomes(x.proc));if(x.procNot)L.push('processamento que não seja '+nomes(x.procNot));
  if(x.flag)L.push(nomes(x.flag));if(x.flagAny)L.push(nomes(x.flagAny));
  if(x.or)Object.entries(x.or).forEach(([k,v])=>junta({[k]:v}));})(w);
 return L.join('; ')||'perfil marcado';
}
/* ok() do motor (etapas, contagens, relatório): o que está no perfil e o que já foi respondido.
   Cada condição é um objeto próprio da etapa ou da verificação; o mapa diz de quem ela é. */
const ODO_DONO=new Map();
DATA.route.forEach(s=>{if(s.when)ODO_DONO.set(s.when,{s});s.items.forEach(i=>{if(i.when)ODO_DONO.set(i.when,{s,i})})});
if(ODO_PADRAO)ok=function(w){
 const d=w&&ODO_DONO.get(w);if(!d)return odoNoPerfil(w);
 if(d.i)return (odoNoPerfil(d.s.when)&&odoNoPerfil(d.i.when))||!!state.a[d.i.id];
 return odoNoPerfil(d.s.when)||d.s.items.some(i=>state.a[i.id]);
};
const odoEtapa=id=>DATA.route.find(s=>s.id===id);
const odoFora=(s,i)=>odoMotivo(s.when)||odoMotivo(i.when);
const odoVisiveis=s=>s.items.filter(i=>ok(i.when));

function odoSecoes(){
 const P=state.p,campos=Object.keys(DEF.meta);
 const perfil={id:'perfil',titulo:'Perfil e identificação',curto:'Perfil',icone:'building',
  resumo:(odoSalasTexto()||'Tipo de estabelecimento não escolhido')+(state.meta.company?' · '+state.meta.company:''),
  itens:[
   {id:'ident',titulo:'Identificação da inspeção',curto:'Identificação',feitos:campos.filter(k=>state.meta[k]).length,total:campos.length},
   {id:'tipo',titulo:'Tipo de estabelecimento e salas',curto:'Tipo e salas',resumo:odoSalasTexto()||'Atalhos e salas existentes no serviço.',feitos:odoSalas().length?1:0,total:1},
   {id:'servico',titulo:'Organização, processamento e características',curto:'Organização e processamento',resumo:'Organização, processamento de DM, características e situação do serviço.',feitos:['situacao','org','proc'].filter(k=>P[k]).length,total:3}
  ]};
 const lista=[perfil];
 ODO_GRUPOS.forEach(g=>{
  const itens=g.etapas.map(odoEtapa).filter(s=>s&&ok(s.when)&&odoVisiveis(s).length).map(s=>{
   const fora=odoMotivo(s.when),vis=odoVisiveis(s);
   return {id:s.id,titulo:s.title,curto:s.title,resumo:fora?'Fora do perfil atual (só o já respondido)':s.place,feitos:vis.filter(i=>state.a[i.id]).length,total:vis.length};
  });
  if(itens.length)lista.push({id:g.id,titulo:g.titulo,curto:g.titulo,icone:g.icone,itens});
 });
 return lista;
}

function odoPergunta(s,i,n){
 const a=state.a[i.id]||'',fora=odoFora(s,i);
 return `<div class="pu-q${fora?' pu-q-fora':''}" data-odo-q="${esc(i.id)}"><div><p class="pu-q-texto item-t"><b>${n}.</b> ${esc(i.t)}</p>`
  +(fora?`<div class="pu-tags"><span class="pu-tag pu-tag-fora">Fora do perfil atual</span></div><p class="pu-q-ajuda">Depende de: ${esc(fora)}. A resposta já dada foi mantida; se não se aplica, mude para “Não se aplica”.</p>`:'')
  +`<div class="cite pu-cit-odo">${uvisOdontoCitation(i.ch,i.c)}</div></div>`
  +`<div class="pu-resp" role="group" aria-label="Resultado">${[['ok','Sim'],['nao','Não'],['na','Não se aplica']].map(([v,l])=>`<button type="button" data-a="${esc(i.id)}" data-v="${v}" aria-pressed="${a===v}">${l}</button>`).join('')}</div>`
  +(a==='nao'?`<div class="pu-bloco pu-nc">${assessmentHtml(i)}</div>`:'')
  +odoNotaHtml(i)
  +odoFotoHtml(i.id)
  +`</div>`;
}
/* Fotos por verificação: reduzidas e guardadas junto com as respostas (entram nas Salvas);
   saem à parte no relatório fotográfico em PDF (botão Fotos do cabeçalho). */
function odoNotaHtml(i){const a=state.a[i.id]||'',nc=a==='nao';return `<label class="pu-anot">${nc?'Evidência da constatação':'Anotação'} <small>(digite ou dite)</small><textarea rows="2" data-evidence="${esc(i.id)}" placeholder="${nc?'O que foi constatado, onde, documento conferido…':'Opcional: o que foi visto ou conferido'}">${esc(state.evidence?.[i.id]||'')}</textarea></label>`}
let odoFotoAberta='';
function odoFotoHtml(id){const f=state.fotos&&state.fotos[id];
 return `<details class="pu-mais"${odoFotoAberta===id?' open':''}><summary>Foto${f?' ✓':''}</summary><div><div class="pu-foto-acoes"><button type="button" class="pu-btn" data-odo-foto="${esc(id)}">📷 ${f?'Trocar foto':'Tirar ou anexar foto'}</button>${f?`<button type="button" class="pu-btn" data-odo-sem-foto="${esc(id)}">Remover foto</button>`:''}</div>${f?`<img class="photo-thumb" alt="Foto vinculada à verificação" src="${esc(f)}">`:''}<p class="pu-q-ajuda">As fotos saem à parte, no botão Fotos do cabeçalho.</p></div></details>`}
function odoFoto(id){const fi=document.createElement('input');fi.type='file';fi.accept='image/*';fi.setAttribute('capture','environment');fi.style.display='none';
 fi.onchange=()=>{const f=fi.files&&fi.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>(window.__uvsReduzFoto||((u,cb)=>cb(u)))(r.result,url=>{state.fotos=state.fotos||{};const antes=state.fotos[id];state.fotos[id]=url;let ok=true;
   try{save();ok=(localStorage.getItem(STORE)||'').indexOf(url.slice(-40))>=0}catch(e){ok=false}
   if(!ok){if(antes)state.fotos[id]=antes;else delete state.fotos[id];try{save()}catch(e){}alert('Não há mais espaço para fotos neste aparelho. Gere o relatório fotográfico e remova fotos antigas.')}
   odoFotoAberta=id;odoRedesenha()});
  r.readAsDataURL(f);fi.remove()};
 document.body.appendChild(fi);fi.click()}
window.__uvsFotosMeta=()=>({estab:state.meta.company||'',data:state.meta.date||''});
window.__uvsFotosItens=()=>{const out=[];DATA.route.forEach(s=>s.items.forEach(i=>{const f=state.fotos&&state.fotos[i.id];if(f)out.push({src:f,legenda:s.title+' — '+String(i.t).replace(/\s+/g,' ').slice(0,160)})}));return out};
/* Salas existentes: a tipologia passa a ser múltipla (consultório Classe I + sala de imagem…). Ficam em
   state.salas, como antes; quem só tinha a tipologia única começa com ela. */
const ODO_SALAS=['amb','classe1','classe1_sed','classe2','coletivo','imagem','cco'];
function odoSalas(){if(!Array.isArray(state.salas)||(!state.salas.length&&!state.salasMarcadas))state.salas=ODO_SALAS.includes(state.p.tip)?[state.p.tip]:[];return state.salas}
function odoItemEtapa(el,s){
 const vis=odoVisiveis(s),motivo=odoMotivo(s.when);
 el.innerHTML=`<p class="pu-desc">${esc(s.place||'')}</p>`
  +(motivo?`<div class="pu-bloco pu-aviso"><p><b>Fora do perfil atual</b> (${esc(motivo)}). Aparecem só as verificações já respondidas.</p></div>`:'')
  +(vis.length?vis.map((i,k)=>odoPergunta(s,i,k+1)).join(''):'<p class="pu-q-ajuda">Nenhuma verificação desta etapa se aplica ao perfil marcado.</p>')
  +`<div class="pu-acoes-item"><button type="button" class="pu-btn" data-odo-na="pendentes">Marcar pendentes como Não se aplica</button></div>`;
}
/* os campos originais (com seus ouvintes) são levados para a tela do item */
const odoNos={};
function odoNo(chave,sel){if(!odoNos[chave])odoNos[chave]=document.querySelector(sel);return odoNos[chave]}
function odoPerfil(el,id){
 if(id==='ident'){el.innerHTML='<div class="pu-bloco"><h3>Dados do serviço e da inspeção</h3></div>';const g=odoNo('meta','#mcard .meta-grid');if(g){g.classList.add('pu-campos');el.firstChild.appendChild(g)}renderMeta();return}
 const P=state.p,opts=gid=>(DATA.profile.find(g=>g.id===gid)||{opts:[]}).opts;
 const grupo=(titulo,n,corpo,aberto)=>`<details class="odo-grupo"${aberto?' open':''}><summary>${esc(titulo)}${n?` <span class="odo-n">${n}</span>`:''}</summary><div class="pu-marcas">${corpo}</div></details>`;
 const marca=(tipo,attr,v,l,on,desc)=>`<label class="pu-marca"><input type="${tipo}" ${attr}="${esc(v)}"${tipo==='radio'?` name="${attr}"`:''}${on?' checked':''}><span><strong>${esc(l)}</strong>${desc?`<small>${esc(desc)}</small>`:''}</span></label>`;
 if(id==='tipo'){
  const salas=odoSalas();
  el.innerHTML=`<div class="pu-bloco"><h3>Atalhos</h3><p>Um toque marca as salas e características típicas; depois ajuste ao que existe no local.</p><div class="odo-atalhos">`
   +ODO_ATALHOS.map(a=>`<button type="button" class="pu-btn" data-odo-atalho="${esc(a.id)}" title="${esc(a.desc)}">${esc(a.rot)}</button>`).join('')+`</div></div>`
   +`<div class="pu-bloco"><h3>Salas e ambientes do serviço${salas.length?` <small>(${salas.length} marcada${salas.length>1?'s':''})</small>`:''}</h3><p>Marque todos os tipos de sala existentes. Cada um traz as suas exigências; o que não existe sai do roteiro.</p>`
   +grupo('Atendimento clínico',salas.filter(t=>['amb','classe1','coletivo'].includes(t)).length,['amb','classe1','coletivo'].map(t=>marca('checkbox','data-odo-sala',t,LBL[t],salas.includes(t))).join(''),true)
   +grupo('Sedação e cirurgia',salas.filter(t=>['classe1_sed','classe2','cco'].includes(t)).length,['classe1_sed','classe2','cco'].map(t=>marca('checkbox','data-odo-sala',t,LBL[t],salas.includes(t))).join(''),true)
   +grupo('Imagem',salas.includes('imagem')?1:0,marca('checkbox','data-odo-sala','imagem',LBL.imagem,salas.includes('imagem'),'Panorâmica, telerradiografia ou tomografia em sala própria.'),true)
   +`</div>`;
  return;
 }
 const nf=Object.keys(P.flags||{}).filter(k=>P.flags[k]).length;
 el.innerHTML=`<div class="pu-bloco"><h3>Organização, processamento e características</h3><p>Definem as exigências de apoio, de processamento de dispositivos médicos e de atividades específicas.</p>`
  +grupo('Organização do serviço',P.org?1:0,opts('org').map(([v,l])=>marca('radio','data-odo-org',v,l,P.org===v)).join(''),!P.org)
  +grupo('Processamento de dispositivos médicos',P.proc?1:0,opts('proc').map(([v,l])=>marca('radio','data-odo-proc',v,l,P.proc===v)).join(''),!P.proc)
  +grupo('Características do serviço',nf,opts('flags').map(([v,l])=>marca('checkbox','data-odo-flag',v,l,!!(P.flags||{})[v])).join(''),true)
  +grupo('Situação do serviço — adequação à RDC nº 1.002/2025',P.situacao?1:0,opts('situacao').map(([v,l])=>marca('radio','data-odo-sit',v,l,P.situacao===v)).join(''),!P.situacao)
  +`<p class="pu-q-ajuda">${esc(adaptationNote())}</p></div>`;
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
 el.innerHTML=`<div class="pu-bloco"><h3>Resumo da inspeção</h3><p>${esc(odoSalasTexto()||'Tipo de estabelecimento não escolhido')}${state.meta.company?' · '+esc(state.meta.company):''}</p>
  <div class="pu-campos"><div class="pu-campo">Respondidos<b>${c.ans} de ${c.it.length}</b></div><div class="pu-campo">Irregulares<b>${c.nao}</b></div><div class="pu-campo">Não avaliados<b>${c.pend}</b></div><div class="pu-campo">Enquadramentos selecionados<b>${n}</b></div></div>
  <div class="pu-acoes-item"><button type="button" class="pu-btn pu-btn-pri" data-odo-word>Baixar relatório em Word</button><button type="button" class="pu-btn" data-odo-pdf>Gerar PDF</button><button type="button" class="pu-btn" data-odo-copia>Copiar texto</button><button type="button" class="pu-btn" data-odo-gen>Opções do relatório</button><button type="button" class="pu-btn" data-odo-pendente>Ir à próxima verificação pendente</button></div>
  <p class="pu-q-ajuda">O relatório usa apenas o roteiro. A tabela de infrações é emitida na aba Infrações. As fotos saem à parte, no botão Fotos do cabeçalho.</p></div>
  <div class="pu-bloco uvs-rel-previa"><h3>Prévia do relatório</h3><div>${odoPreviaHtml(blocks())}</div></div>`;
}
/* prévia na própria aba (18/10/2026): os blocos do Word desenhados em HTML */
function odoPreviaHtml(B){
 const tab=b=>'<table><thead><tr>'+b.head.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+b.rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 return B.map(b=>b.t==='title'?'<p class="uvs-r-tit">'+esc(b.x)+'</p>':b.t==='sub'?'<p class="uvs-r-sub">'+esc(b.x)+'</p>':b.t==='h1'?'<h3>'+esc(b.x)+'</h3>':b.t==='h2'?'<h4>'+esc(b.x)+'</h4>'
  :b.t==='kv'?'<p><b>'+esc(b.k)+':</b> '+esc(b.v)+'</p>':b.t==='num'?'<p>'+esc(b.n)+'. '+esc(b.x)+'</p>':b.t==='small'?'<p class="pu-q-ajuda">'+esc(b.x)+'</p>':b.t==='p'?'<p>'+esc(b.x)+'</p>'
  :b.t==='table'?tab(b):b.t==='sign'?'<p class="pu-q-ajuda">Local e data; assinaturas da autoridade sanitária e do responsável pelo estabelecimento.</p>':'').join('');
}
function iniciaPadrao(){
 ['body > header.top','body > main','body > .dock'].forEach(q=>{const n=document.querySelector(q);if(n){n.hidden=true;n.setAttribute('data-pu-oculto','')}});
 const raiz=document.createElement('div');raiz.id='pu-raiz';document.body.insertBefore(raiz,document.body.firstChild);
 const inf=byId('p-infracoes');
 UvisPadrao.monta({
  raiz,titulo:'Odontologia',cor:'#35565B',
  abas:[{id:'roteiro',rotulo:'Roteiro'},{id:'infracoes',rotulo:'Infrações'},{id:'relatorio',rotulo:'Relatório'}],
  inicio:odoSalas().length?null:{aba:'roteiro',secao:'perfil',item:'tipo'},
  secoes:odoSecoes,
  item:(s,it,el)=>odoDesenhaItem(s.id,it.id,el),
  aba:(id,el)=>{ui.tab=id;
   if(id==='infracoes'){inf.classList.add('active');el.appendChild(inf);if(!byId('odo-emite')){const b=document.createElement('div');b.id='odo-emite';b.className='pu-acoes-item';b.innerHTML='<button type="button" class="pu-btn pu-btn-pri" data-odo-gen>Emitir tabela de infrações</button>';inf.appendChild(b)}renderInf()}
   else if(id==='relatorio')odoRelatorio(el)},
  contagem:id=>id==='roteiro'?counts().nao:id==='infracoes'?nSel():0,
  limpar:(s,it)=>{
   if(s.id==='perfil'){if(!it||it.id==='ident')state.meta=Object.assign({},DEF.meta);if(!it||it.id!=='ident'){state.p=structuredClone(DEF.p);state.assessment={};delete state.salas;delete state.salasMarcadas}}
   else (it?[it.id]:s.itens.map(x=>x.id)).forEach(eid=>{(odoEtapa(eid)?.items||[]).forEach(i=>{delete state.a[i.id];delete state.evidence?.[i.id];delete state.assessment?.[i.id];delete state.fotos?.[i.id]})});
   save();renderProfile();renderMeta();
  },
  depois:n=>{if(n.aba==='roteiro')ui.tab='roteiro'}
 });
 /* as opções do relatório mudam a prévia: ao fechar a janela, a aba é refeita */
 byId('mGen')?.addEventListener('close',()=>{if(UvisPadrao.estado().aba==='relatorio')UvisPadrao.vai({aba:'relatorio'})});
 /* os ouvintes originais chamam renderRot() depois de cada mudança */
 const rotOriginal=renderRot;
 renderRot=function(){rotOriginal();odoRedesenha()};
 const infOriginal=renderInf;
 renderInf=function(){infOriginal();UvisPadrao.atualiza()};
 raiz.addEventListener('click',e=>{
  const na=e.target.closest('[data-odo-na]');
  if(na){const modo=na.dataset.odoNa,n=UvisPadrao.estado();
   [odoEtapa(n.item)].filter(Boolean).forEach(s=>odoVisiveis(s).forEach(i=>{if(!state.a[i.id])state.a[i.id]='na'}));
   save();odoRedesenha();return}
  const fb=e.target.closest('[data-odo-foto]');if(fb){odoFoto(fb.dataset.odoFoto);return}
  const sf=e.target.closest('[data-odo-sem-foto]');if(sf){if(confirm('Remover a foto desta verificação?')){delete state.fotos[sf.dataset.odoSemFoto];save();odoFotoAberta=sf.dataset.odoSemFoto;odoRedesenha()}return}
  const at=e.target.closest('[data-odo-atalho]');
  if(at){const a=ODO_ATALHOS.find(x=>x.id===at.dataset.odoAtalho);if(a){state.salas=a.salas.slice();state.salasMarcadas=true;if(a.org)state.p.org=a.org;state.p.flags=state.p.flags||{};ODO_FLAGS_ATALHO.forEach(f=>{if((a.flags||[]).includes(f))state.p.flags[f]=true;else delete state.p.flags[f]});odoSincTip();save();renderProfile();odoRedesenha();toast(a.rot+': salas e características marcadas. Ajuste ao que existe no local.')}return}
  if(e.target.closest('[data-odo-word]')){download();return}
  if(e.target.closest('[data-odo-pdf]')){printPdf();return}
  if(e.target.closest('[data-odo-copia]')){copyTxt();return}
  if(e.target.closest('[data-odo-gen]')){openGen();return}
  if(e.target.closest('[data-odo-pendente]')){for(const s of odoSecoes())for(const it of s.itens)if(it.total&&it.feitos<it.total){UvisPadrao.vai({aba:'roteiro',secao:s.id,item:it.id});return}toast('Todas as verificações foram respondidas.');return}
 });
 raiz.addEventListener('input',e=>{if(e.target.matches('[data-meta]'))UvisPadrao.atualiza()});
 raiz.addEventListener('change',e=>{const x=e.target;
  if(x.matches('[data-odo-sala]')){const l=odoSalas(),t=x.dataset.odoSala,p=l.indexOf(t);if(x.checked&&p<0)l.push(t);if(!x.checked&&p>=0)l.splice(p,1);state.salasMarcadas=true;odoSincTip()}
  else if(x.matches('[data-odo-org]'))state.p.org=x.dataset.odoOrg;
  else if(x.matches('[data-odo-proc]'))state.p.proc=x.dataset.odoProc;
  else if(x.matches('[data-odo-flag]')){state.p.flags=state.p.flags||{};if(x.checked)state.p.flags[x.dataset.odoFlag]=true;else delete state.p.flags[x.dataset.odoFlag]}
  else if(x.matches('[data-odo-sit]')){state.p.situacao=x.dataset.odoSit;state.assessment={}}
  else return;
  save();renderProfile();odoRedesenha()});
 const css=document.createElement('style');
 css.textContent='.pu-ativo .odo-atalhos{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}'
  +'.pu-ativo .odo-grupo{border:1px solid var(--ui-line,#d9e2e8);border-radius:10px;margin:10px 0;background:#fff}'
  +'.pu-ativo .odo-grupo>summary{min-height:44px;display:flex;align-items:center;gap:8px;padding:0 14px;font-weight:700;cursor:pointer}'
  +'.pu-ativo .odo-grupo>.pu-marcas{padding:0 12px 12px}'
  +'.pu-ativo .odo-n{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:var(--pu-cor,#35565B);color:#fff;font-size:.78rem}';
 document.head.appendChild(css);
 /* quem tinha só a tipologia única: as salas começam com ela */
 odoSalas();odoSincTip();
}
if(ODO_PADRAO)iniciaPadrao();