/* Calendários de vacinação para consulta no roteiro de vacinação (item
   “Calendários de vacinação”; não entra no relatório).
   SUS: Calendário Nacional de Vacinação do Programa Nacional de Imunizações
   (esquemas de rotina em vigor em 2025). Rede privada: calendários da
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
   {h: 'SUS — Criança (Calendário Nacional de Vacinação)', head: ['Idade', 'Vacina', 'Dose'], rows: [
    ['Ao nascer', 'BCG', 'Dose única'],
    ['Ao nascer', 'Hepatite B', 'Dose ao nascer (preferencialmente nas primeiras 24 horas)'],
    ['2 meses', 'Penta (DTP + Hib + hepatite B)', '1ª dose'],
    ['2 meses', 'Poliomielite inativada (VIP)', '1ª dose'],
    ['2 meses', 'Pneumocócica 10-valente', '1ª dose'],
    ['2 meses', 'Rotavírus humano', '1ª dose (até 3 meses e 15 dias)'],
    ['3 meses', 'Meningocócica C', '1ª dose'],
    ['4 meses', 'Penta', '2ª dose'],
    ['4 meses', 'VIP', '2ª dose'],
    ['4 meses', 'Pneumocócica 10-valente', '2ª dose'],
    ['4 meses', 'Rotavírus humano', '2ª dose (até 7 meses e 29 dias)'],
    ['5 meses', 'Meningocócica C', '2ª dose'],
    ['6 meses', 'Penta', '3ª dose'],
    ['6 meses', 'VIP', '3ª dose'],
    ['6 meses a menores de 5 anos', 'COVID-19', 'Esquema primário (número de doses conforme o imunizante)'],
    ['6 meses a menores de 6 anos', 'Influenza', 'Anual (2 doses na primeira vez, com 30 dias de intervalo)'],
    ['9 meses', 'Febre amarela', '1ª dose'],
    ['12 meses', 'Tríplice viral (sarampo, caxumba, rubéola)', '1ª dose'],
    ['12 meses', 'Pneumocócica 10-valente', 'Reforço'],
    ['12 meses', 'Meningocócica (C ou ACWY, conforme o calendário vigente)', 'Reforço'],
    ['15 meses', 'DTP', '1º reforço'],
    ['15 meses', 'VIP', 'Reforço (substituiu a VOP a partir de 2024)'],
    ['15 meses', 'Hepatite A', 'Dose única'],
    ['15 meses', 'Tetraviral (sarampo, caxumba, rubéola, varicela)', 'Dose única (2ª dose de tríplice viral + 1ª de varicela)'],
    ['4 anos', 'DTP', '2º reforço'],
    ['4 anos', 'Febre amarela', 'Reforço'],
    ['4 anos', 'Varicela', '2ª dose']
   ]},
   {h: 'SUS — Adolescente (10 a 19 anos)', head: ['Idade', 'Vacina', 'Dose'], rows: [
    ['9 a 14 anos', 'HPV quadrivalente', 'Dose única (desde 2024)'],
    ['10 a 14 anos (municípios selecionados)', 'Dengue (atenuada)', '2 doses, intervalo de 3 meses'],
    ['11 a 14 anos', 'Meningocócica ACWY', 'Dose única'],
    ['10 a 19 anos', 'Hepatite B', '3 doses, se não vacinado'],
    ['10 a 19 anos', 'Difteria e tétano (dT)', 'Completar esquema; reforço a cada 10 anos'],
    ['10 a 19 anos', 'Febre amarela', 'Dose única, se não vacinado'],
    ['10 a 19 anos', 'Tríplice viral', '2 doses, se não vacinado']
   ]},
   {h: 'SUS — Adulto, gestante e idoso', head: ['Grupo', 'Vacina', 'Dose'], rows: [
    ['20 a 59 anos', 'Hepatite B', '3 doses, se não vacinado'],
    ['20 a 59 anos', 'dT', '3 doses, se não vacinado; reforço a cada 10 anos'],
    ['20 a 59 anos', 'Febre amarela', 'Dose única, se não vacinado'],
    ['20 a 29 anos', 'Tríplice viral', '2 doses, se não vacinado'],
    ['30 a 59 anos', 'Tríplice viral', '1 dose, se não vacinado'],
    ['Gestante', 'dTpa', '1 dose a cada gestação, a partir da 20ª semana'],
    ['Gestante', 'Hepatite B e dT', 'Completar esquema conforme a situação vacinal'],
    ['Gestante', 'Influenza', 'Dose na campanha anual'],
    ['Gestante', 'COVID-19', '1 dose a cada gestação'],
    ['60 anos ou mais', 'Influenza', 'Anual'],
    ['60 anos ou mais', 'COVID-19', 'Dose a cada 6 meses'],
    ['60 anos ou mais', 'dT', 'Reforço a cada 10 anos'],
    ['60 anos ou mais', 'Hepatite B', '3 doses, se não vacinado'],
    ['60 anos ou mais (acamados ou institucionalizados)', 'Pneumocócica 23-valente', '1 dose e reforço após 5 anos']
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
  fonte: 'Ministério da Saúde — Calendário Nacional de Vacinação (Programa Nacional de Imunizações), 2025; Sociedade Brasileira de Imunizações — Calendários de vacinação SBIm 2025/2026.'
 }
};
