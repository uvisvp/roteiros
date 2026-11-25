/* Atacadista de medicamentos — licença inicial pelo Formulário XIV.H (trilha “xivh”).
   O mesmo motor do Atacadista, aberto pelo card “Atacadista — licença inicial (Formulário XIV.H)”.
   Fontes:
   - Portaria SMS nº 266/2025, Anexo I (CNAE 4644-3/01) e Anexo IV (Formulário XIV.H, rev. 15:
     item VIII, atividades próprias; item IX, classes de produto); art. 17, § 1º (licença deferida após a
     publicação da AFE); art. 18 (fracionamento: CNAE fabril, salvo insumos farmacêuticos no 4644-3/01).
   - RDC Anvisa nº 16/2014: art. 14 (requisitos verificados na inspeção e registrados no relatório);
     art. 15, I, “c” (o relatório atesta o cumprimento para as atividades e classes pleiteadas);
     art. 15, § 4º (para AE, declaração expressa de cumprimento da Portaria SVS/MS nº 344/1998 e da
     Portaria SVS/MS nº 6/1999); art. 28 (o que a autoridade local avalia: informações gerais e requisitos
     técnicos — existência de instalações, pessoal, procedimentos, programas e sistemas).
   - RDC Anvisa nº 204/2006, item 12.1.3 (fracionadora com laboratório de controle da qualidade próprio).
   - RDC Anvisa nº 887/2024, art. 9º, § 1º (classe gases medicinais distinta na AFE).
   - Portaria SVS/MS nº 344/1998, art. 2º, §§ 6º e 7º (AE para cada estabelecimento).
   Licença inicial: a empresa deve estar pronta para funcionar; o que a RDC 16/2014 (art. 28) cobra é a
   existência do sistema. Todas as perguntas são feitas. As que dependem de operação já realizada
   (XH_REGISTRO) têm o botão “Atividade não iniciada”, a usar só se a empresa ainda não operou; em lote,
   só vão como não aplicáveis licença, AFE, AE e Livro de Registro Específico (XH_PRE). */
const XH_ATIV=[['dist','Distribuir'],['imp','Importar'],['exp','Exportar'],['arm','Armazenar em área própria'],['trp','Transporte próprio'],['frac','Fracionar insumo farmacêutico'],['dep','Armazenar em depósito fechado']];
const XH_CLASSES=[['01','Medicamentos'],['02','Medicamentos sujeitos ao controle especial'],['03','Insumos farmacêuticos'],['15','Insumos farmacêuticos sujeitos ao controle especial'],['20','Gases medicinais']];
/* item IX do Formulário XIV.H: categorias de produto por classe (códigos do formulário) */
const XH_CATS={'01':[['001','Anovulatórios'],['002','Antibióticos'],['242','Antroposóficos'],['115','Cefalosporínicos e penicilínicos'],['243','Outros produtos estéreis'],['176','Penicilínicos'],['008','Oncológicos/citostáticos'],['124','Opoterápicos'],['014','Produtos oficinais'],['244','Radiofármacos'],['145','Soros e vacinas'],['146','Solução parenteral de grande volume (SPGV)'],['011','Fitoterápicos'],['012','Homeopáticos'],['007','Hormônios'],['006','Hemoderivados'],['004','Demais categorias']],
 '02':[['003','Controle especial'],['005','Entorpecentes'],['245','Hormônios'],['009','Psicotrópicos']]};
function xhCat(c){return xh().cat.includes(c)}
const XH_CL=['Cumpre as Boas Práticas','Cumpre as Boas Práticas com Ação Corretiva','Não cumpre as Boas Práticas'];
const XH_NA='Atividade não iniciada (licença inicial): não há registros de operação a verificar.';
/* licença inicial: AFE, AE e licença ainda não existem. A licença é pedida antes da AFE e só é deferida
   depois da publicação da AFE (Portaria SMS nº 266/2025, art. 17, caput e § 1º); a AFE e a AE são
   concedidas pela Anvisa com base no relatório desta inspeção (RDC Anvisa nº 16/2014, art. 15, I, “c”). */
const XH_AUT=['dist-id-licenca','dist-id-afe','dist-id-ae'];
const XH_NA_AUT='Licença inicial: a AFE e a AE são concedidas pela Anvisa com base no relatório desta inspeção (RDC Anvisa nº 16/2014, art. 15, I, “c”), e a licença sanitária só é deferida após a publicação da AFE (Portaria SMS nº 266/2025, art. 17, caput e § 1º).';
/* Livro de Registro Específico (xc-05): as atividades com controlados só começam após a publicação da AE
   (Portaria SVS/MS nº 344/1998, art. 2º, § 4º); os termos de abertura são lavrados pela autoridade
   sanitária (art. 63). */
const XH_NA_LIVRO='Licença inicial: as atividades com substâncias e medicamentos sujeitos a controle especial só podem ser iniciadas após a publicação da Autorização Especial (Portaria SVS/MS nº 344/1998, art. 2º, § 4º); o Livro de Registro Específico, com termos de abertura lavrados pela autoridade sanitária (art. 63), ainda não foi aberto.';
const XH_PRE=XH_AUT.concat('xc-05');
function xhMotivoPre(id){return id==='xc-05'?XH_NA_LIVRO:XH_AUT.includes(id)?XH_NA_AUT:''}
/* Perguntas que dependem de operação já realizada (lotes recebidos, expedições, auditorias feitas,
   análises de lotes, reclamações, inventários). As demais tratam de instalações, pessoal,
   procedimentos, programas, contratos, qualificações e registros que correm sem operação — monitoramento
   de temperatura e umidade, aprovação e cadastro de fornecedores, logbook de equipamentos —, exigidos
   antes de iniciar. */
const XH_REGISTRO=['dist-id-imp-terceiro','q911','q912','q913','q914','q915','q916','q142','q175','q176','q177','q178','q180','q181','q203','q204','q208','q209','q223','expedicao-documento','q255','q256','q257','q268','q272','q274','q280','q324','q331','q335','q336','q338','q344','q345','res-06-xii','q354','q359','q360','q950','q398','q401','q412','q416','ifa-01','ifa-02','ifa-03','ifa-04','ifa-05','ifa-06','ifa-07','ifa-08','ifa-09','ifa-10','ifa-11','ifa-12','ifa-13','ifa-15','ifa-16'];
/* o modo XIV.H vem só do card aberto (trilha); a inspeção em andamento é a mesma dos dois cards,
   como nas trilhas de Produtos, e o aviso xhAvisoTrilha() mostra quando ela foi começada no outro */
