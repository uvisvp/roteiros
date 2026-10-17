'use strict';
/* Motor roteiro-simples (17/10/2026), no EAC: checklist por ponto (um “Não
   atende” faz a pergunta “Não cumpre” e a frase lista o ponto; todos atendidos,
   “Cumpre”); anotação digitada em qualquer pergunta vai ao relatório;
   inventário de irregularidades por ambiente; perfil do Tipo III marca o item
   todo como “Não se aplica”, com aviso, e o relatório omite o que não se aplica.
   Uso: node scripts/e2e/checklist.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
(async()=>{const b=await T.navegador();
 let {p,f,erros}=await T.abre('Serviços','eac-tipo2','EAC — Serviço Tipo II','',{browser:b});
 const st=k=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}'),k);
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'dados'}));await p.waitForTimeout(300);
 await f.fill('input[data-rs-meta="fantasia"]','Posto Teste');await f.selectOption('select[data-rs-meta="tipo_est"]','posto');await p.waitForTimeout(200);
 // checklist
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'infra',item:'salacoleta'}));await p.waitForTimeout(300);
 ok(await f.evaluate(()=>document.querySelectorAll('[data-rs-pt^="mobiliario|"]').length)===27,'sala de coleta: 9 pontos × 3 botões');
 for(const pt of ['triagem','lavatorio','bancada','mesa','cadeira','expedicao','deposito','descarte'])await f.click(`[data-rs-pt="mobiliario|${pt}|C"]`);
 let s=await st('uvis-eac-tipo2-v1');ok(!s.r.mobiliario,'checklist incompleto: resultado em aberto');
 await f.click('[data-rs-pt="mobiliario|maca|NC"]');await p.waitForTimeout(200);
 s=await st('uvis-eac-tipo2-v1');ok(s.r.mobiliario==='nc','um ponto “Não atende”: Não cumpre');
 for(const pt of ['exclusivo','registro','fabricante'])await f.click(`[data-rs-pt="refrigerador|${pt}|C"]`);await p.waitForTimeout(200);
 s=await st('uvis-eac-tipo2-v1');ok(s.r.refrigerador==='c','todos os pontos atendidos: Cumpre');
 // anotação
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'classif',item:'lic'}));await p.waitForTimeout(300);
 await f.click('[data-rs-r="cnes|c"]');await p.waitForTimeout(200);
 await f.evaluate(()=>{const d=document.querySelector('[data-rs-anot="cnes"]');d.open=true});
 await f.fill('textarea[data-rs-sit="cnes"]','conferido no CNESNet durante a inspeção');await p.waitForTimeout(200);
 // inventário por ambiente
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'infra',item:'inventario'}));await p.waitForTimeout(300);
 await f.click('[data-rs-amb-add="amb_inv|Recepção"]');await p.waitForTimeout(300);
 await f.check('[data-rs-amb-m="amb_inv|0|s02"]');await p.waitForTimeout(300);
 ok(await f.evaluate(()=>/1 irregularidade/.test(document.querySelector('.rs-amb')?.textContent||'')),'ambiente com 1 irregularidade');
 const rel=await T.texto(f,'eac-tipo2');
 ok(/A sala de coleta e execução não dispõe de: maca\./.test(rel),'relatório: frase com o ponto não atendido');
 ok(/Conferido no CNESNet durante a inspeção\./.test(rel),'relatório: anotação da pergunta');
 ok(/Recepção[\s\S]{0,80}(Infiltração|infiltração)/.test(rel),'relatório: irregularidade do ambiente');
 if(erros.length)T.falha('erros de página (Tipo II): '+erros.join(' / '));
 await p.close();
 // Tipo III: perfil
 ({p,f,erros}=await T.abre('Serviços','eac-tipo3','EAC — Serviço Tipo III','',{browser:b}));
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'perfil'}));await p.waitForTimeout(300);
 for(const c of ['p_apoio','p_postos','p_itinerante','p_cd','p_inhouse','p_agua','p_atm'])await f.selectOption(`select[data-rs-meta="${c}"]`,'nao');
 await f.selectOption('select[data-rs-meta="p_apoio"]','sim');await p.waitForTimeout(300);
 s=await p.evaluate(()=>JSON.parse(localStorage.getItem('uvis-eac-tipo3-v1')||'{}'));
 ok(['cd_reg','cd_infra','cd_ativ','cd_registro','itin_reg','mp_doc','agua_pureza','atm'].every(k=>s.r[k]==='na'),'perfil “Não”: Central, itinerante, metodologia própria, água e antimicrobianos como Não se aplica');
 ok(!s.r.apoio_contrato,'perfil “Sim” (apoio): verificação em aberto');
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'relacoes',item:'cd'}));await p.waitForTimeout(300);
 ok(await f.evaluate(()=>/Central de Distribuição/.test(document.querySelector('.rs-na-item')?.textContent||'')),'item Central de Distribuição com aviso de Não se aplica');
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'relacoes',item:'apoio'}));await p.waitForTimeout(300);
 await f.click('[data-rs-r="apoio_avaliacao|c"]');await p.waitForTimeout(200);
 const rel3=await T.texto(f,'eac-tipo3');
 ok(/laboratório de apoio é avaliado anualmente/.test(rel3)&&/Atividades: envio de exames a laboratório de apoio/.test(rel3),'relatório: perfil e verificação do que o laboratório faz');
 ok(!/Central de Distribuição|itinerante|Não se aplica/i.test(rel3),'relatório: sem o que não se aplica');
 if(erros.length)T.falha('erros de página (Tipo III): '+erros.join(' / '));
 await b.close()})();
