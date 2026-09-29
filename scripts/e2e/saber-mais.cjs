'use strict';
/* Abre e fecha cada “Para saber mais”, orientação e botão “i” de cada tela e exige que
   nenhuma pergunta suma. Uso: node scripts/e2e/saber-mais.cjs <núcleo> <app> <título> [qs] [passos] */
const T=require('./lib.cjs');
const [nucleo,app,titulo,qs,setup]=process.argv.slice(2);
(async()=>{const {b,p,f,erros}=await T.abre(nucleo,app,titulo,qs||'',{viewport:{width:390,height:844}});
 if(setup)await T.passos(f,p,setup.split(';;'),900);
 const RX='^(Sim|Não|C|NC|NA|Cumpre|Não cumpre|Não se aplica|N/A|Conforme|Não conforme|Atende|Não atende|Adequado|Inadequado)$';
 const conta=()=>f.evaluate(RX=>{const re=new RegExp(RX);const s=new Set();document.querySelectorAll('button').forEach(b=>{if(b.offsetParent&&re.test(b.textContent.trim()))s.add(b.parentElement)});return s.size},RX);
 let telas=0,abertos=0,prob=0;const vistos=new Set();
 for(let tela=0;tela<140;tela++){telas++;
  const alvos=await f.evaluate(()=>{const l=[...document.querySelectorAll('summary,[data-pop-orient],button.pop-o-btn')].filter(s=>s.offsetParent&&!s.closest('.uvs-previa')&&/saber mais|orienta|o que (é|verificar)|conceitos|classe de risco|categorizadas|^i$/i.test((s.textContent||'').trim()+' '+(s.getAttribute('title')||'')));l.forEach((s,i)=>s.dataset.smT=i);return l.map(s=>(s.textContent||'').trim().slice(0,50))});
  const titulo=await f.evaluate(()=>(document.querySelector('[aria-current=step],[aria-current=page].lvl-chip,.dist-section-title strong,h2,h3')||{}).textContent||'').catch(()=>'');
  for(let i=0;i<alvos.length;i++){const antes=await conta();
   for(const vez of [1,2]){await f.evaluate(i=>{const s=document.querySelector('[data-sm-t="'+i+'"]');if(s){s.scrollIntoView({block:'center'});s.click()}},i);await p.waitForTimeout(300);
    const dep=await conta();abertos++;if(dep<antes){prob++;console.log('SOME ['+(vez===1?'abrir':'fechar')+'] '+String(titulo).trim().slice(0,50)+' | '+alvos[i]+' | perguntas '+antes+'→'+dep);break}}}
  const foi=await f.evaluate(()=>{const c=[...document.querySelectorAll('button,a')].filter(b=>b.offsetParent&&!b.disabled&&(/^(→|Próximo|Próxima|Avançar|Seguinte)\b/i.test(b.textContent.trim())||/próxim|avançar|next/i.test(b.getAttribute('aria-label')||'')||b.id==='next'||b.id==='dockNext'||b.dataset.puNav==='prox'));const b=c[c.length-1];if(!b)return false;const antes=document.body.innerText.length+'|'+(document.querySelector('h1,h2,h3')?.textContent||'');b.click();return antes});
  if(!foi)break;await p.waitForTimeout(600);
  const depois=await f.evaluate(()=>document.body.innerText.length+'|'+(document.querySelector('h1,h2,h3')?.textContent||''));if(depois===foi)break;}
 console.log(app,'| telas:',telas,'| caixas abertas/fechadas:',abertos,'| perguntas sumiram:',prob);if(prob)T.falha(prob+' caso(s)');if(erros.length)T.falha('erros: '+erros.slice(0,3).join(' / '));
 await b.close()})();