function xhOn(){return /(^|[?&])trilha=xivh(&|$)/.test(String(window.__QS||'').replace(/^\?/,''))}
function xhRespondidas(){return Object.values(state.answers||{}).filter(a=>a&&a.status).length}
function xhAvisoTrilha(){
 const m=state.meta||{},x=m.xivh;
 if(!xhOn()){if(x&&x.on&&((x.ativ||[]).length||(x.classes||[]).length))return '<div class="note warning"><b>Inspeção começada no card “Atacadista — licença inicial (Formulário XIV.H)”.</b> Aqui as atividades, classes e módulos do formulário não aparecem. Para continuar, abra por aquele card; para outra inspeção, guarde esta em “Salvas” e comece em branco.</div>';return ''}
 if(x&&x.sobre)return '<div class="note warning"><b>Inspeção começada no card “Atacadista de medicamentos”.</b> As respostas já dadas continuam valendo aqui. Se esta for outra inspeção, guarde a anterior em “Salvas” e comece em branco.</div>';
 return '';
}
function xh(){const m=state.meta;if(!m.xivh)m.xivh={on:true,ativ:[],classes:[],cat:[],inicial:'Sim',sobre:xhRespondidas()>0||!!m.company};const x=m.xivh;x.on=true;x.ativ=x.ativ||[];x.classes=x.classes||[];x.cat=x.cat||[];state.plan=state.plan||{};state.plan.xh=state.plan.xh||{};return x}
function xhTem(c){return xh().classes.includes(c)}
/* combinações possíveis: fracionar só insumos (Portaria SMS 266/2025, art. 18, parágrafo único, I) */
function xhValida(a,c){return a!=='frac'||c==='03'||c==='15'}
function xhSync(){
 if(!xhOn())return;const x=xh(),m=state.meta;
 const map={dist:['Distribuir','Expedir'],imp:['Importar'],exp:['Exportar'],arm:['Armazenar'],dep:['Armazenar'],trp:['Transportar']};
 m.activities=[...new Set(x.ativ.flatMap(a=>map[a]||[]))];
 const f=new Set(m.flags||[]),liga=(k,v)=>{v?f.add(k):f.delete(k)};
 liga('controlados',xhTem('02')||xhTem('15'));liga('insumos',xhTem('03')||xhTem('15'));liga('xh_frac',x.ativ.includes('frac'));liga('xh_gases',xhTem('20'));
 liga('xh_radio',xhCat('244'));liga('xh_bio',xhCat('145')||xhCat('006'));
 m.flags=[...f];
 state.report=state.report||{};if(x.inicial==='Sim'&&!state.report.emAtividade)state.report.emAtividade='Não';
 x.cat=x.cat.filter(c=>Object.entries(XH_CATS).some(([k,l])=>xhTem(k)&&l.some(([v])=>v===c)));
 if(x.inicial==='Sim'){state.distDocs=state.distDocs||{};x.autoDocs=x.autoDocs||{};for(const [k,ce] of [['afe',0],['ae',1]]){const d=state.distDocs[k]=state.distDocs[k]||{},v=ce&&!xhTem('02')&&!xhTem('15')?'Não se aplica':'Não possui';if(!d.status||d.status===x.autoDocs[k]){d.status=v;x.autoDocs[k]=v}}}
 try{xhSecoes();xhCartao8()}catch(e){}
}
function xhPrePendentes(){return DATA.sections.flatMap(s=>s.questions).filter(q=>XH_PRE.includes(q.id)&&!(state.answers[q.id]||{}).status)}
function xhAvisos(){
 const x=xh(),L=[];
 if(x.ativ.includes('frac')&&!xhTem('03')&&!xhTem('15'))L.push('Fracionar só se aplica a insumos farmacêuticos: marque a classe 03 ou 15 (Portaria SMS nº 266/2025, art. 18, parágrafo único, I).');
 if(x.ativ.includes('frac'))L.push('A fracionadora de insumos deve possuir laboratório de controle da qualidade próprio, para análises físico-químicas e microbiológicas (RDC Anvisa nº 204/2006, item 12.1.3).');
 if(xhTem('20'))L.push('Gases medicinais: a AFE deve trazer a classe gases medicinais, distinta da classe de medicamentos (RDC Anvisa nº 887/2024, art. 9º, § 1º).');
 if(xhTem('02')||xhTem('15'))L.push('Controle especial: AE para cada estabelecimento (Portaria SVS/MS nº 344/1998, art. 2º, § 7º); o relatório deve declarar expressamente o cumprimento da Portaria SVS/MS nº 344/1998 e da Portaria SVS/MS nº 6/1999 (RDC Anvisa nº 16/2014, art. 15, § 4º).');
 if(xhCat('244'))L.push('Radiofármacos: o fornecimento só pode ser feito por instituição licenciada pela autoridade sanitária e pela autoridade nuclear (RDC Anvisa nº 430/2020, art. 6º, parágrafo único); a distribuição só começa após os atos de licenciamento da autoridade nuclear, que não incluem o transporte (Guia CNEN de Licenciamento e Controle de Distribuidoras de Radiofármacos, 2021, item 4). A regulação nuclear passou da CNEN à ANSN em agosto de 2025.');
 if((xhCat('145')||xhCat('006'))&&!(state.meta.flags||[]).includes('termolabeis'))L.push('Soros e vacinas ou hemoderivados declarados: se algum tiver temperatura máxima de 8 °C ou menos, é termolábil (RDC Anvisa nº 430/2020, art. 3º, XVI); marque “Trabalha com termolábeis” para abrir as verificações de cadeia de frio.');
 L.push('Fracionar medicamento ou envasar gás medicinal não cabe no CNAE 4644-3/01: são atividades fabris (Portaria SMS nº 266/2025, art. 18; Anexo I, CNAE 2121-1/01 e 2014-2/00).');
 return L;
}
function xhPainel(){
 const x=xh(),chk=(grp,v,l)=>`<label class="check"><input type="checkbox" data-xh="${grp}" value="${esc(v)}" ${x[grp].includes(v)?'checked':''}>${esc(l)}</label>`;
 const pp=x.inicial==='Sim'?xhPrePendentes():[],pend=pp.length,livro=pp.some(q=>q.id==='xc-05');
 const cats=Object.entries(XH_CATS).filter(([k])=>xhTem(k)).map(([k,l])=>'<h4 style="margin-top:10px">Categorias da classe '+k+' (item IX)</h4><div class="checks">'+l.map(([v,t])=>chk('cat',v,v+' – '+t)).join('')+'</div>').join('');
 return xhAvisoTrilha()+'<h4>Formulário XIV.H — atividades e classes declaradas</h4><p class="mini">Marque exatamente o que a empresa declarou nos itens VIII e IX do formulário. O relatório conclui por atividade e classe, porque é o que a Anvisa usa para conceder a AFE e a AE (RDC Anvisa nº 16/2014, art. 15, I, “c”).</p>'
  +'<div class="checks">'+XH_ATIV.map(([v,l])=>chk('ativ',v,l)).join('')+'</div>'
  +'<h4 style="margin-top:10px">Classes de produto</h4><div class="checks">'+XH_CLASSES.map(([v,l])=>chk('classes',v,v+' – '+l)).join('')+'</div>'+cats
  +((xhTem('03')||xhTem('15'))?'<div class="checks" style="margin-top:6px">'+flagCheck('ifa','Entre os insumos há IFA (insumo farmacêutico ativo)')+flagCheck('termolabeis','Trabalha com termolábeis')+'</div>':(xhTem('01')||xhTem('02')?'<div class="checks" style="margin-top:6px">'+flagCheck('termolabeis','Trabalha com termolábeis')+'</div>':''))
  +'<div class="grid three" style="margin-top:10px"><label class="field">Licença inicial (atividades ainda não iniciadas)?<select data-xh="inicial"><option value="">— selecione —</option>'+['Sim','Não'].map(o=>`<option${x.inicial===o?' selected':''}>${o}</option>`).join('')+'</select></label></div>'
  +'<div class="note"><ul>'+xhAvisos().map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul></div>'
  +(x.inicial==='Sim'?'<div class="note"><b>Licença inicial.</b> A empresa deve estar pronta para funcionar: instalações, equipamentos, pessoal, procedimentos, programas, contratos e qualificações são cobrados (RDC Anvisa nº 16/2014, art. 28), assim como o que já corre sem operação — monitoramento de temperatura e umidade, aprovação e cadastro de fornecedores, logbook de equipamentos. Todas as perguntas são feitas. As que dependem de operação já realizada (lotes recebidos, expedições, auditorias feitas, análises de lotes, reclamações, inventários) têm o botão “Atividade não iniciada”: use-o só se a empresa ainda não operou; se já houver produto em estoque ou evidência de operação (nota fiscal, licenciamento de importação), responda normalmente. A licença sanitária, a AFE e a AE ainda não existem: a licença só é deferida após a publicação da AFE (Portaria SMS nº 266/2025, art. 17, § 1º). Com controle especial, o Livro de Registro Específico também não: as atividades só começam após a publicação da AE (Portaria SVS/MS nº 344/1998, art. 2º, § 4º).'+(pend?`<div class="toolbar"><button class="btn" data-xh-na="1">Marcar licença, AFE, AE${livro?' e Livro de Registro Específico':''} como não aplicáveis</button></div>`:'')+'</div>':'');
}
function xhCelulas(){const x=xh();return x.ativ.flatMap(a=>x.classes.filter(c=>xhValida(a,c)).map(c=>a+'|'+c))}
function xhMatriz(){
 const x=xh();state.plan.xh=state.plan.xh||{};
 if(!x.ativ.length||!x.classes.length)return '<div class="panel"><h3>Conclusão por atividade e classe</h3><p class="mini">Marque as atividades e as classes do Formulário XIV.H na etapa 1.</p></div>';
 const nome=Object.fromEntries(XH_ATIV),cab='<tr><th>Atividade</th>'+x.classes.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr>';
 const lin=x.ativ.map(a=>'<tr><td>'+esc(nome[a])+'</td>'+x.classes.map(c=>{if(!xhValida(a,c))return '<td>—</td>';const k=a+'|'+c,v=state.plan.xh[k]||'';return '<td><select data-xh-cel="'+k+'"><option value="">—</option>'+XH_CL.map((o,i)=>`<option value="${esc(o)}"${v===o?' selected':''}>${['Cumpre','Cumpre com ação corretiva','Não cumpre'][i]}</option>`).join('')+'</select></td>'}).join('')+'</tr>').join('');
 return '<div class="panel"><h3>Conclusão por atividade e classe</h3><p class="mini">Cada célula vai para o item 14 do relatório, na linha da classificação escolhida (14.1, 14.3 ou 14.4). Classes: '+XH_CLASSES.filter(([c])=>x.classes.includes(c)).map(([c,l])=>c+' – '+l).join('; ')+'.</p><div style="overflow-x:auto"><table class="dd-tbl"><thead>'+cab+'</thead><tbody>'+lin+'</tbody></table></div></div>';
}
/* item 14: listas por classificação, e a declaração do art. 15, § 4º, da RDC 16/2014 */
function xhConclusao(){
 if(!xhOn())return null;const x=xh(),v=(state.plan&&state.plan.xh)||{},cel=xhCelulas();if(!cel.some(k=>v[k]))return null;
 const nomeA=Object.fromEntries(XH_ATIV),nomeC=Object.fromEntries(XH_CLASSES),out={};
 for(const t of XH_CL)out[t]=x.ativ.map(a=>{const cs=x.classes.filter(c=>xhValida(a,c)&&v[a+'|'+c]===t);return cs.length?nomeA[a]+': '+cs.map(c=>nomeC[c].toLowerCase()).join(', '):''}).filter(Boolean);
 const ce=x.ativ.filter(a=>['02','15'].some(c=>xhValida(a,c)&&x.classes.includes(c)&&/^Cumpre/.test(v[a+'|'+c]||'')));
 out.decl344=ce.length?'O estabelecimento cumpre os requisitos de controle especial da Portaria SVS/MS nº 344/1998 e da Portaria SVS/MS nº 6/1999 para as atividades: '+ce.map(a=>nomeA[a].toLowerCase()).join(', ')+' (RDC Anvisa nº 16/2014, art. 15, § 4º).':'';
 out.inicial=x.inicial==='Sim'?'Licença inicial: foram verificados instalações, equipamentos, pessoal, procedimentos, programas, contratos e qualificações exigidos para iniciar as atividades (RDC Anvisa nº 16/2014, art. 28); não havia operação até a data da inspeção. A AFE e a AE serão requeridas à Anvisa com base neste relatório (RDC Anvisa nº 16/2014, art. 15, I, “c”), e a licença sanitária só será deferida após a publicação da AFE (Portaria SMS nº 266/2025, art. 17, § 1º).':'';
 const cs=Object.entries(XH_CATS).flatMap(([k,l])=>l.filter(([v])=>xhCat(v)).map(([v,t])=>v+' – '+t.toLowerCase()));
 out.categorias=cs.length?'Categorias de produto declaradas no Formulário XIV.H, item IX: '+cs.join('; ')+'.':'';
 return out;
}
function xhPendencias(){
 if(!xhOn())return [];const x=xh(),out=[],v=(state.plan&&state.plan.xh)||{};
 if(!x.ativ.length)out.push('Formulário XIV.H: marque as atividades declaradas (etapa 1).');
 if(!x.classes.length)out.push('Formulário XIV.H: marque as classes de produto declaradas (etapa 1).');
 for(const k of ['01','02'])if(xhTem(k)&&!XH_CATS[k].some(([v])=>xhCat(v)))out.push('Formulário XIV.H: marque as categorias da classe '+k+' declaradas no item IX (etapa 1).');
 const vaz=xhCelulas().filter(k=>!v[k]);if(vaz.length)out.push('Item 14: falta a conclusão de '+vaz.length+' combinação(ões) de atividade e classe (aba Análise do plano de ação).');
 if(x.inicial==='Sim')for(const q of DATA.sections.flatMap(s=>s.questions)){const a=state.answers[q.id]||{};const ev=String(a.evidence||''),mp=[XH_NA_AUT,XH_NA_LIVRO].find(t=>ev.startsWith(t));if(a.status==='NA'&&(ev.startsWith(XH_NA)&&!XH_REGISTRO.includes(q.id)||mp&&mp!==xhMotivoPre(q.id)))out.push(q.id+': “atividade não iniciada” só vale para perguntas de registro de operação; esta trata de requisito exigido antes de iniciar (RDC Anvisa nº 16/2014, art. 28).')}
 return out;
}
function xhPendurar(){
 if(typeof distTela1View==='function'&&!distTela1View.__xh){const o=distTela1View;distTela1View=function(){if(!xhOn()){const h=o.apply(this,arguments),av=xhAvisoTrilha();return av?h.replace('<h4>Atividades</h4>',()=>av+'<h4>Atividades</h4>'):h}xhSync();const h=o.apply(this,arguments);const r=/<h4>Atividades<\/h4><div class="checks">[\s\S]*?<\/div>/;return r.test(h)?h.replace(r,()=>xhPainel()):h.replace('<h4>Equipe inspetora',()=>xhPainel()+'<h4>Equipe inspetora')};Object.assign(distTela1View,o,{__xh:1})}
 if(typeof questionHtml==='function'&&!questionHtml.__xh){const o=questionHtml;questionHtml=function(q){const h=o.apply(this,arguments);if(!q||!xhOn()||xh().inicial!=='Sim'||!XH_REGISTRO.includes(q.id))return h;return h.replace('<div class="toolbar"><button class="btn" data-dist-read=',()=>'<div class="toolbar"><button class="btn" data-xh-nai="'+q.id+'" title="Só se a empresa ainda não operou">Atividade não iniciada</button><button class="btn" data-dist-read=')};Object.assign(questionHtml,o,{__xh:1})}
 /* as NCs dos blocos do XIV.H entram no Anexo II (allNCs); o aviso “sem correspondência no inventário” não vale para elas */
 if(typeof distGeraNC==='function'&&!distGeraNC.__xh){const o=distGeraNC;distGeraNC=function(q){if(o.apply(this,arguments))return true;try{return DATA.sections.some(s=>s.__xh&&(s.questions||[]).includes(q))}catch(e){return false}};Object.assign(distGeraNC,o,{__xh:1})}
 if(typeof planView==='function'&&!planView.__xh){const o=planView;planView=function(){const h=o.apply(this,arguments);return xhOn()?h+xhMatriz():h};Object.assign(planView,o,{__xh:1})}
 if(typeof distIssues==='function'&&!distIssues.__xh){const o=distIssues;distIssues=function(){const r=o.apply(this,arguments);return xhOn()?r.concat(xhPendencias()):r};Object.assign(distIssues,o,{__xh:1})}
 if(typeof ddAnexoIPendencias==='function'&&!ddAnexoIPendencias.__xh){const o=ddAnexoIPendencias;ddAnexoIPendencias=function(){let r=o.apply(this,arguments);if(!xhOn())return r;if(xhConclusao())r=r.filter(t=>!/classificação final não definida/.test(t));return r.concat(xhPendencias())};Object.assign(ddAnexoIPendencias,o,{__xh:1})}
 if(!window.__xhEventos){window.__xhEventos=1;
  document.addEventListener('change',e=>{const t=e.target;if(!t||!t.dataset)return;
   if(t.dataset.xh){const x=xh(),g=t.dataset.xh;if(g==='inicial')x.inicial=t.value;else{let a=x[g]||[];a=t.checked?[...new Set(a.concat(t.value))]:a.filter(v=>v!==t.value);x[g]=a}xhSync();save();try{renderITab()}catch(_){}}
   else if(t.dataset.xhCel){state.plan.xh=state.plan.xh||{};state.plan.xh[t.dataset.xhCel]=t.value;save()}},true);
  document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-xh-na]');if(!b)return;e.preventDefault();for(const q of xhPrePendentes())state.answers[q.id]={status:'NA',evidence:xhMotivoPre(q.id)};save();try{renderITab()}catch(_){}},true);
  document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-xh-nai]');if(!b)return;e.preventDefault();const id=b.dataset.xhNai,a=state.answers[id]||{},ev=String(a.evidence||'').trim();state.answers[id]=Object.assign({},a,{status:'NA',evidence:ev.startsWith(XH_NA)?ev:(XH_NA+(ev?' '+ev:''))});save();try{renderITab()}catch(_){}},true)}
}
/* ---------- Módulo de insumos, importação de insumos, fracionamento e laboratório ----------
   Textos conferidos no AnvisaLegis: RDC 204/2006 (vigente com alterações; regulamento técnico anexo),
   IN 62/2020, RDC 637/2022 (vigente) e RDC 81/2008 (vigente com alterações). Cada pergunta cita o item.
   [id, pergunta, citação, frase da não conformidade, registro de operação?] */
