'use strict';
/* Produtos (atacadista/distribuidor de dispositivos médicos): relatórios do POP-O-SNVS-013 rev. 9
   (vigência 03/08/2026) no modelo dos anexos (revisão de 25/10/2026).
   Relatório (Anexos I, II e IV):
   - cabeçalho do modelo: órgão, título, Empresa e Período em linhas próprias e “Cidade, data”; sai a
     linha com o nome do modelo; datas em dd/mm/aaaa;
   - avisos de pendência (“MINUTA…”) só na tela, não no documento;
   - Anexo I: capítulos 8 a 16 com os subitens do modelo (8.1 a 16.2); cada subitem traz a
     descrição digitada para ele, o que foi verificado no roteiro e, nas respostas Não cumpre, o
     requisito com a evidência em negrito; subitem sem conteúdo sai “Não aplicável” (item 8.2 do
     POP); todas as seções do roteiro do distribuidor chegam ao relatório (recebimento,
     qualidade, pessoal e manuseio ficavam de fora);
   - as NCs não são categorizadas no relatório (o POP manda categorizar só no Anexo III);
   - Anexo II: quadros Documentos avaliados (ordem, documento, título, versão), Alterações de maior
     relevância e Descrição das não conformidades; quadro vazio sai justificado;
   - conclusão com os status do modelo marcáveis; assinaturas com a coluna Assinatura; registro de
     entrega com linhas para preenchimento.
   Anexo III (Formulário de Comunicação de NCs e Análise de Implementação do Plano de Ação
   Corretiva): identificação, inspeção, equipe, todas as linhas do quadro de cada NC (as da empresa
   saem em branco para preenchimento; antes eram omitidas), categorização e reincidência
   marcáveis, conclusão das ações corretivas, assinaturas e registro de entrega.
   Idempotente. Uso: node scripts/repack-produtos-relatorio.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const ID = 'app--produtos-correlatos';
const MARCA = '/* POP-O-SNVS-013 rev. 9: relatório no modelo (25/10/2026) */';

