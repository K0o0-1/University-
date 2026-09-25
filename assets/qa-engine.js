
/* =========================================================
   البيانات — 100 سؤال مباشر
   ========================================================= */
const MATERIAL = window.MATERIAL_DATA?.meta || {};
const SECTIONS = window.MATERIAL_DATA?.sections || [];

/* =========================================================
   الحالة العامة
   ========================================================= */
const LS_KEY = MATERIAL.storageKey || 'study_qa_state_v1';
const QID = (n) => 'q' + n;
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
  quizSession:null
};
try{ Object.assign(state, JSON.parse(localStorage.getItem(LS_KEY)||'{}')); }catch(e){}
['fav','mastered','wrong','revealed','correct'].forEach(k => state[k] = state[k] || {});
state.quizScore = state.quizScore || {c:0,w:0};

function saveState(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){}
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
  opt.value = secId; opt.textContent = sec.title;
  secFilter.appendChild(opt);

  const a = document.createElement('a');
  a.href = '#' + secId;
  a.textContent = (si + 1) + '. ' + sec.title + ' (' + sec.badge + ')';
  indexEl.appendChild(a);

  const section = document.createElement('section');
  section.id = secId;

  const h = document.createElement('div');
  h.className = 'sec-title';
  h.innerHTML = `<span class="badge">${sec.badge}</span> ${sec.title}`;
  section.appendChild(h);

  sec.qs.forEach(item => {
    qGlobal++;
    const qid = QID(qGlobal);

    const qDiv = document.createElement('div');
    qDiv.className = 'q';
    qDiv.id = qid;
    qDiv.dataset.qid = qid;
    qDiv.dataset.sec = secId;

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

    /* صندوق الإجابة */
    const ansBox = document.createElement('div');
    ansBox.className = 'answer-box';
    ansBox.innerHTML = `
      <div class="ans-label"></div>
      <div class="ans-text"></div>
    `;
    ansBox.querySelector('.ans-text').textContent = item.a;
    qDiv.appendChild(ansBox);

    /* زر عرض الإجابة في وضع الاختبار */
    const showBtn = document.createElement('button');
    showBtn.className = 'show-answer-btn';
    showBtn.textContent = '👁 عرض الإجابة';
    showBtn.type = 'button';
    qDiv.appendChild(showBtn);

    /* أزرار التقييم الذاتي */
    const gradeBtns = document.createElement('div');
    gradeBtns.className = 'grade-btns';
    gradeBtns.innerHTML = `
      <button type="button" class="grade-correct">✅ أعرفها</button>
      <button type="button" class="grade-wrong">❌ لا أعرفها</button>
    `;
    qDiv.appendChild(gradeBtns);

    const qfoot = document.createElement('div');
    qfoot.className = 'qfoot';
    qfoot.innerHTML = `<span class="tag err hidden">أخطأت 0</span>`;
    qDiv.appendChild(qfoot);

    section.appendChild(qDiv);

    ALL_Q.push({
      id: qid, num: qGlobal, sec: secId, secTitle: sec.title,
      q: item.q, a: item.a, el: qDiv
    });
  });

  mainEl.appendChild(section);
});

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
   نسخ
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
      ta.setAttribute('readonly', '');
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('failed'));
    }catch(e){ reject(e); }
  });
}

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
  /* أزرار داخل السؤال */
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
      const txt = '❓ ' + item.q + '\n✅ ' + item.a;
      copyToClipboard(txt).then(() => {
        btn.classList.add('copied');
        btn.textContent = '✅';
        showToast('✅ تم نسخ السؤال والإجابة');
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.textContent = '📋';
        }, 1200);
      }).catch(() => showToast('❌ تعذّر النسخ'));
    } else if (btn.classList.contains('btn-share')) {
      const txt = encodeURIComponent('❓ ' + item.q + '\n✅ ' + item.a);
      window.open('https://wa.me/?text=' + txt, '_blank');
    }
    e.stopPropagation();
    return;
  }

  /* زر عرض الإجابة في وضع الاختبار */
  const showBtn = e.target.closest('.show-answer-btn');
  if (showBtn) {
    const card = showBtn.closest('.q');
    card.classList.add('revealed');
    state.revealed[card.dataset.qid] = true;
    saveState();
    e.stopPropagation();
    return;
  }

  /* أزرار التقييم الذاتي */
  const gradeBtn = e.target.closest('.grade-btns button');
  if (gradeBtn) {
    const card = gradeBtn.closest('.q');
    const qid = card.dataset.qid;
    const item = ALL_Q.find(x => x.id === qid);
    const isCorrect = gradeBtn.classList.contains('grade-correct');

    card.classList.add('answered');
    card.classList.remove('grade-correct-mark', 'grade-wrong-mark');
    card.classList.add(isCorrect ? 'grade-correct-mark' : 'grade-wrong-mark');

    if (isCorrect) {
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
    saveState(); updateStats();
    checkQuizCompletion();
    e.stopPropagation();
    return;
  }

  /* النقر على البطاقة نفسها */
  const card = e.target.closest('.q');
  if (!card) return;

  if (currentMode === 'study') {
    card.classList.toggle('revealed');
    state.revealed[card.dataset.qid] = card.classList.contains('revealed');
    saveState();
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
  const revealed = Object.keys(state.revealed).filter(k => state.revealed[k]).length;
  const fav = Object.keys(state.fav).filter(k => state.fav[k]).length;
  const mastered = Object.keys(state.mastered).filter(k => state.mastered[k]).length;

  document.getElementById('statProgress').textContent = revealed + '/' + total;
  document.getElementById('statFav').textContent = fav;
  document.getElementById('statMastered').textContent = mastered;
  document.getElementById('progressFill').style.width = (revealed/total*100) + '%';
  document.getElementById('sbFill').style.width = (revealed/total*100) + '%';
  document.getElementById('sbPct').textContent = Math.round(revealed/total*100) + '%';
  document.getElementById('statStreak').textContent = state.streak || 0;

  const c = state.quizScore.c, w = state.quizScore.w;
  if (c || w) document.getElementById('statScore').textContent = c + ' أعرفها / ' + w + ' لا أعرفها';
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
      setMode('study');
      document.querySelectorAll('.topbar button').forEach(b => {
        if (b.dataset.action.startsWith('mode-')) b.classList.remove('active');
      });
      btn.classList.add('active');
    }
    else if (action === 'mode-quiz') {
      setMode('quiz');
      document.querySelectorAll('.topbar button').forEach(b => {
        if (b.dataset.action.startsWith('mode-')) b.classList.remove('active');
      });
      btn.classList.add('active');
      startQuiz(false);
    }
    else if (action === 'mode-flash') {
      setMode('flash');
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
   الأوضاع
   ========================================================= */
function setMode(mode){
  currentMode = mode;
  document.body.classList.toggle('flash', mode === 'flash');
  ALL_Q.forEach(x => {
    x.el.classList.toggle('quiz-mode', mode === 'quiz');
    if (mode !== 'quiz') {
      x.el.classList.remove('answered', 'grade-correct-mark', 'grade-wrong-mark');
    }
  });
  if (mode === 'flash') { flashIdx = 0; updateFlash(); }
}

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

function getVisibleQuestions(){
  return ALL_Q.filter(x => !x.el.classList.contains('hidden'));
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
   الاختبار الذاتي
   ========================================================= */
function startQuiz(onlyWrong){
  const list = onlyWrong ? getWrongQuestions() : ALL_Q;
  if (onlyWrong && list.length === 0) {
    alert('🎉 لا توجد أسئلة أخطأت فيها!');
    return;
  }
  ALL_Q.forEach(x => {
    x.el.classList.remove('answered', 'revealed', 'grade-correct-mark', 'grade-wrong-mark');
    if (onlyWrong) {
      const shouldShow = list.some(q => q.id === x.id);
      x.el.classList.toggle('hidden', !shouldShow);
    } else {
      x.el.classList.remove('hidden');
    }
  });
  document.querySelectorAll('section').forEach(sec => {
    sec.classList.toggle('hidden', !sec.querySelector('.q:not(.hidden)'));
  });

  state.quizScore = {c:0,w:0};
  state.revealed = {};
  currentStreak = 0;
  state.streak = 0;
  saveState(); updateStats();
  revealAllState = false;
  document.getElementById('toggleRevealBtn').textContent = '👁 إظهار الكل';

  document.getElementById('statTime').textContent = '00:00';
  quizStartTime = Date.now();
  if (quizTimerId) clearInterval(quizTimerId);
  quizTimerId = setInterval(updateTimeElapsed, 1000);
  document.getElementById('quizResult').classList.remove('show');
  quizStarted = true;
  showToast('📝 اقرأ السؤال، ثم اضغط "عرض الإجابة" وقيّم نفسك');
}

function getWrongQuestions(){
  return ALL_Q.filter(q => (state.wrong[q.id]||0) > 0);
}

function updateTimeElapsed(){
  if (!quizStartTime) return;
  const elapsed = Math.floor((Date.now() - quizStartTime)/1000);
  const remaining = ALL_Q.filter(q => !q.el.classList.contains('answered') && !q.el.classList.contains('hidden')).length;
  const est = remaining * 15;

  const m = String(Math.floor(elapsed/60)).padStart(2,'0');
  const ss = String(elapsed%60).padStart(2,'0');
  const rm = String(Math.floor(est/60)).padStart(2,'0');
  const rs = String(est%60).padStart(2,'0');

  document.getElementById('statTime').textContent = m+':'+ss + ' ⏳ ' + rm+':'+rs;
}

function checkQuizCompletion(){
  const visible = ALL_Q.filter(q => !q.el.classList.contains('hidden'));
  const answered = visible.filter(q => q.el.classList.contains('answered')).length;
  if (answered === visible.length && visible.length > 0) {
    showQuizResult();
  }
}

function showQuizResult(){
  if (quizTimerId) clearInterval(quizTimerId);
  const c = state.quizScore.c, w = state.quizScore.w;
  const total = c + w;
  const pct = total > 0 ? Math.round(c/total*100) : 0;

  document.getElementById('qrScore').textContent = c + ' / ' + total + '  (' + pct + '%)';
  document.getElementById('qrMsg').textContent = pct >= 90 ? '🎉 ممتاز!' :
    pct >= 70 ? '👍 جيد جداً' : pct >= 50 ? '📚 استمر في المراجعة' : '💪 يحتاج مراجعة';

  const review = document.getElementById('qrReview');
  const wrongList = ALL_Q.filter(q => q.el.classList.contains('grade-wrong-mark'));
  review.innerHTML = wrongList.length === 0
    ? '<p style="text-align:center;color:var(--ok);font-weight:700">🎉 لا توجد أخطاء!</p>'
    : '<h4 style="margin:0 0 8px;color:var(--err)">❌ راجع هذه الأسئلة:</h4>' +
      wrongList.map(q => `
        <div class="qr-review-item">
          <b>س${q.num}:</b> ${q.q}
          <span class="ans">✔ الإجابة: ${q.a}</span>
        </div>
      `).join('');

  document.getElementById('quizResult').classList.add('show');
  document.getElementById('quizResult').scrollIntoView({behavior:'smooth', block:'center'});
}

function retryWrongOnly(){
  startQuiz(true);
}

/* =========================================================
   البطاقات
   ========================================================= */
let flashIdx = 0;
function updateFlash(){
  const item = ALL_Q[flashIdx];
  if (!item) return;
  document.getElementById('fcQ').textContent = item.num + ' ' + item.q;
  document.getElementById('fcA').textContent = item.a;
  document.getElementById('flashCard').classList.remove('flipped');
}
function flashNext(){ flashIdx = (flashIdx + 1) % ALL_Q.length; updateFlash(); }
function flashPrev(){ flashIdx = (flashIdx - 1 + ALL_Q.length) % ALL_Q.length; updateFlash(); }
document.getElementById('flashCard').addEventListener('click', function(){
  this.classList.toggle('flipped');
});

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
const sortBy = document.getElementById('sortBy');

function applyFilters(){
  const term = searchInput.value.trim().toLowerCase();
  const secId = secFilter.value;
  const sort = sortBy.value;
  let visible = 0;

  ALL_Q.forEach(item => {
    const qEl = item.el;
    const text = qEl.textContent.toLowerCase();
    const matchTerm = !term || text.includes(term);
    const matchSec = !secId || qEl.dataset.sec === secId;
    let matchSort = true;
    if (sort === 'wrong') matchSort = (state.wrong[item.id]||0) > 0;
    if (sort === 'unmastered') matchSort = !state.mastered[item.id];
    if (sort === 'fav') matchSort = !!state.fav[item.id];

    const show = matchTerm && matchSec && matchSort;
    qEl.classList.toggle('hidden', !show);
    if (show) visible++;
  });

  document.querySelectorAll('section').forEach(sec => {
    sec.classList.toggle('hidden', !sec.querySelector('.q:not(.hidden)'));
  });

  document.getElementById('emptyMsg').style.display = visible ? 'none' : 'block';
}

searchInput.addEventListener('input', applyFilters);
secFilter.addEventListener('change', applyFilters);
sortBy.addEventListener('change', applyFilters);
document.getElementById('clearBtn').addEventListener('click', () => {
  searchInput.value = ''; secFilter.value = ''; sortBy.value = 'default';
  applyFilters(); searchInput.focus();
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
    <div class="stat-row"><span>أعرفها</span><b>${c}</b></div>
    <div class="stat-row"><span>لا أعرفها</span><b>${w}</b></div>
    <div class="stat-row"><span>نسبة الإتقان</span><b>${accuracy}%</b></div>
    <div class="stat-row"><span>🔥 أفضل سلسلة</span><b>${state.bestStreak || 0}</b></div>
  `;

  if (Object.keys(wrongBySec).length > 0) {
    html += '<h4 style="margin:16px 0 8px;color:var(--brand)">📊 الأسئلة الصعبة حسب القسم</h4>';
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
  if (onlyFav && list.length === 0) {
    alert('⚠️ لا توجد أسئلة في المفضلة');
    return;
  }
  const rows = [['#','القسم','السؤال','الإجابة']];
  list.forEach(item => {
    rows.push([item.num, item.secTitle, item.q, item.a]);
  });
  const csv = '\uFEFF' + rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = onlyFav ? (MATERIAL.slug + '-favorites.csv') : (MATERIAL.slug + '-questions-answers.csv');
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 تم تنزيل CSV');
}

/* =========================================================
   نسخة احتياطية
   ========================================================= */
function downloadBackup(){
  const data = {
    version: 1,
    type: MATERIAL.slug || 'qa',
    exported: new Date().toISOString(),
    state: state
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = MATERIAL.slug + '-backup-' + new Date().toISOString().split('T')[0] + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('💾 تم تنزيل النسخة الاحتياطية');
}

document.getElementById('restoreConfirm').addEventListener('click', () => {
  const file = document.getElementById('restoreFile').files[0];
  if (!file) { alert('⚠️ اختر ملف JSON أولاً'); return; }
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.state) throw new Error('ملف غير صالح');
      if (!confirm('⚠️ سيتم استبدال كل تقدمك الحالي. متابعة؟')) return;
      localStorage.setItem(LS_KEY, JSON.stringify(data.state));
      alert('✅ تمت الاستعادة بنجاح');
      location.reload();
    } catch (err) {
      alert('❌ فشل قراءة الملف: ' + err.message);
    }
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
   أزرار التمرير
   ========================================================= */
const toTopBtn = document.getElementById('toTop');
const toBottomBtn = document.getElementById('toBottom');

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

toTopBtn.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
toBottomBtn.addEventListener('click', () => window.scrollTo({top: document.documentElement.scrollHeight, behavior:'smooth'}));

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
  if (currentMode === 'quiz') {
    if (e.key === 'Enter' || e.key === ' ') {
      /* عرض الإجابة للسؤال الحالي غير المُجاب */
      const visible = ALL_Q.filter(x => !x.el.classList.contains('hidden') && !x.el.classList.contains('answered'));
      if (visible.length > 0) {
        e.preventDefault();
        visible[0].el.querySelector('.show-answer-btn')?.click();
      }
    }
    if (e.key === '1') {
      const visible = ALL_Q.filter(x => !x.el.classList.contains('hidden') && x.el.classList.contains('revealed') && !x.el.classList.contains('answered'));
      if (visible.length > 0) visible[0].el.querySelector('.grade-correct')?.click();
    }
    if (e.key === '2') {
      const visible = ALL_Q.filter(x => !x.el.classList.contains('hidden') && x.el.classList.contains('revealed') && !x.el.classList.contains('answered'));
      if (visible.length > 0) visible[0].el.querySelector('.grade-wrong')?.click();
    }
  }
});

/* =========================================================
   PWA
   ========================================================= */
(function initPWA(){
  const manifest = {
    name: MATERIAL.title || 'Study Material',
    short_name: MATERIAL.shortName || MATERIAL.title || 'Study',
    description: MATERIAL.description || MATERIAL.subtitle || '',
    start_url: '.',
    display: 'standalone',
    background_color: '#1f5fd6',
    theme_color: '#1f5fd6',
    orientation: 'portrait',
    lang: 'ar',
    dir: 'rtl',
    icons: [
      {
        src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%233b82f6'/><text x='50' y='65' font-size='55' text-anchor='middle' fill='white' font-family='Arial'>🔒</text></svg>",
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any maskable'
      },
      {
        src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%233b82f6'/><text x='50' y='65' font-size='55' text-anchor='middle' fill='white' font-family='Arial'>🔒</text></svg>",
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable'
      }
    ]
  };
  const manifestBlob = new Blob([JSON.stringify(manifest)], {type:'application/manifest+json'});
  document.getElementById('manifestLink').href = URL.createObjectURL(manifestBlob);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const swCode = `
      const CACHE = (MATERIAL.slug || 'qa') + '-eai-v1';
      self.addEventListener('install', e => { self.skipWaiting(); });
      self.addEventListener('activate', e => { e.waitUntil(clients.claim()); });
      self.addEventListener('fetch', e => {
        e.respondWith(
          fetch(e.request).then(resp => {
            const copy = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy)).catch(()=>{});
            return resp;
          }).catch(() => caches.match(e.request))
        );
      });
    `;
    const swBlob = new Blob([swCode], {type:'application/javascript'});
    const swUrl = URL.createObjectURL(swBlob);
    navigator.serviceWorker.register(swUrl).catch(err => console.warn('SW failed:', err));
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    document.getElementById('installBtn').style.display = 'inline-flex';
  });
})();

/* =========================================================
   حفظ جلسة الاختبار
   ========================================================= */
window.addEventListener('beforeunload', () => {
  if (quizStarted && quizStartTime) {
    state.quizSession = {
      startedAt: quizStartTime,
      score: state.quizScore,
      streak: currentStreak
    };
    saveState();
  }
});

if (state.quizSession && state.quizSession.score &&
    (state.quizSession.score.c + state.quizSession.score.w) > 0) {
  setTimeout(() => {
    if (confirm('⏸ لديك جلسة اختبار سابقة. هل تريد استئنافها؟')) {
      state.quizScore = state.quizSession.score;
      currentStreak = state.quizSession.streak || 0;
      quizStartTime = state.quizSession.startedAt;
      quizStarted = true;
      document.querySelector('[data-action="mode-quiz"]').click();
    } else {
      state.quizSession = null;
      saveState();
    }
  }, 1500);
}
