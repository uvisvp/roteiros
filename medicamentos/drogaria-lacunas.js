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

 /* card 4 — dispensação */
 add({id: 'disp_receita', card: 4, grupo: 'Dispensação e escrituração', refs: [A(43)],
  pergunta: 'Os medicamentos sujeitos à prescrição são dispensados somente mediante apresentação da receita?',
  frase_positiva: 'Os medicamentos sujeitos à prescrição são dispensados somente mediante apresentação da receita.',
  frase_negativa: 'Foi constatada a dispensação de medicamento sujeito à prescrição sem apresentação da receita.'});
 add({id: 'disp_receita_legivel', card: 4, grupo: 'Dispensação e escrituração', refs: [A(45), PG(44, 'unico')],
  pergunta: 'Não são dispensados medicamentos com receitas ilegíveis ou que possam induzir a erro, e o prescritor é contatado em caso de dúvida?',
  frase_positiva: 'Não são dispensados medicamentos com receitas ilegíveis ou que possam induzir a erro, e o prescritor é contatado em caso de dúvida.',
  frase_negativa: 'Foram dispensados medicamentos com receita ilegível ou que pode induzir a erro, ou o prescritor não é contatado em caso de dúvida.'});

 /* card 4 — exposição (o card 2 tem tela própria, que não mostra perguntas do catálogo) */
 add({id: 'med_area_restrita', card: 4, grupo: 'Exposição de medicamentos', refs: [A(40), PG(40, 1)],
  pergunta: 'Os medicamentos ficam em área de circulação restrita aos funcionários, sem exposição direta ao alcance dos usuários?',
  ajuda: 'Os medicamentos isentos de prescrição podem ficar ao alcance dos usuários (RDC 44/2009, art. 40, § 2º).',
  frase_positiva: 'Os medicamentos ficam em área de circulação restrita aos funcionários, sem exposição direta ao alcance dos usuários.',
  frase_negativa: 'Foram constatados medicamentos expostos ao alcance direto dos usuários, fora da área de circulação restrita aos funcionários.'});
 add({id: 'mip_principio', card: 4, grupo: 'Exposição de medicamentos', refs: [PG(41, 1)],
  pergunta: 'Os MIPs de mesmo princípio ativo (ou associação) estão organizados em um mesmo local, identificados pelo nome do princípio ativo?',
  frase_positiva: 'Os medicamentos isentos de prescrição de mesmo princípio ativo estão organizados em um mesmo local, identificados pelo princípio ativo.',
  frase_negativa: 'Os medicamentos isentos de prescrição de mesmo princípio ativo não estão organizados em um mesmo local identificado pelo princípio ativo.'});

 /* card 7 — produtos impróprios */
 add({id: 'emb_violada', card: 7, grupo: 'Produtos impróprios', refs: [PG(76, 2)],
  pergunta: 'Não há medicamentos com embalagem primária violada armazenados no estabelecimento?',
  frase_positiva: 'Não foram encontrados medicamentos com embalagem primária violada armazenados no estabelecimento.',
  frase_negativa: 'Foram encontrados medicamentos com embalagem primária violada armazenados no estabelecimento.'});

}
