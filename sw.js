const CACHE = 'university-study-v14';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/pwa-icon.svg',
  './assets/styles.css',
  './assets/mcq-engine.js',
  './assets/qa-engine.js',
  './assets/study-v2.js',
  './assets/study-plus.js',
  './assets/navigation-phase1.js',
  './assets/study-ui-loader.js',
  './assets/study-phase2.js',
  './assets/question-card-phase3.js',
  './assets/quiz-phase4.js',
  './assets/analytics-phase5.js',
  './assets/print-phase6.js',
  './assets/ui-hotfixes.js',
  './assets/project-fixes.js',
  './materials/enterprise-architecture.html',
  './materials/mcq-flutter.html',
  './materials/mcq-information-security-privacy.html',
  './materials/qa-information-security-privacy.html',
  './data/enterprise-architecture.js',
  './data/flutter-mcq.js',
  './data/security-mcq.js',
  './data/security-qa.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(hit => hit || caches.match('./index.html')))
  );
});
