(() => {
  if (typeof ALL_Q === 'undefined' || typeof MATERIAL === 'undefined') return;

  const isQA = MATERIAL.kind === 'qa';
  const stopBtn = document.getElementById('stopQuizBtn');
  const originalStartQuiz = startQuiz;
  const originalShowQuizResult = showQuizResult;
  const originalSetMode = setMode;
  const originalShuffleAll = shuffleAll;

  bestStreak = Math.max(Number(bestStreak) || 0, Number(state.bestStreak) || 0);
  currentStreak = Number(state.streak) || 0;

  function orderedQuestions() {
    return ALL_Q.slice().sort((a, b) => {
      if (a.el === b.el) return 0;
      const pos = a.el.compareDocumentPosition(b.el);
      return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
  }

  getVisibleQuestions = function () {
    return orderedQuestions().filter(q => !q.el.classList.contains('hidden'));
  };

  updateFlash = function () {
    const list = orderedQuestions();
    if (!list.length) return;
    flashIdx = ((flashIdx % list.length) + list.length) % list.length;
    const item = list[flashIdx];
    document.getElementById('fcQ').textContent = item.num + ' ' + item.q;
    document.getElementById('fcA').textContent = isQA ? item.a : item.o[item.a];
    document.getElementById('flashCard').classList.remove('flipped');
  };

  shuffleAll = function () {
    originalShuffleAll();
    flashIdx = 0;
  };

  function quizAnsweredMap() {
    const answered = {};
    ALL_Q.forEach(q => {
      if (!q.el.classList.contains('answered')) return;
      if (isQA) {
        answered[q.id] = q.el.classList.contains('grade-correct-mark') ? 'correct' : 'wrong';
      } else {
        const wrong = q.el.querySelector('ol.o li.wrong');
        answered[q.id] = wrong ? Number(wrong.dataset.idx) : q.a;
      }
    });
    return answered;
  }

  function saveQuizSession() {
    if (!quizStarted || currentMode !== 'quiz') return;
    const elapsedMs = quizStartTime ? Math.max(0, Date.now() - quizStartTime) : 0;
    state.quizSession = {
      version: 2,
      kind: isQA ? 'qa' : 'mcq',
      elapsedMs,
      score: { c: state.quizScore.c || 0, w: state.quizScore.w || 0 },
      streak: currentStreak || 0,
      bestStreak: Math.max(bestStreak || 0, state.bestStreak || 0),
      answered: quizAnsweredMap(),
      visibleIds: ALL_Q.filter(q => !q.el.classList.contains('hidden')).map(q => q.id)
    };
    saveState();
  }

  function setQuizButtonState(active) {
    document.querySelectorAll('.topbar button').forEach(b => {
      if (b.dataset.action && b.dataset.action.startsWith('mode-')) b.classList.remove('active');
    });
    const quizBtn = document.querySelector('[data-action="mode-quiz"]');
    if (active && quizBtn) quizBtn.classList.add('active');
    if (stopBtn) stopBtn.style.display = active ? 'inline-flex' : 'none';
  }

  function resumeQuizSession(session) {
    if (!session || session.version !== 2) return false;
    const allowed = new Set(session.visibleIds && session.visibleIds.length ? session.visibleIds : ALL_Q.map(q => q.id));
    const answered = session.answered || {};

    currentMode = 'quiz';
    document.body.classList.remove('flash');
    ALL_Q.forEach(q => {
      const el = q.el;
      el.classList.add('quiz-mode');
      el.classList.remove('answered', 'revealed', 'grade-correct-mark', 'grade-wrong-mark');
      el.classList.toggle('hidden', !allowed.has(q.id));

      if (!Object.prototype.hasOwnProperty.call(answered, q.id)) return;
      el.classList.add('answered');
      if (isQA) {
        el.classList.add('revealed');
        el.classList.add(answered[q.id] === 'correct' ? 'grade-correct-mark' : 'grade-wrong-mark');
      } else {
        const chosen = Number(answered[q.id]);
        el.querySelectorAll('ol.o li').forEach(li => {
          const idx = Number(li.dataset.idx);
          li.classList.remove('wrong');
          li.classList.toggle('correct', idx === q.a);
          if (idx === chosen && chosen !== q.a) li.classList.add('wrong');
        });
      }
    });

    document.querySelectorAll('main section').forEach(sec => {
      sec.classList.toggle('hidden', !sec.querySelector('.q:not(.hidden)'));
    });

    state.quizScore = session.score || { c: 0, w: 0 };
    currentStreak = Number(session.streak) || 0;
    state.streak = currentStreak;
    bestStreak = Math.max(Number(session.bestStreak) || 0, Number(state.bestStreak) || 0);
    state.bestStreak = bestStreak;
    quizStartTime = Date.now() - (Number(session.elapsedMs) || 0);
    quizStarted = true;
    if (quizTimerId) clearInterval(quizTimerId);
    quizTimerId = setInterval(updateTimeElapsed, 1000);
    document.getElementById('quizResult').classList.remove('show');
    setQuizButtonState(true);
    updateStats();
    updateTimeElapsed();
    showToast('▶️ تم استئناف الاختبار من حيث توقفت');
    return true;
  }

  startQuiz = function (onlyWrong) {
    const pending = state.quizSession;
    if (!onlyWrong && !quizStarted && pending && pending.version === 2) {
      const done = Object.keys(pending.answered || {}).length;
      if (confirm('⏸ لديك اختبار متوقف (' + done + ' إجابة). هل تريد استئنافه؟')) {
        resumeQuizSession(pending);
        return;
      }
      state.quizSession = null;
      saveState();
    }

    originalStartQuiz(onlyWrong);
    bestStreak = Math.max(Number(bestStreak) || 0, Number(state.bestStreak) || 0);
    setQuizButtonState(true);
    saveQuizSession();
  };

  showQuizResult = function () {
    originalShowQuizResult();
    if (quizTimerId) clearInterval(quizTimerId);
    quizStarted = false;
    state.quizSession = null;
    saveState();
    setQuizButtonState(false);
  };

  function stopQuizNow() {
    if (!quizStarted || currentMode !== 'quiz') return;
    const attempted = ALL_Q.filter(q => !q.el.classList.contains('hidden') && q.el.classList.contains('answered')).length;
    const totalVisible = ALL_Q.filter(q => !q.el.classList.contains('hidden')).length;
    if (quizTimerId) clearInterval(quizTimerId);
    quizStarted = false;
    state.quizSession = null;
    saveState();
    showQuizResult();
    const msg = document.getElementById('qrMsg');
    const base = msg.textContent;
    msg.textContent = '⏹ تم إيقاف الاختبار بعد الإجابة عن ' + attempted + ' من ' + totalVisible + '. ' + base;
  }

  if (stopBtn) stopBtn.addEventListener('click', stopQuizNow);

  setMode = function (mode) {
    if (currentMode === 'quiz' && mode !== 'quiz' && quizStarted) {
      saveQuizSession();
      if (quizTimerId) clearInterval(quizTimerId);
      quizStarted = false;
      if (stopBtn) stopBtn.style.display = 'none';
      showToast('⏸ تم إيقاف مؤقت الاختبار مؤقتًا — يمكنك استئنافه لاحقًا');
    }
    return originalSetMode(mode);
  };

  document.addEventListener('click', e => {
    if (!quizStarted || currentMode !== 'quiz') return;
    if (e.target.closest('.q ol.o li, .grade-btns button')) {
      setTimeout(saveQuizSession, 0);
    }
  });

  window.addEventListener('beforeunload', saveQuizSession);

  function enhancedApplyFilters() {
    const term = searchInput.value.trim().toLowerCase();
    const secId = secFilter.value;
    const sort = sortBy.value;
    let visible = 0;

    ALL_Q.forEach(item => {
      const text = item.el.textContent.toLowerCase();
      const matchTerm = !term || text.includes(term);
      const matchSec = !secId || item.el.dataset.sec === secId;
      let matchSort = true;
      if (sort === 'unmastered') matchSort = !state.mastered[item.id];
      if (sort === 'fav') matchSort = !!state.fav[item.id];
      const show = matchTerm && matchSec && matchSort;
      item.el.classList.toggle('hidden', !show);
      if (show) visible++;
    });

    document.querySelectorAll('main section').forEach(sec => {
      const items = ALL_Q.filter(q => q.el.dataset.sec === sec.id);
      items.sort((a, b) => {
        if (sort === 'wrong') {
          const diff = (state.wrong[b.id] || 0) - (state.wrong[a.id] || 0);
          if (diff) return diff;
        }
        return a.num - b.num;
      });
      items.forEach(q => sec.appendChild(q.el));
      sec.classList.toggle('hidden', !sec.querySelector('.q:not(.hidden)'));
    });

    document.getElementById('emptyMsg').style.display = visible ? 'none' : 'block';
  }

  applyFilters = enhancedApplyFilters;
  searchInput.addEventListener('input', enhancedApplyFilters);
  secFilter.addEventListener('change', enhancedApplyFilters);
  sortBy.addEventListener('change', enhancedApplyFilters);
  document.getElementById('clearBtn').addEventListener('click', () => setTimeout(enhancedApplyFilters, 0));

  exportCSV = function (onlyFav) {
    const list = onlyFav ? ALL_Q.filter(q => state.fav[q.id]) : ALL_Q;
    if (onlyFav && list.length === 0) {
      alert('⚠️ لا توجد أسئلة في المفضلة');
      return;
    }

    let rows;
    if (isQA) {
      rows = [['#', 'القسم', 'السؤال', 'الإجابة']];
      list.forEach(item => rows.push([item.num, item.secTitle, item.q, item.a]));
    } else {
      const maxOptions = Math.max(0, ...list.map(item => item.o.length));
      const optionHeaders = Array.from({ length: maxOptions }, (_, i) => String.fromCharCode(65 + i));
      rows = [['#', 'القسم', 'السؤال', ...optionHeaders, 'الإجابة الصحيحة']];
      list.forEach(item => {
        const opts = Array.from({ length: maxOptions }, (_, i) => item.o[i] || '');
        rows.push([item.num, item.secTitle, item.q, ...opts, String.fromCharCode(65 + item.a)]);
      });
    }

    const csv = '\uFEFF' + rows.map(r => r.map(c => '"' + String(c ?? '').replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = onlyFav ? (MATERIAL.slug + '-favorites.csv') : (MATERIAL.slug + (isQA ? '-questions-answers.csv' : '-questions.csv'));
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 تم تنزيل CSV');
  };

  const headerSubtitle = document.querySelector('header > p');
  if (headerSubtitle && MATERIAL.subtitle) headerSubtitle.textContent = MATERIAL.subtitle;
  const progressText = document.getElementById('statProgress');
  if (progressText) progressText.textContent = '0/' + ALL_Q.length;

  enhancedApplyFilters();

  const pending = state.quizSession;
  if (pending && pending.version === 2) {
    setTimeout(() => {
      if (currentMode !== 'study' || quizStarted) return;
      const done = Object.keys(pending.answered || {}).length;
      if (confirm('⏸ لديك اختبار سابق متوقف بعد ' + done + ' إجابة. هل تريد استئنافه الآن؟')) {
        resumeQuizSession(pending);
      }
    }, 700);
  }
})();
