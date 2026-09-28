#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing pattern for {label}')
    return text.replace(old, new, 1)


def replace_section(text, start_title, end_title, body):
    pattern = re.compile(
        r'/\* =+\n\s*' + re.escape(start_title) + r'\n\s*=+ \*/.*?(?=/\* =+\n\s*' + re.escape(end_title) + r'\n\s*=+ \*/)',
        re.S,
    )
    m = pattern.search(text)
    if not m:
        raise SystemExit(f'Missing section {start_title!r} -> {end_title!r}')
    banner = f'/* =========================================================\n   {start_title}\n   ========================================================= */\n'
    return text[:m.start()] + banner + body.rstrip() + '\n\n' + text[m.end():]


COMMON_STATE_HELPERS = r'''
function stableHash(text){
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

const usedQuestionIds = new Set();
function makeQuestionId(sec, si, item){
  const payload = [sec.title, sec.badge, item.q, ...(item.o || []), item.a || ''].join('|');
  const base = 'qid-' + stableHash(payload);
  let id = base, suffix = 2;
  while (usedQuestionIds.has(id)) id = base + '-' + suffix++;
  usedQuestionIds.add(id);
  return id;
}

let activeQuizIds = [];
let quizAnswers = {};
let quizPausedElapsedMs = 0;
let resumeModalShownForSession = false;

function questionById(id){ return ALL_Q.find(q => q.id === id); }
function activeQuizItems(){ return activeQuizIds.map(questionById).filter(Boolean); }

function migrateLegacyStateIds(){
  const legacyToStable = {};
  ALL_Q.forEach(q => { legacyToStable['q' + q.num] = q.id; });
  ['fav','mastered','wrong','revealed','correct'].forEach(key => {
    const source = state[key] || {};
    Object.entries(legacyToStable).forEach(([legacy, stable]) => {
      if (Object.prototype.hasOwnProperty.call(source, legacy) && !Object.prototype.hasOwnProperty.call(source, stable)) {
        source[stable] = source[legacy];
      }
      delete source[legacy];
    });
    state[key] = source;
  });
  state.lastQuizWrongIds = (state.lastQuizWrongIds || []).map(id => legacyToStable[id] || id).filter(id => questionById(id));
  const session = state.quizSession;
  if (session && session.version === 2) {
    session.scopeIds = (session.visibleIds || []).map(id => legacyToStable[id] || id);
    const mapped = {};
    Object.entries(session.answered || {}).forEach(([id, value]) => { mapped[legacyToStable[id] || id] = value; });
    session.answered = mapped;
    delete session.visibleIds;
    session.version = 3;
    session.material = MATERIAL.slug;
  } else if (session && session.version !== 3) {
    state.quizSession = null;
  }
  state.stateVersion = 3;
  saveState();
}

function setStopButtons(active){
  const top = document.getElementById('stopQuizBtn');
  const floating = document.getElementById('stopQuizFloatBtn');
  if (top) top.style.display = active ? 'inline-flex' : 'none';
  if (floating) floating.style.display = active ? 'inline-flex' : 'none';
}

function lockStudyControls(locked){
  ['search','secFilter','filterBy','sortBy','clearBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = locked;
  });
  ['shuffle','toggle-reveal'].forEach(action => {
    const el = document.querySelector(`[data-action="${action}"]`);
    if (el) el.disabled = locked;
  });
}

function ensureResumeModal(){
  if (document.getElementById('resumeQuizModal')) return;
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'resumeQuizModal';
  modal.innerHTML = `
    <div class="modal-card">
      <h3>⏸ اختبار متوقف</h3>
      <p id="resumeQuizText">لديك اختبار متوقف.</p>
      <div class="modal-actions">
        <button id="resumeQuizContinue" class="btn-primary">▶ استئناف الاختبار</button>
        <button id="resumeQuizFinish" class="qr-danger">⏹ إنهاء وحساب النتيجة</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('resumeQuizContinue').addEventListener('click', () => {
    modal.classList.remove('show');
    resumeQuizSession(state.quizSession);
  });
  document.getElementById('resumeQuizFinish').addEventListener('click', () => {
    const session = state.quizSession;
    modal.classList.remove('show');
    if (session && resumeQuizSession(session, true)) finishQuiz('stopped');
  });
}

function showResumeModal(){
  const session = state.quizSession;
  if (!session || session.version !== 3 || session.material !== MATERIAL.slug) return false;
  ensureResumeModal();
  const done = Object.keys(session.answered || {}).length;
  const total = (session.scopeIds || []).length;
  document.getElementById('resumeQuizText').textContent =
    `لديك اختبار متوقف بعد الإجابة عن ${done} من ${total}. اختر الاستئناف أو إنهاء الاختبار وحساب نتيجة ما أجبت عنه.`;
  document.getElementById('resumeQuizModal').classList.add('show');
  resumeModalShownForSession = true;
  return true;
}
'''

