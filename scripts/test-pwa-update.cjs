'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const {unpack}=require('./integrated-html.cjs');
const {html}=unpack(),source=fs.readFileSync('sw.js','utf8');
const version=JSON.parse(fs.readFileSync('versao.json','utf8')).versao;
const origin='https://app.test/roteiros/',tick=()=>new Promise(resolve=>setImmediate(resolve));
const htmlAt=v=>'<html><script>const APP_VERSAO = \''+v+'\';</script></html>';

function workerHarness(code,{stale=false,missing=false}={}){
  const build=/const VERSAO = '([^']+)'/.exec(code)[1],events={},stores=new Map(),requests=[];
  let skips=0,offline=false;
  const key=r=>new URL(typeof r==='string'?r:r.url,origin).href;
  const fetch=async(r,options={})=>{
    const url=new URL(key(r));requests.push({url:url.href,cache:options.cache});
    if(offline)throw Error('offline');
    if(missing&&url.pathname.endsWith('icon-512.png'))return new Response('',{status:503});
    const fresh=!stale&&url.searchParams.get('__uvis_build')===build&&options.cache==='no-store';
    if(url.pathname.endsWith('/')||url.pathname.endsWith('index.html'))return new Response(htmlAt(fresh?build:'20260910-25'));
    if(url.pathname.endsWith('versao.json'))return new Response(JSON.stringify({versao:build}));
    return new Response('asset');
  };
  const open=async name=>{
    if(!stores.has(name))stores.set(name,new Map());const store=stores.get(name);
    return {put:async(r,response)=>store.set(key(r),response.clone()),match:async r=>store.get(key(r))?.clone(),addAll:async list=>{for(const r of list)store.set(key(r),(await fetch(r)).clone());}};
  };
  const caches={open,keys:async()=>[...stores.keys()],delete:async k=>stores.delete(k),match:async r=>{for(const store of stores.values())if(store.has(key(r)))return store.get(key(r)).clone();}};
  stores.set('app-20260910-25',new Map([[origin+'index.html',new Response(htmlAt('20260910-25'))]]));
  stores.set('dados-v1',new Map([[origin+'dados/teste.json',new Response('{"preservado":true}')]]));
  const self={location:{href:origin+'sw.js',origin:new URL(origin).origin},clients:{claim:async()=>{}},skipWaiting:()=>skips++,addEventListener:(name,fn)=>events[name]=fn};
  vm.runInNewContext(code,{self,caches,fetch,URL,Response});
  return {build,stores,requests,skips:()=>skips,offline:()=>offline=true,install:()=>{let p;events.install({waitUntil:value=>p=value});return p;},read:async(path)=>{let p;events.fetch({request:{url:origin+path,method:'GET',mode:'navigate'},respondWith:value=>p=value});return (await p).text();}};
}

function updaterHarness({open=false}={}){
  class Worker extends EventTarget{constructor(){super();this.state='installing';this.messages=[];}postMessage(message){this.messages.push(message);}}
  const worker=new Worker(),reg={installing:worker,waiting:null,updates:0,update:async()=>{reg.updates++;return reg;}};
  const serviceWorker=new EventTarget();serviceWorker.controller={state:'activated'};
  const registrations=[];serviceWorker.register=async(...args)=>{registrations.push(args);return reg;};
  const nodes=new Map();const element=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',hidden:true,dataset:{},setAttribute(){},classList:{contains:()=>id==='tela-app'&&open}});return nodes.get(id);};
  const reloads=[],notices=[],timers=new Set(),draft={meta:{razao:'Drogaria de teste'},answers:{recebimento:'sim'}};
  const ctx={navigator:{serviceWorker},document:{getElementById:element},location:{protocol:'https:',href:origin+'index.html',replace:url=>reloads.push(url),reload:()=>reloads.push('reload-antigo')},fetch:async()=>new Response(JSON.stringify({versao:version,banco:'11.2'})),URL,Promise,console,mostrarAviso:message=>notices.push(message),setTimeout:fn=>{timers.add(fn);return fn;},clearTimeout:fn=>timers.delete(fn),localStorage:{getItem:()=>JSON.stringify(draft),setItem:()=>{throw Error('O atualizador não pode alterar o rascunho');},removeItem:()=>{throw Error('O atualizador não pode apagar o rascunho');}}};
  const start=html.indexOf('const APP_VERSAO ='),end=html.indexOf('    if (juntar)',start);
  assert.ok(start>0&&end>start);vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx);
  return {ctx,worker,reg,serviceWorker,reloads,notices,nodes,timers,registrations,draft,installed:()=>{reg.installing=null;reg.waiting=worker;worker.state='installed';worker.dispatchEvent(new Event('statechange'));},activate:()=>{worker.state='activated';serviceWorker.controller=worker;serviceWorker.dispatchEvent(new Event('controllerchange'));}};
}

