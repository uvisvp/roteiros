# Guia geral de funções e testes

**Versão do aplicativo:** 20260907-9 · **legislação incorporada:** 11.2

## Objetivo

Este documento orienta a conferência do aplicativo Inspeção Sanitária UVIS publicado como PWA. A versão contém os núcleos de inspeção, inventários de consulta, citações legislativas, relatórios, OCR, leitura de documentos, consultas Anvisa, conferência de estoque e o ciclo específico de distribuidoras e transportadoras.

Use uma cópia de teste e dados fictícios. A limpeza de dados de inspeção não apaga o banco legislativo nem a base de consultas.

## Arquivos publicados

- `index.html`: aplicativo integrado.
- `manifest.webmanifest`: configuração PWA.
- `sw.js`: cache, atualização e funcionamento offline.
- `versao.json`: versão e banco de dados.
- `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` e `apple-touch-icon.png`: ícones do PWA.
- `farmacia-manipulacao.png`: símbolo visual do card de Farmácia de Manipulação.

## Funções comuns

### Entrada e navegação

A tela inicial organiza os núcleos por grupo. Cada núcleo abre dentro da casca do aplicativo. Os módulos com roteiro usam cards e faixa inferior compacta com **←**, **Limpar dados** e **→**. A faixa respeita a área segura inferior do celular. Núcleos sem sequência de cards mantêm somente os controles aplicáveis, sem textos antigos como “Limpar dados deste card” ou “desta aba”.

### Citações

As citações devem mostrar a norma e o dispositivo no mesmo texto, por exemplo `RDC 44/2009 · Art. 7`. Ao clicar, a caixa abre centralizada, apresenta o texto do dispositivo e permite abrir a fonte oficial. A caixa deve ser única; não deve abrir uma segunda coluna ou texto duplicado abaixo do item.

### Limpeza

O botão de limpeza de um card remove respostas, evidências, fotos e campos daquele card. Dados de outros cards e bancos legislativos permanecem. Não há botão global de limpeza na tela inicial. A limpeza permanece contextual ao núcleo/card para reduzir risco de apagar outra inspeção.

### Fotos e OCR

Os botões de foto devem ter ícone e rótulo visível. A leitura fica ao lado ou abaixo do campo aplicável. O OCR mostra o texto integral extraído, campos sugeridos e permite correção manual. Se a captura falhar, a digitação manual continua disponível.

Os tipos de leitura previstos incluem licença sanitária, certificado/CRT, ASO, calibração, AVCB/CLCB, controle de pragas, limpeza de reservatório, SNGPC, mapas e balanços, nota fiscal/DANFE, ordem de manipulação, certificado de fornecedor, laudo, CQ, POP e documento genérico.

### Consultas Anvisa e estoque

Quando o campo permitir, a consulta pode começar pela chave ou número da DANFE/nota fiscal. O CNPJ fica disponível para consulta complementar e o botão de busca aparece junto ao campo. A conferência de estoque aceita EAN e registro, consulta os dados disponíveis e pode receber leitura por OCR.

## Núcleos e funções esperadas

### Drogaria

- Roteiro por cards, com respostas C, NC e NA.
- Ambientes, instrumentos e monitoramento de termolábeis dentro do card correspondente.
- Termohigrômetro com calibração, leitura mínima, máxima e momento, reset informativo e planilha atualizada.
- Controlados com monitoramento e planilha de registros.
- Fornecedor com DANFE/nota, CNPJ e consulta Anvisa.
- Conferência de estoque com EAN/registro, OCR e cesta integrada ao roteiro quando aplicável.
- Resíduos descritos por lixeiras identificadas e abertura por pedal.
- Extintor avaliado por existência, acesso desobstruído e validade.
- Sanitário PCD tratado como observação/recomendação, sem autuação automática.
- Relatório com identificação dos documentos e citações uniformes.

### Farmácia de manipulação

- O roteiro declara **294 pontos previstos**: **241 perguntas C/NC/NA** e **53 pontos tratados em controles estruturados** (seleções, checklists e grupos repetíveis), evitando duplicação de perguntas.

