from pathlib import Path
ROOT=Path('.')

# 1) Extend CI syntax checks and package the tested dev branch only after all test jobs pass.
p=ROOT/'.github/workflows/validate.yml'
s=p.read_text()
old='''          node --check assets/ui-hotfixes.js\n          node --check assets/project-fixes.js\n          node --check data/enterprise-architecture.js\n          node --check data/flutter-mcq.js\n          node --check data/security-mcq.js\n          node --check data/security-qa.js\n          node --check sw.js\n'''
new='''          node --check assets/ui-hotfixes.js\n          node --check assets/project-fixes.js\n          node --check assets/materials-hub.js\n          node --check assets/learning-loader.js\n          node --check assets/learning-engine.js\n          node --check data/materials-registry.js\n          node --check data/flutter-learning.js\n          node --check data/enterprise-architecture.js\n          node --check data/flutter-mcq.js\n          node --check data/security-mcq.js\n          node --check data/security-qa.js\n          node --check sw.js\n'''
if old not in s: raise SystemExit('validate.yml syntax block anchor missing')
s=s.replace(old,new)
if 'package-dev:' not in s:
    s += '''\n  package-dev:\n    needs: [ui-test, cross-browser-smoke]\n    if: github.ref == 'refs/heads/feature/flexible-learning-materials-20261008'\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v7\n      - name: Package tested development snapshot\n        run: |\n          zip -qr University_Flexible_Learning_Dev.zip . -x '.git/*' 'University_Flexible_Learning_Dev.zip'\n      - uses: actions/upload-artifact@v4\n        with:\n          name: University_Flexible_Learning_Dev\n          path: University_Flexible_Learning_Dev.zip\n          retention-days: 7\n'''
p.write_text(s)

# 2) PWA complete test: legacy four + the new registry-driven learning material.
p=ROOT/'tests/pwa-complete.spec.js'
p.write_text(r'''const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const CACHE = 'university-study-v15';
const MATERIALS = [
  ['/materials/enterprise-architecture.html',275],
  ['/materials/mcq-flutter.html',341],
  ['/materials/mcq-information-security-privacy.html',200],
  ['/materials/qa-information-security-privacy.html',100],
];
const LEARNING = '/materials/learning.html?id=flutter-learning';
const CACHE_PATHS = [...MATERIALS.map(([path]) => path), '/materials/learning.html', '/data/flutter-learning.js', '/data/flutter-mcq.js', '/data/materials-registry.js', '/assets/learning-loader.js', '/assets/learning-engine.js', '/assets/learning-styles.css'];

test('home-page registration precaches the complete flexible library for first-session offline use', async ({ page, context }) => {
  await page.goto(`${BASE}/`, {waitUntil:'domcontentloaded'});
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service Worker API unavailable');
    await navigator.serviceWorker.ready;
  });
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(() => !!navigator.serviceWorker?.controller);
  await page.waitForFunction(async ({cacheName,paths}) => {
    const names = await caches.keys(); if (!names.includes(cacheName)) return false;
    const cache = await caches.open(cacheName);
    const hits = await Promise.all(paths.map(path => cache.match(new URL(path, location.origin + '/'), {ignoreSearch:true})));
    return hits.every(Boolean);
  }, {cacheName:CACHE,paths:CACHE_PATHS});

  await context.setOffline(true);
  try {
    for (const [path,count] of MATERIALS) {
      await page.goto(BASE + path,{waitUntil:'domcontentloaded'});
      await page.waitForSelector('main .q');
      await page.waitForFunction(() => window.ProjectFixes?.ready === true);
      expect(await page.evaluate(() => window.StudyEngine.allQuestions().length)).toBe(count);
    }
    await page.goto(BASE + LEARNING,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => window.LearningEngine?.ready === true);
    expect(await page.evaluate(() => window.LearningEngine.questions().length)).toBe(341);
    expect(await page.evaluate(() => window.LearningEngine.topics().length)).toBe(61);
    await page.goto(`${BASE}/`,{waitUntil:'domcontentloaded'});
    await expect(page.locator('.material-card')).toHaveCount(5);
  } finally { await context.setOffline(false); }
});
''')

# 3) Cross-browser smoke keeps legacy behavior and explicitly covers the learning engine in Firefox/WebKit.
p=ROOT/'tests/cross-browser-smoke.spec.js'
p.write_text(r'''const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const EA = `${BASE}/materials/enterprise-architecture.html`;
const QA = `${BASE}/materials/qa-information-security-privacy.html`;
const LEARNING = `${BASE}/materials/learning.html?id=flutter-learning`;

async function ready(page,url){
  await page.goto(url); await page.waitForSelector('main .q');
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

test('Learning material navigation, source content and print are usable in a secondary browser', async ({ page }) => {
  await page.goto(LEARNING);
  await page.waitForFunction(() => window.LearningEngine?.ready === true);
  await expect(page.locator('.learning-desktop-nav [data-nav]')).toHaveCount(3);
  await page.locator('[data-open-chapter="ch1"]').click();
  await expect(page.locator('.learning-topic-list button')).toHaveCount(6);
  await expect(page.locator('.learning-source-block').first()).toBeVisible();
  await page.locator('#learningMoreBtn').click();
  await expect(page.locator('#learningMoreMenu')).toBeVisible();
  await page.locator('[data-more="print"]').click();
  await expect(page.locator('#learningPrintDialog')).toBeVisible();
});
''')

# 4) Phase 8 remains a legacy-four pipeline test, but the hub now intentionally contains five materials.
p=ROOT/'tests/phase8.spec.js'
s=p.read_text()
anchor="];\nconst EA = MATERIALS[0].path;"
if anchor not in s: raise SystemExit('phase8 array anchor missing')
s=s.replace(anchor,"];\nconst HUB_PATHS = [...MATERIALS.map(material => material.path), '/materials/learning.html'];\nconst EA = MATERIALS[0].path;",1)
s=s.replace("await expect(page.locator('.material-card')).toHaveCount(4);","await expect(page.locator('.material-card')).toHaveCount(HUB_PATHS.length);")
s=s.replace("expect(new Set(hrefs)).toEqual(new Set(MATERIALS.map(material => material.path)));","expect(new Set(hrefs)).toEqual(new Set(HUB_PATHS));",1)
p.write_text(s)

# 5) Document the registry-driven architecture without changing the old source-data rule.
p=ROOT/'README.md'
s=p.read_text()
s=s.replace('- Flutter — 341 MCQ\n','- Flutter — 341 MCQ\n- Flutter Interactive Study — 4 Modules / 12 Chapters / 61 Topics using the same 341-question bank\n')
insert='''\n## Flexible Material Architecture\n\nThe library home page and offline precache are registry-driven through `data/materials-registry.js`. A material can be added or removed by registering or removing its entry and its associated files, without hardcoding a new card into the home page.\n\nSupported material styles now include:\n\n- MCQ question banks\n- direct Q&A banks\n- learning materials with optional Modules → Chapters → Topics → content blocks\n\n`materials/learning.html` is a generic learning shell. A learning material supplies its own data file and may reuse an existing question bank instead of duplicating question content. The first implementation is Flutter Interactive Study.\n\nFlutter learning content is derived only from the uploaded source and the existing University Flutter bank. The generated 449 section-training questions are intentionally excluded.\n'''
if '## Flexible Material Architecture' not in s:
    s=s.replace('\n## Running Locally\n',insert+'\n## Running Locally\n')
p.write_text(s)

print('bootstrap patches applied')
