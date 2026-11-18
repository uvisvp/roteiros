'use strict';
/* Correções pontuais no banco de legislação (bloco banco--v11), conferidas com o texto oficial
   (conferência de 17/11/2026). O banco continua protegido: scripts/test-pwa-scope.cjs só aceita,
   em norma já existente, exatamente as mudanças desta lista.

   Cada correção diz o estado final de cada dispositivo tocado:
     poe:  [id, texto, meta|null, depoisDe]  — grava o texto (e a marca, ex. {s:'revogado'}) no id;
           se o id ainda não existe, entra logo depois de `depoisDe`;
     tira: [ids]                             — dispositivos que deixam de existir;
     renomeia: [[de, para, meta]]            — o mesmo texto com outro id (e a marca, ex. {r: rótulo});
     sumario: true                           — itens de sumário gravados como itens (nK) saem, e o texto
           real (nKb, nKb-x) fica com o número do item (nK, nK-x);
     vigente: [[id, texto, meta?]...]        — a norma inteira, só com a redação vigente; o banco marca
           a norma com unico: 1 (cada rótulo tem um só dispositivo; o sufixo b é só a letra do
           dispositivo: art. 8º-A = a8b, art. 18-B = a18bb; meta.r traz o rótulo quando o id não basta).
   aplica(B) é idempotente: aplicar duas vezes dá o mesmo banco.

   Fontes:
   - Portaria SMS 2.619/2011: legislacao.prefeitura.sp.gov.br (texto compilado, com as Portarias
     SMS 902/2019, 328/2024 e 266/2025).
   - Leis federais com redação antiga ao lado da vigente (texto compilado do Planalto): ECA, Estatuto
     da Pessoa Idosa, Leis 6.360/1976, 6.437/1977, 5.991/1973, 13.146/2015, 10.098/2000 e
     Decreto-Lei 986/1969. Cada uma é trocada inteira pelo texto atualizado da Câmara dos Deputados
     (só a redação vigente), lido por scripts/banco/camara.cjs e gravado em scripts/banco/vigente/
     (conferência de 18/11/2026; o Planalto estava inacessível).
   - Lei Municipal 13.725/2004: legislacao.prefeitura.sp.gov.br. */

const P2619 = 'Portaria SMS nº 2.619/2011, legislacao.prefeitura.sp.gov.br';
const {FONTES} = require('./vigente/fontes.cjs');

