(function(){
  'use strict';

  const engine = window.StudyEngine;
  if (!engine) { console.warn('Project fixes: engine API missing'); return; }

  const state = engine.state || {};
  const kind = engine.kind;
  document.body.classList.add('project-fixes-enabled');

  const style = document.createElement('style');
  style.id = 'projectFixesStyles';
  style.textContent = `
    /* Keep every MCQ option readable after answering. */
    body.project-fixes-enabled .q.quiz-mode.answered ol.o li{opacity:1!important}

    /* Exam: only the selected choice may be highlighted. Never leak correctness. */
    body.project-fixes-enabled.exam-mode .q.quiz-mode.answered ol.o li,
    body.project-fixes-enabled.exam-mode .q.quiz-mode.answered ol.o li.correct,
    body.project-fixes-enabled.exam-mode .q.quiz-mode.answered ol.o li.wrong{
      opacity:1!important;
      background:var(--card)!important;
      color:var(--ink)!important;
      font-weight:inherit!important;
      border-color:transparent!important
    }
    body.project-fixes-enabled.exam-mode .q.quiz-mode.answered ol.o li .check{display:none!important}
    body.project-fixes-enabled.exam-mode .q.quiz-mode.answered ol.o li.exam-choice{
      outline:2px solid var(--brand)!important;
      outline-offset:1px;
      background:color-mix(in srgb,var(--brand) 12%,var(--card))!important;
      color:var(--ink)!important
    }

    /* Hidden compatibility controls must never enter keyboard focus order. */
    body.project-fixes-enabled .phase4-native-bridge{pointer-events:none!important}

    /* Keep the print setup above navigation popovers in Chromium, Firefox and WebKit. */
    #phase6PrintModal:popover-open{border:0!important;margin:0!important}
  `;
  document.head.appendChild(style);

  function hideLegacyFavoriteUI(){
    const favReset = document.querySelector('.reset-options input[value="fav"]')?.closest('label');
    if (favReset) favReset.hidden = true;
    const favExport = document.querySelector('#exportMenuModal [data-menu="csv-fav"]');
    if (favExport) favExport.hidden = true;
  }

  function clarifyLabels(){
    const smartReview = document.getElementById('phase2Review');
    const smartReviewLabel = smartReview?.previousElementSibling;
    if (smartReviewLabel) smartReviewLabel.textContent = 'مراجعة ذكية';
    if (smartReview) smartReview.title = 'أسئلة حددها النظام كنقاط ضعف بناءً على محاولاتك';

    const sortBy = document.getElementById('sortBy');
    const desc = sortBy?.querySelector('option[value="wrong-desc"]');
    const asc = sortBy?.querySelector('option[value="wrong-asc"]');
    if (desc) desc.textContent = 'الأخطاء فقط: الأكثر ← الأقل';
    if (asc) asc.textContent = 'الأخطاء فقط: الأقل ← الأكثر';
  }

  function removeHiddenControlsFromTabOrder(){
    document.querySelectorAll('.phase4-native-bridge select,.phase4-native-bridge input').forEach(control => {
      control.tabIndex = -1;
      control.setAttribute('aria-hidden','true');
    });
  }

  function installKeyboardAccess(){
    if (kind === 'mcq') {
      engine.allQuestions().forEach(q => {
        q.el.querySelectorAll('ol.o li').forEach((option,index) => {
          if (option.dataset.projectKeyboard === 'true') return;
          option.dataset.projectKeyboard = 'true';
          option.tabIndex = 0;
          option.setAttribute('role','button');
          const letter = String.fromCharCode(65 + index);
          option.setAttribute('aria-label',`الخيار ${letter}: ${option.querySelector('.opt-text')?.textContent || option.textContent}`);
          option.addEventListener('keydown',event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            option.click();
          });
        });
      });
    } else {
      engine.allQuestions().forEach(q => {
        const question = q.el.querySelector('.qt');
        if (!question || question.dataset.projectKeyboard === 'true') return;
        question.dataset.projectKeyboard = 'true';
        question.tabIndex = 0;
        question.setAttribute('role','button');
        question.setAttribute('aria-label',`إظهار أو إخفاء إجابة السؤال ${q.num}`);
        question.addEventListener('keydown',event => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          q.el.click();
        });
      });
    }
  }

  function normalizedResult(result){
    const total = Math.max(0, Number(result.total) || 0);
    const answered = Math.max(0, Number(result.answered) || 0);
    const correct = Math.max(0, Number(result.correct) || 0);
    result.percent = total ? Math.round(correct / total * 100) : 0;
    result.accuracy = answered ? Math.round(correct / answered * 100) : 0;
    return result;
  }

  function updateResultSummary(result){
    const score = document.getElementById('qrScore');
    if (score) score.textContent = `${result.correct} / ${result.total}  (${result.percent}%)`;

    const metrics = document.getElementById('qrMetrics');
    if (metrics) {
      Array.from(metrics.querySelectorAll('.result-metric')).forEach(card => {
        const label = card.querySelector('span');
        if (label?.textContent === 'النسبة') label.textContent = 'النتيجة';
      });
      let accuracy = metrics.querySelector('[data-project-accuracy]');
      if (!accuracy) {
        accuracy = document.createElement('div');
        accuracy.className = 'result-metric';
        accuracy.dataset.projectAccuracy = 'true';
        accuracy.innerHTML = '<span>دقة المجاب</span><b></b>';
        metrics.appendChild(accuracy);
      }
      accuracy.querySelector('b').textContent = `${result.accuracy}%`;
    }
  }

  function renderSafeReview(result){
    const review = document.getElementById('qrReview');
    if (!review) return;
    const wrong = (result.wrongIds || []).map(id => engine.questionById(id)).filter(Boolean);
    review.replaceChildren();
    if (!wrong.length) {
      const p = document.createElement('p');
      p.style.cssText = 'text-align:center;color:var(--ok);font-weight:700';
      p.textContent = '🎉 لا توجد أخطاء في الأسئلة المجابة.';
      review.appendChild(p);
      return;
    }
    const h = document.createElement('h4');
    h.style.cssText = 'margin:0 0 8px;color:var(--err)';
    h.textContent = '❌ أخطاء هذا الاختبار:';
    review.appendChild(h);
    wrong.forEach(q => {
      const row = document.createElement('div');
      row.className = 'qr-review-item';
      const number = document.createElement('b');
      number.textContent = `س${q.num}: `;
      const text = document.createTextNode(q.q);
      const answer = document.createElement('span');
      answer.className = 'ans';
      if (kind === 'mcq') {
        const letter = String.fromCharCode(65 + Number(q.a));
        answer.textContent = `✔ الإجابة الصحيحة: ${letter}) ${q.o?.[q.a] ?? ''}`;
      } else {
        answer.textContent = `✔ الإجابة: ${q.a}`;
      }
      row.append(number,text,answer);
      review.appendChild(row);
    });
  }

  function patchQuizResultLifecycle(){
    const v2 = window.StudyV2;
    if (!v2 || v2.onQuizFinished?.projectFixed) return;
    const original = v2.onQuizFinished?.bind(v2);
    if (!original) return;
    const wrapped = result => {
      normalizedResult(result);
      original(result);
      updateResultSummary(result);
      renderSafeReview(result);
    };
    wrapped.projectFixed = true;
    v2.onQuizFinished = wrapped;
  }

  function hardenReset(){
    const reset = document.getElementById('resetConfirm');
    if (!reset) return;
    reset.addEventListener('click',() => {
      const selected = Array.from(document.querySelectorAll('.reset-options input[type=checkbox]:checked')).map(x => x.value);
      const all = selected.includes('all');
      if (all || selected.includes('flags')) state.reviewFlags = {};
      if (all || selected.includes('analytics')) state.questionStats = {};
      if (all || selected.includes('history')) state.quizHistory = [];
      if (all || selected.includes('quiz')) delete state.plusTimerSession;
      engine.saveState?.();
    },true);
  }

  function promotePrintModalToTopLayer(){
    const modal = document.getElementById('phase6PrintModal');
    if (!modal || typeof modal.showPopover !== 'function' || typeof modal.hidePopover !== 'function') return;
    modal.setAttribute('popover','manual');
    const sync = () => {
      const shouldOpen = modal.classList.contains('show');
      const isOpen = modal.matches(':popover-open');
      try {
        if (shouldOpen && !isOpen) modal.showPopover();
        else if (!shouldOpen && isOpen) modal.hidePopover();
      } catch (_) {}
    };
    new MutationObserver(sync).observe(modal,{attributes:true,attributeFilter:['class']});
    sync();
  }

  hideLegacyFavoriteUI();
  clarifyLabels();
  removeHiddenControlsFromTabOrder();
  installKeyboardAccess();
  patchQuizResultLifecycle();
  hardenReset();
  promotePrintModalToTopLayer();

  window.ProjectFixes = Object.freeze({
    ready:true,
    installKeyboardAccess,
    normalizedResult
  });
})();
