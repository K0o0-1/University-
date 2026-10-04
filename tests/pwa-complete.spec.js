const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const MATERIALS = [
  ['/materials/enterprise-architecture.html',275],
  ['/materials/mcq-flutter.html',341],
  ['/materials/mcq-information-security-privacy.html',200],
  ['/materials/qa-information-security-privacy.html',100],
];

test('home-page registration precaches the complete library for first-session offline use', async ({ page, context }) => {
  await page.goto(`${BASE}/`);
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service Worker API unavailable');
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve,reject) => {
        const timer = setTimeout(() => reject(new Error('Service worker did not take control')),10000);
        navigator.serviceWorker.addEventListener('controllerchange',() => {
          clearTimeout(timer);
          resolve();
        },{once:true});
        location.reload();
      });
    }
  }).catch(() => {});
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker?.controller);
  await page.waitForTimeout(800);

  await context.setOffline(true);
  try {
    for (const [path,count] of MATERIALS) {
      await page.goto(BASE + path,{waitUntil:'domcontentloaded'});
      await page.waitForSelector('main .q');
      await page.waitForFunction(() => window.ProjectFixes?.ready === true);
      const actual = await page.evaluate(() => window.StudyEngine.allQuestions().length);
      expect(actual).toBe(count);
    }
    await page.goto(`${BASE}/`,{waitUntil:'domcontentloaded'});
    await expect(page.locator('.material-card')).toHaveCount(4);
  } finally {
    await context.setOffline(false);
  }
});
