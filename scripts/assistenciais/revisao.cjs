'use strict';
/* Serviços assistenciais — revisão de 12/11/2026 (aplicada por scripts/repack-assistenciais-revisao.cjs).

   1. Redação (redacao.json): as perguntas da Inspeção diziam todas “Está atendida a exigência de X?”,
      e o relatório repetia “Não está atendida a exigência de ausência de estoque…”. Passam a pergunta
      direta, com sujeito e verbo (“Os medicamentos ficam em local seguro…?”), que o relatório converte em
      “Não se constatou que os medicamentos ficam…”. As posições não mudam (as respostas são gravadas
      pela posição); perguntas ocultas pela revisão não são reescritas.

   2. Repetições (OCULTAR): a mesma exigência perguntada duas vezes na modalidade sai da tela, das
      contagens e do relatório (marca rep, a mesma de scripts/repack-assistenciais-repeticao.cjs):
      - licença: o nº CMVS identifica a própria Licença de Funcionamento Sanitária (Portaria SMS
        nº 266/2025, art. 2º, XXXV), então “CMVS”, “cadastro”, “laudo ou licença” e a licença genérica
        eram o mesmo documento pedido de 2 a 4 vezes. Fica um documento de licença por modalidade: o da
        norma específica (ILPI, RDC 502/2021, art. 8º; Centro Dia, Portaria SMS nº 5/2019, item 12.1;
        CT, RDC 29/2011, art. 3º), com a Portaria 266 nos fundamentos, ou, sem norma específica, o
        genérico (SRT, SAICA, demais);
      - pergunta da Inspeção que repete um documento já pedido (RT e carga horária, plano de trabalho,
        rotinas de alimentação, cópia da RDC, PTI, vacinação, escala, CMDCA/COMAS, prontuário, Guia de
        Acolhimento…) ou outra pergunta (controlados e termolábeis, já na pergunta de guarda);
      - ILPI: “aprovação prévia do projeto arquitetônico” contradizia o documento da estrutura física
        (no Município de São Paulo o projeto da ILPI não é aprovado pela vigilância nem exige DCFF).

   3. Fundamentos (cita):
      - Centro Dia é estabelecimento de interesse da saúde (Portaria SMS nº 5/2019, editada com base
        nos arts. 10 e 69 da Lei nº 13.725/2004): os arts. 61 a 68 (assistência à saúde) passam ao
        art. 69, como em SAICA e nos demais acolhimentos;
      - Lei Federal nº 15.378/2026 (Estatuto dos Direitos do Paciente) vale para serviços de saúde
        (art. 3º): sai de Centro Dia, CT, SAICA e demais acolhimentos e dos itens de medicamentos (os
        arts. 11, 12 e 19 tratam de informação e acesso ao prontuário, não de registro de
        administração); fica, com os arts. 8º e 9º (e 17, privacidade), nos cuidados de saúde, área
        de apoio e equipamentos da ILPI e da SRT;
      - citações truncadas (“Item 14.3 da itens 2.4 e 7.1 do Regulamento…”) e “Arts. 13 E 14”.
   Idempotente. */

const REDACAO = require('./redacao.json');

