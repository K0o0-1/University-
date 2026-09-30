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
}

test.describe('Phase 1 information architecture', () => {
  test('Quiz is the single entry point and setup keeps Practice and Exam on all materials', async ({ page }) => {
    for (const path of PAGES) {
      await fresh(page, BASE + path);
      await page.locator('#phase1QuizBtn').click();
      await expect(page.locator('#quizSetupModal')).toHaveClass(/show/);
      const values = await page.locator('#quizSetupMode option').evaluateAll(options => options.map(o => o.value));
      expect(values).toEqual(['practice', 'exam']);
      await page.locator('#quizSetupCancel').click();
      await expect(page.locator('[data-action="mode-practice-v2"]')).toBeHidden();
      await expect(page.locator('[data-action="mode-exam-v2"]')).toBeHidden();
    }
  });

  test('Study Tools keep Focus and Show All functional from their contextual menu', async ({ page }) => {
    await fresh(page);
    await page.locator('#phase1StudyToolsBtn').click();
    await expect(page.locator('[data-action="focus"]')).toBeVisible();
    await expect(page.locator('[data-action="toggle-reveal"]')).toBeVisible();

    await page.locator('[data-action="focus"]').click();
    await expect(page.locator('body')).toHaveClass(/focus-mode/);
    await page.locator('[data-action="focus"]').click();
    await expect(page.locator('body')).not.toHaveClass(/focus-mode/);

    await page.locator('[data-action="toggle-reveal"]').click();
    await expect(page.locator('[data-action="toggle-reveal"]')).toContainText('إخفاء الكل');
    await expect(page.locator('#q1')).toHaveClass(/revealed/);
  });

  test('More menu preserves print, backup, restore, reset and CSV access', async ({ page }) => {
    await fresh(page);

    await page.locator('#phase1MoreBtn').click();
    await expect(page.locator('[data-action="print"]')).toBeVisible();
    await expect(page.locator('#phase1BackupBtn')).toBeVisible();
    await expect(page.locator('#phase1RestoreBtn')).toBeVisible();
    await expect(page.locator('[data-action="reset"]')).toBeVisible();
    await expect(page.locator('[data-action="export-menu"]')).toBeVisible();
    await expect(page.locator('[data-action="install"]')).toBeHidden();

    await page.locator('[data-action="print"]').click();
    await expect(page.locator('#phase6PrintModal')).toHaveClass(/show/);
    await expect(page.locator('input[name="phase6-content"][value="questions"]')).toBeChecked();
    await page.locator('#phase6PrintCancel').click();

    await page.locator('#phase1MoreBtn').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#phase1BackupBtn').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.json$/i);

    await page.locator('#phase1MoreBtn').click();
    await page.locator('#phase1RestoreBtn').click();
    await expect(page.locator('#restoreModal')).toHaveClass(/show/);
    await page.locator('#restoreModal .btn-secondary').click();

    await page.locator('#phase1MoreBtn').click();
    await page.locator('[data-action="reset"]').click();
    await expect(page.locator('#resetModal')).toHaveClass(/show/);
    await page.locator('#resetCancel').click();

    await page.locator('#phase1MoreBtn').click();
    await page.locator('[data-action="export-menu"]').click();
    await expect(page.locator('#exportMenuModal')).toHaveClass(/show/);
    await expect(page.locator('#exportMenuModal [data-menu="csv-all"]')).toBeVisible();
    await expect(page.locator('#exportMenuModal [data-menu="csv-fav"]')).toBeVisible();
  });

  test('mobile uses four clear bottom actions without horizontal overflow or hidden content', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await fresh(page);
    await expect(page.locator('#phase1PrimaryNav > button')).toHaveCount(4);
    for (const button of await page.locator('#phase1PrimaryNav > button').all()) {
      await expect(button).toBeVisible();
    }
    const layout = await page.evaluate(() => {
      const nav = document.getElementById('phase1PrimaryNav');
      const bodyStyle = getComputedStyle(document.body);
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        navPosition: getComputedStyle(nav).position,
        navHeight: nav.getBoundingClientRect().height,
        paddingBottom: parseFloat(bodyStyle.paddingBottom) || 0,
      };
    });
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
    expect(layout.navPosition).toBe('fixed');
    expect(layout.paddingBottom).toBeGreaterThanOrEqual(layout.navHeight);
  });

  test('desktop keeps the same four functions in compact non-fixed navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await fresh(page);
    const primary = page.locator('#phase1PrimaryNav');
    await expect(page.locator('#phase1PrimaryNav > button')).toHaveCount(4);
    expect(await primary.evaluate(el => getComputedStyle(el).position)).not.toBe('fixed');
    await expect(page.locator('#phase1StudyToolsBtn')).toBeVisible();
    await expect(page.locator('#phase1MoreBtn')).toBeVisible();
  });
});
