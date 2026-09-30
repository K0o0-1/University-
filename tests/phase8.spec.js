const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const MATERIALS = [
  { path:'/materials/enterprise-architecture.html', title:'Enterprise Architecture', count:275, kind:'mcq' },
  { path:'/materials/mcq-flutter.html', title:'MCQ Flutter', count:341, kind:'mcq' },
  { path:'/materials/mcq-information-security-privacy.html', title:'MCQ Information Systems Security & Privacy', count:200, kind:'mcq' },
  { path:'/materials/qa-information-security-privacy.html', title:'Q&A Information Systems Security & Privacy', count:100, kind:'qa' },
];
const EA = MATERIALS[0].path;
const FLUTTER = MATERIALS[1].path;
const SECURITY = MATERIALS[2].path;
const QA = MATERIALS[3].path;

async function ready(page) {
  await page.waitForSelector('main .q');
  await page.waitForFunction(() => document.body.classList.contains('phase7-cleanup-enabled'));
}

async function boot(page, path = EA) {
  await page.goto(BASE + path);
  await ready(page);
}

async function fresh(page, path = EA) {
  await page.goto(BASE + path);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await ready(page);
}

async function openQuiz(page, { mode='practice', section='sec1', count='10' } = {}) {
  await page.locator('#phase1QuizBtn').click();
  await expect(page.locator('#quizSetupModal')).toHaveClass(/show/);
  await page.locator(`[data-phase4-mode="${mode}"]`).click();
  await page.selectOption('#quizSetupSection', section);
  await page.selectOption('#quizSetupCount', count);
  await page.locator('#quizSetupStart').click();
  await expect(page.locator('body')).toHaveClass(/phase4-quiz-running/);
}

async function answerMcqWrong(page) {
  const card = page.locator('main .q:not(.hidden)').first();
  const answer = Number(await card.getAttribute('data-a'));
  const options = card.locator('ol.o li');
  const optionCount = await options.count();
  const wrong = Array.from({length:optionCount},(_,index)=>index).find(index => index !== answer);
  await options.nth(wrong).click();
  return card;
}

async function openStats(page) {
  await page.locator('[data-action="stats"]').click();
  await expect(page.locator('#statsPageModal')).toHaveClass(/show/);
  await expect(page.locator('#phase5AnalyticsRoot')).toBeVisible();
}

async function openPrint(page) {
  await page.locator('#phase1MoreBtn').click();
  await page.locator('[data-action="print"]').click();
  await expect(page.locator('#phase6PrintModal')).toHaveClass(/show/);
}

