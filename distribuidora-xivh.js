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
   Licença inicial: o que a RDC 16/2014 (art. 28) cobra é a existência do sistema; só as perguntas que
   dependem de registro de operação (XH_REGISTRO) aceitam “não aplicável — atividade não iniciada”. */
const XH_ATIV=[['dist','Distribuir'],['imp','Importar'],['exp','Exportar'],['arm','Armazenar em área própria'],['trp','Transporte próprio'],['frac','Fracionar insumo farmacêutico'],['dep','Armazenar em depósito fechado']];
const XH_CLASSES=[['01','Medicamentos'],['02','Medicamentos sujeitos ao controle especial'],['03','Insumos farmacêuticos'],['15','Insumos farmacêuticos sujeitos ao controle especial'],['20','Gases medicinais']];
const XH_CL=['Cumpre as Boas Práticas','Cumpre as Boas Práticas com Ação Corretiva','Não cumpre as Boas Práticas'];
const XH_NA='Atividade não iniciada (licença inicial): não há registros de operação a verificar.';
/* Perguntas que dependem de operação já realizada (lotes recebidos, expedições, auditorias feitas,
   análises de lotes, reclamações, inventários). As demais tratam de instalações, pessoal,
   procedimentos, programas, contratos e qualificações, exigidos antes de iniciar. */
