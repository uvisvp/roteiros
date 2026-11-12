/* ——— Serviços assistenciais: roteiro pelo perfil do serviço (12/11/2026, como em Alimentos) ———
   Fragmento inserido depois da tela padrão (/*AS-PU-FIM*\/) por scripts/repack-assistenciais-perfil.cjs.
   · Demais acolhimentos: a pergunta e o documento marcados para algumas modalidades (campo sub:
     centro de acolhida, república, residência inclusiva, casa de apoio, RAPS) só aparecem nelas —
     antes a marcação existia nos dados, mas o instrumento mostrava tudo para qualquer modalidade.
   · Todas as modalidades: “Características do serviço” (elevador ou plataforma, medicamentos
     guardados ou administrados, controlados ou termolábeis, procedimentos de saúde no local,
     equipamentos de saúde). Respondido “Não”, o que depende dela sai da tela, das contagens e do
     relatório; sem resposta, continua (nada some antes da escolha do inspetor).
   · O que já foi respondido continua, mesmo fora do perfil.
   A marca é a mesma das repetições (rep, que a tela, as contagens e o relatório já respeitam),
   aplicada em memória: a original fica em _rep0 e os dados gravados não mudam. */
const AS_CARAC=[
 ['elevador','Elevador ou plataforma',x=>/elevador|plataforma/i.test(x.ap||'')||/^Elevador ou plataforma/.test(x.g||'')],
 ['medicamentos','Medicamentos guardados ou administrados pelo serviço',x=>/guarda ou administra medicamentos/i.test(x.ap||'')||/^Medicamentos — quando/.test(x.g||'')],
 ['controlados','Medicamentos controlados ou termolábeis',x=>/controlados ou termolábeis/i.test(x.ap||'')],
 ['procedimentos','Procedimentos de enfermagem ou de saúde no local',x=>/procedimento no local/i.test(x.ap||'')||/^Cuidados em saúde — quando/.test(x.g||'')],
 ['equipamentos','Equipamentos de saúde (aspirador, oxímetro, cadeira de banho…)',x=>/^Somente para equipamentos/i.test(x.ap||'')||/^Equipamentos — quando/.test(x.g||'')]
];
function asCarac(){const p=profile();return p.carac||(p.carac={})}
/* relatório e prévia: o que o inspetor declarou (sem resposta, nada) */
function asCaracTexto(){if(!current)return '';const c=(profile()||{}).carac||{};
 const l=AS_CARAC.filter(([k])=>c[k]).map(([k,r])=>r+': '+(c[k]==='sim'?'sim':'não'));
 return l.length?'Características do serviço declaradas — '+l.join('; ')+'.':''}
function asAplicaPerfil(){
 if(!current)return;
 const c=asCarac(),sub=current.sub&&profile().subtype;
 ['doc','rot'].forEach(kind=>(current[kind]||[]).forEach((x,i)=>{
  if(!('_rep0' in x))x._rep0=x.rep==null?null:x.rep;
  if(x._rep0!=null){x.rep=x._rep0;return}
  let fora=!!(sub&&Array.isArray(x.sub)&&x.sub.length&&!x.sub.includes(sub));
  if(!fora)fora=AS_CARAC.some(([k,,dep])=>c[k]==='nao'&&dep(x));
  if(fora&&!mark(kind,i))x.rep='perfil';else delete x.rep;
 }));
}
if(AS_PADRAO){
 const asGruposPerfil=asGrupos;
 asGrupos=function(kind){asAplicaPerfil();return asGruposPerfil(kind)};
 const asIdentPerfil=asIdent;
 asIdent=function(el,id){
  asIdentPerfil(el,id);if(id==='dados')return;
  const c=asCarac(),n=AS_CARAC.filter(([k])=>c[k]).length;
  el.insertAdjacentHTML('beforeend',`<div class="pu-bloco as-carac"><h3>Características do serviço${n?` <small>(${n} de ${AS_CARAC.length} respondidas)</small>`:''}</h3><p>O que o serviço não tem sai do roteiro e do relatório; sem resposta, continua. O que já foi respondido fica.</p>`
   +AS_CARAC.map(([k,rot])=>`<div class="pu-campo as-carac-l"><span>${esc(rot)}</span><div class="pu-resp" role="group" aria-label="${esc(rot)}">${[['sim','Sim'],['nao','Não']].map(([v,l])=>`<button type="button" data-as-carac="${k}" data-v="${v}" aria-pressed="${c[k]===v}">${l}</button>`).join('')}</div></div>`).join('')+`</div>`);
 };
 document.addEventListener('click',e=>{const b=e.target.closest('[data-as-carac]');if(!b||!current)return;
  const c=asCarac(),k=b.dataset.asCarac,v=b.dataset.v;if(c[k]===v)delete c[k];else c[k]=v;
  persist();asAplicaPerfil();asRedesenha()});
 /* a troca de modalidade (demais acolhimentos) refaz o filtro: o ouvinte da tela já redesenha */
 document.addEventListener('change',e=>{if(e.target.matches&&e.target.matches('[data-as-sub]'))setTimeout(()=>{asAplicaPerfil();asRedesenha()},0)});
 const st=document.createElement('style');
 st.textContent='.pu-ativo .as-carac-l{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;margin:6px 0}.pu-ativo .as-carac-l .pu-resp{flex:0 0 auto;min-width:200px}';
 document.head.appendChild(st);
}
