'use strict';
/* Varredura genérica: percorre o roteiro pela seta "próximo", responde cada grupo
   de botões e exige que o texto do relatório mude.
   Uso: node scripts/e2e/varredura.cjs <núcleo> <app> <título> [qs] [passos js ;; separados] */
const T=require('./lib.cjs');
const [nucleo,app,titulo,qs,setup]=process.argv.slice(2);
const PERMITIDOS=(process.env.PERMITIDOS||'').split('||').filter(Boolean).map(s=>new RegExp(s));
(async()=>{const {b,p,f,erros}=await T.abre(nucleo,app,titulo,qs||'');
 if(setup)await T.passos(f,p,setup.split(';;'),900);
 const txt=()=>T.texto(f,app);
 const RX='^(Sim|Não|C|NC|Cumpre|Não cumpre|Conforme|Não conforme|Atende|Não atende|Adequado|Inadequado|Encontrado|Não localizado)$';
 const seen=new Set();let total=0,prob=0,telas=0;
 for(let tela=0;tela<120;tela++){
  // grupos de resposta visíveis
  const grupos=await f.evaluate(RX=>{const re=new RegExp(RX);const gs=[];const pais=new Set();document.querySelectorAll('button').forEach(b=>{if(!b.offsetParent||!re.test(b.textContent.trim()))return;const g=b.parentElement;if(pais.has(g))return;pais.add(g);const opts=[...g.querySelectorAll(':scope > button')].filter(x=>re.test(x.textContent.trim()));if(opts.length<2)return;let box=g.parentElement,lab='';for(let i=0;i<4&&box&&!lab;i++){const t=[...box.childNodes].map(n=>n.nodeType===3?n.textContent:(n.contains(g)?'':n.textContent)).join(' ').replace(/\s+/g,' ').trim();if(t.length>8)lab=t.slice(0,90);box=box.parentElement}gs.push({lab,n:opts.length})});return gs},RX);
  telas++;
  for(let gi=0;gi<grupos.length;gi++){const g=grupos[gi];const key=g.lab;if(!key||seen.has(key))continue;seen.add(key);total++;const sem=[];
   for(const alvo of [0,1]){const a=await txt();const ok=await f.evaluate(([RX,gi,alvo])=>{const re=new RegExp(RX);const pais=[];document.querySelectorAll('button').forEach(b=>{if(b.offsetParent&&re.test(b.textContent.trim())&&!pais.includes(b.parentElement)){const o=[...b.parentElement.querySelectorAll(':scope > button')].filter(x=>re.test(x.textContent.trim()));if(o.length>=2)pais.push(b.parentElement)}});const g=pais[gi];if(!g)return false;const o=[...g.querySelectorAll(':scope > button')].filter(x=>re.test(x.textContent.trim()));o[alvo]&&o[alvo].click();return true},[RX,gi,alvo]);
    await p.waitForTimeout(250);if(ok&&await txt()===a)sem.push(alvo?'2ª opção':'1ª opção')}
   // volta para a 1ª opção
   await f.evaluate(([RX,gi])=>{const re=new RegExp(RX);const pais=[];document.querySelectorAll('button').forEach(b=>{if(b.offsetParent&&re.test(b.textContent.trim())&&!pais.includes(b.parentElement)){const o=[...b.parentElement.querySelectorAll(':scope > button')].filter(x=>re.test(x.textContent.trim()));if(o.length>=2)pais.push(b.parentElement)}});const g=pais[gi];const o=g&&[...g.querySelectorAll(':scope > button')].filter(x=>re.test(x.textContent.trim()));o&&o[0].click()},[RX,gi]);await p.waitForTimeout(150);
   if(sem.length&&!PERMITIDOS.some(r=>r.test(key))){prob++;console.log('SEM EFEITO ['+sem.join(',')+'] |',key)}}
  // próxima tela
  const foi=await f.evaluate(()=>{const c=[...document.querySelectorAll('button,a')].filter(b=>b.offsetParent&&!b.disabled&&(/^(→|Próximo|Próxima|Avançar|Seguinte)\b/i.test(b.textContent.trim())||/próxim|avançar|next/i.test(b.getAttribute('aria-label')||'')||b.id==='next'||b.id==='dockNext'));const b=c[c.length-1];if(!b)return false;const antes=document.body.innerText.length+'|'+location.hash+'|'+(document.querySelector('h1,h2,h3')?.textContent||'');b.click();return antes});
  if(!foi)break;await p.waitForTimeout(700);
  const depois=await f.evaluate(()=>document.body.innerText.length+'|'+location.hash+'|'+(document.querySelector('h1,h2,h3')?.textContent||''));if(depois===foi)break;
 }
 console.log(app,'| telas:',telas,'| perguntas:',total,'| sem efeito:',prob);if(!total)T.falha('nenhuma pergunta encontrada');if(prob)T.falha(prob+' pergunta(s) sem efeito');if(erros.length)T.falha('erros de página: '+erros.slice(0,3).join(' / '));
 await b.close()})();
