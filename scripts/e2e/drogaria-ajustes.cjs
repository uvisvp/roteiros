'use strict';
/* Drogaria — ajustes de 09/11/2026: dados do CNPJ pela Receita Federal (BrasilAPI simulada; nada
   vai à rede), atividades licenciadas em lista, vacinação/EAC em “Não” fora do relatório, irregularidades
   da amostragem de controlados recolhidas na tela e agrupadas no relatório, considerações finais sem
   repetir a lista; Manipulação com o botão da Receita. Uso: node scripts/e2e/drogaria-ajustes.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
const CNPJ='00145307000180';
const RF={razao_social:'EMPRESA TESTE LTDA',nome_fantasia:'TESTE',descricao_tipo_de_logradouro:'RUA',logradouro:'A',numero:'10',complemento:'',bairro:'CENTRO',municipio:'SAO PAULO',uf:'SP',cep:'01001000',cnae_fiscal:4771701,cnae_fiscal_descricao:'Comércio varejista de produtos farmacêuticos',descricao_situacao_cadastral:'ATIVA',qsa:[{nome_socio:'FULANO DE TAL',qualificacao_socio:'Sócio-Administrador'}]};
const rota=p=>p.route(/brasilapi\.com\.br\/api\/cnpj\/v1\//,r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(RF)}));
(async()=>{const b=await T.navegador();
 {const {p,f}=await T.abre('Medicamentos','drogaria','Drogaria','',{browser:b});await rota(p);
  await f.evaluate(c=>{const s=DrogariaAPI.getState();s.meta.cnpj=c;s.meta.finalidade='Renovação';DrogariaAPI.setState(s)},CNPJ);
  await f.evaluate(()=>document.querySelector('.ui-card-grid [data-card="1"]').click());await p.waitForTimeout(500);
  await f.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/Identificação do estabelecimento/.test(x.textContent)&&/Abrir/.test(x.textContent));b&&b.click()});await p.waitForTimeout(500);
  await f.evaluate(()=>document.querySelector('[data-s1-receita]').click());await p.waitForTimeout(1200);
  const m=await f.evaluate(()=>DrogariaAPI.getState().meta);
  ok(m.razao==='EMPRESA TESTE LTDA'&&m.cnae==='4771-7/01 — Comércio varejista de produtos farmacêuticos'&&m.resp_legal==='FULANO DE TAL'&&m.cep==='01001-000','drogaria: Receita Federal preenche os campos vazios');
  ok(await f.evaluate(()=>!document.querySelector('textarea[data-s1-path="meta.atividade_licenciada"]')&&document.querySelectorAll('[data-s1-activity]').length>=10),'drogaria: atividades licenciadas em lista, sem campo “uma por linha”');
  const t=await f.evaluate(()=>{const s=DrogariaAPI.getState();s.answers.vaccine='nao';s.answers.vaccine_licensed='sim';s.answers.eac='nao';s.meta.lic_vacinacao='999';DrogariaAPI.setState(s,{render:false});return DrogariaAPI.report().blocks.map(b=>[b.k,b.x,b.v].filter(Boolean).join(' ')).join('\n')});
  ok(!/Licença sanitária específica/.test(t),'drogaria: vacinação/EAC em “Não” não saem no relatório');
  /* amostragem de controlados */
  await f.evaluate(()=>{const s=DrogariaAPI.getState();s.fields.products=['controlado'];s.fields.rx_categories=['controlado'];s.answers.rx_sample='sim';s.answers.rx_all='nao';DrogariaAPI.setState(s)});
  await f.evaluate(()=>DrogariaAPI.changeView('roteiro',0));await p.waitForTimeout(400);
  await f.evaluate(()=>document.querySelector('.ui-card-grid [data-card="4"]').click());await p.waitForTimeout(500);
  await f.evaluate(()=>[...document.querySelectorAll('button')].find(x=>/Dispensa/.test(x.textContent)&&/Abrir/.test(x.textContent)).click());await p.waitForTimeout(500);
  await f.evaluate(()=>{const l=[...document.querySelectorAll('label')].find(x=>x.textContent.trim()==='A1');l.querySelector('input').click()});await p.waitForTimeout(600);
  const d=await f.evaluate(()=>{const g=document.querySelector('details.drg-achados');return g?{open:g.open,n:g.querySelectorAll('[data-finding]').length,s:g.querySelector('summary').textContent}:null});
  ok(d&&!d.open&&d.n>5&&/Lista A1/.test(d.s),'drogaria: irregularidades da amostragem recolhidas por lista ('+(d&&d.s)+')');
  await f.evaluate(()=>{const g=document.querySelector('details.drg-achados');g.open=true;g.dispatchEvent(new Event('toggle'))});await p.waitForTimeout(200);
  for(const t of ['A1: Ausência do receituário','A1: Receituário ilegível']){await f.evaluate(t=>[...document.querySelectorAll('label')].find(x=>x.textContent.trim().startsWith(t)).querySelector('input').click(),t);await p.waitForTimeout(400)}
  ok(await f.evaluate(()=>document.querySelector('details.drg-achados').open),'drogaria: a lista continua aberta depois de marcar');
  const r=await f.evaluate(()=>DrogariaAPI.report().blocks.map(b=>b.x||b.v||'').join('\n'));
  ok((r.match(/na amostragem de controlados, A1:/g)||[]).length===1&&/a\) Ausência do receituário exigido\./.test(r)&&/b\) Receituário ilegível/.test(r),'drogaria: a frase da amostragem sai uma vez, com as irregularidades em lista');
  ok(/Foram verificadas irregularidades em: dispensação e escrituração/.test(r)&&!/CONSIDERAÇÕES FINAIS[\s\S]*Ausência do receituário/.test(r),'drogaria: considerações finais citam os itens, sem repetir a lista');
  await p.close()}
 {const {p,f}=await T.abre('Medicamentos','farmacia-manipulacao','Farmácia com manipulação','',{browser:b});await rota(p);await p.waitForTimeout(800);
  await f.evaluate(()=>document.querySelector('[data-open-card="1"]').click());await p.waitForTimeout(800);
  await f.evaluate(()=>[...document.querySelectorAll('button')].find(x=>/Identificação/.test(x.textContent)&&/Abrir/.test(x.textContent)).click());await p.waitForTimeout(800);
  const cn=f.locator('#id_cnpj');await cn.fill('00.145.307/0001-80');await p.waitForTimeout(600);
  await f.evaluate(()=>[...document.querySelectorAll('button')].find(x=>/Receita Federal/.test(x.textContent)).click());await p.waitForTimeout(1200);
  const v=await f.evaluate(()=>({razao:(document.querySelector('#id_razao')||{}).value,fantasia:(document.querySelector('#id_fantasia')||{}).value}));
  ok(v.razao==='EMPRESA TESTE LTDA'&&v.fantasia==='TESTE','manipulação: botão da Receita Federal preenche razão social e fantasia ('+JSON.stringify(v)+')');await p.close()}
 /* EAC em drogaria: escolher na lista suspensa ou responder não tira a página do lugar */
 {const {p,f}=await T.abre('Medicamentos','eac-drogaria','EAC em drogaria','',{browser:b,viewport:{width:400,height:800}});
  await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'dados'}));await p.waitForTimeout(500);
  await f.evaluate(()=>document.querySelector('select[data-rs-meta]').scrollIntoView({block:'center'}));await p.waitForTimeout(200);
  const y0=await f.evaluate(()=>Math.round(scrollY));await f.locator('select[data-rs-meta]').first().selectOption({index:1});await p.waitForTimeout(500);
  const y1=await f.evaluate(()=>Math.round(scrollY));ok(y0>0&&Math.abs(y1-y0)<5,'EAC em drogaria: a lista suspensa não tira a página do lugar ('+y0+' → '+y1+')');
  const t=await f.evaluate(()=>document.body.innerText);ok(!/Equipamentos de medição em uso/.test(t),'EAC em drogaria: identificação sem “Equipamentos de medição em uso”');
  await p.close()}
 /* 10/11/2026 — Vacinação em drogaria: resposta e lista de itens coerentes, licença inicial, relatório consolidado */
 {const {p,f}=await T.abre('Medicamentos','vacina-drogaria','Vacinação em drogaria','',{browser:b,viewport:{width:400,height:800}});
  const st=()=>f.evaluate(()=>JSON.parse(localStorage.getItem('uvis-vacina-drogaria-v1')));
  const R=async(q,v)=>{await f.evaluate(([q,v])=>document.querySelector('[data-rs-r="'+q+'|'+v+'"]').click(),[q,v]);await p.waitForTimeout(300)};
  const P=async(q,k,v)=>{await f.evaluate(([q,k,v])=>document.querySelector('[data-rs-pt="'+q+'|'+k+'|'+v+'"]').click(),[q,k,v]);await p.waitForTimeout(300)};
  await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'organizacao',item:'regularidade'}));await p.waitForTimeout(500);
  ok(/contempla a atividade de vacinação\?[\s\S]*licença inicial/.test(await f.evaluate(()=>document.querySelector('[data-rs-q="lic"]').innerText)),'vacinação em drogaria: pergunta da licença com a orientação para licença inicial');
  await R('lic','na');
  await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'infra',item:'ambientes'}));await p.waitForTimeout(500);
  await R('recepcao','c');let s=await st();ok(Object.values(s.pt.recepcao).join('')==='CCC','vacinação em drogaria: Sim marca todos os itens como Atende');
  await P('recepcao','dimensionada','NC');s=await st();ok(s.r.recepcao==='nc','vacinação em drogaria: um item Não atende muda a resposta para Não');
  await R('sanitario','c');await R('sala','c');
  await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'infra',item:'sala'}));await p.waitForTimeout(500);
  await P('mobiliario','maca','NC');await R('mobiliario','c');s=await st();ok(s.r.mobiliario==='c'&&s.pt.mobiliario.maca==='C','vacinação em drogaria: Sim depois de um Não atende deixa a lista coerente');
  await p.waitForTimeout(1200);
  await f.evaluate(()=>document.querySelector('[data-rs-pt="descarte|perfuro|NC"]').scrollIntoView({block:'center'}));await p.waitForTimeout(250);
  const y0=await f.evaluate(()=>Math.round(document.querySelector('[data-rs-pt="descarte|perfuro|NC"]').getBoundingClientRect().top));await P('descarte','perfuro','NC');await p.waitForTimeout(1100);
  const y1=await f.evaluate(()=>Math.round(document.querySelector('[data-rs-pt="descarte|perfuro|NC"]').getBoundingClientRect().top));ok(Math.abs(y1-y0)<=2,'vacinação em drogaria: marcar item da lista não move a tela ('+y0+' → '+y1+')');
  await f.evaluate(()=>UvisPadrao.vai({aba:'relatorio'}));await p.waitForTimeout(1200);
  const t=await f.evaluate(()=>document.querySelector('.rs-relatorio').innerText);
  ok(/O estabelecimento dispõe de sanitário e sala de vacinação fechada por paredes em todo o perímetro e com porta\. A área de recepção não é dimensionada à demanda\./.test(t)&&!/Há sanitário\./.test(t),'vacinação em drogaria: conformidades do item numa frase só');
  ok(/Trata-se de licença inicial da atividade de vacinação/.test(t),'vacinação em drogaria: licença inicial sai no relatório');
  await p.close()}
 /* Drogaria: responder não move a tela (âncora de rolagem) */
 {const {p,f}=await T.abre('Medicamentos','drogaria','Drogaria','',{browser:b,viewport:{width:400,height:800}});
  await f.evaluate(()=>document.querySelector('.ui-card-grid [data-card="2"]').click());await p.waitForTimeout(600);
  await f.evaluate(()=>[...document.querySelectorAll('button')].find(x=>/Dispensação/.test(x.textContent)&&/Abrir/.test(x.textContent)).click());await p.waitForTimeout(700);
  const S='[data-af-answer="area_dispensacao|mips|sim"]';
  await f.evaluate(s=>document.querySelector(s).scrollIntoView({block:'center'}),S);await p.waitForTimeout(300);
  const y0=await f.evaluate(s=>Math.round(document.querySelector(s).getBoundingClientRect().top),S);await f.evaluate(s=>document.querySelector(s).click(),S);await p.waitForTimeout(1300);
  const y1=await f.evaluate(s=>Math.round(document.querySelector(s).getBoundingClientRect().top),S);ok(Math.abs(y1-y0)<=2,'drogaria: responder não move a tela ('+y0+' → '+y1+')');
  await p.close()}
 await b.close();
})().catch(e=>{T.falha(e.stack||e);process.exit(1)});
