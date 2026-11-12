/* Vacinação em drogaria — roteiro próprio do núcleo Medicamentos (09/11/2026). O roteiro
   de Vacinação do núcleo Serviços (vacina/roteiro.cjs) continua o geral, com farmácia,
   clínica e serviço público; aqui o tipo de estabelecimento é fixo (farmácia ou drogaria),
   as perguntas que dependiam dele já vêm resolvidas e entram as exigências da RDC 44/2009
   para o serviço farmacêutico. Respostas Sim / Não, padrão do núcleo Medicamentos. */
'use strict';
const {fixa} = require('../roteiro-simples/fixa-perfil.cjs');
const d = fixa(require('./roteiro.cjs'), 'tipo_est', 'farmacia');
const item = id => { for (const s of d.secoes) for (const i of s.itens) if (i.id === id) return i; throw Error('item ' + id); };
const perg = id => { for (const s of d.secoes) for (const i of s.itens) for (const q of i.perguntas || []) if (q.id === id) return q; throw Error('pergunta ' + id); };
const LM = a => 'lei-municipal-13725-2004::artigo::' + a;
Object.assign(d, {app: 'vacina-drogaria', titulo: 'Vacinação em drogaria', tituloCurto: 'Vacinacao drogaria', store: 'uvis-vacina-drogaria-v1', respostas: 'simnao'});
d.relatorio.subtitulo = 'Serviço de vacinação em farmácia ou drogaria (RDC Anvisa nº 197/2017 e RDC Anvisa nº 44/2009)';
d.relatorio.objetivo = 'Verificar as condições de funcionamento do serviço de vacinação humana prestado em farmácia ou drogaria, nos termos da RDC Anvisa nº 197/2017 e da RDC Anvisa nº 44/2009.';
/* identificação: sem os campos de serviço público */
item('dados').campos = item('dados').campos.filter(c => c.id !== 'sts').map(c => c.id === 'razao' ? {...c, rotulo: 'Razão social'} : c.id === 'fantasia' ? {...c, rotulo: 'Nome fantasia'} : c);
perg('cartao_sistema').t = 'As vacinas aplicadas são registradas no cartão de vacinação e no sistema de informação do Ministério da Saúde?';
/* leituras da geladeira das vacinas no momento da inspeção (vão ao relatório) */
item('refrigeracao').campos.push(
  {id: 'temp_momento', rotulo: 'Temperatura no momento da inspeção (°C)'},
  {id: 'temp_max', rotulo: 'Temperatura máxima registrada (°C)'},
  {id: 'temp_min', rotulo: 'Temperatura mínima registrada (°C)'});
/* limpeza da sala registrada no início e no fim do expediente (RDC 44/2009, art. 16) */
d.infracoes.push({id: 'vac_limpeza', grupo: 'Infraestrutura', texto: 'Deixar de registrar a limpeza da sala de vacinação no início e ao término do horário de funcionamento.', r: ['rdc-44-2009::artigo::16', LM(65)]});
item('sala').perguntas.push({id: 'limpeza_sala', t: 'A limpeza da sala de vacinação é registrada diariamente, no início e ao término do horário de funcionamento?', r: ['rdc-44-2009::artigo::16', LM(65)],
  c: 'A limpeza da sala de vacinação é registrada diariamente, no início e ao término do horário de funcionamento.', nc: 'A limpeza da sala de vacinação não é registrada diariamente no início e ao término do horário de funcionamento.', inf: ['vac_limpeza']});

/* revisão de conteúdo de 10/11/2026:
   - licença: a pergunta é se a licença contempla a vacinação; em licença inicial, “Não se aplica”, com frase própria;
   - perguntas compostas: o enunciado pergunta pelo conjunto (“tem o mobiliário obrigatório?”) e os itens ficam na
     lista; a resposta e a lista andam juntas (pontosSeguem), sem contradição;
   - relatório: as conformidades de cada item saem numa frase só (cJunta + cf). */
d.pontosSeguem = true;
Object.assign(perg('lic'), {
  t: 'A licença sanitária do estabelecimento contempla a atividade de vacinação?',
  ajuda: 'Em licença inicial da atividade de vacinação, marque “Não se aplica”.',
  c: 'A licença sanitária do estabelecimento contempla a atividade de vacinação.',
  nc: 'O estabelecimento realiza vacinação sem que a licença sanitária contemple essa atividade.',
  na: 'Trata-se de licença inicial da atividade de vacinação; a licença sanitária vigente ainda não contempla essa atividade.'});
