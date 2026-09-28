/* =========================================================
   بيانات الأسئلة
   ========================================================= */
const MATERIAL = window.MATERIAL_DATA?.meta || {};
const SECTIONS = window.MATERIAL_DATA?.sections || [];

/* =========================================================
   الحالة العامة
   ========================================================= */
const LS_KEY = MATERIAL.storageKey || 'study_mcq_state_v1';
const LEGACY_QID = (n) => 'q' + n;
let currentMode = 'study';
let focusMode = false;
let focusIdx = 0;
let quizStarted = false;
let quizStartTime = 0;
let quizTimerId = null;
let certShown = false;
let currentStreak = 0;
let bestStreak = 0;
let deferredInstallPrompt = null;
let revealAllState = false;

const state = {
  dark:false, revealed:{}, mastered:{}, fav:{},
  wrong:{}, correct:{}, quizScore:{c:0,w:0},
  streak:0, bestStreak:0,
  quizSession:null, lastQuizWrongIds:[], stateVersion:3
};
try{ Object.assign(state, JSON.parse(localStorage.getItem(LS_KEY)||'{}')); }catch(e){}
['fav','mastered','wrong','revealed','correct'].forEach(k => state[k] = state[k] || {});
state.quizScore = state.quizScore || {c:0,w:0};
state.lastQuizWrongIds = Array.isArray(state.lastQuizWrongIds) ? state.lastQuizWrongIds : [];
bestStreak = Number(state.bestStreak) || 0;

function saveState(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){}
}

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


/* =========================================================
   بناء الأسئلة
   ========================================================= */
const mainEl  = document.getElementById('main');
const indexEl = document.getElementById('index');
const secFilter = document.getElementById('secFilter');

let qGlobal = 0;
const ALL_Q = [];

SECTIONS.forEach((sec, si) => {
  const secId = 'sec' + (si+1);

  const opt = document.createElement('option');
  opt.value = secId; opt.textContent = (si + 1) + '. ' + sec.title + ' — ' + sec.badge;
  secFilter.appendChild(opt);

  /* ✅ الفهرس: نضيف رقم القسم والنطاق (مثل القديم) */
  const a = document.createElement('a');
  a.href = '#' + secId;
  a.textContent = (si + 1) + '. ' + sec.title + ' — ' + sec.badge;
  indexEl.appendChild(a);

  const section = document.createElement('section');
  section.id = secId;

  const h = document.createElement('div');
  h.className = 'sec-title';
  h.innerHTML = `<span class="badge">${sec.badge}</span> ${sec.title}`;
  section.appendChild(h);

  sec.qs.forEach(item => {
    qGlobal++;
    const legacyQid = LEGACY_QID(qGlobal);
    const qid = makeQuestionId(sec, si, item);

    const qDiv = document.createElement('div');
    qDiv.className = 'q';
    qDiv.id = legacyQid;
    qDiv.dataset.qid = qid;
    qDiv.dataset.sec = secId;
    qDiv.dataset.a = item.a;

    const qhead = document.createElement('div');
    qhead.className = 'qhead';

    const nSpan = document.createElement('span');
    nSpan.className = 'n'; nSpan.textContent = qGlobal;

    const qText = document.createElement('p');
    qText.className = 'qt'; qText.textContent = item.q;

    const qact = document.createElement('div');
    qact.className = 'qactions';
    qact.innerHTML = `
      <button class="btn-fav" title="مفضلة">⭐</button>
      <button class="btn-mastered" title="أتقنتها">✔</button>
      <button class="btn-copy" title="نسخ السؤال">📋</button>
      <button class="btn-share" title="مشاركة على واتساب">📤</button>
    `;

    qhead.appendChild(nSpan);
    qhead.appendChild(qText);
    qhead.appendChild(qact);
    qDiv.appendChild(qhead);

    const ol = document.createElement('ol');
    ol.className = 'o';
    item.o.forEach((oText, oi) => {
      const li = document.createElement('li');
      li.dataset.idx = oi;
      const numSpan = document.createElement('span');
      numSpan.className = 'opt-num';
      numSpan.textContent = String.fromCharCode(65 + oi) + ')';
      const txtSpan = document.createElement('span');
      txtSpan.className = 'opt-text';
      txtSpan.textContent = oText;
      const checkSpan = document.createElement('span');
      checkSpan.className = 'check';
      checkSpan.textContent = (oi === item.a) ? '✔' : '✘';
      li.appendChild(numSpan);
      li.appendChild(txtSpan);
      li.appendChild(checkSpan);
      if (oi === item.a) li.classList.add('correct');
      ol.appendChild(li);
    });
    qDiv.appendChild(ol);

    const qfoot = document.createElement('div');
    qfoot.className = 'qfoot';
    qfoot.innerHTML = `<span class="tag err hidden">أخطأت 0</span>`;
    qDiv.appendChild(qfoot);

    section.appendChild(qDiv);

    ALL_Q.push({
      id: qid, legacyId: legacyQid, num: qGlobal, sec: secId, secTitle: sec.title, originalSection: section,
      q: item.q, o: item.o, a: item.a, el: qDiv
    });
  });

  mainEl.appendChild(section);
});

