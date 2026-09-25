/* ——— Revisão dos textos da Distribuidora (etapa 2) ———
   Redação do requisito descumprido nas NCs que saíam como “Não cumpre o
   requisito avaliado: <pergunta>”, padronização das citações e correção das
   ligações com o inventário de infrações conferidas uma a uma.
   Aplicado sobre DATA na carga do módulo. */
const DIST_REV={
 /* NC: requisito descumprido (o que a norma exige e não foi atendido) */
 q159:{nc:'Não há fornecimento ou registro do fornecimento de equipamentos de proteção individual aos funcionários, conforme os requisitos de saúde, higiene e vestuário do pessoal.'},
 q282:{nc:'Não há procedimento para comunicação imediata à Comissão Nacional de Energia Nuclear (CNEN) em caso de sinistro, roubo ou furto de radiofármacos.',legal:'RDC Anvisa nº 430/2020, art. 71'},
 q293:{nc:'A qualificação do transporte não considera as especificações de conservação dos produtos transportados.',legal:'RDC Anvisa nº 430/2020, art. 64, III'},
 q338:{nc:'Os medicamentos devolvidos não são avaliados, com registro dos fatores ponderados pelo sistema de gestão da qualidade, antes da reintegração ao estoque comercializável.',legal:'RDC Anvisa nº 430/2020, arts. 34 e 35'},
 q368:{nc:'Não há sistema de escrituração da movimentação dos medicamentos sujeitos a controle especial.'},
 q388:{nc:'As áreas dos laboratórios de ensaios físico-químicos e microbiológicos não são separadas e independentes.'},
 q389:{nc:'O laboratório de controle microbiológico não dispõe de sistema de tratamento de ar adequado aos ensaios realizados.'},
 q390:{nc:'Não há área específica e controlada para armazenamento de amostras de referência e de medicamentos no controle de qualidade.',legal:'RDC Anvisa nº 670/2022, art. 7º; RDC Anvisa nº 1.039/2026, art. 4º, § 3º'},
 q393:{nc:'Os equipamentos do controle de qualidade não são qualificados ou calibrados, ou não há registro da manutenção preventiva.',legal:'RDC Anvisa nº 430/2020, arts. 40 e 41; RDC Anvisa nº 1.039/2026, art. 4º, § 3º'},
 q394:{nc:'Não há registro de uso (logbook) dos equipamentos críticos do controle de qualidade.'},
 q395:{nc:'O sistema de água purificada usado no controle de qualidade não é qualificado ou não é monitorado periodicamente.'},
 q396:{nc:'Os métodos analíticos não farmacopeicos utilizados não estão validados.',legal:'RDC Anvisa nº 166/2017'},
 q397:{nc:'Não foi demonstrada a adequabilidade dos métodos farmacopeicos nas condições operacionais do laboratório.',legal:'RDC Anvisa nº 166/2017'},
 q398:{nc:'Não são realizados testes de promoção de crescimento e controle negativo dos meios de cultura no controle microbiológico.'},
 q399:{nc:'As cepas de referência não são manuseadas e mantidas com controle do número de repiques.'},
 q400:{nc:'Os meios de cultura não são validados quando preparados pela empresa, ou não são adquiridos de fornecedor qualificado.'},
 q401:{nc:'Não são realizados, para cada carga recebida e lote a lote, os ensaios de controle de qualidade previstos no registro dos medicamentos importados (completos, ou no mínimo teor e produtos de degradação quando atendidos os requisitos de isenção).',legal:'RDC Anvisa nº 670/2022, arts. 8º e 9º'},
 q402:{nc:'A terceirização de análises de controle de qualidade não é precedida de qualificação do prestador ou de contrato que defina as responsabilidades.',legal:'RDC Anvisa nº 670/2022, art. 7º, parágrafo único; RDC Anvisa nº 1.039/2026, art. 4º, IX; RDC Anvisa nº 430/2020, arts. 72 a 76'},
 q405:{nc:'Os padrões de referência não são armazenados adequadamente ou não têm rastreabilidade garantida pelo certificado do fornecedor.'},
 q406:{nc:'Não há especificações e metodologias analíticas documentadas para todos os medicamentos importados.'},
 q407:{nc:'Os padrões de trabalho utilizados não são caracterizados e validados.'},
 q411:{nc:'O procedimento de investigação de resultados fora de especificação não define critérios para reteste e reamostragem.'},
 q415:{nc:'Não há procedimento formal de liberação de lote de medicamento importado pelo responsável técnico.'},
 q416:{nc:'A liberação para comercialização ocorre sem confirmação, pelo responsável técnico, de que todos os ensaios foram realizados e aprovados.'},
 q417:{nc:'O processo de liberação não impede a liberação de lotes que não cumprem as especificações.',legal:'RDC Anvisa nº 670/2022, arts. 4º e 9º, § 6º'},
 /* Ligações com o inventário corrigidas */
 q285:{inv:'inv-3-16'},q291:{inv:'inv-3-22'},q292:{inv:'inv-3-26'},q334:{inv:'inv-4-15'},
 q950:{legal:'RDC nº 204, de 14 de novembro de 2006, Anexo, item 7.2; IN nº 62, de 16 de junho de 2020, art. 2º'}
};
/* Ligações com nota de semelhança baixa conferidas e mantidas */
const DIST_REV_OK=['q159','q190','q195','q227','q229','q278','q282','q284','q290','q293','q321','q335','q336','q338','q339','q363','q368','q410','q412'];
(function distRevisar(){
 /* Fora do escopo da inspeção: termo de inutilização e comprovante de coleta de resíduos */
 for(const sec of DATA.sections)sec.questions=sec.questions.filter(q=>!['res-termo','res-coleta'].includes(q.id));
 for(const sec of DATA.sections)for(const q of sec.questions){const r=DIST_REV[q.id];
  if(r){if(r.nc)q.ncText=r.nc;if(r.legal)q.legal=r.legal;if(r.inv){q.inventoryMatch=r.inv;q.matchScore=1}if(r.recom){q.recomendacao=true;q.noNC=true}}
  if(DIST_REV_OK.includes(q.id))q.matchScore=1;
  if(q.legal)q.legal=String(q.legal).replace(/\bArt\. (\d)/g,'art. $1').replace(/\bart\. (\d+º?) e Art\. (\d)/g,'arts. $1 e $2').replace(/^RDC (\d)/,'RDC Anvisa nº $1');
 }
 /* Orientação sem dispositivo não vira NC */
 const oldAll=allNCs;allNCs=function(){return oldAll().filter(n=>!(n.source&&n.source.noNC))};
})();