FILTER_CODE = r'''
const searchInput = document.getElementById('search');
const filterBy = document.getElementById('filterBy');
const sortBy = document.getElementById('sortBy');
let sortedSection = null;

function restoreOriginalLayout(){
  if (sortedSection && sortedSection.parentNode) sortedSection.remove();
  sortedSection = null;
  SECTIONS.forEach((sec, si) => {
    const secEl = document.getElementById('sec' + (si + 1));
    if (secEl && secEl.parentNode !== mainEl) mainEl.appendChild(secEl);
  });
  ALL_Q.slice().sort((a,b) => a.num - b.num).forEach(q => q.originalSection.appendChild(q.el));
}

function filteredItems(){
  const term = searchInput.value.trim().toLowerCase();
  const secId = secFilter.value;
  const mode = filterBy.value;
  const sort = sortBy.value;
  let list = ALL_Q.filter(item => {
    const text = item.el.textContent.toLowerCase();
    if (term && !text.includes(term)) return false;
    if (secId && item.sec !== secId) return false;
    if (mode === 'wrong' && !(state.wrong[item.id] > 0)) return false;
    if (mode === 'unmastered' && !!state.mastered[item.id]) return false;
    if (mode === 'fav' && !state.fav[item.id]) return false;
    return true;
  });

  if (sort === 'wrong-desc' || sort === 'wrong-asc') {
    list = list.filter(item => (state.wrong[item.id] || 0) > 0);
    const direction = sort === 'wrong-desc' ? -1 : 1;
    list.sort((a,b) => {
      const diff = (state.wrong[a.id] || 0) - (state.wrong[b.id] || 0);
      return diff ? diff * direction : a.num - b.num;
    });
  } else {
    list.sort((a,b) => a.num - b.num);
  }
  return list;
}

function applyFilters(){
  if (quizStarted) return;
  restoreOriginalLayout();
  const list = filteredItems();
  const allowed = new Set(list.map(q => q.id));
  const sort = sortBy.value;

  if (sort === 'wrong-desc' || sort === 'wrong-asc') {
    document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
    sortedSection = document.createElement('section');
    sortedSection.id = 'sorted-results';
    const title = document.createElement('div');
    title.className = 'sec-title';
    title.innerHTML = `<span class="badge">${list.length}</span> نتائج الأخطاء`;
    sortedSection.appendChild(title);
    list.forEach(q => {
      q.el.classList.remove('hidden');
      sortedSection.appendChild(q.el);
    });
    if (list.length) mainEl.appendChild(sortedSection);
  } else {
    ALL_Q.forEach(q => q.el.classList.toggle('hidden', !allowed.has(q.id)));
    document.querySelectorAll('main > section').forEach(sec => {
      sec.classList.toggle('hidden', !sec.querySelector('.q:not(.hidden)'));
    });
  }

  document.getElementById('emptyMsg').style.display = list.length ? 'none' : 'block';
  if (currentMode === 'flash') { flashIdx = 0; updateFlash(); }
  return list;
}

function getVisibleQuestions(){
  return filteredItems();
}

searchInput.addEventListener('input', applyFilters);
secFilter.addEventListener('change', applyFilters);
filterBy.addEventListener('change', applyFilters);
sortBy.addEventListener('change', applyFilters);
document.getElementById('clearBtn').addEventListener('click', () => {
  searchInput.value = '';
  secFilter.value = '';
  filterBy.value = 'all';
  sortBy.value = 'default';
  applyFilters();
  searchInput.focus();
});
'''

FLASH_MCQ = r'''
let flashIdx = 0;
function flashList(){ return filteredItems(); }
function updateFlash(){
  const list = flashList();
  if (!list.length) {
    document.getElementById('fcQ').textContent = 'لا توجد أسئلة مطابقة للفلاتر الحالية';
    document.getElementById('fcA').textContent = '—';
    return;
  }
  flashIdx = ((flashIdx % list.length) + list.length) % list.length;
  const item = list[flashIdx];
  document.getElementById('fcQ').textContent = item.num + ' ' + item.q;
  document.getElementById('fcA').textContent = item.o[item.a];
  document.getElementById('flashCard').classList.remove('flipped');
}
function flashNext(){ const list = flashList(); if (!list.length) return; flashIdx = (flashIdx + 1) % list.length; updateFlash(); }
function flashPrev(){ const list = flashList(); if (!list.length) return; flashIdx = (flashIdx - 1 + list.length) % list.length; updateFlash(); }
document.getElementById('flashCard').addEventListener('click', function(){ this.classList.toggle('flipped'); });
'''

FLASH_QA = FLASH_MCQ.replace("item.o[item.a]", "item.a")

