/* =============================================================
   Service worker — Inspeção Sanitária / UVIS
   -------------------------------------------------------------
   A troca de versão é decidida pela pessoa usuária. O worker não
   toca em IndexedDB nem em localStorage; o rascunho da inspeção
   permanece separado do cache do aplicativo.
   ============================================================= */
'use strict';

const VERSAO = '20260911-28';
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

async function preparaAplicativo() {
  // Cada versão baixa seus arquivos da rede. O cache HTTP antigo não pode
  // colocar o HTML anterior dentro do cache de um worker recém-publicado.
  const arquivos = await Promise.all(ESSENCIAIS.map(async caminho => {
    const chave = new URL(caminho, self.location.href);
    const origem = new URL(chave);
    origem.searchParams.set('__uvis_build', VERSAO);
    const resposta = await fetch(origem.href, { cache: 'no-store' });
    if (!resposta.ok) throw new Error('Arquivo indisponível: ' + caminho);
    if (caminho === './' || caminho === './index.html') {
      const texto = await resposta.clone().text();
      const versao = /const APP_VERSAO\s*=\s*['"]([^'"]+)['"]/.exec(texto)?.[1];
      if (versao !== VERSAO) throw new Error('HTML e atualização pertencem a versões diferentes.');
    }
    if (caminho === './versao.json' && (await resposta.clone().json()).versao !== VERSAO) {
      throw new Error('A publicação ainda não terminou.');
    }
    return { chave: chave.href, resposta };
  }));
  const cache = await caches.open(CACHE_APP);
  await Promise.all(arquivos.map(a => cache.put(a.chave, a.resposta)));
}

self.addEventListener('install', event => {
  /* Sem skipWaiting no install: a atualização só troca após o clique. */
  event.waitUntil(preparaAplicativo());
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
    const cache = await caches.open(CACHE_APP);
    const guardado = await cache.match(req);
    if (guardado) return guardado;
    try {
      const r = await fetch(req);
      if (r && r.ok && r.type === 'basic') {
        cache.put(req, r.clone());
      }
      return r;
    } catch (e) {
      const alvo = await cache.match('./index.html');
      if (alvo && req.mode === 'navigate') return alvo;
      throw e;
    }
  })());
});
