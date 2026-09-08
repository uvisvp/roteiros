/* =============================================================
   Service worker — Inspeção Sanitária / UVIS
   -------------------------------------------------------------
   A troca de versão é decidida pela pessoa usuária. O worker não
   toca em IndexedDB nem em localStorage; o rascunho da inspeção
   permanece separado do cache do aplicativo.
   ============================================================= */
'use strict';

const VERSAO = '20260907-16';
const CACHE_APP   = 'app-' + VERSAO;
const CACHE_DADOS = 'dados-v1';

const ESSENCIAIS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './versao.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './farmacia-manipulacao.png'
];

self.addEventListener('install', event => {
  /* Sem skipWaiting no install: a atualização só troca após o clique. */
  event.waitUntil(
    caches.open(CACHE_APP)
      .then(c => c.addAll(ESSENCIAIS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.map(n => {
      /* O cache de dados permanece entre versões. */
      if (n.startsWith('app-') && n !== CACHE_APP) return caches.delete(n);
      return null;
    }));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  const dado = event.data || {};
  if (dado.tipo === 'ATUALIZAR_AGORA') self.skipWaiting();
  if (dado.tipo === 'VERSAO_SW') {
    event.source && event.source.postMessage({ tipo: 'VERSAO_SW', versao: VERSAO });
  }
  if (dado.tipo === 'LIMPAR_DADOS') {
    event.waitUntil(caches.delete(CACHE_DADOS));
  }
});

function semCache(url) {
  return /\/versao\.json(\?|$)/.test(url) || /\/dados\/manifest\.json(\?|$)/.test(url);
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
      return guardado || await rede || new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } });
    })());
    return;
  }

  event.respondWith((async () => {
    const guardado = await caches.match(req);
    if (guardado) return guardado;
    try {
      const r = await fetch(req);
      if (r && r.ok && r.type === 'basic') {
        const cache = await caches.open(CACHE_APP);
        cache.put(req, r.clone());
      }
      return r;
    } catch (e) {
      const alvo = await caches.match('./index.html');
      if (alvo && req.mode === 'navigate') return alvo;
      throw e;
    }
  })());
});
