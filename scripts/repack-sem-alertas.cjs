'use strict';
/* Alertas sanitários retirados do app (pedido de 20/10/2026). A consulta de alertas da
   Anvisa passou a exigir verificação humana (Cloudflare Turnstile) e não há dado aberto
   equivalente; a base parou em 23/09/2026. Sai da Central de Consultas (registro, CNPJ,
   lote/modelo), da consulta de produto ou empresa em Alimentos e da conferência de IFA
   da distribuidora. Atualiza também o Guia de uso da tela inicial.
   Idempotente. Rodar por último na cadeia (depois de repack-redacao).
   Uso: node scripts/repack-sem-alertas.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);

/* Troca [de, para]; se "de" sumiu e "para" já está, o passo já foi aplicado. */
function troca(s, de, para, rotulo) {
  if (s.includes(de)) return s.split(de).join(para);
  if (para && s.includes(para)) return s;
  if (!para) return s;
  throw Error('Trecho não localizado: ' + rotulo);
}
/* Remove de "ini" até "fim" (exclusive); some sem erro se "ini" já não existe. */
function corta(s, ini, fim, poe, rotulo) {
  const a = s.indexOf(ini);
  if (a < 0) return s;
  const b = s.indexOf(fim, a);
  if (b < 0) throw Error('Fim não localizado: ' + rotulo);
  return s.slice(0, a) + (poe || '') + s.slice(b);
}

