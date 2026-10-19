/* Transporte de material biológico humano — núcleo Serviços (pedido de 19/10/2026). Inspeciona
   a transportadora: o laboratório remetente segue no roteiro de EAC, que já verifica o envio.
   Base: RDC Anvisa nº 504/2021 (boas práticas para o transporte de material biológico humano;
   o transportador, arts. 31 a 34, e o que vale para todos os envolvidos, art. 2º), RDC Anvisa nº
   34/2014 (sangue e hemocomponentes, arts. 44 e 122), Portaria SMS nº 266/2025, art. 22 (o
   veículo é extensão do estabelecimento e é informado na inspeção) e Lei Municipal nº
   13.725/2004, art. 91 (declaração de cada veículo). A sinalização do veículo, a ficha e o kit
   de emergência e o curso MOPP são do regime da ANTT (Resolução nº 5.998/2022) para a Categoria
   A e ficam no “Para saber mais”, com as fontes. Mesmo motor e regras dos demais roteiros:
   toda irregularidade cita a Lei 13.725 (arts. 46, 50, 90, 91 e 37, I, conforme o assunto). */
'use strict';
const A = (art, ...resto) => 'rdc-504-2021::artigo::' + art + (resto.length ? '::' + resto.join('::') : '');
const I = (art, inc) => A(art, 'inciso', inc);
const P = (art, par) => A(art, 'paragrafo', par);
const S = (art, ...resto) => 'rdc-34-2014::artigo::' + art + (resto.length ? '::' + resto.join('::') : '');
const SMS = (art, ...resto) => 'portaria-sms-sp-266-2025::artigo::' + art + (resto.length ? '::' + resto.join('::') : '');
const LM = (art, ...resto) => 'lei-municipal-13725-2004::artigo::' + art + (resto.length ? '::' + resto.join('::') : '');
const SN = [['sim', 'Sim'], ['nao', 'Não']];
const NAO = campo => ({campo, igual: 'nao'});
const NAO_TRANSP = 'Não havia material em transporte nem preparado para coleta durante a inspeção.';

const DADOS = [
  {id: 'razao', rotulo: 'Razão social'}, {id: 'fantasia', rotulo: 'Nome fantasia'},
  {id: 'cnpj', rotulo: 'CNPJ', tipo: 'cnpj'}, {id: 'endereco', rotulo: 'Endereço da base', largo: true},
  {id: 'licenca', rotulo: 'Licença sanitária (CEVS) nº'}, {id: 'atividade', rotulo: 'Atividade / CNAE na licença', largo: true},
  {id: 'rl', rotulo: 'Responsável legal'}, {id: 'supervisor', rotulo: 'Supervisor técnico (nome e formação)'},
  {id: 'clientes', rotulo: 'Principais remetentes e destinatários atendidos', tipo: 'textarea', largo: true},
  {id: 'acompanhou', rotulo: 'Acompanhou a inspeção'},
  {id: 'data', rotulo: 'Data da inspeção', tipo: 'date'}, {id: 'equipe', rotulo: 'Equipe de inspeção', largo: true}
];
/* perfil: o que a transportadora leva e como; “Não” marca as verificações como “Não se aplica” */
const PERFIL = [
  {id: 'p_material', rotulo: 'Material transportado', tipo: 'checks', opcoes: [['amostras', 'Amostras para diagnóstico'], ['sangue', 'Sangue e hemocomponentes'], ['tecidos', 'Tecidos, células ou órgãos'], ['outro', 'Outro material biológico humano']]},
  {id: 'p_sangue', rotulo: 'Transporta sangue ou hemocomponentes?', tipo: 'select', opcoes: SN, rel: false},
  {id: 'p_catA', rotulo: 'Transporta material da Categoria A (UN 2814)?', tipo: 'select', opcoes: SN, desc: {sim: 'transporte de material da Categoria A (UN 2814)'}},
  {id: 'p_refrig', rotulo: 'Usa gelo seco, nitrogênio líquido ou outro material de conservação que ofereça risco?', tipo: 'select', opcoes: SN, desc: {sim: 'uso de material de conservação perigoso (gelo seco, nitrogênio líquido ou outro)'}},
  {id: 'p_temp', rotulo: 'Algum material exige temperatura controlada no transporte?', tipo: 'select', opcoes: SN, desc: {sim: 'transporte em temperatura controlada'}},
  {id: 'p_terc', rotulo: 'A transportadora presta o serviço para terceiros (remetentes de outras empresas)?', tipo: 'select', opcoes: SN, desc: {sim: 'transporte para terceiros, mediante contrato'}},
  {id: 'p_reuso', rotulo: 'Reutiliza embalagens (caixas térmicas, maletas)?', tipo: 'select', opcoes: SN, desc: {sim: 'reutilização de embalagens'}},
  {id: 'p_veiculos', rotulo: 'Tipos de veículo', tipo: 'checks', opcoes: [['carro', 'Automóvel'], ['furgao', 'Furgão / utilitário'], ['moto', 'Motocicleta'], ['caminhao', 'Caminhão'], ['outro', 'Outro']]}
];

