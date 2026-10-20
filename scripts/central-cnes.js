/* CNES (Ministério da Saúde, base mensal do DATASUS; só o município de São Paulo) */
function achataCnes(x,via){const dt=v=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(v||''));return m?m[3]+'/'+m[2]+'/'+m[1]:''},l=x.licenca_sanitaria||{};
 return {_base:'cnes',titulo:(x.nome_fantasia||x.razao_social||'Estabelecimento')+' · CNES '+x.cnes,observacao:via||'',cnes:x.cnes,razao_social:x.razao_social,tipo_unidade:x.tipo_unidade,situacao:x.situacao,cnpj:x.cnpj,
  cnpj_mantenedora:x.cnpj_mantenedora&&x.cnpj_mantenedora!==x.cnpj?x.cnpj_mantenedora:'',
  endereco:[[x.logradouro,x.numero].filter(Boolean).join(', '),x.complemento,x.bairro,'São Paulo/SP',x.cep&&'CEP '+String(x.cep).replace(/^(\d{5})(\d{3})$/,'$1-$2')].filter(Boolean).join(', '),
  telefone:x.telefone,email:x.email,gestao:x.gestao,turno:x.turno,
  licenca_cnes:l.numero?['nº '+l.numero,l.data_expedicao&&'expedida em '+dt(l.data_expedicao),l.validade&&'validade '+dt(l.validade)].filter(Boolean).join(', '):'',
  equipamentos:(x.equipamentos||[]).map(e=>e.equipamento+' — '+e.existentes+' existente(s), '+e.em_uso+' em uso'+(e.sus?', SUS':'')),
  servicos:x.servicos||[],atualizacao_cnes:dt(x.data_atualizacao)}}
async function cnesPorCodigo(v){const c=digits(v).padStart(7,'0');const d=await json(`cnes/estabelecimentos/${c.slice(0,3)}.json`);return d&&d[c]?[achataCnes(d[c])]:[]}
/* CNPJ próprio (cnes/cnpj) e unidades de uma mantenedora (cnes/mantenedora); a Prefeitura mantém mais de mil
   unidades: mostra as primeiras MAX_MANT e avisa quantas são */
const MAX_MANT=40;
async function cnesCarrega(cods,via){const grupos=new Map(),out=[];cods.forEach(c=>{const s=c.slice(0,3);if(!grupos.has(s))grupos.set(s,[]);grupos.get(s).push(c)});
 const lidos=await Promise.all([...grupos.keys()].map(s=>json(`cnes/estabelecimentos/${s}.json`)));
 [...grupos.values()].forEach((l,i)=>{const d=lidos[i];for(const c of l){const x=d&&d[c];if(x)out.push(achataCnes(x,via))}});return out}
async function cnesPorCnpj(cnpj){const [idx,mant]=await Promise.all([json(`cnes/cnpj/${cnpj.slice(0,3)}.json`),json(`cnes/mantenedora/${cnpj.slice(0,3)}.json`)]);
 const proprios=(idx&&idx[cnpj])||[],mantidas=((mant&&mant[cnpj])||[]).filter(c=>!proprios.includes(c));
 const via=mantidas.length>MAX_MANT?'Unidade mantida por este CNPJ (mantenedora). São '+mantidas.length+' unidades cadastradas no CNES, entre ativas e desativadas; aqui aparecem as '+MAX_MANT+' primeiras, ativas antes. Para uma unidade específica, consulte pelo número do CNES.':'Unidade mantida por este CNPJ (mantenedora).';
 return (await cnesCarrega(proprios,'')).concat(await cnesCarrega(mantidas.slice(0,MAX_MANT),via))}
