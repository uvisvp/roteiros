/* Drogaria em supermercado — complemento do roteiro da drogaria.
   Lei Federal nº 5.991/1973, art. 6º, §§ 2º a 7º (incluídos pela Lei nº 15.357/2026)
   e RDC Anvisa nº 44/2009, art. 13, §§ 1º e 2º.

   Gatilho: Área física › "O estabelecimento está instalado em" = área de vendas
   de supermercado (tipo_instalacao 'mercado_area_vendas'). Não há card próprio:
   é a mesma drogaria, com este bloco a mais. As respostas ficam no mesmo rascunho da
   drogaria (meta.drogaria_secoes.area_geral), então Salvas, exportação e
   relatório funcionam sem mudança.

   Ganchos chamados pelos blocos da drogaria (inseridos em build/montar.cjs):
   - __drgSuperHtml(n, a, ui): perguntas na tela da Área física;
   - __drgSuperReport(B, g, p, yes, no): parágrafo na seção 4 do relatório;
   - __drgSuperIssues(g, out, addIssue, no): irregularidades da seção 11. */
(function(){
  'use strict';
  var SUPER = 'mercado_area_vendas';
  var R = {
    p2: ['lei-5991-1973::artigo::6::paragrafo::2', 'Lei 5.991/1973, art. 6º, § 2º'],
    p3: ['lei-5991-1973::artigo::6::paragrafo::3', 'Lei 5.991/1973, art. 6º, § 3º'],
    p4: ['lei-5991-1973::artigo::6::paragrafo::4', 'Lei 5.991/1973, art. 6º, § 4º'],
    p5: ['lei-5991-1973::artigo::6::paragrafo::5', 'Lei 5.991/1973, art. 6º, § 5º'],
    a13p2: ['rdc-44-2009::artigo::13::paragrafo::2', 'RDC 44/2009, art. 13, § 2º']
  };
  /* [chave, pergunta, ref, aceita N/A, frase de conformidade, frase de irregularidade] */
  var PERGUNTAS = [
    ['sm_segregado', 'A farmácia ocupa ambiente físico delimitado, segregado e exclusivo para a atividade farmacêutica, independente dos demais setores do supermercado?', R.p2, false,
      'A farmácia ocupa ambiente físico delimitado, segregado e exclusivo para a atividade farmacêutica, independente dos demais setores do supermercado.',
      'A farmácia instalada na área de venda do supermercado não ocupa ambiente físico delimitado, segregado e exclusivo para a atividade farmacêutica, independente dos demais setores.'],
    ['sm_gondolas', 'Os medicamentos são ofertados somente dentro do espaço da farmácia, sem bancadas, estandes ou gôndolas em áreas abertas ou comunicáveis do supermercado?', R.p5, false,
      'Os medicamentos são ofertados somente dentro do espaço da farmácia, sem bancadas, estandes ou gôndolas externas.',
      'Foram constatados medicamentos ofertados fora do espaço da farmácia, em áreas abertas, comunicáveis ou sem separação funcional completa, como bancadas, estandes ou gôndolas externas.'],
    ['sm_controlados', 'Os medicamentos sujeitos a controle especial são dispensados somente após o pagamento ou levados do balcão ao caixa em embalagem lacrada, inviolável e identificável?', R.p4, true,
      'Os medicamentos sujeitos a controle especial são dispensados somente após o pagamento ou levados do balcão ao caixa em embalagem lacrada, inviolável e identificável.',
      'Os medicamentos sujeitos a controle especial não são dispensados após o pagamento nem transportados do balcão até o caixa em embalagem lacrada, inviolável e identificável.']
  ];
  var CONTRATO = ['sm_contrato', 'Foi apresentado o contrato com a farmácia ou drogaria licenciada e registrada que opera o espaço?', R.p2, false,
    'Foi apresentado o contrato com a farmácia ou drogaria licenciada que opera o espaço.',
    'Não foi apresentado o contrato que respalda a operação da farmácia no supermercado por farmácia ou drogaria licenciada e registrada.'];
  var COMUNS = [['sm_comum_sanitario', 'sanitário'], ['sm_comum_dml', 'depósito de material de limpeza'], ['sm_comum_pertences', 'local para guarda dos pertences dos funcionários']];

  function ativo(g){ return !!(g && g.fields && g.fields.tipo_instalacao === SUPER); }
  function lista(xs){ return xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' e ' + xs[xs.length - 1]; }

  window.__drgSuperHtml = function(n, a, ui){
    if(!ativo(a)) return '';
    var f = a.fields || {}, ans = a.answers || {};
    var h = '<div class="box sm-box" style="border-left:4px solid var(--uvis-tone,#1E5A8A)"><h3>Instalação na área de venda do supermercado</h3>'
      + '<p class="muted">Lei nº 5.991/1973, art. 6º, §§ 2º a 7º, incluídos pela Lei nº 15.357/2026. A presença do farmacêutico durante todo o horário (§ 3º) é verificada na Seção 1.</p>'
      + '<div class="grid">' + ui.select(n, 'sm_operacao', 'Forma de operação do espaço', [['', 'Selecione'], ['direta', 'Operada diretamente, sob a mesma identidade fiscal do supermercado'], ['contrato', 'Operada por farmácia ou drogaria licenciada, mediante contrato']]) + '</div>';
    if(f.sm_operacao === 'contrato') h += ui.question(n, CONTRATO[0], CONTRATO[1], CONTRATO[2], CONTRATO[3]);
    PERGUNTAS.forEach(function(q){ h += ui.question(n, q[0], q[1], q[2], q[3]); });
    h += '<h4>Áreas comuns do supermercado compartilhadas pela farmácia</h4><p class="muted">Permitido pela RDC 44/2009, art. 13, § 2º. Marque as que forem compartilhadas.</p><div class="check-list">'
      + COMUNS.map(function(c){ return ui.check(n, c[0], c[1].charAt(0).toUpperCase() + c[1].slice(1)); }).join('') + '</div></div>';
    return h;
  };

  window.__drgSuperReport = function(B, g, p, yes, no){
    if(!ativo(g)) return;
    var f = g.fields || {}, a = g.answers || {}, t = [];
    if(f.sm_operacao === 'direta') t.push('A farmácia está instalada na área de venda do supermercado e é operada diretamente, sob a mesma identidade fiscal.');
    else if(f.sm_operacao === 'contrato') t.push('A farmácia está instalada na área de venda do supermercado e é operada por farmácia ou drogaria licenciada, mediante contrato' + (yes(a.sm_contrato) ? ', que foi apresentado.' : no(a.sm_contrato) ? ', que não foi apresentado.' : '.'));
    else t.push('A farmácia está instalada na área de venda do supermercado.');
    PERGUNTAS.forEach(function(q){ if(yes(a[q[0]])) t.push(q[4]); else if(no(a[q[0]])) t.push(q[5]); });
    var comuns = COMUNS.filter(function(c){ return f[c[0]]; }).map(function(c){ return c[1]; });
    if(comuns.length) t.push('A farmácia compartilha com o supermercado as áreas comuns de ' + lista(comuns) + '.');
    p(B, t.join(' '));
  };

  window.__drgSuperIssues = function(g, out, addIssue, no){
    if(!ativo(g)) return;
    var a = g.answers || {};
    var qs = PERGUNTAS.slice();
    if((g.fields || {}).sm_operacao === 'contrato') qs.unshift(CONTRATO);
    qs.forEach(function(q){ if(no(a[q[0]])) addIssue(out, 'final_super_' + q[0], 2, '4 Área Física', q[5], [q[2][0]]); });
  };

})();