const REL = String.raw`/* POP-O-SNVS-013 rev. 9: relatório no modelo (25/10/2026) */
 const MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],LINHA='______________________________';
 function dt(v){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(v||''));return m?m[3]+'/'+m[2]+'/'+m[1]:txt(v)}
 function periodo(a,b){a=dt(a);b=dt(b);return a&&b?a+' a '+b:(a||b||'')}
 function extenso(v){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(v||''));const d=m?new Date(+m[1],+m[2]-1,+m[3]):new Date();return d.getDate()+' de '+MESES[d.getMonth()]+' de '+d.getFullYear()}
 function cx(v,o,l){return (v===o?'☒ ':'☐ ')+l}
 function lineRows(s,n){return txt(s).split(/\n+/).map(x=>x.trim()).filter(Boolean).map(x=>{const p=x.split('|').map(y=>y.trim());while(p.length<n)p.push('');return p.slice(0,n)})}
 function table(headers,rows,vazio){if(!rows.length){if(!vazio)return '<p>Não informado.</p>';rows=vazio}return '<table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>'}
 function pval(v,empty='Não informado.'){return txt(v)?'<p>'+esc(v).replace(/\n/g,'<br>')+'</p>':(empty?'<p>'+esc(empty)+'</p>':'')}
 function flagsText(){const f=route().profile?.flags||{},a=[];if(f.cls_disp)a.push('produtos para saúde / dispositivos médicos e IVD');if(f.cls_cosm)a.push('cosméticos, produtos de higiene e perfumes');if(f.cls_san)a.push('saneantes');return a.join('; ')}
 function objective(){const p=pop(),m={boas_praticas:'Boas Práticas',cto:'Condições Técnicas Operacionais (CTO)',monitoramento:'Monitoramento de plano de ação',investigativa:'Inspeção investigativa / fiscalização',outro:p.outro||'Outro'};return m[p.objetivo]||''}
 function matches(when,r=route()){if(!when)return true;if(when.any?.length&&!when.any.some(x=>matches(x,r)))return false;if(when.all?.length&&!when.all.every(x=>matches(x,r)))return false;if(when.types?.length&&!when.types.includes(r.profile?.type))return false;if(when.notTypes?.includes(r.profile?.type))return false;if(when.flagsAll?.some(k=>!r.profile?.flags?.[k]))return false;if(when.flagsAny?.length&&!when.flagsAny.some(k=>r.profile?.flags?.[k]))return false;if(when.flagsNot?.some(k=>r.profile?.flags?.[k]))return false;return true}
 /* subitens do Anexo I */
 const SUB={8:[['8.1','Manual da Qualidade'],['8.2','Responsabilidade Gerencial'],['8.3','Pessoal'],['8.4','Gerenciamento de Risco'],['8.5','Controle de Compras/ Qualificação de Fornecedores/Prestadores de Serviço']],9:[['9.1','Gerenciamento de Documentos'],['9.2','Registro Histórico de Produtos'],['9.3','Liberação dos Produtos']],10:[['10.1','Controle de Projeto'],['10.2','Registro Histórico de Projeto'],['10.3','Registro Mestre de Produto']],11:[['11.1','Áreas de Produção/Fluxos de Produção e Controles em Processo'],['11.2','Embalagem, Rotulagem e Instruções de Uso'],['11.3','Limpeza e Sanitização'],['11.4','Sistema de água'],['11.5','Sistema de ar'],['11.6','Outros sistemas de suporte'],['11.7','Saúde e Higiene do Pessoal'],['11.8','Controle de Pragas'],['11.9','Segurança biológica'],['11.10','Programa de Manutenção']],12:[['12.1','Inspeções e Testes'],['12.2','Programa de Calibração']],13:[['13.1','Plano Mestre de Validação'],['13.2','Validação de processos produtivos'],['13.3','Validação dos processos de esterilização'],['13.4','Validação de sistemas computadorizados'],['13.5','Validação de limpeza'],['13.6','Outros'],['13.7','Controle de Mudanças']],14:[['14.1','Procedimentos e registros de ações corretivas e preventivas'],['14.2','Procedimento para componentes e produtos não conformes'],['14.3','Gerenciamento de Reclamações'],['14.4','Ações de campo e recolhimento de produtos'],['14.5','Auditorias da Qualidade']],15:[['15.1','Armazenamento e Manuseio'],['15.2','Identificação e rastreabilidade'],['15.3','Distribuição de produtos acabados']],16:[['16.1','Instalação'],['16.2','Assistência técnica']],17:[]};
 /* pergunta do roteiro → subitem do modelo (o que não está aqui vai pelo padrão da seção) */
 const ITEMSUB={dq1:'8.1',dq2:'8.1',dq3:'8.2',dq4:'8.2',dq5:'8.2',dq6:'8.3',dq7:'8.3',dq8:'8.5',dq9:'8.5',ddc1:'9.1',ddc2:'9.1',ddc3:'9.1',ddc4:'9.1',ddc5:'9.1',di1:'11.1',di2:'11.1',di3:'11.3',di4:'11.7',di5:'11.7',di6:'11.3',di7:'11.8',di8:'11.6',di9:'11.7',da1:'15.1',da2:'15.1',da3:'15.3',da4:'15.2',da5:'15.1',da6:'15.3',da7:'15.2',da8:'15.2',da9:'14.2',dc1:'14.1',dc2:'14.4',dc3:'14.3',dc4:'14.3',dc5:'14.5',dc6:'14.3',dt1:'16.1',dt2:'16.2',dt3:'16.2',df1:'8.5',df5:'11.1',df2:'15.1',df4:'15.1',ds1:'15.1',ds3:'15.1',ds4:'15.1',ds2:'14.2',ds6:'15.2',ds7:'15.1',ds5:'15.1',dq11:'8.1',dq12:'14.1',dq13:'14.5',dr1:'15.2',dr3:'15.2',dd3:'14.3',dd2:'8.3',dd6:'8.1',dd7:'11.6'};
 const SECSUB={d_sq:'8.1',d_doc:'9.1',d_inst:'11.1',d_man:'15.1',d_capa:'14.1',d_at:'16.2',d_rec:'15.1',d_arm:'15.1',d_qual:'14.1',d_pes:'8.3',lic:'2',reg:'6'};
 /* tema da NC do Anexo III → capítulo do relatório completo */
 const TEMACAP={regularidade:2,produtos:6,geral:7,utilidades:11,qualidade:8,documentos:9,projeto:10,processo:11,testes:12,validacao:13,capa:14,armazenamento:15,assistencia:16,estatistica:17,outros:18};
 function itensRoteiro(){const r=route(),cfg=window.ROTEIRO_CONFIG||{},out=[];(cfg.sections||[]).filter(s=>matches(s.when,r)).forEach(s=>(s.items||[]).filter(i=>matches(i.when,r)).forEach(i=>{const v=r.answers?.[i.id];const sub=ITEMSUB[i.id]||SECSUB[s.id];if(!v||!sub)return;out.push({sub,v,texto:txt(i.text),legal:txt(i.legal).replace(/\.$/,''),nota:(n=>txt(n&&typeof n==='object'?(txt(n.evidence)||n.note):n))(r.notes?.[i.id])})}));return out}
 function nivel(sub){return String(sub).split('.')[0]}
 function roteiroHtml(l){const yes=l.filter(x=>x.v==='yes').length,no=l.filter(x=>x.v==='no'),na=l.filter(x=>x.v==='na').length;let h='';if(yes)h+='<p>Verificado(s) no roteiro '+yes+' requisito(s) deste item, sem não conformidade.</p>';no.forEach(x=>{h+='<p>Requisito verificado: '+esc(x.texto)+(x.legal?' ('+esc(x.legal)+')':'')+' <b>Evidência: '+esc(x.nota||'não descrita no roteiro')+'</b></p>'});if(!yes&&!no.length&&na)h+='<p>Não aplicável.</p>';return h}
 function roteiroSub(code){return roteiroHtml(itensRoteiro().filter(x=>x.sub===code))}
 function ncsCap(n){return (capa().ncs||[]).filter(x=>(TEMACAP[x.tema||'outros']||18)===n)}
 function ncLista(arr){if(!arr.length)return '';return '<p><b>Não conformidades comunicadas no Formulário de Comunicação de Não Conformidades (Anexo III):</b></p>'+arr.map(n=>'<p>NC nº '+esc(n.numero||'')+(n.norma?' — '+esc(n.norma):'')+': '+esc(n.descricao||'')+(n.evidencia?' <b>Evidência: '+esc(n.evidencia)+'</b>':'')+'</p>').join('')}
 function docRows(topic,d){return lineRows(comp(topic,d).docs,3)}
 function subKey(code){return 'sub_'+code.replace(/\./g,'_')}
 function commonTop(title){const d=effective();return (txt(d.orgao)?'<p><b>'+esc(d.orgao)+'</b></p>':'')+'<h1>'+esc(title)+'</h1><p><b>Empresa:</b> '+esc(d.razao||LINHA)+'</p><p><b>Período de Inspeção:</b> '+esc(periodo(d.inicio,d.fim)||LINHA)+'</p><p>'+esc((txt(d.cidade)||'São Paulo')+', '+extenso(d.fim||d.inicio))+'.</p>'}
 function identification(d){const mf=txt(d.matrizFilial);return '<h2>1. IDENTIFICAÇÃO DA EMPRESA</h2>'+table(['Campo','Informação'],[['1.1 Razão Social',d.razao],['1.2 Nome Fantasia',d.fantasia],['1.3 CNPJ',(txt(d.cnpj)||LINHA)+'   '+cx(/matriz/i.test(mf),true,'Matriz')+'   '+cx(/filial/i.test(mf),true,'Filial')],['1.4 Endereço',d.endereco],['1.5 País',d.pais],['1.6 Telefone',d.telefone],['1.7 Endereço eletrônico',d.email],['1.8 Responsável legal / CPF',[d.respLegal,d.respLegalCpf].filter(Boolean).join(' · ')],['1.9 Responsável técnico / Conselho',[d.respTec,d.conselho].filter(Boolean).join(' · ')],['1.10 Licença Sanitária / data',[d.licenca,dt(d.licencaData)].filter(Boolean).join(' · ')],['1.11 AFE',d.afe],['1.12 Certificação de BPF / validade',[d.cbpf,dt(d.cbpfValidade)].filter(Boolean).join(' · ')],['1.13 Outros documentos',d.outrosDocs]].map(r=>[r[0],txt(r[1])||'Não informado']))}
 function regularity(d){return '<h2>2. REGULARIDADE SANITÁRIA</h2><h3>2.1 Atividades licenciadas</h3>'+pval(d.ativLicenciadas||'Distribuição e armazenamento, conforme licenciamento sanitário e escopo informado pela equipe.')+'<h3>2.2 AFE</h3>'+pval(d.afeAtividades||d.afe)+'<p><b>Classes de produtos abrangidas nesta inspeção:</b> '+esc(flagsText()||'Não informado')+'.</p>'+roteiroSub('2')+ncLista(ncsCap(2))}
 function inspection(d){const p=pop();const linhas=(p.linhas||[]).map(x=>({equipamentos:'Equipamentos',materiais:'Materiais',ivd:'Diagnóstico de uso in vitro (IVD)'}[x]||x)).join(', ');const prim=/^s/i.test(txt(d.primeira));return '<h2>3. INSPEÇÃO</h2>'+table(['Campo','Informação'],[['Período',periodo(d.inicio,d.fim)],['Objetivo da inspeção',objective()],['Linhas/objeto da inspeção',d.linhasObjeto||linhas],['Classes de risco',(p.riscos||[]).join(', ')],['Período da última inspeção',cx(!prim&&!!txt(d.ultima),true,'Empresa já inspecionada'+(txt(d.ultima)?' — '+dt(d.ultima):''))+'   '+cx(prim,true,'Empresa inspecionada pela primeira vez')]].map(r=>[r[0],txt(r[1])||'Não informado']))}
 function team(d,n){return '<h2>'+(n||4)+'. EQUIPE INSPETORA</h2>'+table(['Nome do inspetor','Código do inspetor'],lineRows(d.equipe,2),[['',''],['','']])}
 function contacts(d,n){return '<h2>'+(n||5)+'. PESSOAS CONTACTADAS</h2>'+table(['Nome','Cargo','Contato'],lineRows(d.pessoas,3),[['','',''],['','','']])}
 function products(d){return '<h2>6. PRODUTOS FABRICADOS, REGISTRADOS/CADASTRADOS</h2>'+table(['Nome técnico','Registro/Cadastro','Classe de risco','Observação'],lineRows(d.produtos,4))+roteiroSub('6')+ncLista(ncsCap(6))}
 function general(d){return '<h2>7. INFORMAÇÕES GERAIS</h2>'+pval(d.descricaoGeral)+(route().profile?.flags?.cls_cosm||route().profile?.flags?.cls_san?'<p>Além de produtos para saúde, a inspeção abrangeu as seguintes classes sujeitas ao controle sanitário: '+esc(flagsText())+'.</p>':'')+ncLista(ncsCap(7))}
 function fullChapter(num,title,topics,d){let h='<h2>'+num+'. '+esc(title)+'</h2>',tem=false;
  topics.forEach(t=>{const c=comp(t,d);if(c.narrativa){h+=pval(c.narrativa);tem=true}if(docRows(t,d).length){h+='<p><b>Documentos avaliados:</b></p>'+table(['Documento nº','Título','Versão'],docRows(t,d));tem=true}});
  const subs=SUB[num]||[];
  if(!subs.length){const r=roteiroSub(String(num));h+=r;if(!r&&!tem)h+='<p>Não aplicável.</p>'}
  subs.forEach(([code,nome])=>{const c=comp(subKey(code),d),r=roteiroSub(code);h+='<h3>'+code+' '+esc(nome)+'</h3>'+(c.narrativa?pval(c.narrativa):'')+r+(!c.narrativa&&!r?'<p>Não aplicável.</p>':'')});
  return h+ncLista(ncsCap(num))}
 /* Anexo II: capítulo do modelo simplificado de cada subitem */
 function capSimples(sub){const n=+nivel(sub);if(n===8||n===9)return 9;if(sub==='11.4'||sub==='11.5'||sub==='11.6')return 8;return n}
 function simpleChapter(num,title,topics,d){let h='<h2>'+num+'. '+esc(title)+'</h2>',docs=[],alt=[];
  topics.forEach(t=>{docRows(t,d).forEach(r=>docs.push(r));const c=comp(t,d);if(txt(c.alteracoes))alt.push(c.alteracoes)});
  const rot=itensRoteiro().filter(x=>capSimples(x.sub)===num),no=rot.filter(x=>x.v==='no'),ncA=topics.flatMap(t=>(capa().ncs||[]).filter(n=>(n.tema||'outros')===t));
  if(!docs.length&&!alt.length&&!no.length&&!ncA.length){const yes=rot.filter(x=>x.v==='yes').length;return h+(yes?'<p>Quadros não preenchidos: verificado(s) no roteiro '+yes+' requisito(s) deste item, sem documentos de maior relevância a relatar, sem alterações de maior relevância e sem não conformidades.</p>':'<p>Não aplicável.</p>')}
  h+='<h3>Documentos Avaliados</h3>'+(docs.length?table(['Ordem','Documento#','Título','Versão'],docs.map((r,i)=>[String(i+1),r[0],r[1],r[2]])):'<p>Quadro não preenchido: não houve documentos avaliados de maior relevância neste item.</p>');
  h+='<h3>Alterações de Maior Relevância</h3>'+(alt.length?alt.map(x=>pval(x)).join(''):'<p>Quadro não preenchido: não foram relatadas alterações de maior relevância desde a última inspeção.</p>');
  h+='<h3>Descrição das Não Conformidades</h3>'+(no.length||ncA.length?roteiroHtml(no)+ncLista(ncA):'<p>Quadro não preenchido: não foram constatadas não conformidades neste item.</p>');
  return h}
 function assinaturas(d,n){return '<h2>'+n+'. ASSINATURAS</h2>'+table(['Nome do Inspetor (informar se o inspetor atuou como observador)','Nome/Sigla da Instituição (a qual o inspetor pertence)','Esfera de Atuação do Inspetor (Federal, Estadual ou Municipal)','Assinatura'],lineRows(d.assinaturas,4).map(r=>[r[0]+(r[3]?' (observador)':''),r[1],r[2],'']),[['','','',''],['','','','']])}
 function entrega(d,n){return '<h2>'+n+'. REGISTRO DE ENTREGA DO RELATÓRIO, TERMOS E AUTOS</h2><p><b>Termos e autos relacionados:</b> '+esc(txt(d.termos)||LINHA)+'</p><p><b>Data de recebimento:</b> '+esc(dt(d.entregaData)||'____/____/______')+'</p><p><b>Nome e função/cargo do responsável pelo recebimento do relatório:</b> '+esc(txt(d.entregaNome)||LINHA)+'</p><p><b>Documento de identificação:</b> '+esc(txt(d.entregaDoc)||LINHA)+'</p><p><b>Assinatura:</b> '+LINHA+'</p>'}
 function conclusao(d){const c=capa().conclusao||{},s=c.status||'',cto=pop().objetivo==='cto';const ops=cto?[['cto_ok','Em Condições Técnicas Operacionais'],['cto_nao','Sem Condições Técnicas Operacionais']]:[['cumpre','Cumpre as Boas Práticas de Fabricação'],['cumpre_acao','Cumpre as Boas Práticas de Fabricação com Ação Corretiva'],['nao_cumpre','Não cumpre as Boas Práticas de Fabricação']];return ops.map(o=>'<p>'+esc(cx(s,o[0],o[1]))+'</p>').join('')+pval(d.conclusaoComplemento,'')}
 function finalSections(d){return '<h2>18. CONSIDERAÇÕES FINAIS E AVALIAÇÃO DE RISCOS</h2>'+pval(d.consideracoes)+ncLista(ncsCap(18))+'<h2>19. CONCLUSÃO</h2>'+conclusao(d)+'<h2>20. MEDIDAS ADOTADAS/ DOCUMENTOS EMITIDOS</h2>'+pval(d.medidas,'Não aplicável.')+'<h2>21. AMOSTRAS FISCAIS</h2>'+pval(d.amostras,'Não foram coletadas amostras fiscais.')+'<h2>22. LISTA DE ANEXOS</h2>'+pval(d.anexos,'Não aplicável.')+assinaturas(d,23)+entrega(d,24)}
 function full(){const d=effective();return commonTop('RELATÓRIO DE INSPEÇÃO')+identification(d)+regularity(d)+inspection(d)+team(d)+contacts(d)+products(d)+general(d)+CHAPTER_FULL.map(x=>fullChapter(x[0],x[1],x[2],d)).join('')+finalSections(d)}
 function simple(){const d=effective();return commonTop('RELATÓRIO DE INSPEÇÃO')+identification(d)+regularity(d)+inspection(d)+team(d)+contacts(d)+products(d)+general(d)+CHAPTER_SIMPLE.map(x=>simpleChapter(x[0],x[1],x[2],d)).join('')+finalSections(d)}
 function investigative(){const d=effective(),ncsAll=(capa().ncs||[]),rot=itensRoteiro().filter(x=>x.v==='no');return commonTop('RELATÓRIO DE INSPEÇÃO INVESTIGATIVA')+identification(d)+'<h2>2. OBJETIVOS DA INSPEÇÃO INVESTIGATIVA</h2>'+pval(d.investObjetivo||objective())+team(d,3)+contacts(d,4)+'<h2>5. RELATÓRIO</h2>'+pval(d.investRelato)+roteiroHtml(rot)+ncLista(ncsAll)+'<h2>6. ORIENTAÇÕES</h2>'+pval(d.investOrientacoes,'Não aplicável.')+'<h2>7. ENCAMINHAMENTOS E CONSIDERAÇÕES GERAIS</h2>'+pval(d.investEncaminhamentos,'Não aplicável.')+'<h2>8. CONCLUSÃO</h2>'+pval(d.investConclusao)+'<h2>9. MEDIDAS ADOTADAS/ DOCUMENTOS EMITIDOS</h2>'+pval(d.medidas,'Não aplicável.')+'<h2>10. AMOSTRAS FISCAIS</h2>'+pval(d.amostras,'Não foram coletadas amostras fiscais.')+'<h2>11. LISTA DE ANEXOS</h2>'+pval(d.anexos,'Não aplicável.')+assinaturas(d,12)+entrega(d,13)}
 function reportHtml(tela=true){const p=pop();let body=p.modelo==='simplificado'?simple():p.modelo==='investigativa'?investigative():full();const w=tela?modelWarnings():[];if(w.length)body='<div class="pr-draft"><b>MINUTA — conferir antes da emissão final.</b><ul>'+w.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'+body;return '<div class="prod-pop13-report">'+body+'</div>'}
`;

