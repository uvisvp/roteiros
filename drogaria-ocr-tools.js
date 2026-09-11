/*
 * DROGARIA — leitura documental (OCR) e extração de campos para conferência.
 * Versão 2.0
 *
 * Mudanças em relação à 1.0:
 *   - PDF com texto digital + imagem incorporada (ex.: página "papel timbrado" com
 *     certificado escaneado) agora passa por OCR da imagem. Na 1.0 bastavam 25
 *     caracteres de texto digital (cabeçalho/rodapé) para o OCR não ser executado.
 *   - Recorte e ampliação da área da imagem antes do OCR.
 *   - Pré-processamento próprio: normalização de iluminação (fundo pardo, sombras,
 *     marca-d'água), binarização adaptativa e teste de rotação (90/180/270°).
 *   - Leituras complementares só quando faltam campos essenciais; campos de
 *     leituras diferentes são combinados por concordância.
 *   - Extratores reescritos por documento, tolerantes a erros comuns de OCR.
 *   - Datas sempre em DD/MM/AAAA (ou MM/AAAA quando o documento só traz mês/ano).
 *
 * Princípios mantidos:
 *   1. cada leitor é documental e específico;
 *   2. nenhum campo é aplicado automaticamente: o resultado é sempre revisável;
 *   3. foto de evidência é fluxo distinto de OCR e não entra no relatório;
 *   4. o arquivo original de foto-evidência é mantido localmente no IndexedDB.
 *
 * Compatibilidade: sem lookbehind em RegExp (Safari < 16.4).
 */