const XH_REGISTRO=['dist-id-imp-terceiro','q902','q911','q912','q913','q914','q915','q916','q142','q175','q176','q177','q178','q179','q180','q181','q201','q203','q204','q205','q208','q209','q223','q228','q230','q231','q232','expedicao-documento','q255','q256','q257','q268','q269','q272','q274','q280','q324','q328','q331','q335','q336','q338','q344','q345','res-06-xii','q354','q359','q360','q950','q394','q398','q401','q412','q416','ifa-01','ifa-02','ifa-03','ifa-04','ifa-05','ifa-06','ifa-07','ifa-08','ifa-09','ifa-10','ifa-11','ifa-12','ifa-13','ifa-15','ifa-16'];
function xhOn(){return /(^|[?&])trilha=xivh(&|$)/.test(String(window.__QS||'').replace(/^\?/,''))||!!(state.meta&&state.meta.xivh&&state.meta.xivh.on)}
function xh(){const m=state.meta;if(!m.xivh)m.xivh={on:true,ativ:[],classes:[],inicial:'Sim'};const x=m.xivh;x.ativ=x.ativ||[];x.classes=x.classes||[];state.plan=state.plan||{};state.plan.xh=state.plan.xh||{};return x}
function xhTem(c){return xh().classes.includes(c)}
/* combinações possíveis: fracionar só insumos (Portaria SMS 266/2025, art. 18, parágrafo único, I) */
function xhValida(a,c){return a!=='frac'||c==='03'||c==='15'}
function xhSync(){
 if(!xhOn())return;const x=xh(),m=state.meta;
 const map={dist:['Distribuir','Expedir'],imp:['Importar'],exp:['Exportar'],arm:['Armazenar'],dep:['Armazenar'],trp:['Transportar']};
 m.activities=[...new Set(x.ativ.flatMap(a=>map[a]||[]))];
 const f=new Set(m.flags||[]),liga=(k,v)=>{v?f.add(k):f.delete(k)};
 liga('controlados',xhTem('02')||xhTem('15'));liga('insumos',xhTem('03')||xhTem('15'));liga('xh_frac',x.ativ.includes('frac'));liga('xh_gases',xhTem('20'));
 m.flags=[...f];
 state.report=state.report||{};if(x.inicial==='Sim'&&!state.report.emAtividade)state.report.emAtividade='Não';
}
function xhRegistroPendentes(){return DATA.sections.flatMap(s=>s.questions).filter(q=>XH_REGISTRO.includes(q.id)&&!(state.answers[q.id]||{}).status)}
function xhAvisos(){
 const x=xh(),L=[];
 if(x.ativ.includes('frac')&&!xhTem('03')&&!xhTem('15'))L.push('Fracionar só se aplica a insumos farmacêuticos: marque a classe 03 ou 15 (Portaria SMS nº 266/2025, art. 18, parágrafo único, I).');
 if(x.ativ.includes('frac'))L.push('A fracionadora de insumos deve possuir laboratório de controle da qualidade próprio, para análises físico-químicas e microbiológicas (RDC Anvisa nº 204/2006, item 12.1.3).');
 if(xhTem('20'))L.push('Gases medicinais: a AFE deve trazer a classe gases medicinais, distinta da classe de medicamentos (RDC Anvisa nº 887/2024, art. 9º, § 1º).');
 if(xhTem('02')||xhTem('15'))L.push('Controle especial: AE para cada estabelecimento (Portaria SVS/MS nº 344/1998, art. 2º, § 7º); o relatório deve declarar expressamente o cumprimento da Portaria SVS/MS nº 344/1998 e da Portaria SVS/MS nº 6/1999 (RDC Anvisa nº 16/2014, art. 15, § 4º).');
 L.push('Fracionar medicamento ou envasar gás medicinal não cabe no CNAE 4644-3/01: são atividades fabris (Portaria SMS nº 266/2025, art. 18; Anexo I, CNAE 2121-1/01 e 2014-2/00).');
 return L;
}
function xhPainel(){
 const x=xh(),chk=(grp,v,l)=>`<label class="check"><input type="checkbox" data-xh="${grp}" value="${esc(v)}" ${x[grp].includes(v)?'checked':''}>${esc(l)}</label>`;
 const pend=x.inicial==='Sim'?xhRegistroPendentes().length:0;
 return '<h4>Formulário XIV.H — atividades e classes declaradas</h4><p class="mini">Marque exatamente o que a empresa declarou nos itens VIII e IX do formulário. O relatório conclui por atividade e classe, porque é o que a Anvisa usa para conceder a AFE e a AE (RDC Anvisa nº 16/2014, art. 15, I, “c”).</p>'
  +'<div class="checks">'+XH_ATIV.map(([v,l])=>chk('ativ',v,l)).join('')+'</div>'
  +'<h4 style="margin-top:10px">Classes de produto</h4><div class="checks">'+XH_CLASSES.map(([v,l])=>chk('classes',v,v+' – '+l)).join('')+'</div>'
  +'<div class="grid three" style="margin-top:10px"><label class="field">Licença inicial (atividades ainda não iniciadas)?<select data-xh="inicial"><option value="">— selecione —</option>'+['Sim','Não'].map(o=>`<option${x.inicial===o?' selected':''}>${o}</option>`).join('')+'</select></label></div>'
  +'<div class="note"><ul>'+xhAvisos().map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul></div>'
  +(x.inicial==='Sim'?'<div class="note"><b>Licença inicial.</b> Cobre-se a existência de instalações, equipamentos, pessoal, procedimentos, programas, contratos e qualificações (RDC Anvisa nº 16/2014, art. 28). Só as perguntas que dependem de registro de operação — lotes recebidos, expedições, auditorias feitas, análises de lotes, reclamações, inventários — aceitam “não aplicável — atividade não iniciada”. Se houver evidência de operação (nota fiscal, licenciamento de importação, livro escriturado), responda normalmente.'+(pend?`<div class="toolbar"><button class="btn" data-xh-na="1">Marcar ${pend} pergunta${pend>1?'s':''} de registro de operação como não aplicáveis</button></div>`:'')+'</div>':'');
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
 out.inicial=x.inicial==='Sim'?'Licença inicial: foram verificados instalações, equipamentos, pessoal, procedimentos, programas, contratos e qualificações exigidos para iniciar as atividades (RDC Anvisa nº 16/2014, art. 28); não havia operação até a data da inspeção.':'';
 return out;
}
function xhPendencias(){
 if(!xhOn())return [];const x=xh(),out=[],v=(state.plan&&state.plan.xh)||{};
 if(!x.ativ.length)out.push('Formulário XIV.H: marque as atividades declaradas (etapa 1).');
 if(!x.classes.length)out.push('Formulário XIV.H: marque as classes de produto declaradas (etapa 1).');
 const vaz=xhCelulas().filter(k=>!v[k]);if(vaz.length)out.push('Item 14: falta a conclusão de '+vaz.length+' combinação(ões) de atividade e classe (aba Análise do plano de ação).');
 if(x.inicial==='Sim')for(const q of DATA.sections.flatMap(s=>s.questions)){const a=state.answers[q.id]||{};if(a.status==='NA'&&a.evidence===XH_NA&&!XH_REGISTRO.includes(q.id))out.push(q.id+': “atividade não iniciada” só vale para perguntas de registro de operação; esta trata de requisito exigido antes de iniciar (RDC Anvisa nº 16/2014, art. 28).')}
 return out;
}
function xhPendurar(){
 if(typeof distTela1View==='function'&&!distTela1View.__xh){const o=distTela1View;distTela1View=function(){if(!xhOn())return o.apply(this,arguments);xhSync();const h=o.apply(this,arguments);const r=/<h4>Atividades<\/h4><div class="checks">[\s\S]*?<\/div>/;return r.test(h)?h.replace(r,()=>xhPainel()):h.replace('<h4>Equipe inspetora',()=>xhPainel()+'<h4>Equipe inspetora')};distTela1View.__xh=1}
 if(typeof planView==='function'&&!planView.__xh){const o=planView;planView=function(){const h=o.apply(this,arguments);return xhOn()?h+xhMatriz():h};planView.__xh=1}
 if(typeof distIssues==='function'&&!distIssues.__xh){const o=distIssues;distIssues=function(){const r=o.apply(this,arguments);return xhOn()?r.concat(xhPendencias()):r};distIssues.__xh=1}
 if(typeof ddAnexoIPendencias==='function'&&!ddAnexoIPendencias.__xh){const o=ddAnexoIPendencias;ddAnexoIPendencias=function(){let r=o.apply(this,arguments);if(!xhOn())return r;if(xhConclusao())r=r.filter(t=>!/classificação final não definida/.test(t));return r.concat(xhPendencias())};ddAnexoIPendencias.__xh=1}
 if(!window.__xhEventos){window.__xhEventos=1;
  document.addEventListener('change',e=>{const t=e.target;if(!t||!t.dataset)return;
   if(t.dataset.xh){const x=xh(),g=t.dataset.xh;if(g==='inicial')x.inicial=t.value;else{let a=x[g]||[];a=t.checked?[...new Set(a.concat(t.value))]:a.filter(v=>v!==t.value);x[g]=a}xhSync();save();try{renderITab()}catch(_){}}
   else if(t.dataset.xhCel){state.plan.xh=state.plan.xh||{};state.plan.xh[t.dataset.xhCel]=t.value;save()}},true);
  document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('[data-xh-na]');if(!b)return;e.preventDefault();for(const q of xhRegistroPendentes())state.answers[q.id]={status:'NA',evidence:XH_NA};save();try{renderITab()}catch(_){}},true)}
}
function xhIniciar(){try{if(xhOn()){xh();xhSync()}xhPendurar()}catch(e){}}
xhIniciar();
document.addEventListener('DOMContentLoaded',xhIniciar);window.addEventListener('load',xhIniciar);
