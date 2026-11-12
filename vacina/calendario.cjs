/* Calendários de vacinação para consulta no roteiro de vacinação (item
   “Calendários de vacinação”; não entra no relatório).
   SUS: Instrução Normativa do Calendário Nacional de Vacinação – Ano 2026
   (Ministério da Saúde, DPNI; publicada em 06/07/2026, atualizada em 09/10/2026):
   21 vacinas; VPC 20 no lugar da VPC 10 (2ª dose ainda VPC 10 na transição),
   VSR na gestante, varicela monovalente no lugar da tetraviral, VIP com dois
   reforços, COVID-19 com 3 doses (6, 7 e 9 meses), dT aos 14 anos. Rede privada: calendários da
   Sociedade Brasileira de Imunizações (SBIm) 2025/2026, que o serviço privado
   costuma seguir. Os dois mudam por nota técnica ou nova edição: a nota do item
   manda conferir a versão vigente antes de usar como referência na inspeção. */
'use strict';
module.exports = {
 id: 'calendario', titulo: 'Calendários de vacinação (consulta)', curto: 'Calendários',
 descricao: 'Consulta rápida; não entra no relatório.',
 consulta: {
  nota: 'Esquemas de rotina para consulta durante a inspeção. O calendário muda por nota técnica do Ministério da Saúde e por nova edição da SBIm: confira a versão vigente (gov.br/saude e sbim.org.br) antes de citar em relatório. Grupos especiais (imunodeprimidos, CRIE) têm esquemas próprios.',
  blocos: [
   {h: 'SUS — Gestante', head: ['Período', 'Vacina', 'Dose'], rows: [
    ['A partir da 20ª semana', 'dTpa', '1 dose a cada gestação'],
    ['A partir da 28ª semana', 'Vírus sincicial respiratório (VSR A e B, recombinante)', 'Dose única a cada gestação'],
    ['Qualquer idade gestacional', 'Influenza trivalente', '1 dose por temporada (se não vacinada, no pós-parto até 45 dias)'],
    ['Qualquer idade gestacional', 'COVID-19', '1 dose a cada gestação'],
    ['Conforme a situação vacinal', 'Hepatite B e dT', 'Iniciar ou completar o esquema']
   ]},
   {h: 'SUS — Criança', head: ['Idade', 'Vacina', 'Dose'], rows: [
    ['Ao nascer', 'BCG', 'Dose única, ainda na maternidade'],
    ['Ao nascer', 'Hepatite B', 'Na sala de parto ou nas primeiras 12 horas (aplicável até 1 mês de vida)'],
    ['2 meses', 'Penta (DTP + Hib + hepatite B)', '1ª dose'],
    ['2 meses', 'Poliomielite inativada (VIP)', '1ª dose'],
    ['2 meses', 'Pneumocócica 20-valente (VPC 20)', '1ª dose'],
    ['2 meses', 'Rotavírus humano', '1ª dose (de 1 mês e 15 dias até 11 meses e 29 dias)'],
    ['3 meses', 'Meningocócica C', '1ª dose'],
    ['4 meses', 'Penta', '2ª dose'],
    ['4 meses', 'VIP', '2ª dose'],
    ['4 meses', 'Pneumocócica 10-valente (VPC 10)', '2ª dose (fase de transição para a VPC 20)'],
    ['4 meses', 'Rotavírus humano', '2ª dose (de 3 meses e 15 dias até 23 meses e 29 dias)'],
    ['5 meses', 'Meningocócica C', '2ª dose'],
    ['6 meses', 'Penta', '3ª dose'],
    ['6 meses', 'VIP', '3ª dose'],
    ['6, 7 e 9 meses', 'COVID-19 (RNAm, Pfizer/Comirnaty)', '3 doses (esquema básico até 4 anos, 11 meses e 29 dias)'],
    ['6 meses a 5 anos, 11 meses e 29 dias', 'Influenza trivalente', 'Anual (2 doses com 30 dias de intervalo na primeira vez)'],
    ['9 meses', 'Febre amarela', '1ª dose'],
    ['12 meses', 'Tríplice viral (sarampo, caxumba, rubéola)', '1ª dose'],
    ['12 meses', 'Pneumocócica 20-valente (VPC 20)', 'Reforço'],
    ['12 meses', 'Meningocócica ACWY', 'Reforço'],
    ['15 meses', 'DTP', '1º reforço'],
    ['15 meses', 'VIP', '1º reforço'],
    ['15 meses', 'Hepatite A', 'Dose única'],
    ['15 meses', 'Tríplice viral', '2ª dose (no mesmo dia da varicela, em locais diferentes)'],
    ['15 meses', 'Varicela', '1ª dose'],
    ['4 anos', 'DTP', '2º reforço'],
    ['4 anos', 'VIP', '2º reforço'],
    ['4 anos', 'Febre amarela', 'Reforço'],
    ['4 anos', 'Varicela', '2ª dose']
   ]},
   {h: 'SUS — Adolescente', head: ['Idade', 'Vacina', 'Dose'], rows: [
    ['9 anos (até 14 anos, 11 meses e 29 dias)', 'HPV quadrivalente', 'Dose única, meninas e meninos (resgate de 15 a 19 anos conforme o estado)'],
    ['10 anos (até 14 anos, 11 meses e 29 dias)', 'Dengue (atenuada)', '2 doses, intervalo de 3 meses'],
    ['11 anos', 'Meningocócica ACWY', 'Dose ou reforço, conforme a situação vacinal'],
    ['14 anos', 'dT', 'Reforço (10 anos após a DTP dos 4 anos); depois a cada 10 anos'],
    ['Conforme a situação vacinal', 'Hepatite B, febre amarela e tríplice viral', 'Iniciar ou completar o esquema']
   ]},
   {h: 'SUS — Adulto e idoso', head: ['Grupo', 'Vacina', 'Dose'], rows: [
    ['Toda a população', 'Hepatite B', '3 doses, se não vacinado'],
    ['A partir de 7 anos', 'dT', '3 doses, se não vacinado; reforço a cada 10 anos (5 anos em exposição de risco)'],
    ['Até 59 anos', 'Febre amarela', 'Dose única, se não vacinado (com 1 dose antes dos 5 anos, 1 reforço)'],
    ['12 meses a 29 anos', 'Tríplice viral', '2 doses, se sem esquema completo'],
    ['30 a 59 anos', 'Tríplice viral', '1 dose, se sem esquema completo'],
    ['Profissional de saúde', 'dTpa', '1 dose; dTpa também nos reforços periódicos'],
    ['60 anos ou mais', 'Influenza trivalente', '1 dose anual'],
    ['60 anos ou mais', 'COVID-19', '1 dose a cada 6 meses'],
    ['60 a 84 anos acamados ou institucionalizados; todos a partir de 85 anos não vacinados', 'Pneumocócica 20-valente (VPC 20)', 'Dose única']
   ]},
   {h: 'Rede privada — Criança (referência: calendário SBIm)', p: 'Vacinas e doses a mais que o serviço privado costuma oferecer além do SUS; esquema pode variar com o produto.', head: ['Idade', 'Vacina', 'Dose'], rows: [
    ['2, 4 e 6 meses', 'Hexavalente acelular (DTPa + Hib + VIP + hepatite B)', '3 doses; reforços aos 15-18 meses e 4-5 anos (DTPa/VIP)'],
    ['2, 4 e 6 meses', 'Pneumocócica conjugada de maior valência (15 ou 20-valente)', '3 doses; reforço aos 12-15 meses'],
    ['2 e 4 meses (ou 2, 4 e 6)', 'Rotavírus (monovalente 2 doses ou pentavalente 3 doses)', 'Conforme o produto'],
    ['3 e 5 meses', 'Meningocócica ACWY', '2 doses; reforços aos 12-15 meses, 5-6 anos e 11 anos'],
    ['3 e 5 meses', 'Meningocócica B', '2 doses; reforço aos 12-15 meses'],
    ['A partir de 6 meses', 'Influenza (tri ou quadrivalente)', 'Anual (2 doses na primeira vez até 8 anos)'],
    ['12 e 18 meses', 'Hepatite A', '2 doses'],
    ['12 e 15 meses', 'Tríplice viral e varicela (ou tetraviral)', '2 doses de cada'],
    ['9 meses e 4 anos', 'Febre amarela', '2 doses'],
    ['A partir de 4 anos', 'Dengue (atenuada)', '2 doses, intervalo de 3 meses (até 60 anos)'],
    ['9 a 14 anos', 'HPV nonavalente (ou quadrivalente)', '2 doses (0 e 6 meses)']
   ]},
   {h: 'Rede privada — Adulto e idoso (referência: calendário SBIm)', head: ['Grupo', 'Vacina', 'Dose'], rows: [
    ['Adulto', 'dTpa', 'Reforço a cada 10 anos (substitui a dT)'],
    ['Adulto', 'Hepatite A e B (ou combinada)', 'Esquema completo, se não vacinado'],
    ['15 a 45 anos', 'HPV nonavalente', '3 doses (0, 1-2 e 6 meses)'],
    ['A partir de 50 anos', 'Herpes-zóster recombinante', '2 doses, intervalo de 2 a 6 meses'],
    ['60 anos ou mais', 'Pneumocócica conjugada (20-valente, ou 15-valente seguida da 23-valente)', 'Conforme o produto'],
    ['60 anos ou mais', 'Influenza (preferência pela de alta dose)', 'Anual'],
    ['60 anos ou mais', 'Vírus sincicial respiratório (VSR)', 'Dose única'],
    ['Gestante', 'dTpa, influenza, hepatite B, COVID-19 e VSR', 'Conforme calendário SBIm da gestante e bula']
   ]}
  ],
  fonte: 'Ministério da Saúde — Instrução Normativa do Calendário Nacional de Vacinação, Ano 2026 (DPNI/SVSA, atualizada em 09/10/2026), https://www.gov.br/saude/pt-br/vacinacao; Sociedade Brasileira de Imunizações — Calendários de vacinação SBIm 2025/2026.'
 }
};
