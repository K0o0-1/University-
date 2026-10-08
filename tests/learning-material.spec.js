const { test, expect } = require('@playwright/test');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const URL = `${BASE}/materials/learning.html?id=flutter-learning`;

async function ready(page,{fresh=false}={}){
  await page.goto(URL,{waitUntil:'domcontentloaded'});
  if(fresh){await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'domcontentloaded'});}
  await page.waitForFunction(()=>window.LearningEngine?.ready===true);
  await page.waitForSelector('.learning-module');
}
async function openFirstTopic(page){
  await page.locator('[data-open-chapter="ch1"]').click();
  await expect(page.locator('.learning-topic-list button')).toHaveCount(6);
  await expect(page.locator('.learning-topic-main h1')).toBeVisible();
}
async function openMore(page){
  await page.locator('#learningMoreBtn').click();
  await expect(page.locator('#learningMoreMenu')).toBeVisible();
}

test.describe('Flexible learning material',()=>{
  test('Flutter learning data is exactly 4 modules / 12 chapters / 61 topics / 341 bank questions',async({page})=>{
    await ready(page,{fresh:true});
    await expect(page.locator('.learning-module')).toHaveCount(4);
    await expect(page.locator('.learning-chapter-card')).toHaveCount(12);
    const snapshot=await page.evaluate(()=>({
      modules:window.LearningEngine.data.modules.length,
      chapters:window.LearningEngine.chapters().length,
      topics:window.LearningEngine.topics().length,
      questions:window.LearningEngine.questions().length,
      hash:window.LearningEngine.data.meta.sourceBankHash,
      forbidden:[...document.scripts].some(s=>/manual/i.test(s.src||'')),
    }));
    expect(snapshot).toEqual({modules:4,chapters:12,topics:61,questions:341,hash:'0x8997ebc6',forbidden:false});
    await expect(page.locator('body')).not.toContainText('تدريب القسم');
    await expect(page.locator('body')).not.toContainText('Feedback');
  });

  test('Study keeps source explanation, examples, audio controls and only bank questions',async({page})=>{
    await ready(page,{fresh:true});
    await openFirstTopic(page);
    await expect(page.locator('.learning-source-block')).toHaveCount(1);
    await expect(page.locator('.learning-facts li')).toHaveCount(4);
    await expect(page.locator('.learning-example')).toBeVisible();
    await expect(page.locator('[data-speak-topic]')).toBeVisible();
    await expect(page.locator('.learning-bank-box')).toBeVisible();
    await expect(page.locator('.learning-question')).toHaveCount(1);
    await expect(page.locator('.learning-options .learning-option')).toHaveCount(4);
  });

  test('Study answer uses visual correction only and leaves all options readable',async({page})=>{
    await ready(page,{fresh:true});
    await openFirstTopic(page);
    const q = await page.evaluate(()=>window.LearningEngine.questions().find(q=>q.topicId==='ch1-t1'));
    const wrong=[0,1,2,3].find(i=>i!==q.a);
    await page.locator('input[name="studyAnswer"]').nth(wrong).check();
    await expect(page.locator('.learning-option.correct')).toHaveCount(1);
    await expect(page.locator('.learning-option.wrong')).toHaveCount(1);
    await expect(page.locator('.learning-options .learning-option')).toHaveCount(4);
    for(let i=0;i<4;i++) await expect(page.locator('.learning-options .learning-option').nth(i)).toBeVisible();
    await expect(page.locator('.feedback')).toHaveCount(0);
    await expect(page.locator('.learning-bank-box')).not.toContainText('لأن');
  });

  test('Topic completion persists and moves through the simplified topic structure',async({page})=>{
    await ready(page,{fresh:true});
    await openFirstTopic(page);
    await page.locator('[data-complete-topic]').click();
    await expect(page.locator('.learning-topic-list button').nth(0)).toContainText('✓');
    const state=await page.evaluate(()=>window.LearningEngine.state());
    expect(state.completedTopics).toContain('ch1-t1');
    await page.reload();
    await page.waitForFunction(()=>window.LearningEngine?.ready===true);
    await page.locator('[data-open-chapter="ch1"]').click();
    await expect(page.locator('.learning-topic-list button').nth(0)).toContainText('✓');
  });

  test('Review later is shared between Study and Review',async({page})=>{
    await ready(page,{fresh:true});
    await openFirstTopic(page);
    await page.locator('.learning-bank-box [data-flag]').click();
    await page.locator('[data-nav="review"]').first().click();
    await expect(page.locator('.learning-review-tabs button').first()).toContainText('(1)');
    await expect(page.locator('.learning-review-item')).toHaveCount(1);
  });

  test('Training shows immediate colors with no textual feedback',async({page})=>{
    await ready(page,{fresh:true});
    await page.locator('[data-nav="quiz"]').first().click();
    await page.locator('#learningQuizCount').fill('10');
    await page.locator('details.learning-advanced').click();
    await page.selectOption('#learningQuizOrder','original');
    await page.locator('#learningStartQuizBtn').click();
    const info=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('flutter_learning_v1_quiz'));const q=window.LearningEngine.questions().find(x=>x.id===s.qids[0]);return{a:q.a};});
    const wrong=[0,1,2,3].find(i=>i!==info.a);
    await page.locator('input[name="quizAnswer"]').nth(wrong).check();
    await page.locator('[data-check-quiz]').click();
    await expect(page.locator('.learning-option.correct')).toHaveCount(1);
    await expect(page.locator('.learning-option.wrong')).toHaveCount(1);
    await expect(page.locator('.feedback')).toHaveCount(0);
  });

  test('Exam reveals no correctness until finish and scores against total questions',async({page})=>{
    await ready(page,{fresh:true});
    await page.locator('[data-nav="quiz"]').first().click();
    await page.locator('[data-qcfg="mode"][data-value="exam"]').click();
    await page.locator('#learningQuizCount').fill('10');
    await page.locator('details.learning-advanced').click();
    await page.selectOption('#learningQuizOrder','original');
    await page.locator('#learningStartQuizBtn').click();
    const info=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('flutter_learning_v1_quiz'));const q=window.LearningEngine.questions().find(x=>x.id===s.qids[0]);return{a:q.a};});
    await page.locator('input[name="quizAnswer"]').nth(info.a).check();
    await expect(page.locator('.learning-option.correct')).toHaveCount(0);
    await expect(page.locator('.learning-option.wrong')).toHaveCount(0);
    await page.locator('[data-finish-quiz]').click();
    await expect(page.locator('.learning-result-card').first()).toContainText('10%');
    await expect(page.locator('.learning-result-card').nth(1)).toContainText('100%');
    await page.locator('[data-review-result]').click();
    await expect(page.locator('.learning-option.correct')).toHaveCount(10);
  });

  test('More keeps secondary tools out of primary navigation and exposes Print, Analytics, Cards and backup',async({page})=>{
    await ready(page,{fresh:true});
    await expect(page.locator('.learning-desktop-nav [data-nav]')).toHaveCount(3);
    await openMore(page);
    await expect(page.locator('[data-more="print"]')).toBeVisible();
    await expect(page.locator('[data-more="analytics"]')).toBeVisible();
    await expect(page.locator('[data-more="cards"]')).toBeVisible();
    await page.locator('[data-more="analytics"]').click();
    await expect(page.locator('#learningUtilityDialog')).toBeVisible();
    await expect(page.locator('#learningUtilityBody')).toContainText('الإحصائيات');
    await page.locator('[data-close-utility]').click();
    await openMore(page);
    await page.locator('[data-more="cards"]').click();
    await expect(page.locator('#learningUtilityBody')).toContainText('البطاقات');
  });

  test('Professional print covers full source content and all 341 bank questions',async({page})=>{
    await ready(page,{fresh:true});
    await openMore(page);
    await page.locator('[data-more="print"]').click();
    await expect(page.locator('#learningPrintDialog')).toBeVisible();
    await page.selectOption('#learningPrintType','answers');
    await page.selectOption('#learningPrintScope','all');
    const result=await page.evaluate(()=>window.LearningEngine.print.build());
    expect(result.questions.length).toBe(341);
    await expect(page.locator('#learningPrintDocument .learning-print-question')).toHaveCount(341);
    await expect(page.locator('#learningPrintDocument .learning-print-footer a')).toHaveAttribute('href','https://wa.me/967771179020');
    await page.evaluate(()=>document.body.classList.add('learning-printing'));
    await page.emulateMedia({media:'print'});
    const pdf=await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true});
    expect(pdf.subarray(0,4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(5000);
  });

  test('Backup exports JSON for this material',async({page})=>{
    await ready(page,{fresh:true});
    await openMore(page);
    const downloadPromise=page.waitForEvent('download');
    await page.locator('[data-more="export"]').click();
    const download=await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^flutter-learning-backup-/);
  });

  test('390px mobile layout has no horizontal overflow and More/Print remains reachable',async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await ready(page,{fresh:true});
    const layout=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth:innerWidth}));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.innerWidth+1);
    await expect(page.locator('.learning-mobile-nav')).toBeVisible();
    await expect(page.locator('#learningMoreBtn')).toBeVisible();
    await openMore(page);
    await page.locator('[data-more="print"]').click();
    await expect(page.locator('#learningPrintDialog')).toBeVisible();
  });
});
