'use strict';
/* Central de Consultas: CNES (base-vigilancia/dados/cnes, município de São Paulo) no modo
   próprio, no reconhecimento automático (7 dígitos) e nos resultados por CNPJ, inclusive
   as unidades de uma mantenedora. A base é simulada (rotas interceptadas); nada vai à rede.
   Uso: node scripts/e2e/central-cnes.cjs */
const T=require('./lib.cjs');
const ok=(c,m)=>{if(c)console.log('ok  '+m);else T.falha(m)};
const CNPJ='60840055014868',MANT='46392130000380';
const E=(cnes,extra)=>Object.assign({cnes,razao_social:'CLINICA TESTE LTDA',nome_fantasia:'CLINICA TESTE '+cnes,cnpj:CNPJ,tipo_unidade:'UNIDADE DE APOIO DIAGNOSE E TERAPIA (SADT ISOLADO)',logradouro:'AV ANGELICA',numero:'2318',bairro:'CONSOLACAO',cep:'01228904',situacao:'ativo',data_atualizacao:'2026-05-21',licenca_sanitaria:{numero:'6018.2025/0065941-2'},equipamentos:[{equipamento:'TOMOGRAFO COMPUTADORIZADO',existentes:1,em_uso:1,sus:false}],servicos:['SERVICO DE DIAGNOSTICO POR IMAGEM — TOMOGRAFIA COMPUTADORIZADA']},extra||{});
const EST={'3053830':E('3053830')};const mant=[];for(let i=0;i<45;i++){const c=String(2000000+i);mant.push(c);EST[c]=E(c,{cnpj:'',cnpj_mantenedora:MANT,razao_social:'PREFEITURA'})}
(async()=>{const b=await T.navegador();const ctx=await b.newContext({viewport:{width:1000,height:1400}});
 await ctx.route(/base-vigilancia\/(main\/)?dados\//,r=>{const u=r.request().url();
  if(/cnes\/estabelecimentos\/\d{3}\.json/.test(u)){const s=u.match(/(\d{3})\.json/)[1];const d={};for(const k in EST)if(k.slice(0,3)===s)d[k]=EST[k];return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(d)})}
  if(/cnes\/cnpj\/608\.json/.test(u))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({[CNPJ]:['3053830']})});
  if(/cnes\/mantenedora\/463\.json/.test(u))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({[MANT]:mant})});
  if(/manifest\.json/.test(u))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({gerado_em:'2026-10-20T00:00:00Z',bases:{}})});
  return r.fulfill({status:404,body:''})});
 const p=await ctx.newPage();const erros=[];p.on('pageerror',e=>erros.push(String(e.message).slice(0,200)));p.on('dialog',d=>d.accept());
 await p.goto(T.INDEX);await p.waitForTimeout(900);await p.evaluate(()=>window.__cascaAbrirRoteiro('Central de Consultas','central-consultas','Central de Consultas'));await p.waitForTimeout(4000);
 const f=p.frames().find(x=>x!==p.mainFrame());
 async function busca(modo,v){await f.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  if(modo)await f.evaluate(m=>document.querySelector(`[data-mode="${m}"]`).click(),modo);await p.waitForTimeout(900);
  await f.evaluate(()=>{const r=document.querySelector('#results');if(r)r.innerHTML=''});
  /* Enter na caixa: no modo CNPJ tem de fazer a busca completa, não só a de AFE/AE */
  await f.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  await f.fill('#q',v);await p.waitForTimeout(150);await f.press('#q','Enter');
  for(let i=0;i<40;i++){await p.waitForTimeout(250);const t=await f.evaluate(()=>document.querySelector('#results')?.innerText||'');if(/medidas fiscais relacionadas/.test(t))return t}
  return f.evaluate(()=>document.querySelector('#results')?.innerText||'')}
 ok(await f.evaluate(()=>!!document.querySelector('[data-mode="cnes"]')),'botão do modo CNES');
 let t=await busca('cnes','3053830');
 ok(/CLINICA TESTE 3053830 · CNES 3053830/.test(t)&&/Licença sanitária declarada no CNES/.test(t)&&/TOMOGRAFO COMPUTADORIZADO — 1 existente/.test(t),'modo CNES: cadastro, licença declarada e equipamentos');
 ok(await f.evaluate(()=>{const r=window.CentralAuto&&CentralAuto.reconhece('3053830');return !!r&&r[0]==='afe'&&r[1].includes('cnes')}),'Automático: 7 dígitos oferece AFE/AE e CNES');
 t=await busca('cnpj','60.840.055/0148-68');
 ok(/CNES — estabelecimentos de saúde/.test(t)&&/CNES 3053830/.test(t),'CNPJ (Enter): busca completa, com o cadastro no CNES');
 t=await busca('cnpj','46.392.130/0003-80');
 const n=(t.match(/· CNES \d{7}/g)||[]).length;
 /* a Central pagina (25 por vez, “Mostrar mais”): 40 no total, com aviso */
 ok(/40 resultado/.test(t)&&n>=25&&/São 45 unidades cadastradas no CNES/.test(t),'CNPJ da mantenedora: 40 primeiras unidades e aviso do total');
 if(erros.length)T.falha('erros de página: '+erros.join(' / '));
 await b.close()})();
