'use strict';
/* Central de Consultas — ajustes idempotentes no bloco app--central-consultas:
   1. Registro de 13 dígitos (registro da apresentação, impresso na embalagem):
      sem correspondência exata, busca pelo registro do produto (9 primeiros) e
      explica a origem no campo “Observação”.
   2. Lote nas medidas fiscais em minúsculas, como no índice publicado.
   3. CNES: modo próprio e cadastro no CNES nos resultados por CNPJ.
   Uso: node scripts/repack-central.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const id = 'app--central-consultas';
const re = new RegExp('(<script type="text/plain" id="' + id + '">)([\\s\\S]*?)(</script>)');
const m = html.match(re); if (!m) throw Error(id);
let app = lz.decompressFromBase64(m[2]); if (!app) throw Error('descompactação');
const troca = (de, para, rot) => { if (app.includes(para)) return; if (!app.includes(de)) throw Error('Trecho não localizado: ' + rot); app = app.replace(de, () => para); };
troca("[r.main,r.alerts,r.irregular]=await Promise.all([baseByRegistro(v),alerts('registro',v),irregular('registro',v)])}",
  "[r.main,r.alerts,r.irregular]=await Promise.all([baseByRegistro(v),alerts('registro',v),irregular('registro',v)]);if(!r.main.length&&v.length===13){const v9=v.slice(0,9);r.main=(await baseByRegistro(v9)).map(x=>({...x,observacao:'Localizado pelo registro do produto ('+v9+'). O número informado ('+v+') é o registro da apresentação.'}))}}", 'registro de 13 dígitos');
/* 2. Lote nas medidas fiscais: a base publica o índice irregulares_lote em minúsculas
      (arquivos lm.json e chaves "lm283"); a busca pedia LM.json e dava 404 no Pages. */
troca("async function irregular(kind,value){\n  const v=kind==='lote'?norm(value):digits(value),", "async function irregular(kind,value){\n  const v=kind==='lote'?norm(value).toLowerCase():digits(value),", 'lote irregulares');
troca("const order=['produto',", "const order=['observacao','produto',", 'ordem');
troca("const field={produto:'Produto',", "const field={observacao:'Observação',produto:'Produto',", 'rótulo');
/* 3. CNES (base-vigilancia/dados/cnes, município de São Paulo): modo “CNES”, e o cadastro no CNES
      nos resultados por CNPJ (próprio e de mantenedora). Código em scripts/central-cnes.js. */
const CNES_JS = '/* CNES-INICIO */\n' + fs.readFileSync(path.join(__dirname, 'central-cnes.js'), 'utf8') + '/* CNES-FIM */\n';
{ const i = app.indexOf('/* CNES-INICIO */'), j = app.indexOf('/* CNES-FIM */\n');
  if (i >= 0 && j > i) app = app.slice(0, i) + CNES_JS + app.slice(j + '/* CNES-FIM */\n'.length);
  else troca("async function byCnpj(cnpj){", CNES_JS + "async function byCnpj(cnpj){", 'CNES: funções'); }
troca("[afe,ativ,idx,can,a,irr]=await Promise.all([", "[afe,ativ,idx,can,a,irr,cn]=await Promise.all([", 'CNES: byCnpj variáveis');
troca("irregular('cnpj',cnpj)]);const products", "irregular('cnpj',cnpj),cnesPorCnpj(cnpj)]);const products", 'CNES: byCnpj busca');
troca(".map(x=>({...x,_base:'cannabis'}))),alerts:a,irregular:irr}}", ".map(x=>({...x,_base:'cannabis'})),cn),alerts:a,irregular:irr}}", 'CNES: byCnpj resultado');
troca('<button class="mode" data-mode="afe" type="button">AFE / AE</button>', '<button class="mode" data-mode="afe" type="button">AFE / AE</button><button class="mode" data-mode="cnes" type="button">CNES</button>', 'CNES: botão');
troca(" lote:['Lote, série ou modelo'", " cnes:['Número do CNES','Ex.: <code>2077485</code> — 7 dígitos.','Cadastro Nacional de Estabelecimentos de Saúde (Ministério da Saúde, base mensal do DATASUS), só do <b>município de São Paulo</b>: tipo de unidade, CNPJ, endereço, licença sanitária declarada, equipamentos e serviços. É cadastro declarado pelo estabelecimento e pode estar desatualizado: não prova funcionamento regular.'],\n lote:['Lote, série ou modelo'", 'CNES: modo');
troca("    else if(mode==='afe'){", "    else if(mode==='cnes'){const v=digits(raw);if(v.length<6||v.length>7)throw Error('O CNES tem 7 dígitos.');r.main=await cnesPorCodigo(v)}\n    else if(mode==='afe'){", 'CNES: consulta');
troca("produtos_irregulares:'Produtos irregulares',produto:'Produto vinculado'};", "produtos_irregulares:'Produtos irregulares',produto:'Produto vinculado',cnes:'CNES — estabelecimentos de saúde (São Paulo)'};", 'CNES: rótulo da base');
troca("produtos_irregulares:'Produtos irregulares (Anvisa)',", "produtos_irregulares:'Produtos irregulares (Anvisa)', cnes:'CNES — estabelecimentos de saúde (Ministério da Saúde/DATASUS)',", 'CNES: procedência');
troca("function valor(k,v){", "Object.assign(field,{cnes:'CNES',tipo_unidade:'Tipo de unidade',cnpj_mantenedora:'CNPJ da mantenedora',endereco:'Endereço',telefone:'Telefone',email:'E-mail',gestao:'Gestão',turno:'Turno de atendimento',licenca_cnes:'Licença sanitária declarada no CNES',equipamentos:'Equipamentos declarados',servicos:'Serviços declarados',atualizacao_cnes:'Atualização no CNES'});\nfunction valor(k,v){", 'CNES: rótulos dos campos');
troca("'Reúne, separados por base, as autorizações AFE/AE, os produtos vinculados ao CNPJ,", "'Reúne, separados por base, as autorizações AFE/AE, o cadastro no CNES (município de São Paulo), os produtos vinculados ao CNPJ,", 'CNES: dica do CNPJ');
/* 4. Produtos não regularizados como dispositivos médicos (lista da Anvisa; pedido de 22/10/2026):
      modo “DM não regularizado”, busca por nome ou trecho. Código em scripts/central-naoreg.js. */