- Roteiro baseado na RDC 67/2007 para preparações não estéreis.
- Grupos IV e VI fora do escopo deste núcleo, conforme a orientação recebida.
- Referências da RDC, anexo e item junto de cada pergunta.
- Inventário sem classificação automática de maior, menor ou crítica.
- Monitoramento, POPs, documentos, rastreabilidade, estoque e relatório.
- OCR e preenchimento manual para certificados, ASO, calibração, ordens, fornecedores e laudos.
- Consulta de estoque por EAN/registro.
- Símbolo visual de farmácia de manipulação no cabeçalho.
- Relatório com exportação e sem referências institucionais indevidas.

### Distribuidora e transportadora de medicamentos

- Primeiro card: roteiro de inspeção e inventário de consulta.
- Segundo card: fechamento do relatório.
- Aba de roteiro gera e alimenta o Anexo II do POP-O-SNVS-011.
- Análise do plano de ação por NC, evidência, prazo, responsável, risco residual e critérios de aceitação.
- Revisão por par técnico conforme Anexo III.
- A minuta fica bloqueada para emissão final quando muda depois da revisão.
- Relatório final segue o ciclo: inspeção, Anexo II, plano de ação, análise por NC, minuta, par, aprovação e Anexo I.
- OCR, fotos, documentos e campos de fornecedor/estoque permanecem disponíveis onde o item permitir.

### Padrão de navegação (Produtos, Alimentos, Odontologia, Serviços assistenciais)

Os quatro núcleos usam a mesma tela da drogaria e da manipulação (componente `padrao-uvis.js`):

- cabeçalho na cor do núcleo, com voltar, título centralizado e os botões Fotos e Salvas;
- abas Roteiro, Infrações e Relatório;
- faixa de seções (Todas + seções) e três níveis: lista de seções › grade de itens numerados (1.1, 1.2…) › tela do item, com a faixa de itens da seção;
- rodapé fixo: ← anterior, limpar (item ou seção), grade (todas as seções), → próximo; o voltar do celular volta um nível e cada tela nova começa no topo;
- respostas **Cumpre / Não cumpre / Não se aplica** (nos documentos dos serviços assistenciais: Apresentou / Não apresentou / Não se aplica); o texto do relatório não mudou;
- foto, nota e fontes ficam recolhidas em “Foto, nota e fontes” / “Foto”;
- a Seção 1 reúne identificação e perfil. **O perfil não esconde verificações**: o que depende de tipo, processo ou característica não marcada aparece com o aviso “Fora do perfil marcado” e pode ser marcado como “Não se aplica” (por pergunta, por item ou, em Odontologia, de uma vez no Perfil do serviço);
- layout fluido para celular (6,1″ a 6,7″), tablet de 10,1″ e computador, sem rolagem horizontal e com botões de pelo menos 40 px.

### Alimentos e serviços de alimentação

- Seção 1: identificação, tipo de serviço e forma de operação, processos presentes.
- Seções 2 a 6, no percurso da visita: documentos; estrutura, água, resíduos e higiene; recebimento e armazenamento; manipulação, preparo e exposição; transporte e encerramento. Cada bloco da Portaria SMS nº 2.619/2011 é um item.
- Inventário de infrações independente do roteiro; relatório com texto, cópia e Word.

### Estética e beleza

- Seleção da modalidade do serviço.
- Roteiro, inventário de infrações e relatório.
- Citações com norma e artigo na caixa centralizada.

### Serviços assistenciais

- Cada modalidade (ILPI, Centro Dia, Comunidade Terapêutica, Residência Terapêutica, SAICA, Demais acolhimentos) é um cartão na tela do núcleo.
- Seção 1: estabelecimento e “Sobre este serviço” (enquadramento, alerta, CNAE); em Demais acolhimentos, a modalidade é escolhida ali antes de liberar as demais seções.
- Seções Documentos e Inspeção (cada grupo é um item) e Dimensionamento de pessoal quando houver calculadora.
- Salvas por modalidade: salvar, apagar e retomar mexem só na modalidade aberta.

### Odontologia

