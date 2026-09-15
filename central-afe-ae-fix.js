/* Central AFE/AE — apresentação esquema 3 */
(() => {
  'use strict';
  const BASE='https://uvisvp.github.io/base-vigilancia/dados';
  const cache=new Map();
  const dig=v=>String(v||'').replace(/\D/g,'');
  async function registros(cnpj){
    const n=dig(cnpj); if(n.length!==14)return [];
    if(cache.has(n))return cache.get(n);
    const p=(async()=>{try{
      const r=await fetch(BASE+'/afe_ae/'+n.slice(0,3)+'.json',{cache:'no-store'});
      if(!r.ok)return [];
      const j=await r.json();
      const a=Array.isArray(j)?j:(j.registros||j.dados||[]);
      return a.filter(x=>dig(x.cnpj)===n);
    }catch(_){return []}})();
    cache.set(n,p); return p;
  }
  function campo(txt,nome){
    const re=new RegExp(nome+'\\s*\\n?\\s*([^\\n]+)','i');
    return (txt.match(re)||[])[1]?.trim()||'';
  }
  function acharCard(el){
    let p=el;
    for(let i=0;i<6&&p;i++,p=p.parentElement){
      const t=p.innerText||'';
      if(/Autoriza[cç][aã]o/i.test(t)&&/CNPJ/i.test(t)&&t.length<12000)return p;
    }
    return el.parentElement;
  }
  async function corrigir(el){
    if(el.dataset.afe3==='1')return;
    const card=acharCard(el), txt=card?.innerText||'';
    const aut=dig(campo(txt,'Autoriza[cç][aã]o'));
    const cnpj=dig(campo(txt,'CNPJ'));
    if(!aut||cnpj.length!==14)return;
    el.dataset.afe3='1';
    const rs=await registros(cnpj);
    const x=rs.find(r=>dig(r.autorizacao)===aut||dig(r.autorizacao_nova)===aut);
    if(!x){el.dataset.afe3='0';return}
    const tipo=x.tipo||'AFE / AE', sit=x.situacao||'Situação não informada';
    el.textContent=tipo+' · '+sit.toUpperCase();
  }
  function varrer(){
    document.querySelectorAll('body *').forEach(el=>{
      if(el.children.length===0 && /AFE\s*\/\s*AE\s*[·-]/i.test(el.textContent||'')) corrigir(el);
    });
  }
  let t; new MutationObserver(()=>{clearTimeout(t);t=setTimeout(varrer,120)}).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',varrer); else varrer();
})();