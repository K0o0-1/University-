#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, text):
    (ROOT / path).write_text(text, encoding='utf-8')

def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Missing pattern: {label}')
    return text.replace(old, new, 1)

def patch_engine(path, kind):
    text = read(path)

    text = must_replace(
        text,
        "let resumeModalShownForSession = false;\n",
        "let resumeModalShownForSession = false;\nlet quizKind = 'practice';\nlet activeQuizConfig = {};\n",
        f"{path}: quiz vars"
    )

    text = must_replace(
        text,
        "    material: MATERIAL.slug,\n",
        "    material: MATERIAL.slug,\n    quizKind,\n    config: {...activeQuizConfig},\n",
        f"{path}: session mode"
    )

    old_start = """function startQuiz(onlyLastWrong=false){
  let list = onlyLastWrong
    ? (state.lastQuizWrongIds || []).map(questionById).filter(Boolean)
    : filteredItems();
"""
    new_start = """function startQuiz(onlyLastWrong=false, config={}){
  let list = onlyLastWrong
    ? (state.lastQuizWrongIds || []).map(questionById).filter(Boolean)
    : (Array.isArray(config.scopeIds) ? config.scopeIds.map(questionById).filter(Boolean) : filteredItems());
  quizKind = config.mode === 'exam' ? 'exam' : 'practice';
  activeQuizConfig = {...config, mode:quizKind};
"""
    text = must_replace(text, old_start, new_start, f"{path}: startQuiz signature")

    text = must_replace(
        text,
        "  currentMode = 'quiz';\n  document.body.classList.remove('flash');\n",
        "  currentMode = 'quiz';\n  document.body.classList.remove('flash');\n  document.body.classList.toggle('exam-mode', quizKind === 'exam');\n  document.body.classList.toggle('practice-mode', quizKind === 'practice');\n",
        f"{path}: start mode classes"
    )

    text = must_replace(
        text,
        "  showToast('📝 بدأ الاختبار — ' + activeQuizIds.length + ' سؤال');\n}\n",
        "  showToast((quizKind === 'exam' ? '📝 بدأ الامتحان — ' : '🧠 بدأ التدريب — ') + activeQuizIds.length + ' سؤال');\n  window.StudyV2?.onQuizStarted?.({ids:[...activeQuizIds], mode:quizKind, config:{...activeQuizConfig}});\n}\n",
        f"{path}: start callback"
    )

    text = must_replace(
        text,
        "  bestStreak = Math.max(Number(session.bestStreak)||0, Number(state.bestStreak)||0);\n  state.bestStreak = bestStreak;\n  quizPausedElapsedMs = Number(session.elapsedMs) || 0;\n",
        "  bestStreak = Math.max(Number(session.bestStreak)||0, Number(state.bestStreak)||0);\n  state.bestStreak = bestStreak;\n  quizKind = session.quizKind === 'exam' ? 'exam' : 'practice';\n  activeQuizConfig = session.config || {mode:quizKind};\n  quizPausedElapsedMs = Number(session.elapsedMs) || 0;\n",
        f"{path}: resume mode restore"
    )

    marker = "  quizPausedElapsedMs = Number(session.elapsedMs) || 0;\n  currentMode = 'quiz';\n  document.body.classList.remove('flash');\n"
    repl = "  quizPausedElapsedMs = Number(session.elapsedMs) || 0;\n  currentMode = 'quiz';\n  document.body.classList.remove('flash');\n  document.body.classList.toggle('exam-mode', quizKind === 'exam');\n  document.body.classList.toggle('practice-mode', quizKind === 'practice');\n"
    text = must_replace(text, marker, repl, f"{path}: resume mode classes")

    text = must_replace(
        text,
        "  if (!silent) showToast('▶️ تم استئناف الاختبار من حيث توقفت');\n  return true;\n}\n",
        "  window.StudyV2?.onQuizStarted?.({ids:[...activeQuizIds], mode:quizKind, config:{...activeQuizConfig}, resumed:true});\n  if (!silent) showToast('▶️ تم استئناف الاختبار من حيث توقفت');\n  return true;\n}\n",
        f"{path}: resume callback"
    )

    if kind == 'mcq':
        old_stats = """  document.getElementById('statStreak').textContent = state.streak || 0;
  const c = state.quizScore.c || 0, w = state.quizScore.w || 0;
  document.getElementById('statScore').textContent = (c || w) ? c + ' صح / ' + w + ' خطأ' : '—';
"""
        new_stats = """  const examRunning = currentMode === 'quiz' && quizStarted && quizKind === 'exam';
  document.getElementById('statStreak').textContent = examRunning ? '—' : (state.streak || 0);
  const c = state.quizScore.c || 0, w = state.quizScore.w || 0;
  document.getElementById('statScore').textContent = examRunning ? 'مخفي' : ((c || w) ? c + ' صح / ' + w + ' خطأ' : '—');
"""
    else:
        old_stats = """  document.getElementById('statStreak').textContent = state.streak || 0;
  const c = state.quizScore.c || 0, w = state.quizScore.w || 0;
  document.getElementById('statScore').textContent = (c || w) ? c + ' أعرفها / ' + w + ' لا أعرفها' : '—';
"""
        new_stats = """  const examRunning = currentMode === 'quiz' && quizStarted && quizKind === 'exam';
  document.getElementById('statStreak').textContent = examRunning ? '—' : (state.streak || 0);
  const c = state.quizScore.c || 0, w = state.quizScore.w || 0;
  document.getElementById('statScore').textContent = examRunning ? 'مخفي' : ((c || w) ? c + ' أعرفها / ' + w + ' لا أعرفها' : '—');
"""
    text = must_replace(text, old_stats, new_stats, f"{path}: exam stats")

    if kind == 'mcq':
        text = must_replace(
            text,
            "    quizAnswers[qid] = chosen;\n    card.classList.add('answered');\n",
            "    quizAnswers[qid] = chosen;\n    card.classList.add('answered');\n    if (quizKind === 'exam') li.classList.add('exam-choice');\n",
            f"{path}: exam selected"
        )

        text = must_replace(
            text,
            "      showStreakPopup(currentStreak);\n      beep(880, 0.1);\n",
            "      if (quizKind !== 'exam') { showStreakPopup(currentStreak); beep(880, 0.1); }\n",
            f"{path}: correct feedback"
        )
        text = must_replace(
            text,
            "      beep(220, 0.2);\n",
            "      if (quizKind !== 'exam') beep(220, 0.2);\n",
            f"{path}: wrong feedback"
        )

        text = must_replace(
            text,
            "    saveState(); saveQuizSession(); updateStats();\n    checkQuizCompletion();\n",
            "    saveState(); saveQuizSession(); updateStats();\n    window.StudyV2?.onAnswer?.({id:qid, correct:chosen === correct, chosen, mode:quizKind});\n    checkQuizCompletion();\n",
            f"{path}: answer callback"
        )

        text = must_replace(
            text,
            "    q.el.querySelectorAll('ol.o li').forEach(li => li.classList.remove('wrong'));\n",
            "    q.el.querySelectorAll('ol.o li').forEach(li => li.classList.remove('wrong', 'exam-choice'));\n",
            f"{path}: reset exam choice"
        )

        text = must_replace(
            text,
            "    if (idx === Number(chosen) && Number(chosen) !== q.a) li.classList.add('wrong');\n",
            "    if (idx === Number(chosen) && Number(chosen) !== q.a) li.classList.add('wrong');\n    if (quizKind === 'exam' && idx === Number(chosen)) li.classList.add('exam-choice');\n",
            f"{path}: restore exam choice"
        )
    else:
        text = must_replace(
            text,
            "  if (showBtn) {\n    const card = showBtn.closest('.q');\n",
            "  if (showBtn) {\n    if (currentMode === 'quiz' && quizKind === 'exam') { e.stopPropagation(); return; }\n    const card = showBtn.closest('.q');\n",
            f"{path}: block exam reveal"
        )
        text = must_replace(
            text,
            "      showStreakPopup(currentStreak);\n      beep(880, 0.1);\n",
            "      if (quizKind !== 'exam') { showStreakPopup(currentStreak); beep(880, 0.1); }\n",
            f"{path}: qa correct feedback"
        )
        text = must_replace(
            text,
            "      beep(220, 0.2);\n",
            "      if (quizKind !== 'exam') beep(220, 0.2);\n",
            f"{path}: qa wrong feedback"
        )
        text = must_replace(
            text,
            "    saveState(); saveQuizSession(); updateStats();\n    checkQuizCompletion();\n",
            "    saveState(); saveQuizSession(); updateStats();\n    window.StudyV2?.onAnswer?.({id:qid, correct:isCorrect, grade:isCorrect ? 'correct' : 'wrong', mode:quizKind});\n    checkQuizCompletion();\n",
            f"{path}: qa answer callback"
        )

    finish_pattern = re.compile(r"function finishQuiz\(reason='completed'\)\{.*?\n\}\n\nfunction showQuizResult", re.S)
    m = finish_pattern.search(text)
    if not m:
        raise SystemExit(f'Missing finishQuiz function: {path}')
    if kind == 'mcq':
        finish_body = """function finishQuiz(reason='completed'){
  if (quizTimerId) clearInterval(quizTimerId);
  quizTimerId = null;
  quizPausedElapsedMs = quizElapsedMs();
  quizStarted = false;
  currentMode = 'review';
  const wrongIds = activeQuizIds.filter(id => Object.prototype.hasOwnProperty.call(quizAnswers, id) && Number(quizAnswers[id]) !== questionById(id).a);
  state.lastQuizWrongIds = wrongIds;
  const c = state.quizScore.c || 0, w = state.quizScore.w || 0;
  const answered = c + w, total = activeQuizIds.length;
  const result = {
    id:'quiz-' + Date.now() + '-' + Math.random().toString(36).slice(2,7),
    at:new Date().toISOString(), material:MATERIAL.slug, mode:quizKind, reason,
    total, answered, correct:c, wrong:w, unanswered:Math.max(0,total-answered),
    percent:answered ? Math.round(c/answered*100) : 0,
    elapsedMs:quizPausedElapsedMs,
    avgMs:answered ? Math.round(quizPausedElapsedMs/answered) : 0,
    wrongIds:[...wrongIds], scopeIds:[...activeQuizIds], config:{...activeQuizConfig}
  };
  state.quizSession = null;
  saveState();
  setStopButtons(false);
  lockStudyControls(false);
  document.body.classList.remove('exam-mode', 'practice-mode');
  showQuizResult(reason);
  updateStats();
  window.StudyV2?.onQuizFinished?.(result);
}

function showQuizResult"""
    else:
        finish_body = """function finishQuiz(reason='completed'){
  if (quizTimerId) clearInterval(quizTimerId);
  quizTimerId = null;
  quizPausedElapsedMs = quizElapsedMs();
  quizStarted = false;
  currentMode = 'review';
  const wrongIds = activeQuizIds.filter(id => quizAnswers[id] === 'wrong');
  state.lastQuizWrongIds = wrongIds;
  const c = state.quizScore.c || 0, w = state.quizScore.w || 0;
  const answered = c + w, total = activeQuizIds.length;
  const result = {
    id:'quiz-' + Date.now() + '-' + Math.random().toString(36).slice(2,7),
    at:new Date().toISOString(), material:MATERIAL.slug, mode:quizKind, reason,
    total, answered, correct:c, wrong:w, unanswered:Math.max(0,total-answered),
    percent:answered ? Math.round(c/answered*100) : 0,
    elapsedMs:quizPausedElapsedMs,
    avgMs:answered ? Math.round(quizPausedElapsedMs/answered) : 0,
    wrongIds:[...wrongIds], scopeIds:[...activeQuizIds], config:{...activeQuizConfig}
  };
  state.quizSession = null;
  saveState();
  setStopButtons(false);
  lockStudyControls(false);
  if (quizKind === 'exam') activeQuizItems().forEach(q => q.el.classList.add('revealed'));
  document.body.classList.remove('exam-mode', 'practice-mode');
  showQuizResult(reason);
  updateStats();
  window.StudyV2?.onQuizFinished?.(result);
}

function showQuizResult"""
    text = text[:m.start()] + finish_body + text[m.end():]

    text = must_replace(
        text,
        "function retryWrongOnly(){ startQuiz(true); }\n",
        "function retryWrongOnly(){ startQuiz(true, {mode:'practice', source:'last-wrong'}); }\n",
        f"{path}: retry mode"
    )

    text = must_replace(
        text,
        "function openStatsModal(){\n",
        "function openStatsModal(){\n  if (window.StudyV2?.openStatsPage) { window.StudyV2.openStatsPage(); return; }\n",
        f"{path}: stats delegation"
    )

    text = must_replace(
        text,
        "  if (mode === 'flash') { flashIdx = 0; updateFlash(); }\n}\n",
        "  if (mode === 'flash') { flashIdx = 0; updateFlash(); }\n  window.StudyV2?.onModeChanged?.(mode);\n}\n",
        f"{path}: mode callback"
    )

    api_kind = "'mcq'" if kind == 'mcq' else "'qa'"
    api = f"""
/* =========================================================
   Study V2 public API
   ========================================================= */
window.StudyEngine = {{
  kind:{api_kind},
  material:MATERIAL,
  sections:SECTIONS,
  state,
  saveState,
  allQuestions:() => ALL_Q,
  filteredItems,
  questionById,
  startCustomQuiz:(config={{}}) => startQuiz(false, config),
  showResumeModal,
  switchMode,
  updateStats,
  applyFilters,
  showToast,
  getActiveQuizIds:() => [...activeQuizIds],
  getQuizAnswers:() => ({{...quizAnswers}}),
  getCurrentMode:() => currentMode,
  getQuizKind:() => quizKind,
  getQuizConfig:() => ({{...activeQuizConfig}})
}};

"""
    text = must_replace(
        text,
        "/* =========================================================\n   PWA\n   ========================================================= */\n",
        api + "/* =========================================================\n   PWA\n   ========================================================= */\n",
        f"{path}: StudyEngine API"
    )

    write(path, text)

