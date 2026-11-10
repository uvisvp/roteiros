/* EAC em drogaria — roteiro próprio do núcleo Medicamentos (09/11/2026): o Serviço Tipo I da
   RDC 978/2025 só em farmácia ou drogaria. Os roteiros de EAC do núcleo Serviços
   (eac/roteiro.cjs, Tipos I, II e III, com consultório isolado) continuam os gerais; aqui o
   estabelecimento é fixo e as perguntas do consultório isolado saem. */
'use strict';
const {fixa} = require('../roteiro-simples/fixa-perfil.cjs');
const d = fixa(require('./roteiro.cjs')[0], 'tipo_est', 'farmacia');
const item = id => { for (const s of d.secoes) for (const i of s.itens) if (i.id === id) return i; throw Error('item ' + id); };
const perg = id => { for (const s of d.secoes) for (const i of s.itens) for (const q of i.perguntas || []) if (q.id === id) return q; throw Error('pergunta ' + id); };
const troca = (t, de, para) => { if (!String(t).includes(de)) throw Error('texto não encontrado: ' + de); return t.replace(de, para); };
Object.assign(d, {app: 'eac-drogaria', titulo: 'EAC em drogaria', tituloCurto: 'EAC drogaria', store: 'uvis-eac-drogaria-v1', respostas: 'simnao'});
d.relatorio.subtitulo = 'Exames de Análises Clínicas em farmácia ou drogaria — Serviço Tipo I (RDC Anvisa nº 978/2025)';
d.relatorio.objetivo = troca(d.relatorio.objetivo, '(farmácia ou consultório isolado)', '(farmácia ou drogaria)');
item('dados').campos = item('dados').campos.map(c => c.id === 'licenca' ? {...c, rotulo: 'Licença sanitária da farmácia/drogaria nº'} : c);
perg('lic').t = troca(perg('lic').t, 'além das atividades de farmácia ou de consultório isolado', 'além das atividades de farmácia ou drogaria');
/* licença da farmácia: norma específica (RDC 44/2009, art. 2º, III) antes da Lei 13.725 */
const L44 = 'rdc-44-2009::artigo::2::inciso::iii';
perg('lic_farmacia').r = [L44].concat(perg('lic_farmacia').r.filter(r => r !== L44));
const fl = d.infracoes.find(i => i.id === 'farm_lic'); if (!fl) throw Error('infração farm_lic'); fl.r = [L44].concat(fl.r.filter(r => r !== L44));
/* revisão de 09/11/2026 (conteúdo):
   - identificação › exames: sem “Equipamentos de medição em uso” (já estão em Produtos, equipamentos e armazenamento);
   - SP Regula: só o cadastro como gerador de RSS (Lei Municipal 13.478/2002, art. 144), sem checklist de contrato e comprovantes. */
item('exames').campos = item('exames').campos.filter(c => c.id !== 'equipamentos');
Object.assign(perg('spregula'), {
  t: 'O estabelecimento está cadastrado como gerador de resíduos de serviços de saúde no SP Regula (antiga Amlurb)?',
  r: ['lei-municipal-sp-13478-2002::artigo::144'].concat(perg('spregula').r.filter(r => /lei-municipal-13725/.test(r))),
  c: 'O estabelecimento está cadastrado como gerador de resíduos de serviços de saúde no SP Regula.',
  nc: 'O estabelecimento não está cadastrado como gerador de resíduos de serviços de saúde no SP Regula.'});
delete perg('spregula').pontos; delete perg('spregula').ncPontos;
/* a resposta e a lista de itens andam juntas, sem contradição (10/11/2026) */
d.pontosSeguem = true;
/* mesmo padrão da Vacinação em drogaria (10/11/2026): nas perguntas com lista de itens, o enunciado pergunta pelo
   conjunto e os itens ficam só na lista; o que era explicação entre parênteses vira orientação (ajuda). */
const TEXTO = {
  rt: 'A responsabilidade técnica e a supervisão do serviço de EAC atendem às exigências?',
  iluminacao: 'A iluminação da sala de coleta e execução é adequada?',
  mobiliario: 'A sala de coleta e execução dispõe dos itens obrigatórios?',
  refrigerador: 'O equipamento de refrigeração dos produtos e controles atende aos requisitos?',
  limpeza: 'A limpeza e a desinfecção dos ambientes atendem às exigências?',
  saneantes: 'Os saneantes utilizados atendem às exigências?',
  coletor_tipo: 'Os coletores de resíduos têm as características exigidas?',
  descarte: 'O descarte dos perfurocortantes atende às exigências?',
  manejo: 'O manejo dos sacos de resíduos atende às exigências?',
  abrigo: 'O abrigo de resíduos atende às exigências?',
  regularizados: 'Os produtos para diagnóstico in vitro, reagentes e equipamentos atendem às exigências de regularização e de uso?',
  recebimento: 'O recebimento dos produtos é registrado com os dados exigidos?',
  armazenamento: 'O armazenamento garante a conservação dos produtos?',
  manutencao: 'A manutenção dos equipamentos está registrada conforme o exigido?',
  calibracao: 'A calibração dos equipamentos atende às exigências?',
  prazo_registros: 'A guarda e a alteração dos registros atendem às exigências?',
  identificacao: 'O material biológico é identificado, na coleta ou no recebimento, com os dados mínimos?',
  instrucoes_an: 'As instruções e a rastreabilidade da fase analítica atendem às exigências?',
  criticos: 'Os valores críticos ou de alerta e a sua comunicação estão definidos?',
  ciq: 'O controle interno da qualidade (CIQ) atende às exigências?'
};
for (const [id, t] of Object.entries(TEXTO)) { const q = perg(id); if (!q.pontos) throw Error('pergunta sem lista de itens: ' + id); q.t = t; }
perg('identificacao').ajuda = 'A identificação pode ser simplificada quando o laudo é entregue no ato.';
perg('instrucoes_an').ajuda = 'As instruções podem ser as do fabricante.';
perg('calibracao').ajuda = 'Frequência: a do fabricante ou, na falta dela, anual.';
perg('manutencao').ajuda = 'Preventiva no mínimo anual, quando o fabricante não definir.';
perg('refrigerador').ajuda = 'O equipamento pode ser compartilhado só com medicamentos que não exijam equipamento exclusivo.';
module.exports = d;
