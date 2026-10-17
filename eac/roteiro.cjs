/* Exames de Análises Clínicas (EAC) — RDC Anvisa nº 978/2025, no núcleo
   Serviços: um card que abre três roteiros, um por classificação do art. 7º
   (pedido de 17/10/2026):
   - Tipo I (arts. 8º a 18, 60, 63, 69): farmácia ou consultório isolado que
     executa EAC no ato, em material capilar, oral, de nasofaringe ou
     orofaringe, sem guardar nem transportar material biológico;
   - Tipo II (arts. 19 a 32, 59, 61, 62, 65, 68, 70, 71): posto de coleta ou
     consultório isolado, que coleta e envia material ao Serviço Tipo III
     vinculado e pode executar EAC no ato;
   - Tipo III (arts. 33 a 42): laboratório clínico ou de anatomia patológica,
     com laboratório de apoio, postos vinculados, serviço itinerante (arts. 43
     a 53), Central de Distribuição (arts. 144 a 153) e metodologia própria
     (arts. 157 a 164) conforme o perfil.
   Capítulos gerais (organização, contratação, qualidade, pessoal, processos e
   controle da qualidade) valem para os três. Base: o roteiro de EAC do site
   Medicamentos (medicamentos/roteiros/eac.cjs), que segue como o Tipo I da
   farmácia, com checklist nas perguntas compostas e inventário por ambiente.
   monta(tipo) devolve os dados do roteiro (motor roteiro-simples). Perguntas
   com tipos:[…] só entram nesses tipos; sem tipos, entram nos três.
   Base sancionatória: Lei Municipal nº 13.725/2004. */
'use strict';
const INV = require('../roteiro-simples/inventario-saude.cjs');
const ORIENT = require('../medicamentos/orientacoes/orientacoes.cjs').rs.eac;
const A = (art, ...resto) => ['rdc-978-2025::artigo::' + art].concat(resto.length ? [resto.join('::')] : []).join('::');
const I = (art, inc) => A(art, 'inciso', inc);
const P = (art, par) => A(art, 'paragrafo', par);
const LM = art => 'lei-municipal-13725-2004::artigo::' + art;
const R63 = art => 'rdc-63-2011::artigo::' + art;
const R222 = (art, ...resto) => 'rdc-222-2018::artigo::' + art + (resto.length ? '::' + resto.join('::') : '');
const LU = art => 'lei-municipal-sp-13478-2002::artigo::' + art;
const SN = [['sim', 'Sim'], ['nao', 'Não']];
const NAO = campo => ({campo, igual: 'nao'});
const FARM = {campo: 'tipo_est', igual: 'farmacia'}, CONS = {campo: 'tipo_est', igual: 'consultorio'}, POSTO = {campo: 'tipo_est', igual: 'posto'};
const PUB = {campo: 'natureza', igual: 'publico'};
const NAO_FUNC = 'O serviço de EAC ainda não está em funcionamento.';

const TIPO = {
  1: {app: 'eac-tipo1', titulo: 'EAC — Serviço Tipo I', curto: 'EAC_Tipo_I',
    sub: 'Exames de Análises Clínicas — Serviço Tipo I: farmácia ou consultório isolado (RDC Anvisa nº 978/2025)',
    obj: 'Verificar as condições de funcionamento do serviço de Exames de Análises Clínicas (EAC) classificado como Serviço Tipo I (farmácia ou consultório isolado), nos termos da RDC Anvisa nº 978/2025.',
    est: [['farmacia', 'Farmácia ou drogaria'], ['consultorio', 'Consultório isolado']],
    ambientes: ['Recepção', 'Sala de coleta e execução de EAC', 'Sanitário', 'Depósito de material de limpeza', 'Área de resíduos']},
  2: {app: 'eac-tipo2', titulo: 'EAC — Serviço Tipo II', curto: 'EAC_Tipo_II',
    sub: 'Exames de Análises Clínicas — Serviço Tipo II: posto de coleta ou consultório isolado (RDC Anvisa nº 978/2025)',
    obj: 'Verificar as condições de funcionamento do serviço de Exames de Análises Clínicas (EAC) classificado como Serviço Tipo II (posto de coleta ou consultório isolado), nos termos da RDC Anvisa nº 978/2025.',
    est: [['posto', 'Posto de coleta'], ['consultorio', 'Consultório isolado']],
    ambientes: ['Recepção', 'Sala de coleta e execução de EAC', 'Box de coleta', 'Sanitário de paciente (anexo à sala de coleta)', 'Sanitário de uso público', 'Copa', 'Vestiário / sanitário de funcionários', 'Área para lanches de pacientes', 'Depósito de material de limpeza', 'Área de resíduos']},
  3: {app: 'eac-tipo3', titulo: 'EAC — Serviço Tipo III', curto: 'EAC_Tipo_III',
    sub: 'Exames de Análises Clínicas — Serviço Tipo III: laboratório clínico ou de anatomia patológica (RDC Anvisa nº 978/2025)',
    obj: 'Verificar as condições de funcionamento do serviço de Exames de Análises Clínicas (EAC) classificado como Serviço Tipo III (laboratório clínico ou laboratório de anatomia patológica), nos termos da RDC Anvisa nº 978/2025.',
    est: [['clinico', 'Laboratório clínico'], ['anatomia', 'Laboratório de anatomia patológica'], ['ambos', 'Laboratório clínico e de anatomia patológica']],
    ambientes: ['Recepção', 'Sala de coleta', 'Área técnica (bioquímica, hematologia, imunologia)', 'Área técnica de microbiologia', 'Área de anatomia patológica / citologia', 'Sala de lavagem e esterilização de materiais', 'Expurgo', 'Almoxarifado', 'Sanitário', 'Copa', 'Vestiário / sanitário de funcionários', 'Depósito de material de limpeza', 'Área de resíduos']}
};

/* identificação: campos comuns e do tipo */
function dados(t) {
  const x = TIPO[t];
  return [
    {id: 'tipo_est', rotulo: 'Estabelecimento (RDC 978/2025, ' + {1: 'art. 8º', 2: 'arts. 19 e 20', 3: 'art. 33'}[t] + ')', tipo: 'select', opcoes: x.est},
    {id: 'natureza', rotulo: 'Natureza', tipo: 'select', opcoes: [['privado', 'Privado'], ['publico', 'Integra a administração pública']]},
    {id: 'razao', rotulo: 'Razão social / mantenedora'}, {id: 'fantasia', rotulo: 'Nome fantasia / unidade'},
    {id: 'cnpj', rotulo: 'CNPJ', tipo: 'cnpj'}, {id: 'endereco', rotulo: 'Endereço', largo: true},
    t === 1 ? {id: 'afe', rotulo: 'AFE na Anvisa (farmácia)'} : null,
    t === 1 ? {id: 'licenca', rotulo: 'Licença sanitária da farmácia/drogaria ou do consultório nº'} : null,
    {id: 'licenca_eac', rotulo: 'Licença sanitária do EAC (CEVS) nº'}, {id: 'cnes', rotulo: 'CNES'},
    t === 2 ? {id: 'tipo3_vinculo', rotulo: 'Serviço Tipo III vinculado (nome, CNES e licença)', largo: true} : null,
    {id: 'rl', rotulo: 'Responsável legal'}, {id: 'rt', rotulo: 'Responsável técnico (nome e registro no conselho)'},
    {id: 'rt_subst', rotulo: 'Responsável técnico substituto (nome e registro)'},
    t === 1 ? {id: 'crt', rotulo: 'Certidão de Regularidade Técnica do conselho (nº e emissão)', largo: true} : null,
    {id: 'horario', rotulo: 'Horário de funcionamento', largo: true},
    {id: 'supervisor', rotulo: 'Supervisor do pessoal técnico presente (nome e registro)'},
    {id: 'acompanhou', rotulo: 'Acompanhou a inspeção'},
    {id: 'data', rotulo: 'Data da inspeção', tipo: 'date'}, {id: 'equipe', rotulo: 'Equipe de inspeção', largo: true}
  ].filter(Boolean);
}
const EXAMES_TESTE = [['glicemia', 'Glicemia capilar'], ['colesterol', 'Colesterol total'], ['lipidico', 'Perfil lipídico'],
  ['triglicerides', 'Triglicerídeos'], ['hba1c', 'Hemoglobina glicada'], ['covid', 'Teste rápido de COVID-19'],
  ['influenza', 'Teste rápido de influenza'], ['dengue', 'Teste rápido de dengue'], ['hiv', 'Teste rápido de HIV'],
  ['sifilis', 'Teste rápido de sífilis'], ['hepatites', 'Testes rápidos de hepatites B e C'], ['outro', 'Outros']];
function exames(t) {
  if (t === 3) return [
    {id: 'setores', rotulo: 'Setores / áreas técnicas', tipo: 'checks', opcoes: [['bioquimica', 'Bioquímica'], ['hematologia', 'Hematologia'], ['imunologia', 'Imunologia / sorologia'],
      ['microbiologia', 'Microbiologia'], ['parasitologia', 'Parasitologia'], ['urinalise', 'Urinálise'], ['hormonios', 'Hormônios'], ['molecular', 'Biologia molecular'],
      ['toxicologia', 'Toxicologia'], ['citologia', 'Citologia / citopatologia'], ['anatomo', 'Anatomia patológica'], ['outro', 'Outros']]},
    {id: 'setores_outros', rotulo: 'Outros setores', largo: true},
    {id: 'volume', rotulo: 'Volume aproximado de exames (por dia ou mês)'},
    {id: 'equipamentos', rotulo: 'Principais equipamentos analíticos (marca/modelo)', tipo: 'textarea', largo: true}];
  return [
    {id: 'exames', rotulo: t === 1 ? 'Exames oferecidos' : 'Exames executados no próprio serviço (no ato da coleta)', tipo: 'checks', opcoes: EXAMES_TESTE},
    {id: 'exames_outros', rotulo: 'Outros exames', largo: true},
    {id: 'materiais', rotulo: t === 1 ? 'Materiais biológicos utilizados' : 'Materiais biológicos coletados', tipo: 'checks', opcoes: [
      ['capilar', 'Sangue por punção capilar'], ['oral', 'Cavidade oral'], ['naso', 'Nasofaringe'], ['oro', 'Orofaringe']].concat(t === 2 ? [['venoso', 'Sangue venoso'], ['arterial', 'Sangue arterial'], ['urina', 'Urina'], ['fezes', 'Fezes'], ['secrecoes', 'Secreções e outros']] : [['outro_mat', 'Outro material']])},
    {id: 'equipamentos', rotulo: 'Equipamentos de medição em uso (marca/modelo)', tipo: 'textarea', largo: true}];
}
/* perfil do Tipo III: o que o laboratório faz; “Não” marca as verificações como “Não se aplica” */
const PERFIL3 = [
  {id: 'p_apoio', rotulo: 'Envia exames a laboratório de apoio?', tipo: 'select', opcoes: SN, desc: {sim: 'envio de exames a laboratório de apoio{p_apoio_ext}'}},
  {id: 'p_apoio_ext', rotulo: 'Algum laboratório de apoio fica fora do Brasil?', tipo: 'select', opcoes: SN, rel: false, desc: {sim: ', inclusive no exterior'}},
  {id: 'p_postos', rotulo: 'Tem postos de coleta vinculados?', tipo: 'select', opcoes: SN, desc: {sim: 'postos de coleta vinculados'}},
  {id: 'p_itinerante', rotulo: 'Mantém serviço de EAC itinerante (próprio ou contratado)?', tipo: 'select', opcoes: SN, desc: {sim: 'serviço de EAC itinerante'}},
  {id: 'p_cd', rotulo: 'Mantém Central de Distribuição (própria ou contratada)?', tipo: 'select', opcoes: SN, desc: {sim: 'Central de Distribuição'}},
  {id: 'p_inhouse', rotulo: 'Utiliza metodologia própria (in house)?', tipo: 'select', opcoes: SN, desc: {sim: 'metodologia própria (in house)'}},
  {id: 'p_agua', rotulo: 'Produz água reagente no serviço?', tipo: 'select', opcoes: SN, desc: {sim: 'produção de água reagente'}},
  {id: 'p_atm', rotulo: 'Realiza teste de sensibilidade aos antimicrobianos?', tipo: 'select', opcoes: SN, desc: {sim: 'teste de sensibilidade aos antimicrobianos'}}
];

