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
  await page.waitForSelector('.phase3-more-trigger');
}

test.describe('Phase 3 question card UX', () => {
  test('all materials expose only Review Later and More as immediate question actions', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const path of PAGES) {
      await fresh(page, BASE + path);
      await expect(page.locator('body')).toHaveClass(/phase3-question-card-enabled/);
      const card = page.locator('main .q').first();
      const actions = card.locator('.qactions');
      await expect(actions.locator(':scope > button')).toHaveCount(2);
      await expect(actions.locator(':scope > .btn-review')).toBeVisible();
      await expect(actions.locator(':scope > .phase3-more-trigger')).toBeVisible();
      await expect(actions.locator('.btn-fav')).toHaveCount(1);
      await expect(actions.locator('.btn-share')).toHaveCount(1);
      await expect(actions.locator('.btn-fav')).toBeHidden();
      await expect(actions.locator('.btn-share')).toBeHidden();
      await expect(actions.locator('.btn-mastered')).toBeHidden();
      await expect(actions.locator('.btn-copy')).toBeHidden();
      await expect(actions.locator('.btn-qstats')).toBeHidden();
    }
    expect(errors).toEqual([]);
  });

  test('More reveals mastery, copy and question statistics while favorite and share stay hidden', async ({ page }) => {
    await fresh(page);
    const card = page.locator('main .q').first();
    await card.locator('.phase3-more-trigger').click();
    await expect(card.locator('.qactions')).toHaveClass(/phase3-menu-open/);
    await expect(card.locator('.btn-mastered')).toBeVisible();
    await expect(card.locator('.btn-copy')).toBeVisible();
    await expect(card.locator('.btn-qstats')).toBeVisible();
    await expect(card.locator('.btn-mastered')).toHaveAttribute('aria-label','الإتقان اليدوي');
    await expect(card.locator('.btn-copy')).toHaveAttribute('aria-label','نسخ السؤال');
    await expect(card.locator('.btn-qstats')).toHaveAttribute('aria-label','إحصائيات السؤال');
    await expect(card.locator('.btn-fav')).toBeHidden();
    await expect(card.locator('.btn-share')).toBeHidden();
  });

  test('Review Later stays one-tap and manual mastery still works from More', async ({ page }) => {
    await fresh(page);
    const card = page.locator('main .q').first();
    const review = card.locator('.btn-review');
    await review.click();
    await expect(review).toHaveClass(/on/);

    await card.locator('.phase3-more-trigger').click();
    await card.locator('.btn-mastered').click();
    await expect(card).toHaveClass(/mastered/);
    await expect(card.locator('.btn-mastered')).toHaveClass(/mastered-on/);

    const state = await page.evaluate(() => {
      const key = 'enterprise275_state_ea2_v5';
      const s = JSON.parse(localStorage.getItem(key) || '{}');
      return {
        reviewCount:Object.values(s.reviewFlags || {}).filter(Boolean).length,
        masteredCount:Object.values(s.mastered || {}).filter(Boolean).length,
      };
    });
    expect(state.reviewCount).toBe(1);
    expect(state.masteredCount).toBe(1);
  });

  test('Question statistics remain functional from More', async ({ page }) => {
    await fresh(page);
    const card = page.locator('main .q').first();
    await card.locator('.phase3-more-trigger').click();
    await card.locator('.btn-qstats').click();
    await expect(page.locator('#questionStatsModal')).toHaveClass(/show/);
    await expect(page.locator('#questionStatsContent')).toContainText('المحاولات');
    await page.locator('#questionStatsClose').click();
    await expect(card.locator('.qactions')).not.toHaveClass(/phase3-menu-open/);
  });

  test('question menu closes with Escape and outside click', async ({ page }) => {
    await fresh(page);
    const card = page.locator('main .q').first();
    const actions = card.locator('.qactions');
    await card.locator('.phase3-more-trigger').click();
    await expect(actions).toHaveClass(/phase3-menu-open/);
    await page.keyboard.press('Escape');
    await expect(actions).not.toHaveClass(/phase3-menu-open/);

    await card.locator('.phase3-more-trigger').click();
    await expect(actions).toHaveClass(/phase3-menu-open/);
    await page.locator('#search').click();
    await expect(actions).not.toHaveClass(/phase3-menu-open/);
  });

  test('mobile card actions stay compact and More remains inside the viewport', async ({ page }) => {
    await page.setViewportSize({width:390,height:844});
    await fresh(page);
    const card = page.locator('main .q').first();
    await card.locator('.phase3-more-trigger').click();
    const layout = await page.evaluate(() => {
      const menu = document.querySelector('main .q .phase3-actions-menu');
      const box = menu.getBoundingClientRect();
      return {
        scrollWidth:document.documentElement.scrollWidth,
        innerWidth:window.innerWidth,
        menuLeft:box.left,
        menuRight:box.right,
      };
    });
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
    expect(layout.menuLeft).toBeGreaterThanOrEqual(0);
    expect(layout.menuRight).toBeLessThanOrEqual(layout.innerWidth + 1);
    await expect(card.locator('.btn-review')).toBeVisible();
    await expect(card.locator('.phase3-more-trigger')).toBeVisible();
  });
});
