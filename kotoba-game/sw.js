const CACHE = 'kotoba-game-v2';
const CORE = ['./', './index.html', './record.html', './manifest.webmanifest', './icon.svg', './night.js'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function injectNightScript(html) {
  if (html.includes('night.js')) return html;
  return html.replace('</body>', '<script src="./night.js"></script></body>');
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    const isGame = url.pathname.endsWith('/kotoba-game/') || url.pathname.endsWith('/kotoba-game/index.html');
    event.respondWith(
      fetch(request)
        .then(async response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          if (!isGame || !response.ok) return response;
          const html = await response.text();
          return new Response(injectNightScript(html), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        })
        .catch(async () => {
          const hit = await caches.match(request) || await caches.match('./');
          if (!hit || !isGame) return hit;
          const html = await hit.text();
          return new Response(injectNightScript(html), {
            status: hit.status,
            statusText: hit.statusText,
            headers: hit.headers
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(hit => hit || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
      return response;
    }))
  );
});
