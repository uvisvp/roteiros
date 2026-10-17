/* Inventário de irregularidades de infraestrutura por ambiente para serviços
   de saúde (vacinação, EAC): mesma ideia do inventário do núcleo de
   medicamentos, com as citações da RDC Anvisa nº 63/2011 (boas práticas de
   funcionamento dos serviços de saúde) e da RDC Anvisa nº 222/2018 (resíduos).
   campo({id, ambientes, inf}) devolve o campo tipo 'ambientes' do motor. */
'use strict';
const R63 = a => 'rdc-63-2011::artigo::' + a;
const LISTA = [
  ['s01', 'Piso, paredes ou teto danificados, com rachaduras, descascamento ou superfície não lavável', [R63(36)]],
  ['s02', 'Infiltração, mofo ou umidade aparente', [R63(36)]],
  ['s03', 'Sujidade, resíduos ou odores incompatíveis com a atividade', [R63(52)]],
  ['s04', 'Desorganização ou materiais alheios à atividade', [R63(36)]],
  ['s05', 'Instalação elétrica, hidráulica ou de gases em mau estado (fios expostos, vazamentos, tomadas soltas)', [R63(35), R63(42)]],
  ['s06', 'Iluminação ou ventilação incompatível com a atividade', [R63(38)]],
  ['s07', 'Mobiliário danificado; estofado com furos, rasgos ou revestimento não lavável', [R63(36), R63(56)]],
  ['s08', 'Falta de sabonete líquido, papel toalha ou preparação alcoólica para a higiene das mãos', [R63(59)]],
  ['s09', 'Animais sinantrópicos ou sinais de sua presença', [R63(63)]],
  ['s10', 'Lixeira sem tampa de abertura sem contato manual ou sem saco de acondicionamento', ['rdc-222-2018::artigo::17']],
  ['s11', 'Equipamento danificado, sem manutenção ou fora de uso guardado no ambiente', [R63(42), R63(54)]]
];
module.exports = {
  LISTA,
  campo: ({id = 'amb_inv', ambientes, inf = []}) => ({id, rotulo: 'Ambientes inspecionados', tipo: 'ambientes', largo: true, inf, r: [R63(36)], ambientes, lista: LISTA})
};