const XH_R='RDC Anvisa nº 204/2006, Anexo, ',XH_IN='Instrução Normativa nº 62/2020, ',XH_81='RDC Anvisa nº 81/2008, ',XH_637='RDC Anvisa nº 637/2022, ';
const XH_SECOES=[
 {id:'xh-ins-geral',item:'11',title:'Insumos farmacêuticos — unidade da qualidade, mudanças, reprovação e recolhimento',quando:'ins',q:[
  ['xi-01','Existe Unidade da Qualidade responsável por assegurar que os insumos estejam dentro dos padrões de qualidade, independente do fracionamento?',XH_R+'item 2.1.4','Não existe Unidade da Qualidade responsável por assegurar a qualidade dos insumos farmacêuticos'],
  ['xi-02','As responsabilidades da Unidade da Qualidade — liberar ou rejeitar insumos, aprovar procedimentos e especificações, gerenciar amostras de retenção, aprovar mudanças, treinamento, calibração e manutenção — estão definidas e documentadas, sem delegação?',XH_R+'item 2.2.2.2','As responsabilidades da Unidade da Qualidade não estão definidas e documentadas'],
  ['xi-03','Somente funcionários definidos e autorizados pela Unidade da Qualidade podem liberar insumos farmacêuticos?',XH_R+'item 2.1.6','Não está definido que somente funcionários autorizados pela Unidade da Qualidade liberam os insumos farmacêuticos'],
  ['xi-04','Há procedimento para a revisão anual da qualidade dos insumos, abrangendo lotes fora de especificação, desvios, mudanças, devoluções, reclamações, recolhimentos e ações corretivas?',XH_R+'item 2.3','Não há procedimento para a revisão anual da qualidade dos insumos farmacêuticos'],
  ['xi-05','O programa escrito de treinamento abrange as boas práticas de distribuição e fracionamento de insumos, com treinamento específico para quem manuseia insumos altamente ativos, tóxicos, infecciosos ou altamente sensibilizantes?',XH_R+'itens 3.2.1 e 3.2.4','O programa de treinamento não abrange as boas práticas de distribuição e fracionamento de insumos farmacêuticos'],
  ['xi-06','Há sistema de controle de mudanças, com aprovação pela Unidade da Qualidade de toda mudança que possa afetar o fracionamento e o controle dos insumos?',XH_R+'itens 14.1 e 14.1.1','Não há sistema de controle de mudanças com aprovação pela Unidade da Qualidade'],
  ['xi-07','Há procedimento escrito para identificar, segregar e destinar — destruição ou devolução ao fornecedor — os insumos e materiais reprovados?',XH_R+'item 15.1','Não há procedimento escrito para identificar, segregar e destinar os insumos e materiais reprovados'],
  ['xi-08','Há procedimento para comunicar às autoridades sanitárias o desvio de qualidade comprovado de lote de insumo, com o mapa de distribuição e o plano de recolhimento?',XH_R+'itens 15.2 e 16.9','Não há procedimento para comunicar às autoridades sanitárias o desvio de qualidade comprovado de lote de insumo'],
  ['xi-09','O procedimento de recolhimento define as situações em que o insumo deve ser recolhido e designa o responsável pela coordenação do recolhimento?',XH_R+'itens 16.5 e 16.6','O procedimento de recolhimento não define as situações de recolhimento nem designa o responsável pela coordenação'],
  ['xi-10','Há procedimento escrito para recebimento, armazenamento e investigação das causas de devolução, com retorno à venda só após análise e liberação pela Unidade da Qualidade?',XH_R+'itens 16.11 e 16.13','Não há procedimento escrito para o recebimento, a investigação e a liberação dos insumos devolvidos'],
  ['xi-11','O período de retenção dos documentos e registros das operações com insumos está estabelecido em procedimento, com arquivo de no mínimo 1 ano após o vencimento da validade do lote?',XH_R+'itens 6.2.8 e 6.2.9','O período de retenção dos documentos e registros das operações com insumos farmacêuticos não está estabelecido conforme a norma'],
  ['xi-12','Há procedimento para cadastrar na Anvisa todos os insumos farmacêuticos ativos com que a empresa trabalha, com todos os fabricantes e, quando não adquiridos diretamente do fabricante, os revendedores ou distribuidores?',XH_637+'art. 1º; '+XH_637+'art. 3º','Não há procedimento para o cadastro, na Anvisa, dos insumos farmacêuticos ativos com que a empresa trabalha'],
  ['xi-13','Os insumos farmacêuticos ativos com que a empresa trabalha estão cadastrados na Anvisa, com fabricantes e revendedores?',XH_637+'art. 1º; '+XH_637+'art. 3º','Os insumos farmacêuticos ativos com que a empresa trabalha não estão cadastrados na Anvisa',1]]},
 {id:'xh-ins-receb',item:'9.1',title:'Insumos farmacêuticos — recebimento, quarentena e amostragem',quando:'ins',q:[
  ['xr-01','Há procedimentos escritos para recebimento, identificação, armazenamento, quarentena, amostragem, testes, aprovação, reprovação, liberação, descarte e manuseio de materiais?',XH_R+'item 7.1.1','Não há procedimentos escritos para o controle de materiais, do recebimento à liberação'],
  ['xr-02','O procedimento de inspeção de recebimento prevê, lote a lote e com registro, a verificação da integridade da embalagem, das informações de identificação e da correspondência entre o pedido e o documento de entrada?',XH_R+'item 7.3.1','O procedimento de inspeção de recebimento não prevê as verificações exigidas'],
  ['xr-03','Há área de quarentena restrita, separada e demarcada — ou sistema que ofereça a mesma segurança —, onde os insumos ficam até a aprovação?',XH_R+'itens 4.2.6 e 7.3.2','Não há área de quarentena restrita, separada e demarcada, nem sistema equivalente'],
  ['xr-04','A área de recebimento protege os materiais das variações climáticas e permite limpar os recipientes antes da estocagem?',XH_R+'itens 4.2.3 e 4.2.4','A área de recebimento não protege os materiais das variações climáticas ou não permite limpar os recipientes antes da estocagem'],
  ['xr-05','Há plano de amostragem escrito, referenciado em metodologia científica, e local adequado para a amostragem?',XH_R+'itens 7.4.3 e 4.5.1','Não há plano de amostragem escrito ou local adequado para a amostragem'],
  ['xr-06','A área de amostragem, quando separada do fracionamento, tem exaustão independente e antecâmaras, e há sala dedicada e segregada para amostrar insumos altamente ativos, antibióticos, hormônios, citotóxicos e altamente sensibilizantes?',XH_R+'itens 4.5.2, 4.5.2.1 e 4.5.3','A área de amostragem não atende aos requisitos de exaustão, antecâmara e segregação'],
  ['xr-07','Cada lote recebido está acompanhado do certificado de análise do fabricante — e do fornecedor, quando houver —, arquivado até 1 ano após o término da validade?',XH_R+'item 7.3.10','Lotes recebidos sem o certificado de análise do fabricante, ou sem o arquivo exigido',1],
  ['xr-08','Os insumos recebidos trazem no rótulo os dados do fabricante e do fornecedor, o nome e o código DCB, DCI ou CAS, os lotes, as datas de fabricação e validade, a quantidade, as condições de armazenamento e as advertências?',XH_R+'item 7.3.8','Insumos recebidos sem as informações exigidas no rótulo',1]]},
 {id:'xh-ins-arm',item:'9.2',title:'Insumos farmacêuticos — armazenamento',quando:'ins',q:[
  ['xa-01','As áreas de armazenamento comportam o estoque ordenado dos insumos e materiais de embalagem nas condições de quarentena, aprovado, reprovado, devolvido e recolhido?',XH_R+'item 4.2.1','As áreas de armazenamento não comportam o estoque ordenado nas condições exigidas'],
  ['xa-02','A temperatura e a umidade das áreas de armazenamento são compatíveis com os insumos e são monitoradas, registradas e, quando necessário, controladas?',XH_R+'item 4.2.2','A temperatura e a umidade das áreas de armazenamento não são monitoradas, registradas ou controladas'],
  ['xa-03','Devolvidos, reprovados e recolhidos ficam em área segregada e identificada?',XH_R+'item 4.2.8','Não há área segregada e identificada para devolvidos, reprovados e recolhidos'],
  ['xa-04','Inflamáveis, explosivos e outras substâncias perigosas ficam em área segura, protegida, segregada e identificada?',XH_R+'item 4.2.9','Inflamáveis, explosivos ou substâncias perigosas não ficam em área segura, segregada e identificada'],
  ['xa-05','Os materiais impressos ficam em local seguro, com acesso restrito?',XH_R+'itens 4.2.11 e 9.9','Os materiais impressos não ficam em local seguro, com acesso restrito'],
  ['xa-06','Os materiais de limpeza ficam em área ou local diferente do reservado aos insumos?',XH_R+'item 7.5.6','Os materiais de limpeza ficam no mesmo local dos insumos farmacêuticos'],
  ['xa-07','Cada insumo está identificado individualmente quanto à sua situação — quarentena, aprovado, reprovado, devolvido ou recolhido?',XH_R+'item 4.2.7','Insumos sem identificação individual da situação',1],
  ['xa-08','Os insumos estão armazenados afastados do piso e das paredes, em locais identificados e com rotatividade “primeiro que expira, primeiro que sai”?',XH_R+'itens 7.5.3, 7.5.4 e 7.5.8','Insumos armazenados sem afastamento do piso e das paredes, sem localização identificada ou sem a rotatividade exigida',1]]},
 {id:'xh-ins-exp',item:'9.3',title:'Insumos farmacêuticos — expedição, rótulo, certificado e transporte',quando:'ins',q:[
  ['xe-01','O procedimento garante que os insumos só sejam expedidos após a liberação pela Unidade da Qualidade e com a conferência dos dados de expedição frente à identificação dos insumos?',XH_R+'itens 10.4 e 10.6','O procedimento não garante a expedição só após a liberação pela Unidade da Qualidade e com conferência dos dados'],
  ['xe-02','Há sistema de rastreabilidade que permita identificar e localizar prontamente cada lote expedido, para recolhimento?',XH_R+'item 10.5','Não há sistema de rastreabilidade de cada lote de insumo expedido'],
  ['xe-03','O modelo de rótulo de expedição traz nome e código DCB, DCI ou CAS, validade e fabricação, quantidade, condições de armazenamento, advertências, fabricante e país de origem, procedência, dados do distribuidor, responsável técnico e os lotes do fabricante e da empresa?',XH_R+'item 10.1.1','O modelo de rótulo de expedição não traz as informações exigidas'],
  ['xe-04','O modelo de certificado de análise traz insumo e código DCB, DCI ou CAS, lotes do fabricante e da empresa, ordem de fracionamento quando houver, fabricação, validade, testes com limites, resultados e métodos, data de emissão e assinatura da Unidade da Qualidade; sem fracionamento nem análise, fornece-se o certificado do fabricante?',XH_R+'itens 12.3.3 e 12.3.1.1','O modelo de certificado de análise não traz as informações exigidas'],
  ['xe-05','Há programa de qualificação de transportadores e, no transporte por terceiros, contrato que estabeleça as condições de transporte dos insumos?',XH_R+'itens 11.4 e 11.5','Não há programa de qualificação de transportadores ou contrato com as condições de transporte'],
  ['xe-06','Há procedimento para conferir e avaliar, com registro, se as condições do veículo atendem às especificações de transporte dos insumos?',XH_R+'item 11.7','Não há procedimento para conferir as condições do veículo antes do transporte dos insumos'],
  ['xe-07','Os insumos não fracionados são expedidos com os rótulos e as embalagens originais?',XH_R+'item 10.1','Insumos não fracionados expedidos sem os rótulos e as embalagens originais',1]]},
 {id:'xh-ins-imp',item:'12.2',title:'Importação de insumos farmacêuticos',quando:'imp',q:[
  ['xm-01','A AFE traz a atividade de importar insumos farmacêuticos?',XH_81+'Capítulo IV, item 2.1','A empresa não possui AFE com a atividade de importar insumos farmacêuticos'],
  ['xm-02','Há laboratório próprio, ou contrato firmado com laboratório terceiro qualificado, para analisar todos os IFA importados por compêndio oficial reconhecido pela Anvisa ou pela especificação do fabricante?',XH_IN+'art. 4º, § 8º','Não há laboratório próprio nem contrato com laboratório terceiro para analisar todos os IFA importados'],
  ['xm-03','Há área adequada, sob responsabilidade da Unidade da Qualidade, para a amostra de referência de cada lote de IFA importado, nas condições de armazenamento do fabricante?',XH_IN+'art. 4º, § 9º','Não há área adequada, sob a Unidade da Qualidade, para as amostras de referência dos IFA importados'],
  ['xm-04','Há programa de auditoria de fabricantes e distribuidores de IFA, baseado em risco, com auditoria antes da aprovação do fornecedor, feita pela empresa ou por entidade contratada?',XH_IN+'art. 4º, § 3º','Não há programa de auditoria de fabricantes e distribuidores de IFA'],
  ['xm-05','O procedimento de importação prevê a petição de fiscalização e liberação sanitária e a correspondência das informações peticionadas com o produto inspecionado?',XH_81+'Capítulo II, item 1.2','O procedimento de importação não prevê a petição de fiscalização e liberação sanitária'],
  ['xm-06','O procedimento impede importar insumo destinado a medicamento cuja eficácia terapêutica ainda não foi avaliada pela Anvisa?',XH_81+'Capítulo V, item 5','O procedimento não impede a importação de insumo destinado a medicamento sem eficácia avaliada pela Anvisa'],
  ['xm-07','Quando terceirizados, o transporte e a armazenagem dos insumos importados são feitos por empresas com AFE, AE e licença sanitária para a atividade e a classe?',XH_81+'Capítulo XXXI, itens 5 e 9','O transporte ou a armazenagem dos insumos importados é feito por empresa sem AFE, AE ou licença para a atividade e a classe']]},
 {id:'xh-frac-area',item:'9.2',title:'Fracionamento de insumos — áreas',quando:'frac',q:[
  ['xf-01','Há salas separadas para fracionar insumos sólidos, semissólidos e líquidos, com acesso de materiais e de pessoal por antecâmaras independentes?',XH_R+'itens 4.3.1 e 4.3.1.1','Não há salas separadas, com antecâmaras independentes, para o fracionamento de sólidos, semissólidos e líquidos'],
  ['xf-02','As salas de fracionamento têm iluminação, ventilação, exaustão, temperatura e umidade adequadas, monitoradas durante o fracionamento e em repouso?',XH_R+'item 4.3.4','As salas de fracionamento não têm iluminação, ventilação, exaustão, temperatura e umidade adequadas e monitoradas'],
  ['xf-03','As superfícies das salas de fracionamento são lisas, impermeáveis, laváveis, resistentes, sem rachaduras e não liberam partículas?',XH_R+'item 4.3.6','As superfícies das salas de fracionamento não atendem aos requisitos'],
  ['xf-04','As salas de fracionamento não têm ralos?',XH_R+'item 4.3.9','Há ralo em sala de fracionamento'],
  ['xf-05','Há capela com exaustão adequada para fracionar substâncias cáusticas, ácidas e irritantes?',XH_R+'item 4.3.5','Não há capela com exaustão para o fracionamento de substâncias cáusticas, ácidas e irritantes'],
  ['xf-06','Insumos altamente ativos, antibióticos, hormônios, citotóxicos e altamente sensibilizantes são fracionados em salas dedicadas e segregadas, com sistema de ar completamente independente?',XH_R+'item 4.3.11','Não há salas dedicadas, com sistema de ar independente, para fracionar insumos altamente ativos, antibióticos, hormônios, citotóxicos e altamente sensibilizantes'],
  ['xf-07','Materiais não farmacêuticos não são fracionados nas mesmas salas e equipamentos usados para os insumos farmacêuticos?',XH_R+'item 4.3.14','Materiais não farmacêuticos são fracionados nas mesmas salas ou equipamentos dos insumos farmacêuticos'],
  ['xf-08','Há local específico para lavar os utensílios do fracionamento e da amostragem?',XH_R+'item 4.6.4','Não há local específico para a lavagem dos utensílios do fracionamento e da amostragem'],
  ['xf-09','As áreas de armazenamento dos insumos fracionados são identificadas e segregadas?',XH_R+'item 4.2.5','As áreas de armazenamento dos insumos fracionados não são identificadas e segregadas'],
  ['xf-10','O acesso às salas de fracionamento é restrito a pessoas autorizadas?',XH_R+'item 8.20','O acesso às salas de fracionamento não é restrito a pessoas autorizadas']]},
 {id:'xh-frac-op',item:'9.2',title:'Fracionamento de insumos — operação, embalagem e rotulagem',quando:'frac',q:[
  ['xo-01','Há procedimentos escritos de fracionamento e de prevenção de contaminação, e o pessoal que fraciona é qualificado e treinado?',XH_R+'itens 8.1 e 8.3','Não há procedimentos escritos de fracionamento e de prevenção de contaminação, ou o pessoal não é qualificado e treinado'],
  ['xo-02','O modelo de ordem de fracionamento traz insumo, quantidades a fracionar e fracionada, data, início e término, validade, código do fracionamento, fracionador, conferente, reconciliação dos impressos, lote original, temperatura e umidade, amostragem, rótulo, ocorrências e sala?',XH_R+'item 6.5.3','O modelo de ordem de fracionamento não traz as informações exigidas'],
  ['xo-03','A emissão da ordem de fracionamento é autorizada pela Unidade da Qualidade?',XH_R+'item 2.2.2.2','A emissão da ordem de fracionamento não é autorizada pela Unidade da Qualidade'],
  ['xo-04','As embalagens primárias dos insumos fracionados têm a mesma especificação da embalagem do fabricante, ou a indicada por ele, e não são reutilizadas?',XH_R+'itens 9.3 e 8.16','As embalagens primárias dos fracionados não têm a especificação do fabricante, ou são reutilizadas'],
  ['xo-05','O modelo de rótulo do insumo fracionado traz nome e código DCB, DCI ou CAS, validade e fabricação, data de fracionamento, quantidade, condições de armazenamento, advertências, fabricante e país de origem, procedência, dados do fracionador, responsável técnico, número da ordem de fracionamento e os lotes do fabricante e da empresa?',XH_R+'item 9.6','O modelo de rótulo do insumo fracionado não traz as informações exigidas'],
  ['xo-06','Há sistema de controle e conferência de rótulos e procedimento de reconciliação entre os rótulos emitidos, usados e inutilizados?',XH_R+'itens 9.5 e 9.14','Não há sistema de controle de rótulos ou procedimento de reconciliação'],
  ['xo-07','Há procedimentos de limpeza e sanitização de equipamentos e utensílios, com critérios de aceitação para resíduos e identificação da condição de limpeza?',XH_R+'itens 5.2.4, 5.2.7 e 5.2.8','Não há procedimentos de limpeza e sanitização de equipamentos, com critérios de aceitação e identificação da condição de limpeza'],
  ['xo-08','Balanças e instrumentos de pesagem e medida são calibrados com padrões rastreáveis, verificados antes do uso e trazem etiqueta da última calibração?',XH_R+'itens 5.3.1, 5.3.2.1 e 5.3.3','Balanças e instrumentos de pesagem e medida não estão calibrados, verificados ou identificados com a última calibração'],
  ['xo-09','O fracionamento é conduzido conforme a ordem de fracionamento, com registro das operações, dos controles, das condições ambientais e das ocorrências?',XH_R+'itens 8.4, 8.5 e 8.8','O fracionamento não é conduzido e registrado conforme a ordem de fracionamento',1],
  ['xo-10','Os insumos fracionados são analisados após cada fracionamento e só comercializados após a liberação pela Unidade da Qualidade?',XH_R+'item 8.18','Insumos fracionados comercializados sem análise após o fracionamento ou sem liberação pela Unidade da Qualidade',1]]},
 {id:'xh-frac-val',item:'11',title:'Fracionamento de insumos — validação e qualificação',quando:'frac',q:[
  ['xv-01','Há plano mestre de validação com objetivo, operações críticas, responsabilidades, cronograma, critérios de revalidação e relação de equipamentos e instalações a qualificar?',XH_R+'item 13.3.1.1','Não há plano mestre de validação com os tópicos exigidos'],
  ['xv-02','As áreas de fracionamento, os sistemas de ar e os equipamentos foram qualificados?',XH_R+'item 13.1','As áreas de fracionamento, os sistemas de ar ou os equipamentos não foram qualificados'],
  ['xv-03','Há protocolo de validação de limpeza aprovado pela Unidade da Qualidade, com equipamentos, agentes, limites residuais, critérios de aceitação, amostragem, métodos validados e no mínimo três ciclos consecutivos?',XH_R+'itens 13.3.2.1 e 13.6.3','Não há protocolo de validação de limpeza aprovado, com os elementos exigidos'],
  ['xv-04','Há protocolo aprovado para validar o fracionamento dos insumos críticos — higroscópicos, termolábeis e fotossensíveis — em função do tempo de exposição ao ambiente?',XH_R+'itens 13.1 e 13.3.2.1','Não há protocolo aprovado para a validação do fracionamento dos insumos críticos'],
  ['xv-05','Os relatórios de validação de limpeza e do fracionamento referenciam o protocolo e trazem resultados, desvios, conclusões e recomendações?',XH_R+'item 13.3.3.1','Não há relatórios de validação de limpeza e do fracionamento com os elementos exigidos',1]]},
 {id:'xh-lab-inst',item:'12.1',title:'Laboratório de controle da qualidade de insumos — instalações',quando:'frac',q:[
  ['xl-01','A empresa possui laboratório de controle da qualidade próprio, capacitado para análises físico-químicas e microbiológicas?',XH_R+'item 12.1.3','A fracionadora não possui laboratório de controle da qualidade próprio e capacitado para análises físico-químicas e microbiológicas'],
  ['xl-02','Os laboratórios físico-químico e microbiológico ficam em salas separadas, com instalações independentes, separadas das demais áreas operacionais?',XH_R+'itens 12.1.5 e 4.4.4','Os laboratórios físico-químico e microbiológico não ficam em salas separadas, com instalações independentes'],
  ['xl-03','Há salas separadas para proteger instrumentos de interferências elétricas, vibração, umidade e outros fatores externos, quando necessário?',XH_R+'item 4.4.3','Não há salas separadas para proteger os instrumentos que exigem essa proteção'],
  ['xl-04','Há água apropriada para as análises do laboratório?',XH_R+'item 12.1.12','Não há água apropriada para as análises do laboratório'],
  ['xl-05','Há área adequada, sob guarda do Controle da Qualidade, para a amostra de referência do insumo fracionado, nas condições do fabricante?',XH_R+'item 4.4.5','Não há área adequada, sob o Controle da Qualidade, para as amostras de referência dos fracionados']]},
 {id:'xh-lab-ativ',item:'12.2',title:'Laboratório de controle da qualidade de insumos — atividades',quando:'frac',q:[
  ['xl-06','Estão disponíveis no laboratório especificações, métodos de análise, farmacopeias, procedimentos de amostragem, padrões de referência e manuais dos equipamentos?',XH_R+'itens 12.1.2 e 12.1.8','Não estão disponíveis no laboratório as especificações, os métodos e os demais documentos exigidos'],
  ['xl-07','Os métodos não farmacopeicos estão validados e, nos transferidos do fabricante, os parâmetros previstos foram avaliados?',XH_R+'itens 13.5.3 e 13.5.4','Métodos não farmacopeicos sem validação, ou transferidos do fabricante sem avaliação dos parâmetros'],
  ['xl-08','Os instrumentos do laboratório são calibrados em intervalos definidos e os ensaios seguem procedimentos escritos, com pessoal qualificado e treinado?',XH_R+'item 12.1.6','Os instrumentos não são calibrados em intervalos definidos, ou os ensaios não seguem procedimentos escritos com pessoal qualificado'],
  ['xl-09','Os padrões primários têm origem documentada e são mantidos nas condições do fabricante, e os secundários são preparados, analisados, aprovados e armazenados corretamente?',XH_R+'itens 12.1.10 e 12.1.11','Os padrões de referência não têm origem documentada ou não são preparados e mantidos corretamente'],
  ['xl-10','Reagentes e soluções padrão são preparados e identificados conforme procedimento escrito, com validade de uso definida?',XH_R+'item 12.1.9','Reagentes e soluções padrão não são preparados e identificados conforme procedimento, com validade definida'],
  ['xl-11','O procedimento prevê a análise do insumo destinado ao fracionamento no recebimento e, após cada fracionamento, as análises definidas pela Unidade da Qualidade?',XH_R+'itens 12.2.1.1 e 12.2.1.2','O procedimento não prevê as análises no recebimento e após cada fracionamento'],
  ['xl-12','Há procedimento de investigação de resultados fora de especificação?',XH_R+'item 2.2.3.1','Não há procedimento de investigação de resultados fora de especificação'],
  ['xl-13','As amostras de retenção têm rótulo rastreável, quantidade de pelo menos o dobro da necessária para as análises e são guardadas até 12 meses após a validade?',XH_R+'itens 12.1.7, 12.1.7.1 e 12.1.7.2','Amostras de retenção sem rótulo rastreável, em quantidade insuficiente ou guardadas por prazo menor que o exigido',1]]}
];
/* Controle especial (classes 02 e 15): Portaria SVS/MS nº 344/1998 e Portaria SVS/MS nº 6/1999.
   Na licença inicial, a AE vem depois da inspeção (Portaria 344/1998, art. 2º, §§ 2º a 4º): cobra-se
   a estrutura de guarda, o livro aberto e os procedimentos; a movimentação é registro de operação. */