/* ——— perguntas ——— */
const LIC = [
  {id: 'lic', t: 'A transportadora possui licença sanitária vigente que contempla o transporte de material biológico humano?', r: [P(7, '1')],
    c: 'A transportadora possui licença sanitária vigente que contempla o transporte de material biológico humano.',
    nc: 'A transportadora realiza transporte de material biológico humano sem licença sanitária que contemple a atividade.',
    na: 'Trata-se de licença inicial; a licença sanitária ainda não foi emitida.', inf: ['tr_lic']},
  {id: 'supervisor', t: 'Há supervisor técnico capacitado e designado para implantar, executar e monitorar os processos de transporte?', r: [I(3, 'xviii'), P(7, '2')],
    c: 'Há supervisor técnico capacitado e designado para os processos de transporte.',
    nc: 'Não há supervisor técnico capacitado e designado para os processos de transporte.',
    na: 'O serviço ainda não está em funcionamento.', inf: ['tr_supervisor']},
  {id: 'infra', t: 'A transportadora dispõe da infraestrutura necessária ao transporte, compatível com o tipo e a classificação de risco do material?', r: [A(31), P(7, '2')],
    c: 'A transportadora dispõe da infraestrutura necessária ao transporte, compatível com o tipo e a classificação de risco do material.',
    nc: 'A transportadora não dispõe da infraestrutura necessária ao transporte do material biológico que realiza.',
    na: 'O serviço ainda não está em funcionamento.', inf: ['tr_infra']}
];
const VEIC_DECL = [
  {id: 'veic_info', t: 'Foram apresentadas as informações de cada veículo utilizado (declaração individualizada, com equipamentos e pessoal)?', r: [SMS(22, 'paragrafo', '1'), LM(91)],
    c: 'Foram apresentadas as informações de cada veículo utilizado no transporte, com equipamentos e pessoal.',
    nc: 'Não foram apresentadas as informações dos veículos utilizados no transporte.',
    pontos: [['placa', 'placa e tipo de cada veículo', 'Não foram informadas a placa e o tipo de cada veículo.'], ['proprio', 'se o veículo é próprio ou de terceiro', 'Não foi informado se cada veículo é próprio ou de terceiro.'], ['equip', 'equipamentos de cada veículo (fixação, caixas, kit de emergência)', 'Não foram informados os equipamentos de cada veículo.'], ['pessoal', 'motoristas e entregadores de cada veículo', 'Não foram informados os motoristas e entregadores de cada veículo.']],
    na: 'A transportadora não utiliza veículos próprios ou contratados no momento.', inf: ['tr_veic_decl']}
];
const CONTRATO = [
  {id: 'contrato', t: 'Há instrumento escrito (contrato) com cada remetente, definindo as responsabilidades de cada parte no transporte?', r: [A(7), A(26)], naSe: NAO('p_terc'),
    c: 'Há instrumento escrito com os remetentes, definindo as responsabilidades de cada parte no transporte.',
    nc: 'O transporte é feito sem instrumento escrito que defina as responsabilidades de cada parte.', ncPontos: 'O instrumento escrito não define: {}.',
    pontos: [['doc', 'documentação de expedição'], ['bio', 'medidas de biossegurança'], ['conserv', 'condições de conservação e estabilidade do material'], ['instr', 'instruções escritas de cada parte'], ['logistica', 'logística e comunicação entre as partes'], ['trein', 'responsabilidade pelos treinamentos'], ['guarda', 'documentos e registros sob a guarda de cada parte']],
    na: 'A transportadora só transporta material do próprio grupo, sem relação com terceiros.', inf: ['tr_contrato']},
  {id: 'info_remetente', t: 'A transportadora recebeu do remetente as informações técnicas do material (cuidados, risco biológico e conduta em caso de acidente)?', r: [A(29)],
    c: 'A transportadora dispõe das informações técnicas do material fornecidas pelo remetente, inclusive a conduta em caso de acidente.',
    nc: 'A transportadora não dispõe das informações técnicas do material transportado nem da conduta em caso de acidente.',
    na: NAO_TRANSP, inf: ['tr_contrato']}
];
const PROC = [
  {id: 'instrucoes', t: 'As operações de transporte estão padronizadas em instruções escritas, disponíveis ao pessoal e revisadas ao menos anualmente?', r: [A(5), P(5, 'unico')],
    c: 'As operações de transporte estão padronizadas em instruções escritas, disponíveis ao pessoal e revisadas anualmente.',
    nc: 'As operações de transporte não estão padronizadas em instruções escritas atualizadas e disponíveis ao pessoal.',
    pontos: [['existe', 'instruções escritas das operações de transporte', 'Não há instruções escritas das operações de transporte.'], ['disponivel', 'disponíveis a todo o pessoal envolvido', 'As instruções escritas de transporte não estão disponíveis a todo o pessoal envolvido.'], ['revisao', 'revisadas anualmente ou quando muda o procedimento', 'As instruções escritas de transporte não foram revisadas no último ano nem após mudança de procedimento.']],
    na: 'O serviço ainda não está em funcionamento.', inf: ['tr_proc']},
  {id: 'nao_conf', t: 'As não conformidades do transporte são investigadas e registradas, com as medidas corretivas e preventivas?', r: [A(6)],
    c: 'As não conformidades do transporte são investigadas e registradas, com as medidas corretivas e preventivas.',
    nc: 'As não conformidades do transporte não são investigadas e registradas.',
    na: 'Não houve não conformidade no transporte desde o início da atividade.', inf: ['tr_proc']},
  {id: 'registros', t: 'A documentação de envio, transporte e recebimento é arquivada por, no mínimo, 5 anos e fica disponível à vigilância sanitária?', r: [A(8), A(42)],
    c: 'A documentação de envio, transporte e recebimento é arquivada por, no mínimo, 5 anos e está disponível à vigilância sanitária.',
    nc: 'A documentação do transporte não é arquivada pelo prazo mínimo de 5 anos ou não foi disponibilizada à vigilância sanitária.',
    na: 'O serviço ainda não está em funcionamento.', inf: ['tr_registros']}
];
const PESSOAL = [
  {id: 'treinamento', t: 'O pessoal envolvido recebe treinamento específico para a função e o material transportado, com avaliação periódica da efetividade e registro?', r: [A(9), P(9, '1'), P(9, '2')],
    c: 'O pessoal recebe treinamento específico, compatível com a função e o material transportado, com avaliação da efetividade e registro.',
    nc: 'O pessoal não recebe o treinamento exigido para o transporte de material biológico.',
    pontos: [['especifico', 'treinamento específico por função e material', 'O pessoal não recebe treinamento específico para a função e o material transportado.'], ['mudanca', 'retreinamento quando muda o procedimento', 'O pessoal não é treinado novamente quando muda o procedimento.'], ['eficacia', 'avaliação periódica da efetividade', 'A efetividade dos treinamentos não é avaliada.'], ['registro', 'registros dos treinamentos', 'Não há registro dos treinamentos.']],
    na: 'O serviço ainda não está em funcionamento.', inf: ['tr_treinamento']},
  {id: 'trein_emergencia', t: 'Há registro atualizado do treinamento do pessoal para usar os equipamentos de emergência, acidente ou avaria?', r: [A(39)],
    c: 'Há registro atualizado do treinamento do pessoal para emergências, acidentes e avarias.',
    nc: 'Não há registro atualizado do treinamento do pessoal para emergências, acidentes e avarias.',
    na: 'O serviço ainda não está em funcionamento.', inf: ['tr_treinamento']},
  {id: 'epi', t: 'O pessoal dispõe de EPI e EPC compatíveis com o risco do material biológico manipulado?', r: [A(37), A(38)],
    c: 'O pessoal dispõe de EPI e EPC compatíveis com o risco do material biológico.',
    nc: 'O pessoal não dispõe de EPI e EPC compatíveis com o risco do material biológico.',
    na: 'O serviço ainda não está em funcionamento.', inf: ['tr_saude_trab']},
  {id: 'vacina', t: 'O pessoal sob risco de exposição direta ao material é vacinado conforme as normas de saúde do trabalhador?', r: [A(40), P(40, 'unico')],
    c: 'O pessoal sob risco de exposição direta ao material é vacinado conforme as normas de saúde do trabalhador.',
    nc: 'Não foi comprovada a vacinação do pessoal sob risco de exposição direta ao material biológico.',
    na: 'Nenhum profissional da transportadora manipula o conteúdo interno da carga.', inf: ['tr_saude_trab']}
];
const EMBAL = [
  {id: 'embalagem', t: 'O material é transportado em sistema de embalagem adequado à sua classificação (primária, secundária e terciária), preservando a integridade?', r: [A(10), A(12), A(14), A(15), A(16)],
    c: 'O material é transportado em sistema de embalagem adequado à sua classificação, com embalagens primária, secundária e terciária íntegras.',
    nc: 'O material é transportado em sistema de embalagem inadequado à sua classificação.',
    pontos: [['primaria', 'embalagem primária vedada e à prova de vazamento', 'A embalagem primária não tem vedação à prova de vazamento.'], ['absorvente', 'material absorvente entre a primária e a secundária (líquidos)', 'Não há material absorvente entre as embalagens primária e secundária.'], ['secundaria', 'embalagem secundária resistente e à prova de vazamento', 'A embalagem secundária não é resistente e à prova de vazamento.'], ['terciaria', 'embalagem terciária rígida, resistente e com fechamento', 'A embalagem terciária não é rígida e resistente, com fechamento.'], ['exclusiva', 'embalagens de uso exclusivo para transporte', 'As embalagens de transporte são usadas para outras finalidades.']],
    na: NAO_TRANSP, inf: ['tr_embalagem']},
  {id: 'cat_a', t: 'O material da Categoria A segue a instrução de embalagem P620, com a etiqueta de risco biológico na embalagem terciária?', r: [A(13), P(23, '2')], naSe: NAO('p_catA'),
    c: 'O material da Categoria A segue a instrução de embalagem P620 e traz a etiqueta de risco biológico na embalagem terciária.',
    nc: 'O material da Categoria A não segue a instrução de embalagem P620 ou não traz a etiqueta de risco biológico na embalagem terciária.',
    na: 'A transportadora não transporta material da Categoria A.', inf: ['tr_embalagem']},
  {id: 'rotulo', t: 'A embalagem terciária traz, de forma legível e indelével, as informações mínimas exigidas?', r: [A(21), A(22), A(23)],
    c: 'A embalagem terciária traz as informações mínimas exigidas, legíveis e indeléveis.',
    nc: 'A embalagem terciária não traz as informações mínimas exigidas.', ncPontos: 'A embalagem terciária não traz: {}.',
    pontos: [['partes', 'remetente e destinatário, com endereço e telefone'], ['material', 'identificação do material biológico'], ['marca', 'marcação do tipo de material (ex.: UN 3373)'], ['advert', 'frases de advertência e sentido de abertura, quando aplicáveis'], ['tel24', 'telefone disponível 24 horas para acidentes'], ['legivel', 'rótulo legível, firme e sem rasura']],
    na: NAO_TRANSP, inf: ['tr_rotulo']},
  {id: 'refrigerante', t: 'A embalagem e a sinalização com gelo seco, nitrogênio líquido ou outro material de conservação perigoso seguem as normas de transporte de produto perigoso?', r: [A(24)], naSe: NAO('p_refrig'),
    c: 'A embalagem e a sinalização com material de conservação perigoso seguem as normas de transporte de produto perigoso.',
    nc: 'A embalagem com material de conservação perigoso não segue as normas de transporte de produto perigoso.',
    na: 'A transportadora não usa gelo seco, nitrogênio líquido nem outro material de conservação perigoso.', inf: ['tr_rotulo']},
  {id: 'validacao', t: 'O acondicionamento é validado, inclusive a temperatura pelo tempo previsto de transporte com margem de atraso, e a temperatura é monitorada?', r: [A(11), P(11, '1'), P(11, '2')], naSe: NAO('p_temp'),
    c: 'O acondicionamento é validado, inclusive a temperatura pelo tempo previsto de transporte, e a temperatura é monitorada.',
    nc: 'O acondicionamento em temperatura controlada não é validado ou a temperatura não é monitorada.',
    pontos: [['validacao', 'validação do acondicionamento com tempo e margem de atraso', 'O acondicionamento não é validado para o tempo de transporte previsto, com margem de atraso.'], ['revalida', 'revalidação após mudança de embalagem ou processo', 'O acondicionamento não foi reavaliado após mudança de embalagem ou processo.'], ['monitora', 'monitoramento e registro da temperatura', 'A temperatura não é monitorada e registrada durante o transporte.']],
    na: 'Nenhum material exige temperatura controlada.', inf: ['tr_temperatura']},
  {id: 'reuso', t: 'As embalagens reutilizadas são laváveis e passam por limpeza e desinfecção conforme protocolo, com registro?', r: [A(19)], naSe: NAO('p_reuso'),
    c: 'As embalagens reutilizadas são laváveis e passam por limpeza e desinfecção conforme protocolo, com registro.',
    nc: 'As embalagens são reutilizadas sem protocolo e registro de limpeza e desinfecção.',
    na: 'A transportadora não reutiliza embalagens.', inf: ['tr_embalagem']}
];
const SANGUE = [
  {id: 'sangue_temp', t: 'Os hemocomponentes são transportados nas temperaturas exigidas, em processo validado (hemácias e sangue total de 1 a 10 °C; plaquetas de 20 a 24 °C; congelados na temperatura de armazenamento)?', r: [S(44), S(44, 'paragrafo', '1'), S(122, 'paragrafo', '1'), S(122, 'paragrafo', '2'), S(122, 'paragrafo', '3'), S(122, 'paragrafo', '6')], naSe: NAO('p_sangue'),
    c: 'Os hemocomponentes são transportados nas temperaturas exigidas, em processo validado.',
    nc: 'Os hemocomponentes não são transportados nas temperaturas exigidas, em processo validado.',
    na: 'A transportadora não transporta sangue nem hemocomponentes.', inf: ['tr_sangue']},
  {id: 'sangue_caixa', t: 'As caixas térmicas das bolsas são resistentes a impacto e laváveis, e a temperatura é verificada ao menos no envio e no recebimento?', r: [S(44, 'paragrafo', '2')], naSe: NAO('p_sangue'),
    c: 'As caixas térmicas das bolsas são resistentes a impacto e laváveis, e a temperatura é verificada no envio e no recebimento.',
    nc: 'As caixas térmicas das bolsas não atendem às exigências ou a temperatura não é verificada no envio e no recebimento.',
    na: 'A transportadora não transporta sangue nem hemocomponentes.', inf: ['tr_sangue']}
];
const OPER = [
  {id: 'conferencia', t: 'Na coleta, o transportador confere a embalagem e a documentação e avisa o remetente de qualquer não conformidade?', r: [A(33)],
    c: 'Na coleta, o transportador confere a embalagem e a documentação e avisa o remetente das não conformidades.',
    nc: 'O transportador não confere a embalagem e a documentação na coleta.',
    na: NAO_TRANSP, inf: ['tr_operacao']},
  {id: 'doc_bordo', t: 'Durante o transporte, o motorista porta documento que permite a rastreabilidade da carga?', r: [A(32)],
    c: 'Durante o transporte, o motorista porta documento que permite a rastreabilidade da carga.',
    nc: 'O transporte é feito sem documento que permita a rastreabilidade da carga.',
    na: NAO_TRANSP, inf: ['tr_doc_bordo']},
  {id: 'acidente', t: 'Há procedimento para acidente, avaria ou derramamento durante o trânsito (comunicar autoridades, remetente e destinatário, destinar resíduos e registrar)?', r: [A(41)],
    c: 'Há procedimento para acidente, avaria ou derramamento durante o trânsito, com comunicação, destinação dos resíduos e registro.',
    nc: 'Não há procedimento para acidente, avaria ou derramamento durante o trânsito.', ncPontos: 'O procedimento de acidente não prevê: {}.',
    pontos: [['autoridade', 'comunicação às autoridades locais'], ['partes', 'comunicação ao remetente e ao destinatário'], ['residuos', 'destinação dos resíduos e proteção da população e do ambiente'], ['registro', 'registro e arquivo das medidas adotadas']],
    na: 'O serviço ainda não está em funcionamento.', inf: ['tr_acidente']}
];

