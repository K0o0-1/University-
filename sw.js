importScripts('./data/materials-registry.js');
const CACHE = 'university-study-v15';
const CORE = [
  './','./index.html','./manifest.webmanifest','./assets/pwa-icon.svg','./assets/styles.css',
  './data/materials-registry.js','./assets/materials-hub.js',
  './assets/mcq-engine.js','./assets/qa-engine.js','./assets/study-v2.js','./assets/study-plus.js',
  './assets/navigation-phase1.js','./assets/study-ui-loader.js','./assets/study-phase2.js',
  './assets/question-card-phase3.js','./assets/quiz-phase4.js','./assets/analytics-phase5.js',
  './assets/print-phase6.js','./assets/ui-hotfixes.js','./assets/project-fixes.js'
];
const MATERIAL_FILES = (globalThis.MATERIAL_REGISTRY || []).flatMap(material => material.offlineFiles || []);
const PRECACHE = [...new Set([...CORE, ...MATERIAL_FILES])];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response && response.ok) { const copy=response.clone(); caches.open(CACHE).then(cache => cache.put(event.request,copy)).catch(()=>{}); }
    return response;
  }).catch(async () => {
    const hit = await caches.match(event.request,{ignoreSearch:true});
    if (hit) return hit;
    if (event.request.mode === 'navigate') return caches.match('./index.html');
    return Response.error();
  }));
});
