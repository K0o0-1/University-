(function(){
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

    const wrong = Number(r.wrong) || Number(state.wrong?.[q.id]) || 0;
    const stamp = r.lastAt ? new Date(r.lastAt).getTime() : NaN;
    const ageDays = Number.isFinite(stamp) ? Math.max(0, (Date.now() - stamp) / 86400000) : 30;
    const recency = Number.isFinite(stamp) ? Math.max(.25, Math.exp(-ageDays / 21)) : .35;
    let score = wrong * (1.4 + 1.6 * recency);
    if (r.lastResult === 'wrong') score += 4 * recency;
    score -= tailCorrect * 1.5;
    if (r.lastResult === 'correct') score -= Math.min(3, tailCorrect + 1);
    if (state.mastered?.[q.id]) score -= 6;
    return Math.max(0, Math.round(score * 100) / 100);
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
    if (payload.mode === 'exam' && kind === 'mcq' && !payload.correct) {
      qById(payload.id)?.el.querySelector('.tag.err')?.classList.add('hidden');
    }
    refreshNavigator();
  }

  function onQuizFinished(result){
    if (!state.quizHistory.some(x => x.id === result.id)) {
      state.quizHistory.unshift(result);
      state.quizHistory = state.quizHistory.slice(0, 20);
      persist();
    }
    renderQuizResult(result);
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
          <label>اختيار الأسئلة
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
    const timeMode = document.getElementById('quizSetupTimeMode')?.value || 'none';
    const timeValue = Number(document.getElementById('quizSetupTimeValue')?.value || 0);
    const timeLimitSec = timeMode === 'total'
      ? Math.max(1, Math.round(timeValue * 60))
      : timeMode === 'per-question' ? Math.max(1, Math.round(timeValue)) : 0;

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
      requestedCount:countVal,
      timeMode,
      timeLimitSec
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
    window.StudyPlus?.enhanceStatsPage?.();
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
    getWeakQuestions:() => weakQuestions(),
    getWeaknessScore:(id) => { const q=qById(id); return q ? weaknessScore(q) : 0; }
  };
})();