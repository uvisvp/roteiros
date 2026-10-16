/* Vacinação no núcleo Serviços: o card abre três roteiros com a mesma base
   (RDC Anvisa nº 197/2017, que vale para serviços públicos, privados,
   filantrópicos, civis e militares — art. 2º), adequada a cada serviço:
   - drogaria: igual ao roteiro de Vacinação do site Medicamentos;
   - Unidade Básica de Saúde: identificação da unidade pública; sem o art. 14
     (prescrição de vacinas fora do Calendário, regra dos estabelecimentos
     privados) e sem extramuros do art. 17 (regra dos serviços privados);
   - serviço privado (clínica de vacinação): mesma base, sem a RDC 44/2009.
   Base: vacina/base.cjs, cópia de medicamentos/modulos/roteiros/vacina.cjs;
   orientações (vacina/orientacoes.json) e calendários (vacina/calendario.cjs)
   também vêm do Medicamentos. */
'use strict';
const BASE = require('./base.cjs');
const ORIENT = require('./orientacoes.json');
const CALENDARIO = require('./calendario.cjs');
const copia = x => JSON.parse(JSON.stringify(x));
const NORMA_44 = 'RDC Anvisa nº 44/2009';

function monta(ajusta) {
  const d = copia(BASE);
  d.secoes.forEach(s => s.itens.forEach(i => { if (ORIENT[i.id]) i.orient = copia(ORIENT[i.id]); }));
  ajusta(d);
  d.secoes.push({id: 'consulta', titulo: 'Calendários de vacinação', curto: 'Calendários', icone: 'note', itens: [copia(CALENDARIO)]});
  return d;
}
const item = (d, id) => { for (const s of d.secoes) for (const i of s.itens) if (i.id === id) return i; throw Error('item ' + id); };
const semPergunta = (d, ids) => d.secoes.forEach(s => s.itens.forEach(i => { if (i.perguntas) i.perguntas = i.perguntas.filter(q => !ids.includes(q.id)); }));

const drogaria = monta(d => {
  Object.assign(d, {app: 'vacinacao-drogaria', titulo: 'Vacinação em drogaria', tituloCurto: 'Vacinação drogaria', store: 'uvis-vacinacao-drogaria-v1'});
});

const privado = monta(d => {
  Object.assign(d, {app: 'vacinacao-privado', titulo: 'Vacinação em serviço privado', tituloCurto: 'Vacinação privada', store: 'uvis-vacinacao-privado-v1'});
  d.relatorio.subtitulo = 'Serviço privado de vacinação humana — clínica de vacinação (RDC Anvisa nº 197/2017)';
  d.relatorio.objetivo = 'Verificar as condições de funcionamento do serviço privado de vacinação humana, nos termos da RDC Anvisa nº 197/2017.';
  d.normas = d.normas.filter(n => n[0] !== NORMA_44);
  const c = item(d, 'dados').campos;
  c.find(x => x.id === 'licenca').rotulo = 'Licença sanitária / CMVS nº';
  c.find(x => x.id === 'rt').rotulo = 'Responsável técnico (nome e registro no conselho)';
});

const ubs = monta(d => {
  Object.assign(d, {app: 'vacinacao-ubs', titulo: 'Vacinação em Unidade Básica de Saúde', tituloCurto: 'Vacinação UBS', store: 'uvis-vacinacao-ubs-v1'});
  d.relatorio.subtitulo = 'Sala de vacinação de serviço público — Unidade Básica de Saúde (RDC Anvisa nº 197/2017)';
  d.relatorio.objetivo = 'Verificar as condições de funcionamento da sala de vacinação da Unidade Básica de Saúde, nos termos da RDC Anvisa nº 197/2017, aplicável aos serviços públicos de vacinação (art. 2º).';
  d.relatorio.conclusao = 'Diante do exposto, a sala de vacinação da unidade foi avaliada conforme os itens acima. As irregularidades relacionadas devem ser corrigidas nos prazos fixados pela autoridade sanitária, com ciência da gerência da unidade e da Supervisão Técnica de Saúde.';
  d.normas = d.normas.filter(n => n[0] !== NORMA_44);
  item(d, 'dados').campos = [
    {id: 'fantasia', rotulo: 'Nome da unidade'}, {id: 'cnes', rotulo: 'CNES'},
    {id: 'endereco', rotulo: 'Endereço', largo: true},
    {id: 'sts', rotulo: 'Supervisão Técnica de Saúde / Coordenadoria'},
    {id: 'gestao', rotulo: 'Gestão (administração direta ou instituição parceira)'},
    {id: 'licenca', rotulo: 'Licença sanitária / CMVS nº'},
    {id: 'gerente', rotulo: 'Gerente da unidade'}, {id: 'rt', rotulo: 'Responsável técnico de enfermagem (nome e COREN)'},
    {id: 'rt_sub', rotulo: 'Responsável técnico substituto'}, {id: 'acompanhou', rotulo: 'Acompanhou a inspeção'},
    {id: 'data', rotulo: 'Data da inspeção', tipo: 'date'}, {id: 'equipe', rotulo: 'Equipe de inspeção', largo: true}
  ];
  const serv = item(d, 'servico');
  serv.titulo = 'Vacinas e modalidades'; serv.campos = serv.campos.filter(c => c.id !== 'extramuros');
  /* art. 14 (prescrição) e art. 17 (extramuros) tratam de estabelecimentos/serviços privados */
  semPergunta(d, ['prescricao']);
  const esp = d.secoes.find(s => s.id === 'especiais');
  esp.itens = esp.itens.filter(i => i.id !== 'extramuros');
  Object.assign(esp, {titulo: 'Certificado Internacional (CIVP)', curto: 'CIVP'});
  d.infracoes = d.infracoes.filter(i => !['vac_prescr', 'vac_extra'].includes(i.id));
  const reg = item(d, 'registros').perguntas.find(q => q.id === 'cartao_sistema');
  reg.t = 'As vacinas aplicadas são registradas no cartão de vacinação e no sistema de informação do Ministério da Saúde (SI-PNI ou o sistema adotado pelo município)?';
});

module.exports = [drogaria, ubs, privado];
