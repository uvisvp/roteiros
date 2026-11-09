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

/* checklist com frase própria por ponto ([id, rótulo, frase]): o relatório traz só as frases dos pontos
   não atendidos (pedido de 17/10/2026); nas listas (cartão, capacitação), o que falta */
const PONTOS = {
  calendario: [['afixado', 'calendário afixado', 'O Calendário Nacional de Vacinação do SUS não está afixado.'], ['visivel', 'em local visível ao usuário', 'O Calendário Nacional de Vacinação não está em local visível ao usuário.'], ['indicacao', 'com a indicação das vacinas dele disponibilizadas', 'O Calendário afixado não indica as vacinas dele disponibilizadas.']],
  rt: [['rt', 'responsável técnico designado', 'Não há responsável técnico designado para o serviço de vacinação.'], ['sub', 'substituto designado', 'Não há substituto do responsável técnico designado.']],
  capacitacao: [['conceitos', 'conceitos básicos de vacinação'], ['conservacao', 'conservação, armazenamento e transporte'], ['preparo', 'preparo e administração segura'], ['residuos', 'gerenciamento de resíduos'], ['registros', 'registros relacionados à vacinação'], ['eapv', 'investigação e notificação de eventos adversos e erros de vacinação'], ['calendario', 'Calendário Nacional de Vacinação vigente'], ['maos', 'higienização das mãos'], ['intercorrencias', 'conduta frente às intercorrências']],
  registro_capac: [['data', 'data e horário'], ['carga', 'carga horária'], ['conteudo', 'conteúdo ministrado'], ['instrutor', 'nome e formação do instrutor'], ['participantes', 'profissionais participantes']],
  recepcao: [['existe', 'área de recepção', 'Não há área de recepção.'], ['dimensionada', 'dimensionada à demanda', 'A área de recepção não é dimensionada à demanda.'], ['separada', 'separada da sala de vacinação', 'A área de recepção não é separada da sala de vacinação.']],
  sala: [['paredes', 'sala fechada por paredes em todo o perímetro', 'A sala de vacinação não é fechada por paredes em todo o perímetro.'], ['porta', 'com porta', 'A sala de vacinação não tem porta.']],
  mobiliario: [['bancada', 'bancada'], ['mesa', 'mesa'], ['cadeira', 'cadeira'], ['maca', 'maca']],
  descarte: [['perfuro', 'recipiente para perfurocortantes', 'Não há recipiente para o descarte de perfurocortantes.'], ['biologicos', 'recipiente para resíduos biológicos', 'Não há recipiente para o descarte de resíduos biológicos.']],
  caixa: [['caixa', 'caixa térmica de fácil higienização', 'Não há caixa térmica de fácil higienização.'], ['termometro', 'termômetro de momento, máxima e mínima', 'Não há termômetro de momento, máxima e mínima para as caixas térmicas.'], ['cabo', 'cabo extensor para as caixas térmicas', 'O termômetro das caixas térmicas não tem cabo extensor.']],
  exclusivo: [['exclusivo', 'equipamento de refrigeração exclusivo para vacinas', 'As vacinas não ficam em equipamento de refrigeração exclusivo.'], ['termometro', 'termômetro de momento, máxima e mínima', 'O equipamento de refrigeração das vacinas não tem termômetro de momento, máxima e mínima.']],
  temperatura: [['diario', 'registro diário das temperaturas máxima e mínima', 'As temperaturas máxima e mínima não são registradas diariamente.'], ['calibrado', 'instrumento calibrado', 'O instrumento de medição da temperatura não é calibrado.'], ['continuo', 'monitoramento contínuo', 'Não há monitoramento contínuo da temperatura.']],
  prescricao: [['prescricao', 'prescrição médica para vacinas fora do Calendário Nacional', 'Foram aplicadas vacinas fora do Calendário Nacional do SUS sem prescrição médica.'], ['vinculada', 'dispensação vinculada à aplicação', 'Houve dispensação de vacina não vinculada à aplicação.']],
  transporte: [['caixas', 'caixas térmicas que mantêm a conservação', 'As vacinas não são transportadas em caixas térmicas que mantêm a conservação.'], ['registro', 'registro das temperaturas mínima e máxima', 'Não há registro das temperaturas mínima e máxima no transporte das vacinas.']],
  intercorrencia: [['imediato', 'atendimento imediato às intercorrências', 'O serviço não garante atendimento imediato às intercorrências.'], ['encaminhamento', 'encaminhamento a serviço de maior complexidade', 'O serviço não garante o encaminhamento a serviço de maior complexidade.']],
  cartao_sistema: [['cartao', 'registro no cartão de vacinação', 'As vacinas aplicadas não são registradas no cartão de vacinação.'], ['sistema', 'registro no sistema de informação', 'As vacinas aplicadas não são registradas no sistema de informação.']],
  prontuario: [['individual', 'prontuário individual com todas as vacinas', 'Não há prontuário individual com todas as vacinas aplicadas.'], ['acesso', 'acessível ao usuário e à autoridade sanitária', 'O prontuário não é acessível ao usuário e à autoridade sanitária.']],
  cartao: [['vacinado', 'dados do vacinado'], ['vacina', 'nome da vacina'], ['dose', 'dose aplicada'], ['data', 'data da vacinação'], ['lote', 'lote'], ['fabricante', 'fabricante'], ['estab', 'identificação do estabelecimento'], ['vacinador', 'identificação do vacinador'], ['proxima', 'data da próxima dose, quando aplicável']],
  erros: [['notificados', 'erros notificados no sistema da Anvisa', 'Os erros de vacinação não são notificados no sistema da Anvisa.'], ['investigados', 'erros investigados', 'Os erros de vacinação não são investigados.']],
  extra_aut: [['autorizacao', 'autorização da autoridade sanitária', 'A vacinação extramuros é realizada sem autorização da autoridade sanitária.'], ['licenciado', 'realizada pelo estabelecimento licenciado', 'A vacinação extramuros não é realizada pelo estabelecimento licenciado.']],
  civp_emissao: [['gratuito', 'emissão gratuita', 'O CIVP não é emitido gratuitamente.'], ['padrao', 'padrão da Anvisa', 'O CIVP não segue o padrão da Anvisa.'], ['registro', 'registro no sistema da Anvisa', 'O CIVP emitido não é registrado no sistema da Anvisa.']]
};
for (const [id, pts] of Object.entries(PONTOS)) { const q = perg(id); q.pontos = pts; delete q.checks; }
perg('cartao').ncPontos = 'O cartão de vacinação não traz: {}.';
perg('capacitacao').ncPontos = 'A capacitação periódica dos profissionais não contempla: {}.';
perg('registro_capac').ncPontos = 'O registro das capacitações não traz: {}.';
perg('mobiliario').ncPontos = 'A sala de vacinação não tem: {}.';
/* frase geral (quando não se marca o ponto) sem “ou” */
Object.entries({
  rt: 'A responsabilidade técnica do serviço de vacinação não atende às exigências.',
  mobiliario: 'A sala de vacinação não tem todo o mobiliário exigido.',
  caixa: 'Os materiais das caixas térmicas não atendem às exigências.',
  registro_anvisa: 'Foram constatadas vacinas não regularizadas na Anvisa (sem registro nem autorização).',
  prescricao: 'A prescrição e a dispensação de vacinas não atendem às exigências.',
  transporte: 'O transporte das vacinas não atende às exigências.',
  intercorrencia: 'O atendimento às intercorrências não atende às exigências.',
  cartao_sistema: 'O registro das vacinas aplicadas não atende às exigências.',
  erros: 'A notificação e a investigação dos erros de vacinação não atendem às exigências.',
  extra_aut: 'A vacinação extramuros não atende às exigências de autorização.',
  extra_regras: 'A vacinação extramuros não segue as mesmas regras de pessoal, conservação, registros e notificações do serviço.',
  civp_emissao: 'A emissão do CIVP não atende às exigências.'
}).forEach(([id, nc]) => { perg(id).nc = nc; });
/* infrações sem alternativas (“ou”) */
Object.entries({
  vac_rt: 'Manter serviço de vacinação sem a responsabilidade técnica exigida e sem profissional legalmente habilitado durante todo o funcionamento.',
  vac_capacit: 'Deixar de capacitar periodicamente os profissionais da vacinação e de registrar as capacitações.',
  vac_refrig: 'Conservar vacinas sem equipamento de refrigeração exclusivo e regularizado, sem meios para falta de energia e sem registro diário das temperaturas.',
  vac_transp: 'Transportar vacinas sem caixas térmicas adequadas e sem monitoramento das temperaturas.',
  vac_vacina: 'Utilizar vacina não regularizada na Anvisa.',
  vac_prescr: 'Descumprir as regras de prescrição e de dispensação de vacinas fora do Calendário Nacional do SUS.',
  vac_registro: 'Deixar de registrar as vacinas aplicadas no cartão, no sistema do Ministério da Saúde e no prontuário, com as informações mínimas.',
  vac_notif: 'Deixar de notificar e de investigar os eventos adversos pós-vacinação e os erros de vacinação.',
  vac_extra: 'Realizar vacinação extramuros em desacordo com a autorização da autoridade sanitária e as regras do serviço.',
  vac_civp: 'Emitir o CIVP em desacordo com o credenciamento da Anvisa, a gratuidade e o registro no sistema da Anvisa.'
}).forEach(([id, t]) => { const i = d.infracoes.find(x => x.id === id); if (!i) throw Error('infração ' + id); i.texto = t; });
/* Lei Municipal nº 13.725/2004, só até o art. 109. Ficam os artigos que a infração já trazia
   do roteiro de Medicamentos — 46 (boas práticas, vacinas e conservação), 50 (condições de
   funcionamento pelas normas específicas), 55 (eventos adversos), 90 (licença) — e somam-se os
   do serviço de saúde: arts. 61 a 68 conforme o assunto, 92 (responsável técnico), 83
   (cadastro de quem aplica vacinas), 56 (notificação pelo serviço de saúde) e 85 (doses
   aplicadas informadas à vigilância). A pergunta cita os da sua infração; LEIQ acerta as
   perguntas cujo assunto pede outro artigo (descarte, 62; registro no sistema, 85; extramuros
   autorizado, 90). */
