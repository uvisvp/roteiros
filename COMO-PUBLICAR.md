# Publicar o aplicativo

Versão 20260907-9. Nada foi publicado nesta revisão.

Na primeira publicação, mantenha `index.html`, `manifest.webmanifest`, `sw.js`, `versao.json` e os cinco arquivos PNG na mesma raiz. Para atualização de código, normalmente basta substituir `index.html`, `sw.js` e `versao.json`; envie também a documentação somente quando ela mudar.

No Netlify, envie esta pasta (ou selecione-a como diretório de publicação). No GitHub Pages, coloque estes arquivos na pasta configurada para publicação e habilite o Pages. Apenas subir ao GitHub não ativa a hospedagem. Use HTTPS.

Após publicar, abra a URL e aguarde o primeiro carregamento. A instalação depende do navegador; no iPhone use Compartilhar → Adicionar à Tela de Início. O aplicativo também pode ser utilizado sem instalação.

O aplicativo fica disponível offline após o cache inicial. Consultas externas, OCR que precise baixar componentes e bases ainda não carregadas exigem internet. Resultados de consulta dependem da disponibilidade e atualização da base compartilhada.

Para atualizar para a Versão 20260907-9, substitua pelo menos `index.html`, `sw.js` e `versao.json`. A atualização é aceita pelo botão do aplicativo; respostas e bancos de consulta ficam separados do cache da interface. Use os botões Limpar dados somente quando quiser apagar as inspeções.

Abrir por file:// permite uma prévia, mas não instala o PWA nem equivale aos testes de persistência em HTTPS. Mantenha o mesmo endereço publicado para conservar os dados do navegador.