const NR_JS = '/* NAOREG-INICIO */\n' + fs.readFileSync(path.join(__dirname, 'central-naoreg.js'), 'utf8') + '/* NAOREG-FIM */\n';
{ const i = app.indexOf('/* NAOREG-INICIO */'), j = app.indexOf('/* NAOREG-FIM */\n');
  if (i >= 0 && j > i) app = app.slice(0, i) + NR_JS + app.slice(j + '/* NAOREG-FIM */\n'.length);
  else troca("async function byCnpj(cnpj){", NR_JS + "async function byCnpj(cnpj){", 'naoreg: funções'); }
troca('<button class="mode" data-mode="cnes" type="button">CNES</button>', '<button class="mode" data-mode="cnes" type="button">CNES</button><button class="mode" data-mode="naoreg" type="button">DM não regularizado</button>', 'naoreg: botão');
troca(" cnes:['Número do CNES'", " naoreg:['Produto (nome ou trecho)','Ex.: <code>centrífuga</code> — ao menos 3 letras.','Procura na lista da Anvisa de <b>produtos não regularizados como dispositivos médicos</b>, que não exigem notificação nem registro. Leia a exceção de cada item (“exceto…”): se o produto se enquadra nela, é dispositivo médico. Não estar na lista não quer dizer que o produto seja dispositivo médico, e estar nela não dispensa outra regularização (saneante, cosmético etc.).'],\n cnes:['Número do CNES'", 'naoreg: cfg');
troca("$('q').inputMode=next==='lote'?'text':'numeric';", "$('q').inputMode=next==='lote'||next==='naoreg'?'text':'numeric';", 'naoreg: teclado');
troca("    else if(mode==='cnes'){", "    else if(mode==='naoreg'){r.main=await naoRegulados(raw)}\n    else if(mode==='cnes'){", 'naoreg: consulta');
troca("const labels={dispositivos:", "const labels={produtos_nao_regulados:'Produtos não regularizados como dispositivos médicos',dispositivos:", 'naoreg: rótulo da base');
troca("cnes:'CNES — estabelecimentos de saúde (Ministério da Saúde/DATASUS)',", "cnes:'CNES — estabelecimentos de saúde (Ministério da Saúde/DATASUS)', produtos_nao_regulados:'Produtos não regularizados como dispositivos médicos (Anvisa)',", 'naoreg: procedência');
troca("Object.assign(field,{cnes:'CNES',", "Object.assign(field,{subitens:'Também incluídos',atualizacao_fonte:'Lista atualizada pela Anvisa em'});\nObject.assign(field,{cnes:'CNES',", 'naoreg: campos');
troca("  <b>Não encontrado</b>", "  <b>DM não regularizado</b><span>Lista da Anvisa de produtos que não são regularizados como dispositivos médicos (não exigem notificação nem registro), com as exceções de cada item.</span>\n  <b>Não encontrado</b>", 'naoreg: guia');
/* Procedência da base: sem o endereço do repositório. */
const repo = "\n     +'<b>Repositório</b><span><a href=\"'+esc(m.repo)+'\" target=\"_blank\" rel=\"noopener noreferrer\">'+esc(m.repo)+'</a></span>'";
if (app.includes(repo)) app = app.replace(repo, '');
const enc = lz.compressToBase64(app); if (lz.decompressFromBase64(enc) !== app) throw Error('round-trip');
html = html.replace(re, () => m[1] + enc + m[3]);
fs.writeFileSync(file, html);
console.log('Central de Consultas: ajustes aplicados.');
