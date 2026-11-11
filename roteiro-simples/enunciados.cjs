'use strict';
/* Enunciado das perguntas com lista de itens (padrão do núcleo Medicamentos de 10/11/2026, levado aos
   demais roteiros do motor em 11/11/2026): o enunciado pergunta pelo conjunto (“… atende aos requisitos?”)
   e os itens ficam só na lista, que acompanha a resposta. Antes o enunciado enumerava o que a lista
   repetia logo abaixo. Só muda o texto da tela (q.t); as frases do relatório (q.c, q.nc, ncPontos) e as
   citações não mudam.
   enunciados(D, {idDaPergunta: 'novo enunciado'}, {opcional: true}) — com opcional, ids que o roteiro
   não tem são ignorados (famílias de roteiros que compartilham parte das perguntas). */
module.exports = function enunciados(D, TEXTO, o) {
  const P = {};
  D.secoes.forEach(s => s.itens.forEach(i => (i.perguntas || []).forEach(q => { P[q.id] = q; })));
  for (const [id, t] of Object.entries(TEXTO)) {
    const q = P[id];
    if (!q) { if (o && o.opcional) continue; throw Error((D.app || '') + ': pergunta inexistente — ' + id); }
    if (!q.pontos) throw Error((D.app || '') + ': pergunta sem lista de itens — ' + id);
    if (!/\?$/.test(t)) throw Error((D.app || '') + ': enunciado sem interrogação — ' + id);
    q.t = t;
  }
  return D;
};
