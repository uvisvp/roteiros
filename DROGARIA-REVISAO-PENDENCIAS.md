# Revisão da Drogaria — registro de continuidade

Escopo exclusivo: módulo **Drogaria**. Não avançar para Farmácia de Manipulação ou Distribuidora antes de concluir esta revisão.

## Etapas acordadas

1. Preparar os leitores específicos de documentos, consultas Anvisa e fotos de evidência. Concluído em `drogaria-ocr-tools.js` e integrado somente à Drogaria.
2. Posicionar cada função na seção indicada e revisar a tela antes de aplicar dados. **Seção 1 — Dados da inspeção concluída**: leitura da licença, consulta Anvisa, Certidão de Regularidade Técnica e ASOs múltiplos, sempre com tela de conferência antes de aplicar. Próxima etapa: revisão da seção seguinte indicada pela inspeção.
3. Revisar o relatório somente depois de concluídas as seções e suas funções.

## Ajuste visual inicial aplicado em 10/09/2026

- Cabeçalho reduzido para conter somente “Roteiro de inspeção sanitária”.
- Removido do cabeçalho o botão genérico “Extrair texto de foto ou documento”.
- Abas reduzidas e mantidas em uma linha: Roteiro, Infrações e Relatório.
- Navegação alterada de “Card” para “Seção”.
- Títulos resumidos: Dados da inspeção; Controlados e Antimicrobianos; Serviços Farmacêuticos; Documentos da Qualidade.
- Cartões e rodapé reduzidos; rodapé limitado à largura dos botões e com a mesma cor temática do cabeçalho.

Nenhuma dessas mudanças foi publicada.

## Seção 1 — decisões registradas

- A leitura de documento não é anexo automático ao relatório: os dados e a origem ficam salvos para edição; a inclusão textual no relatório será definida na etapa 3.
- A licença sanitária e a consulta Anvisa alimentam a identificação e a lista conferível de atividades; a consulta é marcada como fonte cadastral, sem atribuição de artigo.
- Foram incluídas referências clicáveis aos dispositivos já mapeados no roteiro: RDC 44/2009, art. 2º, III e IV, e art. 90.
- Sistema informatizado, lixeiras e ralos permanecem fora desta seção.
- Vacinação e EAC: quando não oferecidos, não devem ser descritos no relatório; quando oferecidos, a licença específica pode ser lida e conferida. A ausência de licença fica registrada como não conformidade.

## Área física e termolábeis — decisões registradas

- O **card 2 do roteiro** corresponde à Área Física (seção 4 do relatório) e abre oito subtítulos: recebimento, dispensação, armazenamento, resíduos, produtos vencidos/violados, DML, refeitório e sanitários.
- O **card 3 do roteiro** corresponde a Medicamentos Termolábeis (seção 5 do relatório). Caso a resposta seja “Não”, o card registra somente que não há comercialização; caso “Sim”, abre a trilha de refrigeradores e monitoramento.
- Os documentos de área física e termolábeis são lidos em tela própria, com conferência antes de salvar. Ainda não são anexados automaticamente ao relatório.
- As citações existentes foram inseridas apenas para dispositivos já mapeados no roteiro; itens sem dispositivo definido permanecem sem citação até a validação normativa.

## Serviços farmacêuticos e documentos avaliados — decisões registradas

- O **card 5 do roteiro** registra os serviços farmacêuticos. Se não forem realizados, não descreve a atividade; quando realizados, permite POPs, licença, requisitos do ambiente, comprovações complementares e consulta de equipamentos por registro/processo Anvisa.
- O **card 6 do roteiro** abre os quatro subtítulos: documentos de qualidade, rastreabilidade, venda remota e descarte.
- Fotos de registros de treinamento são evidências fotográficas: não sofrem OCR e não são anexadas automaticamente ao relatório.
- Manuais, POPs, PGRSS e DANFEs usam leitor específico e tela de conferência. O texto final do relatório continua pendente da etapa 3.

## Transporte e relatório final

- O **card 8 do roteiro** foi estruturado para transporte próprio ou terceirizado, empresa de entrega, contrato, licença, consulta Anvisa, cartão de acompanhamento e controles de termolábeis.
- O card de Controlados recebeu o complemento de SNGPC, POPs, mapas/balanços, comprovação de envio à COVISA em até 72 horas e conformidade de estoque, sem retirar a conferência automática já existente.
- Substituído na revisão técnica abaixo: o complemento e o segundo exportador foram removidos. A emissão usa o gerador nativo de Word, HTML e impressão.

