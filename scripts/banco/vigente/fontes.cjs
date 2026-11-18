'use strict';
/* Texto atualizado ("norma atualizada") da Legislação Informatizada da Câmara dos Deputados,
   consultado em 17 e 18/11/2026. `arquivo` é o nome do HTML baixado (ver gera-vigente.cjs). */
const C = 'https://www2.camara.leg.br/legin/fed/';
const FONTES = {
  'lei-federal-8069-1990': {arquivo: 'l8069.html', url: C + 'lei/1990/lei-8069-13-julho-1990-372211-normaatualizada-pl.html'},
  'lei-federal-10741-2003': {arquivo: 'l10741.html', url: C + 'lei/2003/lei-10741-1-outubro-2003-497511-normaatualizada-pl.html'},
  'lei-federal-6360-1976': {arquivo: 'l6360.html', url: C + 'lei/1970-1979/lei-6360-23-setembro-1976-357079-normaatualizada-pl.html'},
  'lei-federal-6437-1977': {arquivo: 'l6437.html', url: C + 'lei/1970-1979/lei-6437-20-agosto-1977-357206-normaatualizada-pl.html'},
  'lei-federal-5991-1973': {arquivo: 'l5991.html', url: C + 'lei/1970-1979/lei-5991-17-dezembro-1973-358064-normaatualizada-pl.html'},
  'lei-federal-13146-2015': {arquivo: 'l13146.html', url: C + 'lei/2015/lei-13146-6-julho-2015-781174-normaatualizada-pl.html'},
  'lei-federal-10098-2000': {arquivo: 'l10098.html', url: C + 'lei/2000/lei-10098-19-dezembro-2000-377651-normaatualizada-pl.html'},
  'lei-federal-13021-2014': {arquivo: 'l13021.html', url: C + 'lei/2014/lei-13021-8-agosto-2014-779151-normaatualizada-pl.html'},
  'lei-federal-10216-2001': {arquivo: 'l10216.html', url: C + 'lei/2001/lei-10216-6-abril-2001-364458-normaatualizada-pl.html'},
  'lei-federal-10674-2003': {arquivo: 'l10674.html', url: C + 'lei/2003/lei-10674-16-maio-2003-496699-normaatualizada-pl.html'},
  'decreto-lei-986-1969': {arquivo: 'dl986.html', url: C + 'declei/1960-1969/decreto-lei-986-21-outubro-1969-377556-normaatualizada-pe.html'}
};
module.exports = {FONTES};
