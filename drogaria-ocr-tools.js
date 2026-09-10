/*
 * DROGARIA — ferramentas preparadas para a etapa de integração nos cards.
 *
 * Este arquivo NÃO é carregado pelo index.html nesta etapa.
 * Ele pressupõe, quando for integrado, as bibliotecas já existentes no app:
 *   - MedTools (leitura de PDF, imagem, DOCX e XML)
 *   - RoteiroEvidence (não é usado para foto-evidência; veja DrogariaFotos)
 *
 * Princípios:
 *   1. cada leitor é documental e específico; não há "OCR genérico" aplicável;
 *   2. nenhum campo é aplicado automaticamente: o resultado é sempre revisável;
 *   3. foto de evidência é um fluxo distinto de OCR e não entra no relatório;
 *   4. o arquivo original de foto-evidência é mantido localmente no IndexedDB.
 */
(() => {
  'use strict';
  if (window.DrogariaOcrTools) return;

  const VERSION = 'drogaria-ocr-tools-1.0';
  const DATA_BASES = [
    'https://uvisvp.github.io/base-vigilancia/dados/',
    'https://raw.githubusercontent.com/uvisvp/base-vigilancia/main/dados/'
  ];

  const text = value => String(value == null ? '' : value).replace(/\r/g, '');
  const digits = value => text(value).replace(/\D/g, '');
  const normalize = value => text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const trim = value => text(value).replace(/[ \t]+/g, ' ').trim();
  const unique = values => [...new Set((values || []).map(trim).filter(Boolean))];
  const esc = value => text(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const empty = fields => Object.fromEntries(fields.map(field => [field, '']));

  const CNPJ_RX = /\b\d{2}[.\s]?\d{3}[.\s]?\d{3}[\/\s]?\d{4}[-\s]?\d{2}\b/g;
  const CPF_RX = /\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b/g;
  const DATE_RX = /\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b/g;
  const STOP_LABELS = [
    'cnpj', 'cpf', 'cnae', 'razao social', 'nome fantasia', 'endereco', 'logradouro', 'numero',
    'bairro', 'municipio', 'cidade', 'cep', 'estado', 'uf', 'responsavel legal',
    'responsavel tecnico', 'responsavel tecnico substituto', 'farmaceutico responsavel',
    'validade', 'vencimento', 'emissao', 'data de emissao', 'atividade economica', 'atividade',
    'ramo de atividade', 'rotina', 'projeto', 'processo', 'cevs', 'cmvs', 'conselho', 'crf',
    'crm', 'empresa executora', 'empresa responsavel', 'instrumento', 'equipamento', 'identificacao',
    'fabricante', 'marca', 'modelo', 'lote', 'certificado', 'numero do certificado', 'servico',
    'solicitacao', 'adesao', 'ultima transmissao', 'geracao', 'titulo', 'elaboracao', 'vigencia'
  ];

  function normalizeLines(raw) {
    return text(raw).split(/\n+/).map(trim).filter(Boolean);
  }

  function firstMatch(raw, rx) {
    const clone = new RegExp(rx.source, rx.flags.replace('g', ''));
    const match = text(raw).match(clone);
    return match ? trim(match[1] || match[0]) : '';
  }

  function valuesMatching(raw, rx) {
    const clone = new RegExp(rx.source, rx.flags.includes('g') ? rx.flags : rx.flags + 'g');
    return unique([...(text(raw).matchAll(clone))].map(m => m[1] || m[0]));
  }

  function valueAfterLabel(raw, labels, valueRx) {
    const lines = normalizeLines(raw);
    const targets = (Array.isArray(labels) ? labels : [labels]).map(normalize);
    for (let index = 0; index < lines.length; index++) {
      const low = normalize(lines[index]);
      for (const label of targets) {
        const at = low.indexOf(label);
        if (at < 0) continue;
        const before = low[at - 1] || ' ';
        const after = low[at + label.length] || ' ';
        if (/[a-z0-9]/.test(before) || /[a-z0-9]/.test(after)) continue;
        let value = lines[index].slice(at + label.length).replace(/^[\s:;.=\-–—]+/, '');
        if (!value && lines[index + 1]) value = lines[index + 1];
        value = cutAtNextLabel(value);
        if (valueRx) {
          const match = value.match(valueRx) || text(raw).match(valueRx);
          value = match ? trim(match[1] || match[0]) : '';
        }
        if (value) return trim(value);
      }
    }
    return '';
  }

  function cutAtNextLabel(value) {
    const low = normalize(value);
    let cut = low.length;
    for (const label of STOP_LABELS) {
      const at = low.indexOf(label);
      if (at > 0 && at < cut && /[:=]/.test(low.slice(at, at + label.length + 5))) cut = at;
    }
    return trim(value.slice(0, cut));
  }

  function labelledDate(raw, labels) {
    return valueAfterLabel(raw, labels, /\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}/);
  }

  function labelledCnpj(raw, labels) {
    return valueAfterLabel(raw, labels, /\d{2}[.\s]?\d{3}[.\s]?\d{3}[\/\s]?\d{4}[-\s]?\d{2}/);
  }

  function labelledCpf(raw, labels) {
    return valueAfterLabel(raw, labels, /\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}/);
  }

  function firstCnpj(raw) { return valuesMatching(raw, CNPJ_RX)[0] || ''; }
  function firstCpf(raw) { return valuesMatching(raw, CPF_RX)[0] || ''; }
  function firstDate(raw) { return valuesMatching(raw, DATE_RX)[0] || ''; }

  function allTextValues(raw, labels, rx) {
    const lines = normalizeLines(raw);
    const targets = (Array.isArray(labels) ? labels : [labels]).map(normalize);
    const output = [];
    for (const line of lines) {
      const low = normalize(line);
      if (!targets.some(label => low.includes(label))) continue;
      const candidate = rx ? (line.match(rx) || [])[1] || (line.match(rx) || [])[0] : line;
      if (candidate) output.push(trim(candidate));
    }
    return unique(output);
  }

  function completeAddress(raw) {
    const direct = valueAfterLabel(raw, ['endereço completo', 'endereco completo', 'endereço', 'endereco', 'logradouro']);
    if (direct) return direct;
    const logradouro = valueAfterLabel(raw, 'logradouro');
    const numero = valueAfterLabel(raw, ['número', 'numero', 'nº']);
    const bairro = valueAfterLabel(raw, 'bairro');
    const municipio = valueAfterLabel(raw, ['município', 'municipio', 'cidade']);
    const uf = valueAfterLabel(raw, ['uf', 'estado']);
    return [logradouro, numero, bairro, municipio, uf].filter(Boolean).join(', ');
  }

  function addressParts(raw) {
    const direct = completeAddress(raw);
    const numberFromAddress = (direct.match(/(?:,\s*|\bn[ºo°.]?\s*)(\d+[A-Za-z\-/]*)\b/i) || [])[1] || '';
    return {
      endereco: direct,
      numero: valueAfterLabel(raw, ['número', 'numero', 'nº']) || numberFromAddress,
      bairro: valueAfterLabel(raw, 'bairro'),
      municipio: valueAfterLabel(raw, ['município', 'municipio', 'cidade']),
      cep: valueAfterLabel(raw, 'cep', /\d{5}[-\s]?\d{3}/),
      estado: valueAfterLabel(raw, ['estado', 'uf'], /\b[A-Z]{2}\b/i)
    };
  }

  function dateRange(raw, startLabels, endLabels) {
    return {
      inicio: labelledDate(raw, startLabels),
      fim: labelledDate(raw, endLabels)
    };
  }

  const CATALOG = Object.freeze({
    licenca_sanitaria: {
      title: 'Licença Sanitária',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['numero_cevs_ou_cmvs', 'validade', 'cnae', 'atividade_economica', 'razao_social', 'nome_fantasia', 'cnpj', 'endereco', 'numero', 'bairro', 'municipio', 'cep', 'estado', 'responsavel_legal', 'cpf_responsavel_legal', 'responsavel_tecnico', 'numero_conselho_responsavel_tecnico', 'responsavel_tecnico_substituto', 'numero_conselho_responsavel_tecnico_substituto']
    },
    certidao_regularidade_crf: {
      title: 'Certidão de Regularidade Técnica — CRF',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['numero_certidao', 'ramo_atividade', 'rotina', 'responsavel_tecnico', 'numero_conselho_responsavel_tecnico', 'data_emissao']
    },
    avcb_clcb: {
      title: 'AVCB ou CLCB',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['tipo_documento', 'numero', 'projeto', 'endereco_completo', 'validade']
    },
    controle_pragas_urbanas: {
      title: 'Certificado de controle de pragas urbanas',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['numero_certificado', 'empresa_executora', 'cnpj_empresa_executora', 'cevs_empresa_executora', 'data_realizacao', 'validade']
    },
    higienizacao_caixa_agua: {
      title: 'Certificado de higienização e desinfecção de caixa d’água',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['empresa_executora', 'data_realizacao', 'validade']
    },
    calibracao_termohigrometro: {
      title: 'Certificado de calibração de termo-higrômetro',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['numero_certificado', 'empresa_responsavel', 'instrumento_equipamento', 'identificacao', 'marca_fabricante', 'lote', 'data_calibracao', 'validade']
    },
    sumario_documentos: {
      title: 'Sumário de documentos — Manual, POPs ou PGRSS',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['lista_documentos']
    },
    etiqueta_metrologica: {
      title: 'Foto de etiqueta metrológica em equipamento',
      accepted: ['image/*'],
      fields: ['numero', 'empresa', 'data_calibracao', 'validade']
    },
    aso: {
      title: 'ASO — Atestado de Saúde Ocupacional',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['tipo', 'nome_funcionario', 'empresa_responsavel', 'medico_assinante', 'data_emissao']
    },
    pop_manual_pgrss: {
      title: 'POP, Manual ou PGRSS',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['nome', 'data_elaboracao', 'titulo', 'responsaveis', 'vigencia']
    },
    comprovante_mapas_balancos: {
      title: 'Comprovante de envio de mapas e balanços',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['numero_solicitacao', 'servico', 'data_envio']
    },
    sngpc_escrituracao_digital: {
      title: 'Certificado de escrituração digital do SNGPC',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['razao_social', 'cnpj', 'data_adesao', 'data_geracao_documento']
    },
    sngpc_transmissao_regular: {
      title: 'Certificado de transmissão regular do SNGPC',
      accepted: ['image/*', '.pdf', '.docx'],
      fields: ['razao_social', 'cnpj', 'data_ultima_transmissao', 'data_geracao_documento']
    },
    danfe_nfe: {
      title: 'DANFE ou Nota Fiscal',
      accepted: ['image/*', '.pdf', '.docx', '.xml'],
      fields: ['cnpj_emitente', 'data_emissao', 'numero_nota', 'cnpj_remetente']
    }
  });

  function extractLicense(raw) {
    const out = empty(CATALOG.licenca_sanitaria.fields);
    const parts = addressParts(raw);
    Object.assign(out, parts, {
      numero_cevs_ou_cmvs: firstMatch(raw, /\b\d{9}[-\s.]?\d{3}[-\s.]?\d{6}[-\s.]?\d[-\s.]?\d\b/) || valueAfterLabel(raw, ['cevs', 'cmvs', 'nº cevs', 'nº cmvs', 'número da licença', 'licença nº']),
      validade: labelledDate(raw, ['validade', 'válida até', 'valida até', 'vencimento']),
      cnae: valueAfterLabel(raw, 'cnae'),
      atividade_economica: valueAfterLabel(raw, ['atividade econômica', 'atividade economica', 'atividade']),
      razao_social: valueAfterLabel(raw, ['razão social', 'razao social', 'nome empresarial']),
      nome_fantasia: valueAfterLabel(raw, 'nome fantasia'),
      cnpj: labelledCnpj(raw, 'cnpj') || firstCnpj(raw),
      responsavel_legal: valueAfterLabel(raw, 'responsável legal'),
      cpf_responsavel_legal: labelledCpf(raw, ['cpf responsável legal', 'cpf responsavel legal']) || (normalize(raw).includes('responsavel legal') ? firstCpf(raw) : ''),
      responsavel_tecnico: valueAfterLabel(raw, ['responsável técnico', 'responsavel tecnico', 'farmacêutico responsável', 'farmaceutico responsavel']),
      numero_conselho_responsavel_tecnico: firstMatch(raw, /(?:CRF|CRF[-/ ]?SP)\s*[:\-]?\s*([0-9]{3,8})/i),
      responsavel_tecnico_substituto: valueAfterLabel(raw, ['responsável técnico substituto', 'responsavel tecnico substituto', 'farmacêutico substituto', 'farmaceutico substituto']),
      numero_conselho_responsavel_tecnico_substituto: valueAfterLabel(raw, ['crf substituto', 'conselho substituto'], /[0-9]{3,8}/)
    });
    return out;
  }

  function extractCrf(raw) {
    const out = empty(CATALOG.certidao_regularidade_crf.fields);
    Object.assign(out, {
      numero_certidao: valueAfterLabel(raw, ['certidão nº', 'certidao nº', 'certidão n', 'certidao n', 'número da certidão', 'numero da certidao']),
      ramo_atividade: valueAfterLabel(raw, ['ramo de atividade', 'ramo atividade']),
      rotina: valueAfterLabel(raw, 'rotina'),
      responsavel_tecnico: valueAfterLabel(raw, ['responsável técnico', 'responsavel tecnico', 'farmacêutico responsável', 'farmaceutico responsavel']),
      numero_conselho_responsavel_tecnico: firstMatch(raw, /(?:CRF|CRF[-/ ]?SP)\s*[:\-]?\s*([0-9]{3,8})/i),
      data_emissao: labelledDate(raw, ['data de emissão', 'data de emissao', 'emissão', 'emissao'])
    });
    return out;
  }

  function extractAvcbClcb(raw) {
    const out = empty(CATALOG.avcb_clcb.fields);
    Object.assign(out, {
      tipo_documento: /\bCLCB\b/i.test(raw) ? 'CLCB' : /\bAVCB\b/i.test(raw) ? 'AVCB' : '',
      numero: firstMatch(raw, /(?:AVCB|CLCB)\s*(?:n[ºo°.]*)?\s*[:\-]?\s*([A-Z0-9./-]+)/i) || valueAfterLabel(raw, ['número do avcb', 'numero do avcb', 'número do clcb', 'numero do clcb']),
      projeto: valueAfterLabel(raw, ['projeto nº', 'projeto n', 'projeto']),
      endereco_completo: completeAddress(raw),
      validade: labelledDate(raw, ['validade', 'válido até', 'valido até', 'vencimento'])
    });
    return out;
  }

  function extractPestControl(raw) {
    const out = empty(CATALOG.controle_pragas_urbanas.fields);
    Object.assign(out, {
      numero_certificado: valueAfterLabel(raw, ['certificado nº', 'certificado n', 'número do certificado', 'numero do certificado', 'garantia nº', 'garantia n']),
      empresa_executora: valueAfterLabel(raw, ['empresa executora', 'empresa responsável', 'empresa responsavel', 'prestadora']) || valueAfterLabel(raw, ['razão social', 'razao social', 'empresa']),
      cnpj_empresa_executora: labelledCnpj(raw, ['cnpj empresa executora', 'cnpj da empresa executora', 'cnpj']) || firstCnpj(raw),
      cevs_empresa_executora: valueAfterLabel(raw, ['cevs da empresa executora', 'cevs', 'licença sanitária', 'licenca sanitaria']),
      data_realizacao: labelledDate(raw, ['data de realização', 'data de realizacao', 'data de aplicação', 'data de aplicacao', 'data do serviço', 'data do servico']),
      validade: labelledDate(raw, ['data de validade', 'validade', 'garantia até', 'garantia ate', 'vencimento'])
    });
    return out;
  }

  function extractWaterCleaning(raw) {
    const out = empty(CATALOG.higienizacao_caixa_agua.fields);
    Object.assign(out, {
      empresa_executora: valueAfterLabel(raw, ['empresa executora', 'empresa responsável', 'empresa responsavel', 'prestadora']) || valueAfterLabel(raw, ['razão social', 'razao social', 'empresa']),
      data_realizacao: labelledDate(raw, ['data de execução', 'data de execucao', 'data da limpeza', 'data de realização', 'data de realizacao']),
      validade: labelledDate(raw, ['data de validade', 'validade', 'vencimento'])
    });
    return out;
  }

  function extractCalibration(raw) {
    const out = empty(CATALOG.calibracao_termohigrometro.fields);
    Object.assign(out, {
      numero_certificado: valueAfterLabel(raw, ['número do certificado', 'numero do certificado', 'certificado nº', 'certificado n']) || firstMatch(raw, /certificado(?:\s+de\s+calibra[cç][aã]o)?\s*(?:n[ºo°.]*)?\s*[:\-]?\s*([A-Z0-9./-]{3,})/i),
      empresa_responsavel: valueAfterLabel(raw, ['laboratório', 'laboratorio', 'empresa responsável', 'empresa responsavel', 'contratado por', 'contratante']),
      instrumento_equipamento: valueAfterLabel(raw, ['descrição do equipamento', 'descricao do equipamento', 'identificação do equipamento', 'identificacao do equipamento', 'instrumento', 'equipamento', 'descrição', 'descricao']),
      identificacao: valueAfterLabel(raw, ['tag', 'nº de série', 'n° de série', 'numero de série', 'numero de serie', 'patrimônio', 'patrimonio']),
      marca_fabricante: valueAfterLabel(raw, ['marca', 'fabricante']),
      lote: valueAfterLabel(raw, ['lote', 'batch']),
      data_calibracao: labelledDate(raw, ['data da calibração', 'data da calibracao', 'calibrado em', 'data de calibração', 'data de calibracao']),
      validade: labelledDate(raw, ['próxima calibração', 'proxima calibracao', 'validade', 'vencimento'])
    });
    return out;
  }

  function extractSummary(raw) {
    const lines = normalizeLines(raw);
    const start = lines.findIndex(line => /sum[aá]rio|[íi]ndice|lista de documentos/i.test(line));
    const base = start >= 0 ? lines.slice(start + 1) : lines;
    const items = [];
    for (const line of base) {
      const clean = trim(line.replace(/\.{2,}\s*\d+\s*$/, '').replace(/^\s*(?:\d+(?:\.\d+)*[.)\-]?|[-•])\s*/, ''));
      if (!clean || /^p[aá]gina\s+\d+$/i.test(clean)) continue;
      if (/^(manual|sum[aá]rio|[íi]ndice)$/i.test(clean)) continue;
      if (clean.length >= 4 && clean.length <= 180) items.push(clean);
    }
    return { lista_documentos: unique(items).slice(0, 80).join('\n') };
  }

  function extractMetrologyLabel(raw) {
    const out = empty(CATALOG.etiqueta_metrologica.fields);
    Object.assign(out, {
      numero: valueAfterLabel(raw, ['número', 'numero', 'certificado', 'cal']),
      empresa: valueAfterLabel(raw, ['empresa', 'laboratório', 'laboratorio']) || firstMatch(raw, /\b([A-Z][A-Z0-9 .&-]{3,})\b/),
      data_calibracao: labelledDate(raw, ['calibração', 'calibracao', 'data']),
      validade: labelledDate(raw, ['validade', 'próxima calibração', 'proxima calibracao', 'vencimento'])
    });
    return out;
  }

  function extractAso(raw) {
    const out = empty(CATALOG.aso.fields);
    Object.assign(out, {
      tipo: firstMatch(raw, /\b(admissional|peri[oó]dico|demissional|retorno(?:\s+ao\s+trabalho)?|mudan[cç]a\s+de\s+risco)\b/i),
      nome_funcionario: valueAfterLabel(raw, ['nome do funcionário', 'nome do funcionario', 'nome do trabalhador', 'funcionário', 'funcionario', 'colaborador']),
      empresa_responsavel: valueAfterLabel(raw, ['empresa responsável', 'empresa responsavel', 'empresa', 'empregador']),
      medico_assinante: valueAfterLabel(raw, ['médico responsável', 'medico responsavel', 'médico examinador', 'medico examinador', 'médico', 'medico']),
      data_emissao: labelledDate(raw, ['data de emissão', 'data de emissao', 'emissão', 'emissao', 'data do aso'])
    });
    return out;
  }

  function extractProcedure(raw) {
    const out = empty(CATALOG.pop_manual_pgrss.fields);
    const firstLines = normalizeLines(raw).slice(0, 18);
    Object.assign(out, {
      nome: valueAfterLabel(raw, ['nome do documento', 'nome']),
      data_elaboracao: labelledDate(raw, ['data de elaboração', 'data de elaboracao', 'elaboração', 'elaboracao']),
      titulo: valueAfterLabel(raw, ['título', 'titulo']) || firstLines.find(line => /\b(POP|manual|pgrss|procedimento)\b/i.test(line)) || '',
      responsaveis: valueAfterLabel(raw, ['responsáveis', 'responsaveis', 'elaborado por', 'aprovado por', 'responsável', 'responsavel']),
      vigencia: labelledDate(raw, ['vigência', 'vigencia', 'válido até', 'valido até', 'revisão', 'revisao'])
    });
    return out;
  }

  function extractMapsBalances(raw) {
    const out = empty(CATALOG.comprovante_mapas_balancos.fields);
    Object.assign(out, {
      numero_solicitacao: valueAfterLabel(raw, ['número da solicitação', 'numero da solicitacao', 'solicitação', 'solicitacao', 'protocolo', 'processo']),
      servico: valueAfterLabel(raw, ['serviço', 'servico', 'assunto']) || firstMatch(raw, /((?:mapas?|balan[cç]os?)[^\n]{0,120})/i),
      data_envio: labelledDate(raw, ['data do envio', 'enviado em', 'solicitado em', 'data da solicitação', 'data da solicitacao']) || firstDate(raw)
    });
    return out;
  }

  function extractSngpcDigital(raw) {
    const out = empty(CATALOG.sngpc_escrituracao_digital.fields);
    Object.assign(out, {
      razao_social: valueAfterLabel(raw, ['razão social', 'razao social', 'estabelecimento']),
      cnpj: labelledCnpj(raw, 'cnpj') || firstCnpj(raw),
      data_adesao: labelledDate(raw, ['data de adesão', 'data de adesao', 'adesão', 'adesao']),
      data_geracao_documento: labelledDate(raw, ['data de geração', 'data de geracao', 'gerado em', 'emissão', 'emissao'])
    });
    return out;
  }

  function extractSngpcTransmission(raw) {
    const out = empty(CATALOG.sngpc_transmissao_regular.fields);
    Object.assign(out, {
      razao_social: valueAfterLabel(raw, ['razão social', 'razao social', 'estabelecimento']),
      cnpj: labelledCnpj(raw, 'cnpj') || firstCnpj(raw),
      data_ultima_transmissao: labelledDate(raw, ['última transmissão', 'ultima transmissao', 'data da última transmissão', 'data da ultima transmissao']),
      data_geracao_documento: labelledDate(raw, ['data de geração', 'data de geracao', 'gerado em', 'emissão', 'emissao'])
    });
    return out;
  }

  function extractDanfeXml(raw) {
    try {
      const doc = new DOMParser().parseFromString(raw, 'application/xml');
      if (doc.querySelector('parsererror')) return null;
      const get = (parent, name) => parent && parent.getElementsByTagNameNS('*', name)[0] ? trim(parent.getElementsByTagNameNS('*', name)[0].textContent) : '';
      const emit = doc.getElementsByTagNameNS('*', 'emit')[0];
      const ide = doc.getElementsByTagNameNS('*', 'ide')[0];
      if (!emit && !ide) return null;
      return {
        cnpj_emitente: get(emit, 'CNPJ'),
        data_emissao: get(ide, 'dhEmi') || get(ide, 'dEmi'),
        numero_nota: get(ide, 'nNF'),
        // Na NF-e XML, o emitente é juridicamente o remetente.
        cnpj_remetente: get(emit, 'CNPJ')
      };
    } catch (_) { return null; }
  }

  function extractDanfe(raw) {
    const xml = extractDanfeXml(raw);
    if (xml) return xml;
    const out = empty(CATALOG.danfe_nfe.fields);
    const key = firstMatch(raw, /(?:\d[\s.-]*){44}/);
    const keyDigits = digits(key);
    Object.assign(out, {
      cnpj_emitente: labelledCnpj(raw, ['cnpj emitente', 'emitente', 'cnpj']) || (keyDigits.length === 44 ? keyDigits.slice(6, 20) : firstCnpj(raw)),
      data_emissao: labelledDate(raw, ['data de emissão', 'data de emissao', 'emissão', 'emissao', 'data de saída', 'data de saida']),
      numero_nota: valueAfterLabel(raw, ['número da nota', 'numero da nota', 'nº da nota', 'n da nota', 'nf-e', 'nfe']) || (keyDigits.length === 44 ? String(Number(keyDigits.slice(25, 34))) : ''),
      cnpj_remetente: labelledCnpj(raw, ['cnpj remetente', 'remetente'])
    });
    // Em DANFE convencional, emitente e remetente costumam ser a mesma pessoa jurídica.
    if (!out.cnpj_remetente) out.cnpj_remetente = out.cnpj_emitente;
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
    return { found, missing, complete: !missing.length };
  }

  function extract(type, rawText, meta = {}) {
    if (!CATALOG[type] || !EXTRACTORS[type]) throw new Error('Tipo documental não reconhecido: ' + type);
    const fields = { ...empty(CATALOG[type].fields), ...EXTRACTORS[type](text(rawText)) };
    const review = inspectFields(type, fields);
    return {
      version: VERSION,
      documentType: type,
      documentTitle: CATALOG[type].title,
      fields,
      review,
      rawText: text(rawText),
      source: {
        filename: meta.filename || '',
        method: meta.method || '',
        readAt: meta.readAt || new Date().toISOString()
      },
      status: review.complete ? 'pronto_para_conferencia' : 'conferencia_obrigatoria'
    };
  }

  function ensureMedTools() {
    if (!window.MedTools || typeof window.MedTools.read !== 'function') {
      throw new Error('Leitor documental ainda não foi integrado à tela. Esta função depende do MedTools já existente no aplicativo.');
    }
  }

  async function imageEnhancedBlob(file) {
    const sourceUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('Não foi possível abrir a imagem.')); image.src = sourceUrl; });
      const longest = Math.max(image.naturalWidth, image.naturalHeight);
      const scale = Math.min(2.4, 3000 / Math.max(1, longest));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pixels.data.length; i += 4) {
        const gray = pixels.data[i] * .299 + pixels.data[i + 1] * .587 + pixels.data[i + 2] * .114;
        const adjusted = Math.max(0, Math.min(255, (gray - 128) * 1.65 + 142));
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = adjusted;
      }
      ctx.putImageData(pixels, 0, 0);
      return await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', .92));
    } finally { URL.revokeObjectURL(sourceUrl); }
  }

  function textScore(raw, type) {
    const t = normalize(raw).replace(/\s/g, '');
    if (!t) return 0;
    const markers = {
      licenca_sanitaria: ['licenca', 'cevs', 'cmvs', 'cnae'],
      certidao_regularidade_crf: ['certidao', 'crf', 'responsavel'],
      avcb_clcb: ['avcb', 'clcb', 'bombeiro'],
      controle_pragas_urbanas: ['praga', 'desinsetizacao', 'desratizacao'],
      higienizacao_caixa_agua: ['caixadagua', 'higienizacao', 'reservatorio'],
      calibracao_termohigrometro: ['calibracao', 'termohigrometro', 'certificado'],
      aso: ['atestado', 'ocupacional', 'aso'],
      danfe_nfe: ['danfe', 'nota', 'fiscal', 'nfe'],
      sngpc_escrituracao_digital: ['sngpc', 'escrituracao'],
      sngpc_transmissao_regular: ['sngpc', 'transmissao']
    };
    return t.length + (markers[type] || []).filter(marker => t.includes(marker)).length * 500;
  }

  async function read(type, file, progress = () => {}) {
    if (!CATALOG[type]) throw new Error('Tipo documental não reconhecido: ' + type);
    ensureMedTools();
    const lowerName = text(file && file.name).toLowerCase();
    if (/\.doc$/i.test(lowerName)) throw new Error('Word no formato .doc ainda exige conversão para .docx ou PDF. O leitor local aceita .docx, PDF, XML e imagens.');
    progress('Lendo o arquivo…');
    const original = await window.MedTools.read(file, progress);
    let best = { ...original, filename: file.name };
    const isImage = file && (file.type || '').startsWith('image/');
    if (isImage && textScore(best.text, type) < 950) {
      progress('Melhorando contraste da foto e repetindo a leitura…');
      const enhanced = await imageEnhancedBlob(file);
      if (enhanced) {
        const retry = await window.MedTools.read(new File([enhanced], 'imagem-melhorada.jpg', { type: 'image/jpeg' }), progress);
        if (textScore(retry.text, type) > textScore(best.text, type)) best = { ...retry, filename: file.name, method: retry.method + ' (imagem com contraste melhorado)' };
      }
    }
    progress('Texto lido. Preparando campos para conferência…');
    return extract(type, best.text, { filename: file.name, method: best.method, readAt: new Date().toISOString() });
  }

  /*
   * Adaptador para a etapa 2. A tela deverá chamar openReader com o tipo
   * documental explícito. O callback recebe o objeto de revisão completo.
   * A função não grava em roteiro, relatório ou qualquer outro estado.
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

  function cnpjValid(raw) {
    const n = digits(raw);
    if (!/^\d{14}$/.test(n) || /^(\d)\1+$/.test(n)) return false;
    const digit = (source, weights) => { const rest = [...source].reduce((sum, value, index) => sum + Number(value) * weights[index], 0) % 11; return rest < 2 ? 0 : 11 - rest; };
    const one = digit(n.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    return n.endsWith(String(one) + String(digit(n.slice(0, 12) + one, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])));
  }

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
    extract,
    read,
    openReader,
    anvisa: Object.freeze({ empresa, medicamento, equipamento }),
    fotos: Object.freeze({ save: savePhoto, list: listPhotos, remove: removePhoto, revokePreview: revokePhotoPreview, photoBookBlob, downloadPhotoBook })
  });
})();
