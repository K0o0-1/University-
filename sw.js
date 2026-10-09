importScripts('./assets/registry-core.js');
importScripts('./data/materials-registry.js');
const CACHE = 'university-study-v26';
const CACHE_PREFIX = 'university-study-';
const CORE = [
  './','./index.html','./manifest.webmanifest','./assets/pwa-icon.svg','./assets/pwa-icon-192.png','./assets/pwa-icon-512.png','./assets/pwa-icon-180.png','./assets/pwa-phase7.css','./assets/pwa-phase7.js','./assets/voice-phase7.js','./assets/styles.css','./assets/learning-design-v4.css',
  './data/materials-registry.js','./assets/registry-core.js','./assets/materials-hub.js',
  './assets/phase5-progress.js','./assets/mcq-engine.js','./assets/qa-engine.js','./assets/study-v2.js','./assets/study-plus.js',
  './assets/navigation-phase1.js','./assets/study-ui-loader.js','./assets/study-phase2.js',
  './assets/question-card-phase3.js','./assets/quiz-phase4.js','./assets/analytics-phase5.js',
  './assets/print-phase6.js','./assets/ui-hotfixes.js','./assets/project-fixes.js'
];
const MATERIAL_FILES = globalThis.UniversityRegistry.offlineFiles(globalThis.MATERIAL_REGISTRY);
const PRECACHE = [...new Set([...CORE, ...MATERIAL_FILES])];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.headers.has('range')) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response && response.ok) { const copy=response.clone(); caches.open(CACHE).then(cache => cache.put(event.request,copy)).catch(()=>{}); }
    return response;
  }).catch(async () => {
    const hit = await caches.match(event.request,{ignoreSearch:true});
    if (hit) return hit;
    if (event.request.mode === 'navigate') return caches.match(new URL('./index.html', self.registration.scope));
    return Response.error();
  }));
});