migrateLegacyStateIds();

/* تطبيق الحالة الأولية */
ALL_Q.forEach(item => {
  const el = item.el;
  if (state.fav[item.id]) { el.classList.add('fav'); el.querySelector('.btn-fav').classList.add('on'); }
  if (state.mastered[item.id]) { el.classList.add('mastered'); el.querySelector('.btn-mastered').classList.add('mastered-on'); }
  if (state.revealed[item.id]) el.classList.add('revealed');
  const errTag = el.querySelector('.tag.err');
  if (state.wrong[item.id] > 0) { errTag.classList.remove('hidden'); errTag.textContent = 'أخطأت ' + state.wrong[item.id]; }
});

/* =========================================================
   ✅ نسخ إلى الحافظة (مع Fallback)
   ========================================================= */
function copyToClipboard(text){
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    try{
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      ta.setAttribute('readonly', '');
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('execCommand failed'));
    }catch(e){ reject(e); }
  });
}

/* =========================================================
   Toast
   ========================================================= */
let toastTimer = null;
function showToast(msg, dur=1800){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), dur);
}

/* =========================================================
   الأحداث
   ========================================================= */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.qactions button');
  if (btn) {
    const card = btn.closest('.q');
    const qid = card.dataset.qid;
    const item = ALL_Q.find(x => x.id === qid);

    if (btn.classList.contains('btn-fav')) {
      state.fav[qid] = !state.fav[qid];
      btn.classList.toggle('on', state.fav[qid]);
      card.classList.toggle('fav', state.fav[qid]);
      saveState(); updateStats();
    } else if (btn.classList.contains('btn-mastered')) {
      state.mastered[qid] = !state.mastered[qid];
      btn.classList.toggle('mastered-on', state.mastered[qid]);
      card.classList.toggle('mastered', state.mastered[qid]);
      saveState(); updateStats();
      checkCertificate();
    } else if (btn.classList.contains('btn-copy')) {
      const txt = item.q + '\n' + item.o.map((o,i) => String.fromCharCode(65+i)+') '+o).join('\n');
      copyToClipboard(txt).then(() => {
        btn.classList.add('copied');
        btn.textContent = '✅';
        showToast('✅ تم نسخ السؤال');
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = '📋';
        }, 1200);
      }).catch(() => {
        showToast('❌ تعذّر النسخ');
      });
    } else if (btn.classList.contains('btn-share')) {
      const txt = encodeURIComponent(item.q + '\n' + item.o.map((o,i) => String.fromCharCode(65+i)+') '+o).join('\n'));
      window.open('https://wa.me/?text=' + txt, '_blank');
    }
    saveState(); updateStats();
    e.stopPropagation();
    return;
  }

  const li = e.target.closest('.q ol.o li');
  const card = e.target.closest('.q');
  if (!card) return;
  const qid = card.dataset.qid;
  const item = ALL_Q.find(x => x.id === qid);

  if (currentMode === 'quiz' && quizStarted && li && activeQuizIds.includes(qid) && !card.classList.contains('answered')) {
    const chosen = +li.dataset.idx;
    const correct = item.a;
    quizAnswers[qid] = chosen;
    card.classList.add('answered');
    card.querySelectorAll('ol.o li').forEach(x => {
      const i = +x.dataset.idx;
      if (i === correct) x.classList.add('correct');
      else if (i === chosen) x.classList.add('wrong');
    });

    if (chosen === correct) {
      state.correct[qid] = (state.correct[qid]||0)+1;
      state.quizScore.c++;
      currentStreak++;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
      state.streak = currentStreak;
      state.bestStreak = bestStreak;
      showStreakPopup(currentStreak);
      beep(880, 0.1);
    } else {
      state.wrong[qid] = (state.wrong[qid]||0)+1;
      state.quizScore.w++;
      currentStreak = 0;
      state.streak = 0;
      beep(220, 0.2);
      const tag = card.querySelector('.tag.err');
      tag.textContent = 'أخطأت ' + state.wrong[qid];
      tag.classList.remove('hidden');
    }
    saveState(); saveQuizSession(); updateStats();
    checkQuizCompletion();
  } else if (currentMode === 'study') {
    card.classList.toggle('revealed');
    state.revealed[qid] = card.classList.contains('revealed');
    saveState();
    updateStats();
  }
});

