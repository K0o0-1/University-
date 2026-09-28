#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

for name in ['mcq-engine.js','qa-engine.js']:
    path = ROOT / 'assets' / name
    text = path.read_text(encoding='utf-8')
    old = """  if (mode !== 'quiz') {\n    ALL_Q.forEach(q => q.el.classList.remove('quiz-mode', 'answered', 'grade-correct-mark', 'grade-wrong-mark'));\n    applyFilters();\n  }\n"""
    new = """  if (mode !== 'quiz') {\n    ALL_Q.forEach(q => {\n      q.el.classList.remove('quiz-mode', 'answered', 'grade-correct-mark', 'grade-wrong-mark');\n      q.el.classList.toggle('revealed', mode === 'study' && !!state.revealed[q.id]);\n    });\n    activeQuizIds = [];\n    quizAnswers = {};\n    applyFilters();\n  }\n"""
    if old not in text:
        raise SystemExit(f'{name}: switchMode block not found')
    text = text.replace(old, new, 1)
    path.write_text(text, encoding='utf-8')

qa = ROOT / 'assets' / 'qa-engine.js'
text = qa.read_text(encoding='utf-8')
old = """  if (showBtn) {\n    const card = showBtn.closest('.q');\n    card.classList.add('revealed');\n    state.revealed[card.dataset.qid] = true;\n    saveState();\n    e.stopPropagation();\n    return;\n  }\n"""
new = """  if (showBtn) {\n    const card = showBtn.closest('.q');\n    card.classList.add('revealed');\n    if (currentMode === 'study') {\n      state.revealed[card.dataset.qid] = true;\n      saveState();\n    }\n    e.stopPropagation();\n    return;\n  }\n"""
if old not in text:
    raise SystemExit('qa-engine.js: show answer block not found')
qa.write_text(text.replace(old, new, 1), encoding='utf-8')

sw = ROOT / 'sw.js'
text = sw.read_text(encoding='utf-8').replace("  './assets/runtime-fixes.js',\n", '')
sw.write_text(text, encoding='utf-8')

validator = ROOT / 'tools' / 'validate.py'
text = validator.read_text(encoding='utf-8')
insert = """\nif (ROOT / 'assets' / 'runtime-fixes.js').exists():\n    fail('assets/runtime-fixes.js should not exist after engine refactor')\n\nfor html_path in (ROOT / 'materials').glob('*.html'):\n    page = html_path.read_text(encoding='utf-8')\n    for required in ('id=\"filterBy\"', 'id=\"sortBy\"', 'id=\"stopQuizFloatBtn\"'):\n        if required not in page:\n            fail(f'{html_path.relative_to(ROOT)}: missing required UI control {required}')\n    if 'runtime-fixes.js' in page:\n        fail(f'{html_path.relative_to(ROOT)}: still references runtime-fixes.js')\n"""
anchor = "if (ROOT / 'data' / 'enterprise-architecture-base173.js').exists():\n    fail('enterprise-architecture-base173.js should not exist after EA merge')\n"
if insert.strip() not in text:
    if anchor not in text: raise SystemExit('validate.py anchor not found')
    text = text.replace(anchor, anchor + insert, 1)
validator.write_text(text, encoding='utf-8')

workflow = ROOT / '.github' / 'workflows' / 'validate.yml'
text = workflow.read_text(encoding='utf-8').replace('          node --check assets/runtime-fixes.js\n', '')
workflow.write_text(text, encoding='utf-8')

readme = ROOT / 'README.md'
text = readme.read_text(encoding='utf-8').replace('│   ├── runtime-fixes.js\n', '')
text = text.replace('The shared interface and behavior are handled by files in the `assets/` directory.', 'The shared interface and behavior are handled directly by `assets/mcq-engine.js` and `assets/qa-engine.js`.')
readme.write_text(text, encoding='utf-8')

print('Post-refactor cleanup completed.')
