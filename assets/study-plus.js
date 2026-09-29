(function(){
  'use strict';
  const engine = window.StudyEngine;
  if (!engine) { console.warn('Study Plus: engine API missing'); return; }

  const state = engine.state;
  const kind = engine.kind;
  let timerId = null;
  let totalLimitSec = 0;
  let timerWarned = new Set();
  let currentQuizQid = null;
  let perQuestionRemaining = {};
  let perQuestionStartedAt = 0;
  let expiredIds = new Set();
  let perQuestionScopeKey = '';
  let lastPerQuestionPersistSecond = -1;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const questions = () => engine.allQuestions();
  const qById = id => engine.questionById(id);
  const fmt = sec => {
    sec = Math.max(0, Math.ceil(Number(sec)||0));
    return String(Math.floor(sec/60)).padStart(2,'0') + ':' + String(sec%60).padStart(2,'0');
  };
  const formatDate = value => {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('ar');
  };

  function ensureSetupTimer(){
    const grid = document.querySelector('#quizSetupModal .quiz-setup-grid');
    if (!grid || document.getElementById('quizSetupTimeMode')) return;
    grid.insertAdjacentHTML('beforeend', `
      <label>المؤقت
        <select id="quizSetupTimeMode">
          <option value="none">بدون حد زمني</option>
          <option value="total">⏱ وقت للاختبار كاملًا</option>
          <option value="per-question">⏱ وقت لكل سؤال</option>
        </select>
      </label>
      <label id="quizSetupTimeValueWrap" style="display:none">المدة
        <input id="quizSetupTimeValue" type="number" inputmode="decimal" min="0.02" step="0.1" value="30">
        <small id="quizSetupTimeUnit">دقيقة</small>
      </label>`);
    document.getElementById('quizSetupTimeMode').addEventListener('change', updateSetupTimer);
    updateSetupTimer();
  }

  function updateSetupTimer(){
    const mode = document.getElementById('quizSetupTimeMode')?.value || 'none';
    const wrap = document.getElementById('quizSetupTimeValueWrap');
    const unit = document.getElementById('quizSetupTimeUnit');
    const input = document.getElementById('quizSetupTimeValue');
    if (!wrap || !unit || !input) return;
    wrap.style.display = mode === 'none' ? 'none' : 'flex';
    if (mode === 'total') {
      unit.textContent = 'دقيقة للاختبار كاملًا';
      input.placeholder = 'مثال: 30';
    } else if (mode === 'per-question') {
      unit.textContent = 'ثانية مستقلة لكل سؤال — يُحفظ المتبقي عند التخطي';
      input.placeholder = 'مثال: 45';
    }
  }

  function ensureLiveTools(){
    if (document.getElementById('quizSkipBtn')) return;
    const stop = document.getElementById('stopQuizBtn');
    const skip = document.createElement('button');
    skip.id = 'quizSkipBtn';
    skip.type = 'button';
    skip.textContent = '⏭ تخطي';
    skip.style.display = 'none';
    skip.addEventListener('click', skipQuestion);
    stop?.insertAdjacentElement('afterend', skip);

    const timer = document.createElement('span');
    timer.id = 'quizCountdown';
    timer.className = 'quiz-countdown';
    timer.style.display = 'none';
    skip.insertAdjacentElement('afterend', timer);
  }

  function timerMode(){
    return engine.getQuizConfig?.().timeMode || 'none';
  }

  function perQuestionLimit(){
    return Math.max(1, Number(engine.getQuizConfig?.().timeLimitSec) || 1);
  }

  function currentPerQuestionRemaining(){
    if (!currentQuizQid) return 0;
    const base = Number(perQuestionRemaining[currentQuizQid] ?? perQuestionLimit());
    if (!perQuestionStartedAt) return Math.max(0, base);
    return Math.max(0, base - (Date.now() - perQuestionStartedAt) / 1000);
  }

  function storePerQuestionSession(){
    if (timerMode() !== 'per-question') return;
    state.plusTimerSession = {
      version:1,
      scopeKey:perQuestionScopeKey,
      currentId:currentQuizQid,
      remaining:{...perQuestionRemaining},
      expired:[...expiredIds]
    };
    engine.saveState();
  }

  function saveCurrentPerQuestionClock(){
    if (timerMode() !== 'per-question' || !currentQuizQid) return;
    perQuestionRemaining[currentQuizQid] = currentPerQuestionRemaining();
    perQuestionStartedAt = Date.now();
    storePerQuestionSession();
  }

  function markCurrent(id){
    currentQuizQid = id || null;
    questions().forEach(q => q.el.classList.toggle('quiz-current', !!id && q.id === id));
  }

  function restorePerQuestionState(ctx){
    const ids = ctx?.ids || engine.getActiveQuizIds();
    const answers = engine.getQuizAnswers();
    perQuestionScopeKey = ids.join('|');
    const saved = ctx?.resumed && state.plusTimerSession?.version === 1 && state.plusTimerSession.scopeKey === perQuestionScopeKey
      ? state.plusTimerSession : null;
    perQuestionRemaining = saved ? {...(saved.remaining || {})} : {};
    expiredIds = new Set(saved?.expired || []);
    const limit = Number(ctx?.config?.timeLimitSec) || perQuestionLimit();
    ids.forEach(id => {
      if (!Object.prototype.hasOwnProperty.call(answers,id) && !expiredIds.has(id) && !Number.isFinite(Number(perQuestionRemaining[id]))) {
        perQuestionRemaining[id] = limit;
      }
      qById(id)?.el.classList.toggle('time-expired', expiredIds.has(id));
    });
    let preferred = saved?.currentId;
    if (!preferred || Object.prototype.hasOwnProperty.call(answers,preferred) || expiredIds.has(preferred)) {
      preferred = ids.find(id => !Object.prototype.hasOwnProperty.call(answers,id) && !expiredIds.has(id)) || null;
    }
    markCurrent(preferred);
    perQuestionStartedAt = preferred ? Date.now() : 0;
    storePerQuestionSession();
  }

  function stopTimer(hide=true){
    if (timerId) clearInterval(timerId);
    timerId = null;
    if (hide) document.getElementById('quizCountdown')?.style.setProperty('display','none');
  }

  function expireCurrentQuestion(){
    const expired = currentQuizQid;
    if (!expired) return;
    perQuestionRemaining[expired] = 0;
    expiredIds.add(expired);
    qById(expired)?.el.classList.add('time-expired');
    engine.showToast('⏰ انتهى وقت هذا السؤال — بقي غير مجاب', 2200);
    const next = nextUnanswered(expired);
    if (next) {
      markCurrent(next);
      if (!Number.isFinite(Number(perQuestionRemaining[next]))) perQuestionRemaining[next] = perQuestionLimit();
      perQuestionStartedAt = Date.now();
      storePerQuestionSession();
    } else {
      perQuestionStartedAt = 0;
      storePerQuestionSession();
      stopTimer(false);
      engine.finishCustomQuiz?.('timeout');
    }
  }

  function startPerQuestionTimer(ctx, hud){
    totalLimitSec = Number(ctx?.config?.timeLimitSec) || 0;
    timerWarned = new Set();
    document.body.classList.add('per-question-timer-mode');
    restorePerQuestionState(ctx);
    if (!currentQuizQid) {
      engine.finishCustomQuiz?.('timeout');
      return;
    }
    hud.style.display = 'inline-flex';
    const tick = () => {
      if (!engine.isQuizRunning?.()) { stopTimer(); return; }
      const remaining = currentPerQuestionRemaining();
      hud.dataset.remaining = String(Math.ceil(remaining));
      hud.dataset.limit = String(perQuestionLimit());
      hud.textContent = `⏳ هذا السؤال ${fmt(remaining)} • ${perQuestionLimit()}ث/سؤال`;
      const sec = Math.floor(Date.now()/1000);
      if (sec !== lastPerQuestionPersistSecond) {
        lastPerQuestionPersistSecond = sec;
        saveCurrentPerQuestionClock();
      }
      if (remaining <= 0.02) expireCurrentQuestion();
    };
    tick();
    if (engine.isQuizRunning?.()) timerId = setInterval(tick, 200);
  }

  function startTimer(ctx){
    stopTimer(false);
    document.body.classList.remove('per-question-timer-mode');
    const config = ctx?.config || engine.getQuizConfig?.() || {};
    const hud = document.getElementById('quizCountdown');
    if (!hud || config.timeMode === 'none' || !(Number(config.timeLimitSec) > 0)) {
      totalLimitSec = 0;
      if (hud) hud.style.display = 'none';
      return;
    }
    if (config.timeMode === 'per-question') {
      startPerQuestionTimer(ctx, hud);
      return;
    }

    totalLimitSec = Number(config.timeLimitSec) || 0;
    timerWarned = new Set();
    const initialRemaining = Math.max(0, totalLimitSec - Math.floor((engine.getQuizElapsedMs?.()||0)/1000));
    [600,300,60].forEach(t => { if (initialRemaining <= t) timerWarned.add(t); });
    hud.style.display = 'inline-flex';

    const tick = () => {
      if (!engine.isQuizRunning?.()) { stopTimer(); return; }
      const elapsed = Math.floor((engine.getQuizElapsedMs?.()||0)/1000);
      const remaining = Math.max(0, totalLimitSec - elapsed);
      hud.dataset.remaining = String(remaining);
      hud.dataset.limit = String(totalLimitSec);
      hud.textContent = `⏳ المتبقي ${fmt(remaining)}`;
      for (const t of [600,300,60]) {
        if (totalLimitSec > t && remaining <= t && !timerWarned.has(t)) {
          timerWarned.add(t);
          engine.showToast(`⏰ باقي ${t === 60 ? 'دقيقة' : (t/60)+' دقائق'} على انتهاء الوقت`, 2800);
        }
      }
      if (remaining <= 0) {
        stopTimer(false);
        engine.finishCustomQuiz?.('timeout');
      }
    };
    tick();
    if (engine.isQuizRunning?.()) timerId = setInterval(tick, 250);
  }

  function unansweredIds(){
    const answers = engine.getQuizAnswers();
    return engine.getActiveQuizIds().filter(id => !Object.prototype.hasOwnProperty.call(answers,id));
  }

  function setCurrentQuestion(id, scroll=false){
    if (!id || !qById(id)) return;
    if (timerMode() === 'per-question') {
      const answers = engine.getQuizAnswers();
      if (Object.prototype.hasOwnProperty.call(answers,id) || expiredIds.has(id)) {
        if (scroll) qById(id).el.scrollIntoView({behavior:'smooth', block:'center'});
        return;
      }
      if (currentQuizQid && currentQuizQid !== id) saveCurrentPerQuestionClock();
      if (!Number.isFinite(Number(perQuestionRemaining[id]))) perQuestionRemaining[id] = perQuestionLimit();
      markCurrent(id);
      perQuestionStartedAt = Date.now();
      storePerQuestionSession();
    } else {
      markCurrent(id);
    }
    if (scroll) qById(id).el.scrollIntoView({behavior:'smooth', block:'center'});
  }

  function nextUnanswered(afterId){
    const active = engine.getActiveQuizIds();
    const answers = engine.getQuizAnswers();
    if (!active.length) return null;
    let start = Math.max(-1, active.indexOf(afterId));
    for (let step=1; step<=active.length; step++) {
      const id = active[(start + step) % active.length];
      if (!Object.prototype.hasOwnProperty.call(answers,id) && !expiredIds.has(id)) return id;
    }
    return null;
  }

  function skipQuestion(){
    if (!engine.isQuizRunning?.()) return;
    const target = nextUnanswered(currentQuizQid);
    if (!target || target === currentQuizQid) {
      engine.showToast('لا يوجد سؤال آخر غير مجاب');
      return;
    }
    setCurrentQuestion(target, true);
    engine.showToast('⏭ تم التخطي مؤقتًا — السؤال بقي غير مجاب');
  }

  function installQuestionStats(){
    questions().forEach(q => {
      const actions = q.el.querySelector('.qactions');
      if (!actions || actions.querySelector('.btn-qstats')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-qstats';
      b.title = 'إحصائيات السؤال';
      b.textContent = '📊';
      actions.appendChild(b);
    });
  }

  function ensureQuestionStatsModal(){
    if (document.getElementById('questionStatsModal')) return;
    const modal = document.createElement('div');
    modal.id = 'questionStatsModal';
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-card question-stats-card"><h3>📊 إحصائيات السؤال</h3><div id="questionStatsContent"></div><div class="modal-actions"><button type="button" class="btn-secondary" id="questionStatsClose">إغلاق</button></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector('#questionStatsClose').addEventListener('click', () => modal.classList.remove('show'));
  }

  function questionRecord(id){
    const r = state.questionStats?.[id] || {};
    const correct = Number(r.correct) || Number(state.correct?.[id]) || 0;
    const wrong = Number(r.wrong) || Number(state.wrong?.[id]) || 0;
    const attempts = Number(r.attempts) || correct + wrong;
    return {...r, attempts, correct, wrong};
  }

  function openQuestionStats(id){
    const q = qById(id); if (!q) return;
    ensureQuestionStatsModal();
    const r = questionRecord(id);
    const accuracy = r.attempts ? Math.round(r.correct/r.attempts*100) : 0;
    const mastery = window.StudyV2?.getMastery?.(id)?.label || '⚪ غير مجرب';
    const weakScore = window.StudyV2?.getWeaknessScore?.(id) || 0;
    const lastResult = r.lastResult === 'correct' ? (kind === 'qa' ? 'أعرفها' : 'صحيح') : r.lastResult === 'wrong' ? (kind === 'qa' ? 'لا أعرفها' : 'خطأ') : '—';
    document.getElementById('questionStatsContent').innerHTML = `
      <p class="qstats-question"><b>س${q.num}</b> ${esc(q.q)}</p>
      <div class="qstats-grid">
        <div><span>المحاولات</span><b>${r.attempts}</b></div>
        <div><span>${kind === 'qa' ? 'أعرفها' : 'صحيح'}</span><b>${r.correct}</b></div>
        <div><span>${kind === 'qa' ? 'لا أعرفها' : 'خطأ'}</span><b>${r.wrong}</b></div>
        <div><span>الدقة</span><b>${accuracy}%</b></div>
        <div><span>الإتقان</span><b>${esc(mastery)}</b></div>
        <div><span>أولوية المراجعة</span><b>${weakScore}</b></div>
      </div>
      <p class="qstats-meta">آخر نتيجة: <b>${esc(lastResult)}</b> • آخر محاولة: <b>${esc(formatDate(r.lastAt))}</b></p>`;
    document.getElementById('questionStatsModal').classList.add('show');
  }

  function trendChart(history){
    const items = history.slice(0,10).reverse();
    if (!items.length) return '<p class="analytics-empty">لا توجد نتائج بعد لرسم التطور.</p>';
    return `<div class="trend-chart" aria-label="تطور آخر الاختبارات">${items.map(h => {
      const pct = Math.max(0, Math.min(100, Number(h.percent)||0));
      return `<div class="trend-col" title="${pct}%"><div class="trend-track"><span class="trend-bar" style="height:${Math.max(3,pct)}%"></span></div><b>${pct}%</b></div>`;
    }).join('')}</div>`;
  }

  function ensureHistoryModal(){
    if (document.getElementById('historyDetailModal')) return;
    const modal = document.createElement('div');
    modal.id = 'historyDetailModal';
    modal.className = 'modal';
    modal.innerHTML = `<div class="modal-card history-detail-card"><div class="stats-page-head"><h3>🧾 تفاصيل الاختبار</h3><button type="button" id="historyDetailClose">✖</button></div><div id="historyDetailContent"></div><div class="modal-actions"><button type="button" class="btn-primary" id="historyRetakeBtn">🔁 أعد نفس الاختبار</button><button type="button" class="btn-secondary" id="historyDetailClose2">إغلاق</button></div></div>`;
    document.body.appendChild(modal);
    const close = () => modal.classList.remove('show');
    modal.querySelector('#historyDetailClose').addEventListener('click', close);
    modal.querySelector('#historyDetailClose2').addEventListener('click', close);
  }

  function answerStatus(h, q){
    const answers = h.answers || {};
    if (!Object.prototype.hasOwnProperty.call(answers,q.id)) return {label:'غير مجاب', cls:'hist-unanswered', detail:''};
    if (kind === 'qa') {
      const ok = answers[q.id] === 'correct';
      return {label:ok ? 'أعرفها' : 'لا أعرفها', cls:ok ? 'hist-correct' : 'hist-wrong', detail:''};
    }
    const chosen = Number(answers[q.id]);
    const ok = chosen === q.a;
    const choice = Number.isInteger(chosen) && q.o?.[chosen] !== undefined ? q.o[chosen] : '—';
    const correct = q.o?.[q.a] ?? '—';
    return {label:ok ? 'صحيح' : 'خطأ', cls:ok ? 'hist-correct' : 'hist-wrong', detail:`اختيارك: ${choice} • الصحيح: ${correct}`};
  }

  function openHistoryDetail(id){
    ensureHistoryModal();
    const h = (state.quizHistory || []).find(x => x.id === id); if (!h) return;
    const scope = (h.scopeIds || []).map(qById).filter(Boolean);
    const hasAnswers = h.answers && typeof h.answers === 'object';
    const rows = scope.map(q => {
      const s = hasAnswers ? answerStatus(h,q) : {label:'تفاصيل غير متوفرة لاختبار قديم',cls:'hist-unanswered',detail:''};
      return `<div class="history-question ${s.cls}"><div><b>س${q.num}</b> ${esc(q.q)}</div><small>${esc(s.label)}${s.detail ? ' • '+esc(s.detail) : ''}</small></div>`;
    }).join('');
    const timerText = h.config?.timeMode === 'total' ? `${Math.round((Number(h.config.timeLimitSec)||0)/60*10)/10} دقيقة` : h.config?.timeMode === 'per-question' ? `${Number(h.config.timeLimitSec)||0} ثانية/سؤال` : 'بدون حد';
    document.getElementById('historyDetailContent').innerHTML = `
      <div class="qstats-grid history-summary">
        <div><span>الوضع</span><b>${h.mode === 'exam' ? 'امتحان' : 'تدريب'}</b></div>
        <div><span>النتيجة</span><b>${Number(h.percent)||0}%</b></div>
        <div><span>المجاب</span><b>${Number(h.answered)||0}/${Number(h.total)||0}</b></div>
        <div><span>الوقت</span><b>${fmt(Math.round((Number(h.elapsedMs)||0)/1000))}</b></div>
        <div><span>المؤقت</span><b>${esc(timerText)}</b></div>
        <div><span>التاريخ</span><b>${esc(formatDate(h.at))}</b></div>
      </div>
      <div class="history-questions">${rows || '<p>لا توجد تفاصيل أسئلة.</p>'}</div>`;
    const retake = document.getElementById('historyRetakeBtn');
    retake.dataset.historyId = h.id;
    retake.disabled = !scope.length;
    document.getElementById('historyDetailModal').classList.add('show');
  }

  function retakeHistory(id){
    const h = (state.quizHistory || []).find(x => x.id === id); if (!h || !(h.scopeIds||[]).length) return;
    document.getElementById('historyDetailModal')?.classList.remove('show');
    document.getElementById('statsPageModal')?.classList.remove('show');
    engine.startCustomQuiz({...(h.config||{}), mode:h.mode === 'exam' ? 'exam' : 'practice', scopeIds:[...h.scopeIds], retakeOf:h.id});
  }

  function enhanceStatsPage(){
    const content = document.getElementById('statsPageContent');
    if (!content) return;
    const history = state.quizHistory || [];
    const list = history.slice(0,10).map(h => `<button type="button" class="history-card" data-history-detail="${esc(h.id)}"><span><b>${h.mode === 'exam' ? '📝 امتحان' : '🧠 تدريب'}</b> • ${esc(h.config?.sectionLabel || 'كل الأقسام')}</span><small>${esc(formatDate(h.at))} • ${h.answered}/${h.total} • ${h.percent}%</small></button>`).join('') || '<p class="analytics-empty">لا يوجد سجل اختبارات حتى الآن.</p>';
    content.insertAdjacentHTML('beforeend', `
      <section class="analytics-section plus-trend"><h4>📈 تطور المستوى — آخر 10 اختبارات</h4>${trendChart(history)}</section>
      <section class="analytics-section plus-history"><h4>🧾 تفاصيل الاختبارات السابقة</h4><div class="history-list">${list}</div></section>`);
  }

  function onQuizStarted(ctx){
    ensureSetupTimer(); ensureLiveTools();
    const skip = document.getElementById('quizSkipBtn');
    if (skip) skip.style.display = 'inline-flex';
    if (ctx?.config?.timeMode === 'per-question') {
      startTimer(ctx);
    } else {
      const answers = engine.getQuizAnswers();
      const first = (ctx.ids || []).find(id => !Object.prototype.hasOwnProperty.call(answers,id)) || ctx.ids?.[0];
      if (first) setCurrentQuestion(first, false);
      startTimer(ctx);
    }
  }

  function onAnswer(payload){
    if (timerMode() === 'per-question' && payload.id === currentQuizQid) {
      saveCurrentPerQuestionClock();
      delete perQuestionRemaining[payload.id];
      perQuestionStartedAt = 0;
      const next = nextUnanswered(payload.id);
      if (next) setCurrentQuestion(next, false);
      else if (expiredIds.size) engine.finishCustomQuiz?.('timeout');
      storePerQuestionSession();
      return;
    }
    if (payload.id === currentQuizQid || !currentQuizQid) {
      const next = nextUnanswered(payload.id);
      if (next) setCurrentQuestion(next, false);
    }
  }

  function onQuizFinished(){
    stopTimer();
    document.body.classList.remove('per-question-timer-mode');
    const skip = document.getElementById('quizSkipBtn');
    if (skip) skip.style.display = 'none';
    questions().forEach(q => q.el.classList.remove('quiz-current','time-expired'));
    currentQuizQid = null;
    perQuestionRemaining = {};
    perQuestionStartedAt = 0;
    expiredIds = new Set();
    delete state.plusTimerSession;
    engine.saveState();
  }

  function onModeChanged(mode){
    if (mode !== 'quiz' && mode !== 'review') {
      if (timerMode() === 'per-question' && currentQuizQid) saveCurrentPerQuestionClock();
      stopTimer();
      document.body.classList.remove('per-question-timer-mode');
      const skip = document.getElementById('quizSkipBtn');
      if (skip) skip.style.display = 'none';
      questions().forEach(q => q.el.classList.remove('quiz-current'));
    }
  }

  document.addEventListener('click', e => {
    const statsBtn = e.target.closest('.btn-qstats');
    if (statsBtn) {
      const id = statsBtn.closest('.q')?.dataset.qid;
      if (id) openQuestionStats(id);
      e.stopPropagation();
      return;
    }
    const qcard = e.target.closest('.q.quiz-mode');
    if (qcard && engine.isQuizRunning?.() && timerMode() !== 'per-question') currentQuizQid = qcard.dataset.qid;
    const nav = e.target.closest('#quizNavGrid button[data-qid]');
    if (nav) setCurrentQuestion(nav.dataset.qid, false);
    const hist = e.target.closest('[data-history-detail]');
    if (hist) openHistoryDetail(hist.dataset.historyDetail);
  });

  ensureSetupTimer();
  ensureLiveTools();
  ensureQuestionStatsModal();
  ensureHistoryModal();
  installQuestionStats();
  document.getElementById('historyRetakeBtn')?.addEventListener('click', e => retakeHistory(e.currentTarget.dataset.historyId));

  window.addEventListener('beforeunload', () => { if (timerMode() === 'per-question' && engine.isQuizRunning?.()) saveCurrentPerQuestionClock(); });

  window.StudyPlus = {
    onQuizStarted,
    onAnswer,
    onQuizFinished,
    onModeChanged,
    enhanceStatsPage,
    openQuestionStats,
    openHistoryDetail,
    getTimerState:() => ({mode:timerMode(), totalLimitSec, remaining:Number(document.getElementById('quizCountdown')?.dataset.remaining || 0), currentQuizQid, perQuestionRemaining:{...perQuestionRemaining}, expired:[...expiredIds]})
  };
})();
