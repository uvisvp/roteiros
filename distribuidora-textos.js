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
 q390:{nc:'Não há área específica e controlada para armazenamento de amostras de referência e de medicamentos no controle de qualidade.',legal:'RDC Anvisa nº 430/2020, art. 50'},
 q393:{nc:'Os equipamentos do controle de qualidade não são qualificados ou calibrados, ou não há registro da manutenção preventiva.',legal:'RDC Anvisa nº 430/2020, arts. 40 e 41'},
 q394:{nc:'Não há registro de uso (logbook) dos equipamentos críticos do controle de qualidade.'},
 q395:{nc:'O sistema de água purificada usado no controle de qualidade não é qualificado ou não é monitorado periodicamente.'},
 q396:{nc:'Os métodos analíticos não farmacopeicos utilizados não estão validados.',legal:'RDC Anvisa nº 166/2017'},
 q397:{nc:'Não foi demonstrada a adequabilidade dos métodos farmacopeicos nas condições operacionais do laboratório.',legal:'RDC Anvisa nº 166/2017'},
 q398:{nc:'Não são realizados testes de promoção de crescimento e controle negativo dos meios de cultura no controle microbiológico.'},
 q399:{nc:'As cepas de referência não são manuseadas e mantidas com controle do número de repiques.'},
 q400:{nc:'Os meios de cultura não são validados quando preparados pela empresa, ou não são adquiridos de fornecedor qualificado.'},
 q401:{nc:'Não são realizadas todas as análises de controle de qualidade dos medicamentos importados previstas nas especificações do registro.',legal:'RDC Anvisa nº 430/2020, art. 8º'},
 q402:{nc:'A terceirização de análises de controle de qualidade não é precedida de qualificação do prestador ou de contrato que defina as responsabilidades.',legal:'RDC Anvisa nº 430/2020, arts. 72 a 76'},
 q405:{nc:'Os padrões de referência não são armazenados adequadamente ou não têm rastreabilidade garantida pelo certificado do fornecedor.'},
 q406:{nc:'Não há especificações e metodologias analíticas documentadas para todos os medicamentos importados.'},
 q407:{nc:'Os padrões de trabalho utilizados não são caracterizados e validados.'},
 q411:{nc:'O procedimento de investigação de resultados fora de especificação não define critérios para reteste e reamostragem.'},
 q415:{nc:'Não há procedimento formal de liberação de lote de medicamento importado pelo responsável técnico.'},
 q416:{nc:'A liberação para comercialização ocorre sem confirmação, pelo responsável técnico, de que todos os ensaios foram realizados e aprovados.'},
 q417:{nc:'O processo de liberação não impede a liberação de lotes que não cumprem as especificações.',legal:'RDC Anvisa nº 430/2020, art. 8º'},
 /* Ligações com o inventário corrigidas */
 q285:{inv:'inv-3-16'},q291:{inv:'inv-3-22'},q292:{inv:'inv-3-26'},q334:{inv:'inv-4-15'},
 /* Sem dispositivo específico localizado no acervo integrado: orientação, sem gerar NC */
 'res-termo':{recom:true},'res-coleta':{recom:true},
 q950:{legal:'RDC nº 204, de 14 de novembro de 2006, Anexo, item 7.2; IN nº 62, de 16 de junho de 2020, art. 2º'}
};
/* Ligações com nota de semelhança baixa conferidas e mantidas */
const DIST_REV_OK=['q159','q190','q195','q227','q229','q278','q282','q284','q290','q293','q321','q335','q336','q338','q339','q363','q368','q410','q412'];
(function distRevisar(){
 for(const sec of DATA.sections)for(const q of sec.questions){const r=DIST_REV[q.id];
  if(r){if(r.nc)q.ncText=r.nc;if(r.legal)q.legal=r.legal;if(r.inv){q.inventoryMatch=r.inv;q.matchScore=1}if(r.recom){q.recomendacao=true;q.noNC=true}}
  if(DIST_REV_OK.includes(q.id))q.matchScore=1;
  if(q.legal)q.legal=String(q.legal).replace(/\bArt\. (\d)/g,'art. $1').replace(/\bart\. (\d+º?) e Art\. (\d)/g,'arts. $1 e $2').replace(/^RDC (\d)/,'RDC Anvisa nº $1');
 }
 /* Orientação sem dispositivo não vira NC */
 const oldAll=allNCs;allNCs=function(){return oldAll().filter(n=>!(n.source&&n.source.noNC))};
})();
