/* Frases descritivas do relatório (pedido de 17/10/2026): transforma o texto
   do requisito e o resultado da verificação numa frase, como nos roteiros do
   site Medicamentos — “Cumpre” vira constatação; “Não cumpre”, a negativa.
   Três formas de requisito nos roteiros:
   - pergunta “Está atendida a exigência de X?” → “Está atendida a exigência
     de X.” / “Não está atendida a exigência de X.”;
   - afirmação com verbo (“A higiene das mãos ocorre…”) → a própria afirmação /
     “Não se constatou que a higiene das mãos ocorre…”;
   - requisito nominal (“Licença sanitária vigente…”) → “Constatou-se licença
     sanitária vigente…” / “Não se constatou licença sanitária vigente…”.
   window.UvsFrase(texto, 'c'|'nc') devolve a frase; UvsFrase.junta(lista) une
   frases num parágrafo. */
(function(){
 if(window.UvsFrase) return;
 var VERBOS = 'é|são|está|estão|há|houve|possui|possuem|tem|têm|ocorre|ocorrem|permite|permitem|segue|seguem|respeita|respeitam|evita|evitam|corresponde|correspondem|permanece|permanecem|consegue|conseguem|confirma|confirmam|atende|atendem|realiza|realizam|mantém|mantêm|dispõe|dispõem|apresenta|apresentam|garante|garantem|assegura|asseguram|existe|existem|foi|foram|fica|ficam|ficou|ocorreu|pode|podem|recebe|recebem|utiliza|utilizam|usa|usam|conhece|conhecem|cumpre|cumprem|exerce|exercem|funciona|funcionam|contém|contêm|prevê|preveem|inclui|incluem|cobre|cobrem|acompanha|acompanham|registra|registram|identifica|identificam|comprova|comprovam|aplica|aplicam|atua|atuam|guardam|executa|executam|oferece|oferecem|faz|fazem|trata|tratam|separa|separam|controla|controlam|monitora|monitoram|verifica|verificam|informa|informam|participa|participam|protege|protegem|impede|impedem|define|definem|descreve|descrevem|contempla|contemplam|abrange|abrangem|dispensam|recolhe|recolhem|armazena|armazenam|mantém-se|encontra-se|encontram-se|atende-se|processa|processam|elabora|elaboram|possibilita|possibilitam|demonstra|demonstram|indica|indicam';
 var VERBO = new RegExp('(^|[\\s,;(])(' + VERBOS + '|[a-zà-ú]{3,}(?:am|em))(?=[\\s,;:.)]|$)', 'i');
 var NAO_VERBO = /^(também|porém|além|alguém|ninguém|item|ordem|origem|homem|nuvem|garagem|vem|bem|sem|nem|quem|trem|refém|contém)$/i;
 function temVerbo(t){
  var re = new RegExp(VERBO.source, 'gi'), m;
  while((m = re.exec(t))){ var w = m[2]; if(new RegExp('^(' + VERBOS + ')$', 'i').test(w)) return true; if(!NAO_VERBO.test(w) && !/(agem|igem|ugem)$/i.test(w)) return true; }
  return false;
 }
 function limpa(t){ return String(t || '').replace(/^\s*\d+[.)]\s*/, '').replace(/\s+/g, ' ').trim(); }
 /* mantém a maiúscula de sigla e de nome próprio (“Responsável Técnico”, “Boas Práticas”, “Plano de Segurança”) */
 function minuscula(t){
  if(/^[A-ZÀ-Ú]{2,}\b/.test(t) || /^[A-Z]\w*\s?\d/.test(t)) return t;
  var w1 = t.split(/\s+/)[1] || '';
  if(!/^(o|a|os|as|um|uma)$/i.test(t.split(/\s+/)[0]) && /^[A-ZÀ-Ú][a-zà-ú]/.test(w1)) return t;
  return t.charAt(0).toLowerCase() + t.slice(1);
 }
 function ponto(t){ return t.replace(/[\s.;:?!]+$/, '') + '.'; }
 /* plural pela primeira palavra (“atestados”, “condições”, “mangueiras”) */
 function plural(t){ var w = (t.match(/^[^\s,;:(]+/) || [''])[0].toLowerCase(); return /(s)$/.test(w) && !/^(lápis|ônibus|vírus|gás|mês|país|análise|tênis|bônus|ônus|atlas|apenas|menos|mais)$/.test(w); }
 /* oração principal: sem condição inicial (“Quando…,”, “Havendo…,”), sem rótulo
    curto (“Dispositivos/IVD:”) e sem orações subordinadas (“que…”, “quando…”) */
 function principal(t){
  var x = t.replace(/^(quando|havendo|se|em caso de|caso|sempre que|nos casos|no caso|em edifício|ao|na|no)\b[^,]{0,120},\s*/i, '');
  x = x.replace(/^[^:;,]{2,30}:\s+/, '');
  return x.split(/\s(?:que|quando|onde|quem|cuj[oa]s?|conforme|a que|para que|desde que)\s|;|:/i)[0];
 }
 function semNao(t){ return t.replace(/(^|\s)n[ãa]o\s+/i, function(m, a){ return a; }).replace(/\snem\s/g, ' ou '); }
 /* o “não” nega a oração principal só quando vem logo antes do primeiro verbo */
 function negativo(p){
  var re = new RegExp(VERBO.source, 'gi'), m;
  while((m = re.exec(p))){ var w = m[2];
   if(new RegExp('^(' + VERBOS + ')$', 'i').test(w) || (!NAO_VERBO.test(w) && !/(agem|igem|ugem)$/i.test(w)))
    return /(^|\s)n[ãa]o\s*$/i.test(p.slice(0, m.index + m[1].length)); }
  return false;
 }
 var COND = /^(quando|havendo|se|em caso de|caso|sempre que|em edifício)\b/i;

 function frase(texto, r){
  var t = limpa(texto); if(!t) return '';
  var nc = r === 'nc' || r === 'nao' || r === 'não';
  var m = /^(?:está|estão) atendid[ao]s? a exigência\s+(?:de|da|do|das|dos)\s+([\s\S]+?)\??$/i.exec(t);
  if(m) return ponto((nc ? 'Não está atendida a exigência de ' : 'Está atendida a exigência de ') + m[1]);
  t = t.replace(/\?$/, '');
  var p = principal(t);
  /* verbo de ligação depois da oração com “que” (“Alterações … que repercutem … foram comunicadas”) */
  if(!temVerbo(p)){ var q = t.split(/\sque\s/i); if(q.length > 1 && /\s(é|são|está|estão|foi|foram)\s/i.test(' ' + q.slice(1).join(' que ') + ' ') && !/^(é|são|está|estão|foi|foram)\s/i.test(q[1])) p = t; }
  if(temVerbo(p)){
   if(!nc) return ponto(t.charAt(0).toUpperCase() + t.slice(1));
   /* requisito negativo (“Não há…”, “… não são reutilizadas”): a negativa tira o “não” */
   if(negativo(p)){ var s2 = semNao(t); return ponto(s2.charAt(0).toUpperCase() + s2.slice(1)); }
   return ponto('Não se constatou que ' + (COND.test(t) ? ', ' : '') + minuscula(t)).replace('que , ', 'que, ');
  }
  var pl = plural(t);
  /* nominal negativo (“processamento não realizado durante…”): a negativa tira o “não” */
  if(nc && /\sn[ãa]o\s+[a-zà-ú]+(ad|id)[ao]s?\b/i.test(t) && !/nenhum/i.test(t)) return ponto((pl ? 'Constataram-se ' : 'Constatou-se ') + minuscula(semNao(t)));
  return ponto((nc ? (pl ? 'Não se constataram ' : 'Não se constatou ') : (pl ? 'Constataram-se ' : 'Constatou-se ')) + minuscula(t));
 }
 frase.junta = function(lista){ return lista.filter(Boolean).join(' '); };
 /* documento apresentado / não apresentado: “O serviço apresentou relação nominal…” */
 frase.doc = function(texto, r, sujeito){
  var t = limpa(texto).replace(/\?$/, ''); if(!t) return '';
  var nc = r === 'nc' || r === 'nao' || r === 'não';
  return ponto((sujeito || 'O serviço') + (nc ? ' não apresentou ' : ' apresentou ') + minuscula(t));
 };
 window.UvsFrase = frase;
})();
/* Lei Municipal nº 13.725/2004 em toda irregularidade (pedido de 17/10/2026), só até o
   art. 109: UvsLei(fundamento, id, grupo, texto) devolve o fundamento com a lei quando ele
   não a cita. O artigo é o do assunto da verificação, no texto, no grupo ou na própria
   citação (Portaria 344, RDC 222…): serviço de saúde — 67 controle especial, 49 rotulagem,
   55 e 56 eventos adversos, 71 notificação compulsória, 92 RT, 90 licença e § 1º
   alterações, 62 resíduos, 19, § 2º, sinantrópicos, 37, I, saúde do trabalhador, 27, I,
   água, 24 edificação, 68 prontuário, 66 manutenção e § 2º equipamento sem condições de
   uso, 64 pessoal, 61 higiene, 65 instalações e materiais, 63 o restante; produtos e
   alimentos — 50, §§ 1º e 2º, controle especial, 50-A expositor refrigerado, 49
   rotulagem, 48 importados, 55 eventos adversos, 93 RT, 90 licença, 91 veículos, 31,
   § 2º, resíduos, 50 instalações e autorizações, 46, § 1º, manual e POPs, 46 o restante.
   O roteiro vem de window.__uvsApp (gravado pela casca); o id da verificação acerta os
   casos em que o texto engana. SAICA e demais acolhimentos: art. 69. */
