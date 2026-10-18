'use strict';
/* Prévia do relatório na própria aba Relatório (pedido de 18/10/2026: “a prévia do
   relatório deve sair na aba Relatório, como é em Academia; em Odonto tem de abrir outra
   tela”). Como no motor roteiro-simples: resumo, botões de Word e PDF na aba e, abaixo,
   “Prévia do relatório” com o mesmo conteúdo do documento, sem abrir janela nem folha.
   - Odontologia: os blocos do relatório (blocks()) desenhados em HTML; Word, PDF e
     copiar texto na aba; “Opções do relatório” abre a janela de opções (só NC, incluir
     N/A) e, ao fechá-la, a prévia é refeita.
   - Produtos: o corpo da folha do relatório (renderReport) na aba, sem ativar a folha;
     “Baixar relatório em Word” usa o mesmo exportador; a folha continua para imprimir.
   - Serviços assistenciais: buildReport(true) monta o documento sem abrir a janela; a
     prévia copia o documento; Word e PDF acionam os mesmos botões da janela.
   - Estética: a aba Relatório mostra o documento do Word (com a constatação, quando
     preenchida); a folha por cima fica só para imprimir.
   Fontes (odontologia-padrao.inc.js, produtos-padrao.inc.js, assistenciais-padrao.inc.js)
   e blocos. Idempotente. Uso: node scripts/repack-relatorio-aba.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
let {html, lz} = unpack(file);
function bloco(id, fn) {
  const re = new RegExp('(<script type="text/plain" id="' + id.replace(/[.]/g, '\\.') + '">)([\\s\\S]*?)(</script>)');
  const m = html.match(re); if (!m) throw Error(id);
  const a = lz.decompressFromBase64(m[2].trim()); if (!a) throw Error('descompactação ' + id);
  const b = fn(a); if (b === a) return;
  const enc = lz.compressToBase64(b); if (lz.decompressFromBase64(enc) !== b) throw Error('round-trip ' + id);
  html = html.replace(re, () => m[1] + enc + m[3]);
}
function fonte(nome, fn) { const p = path.join(root, nome), a = fs.readFileSync(p, 'utf8'), b = fn(a); if (b !== a) fs.writeFileSync(p, b); }
function troca(s, de, para, rot) {
  if (s.includes(para)) return s;
  if (s.split(de).length !== 2) throw Error(rot + ': esperava 1 ocorrência, achei ' + (s.split(de).length - 1));
  return s.replace(de, () => para);
}

/* estilo da prévia, comum aos módulos do componente padrão */
const CSS = `
/* prévia do relatório na aba Relatório (18/10/2026) */
.uvs-rel-previa{font-size:.9rem;line-height:1.55;overflow-x:auto}
.uvs-rel-previa>div h2{font-size:1rem;margin:0 0 6px;text-align:center}
.uvs-rel-previa>div h3{font-size:.92rem;margin:14px 0 6px;color:inherit}
.uvs-rel-previa>div h4{font-size:.88rem;margin:12px 0 4px}
.uvs-rel-previa>div h5{font-size:.85rem;margin:10px 0 4px}
.uvs-rel-previa>div p{margin:0 0 8px}
.uvs-rel-previa table{border-collapse:collapse;width:100%;margin:6px 0 10px;font-size:.82rem}
.uvs-rel-previa th,.uvs-rel-previa td{border:1px solid #d7e0e5;padding:4px 6px;text-align:left;vertical-align:top}
.uvs-rel-previa .uvs-r-tit{font-weight:700;text-align:center;margin-bottom:2px}
.uvs-rel-previa .uvs-r-sub{text-align:center;color:#55636b}
@media print{.uvs-rel-previa{display:none!important}body.as-imprime #pu-raiz{display:none!important}}
`;
bloco('rec--padrao-uvis.css', s => s.includes('prévia do relatório na aba Relatório (18/10/2026)') ? s : s + CSS);

