/* Vacinação no núcleo Serviços — um card único (pedido de 17/10/2026): a RDC
   Anvisa nº 197/2017 vale para todos os serviços que vacinam (art. 2º); na
   identificação escolhe-se o tipo de estabelecimento — drogaria ou farmácia,
   clínica de vacinação ou serviço público (só esses três, pedido de 17/10):
   - serviço público: o art. 14 (prescrição de vacina fora do Calendário,
     “estabelecimentos privados”) e o art. 17 (extramuros, “serviços
     privados”) passam a “Não se aplica”;
   - drogaria ou farmácia: entra a RDC 44/2009 na legislação de referência.
   Base: vacina/base.cjs (cópia de medicamentos/modulos/roteiros/vacina.cjs),
   orientações e calendários do mesmo roteiro. Checklist nas perguntas
   compostas e inventário de irregularidades por ambiente (infraestrutura). */
'use strict';
const BASE = require('./base.cjs');
const ORIENT = require('./orientacoes.json');
const CALENDARIO = require('./calendario.cjs');
const INV = require('../roteiro-simples/inventario-saude.cjs');
const copia = x => JSON.parse(JSON.stringify(x));
const d = copia(BASE);
d.secoes.forEach(s => s.itens.forEach(i => { if (ORIENT[i.id]) i.orient = copia(ORIENT[i.id]); }));
const item = id => { for (const s of d.secoes) for (const i of s.itens) if (i.id === id) return i; throw Error('item ' + id); };
const perg = id => { for (const s of d.secoes) for (const i of s.itens) for (const q of i.perguntas || []) if (q.id === id) return q; throw Error('pergunta ' + id); };
const PUBLICO = {campo: 'tipo_est', igual: 'publico'};

Object.assign(d, {app: 'vacinacao', titulo: 'Vacinação', tituloCurto: 'Vacinacao', store: 'uvis-vacinacao-v1', naSempre: true});
d.relatorio.subtitulo = 'Serviço de vacinação humana (RDC Anvisa nº 197/2017)';
d.relatorio.objetivo = 'Verificar as condições de funcionamento do serviço de vacinação humana, nos termos da RDC Anvisa nº 197/2017, aplicável aos serviços públicos, privados, filantrópicos, civis e militares que realizam vacinação (art. 2º).';
d.normas = [
  ['RDC Anvisa nº 197/2017', 'Requisitos mínimos para o funcionamento dos serviços de vacinação humana.'],
  ['RDC Anvisa nº 44/2009', 'Boas práticas farmacêuticas e serviços farmacêuticos em farmácias e drogarias.', {campo: 'tipo_est', em: ['farmacia']}],
  ['RDC Anvisa nº 63/2011', 'Boas práticas de funcionamento dos serviços de saúde.'],
  ['RDC Anvisa nº 222/2018', 'Gerenciamento dos resíduos de serviços de saúde.'],
  ['Lei Municipal nº 13.725/2004', 'Código Sanitário do Município de São Paulo.']
];
item('dados').campos = [
  {id: 'tipo_est', rotulo: 'Tipo de estabelecimento', tipo: 'select', opcoes: [['farmacia', 'Drogaria ou farmácia'], ['clinica', 'Clínica de vacinação'], ['publico', 'Serviço público (UBS e demais unidades)']]},
  {id: 'razao', rotulo: 'Razão social / mantenedora'}, {id: 'fantasia', rotulo: 'Nome do estabelecimento ou da unidade'},
  {id: 'cnpj', rotulo: 'CNPJ', tipo: 'cnpj'}, {id: 'endereco', rotulo: 'Endereço', largo: true},
  {id: 'licenca', rotulo: 'Licença sanitária / CMVS nº'}, {id: 'cnes', rotulo: 'CNES'},
  {id: 'sts', rotulo: 'Supervisão Técnica de Saúde (serviço público)'},
  {id: 'rl', rotulo: 'Responsável legal / gerente'}, {id: 'rt', rotulo: 'Responsável técnico (nome e registro no conselho)'},
  {id: 'rt_sub', rotulo: 'Responsável técnico substituto'}, {id: 'acompanhou', rotulo: 'Acompanhou a inspeção'},
  {id: 'data', rotulo: 'Data da inspeção', tipo: 'date'}, {id: 'equipe', rotulo: 'Equipe de inspeção', largo: true}
];
/* arts. 14 e 17: estabelecimentos/serviços privados */
Object.assign(perg('prescricao'), {naSe: PUBLICO, na: 'O art. 14 da RDC 197/2017 (prescrição de vacina fora do Calendário Nacional) trata de estabelecimentos privados; não se aplica a serviço público.'});
['extra_aut', 'extra_regras'].forEach(id => Object.assign(perg(id), {naSe: PUBLICO, na: 'O art. 17 da RDC 197/2017 (vacinação extramuros) trata de serviços privados; não se aplica a serviço público.'}));
perg('cartao_sistema').t = 'As vacinas aplicadas são registradas no cartão de vacinação e no sistema de informação do Ministério da Saúde (ou no sistema adotado pelo município, no serviço público)?';