const XH_344='Portaria SVS/MS nº 344/1998, ',XH_6='Portaria SVS/MS nº 6/1999, ';
XH_SECOES.push({id:'xh-ce',item:'11.9',title:'Substâncias e medicamentos sujeitos a controle especial — Portaria SVS/MS nº 344/1998',quando:'ce',q:[
 ['xc-01','Não há estoque nem movimentação de substâncias ou medicamentos sujeitos a controle especial antes da publicação da Autorização Especial no Diário Oficial da União?',XH_344+'art. 2º, § 4º','Há estoque ou movimentação de substâncias ou medicamentos sujeitos a controle especial antes da publicação da Autorização Especial'],
 ['xc-02','Há local exclusivo, sob chave ou outro dispositivo de segurança e sob responsabilidade do farmacêutico, para guardar as substâncias e os medicamentos sujeitos a controle especial?',XH_344+'art. 67','Não há local exclusivo, sob chave ou dispositivo de segurança, para a guarda das substâncias e dos medicamentos sujeitos a controle especial'],
 ['xc-03','A área de controlados é separada, identificada e de acesso restrito?','RDC Anvisa nº 16/2014, art. 28, II, “f”','A área de armazenamento dos produtos sujeitos a controle especial não é separada, identificada e de acesso restrito'],
 ['xc-04','Para insumos sujeitos a controle especial, o armário ou a área fechada também guarda as amostras de referência e os devolvidos, reprovados ou recolhidos?',XH_R+'item 4.2.10','O local fechado para insumos sujeitos a controle especial não abrange as amostras de referência e os devolvidos, reprovados ou recolhidos',0,'c15'],
 ['xc-05','O Livro de Registro Específico está disponível, com os termos de abertura lavrados pela autoridade sanitária?',XH_344+'art. 62, § 1º; '+XH_344+'art. 63','Não há Livro de Registro Específico com os termos de abertura lavrados pela autoridade sanitária'],
 ['xc-06','Há procedimento para o Balanço de Substâncias Psicoativas e Outras Substâncias Sujeitas a Controle Especial (BSPO), trimestral e anual, incluindo a lista D1, a cargo do farmacêutico responsável?',XH_344+'art. 68','Não há procedimento para o BSPO trimestral e anual'],
 ['xc-07','Há procedimento para a Relação Mensal de Vendas de Medicamentos Sujeitos a Controle Especial (RMV), enviada até o dia 15 pelo farmacêutico responsável?',XH_344+'art. 71','Não há procedimento para a RMV mensal',0,'c02'],
 ['xc-08','O transporte é feito com documento hábil e, quando terceirizado, por transportadora autorizada e licenciada?',XH_344+'art. 33; '+XH_6+'art. 62','O transporte de produtos sujeitos a controle especial não é feito com documento hábil ou por transportadora autorizada e licenciada'],
 ['xc-09','As entradas, as saídas e as perdas estão escrituradas em ordem cronológica no Livro de Registro Específico?',XH_344+'art. 65','A movimentação de produtos sujeitos a controle especial não está escriturada no Livro de Registro Específico',1],
 ['xc-10','Os livros, balanços e documentos de movimentação são arquivados no estabelecimento por 2 anos?',XH_344+'art. 64','Livros, balanços ou documentos de movimentação de controlados não arquivados por 2 anos',1]]});
