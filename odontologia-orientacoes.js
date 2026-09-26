/* ——— Odontologia: “Para saber mais” nos itens que remetem à ABNT ———
   Mesmo formato do núcleo de medicamentos (saber-mais.js): não é norma, não
   capitula infração, não vira citação e não entra no relatório. As normas ABNT
   são pagas e não estão no banco do app; o próprio artigo da RDC 1.002/2025
   (aberto pelo botão de citação) é que faz a remissão a elas.
   Inserido no módulo por scripts/repack-odontologia.cjs. */
(function(){
 if(window.__odontoOrient)return;window.__odontoOrient=true;
 var CLIMA=[
  ['O que a RDC exige','Consultório sem anestesia (art. 14, I): ventilação natural com circulação e renovação de ar, OU climatização conforme a ABNT NBR 7256. Centro Cirúrgico Odontológico (art. 24, VI): sistema de ventilação e climatização que atenda à NBR 7256 — no CCO não existe a alternativa da ventilação natural.'],
  ['Ar-condicionado tipo split atende?','O split resfria e recircula o ar da própria sala: não traz ar externo, portanto não faz a renovação de ar. No consultório, ele é aceitável como conforto quando a sala também tem ventilação natural efetiva (janela ou abertura para o exterior que funcione e seja usada). Sala sem abertura para o exterior, só com split, não cumpre a primeira opção e passa a depender da segunda: sistema projetado conforme a NBR 7256, com tomada de ar externo filtrado e, quando necessário, exaustão. Nesse caso, peça o projeto ou memorial descritivo do sistema e a ART/RRT do responsável. No CCO, split sozinho não atende.'],
  ['Manutenção (PMOC)','Havendo climatização artificial, a Lei Federal nº 13.589/2018 exige Plano de Manutenção, Operação e Controle (PMOC) dos sistemas (art. 1º), com parâmetros de qualidade do ar (art. 3º). Confira o PMOC, os registros de limpeza e troca de filtros e o estado do equipamento: filtros limpos, bandeja de condensado sem água parada, sem mofo nem sujidade na grelha.'],
  ['Sobre a NBR 7256','Norma técnica da ABNT sobre tratamento de ar em estabelecimentos assistenciais de saúde (texto pago, fora do banco do app). Na inspeção, confira pelo projeto ou laudo apresentado pelo serviço, e não por valores de memória.']
 ];
 var PCD=[
  ['O que a RDC permite','Clínica com até 2 consultórios individuais pode ter um único sanitário, desde que adaptado para pessoa com deficiência conforme a ABNT NBR 9050 (art. 18).'],
  ['Pontos usuais da NBR 9050 para conferir','Área livre para giro da cadeira de rodas (círculo de 1,50 m de diâmetro); porta com vão livre de pelo menos 0,80 m; barras de apoio junto à bacia sanitária (lateral e de fundo); lavatório sem coluna, com espaço livre por baixo para aproximação; acesso sem degrau ou com rampa. Em caso de dúvida sobre medidas, peça o projeto ou laudo de acessibilidade.'],
  ['Sobre a NBR 9050','Norma técnica da ABNT de acessibilidade (texto pago, fora do banco do app); a obrigação vem da RDC, que remete a ela.']
 ];
 var ITENS={fi11:CLIMA,cc6:CLIMA,ap5:PCD};
 function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
 function caixa(l){return '<details class="sm-box od-orient"><summary>📘 Para saber mais — conceitos e referências técnicas</summary>'+l.map(function(x){return '<p><b>'+esc(x[0])+(/[?.]$/.test(x[0])?'':'.')+'</b> '+esc(x[1])+'</p>'}).join('')+'<p class="sm-nota">Apoio ao inspetor: não é norma, não capitula infração e não entra no relatório.</p></details>'}
 var css='.sm-box{border:1px solid #cbd9c9;border-left:4px solid #4f7a52;border-radius:0 10px 10px 0;background:#f4f8f3;margin:8px 0;padding:0 12px}.sm-box>summary{cursor:pointer;padding:9px 0;font-weight:700;color:#2f5733;font-size:.84rem;list-style:none}.sm-box>summary::-webkit-details-marker{display:none}.sm-box p{margin:0 0 8px;font-size:.84rem;line-height:1.45;color:#2c3a33}.sm-box .sm-nota{font-size:.74rem;color:#6a7a70}';
 function poe(){if(!document.getElementById('od-orient-css')){var s=document.createElement('style');s.id='od-orient-css';s.textContent=css;document.head.appendChild(s)}
  Object.keys(ITENS).forEach(function(id){var b=document.querySelector('.item [data-a="'+id+'"]');if(!b)return;var art=b.closest('.item');if(!art||art.querySelector('.od-orient'))return;
   var alvo=art.querySelector('.item-t');var host=alvo&&alvo.parentElement||art;host.insertAdjacentHTML('beforeend',caixa(ITENS[id]))})}
 var agenda=false;function depois(){if(agenda)return;agenda=true;setTimeout(function(){agenda=false;poe()},50)}
 function liga(){poe();new MutationObserver(depois).observe(document.body,{childList:true,subtree:true})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',liga);else liga();
})();
