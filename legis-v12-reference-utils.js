(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LegisV12ReferenceUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const TECHNICAL_ROOTS = new Set([
    'rdc-67-2007',
    'rdc-204-2006'
  ]);

  function stripAccents(value) {
    return String(value == null ? '' : value)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function slugPart(value) {
    return stripAccents(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function digits(value) {
    return String(value == null ? '' : value).replace(/\D/g, '');
  }

  function normalizeDeviceNumber(value) {
    return slugPart(String(value == null ? '' : value).replace(/\./g, '-'));
  }

  function extractYearFromDateTail(text) {
    const m = String(text || '').match(/\bde\s+(\d{4})\b/i);
    return m ? m[1] : null;
  }

  function parseNormIdentity(raw) {
    const original = String(raw == null ? '' : raw).trim();
    const s = stripAccents(original).replace(/\s+/g, ' ').trim();
    if (!s) return null;

    let m = s.match(/\b(RDC|IN)\s*(?:ANVISA\s*)?(?:N(?:O|º|°|\.)?\s*)?([\d.]+)\s*\/\s*(\d{4})\b/i);
    if (m) return { type: m[1].toUpperCase(), number: digits(m[2]), year: m[3], raw: original };

    m = s.match(/\b(RDC|IN)\s*(?:ANVISA\s*)?(?:N(?:O|º|°|\.)?\s*)?([\d.]+)\b/i);
    if (m) {
      const year = extractYearFromDateTail(s.slice(m.index + m[0].length));
      if (year) return { type: m[1].toUpperCase(), number: digits(m[2]), year, raw: original };
    }

    m = s.match(/\bPORTARIA(?:\s+SVS\s*\/\s*MS)?\s*(?:N(?:O|º|°|\.)?\s*)?([\d.]+)\s*\/\s*(\d{4})\b/i);
    if (m) return { type: 'PORTARIA-SVS-MS', number: digits(m[1]), year: m[2], raw: original };

    m = s.match(/\bLEI(?:\s+(?:FEDERAL|MUNICIPAL))?\s*(?:N(?:O|º|°|\.)?\s*)?([\d.]+)\s*\/\s*(\d{4})\b/i);
    if (m) return { type: 'LEI', number: digits(m[1]), year: m[2], raw: original };

    return null;
  }

  function slugNorma(raw) {
    const id = parseNormIdentity(raw);
    if (!id) return slugPart(raw);
    if (id.type === 'RDC') return `rdc-${id.number}-${id.year}`;
    if (id.type === 'IN') return `in-${id.number}-${id.year}`;
    if (id.type === 'PORTARIA-SVS-MS') return `portaria-svs-ms-${id.number}-${id.year}`;
    if (id.type === 'LEI') return `lei-${id.number}-${id.year}`;
    return slugPart(raw);
  }

  function parseDeviceReference(text) {
    const raw = String(text == null ? '' : text);
    const clean = stripAccents(raw);
    const out = {};

    const norma = parseNormIdentity(raw);
    if (norma) out.norma = norma.raw;

    let m = clean.match(/\bANEXO\s+([IVXLCDM]+|\d+[A-Z]?)\b/i);
    if (m) out.anexo = m[1].toUpperCase();

    m = clean.match(/\bART(?:IGO)?\.?\s*(\d+(?:-[A-Z]|[A-Z])?)/i);
    if (m) out.artigo = m[1].toUpperCase();

    if (/PARAGRAFO\s+UNICO/i.test(clean)) out.paragrafo = 'unico';
    else {
      m = clean.match(/§\s*(\d+[A-Z]?)/i);
      if (m) out.paragrafo = m[1].toUpperCase();
    }

    m = clean.match(/\bINCISO\s+([IVXLCDM]+)\b/i);
    if (m) out.inciso = m[1].toUpperCase();

    m = clean.match(/\bALINEA\s+["'“”‘’]?([A-Z])["'“”‘’]?\b/i);
    if (m) out.alinea = m[1].toLowerCase();

    m = clean.match(/\bITEM\s+(\d+(?:\.\d+){1,5})\b/i);
    if (m) out.item = m[1];

    if (/REGULAMENTO\s+TECNICO/i.test(clean)) out.regulamentoTecnico = true;

    return out;
  }

  function annexSlug(value) {
    return slugPart(String(value || '').toUpperCase());
  }

  function buildReferenceLevels(spec) {
    const s = Object.assign({}, spec || {});
    const slug = s.slug || slugNorma(s.norma || '');
    if (!slug) throw new Error('Norma/slug não informado');

    const levels = [];
    let current = null;

    const useTechnical = !!s.regulamentoTecnico || (
      TECHNICAL_ROOTS.has(slug) && !!s.item && !s.artigo && !s.anexo
    );

    if (useTechnical) {
      current = `${slug}::regulamento-tecnico`;
      levels.push({ id: current, level: 'regulamento_tecnico' });
    } else if (s.anexo) {
      const a = annexSlug(s.anexo);
      if (s.artigo) {
        current = `${slug}::anexo-${a}::artigo::${normalizeDeviceNumber(s.artigo)}`;
        levels.push({ id: current, level: 'artigo' });
      } else {
        current = `${slug}::anexo-${a}::anexo::${a}`;
        levels.push({ id: current, level: 'anexo' });
      }
    } else if (s.artigo) {
      current = `${slug}::artigo::${normalizeDeviceNumber(s.artigo)}`;
      levels.push({ id: current, level: 'artigo' });
    }

    if (!current) {
      throw new Error('Referência sem raiz estrutural (artigo, anexo ou regulamento técnico)');
    }

    if (s.paragrafo) {
      current += `::paragrafo::${normalizeDeviceNumber(s.paragrafo)}`;
      levels.push({ id: current, level: 'paragrafo' });
    }
    if (s.inciso) {
      current += `::inciso::${normalizeDeviceNumber(s.inciso)}`;
      levels.push({ id: current, level: 'inciso' });
    }
    if (s.alinea) {
      current += `::alinea::${normalizeDeviceNumber(s.alinea)}`;
      levels.push({ id: current, level: 'alinea' });
    }
    if (s.item) {
      current += `::item::${normalizeDeviceNumber(s.item)}`;
      levels.push({ id: current, level: 'item' });
    }

    return {
      slug,
      requestedId: levels[levels.length - 1].id,
      levels,
      candidates: levels.slice().reverse()
    };
  }

  function resolveReference(doc, spec) {
    if (!doc || !Array.isArray(doc.nos)) {
      return {
        found: false,
        exact: false,
        reason: 'documento_invalido',
        node: null,
        requestedId: null,
        resolvedId: null,
        fallbackLevel: null,
        triedIds: []
      };
    }

    let plan;
    try {
      plan = buildReferenceLevels(spec);
    } catch (err) {
      return {
        found: false,
        exact: false,
        reason: 'referencia_invalida',
        error: err.message,
        node: null,
        requestedId: null,
        resolvedId: null,
        fallbackLevel: null,
        triedIds: []
      };
    }

    const byId = new Map(doc.nos.map(no => [String(no.id || ''), no]));
    for (const candidate of plan.candidates) {
      const node = byId.get(candidate.id);
      if (!node) continue;
      const exact = candidate.id === plan.requestedId;
      return {
        found: true,
        exact,
        reason: exact ? 'exato' : 'fallback',
        node,
        requestedId: plan.requestedId,
        resolvedId: candidate.id,
        fallbackLevel: exact ? null : candidate.level,
        triedIds: plan.candidates.map(x => x.id),
        statusVigencia: node.status_vigencia || null
      };
    }

    return {
      found: false,
      exact: false,
      reason: 'nao_encontrado',
      node: null,
      requestedId: plan.requestedId,
      resolvedId: null,
      fallbackLevel: null,
      triedIds: plan.candidates.map(x => x.id)
    };
  }

  function findManifestEntry(manifest, rawNorm) {
    if (!manifest || !manifest.normas) return null;
    const wantedSlug = slugNorma(rawNorm);
    const entries = Object.entries(manifest.normas);

    for (const [name, entry] of entries) {
      const arquivo = entry && entry.arquivo ? String(entry.arquivo) : '';
      if (arquivo === `${wantedSlug}.json`) return { name, entry, slug: wantedSlug };
      if (slugNorma(name) === wantedSlug) return { name, entry, slug: wantedSlug };
    }
    return null;
  }

  function getDocumentPath(manifest, rawNorm) {
    const hit = findManifestEntry(manifest, rawNorm);
    if (!hit || !hit.entry || !hit.entry.arquivo) return null;
    return `normas/${hit.entry.arquivo}`;
  }

  function validateReferences(references, docsBySlug) {
    const refs = Array.isArray(references) ? references : [];
    const docs = docsBySlug || {};
    const details = [];
    let exact = 0;
    let fallback = 0;
    let missing = 0;

    refs.forEach((ref, index) => {
      let spec;
      if (typeof ref === 'string') {
        spec = parseDeviceReference(ref);
        if (spec.norma) spec.slug = slugNorma(spec.norma);
      } else {
        spec = Object.assign({}, ref || {});
        if (!spec.slug && spec.norma) spec.slug = slugNorma(spec.norma);
        if (spec.citacao) spec = Object.assign({}, parseDeviceReference(spec.citacao), spec);
      }

      const slug = spec.slug || (spec.norma ? slugNorma(spec.norma) : '');
      const doc = docs[slug];
      let result;
      if (!doc) {
        result = {
          found: false,
          exact: false,
          reason: 'norma_nao_carregada',
          node: null,
          requestedId: null,
          resolvedId: null,
          fallbackLevel: null,
          triedIds: []
        };
      } else {
        result = resolveReference(doc, Object.assign({}, spec, { slug }));
      }

      if (result.found && result.exact) exact += 1;
      else if (result.found) fallback += 1;
      else missing += 1;

      details.push({ index, reference: ref, slug, result });
    });

    return {
      total: refs.length,
      exact,
      fallback,
      missing,
      ok: missing === 0,
      details
    };
  }

  return Object.freeze({
    TECHNICAL_ROOTS,
    slugPart,
    slugNorma,
    parseNormIdentity,
    parseDeviceReference,
    normalizeDeviceNumber,
    buildReferenceLevels,
    resolveReference,
    findManifestEntry,
    getDocumentPath,
    validateReferences
  });
});
