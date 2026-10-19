'use strict';
/* Transporte de material biológico e Diagnóstico por imagem (19/10/2026): inventário de veículos
   (campo de ambientes com o termo “veículo”), perfil com “Não se aplica”, equipamentos de imagem,
   grupo com os seis roteiros e Lei 13.725 nas irregularidades. Uso: node scripts/e2e/transporte-imagem.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
(async()=>{const b=await T.navegador();
 let {p,f,erros}=await T.abre('Serviços','transporte-biologico','Transporte de material biológico','',{browser:b});
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'perfil'}));await p.waitForTimeout(300);
 for(const c of ['p_sangue','p_catA','p_refrig','p_temp','p_terc','p_reuso'])await f.selectOption(`select[data-rs-meta="${c}"]`,'nao');await p.waitForTimeout(300);
 let s=await p.evaluate(()=>JSON.parse(localStorage.getItem('uvis-transporte-biologico-v1')||'{}'));
 ok(['cat_a','refrigerante','validacao','reuso','sangue_temp','sangue_caixa','contrato'].every(k=>s.r[k]==='na'),'perfil “Não”: Categoria A, refrigerante, temperatura, reúso, sangue e contrato como Não se aplica');
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'veiculos',item:'frota'}));await p.waitForTimeout(300);
 ok(await f.evaluate(()=>/\+ Outro veículo/.test(document.querySelector('[data-rs-amb-add]')?.textContent||'')),'inventário: botão “+ Outro veículo”');
 await f.click('[data-rs-amb-add="veic_inv"]');await p.waitForTimeout(300);
 ok(await f.evaluate(()=>/Nome do veículo/.test(document.querySelector('.rs-amb')?.textContent||'')),'inventário: campo “Nome do veículo”');
 await f.fill('[data-rs-amb="veic_inv|0|nome"]','Furgão placa ABC1D23');await p.waitForTimeout(200);
 await f.check('[data-rs-amb-m="veic_inv|0|v01"]');await p.waitForTimeout(300);
 await f.click('[data-rs-r="veic_info|c"]');await p.waitForTimeout(200);
 const rel=await T.texto(f,'transporte-biologico');
 ok(/A transportadora utiliza furgão placa ABC1D23/i.test(rel),'relatório: lista dos veículos');
 ok(/Irregularidades constatadas nos veículos/.test(rel)&&/veículo sujo/i.test(rel),'relatório: irregularidade do veículo');
 const irr=rel.slice(rel.indexOf('IRREGULARIDADES'));
 ok(/RDC Anvisa nº 504\/2021, art\. 34/.test(irr)&&/Lei Municipal nº 13\.725\/2004, art\. 46/.test(irr),'irregularidade: RDC 504, art. 34, e Lei 13.725, art. 46');
 ok(!/ambiente/i.test(rel),'relatório sem a palavra “ambiente”');
 if(erros.length)T.falha('erros de página (transporte): '+erros.join(' / '));await p.close();
 // imagem: grupo, ionizante x não ionizante, equipamento
 const apps={'imagem-convencional':'Radiologia convencional','imagem-mamografia':'Mamografia','imagem-tomografia':'Tomografia computadorizada','imagem-ressonancia':'Ressonância magnética','imagem-ultrassom':'Ultrassonografia','imagem-hemodinamica':'Hemodinâmica e radiologia intervencionista'};
 for(const [app,tit] of Object.entries(apps)){({p,f,erros}=await T.abre('Serviços',app,tit,'',{browser:b}));
  const secs=await f.evaluate(()=>UvisPadrao.lista().map(s=>s.id));
  const ion=!/ressonancia|ultrassom/.test(app);
  ok(secs.includes('protecao')===ion,app+': seção de proteção radiológica '+(ion?'presente':'ausente'));
  await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'qualidade',item:'equipamentos'}));await p.waitForTimeout(300);
  ok(await f.evaluate(()=>/Último teste de constância/.test(document.querySelector('.rs-eqs')?.textContent||'')),app+': equipamento com a data do teste de constância');
  if(erros.length)T.falha('erros de página ('+app+'): '+erros.join(' / '));await p.close();}
 ({p,f,erros}=await T.abre('Serviços','imagem-mamografia','Mamografia','',{browser:b}));
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'modalidade',item:'especifica'}));await p.waitForTimeout(300);
 await f.click('[data-rs-r="pnqm|nc"]');await p.waitForTimeout(300);
 const relm=await T.texto(f,'imagem-mamografia');const irm=relm.slice(relm.indexOf('IRREGULARIDADES'));
 ok(/Portaria de Consolidação GM\/MS nº 5\/2017, art\. 216/.test(irm)&&/Lei Municipal nº 13\.725\/2004, art\. 63/.test(irm),'mamografia: PNQM com PRC 5/2017, art. 216, e Lei 13.725, art. 63');
 if(erros.length)T.falha('erros de página (mamografia): '+erros.join(' / '));
 await b.close()})();
