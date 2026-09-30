const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const PAGES = [
  '/materials/enterprise-architecture.html',
  '/materials/mcq-flutter.html',
  '/materials/mcq-information-security-privacy.html',
  '/materials/qa-information-security-privacy.html',
];

async function fresh(page,path=PAGES[0]) {
  await page.goto(BASE + path);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('main .q');
  await page.waitForFunction(() => document.body.classList.contains('phase7-cleanup-enabled'));
}

test.describe('Phase 7 Cleanup', () => {
  test('all materials reach one centralized UI pipeline with Phases 1-6 intact', async ({ page }) => {
    for (const path of PAGES) {
      await fresh(page,path);
      const state = await page.evaluate(() => ({
        classes:Array.from(document.body.classList),
        phase2:!!window.StudyPhase2,
        phase3:!!window.StudyPhase3,
        phase4:!!window.StudyPhase4,
        phase5:!!window.StudyPhase5,
        phase6:!!window.StudyPhase6,
        phase7:window.StudyPhase7,
      }));
      expect(state.classes).toEqual(expect.arrayContaining([
        'phase1-navigation-enabled','phase2-study-enabled','phase3-question-card-enabled',
        'phase4-quiz-ux-enabled','phase5-analytics-ux-enabled','phase6-print-enabled','phase7-cleanup-enabled'
      ]));
      expect([state.phase2,state.phase3,state.phase4,state.phase5,state.phase6]).toEqual([true,true,true,true,true]);
      expect(state.phase7.ready).toBe(true);
      expect(state.phase7.modules).toEqual(['phase2','phase3','phase4','phase5','phase6']);
    }
  });

  test('central loader owns one ordered copy of every enhancement module', async ({ page }) => {
    await fresh(page);
    const scripts = await page.evaluate(() => ({
      loader:document.querySelectorAll('script[data-study-ui-loader]').length,
      modules:Array.from(document.querySelectorAll('script[data-study-ui-module]')).map(s => ({key:s.dataset.studyUiModule,loaded:s.dataset.loaded,src:new URL(s.src).pathname})),
      oldMarkers:document.querySelectorAll('script[data-phase2-loader],script[data-phase3-loader],script[data-phase4-loader],script[data-phase5-loader],script[data-phase5-core-loader],script[data-phase6-loader]').length,
    }));
    expect(scripts.loader).toBe(1);
    expect(scripts.oldMarkers).toBe(0);
    expect(scripts.modules).toEqual([
      {key:'phase2',loaded:'true',src:'/assets/study-phase2.js'},
      {key:'phase3',loaded:'true',src:'/assets/question-card-phase3.js'},
      {key:'phase4',loaded:'true',src:'/assets/quiz-phase4.js'},
      {key:'phase5',loaded:'true',src:'/assets/analytics-phase5.js'},
      {key:'phase6',loaded:'true',src:'/assets/print-phase6.js'},
    ]);
  });

  test('retired Phase 5 core loader is no longer requested or present', async ({ page, request }) => {
    await fresh(page);
    await expect(page.locator('script[src*="analytics-phase5-core.js"]')).toHaveCount(0);
    const response = await request.get(`${BASE}/assets/analytics-phase5-core.js`);
    expect(response.status()).toBe(404);
  });

  test('cleanup preserves analytics and professional print entry points without runtime errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    await fresh(page);
    await page.locator('[data-action="stats"]').click();
    await expect(page.locator('#statsPageModal')).toHaveClass(/show/);
    await expect(page.locator('#phase5AnalyticsRoot')).toBeVisible();
    await page.locator('#statsPageClose').click();
    await page.locator('#phase1MoreBtn').click();
    await page.locator('[data-action="print"]').click();
    await expect(page.locator('#phase6PrintModal')).toHaveClass(/show/);
    expect(errors).toEqual([]);
  });
});