const TOPIC = String.raw`function topicEditor(id,label,d){const c=comp(id,d),subs=pop().modelo==='simplificado'||pop().modelo==='investigativa'?[]:CHAPTER_FULL.filter(x=>x[2].includes(id)).flatMap(x=>SUB[x[0]]||[]);return '<details class="pr-topic"><summary>'+esc(label)+'</summary><div class="pr-topic-body">'+field('complementos.'+id+'.docs','Documentos avaliados — uma linha por documento: nº | título | versão',c.docs,'textarea',true,'POP-01 | Recebimento e armazenamento | Rev. 03')+field('complementos.'+id+'.alteracoes','Alterações de maior relevância desde a última inspeção',c.alteracoes,'textarea',true,'Somente alterações críticas/relevantes; não repetir revisões rotineiras.')+field('complementos.'+id+'.narrativa','Narrativa geral do capítulo (relatório completo)',c.narrativa,'textarea',true,'Descrição consolidada; não copie as perguntas do roteiro.')+subs.map(s=>field('complementos.'+subKey(s[0])+'.narrativa',s[0]+' '+s[1]+' — descrição para o relatório completo (documentos avaliados: código, título, versão e evidências)',comp(subKey(s[0]),d).narrativa,'textarea',true,'Sem descrição, o subitem sai “Não aplicável”.')).join('')+'</div></details>'}`;