/* [modalidade, tipo, texto (início), quem cobre a exigência] */
const OCULTAR = [
  ['ilpi', 'doc', 'Licença ou dispensa de licença sanitária', 'doc1'],
  ['ilpi', 'doc', 'Cadastro Municipal de Vigilância em Saúde (CMVS)', 'doc1'],
  ['ilpi', 'rot', 'Está atendida a exigência de aprovação prévia do projeto arquitetônico', 'doc6'],
  ['ilpi', 'rot', 'Está atendida a exigência de Responsável Técnico com formação de nível superior e carga horária mínima de 20', 'doc8'],
  ['ilpi', 'rot', 'Está atendida a exigência de plano de trabalho e participação efetiva', 'doc18'],
  ['ilpi', 'rot', 'Está atendida a exigência de normas e rotinas técnicas dos cinco procedimentos', 'doc22'],
  ['ilpi', 'rot', 'Está atendida a exigência de disponibilidade de cópia da RDC', 'doc31'],
  ['centrodia', 'doc', 'Licença ou dispensa de licença sanitária', 'doc1'],
  ['centrodia', 'doc', 'Cadastro Municipal de Vigilância em Saúde (CMVS)', 'doc1'],
  ['centrodia', 'rot', 'Está atendida a exigência de licença sanitária vigente', 'doc1'],
  ['centrodia', 'rot', 'Está atendida a exigência de contrato de prestação de serviços firmado com cada usuário e pastas', 'doc12'],
  ['centrodia', 'rot', 'Está atendida a exigência de Plano de Trabalho e Plano de Atenção', 'doc16'],
  ['ct', 'doc', 'Licença ou dispensa de licença sanitária', 'doc1'],
  ['ct', 'doc', 'Cadastro Municipal de Vigilância em Saúde (CMVS)', 'doc1'],
  ['ct', 'rot', 'Está atendida a exigência de mecanismos de encaminhamento à rede de saúde', 'doc19'],
  ['srt', 'doc', 'Cadastro Municipal de Vigilância em Saúde (CMVS)', 'doc0'],
  ['srt', 'rot', 'Está atendida a exigência de vínculo do módulo residencial', 'doc3'],
  ['srt', 'rot', 'Está atendida a exigência de comprovação de vacinação dos moradores', 'doc8'],
  ['srt', 'rot', 'Está atendida a exigência de cuidadores de referência do módulo', 'doc9'],
  ['srt', 'rot', 'Está atendida a exigência de armazenamento de termolábeis', 'rot15'],
  ['saica', 'doc', 'Cadastro Municipal de Vigilância em Saúde (CMVS)', 'doc0'],
  ['saica', 'doc', 'Laudo ou licença da vigilância sanitária', 'doc0'],
  ['saica', 'rot', 'Está atendida a exigência de cadastro do estabelecimento', 'doc0'],
  ['saica', 'rot', 'Está atendida a exigência de registro no CMDCA-SP', 'doc2'],
  ['saica', 'rot', 'Está atendida a exigência de quadro mínimo de profissionais', 'doc12'],
  ['saica', 'rot', 'Está atendida a exigência de prontuário unificado', 'doc6'],
  ['saica', 'rot', 'Está atendida a exigência de Guia de Acolhimento', 'doc8'],
  ['demais', 'doc', 'Cadastro Municipal de Vigilância em Saúde (CMVS)', 'doc0'],
  ['demais', 'rot', 'Está atendida a exigência de cadastro do estabelecimento', 'doc0'],
  ['demais', 'rot', 'Está atendida a exigência de controle de medicamentos sujeitos a controle especial', 'rot21'],
  ['demais', 'rot', 'Está atendida a exigência de registro individual de cada usuário', 'doc9'],
  ['demais', 'rot', 'Está atendida a exigência de regularidade sanitária da empresa fornecedora', 'doc16'],
];

/* textos de documento e de infração: [modalidade, tipo, texto atual, texto novo] */
const TEXTOS = [
  ['ilpi', 'doc', 'Alvará sanitário atualizado, afixado em local visível.',
    'Alvará sanitário (Licença de Funcionamento Sanitária) atualizado, expedido pelo órgão sanitário competente.'],
  ['ilpi', 'inf', 'Manter em funcionamento Instituição de Longa Permanência para Idosos sem alvará sanitário atualizado ou sem afixá-lo em local visível ao público.',
    'Manter em funcionamento Instituição de Longa Permanência para Idosos sem alvará sanitário atualizado expedido pelo órgão sanitário competente.'],
];

/* a licença que fica recebe a Portaria SMS nº 266/2025 (licenciamento municipal) nos fundamentos */
const LICENCA = {ilpi: 'Alvará sanitário (Licença', centrodia: 'Licença sanitária emitida', ct: 'Licença sanitária atualizada'};

