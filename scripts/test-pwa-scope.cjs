'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const {unpack,unpackText,visaLocal}=require('./integrated-html.cjs');
const {html,blocks}=unpack();
/* Base: a versão publicada (origin/main) ou a indicada em PWA_BASE. Os módulos
   (app--, rec--) podem mudar; o banco normativo (banco--) e o núcleo de citações
   (nuc--) devem permanecer idênticos. */
const baseRef=process.env.PWA_BASE||'origin/main';
const base=unpackText(execFileSync('git',['show',baseRef+':index.html'],{encoding:'utf8',maxBuffer:40*1024*1024}));
const allowed=new Set(['app--drogaria','app--estoque-produtos','app--distribuidoras-transportadoras','app--farmacia-manipulacao']);
for(const id of base.blocks.keys())if(/^(app|rec)--/.test(id))allowed.add(id);
/* Banco normativo: só se aceitam acréscimos de normas declaradas em scripts/banco/estruturar.py
   (texto oficial em scripts/banco/fontes/). Norma já existente continua intocável. */
const declaradas=new Set([...fs.readFileSync(__dirname+'/banco/estruturar.py','utf8').matchAll(/\{'i': '([a-z0-9-]+)'/g)].map(m=>m[1]));
function semAcrescimos(txt){const B=JSON.parse(txt);for(const g of Object.keys(B.g)){B.g[g]=B.g[g].filter(x=>!declaradas.has(x.i));if(!B.g[g].length)delete B.g[g];}
  if(B.reprocessado&&B.reprocessado.etapas)B.reprocessado.etapas=B.reprocessado.etapas.filter(e=>!/^acréscimos \d{4}-\d{2}-\d{2}:/.test(e));
  return JSON.stringify(B,(k,v)=>k==='g'&&v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(n=>[n,v[n]])):v);}
for(const[id,source]of base.blocks)if(!allowed.has(id)){
  if(id==='banco--v11')assert.equal(semAcrescimos(blocks.get(id)),semAcrescimos(source),'Banco normativo alterado além dos acréscimos declarados em scripts/banco/estruturar.py');
  else assert.equal(blocks.get(id),source,'Bloco protegido (banco normativo / citações) alterado em relação a '+baseRef+': '+id);}
assert.deepEqual(visaLocal(blocks.get('app--drogaria')),visaLocal(base.blocks.get('app--drogaria')),'Banco normativo/catálogo integrado não devem ser reescritos');
const sw=fs.readFileSync('sw.js','utf8'),version=JSON.parse(fs.readFileSync('versao.json','utf8')).versao;
assert.ok(sw.includes("const VERSAO = '"+version+"'"));assert.ok(html.includes(version));assert.ok(/manifest\.webmanifest/.test(html)&&/serviceWorker\.register/.test(html));
const events={},deleted=[];const self={addEventListener:(k,f)=>events[k]=f,clients:{claim:async()=>{}},location:{origin:'https://example.test'}};
vm.runInNewContext(sw,{self,caches:{keys:async()=>['app-antigo','app-'+version,'dados-v1','outro-cache'],delete:async k=>deleted.push(k)}});
let wait;events.activate({waitUntil:p=>wait=p});wait.then(()=>{assert.deepEqual(deleted,['app-antigo']);console.log('PASS: banco normativo e citações idênticos à main; manifesto e versões PWA; atualização preserva cache de dados e rascunhos.');}).catch(e=>{console.error(e.message);process.exitCode=1;});
