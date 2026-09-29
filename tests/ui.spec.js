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

async function openSetup(page, mode='practice') {
  await page.locator(`[data-action="mode-${mode}-v2"]`).click();
  await expect(page.locator('#quizSetupModal')).toHaveClass(/show/);
}

async function startSetup(page, {mode='practice', section='', count='all', source='all', order='original', timeMode='none', timeValue=null} = {}) {
  await openSetup(page, mode);
  await page.selectOption('#quizSetupMode', mode);
  await page.selectOption('#quizSetupSection', section);
  await page.selectOption('#quizSetupCount', count);
  await page.selectOption('#quizSetupSource', source);
  await page.selectOption('#quizSetupOrder', order);
  await page.selectOption('#quizSetupTimeMode', timeMode);
  if (timeMode !== 'none' && timeValue !== null) await page.locator('#quizSetupTimeValue').fill(String(timeValue));
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

test.describe('Quiz & Analytics V2', () => {
  test('all material pages load Study, Practice, Exam and analytics without page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const path of PAGES) {
      await fresh(page, BASE + path);
      await expect(page.locator('[data-action="mode-study"]')).toBeVisible();
      await expect(page.locator('[data-action="mode-practice-v2"]')).toBeVisible();
      await expect(page.locator('[data-action="mode-exam-v2"]')).toBeVisible();
      await expect(page.locator('#quizNavBtn')).toHaveCount(1);
      await expect(page.locator('#statsPageModal')).toHaveCount(1);
    }
    expect(errors).toEqual([]);
  });

  test('custom Practice quiz supports section + count', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec8', count:'10'});
    await expect(page.locator('#statProgress')).toHaveText('0/10');
    await expect(page.locator('#secFilter')).toBeDisabled();
    await expect(page.locator('#quizNavBtn')).toBeVisible();
    const visible = page.locator('main .q:not(.hidden)');
    await expect(visible).toHaveCount(10);
  });

  test('random custom quiz produces a fixed requested scope', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec8', count:'20', order:'random'});
    await expect(page.locator('main .q:not(.hidden)')).toHaveCount(20);
    const nums = await page.locator('main .q:not(.hidden) .n').allTextContents();
    expect(new Set(nums).size).toBe(20);
  });

  test('Practice reveals correctness immediately and records smart analytics', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec1', count:'10'});
    const card = await chooseWrong(page);
    await expect(card).toHaveClass(/answered/);
    await expect(card.locator('ol.o li.wrong')).toHaveCount(1);
    const qid = await card.getAttribute('data-qid');
    const rec = await page.evaluate(id => {
      const key = 'enterprise275_state_ea2_v5';
      return JSON.parse(localStorage.getItem(key) || '{}').questionStats?.[id];
    }, qid);
    expect(rec.attempts).toBe(1);
    expect(rec.wrong).toBe(1);
  });

  test('Exam hides correctness until finish and result metrics appear', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'exam', section:'sec1', count:'10'});
    const card = await chooseWrong(page);
    await expect(page.locator('#statScore')).toHaveText('مخفي');
    await expect(card.locator('ol.o li.exam-choice')).toHaveCount(1);
    await expect(card.locator('.tag.err')).toHaveClass(/hidden/);
    const bg = await card.locator('ol.o li.wrong').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).toBeTruthy();
    await page.locator('#stopQuizFloatBtn').click();
    await expect(page.locator('#quizResult')).toHaveClass(/show/);
    await expect(page.locator('#qrMetrics .result-metric')).toHaveCount(9);
    await expect(page.locator('#qrMetrics')).toContainText('امتحان');
  });

  test('quiz navigator tracks answered and review flags', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec1', count:'10'});
    const card = page.locator('main .q:not(.hidden)').first();
    await card.locator('.btn-review').click();
    await chooseWrong(page);
    await page.locator('#quizNavBtn').click();
    await expect(page.locator('#quizNavigator')).toHaveClass(/show/);
    await expect(page.locator('#quizNavGrid button.flagged')).toHaveCount(1);
    await expect(page.locator('#quizNavGrid button.answered')).toHaveCount(1);
  });

  test('finishing a quiz stores history and stats page shows section performance and weakness', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec1', count:'10'});
    await chooseWrong(page);
    await page.locator('#stopQuizFloatBtn').click();
    await page.locator('[data-action="stats"]').click();
    await expect(page.locator('#statsPageModal')).toHaveClass(/show/);
    await expect(page.locator('#statsPageContent')).toContainText('آخر الاختبارات');
    await expect(page.locator('#statsPageContent')).toContainText('أهم نقاط الضعف');
    await expect(page.locator('.analytics-table')).toHaveCount(2);
    const historyLen = await page.evaluate(() => {
      const key = 'enterprise275_state_ea2_v5';
      return (JSON.parse(localStorage.getItem(key)||'{}').quizHistory || []).length;
    });
    expect(historyLen).toBe(1);
  });

  test('weakness-only source builds a quiz only after mistakes exist', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec1', count:'10'});
    await chooseWrong(page);
    await page.locator('#stopQuizFloatBtn').click();
    await page.locator('[data-action="mode-study"]').click();
    await startSetup(page, {mode:'practice', source:'weak', count:'all'});
    await expect(page.locator('main .q:not(.hidden)')).toHaveCount(1);
  });

  test('paused Exam resumes with its mode and can be finished once', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'exam', section:'sec1', count:'10'});
    await chooseWrong(page);
    await page.reload();
    await expect(page.locator('#resumeQuizModal')).toHaveClass(/show/);
    await page.locator('#resumeQuizContinue').click();
    await expect(page.locator('#statScore')).toHaveText('مخفي');
    await expect(page.locator('#statProgress')).toHaveText('1/10');
    await page.reload();
    await expect(page.locator('#resumeQuizModal')).toHaveClass(/show/);
    await page.locator('#resumeQuizFinish').click();
    await expect(page.locator('#quizResult')).toHaveClass(/show/);
    await page.reload();
    await page.waitForTimeout(400);
    await expect(page.locator('#resumeQuizModal')).not.toHaveClass(/show/);
  });

  test('Q&A Exam hides answer until grading and reveals answers after finish', async ({ page }) => {
    await fresh(page, `${BASE}/materials/qa-information-security-privacy.html`);
    await startSetup(page, {mode:'exam', section:'sec1', count:'10'});
    const first = page.locator('main .q:not(.hidden)').first();
    await expect(first.locator('.show-answer-btn')).toBeHidden();
    await expect(first.locator('.grade-btns')).toBeVisible();
    await first.locator('.grade-wrong').click();
    await expect(first.locator('.answer-box')).toBeHidden();
    await page.locator('#stopQuizFloatBtn').click();
    await expect(first.locator('.answer-box')).toBeVisible();
    await expect(page.locator('#qrMetrics')).toContainText('امتحان');
  });

  test('study progress remains independent from quiz history', async ({ page }) => {
    await fresh(page);
    await page.locator('#q1').click();
    await expect(page.locator('#statProgress')).toHaveText('1/275');
    await startSetup(page, {mode:'practice', section:'sec1', count:'10'});
    await page.locator('#stopQuizFloatBtn').click();
    await page.locator('[data-action="mode-study"]').click();
    await expect(page.locator('#statProgress')).toHaveText('1/275');
    await expect(page.locator('#q1')).toHaveClass(/revealed/);
  });
});


