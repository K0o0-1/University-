const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const EA = `${BASE}/materials/enterprise-architecture.html`;
const PAGES = [
  '/materials/enterprise-architecture.html',
  '/materials/mcq-flutter.html',
  '/materials/mcq-information-security-privacy.html',
  '/materials/qa-information-security-privacy.html',
];

async function fresh(page, url = EA) {
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('main .q');
  await page.waitForFunction(() => document.body.classList.contains('phase5-analytics-ux-enabled'));
}

async function openStats(page) {
  await page.locator('[data-action="stats"]').click();
  await expect(page.locator('#statsPageModal')).toHaveClass(/show/);
  await expect(page.locator('#phase5AnalyticsRoot')).toBeVisible();
}

test.describe('Phase 5 Analytics UX', () => {
  test('all materials open a focused analytics overview with three progressive tabs', async ({ page }) => {
    const errors = [];
    page.on('pageerror',e => errors.push(e.message));
    for (const path of PAGES) {
      await fresh(page,BASE + path);
      await openStats(page);
      await expect(page.locator('.phase5-tab')).toHaveCount(3);
      await expect(page.locator('[data-phase5-tab="overview"]')).toHaveClass(/active/);
      await expect(page.locator('.phase5-highlight')).toHaveCount(4);
      await expect(page.locator('.phase5-secondary span')).toHaveCount(2);
      await expect(page.locator('[data-phase5-panel="overview"]')).toBeVisible();
      await expect(page.locator('[data-phase5-panel="sections"]')).toBeHidden();
      await expect(page.locator('[data-phase5-panel="tests"]')).toBeHidden();
      await page.locator('#statsPageClose').click();
    }
    expect(errors).toEqual([]);
  });

  test('section analytics stay intact but move behind the Sections tab', async ({ page }) => {
    await fresh(page);
    await openStats(page);
    await page.locator('[data-phase5-tab="sections"]').click();
    await expect(page.locator('[data-phase5-panel="sections"]')).toBeVisible();
    await expect(page.locator('[data-phase5-panel="overview"]')).toBeHidden();
    const sectionPanel = page.locator('[data-phase5-panel="sections"]');
    await expect(sectionPanel).toContainText('إحصائيات كل قسم');
    await expect(sectionPanel.locator('.analytics-table')).toHaveCount(1);
    await expect(sectionPanel.locator('tbody tr')).toHaveCount(8);
  });

  test('quiz history and previous-test details stay intact behind the Tests tab', async ({ page }) => {
    await fresh(page);
    await openStats(page);
    await page.locator('[data-phase5-tab="tests"]').click();
    const testsPanel = page.locator('[data-phase5-panel="tests"]');
    await expect(testsPanel).toBeVisible();
    await expect(testsPanel).toContainText('آخر الاختبارات');
    await expect(testsPanel).toContainText('تفاصيل الاختبارات السابقة');
    await expect(testsPanel.locator('.analytics-table')).toHaveCount(1);
    await expect(testsPanel).toContainText('لا يوجد سجل اختبارات حتى الآن');
  });

  test('all six legacy summary metrics remain available through one disclosure', async ({ page }) => {
    await fresh(page);
    await openStats(page);
    await expect(page.locator('#phase5SummaryDetails')).not.toHaveAttribute('open','');
    await page.locator('#phase5SummaryDetails summary').click();
    await expect(page.locator('#phase5SummaryDetails')).toHaveAttribute('open','');
    await expect(page.locator('#phase5SummaryDetails .analytics-card')).toHaveCount(6);
    await expect(page.locator('#phase5SummaryDetails')).toContainText('عدد الاختبارات');
    await expect(page.locator('#phase5SummaryDetails')).toContainText('أفضل نتيجة');
  });

  test('weak questions show only the first three by default and expand on demand', async ({ page }) => {
    await fresh(page);
    await page.evaluate(() => {
      const state = window.StudyEngine.state;
      state.questionStats = state.questionStats || {};
      const items = window.StudyEngine.allQuestions().slice(0,5);
      items.forEach((q,index) => {
        state.questionStats[q.id] = {attempts:3,correct:index % 2,wrong:3-(index % 2),lastResult:'wrong',lastAt:new Date().toISOString()};
      });
      window.StudyEngine.saveState();
    });
    await openStats(page);
    const weak = page.locator('[data-phase5-panel="overview"] .weak-item');
    expect(await weak.count()).toBeGreaterThanOrEqual(5);
    const visibleBefore = await weak.evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').length);
    expect(visibleBefore).toBe(3);
    await page.locator('.phase5-weak-toggle').click();
    const visibleAfter = await weak.evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').length);
    expect(visibleAfter).toBeGreaterThanOrEqual(5);
  });

  test('mobile analytics use the full viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({width:390,height:844});
    await fresh(page);
    await openStats(page);
    const layout = await page.evaluate(() => {
      const card = document.querySelector('#statsPageModal .phase5-stats-card');
      return {
        scrollWidth:document.documentElement.scrollWidth,
        innerWidth:window.innerWidth,
        cardLeft:card.getBoundingClientRect().left,
        cardRight:card.getBoundingClientRect().right,
        tabCount:document.querySelectorAll('.phase5-tab').length,
      };
    });
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
    expect(layout.cardLeft).toBeGreaterThanOrEqual(0);
    expect(layout.cardRight).toBeLessThanOrEqual(layout.innerWidth + 1);
    expect(layout.tabCount).toBe(3);
    await page.locator('[data-phase5-tab="tests"]').click();
    await expect(page.locator('[data-phase5-panel="tests"]')).toBeVisible();
  });
});
