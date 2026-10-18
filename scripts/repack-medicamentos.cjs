#!/usr/bin/env node
/* Núcleo Medicamentos igual ao site Medicamentos (17/10/2026: o Roteiros passa a
   ser o lugar único). Aplica nos módulos de drogaria, manipulação, atacadista
   (distribuidora/transportadora) e Central de Consultas os mesmos ajustes que o
   build do Medicamentos (medicamentos/build/montar.cjs) aplicava sobre o
   Roteiros: drogaria em supermercado, lacunas e Lei 13.725 na drogaria, bloco 13
   de estéreis na manipulação, trilha de transportadora e Anexo I no atacadista,
   correções da Central, OCR limitado etc. Os arquivos de apoio vieram de
   medicamentos/modulos/ e ficam em medicamentos/ neste repositório.
   Idempotente: cada alteração de bloco deixa uma marca (med:<hash>) e não é
   aplicada de novo; as trocas na casca não repetem quando o texto novo já está
   lá. Se um bloco for regerado (repack-drogaria, repack-manipulacao-v2 …), rode
   este script de novo depois.
   Uso: node scripts/repack-medicamentos.cjs */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {unpack} = require('./integrated-html.cjs');
const ROT = path.join(__dirname, '..'), FILE = path.join(ROT, 'index.html');
const MED = path.join(ROT, 'medicamentos');
let {html: h, lz, blocks: BLOCOS} = unpack(FILE);
const ORIENT = require(path.join(MED, 'orientacoes', 'orientacoes.cjs'));
function troca(de, para, rotulo) {
  if (h.includes(para)) return;
  const n = h.split(de).length - 1;
  if (n !== 1) throw Error(`${rotulo}: esperava 1 ocorrência, achei ${n}`);
  h = h.replace(de, () => para);
}

/* 1b. Complementos dentro dos módulos herdados. Cada bloco é descompactado,
   alterado com a mesma checagem de ocorrência única e compactado de novo. */
function blocoAltera(id, fn) {
  const rx = new RegExp(`(<script type="text/plain" id="${id.replace(/[.]/g, '\\.')}">)([\\s\\S]*?)(</script>)`);
  const m = h.match(rx);
  if (!m) throw Error(`bloco ${id} não encontrado`);
  const atual = lz.decompressFromBase64(m[2].trim());
  const hash = crypto.createHash('sha1').update(fn.toString()).digest('hex').slice(0, 10);
  const marca = /\.(js|css)$/.test(id) ? `\n/*med:${hash}*/` : `\n<!--med:${hash}-->`;
  if (atual.includes(marca)) return;
  const novo = fn(atual) + marca;
  h = h.replace(rx, (_, a, __, c) => a + lz.compressToBase64(novo) + c);
}
function trocaEm(s, de, para, rotulo) {
  const n = s.split(de).length - 1;
  if (n !== 1) throw Error(`${rotulo}: esperava 1 ocorrência, achei ${n}`);
  return s.replace(de, () => para);
}
/* Referências do catálogo da drogaria (VISA_LOCAL embutido no módulo). */
function catalogoDrogaria(s, fn) {
  const at = s.indexOf('const VISA_LOCAL='), ini = s.indexOf('{', at);
  let prof = 0, aspas = false, esc2 = false, fim = -1;
  for (let i = ini; i < s.length; i++) {
    const c = s[i];
    if (aspas) { if (esc2) esc2 = false; else if (c === '\\') esc2 = true; else if (c === '"') aspas = false; }
    else if (c === '"') aspas = true;
    else if (c === '{') prof++;
    else if (c === '}' && --prof === 0) { fim = i + 1; break; }
  }
  const visa = JSON.parse(s.slice(ini, fim));
  fn(visa);
  return s.slice(0, ini) + JSON.stringify(visa) + s.slice(fim);
}

/* Drogaria em supermercado: perguntas na Área física, texto na seção 4 e
   irregularidades na seção 11 (medicamentos/drogaria-supermercado.js). */
const SUPER_JS = fs.readFileSync(path.join(MED, 'drogaria-supermercado.js'), 'utf8');
blocoAltera('app--drogaria', s => {
  s = catalogoDrogaria(s, visa => {
    const cat = visa['roteiros/drogaria.json'];
    const lei = visa['legislacao_v12/normas/lei-5991-1973.json'], rdc = visa['legislacao_v12/normas/rdc-44-2009.json'];
    const base44 = cat.referencias['rdc-44-2009::artigo::13'], base5991 = cat.referencias['lei-5991-1973::artigo::35::paragrafo::2'];
    const novas = [['lei-5991-1973::artigo::6::paragrafo::2', 'Art. 6º, § 2º', base5991, lei], ['lei-5991-1973::artigo::6::paragrafo::3', 'Art. 6º, § 3º', base5991, lei],
      ['lei-5991-1973::artigo::6::paragrafo::4', 'Art. 6º, § 4º', base5991, lei], ['lei-5991-1973::artigo::6::paragrafo::5', 'Art. 6º, § 5º', base5991, lei],
      ['rdc-44-2009::artigo::13::paragrafo::2', 'Art. 13, § 2º', base44, rdc]];
    for (const [id, disp, base, norma] of novas) {
      if (!norma.nos.some(n => n.id === id)) throw Error('dispositivo ausente no banco: ' + id);
      cat.referencias[id] ??= {...base, id, dispositivo: disp};
    }
  });
  const fim = s.lastIndexOf('</body>');
  return s.slice(0, fim) + '<script>' + SUPER_JS + '</script>' + s.slice(fim);
});
blocoAltera('rec--drogaria-area-fisica.js', s => trocaEm(s,
  "question(n,'acesso','O acesso ao estabelecimento é independente ou se enquadra nas exceções aplicáveis para galerias, shoppings e supermercados?',null,false)",
  "question(n,'acesso','O acesso ao estabelecimento é independente ou se enquadra nas exceções aplicáveis para galerias, shoppings e supermercados?',null,false)+(window.__drgSuperHtml?window.__drgSuperHtml(n,a,{question,select,field,check}):'')",
  'supermercado: tela'));
blocoAltera('rec--drogaria-report-final.js', s => {
  s = trocaEm(s, "else if(no(a.acesso))intro+=' O acesso ao estabelecimento não é independente e não se enquadra nas exceções aplicáveis.';p(B,intro);",
    "else if(no(a.acesso))intro+=' O acesso ao estabelecimento não é independente e não se enquadra nas exceções aplicáveis.';p(B,intro);if(window.__drgSuperReport)window.__drgSuperReport(B,g,p,yes,no);", 'supermercado: relatório');
  return trocaEm(s, `if(no(ag.answers.acesso))addIssue(out,'final_area_acesso',2,'4 Área Física','O acesso ao estabelecimento não é independente e não se enquadra nas exceções aplicáveis.',["rdc-44-2009::artigo::13"]);`,
    `if(no(ag.answers.acesso))addIssue(out,'final_area_acesso',2,'4 Área Física','O acesso ao estabelecimento não é independente e não se enquadra nas exceções aplicáveis.',["rdc-44-2009::artigo::13"]);if(window.__drgSuperIssues)window.__drgSuperIssues(ag,out,addIssue,no);`, 'supermercado: irregularidades');
});


/* 7b. Parâmetro do roteiro (?instalacao=...): a casca injetava no primeiro
   '</head>' do texto, que na drogaria está dentro de uma string JS do
   relatório Word, e o módulo quebrava. Injeta logo após a abertura <head>. */
troca("if(qs){ fonte = fonte.replace('</head>','<script>window.__QS='+JSON.stringify('?'+qs)+';<\\/script></head>'); }",
  "if(qs){ fonte = fonte.replace(/<head(\\s[^>]*)?>/i, function(m){ return m+'<script>window.__QS='+JSON.stringify('?'+qs)+';<\\/script>'; }); }", 'injeção do parâmetro');