QUIZ_COMMON_START = r'''
function setQuizLayout(scopeIds){
  restoreOriginalLayout();
  const allowed = new Set(scopeIds);
  ALL_Q.forEach(q => {
    q.el.classList.toggle('hidden', !allowed.has(q.id));
    q.el.classList.toggle('quiz-mode', allowed.has(q.id));
  });
  document.querySelectorAll('main > section').forEach(sec => {
    sec.classList.toggle('hidden', !sec.querySelector('.q:not(.hidden)'));
  });
}

function quizElapsedMs(){
  return quizStarted && quizStartTime ? Math.max(0, Date.now() - quizStartTime) : quizPausedElapsedMs;
}

function saveQuizSession(){
  if (!activeQuizIds.length || currentMode !== 'quiz') return;
  state.quizSession = {
    version: 3,
    material: MATERIAL.slug,
    elapsedMs: quizElapsedMs(),
    score: {c: state.quizScore.c || 0, w: state.quizScore.w || 0},
    streak: currentStreak || 0,
    bestStreak: Math.max(bestStreak || 0, state.bestStreak || 0),
    answered: {...quizAnswers},
    scopeIds: [...activeQuizIds]
  };
  saveState();
}

function pauseQuiz(){
  if (!quizStarted || currentMode !== 'quiz') return;
  quizPausedElapsedMs = quizElapsedMs();
  saveQuizSession();
  if (quizTimerId) clearInterval(quizTimerId);
  quizTimerId = null;
  quizStarted = false;
  setStopButtons(false);
  lockStudyControls(false);
}

function switchMode(mode){
  if (currentMode === 'quiz' && quizStarted && mode !== 'quiz') {
    pauseQuiz();
    showToast('⏸ تم حفظ الاختبار المتوقف — يمكنك استئنافه لاحقًا');
  }
  currentMode = mode;
  document.body.classList.toggle('flash', mode === 'flash');
  if (mode !== 'quiz') {
    ALL_Q.forEach(q => q.el.classList.remove('quiz-mode', 'answered', 'grade-correct-mark', 'grade-wrong-mark'));
    applyFilters();
  }
  if (mode === 'flash') { flashIdx = 0; updateFlash(); }
}

function requestStartQuiz(onlyLastWrong=false){
  if (!onlyLastWrong && state.quizSession && state.quizSession.version === 3) {
    showResumeModal();
    return;
  }
  startQuiz(onlyLastWrong);
}

function startQuiz(onlyLastWrong=false){
  let list = onlyLastWrong
    ? (state.lastQuizWrongIds || []).map(questionById).filter(Boolean)
    : filteredItems();
  if (!list.length) {
    alert(onlyLastWrong ? '🎉 لا توجد أخطاء في الاختبار الأخير.' : '⚠️ لا توجد أسئلة مطابقة للفلاتر الحالية.');
    return;
  }

  activeQuizIds = list.map(q => q.id);
  quizAnswers = {};
  quizPausedElapsedMs = 0;
  state.quizScore = {c:0,w:0};
  currentStreak = 0;
  state.streak = 0;
  bestStreak = Math.max(Number(state.bestStreak) || 0, Number(bestStreak) || 0);
  currentMode = 'quiz';
  document.body.classList.remove('flash');
  setQuizLayout(activeQuizIds);
  resetQuizCards();
  document.getElementById('quizResult').classList.remove('show');
  document.getElementById('statTime').textContent = '00:00';
  quizStartTime = Date.now();
  quizStarted = true;
  if (quizTimerId) clearInterval(quizTimerId);
  quizTimerId = setInterval(updateTimeElapsed, 1000);
  setStopButtons(true);
  lockStudyControls(true);
  saveQuizSession();
  updateStats();
  showToast('📝 بدأ الاختبار — ' + activeQuizIds.length + ' سؤال');
}

function updateTimeElapsed(){
  const elapsed = Math.floor(quizElapsedMs()/1000);
  const remaining = activeQuizItems().filter(q => !Object.prototype.hasOwnProperty.call(quizAnswers, q.id)).length;
  const est = remaining * (MATERIAL.kind === 'qa' ? 15 : 20);
  const m = String(Math.floor(elapsed/60)).padStart(2,'0');
  const ss = String(elapsed%60).padStart(2,'0');
  const rm = String(Math.floor(est/60)).padStart(2,'0');
  const rs = String(est%60).padStart(2,'0');
  document.getElementById('statTime').textContent = m+':'+ss + ' ⏳ ' + rm+':'+rs;
}

function checkQuizCompletion(){
  if (!quizStarted) return;
  if (activeQuizIds.length && Object.keys(quizAnswers).length >= activeQuizIds.length) finishQuiz('completed');
}
'''