function troca(s, de, para, rot) {
  if (s.includes(para)) return s;
  if (s.split(de).length !== 2) throw Error('Produtos: trecho não localizado de forma única: ' + rot);
  return s.replace(de, () => para);
}
function entre(s, ini, fim, para, rot) {
  const i = s.indexOf(ini); if (i < 0) throw Error('Produtos: início não localizado: ' + rot);
  const j = s.indexOf(fim, i); if (j < 0) throw Error('Produtos: fim não localizado: ' + rot);
  return s.slice(0, i) + para + s.slice(j);
}

const ANEXO3 = String.raw`function relDados(){try{return (window.ProdutosPOP13Report&&ProdutosPOP13Report.getState())||JSON.parse(localStorage.getItem('uvis-produtos-pop13-report-v1')||'{}')||{}}catch(e){return {}}}
 function rtDados(){try{return JSON.parse(localStorage.getItem('uvis-produtos-v2')||'{}')||{}}catch(e){return {}}}
 function dtA(v){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(v||''));return m?m[3]+'/'+m[2]+'/'+m[1]:String(v||'').trim()}
 function perA(a,b){a=dtA(a);b=dtA(b);return a&&b?a+' a '+b:(a||b||'')}
 function extA(v){const M=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(v||''));const d=m?new Date(+m[1],+m[2]-1,+m[3]):new Date();return d.getDate()+' de '+M[d.getMonth()]+' de '+d.getFullYear()}
 function docHtml(){const st=load(),r=relDados(),rt=rtDados(),L='______________________________',cxA=(v,o,l)=>(v===o?'☒ ':'☐ ')+l,lin=(s,n)=>String(s||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).map(x=>{const p=x.split('|').map(y=>y.trim());while(p.length<n)p.push('');return p.slice(0,n)});
  const css='body{font-family:Arial,sans-serif;font-size:10.5pt;color:#111}h1{font-size:14pt;text-align:center}h2{font-size:12pt;margin-top:18px}table{border-collapse:collapse;width:100%;margin:8px 0}td,th{border:1px solid #777;padding:6px;vertical-align:top}th{background:#eee;text-align:left}';
  const razao=r.razao||rt.meta?.establishment||'',per=perA(r.inicio,r.fim),row=(a,b)=>'<tr><th style="width:38%">'+esc(a)+'</th><td>'+esc(b==null?'':b)+'</td></tr>';
  let b=(r.orgao?'<p><b>'+esc(r.orgao)+'</b></p>':'')+'<h1>FORMULÁRIO DE COMUNICAÇÃO DE NÃO CONFORMIDADES E ANÁLISE DE IMPLEMENTAÇÃO DO PLANO DE AÇÃO CORRETIVA</h1>'
   +'<p><b>Empresa:</b> '+esc(razao||L)+'</p><p><b>Período de Inspeção:</b> '+esc(per||L)+'</p><p>'+esc((r.cidade||'São Paulo')+', '+extA(r.fim||r.inicio))+'.</p>'
   +'<h2>1. IDENTIFICAÇÃO DA EMPRESA</h2><p><b>1.1 Razão Social:</b> '+esc(razao||L)+'</p><p><b>1.2 Endereço:</b> '+esc(r.endereco||L)+'</p><p><b>1.3 País:</b> '+esc(r.pais||'Brasil')+'</p>'
   +'<h2>2. INSPEÇÃO</h2><p><b>Período da inspeção:</b> '+esc(per||L)+'</p>'
   +'<h2>3. EQUIPE INSPETORA</h2>'+(lin(r.equipe,2).length?lin(r.equipe,2):[['',''],['','']]).map(x=>'<p><b>Nome do inspetor:</b> '+esc(x[0]||L)+'   <b>Código do inspetor:</b> '+esc(x[1]||'__________')+'</p>').join('')
   +'<h2>4. NÃO CONFORMIDADES</h2>';
  if(!st.ncs.length)b+='<p>Não foram constatadas não conformidades.</p>';
  st.ncs.forEach(n=>{b+='<table>'+row('Nº da Não conformidade',n.numero)
   +row('Categorização',[cxA(n.categoria,'outras','Outras'),cxA(n.categoria,'maior','Maior'),cxA(n.categoria,'critica','Crítica')].join('   '))
   +row('Reincidência',[cxA(n.reincidencia,'sim','Sim'),cxA(n.reincidencia,'nao','Não')].join('   '))
   +row('Norma e Artigo Infringido (preenchimento SNVS)',n.norma)+row('Descrição da NC (preenchimento SNVS)',n.descricao)+row('Evidência (preenchimento SNVS)',n.evidencia)
   +row('Ação Corretiva proposta (preenchimento empresa)',n.capa)+row('Data da implementação proposta (preenchimento pela empresa)',dtA(n.dataImpl))+row('Evidência da Implementação (preenchimento empresa)',n.evidenciaImpl)
   +row('Correções implementadas no caso de NC Crítica (preenchimento empresa)',n.critCorrecao)+row('Evidência da Implementação das correções realizadas (preenchimento empresa)',n.critEvidencia)
   +row('Análise da ação corretiva proposta (preenchimento SNVS)',[cxA(n.acaoAceite,'aceita','Aceita'),cxA(n.acaoAceite,'nao_aceita','Não Aceita')].join('   '))
   +row('Justificativa no caso de não aceite da ação corretiva proposta (preenchimento SNVS)',n.acaoJust)
   +row('Reclassificação da NC após análise da ação corretiva proposta (preenchimento SNVS)',[cxA(n.reclassifica,'sim','Sim'),cxA(n.reclassifica,'nao','Não')].join('   ')+(n.reclassifica==='sim'&&n.novaCategoria?' — nova categoria: '+({outras:'Outras',maior:'Maior',critica:'Crítica'}[n.novaCategoria]||n.novaCategoria):''))
   +row('Situação da NC (preenchimento SNVS)',[cxA(n.situacao,'finalizada','Finalizada'),cxA(n.situacao,'andamento','Em andamento')].join('   '))
   +row('Estratégia de Monitoramento',[cxA(n.monitor,'documental','Avaliação Documental'),cxA(n.monitor,'acompanhamento','Inspeção de Acompanhamento'),cxA(n.monitor,'proxima','Próxima Inspeção de BPF'),cxA(n.monitor,'sem','Sem necessidade de monitoramento')].join('\n'))
   +row('Data planejada para monitoramento (preenchimento SNVS)',dtA(n.monitorData))+row('Ação Padronizada (preenchimento SNVS)',[cxA(n.acaoPad,'sim','Sim'),cxA(n.acaoPad,'nao','Não')].join('   '))+row('Justificativa para ação padronizada',n.acaoPadJust)
   +'<tr><th colspan="2">ANÁLISE DAS EVIDÊNCIAS DE IMPLEMENTAÇÃO DO PLANO DE AÇÃO</th></tr>'
   +row('Data do monitoramento (preenchimento SNVS)',dtA(n.monitorRealData))+row('Evidências apresentadas no monitoramento (preenchimento SNVS)',n.monitorEvid)
   +row('Aceite das evidências relacionadas ao plano de ação corretiva proposto (preenchimento SNVS)',[cxA(n.monitorAceite,'aceita','Aceita'),cxA(n.monitorAceite,'nao_aceita','Não Aceita')].join('   '))
   +row('Justificativa no caso de não aceite das evidências apresentadas no monitoramento',n.monitorJust)+row('Ações padronizadas, no caso de não aceite das evidências (preenchimento SNVS)',n.monitorAcoes)+'</table>'});
  const c=st.conclusao||{},stt={cumpre:'Cumpre as Boas Práticas de Fabricação',cumpre_acao:'Cumpre as Boas Práticas de Fabricação com Ação Corretiva',nao_cumpre:'Não cumpre as Boas Práticas de Fabricação',cto_ok:'Em Condições Técnicas Operacionais',cto_nao:'Sem Condições Técnicas Operacionais'};
  if(c.status||c.avaliacao)b+='<h2>5. CONCLUSÃO DAS AÇÕES CORRETIVAS</h2>'+(c.status?'<p><b>'+esc(stt[c.status]||c.status)+'.</b></p>':'')+(c.avaliacao?'<p>'+esc(c.avaliacao).replace(/\n/g,'<br>')+'</p>':'');
  const na=c.status||c.avaliacao?6:5,ass=lin(r.assinaturas,4);
  b+='<h2>'+na+'. ASSINATURAS</h2><table><tr><th>Nome do Inspetor (informar se o inspetor atuou como observador)</th><th>Nome/Sigla da Instituição (a qual o inspetor pertence)</th><th>Esfera de Atuação do Inspetor (Federal, Estadual ou Municipal)</th><th>Assinatura</th></tr>'+(ass.length?ass:[['','','',''],['','','','']]).map(x=>'<tr><td>'+esc(x[0]+(x[3]?' (observador)':''))+'</td><td>'+esc(x[1])+'</td><td>'+esc(x[2])+'</td><td>&nbsp;</td></tr>').join('')+'</table>'
   +'<h2>'+(na+1)+'. REGISTRO DE ENTREGA DO RELATÓRIO, TERMOS E AUTOS</h2><p><b>Termos e autos relacionados:</b> '+esc(r.termos||L)+'</p><p><b>Data de recebimento:</b> '+esc(dtA(c.entregaData||r.entregaData)||'____/____/______')+'</p><p><b>Nome e função/cargo do responsável pelo recebimento do relatório:</b> '+esc(c.entregaNome||r.entregaNome||L)+'</p><p><b>Documento de identificação:</b> '+esc(c.entregaDoc||r.entregaDoc||L)+'</p><p><b>Assinatura:</b> '+L+'</p>';
  return '<!doctype html><html><head><meta charset="utf-8"><style>'+css+'</style></head><body>'+b+'</body></html>'}
`;

