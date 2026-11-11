/* Documentos do POP-O-SNVS-011 rev. 3 no motor roteiro-simples (D.pop011).
   O POP vale para distribuidoras, armazenadoras e transportadoras de medicamentos e cita a
   RDC Anvisa nº 887/2024 entre as referências: o atacadista de gases medicinais sai nos mesmos
   modelos — Anexo I (relatório), Anexo II (comunicação de não conformidades) e Anexo III
   (revisão por par técnico) —, além da análise do plano de ação.
   O motor entrega os dados por window.RsPop011.painel(el, api), chamado na aba Relatório.
   D.pop011 = {itens: {idDoItemDoRoteiro: 'item do Anexo I'}, perguntas: {idDaPergunta: 'item'}}. */
(function(){
 'use strict';
 var A = null, aberto = {};
 var RODAPE = {
  I: 'Anexo I – MODELO DO RELATÓRIO DE INSPEÇÃO - PROCEDIMENTO OPERACIONAL: Elaboração de Relatório de Inspeção de Distribuidoras ou Importadora, Armazenadoras e Transportadoras de Medicamentos. IDENTIFICADOR: POP-O-SNVS-011 - rev.3– AN-I-2',
  II: 'Anexo II – FORMULÁRIO DE COMUNICAÇÃO DE NÃO CONFORMIDADES - PROCEDIMENTO OPERACIONAL: Elaboração de Relatório de Inspeção de Distribuidoras ou Importadoras, Armazenadoras e Transportadoras de Medicamentos. IDENTIFICADOR: POP-O-SNVS-011 - rev.3– AN-II-0',
  III: 'Anexo III – FORMULÁRIO DE REVISÃO POR PAR TÉCNICO - PROCEDIMENTO OPERACIONAL: Elaboração de Relatório de Inspeção de Distribuidoras ou Importadoras, Armazenadoras e Transportadoras de Medicamentos. IDENTIFICADOR: POP-O-SNVS-011 - rev.3– AN-III-0'
 };
 var ATIV = ['Distribuir', 'Transportar', 'Importar', 'Armazenar', 'Expedir'];
 var LIC = ['Distribuir', 'Transportar', 'Transporte próprio', 'Transporte para terceiros', 'Importar', 'Armazenar', 'Armazenamento próprio', 'Armazenamento para terceiros', 'Expedir'];
 var MONITOR = ['Avaliação Documental', 'Inspeção de Acompanhamento', 'Próxima Inspeção Planejada de BPDAIT conforme POP-O-SNVS-031', 'Sem necessidade de monitoramento'];
 var CATEG = ['Crítica', 'Maior', 'Outra'];
 var CLASSES = [['14.1', 'Cumpre as Boas Práticas', '14.1.1'], ['14.3', 'Cumpre as Boas Práticas com Ação Corretiva', '14.3.1'], ['14.4', 'Não cumpre as Boas Práticas', '14.4.1']];
 var EIXOS = [['formato', 'Conformidade do conteúdo e formato do relatório'], ['descricao', 'Descrição das não conformidades'], ['categorizacao', 'Categorização das não conformidades'], ['classificacao', 'Classificação final adotada pela equipe inspetora']];
 var TIT = {'7.1': 'Qualificação do prestador de serviço', '8.1': 'Higiene pessoal e saúde do trabalhador', '9.1': 'Recepção', '9.2': 'Armazenamento', '9.3': 'Expedição', '10.1': 'Qualificação de transporte',
  '11.1': 'Gerenciamento das documentações', '11.2': 'Cadastro de fornecedores e clientes', '11.3': 'Recolhimento e devolução', '11.4': 'Autoinspeção', '11.5': 'Gerenciamento de resíduos',
  '11.6': 'Sistema de investigação de desvios e controle de ações corretivas', '11.7': 'Gerenciamento de reclamações', '11.8': 'Sistemas computadorizados', '11.9': 'Mecanismos de gerenciamento de medicamentos sujeitos ao controle especial',
  '12.1': 'Instalações', '12.2': 'Atividades', '12.3': 'Padrões de referência e especificações', '12.4': 'Investigação de resultados fora de especificação', '12.5': 'Liberação de lotes'};
 var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

 /* ---------- dados ---------- */
 function P(){ var s = A.st(); s.pop = s.pop || {}; s.pop.nc = s.pop.nc || {}; s.pop.par = s.pop.par || {}; s.pop.par.eixos = s.pop.par.eixos || {}; return s.pop; }
 function M(){ return A.st().meta || {}; }
 function tem(v){ return !!String(v == null ? '' : v).trim(); }
 function tx(v){ return String(v == null ? '' : v).trim(); }
 function fim(t){ t = tx(t); return !t ? '' : /[.!?:;)]$/.test(t) ? t : t + '.'; }
 function data(v){ return A.fmtData(v) || ''; }
 function periodo(a, b){ a = data(a); b = data(b); return a && b && a !== b ? a + ' a ' + b : (a || b || ''); }
 function extenso(v){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || '')), d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(); return d.getDate() + ' de ' + MESES[d.getMonth()] + ' de ' + d.getFullYear(); }
 function box(v, t){ return (v ? '☒ ' : '☐ ') + t; }
 function duas(v){ var t = tx(v), i = t.indexOf('/'); return i < 0 ? [t, ''] : [t.slice(0, i).trim(), t.slice(i + 1).trim()]; }
 function linhas(v){ return String(v || '').split('\n').map(function(l){ return l.split(';').map(function(c){ return c.trim(); }); }).filter(function(l){ return l.some(Boolean); }); }
 function paras(v){ return String(v || '').split(/\n+/).map(tx).filter(Boolean); }
 function sel(k){ return Array.isArray(P()[k]) ? P()[k] : []; }
 function equipe(){ var e = linhas(P().equipe); if(e.length) return e.map(function(l){ return {nome: l[0] || '', inst: l[1] || '', mat: l[2] || '', esfera: l[3] || ''}; });
  return String(M().equipe || '').split(/[;\n]+/).map(tx).filter(Boolean).map(function(n){ return {nome: n, inst: P().orgao || '', mat: '', esfera: 'Municipal'}; }); }
 function itemDe(q){ var c = A.D.pop011 || {}, o = A.ONDE[q.id]; return (c.perguntas || {})[q.id] || (c.itens || {})[o && o.it && o.it.id] || '11'; }
 function legalDe(q){ var r = q.r || [], esp = r.filter(function(x){ return !/^lei-municipal-13725-2004::/.test(x); }); return A.fundamento(esp.length ? esp : r); }
 function ncs(){ var s = A.st(); return A.ORDEM.filter(function(id){ return s.r[id] === 'nc' && A.visivel(A.PERG[id]); }).map(function(id, i){ var q = A.PERG[id]; return {id: id, num: i + 1, q: q, texto: fim(A.frase(q)), legal: legalDe(q), e: P().nc[id] || {}}; }); }
 function ncTexto(n){ return n.texto.replace(/\.$/, '') + (n.legal ? ' (' + n.legal + ').' : '.'); }
 function respondidas(item){ var s = A.st(); return A.ORDEM.map(function(id){ return A.PERG[id]; }).filter(function(q){ return A.visivel(q) && s.r[q.id] && itemDe(q) === item; }); }

 /* ---------- Word ---------- */
 function x(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
 function run(t, o){ o = o || {}; var sz = Math.round((o.sz || 10) * 2), rpr = '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>' + (o.b ? '<w:b/>' : '') + '<w:sz w:val="' + sz + '"/><w:szCs w:val="' + sz + '"/></w:rPr>';
  return String(t == null ? '' : t).split('\n').map(function(l, i){ return '<w:r>' + rpr + (i ? '<w:br/>' : '') + '<w:t xml:space="preserve">' + x(l) + '</w:t></w:r>'; }).join(''); }
 function par(runs, o){ o = o || {}; var r = Array.isArray(runs) ? runs.map(function(y){ return typeof y === 'string' ? run(y, o) : run(y[0], Object.assign({}, o, y[1])); }).join('') : run(runs, o);
  return '<w:p><w:pPr>' + (o.keep ? '<w:keepNext/>' : '') + '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after == null ? 100 : o.after) + '" w:line="264" w:lineRule="auto"/>' + (o.ind ? '<w:ind w:left="' + o.ind + '"/>' : '') + '<w:jc w:val="' + (o.al || 'both') + '"/></w:pPr>' + r + '</w:p>'; }
 function tbl(cols, rows, o){ o = o || {}; var tot = cols.reduce(function(a, b){ return a + b; }, 0), L = {t: 'top', l: 'left', b: 'bottom', r: 'right'};
  var tr = rows.map(function(r, ri){ var ci = 0, head = o.head && ri === 0; return '<w:tr><w:trPr><w:cantSplit/>' + (head ? '<w:tblHeader/>' : '') + '</w:trPr>' + r.map(function(c){ c = c && typeof c === 'object' ? c : {t: c}; var span = c.span || 1, w = cols.slice(ci, ci + span).reduce(function(a, b){ return a + b; }, 0); ci += span;
    return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' + (span > 1 ? '<w:gridSpan w:val="' + span + '"/>' : '') + (c.sb ? '<w:tcBorders>' + ['t', 'l', 'b', 'r'].filter(function(k){ return c.sb.indexOf(k) >= 0; }).map(function(k){ return '<w:' + L[k] + ' w:val="nil"/>'; }).join('') + '</w:tcBorders>' : '') + '</w:tcPr>'
     + par(c.runs || c.t, {sz: c.sz || 10, b: c.b || head, al: c.al || 'left', after: 40}) + '</w:tc>'; }).join('') + '</w:tr>'; }).join('');
  return '<w:tbl><w:tblPr><w:tblW w:w="' + tot + '" w:type="dxa"/><w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(function(b){ return '<w:' + b + ' w:val="' + (o.nb ? 'nil' : 'single') + '" w:sz="4" w:space="0" w:color="000000"/>'; }).join('') + '</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' + cols.map(function(c){ return '<w:gridCol w:w="' + c + '"/>'; }).join('') + '</w:tblGrid>' + tr + '</w:tbl>' + par('', {after: 60, sz: 4}); }
 function nodeXml(n){
  if(n.k === 'h1') return par((n.n ? n.n + '. ' : '') + n.t.toUpperCase(), {b: true, sz: 11, al: 'left', before: 220, after: 100, keep: true});
  if(n.k === 'h2') return par((n.n ? n.n + ' ' : '') + n.t, {b: true, sz: 10, al: 'left', before: 140, after: 80, keep: true});
  if(n.k === 'p') return par(n.runs || n.t || '', {sz: 10, al: n.al || 'both', ind: n.ind, after: n.after});
  if(n.k === 'tbl') return tbl(n.cols, n.rows, Object.assign({head: n.head}, n.o || {}));
  if(n.k === 'pb') return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  return ''; }
 function nodeTexto(n){ var r = function(c){ return c.runs ? c.runs.map(function(y){ return typeof y === 'string' ? y : y[0]; }).join('') : (c.t || ''); };
  if(n.k === 'h1') return '\n' + (n.n ? n.n + '. ' : '') + n.t.toUpperCase();
  if(n.k === 'h2') return '\n' + (n.n ? n.n + ' ' : '') + n.t;
  if(n.k === 'p') return r(n);
  if(n.k === 'tbl') return n.rows.map(function(row){ return row.map(function(c){ return c && typeof c === 'object' ? r(c) : c; }).join(' | '); }).join('\n');
  return ''; }
 function docx(nodes, rodape, comPagina){
  var W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"', X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  var fld = function(c){ return '<w:r><w:rPr><w:b/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:b/><w:sz w:val="16"/></w:rPr><w:instrText xml:space="preserve"> ' + c + ' </w:instrText></w:r><w:r><w:rPr><w:b/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:b/><w:sz w:val="16"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:b/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>'; };
  var footer = X + '<w:ftr ' + W + '><w:p><w:pPr><w:jc w:val="right"/></w:pPr>' + run(rodape + (comPagina ? '\n' : ''), {sz: 8}) + (comPagina ? run('Página ', {sz: 8, b: true}) + fld('PAGE') + run(' de ', {sz: 8, b: true}) + fld('NUMPAGES') : '') + '</w:p></w:ftr>';
  var doc = X + '<w:document ' + W + '><w:body>' + nodes.map(nodeXml).join('') + '<w:sectPr><w:footerReference w:type="default" r:id="rIdF"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1418" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr></w:body></w:document>';
  var styles = X + '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:lang w:val="pt-BR"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>';
  var z = new JSZip();
  z.file('[Content_Types].xml', X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>');
  z.folder('_rels').file('.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.folder('word').file('document.xml', doc).file('styles.xml', styles).file('footer1.xml', footer)
   .folder('_rels').file('document.xml.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdS" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdF" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>');
  return z.generateAsync({type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE'}); }
 function nomeArq(base){ return base + '_' + (String(M().razao || M().fantasia || 'estabelecimento').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'estabelecimento') + '.docx'; }
 function baixa(nodes, rodape, comPagina, nome){ window.__p11Ultimo = {nome: nome, texto: nodes.map(nodeTexto).join('\n')}; return docx(nodes, rodape, comPagina).then(function(b){ A.baixa(b, nome); }); }

 /* ---------- capa ---------- */
 function capa(nodes, titulo, comEstab){ var p = P();
  nodes.push({k: 'p', t: '', after: 500}, {k: 'tbl', cols: [5800], rows: [[{runs: [[p.orgao || '', {b: true, sz: 14}]]}]]}, {k: 'p', t: '', after: 2200});
  nodes.push({k: 'p', al: 'left', after: comEstab ? 2200 : 400, runs: [[titulo, {b: true, sz: 18}]]});
  if(comEstab) nodes.push({k: 'p', al: 'left', after: 2200, runs: [['Estabelecimento: ', {b: true, sz: 11}], [M().razao || '', {sz: 11}]]}, {k: 'p', al: 'center', runs: [[(p.cidade || 'São Paulo') + ', ' + extenso(p.dataRel) + '.', {sz: 11}]]});
  nodes.push({k: 'pb'}); }

 /* ---------- Anexo I ---------- */
 function anexoI(){
  var m = M(), p = P(), L = ncs(), nodes = [], s = A.st();
  var it = function(n, t){ nodes.push({k: 'h1', n: n, t: t}); }, sub = function(n){ nodes.push({k: 'h2', n: n, t: TIT[n]}); }, pp = function(t){ nodes.push({k: 'p', t: t}); };
  var campo = function(n, rot, v, b){ nodes.push({k: 'p', al: 'left', runs: [[n + ' ' + rot + ': ', {b: !!b}], [tx(v) || '—', {}]]}); };
  var linhaAtiv = function(lista){ return {k: 'tbl', cols: [1870, 1871, 1871, 1871, 1871], o: {nb: true}, rows: [ATIV.map(function(a){ return box(lista.indexOf(a) >= 0, a); })]}; };
  var bloco = function(item, extra){ var qs = respondidas(item), n0 = nodes.length;
   var conf = qs.filter(function(q){ return s.r[q.id] === 'c' || (s.r[q.id] === 'na' && typeof q.na === 'string'); }).map(function(q){ return fim(A.frase(q)); });
   if(conf.length) pp(conf.join(' '));
   paras(extra).forEach(pp);
   qs.filter(function(q){ return s.r[q.id] === 'nc'; }).forEach(function(q){ var n = L.filter(function(z){ return z.id === q.id; })[0]; nodes.push({k: 'p', runs: [['Não conformidade nº ' + n.num + (n.e.cat ? ' — ' + n.e.cat.toLowerCase() : '') + ': ', {b: true}], [ncTexto(n), {}]]}); });
   if(nodes.length === n0) pp('Não aplicável.'); };
  capa(nodes, 'RELATÓRIO DE INSPEÇÃO', true);
  /* 1 */
  it(1, 'Identificação do estabelecimento');
  campo('1.1.', 'Nome Fantasia', m.fantasia); campo('1.2.', 'Razão Social', m.razao);
  nodes.push({k: 'p', al: 'left', runs: [['1.3. CNPJ: ' + (tx(m.cnpj) || '—') + '     ' + box(p.unidade === 'Matriz', 'Matriz') + '     ' + box(p.unidade === 'Filial', 'Filial'), {}]]});
  campo('1.4.', 'Endereço', m.endereco); campo('1.5.', 'Fone', p.fone); campo('1.6.', 'E-mail', p.email);
  var rl = duas(m.rl), rt = duas(m.rt);
  pp('1.7. Responsável legal: ' + (rl[0] || '—') + ' / CPF: ' + (rl[1] || '—'));
  pp('1.8. Responsável técnico: ' + (rt[0] || '—') + ' / CRF/UF: ' + (rt[1] || '—'));
  var semLic = p.licSit === 'Não possui';
  pp('1.9. Licença de Funcionamento n° ' + (semLic ? '—' : (tx(m.licenca) || '—')) + '   Data: ' + (semLic ? '—' : (data(p.licData) || '—')) + '  -  ' + box(semLic, 'Não possui Licença.'));
  var la = sel('licAct'), ck = function(a){ return box(la.indexOf(a) >= 0, a); };
  nodes.push({k: 'p', al: 'left', after: 40, t: '1.10. Atividades Licenciadas:'});
  nodes.push({k: 'tbl', cols: [1870, 1871, 1871, 1871, 1871], rows: [[ck('Distribuir'), ck('Transportar') + '\n' + ck('Transporte próprio') + '\n' + ck('Transporte para terceiros'), ck('Importar'), ck('Armazenar') + '\n' + ck('Armazenamento próprio') + '\n' + ck('Armazenamento para terceiros'), ck('Expedir')]]});
  campo('1.11.', 'Relação dos demais estabelecimentos', p.outros || 'Não se aplica'); campo('1.12.', 'Documentos anexos', p.docsAnexos || 'Não há.');
  {var q1 = respondidas('1'); if(q1.length) bloco('1'); }
  /* 2 */
  it(2, 'Dados da autorização de funcionamento');
  var aut = function(n, rot, num, sit, dt, re){ if(sit === 'Não possui' || sit === 'Não se aplica'){ nodes.push({k: 'p', al: 'left', runs: [[n + ' ', {b: true}], [rot + ': ' + (sit === 'Não possui' ? 'não possui.' : 'não aplicável.'), {}]]}); return; }
   nodes.push({k: 'p', al: 'left', runs: [[n + ' ', {b: true}], [rot + ' n° ' + (tx(num) || '—') + ' publicada em ' + (data(dt) || '—') + (tem(re) ? ' (RE nº ' + tx(re) + ')' : '') + '.', {}]]}); };
  aut('2.1.', 'Autorização de Funcionamento', m.afe, p.afeSit, p.afeData, p.afeRe);
  nodes.push({k: 'p', al: 'left', after: 40, runs: [['2.2. ', {b: true}], ['Atividades:', {}]]}, linhaAtiv(sel('afeAct')));
  aut('2.3.', 'Autorização Especial', m.ae, p.aeSit || (tem(m.ae) ? '' : 'Não se aplica'), p.aeData, p.aeRe);
  nodes.push({k: 'p', al: 'left', after: 40, runs: [['2.4. ', {b: true}], ['Atividades:', {}]]}, linhaAtiv(sel('aeAct')));
  {var q2 = respondidas('2'); if(q2.length) bloco('2'); }
  /* 3 */
  it(3, 'Dados da inspeção');
  campo('3.1.', 'Período', periodo(p.inicio || m.data, p.fim || p.inicio || m.data), true);
  campo('3.2.', 'Objetivo da inspeção', p.objetivo || A.D.relatorio.objetivo, true);
  var primeira = p.primeira === 'Sim'; campo('3.3.', 'Período da última inspeção', primeira ? '—' : p.ultima, true);
  pp(box(primeira, 'O estabelecimento está sendo inspecionado pela primeira vez.'));
  /* 4 */
  it(4, 'Pessoas contactadas');
  var cont = linhas(p.contatos); if(!cont.length && tem(m.acompanhou)) cont = [[tx(m.acompanhou), '', '']];
  (cont.length ? cont : [['', '', '']]).forEach(function(c){ nodes.push({k: 'p', al: 'left', t: 'Nome: ' + (c[0] || '') + '      Cargo: ' + (c[1] || '') + '      Contato: ' + (c[2] || '')}); });
  /* 5 e 6 */
  it(5, 'Informações gerais'); bloco('5', p.gerais);
  it(6, 'Não conformidades anteriores'); paras(p.anteriores).forEach(pp); if(!tem(p.anteriores)) pp(primeira ? 'Não se aplica: primeira inspeção.' : 'Não informado.');
  /* 7 */
  it(7, 'Terceirização e prestação de serviços');
  var ter = linhas(p.terceiros);
  if(ter.length) nodes.push({k: 'tbl', head: true, cols: [1900, 2000, 1500, 1150, 1150, 1654], rows: [['Atividades Terceirizadas', 'Empresa(s) Contratada(s)', 'CNPJ', 'AFE', 'AE', 'Produto/Ensaio']].concat(ter.map(function(l){ return [0, 1, 2, 3, 4, 5].map(function(i){ return {t: l[i] || '', sz: 9}; }); }))});
  else pp('Não Aplicável.');
  sub('7.1'); paras(p.qualPrest).forEach(pp); if(!tem(p.qualPrest)) pp(ter.length ? 'Não informado.' : 'Não aplicável.');
  /* 8 a 12 */
  it(8, 'Pessoal'); bloco('8'); sub('8.1'); bloco('8.1', p.higiene);
  it(9, 'Áreas físicas'); ['9.1', '9.2', '9.3'].forEach(function(k){ sub(k); bloco(k); });
  it(10, 'Transporte'); bloco('10'); sub('10.1'); bloco('10.1');
  it(11, 'Sistema de gestão da qualidade'); bloco('11'); ['11.1', '11.2', '11.3', '11.4', '11.5', '11.6', '11.7', '11.8', '11.9'].forEach(function(k){ sub(k); bloco(k); });
  it(12, 'Controle de qualidade');
  if(sel('licAct').indexOf('Importar') < 0 && !['12.1', '12.2', '12.3', '12.4', '12.5'].some(function(k){ return respondidas(k).length; })) pp('Não aplicável: item exclusivo de estabelecimentos importadores, e o estabelecimento não realiza importação.');
  else ['12.1', '12.2', '12.3', '12.4', '12.5'].forEach(function(k){ sub(k); bloco(k); });
  /* 13 */
  it(13, 'Considerações finais / avaliação de riscos');
  paras(p.risco).forEach(pp);
  if(L.length) nodes.push({k: 'tbl', head: true, cols: [700, 4854, 2400, 1400], rows: [['Nº', 'Não conformidade', 'Norma e artigo', 'Categoria']].concat(L.map(function(n){ return [String(n.num), n.texto, n.legal, n.e.cat || 'Não categorizada'].map(function(t){ return {t: t, sz: 9}; }); }))});
  if(!tem(p.risco) && !L.length) pp('Não foram constatadas não conformidades.'); else if(!tem(p.risco)) pp('Avaliação de risco não informada.');
  /* 14 */
  it(14, 'Conclusão');
  nodes.push({k: 'p', al: 'left', t: p.emAtividade === 'Não' ? 'Estabelecimento em atividade: não.' : 'Estabelecimento em atividade'});
  nodes.push({k: 'tbl', cols: [4677, 4677], rows: CLASSES.map(function(c){ return [{runs: [[c[0] + ' ' + c[1] + ' ' + (p.classificacao === c[1] ? '☒' : '☐'), {b: true}]]}, {runs: [[c[2] + ' ATIVIDADES(S): ', {b: true}], [p.classificacao === c[1] ? tx(p.ativConclusao) : '', {}]]}]; })});
  /* 15 a 19 */
  it(15, 'Medidas adotadas/ documentos emitidos');
  var med = [];
  if(p.anexo2Em) med.push('Emitido e entregue à empresa o Formulário de Comunicação de Não Conformidades (Anexo II do POP-O-SNVS-011) em ' + data(p.anexo2Em) + (p.e2data ? ', recebido em ' + data(p.e2data) : '') + '.');
  if(L.length && tem(p.planoRecebido)) med.push('O plano de ação apresentado pela empresa, recebido em ' + data(p.planoRecebido) + (tem(p.planoSei) ? ' (' + tx(p.planoSei) + ')' : '') + ', foi analisado pela equipe inspetora.');
  med.forEach(pp); paras(p.medidas).forEach(pp); if(!med.length && !tem(p.medidas)) pp('Não informado.');
  it(16, 'Anexos');
  if(L.length && tem(p.planoRecebido)) pp('Análise do plano de ação, em documento próprio.');
  paras(p.anexos).forEach(pp); if(!(L.length && tem(p.planoRecebido)) && !tem(p.anexos)) pp('Não há.');
  it(17, 'Equipe inspetora');
  var eq = equipe(); nodes.push({k: 'tbl', head: true, cols: [4200, 2000, 3154], rows: [['Inspetores/ Instituição', 'Matrícula', 'Assinatura']].concat((eq.length ? eq : [{}]).map(function(e){ return [(e.nome || '') + (e.inst ? '\n' + e.inst : ''), e.mat || '', '\n\n']; }))});
  it(18, 'Registro de revisão pelo par técnico');
  var pr = p.par; pp(pr.nome && pr.data && pr.status ? 'Revisão realizada por ' + pr.nome + ' em ' + data(pr.data) + '. Resultado: ' + pr.status.toLowerCase() + '.' : 'Pendente.');
  it(19, 'Registro de entrega do relatório, termos e autos');
  pp('19.1 Termos e autos entregues: ' + (tx(p.e1termos) || '______________________________________')); pp('19.2 Recebido em: ' + (data(p.e1data) || '____/____/______') + '.'); pp('19.3 Nome do Responsável Legal ou Técnico: ' + (tx(p.e1nome) || '______________________________________')); pp('19.4 Documento de identificação: ' + (tx(p.e1doc) || '______________________________')); pp('19.5 Assinatura: ______________________________________');
  return nodes; }
 function pendI(){ var p = P(), m = M(), o = [];
  if(!tem(p.orgao)) o.push('Capa: informe o órgão de vigilância sanitária.');
  if(!p.unidade) o.push('Item 1.3: marque Matriz ou Filial.');
  if(!p.licSit) o.push('Item 1.9: informe se o estabelecimento possui licença.');
  if(p.licSit !== 'Não possui' && !sel('licAct').length) o.push('Item 1.10: marque as atividades licenciadas.');
  if(p.afeSit !== 'Não possui' && !sel('afeAct').length) o.push('Item 2.2: marque as atividades da AFE.');
  if(!tem(p.inicio) && !tem(m.data)) o.push('Item 3.1: informe o período da inspeção.');
  if(p.primeira !== 'Sim' && !tem(p.ultima)) o.push('Item 3.3: informe o período da última inspeção ou marque primeira inspeção.');
  if(!p.classificacao) o.push('Item 14: escolha a classificação (14.1, 14.3 ou 14.4).');
  ncs().forEach(function(n){ if(!n.e.cat) o.push('Não conformidade nº ' + n.num + ': falta a categoria.'); });
  if(!equipe().length) o.push('Item 17: informe a equipe inspetora.');
  return o; }

 /* ---------- Anexo II ---------- */
 function anexoII(){ var m = M(), p = P(), L = ncs(), eq = equipe(), nodes = [];
  capa(nodes, 'Formulário de Comunicação de Não Conformidades', false);
  nodes.push({k: 'h1', n: 1, t: 'Identificação da empresa'});
  nodes.push({k: 'p', al: 'left', runs: [['1.1. Razão Social: ', {b: true}], [m.razao || '', {}]]}, {k: 'p', al: 'left', runs: [['1.2. CNPJ: ', {b: true}], [(m.cnpj || '') + '     ' + box(p.unidade === 'Matriz', 'Matriz') + '     ' + box(p.unidade === 'Filial', 'Filial'), {}]]}, {k: 'p', al: 'left', runs: [['1.3. Endereço: ', {b: true}], [m.endereco || '', {}]]}, {k: 'p', al: 'left', runs: [['1.4. País: ', {b: true}], ['Brasil', {}]]});
  nodes.push({k: 'h1', n: 2, t: 'Inspeção'}, {k: 'p', al: 'left', runs: [['Período: ', {b: true}], [periodo(p.inicio || m.data, p.fim || p.inicio || m.data), {}]]});
  nodes.push({k: 'h1', n: 3, t: 'Equipe inspetora'}); (eq.length ? eq : [{}, {}]).forEach(function(e){ nodes.push({k: 'p', al: 'left', after: 40, runs: [['Nome do inspetor: ', {b: true}], [e.nome || '', {}]]}, {k: 'p', al: 'left', runs: [['Código do inspetor: ', {b: true}], [e.mat || '', {}]]}); });
  nodes.push({k: 'h1', n: 4, t: 'Não conformidades'});
  if(!L.length) nodes.push({k: 'p', t: 'Não foram constatadas não conformidades.'});
  L.forEach(function(n){ nodes.push({k: 'p', al: 'left', after: 60, runs: [['Não conformidade nº ' + n.num, {b: true}]]});
   nodes.push({k: 'tbl', cols: [2600, 6754], rows: [['Norma e Artigo Infringido', n.legal], ['Requisito regulamentar descumprido com a evidência', n.texto]]});
   nodes.push({k: 'tbl', cols: [2600, 6754], rows: [['Situação da NC', ['Finalizada', 'Em andamento'].map(function(v){ return box(n.e.sit === v, v); }).join('\n')]]});
   nodes.push({k: 'tbl', cols: [2600, 6754], rows: [['Estratégia de Monitoramento', MONITOR.map(function(v){ return box(n.e.mon === v, v); }).join('\n')]]}); });
  nodes.push({k: 'h1', n: 5, t: 'Assinaturas'});
  nodes.push({k: 'tbl', head: true, cols: [2900, 2300, 1800, 2354], rows: [['Nome do Inspetor\n(informar se o inspetor atuou como observador)', 'Nome/Sigla da Instituição\n(a qual o inspetor pertence)', 'Esfera de Atuação do Inspetor\n(Federal, Estadual ou Municipal)', 'Assinatura'].map(function(t){ return {t: t, al: 'center'}; })].concat((eq.length ? eq : [{}, {}]).map(function(e){ return [e.nome || '', e.inst || '', e.esfera || '', '\n\n']; }))});
  nodes.push({k: 'h1', n: 6, t: 'Registro de entrega do formulário, relatório, termos e autos'});
  nodes.push({k: 'p', al: 'left', t: 'Termos e autos entregues: ' + (tx(p.e2termos) || '______________________________________________')}, {k: 'p', al: 'left', t: 'Recebido em: ' + (data(p.e2data) || '____/____/______') + '.'}, {k: 'p', al: 'left', t: 'Nome e título do responsável pelo recebimento do relatório: ' + (tx(p.e2nome) || '________________________________')}, {k: 'p', al: 'left', t: 'Documento de identificação: ' + (tx(p.e2doc) || '______________________________')}, {k: 'p', al: 'left', t: 'Assinatura: ______________________________________'});
  return nodes; }
 function pendII(){ var o = []; if(!tem(P().orgao)) o.push('Capa: informe o órgão de vigilância sanitária.'); if(!equipe().length) o.push('Informe a equipe inspetora.');
  ncs().forEach(function(n){ if(!n.e.sit) o.push('Não conformidade nº ' + n.num + ': falta a situação.'); if(!n.e.mon) o.push('Não conformidade nº ' + n.num + ': falta a estratégia de monitoramento.'); }); return o; }

 /* ---------- análise do plano de ação (sem modelo oficial: POP-O-SNVS-011, item 8.3) ---------- */
 function plano(){ var m = M(), p = P(), L = ncs(), nodes = [];
  nodes.push({k: 'p', al: 'center', after: 40, runs: [[p.orgao || '', {b: true, sz: 11}]]}, {k: 'p', al: 'center', after: 200, runs: [['ANÁLISE DO PLANO DE AÇÃO', {b: true, sz: 14}]]});
  nodes.push({k: 'p', al: 'left', runs: [['Estabelecimento: ', {b: true}], [(m.razao || '') + (tem(m.cnpj) ? ' — CNPJ ' + m.cnpj : ''), {}]]}, {k: 'p', al: 'left', runs: [['Inspeção: ', {b: true}], [periodo(p.inicio || m.data, p.fim || p.inicio || m.data), {}]]}, {k: 'p', al: 'left', runs: [['Plano de ação recebido em: ', {b: true}], [(data(p.planoRecebido) || '—') + (tem(p.planoSei) ? ' (' + tx(p.planoSei) + ')' : ''), {}]]});
  if(!L.length) nodes.push({k: 'p', t: 'Não foram constatadas não conformidades.'});
  L.forEach(function(n){ var e = n.e; nodes.push({k: 'p', al: 'left', before: 160, after: 60, runs: [['Não conformidade nº ' + n.num + (e.cat ? ' — ' + e.cat.toLowerCase() : ''), {b: true}]]});
   nodes.push({k: 'tbl', cols: [2600, 6754], rows: [['Norma e Artigo Infringido', n.legal], ['Requisito descumprido e evidência', n.texto], ['Ação proposta pela empresa', tx(e.acao)], ['Prazo', tx(e.prazo)], ['Avaliação da equipe inspetora', ['Aceita', 'Aceita com ressalva', 'Não aceita'].map(function(v){ return box(e.aval === v, v); }).join('     ')], ['Comentários', tx(e.coment)], ['Situação da NC', ['Finalizada', 'Em andamento'].map(function(v){ return box(e.sit === v, v); }).join('     ')], ['Estratégia de Monitoramento', MONITOR.map(function(v){ return box(e.mon === v, v); }).join('\n')]]}); });
  nodes.push({k: 'p', al: 'left', before: 200, runs: [['Classificação do estabelecimento: ', {b: true}], [p.classificacao || '—', {}]]});
  paras(p.planoConclusao).forEach(function(t){ nodes.push({k: 'p', t: t}); });
  var eq = equipe(); nodes.push({k: 'tbl', head: true, cols: [4200, 2000, 3154], rows: [['Inspetores/ Instituição', 'Matrícula', 'Assinatura']].concat((eq.length ? eq : [{}]).map(function(e){ return [(e.nome || '') + (e.inst ? '\n' + e.inst : ''), e.mat || '', '\n\n']; }))});
  return nodes; }
 function pendPlano(){ var o = []; if(!tem(P().planoRecebido)) o.push('Informe a data de recebimento do plano de ação.');
  ncs().forEach(function(n){ if(!tem(n.e.acao)) o.push('Não conformidade nº ' + n.num + ': falta a ação proposta.'); if(!n.e.aval) o.push('Não conformidade nº ' + n.num + ': falta a avaliação.'); }); return o; }

 /* ---------- Anexo III ---------- */
 function anexoIII(){ var m = M(), p = P(), pr = p.par, eq = equipe(), nodes = [], C = [5354, 2000, 2000];
  var barra = function(t){ return [{t: t, b: true, span: 3}]; }, uma = function(t){ return [{t: t, span: 3}]; };
  var meio = function(a, b, c){ return [{t: a, sb: 'tbr'}, Object.assign({al: 'center', sb: 'tblr'}, b), Object.assign({al: 'center', sb: 'tbl'}, c)]; };
  capa(nodes, 'Formulário de Revisão por Par Técnico', false);
  nodes.push({k: 'tbl', cols: C, rows: [barra('I. Dados do Estabelecimento'), uma('Nome da empresa: ' + (m.razao || '') + '\n\nCNPJ: ' + (m.cnpj || '') + '                    Data da Inspeção: ' + periodo(p.inicio || m.data, p.fim || p.inicio || m.data) + '\n'),
   barra('II. Itens avaliados'), [{t: '', sb: 'br'}, {t: 'Os itens avaliados estão adequados?', b: true, span: 2, al: 'center', sb: 'bl'}], meio('', {t: 'Sim', b: true}, {t: 'Não', b: true})]
   .concat(EIXOS.map(function(a){ return meio(a[1], {t: pr.eixos[a[0]] === 'Sim' ? '☒' : '☐'}, {t: pr.eixos[a[0]] === 'Não' ? '☒' : '☐'}); }))
   .concat([barra('III. Nome da Equipe Inspetora'), uma((eq.length ? eq : [{}]).map(function(e){ return 'Nome: ' + (e.nome || ''); }).join('\n\n')),
   barra('IV. Identificação do Par Técnico'), uma('Nome do Par Técnico: ' + (pr.nome || '') + '\n\nData da Devolução: ' + (data(pr.data) || '____/____/______') + '\n'),
   barra('V. Comentários (obrigatório o preenchimento no caso de reprovação)'), uma(tx(pr.coment) + '\n\n'),
   barra('VI. Status Final'), [{t: '          ' + box(pr.status === 'Aprovado', 'Aprovado'), sb: 'r'}, {t: box(pr.status === 'Reprovado', 'Reprovado'), span: 2, sb: 'l'}]])});
  return nodes; }

 /* ---------- tela ---------- */
 function e(t){ return A.esc(t); }
 function cmp(k, rot, tipo, dica){ var v = P()[k], a = ' data-p11="' + k + '"';
  if(tipo === 'area') return '<label class="pu-campo rs-campo rs-largo"><span>' + e(rot) + (dica ? ' <small>' + e(dica) + '</small>' : '') + '</span><textarea rows="3"' + a + '>' + e(v || '') + '</textarea></label>';
  if(Array.isArray(tipo)) return '<label class="pu-campo rs-campo"><span>' + e(rot) + '</span><select' + a + '><option value=""></option>' + tipo.map(function(o){ return '<option' + (v === o ? ' selected' : '') + '>' + e(o) + '</option>'; }).join('') + '</select></label>';
  return '<label class="pu-campo rs-campo"><span>' + e(rot) + (dica ? ' <small>' + e(dica) + '</small>' : '') + '</span><input type="' + (tipo || 'text') + '"' + a + ' value="' + e(v || '') + '"></label>'; }
 function marcas(k, rot, ops){ var v = sel(k); return '<div class="pu-campo rs-campo rs-largo"><span>' + e(rot) + '</span><div class="p11-chk">' + ops.map(function(o){ return '<label><input type="checkbox" data-p11-chk="' + k + '|' + e(o) + '"' + (v.indexOf(o) >= 0 ? ' checked' : '') + '> ' + e(o) + '</label>'; }).join('') + '</div></div>'; }
 function grupo(id, tit, corpo){ return '<details class="p11-g" data-p11-g="' + id + '"' + (aberto[id] ? ' open' : '') + '><summary>' + e(tit) + '</summary><div class="pu-campos">' + corpo + '</div></details>'; }
 function ncHtml(n){ var a = function(c){ return ' data-p11-nc="' + e(n.id) + '|' + c + '"'; }, s = function(c, ops){ return '<select' + a(c) + '><option value=""></option>' + ops.map(function(o){ return '<option' + (n.e[c] === o ? ' selected' : '') + '>' + e(o) + '</option>'; }).join('') + '</select>'; };
  return '<div class="p11-nc"><p><b>Não conformidade nº ' + n.num + '</b> — ' + e(n.texto) + ' <small>' + e(n.legal) + '</small></p><div class="pu-campos">'
   + '<label class="pu-campo rs-campo"><span>Categoria <small>(POP-O-SNVS-032)</small></span>' + s('cat', CATEG) + '</label>'
   + '<label class="pu-campo rs-campo"><span>Situação da NC</span>' + s('sit', ['Finalizada', 'Em andamento']) + '</label>'
   + '<label class="pu-campo rs-campo rs-largo"><span>Estratégia de monitoramento</span>' + s('mon', MONITOR) + '</label>'
   + '<label class="pu-campo rs-campo rs-largo"><span>Plano de ação — ação proposta pela empresa</span><textarea rows="2"' + a('acao') + '>' + e(n.e.acao || '') + '</textarea></label>'
   + '<label class="pu-campo rs-campo"><span>Prazo</span><input type="text"' + a('prazo') + ' value="' + e(n.e.prazo || '') + '"></label>'
   + '<label class="pu-campo rs-campo"><span>Avaliação do plano</span>' + s('aval', ['Aceita', 'Aceita com ressalva', 'Não aceita']) + '</label>'
   + '<label class="pu-campo rs-campo rs-largo"><span>Comentários da equipe</span><textarea rows="2"' + a('coment') + '>' + e(n.e.coment || '') + '</textarea></label></div></div>'; }
 function painelHtml(){ var L = ncs(), pr = P().par;
  return '<h3>Documentos nos modelos da Anvisa (POP-O-SNVS-011 rev. 3)</h3><p>Relatório de inspeção (Anexo I), comunicação de não conformidades (Anexo II), análise do plano de ação e revisão por par técnico (Anexo III). Os dados do estabelecimento e as respostas vêm do roteiro; complete abaixo o que só existe nos modelos.</p>'
   + grupo('ident', 'Capa e itens 1 a 4 do relatório', cmp('orgao', 'Órgão de vigilância sanitária') + cmp('cidade', 'Cidade', 'text', '(padrão: São Paulo)') + cmp('dataRel', 'Data do relatório', 'date') + cmp('unidade', 'Matriz ou filial', ['Matriz', 'Filial']) + cmp('fone', 'Fone') + cmp('email', 'E-mail')
    + cmp('licSit', 'Licença de funcionamento', ['Possui', 'Não possui']) + cmp('licData', 'Data da licença', 'date') + marcas('licAct', 'Atividades licenciadas (item 1.10)', LIC) + cmp('outros', 'Demais estabelecimentos da empresa', 'area') + cmp('docsAnexos', 'Documentos anexos', 'area')
    + cmp('afeSit', 'AFE', ['Possui', 'Não possui']) + cmp('afeData', 'AFE publicada em', 'date') + cmp('afeRe', 'AFE — RE nº') + marcas('afeAct', 'Atividades da AFE (item 2.2)', ATIV)
    + cmp('aeSit', 'AE', ['Possui', 'Não possui', 'Não se aplica']) + cmp('aeData', 'AE publicada em', 'date') + cmp('aeRe', 'AE — RE nº') + marcas('aeAct', 'Atividades da AE (item 2.4)', ATIV)
    + cmp('inicio', 'Início da inspeção', 'date') + cmp('fim', 'Fim da inspeção', 'date') + cmp('objetivo', 'Objetivo da inspeção', 'area', '(se vazio, sai o objetivo padrão do roteiro)') + cmp('primeira', 'Primeira inspeção?', ['Sim', 'Não']) + cmp('ultima', 'Período da última inspeção')
    + cmp('contatos', 'Pessoas contactadas', 'area', '(uma por linha: Nome; Cargo; Contato)') + cmp('equipe', 'Equipe inspetora', 'area', '(uma por linha: Nome; Instituição; Matrícula; Esfera)'))
   + grupo('texto', 'Itens descritivos (5 a 8, 13 a 16)', cmp('gerais', '5. Informações gerais', 'area') + cmp('anteriores', '6. Não conformidades anteriores', 'area') + cmp('terceiros', '7. Terceirização e prestação de serviços', 'area', '(uma por linha: Atividade; Empresa; CNPJ; AFE; AE; Produto/Ensaio)') + cmp('qualPrest', '7.1 Qualificação do prestador de serviço', 'area') + cmp('higiene', '8.1 Higiene pessoal e saúde do trabalhador', 'area')
    + cmp('risco', '13. Considerações finais / avaliação de riscos', 'area') + cmp('emAtividade', 'Estabelecimento em atividade?', ['Sim', 'Não']) + cmp('classificacao', '14. Classificação', CLASSES.map(function(c){ return c[1]; })) + cmp('ativConclusao', '14. Atividade(s) alvo da inspeção', 'area') + cmp('medidas', '15. Medidas adotadas / documentos emitidos', 'area') + cmp('anexos', '16. Anexos', 'area'))
   + grupo('nc', 'Não conformidades e plano de ação (' + L.length + ')', (L.length ? '<div class="rs-largo">' + L.map(ncHtml).join('') + '</div>' : '<p class="rs-largo">Nenhuma resposta “Não” no roteiro.</p>') + cmp('anexo2Em', 'Anexo II emitido em', 'date') + cmp('planoRecebido', 'Plano de ação recebido em', 'date') + cmp('planoSei', 'Processo / protocolo do plano') + cmp('planoConclusao', 'Conclusão da análise do plano', 'area'))
   + grupo('par', 'Revisão por par técnico (Anexo III)', '<label class="pu-campo rs-campo"><span>Nome do par técnico</span><input type="text" data-p11-par="nome" value="' + e(pr.nome || '') + '"></label><label class="pu-campo rs-campo"><span>Data da devolução</span><input type="date" data-p11-par="data" value="' + e(pr.data || '') + '"></label>'
    + EIXOS.map(function(a){ return '<label class="pu-campo rs-campo"><span>' + e(a[1]) + '</span><select data-p11-eixo="' + a[0] + '"><option value=""></option>' + ['Sim', 'Não'].map(function(o){ return '<option' + (pr.eixos[a[0]] === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></label>'; }).join('')
    + '<label class="pu-campo rs-campo"><span>Status final</span><select data-p11-par="status"><option value=""></option>' + ['Aprovado', 'Reprovado'].map(function(o){ return '<option' + (pr.status === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></label><label class="pu-campo rs-campo rs-largo"><span>Comentários <small>(obrigatório na reprovação)</small></span><textarea rows="2" data-p11-par="coment">' + e(pr.coment || '') + '</textarea></label>')
   + grupo('entrega', 'Registros de entrega', cmp('e2termos', 'Anexo II — termos e autos entregues') + cmp('e2data', 'Anexo II — recebido em', 'date') + cmp('e2nome', 'Anexo II — nome e título de quem recebeu') + cmp('e2doc', 'Anexo II — documento de identificação')
    + cmp('e1termos', 'Relatório — termos e autos entregues') + cmp('e1data', 'Relatório — recebido em', 'date') + cmp('e1nome', 'Relatório — responsável legal ou técnico') + cmp('e1doc', 'Relatório — documento de identificação'))
   + '<div class="pu-acoes-item"><button type="button" class="pu-btn pu-btn-pri" data-p11-doc="I">Relatório — Anexo I</button><button type="button" class="pu-btn" data-p11-doc="II">Comunicação de NC — Anexo II</button><button type="button" class="pu-btn" data-p11-doc="plano">Análise do plano de ação</button><button type="button" class="pu-btn" data-p11-doc="III">Par técnico — Anexo III</button></div><p class="pu-q-ajuda" data-p11-msg></p>'; }
 function emite(k){ var p = P(), pend = k === 'I' ? pendI() : k === 'II' ? pendII() : k === 'plano' ? pendPlano() : [];
  if(k === 'III' && p.par.status === 'Reprovado' && !tem(p.par.coment)){ alert('Comentários são obrigatórios quando a revisão é reprovada.'); return Promise.resolve(); }
  if(pend.length && !confirm('Há pendências:\n\n' + pend.join('\n') + '\n\nBaixar mesmo assim?')) return Promise.resolve();
  if(k === 'II' && !p.anexo2Em){ p.anexo2Em = new Date().toISOString().slice(0, 10); A.salva(); }
  if(k === 'I') return baixa(anexoI(), RODAPE.I, true, nomeArq('Relatorio_Anexo_I'));
  if(k === 'II') return baixa(anexoII(), RODAPE.II, false, 'Anexo_II_POP_011_Comunicacao_NC.docx');
  if(k === 'plano') return baixa(plano(), 'Análise do plano de ação', true, nomeArq('Analise_Plano_de_Acao'));
  return baixa(anexoIII(), RODAPE.III, false, 'Anexo_III_POP_011_Revisao_Par_Tecnico.docx'); }
 function estilo(){ if(document.getElementById('p11-css')) return; var st = document.createElement('style'); st.id = 'p11-css';
  st.textContent = '.p11-g{border:1px solid #d5dde3;border-radius:10px;margin:8px 0;padding:0 12px;background:#fff}.p11-g>summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:700}.p11-g[open]{padding-bottom:12px}.p11-chk{display:flex;flex-wrap:wrap;gap:6px 16px}.p11-chk label{display:flex;align-items:center;gap:6px;min-height:36px;font-weight:400}.p11-nc{border-top:1px solid #e3e8ec;padding:10px 0}.p11-nc p{margin:0 0 8px}.p11-nc small{color:#5b6b78}';
  document.head.appendChild(st); }
 function painel(el, api){ A = api; estilo();
  var d = document.createElement('div'); d.className = 'pu-bloco p11'; d.innerHTML = painelHtml();
  var ref = el.querySelector('.rs-relatorio'); if(ref) el.insertBefore(d, ref); else el.appendChild(d);
  d.addEventListener('toggle', function(ev){ var g = ev.target && ev.target.dataset && ev.target.dataset.p11G; if(g) aberto[g] = ev.target.open; }, true);
  var grava = function(ev){ var t = ev.target, ds = t.dataset || {}, p = P();
   if(ds.p11 !== undefined) p[ds.p11] = t.value;
   else if(ds.p11Chk !== undefined){ var kv = ds.p11Chk.split('|'), L = sel(kv[0]).filter(function(v){ return v !== kv[1]; }); if(t.checked) L.push(kv[1]); p[kv[0]] = L; }
   else if(ds.p11Nc !== undefined){ var nc = ds.p11Nc.split('|'); p.nc[nc[0]] = p.nc[nc[0]] || {}; p.nc[nc[0]][nc[1]] = t.value; }
   else if(ds.p11Par !== undefined) p.par[ds.p11Par] = t.value;
   else if(ds.p11Eixo !== undefined) p.par.eixos[ds.p11Eixo] = t.value;
   else return;
   A.salva(); };
  d.addEventListener('input', grava); d.addEventListener('change', grava);
  d.addEventListener('click', function(ev){ var b = ev.target.closest && ev.target.closest('[data-p11-doc]'); if(b) emite(b.dataset.p11Doc); }); }
 window.RsPop011 = {painel: painel, nos: function(k){ return k === 'I' ? anexoI() : k === 'II' ? anexoII() : k === 'plano' ? plano() : anexoIII(); }, texto: function(k){ return window.RsPop011.nos(k).map(nodeTexto).join('\n'); }, pendencias: function(k){ return k === 'I' ? pendI() : k === 'II' ? pendII() : pendPlano(); }, emite: emite};
})();