/* =========================================================
   صوت
   ========================================================= */
let audioCtx = null;
function beep(freq, dur){
  try{
    if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    osc.connect(gain); gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
  }catch(e){}
}

/* =========================================================
   الإحصائيات
   ========================================================= */
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

function showStreakPopup(n){
  if (n < 2) return;
  const popup = document.getElementById('streakPopup');
  popup.textContent = '🔥 سلسلة ' + n + ' إجابات صحيحة!';
  popup.classList.add('show');
  setTimeout(() => popup.classList.remove('show'), 1600);
}

function checkCertificate(){
  const total = ALL_Q.length;
  const mastered = Object.keys(state.mastered).filter(k => state.mastered[k]).length;
  if (mastered === total && total > 0 && !certShown) {
    certShown = true;
    document.getElementById('certScore').textContent = 'أتقنت ' + mastered + ' من ' + total + ' سؤالاً 🎉';
    document.getElementById('certModal').classList.add('show');
  }
}

/* =========================================================
   الأزرار العلوية
   ========================================================= */
document.querySelectorAll('.topbar button').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;

    if (action === 'dark') {
      state.dark = !state.dark;
      document.body.classList.toggle('dark', state.dark);
      btn.textContent = state.dark ? '☀️ نهاري' : '🌙 ليلي';
      btn.classList.toggle('active', state.dark);
      saveState();
    }
    else if (action === 'toggle-reveal') {
      revealAllState = !revealAllState;
      if (revealAllState) {
        ALL_Q.forEach(x => {
          x.el.classList.add('revealed');
          state.revealed[x.id] = true;
        });
        btn.textContent = '🙈 إخفاء الكل';
        showToast('✅ تم إظهار ' + ALL_Q.length + ' إجابة');
      } else {
        ALL_Q.forEach(x => {
          x.el.classList.remove('revealed');
          state.revealed[x.id] = false;
        });
        btn.textContent = '👁 إظهار الكل';
        showToast('✅ تم إخفاء الإجابات');
      }
      saveState(); updateStats();
    }
    else if (action === 'shuffle') {
      shuffleAll();
      showToast('🔀 تم خلط الأسئلة');
    }
    else if (action === 'reset') {
      document.getElementById('resetModal').classList.add('show');
    }
    else if (action === 'stats') {
      openStatsModal();
    }
    else if (action === 'focus') {
      toggleFocusMode(btn);
    }
    else if (action === 'mode-study') {
      switchMode('study');
      document.querySelectorAll('.topbar button').forEach(b => {
        if (b.dataset.action.startsWith('mode-')) b.classList.remove('active');
      });
      btn.classList.add('active');
    }
    else if (action === 'mode-quiz') {
      currentMode = 'quiz';
      document.querySelectorAll('.topbar button').forEach(b => {
        if (b.dataset.action.startsWith('mode-')) b.classList.remove('active');
      });
      btn.classList.add('active');
      requestStartQuiz(false);
    }
    else if (action === 'mode-flash') {
      switchMode('flash');
      document.querySelectorAll('.topbar button').forEach(b => {
        if (b.dataset.action.startsWith('mode-')) b.classList.remove('active');
      });
      btn.classList.add('active');
    }
    else if (action === 'print') {
      window.print();
    }
    else if (action === 'export-menu') {
      document.getElementById('exportMenuModal').classList.add('show');
    }
    else if (action === 'install') {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(c => {
          if (c.outcome === 'accepted') btn.style.display = 'none';
        });
      }
    }
  });
});