/* conversor HTML → Word (rec--documentos.js): negrito dentro do parágrafo (<b>, <strong>), para as
   evidências que o POP-O-SNVS-013 manda negritar; parágrafo sem negrito sai como antes */
const DOC_ID = 'rec--documentos.js';
const RUNS = "function runsOf(n){const r=[];(function w(e,b){for(const c of e.childNodes){if(c.nodeType===3)r.push([c.textContent,b]);else if(c.nodeType===1){const t=c.tagName.toLowerCase();if(t==='br')r.push(['\\n',b]);else w(c,b||t==='b'||t==='strong')}}})(n,false);if(r.length){r[0][0]=r[0][0].replace(/^\\s+/,'');r[r.length-1][0]=r[r.length-1][0].replace(/\\s+$/,'')}return r}\nconst paraRuns=runs=>'<w:p><w:pPr><w:pStyle w:val=\"Normal\"/></w:pPr>'+runs.map(([t,b])=>String(t).split('\\n').map((line,i)=>'<w:r>'+(b?'<w:rPr><w:b/></w:rPr>':'')+(i?'<w:br/>':'')+'<w:t xml:space=\"preserve\">'+x(line)+'</w:t></w:r>').join('')).join('')+'</w:p>';\n";
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== DOC_ID) return m;
  const src = lz.decompressFromBase64(enc.trim());
  let s = src;
  if (!s.includes('function runsOf(n)')) {
    s = troca(s, 'function domBlocks(root){', RUNS + 'function domBlocks(root){', 'conversor: runsOf');
    s = troca(s, "blocks.push({type:'p',text:(tag==='textarea'?node.value:node.textContent).trim()});",
      "blocks.push(Object.assign({type:'p',text:(tag==='textarea'?node.value:node.textContent).trim()},tag!=='textarea'&&node.querySelector('b,strong')?{runs:runsOf(node)}:{}));", 'conversor: parágrafo com negrito');
    s = troca(s, "}else content.push(para(b.text,b.type==='title'?'Title':b.type==='heading'?'Heading1':'Normal'));",
      "}else content.push(b.runs?paraRuns(b.runs):para(b.text,b.type==='title'?'Title':b.type==='heading'?'Heading1':'Normal'));", 'conversor: make');
  }
  try { new Function(s); } catch (e) { throw Error('rec--documentos.js inválido: ' + e.message); }
  if (s === src) return m;
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + DOC_ID);
  return a + novo + z;
});

