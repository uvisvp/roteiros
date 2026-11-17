'use strict';
/* Correções pontuais no banco de legislação (bloco banco--v11), conferidas com o texto oficial
   (conferência de 17/11/2026). O banco continua protegido: scripts/test-pwa-scope.cjs só aceita,
   em norma já existente, exatamente as mudanças desta lista.

   Cada correção diz o estado final de cada dispositivo tocado:
     poe:  [id, texto, meta|null, depoisDe]  — grava o texto (e a marca, ex. {s:'revogado'}) no id;
           se o id ainda não existe, entra logo depois de `depoisDe`;
     tira: [ids]                             — dispositivos que deixam de existir.
   aplica(B) é idempotente: aplicar duas vezes dá o mesmo banco.

   Fontes:
   - Portaria SMS 2.619/2011: legislacao.prefeitura.sp.gov.br (texto compilado, com as Portarias
     SMS 902/2019, 328/2024 e 266/2025).
   - Lei 6.360/1976: texto atualizado e publicação original da Câmara dos Deputados (o Planalto
     estava inacessível; o art. 67, III, nunca foi alterado e diz “prazo de validade”).
   - Lei Municipal 13.725/2004: legislacao.prefeitura.sp.gov.br. */

const P2619 = 'Portaria SMS nº 2.619/2011, legislacao.prefeitura.sp.gov.br';
const L6360 = 'Lei 6.360/1976, Câmara dos Deputados (norma atualizada e publicação original)';

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
  {norma: 'lei-federal-6360-1976', fonte: L6360,
   motivo: 'Art. 12: o caput e os §§ 1º e 3º traziam, colados, os §§ 1º, 3º e 8º revogados; §§ 2º, 4º a 7º e 9º estavam ' +
     'fundidos em outros dispositivos. Art. 67: o inciso III trazia os incisos IV a VI e “prazo da validade”.',
   tira: [],
   poe: [
     ['a12', 'Nenhum dos produtos de que trata esta Lei, inclusive os importados, poderá ser industrializado, exposto à venda ou entregue ao consumo antes de registrado no Ministério da Saúde.', null, null],
     ['a12p1', 'A Agência Nacional de Vigilância Sanitária - ANVISA - definirá por ato próprio o prazo para renovação do registro dos produtos de que trata esta Lei, não superior a 10 (dez) anos, considerando a natureza do produto e o risco sanitário envolvido na sua utilização. (Redação dada pela Lei nº 13.097, de 2015)', null, null],
     ['a12p2', 'Excetua-se do disposto no parágrafo anterior a validade do registro e da revalidação do registro dos produtos dietéticos, cujo prazo é de 2 (dois) anos.', null, 'a12p1'],
     ['a12p3', 'Ressalvado o disposto nos arts. 17-A, 21 e 24-A, o registro será concedido no prazo máximo de noventa dias, a contar da data de protocolo do requerimento, salvo nos casos de inobservância, por parte do requerente, a esta Lei ou a seus regulamentos. (Redação dada pela Lei nº 13.411, de 2016)', null, null],
     ['a12p4', 'Os atos referentes ao registro e à revalidação do registro somente produzirão efeitos a partir da data da publicação no Diário Oficial da União.', null, 'a12p3'],
     ['a12p5', 'A concessão do registro e de sua revalidade, e as análises prévia e de controle, quando for o caso, ficam sujeitas ao pagamento de preços públicos, referido no art. 82.', null, 'a12p4'],
     ['a12p6', 'A revalidação do registro deverá ser requerida no primeiro semestre do último ano do qüinqüênio de validade, considerando-se automaticamente revalidado, independentemente de decisão, se não houver sido esta proferida até a data do término daquela.', null, 'a12p5'],
     ['a12p7', 'Será declarada a caducidade do registro do produto cuja revalidação não tenha sido solicitada no prazo referido no § 6º deste artigo.', null, 'a12p6'],
     ['a12p8', 'Não será revalidado o registro: (Redação dada pela Lei nº 13.411, de 2016)', null, null],
     ['a12p8-ii', 'do medicamento que não tenha sido comercializado durante pelo menos o tempo correspondente aos dois terços finais do período de validade do registro expirado. (Incluído pela Lei nº 13.411, de 2016)', null, null],
     ['a12p9', 'Constará obrigatoriamente do registro de que trata este artigo a fórmula da composição do produto, com a indicação dos ingredientes utilizados e respectiva dosagem.', null, 'a12p8-ii'],
     ['a67-iii', 'vender ou expor à venda produto cujo prazo de validade esteja expirado;', null, null],
     ['a67-iv', 'apor novas datas em produtos cujo prazo de validade haja expirado ou reacondicioná-los em novas embalagens, excetuados os soros terapêuticos que puderem ser redosados e refiltrados;', null, 'a67-iii'],
     ['a67-v', 'industrializar produtos sem assistência de responsável técnico legalmente habilitado;', null, 'a67-iv'],
     ['a67-vi', 'utilizar, na preparação de hormônios, órgãos de animais que não estiverem sãos, ou que apresentarem sinais de decomposição no momento de serem manipulados, ou que provenham de animais doentes, estafados ou emagrecidos;', null, 'a67-v']
   ]},
  {norma: 'lei-municipal-13725-2004', fonte: 'Lei Municipal nº 13.725/2004, legislacao.prefeitura.sp.gov.br',
   motivo: 'Art. 49 terminava com o resto do título do Capítulo II (“DE INTERESSE DA SAÚDE”).',
   tira: [],
   poe: [['a49', 'A rotulagem de produtos de interesse da saúde deve obedecer às exigências da legislação vigente.', null, null]]}
];

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
    const antes = L.n.length; L.n = L.n.filter(x => !c.tira.includes(x[0])); mudou += antes - L.n.length;
    for (const [id, texto, meta, depois] of c.poe) {
      const novo = meta ? [id, texto, meta] : [id, texto];
      const k = L.n.findIndex(x => x[0] === id);
      if (k >= 0) { if (JSON.stringify(L.n[k]) !== JSON.stringify(novo)) { L.n[k] = novo; mudou++; } continue; }
      const d = L.n.findIndex(x => x[0] === depois);
      if (d < 0) throw Error(c.norma + ': ' + id + ' deveria entrar depois de ' + depois + ', que não existe');
      L.n.splice(d + 1, 0, novo); mudou++;
    }
  }
  return mudou;
}

module.exports = {CORRECOES, aplica};
