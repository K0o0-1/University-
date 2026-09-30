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
  await page.waitForFunction(() => document.body.classList.contains('phase2-study-enabled'));
}

test.describe('Phase 2 simplified study page', () => {
  test('all materials expose three calm indicators and retire the large index from the main flow', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const path of PAGES) {
      await fresh(page, BASE + path);
      await expect(page.locator('.stats .phase2-summary-item')).toHaveCount(3);
      await expect(page.locator('#phase2LegacyStats')).toBeHidden();
      await expect(page.locator('#index')).toBeHidden();
      const total = await page.evaluate(() => window.StudyEngine.allQuestions().length);
      await expect(page.locator('#phase2Studied')).toHaveText(`0/${total}`);
      await expect(page.locator('#phase2Mastery')).toHaveText('0%');
      await expect(page.locator('#phase2Review')).toHaveText('0');
    }
    expect(errors).toEqual([]);
  });

  test('study progress indicator follows the existing reveal state without changing engine semantics', async ({ page }) => {
    await fresh(page);
    await expect(page.locator('#phase2Studied')).toHaveText('0/275');
    await page.locator('#q1 .qt').click();
    await expect(page.locator('#q1')).toHaveClass(/revealed/);
    await expect(page.locator('#phase2Studied')).toHaveText('1/275');
    await expect(page.locator('#statProgress')).toHaveText('1/275');
  });

  test('search stays immediate while filter and sort controls use progressive disclosure', async ({ page }) => {
    await fresh(page);
    await expect(page.locator('#search')).toBeVisible();
    await expect(page.locator('#filterBy')).toBeHidden();
    await expect(page.locator('#sortBy')).toBeHidden();

    await page.locator('#search').fill('definitely-no-question-matches-this');
    await expect(page.locator('#emptyMsg')).toBeVisible();
    await page.locator('#search').fill('');
    await expect(page.locator('#emptyMsg')).toBeHidden();

    await page.locator('#phase2FilterBtn').click();
    await expect(page.locator('#phase2FilterSheet')).toHaveClass(/show/);
    await expect(page.locator('#filterBy')).toBeVisible();
    await expect(page.locator('#sortBy')).toBeVisible();
    await page.selectOption('#sortBy','wrong-desc');
    await expect(page.locator('#phase2FilterBtn')).toHaveClass(/active/);
    await expect(page.locator('#emptyMsg')).toBeVisible();
    await page.locator('#clearBtn').click();
    await expect(page.locator('#phase2FilterSheet')).not.toHaveClass(/show/);
    await expect(page.locator('#phase2FilterBtn')).not.toHaveClass(/active/);
    await expect(page.locator('#emptyMsg')).toBeHidden();
  });

  test('sections button replaces the large section index and keeps section filtering functional', async ({ page }) => {
    await fresh(page);
    await page.locator('#phase2SectionsBtn').click();
    await expect(page.locator('#phase2SectionsSheet')).toHaveClass(/show/);
    const optionCount = await page.locator('#secFilter option').count();
    await expect(page.locator('.phase2-section-item')).toHaveCount(optionCount);

    await page.locator('.phase2-section-item[data-section-value="sec2"]').click();
    await expect(page.locator('#secFilter')).toHaveValue('sec2');
    await expect(page.locator('#phase2SectionsBtn')).toContainText('القسم 2');
    await expect(page.locator('main > section#sec2')).not.toHaveClass(/hidden/);
    const otherVisible = await page.locator('main > section:not(#sec2):not(.hidden)').count();
    expect(otherVisible).toBe(0);

    await page.locator('#phase2SectionsBtn').click();
    await page.locator('.phase2-section-item[data-section-value=""]').click();
    await expect(page.locator('#secFilter')).toHaveValue('');
    await expect(page.locator('#phase2SectionsBtn')).toHaveText('الأقسام ▾');
  });

  test('mobile stays compact with no horizontal overflow and keeps the Phase 1 bottom navigation clear', async ({ page }) => {
    await page.setViewportSize({width:390,height:844});
    await fresh(page);
    await expect(page.locator('#phase1PrimaryNav > button')).toHaveCount(4);
    await expect(page.locator('.stats .phase2-summary-item')).toHaveCount(3);
    await expect(page.locator('#search')).toBeVisible();
    await expect(page.locator('#phase2FilterBtn')).toBeVisible();
    await expect(page.locator('#phase2SectionsBtn')).toBeVisible();
    const layout = await page.evaluate(() => ({
      scrollWidth:document.documentElement.scrollWidth,
      innerWidth:window.innerWidth,
      headerPaddingTop:parseFloat(getComputedStyle(document.querySelector('header')).paddingTop) || 0,
      navPosition:getComputedStyle(document.getElementById('phase1PrimaryNav')).position,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
    expect(layout.headerPaddingTop).toBeLessThanOrEqual(12);
    expect(layout.navPosition).toBe('fixed');
  });
});
