  /* ——— Produtos: inventário ligado às perguntas (12/11/2026) ———
     Fragmento inserido no fim do rec--roteiro-guiado.js por scripts/repack-produtos-sugestoes.cjs.
     Cada verificação de Produtos traz em `inf` as infrações do inventário que o seu
     descumprimento configura (scripts/produtos/revisao.py). A resposta “Não” sugere essas
     infrações na própria pergunta, para marcar ali, e no topo da aba Infrações. Nada é
     marcado sem a equipe; desmarcar a infração não muda a resposta. */
  if (cfg.id === "produtos-correlatos") {
    /* fundamento por atividade (legalTipo): a trilha aberta pelo cartão usa o seu. O roteiro, o
       inventário, o relatório e o POP-O-SNVS-013 leem `legal`, que passa a ser o da atividade. */
    (function aplicaTipo() {
      const t = state.profile.type; if (!t) return;
      (cfg.sections || []).flatMap((s) => s.items || []).concat(cfg.infractions || []).forEach((o) => { if (o.legalTipo && o.legalTipo[t]) o.legal = o.legalTipo[t]; });
    })();
    const sugInf = () => {
      const m = {};
      allItems().forEach((it) => { if (state.answers[it._id] === "no") (it.inf || []).forEach((id) => { (m[id] = m[id] || []).push(it); }); });
      return m;
    };
    const anotInf = (id) => state.selectedInfractions[id] ? `<label class="pu-anot" style="display:block;margin:2px 0 12px 32px">Constatação <small>(digite ou dite)</small><textarea rows="2" data-infraction-note="${attr(id)}" placeholder="O que foi constatado, onde, documento ou produto envolvido">${esc(state.infractionNotes[id] || "")}</textarea></label>` : "";
    const linhaInf = (item, origem) => `<label class="infraction"><input type="checkbox" data-infraction="${attr(item.id)}" ${state.selectedInfractions[item.id] ? "checked" : ""}><span><strong>${esc(item.text)}</strong>${origem ? `<small class="prod-inf-origem">${esc(origem)}</small>` : ""}${item.group ? `<small>${esc(item.group)}</small>` : ""}${item.legal ? `<small>${UvisUI.textButton(citation(item.legal))}</small>` : ""}</span></label>${anotInf(item.id)}`;
    const origemInf = (lista) => "Resposta “Não”: " + lista.slice(0, 2).map((it) => it.text.replace(/\.$/, "")).join(" · ") + (lista.length > 2 ? ` · e mais ${lista.length - 2}` : "") + ".";

    renderInfractions = function () {
      const query = norm(infractionSearch);
      const sug = sugInf();
      const lista = infractionCatalog().filter((i) => matchesInfraction(i.when)).filter((i) => !query || norm(`${i.group || ""} ${i.text} ${i.legal || ""}`).includes(query));
      if (!lista.length) return `<div class="empty">Nenhuma infração encontrada.</div>`;
      const sugeridas = lista.filter((i) => sug[i.id]), resto = lista.filter((i) => !sug[i.id]);
      const bloco = (titulo, rows, aberto, classe, origem) => `<details class="uvis-inventory${classe}" ${aberto ? "open" : ""}><summary>${esc(titulo)} · ${rows.length} ${rows.length === 1 ? "item" : "itens"} · ${rows.filter((i) => state.selectedInfractions[i.id]).length} selecionados</summary><div>${rows.map((i) => linhaInf(i, origem ? origemInf(sug[i.id]) : "")).join("")}</div></details>`;
      return (sugeridas.length ? bloco("Sugeridas pelas respostas “Não”", sugeridas, true, " prod-sugeridas", true) : "")
        + [...new Set(resto.map((i) => i.group || "Infrações"))].map((g) => bloco(g, resto.filter((i) => (i.group || "Infrações") === g), !!query, "", false)).join("");
    };

    renderInfractionPanel = function () {
      if (!temInfracoes()) return;
      const catalogo = infractionCatalog().filter((i) => matchesInfraction(i.when));
      const marcadas = catalogo.filter((i) => state.selectedInfractions[i.id]).length;
      const sug = sugInf(), nSug = catalogo.filter((i) => sug[i.id]).length;
      $("#panel-infracoes").innerHTML = hero("Inventário", "Possíveis infrações",
        "Marque somente o que foi efetivamente constatado. Cada resposta “Não” no roteiro sugere a infração correspondente, que aparece no topo da lista; nada é marcado sem a decisão da equipe.", false) + `
      <div class="route-line"><span>${esc(profileSummary())}</span><span>${catalogo.length} enquadramentos disponíveis</span></div>
      <div class="toolbar"><input class="inventory-search" type="search" value="${attr(infractionSearch)}" data-infraction-search placeholder="Buscar possível infração"></div>
      <p class="report-note">${marcadas} selecionada${marcadas === 1 ? "" : "s"}.${nSug ? ` ${nSug} sugerida${nSug === 1 ? "" : "s"} pelas respostas “Não”.` : ""} As marcadas entram no relatório.</p>
      <div class="inventory-body">${renderInfractions()}</div>`;
    };

    if (PADRAO) {
      const perguntaOrig = puPergunta;
      puPergunta = function (item, n) {
        const h = perguntaOrig(item, n);
        if (state.answers[item._id] !== "no" || !(item.inf || []).length) return h;
        const cat = infractionCatalog();
        const rows = item.inf.map((id) => cat.find((i) => i.id === id)).filter((i) => i && matchesInfraction(i.when));
        if (!rows.length) return h;
        const bloco = `<div class="pu-bloco prod-inf-sug" style="margin:8px 0 4px"><p class="pu-q-ajuda" style="margin:0 0 2px"><b>Possível infração.</b> Marque se constatada: vai para a aba Infrações e para o relatório.</p>${rows.map((i) => `<label class="infraction"><input type="checkbox" data-infraction="${attr(i.id)}" ${state.selectedInfractions[i.id] ? "checked" : ""}><span><strong>${esc(i.text)}</strong></span></label>`).join("")}</div>`;
        const r = puResp(item._id), k = h.indexOf(r);
        return k < 0 ? h.replace(/\s*<\/div>\s*$/, bloco + "</div>") : h.slice(0, k + r.length) + bloco + h.slice(k + r.length);
      };
      /* a tela já aberta na aba Infrações (estado salvo) é redesenhada com as sugestões */
      try { if (UvisPadrao.estado().aba === "infracoes" && $("#panel-infracoes")) renderInfractionPanel(); else puRedesenhaItem(); } catch (e) {}
    }
  }