const LM = (a, ...r) => 'lei-municipal-13725-2004::artigo::' + a + (r.length ? '::' + r.join('::') : '');
const LEI = {vac_lic: [LM(90), LM(90, 'paragrafo', '1'), LM(83)], vac_cnes: [LM(63)], vac_calend: [LM(63)], vac_rt: [LM(92)], vac_capacit: [LM(64)],
  vac_infra: [LM(65)], vac_refrig: [LM(65)], vac_transp: [LM(65)], vac_vacina: [LM(65)], vac_origem: [LM(65)], vac_prescr: [LM(63)], vac_interc: [LM(63)],
  vac_registro: [LM(68), LM(85)], vac_notif: [LM(55), LM(56)], vac_extra: [LM(63), LM(90)], vac_civp: [LM(63)]};
const eLei = r => /^lei-municipal-13725-2004::/.test(r), uniq = l => l.filter((x, k) => l.indexOf(x) === k);
const ordem = r => r.replace(/^lei-municipal-13725-2004::artigo::(\d+).*/, '$1') * 1;
const final = {};
d.infracoes.forEach(i => { final[i.id] = uniq(i.r.filter(eLei).concat(LEI[i.id] || [LM(63)])).sort((a, b) => ordem(a) - ordem(b)); i.r = i.r.filter(r => !eLei(r)).concat(final[i.id]); });
const LEIQ = {descarte: {mais: [LM(62)]}, cartao: {sem: [LM(85)]}, prontuario: {sem: [LM(85)]}, extra_regras: {sem: [LM(90)]}, extra_aut: {sem: [LM(63)]}};
d.secoes.forEach(s => s.itens.forEach(it => (it.perguntas || []).forEach(q => {
  const o = LEIQ[q.id] || {};
  let l = uniq([].concat(...(q.inf || []).map(f => final[f] || [])).concat(o.mais || [])).filter(x => !(o.sem || []).includes(x));
  q.r = q.r.filter(r => !eLei(r)).concat(l.length ? l.sort((a, b) => ordem(a) - ordem(b)) : [LM(63)]);
})));
d.leiBase = [LM(63)];

/* inventário de infraestrutura por ambiente, no início da seção Infraestrutura */
d.secoes.find(s => s.id === 'infra').itens.unshift({id: 'inventario', titulo: 'Ambientes do estabelecimento', curto: 'Ambientes',
  descricao: 'Marque os ambientes que o serviço possui e, em cada um, só o que estiver irregular.',
  campos: [INV.campo({ambientes: ['Recepção', 'Sala de vacinação', 'Sanitário', 'Depósito de material de limpeza', 'Área de resíduos', 'Copa / área de funcionários'], inf: ['vac_infra']})]});
d.infracoes.find(i => i.id === 'vac_infra').r.push('rdc-63-2011::artigo::36');
d.secoes.push({id: 'consulta', titulo: 'Calendários de vacinação', curto: 'Calendários', icone: 'note', itens: [copia(CALENDARIO)]});
module.exports = d;