patch_engine('assets/mcq-engine.js', 'mcq')
patch_engine('assets/qa-engine.js', 'qa')

study_v2 = r"""(function(){
  'use strict';
  const engine = window.StudyEngine;
  if (!engine) { console.warn('Study V2: engine API missing'); return; }

  const state = engine.state;
  const material = engine.material || {};
  const sections = engine.sections || [];
  const kind = engine.kind;

  state.reviewFlags = state.reviewFlags || {};
  state.questionStats = state.questionStats || {};
  state.quizHistory = Array.isArray(state.quizHistory) ? state.quizHistory : [];

  function persist(){ engine.saveState(); }
  function questions(){ return engine.allQuestions(); }
  function qById(id){ return engine.questionById(id); }

  questions().forEach(q => {
    if (!state.questionStats[q.id]) {
      const correct = Number(state.correct?.[q.id]) || 0;
      const wrong = Number(state.wrong?.[q.id]) || 0;
      if (correct || wrong) {
        state.questionStats[q.id] = {
          attempts: correct + wrong, correct, wrong,
          recent: [], lastAt:null, lastResult:null
        };
      }
    }
  });
  persist();

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDuration = (ms) => {
    const sec = Math.max(0, Math.round((Number(ms)||0)/1000));
    const m = Math.floor(sec/60), s = sec%60;
    return String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  };
  const modeLabel = (m) => m === 'exam' ? 'امتحان' : 'تدريب';

  function recFor(q){
    return state.questionStats[q.id] || {
      attempts:(Number(state.correct?.[q.id])||0) + (Number(state.wrong?.[q.id])||0),
      correct:Number(state.correct?.[q.id])||0,
      wrong:Number(state.wrong?.[q.id])||0,
      recent:[], lastAt:null, lastResult:null
    };
  }

  function mastery(q){
    if (state.mastered?.[q.id]) return {key:'mastered', label:'🟢 متقن', rank:4};
    const r = recFor(q);
    if (!r.attempts) return {key:'untried', label:'⚪ غير مجرب', rank:0};
    const recent = Array.isArray(r.recent) ? r.recent : [];
    const last3 = recent.slice(-3);
    const acc = r.attempts ? r.correct / r.attempts : 0;
    if (last3.length >= 3 && last3.every(Boolean)) return {key:'mastered', label:'🟢 متقن', rank:4};
    if (acc >= .70) return {key:'average', label:'🟡 متوسط', rank:3};
    if (acc >= .50) return {key:'review', label:'🟠 يحتاج مراجعة', rank:2};
    return {key:'weak', label:'🔴 ضعيف', rank:1};
  }

  function weaknessScore(q){
    const r = recFor(q);
    if (!r.attempts && !(state.wrong?.[q.id] > 0)) return 0;
    const recent = Array.isArray(r.recent) ? r.recent : [];
    let tailCorrect = 0;
    for (let i = recent.length - 1; i >= 0 && recent[i]; i--) tailCorrect++;
    let score = (Number(r.wrong)||0) * 3 + (r.lastResult === 'wrong' ? 3 : 0) - tailCorrect;
    if (state.mastered?.[q.id]) score -= 5;
    return Math.max(0, score);
  }

  function weakQuestions(){
    return questions()
      .map(q => ({q, score:weaknessScore(q), level:mastery(q)}))
      .filter(x => x.score > 0 || x.level.key === 'weak' || x.level.key === 'review')
      .sort((a,b) => b.score - a.score || a.q.num - b.q.num)
      .map(x => x.q);
  }

  function recordAttempt(id, correct){
    const q = qById(id);
    if (!q) return;
    const old = recFor(q);
    const recent = Array.isArray(old.recent) ? old.recent.slice(-4) : [];
    recent.push(!!correct);
    state.questionStats[id] = {
      attempts:(Number(old.attempts)||0) + 1,
      correct:(Number(old.correct)||0) + (correct ? 1 : 0),
      wrong:(Number(old.wrong)||0) + (correct ? 0 : 1),
      recent,
      lastAt:new Date().toISOString(),
      lastResult:correct ? 'correct' : 'wrong'
    };
    persist();
  }

  function ensureResultMetrics(){
    let box = document.getElementById('qrMetrics');
    if (box) return box;
    box = document.createElement('div');
    box.id = 'qrMetrics';
    box.className = 'result-metrics';
    const score = document.getElementById('qrScore');
    score?.insertAdjacentElement('afterend', box);
    return box;
  }

  function renderQuizResult(result){
    const box = ensureResultMetrics();
    const cards = [
      ['الوضع', modeLabel(result.mode)],
      ['الأسئلة', result.total],
      ['المجاب', result.answered],
      ['غير المجاب', result.unanswered],
      [kind === 'qa' ? 'أعرفها' : 'الصحيح', result.correct],
      [kind === 'qa' ? 'لا أعرفها' : 'الخطأ', result.wrong],
      ['النسبة', result.percent + '%'],
      ['الوقت', fmtDuration(result.elapsedMs)],
      ['متوسط السؤال', result.answered ? fmtDuration(result.avgMs) : '—']
    ];
    box.innerHTML = cards.map(([k,v]) => `<div class="result-metric"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
  }

  function onAnswer(payload){
    recordAttempt(payload.id, !!payload.correct);
    refreshNavigator();
  }

  function onQuizFinished(result){
    if (!state.quizHistory.some(x => x.id === result.id)) {
      state.quizHistory.unshift(result);
      state.quizHistory = state.quizHistory.slice(0, 20);
      persist();
    }
    renderQuizResult(result);
    refreshNavigator(true);
  }

  function ensureQuizSetup(){
    if (document.getElementById('quizSetupModal')) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'quizSetupModal';
    modal.innerHTML = `
      <div class="modal-card quiz-setup-card">
        <h3>🎯 إعداد الاختبار</h3>
        <div class="quiz-setup-grid">
          <label>الوضع
            <select id="quizSetupMode">
              <option value="practice">🧠 تدريب — التصحيح فوري</option>
              <option value="exam">📝 امتحان — النتيجة في النهاية</option>
            </select>
          </label>
          <label>القسم
            <select id="quizSetupSection"><option value="">كل الأقسام</option></select>
          </label>
          <label>مصدر الأسئلة
            <select id="quizSetupSource">
              <option value="all">كل أسئلة النطاق</option>
              <option value="filtered">النتائج المفلترة حاليًا</option>
              <option value="weak">نقاط الضعف فقط</option>
            </select>
          </label>
          <label>عدد الأسئلة
            <select id="quizSetupCount">
              <option value="10">10</option><option value="20">20</option>
              <option value="30">30</option><option value="50">50</option>
              <option value="100">100</option><option value="all" selected>الكل</option>
            </select>
          </label>
          <label>الترتيب
            <select id="quizSetupOrder">
              <option value="original">ترتيب الأسئلة</option>
              <option value="random">🔀 عشوائي</option>
            </select>
          </label>
        </div>
        <p class="quiz-setup-note" id="quizSetupNote"></p>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" id="quizSetupCancel">إلغاء</button>
          <button type="button" class="btn-primary" id="quizSetupStart">ابدأ</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const sec = modal.querySelector('#quizSetupSection');
    sections.forEach((s,i) => {
      const opt = document.createElement('option');
      opt.value = 'sec' + (i+1);
      opt.textContent = (i+1) + '. ' + s.title + ' — ' + s.badge;
      sec.appendChild(opt);
    });
    modal.querySelector('#quizSetupCancel').addEventListener('click', () => modal.classList.remove('show'));
    modal.querySelector('#quizSetupMode').addEventListener('change', updateQuizSetupNote);
    modal.querySelector('#quizSetupStart').addEventListener('click', startFromSetup);
  }

  function updateQuizSetupNote(){
    const mode = document.getElementById('quizSetupMode')?.value || 'practice';
    const note = document.getElementById('quizSetupNote');
    if (!note) return;
    if (mode === 'exam') {
      note.textContent = kind === 'qa'
        ? 'في Q&A: قيّم نفسك أعرفها/لا أعرفها بدون كشف الإجابة، ثم تظهر الإجابات بعد الإنهاء.'
        : 'في الامتحان لن يظهر الصح أو الخطأ أثناء الحل، وستظهر النتيجة بعد الإنهاء.';
    } else {
      note.textContent = kind === 'qa'
        ? 'في التدريب يمكنك كشف الإجابة ثم تقييم نفسك، ويُسجّل تقدمك فورًا.'
        : 'في التدريب يظهر التصحيح مباشرة بعد كل إجابة.';
    }
  }

  function openQuizSetup(mode='practice'){
    if (state.quizSession) {
      engine.showResumeModal();
      return;
    }
    ensureQuizSetup();
    document.getElementById('quizSetupMode').value = mode === 'exam' ? 'exam' : 'practice';
    updateQuizSetupNote();
    document.getElementById('quizSetupModal').classList.add('show');
  }

  function shuffleCopy(arr){
    const out = arr.slice();
    for (let i=out.length-1;i>0;i--) {
      const j = Math.floor(Math.random()*(i+1));
      [out[i],out[j]] = [out[j],out[i]];
    }
    return out;
  }

  function startFromSetup(){
    const mode = document.getElementById('quizSetupMode').value;
    const section = document.getElementById('quizSetupSection').value;
    const source = document.getElementById('quizSetupSource').value;
    const countVal = document.getElementById('quizSetupCount').value;
    const order = document.getElementById('quizSetupOrder').value;

    let pool = source === 'filtered' ? engine.filteredItems() : source === 'weak' ? weakQuestions() : questions();
    if (section) pool = pool.filter(q => q.sec === section);
    if (order === 'random') pool = shuffleCopy(pool);
    const requested = countVal === 'all' ? pool.length : Number(countVal);
    if (Number.isFinite(requested) && requested > 0) pool = pool.slice(0, requested);
    if (!pool.length) {
      engine.showToast(source === 'weak' ? '🎉 لا توجد نقاط ضعف في هذا النطاق' : '⚠️ لا توجد أسئلة في هذا النطاق');
      return;
    }

    const sectionLabel = section
      ? document.querySelector(`#quizSetupSection option[value="${section}"]`)?.textContent || section
      : 'كل الأقسام';

    document.getElementById('quizSetupModal').classList.remove('show');
    engine.startCustomQuiz({
      mode,
      scopeIds:pool.map(q => q.id),
      section,
      sectionLabel,
      source,
      order,
      requestedCount:countVal
    });
  }

  function installModeButtons(){
    const old = document.querySelector('[data-action="mode-quiz"]');
    if (!old) return;
    const practice = document.createElement('button');
    practice.type = 'button';
    practice.dataset.action = 'mode-practice-v2';
    practice.textContent = '🧠 تدريب';
    const exam = document.createElement('button');
    exam.type = 'button';
    exam.dataset.action = 'mode-exam-v2';
    exam.textContent = '📝 امتحان';
    old.replaceWith(practice, exam);
    practice.addEventListener('click', () => openQuizSetup('practice'));
    exam.addEventListener('click', () => openQuizSetup('exam'));
  }

  function syncModeButtons(mode){
    document.querySelectorAll('.topbar button[data-action^="mode-"]').forEach(b => b.classList.remove('active'));
    if (mode === 'exam' || mode === 'practice') {
      document.querySelector(`[data-action="mode-${mode}-v2"]`)?.classList.add('active');
    } else if (mode === 'study') {
      document.querySelector('[data-action="mode-study"]')?.classList.add('active');
    } else if (mode === 'flash') {
      document.querySelector('[data-action="mode-flash"]')?.classList.add('active');
    }
  }

  function ensureNavigator(){
    if (document.getElementById('quizNavigator')) return;
    const topbar = document.querySelector('.topbar');
    const navBtn = document.createElement('button');
    navBtn.id = 'quizNavBtn';
    navBtn.type = 'button';
    navBtn.textContent = '🧭 الأسئلة';
    navBtn.style.display = 'none';
    const stop = document.getElementById('stopQuizBtn');
    if (stop?.parentNode) stop.insertAdjacentElement('afterend', navBtn);
    else topbar?.appendChild(navBtn);

    const panel = document.createElement('aside');
    panel.id = 'quizNavigator';
    panel.className = 'quiz-navigator';
    panel.innerHTML = `
      <div class="quiz-nav-head"><b>🧭 التنقل في الاختبار</b><button type="button" id="quizNavClose">✖</button></div>
      <div class="quiz-nav-legend"><span>● مجاب</span><span>🚩 مراجعة</span><span>○ غير مجاب</span></div>
      <div class="quiz-nav-grid" id="quizNavGrid"></div>`;
    document.body.appendChild(panel);

    navBtn.addEventListener('click', () => panel.classList.toggle('show'));
    panel.querySelector('#quizNavClose').addEventListener('click', () => panel.classList.remove('show'));
    panel.querySelector('#quizNavGrid').addEventListener('click', e => {
      const b = e.target.closest('button[data-qid]');
      if (!b) return;
      qById(b.dataset.qid)?.el.scrollIntoView({behavior:'smooth', block:'center'});
      panel.classList.remove('show');
    });
  }

  function installReviewButtons(){
    questions().forEach(q => {
      const actions = q.el.querySelector('.qactions');
      if (!actions || actions.querySelector('.btn-review')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-review';
      b.title = 'راجع لاحقًا';
      b.textContent = '🚩';
      b.classList.toggle('on', !!state.reviewFlags[q.id]);
      actions.prepend(b);
    });
    document.addEventListener('click', e => {
      const b = e.target.closest('.btn-review');
      if (!b) return;
      const card = b.closest('.q');
      if (!card) return;
      const id = card.dataset.qid;
      state.reviewFlags[id] = !state.reviewFlags[id];
      b.classList.toggle('on', !!state.reviewFlags[id]);
      persist();
      refreshNavigator();
    });
  }

  function refreshNavigator(review=false){
    ensureNavigator();
    const ids = engine.getActiveQuizIds();
    const answers = engine.getQuizAnswers();
    const btn = document.getElementById('quizNavBtn');
    if (btn) btn.style.display = ids.length ? 'inline-flex' : 'none';
    const grid = document.getElementById('quizNavGrid');
    if (!grid) return;
    grid.innerHTML = ids.map(id => {
      const q = qById(id);
      if (!q) return '';
      let cls = [];
      const answered = Object.prototype.hasOwnProperty.call(answers,id);
      if (answered) cls.push('answered');
      if (state.reviewFlags[id]) cls.push('flagged');
      if (review && answered) {
        const ok = kind === 'qa' ? answers[id] === 'correct' : Number(answers[id]) === q.a;
        cls.push(ok ? 'nav-correct' : 'nav-wrong');
      }
      return `<button type="button" class="${cls.join(' ')}" data-qid="${esc(id)}" title="سؤال ${q.num}">${q.num}${state.reviewFlags[id] ? ' 🚩' : ''}</button>`;
    }).join('');
  }

  function onQuizStarted(ctx){
    syncModeButtons(ctx.mode);
    refreshNavigator(false);
    document.getElementById('quizNavBtn').style.display = 'inline-flex';
  }

  function onModeChanged(mode){
    syncModeButtons(mode);
    if (mode !== 'quiz' && mode !== 'review') {
      document.getElementById('quizNavBtn')?.style.setProperty('display','none');
      document.getElementById('quizNavigator')?.classList.remove('show');
    }
  }

  function ensureStatsPage(){
    if (document.getElementById('statsPageModal')) return;
    const modal = document.createElement('div');
    modal.className = 'modal stats-page-modal';
    modal.id = 'statsPageModal';
    modal.innerHTML = `
      <div class="modal-card stats-page-card">
        <div class="stats-page-head"><h3>📊 الإحصائيات والتقدم</h3><button type="button" id="statsPageClose">✖</button></div>
        <div id="statsPageContent"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#statsPageClose').addEventListener('click', () => modal.classList.remove('show'));
    modal.addEventListener('click', e => {
      const b = e.target.closest('[data-jump-qid]');
      if (!b) return;
      modal.classList.remove('show');
      qById(b.dataset.jumpQid)?.el.scrollIntoView({behavior:'smooth', block:'center'});
    });
  }

  function sectionStats(){
    return sections.map((s,i) => {
      const sec = 'sec' + (i+1);
      const list = questions().filter(q => q.sec === sec);
      let attempts=0, correct=0, wrong=0, mastered=0, weak=0;
      list.forEach(q => {
        const r = recFor(q);
        attempts += Number(r.attempts)||0;
        correct += Number(r.correct)||0;
        wrong += Number(r.wrong)||0;
        const m = mastery(q);
        if (m.key === 'mastered') mastered++;
        if (m.key === 'weak' || m.key === 'review') weak++;
      });
      return {
        label:(i+1)+'. '+s.title+' — '+s.badge,
        total:list.length, attempts, correct, wrong,
        accuracy:attempts ? Math.round(correct/attempts*100) : 0,
        mastered, weak
      };
    });
  }

  function openStatsPage(){
    ensureStatsPage();
    const list = questions();
    const history = state.quizHistory || [];
    const studied = list.filter(q => state.revealed?.[q.id]).length;
    const smartMastered = list.filter(q => mastery(q).key === 'mastered').length;
    const weakList = weakQuestions().slice(0,10);
    const avg = history.length ? Math.round(history.reduce((s,h)=>s+(Number(h.percent)||0),0)/history.length) : 0;
    const best = history.length ? Math.max(...history.map(h=>Number(h.percent)||0)) : 0;
    const trend = history.slice(0,5).reverse().map(h => h.percent + '%').join(' → ') || 'لا توجد اختبارات بعد';

    const summary = [
      ['تمت الدراسة', `${studied}/${list.length}`],
      ['الإتقان الذكي', `${smartMastered}/${list.length}`],
      ['نقاط الضعف', weakList.length],
      ['عدد الاختبارات', history.length],
      ['متوسط النتائج', avg + '%'],
      ['أفضل نتيجة', best + '%']
    ].map(([k,v]) => `<div class="analytics-card"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');

    const secRows = sectionStats().map(s => `
      <tr><td>${esc(s.label)}</td><td>${s.total}</td><td>${s.attempts}</td><td>${s.accuracy}%</td><td>${s.mastered}</td><td>${s.weak}</td></tr>`).join('');

    const weakHtml = weakList.length ? weakList.map(q => {
      const r = recFor(q), m = mastery(q);
      const acc = r.attempts ? Math.round(r.correct/r.attempts*100) : 0;
      return `<button type="button" class="weak-item" data-jump-qid="${esc(q.id)}"><span><b>س${q.num}</b> ${esc(q.q)}</span><small>${m.label} • محاولات ${r.attempts} • دقة ${acc}% • أخطاء ${r.wrong}</small></button>`;
    }).join('') : '<p class="analytics-empty">🎉 لا توجد نقاط ضعف مسجلة حاليًا.</p>';

    const histRows = history.length ? history.map(h => `
      <tr><td>${new Date(h.at).toLocaleString('ar')}</td><td>${modeLabel(h.mode)}</td><td>${esc(h.config?.sectionLabel || 'كل الأقسام')}</td><td>${h.answered}/${h.total}</td><td>${h.percent}%</td><td>${fmtDuration(h.elapsedMs)}</td></tr>`).join('')
      : '<tr><td colspan="6">لا يوجد سجل اختبارات حتى الآن.</td></tr>';

    document.getElementById('statsPageContent').innerHTML = `
      <section class="analytics-section"><h4>ملخص المادة</h4><div class="analytics-grid">${summary}</div><p class="analytics-trend">آخر النتائج: ${esc(trend)}</p></section>
      <section class="analytics-section"><h4>إحصائيات كل قسم</h4><div class="table-scroll"><table class="analytics-table"><thead><tr><th>القسم</th><th>الأسئلة</th><th>المحاولات</th><th>الدقة</th><th>متقن</th><th>ضعف</th></tr></thead><tbody>${secRows}</tbody></table></div></section>
      <section class="analytics-section"><h4>أهم نقاط الضعف</h4><div class="weak-list">${weakHtml}</div></section>
      <section class="analytics-section"><h4>آخر الاختبارات</h4><div class="table-scroll"><table class="analytics-table"><thead><tr><th>التاريخ</th><th>الوضع</th><th>النطاق</th><th>المجاب</th><th>النتيجة</th><th>الوقت</th></tr></thead><tbody>${histRows}</tbody></table></div></section>`;
    document.getElementById('statsPageModal').classList.add('show');
  }

  const statsBtn = document.querySelector('[data-action="stats"]');
  statsBtn?.addEventListener('click', e => {
    e.preventDefault();
    e.stopImmediatePropagation();
    openStatsPage();
  }, true);

  const resetOptions = document.querySelector('.reset-options');
  if (resetOptions && !resetOptions.querySelector('[value="history"]')) {
    resetOptions.insertAdjacentHTML('beforeend',
      '<label><input type="checkbox" value="history"> 🕘 سجل الاختبارات</label>' +
      '<label><input type="checkbox" value="analytics"> 📈 إحصائيات الإتقان</label>' +
      '<label><input type="checkbox" value="flags"> 🚩 علامات المراجعة</label>');
  }
  document.getElementById('resetConfirm')?.addEventListener('click', () => {
    const selected = Array.from(document.querySelectorAll('.reset-options input[type=checkbox]:checked')).map(b=>b.value);
    const all = selected.includes('all');
    if (all || selected.includes('history')) state.quizHistory = [];
    if (all || selected.includes('analytics')) state.questionStats = {};
    if (all || selected.includes('flags')) state.reviewFlags = {};
    persist();
  }, true);

  document.querySelector('[data-action="mode-study"]')?.addEventListener('click', () => onModeChanged('study'));
  document.querySelector('[data-action="mode-flash"]')?.addEventListener('click', () => onModeChanged('flash'));

  ensureQuizSetup();
  ensureNavigator();
  ensureStatsPage();
  ensureResultMetrics();
  installReviewButtons();
  installModeButtons();
  syncModeButtons('study');

  window.StudyV2 = {
    openQuizSetup,
    openStatsPage,
    onAnswer,
    onQuizStarted,
    onQuizFinished,
    onModeChanged,
    refreshNavigator,
    getMastery:(id) => { const q=qById(id); return q ? mastery(q) : null; },
    getWeakQuestions:() => weakQuestions()
  };
})();"""
write('assets/study-v2.js', study_v2)