/* قائمة التصدير */
document.querySelectorAll('#exportMenuModal .menu-list button').forEach(btn => {
  btn.addEventListener('click', () => {
    const menu = btn.dataset.menu;
    document.getElementById('exportMenuModal').classList.remove('show');

    if (menu === 'csv-all') exportCSV(false);
    else if (menu === 'csv-fav') exportCSV(true);
    else if (menu === 'backup') downloadBackup();
    else if (menu === 'restore') {
      setTimeout(() => document.getElementById('restoreModal').classList.add('show'), 250);
    }
  });
});

/* =========================================================
   وضع التركيز
   ========================================================= */
function toggleFocusMode(btn){
  focusMode = !focusMode;
  document.body.classList.toggle('focus-mode', focusMode);
  if (btn) btn.classList.toggle('active', focusMode);

  if (focusMode) {
    const visible = getVisibleQuestions();
    if (visible.length === 0) {
      showToast('⚠️ لا توجد أسئلة ظاهرة');
      focusMode = false;
      document.body.classList.remove('focus-mode');
      if (btn) btn.classList.remove('active');
      return;
    }
    const currentTop = visible.findIndex(x => x.el.getBoundingClientRect().top > -100);
    focusIdx = currentTop >= 0 ? currentTop : 0;
    activateFocusCard(visible[focusIdx].el);
    visible[focusIdx].el.scrollIntoView({behavior:'smooth', block:'center'});
    showToast('🎯 وضع التركيز — استخدم الأزرار في الأسفل');
  } else {
    ALL_Q.forEach(x => x.el.classList.remove('focus-active'));
    showToast('✅ تم إلغاء وضع التركيز');
  }
}

function activateFocusCard(card){
  ALL_Q.forEach(x => x.el.classList.remove('focus-active'));
  card.classList.add('focus-active');
}

function focusNext(){
  const visible = getVisibleQuestions();
  if (visible.length === 0) return;
  focusIdx = (focusIdx + 1) % visible.length;
  const target = visible[focusIdx];
  target.el.scrollIntoView({behavior:'smooth', block:'center'});
  activateFocusCard(target.el);
}

function focusPrev(){
  const visible = getVisibleQuestions();
  if (visible.length === 0) return;
  focusIdx = (focusIdx - 1 + visible.length) % visible.length;
  const target = visible[focusIdx];
  target.el.scrollIntoView({behavior:'smooth', block:'center'});
  activateFocusCard(target.el);
}

function exitFocusMode(){
  focusMode = false;
  document.body.classList.remove('focus-mode');
  ALL_Q.forEach(x => x.el.classList.remove('focus-active'));
  const btn = document.querySelector('[data-action="focus"]');
  if (btn) btn.classList.remove('active');
  showToast('✅ تم إلغاء وضع التركيز');
}

/* =========================================================
   الاختبار
   ========================================================= */

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
    ALL_Q.forEach(q => {
      q.el.classList.remove('quiz-mode', 'answered', 'grade-correct-mark', 'grade-wrong-mark');
      q.el.classList.toggle('revealed', mode === 'study' && !!state.revealed[q.id]);
    });
    activeQuizIds = [];
    quizAnswers = {};
    applyFilters();
    updateStats();
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

/* =========================================================
   البطاقات
   ========================================================= */

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

/* =========================================================
   خلط
   ========================================================= */
function shuffleAll(){
  const sections = Array.from(document.querySelectorAll('section'));
  sections.forEach(sec => {
    const cards = Array.from(sec.querySelectorAll('.q'));
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const a = cards[i], b = cards[j];
      const parent = a.parentNode;
      if (a.nextSibling === b) parent.insertBefore(b, a);
      else if (b.nextSibling === a) parent.insertBefore(a, b);
      else {
        const ph = document.createElement('div');
        parent.insertBefore(ph, a);
        parent.insertBefore(a, b);
        parent.insertBefore(b, ph);
        parent.removeChild(ph);
      }
    }
  });
}

