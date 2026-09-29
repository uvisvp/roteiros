'use strict';
/* Telas de referência de cada núcleo em 5 larguras. Uso: node scripts/e2e/telas.cjs <pasta-saída> [app] */
const T=require('./lib.cjs'),fs=require('node:fs'),path=require('node:path');
const saida=process.argv[2]||'telas';const so=process.argv[3]||'';fs.mkdirSync(saida,{recursive:true});
const LARG=[[375,812],[390,844],[430,932],[800,1280],[1280,900]];
const CASOS=[
 ['drogaria','Medicamentos','drogaria','Drogaria','',["document.querySelector('button[data-card=\"2\"]')?.click()","document.querySelectorAll('#content [data-drg-item]')[1]?.click()"]],
 ['manipulacao','Medicamentos','farmacia-manipulacao','Farmácia com Manipulação','',["document.querySelector('#cardGrid button, .ui-card-grid button')?.click()"]],
 ['distribuidora','Medicamentos','distribuidoras-transportadoras','Distribuidora / transportadora','',[]],
 ['produtos','Produtos','produtos-correlatos','Atacadista / distribuidor','atividade=atacadista',[]],
 ['alimentos','Alimentos','servicos-alimentacao-roteiro','Inspeção do estabelecimento','',[]],
 ['odontologia','Odontologia','odontologia','Odontologia','',[]],
 ['assistenciais','Serviços assistenciais','servicos-assistenciais','Serviços assistenciais','',["document.querySelector('[data-service=ilpi]')?.click()"]]];
(async()=>{const b=await T.navegador();
 for(const [id,n,a,t,q,ps] of CASOS){if(so&&so!==id)continue;
  for(const [w,h] of LARG){const {p,f,erros}=await T.abre(n,a,t,q,{browser:b,viewport:{width:w,height:h}});
   await p.screenshot({path:path.join(saida,`${id}-${w}-0.png`)});
   let k=1;for(const s of ps){await f.evaluate(s).catch(()=>{});await p.waitForTimeout(900);await p.screenshot({path:path.join(saida,`${id}-${w}-${k++}.png`)})}
   const m=await f.evaluate(()=>({rolagemHorizontal:document.documentElement.scrollWidth>innerWidth+1,botoesPequenos:[...document.querySelectorAll('button,a,[role=button]')].filter(x=>{const r=x.getBoundingClientRect();return x.offsetParent&&r.height>0&&r.height<32}).length}));
   console.log(id,w,JSON.stringify(m),erros.length?'ERROS '+erros.join(' / '):'');await p.close()}}
 await b.close()})();