/* inventário dos veículos: cada veículo e, nele, só o que estiver irregular */
const V34 = [A(34), LM(46)];
const LISTA_VEIC = [
  ['—', 'Veículo'],
  ['v01', 'Veículo sujo', V34], ['v02', 'Compartimento de carga sem mecanismo que assegure a integridade da embalagem terciária', V34],
  ['v03', 'Embalagem terciária solta no compartimento de carga', V34], ['v04', 'Carga junto de objetos alheios ao transporte', V34],
  ['v05', 'Veículo não informado à vigilância sanitária', [SMS(22, 'paragrafo', '1'), LM(91)], ['tr_veic_decl']],
  ['—', 'Documentos e emergência'],
  ['v06', 'Sem documento de rastreabilidade da carga a bordo', [A(32), LM(46)], ['tr_doc_bordo']],
  ['v07', 'Sem equipamentos para emergência, acidente ou avaria', [A(39), A(41), LM(46)], ['tr_acidente']],
  ['v08', 'Sem EPI para o motorista', [A(38), LM(37, 'inciso', 'i')], ['tr_saude_trab']],
  ['—', 'Carga'],
  ['v09', 'Embalagem terciária danificada', [A(10), A(12), LM(46)], ['tr_embalagem']],
  ['v10', 'Embalagem terciária sem identificação', [A(23), LM(46)], ['tr_rotulo']],
  ['v11', 'Caixa térmica sem controle de temperatura', [P(11, '1'), LM(46)], ['tr_temperatura']]
];
const VEICULOS = {id: 'veic_inv', rotulo: 'Veículos', tipo: 'ambientes', termo: 'veículo', exemplo: 'Ex.: furgão placa ABC1D23', possui: 'A transportadora utiliza', largo: true,
  ajuda: 'Toque em “+ Outro veículo” para cada veículo vistoriado (placa e tipo no nome). Abra cada um e marque só o que estiver irregular. No relatório saem os veículos e as irregularidades encontradas.',
  inf: ['tr_veiculo'], r: V34, ambientes: [], lista: LISTA_VEIC};