/* =========================================================
   البحث + الفلترة
   ========================================================= */

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
  if (currentMode === 'review') {
    currentMode = 'study';
    ALL_Q.forEach(q => {
      q.el.classList.remove('quiz-mode', 'answered', 'grade-correct-mark', 'grade-wrong-mark');
      q.el.classList.toggle('revealed', !!state.revealed[q.id]);
    });
    activeQuizIds = [];
    quizAnswers = {};
  }
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

/* =========================================================
   إعادة الضبط
   ========================================================= */
const resetAll = document.getElementById('resetAll');
resetAll.addEventListener('change', (e) => {
  document.querySelectorAll('.reset-options input[type=checkbox]:not(#resetAll)')
    .forEach(b => b.checked = e.target.checked);
});

document.getElementById('resetCancel').addEventListener('click', () => {
  document.getElementById('resetModal').classList.remove('show');
  resetAll.checked = false;
  document.querySelectorAll('.reset-options input[type=checkbox]:not(#resetAll)')
    .forEach(b => b.checked = false);
});

document.getElementById('resetConfirm').addEventListener('click', () => {
  const selected = Array.from(document.querySelectorAll('.reset-options input[type=checkbox]:checked'))
    .map(b => b.value);

  if (selected.length === 0) {
    alert('⚠️ اختر على الأقل خياراً واحداً');
    return;
  }

  const doAll = selected.includes('all');
  if (doAll || selected.includes('fav')) state.fav = {};
  if (doAll || selected.includes('mastered')) state.mastered = {};
  if (doAll || selected.includes('wrong')) state.wrong = {};
  if (doAll || selected.includes('revealed')) state.revealed = {};
  if (doAll || selected.includes('quiz')) {
    state.correct = {};
    state.quizScore = {c:0,w:0};
    state.streak = 0;
    state.bestStreak = 0;
    state.quizSession = null;
    state.lastQuizWrongIds = [];
  }

  saveState();
  document.getElementById('resetModal').classList.remove('show');
  location.reload();
});

/* =========================================================
   الإحصائيات
   ========================================================= */
function openStatsModal(){
  const total = ALL_Q.length;
  const mastered = Object.keys(state.mastered).filter(k => state.mastered[k]).length;
  const fav = Object.keys(state.fav).filter(k => state.fav[k]).length;
  const revealed = Object.keys(state.revealed).filter(k => state.revealed[k]).length;
  const c = state.quizScore.c, w = state.quizScore.w;
  const totalAnswers = c + w;
  const accuracy = totalAnswers > 0 ? Math.round(c/totalAnswers*100) : 0;

  const wrongBySec = {};
  ALL_Q.forEach(q => {
    if (state.wrong[q.id]) {
      wrongBySec[q.secTitle] = (wrongBySec[q.secTitle] || 0) + state.wrong[q.id];
    }
  });
  const maxWrong = Math.max(1, ...Object.values(wrongBySec));

  let html = `
    <div class="stat-row"><span>إجمالي الأسئلة</span><b>${total}</b></div>
    <div class="stat-row"><span>الإجابات المكتشفة</span><b>${revealed} (${Math.round(revealed/total*100)}%)</b></div>
    <div class="stat-row"><span>الأسئلة المتقنة</span><b>${mastered} (${Math.round(mastered/total*100)}%)</b></div>
    <div class="stat-row"><span>المفضلة</span><b>${fav}</b></div>
    <div class="stat-row"><span>إجابات صحيحة</span><b>${c}</b></div>
    <div class="stat-row"><span>إجابات خاطئة</span><b>${w}</b></div>
    <div class="stat-row"><span>نسبة الدقة</span><b>${accuracy}%</b></div>
    <div class="stat-row"><span>🔥 أفضل سلسلة</span><b>${state.bestStreak || 0}</b></div>
  `;

  if (Object.keys(wrongBySec).length > 0) {
    html += '<h4 style="margin:16px 0 8px;color:var(--brand)">📊 الأخطاء حسب القسم</h4>';
    html += '<div class="bar-chart">';
    Object.entries(wrongBySec).sort((a,b) => b[1]-a[1]).forEach(([sec, cnt]) => {
      const pct = Math.round(cnt / maxWrong * 100);
      html += `
        <div class="bar-row">
          <span class="bar-label">${sec.length > 20 ? sec.substring(0,20)+'…' : sec}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
          <span style="min-width:32px;text-align:left;color:var(--err);font-weight:700">${cnt}</span>
        </div>
      `;
    });
    html += '</div>';
  }

  document.getElementById('statsContent').innerHTML = html;
  document.getElementById('statsModal').classList.add('show');
}

