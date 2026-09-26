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
troca('function contexto(){return ultimo&&ultimo.bs&&ultimo.bs.length?ultimo:null}',
  "function contexto(){return ultimo&&ultimo.bs&&ultimo.bs.length?ultimo:null}\n  document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('button');if(!b||b.closest('#n3-dock')||!/ir ao roteiro/i.test(b.textContent||''))return;setTimeout(function(){var ok=CFG.perfilPronto?!!CFG.perfilPronto():true;if(ok){estado.perfil=false;estado.bloco=null;estado.item=null;repintar();window.scrollTo(0,0)}},120)});", 'aplicar perfil');
/* 3. Textos: o que se define é o perfil do serviço. */
troca("Toque para incluir ou retirar atividades. O roteiro é montado a partir delas.", "O roteiro mostra só o que se aplica ao perfil escolhido.", 'ajuda do topo');
troca("✎ Alterar atividades", "✎ Alterar perfil", 'botão alterar');
troca("(CFG.nome||'Roteiro')+' · selecione as atividades'", "(CFG.nome||'Roteiro')+' · defina o perfil do serviço'", 'título do perfil');
troca("(pronto?'Atividades selecionadas':'Selecione as atividades para montar o roteiro')", "(pronto?'Perfil definido':'Defina o perfil para montar o roteiro')", 'barra inferior');
fs.writeFileSync(file, html);
console.log('Casca: navegação em três níveis ajustada.');
