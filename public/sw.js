// public/sw.js
// Molde do Service Worker com os 5 cuidados inegociáveis (§11.1).
// Substituições em tempo de build por tools/gen-sw.mjs:
//   __VERSAO__   -> SHA-1 de 10 dígitos do conteúdo de dist/
//   __RECURSOS__ -> Lista gerada dos arquivos de dist/

const CACHE_NAME = 'cp-cache-__VERSAO__';
const RECURSOS_PRECARGA = __RECURSOS__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(RECURSOS_PRECARGA);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((chaves) => {
      return Promise.all(
        chaves.map((chave) => {
          if (chave !== CACHE_NAME && chave.startsWith('cp-cache-')) {
            return caches.delete(chave);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. Navegação pela rede primeiro com prazo de 3 s (§11.1, item 1)
  if (req.mode === 'navigate') {
    event.respondWith(
      new Promise((resolve) => {
        const timer = setTimeout(() => {
          caches.match(req, { ignoreVary: true }).then((cached) => {
            if (cached) resolve(cached);
          });
        }, 3000);

        fetch(req, { cache: 'no-cache' }) // §11.1, item 5
          .then((res) => {
            clearTimeout(timer);
            if (res && res.status === 200) {
              const resClone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            }
            resolve(res);
          })
          .catch(() => {
            clearTimeout(timer);
            caches.match(req, { ignoreVary: true }).then((cached) => {
              if (cached) resolve(cached);
              else caches.match('./index.html', { ignoreVary: true }).then(resolve);
            });
          });
      })
    );
    return;
  }

  // 2. Demais recursos estáticos: Cache First com fallback de rede
  event.respondWith(
    caches.match(req, { ignoreVary: true }).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && url.origin === location.origin) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      });
    })
  );
});
