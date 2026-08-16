const CACHE = 'kotoba-game-v9';
const CORE = ['./', './index.html', './record.html', './manifest.webmanifest', './icon.svg', './night.js', './version.js', './voice-fallback.js', './ui-controls.js', './voice-settings.js'];

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

function injectGameScripts(html) {
  const scripts = [];
  if (!html.includes('night.js')) scripts.push('<script src="./night.js?v=9"></script>');
  if (!html.includes('voice-fallback.js')) scripts.push('<script src="./voice-fallback.js?v=2026.08.16.7"></script>');
  if (!html.includes('ui-controls.js')) scripts.push('<script src="./ui-controls.js?v=2026.08.16.7"></script>');
  if (!html.includes('version.js')) scripts.push('<script src="./version.js?v=2026.08.16.7"></script>');
  if (!scripts.length) return html;
  return html.replace('</body>', `${scripts.join('')}</body>`);
}

function injectRecordScripts(html) {
  if (html.includes('voice-settings.js')) return html;
  return html.replace('</body>', '<script src="./voice-settings.js?v=2026.08.16.7"></script></body>');
}

async function networkFirst(request, { page = '' } = {}) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
    }

    if (!page || !response || !response.ok) return response;
    let html = await response.text();
    if (page === 'game') html = injectGameScripts(html);
    if (page === 'record') html = injectRecordScripts(html);
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    const hit = await caches.match(request) || await caches.match('./');
    if (!hit || !page) return hit;
    let html = await hit.text();
    if (page === 'game') html = injectGameScripts(html);
    if (page === 'record') html = injectRecordScripts(html);
    return new Response(html, {
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

  let page='';
  if(request.mode === 'navigate'){
    if(url.pathname.endsWith('/kotoba-game/') || url.pathname.endsWith('/kotoba-game/index.html')) page='game';
    else if(url.pathname.endsWith('/kotoba-game/record.html')) page='record';
  }

  event.respondWith(networkFirst(request, { page }));
});