/* ——— perguntas ——— */
const LIC = [
  {id: 'lic_farmacia', tipos: [1], t: 'A farmácia ou drogaria possui licença sanitária vigente para a atividade de farmácia/drogaria (que precede a licença do serviço de EAC)?', r: [LM(90)], naSe: CONS,
    c: 'A farmácia possui licença sanitária vigente para a atividade de farmácia ou drogaria, que precede a licença do serviço de EAC.',
    nc: 'A farmácia não possui licença sanitária vigente para a atividade de farmácia ou drogaria.',
    na: 'O estabelecimento é consultório isolado, e não exerce a atividade de farmácia ou drogaria.', inf: ['farm_lic']},
  {id: 'lic', tipos: [1], t: 'A licença sanitária indica as atividades relacionadas ao EAC, além das atividades de farmácia ou de consultório isolado (ou há CEVS próprio do EAC)?', r: [A(63), A(73), LM(90), LM(90) + '::paragrafo::1'], naSe: {campo: 'lic_inicial', igual: 'sim'},
    c: 'O estabelecimento possui licença sanitária que contempla a realização de EAC.',
    nc: 'O estabelecimento executa EAC sem licença sanitária para a atividade: não há CEVS próprio do EAC e a licença sanitária não indica as atividades relacionadas ao EAC.',
    na: 'Trata-se de licença inicial do serviço de EAC; a licença sanitária vigente ainda não contempla essa atividade.', inf: ['eac_lic']},
  {id: 'lic', tipos: [2, 3], t: 'O serviço possui licença sanitária que indica as atividades relacionadas ao EAC?', r: [A(73), LM(90), LM(90) + '::paragrafo::1'], naSe: {campo: 'lic_inicial', igual: 'sim'},
    c: 'O serviço possui licença sanitária que indica as atividades relacionadas ao EAC.',
    nc: 'O serviço executa atividades relacionadas ao EAC sem licença sanitária que as indique.',
    na: 'Trata-se de licença inicial do serviço; a licença sanitária ainda não foi emitida.', inf: ['eac_lic']},
  {id: 'cnes', t: 'O estabelecimento está inscrito no Cadastro Nacional de Estabelecimentos de Saúde (CNES)?', r: [A(74)],
    c: 'O estabelecimento está inscrito no CNES.', nc: 'O estabelecimento não comprovou inscrição no CNES.',
    na: 'A inscrição no CNES ainda não é exigível, por se tratar de licença inicial do serviço.', inf: ['eac_cnes']},
  {id: 'estrutura', t: 'Há estrutura organizacional documentada do serviço de EAC?', r: [A(76)],
    c: 'A estrutura organizacional do serviço de EAC está documentada.', nc: 'Não foi apresentada a estrutura organizacional documentada do serviço de EAC.',
    na: 'O serviço de EAC ainda não está em funcionamento, e a estrutura organizacional não foi verificada.', inf: ['eac_doc']}
];
const RESP = [
  {id: 'rt', t: 'Há responsável técnico legalmente habilitado, com substituto para os impedimentos, e supervisão do pessoal técnico presente durante todo o funcionamento?', r: [A(75), P(75, 'unico'), A(122), P(122, '1'), P(122, '3')],
    c: 'Há responsável técnico legalmente habilitado, com substituto designado para os impedimentos, e a supervisão do pessoal técnico está presente durante todo o funcionamento do serviço.',
    nc: 'A responsabilidade técnica e a supervisão do serviço estão em desacordo.',
    ncPontos: 'A responsabilidade técnica e a supervisão do serviço estão em desacordo; não atende: {}.',
    na: NAO_FUNC,
    pontos: [['rt', 'responsável técnico legalmente habilitado'], ['subst', 'substituto do responsável técnico designado'], ['supervisor', 'supervisor do pessoal técnico presente durante todo o funcionamento'], ['supervisor_subst', 'substituto do supervisor nos impedimentos']],
    inf: ['eac_rt']},
  {id: 'habilitado', tipos: [1], t: 'Os EAC são executados exclusivamente por profissional legalmente habilitado?', r: [A(11)],
    c: 'Os EAC são executados exclusivamente por profissional legalmente habilitado.',
    nc: 'Foram constatados EAC executados por profissional não legalmente habilitado.',
    na: 'Não foram executados EAC durante a inspeção.', inf: ['eac_prof']},
  {id: 'habilitado', tipos: [2, 3], t: 'A coleta é feita por profissional legalmente habilitado ou por profissional capacitado sob supervisão?', r: [P(23, '1')],
    c: 'A coleta é feita por profissional legalmente habilitado ou por profissional capacitado sob supervisão.',
    nc: 'Foi constatada coleta por profissional sem habilitação ou capacitação, ou sem supervisão.',
    na: 'Não houve coleta durante a inspeção.', inf: ['eac_prof']},
  {id: 'dimensionamento', tipos: [2, 3], t: 'A equipe é dimensionada de acordo com o perfil de demanda do serviço?', r: [A(120)],
    c: 'A equipe é dimensionada de acordo com o perfil de demanda do serviço.', nc: 'A equipe não é dimensionada de acordo com o perfil de demanda do serviço.',
    na: NAO_FUNC, inf: ['eac_educacao']}
];
const REQ1 = [
  {id: 'material', t: 'Os EAC são executados apenas em material obtido por punção capilar ou coletado em cavidade oral, nasofaringe ou orofaringe?', r: [I(10, 'i')], naSe: PUB,
    c: 'Os EAC são executados apenas em material obtido por punção capilar ou coletado em cavidade oral, nasofaringe ou orofaringe.',
    nc: 'Foram constatados EAC em material biológico diverso do permitido ao Serviço Tipo I.',
    na: 'Estabelecimento da administração pública classificado como Serviço Tipo I: é permitida a realização de EAC em qualquer material biológico primário (art. 69).', inf: ['eac_tipo1']},
  {id: 'inloco', t: 'Todas as fases do EAC, inclusive o controle interno e o controle externo da qualidade, são realizadas no próprio serviço?', r: [I(10, 'ii'), A(173)],
    c: 'Todas as fases do EAC, inclusive o controle interno e o controle externo da qualidade, são realizadas no próprio serviço.',
    nc: 'Nem todas as fases do EAC, ou os controles da qualidade, são realizadas no próprio serviço.',
    na: 'Não foram executados EAC durante a inspeção.', inf: ['eac_tipo1']},
  {id: 'guarda', t: 'O serviço guarda, armazena ou transporta material biológico (próprio ou de terceiro), além do material de CIQ e CEQ?', r: [I(10, 'iii')], sim: 'nc',
    c: 'O serviço não guarda, não armazena e não transporta material biológico, exceto o material de controle da qualidade.',
    nc: 'O serviço guarda, armazena ou transporta material biológico, o que não é permitido ao Serviço Tipo I.',
    na: 'Não há manuseio de material biológico além da coleta e execução imediata.', inf: ['eac_tipo1']},
  {id: 'inhouse', t: 'O serviço utiliza metodologia própria (in house)?', r: [I(10, 'iv')], sim: 'nc',
    c: 'O serviço não utiliza metodologia própria.', nc: 'O serviço utiliza metodologia própria, o que não é permitido ao Serviço Tipo I.',
    na: 'Os exames são feitos apenas com produtos regularizados, sem desenvolvimento de método.', inf: ['eac_tipo1']},
  {id: 'agua', t: 'Algum equipamento utilizado requer água reagente produzida no próprio serviço?', r: [I(10, 'v')], sim: 'nc',
    c: 'Os equipamentos utilizados não requerem água reagente produzida no serviço.',
    nc: 'O serviço utiliza equipamento que requer água reagente produzida no próprio serviço.',
    na: 'Não há equipamentos que utilizem água reagente.', inf: ['eac_tipo1']},
  {id: 'triagem', t: 'O resultado do EAC é registrado na Declaração de Serviço Farmacêutico, com finalidade de triagem?', r: [A(60), P(60, '2')], naSe: CONS,
    c: 'O resultado do EAC é registrado na Declaração de Serviço Farmacêutico, com finalidade de triagem.',
    nc: 'O resultado do EAC não é registrado na Declaração de Serviço Farmacêutico.',
    na: 'O estabelecimento é consultório isolado; a Declaração de Serviço Farmacêutico é própria da farmácia.', inf: ['eac_dsf']},
  {id: 'finalidade', t: 'No consultório isolado, os EAC compõem a assistência à saúde e se relacionam à habilitação do profissional que os executa?', r: [A(12)], naSe: FARM,
    c: 'Os EAC realizados no consultório compõem a assistência à saúde e se relacionam à habilitação do profissional que os executa.',
    nc: 'O consultório realiza EAC sem relação com a assistência prestada ou com a habilitação do profissional que os executa.',
    na: 'O estabelecimento é farmácia ou drogaria.', inf: ['eac_tipo1']}
];
const REQ2 = [
  {id: 'material', t: 'Os EAC executados no próprio serviço usam apenas material obtido por punção capilar ou coletado em cavidade oral, nasofaringe ou orofaringe (os demais materiais são só coletados para o Serviço Tipo III)?', r: [I(22, 'i'), A(23)], naSe: PUB,
    c: 'Os EAC executados no próprio serviço usam apenas material de punção capilar, cavidade oral, nasofaringe ou orofaringe; os demais materiais são coletados para a fase pré-analítica do Serviço Tipo III.',
    nc: 'Foram constatados EAC executados no próprio serviço em material biológico diverso do permitido ao Serviço Tipo II.',
    na: 'Estabelecimento da administração pública classificado como Serviço Tipo II: é permitida a execução de EAC em qualquer material biológico, com equipamento de uso único ou microscopia no próprio serviço (art. 71).', inf: ['eac_tipo2']},
  {id: 'inloco', t: 'Quando o serviço executa EAC, todas as fases, inclusive o controle interno e o externo da qualidade, são realizadas no próprio serviço?', r: [I(22, 'ii'), A(173)],
    c: 'Os EAC executados pelo serviço têm todas as fases, inclusive os controles da qualidade, realizadas no próprio serviço.',
    nc: 'Nem todas as fases dos EAC executados, ou os controles da qualidade, são realizadas no próprio serviço.',
    na: 'O serviço não executa EAC; realiza apenas a fase pré-analítica (art. 59).', inf: ['eac_tipo2']},
  {id: 'inhouse', t: 'O serviço utiliza metodologia própria (in house)?', r: [I(22, 'iii')], sim: 'nc',
    c: 'O serviço não utiliza metodologia própria.', nc: 'O serviço utiliza metodologia própria, o que não é permitido ao Serviço Tipo II.',
    na: 'O serviço não executa EAC.', inf: ['eac_tipo2']},
  {id: 'agua', t: 'Algum equipamento utilizado requer água reagente produzida no próprio serviço?', r: [I(22, 'iv')], sim: 'nc',
    c: 'Os equipamentos utilizados não requerem água reagente produzida no serviço.',
    nc: 'O serviço utiliza equipamento que requer água reagente produzida no próprio serviço.',
    na: 'O serviço não executa EAC.', inf: ['eac_tipo2']},
  {id: 'venoso', t: 'A coleta de sangue venoso ou arterial ocorre apenas em posto de coleta?', r: [P(23, '2')], naSe: POSTO,
    c: 'Não há coleta de sangue venoso ou arterial no consultório.', nc: 'O consultório isolado realiza coleta de sangue venoso ou arterial, permitida apenas nos postos de coleta.',
    na: 'O estabelecimento é posto de coleta, onde a coleta de sangue venoso e arterial é permitida (art. 23, § 2º).', inf: ['eac_tipo2']},
  {id: 'vinculo', t: 'O material coletado é enviado apenas ao Serviço Tipo III com o qual o serviço mantém vínculo (o posto de coleta, a um único Serviço Tipo III)?', r: [A(24), A(61), A(62)], naSe: PUB,
    c: 'O material coletado é enviado apenas ao Serviço Tipo III vinculado.',
    nc: 'O material coletado é enviado a serviço com o qual não há vínculo, ou o posto de coleta está vinculado a mais de um Serviço Tipo III.',
    na: 'Estabelecimento da administração pública: é permitido encaminhar o material a outro Serviço Tipo II ou Tipo III da administração pública (art. 70).',
    pontos: [['vinculo', 'vínculo societário ou contratual com o Serviço Tipo III comprovado'], ['unico', 'vínculo com um único Serviço Tipo III'], ['envio', 'material enviado só ao Serviço Tipo III vinculado']],
    inf: ['eac_vinculo']},
  {id: 'recebe', t: 'O serviço recebe material biológico encaminhado por outro serviço (exceto do Serviço de EAC Itinerante, no posto de coleta)?', r: [A(25), P(25, 'unico')], sim: 'nc', naSe: PUB,
    c: 'O serviço não recebe material biológico encaminhado por outros serviços.', nc: 'O serviço recebe material biológico encaminhado por outro serviço, o que é proibido ao Serviço Tipo II.',
    na: 'Estabelecimento da administração pública: é permitido receber material de outro serviço da administração pública na fase pré-analítica (art. 70).', inf: ['eac_tipo2']},
  {id: 'transcricao', t: 'Quando o serviço transcreve o laudo emitido pelo Serviço Tipo III, a transcrição é fiel e permite rastrear o serviço responsável pela fase analítica?', r: [P(23, '3'), A(129)],
    c: 'A transcrição do laudo do Serviço Tipo III é fiel e identifica o serviço responsável pela fase analítica.',
    nc: 'A transcrição do laudo do Serviço Tipo III não é fiel ou não identifica o serviço responsável pela fase analítica.',
    na: 'O serviço não transcreve laudos; o paciente recebe o laudo emitido pelo Serviço Tipo III.', inf: ['eac_laudo']},
  {id: 'area_cons', t: 'No consultório isolado, há área de procedimento exclusiva para as atividades de EAC (a sala de coleta pode ser a do consultório)?', r: [A(32), P(32, 'unico')], naSe: POSTO,
    c: 'O consultório dispõe de área de procedimento exclusiva para as atividades de EAC.', nc: 'O consultório não dispõe de área de procedimento exclusiva para as atividades de EAC.',
    na: 'O estabelecimento é posto de coleta.', inf: ['eac_infra']}
];
const REQ3 = [
  {id: 'apoio_contrato', t: 'O envio de exames ao laboratório de apoio é formalizado por contrato escrito, com responsabilidades, auditoria, rastreabilidade e comunicação de desvios?', r: [A(37), A(79), A(82), P(82, 'unico')], naSe: NAO('p_apoio'),
    c: 'O envio de exames ao laboratório de apoio é formalizado por contrato escrito com as cláusulas exigidas.', nc: 'O envio de exames ao laboratório de apoio não está formalizado por contrato com as cláusulas exigidas.',
    ncPontos: 'O contrato com o laboratório de apoio não prevê: {}.',
    na: 'O laboratório não envia exames a laboratório de apoio.',
    pontos: [['contrato', 'contrato escrito'], ['auditoria', 'autorização para auditorias'], ['rastreab', 'controle de rastreabilidade'], ['fases', 'cumprimento dos requisitos das fases pré-analítica, analítica e pós-analítica'], ['desvios', 'comunicação de desvios de qualidade e riscos'], ['informacoes', 'troca das informações necessárias à operação segura']],
    inf: ['eac_apoio']},
  {id: 'apoio_avaliacao', t: 'O laboratório avalia anualmente o laboratório de apoio (regularidade sanitária e desempenho em ensaios de proficiência dos exames contratados)?', r: [A(38), I(38, 'i'), I(38, 'ii')], naSe: NAO('p_apoio'),
    c: 'O laboratório de apoio é avaliado anualmente quanto à regularidade sanitária e ao desempenho em ensaios de proficiência.', nc: 'O laboratório de apoio não é avaliado anualmente como exigido.',
    na: 'O laboratório não envia exames a laboratório de apoio.',
    pontos: [['regularidade', 'comprovação da regularidade sanitária do laboratório de apoio'], ['proficiencia', 'resultados de ensaios de proficiência dos exames contratados'], ['anual', 'avaliação anual registrada']],
    inf: ['eac_apoio']},
  {id: 'apoio_ext', t: 'Para laboratório de apoio no exterior, há comprovante da regularidade no país de origem com tradução juramentada, e o envio segue as regras de exportação de material biológico?', r: [P(39, '1'), P(39, '2'), A(142)], naSe: NAO('p_apoio_ext'),
    c: 'Há comprovante da regularidade do laboratório de apoio no exterior, com tradução juramentada.', nc: 'Não há comprovante da regularidade do laboratório de apoio no exterior com tradução juramentada.',
    na: 'Não há laboratório de apoio fora do território nacional.', inf: ['eac_apoio']},
  {id: 'apoio_laudo', t: 'O laudo indica o laboratório de apoio que realizou o exame e, quando transcrito, reproduz fielmente o laudo de origem?', r: [A(168), A(169)], naSe: NAO('p_apoio'),
    c: 'O laudo indica o laboratório de apoio que realizou o exame, e a transcrição é fiel ao laudo de origem.', nc: 'O laudo não indica o laboratório de apoio que realizou o exame ou a transcrição não é fiel.',
    na: 'O laboratório não envia exames a laboratório de apoio.', inf: ['eac_laudo']},
  {id: 'postos_vinculo', t: 'Os postos de coleta vinculados têm vínculo societário ou contratual formalizado e enviam material apenas a este laboratório?', r: [A(61), A(62), A(79)], naSe: NAO('p_postos'),
    c: 'Os postos de coleta vinculados têm vínculo formalizado e enviam material apenas a este laboratório.', nc: 'Há posto de coleta sem vínculo formalizado ou vinculado a mais de um Serviço Tipo III.',
    na: 'O laboratório não tem postos de coleta vinculados.', inf: ['eac_vinculo']}
];
const ITIN = [
  {id: 'itin_reg', t: 'O serviço de EAC itinerante é regularizado (sede fixa licenciada, inclusive quando contratado) junto à autoridade sanitária do local onde atua, com responsável técnico e substituto?', r: [A(43), A(44), P(44, 'unico'), A(45), A(46), P(46, 'unico')], naSe: NAO('p_itinerante'),
    c: 'O serviço de EAC itinerante é regularizado, com sede fixa licenciada e responsável técnico com substituto.', nc: 'O serviço de EAC itinerante está em desacordo com os requisitos de regularização e responsabilidade técnica.',
    na: 'O laboratório não mantém serviço de EAC itinerante.',
    pontos: [['sede', 'sede fixa com licença que indica as atividades'], ['local', 'regularização no local onde atua'], ['rt', 'responsável técnico legalmente habilitado'], ['subst', 'substituto do responsável técnico']],
    inf: ['eac_itinerante']},
  {id: 'itin_exec', t: 'No itinerante, os EAC são executados com a estrutura parada, após verificação registrada dos equipamentos montados, só em material permitido e com privacidade no atendimento?', r: [A(47), A(48), A(51), P(51, '5'), A(52)], naSe: NAO('p_itinerante'),
    c: 'O serviço itinerante executa EAC com a estrutura parada, após verificação registrada dos equipamentos, em material permitido e com privacidade no atendimento.', nc: 'A execução de EAC pelo serviço itinerante está em desacordo.',
    na: 'O laboratório não mantém serviço de EAC itinerante.',
    pontos: [['parado', 'execução com a estrutura parada (não em movimento)'], ['verificacao', 'verificação registrada após a montagem dos equipamentos'], ['material', 'execução só em material capilar, oral, de nasofaringe ou orofaringe'], ['privacidade', 'privacidade e atendimento individualizado'], ['profissional', 'coleta por profissional habilitado ou capacitado sob supervisão']],
    inf: ['eac_itinerante']},
  {id: 'itin_destino', t: 'O material coletado pelo itinerante vai apenas ao Serviço Tipo III vinculado (ou ao posto de coleta deste), sem passar por Central de Distribuição, e o itinerante faz CIQ e CEQ?', r: [A(50), P(50, 'unico'), A(145), A(53)], naSe: NAO('p_itinerante'),
    c: 'O material coletado pelo itinerante vai apenas ao Serviço Tipo III vinculado, e o itinerante realiza os controles da qualidade.', nc: 'O destino do material coletado pelo itinerante ou os controles da qualidade estão em desacordo.',
    na: 'O laboratório não mantém serviço de EAC itinerante.', inf: ['eac_itinerante']}
];
const CD = [
  {id: 'cd_reg', t: 'A Central de Distribuição possui licença que indica as atividades, responsável técnico e estrutura organizacional documentada?', r: [A(146), A(149), A(150)], naSe: NAO('p_cd'),
    c: 'A Central de Distribuição possui licença que indica as atividades, responsável técnico e estrutura organizacional documentada.', nc: 'A Central de Distribuição está em desacordo com os requisitos de regularização.',
    na: 'O laboratório não mantém Central de Distribuição.',
    pontos: [['licenca', 'licença que indica as atividades'], ['rt', 'responsável técnico'], ['estrutura', 'estrutura organizacional documentada']],
    inf: ['eac_cd']},
  {id: 'cd_infra', t: 'A Central de Distribuição dispõe dos itens obrigatórios, com registro de temperatura e umidade?', r: [A(151), P(151, 'unico'), A(97)], naSe: NAO('p_cd'),
    c: 'A Central de Distribuição dispõe dos itens obrigatórios, com registro de temperatura e umidade.', nc: 'A Central de Distribuição não dispõe de todos os itens obrigatórios.',
    ncPontos: 'A Central de Distribuição não dispõe de: {}.',
    na: 'O laboratório não mantém Central de Distribuição.',
    pontos: [['sala', 'sala de recebimento, triagem e guarda temporária (mínimo 3,0 m²) com bancada e lavatório'], ['vestiario', 'vestiário/sanitário de funcionários'], ['expurgo', 'expurgo'], ['dml', 'depósito de material de limpeza'], ['descarte', 'recipiente para perfurocortantes e resíduos'], ['deposito', 'área de depósito de equipamentos e materiais'], ['expedicao', 'área de recebimento e expedição dos recipientes de transporte'], ['refrigeracao', 'refrigeração exclusiva com registro das temperaturas máxima, mínima e de momento'], ['umidade', 'registro de temperatura e umidade']],
    inf: ['eac_cd']},
  {id: 'cd_ativ', t: 'A Central de Distribuição viola a embalagem primária, executa fases analítica ou pós-analítica, recebe material do itinerante ou faz outra atividade além de armazenar, acondicionar e transportar?', r: [A(145), A(148), A(152)], sim: 'nc', naSe: NAO('p_cd'),
    c: 'A Central de Distribuição se limita ao armazenamento, acondicionamento e transporte de material biológico.', nc: 'A Central de Distribuição realiza atividade não permitida.',
    na: 'O laboratório não mantém Central de Distribuição.', inf: ['eac_cd']},
  {id: 'cd_registro', t: 'A Central de Distribuição verifica e registra no recebimento as condições de transporte (temperatura, umidade, luz), quantidades e integridade da carga?', r: [A(147)], naSe: NAO('p_cd'),
    c: 'A Central de Distribuição verifica e registra as condições de transporte, as quantidades e a integridade da carga.', nc: 'A Central de Distribuição não registra as condições de transporte, as quantidades ou a integridade da carga.',
    na: 'O laboratório não mantém Central de Distribuição.', inf: ['eac_cd']}
];
const MP = [
  {id: 'mp_doc', t: 'A metodologia própria está documentada com o conteúdo mínimo?', r: [A(157), A(158)], naSe: NAO('p_inhouse'),
    c: 'A metodologia própria está documentada com o conteúdo mínimo exigido.', nc: 'A documentação da metodologia própria está incompleta.',
    ncPontos: 'A documentação da metodologia própria não contempla: {}.',
    na: 'O laboratório não utiliza metodologia própria.',
    pontos: [['etapas', 'descrição das etapas do processo'], ['rastreab', 'rastreabilidade dos produtos e insumos'], ['aprovacao', 'especificação e aprovação de insumos, reagentes e equipamentos'], ['validacao_etapas', 'sistemática de validação de etapas e procedimentos'], ['sens', 'sensibilidade e especificidade']],
    inf: ['eac_inhouse']},
  {id: 'mp_validacao', t: 'Há relatório de validação da metodologia própria (procedimentos, materiais, parâmetros, critérios de aceitação e resultados), sem uso das instruções de produtos RUO/ASR/IUO como único subsídio?', r: [A(163), P(163, '2'), A(164)], naSe: NAO('p_inhouse'),
    c: 'A metodologia própria tem relatório de validação com os elementos exigidos.', nc: 'Não há relatório de validação da metodologia própria com os elementos exigidos.',
    na: 'O laboratório não utiliza metodologia própria.', inf: ['eac_inhouse']},
  {id: 'mp_laudo', t: 'O laudo especifica os resultados obtidos por metodologia própria, e todas as fases dela ocorrem no próprio laboratório, com rastreabilidade dos insumos?', r: [A(130), A(159), I(167, 'xi'), A(162)], naSe: NAO('p_inhouse'),
    c: 'O laudo especifica os resultados obtidos por metodologia própria, executada integralmente no laboratório, com rastreabilidade dos insumos.', nc: 'O laudo não especifica os resultados obtidos por metodologia própria, ou a metodologia não é executada integralmente no laboratório com rastreabilidade.',
    na: 'O laboratório não utiliza metodologia própria.', inf: ['eac_inhouse']},
  {id: 'mp_comercio', t: 'O laboratório comercializa, repassa, doa ou entrega reagentes ou produtos de metodologia própria (exceto materiais da fase pré-analítica ao Serviço Tipo II vinculado)?', r: [A(160), P(160, 'unico')], sim: 'nc', naSe: NAO('p_inhouse'),
    c: 'O laboratório não comercializa nem repassa reagentes ou produtos de metodologia própria.', nc: 'O laboratório comercializa ou repassa reagentes ou produtos de metodologia própria.',
    na: 'O laboratório não utiliza metodologia própria.', inf: ['eac_inhouse']}
];
const AGUA_ATM = [
  {id: 'agua_pureza', t: 'O grau de pureza da água reagente está definido, com avaliações e testes que assegurem a conformidade?', r: [I(154, 'iv'), I(154, 'v')], naSe: NAO('p_agua'),
    c: 'O grau de pureza da água reagente está definido, com avaliações e testes que asseguram a conformidade.', nc: 'O grau de pureza da água reagente não está definido ou não há testes que assegurem a conformidade.',
    na: 'O laboratório não produz água reagente.', inf: ['eac_processo']},
  {id: 'atm', t: 'O teste de sensibilidade aos antimicrobianos segue a Portaria MS nº 64/2018 e usa culturas de referência do BrCAST?', r: [A(156)], naSe: NAO('p_atm'),
    c: 'O teste de sensibilidade aos antimicrobianos segue a Portaria MS nº 64/2018, com culturas de referência do BrCAST.', nc: 'O teste de sensibilidade aos antimicrobianos não segue a Portaria MS nº 64/2018 ou não usa culturas de referência do BrCAST.',
    na: 'O laboratório não realiza teste de sensibilidade aos antimicrobianos.', inf: ['eac_processo']}
];

