'use strict';
/* Fixa um campo de perfil num roteiro do motor roteiro-simples (09/11/2026): gera a
   versão específica de um roteiro geral — p. ex., Vacinação e EAC só em drogaria, no
   núcleo Medicamentos — sem a pergunta do tipo de estabelecimento. O campo sai da
   identificação e cada condição sobre ele é resolvida aqui:
   - se (item, pergunta, campo, infração): vale → a condição sai; não vale → o elemento sai;
   - naSe (pergunta): vale → a pergunta seria sempre “Não se aplica” e sai; não vale → a condição sai;
   - normas [nome, texto, condição]: vale → fica sem condição; não vale → sai.
   Devolve uma cópia; o roteiro geral não muda. */
function fixa(D0, campo, valor) {
  const D = JSON.parse(JSON.stringify(D0));
  const vale = c => c.igual !== undefined ? c.igual === valor : c.em ? c.em.includes(valor) : c.inclui !== undefined ? false : true;
  const sobre = c => c && typeof c === 'object' && c.campo === campo;
  const fica = o => {
    if (sobre(o.se)) { if (!vale(o.se)) return false; delete o.se; }
    if (sobre(o.naSe)) { if (vale(o.naSe)) return false; delete o.naSe; delete o.na; }
    return true;
  };
  D.normas = (D.normas || []).filter(n => !(Array.isArray(n) && sobre(n[2]) && !vale(n[2]))).map(n => Array.isArray(n) && sobre(n[2]) ? n.slice(0, 2) : n);
  D.infracoes = (D.infracoes || []).filter(fica);
  const infs = new Set(D.infracoes.map(i => i.id));
  for (const s of D.secoes) {
    s.itens = s.itens.filter(fica);
    for (const it of s.itens) {
      if (it.campos) it.campos = it.campos.filter(c => c.id !== campo && fica(c));
      if (it.perguntas) it.perguntas = it.perguntas.filter(fica).map(q => (q.inf && (q.inf = q.inf.filter(x => infs.has(x))), q));
    }
    s.itens = s.itens.filter(it => (it.perguntas || []).length || (it.campos || []).length || it.calendario || it.conteudo || it.html || it.orient && !it.perguntas);
  }
  D.secoes = D.secoes.filter(s => s.itens.length);
  /* infração que só as perguntas retiradas usavam sai também */
  const usadas = new Set();
  for (const s of D.secoes) for (const it of s.itens) { for (const q of it.perguntas || []) (q.inf || []).forEach(x => usadas.add(x)); for (const c of it.campos || []) (c.inf || []).forEach(x => usadas.add(x)); }
  const antes = new Set((D0.infracoes || []).filter(i => (D0.secoes || []).some(s => s.itens.some(it => (it.perguntas || []).some(q => (q.inf || []).includes(i.id)) || (it.campos || []).some(c => (c.inf || []).includes(i.id))))).map(i => i.id));
  D.infracoes = D.infracoes.filter(i => usadas.has(i.id) || !antes.has(i.id));
  const resto = JSON.stringify(D);
  if (resto.includes('"campo":"' + campo + '"')) throw Error(D.app + ': condição sobre ' + campo + ' não resolvida');
  return D;
}
module.exports = {fixa};
