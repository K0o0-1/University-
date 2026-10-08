const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const EA = `${BASE}/materials/enterprise-architecture.html`;
const QA = `${BASE}/materials/qa-information-security-privacy.html`;

async function ready(page,url){
  await page.goto(url);
  await page.waitForSelector('main .q');
  await page.waitForFunction(() => window.ProjectFixes?.ready === true);
}

test('MCQ and Q&A remain usable in a secondary browser', async ({ page }) => {
  for (const url of [EA,QA]) {
    await ready(page,url);
    await expect(page.locator('#phase1PrimaryNav > button')).toHaveCount(4);
    await page.locator('#phase1MoreBtn').click();
    await expect(page.locator('#phase1More .phase1-menu-panel')).toBeVisible();
    await page.locator('[data-action="print"]').click();
    await expect(page.locator('#phase6PrintModal')).toHaveClass(/show/);
    await page.locator('#phase6PrintCancel').click();
    await expect(page.locator('main .q').first()).toBeVisible();
  }
});


test('Learning material remains usable in a secondary browser', async ({ page }) => {
  await page.goto(`${BASE}/materials/learning.html?id=flutter-learning`);
  await page.waitForFunction(() => window.LearningEngine?.ready === true);
  await expect(page.locator('.learning-module')).toHaveCount(4);
  await expect(page.locator('.learning-chapter-card')).toHaveCount(12);
  await expect(page.locator('.learning-desktop-nav [data-nav]')).toHaveCount(3);
  await page.locator('#learningMoreBtn').click();
  await expect(page.locator('#learningMoreMenu')).toBeVisible();
  await page.locator('[data-more="print"]').click();
  await expect(page.locator('#learningPrintDialog')).toBeVisible();
});
