'use strict';
/* Atacadista de medicamentos: documentos no modelo do POP-O-SNVS-011 rev. 3 (revisão de 25/10/2026).
   1. Anexo I: campo sem descrição nem respostas sai como “Não aplicável”, como manda o POP
      (item 8: “Caso a informação solicitada … não seja cabível … escrever o texto ‘Não aplicável’.
      Isto inclui os itens não avaliados …”); antes saía “Não avaliado nesta inspeção”.
   2. Anexo III (revisão por par técnico) refeito pelo motor dos demais documentos (ddDocx), no
      leiaute do modelo: órgão no cabeçalho, data da inspeção dd/mm/aaaa (saía aaaa-mm-dd), itens
      avaliados em tabela Sim/Não, equipe em linhas “Nome:”, comentários com a nota de
      obrigatoriedade na reprovação e status final com Aprovado/Reprovado marcáveis.
   Idempotente. Uso: node scripts/repack-atacadista-relatorio.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
const ID = 'app--distribuidoras-transportadoras';

const VAZIO = [
  ["return 'Não avaliado nesta inspeção.'}", "return 'Não aplicável.'}"],
  ['(sairão como “Não avaliado nesta inspeção”)', '(sairão como “Não aplicável”, texto que o POP-O-SNVS-011 pede nos campos sem conteúdo)']
];
const PEER_MARCA = '/* Anexo III no leiaute do modelo (POP-O-SNVS-011 rev. 3) */';
const PEER = PEER_MARCA + "\nfunction exportPeer(){if(state.peer.status==='Reprovado'&&!String(state.peer.comments||'').trim()){alert('Comentários são obrigatórios quando a revisão é reprovada.');return}\n"
  + " const m=state.meta,p=state.peer,eq=ddEquipeRows(),x=(v,o)=>(v===o?'☒ ':'☐ ')+o,nodes=[],rot=t=>({t,b:true,fill:'F2F2F2'});\n"
  + " if(ddTem(m.organ))nodes.push({k:'org',t:m.organ});nodes.push({k:'title',t:'FORMULÁRIO DE REVISÃO POR PAR TÉCNICO'});\n"
  + " nodes.push({k:'h2',t:'I. Dados do Estabelecimento'},{k:'tbl',cols:[3000,6354],rows:[[rot('Nome da empresa'),m.company||''],[rot('CNPJ'),m.cnpj||''],[rot('Data da inspeção'),ddPeriodo(m.start,m.end)]]});\n"
  + " nodes.push({k:'h2',t:'II. Itens avaliados'},{k:'tbl',head:true,cols:[5354,2000,2000],rows:[['Os itens avaliados estão adequados?','Sim','Não']].concat(DATA.peerAxes.map(a=>[a[1],p.axes[a[0]]==='Sim'?'☒':'☐',p.axes[a[0]]==='Não'?'☒':'☐']))});\n"
  + " nodes.push({k:'h2',t:'III. Nome da Equipe Inspetora'});(eq.length?eq:[{},{}]).forEach(e=>nodes.push({k:'p',runs:[['Nome: ',{b:true}],[(e.name||'')+(e.role==='Observador'?' (observador)':''),{}]]}));\n"
  + " nodes.push({k:'h2',t:'IV. Identificação do Par Técnico'},{k:'p',runs:[['Nome do Par Técnico: ',{b:true}],[p.name||'',{}]]},{k:'p',runs:[['Data da Devolução: ',{b:true}],[ddData(p.date)||'____/____/______',{}]]});\n"
  + " nodes.push({k:'h2',t:'V. Comentários (obrigatório o preenchimento no caso de reprovação)'},{k:'p',t:String(p.comments||'').trim()||'—'});\n"
  + " nodes.push({k:'h2',t:'VI. Status Final'},{k:'p',t:x(p.status,'Aprovado')+'     '+x(p.status,'Reprovado')});\n"
  + " ddBaixar(ddDocx(nodes,{footer:'Formulário de Revisão por Par Técnico — POP-O-SNVS-011 rev. 3, Anexo III'}),'Anexo_III_POP_011_Revisao_Par_Tecnico.docx')}\n";

function troca(s, de, para) {
  if (s.includes(de)) return s.split(de).join(para);
  if (!s.includes(para)) throw Error('Trecho não localizado: ' + de.slice(0, 70));
  return s;
}

let feito = false;
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== ID) return m;
  feito = true;
  const src = lz.decompressFromBase64(enc.trim());
  let s = src;
  for (const [de, para] of VAZIO) s = troca(s, de, para);
  if (!s.includes(PEER_MARCA)) {
    const i = s.indexOf('function exportPeer(){'), j = s.indexOf('\nfunction exportAlert(', i);
    if (i < 0 || j < 0 || s.indexOf('function exportPeer(){', i + 1) >= 0) throw Error('exportPeer não localizado de forma única');
    s = s.slice(0, i) + PEER + s.slice(j);
  }
  try { new Function(s.slice(s.indexOf(PEER_MARCA), s.indexOf(PEER_MARCA) + PEER.length)); } catch (e) { throw Error('exportPeer inválido: ' + e.message); }
  if (s === src) return m;
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + ID);
  return a + novo + z;
});
if (!feito) throw Error('Bloco não localizado: ' + ID);
fs.writeFileSync(file, html);
/* mesma troca na fonte (distribuidora-documentos.js), para não reaparecer numa nova injeção */
const fonte = path.join(root, 'distribuidora-documentos.js');
let f = fs.readFileSync(fonte, 'utf8'), f0 = f;
for (const [de, para] of VAZIO) if (f.includes(de)) f = f.split(de).join(para);
if (f !== f0) fs.writeFileSync(fonte, f);
console.log('Atacadista: “Não aplicável” nos campos vazios e Anexo III no leiaute do modelo.');