const AMB = {
  1: [
    {id: 'recepcao', t: 'Há área de recepção do paciente, dimensionada à demanda e separada da sala de coleta e execução?', r: [I(13, 'i'), P(13, '2')],
      c: 'A área de recepção do paciente é dimensionada à demanda e separada da sala de coleta e execução.',
      nc: 'Não há área de recepção do paciente separada da sala de coleta e execução de EAC.',
      na: 'A exigência de área de recepção separada não incide, por não haver reforma, ampliação, construção nova ou mudança de uso dos ambientes.', inf: ['eac_infra']},
    {id: 'sanitario', t: 'Há sanitário de uso público?', r: [I(13, 'iii'), P(13, '2')],
      c: 'O estabelecimento dispõe de sanitário de uso público.', nc: 'Não há sanitário de uso público.',
      na: 'A exigência de sanitário de uso público não incide, por não haver reforma, ampliação, construção nova ou mudança de uso dos ambientes.',
      checks: {rotulo: 'Como é o sanitário (vai ao relatório; não gera infração)', opcoes: [['proprio', 'Próprio'], ['compartilhado', 'Compartilhado com outras unidades do serviço'], ['outro', 'Outros']], outro: 'Outros — descrever', frase: 'O estabelecimento dispõe de sanitário de uso público, {}.'},
      inf: ['eac_infra']},
    {id: 'sala', t: 'Há sala de coleta e execução de EAC?', r: [I(13, 'iv'), A(15)],
      c: 'O serviço conta com sala de coleta e execução de EAC.', nc: 'Não há sala de coleta e execução de EAC.',
      na: 'O serviço de EAC ainda não dispõe de ambiente instalado para avaliação.', inf: ['eac_infra']},
    {id: 'area_proc', t: 'No consultório isolado, há área de procedimento relacionada ao EAC?', r: [A(18)], naSe: FARM,
      c: 'O consultório dispõe de área de procedimento relacionada ao EAC.', nc: 'O consultório não dispõe de área de procedimento relacionada ao EAC.',
      na: 'O estabelecimento é farmácia ou drogaria.', inf: ['eac_infra']},
    {id: 'ventilacao', t: 'A sala de coleta e execução dispõe de ventilação natural ou de sistema de climatização?', r: [A(16)],
      c: 'A sala de coleta e execução dispõe de ventilação natural ou de climatização.',
      nc: 'A sala de coleta e execução não dispõe de ventilação natural nem de sistema de climatização.',
      na: 'Não há sala de coleta e execução instalada.', inf: ['eac_infra']},
    {id: 'iluminacao', t: 'A iluminação da sala não prejudica a avaliação do exame e da coloração da pele do paciente?', r: [A(17)],
      c: 'A iluminação da sala é adequada à avaliação do exame e da coloração da pele do paciente.',
      nc: 'A iluminação da sala de coleta e execução prejudica a avaliação do exame ou da coloração da pele do paciente.',
      na: 'Não há sala de coleta e execução instalada.', inf: ['eac_infra']}
  ],
  2: [
    {id: 'ambientes27', t: 'O serviço dispõe dos ambientes obrigatórios do Serviço Tipo II?', r: [A(27), P(27, '1'), P(27, '2'), A(68)],
      c: 'O serviço dispõe dos ambientes obrigatórios do Serviço Tipo II.', nc: 'O serviço não dispõe de todos os ambientes obrigatórios do Serviço Tipo II.',
      ncPontos: 'O serviço não dispõe de: {}.',
      na: 'A exigência dos ambientes não incide, por não haver reforma, ampliação, construção nova ou mudança de uso dos ambientes.',
      pontos: [['recepcao', 'área de recepção dimensionada à demanda e separada da sala de coleta'], ['dml', 'depósito de material de limpeza'], ['sanitario', 'sanitário de uso público'], ['copa', 'copa'], ['vestiario', 'vestiário/sanitário de funcionários'], ['lanche', 'área para lanches de pacientes'], ['sala', 'sala de coleta e execução de EAC'], ['san_paciente', 'sanitário de paciente anexo à sala de coleta, acessível a PCD']],
      inf: ['eac_infra']},
    {id: 'climatizacao', t: 'A sala de coleta e execução dispõe de sistema de climatização?', r: [A(29)],
      c: 'A sala de coleta e execução dispõe de sistema de climatização.', nc: 'A sala de coleta e execução não dispõe de sistema de climatização.',
      na: 'Não há sala de coleta e execução instalada.', inf: ['eac_infra']},
    {id: 'iluminacao', t: 'A iluminação da sala não prejudica a avaliação do exame e da coloração da pele do paciente?', r: [A(31)],
      c: 'A iluminação da sala é adequada à avaliação do exame e da coloração da pele do paciente.',
      nc: 'A iluminação da sala de coleta e execução prejudica a avaliação do exame ou da coloração da pele do paciente.',
      na: 'Não há sala de coleta e execução instalada.', inf: ['eac_infra']}
  ],
  3: [
    {id: 'pba', t: 'A infraestrutura atende à RDC nº 50/2002, com Projeto Básico de Arquitetura aprovado pela autoridade sanitária?', r: [A(40), I(117, 'i')],
      c: 'A infraestrutura atende à RDC nº 50/2002, com Projeto Básico de Arquitetura aprovado.', nc: 'Não foi apresentado Projeto Básico de Arquitetura aprovado ou a infraestrutura não atende à RDC nº 50/2002.',
      na: 'A exigência não incide, por não haver reforma, ampliação, construção nova ou mudança de uso dos ambientes.', inf: ['eac_infra']},
    {id: 'climatizacao', t: 'A sala de coleta e execução dispõe de sistema de climatização?', r: [A(41)],
      c: 'A sala de coleta e execução dispõe de sistema de climatização.', nc: 'A sala de coleta e execução não dispõe de sistema de climatização.',
      na: 'Não há sala de coleta no laboratório.', inf: ['eac_infra']},
    {id: 'iluminacao', t: 'A iluminação da sala de coleta não prejudica a avaliação do exame e da coloração da pele do paciente?', r: [A(42)],
      c: 'A iluminação da sala de coleta é adequada à avaliação do exame e da coloração da pele do paciente.',
      nc: 'A iluminação da sala de coleta prejudica a avaliação do exame ou da coloração da pele do paciente.',
      na: 'Não há sala de coleta no laboratório.', inf: ['eac_infra']}
  ]
};
const SALA = {
  1: [
    {id: 'mobiliario', t: 'A sala dispõe dos itens obrigatórios (lavatório, bancada, mesa, cadeira para coleta, área para equipamentos e materiais)?', r: [I(14, 'i'), I(14, 'ii'), I(14, 'iii'), I(14, 'iv'), I(14, 'vi')],
      c: 'A sala de coleta e execução dispõe dos itens obrigatórios.', nc: 'A sala de coleta e execução não dispõe de todos os itens obrigatórios.',
      ncPontos: 'A sala de coleta e execução não dispõe de: {}.',
      na: 'Não há sala de coleta e execução instalada.',
      pontos: [['lavatorio', 'lavatório'], ['bancada', 'bancada'], ['mesa', 'mesa'], ['cadeira', 'cadeira para coleta'], ['deposito', 'área para depósito de equipamentos e materiais']],
      inf: ['eac_infra']},
    {id: 'refrigerador', t: 'Os produtos e controles que exigem refrigeração ficam em equipamento exclusivo (ou compartilhado só com medicamentos que não exijam equipamento exclusivo), com registro das temperaturas máxima, mínima e de momento?', r: [I(14, 'v'), P(14, '1'), A(96)],
      c: 'Os produtos para diagnóstico e os controles que exigem refrigeração ficam em equipamento adequado, com registro das temperaturas máxima, mínima e de momento.',
      nc: 'A guarda dos produtos e controles refrigerados está em desacordo.',
      na: 'Não há produtos para diagnóstico nem controles que exijam refrigeração.',
      pontos: [['exclusivo', 'equipamento exclusivo (ou compartilhado só com medicamentos que não exijam exclusividade)'], ['registro', 'registro das temperaturas máxima, mínima e de momento'], ['fabricante', 'faixa de temperatura conforme as instruções de uso']],
      inf: ['eac_temp']}
  ],
  2: [
    {id: 'mobiliario', t: 'A sala de coleta e execução dispõe dos itens obrigatórios?', r: [A(28)],
      c: 'A sala de coleta e execução dispõe dos itens obrigatórios.', nc: 'A sala de coleta e execução não dispõe de todos os itens obrigatórios.',
      ncPontos: 'A sala de coleta e execução não dispõe de: {}.',
      na: 'Não há sala de coleta e execução instalada.',
      pontos: [['maca', 'maca'], ['triagem', 'área de recebimento, triagem e guarda temporária de material biológico'], ['lavatorio', 'lavatório'], ['bancada', 'bancada'], ['mesa', 'mesa'], ['cadeira', 'cadeira para coleta com braçadeira'], ['expedicao', 'área para expedição dos recipientes de transporte'], ['deposito', 'área para depósito de equipamentos e materiais'], ['descarte', 'recipiente para perfurocortantes e resíduos']],
      inf: ['eac_infra']},
    {id: 'refrigerador', t: 'Os produtos e controles que exigem refrigeração ficam em equipamento exclusivo, com registro das temperaturas máxima, mínima e de momento?', r: [I(28, 'vii'), A(96)],
      c: 'Os produtos para diagnóstico e os controles que exigem refrigeração ficam em equipamento exclusivo, com registro das temperaturas máxima, mínima e de momento.',
      nc: 'A guarda dos produtos e controles refrigerados está em desacordo.',
      na: 'Não há produtos para diagnóstico nem controles que exijam refrigeração.',
      pontos: [['exclusivo', 'equipamento exclusivo'], ['registro', 'registro das temperaturas máxima, mínima e de momento'], ['fabricante', 'faixa de temperatura conforme as instruções de uso']],
      inf: ['eac_temp']},
    {id: 'refrig_material', t: 'O material biológico fica em equipamento de refrigeração exclusivo (ou compartilhado só com medicamentos que não exijam exclusividade), com registro das temperaturas máxima, mínima e de momento?', r: [I(28, 'viii'), P(28, 'unico'), A(95)],
      c: 'O material biológico fica em equipamento de refrigeração adequado, com registro das temperaturas máxima, mínima e de momento.',
      nc: 'A guarda refrigerada do material biológico está em desacordo.',
      na: 'O material coletado não exige refrigeração até o envio.',
      pontos: [['exclusivo', 'equipamento exclusivo para material biológico'], ['registro', 'registro das temperaturas máxima, mínima e de momento'], ['energia', 'conservação garantida em falta de energia']],
      inf: ['eac_temp']}
  ],
  3: [
    {id: 'refrigerador', t: 'Os equipamentos de temperatura controlada (reagentes, controles e material biológico) têm registro das temperaturas máxima, mínima e de momento, com conservação garantida em falta de energia?', r: [A(95), A(96), P(96, 'unico')],
      c: 'Os equipamentos de temperatura controlada têm registro das temperaturas máxima, mínima e de momento, com conservação garantida em falta de energia.',
      nc: 'O controle de temperatura dos equipamentos está em desacordo.',
      na: 'Não há produtos nem material biológico que exijam temperatura controlada.',
      pontos: [['registro', 'registro das temperaturas máxima, mínima e de momento'], ['continuo', 'monitoramento durante todo o processo (equipamentos de operação contínua)'], ['energia', 'conservação garantida em falta de energia'], ['separacao', 'separação entre reagentes e material biológico']],
      inf: ['eac_temp']}
  ]
};
const RESIDUOS = [
  {id: 'dml', tipos: [1], t: 'Há depósito de material de limpeza (DML)?', r: [I(13, 'ii'), P(13, '1'), P(13, '2')],
    c: 'Há depósito de material de limpeza (DML).', nc: 'Não há depósito de material de limpeza.',
    na: 'A exigência de depósito de material de limpeza não incide, por não haver reforma, ampliação, construção nova ou mudança de uso dos ambientes.',
    checks: {rotulo: 'Como é o DML (vai ao relatório; não gera infração)', opcoes: [['armario', 'Armário próprio'], ['sala', 'Sala própria'], ['sanitario', 'Localizado no sanitário'], ['outro', 'Outros']], outro: 'Outros — descrever'},
    inf: ['eac_infra']},
  {id: 'limpeza', t: 'A limpeza segue instruções escritas e é registrada?', r: [A(112), A(113), P(113, '1'), P(113, '2')],
    c: 'A limpeza e a desinfecção seguem instruções escritas, são registradas diariamente no início e no término do funcionamento, e após cada atendimento verifica-se a necessidade de nova limpeza.',
    nc: 'A limpeza do serviço está em desacordo.', ncPontos: 'A limpeza do serviço está em desacordo; não atende: {}.',
    na: NAO_FUNC,
    pontos: [['instrucoes', 'instruções escritas de limpeza, desinfecção e esterilização'], ['registro', 'registro diário no início e no término do funcionamento'], ['atendimento', 'ambiente limpo antes de cada atendimento'], ['verificacao', 'verificação da necessidade de nova limpeza após cada atividade']],
    inf: ['eac_limpeza']},
  {id: 'saneantes', t: 'Os saneantes utilizados estão regularizados na Anvisa e são usados conforme o fabricante?', r: [A(114)],
    c: 'Os saneantes utilizados estão regularizados na Anvisa e são usados conforme o fabricante.', nc: 'Foram constatados saneantes sem regularização na Anvisa ou usados fora das especificações do fabricante.',
    na: 'Não havia saneantes no local no momento da inspeção.', inf: ['eac_limpeza']},
  {id: 'coletores', t: 'Há coletores para cada tipo de resíduo gerado, com segregação no momento da geração?', r: [R222(11), LU(145)],
    c: 'Há coletores para cada tipo de resíduo gerado, e os resíduos são segregados no momento da geração.',
    nc: 'Não há coletores para cada tipo de resíduo gerado ou os resíduos não são segregados no momento da geração.',
    ncPontos: 'Não há coletor adequado, com segregação no momento da geração, para: {}.',
    na: 'O serviço de EAC ainda não gera resíduos de serviços de saúde.',
    pontos: [['a', 'resíduo infectante (Grupo A), em saco branco leitoso'], ['e', 'perfurocortante (Grupo E), em recipiente rígido'], ['b', 'resíduo químico (Grupo B)'], ['d', 'resíduo comum (Grupo D)']],
    inf: ['eac_residuos']},
  {id: 'coletor_tipo', t: 'Os coletores são de material liso, lavável, resistentes à punctura, ruptura, vazamento e tombamento, com tampa de abertura sem contato manual e cantos arredondados?', r: [R222(17), R222(17, 'paragrafo', '1')],
    c: 'Os coletores são de material liso e lavável, resistentes à punctura, ruptura, vazamento e tombamento, com tampa de abertura sem contato manual e cantos arredondados.',
    nc: 'Os coletores não atendem às características exigidas.', ncPontos: 'Os coletores não atendem às características exigidas: {}.',
    na: 'O saco é substituído imediatamente após cada procedimento, o que dispensa a tampa do coletor.',
    pontos: [['lavavel', 'material liso e lavável'], ['resistente', 'resistentes à punctura, ruptura, vazamento e tombamento'], ['tampa', 'tampa de abertura sem contato manual'], ['cantos', 'cantos arredondados']],
    inf: ['eac_residuos']},
  {id: 'descarte', t: 'Os perfurocortantes são descartados em recipiente rígido, identificado, com tampa, resistente à punctura, ruptura e vazamento, trocado ao atingir 3/4 da capacidade?', r: [R222(86), R222(87)],
    c: 'Os perfurocortantes são descartados em recipiente rígido, identificado, com tampa, resistente à punctura, ruptura e vazamento, trocado ao atingir 3/4 da capacidade.', nc: 'O descarte de perfurocortantes está em desacordo.',
    na: 'Os exames realizados não geram perfurocortantes.',
    pontos: [['rigido', 'recipiente rígido, resistente à punctura, ruptura e vazamento'], ['identificado', 'recipiente identificado e com tampa'], ['limite', 'troca ao atingir 3/4 da capacidade']],
    inf: ['eac_residuos']},
  {id: 'manejo', t: 'Os sacos são preenchidos até 2/3 da capacidade, sem esvaziamento ou reaproveitamento, e os do Grupo A trocados a cada 48 horas?', r: [R222(13), R222(13, 'paragrafo', '1'), R222(13, 'paragrafo', '2'), R222(14)],
    c: 'Os sacos de resíduos são preenchidos até 2/3 da capacidade, sem esvaziamento ou reaproveitamento, e os do Grupo A são trocados a cada 48 horas.',
    nc: 'O manejo dos sacos de resíduos está em desacordo.', ncPontos: 'O manejo dos sacos de resíduos está em desacordo: {}.',
    na: 'O serviço de EAC ainda não gera resíduos de serviços de saúde.',
    pontos: [['dois_tercos', 'preenchimento até 2/3 da capacidade'], ['reuso', 'sem esvaziamento ou reaproveitamento'], ['48h', 'troca dos sacos do Grupo A a cada 48 horas']],
    inf: ['eac_residuos']},
  {id: 'abrigo', t: 'Há abrigo de resíduos adequado, com ambiente para os infectantes e perfurocortantes separado do resíduo comum, sem coletores armazenados fora do abrigo?', r: [R222(34), R222(35), R222(37)],
    c: 'Há abrigo de resíduos, com ambiente para os resíduos infectantes e perfurocortantes separado do resíduo comum, e não há coletores armazenados fora do abrigo.',
    nc: 'O abrigo de resíduos está em desacordo.', ncPontos: 'O abrigo de resíduos está em desacordo; não atende: {}.',
    na: 'Os resíduos são recolhidos diretamente pela empresa coletora no ponto de geração, sem armazenamento externo no estabelecimento.',
    pontos: [['separado', 'ambiente dos infectantes e perfurocortantes separado do resíduo comum'], ['fora', 'sem coletores armazenados fora do abrigo'], ['revest', 'piso, paredes e teto laváveis, com ventilação e tela contra vetores'], ['ident', 'identificação conforme os grupos de resíduos'], ['restrito', 'acesso restrito'], ['porta', 'porta abrindo para fora, com proteção contra roedores'], ['ralo', 'canaletas e ralo sifonado com tampa'], ['lavagem', 'ponto de água para higienização dos coletores']],
    inf: ['eac_residuos']},
  {id: 'spregula', t: 'O estabelecimento está cadastrado como gerador de resíduos de serviços de saúde no SP Regula (antiga Amlurb), com coleta por empresa autorizada?', r: [LU(144), R222(6, 'inciso', 'iv')],
    c: 'O estabelecimento está cadastrado como gerador de resíduos de serviços de saúde no SP Regula, com coleta por empresa autorizada.',
    nc: 'O estabelecimento não comprovou cadastro como gerador de resíduos de serviços de saúde no SP Regula ou coleta por empresa autorizada.',
    na: 'O serviço de EAC ainda não gera resíduos de serviços de saúde.',
    pontos: [['cad', 'cadastro no SP Regula'], ['contrato', 'contrato com a empresa coletora autorizada'], ['coleta', 'comprovantes de coleta']],
    inf: ['eac_residuos']}
];
const QUALIDADE = [
  {id: 'pgq', t: 'Há Programa de Garantia da Qualidade implantado, com os componentes mínimos?', r: [A(84), A(86)],
    c: 'O Programa de Garantia da Qualidade está implantado, com os componentes exigidos.', nc: 'Não há Programa de Garantia da Qualidade implantado com os componentes exigidos.',
    ncPontos: 'O Programa de Garantia da Qualidade não contempla: {}.',
    na: NAO_FUNC,
    pontos: [['tecnologias', 'gerenciamento das tecnologias'], ['riscos', 'gerenciamento dos riscos inerentes'], ['documentos', 'gestão de documentos'], ['pessoal', 'gestão de pessoal e educação permanente'], ['processos', 'gerenciamento dos processos operacionais'], ['gcq', 'gestão do controle da qualidade']],
    inf: ['eac_pgq']},
  {id: 'indicadores', t: 'O responsável técnico monitora a efetividade do controle da qualidade por indicadores de desempenho, comparados em programas ou referências?', r: [A(87), P(87, 'unico')],
    c: 'O responsável técnico monitora a efetividade do controle da qualidade por indicadores de desempenho.',
    nc: 'Não há monitoramento da efetividade do controle da qualidade por indicadores de desempenho.',
    na: NAO_FUNC, inf: ['eac_pgq']},
  {id: 'notivisa', t: 'Há sistemática para identificar, investigar e notificar no Notivisa eventos adversos e queixas técnicas?', r: [A(90), P(90, '1')],
    c: 'Eventos adversos e queixas técnicas são identificados, investigados e notificados no Notivisa, conforme sistemática definida.',
    nc: 'Não há sistemática para identificar, investigar e notificar eventos adversos e queixas técnicas.',
    na: NAO_FUNC, inf: ['eac_pgq']},
  {id: 'riscos', tipos: [2, 3], t: 'O gerenciamento de riscos contempla identificação, análise, investigação documentada de falhas e ações preventivas e corretivas?', r: [A(107), A(109)],
    c: 'O gerenciamento de riscos contempla identificação, análise, investigação documentada de falhas e ações preventivas e corretivas.',
    nc: 'O gerenciamento de riscos está incompleto.', ncPontos: 'O gerenciamento de riscos não contempla: {}.',
    na: NAO_FUNC,
    pontos: [['ciclo', 'identificação, análise, avaliação, tratamento, monitoramento e comunicação dos riscos'], ['falhas', 'identificação de falhas de equipamentos e erros humanos'], ['investigacao', 'investigação documentada das causas'], ['acoes', 'execução das ações preventivas e corretivas']],
    inf: ['eac_pgq']},
  {id: 'dados', t: 'Há política de acesso e proteção dos dados dos pacientes e de controle de lançamento e alteração de resultados?', r: [A(77), A(105)],
    c: 'A política de acesso e proteção dos dados dos pacientes e de controle de lançamento e alteração de resultados está definida.',
    nc: 'A política de dados e informações do serviço está incompleta.', ncPontos: 'A política de dados e informações do serviço não contempla: {}.',
    na: NAO_FUNC,
    pontos: [['acesso', 'sistemática de acesso aos dados de pacientes e profissionais'], ['alteracoes', 'controle de lançamento e alteração de resultados com histórico (data, horário, usuário e local)'], ['liberacao', 'processo sistematizado de liberação de resultados e laudos'], ['privacidade', 'política de privacidade e confidencialidade (LGPD)'], ['protecao', 'proteção documentada contra acessos não autorizados']],
    inf: ['eac_doc']},
  {id: 'sistema', tipos: [2, 3], t: 'O sistema informatizado foi avaliado e verificado antes da implantação, com documentação de disponibilidade, confiabilidade e integridade dos dados?', r: [A(106)],
    c: 'O sistema informatizado foi avaliado e verificado antes da implantação, com a documentação exigida.', nc: 'Não há avaliação e verificação documentada do sistema informatizado.',
    na: 'O serviço não utiliza sistema informatizado para os EAC.', inf: ['eac_doc']}
];
const PRODUTOS = [
  {id: 'regularizados', t: 'Os produtos para diagnóstico in vitro, reagentes e equipamentos estão regularizados na Anvisa e são usados conforme as instruções do fabricante?', r: [A(88), P(88, 'unico')],
    c: 'Os produtos para diagnóstico in vitro, reagentes e equipamentos estão regularizados na Anvisa e são usados conforme as instruções do fabricante.',
    nc: 'Foram constatados produtos para diagnóstico in vitro, reagentes ou equipamentos sem regularização ou usados fora das instruções do fabricante.',
    na: 'Não há produtos para diagnóstico em estoque ou em uso.', inf: ['eac_produto']},
  {id: 'validade', t: 'Há produtos para diagnóstico, reagentes ou insumos com validade expirada em uso ou em estoque?', r: [A(102)], sim: 'nc',
    c: 'Não foram constatados produtos para diagnóstico, reagentes ou insumos vencidos.', nc: 'Foram constatados produtos para diagnóstico, reagentes ou insumos com validade expirada.',
    na: 'Não há produtos para diagnóstico em estoque ou em uso.', inf: ['eac_produto']},
  {id: 'recebimento', t: 'O recebimento dos produtos é registrado com lote, conformidade do transporte e data?', r: [A(100), P(100, 'unico')],
    c: 'O recebimento dos produtos é registrado com lote, conformidade do transporte e data.', nc: 'O registro do recebimento dos produtos está incompleto.',
    ncPontos: 'O registro do recebimento dos produtos não traz: {}.',
    na: 'Ainda não houve recebimento de produtos para diagnóstico.',
    pontos: [['lote', 'número do lote'], ['transporte', 'conformidade das condições de transporte'], ['data', 'data de recebimento']],
    inf: ['eac_registros']},
  {id: 'fracionados', tipos: [2, 3], t: 'Os reagentes e insumos fracionados ou preparados no serviço são rotulados com os dados exigidos, sem comercialização ou troca com outros serviços?', r: [A(101), P(101, '1'), P(101, '2')],
    c: 'Os reagentes e insumos fracionados ou preparados no serviço são rotulados com os dados exigidos.', nc: 'Os reagentes ou insumos fracionados ou preparados no serviço estão em desacordo.',
    ncPontos: 'O rótulo dos reagentes ou insumos fracionados ou preparados não traz: {}.',
    na: 'O serviço não fraciona nem prepara reagentes ou insumos.',
    pontos: [['nome', 'nome do reagente ou insumo'], ['concentracao', 'concentração ou especificação'], ['lote', 'lote, quando aplicável'], ['preparo', 'data de preparação'], ['responsavel', 'responsável pelo preparo'], ['validade', 'data de validade'], ['armazenamento', 'condições de armazenamento'], ['riscos', 'riscos potenciais']],
    inf: ['eac_produto']},
  {id: 'armazenamento', t: 'O armazenamento garante a conservação dos produtos, com controle de temperatura e umidade conforme o fabricante, mesmo em falta de energia?', r: [A(95), A(104)],
    c: 'O armazenamento garante a conservação dos produtos, com controle de temperatura e umidade conforme o fabricante.',
    nc: 'O armazenamento dos produtos está em desacordo.', ncPontos: 'O armazenamento dos produtos está em desacordo; não atende: {}.',
    na: 'Não há produtos para diagnóstico em estoque.',
    pontos: [['temperatura', 'controle de temperatura conforme o fabricante'], ['umidade', 'controle de umidade conforme o fabricante'], ['energia', 'conservação garantida em falta de energia']],
    inf: ['eac_temp']},
  {id: 'manutencao', t: 'Há registro da manutenção preventiva e corretiva dos equipamentos e das medidas e verificações, com preventiva no mínimo anual quando o fabricante não definir?', r: [A(92), P(92, 'unico'), A(93)],
    c: 'A manutenção preventiva e corretiva dos equipamentos e as medidas e verificações estão registradas.', nc: 'Não há registro da manutenção preventiva e corretiva ou das verificações dos equipamentos.',
    na: 'Não há equipamentos que exijam manutenção (são usados apenas testes de uso único).', inf: ['eac_registros']},
  {id: 'calibracao', t: 'Há procedimento e registro da calibração dos equipamentos, na frequência do fabricante ou, na falta dela, anual?', r: [A(94), P(94, '1'), P(94, '2')],
    c: 'A calibração dos equipamentos segue procedimento e está registrada.', nc: 'Não há procedimento ou registro da calibração dos equipamentos.',
    na: 'Não há equipamentos que exijam calibração (são usados apenas testes de uso único).', inf: ['eac_registros']},
  {id: 'manuais', t: 'Há instruções escritas em português para os equipamentos (podem ser os manuais do fabricante)?', r: [A(99)],
    c: 'As instruções dos equipamentos estão disponíveis em português.', nc: 'Não há instruções escritas em português para os equipamentos.',
    na: 'Não há equipamentos em uso.', inf: ['eac_doc']}
];
const BIOSSEG = [
  {id: 'biosseguranca', t: 'Há instruções escritas de biossegurança atualizadas e disponíveis a todos os funcionários?', r: [A(110)],
    c: 'Há instruções escritas de biossegurança atualizadas e disponíveis a todos os funcionários.',
    nc: 'As instruções escritas de biossegurança estão incompletas.', ncPontos: 'As instruções escritas de biossegurança não contemplam: {}.',
    na: NAO_FUNC,
    pontos: [['seguranca', 'segurança biológica, química, física, ocupacional e ambiental'], ['epi', 'uso de EPI e EPC'], ['acidentes', 'procedimentos em caso de acidentes'], ['transporte', 'manuseio e transporte de material biológico']],
    inf: ['eac_doc']},
  {id: 'imunizacao', t: 'O serviço garante orientação aos trabalhadores sobre imunização contra tétano, difteria, hepatite B e outros agentes biológicos a que possam estar expostos?', r: [R63(43)],
    c: 'O serviço garante orientação aos trabalhadores sobre imunização contra tétano, difteria, hepatite B e outros agentes biológicos a que possam estar expostos.',
    nc: 'O serviço não garante orientação aos trabalhadores sobre imunização contra tétano, difteria, hepatite B e outros agentes biológicos a que possam estar expostos.',
    na: 'Não há trabalhadores expostos a agentes biológicos além do responsável técnico.',
    checks: {rotulo: 'O que foi verificado (vai ao relatório; não gera infração)', opcoes: [['comprovantes', 'Comprovantes de vacinação dos trabalhadores apresentados', 'comprovantes de vacinação dos trabalhadores apresentados'], ['orientacao', 'Orientação registrada (POP, treinamento ou termo)', 'orientação registrada em POP, treinamento ou termo']], outro: 'Outros — descrever'},
    inf: ['eac_saude_trab']}
];
const DOCS = [
  {id: 'pgrss', t: 'Há Plano de Gerenciamento de Resíduos de Serviços de Saúde (PGRSS) implantado, com o conteúdo exigido?', r: [A(111), R222(5), R222(6)],
    c: 'O Plano de Gerenciamento de Resíduos de Serviços de Saúde está implantado, com o conteúdo exigido.', nc: 'O Plano de Gerenciamento de Resíduos de Serviços de Saúde está incompleto ou não foi implantado.',
    ncPontos: 'O Plano de Gerenciamento de Resíduos de Serviços de Saúde não contempla: {}.',
    na: 'O serviço gera exclusivamente resíduos do Grupo D, condição notificada à vigilância sanitária (RDC 222/2018, art. 5º, § 1º).',
    pontos: [['estimativa', 'estimativa da quantidade de resíduos por grupo'], ['manejo', 'procedimentos de manejo (segregação à destinação final)'], ['emergencia', 'ações em emergências e acidentes'], ['pragas', 'controle de vetores e pragas'], ['capacitacao', 'programa de capacitação, inclusive da limpeza'], ['contrato', 'contrato e licença ambiental das empresas de coleta e destinação']],
    inf: ['eac_residuos']},
  {id: 'documentos_disp', t: 'Estão disponíveis os documentos exigidos do serviço?', r: [A(117)],
    c: 'Os documentos exigidos do serviço estão disponíveis.', nc: 'Os documentos exigidos do serviço não estão todos disponíveis.',
    ncPontos: 'Não estão disponíveis: {}.',
    na: 'O serviço de EAC ainda não está em funcionamento, sem registros a apresentar.',
    pontos: [['procedimentos', 'relação e registros de todos os procedimentos realizados'], ['inventario', 'inventário dos produtos sujeitos à vigilância sanitária'], ['equipe', 'relação nominal da equipe, com atribuições, qualificações e cargas horárias'], ['programas', 'registros dos Programas de Educação Permanente e de Garantia da Qualidade'], ['controles', 'registros dos ensaios de proficiência e do controle interno da qualidade']],
    inf: ['eac_doc']},
  {id: 'prazo_registros', t: 'Os registros são mantidos por, no mínimo, 5 anos, e as alterações preservam o dado original, com data e responsável?', r: [A(115), A(116)],
    c: 'Os registros são mantidos por, no mínimo, 5 anos, e as alterações preservam o dado original.',
    nc: 'Os registros não são mantidos pelo prazo mínimo de 5 anos ou as alterações não preservam o dado original.',
    na: 'Ainda não há registros do serviço de EAC.', inf: ['eac_registros']}
];
const PESSOAL = [
  {id: 'formacao', t: 'Há registros da formação e qualificação dos profissionais, compatíveis com as funções?', r: [A(123)],
    c: 'A formação e a qualificação dos profissionais estão registradas e são compatíveis com as funções.', nc: 'Não há registros da formação e qualificação dos profissionais.',
    na: 'O serviço de EAC ainda não tem equipe contratada.', inf: ['eac_educacao']},
  {id: 'educacao', t: 'Há Programa de Educação Permanente para toda a equipe, com os elementos mínimos?', r: [A(124), A(125)],
    c: 'O Programa de Educação Permanente está implantado com os elementos exigidos.', nc: 'O Programa de Educação Permanente está incompleto ou não foi implantado.',
    ncPontos: 'O Programa de Educação Permanente não contempla: {}.',
    na: 'O serviço de EAC ainda não tem equipe contratada.',
    pontos: [['periodicas', 'capacitações iniciais e periódicas, no mínimo anuais'], ['novos', 'treinamento antes de novos processos, tecnologias ou pessoas'], ['eficacia', 'avaliação da eficácia das capacitações']],
    inf: ['eac_educacao']},
  {id: 'treinos', t: 'Os treinamentos abordam os tópicos mínimos?', r: [A(126)],
    c: 'Os treinamentos abordam instruções escritas, segurança do paciente, gerenciamento de riscos e o Programa de Garantia da Qualidade.',
    nc: 'Os treinamentos não abordam todos os tópicos mínimos.', ncPontos: 'Os treinamentos não abordam: {}.',
    na: 'Ainda não houve treinamentos, por se tratar de serviço em implantação.',
    pontos: [['instrucoes', 'instruções escritas'], ['seguranca', 'segurança do paciente'], ['riscos', 'gerenciamento dos riscos das tecnologias'], ['pgq', 'Programa de Garantia da Qualidade']],
    inf: ['eac_educacao']},
  {id: 'registro_treinos', t: 'Os treinamentos estão registrados com os dados exigidos?', r: [A(127)],
    c: 'Os treinamentos estão registrados com data, horário, carga horária, conteúdo, instrutor e participantes.',
    nc: 'O registro dos treinamentos está incompleto.', ncPontos: 'O registro dos treinamentos não traz: {}.',
    na: 'Ainda não houve treinamentos, por se tratar de serviço em implantação.',
    pontos: [['data', 'data e horário'], ['carga', 'carga horária'], ['conteudo', 'conteúdo ministrado'], ['instrutor', 'nome e formação do instrutor'], ['participantes', 'trabalhadores participantes']],
    inf: ['eac_educacao']},
  {id: 'aso', t: 'Os trabalhadores são avaliados periodicamente quanto à saúde ocupacional, com registro (Atestado de Saúde Ocupacional — ASO)?', r: [R63(44)],
    c: 'Os trabalhadores são avaliados periodicamente quanto à saúde ocupacional, com registro em Atestado de Saúde Ocupacional (ASO).',
    nc: 'Não foram apresentados os registros da avaliação periódica de saúde ocupacional (ASO) dos trabalhadores.',
    na: 'Não há trabalhadores com vínculo empregatício no serviço de EAC.', inf: ['eac_saude_trab']}
];
const PRE = [
  {id: 'orientacao', t: 'O paciente recebe orientação em linguagem acessível sobre o preparo e a coleta?', r: [I(132, 'i')],
    c: 'O paciente recebe orientação em linguagem acessível sobre o preparo e a coleta.', nc: 'O paciente não recebe orientação sobre o preparo e a coleta.',
    na: 'Não houve atendimento de paciente durante a inspeção.', inf: ['eac_processo']},
  {id: 'documento', t: 'É solicitado documento com foto para identificar o paciente no cadastro?', r: [I(132, 'ii')],
    c: 'É solicitado documento com foto para identificar o paciente no cadastro.', nc: 'Não é solicitado documento com foto para identificar o paciente.',
    na: 'Não houve atendimento de paciente durante a inspeção.', inf: ['eac_processo']},
  {id: 'instrucoes_pre', t: 'Há instruções escritas e atualizadas para as atividades pré-analíticas?', r: [I(132, 'iii')],
    c: 'As atividades pré-analíticas seguem instruções escritas e atualizadas.', nc: 'Não há instruções escritas para as atividades pré-analíticas.',
    na: NAO_FUNC, inf: ['eac_doc']},
  {id: 'cadastro', t: 'O cadastro do paciente traz os dados mínimos?', r: [A(133), A(134)],
    c: 'O cadastro do paciente contém os dados mínimos exigidos.', nc: 'O cadastro do paciente não contém os dados mínimos exigidos.',
    ncPontos: 'O cadastro do paciente não traz: {}.',
    na: 'Ainda não há pacientes cadastrados.',
    pontos: [['registro', 'número de registro do paciente'], ['nome', 'nome completo'], ['social', 'nome social, quando aplicável'], ['nascimento', 'data de nascimento'], ['sexo', 'sexo biológico'], ['mae', 'nome da mãe'], ['contato', 'telefone ou endereço'], ['responsavel', 'responsável, em caso de menor ou incapaz']],
    inf: ['eac_rastreab']},
  {id: 'cadastro_eac', t: 'O cadastro do exame traz as informações exigidas?', r: [A(135), A(136)],
    c: 'O cadastro do exame contém as informações exigidas.', nc: 'O cadastro do exame não contém as informações exigidas.',
    ncPontos: 'O cadastro do exame não traz: {}.',
    na: 'Ainda não há exames cadastrados.',
    pontos: [['solicitante', 'nome do solicitante'], ['atendimento', 'data e horário do atendimento'], ['coleta', 'horário da coleta'], ['unidade', 'unidade da coleta e CNES'], ['exames', 'exames solicitados e tipo de material'], ['prof_cadastro', 'profissional que fez o cadastro'], ['prof_coleta', 'profissional que fez a coleta'], ['entrega', 'data prevista para o laudo, quando aplicável'], ['clinicas', 'informações clínicas relevantes (medicamentos, condições de saúde)']],
    inf: ['eac_rastreab']},
  {id: 'comprovante', tipos: [2, 3], t: 'O paciente recebe comprovante de atendimento com os dados exigidos?', r: [A(137), P(137, 'unico')],
    c: 'O paciente recebe comprovante de atendimento com os dados exigidos.', nc: 'O comprovante de atendimento entregue ao paciente está incompleto.',
    ncPontos: 'O comprovante de atendimento não traz: {}.',
    na: 'Os exames são executados no ato da coleta, com entrega imediata do laudo ao paciente (art. 137, parágrafo único).',
    pontos: [['registro', 'número de registro'], ['nome', 'nome do paciente'], ['data', 'data do atendimento'], ['previsao', 'data prevista de entrega do laudo'], ['exames', 'exames solicitados'], ['contato', 'contato do serviço']],
    inf: ['eac_rastreab']},
  {id: 'identificacao', t: 'O material biológico é identificado na coleta ou no recebimento com os dados mínimos (identificação simplificada quando o laudo é entregue no ato)?', r: [A(138), P(138, '1'), P(138, '2'), P(129, 'unico')],
    c: 'O material biológico é identificado de forma a garantir a rastreabilidade até o paciente.',
    nc: 'O material biológico não é identificado de forma a garantir a rastreabilidade até o paciente.', ncPontos: 'A identificação do material biológico não traz: {}.',
    na: 'Não houve coleta durante a inspeção.',
    pontos: [['nome', 'nome do paciente'], ['nascimento', 'data de nascimento ou idade'], ['material', 'tipo de material biológico'], ['registro', 'número de registro do paciente'], ['data', 'data e horário da coleta rastreáveis']],
    inf: ['eac_rastreab']},
  {id: 'aceitacao', t: 'Há critérios definidos para aceitação, rejeição e identificação do material biológico?', r: [A(139)],
    c: 'Os critérios para aceitação e rejeição do material biológico estão definidos.', nc: 'Não há critérios definidos para aceitação e rejeição do material biológico.',
    na: NAO_FUNC, inf: ['eac_processo']}
];
const TRANSP = [
  {id: 'transporte', t: 'O material biológico é transportado conforme a RDC nº 504/2021, com embalagem e identificação da embalagem terciária adequadas?', r: [A(140), A(143)],
    c: 'O material biológico é transportado conforme a RDC nº 504/2021, com embalagem e identificação adequadas.', nc: 'O transporte do material biológico está em desacordo com a RDC nº 504/2021.',
    na: 'O serviço não transporta material biológico.',
    pontos: [['embalagem', 'embalagem tripla adequada ao material'], ['identificacao', 'informações na embalagem terciária'], ['temperatura', 'controle e registro da temperatura no transporte'], ['rastreab', 'registro de envio e recebimento (rastreabilidade)']],
    inf: ['eac_transporte']},
  {id: 'envio_apoio', tipos: [3], t: 'O laboratório responde pelo envio do material aos laboratórios de apoio, com registro que garanta a rastreabilidade?', r: [A(141), A(128)], naSe: NAO('p_apoio'),
    c: 'O laboratório responde pelo envio do material aos laboratórios de apoio, com registro que garante a rastreabilidade.', nc: 'O envio de material aos laboratórios de apoio não é registrado de forma a garantir a rastreabilidade.',
    na: 'O laboratório não envia exames a laboratório de apoio.', inf: ['eac_transporte']}
];
const ANALITICA = [
  {id: 'instrucoes_an', t: 'Há instruções escritas e atualizadas para os processos analíticos (podem ser as instruções do fabricante), com rastreabilidade da fase analítica?', r: [I(154, 'i'), I(154, 'ii'), A(155)],
    c: 'Os processos analíticos seguem instruções escritas e atualizadas, com rastreabilidade da fase analítica.', nc: 'Não há instruções escritas para os processos analíticos ou não há rastreabilidade da fase analítica.',
    na: 'O serviço não executa EAC; realiza apenas a fase pré-analítica.', inf: ['eac_doc']},
  {id: 'criticos', t: 'Estão definidos valores críticos ou de alerta e o fluxo de comunicação ao paciente ou ao profissional de saúde?', r: [I(154, 'iii'), P(165, 'unico')],
    c: 'Estão definidos valores críticos ou de alerta e o fluxo de comunicação ao paciente ou ao profissional de saúde.',
    nc: 'Não estão definidos valores críticos ou de alerta ou o fluxo de comunicação quando há necessidade de decisão imediata.',
    na: 'Os exames oferecidos não têm valores críticos ou de alerta definidos pelo fabricante.', inf: ['eac_processo']},
  {id: 'liberacao', t: 'Há procedimentos documentados, disponíveis no local do exame, para registro e liberação de resultados e assinatura dos laudos?', r: [A(119), A(165)],
    c: 'A liberação de resultados e a assinatura dos laudos seguem procedimentos documentados, disponíveis no local do exame.', nc: 'Os procedimentos de liberação de resultados estão incompletos.',
    ncPontos: 'Não há procedimento documentado para: {}.',
    na: NAO_FUNC,
    pontos: [['registro', 'registro e liberação de resultados'], ['criticos', 'resultados potencialmente críticos'], ['revisao', 'revisão de resultados e liberação de laudos por profissional habilitado'], ['situacoes', 'rotina, plantões, urgências e emergências']],
    inf: ['eac_doc']},
  {id: 'laudo', t: 'O laudo é legível, em português, datado e assinado por profissional habilitado, com os dados mínimos?', r: [A(166), A(167), A(129)],
    c: 'O laudo é legível, em português, datado e assinado por profissional habilitado, com os dados mínimos exigidos.',
    nc: 'O laudo não contém os dados mínimos exigidos.', ncPontos: 'O laudo não traz: {}.',
    na: 'Ainda não há laudos emitidos pelo serviço.',
    pontos: [['servico', 'nome do serviço responsável pela análise e CNES'], ['contato', 'endereço e telefone'], ['rt', 'responsável técnico e registro no conselho'], ['assinante', 'profissional que assina e registro no conselho'], ['paciente', 'nome e registro do paciente'], ['idade', 'idade ou data de nascimento'], ['coleta', 'data da coleta'], ['exame', 'exame, material e método'], ['resultado', 'resultado e unidade'], ['referencia', 'valores de referência e limitações'], ['restricao', 'aceitação de material com restrição, quando houver'], ['emissao', 'data de emissão'], ['assinatura', 'assinatura legalmente válida']],
    inf: ['eac_laudo']},
  {id: 'retificacao', tipos: [2, 3], t: 'A retificação de laudo já emitido é feita em novo laudo, com comunicação registrada ao paciente nas alterações relevantes?', r: [A(170), P(170, 'unico')],
    c: 'A retificação de laudo é feita em novo laudo, com comunicação registrada ao paciente nas alterações relevantes.', nc: 'A retificação de laudo não é feita em novo laudo ou não há comunicação registrada ao paciente.',
    na: 'Não houve retificação de laudo.', inf: ['eac_laudo']},
  {id: 'dnc', t: 'Há procedimento para notificar resultados que indiquem suspeita de doença de notificação compulsória, seguindo as diretrizes de diagnóstico do Ministério da Saúde?', r: [A(66), A(67)],
    c: 'Há procedimento para notificar resultados que indiquem suspeita de doença de notificação compulsória.',
    nc: 'Não há procedimento para notificar resultados que indiquem suspeita de doença de notificação compulsória.',
    na: 'Os exames oferecidos não detectam doenças de notificação compulsória.', inf: ['eac_processo']}
];
const CQ = {
  gcq: [
    {id: 'gcq_doc', t: 'A gestão do controle da qualidade está documentada, com instruções escritas e os elementos mínimos?', r: [A(174), A(175), A(176)],
      c: 'A gestão do controle da qualidade está documentada com os elementos exigidos.', nc: 'A gestão do controle da qualidade está incompleta.',
      ncPontos: 'A gestão do controle da qualidade não contempla: {}.',
      na: NAO_FUNC,
      pontos: [['lista', 'lista de todos os exames realizados'], ['forma', 'forma de controle e frequência'], ['limites', 'limites e critérios de aceitabilidade'], ['avaliacao', 'avaliação e registro dos resultados dos controles'], ['relatorio', 'relatório anual de desempenho do CEQ']],
      inf: ['eac_cq']}
  ],
  ciq: [
    {id: 'ciq', t: 'O CIQ é feito em todos os equipamentos e para todos os analitos, com os elementos exigidos?', r: [A(177), A(178), A(179), A(180)],
      c: 'O controle interno da qualidade é feito em todos os equipamentos e analitos, com registros e critérios definidos.',
      nc: 'O controle interno da qualidade está incompleto.', ncPontos: 'O controle interno da qualidade não contempla: {}.',
      na: NAO_FUNC,
      pontos: [['equipamentos', 'todos os equipamentos em uso'], ['analitos', 'todos os analitos'], ['registro', 'registro e análise dos resultados das amostras controle'], ['criterios', 'critérios de aceitação e rejeição por analito'], ['liberacao', 'liberação ou rejeição das análises após os controles'], ['inadequacoes', 'registro das inadequações, causas e ações']],
      inf: ['eac_cq']},
    {id: 'ciq_amostra', t: 'São usadas amostras controle comerciais ou de provedor de controle da qualidade regularizado (ou forma alternativa descrita em literatura)?', r: [A(181), A(182)],
      c: 'As amostras controle são comerciais ou de provedor de controle da qualidade regularizado.', nc: 'Não são usadas amostras controle comerciais ou de provedor regularizado, nem forma alternativa fundamentada.',
      na: NAO_FUNC, inf: ['eac_cq']},
    {id: 'ciq_freq', t: 'Nos testes de uso único, o CIQ é feito, no mínimo, a cada troca de lote, a cada remessa e conforme o fabricante (e a cada manutenção do equipamento de leitura)?', r: [A(183), P(183, '1'), A(184)],
      c: 'Nos testes de uso único, o controle interno é feito a cada troca de lote, a cada remessa e conforme o fabricante.',
      nc: 'Nos testes de uso único, o controle interno não é feito na frequência mínima.',
      na: 'Não são utilizados testes de uso único.', inf: ['eac_cq']},
    {id: 'ciq_corrida', tipos: [3], t: 'Nos demais exames, o CIQ é feito, no mínimo, a cada corrida analítica, conforme o fabricante e a cada manutenção preventiva e corretiva?', r: [P(183, '2')],
      c: 'O controle interno é feito a cada corrida analítica, conforme o fabricante e a cada manutenção.', nc: 'O controle interno não é feito a cada corrida analítica ou após as manutenções.',
      na: 'O laboratório usa apenas testes de uso único.', inf: ['eac_cq']}
  ],
  ceq: [
    {id: 'ceq', t: 'O serviço participa, de forma individual, de programa de CEQ para todos os analitos e equipamentos em uso, com relatório de desempenho no mínimo anual?', r: [A(185), A(186), A(187), A(188), I(176, 'v')],
      c: 'O serviço participa de controle externo da qualidade para todos os analitos e equipamentos em uso.',
      nc: 'O serviço não participa de controle externo da qualidade para todos os analitos e equipamentos em uso.',
      na: NAO_FUNC, inf: ['eac_cq']},
    {id: 'ceq_alt', t: 'Para exames sem programa de CEQ disponível, há verificação anual da disponibilidade e forma alternativa de avaliação da exatidão?', r: [A(189), P(189, 'unico')],
      c: 'Para exames sem programa de controle externo, há verificação anual da disponibilidade e forma alternativa de avaliação.',
      nc: 'Para exames sem programa de controle externo, não há forma alternativa de avaliação da exatidão.',
      na: 'Todos os exames oferecidos têm programa de controle externo da qualidade disponível.', inf: ['eac_cq']}
  ]
};