QUIZ_MCQ = QUIZ_COMMON_START + r'''
function resetQuizCards(){
  activeQuizItems().forEach(q => {
    q.el.classList.remove('answered', 'revealed');
    q.el.querySelectorAll('ol.o li').forEach(li => li.classList.remove('wrong'));
  });
}

function restoreQuizAnswer(q, chosen){
  q.el.classList.add('answered');
  q.el.querySelectorAll('ol.o li').forEach(li => {
    const idx = Number(li.dataset.idx);
    li.classList.remove('wrong');
    li.classList.toggle('correct', idx === q.a);
    if (idx === Number(chosen) && Number(chosen) !== q.a) li.classList.add('wrong');
  });
}

function resumeQuizSession(session, silent=false){
  if (!session || session.version !== 3 || session.material !== MATERIAL.slug) return false;
  activeQuizIds = (session.scopeIds || []).filter(id => questionById(id));
  if (!activeQuizIds.length) { state.quizSession = null; saveState(); return false; }
  quizAnswers = {...(session.answered || {})};
  state.quizScore = session.score || {c:0,w:0};
  currentStreak = Number(session.streak) || 0;
  state.streak = currentStreak;
  bestStreak = Math.max(Number(session.bestStreak)||0, Number(state.bestStreak)||0);
  state.bestStreak = bestStreak;
  quizPausedElapsedMs = Number(session.elapsedMs) || 0;
  currentMode = 'quiz';
  document.body.classList.remove('flash');
  setQuizLayout(activeQuizIds);
  resetQuizCards();
  Object.entries(quizAnswers).forEach(([id, chosen]) => {
    const q = questionById(id); if (q) restoreQuizAnswer(q, chosen);
  });
  quizStartTime = Date.now() - quizPausedElapsedMs;
  quizStarted = true;
  if (quizTimerId) clearInterval(quizTimerId);
  quizTimerId = setInterval(updateTimeElapsed, 1000);
  setStopButtons(true);
  lockStudyControls(true);
  document.getElementById('quizResult').classList.remove('show');
  updateStats(); updateTimeElapsed();
  if (!silent) showToast('▶️ تم استئناف الاختبار من حيث توقفت');
  return true;
}

function finishQuiz(reason='completed'){
  if (quizTimerId) clearInterval(quizTimerId);
  quizTimerId = null;
  quizPausedElapsedMs = quizElapsedMs();
  quizStarted = false;
  currentMode = 'review';
  const wrongIds = activeQuizIds.filter(id => Object.prototype.hasOwnProperty.call(quizAnswers, id) && Number(quizAnswers[id]) !== questionById(id).a);
  state.lastQuizWrongIds = wrongIds;
  state.quizSession = null;
  saveState();
  setStopButtons(false);
  lockStudyControls(false);
  showQuizResult(reason);
  updateStats();
}

function showQuizResult(reason='completed'){
  const c = state.quizScore.c || 0, w = state.quizScore.w || 0;
  const answered = c + w, total = activeQuizIds.length;
  const pct = answered ? Math.round(c/answered*100) : 0;
  document.getElementById('qrScore').textContent = c + ' / ' + answered + '  (' + pct + '%)';
  const elapsed = Math.floor(quizPausedElapsedMs/1000);
  const tm = String(Math.floor(elapsed/60)).padStart(2,'0') + ':' + String(elapsed%60).padStart(2,'0');
  const prefix = reason === 'stopped' ? '⏹ تم إيقاف الاختبار.' : '✅ اكتمل الاختبار.';
  document.getElementById('qrMsg').textContent = `${prefix} أجبت عن ${answered} من ${total} — صحيح ${c}، خطأ ${w}، غير مجاب ${Math.max(0,total-answered)} — الوقت ${tm}.`;
  const review = document.getElementById('qrReview');
  const wrongList = (state.lastQuizWrongIds || []).map(questionById).filter(Boolean);
  review.innerHTML = wrongList.length === 0 ? '<p style="text-align:center;color:var(--ok);font-weight:700">🎉 لا توجد أخطاء في الأسئلة المجابة.</p>' :
    '<h4 style="margin:0 0 8px;color:var(--err)">❌ أخطاء هذا الاختبار:</h4>' + wrongList.map(q => `<div class="qr-review-item"><b>س${q.num}:</b> ${q.q}<span class="ans">✔ الإجابة الصحيحة: ${String.fromCharCode(65+q.a)}) ${q.o[q.a]}</span></div>`).join('');
  document.getElementById('quizResult').classList.add('show');
  document.getElementById('quizResult').scrollIntoView({behavior:'smooth', block:'center'});
}

function stopQuizNow(){ if (currentMode === 'quiz' && quizStarted) finishQuiz('stopped'); }
function retryWrongOnly(){ startQuiz(true); }
'''