/* ---------- Odontologia ---------- */
const odo = s => {
  s = troca(s, `  <div class="pu-acoes-item"><button type="button" class="pu-btn pu-btn-pri" data-odo-gen>Gerar relatório</button><button type="button" class="pu-btn" data-odo-pendente>Ir à próxima verificação pendente</button></div>
  <p class="pu-q-ajuda">O relatório usa apenas o roteiro. A tabela de infrações é emitida na aba Infrações.</p></div>\`;
}`, `  <div class="pu-acoes-item"><button type="button" class="pu-btn pu-btn-pri" data-odo-word>Baixar relatório em Word</button><button type="button" class="pu-btn" data-odo-pdf>Gerar PDF</button><button type="button" class="pu-btn" data-odo-copia>Copiar texto</button><button type="button" class="pu-btn" data-odo-gen>Opções do relatório</button><button type="button" class="pu-btn" data-odo-pendente>Ir à próxima verificação pendente</button></div>
  <p class="pu-q-ajuda">O relatório usa apenas o roteiro. A tabela de infrações é emitida na aba Infrações. As fotos saem à parte, no botão Fotos do cabeçalho.</p></div>
  <div class="pu-bloco uvs-rel-previa"><h3>Prévia do relatório</h3><div>\${odoPreviaHtml(blocks())}</div></div>\`;
}
/* prévia na própria aba (18/10/2026): os blocos do Word desenhados em HTML */
function odoPreviaHtml(B){
 const tab=b=>'<table><thead><tr>'+b.head.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+b.rows.map(r=>'<tr>'+r.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 return B.map(b=>b.t==='title'?'<p class="uvs-r-tit">'+esc(b.x)+'</p>':b.t==='sub'?'<p class="uvs-r-sub">'+esc(b.x)+'</p>':b.t==='h1'?'<h3>'+esc(b.x)+'</h3>':b.t==='h2'?'<h4>'+esc(b.x)+'</h4>'
  :b.t==='kv'?'<p><b>'+esc(b.k)+':</b> '+esc(b.v)+'</p>':b.t==='num'?'<p>'+esc(b.n)+'. '+esc(b.x)+'</p>':b.t==='small'?'<p class="pu-q-ajuda">'+esc(b.x)+'</p>':b.t==='p'?'<p>'+esc(b.x)+'</p>'
  :b.t==='table'?tab(b):b.t==='sign'?'<p class="pu-q-ajuda">Local e data; assinaturas da autoridade sanitária e do responsável pelo estabelecimento.</p>':'').join('');
}`, 'odontologia: prévia na aba');
  s = troca(s, "  if(e.target.closest('[data-odo-gen]')){openGen();return}",
    "  if(e.target.closest('[data-odo-word]')){download();return}\n  if(e.target.closest('[data-odo-pdf]')){printPdf();return}\n  if(e.target.closest('[data-odo-copia]')){copyTxt();return}\n  if(e.target.closest('[data-odo-gen]')){openGen();return}", 'odontologia: botões da aba');
  s = troca(s, ' /* os ouvintes originais chamam renderRot() depois de cada mudança */',
    " /* as opções do relatório mudam a prévia: ao fechar a janela, a aba é refeita */\n byId('mGen')?.addEventListener('close',()=>{if(UvisPadrao.estado().aba==='relatorio')UvisPadrao.vai({aba:'relatorio'})});\n /* os ouvintes originais chamam renderRot() depois de cada mudança */", 'odontologia: refaz a prévia');
  return s;
};
fonte('odontologia-padrao.inc.js', odo);
bloco('app--odontologia', odo);

/* ---------- Produtos ---------- */
const pro = s => troca(s, `      <div class="actions"><button type="button" class="btn primary" data-report>Visualizar relatório</button><button type="button" class="btn" data-pu-pendente>Ir ao próximo item pendente</button></div>
      <p class="pu-q-ajuda">No relatório: “Baixar Word” gera o documento; as fotos saem à parte, no botão Fotos do cabeçalho.</p></section>\`;
  }`, `      <div class="actions"><button type="button" class="btn primary" data-word-export>Baixar relatório em Word</button><button type="button" class="btn" data-report>Abrir para imprimir</button><button type="button" class="btn" data-pu-pendente>Ir ao próximo item pendente</button></div>
      <p class="pu-q-ajuda">As fotos saem à parte, no botão Fotos do cabeçalho.</p></section>
      <section class="pu-bloco uvs-rel-previa"><h3>Prévia do relatório</h3><div>\${puPrevia()}</div></section>\`;
  }
  /* prévia na própria aba (18/10/2026): o corpo da folha do relatório, sem abrir a folha */
  function puPrevia() { renderReport(); $("#print-sheet").classList.remove("active"); return $("#print-body").innerHTML; }`, 'produtos: prévia na aba');
fonte('produtos-padrao.inc.js', pro);
bloco('rec--roteiro-guiado.js', pro);