- Seção 1: identificação e perfil do serviço (situação, tipologia, organização, processamento, características).
- Seções: licenciamento e apoio; assistência, equipamentos e radiologia; processamento de dispositivos médicos; qualidade, resíduos e atendimento externo. Cada etapa da RDC nº 1.002/2025 é um item.
- “Não cumpre” abre evidência e conclusão do fiscal; relatório de verificação e tabela de infrações em Word.

### Produtos e correlatos

- Trilhas para fabricante, atacadista/distribuidor e transportador, escolhidas no cartão do núcleo.
- Seção 1 “Dados da inspeção”: identificação, classes e características (não escondem etapas), enquadramento, CNAE, consultas e fluxo do POP-O-SNVS-013.
- Demais seções agrupam as etapas por tema; inventário e relatório conforme a atividade.

## Teste geral passo a passo

1. Abra o aplicativo em Chrome e Edge.
2. Abra cada núcleo e confirme que não há erro visível nem tela vazia.
3. Teste a navegação pelas setas **←** e **→** e o retorno à tela inicial.
4. Abra uma citação em cada núcleo. Confirme norma, artigo, complemento, fonte e caixa centralizada.
5. Preencha dois campos de um card e use a limpeza. Confirme que outro card não é apagado.
6. Teste uma foto, OCR e edição do texto extraído em cada módulo que oferece o recurso.
7. Teste a consulta Anvisa por CNPJ e a leitura de DANFE/nota nos módulos aplicáveis.
8. Teste estoque por EAN e registro, com e sem OCR.
9. Gere uma prévia de relatório em Drogaria, Manipulação e Distribuidora.
10. Confira que frases de apresentação aparecem no formato interrogativo adotado, como `licença sanitária vigente foi apresentada?`, quando essa pergunta fizer parte do roteiro.
11. Na Distribuidora, percorra o ciclo inteiro até a revisão por par e confirme que a minuta alterada exige nova revisão.
12. No PWA publicado, instale o aplicativo, desligue a rede e confirme que a interface e os módulos incorporados abrem offline.
13. Ligue a rede novamente, use **Verificar atualização** e confirme que a caixa informa a versão/correções e não apaga o rascunho.
14. Confira no celular a faixa inferior, os botões de foto e a caixa de citação.
15. Em Produtos, Alimentos, Odontologia e Serviços assistenciais, percorra os itens com **→** até o fim, volte com **←** e com o voltar do celular, e confira que cada resposta aparece na prévia “Como sai no relatório”.

Suíte automatizada: `node scripts/e2e/todos.cjs` (funções comuns, relatórios de Medicamentos e navegação padrão dos quatro núcleos); por núcleo, `node scripts/e2e/padrao.cjs <núcleo> <app> <título> [qs]`.

## Varredura automatizada realizada

Na versão 20260907-9, passaram a descompactação dos 36 blocos, a abertura dos 13 módulos, a verificação de sintaxe dos scripts, a injeção compartilhada de UvisUI/citações, a faixa móvel padronizada, o fluxo por telas da Distribuidora/Transportadora, os caminhos do manifest/service worker e a presença dos arquivos essenciais. O ciclo real de instalação e abertura offline deve ser confirmado novamente após a publicação HTTPS, pois depende do service worker efetivamente instalado no aparelho.

O teste antigo de motor que procurava um ambiente repetido sem criar o ambiente foi mantido como teste histórico e não representa uma falha do roteiro atual. O teste antigo de emissão de DOCX chamava uma função removida; a exportação atual usa o adaptador de documentos incorporado. O teste de navegador que dependia de um executável Chromium ausente foi substituído pelo Edge empacotado no runtime disponível.

## Critérios de aceite

Considere a versão aprovada quando cada núcleo abrir, todas as citações exibirem norma e dispositivo, a caixa permanecer centralizada, a limpeza ficar limitada ao card, OCR e consultas funcionarem nos campos previstos, os relatórios preservarem os dados do roteiro e o PWA funcionar online e offline.

Se houver falha, registre núcleo, tela, passo de reprodução, texto exibido, navegador, largura da janela e captura de tela. Não altere o banco de legislação para corrigir apenas um problema visual.