QUIZ_QA = QUIZ_COMMON_START + r'''
function resetQuizCards(){
  activeQuizItems().forEach(q => q.el.classList.remove('answered', 'revealed', 'grade-correct-mark', 'grade-wrong-mark'));
}

function restoreQuizAnswer(q, grade){
  q.el.classList.add('answered', 'revealed');
  q.el.classList.add(grade === 'correct' ? 'grade-correct-mark' : 'grade-wrong-mark');
}

function resumeQuizSession(session, silent=false){
  if (!session || session.version !== 3 || session.material !== MATERIAL.slug) return false;
  activeQuizIds = (session.scopeIds || []).filter(id => questionById(id));
  if (!activeQuizIds.length) { state.quizSession = null; saveState(); return false; }
  quizAnswers = {...(session.answered || {})};
  state.quizScore = session.score || {c:0,w:0};
  currentStreak = Number(session.streak) || 0;
  state.streak = currentStreak;
  bestStreak = Math.max(Number(session.bestStreak)||0, Number(state.bestStreak)||0);
  state.bestStreak = bestStreak;
  quizPausedElapsedMs = Number(session.elapsedMs) || 0;
  currentMode = 'quiz';
  document.body.classList.remove('flash');
  setQuizLayout(activeQuizIds);
  resetQuizCards();
  Object.entries(quizAnswers).forEach(([id, grade]) => { const q = questionById(id); if (q) restoreQuizAnswer(q, grade); });
  quizStartTime = Date.now() - quizPausedElapsedMs;
  quizStarted = true;
  if (quizTimerId) clearInterval(quizTimerId);
  quizTimerId = setInterval(updateTimeElapsed, 1000);
  setStopButtons(true);
  lockStudyControls(true);
  document.getElementById('quizResult').classList.remove('show');
  updateStats(); updateTimeElapsed();
  if (!silent) showToast('▶️ تم استئناف الاختبار من حيث توقفت');
  return true;
}

function finishQuiz(reason='completed'){
  if (quizTimerId) clearInterval(quizTimerId);
  quizTimerId = null;
  quizPausedElapsedMs = quizElapsedMs();
  quizStarted = false;
  currentMode = 'review';
  state.lastQuizWrongIds = activeQuizIds.filter(id => quizAnswers[id] === 'wrong');
  state.quizSession = null;
  saveState();
  setStopButtons(false);
  lockStudyControls(false);
  showQuizResult(reason);
  updateStats();
}

function showQuizResult(reason='completed'){
  const c = state.quizScore.c || 0, w = state.quizScore.w || 0;
  const answered = c + w, total = activeQuizIds.length;
  const pct = answered ? Math.round(c/answered*100) : 0;
  document.getElementById('qrScore').textContent = c + ' / ' + answered + '  (' + pct + '%)';
  const elapsed = Math.floor(quizPausedElapsedMs/1000);
  const tm = String(Math.floor(elapsed/60)).padStart(2,'0') + ':' + String(elapsed%60).padStart(2,'0');
  const prefix = reason === 'stopped' ? '⏹ تم إيقاف الاختبار.' : '✅ اكتمل الاختبار.';
  document.getElementById('qrMsg').textContent = `${prefix} قيّمت ${answered} من ${total} — أعرفها ${c}، لا أعرفها ${w}، غير مجاب ${Math.max(0,total-answered)} — الوقت ${tm}.`;
  const review = document.getElementById('qrReview');
  const wrongList = (state.lastQuizWrongIds || []).map(questionById).filter(Boolean);
  review.innerHTML = wrongList.length === 0 ? '<p style="text-align:center;color:var(--ok);font-weight:700">🎉 لا توجد أخطاء في الأسئلة المقيمة.</p>' :
    '<h4 style="margin:0 0 8px;color:var(--err)">❌ أخطاء هذا الاختبار:</h4>' + wrongList.map(q => `<div class="qr-review-item"><b>س${q.num}:</b> ${q.q}<span class="ans">✔ الإجابة: ${q.a}</span></div>`).join('');
  document.getElementById('quizResult').classList.add('show');
  document.getElementById('quizResult').scrollIntoView({behavior:'smooth', block:'center'});
}

function stopQuizNow(){ if (currentMode === 'quiz' && quizStarted) finishQuiz('stopped'); }
function retryWrongOnly(){ startQuiz(true); }
'''

