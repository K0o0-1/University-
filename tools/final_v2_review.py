#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

study = ROOT / 'assets' / 'study-v2.js'
text = study.read_text(encoding='utf-8')
old = """  function recordAttempt(id, correct){
    const q = qById(id);
    if (!q) return;
    const old = recFor(q);
    const recent = Array.isArray(old.recent) ? old.recent.slice(-4) : [];
"""
new = """  function recordAttempt(id, correct){
    const q = qById(id);
    if (!q) return;
    const cumulativeCorrect = Number(state.correct?.[id]) || 0;
    const cumulativeWrong = Number(state.wrong?.[id]) || 0;
    const existing = state.questionStats[id];
    const old = existing || {
      attempts:Math.max(0, cumulativeCorrect + cumulativeWrong - 1),
      correct:Math.max(0, cumulativeCorrect - (correct ? 1 : 0)),
      wrong:Math.max(0, cumulativeWrong - (correct ? 0 : 1)),
      recent:[], lastAt:null, lastResult:null
    };
    const recent = Array.isArray(old.recent) ? old.recent.slice(-4) : [];
"""
if old not in text and new not in text:
    raise SystemExit('recordAttempt block not found')
if old in text:
    text = text.replace(old, new, 1)

old = """  function onAnswer(payload){
    recordAttempt(payload.id, !!payload.correct);
    refreshNavigator();
  }
"""
new = """  function onAnswer(payload){
    recordAttempt(payload.id, !!payload.correct);
    if (payload.mode === 'exam' && kind === 'mcq' && !payload.correct) {
      qById(payload.id)?.el.querySelector('.tag.err')?.classList.add('hidden');
    }
    refreshNavigator();
  }
"""
if old not in text and new not in text:
    raise SystemExit('onAnswer block not found')
if old in text:
    text = text.replace(old, new, 1)

old = """    renderQuizResult(result);
    refreshNavigator(true);
  }
"""
new = """    renderQuizResult(result);
    if (result.mode === 'exam' && kind === 'mcq') {
      (result.wrongIds || []).forEach(id => {
        const tag = qById(id)?.el.querySelector('.tag.err');
        if (tag) {
          tag.textContent = 'أخطأت ' + (Number(state.wrong?.[id]) || 0);
          tag.classList.remove('hidden');
        }
      });
    }
    refreshNavigator(true);
  }
"""
if old not in text and new not in text:
    raise SystemExit('onQuizFinished block not found')
if old in text:
    text = text.replace(old, new, 1)

text = text.replace('<label>الترتيب\n            <select id="quizSetupOrder">', '<label>اختيار الأسئلة\n            <select id="quizSetupOrder">')
study.write_text(text, encoding='utf-8')

test_path = ROOT / 'tests' / 'ui.spec.js'
tests = test_path.read_text(encoding='utf-8')
tests = tests.replace('expect(rec.wrong).toBeGreaterThanOrEqual(1);', "expect(rec.attempts).toBe(1);\n    expect(rec.wrong).toBe(1);")
needle = """    await expect(page.locator('#statScore')).toHaveText('مخفي');
    await expect(card.locator('ol.o li.exam-choice')).toHaveCount(1);
"""
replacement = """    await expect(page.locator('#statScore')).toHaveText('مخفي');
    await expect(card.locator('ol.o li.exam-choice')).toHaveCount(1);
    await expect(card.locator('.tag.err')).toHaveClass(/hidden/);
"""
if needle in tests:
    tests = tests.replace(needle, replacement, 1)
elif replacement not in tests:
    raise SystemExit('Exam concealment test anchor not found')
test_path.write_text(tests, encoding='utf-8')

print('Final V2 review fixes applied')
