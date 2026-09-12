/* Farmácia de Manipulação — relatório narrativo, pendências, NCs e fechamento.
 * O relatório é compilado a partir dos dados conferidos pelo fiscal.
 * Nenhum algoritmo define a conclusão sanitária.
 */
(() => {
  'use strict';
  const FM=window.FarmaciaManipulacao;
  if(!FM || window.FarmaciaManipulacaoReport) return;
  const {esc,field,textarea,select,uid}=FM.ui;

  const SECTION_TITLES=Object.fromEntries(FM.SECTION_DEFS);
  const SUB_TITLES={}; Object.values(FM.SUBSECTIONS).flat().forEach(([id,t])=>SUB_TITLES[id]=t);
  const titleOf=s=>SUB_TITLES[s]||SECTION_TITLES[s]||`Seção ${s}`;
  const clean=v=>String(v==null?'':v).trim();
  const yes=v=>v===true||v==='sim'||v==='Sim';
  const f=(st,s,id)=>clean(st.sections?.[s]?.fields?.[id]);
  const sec=(st,s)=>st.sections?.[s]||{};
  const answer=(st,s,id)=>st.sections?.[s]?.answers?.[id]||'';
  const note=(st,s,id)=>clean(st.sections?.[s]?.notes?.[id]);
  const applicable=(st,s)=>st.sections?.[s]?.applicable!==false;
  const hasText=v=>clean(v)!=='';
  const joinNatural=(arr,last=' e ')=>{arr=arr.filter(Boolean);if(arr.length<2)return arr[0]||'';return arr.slice(0,-1).join(', ')+last+arr.at(-1);};
  const fmtDate=v=>{if(!v)return '';const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);return m?`${m[3]}/${m[2]}/${m[1]}`:String(v);};
  const paragraph=(x)=>clean(x)?clean(x):'';
  const sentence=x=>{x=clean(x);if(!x)return '';return /[.!?;:]$/.test(x)?x:x+'.';};

  const QUESTION_LABELS={
    '1::license_matches':'Divergência entre dados/atividades observados e licença sanitária',
    '1::rt_presence':'Assistência farmacêutica / horário do responsável técnico',
    '2::surfaces':'Condições de pisos, paredes e tetos',
    '2::clean_conserved':'Limpeza e conservação das instalações',
    '2::hydraulic':'Instalações hidráulicas',
    '2::electrical':'Instalações elétricas',
    '2::layout_flow':'Leiaute e fluxo das operações',
    '2::lighting':'Iluminação',
    '2::ventilation':'Ventilação / climatização',
    '2::fire_equipment':'Sistemas/equipamentos de combate a incêndio',
    '3::organogram':'Organograma e suficiência de pessoal',
    '3::responsibilities':'Atribuições e responsabilidades individuais',
    '3::occupational_exams':'Avaliação médica ocupacional',
    '3::ppe_supply':'Fornecimento de EPI',
    '3::gowning_hands':'Paramentação e higiene de mãos/antebraços',
    '3::training_program':'Programa e registros de treinamento',
    '3::training_effectiveness':'Avaliação de efetividade dos treinamentos',
    '3.4::specific_exams':'Exames médicos específicos — Anexo III',
    '3.4::pcms_o_informed':'Comunicação ao responsável pelo PCMSO — Anexo III',
    '6.1::negative_pressure_general':'Pressão negativa nas áreas de sensibilizantes',
    '8.7::potable_parameters':'Parâmetros da análise de água potável',
    '8.7::purified_unsatisfactory_retest':'Nova análise após resultado insatisfatório de água purificada',
    '9.1::controlled_prescription':'Prescrição de substância sujeita a controle especial',
    '9.1::antimicrobial':'Prescrição de antimicrobiano'
  };
  const DOCUMENT_LABELS={
    crt:'Certidão de Regularidade Técnica — CRF',license:'Licença Sanitária',avcb:'AVCB / CLCB',water_tank:'Comprovante de limpeza da caixa d’água',pests:'Controle de pragas e vetores',pmoc:'PMOC',mbpm:'Manual de Boas Práticas de Manipulação',mbpf:'Manual de Boas Práticas Farmacêuticas',pcmsO:'PCMSO',pgr:'PGR',pgrss:'PGRSS',floor_plan:'Planta baixa / croqui',controlled_licenses:'Licenças de produtos químicos controlados',mapa:'Registro / certificado MAPA',afe_ae:'AFE / AE',maps_balances:'Mapas e balanços — Portaria 344/98',complaints:'Registros de reclamações de clientes',self_inspection:'Autoinspeção',training:'Programa e registros de treinamento',suppliers:'Qualificação de fornecedores',third_party_lab:'Contrato com laboratório terceirizado',maintenance_program:'Programa de manutenção preventiva',raw_material_list:'Relação de matérias-primas',book_system:'Sistema informatizado / Livro de Receituário',corporate:'CNPJ / Contrato Social'
  };

  function describeIdentity(st){
    const x=[];
    const reason=f(st,'1','razao_social'), fantasy=f(st,'1','nome_fantasia'), cnpj=f(st,'1','cnpj'), address=f(st,'1','endereco');
    if(reason||fantasy||cnpj){let s='Trata-se de estabelecimento';if(reason)s+=` denominado ${reason}`;if(fantasy)s+=`${reason?', ':''} identificado ao público como “${fantasy}”`;if(cnpj)s+=`, CNPJ ${cnpj}`;x.push(sentence(s));}
    if(address)x.push(sentence(`O estabelecimento está situado em ${address}`));
    const objective=f(st,'1','objective'); if(objective)x.push(sentence(`A inspeção teve por objetivo ${objective}`));
    const sei=f(st,'1','sei'); if(sei)x.push(sentence(`Processo/protocolo relacionado: ${sei}`));
    const contacts=f(st,'1','contacts'); if(contacts)x.push(sentence(`Foram contatados/presentes durante a inspeção: ${contacts}`));
    const rt=f(st,'1','rt_name'), crf=f(st,'1','rt_crf'), sched=f(st,'1','rt_schedule');
    if(rt){let s=`Responsável técnico: ${rt}`;if(crf)s+=`, ${crf}`;if(sched)s+=`, com assistência informada em ${sched}`;x.push(sentence(s));}
    const subs=st.sections?.['1']?.fields?.rt_substitutes||[];
    if(subs.length)x.push(sentence(`Farmacêuticos substitutos informados: ${subs.map(a=>[a.name,a.crf,a.schedule&&`horário ${a.schedule}`].filter(Boolean).join(' — ')).join('; ')}`));
    const cmvs=f(st,'1','cmvs_cevs'), lvalid=f(st,'1','license_validity');
    if(cmvs){let s=`Licença Sanitária ${cmvs}`;if(lvalid)s+=`, válida até ${fmtDate(lvalid)}`;x.push(sentence(s));}
    const afe=f(st,'1','afe_number'), ae=f(st,'1','ae_number');
    if(afe||ae)x.push(sentence([afe&&`AFE ${afe}`,ae&&`AE ${ae}`].filter(Boolean).join('; ')));
    const profiles=[['profile_homeopathic','homeopáticas'],['profile_phytotherapeutic','fitoterápicas'],['profile_allopathic','alopáticas'],['profile_officinal','oficinais']].filter(([k])=>yes(st.sections?.['1']?.fields?.[k])).map(x=>x[1]);
    const classes=[['class_hormones','hormônios'],['class_antibiotics','antibióticos'],['class_penicillins','penicilínicos'],['class_cephalosporins','cefalosporínicos'],['class_cytostatics','citostáticos'],['class_controlled','substâncias sujeitas a controle especial']].filter(([k])=>yes(st.sections?.['1']?.fields?.[k])).map(x=>x[1]);
    const forms=[['form_solid','sólidas'],['form_semisolid','semissólidas'],['form_liquid','líquidas']].filter(([k])=>yes(st.sections?.['1']?.fields?.[k])).map(x=>x[1]);
    if(profiles.length)x.push(sentence(`Foram informadas/manipuladas preparações ${joinNatural(profiles)}`));
    if(classes.length)x.push(sentence(`Entre as classes/grupos registrados constam ${joinNatural(classes)}`));
    if(f(st,'1','sbit')==='sim')x.push(sentence(`Há atividade com SBIT${f(st,'1','sbit_substances')?`: ${f(st,'1','sbit_substances')}`:''}`));
    if(forms.length)x.push(sentence(`As formas farmacêuticas registradas incluem ${joinNatural(forms)}`));
    const formulas=f(st,'1','formulas_per_day'), employees=f(st,'1','employees_total'), software=f(st,'1','software'), water=f(st,'1','purified_water_method');
    if(formulas||employees)x.push(sentence([formulas&&`média de ${formulas} fórmulas/dia`,employees&&`${employees} funcionários`].filter(Boolean).join(' e ')));
    if(software)x.push(sentence(`Sistema informatizado utilizado: ${software}`));
    if(water)x.push(sentence(`Método informado para obtenção de água purificada: ${water}`));
    const general=f(st,'1','general_notes'); if(general)x.push(sentence(general));
    return x.join(' ');
  }

  function describeBuilding(st){
    const x=[], property=f(st,'2','property_type'), floors=f(st,'2','floors'), access=f(st,'2','independent_access'), comm=f(st,'2','communication'), plate=f(st,'2','external_identification'), tank=f(st,'2','water_tank_location');
    let s=''; if(property)s=`O estabelecimento ocupa ${property.replaceAll('_',' ')}`;if(floors)s+=`${s?', ':''}${floors} pavimento(s)`;if(access==='sim')s+=`${s?', ':''}com acesso livre e independente`;if(comm==='nao')s+=`${s?', ':''}sem comunicação direta com outro estabelecimento ou residência`;if(s)x.push(sentence(s));
    if(plate)x.push(sentence(`Identificação externa observada: ${plate}`));
    if(f(st,'2','structural_particularities'))x.push(sentence(f(st,'2','structural_particularities')));
    if(tank)x.push(sentence(`Reservatório/caixa d’água localizado em ${tank}`));
    const positive=[];
    [['surfaces','superfícies internas em condições adequadas'],['clean_conserved','instalações limpas e conservadas'],['hydraulic','instalações hidráulicas em condições adequadas'],['electrical','instalações elétricas em condições adequadas'],['layout_flow','fluxo compatível com a prevenção de misturas/contaminação'],['lighting','iluminação compatível'],['ventilation','ventilação/climatização compatível']].forEach(([id,t])=>{if(answer(st,'2',id)==='c')positive.push(t);});
    if(positive.length)x.push(sentence(`Durante a inspeção foram verificadas ${joinNatural(positive)}`));
    if(f(st,'2','layout_notes'))x.push(sentence(f(st,'2','layout_notes')));
    return x.join(' ');
  }

  function describePersonnel(st){
    const x=[];
    const positives=[];
    [['organogram','estrutura organizacional e pessoal'],['responsibilities','atribuições e responsabilidades'],['occupational_exams','avaliações de saúde ocupacional'],['ppe_supply','fornecimento de EPI'],['gowning_hands','paramentação e higiene das mãos/antebraços']].forEach(([id,t])=>{if(answer(st,'3',id)==='c')positives.push(t);});
    if(positives.length)x.push(sentence(`Foram verificadas condições satisfatórias quanto a ${joinNatural(positives)}`));
    const aso=(st.documents||[]).filter(d=>d.kind==='aso'); if(aso.length)x.push(sentence(`Foram conferidos ${aso.length} Atestado(s) de Saúde Ocupacional, com dados estruturados revisados pela equipe`));
    if(answer(st,'3','pcms_o_present')==='c')x.push('Foi apresentado PCMSO, analisado por checklist quanto à identificação, riscos, exames, periodicidades e planejamento ocupacional.');
    if(answer(st,'3','pgr_present')==='c')x.push('Foi apresentado PGR, analisado quanto à abrangência, inventário de riscos, métodos de avaliação e medidas de prevenção.');
    const trainings=st.sections?.['3']?.fields?.trainings||[];if(trainings.length)x.push(sentence(`Foram registrados os seguintes treinamentos: ${trainings.map(t=>[t.theme,t.date&&fmtDate(t.date),t.hours&&`${t.hours} h`].filter(Boolean).join(' — ')).join('; ')}`));
    return x.join(' ');
  }

  function describeArea(st,s){
    if(!applicable(st,s))return '';
    const x=[], d=f(st,s,'area_description')||f(st,s,'description'); if(d)x.push(sentence(d));
    const temp=f(st,s,'env_temp_now'), hum=f(st,s,'env_humidity_now'), tmax=f(st,s,'env_temp_max'), tmin=f(st,s,'env_temp_min'), hmax=f(st,s,'env_humidity_max'), hmin=f(st,s,'env_humidity_min');
    if(temp||hum){let q='No momento da inspeção';if(temp)q+=` foi registrada temperatura de ${temp} °C`;if(hum)q+=`${temp?' e':''} umidade relativa de ${hum}%`;if(tmax||tmin)q+=`, com temperatura máxima/mínima de ${tmax||'—'}/${tmin||'—'} °C`;if(hmax||hmin)q+=` e umidade máxima/mínima de ${hmax||'—'}/${hmin||'—'}%`;x.push(sentence(q));}
    const iid=f(st,s,'env_instrument_id'), cert=f(st,s,'env_cal_cert'), val=f(st,s,'env_cal_validity');
    if(iid||cert){let q=`O monitoramento utiliza instrumento${iid?` identificado como ${iid}`:''}`;if(cert)q+=`, certificado nº ${cert}`;if(val)q+=`, com calibração válida até ${fmtDate(val)}`;x.push(sentence(q));}
    if(f(st,s,'has_refrigerator')==='sim'){
      const now=f(st,s,'refrigerator_temp_now'), rmax=f(st,s,'refrigerator_temp_max'), rmin=f(st,s,'refrigerator_temp_min');
      let q=`O ambiente dispõe de refrigerador${f(st,s,'refrigerator_use')?` destinado a ${f(st,s,'refrigerator_use')}`:''}`;if(now)q+=`, com temperatura observada de ${now} °C`;if(rmax||rmin)q+=` (máxima/mínima ${rmax||'—'}/${rmin||'—'} °C)`;x.push(sentence(q));
    }
    return x.join(' ');
  }

  function describeSection4(st){return (FM.SUBSECTIONS['4']||[]).map(([s,t])=>{const p=describeArea(st,s);return p?`${s} ${t}\n${p}`:'';}).filter(Boolean).join('\n\n');}
  function describeSection5(st){return (FM.SUBSECTIONS['5']||[]).map(([s,t])=>{const p=describeArea(st,s);return p?`${s} ${t}\n${p}`:'';}).filter(Boolean).join('\n\n');}
  function describeSection6(st){
    return (FM.SUBSECTIONS['6']||[]).map(([s,t])=>{if(!applicable(st,s))return '';const x=[];if(f(st,s,'area_description'))x.push(sentence(f(st,s,'area_description')));const pressure=f(st,s,'pressure_value');if(pressure)x.push(sentence(`Diferencial de pressão aferido: ${pressure} Pa`));if(f(st,s,'cabin_id'))x.push(sentence(`Identificação da cabine: ${f(st,s,'cabin_id')}`));const p=describeArea(st,s);if(p)x.push(p);return x.length?`${s} ${t}\n${x.join(' ')}`:'';}).filter(Boolean).join('\n\n');
  }

  function documentEntries(st){
    const s=st.sections?.['7']?.fields||{}, out=[];
    Object.entries(DOCUMENT_LABELS).forEach(([id,label])=>{
      const status=s[id+'_status']; if(!status||status==='na'||status==='nao_apresentado')return;
      const bits=[s[id+'_number'],s[id+'_issuer'],s[id+'_date']].map(clean).filter(Boolean);
      let txt=label+(bits.length?` — ${bits.join(' — ')}`:'');
      const notes=clean(s[id+'_notes']);if(notes)txt+=`. ${notes}`;
      out.push(sentence(txt));
    });
    return out;
  }
  function describeSection7(st){
    const docs=documentEntries(st);let out=docs.length?`Foram apresentados/conferidos os seguintes documentos: ${docs.join(' ')}`:'';
    const ex=st.sections?.['7.2'];if(ex&&ex.applicable!==false){const n=clean(ex.fields?.document_numbers),company=clean(ex.fields?.company),date=clean(ex.fields?.execution_date);if(n||company||date){out+=(out?'\n\n':'')+sentence(`Qualificação do sistema de exaustão${n?` nº ${n}`:''}${company?` executada por ${company}`:''}${date?` em ${fmtDate(date)}`:''}`);}}
    return out;
  }

  function monitorRecords(st,s){return (st.sections?.[s]?.records||[]).filter(r=>r.record_type==='lab_report');}
  function describeSection8(st){
    const parts=[];
    (FM.SUBSECTIONS['8']||[]).forEach(([s,t])=>{if(s==='8.7'||!applicable(st,s))return;const rs=monitorRecords(st,s);if(!rs.length)return;const lines=rs.map(r=>{let x=`relatório/certificado ${clean(r.report_no)||'não numerado'}`;if(r.sample)x+=` — ${r.sample}`;if(r.collection_datetime)x+=` — coleta em ${fmtDate(r.collection_datetime)}`;if(r.lot)x+=` — lote ${r.lot}`;if(r.conclusion_text)x+=` — ${r.conclusion_text}`;return x;});parts.push(`${s} ${t}\nForam conferidos ${lines.join('; ')}.`);});
    return parts.join('\n\n');
  }

  function formulaRecords(st,s){return (st.sections?.[s]?.records||[]).filter(r=>r.record_type==='formula');}
  function describeFormula(r){
    const x=[];let h=r.product||'Formulação amostrada';if(r.om_number)h+=` — Ordem de Manipulação nº ${r.om_number}`;if(r.om_date)h+=` de ${fmtDate(r.om_date)}`;x.push(sentence(h));
    const comps=(r.components||[]).map(c=>{let s=c.name||c.type||'componente';if(c.lot_internal)s+=` — lote ${c.lot_internal}`;if(c.lot_manufacturer&&c.lot_manufacturer!==c.lot_internal)s+=` — lote fabricante ${c.lot_manufacturer}`;if(c.validity)s+=` — validade ${fmtDate(c.validity)}`;if(c.manufacturer)s+=` — fabricante ${c.manufacturer}`;if(c.supplier)s+=` — fornecedor ${c.supplier}`;if(c.invoice)s+=` — NF ${c.invoice}`;return s;});
    if(comps.length)x.push(sentence(`A rastreabilidade dos componentes amostrados registrou: ${comps.join('; ')}`));
    if((r.finished_assays||[]).length)x.push(sentence(`No controle de qualidade do produto acabado foram registrados ${joinNatural(r.finished_assays)}`));
    if(r.notes_general)x.push(sentence(r.notes_general));
    return x.join(' ');
  }
  function describeSection9(st){
    const parts=[];
    ['9.2.1','9.2.2','9.2.3'].forEach(s=>{if(!applicable(st,s))return;const rs=formulaRecords(st,s);if(rs.length)parts.push(`${s} ${titleOf(s)}\n${rs.map(describeFormula).join('\n')}`);});
    const veg=(st.sections?.['9.3']?.records||[]).filter(r=>r.record_type==='vegetal');if(veg.length&&applicable(st,'9.3'))parts.push(`9.3 ${titleOf('9.3')}\n`+veg.map(r=>sentence(`${r.name||'Matéria-prima vegetal'}${r.lot?` — lote ${r.lot}`:''}${r.validity?` — validade ${fmtDate(r.validity)}`:''}${r.manufacturer?` — fabricante ${r.manufacturer}`:''}${r.invoice?` — DANFE/NF ${r.invoice}`:''}${r.manufacturer_coa?` — certificado do fabricante ${r.manufacturer_coa}`:''}`)).join(' '));
    const home=(st.sections?.['9.4']?.records||[]).filter(r=>r.record_type==='homeopatia');if(home.length&&applicable(st,'9.4'))parts.push(`9.4 ${titleOf('9.4')}\n`+home.map(r=>sentence(`${r.name||'Insumo homeopático'}${r.lot?` — lote ${r.lot}`:''}${r.dynamization?` — dinamização ${r.dynamization}`:''}${r.origin?` — origem ${r.origin}`:''}${r.lineage?`. Rastreabilidade: ${r.lineage}`:''}`)).join(' '));
    const stock=(st.sections?.['9.5']?.records||[]).filter(r=>r.record_type==='stock_controlled');if(stock.length&&applicable(st,'9.5'))parts.push(`9.5 ${titleOf('9.5')}\n`+stock.map(r=>sentence(`${r.substance||'Substância'}${r.lot?` — lote ${r.lot}`:''}: estoque físico ${r.physical||'—'}; sistema ${r.system||'—'}${hasText(r.inspection_notes)?`; ${r.inspection_notes}`:''}`)).join(' '));
    if(applicable(st,'9.6')){const d=describeArea(st,'9.6');const notes=f(st,'9.6','transport_notes');if(d||notes)parts.push(`9.6 ${titleOf('9.6')}\n${[d,sentence(notes)].filter(Boolean).join(' ')}`);}
    return parts.join('\n\n');
  }

  function sectionText(section,st=FM.getState()){
    section=String(section);
    if(section==='1')return describeIdentity(st);
    if(section==='2')return describeBuilding(st);
    if(section==='3')return describePersonnel(st);
    if(section==='4')return describeSection4(st);
    if(section==='5')return describeSection5(st);
    if(section==='6')return describeSection6(st);
    if(section==='7')return describeSection7(st);
    if(section==='8')return describeSection8(st);
    if(section==='9')return describeSection9(st);
    return '';
  }

  function labelQuestion(section,id){return QUESTION_LABELS[`${section}::${id}`]||id.replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());}
  function collectNCs(st=FM.getState()){
    const out=[],seen=new Set();
    Object.entries(st.sections||{}).forEach(([s,v])=>{
      if(v?.applicable===false)return;
      Object.entries(v.answers||{}).forEach(([id,status])=>{if(status!=='nc')return;const key=`${s}::${id}`;if(seen.has(key))return;seen.add(key);out.push({key,section:s,item:id,label:labelQuestion(s,id),finding:note(st,s,id),legal:clean(v.fields?.[id+'_legal'])});});
      (v.records||[]).forEach(r=>{
        if(r.inspection_status==='nc'){
          const key=r.dedupe_key||`${s}::record::${r.id}`;if(!seen.has(key)){seen.add(key);out.push({key,section:s,item:r.id,label:r.product||r.sample||r.substance||r.name||titleOf(s),finding:clean(r.inspection_notes||r.notes_general),legal:clean(r.legal)});}
        }
        Object.entries(r.checks||{}).forEach(([id,status])=>{if(status!=='nc')return;const key=r.dedupe_key?`${r.dedupe_key}::${id}`:`${s}::${r.id}::${id}`;if(seen.has(key))return;seen.add(key);out.push({key,section:s,item:`${r.id}:${id}`,label:`${r.product||r.sample||r.name||titleOf(s)} — ${id.replaceAll('_',' ')}`,finding:clean(r['note_'+id]),legal:clean(r.legal)});});
      });
    });
    return out;
  }

  function collectPending(st=FM.getState()){
    const out=[];
    Object.entries(st.sections||{}).forEach(([s,v])=>{
      if(!s.startsWith('7')||v?.applicable===false)return;
      Object.entries(v.fields||{}).forEach(([key,value])=>{
        if(!key.endsWith('_status')||!['nao_apresentado','atualizar'].includes(value))return;
        const id=key.slice(0,-7);out.push({section:s,id,label:DOCUMENT_LABELS[id]||id.replaceAll('_',' '),status:value,notes:clean(v.fields?.[id+'_notes']),deadline:clean(v.fields?.[id+'_deadline'])});
      });
    });
    return out;
  }

  const CLASS_LABEL={satisfatorio:'Satisfatório',restricoes:'Satisfatório com restrições',insatisfatorio:'Insatisfatório',interdicao_parcial:'Insatisfatório com Interdição Parcial',interdicao_total:'Insatisfatório com Interdição Total'};

  function closingText(st=FM.getState()){
    const c=st.conclusion||{},parts=[];
    const pending=collectPending(st),ncs=collectNCs(st);
    if(pending.length)parts.push('DOCUMENTAÇÃO PENDENTE\n'+pending.map((p,i)=>`${i+1}. ${p.label}${p.notes?` — ${p.notes}`:''}${p.deadline?` — prazo: ${p.deadline}`:''}.`).join('\n'));
    if(ncs.length)parts.push('NÃO CONFORMIDADES\n'+ncs.map((n,i)=>`${i+1}. ${n.label}${n.finding?` — ${n.finding}`:''}${n.legal?` — ${n.legal}`:''}.`).join('\n'));
    if(clean(c.risk_assessment)||clean(c.orientations))parts.push('CONSIDERAÇÕES FINAIS / AVALIAÇÃO DE RISCO\n'+[sentence(c.risk_assessment),sentence(c.orientations)].filter(Boolean).join(' '));
    if(c.classification)parts.push(`CONCLUSÃO\n${CLASS_LABEL[c.classification]||c.classification}${clean(c.conclusion_text)?` — ${sentence(c.conclusion_text)}`:''}`);
    if((c.measures||[]).length)parts.push('MEDIDAS ADOTADAS / DOCUMENTOS EMITIDOS\n'+c.measures.map((m,i)=>`${i+1}. ${[m.type,m.number,m.notes].filter(Boolean).join(' — ')}`).join('\n'));
    if((c.inspectors||[]).length)parts.push('EQUIPE INSPETORA\n'+c.inspectors.map(i=>[i.name,i.registration].filter(Boolean).join(' — ')).join('\n'));
    return parts.join('\n\n');
  }

  function fullReport(st=FM.getState()){
    const blocks=[];
    FM.SECTION_DEFS.forEach(([id,title])=>{const text=sectionText(id,st);if(text)blocks.push(`${id} ${title.toUpperCase()}\n${text}`);});
    const close=closingText(st);if(close)blocks.push(close);
    return blocks.join('\n\n');
  }

  async function copyText(text){
    if(!text)return false;
    try{await navigator.clipboard.writeText(text);return true;}catch(_){
      const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy');}catch(__){}ta.remove();return ok;
    }
  }
  function notify(msg){
    let el=document.getElementById('fm-report-toast');if(!el){el=document.createElement('div');el.id='fm-report-toast';el.style.cssText='position:fixed;right:16px;bottom:16px;z-index:99999;background:#111;color:#fff;padding:10px 14px;border-radius:9px;max-width:320px;font:14px/1.3 system-ui';document.body.appendChild(el);}el.textContent=msg;clearTimeout(notify.t);notify.t=setTimeout(()=>el.remove(),2500);
  }

  function conclusionSelect(st){
    const v=st.conclusion?.classification||'';
    return `<label class="field"><span>Classificação final — seleção exclusiva da autoridade sanitária</span><select data-fm-conclusion-field="classification"><option value="">Selecione</option>${Object.entries(CLASS_LABEL).map(([k,t])=>`<option value="${k}"${v===k?' selected':''}>${t}</option>`).join('')}</select></label>`;
  }
  function conclusionTextarea(st,key,label,rows=4){return `<label class="field"><span>${esc(label)}</span><textarea rows="${rows}" data-fm-conclusion-field="${esc(key)}">${esc(st.conclusion?.[key]||'')}</textarea></label>`;}

  function renderReport(){
    const st=FM.getState(),pending=collectPending(st),ncs=collectNCs(st),c=st.conclusion||{};
    return `<div class="panel fm-panel fm-report"><div class="subbar"><span class="badge">Fechamento</span><button type="button" data-fm-home>Roteiro</button></div><h2>Relatório / Fechamento da Inspeção</h2>
      <p class="muted">O texto é montado a partir das informações registradas. A classificação final nunca é calculada automaticamente.</p>
      <div class="actions"><button type="button" class="primary" data-fm-copy-full-report>📋 Copiar relatório completo</button><button type="button" data-fm-preview-report>Visualizar texto</button></div>
      <section class="box"><h3>Documentação pendente</h3>${pending.length?pending.map((p,i)=>`<p><strong>${i+1}. ${esc(p.label)}</strong>${p.notes?` — ${esc(p.notes)}`:''}</p>`).join(''):'<p class="muted">Nenhuma pendência documental estruturada até o momento.</p>'}</section>
      <section class="box"><h3>Não Conformidades consolidadas</h3><p class="muted">A lista é derivada das marcações NC e dos registros estruturados. Anotações são sincronizadas no momento da compilação; foto ou OCR isolados não criam NC.</p>${ncs.length?ncs.map((n,i)=>`<div class="box"><strong>${i+1}. ${esc(n.label)}</strong><p>${esc(n.finding||'Constatação ainda sem anotação detalhada.')}</p><label class="field"><span>Legislação / dispositivo — preencher ou revisar</span><input data-fm-nc-legal="${esc(n.section)}|${esc(n.item)}" value="${esc(n.legal||'')}"></label></div>`).join(''):'<p class="muted">Nenhuma NC marcada.</p>'}</section>
      <section class="box"><h3>Considerações finais / avaliação de risco</h3>${conclusionTextarea(st,'risk_assessment','Avaliação de risco e condições higiênico-sanitárias',5)}${conclusionTextarea(st,'orientations','Orientações prestadas',4)}</section>
      <section class="box"><h3>Conclusão</h3>${conclusionSelect(st)}${conclusionTextarea(st,'conclusion_text','Texto complementar da conclusão',4)}<p class="fm-requirement"><strong>A decisão é manual:</strong> o aplicativo pode apresentar quantidade de NCs (${ncs.length}) e pendências (${pending.length}), mas não escolhe a classificação.</p></section>
      <section class="box"><h3>Medidas adotadas / documentos emitidos</h3><div class="grid"><label class="field"><span>Tipo</span><select data-fm-measure-new="type"><option value="">Selecione</option><option>Auto de Infração</option><option>Termo de Interdição Parcial</option><option>Termo de Interdição Total</option><option>Ficha de Procedimentos</option><option>Outro</option></select></label><label class="field"><span>Série / número</span><input data-fm-measure-new="number"></label><label class="field"><span>Observações</span><input data-fm-measure-new="notes"></label><div class="field"><span>&nbsp;</span><button type="button" data-fm-add-measure>+ Adicionar</button></div></div>${(c.measures||[]).map((m,i)=>`<p>${esc([m.type,m.number,m.notes].filter(Boolean).join(' — '))} <button type="button" data-fm-remove-measure="${i}">Remover</button></p>`).join('')||'<p class="muted">Nenhuma medida registrada.</p>'}</section>
      <section class="box"><h3>Equipe inspetora</h3><div class="grid"><label class="field"><span>Autoridade Sanitária</span><input data-fm-inspector-new="name"></label><label class="field"><span>Matrícula</span><input data-fm-inspector-new="registration"></label><div class="field"><span>&nbsp;</span><button type="button" data-fm-add-inspector>+ Adicionar</button></div></div>${(c.inspectors||[]).map((i,n)=>`<p>${esc([i.name,i.registration].filter(Boolean).join(' — '))} <button type="button" data-fm-remove-inspector="${n}">Remover</button></p>`).join('')||'<p class="muted">Nenhum integrante registrado.</p>'}</section>
      <section class="box"><h3>Prévia do relatório</h3><textarea readonly rows="18" style="width:100%">${esc(fullReport(st))}</textarea></section>
    </div>`;
  }

  function addReportButton(){
    const root=document.querySelector('[data-farmacia-manipulacao-root]')||document.getElementById('farmacia-manipulacao-root');if(!root||root.querySelector('[data-fm-report-open]'))return;
    const panel=root.querySelector('.panel');if(!panel)return;
    const bar=panel.querySelector('.subbar')||panel;
    const b=document.createElement('button');b.type='button';b.dataset.fmReportOpen='1';b.textContent='Relatório';bar.appendChild(b);
  }
  const observer=new MutationObserver(()=>addReportButton());
  window.addEventListener('DOMContentLoaded',()=>{const root=document.querySelector('[data-farmacia-manipulacao-root]')||document.getElementById('farmacia-manipulacao-root');if(root)observer.observe(root,{childList:true,subtree:true});addReportButton();},{once:true});
  window.addEventListener('farmacia-manipulacao:state',()=>setTimeout(addReportButton));

  document.addEventListener('click',async e=>{
    if(e.target.closest('[data-fm-report-open]')){FM.setActive('report','');return;}
    if(e.target.closest('[data-fm-copy-full-report]')){notify(await copyText(fullReport())?'Relatório copiado.':'Não foi possível copiar automaticamente.');return;}
    if(e.target.closest('[data-fm-preview-report]')){FM.render();return;}
    if(e.target.closest('[data-fm-add-measure]')){const get=k=>document.querySelector(`[data-fm-measure-new="${k}"]`)?.value.trim()||'';const m={id:uid('measure'),type:get('type'),number:get('number'),notes:get('notes')};if(!m.type&&!m.number&&!m.notes)return;FM.mutate(st=>{st.conclusion||={};(st.conclusion.measures||=[]).push(m);});return;}
    const rm=e.target.closest('[data-fm-remove-measure]');if(rm){FM.mutate(st=>(st.conclusion.measures||=[]).splice(Number(rm.dataset.fmRemoveMeasure),1));return;}
    if(e.target.closest('[data-fm-add-inspector]')){const get=k=>document.querySelector(`[data-fm-inspector-new="${k}"]`)?.value.trim()||'';const i={id:uid('insp'),name:get('name'),registration:get('registration')};if(!i.name&&!i.registration)return;FM.mutate(st=>{st.conclusion||={};(st.conclusion.inspectors||=[]).push(i);});return;}
    const ri=e.target.closest('[data-fm-remove-inspector]');if(ri){FM.mutate(st=>(st.conclusion.inspectors||=[]).splice(Number(ri.dataset.fmRemoveInspector),1));return;}
  });
  document.addEventListener('input',e=>{
    const c=e.target.closest('[data-fm-conclusion-field]');if(c){FM.mutate(st=>{st.conclusion||={};st.conclusion[c.dataset.fmConclusionField]=c.value;},{render:false});return;}
    const legal=e.target.closest('[data-fm-nc-legal]');if(legal){const [s,item]=(legal.dataset.fmNcLegal||'').split('|');FM.mutate(st=>{const section=FM.ensureSection(st,s);section.fields[item+'_legal']=legal.value;},{render:false});}
  });
  document.addEventListener('change',e=>{const c=e.target.closest('select[data-fm-conclusion-field]');if(c)FM.mutate(st=>{st.conclusion||={};st.conclusion[c.dataset.fmConclusionField]=c.value;});});

  window.addEventListener('farmacia-manipulacao:copy-section',async e=>{
    const s=String(e.detail?.section||'');const text=sectionText(s);notify(text&&await copyText(text)?`Texto da Seção ${s} copiado.`:`Não há texto consolidado na Seção ${s}.`);
  });

  FM.registerRenderer('report',renderReport);
  window.FarmaciaManipulacaoReport={sectionText,fullReport,closingText,collectNCs,collectPending,renderReport,copyText};
  FM.render();
})();
