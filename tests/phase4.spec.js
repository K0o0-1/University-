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
  await page.waitForFunction(() => document.body.classList.contains('phase4-quiz-ux-enabled'));
}

async function openSetup(page) {
  await page.locator('#phase1QuizBtn').click();
  await expect(page.locator('#quizSetupModal')).toHaveClass(/show/);
}

async function chooseMode(page, mode) {
  await page.locator(`[data-phase4-mode="${mode}"]`).click();
  await expect(page.locator('#quizSetupMode')).toHaveValue(mode);
}

async function startBasic(page, {mode='practice', section='sec1', count='10'} = {}) {
  await openSetup(page);
  await chooseMode(page,mode);
  await page.selectOption('#quizSetupSection',section);
  await page.selectOption('#quizSetupCount',count);
  await page.locator('#quizSetupStart').click();
}

async function chooseWrong(page) {
  const card = page.locator('main .q:not(.hidden)').first();
  const answer = Number(await card.getAttribute('data-a'));
  const opts = card.locator('ol.o li');
  const count = await opts.count();
  const wrong = Array.from({length:count},(_,i)=>i).find(i=>i!==answer);
  await opts.nth(wrong).click();
  return card;
}

test.describe('Phase 4 Quiz UX', () => {
  test('all materials expose one simplified quiz setup with Practice/Exam inside', async ({ page }) => {
    const errors = [];
    page.on('pageerror',e => errors.push(e.message));
    for (const path of PAGES) {
      await fresh(page,BASE + path);
      await expect(page.locator('body')).toHaveClass(/phase4-quiz-ux-enabled/);
      await openSetup(page);
      await expect(page.locator('.phase4-mode-btn')).toHaveCount(2);
      await expect(page.locator('[data-phase4-mode="practice"]')).toBeVisible();
      await expect(page.locator('[data-phase4-mode="exam"]')).toBeVisible();
      await expect(page.locator('#quizSetupSection')).toHaveCount(1);
      await expect(page.locator('#quizSetupCount')).toHaveCount(1);
      await expect(page.locator('#phase4QuizAdvancedPanel')).toBeHidden();
      await expect(page.locator('#phase4QuizSetupSummary')).toContainText('تدريب');
      await page.locator('#quizSetupCancel').click();
    }
    expect(errors).toEqual([]);
  });

  test('advanced options preserve source, order and timer without cluttering the first view', async ({ page }) => {
    await fresh(page);
    await openSetup(page);
    await page.locator('#phase4QuizAdvancedBtn').click();
    await expect(page.locator('#phase4QuizAdvancedPanel')).toBeVisible();
    await page.selectOption('#phase4QuizSource','weak');
    await expect(page.locator('#quizSetupSource')).toHaveValue('weak');
    await page.selectOption('#phase4QuizOrder','random');
    await expect(page.locator('#quizSetupOrder')).toHaveValue('random');
    await page.selectOption('#phase4QuizTimeMode','total');
    await page.locator('#phase4QuizTimeValue').fill('15');
    await expect(page.locator('#quizSetupTimeMode')).toHaveValue('total');
    await expect(page.locator('#quizSetupTimeValue')).toHaveValue('15');
    await expect(page.locator('#phase4QuizSetupSummary')).toContainText('نقاط الضعف فقط');
    await expect(page.locator('#phase4QuizSetupSummary')).toContainText('عشوائي');
    await expect(page.locator('#phase4QuizSetupSummary')).toContainText('15 دقيقة');
  });

  test('running quiz becomes contextual and hides unrelated study navigation', async ({ page }) => {
    await fresh(page);
    await startBasic(page,{mode:'practice',section:'sec1',count:'10'});
    await expect(page.locator('body')).toHaveClass(/phase4-quiz-running/);
    await expect(page.locator('#phase4QuizContext')).toBeVisible();
    await expect(page.locator('#phase4QuizState')).toContainText('جارٍ الاختبار');
    await expect(page.locator('#phase4QuizTitle')).toContainText('تدريب');
    await expect(page.locator('#phase4QuizProgress')).toHaveText('0/10');
    await expect(page.locator('#phase1PrimaryNav')).toBeHidden();
    await expect(page.locator('.filterbar')).toBeHidden();
    await expect(page.locator('#quizSkipBtn')).toBeVisible();
    await expect(page.locator('#quizNavBtn')).toBeVisible();
    await expect(page.locator('#stopQuizBtn')).toBeVisible();
    await chooseWrong(page);
    await expect(page.locator('#phase4QuizProgress')).toHaveText('1/10');
  });

  test('Exam keeps correctness hidden then enters a clear Review lifecycle with partial results', async ({ page }) => {
    await fresh(page);
    await startBasic(page,{mode:'exam',section:'sec1',count:'10'});
    const card = await chooseWrong(page);
    await expect(card.locator('ol.o li.exam-choice')).toHaveCount(1);
    await expect(page.locator('#statScore')).toHaveText('مخفي');
    await page.locator('#stopQuizBtn').click();
    await expect(page.locator('#quizResult')).toHaveClass(/show/);
    await expect(page.locator('body')).toHaveClass(/phase4-quiz-review/);
    await expect(page.locator('#phase4QuizState')).toContainText('مراجعة النتيجة');
    await expect(page.locator('#qrMetrics')).toContainText('المجاب');
    await expect(page.locator('#qrMetrics')).toContainText('غير المجاب');
    await expect(page.locator('#qrMetrics')).toContainText('الوقت');
    await expect(page.locator('#phase1PrimaryNav')).toBeVisible();
  });

  test('paused session is labeled clearly and resumes into the same running lifecycle', async ({ page }) => {
    await fresh(page);
    await startBasic(page,{mode:'exam',section:'sec1',count:'10'});
    await chooseWrong(page);
    await page.reload();
    await page.waitForFunction(() => document.body.classList.contains('phase4-quiz-ux-enabled'));
    await expect(page.locator('#resumeQuizModal')).toHaveClass(/show/);
    await expect(page.locator('#resumeQuizModal .phase4-paused-badge')).toContainText('متوقف مؤقتًا');
    await expect(page.locator('#resumeQuizContinue')).toContainText('متابعة الاختبار');
    await page.locator('#resumeQuizContinue').click();
    await expect(page.locator('body')).toHaveClass(/phase4-quiz-running/);
    await expect(page.locator('#phase4QuizProgress')).toHaveText('1/10');
    await expect(page.locator('#phase4QuizState')).toContainText('مستأنف');
  });

  test('mobile quiz context has no horizontal overflow and replaces the bottom navigation while running', async ({ page }) => {
    await page.setViewportSize({width:390,height:844});
    await fresh(page);
    await startBasic(page,{mode:'practice',section:'sec1',count:'10'});
    const layout = await page.evaluate(() => ({
      scrollWidth:document.documentElement.scrollWidth,
      innerWidth:window.innerWidth,
      navDisplay:getComputedStyle(document.getElementById('phase1PrimaryNav')).display,
      contextRight:document.getElementById('phase4QuizContext').getBoundingClientRect().right,
      contextLeft:document.getElementById('phase4QuizContext').getBoundingClientRect().left,
    }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
    expect(layout.navDisplay).toBe('none');
    expect(layout.contextLeft).toBeGreaterThanOrEqual(0);
    expect(layout.contextRight).toBeLessThanOrEqual(layout.innerWidth + 1);
    await expect(page.locator('#stopQuizBtn')).toBeVisible();
    await expect(page.locator('#quizSkipBtn')).toBeVisible();
  });
});
