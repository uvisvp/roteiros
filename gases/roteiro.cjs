/* Atacadista de gases medicinais no núcleo Medicamentos do Roteiros (17/10/2026:
   o Roteiros passa a ter tudo o que o site Medicamentos tinha). Base:
   medicamentos/roteiros/gases-medicinais.cjs (RDC 887/2024 e RDC 870/2024),
   com as orientações técnicas do mesmo site e, nas perguntas compostas,
   checklist por ponto (Atende / Não atende / N/A). */
'use strict';
const copia = x => JSON.parse(JSON.stringify(x));
const d = copia(require('../medicamentos/roteiros/gases-medicinais.cjs'));
const ORIENT = require('../medicamentos/orientacoes/orientacoes.cjs').rs['gases-medicinais'] || {};
d.secoes.forEach(s => s.itens.forEach(i => { if (ORIENT[i.id]) i.orient = copia(ORIENT[i.id]); }));
d.store = 'uvis-gases-medicinais-v1';
const perg = id => { for (const s of d.secoes) for (const i of s.itens) for (const q of i.perguntas || []) if (q.id === id) return q; throw Error('pergunta ' + id); };
const PONTOS = {
  afe: ['A autorização de funcionamento não atende: {}.', [['afe', 'AFE para as atividades exercidas'], ['classe', 'classe gases medicinais distinta da de medicamentos'], ['ae', 'AE, quando aplicável']]],
  estrutura: ['A estrutura para as operações não é adequada ou suficiente quanto a: {}.', [['locais', 'locais'], ['instalacoes', 'instalações'], ['veiculos', 'veículos'], ['pessoal', 'pessoal']]],
  treinamento: ['A sistemática de treinamento não contempla: {}.', [['descrita', 'sistemática descrita'], ['inicial', 'treinamento inicial'], ['periodico', 'treinamento periódico e contínuo'], ['matriz', 'matriz de treinamento por cargo']]],
  registros_trein: ['Os registros de treinamento não trazem: {}.', [['treinando', 'identificação do treinando'], ['data', 'data'], ['carga', 'carga horária'], ['estrategia', 'estratégia'], ['assuntos', 'assuntos'], ['eficacia', 'avaliação da eficácia']]],
  conduta: ['Foram constatados, nas áreas de recepção, armazenagem, expedição ou devolução: {}.', [['fumo', 'fumo'], ['alimentos', 'alimentos'], ['bebidas', 'bebidas (exceto água em local próprio)'], ['plantas', 'plantas'], ['objetos', 'objetos estranhos']]],
  sgq: ['O Sistema de Gestão da Qualidade não contempla: {}.', [['documentado', 'documentação do SGQ'], ['abrangencia', 'todos os aspectos que influenciam a qualidade'], ['contingencia', 'plano de contingência para desabastecimento']]],
  mudancas: ['A gestão de mudanças e não conformidades não contempla: {}.', [['mudancas', 'controle e gerenciamento de mudanças'], ['registro', 'registro e investigação das não conformidades'], ['capa', 'ações corretivas e preventivas']]],
  gestao_doc: ['A gestão de documentos não contempla: {}.', [['elaboracao', 'elaboração'], ['revisao', 'revisão'], ['aprovacao', 'aprovação'], ['distribuicao', 'distribuição'], ['guarda', 'guarda'], ['obsolescencia', 'obsolescência']]],
  pops: ['Os POPs não atendem: {}.', [['compreensiveis', 'compreensíveis'], ['abrangencia', 'cobrem todas as atividades'], ['atualizados', 'atualizados'], ['disponiveis', 'disponíveis nos locais de trabalho']]],
  integridade: ['A integridade dos registros não está garantida quanto a: {}.', [['protecao', 'proteção contra alteração não autorizada'], ['correcao', 'correção justificada'], ['backup', 'cópia de segurança (backup)'], ['senha', 'acesso por senha individual']]],
  independencia: ['As autoinspeções não atendem: {}.', [['capacitados', 'profissionais capacitados'], ['vinculo', 'sem vínculo com o setor inspecionado'], ['relatorios', 'relatórios completos']]],
  investigacao: ['O tratamento das reclamações e eventos adversos não contempla: {}.', [['registro', 'registro'], ['causa', 'investigação até a causa raiz'], ['classificacao', 'classificação como procedentes ou não']]],
  separacao: ['As reclamações de desvio de qualidade não são: {}.', [['parte', 'registradas à parte'], ['revisao', 'revisadas periodicamente'], ['repasse', 'repassadas ao fabricante ou detentor do registro']]],
  devolucoes: ['O procedimento de devolução não contempla: {}.', [['procedimento', 'procedimento escrito'], ['lacrados', 'aceite só de produtos lacrados'], ['avaliacao', 'avaliação de motivo, condições, embalagem e validade antes de reintegrar ao estoque']]],
  furto: ['O procedimento para falsificação, adulteração, roubo ou furto não contempla: {}.', [['autoridade', 'notificação imediata à autoridade sanitária'], ['fabricante', 'notificação ao fabricante'], ['rejeicao', 'rejeição dos gases recuperados']]],
  industrial: ['O cilindro de gás industrial possivelmente usado como medicinal não é: {}.', [['isolado', 'isolado'], ['identificado', 'identificado'], ['notificado', 'notificado à vigilância sanitária']]],
  areas_minimas: ['Não há: {}.', [['recebimento', 'área de recebimento'], ['armazenagem', 'área de armazenagem geral'], ['recolhidos', 'área de recolhidos e devolvidos, separada e restrita'], ['expedicao', 'área de expedição'], ['administracao', 'área administrativa'], ['apoio', 'áreas de apoio sem comunicação com a armazenagem']]],
  segregacao: ['A armazenagem não atende: {}.', [['proporcional', 'área proporcional ao volume'], ['medicinais', 'segregação de gases medicinais e não medicinais'], ['gases', 'segregação entre os diferentes gases'], ['cheios', 'segregação de recipientes cheios e vazios']]],
  ventilacao: ['As áreas de cilindros e tanques não são: {}.', [['ventiladas', 'ventiladas'], ['cobertas', 'cobertas e protegidas do tempo'], ['pavimentadas', 'com espaços circundantes pavimentados']]],
  conferencia: ['O procedimento de recebimento não verifica: {}.', [['transporte', 'condições de transporte e segregação'], ['lote', 'lote'], ['validade', 'validade'], ['quantidade', 'quantidade da nota fiscal'], ['integridade', 'integridade da carga'], ['limpeza', 'limpeza do caminhão']]],
  expedicao: ['O registro da expedição não traz: {}.', [['transportador', 'dados do transportador'], ['cliente', 'dados do cliente'], ['gases', 'dados dos gases']]],
  veiculos: ['Não há procedimento de: {}.', [['operacao', 'operação'], ['manutencao', 'manutenção'], ['limpeza', 'limpeza'], ['seguranca', 'segurança']]]
};
for (const [id, [nc, pts]] of Object.entries(PONTOS)) Object.assign(perg(id), {pontos: pts, ncPontos: nc});
module.exports = d;
