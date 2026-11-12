'use strict';
/* Serviços assistenciais: exigência perguntada duas vezes (levantamento de 11/11/2026).
   Em cada modalidade, a seção “Documentos” pede o documento (Apresentou / Não apresentou) e a
   seção “Inspeção” repetia a mesma exigência como “Está atendida a exigência de <o mesmo
   documento>?” (Cumpre / Não cumpre). O inspetor respondia duas vezes, e a falta saía duas
   vezes no relatório. São 47 repetições nas seis modalidades (lista abaixo, conferida
   uma a uma; ficaram de fora as perguntas da Inspeção que acrescentam requisito, como carga
   horária do RT, conteúdo de plano ou notificação à VISA).
   O que muda:
   - a pergunta repetida da Inspeção recebe a marca rep (índice do documento) e deixa de ser
     exibida, contada e levada ao relatório; a exigência fica em “Documentos”, com as citações;
   - as posições das demais perguntas não mudam (as respostas são gravadas pela posição): as
     inspeções salvas continuam alinhadas;
   - duas listas de itens que só existiam na pergunta retirada passam ao documento
     (pontos/servicos-assistenciais.cjs).
   Idempotente. Uso: node scripts/repack-assistenciais-repeticao.cjs */
const fs = require('node:fs'), path = require('node:path');
const {unpack} = require('./integrated-html.cjs');
const file = path.join(__dirname, '..', 'index.html');
let {html, lz} = unpack(file);
const ID = 'app--servicos-assistenciais';
/* [modalidade, pergunta repetida da Inspeção, documento que fica] */
/* 12/11/2026: na ILPI, no Centro Dia e na CT a licença que fica é a da norma específica (a genérica
   saiu, scripts/assistenciais/revisao.cjs); a pergunta do enquadramento aponta para ela. */