## Revisão técnica de integração — 10/09/2026

Base: `main`, commit `c2d378f24586786bbc1564c9d19e96a0d734b625`, arquivo **index.html**. O HTML integrado é reempacotado; `Index.html` não é utilizado.

Seções principais mantidas:

1. Dados da inspeção
2. Área Física
3. Medicamentos Termolábeis
4. Controlados e Antimicrobianos
5. Serviços Farmacêuticos
6. Documentos da Qualidade
7. Resíduos e Produtos Impróprios
8. Transporte

Correções implementadas:

- Ligação dos eventos das quatro pontes de tela. Antes, os instaladores não eram chamados.
- Salvamento de texto sem remontar a tela a cada tecla; resultados documentais podem ser reabertos para conferência/edição.
- Cabeçalho somente com “Roteiro de inspeção sanitária”, abas compactas e rodapé na cor do núcleo; eliminado ciclo de mutações ao renomear abas. Estilo compacto não altera o cabeçalho das janelas de conferência.
- As oito seções ficam acessíveis; produtos e serviços escolhidos alimentam os filtros existentes de receituário. A conferência completa de estoque foi preservada, sem inclusão manual avulsa.
- Atividades da licença sanitária e autorizações Anvisa armazenadas separadamente. Ler uma licença não declara automaticamente que esteja válida ou que a atividade esteja licenciada.
- Mantidos os editores nativos de ambientes/pavimentos, monitoramento por ambiente e múltiplos refrigeradores.
- Consulta de equipamento por um único identificador e seleção do resultado antes de aplicar. Corrigido uso dos fragmentos por registro referenciados pelo índice de processos.
- Entrega própria/terceirizada mutuamente exclusiva. Pergunta de comprovante COVISA em 72 horas condicionada a receitas de outra UF, com aplicabilidade do fundamento ainda sujeita à conferência.
- Relatório usa dados reais, documentos conferidos e achados; reaproveita Word, HTML, impressão, tabelas e medidas nativos, na ordem 1–13 do modelo. Removido complemento genérico e exportador duplicado.
- Foto sem extração e documento fotográfico separado, com identificação persistente da inspeção. OCR não anexa fotografia automaticamente. A imagem original da leitura é temporária; sua preservação como evidência depende de seleção explícita.
- Em Produtos → Conferência de estoque, incluída a base de cosméticos na consulta que já os oferecia na tela, respeitando fragmentação por processo. Processo digitado não é ignorado por registro residual.
- Nenhum outro módulo nem o banco normativo integrado foi alterado. PWA mantém manifesto, service worker e atualização que preserva rascunhos e dados.

Verificações reproduzíveis:

```sh
node scripts/repack-drogaria.cjs
node scripts/test-drogaria.cjs
node scripts/test-processos.cjs
node scripts/test-pwa-scope.cjs
```

Foram testados eventos, persistência, oito seções acessíveis, filtros de atividade, dois refrigeradores, relatório/achados, exclusão documental, estoque, índice real de dispositivo e cosmético e preservação dos demais módulos. Word de dados sintéticos emitido pelo exportador vigente e inspecionado após renderização.

Limitações e revisão ainda necessária:

- O navegador de teste bloqueou o acesso à cópia local. Não houve aprovação visual das telas nem teste de câmera física nesta etapa; os testes de eventos usam um ambiente simulado.
- Arquivo Word binário `.doc` exige conversão para `.docx` ou PDF. Imagens, PDF e `.docx` usam o leitor local já existente; bibliotecas OCR/PDF precisam estar disponíveis para o primeiro uso.
- A qualidade dos extratores ainda precisa ser aferida documento a documento com os PDFs de exemplo. Não houve treinamento de modelo de OCR a partir dos anexos.
- Fotos legadas sem identificador da inspeção não foram reatribuídas automaticamente. Os originais não foram excluídos.
- Ausência de resultado em base cadastral não prova ausência de autorização. AE não localizada não é deduzida de atividade de controlados.
- Requisitos sem equivalência exata e fundamento conferido permanecem como achados de enquadramento pendente, nunca como infração automaticamente validada. Vacinação/EAC sem licença específica são descritos como não conformidade com enquadramento específico pendente.
- A revisão visual detalhada de todos os subtítulos dos anexos, os campos de sanitários por unidade e a amostragem de fornecedores continuam pendentes; não declarar equivalência integral a todos os exemplos sem essa revisão.
