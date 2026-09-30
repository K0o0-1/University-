const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const PAGES = [
  {path:'/materials/enterprise-architecture.html', count:275},
  {path:'/materials/mcq-flutter.html', count:341},
  {path:'/materials/mcq-information-security-privacy.html', count:200},
  {path:'/materials/qa-information-security-privacy.html', count:100},
];

async function fresh(page,path=PAGES[0].path){
  await page.goto(BASE + path);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('main .q');
  await page.waitForFunction(() => window.StudyHotfixes?.ready === true);
}

async function expectPanelOnTop(page,wrapSelector){
  const panel = page.locator(`${wrapSelector} .phase1-menu-panel`);
  await expect(panel).toBeVisible();
  const state = await panel.evaluate(el => {
    const target = el.querySelector('button') || el;
    const r = target.getBoundingClientRect();
    const x = Math.min(window.innerWidth - 2, Math.max(1, r.left + r.width / 2));
    const y = Math.min(window.innerHeight - 2, Math.max(1, r.top + r.height / 2));
    const top = document.elementFromPoint(x,y);
    const rect = el.getBoundingClientRect();
    return {
      onTop:!!top?.closest('.phase1-menu-panel'),
      left:rect.left,
      right:rect.right,
      width:window.innerWidth,
      display:getComputedStyle(el).display,
    };
  });
  expect(state.display).not.toBe('none');
  expect(state.onTop).toBe(true);
  expect(state.left).toBeGreaterThanOrEqual(-1);
  expect(state.right).toBeLessThanOrEqual(state.width + 1);
}

test.describe('Menu layering and review-later filter hotfix', () => {
  test('study tools and more menus stay above page content on mobile', async ({ page }) => {
    await page.setViewportSize({width:390,height:844});
    await fresh(page);

    await page.locator('#phase1StudyToolsBtn').click();
    await expectPanelOnTop(page,'#phase1StudyTools');
    await page.locator('#phase1StudyToolsBtn').click();

    await page.locator('#phase1MoreBtn').click();
    await expectPanelOnTop(page,'#phase1More');
  });

  test('all materials hide Favorites from filtering and expose Review Later instead', async ({ page }) => {
    for (const material of PAGES) {
      await fresh(page,material.path);
      const options = await page.locator('#filterBy option').evaluateAll(nodes => nodes.map(option => ({value:option.value,text:option.textContent.trim()})));
      expect(options.some(option => option.value === 'fav')).toBe(false);
      expect(options.some(option => option.value === 'review' && option.text.includes('راجع لاحقًا'))).toBe(true);
    }
  });

  test('Review Later filter follows the card flag live for MCQ and Q&A', async ({ page }) => {
    for (const material of [PAGES[0],PAGES[3]]) {
      await fresh(page,material.path);
      const first = page.locator('#q1');
      const qid = await first.getAttribute('data-qid');

      await first.locator('.btn-review').click();
      expect(await page.evaluate(id => !!window.StudyEngine.state.reviewFlags[id], qid)).toBe(true);

      await page.locator('#phase2FilterBtn').click();
      await page.locator('#filterBy').selectOption('review');
      await expect(page.locator('main .q:not(.hidden)')).toHaveCount(1);
      expect(await page.evaluate(() => window.StudyEngine.filteredItems().length)).toBe(1);
      await page.locator('#phase2FilterSheet .phase2-sheet-close').click();

      await first.locator('.btn-review').click();
      await expect(page.locator('main .q:not(.hidden)')).toHaveCount(0);
      expect(await page.evaluate(() => window.StudyEngine.filteredItems().length)).toBe(0);

      await page.locator('#phase2FilterBtn').click();
      await page.locator('#filterBy').selectOption('all');
      await page.locator('#phase2FilterSheet .phase2-sheet-close').click();
      await expect(page.locator('main .q:not(.hidden)')).toHaveCount(material.count);
    }
  });
});