/* =========================================================
   CSV
   ========================================================= */

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

/* =========================================================
   نسخة احتياطية
   ========================================================= */

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

/* =========================================================
   رابط مباشر
   ========================================================= */
if (location.hash) {
  const target = document.querySelector(location.hash);
  if (target) {
    setTimeout(() => {
      target.scrollIntoView({behavior:'smooth', block:'center'});
      target.classList.add('highlight');
      setTimeout(() => target.classList.remove('highlight'), 1500);
    }, 300);
  }
}

/* =========================================================
   أزرار التمرير (للأعلى + للأسفل)
   ========================================================= */
const toTopBtn = document.getElementById('toTop');
const toBottomBtn = document.getElementById('toBottom');
const topStopQuizBtn = document.getElementById('stopQuizBtn');
const floatStopQuizBtn = document.getElementById('stopQuizFloatBtn');
if (topStopQuizBtn) topStopQuizBtn.addEventListener('click', stopQuizNow);
if (floatStopQuizBtn) floatStopQuizBtn.addEventListener('click', stopQuizNow);


window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  const isNearTop = y < 100;
  const isNearBottom = y > maxY - 100;

  toTopBtn.classList.toggle('hidden-btn', isNearTop);
  toBottomBtn.classList.toggle('hidden-btn', isNearBottom);

  const stickyBar = document.getElementById('stickyBar');
  stickyBar.classList.toggle('show', y > 300);

  const sections = document.querySelectorAll('section:not(.hidden)');
  let current = null;
  for (const s of sections) {
    const rect = s.getBoundingClientRect();
    if (rect.top <= 100) current = s;
  }
  if (current) {
    const title = current.querySelector('.sec-title');
    if (title) document.getElementById('sbText').textContent = title.textContent.trim();
  }
});

toTopBtn.addEventListener('click', () => {
  window.scrollTo({top:0, behavior:'smooth'});
});

toBottomBtn.addEventListener('click', () => {
  window.scrollTo({top: document.documentElement.scrollHeight, behavior:'smooth'});
});

/* =========================================================
   الحالة الأولية
   ========================================================= */
if (state.dark) {
  document.body.classList.add('dark');
  const b = document.querySelector('[data-action="dark"]');
  b.textContent = '☀️ نهاري'; b.classList.add('active');
}

updateStats();
applyFilters();

/* =========================================================
   كيبورد
   ========================================================= */
document.addEventListener('keydown', (e) => {
  if (currentMode === 'flash') {
    if (e.key === 'ArrowRight') flashPrev();
    if (e.key === 'ArrowLeft') flashNext();
    if (e.key === ' ') { e.preventDefault(); document.getElementById('flashCard').classList.toggle('flipped'); }
    return;
  }
  if (focusMode) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); focusNext(); }
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); focusPrev(); }
    if (e.key === 'Escape') { e.preventDefault(); exitFocusMode(); }
    return;
  }
  if (currentMode === 'quiz' && quizStarted && ['1','2','3','4'].includes(e.key)) {
    const visible = ALL_Q.filter(x => !x.el.classList.contains('hidden') && !x.el.classList.contains('answered'));
    if (visible.length > 0) {
      const firstCard = visible[0].el;
      const idx = +e.key - 1;
      const li = firstCard.querySelector(`ol.o li[data-idx="${idx}"]`);
      if (li) li.click();
    }
  }
});

/* =========================================================
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

/* =========================================================
   حفظ جلسة الاختبار
   ========================================================= */
window.addEventListener('beforeunload', () => { if (quizStarted) saveQuizSession(); });
ensureResumeModal();
setTimeout(() => { if (state.quizSession && !quizStarted) showResumeModal(); }, 250);

