const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const EA = `${BASE}/materials/enterprise-architecture.html`;
const QA = `${BASE}/materials/qa-information-security-privacy.html`;

async function fresh(page, url = EA) {
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('main .q');
  await page.waitForFunction(() => window.ProjectFixes?.ready === true);
}

async function startQuiz(page, mode='practice') {
  await page.locator('#phase1QuizBtn').click();
  await expect(page.locator('#quizSetupModal')).toHaveClass(/show/);
  await page.locator(`[data-phase4-mode="${mode}"]`).click();
  await page.selectOption('#quizSetupSection','sec1');
  await page.selectOption('#quizSetupCount','10');
  await page.locator('#quizSetupStart').click();
}

async function firstCardData(page) {
  const card = page.locator('main .q:not(.hidden)').first();
  const answer = Number(await card.getAttribute('data-a'));
  const options = card.locator('ol.o li');
  const count = await options.count();
  const wrong = Array.from({length:count},(_,i)=>i).find(i=>i!==answer);
  const neutral = Array.from({length:count},(_,i)=>i).find(i=>i!==answer && i!==wrong);
  return {card,options,answer,wrong,neutral};
}

test.describe('Project-wide fixes', () => {
  test('Practice keeps every option fully readable while marking wrong and correct choices', async ({ page }) => {
    await fresh(page);
    await startQuiz(page,'practice');
    const {card,options,answer,wrong} = await firstCardData(page);
    await options.nth(wrong).click();
    await expect(card).toHaveClass(/answered/);
    await expect(options.nth(answer)).toHaveClass(/correct/);
    await expect(options.nth(wrong)).toHaveClass(/wrong/);
    const opacity = await options.evaluateAll(nodes => nodes.map(n => getComputedStyle(n).opacity));
    expect(opacity.every(value => value === '1')).toBeTruthy();
  });

  test('Exam leaks no correctness clue while running, then reveals correction in Review', async ({ page }) => {
    await fresh(page);
    await startQuiz(page,'exam');
    const {options,answer,wrong,neutral} = await firstCardData(page);
    await options.nth(wrong).click();

    const running = await page.evaluate(({answer,wrong,neutral}) => {
      const opts = Array.from(document.querySelector('main .q:not(.hidden) ol.o').children);
      const snap = i => {
        const cs = getComputedStyle(opts[i]);
        return {opacity:cs.opacity,bg:cs.backgroundColor,color:cs.color,check:getComputedStyle(opts[i].querySelector('.check')).display,outline:cs.outlineStyle};
      };
      return {correct:snap(answer),wrong:snap(wrong),neutral:snap(neutral)};
    }, {answer,wrong,neutral});

    expect(running.correct.opacity).toBe('1');
    expect(running.neutral.opacity).toBe('1');
    expect(running.correct.bg).toBe(running.neutral.bg);
    expect(running.correct.color).toBe(running.neutral.color);
    expect(running.correct.check).toBe('none');
    expect(running.wrong.check).toBe('none');

    await page.locator('#stopQuizBtn').click();
    await expect(page.locator('body')).toHaveClass(/phase4-quiz-review/);
    const reviewed = await page.evaluate(({answer,wrong,neutral}) => {
      const opts = Array.from(document.querySelector('main .q:not(.hidden) ol.o').children);
      const bg = i => getComputedStyle(opts[i]).backgroundColor;
      return {correct:bg(answer),wrong:bg(wrong),neutral:bg(neutral),opacity:opts.map(x=>getComputedStyle(x).opacity)};
    }, {answer,wrong,neutral});
    expect(reviewed.correct).not.toBe(reviewed.neutral);
    expect(reviewed.wrong).not.toBe(reviewed.neutral);
    expect(reviewed.opacity.every(value => value === '1')).toBeTruthy();
  });

  test('partial quiz score uses total questions while answered accuracy stays separate', async ({ page }) => {
    await fresh(page);
    await startQuiz(page,'practice');
    const {options,answer} = await firstCardData(page);
    await options.nth(answer).click();
    await page.locator('#stopQuizBtn').click();

    await expect(page.locator('#qrScore')).toContainText('1 / 10');
    await expect(page.locator('#qrScore')).toContainText('10%');
    const accuracy = page.locator('#qrMetrics [data-project-accuracy]');
    await expect(accuracy).toContainText('دقة المجاب');
    await expect(accuracy).toContainText('100%');

    const history = await page.evaluate(() => window.StudyEngine.state.quizHistory?.[0]);
    expect(history.percent).toBe(10);
    expect(history.accuracy).toBe(100);
  });

  test('full reset clears modern analytics, flags, history and timer session', async ({ page }) => {
    await fresh(page);
    await page.evaluate(() => {
      const state = window.StudyEngine.state;
      const id = window.StudyEngine.allQuestions()[0].id;
      state.reviewFlags = {[id]:true};
      state.questionStats = {[id]:{attempts:2,correct:1,wrong:1,recent:[true,false]}};
      state.quizHistory = [{id:'demo',percent:50}];
      state.plusTimerSession = {version:1,currentId:id};
      window.StudyEngine.saveState();
    });

    await page.locator('#phase1MoreBtn').click();
    await page.locator('[data-action="reset"]').click();
    await page.locator('#resetAll').check();
    await page.locator('#resetConfirm').click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => window.ProjectFixes?.ready === true);

    const state = await page.evaluate(() => window.StudyEngine.state);
    expect(Object.keys(state.reviewFlags || {})).toHaveLength(0);
    expect(Object.keys(state.questionStats || {})).toHaveLength(0);
    expect(state.quizHistory || []).toHaveLength(0);
    expect(state.plusTimerSession).toBeUndefined();
  });

  test('keyboard users can activate MCQ options and Q&A reveal controls', async ({ page }) => {
    await fresh(page);
    const option = page.locator('#q1 ol.o li').first();
    await expect(option).toHaveAttribute('tabindex','0');
    await expect(option).toHaveAttribute('role','button');
    await option.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#q1')).toHaveClass(/revealed/);

    await fresh(page,QA);
    const question = page.locator('#q1 .qt');
    await expect(question).toHaveAttribute('tabindex','0');
    await expect(question).toHaveAttribute('role','button');
    await question.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#q1')).toHaveClass(/revealed/);
  });

  test('hidden quiz bridge is removed from tab order and legacy favorite UI stays hidden', async ({ page }) => {
    await fresh(page);
    const bridgeTabs = await page.locator('.phase4-native-bridge select,.phase4-native-bridge input').evaluateAll(nodes => nodes.map(n => n.tabIndex));
    expect(bridgeTabs.every(value => value === -1)).toBeTruthy();
    await expect(page.locator('.reset-options input[value="fav"]').locator('..')).toBeHidden();
    await expect(page.locator('#exportMenuModal [data-menu="csv-fav"]')).toBeHidden();
    await expect(page.locator('#phase2Review').locator('..')).toContainText('مراجعة ذكية');
    await expect(page.locator('#sortBy option[value="wrong-desc"]')).toHaveText(/الأخطاء فقط/);
  });
});