STATS_MCQ = r'''
function updateStats(){
  const total = ALL_Q.length;
  const revealed = Object.keys(state.revealed).filter(k => state.revealed[k] && questionById(k)).length;
  const fav = Object.keys(state.fav).filter(k => state.fav[k] && questionById(k)).length;
  const mastered = Object.keys(state.mastered).filter(k => state.mastered[k] && questionById(k)).length;
  const progress = document.getElementById('statProgress');
  if ((currentMode === 'quiz' || currentMode === 'review') && activeQuizIds.length) {
    progress.textContent = Object.keys(quizAnswers).length + '/' + activeQuizIds.length;
  } else {
    progress.textContent = revealed + '/' + total;
  }
  document.getElementById('statFav').textContent = fav;
  document.getElementById('statMastered').textContent = mastered;
  document.getElementById('progressFill').style.width = (revealed/total*100) + '%';
  document.getElementById('sbFill').style.width = (revealed/total*100) + '%';
  document.getElementById('sbPct').textContent = Math.round(revealed/total*100) + '%';
  document.getElementById('statStreak').textContent = state.streak || 0;
  const c = state.quizScore.c || 0, w = state.quizScore.w || 0;
  document.getElementById('statScore').textContent = (c || w) ? c + ' صح / ' + w + ' خطأ' : '—';
}
'''

STATS_QA = STATS_MCQ.replace("c + ' صح / ' + w + ' خطأ'", "c + ' أعرفها / ' + w + ' لا أعرفها'")

CSV_MCQ = r'''
function exportCSV(onlyFav){
  const list = onlyFav ? ALL_Q.filter(q => state.fav[q.id]) : ALL_Q;
  if (onlyFav && !list.length) { alert('⚠️ لا توجد أسئلة في المفضلة'); return; }
  const maxOptions = Math.max(0, ...list.map(q => q.o.length));
  const headers = Array.from({length:maxOptions}, (_,i) => String.fromCharCode(65+i));
  const rows = [['#','القسم','السؤال',...headers,'الإجابة الصحيحة']];
  list.forEach(item => rows.push([item.num,item.secTitle,item.q,...Array.from({length:maxOptions},(_,i)=>item.o[i]||''),String.fromCharCode(65+item.a)]));
  const csv = '\uFEFF' + rows.map(r => r.map(c => '"' + String(c ?? '').replace(/"/g,'""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href=url; a.download=onlyFav ? MATERIAL.slug+'-favorites.csv' : MATERIAL.slug+'-questions.csv'; a.click(); URL.revokeObjectURL(url);
  showToast('📥 تم تنزيل CSV');
}
'''

CSV_QA = CSV_MCQ.replace("  const maxOptions = Math.max(0, ...list.map(q => q.o.length));\n  const headers = Array.from({length:maxOptions}, (_,i) => String.fromCharCode(65+i));\n  const rows = [['#','القسم','السؤال',...headers,'الإجابة الصحيحة']];\n  list.forEach(item => rows.push([item.num,item.secTitle,item.q,...Array.from({length:maxOptions},(_,i)=>item.o[i]||''),String.fromCharCode(65+item.a)]));", "  const rows = [['#','القسم','السؤال','الإجابة']];\n  list.forEach(item => rows.push([item.num,item.secTitle,item.q,item.a]));").replace("MATERIAL.slug+'-questions.csv'", "MATERIAL.slug+'-questions-answers.csv'")

BACKUP_CODE = r'''
function downloadBackup(){
  const data = {version:6, material:MATERIAL.slug, exported:new Date().toISOString(), state};
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href=url; a.download=MATERIAL.slug+'-backup-'+new Date().toISOString().split('T')[0]+'.json'; a.click(); URL.revokeObjectURL(url);
  showToast('💾 تم تنزيل النسخة الاحتياطية');
}

document.getElementById('restoreConfirm').addEventListener('click', () => {
  const file = document.getElementById('restoreFile').files[0];
  if (!file) { alert('⚠️ اختر ملف JSON أولاً'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.state) throw new Error('ملف غير صالح');
      const sourceMaterial = data.material || data.type || null;
      if (sourceMaterial && sourceMaterial !== MATERIAL.slug) throw new Error('هذه النسخة الاحتياطية تخص مادة أخرى');
      if (!confirm('⚠️ سيتم استبدال كل تقدمك الحالي. متابعة؟')) return;
      localStorage.setItem(LS_KEY, JSON.stringify(data.state));
      alert('✅ تمت الاستعادة بنجاح'); location.reload();
    } catch (err) { alert('❌ فشل قراءة الملف: ' + err.message); }
  };
  reader.readAsText(file);
});
'''


