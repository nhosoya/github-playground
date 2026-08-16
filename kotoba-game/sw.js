const CACHE = 'kotoba-game-v3';
const CORE = ['./', './index.html', './record.html', './manifest.webmanifest', './icon.svg', './night.js'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
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
  return html.replace('</body>', '<script src="./night.js?v=3"></script></body>');
}

async function networkFirst(request, { injectGame = false } = {}) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
    }

    if (!injectGame || !response || !response.ok) return response;
    const html = await response.text();
    return new Response(injectNightScript(html), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    const hit = await caches.match(request) || await caches.match('./');
    if (!hit || !injectGame) return hit;
    const html = await hit.text();
    return new Response(injectNightScript(html), {
      status: hit.status,
      statusText: hit.statusText,
      headers: hit.headers
    });
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isGameNavigation = request.mode === 'navigate' &&
    (url.pathname.endsWith('/kotoba-game/') || url.pathname.endsWith('/kotoba-game/index.html'));

  // The app is tiny. Prefer freshness while online and keep the cache only as an offline fallback.
  event.respondWith(networkFirst(request, { injectGame: isGameNavigation }));
});