/* Tela de item: a seção aberta não recolhe. Um toque no título, no “i” da
   orientação ou numa orientação da pergunta nunca esconde as perguntas. */
(function distItemFixo(){
 function unica(){const c=document.getElementById('inspectionContent');if(!c||c.querySelector('.dist-subitem-menu'))return null;const d=c.querySelectorAll('details.section');return d.length===1?d[0]:null}
 document.addEventListener('click',function(e){const s=e.target.closest&&e.target.closest('#inspectionContent details.section>summary');if(!s)return;const d=unica();if(d&&s.parentElement===d&&d.open&&!e.target.closest('[data-pop-orient]'))e.preventDefault()},true);
 document.addEventListener('toggle',function(e){const t=e.target;if(!t||!t.matches)return;if(t.matches('details.section')){const d=unica();if(d===t&&!t.open){t.open=true;DIST_ABERTOS[distChaveSecao(t)]=true}}if(t.matches('details[data-chk]')&&!t.open&&unica()){t.open=true;DIST_CHK_ABERTOS[t.getAttribute('data-chk')]=true}},true);
 const oldR=renderITab;renderITab=function(){const r=oldR.apply(this,arguments);const d=unica();if(d&&!d.open)d.open=true;document.querySelectorAll('#inspectionContent details[data-chk]').forEach(x=>{if(unica()&&!x.open)x.open=true});return r};
})();
/* Orientação da pergunta sempre na largura da pergunta. Em tela larga
   (tablet deitado, ≥ 1050 px) ela ia para uma coluna lateral de 8 linhas:
   aberta, empurrava a pergunta e os botões para fora da vista; fechada,
   deixava um bloco vazio ao lado. */
(function(){const st=document.createElement('style');st.id='dist-hint-fix';st.textContent='@media(min-width:1050px){.q-has-hint>.qmain{display:block!important}.q-has-hint>.qmain>.dist-hint{grid-column:auto!important;grid-row:auto!important;margin:8px 0 2px!important}}';document.head.appendChild(st)})();
/* Normas conferidas na íntegra (AnvisaLegis) usadas no controle de qualidade da importadora. */
(function(){const add=(name,role,url)=>{if(!DATA.sources.some(s=>s.name===name))DATA.sources.push({name,rev:'—',vigencia:'vigente',role,url})};
 add('RDC Anvisa nº 670/2022','Requisitos mínimos para garantir a qualidade dos medicamentos importados: laboratório de controle de qualidade próprio, ensaios lote a lote, isenção e certificado de liberação (arts. 4º a 9º).','https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&tipo=RDC&numeroAto=00000670&seqAto=000&valorAno=2022&orgao=RDC/DC/ANVISA/MS&cod_menu=1696&cod_modulo=134');
 add('RDC Anvisa nº 1.039/2026','Boas Práticas para Laboratórios Analíticos. Art. 4º, § 3º: laboratórios de controle de qualidade de medicamentos seguem o guia da OMS (TRS 1052, Anexo 4, 2024).','https://anvisalegis.datalegis.net/action/ActionDatalegis.php?acao=abrirTextoAto&tipo=RDC&numeroAto=00001039&seqAto=000&valorAno=2026&orgao=RDC/DC/ANVISA/MS&cod_menu=1696&cod_modulo=134');
 add('RDC Anvisa nº 166/2017','Validação de métodos analíticos.','');
})();

/* Para saber mais: conceitos e referências técnicas no início de cada bloco */
(function(){const old=sectionHtml;sectionHtml=function(sec){let h=old(sec);const sm=sec&&window.SaberMais?SaberMais.html('dist',sec.id):'';if(!sm)return h;const i=h.indexOf('<details class="section-chk"');return i>=0?h.slice(0,i)+sm+h.slice(i):h.replace('<div class="sectionbody">','<div class="sectionbody">'+sm)}})();
