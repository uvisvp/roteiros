  /* ——— Produtos no Padrão UVIS (padrao-uvis.js) ———
     Fragmento inserido no fim do rec--roteiro-guiado.js por scripts/repack-produtos-padrao.cjs.
     Troca só a tela: estado, respostas, relatório, infrações e complementos (POP-O-SNVS-013,
     consulta de regularização, CNAE) continuam os mesmos.
     · Seção 1 “Dados da inspeção”: identificação, classes e características, enquadramento e
       consultas (ponto #panel-roteiro .hero, onde os complementos se encaixam).
     · Demais seções: as etapas do roteiro agrupadas por tema; cada etapa é um item.
     · As classes não escondem etapas (decisão da equipe): etapas de classe não marcada trazem
       aviso e o botão “Marcar tudo como Não se aplica”. */
  const PADRAO = cfg.id === "produtos-correlatos" && window.UvisPadrao;
  const GRUPOS = [
    { id: "regular", titulo: "Licença e regularidade", icone: "shield", etapas: ["lic", "reg"] },
    { id: "org", titulo: "Organização e pessoal", icone: "people", etapas: ["f_gq", "f_pes", "f_saude"] },
    { id: "inst", titulo: "Instalações e água", icone: "plan", etapas: ["f_inst", "f_agua"] },
    { id: "fabr", titulo: "Produção e qualidade", icone: "lab", etapas: ["f_arm", "f_prod", "f_cq"] },
    { id: "docf", titulo: "Documentação e pós-mercado", icone: "folder", etapas: ["f_doc", "f_rec", "f_recolhe", "f_auto"] },
    { id: "oper", titulo: "Operação da distribuidora", icone: "box", etapas: ["d_rec", "d_arm", "d_qual", "d_pes"] },
    { id: "disp", titulo: "Dispositivos médicos e IVD", icone: "note", etapas: ["d_sq", "d_doc", "d_inst", "d_man", "d_capa", "d_at"] },
    { id: "transp", titulo: "Transporte", icone: "truck", etapas: ["t_veic", "t_temp", "t_rast"] },
  ];
  let ignoraClasses = !!PADRAO;
  if (PADRAO) {
    /* classes (flags) deixam de esconder etapas e itens; tipo continua valendo */
    const matchesOriginal = matches;
    matches = function (when) {
      if (!ignoraClasses || !when) return matchesOriginal(when);
      const semFlags = JSON.parse(JSON.stringify(when));
      const tira = (w) => { if (!w || typeof w !== "object") return; delete w.flagsAll; delete w.flagsAny; delete w.flagsNot; (w.any || []).forEach(tira); (w.all || []).forEach(tira); };
      tira(semFlags);
      return matchesOriginal(semFlags);
    };
  }
  function classesFaltando(when) {
    if (!when) return [];
    const falta = [];
    (when.flagsAll || []).forEach((f) => { if (!state.profile.flags[f]) falta.push(f); });
    if (when.flagsAny?.length && !when.flagsAny.some((f) => state.profile.flags[f])) falta.push(when.flagsAny[0]);
    return falta;
  }
  function nomeClasse(id) { const f = (cfg.profile.flags || []).find((x) => x.id === id); return f ? f.label.replace(/\s*\(.*$/, "") : id; }
  function etapaOriginal(id) { return (cfg.sections || []).find((s) => s.id === id); }

  function puSecoes() {
    const etapas = sections();
    const usadas = new Set();
    const dados = { id: "dados", titulo: "Dados da inspeção", curto: "Dados da inspeção", icone: "building",
      resumo: (typeDef()?.label || "Trilha") + (state.meta.establishment ? " · " + state.meta.establishment : ""),
      itens: [
        { id: "ident", titulo: "Identificação do estabelecimento", curto: "Identificação", feitos: (cfg.profile.fields || []).filter((f) => state.meta[f.id]).length, total: (cfg.profile.fields || []).length },
        { id: "classes", titulo: "Classes de produtos e características", curto: "Classes", resumo: "Registro do que o estabelecimento movimenta. Não esconde etapas do roteiro.", feitos: Object.values(state.profile.flags).some(Boolean) ? 1 : 0, total: 1 },
        { id: "enq", titulo: "Enquadramento, consultas e POP-O-SNVS-013", curto: "Enquadramento e consultas", resumo: "Regimes de regularização, CNAE, consulta de produtos e fluxo do POP-O-SNVS-013 (dispositivos/IVD)." },
      ] };
    const lista = [dados];
    GRUPOS.forEach((g) => {
      const itens = g.etapas.map((id) => etapas.find((e) => e.id === id)).filter(Boolean);
      if (!itens.length) return;
      itens.forEach((e) => usadas.add(e.id));
      lista.push({ id: g.id, titulo: g.titulo, curto: g.titulo, icone: g.icone, itens: itens.map((e) => puItemDeEtapa(e)) });
    });
    const resto = etapas.filter((e) => !usadas.has(e.id));
    if (resto.length) lista.push({ id: "outros", titulo: "Outras verificações", icone: "note", itens: resto.map((e) => puItemDeEtapa(e)) });
    return lista;
  }
  function puItemDeEtapa(e) {
    const falta = classesFaltando(etapaOriginal(e.id)?.when);
    return { id: e.id, titulo: e.title, curto: e.title, feitos: e.items.filter((i) => state.answers[i._id]).length, total: e.items.length,
      resumo: falta.length ? "Classe não marcada: " + falta.map(nomeClasse).join(", ") : "" };
  }
  function puEtapa(id) { return sections().find((s) => s.id === id); }

  function puResp(id) {
    const v = state.answers[id] || "";
    return `<div class="pu-resp" role="group" aria-label="Resposta">${[["yes", "Cumpre"], ["no", "Não cumpre"], ["na", "Não se aplica"]].map(([val, rot]) => `<button type="button" data-answer="${attr(id)}" data-value="${val}" data-v="${val}" aria-pressed="${v === val}">${rot}</button>`).join("")}</div>`;
  }
  function puPergunta(item, n) {
    return `<div class="pu-q route-item" id="item-${attr(item._id)}">
      <p class="pu-q-texto">${n ? `<b>${n}.</b> ` : ""}${esc(item.text)}</p>
      ${item.critical || item.tag ? `<div class="pu-tags">${item.critical ? `<span class="pu-tag">Atenção ao risco</span>` : ""}${item.tag ? `<span class="pu-tag">${esc(item.tag)}</span>` : ""}</div>` : ""}
      ${item.help ? `<p class="pu-q-ajuda">${esc(item.help)}</p>` : ""}
      ${item.legal ? `<span class="item-legal">${UvisUI.textButton(citation(item.legal))}</span>` : ""}
      ${puResp(item._id)}
      ${photoControls(item).replace("<details open>", "<details>").replace("<details ", "<details class=\"pu-mais\" ").replace(/^<details>/, "<details class=\"pu-mais\">")}
    </div>`;
  }
  function puItemEtapa(el, etapa) {
    const falta = classesFaltando(etapaOriginal(etapa.id)?.when);
    el.innerHTML = (etapa.description ? `<p class="pu-desc">${esc(etapa.description)}</p>` : "")
      + (falta.length ? `<div class="pu-bloco pu-aviso"><p><b>Classe não marcada:</b> ${esc(falta.map(nomeClasse).join(", "))}. Se o estabelecimento não movimenta essa classe, marque tudo como “Não se aplica”.</p><button type="button" class="btn" data-pu-na-etapa="${attr(etapa.id)}">Marcar tudo como Não se aplica</button></div>` : "")
      + etapa.items.map((it, i) => puPergunta(it, i + 1)).join("")
      + `<div class="actions pu-acoes-item"><button type="button" class="btn" data-pu-na-etapa="${attr(etapa.id)}">Marcar pendentes como Não se aplica</button></div>`;
  }
  /* Tipo de inspeção (categorias do POP-O-SNVS-013): o mesmo campo do fluxo de dispositivos
     (uvis-produtos-pop13-v1 · objetivo), agora visível nas três trilhas; sai no relatório. */
  const TIPOS_INSP = [["boas_praticas", "Boas Práticas (conforme a atividade)"], ["cto", "Condições Técnicas Operacionais (CTO)"], ["monitoramento", "Monitoramento de plano de ação"], ["investigativa", "Investigativa / fiscalização"], ["outro", "Outro"]];
  const POP13 = "uvis-produtos-pop13-v1";
  function pop13Le() { try { return JSON.parse(localStorage.getItem(POP13) || "{}") || {}; } catch (e) { return {}; } }
  function pop13Grava(mud) { const st = Object.assign(pop13Le(), mud); try { localStorage.setItem(POP13, JSON.stringify(st)); } catch (e) {} return st; }
  function tipoInspTexto(st) { st = st || pop13Le(); const t = TIPOS_INSP.find((x) => x[0] === st.objetivo); if (!t) return ""; return st.objetivo === "outro" ? (String(st.outro || "").trim() || "Outro") : t[1]; }
  function sincTipoInsp() { const t = tipoInspTexto(); if ((state.meta.tipo_inspecao || "") !== t) { state.meta.tipo_inspecao = t; saveState(); } }
  if (PADRAO && !(cfg.profile.fields || []).some((f) => f.id === "tipo_inspecao")) { cfg.profile.fields = [{ id: "tipo_inspecao", label: "Tipo de inspeção", virtual: true }].concat(cfg.profile.fields || []); }
  function puDados(el, id) {
    if (id === "ident") {
      const fixo = typeDef();
      el.innerHTML = `<div class="pu-bloco"><h3>Atividade inspecionada</h3><p>${esc(fixo?.label || "Não definida")}${fixo?.description ? " — " + esc(fixo.description) : ""}</p><p class="pu-q-ajuda">A atividade vem do cartão escolhido no núcleo. Para outra atividade, volte ao núcleo e abra o cartão correspondente.</p></div>
        <div class="pu-bloco"><h3>Tipo de inspeção</h3><p>Categorias do POP-O-SNVS-013 (Anvisa). Sai no relatório.</p><div class="pu-campos"><label>Objetivo / tipo da inspeção<select data-pu-tipo-insp><option value="">Selecione…</option>${TIPOS_INSP.map(([v, l]) => `<option value="${v}"${pop13Le().objetivo === v ? " selected" : ""}>${esc(l)}</option>`).join("")}</select></label>${pop13Le().objetivo === "outro" ? `<label>Descrever o objetivo<input data-pu-tipo-outro value="${attr(pop13Le().outro || "")}"></label>` : ""}</div></div>
        <div class="pu-bloco"><h3>Dados do estabelecimento</h3><div class="pu-campos">${(cfg.profile.fields || []).filter((f) => !f.virtual).map((f) => `<label>${esc(f.label)}${f.multiline ? `<textarea data-meta="${attr(f.id)}" placeholder="${attr(f.placeholder || "")}">${esc(state.meta[f.id] || "")}</textarea>` : `<input data-meta="${attr(f.id)}" value="${attr(state.meta[f.id] || "")}" placeholder="${attr(f.placeholder || "")}">`}</label>`).join("")}</div></div>`;
    } else if (id === "classes") {
      const flags = (cfg.profile.flags || []).filter((f) => matches(f.when));
      el.innerHTML = `<div class="pu-bloco"><h3>O que o estabelecimento movimenta</h3><p>Marque as classes e características presentes. Todas as etapas continuam no roteiro; o que não se aplicar é marcado como “Não se aplica”.</p><div class="pu-marcas">${flags.map((f) => `<label class="pu-marca"><input type="checkbox" data-flag="${attr(f.id)}" ${state.profile.flags[f.id] ? "checked" : ""}><span><strong>${esc(f.label)}</strong>${f.description ? `<small>${esc(f.description)}</small>` : ""}</span></label>`).join("")}</div></div>`;
    } else if (id === "enq") {
      /* ponto de encaixe dos complementos (regimes, CNAE, consulta, POP-O-SNVS-013) */
      el.innerHTML = `<div class="panel active pu-legado" id="panel-roteiro"><section class="hero pu-hero"><p class="eyebrow">${esc(typeDef()?.label || "")}</p><p>Consulte a regularização de produtos e empresas e, havendo dispositivos médicos/IVD, siga o fluxo do POP-O-SNVS-013 (tipo e saída da inspeção, comunicação de NC/CAPA e dados do relatório).</p></section></div>`;
      if (window.padraoCnaeHost) el.insertBefore(window.padraoCnaeHost, el.firstChild);
    }
  }

  function puRelatorio(el) {
    const c = counts();
    const sel = infractionCatalog().filter((i) => matchesInfraction(i.when) && state.selectedInfractions[i.id]).length;
    el.innerHTML = `<section class="panel active" id="panel-relatorio"><div class="pu-bloco"><h3>Resumo da inspeção</h3><p>${esc(profileSummary())}${state.meta.establishment ? " · " + esc(state.meta.establishment) : ""}</p>
      <div class="pu-campos"><div class="pu-campo">Respondidos<b>${c.answered} de ${c.total}</b></div><div class="pu-campo">Não conformidades<b>${c.nc}</b></div><div class="pu-campo">Não se aplica<b>${c.na}</b></div><div class="pu-campo">Infrações selecionadas<b>${sel}</b></div></div></div>
      <div class="actions"><button type="button" class="btn primary" data-report>Visualizar relatório</button><button type="button" class="btn" data-pu-pendente>Ir ao próximo item pendente</button></div>
      <p class="pu-q-ajuda">No relatório: “Baixar Word” gera o documento; as fotos saem à parte, no botão Fotos do cabeçalho.</p></section>`;
  }

  function puRedesenhaItem() {
    const n = UvisPadrao.estado(); const c = document.getElementById("pu-conteudo");
    if (n.aba === "roteiro" && n.item && c) { const y = window.scrollY; puDesenhaItem(n.secao, n.item, c); window.scrollTo(0, y); }
    UvisPadrao.atualiza();
  }
  function puDesenhaItem(secao, item, el) {
    if (secao === "dados") puDados(el, item);
    else { const e = puEtapa(item); if (e) puItemEtapa(el, e); else el.innerHTML = '<p class="pu-q-ajuda">Etapa não disponível.</p>'; }
  }

  function iniciaPadrao() {
    document.title = cfg.title;
    const app = $("#app");
    UvisPadrao.monta({
      raiz: app,
      titulo: typeDef()?.label || cfg.shortTitle || "Produtos",
      cor: cfg.theme || "#6b4a1f",
      abas: [{ id: "roteiro", rotulo: "Roteiro" }].concat(temInfracoes() ? [{ id: "infracoes", rotulo: "Infrações" }] : []).concat([{ id: "relatorio", rotulo: "Relatório" }]),
      secoes: puSecoes,
      item: (s, it, el) => puDesenhaItem(s.id, it.id, el),
      aba: (id, el) => {
        if (id === "infracoes") { el.innerHTML = '<section class="panel active" id="panel-infracoes"></section>'; renderInfractionPanel(); }
        else if (id === "relatorio") puRelatorio(el);
      },
      contagem: (id) => id === "roteiro" ? counts().nc : id === "infracoes" ? infractionCatalog().filter((i) => matchesInfraction(i.when) && state.selectedInfractions[i.id]).length : 0,
      limpar: async (s, it) => {
        if (s.id === "dados") { if (!it || it.id === "ident") { state.meta = clone(DEFAULT_STATE.meta); pop13Grava({ objetivo: "", outro: "" }); } if (!it || it.id === "classes") state.profile.flags = { ...defaultFlags }; saveState(); return; }
        const ids = (it ? [it.id] : s.itens.map((x) => x.id));
        for (const eid of ids) { const e = puEtapa(eid); for (const item of e?.items || []) { delete state.answers[item._id]; delete state.notes[item._id]; if (itemPhotos[item._id]) { delete itemPhotos[item._id]; try { await RoteiroEvidence.remove(cfg.storageKey, item._id); } catch (err) {} } } }
        saveState(); puRedesenhaItem();
      },
    });
    /* folha do relatório e aviso: fora da área redesenhada */
    if (!$("#print-sheet")) document.body.insertAdjacentHTML("beforeend", `<section class="print-sheet" id="print-sheet" aria-label="Relatório"><div class="print-bar"><button type="button" data-close-report>← Voltar</button><button type="button" data-word-export>Baixar Word (.docx)</button><button class="print-now" type="button" data-print>Imprimir / salvar em PDF</button></div><div class="print-body" id="print-body"></div></section><div class="toast" id="toast" role="status" aria-live="polite"></div>`);
    /* as rotinas antigas chamam renderRoute/renderActive depois de cada mudança */
    renderRoute = function () { sincronizarCnae(); puRedesenhaItem(); };
    renderActive = function () { saveState(); const n = UvisPadrao.estado(); if (n.aba === "infracoes" && $("#panel-infracoes")) renderInfractionPanel(); else puRedesenhaItem(); };
    document.addEventListener("click", (e) => {
      const na = e.target.closest("[data-pu-na-etapa]");
      if (na) { const et = puEtapa(na.dataset.puNaEtapa); (et?.items || []).forEach((i) => { if (!state.answers[i._id]) state.answers[i._id] = "na"; }); saveState(); puRedesenhaItem(); return; }
      if (e.target.closest("[data-pu-pendente]")) {
        for (const s of puSecoes()) for (const it of s.itens) { if (it.total && it.feitos < it.total) { UvisPadrao.vai({ aba: "roteiro", secao: s.id, item: it.id }); return; } }
        toast("Todos os itens aplicáveis foram respondidos."); return;
      }
    });
    /* tipo de inspeção: grava no mesmo estado do POP-O-SNVS-013 e na identificação do relatório */
    document.addEventListener("change", (e) => {
      const t = e.target;
      if (t.matches && t.matches("[data-pu-tipo-insp]")) { pop13Grava({ objetivo: t.value }); sincTipoInsp(); puRedesenhaItem(); }
      else if (t.id === "pop13Objetivo") { setTimeout(sincTipoInsp, 0); }
    });
    document.addEventListener("input", (e) => {
      const t = e.target;
      if (t.matches && t.matches("[data-pu-tipo-outro]")) { pop13Grava({ outro: t.value }); sincTipoInsp(); }
      else if (t.id === "pop13Outro") { setTimeout(sincTipoInsp, 0); }
    });
    sincTipoInsp();
    /* título do cabeçalho acompanha a atividade */
    sincronizarCnae();
  }

  if (PADRAO) iniciaPadrao();
  else { setupShell(); renderActive(); }
