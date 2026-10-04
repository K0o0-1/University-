const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const EA = `${BASE}/materials/enterprise-architecture.html`;
const QA = `${BASE}/materials/qa-information-security-privacy.html`;
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
  await page.waitForFunction(() => document.body.classList.contains('phase6-print-enabled'));
}

async function openPrint(page) {
  await page.locator('#phase1MoreBtn').click();
  await page.locator('[data-action="print"]').click();
  await expect(page.locator('#phase6PrintModal')).toHaveClass(/show/);
}

test.describe('Phase 6 Professional Print', () => {
  test('all materials open one professional print setup from More → Print', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const path of PAGES) {
      await fresh(page, BASE + path);
      await openPrint(page);
      await expect(page.locator('input[name="phase6-content"][value="questions"]')).toBeChecked();
      await expect(page.locator('input[name="phase6-content"][value="answers"]')).toHaveCount(1);
      await expect(page.locator('input[name="phase6-scope"]')).toHaveCount(3);
      await expect(page.locator('#phase6PrintSummary')).toContainText('كل المادة');
      const isQa = path.includes('/qa-');
      await expect(page.locator('input[name="phase6-content"][value="key"]')).toHaveCount(isQa ? 0 : 1);
      await page.locator('#phase6PrintCancel').click();
    }
    expect(errors).toEqual([]);
  });

  test('MCQ questions-only prints the complete material without exposing answer markers', async ({ page }) => {
    await fresh(page);
    const result = await page.evaluate(() => window.StudyPhase6.prepare({content:'questions', scope:'all'}));
    expect(result.count).toBe(275);
    await expect(page.locator('#phase6PrintDocument .phase6-question')).toHaveCount(275);
    await expect(page.locator('#phase6PrintDocument .phase6-answer-mark')).toHaveCount(0);
    await expect(page.locator('#phase6PrintDocument .phase6-print-index')).toHaveCount(1);
    await expect(page.locator('#phase6PrintDocument .phase6-option-label').first()).toHaveText('A)');
  });

  test('current-section scope follows the current study section and answers are marked clearly', async ({ page }) => {
    await fresh(page);
    const expected = await page.evaluate(() => {
      const select = document.getElementById('secFilter');
      select.value = 'sec2';
      select.dispatchEvent(new Event('change', {bubbles:true}));
      return window.StudyEngine.allQuestions().filter(q => q.sec === 'sec2').length;
    });
    const result = await page.evaluate(() => window.StudyPhase6.prepare({content:'answers', scope:'section'}));
    expect(result.count).toBe(expected);
    await expect(page.locator('#phase6PrintDocument .phase6-question')).toHaveCount(expected);
    await expect(page.locator('#phase6PrintDocument .phase6-print-section')).toHaveCount(1);
    await expect(page.locator('#phase6PrintDocument .phase6-option.is-answer')).toHaveCount(expected);
    await expect(page.locator('#phase6PrintDocument .phase6-answer-mark')).toHaveCount(expected);
    await expect(page.locator('#phase6PrintDocument .phase6-print-index')).toHaveCount(0);
  });

  test('filtered-results scope and MCQ answer key preserve the exact filtered question numbers and letters', async ({ page }) => {
    await fresh(page);
    const expected = await page.evaluate(() => {
      const first = window.StudyEngine.allQuestions()[0];
      const search = document.getElementById('search');
      search.value = first.q;
      search.dispatchEvent(new Event('input', {bubbles:true}));
      return window.StudyEngine.filteredItems().map(q => ({num:q.num, key:`${q.num}-${String.fromCharCode(65 + Number(q.a))}`}));
    });
    expect(expected.length).toBeGreaterThan(0);
    const result = await page.evaluate(() => window.StudyPhase6.prepare({content:'key', scope:'filtered'}));
    expect(result.count).toBe(expected.length);
    const keys = await page.locator('#phase6PrintDocument .phase6-key-item').allTextContents();
    expect(keys).toEqual(expected.map(item => item.key));
    await expect(page.locator('#phase6PrintDocument .phase6-question')).toHaveCount(0);
    await expect(page.locator('#phase6PrintDocument .phase6-print-index')).toHaveCount(0);
  });

  test('Q&A supports questions-only and questions+answers without printing an Answer label', async ({ page }) => {
    await fresh(page, QA);
    await expect(page.locator('input[name="phase6-content"][value="key"]')).toHaveCount(0);
    const firstAnswer = await page.evaluate(() => window.StudyEngine.allQuestions()[0].a);
    const count = await page.evaluate(() => window.StudyEngine.allQuestions().length);
    await page.evaluate(() => window.StudyPhase6.prepare({content:'questions', scope:'all'}));
    await expect(page.locator('#phase6PrintDocument .phase6-question')).toHaveCount(count);
    await expect(page.locator('#phase6PrintDocument .phase6-qa-answer')).toHaveCount(0);
    await page.evaluate(() => window.StudyPhase6.prepare({content:'answers', scope:'all'}));
    await expect(page.locator('#phase6PrintDocument .phase6-qa-answer')).toHaveCount(count);
    await expect(page.locator('#phase6PrintDocument .phase6-qa-answer').first()).toContainText(firstAnswer);
    await expect(page.locator('#phase6PrintDocument .phase6-qa-answer').first()).not.toContainText('Answer');
  });

  test('Q&A print index is one vertical linked list with no duplicate numbering and footer links to WhatsApp', async ({ page }) => {
    await fresh(page, QA);
    await page.evaluate(() => window.StudyPhase6.prepare({content:'answers', scope:'all'}));

    const index = page.locator('#phase6PrintDocument .phase6-print-index');
    await expect(index).toHaveCount(1);
    await expect(index.locator('ol')).toHaveCount(0);
    await expect(index.locator('ul')).toHaveCount(1);
    await expect(index.locator('li')).toHaveCount(6);
    await expect(index.locator('a')).toHaveCount(6);

    const firstLink = index.locator('a').first();
    await expect(firstLink).toHaveText('1. أمن المعلومات والخصوصية — 1 – 17');
    await expect(firstLink).toHaveAttribute('href', '#phase6-section-sec1');
    await expect(page.locator('#phase6-section-sec1')).toHaveCount(1);
    await expect(page.locator('#phase6-section-sec6')).toHaveCount(1);

    const indexTexts = await index.locator('a').allTextContents();
    expect(indexTexts.join(' ')).not.toContain('(17)');
    expect(indexTexts.join(' ')).not.toMatch(/1\.\s*1\./);

    await page.evaluate(() => document.querySelector('#phase6PrintDocument .phase6-print-index a').click());
    await expect(page).toHaveURL(/#phase6-section-sec1$/);

    await page.evaluate(() => document.body.classList.add('phase6-printing'));
    await page.emulateMedia({media:'print'});
    const columns = await index.locator('ul').evaluate(el => getComputedStyle(el).columnCount);
    expect(columns).toBe('1');

    const footerLink = page.locator('#phase6PrintDocument .phase6-print-footer a');
    await expect(footerLink).toHaveText('Eng. Khalid Al-sofi');
    await expect(footerLink).toHaveAttribute('href', 'https://wa.me/967771179020');
    await page.emulateMedia({media:'screen'});
  });

  test('A4 print media hides the application UI, avoids card splits, and generates valid PDFs for MCQ and Q&A', async ({ page }) => {
    for (const [url, content] of [[EA,'questions'], [QA,'answers']]) {
      await fresh(page, url);
      await page.evaluate(({content}) => {
        window.StudyPhase6.prepare({content, scope:'section'});
        document.body.classList.add('phase6-printing');
      }, {content});
      await page.emulateMedia({media:'print'});
      await expect(page.locator('#phase6PrintDocument')).toBeVisible();
      await expect(page.locator('#phase1PrimaryNav')).toBeHidden();
      const breakInside = await page.locator('#phase6PrintDocument .phase6-question').first().evaluate(el => getComputedStyle(el).breakInside);
      expect(breakInside).toMatch(/avoid/);
      const pdf = await page.pdf({format:'A4', printBackground:true, preferCSSPageSize:true});
      expect(pdf.subarray(0,4).toString()).toBe('%PDF');
      expect(pdf.length).toBeGreaterThan(5000);
      await page.emulateMedia({media:'screen'});
    }
  });
});