def patch_engine(path, kind):
    text = path.read_text(encoding='utf-8')
    is_qa = kind == 'qa'

    text = replace_once(text, "const QID = (n) => 'q' + n;", "const LEGACY_QID = (n) => 'q' + n;", 'QID')
    text = replace_once(text, "  streak:0, bestStreak:0,\n  quizSession:null", "  streak:0, bestStreak:0,\n  quizSession:null, lastQuizWrongIds:[], stateVersion:3", 'state fields')
    text = replace_once(text, "state.quizScore = state.quizScore || {c:0,w:0};", "state.quizScore = state.quizScore || {c:0,w:0};\nstate.lastQuizWrongIds = Array.isArray(state.lastQuizWrongIds) ? state.lastQuizWrongIds : [];\nbestStreak = Number(state.bestStreak) || 0;", 'state normalization')
    text = replace_once(text, "function saveState(){\n  try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){}\n}\n", "function saveState(){\n  try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){}\n}\n" + COMMON_STATE_HELPERS + "\n", 'state helpers')
    text = replace_once(text, "opt.value = secId; opt.textContent = sec.title;", "opt.value = secId; opt.textContent = (si + 1) + '. ' + sec.title + ' — ' + sec.badge;", 'section option labels')
    text = replace_once(text, "    const qid = QID(qGlobal);", "    const legacyQid = LEGACY_QID(qGlobal);\n    const qid = makeQuestionId(sec, si, item);", 'stable qid')
    text = replace_once(text, "    qDiv.id = qid;", "    qDiv.id = legacyQid;", 'legacy DOM id')
    text = replace_once(text, "      id: qid, num: qGlobal, sec: secId, secTitle: sec.title,", "      id: qid, legacyId: legacyQid, num: qGlobal, sec: secId, secTitle: sec.title, originalSection: section,", 'ALL_Q metadata')
    text = replace_once(text, "/* تطبيق الحالة الأولية */", "migrateLegacyStateIds();\n\n/* تطبيق الحالة الأولية */", 'state migration call')

    if is_qa:
        text = replace_once(text, "  if (gradeBtn) {", "  if (gradeBtn) {\n    if (currentMode !== 'quiz' || !quizStarted) return;", 'qa grade guard')
        text = replace_once(text, "    const isCorrect = gradeBtn.classList.contains('grade-correct');", "    const isCorrect = gradeBtn.classList.contains('grade-correct');\n    if (!activeQuizIds.includes(qid) || Object.prototype.hasOwnProperty.call(quizAnswers, qid)) return;\n    quizAnswers[qid] = isCorrect ? 'correct' : 'wrong';", 'qa answer persistence')
        text = replace_once(text, "    saveState(); updateStats();\n    checkQuizCompletion();", "    saveState(); saveQuizSession(); updateStats();\n    checkQuizCompletion();", 'qa save session')
    else:
        text = replace_once(text, "if (currentMode === 'quiz' && li && !card.classList.contains('answered')) {", "if (currentMode === 'quiz' && quizStarted && li && activeQuizIds.includes(qid) && !card.classList.contains('answered')) {", 'mcq quiz guard')
        text = replace_once(text, "    const correct = item.a;", "    const correct = item.a;\n    quizAnswers[qid] = chosen;", 'mcq answer persistence')
        text = replace_once(text, "    saveState(); updateStats();\n    checkQuizCompletion();", "    saveState(); saveQuizSession(); updateStats();\n    checkQuizCompletion();", 'mcq save session')

    # Replace updateStats only, preserving following showStreakPopup.
    stats_pattern = re.compile(r'function updateStats\(\)\{.*?\n\}\n\n(?=function showStreakPopup)', re.S)
    if not stats_pattern.search(text): raise SystemExit(f'{path}: updateStats not found')
    text = stats_pattern.sub(STATS_QA.strip() + '\n\n', text, count=1)

    # Top bar mode actions.
    text = replace_once(text, "      setMode('study');", "      switchMode('study');", 'study mode')
    text = replace_once(text, "      setMode('quiz');", "      currentMode = 'quiz';", 'quiz set mode')
    text = replace_once(text, "      startQuiz(false);", "      requestStartQuiz(false);", 'quiz request')
    text = replace_once(text, "      setMode('flash');", "      switchMode('flash');", 'flash mode')

    # Remove old setMode section while retaining focus section.
    mode_pattern = re.compile(r'/\* =+\n\s*الأوضاع\n\s*=+ \*/\nfunction setMode\(mode\)\{.*?\n\}\n\n(?=/\* =+\n\s*وضع التركيز)', re.S)
    if not mode_pattern.search(text): raise SystemExit(f'{path}: old setMode section not found')
    text = mode_pattern.sub('', text, count=1)

    # Replace quiz section up to flash cards.
    quiz_title = 'الاختبار الذاتي' if is_qa else 'الاختبار'
    text = replace_section(text, quiz_title, 'البطاقات', QUIZ_QA if is_qa else QUIZ_MCQ)
    text = replace_section(text, 'البطاقات', 'خلط', FLASH_QA if is_qa else FLASH_MCQ)
    text = replace_section(text, 'البحث + الفلترة', 'إعادة الضبط', FILTER_CODE)

    # Reset must clear paused session and last quiz error set when quiz reset is selected.
    text = replace_once(text, "    state.bestStreak = 0;\n  }", "    state.bestStreak = 0;\n    state.quizSession = null;\n    state.lastQuizWrongIds = [];\n  }", 'reset quiz session')

    # CSV and backup sections.
    text = replace_section(text, 'CSV', 'نسخة احتياطية', CSV_QA if is_qa else CSV_MCQ)
    text = replace_section(text, 'نسخة احتياطية', 'رابط مباشر', BACKUP_CODE)

    # Floating and top stop share one function.
    stop_hook = "\nconst topStopQuizBtn = document.getElementById('stopQuizBtn');\nconst floatStopQuizBtn = document.getElementById('stopQuizFloatBtn');\nif (topStopQuizBtn) topStopQuizBtn.addEventListener('click', stopQuizNow);\nif (floatStopQuizBtn) floatStopQuizBtn.addEventListener('click', stopQuizNow);\n"
    marker = "const toBottomBtn = document.getElementById('toBottom');"
    text = replace_once(text, marker, marker + stop_hook, 'stop button hooks')

    # Keyboard quiz answers only while active.
    text = text.replace("if (currentMode === 'quiz' && ['1','2','3','4'].includes(e.key)) {", "if (currentMode === 'quiz' && quizStarted && ['1','2','3','4'].includes(e.key)) {")

    # Replace old beforeunload session saver with v3 saver and initial resume offer.
    old_session_pattern = re.compile(r'/\* =+\n\s*حفظ جلسة الاختبار\n\s*=+ \*/\nwindow\.addEventListener\(\'beforeunload\'.*?\n\}\);\n?', re.S)
    if not old_session_pattern.search(text): raise SystemExit(f'{path}: old beforeunload session block not found')
    new_session = """/* =========================================================\n   حفظ جلسة الاختبار\n   ========================================================= */\nwindow.addEventListener('beforeunload', () => { if (quizStarted) saveQuizSession(); });\nensureResumeModal();\nsetTimeout(() => { if (state.quizSession && !quizStarted) showResumeModal(); }, 250);\n"""
    text = old_session_pattern.sub(new_session, text, count=1)

    # Initial mode should apply filters only after filter controls exist.
    path.write_text(text, encoding='utf-8')


