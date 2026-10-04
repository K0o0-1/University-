#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors = []
warnings = []


def fail(msg):
    errors.append(msg)


def warn(msg):
    warnings.append(msg)


def load_material(path):
    text = path.read_text(encoding='utf-8')
    m = re.fullmatch(r'\s*window\.MATERIAL_DATA\s*=\s*(\{.*\});\s*', text, re.S)
    if not m:
        fail(f'{path.relative_to(ROOT)}: expected a single window.MATERIAL_DATA JSON assignment')
        return None
    try:
        return json.loads(m.group(1))
    except Exception as exc:
        fail(f'{path.relative_to(ROOT)}: invalid JSON payload: {exc}')
        return None


def validate_material(path):
    data = load_material(path)
    if not data:
        return

    meta = data.get('meta', {})
    sections = data.get('sections', [])
    questions = [q for sec in sections for q in sec.get('qs', [])]
    declared = meta.get('count')

    if declared != len(questions):
        fail(f'{path.relative_to(ROOT)}: meta.count={declared}, actual={len(questions)}')
    if not meta.get('storageKey'):
        fail(f'{path.relative_to(ROOT)}: missing storageKey')
    if not meta.get('slug'):
        fail(f'{path.relative_to(ROOT)}: missing slug')

    kind = meta.get('kind')
    seen = set()
    for index, q in enumerate(questions, 1):
        question = str(q.get('q', '')).strip()
        if not question:
            fail(f'{path.relative_to(ROOT)}: question {index} has empty text')
        normalized = re.sub(r'\s+', ' ', question)
        if normalized in seen:
            warn(f'{path.relative_to(ROOT)}: duplicate wording near question {index}: {normalized[:80]}')
        seen.add(normalized)

        if kind == 'mcq':
            options = q.get('o')
            answer = q.get('a')
            if not isinstance(options, list) or len(options) < 2:
                fail(f'{path.relative_to(ROOT)}: question {index} needs at least two options')
            elif not isinstance(answer, int) or not (0 <= answer < len(options)):
                fail(f'{path.relative_to(ROOT)}: question {index} answer index {answer!r} is invalid for {len(options)} options')
        elif kind == 'qa':
            if not str(q.get('a', '')).strip():
                fail(f'{path.relative_to(ROOT)}: question {index} has empty answer')
        else:
            fail(f'{path.relative_to(ROOT)}: unsupported meta.kind={kind!r}')

    running = 0
    for sec_index, sec in enumerate(sections, 1):
        sec_qs = sec.get('qs', [])
        if not sec.get('title'):
            fail(f'{path.relative_to(ROOT)}: section {sec_index} has empty title')
        badge = str(sec.get('badge', '')).strip()
        if not badge:
            fail(f'{path.relative_to(ROOT)}: section {sec_index} has empty badge')

        expected_start = running + 1
        expected_end = running + len(sec_qs)
        range_match = re.fullmatch(r'(\d+)\s*[–—-]\s*(\d+)', badge)
        if range_match:
            start, end = map(int, range_match.groups())
            if (start, end) != (expected_start, expected_end):
                fail(
                    f'{path.relative_to(ROOT)}: section {sec_index} badge {badge!r} '
                    f'does not match actual range {expected_start}–{expected_end}'
                )
        running = expected_end

    if running != len(questions):
        fail(f'{path.relative_to(ROOT)}: section total mismatch')


for data_file in sorted((ROOT / 'data').glob('*.js')):
    validate_material(data_file)

if (ROOT / 'data' / 'enterprise-architecture-base173.js').exists():
    fail('enterprise-architecture-base173.js should not exist after EA merge')
if (ROOT / 'assets' / 'runtime-fixes.js').exists():
    fail('assets/runtime-fixes.js should not exist after engine refactor')

required_assets = [
    'assets/study-v2.js',
    'assets/study-plus.js',
    'assets/study-ui-loader.js',
    'assets/print-phase6.js',
    'assets/project-fixes.js',
]
for rel in required_assets:
    if not (ROOT / rel).exists():
        fail(f'{rel} is required')

for html_path in (ROOT / 'materials').glob('*.html'):
    page = html_path.read_text(encoding='utf-8')
    for required in ('id="filterBy"', 'id="sortBy"', 'id="stopQuizFloatBtn"'):
        if required not in page:
            fail(f'{html_path.relative_to(ROOT)}: missing required UI control {required}')
    if 'runtime-fixes.js' in page:
        fail(f'{html_path.relative_to(ROOT)}: still references runtime-fixes.js')
    if '../assets/study-v2.js' not in page:
        fail(f'{html_path.relative_to(ROOT)}: missing study-v2.js')
    if '../assets/study-plus.js' not in page:
        fail(f'{html_path.relative_to(ROOT)}: missing study-plus.js')
    if 'https://wa.me/967771179020' not in page:
        fail(f'{html_path.relative_to(ROOT)}: author footer is not linked to WhatsApp')

html_files = list((ROOT / 'materials').glob('*.html')) + [ROOT / 'index.html']
for html_path in html_files:
    text = html_path.read_text(encoding='utf-8')
    for ref in re.findall(r'(?:src|href)="([^"]+)"', text):
        if ref.startswith(('http://', 'https://', 'data:', '#')):
            continue
        clean = ref.split('?', 1)[0].split('#', 1)[0]
        if not clean:
            continue
        target = (html_path.parent / clean).resolve()
        try:
            target.relative_to(ROOT.resolve())
        except ValueError:
            continue
        if not target.exists():
            fail(f'{html_path.relative_to(ROOT)}: missing referenced file {ref}')

expected = {
    'materials/enterprise-architecture.html': 275,
    'materials/mcq-flutter.html': 341,
    'materials/mcq-information-security-privacy.html': 200,
    'materials/qa-information-security-privacy.html': 100,
}
for rel, count in expected.items():
    text = (ROOT / rel).read_text(encoding='utf-8')
    if f'0/{count}' not in text:
        fail(f'{rel}: initial progress counter is not 0/{count}')

loader = (ROOT / 'assets' / 'study-ui-loader.js').read_text(encoding='utf-8')
if "project-fixes.js" not in loader:
    fail('study-ui-loader.js must load project-fixes.js after the UI modules')

sw = (ROOT / 'sw.js').read_text(encoding='utf-8')
for rel in [
    './assets/project-fixes.js',
    './materials/enterprise-architecture.html',
    './materials/mcq-flutter.html',
    './materials/mcq-information-security-privacy.html',
    './materials/qa-information-security-privacy.html',
    './data/enterprise-architecture.js',
    './data/flutter-mcq.js',
    './data/security-mcq.js',
    './data/security-qa.js',
]:
    if rel not in sw:
        fail(f'sw.js: offline precache missing {rel}')

index = (ROOT / 'index.html').read_text(encoding='utf-8')
if "serviceWorker.register('./sw.js'" not in index:
    fail('index.html: service worker must register from the library home page')

for message in warnings:
    print('WARN', message)

if errors:
    print('\nVALIDATION FAILED')
    for error in errors:
        print('ERROR', error)
    sys.exit(1)

print('Validation passed: data counts, answer indexes, section ranges, file references, page counters, PWA precache and required UI modules are consistent.')
