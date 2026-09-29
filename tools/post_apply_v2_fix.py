#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'assets' / 'qa-engine.js'
text = path.read_text(encoding='utf-8')
old = """function restoreQuizAnswer(q, grade){
  q.el.classList.add('answered', 'revealed');
  q.el.classList.add(grade === 'correct' ? 'grade-correct-mark' : 'grade-wrong-mark');
}
"""
new = """function restoreQuizAnswer(q, grade){
  q.el.classList.add('answered');
  if (quizKind !== 'exam') q.el.classList.add('revealed');
  q.el.classList.add(grade === 'correct' ? 'grade-correct-mark' : 'grade-wrong-mark');
}
"""
if old not in text and new not in text:
    raise SystemExit('qa-engine.js: restoreQuizAnswer block not found')
if old in text:
    text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print('Post-apply V2 fixes completed')
