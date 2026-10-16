'use strict';
/* Academias e piscinas (motor roteiro-simples): perfil marca “Não se aplica”
   sozinho; “Não cumpre” sugere a infração; relatório com irregularidade,
   fundamento e enquadramento; Word gerado; foto anexada à pergunta; citação
   abre o texto do dispositivo; orientação técnica (pílulas) presente.
   Uso: node scripts/e2e/academia.cjs */
const T=require('./lib.cjs');
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
(async()=>{const b=await T.navegador();
 const {p,f,erros}=await T.abre('Serviços','academia-piscina','Academias e piscinas','',{browser:b});
 const st=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('uvis-academia-piscina-v1')||'{}'));
 // perfil
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'perfil'}));await p.waitForTimeout(300);
 for(const [c,v] of [['p_piscina','nao'],['p_sauna','nao'],['p_lutas','nao']]){await f.selectOption(`select[data-rs-meta="${c}"]`,v);await p.waitForTimeout(200)}
 let s=await st();
 ok(['ph','crl','guardiao','lp_cloro','operador','reg_medicao'].every(k=>s.r[k]==='na'),'sem piscina: perguntas da piscina viram Não se aplica');
 ok(s.r.reg_acidente==='na'&&s.r.sauna_estr==='na'&&s.r.lutas==='na','sem sauna e sem lutas: Não se aplica');
 ok(!s.r.outros_metodos&&!s.r.tanque_vazio,'perguntas sem naSe ficam em branco');
 // identificação e NC
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'dados'}));await p.waitForTimeout(300);
 await f.fill('input[data-rs-meta="fantasia"]','Academia Teste');await p.waitForTimeout(150);
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'saude',item:'parq'}));await p.waitForTimeout(300);
 await f.click('[data-rs-r="placa|nc"]');await f.click('[data-rs-r="parq_aplic|c"]');await p.waitForTimeout(200);
 ok(await f.evaluate(()=>!!document.querySelector('.rs-orient')),'orientação técnica no item');
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'pratica',item:'dea'}));await p.waitForTimeout(300);
 const pil=await f.evaluate(()=>document.querySelector('.rs-orient')?.textContent||'');ok(/1\.000 sócios/.test(pil),'pílula do DEA (1.000 sócios)');
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'piscina',item:'agua_pisc'}));await p.waitForTimeout(300);
 const pil2=await f.evaluate(()=>document.querySelector('.rs-orient')?.textContent||'');ok(/NBR 10818.*conferir na norma/.test(pil2),'pílula ABNT marcada “conferir na norma”');
 // citação
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'saude',item:'parq'}));await p.waitForTimeout(300);
 await f.evaluate(()=>[...document.querySelectorAll('[data-legal]')].find(b=>/2º-C/.test(b.textContent)).click());await p.waitForTimeout(800);
 const cit=await f.evaluate(()=>document.body.innerText);ok(/verifique se você não tem contraindicação/.test(cit),'citação abre o texto do art. 2º-C');
 await f.evaluate(()=>{document.querySelectorAll('dialog[open]').forEach(d=>d.close());const x=document.querySelector('#rs-modal');if(x)x.hidden=true;document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))});
 // foto
 await f.evaluate(png=>{const o=document.createElement;document.createElement=function(t){const e=o.call(document,t);if(String(t).toLowerCase()==='input'){Object.defineProperty(e,'click',{value:function(){const bin=atob(png.split(',')[1]),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);const dt=new DataTransfer();dt.items.add(new File([u],'f.png',{type:'image/png'}));e.files=dt.files;e.dispatchEvent(new Event('change'))}})}return e}},PNG);
 await f.evaluate(()=>document.querySelector('[data-rs-foto="placa"]').click());await p.waitForTimeout(1500);
 await f.evaluate(()=>{const b=document.querySelector('.mfm-ok');if(b)b.click()});await p.waitForTimeout(1500);
 s=await st();ok(!!(s.fotos&&s.fotos.placa),'foto vinculada à pergunta');
 // infrações
 await f.evaluate(()=>UvisPadrao.vai({aba:'infracoes'}));await p.waitForTimeout(400);
 ok(await f.evaluate(()=>!!document.querySelector('.rs-inf.rs-sug input[data-rs-inf="placa"]')),'infração da placa sugerida');
 await f.click('[data-rs-sugeridas]');await p.waitForTimeout(300);
 const rel=await T.texto(f,'academia-piscina');
 ok(/Academia Teste/.test(rel),'relatório: identificação');
 ok(/Não há placa visível[\s\S]*Fundamento: Lei Municipal nº 11\.383\/1993, art\. 2º-C/.test(rel),'relatório: irregularidade com fundamento');
 ok(/ENQUADRAMENTO[\s\S]*placa de aviso[\s\S]*art\. 2º-B/.test(rel),'relatório: enquadramento (art. 2º-B)');
 ok(!/Não se aplica|não possui piscina|Possui piscina|piscina:/i.test(rel),'relatório: sem “Não se aplica” nem perfil negativo');
 await f.evaluate(()=>UvisPadrao.vai({aba:'roteiro',secao:'ident',item:'perfil'}));await p.waitForTimeout(300);await f.selectOption('select[data-rs-meta="p_avaliacao"]','sim');await p.waitForTimeout(200);
 ok(/Atividades e estrutura: avaliação física/.test(await T.texto(f,'academia-piscina')),'relatório: perfil descreve o que faz');
 // Word
 await f.evaluate(()=>UvisPadrao.vai({aba:'relatorio'}));await p.waitForTimeout(400);
 const dl=p.waitForEvent('download',{timeout:15000}).catch(e=>{console.log(String(e).slice(0,200));return null});await f.click('[data-rs-word]');await p.waitForTimeout(800);await f.evaluate(()=>{const x=[...document.querySelectorAll('button')].find(b=>/Emitir mesmo assim/.test(b.textContent));if(x)x.click()});const d=await dl;if(!d)console.log(await f.evaluate(()=>document.body.innerText.slice(-200)));
 ok(d&&/\.docx$/.test(d.suggestedFilename()),'Word gerado'+(d?' ('+d.suggestedFilename()+')':''));
 if(erros.length)T.falha('erros de página: '+erros.join(' / '));
 await b.close()})();
