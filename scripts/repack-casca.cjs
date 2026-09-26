'use strict';
/* Casca: ajustes idempotentes na camada de navegação em três níveis (n3),
   usada por Odontologia, Serviços de alimentação e Produtos.
   1. Perfil incompleto não salta sozinho para os blocos quando fica pronto:
      a tela permanece no perfil até “Abrir roteiro →”.
   Uso: node scripts/repack-casca.cjs */
const fs = require('node:fs'), path = require('node:path');
const file = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(file, 'utf8');
const troca = (de, para, rot) => { if (html.includes(para)) return; const n = html.split(de).length - 1; if (n !== 1) throw Error('Trecho ' + rot + ' encontrado ' + n + ' vezes'); html = html.replace(de, () => para); };
troca('var nivel1=estado.perfil||!perfilPronto;', 'if(!perfilPronto)estado.perfil=true;var nivel1=estado.perfil||!perfilPronto;', 'nível 1 do perfil');
troca('if(CFG.perfilPronto&&!CFG.perfilPronto()){aplicarVisual();', 'if(CFG.perfilPronto&&!CFG.perfilPronto()){estado.perfil=true;aplicarVisual();', 'perfil sem seções');
/* 2. Botões do próprio módulo que “vão ao roteiro” (ex.: “Aplicar perfil e ir ao roteiro”)
      passam a abrir os blocos, como o “Abrir roteiro →” da barra inferior. */
if (html.includes("!/ir ao roteiro/i.test(b.textContent||'')")) troca("!/ir ao roteiro/i.test(b.textContent||'')", "!/ir ao roteiro|iniciar verifica/i.test(b.textContent||'')", 'iniciar verificação');
troca('function contexto(){return ultimo&&ultimo.bs&&ultimo.bs.length?ultimo:null}',
  "function contexto(){return ultimo&&ultimo.bs&&ultimo.bs.length?ultimo:null}\n  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('button');if(!b||b.closest('#n3-dock')||!/ir ao roteiro|iniciar verifica/i.test(b.textContent||''))return;setTimeout(function(){var ok=CFG.perfilPronto?!!CFG.perfilPronto():true;if(ok){estado.perfil=false;estado.bloco=null;estado.item=null;repintar();window.scrollTo(0,0)}},120)});", 'aplicar perfil');
/* 3. Textos: o que se define é o perfil do serviço. */
troca("Toque para incluir ou retirar atividades. O roteiro é montado a partir delas.", "O roteiro mostra só o que se aplica ao perfil escolhido.", 'ajuda do topo');
troca("✎ Alterar atividades", "✎ Alterar perfil", 'botão alterar');
troca("(CFG.nome||'Roteiro')+' · selecione as atividades'", "(CFG.nome||'Roteiro')+' · defina o perfil do serviço'", 'título do perfil');
if (!html.includes("aplicavel?'Escolha o perfil")) troca("(pronto?'Atividades selecionadas':'Selecione as atividades para montar o roteiro')", "(pronto?'Perfil definido':'Defina o perfil para montar o roteiro')", 'barra inferior');
/* 4. Produtos: a trilha só está pronta quando o “Iniciar verificação” do módulo
      está habilitado; sem isso, marcar a primeira classe saltava para os blocos. */
troca("nome:'Produtos e correlatos',\n resumo:", "nome:'Produtos e correlatos',\n perfilPronto:function(){var s=document.querySelector('#panel-roteiro [data-start]');return !s||!s.disabled},\n resumo:", 'perfil pronto de produtos');
/* 5. Produtos: o bloco do distribuidor tinha 10 etapas misturando a trilha geral e a
      de dispositivos/IVD; vira dois blocos. Títulos sem prefixo repetido. */
/* (a divisão do bloco do distribuidor foi incorporada ao item 9) */
troca("tituloDaSecao:function(n){var h=n.querySelector('h3');return h?h.textContent.replace(/^\\s*\\d+\\.\\s*/,'').trim():n.id},\n progressoDaSecao:function(n){var p=n.querySelector('.section-head > span')", "tituloDaSecao:function(n){var h=n.querySelector('h3');return h?h.textContent.replace(/^\\s*(Atacadista|Fabricante|Transportadora)\\s*—\\s*/,'').replace(/^\\s*\\d+\\.\\s*/,'').replace(/\\s*—\\s*dispositivos\\/IVD\\s*$/,'').trim():n.id},\n progressoDaSecao:function(n){var p=n.querySelector('.section-head > span')", 'títulos de produtos');
/* 6. Serviços de alimentação: a regra que esconde a barra de atalhos das seções
      (“35 verificações para este perfil”) pegava também as opções do perfil
      (tipo, operação, processos): em “✎ Alterar perfil” não havia o que escolher. */
