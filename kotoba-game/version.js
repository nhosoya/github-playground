(()=>{
  const APP_VERSION = '2026.08.16.14';
  const start = document.getElementById('start');
  if (!start || document.getElementById('appVersion')) return;

  const el = document.createElement('div');
  el.id = 'appVersion';
  el.textContent = `v${APP_VERSION}`;
  el.style.position = 'absolute';
  el.style.left = '50%';
  el.style.bottom = 'max(10px, env(safe-area-inset-bottom))';
  el.style.transform = 'translateX(-50%)';
  el.style.fontSize = '12px';
  el.style.fontWeight = '800';
  el.style.letterSpacing = '.04em';
  el.style.color = '#52656d';
  el.style.opacity = '.55';
  el.style.pointerEvents = 'none';
  start.appendChild(el);
})();