const INFRACOES = [
  {id: 'tr_lic', grupo: 'Licenciamento e responsabilidade', texto: 'Transportar material biológico humano sem licença sanitária que contemple a atividade.', r: [LM(90), P(7, '1')]},
  {id: 'tr_supervisor', grupo: 'Licenciamento e responsabilidade', texto: 'Transportar material biológico humano sem supervisor técnico capacitado e designado.', r: [P(7, '2')]},
  {id: 'tr_infra', grupo: 'Licenciamento e responsabilidade', texto: 'Transportar material biológico humano sem a infraestrutura compatível com o tipo e a classificação de risco do material.', r: [A(31)]},
  {id: 'tr_veic_decl', grupo: 'Licenciamento e responsabilidade', texto: 'Deixar de apresentar a declaração individualizada de cada veículo utilizado no transporte, com equipamentos e recursos humanos.', r: [LM(91), SMS(22, 'paragrafo', '1')]},
  {id: 'tr_contrato', grupo: 'Licenciamento e responsabilidade', texto: 'Transportar material biológico humano sem instrumento escrito que defina as responsabilidades das partes e sem as informações técnicas do material.', r: [A(7), A(26), A(29)]},
  {id: 'tr_proc', grupo: 'Procedimentos e registros', texto: 'Deixar de padronizar as operações de transporte em instruções escritas atualizadas e de investigar e registrar as não conformidades.', r: [A(5), A(6)]},
  {id: 'tr_registros', grupo: 'Procedimentos e registros', texto: 'Deixar de arquivar a documentação do transporte pelo prazo mínimo de 5 anos e de disponibilizá-la à vigilância sanitária.', r: [A(8), A(42)]},
  {id: 'tr_treinamento', grupo: 'Pessoal', texto: 'Deixar de treinar o pessoal envolvido no transporte, inclusive para emergências, e de manter os registros dos treinamentos.', r: [A(9), A(39)]},
  {id: 'tr_saude_trab', grupo: 'Pessoal', texto: 'Deixar de prover EPI e EPC e de garantir a vacinação do pessoal exposto ao material biológico.', r: [LM(37, 'inciso', 'i'), A(38), A(40)]},
  {id: 'tr_embalagem', grupo: 'Embalagem e rotulagem', texto: 'Transportar material biológico humano em sistema de embalagem inadequado à sua classificação de risco.', r: [A(10), A(12), A(13), A(14), A(15), A(19)]},
  {id: 'tr_rotulo', grupo: 'Embalagem e rotulagem', texto: 'Transportar material biológico humano em embalagem terciária sem as informações e a sinalização exigidas.', r: [A(21), A(22), A(23), A(24)]},
  {id: 'tr_temperatura', grupo: 'Embalagem e rotulagem', texto: 'Transportar material biológico humano que exige temperatura controlada sem acondicionamento validado e sem monitoramento da temperatura.', r: [A(11)]},
  {id: 'tr_sangue', grupo: 'Embalagem e rotulagem', texto: 'Transportar sangue e hemocomponentes fora das temperaturas exigidas ou sem processo de transporte validado.', r: [S(44), S(122)]},
  {id: 'tr_veiculo', grupo: 'Veículos e operação', texto: 'Transportar material biológico humano em veículo sem condições de higiene e limpeza e sem mecanismo que assegure a integridade da embalagem terciária.', r: [A(34)]},
  {id: 'tr_doc_bordo', grupo: 'Veículos e operação', texto: 'Transportar material biológico humano sem documento que permita a rastreabilidade da carga.', r: [A(32)]},
  {id: 'tr_operacao', grupo: 'Veículos e operação', texto: 'Deixar de conferir a embalagem e a documentação no recebimento do material para transporte.', r: [A(33)]},
  {id: 'tr_acidente', grupo: 'Veículos e operação', texto: 'Deixar de adotar procedimento e meios para acidente, avaria ou derramamento durante o transporte.', r: [A(41)]}
];
/* Lei 13.725/2004: 46 (boas práticas e padrões de qualidade e segurança), 50 (condições de
   funcionamento pelas normas específicas), 90 (licença), 91 (declaração dos veículos) e 37, I
   (saúde do trabalhador). Só até o art. 109. */