const TEXTO = {
  calendario: 'O Calendário Nacional de Vacinação do SUS está exposto ao usuário conforme o exigido?',
  rt: 'A responsabilidade técnica do serviço de vacinação está designada?',
  capacitacao: 'Os profissionais são capacitados periodicamente nos temas exigidos?',
  registro_capac: 'As capacitações estão registradas com os dados exigidos?',
  recepcao: 'A área de recepção atende aos requisitos?',
  sala: 'A sala de vacinação é fechada conforme o exigido?',
  mobiliario: 'A sala de vacinação tem o mobiliário obrigatório?',
  descarte: 'A sala de vacinação tem os recipientes de descarte obrigatórios?',
  caixa: 'A sala de vacinação tem os itens obrigatórios para as caixas térmicas?',
  exclusivo: 'O equipamento de refrigeração das vacinas atende aos requisitos?',
  temperatura: 'O controle da temperatura das vacinas atende aos requisitos?',
  prescricao: 'A aplicação de vacinas fora do Calendário Nacional do SUS segue as regras de prescrição e dispensação?',
  transporte: 'O transporte das vacinas atende aos requisitos?',
  intercorrencia: 'O serviço garante o atendimento às intercorrências?',
  cartao_sistema: 'As vacinas aplicadas são registradas nos meios exigidos?',
  prontuario: 'O prontuário individual de vacinação atende aos requisitos?',
  cartao: 'O cartão de vacinação traz, de forma legível, os dados exigidos?',
  erros: 'Os erros de vacinação recebem o tratamento exigido?',
  extra_aut: 'A vacinação extramuros atende às exigências de autorização?',
  civp_emissao: 'A emissão do CIVP atende às exigências?'
};
for (const [id, t] of Object.entries(TEXTO)) { const q = perg(id); if (!q.pontos) throw Error('pergunta sem lista de itens: ' + id); q.t = t; }
perg('transporte').ajuda = 'Se o serviço não transporta vacinas, marque “Não se aplica”.';
perg('sanitario').t = 'O estabelecimento dispõe de sanitário?';
perg('pia').t = 'A sala de vacinação tem pia de lavagem?';
perg('calendario').c = 'O Calendário Nacional de Vacinação do SUS, na versão vigente, está afixado em local visível ao usuário, com a indicação das vacinas disponibilizadas.';
/* relatório: frase única das conformidades, por item */
const JUNTA = {
  regularidade: ['O estabelecimento {}.', {
    lic: 'possui licença sanitária que contempla a atividade de vacinação',
    cnes: 'está inscrito no CNES com dados atualizados',
    calendario: 'mantém o Calendário Nacional de Vacinação do SUS, na versão vigente, afixado em local visível ao usuário, com a indicação das vacinas disponibilizadas'}],
  pessoal: ['O serviço de vacinação {}.', {
    rt: 'tem responsável técnico e substituto designados',
    habilitado: 'conta com profissional legalmente habilitado durante todo o período em que é oferecido',
    capacitacao: 'capacita periodicamente os profissionais nos temas exigidos',
    registro_capac: 'registra as capacitações com os dados exigidos'}],
  ambientes: ['O estabelecimento dispõe de {}.', {
    recepcao: 'área de recepção dimensionada à demanda e separada da sala de vacinação',
    sanitario: 'sanitário',
    sala: 'sala de vacinação fechada por paredes em todo o perímetro e com porta'}],
  sala: ['A sala de vacinação dispõe de {}.', {
    pia: 'pia de lavagem',
    mobiliario: 'bancada, mesa, cadeira e maca',
    guarda: 'local para a guarda dos materiais de administração das vacinas',
    descarte: 'recipientes para descarte de perfurocortantes e de resíduos biológicos',
    caixa: 'caixa térmica de fácil higienização, com termômetro de momento, máxima e mínima e cabo extensor'}],
  refrigeracao: ['As vacinas são conservadas em equipamento de refrigeração {}.', {
    exclusivo: 'exclusivo, com termômetro de momento, máxima e mínima',
    regularizado: 'regularizado na Anvisa',
    energia: 'com meios eficazes de conservação em falta de energia elétrica',
    temperatura: 'com registro diário das temperaturas máxima e mínima, instrumento calibrado e monitoramento contínuo'}]
};
for (const [id, [frase, cf]] of Object.entries(JUNTA)) { item(id).cJunta = frase; for (const [q, t] of Object.entries(cf)) perg(q).cf = t; }
module.exports = d;
