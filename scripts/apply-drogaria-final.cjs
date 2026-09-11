'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),zlib=require('node:zlib');
const root=path.join(__dirname,'..');
const {unpack}=require('./integrated-html.cjs');
const {lz}=unpack();
const parts=[1,2,3,4,5].map(i=>path.join(__dirname,`.drogaria-review.part${i}`));
for(const p of parts)if(!fs.existsSync(p))throw Error('Parte temporária ausente: '+path.basename(p));
const encoded=parts.map(p=>fs.readFileSync(p,'utf8').replace(/\s+/g,'')).join('');
const raw=Buffer.from(encoded,'base64');
const candidates=[];
try{candidates.push(['lz-string',lz.decompressFromBase64(encoded)]);}catch(e){}
try{candidates.push(['brotli',zlib.brotliDecompressSync(raw).toString('utf8')]);}catch(e){}
try{candidates.push(['inflate',zlib.inflateSync(raw).toString('utf8')]);}catch(e){}
try{candidates.push(['inflateRaw',zlib.inflateRawSync(raw).toString('utf8')]);}catch(e){}
try{candidates.push(['gunzip',zlib.gunzipSync(raw).toString('utf8')]);}catch(e){}
try{candidates.push(['unzip',zlib.unzipSync(raw).toString('utf8')]);}catch(e){}
if(typeof zlib.zstdDecompressSync==='function'){try{candidates.push(['zstd',zlib.zstdDecompressSync(raw).toString('utf8')]);}catch(e){}}
candidates.push(['base64',raw.toString('utf8')]);
const found=candidates.find(([,text])=>text&&text.includes('window.DrogariaReview'));
if(!found)throw Error('Falha ao reconstruir o gerador final da Drogaria. Métodos testados: '+candidates.map(([n,t])=>n+':'+String(t||'').length).join(', ')+'; bytes iniciais='+raw.subarray(0,12).toString('hex'));
const [method,review]=found;
console.log('Gerador reconstruído por '+method+'; '+review.length+' caracteres.');
if(!review.includes('IRREGULARIDADES OBSERVADAS'))throw Error('Gerador reconstruído sem a seção final de irregularidades.');
fs.writeFileSync(path.join(root,'drogaria-review.js'),review,'utf8');
let test=fs.readFileSync(path.join(__dirname,'test-drogaria.cjs'),'utf8');
test=test.replace("assert.ok(text.includes('AFE-TESTE')&&text.includes('AE-TESTE'));","assert.ok(text.includes('AFE-TESTE')&&!text.includes('AE-TESTE'),'Drogaria não deve emitir AE no relatório');");
test=test.replace("assert.ok(coldNo.includes('não realiza venda de medicamentos termolábeis'));","assert.ok(coldNo.includes('não comercializa medicamentos termolábeis')); ");
fs.writeFileSync(path.join(__dirname,'test-drogaria.cjs'),test,'utf8');
cp.execFileSync(process.execPath,[path.join(__dirname,'repack-drogaria.cjs')],{cwd:root,stdio:'inherit'});
cp.execFileSync(process.execPath,[path.join(__dirname,'test-drogaria.cjs')],{cwd:root,stdio:'inherit'});
for(const p of parts)fs.unlinkSync(p);
console.log('Drogaria integrada, reempacotada e validada no index.html minúsculo.');
