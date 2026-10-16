/* Fotos de evidência: marcação e carimbo (build/montar.cjs coloca no fim de cada
   roteiro, junto com campo.js).
   - Ao escolher ou tirar uma foto de evidência, abre um editor com Seta e Círculo
     para apontar a irregularidade; Concluir grava a imagem marcada.
   - Toda foto recebe, numa faixa no rodapé da imagem, data e hora e, quando
     houver, a localização (latitude, longitude e precisão).
     Data e hora: as da própria foto (EXIF) quando existirem; senão, as do arquivo.
     Local: o GPS gravado na foto; senão, a posição do aparelho, mas só se a foto
     acabou de ser tirada (até 10 min) — foto antiga da galeria não recebe a
     posição de agora.
   - Campos de leitura de documento (OCR: licença, CRT, AVCB, DANFE) ficam de
     fora: a marcação e a faixa atrapalhariam a leitura.
   Funciona interceptando o evento change do campo de arquivo: troca o arquivo
   pelo editado e devolve o evento ao roteiro, que segue como antes. */
(function(){
 'use strict';
 if(window.__medFotoMarca)return;window.__medFotoMarca=true;
 var MAX=2400,COR='#e0162b',ocupado=false;

 function elegivel(inp){
  if(!inp||inp.tagName!=='INPUT'||inp.type!=='file')return false;
  var ac=String(inp.accept||'').toLowerCase();
  if(!/image/.test(ac)||/pdf|doc|json|xml|txt|csv/.test(ac))return false;
  if(inp.matches('[data-cam-in],[data-foto-in],[data-arq-in],#ocrCamera,#ocrGallery,#ocrFile,#readerFile,[data-sem-marca]'))return false;
  var p=inp.parentElement;
  if(p&&p!==document.body&&/documento|\bOCR\b|leitura/i.test(p.textContent||''))return false;
  return true}

 /* ---------- EXIF: data/hora original e GPS (JPEG) ---------- */
 function exif(buf){
  try{var v=new DataView(buf);if(v.getUint16(0)!==0xFFD8)return {};var o=2;
   while(o<v.byteLength-4){var m=v.getUint16(o),len=v.getUint16(o+2);
    if(m===0xFFE1&&v.getUint32(o+4)===0x45786966)return tiff(v,o+10);
    if((m&0xFF00)!==0xFF00)break;o+=2+len}
  }catch(e){}return {}}
 function tiff(v,t){
  var le=v.getUint16(t)===0x4949,u16=function(p){return v.getUint16(p,le)},u32=function(p){return v.getUint32(p,le)};
  function ifd(p){var n=u16(p),r={};for(var i=0;i<n;i++){var e=p+2+i*12;r[u16(e)]={tipo:u16(e+2),n:u32(e+4),val:e+8}}return r}
  function str(x){var p=x.n>4?t+u32(x.val):x.val,s='';for(var i=0;i<x.n-1;i++)s+=String.fromCharCode(v.getUint8(p+i));return s}
  function rac(x){var p=t+u32(x.val),a=[];for(var i=0;i<x.n;i++)a.push(u32(p+i*8)/(u32(p+i*8+4)||1));return a}
  var r={},z=ifd(t+u32(t+4));
  if(z[0x8769]){var ex=ifd(t+u32(z[0x8769].val));var d=ex[0x9003]||ex[0x9004];if(d){var m=/^(\d{4}):(\d\d):(\d\d) (\d\d):(\d\d)/.exec(str(d));if(m)r.data=new Date(+m[1],m[2]-1,+m[3],+m[4],+m[5])}}
  if(z[0x8825]){var g=ifd(t+u32(z[0x8825].val));if(g[2]&&g[4]){var la=rac(g[2]),lo=rac(g[4]),gr=function(a){return a[0]+a[1]/60+a[2]/3600};
   var lat=gr(la),lon=gr(lo);if(g[1]&&str(g[1])==='S')lat=-lat;if(g[3]&&str(g[3])==='W')lon=-lon;if(lat||lon)r.gps={lat:lat,lon:lon}}}
  return r}

 /* ---------- posição do aparelho ---------- */
 function posicao(){return new Promise(function(ok){
  if(!navigator.geolocation)return ok(null);var feito=false,t=setTimeout(function(){if(!feito){feito=true;ok(null)}},8000);
  try{navigator.geolocation.getCurrentPosition(function(p){if(feito)return;feito=true;clearTimeout(t);ok({lat:p.coords.latitude,lon:p.coords.longitude,prec:p.coords.accuracy})},function(){if(!feito){feito=true;clearTimeout(t);ok(null)}},{enableHighAccuracy:true,timeout:7500,maximumAge:60000})}catch(e){feito=true;clearTimeout(t);ok(null)}})}

 var d2=function(n){return (n<10?'0':'')+n};
 function dataTxt(d){return d2(d.getDate())+'/'+d2(d.getMonth()+1)+'/'+d.getFullYear()+' '+d2(d.getHours())+':'+d2(d.getMinutes())}
 function gpsTxt(g){if(!g)return '';var f=function(x){return x.toFixed(5).replace('.',',')};return 'Lat '+f(g.lat)+' · Lon '+f(g.lon)+(g.prec?' (±'+Math.round(g.prec)+' m)':'')}

 /* ---------- editor ---------- */
 var CSS='.mfm,.mfm[open]{position:fixed!important;inset:0!important;z-index:2147483600;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;box-sizing:border-box;background:#111!important;display:flex!important;flex-direction:column;color:#fff;font:15px/1.35 system-ui,sans-serif;overflow:hidden}'
  +'.mfm::backdrop{background:#111}'
  +'.mfm-area{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:8px;overflow:hidden}'
  +'.mfm canvas{max-width:100%;max-height:100%;touch-action:none;background:#222;cursor:crosshair}'
  +'.mfm-info{padding:6px 12px;font-size:13px;color:#ddd;text-align:center}'
  +'.mfm-bar{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:#1c1c1c}'
  +'.mfm-bar button{min-height:44px;min-width:44px;padding:8px 14px;border-radius:10px;border:1px solid #555;background:#2a2a2a;color:#fff;font:inherit;cursor:pointer}'
  +'.mfm-bar button[aria-pressed="true"]{background:#fff;color:#111;border-color:#fff}'
  +'.mfm-bar .mfm-ok{background:#1f7a46;border-color:#1f7a46;font-weight:600}'
  +'.mfm-bar .mfm-sep{flex-basis:100%;height:0}';
 function estilo(){if(document.getElementById('mfm-css'))return;var s=document.createElement('style');s.id='mfm-css';s.textContent=CSS;document.head.appendChild(s)}

 function abreImagem(file){return new Promise(function(ok,no){var u=URL.createObjectURL(file),im=new Image();im.onload=function(){ok({im:im,u:u})};im.onerror=function(){URL.revokeObjectURL(u);no(Error('Não foi possível abrir a imagem.'))};im.src=u})}

 function editor(file,n,total){
  return Promise.all([abreImagem(file),file.arrayBuffer?file.arrayBuffer().catch(function(){return null}):Promise.resolve(null)]).then(function(r){
   var im=r[0].im,meta=r[1]?exif(r[1]):{};
   var quando=meta.data||new Date(file.lastModified||Date.now()),recente=Math.abs(Date.now()-quando.getTime())<10*60*1000;
   var gps=meta.gps||null,gpsP=gps?Promise.resolve(gps):recente?posicao():Promise.resolve(null);
   var k=Math.min(1,MAX/Math.max(im.naturalWidth,im.naturalHeight)),W=Math.max(1,Math.round(im.naturalWidth*k)),H=Math.max(1,Math.round(im.naturalHeight*k));
   var esp=Math.max(4,Math.round(Math.max(W,H)/220));
   estilo();
   var box=document.createElement('dialog');box.className='mfm';box.setAttribute('aria-label','Marcar foto');
   box.innerHTML='<div class="mfm-info" data-i></div><div class="mfm-area"><canvas></canvas></div>'
    +'<div class="mfm-bar"><button type="button" data-f="seta" aria-pressed="true">➚ Seta</button><button type="button" data-f="circulo" aria-pressed="false">◯ Círculo</button><button type="button" data-f="desfaz">↶ Desfazer</button><span class="mfm-sep"></span><button type="button" data-f="cancela">Cancelar</button><button type="button" class="mfm-ok" data-f="ok">Concluir</button></div>';
   document.body.appendChild(box);if(box.showModal){try{box.showModal()}catch(e){}}
   var cv=box.querySelector('canvas'),g=cv.getContext('2d'),info=box.querySelector('[data-i]');cv.width=W;cv.height=H;
   var formas=[],atual=null,ferr='seta',ini=null,local=gps;
   function rotulo(){info.textContent=(total>1?'Foto '+n+' de '+total+' · ':'')+'Arraste sobre a foto para marcar. Será gravado: '+dataTxt(quando)+(local?' · '+gpsTxt(local):recente?' · obtendo localização…':'')}
   rotulo();gpsP.then(function(p){local=p;if(!p&&recente)info.textContent=info.textContent.replace(' · obtendo localização…',' · localização indisponível');else rotulo()});
   function seta(a,b,cor,l,halo){var ang=Math.atan2(b.y-a.y,b.x-a.x),c=esp*5;g.strokeStyle=cor;g.fillStyle=cor;g.lineWidth=l;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x-Math.cos(ang)*c*.6,b.y-Math.sin(ang)*c*.6);g.stroke();
    g.beginPath();g.moveTo(b.x,b.y);g.lineTo(b.x-c*Math.cos(ang-.45),b.y-c*Math.sin(ang-.45));g.lineTo(b.x-c*Math.cos(ang+.45),b.y-c*Math.sin(ang+.45));g.closePath();if(halo){g.lineWidth=l-esp;g.stroke()}g.fill()}
   function circ(a,b,cor,l){g.strokeStyle=cor;g.lineWidth=l;g.beginPath();g.ellipse((a.x+b.x)/2,(a.y+b.y)/2,Math.max(2,Math.abs(b.x-a.x)/2),Math.max(2,Math.abs(b.y-a.y)/2),0,0,Math.PI*2);g.stroke()}
   function forma(f){var fn=f.t==='seta'?seta:circ;fn(f.a,f.b,'rgba(255,255,255,.9)',esp+Math.max(2,esp*.6),true);fn(f.a,f.b,COR,esp,false)}
   function desenha(){g.drawImage(im,0,0,W,H);formas.forEach(forma);if(atual)forma(atual)}
   desenha();
   function pt(e){var r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height}}
   cv.addEventListener('pointerdown',function(e){e.preventDefault();cv.setPointerCapture(e.pointerId);ini=pt(e);atual=null});
   cv.addEventListener('pointermove',function(e){if(!ini)return;atual={t:ferr,a:ini,b:pt(e)};desenha()});
   function solta(){if(atual&&Math.hypot(atual.b.x-atual.a.x,atual.b.y-atual.a.y)>esp*3)formas.push(atual);atual=null;ini=null;desenha()}
   cv.addEventListener('pointerup',solta);cv.addEventListener('pointercancel',solta);
   return new Promise(function(ok){
    box.addEventListener('cancel',function(e){e.preventDefault()});
    function fecha(x){try{box.close()}catch(e){}box.remove();URL.revokeObjectURL(r[0].u);ok(x)}
    box.querySelector('.mfm-bar').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var f=b.dataset.f;
     if(f==='seta'||f==='circulo'){ferr=f;box.querySelectorAll('[data-f="seta"],[data-f="circulo"]').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))})}
     else if(f==='desfaz'){formas.pop();desenha()}
     else if(f==='cancela')fecha(null);
     else if(f==='ok'){b.disabled=true;b.textContent='Gravando…';
      Promise.race([gpsP,new Promise(function(z){setTimeout(z,2500)})]).then(function(){
       desenha();carimbo(g,W,H,dataTxt(quando),local&&gpsTxt(local));
       cv.toBlob(function(bl){if(!bl)return fecha(file);fecha(new File([bl],String(file.name||'foto').replace(/\.[^.]*$/,'')+'.jpg',{type:'image/jpeg',lastModified:quando.getTime()}))},'image/jpeg',.88)})}});
   })})}

 function carimbo(g,W,H,data,gps){
  var txt=data+(gps?'  ·  '+gps:''),fs=Math.max(14,Math.round(Math.min(W,H)/32));
  g.font='600 '+fs+'px system-ui,Arial,sans-serif';
  while(fs>10&&g.measureText(txt).width>W-fs*1.6){fs--;g.font='600 '+fs+'px system-ui,Arial,sans-serif'}
  var h=Math.round(fs*1.9);g.fillStyle='rgba(0,0,0,.62)';g.fillRect(0,H-h,W,h);
  g.fillStyle='#fff';g.textBaseline='middle';g.fillText(txt,Math.round(fs*.8),H-h/2)}

 function processa(inp){
  var fs=[].slice.call(inp.files||[]).filter(function(f){return /^image\//.test(f.type)});
  if(!fs.length||!window.DataTransfer){devolve(inp,null);return}
  ocupado=true;var saida=[],i=0;
  (function prox(){if(i>=fs.length){ocupado=false;devolve(inp,saida);return}
   var f=fs[i++];editor(f,i,fs.length).then(function(x){if(x)saida.push(x);prox()},function(){saida.push(f);prox()})})()}
 function devolve(inp,arqs){
  if(arqs){if(!arqs.length){try{inp.value=''}catch(e){}return}try{var dt=new DataTransfer();arqs.forEach(function(f){dt.items.add(f)});inp.files=dt.files}catch(e){}}
  inp.__medFotoOk=true;try{inp.dispatchEvent(new Event('input',{bubbles:true}));inp.dispatchEvent(new Event('change',{bubbles:true}))}finally{inp.__medFotoOk=false}}

 window.addEventListener('input',function(e){var t=e.target;if(t&&t.type==='file'&&!t.__medFotoOk&&elegivel(t))e.stopImmediatePropagation()},true);
 window.addEventListener('change',function(e){var t=e.target;if(!t||t.type!=='file'||t.__medFotoOk||!elegivel(t))return;
  e.stopImmediatePropagation();if(ocupado)return;processa(t)},true);
 /* campo de foto criado na hora e nunca posto na página (Odontologia, Alimentação,
    Produtos: createElement + click): o change não passaria pelo document. Ao abrir
    a câmera ou a galeria, o campo entra oculto no body e sai depois da escolha. */
 var clique=HTMLInputElement.prototype.click;
 HTMLInputElement.prototype.click=function(){var t=this;
  if(t.type==='file'&&!t.isConnected&&document.body&&elegivel(t)){t.hidden=true;t.setAttribute('data-med-solto','');document.body.appendChild(t);
   t.addEventListener('change',function(){setTimeout(function(){if(!ocupado&&t.isConnected)t.remove()},60000)})}
  return clique.apply(t,arguments)};
 window.MedFotoMarca={elegivel:elegivel,exif:exif};
})();