(function(){
 if(window.UvsLei) return;
 var EQ_SEM_USO = function(t){ return /equipament/i.test(t) && /sem condi[çc][õo]es de uso|fora de uso|em desuso/i.test(t) ? '66, § 2º' : ''; };
 var SAUDE = [
  [/controle especial|psicotr[óo]pic|entorpecente|Portaria SVS\/MS n[º°] 344/i, '67'],
  [/notifica[çc][ãa]o compuls|doen[çc]as? de notifica/i, '71'],
  [/eventos? adversos?|queixas? t[ée]cnicas?|tecnovigil|farmacovigil|Notivisa/i, '55 e 56'],
  [/r[óo]tul|rotulag/i, '49'],
  [/altera[çc][õo]es?.{0,80}comunicad/i, '90, § 1º'],
  [/[Rr]espons[áa]vel [Tt][ée]cnico|[Rr]esponsabilidade [Tt][ée]cnica|\bRT\b/, '92'],
  [/alvar[áa] sanit[áa]rio das empresas|terceirizad/i, '63'],
  [/licen[çc]a sanit|alvar[áa] sanit|CMVS|cadastro municipal de vigil|dispensa de licen/i, '90'],
  [/elevador|plataforma/i, '65'],
  [/manipuladores de alimentos|servi[çc]o de alimenta[çc][ãa]o|boas pr[áa]ticas na manipula/i, '61'],
  [/res[íi]duo|perfurocortante|PGRSS|RDC (?:Anvisa )?n[º°] 222/i, '62'],
  [/sinantr[óo]p|pragas|vetores|desinsetiza|desratiza/i, '19, § 2º'],
  [/\bEPIs?\b|equipamentos? de prote[çc][ãa]o individual|NR-32|sa[úu]de (?:do trabalhador|ocupacional)|\bASOs?\b|PCMSO/i, '37, I'],
  [/reservat[óo]rio de [áa]gua|caixa d.[áa]gua|potabilidade/i, '27, I'],
  [/AVCB|Corpo de Bombeiros|projeto (?:b[áa]sico de )?arquitet|instala[çc][õo]es prediais/i, '24'],
  [/prontu[áa]rio|\bficha\b/i, '68'],
  [EQ_SEM_USO],
  [/manuten[çc][ãa]o (?:preventiva|corretiva)|calibra|Gerenciamento de Tecnologias/i, '66']
 ];
 var SAUDE_GERAL = [
  [/o pessoal exigido|n[úu]mero de cuidadores|recursos humanos|educa[çc][ãa]o permanente|funcion[áa]rios exclusivos/i, '64'],
  [/\bpisos?\b|parede|\bteto|porta|rampa|escada|corrim|circula[çc]|\bsalas?\b|dormit|quarto|sanit[áa]rio|banheiro|chuveiro|lavat[óo]rio|\bpias?\b|vesti[áa]rio|[áa]rea m[íi]nima|acessibilidade a|instala[çc]|infraestr|mobili|cadeiras|poltronas|equipamento|geladeira|cozinha|refeit|despensa/i, '65'],
  [/limpeza|higien|desinfec|esteriliz|processamento|lavanderia|roupa/i, '61'],
  [/profissiona|\bda equipe\b|capacita|treinamento|cuidador|escala|\bpessoal\b/i, '64'],
  [/medicament|insumo|materia(?:l|is) de consumo/i, '65']
 ];
 var PRODUTO = [
  [/controle especial|Portaria SVS\/MS n[º°] 344|psicotr/i, function(t){ return /estoque|escritura|invent[áa]ri|balan[çc]o|registro/i.test(t) ? '50, § 2º' : '50, § 1º'; }],
  [/expositor(?:es)? refrigerad/i, '50-A'],
  [/r[óo]tul|rotulag/i, '46 e 49'],
  [/importad/i, '48'],
  [/eventos? adversos?|queixas? t[ée]cnicas?|tecnovigil|cosmetovigil|farmacovigil/i, '55'],
  [/altera[çc][õo]es?.{0,80}comunicad/i, '90, § 1º'],
  [/respons[áa]vel t[ée]cnico/i, '93'],
  [/licen[çc]a sanit|CMVS/i, '90'],
  [/rela[çc][ãa]o .{0,30}ve[íi]culos|ve[íi]culos? .{0,60}declarad/i, '91'],
  [/res[íi]duo/i, '31, § 2º'],
  [/sinantr[óo]p|pragas|vetores|roedores/i, '19, § 2º'],
  [/\bEPIs?\b|\bEPCs?\b|sa[úu]de do trabalhador/i, '37, I'],
  [/pot[áa]vel|potabilidade|reservat[óo]rio de [áa]gua|caixa d.[áa]gua/i, '27, I'],
  [/Manual de Boas Pr[áa]ticas|\bPOPs?\b/i, '46, § 1º'],
  [/\bAFE\b|\bAE\b|autoriza[çc][ãa]o (?:de funcionamento|especial)/i, '50'],
  [/instala[çc][õo]es|edifica|pisos?\b|paredes|tetos?\b|ventila|ilumina|ralos|vesti[áa]rios|sanit[áa]rios|lavat[óo]rios?|bancadas|almoxarifado|inc[êe]ndio|tubula|planta arquitet|[áa]reas? (?:de|com|produtivas|adequadas)/i, '50']
 ];
 var MAPA = {
  odontologia: {saude: true, padrao: '63',
   prefixos: {lic: '90', ap: '65', fi: '65', cc: '65', eq: '65', em: '65', rx: '65', pe: '65', pr: '61', es: '61', de: '61', am: '61', te: '63', qu: '63', rs: '62', ex: '63'},
   ids: {eq7: '65', eq9: '61', ex1: '65', ex2: '61', ex3: '61', fi16: '65', pe12: '62', pr9: '61', qu4: '63'}},
  'servicos-alimentacao-roteiro': {padrao: '46', ids: {a5: '93', a6: '46, § 1º', b1: '50', b6: '50', c8: '46', d2: '46', d3: '46', e2: '46', e4: '46 e 49', g5: '46 e 49', h6: '46'}},
  'produtos-correlatos': {padrao: '46', ids: {p07: '50', p09: '46', p10: '46', p11: '46', p48: '46', dc4: '55', df1: '46', di5: '46', ds3: '46', ds6: '46', fi5: '19, § 2º', fm10: '46', fm12: '46', fn1: '46', fo7: '46, § 1º', fpr9: '46', fs6: '46', fw2: '50', fw3: '46', l7: '50', l8: '46', tv1: '91', tv5: '46', tv7: '46'}},
  /* assistenciais: SAICA e demais acolhimentos, art. 69; ILPI, Centro Dia, comunidade e residência terapêutica, pelo assunto */
  'servicos-assistenciais': {saude: true, padrao: '63', fixos: {saica: '69', demais: '69'}}
 };
 function regra(R, t){ for(var i = 0; i < R.length; i++){ var a = R[i][1] === undefined ? R[i][0](t) : (R[i][0].test(t) ? R[i][1] : ''); if(typeof a === 'function') a = a(t); if(a) return a; } return ''; }
 function artigo(M, id, t){
  var pre = id.replace(/\d.*$/, '');
  var R = M.saude ? SAUDE : PRODUTO, G = M.saude ? SAUDE_GERAL : [];
  /* o texto da verificação (e a citação) antes do grupo: num grupo “Responsabilidade técnica”, o registro no conselho é pessoal (64), não RT */
  return (M.ids && M.ids[id]) || (M.fixos && M.fixos[pre]) || regra(R, t[0] + ' · ' + t[2]) || (M.prefixos && M.prefixos[pre]) || regra(G, t[0]) || regra(R, t[1]) || regra(G, t[1]) || M.padrao;
 }
 /* '46 e 49' → arts. 46 e 49; '19, § 2º' → art. 19, § 2º */
 function arts(a){ return (/ e /.test(a) ? 'arts. ' : 'art. ') + a.replace(/(\d)-a\b/i, '$1-A'); }
 window.UvsLei = function(cit, id, grupo, texto){
  cit = String(cit || '').trim().replace(/[.;\s]+$/, '');
  if(/13\.725/.test(cit)) return cit;
  var M = MAPA[window.__uvsApp]; if(!M) return cit;
  return (cit ? cit + '; ' : '') + 'Lei Municipal nº 13.725/2004, ' + arts(artigo(M, String(id || '').split('|')[0], [String(texto || ''), String(grupo || ''), cit]));
 };
})();
