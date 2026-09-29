'use strict';
/* Biblioteca dos testes de ponta a ponta (navegador real, Playwright global).
   Uso: const T=require('./lib.cjs'); const {b,p,f}=await T.abre('Medicamentos','drogaria','Drogaria');
   Os testes não publicam nada; abrem o index.html local. */
const path=require('node:path'),{execSync}=require('node:child_process');
const pw=require(execSync('npm root -g').toString().trim()+'/playwright');
const INDEX='file://'+path.join(__dirname,'..','..','index.html');
const espera=ms=>new Promise(r=>setTimeout(r,ms));
async function navegador(){return pw.chromium.launch()}
async function abre(nucleo,app,titulo,qs='',opts={}){
  const b=opts.browser||await navegador();
  const p=await b.newPage({viewport:opts.viewport||{width:1000,height:1400},deviceScaleFactor:opts.dpr||1});
  const erros=[];p.on('pageerror',e=>erros.push(String(e.message).slice(0,200)));p.on('dialog',d=>d.type()==='prompt'?d.accept(opts.prompt||'Teste'):d.accept());
  await p.goto(INDEX);await p.waitForTimeout(900);
  await p.evaluate(([n,a,t,q])=>window.__cascaAbrirRoteiro(n,a,t,q),[nucleo,app,titulo,qs]);await p.waitForTimeout(opts.carga||4500);
  const f=p.frames().find(x=>x!==p.mainFrame());
  return {b,p,f,erros};
}
async function passos(f,p,lista,ms=800){for(const s of lista){await f.evaluate(s);await p.waitForTimeout(ms)}}
/* texto do relatório de cada roteiro */
const TEXTO={
  drogaria:()=>DrogariaAPI.report().blocks.map(b=>(b.x||'')+(b.k||'')+(b.v||'')+(b.rows?JSON.stringify(b.rows):'')).join('\n'),
  'farmacia-manipulacao':()=>{try{renderPreview()}catch(e){}const r=document.querySelector('#reportPreview');return r?r.innerText:''},
  padrao:()=>JSON.stringify(window.UvsPrevia?UvsPrevia.linhas():[])
};
function texto(f,app){return f.evaluate(TEXTO[app]||TEXTO.padrao)}
function falha(msg){console.error('FALHA: '+msg);process.exitCode=1}
module.exports={pw,INDEX,espera,navegador,abre,passos,texto,falha};
