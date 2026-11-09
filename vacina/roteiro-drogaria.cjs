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
module.exports = d;
