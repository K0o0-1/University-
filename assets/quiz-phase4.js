(function(){
  'use strict';

  const engine = window.StudyEngine;
  const studyV2 = window.StudyV2;
  if (!engine || !studyV2) { console.warn('Study Phase 4: quiz APIs missing'); return; }

  const setupModal = document.getElementById('quizSetupModal');
  const modeNative = document.getElementById('quizSetupMode');
  const sectionNative = document.getElementById('quizSetupSection');
  const sourceNative = document.getElementById('quizSetupSource');
  const countNative = document.getElementById('quizSetupCount');
  const orderNative = document.getElementById('quizSetupOrder');
  const timeModeNative = document.getElementById('quizSetupTimeMode');
  const timeValueNative = document.getElementById('quizSetupTimeValue');
  if (!setupModal || !modeNative || !sectionNative || !sourceNative || !countNative || !orderNative || !timeModeNative || !timeValueNative) {
    console.warn('Study Phase 4: setup controls missing'); return;
  }

  document.body.classList.add('phase4-quiz-ux-enabled');

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const selectLabel = select => select?.selectedOptions?.[0]?.textContent?.trim() || '';
  const modeLabel = mode => mode === 'exam' ? 'امتحان' : 'تدريب';
  const sourceLabel = value => ({all:'كل أسئلة النطاق',filtered:'النتائج الحالية',weak:'نقاط الضعف فقط'}[value] || value || 'كل أسئلة النطاق');
  const orderLabel = value => value === 'random' ? 'عشوائي' : 'بالترتيب';
  const timerLabel = (mode,value) => mode === 'total'
    ? `${value || 0} دقيقة للاختبار`
    : mode === 'per-question' ? `${value || 0} ثانية لكل سؤال` : 'بدون مؤقت';

  const style = document.createElement('style');
  style.id = 'phase4QuizStyles';
  style.textContent = `
    #quizSetupModal .quiz-setup-card{position:relative;max-width:640px;padding:20px}
    .phase4-setup-intro{margin-bottom:14px}
    .phase4-setup-intro h3{margin:0 0 5px;font-size:1.18rem}
    .phase4-setup-intro p{margin:0;color:var(--muted);font-size:.86rem;line-height:1.65}
    .phase4-mode-switch{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 14px}
    .phase4-mode-btn{min-height:58px;padding:9px 12px;border:1px solid var(--line);border-radius:13px;background:var(--card);color:var(--ink);font-family:inherit;font-weight:800;cursor:pointer;text-align:start}
    .phase4-mode-btn span{display:block;font-size:.94rem}.phase4-mode-btn small{display:block;margin-top:2px;color:var(--muted);font-size:.7rem;font-weight:600}
    .phase4-mode-btn.active{background:var(--brand-soft);border-color:var(--brand);color:var(--brand)}
    #quizSetupModal .quiz-setup-grid.phase4-basic-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .phase4-advanced-toggle{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:44px;margin-top:12px;padding:9px 12px;border:1px solid var(--line);border-radius:11px;background:var(--card);color:var(--ink);font-family:inherit;font-weight:800;cursor:pointer}
    .phase4-advanced-toggle.has-settings{background:var(--brand-soft);border-color:var(--brand);color:var(--brand)}
    .phase4-advanced-panel{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:8px;padding:12px;border:1px solid var(--line);border-radius:13px;background:var(--soft)}
    .phase4-advanced-panel[hidden]{display:none!important}
    .phase4-advanced-panel label{display:flex;flex-direction:column;gap:6px;color:var(--ink);font-size:.82rem;font-weight:800}
    .phase4-advanced-panel select,.phase4-advanced-panel input{width:100%;min-height:43px;padding:9px 10px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);font-family:inherit;font-size:.86rem}
    .phase4-advanced-panel small{color:var(--muted);font-weight:600;line-height:1.45}
    .phase4-setup-summary{margin:10px 0 0;padding:10px 12px;border:1px solid var(--line);border-radius:11px;background:var(--card);color:var(--muted);font-size:.78rem;line-height:1.6}
    .phase4-setup-summary b{color:var(--ink)}
    .phase4-native-bridge{position:absolute!important;top:2px!important;left:2px!important;width:190px!important;opacity:0!important;pointer-events:none!important;overflow:visible!important;margin:0!important;padding:0!important;z-index:0!important}
    .phase4-native-bridge select,.phase4-native-bridge input{min-width:120px!important;min-height:20px!important}
    #quizSetupModal .quiz-setup-note{margin-top:9px;font-size:.78rem}
    #quizSetupModal #quizSetupStart{min-width:150px}

    .phase4-quiz-context{display:none;position:sticky;top:8px;z-index:95;max-width:1000px;margin:10px auto;padding:10px 12px;border:1px solid var(--line);border-radius:15px;background:color-mix(in srgb,var(--card) 95%,transparent);box-shadow:0 12px 30px rgba(15,23,42,.14);backdrop-filter:blur(12px)}
    body.phase4-quiz-running .phase4-quiz-context,body.phase4-quiz-review .phase4-quiz-context{display:block}
    .phase4-context-main{display:flex;align-items:center;gap:10px;min-width:0}
    .phase4-state-badge{flex:0 0 auto;padding:6px 9px;border-radius:999px;background:#dcfce7;color:#166534;font-size:.74rem;font-weight:900}
    body.phase4-quiz-review .phase4-state-badge{background:#e0e7ff;color:#3730a3}
    .phase4-context-copy{min-width:0;flex:1}.phase4-context-copy strong{display:block;font-size:.94rem}.phase4-context-copy small{display:block;margin-top:2px;color:var(--muted);font-size:.72rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .phase4-context-progress{display:flex;align-items:center;gap:7px;min-width:130px}.phase4-context-progress span{font-size:.75rem;font-weight:800;white-space:nowrap}.phase4-progress-track{flex:1;height:7px;border-radius:999px;background:var(--soft);overflow:hidden}.phase4-progress-fill{height:100%;width:0;background:var(--brand);transition:width .2s ease}
    .phase4-context-tools{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap;margin-top:8px}
    .phase4-context-tools button,.phase4-context-tools .quiz-countdown{min-height:40px;margin:0!important;padding:7px 11px!important;border:1px solid var(--line)!important;border-radius:10px!important;background:var(--card)!important;color:var(--ink)!important;font-family:inherit;font-size:.78rem;font-weight:800;box-shadow:none!important}
    .phase4-context-tools #stopQuizBtn{background:#fee2e2!important;border-color:#fecaca!important;color:#991b1b!important}
    .phase4-context-tools #quizCountdown{display:inline-flex;align-items:center}
    body.phase4-quiz-running #phase1PrimaryNav,body.phase4-quiz-running #phase1SecondaryRow,body.phase4-quiz-running>.stats,body.phase4-quiz-running>.filterbar{display:none!important}
    body.phase4-quiz-running header p{display:none}
    body.phase4-quiz-running .q .phase3-more-trigger{display:none!important}
    body.phase4-quiz-running .q .qactions{gap:0}
    body.phase4-quiz-running .q .qactions>.btn-review{width:38px;height:38px;min-width:38px}
    .phase4-result-panel{max-width:780px!important;border:1px solid var(--line);border-radius:18px!important;box-shadow:0 18px 44px rgba(15,23,42,.14)!important}
    .phase4-result-state{display:inline-flex;margin-bottom:6px;padding:5px 9px;border-radius:999px;background:#e0e7ff;color:#3730a3;font-size:.74rem;font-weight:900}
    #resumeQuizModal .phase4-paused-badge{display:inline-flex;margin-bottom:8px;padding:5px 9px;border-radius:999px;background:#fef3c7;color:#92400e;font-size:.74rem;font-weight:900}
    @media(max-width:760px){
      #quizSetupModal{align-items:flex-end;padding:0}
      #quizSetupModal .quiz-setup-card{width:100%;max-width:none;max-height:88vh;overflow:auto;border-radius:20px 20px 0 0;padding:16px 14px calc(14px + env(safe-area-inset-bottom))}
      .phase4-mode-switch{gap:6px}.phase4-mode-btn{min-height:56px;padding:8px 9px}
      #quizSetupModal .quiz-setup-grid.phase4-basic-grid{grid-template-columns:1fr}
      .phase4-advanced-panel{grid-template-columns:1fr}
      body.phase4-quiz-running{padding-bottom:16px!important}
      .phase4-quiz-context{top:0;margin:0;border-radius:0;border-inline:0;padding:9px 10px}
      .phase4-context-main{align-items:flex-start;flex-wrap:wrap;gap:7px}
      .phase4-context-copy{flex:1 1 calc(100% - 105px)}
      .phase4-context-progress{flex:1 1 100%;min-width:0}
      .phase4-context-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
      .phase4-context-tools button,.phase4-context-tools .quiz-countdown{width:100%;min-width:0;justify-content:center;text-align:center;white-space:normal}
      .phase4-context-tools #quizCountdown{grid-column:1/-1}
    }
    @media print{.phase4-quiz-context{display:none!important}.phase4-advanced-toggle,.phase4-advanced-panel{display:none!important}}
  `;
  document.head.appendChild(style);

  function makeSelect(native,id){
    const select = document.createElement('select');
    select.id = id;
    Array.from(native.options).forEach(option => {
      const copy = document.createElement('option');
      copy.value = option.value;
      copy.textContent = option.textContent;
      select.appendChild(copy);
    });
    select.value = native.value;
    return select;
  }

  function setNative(select,value){
    if (!select || select.value === value) return;
    select.value = value;
    select.dispatchEvent(new Event('change',{bubbles:true}));
  }

  const card = setupModal.querySelector('.quiz-setup-card');
  const grid = setupModal.querySelector('.quiz-setup-grid');
  const note = document.getElementById('quizSetupNote');
  const startBtn = document.getElementById('quizSetupStart');
  const modeLabelNative = modeNative.closest('label');
  const sourceLabelNative = sourceNative.closest('label');
  const orderLabelNative = orderNative.closest('label');
  const timeModeLabelNative = timeModeNative.closest('label');
  const timeValueWrapNative = document.getElementById('quizSetupTimeValueWrap');

  const intro = document.createElement('div');
  intro.className = 'phase4-setup-intro';
  intro.innerHTML = '<h3>📝 ابدأ اختبارًا</h3><p>اختر نوع الاختبار والأساسيات أولًا، ثم افتح الخيارات الإضافية فقط عند الحاجة.</p>';
  card.querySelector('h3')?.replaceWith(intro);

  const modeSwitch = document.createElement('div');
  modeSwitch.className = 'phase4-mode-switch';
  modeSwitch.setAttribute('role','group');
  modeSwitch.setAttribute('aria-label','نوع الاختبار');
  modeSwitch.innerHTML = `
    <button type="button" class="phase4-mode-btn" data-phase4-mode="practice"><span>🧠 تدريب</span><small>التصحيح يظهر مباشرة</small></button>
    <button type="button" class="phase4-mode-btn" data-phase4-mode="exam"><span>📝 امتحان</span><small>النتيجة تظهر في النهاية</small></button>`;
  grid.insertAdjacentElement('beforebegin',modeSwitch);
  grid.classList.add('phase4-basic-grid');

  const bridge = document.createElement('div');
  bridge.className = 'phase4-native-setup-bridge';
  bridge.setAttribute('aria-hidden','true');
  [modeLabelNative,sourceLabelNative,orderLabelNative,timeModeLabelNative,timeValueWrapNative].filter(Boolean).forEach(label => {
    label.classList.add('phase4-native-bridge');
    bridge.appendChild(label);
  });
  card.appendChild(bridge);

  const advancedToggle = document.createElement('button');
  advancedToggle.type = 'button';
  advancedToggle.id = 'phase4QuizAdvancedBtn';
  advancedToggle.className = 'phase4-advanced-toggle';
  advancedToggle.setAttribute('aria-expanded','false');
  advancedToggle.innerHTML = '<span>⚙️ خيارات إضافية</span><span aria-hidden="true">▾</span>';

  const advanced = document.createElement('div');
  advanced.id = 'phase4QuizAdvancedPanel';
  advanced.className = 'phase4-advanced-panel';
  advanced.hidden = true;

  const sourceCustom = makeSelect(sourceNative,'phase4QuizSource');
  const orderCustom = makeSelect(orderNative,'phase4QuizOrder');
  const timeModeCustom = makeSelect(timeModeNative,'phase4QuizTimeMode');
  const timeValueCustom = document.createElement('input');
  timeValueCustom.id = 'phase4QuizTimeValue';
  timeValueCustom.type = 'number';
  timeValueCustom.inputMode = 'decimal';
  timeValueCustom.min = timeValueNative.min || '0.02';
  timeValueCustom.step = timeValueNative.step || '0.1';
  timeValueCustom.value = timeValueNative.value || '30';
  const timeValueCustomWrap = document.createElement('label');
  timeValueCustomWrap.id = 'phase4QuizTimeValueWrap';
  const timeUnitCustom = document.createElement('small');
  timeUnitCustom.id = 'phase4QuizTimeUnit';
  timeValueCustomWrap.append(document.createTextNode('المدة'),timeValueCustom,timeUnitCustom);

  const advancedField = (text,control) => {
    const label = document.createElement('label');
    label.append(document.createTextNode(text),control);
    return label;
  };
  advanced.append(
    advancedField('مصدر الأسئلة',sourceCustom),
    advancedField('اختيار الأسئلة',orderCustom),
    advancedField('المؤقت',timeModeCustom),
    timeValueCustomWrap
  );
  grid.insertAdjacentElement('afterend',advancedToggle);
  advancedToggle.insertAdjacentElement('afterend',advanced);

  const summary = document.createElement('div');
  summary.id = 'phase4QuizSetupSummary';
  summary.className = 'phase4-setup-summary';
  advanced.insertAdjacentElement('afterend',summary);

  function updateCustomTime(){
    const mode = timeModeNative.value || 'none';
    timeValueCustomWrap.hidden = mode === 'none';
    timeUnitCustom.textContent = mode === 'total' ? 'دقيقة للاختبار كاملًا' : mode === 'per-question' ? 'ثانية مستقلة لكل سؤال' : '';
  }

  function syncSetup(){
    sourceCustom.value = sourceNative.value;
    orderCustom.value = orderNative.value;
    timeModeCustom.value = timeModeNative.value;
    timeValueCustom.value = timeValueNative.value;
    modeSwitch.querySelectorAll('[data-phase4-mode]').forEach(btn => btn.classList.toggle('active',btn.dataset.phase4Mode === modeNative.value));
    updateCustomTime();

    const advancedChanged = sourceNative.value !== 'all' || orderNative.value !== 'original' || timeModeNative.value !== 'none';
    advancedToggle.classList.toggle('has-settings',advancedChanged);
    advancedToggle.querySelector('span:first-child').textContent = advancedChanged ? '⚙️ خيارات إضافية • مخصصة' : '⚙️ خيارات إضافية';
    startBtn.textContent = modeNative.value === 'exam' ? 'ابدأ الامتحان' : 'ابدأ التدريب';

    const count = countNative.value === 'all' ? 'كل الأسئلة' : `${countNative.value} سؤال`;
    const section = sectionNative.value ? selectLabel(sectionNative) : 'كل الأقسام';
    summary.innerHTML = `<b>${modeLabel(modeNative.value)}</b> • ${esc(section)} • ${esc(count)} • ${esc(sourceLabel(sourceNative.value))} • ${esc(orderLabel(orderNative.value))} • ${esc(timerLabel(timeModeNative.value,timeValueNative.value))}`;
  }

  modeSwitch.addEventListener('click',e => {
    const btn = e.target.closest('[data-phase4-mode]');
    if (!btn) return;
    setNative(modeNative,btn.dataset.phase4Mode);
    syncSetup();
  });
  advancedToggle.addEventListener('click',() => {
    advanced.hidden = !advanced.hidden;
    advancedToggle.setAttribute('aria-expanded',String(!advanced.hidden));
    advancedToggle.lastElementChild.textContent = advanced.hidden ? '▾' : '▴';
  });
  sourceCustom.addEventListener('change',() => setNative(sourceNative,sourceCustom.value));
  orderCustom.addEventListener('change',() => setNative(orderNative,orderCustom.value));
  timeModeCustom.addEventListener('change',() => setNative(timeModeNative,timeModeCustom.value));
  timeValueCustom.addEventListener('input',() => {
    timeValueNative.value = timeValueCustom.value;
    timeValueNative.dispatchEvent(new Event('input',{bubbles:true}));
    syncSetup();
  });
  [modeNative,sectionNative,sourceNative,countNative,orderNative,timeModeNative].forEach(control => control.addEventListener('change',syncSetup));
  timeValueNative.addEventListener('input',syncSetup);
  syncSetup();

  const context = document.createElement('section');
  context.id = 'phase4QuizContext';
  context.className = 'phase4-quiz-context';
  context.setAttribute('aria-live','polite');
  context.innerHTML = `
    <div class="phase4-context-main">
      <span class="phase4-state-badge" id="phase4QuizState">جارٍ الاختبار</span>
      <div class="phase4-context-copy"><strong id="phase4QuizTitle">اختبار</strong><small id="phase4QuizMeta">—</small></div>
      <div class="phase4-context-progress"><span id="phase4QuizProgress">0/0</span><div class="phase4-progress-track"><div class="phase4-progress-fill" id="phase4QuizProgressFill"></div></div></div>
    </div>
    <div class="phase4-context-tools" id="phase4QuizTools"></div>`;
  document.querySelector('header')?.insertAdjacentElement('afterend',context);

  const toolHost = context.querySelector('#phase4QuizTools');
  const stopBtn = document.getElementById('stopQuizBtn');
  const skipBtn = document.getElementById('quizSkipBtn');
  const navBtn = document.getElementById('quizNavBtn');
  const countdown = document.getElementById('quizCountdown');
  if (navBtn) { navBtn.textContent = '🧭 الأسئلة'; toolHost.appendChild(navBtn); }
  if (skipBtn) { skipBtn.textContent = '⏭ تخطي'; toolHost.appendChild(skipBtn); }
  if (countdown) toolHost.appendChild(countdown);
  if (stopBtn) { stopBtn.textContent = '⏹ إنهاء الاختبار'; toolHost.appendChild(stopBtn); }

  let lastMode = 'practice';
  let lastConfig = {};

  function contextMeta(){
    const config = lastConfig || {};
    const parts = [config.sectionLabel || 'كل الأقسام'];
    if (config.source) parts.push(sourceLabel(config.source));
    if (config.order) parts.push(orderLabel(config.order));
    if (config.timeMode && config.timeMode !== 'none') parts.push(timerLabel(config.timeMode,config.timeMode === 'total' ? Math.round((Number(config.timeLimitSec)||0)/60*10)/10 : Number(config.timeLimitSec)||0));
    return parts.join(' • ');
  }

  function refreshProgress(){
    const ids = engine.getActiveQuizIds?.() || [];
    const answers = engine.getQuizAnswers?.() || {};
    const answered = ids.filter(id => Object.prototype.hasOwnProperty.call(answers,id)).length;
    const total = ids.length;
    const pct = total ? Math.round(answered / total * 100) : 0;
    document.getElementById('phase4QuizProgress').textContent = `${answered}/${total}`;
    document.getElementById('phase4QuizProgressFill').style.width = `${pct}%`;
    document.getElementById('phase4QuizProgressFill').parentElement.setAttribute('aria-label',`تمت الإجابة عن ${answered} من ${total}`);
  }

  function showRunning(ctx={}){
    lastMode = ctx.mode === 'exam' ? 'exam' : 'practice';
    lastConfig = {...(ctx.config || engine.getQuizConfig?.() || {})};
    document.body.classList.add('phase4-quiz-running');
    document.body.classList.remove('phase4-quiz-review','phase4-quiz-paused');
    document.getElementById('phase4QuizState').textContent = ctx.resumed ? 'مستأنف الآن' : 'جارٍ الاختبار';
    document.getElementById('phase4QuizTitle').textContent = `${lastMode === 'exam' ? '📝' : '🧠'} ${modeLabel(lastMode)}`;
    document.getElementById('phase4QuizMeta').textContent = contextMeta();
    refreshProgress();
  }

  function showReview(result={}){
    if (result.mode) lastMode = result.mode;
    document.body.classList.remove('phase4-quiz-running','phase4-quiz-paused');
    document.body.classList.add('phase4-quiz-review');
    document.getElementById('phase4QuizState').textContent = 'مراجعة النتيجة';
    document.getElementById('phase4QuizTitle').textContent = `✅ انتهى ${modeLabel(lastMode)}`;
    document.getElementById('phase4QuizMeta').textContent = result.reason === 'timeout' ? 'انتهى الوقت • راجع نتيجتك والأسئلة' : 'راجع نتيجتك والأسئلة قبل العودة للدراسة';
    refreshProgress();
  }

  function clearLifecycle(){
    document.body.classList.remove('phase4-quiz-running','phase4-quiz-review','phase4-quiz-paused');
  }

  const originalStarted = studyV2.onQuizStarted?.bind(studyV2);
  if (originalStarted) studyV2.onQuizStarted = ctx => { const out = originalStarted(ctx); showRunning(ctx); return out; };
  const originalAnswer = studyV2.onAnswer?.bind(studyV2);
  if (originalAnswer) studyV2.onAnswer = payload => { const out = originalAnswer(payload); refreshProgress(); return out; };
  const originalFinished = studyV2.onQuizFinished?.bind(studyV2);
  if (originalFinished) studyV2.onQuizFinished = result => { const out = originalFinished(result); showReview(result); return out; };
  const originalChanged = studyV2.onModeChanged?.bind(studyV2);
  if (originalChanged) studyV2.onModeChanged = mode => { const out = originalChanged(mode); if (mode !== 'quiz' && mode !== 'review' && mode !== 'practice' && mode !== 'exam') clearLifecycle(); return out; };

  const result = document.getElementById('quizResult');
  if (result) {
    result.classList.add('phase4-result-panel');
    const resultTitle = result.querySelector('h3');
    if (resultTitle && !result.querySelector('.phase4-result-state')) {
      const badge = document.createElement('span');
      badge.className = 'phase4-result-state';
      badge.textContent = 'مراجعة النتيجة';
      resultTitle.insertAdjacentElement('beforebegin',badge);
      resultTitle.textContent = 'نتيجة الاختبار';
    }
  }

  function decorateResume(){
    const modal = document.getElementById('resumeQuizModal');
    if (!modal || modal.dataset.phase4Ready === 'true') return;
    modal.dataset.phase4Ready = 'true';
    const card = modal.querySelector('.modal-card');
    const heading = card?.querySelector('h3');
    if (heading) {
      const badge = document.createElement('span');
      badge.className = 'phase4-paused-badge';
      badge.textContent = 'متوقف مؤقتًا';
      heading.insertAdjacentElement('beforebegin',badge);
      heading.textContent = 'لديك اختبار غير مكتمل';
    }
    const continueBtn = document.getElementById('resumeQuizContinue');
    const finishBtn = document.getElementById('resumeQuizFinish');
    if (continueBtn) continueBtn.textContent = 'متابعة الاختبار';
    if (finishBtn) finishBtn.textContent = 'إنهاء وعرض النتيجة';
    const syncPause = () => {
      const shown = modal.classList.contains('show');
      document.body.classList.toggle('phase4-quiz-paused',shown);
      if (shown) document.body.classList.remove('phase4-quiz-running','phase4-quiz-review');
    };
    new MutationObserver(syncPause).observe(modal,{attributes:true,attributeFilter:['class']});
    syncPause();
  }
  decorateResume();

  const legacyProgress = document.getElementById('statProgress');
  if (legacyProgress) new MutationObserver(refreshProgress).observe(legacyProgress,{childList:true,characterData:true,subtree:true});

  setupModal.addEventListener('click',e => {
    if (e.target === setupModal) {
      advanced.hidden = true;
      advancedToggle.setAttribute('aria-expanded','false');
      advancedToggle.lastElementChild.textContent = '▾';
    }
  });
  document.addEventListener('keydown',e => {
    if (e.key === 'Escape' && setupModal.classList.contains('show') && !advanced.hidden) {
      advanced.hidden = true;
      advancedToggle.setAttribute('aria-expanded','false');
      advancedToggle.lastElementChild.textContent = '▾';
      e.stopPropagation();
    }
  },true);

  window.StudyPhase4 = {
    syncSetup,
    refreshProgress,
    showRunning,
    showReview,
    openAdvanced:() => { advanced.hidden = false; advancedToggle.setAttribute('aria-expanded','true'); advancedToggle.lastElementChild.textContent = '▴'; },
    closeAdvanced:() => { advanced.hidden = true; advancedToggle.setAttribute('aria-expanded','false'); advancedToggle.lastElementChild.textContent = '▾'; }
  };
})();