/* ---------- Categorias do item IX com requisitos próprios ----------
   Radiofármacos (244): RDC 430/2020, arts. 6º, parágrafo único, e 71, e o Guia CNEN de Licenciamento e
   Controle de Distribuidoras de Radiofármacos, versão 1.0 (set./2021), que lista o que a autoridade
   nuclear exige (Normas CNEN NN 3.01, 5.01, 6.02, 7.01 e 8.01). A regulação nuclear passou da CNEN à ANSN
   em agosto de 2025; as normas seguem as mesmas. Hemoderivados (006) e soros e vacinas (145) importados:
   RDC 81/2008, Capítulo XXXIX, Procedimentos 2 e 2A. As demais categorias não têm requisito próprio de
   distribuição na RDC 430/2020: entram nas perguntas gerais e no registro da conclusão. */
const XH_GCNEN='Guia CNEN de Licenciamento e Controle de Distribuidoras de Radiofármacos (2021), ',XH_430='RDC Anvisa nº 430/2020, ';
XH_SECOES.push({id:'xh-radio',item:'11',title:'Radiofármacos — licenciamento nuclear, proteção radiológica e rastreabilidade',quando:'radio',q:[
 ['xn-01','A empresa apresentou o ato da autoridade nuclear (CNEN, hoje ANSN) para a prática de distribuição de radiofármacos — autorização para operação ou, enquanto em licenciamento, o requerimento e a autorização para construção, quando exigida?',XH_430+'art. 6º, parágrafo único; '+XH_GCNEN+'itens 4, 5 e 6','A empresa não apresentou ato da autoridade nuclear para a prática de distribuição de radiofármacos'],
 ['xn-02','Para radiofármacos de meia-vida maior que 2 horas, há local próprio e de uso exclusivo para o armazenamento das fontes e o gerenciamento de rejeitos; se só houver meia-vida curta, há instrumento firmado com o fabricante para a expedição e os rejeitos?',XH_GCNEN+'item 4','Não há local próprio e exclusivo para fontes e rejeitos radioativos, nem instrumento com o fabricante quando só há radiofármacos de meia-vida curta'],
 ['xn-03','Há Plano de Proteção Radiológica atualizado, datado e assinado pelo titular e pelo supervisor de proteção radiológica?',XH_GCNEN+'itens 6 e 8','Não há Plano de Proteção Radiológica atualizado, datado e assinado pelo titular e pelo supervisor de proteção radiológica'],
 ['xn-04','Há supervisor de proteção radiológica contratado, com certificação da autoridade nuclear em transporte, radiofarmácia ou medicina nuclear, e substituto designado?',XH_GCNEN+'item 6','Não há supervisor de proteção radiológica certificado nem substituto designado'],
 ['xn-05','Há Plano de Gerenciamento de Rejeitos Radioativos, com local de armazenamento, inventário, segregação, acondicionamento, eliminação e transporte?',XH_GCNEN+'itens 5 e 6','Não há Plano de Gerenciamento de Rejeitos Radioativos'],
 ['xn-06','O transporte dos radiofármacos é contratado com empresa autorizada pela autoridade nuclear a transportar material radioativo, já que a autorização de distribuição não inclui o transporte?',XH_GCNEN+'itens 4 e 6','O transporte de radiofármacos não está contratado com empresa autorizada pela autoridade nuclear'],
 ['xn-07','Há monitoração individual contratada, detectores de radiação calibrados e treinamento em proteção radiológica para a prática?',XH_GCNEN+'item 6','Não há monitoração individual, detectores calibrados ou treinamento em proteção radiológica'],
 ['xn-08','Há sistema ou procedimento de rastreabilidade dos radiofármacos, do pedido à expedição, com lançamento no Sistema de Registro de Venda de Radiofármacos da autoridade nuclear?',XH_GCNEN+'itens 6 e 13','Não há sistema ou procedimento de rastreabilidade dos radiofármacos com lançamento no Sistema de Registro de Venda'],
 ['xn-09','O procedimento de venda restringe os clientes a instalações radiativas com autorização para operação em vigor, aptas a receber o material e dentro das cotas autorizadas, e a estabelecimentos licenciados e autorizados pela autoridade sanitária?',XH_430+'art. 6º; '+XH_GCNEN+'item 13','O procedimento de venda de radiofármacos não restringe os clientes a instalações autorizadas pela autoridade nuclear e pela autoridade sanitária'],
 ['xn-10','Há procedimento para comunicar à autoridade nuclear sinistro, roubo ou furto de radiofármacos?',XH_430+'art. 71','Não há procedimento para comunicar à autoridade nuclear sinistro, roubo ou furto de radiofármacos'],
 ['xn-11','As vendas realizadas estão lançadas no Sistema de Registro de Venda de Radiofármacos?',XH_GCNEN+'item 13','As vendas de radiofármacos não estão lançadas no Sistema de Registro de Venda de Radiofármacos',1]]});
