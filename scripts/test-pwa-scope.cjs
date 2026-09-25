'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const {unpack,unpackText,visaLocal}=require('./integrated-html.cjs');
const {html,blocks}=unpack();
/* Base: a versão publicada (origin/main) ou a indicada em PWA_BASE. Só os
   módulos do núcleo de medicamentos podem mudar em relação a ela. */
const baseRef=process.env.PWA_BASE||'origin/main';
const base=unpackText(execFileSync('git',['show',baseRef+':index.html'],{encoding:'utf8',maxBuffer:40*1024*1024}));
const allowed=new Set(['app--drogaria','app--estoque-produtos','app--distribuidoras-transportadoras','app--farmacia-manipulacao']);
for(const id of base.blocks.keys())if(/^rec--drogaria-/.test(id))allowed.add(id);
for(const[id,source]of base.blocks)if(!allowed.has(id))assert.equal(blocks.get(id),source,'Módulo fora do núcleo de medicamentos alterado em relação a '+baseRef+': '+id);
assert.deepEqual(visaLocal(blocks.get('app--drogaria')),visaLocal(base.blocks.get('app--drogaria')),'Banco normativo/catálogo integrado não devem ser reescritos');
const sw=fs.readFileSync('sw.js','utf8'),version=JSON.parse(fs.readFileSync('versao.json','utf8')).versao;
assert.ok(sw.includes("const VERSAO = '"+version+"'"));assert.ok(html.includes(version));assert.ok(/manifest\.webmanifest/.test(html)&&/serviceWorker\.register/.test(html));
const events={},deleted=[];const self={addEventListener:(k,f)=>events[k]=f,clients:{claim:async()=>{}},location:{origin:'https://example.test'}};
vm.runInNewContext(sw,{self,caches:{keys:async()=>['app-antigo','app-'+version,'dados-v1','outro-cache'],delete:async k=>deleted.push(k)}});
let wait;events.activate({waitUntil:p=>wait=p});wait.then(()=>{assert.deepEqual(deleted,['app-antigo']);console.log('PASS: outros módulos e banco normativo idênticos à main; manifesto e versões PWA; atualização preserva cache de dados e rascunhos.');}).catch(e=>{console.error(e.message);process.exitCode=1;});