/* ---------- Serviços assistenciais ---------- */
const as = s => {
  s = troca(s, `  <div class="pu-acoes-item"><button type="button" class="pu-btn pu-btn-pri" data-as-rel>Gerar Word / PDF</button><button type="button" class="pu-btn" data-as-pendente>Ir à próxima verificação pendente</button></div></div>\`;
}`, `  <div class="pu-acoes-item"><button type="button" class="pu-btn pu-btn-pri" data-as-word>Baixar relatório em Word</button><button type="button" class="pu-btn" data-as-pdf>Gerar PDF</button><button type="button" class="pu-btn" data-as-pendente>Ir à próxima verificação pendente</button></div>
  <p class="pu-q-ajuda">As fotos saem à parte, no botão Fotos do cabeçalho.</p></div>
  <div class="pu-bloco uvs-rel-previa"><h3>Prévia do relatório</h3><div data-as-previa>Montando a prévia…</div></div>\`;
 /* prévia na própria aba (18/10/2026): o mesmo documento do Word, montado sem abrir a janela */
 buildReport(true).then(()=>{const p=el.querySelector('[data-as-previa]'),r=document.getElementById('reportBody');if(p&&r)p.innerHTML=r.innerHTML}).catch(()=>{});
}`, 'assistenciais: prévia na aba');
  s = troca(s, "  if(t.closest('[data-as-rel]')){buildReport();showModal('reportModal');return}",
    "  if(t.closest('[data-as-word]')){buildReport(true).then(()=>document.getElementById('downloadWord').click());return}\n  if(t.closest('[data-as-pdf]')){buildReport(true).then(()=>{document.body.classList.add('as-imprime');window.print();setTimeout(()=>document.body.classList.remove('as-imprime'),800)});return}\n  if(t.closest('[data-as-rel]')){buildReport();showModal('reportModal');return}", 'assistenciais: botões da aba');
  return s;
};
fonte('assistenciais-padrao.inc.js', as);
bloco('app--servicos-assistenciais', s => {
  s = as(s);
  s = troca(s, 'async function buildReport(){', 'async function buildReport(semModal){', 'assistenciais: buildReport sem janela');
  return troca(s, '/* relatório sem anexo de texto legal nem aviso interno */showModal("reportModal")}',
    '/* relatório sem anexo de texto legal nem aviso interno */if(semModal!==true)showModal("reportModal")}', 'assistenciais: janela opcional');
});

/* ---------- Estética ---------- */
/* a aba Relatório tinha só “Gerar relatório”, que abria a folha por cima: agora mostra o
   documento do Word (estHtml, o mesmo de word()), com Baixar Word na aba; a folha fica
   para imprimir */
bloco('app--estetica', s => {
  s = troca(s, 'function gerar(){', 'function gerar(semAbrir){', 'estética: gerar sem abrir');
  s = troca(s, '$("saida").classList.add("ativo");$("saida").scrollTop=0}', 'if(semAbrir!==true){$("saida").classList.add("ativo");$("saida").scrollTop=0}}', 'estética: folha opcional');
  s = troca(s, "function word(){if(!$(\"saida\").classList.contains(\"ativo\"))gerar();const root=document.createElement('div');", 'function estHtml(){gerar(true);', 'estética: html do Word');
  s = troca(s, "if(!n)h+='<p>Nenhuma infração selecionada.</p>';root.innerHTML=h;return RoteiroDocuments.downloadElement(root,'Infracoes_Estetica')}",
    "if(!n)h+='<p>Nenhuma infração selecionada.</p>';return h}\nfunction word(){const root=document.createElement('div');root.innerHTML=estHtml();return RoteiroDocuments.downloadElement(root,'Infracoes_Estetica')}", 'estética: word pelo html');
  s = troca(s, "<span>Revise as seleções e emita o documento consolidado.</span><button type=\"button\" class=\"principal\" data-acao=\"gerar\">Gerar relatório</button></div>';return}",
    "<span>Revise as seleções; o documento sai como na prévia abaixo.</span><p class=\"acoes-rel\"><button type=\"button\" class=\"principal\" data-acao=\"word\">Baixar relatório em Word</button><button type=\"button\" data-acao=\"gerar\">Abrir para imprimir (PDF)</button></p></div><div class=\"norma previa-rel\"><b>Prévia do relatório</b><div class=\"folha-previa\">'+estHtml()+'</div></div>';return}", 'estética: prévia na aba');
  return troca(s, '</head>', '<style id="estetica-previa">/* prévia do relatório na aba Relatório (18/10/2026) */.acoes-rel{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 0}.acoes-rel button:not(.principal){background:#fff;border:1px solid #cfc6ef;border-radius:10px;padding:10px 14px;color:#4b2fb0;font:inherit;font-weight:600;cursor:pointer}.folha-previa{font-size:.9rem;line-height:1.55;margin-top:8px}.folha-previa h1{font-size:1rem;text-align:center;margin:0 0 6px}.folha-previa h2{font-size:.95rem;margin:12px 0 6px}.folha-previa h3{font-size:.88rem;margin:10px 0 4px}.folha-previa p{margin:0 0 8px}</style></head>', 'estética: estilo da prévia');
});

fs.writeFileSync(file, html);
console.log('Prévia do relatório na aba Relatório: odontologia, produtos, serviços assistenciais e estética.');