const passos = {
  'app--central-consultas': s => {
    s = corta(s, 'function achataAlerta(it){', 'function achataIrregular(it){',
      '/* Alertas sanitários retirados em 20/10/2026: a consulta da Anvisa exige verificação humana e não há dado aberto equivalente. */\nasync function alerts(){return [];}\n', 'alertas');
    s = troca(s, '\n    <div class="sum${a.length?\' on\':\'\'}"><b>${a.length}</b><span>alertas relacionados</span></div>', '', 'resumo');
    s = troca(s, '  if(a.length)html+=\'<div class="notice warn">Alerta sanitário não significa, por si só, proibição ou irregularidade do produto inspecionado. Confira lote, modelo e validade antes de concluir.</div>\'+bloco(\'Alertas sanitários relacionados\',a,\'alert\',\'al\');\n', '', 'bloco');
    s = troca(s, '<b>Registro</b><span>Localiza o cadastro do produto e verifica separadamente alertas e medidas fiscais vinculados ao número.</span>',
      '<b>Registro</b><span>Localiza o cadastro do produto e verifica separadamente as medidas fiscais vinculadas ao número.</span>', 'guia registro');
    s = troca(s, '<b>CNPJ</b><span>Reúne AFE/AE, produtos vinculados, Cannabis, alertas e medidas fiscais da empresa, separados por base.</span>',
      '<b>CNPJ</b><span>Reúne AFE/AE, CNES, produtos vinculados, Cannabis e medidas fiscais da empresa, separados por base.</span>', 'guia cnpj');
    s = troca(s, '<b>Lote / modelo</b><span>Busca em alertas e medidas fiscais. Aceita',
      '<b>CNES</b><span>Cadastro do estabelecimento de saúde no CNES (município de São Paulo) pelo código de 7 dígitos.</span>\n  <b>Lote / modelo</b><span>Busca nas medidas fiscais (produtos irregulares). Aceita', 'guia lote');
    s = troca(s, 'Em seguida verifica, <b>em blocos separados</b>, se existe alerta sanitário ou medida fiscal ligada a esse mesmo número.',
      'Em seguida verifica, <b>em bloco separado</b>, se existe medida fiscal ligada a esse mesmo número.', 'ajuda registro');
    s = troca(s, 'os produtos de Cannabis, os alertas sanitários e as medidas fiscais.', 'os produtos de Cannabis e as medidas fiscais.', 'ajuda cnpj');
    s = troca(s, 'Procura o identificador em alertas sanitários e em produtos irregulares.', 'Procura o identificador nos produtos irregulares (medidas fiscais).', 'ajuda lote');
    s = troca(s, "alertas_sanitarios:'Alertas sanitários',", '', 'labels');
    s = troca(s, "(kind==='alert'?'alertas_sanitarios':kind==='fiscal'?", "(kind==='fiscal'?", 'base do grupo');
    s = troca(s, "(pref==='al'?'alertas_sanitarios':pref==='ir'?", "(pref==='ir'?", 'base da página');
    s = troca(s, ", alertas_sanitarios:'alertas_sanitarios'\n", '\n', 'origem');
    s = troca(s, "alertas_sanitarios:'Alertas sanitários (Anvisa)', ", '', 'nomes');
    return s;
  },
  'app--alimentos-integrado': s => {
    s = troca(s, 'Registro, processo, CNPJ, regularização, vínculos e alertas disponíveis.', 'Registro, processo, CNPJ, regularização, vínculos e medidas fiscais.', 'card');
    s = corta(s, '  /* alertas: numero_alerta em blocos de 100 */\n', '};', '', 'chave');
    s = s.replace(/(return p\.slice\(0, 8\);\n  \}),\n\};/, '$1\n};');
    s = troca(s, '     1. cadastro         situação, vencimento, apresentações, detentor\n     2. alertas          alertas sanitários que citam o registro ou o CNPJ\n     3. medidas fiscais',
      '     1. cadastro         situação, vencimento, apresentações, detentor\n     2. medidas fiscais', 'cabeçalho');
    s = troca(s, 'Resultado em três blocos, sempre nesta ordem:', 'Resultado em dois blocos, sempre nesta ordem:', 'cabeçalho 2');
    s = troca(s, '      if (r.alertas && r.alertas.length) { achou = true; res.appendChild(blocoAlertas(r.alertas)); }\n', '', 'uso');
    s = troca(s, '/* ------------------------------------------- alertas e medidas fiscais */', '/* ------------------------------------------- medidas fiscais */', 'seção');
    s = troca(s, '    tarefas.push(alertasPorCnpj(c, bases, frios));\n', '', 'tarefa cnpj');
    s = troca(s, '  Object.keys(registros).forEach(function (r) { tarefas.push(alertasPorRegistro(r, bases, frios)); });\n', '', 'tarefa registro');
    s = troca(s, '    var alertas = [], irregulares = [], vistos = {};', '    var irregulares = [], vistos = {};', 'junta 1');
    s = troca(s, "      (x && x.alertas || []).forEach(function (a) {\n        if (!vistos['a' + a.a]) { vistos['a' + a.a] = 1; alertas.push(a); }\n      });\n", '', 'junta 2');
    s = troca(s, '    return { produtos: produtos, alertas: alertas, irregulares: irregulares };', '    return { produtos: produtos, irregulares: irregulares };', 'junta 3');
    s = corta(s, 'function alertasPorCnpj(cnpj, bases, frios) {', '\nfunction ', '', 'por cnpj');
    s = corta(s, 'function alertasPorRegistro(reg, bases, frios) {', '\nfunction ', '', 'por registro');
    s = corta(s, 'function blocoAlertas(alertas) {', 'function blocoIrregulares(lista) {', '', 'bloco');
    return s;
  },
  'rec--insumo-check.js': s => {
    s = troca(s, ",\n    { id: 'alertas', caminho: 'dados/alertas_sanitarios/manifest.json', nome: 'Alertas sanitários',\n      nota: 'Índices por registro, CNPJ e lote.' }\n", '\n', 'bases');
    s = troca(s, "var comuns = ['afe', 'p344', 'irregulares', 'alertas'];", "var comuns = ['afe', 'p344', 'irregulares'];", 'comuns');
    s = corta(s, '  function achaAlertas(regs, d) {', '  function consultarFase4() {', '', 'acha');
    /* a fase 4 é reescrita depois por repack-ifa-irregulares (busca por CNPJ e lote) */
    if (!s.includes('function chaveLote(')) s = troca(s, "      baixaPrimeiro(['alertas_sanitarios/manifest.json', 'alertas_sanitarios/busca/2026.json']),\n      baixaPrimeiro(['produtos_irregulares/manifest.json'])\n    ]).then(function (r) {\n      var alertasLista = lista(r[0]);\n      st.busca4 = {\n        rodando: false,\n        feita: new Date().toLocaleString('pt-BR'),\n        alertasOk: !!r[0], irregOk: !!r[1],\n        alertasBuscavel: alertasLista.length > 0,\n        alertas: alertasLista.length ? achaAlertas(alertasLista, st.d) : null,\n        irregManifest: r[1] || null",
      "      baixaPrimeiro(['produtos_irregulares/manifest.json'])\n    ]).then(function (r) {\n      st.busca4 = {\n        rodando: false,\n        feita: new Date().toLocaleString('pt-BR'),\n        irregOk: !!r[0],\n        irregManifest: r[0] || null", 'fase 4');
    s = troca(s, "'<h3>5. Documentos do lote, alertas e rastreabilidade</h3>'", "'<h3>5. Documentos do lote, medidas fiscais e rastreabilidade</h3>'", 'título');
    s = troca(s, '>Consultar alertas e produtos irregulares</button>', '>Consultar produtos irregulares</button>', 'botão');
    s = corta(s, "    if (!b.alertasOk) out += sit('na', '\\u25CB', 'Alertas sanitários não puderam ser consultados'", "    out += sit(b.irregOk ? 'pend'", '', 'resultado');
    return s;
  }
};