/* 7g. Manipulação: bloco 13 “Manipulação de estéreis” (RDC 67/2007, Anexo IV;
   verificações do Anexo VII, item 18) dentro do roteiro principal. Aparece
   quando a caracterização marca a preparação “Estéreis” (condição estereis).
   Dados em medicamentos/estereis/cartao13.json, gerado por medicamentos/estereis/gerar.py. */
{
  const CARTAO13 = JSON.parse(fs.readFileSync(path.join(MED, 'estereis', 'cartao13.json'), 'utf8'));
  blocoAltera('app--farmacia-manipulacao', s => {
    s = trocaEm(s, 'const APP_DATA={"cards":{', 'const APP_DATA={"cards":{"13":' + JSON.stringify(CARTAO13).replace(/<\//g, '<\\/') + ',', 'estéreis: cartão 13');
    s = trocaEm(s, '"conditionLabels":{', '"conditionLabels":{"estereis":"Manipula preparações estéreis",', 'estéreis: rótulo da condição');
    s = trocaEm(s, '"orient":{', '"orient":{' + JSON.stringify(ORIENT.estereis).slice(1, -1) + ',', 'estéreis: orientações');
    s = trocaEm(s, 'chip("preps","oficinais","Oficinais")', 'chip("preps","oficinais","Oficinais")}${chip("preps","estereis","Estéreis")', 'estéreis: caracterização');
    s = trocaEm(s, "homeopatia:preps.includes('homeopaticas')", "estereis:preps.includes('estereis'),homeopatia:preps.includes('homeopaticas')", 'estéreis: condição');
    return trocaEm(s, "const L={homeopaticas:'homeopáticas',", "const L={homeopaticas:'homeopáticas',estereis:'estéreis',", 'estéreis: relatório');
  });
}

/* 7h. Drogaria: a equipe inspetora (Seção 1 › Dados da inspeção) não saía no
   relatório; entra como 2.4 na seção 2 INSPEÇÃO. */
blocoAltera('rec--drogaria-report-final.js', s => trocaEm(s,
  "kv(B,'2.3. Período da última inspeção',m.ultima_inspecao_periodo||m.ultima_inspecao);",
  "kv(B,'2.3. Período da última inspeção',m.ultima_inspecao_periodo||m.ultima_inspecao);kv(B,'2.4. Equipe inspetora',m.equipe);",
  'drogaria: equipe inspetora'));

/* 7i. Atacadista/Transportadora — Anexo I: itens 5 (informações gerais) e 6
   (NCs anteriores) usam o rascunho montado da etapa 1 do roteiro quando a
   equipe não escreveu o texto na aba Relatório (antes saíam “Não informado”
   mesmo com a caracterização e o histórico preenchidos). */
blocoAltera('app--distribuidoras-transportadoras', s => {
  s = trocaEm(s, "it(5,'Informações gerais');ddParas(R.general).forEach(t=>p(t));if(!ddTem(R.general))p('Não informado.');",
    "it(5,'Informações gerais');{const rg=ddRascunhoGeral(),g=ddTem(R.general)?R.general:rg;ddParas(g).forEach(t=>p(t));const fg=ddTem(R.general)?ddFaltantes(R.general,rg):'';if(fg)p('Dados registrados na etapa 1: '+fg);if(!ddTem(g))p('Não informado.')}", 'anexo I: item 5');
  s = trocaEm(s, "it(6,'Não conformidades anteriores');ddParas(R.previous).forEach(t=>p(t));if(!ddTem(R.previous))p(primeira?'Não se aplica: primeira inspeção.':'Não informado.');",
    "it(6,'Não conformidades anteriores');{const ra=ddRascunhoAnterior(),q=ddTem(R.previous)?R.previous:ra;ddParas(q).forEach(t=>p(t));const fq=ddTem(R.previous)?ddFaltantes(R.previous,ra):'';if(fq)p('Histórico registrado na etapa 1: '+fq);if(!ddTem(q))p(primeira?'Não se aplica: primeira inspeção.':'Não informado.')}", 'anexo I: item 6');
  s = trocaEm(s, "if(!ddTem(R.general))out.push('Item 5: informações gerais não preenchidas.');", "if(!ddTem(R.general)&&!ddTem(ddRascunhoGeral()))out.push('Item 5: informações gerais não preenchidas.');", 'anexo I: pendência 5');
  /* Tipo de operação e trilha de transportadora na Etapa 1 › Estabelecimento */
  s = trocaEm(s, "business:[['meta.company','Razão social'],",
    "business:[['meta.opTipo','Tipo de operação','select',['Distribuidora (distribuição e armazenagem)','Transportadora (somente transporte)','Distribuidora e transportadora']],['meta.company','Razão social'],", 'atacadista: tipo de operação');
  s = trocaEm(s, "['meta.otherUnits','Outros estabelecimentos / unidades vinculadas','textarea']],",
    "['meta.otherUnits','Outros estabelecimentos / unidades vinculadas','textarea'],"
    + "['meta.transpClientes','Transportadora — clientes atendidos','checks',['Indústrias','Importadoras','Distribuidoras','Farmácias e drogarias','Hospitais e clínicas','Entrega ao consumidor (dispensação a distância de farmácia)','Outros']],"
    + "['meta.transpProdutos','Transportadora — produtos transportados','checks',['Medicamentos em temperatura ambiente','Termolábeis (2 °C a 8 °C)','Sujeitos a controle especial','Produtos para saúde','Cosméticos e saneantes','Produtos perigosos (ANTT)']],"
    + "['meta.transpCross','Transportadora — faz armazenagem temporária (cross-docking)?','select',['Sim','Não']],"
    + "['meta.transpFrota','Transportadora — frota','select',['Própria','Terceirizada','Própria e terceirizada']],"
    + "['meta.transpVeiculos','Transportadora — veículos (quantidade, tipo, controle de temperatura)','textarea'],"
    + "['meta.transpRntrc','Transportadora — RNTRC (ANTT) nº']],", 'atacadista: trilha de transportadora');
  /* a trilha entra no rascunho das informações gerais (item 5 do Anexo I) */
  s = trocaEm(s, "function ddRascunhoGeral(){",
    "function ddTrilhaTransp(){const m=state.meta||{},t=[];if(ddTem(m.opTipo))t.push('Tipo de operação: '+ddLc(m.opTipo)+'.');if(!/transportadora/i.test(m.opTipo||''))return t.join(' ');"
    + "const c=ddLista(m.transpClientes),p=ddLista(m.transpProdutos);if(c.length)t.push('Como transportadora, atende: '+ddJoin(c.map(ddLc))+'.');if(p.length)t.push('Produtos transportados: '+ddJoin(p.map(ddLc))+'.');"
    + "if(m.transpCross==='Sim')t.push('Realiza armazenagem temporária (cross-docking).');else if(m.transpCross==='Não')t.push('Não realiza armazenagem temporária.');"
    + "if(ddTem(m.transpFrota))t.push('Frota '+ddLc(m.transpFrota)+'.');if(ddTem(m.transpVeiculos))t.push('Veículos: '+ddFim(m.transpVeiculos));if(ddTem(m.transpRntrc))t.push('RNTRC nº '+m.transpRntrc+'.');return t.join(' ')}"
    + "function ddRascunhoGeral(){return [ddTrilhaTransp(),ddRascunhoGeral0()].filter(ddTem).join('\\n\\n')}function ddRascunhoGeral0(){", 'atacadista: trilha no item 5');
  /* Etapa 1 › Dados da inspeção › Atividades (meta.activities) não saía em lugar
     nenhum do Anexo I: os quadros de atividades dos itens 1 e 2 são os da licença,
     da AFE e da AE. O modelo não tem linha própria no item 3; entra junto do objetivo. */
  s = trocaEm(s, "kv('Objetivo da inspeção',[m.objective,m.inspectionType&&('Tipo: '+m.inspectionType)].filter(Boolean).join('. '));",
    "kv('Objetivo da inspeção',[m.objective,m.inspectionType&&('Tipo: '+m.inspectionType),(Array.isArray(m.activities)?m.activities:ddLista(m.activities)).length&&('Atividades verificadas: '+ddJoin((Array.isArray(m.activities)?m.activities:ddLista(m.activities)).map(ddLc)))].filter(Boolean).join('. '));", 'anexo I: atividades verificadas');
  return trocaEm(s, "if(!ddTem(R.previous)&&m.first!=='Sim')", "if(!ddTem(R.previous)&&!ddTem(ddRascunhoAnterior())&&m.first!=='Sim')", 'anexo I: pendência 6');
});

/* 7f. Prévia “Como sai no relatório”: o módulo da distribuidora tem um ouvinte
   de clique em window (captura) que interrompe a propagação, e a prévia ouvia
   em document, por isso nunca registrava a resposta dada. Ouvindo em window
   ela recebe o clique antes da interrupção. */
for (const id of ['app--drogaria', 'app--distribuidoras-transportadoras'])
  blocoAltera(id, s => trocaEm(trocaEm(s, "document.addEventListener(k,evento,true)", "window.addEventListener(k,evento,true)", 'prévia: ' + id),
    "var GEN=/^(Não foram registradas irregularidades|", "var GEN=/^(Nº \\||Avaliação de risco não informada|Análise do plano de ação — será anexada|Não foram registradas irregularidades|", 'prévia GEN: ' + id));

/* 7d. Drogaria › Área física › "Informações gerais" (tipo de instalação,
   pavimentos, acesso, áreas, caixa d'água, ventilação) não aparecia: a casca
   procurava o bloco no HTML antigo do card, onde ele não existe. Passa a ler
   da tela própria da Área física. (O mesmo defeito existe no roteiros.) */
troca("var geral=Array.from(t.content.querySelectorAll('.box')).find(function(el){",
  "var tg=document.createElement('template');try{tg.innerHTML=(window.DrogariaAreaFisica&&window.DrogariaAreaFisica.render(2))||''}catch(e){}var geral=Array.from(tg.content.querySelectorAll('.box')).concat(Array.from(t.content.querySelectorAll('.box'))).find(function(el){",
  'drogaria: informações gerais');
troca("if(geral)itens.push({id:'area-geral',title:'Informações gerais',html:geral.outerHTML});",
  "if(geral)itens.push({id:'area-geral',title:'Informações gerais',html:geral.innerHTML.replace(/^\\s*<h3>[^<]*<\\/h3>/,'')});",
  'drogaria: informações gerais aberta');
/* 7e. Atacadista de medicamentos (módulo da distribuidora): a identificação
   diz se o estabelecimento é distribuidora, só transportadora ou as duas; a
   trilha de transportadora (clientes, cross-docking, frota, RNTRC…) aparece
   quando há transporte, e o cabeçalho leva o nome conforme o tipo
   (medicamentos/atacadista-ajustes.js). Nada é marcado “Não se aplica” sozinho. */
const le = f => fs.readFileSync(path.join(MED, f), 'utf8');
const jsStr = t => JSON.stringify(t).replace(/<\//g, '<\\/');
/* Ajustes que entram ao montar o módulo (fim do <body>): atacadista
   (medicamentos/atacadista-ajustes.js), manipulação (manipulacao-ajustes.js),
   Central de Consultas no modo Automático (central-auto.js) e orientações das
   seções de transporte (transporte-orient.js). As ferramentas de campo já
   entram pela casca do Roteiros (scripts/repack-campo.cjs). */
/* Já montado: regrava o trecho, para que mudanças nos arquivos de ajuste entrem de novo. */
{ const INI = '  var ATACADISTA_JS = ', FIM = "  function montarBase(app){\n    var s = rec('app--' + app);";
  const i = h.indexOf(INI), j = h.indexOf(FIM);
  if (i >= 0 && j > i && h.indexOf(INI, i + 1) < 0) h = h.slice(0, i) + "  function montar(app){\n    var s = rec('app--' + app);" + h.slice(j + FIM.length); }
troca('  function montar(app){\n    var s = rec(\'app--\' + app);',
  `  var ATACADISTA_JS = ${jsStr(le('atacadista-ajustes.js'))};
  var CENTRAL_AUTO_JS = ${jsStr(le('central-auto.js'))};
  var MANIP_JS = ${jsStr(le('manipulacao-ajustes.js'))};
  var ORIENT_TRANSP = ${jsStr(JSON.stringify(ORIENT.transporte))};
  var TRANSP_ORIENT_JS = ${jsStr(le('transporte-orient.js'))};
  function montar(app){ var s = montarBase(app);
    if(app === 'distribuidoras-transportadoras'){ var k = s.lastIndexOf('</body>'); s = s.slice(0, k) + '<scr' + 'ipt>' + ATACADISTA_JS + '</scr' + 'ipt>' + s.slice(k); }
    if(app === 'farmacia-manipulacao'){ var mj = s.lastIndexOf('</body>'); s = s.slice(0, mj) + '<scr' + 'ipt>' + MANIP_JS + '</scr' + 'ipt>' + s.slice(mj); }
    if(app === 'central-consultas'){ var c = s.lastIndexOf('</body>'); s = s.slice(0, c) + '<scr' + 'ipt>' + CENTRAL_AUTO_JS + '</scr' + 'ipt>' + s.slice(c); }
    if(app === 'distribuidoras-transportadoras'){ var o = s.lastIndexOf('</body>'); s = s.slice(0, o) + '<scr' + 'ipt>window.__ORIENT_TRANSP=' + ORIENT_TRANSP + ';' + TRANSP_ORIENT_JS + '</scr' + 'ipt>' + s.slice(o); }
    return s; }
  function montarBase(app){\n    var s = rec('app--' + app);`, 'montar: ajustes do Medicamentos');
troca("if(window.RoteiroEvidence)for(var k=1;k<=12;k++)await RoteiroEvidence.clear('manipulacao-card-'+k);", "if(window.RoteiroEvidence)for(var k=1;k<=13;k++)await RoteiroEvidence.clear('manipulacao-card-'+k);", 'manipulação: fotos do bloco 13');

/* 7j. Central de Consultas — três correções no núcleo de busca:
   - CNPJ ou EAN com dígito verificador errado: o aviso aparecia, mas a área de
     resultados continuava com a consulta anterior (dado de outra empresa na
     tela). Agora limpa os resultados até o usuário escolher “Consultar assim
     mesmo”.
   - Processo: o índice aponta saneantes e medicamentos para as visões por
     processo (saneantes_processos, medicamentos_processos), que materialize()
     não lia; só o complemento da casca achava, com atraso fixo, e perdia para a
     renderização (ex.: saneante 25351121048202134 dava 0). Agora o núcleo lê
     essas visões.
   - Medidas fiscais: empresa, produtos e medidas são objetos e saíam como
     “[object Object]” (título e campos). Agora viram texto. */
blocoAltera('app--central-consultas', s => {
  const LIMPA = "$('results').className='results-empty';$('results').textContent='Consulta não realizada. Confira o número digitado ou toque em “Consultar assim mesmo”.';ultimo=null;";
  s = trocaEm(s, "status(forcar(raw,'O dígito verificador deste CNPJ não confere", LIMPA + "status(forcar(raw,'O dígito verificador deste CNPJ não confere", 'central: DV CNPJ limpa');
  s = trocaEm(s, "status(forcar(raw,'O dígito verificador deste EAN/GTIN não confere", LIMPA + "status(forcar(raw,'O dígito verificador deste EAN/GTIN não confere", 'central: DV EAN limpa');
  s = trocaEm(s, "else if(b==='cosmeticos')data=await json(`cosmeticos/${shardProcessBase('cosmeticos',processo)}.json`)||[];",
    "else if(b==='cosmeticos')data=await json(`cosmeticos/${shardProcessBase('cosmeticos',processo)}.json`)||[];"
    + "else if(b==='saneantes_processos'||b==='medicamentos_processos'){const base=b.replace('_processos','');"
    + "if(out.some(x=>x._base===base&&digits(x.processo)===processo))continue;"
    + "out.push(...(await json(`${b}/${shardProcessBase(b,processo)}.json`)||[]).filter(x=>digits(x.processo)===processo).map(x=>{const y={...x,_base:base};"
    + "if(y.situacao==='S')y.situacao='Ativo';else if(y.situacao==='N')y.situacao='Inativo';"
    + "if(String(y.registrado)==='0'&&!y.registro)y.regularizacao='Notificado / sem número de registro';"
    + "const v=/^(\\d{2})\\/(\\d{2})\\/(\\d{4})/.exec(String(y.vencimento||''));if(v)y.vencimento=v[2]+'/'+v[1]+'/'+v[3];"
    + "delete y.registrado;delete y.atualizado_em;return y}));continue}",
    'central: processo em saneantes/medicamentos_processos');
  s = trocaEm(s, "const item=data?.[processo];if(item)out.push({...item,processo,_base:'produtos_irregulares'})",
    "const item=data?.[processo];if(item)out.push(achataIrregular({...item,processo,_base:'produtos_irregulares'}))", 'central: medida fiscal achatada');
  s = trocaEm(s, 'async function irregular(kind,value){',
    `function achataIrregular(it){
  const x={...it},dt=v=>{const m=/^(\\d{4})-(\\d{2})-(\\d{2})/.exec(String(v||''));return m?m[3]+'/'+m[2]+'/'+m[1]:String(v||'')},uniq=a=>[...new Set(a.filter(Boolean).map(String))].join(' · ');
  const ps=Array.isArray(it.produtos)?it.produtos.filter(p=>p&&typeof p==='object'):[];
  x.produto=(typeof it.produto==='string'&&it.produto)||uniq(ps.map(p=>p.produto))||String(it.produto_resumo||'').replace(/\\s*-\\s*Registrad[oa]:.*$/i,'')||'Produto com medida fiscal';
  if(ps.length){const r=uniq(ps.map(p=>p.registro)),l=uniq(ps.map(p=>p.lotes||p.lote));if(r)x.registro=r;if(l)x.lote=l}
  const e=it.empresa&&typeof it.empresa==='object'?it.empresa:null;
  if(e){x.empresa=e.razao_social||'';if(e.cnpj)x.cnpj=e.cnpj;if(e.municipio)x.municipio=e.municipio;if(e.uf)x.uf=e.uf}
  const ms=Array.isArray(it.medidas)?it.medidas.filter(m=>m&&typeof m==='object'):[];
  if(ms.length)x.medidas=ms.map(m=>[m.numero_resolucao?'RE '+m.numero_resolucao:'',m.data_publicacao?'DOU de '+dt(m.data_publicacao):'',Array.isArray(m.acoes_atividades)?m.acoes_atividades.join('; '):'',m.situacao_medida?'medida '+String(m.situacao_medida).toLowerCase():''].filter(Boolean).join(' — '));
  if(it.assunto&&typeof it.assunto==='object')x.assunto=it.assunto.descricao||'';
  if(it.data_ultima_medida)x.data_ultima_medida=dt(it.data_ultima_medida);
  ['produtos','controle','consultado_em','detalhe_status','codigo_risco','codigo_tipo_produto','id_dossie','presente_na_fonte','data_atualizacao','produto_resumo'].forEach(k=>delete x[k]);
  Object.keys(x).forEach(k=>{if(x[k]&&typeof x[k]==='object'&&!Array.isArray(x[k]))delete x[k]});
  return x;
}
async function irregular(kind,value){`, 'central: função achataIrregular');
  s = trocaEm(s, 'function valor(k,v){', "Object.assign(field,{infracao:'Infração',acoes_resumo:'Ações',medidas:'Medidas publicadas',assunto:'Assunto',risco:'Risco',data_ultima_medida:'Última medida',total_medidas:'Total de medidas',situacao_investigacao:'Em investigação',prova_processual_apensa:'Prova processual apensa'});\nfunction valor(k,v){", 'central: rótulos das medidas fiscais');
  /* Situação “S”/“N” e vencimento “mm/dd/aaaa hh:mm:ss” das bases de saneantes, em
     qualquer caminho (registro, processo); CNPJ tirado do “detentor” quando falta. */
  s = trocaEm(s, 'function valor(k,v){', "function valor(k,v){if(k==='situacao'&&(v==='S'||v==='N'))v=v==='S'?'Ativo':'Inativo';if(k==='vencimento'){const u=/^(\\d{2})\\/(\\d{2})\\/(\\d{4})\\s+\\d/.exec(String(v));if(u)return esc(u[2]+'/'+u[1]+'/'+u[3])}", 'central: situação e vencimento');
  s = trocaEm(s, "delete y.registrado;delete y.atualizado_em;return y}", "if(!y.cnpj){const c=/^(\\d{14})\\s*-/.exec(String(y.detentor||''));if(c)y.cnpj=c[1]}delete y.registrado;delete y.atualizado_em;return y}", 'central: cnpj do detentor');
  /* Alertas sanitários: identificadores (lote, série, modelo), anexos e outras
     publicações são listas de objetos e saíam “[object Object]” (ex.: ABL90Flex,
     alerta 2781). Viram texto; o link oficial vira link; datas com hora em dd/mm/aaaa.
     Rede de segurança no valor(): qualquer outra lista de objetos vira texto. */
  s = trocaEm(s, "if(numeros.includes(digits(item.numero_alerta)))out.push({...item,_base:'alertas_sanitarios'})",
    "if(numeros.includes(digits(item.numero_alerta)))out.push(achataAlerta({...item,_base:'alertas_sanitarios'}))", 'central: alerta achatado');
  s = trocaEm(s, 'async function alerts(kind,value){',
    `function achataAlerta(it){
  const x={...it},TIPO={lote:'Lote',serie:'Série',modelo:'Modelo',referencia:'Referência',codigo:'Código'};
  const ids=Array.isArray(it.identificadores)?it.identificadores.filter(i=>i&&typeof i==='object'):[];
  if(ids.length){const g=new Map();ids.forEach(i=>{const t=TIPO[i.tipo]||String(i.tipo||'Identificador');if(!g.has(t))g.set(t,[]);const vv=/^ver$/i.test(String(i.valor||'').trim())?'ver lista no anexo':String(i.valor||'');if(vv&&!g.get(t).includes(vv))g.get(t).push(vv)});x.identificadores=[...g].map(([t,v])=>t+': '+v.join(', ')).join(' · ')}else delete x.identificadores;
  const an=Array.isArray(it.anexos)?it.anexos.filter(a=>a&&typeof a==='object'):[];
  if(an.length)x.anexos=an.map(a=>a.nome||('Anexo '+(a.id||''))).join(' · ')+' (disponíveis na página oficial do alerta)';else delete x.anexos;
  const op=Array.isArray(it.outras_publicacoes)?it.outras_publicacoes.filter(a=>a&&typeof a==='object'):[];
  if(op.length)x.outras_publicacoes=op.map(a=>a.nome||a.url||'').filter(Boolean).join(' · ');else delete x.outras_publicacoes;
  if(Array.isArray(x.cnpjs))x.cnpjs=x.cnpjs.map(c=>/^\\d{14}$/.test(String(c))?fmtCnpj(String(c)):String(c));
  delete x.id_alerta;
  return x;
}
async function alerts(kind,value){`, 'central: função achataAlerta');
  s = trocaEm(s, "function valor(k,v){if(k==='situacao'",
    "function valor(k,v){if(/^data_/.test(k)){const d=/^(\\d{4})-(\\d{2})-(\\d{2})T/.exec(String(v||''));if(d)return esc(d[3]+'/'+d[2]+'/'+d[1])}"
    + "if(k==='url_oficial'&&/^https?:\\/\\//.test(String(v)))return '<a href=\"'+esc(v)+'\" target=\"_blank\" rel=\"noopener\">Abrir na Anvisa ↗</a>';"
    + "if(Array.isArray(v)&&v.some(e=>e&&typeof e==='object'))v=v.map(e=>e&&typeof e==='object'?(e.nome||e.valor||e.descricao||e.titulo||Object.values(e).filter(z=>z!=null&&typeof z!=='object').join(' ')):e);"
    + "if(k==='situacao'", 'central: datas, link e listas de objetos');
  s = trocaEm(s, "Object.assign(field,{infracao:'Infração',", "Object.assign(field,{identificadores:'Identificadores (lote, série, modelo)',anexos:'Anexos do alerta',outras_publicacoes:'Outras publicações',url_oficial:'Página oficial',informacoes_complementares:'Informações complementares',data_atualizacao:'Atualização',tipo_alerta:'Tipo',registros:'Registros',cnpjs:'CNPJ',motivacao:'Motivação',infracao:'Infração',", 'central: rótulos dos alertas');
  return s;
});

/* 7k. OCR de PDF (auditoria de 30/09/2026, R-01): passam pelo OCR no máximo 4
   páginas de imagem (6 em POP/manual/PGRSS e sumário). As páginas só de imagem
   além desse limite eram puladas sem aviso; agora entram na descrição da leitura
   (“sem OCR: página(s) …”), que aparece no painel do documento. */
for (const bloco of ['rec--drogaria-ocr-tools.js', 'app--farmacia-manipulacao', 'app--distribuidoras-transportadoras']) {
  blocoAltera(bloco, s => {
    s = trocaEm(s, 'let ocrPages = 0;', 'let ocrPages = 0; const semOcr = [];', `ocr ${bloco}: lista`);
    s = trocaEm(s, '      pages.push({ number: p, page, textLayer, region });', '      if (!region && ocrPages >= maxOcrPages && chars < 25) semOcr.push(p);\n      pages.push({ number: p, page, textLayer, region });', `ocr ${bloco}: página pulada`);
    s = trocaEm(s, 'return { pdf, pages, total: pdf.numPages };', 'return { pdf, pages, total: pdf.numPages, semOcr, maxOcrPages };', `ocr ${bloco}: retorno`);
    s = trocaEm(s, 'const { pdf, pages, total } = await pdfPages(file, type, progress);', 'const { pdf, pages, total, semOcr, maxOcrPages } = await pdfPages(file, type, progress);', `ocr ${bloco}: leitura`);
    return trocaEm(s, "const cut = total > pages.length ? ' · lidas ' + pages.length + ' de ' + total + ' páginas' : '';",
      "const cut = (total > pages.length ? ' · lidas ' + pages.length + ' de ' + total + ' páginas' : '') + (semOcr && semOcr.length ? ' · sem OCR (limite de ' + maxOcrPages + ' páginas de imagem por documento): página' + (semOcr.length > 1 ? 's ' : ' ') + semOcr.join(', ') + ' — confira essas páginas no documento' : '');", `ocr ${bloco}: aviso`);
  });
}

/* 7l. Evidência escrita que não chegava ao relatório (varredura de 01/10/2026,
   inspeção completa com respostas em rodízio):
   - Manipulação: a evidência só saía com “Não cumpre”; com “Cumpre” a frase saía
     sem ela, e “Não se aplica” era sempre omitido. Agora a evidência entra entre
     parênteses na frase de conformidade, e o “Não se aplica” com anotação sai com
     a justificativa (sem anotação continua omitido).
   - Atacadista: “Não se aplica” com anotação perdia a justificativa; agora sai. */
blocoAltera('app--farmacia-manipulacao', s => {
  s = trocaEm(s, "if(a.status==='C'){const dt=v2DocTxt(q.id);frases.push(esc(dt?q.pos.replace(/\\.$/,'')+' ('+dt+').':q.pos))}",
    "const evx=String(a.evidence||'').trim().replace(/\\s*\\n\\s*/g,'; ').replace(/\\.$/,'');"
    + "if(a.status==='C'){const dt=v2DocTxt(q.id),par=[dt,evx].filter(Boolean).join('; ');frases.push(esc(par?q.pos.replace(/\\.$/,'')+' ('+par+').':q.pos))}"
    + "else if(a.status==='NA'&&evx){frases.push(esc('Não se aplica ('+evx+'): '+q.pos.charAt(0).toLowerCase()+q.pos.slice(1).replace(/\\.?$/,'.')))}", 'manipulação: evidência em Cumpre e Não se aplica');
  return s;
});
/* Com “Descrição para o relatório” escrita pela equipe, o texto dela continua no
   lugar das frases de Cumpre (descrição consolidada do POP 011), mas as evidências
   que não estiverem no texto e as justificativas de Não se aplica vêm depois dele. */
blocoAltera('app--distribuidoras-transportadoras', s => {
  s = trocaEm(s, "else if(a.status==='NC'){const m=ctx.nc.map[q.id];",
    "else if(a.status==='NA'){const ev=String(a.evidence||'').trim().replace(/\\s*\\n\\s*/g,'; ').replace(/\\.$/,'');if(ev){const nf='Não se aplica ('+ev+'): '+ddLc(ddAfirma(q)).replace(/\\.?$/,'.');frases.push(nf);naF.push(nf)}}"
    + "else if(a.status==='NC'){const m=ctx.nc.map[q.id];", 'atacadista: justificativa do Não se aplica');
  s = trocaEm(s, "const sec=ddSec(sid),manual=String(state.narratives[sid]||'').trim(),frases=[],ncs=[];", "const sec=ddSec(sid),manual=String(state.narratives[sid]||'').trim(),frases=[],ncs=[],evsC=[],naF=[];", 'atacadista: listas de evidências');
  s = trocaEm(s, "if(a.status==='C'){let f=ddAfirma(q),ev=String(a.evidence||'').trim().replace(/\\s*\\n\\s*/g,'; ');", "if(a.status==='C'){let f=ddAfirma(q),ev=String(a.evidence||'').trim().replace(/\\s*\\n\\s*/g,'; ');if(ev)evsC.push(ev.replace(/\\.$/,''));{const ck=(state.checklists||{})[q.id],cl=Array.isArray(ck)?ck:ddLista(ck);if(cl.length){const it='itens verificados: '+ddJoin(cl.map(ddLc));evsC.push(it);ev=[ev.replace(/\\.$/,''),it].filter(Boolean).join('; ')}}", 'atacadista: evidência de Cumpre guardada');
  return trocaEm(s, "const corpo=manual?ddParas(manual):frases.length?[frases.join(' ')]:[];",
    "const evsFora=evsC.filter(e=>!manual.includes(e)),corpo=manual?ddParas(manual).concat(evsFora.length?['Evidências registradas nas verificações: '+ddJoin(evsFora)+'.']:[],naF.length?[naF.join(' ')]:[]):frases.length?[frases.join(' ')]:[];", 'atacadista: descrição + evidências');
});

/* 7m. Atacadista — campos da etapa 1 e do roteiro que não chegavam ao Anexo I
   (varredura de 01/10/2026): validade da licença; processo, classe, situação na
   fonte oficial e atividades da AFE/AE; processo SEI; pessoas contatadas; CRT e
   AVCB completos (ramo, RTs, horários, órgão emissor, mesmo sem “situação”);
   finalidade e pior caso da qualificação térmica; dados do documento de
   expedição conferido. Itens 5 e 6 escritos à mão: o que a etapa 1 registrou e
   não está no texto vem logo abaixo (ddFaltantes). */
blocoAltera('app--distribuidoras-transportadoras', s => {
  s = trocaEm(s, "function ddItemNodes(item,ctx){",
    "function ddFaltantes(manual,rasc){const nz=t=>String(t||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/\\s+/g,' ').trim(),M=nz(manual);return String(rasc||'').split(/\\n+|(?<=\\.)\\s+(?=[A-ZÀ-Ú])/).map(x=>x.trim()).filter(x=>x&&!M.includes(nz(x).slice(0,40))).join(' ')}"
    + "function ddDocExped(d){if(!d)return '';const L=[['DANFE / nota fiscal nº ',d.danfe],['emitida em ',ddData(d.issueDate)],['expedida em ',ddData(d.dispatchDate)],['emitente: ',d.issuer],['remetente: ',d.sender],['destinatário: ',d.recipient],['transportador: ',d.transporter],['motorista: ',d.driver],['ordem de entrega: ',d.order],['veículo: ',d.vehicle],['instrumento de monitoramento: ',d.instrument]].filter(x=>ddTem(x[1])).map(x=>x[0]+String(x[1]).trim());const IT={q245:'data da expedição ou do recebimento',q246:'transportador',q247:'motorista',q248:'destinatário',q249:'medicamento e apresentação',q250:'quantidade, lote e validade',q251:'condições de transporte e veículo',q252:'ordem de entrega',q253:'nota fiscal ou DANFE',q254:'lotes na nota fiscal'},cf=Object.keys(d.items||{}).filter(k=>d.items[k]&&IT[k]).map(k=>IT[k]);if(cf.length)L.push('dados conferidos: '+ddJoin(cf));return L.length?'Documento de expedição conferido — '+L.join('; ')+'.':''}"
    + "function ddItemNodes(item,ctx){", 'atacadista: auxiliares');
  s = trocaEm(s, "const fotos=ctx.fotosQ[q.id]||[],ref=", "if(a.document&&typeof a.document==='object'){const dx=ddDocExped(a.document);if(dx){frases.push(dx);naF.push(dx);alguma=true;todasNA=false}}const fotos=ctx.fotosQ[q.id]||[],ref=", 'atacadista: documento de expedição');
  s = trocaEm(s, "['   Data: ',{b:true}],[semLic?'—':(ddData(lic.date)||'—'),{}],", "['   Data: ',{b:true}],[semLic?'—':(ddData(lic.date)||'—'),{}],...(!semLic&&ddTem(lic.validity)?[['   Validade: ',{b:true}],[ddData(lic.validity)||lic.validity,{}]]:[]),", 'atacadista: validade da licença');
  const det = v => "{const x="+v+"||{},dd=[ddTem(x.process)&&'processo '+x.process,ddTem(x.class)&&'classe '+x.class,ddTem(x.statusOfficial)&&'situação na fonte oficial: '+x.statusOfficial,ddTem(x.activities)&&'atividades autorizadas: '+String(x.activities).replace(/\\s*\\n\\s*/g,'; ')].filter(Boolean);if(dd.length)nodes.push({k:'p',ind:360,t:ddFim(dd.join('; ').replace(/^./,c=>c.toUpperCase()))})}";
  s = trocaEm(s, "[R.afeRe?' (RE nº '+R.afeRe+')':'',{}],['.',{}]]});", "[R.afeRe?' (RE nº '+R.afeRe+')':'',{}],['.',{}]]});" + det('af'), 'atacadista: detalhes da AFE');
  s = trocaEm(s, "[R.aeRe?' (RE nº '+R.aeRe+')':'',{}],['.',{}]]});", "[R.aeRe?' (RE nº '+R.aeRe+')':'',{}],['.',{}]]});" + det('ae'), 'atacadista: detalhes da AE');
  s = trocaEm(s, "const primeira=m.first==='Sim'||R.primeira==='Sim';", "if(ddTem(m.process))kv('Processo SEI / solicitação',m.process);const primeira=m.first==='Sim'||R.primeira==='Sim';", 'atacadista: processo SEI');
  s = trocaEm(s, "rows:[['Nome','Cargo','Contato']].concat(cont.length?cont.map(x=>[x.name,x.role||'',x.contact||'']):[['','','']])});",
    "rows:[['Nome','Cargo','Contato']].concat(cont.length?cont.map(x=>[x.name,x.role||'',x.contact||'']):[['','','']])});if(ddTem(m.contactInspection))p('Pessoas contatadas nesta inspeção: '+ddFim(m.contactInspection));", 'atacadista: pessoas contatadas');
  s = trocaEm(s, "if(D.crt&&D.crt.status)docs.push('Certidão de regularidade técnica: '+ddLc(D.crt.status)+(D.crt.number?' (nº '+D.crt.number+(D.crt.validity?', validade '+D.crt.validity:'')+')':''));if(D.avcb&&D.avcb.status)docs.push('AVCB/CLCB: '+ddLc(D.avcb.status)+(D.avcb.number?' (nº '+D.avcb.number+(D.avcb.validity?', validade '+D.avcb.validity:'')+')':''));",
    "{const c=D.crt||{},a=D.avcb||{},dc=[ddTem(c.number)&&'nº '+c.number,ddTem(c.validity)&&'validade '+(ddData(c.validity)||c.validity),ddTem(c.activity)&&'ramo de atividade: '+c.activity,ddTem(c.technical)&&'responsáveis técnicos: '+String(c.technical).replace(/\\s*\\n\\s*/g,'; '),ddTem(m.crtSchedule)&&'horários: '+m.crtSchedule].filter(Boolean),da=[ddTem(a.number)&&'nº '+a.number,ddTem(a.validity)&&'validade '+(ddData(a.validity)||a.validity),ddTem(a.issuer)&&'emitido por '+a.issuer].filter(Boolean);"
    + "if(ddTem(c.status)||dc.length)docs.push('Certidão de regularidade técnica'+(ddTem(c.status)?': '+ddLc(c.status):'')+(dc.length?' ('+dc.join('; ')+')':''));if(ddTem(a.status)||da.length)docs.push('AVCB/CLCB'+(ddTem(a.status)?': '+ddLc(a.status):'')+(da.length?' ('+da.join('; ')+')':''))}", 'atacadista: CRT e AVCB completos');
  s = trocaEm(s, "tq.map(x=>[x.kind||'',x.identification||'',x.document||'',ddData(x.date),x.range||'',[x.result,x.observations].filter(ddTem).join(' — ')])",
    "tq.map(x=>[[x.kind,x.purpose].filter(ddTem).join(' — '),x.identification||'',x.document||'',ddData(x.date),x.range||'',[x.result,ddTem(x.risk)?'pior caso: '+x.risk:'',x.observations].filter(ddTem).join(' — ')])", 'atacadista: finalidade e pior caso');
  return s;
});

/* 7n. Manipulação — dados registrados que não chegavam ao relatório (varredura
   de 01/10/2026): campos da qualificação da exaustão (8.1) e outros quadros de
   campos; opções marcadas em venda remota (meios, produtos, exigências) e
   “Outros”; laboratório contratado (nome, CNPJ, REBLAS, contrato); fabricante de
   matéria-prima vegetal e de embalagem e certificado da embalagem; observação das
   planilhas sem status marcado; POPs com número/data sem status; dados do
   documento também em Não cumpre e Não se aplica; filiais; “Outra não
   conformidade” escrita sem o botão Irregular. */
blocoAltera('app--farmacia-manipulacao', s => {
  s = trocaEm(s, "if(comp.t==='lab'){}",
    "if(comp.t==='lab'&&e===Object.values(APP_DATA.cards).flatMap(c=>c.extraItems||[]).find(x=>x.c&&x.c.t==='lab')){const l=v.fields.lab||{},ps=[l.nome&&'laboratório '+l.nome,l.cnpj&&'CNPJ '+l.cnpj,l.reblas&&'habilitação REBLAS nº '+l.reblas,l.contrato&&'contrato válido até '+manData(l.contrato)].filter(Boolean);if(ps.length)corpo+='<p>Laboratório contratado para o monitoramento: '+esc(ps.join('; '))+'.</p>'}"
    + "if(comp.t==='fields'){const fv=v.fields[iid]||{},ps=comp.f.map(([l])=>{const x=String(fv[v2Slug(l)]||'').trim();return x?l+': '+(/^\\d{4}-\\d{2}-\\d{2}$/.test(x)?manData(x):x):''}).filter(Boolean);if(ps.length)corpo+='<p>'+esc(ps.join('; '))+'.</p>'}"
    + "if(comp.t==='chips'){const k=v2Slug(comp.title),ch=(v.chips[iid]||{})[k]||{},sel=comp.opts.filter(o=>ch[o]),ou=String((v.fields[iid]||{})[k+'-outros']||'').trim();if(sel.length||ou)corpo+='<p>'+esc(comp.title+': '+v2Join(sel.map(v2Lc).concat(ou?[ou]:[]))+'.')+'</p>'}", 'manipulação: fields, chips e laboratório');
  s = trocaEm(s, "corpo+='<p>Matéria-prima vegetal '+esc(d.prod||'')+(d.lote?' (lote '+esc(d.lote)+')':'')", "corpo+='<p>Matéria-prima vegetal '+esc(d.prod||'')+(d.lote?' (lote '+esc(d.lote)+')':'')+(d.fab?', fabricante '+esc(d.fab):'')", 'manipulação: fabricante MP vegetal');
  s = trocaEm(s, "corpo+='<p>Embalagem '+esc(d.prod||'')+(d.lote?' (lote '+esc(d.lote)+')':'')", "corpo+='<p>Embalagem '+esc(d.prod||'')+(d.lote?' (lote '+esc(d.lote)+')':'')+(d.fab?', fabricante '+esc(d.fab):'')+(!d.cq&&d.cert?', certificado '+esc(d.cert):'')", 'manipulação: fabricante e certificado da embalagem');
  s = trocaEm(s, "if(fc.sistema)ptxt+=' Sistema informatizado: '+fc.sistema+'.';", "if(fc.sistema)ptxt+=' Sistema informatizado: '+fc.sistema+'.';if(fc.filiais)ptxt+=' Filiais: '+fc.filiais+'.';if((c.areas||[]).length)ptxt+=' Áreas existentes: '+v2Join(c.areas.map(a=>{const x=AREAS_LIST.find(y=>y[0]===a);return v2Lc(x?x[1]:a)}))+'.';", 'manipulação: filiais e áreas');
  s = trocaEm(s, "+(falta?' Apresentadas '+rows.length+' de '+comp.n+' análises exigidas'+v2Mk(falta)+'.':'')+'</p>';",
    "+(falta?' Apresentadas '+rows.length+' de '+comp.n+' análises exigidas'+v2Mk(falta)+'.':'')+'</p>';{const MCK=['Periodicidade atendida','Rodízio de manipuladores, fármacos e dosagens','Laudos arquivados','Metodologia e especificação farmacopeica'],mk=MCK.filter((_,i)=>(d.chk||{})[i]),mn=MCK.filter((_,i)=>!(d.chk||{})[i]);if(mk.length)corpo+='<p>Conferido: '+esc(v2Join(mk.map(v2Lc)))+'.'+(mn.length?' Não conferido: '+esc(v2Join(mn.map(v2Lc)))+'.':'')+'</p>'}", 'manipulação: conferências do monitoramento');
  s = trocaEm(s, "if(d&&d.status)pops.push([row.name,d.nr||'',manData(d.date),d.status])", "if(d&&(d.status||d.nr||d.date))pops.push([row.name,d.nr||'',manData(d.date),d.status||'situação não marcada'])", 'manipulação: POP sem status');
  s = trocaEm(s, "if(!com.length&&!par.length&&!nao.length)continue;", "if(!com.length&&!par.length&&!nao.length){if(v.obs['plan-'+g])partes.push(esc(t+': '+String(v.obs['plan-'+g]).trim().replace(/\\.?$/,'.')));continue}", 'manipulação: observação de planilha');
  s = trocaEm(s, "else if(a.status==='NC'){if(q.informativo)frases.push(esc(q.neg));else{const k=addIrr(v2ItemTitulo(iid)+': '+q.neg+(a.evidence&&a.evidence.trim()?",
    "else if(a.status==='NC'){const dtn=v2DocTxt(q.id);if(q.informativo)frases.push(esc(q.neg));else{const k=addIrr(v2ItemTitulo(iid)+': '+q.neg+(dtn?' Documento: '+dtn+'.':'')+(a.evidence&&a.evidence.trim()?", 'manipulação: documento em Não cumpre');
  s = trocaEm(s, "else if(a.status==='NA'&&evx){frases.push(esc('Não se aplica ('+evx+'): '",
    "else if(a.status==='NA'&&(evx||v2DocTxt(q.id))){frases.push(esc('Não se aplica ('+[evx,v2DocTxt(q.id)].filter(Boolean).join('; ')+'): '", 'manipulação: documento em Não se aplica');
  const n = s.split("d.xI==='I'&&d.outra").length - 1;
  if (n !== 2) throw Error('manipulação: outra irregularidade — esperava 2, achei ' + n);
  return s.split("d.xI==='I'&&d.outra").join("d.outra&&String(d.outra).trim()");
});

/* 7o. Drogaria — identificação (varredura de 01/10/2026): “Atividades constantes
   da licença” (meta.atividade_licenciada, uma por linha) e CNAE não saíam; com o
   endereço completo preenchido, bairro, município, UF e CEP digitados à parte
   eram ignorados — agora entram os que não estiverem no endereço. */
blocoAltera('rec--drogaria-report-final.js', s => {
  s = trocaEm(s, "address=text(m.endereco_completo)||join([m.endereco,m.endereco_numero,m.complemento,m.bairro,m.municipio,m.estado,m.cep]);",
    "address=text(m.endereco_completo)?join([text(m.endereco_completo)].concat([m.bairro,m.municipio,m.estado,m.cep].filter(x=>text(x)&&!String(m.endereco_completo).toLowerCase().includes(String(x).trim().toLowerCase())))):join([m.endereco,m.endereco_numero,m.complemento,m.bairro,m.municipio,m.estado,m.cep]);", 'drogaria: endereço + componentes');
  s = trocaEm(s, "kv(B,'Atividades licenciadas',(s.fields?.atividades_licenciadas||[]).join('; '));",
    "kv(B,'Atividades licenciadas',[...new Set((s.fields?.atividades_licenciadas||[]).concat(String(m.atividade_licenciada||'').split(/\\n+/).map(x=>x.trim()).filter(Boolean)))].join('; '));if(text(m.cnae))kv(B,'CNAE',m.cnae);", 'drogaria: atividades da licença e CNAE');
  /* Word: as seções refeitas a partir das respostas (SNGPC, estoque, resíduos…) usam
     só a frase da resposta e perdiam a “Observação factual”. Conferência final: toda
     observação registrada que não estiver no texto entra antes do item 11. */
  s = trocaEm(s, "x9(B,s);B.push(...(C['10']||[]));",
    "x9(B,s);B.push(...(C['10']||[]));{const J=JSON.stringify(B),obs=(base.records||[]).filter(r=>text(r.observacao)&&!J.includes(JSON.stringify(String(r.observacao).trim()).slice(1,-1).slice(0,60)));if(obs.length){p(B,'Observações registradas nas verificações:');obs.forEach(r=>B.push({t:'num',n:'•',x:[r.grupo,r.contexto].filter(x=>text(x)).filter((x,i,a)=>a.indexOf(x)===i).join(' — ')+(r.grupo||r.contexto?': ':'')+String(r.observacao).trim()}))}}", 'drogaria: observações no Word');
  return s;
});

/* 7p. Evidência digitada em pergunta sem situação marcada (nem Cumpre, nem Não
   cumpre, nem Não se aplica): Atacadista e Manipulação descartavam o texto. Agora
   sai como “Sem situação marcada — pergunta: anotação”, para a equipe ver na
   prévia e decidir antes de emitir. */
blocoAltera('app--distribuidoras-transportadoras', s => trocaEm(s, "else if(a.status==='NA'){const ev=String(a.evidence",
  "else if(!a.status){const ev=String(a.evidence||'').trim().replace(/\\s*\\n\\s*/g,'; ').replace(/\\.$/,''),ck=(state.checklists||{})[q.id],cl=Array.isArray(ck)?ck:ddLista(ck),tx=[ev,cl.length?'itens verificados: '+ddJoin(cl.map(ddLc)):''].filter(Boolean).join('; ');if(tx){const nf='Sem situação marcada — '+String(q.text||'').replace(/\\s*\\?\\s*$/,'')+': '+tx+'.';frases.push(nf);naF.push(nf)}}"
  + "else if(a.status==='NA'){const ev=String(a.evidence", 'atacadista: anotação sem situação'));
blocoAltera('app--farmacia-manipulacao', s => trocaEm(s, "else if(a.status==='NC'){const dtn=v2DocTxt(q.id);",
  "else if(!a.status&&(evx||v2DocTxt(q.id))){frases.push(esc('Sem situação marcada — '+String(q.text||q.pos).replace(/\\s*\\?\\s*$/,'')+': '+[evx,v2DocTxt(q.id)].filter(Boolean).join('; ')+'.'))}"
  + "else if(a.status==='NC'){const dtn=v2DocTxt(q.id);", 'manipulação: anotação sem situação'));

/* 7q. Central — consulta por CNPJ: os grupos eram ordenados pela quantidade, e numa
   indústria os centenas de registros de produto empurravam a AFE/AE para o fim.
   Agora AFE/AE vem sempre primeiro e aberta; dentro dela, ativas antes das
   canceladas, classe de medicamento e insumo antes das demais, AFE antes de AE.
   Os outros grupos seguem pela quantidade, com os registros ativos antes dos
   inativos ou cancelados. */
blocoAltera('app--central-consultas', s => {
  s = trocaEm(s, "const bases=[...porBase.entries()].sort((a,b)=>b[1].length-a[1].length);",
    "const prio=b=>b==='afe_ae'?0:1,ordAfe=x=>[/^(sim|s|ativ)/i.test(String(x.ativo||x.situacao||''))?0:1,/medicament/i.test(x.classe||'')?0:/insumo/i.test(x.classe||'')?1:2,String(x.tipo||'').toUpperCase()==='AFE'?0:1];"
    + "if(porBase.has('afe_ae'))porBase.get('afe_ae').sort((a,b)=>{const p=ordAfe(a),q=ordAfe(b);for(let k=0;k<p.length;k++)if(p[k]!==q[k])return p[k]-q[k];return 0});"
    + "if(!kind){const inat=x=>/^(inativ|cancel|vencid|caduc|n$|não)/i.test(String(x.situacao||x.ativo||'').trim())?1:0;for(const [k,l] of porBase)if(k!=='afe_ae')l.sort((a,b)=>inat(a)-inat(b))}"
    + "const bases=[...porBase.entries()].sort((a,b)=>prio(a[0])-prio(b[0])||b[1].length-a[1].length);", 'central: AFE/AE primeiro');
  return trocaEm(s, "const aberto=(bases.length===1||lista.length<=6||i===0)?' open':'';",
    "const aberto=(bases.length===1||lista.length<=6||i===0||b==='afe_ae')?' open':'';", 'central: AFE/AE aberta');
});

/* 7s. Anotação da equipe (digitada ou ditada) sai como frase própria logo após a
   constatação, sem parênteses (pedido de 01/10/2026). O documento apresentado
   continua identificado entre parênteses, como antes. */
const CAP = "(t=>t?' '+t.charAt(0).toUpperCase()+t.slice(1).replace(/\\.?$/,'.'):'')";
blocoAltera('app--farmacia-manipulacao', s => {
  s = trocaEm(s, "frases.push(esc(par?q.pos.replace(/\\.$/,'')+' ('+par+').':q.pos))}",
    "frases.push(esc((dt?q.pos.replace(/\\.$/,'')+' ('+dt+').':q.pos)+" + CAP + "(evx)))}", 'manipulação: anotação do Cumpre sem parênteses');
  return trocaEm(s, "frases.push(esc('Não se aplica ('+[evx,v2DocTxt(q.id)].filter(Boolean).join('; ')+'): '+q.pos.charAt(0).toLowerCase()+q.pos.slice(1).replace(/\\.?$/,'.')))}",
    "frases.push(esc('Não se aplica: '+q.pos.charAt(0).toLowerCase()+q.pos.slice(1).replace(/\\.?$/,'.')+(v2DocTxt(q.id)?' Documento: '+v2DocTxt(q.id)+'.':'')+" + CAP + "(evx)))}", 'manipulação: anotação do Não se aplica sem parênteses');
});
blocoAltera('app--distribuidoras-transportadoras', s => {
  s = trocaEm(s, "if(ev&&ev.length<=180)f=f.replace(/\\.$/,'')+' ('+ev.replace(/\\.$/,'')+').';else if(ev)f+=' '+ddFim('Constatação: '+ev);",
    "if(ev)f=f.replace(/\\.?$/,'.')+" + CAP + "(ev.replace(/\\.$/,''));", 'atacadista: anotação do Cumpre sem parênteses');
  return trocaEm(s, "const nf='Não se aplica ('+ev+'): '+ddLc(ddAfirma(q)).replace(/\\.?$/,'.');",
    "const nf='Não se aplica: '+ddLc(ddAfirma(q)).replace(/\\.?$/,'.')+" + CAP + "(ev);", 'atacadista: anotação do Não se aplica sem parênteses');
});

/* 7t. Drogaria — perguntas que faltavam para autuar (medicamentos/drogaria-lacunas.js),
   entram no catálogo ao carregar, logo depois do ajuste padrão do catálogo. */
blocoAltera('app--drogaria', s => {
  s = trocaEm(s, 'async function loadBank(){', le('drogaria-lacunas.js').replace(/<\/script/gi, '<\\/script') + '\nasync function loadBank(){', 'drogaria: lacunas — definição');
  return trocaEm(s, "normalizeDrogariaCatalog();if(catalog.schema", "normalizeDrogariaCatalog();try{__medLacunasDrogaria(catalog)}catch(e){console.error(e)}if(catalog.schema", 'drogaria: lacunas — chamada');
});

/* 7u. Drogaria — lacunas nas telas próprias (serviços, documentos de qualidade
   e venda remota não mostram perguntas do catálogo). A do art. 61, § 5º fica
   sempre visível: o serviço vedado pode existir mesmo quando se responde que o
   estabelecimento não realiza serviços farmacêuticos. */
const R44 = (a, p) => 'rdc-44-2009::artigo::' + a + (p ? '::paragrafo::' + p : '');
const qD = (k, rot, ref, lbl, ajuda) => "+question(n,'" + k + "','" + rot + "',['" + ref + "','" + lbl + "'],false)" +
  (ajuda ? "+'<p class=\"muted\">" + ajuda + "</p>'" : '');
blocoAltera('rec--drogaria-servicos-documentos.js', s => {
  s = trocaEm(s, "question(n,'realiza','O estabelecimento realiza serviços farmacêuticos?',null,true)",
    "question(n,'realiza','O estabelecimento realiza serviços farmacêuticos?',null,true)" +
    qD('nao_abrangido', 'A farmácia presta apenas serviços abrangidos pela RDC 44/2009, sem usar dependência como consultório ou para fim diverso do licenciado?', R44(61, 5), 'RDC 44/2009, art. 61, §§ 3º e 5º',
      'Serviços da RDC 44/2009 (art. 61, §§ 1º e 2º): atenção farmacêutica, inclusive domiciliar; aferição de parâmetros fisiológicos e bioquímicos; administração de medicamentos; perfuração do lóbulo auricular. Procedimentos estéticos, consultas de outras profissões e outros serviços são vedados (§ 5º).'),
    'drogaria: art. 61 § 5º');
  s = trocaEm(s, "question(n,'rede_publica','Mantém lista atualizada de estabelecimentos públicos de saúde próximos.',['rdc-44-2009::artigo::62','RDC 44/2009, art. 62'],false)",
    "question(n,'rede_publica','Mantém lista atualizada de estabelecimentos públicos de saúde próximos.',['rdc-44-2009::artigo::62','RDC 44/2009, art. 62'],false)" +
    qD('param_conduta', 'Na aferição de parâmetros, havendo discrepância, o usuário é orientado a procurar assistência médica, sem indicação ou alteração de medicamentos pela farmácia?', R44(69, 3), 'RDC 44/2009, art. 69, §§ 3º e 4º') +
    qD('sigilo', 'Os dados dos usuários e dos serviços prestados recebem tratamento sigiloso, sem uso para propaganda ou indução de consumo?', R44(82), 'RDC 44/2009, art. 82; art. 59, parágrafo único') +
    qD('farmacovig', 'O farmacêutico notifica às autoridades sanitárias (Notivisa) os eventos adversos e as queixas técnicas?', R44(67), 'RDC 44/2009, art. 67'),
    'drogaria: serviços — conduta, sigilo, farmacovigilância');
  s = trocaEm(s, "question(n,'treinamentos','O estabelecimento mantém registros de treinamentos de pessoal conforme RDC 44/2009?',['rdc-44-2009::artigo::28','RDC 44/2009, art. 28'],false)",
    "question(n,'treinamentos','O estabelecimento mantém registros de treinamentos de pessoal conforme RDC 44/2009?',['rdc-44-2009::artigo::28','RDC 44/2009, art. 28'],false)" +
    qD('treino_epi', 'Há registro de treinamento inicial e continuado de todo o pessoal (inclusive limpeza) sobre autocuidado, uso e descarte de EPI e conduta em acidentes?', R44(25), 'RDC 44/2009, arts. 25 a 27') +
    qD('guarda_5anos', 'A documentação é mantida no estabelecimento por, no mínimo, 5 anos, à disposição da vigilância sanitária?', R44(89), 'RDC 44/2009, art. 89'),
    'drogaria: documentos — EPI, guarda');
  return trocaEm(s, "['portaria-svs-ms-344-1998::artigo::34-b::paragrafo::1','Portaria 344/98, art. 34-B, § 1º; RDC 44/2009, art. 53'],false):'')",
    "['portaria-svs-ms-344-1998::artigo::34-b::paragrafo::1','Portaria 344/98, art. 34-B, § 1º; RDC 44/2009, art. 53'],false)" +
    qD('site_afe', 'O endereço do sítio eletrônico consta da AFE expedida pela Anvisa, e o site não faz propaganda de medicamentos sob prescrição nem usa listas de preços com apelo publicitário?', R44(55), 'RDC 44/2009, arts. 54 e 55') + ":'')",
    'drogaria: venda remota — site na AFE');
});
blocoAltera('rec--drogaria-report-final.js', s => {
  const L = (k, ph, rf) => "['" + k + "','" + ph + "'," + JSON.stringify(rf).replace(/"/g, "'") + "]";
  s = trocaEm(s, "const sv=sec(s,'servicos_farmaceuticos'),SA=sv.answers||{};if(yes(SA.realiza)){const SR=[",
    "const sv=sec(s,'servicos_farmaceuticos'),SA=sv.answers||{};if(no(SA.nao_abrangido))addIssue(out,'final_serv_nao_abrangido',5,'Serviços farmacêuticos','A farmácia presta serviço não abrangido pela RDC 44/2009, ou usa dependência como consultório ou para fim diverso do licenciado.'," +
    JSON.stringify([R44(61, 5), R44(61, 3)]).replace(/"/g, "'") + ");if(yes(SA.realiza)){const SR=[" +
    L('param_conduta', 'Na aferição de parâmetros, a farmácia indica ou altera medicamentos com base nos valores encontrados, ou não orienta o usuário a procurar assistência médica.', [R44(69, 3), R44(69, 4)]) + ',' +
    L('sigilo', 'Os dados dos usuários ou dos serviços prestados não recebem tratamento sigiloso, ou são usados para propaganda ou indução de consumo.', [R44(82), R44(59, 'unico')]) + ',' +
    L('farmacovig', 'Não há notificação às autoridades sanitárias dos eventos adversos e das queixas técnicas.', [R44(67)]) + ',',
    'drogaria relatório: serviços novos');
  s = trocaEm(s, "const ql=sec(s,'documentos_qualidade');",
    "const ql=sec(s,'documentos_qualidade');if(no(ql.answers?.treino_epi))addIssue(out,'final_q_treino_epi',6,'8.1 Documentos de qualidade','Não há registro de treinamento do pessoal sobre autocuidado, uso e descarte de EPI e conduta em acidentes.'," +
    JSON.stringify([R44(25), R44(26), R44(27)]).replace(/"/g, "'") + ");if(no(ql.answers?.guarda_5anos))addIssue(out,'final_q_guarda',6,'8.1 Documentos de qualidade','A documentação não é mantida no estabelecimento pelo prazo mínimo de 5 anos.'," +
    JSON.stringify([R44(89)]).replace(/"/g, "'") + ");", 'drogaria relatório: EPI, guarda');
  s = trocaEm(s, "const rm=sec(s,'documentos_remota');",
    "const rm=sec(s,'documentos_remota');if(no(rm.answers?.site_afe))addIssue(out,'final_remota_site_afe',6,'8.3 Solicitação remota','O endereço do sítio eletrônico não consta da Autorização de Funcionamento, ou o site faz propaganda de medicamentos sob prescrição ou usa listas de preços com apelo publicitário.'," +
    JSON.stringify([R44(55), R44(54)]).replace(/"/g, "'") + ");", 'drogaria relatório: site na AFE');
  return trocaEm(s, "['rede_publica','Mantém lista atualizada de estabelecimentos públicos de saúde próximos.','Não mantém lista atualizada de estabelecimentos públicos de saúde próximos.'],",
    "['rede_publica','Mantém lista atualizada de estabelecimentos públicos de saúde próximos.','Não mantém lista atualizada de estabelecimentos públicos de saúde próximos.']," +
    "['nao_abrangido','Presta apenas serviços abrangidos pela RDC 44/2009.','Presta serviço não abrangido pela RDC 44/2009 ou usa dependência para fim diverso do licenciado.']," +
    "['param_conduta','Na aferição de parâmetros, havendo discrepância, orienta o usuário a procurar assistência médica.','Na aferição de parâmetros, indica ou altera medicamentos, ou não orienta a procura de assistência médica.']," +
    "['sigilo','Os dados dos usuários recebem tratamento sigiloso.','Os dados dos usuários não recebem tratamento sigiloso.']," +
    "['farmacovig','Notifica eventos adversos e queixas técnicas às autoridades sanitárias.','Não notifica eventos adversos e queixas técnicas às autoridades sanitárias.'],",
    'drogaria relatório: narrativa dos serviços');
});

/* 7v. Drogaria — Lei Municipal 13.725/2004, art. 90 (Cadastro Municipal de
   Vigilância em Saúde antes de iniciar a atividade) e § 1º (comunicar inclusão
   de atividades e alterações) nas infrações de licença. Texto do site oficial
   da Prefeitura (legislacao.prefeitura.sp.gov.br), consultado em 04/10/2026; o
   banco embutido da drogaria só trazia os arts. 46 e 50. */
const LM = p => 'lei-municipal-13725-2004::artigo::90' + (p ? '::paragrafo::' + p : '');
blocoAltera('app--drogaria', s => catalogoDrogaria(s, visa => {
  const cat = visa['roteiros/drogaria.json'], lm = visa['legislacao_v12/normas/lei-municipal-13725-2004.json'];
  const base = cat.referencias['lei-municipal-13725-2004::artigo::46'];
  const nos = [
    [LM(), 'artigo', '90', 'Art. 90', 'Todos os estabelecimentos de interesse da saúde e os estabelecimentos comerciais, de produção, embalagem e manipulação de produtos e substâncias de interesse da saúde, antes de iniciarem suas atividades, devem encaminhar à autoridade sanitária declaração de que suas atividades, instalações, equipamentos e recursos humanos obedecem à legislação sanitária vigente, para fins de obtenção do Cadastro Municipal de Vigilância em Saúde.'],
    [LM(1), 'paragrafo', '1', '§ 1º do art. 90', 'Os estabelecimentos devem comunicar à autoridade sanitária competente as modificações nas instalações e equipamentos, bem como a inclusão de atividades e quaisquer outras alterações que repercutam na identidade, qualidade e segurança dos produtos ou serviços oferecidos à população.']];
  for (const [id, tipo, numero, rotulo, texto] of nos) {
    if (!lm.nos.some(n => n.id === id)) lm.nos.push({id, norma: lm.norma, anexo: null, tipo, numero, rotulo, texto, ordem: 0, estrutural: false, status_vigencia: 'vigente'});
    cat.referencias[id] ??= {...base, id, dispositivo: tipo === 'artigo' ? 'Art. 90' : 'Art. 90, § 1º'};
  }
  const q = cat.perguntas.find(x => x.id === 'doc_lfs');
  if (q && !q.refs.includes(LM())) { q.refs.push(LM()); q.norma.push('Lei Municipal 13.725/2004'); q.dispositivo.push('Art. 90'); }
}));
blocoAltera('rec--drogaria-report-final.js', s => {
  const troca = (de, rotulo) => { s = trocaEm(s, de, de.replace(/\]\);$/, ",'" + LM() + "','" + LM(1) + "']);"), rotulo); };
  troca("'Os dados e atividades observados não correspondem à licença sanitária.',[\"rdc-44-2009::artigo::90\"]);".replace(/\]\);$/, ']);'), 'drogaria: lic_match + Lei 13.725');
  troca("['rdc-44-2009::artigo::61::paragrafo::3','rdc-197-2017::artigo::4']);", 'drogaria: vacinação sem licença + Lei 13.725');
  troca("['rdc-44-2009::artigo::61::paragrafo::3','rdc-978-2025::artigo::63']);", 'drogaria: EAC sem licença + Lei 13.725');
  troca("'A solicitação remota para dispensação não consta da licença sanitária do estabelecimento.',['rdc-44-2009::artigo::52','rdc-44-2009::artigo::61::paragrafo::3']);", 'drogaria: remota sem licença + Lei 13.725');
  return trocaEm(s, "['licenca','Os serviços farmacêuticos prestados não estão indicados na licença sanitária.',['rdc-44-2009::artigo::61::paragrafo::3']]",
    "['licenca','Os serviços farmacêuticos prestados não estão indicados na licença sanitária.',['rdc-44-2009::artigo::61::paragrafo::3','" + LM(1) + "']]", 'drogaria: serviços sem licença + Lei 13.725');
});

/* 7w. Drogaria — dados registrados que não chegavam ao relatório (teste
   drogaria-relatorio, 17/10/2026): os pavimentos sumiam quando o tipo de imóvel
   não era escolhido (a frase “instalado em configuração não informada” é
   descartada), e as perguntas de 7u (treinamento sobre EPI, guarda por 5 anos,
   sítio eletrônico na AFE) só escreviam quando a resposta era “Não”. */
blocoAltera('rec--drogaria-report-final.js', s => {
  s = trocaEm(s, "let intro=`O estabelecimento está instalado em ${instal}`+(pav.length?` e conta com ${sentenceList(pav)}`:'')+'.';",
    "let intro=f.tipo_instalacao?`O estabelecimento está instalado em ${instal}`+(pav.length?` e conta com ${sentenceList(pav)}`:'')+'.':(pav.length?`O estabelecimento ocupa: ${sentenceList(pav)}.`:'');", 'drogaria: pavimentos sem tipo de imóvel');
  s = trocaEm(s, "p(B,intro);if(window.__drgSuperReport)", "if(intro.trim())p(B,intro.trim());if(window.__drgSuperReport)", 'drogaria: frase da área física');
  s = trocaEm(s, "yn(B,a,[['licenca_fornecedor',",
    "yn(B,a,[['treino_epi','Há registro de treinamento inicial e continuado do pessoal, inclusive da limpeza, sobre autocuidado, uso e descarte de EPI e conduta em acidentes.','Não há registro de treinamento do pessoal sobre autocuidado, uso e descarte de EPI e conduta em acidentes.'],"
    + "['guarda_5anos','A documentação é mantida no estabelecimento por, no mínimo, 5 anos, à disposição da vigilância sanitária.','A documentação não é mantida no estabelecimento pelo prazo mínimo de 5 anos.'],['licenca_fornecedor',", 'drogaria: 7u no texto da qualidade');
  return trocaEm(s, "yn(B,a,[['licenca','Possui licença sanitária para a oferta do serviço de venda remota.',",
    "yn(B,a,[['site_afe','O endereço do sítio eletrônico consta da Autorização de Funcionamento, e o site não faz propaganda de medicamentos sob prescrição nem usa listas de preços com apelo publicitário.','O endereço do sítio eletrônico não consta da Autorização de Funcionamento, ou o site faz propaganda de medicamentos sob prescrição ou usa listas de preços com apelo publicitário.'],['licenca','Possui licença sanitária para a oferta do serviço de venda remota.',", 'drogaria: 7u no texto da venda remota');
});

/* Catálogo igual ao do site Medicamentos: Drogaria (drogaria, EAC e vacinação),
   Farmácia com manipulação e Atacadista de medicamentos (distribuidora/
   transportadora e gases medicinais). EAC (Serviço Tipo I) e Vacinação são os
   mesmos roteiros do núcleo Serviços: rode antes repack-eac e repack-vacina.
   Gases medicinais: gases/roteiro.cjs no motor roteiro-simples. */
const C = require('./casca-apps.cjs');
const {pagina, gravaBloco} = require('./roteiro-simples-pagina.cjs');
for (const app of ['eac-tipo1', 'vacinacao']) if (!h.includes(`id="app--${app}"`)) throw Error(`falta o bloco app--${app}: rode antes repack-eac e repack-vacina`);
{
  const G = require(path.join(ROT, 'gases', 'roteiro.cjs'));
  const LEGAL = JSON.parse(fs.readFileSync(path.join(ROT, 'gases', 'legislacao.json'), 'utf8'));
  h = gravaBloco(h, lz, G.app, pagina(G, LEGAL, '#1F4E99', BLOCOS).html);
  h = C.registra(h, {app: G.app, titulo: G.titulo, nucleo: 'Medicamentos', store: G.store, icone: C.ICONES.cilindro});
}
h = C.grupo(h, 'grupo-drogaria', {titulo: 'Drogaria', itens: [
  ['Drogaria', 'Roteiro completo, inclusive drogaria em supermercado (marque em Área física › Informações gerais). A conferência de estoque já está dentro da inspeção.', 'drogaria'],
  ['Exames de análises clínicas (EAC)', 'Serviço Tipo I em farmácia e drogaria (RDC 978/2025). O mesmo roteiro do núcleo Serviços.', 'eac-tipo1'],
  ['Vacinação', 'Serviço de vacinação humana (RDC 197/2017). O mesmo roteiro do núcleo Serviços.', 'vacinacao']]});
h = C.grupo(h, 'grupo-atacadista', {titulo: 'Atacadista de medicamentos', itens: [
  ['Atacadista de medicamentos', 'Distribuidora e/ou transportadora (RDC 430/2020): escolha o tipo de operação na identificação.', 'distribuidoras-transportadoras'],
  ['Atacadista de gases medicinais', 'Distribuição, armazenagem, transporte e dispensação de gases medicinais (RDC 887/2024 e RDC 870/2024).', 'gases-medicinais']]});
h = C.icone(h, 'grupo-drogaria', C.ICONES.drogaria);
h = C.icone(h, 'grupo-atacadista', C.ICONES.atacadista);
h = C.catalogo(h, 'Medicamentos', [
  ['Drogaria', 'Drogaria (inclusive em supermercado), exames de análises clínicas e vacinação.', 'grupo-drogaria'],
  ['Farmácia com manipulação', 'Roteiro completo, inclusive preparações estéreis (marque Estéreis em Preparações, na caracterização): documentos, estoque e relatório (RDC 67/2007).', 'farmacia-manipulacao'],
  ['Atacadista de medicamentos', 'Distribuidora, transportadora e gases medicinais.', 'grupo-atacadista']]);
troca("'distribuidoras-transportadoras':{nome:'Distribuidora / transportadora',nucleo:'Medicamentos',", "'distribuidoras-transportadoras':{nome:'Atacadista de medicamentos',nucleo:'Medicamentos',", 'salvas atacadista');
/* EAC e Vacinação abrem nos dois núcleos: a cor segue o núcleo de onde o roteiro foi aberto */
troca("function temaApp(app){\n    var n = APP_NUCLEO[app];", "function temaApp(app){\n    var n = nucleoAtual || APP_NUCLEO[app];", 'cor do núcleo aberto');

fs.writeFileSync(FILE, h);
console.log('Núcleo Medicamentos: ajustes do site Medicamentos aplicados; catálogo com Drogaria, Manipulação e Atacadista.');