const LEI = {
  tr_lic: [LM(90)], tr_supervisor: [LM(50)], tr_infra: [LM(50)], tr_veic_decl: [LM(91)], tr_contrato: [LM(50)],
  tr_proc: [LM(46)], tr_registros: [LM(46)], tr_treinamento: [LM(50)], tr_saude_trab: [LM(37, 'inciso', 'i'), LM(50)],
  tr_embalagem: [LM(46)], tr_rotulo: [LM(46)], tr_temperatura: [LM(46)], tr_sangue: [LM(46)], tr_veiculo: [LM(46)],
  tr_doc_bordo: [LM(46)], tr_operacao: [LM(46)], tr_acidente: [LM(46)]
};
function lei13725(secoes, infracoes) {
  const eLei = r => /^lei-municipal-13725-2004::/.test(r), uniq = l => l.filter((x, k) => l.indexOf(x) === k);
  const final = {};
  infracoes.forEach(i => { final[i.id] = uniq(i.r.filter(eLei).concat(LEI[i.id] || [LM(50)])); i.r = i.r.filter(r => !eLei(r)).concat(final[i.id]); });
  secoes.forEach(s => s.itens.forEach(it => (it.perguntas || []).forEach(q => {
    const l = uniq([].concat(...(q.inf || []).map(f => final[f] || [])));
    q.r = uniq(q.r.filter(r => !eLei(r) || (q.inf || []).some(f => (final[f] || []).includes(r))).concat(l.length ? l : [LM(50)]));
  })));
}