let feito = false;
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== ID) return m;
  feito = true;
  const src = lz.decompressFromBase64(enc.trim());
  let s = src;
  const i3 = s.indexOf('<script id="prod-pop13-stage3-js">'), i4 = s.indexOf('<script id="prod-pop13-stage4-js">');
  if (i3 < 0 || i4 < 0) throw Error('Produtos: scripts do POP 13 não localizados');
  let s3 = s.slice(i3, i4), s4 = s.slice(i4), antes = s.slice(0, i3);
  /* Anexo III */
  if (!s3.includes('function relDados()')) s3 = entre(s3, 'function docHtml(){', '\n async function saveDoc', ANEXO3, 'Anexo III');
  /* relatório */
  if (!s4.includes(MARCA)) {
    s4 = entre(s4, 'function lineRows(', ' let applying=false', REL, 'relatório');
    s4 = entre(s4, 'function topicEditor(', '\n function modelWarnings', TOPIC, 'editor por tema');
  }
  s4 = troca(s4, "host.innerHTML=reportHtml();", "host.innerHTML=reportHtml(false);", 'documento sem avisos');
  s4 = troca(s4, "'<h3>1. Identificação da empresa</h3><div class=\"pr-grid\">'+field('razao'",
    "'<h3>Cabeçalho</h3><div class=\"pr-grid\">'+field('orgao','Órgão de vigilância sanitária',d.orgao,'text',true,'Ex.: UVIS Vila Prudente/Sapopemba')+field('cidade','Cidade da data do relatório',d.cidade,'text',false,'São Paulo')+'</div><h3>1. Identificação da empresa</h3><div class=\"pr-grid\">'+field('razao'", 'editor: cabeçalho');
  s4 = troca(s4, "+field('entregaData','Data de recebimento',d.entregaData,'date')",
    "+field('termos','Termos e autos entregues',d.termos,'text',true)+field('entregaData','Data de recebimento',d.entregaData,'date')", 'editor: termos');
  s4 = troca(s4, "if(p.modelo==='investigativa'&&p.objetivo!=='investigativa')a.push('O modelo investigativo deve ser usado com objetivo investigativo/fiscalização.');return a}",
    "if(p.modelo==='investigativa'&&p.objetivo!=='investigativa')a.push('O modelo investigativo deve ser usado com objetivo investigativo/fiscalização.');try{const sem=itensRoteiro().filter(x=>x.v==='no'&&!x.nota).length;if(sem)a.push(sem+' resposta(s) Não cumpre sem evidência descrita no roteiro: o relatório traz a evidência em negrito, e ela sairá como “não descrita”.');const d=effective();if(!txt(d.orgao))a.push('Cabeçalho: informe o órgão de vigilância sanitária.');if(!txt(d.inicio))a.push('Item 3: informe o período da inspeção.');if(p.modelo!=='investigativa'&&!txt(d.consideracoes))a.push('Item 18: considerações finais e avaliação de riscos não preenchidas.');if(p.modelo!=='investigativa'&&!(c.conclusao||{}).status)a.push('Item 19: escolha a conclusão no ciclo NC/CAPA.')}catch(e){}return a}", 'pendências');
  s = antes + s3 + s4;
  for (const [nome, ini, fim] of [['stage3', '<script id="prod-pop13-stage3-js">', '</script>'], ['stage4', '<script id="prod-pop13-stage4-js">', '</script>']]) {
    const i = s.indexOf(ini) + ini.length, j = s.indexOf(fim, i);
    try { new Function(s.slice(i, j)); } catch (e) { throw Error('Produtos: JS inválido em ' + nome + ': ' + e.message); }
  }
  if (s === src) return m;
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + ID);
  return a + novo + z;
});
if (!feito) throw Error('Bloco não localizado: ' + ID);
fs.writeFileSync(file, html);
console.log('Produtos: relatórios e Anexo III do POP-O-SNVS-013 rev. 9 no modelo.');