(async()=>{
  // Reproduz a cópia antiga entrando no cache de uma versão nova.
  // Entre essa base pública e a v26, sw.js mudou apenas o número da versão.
  const oldSource=execFileSync('git',['show','c2d378f24586786bbc1564c9d19e96a0d734b625:sw.js'],{encoding:'utf8'}).replace("const VERSAO = '20260908-24'","const VERSAO = '20260910-26'");
  const old=workerHarness(oldSource);
  await old.install();assert.match(await old.stores.get('app-20260910-26').get(origin+'index.html').text(),/20260910-25/);
  console.log('REPRODUZIDO: o worker v26 aceita HTML v25 do cache HTTP.');

  const current=workerHarness(source);await current.install();
  const cache=current.stores.get('app-'+version);
  assert.match(await cache.get(origin+'index.html').clone().text(),new RegExp(version));
  assert.ok([...cache.keys()].every(k=>!k.includes('?')),'O aplicativo instalado usa endereços canônicos');
  assert.equal(current.skips(),0,'Baixar não deve ativar sem decisão do usuário');
  assert.ok(current.stores.has('app-20260910-25')&&current.stores.has('dados-v1'));
  current.offline();assert.match(await current.read('index.html'),new RegExp(version),'A leitura offline deve usar apenas o cache da versão ativa');
  assert.match(await current.read('pagina-indisponivel'),new RegExp(version),'Fallback offline também deve usar a versão ativa');
  for(const options of [{stale:true},{missing:true}]){
    const failed=workerHarness(source,options);await assert.rejects(failed.install());
    assert.ok(!failed.stores.has('app-'+version),'Não publicar cache incompleto ou com HTML de outra versão');
    assert.ok(failed.stores.has('app-20260910-25')&&failed.stores.has('dados-v1'));
  }

  const ui=updaterHarness();const applying=ui.ctx.aplicaAtualizacao();await tick();
  assert.equal(ui.reg.updates,1);assert.equal(ui.reloads.length,0,'Não recarregar enquanto o worker instala');
  ui.installed();await tick();assert.equal(ui.worker.messages.length,1);assert.equal(ui.reloads.length,0,'Não recarregar antes de assumir o controle');
  ui.activate();await applying;
  assert.deepEqual(ui.reloads,[origin+'index.html?v='+version]);assert.equal(ui.registrations[0][1].updateViaCache,'none');
  assert.equal(ui.draft.meta.razao,'Drogaria de teste');assert.equal(ui.draft.answers.recebimento,'sim');

  const rejected=updaterHarness();const attempt=rejected.ctx.aplicaAtualizacao();await tick();rejected.worker.state='redundant';rejected.worker.dispatchEvent(new Event('statechange'));await attempt;
  assert.equal(rejected.reloads.length,0);assert.match(rejected.nodes.get('faixa-versao').innerHTML,/não foi concluída/);
  const pending=updaterHarness();await pending.ctx.checaVersao(true);
  assert.match(pending.nodes.get('faixa-versao').innerHTML,/Atualizar agora/,'A cópia HTML nova ainda pode precisar ativar a atualização do PWA');
  const busy=updaterHarness({open:true});await busy.ctx.aplicaAtualizacao();assert.equal(busy.reloads.length,0);assert.equal(busy.reg.updates,0);assert.equal(busy.notices.length,1);
  assert.ok(html.includes("v.textContent = 'Versão ' + APP_VERSAO"),'A tela deve mostrar a versão carregada, sem data fixa');
  console.log('PASS: cache HTTP antigo, offline, publicação incompleta, espera da instalação/ativação, falha sem reload, ativação pendente, rascunho preservado e versão visível.');
})().catch(e=>{console.error(e);process.exitCode=1;});
