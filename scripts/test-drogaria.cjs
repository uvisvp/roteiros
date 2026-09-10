'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {unpack,scripts,visaLocal}=require('./integrated-html.cjs');
const root=path.join(__dirname,'..'),{html,blocks}=unpack();
const app=blocks.get('app--drogaria'),data=visaLocal(app),catalog=structuredClone(data['roteiros/drogaria.json']);
const events=new Map(),elements=new Map(),persisted=new Map();let renders=0,state;
function element(id='') {if(elements.has(id))return elements.get(id);const e={id,innerHTML:'',textContent:'',className:'',dataset:{},attributes:[],open:false,value:'',classList:{add(){},remove(){},contains(){return false},toggle(){}},querySelector(){return element('child')},querySelectorAll(){return []},append(){},prepend(){},appendChild(){},remove(){},addEventListener(){},setAttribute(){},showModal(){this.open=true},close(){this.open=false},click(){},matches(){return false},closest(){return null}};elements.set(id,e);return e;}
const doc={body:element('body'),documentElement:element('html'),addEventListener:(name,fn)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(fn)},querySelectorAll:()=>[],querySelector:()=>null,getElementById:id=>elements.get(id)||null,createElement:tag=>element('created-'+tag),};
element('content');
const ctx={document:doc,console,structuredClone,URL,Blob,File,TextEncoder,TextDecoder,AbortController,Date,queueMicrotask,setTimeout:()=>0,clearTimeout(){},scrollTo(){},alert:()=>{},MutationObserver:class{observe(){}disconnect(){}},localStorage:{getItem:k=>persisted.get(k)||null,setItem:(k,v)=>persisted.set(k,v)}};
ctx.window=ctx;vm.createContext(ctx);vm.runInContext(scripts(app)[2].source,ctx);state=ctx.DrogariaEngine.fresh();
ctx.DrogariaAPI={getState:()=>state,getCatalog:()=>catalog,getBank:()=>data,engine:ctx.DrogariaEngine,setState:(s,opts={})=>{state=s;ctx.DrogariaReview?.sync(state);persisted.set('draft',JSON.stringify(state));if(opts.render!==false)renders++},rooms:()=>'',physicalChecklist:()=>'',areaCard:()=>'',coldCard:()=>'',questions:()=>''};
for(const name of ['drogaria-ocr-tools','drogaria-review','drogaria-section1','drogaria-area-fisica','drogaria-servicos-documentos','drogaria-final-bridge'])vm.runInContext(blocks.get('rec--'+name+'.js'),ctx,{filename:name+'.js'});
for(const fn of events.get('DOMContentLoaded')||[])fn();
assert.ok((events.get('click')||[]).length>=5,'Cada ponte precisa instalar seus eventos');
function eventTarget(selector,dataset={},value=''){return {dataset,value,checked:true,attributes:[],matches:s=>s===selector,closest:s=>s.split(',').includes(selector)?eventTarget(selector,dataset,value):null};}
function fire(name,target){for(const fn of events.get(name)||[])fn({target,preventDefault(){},stopImmediatePropagation(){}});}
let before=renders;fire('input',eventTarget('input[data-s1-path]',{s1Path:'meta.endereco'},'Rua de Teste'));assert.equal(state.meta.endereco,'Rua de Teste');assert.equal(renders,before,'Digitar não deve remontar a tela e perder o foco');
fire('change',eventTarget('select[data-s1-path]',{s1Path:'answers.vaccine'},'sim'));assert.equal(state.answers.vaccine,'sim');
fire('click',eventTarget('[data-af-answer]',{afAnswer:'area_recebimento|conferencia|nao'}));assert.equal(state.meta.drogaria_secoes.area_recebimento.answers.conferencia,'nao');
fire('input',eventTarget('[data-sd-field]',{sdField:'servicos_farmaceuticos|equipamento_busca'},'250000010199593'));assert.equal(state.meta.drogaria_secoes.servicos_farmaceuticos.fields.equipamento_busca,'250000010199593');
fire('click',eventTarget('[data-sd-answer]',{sdAnswer:'servicos_farmaceuticos|realiza|sim'}));fire('click',eventTarget('[data-sd-check]',{sdCheck:'servicos_farmaceuticos|pressao'}));assert.equal(state.fields.services_defined,'sim');assert.ok(state.fields.services.includes('pa'));
fire('click',eventTarget('[data-fb-check]',{fbCheck:'controlados_complementos|antimicrobianos'}));assert.ok(state.fields.products.includes('antibiotico'));
fire('input',eventTarget('[data-fb-text]',{fbText:'transporte|objeto'},'Entrega em domicílio'));assert.equal(state.meta.drogaria_secoes.transporte.fields.objeto,'Entrega em domicílio');assert.equal(JSON.parse(persisted.get('draft')).meta.drogaria_secoes.transporte.fields.objeto,'Entrega em domicílio');
assert.ok([1,2,3,4,5,6,7,8].every(id=>ctx.DrogariaEngine.cardVisible(id,ctx.DrogariaEngine.fresh())),'Todas as seções devem ser acessíveis antes das respostas');
// Executa os handlers reais do rodapé com as pontes carregadas do HTML integrado.
// Regressão: antes, Próximo em 4.2 pulava diretamente para a seção 3.
ctx.byId=element;ctx.catalog=catalog;ctx.E=ctx.DrogariaEngine;ctx.tab='roteiro';ctx.active=2;ctx.save=()=>{};
ctx.changeView=(tab,section=0)=>{ctx.tab=tab;ctx.active=section;};
Object.defineProperty(ctx,'state',{get:()=>state});
for(const id of ['back','next']){
  const handler=app.match(new RegExp("byId\\('"+id+"'\\)\\.onclick=\\(\\)=>\\{[^\\n]+"));
  assert.ok(handler,'Handler do rodapé precisa existir');vm.runInContext(handler[0],ctx);
}
fire('click',eventTarget('[data-af-open]',{afOpen:'dispensacao'}));
element('next').onclick();assert.equal(ctx.active,2);assert.equal(state.meta.drogaria_secoes.area_fisica.fields.active_card,'armazenamento');
element('back').onclick();assert.equal(ctx.active,2);assert.equal(state.meta.drogaria_secoes.area_fisica.fields.active_card,'dispensacao');
fire('click',eventTarget('[data-af-back]'));
for(const id of ['recebimento','dispensacao','armazenamento','residuos','vencidos','dml','refeitorio','sanitarios']){
  element('next').onclick();assert.equal(ctx.active,2);assert.equal(state.meta.drogaria_secoes.area_fisica.fields.active_card,id);
}
element('next').onclick();assert.equal(ctx.active,3,'Somente o último subitem libera a seção seguinte');
assert.equal(state.meta.endereco,'Rua de Teste');assert.equal(state.meta.drogaria_secoes.area_recebimento.answers.conferencia,'nao');
ctx.active=6;fire('click',eventTarget('[data-sd-back]'));
element('next').onclick();assert.equal(state.meta.drogaria_secoes.documentos_hub.fields.active,'qualidade');
element('next').onclick();assert.equal(state.meta.drogaria_secoes.documentos_hub.fields.active,'rastreabilidade');
element('back').onclick();assert.equal(state.meta.drogaria_secoes.documentos_hub.fields.active,'qualidade');
element('back').onclick();assert.equal(ctx.active,6);assert.equal(state.meta.drogaria_secoes.documentos_hub.fields.active,'','Do primeiro subitem, Voltar retorna à lista da seção');
for(const id of ['qualidade','rastreabilidade','remota','descarte']){element('next').onclick();assert.equal(ctx.active,6);assert.equal(state.meta.drogaria_secoes.documentos_hub.fields.active,id);}
element('next').onclick();assert.equal(ctx.active,7);assert.equal(JSON.parse(persisted.get('draft')).meta.drogaria_secoes.area_recebimento.answers.conferencia,'nao');
ctx.active=8;element('next').onclick();assert.equal(ctx.tab,'relatorio');
element('back').onclick();assert.equal(ctx.tab,'roteiro');assert.equal(ctx.active,0);
state=ctx.DrogariaEngine.fresh();state.meta={data:'2026-09-10',razao:'Drogaria Teste',endereco:'Rua de Teste',endereco_numero:'123',bairro:'Centro',municipio:'São Paulo',estado:'SP',cep:'01000-000',afe:'AFE-TESTE',ae:'AE-TESTE',atividades_autorizadas:['Autorização Anvisa de teste'],review_specs:{'area_recebimento|conferencia':{label:'Conferência de lote e validade',refs:[]},'transporte|objeto':{label:'Objeto do contrato',group:'fields'}}};
state.fields.atividades_licenciadas=['Atividade licenciada de teste'];state.answers.vaccine='nao';state.answers.eac='nao';state.answers.thermo='sim';state.cold=[{id:'c1',name:'Geladeira 1',min:'2',max:'7',now:'5'},{id:'c2',name:'Geladeira 2',min:'3',max:'8',now:'6'}];state.answers['cold_clean@c2']='nao';state.meta.drogaria_secoes={area_recebimento:{answers:{conferencia:'nao'},fields:{},docs:[]},servicos_farmaceuticos:{answers:{realiza:'nao'},fields:{},docs:[]},transporte:{answers:{aplica:'sim'},fields:{objeto:'Entrega em domicílio'},docs:[]},documentos_qualidade:{answers:{},fields:{},docs:[{title:'Manual',fields:{titulo:'Manual conferido'},includeInReport:true},{title:'Documento excluído',fields:{titulo:'SEGREDO_NAO_TRANSMITIR'},includeInReport:false}]}};
state.stock=[{name:'Produto teste',registro:'123',lote:'L1',expected:'8',actual:'7'}];
const unchanged=JSON.stringify(state),report=ctx.DrogariaEngine.report(catalog,state,data),text=report.blocks.map(b=>b.x||b.v||'').join('\n');
assert.equal(JSON.stringify(state),unchanged,'Gerar relatório não pode alterar respostas');
assert.ok(text.includes('Rua de Teste, 123, Centro, São Paulo, SP, 01000-000'));
assert.ok(text.includes('AFE-TESTE')&&text.includes('AE-TESTE'));
assert.ok(text.includes('Atividade licenciada de teste')&&text.includes('Autorização Anvisa de teste'));
assert.ok(text.includes('Geladeira 1')&&text.includes('Geladeira 2'));
assert.ok(text.includes('Manual conferido')&&!text.includes('SEGREDO_NAO_TRANSMITIR'));
assert.ok(!/não (realiza vacinação|executa Exames)|Complemento estruturado|serviços farmacêuticos registrados/i.test(text));
assert.equal(report.blocks.filter(b=>b.t==='h1'&&b.x.startsWith('11 ')).length,1);
assert.equal(report.blocks.find(b=>b.t==='table').rows[0].at(-1),'-1','Conservar cálculo da conferência por lote');
assert.ok(report.irregularities.some(r=>r.id==='rev_area_recebimento_conferencia'),'Achado deve integrar a tela nativa de medidas');
assert.ok(report.irregularities.some(r=>r.id==='cold_clean@c2'));
const clearCopy=structuredClone(state);clearCopy.rooms=[{id:'r1',type:'estoque',floor:'terreo'}];const preservedRooms=JSON.stringify(clearCopy.rooms);ctx.DrogariaReview.clearSection(clearCopy,1);assert.equal(JSON.stringify(clearCopy.rooms),preservedRooms,'Limpar seção 1 não apaga ambientes da seção 2');
state.answers.thermo='nao';const coldNo=ctx.DrogariaEngine.report(catalog,state,data).blocks.map(b=>b.x||'').join('\n');assert.ok(coldNo.includes('não realiza venda de medicamentos termolábeis'));
// Round-trip dos recursos: o artefato entregue é o integrado, não uma fonte avulsa.
for(const n of ['drogaria-ocr-tools','drogaria-review','drogaria-section1','drogaria-area-fisica','drogaria-servicos-documentos','drogaria-final-bridge'])assert.equal(blocks.get('rec--'+n+'.js'),fs.readFileSync(path.join(root,n+'.js'),'utf8'));
for(const[id,source]of blocks)if(['app--drogaria','app--estoque-produtos'].includes(id))for(const s of scripts(source))if(!/src=|application\/json|text\/plain/.test(s.attrs))new vm.Script(s.source,{filename:id});
assert.ok(html.includes('b.dataset.tab==="achados"&&b.textContent!=="Infrações"'),'Observador deve ser idempotente');
assert.ok(!blocks.get('rec--drogaria-final-bridge.js').includes('Baixar Word completo'),'Exportação deve usar o mesmo gerador');
assert.ok(!blocks.get('rec--drogaria-final-bridge.js').includes('Complemento estruturado do relatório'));
if(process.argv.includes('--docx')){
  // Fixture de QA reproduzível com dados sintéticos e o exportador do módulo vigente.
  ctx.JSZip=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/jszip');
  vm.runInContext(scripts(app)[1].source,ctx);
  ctx.reportBlocks=report.blocks;
  vm.runInContext("makeDocx(reportBlocks,'Relatório de inspeção sanitária')",ctx).then(async blob=>{const output=path.resolve(root,'..','qa-drogaria','relatorio-teste.docx');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,Buffer.from(await blob.arrayBuffer()));console.log('DOCX de teste: '+output);}).catch(e=>{console.error(e.message);process.exitCode=1;});
}
console.log('PASS: eventos das 4 pontes; entrada sem perda de foco; persistência; 8 seções; categorias; relatório e achados; 2 refrigeradores; estoque; exclusão documental; sintaxe dos módulos e round-trip.');