const CORRECOES = [
  {norma: 'portaria-sms-2619-2011', fonte: P2619,
   motivo: 'Item 16.1 trazia o texto revogado do 16.1.2; 16.1.4 e 9.9 tinham a redação antiga ao lado da vigente; ' +
     'os incisos do 9.9.2 estavam pendurados no item 9 e os do 9.24 (alimentos quentes e frios) num inciso do item 9.',
   tira: ['n16.1.4b', 'n9.9b', 'n9-i', 'n9-ii', 'n9-iii', 'n9-iii-a', 'n9-iii-b', 'n9-iii-ab', 'n9-iii-bb'],
   poe: [
     ['n16.1', 'A pessoa física ou jurídica que realize atividades de produção, manipulação, fracionamento, embalagem, armazenamento, importação, transporte, distribuição ou venda deve possuir responsável técnico legalmente habilitado, de acordo com os critérios estabelecidos pelos Conselhos Profissionais.', null, null],
     ['n16.1.2', '(Revogado pela Portaria SMS nº 266/2025)', {s: 'revogado'}, 'n16.1'],
     ['n16.1.4', 'Nas empresas dispensadas da obrigatoriedade de possuir responsável técnico legalmente habilitado, o proprietário ou pessoa por ele designada deve apresentar certificado de curso de Boas Práticas de Manipulação de Alimentos, com carga horária mínima de oito horas, promovido pelos órgãos competentes do Sistema Nacional de Vigilância Sanitária; ou órgãos da Prefeitura Municipal de São Paulo, desde que o curso tenha sido certificado pela Coordenadoria de Vigilância em Saúde; ou apresentar certificado de curso de capacitação em Boas Práticas de Manipulação de Alimentos emitido por entidade de ensino reconhecida por órgãos vinculados ao Ministério da Educação - MEC ou à Secretaria da Educação do Estado de São Paulo. (Redação dada pela Portaria SMS nº 902/2019)', null, null],
     ['n9.9', 'O manuseio de pães, e outros similares de consumo alimentar, somente podem ser expostos para venda em sistema de autosserviço quando estiverem dispostos em recipientes providos de protetores higiênicos, nos estabelecimentos comerciais no Município de São Paulo. (Redação dada pela Portaria SMS nº 328/2024)', null, null],
     ['n9.9.2-i', 'Disponibilizar pegadores próprios para o manuseio pelos consumidores, dos produtos de consumo alimentar dispostos para aquisição; (Incluído pela Portaria SMS nº 328/2024)', null, 'n9.9.2'],
     ['n9.9.2-ii', 'Fixar na parte externa dos protetores higiênicos, em local visível, informativo contendo data de fabricação e de validade dos produtos; (Incluído pela Portaria SMS nº 328/2024)', null, 'n9.9.2-i'],
     ['n9.9.2-iii', 'orientar os consumidores por meio de cartazes ou outro meio de comunicação a proibição de tocar os alimentos com as mãos. (Incluído pela Portaria SMS nº 328/2024)', null, 'n9.9.2-ii'],
     ['n9.24-i', 'Alimentos quentes:', null, 'n9.24'],
     ['n9.24-i-a', 'Em temperaturas superiores a 60ºC, por no máximo por 6 horas;', null, 'n9.24-i'],
     ['n9.24-i-b', 'Em temperaturas abaixo de 60ºC, por no máximo por 1 hora.', null, 'n9.24-i-a'],
     ['n9.24-ii', 'Alimentos frios, que dependam somente da temperatura para a sua conservação:', null, 'n9.24-i-b'],
     ['n9.24-ii-a', 'Até 10ºC, por no máximo 4 horas;', null, 'n9.24-ii'],
     ['n9.24-ii-b', 'Entre 10ºC e 21ºC, por no máximo 2 horas. Exceto preparações com pescados e carnes cruas.', null, 'n9.24-ii-a']
   ]},
  {norma: 'lei-municipal-13725-2004', fonte: 'Lei Municipal nº 13.725/2004, legislacao.prefeitura.sp.gov.br',
   motivo: 'Art. 49 terminava com o resto do título do Capítulo II (“DE INTERESSE DA SAÚDE”).',
   tira: [],
   poe: [['a49', 'A rotulagem de produtos de interesse da saúde deve obedecer às exigências da legislação vigente.', null, null]]},
  /* Portaria SMS 266/2025: arts. 23, § 1º, 40, parágrafo único, e 45 alterados pela Portaria SMS 456/2025; o banco
     guardava a redação original ao lado da nova (sufixo b) e, no art. 45, os incisos colados ao caput e o rodapé
     do site colado ao parágrafo único. */
  {norma: 'portaria-sms-266-2025', fonte: 'Portaria SMS nº 266/2025, legislacao.prefeitura.sp.gov.br (texto com a Portaria SMS nº 456/2025)',
   motivo: 'Redação original ao lado da vigente nos arts. 23, 40 e 45.',
   tira: ['a23p1b', 'a40pub', 'a45b', 'a45bpu', 'a45bpub'],
   poe: [
     ['a23p1', 'Excetua-se do disposto no caput deste artigo o exercício de atividades econômicas sujeitas à vigilância sanitária, de Nível de Risco III (Alto), que exigem vistoria prévia e licenciamento sanitário, mesmo quando exercidas por Microempreendedor Individual (MEI). (Redação dada pela Portaria SMS n° 456/2025)', null, null],
     ['a40pu', 'As Licenças de Funcionamento Sanitárias que foram emitidas em data anterior à publicação da Portaria 2215/2016 de 14/12/2016, com publicação no Diário Oficial da Cidade – DOC, e que não possuem validade de licença descrita no Anexo I desta portaria, permanecem válidas. (Redação dada pela Portaria SMS n° 456/2025)', null, null],
     ['a45', 'Esta Portaria entrará em vigor em 11/08/2025, revogando-se: (Redação dada pela Portaria SMS n° 456/2025)', null, null],
     ['a45-i', 'a Portaria SMS.G nº 2.215, de 14 de dezembro de 2016, e suas atualizações; e', null, 'a45'],
     ['a45-ii', 'o subitem 16.1.2 da Portaria SMS.G nº 2.619, de 6 de dezembro de 2011, que dispõe sobre o Regulamento Técnico de Boas Práticas de Manipulação de Alimentos.', null, 'a45-i'],
     ['a45pu', 'Os anexos I, II, III, IV, V e os Formulários referidos na presente Portaria, em complemento ao texto legal, serão publicados e disponibilizados, na íntegra, no endereço eletrônico da Coordenadoria de Vigilância em Saúde - Covisa, no item Licenciamento Sanitário – CMVS, a partir de sua vigência, conforme disposto no caput deste artigo. (Redação dada pela Portaria SMS n° 456/2025)', null, 'a45-ii']
   ]},
  {norma: 'rdc-anvisa-1015-2026', fonte: 'RDC Anvisa nº 1.015/2026, AnvisaLegis (texto com a RDC nº 1.023/2026)',
   motivo: 'Art. 43: a redação original (com o cabeçalho da norma colado) ao lado da redação dada pela RDC 1.023/2026.',
   tira: ['a43b'],
   poe: [['a43', 'Os procedimentos de importação e exportação devem seguir, no que couber, o disposto na Resolução da Diretoria Colegiada - RDC nº 988, de 15 de agosto de 2025, e na Resolução da Diretoria Colegiada - RDC nº 81, de 5 de novembro de 2008, e suas atualizações. (Redação dada pela Resolução da Diretoria Colegiada Anvisa nº 1.023, de 11/05/2026)', null, null]]},
  {norma: 'lei-municipal-10348-1987', fonte: 'Lei Municipal nº 10.348/1987, legislacao.prefeitura.sp.gov.br',
   motivo: 'Art. 9º, parágrafo único: a redação original ao lado da dada pela Lei 12.751/1998.',
   tira: ['a9pub'],
   poe: [['a9pu', 'O Relatório de Inspeção Anual deverá ser fornecido anualmente pelo proprietário do aparelho de transporte à Prefeitura. (Redação dada pela Lei nº 12.751/1998)', null, null]]},
  {norma: 'rdc-anvisa-16-2014', fonte: 'RDC Anvisa nº 16/2014, AnvisaLegis (texto compilado)',
   motivo: 'Art. 4º, caput e § 3º: faltavam o ponto final e o fecho da nota de alteração.',
   poe: [
     ['a4', 'A AE é exigida para o exercício das atividades descritas no art. 3º ou qualquer outra, para qualquer fim, com as substâncias, plantas e fungos sujeitos a controle especial ou com os medicamentos ou produtos que as contenham, segundo o disposto na Portaria SVS/MS nº 344, de 1998 e na Portaria SVS/MS nº 6, de 29 de janeiro de 1999. (Redação dada pela Resolução da Diretoria Colegiada Anvisa nº 1.015, de 02/02/2026)', null, null],
     ['a4p3', 'Quando se tratar de finalidade exclusiva de ensino e de pesquisa, no âmbito estritamente acadêmico, as instituições de ensino superior ou técnico, inclusive suas fundações de apoio, devem solicitar a Autorização Especial Simplificada para Instituição de Ensino e Pesquisa (AEP), nos termos da Resolução da Diretoria Colegiada - RDC nº 988, de 15 de agosto de 2025. (Redação dada pela Resolução da Diretoria Colegiada Anvisa nº 1.013, de 30/01/2026)', null, null]
   ]},
  {norma: 'decreto-federal-8077-2013', fonte: 'Decreto nº 8.077/2013 (revogação do art. 21 pelo Decreto nº 11.161/2022)',
   motivo: 'Art. 21 revogado trazia a redação antiga e a palavra “Vigência” do link do site.',
   poe: [['a21', '(Revogado pelo Decreto nº 11.161, de 2022)', {s: 'revogado'}, null]]},
  /* RDC 47/2013 e 48/2013: o Anexo II abre com um sumário (“19. Amostras de Retenção”) que o banco gravou como os
     itens 1 a 19, e o texto real dos itens ficou com sufixo b (n19b); os artigos da Resolução GMC do Anexo I
     disputavam o rótulo com os artigos da própria RDC. */
  {norma: 'rdc-anvisa-47-2013', fonte: 'RDC Anvisa nº 47/2013, AnvisaLegis', sumario: true,
   motivo: 'Anexo II: sumário gravado como itens; Anexo I: artigos da Resolução GMC nº 31/12 com o rótulo dos artigos da RDC.',
   renomeia: [1, 2, 3, 4, 5].map(k => ['a' + k + 'b', 'gmc-a' + k, {r: 'Anexo I (Resolução GMC nº 31/12), art. ' + k}])},
  {norma: 'rdc-anvisa-48-2013', fonte: 'RDC Anvisa nº 48/2013, AnvisaLegis', sumario: true,
   motivo: 'Anexo II: sumário gravado como itens; Anexo I: artigos da Resolução GMC nº 19/11 com o rótulo dos artigos da RDC.',
   renomeia: [1, 2, 3, 4, 5].map(k => ['a' + k + 'b', 'gmc-a' + k, {r: 'Anexo I (Resolução GMC nº 19/11), art. ' + k}])},
  ...Object.keys(FONTES).map(norma => ({norma, fonte: 'Câmara dos Deputados, Legislação Informatizada, norma atualizada — ' + FONTES[norma].url,
    motivo: 'O texto compilado trazia a redação antiga ao lado da vigente sob o mesmo rótulo (sufixo b), artigos com letra ' +
      'misturados com redações antigas e trechos de outras leis alteradas como se fossem dispositivos desta.',
    conferido: '2026-11-18', vigente: require('./vigente/' + norma + '.json')}))
];