def patch_html(path):
    text = path.read_text(encoding='utf-8')
    old_filter = re.search(r'<div class="filterbar">.*?</div>\n<nav class="index"', text, re.S)
    if not old_filter: raise SystemExit(f'{path}: filterbar not found')
    new_filter = '''<div class="filterbar"><input id="search" type="search" placeholder="🔍 ابحث في الأسئلة أو الخيارات…"><select id="secFilter"><option value="">كل الأقسام</option></select><select id="filterBy"><option value="all">كل الأسئلة</option><option value="wrong">الأخطاء فقط</option><option value="unmastered">غير المتقنة</option><option value="fav">المفضلة فقط</option></select><select id="sortBy"><option value="default">ترتيب رقم السؤال</option><option value="wrong-desc">عدد الأخطاء: الأكثر ← الأقل</option><option value="wrong-asc">عدد الأخطاء: الأقل ← الأكثر</option></select><button id="clearBtn" type="button" style="padding:10px 16px;border-radius:10px;border:0;background:var(--brand);color:#fff;font-family:inherit;cursor:pointer;font-weight:700">مسح</button></div>\n<nav class="index"'''
    text = text[:old_filter.start()] + new_filter + text[old_filter.end():]
    text = text.replace('🔁 أعد الأخطاء فقط', '🔁 أعد أخطاء هذا الاختبار')
    text = text.replace('<div class="scroll-btns"><button id="toTop"', '<div class="scroll-btns"><button id="stopQuizFloatBtn" title="إيقاف الاختبار" style="display:none">⏹</button><button id="toTop"')
    text = re.sub(r'<script src="\.\./assets/runtime-fixes\.js"></script>', '', text)
    path.write_text(text, encoding='utf-8')


patch_engine(ROOT / 'assets/mcq-engine.js', 'mcq')
patch_engine(ROOT / 'assets/qa-engine.js', 'qa')
for html in (ROOT / 'materials').glob('*.html'):
    patch_html(html)

runtime = ROOT / 'assets/runtime-fixes.js'
if runtime.exists(): runtime.unlink()

# Extra CSS for disabled controls and floating stop button.
css = ROOT / 'assets/styles.css'
css_text = css.read_text(encoding='utf-8')
extra = r'''

/* Quiz/filter state refinements */
.filterbar :disabled, .topbar button:disabled { opacity:.5; cursor:not-allowed; }
#stopQuizFloatBtn { background:var(--err,#dc2626); color:#fff; font-weight:900; }
#resumeQuizModal .modal-card p { line-height:1.9; }
#sorted-results > .sec-title { position:sticky; top:58px; z-index:3; }
'''
if 'Quiz/filter state refinements' not in css_text:
    css.write_text(css_text + extra, encoding='utf-8')

print('Study engines refactored successfully.')
