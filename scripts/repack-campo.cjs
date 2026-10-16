'use strict';
/* Ferramentas de campo em todos os núcleos (pedido de 16/10/2026), as mesmas do
   site Medicamentos (cópias em campo/, mantidas iguais às de
   medicamentos/modulos/):
   - ditado.js: microfone em todas as caixas de texto (roteiros, Central,
     estoques e tela inicial);
   - foto-marca.js: data, hora e localização gravadas na foto de evidência,
     com seta e círculo para marcar;
   - cnpj-guarda.js: máscara e dígito verificador nos campos de CNPJ;
   - campo.js: botão Campo (resumo, pendências, achados, redação,
     verificações) e revisão das fotos;
   - copia-auto.js: cópia automática da inspeção em andamento (tela inicial).
   Entra na casca, num bloco entre CAMPO_INICIO e CAMPO_FIM; ao abrir um
   roteiro, a casca acrescenta os scripts ao fim do módulo
   (window.__uvisCampoInjeta). O iframe recebe permissão de microfone,
   localização e câmera. Idempotente.
   Uso: node scripts/repack-campo.cjs */
const fs = require('node:fs'), path = require('node:path');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let html = fs.readFileSync(file, 'utf8');
const le = f => fs.readFileSync(path.join(root, 'campo', f), 'utf8');
const jsStr = t => JSON.stringify(t).replace(/<\//g, '<\\/');
const fecha = t => t.replace(/<\/(script)/gi, '<\\/$1');
/* consultas e estoques: só o ditado (sem fotos de evidência nem pendências) */
const SO_DITADO = ['central-consultas', 'estoque-medicamentos', 'estoque-produtos', 'alimentos-integrado'];
const START = '<!--CAMPO_INICIO-->', END = '<!--CAMPO_FIM-->';
function troca(de, para, rot) {
  if (html.includes(para)) return;
  if (html.split(de).length !== 2) throw Error(rot + ': esperava 1 ocorrência');
  html = html.replace(de, () => para);
}
const casca = `(function(){
 var SO_DITADO=${JSON.stringify(SO_DITADO)};
 var CAMPO_JS=${jsStr(['cnpj-guarda.js', 'campo.js', 'foto-marca.js', 'ditado.js'].map(le).join('\n'))};
 var DITADO_JS=${jsStr(le('ditado.js'))};
 window.__uvisCampoInjeta=function(app,s){var k=s.lastIndexOf('</body>');if(k<0)return s;
  return s.slice(0,k)+'<scr'+'ipt>'+(SO_DITADO.indexOf(app)>=0?DITADO_JS:CAMPO_JS)+'</scr'+'ipt>'+s.slice(k)};
 /* Salvas: os dados do botão Campo (med-campo-<roteiro>) e as fotos dos achados
    entram na inspeção salva; Nova inspeção apaga também esses dados. */
 var n=0;function salvas(){var S=window.UvisSalvas;if(!S){if(++n<80)setTimeout(salvas,150);return}
  Object.keys(S.CFG).forEach(function(a){var c=S.CFG[a],k='med-campo-'+a;if(c.ls.indexOf(k)<0)c.ls.push(k);if(!c.fotos.length)c.fotos.push(a+'-campo-')});
  var nova=S.novaInspecao;if(nova&&!nova.__campo){S.novaInspecao=function(app){try{localStorage.removeItem('med-campo-'+app)}catch(e){}return nova.apply(this,arguments)};S.novaInspecao.__campo=true}}
 salvas();
})();`;
const bloco = START + '<script>' + fecha(casca) + '</script>\n<script>' + fecha(le('copia-auto.js')) + '</script>\n<script>' + fecha(le('ditado.js')) + '</script>' + END;
const i0 = html.indexOf(START);
if (i0 >= 0) html = html.slice(0, i0) + html.slice(html.indexOf(END) + END.length);
const k = html.lastIndexOf('</body>'); if (k < 0) throw Error('</body> da casca');
html = html.slice(0, k) + bloco + '\n' + html.slice(k);
troca('try { fonte = montar(app);', 'try { fonte = montar(app); if(window.__uvisCampoInjeta) fonte = window.__uvisCampoInjeta(app, fonte);', 'casca: injeção ao abrir');
troca('<iframe id="quadro" title="Roteiro">', '<iframe id="quadro" title="Roteiro" allow="microphone; geolocation; camera">', 'iframe: microfone e localização');
fs.writeFileSync(file, html);
console.log('index.html', (html.length / 1e6).toFixed(2), 'MB');