test.describe('Phase 8 Final End-to-End Acceptance', () => {
  test('hub links, exact question counts, unique IDs and the complete UI pipeline are intact for all materials', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    await page.goto(BASE + '/');
    await expect(page.locator('.material-card')).toHaveCount(4);
    const hrefs = await page.locator('.material-card').evaluateAll(cards => cards.map(card => new URL(card.href).pathname));
    expect(new Set(hrefs)).toEqual(new Set(MATERIALS.map(material => material.path)));

    for (const material of MATERIALS) {
      await boot(page, material.path);
      const snapshot = await page.evaluate(() => {
        const questions = window.StudyEngine?.allQuestions?.() || [];
        return {
          count:questions.length,
          uniqueIds:new Set(questions.map(question => question.id)).size,
          kind:window.StudyEngine?.kind,
          dir:document.documentElement.dir,
          primaryButtons:document.querySelectorAll('#phase1PrimaryNav > button').length,
          modules:[!!window.StudyPhase2,!!window.StudyPhase3,!!window.StudyPhase4,!!window.StudyPhase5,!!window.StudyPhase6],
          cleanupReady:window.StudyPhase7?.ready === true,
        };
      });
      expect(snapshot.count).toBe(material.count);
      expect(snapshot.uniqueIds).toBe(material.count);
      expect(snapshot.kind).toBe(material.kind);
      expect(snapshot.dir).toBe('rtl');
      expect(snapshot.primaryButtons).toBe(4);
      expect(snapshot.modules).toEqual([true,true,true,true,true]);
      expect(snapshot.cleanupReady).toBe(true);
      await expect(page.locator('header h1')).toContainText(material.title.replace(/^MCQ /,'').replace(/^Q&A /,''));
    }

    expect(errors).toEqual([]);
  });

  test('complete MCQ student journey survives study, search, sections, flashcards, quiz, analytics, print and reload', async ({ page }) => {
    await fresh(page, EA);

    await page.locator('#q1').click();
    await expect(page.locator('#q1')).toHaveClass(/revealed/);
    await expect(page.locator('#phase2Studied')).toHaveText('1/275');

    const firstQuestion = (await page.locator('#q1 .qt').innerText()).trim();
    await page.locator('#search').fill(firstQuestion.slice(0, Math.min(30, firstQuestion.length)));
    await expect(page.locator('#q1')).toBeVisible();
    await page.waitForTimeout(80);
    const searchCount = await page.locator('main .q:not(.hidden)').count();
    expect(searchCount).toBeGreaterThan(0);
    expect(searchCount).toBeLessThan(275);
    await page.locator('#search').fill('');
    await expect(page.locator('main .q:not(.hidden)')).toHaveCount(275);

    await page.locator('#phase2SectionsBtn').click();
    await page.locator('.phase2-section-item[data-section-value="sec2"]').click();
    await expect(page.locator('#secFilter')).toHaveValue('sec2');
    const sectionCount = await page.locator('main .q:not(.hidden)').count();
    expect(sectionCount).toBeGreaterThan(0);
    expect(sectionCount).toBeLessThan(275);
    await page.locator('#phase2SectionsBtn').click();
    await page.locator('.phase2-section-item[data-section-value=""]').click();
    await expect(page.locator('main .q:not(.hidden)')).toHaveCount(275);

    await page.locator('[data-action="mode-flash"]').click();
    await expect(page.locator('body')).toHaveClass(/flash/);
    await expect(page.locator('#flashWrap')).toBeVisible();
    await page.locator('[data-action="mode-study"]').click();
    await expect(page.locator('body')).not.toHaveClass(/flash/);

    await openQuiz(page, {mode:'practice',section:'sec1',count:'10'});
    await answerMcqWrong(page);
    await expect(page.locator('#phase4QuizProgress')).toHaveText('1/10');
    await page.locator('#stopQuizBtn').click();
    await expect(page.locator('#quizResult')).toHaveClass(/show/);

    await openStats(page);
    await expect(page.locator('#statsPageContent')).toContainText('آخر اختبار');
    await page.locator('#statsPageClose').click();

    await openPrint(page);
    await expect(page.locator('input[name="phase6-content"]')).toHaveCount(3);
    await expect(page.locator('#phase6PrintSummary')).toContainText('275 سؤال');
    await page.locator('#phase6PrintCancel').click();

    await page.reload();
    await ready(page);
    await expect(page.locator('#phase2Studied')).toHaveText('1/275');
    await expect(page.locator('#q1')).toHaveClass(/revealed/);
    await openStats(page);
    await expect(page.locator('.phase5-latest-preview')).toHaveCount(1);
  });

  test('complete Q&A student journey preserves reveal progress, exam grading, analytics and Q&A print rules', async ({ page }) => {
    await fresh(page, QA);

    const first = page.locator('#q1');
    await first.locator('.show-answer-btn').click();
    await expect(first).toHaveClass(/revealed/);
    await expect(page.locator('#phase2Studied')).toHaveText('1/100');

    await openQuiz(page, {mode:'exam',section:'sec1',count:'10'});
    const quizCard = page.locator('main .q:not(.hidden)').first();
    await expect(quizCard.locator('.answer-box')).toBeHidden();
    await quizCard.locator('.grade-wrong').click();
    await expect(quizCard.locator('.answer-box')).toBeHidden();
    await expect(page.locator('#phase4QuizProgress')).toHaveText('1/10');
    await page.locator('#stopQuizBtn').click();
    await expect(page.locator('#quizResult')).toHaveClass(/show/);
    await expect(quizCard.locator('.answer-box')).toBeVisible();

    await openStats(page);
    await expect(page.locator('#statsPageContent')).toContainText('آخر اختبار');
    await page.locator('#statsPageClose').click();

    await openPrint(page);
    await expect(page.locator('input[name="phase6-content"]')).toHaveCount(2);
    await expect(page.locator('input[name="phase6-content"][value="key"]')).toHaveCount(0);
    await expect(page.locator('#phase6PrintSummary')).toContainText('100 سؤال');
    await page.locator('#phase6PrintCancel').click();

    await page.reload();
    await ready(page);
    await expect(page.locator('#phase2Studied')).toHaveText('1/100');
    await expect(page.locator('#q1')).toHaveClass(/revealed/);
  });

  test('progress remains isolated between all four materials while each material persists its own state', async ({ page }) => {
    await fresh(page, EA);
    await page.locator('#q1').click();
    await expect(page.locator('#phase2Studied')).toHaveText('1/275');

    await boot(page, FLUTTER);
    await expect(page.locator('#phase2Studied')).toHaveText('0/341');
    await page.locator('#q1').click();
    await expect(page.locator('#phase2Studied')).toHaveText('1/341');

    await boot(page, SECURITY);
    await expect(page.locator('#phase2Studied')).toHaveText('0/200');

    await boot(page, QA);
    await expect(page.locator('#phase2Studied')).toHaveText('0/100');

    await boot(page, EA);
    await expect(page.locator('#phase2Studied')).toHaveText('1/275');
    await expect(page.locator('#q1')).toHaveClass(/revealed/);

    await boot(page, FLUTTER);
    await expect(page.locator('#phase2Studied')).toHaveText('1/341');
    await expect(page.locator('#q1')).toHaveClass(/revealed/);
  });

  test('all four materials remain usable at 390px without document overflow or off-screen primary menus', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width:390,height:844});

    for (const material of MATERIALS) {
      await fresh(page, material.path);
      await expect(page.locator('#phase1PrimaryNav > button')).toHaveCount(4);
      await expect(page.locator('.phase2-summary-item')).toHaveCount(3);

      const layout = await page.evaluate(() => {
        const nav = document.getElementById('phase1PrimaryNav');
        const rect = nav.getBoundingClientRect();
        return {
          scrollWidth:document.documentElement.scrollWidth,
          innerWidth:window.innerWidth,
          navPosition:getComputedStyle(nav).position,
          navLeft:rect.left,
          navRight:rect.right,
        };
      });
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth + 1);
      expect(layout.navPosition).toBe('fixed');
      expect(layout.navLeft).toBeGreaterThanOrEqual(-1);
      expect(layout.navRight).toBeLessThanOrEqual(layout.innerWidth + 1);

      await page.locator('#phase1MoreBtn').click();
      const menuRect = await page.locator('#phase1More .phase1-menu-panel').evaluate(element => {
        const rect = element.getBoundingClientRect();
        return {left:rect.left,right:rect.right,width:window.innerWidth};
      });
      expect(menuRect.left).toBeGreaterThanOrEqual(-1);
      expect(menuRect.right).toBeLessThanOrEqual(menuRect.width + 1);
      await page.keyboard.press('Escape');

      await page.locator('[data-action="stats"]').click();
      await expect(page.locator('#phase5AnalyticsRoot')).toBeVisible();
      const modalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(modalOverflow).toBeLessThanOrEqual(1);
      await page.locator('#statsPageClose').click();
    }

    expect(errors).toEqual([]);
  });

  test('PWA manifest and service worker support an offline reload after the material has been warmed once', async ({ page, context, request }) => {
    const manifestResponse = await request.get(`${BASE}/manifest.webmanifest`);
    expect(manifestResponse.status()).toBe(200);
    const manifest = await manifestResponse.json();
    expect(manifest.display).toBe('standalone');
    expect(manifest.dir).toBe('rtl');
    expect(manifest.scope).toBe('./');
    expect(manifest.icons?.length).toBeGreaterThan(0);

    await boot(page, EA);
    await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) throw new Error('Service Worker API unavailable');
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Service Worker did not claim the page')), 10000);
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            clearTimeout(timer);
            resolve();
          }, {once:true});
        });
      }
    });

    await page.reload();
    await ready(page);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.waitForTimeout(500);

    await context.setOffline(true);
    try {
      await page.reload({waitUntil:'domcontentloaded'});
      await ready(page);
      const offlineCount = await page.evaluate(() => window.StudyEngine.allQuestions().length);
      expect(offlineCount).toBe(275);

      await page.goto(BASE + '/', {waitUntil:'domcontentloaded'});
      await expect(page.locator('.material-card')).toHaveCount(4);

      await page.goto(BASE + EA, {waitUntil:'domcontentloaded'});
      await ready(page);
      await expect(page.locator('#phase1PrimaryNav > button')).toHaveCount(4);
      const secondOfflineCount = await page.evaluate(() => window.StudyEngine.allQuestions().length);
      expect(secondOfflineCount).toBe(275);
    } finally {
      await context.setOffline(false);
    }
  });
});
