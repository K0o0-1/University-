const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const CACHE = 'university-study-v15';
const MATERIALS = [
  ['/materials/enterprise-architecture.html',275],
  ['/materials/mcq-flutter.html',341],
  ['/materials/mcq-information-security-privacy.html',200],
  ['/materials/qa-information-security-privacy.html',100],
];
const LEARNING = '/materials/learning.html?id=flutter-learning';

test('home-page registration precaches the complete library for first-session offline use', async ({ page, context }) => {
  await page.goto(`${BASE}/`, {waitUntil:'domcontentloaded'});
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service Worker API unavailable');
    await navigator.serviceWorker.ready;
  });

  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) {
    await page.reload({waitUntil:'domcontentloaded'});
  }
  await page.waitForFunction(() => !!navigator.serviceWorker?.controller);

  await page.waitForFunction(async ({cacheName,paths}) => {
    const names = await caches.keys();
    if (!names.includes(cacheName)) return false;
    const cache = await caches.open(cacheName);
    const hits = await Promise.all(paths.map(path => cache.match(new URL(path, location.origin + '/'))));
    return hits.every(Boolean);
  }, {cacheName:CACHE,paths:[...MATERIALS.map(([path]) => path), '/materials/learning.html']});

  await context.setOffline(true);
  try {
    for (const [path,count] of MATERIALS) {
      await page.goto(BASE + path,{waitUntil:'domcontentloaded'});
      await page.waitForSelector('main .q');
      await page.waitForFunction(() => window.ProjectFixes?.ready === true);
      const actual = await page.evaluate(() => window.StudyEngine.allQuestions().length);
      expect(actual).toBe(count);
    }
    await page.goto(BASE + LEARNING,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => window.LearningEngine?.ready === true);
    expect(await page.evaluate(() => window.LearningEngine.questions().length)).toBe(341);

    await page.goto(`${BASE}/`,{waitUntil:'domcontentloaded'});
    await expect(page.locator('.material-card')).toHaveCount(5);
  } finally {
    await context.setOffline(false);
  }
});
