/* Service worker — Inspeção Sanitária / UVIS */
'use strict';

const VERSAO = '20260926-5';
const CACHE_APP = 'app-' + VERSAO;
const CACHE_DADOS = 'dados-v1';

/* O shell PWA fica pequeno e confiável. O HTML grande é armazenado
   sob demanda, evitando que a instalação do novo worker falhe por
   causa de um download de ~5 MB durante o evento install. */
const ESSENCIAIS = [
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './central-afe-ae-fix.js',
  './central-nomes-medicamentos.js',
  './farmacia-manipulacao-app.js',
  './farmacia-manipulacao-core.js',
  './farmacia-manipulacao-lookup.js',
  './farmacia-manipulacao-ocr.js',
  './farmacia-manipulacao-section1.js',
  './farmacia-manipulacao-section2.js',
  './farmacia-manipulacao-section3.js',
  './farmacia-manipulacao-section4.js',
  './farmacia-manipulacao-section5.js',
  './farmacia-manipulacao-section6.js',
  './farmacia-manipulacao-section7.js',
  './farmacia-manipulacao-section8.js',
  './farmacia-manipulacao-section9.js',
  './farmacia-manipulacao-report.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_APP);
    for (const caminho of ESSENCIAIS) {
      try {
        const u = new URL(caminho, self.location.href);
        u.searchParams.set('__uvis_build', VERSAO);
        const r = await fetch(u.href, { cache: 'no-store' });
        if (r.ok) await cache.put(new URL(caminho, self.location.href).href, r.clone());
      } catch (_) {}
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.map(n => n.startsWith('app-') && n !== CACHE_APP ? caches.delete(n) : null));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const dado = event.data || {};
  if (dado.tipo === 'ATUALIZAR_AGORA') self.skipWaiting();
  if (dado.tipo === 'VERSAO_SW') {
    event.source && event.source.postMessage({ tipo: 'VERSAO_SW', versao: VERSAO });
  }
  if (dado.tipo === 'LIMPAR_DADOS') event.waitUntil(caches.delete(CACHE_DADOS));
});

function semCache(path) {
  return /\/versao\.json$/.test(path) || /\/dados\/manifest\.json$/.test(path);
}
function ehHTMLPrincipal(url, req) {
  return req.mode === 'navigate' || /\/index\.html$/.test(url.pathname) || /\/roteiros\/$/.test(url.pathname);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (semCache(url.pathname)) {
    event.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(req)));
    return;
  }

  if (url.pathname.includes('/dados/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_DADOS);
      const guardado = await cache.match(req);
      const rede = fetch(req).then(r => {
        if (r && r.ok) cache.put(req, r.clone());
        return r;
      }).catch(() => null);
      return guardado || await rede || new Response('{}', {status:503,headers:{'Content-Type':'application/json'}});
    })());
    return;
  }

  if (ehHTMLPrincipal(url, req)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_APP);
      try {
        const redeUrl = new URL('./index.html', self.location.href);
        redeUrl.searchParams.set('__uvis_build', VERSAO);
        const r = await fetch(redeUrl.href, { cache: 'no-store' });
        if (r && r.ok) {
          let texto = await r.text();
          /* O PWA entrega o build corrente e garante que a navegação atualizada
             seja recebida como uma nova versão, sem reaproveitar o HTML anterior. */
          texto = texto.replace(/const APP_VERSAO\s*=\s*['"][^'"]+['"];/,
                                "const APP_VERSAO = '" + VERSAO + "';");
          texto = texto.replace('</head>',
            '<script>try{localStorage.removeItem("visa.consulta.cache.ttl.v1");indexedDB.deleteDatabase("uvis-consultas");}catch(e){}<\/script></head>');
          const nova = new Response(texto, {
            status: r.status,
            statusText: r.statusText,
            headers: {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}
          });
          await cache.put(new URL('./index.html', self.location.href).href, nova.clone());
          return nova;
        }
      } catch (_) {}
      return (await cache.match(new URL('./index.html', self.location.href).href)) ||
             (await caches.match(new URL('./index.html', self.location.href).href)) ||
             new Response('Aplicativo indisponível offline nesta primeira abertura.', {status:503});
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_APP);
    const guardado = await cache.match(req);
    if (guardado) return guardado;
    try {
      const r = await fetch(req);
      if (r && r.ok && r.type === 'basic') cache.put(req, r.clone());
      return r;
    } catch (e) {
      throw e;
    }
  })());
});