styles = read('assets/styles.css')
css = r"""

/* =========================================================
   Study V2 — Practice / Exam / Analytics / Navigator
   ========================================================= */
.exam-mode .q.quiz-mode.answered ol.o li.correct,
.exam-mode .q.quiz-mode.answered ol.o li.wrong{
  background:var(--card)!important;color:var(--ink)!important;font-weight:inherit!important;
}
.exam-mode .q.quiz-mode.answered ol.o li.correct .check,
.exam-mode .q.quiz-mode.answered ol.o li.wrong .check{display:none!important}
.exam-mode .q.quiz-mode.answered ol.o li.exam-choice{
  outline:2px solid var(--brand);background:color-mix(in srgb,var(--brand) 12%,var(--card))!important;
}
.exam-mode .q.quiz-mode .show-answer-btn{display:none!important}
.exam-mode .q.quiz-mode:not(.answered) .grade-btns{display:flex!important}
.exam-mode .q.quiz-mode .answer-box{display:none!important}

.quiz-setup-card{max-width:720px}
.quiz-setup-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.quiz-setup-grid label{display:flex;flex-direction:column;gap:6px;font-weight:700}
.quiz-setup-grid select{width:100%;padding:11px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);font-family:inherit}
.quiz-setup-note{margin:12px 0 0;padding:10px 12px;border-radius:10px;background:var(--soft);color:var(--muted);line-height:1.7}

.result-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:14px 0}
.result-metric{background:var(--soft);border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center}
.result-metric span{display:block;color:var(--muted);font-size:.82rem;margin-bottom:4px}
.result-metric b{font-size:1rem;color:var(--ink)}

.btn-review.on{background:#f59e0b!important;color:#111!important}

.quiz-navigator{position:fixed;z-index:9995;left:14px;bottom:18px;width:min(360px,calc(100vw - 28px));max-height:70vh;overflow:auto;background:var(--card);border:1px solid var(--line);box-shadow:0 18px 50px rgba(0,0,0,.22);border-radius:16px;padding:12px;display:none}
.quiz-navigator.show{display:block}
.quiz-nav-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
.quiz-nav-head button{border:0;background:var(--soft);color:var(--ink);border-radius:8px;padding:6px 9px;cursor:pointer}
.quiz-nav-legend{display:flex;gap:10px;flex-wrap:wrap;color:var(--muted);font-size:.8rem;margin-bottom:10px}
.quiz-nav-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}
.quiz-nav-grid button{border:1px solid var(--line);background:var(--soft);color:var(--ink);border-radius:8px;padding:8px 4px;cursor:pointer;font-family:inherit;font-size:.78rem}
.quiz-nav-grid button.answered{border-color:var(--brand);background:color-mix(in srgb,var(--brand) 13%,var(--card))}
.quiz-nav-grid button.flagged{box-shadow:inset 0 0 0 2px #f59e0b}
.quiz-nav-grid button.nav-correct{background:var(--ok-bg);color:var(--ok)}
.quiz-nav-grid button.nav-wrong{background:var(--err-bg);color:var(--err)}

.stats-page-modal{align-items:flex-start!important;padding:18px 10px;overflow:auto}
.stats-page-card{width:min(1100px,96vw)!important;max-width:1100px!important;max-height:none!important}
.stats-page-head{display:flex;align-items:center;justify-content:space-between;gap:10px;position:sticky;top:-1px;background:var(--card);z-index:2;padding-bottom:10px;border-bottom:1px solid var(--line)}
.stats-page-head button{border:0;background:var(--soft);color:var(--ink);border-radius:9px;padding:8px 11px;cursor:pointer}
.analytics-section{margin:16px 0}
.analytics-section h4{margin:0 0 10px;color:var(--brand)}
.analytics-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.analytics-card{border:1px solid var(--line);background:var(--soft);border-radius:12px;padding:12px;text-align:center}
.analytics-card span{display:block;color:var(--muted);font-size:.85rem}
.analytics-card b{display:block;margin-top:5px;font-size:1.15rem}
.analytics-trend{padding:10px 12px;background:var(--soft);border-radius:10px;color:var(--muted)}
.table-scroll{overflow:auto}
.analytics-table{width:100%;border-collapse:collapse;min-width:680px}
.analytics-table th,.analytics-table td{padding:9px;border-bottom:1px solid var(--line);text-align:right;vertical-align:top}
.analytics-table th{color:var(--brand);background:var(--soft)}
.weak-list{display:grid;gap:8px}
.weak-item{display:flex;flex-direction:column;gap:6px;text-align:right;border:1px solid var(--line);background:var(--card);color:var(--ink);padding:11px;border-radius:10px;cursor:pointer;font-family:inherit}
.weak-item small{color:var(--muted)}
.analytics-empty{color:var(--ok);font-weight:700}

@media(max-width:700px){
  .quiz-setup-grid,.analytics-grid,.result-metrics{grid-template-columns:1fr}
  .quiz-nav-grid{grid-template-columns:repeat(5,minmax(0,1fr))}
}
"""
if 'Study V2 — Practice / Exam / Analytics / Navigator' not in styles:
    styles += css