XH_SECOES.push({id:'xh-frio',item:'9.2',title:'Cadeia de frio — faixas de temperatura por produto (vacinas, soros, hemoderivados e demais termolábeis)',quando:'frio',q:[
 ['xt-01','Para cada produto termolábil que a empresa pretende distribuir — inclusive vacinas, soros e hemoderivados —, está identificada a faixa de temperatura especificada pelo detentor do registro (refrigerado, congelado ou ultracongelado)?',XH_430+'art. 50; '+XH_430+'art. 78','A faixa de temperatura especificada pelo detentor do registro não está identificada para os produtos termolábeis'],
 ['xt-02','Há equipamento de armazenagem para cada faixa identificada — câmara fria, refrigerador, congelador ou ultracongelador —, qualificado termicamente na faixa de uso?',XH_430+'art. 78','Não há equipamento qualificado para cada faixa de temperatura dos produtos termolábeis'],
 ['xt-03','O plano de contingência cobre cada faixa, inclusive congelados e ultracongelados, com alternativa emergencial de resfriamento — como gelo seco ou nitrogênio líquido — que mantenha as condições do detentor do registro?',XH_430+'art. 80; '+XH_430+'art. 81','O plano de contingência não cobre cada faixa de temperatura com alternativa emergencial que mantenha as condições do detentor do registro'],
 ['xt-04','O transporte próprio ou contratado dispõe de embalagens ou veículos qualificados para cada faixa, com a montagem da carga orientada pelo detentor do registro?',XH_430+'art. 83; '+XH_430+'art. 85','O transporte não dispõe de embalagens ou veículos qualificados para cada faixa de temperatura, com montagem da carga orientada pelo detentor do registro']]});
