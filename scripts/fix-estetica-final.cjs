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

/* O botão nativo "Ver selecionadas" volta a ocupar a faixa de ações no mobile.
   Evita-se apenas somar a safe-area do iPhone à altura dessa faixa. */
replaceRequired(
  '.acoes{padding-bottom:calc(11px + env(safe-area-inset-bottom,0px))}',
  '.acoes{padding-bottom:11px}',
  'safe-area das ações móveis'
);

/* No iPhone, trocar para Interesse à saúde ou Serviços de saúde abria sozinho
   o primeiro grupo (Licenciamento e regularidade). Agora ambos entram recolhidos.
   A abertura deliberada pelo usuário, via sumário/irGrupo(), continua intacta. */
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

const check=unpack(file).blocks.get(id);
if(check.includes('requestAnimationFrame(()=>{const d=$("lista2").querySelector("details.uvis-inventory");if(d)d.open=true})')) throw new Error('Autoabertura do primeiro grupo ainda presente');
if(!check.includes('<button class="principal" data-ir="3">Ver selecionadas</button>')) throw new Error('Botão nativo Ver selecionadas ausente');
if(!check.includes('.acoes{padding-bottom:11px}')) throw new Error('Faixa móvel compacta não aplicada');
console.log('Estética ajustada: Ver selecionadas restaurável e primeiro grupo recolhido no mobile.');
