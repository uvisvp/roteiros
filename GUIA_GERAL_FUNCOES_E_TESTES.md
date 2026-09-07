# Guia geral de funções e testes

## Objetivo

Este documento orienta a conferência do aplicativo Inspeção Sanitária UVIS publicado como PWA. A versão contém os núcleos de inspeção, inventários de consulta, citações legislativas, relatórios, OCR, leitura de documentos, consultas Anvisa, conferência de estoque e o ciclo específico de distribuidoras e transportadoras.

Use uma cópia de teste e dados fictícios. A limpeza de dados de inspeção não apaga o banco legislativo nem a base de consultas.

## Arquivos publicados

- `index.html`: aplicativo integrado.
- `manifest.webmanifest`: configuração PWA.
- `sw.js`: cache, atualização e funcionamento offline.
- `versao.json`: versão e banco de dados.
- `icons/`: ícones da aplicação e símbolo da farmácia de manipulação.

## Funções comuns

### Entrada e navegação

A tela inicial organiza os núcleos por grupo. Cada núcleo abre dentro da casca do aplicativo. Os módulos com roteiro usam cards e faixa inferior com **Voltar**, **Limpar dados deste card** e **Próximo**. Núcleos que não usam cards mantêm a faixa de retorno e limpeza do próprio escopo quando aplicável.

### Citações

As citações devem mostrar a norma e o dispositivo no mesmo texto, por exemplo `RDC 44/2009 · Art. 7`. Ao clicar, a caixa abre centralizada, apresenta o texto do dispositivo e permite abrir a fonte oficial. A caixa deve ser única; não deve abrir uma segunda coluna ou texto duplicado abaixo do item.

### Limpeza

O botão de limpeza de um card remove respostas, evidências, fotos e campos daquele card. Dados de outros cards e bancos legislativos permanecem. A limpeza global da casca remove somente dados de inspeção dos escopos selecionados.

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

### Alimentos e serviços de alimentação

- Roteiro por tipo de estabelecimento.
- Inventário de infrações independente do roteiro.
- Citações legislativas clicáveis e centralizadas.
- Relatório de inspeção com campos descritivos e exportação.

### Estética e beleza

- Seleção da modalidade do serviço.
- Roteiro, inventário de infrações e relatório.
- Citações com norma e artigo na caixa centralizada.

### Serviços assistenciais

- Seleção da modalidade assistencial.
- Guias, documentos, roteiro, inventário, calculadora quando aplicável e relatório.
- Citações e recomendações descritivas no padrão visual comum.

### Odontologia

- Roteiro por serviço odontológico.
- Referências legislativas uniformes.
- Relatório de verificação em Word.

### Produtos e correlatos

- Trilhas para fabricante, atacadista/distribuidor e transportador.
- Roteiro, inventário e relatório conforme a atividade escolhida.
- Consultas e citações disponíveis nos campos aplicáveis.

## Teste geral passo a passo

1. Abra o aplicativo em Chrome e Edge.
2. Abra cada núcleo e confirme que não há erro visível nem tela vazia.
3. Teste a navegação Voltar, Próximo e retorno à tela inicial.
4. Abra uma citação em cada núcleo. Confirme norma, artigo, complemento, fonte e caixa centralizada.
5. Preencha dois campos de um card e use a limpeza. Confirme que outro card não é apagado.
6. Teste uma foto, OCR e edição do texto extraído em cada módulo que oferece o recurso.
7. Teste a consulta Anvisa por CNPJ e a leitura de DANFE/nota nos módulos aplicáveis.
8. Teste estoque por EAN e registro, com e sem OCR.
9. Gere uma prévia de relatório em Drogaria, Manipulação e Distribuidora.
10. Confira que frases de apresentação aparecem no formato interrogativo adotado, como `licença sanitária vigente foi apresentada?`, quando essa pergunta fizer parte do roteiro.
11. Na Distribuidora, percorra o ciclo inteiro até a revisão por par e confirme que a minuta alterada exige nova revisão.
12. No PWA publicado, instale o aplicativo, desligue a rede e confirme que a interface e os módulos incorporados abrem offline.
13. Ligue a rede novamente, altere `versao.json` em uma atualização de teste e confirme que o aviso de atualização aparece sem apagar o rascunho.
14. Confira no celular a faixa inferior, os botões de foto e a caixa de citação.

## Varredura automatizada realizada

A bateria disponível foi executada após a regeneração do HTML e da pasta PWA. Passaram: verificação de scripts dos módulos, teste fino da Drogaria, teste do módulo de Manipulação, teste do fluxo de Distribuidora, integração dos núcleos, limpeza contextual, inventário recolhível, PWA offline, manifest, service worker, cache de ícones e interface dos módulos.

O teste antigo de motor que procurava um ambiente repetido sem criar o ambiente foi mantido como teste histórico e não representa uma falha do roteiro atual. O teste antigo de emissão de DOCX chamava uma função removida; a exportação atual usa o adaptador de documentos incorporado. O teste de navegador que dependia de um executável Chromium ausente foi substituído pelo Edge empacotado no runtime disponível.

## Critérios de aceite

Considere a versão aprovada quando cada núcleo abrir, todas as citações exibirem norma e dispositivo, a caixa permanecer centralizada, a limpeza ficar limitada ao card, OCR e consultas funcionarem nos campos previstos, os relatórios preservarem os dados do roteiro e o PWA funcionar online e offline.

Se houver falha, registre núcleo, tela, passo de reprodução, texto exibido, navegador, largura da janela e captura de tela. Não altere o banco de legislação para corrigir apenas um problema visual.
