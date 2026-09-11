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