test.describe('Quiz Plus 8', () => {
  test('total timer auto-finishes and stores timeout result', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'exam', section:'sec1', count:'10', timeMode:'total', timeValue:'0.02'});
    await expect(page.locator('#quizCountdown')).toBeVisible();
    await expect(page.locator('#quizResult')).toHaveClass(/show/, {timeout:5000});
    await expect(page.locator('#qrMsg')).toContainText('انتهى الوقت');
    const reason = await page.evaluate(() => JSON.parse(localStorage.getItem('enterprise275_state_ea2_v5')||'{}').quizHistory?.[0]?.reason);
    expect(reason).toBe('timeout');
  });

  test('per-question timer expires only the current question and advances', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec1', count:'10', timeMode:'per-question', timeValue:'1'});
    const first = await page.locator('.q.quiz-current').getAttribute('data-qid');
    await expect(page.locator('#quizCountdown')).toContainText('1ث/سؤال');
    await expect(page.locator('.q.time-expired')).toHaveCount(1, {timeout:4000});
    const second = await page.locator('.q.quiz-current').getAttribute('data-qid');
    expect(second).not.toBe(first);
    await expect(page.locator('#statProgress')).toHaveText('0/10');
    const timer = await page.evaluate(() => window.StudyPlus.getTimerState());
    expect(timer.mode).toBe('per-question');
    expect(timer.expired).toContain(first);
    await page.locator('#stopQuizFloatBtn').click();
  });

  test('per-question timer preserves remaining time when a question is skipped', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec1', count:'10', timeMode:'per-question', timeValue:'5'});
    const first = await page.locator('.q.quiz-current').getAttribute('data-qid');
    await page.waitForTimeout(1200);
    await page.locator('#quizSkipBtn').click();
    const timer = await page.evaluate(() => window.StudyPlus.getTimerState());
    expect(timer.perQuestionRemaining[first]).toBeLessThan(5);
    expect(timer.perQuestionRemaining[first]).toBeGreaterThan(2.5);
    await expect(page.locator('#statProgress')).toHaveText('0/10');
    await page.locator('#stopQuizFloatBtn').click();
  });

  test('timer warns unobtrusively when one minute remains', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec1', count:'10', timeMode:'total', timeValue:'1.02'});
    await expect(page.locator('#toast')).toContainText('باقي دقيقة', {timeout:5000});
    await page.locator('#stopQuizFloatBtn').click();
  });

  test('skip moves to another unanswered question without changing progress', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec1', count:'10'});
    const first = await page.locator('.q.quiz-current').getAttribute('data-qid');
    await page.locator('#quizSkipBtn').click();
    const second = await page.locator('.q.quiz-current').getAttribute('data-qid');
    expect(second).not.toBe(first);
    await expect(page.locator('#statProgress')).toHaveText('0/10');
    await page.locator('#stopQuizFloatBtn').click();
  });

  test('question statistics show attempts, accuracy, last result and weakness priority', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec1', count:'10'});
    const card = await chooseWrong(page);
    await card.locator('.btn-qstats').click();
    await expect(page.locator('#questionStatsModal')).toHaveClass(/show/);
    await expect(page.locator('#questionStatsContent')).toContainText('المحاولات');
    await expect(page.locator('#questionStatsContent')).toContainText('أولوية المراجعة');
    await expect(page.locator('#questionStatsContent')).toContainText('آخر محاولة');
    await page.locator('#questionStatsClose').click();
    await page.locator('#stopQuizFloatBtn').click();
  });

  test('statistics page renders a compact progress chart and history detail view', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec1', count:'10'});
    await chooseWrong(page);
    await page.locator('#stopQuizFloatBtn').click();
    await page.locator('[data-action="stats"]').click();
    await expect(page.locator('.trend-chart')).toHaveCount(1);
    await expect(page.locator('.trend-bar')).toHaveCount(1);
    await page.locator('[data-history-detail]').first().click();
    await expect(page.locator('#historyDetailModal')).toHaveClass(/show/);
    await expect(page.locator('#historyDetailContent')).toContainText('النتيجة');
    await expect(page.locator('.history-question')).toHaveCount(10);
  });

  test('history can repeat the exact same quiz scope', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'exam', section:'sec1', count:'10', order:'random'});
    const original = await page.locator('main .q:not(.hidden)').evaluateAll(nodes => nodes.map(n => n.dataset.qid));
    await page.locator('#stopQuizFloatBtn').click();
    await page.locator('[data-action="stats"]').click();
    await page.locator('[data-history-detail]').first().click();
    await page.locator('#historyRetakeBtn').click();
    const repeated = await page.locator('main .q:not(.hidden)').evaluateAll(nodes => nodes.map(n => n.dataset.qid));
    expect(repeated).toEqual(original);
    await expect(page.locator('#statProgress')).toHaveText('0/10');
    await page.locator('#stopQuizFloatBtn').click();
  });

  test('recent mistakes rank above equally frequent old mistakes', async ({ page }) => {
    await fresh(page);
    const ids = await page.evaluate(() => [document.querySelector('#q1').dataset.qid, document.querySelector('#q2').dataset.qid]);
    await page.evaluate(([recentId, oldId]) => {
      const key='enterprise275_state_ea2_v5';
      const s=JSON.parse(localStorage.getItem(key)||'{}');
      s.wrong=s.wrong||{}; s.wrong[recentId]=1; s.wrong[oldId]=1;
      s.questionStats=s.questionStats||{};
      s.questionStats[recentId]={attempts:1,correct:0,wrong:1,recent:[false],lastAt:new Date().toISOString(),lastResult:'wrong'};
      s.questionStats[oldId]={attempts:1,correct:0,wrong:1,recent:[false],lastAt:new Date(Date.now()-60*86400000).toISOString(),lastResult:'wrong'};
      localStorage.setItem(key,JSON.stringify(s));
    }, ids);
    await page.reload();
    await page.waitForSelector('main .q');
    const scores = await page.evaluate(([a,b]) => [window.StudyV2.getWeaknessScore(a), window.StudyV2.getWeaknessScore(b)], ids);
    expect(scores[0]).toBeGreaterThan(scores[1]);
  });
});
