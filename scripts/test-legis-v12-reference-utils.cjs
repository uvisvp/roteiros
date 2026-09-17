const assert = require('node:assert/strict');
const U = require('../legis-v12-reference-utils.js');

function doc(ids) {
  return {
    schema: 'legislacao-hierarquica-v12',
    nos: ids.map((id, i) => ({ id, texto: `texto-${i + 1}`, status_vigencia: 'vigente' }))
  };
}

assert.equal(U.slugNorma('RDC nº 63/2011'), 'rdc-63-2011');
assert.equal(U.slugNorma('RDC nº 1.015/2026'), 'rdc-1015-2026');
assert.equal(U.slugNorma('IN nº 62/2020'), 'in-62-2020');
assert.equal(U.slugNorma('Portaria SVS/MS nº 344/1998'), 'portaria-svs-ms-344-1998');
assert.equal(U.slugNorma('Lei nº 5.991/1973'), 'lei-5991-1973');

const parsed = U.parseDeviceReference('RDC nº 63/2011, Art. 35, § 3º, inciso II, alínea a');
assert.equal(parsed.artigo, '35');
assert.equal(parsed.paragrafo, '3');
assert.equal(parsed.inciso, 'II');
assert.equal(parsed.alinea, 'a');

const rdc63 = doc([
  'rdc-63-2011::artigo::35',
  'rdc-63-2011::artigo::35::paragrafo::3',
  'rdc-63-2011::artigo::35::paragrafo::3::inciso::ii',
  'rdc-63-2011::artigo::35::paragrafo::3::inciso::ii::alinea::a'
]);

let r = U.resolveReference(rdc63, {
  slug: 'rdc-63-2011', artigo: '35', paragrafo: '3', inciso: 'II', alinea: 'a'
});
assert.equal(r.found, true);
assert.equal(r.exact, true);
assert.equal(r.resolvedId, 'rdc-63-2011::artigo::35::paragrafo::3::inciso::ii::alinea::a');

const rdc63Fallback = doc(['rdc-63-2011::artigo::35']);
r = U.resolveReference(rdc63Fallback, {
  slug: 'rdc-63-2011', artigo: '35', paragrafo: '3'
});
assert.equal(r.found, true);
assert.equal(r.exact, false);
assert.equal(r.fallbackLevel, 'artigo');
assert.equal(r.resolvedId, 'rdc-63-2011::artigo::35');

const rdc204 = doc([
  'rdc-204-2006::regulamento-tecnico',
  'rdc-204-2006::regulamento-tecnico::item::7-2'
]);
r = U.resolveReference(rdc204, { slug: 'rdc-204-2006', item: '7.2' });
assert.equal(r.exact, true);
assert.equal(r.resolvedId, 'rdc-204-2006::regulamento-tecnico::item::7-2');

const rdc67 = doc([
  'rdc-67-2007::regulamento-tecnico',
  'rdc-67-2007::regulamento-tecnico::item::5-1'
]);
r = U.resolveReference(rdc67, { slug: 'rdc-67-2007', item: '5.1' });
assert.equal(r.exact, true);
assert.equal(r.resolvedId, 'rdc-67-2007::regulamento-tecnico::item::5-1');

const annex = doc([
  'rdc-67-2007::anexo-iii::anexo::iii',
  'rdc-67-2007::anexo-iii::anexo::iii::item::2-7'
]);
r = U.resolveReference(annex, { slug: 'rdc-67-2007', anexo: 'III', item: '2.7' });
assert.equal(r.exact, true);
assert.equal(r.resolvedId, 'rdc-67-2007::anexo-iii::anexo::iii::item::2-7');

const unico = doc([
  'rdc-44-2009::artigo::10',
  'rdc-44-2009::artigo::10::paragrafo::unico'
]);
r = U.resolveReference(unico, { slug: 'rdc-44-2009', artigo: '10', paragrafo: 'unico' });
assert.equal(r.exact, true);

const manifest = {
  normas: {
    'RDC 63-2011': { arquivo: 'rdc-63-2011.json' },
    'RDC 430-2020': { arquivo: 'rdc-430-2020.json' },
    'RDC 204-2006': { arquivo: 'rdc-204-2006.json' },
    'IN 62-2020': { arquivo: 'in-62-2020.json' }
  }
};
assert.equal(U.getDocumentPath(manifest, 'RDC nº 63/2011'), 'normas/rdc-63-2011.json');
assert.equal(U.getDocumentPath(manifest, 'RDC nº 430/2020'), 'normas/rdc-430-2020.json');
assert.equal(U.getDocumentPath(manifest, 'RDC nº 204/2006'), 'normas/rdc-204-2006.json');
assert.equal(U.getDocumentPath(manifest, 'IN nº 62/2020'), 'normas/in-62-2020.json');

const summary = U.validateReferences([
  { slug: 'rdc-63-2011', artigo: '35', paragrafo: '3' },
  { slug: 'rdc-63-2011', artigo: '35', paragrafo: '4' },
  { slug: 'rdc-430-2020', artigo: '999' }
], {
  'rdc-63-2011': rdc63,
  'rdc-430-2020': doc(['rdc-430-2020::artigo::1'])
});
assert.equal(summary.total, 3);
assert.equal(summary.exact, 1);
assert.equal(summary.fallback, 1);
assert.equal(summary.missing, 1);
assert.equal(summary.ok, false);

console.log(JSON.stringify({
  ok: true,
  testes: 19,
  cobertura: [
    'normalizacao de norma',
    'artigo/paragrafo/inciso/alinea',
    'fallback hierarquico',
    'RDC 67 regulamento tecnico',
    'RDC 204 regulamento tecnico',
    'anexo numerado',
    'paragrafo unico',
    'manifest',
    'diagnostico em lote'
  ]
}, null, 2));
