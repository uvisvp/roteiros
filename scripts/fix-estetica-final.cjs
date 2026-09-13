'use strict';
/* Ajuste final e isolado do módulo Serviços > Estética.
   Não altera outros núcleos, bases, consultas ou relatórios. */
const fs=require('node:fs');
const path=require('node:path');
const {unpack}=require('./integrated-html.cjs');
const root=path.join(__dirname,'..');
const file=path.join(root,'index.html');
const {html,blocks,lz}=unpack(file);
const id='app--estetica';
let src=blocks.get(id);
if(!src) throw new Error('Bloco app--estetica não localizado');

function replaceRequired(from,to,label){
  if(src.includes(to) && !src.includes(from)) return; // idempotência
  if(!src.includes(from)) throw new Error('Trecho não localizado: '+label);
  src=src.replace(from,to);
}

/* A faixa persistente vinha do próprio app de Estética: o main reservava
   58/56 px para o antigo dock, mesmo depois de ele ter sido ocultado. */
replaceRequired('main{padding-bottom:58px!important}','main{padding-bottom:0!important}','reserva desktop do main');
replaceRequired('main{padding-bottom:56px!important}','main{padding-bottom:0!important}','reserva mobile do main');

/* Ao reexibir "Ver selecionadas", não somar a safe-area do iPhone a essa ação. */
replaceRequired('.acoes{padding-bottom:calc(11px + env(safe-area-inset-bottom,0px))}', '.acoes{padding-bottom:11px}', 'safe-area das ações móveis');

/* No iPhone, trocar de aba I/S abria automaticamente o primeiro grupo
   (Licenciamento e regularidade). Agora a aba entra recolhida; abrir um grupo
   pelo sumário continua funcionando por irGrupo(). */
replaceRequired(
  'if(eMobile()){ir(2,true);if(b==="I"||b==="S"){requestAnimationFrame(()=>{const d=$("lista2").querySelector("details.uvis-inventory");if(d)d.open=true})}}else aplicarLayout()',
  'if(eMobile()){ir(2,true)}else aplicarLayout()',
  'abertura automática do primeiro grupo no mobile'
);

blocks.set(id,src);
const safe=id.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const re=new RegExp('(<script type="text/plain" id="'+safe+'">)[\\s\\S]*?(</script>)');
const m=html.match(re);
if(!m) throw new Error('Container comprimido de Estética não localizado');
const encoded=lz.compressToBase64(src);
if(lz.decompressFromBase64(encoded)!==src) throw new Error('Falha no round-trip de Estética');
const out=html.replace(re,()=>m[1]+encoded+m[2]);
fs.writeFileSync(file,out);

/* Validações específicas do ajuste. */
const check=unpack(file).blocks.get(id);
if(check.includes('main{padding-bottom:58px!important}')||check.includes('main{padding-bottom:56px!important}')) throw new Error('Reserva antiga ainda presente');
if(check.includes('requestAnimationFrame(()=>{const d=$("lista2").querySelector("details.uvis-inventory");if(d)d.open=true})')) throw new Error('Autoabertura do primeiro grupo ainda presente');
if(!check.includes('<button class="principal" data-ir="3">Ver selecionadas</button>')) throw new Error('Botão nativo Ver selecionadas ausente');
console.log('Estética ajustada: sem reserva inferior e sem autoabertura do primeiro grupo.');
