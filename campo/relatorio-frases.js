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