const L13 = 'lei-municipal-13725-2004', E15 = 'lei-federal-15378-2026';
const SAUDE_15378 = new Set(['ilpi', 'srt']);
const ASSIST = /^a6[1-8]$/;

function cita(sv, kind, x, refs266) {
  let l = x.l, refs = x.refs.slice();
  /* citações truncadas */
  l = l.replace(/ da itens 2\.4 e 7\.1 do Regulamento anexo/g, ' do Regulamento anexo').replace(/\bArts\. 13 E 14\b/g, 'Arts. 13 e 14');
  /* Lei 15.378/2026 */
  const tem = refs.some(r => r.law === E15) || /15\.378/.test(l);
  if (tem) {
    const med = refs.some(r => r.law === E15 && /^a1[12]$/.test(r.node));
    if (!SAUDE_15378.has(sv) || med) {
      l = l.replace(/;\s*arts?\.\s[^;]*?\sda Lei Federal nº 15\.378\/2026/g, '')
           .replace(/,\s*c\/c Lei Federal nº 15\.378\/2026, arts?\.\s[^;]*?(?=,\se\s|;|\.?$)/g, '')
           .replace(/;\s*Lei Federal nº 15\.378\/2026, arts?\.\s[^;]*?(?=;|\.?$)/g, '');
      refs = refs.filter(r => r.law !== E15);
    } else {
      l = l.replace(/arts\. 8º, 9º e 19 da Lei Federal nº 15\.378\/2026/g, 'arts. 8º e 9º da Lei Federal nº 15.378/2026');
      refs = refs.filter(r => !(r.law === E15 && /^a(11|12|19)$/.test(r.node)));
    }
    if (/15\.378/.test(l) !== refs.some(r => r.law === E15)) throw Error(sv + ' ' + kind + ': Lei 15.378 no texto e nos botões não conferem — ' + l);
  }
  /* Centro Dia: interesse da saúde (art. 69) */
  if (sv === 'centrodia') {
    const ART = '6[1-8]', LISTA = `${ART}(?:(?:,| e) ${ART})*`;
    l = l.replace(new RegExp(`\\barts?\\. ${LISTA} da Lei Municipal nº 13\\.725/2004`, 'g'), 'art. 69 da Lei Municipal nº 13.725/2004')
         .replace(new RegExp(`Lei Municipal nº 13\\.725/2004, arts?\\. ${LISTA}(?=[,;.]|$)`, 'g'), 'Lei Municipal nº 13.725/2004, art. 69');
    if (refs.some(r => r.law === L13 && ASSIST.test(r.node))) {
      const modelo = refs.find(r => r.law === L13 && ASSIST.test(r.node));
      refs = refs.filter(r => !(r.law === L13 && ASSIST.test(r.node)));
      if (!refs.some(r => r.law === L13 && r.node === 'a69')) refs.unshift(Object.assign({}, modelo, {node: 'a69', display: 'Art. 69'}));
    }
    if (/Lei Municipal nº 13\.725\/2004, arts?\. 6[1-8]\b|\barts?\. 6[1-8](?:(?:,| e) \d+)* da Lei Municipal nº 13\.725/.test(l)) throw Error('Centro Dia: artigo de assistência à saúde restante — ' + l);
  }
  /* licença que fica: Portaria 266 */
  if (kind === 'doc' && LICENCA[sv] && x.i.startsWith(LICENCA[sv]) && !/266\/2025/.test(l)) {
    l = l.replace(/\.?$/, '') + '; Portaria SMS nº 266/2025 (texto consolidado)';
    refs = refs.concat(refs266.filter(r => !refs.some(y => y.law === r.law && y.node === r.node)));
  }
  return {l, refs};
}

module.exports = {REDACAO, OCULTAR, TEXTOS, cita};
