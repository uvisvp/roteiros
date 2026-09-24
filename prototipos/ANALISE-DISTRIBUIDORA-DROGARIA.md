# Distribuidora e Drogaria — diagnóstico e melhorias propostas

Base analisada: `index.html` versão 20260924-3. Testes feitos no Chromium com largura de tablet (800 px). Os documentos gerados foram comparados com os modelos oficiais do POP-O-SNVS-011, baixados da página da Anvisa: Anexo I (modelo de relatório), Anexo II (formulário de comunicação de NC) e Anexo III (revisão por par técnico).

Objetivo: padronizar o núcleo de medicamentos (navegação e disposição iguais nos três módulos), conferir as normas e fazer os relatórios saírem no padrão exigido.

---

## 1. Distribuidora / transportadora

### 1.1 Navegação e disposição

| Achado | Situação hoje | Proposta |
|---|---|---|
| Casca diferente das outras | Cabeçalho próprio ("← Voltar ao núcleo" + subtítulo), tela principal com dois cartões (Roteiro / Fechamento), abas internas (Roteiro, Inventário, Anexo II, Normas) e depois outras três abas no fechamento. | Mesma casca da Drogaria e da Manipulação: cabeçalho escuro, abas **Roteiro · Não conformidades (Anexo II) · Relatório**, faixa de seções, cartões de item e barra inferior (← · apagar · grade · →). As etapas 1 a 5 do ciclo do POP-011 viram uma faixa de progresso dentro da aba Relatório (plano de ação → par técnico → Anexo I → fluxo SNVS). |
| Grade de etapas quebrada no tablet | Em 800 px, os títulos dos cartões ficam espremidos e sobrepostos ao subtítulo (ex.: cartão 1). | Grade de cartões igual à da Manipulação. |
| Tela de perguntas longa | A caixa de evidência fica sempre aberta em cada pergunta; não há numeração n/N, orientação por item, observações do item nem prévia. | Mesmo componente de pergunta da Manipulação: evidência recolhível, numeração, orientação no topo do item, "Não se aplica" do item e "Como sai no relatório". |
| Barra inferior | "Limpar dados" no centro e sem o botão de grade. | Mesma barra dos outros módulos. |

A trilha rígida (a regra de só liberar o Anexo I depois do par técnico aprovado e da aprovação para emissão) **deve ser mantida**. Ela segue o POP-011, e a mudança é só de disposição.

### 1.2 Normas e textos

- **25 não conformidades com redação genérica**: "Não cumpre o requisito avaliado: <pergunta>?". Esse texto vai para o Anexo II e para o relatório. Ficam no controle de qualidade da importadora (20) e em transporte, pessoal, recolhimento, controlados e OOS (5). É preciso escrever o requisito descumprido para cada uma.
- **5 perguntas sem fundamento legal**: `res-abrigo-temp`, `res-abrigo-ext`, `res-termo`, `res-coleta` e `q950`.
- **43 perguntas ligadas ao inventário de infrações por semelhança automática de texto**, com nota abaixo de 0,9 (a menor é 0,49, na `q282`). A sugestão de infração pode estar errada nesses casos. Revisar uma a uma, como foi feito na Manipulação.
- **Resíduos com 36 perguntas**, 12 delas sobre o conteúdo do PGRSS (RDC 222/2018, art. 6º). O Anexo I pede só "descrever se possui plano e registros". Proposta: o conteúdo do PGRSS vira uma lista recolhível e as perguntas ficam nas verificações físicas (lixeiras, abrigos).
- **Categorização (POP-O-SNVS-032)**: é registrada no Anexo II do app, mas o modelo oficial do Anexo II **não tem campo de categoria**. A categoria e a classificação final precisam aparecer no Anexo I (lista das NC com categoria e conclusão). Hoje o relatório sai com "Categoria: Não informada" e "Classificação não definida" sem avisar antes.

### 1.3 Documentos gerados

**Anexo II — Formulário de Comunicação de Não Conformidades**

| Achado | Modelo oficial | App |
|---|---|---|
| Seção extra | Não existe | Acrescenta "ANÁLISE DO PLANO DE AÇÃO" com campos vazios. Esse formulário é entregue ao fim da inspeção; a análise pertence a uma etapa posterior. **Retirar.** |
| Valores padrão | Situação e estratégia são marcadas por NC | Sai "Em andamento / Avaliação documental" mesmo sem seleção na tela. **Não preencher sem escolha; exigir antes de emitir.** |
| Matriz/Filial | Presente | Ausente |
| Assinaturas | Tabela: nome do inspetor (com indicação de observador), instituição e esfera (federal, estadual ou municipal) | Seção vazia |
| Equipe | Dois inspetores com código | Um |