(() => {
  'use strict';
  if (window.DrogariaOcrTools) return;

  const VERSION = 'drogaria-ocr-tools-2.0';
  const DATA_BASES = [
    'https://uvisvp.github.io/base-vigilancia/dados/',
    'https://raw.githubusercontent.com/uvisvp/base-vigilancia/main/dados/'
  ];
  const CDN = {
    pdf: ['https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js', 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js'],
    pdfWorker: ['https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js', 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'],
    tesseract: ['https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js', 'https://unpkg.com/tesseract.js@5/dist/tesseract.min.js']
  };
  const OCR_LANG = 'por';

  /* ------------------------------------------------------------------ texto */
  const text = value => String(value == null ? '' : value).replace(/\r/g, '');
  const digits = value => text(value).replace(/\D/g, '');
  const normalize = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const trim = value => text(value).replace(/[ \t]+/g, ' ').trim();
  const unique = values => [...new Set((values || []).map(trim).filter(Boolean))];
  const esc = value => text(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const empty = fields => Object.fromEntries(fields.map(field => [field, '']));

  // Normalização 1:1 (mesmo comprimento), para que índices encontrados no texto
  // normalizado possam recortar o texto original.
  function nk(value) {
    const s = text(value); let out = '';
    for (let i = 0; i < s.length; i++) {
      const n = s[i].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      out += n.length === 1 ? n : (n[0] || ' ');
    }
    return out;
  }

  // Corrige confusões típicas de OCR somente em contexto numérico.
  function fixDigits(value) {
    return text(value).replace(/\d[OoIlZzSB|]+\d|[Oo]\d{2,}|\d{2,}[OoIl]\b/g, m => m.replace(/[Oo]/g, '0').replace(/[Il|]/g, '1').replace(/[Zz]/g, '2').replace(/S/g, '5').replace(/B/g, '8'));
  }

  // Linhas "limpas" para análise. Três ou mais espaços = separação de coluna.
  function mkLines(raw) {
    return text(raw).split('\n')
      .map(line => line.replace(/\t/g, '   ').replace(/[|[\]{}]/g, ' ').replace(/[“”„]/g, '"').replace(/[‘’`´]/g, "'")
        .replace(/ {3,}/g, '\u0001').replace(/ {2}/g, ' ').replace(/\u0001/g, '   ').trim())
      .filter(line => line && /[\p{L}\d]/u.test(line));
  }
  const clean = value => text(value).replace(/\s+/g, ' ').replace(/^[\s:;.,=\-–—_'"]+|[\s:;,=\-–—_'"]+$/g, '').trim();
  const hasWord = value => /[\p{L}\d]{2,}/u.test(text(value));

  function isLabelLine(line) {
    return /^[\p{Lu}0-9ºª°][\p{L}0-9ºª° .\/()\-]{1,45}:/u.test(text(line).trim());
  }

  function findLine(lines, rx, from = 0, to = lines.length) {
    const base = new RegExp(rx.source, rx.flags.replace('g', ''));
    for (let i = Math.max(0, from); i < Math.min(lines.length, to); i++) {
      const m = base.exec(nk(lines[i]));
      if (m) return { i, start: m.index, end: m.index + m[0].length };
    }
    return null;
  }

  function cutStop(value, stop) {
    const v = text(value);
    if (!stop) return clean(v);
    const at = nk(v).search(stop);
    return clean(at >= 0 ? v.slice(0, at) : v);
  }

  // Valor após um rótulo: mesma linha; se vazio, linha seguinte que não seja rótulo.
  function after(lines, rx, { stop, next = true, gap = false, from = 0, to, accept } = {}) {
    let hit = findLine(lines, rx, from, to);
    while (hit) {
      let value = lines[hit.i].slice(hit.end).replace(/^[\s:;.=\-–—_]+/, '');
      if (gap) value = value.split(/ {3,}/)[0];
      value = cutStop(value, stop);
      if (!hasWord(value) && next) {
        for (let j = hit.i + 1; j <= hit.i + 2 && j < lines.length; j++) {
          if (isLabelLine(lines[j]) && !accept) break;
          const candidate = cutStop(gap ? lines[j].split(/ {3,}/)[0] : lines[j], stop);
          if (hasWord(candidate)) { value = candidate; break; }
        }
      }
      if (hasWord(value) && (!accept || accept(value))) return value;
      hit = findLine(lines, rx, hit.i + 1, to);
    }
    return '';
  }

  function linesBetween(lines, startRx, endRx, from = 0) {
    const start = findLine(lines, startRx, from);
    if (!start) return [];
    const end = endRx ? findLine(lines, endRx, start.i + 1) : null;
    return lines.slice(start.i + 1, end ? end.i : lines.length);
  }

  /* ------------------------------------------------------------------ datas */
  const MONTHS = { jan: 1, janeiro: 1, fev: 2, fevereiro: 2, mar: 3, marco: 3, abr: 4, abril: 4, mai: 5, maio: 5, jun: 6, junho: 6, jul: 7, julho: 7, ago: 8, agosto: 8, set: 9, setembro: 9, out: 10, outubro: 10, nov: 11, novembro: 11, dez: 12, dezembro: 12,
    // variantes frequentes de OCR (d/c por o; rn por m)
    dutubro: 10, cutubro: 10, seternbro: 9, novernbro: 11, dezernbro: 12 };
  const MONTH_RX = 'dutubro|cutubro|seternbro|novernbro|dezernbro|janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez';
  const pad2 = n => String(n).padStart(2, '0');
  function mkDate(d, m, y) {
    d = Number(String(d).replace(/\s/g, '')); m = Number(m); y = String(y);
    if (y.length === 2) y = '20' + y;
    const year = Number(y);
    if (!(d >= 1 && d <= 31 && m >= 1 && m <= 12 && year >= 1980 && year <= 2100)) return '';
    return pad2(d) + '/' + pad2(m) + '/' + year;
  }
  // Retorna datas na ordem em que aparecem: [{value, index}]
  function datesIn(value, { monthYear = false } = {}) {
    const s = fixDigits(value), n = nk(s), found = [];
    let m;
    const numeric = /(^|[^\d])(\d{1,2})\s?[\/.\-]\s?(\d{1,2})\s?[\/.\-]\s?(\d{4}|\d{2})(?!\d)/g;
    while ((m = numeric.exec(n))) { const v = mkDate(m[2], m[3], m[4]); if (v) found.push({ value: v, index: m.index + m[1].length }); }
    const extended = new RegExp('(^|[^\\d])(\\d\\s?\\d|\\d)\\s*(?:de\\s+)?(' + MONTH_RX + ')\\.?\\s*(?:de\\s+|\\/\\s*)?(\\d{4})(?!\\d)', 'g');
    while ((m = extended.exec(n))) { const v = mkDate(m[2], MONTHS[m[3]], m[4]); if (v) found.push({ value: v, index: m.index + m[1].length }); }
    if (monthYear) {
      const my = new RegExp('(^|[^\\p{L}\\d])(' + MONTH_RX + ')\\.?\\s*[\\/\\-]?\\s*(?:de\\s+)?(\\d{4}|\\d{2})(?!\\d)', 'gu');
      while ((m = my.exec(n))) {
        const y = m[3].length === 2 ? '20' + m[3] : m[3];
        if (Number(y) >= 1980 && Number(y) <= 2100) found.push({ value: pad2(MONTHS[m[2]]) + '/' + y, index: m.index + m[1].length });
      }
      const mmyy = /(^|[^\d\/])(\d{2})\s?\/\s?(\d{4})(?![\d\/])/g;
      while ((m = mmyy.exec(n))) if (Number(m[2]) >= 1 && Number(m[2]) <= 12) found.push({ value: m[2] + '/' + m[3], index: m.index + m[1].length });
    }
    return found.sort((a, b) => a.index - b.index);
  }
  const firstDateIn = (value, opt) => (datesIn(value, opt)[0] || {}).value || '';

  // Data após rótulo (mesma linha ou até duas seguintes).
  function dateAfter(lines, rx, { from = 0, to, monthYear = false, span = 2 } = {}) {
    const base = new RegExp(rx.source, rx.flags.replace('g', ''));
    for (let i = Math.max(0, from); i < Math.min(lines.length, to == null ? lines.length : to); i++) {
      const m = base.exec(nk(lines[i]));
      if (!m) continue;
      const same = firstDateIn(lines[i].slice(m.index + m[0].length), { monthYear });
      if (same) return same;
      for (let j = i + 1; j <= i + span && j < lines.length; j++) {
        const d = firstDateIn(lines[j], { monthYear });
        if (d) return d;
      }
    }
    return '';
  }

  // Converte DD/MM/AAAA -> AAAA-MM-DD (para campos <input type="date">).
  function toIso(value) {
    const m = text(value).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? m[3] + '-' + m[2] + '-' + m[1] : (/^\d{4}-\d{2}-\d{2}$/.test(text(value)) ? text(value) : '');
  }

  /* --------------------------------------------------- identificadores */
  function cnpjValid(raw) {
    const n = digits(raw);
    if (!/^\d{14}$/.test(n) || /^(\d)\1+$/.test(n)) return false;
    const digit = (source, weights) => { const rest = [...source].reduce((sum, value, index) => sum + Number(value) * weights[index], 0) % 11; return rest < 2 ? 0 : 11 - rest; };
    const one = digit(n.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return n.endsWith(String(one) + String(digit(n.slice(0, 12) + one, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])));
  }
  const fmtCnpj = d => d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  const fmtCpf = d => d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  function cnpjsIn(value) {
    const s = fixDigits(value), out = [];
    const rx = /(^|[^\d])(\d{2})\s?\.?\s?(\d{3})\s?\.?\s?(\d{3})\s?\/?\s?(\d{4})\s?-?\s?(\d{2})(?!\d)/g;
    let m;
    while ((m = rx.exec(s))) { const d = m.slice(2, 7).join(''); out.push({ value: fmtCnpj(d), valid: cnpjValid(d), index: m.index + m[1].length }); }
    return out;
  }
  function cpfsIn(value) {
    const s = fixDigits(value), out = [];
    const rx = /(^|[^\d\/])(\d{3})\s?\.?\s?(\d{3})\s?\.?\s?(\d{3})\s?-?\s?(\d{2})(?![\d\/])/g;
    let m;
    while ((m = rx.exec(s))) out.push({ value: fmtCpf(m.slice(2, 6).join('')), index: m.index + m[1].length });
    return out;
  }
  function cevsIn(value) {
    const s = fixDigits(value), out = [];
    const rx = /(^|[^\d])(\d{9})\s?[-.\s]?\s?(\d{3})\s?[-.\s]?\s?(\d{6})\s?[-.\s]?\s?(\d)\s?[-.\s]?\s?(\d)(?!\d)/g;
    let m;
    while ((m = rx.exec(s))) out.push({ value: m.slice(2, 7).join('-'), index: m.index + m[1].length });
    return out;
  }

  // Nome de pessoa/empresa: remove ruído de OCR (tokens soltos em minúsculas, símbolos).
  const CONNECTORS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'del', 'van', 'von']);
  function cleanName(value) {
    const tokens = text(value).replace(/[^\p{L}\d .&'\/\-]/gu, ' ').split(/\s+/).filter(Boolean);
    const kept = tokens.filter(t => /^\p{Lu}/u.test(t) || CONNECTORS.has(t.toLowerCase()) || /^[\d&\/\-]+$/.test(t));
    while (kept.length && (CONNECTORS.has(kept[kept.length - 1].toLowerCase()) || /^[\/\-&.]+$/.test(kept[kept.length - 1]))) kept.pop();
    while (kept.length && CONNECTORS.has(kept[0].toLowerCase())) kept.shift();
    return clean(kept.join(' '));
  }
  const upperName = value => {
    const m = text(value).match(/(?:\p{Lu}[\p{Lu}'\-]*\.?\s+){1,8}\p{Lu}[\p{Lu}'\-]+/u);
    return m ? clean(m[0]) : '';
  };

  // Divide lista de atividades por vírgula/ponto e vírgula, respeitando parênteses
  // fechados. Parêntese sem fechamento (texto truncado na licença) é ignorado.
  function splitActivities(value) {
    const s = clean(text(value).replace(/\s*\n\s*/g, ' '));
    const parts = []; let cur = '', depth = 0;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '(') { const close = s.indexOf(')', i), nextOpen = s.indexOf('(', i + 1); if (close > i && (nextOpen < 0 || close < nextOpen)) depth++; }
      else if (c === ')' && depth > 0) depth--;
      if ((c === ',' || c === ';') && depth === 0) { parts.push(cur); cur = ''; continue; }
      cur += c;
    }
    parts.push(cur);
    return unique(parts.map(clean).filter(p => p.length > 2));
  }

  /* --------------------------------------------------------------- catálogo */
  // required: campos cuja ausência justifica nova leitura (outra variante de imagem).
  const CATALOG = Object.freeze({
    licenca_sanitaria: {
      title: 'Licença Sanitária',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['numero_cevs_ou_cmvs', 'validade', 'cnae', 'atividades_licenciadas', 'razao_social', 'nome_fantasia', 'cnpj', 'endereco', 'bairro', 'municipio', 'cep', 'estado', 'responsavel_legal', 'cpf_responsavel_legal', 'responsavel_tecnico', 'numero_conselho_responsavel_tecnico', 'responsavel_tecnico_substituto', 'numero_conselho_responsavel_tecnico_substituto', 'afe'],
      required: ['numero_cevs_ou_cmvs', 'validade', 'cnae', 'atividades_licenciadas', 'razao_social', 'cnpj', 'endereco', 'responsavel_tecnico']
    },
    certidao_regularidade_crf: {
      title: 'Certidão de Regularidade Técnica — CRF',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['numero_certidao', 'razao_social', 'cnpj', 'ramo_atividade', 'rotina', 'responsavel_tecnico', 'numero_conselho_responsavel_tecnico', 'responsavel_tecnico_substituto', 'numero_conselho_responsavel_tecnico_substituto', 'data_emissao'],
      required: ['numero_certidao', 'ramo_atividade', 'rotina', 'responsavel_tecnico', 'numero_conselho_responsavel_tecnico', 'data_emissao']
    },
    avcb_clcb: {
      title: 'AVCB ou CLCB',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['tipo_documento', 'numero', 'projeto', 'endereco_completo', 'validade'],
      required: ['tipo_documento', 'numero', 'endereco_completo', 'validade']
    },
    controle_pragas_urbanas: {
      title: 'Certificado de controle de pragas urbanas',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['numero_certificado', 'empresa_executora', 'cnpj_empresa_executora', 'cevs_empresa_executora', 'data_realizacao', 'validade'],
      required: ['empresa_executora', 'data_realizacao', 'validade']
    },
    higienizacao_caixa_agua: {
      title: 'Certificado de higienização e desinfecção de caixa d’água',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['empresa_executora', 'cnpj_empresa_executora', 'data_realizacao', 'validade'],
      required: ['empresa_executora', 'data_realizacao', 'validade']
    },
    calibracao_termohigrometro: {
      title: 'Certificado de calibração',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['numero_certificado', 'empresa_responsavel', 'instrumento_equipamento', 'identificacao', 'numero_serie', 'marca_fabricante', 'modelo', 'lote', 'data_calibracao', 'validade'],
      required: ['numero_certificado', 'instrumento_equipamento', 'data_calibracao', 'validade']
    },
    sumario_documentos: {
      title: 'Sumário de documentos — Manual, POPs ou PGRSS',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['lista_documentos'],
      required: ['lista_documentos']
    },
    etiqueta_metrologica: {
      title: 'Foto de etiqueta metrológica em equipamento',
      accepted: ['image/*'],
      fields: ['numero', 'empresa', 'data_calibracao', 'validade'],
      required: ['data_calibracao', 'validade']
    },
    aso: {
      title: 'ASO — Atestado de Saúde Ocupacional',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['tipo', 'nome_funcionario', 'empresa_responsavel', 'medico_assinante', 'data_exame', 'data_emissao'],
      required: ['tipo', 'nome_funcionario', 'empresa_responsavel', 'data_emissao']
    },
    pop_manual_pgrss: {
      title: 'POP, Manual ou PGRSS',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['nome', 'data_elaboracao', 'titulo', 'responsaveis', 'vigencia'],
      required: ['titulo']
    },
    comprovante_mapas_balancos: {
      title: 'Comprovante de envio de mapas e balanços',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['numero_solicitacao', 'estabelecimento', 'servico', 'data_envio'],
      required: ['numero_solicitacao', 'servico', 'data_envio']
    },
    sngpc_escrituracao_digital: {
      title: 'Certificado de escrituração digital do SNGPC',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['razao_social', 'cnpj', 'data_adesao', 'data_geracao_documento'],
      required: ['razao_social', 'cnpj']
    },
    sngpc_transmissao_regular: {
      title: 'Certificado de transmissão regular do SNGPC',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['razao_social', 'cnpj', 'data_ultima_transmissao', 'data_geracao_documento'],
      required: ['razao_social', 'cnpj']
    },
    danfe_nfe: {
      title: 'DANFE ou Nota Fiscal',
      accepted: ['image/*', '.pdf', '.docx', '.xml'],
      fields: ['cnpj_emitente', 'razao_social_emitente', 'data_emissao', 'numero_nota', 'cnpj_remetente'],
      required: ['cnpj_emitente', 'numero_nota', 'data_emissao']
    }
  });

  // Rótulos legíveis (para telas que quiserem usá-los).
  const LABELS = Object.freeze({
    numero_cevs_ou_cmvs: 'Nº CEVS / CMVS', validade: 'Validade', cnae: 'Atividade econômica — CNAE', atividades_licenciadas: 'Atividades licenciadas (uma por linha)',
    razao_social: 'Razão social', nome_fantasia: 'Nome fantasia', cnpj: 'CNPJ', endereco: 'Endereço (logradouro e número)', bairro: 'Bairro', municipio: 'Município', cep: 'CEP', estado: 'UF',
    responsavel_legal: 'Responsável legal', cpf_responsavel_legal: 'CPF do responsável legal', responsavel_tecnico: 'Responsável técnico',
    numero_conselho_responsavel_tecnico: 'CRF do responsável técnico', responsavel_tecnico_substituto: 'Responsável(is) técnico(s) substituto(s)',
    numero_conselho_responsavel_tecnico_substituto: 'CRF do(s) substituto(s)', afe: 'AFE impressa na licença (conferir na consulta Anvisa)', numero_certidao: 'Nº da certidão', ramo_atividade: 'Ramo de atividade', rotina: 'Horário de funcionamento (uma linha por período)',
    data_emissao: 'Data de emissão', tipo_documento: 'Tipo de documento', numero: 'Número', projeto: 'Projeto', endereco_completo: 'Endereço', numero_certificado: 'Nº do certificado',
    empresa_executora: 'Empresa executora', cnpj_empresa_executora: 'CNPJ da empresa executora', cevs_empresa_executora: 'CEVS da empresa executora', data_realizacao: 'Data de realização',
    empresa_responsavel: 'Empresa responsável', instrumento_equipamento: 'Instrumento / equipamento', identificacao: 'Identificação', numero_serie: 'Nº de série', marca_fabricante: 'Marca / fabricante',
    modelo: 'Modelo', lote: 'Lote', data_calibracao: 'Data da calibração', lista_documentos: 'Documentos listados', empresa: 'Empresa', tipo: 'Tipo de ASO', nome_funcionario: 'Nome do funcionário',
    medico_assinante: 'Médico examinador', data_exame: 'Data do exame', nome: 'Nome', data_elaboracao: 'Data de elaboração', titulo: 'Título', responsaveis: 'Responsáveis', vigencia: 'Vigência',
    numero_solicitacao: 'Nº da solicitação', estabelecimento: 'Estabelecimento', servico: 'Serviço', data_envio: 'Data do envio', data_adesao: 'Data de adesão', data_geracao_documento: 'Data de geração',
    data_ultima_transmissao: 'Última transmissão', cnpj_emitente: 'CNPJ do emitente', razao_social_emitente: 'Emitente', numero_nota: 'Nº da nota', cnpj_remetente: 'CNPJ do remetente'
  });

  /* --------------------------------------------------------- licença */
  const LIC_LABEL = /^(n[ºo°.]?\s*(cmvs|cevs|processo|protocolo)|data d|subgrupo|agrupamento|atividade|objeto|detalhe|razao|cnpj|nome fantasia|logradouro|endereco|complemento|bairro|municipio|cep|pagina|responsavel|cpf|conselho|n[ºo°.]?\s*inscr|autorizacao|classes? de|descricao|atividades licenciadas)/;
  const isLicLabel = line => LIC_LABEL.test(nk(line).replace(/^[^a-z0-9]+/, ''));

  function extractLicense(raw) {
    const out = empty(CATALOG.licenca_sanitaria.fields);
    const lines = mkLines(raw);

    // CEVS/CMVS: preferir a ocorrência na linha do rótulo.
    const cevsLine = findLine(lines, /\b(cmvs|cevs)\b/);
    out.numero_cevs_ou_cmvs = (cevsLine && (cevsIn(lines.slice(cevsLine.i, cevsLine.i + 2).join(' '))[0] || {}).value) || (cevsIn(raw)[0] || {}).value || '';

    out.validade = dateAfter(lines, /data de validade|\bvalidade\b|valida ate|vencimento/, { span: 1 });

    // CNAE: código + descrição. No PDF o rótulo fica centralizado entre duas linhas
    // do valor, então o código pode aparecer na linha anterior ao rótulo.
    const cnaeHit = findLine(lines, /atividade economica\s*-?\s*cnae|\bcnae\b/);
    if (cnaeHit) {
      const CODE = /\d{4}\s?-?\s?\d\s?\/\s?\d{2}/;
      let startLine = -1;
      for (const j of [cnaeHit.i, cnaeHit.i - 1, cnaeHit.i + 1, cnaeHit.i - 2, cnaeHit.i + 2]) if (j >= 0 && j < lines.length && CODE.test(fixDigits(j === cnaeHit.i ? lines[j].slice(cnaeHit.end) : lines[j]))) { startLine = j; break; }
      const parts = [];
      if (startLine >= 0) {
        const first = startLine === cnaeHit.i ? lines[startLine].slice(cnaeHit.end) : lines[startLine];
        const at = fixDigits(first).search(CODE);
        parts.push(first.slice(at));
        for (let j = startLine + 1; j < lines.length && j <= startLine + 4; j++) {
          if (j === cnaeHit.i) { const rest = clean(lines[j].slice(cnaeHit.end)); if (rest) parts.push(rest); continue; }
          if (isLicLabel(lines[j]) || isLabelLine(lines[j])) break;
          parts.push(lines[j]);
        }
      } else {
        parts.push(lines[cnaeHit.i].slice(cnaeHit.end).replace(/^[\s:;.=\-–—_]+/, ''));
        for (let j = cnaeHit.i + 1; j < lines.length && j <= cnaeHit.i + 3; j++) { if (isLicLabel(lines[j]) || isLabelLine(lines[j])) break; parts.push(lines[j]); }
      }
      out.cnae = clean(parts.join(' '));
    }

    // Atividades licenciadas: linhas abaixo de "OBJETO LICENCIADO", sem o objeto em si.
    const obj = findLine(lines, /objeto licenciado/);
    if (obj) {
      const collected = [];
      const rest = clean(lines[obj.i].slice(obj.end));
      if (rest && !/^(estabelecimento|equipamento|veiculo|unidade movel|servico)\b/.test(nk(rest))) collected.push(rest);
      for (let j = obj.i + 1; j < lines.length; j++) {
        if (isLicLabel(lines[j]) || isLabelLine(lines[j])) break;
        collected.push(lines[j]);
      }
      out.atividades_licenciadas = splitActivities(collected.join(' ')).join('\n');
    } else {
      const block = linesBetween(lines, /^atividades? (licenciadas?|autorizadas?)\s*:?\s*$/, /^[a-z ]{3,40}:/);
      const joined = block.join(' ');
      if (joined && !/licenca sanitaria/.test(nk(joined))) out.atividades_licenciadas = splitActivities(joined).join('\n');
    }

    out.razao_social = after(lines, /razao social|nome empresarial/, { stop: /cnpj|nome fantasia|\s{3,}/, next: false });
    out.nome_fantasia = after(lines, /nome fantasia/, { stop: /cnpj|logradouro|endereco|\s{3,}/, next: false });

    // CNPJ do estabelecimento — nunca o "CNPJ ALBERGANTE".
    const cnpjCandidates = [];
    lines.forEach((line, i) => {
      const n = nk(line);
      if (!/cnpj/.test(n)) return;
      const cleaned = line.slice(0, n.search(/cnpj\s*albergante/) >= 0 ? n.search(/cnpj\s*albergante/) : line.length) + (n.search(/cnpj\s*albergante/) >= 0 ? '' : '');
      const scope = /cnpj\s*albergante/.test(n) ? cleaned : line + ' ' + (lines[i + 1] || '');
      cnpjsIn(scope).forEach(c => cnpjCandidates.push({ ...c, labelled: /cnpj\s*(\/\s*cpf)?\s*:/.test(n) && !/albergante/.test(n) }));
    });
    const bestCnpj = cnpjCandidates.find(c => c.labelled) || cnpjCandidates[0] || cnpjsIn(raw).find(c => c.valid);
    out.cnpj = bestCnpj ? bestCnpj.value : '';

    // Endereço: logradouro + número (+ complemento) no mesmo campo.
    const logHit = findLine(lines, /\blogradouro\b|\bendereco\b/);
    if (logHit) {
      const line = lines[logHit.i], rest = line.slice(logHit.end).replace(/^[\s:;.=\-–—_]+/, '');
      const street = cutStop(rest, /\bnumero\b|\bn[ºo°]\s*[:.]|\bcomplemento\b|\bbairro\b|\s{3,}/);
      const numMatch = nk(rest).match(/(?:\bnumero|\bn[ºo°])\s*[:.]?\s*([0-9a-z\-\/]+|s\/?n)/);
      const number = numMatch ? clean(rest.substr(numMatch.index + numMatch[0].length - numMatch[1].length, numMatch[1].length)).toUpperCase() : '';
      const compl = after(lines, /\bcomplemento\b/, { stop: /\bbairro\b|\bcep\b|\bmunicipio\b|\s{3,}/, next: false, from: logHit.i, to: logHit.i + 3 });
      out.endereco = [street, number].filter(Boolean).join(', ') + (compl && !isLicLabel(compl) ? ' - ' + compl : '');
    }
    out.bairro = after(lines, /\bbairro\b/, { stop: /\bmunicipio\b|\bcidade\b|\bcep\b|\buf\b\s*:|\s{3,}/, next: false });
    out.municipio = after(lines, /\bmunicipio\b|\bcidade\b/, { stop: /\buf\b\s*:|\bcep\b|\bestado\b|\s{3,}/, next: false });
    const cepHit = findLine(lines, /\bcep\b/);
    if (cepHit) {
      const cepLine = fixDigits(lines[cepHit.i]);
      const cm = cepLine.match(/(\d{2})\.?(\d{3})\s?-?\s?(\d{3})(?!\d)/);
      if (cm) out.cep = cm[1] + cm[2] + '-' + cm[3];
      const uf = lines[cepHit.i].match(/\bUF\s*:?\s*([A-Z]{2})\b/);
      if (uf) out.estado = uf[1];
    }
    if (!out.estado) { const e = after(lines, /\bestado\b|\buf\b/, { next: false }); if (/^[A-Z]{2}\b/.test(e)) out.estado = e.slice(0, 2); }

    // Responsáveis: blocos na ordem do documento.
    const starts = [];
    lines.forEach((line, i) => {
      const n = nk(line), at = n.search(/responsavel\s+(legal|tecnico)/);
      if (at < 0 || at > 6) return;
      const kind = /responsavel\s+legal/.test(n) ? 'legal' : /responsavel\s+tecnico\s+substitut/.test(n) ? 'sub' : 'rt';
      starts.push({ i, kind });
    });
    const endBlock = findLine(lines, /autorizacao de funcionamento|\(afe\)|classes? de produtos/);
    const persons = starts.map((s, k) => {
      const until = k + 1 < starts.length ? starts[k + 1].i : (endBlock && endBlock.i > s.i ? endBlock.i : Math.min(lines.length, s.i + 4));
      const block = lines.slice(s.i, until);
      const first = block[0], n = nk(first);
      const lab = n.match(/^.*?responsavel\s+(legal|tecnico(\s+substitut[oa]s?)?)\s*:?/);
      const afterLabel = lab ? first.slice(lab[0].length) : first;
      const name = cleanName(cutStop(afterLabel, /\bcpf\b|conselho|\s{3,}/)) || cleanName(cutStop(block[1] || '', /\bcpf\b|conselho/));
      const joined = block.join('\n');
      const cpf = (cpfsIn(joined)[0] || {}).value || '';
      const insc = nk(joined).match(/inscr[^:\n]*:?\s*([\d.\-\/ ]{3,12})/);
      const reg = insc ? digits(insc[1]) : '';
      return { kind: s.kind, name, cpf, reg };
    });
    const legal = persons.find(p => p.kind === 'legal');
    const rt = persons.find(p => p.kind === 'rt');
    const subs = persons.filter(p => p.kind === 'sub');
    if (legal) { out.responsavel_legal = legal.name; out.cpf_responsavel_legal = legal.cpf; }
    if (rt) { out.responsavel_tecnico = rt.name; out.numero_conselho_responsavel_tecnico = rt.reg; }
    if (subs.length) {
      out.responsavel_tecnico_substituto = subs.map(p => p.name || '?').join('; ');
      out.numero_conselho_responsavel_tecnico_substituto = subs.some(p => p.reg) ? subs.map(p => p.reg || '?').join('; ') : '';
    }

    if (endBlock) {
      const afeScope = fixDigits(lines.slice(endBlock.i, endBlock.i + 3).join(' '));
      const afe = afeScope.match(/\bAF\b\s*[:\-]?\s*([\d.]{4,}-?\d)/) || afeScope.match(/\b(\d\.?\d{4,6}-\d)\b/);
      if (afe) out.afe = afe[1];
    }
    return out;
  }

  /* ------------------------------------------------------------- CRF */
  function extractCrf(raw) {
    const out = empty(CATALOG.certidao_regularidade_crf.fields);
    const lines = mkLines(raw);
    const titleHit = findLine(lines, /certidao de regularidade/);
    const top = titleHit ? titleHit.i : 0;
    const estabHit = findLine(lines, /nome do estabelecimento|razao social/, top);

    // Nº de registro da certidão ("Reg Nº").
    const reg = findLine(lines, /\breg(istro)?\.?\s*n\S{0,2}\s*[:.]?\s*\d{3,7}|\breg\s*n/, top, top + 12);
    if (reg) { const m = fixDigits(lines[reg.i].slice(reg.start)).match(/(\d{3,7})(?!\d)/); if (m) out.numero_certidao = m[1]; }
    if (!out.numero_certidao) {
      const limit = estabHit ? estabHit.i + 1 : top + 8;
      for (let i = top; i < Math.min(lines.length, limit); i++) {
        const l = fixDigits(lines[i]);
        if (/\d{14}|\d{2}\.\d{3}\.\d{3}/.test(l)) continue;
        const m = l.match(/(?:^|[^\d])(\d{4,6})(?:[^\d]|$)/);
        if (m && l.replace(/[^\p{L}]/gu, '').length <= 8) { out.numero_certidao = m[1]; break; }
      }
    }

    // Razão social e CNPJ.
    out.razao_social = after(lines, /razao social/, { stop: /\bcnpj\b|endereco|\s{3,}/ });
    if (!out.razao_social) {
      for (let i = top; i < Math.min(lines.length, top + 16); i++) {
        const m = lines[i].match(/([\p{Lu}][\p{Lu}\d .&\-]{2,}\s(?:LTDA|S\/?A|EIRELI|EPP|ME)\b\.?)/u);
        if (m) { out.razao_social = clean(m[1]).replace(/^[a-z]{1,2}\s+(?=[\p{Lu}])/u, ''); break; }
      }
    }
    const cnpjs = cnpjsIn(raw);
    // Somente CNPJ com dígitos verificadores válidos; não se juntam dígitos de linhas diferentes.
    const validCnpj = cnpjs.find(c => c.valid);
    if (validCnpj) out.cnpj = validCnpj.value;

    // Ramo de atividade.
    const ramoRx = /\b(drogaria|farmacia(?: de manipulacao| com manipulacao| sem manipulacao| hospitalar)?|dispensario de medicamentos|posto de medicamentos|distribuidora|importadora)\b/;
    const ramoHit = findLine(lines, /ramo\s+d[aeo]\s+a\w*/, top);
    const ramoScope = ramoHit ? lines.slice(ramoHit.i, ramoHit.i + 3) : lines.slice(top, top + 20);
    for (const l of ramoScope) {
      const n = nk(l);
      if (/conselho|tratando|federal|regional/.test(n)) continue;
      const m = n.match(ramoRx);
      if (m) { out.ramo_atividade = clean(l.substr(m.index, m[0].length)).toUpperCase(); break; }
    }

    // Seções: horário do estabelecimento, RT e substitutos.
    const rtHead = findLine(lines, /^\W*r[ae]sp[o0]n\w*\s+t[eé]?c\w*/, top);
    const subHead = findLine(lines, /subs\w*tut|farmac\w*\W*a?\W*sub/, rtHead ? rtHead.i + 1 : top);
    const footer = findLine(lines, /esta certidao deve|certificamos que|afixada/, top);
    const endAll = footer ? footer.i : lines.length;
    const personLine = l => {
      // Tokens do nome separados por um único espaço: três ou mais espaços = outra coluna.
      const m = l.match(/\b(?:Dra?|DRA?|Dr\(a\))\.?\s+((?:[\p{Lu}][\p{Lu}'\-]* ){1,7}[\p{Lu}][\p{Lu}'\-]+)/u);
      if (!m) return null;
      const tail = fixDigits(l.slice(m.index + m[0].length));
      // Número isolado (sem letra colada): "T4723" não vira "4723".
      const num = tail.match(/(?:^|[^\p{L}\d])(\d{3,6})(?![\d\p{L}])/u);
      return { name: clean(m[1].replace(/\s+(FARMAC\S*|AL|IH|I)$/u, '')), crf: num ? num[1] : '' };
    };
    // Horário do estabelecimento: linhas antes do bloco do RT (rótulo ou primeira pessoa).
    const firstPerson = lines.findIndex((l, i) => i > top && personLine(l));
    const hoursEnd = Math.min(...[rtHead && rtHead.i, subHead && subHead.i, firstPerson > top ? firstPerson : null, endAll].filter(v => typeof v === 'number'));
    const hourRx = /^\W*(r[o0][dt]?[il1]n[ao]|p[lt]?[al][nm][td][a]?[o0d]\w?|horario)\b/;
    const hours = lines.slice(top, hoursEnd).filter(l => hourRx.test(nk(l)) && /\d{1,2}\s?[:h.)]\s?\d{2}/.test(l))
      .map(l => clean(l.replace(/\s{3,}.*$/, ''))
        .replace(/^\W*r\w{4,6}\s*[:;]/i, 'Rotina:').replace(/^\W*p\w{5,8}\s*[:;]/i, 'Plantão:')
        .replace(/(\d)\s*h(?=\s)/g, '$1'));
    out.rotina = unique(hours).join('\n');

    if (rtHead) {
      for (let i = rtHead.i; i < Math.min(subHead ? subHead.i : endAll, rtHead.i + 4); i++) {
        const p = personLine(lines[i]); if (p) { out.responsavel_tecnico = p.name; out.numero_conselho_responsavel_tecnico = p.crf; break; }
      }
    }
    if (!out.responsavel_tecnico) {
      const p = lines.slice(top, endAll).map(personLine).find(Boolean);
      if (p) { out.responsavel_tecnico = p.name; out.numero_conselho_responsavel_tecnico = p.crf; }
    }
    if (subHead) {
      const subs = lines.slice(subHead.i, endAll).map(personLine).filter(Boolean);
      if (subs.length) {
        out.responsavel_tecnico_substituto = subs.map(p => p.name).join('; ');
        out.numero_conselho_responsavel_tecnico_substituto = subs.map(p => p.crf || '?').join('; ');
      }
    }

    // Data de emissão: "SÃO PAULO, 10 DE OUTUBRO DE 2024" ou "expedida em ...".
    const cityDate = lines.filter(l => /^\W*s[aã]o paulo\s*,/i.test(l) || /,\s*\d{1,2}\s+de\s+\p{L}+\s+de\s+\d{4}/iu.test(l)).map(l => firstDateIn(l)).filter(Boolean);
    const expDate = lines.filter(l => /expedid/.test(nk(l))).map(l => firstDateIn(l)).filter(Boolean);
    out.data_emissao = cityDate[cityDate.length - 1] || expDate[0] || '';
    return out;
  }

  /* ------------------------------------------------------- AVCB / CLCB */
  function extractAvcbClcb(raw) {
    const out = empty(CATALOG.avcb_clcb.fields);
    const lines = mkLines(raw), n = nk(fixDigits(raw));
    const numHit = n.match(/\b(avcb|clcb|aveb|avc8|cleb|clc8)\s*n\S{0,2}\s*[:.]?\s*(\d[\d.\s]{3,9}\d)/);
    if (numHit) {
      out.tipo_documento = /^cl/.test(numHit[1]) ? 'CLCB' : 'AVCB';
      out.numero = digits(numHit[2]);
    }
    if (!out.tipo_documento) out.tipo_documento = /certificado de licenca do corpo de bombeiros|\bclcb\b/.test(n) ? 'CLCB' : /auto de vistoria|\bavcb\b/.test(n) ? 'AVCB' : '';
    const proj = n.match(/projeto\s*n\S{0,2}\s*[:.]?\s*([\d\/\s]{6,30}\d)/);
    if (proj) out.projeto = proj[1].replace(/\s+/g, '');

    const endHit = findLine(lines, /endereco/);
    if (endHit) {
      const rest = lines[endHit.i].slice(endHit.end).replace(/^[\s:;.=\-–—_]+/, '');
      const street = cutStop(rest, /\bn[ºo°]\s*[:.]|\bnumero\b|\s{3,}/);
      const nm = fixDigits(rest).match(/n[ºo°]\s*[.:]\s*[.:]?\s*(\d{1,6})/i) || fixDigits(rest).match(/\s(\d{1,6})\s*$/);
      const bairro = after(lines, /\bbairro\b/, { stop: /\s{3,}|municipio/, next: false, from: endHit.i, to: endHit.i + 3 });
      const municipio = after(lines, /\bmunicipio\b/, { stop: /\s{3,}|ocupacao/, next: false, from: endHit.i, to: endHit.i + 4 });
      out.endereco_completo = [clean(street), nm ? nm[1] : '', bairro, municipio].filter(Boolean).join(', ');
    }

    const bodyEnd = findLine(lines, /observac|notas\s*:|\bobserv/);
    out.validade = dateAfter(lines, /\bvalidade\b|\bvalid[ao]\b|\bvali\w*/, { span: 1, to: bodyEnd ? bodyEnd.i + 1 : undefined });
    if (!out.validade) {
      // Rótulo ilegível: data futura no bloco de dados (antes de observações/notas),
      // excluindo a data de expedição por extenso.
      const scope = lines.slice(0, bodyEnd ? bodyEnd.i + 1 : lines.length).filter(l => !/\bde\s+\p{L}+\s+de\s+\d{4}/iu.test(l));
      const all = scope.flatMap(l => datesIn(l).map(d => d.value));
      if (all.length) out.validade = all[all.length - 1];
    }
    return out;
  }

  /* ---------------------------------------- controle de pragas / caixa d'água */
  const COMPANY_RX = /((?:[\p{Lu}\d&][\p{Lu}\d.&'\-]*\s+){0,8}[\p{Lu}\d][\p{Lu}\d.&'\-]*\s*(?:LTDA|EIRELI|EPP|S\/A|S\.A\.)(?:\.?\s*-?\s*(?:ME|EPP))?)\b/u;
  const CLIENT_RX = /estabelecimento|cliente|nome fantasia|situad|certifica que|contratante|endereco do cliente/;

  function executorCompany(lines, keywords) {
    const clientStart = findLine(lines, CLIENT_RX);
    const scored = [];
    lines.forEach((line, i) => {
      const n = nk(line);
      if (CLIENT_RX.test(n)) return;
      const m = line.match(COMPANY_RX);
      if (!m) return;
      let score = 1;
      if (keywords.test(n)) score += 3;
      if (!clientStart || i < clientStart.i) score += 1;
      if (/drogaria|droga\b|farmacia/.test(nk(m[1]))) score -= 4;
      scored.push({ value: clean(m[1].replace(/^(?:\d[\d\/.\-]*\s+)+/, '').replace(/\s*-\s*ME$/, ' - ME')), score, i });
    });
    scored.sort((a, b) => b.score - a.score || a.i - b.i);
    return scored.length && scored[0].score > 0 ? scored[0].value : '';
  }

  function executorCnpj(lines) {
    const clientStart = findLine(lines, CLIENT_RX);
    const all = [];
    lines.forEach((line, i) => cnpjsIn(line).forEach(c => all.push({ ...c, i, client: CLIENT_RX.test(nk(line)) || CLIENT_RX.test(nk(lines[i - 1] || '')) })));
    const pool = all.filter(c => !c.client);
    if (!pool.length) return '';
    const count = v => pool.filter(c => digits(c.value) === digits(v)).length;
    pool.sort((a, b) => (count(b.value) - count(a.value)) || ((clientStart && a.i < clientStart.i ? -1 : 0) - (clientStart && b.i < clientStart.i ? -1 : 0)) || (b.valid - a.valid) || a.i - b.i);
    return pool[0].value;
  }

  const PEST_KEYS = /dedetiz|praga|desinset|desratiz|imuniz|controle|saneamento|ambiental|higieniz|limpeza/;

  function extractPestControl(raw) {
    const out = empty(CATALOG.controle_pragas_urbanas.fields);
    const lines = mkLines(raw);
    out.numero_certificado = after(lines, /certificado\s*n[ºo°]|n[ºo°]\s*do\s*certificado|numero do certificado|garantia\s*n[ºo°]|ordem de servico\s*n|\bo\.?s\.?\s*n[ºo°]/, { stop: /\s{3,}|data|validade/, next: false, accept: v => /\d/.test(v) });
    out.empresa_executora = executorCompany(lines, PEST_KEYS);
    if (!out.empresa_executora) {
      const brand = lines.find(l => /dedetizadora|controle de pragas|imunizadora|desinsetizadora/i.test(l) && !CLIENT_RX.test(nk(l)));
      if (brand) out.empresa_executora = clean(brand.replace(/[^\p{L}\d .&\-]/gu, ' '));
    }
    out.cnpj_empresa_executora = executorCnpj(lines);
    const cevsHit = findLine(lines, /\b[ce]?[ce]vs\b|licenca sanitaria|alvara/);
    if (cevsHit) out.cevs_empresa_executora = (cevsIn(lines.slice(cevsHit.i, cevsHit.i + 2).join(' '))[0] || {}).value || '';
    out.data_realizacao = dateAfter(lines, /desinsetiza\w*\s*em|desratiza\w*\s*em|dedetiza\w*\s*em|realizad[oa]\s*em|executad[oa]\s*em|data\s*d[aeo]\s*(realizacao|execucao|aplicacao|servico|tratamento)|data\s*:/);
    out.validade = dateAfter(lines, /\bvalidade\b|garantia\s*ate|valido\s*ate|vencimento/);
    return out;
  }

  function extractWaterCleaning(raw) {
    const out = empty(CATALOG.higienizacao_caixa_agua.fields);
    const lines = mkLines(raw);
    out.empresa_executora = executorCompany(lines, PEST_KEYS);
    out.cnpj_empresa_executora = executorCnpj(lines);
    out.data_realizacao = dateAfter(lines, /data\s*d[aeo]\s*(execucao|realizacao|limpeza|higienizacao|servico)|execu\w*\s*:|realizad[oa]\s*em|executad[oa]\s*em/);
    out.validade = dateAfter(lines, /data\s*de\s*validade|\bvalidade\b|valido\s*ate|proxima\s*(limpeza|higienizacao)/);
    return out;
  }

  /* ------------------------------------------------------- calibração */
  function extractCalibration(raw) {
    const out = empty(CATALOG.calibracao_termohigrometro.fields);
    const all = mkLines(raw);
    const standards = findLine(all, /padroes\s*utilizados|padrao\s*utilizado|rastreabilidade/);
    const lines = standards ? all.slice(0, standards.i) : all;
    const stopCommon = /\s{3,}|certificado rastreado|folha|fabricante|marca|modelo|n[ºo°]\s*de\s*serie|numero de serie|resolucao|identificacao|faixa/;

    out.numero_certificado = after(lines, /n[uú]?mero\s*do\s*certificado|certificado\s*n[ºo°.]|n[ºo°]\s*do\s*certificado/, { stop: stopCommon, next: true, accept: v => /\d/.test(v) });
    // Laboratório: marca citada no procedimento ("padrão de trabalho do Laboratório ... da Labelt")
    const brand = nk(raw).match(/laboratorio de [a-z &]+?\s+(?:da|do)\s+([a-z][a-z0-9&\-]{2,})/);
    const labLine = after(lines, /laboratorio\s*(de|da|do)?\s*[a-z &]*[:\-]|laboratorio responsavel|executado por|empresa responsavel/, { stop: /\s{3,}|numero|certificado/, next: false });
    const labHeader = (lines.find(l => /laborat[oó]rio\s+de/i.test(l)) || '').replace(/^.*?(laborat[oó]rio)/i, '$1');
    const brandName = brand ? raw.substr(nk(raw).indexOf(brand[1]), brand[1].length) : '';
    out.empresa_responsavel = clean([brandName, clean(labHeader) || labLine].filter(Boolean).join(' — '));

    out.instrumento_equipamento = after(lines, /\binstrumento\b|descricao do equipamento|\bequipamento\b/, { stop: stopCommon, next: false });
    out.identificacao = after(lines, /identificacao|\btag\b|patrimonio/, { stop: /\s{3,}|marca|fabricante|modelo|serie/, next: false, accept: v => /\d/.test(v) });
    out.numero_serie = after(lines, /n[ºo°.]?\s*de\s*s[eé]rie|numero\s*de\s*serie|\bserie\s*:/, { stop: /\s{3,}|registro|modelo|marca/, next: false, accept: v => /\d/.test(v) });
    out.marca_fabricante = after(lines, /marca\s*\/\s*fabricante|\bfabricante\b|\bmarca\b/, { stop: /\s{3,}|modelo|identificacao|temperatura|serie/, next: false });
    out.modelo = after(lines, /\bmodelo\b/, { stop: /\s{3,}|identificacao|marca|serie/, next: false });
    out.lote = after(lines, /\blote\b/, { stop: /\s{3,}/, next: false, accept: v => /\d/.test(v) });
    out.data_calibracao = dateAfter(lines, /data\s*d[ae]\s*calibra\w*|calibrado\s*em/, { span: 1 });
    out.validade = dateAfter(lines, /proxima\s*calibra\w*|valido\s*ate|vencimento/, { monthYear: true, span: 1 })
      || dateAfter(lines, /\bvalidade\b/, { monthYear: true, span: 1 });
    return out;
  }

  /* --------------------------------------------------------------- ASO */
  function extractAso(raw) {
    const out = empty(CATALOG.aso.fields);
    const lines = mkLines(raw);
    const t = nk(raw).match(/\b(admissional|periodico|demissional|retorno\s+ao\s+trabalho|mudanca\s+de\s+(?:risco|funcao))\b/);
    if (t) out.tipo = { periodico: 'Periódico', admissional: 'Admissional', demissional: 'Demissional' }[t[1]] || clean(t[1]).replace(/^./, c => c.toUpperCase()).replace('mudanca', 'mudança').replace('funcao', 'função');

    const below = (rx, stop) => {
      const hit = findLine(lines, rx);
      if (!hit) return '';
      const same = cleanName(cutStop(lines[hit.i].slice(hit.end), stop));
      if (same.split(' ').length >= 2) return same;
      for (let j = hit.i + 1; j <= hit.i + 2 && j < lines.length; j++) {
        const cand = lines[j].replace(/(\d[\d.\/\-]{8,})/g, ' ');
        const name = cleanName(cutStop(cand, stop));
        if (name.split(' ').length >= 2) return name;
      }
      return '';
    };
    out.nome_funcionario = below(/nome do (funcionario|trabalhador|colaborador)|\bfuncionari[oa]\b|\btrabalhador\b|\bcolaborador\b|\bempregad[oa]\b/, /\bcpf\b|\brg\b|matricula|\s{3,}/);
    out.empresa_responsavel = below(/^\W*(empresa|empregador|razao social)\b/, /\bcnpj\b|\s{3,}/);

    // Médico examinador: carimbo com CRM que não seja o coordenador do PCMSO.
    const pcmsoIdx = lines.findIndex(l => /pcmso/.test(nk(l)));
    const pcmsoName = pcmsoIdx >= 0 ? (lines.slice(pcmsoIdx, pcmsoIdx + 3).map(l => { const m = l.match(/Dr\(?a?\)?\.?\s*([\p{Lu}][\p{L}]+(?:\s+(?:de|da|do|dos|das|e|[\p{Lu}][\p{L}]+))+)/u); return m ? clean(m[1]) : ''; }).find(Boolean) || '') : '';
    const doctors = [];
    lines.forEach((l, i) => {
      if (!/\bcrm\b/i.test(l)) return;
      const scope = [lines[i - 2] || '', lines[i - 1] || '', l].join(' ');
      const m = scope.match(/(?:Dra?\.?|Dr\(a\)\.?|VICTOR|[\p{Lu}][\p{L}]+)\s*((?:[\p{Lu}][\p{L}.]*\s+){1,5}[\p{Lu}][\p{L}]+)(?=[^\p{L}]*(?:medic|crm|\s*$))/u);
      const crm = fixDigits(l).match(/crm\s*[\/:\-]?\s*(?:[a-z]{2})?\s*[:\/\-]?\s*([\d.]{4,9})/i);
      if (m) doctors.push({ name: clean(m[0].replace(/^(?:Dra?\.?|Dr\(a\)\.?)\s*/, '')), crm: crm ? digits(crm[1]) : '' });
    });
    const examiner = doctors.find(d => d.name && pcmsoName && !nk(d.name).includes(nk(pcmsoName).split(' ')[0]) && !/medicina do trabalho|pcmso/.test(nk(d.name)));
    if (examiner) out.medico_assinante = examiner.name + (examiner.crm ? ' — CRM ' + examiner.crm : '');
    // Coordenador do PCMSO não é examinador: sem carimbo legível do examinador, o campo fica vazio.

    out.data_emissao = dateAfter(lines, /\bemissao\b|data de emissao|data do aso/, { span: 1 });
    // Somente data na linha do exame clínico ou após rótulo explícito. Sem inferência
    // a partir de outras datas do documento (nascimento, impressão, validade).
    const examLine = lines.find(l => /exame\s+m[eé]dico|exame\s+cl[ií]nico/i.test(l) && !/nascimento/i.test(l) && datesIn(l).length);
    out.data_exame = (examLine && firstDateIn(examLine)) || dateAfter(lines, /data do exame|data de realizacao do exame/, { span: 1 }) || '';
    return out;
  }

  /* -------------------------------------------------- mapas e balanços */
  function extractMapsBalances(raw) {
    const out = empty(CATALOG.comprovante_mapas_balancos.fields);
    const lines = mkLines(raw), s = text(raw).replace(/[“”„]/g, '"');
    const num = fixDigits(nk(s)).match(/solicitac\w*\s*(?:n[ºo°.]*\s*)?[:\-]?\s*(\d{6,12})/) || fixDigits(nk(s)).match(/protocolo\s*(?:n[ºo°.]*\s*)?[:\-]?\s*(\d{6,12})/);
    if (num) out.numero_solicitacao = num[1];
    const est = lines.find(l => /\b(LTDA|EPP|EIRELI|S\/A|ME)\b/.test(l) && !/prefeitura/i.test(l) && /,\s*$|filial|loja/i.test(l)) || lines.find(l => /\b(LTDA|EPP|EIRELI|S\/A)\b/.test(l) && !/prefeitura/i.test(l));
    if (est) out.estabelecimento = clean(est);
    const flat = s.replace(/\s*\n\s*/g, ' ');
    const q = flat.match(/servi[cç]o\s*["'«]\s*([^"'»]{10,220}?)\s*["'»]/i);
    if (q) out.servico = clean(q[1]);
    else {
      const m = flat.match(/((?:farm[aá]cias?[^.]{0,60})?entregar\s+balan[cç]os[^"]{0,120}?portaria\s*344\s*\/\s*98)/i) || flat.match(/((?:mapas?|balan[cç]os?)[^\n"]{0,140})/i);
      if (m) out.servico = clean(m[1]);
    }
    // Data do envio: cabeçalho de impressão do navegador "dd/mm/aaaa, hh:mm".
    const header = fixDigits(s).match(/(\d{1,2})\s?[\/.\-]\s?(\d{1,2})\s?[\/.\-]\s?(\d{4}),?\s+\d{1,2}:\d{2}/);
    out.data_envio = (header && mkDate(header[1], header[2], header[3])) || dateAfter(lines, /data do envio|enviado em|solicitado em|data da solicitacao|data de abertura/) || '';
    return out;
  }

  /* ----------------------------------------------- demais documentos */
  function extractSummary(raw) {
    const lines = mkLines(raw);
    const start = lines.findIndex(line => /sum[aá]rio|[íi]ndice|lista de documentos/i.test(line));
    const base = start >= 0 ? lines.slice(start + 1) : lines;
    const items = [];
    for (const line of base) {
      const item = trim(line.replace(/\.{2,}\s*\d+\s*$/, '').replace(/\s+\d{1,3}\s*$/, '').replace(/^\s*(?:\d+(?:\.\d+)*[.)\-]?|[-•])\s*/, ''));
      if (!item || /^p[aá]gina\s+\d+$/i.test(item)) continue;
      if (/^(manual|sum[aá]rio|[íi]ndice)$/i.test(item)) continue;
      if (item.length >= 4 && item.length <= 180 && /\p{L}{3,}/u.test(item)) items.push(item);
    }
    return { lista_documentos: unique(items).slice(0, 80).join('\n') };
  }

  function extractMetrologyLabel(raw) {
    const out = empty(CATALOG.etiqueta_metrologica.fields);
    const lines = mkLines(raw);
    out.numero = after(lines, /certificado|n[ºo°]\s*[:.]|numero|\bcal\b|\bos\b/, { stop: /\s{3,}|data|valid/, next: false, accept: v => /\d/.test(v) });
    out.empresa = executorCompany(lines, /calibra|metrolog|laborat|instrument/) || clean((lines.find(l => /laborat|metrolog|calibra/i.test(l) && !/data|valid/i.test(l)) || ''));
    out.data_calibracao = dateAfter(lines, /data\s*d[ae]\s*calibra\w*|calibrad[oa]\s*em|\bcalibracao\b|\bdata\b/, { span: 1 });
    out.validade = dateAfter(lines, /\bvalidade\b|proxima\s*calibra\w*|\bprox\w*|vencimento|valido\s*ate/, { monthYear: true, span: 1 });
    if (!out.data_calibracao || !out.validade) {
      const ds = datesIn(raw, { monthYear: true }).map(d => d.value);
      if (!out.data_calibracao && ds[0] && ds[0] !== out.validade) out.data_calibracao = ds[0];
      if (!out.validade && ds[1]) out.validade = ds[1];
    }
    return out;
  }

  function extractProcedure(raw) {
    const out = empty(CATALOG.pop_manual_pgrss.fields);
    const lines = mkLines(raw);
    const firstLines = lines.slice(0, 20);
    out.nome = after(lines, /nome do documento|codigo|\bpop\s*n[ºo°]/, { stop: /\s{3,}|revisao|versao|data/, next: false });
    out.data_elaboracao = dateAfter(lines, /data de elaboracao|elaborad[oa]\s*em|\belaboracao\b|data de emissao|\bemissao\b/, { span: 1 });
    out.titulo = after(lines, /\btitulo\b|\bassunto\b/, { stop: /\s{3,}|codigo|revisao|versao/ }) || clean(firstLines.find(line => /\b(POP|manual|pgrss|procedimento operacional|plano de gerenciamento)\b/i.test(line)) || '');
    out.responsaveis = after(lines, /elaborad[oa]\s*por|aprovad[oa]\s*por|responsaveis|responsavel tecnico|responsavel/, { stop: /\s{3,}|data|assinatura|crf\s*[:\-]?\s*$/, next: true });
    out.vigencia = dateAfter(lines, /vigencia|valido\s*ate|proxima\s*revisao|data de revisao|\brevisao\b/, { monthYear: true, span: 1 });
    return out;
  }

  function extractSngpcDigital(raw) {
    const out = empty(CATALOG.sngpc_escrituracao_digital.fields);
    const lines = mkLines(raw);
    out.razao_social = after(lines, /razao social|estabelecimento|farmacia\s*\/\s*drogaria/, { stop: /\bcnpj\b|\s{3,}|endereco/ });
    const c = cnpjsIn(raw); out.cnpj = c.length ? (c.find(x => x.valid) || c[0]).value : '';
    out.data_adesao = dateAfter(lines, /data\s*de\s*adesao|\badesao\b|inicio da escrituracao|data\s*de\s*inicio/, { span: 1 });
    out.data_geracao_documento = dateAfter(lines, /data\s*de\s*geracao|gerad[oa]\s*em|emitid[oa]\s*em|\bemissao\b|data\s*da\s*consulta/, { span: 1 });
    return out;
  }

  function extractSngpcTransmission(raw) {
    const out = empty(CATALOG.sngpc_transmissao_regular.fields);
    const lines = mkLines(raw);
    out.razao_social = after(lines, /razao social|estabelecimento|farmacia\s*\/\s*drogaria/, { stop: /\bcnpj\b|\s{3,}|endereco/ });
    const c = cnpjsIn(raw); out.cnpj = c.length ? (c.find(x => x.valid) || c[0]).value : '';
    out.data_ultima_transmissao = dateAfter(lines, /ultim[oa]\s*(transmissao|arquivo|envio)|data\s*da\s*ultima|transmitid[oa]\s*em|periodo\s*transmitido/, { span: 1 });
    out.data_geracao_documento = dateAfter(lines, /data\s*de\s*geracao|gerad[oa]\s*em|emitid[oa]\s*em|\bemissao\b|data\s*da\s*consulta/, { span: 1 });
    return out;
  }

  function extractDanfeXml(raw) {
    try {
      if (!/<\s*(nfeProc|NFe|infNFe)\b/i.test(raw)) return null;
      const doc = new DOMParser().parseFromString(raw, 'application/xml');
      if (doc.querySelector('parsererror')) return null;
      const get = (parent, name) => parent && parent.getElementsByTagNameNS('*', name)[0] ? trim(parent.getElementsByTagNameNS('*', name)[0].textContent) : '';
      const emit = doc.getElementsByTagNameNS('*', 'emit')[0];
      const ide = doc.getElementsByTagNameNS('*', 'ide')[0];
      if (!emit && !ide) return null;
      const emission = get(ide, 'dhEmi') || get(ide, 'dEmi');
      const iso = emission.match(/^(\d{4})-(\d{2})-(\d{2})/);
      return {
        cnpj_emitente: get(emit, 'CNPJ') ? fmtCnpj(get(emit, 'CNPJ')) : '',
        razao_social_emitente: get(emit, 'xNome'),
        data_emissao: iso ? iso[3] + '/' + iso[2] + '/' + iso[1] : emission,
        numero_nota: get(ide, 'nNF'),
        // Na NF-e, o emitente é juridicamente o remetente.
        cnpj_remetente: get(emit, 'CNPJ') ? fmtCnpj(get(emit, 'CNPJ')) : ''
      };
    } catch (_) { return null; }
  }

  function nfeKey(raw) {
    const candidates = fixDigits(raw).match(/(?:\d[\s.]*){44}/g) || [];
    for (const c of candidates) {
      const k = digits(c).slice(0, 44);
      if (k.length !== 44) continue;
      let sum = 0, w = 2;
      for (let i = 42; i >= 0; i--) { sum += Number(k[i]) * w; w = w === 9 ? 2 : w + 1; }
      const mod = 11 - (sum % 11), dv = mod >= 10 ? 0 : mod;
      if (Number(k[43]) === dv) return k;
    }
    return '';
  }

  function extractDanfe(raw) {
    const xml = extractDanfeXml(raw);
    if (xml) return xml;
    const out = empty(CATALOG.danfe_nfe.fields);
    const lines = mkLines(raw);
    const key = nfeKey(raw);
    const labelled = lines.map((l, i) => ({ l, i })).filter(x => /emitente|remetente/.test(nk(x.l)));
    const cnpjNear = labelled.flatMap(x => cnpjsIn(lines.slice(x.i, x.i + 4).join(' ')));
    out.cnpj_emitente = key ? fmtCnpj(key.slice(6, 20)) : ((cnpjNear[0] || cnpjsIn(raw)[0] || {}).value || '');
    out.razao_social_emitente = after(lines, /identificacao do emitente|emitente|razao social/, { stop: /\bcnpj\b|\s{3,}|endereco|inscricao/ });
    out.data_emissao = dateAfter(lines, /data\s*(de|da)\s*emissao|\bemissao\b/, { span: 2 });
    const nn = fixDigits(nk(raw)).match(/\bn[ºo°.]?\s*[:.]?\s*(\d{3}\.?\d{3}\.?\d{3})\b/) || fixDigits(nk(raw)).match(/numero\s*(?:da nota)?\s*[:.]?\s*(\d[\d.]{2,11})/);
    out.numero_nota = key ? String(Number(key.slice(25, 34))) : (nn ? String(Number(digits(nn[1]))) : '');
    out.cnpj_remetente = out.cnpj_emitente;
    return out;
  }

  const EXTRACTORS = Object.freeze({
    licenca_sanitaria: extractLicense,
    certidao_regularidade_crf: extractCrf,
    avcb_clcb: extractAvcbClcb,
    controle_pragas_urbanas: extractPestControl,
    higienizacao_caixa_agua: extractWaterCleaning,
    calibracao_termohigrometro: extractCalibration,
    sumario_documentos: extractSummary,
    etiqueta_metrologica: extractMetrologyLabel,
    aso: extractAso,
    pop_manual_pgrss: extractProcedure,
    comprovante_mapas_balancos: extractMapsBalances,
    sngpc_escrituracao_digital: extractSngpcDigital,
    sngpc_transmissao_regular: extractSngpcTransmission,
    danfe_nfe: extractDanfe
  });

  function inspectFields(type, fields) {
    const spec = CATALOG[type];
    const missing = spec.fields.filter(key => !trim(fields[key]));
    const found = spec.fields.filter(key => trim(fields[key]));
    const missingRequired = (spec.required || spec.fields).filter(key => !trim(fields[key]));
    return { found, missing, missingRequired, complete: !missing.length };
  }
  function safeExtract(type, raw) {
    try { return { ...empty(CATALOG[type].fields), ...EXTRACTORS[type](text(raw)) }; }
    catch (error) { console.warn('[DrogariaOcrTools] extrator ' + type + ':', error); return empty(CATALOG[type].fields); }
  }

  function extract(type, rawText, meta = {}) {
    if (!CATALOG[type] || !EXTRACTORS[type]) throw new Error('Tipo documental não reconhecido: ' + type);
    const fields = meta.fields ? { ...empty(CATALOG[type].fields), ...meta.fields } : safeExtract(type, rawText);
    const review = inspectFields(type, fields);
    return {
      version: VERSION,
      documentType: type,
      documentTitle: CATALOG[type].title,
      fields,
      labels: Object.fromEntries(CATALOG[type].fields.map(k => [k, LABELS[k] || k.replaceAll('_', ' ')])),
      review,
      rawText: text(rawText),
      source: {
        filename: meta.filename || '',
        method: meta.method || '',
        readAt: meta.readAt || new Date().toISOString(),
        passes: meta.passes || []
      },
      status: review.complete ? 'pronto_para_conferencia' : 'conferencia_obrigatoria'
    };
  }

  // Combina campos de várias leituras: valor repetido vence; em empate, a leitura de maior qualidade.
  function mergeFields(type, readings) {
    const out = empty(CATALOG[type].fields);
    for (const key of CATALOG[type].fields) {
      const votes = new Map();
      readings.forEach(r => {
        const v = trim(r.fields[key]);
        if (!v) return;
        const k = normalize(v).replace(/[^a-z0-9]/g, '');
        const cur = votes.get(k) || { value: v, weight: 0, count: 0 };
        cur.weight += r.quality; cur.count += 1;
        if (v.length > cur.value.length && r.quality >= cur.weight / cur.count) cur.value = v;
        votes.set(k, cur);
      });
      const best = [...votes.values()].sort((a, b) => b.count - a.count || b.weight - a.weight)[0];
      if (best) out[key] = best.value;
    }
    return out;
  }

  /* =================================================================== LEITURA */
  const scriptPromises = new Map();
  function loadScript(urls, globalName) {
    if (window[globalName]) return Promise.resolve();
    if (!scriptPromises.has(globalName)) {
      scriptPromises.set(globalName, (async () => {
        for (const src of urls) {
          try {
            await new Promise((resolve, reject) => {
              const s = document.createElement('script');
              s.src = src; s.async = true; s.onload = resolve;
              s.onerror = () => { s.remove(); reject(new Error(src)); };
              document.head.appendChild(s);
            });
            if (window[globalName]) return;
          } catch (_) { /* tenta o próximo endereço */ }
        }
        throw new Error('Não foi possível carregar o leitor (' + globalName + '). Na primeira utilização o leitor precisa de internet para ser baixado.');
      })().catch(error => { scriptPromises.delete(globalName); throw error; }));
    }
    return scriptPromises.get(globalName);
  }

  async function pdfLib() {
    await loadScript(CDN.pdf, 'pdfjsLib');
    const lib = window.pdfjsLib;
    if (lib.GlobalWorkerOptions && !lib.GlobalWorkerOptions.workerSrc) lib.GlobalWorkerOptions.workerSrc = CDN.pdfWorker[0];
    return lib;
  }

  let workerPromise = null, workerTimer = null, workerLog = () => {};
  async function ocrWorker() {
    await loadScript(CDN.tesseract, 'Tesseract');
    clearTimeout(workerTimer);
    if (!workerPromise) {
      workerPromise = Promise.resolve(window.Tesseract.createWorker(OCR_LANG, 1, { logger: m => workerLog(m) }))
        .catch(error => { workerPromise = null; throw new Error('Falha ao iniciar o reconhecimento de texto: ' + ((error && error.message) || error)); });
    }
    return workerPromise;
  }
  function releaseWorkerSoon() {
    clearTimeout(workerTimer);
    workerTimer = setTimeout(async () => {
      const pending = workerPromise; workerPromise = null;
      if (pending) { try { await (await pending).terminate(); } catch (_) { /* ignorado */ } }
    }, 90000);
  }
  const STATUS_PT = { 'loading tesseract core': 'carregando o leitor', 'initializing tesseract': 'iniciando o leitor', 'loading language traineddata': 'carregando o dicionário português', 'initializing api': 'iniciando o reconhecimento', 'recognizing text': 'reconhecendo texto' };

  function wordQuality(data) {
    const words = (data.words && data.words.length) ? data.words
      : (data.blocks || []).flatMap(b => (b.paragraphs || []).flatMap(p => (p.lines || []).flatMap(l => l.words || [])));
    let good = 0, score = 0;
    for (const w of words) {
      const t = text(w.text).replace(/[^\p{L}\d]/gu, '');
      if (t.length >= 3 && w.confidence >= 60 && /\p{L}{3,}|\d{3,}/u.test(t)) { good++; score += Math.min(t.length, 12); }
    }
    return { good, score, words: words.length };
  }

  async function recognize(canvas, { psm = '3', label = '', progress = () => {} } = {}) {
    const worker = await ocrWorker();
    workerLog = m => {
      if (!m || !m.status) return;
      const pt = STATUS_PT[m.status] || m.status;
      progress(m.status === 'recognizing text' ? label + ' — ' + Math.round((m.progress || 0) * 100) + '%' : 'Preparando: ' + pt + '…');
    };
    await worker.setParameters({ tessedit_pageseg_mode: String(psm), preserve_interword_spaces: '1', user_defined_dpi: '300' });
    const result = await worker.recognize(canvas, { rotateAuto: true }, { text: true, blocks: true, hocr: false, tsv: false });
    const data = (result && result.data) || {};
    return { text: text(data.text), quality: wordQuality(data), confidence: data.confidence || 0 };
  }

  /* ----------------------------------------------------------- imagem */
  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
    return c;
  }
  function freeCanvas(c) { if (c) { try { c.width = 0; c.height = 0; } catch (_) { /* ignorado */ } } }

  function targetScale(w, h, { longSide = 2800, maxPixels = 7.5e6, maxScale = 3.5, minLong = 1800 } = {}) {
    const long = Math.max(w, h);
    let scale = Math.min(longSide / long, maxScale);
    if (long * scale < minLong) scale = Math.min(minLong / long, maxScale);
    if (w * h * scale * scale > maxPixels) scale = Math.sqrt(maxPixels / (w * h));
    return scale;
  }

  async function fileToCanvas(file) {
    let source = null, w = 0, h = 0, cleanup = () => {};
    if (typeof createImageBitmap === 'function') {
      try {
        source = await createImageBitmap(file, { imageOrientation: 'from-image' });
        w = source.width; h = source.height; cleanup = () => { if (source.close) source.close(); };
      } catch (_) { source = null; }
    }
    if (!source) {
      const url = URL.createObjectURL(file);
      source = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Não foi possível abrir a imagem. Use foto JPG ou PNG.'));
        image.src = url;
      });
      w = source.naturalWidth || source.width; h = source.naturalHeight || source.height;
      cleanup = () => URL.revokeObjectURL(url);
    }
    try {
      const scale = targetScale(w, h);
      const canvas = makeCanvas(w * scale, h * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      return { canvas, native: { w, h } };
    } finally { cleanup(); }
  }

  function grayOf(canvas) {
    const w = canvas.width, h = canvas.height;
    const data = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
    const g = new Uint8ClampedArray(w * h);
    for (let i = 0, j = 0; j < g.length; i += 4, j++) g[j] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
    return { g, w, h };
  }
  function grayToCanvas(img) {
    const c = makeCanvas(img.w, img.h), ctx = c.getContext('2d');
    const out = ctx.createImageData(img.w, img.h), d = out.data, g = img.g;
    for (let j = 0, i = 0; j < g.length; j++, i += 4) { d[i] = d[i + 1] = d[i + 2] = g[j]; d[i + 3] = 255; }
    ctx.putImageData(out, 0, 0);
    return c;
  }
  function rotateGray(img, deg) {
    const { g, w, h } = img;
    if (deg === 180) { const o = new Uint8ClampedArray(g.length); for (let i = 0; i < g.length; i++) o[i] = g[g.length - 1 - i]; return { g: o, w, h }; }
    const o = new Uint8ClampedArray(g.length), nw = h, nh = w;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = g[y * w + x];
      if (deg === 90) o[x * nw + (nw - 1 - y)] = v; else o[(nh - 1 - x) * nw + y] = v;
    }
    return { g: o, w: nw, h: nh };
  }
  function downscaleGray(img, maxSide) {
    const f = Math.max(1, Math.ceil(Math.max(img.w, img.h) / maxSide));
    if (f === 1) return img;
    const w = Math.floor(img.w / f), h = Math.floor(img.h / f), o = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let s = 0; for (let yy = 0; yy < f; yy++) for (let xx = 0; xx < f; xx++) s += img.g[(y * f + yy) * img.w + x * f + xx];
      o[y * w + x] = s / (f * f);
    }
    return { g: o, w, h };
  }

  function boxBlurGrid(grid, gw, gh, r) {
    if (r < 1) return grid;
    const tmp = new Float32Array(grid.length), out = new Float32Array(grid.length);
    for (let y = 0; y < gh; y++) {
      let acc = 0, n = 0;
      for (let x = -r; x < gw; x++) {
        const add = x + r, sub = x - r - 1;
        if (add < gw) { acc += grid[y * gw + add]; n++; }
        if (sub >= 0) { acc -= grid[y * gw + sub]; n--; }
        if (x >= 0) tmp[y * gw + x] = acc / n;
      }
    }
    for (let x = 0; x < gw; x++) {
      let acc = 0, n = 0;
      for (let y = -r; y < gh; y++) {
        const add = y + r, sub = y - r - 1;
        if (add < gh) { acc += tmp[add * gw + x]; n++; }
        if (sub >= 0) { acc -= tmp[sub * gw + x]; n--; }
        if (y >= 0) out[y * gw + x] = acc / n;
      }
    }
    return out;
  }
  function bilinearField(grid, gw, gh, cell, w, h, fn) {
    for (let y = 0; y < h; y++) {
      const gy = Math.min(gh - 1, Math.max(0, (y + 0.5) / cell - 0.5)), y0 = Math.floor(gy), y1 = Math.min(gh - 1, y0 + 1), fy = gy - y0;
      for (let x = 0; x < w; x++) {
        const gx = Math.min(gw - 1, Math.max(0, (x + 0.5) / cell - 0.5)), x0 = Math.floor(gx), x1 = Math.min(gw - 1, x0 + 1), fx = gx - x0;
        const top = grid[y0 * gw + x0] * (1 - fx) + grid[y0 * gw + x1] * fx;
        const bottom = grid[y1 * gw + x0] * (1 - fx) + grid[y1 * gw + x1] * fx;
        fn(y * w + x, top * (1 - fy) + bottom * fy);
      }
    }
  }

  // Remove variação de iluminação/cor de fundo: divide cada pixel pelo fundo local estimado.
  function normalizeIllumination(img) {
    const { g, w, h } = img;
    const cell = Math.max(8, Math.round(Math.min(w, h) / 48));
    const gw = Math.ceil(w / cell), gh = Math.ceil(h / cell);
    const mx = new Float32Array(gw * gh);
    for (let y = 0; y < h; y++) { const row = ((y / cell) | 0) * gw; for (let x = 0; x < w; x++) { const v = g[y * w + x], k = row + ((x / cell) | 0); if (v > mx[k]) mx[k] = v; } }
    const dil = new Float32Array(gw * gh);
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      let m = 0;
      for (let yy = Math.max(0, y - 1); yy <= Math.min(gh - 1, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(gw - 1, x + 1); xx++) if (mx[yy * gw + xx] > m) m = mx[yy * gw + xx];
      dil[y * gw + x] = m;
    }
    const bg = boxBlurGrid(dil, gw, gh, 2);
    const out = new Uint8ClampedArray(w * h);
    bilinearField(bg, gw, gh, cell, w, h, (i, b) => { out[i] = g[i] * 255 / Math.max(b, 24); });
    const hist = new Uint32Array(256); for (let i = 0; i < out.length; i++) hist[out[i]]++;
    const pct = p => { const target = out.length * p; let acc = 0; for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= target) return v; } return 255; };
    const lo = Math.min(pct(0.01), 96), hi = Math.max(pct(0.99), lo + 64), span = hi - lo;
    for (let i = 0; i < out.length; i++) out[i] = (out[i] - lo) * 255 / span;
    return { g: out, w, h };
  }

  // Binarização adaptativa (Sauvola) com estatística em grade reduzida.
  function sauvola(img, k = 0.24) {
    const { g, w, h } = img, cell = 4;
    const gw = Math.ceil(w / cell), gh = Math.ceil(h / cell), n = new Float32Array(gw * gh), mean = new Float32Array(gw * gh), sq = new Float32Array(gw * gh);
    for (let y = 0; y < h; y++) { const row = ((y / cell) | 0) * gw; for (let x = 0; x < w; x++) { const v = g[y * w + x], idx = row + ((x / cell) | 0); mean[idx] += v; sq[idx] += v * v; n[idx]++; } }
    for (let i = 0; i < mean.length; i++) { mean[i] /= n[i]; sq[i] /= n[i]; }
    const r = Math.max(2, Math.round(Math.min(w, h) / 45 / cell / 2));
    const m = boxBlurGrid(mean, gw, gh, r), s2 = boxBlurGrid(sq, gw, gh, r), T = new Float32Array(gw * gh);
    for (let i = 0; i < T.length; i++) { const sd = Math.sqrt(Math.max(0, s2[i] - m[i] * m[i])); T[i] = m[i] * (1 + k * (sd / 128 - 1)); }
    const out = new Uint8ClampedArray(w * h);
    bilinearField(T, gw, gh, cell, w, h, (i, t) => { out[i] = g[i] > t ? 255 : 0; });
    return { g: out, w, h };
  }

  function prepared(unit, prep) {
    unit.cache ||= {};
    const rot = unit.rotation || 0, key = rot + ':' + prep;
    if (unit.cache[key]) return unit.cache[key];
    let base = unit.cache[rot + ':gray'];
    if (!base) { base = rot ? rotateGray(unit.base, rot) : unit.base; unit.cache[rot + ':gray'] = base; }
    let img;
    if (prep === 'gray') img = base;
    else if (prep === 'norm') img = normalizeIllumination(base);
    else if (prep === 'bin') img = sauvola(prepared(unit, 'norm'));
    unit.cache[key] = img;
    return img;
  }

  async function probeRotation(unit, progress) {
    const results = [];
    for (const deg of [0, 90, 270, 180]) {
      const small = normalizeIllumination(downscaleGray(deg ? rotateGray(unit.base, deg) : unit.base, 1500));
      const canvas = grayToCanvas(small);
      try {
        const r = await recognize(canvas, { psm: '3', label: 'Verificando orientação (' + deg + '°)', progress });
        results.push({ deg, score: r.quality.score });
        if (deg && r.quality.good >= 30) break;
      } finally { freeCanvas(canvas); }
    }
    const zero = (results.find(r => r.deg === 0) || { score: 0 }).score;
    const best = results.slice().sort((a, b) => b.score - a.score)[0];
    return best && best.deg && best.score > Math.max(40, zero * 1.6) ? best.deg : 0;
  }

  /* ------------------------------------------------------------- PDF */
  function linesFromTextContent(items) {
    const rows = [];
    for (const it of items || []) {
      if (!it || typeof it.str !== 'string' || !it.str.trim()) continue;
      const t = it.transform || [1, 0, 0, 1, 0, 0];
      const hgt = Math.hypot(t[2], t[3]) || it.height || 10;
      rows.push({ x: t[4], y: t[5], w: it.width || it.str.length * hgt * 0.5, h: hgt, s: it.str });
    }
    rows.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines = [];
    for (const r of rows) {
      let line = null;
      for (let k = lines.length - 1; k >= Math.max(0, lines.length - 3); k--) {
        if (Math.abs(lines[k].y - r.y) <= Math.min(lines[k].h, r.h) * 0.45) { line = lines[k]; break; }
      }
      if (!line) { line = { y: r.y, h: r.h, items: [] }; lines.push(line); }
      line.items.push(r);
    }
    return lines.map(line => {
      const items = line.items.sort((a, b) => a.x - b.x);
      let out = '', prev = null;
      for (const it of items) {
        if (prev) {
          const gap = it.x - (prev.x + prev.w);
          if (gap > it.h * 1.2) out += '   ';
          else if (gap > it.h * 0.12 && !/\s$/.test(out) && !/^\s/.test(it.s)) out += ' ';
        }
        out += it.s; prev = it;
      }
      return out.replace(/\s+$/, '');
    }).join('\n');
  }

  async function imageBoxes(lib, page, viewport) {
    const O = lib.OPS, ops = await page.getOperatorList();
    const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
    let ctm = [1, 0, 0, 1, 0, 0];
    const stack = [], boxes = [];
    const paints = new Set([O.paintImageXObject, O.paintInlineImageXObject, O.paintImageMaskXObject, O.paintJpegXObject].filter(v => v != null));
    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i], args = ops.argsArray[i];
      if (fn === O.save) stack.push(ctm);
      else if (fn === O.restore) ctm = stack.pop() || [1, 0, 0, 1, 0, 0];
      else if (fn === O.transform && args && args.length === 6) ctm = mul(ctm, args);
      else if (fn === O.paintFormXObjectBegin) { stack.push(ctm); if (args && Array.isArray(args[0]) && args[0].length === 6) ctm = mul(ctm, args[0]); }
      else if (fn === O.paintFormXObjectEnd) ctm = stack.pop() || ctm;
      else if (paints.has(fn)) {
        const pts = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => viewport.convertToViewportPoint(ctm[0] * x + ctm[2] * y + ctm[4], ctm[1] * x + ctm[3] * y + ctm[5]));
        const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
        let pw = 0, ph = 0;
        if (args && typeof args[1] === 'number') { pw = args[1]; ph = args[2]; }
        else if (args && args[0] && args[0].width) { pw = args[0].width; ph = args[0].height; }
        const x0 = Math.max(0, Math.min(...xs)), y0 = Math.max(0, Math.min(...ys));
        const x1 = Math.min(viewport.width, Math.max(...xs)), y1 = Math.min(viewport.height, Math.max(...ys));
        if (x1 > x0 && y1 > y0) boxes.push({ x: x0, y: y0, w: x1 - x0, h: y1 - y0, pw, ph });
      }
    }
    return boxes;
  }

  async function renderRegion(page, region) {
    const nativeLimit = region.nativePerPt ? Math.max(2.2, region.nativePerPt * 4) : 5;
    const scale = Math.min(targetScale(region.w, region.h, { maxScale: 6, minLong: 1800 }), nativeLimit);
    const viewport = page.getViewport({ scale });
    const canvas = makeCanvas(region.w * scale, region.h * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport, transform: [1, 0, 0, 1, -region.x * scale, -region.y * scale], background: 'rgb(255,255,255)' }).promise;
    return canvas;
  }

  async function pdfPages(file, type, progress) {
    const lib = await pdfLib();
    const pdf = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
    const maxPages = Math.min(pdf.numPages, 40);
    const maxOcrPages = /pop_manual_pgrss|sumario_documentos/.test(type) ? 6 : 4;
    const pages = [];
    let ocrPages = 0;
    for (let p = 1; p <= maxPages; p++) {
      progress('Lendo página ' + p + ' de ' + pdf.numPages + '…');
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 1 });
      const textLayer = linesFromTextContent((await page.getTextContent()).items);
      const chars = textLayer.replace(/\s/g, '').length;
      let region = null;
      if (ocrPages < maxOcrPages) {
        const pageArea = viewport.width * viewport.height;
        const boxes = (await imageBoxes(lib, page, viewport)).filter(b => b.w * b.h >= pageArea * 0.02);
        const coverage = boxes.reduce((s, b) => s + b.w * b.h, 0) / pageArea;
        if (chars < 25) region = { x: 0, y: 0, w: viewport.width, h: viewport.height };
        else if (boxes.length && coverage >= 0.12) {
          const m = viewport.width * 0.01;
          const x0 = Math.max(0, Math.min(...boxes.map(b => b.x)) - m), y0 = Math.max(0, Math.min(...boxes.map(b => b.y)) - m);
          const x1 = Math.min(viewport.width, Math.max(...boxes.map(b => b.x + b.w)) + m), y1 = Math.min(viewport.height, Math.max(...boxes.map(b => b.y + b.h)) + m);
          region = (x1 - x0) * (y1 - y0) > pageArea * 0.7 ? { x: 0, y: 0, w: viewport.width, h: viewport.height } : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
        }
        if (region) {
          const natives = boxes.filter(b => b.pw).map(b => Math.min(b.pw / b.w, b.ph / b.h));
          if (natives.length) region.nativePerPt = Math.max(...natives);
          ocrPages++;
        }
      }
      pages.push({ number: p, page, textLayer, region });
    }
    return { pdf, pages, total: pdf.numPages };
  }

  /* ------------------------------------------------- leituras múltiplas */
  const PLAN = [
    { prep: 'norm', psm: '3', name: 'leitura 1' },
    { prep: 'bin', psm: '3', name: 'leitura 2 (binarizada)' },
    { prep: 'norm', psm: '11', name: 'leitura 3 (texto esparso)' }
  ];

  async function ocrUnits(type, units, assemble, progress) {
    const readings = [];
    let merged = null;
    for (let pass = 0; pass < PLAN.length; pass++) {
      const step = PLAN[pass];
      let qualityScore = 0;
      for (let u = 0; u < units.length; u++) {
        const unit = units[u];
        if (!unit.base) {
          progress('Preparando imagem ' + (units.length > 1 ? (u + 1) + ' de ' + units.length : '') + '…');
          const canvas = await unit.getCanvas();
          unit.base = grayOf(canvas); freeCanvas(canvas);
        }
        const label = 'Reconhecendo texto — ' + step.name + (units.length > 1 ? ', ' + unit.label : '');
        let canvas = grayToCanvas(prepared(unit, step.prep));
        let r;
        try { r = await recognize(canvas, { psm: step.psm, label, progress }); } finally { freeCanvas(canvas); }
        if (pass === 0 && !unit.rotationChecked) {
          unit.rotationChecked = true;
          if (r.quality.good < 25) {
            const deg = await probeRotation(unit, progress);
            if (deg) {
              unit.rotation = deg;
              canvas = grayToCanvas(prepared(unit, step.prep));
              try { r = await recognize(canvas, { psm: step.psm, label: label + ' (rotação ' + deg + '°)', progress }); } finally { freeCanvas(canvas); }
            }
          }
        }
        unit.texts = unit.texts || [];
        unit.texts[pass] = r.text;
        qualityScore += r.quality.score;
      }
      const docText = assemble(pass);
      const fields = safeExtract(type, docText);
      const found = CATALOG[type].fields.filter(k => trim(fields[k])).length;
      readings.push({ pass, name: step.name, text: docText, fields, quality: qualityScore + found * 60, found });
      merged = mergeFields(type, readings);
      if (!inspectFields(type, merged).missingRequired.length) break;
      // Leitura sem nenhum texto útil após a 2ª passagem: não insistir.
      if (pass >= 1 && readings.every(x => x.quality < 30)) break;
    }
    for (const unit of units) { unit.cache = null; unit.base = null; }
    return { merged, readings };
  }

  function composeRaw(readings) {
    if (!readings.length) return '';
    const best = readings.slice().sort((a, b) => b.quality - a.quality)[0];
    const others = readings.filter(r => r !== best);
    return best.text + (others.length ? '\n\n——— Leituras complementares (usadas só para completar campos) ———\n' + others.map(r => '[' + r.name + ']\n' + r.text).join('\n\n') : '');
  }

  async function readImageFile(type, file, progress) {
    let nativeInfo = null;
    const unit = { label: 'imagem', getCanvas: async () => { const r = await fileToCanvas(file); nativeInfo = r.native; return r.canvas; } };
    const { merged, readings } = await ocrUnits(type, [unit], pass => unit.texts[pass] || '', progress);
    const small = nativeInfo && Math.max(nativeInfo.w, nativeInfo.h) < 1400;
    return extract(type, composeRaw(readings), {
      fields: merged, filename: file.name, readAt: new Date().toISOString(),
      method: 'Foto: OCR com correção de iluminação' + (unit.rotation ? ', rotação ' + unit.rotation + '°' : '') + ' · ' + readings.length + ' leitura(s)' + (small ? ' · imagem de baixa resolução (' + nativeInfo.w + '×' + nativeInfo.h + ')' : ''),
      passes: readings.map(r => ({ name: r.name, found: r.found, quality: Math.round(r.quality) }))
    });
  }

  async function readPdfFile(type, file, progress) {
    const { pdf, pages, total } = await pdfPages(file, type, progress);
    try {
      const ocrPages = pages.filter(p => p.region);
      const units = ocrPages.map(p => ({ label: 'página ' + p.number, pageNumber: p.number, getCanvas: () => renderRegion(p.page, p.region) }));
      const assemble = pass => pages.map(p => {
        const unit = units.find(u => u.pageNumber === p.number);
        const ocr = unit && unit.texts ? unit.texts[pass] || '' : '';
        return (total > 1 ? 'Página ' + p.number + '\n' : '') + [p.textLayer, ocr].filter(Boolean).join('\n');
      }).join('\n\n');
      const cut = total > pages.length ? ' · lidas ' + pages.length + ' de ' + total + ' páginas' : '';
      if (!units.length) {
        return extract(type, assemble(0), { filename: file.name, readAt: new Date().toISOString(), method: 'PDF: texto digital' + cut });
      }
      let result;
      try { result = await ocrUnits(type, units, assemble, progress); }
      catch (error) {
        // Sem OCR, só vale devolver o texto digital se ele já contiver os campos essenciais.
        const partial = pages.map(p => p.textLayer).join('\n\n');
        const fields = safeExtract(type, partial);
        if (!inspectFields(type, fields).missingRequired.length) {
          return extract(type, partial, { filename: file.name, readAt: new Date().toISOString(), method: 'PDF: texto digital — OCR da imagem indisponível (' + error.message + ')' + cut });
        }
        throw new Error('O documento contém imagem e o reconhecimento de texto não pôde ser executado (' + error.message + '). Na primeira utilização o leitor precisa de internet para ser baixado.');
      }
      const withText = pages.some(p => p.textLayer.replace(/\s/g, '').length >= 25);
      return extract(type, composeRaw(result.readings), {
        fields: result.merged, filename: file.name, readAt: new Date().toISOString(),
        method: 'PDF: ' + (withText ? 'texto digital + ' : '') + 'OCR da imagem (' + units.map(u => u.label + (u.rotation ? ' girada ' + u.rotation + '°' : '')).join(', ') + ') · ' + result.readings.length + ' leitura(s)' + cut,
        passes: result.readings.map(r => ({ name: r.name, found: r.found, quality: Math.round(r.quality) }))
      });
    } finally {
      pages.forEach(p => { try { p.page.cleanup(); } catch (_) { /* ignorado */ } });
      try { await pdf.destroy(); } catch (_) { /* ignorado */ }
    }
  }

  async function readPlainFile(file, progress) {
    const name = text(file.name).toLowerCase();
    if (/\.(txt|csv|xml|json)$/.test(name) || /^text\/|xml/.test(file.type || '')) return { text: await file.text(), method: 'Texto do arquivo' };
    if (/\.docx$/.test(name)) {
      if (window.MedTools && typeof window.MedTools.read === 'function') return window.MedTools.read(file, progress);
      if (!window.JSZip) throw new Error('Leitor de Word indisponível nesta tela.');
      const zip = await window.JSZip.loadAsync(await file.arrayBuffer()), entry = zip.file('word/document.xml');
      if (!entry) throw new Error('Documento Word inválido.');
      const doc = new DOMParser().parseFromString(await entry.async('string'), 'application/xml');
      return { text: [...doc.getElementsByTagNameNS('*', 'p')].map(p => [...p.getElementsByTagNameNS('*', 't')].map(x => x.textContent).join('')).join('\n'), method: 'Texto do Word' };
    }
    throw new Error('Use foto, PDF, DOCX ou XML. Para .doc antigo, salve como DOCX ou PDF.');
  }

  async function read(type, file, progress = () => {}) {
    if (!CATALOG[type]) throw new Error('Tipo documental não reconhecido: ' + type);
    if (!file) throw new Error('Nenhum arquivo selecionado.');
    const say = message => { try { progress(message); } catch (_) { /* ignorado */ } };
    const name = text(file.name).toLowerCase();
    if (/\.doc$/.test(name)) throw new Error('Word no formato .doc ainda exige conversão para .docx ou PDF. O leitor local aceita .docx, PDF, XML e imagens.');
    if (file.size > 40 * 1024 * 1024) throw new Error('Arquivo acima de 40 MB. Use uma cópia menor.');
    try {
      let result;
      if (name.endsWith('.pdf') || file.type === 'application/pdf') result = await readPdfFile(type, file, say);
      else if ((file.type || '').startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif|heic|heif)$/.test(name)) result = await readImageFile(type, file, say);
      else {
        const plain = await readPlainFile(file, say);
        result = extract(type, plain.text, { filename: file.name, method: plain.method, readAt: new Date().toISOString() });
      }
      say('Texto lido. Confira os campos.');
      return result;
    } finally { releaseWorkerSoon(); }
  }

  /*
   * Adaptador: a tela chama openReader com o tipo documental explícito.
   * O callback recebe o objeto de revisão completo. Não grava estado.
   */
  function openReader(type, { onReview, progress } = {}) {
    if (!CATALOG[type]) throw new Error('Tipo documental não reconhecido: ' + type);
    return {
      type,
      title: CATALOG[type].title,
      accept: CATALOG[type].accepted.join(','),
      async read(file) {
        const result = await read(type, file, progress || (() => {}));
        if (typeof onReview === 'function') await onReview(result);
        return result;
      }
    };
  }

  /* ============================================ CONSULTAS ANVISA (inalterado) */
  async function getJson(path) {
    let last;
    for (const base of DATA_BASES) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch(base + path, { signal: controller.signal, cache: 'no-store' });
        if (response.status === 404) continue;
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return await response.json();
      } catch (error) { last = error; } finally { clearTimeout(timeout); }
    }
    throw new Error('Base Anvisa indisponível' + (last ? ': ' + last.message : '.'));
  }

  let manifestPromise;
  async function manifest() { return manifestPromise ||= getJson('manifest.json'); }
  function prefix(man, base, fallback) {
    const entry = (man.bases && man.bases[base]) || (man.indices && man.indices[base]) || {};
    const value = Number(entry.prefixo || entry.prefixo_fragmento);
    return Number.isInteger(value) && value > 0 && value < 10 ? value : fallback;
  }
  async function shardForRegistro(base, registro) {
    const man = await manifest();
    const n = prefix(man, base, 3);
    return digits(registro).slice(0, n);
  }
  async function shardForProcess(base, processo) {
    const man = await manifest();
    const n = prefix(man, base, base === 'alimentos' ? 4 : 3);
    return digits(processo).slice(5, 5 + n);
  }
  function firstOf(row, keys) { for (const key of keys) if (trim(row && row[key])) return trim(row[key]); return ''; }
  function allOf(rows, keys) { return unique((rows || []).flatMap(row => keys.flatMap(key => Array.isArray(row && row[key]) ? row[key] : [row && row[key]]))); }

  async function empresa(cnpj) {
    const target = digits(cnpj);
    if (!cnpjValid(target)) throw new Error('CNPJ inválido.');
    const rows = (await getJson('afe_ae/' + target.slice(0, 3) + '.json') || []).filter(row => digits(row.cnpj) === target);
    const afe = unique(rows.flatMap(row => [row.autorizacao, row.afe, row.numero_afe]).filter(Boolean));
    const ae = unique(rows.flatMap(row => [row.autorizacao_especial, row.ae, row.numero_ae]).filter(Boolean));
    return {
      source: 'Base pública Anvisa — AFE/AE',
      queriedAt: new Date().toISOString(),
      cnpj: target,
      razao_social: firstOf(rows[0], ['razao_social', 'razao', 'empresa', 'nome_empresarial']),
      numero_afe: afe,
      numero_ae: ae,
      atividades: allOf(rows, ['atividade', 'atividades', 'descricao_atividade']),
      raw: rows
    };
  }

  function normalizeMedicine(row) {
    return {
      nome: firstOf(row, ['produto', 'nome_produto', 'marca', 'descricao']),
      apresentacao: firstOf(row, ['apresentacao', 'descricao_apresentacao']),
      fabricante: firstOf(row, ['fabricante', 'laboratorio', 'detentor', 'empresa']),
      numero_registro_anvisa: firstOf(row, ['registro', 'registro_apresentacao', 'regularizacao']),
      processo: firstOf(row, ['processo']),
      ean: firstOf(row, ['ean', 'gtin', 'codigo_barras']),
      raw: row
    };
  }

  function normalizeEquipment(row) {
    return {
      nome: firstOf(row, ['produto', 'nome_produto', 'nome']),
      fabricante: firstOf(row, ['fabricante', 'detentor', 'empresa']),
      descricao: firstOf(row, ['descricao', 'produto', 'apresentacao', 'modelo']),
      numero_anvisa_ou_processo: firstOf(row, ['registro', 'regularizacao', 'processo']),
      numero_anvisa: firstOf(row, ['registro', 'regularizacao']),
      processo: firstOf(row, ['processo']),
      raw: row
    };
  }

  async function recordsByRegistro(base, registro) {
    const shard = await shardForRegistro(base, registro);
    const rows = await getJson(base + '/' + shard + '.json') || [];
    return rows.filter(row => digits(row.registro || row.regularizacao) === digits(registro));
  }

  async function recordsByProcess(base, processo) {
    const p = digits(processo);
    const indexShard = p.slice(5, 8);
    const index = await getJson('indices/processos/' + indexShard + '.json') || {};
    const refs = index[p] || [];
    const matching = refs.filter(ref => (ref.b || ref.base || '') === base);
    if (!matching.length) return [];
    // Os dados de medicamentos e dispositivos são fragmentados por REGISTRO.
    const shards = unique(await Promise.all(matching.map(ref => shardForRegistro(base, ref.r))));
    const rows = (await Promise.all(shards.map(shard => getJson(base + '/' + shard + '.json')))).flat();
    const registers = new Set(matching.map(ref => digits(ref.r)));
    return rows.filter(row => registers.has(digits(row.registro)) && digits(row.processo) === p);
  }

  async function medicamento({ ean, processo, registro } = {}) {
    const modes = [ean && 'ean', processo && 'processo', registro && 'registro'].filter(Boolean);
    if (modes.length !== 1) throw new Error('Informe exatamente um entre EAN, processo ou registro Anvisa.');
    let rows = [];
    if (ean) {
      const code = digits(ean);
      const padded = code.padStart(14, '0');
      const cmed = await getJson('cmed/' + padded.slice(0, 8) + '.json') || {};
      const cmedRows = cmed[padded] || cmed[code] || [];
      const registers = unique(cmedRows.map(row => digits(row.registro || row.registro_apresentacao)));
      for (const item of registers) rows.push(...await recordsByRegistro('medicamentos', item));
      rows.push(...cmedRows);
    } else if (registro) rows = await recordsByRegistro('medicamentos', registro);
    else rows = await recordsByProcess('medicamentos', processo);
    const normalized = rows.map(normalizeMedicine);
    return { source: 'Bases públicas Anvisa e CMED', queriedAt: new Date().toISOString(), mode: modes[0], results: normalized };
  }

  async function equipamento({ processo, registro } = {}) {
    const modes = [processo && 'processo', registro && 'registro'].filter(Boolean);
    if (modes.length !== 1) throw new Error('Informe exatamente um entre processo ou número de registro Anvisa.');
    const rows = registro ? await recordsByRegistro('dispositivos', registro) : await recordsByProcess('dispositivos', processo);
    return { source: 'Base pública Anvisa — Dispositivos médicos', queriedAt: new Date().toISOString(), mode: modes[0], results: rows.map(normalizeEquipment) };
  }

  /* Foto-evidência: armazenamento original, separado de OCR e de relatório. */
  const PHOTO_DB = 'drogaria-fotos-evidencia-v1';
  const PHOTO_STORE = 'photos';
  let photoDbPromise;
  function photoDb() {
    return photoDbPromise ||= new Promise((resolve, reject) => {
      const request = indexedDB.open(PHOTO_DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(PHOTO_STORE, { keyPath: 'key' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Não foi possível abrir o armazenamento de fotos.'));
    });
  }
  async function photoTx(mode, operation) {
    const db = await photoDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, mode);
      const request = operation(tx.objectStore(PHOTO_STORE));
      let result;
      request.onsuccess = () => { result = request.result; };
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error('Não foi possível gravar a foto.'));
      tx.onabort = () => reject(tx.error || new Error('Gravação de foto interrompida.'));
    });
  }
  function photoKey(scope, id) { return String(scope) + '|' + String(id); }
  function newPhotoId() { return 'foto_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); }

  async function savePhoto(scope, file, { id = newPhotoId(), section = '', caption = '' } = {}) {
    if (!file || !(file.type || '').startsWith('image/')) throw new Error('Selecione uma fotografia.');
    if (file.size > 25 * 1024 * 1024) throw new Error('A foto excede 25 MB. Use uma imagem menor para preservar o armazenamento local.');
    const record = {
      key: photoKey(scope, id), id, scope: String(scope), section: trim(section), caption: trim(caption),
      blob: file, filename: file.name || (id + '.jpg'), mime: file.type || 'image/jpeg', size: file.size,
      capturedAt: new Date().toISOString(), version: VERSION
    };
    await photoTx('readwrite', store => store.put(record));
    return { ...record, previewUrl: URL.createObjectURL(file) };
  }

  async function listPhotos(scope) {
    const all = await photoTx('readonly', store => store.getAll());
    return all.filter(item => item.scope === String(scope)).sort((a, b) => a.capturedAt.localeCompare(b.capturedAt)).map(item => ({ ...item, previewUrl: URL.createObjectURL(item.blob) }));
  }
  function revokePhotoPreview(item) { if (item && item.previewUrl) URL.revokeObjectURL(item.previewUrl); }
  async function removePhoto(scope, id) { await photoTx('readwrite', store => store.delete(photoKey(scope, id))); }

  async function imageToDataUrl(blob, maxSide = 1600) {
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = url; });
      const ratio = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', .88);
    } finally { URL.revokeObjectURL(url); }
  }

  async function photoBookBlob(scope, { title = 'Fotografias da inspeção — Drogaria', establishment = '', inspectionDate = '' } = {}) {
    const photos = await listPhotos(scope);
    try {
      const body = [];
      for (let index = 0; index < photos.length; index++) {
        const photo = photos[index];
        const dataUrl = await imageToDataUrl(photo.blob);
        body.push('<section class="photo"><h2>Foto ' + (index + 1) + '</h2>' +
          '<p><b>Seção:</b> ' + esc(photo.section || 'Não informada') + '<br><b>Descrição:</b> ' + esc(photo.caption || 'Não informada') +
          '<br><b>Registrada em:</b> ' + esc(new Date(photo.capturedAt).toLocaleString('pt-BR')) + '</p>' +
          '<img src="' + dataUrl + '" alt="Foto de evidência ' + (index + 1) + '"></section>');
      }
      const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>' +
        '@page{margin:2cm}body{font:11pt Arial,sans-serif;color:#000}h1{font-size:16pt}h2{font-size:12pt;margin:0 0 6px}.meta{margin:0 0 22px}.photo{page-break-inside:avoid;border-top:1px solid #777;padding-top:12px;margin-top:18px}.photo img{display:block;max-width:100%;max-height:20cm;margin-top:10px}p{line-height:1.4}</style></head><body>' +
        '<h1>' + esc(title) + '</h1><p class="meta"><b>Estabelecimento:</b> ' + esc(establishment || 'Não informado') + '<br><b>Data da inspeção:</b> ' + esc(inspectionDate || 'Não informada') +
        '<br><b>Total de fotografias:</b> ' + photos.length + '</p>' +
        (body.join('') || '<p>Nenhuma fotografia foi registrada nesta inspeção.</p>') + '</body></html>';
      return new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    } finally { photos.forEach(revokePhotoPreview); }
  }

  async function downloadPhotoBook(scope, options = {}) {
    const blob = await photoBookBlob(scope, options);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Fotografias_da_inspecao_Drogaria.doc';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    return blob;
  }


  window.DrogariaOcrTools = Object.freeze({
    version: VERSION,
    catalog: CATALOG,
    labels: LABELS,
    extract,
    read,
    openReader,
    util: Object.freeze({ toIso, splitActivities, datesIn, cnpjValid }),
    anvisa: Object.freeze({ empresa, medicamento, equipamento }),
    fotos: Object.freeze({ save: savePhoto, list: listPhotos, remove: removePhoto, revokePreview: revokePhotoPreview, photoBookBlob, downloadPhotoBook })
  });
})();