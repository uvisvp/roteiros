'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {unpack,scripts}=require('./integrated-html.cjs');
const {blocks}=unpack(),fixtures=require('./anvisa-fixtures.json'),requests=[];
const fields=new Map();const $=id=>{if(!fields.has(id))fields.set(id,{value:id==='tipo'?'auto':'',innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},style:{},addEventListener(){}});return fields.get(id);};
async function fetch(url){const key=String(url).split('/dados/')[1]?.replace(/\.json$/,'');requests.push(key);return {ok:Object.hasOwn(fixtures,key),status:Object.hasOwn(fixtures,key)?200:404,json:async()=>structuredClone(fixtures[key])};}
const ctx={console,URL,AbortController,setTimeout,clearTimeout,fetch,localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:$,addEventListener(){},querySelectorAll:()=>[]},addEventListener(){}};ctx.window=ctx;ctx.parent=ctx;vm.createContext(ctx);
vm.runInContext(scripts(blocks.get('app--estoque-produtos'))[0].source.replace(/init\(\);\s*$/,''),ctx);
const toolsCtx={fetch,URL,AbortController,setTimeout,clearTimeout,console};toolsCtx.window=toolsCtx;vm.createContext(toolsCtx);vm.runInContext(blocks.get('rec--drogaria-ocr-tools.js'),toolsCtx);
(async()=>{
 let r=await vm.runInContext("byProcess('250000010199593')",ctx);assert.equal(r.items[0].registro,'10345160176');assert.ok(requests.includes('dispositivos/10345'));
 $('tipo').value='cosmeticos';r=await vm.runInContext("byProcess('250000011320035')",ctx);assert.equal(r.items[0].produto,'OLEO DE BABOSA GRANADO');assert.ok(requests.includes('cosmeticos/001'));assert.equal(r.items[0]._base,'cosmeticos');
 $('tipo').value='dispositivos';r=await vm.runInContext("byProcess('250000011320035')",ctx);assert.equal(r.items.length,0,'Não misturar classes de produtos');
 const equipment=await toolsCtx.DrogariaOcrTools.anvisa.equipamento({processo:'25000.001019/95-93'});assert.equal(equipment.results[0].nome,'CONDICIONADOR');assert.equal(equipment.results[0].numero_anvisa,'10345160176');
 const equipmentReg=await toolsCtx.DrogariaOcrTools.anvisa.equipamento({registro:'10345160176'});assert.equal(equipmentReg.results[0].processo,'250000010199593');
 await assert.rejects(toolsCtx.DrogariaOcrTools.anvisa.equipamento({registro:'10345160176',processo:'250000010199593'}),/exatamente um/);
 for(const [type,spec] of Object.entries(toolsCtx.DrogariaOcrTools.catalog)){const out=toolsCtx.DrogariaOcrTools.extract(type,'');assert.deepEqual(Object.keys(out.fields).sort(),[...spec.fields].sort());assert.ok(Object.values(out.fields).every(v=>v===''),'Documento vazio não pode gerar valores inventados: '+type);}
 $('tipo').value='auto';$('proc').value='250000011320035';$('reg').value='10345160176';await vm.runInContext('lookup()',ctx);assert.ok($('matches').innerHTML.includes('OLEO DE BABOSA'),'Processo explícito tem prioridade sobre registro residual');
 console.log('PASS: processos reais de dispositivo e cosmético; classe selecionada; fragmentos corretos; registro residual; consultor da Drogaria por processo e registro; campos não localizados vazios.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
