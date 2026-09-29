/* ——— Distribuidora: desvio de qualidade (POP-O-SNVS-023 rev. 6) e NCs previamente
   categorizadas (POP-O-SNVS-032 rev. 0) ———
   1. Caixas de orientação nas telas de item: classes de desvio (Anexo I do POP-023) nos itens
      em que o desvio de produto aparece; NCs previamente categorizadas (Anexo I do POP-032),
      filtradas pelo tema do item. Apoio ao inspetor: não categorizam nada sozinhas.
   2. Pergunta “Há produto com desvio de qualidade ou falsificação?” nesses itens, quando há
      resposta Não cumpre. A classe escolhida prepara o alerta rápido (sem envio automático).
   3. Painel único de alerta rápido na aba “Fluxo SNVS · POP 23”, no lugar das duas telas
      anteriores (situações do item 9.1 e formulário do Anexo II no fechamento). Os alertas já
      registrados são migrados.
   Injetado no módulo por scripts/repack-distribuidora-docs.cjs. */
(function distPop23(){
 const A23='POP-O-SNVS-023 rev. 6';
 /* itens em que o desvio de qualidade de produto aparece */
 const SEC_DESVIO=['recebimento','armazenamento','termolabeis','transporte','expedicao','recolhimento','desvios','reclamacoes','cq_oos','cq_liberacao'];
 const CLASSES=[
  ['I','Classe I','Oferece potencial risco à vida ou pode causar sérios riscos à saúde. Todos os casos são notificados pelo sistema de alertas rápidos.',['Troca de produto (embalagem e conteúdo diferentes)','Produto correto em sub ou sobredose, quando possa causar sérias consequências à saúde','Contaminação microbiana de estéril injetável ou oftálmico','Contaminação com outras substâncias químicas, com possíveis sérias consequências','Mistura de formulações distintas na mesma embalagem, com evidência em mais de uma embalagem','Uso equivocado de insumo farmacêutico ativo em produto de múltiplos componentes, com possíveis sérias consequências']],
  ['II','Classe II','Pode causar doença ou falha no tratamento, sem a extensão da classe I. Notificação pelo alerta rápido a toda a lista de contatos quando a destinação dos lotes não for conhecida; conhecida, apenas aos contatos relevantes.',['Embalagem incorreta (texto equivocado, ausência de informações ou figuras)','Bula ou folheto com informação incorreta ou faltante','Contaminação microbiana de estéril não injetável e não oftálmico, com possíveis consequências','Contaminação química (impurezas relevantes, contaminação cruzada, particulado)','Mistura de formulações distintas na mesma embalagem','Resultado fora de especificação (teor, estabilidade, volume, peso médio)','Fechamento inseguro quando relevante para proteção (à prova de crianças, citotóxicos, alta potência)']],
  ['III','Classe III','Pode não representar perigo significativo à saúde. O alerta rápido só é usado se a autoridade sanitária competente julgar a razão relevante.',['Embalagem defeituosa (lote ou validade errados ou ausentes)','Lacre ou fechamento defeituoso','Contaminação (resíduos de contaminação microbiana, sujidades, detritos, material particulado)']]];
 const SITUACOES=[['classe','Desvio de qualidade classe I ou II, inclusive atestado por laudo inicial ou definitivo'],['falsi','Falsificação'],['inspecao','Achado em inspeção em que seja necessário impedir o alcance do produto ao mercado'],['risco','Presunção de risco sanitário elevado, exigindo ação urgente para proteção da saúde pública']];
 /* POP-O-SNVS-032, Anexo I: NCs previamente categorizadas, com os itens do roteiro a que se referem */
 const C='Crítica',M='Maior',O='Outra';
 const NC32=[
  [C,'Estabelecimento sem AFE, AE ou licença sanitária para as atividades exercidas com produtos sujeitos à vigilância sanitária.',['dist-identificacao-preparacao']],
  [C,'Fraude ou adulteração de dados e de documentos que afetam múltiplos produtos.',['dist-identificacao-preparacao','documentacao']],
  [C,'Armazenamento, distribuição, importação ou transporte de medicamentos sem registro, notificação ou cadastro na Anvisa.',['recebimento','armazenamento','fornecedores']],
  [C,'Falhas ou desvios de qualidade que comprometam a rastreabilidade dos produtos armazenados, distribuídos, importados ou transportados.',['recebimento','expedicao','recolhimento','desvios']],
  [M,'Ausência ou irregularidade em procedimentos e registros de controle de pragas, limpeza e sanitização.',['armazenamento']],
  [M,'Ausência de Certidão do Conselho Regional de Farmácia ou certidão vencida.',['dist-identificacao-preparacao','pessoal']],
  [C,'Terceirização com empresas sem AFE e licença sanitária, quando exigidas para a atividade terceirizada.',['terceirizacao']],
  [M,'Ausência de contrato de terceirização das atividades, aprovado pelo sistema de gestão da qualidade, demonstrando a qualificação do prestador.',['terceirizacao']],
  [O,'Qualificação inadequada do terceirizado (sem verificar toda a documentação ou sem auditoria, se aplicável); conforme a criticidade do serviço, pode ser Maior.',['terceirizacao']],
  [C,'Funcionários em quantidade insuficiente para as atividades, com risco à qualidade dos produtos.',['pessoal']],
  [C,'Ausência de treinamento para funções críticas aos produtos, ou de registros que o comprovem.',['pessoal']],
  [C,'Atividades realizadas por funcionários sem a qualificação necessária, com registro em conselho de classe quando exigido.',['pessoal']],
  [M,'Ausência de procedimento que estabeleça os treinamentos necessários conforme a função.',['pessoal']],
  [M,'Procedimento de treinamento sem periodicidade definida.',['pessoal']],
  [M,'Treinamento em periodicidade diferente da estabelecida em procedimento.',['pessoal']],
  [O,'Procedimento de treinamento não define como a efetividade será avaliada.',['pessoal']],
  [O,'Registro de treinamento em desacordo com o procedimento.',['pessoal']],
  [C,'Não qualifica fornecedores e/ou clientes, ou qualifica de forma inadequada para garantir transações apenas entre empresas autorizadas e licenciadas.',['fornecedores']],
  [C,'Período mínimo de retenção de documentos não cumprido, ou documentos indisponíveis à fiscalização.',['documentacao']],
  [C,'Nota fiscal de expedição sem número de lote que possibilite a rastreabilidade.',['expedicao']],
  [C,'Sem procedimentos para minimizar a exposição de termolábeis à temperatura ambiente no recebimento e na expedição.',['termolabeis','recebimento','expedicao']],
  [M,'Sistema de Gestão da Qualidade não implementado adequadamente.',['sgq']],
  [M,'Sem procedimentos para todas as atividades que impactam a qualidade dos medicamentos.',['sgq','documentacao']],
  [M,'Procedimentos sem registro de aprovação, assinatura e data para disponibilização às áreas.',['documentacao']],
  [M,'Sem procedimento de recolhimento ou devolução que permita a rastreabilidade dos produtos devolvidos ou recolhidos.',['recolhimento']],
  [M,'Não realiza a simulação de recolhimento de medicamentos do mercado.',['recolhimento']],
  [M,'Não realiza o gerenciamento, o registro e a investigação das reclamações.',['reclamacoes']],
  [O,'Sem procedimento para elaboração, revisão, codificação, aprovação, controle e guarda dos documentos da qualidade.',['documentacao']],
  [O,'Programa de autoinspeção sem frequência, abrangência e responsabilidades pelas ações decorrentes.',['autoinspecao']],
  [O,'Ausência de Plano de Gerenciamento de Resíduos de Serviços de Saúde — PGRSS.',['residuos']],
  [C,'Importadora sem área própria para armazenamento de medicamentos e de amostras de referência/retenção.',['armazenamento']],
  [C,'Ausência de áreas independentes para recebimento, armazenamento e expedição.',['recebimento','armazenamento','expedicao']],
  [C,'Sem área exclusiva para produtos sujeitos a controle especial, quando aplicável.',['controlados','armazenamento']],
  [C,'Ambiente de amostragem e testes (importadoras) inadequado para controlar contaminação cruzada ou microbiológica.',['cq_instalacoes']],
  [C,'Temperatura e umidade das áreas de armazenamento não monitoradas e controladas, ou parâmetros inadequados aos produtos.',['armazenamento','termolabeis']],
  [C,'Aquisição, armazenamento e comercialização de produtos não regularizados na Anvisa.',['recebimento','armazenamento']],
  [C,'Armazenamento e distribuição em embalagens diferentes das definidas no registro.',['armazenamento']],
  [C,'Ausência de estudo de qualificação térmica das áreas de armazenamento.',['qt-area','armazenamento']],
  [C,'Sem equipamentos qualificados termicamente para termolábeis ou para elementos refrigerantes usados nas caixas de transporte.',['qt-equip','termolabeis']],
  [C,'Termolábeis armazenados em condições diversas das especificadas.',['termolabeis']],
  [C,'Sem qualificação térmica das embalagens de expedição de termolábeis, ou caixas e refrigerantes em desacordo com o estudo.',['qt-veiculo','termolabeis','expedicao']],
  [C,'Áreas operacionais sem boas condições de higiene e limpeza, sem proteção contra intempéries e animais.',['armazenamento']],
  [M,'Recebimento e expedição compartilhados sem alternância de horários ou outro procedimento que separe as atividades.',['recebimento','expedicao']],
  [M,'Sem área segregada e identificada para quarentena, reprovados, recolhidos, vencidos e falsificados.',['armazenamento','recolhimento']],
  [M,'Sensores de temperatura e umidade dispostos em desacordo com o estudo de qualificação térmica da área.',['armazenamento','qt-area']],
  [M,'Termo-higrômetro (ou outro dispositivo de monitoramento) sem calibração.',['armazenamento','termolabeis']],
  [M,'Instalações insuficientes para manter estoque ordenado.',['armazenamento']],
  [M,'Sem fonte secundária de energia para os equipamentos de refrigeração.',['termolabeis']],
  [M,'Não confere nem registra no recebimento as condições do transporte (temperatura, umidade, luz), lote, validade, quantidade e integridade da carga.',['recebimento']],
  [M,'Cantinas, refeitórios, vestiários, sanitários ou lavatórios em contato direto com a área de armazenamento.',['armazenamento']],
  [O,'Sem área para depósito de materiais de limpeza.',['armazenamento']],
  [O,'Superfícies internas (piso, paredes, prateleiras, paletes, teto) não lisas, impermeáveis e laváveis.',['armazenamento']],
  [O,'Registros de temperatura e umidade mantidos por menos de dois anos.',['armazenamento','termolabeis']],
  [C,'Importadora sem laboratório de controle de qualidade para as análises da especificação.',['cq_instalacoes']],
  [C,'Sem áreas separadas e independentes para ensaios físico-químicos e microbiológicos.',['cq_instalacoes']],
  [C,'Documentos do laboratório não permitem a rastreabilidade das análises.',['cq_atividades']],
  [C,'Alterações em registros de análise não preservam os dados originais.',['cq_atividades']],
  [C,'Metodologias não farmacopeicas sem validação, ou farmacopeicas não verificadas nas condições do laboratório.',['cq_atividades','cq_padroes']],
  [C,'Não realiza todas as análises de controle de qualidade previstas no registro do medicamento importado.',['cq_liberacao','cq_atividades']],
  [C,'Equipamentos críticos do laboratório sem qualificação e/ou calibração periódica.',['cq_atividades']],
  [M,'Espaço dos laboratórios sem fluxo adequado para os ensaios.',['cq_instalacoes']],
  [M,'Sem procedimento para recebimento, registro e armazenamento de amostras para análise.',['cq_atividades']],
  [M,'Sem área adequada para instrumentos sensíveis a interferências elétricas, vibração e umidade.',['cq_instalacoes']],
  [M,'Especificações, metodologias, farmacopeias, manuais e padrões de referência indisponíveis no laboratório.',['cq_padroes']],
  [M,'Substâncias químicas de referência armazenadas em desacordo com as especificações.',['cq_padroes']],
  [M,'Resultados fora de especificação não investigados e/ou registrados corretamente.',['cq_oos']],
  [M,'Armazenamento e manuseio incorretos de cepas de referência e meios de cultura.',['cq_atividades']],
  [M,'Sem teste de promoção de crescimento de cada lote de meio de cultura, ou sem controle negativo.',['cq_atividades']],
  [M,'Sem livros de uso dos equipamentos do laboratório, ou registros desatualizados.',['cq_atividades']],
  [M,'Água do laboratório inadequada às análises.',['cq_instalacoes']],
  [M,'Certificados de análise sem todas as informações exigidas.',['cq_liberacao']],
  [M,'Equipamentos de medição não verificados regularmente antes do uso.',['cq_atividades']],
  [O,'Amostras de retenção sem identificação correta.',['cq_liberacao']],
  [O,'Reagentes e soluções de trabalho sem identificação que permita a rastreabilidade.',['cq_atividades']],
  [O,'Resíduos das análises não armazenados corretamente para eliminação.',['cq_atividades']],
  [O,'Equipamentos sem identificação da condição de calibração e/ou qualificação.',['cq_atividades']],
  [C,'Transporte de termolábeis em meios não qualificados termicamente.',['transporte','qt-veiculo']],
  [C,'Ausência de controle e monitoramento térmico de termolábeis no transporte.',['transporte']],
  [C,'Sem sistemas ativos ou passivos para manter as condições de transporte dos termolábeis exigidas no registro.',['transporte']],
  [M,'Sem monitoramento e controle de temperatura e umidade no transporte de não termolábeis.',['transporte']],
  [M,'Sem sistemas ativos ou passivos, quando necessários, para não termolábeis.',['transporte']],
  [M,'Limpeza, sanitização e manutenção inadequadas dos veículos.',['transporte']],
  [M,'Sem vínculo contratual com os clientes, com responsabilidades definidas.',['transporte']],
  [M,'Transporte de não termolábeis junto a outras categorias de produtos, com possibilidade de contaminação.',['transporte']],
  [O,'Sem procedimento que descreva as condições de transporte conforme a especificação dos produtos.',['transporte']],
  [C,'Sistemas informatizados não validados antes do uso ou não revalidados após mudança significativa.',['sistemas','qualificacao-sistemas']],
  [C,'Sem plano mestre de validação que defina as operações críticas.',['qualificacao-sistemas','sgq']],
  [C,'Sem protocolos de validação (pontos críticos, critérios de aceitação, registro e avaliação dos resultados).',['qualificacao-sistemas']],
  [C,'Sem controles que impeçam acessos e mudanças não autorizadas nos sistemas informatizados.',['sistemas','qualificacao-sistemas']],
  [M,'Desvios observados na validação de metodologia analítica não registrados nem investigados.',['cq_atividades']],
  [M,'Relatório de validação sem referência ao protocolo, sem resultados e sem comparação com os critérios de aceitação.',['qualificacao-sistemas']],
  [M,'Equipamentos críticos da validação não qualificados no momento da validação.',['qualificacao-sistemas','qt-equip']]];

 const e=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const abertos=new Set();
 function caixa(id,titulo,corpo){return `<details class="sm-box a23-box" data-a23-box="${e(id)}"${abertos.has(id)?' open':''}><summary>${titulo}</summary>${corpo}<p class="sm-nota">Apoio ao inspetor: não categoriza nem classifica automaticamente e não entra no relatório.</p></details>`}
 function caixa23(){return caixa('c23','⚠️ Desvio de qualidade: classe de risco — '+A23+', Anexo I',
  CLASSES.map(([k,t,d,ex])=>`<p><b>${t}.</b> ${e(d)}</p><ul>${ex.map(x=>'<li>'+e(x)+'</li>').join('')}</ul>`).join('')
  +`<p><b>Na distribuidora.</b> Produto com suspeita de desvio ou falsificação fica segregado e identificado, com o detentor do registro comunicado. Situações de alerta rápido (item 9.1): desvio classe I ou II, falsificação, achado que exija impedir o produto de chegar ao mercado e presunção de risco sanitário elevado. Notificar no Notivisa antes do alerta e enviar em até 72 h da confirmação do fato.</p>`)}
 function caixa32(sid){const l=NC32.filter(x=>x[2].includes(sid));if(!l.length)return '';
  const g=cat=>{const v=l.filter(x=>x[0]===cat);return v.length?`<p><b>NC ${cat}${v.length>1?'s':''}</b></p><ul>${v.map(x=>'<li>'+e(x[1])+'</li>').join('')}</ul>`:''};
  return caixa('c32-'+sid,'📋 NCs previamente categorizadas — POP-O-SNVS-032, Anexo I',g(C)+g(M)+g(O)
   +'<p><b>Observações do POP.</b> A lista não é exaustiva: situações não descritas são categorizadas pela equipe conforme a figura 1 do procedimento. NC Maior pode ser recategorizada como Crítica. Para produto não crítico, NC Crítica ou Maior pode ser recategorizada como Maior ou Outra; em situações extremas (fraude, serviço não autorizado, infestação, condições não sanitárias, desvios generalizados), Outra ou Maior pode subir para Maior ou Crítica.</p>')}

 /* ---------- estado: alertas (lista única) ---------- */
 function alertas(){
  if(!Array.isArray(state.alertas)){state.alertas=[];
   const a=state.alert||{};if(a.enabled&&Object.keys(a).some(k=>k!=='enabled'&&a[k]))state.alertas.push(Object.assign({},a,{origem:'fechamento'}));
   const sv=(state.snvs&&state.snvs.alerta)||{};const sit=Object.keys(sv).find(k=>sv[k]);
   const sitT=sit&&(SITUACOES.find(x=>x[0]===sit)||[])[1];
   if(sit){if(state.alertas[0])state.alertas[0].situacao=state.alertas[0].situacao||sitT;else state.alertas.push({situacao:sitT,notivisa:(state.snvs&&state.snvs.notivisa)||'',origem:'fluxo'})}
   save()}
  return state.alertas}
 const d23=()=>state.desvio23||(state.desvio23={});
 const CLASSE_ANEXO={I:'Desvio de qualidade Classe I',II:'Desvio de qualidade Classe II',falsi:'Falsificação',III:'Outros'};
 function secTitulo(sid){const s=DATA.sections.find(x=>x.id===sid);return s?s.title:sid}
 function prazo72(dt){if(!dt)return '';const d=new Date(dt);if(isNaN(d))return '';d.setHours(d.getHours()+72);return d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
 function alertaDoItem(sid,cria){const l=alertas();let i=l.findIndex(a=>a.origem===sid);if(i<0&&cria){l.push({origem:sid});i=l.length-1;save()}return i}

 /* ---------- pergunta do item ---------- */
 function temNC(sid){const s=DATA.sections.find(x=>x.id===sid);return !!s&&s.questions.some(q=>state.answers[q.id]&&state.answers[q.id].status==='NC')}
 function perguntaItem(sid){
  const v=d23()[sid]||'';if(!v&&!temNC(sid))return '';
  const op=[['nao','Não'],['I','Classe I'],['II','Classe II'],['III','Classe III'],['falsi','Falsificação']];
  let h=`<div class="a23-q"><p class="a23-t"><b>Há produto com desvio de qualidade ou falsificação neste item?</b></p><p class="mini">A classe é decisão da equipe (${A23}, Anexo I). A resposta prepara o alerta rápido; nada é enviado nem vira NC sozinho.</p><div class="a23-op">${op.map(([k,l])=>`<button type="button" data-a23-classe="${k}" data-sec="${e(sid)}" aria-pressed="${v===k}">${l}</button>`).join('')}</div>`;
  const i=alertaDoItem(sid,false),a=i>=0?alertas()[i]:null;
  if(v==='I'||v==='II'||v==='falsi'){
   h+=`<div class="note warning"><b>${v==='I'?'Classe I: todos os casos vão por alerta rápido.':v==='II'?'Classe II: alerta rápido a toda a lista de contatos (ou só aos relevantes, se a destinação dos lotes for conhecida).':'Falsificação: situação de alerta rápido (item 9.1).'}</b> Notificar no Notivisa antes do alerta; enviar em até 72 h da confirmação do fato para rapidalerts@anvisa.gov.br, com cópia para a autoridade estadual.</div>`;
  } else if(v==='III'){
   h+=`<div class="note">Classe III: o alerta rápido só é usado se a autoridade competente julgar a razão relevante.${a?'':' <button type="button" class="btn" data-a23-prep="'+e(sid)+'">Preparar alerta mesmo assim</button>'}</div>`;
  }
  if(a){h+=`<div class="grid">${field('alertas.'+i+'.product','Produto')}${field('alertas.'+i+'.lot','Lote')}${field('alertas.'+i+'.validity','Validade')}${field('alertas.'+i+'.confirmed','Confirmação do fato — data e hora','datetime-local')}</div>`
   +(a.confirmed?`<div class="note"><b>Enviar o alerta até ${e(prazo72(a.confirmed))}</b> (72 h da confirmação).</div>`:'')
   +`<div class="toolbar"><button type="button" class="btn" data-a23-painel>Completar no painel de alerta rápido →</button></div>`}
  return h+'</div>'}

 /* ---------- painel único ---------- */
 function painel(){
  const l=alertas();
  const card=(a,i)=>{const p=prazo72(a.confirmed);const cls=a.class||'';return `<details class="panel a23-alerta" data-a23-card="${i}"${abertos.has('card'+i)||!cls?' open':''}><summary><b>Alerta ${i+1}</b> · ${e(cls||'classe a definir')}${a.product?' · '+e(a.product):''}${a.origem&&a.origem!=='fechamento'&&a.origem!=='fluxo'?' · item: '+e(secTitulo(a.origem)):''}</summary>
   <div class="grid">${field('alertas.'+i+'.situacao','Situação (item 9.1)','select',SITUACOES.map(x=>x[1]))}${field('alertas.'+i+'.class','Trata-se de','select',['Desvio de qualidade Classe I','Desvio de qualidade Classe II','Falsificação','Outros'])}${field('alertas.'+i+'.confirmed','Confirmação do fato — data e hora','datetime-local')}${field('alertas.'+i+'.notivisa','Número NOTIVISA/PERIWEB (antes do envio)')}</div>
   ${p?`<div class="note warning"><b>Enviar até ${e(p)}</b> — 72 h da confirmação do fato, para rapidalerts@anvisa.gov.br, com cópia para a autoridade estadual quando emitido por vigilância municipal.</div>`:'<p class="mini">Informe a confirmação do fato para calcular o prazo de 72 h.</p>'}
   <div class="grid">${[['product','Produto'],['registration','Número de registro'],['trade','Nome comercial'],['generic','DCI / nome genérico'],['form','Forma farmacêutica'],['dose','Dose'],['lot','Lote / granel'],['validity','Validade'],['presentation','Apresentação comercial'],['manufacture','Data de fabricação'],['holder','Detentor do registro'],['manufacturer','Fabricante — nome, endereço, RT e contato'],['site','Local específico de fabricação'],['to','Destinatário'],['recallCompany','Empresa que realiza o recolhimento'],['recallNumber','Número do recolhimento']].map(([k,t])=>field('alertas.'+i+'.'+k,t)).join('')}
   ${field('alertas.'+i+'.deviation','Detalhes do desvio / motivação','textarea')}${field('alertas.'+i+'.distribution','Informações sobre distribuição/exportações','textarea')}${field('alertas.'+i+'.authorityAction','Ação tomada pela autoridade emissora','textarea')}${field('alertas.'+i+'.proposedAction','Ação proposta','textarea')}${field('alertas.'+i+'.issuer','Autoridade emissora')}${field('alertas.'+i+'.contact','Pessoa de contato / telefone')}${field('alertas.'+i+'.signature','Identificação do signatário')}${field('alertas.'+i+'.date','Data','date')}${field('alertas.'+i+'.time','Hora','time')}</div>
   <div class="toolbar"><button type="button" class="btn primary" data-a23-export="${i}">Baixar Anexo II do POP-023 (.docx)</button><button type="button" class="btn" data-a23-del="${i}">Remover este alerta</button></div></details>`};
  return `<div class="panel a23-painel"><h3>Alerta rápido</h3>
   <p class="mini">Um registro por produto. Situações que exigem alerta (item 9.1): ${SITUACOES.map(x=>e(x[1])).join('; ')}. A notificação no Notivisa é feita antes do envio e o número entra no Anexo II. Informações indisponíveis devem constar como “Não disponível”. Não há envio automático.</p>
   ${l.length?l.map(card).join(''):'<p class="mini">Nenhum alerta registrado. A pergunta sobre desvio de qualidade nos itens do roteiro também cria o registro.</p>'}
   <div class="toolbar"><button type="button" class="btn" data-a23-novo>+ Registrar alerta rápido</button></div>
   ${caixa23()}</div>`}

 /* troca as duas telas antigas pelo painel único */
 const snvsOrig=snvsView;
 snvsView=function(){const h=snvsOrig();const i=h.indexOf('<div class="panel"><h3>Alerta rápido</h3>'),j=h.indexOf('<div class="panel"><h3>Depois do envio</h3>');return i>=0&&j>i?h.slice(0,i)+painel()+h.slice(j):h+painel()};
 const peerOrig=peerView;
 peerView=function(){const n=alertas().length;return peerOrig().replace(/<details style="margin-top:12px"><summary><b>Alerta rápido[\s\S]*?<\/details>/,`<div class="note" style="margin-top:12px"><b>Alerta rápido:</b> ${n?n+' registro(s)':'nenhum registro'} — preparado na aba “Fluxo SNVS · POP 23”. <button type="button" class="btn" data-a23-painel>Abrir painel de alerta rápido</button></div>`)};

 /* decora as telas de item */
 function decora(){
  const tela=document.querySelector('.dist-section-screen');if(!tela)return;
  const bloco=tela.querySelector('[data-chk]'),sid=bloco&&bloco.getAttribute('data-chk');if(!sid)return;
  const body=tela.querySelector('.sectionbody');if(!body)return;
  if(!body.querySelector('.a23-orient')){const d=document.createElement('div');d.className='a23-orient';d.innerHTML=(SEC_DESVIO.includes(sid)?caixa23():'')+caixa32(sid);const ref=body.querySelector('.sm-box:not(.a23-box)');ref?ref.after(d):body.prepend(d)}
  if(SEC_DESVIO.includes(sid)){let q=body.querySelector('.a23-slot');if(!q){q=document.createElement('div');q.className='a23-slot';bloco.after(q)}const h=perguntaItem(sid);if(q.__h!==h){q.__h=h;q.innerHTML=h}}}
 /* a tela de item também é redesenhada fora do renderITab (navegação da casca): observa */
 let agendado=false;new MutationObserver(()=>{if(agendado)return;agendado=true;requestAnimationFrame(()=>{agendado=false;try{decora()}catch(err){console.error(err)}})}).observe(document.documentElement,{childList:true,subtree:true});
 const rOrig=renderITab;renderITab=function(){const r=rOrig.apply(this,arguments);try{decora()}catch(err){console.error(err)}return r};

 document.addEventListener('toggle',ev=>{const d=ev.target;if(!d||!d.matches)return;const k=d.matches('[data-a23-box]')?d.getAttribute('data-a23-box'):d.matches('[data-a23-card]')?'card'+d.getAttribute('data-a23-card'):null;if(k){if(d.open)abertos.add(k);else abertos.delete(k)}},true);
 document.addEventListener('click',ev=>{const b=ev.target.closest&&ev.target.closest('[data-a23-classe],[data-a23-prep],[data-a23-painel],[data-a23-novo],[data-a23-export],[data-a23-del]');if(!b)return;ev.preventDefault();
  if(b.dataset.a23Classe){const sid=b.dataset.sec,v=b.dataset.a23Classe,D=d23();D[sid]=D[sid]===v?'':v;const cur=D[sid];
   if(cur&&cur!=='nao'&&cur!=='III'){const i=alertaDoItem(sid,true),a=alertas()[i];a.class=CLASSE_ANEXO[cur];a.situacao=SITUACOES[cur==='falsi'?1:0][1]}
   else if(cur==='III'){const i=alertaDoItem(sid,false);if(i>=0){alertas()[i].class='Outros';alertas()[i].deviation=alertas()[i].deviation||'Desvio de qualidade classe III.'}}
   save();renderITab();return}
  if(b.dataset.a23Prep){const i=alertaDoItem(b.dataset.a23Prep,true),a=alertas()[i];a.class='Outros';a.deviation=a.deviation||'Desvio de qualidade classe III.';save();renderITab();return}
  if(b.hasAttribute('data-a23-painel')){state.view='closing';state.ctab='snvs';save();renderClosing();window.scrollTo(0,0);return}
  if(b.hasAttribute('data-a23-novo')){alertas().push({origem:'fluxo'});abertos.add('card'+(alertas().length-1));save();renderCTab();return}
  if(b.dataset.a23Export!==undefined){const bak=state.alert;state.alert=alertas()[+b.dataset.a23Export]||{};try{exportAlert()}finally{state.alert=bak}return}
  if(b.dataset.a23Del!==undefined){if(!confirm('Remover este registro de alerta rápido?'))return;const i=+b.dataset.a23Del,a=alertas()[i];if(a&&a.origem&&d23()[a.origem])delete d23()[a.origem];alertas().splice(i,1);abertos.clear();save();renderCTab();return}
 },true);
 /* prazo do painel acompanha a data digitada */
 document.addEventListener('change',ev=>{const t=ev.target;if(t&&t.dataset&&/^alertas\.\d+\.(confirmed|class)$/.test(t.dataset.path||'')){setTimeout(()=>{if(document.querySelector('.a23-painel'))renderCTab();else renderITab()},0)}});

 const st=document.createElement('style');st.id='a23-style';st.textContent='.a23-box{margin:8px 0}.a23-box ul{margin:0 0 8px;padding-left:18px;font-size:.84rem;line-height:1.45}.a23-box li{margin:2px 0}.a23-q{margin:14px 0 6px;padding:14px;border:1px solid #e7cf9c;border-radius:12px;background:#fdf8ec}.a23-t{margin:0 0 4px}.a23-op{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin:10px 0}.a23-op button{min-height:46px;border:1px solid #c7d5de;border-radius:8px;background:#fff;font:inherit;font-weight:650;color:#35505f;cursor:pointer}.a23-op button[aria-pressed=true]{background:#8a5c12;border-color:#8a5c12;color:#fff}.a23-alerta>summary{cursor:pointer;min-height:44px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}.a23-painel .grid{margin-top:8px}';document.head.appendChild(st);
})();
