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

async function visibleNumbers(page) {
  return page.locator('main .q:not(.hidden)').evaluateAll(nodes =>
    nodes.map(n => Number(n.querySelector('.n')?.textContent || 0))
  );
}

async function seedWrongCounts(page, values) {
  const ids = {};
  for (const [num] of values) {
    ids[num] = await page.locator(`#q${num}`).getAttribute('data-qid');
  }
  await page.evaluate(({ ids, values }) => {
    const key = 'enterprise275_state_ea2_v5';
    const state = JSON.parse(localStorage.getItem(key) || '{}');
    state.wrong = state.wrong || {};
    for (const [num, count] of values) state.wrong[ids[num]] = count;
    localStorage.setItem(key, JSON.stringify(state));
  }, { ids, values });
  await page.reload();
  await page.waitForSelector('main .q');
}

async function chooseWrongOnFirstVisible(page) {
  const card = page.locator('main .q:not(.hidden)').first();
  const answer = Number(await card.getAttribute('data-a'));
  const options = card.locator('ol.o li');
  const count = await options.count();
  const wrong = Array.from({ length: count }, (_, i) => i).find(i => i !== answer);
  await options.nth(wrong).click();
}

test.describe('study library behavior', () => {
  test('all material pages load required controls without page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const path of PAGES) {
      await fresh(page, BASE + path);
      await expect(page.locator('#filterBy')).toBeVisible();
      await expect(page.locator('#sortBy')).toBeVisible();
      await expect(page.locator('#stopQuizFloatBtn')).toHaveCount(1);
      await expect(page.locator('script[src*="runtime-fixes"]')).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });

  test('section filter has unique numbered labels and filters EA correctly', async ({ page }) => {
    await fresh(page);
    const labels = await page.locator('#secFilter option').allTextContents();
    expect(labels).toContain('5. من الشرح — 1 – 30');
    expect(labels).toContain('6. من الشرح — 31 – 60');
    expect(labels).toContain('7. من الشرح — 61 – 73');
    expect(labels).toContain('8. الجزء الثاني — 174 – 275');

    await page.selectOption('#secFilter', 'sec5');
    const nums = await visibleNumbers(page);
    expect(nums).toHaveLength(30);
    expect(nums[0]).toBe(101);
    expect(nums[nums.length - 1]).toBe(130);
  });

  test('error filter shows errors only and error count sorting works both ways', async ({ page }) => {
    await fresh(page);
    await seedWrongCounts(page, [[3, 2], [10, 5], [20, 1]]);

    await page.selectOption('#filterBy', 'wrong');
    expect(await visibleNumbers(page)).toEqual([3, 10, 20]);

    await page.selectOption('#sortBy', 'wrong-desc');
    expect(await visibleNumbers(page)).toEqual([10, 3, 20]);

    await page.selectOption('#sortBy', 'wrong-asc');
    expect(await visibleNumbers(page)).toEqual([20, 3, 10]);
  });

  test('filtered quiz keeps a fixed scope and floating stop computes only attempted questions', async ({ page }) => {
    await fresh(page);
    await page.selectOption('#secFilter', 'sec8');
    expect((await visibleNumbers(page)).length).toBe(102);

    await page.locator('[data-action="mode-quiz"]').click();
    await expect(page.locator('#secFilter')).toBeDisabled();
    await expect(page.locator('#filterBy')).toBeDisabled();
    await expect(page.locator('#stopQuizFloatBtn')).toBeVisible();

    await chooseWrongOnFirstVisible(page);
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect(page.locator('#stopQuizFloatBtn')).toBeVisible();
    await page.locator('#stopQuizFloatBtn').click();

    await expect(page.locator('#quizResult')).toHaveClass(/show/);
    await expect(page.locator('#qrMsg')).toContainText('أجبت عن 1 من 102');
    await expect(page.locator('#qrMsg')).toContainText('خطأ 1');
    await expect(page.locator('#stopQuizFloatBtn')).toBeHidden();
  });

  test('refresh offers resume once; finish clears the paused session permanently', async ({ page }) => {
    await fresh(page);
    await page.selectOption('#secFilter', 'sec1');
    await page.locator('[data-action="mode-quiz"]').click();
    await chooseWrongOnFirstVisible(page);

    await page.reload();
    await expect(page.locator('#resumeQuizModal')).toHaveClass(/show/);
    await expect(page.locator('#resumeQuizText')).toContainText('1 من 20');
    await page.locator('#resumeQuizContinue').click();
    await expect(page.locator('#statProgress')).toHaveText('1/20');
    await expect(page.locator('#stopQuizFloatBtn')).toBeVisible();

    await page.reload();
    await expect(page.locator('#resumeQuizModal')).toHaveClass(/show/);
    await page.locator('#resumeQuizFinish').click();
    await expect(page.locator('#quizResult')).toHaveClass(/show/);
    await expect(page.locator('#qrMsg')).toContainText('أجبت عن 1 من 20');

    await page.reload();
    await page.waitForTimeout(500);
    await expect(page.locator('#resumeQuizModal')).not.toHaveClass(/show/);
  });

  test('study progress survives entering and leaving a quiz', async ({ page }) => {
    await fresh(page);
    await page.locator('#q1').click();
    await expect(page.locator('#q1')).toHaveClass(/revealed/);
    await expect(page.locator('#statProgress')).toHaveText('1/275');

    await page.selectOption('#secFilter', 'sec1');
    await page.locator('[data-action="mode-quiz"]').click();
    await page.locator('#stopQuizFloatBtn').click();
    await page.locator('[data-action="mode-study"]').click();

    await expect(page.locator('#q1')).toHaveClass(/revealed/);
    await expect(page.locator('#statProgress')).toHaveText('1/275');
  });

  test('Q&A uses the same pause/finish lifecycle', async ({ page }) => {
    await fresh(page, `${BASE}/materials/qa-information-security-privacy.html`);
    await page.selectOption('#secFilter', 'sec1');
    await page.locator('[data-action="mode-quiz"]').click();
    const first = page.locator('main .q:not(.hidden)').first();
    await first.locator('.show-answer-btn').click();
    await first.locator('.grade-wrong').click();
    await page.reload();
    await expect(page.locator('#resumeQuizModal')).toHaveClass(/show/);
    await page.locator('#resumeQuizFinish').click();
    await expect(page.locator('#quizResult')).toHaveClass(/show/);
    await expect(page.locator('#qrMsg')).toContainText('قيّمت 1');
  });
});
