/* Drogaria — perguntas que faltavam para autuar (levantamento de 04/10/2026:
   dispositivos da RDC 44/2009 com dever ou vedação que nenhuma pergunta do
   catálogo citava). Aqui ficam as que entram no catálogo (cards 4 e 7, que
   mostram as perguntas do catálogo); as de serviços, documentos e venda remota
   entram nas telas próprias desses cards (build/montar.cjs, seção 7t). Pedido inicial: art. 61, § 5º (serviço não
   abrangido pela RDC 44/2009). Ficaram de fora os dispositivos que só remetem a
   outra norma (manipulação, controle especial, fracionamento, genéricos), já
   cobertos pelos roteiros e perguntas próprios. */
function __medLacunasDrogaria(catalog){
 var P = catalog.perguntas, R = catalog.referencias || (catalog.referencias = {});
 var base = R['rdc-44-2009::artigo::2::inciso::iii'] || {};
 function rot(id){ var p = id.split('::').slice(1), out = [];
  for(var i = 0; i < p.length; i += 2){ var t = p[i], v = p[i + 1];
   if(t === 'artigo') out.push('Art. ' + v); else if(t === 'paragrafo') out.push(v === 'unico' ? 'parágrafo único' : '§ ' + v + 'º'); else if(t === 'inciso') out.push('inciso ' + v.toUpperCase()); else out.push(t + ' ' + v); }
  return out.join(', '); }
 function ref(id){ if(!R[id]) R[id] = {id: id, norma: 'RDC 44/2009', dispositivo: rot(id), arquivo: base.arquivo || 'legislacao_v12/normas/rdc-44-2009.json', status: 'validado', fonte_oficial: base.fonte_oficial || ''}; return id; }
 var A = function(n){ return 'rdc-44-2009::artigo::' + n; }, PG = function(n, p){ return A(n) + '::paragrafo::' + p; };
 /* redação positiva (20/10/2026): perguntas do catálogo embutido escritas como ausência do erro. O catálogo
    (VISA_LOCAL) é protegido e não se reescreve; a troca é feita aqui, na carga. */
 [['refeitorio_sifao', 'Os alimentos são guardados fora da área sob o sifão e a pia?', 'Os alimentos são guardados fora da área sob o sifão e a pia.'],
  ['service_wc', 'O sanitário tem acesso independente da sala de serviços?', 'O sanitário tem acesso independente da sala de serviços.'],
  ['wext_3', 'O abrigo externo comporta os resíduos acumulados se uma coleta regular deixar de ocorrer?', 'O abrigo externo comporta os resíduos acumulados se uma coleta regular deixar de ocorrer.']
 ].forEach(function(t){ P.forEach(function(p){ if(p.id === t[0]){ p.pergunta = t[1]; if(p.frase_positiva) p.frase_positiva = t[2]; } }); });
 function add(q, aposGrupo){
  if(P.some(function(p){ return p.id === q.id; })) return;
  var refs = q.refs.map(ref), irmao = P.filter(function(p){ return p.card === q.card; })[0] || {};
  var x = Object.assign({tipo: 'check', respostas: ['sim', 'nao', 'nsa'], norma: refs.map(function(){ return 'RDC 44/2009'; }), dispositivo: refs.map(rot),
   gera_irregularidade: true, gera_documento_pendente: false, incluir_relatorio: true, secao_relatorio: irmao.secao_relatorio || '', condicao: null}, q);
  var i = -1; P.forEach(function(p, k){ if(p.card === q.card && p.grupo === (aposGrupo || q.grupo)) i = k; });
  if(i < 0) P.forEach(function(p, k){ if(p.card === q.card) i = k; });
  P.splice(i + 1, 0, x); }

 /* referências das perguntas das telas próprias (serviços, documentos, venda remota) */
 [PG(61, 5), PG(61, 3), PG(69, 3), PG(69, 4), A(82), PG(59, 'unico'), A(67), A(25), A(26), A(27), A(89), A(55), A(54)].forEach(ref);
 /* mapas e balanços: além do BMPO trimestral (art. 69), o anual (art. 69, § 1º) e a RMNRA (art. 72) */
 (function(){ var b = R['portaria-svs-ms-344-1998::artigo::69']; if(!b) return;
  [['portaria-svs-ms-344-1998::artigo::69::paragrafo::1', 'Art. 69, § 1º'], ['portaria-svs-ms-344-1998::artigo::72', 'Art. 72']].forEach(function(x){
   if(!R[x[0]]) R[x[0]] = Object.assign({}, b, {id: x[0], dispositivo: x[1]}); });
  P.forEach(function(q){ if(q.id === 'doc_bmpo_trim') ['portaria-svs-ms-344-1998::artigo::69::paragrafo::1', 'portaria-svs-ms-344-1998::artigo::72'].forEach(function(id){ if(q.refs.indexOf(id) < 0){ q.refs.push(id); if(q.norma) q.norma.push(b.norma); if(q.dispositivo) q.dispositivo.push(R[id].dispositivo); } }); }); })();
 /* citações das telas de área física (drogaria-area-fisica.js) */
 [A(9), A(11), A(12), A(13), A(32), A(36), A(38), A(39), A(40), PG(41, 1), PG(41, 2), PG(76, 2), PG(35, 1), PG(35, 2), PG(35, 4), PG(6, 2), PG(6, 4)].forEach(ref);

 /* card 4 — dispensação */
 add({id: 'disp_receita', card: 4, grupo: 'Dispensação e escrituração', refs: [A(43)],
  pergunta: 'Os medicamentos sujeitos à prescrição são dispensados somente mediante apresentação da receita?',
  frase_positiva: 'Os medicamentos sujeitos à prescrição são dispensados somente mediante apresentação da receita.',
  frase_negativa: 'Foi constatada a dispensação de medicamento sujeito à prescrição sem apresentação da receita.'});
 add({id: 'disp_receita_legivel', card: 4, grupo: 'Dispensação e escrituração', refs: [A(45), PG(44, 'unico')],
  pergunta: 'A dispensação exige receita legível e sem ambiguidade, com contato com o prescritor em caso de dúvida?',
  frase_positiva: 'A dispensação é feita mediante receita legível e sem ambiguidade, com contato com o prescritor em caso de dúvida.',
  frase_negativa: 'Foram dispensados medicamentos com receita ilegível ou que pode induzir a erro, ou o prescritor não é contatado em caso de dúvida.'});

 /* exposição (art. 40, art. 41, § 1º): perguntas na área de dispensação (drogaria-area-fisica.js, item 4.2); não se repetem nos controlados. */

 /* produtos impróprios: perguntas na área de armazenamento (drogaria-area-fisica.js, item 4.3). */

}