XH_SECOES.push({id:'xh-bio-imp',item:'12.2',title:'Importação de hemoderivados, soros e vacinas',quando:'bioimp',q:[
 ['xb-01','Para hemoderivados, o procedimento de importação prevê o licenciamento de importação no Siscomex e a fiscalização pela autoridade sanitária antes do desembaraço aduaneiro?',XH_81+'Capítulo XXXIX, item 12','O procedimento de importação de hemoderivados não prevê o licenciamento de importação no Siscomex e a fiscalização sanitária antes do desembaraço',0,'hd'],
 ['xb-02','Para hemoderivados, o procedimento exige o laudo analítico do fabricante por lote e o certificado de liberação do lote emitido pela autoridade sanitária do país de fabricação?',XH_81+'Capítulo XXXIX, item 16, alínea “g”; '+XH_81+'Capítulo XXXIX, item 16, alínea “h”','O procedimento de importação de hemoderivados não exige o laudo analítico por lote e o certificado de liberação do lote da autoridade sanitária do país de fabricação',0,'hd'],
 ['xb-03','Para soros e vacinas, o procedimento exige a petição para fiscalização e liberação sanitária, o laudo analítico do fabricante por lote e o certificado de liberação do lote emitido pela autoridade sanitária do país de fabricação?',XH_81+'Capítulo XXXIX, item 18, alínea “a”; '+XH_81+'Capítulo XXXIX, item 18, alínea “g”; '+XH_81+'Capítulo XXXIX, item 18, alínea “h”','O procedimento de importação de soros e vacinas não exige a petição de fiscalização, o laudo analítico por lote e o certificado de liberação do lote da autoridade sanitária do país de fabricação',0,'sv'],
 ['xb-04','Os processos de importação de hemoderivados já realizados trazem o certificado de liberação de cada lote?',XH_81+'Capítulo XXXIX, item 16, alínea “h”','Processos de importação de hemoderivados sem o certificado de liberação do lote',1,'hd'],
 ['xb-05','Os processos de importação de soros e vacinas já realizados trazem o certificado de liberação de cada lote?',XH_81+'Capítulo XXXIX, item 18, alínea “h”','Processos de importação de soros e vacinas sem o certificado de liberação do lote',1,'sv']]});
