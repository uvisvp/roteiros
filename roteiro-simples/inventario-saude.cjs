/* Ambientes e irregularidades por ambiente para serviços de saúde (vacinação,
   EAC): mesma ideia do inventário do núcleo de medicamentos, com as citações da
   RDC Anvisa nº 63/2011 (boas práticas de funcionamento dos serviços de saúde),
   da RDC Anvisa nº 222/2018 (resíduos) e da Lei Municipal nº 13.725/2004 (arts.
   19, § 2º, 61, 62, 65 e 66, conforme o assunto). Cada irregularidade é um
   problema só, sem “ou” (pedido de 17/10/2026); ['—', título] abre um grupo.
   campo({id, ambientes, inf}) devolve o campo tipo 'ambientes' do motor. */
'use strict';
const R63 = a => 'rdc-63-2011::artigo::' + a;
const LM = (a, ...r) => 'lei-municipal-13725-2004::artigo::' + a + (r.length ? '::' + r.join('::') : '');
const EST = [R63(36), LM(65)], LIMPO = [R63(52), LM(61)], MAOS = [R63(59), LM(61)], SIN = [R63(63), LM(19, 'paragrafo', '2'), LM(61)];
const LIX = ['rdc-222-2018::artigo::17', LM(62)], EQ = [R63(42), R63(54), LM(66)];
const LISTA = [
  ['—', 'Estrutura'],
  ['s01', 'Piso danificado', EST], ['s12', 'Paredes danificadas', EST], ['s13', 'Teto danificado', EST], ['s14', 'Superfície não lavável', EST],
  ['s02', 'Infiltração', EST], ['s15', 'Mofo', EST],
  ['—', 'Limpeza e organização'],
  ['s03', 'Ambiente sujo', LIMPO], ['s16', 'Resíduos acumulados no ambiente', LIMPO], ['s17', 'Odor incompatível com a atividade', LIMPO],
  ['s04', 'Ambiente desorganizado', EST], ['s18', 'Materiais alheios à atividade', EST],
  ['—', 'Instalações'],
  ['s05', 'Fios expostos', [R63(35), R63(42), LM(65)]], ['s19', 'Tomadas soltas', [R63(35), R63(42), LM(65)]],
  ['s20', 'Vazamento na instalação hidráulica', [R63(35), R63(42), LM(65)]], ['s21', 'Instalação de gases em mau estado', [R63(35), R63(42), LM(65)]],
  ['s06', 'Iluminação incompatível com a atividade', [R63(38), LM(65)]], ['s22', 'Ventilação incompatível com a atividade', [R63(38), LM(65)]],
  ['s07', 'Mobiliário danificado', [R63(36), R63(56), LM(65)]], ['s23', 'Estofado com furos', [R63(36), R63(56), LM(65)]],
  ['s24', 'Estofado com rasgos', [R63(36), R63(56), LM(65)]], ['s25', 'Revestimento do mobiliário não lavável', [R63(36), R63(56), LM(65)]],
  ['—', 'Higiene das mãos'],
  ['s08', 'Pia sem sabonete líquido', MAOS], ['s26', 'Pia sem papel toalha', MAOS], ['s27', 'Sem preparação alcoólica para as mãos', MAOS],
  ['—', 'Pragas, resíduos e equipamentos'],
  ['s09', 'Presença de animais sinantrópicos', SIN], ['s28', 'Sinais de animais sinantrópicos (fezes, roeduras, ninhos)', SIN],
  ['s10', 'Lixeira sem tampa de abertura sem contato manual', LIX], ['s29', 'Lixeira sem saco de acondicionamento', LIX],
  ['s11', 'Equipamento danificado', EQ], ['s30', 'Equipamento sem manutenção', EQ], ['s31', 'Equipamento fora de uso guardado no ambiente', [R63(42), R63(54), LM(66, 'paragrafo', '2')]]
];
module.exports = {
  LISTA,
  campo: ({id = 'amb_inv', ambientes, inf = []}) => ({id, rotulo: 'Ambientes do estabelecimento', tipo: 'ambientes', largo: true, inf, r: [R63(36), LM(65)], ambientes, lista: LISTA})
};