const REPETIDAS = [
  ["ilpi", "Está atendida a exigência de enquadramento da atividade no licenciamento municipal e situação da licença sanitária ou da dispensa?",
    "Alvará sanitário (Licença de Funcionamento Sanitária) atualizado, expedido pelo órgão sanitário competente."],
  ["ilpi", "Está atendida a exigência de alvará sanitário atualizado e afixado em local visível ao público?",
    "Alvará sanitário (Licença de Funcionamento Sanitária) atualizado, expedido pelo órgão sanitário competente."],
  ["ilpi", "Está atendida a exigência de contrato e alvará sanitário das empresas terceirizadas de alimentação, limpeza ou lavanderia?",
    "Contrato e cópia do alvará sanitário das empresas de alimentação, limpeza ou lavanderia terceirizadas."],
  ["ilpi", "Está atendida a exigência de rotinas técnicas do processamento de roupas de uso pessoal e coletivo?",
    "Rotinas técnicas do processamento de roupas de uso pessoal e coletivo."],
  ["ilpi", "Está atendida a exigência de controle de vetores e pragas urbanas e comprovante de execução por empresa licenciada?",
    "Comprovante de execução de controle de vetores e pragas por empresa licenciada."],
  ["ilpi", "Está atendida a exigência de Estatuto registrado, registro de entidade social e Regimento Interno?",
    "Estatuto registrado, registro de entidade social e Regimento Interno."],
  ["ilpi", "Está atendida a exigência de registro no conselho de classe dos profissionais de saúde vinculados à equipe?",
    "Registro no conselho de classe dos profissionais de saúde da equipe."],
  ["ilpi", "Está atendida a exigência de registros das atividades de educação permanente em gerontologia?",
    "Registros das atividades de educação permanente em gerontologia."],
  ["ilpi", "Está atendida a exigência de registro individual atualizado de cada residente?",
    "Registro individual atualizado de cada residente."],
  ["ilpi", "Está atendida a exigência de comprovação da vacinação obrigatória dos residentes conforme o PNI?",
    "Comprovação da vacinação obrigatória dos residentes conforme o PNI."],
  ["ilpi", "Está atendida a exigência de rotinas e procedimentos escritos referentes ao cuidado com a pessoa idosa?",
    "Rotinas e procedimentos escritos referentes ao cuidado com a pessoa idosa."],
  ["ilpi", "Está atendida a exigência de rotinas de limpeza e higienização de artigos e ambientes?",
    "Rotinas de limpeza e higienização de artigos e ambientes."],
  ["centrodia", "Está atendida a exigência de enquadramento da atividade no licenciamento municipal e situação da licença sanitária ou da dispensa?",
    "Licença sanitária emitida pelo órgão sanitário competente."],
  ["centrodia", "Está atendida a exigência de certificado de higienização do reservatório de água a cada seis meses?",
    "Certificado de higienização do reservatório de água, a cada seis meses."],
  ["centrodia", "Está atendida a exigência de identificação externa do Centro Dia em local visível?",
    "Identificação externa do Centro Dia em local visível."],
  ["centrodia", "Está atendida a exigência de registro no conselho de classe dos profissionais de saúde vinculados à equipe?",
    "Registro no conselho de classe dos profissionais de saúde da equipe."],
  ["centrodia", "Está atendida a exigência de livro de intercorrências com registros atualizados?",
    "Livro de intercorrências com registros atualizados."],
  ["centrodia", "Está atendida a exigência de carteira de vacinação atualizada dos usuários e dos funcionários?",
    "Cópia da carteira de vacinação dos usuários e dos funcionários, atualizada."],
  ["ct", "Está atendida a exigência de enquadramento da atividade no licenciamento municipal e situação da licença sanitária ou da dispensa?",
    "Licença sanitária atualizada, afixada em local visível ao público."],
  ["ct", "Está atendida a exigência de licença sanitária atualizada e afixada em local visível ao público?",
    "Licença sanitária atualizada, afixada em local visível ao público."],
  ["ct", "Está atendida a exigência de regularização das instalações prediais perante o Poder Público local?",
    "Comprovante de regularização das instalações prediais perante o Poder Público local."],
  ["ct", "Está atendida a exigência de controle de vetores e pragas urbanas e comprovante de execução por empresa licenciada?",
    "Comprovante de execução de controle de vetores e pragas por empresa licenciada."],
  ["ct", "Está atendida a exigência de documento atualizado que descreve finalidades e atividades administrativas, técnicas e assistenciais?",
    "Documento atualizado que descreva finalidades e atividades administrativas, técnicas e assistenciais."],
  ["ct", "Está atendida a exigência de Responsável Técnico de nível superior legalmente habilitado e substituto com a mesma qualificação?",
    "Designação do Responsável Técnico de nível superior legalmente habilitado e de seu substituto com a mesma qualificação."],
  ["ct", "Está atendida a exigência de profissional que responde pelas questões operacionais durante o período de funcionamento?",
    "Identificação do profissional que responde pelas questões operacionais durante o período de funcionamento."],
  ["ct", "Está atendida a exigência de registros das ações de capacitação da equipe?",
    "Registros das ações de capacitação da equipe."],
  ["ct", "Está atendida a exigência de ficha individual de cada residente, com registro periódico do atendimento e das intercorrências clínicas?",
    "Ficha individual de cada residente, com registro periódico do atendimento e das intercorrências clínicas."],
  ["ct", "Está atendida a exigência de declaração escrita de concordância do residente com as normas e rotinas, inclusive em caso de mandado judicial?",
    "Declaração escrita de concordância do residente com as normas e rotinas, inclusive em caso de mandado judicial."],
  ["ct", "Está atendida a exigência de indicação dos serviços de atenção integral à saúde disponíveis aos residentes?",
    "Relação dos serviços de atenção integral à saúde disponíveis aos residentes."],
  ["srt", "Está atendida a exigência de enquadramento da atividade no licenciamento municipal e situação da licença sanitária ou da dispensa?",
    "Licença ou dispensa de licença sanitária, conforme o enquadramento da atividade no licenciamento municipal."],
  ["srt", "Está atendida a exigência de controle dos medicamentos sujeitos a controle especial, quando houver?",
    "Controle dos medicamentos sujeitos a controle especial, quando houver."],
  ["srt", "Está atendida a exigência de registros individuais de acompanhamento, prescrições e encaminhamentos?",
    "Registros individuais de acompanhamento, prescrições e encaminhamentos."],
  ["srt", "Está atendida a exigência de registro no conselho de classe dos profissionais de saúde vinculados?",
    "Registro no conselho de classe dos profissionais de saúde vinculados."],
  ["srt", "Está atendida a exigência de registros de supervisão e capacitação da equipe pelo serviço de referência?",
    "Registros de capacitação e supervisão da equipe pelo serviço de referência."],
  ["saica", "Está atendida a exigência de enquadramento da atividade no licenciamento municipal e situação da licença sanitária ou da dispensa?",
    "Licença ou dispensa de licença sanitária, conforme o enquadramento da atividade no licenciamento municipal."],
  ["saica", "Está atendida a exigência de Plano Individual de Atendimento de cada acolhido?",
    "Plano Individual de Atendimento (PIA) de cada acolhido."],
  ["saica", "Está atendida a exigência de carteira de vacinação atualizada de cada acolhido?",
    "Carteira de vacinação de cada acolhido, atualizada."],
  ["demais", "Está atendida a exigência de enquadramento da atividade no licenciamento municipal e situação da licença sanitária ou da dispensa?",
    "Licença ou dispensa de licença sanitária, conforme o enquadramento da atividade no licenciamento municipal."],
  ["demais", "Está atendida a exigência de registro no conselho de classe dos profissionais de saúde vinculados?",
    "Registro no conselho de classe dos profissionais de saúde vinculados."],
  ["demais", "Está atendida a exigência de normas e rotinas escritas de acolhida, convivência e desligamento?",
    "Normas e rotinas de funcionamento, acolhida, convivência e desligamento."],
  /* mesma exigência com redação um pouco diferente (conferidas à parte) */
  ["ilpi", "Está atendida a exigência de higienização semestral do reservatório de água e respectivo comprovante?",
    "Comprovantes de higienização do reservatório de água, no mínimo semestral."],
  ["ct", "Está atendida a exigência de higienização semestral do reservatório de água e respectivo comprovante?",
    "Comprovante de higienização do reservatório de água, no mínimo semestral."],
  ["srt", "Está atendida a exigência de higienização semestral do reservatório de água e respectivo comprovante?",
    "Comprovante de higienização do reservatório de água, no mínimo semestral."],
  ["saica", "Está atendida a exigência de higienização semestral do reservatório de água e respectivo comprovante?",
    "Comprovante de higienização do reservatório de água, no mínimo semestral."],
  ["demais", "Está atendida a exigência de higienização semestral do reservatório de água e respectivo comprovante?",
    "Comprovante de higienização do reservatório de água, no mínimo semestral."],
  ["ct", "Está atendida a exigência de avaliação diagnóstica prévia à admissão e registro na ficha do residente?",
    "Registro da avaliação diagnóstica prévia à admissão."],
  ["srt", "Está identificado o serviço ou equipe de saúde mental de referência e seu CNES, considerando que o SRT não possui CNES próprio?",
    "Identificação do CNES do serviço ou equipe de saúde mental de referência; o SRT não possui CNES próprio."]
];
const TROCAS = [
  /* seções e itens da tela */
  ["function asGrupos(kind){const by=[];current[kind].forEach((x,i)=>{let g=by.find(b=>b.g===x.g);",
   "function asGrupos(kind){const by=[];current[kind].forEach((x,i)=>{if(x.rep!=null)return;let g=by.find(b=>b.g===x.g);"],
  /* contadores */
  ['["doc","rot"].forEach(kind=>current[kind].forEach((_,i)=>{total++;if(mark(kind,i))done++}));',
   '["doc","rot"].forEach(kind=>current[kind].forEach((x,i)=>{if(x.rep!=null)return;total++;if(mark(kind,i))done++}));'],
  ["['doc','rot'].forEach(kind=>current[kind].forEach((_,i)=>{t++;const v=mark(kind,i);if(v)f++;if(v==='NC')nc++}));",
   "['doc','rot'].forEach(kind=>current[kind].forEach((x,i)=>{if(x.rep!=null)return;t++;const v=mark(kind,i);if(v)f++;if(v==='NC')nc++}));"],
  ["n+current[kind].filter((_,i)=>mark(kind,i)==='NC').length,0)",
   "n+current[kind].filter((x,i)=>x.rep==null&&mark(kind,i)==='NC').length,0)"],
  /* relatório (Word e prévia) */
  ['["doc","rot"].forEach(kind=>current[kind].forEach((item,i)=>{const st=mark(kind,i),nt=',
   '["doc","rot"].forEach(kind=>current[kind].forEach((item,i)=>{if(item.rep!=null)return;const st=mark(kind,i),nt='],
  ["['doc','rot'].forEach(function(k){(current[k]||[]).forEach(function(it,i){var st=mark(k,i);if(!st)return;",
   "['doc','rot'].forEach(function(k){(current[k]||[]).forEach(function(it,i){if(it.rep!=null)return;var st=mark(k,i);if(!st)return;"],
  /* cartão da modalidade */
  ["+s.rot.length+' itens</span>", "+s.rot.filter(x=>x.rep==null).length+' itens</span>"]
];
function objetoEm(a, i) { let d = 0, str = false, esc = false; for (let j = i; j < a.length; j++) { const c = a[j]; if (str) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') str = false; } else if (c === '"') str = true; else if (c === '{' || c === '[') d++; else if (c === '}' || c === ']') { d--; if (!d) return a.slice(i, j + 1); } } return null; }

let feito = false, marcadas = 0;
html = html.replace(/(<script type="text\/plain" id="([^"]+)">)([\s\S]*?)(<\/script>)/g, (m, a, id, enc, z) => {
  if (id !== ID) return m;
  feito = true;
  const src = lz.decompressFromBase64(enc.trim());
  let s = src;
  for (const [de, para] of TROCAS) {
    if (s.includes(para)) continue;
    if (s.split(de).length !== 2) throw Error('Trecho não localizado de forma única: ' + de.slice(0, 70));
    s = s.replace(de, () => para);
  }
  /* dados de cada modalidade: {"id":…,"doc":[…],"rot":[…],…} */
  const vistos = new Set(); let k = -1; const trocas = [];
  while ((k = s.indexOf('"doc":[', k + 1)) >= 0) {
    const i = s.lastIndexOf('{', k), txt = objetoEm(s, i); if (!txt || vistos.has(i)) continue; vistos.add(i);
    let o; try { o = JSON.parse(txt); } catch (e) { continue; }
    if (!o.rot || !o.id) continue;
    if (JSON.stringify(o) !== txt) throw Error('dados da modalidade ' + o.id + ' não estão em JSON compacto');
    for (const [serv, ins, doc] of REPETIDAS.filter(r => r[0] === o.id)) {
      const ri = o.rot.map((x, n) => x.i === ins ? n : -1).filter(n => n >= 0), di = o.doc.map((x, n) => x.i === doc ? n : -1).filter(n => n >= 0);
      if (ri.length !== 1 || di.length !== 1) throw Error(serv + ': par não localizado de forma única — ' + ins.slice(0, 60));
      o.rot[ri[0]].rep = di[0]; marcadas++;
    }
    const novo = JSON.stringify(o); if (novo !== txt) trocas.push([txt, novo]);
  }
  for (const [de, para] of trocas) { if (s.split(de).length !== 2) throw Error('dados repetidos no bloco'); s = s.replace(de, () => para); }
  if (marcadas !== REPETIDAS.length) throw Error('marcadas ' + marcadas + ' de ' + REPETIDAS.length);
  if (s === src) return m;
  const novo = lz.compressToBase64(s);
  if (lz.decompressFromBase64(novo) !== s) throw Error('round-trip ' + ID);
  return a + novo + z;
});
if (!feito) throw Error('Bloco não localizado: ' + ID);
fs.writeFileSync(file, html);
console.log('Serviços assistenciais: ' + marcadas + ' perguntas repetidas da Inspeção retiradas (a exigência fica em Documentos).');