if(typeof XH_GAS_SECOES!=='undefined')XH_SECOES.push(...XH_GAS_SECOES);
function xhPrecisa(k){const x=xh(),ins=xhTem('03')||xhTem('15');return k==='ins'?ins:k==='imp'?ins&&x.ativ.includes('imp'):k==='frac'?ins&&x.ativ.includes('frac'):k==='ce'?xhTem('02')||xhTem('15'):k==='gas'?xhTem('20'):k==='gas-trp'?xhTem('20')&&x.ativ.includes('trp'):k==='c15'?xhTem('15'):k==='c02'?xhTem('02'):k==='radio'?xhCat('244'):k==='bioimp'?x.ativ.includes('imp')&&(xhCat('006')||xhCat('145')):k==='frio'?(state.meta.flags||[]).includes('termolabeis'):k==='hd'?xhCat('006'):k==='sv'?xhCat('145'):false}
function xhSecoes(){
 if(typeof DATA==='undefined')return;
 DATA.sections=DATA.sections.filter(s=>!s.__xh);
 if(!xhOn())return;
 for(const d of XH_SECOES){
  if(typeof DD_ITENS!=='undefined'){DD_ITENS[d.item]=DD_ITENS[d.item]||[];if(!DD_ITENS[d.item].includes(d.id))DD_ITENS[d.item].push(d.id)}
  for(const q of d.q)if(q[4]&&!XH_REGISTRO.includes(q[0]))XH_REGISTRO.push(q[0]);
  if(!xhPrecisa(d.quando))continue;
  DATA.sections.push({__xh:1,id:d.id,title:d.title,subtitle:'Formulário XIV.H: '+({frac:'fracionar insumo farmacêutico',imp:'importar insumos farmacêuticos',ins:'classes 03 ou 15 (insumos farmacêuticos)',ce:'classes 02 ou 15 (controle especial)',gas:'classe 20 (gases medicinais)','gas-trp':'classe 20 com transporte próprio',radio:'categoria 244 (radiofármacos)',frio:'termolábeis (classes 01 e 02; categorias 145 e 006)',bioimp:'importar hemoderivados (006) ou soros e vacinas (145)'})[d.quando]+'.',condition:'all',reportTitle:d.title,docs:[],questions:d.q.filter(q=>!q[5]||xhPrecisa(q[5])).map(([id,text,legal,nc])=>({id,text,legal,ncText:nc+': «evidência» ('+legal+').'}))});
 }
}
/* etapa 8 no modo XIV.H: “Classes e categorias” (condições específicas). Reúne, por classe e categoria
   declaradas, o que vai além dos aspectos gerais da RDC 430/2020: cadeia de frio (termolábeis, vacinas,
   soros, hemoderivados), controle especial, insumos, fracionamento e laboratório, gases, radiofármacos,
   biológicos importados e o controle de qualidade da importadora. As perguntas de termolábeis e de
   controlados saem das etapas 3, 4 e 7 só neste card; fora dele, as etapas voltam ao original.
   O relatório não muda: cada pergunta continua no seu item do Anexo I. */
let XH_CARDS0=null;
const XH_GRUPOS=[['frio',['termolabeis','qt-equip','qt-veiculo','xh-frio']],['ce',['controlados','xh-ce']],['ins',['insumos_gerais','insumos_ifa','xh-ins-']],['frac',['xh-frac-','xh-lab-']],['gas',['xh-gas-']],['radio',['xh-radio']],['bio',['xh-bio-']]];
const XH_MOVE=['termolabeis','qt-equip','qt-veiculo','controlados'];
function xhCartao8(){
 if(typeof DIST_CARDS==='undefined'||!DIST_CARDS[7])return;
 if(!XH_CARDS0)XH_CARDS0=DIST_CARDS.map(c=>[c[0],c[1].slice()]);
 const cq=DIST_CARDS[7][1].filter(x=>/^cq_/.test(x));
 if(!xhOn()){XH_CARDS0.forEach((c,i)=>{if(!DIST_CARDS[i])return;DIST_CARDS[i][0]=c[0];if(i<7)DIST_CARDS[i][1]=c[1].slice();else DIST_CARDS[i][1]=DIST_CARDS[i][1].filter(x=>!/^xh-/.test(x)&&!XH_MOVE.includes(x))});return}
 /* etapas gerais sem os blocos específicos */
 XH_CARDS0.forEach((c,i)=>{if(i<7&&DIST_CARDS[i])DIST_CARDS[i][1]=c[1].filter(x=>!XH_MOVE.includes(x))});
 if(DIST_CARDS[2])DIST_CARDS[2][0]=XH_CARDS0[2][0].replace(/,? e termolábeis$/,'').replace(/, armazenamento$/,' e armazenamento');
 if(DIST_CARDS[6])DIST_CARDS[6][0]=XH_CARDS0[6][0].replace(/, controlados e estoque$/,' e estoque');
 const ins=xhTem('03')||xhTem('15'),fl=state.meta.flags||[];
 const ids=DATA.sections.map(z=>z.id),ok=id=>id==='insumos_gerais'?ins:id==='insumos_ifa'?ins&&(fl.includes('ifa')||xh().ativ.includes('imp')):ids.includes(id);
 const lista=XH_GRUPOS.flatMap(([,pre])=>pre.flatMap(k=>k.endsWith('-')?ids.filter(id=>id.startsWith(k)):ok(k)?[k]:[]));
 DIST_CARDS[7][0]='Classes e categorias';
 DIST_CARDS[7][1]=[...new Set(lista.concat(cq))];
}
if(typeof dmCartao8==='function'&&!dmCartao8.__xh){const o=dmCartao8;dmCartao8=function(){o.apply(this,arguments);xhCartao8()};Object.assign(dmCartao8,o,{__xh:1})}
function xhFontes(){if(typeof DATA==='undefined'||!DATA.sources)return;const add=(name,role,url)=>{if(!DATA.sources.some(x=>x.name===name))DATA.sources.push({name,rev:'—',vigencia:'vigente',role,url})};
 add('RDC Anvisa nº 204/2006','Boas práticas de distribuição e fracionamento de insumos farmacêuticos (regulamento técnico anexo).','https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&cod_menu=9431&cod_modulo=310&link=S&numeroAto=00000204&orgao=RDC%2FDC%2FANVISA%2FMS&seqAto=002&tipo=RDC&valorAno=2006');
 add('Guia CNEN de Licenciamento e Controle de Distribuidoras de Radiofármacos (2021)','O que a autoridade nuclear exige da distribuidora de radiofármacos (Normas CNEN NN 3.01, 5.01, 6.02, 7.01 e 8.01); a regulação passou à ANSN em agosto de 2025.','https://appasp2019.cnen.gov.br/seguranca/orientacoes/images/cnen/documentos/drs/orientacoes/Guia-de-Licenciamento-e-Distribuidoras-de-Radiofarmacos.pdf');
 add('RDC Anvisa nº 637/2022','Cadastro, na Anvisa, de todos os insumos farmacêuticos ativos com que a empresa trabalha, com fabricantes e revendedores (arts. 1º e 3º).','https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&cod_menu=9431&cod_modulo=310&link=S&numeroAto=00000637&orgao=RDC%2FDC%2FANVISA%2FMS&seqAto=000&tipo=RDC&valorAno=2022')}
function xhIniciar(){try{if(xhOn()){xh();xhSync();xhFontes()}xhPendurar();xhCartao8()}catch(e){}}
xhIniciar();
document.addEventListener('DOMContentLoaded',xhIniciar);window.addEventListener('load',xhIniciar);
