const CACHE = 'kotoba-game-v4';
const CORE = ['./', './index.html', './record.html', './manifest.webmanifest', './icon.svg', './night.js', './version.js'];

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

function injectAppScripts(html) {
  const scripts = [];
  if (!html.includes('night.js')) scripts.push('<script src="./night.js?v=4"></script>');
  if (!html.includes('version.js')) scripts.push('<script src="./version.js?v=2026.08.16.1"></script>');
  if (!scripts.length) return html;
  return html.replace('</body>', `${scripts.join('')}</body>`);
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
    return new Response(injectAppScripts(html), {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    const hit = await caches.match(request) || await caches.match('./');
    if (!hit || !injectGame) return hit;
    const html = await hit.text();
    return new Response(injectAppScripts(html), {
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

  event.respondWith(networkFirst(request, { injectGame: isGameNavigation }));
});