/* “Para saber mais”: cada linha com a sua fonte */
const ANTT = 'Resolução ANTT nº 5.998/2022 (Regulamento para o Transporte Rodoviário de Produtos Perigosos) e Instruções Complementares';
const MAIS = {
  veiculos: [
    {t: 'O veículo não tem licença própria: é extensão do estabelecimento, e as informações de cada veículo são apresentadas no ato da inspeção. O Código Sanitário exige a declaração individualizada de cada veículo, com equipamentos e recursos humanos.', f: 'Portaria SMS nº 266/2025, art. 22, § 1º; Lei Municipal nº 13.725/2004, art. 91'},
    {t: 'Categoria B (UN 3373) dispensa sinalização do veículo: a substância embalada e marcada conforme a instrução P650 não está sujeita a nenhuma outra exigência do regulamento de produtos perigosos (Provisão Especial 319) e pode seguir em qualquer veículo. Não se exige rótulo de risco nem painel laranja no veículo.', f: ANTT + ', Provisão Especial 319; ANTT, Manual de Procedimentos de Fiscalização do Transporte Rodoviário de Produtos Perigosos, item 3.8.7'},
    {t: 'Categoria A (UN 2814) segue o regime completo de produto perigoso da subclasse 6.2: rótulo de risco e painel de segurança no veículo, documentação e ficha de emergência, equipamentos de emergência e condutor com curso para transporte de produtos perigosos (MOPP).', f: ANTT + '; Fiocruz, Manual de Transporte de Material Biológico (2023), item 3.5'}
  ],
  embalagem: [
    {t: 'Instrução P650 (Categoria B): três componentes (recipiente primário, embalagem secundária e embalagem externa), com a secundária ou a externa rígida; ao menos uma face externa de 100 × 100 mm; marca UN 3373 em losango de lado mínimo de 50 mm, com o nome “SUBSTÂNCIA BIOLÓGICA, CATEGORIA B” ao lado. Não exige embalagem homologada.', f: ANTT + ', Parte 4 (P650); RDC Anvisa nº 504/2021, art. 14'},
    {t: 'Classificação do material: Categoria A, Categoria B, espécime humana de risco mínimo ou isento, por julgamento profissional segundo o diagrama da OMS. A classificação é do remetente; o transportador confere a embalagem e a marcação na coleta.', f: 'RDC Anvisa nº 504/2021, arts. 3º, 17 e 33; OMS, Guidance on regulations for the transport of infectious substances 2025–2026'},
    {t: 'Sangue para transfusão, células, tecidos e órgãos para transplante e material sabidamente isento usam, no mínimo, as embalagens do art. 15 (primária vedada, secundária à prova de vazamento e terciária rígida), sem prejuízo das normas próprias de cada material.', f: 'RDC Anvisa nº 504/2021, arts. 15 e 16'},
    {t: 'Gelo seco (UN 1845) é produto perigoso: a embalagem deve permitir a saída do gás carbônico (não pode ser hermética) e leva marcação própria, com a quantidade de gelo seco.', f: 'RDC Anvisa nº 504/2021, art. 24; ' + ANTT + '; Fiocruz, Manual de Transporte de Material Biológico (2023), item 3.5'}
  ],
  sangue: [
    {t: 'Temperaturas de transporte: sangue total e concentrado de hemácias de 1 a 10 °C; concentrado de plaquetas de 20 a 24 °C; hemocomponente congelado na temperatura de armazenamento. Peça a validação (tempo, carga máxima de bolsas por caixa) e os registros de temperatura no envio e no recebimento.', f: 'RDC Anvisa nº 34/2014, arts. 44 e 122; Anvisa, Manual de Vigilância Sanitária para o Transporte de Sangue e Componentes no Âmbito da Hemoterapia (2ª ed., 2016)'}
  ]
};