write('assets/styles.css', styles)

for path in [
    'materials/enterprise-architecture.html',
    'materials/mcq-flutter.html',
    'materials/mcq-information-security-privacy.html',
    'materials/qa-information-security-privacy.html',
]:
    text = read(path)
    text = text.replace('دراسة / اختبار / بطاقات', 'دراسة / تدريب / امتحان / بطاقات')
    if 'study-v2.js' not in text:
        text = re.sub(
            r'(<script src="\.\./assets/(?:mcq|qa)-engine\.js"></script>)',
            r'\1<script src="../assets/study-v2.js"></script>',
            text,
            count=1
        )
    write(path, text)

sw = read('sw.js')
if "'./assets/study-v2.js'" not in sw:
    anchor = "  './assets/qa-engine.js',\n"
    if anchor in sw:
        sw = sw.replace(anchor, anchor + "  './assets/study-v2.js',\n", 1)
    else:
        raise SystemExit('sw.js cache anchor missing')
write('sw.js', sw)

validator = read('tools/validate.py')
extra = r"""
if not (ROOT / 'assets' / 'study-v2.js').exists():
    fail('assets/study-v2.js is required')

for html_path in (ROOT / 'materials').glob('*.html'):
    page = html_path.read_text(encoding='utf-8')
    if '../assets/study-v2.js' not in page:
        fail(f'{html_path.relative_to(ROOT)}: missing study-v2.js')
"""
if "assets/study-v2.js is required" not in validator:
    validator += extra