**Anexo I — Relatório de inspeção**

| Achado | Situação hoje | Proposta |
|---|---|---|
| Formato | Gerado como texto corrido (`downloadText`), sem tabelas, sem cabeçalho de órgão/cidade/data e sem fotos | Gerar com o mesmo montador de Word do Anexo II: tabelas (identificação, terceirização, pessoas contatadas), caixas das atividades (distribuir, transportar, importar, armazenar, expedir) e anexo fotográfico. |
| Numeração | Seções sem texto são omitidas (9, 9.1, 9.3, 11.1–11.9 e 12), enquanto outras saem "Não informado". O modelo tem numeração fixa. | Todas as seções do modelo, sempre na mesma numeração; vazias saem como "Não aplicável" ou "Não informado", com aviso antes de emitir. |
| Descrição das áreas | Depende só do texto digitado; respostas "Cumpre" não geram descrição | Rascunho automático por seção, como na Manipulação: frase para Cumpre e para Não cumpre, organizadas pelos "Descrever se…" de cada seção do modelo, e editável antes da emissão. |
| Análise do plano de ação | Impressa inteira dentro das Considerações finais | Conferir no POP-011 rev. 3 onde ela deve constar. O arquivo do Anexo I publicado na página da Anvisa ainda se chama "rev-2". |

---

## 2. Drogaria

| Achado | Situação hoje | Proposta |
|---|---|---|
| Numeração dupla | Faixa de itens "1 · 4.1 Área de Recebimento…" | Só "4.1 Área de Recebimento". |
| Ordem das seções | Cartão "Seção 5 Resíduos" (id 7) aparece antes de "Seção 6 Documentos da Qualidade" (id 6). Os ids internos não seguem a ordem exibida. | Alinhar a ordem da tela com a do relatório. |
| Respostas | Sim / Não, sem Não se aplica | Cumpre / Não cumpre / Não se aplica nos requisitos; Sim / Não só nas perguntas informativas (ex.: "Há produtos na área do sifão?"). |
| Irregularidades do ambiente | Caixas de marcar sem citação e sem Não se aplica | A mesma lista da Manipulação: Irregular / N/A, com citação e "Outra". |
| Relatório | Frases com lacunas mal redigidas ("configuração não informada", "quantidade não informada funcionários"); títulos vazios ("4.9 Medicamentos termolábeis", "6 ") | Omitir o trecho quando o dado falta e avisar antes de emitir; nunca sair título sem conteúdo. |
| Recursos que a Manipulação já tem | Faltam orientação por item, observações do item, "Não se aplica" do item e prévia | Levar os mesmos componentes. |

As pendências já registradas em `DROGARIA-REVISAO-PENDENCIAS.md` continuam valendo: revisão visual dos subtítulos, fotos antigas sem identificador e amostragem de fornecedores.

---

## 3. Padronização do núcleo

Os componentes criados na Manipulação (cabeçalho do item, lista de irregularidades, equipamentos, prévia, Não se aplica do item) passam para um arquivo comum do núcleo e são usados pelos três módulos. Isso evita manter três versões da mesma tela.

## 4. Ordem sugerida

1. **Distribuidora — documentos**: Anexo II fiel ao modelo, Anexo I com numeração fixa, tabelas e fotos, sem valores padrão escondidos. É o maior ganho com o menor risco.
2. **Distribuidora — textos**: redação das 25 NC genéricas, os 5 fundamentos que faltam e a revisão das 43 ligações com o inventário.
3. **Distribuidora — casca padronizada** e componentes comuns.
4. **Drogaria — correções** de numeração, ordem e relatório; depois os componentes comuns e C/NC/NA.

## Fontes

- [POP-O-SNVS-011 — página do compilado de procedimentos SNVS (Anvisa)](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/certificacao-e-fiscalizacao/compilado-procedimentos-SNVS/011)
- [Anexo I POP-O-SNVS-011 — Modelo de relatório](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/certificacao-e-fiscalizacao/compilado-procedimentos-SNVS/011/anexo-i-pop-o-snvs-011-modelo-de-relatorio-imp-distr-armaz-e-transportadora-med-rev-2.pdf/view)
- [Compilado de Procedimentos SNVS](https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/certificacao-e-fiscalizacao/compilado-procedimentos-SNVS)
