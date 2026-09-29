'use strict';
/* Drogaria: cada controle de cada seção (sim/não e caixas) precisa alterar o relatório.
   Uso: node scripts/e2e/drogaria-relatorio.cjs [nº interno da seção]  (1,2,4,5,7,6,8) */
const T=require('./lib.cjs');
const PERMITIDOS=[/\|nc_outro$/];   // precisa de descrição digitada; sem ela sai genérico
(async()=>{const {b,p,f,erros}=await T.abre('Medicamentos','drogaria','Drogaria');
 const rep=()=>f.evaluate(()=>DrogariaAPI.report().blocks.map(b=>(b.x||'')+(b.k||'')+(b.v||'')+(b.rows?JSON.stringify(b.rows):'')).join('\n'));
 const only=process.argv[2]?+process.argv[2]:0;let total=0,prob=0;
 // coleta controles: [{sel,key,vals,lab}]
 const coleta=()=>f.evaluate(()=>{const o=[],s=new Set();const lab=e=>{const box=e.closest('.q,.question,.af-q,.sd-q,.fb-q,.req,li,article,fieldset,label,div');return ((box&&(box.querySelector('b,strong,.q-title,p,span')||box))?.textContent||'').trim().replace(/\s+/g,' ').slice(0,90)};
  document.querySelectorAll('#content [data-answer]').forEach(e=>{if(!e.offsetParent)return;const k='data-answer='+e.dataset.answer;if(s.has(k))return;s.add(k);o.push({t:'a',k:e.dataset.answer,vals:[...document.querySelectorAll('#content [data-answer="'+e.dataset.answer+'"]')].map(x=>x.dataset.value),lab:lab(e)})});
  for(const at of ['data-af-answer','data-sd-answer','data-fb-answer'])document.querySelectorAll('#content ['+at+']').forEach(e=>{if(!e.offsetParent)return;const v=e.getAttribute(at),i=v.lastIndexOf('|'),k=v.slice(0,i);if(s.has(at+k))return;s.add(at+k);o.push({t:'x',at,k,vals:[...document.querySelectorAll('#content ['+at+'^="'+k+'|"]')].map(x=>x.getAttribute(at).slice(i+1)),lab:lab(e)})});
  for(const at of ['data-af-check','data-sd-check','data-s1-product'])document.querySelectorAll('#content ['+at+']').forEach(e=>{if(!e.offsetParent)return;const k=e.getAttribute(at);if(s.has(at+k))return;s.add(at+k);o.push({t:'c',at,k,lab:lab(e)})});
  return o});
 const aplica=(c,v)=>f.evaluate(([c,v])=>{let e;if(c.t==='a')e=[...document.querySelectorAll('#content [data-answer="'+c.k+'"]')].find(x=>x.dataset.value===v);else if(c.t==='x')e=document.querySelector('#content ['+c.at+'="'+c.k+'|'+v+'"]');else e=document.querySelector('#content ['+c.at+'="'+c.k+'"]');if(!e)return false;e.click();return true},[c,v]);
 for(const card of [1,2,4,5,7,6,8]){ if(only&&card!==only)continue;
  await f.evaluate(c=>document.querySelector('button[data-card="'+c+'"]')?.click(),card);await p.waitForTimeout(500);
  const n=await f.evaluate(()=>document.querySelectorAll('#content [data-drg-item]').length);
  for(let it=0;it<Math.max(n,1);it++){
   if(n){await f.evaluate(c=>document.querySelector('button[data-card="'+c+'"]')?.click(),card);await p.waitForTimeout(300);await f.evaluate(i=>document.querySelectorAll('#content [data-drg-item]')[i].click(),it);await p.waitForTimeout(500);}
   const item=n?await f.evaluate(i=>document.querySelector('.drg-item-screen h2, #content h2')?.textContent.trim().slice(0,40)||'item '+i,it):'';
   const feitos=new Set();
   for(let volta=0;volta<6;volta++){
    const novos=(await coleta()).filter(c=>!feitos.has(c.t+c.k));if(!novos.length)break;
    for(const c of novos){feitos.add(c.t+c.k);total++;const sem=[];
     const vals=c.t==='c'?['marcar']:['sim','nao'].filter(v=>c.vals.includes(v)).concat(c.vals.filter(v=>!['sim','nao','nsa'].includes(v)).slice(0,2));
     for(const v of vals){const a=await rep();await aplica(c,v);await p.waitForTimeout(280);if(await rep()===a)sem.push(v)}
     if(c.t!=='c'&&c.vals.includes('sim')){await aplica(c,'sim');await p.waitForTimeout(200)}
     if(sem.length&&!PERMITIDOS.some(r=>r.test(c.k))){prob++;console.log('SEM EFEITO ['+sem.join(',')+'] | seção',card,'|',item,'|',c.k,'|',c.lab)}}
   }
  }
 }
 console.log('drogaria-relatorio: controles',total,'| sem efeito',prob);if(prob)T.falha(prob+' controle(s) sem efeito no relatório');if(erros.length)T.falha('erros de página: '+erros.join(' / '));
 await b.close()})();
