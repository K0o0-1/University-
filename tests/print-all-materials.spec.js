const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const MATERIALS = [
  {path:'/materials/enterprise-architecture.html',kind:'mcq'},
  {path:'/materials/mcq-flutter.html',kind:'mcq'},
  {path:'/materials/mcq-information-security-privacy.html',kind:'mcq'},
  {path:'/materials/qa-information-security-privacy.html',kind:'qa'},
];

async function ready(page,url){
  await page.goto(BASE + url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('main .q');
  await page.waitForFunction(() => window.StudyPhase6?.prepare && window.ProjectFixes?.ready === true);
}

test.describe('Project-wide professional print', () => {
  for (const material of MATERIALS) {
    test(`${material.path} generates a complete linked A4 PDF`, async ({ page }) => {
      await ready(page,material.path);
      const expected = await page.evaluate(() => ({
        questions:window.StudyEngine.allQuestions().length,
        sections:window.StudyEngine.sections.length,
      }));

      const result = await page.evaluate(({kind}) => {
        const content = kind === 'qa' ? 'answers' : 'answers';
        return window.StudyPhase6.prepare({content,scope:'all'});
      },{kind:material.kind});
      expect(result.count).toBe(expected.questions);

      const doc = page.locator('#phase6PrintDocument');
      await expect(doc.locator('.phase6-question')).toHaveCount(expected.questions);
      await expect(doc.locator('.phase6-print-index a')).toHaveCount(expected.sections);
      await expect(doc.locator('.phase6-print-section')).toHaveCount(expected.sections);
      await expect(doc.locator('.phase6-print-footer a')).toHaveAttribute('href','https://wa.me/967771179020');

      const links = await doc.locator('.phase6-print-index a').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
      expect(new Set(links).size).toBe(expected.sections);
      for (const href of links) {
        expect(href).toMatch(/^#phase6-section-sec\d+$/);
        await expect(page.locator(href)).toHaveCount(1);
      }

      await page.evaluate(() => document.body.classList.add('phase6-printing'));
      await page.emulateMedia({media:'print'});
      const columns = await doc.locator('.phase6-print-index ul').evaluate(el => getComputedStyle(el).columnCount);
      expect(columns).toBe('1');
      const breakInside = await doc.locator('.phase6-question').first().evaluate(el => getComputedStyle(el).breakInside);
      expect(breakInside).toMatch(/avoid/);
      const pdf = await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true});
      expect(pdf.subarray(0,4).toString()).toBe('%PDF');
      expect(pdf.length).toBeGreaterThan(5000);
      await page.emulateMedia({media:'screen'});
    });
  }

  test('Q&A answers contain no Answer label and MCQ answer key remains available', async ({ page }) => {
    await ready(page,'/materials/qa-information-security-privacy.html');
    await page.evaluate(() => window.StudyPhase6.prepare({content:'answers',scope:'all'}));
    const text = await page.locator('#phase6PrintDocument').innerText();
    expect(text).not.toMatch(/\bAnswer\b/);

    await ready(page,'/materials/enterprise-architecture.html');
    const count = await page.evaluate(() => window.StudyPhase6.prepare({content:'key',scope:'all'}).count);
    await expect(page.locator('#phase6PrintDocument .phase6-key-item')).toHaveCount(count);
  });
});