const INFRACOES = [
  {id: 'farm_lic', grupo: 'Licenciamento e responsabilidade', texto: 'Exercer atividade de farmácia ou drogaria sem licença sanitária vigente.', r: [LM(90)]},
  {id: 'eac_lic', grupo: 'Licenciamento e responsabilidade', texto: 'Executar Exames de Análises Clínicas sem licença sanitária para a atividade ou sem que a licença sanitária indique as atividades relacionadas ao EAC.', r: [LM(90), LM(90) + '::paragrafo::1', A(73)]},
  {id: 'eac_cnes', grupo: 'Licenciamento e responsabilidade', texto: 'Executar Exames de Análises Clínicas sem inscrição no Cadastro Nacional de Estabelecimentos de Saúde.', r: [LM(50), A(74)]},
  {id: 'eac_rt', grupo: 'Licenciamento e responsabilidade', texto: 'Executar Exames de Análises Clínicas sem responsável técnico ou sem supervisor do pessoal técnico presente durante o funcionamento.', r: [LM(50), A(75), A(122)]},
  {id: 'eac_prof', grupo: 'Licenciamento e responsabilidade', texto: 'Permitir a execução de Exames de Análises Clínicas ou a coleta por profissional não habilitado ou sem a supervisão exigida.', r: [LM(50), A(11), P(23, '1')]},
  {id: 'eac_tipo1', grupo: 'Licenciamento e responsabilidade', texto: 'Executar Exames de Análises Clínicas em desacordo com os requisitos do Serviço Tipo I.', r: [LM(50), A(10)]},
  {id: 'eac_tipo2', grupo: 'Licenciamento e responsabilidade', texto: 'Executar atividades relacionadas aos Exames de Análises Clínicas em desacordo com os requisitos do Serviço Tipo II.', r: [LM(50), A(22), A(23), A(24), A(25)]},
  {id: 'eac_vinculo', grupo: 'Licenciamento e responsabilidade', texto: 'Encaminhar material biológico a Serviço Tipo III sem vínculo, ou manter posto de coleta vinculado a mais de um Serviço Tipo III.', r: [LM(50), A(61), A(62)]},
  {id: 'eac_dsf', grupo: 'Licenciamento e responsabilidade', texto: 'Deixar de registrar o resultado do Exame de Análises Clínicas na Declaração de Serviço Farmacêutico.', r: [LM(50), P(60, '2')]},
  {id: 'eac_apoio', grupo: 'Relações com terceiros', texto: 'Utilizar laboratório de apoio sem contrato formal, sem avaliação anual da qualidade ou, no exterior, sem comprovação da regularidade.', r: [LM(50), A(37), A(38), A(39), A(82)]},
  {id: 'eac_itinerante', grupo: 'Relações com terceiros', texto: 'Manter serviço de EAC itinerante em desacordo com os requisitos da RDC Anvisa nº 978/2025.', r: [LM(50), A(44), A(45), A(46), A(47), A(48), A(50), A(51), A(53)]},
  {id: 'eac_cd', grupo: 'Relações com terceiros', texto: 'Manter Central de Distribuição em desacordo com os requisitos da RDC Anvisa nº 978/2025.', r: [LM(50), A(146), A(147), A(148), A(149), A(151), A(152)]},
  {id: 'eac_infra', grupo: 'Infraestrutura', texto: 'Manter o serviço de Exames de Análises Clínicas sem os ambientes ou itens de infraestrutura obrigatórios.', r: [LM(50)]},
  {id: 'eac_temp', grupo: 'Produtos e equipamentos', texto: 'Armazenar produtos para diagnóstico in vitro, materiais de controle ou material biológico sem as condições de conservação e o registro de temperatura exigidos.', r: [LM(46), A(95), A(96)]},
  {id: 'eac_produto', grupo: 'Produtos e equipamentos', texto: 'Utilizar produto para diagnóstico in vitro, reagente ou equipamento sem regularização, com validade expirada, fora das instruções do fabricante ou fracionado sem a rotulagem exigida.', r: [LM(46), A(88), A(101), A(102)]},
  {id: 'eac_registros', grupo: 'Produtos e equipamentos', texto: 'Deixar de registrar o recebimento de produtos, a manutenção ou a calibração dos equipamentos, ou de manter os registros pelo prazo exigido.', r: [LM(46), A(92), A(94), A(100), A(115)]},
  {id: 'eac_pgq', grupo: 'Gestão da qualidade', texto: 'Deixar de implantar o Programa de Garantia da Qualidade ou o gerenciamento de riscos do serviço de Exames de Análises Clínicas.', r: [LM(46), A(84), A(86), A(109)]},
  {id: 'eac_doc', grupo: 'Gestão da qualidade', texto: 'Deixar de manter as instruções escritas e os documentos exigidos para o serviço de Exames de Análises Clínicas.', r: [LM(50), A(110), A(117), A(119), I(154, 'i')]},
  {id: 'eac_limpeza', grupo: 'Gestão da qualidade', texto: 'Deixar de manter instruções de limpeza e o registro diário da limpeza, ou utilizar saneante sem regularização.', r: [LM(50), A(112), A(113), A(114)]},
  {id: 'eac_residuos', grupo: 'Gestão da qualidade', texto: 'Deixar de gerenciar os resíduos de serviços de saúde conforme o PGRSS e a RDC 222/2018 (segregação, coletores, acondicionamento, abrigo, cadastro do gerador e coleta).', r: [LM(50), A(111), R222(5), R222(11), R222(17), R222(35), R222(86), LU(144)]},
  {id: 'eac_saude_trab', grupo: 'Pessoal', texto: 'Deixar de garantir orientação sobre imunização dos trabalhadores ou a avaliação periódica de saúde ocupacional, com registro.', r: [LM(50), R63(43), R63(44)]},
  {id: 'eac_educacao', grupo: 'Pessoal', texto: 'Deixar de manter equipe dimensionada, registros de qualificação e o Programa de Educação Permanente da equipe.', r: [LM(50), A(120), A(123), A(124), A(127)]},
  {id: 'eac_rastreab', grupo: 'Processos operacionais', texto: 'Deixar de garantir o cadastro do paciente e do exame, o comprovante de atendimento e a identificação do material biológico que assegurem a rastreabilidade.', r: [LM(50), A(128), A(134), A(136), A(137), A(138)]},
  {id: 'eac_transporte', grupo: 'Processos operacionais', texto: 'Transportar ou enviar material biológico em desacordo com a RDC nº 504/2021 ou sem rastreabilidade.', r: [LM(50), A(140), A(141), A(143)]},
  {id: 'eac_processo', grupo: 'Processos operacionais', texto: 'Executar Exames de Análises Clínicas sem as orientações, critérios e fluxos exigidos para as fases pré-analítica, analítica e pós-analítica.', r: [LM(50), A(132), A(139), A(154), A(156)]},
  {id: 'eac_inhouse', grupo: 'Processos operacionais', texto: 'Utilizar metodologia própria sem documentação, validação ou identificação no laudo, ou comercializar produtos dela provenientes.', r: [LM(50), A(158), A(159), A(160), A(163), A(164)]},
  {id: 'eac_laudo', grupo: 'Processos operacionais', texto: 'Emitir, transcrever ou retificar laudo sem os requisitos mínimos ou sem assinatura de profissional legalmente habilitado.', r: [LM(50), A(166), A(167), A(168), A(169), A(170)]},
  {id: 'eac_cq', grupo: 'Controle da qualidade', texto: 'Deixar de realizar e registrar o controle interno e o controle externo da qualidade dos Exames de Análises Clínicas.', r: [LM(46), A(171), A(176), A(177), A(185)]}
];
const INFRA_REF = {1: [A(13), A(14)], 2: [A(27), A(28)], 3: [A(40)]};
const ITEM_ORIENT = {lic: 'lic', resp: 'resp', req: 'tipo1', ambientes: 'ambientes', salacoleta: 'salacoleta', pgq: 'pgq', produtos: 'produtos', biosseg: 'biosseg', documentos: 'documentos', equipe: 'equipe', pre: 'pre', analitica: 'analitica', gcq: 'gcq', ciq: 'ciq', ceq: 'ceq'};