/* Limpeza geral dos textos copiados dos sites (todas as normas não reconstruídas):
   1. rodapé colado ao último dispositivo — assinaturas, “Brasília, …”, “PREFEITURA DO MUNICÍPIO DE SÃO PAULO,
      aos …”, “PUB D.O.U., … – Seção 1”, “Este texto não substitui …”, “Voltar ao Topo”, “=====”;
   2. título do capítulo seguinte colado ao fim do dispositivo (“… das áreas contaminadas. DO TRABALHO”);
   3. nota de alteração sem o parêntese final (“(Redação dada pela RDC nº 1.015, de 02/02/2026”). */
const UP = 'A-ZÁÉÍÓÚÂÊÔÃÕÇÜ';
const ASSINATURA = new RegExp('\\s+(?:[' + UP + '][\'' + UP + '.-]*\\s+){1,7}[' + UP + '][\'' + UP + '.-]+\\s+Diretor-Presidente(?:\\s+Substituto)?$');
const TITULO = new RegExp('([.;:])\\s+(?:[' + UP + '][\'' + UP + '.-]*\\s+){1,7}[' + UP + '][\'' + UP + '.-]+$');
const NOTA = /\((?:Reda[cç][aã]o dada|Inclu[ií]d[oa]|Acrescid[oa]|Revogad[oa]|Retificad[oa]|Regulamentad[oa]|Vide)[^()]{0,160}?(?:\d{4}|\d{1,2}\/\d{1,2}\/\d{4})\s*$/;
function limpaTexto(t) {
  let s = String(t);
  s = s.replace(/\s*={5,}[\s\S]*$/, '');
  s = s.replace(/\s*(?:Este (?:texto|conteúdo) não substitui[\s\S]*|Temas Relacionados Voltar ao Topo[\s\S]*|Alterações Voltar ao Topo[\s\S]*|Correlações Voltar ao Topo[\s\S]*|Retirado do site [\s\S]*|collections Galeria de imagens[\s\S]*|REPORTAR ERRO[\s\S]*)$/, '');
  s = s.replace(/\s*(?:PUB\s+)?D\.O\.U\.,?\s*\d{2}\/\d{2}\/\d{4}(?:\s*-\s*Seção\s*\d+)?(?:\s*(?:REP|RET)\.,\s*\d{2}\/\d{2}\/\d{4}(?:\s*-\s*Seção\s*\d+)?)*\s*$/, '');
  s = s.replace(new RegExp('\\s+(?:RET|REP)\\.,\\s*\\d{2}\\/\\d{2}\\/\\d{4}(?:\\s*-\\s*Seção\\s*\\d+)?(?:\\s+[' + UP + '][\'' + UP + '.-]+)*\\s*$'), '');
  s = s.replace(/\s+Brasília,\s+\d{1,2}º?\s+de\s+\S+\s+de\s+\d{4}[;,][\s\S]*$/, '');
  s = s.replace(/\s*PREFEITURA DO MUNIC[IÍ]PIO DE S[AÃ]O PAULO,?\s+a?os?\s+\d[\s\S]*$/, '');
  s = s.replace(ASSINATURA, '').replace(TITULO, '$1').trim();
  const abre = (s.match(/\(/g) || []).length, fecha = (s.match(/\)/g) || []).length;
  if (abre > fecha && NOTA.test(s)) s += ')';
  return s;
}

function norma(B, id, opcional) {
  for (const g of Object.keys(B.g)) { const n = B.g[g].find(x => x.i === id); if (n) return n; }
  if (opcional) return null;
  throw Error('banco: norma ausente — ' + id);
}

/* Aplica as correções ao objeto do banco (já em JSON.parse). Devolve o número de mudanças.
   parcial: banco recortado (ex.: o banco compacto embutido no módulo de Alimentos) — as normas
   que ele não tem ficam de fora. */
function aplica(B, parcial) {
  let mudou = 0;
  for (const c of CORRECOES) {
    const L = norma(B, c.norma, parcial);
    if (!L) continue;
    if (c.vigente) {
      const novo = JSON.stringify(c.vigente);
      if (JSON.stringify(L.n) !== novo || L.unico !== 1 || L.vd !== c.conferido) { L.n = JSON.parse(novo); L.unico = 1; L.vd = c.conferido; mudou++; }
      continue;
    }
    if (c.sumario) {
      /* itens do sumário (nK) saem; o texto real (nKb e seus subitens nKb-x) fica com o número do item */
      const ks = L.n.map(x => /^n(\d+)b$/.exec(x[0])).filter(Boolean).map(m => m[1]);
      if (ks.length) {
        L.n = L.n.filter(x => !ks.some(k => x[0] === 'n' + k));
        for (const x of L.n) {
          const m = /^n(\d+)b((?:-.*)?)$/.exec(x[0]);
          if (!m || !ks.includes(m[1])) continue;
          x[0] = 'n' + m[1] + m[2];
          if (!m[2] && x[2] && /NUMERACAO DUPLICADA/.test(x[2].obs || '')) x.length = 2;
        }
        mudou++;
      }
    }
    for (const [de, para, meta] of c.renomeia || []) {
      const k = L.n.findIndex(x => x[0] === de); if (k < 0) continue;
      if (L.n.some(x => x[0] === para)) throw Error(c.norma + ': ' + para + ' já existe');
      L.n[k] = meta ? [para, L.n[k][1], meta] : [para, L.n[k][1]]; mudou++;
    }
    const antes = L.n.length; L.n = L.n.filter(x => !(c.tira || []).includes(x[0])); mudou += antes - L.n.length;
    for (const [id, texto, meta, depois] of c.poe || []) {
      const novo = meta ? [id, texto, meta] : [id, texto];
      const k = L.n.findIndex(x => x[0] === id);
      if (k >= 0) { if (JSON.stringify(L.n[k]) !== JSON.stringify(novo)) { L.n[k] = novo; mudou++; } continue; }
      const d = L.n.findIndex(x => x[0] === depois);
      if (d < 0) throw Error(c.norma + ': ' + id + ' deveria entrar depois de ' + depois + ', que não existe');
      L.n.splice(d + 1, 0, novo); mudou++;
    }
  }
  for (const g of Object.keys(B.g)) for (const L of B.g[g]) {
    if (L.unico) continue;
    for (const x of L.n) { const t = limpaTexto(x[1]); if (t !== x[1]) { x[1] = t; mudou++; } }
  }
  return mudou;
}

module.exports = {CORRECOES, aplica, limpaTexto};