/* orientação técnica dos demais itens: o que pedir e conferir, com o dispositivo */
const R504 = 'RDC Anvisa nº 504/2021';
const ORIENT = {
  lic: [
    {t: 'O que pedir: a licença sanitária com a atividade de transporte de material biológico humano e o nome do supervisor técnico, com a comprovação da capacitação. Confira se a frota e a base informadas correspondem ao que está licenciado.', f: R504 + ', arts. 3º, XVIII, 7º, §§ 1º e 2º, e 31; Portaria SMS nº 266/2025, art. 22'}
  ],
  contrato: [
    {t: 'O que pedir: o contrato com cada remetente (laboratório, hospital, banco de sangue). Ele deve dizer quem cuida da documentação de expedição, da biossegurança, da conservação do material, das instruções escritas, da logística, dos treinamentos e da guarda de cada documento.', f: R504 + ', arts. 7º, 8º, parágrafo único, 9º, § 1º, e 26'},
    {t: 'O remetente classifica e embala o material; a transportadora recebe dele as informações técnicas e a conduta em caso de acidente. Sem essas informações a equipe não sabe o que fazer num derramamento.', f: R504 + ', arts. 28 e 29'}
  ],
  proc: [
    {t: 'O que pedir: as instruções escritas (coleta, acondicionamento no veículo, trânsito, entrega, limpeza do veículo e das caixas, acidente), com data de revisão no último ano; o registro de não conformidades com a ação tomada; e os registros de transporte de 5 anos (amostra de alguns meses).', f: R504 + ', arts. 5º, 6º, 8º e 42'}
  ],
  pessoal: [
    {t: 'O que pedir: a lista de motoristas e entregadores, os registros de treinamento de cada um (conteúdo, data, avaliação) e o treinamento para emergência e uso do kit. Para quem pode ter contato com o conteúdo da carga, a comprovação de vacinação (hepatite B, tétano e difteria são as vacinas que a NR-32 prevê para os serviços de saúde, além das do PCMSO).', f: R504 + ', arts. 9º, 38, 39 e 40; NR-32 (segurança e saúde no trabalho em serviços de saúde), item 32.2.4.17'}
  ],
  operacao: [
    {t: 'O que verificar no veículo em operação: o documento de rastreabilidade da carga (remetente, destinatário, quantidade, horários), a conferência na coleta e o kit para derramamento (luvas, material absorvente, saco para resíduo infectante, desinfetante).', f: R504 + ', arts. 32, 33, 39 e 41; Fiocruz, Manual de Transporte de Material Biológico (2023)'}
  ]
};
const secoes = [
  {id: 'ident', titulo: 'Identificação e perfil', curto: 'Identificação', icone: 'building',
    descricao: 'Dados da transportadora e o que ela transporta. O perfil marca “Não se aplica” no que não existir.',
    itens: [
      {id: 'dados', titulo: 'Dados da transportadora e da inspeção', curto: 'Dados', campos: DADOS},
      {id: 'perfil', titulo: 'Perfil do transporte', curto: 'Perfil', campos: PERFIL}
    ]},
  {id: 'licenc', titulo: 'Licenciamento e responsabilidades', curto: 'Licenciamento', icone: 'folder', itens: [
    {id: 'lic', titulo: 'Licença, supervisão e infraestrutura', curto: 'Licença', perguntas: LIC, orient: ORIENT.lic},
    {id: 'contrato', titulo: 'Contrato com os remetentes', curto: 'Contrato', perguntas: CONTRATO, orient: ORIENT.contrato}
  ]},
  {id: 'docs', titulo: 'Procedimentos e pessoal', curto: 'Procedimentos', icone: 'shield', itens: [
    {id: 'proc', titulo: 'Instruções escritas e registros', curto: 'Procedimentos', perguntas: PROC, orient: ORIENT.proc},
    {id: 'pessoal', titulo: 'Treinamento e saúde do trabalhador', curto: 'Pessoal', perguntas: PESSOAL, orient: ORIENT.pessoal}
  ]},
  {id: 'carga', titulo: 'Embalagem, rotulagem e temperatura', curto: 'Embalagem', icone: 'check',
    descricao: 'Verifique as cargas em trânsito ou prontas para coleta.', itens: [
      {id: 'embalagem', titulo: 'Embalagem e rotulagem', curto: 'Embalagem', perguntas: EMBAL, orient: MAIS.embalagem},
      {id: 'sangue', titulo: 'Sangue e hemocomponentes', curto: 'Sangue', perguntas: SANGUE, orient: MAIS.sangue}
    ]},
  {id: 'veiculos', titulo: 'Veículos e operação', curto: 'Veículos', icone: 'plan', itens: [
    {id: 'frota', titulo: 'Declaração e vistoria dos veículos', curto: 'Veículos', perguntas: VEIC_DECL, campos: [VEICULOS], orient: MAIS.veiculos},
    {id: 'operacao', titulo: 'Coleta, trânsito e acidentes', curto: 'Operação', perguntas: OPER, orient: ORIENT.operacao}
  ]}
];
lei13725(secoes, INFRACOES);