const copia = x => JSON.parse(JSON.stringify(x));
function monta(t) {
  const x = TIPO[t];
  const de = lista => copia(lista).filter(q => !q.tipos || q.tipos.includes(t)).map(q => { delete q.tipos; return q; });
  const item = (id, titulo, curto, perguntas, extra) => {
    const it = Object.assign({id, titulo, curto}, extra || {}, {perguntas: de(perguntas)});
    if (!it.perguntas.length) delete it.perguntas;
    if (t === 1 && ORIENT[ITEM_ORIENT[id]]) it.orient = copia(ORIENT[ITEM_ORIENT[id]]);
    return it;
  };
  const REQ = {1: REQ1, 2: REQ2, 3: []}[t];
  const secoes = [
    {id: 'ident', titulo: 'Identificação e perfil', curto: 'Identificação', icone: 'building',
      descricao: t === 3 ? 'Dados do laboratório e o que ele faz. O perfil marca “Não se aplica” no que não existir.' : 'Dados do estabelecimento e os exames realizados.',
      itens: [
        Object.assign({id: 'dados', titulo: 'Dados do estabelecimento e da inspeção', curto: 'Dados', campos: dados(t)},
          t === 1 ? {acoes: [{id: 'anvisa_cnpj', rotulo: 'Buscar dados na Anvisa pelo CNPJ', pri: true}, {id: 'ocr_crt', rotulo: 'Ler certidão do CRF'}],
            acoesNota: 'A busca usa a base de AFE/AE da Anvisa (a mesma da Central de Consultas); a certidão do CRF é lida no próprio aparelho. Só os campos vazios são preenchidos — confira antes de seguir.'} : {}),
        {id: 'exames', titulo: t === 3 ? 'Setores e equipamentos' : 'Exames realizados e equipamentos', curto: t === 3 ? 'Setores' : 'Exames', campos: exames(t)}
      ].concat(t === 3 ? [{id: 'perfil', titulo: 'Perfil do laboratório', curto: 'Perfil', campos: copia(PERFIL3)}] : [])},
    {id: 'classif', titulo: 'Classificação e responsabilidade', curto: 'Classificação', icone: 'folder', itens: [
      item('lic', 'Licenciamento e cadastro', 'Licenciamento', LIC, {campos: [{id: 'lic_inicial', rotulo: 'Trata-se de licença inicial do serviço de EAC?', tipo: 'select', rel: false, opcoes: [['sim', 'Sim — o serviço ainda não é licenciado'], ['nao', 'Não — o serviço já é licenciado']]}]}),
      item('resp', 'Responsável técnico e supervisão', 'Responsáveis', RESP),
      t !== 3 ? item('req', 'Requisitos do Serviço Tipo ' + ['', 'I', 'II'][t], 'Serviço Tipo ' + ['', 'I', 'II'][t], REQ,
        {descricao: 'Requisitos obrigatórios da classificação (RDC 978/2025, ' + (t === 1 ? 'arts. 10 a 12' : 'arts. 22 a 25 e 32') + '). Atenção: nas perguntas sobre ' + (t === 1 ? 'guarda de material, ' : 'recebimento de material, ') + 'metodologia própria e água reagente, a resposta “Sim” é a irregular.'}) : null
    ].filter(Boolean)},
  ];
  if (t === 3) secoes.push({id: 'relacoes', titulo: 'Relações com outros serviços', curto: 'Relações', icone: 'folder',
    descricao: 'Verificações que dependem do perfil do laboratório; o que ele não faz fica como “Não se aplica”.', itens: [
      item('apoio', 'Laboratório de apoio e postos de coleta', 'Apoio e postos', REQ3),
      item('itinerante', 'Serviço de EAC itinerante', 'Itinerante', ITIN),
      item('cd', 'Central de Distribuição', 'Central de Distribuição', CD)
    ]});
  secoes.push(
    {id: 'infra', titulo: 'Infraestrutura', curto: 'Infraestrutura', icone: 'plan',
      descricao: 'Itens de infraestrutura exigíveis em reformas, ampliações, construções novas ou mudança de uso dos ambientes (art. 191, parágrafo único).',
      itens: [
        {id: 'inventario', titulo: 'Inventário de irregularidades por ambiente', curto: 'Inventário por ambiente',
          descricao: 'Percorra os ambientes do serviço e marque, em cada um, as irregularidades de infraestrutura encontradas.',
          campos: [INV.campo({ambientes: x.ambientes, inf: ['eac_infra']})]},
        item('ambientes', 'Ambientes', 'Ambientes', AMB[t]),
        item('salacoleta', t === 3 ? 'Equipamentos de temperatura controlada' : 'Sala de coleta e execução', t === 3 ? 'Temperatura' : 'Sala de coleta', SALA[t]),
        item('residuos', 'Limpeza e resíduos', 'Limpeza e resíduos', RESIDUOS)
      ]},
    {id: 'qualidade', titulo: 'Gestão da qualidade', curto: 'Qualidade', icone: 'shield', itens: [
      item('pgq', 'Programa de Garantia da Qualidade', 'PGQ', QUALIDADE),
      Object.assign(item('produtos', 'Produtos, equipamentos e armazenamento', 'Produtos e equipamentos', PRODUTOS), {
        descricao: 'Liste os testes, reagentes e equipamentos em uso: busque pelo registro na Anvisa ou pelo processo, ou digite os dados. A lista sai em tabela no relatório. Atenção: na pergunta sobre validade expirada, a resposta “Sim” é a irregular.',
        campos: [{id: 'testes_lista', rotulo: 'Testes, reagentes e equipamentos em uso', tipo: 'equipamentos', perfil: 'teste', largo: true,
          tipos: ['Teste rápido', 'Tira reagente', 'Reagente / cartucho', 'Analisador / monitor portátil', 'Equipamento analítico', 'Controle ou calibrador', 'Outro']}]}),
      item('biosseg', 'Biossegurança e imunização', 'Biossegurança', BIOSSEG),
      item('documentos', 'Documentos e registros', 'Documentos', DOCS)
    ]},
    {id: 'pessoal', titulo: 'Pessoal', curto: 'Pessoal', icone: 'people', itens: [
      item('equipe', 'Qualificação, educação permanente e saúde do trabalhador', 'Equipe', PESSOAL)
    ]},
    {id: 'processos', titulo: 'Processos operacionais', curto: 'Processos', icone: 'lab', itens: [
      item('pre', 'Fase pré-analítica', 'Pré-analítica', PRE),
      t !== 1 ? item('transporte', 'Transporte de material biológico', 'Transporte', TRANSP) : null,
      item('analitica', 'Fases analítica e pós-analítica', 'Analítica e laudo', ANALITICA.concat(t === 3 ? AGUA_ATM : [])),
      t === 3 ? item('inhouse', 'Metodologia própria (in house)', 'Metodologia própria', MP) : null
    ].filter(Boolean)},
    {id: 'cq', titulo: 'Controle da qualidade', curto: 'Controle da qualidade', icone: 'check', itens: [
      item('gcq', 'Gestão do controle da qualidade', 'Gestão', CQ.gcq),
      item('ciq', 'Controle interno da qualidade (CIQ)', 'CIQ', CQ.ciq),
      item('ceq', 'Controle externo da qualidade (CEQ)', 'CEQ', CQ.ceq)
    ]}
  );
  const usadas = new Set();
  secoes.forEach(s => s.itens.forEach(i => (i.perguntas || []).forEach(q => (q.inf || []).forEach(f => usadas.add(f)))));
  const infracoes = copia(INFRACOES).filter(i => usadas.has(i.id));
  infracoes.find(i => i.id === 'eac_infra').r.push(...INFRA_REF[t]);
  return {
    app: x.app, titulo: x.titulo, tituloCurto: x.curto, store: 'uvis-' + x.app + '-v1',
    respostas: 'simnao', naSempre: true, estilo: 'pb', ocr: t === 1, relSemNa: true, perfilRotulo: 'Atividades',
    relatorio: {
      titulo: 'RELATÓRIO DE INSPEÇÃO SANITÁRIA', subtitulo: x.sub, objetivo: x.obj,
      conclusao: 'Diante do exposto, o serviço de Exames de Análises Clínicas foi avaliado conforme os itens acima. As irregularidades relacionadas devem ser corrigidas nos prazos fixados pela autoridade sanitária.'
    },
    normas: [
      ['RDC Anvisa nº 978/2025', 'Funcionamento de serviços que executam atividades relacionadas aos Exames de Análises Clínicas (EAC).'],
      t === 1 ? ['RDC Anvisa nº 44/2009', 'Boas práticas farmacêuticas e serviços farmacêuticos em farmácias e drogarias.', {campo: 'tipo_est', em: ['farmacia']}] : null,
      ['RDC Anvisa nº 63/2011', 'Boas Práticas de Funcionamento para os Serviços de Saúde.'],
      ['RDC Anvisa nº 222/2018', 'Gerenciamento dos resíduos de serviços de saúde.'],
      t === 1 ? null : ['RDC Anvisa nº 504/2021', 'Boas práticas para o transporte de material biológico humano.'],
      t === 3 ? ['RDC Anvisa nº 50/2002', 'Planejamento, programação, elaboração e avaliação de projetos físicos de estabelecimentos assistenciais de saúde.'] : null,
      ['Lei Municipal nº 13.478/2002', 'Sistema de Limpeza Urbana do Município de São Paulo (cadastro dos geradores de resíduos de serviços de saúde).'],
      ['Lei Municipal nº 13.725/2004', 'Código Sanitário do Município de São Paulo.']
    ].filter(Boolean),
    secoes, infracoes
  };
}
module.exports = [1, 2, 3].map(monta);
module.exports.monta = monta;
