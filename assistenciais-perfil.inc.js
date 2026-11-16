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
/* ——— Dimensionamento: entradas conferidas antes do cálculo (auditoria de 14/11/2026, E06) ———
   Antes, a fórmula rodava com qualquer número: −21 acolhidos davam −2 educadores, e meia pessoa era aceita.
   Pessoas, turnos e tipo: número inteiro dentro do mínimo e do máximo do campo; área: número igual ou maior
   que zero, com decimais; no SAICA, os acolhidos com demandas específicas não passam do total. Com erro, não há
   resultado na tela nem no relatório; com todos os campos vazios, a calculadora pede os números. */
const AS_CALC_DECIMAL=['area'];
const AS_CALC_COERENCIA={saica:[['esp','n','Os acolhidos com demandas específicas não podem ser mais que o total de acolhidos.']]};
function asCalcNum(v){const s=String(v??'').trim().replace(',','.');return s===''?null:(/^-?\d+(\.\d+)?$/.test(s)?Number(s):NaN)}
function asCalcVazia(){const c=current&&current.calc,cs=c?calcState():{};return !c||c.entradas.every(x=>asCalcNum(cs[x.k])===null)}
function asCalcErros(){
 const c=current&&current.calc;if(!c)return [];
 const cs=calcState(),e=[],val={};
 c.entradas.forEach(x=>{
  const v=asCalcNum(cs[x.k]??x.pad),min=x.min??0,rot=x.r;val[x.k]=v;
  if(v===null)return;
  if(Number.isNaN(v)){e.push({k:x.k,t:rot+': informe um número.'});return}
  if(AS_CALC_DECIMAL.includes(x.k)){if(v<min)e.push({k:x.k,t:rot+': informe um número igual ou maior que '+min+'.'});return}
  if(!Number.isInteger(v)||v<min||(x.max!=null&&v>x.max))e.push({k:x.k,t:rot+': informe um número inteiro '+(x.max!=null?'de '+min+' a '+x.max:'igual ou maior que '+min)+'.'});
 });
 (AS_CALC_COERENCIA[current.id]||[]).forEach(([a,b,msg])=>{if(!e.length&&val[a]!=null&&val[b]!=null&&val[a]>val[b])e.push({k:a,t:msg})});
 return e;
}
{
 const calcValuesOriginal=calcValues;
 calcValues=function(){return asCalcErros().length||asCalcVazia()?current.calc.regras.map(r=>({...r,v:'—'})):calcValuesOriginal()};
 calculate=function(){
  const box=document.getElementById('calcResults');if(!box)return;
  const erros=asCalcErros();
  current.calc.entradas.forEach(x=>{const i=document.getElementById('calc-'+x.k);if(i){if(erros.some(z=>z.k===x.k))i.setAttribute('aria-invalid','true');else i.removeAttribute('aria-invalid')}});
  if(erros.length){box.innerHTML='<div class="calc-result as-calc-erro" role="alert" style="grid-column:1/-1"><strong>Confira os números</strong>'+erros.map(z=>'<small>'+esc(z.t)+'</small>').join('')+'<small>Sem resultado enquanto houver número inválido.</small></div>';return}
  if(asCalcVazia()){box.innerHTML='<div class="calc-result" style="grid-column:1/-1"><small>Informe os números para calcular.</small></div>';return}
  box.innerHTML=calcValuesOriginal().map(r=>'<div class="calc-result"><strong>'+esc(r.r)+'</strong><span>'+esc(r.v)+' '+esc(r.u)+'</span><small>'+esc(r.l)+'</small></div>').join('');
 };
 const st2=document.createElement('style');
 st2.textContent='.as-calc-erro{background:#fbecee!important;border:1px solid #c0394b}.as-calc-erro strong{color:#8a2433}.calc input[aria-invalid="true"]{border-color:#c0394b!important}';
 document.head.appendChild(st2);
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
