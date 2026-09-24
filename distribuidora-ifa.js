/* ——— Verificação de IFA por amostragem (Distribuidora de insumos) ———
   Substitui, neste módulo, o acesso à ferramenta genérica de insumos.
   Cada amostra é uma ficha salva no roteiro (state.ifaAmostras): identidade
   conforme nota fiscal e certificado, fornecedor, destinatário, conferência
   documental e uma única consulta às bases públicas (CADIFA, CBPF, banco de
   IFA, AFE/AE do fornecedor e do destinatário, Portaria SVS/MS nº 344/1998).
   A consulta só sugere: ausência de registro em base pública não é
   irregularidade, e a conclusão fica com a equipe. As amostras entram no
   item 11.2 do relatório (Anexo I). */
const IFA_DADOS='https://uvisvp.github.io/base-vigilancia/dados/';
const IFA_CACHE={};
function ifaBaixa(c){if(!IFA_CACHE[c])IFA_CACHE[c]=fetch(IFA_DADOS+c,{cache:'force-cache'}).then(r=>r.ok?r.json():null).catch(()=>null);return IFA_CACHE[c]}
function ifaNorm(t){return String(t??'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}
function ifaDig(t){return String(t??'').replace(/\D/g,'')}
function ifaLista(j){if(!j)return [];if(Array.isArray(j))return j;for(const k of ['registros','dados','itens'])if(Array.isArray(j[k]))return j[k];return []}
/* Nome igual, ou o nome procurado aparece como palavra inteira (ex.: “cloridrato de ciprofloxacino” × “ciprofloxacino”). */
function ifaCasa(alvo,txt){const a=ifaNorm(alvo),t=ifaNorm(txt);if(!a||!t)return 0;if(a===t)return 2;return (' '+t+' ').includes(' '+a+' ')||(' '+a+' ').includes(' '+t+' ')?1:0}
function ifaData(v){if(v==null||v==='')return null;if(typeof v==='number')return new Date(v);const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(v)||null;if(m)return new Date(+m[1],+m[2]-1,+m[3]);const b=/^(\d{2})\/(\d{2})\/(\d{4})/.exec(v);return b?new Date(+b[3],+b[2]-1,+b[1]):null}
function ifaBR(d){return d?String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear():''}
function ifaRef(){return ifaData(state.meta.start)||new Date()}

async function ifaAfe(cnpj){const c=ifaDig(cnpj);if(c.length!==14)return {ok:false,motivo:'CNPJ não informado ou incompleto'};const j=await ifaBaixa('afe_ae/'+c.slice(0,3)+'.json');if(!j)return {ok:false,motivo:'Base de AFE/AE indisponível no momento'};const r=ifaLista(j).filter(x=>ifaDig(x.cnpj)===c);return {ok:true,regs:r.map(x=>({tipo:x.tipo||'AFE',classe:x.classe||'',ativ:x.atividade_tipo||'',ativa:String(x.ativo).toUpperCase()==='SIM'||/ativ/i.test(x.situacao||''),sit:x.situacao||'',num:x.autorizacao_nova||x.autorizacao||'',razao:x.razao_social||''}))}}
async function ifaConsultar(a){
 const ref=ifaRef(),nome=a.insumo||'',res={feita:new Date().toISOString(),ref:ifaBR(ref)};
 const [cad,cbpf,leg,p344]=await Promise.all([ifaBaixa('ifa_regularidade/cadifa.json'),ifaBaixa('ifa_regularidade/cbpf_ifa.json'),ifaBaixa('ifa/registros.json'),ifaBaixa('controlados_portaria344/listas.json')]);
 res.cadifa=cad?ifaLista(cad).map(x=>({x,s:ifaCasa(nome,x.ifa||x.NO_INSUMO_MINUSC)})).filter(y=>y.s).sort((p,q)=>q.s-p.s).slice(0,8).map(({x,s})=>({exato:s===2,ifa:x.ifa||x.NO_INSUMO_MINUSC,detentor:x.detentor||x.NO_RAZAO_SOCIAL_MAISC,sit:x.situacao||x.DS_SITUACAO_APRESENTACAO,processo:x.processo||x.NU_PROCESSO,fab:ifaCasa(a.fabricante,x.detentor||x.NO_RAZAO_SOCIAL_MAISC)>0})):null;
 res.cbpf=cbpf?ifaLista(cbpf).filter(x=>x.escopo_ifa!==false).map(x=>{const est=x['ESTABELECIMENTO CERTIFICADO']||'',esc=x.ESCOPO||'',f=a.fabricante?ifaCasa(a.fabricante,est)||(ifaNorm(est).includes(ifaNorm(a.fabricante).split(' ')[0]||'#')&&ifaNorm(a.fabricante).length>3?1:0):0,i=nome?(ifaNorm(esc).includes(ifaNorm(nome))?1:0):0;return {x,f,i}}).filter(y=>y.f||(!a.fabricante&&y.i)).sort((p,q)=>(q.f+q.i)-(p.f+p.i)).slice(0,8).map(({x,f,i})=>{const v=ifaData(x['DATA DE VALIDADE']);return {est:x['ESTABELECIMENTO CERTIFICADO'],pais:x.PAIS,escopo:x.ESCOPO,validade:ifaBR(v),vigente:v?v>=ref:null,insumo:!!i,fab:!!f}}):null;
 res.legado=leg?ifaLista(leg).filter(x=>ifaCasa(nome,x.ifa)).slice(0,6).map(x=>({ifa:x.ifa,fab:x.fabricante_ifa,pais:x.pais_fabricante,det:x.detentor_peticionante})):null;
 if(p344){const hits=[];for(const L of p344.listas||[])for(const s of L.substancias||[]){const k=ifaCasa(nome,s.nome);if(k)hits.push({lista:L.lista,nome:s.nome,exato:k===2})}res.p344=hits.slice(0,6)}else res.p344=null;
 [res.forn,res.dest]=await Promise.all([ifaAfe(a.fornCnpj),ifaAfe(a.destCnpj)]);
 return res;
}
/* Leitura dos resultados em marcas: ok ✓, pend ⚠, inc ●, na ○ */
function ifaAchados(a){
 const r=a.res,out=[];if(!r)return out;const med=x=>/^Medicamento/i.test(x.classe);
 const afe=(lado,nomeLado,precisaAE)=>{const b=r[lado];if(!b||!b.ok){out.push(['na',nomeLado+': '+(b?b.motivo:'não consultado')+'.']);return}const at=b.regs.filter(x=>x.ativa&&med(x));const afeA=at.filter(x=>x.tipo!=='AE'),aeA=at.filter(x=>x.tipo==='AE');
  if(!b.regs.length)out.push(['pend',nomeLado+': CNPJ não localizado na base de AFE/AE. Confirmar na consulta oficial antes de concluir.']);
  else if(!b.regs.some(x=>x.ativa))out.push(['inc',nomeLado+': todas as autorizações do CNPJ constam inativas ('+b.regs.map(x=>x.tipo+' '+x.classe+' — '+(x.sit||'inativa')).join('; ')+').']);
  else if(!afeA.length)out.push(['pend',nomeLado+': não localizada AFE ativa de medicamento/insumo; constam '+b.regs.filter(x=>x.ativa).map(x=>x.tipo+' '+x.classe).join('; ')+'. Confirmar na consulta oficial.']);
  else out.push(['ok',nomeLado+': AFE ativa nº '+afeA.map(x=>x.num).join(', ')+' — atividades: '+[...new Set(afeA.flatMap(x=>x.ativ.split(',').map(s=>s.trim())))].join(', ')+'.']);
  if(precisaAE)out.push([aeA.length?'ok':'pend',nomeLado+(aeA.length?': AE ativa nº '+aeA.map(x=>x.num).join(', ')+'.':': substância controlada e nenhuma AE ativa localizada.')]);};
 const ctrl=r.p344&&r.p344.length;
 if(r.p344==null)out.push(['na','Portaria SVS/MS nº 344/1998: base indisponível.']);else if(ctrl)out.push(['pend','Portaria SVS/MS nº 344/1998: '+r.p344.map(x=>x.nome+' (lista '+x.lista+(x.exato?'':', nome aproximado')+')').join('; ')+'. Exige AE de quem comercializa e de quem recebe; confirmar sal e forma.']);else out.push(['ok','Portaria SVS/MS nº 344/1998: não localizado nas listas A1 a C5 pelo nome informado (não prova que não seja controlado).']);
 afe('forn','Fornecedor',ctrl);afe('dest','Destinatário',ctrl);
 if(/excip/i.test(a.natureza||''))out.push(['na','CADIFA e CBPF de IFA: não se aplicam a excipiente.']);
 else{
  const ind=a.destFin==='Indústria de medicamentos';
  if(r.cadifa==null)out.push(['na','CADIFA: base indisponível.']);
  else if(!r.cadifa.length)out.push([ind?'pend':'na','CADIFA: nenhum registro para “'+a.insumo+'”.'+(ind?' Para uso industrial, confirmar a regularização do IFA no registro do medicamento do destinatário.':' Para destinatário não industrial, a CADIFA não é exigência (RDC nº 359/2020, art. 2º).')]);
  else{const def=r.cadifa.filter(x=>/deferid/i.test(x.sit));out.push([def.length?'ok':'pend','CADIFA: '+r.cadifa.slice().sort((p,q)=>(q.fab?1:0)-(p.fab?1:0)).slice(0,3).map(x=>x.ifa+' — '+x.detentor+' ('+x.sit+')'+(x.fab?' [fabricante confere]':'')).join('; ')+'.'+(ind?'':' Informativo: destinatário não industrial.')])}
  if(r.cbpf==null)out.push(['na','CBPF: base indisponível.']);
  else if(!a.fabricante)out.push(['pend','CBPF: informe o fabricante (conforme o certificado de análise) para a busca.']);
  else if(!r.cbpf.filter(x=>x.fab).length)out.push(['pend','CBPF: nenhum certificado localizado para o fabricante “'+a.fabricante+'”. O CBPF de IFA não é exigido em todos os casos; confirmar o regime aplicável.']);
  else{const f=r.cbpf.filter(x=>x.fab).sort((p,q)=>(ifaData(q.validade.split('/').reverse().join('-'))||0)-(ifaData(p.validade.split('/').reverse().join('-'))||0)),vig=f.filter(x=>x.vigente);out.push([vig.length?'ok':'pend','CBPF do fabricante'+(vig.length?'':' (nenhum vigente na data da inspeção; confirmar protocolo de renovação)')+': '+f.slice(0,2).map(x=>x.est+' ('+x.pais+') — validade '+x.validade+(x.vigente===false?' — vencido na data da inspeção':'')+(x.insumo?' — escopo inclui o insumo':'')).join('; ')+'.'])}
  if(r.legado&&r.legado.length)out.push(['ok','Banco de IFA (exportação pública): '+r.legado.map(x=>x.ifa+' — '+x.fab+' ('+x.pais+')').join('; ')+'.'])}
 return out;
}
const IFA_DOC=[['coa','Certificado de análise do fabricante apresentado e vinculado ao lote'],['lote','Lote e validade coincidem entre certificado, nota fiscal e embalagem em estoque'],['rotulo','Rótulo preserva a identificação do fabricante, lote e validade'],['forn','Fornecedor qualificado pela empresa (registro de qualificação)'],['dest','Destinatário conferido antes da venda (licença/AFE e, se controlado, AE)'],['frac','Se fracionado: laudo de análise e liberação após o fracionamento']];
const IFA_MARCA={ok:'✓',pend:'⚠',inc:'●',na:'○'};
function ifaFicha(a,i){
 const p='ifaAmostras.'+i+'.',achs=ifaAchados(a),docs=a.docs||{};
 const doc=IFA_DOC.map(([k,t])=>'<label class="ifa-doc"><span>'+esc(t)+'</span><select data-path="'+p+'docs.'+k+'"><option value="">—</option>'+['Conforme','Não conforme','Não se aplica'].map(o=>'<option'+(docs[k]===o?' selected':'')+'>'+o+'</option>').join('')+'</select></label>').join('');
 return '<article class="ifa-ficha"><div class="ifa-head"><b>Amostra '+(i+1)+(a.insumo?' — '+esc(a.insumo):'')+(a.lote?' · lote '+esc(a.lote):'')+'</b><button class="btn" type="button" data-ifa-del="'+i+'">Remover</button></div>'+
 '<h5>1. Insumo e lote</h5><div class="grid three">'+field(p+'insumo','Insumo (DCB), conforme a nota fiscal')+field(p+'natureza','Natureza','select',['IFA (princípio ativo)','excipiente'].map(x=>x))+field(p+'lote','Lote')+field(p+'validade','Validade','date')+field(p+'fabricante','Fabricante, conforme o certificado de análise')+field(p+'pais','País do fabricante')+field(p+'coa','Certificado de análise nº')+field(p+'nfEntrada','NF de entrada nº')+field(p+'fracionado','Fracionado pela empresa?','select',['Não','Sim'])+'</div>'+
 '<h5>2. Fornecedor e destinatário</h5><div class="grid three">'+field(p+'fornecedor','Fornecedor')+field(p+'fornCnpj','CNPJ do fornecedor (nacional)')+field(p+'nfSaida','NF de saída nº')+field(p+'destinatario','Destinatário (cliente)')+field(p+'destCnpj','CNPJ do destinatário')+field(p+'destFin','Destinatário é','select',['Indústria de medicamentos','Farmácia de manipulação','Outro distribuidor','Outro'])+'</div>'+
 '<h5>3. Consulta às bases públicas</h5><div class="toolbar"><button class="btn primary" type="button" data-ifa-consultar="'+i+'"'+(a.insumo?'':' disabled')+'>'+(a.res?'Consultar de novo':'Consultar bases públicas')+'</button>'+(a.res?'<span class="mini">Consulta de '+esc(new Date(a.res.feita).toLocaleString('pt-BR'))+' · validade conferida em '+esc(a.res.ref)+'</span>':'<span class="mini">CADIFA, CBPF, banco de IFA, AFE/AE do fornecedor e do destinatário e Portaria 344, de uma vez.</span>')+'</div>'+
 (achs.length?'<div class="ifa-achados">'+achs.map(x=>'<div class="ifa-a '+x[0]+'"><b>'+IFA_MARCA[x[0]]+'</b><span>'+esc(x[1])+'</span></div>').join('')+'</div>':'')+
 '<h5>4. Conferência documental</h5><div class="ifa-docs">'+doc+'</div>'+field(p+'obs','Observações da equipe sobre esta amostra','textarea')+'</article>';
}
function ifaPainel(){
 state.ifaAmostras=Array.isArray(state.ifaAmostras)?state.ifaAmostras:[];
 const n=state.ifaAmostras.length;
 return '<div class="ifa-painel"><div class="statusline"><div><b>Amostragem de IFA</b><div class="mini">Escolha lotes de IFA/insumos que entraram e saíram. Para cada um: preencha a identidade conforme nota fiscal e certificado, toque em <b>Consultar bases públicas</b> e registre a conferência dos documentos. As amostras saem no item 11.2 do relatório. Resultado de base pública é indício: ausência de registro não é irregularidade, e a marcação C/NC abaixo continua sendo da equipe.</div></div><button class="btn" type="button" data-ifa-add>＋ Amostra</button></div>'+
 '<div class="ifa-legenda">✓ compatível · ⚠ confirmar · ● incompatível · ○ não aplicável ou indisponível</div>'+
 (n?state.ifaAmostras.map(ifaFicha).join(''):'<p class="mini">Nenhuma amostra registrada.</p>')+'</div>';
}
/* Tabela para o relatório (item 11.2) */
function ifaTabelaRelatorio(){
 const am=(state.ifaAmostras||[]).filter(a=>a&&a.insumo);if(!am.length)return null;
 return {k:'tbl',head:true,cols:[1700,1400,1900,2000,2354],rows:[['Insumo / lote','Fabricante','Fornecedor → destinatário','Consulta pública','Conferência documental']].concat(am.map(a=>{const ach=ifaAchados(a).filter(x=>x[0]==='inc'||x[0]==='pend');const d=a.docs||{};const nc=IFA_DOC.filter(([k])=>d[k]==='Não conforme').map(x=>x[1]);const c=IFA_DOC.filter(([k])=>d[k]==='Conforme').length;
  return [a.insumo+(a.lote?'\nLote '+a.lote:'')+(a.validade?' · val. '+ddData(a.validade):''),[a.fabricante,a.pais].filter(Boolean).join(' — '),[a.fornecedor||'—',a.destinatario||'—'].join(' → '),a.res?(ach.length?ach.map(x=>IFA_MARCA[x[0]]+' '+x[1]).join('\n'):ifaAchados(a).some(x=>x[0]==='ok')?'Sem incompatibilidades nas bases consultadas ('+ddData(a.res.feita.slice(0,10))+').':'Bases públicas sem resposta na consulta; verificação documental apenas.'):'Não consultado.',(nc.length?'Não conforme: '+nc.join('; ')+'.':'')+(c?(nc.length?'\n':'')+c+' conferência(s) conforme(s).':'')+(a.obs?'\n'+a.obs:'')||'—']}))};
}
(function ifaInstalar(){
 const oldSec=sectionHtml;sectionHtml=function(sec){let h=oldSec(sec);if(sec&&sec.id==='ifa-rastreabilidade'){h=h.replace('Amostragem de IFA destinado à manipulação.','Amostragem de IFA e insumos distribuídos.');const i=h.indexOf('<details class="section-chk"');h=i>=0?h.slice(0,i)+ifaPainel()+h.slice(i):h.replace('</div></details>',ifaPainel()+'</div></details>')}return h};
 document.addEventListener('click',async function(e){const b=e.target.closest&&e.target.closest('[data-ifa-add],[data-ifa-del],[data-ifa-consultar]');if(!b)return;e.preventDefault();e.stopImmediatePropagation();
  state.ifaAmostras=Array.isArray(state.ifaAmostras)?state.ifaAmostras:[];
  if(b.hasAttribute('data-ifa-add')){state.ifaAmostras.push({natureza:'IFA (princípio ativo)'});save();renderITab();return}
  if(b.hasAttribute('data-ifa-del')){if(!confirm('Remover esta amostra?'))return;state.ifaAmostras.splice(+b.dataset.ifaDel,1);save();renderITab();return}
  const a=state.ifaAmostras[+b.dataset.ifaConsultar];if(!a)return;b.disabled=true;b.textContent='Consultando…';
  try{a.res=await ifaConsultar(a)}catch(err){alert('Consulta indisponível: '+err.message)}
  save();renderITab()},true);
 /* Atualiza o título da ficha ao digitar, sem redesenhar a tela. */
 document.addEventListener('change',function(e){const t=e.target;if(t&&t.dataset&&/^ifaAmostras\.\d+\.(insumo)$/.test(t.dataset.path||'')){setTimeout(()=>{const f=t.closest('.ifa-ficha');const bt=f&&f.querySelector('[data-ifa-consultar]');if(bt)bt.disabled=!t.value.trim()},0)}});
 const st=document.createElement('style');st.id='ifa-style';st.textContent='.dist-ifa-callout{display:none!important}.ifa-painel{border:1px solid #9cc3d8;border-radius:14px;background:#f4f9fc;padding:12px;margin:10px 0}.ifa-legenda{font-size:.78rem;color:#355;margin:8px 0}.ifa-ficha{background:#fff;border:1px solid #d9e2e8;border-radius:12px;padding:10px 12px;margin:10px 0}.ifa-ficha h5{margin:12px 0 6px;font-size:.86rem;color:#1d4b6b}.ifa-head{display:flex;justify-content:space-between;gap:8px;align-items:center}.ifa-achados{display:grid;gap:6px;margin:8px 0}.ifa-a{display:flex;gap:8px;padding:7px 9px;border-radius:9px;font-size:.84rem;line-height:1.4}.ifa-a b{flex:0 0 auto}.ifa-a.ok{background:#e8f5ec;color:#1d5b33}.ifa-a.pend{background:#fff6e0;color:#6b4a06}.ifa-a.inc{background:#fbeaea;color:#8b2019}.ifa-a.na{background:#f1f3f5;color:#4a5560}.ifa-docs{display:grid;gap:6px}.ifa-doc{display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:8px;align-items:center;font-size:.84rem;border-bottom:1px dashed #e1e8ee;padding:4px 0}.ifa-doc select{min-height:38px}@media(max-width:560px){.ifa-doc{grid-template-columns:1fr}}';document.head.appendChild(st);
})();
