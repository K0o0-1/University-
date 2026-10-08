from pathlib import Path

ROOT=Path(__file__).resolve().parent

def replace(path, old, new, *, count=-1):
    p=ROOT/path
    text=p.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'bootstrap patch missing expected text in {path}: {old[:120]!r}')
    p.write_text(text.replace(old,new,count),encoding='utf-8')

workflow=ROOT/'.github/workflows/validate.yml'
text=workflow.read_text(encoding='utf-8')
anchor='''          node --check assets/project-fixes.js
          node --check data/enterprise-architecture.js'''
insert='''          node --check assets/project-fixes.js
          node --check assets/materials-hub.js
          node --check assets/learning-loader.js
          node --check assets/learning-engine.js
          node --check data/materials-registry.js
          node --check data/flutter-learning.js
          node --check data/enterprise-architecture.js'''
if anchor not in text:
    raise SystemExit('validate workflow syntax anchor not found')
workflow.write_text(text.replace(anchor,insert,1),encoding='utf-8')

p=ROOT/'tests/phase8.spec.js'; text=p.read_text(encoding='utf-8')
text=text.replace("await expect(page.locator('.material-card')).toHaveCount(4);","await expect(page.locator('.material-card')).toHaveCount(5);",1)
text=text.replace("expect(new Set(hrefs)).toEqual(new Set(MATERIALS.map(material => material.path)));","expect(new Set(hrefs)).toEqual(new Set([...MATERIALS.map(material => material.path), '/materials/learning.html']));",1)
text=text.replace("await expect(page.locator('.material-card')).toHaveCount(4);","await expect(page.locator('.material-card')).toHaveCount(5);",1)
p.write_text(text,encoding='utf-8')

p=ROOT/'tests/pwa-complete.spec.js'; text=p.read_text(encoding='utf-8')
text=text.replace("const CACHE = 'university-study-v14';","const CACHE = 'university-study-v15';")
text=text.replace("  ['/materials/qa-information-security-privacy.html',100],\n];","  ['/materials/qa-information-security-privacy.html',100],\n];\nconst LEARNING = '/materials/learning.html?id=flutter-learning';")
text=text.replace("paths:MATERIALS.map(([path]) => path)","paths:[...MATERIALS.map(([path]) => path), '/materials/learning.html']")
old='''    await page.goto(`${BASE}/`,{waitUntil:'domcontentloaded'});
    await expect(page.locator('.material-card')).toHaveCount(4);'''
new='''    await page.goto(BASE + LEARNING,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => window.LearningEngine?.ready === true);
    expect(await page.evaluate(() => window.LearningEngine.questions().length)).toBe(341);

    await page.goto(`${BASE}/`,{waitUntil:'domcontentloaded'});
    await expect(page.locator('.material-card')).toHaveCount(5);'''
if old not in text: raise SystemExit('pwa hub anchor missing')
p.write_text(text.replace(old,new,1),encoding='utf-8')

p=ROOT/'tests/cross-browser-smoke.spec.js'; text=p.read_text(encoding='utf-8')
append='''

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
'''
if "Learning material remains usable in a secondary browser" not in text:
    text += append
p.write_text(text,encoding='utf-8')

p=ROOT/'README.md'; text=p.read_text(encoding='utf-8')
text=text.replace('- Flutter — 341 MCQ','- Flutter — 341 MCQ\n- Flutter Interactive Study — 4 modules / 12 chapters / 61 topics / 341 linked MCQ')
text=text.replace('- Responsive mobile layout','- Responsive mobile layout\n- Registry-driven materials: add/remove MCQ, Q&A or Learning materials without changing the hub markup\n- Flexible Learning Material schema: Modules → Chapters → Topics → Content Blocks')
text=text.replace('│   ├── project-fixes.js\n│   └── pwa-icon.svg','│   ├── project-fixes.js\n│   ├── materials-hub.js\n│   ├── learning-loader.js\n│   ├── learning-engine.js\n│   ├── learning-styles.css\n│   └── pwa-icon.svg')
text=text.replace('│   ├── security-qa.js\n├── materials/','│   ├── security-qa.js\n│   ├── materials-registry.js\n│   └── flutter-learning.js\n├── materials/')
text=text.replace('│   └── qa-information-security-privacy.html','│   ├── qa-information-security-privacy.html\n│   └── learning.html')
if '## Flexible Material Architecture' not in text:
    text += '''

## Flexible Material Architecture

The home page is generated from `data/materials-registry.js`. A material can be added or removed through the registry without hard-coding a new card in `index.html`.

Supported material families now include legacy `mcq`, `qa`, and the generic `learning` surface. Learning materials may use optional Modules and Chapters and are composed of Topics and Content Blocks. The Flutter Interactive Study material is the first implementation of this schema.

Question-bank content remains independent from learning content so the same approved bank can be linked to explanations without duplicating or rewriting the questions.
'''
p.write_text(text,encoding='utf-8')

boot=ROOT/'.github/workflows/bootstrap-flexible.yml'
if boot.exists(): boot.unlink()

cache=ROOT/'tools/__pycache__'
if cache.exists():
    import shutil; shutil.rmtree(cache)