const feitos = new Set();
html = html.replace(/(<script type="text\/plain" id="((?:app|rec)--[^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (!passos[id]) return m;
  const src = lz.decompressFromBase64(enc.trim());
  const s = passos[id](src);
  feitos.add(id);
  if (/alertas?_sanitarios|alertasPor|achaAlertas|achataAlerta|blocoAlertas/.test(s)) throw Error('Resto de alertas em ' + id);
  if (s === src) return m;
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + id);
  return a + novo + z;
});
for (const id of Object.keys(passos)) if (!feitos.has(id)) throw Error('Bloco não localizado: ' + id);

/* Guia de uso da tela inicial: núcleos e ferramentas como estão hoje. */
const GUIA = `<div class="guide-body">
        <section class="guide-section">
          <h3>Ações do topo</h3>
          <div class="guide-routes">
            <article class="guide-route"><b>Central de Consultas</b><p>Bases públicas da Anvisa e do CNES: registro ou notificação, processo, CNPJ, EAN/GTIN, AFE/AE, código CNES (município de São Paulo), lote ou modelo nas medidas fiscais e licença no SIVISA. Mostra cadastro, autorizações, produtos vinculados, Cannabis, CNES e produtos irregulares, cada base em bloco próprio, com a data da fonte. Não encontrar não atesta regularidade.</p></article>
            <article class="guide-route"><b>Juntar PDF</b><p>Ferramenta externa para reunir documentos em um único PDF. Abre em nova aba e exige conexão com a internet.</p></article>
          </div>
        </section>
        <section class="guide-section">
          <h3>Núcleos de inspeção</h3>
          <div class="guide-routes">
            <article class="guide-route"><b>Medicamentos</b><p>Drogaria (inclusive em supermercado, com a conferência de estoque dentro da inspeção), exames de análises clínicas e vacinação em drogaria; farmácia com manipulação, inclusive estéreis; atacadista de medicamentos (distribuidora e transportadora) e de gases medicinais.</p></article>
            <article class="guide-route"><b>Alimentos</b><p>Inspeção do estabelecimento, por tipo, com relatório e infrações. Rotulagem, consultas e composição: conferência de rótulo com leitura da tabela nutricional, consulta de produto ou empresa, aditivos, coadjuvantes, enzimas e suplementos.</p></article>
            <article class="guide-route"><b>Serviços</b><p>Estética e beleza; academias e piscinas; vacinação; exames de análises clínicas (Tipos I, II e III); transporte de material biológico; diagnóstico por imagem (radiologia convencional, mamografia, tomografia, ressonância, ultrassonografia e hemodinâmica).</p></article>
            <article class="guide-route"><b>Produtos</b><p>Trilhas para fabricante de cosméticos, atacadista/distribuidor (cosméticos, saneantes e dispositivos médicos) e transportador.</p></article>
            <article class="guide-route"><b>Serviços assistenciais</b><p>ILPI, centro dia, comunidade terapêutica, residência terapêutica, SAICA e demais acolhimentos.</p></article>
            <article class="guide-route"><b>Odontologia</b><p>Consultórios, clínicas e policlínicas (RDC 1.002/2025). A tipologia é escolhida dentro do módulo.</p></article>
          </div>
        </section>
        <section class="guide-section">
          <h3>Dentro do roteiro</h3>
          <div class="guide-routes">
            <article class="guide-route"><b>Respostas e relatório</b><p>Cada pergunta é marcada como atende, não atende ou não se aplica, com anotação. A prévia “Como sai no relatório” mostra o texto antes de emitir; a irregularidade cita a norma específica e a Lei 13.725/2004. O relatório sai em Word ou PDF.</p></article>
            <article class="guide-route"><b>Busca pelo CNPJ</b><p>Na identificação, o botão de busca pelo CNPJ traz os dados da AFE/AE (Anvisa), do CNES e da Receita Federal.</p></article>
            <article class="guide-route"><b>Ferramentas de campo</b><p>Botão Campo: resumo da inspeção, pendências, achados anotados antes de chegar à pergunta, construtor de constatação com biblioteca de frases e verificações de equipamento ou produto. Ditado por voz nos campos de texto. Fotos com data, hora e local, com marcação de seta e círculo.</p></article>
            <article class="guide-route"><b>Para saber mais</b><p>Em cada item, a norma aplicável com o texto oficial e orientações técnicas com fonte.</p></article>
          </div>
        </section>
        <section class="guide-section">
          <h3>Uso em campo</h3>
          <div class="guide-routes">
            <article class="guide-route"><b>Preenchimento</b><p>O que for preenchido fica apenas neste aparelho e neste navegador. Nada é enviado para servidor.</p></article>
            <article class="guide-route"><b>Inspeções salvas</b><p>Em Medicamentos, Alimentos (inspeção do estabelecimento), Produtos, Serviços assistenciais e Odontologia, o botão Salvas no cabeçalho do roteiro guarda a inspeção em andamento (respostas e fotos) neste aparelho e deixa o roteiro em branco para outra. Até 5 por roteiro. Para retomar, use Inspeções salvas deste núcleo, na tela do núcleo, ou o mesmo botão dentro do roteiro.</p></article>
            <article class="guide-route"><b>Cópias e arquivo</b><p>O app guarda cópias automáticas da inspeção aberta (restauráveis em Campo › Resumo). Elas não protegem contra limpar os dados do navegador ou perder o aparelho: para isso, use Exportar nas Salvas e guarde o arquivo.</p></article>
            <article class="guide-route"><b>Sem internet</b><p>Roteiros, infrações e normas funcionam offline. A Central de Consultas, a busca pelo CNPJ e o Juntar PDF exigem conexão.</p></article>
          </div>
        </section>
      </div>`;
const ini = html.indexOf('<div class="guide-body">'), fim = html.indexOf('\n    </section>\n  </div>\n\n  <div class="toast"', ini);
if (ini < 0 || fim < 0) throw Error('Guia de uso não localizado');
html = html.slice(0, ini) + GUIA + html.slice(fim);

fs.writeFileSync(file, html);
console.log('Alertas sanitários retirados; Guia de uso atualizado.');