module.exports = {
  app: 'transporte-biologico', titulo: 'Transporte de material biológico', tituloCurto: 'Transporte_Material_Biologico', store: 'uvis-transporte-biologico-v1',
  respostas: 'simnao', naSempre: true, estilo: 'pb', relSemNa: true, perfilRotulo: 'Atividades',
  /* irregularidade sem artigo próprio da Lei 13.725/2004 (ex.: “outra” no inventário de veículos): art. 46 */
  leiBase: [LM(46)],
  relatorio: {
    titulo: 'RELATÓRIO DE INSPEÇÃO SANITÁRIA', subtitulo: 'Transporte de material biológico humano (RDC Anvisa nº 504/2021)',
    objetivo: 'Verificar as condições sanitárias do transporte de material biológico humano realizado pela transportadora, nos termos da RDC Anvisa nº 504/2021, da RDC Anvisa nº 34/2014 (sangue e hemocomponentes), da Portaria SMS nº 266/2025 e da Lei Municipal nº 13.725/2004.',
    conclusao: 'Diante do exposto, o transporte de material biológico humano foi avaliado conforme os itens acima. As irregularidades relacionadas devem ser corrigidas nos prazos fixados pela autoridade sanitária.'
  },
  normas: [
    ['RDC Anvisa nº 504/2021', 'Boas práticas para o transporte de material biológico humano.'],
    ['RDC Anvisa nº 34/2014', 'Boas práticas no ciclo do sangue (transporte de sangue e hemocomponentes).', {campo: 'p_sangue', igual: 'sim'}],
    ['Portaria SMS nº 266/2025', 'Licenciamento sanitário no Município de São Paulo (veículos como extensão do estabelecimento).'],
    ['Lei Municipal nº 13.725/2004', 'Código Sanitário do Município de São Paulo.']
  ],
  secoes, infracoes: INFRACOES
};
