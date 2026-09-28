#!/usr/bin/env python3
import json
import re
from pathlib import Path


def load_material(path):
    path = Path(path)
    text = path.read_text(encoding='utf-8')
    m = re.fullmatch(r'\s*window\.MATERIAL_DATA\s*=\s*(\{.*\});\s*', text, re.S)
    if not m:
        raise RuntimeError(f'Cannot parse {path}')
    return json.loads(m.group(1))


def write_material(path, data):
    Path(path).write_text(
        'window.MATERIAL_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n',
        encoding='utf-8'
    )


def simplify_title(title):
    title = re.sub(r'^الأسئلة الرئيسية\s*[—–-]\s*', '', title).strip()
    title = re.sub(r'^أسئلة\s+', '', title).strip()
    title = title.replace('(EA2)', '').strip()
    title = re.sub(r'\s*[—–-]\s*\d+\s*[—–-]\s*\d+\s*$', '', title).strip()
    return re.sub(r'\s{2,}', ' ', title).strip(' —–-')


# 1) Merge Enterprise Architecture base 173 + EA2 102 into one data file.
base_path = Path('data/enterprise-architecture-base173.js')
ext_path = Path('data/enterprise-architecture.js')
base = load_material(base_path)
ext_text = ext_path.read_text(encoding='utf-8')
m = re.search(r'const qs=(\[.*\]);\s*d\.sections\.push', ext_text, re.S)
if not m:
    raise RuntimeError('Could not extract EA2 questions')
ea2 = json.loads(m.group(1))
if len(ea2) != 102:
    raise RuntimeError(f'Expected 102 EA2 questions, got {len(ea2)}')
base['sections'].append({'title': 'الجزء الثاني', 'badge': '174 – 275', 'qs': ea2})
base['meta'].update({
    'subtitle': 'بنك 275 سؤال — دراسة / اختبار / بطاقات',
    'count': 275,
    'storageKey': 'enterprise275_state_ea2_v5',
    'shortName': 'EA 275',
    'description': 'بنك 275 سؤال في Enterprise Architecture — النسخة الموحدة 1–275',
    'kind': 'mcq'
})
write_material(ext_path, base)
base_path.unlink()

# 2) Keep section titles concise; range stays only in badge.
for path in sorted(Path('data').glob('*.js')):
    data = load_material(path)
    for sec in data.get('sections', []):
        sec['title'] = simplify_title(sec.get('title', ''))
    write_material(path, data)

# 3) Clean index labels and replace invalid blob PWA registration.
static_pwa = '''/* =========================================================
   PWA
   ========================================================= */
(function initPWA(){
  const manifestLink = document.getElementById('manifestLink');
  if (manifestLink) manifestLink.href = '../manifest.webmanifest';
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('../sw.js', {scope:'../'}).catch(err => console.warn('SW registration failed:', err));
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const installBtn = document.getElementById('installBtn');
    if (installBtn) installBtn.style.display = 'inline-flex';
  });
})();

'''

for engine in [Path('assets/mcq-engine.js'), Path('assets/qa-engine.js')]:
    text = engine.read_text(encoding='utf-8')
    old = "a.textContent = (si + 1) + '. ' + sec.title + ' (' + sec.badge + ')';"
    new = "a.textContent = (si + 1) + '. ' + sec.title + ' — ' + sec.badge;"
    if old not in text:
        raise RuntimeError(f'Index builder not found in {engine}')
    text = text.replace(old, new)

    pwa_start = text.find('/* =========================================================\n   PWA')
    session_marker = '/* =========================================================\n   حفظ جلسة الاختبار'
    pwa_end = text.find(session_marker, pwa_start)
    if pwa_start < 0 or pwa_end < 0:
        raise RuntimeError(f'PWA block markers not found in {engine}')
    text = text[:pwa_start] + static_pwa + text[pwa_end:]

    legacy_resume = text.find('\nif (state.quizSession && state.quizSession.score &&')
    if legacy_resume >= 0:
        text = text[:legacy_resume] + '\n'
    engine.write_text(text, encoding='utf-8')

# 4) Pages: correct counts, one EA data script, stop button, runtime fixes.
pages = {
    Path('materials/enterprise-architecture.html'): 275,
    Path('materials/mcq-flutter.html'): 341,
    Path('materials/mcq-information-security-privacy.html'): 200,
    Path('materials/qa-information-security-privacy.html'): 100,
}
for page, count in pages.items():
    text = page.read_text(encoding='utf-8')
    text = text.replace('<link rel="manifest" id="manifestLink">', '<link rel="manifest" id="manifestLink" href="../manifest.webmanifest">')
    text = re.sub(r'(<div class="stat">التقدم <b id="statProgress">)0/\d+(</b>)', rf'\g<1>0/{count}\2', text)
    if 'id="stopQuizBtn"' not in text:
        text = text.replace(
            '<button data-action="mode-quiz">📝 اختبار</button>',
            '<button data-action="mode-quiz">📝 اختبار</button>\n    <button data-action="stop-quiz" id="stopQuizBtn" style="display:none">⏹ إيقاف الاختبار</button>'
        )
    text = text.replace('<script src="../data/enterprise-architecture-base173.js"></script>', '')
    if '../assets/runtime-fixes.js' not in text:
        text = text.replace('<script src="../assets/mcq-engine.js"></script>', '<script src="../assets/mcq-engine.js"></script><script src="../assets/runtime-fixes.js"></script>')
        text = text.replace('<script src="../assets/qa-engine.js"></script>', '<script src="../assets/qa-engine.js"></script><script src="../assets/runtime-fixes.js"></script>')
    page.write_text(text, encoding='utf-8')

# 5) Homepage: EA 275 + close material grid before footer.
index = Path('index.html')
text = index.read_text(encoding='utf-8')
text = text.replace('<span class="material-pill">233 سؤال</span>', '<span class="material-pill">275 سؤال</span>', 1)
text = re.sub(
    r'(<a class="material-card" href="materials/mcq-flutter\.html">.*?</a>)\s*(<footer class="signature")',
    r'\1\n</div>\n\2', text, count=1, flags=re.S
)
index.write_text(text, encoding='utf-8')

# 6) README reflects the real structure.
readme = Path('README.md')
text = readme.read_text(encoding='utf-8')
structure = '''## Project Structure

```text
University-/
├── index.html
├── manifest.webmanifest
├── sw.js
├── assets/
│   ├── styles.css
│   ├── mcq-engine.js
│   ├── qa-engine.js
│   ├── runtime-fixes.js
│   └── pwa-icon.svg
├── data/
│   ├── security-mcq.js
│   ├── security-qa.js
│   ├── flutter-mcq.js
│   └── enterprise-architecture.js
├── materials/
│   ├── mcq-information-security-privacy.html
│   ├── qa-information-security-privacy.html
│   ├── mcq-flutter.html
│   └── enterprise-architecture.html
├── tools/
│   └── validate.py
├── .github/workflows/
│   └── validate.yml
├── .nojekyll
└── README.md
```'''
text = re.sub(r'## Project Structure\s+```text.*?```', structure, text, count=1, flags=re.S)
if '## Validation' not in text:
    text = text.replace('## Repository\n', '''## Validation

The repository includes an automatic validator that checks question counts, answer indexes, referenced files, and initial page counters. Run it locally with:

```bash
python3 tools/validate.py
```

GitHub Actions also runs the same validation on pushes and pull requests.

## Repository
''')
readme.write_text(text, encoding='utf-8')

print('Maintenance changes applied successfully.')
