'use strict';
/* Funções comuns: Salvas (salvar e começar outra, retomar), Apagar tudo, fotos e
   retorno ao roteiro depois de abrir arquivo gerado. Uso: node scripts/e2e/funcoes.cjs */
const T=require('./lib.cjs');
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
(async()=>{const b=await T.navegador();
 const evid=(p,pre)=>p.evaluate(pre=>new Promise(r=>{const q=indexedDB.open('roteiro-evidencias-v1',1);q.onupgradeneeded=()=>q.result.createObjectStore('photos',{keyPath:'key'});q.onsuccess=()=>{const t=q.result.transaction('photos','readonly').objectStore('photos').getAll();t.onsuccess=()=>{r(t.result.filter(x=>x.scope.startsWith(pre)).length);q.result.close()}}}),pre);
 const put=(p,scope)=>p.evaluate(([scope,png])=>new Promise(r=>{const q=indexedDB.open('roteiro-evidencias-v1',1);q.onupgradeneeded=()=>q.result.createObjectStore('photos',{keyPath:'key'});q.onsuccess=()=>{const tx=q.result.transaction('photos','readwrite');tx.objectStore('photos').put({key:scope+'|t1',scope,id:'t1',dataUrl:png});tx.oncomplete=()=>{q.result.close();r()}}}),[scope,PNG]);
 const CASOS=[['Medicamentos','drogaria','Drogaria','','drogaria-card-2','drogaria-inspecao-v4'],['Medicamentos','farmacia-manipulacao','Farmácia com Manipulação','','manipulacao-card-1','uvisvp_manipulacao_v1'],['Medicamentos','distribuidoras-transportadoras','Distribuidora / transportadora','','dist-card-3','uvis-dist-bpdiat-v2'],['Produtos','produtos-correlatos','Atacadista / distribuidor','atividade=atacadista','uvis-produtos-v2','uvis-produtos-v2'],['Odontologia','odontologia','Odontologia','',null,'odonto-rdc1002-v1'],['Alimentos','servicos-alimentacao-roteiro','Inspeção do estabelecimento','',null,'uvis-alimentos-estab-v1']];
 for(const [n,a,t,q,scope,chave] of CASOS){
  const {p,f,erros}=await T.abre(n,a,t,q,{browser:b});
  // Salvar e começar outra — marca o nome do estabelecimento pela própria tela
  const fr=()=>p.frames().find(x=>x!==p.mainFrame());
  const DIRETO=['farmacia-manipulacao','distribuidoras-transportadoras'];
  if(DIRETO.includes(a))await p.evaluate(k=>{const o=JSON.parse(localStorage.getItem(k)||'{}');o.__marcador='REF';localStorage.setItem(k,JSON.stringify(o))},chave);
  else await fr().evaluate(a=>{if(a==='drogaria'){const s=DrogariaAPI.getState();s.meta.fantasia='REF';s.answers.vaccine='sim';DrogariaAPI.setState(s);return}
    if(window.UvisPadrao){const s0=UvisPadrao.lista()[0];UvisPadrao.vai({aba:'roteiro',secao:s0.id,item:s0.itens[0].id})}const i=[...document.querySelectorAll('input[type=text],input:not([type])')].find(x=>x.offsetParent&&!/busca|consult|search|cnpj/i.test((x.placeholder||'')+(x.id||'')));if(i){i.focus();i.value='REF';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));i.blur()}},a);
  await p.waitForTimeout(800);
  if(scope)await put(p,scope);
  await p.evaluate(a=>UvisSalvas.salvarENova(a,''),a);await p.waitForTimeout(5000);
  const sal=await p.evaluate(a=>UvisSalvas.salvas().then(x=>x.filter(s=>s.app===a)),a);
  ok(sal.length===1,a+': inspeção salva');if(!sal.length){await p.close();continue}
  ok(JSON.stringify(sal[0].ls).includes('REF'),a+': salva guarda as respostas');
  if(scope){ok(sal[0].nFotos>=1,a+': salva guarda as fotos');ok(await evid(p,scope.split('-')[0])===0,a+': roteiro fica sem fotos após salvar');}
  // Apagar tudo não mexe nas salvas
  if(DIRETO.includes(a))await p.evaluate(k=>{const o=JSON.parse(localStorage.getItem(k)||'{}');o.__marcador='APAGAR';localStorage.setItem(k,JSON.stringify(o))},chave);else await fr().evaluate(()=>{if(window.UvisPadrao){const s0=UvisPadrao.lista()[0];UvisPadrao.vai({aba:'roteiro',secao:s0.id,item:s0.itens[0].id})}const i=[...document.querySelectorAll('input[type=text],input:not([type])')].find(x=>x.offsetParent&&!/busca|consult|search|cnpj/i.test((x.placeholder||'')+(x.id||'')));if(i){i.value='APAGAR';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}))}});await p.waitForTimeout(800);
  await p.evaluate(a=>UvisSalvas.apagarTudo(a,''),a);await p.waitForTimeout(5000);
  ok(!String(await p.evaluate(k=>localStorage.getItem(k),chave)).includes('APAGAR'),a+': apagar tudo limpa a inspeção');
  ok((await p.evaluate(a=>UvisSalvas.salvas().then(x=>x.filter(s=>s.app===a).length),a))===1,a+': apagar tudo preserva as salvas');
  // retomar
  await p.evaluate(id=>UvisSalvas.retomar(id),sal[0].id);await p.waitForTimeout(5000);
  ok(String(await p.evaluate(k=>localStorage.getItem(k),chave)).includes('REF'),a+': retomar devolve as respostas');
  await p.waitForTimeout(1500);
  // retorno após download
  const f2=p.frames().find(x=>x!==p.mainFrame());
  await f2.evaluate(()=>{const x=document.createElement('a');x.href=URL.createObjectURL(new Blob(['x']));x.download='t.docx';document.body.appendChild(x);x.click()});await p.waitForTimeout(600);
  await p.reload();await p.waitForTimeout(5500);
  ok(await p.evaluate(a=>document.getElementById('tela-app').classList.contains('on')&&document.getElementById('tela-app').dataset.uvisApp===a,a),a+': volta ao roteiro depois de abrir arquivo');
  await p.evaluate(()=>UvisSalvas.salvas().then(x=>Promise.all(x.map(s=>new Promise(r=>{const q=indexedDB.open('uvis-inspecoes-salvas-v1');q.onsuccess=()=>{const t=q.result.transaction('salvas','readwrite');t.objectStore('salvas').delete(s.id);t.oncomplete=()=>{q.result.close();r()}}})))));
  if(erros.length)T.falha(a+': erros de página: '+erros.join(' / '));
  await p.close();
 }
 await b.close()})();