const PONTOS = {
  calendario: [['afixado', 'calendário afixado'], ['visivel', 'em local visível ao usuário'], ['indicacao', 'com a indicação das vacinas dele disponibilizadas']],
  rt: [['rt', 'responsável técnico designado'], ['sub', 'substituto designado']],
  capacitacao: [['conceitos', 'conceitos básicos de vacinação'], ['conservacao', 'conservação, armazenamento e transporte'], ['preparo', 'preparo e administração segura'], ['residuos', 'gerenciamento de resíduos'], ['registros', 'registros relacionados à vacinação'], ['eapv', 'investigação e notificação de eventos adversos e erros de vacinação'], ['calendario', 'Calendário Nacional de Vacinação vigente'], ['maos', 'higienização das mãos'], ['intercorrencias', 'conduta frente às intercorrências']],
  registro_capac: [['data', 'data e horário'], ['carga', 'carga horária'], ['conteudo', 'conteúdo ministrado'], ['instrutor', 'nome e formação do instrutor'], ['participantes', 'profissionais participantes']],
  recepcao: [['existe', 'área de recepção'], ['dimensionada', 'dimensionada à demanda'], ['separada', 'separada da sala de vacinação']],
  sala: [['paredes', 'sala fechada por paredes em todo o perímetro'], ['porta', 'com porta']],
  mobiliario: [['bancada', 'bancada'], ['mesa', 'mesa'], ['cadeira', 'cadeira'], ['maca', 'maca']],
  descarte: [['perfuro', 'recipiente para perfurocortantes'], ['biologicos', 'recipiente para resíduos biológicos']],
  caixa: [['caixa', 'caixa térmica de fácil higienização'], ['termometro', 'termômetro de momento, máxima e mínima'], ['cabo', 'cabo extensor para as caixas térmicas']],
  exclusivo: [['exclusivo', 'equipamento de refrigeração exclusivo para vacinas'], ['termometro', 'termômetro de momento, máxima e mínima']],
  temperatura: [['diario', 'registro diário das temperaturas máxima e mínima'], ['calibrado', 'instrumento calibrado'], ['continuo', 'monitoramento contínuo']],
  prescricao: [['prescricao', 'prescrição médica para vacinas fora do Calendário Nacional'], ['vinculada', 'dispensação vinculada à aplicação']],
  transporte: [['caixas', 'caixas térmicas que mantêm a conservação'], ['registro', 'registro das temperaturas mínima e máxima']],
  intercorrencia: [['imediato', 'atendimento imediato às intercorrências'], ['encaminhamento', 'encaminhamento a serviço de maior complexidade']],
  cartao_sistema: [['cartao', 'registro no cartão de vacinação'], ['sistema', 'registro no sistema de informação']],
  prontuario: [['individual', 'prontuário individual com todas as vacinas'], ['acesso', 'acessível ao usuário e à autoridade sanitária']],
  cartao: [['vacinado', 'dados do vacinado'], ['vacina', 'nome da vacina'], ['dose', 'dose aplicada'], ['data', 'data da vacinação'], ['lote', 'lote'], ['fabricante', 'fabricante'], ['estab', 'identificação do estabelecimento'], ['vacinador', 'identificação do vacinador'], ['proxima', 'data da próxima dose, quando aplicável']],
  erros: [['notificados', 'erros notificados no sistema da Anvisa'], ['investigados', 'erros investigados']],
  extra_aut: [['autorizacao', 'autorização da autoridade sanitária'], ['licenciado', 'realizada pelo estabelecimento licenciado']],
  civp_emissao: [['gratuito', 'emissão gratuita'], ['padrao', 'padrão da Anvisa'], ['registro', 'registro no sistema da Anvisa']]
};
for (const [id, pts] of Object.entries(PONTOS)) { const q = perg(id); q.pontos = pts; delete q.checks; }
perg('cartao').ncPontos = 'O cartão de vacinação não traz: {}.';
perg('capacitacao').ncPontos = 'A capacitação periódica dos profissionais não contempla: {}.';
perg('registro_capac').ncPontos = 'O registro das capacitações não traz: {}.';

/* inventário de infraestrutura por ambiente, no início da seção Infraestrutura */
d.secoes.find(s => s.id === 'infra').itens.unshift({id: 'inventario', titulo: 'Inventário de irregularidades por ambiente', curto: 'Inventário por ambiente',
  descricao: 'Percorra os ambientes do serviço e marque, em cada um, as irregularidades de infraestrutura encontradas.',
  campos: [INV.campo({ambientes: ['Recepção', 'Sala de vacinação', 'Sanitário', 'Depósito de material de limpeza', 'Área de resíduos', 'Copa / área de funcionários'], inf: ['vac_infra']})]});
d.infracoes.find(i => i.id === 'vac_infra').r.push('rdc-63-2011::artigo::36');
d.secoes.push({id: 'consulta', titulo: 'Calendários de vacinação', curto: 'Calendários', icone: 'note', itens: [copia(CALENDARIO)]});
module.exports = d;