troca(" esconder:['.bloco > .chips'],\n mapaDeLinhas:", " esconder:['#p-roteiro > div > .bloco > .chips'],\n mapaDeLinhas:", 'chips do perfil de alimentação');
/* 7. “Abrir roteiro →” da barra inferior com o perfil escolhido mas não aplicado:
      aciona o botão do próprio módulo que aplica o perfil (“Aplicar perfil…”,
      “Iniciar verificação”), que em seguida abre os blocos. */
troca("function contexto(){return ultimo&&ultimo.bs&&ultimo.bs.length?ultimo:null}\n",
  "function contexto(){return ultimo&&ultimo.bs&&ultimo.bs.length?ultimo:null}\n  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('#n3-dock button');if(!b||!/Abrir roteiro/i.test(b.textContent||''))return;var ok=CFG.perfilPronto?!!CFG.perfilPronto():true;if(ok)return;var box=container();var ap=box&&[].filter.call(box.querySelectorAll('button'),function(x){return /aplicar perfil|iniciar verifica/i.test(x.textContent||'')&&!x.disabled})[0];if(ap){e.preventDefault();e.stopImmediatePropagation();ap.click()}},true);\n", 'abrir roteiro aplica o perfil');
/* 8. O botão só ficava habilitado com o perfil já aplicado; quando o módulo tem botão
      próprio de aplicar, fica habilitado (o item 7 aplica o perfil e abre os blocos). */
troca("var pronto=CFG.perfilPronto?!!CFG.perfilPronto():true;\n    if(nivel1){\n      escreve('<span>'+(pronto?'Perfil definido':'Defina o perfil para montar o roteiro')+'</span>'\n        +'<button type=\"button\" class=\"n3-principal\" data-n3-prox=\"roteiro\"'+(pronto?'':' disabled')+'>Abrir roteiro →</button>');",
  "var pronto=CFG.perfilPronto?!!CFG.perfilPronto():true;\n    var aplicavel=!pronto&&(function(){var box=container();return !!(box&&[].some.call(box.querySelectorAll('button'),function(x){return /aplicar perfil|iniciar verifica/i.test(x.textContent||'')&&!x.disabled}))})();\n    if(nivel1){\n      escreve('<span>'+(pronto?'Perfil definido':aplicavel?'Escolha o perfil e abra o roteiro':'Defina o perfil para montar o roteiro')+'</span>'\n        +'<button type=\"button\" class=\"n3-principal\" data-n3-prox=\"roteiro\"'+(pronto||aplicavel?'':' disabled')+'>Abrir roteiro →</button>');", 'botão habilitado com aplicar');
/* 9. Produtos: blocos da navegação conforme o roteiro revisado (scripts/produtos/revisao.py). */
{ const ini = "'produtos-correlatos':String.raw`", i = html.indexOf(ini); if (i < 0) throw Error('n3 de produtos');
  const b = html.indexOf(' blocos:[', i), f = html.indexOf('\n};`', b); if (b < 0 || f < 0) throw Error('blocos de produtos');
  const novo = " blocos:[['Licença e regularidade',['lic','reg']],\n  ['Fabricante — qualidade, pessoal e documentos',['f_gq','f_pes','f_saude','f_doc','f_rec','f_recolhe','f_auto']],\n  ['Fabricante — instalações, produção e controle',['f_inst','f_agua','f_arm','f_prod','f_cq']],\n  ['Distribuidor — recebimento, armazenamento e qualidade',['d_rec','d_arm','d_qual','d_pes']],\n  ['Distribuidor — dispositivos médicos e IVD (RDC 665/2022)',['d_sq','d_doc','d_inst','d_man','d_capa','d_at']],\n  ['Transportadora',['t_veic','t_temp','t_rast']]]";
  html = html.slice(0, b) + novo + html.slice(f); }
fs.writeFileSync(file, html);
console.log('Casca: navegação em três níveis ajustada.');
