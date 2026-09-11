/* Drogaria — composição textual final do relatório revisado. */
(() => {
  'use strict';
  if (window.DrogariaReportFinal) return;

  const text = v => String(v == null ? '' : v).trim();
  const sec = (s,n) => s.meta?.drogaria_secoes?.[n] || {answers:{},fields:{},docs:[],items:[]};
  const fmtDate = v => { if(!v)return ''; if(/^\d{4}-\d{2}-\d{2}$/.test(v)){const [y,m,d]=v.split('-');return `${d}/${m}/${y}`;} return String(v); };
  const join = (values, sep=', ') => values.filter(v=>text(v)).join(sep);
  const sentenceList = a => { const v=a.filter(Boolean); if(!v.length)return ''; if(v.length===1)return v[0]; return v.slice(0,-1).join(', ')+' e '+v.at(-1); };
  const yes = v => v === 'sim';
  const no = v => v === 'nao';
  const h = (B,x) => B.push({t:'h1',x});
  const h2 = (B,x) => B.push({t:'h2',x});
  const p = (B,x) => { if(text(x)) B.push({t:'p',x:String(x)}); };
  const kv = (B,k,v) => { if(text(v)) B.push({t:'kv',k,v:String(v)}); };

  const productLabels = {
    cosmeticos:'Cosméticos', higiene:'produtos de higiene', correlatos:'dispositivos médicos / correlatos', alimentos:'alimentos permitidos', perfumes:'perfumes',
    nao_controlados:'medicamentos não sujeitos a controle especial', antimicrobianos:'antimicrobianos', controlados:'medicamentos sujeitos a controle especial da Portaria SVS/MS 344/98',
    c2:'retinoides da Lista C2', cannabis:'produtos de Cannabis', glp1:'análogos GLP-1', termolabeis:'medicamentos termolábeis'
  };
  const installLabels = {
    predio_rua:'prédio comercial independente / imóvel de rua', mercado:'área independente situada dentro de mercado, antes da área de vendas', galeria:'galeria comercial', shopping:'shopping center', pavimento_predio:'pavimento de prédio comercial'
  };
  const areaLabels = {
    area_dispensacao:'área de dispensação', area_controlados:'sala de medicamentos sujeitos a controle especial', area_servicos:'sala de prestação de serviços farmacêuticos', area_administrativa:'sala administrativa',
    area_estoque_recebimento:'sala de estoque e recebimento de produtos', area_dml:'Depósito de Materiais de Limpeza (DML)', area_refeicoes:'área para refeições', area_vestiario:'vestiário de funcionários',
    san_cliente_masc:'sanitário de clientes masculino', san_cliente_fem:'sanitário de clientes feminino', san_func_masc:'sanitário de funcionários masculino', san_func_fem:'sanitário de funcionários feminino', san_pcd:'sanitário acessível para PCD'
  };
  const structuralLabels = {
    nc_poeira:'acúmulo de poeira ou sujeira', nc_pragas:'presença de pragas vivas, mortas ou vestígios', nc_mofo:'sinais de mofo em paredes ou superfícies',
    nc_mobiliario:'mobiliário em mau estado de conservação', nc_piso:'piso, paredes ou teto em mau estado de conservação'
  };
  const coldIssueLabels = {
    nc_temperatura:'temperatura fora da faixa de conservação', nc_controle:'ausência de controle de temperatura', nc_disposicao:'disposição inadequada dos produtos',
    nc_higienizacao:'ausência ou falha de higienização', nc_termohigrometro:'termohigrômetro ausente ou inadequado'
  };
  const friendlyField = {
    nome_funcionario:'nome do funcionário', tipo:'tipo de ASO', empresa_responsavel:'empresa responsável', cnpj_empresa_responsavel:'CNPJ', data_emissao:'emissão', medico_assinante:'médico assinante', crm:'CRM',
    numero_certidao:'nº da certidão', rotina:'rotina do estabelecimento', responsavel_tecnico:'responsável técnico', numero_conselho_responsavel_tecnico:'CRF do responsável técnico', responsavel_tecnico_substituto:'responsável técnico substituto', numero_conselho_responsavel_tecnico_substituto:'CRF do substituto',
    numero_certificado:'nº do certificado', empresa_executora:'empresa executora', cnpj_empresa_executora:'CNPJ da executora', cevs_empresa_executora:'CEVS da executora', data_realizacao:'data de realização', validade:'validade',
    tipo_documento:'tipo de documento', numero:'número', projeto:'projeto', endereco_completo:'endereço'
  };

  function chunks(blocks){
    const out={intro:[]}; let key='intro';
    for(const b of blocks||[]){ if(b.t==='h1'&&/^\d+\s/.test(b.x||'')) key=(b.x||'').match(/^\d+/)[0]; (out[key]||=[]).push(b); }
    return out;
  }
  function documentDetail(d){
    const values=Object.entries(d?.fields||{}).filter(([,v])=>text(v)).map(([k,v])=>(friendlyField[k]||k.replaceAll('_',' '))+': '+v);
    return values.length ? `${d.title} — ${values.join('; ')}.` : '';
  }
  function documentsPresented(B,docs){
    const list=(docs||[]).filter(d=>d.includeInReport!==false);
    if(!list.length)return;
    p(B,'Documentos apresentados:');
    let n=0;
    for(const d of list){const detail=documentDetail(d);if(detail)B.push({t:'num',n:++n,x:detail});}
  }
  function addIssue(out,id,card,group,phrase,refs=[]){
    if(!text(phrase)||out.some(x=>x.id===id))return;
    out.push({id,id_pergunta:id,card,grupo:group,resposta:'nao',refs,frase_relatorio:phrase,irregularidade_gerada:true,documento_pendente:false,documento_apresentado:false,pendencia_fundamento:'',medida:null});
  }
  function structuralIssues(s,out){
    const map={area_recebimento:'4.1 Área de Recebimento de Produtos',area_dispensacao:'4.2 Área de Dispensação',area_armazenamento:'4.3 Área de Armazenamento',area_dml:'4.6 Depósito de Material de Limpeza — DML',area_refeitorio:'4.7 Refeitório',area_sanitarios:'4.8 Vestiário e Sanitários'};
    for(const [name,title] of Object.entries(map)){
      const f=sec(s,name).fields||{};
      for(const [k,label] of Object.entries(structuralLabels))if(f[k])addIssue(out,`final_${name}_${k}`,2,title,`Foi observada ${label} em ${title.replace(/^\d+\.\d+\s+/,'').toLowerCase()}.`);
      if(f.nc_outro&&text(f.nc_outro_texto))addIssue(out,`final_${name}_nc_outro`,2,title,`Foi observada a seguinte não conformidade estrutural em ${title.replace(/^\d+\.\d+\s+/,'').toLowerCase()}: ${f.nc_outro_texto}.`);
    }
  }
  function manualIssues(s,base){
    const out=(base.irregularities||[]).filter(r=>r.id!=='rev_servicos_farmaceuticos_sifao').map(r=>({...r}));
    const a=s.meta?.section1_answers||{};
    if(no(a.lic_match))addIssue(out,'final_s1_lic_match',1,'Considerações gerais','Os dados e atividades observados não correspondem à licença sanitária.');
    if(no(a.team_uniform))addIssue(out,'final_s1_uniformes',1,'Considerações gerais','Nem todos os funcionários estavam identificados e com uniformes limpos.');
    if(no(a.rt_present))addIssue(out,'final_s1_rt_present',1,'Considerações gerais','O farmacêutico não estava presente no momento da inspeção.');
    if(no(a.rt_id))addIssue(out,'final_s1_rt_id',1,'Considerações gerais','O farmacêutico presente não possuía identificação específica por uniforme ou crachá.');
    if(no(a.doc_aso))addIssue(out,'final_s1_aso',1,'Considerações gerais','Não foram apresentados os Atestados de Saúde Ocupacional aplicáveis aos funcionários.');
    const ag=sec(s,'area_geral'); if(no(ag.answers.acesso))addIssue(out,'final_area_acesso',2,'4 Área Física','O acesso ao estabelecimento não é independente e não se enquadra nas exceções aplicáveis.');
    structuralIssues(s,out);
    const ad=sec(s,'area_dispensacao');
    if(Object.keys(ad.fields||{}).length||Object.keys(ad.answers||{}).length){
      if(!ad.fields.crt_visivel)addIssue(out,'final_disp_crt',2,'4.2 Área de Dispensação','A Certidão de Regularidade Técnica não estava afixada em local visível ao público.');
      if(!ad.fields.aviso_medicamentos)addIssue(out,'final_disp_automedicacao',2,'4.2 Área de Dispensação','Não estava exposto o cartaz de orientação sobre automedicação.');
      if(!ad.fields.antifumo)addIssue(out,'final_disp_antifumo',2,'4.2 Área de Dispensação','Não estava exposto o aviso de proibição de uso de produtos fumígenos.');
    }
    const ar=sec(s,'area_refeitorio'); if(yes(ar.answers.pia))addIssue(out,'final_refeitorio_sifao',2,'4.7 Refeitório','Havia acondicionamento de alimentos na área do sifão da pia do refeitório.');
    const tb=sec(s,'termolabeis');
    for(const item of tb.items||[])for(const [k,label] of Object.entries(coldIssueLabels))if(item[k])addIssue(out,`final_cold_${item.id}_${k}`,3,'5 Medicamentos Termolábeis',`No equipamento ${text(item.equipamento)||text(item.tipo)||'avaliado'} foi observada ${label}.`);
    if(yes(tb.answers.pop)){
      if(!tb.fields.pop_monitoramento)addIssue(out,'final_cold_pop_monitoramento',3,'5 Medicamentos Termolábeis','O POP de termolábeis não contempla adequadamente o monitoramento e a conservação.');
      if(!tb.fields.pop_corretivas)addIssue(out,'final_cold_pop_corretivas',3,'5 Medicamentos Termolábeis','O POP de termolábeis não define medidas corretivas para desvios de temperatura.');
      if(!tb.fields.pop_limpeza)addIssue(out,'final_cold_pop_limpeza',3,'5 Medicamentos Termolábeis','O POP de termolábeis não define procedimentos para limpeza dos equipamentos.');
      if(!tb.fields.pop_emergencias)addIssue(out,'final_cold_pop_emergencias',3,'5 Medicamentos Termolábeis','O POP de termolábeis não define procedimentos para situações de emergência.');
    }
    const tr=sec(s,'documentos_rastreabilidade');
    if(no(tr.answers.registro_receita)){
      const misses={falta_lote:'lote',falta_quantidade:'quantidade dispensada',falta_data:'data da dispensação',falta_adquirente:'dados do adquirente',falta_dispensador:'identificação do responsável pela dispensação'};
      const m=Object.entries(misses).filter(([k])=>tr.fields[k]).map(([,v])=>v);
      addIssue(out,'final_trace_receita',6,'8.2 Rastreabilidade',`Os dados de dispensação não estavam registrados integralmente nas receitas retidas${m.length?`; foram observadas ausências de ${sentenceList(m)}`:''}.`);
    }
    if(no(tr.answers.correspondencia_sistema))addIssue(out,'final_trace_sistema',6,'8.2 Rastreabilidade','Os dados de dispensação registrados nas prescrições não correspondem aos registros do sistema informatizado.');
    const rm=sec(s,'documentos_remota');
    if(no(rm.answers.site_portaria344))addIssue(out,'final_remota_site',6,'8.3 Solicitação remota','O site próprio não atende às determinações aplicáveis à comercialização remota de medicamentos sujeitos a controle especial.');
    if(no(rm.answers.remota_classes_legal))addIssue(out,'final_remota_classes',6,'8.3 Solicitação remota','A venda remota de medicamentos controlados e/ou antimicrobianos não atende integralmente à legislação aplicável.');
    return out;
  }

  function section1(B,s){
    const m=s.meta||{},initial=m.finalidade==='Inicial',address=text(m.endereco_completo)||join([m.endereco,m.endereco_numero,m.complemento,m.bairro,m.municipio,m.estado,m.cep]);
    h(B,'1 IDENTIFICAÇÃO DA EMPRESA');
    kv(B,'1.1. Razão Social',m.razao); kv(B,'1.2. Nome Fantasia',m.fantasia); kv(B,'1.3. CNPJ',m.cnpj); kv(B,'1.4. Endereço',address);
    kv(B,'1.5. Responsável Legal',join([m.resp_legal,m.cpf_resp_legal&&`CPF: ${m.cpf_resp_legal}`],' — '));
    kv(B,'1.6. Farmacêutico Responsável Técnico',join([m.rt,m.crf&&`CRF: ${m.crf}`],' — '));
    kv(B,'Responsável Técnico Substituto',join([m.substituto,m.substituto_crf&&`CRF: ${m.substituto_crf}`],' — '));
    if(initial){
      kv(B,'1.7. Licença de Funcionamento','Trata-se de solicitação de licença sanitária inicial.');
      kv(B,'Atividades pretendidas',(s.fields?.atividades_pretendidas||[]).join('; '));
      kv(B,'1.8. Autorização de Funcionamento — AFE','Trata-se de solicitação de licença sanitária inicial.');
      kv(B,'Atividades pretendidas perante a Anvisa',(s.fields?.atividades_pretendidas||[]).join('; '));
    }else{
      kv(B,'1.7. Licença de Funcionamento CEVS/CMVS nº',m.cevs); kv(B,'Válida até',fmtDate(m.lic_validade)); kv(B,'Atividades licenciadas',(s.fields?.atividades_licenciadas||[]).join('; '));
      kv(B,'1.8. Autorização de Funcionamento — AFE nº',m.afe); kv(B,'Atividades autorizadas',(m.atividades_autorizadas||[]).join('; '));
    }
    for(const [key,label] of [['vacinacao','Licença sanitária específica — vacinação'],['eac','Licença sanitária específica — EAC']]){
      const d=m.licencas_especificas?.[key]?.campos;if(!d)continue;
      const bits=[d.numero_cevs_ou_cmvs&&`CEVS/CMVS ${d.numero_cevs_ou_cmvs}`,d.cnae&&`CNAE ${d.cnae}`,d.atividade_economica,d.validade&&key==='vacinacao'&&`válida até ${fmtDate(d.validade)}`].filter(Boolean);
      kv(B,label,bits.join(' — '));
    }
  }
  function section2(B,s){
    const m=s.meta||{};h(B,'2 INSPEÇÃO');
    const period=[m.data&&fmtDate(m.data),m.inicio&&`início ${m.inicio}`,m.fim&&`término ${m.fim}`].filter(Boolean).join(' — ');kv(B,'2.1. Período',period);
    const products=(m.tipos_produtos||[]).map(k=>productLabels[k]||k);kv(B,'2.2. Tipos de produtos',sentenceList(products));kv(B,'2.3. Período da última inspeção',m.ultima_inspecao_periodo||m.ultima_inspecao);
    const contacts=m.contatos_inspecao||[];if(contacts.length){p(B,'Pessoa(s) contatada(s) na inspeção:');contacts.forEach((c,i)=>B.push({t:'num',n:i+1,x:join([c.nome,c.documento&&`Documento: ${c.documento}`,c.telefone&&`Tel.: ${c.telefone}`,c.email&&`E-mail: ${c.email}`],' — ')}));}
  }
  function section3(B,s){
    const m=s.meta||{},a=m.section1_answers||{};h(B,'3 CONSIDERAÇÕES GERAIS');p(B,'Trata-se de um comércio varejista de produtos farmacêuticos sem manipulação de fórmulas (CNAE 4771-7/01).');
    p(B,`Horário de funcionamento: Seg–Sex: ${text(m.horario_semana)||'não informado'}; Sáb: ${text(m.horario_sabado)||'não informado'}; Dom: ${text(m.horario_domingo)||'não informado'}.`);
    if(text(m.placa_externa))p(B,`Possui denominação em placa externa: ${m.placa_externa}.`);
    let people=`Conta com ${text(m.funcionarios)||'quantidade não informada'} funcionários, entre eles ${text(m.farmaceuticos)||'quantidade não informada'} farmacêuticos.`;
    if(yes(a.team_uniform))people+=' Todos utilizam uniformes limpos e estão identificados.';else if(no(a.team_uniform))people+=' Nem todos os funcionários estavam identificados e com uniformes limpos.';
    if(yes(a.rt_present))people+=' O farmacêutico estava presente no momento da inspeção.';else if(no(a.rt_present))people+=' O farmacêutico não estava presente no momento da inspeção.';
    if(yes(a.rt_id))people+=' O farmacêutico possui identificação específica através de uniforme ou crachá.';else if(no(a.rt_id))people+=' O farmacêutico presente não possuía identificação específica através de uniforme ou crachá.';p(B,people);
    if(yes(a.alteracao_estrutural))p(B,'Em relação à área física, houve alterações significativas na estrutura e nas instalações da empresa desde a última inspeção efetuada.');else if(no(a.alteracao_estrutural))p(B,'Em relação à área física, não houve alterações significativas na estrutura e nas instalações da empresa desde a última inspeção efetuada.');
    if(yes(a.lic_match))p(B,'Os dados e atividades observados correspondem à licença sanitária.');else if(no(a.lic_match))p(B,'Os dados e atividades observados não correspondem à licença sanitária.');
    if(no(a.doc_aso))p(B,'Não foram apresentados os Atestados de Saúde Ocupacional aplicáveis aos funcionários.');
    documentsPresented(B,m.section1_documentos);p(B,m.consideracoes_gerais);
  }
  function section4(B,s){
    const g=sec(s,'area_geral'),f=g.fields||{},a=g.answers||{};h(B,'4 ÁREA FÍSICA');
    const instal=f.tipo_instalacao==='outro'?(f.tipo_instalacao_outro||'outro tipo de imóvel'):(installLabels[f.tipo_instalacao]||'configuração não informada');
    const pav=[f.pav_terreo&&'térreo',f.pav_unico&&'pavimento único',f.pav_subsolo&&'subsolo',f.pav_1&&'1º andar',f.pav_2&&'2º andar',f.pav_3&&'3º andar ou superior'].filter(Boolean);
    let intro=`O estabelecimento está instalado em ${instal}`+(pav.length?` e conta com ${sentenceList(pav)}`:'')+'.';if(yes(a.acesso))intro+=' O acesso ao estabelecimento é independente ou se enquadra nas exceções aplicáveis para galerias, shoppings e supermercados.';else if(no(a.acesso))intro+=' O acesso ao estabelecimento não é independente e não se enquadra nas exceções aplicáveis.';p(B,intro);
    const areas=Object.entries(areaLabels).filter(([k])=>f[k]).map(([,v])=>v);if(areas.length)p(B,`A empresa conta com as seguintes áreas: ${sentenceList(areas)}.`);
    if(yes(a.caixa_agua)){p(B,`A empresa conta com caixa d’água${yes(a.procedimento_caixa)?', tendo sido apresentado o procedimento que trata de sua limpeza':no(a.procedimento_caixa)?', porém não foi apresentado o procedimento que trata de sua limpeza':''}.`);}else if(no(a.caixa_agua))p(B,`A empresa não conta com caixa d’água. Forma de abastecimento informada: ${text(f.origem_agua)||'não informada'}.`);
    if(f.ventilacao){const vent=f.ventilacao==='natural'?'ventilação natural':f.ventilacao==='ar'?'equipamento de ar-condicionado':'ventilação natural e equipamento de ar-condicionado';let t=`A ventilação/climatização do estabelecimento ocorre por ${vent}.`;if(f.ventilacao!=='natural'){if(yes(a.manutencao_ar))t+=' Foi apresentado registro de manutenção do equipamento de ar-condicionado.';else if(no(a.manutencao_ar))t+=' Não foi apresentado registro de manutenção do equipamento de ar-condicionado.';}p(B,t);}
    const docs=[];for(const d of g.docs||[])if(d.includeInReport!==false)docs.push(documentDetail(d));if(text(f.limpeza_caixa_numero))docs.unshift(`Certificado de limpeza de caixa d’água nº ${f.limpeza_caixa_numero}.`);if(text(f.manutencao_ar_data)||text(f.manutencao_ar_empresa))docs.push(`Comprovante de manutenção preventiva do equipamento de ar-condicionado${text(f.manutencao_ar_empresa)?` emitido por ${f.manutencao_ar_empresa}`:''}${text(f.manutencao_ar_data)?` em ${fmtDate(f.manutencao_ar_data)}`:''}.`);if(docs.length){p(B,'Documentos apresentados:');docs.filter(Boolean).forEach((x,i)=>B.push({t:'num',n:i+1,x}));}
    area41(B,s);area42(B,s);area43(B,s);area44(B,s);area45(B,s);area46(B,s);area47(B,s);area48(B,s);
  }
  function structuralText(B,b,title){const f=b.fields||{},items=Object.entries(structuralLabels).filter(([k])=>f[k]).map(([,v])=>v);if(f.nc_outro&&text(f.nc_outro_texto))items.push(f.nc_outro_texto);if(items.length)p(B,`Foram observadas as seguintes não conformidades estruturais em ${title}: ${sentenceList(items)}.`);}
  function area41(B,s){const b=sec(s,'area_recebimento');if(!Object.keys(b.answers||{}).length&&!Object.keys(b.fields||{}).length)return;h2(B,'4.1 Área de Recebimento de Produtos');let t='';if(yes(b.answers.area_identificada))t+='O estabelecimento possui área específica/designada para recebimento de produtos. ';else if(no(b.answers.area_identificada))t+='O estabelecimento não possui área específica/designada para recebimento de produtos. ';if(yes(b.answers.conferencia))t+='No recebimento são conferidos o estado de conservação, número de lote, prazo de validade, autenticidade e origem dos produtos.';else if(no(b.answers.conferencia))t+='No recebimento não são conferidos integralmente o estado de conservação, número de lote, prazo de validade, autenticidade e origem dos produtos.';p(B,t);if(yes(b.answers.pop))p(B,'Foi apresentado Procedimento Operacional Padrão (POP) da atividade.');else if(no(b.answers.pop))p(B,'Não foi apresentado Procedimento Operacional Padrão (POP) da atividade.');structuralText(B,b,'área de recebimento de produtos');}
  function area42(B,s){const b=sec(s,'area_dispensacao');if(!Object.keys(b.answers||{}).length&&!Object.keys(b.fields||{}).length)return;h2(B,'4.2 Área de Dispensação');const f=b.fields||{},shown=[],missing=[];[[f.crt_visivel,'Certidão de Regularidade Técnica emitida pelo Conselho Regional de Farmácia de São Paulo'],[f.aviso_medicamentos,'cartaz contendo a orientação: “Medicamentos podem causar efeitos indesejados. Evite a automedicação: Informe-se com o farmacêutico”'],[f.antifumo,'aviso quanto à proibição de uso de produtos fumígenos, conforme Lei Estadual nº 13.541/09']].forEach(([ok,l])=>(ok?shown:missing).push(l));if(shown.length)p(B,`Encontravam-se afixados em local visível ao público: ${sentenceList(shown)}.`);if(missing.length)p(B,`Não foram identificados em local visível ao público: ${sentenceList(missing)}.`);const a=b.answers||{};let t=[];if(yes(a.extintor))t.push('o acesso ao extintor estava livre e a recarga válida');else if(no(a.extintor))t.push('o acesso ao extintor ou a validade da recarga apresentava não conformidade');if(yes(a.higienizacao))t.push('havia registros de higienização da área');else if(no(a.higienizacao))t.push('não foram apresentados registros de higienização da área');if(yes(a.monitoramento))t.push('as condições de conservação eram controladas e monitoradas');else if(no(a.monitoramento))t.push('as condições de conservação não eram adequadamente controladas e monitoradas');if(t.length)p(B,`Na área de dispensação, ${sentenceList(t)}.`);if(yes(a.termohigrometro)||text(f.temp_momento)||text(f.umid_momento)){p(B,`O ambiente conta com termohigrômetro. No momento da inspeção foram registrados${text(f.temp_momento)?` ${f.temp_momento} °C`:''}${text(f.umid_momento)?` e ${f.umid_momento}% de umidade relativa`:''}. A equipe orientou a reinicialização das leituras após a aferição.`);}structuralText(B,b,'área de dispensação');}
  function area43(B,s){const b=sec(s,'area_armazenamento');if(!Object.keys(b.answers||{}).length&&!Object.keys(b.fields||{}).length)return;h2(B,'4.3 Área de Armazenamento');const f=b.fields||{},a=b.answers||{},loc=[f.local_dispensacao&&'área de dispensação',f.local_estoque&&'estoque de produtos',f.local_outro&&(f.local_outro_texto||'outro ambiente')].filter(Boolean);p(B,`O armazenamento é realizado ${loc.length?'na '+sentenceList(loc):'em área informada no roteiro'}.`);let t=[];if(yes(a.organizado))t.push('os ambientes são mantidos organizados, com produtos dispostos sobre prateleiras');else if(no(a.organizado))t.push('foram observadas falhas de organização ou disposição dos produtos');if(yes(a.luz))t.push('os produtos estão protegidos da ação direta da luz solar');else if(no(a.luz))t.push('há produtos sujeitos à ação direta da luz solar');if(yes(a.piso_parede))t.push('as caixas permanecem distantes do piso e das paredes');else if(no(a.piso_parede))t.push('há caixas encostadas no piso ou nas paredes');if(t.length)p(B,`De maneira geral, ${sentenceList(t)}.`);if(yes(a.inflamaveis))p(B,'Verificada ausência de produtos inflamáveis.');else if(no(a.inflamaveis))p(B,'Foram encontrados produtos inflamáveis no armazenamento.');if(yes(a.hospitalares))p(B,'Não foi constatada a existência de medicamentos em embalagens hospitalares ou em outras embalagens cuja comercialização não é permitida.');else if(no(a.hospitalares))p(B,'Foram constatados medicamentos em embalagens hospitalares ou em outras embalagens cuja comercialização não é permitida.');if(yes(a.monitoramento))p(B,'O armazenamento possui monitoramento de temperatura e umidade, com termohigrômetro e registros em planilha ou sistema, conforme os dados informados no roteiro.');else if(no(a.monitoramento))p(B,'Não há monitoramento adequado de temperatura e umidade no armazenamento.');structuralText(B,b,'área de armazenamento');}
  function area44(B,s){const b=sec(s,'area_residuos');if(!Object.keys(b.answers||{}).length&&!Object.keys(b.fields||{}).length)return;h2(B,'4.4 Armazenamento Temporário de Resíduos');const a=b.answers||{};let t=[];if(yes(a.abrigo))t.push('o abrigo de resíduos é isolado, identificado, de acesso restrito e com superfícies laváveis');else if(no(a.abrigo))t.push('o abrigo de resíduos não atende integralmente às condições verificadas');if(yes(a.lixeiras))t.push('as lixeiras possuem pedal');else if(no(a.lixeiras))t.push('há lixeiras sem pedal');if(yes(a.identificacao)||b.fields?.identificacao)t.push('as lixeiras estão identificadas quanto ao tipo de resíduo');else if(no(a.identificacao))t.push('há lixeiras sem identificação quanto ao tipo de resíduo');if(t.length)p(B,`${sentenceList(t)}.`);}
  function area45(B,s){const b=sec(s,'area_vencidos');if(!Object.keys(b.answers||{}).length&&!Object.keys(b.fields||{}).length)return;h2(B,'4.5 Produtos vencidos / violados');if(yes(b.answers.segregacao))p(B,'Produtos vencidos, violados ou suspeitos são mantidos segregados, identificados e em local seguro, fora da dispensação.');else if(no(b.answers.segregacao))p(B,'Foram observadas falhas na segregação, identificação ou guarda de produtos vencidos, violados ou suspeitos.');}
  function area46(B,s){const b=sec(s,'area_dml');if(!Object.keys(b.answers||{}).length&&!Object.keys(b.fields||{}).length)return;h2(B,'4.6 Depósito de Material de Limpeza — DML');if(yes(b.answers.armazenamento))p(B,'Os materiais de limpeza e germicidas estão regularizados e guardados em local específico, designado e identificado.');else if(no(b.answers.armazenamento))p(B,'Foram observadas inadequações na guarda dos materiais de limpeza e germicidas.');structuralText(B,b,'DML');}
  function area47(B,s){const b=sec(s,'area_refeitorio');if(!Object.keys(b.answers||{}).length&&!Object.keys(b.fields||{}).length)return;h2(B,'4.7 Refeitório');const a=b.answers||{},f=b.fields||{};let t=[];if(yes(a.separado))t.push('a área de refeições é separada dos demais ambientes');else if(no(a.separado))t.push('a área de refeições não está adequadamente separada dos demais ambientes');if(yes(a.lavagem_maos))t.push('dispõe de condições para lavagem das mãos com papel-toalha e sabonete líquido');else if(no(a.lavagem_maos))t.push('não dispõe integralmente dos itens para lavagem das mãos');if(t.length)p(B,`${sentenceList(t)}.`);const eq=[f.microondas&&'aparelho de micro-ondas',f.refrigerador&&'refrigerador',f.filtro&&'filtro de água com registro de troca'].filter(Boolean);if(eq.length)p(B,`O refeitório dispõe de ${sentenceList(eq)}.`);if(yes(a.pia))p(B,'Há acondicionamento de alimentos na área do sifão da pia.');else if(no(a.pia))p(B,'Não há acondicionamento de alimentos na área do sifão da pia.');structuralText(B,b,'refeitório');}
  function area48(B,s){const b=sec(s,'area_sanitarios');if(!Object.keys(b.answers||{}).length&&!Object.keys(b.fields||{}).length)return;h2(B,'4.8 Vestiário e Sanitários');const f=b.fields||{},a=b.answers||{},types=[f.unissex&&'unissex',f.masculino&&'masculino',f.feminino&&'feminino',f.pcd&&'PCD'].filter(Boolean);let t=`Foram informados ${text(f.clientes)||'0'} sanitário(s) para clientes e ${text(f.funcionarios)||'0'} para funcionários${text(f.andar)?`, localizados em ${f.andar}`:''}.`;if(types.length)t+=` Tipos existentes: ${sentenceList(types)}.`;p(B,t);if(yes(a.itens))p(B,'Os sanitários possuem tampa e assento, lixeira com pedal, suporte para papel higiênico e papel-toalha.');else if(no(a.itens))p(B,'Foram observadas ausências ou inadequações nos itens obrigatórios dos sanitários.');if(f.pcd){const acc=[f.barras&&'barras de apoio',f.campainha&&'campainha de emergência',f.lixeira_pcd&&'lixeira adequada'].filter(Boolean);if(acc.length)p(B,`O sanitário acessível dispõe de ${sentenceList(acc)}.`);}structuralText(B,b,'vestiários e sanitários');}
  function section5(B,s,baseChunks){
    const b=sec(s,'termolabeis'),applies=b.answers.aplica||s.answers?.thermo||'';
    if(!Object.keys(b.answers||{}).length&&!b.items?.length&&applies==='sim'&&baseChunks['5']){B.push(...baseChunks['5']);return;}
    h(B,'5 MEDICAMENTOS TERMOLÁBEIS');if(applies==='nao'){p(B,'O estabelecimento não comercializa medicamentos termolábeis.');return;}if(applies!=='sim')return;
    const items=b.items||[];p(B,`O estabelecimento comercializa medicamentos termolábeis e utiliza ${items.length} equipamento(s) para armazenamento desses produtos.`);
    items.forEach((x,i)=>{const issues=Object.entries(coldIssueLabels).filter(([k])=>x[k]).map(([,v])=>v);let t=`${String.fromCharCode(97+i)}) ${text(x.equipamento)||text(x.tipo)||'Equipamento sem identificação'}${text(x.tipo)&&text(x.equipamento)?` — tipo: ${x.tipo}`:''}.`;t+=` ${x.termohigrometro==='sim'?'Possui termohigrômetro.':x.termohigrometro==='nao'?'Não possui termohigrômetro.':''}`;if(text(x.temperatura)||text(x.umidade))t+=` Leitura no momento da inspeção:${text(x.temperatura)?` ${x.temperatura} °C`:''}${text(x.umidade)?` e ${x.umidade}% de umidade relativa`:''}.`;t+=` ${x.planilha==='sim'?'Foram apresentados registros de monitoramento de temperatura.':x.planilha==='nao'?'Não foram apresentados registros de monitoramento de temperatura.':''}`;if(issues.length)t+=` Foram observadas as seguintes não conformidades: ${sentenceList(issues)}.`;else t+=' Não foram registradas não conformidades específicas neste equipamento.';p(B,t);});
    if(yes(b.answers.pop)){const covered=[b.fields.pop_monitoramento&&'monitoramento e conservação',b.fields.pop_corretivas&&'medidas corretivas para desvios de temperatura',b.fields.pop_limpeza&&'limpeza dos equipamentos',b.fields.pop_emergencias&&'procedimentos para situações de emergência'].filter(Boolean);p(B,`Foi apresentado POP da atividade${covered.length?`, contemplando ${sentenceList(covered)}`:''}.`);}else if(no(b.answers.pop))p(B,'Não foi apresentado POP da atividade de armazenamento de medicamentos termolábeis.');
  }
  function section6(B,s,baseChunks){const b=sec(s,'controlados_complementos'),f=b.fields||{},a=b.answers||{};h(B,'6 MEDICAMENTOS CONTROLADOS');const classes=[f.portaria344&&'medicamentos sujeitos a controle especial da Portaria SVS/MS 344/98',f.c2&&'retinoides da Lista C2',f.cannabis&&'produtos derivados de Cannabis',f.antimicrobianos&&'antimicrobianos',f.glp1&&'análogos GLP-1'].filter(Boolean);if(classes.length)p(B,`Classes de produtos comercializados: ${sentenceList(classes)}.`);if(text(f.sistema)||text(f.versao))p(B,`A escrituração é realizada no sistema informatizado ${text(f.sistema)||'informado'}${text(f.versao)?`, versão ${f.versao}`:''}.`);if(a.sngpc)p(B,yes(a.sngpc)?'O estabelecimento possui adesão ao SNGPC.':'O estabelecimento não possui adesão ao SNGPC.');if(a.transmissao)p(B,yes(a.transmissao)?'As transmissões ao SNGPC foram informadas como regulares.':'Foram observadas pendências ou irregularidades nas transmissões ao SNGPC.');const tables=(baseChunks['6']||[]).filter(x=>x.t==='table');if(tables.length){h2(B,'Conferência de estoque por produto e lote');B.push(...tables);}if(a.estoque)p(B,yes(a.estoque)?'O estoque físico amostrado corresponde ao estoque escriturado.':'O estoque físico amostrado não corresponde integralmente ao estoque escriturado.');if(a.outra_uf)p(B,yes(a.outra_uf)?'Foram verificadas receitas oriundas de outra unidade federativa.':'Não foram verificadas receitas oriundas de outra unidade federativa.');if(yes(a.outra_uf)&&a.mapas72)p(B,yes(a.mapas72)?'Foi apresentado comprovante do envio à COVISA no prazo aplicável após o atendimento/aviamento.':'Não foi apresentado comprovante do envio à COVISA no prazo aplicável após o atendimento/aviamento.');documentsPresented(B,b.docs);}
  function section7(B,s){const b=sec(s,'servicos_farmaceuticos'),a=b.answers||{},f=b.fields||{};h(B,'7 SERVIÇOS FARMACÊUTICOS');if(a.realiza==='nao'||a.realiza==='nsa'){p(B,'O estabelecimento não informou a realização de serviços farmacêuticos nesta inspeção.');return;}if(a.realiza!=='sim')return;const services=[f.atencao_domiciliar&&'atenção domiciliar',f.injetaveis&&'aplicação de injetáveis',f.lobulo&&'perfuração de lóbulo auricular',f.pressao&&'monitoramento de pressão arterial',f.glicemia&&'aferição de glicemia capilar',f.temperatura&&'aferição de temperatura corporal'].filter(Boolean);if(services.length)p(B,`São realizados os seguintes serviços farmacêuticos: ${sentenceList(services)}.`);let room=[];if(yes(a.ambiente))room.push('o ambiente é separado da área de dispensação e dispõe de espaço próprio');else if(no(a.ambiente))room.push('o ambiente não está adequadamente separado da área de dispensação');if(yes(a.lavatório))room.push('há lavatório com água corrente e os insumos de higiene verificados');else if(no(a.lavatório))room.push('o lavatório ou os insumos de higiene apresentam inadequações');if(room.length)p(B,`Quanto ao ambiente, ${sentenceList(room)}.`);if(yes(a.sifao))p(B,'Foram observados produtos armazenados na área do sifão da pia. Registra-se a recomendação de manter essa área livre para facilitar a higienização e inspeção, sem geração automática de infração por este item.');else if(no(a.sifao))p(B,'Não havia produtos armazenados na área do sifão da pia.');if(a.declaracao)p(B,yes(a.declaracao)?'Possui Declaração de Serviços Farmacêuticos em duas vias, com os dados exigidos.':'Não foi apresentada Declaração de Serviços Farmacêuticos em duas vias com os dados exigidos.');if(a.limpeza)p(B,yes(a.limpeza)?'A limpeza do espaço é registrada e realizada diariamente no início, término e quando necessário.':'Não foram apresentados registros adequados da limpeza do espaço.');}
  function section8(B,s){h(B,'8 DOCUMENTOS E REGISTROS');quality(B,s);trace(B,s);remote(B,s);discard(B,s);}
  function quality(B,s){const b=sec(s,'documentos_qualidade');if(!Object.keys(b.answers||{}).length&&!Object.keys(b.fields||{}).length)return;h2(B,'8.1 Documentos de qualidade');const a=b.answers||{};if(a.treinamentos)p(B,yes(a.treinamentos)?'O estabelecimento mantém registros dos treinamentos de pessoal.':'Não foram apresentados registros adequados dos treinamentos de pessoal.');if(a.pop_aquisicao)p(B,yes(a.pop_aquisicao)?'Foi apresentado POP de aquisição.':'Não foi apresentado POP de aquisição.');if(a.criterios)p(B,yes(a.criterios)?'Há critérios documentados de origem e qualidade para os produtos adquiridos.':'Não foram demonstrados critérios documentados suficientes de origem e qualidade para os produtos adquiridos.');if(a.distribuidores)p(B,yes(a.distribuidores)?'A aquisição é realizada por distribuidores legalmente autorizados e licenciados.':'A aquisição não é realizada exclusivamente por distribuidores legalmente autorizados e licenciados.');if(a.pop_vencimento)p(B,yes(a.pop_vencimento)?'Possui POP para produtos próximos ao vencimento.':'Não foi apresentado POP para produtos próximos ao vencimento.');}
  function trace(B,s){const b=sec(s,'documentos_rastreabilidade');if(!Object.keys(b.answers||{}).length&&!Object.keys(b.fields||{}).length)return;h2(B,'8.2 Rastreabilidade de medicamentos sujeitos a controle especial');const a=b.answers||{},f=b.fields||{};if(a.registro_receita){if(yes(a.registro_receita))p(B,'O farmacêutico registra nas receitas retidas os dados de dispensação exigidos pela legislação.');else{const misses=[f.falta_lote&&'lote',f.falta_quantidade&&'quantidade dispensada',f.falta_data&&'data da dispensação',f.falta_adquirente&&'dados do adquirente',f.falta_dispensador&&'identificação do responsável pela dispensação'].filter(Boolean);p(B,`O farmacêutico não registra integralmente nas receitas retidas os dados de dispensação exigidos${misses.length?`; foram observadas ausências de ${sentenceList(misses)}`:''}.`);}}if(a.correspondencia_sistema)p(B,yes(a.correspondencia_sistema)?'Os dados de dispensação registrados nas prescrições correspondem aos registros do sistema informatizado.':'Os dados de dispensação registrados nas prescrições não correspondem integralmente aos registros do sistema informatizado.');}
  function remote(B,s){const b=sec(s,'documentos_remota');if(!Object.keys(b.answers||{}).length&&!Object.keys(b.fields||{}).length)return;h2(B,'8.3 Solicitação remota para dispensação');const a=b.answers||{},f=b.fields||{};if(a.realiza!=='sim'){if(a.realiza)p(B,'O estabelecimento não realiza venda remota de medicamentos.');return;}const means=[f.meio_internet&&'internet',f.meio_telefone&&'telefone',f.meio_site&&'site próprio',f.meio_whatsapp&&'WhatsApp',f.meio_ifood&&'iFood',f.meio_rappi&&'Rappi',f.meio_amazon&&'Amazon',f.meio_shopee&&'Shopee',f.meio_mercadolivre&&'Mercado Livre',f.meio_outros&&(f.meio_outros_texto||'outros meios')].filter(Boolean);p(B,`O estabelecimento realiza solicitação remota para dispensação${means.length?` por ${sentenceList(means)}`:''}.`);if(a.site_portaria344)p(B,yes(a.site_portaria344)?'O site próprio observa as determinações aplicáveis da Portaria SVS/MS 344/98.':'O site próprio não observa integralmente as determinações aplicáveis da Portaria SVS/MS 344/98.');if(a.remota_classes_legal)p(B,yes(a.remota_classes_legal)?'A venda remota de medicamentos controlados e/ou antimicrobianos foi informada como realizada de acordo com a legislação vigente.':'A venda remota de medicamentos controlados e/ou antimicrobianos não atende integralmente à legislação vigente.');}
  function discard(B,s){const b=sec(s,'documentos_descarte');if(!Object.keys(b.answers||{}).length&&!Object.keys(b.fields||{}).length)return;h2(B,'8.4 Descarte de medicamentos');const a=b.answers||{};if(a.pgrss)p(B,yes(a.pgrss)?'Foi apresentado PGRSS.':'Não foi apresentado PGRSS adequado.');if(a.termo)p(B,a.termo==='sim'?'Há procedimento que descreve que a inutilização de medicamentos de controle especial ocorre mediante Termo de Inutilização.':a.termo==='nao'?'Não há procedimento que descreva a inutilização de medicamentos de controle especial mediante Termo de Inutilização.':'A verificação do Termo de Inutilização não se aplica nesta inspeção.');if(a.coleta_servicos)p(B,yes(a.coleta_servicos)?'Existe coleta dos resíduos resultantes dos serviços farmacêuticos.':'Não existe coleta comprovada dos resíduos resultantes dos serviços farmacêuticos.');if(text(b.fields?.amlurb))kv(B,'Cadastro AMLURB',b.fields.amlurb);}
  function section9(B,s){const b=sec(s,'transporte'),a=b.answers||{},f=b.fields||{};h(B,'9 TRANSPORTE');if(a.aplica==='nao'||a.aplica==='nsa'){p(B,'Transporte e entrega domiciliar não se aplicam ao estabelecimento.');return;}if(a.aplica!=='sim')return;p(B,`A entrega é realizada por ${f.modalidade==='terceirizada'?'empresa terceirizada':f.modalidade==='proprio'?'funcionário próprio':'modalidade informada no roteiro'}.`);if(f.modalidade==='terceirizada')p(B,`Empresa responsável: ${text(f.empresa)||'não informada'}${text(f.cnpj)?`, CNPJ ${f.cnpj}`:''}${text(f.afe)?`, AFE ${f.afe}`:''}${text(f.cevs)?`, licença sanitária/CEVS ${f.cevs}`:''}.`);if(a.treinamentos_registros)p(B,yes(a.treinamentos_registros)?'Foram apresentados registros de treinamentos dos funcionários envolvidos no transporte.':'Não foram apresentados registros de treinamentos dos funcionários envolvidos no transporte.');if(a.controle_temperatura)p(B,yes(a.controle_temperatura)?'Foi apresentado registro de controle de temperatura durante o transporte, quando aplicável.':'Não foi apresentado registro de controle de temperatura durante o transporte, quando aplicável.');if(a.limpeza_compartimento)p(B,yes(a.limpeza_compartimento)?'Foi apresentado registro de limpeza do compartimento de entrega.':'Não foi apresentado registro de limpeza do compartimento de entrega.');documentsPresented(B,b.docs);}

  function finalize(base,cat,s){
    const C=chunks(base.blocks),B=[];B.push(...(C.intro||[]));section1(B,s);section2(B,s);section3(B,s);section4(B,s);section5(B,s,C);section6(B,s,C);section7(B,s);section8(B,s);section9(B,s);B.push(...(C['10']||[]));
    const irregularities=manualIssues(s,base);const records=(base.records||[]).map(r=>r.id==='rev_servicos_farmaceuticos_sifao'?{...r,irregularidade_gerada:false}:r);for(const r of irregularities)if(!records.some(x=>x.id===r.id))records.push(r);
    h(B,'11 IRREGULARIDADES OBSERVADAS');if(irregularities.length){irregularities.forEach((r,i)=>{let t=r.frase_relatorio||'';const legal=(r.refs||[]).map(id=>cat.referencias?.[id]).filter(Boolean).map(x=>`${x.norma}, ${x.dispositivo}`);if(legal.length)t+=' Fundamento: '+legal.join('; ')+'.';B.push({t:'num',n:i+1,x:t});});}else p(B,'Não foram registradas irregularidades nesta inspeção.');
    B.push(...(C['12']||[]),...(C['13']||[]));
    return {...base,blocks:B,records,irregularities,answered:records.filter(r=>r.resposta).length,total:records.length};
  }
  function install(){const api=window.DrogariaAPI;if(!api?.engine?.report||api.engine.report.__drogariaFinal)return false;const original=api.engine.report;const wrapped=(cat,s,bank)=>finalize(original(cat,s,bank),cat,structuredClone(s));wrapped.__drogariaFinal=true;api.engine.report=wrapped;return true;}
  function start(){let tries=0;const go=()=>{if(window.DrogariaFinalBridge&&window.DrogariaReview&&install())return;if(++tries<200)setTimeout(go,25);};setTimeout(go,0);}
  document.addEventListener('DOMContentLoaded',start);
  window.DrogariaReportFinal=Object.freeze({install,finalize});
})();