write('tools/validate.py', validator)

workflow = read('.github/workflows/validate.yml')
if 'node --check assets/study-v2.js' not in workflow:
    workflow = workflow.replace(
        '          node --check assets/qa-engine.js\n',
        '          node --check assets/qa-engine.js\n          node --check assets/study-v2.js\n',
        1
    )
write('.github/workflows/validate.yml', workflow)

readme = read('README.md')
if 'Full-project verification rule' not in readme:
    readme += r"""

## Development Quality Rule

**Full-project verification rule:** after every important change, test the changed feature first, then run the complete project validation and browser behavior suite before the change is accepted.

## Quiz & Analytics V2

- Study mode remains the default learning mode.
- Practice mode provides immediate feedback.
- Exam mode hides correctness until the end.
- Custom quizzes support section, question count, current filters, weakness-only scope, and random order.
- Results include answered/unanswered counts, score, time, and average time per question.
- The last 20 quiz sessions are stored locally per browser.
- Per-section statistics, smart mastery levels, and weakness ranking are available.
- Quiz navigation supports answered state and review flags.
- A dedicated statistics view summarizes progress, weaknesses, section performance, and quiz history.
"""
write('README.md', readme)

tests = r"""const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const EA = `${BASE}/materials/enterprise-architecture.html`;
const PAGES = [
  '/materials/enterprise-architecture.html',
  '/materials/mcq-flutter.html',
  '/materials/mcq-information-security-privacy.html',
  '/materials/qa-information-security-privacy.html',
];

async function fresh(page, url = EA) {
  await page.goto(url);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('main .q');
}

async function openSetup(page, mode='practice') {
  await page.locator(`[data-action="mode-${mode}-v2"]`).click();
  await expect(page.locator('#quizSetupModal')).toHaveClass(/show/);
}

async function startSetup(page, {mode='practice', section='', count='all', source='all', order='original'} = {}) {
  await openSetup(page, mode);
  await page.selectOption('#quizSetupMode', mode);
  await page.selectOption('#quizSetupSection', section);
  await page.selectOption('#quizSetupCount', count);
  await page.selectOption('#quizSetupSource', source);
  await page.selectOption('#quizSetupOrder', order);
  await page.locator('#quizSetupStart').click();
}

async function chooseWrong(page) {
  const card = page.locator('main .q:not(.hidden)').first();
  const answer = Number(await card.getAttribute('data-a'));
  const opts = card.locator('ol.o li');
  const count = await opts.count();
  const wrong = Array.from({length:count},(_,i)=>i).find(i=>i!==answer);
  await opts.nth(wrong).click();
  return card;
}

test.describe('Quiz & Analytics V2', () => {
  test('all material pages load Study, Practice, Exam and analytics without page errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    for (const path of PAGES) {
      await fresh(page, BASE + path);
      await expect(page.locator('[data-action="mode-study"]')).toBeVisible();
      await expect(page.locator('[data-action="mode-practice-v2"]')).toBeVisible();
      await expect(page.locator('[data-action="mode-exam-v2"]')).toBeVisible();
      await expect(page.locator('#quizNavBtn')).toHaveCount(1);
      await expect(page.locator('#statsPageModal')).toHaveCount(1);
    }
    expect(errors).toEqual([]);
  });

  test('custom Practice quiz supports section + count', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec8', count:'10'});
    await expect(page.locator('#statProgress')).toHaveText('0/10');
    await expect(page.locator('#secFilter')).toBeDisabled();
    await expect(page.locator('#quizNavBtn')).toBeVisible();
    const visible = page.locator('main .q:not(.hidden)');
    await expect(visible).toHaveCount(10);
  });

  test('random custom quiz produces a fixed requested scope', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec8', count:'20', order:'random'});
    await expect(page.locator('main .q:not(.hidden)')).toHaveCount(20);
    const nums = await page.locator('main .q:not(.hidden) .n').allTextContents();
    expect(new Set(nums).size).toBe(20);
  });

  test('Practice reveals correctness immediately and records smart analytics', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec1', count:'10'});
    const card = await chooseWrong(page);
    await expect(card).toHaveClass(/answered/);
    await expect(card.locator('ol.o li.wrong')).toHaveCount(1);
    const qid = await card.getAttribute('data-qid');
    const rec = await page.evaluate(id => {
      const key = 'enterprise275_state_ea2_v5';
      return JSON.parse(localStorage.getItem(key) || '{}').questionStats?.[id];
    }, qid);
    expect(rec.wrong).toBeGreaterThanOrEqual(1);
  });

  test('Exam hides correctness until finish and result metrics appear', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'exam', section:'sec1', count:'10'});
    const card = await chooseWrong(page);
    await expect(page.locator('#statScore')).toHaveText('مخفي');
    await expect(card.locator('ol.o li.exam-choice')).toHaveCount(1);
    const bg = await card.locator('ol.o li.wrong').evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).toBeTruthy();
    await page.locator('#stopQuizFloatBtn').click();
    await expect(page.locator('#quizResult')).toHaveClass(/show/);
    await expect(page.locator('#qrMetrics .result-metric')).toHaveCount(9);
    await expect(page.locator('#qrMetrics')).toContainText('امتحان');
  });

  test('quiz navigator tracks answered and review flags', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec1', count:'10'});
    const card = page.locator('main .q:not(.hidden)').first();
    await card.locator('.btn-review').click();
    await chooseWrong(page);
    await page.locator('#quizNavBtn').click();
    await expect(page.locator('#quizNavigator')).toHaveClass(/show/);
    await expect(page.locator('#quizNavGrid button.flagged')).toHaveCount(1);
    await expect(page.locator('#quizNavGrid button.answered')).toHaveCount(1);
  });

  test('finishing a quiz stores history and stats page shows section performance and weakness', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec1', count:'10'});
    await chooseWrong(page);
    await page.locator('#stopQuizFloatBtn').click();
    await page.locator('[data-action="stats"]').click();
    await expect(page.locator('#statsPageModal')).toHaveClass(/show/);
    await expect(page.locator('#statsPageContent')).toContainText('آخر الاختبارات');
    await expect(page.locator('#statsPageContent')).toContainText('أهم نقاط الضعف');
    await expect(page.locator('.analytics-table')).toHaveCount(2);
    const historyLen = await page.evaluate(() => {
      const key = 'enterprise275_state_ea2_v5';
      return (JSON.parse(localStorage.getItem(key)||'{}').quizHistory || []).length;
    });
    expect(historyLen).toBe(1);
  });

  test('weakness-only source builds a quiz only after mistakes exist', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'practice', section:'sec1', count:'10'});
    await chooseWrong(page);
    await page.locator('#stopQuizFloatBtn').click();
    await page.locator('[data-action="mode-study"]').click();
    await startSetup(page, {mode:'practice', source:'weak', count:'all'});
    await expect(page.locator('main .q:not(.hidden)')).toHaveCount(1);
  });

  test('paused Exam resumes with its mode and can be finished once', async ({ page }) => {
    await fresh(page);
    await startSetup(page, {mode:'exam', section:'sec1', count:'10'});
    await chooseWrong(page);
    await page.reload();
    await expect(page.locator('#resumeQuizModal')).toHaveClass(/show/);
    await page.locator('#resumeQuizContinue').click();
    await expect(page.locator('#statScore')).toHaveText('مخفي');
    await expect(page.locator('#statProgress')).toHaveText('1/10');
    await page.reload();
    await expect(page.locator('#resumeQuizModal')).toHaveClass(/show/);
    await page.locator('#resumeQuizFinish').click();
    await expect(page.locator('#quizResult')).toHaveClass(/show/);
    await page.reload();
    await page.waitForTimeout(400);
    await expect(page.locator('#resumeQuizModal')).not.toHaveClass(/show/);
  });

  test('Q&A Exam hides answer until grading and reveals answers after finish', async ({ page }) => {
    await fresh(page, `${BASE}/materials/qa-information-security-privacy.html`);
    await startSetup(page, {mode:'exam', section:'sec1', count:'10'});
    const first = page.locator('main .q:not(.hidden)').first();
    await expect(first.locator('.show-answer-btn')).toBeHidden();
    await expect(first.locator('.grade-btns')).toBeVisible();
    await first.locator('.grade-wrong').click();
    await expect(first.locator('.answer-box')).toBeHidden();
    await page.locator('#stopQuizFloatBtn').click();
    await expect(first.locator('.answer-box')).toBeVisible();
    await expect(page.locator('#qrMetrics')).toContainText('امتحان');
  });

  test('study progress remains independent from quiz history', async ({ page }) => {
    await fresh(page);
    await page.locator('#q1').click();
    await expect(page.locator('#statProgress')).toHaveText('1/275');
    await startSetup(page, {mode:'practice', section:'sec1', count:'10'});
    await page.locator('#stopQuizFloatBtn').click();
    await page.locator('[data-action="mode-study"]').click();
    await expect(page.locator('#statProgress')).toHaveText('1/275');
    await expect(page.locator('#q1')).toHaveClass(/revealed/);
  });
});
"""
write('tests/ui.spec.js', tests)

print('Quiz & Analytics V2 patch prepared successfully')
