// 앱 화면 파일을 캐시해서 오프라인에서도 열리게 함. 파일을 고치면 VERSION을 올리세요.
const VERSION = 'moneta-v3';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'xlsx-lite.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // 구글 API·폰트는 그대로 네트워크
  // 네트워크 우선, 실패하면 캐시 (배포한 새 버전이 바로 반영되도록)
  e.respondWith(
    fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
