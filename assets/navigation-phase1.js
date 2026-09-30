(function(){
  'use strict';

  const topbar = document.querySelector('.topbar');
  const studyV2 = window.StudyV2;
  if (!topbar || !studyV2) return;

  const byAction = action => topbar.querySelector(`[data-action="${action}"]`) || document.querySelector(`[data-action="${action}"]`);
  const studyBtn = byAction('mode-study');
  const flashBtn = byAction('mode-flash');
  const statsBtn = byAction('stats');
  const practiceBtn = byAction('mode-practice-v2');
  const examBtn = byAction('mode-exam-v2');
  const focusBtn = byAction('focus');
  const revealBtn = byAction('toggle-reveal');
  const shuffleBtn = byAction('shuffle');
  const darkBtn = byAction('dark');
  const printBtn = byAction('print');
  const resetBtn = byAction('reset');
  const installBtn = byAction('install');
  const exportMenuBtn = byAction('export-menu');
  const stopBtn = document.getElementById('stopQuizBtn');
  const quizNavBtn = document.getElementById('quizNavBtn');
  const quizSkipBtn = document.getElementById('quizSkipBtn');
  const quizCountdown = document.getElementById('quizCountdown');

  if (!studyBtn || !flashBtn || !statsBtn) return;

  document.body.classList.add('phase1-navigation-enabled');
  topbar.classList.add('phase1-toolbar');

  const style = document.createElement('style');
  style.id = 'phase1NavigationStyles';
  style.textContent = `
    .phase1-toolbar{display:flex!important;flex-direction:column;align-items:center;gap:10px;margin-top:14px;overflow:visible}
    .phase1-primary-nav{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;width:100%}
    .phase1-primary-nav button{min-height:44px;min-width:112px;padding:9px 15px;font-weight:800}
    .phase1-primary-nav button.active{background:#fff;color:var(--brand);border-color:#fff}
    .phase1-secondary-row{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;min-height:44px}
    .phase1-menu-wrap{position:relative}
    .phase1-menu-trigger{min-height:42px;padding:8px 13px!important}
    .phase1-menu-panel{position:absolute;top:calc(100% + 8px);inset-inline-end:0;z-index:120;display:none;min-width:235px;padding:7px;background:var(--card);color:var(--ink);border:1px solid var(--line);border-radius:14px;box-shadow:0 16px 40px rgba(15,23,42,.22)}
    .phase1-menu-wrap.open>.phase1-menu-panel{display:grid;gap:3px}
    .phase1-menu-panel button{width:100%;min-height:42px;margin:0;padding:9px 11px!important;border:0!important;border-radius:9px!important;background:transparent!important;color:var(--ink)!important;text-align:start;font-family:inherit;font-weight:700;box-shadow:none!important}
    .phase1-menu-panel button:hover,.phase1-menu-panel button:focus-visible{background:var(--soft)!important}
    .phase1-quiz-tools{display:flex;align-items:center;justify-content:center;gap:7px;flex-wrap:wrap}
    .phase1-quiz-tools:empty{display:none}
    .phase1-legacy-controls{display:none!important}
    .phase1-toolbar>[hidden]{display:none!important}
    @media(max-width:760px){
      body.phase1-navigation-enabled{padding-bottom:86px}
      .phase1-primary-nav{position:fixed;z-index:110;left:0;right:0;bottom:0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:7px max(7px,env(safe-area-inset-right)) calc(7px + env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));background:var(--card);border-top:1px solid var(--line);box-shadow:0 -8px 24px rgba(15,23,42,.14)}
      .phase1-primary-nav button{min-width:0;min-height:50px;padding:6px 3px!important;border:0!important;border-radius:10px!important;background:transparent!important;color:var(--muted)!important;font-size:.78rem;line-height:1.25;white-space:normal}
      .phase1-primary-nav button.active{background:var(--soft)!important;color:var(--brand)!important}
      .phase1-secondary-row{position:relative;width:100%}
      .phase1-menu-wrap{position:static}
      .phase1-menu-panel{position:absolute;top:calc(100% + 6px);inset-inline:10px;min-width:0;max-width:none}
      .phase1-menu-panel button{font-size:.92rem}
      body.phase1-navigation-enabled .q .qhead{flex-wrap:wrap}
      body.phase1-navigation-enabled .q .qt{min-width:0;overflow-wrap:anywhere}
      body.phase1-navigation-enabled .q .qactions{max-width:100%;flex-wrap:wrap;margin-inline-start:auto}
    }
    @media(min-width:761px){
      .phase1-primary-nav{max-width:620px}
    }
  `;
  document.head.appendChild(style);

  const primary = document.createElement('nav');
  primary.className = 'phase1-primary-nav';
  primary.id = 'phase1PrimaryNav';
  primary.setAttribute('aria-label','التنقل الرئيسي للمادة');

  const quizBtn = document.createElement('button');
  quizBtn.type = 'button';
  quizBtn.id = 'phase1QuizBtn';
  quizBtn.dataset.action = 'phase1-quiz';
  quizBtn.textContent = '📝 اختبار';
  quizBtn.setAttribute('aria-label','اختبار');

  studyBtn.textContent = '📖 دراسة';
  flashBtn.textContent = '🎴 بطاقات';
  statsBtn.textContent = '📊 إحصائيات';
  primary.append(studyBtn, quizBtn, flashBtn, statsBtn);

  const secondary = document.createElement('div');
  secondary.className = 'phase1-secondary-row';
  secondary.id = 'phase1SecondaryRow';

  function menuWrap(id, label){
    const wrap = document.createElement('div');
    wrap.className = 'phase1-menu-wrap';
    wrap.id = id;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'phase1-menu-trigger';
    trigger.textContent = label;
    trigger.setAttribute('aria-expanded','false');
    const panel = document.createElement('div');
    panel.className = 'phase1-menu-panel';
    panel.setAttribute('role','menu');
    wrap.append(trigger,panel);
    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const open = !wrap.classList.contains('open');
      closeMenus();
      wrap.classList.toggle('open',open);
      trigger.setAttribute('aria-expanded',String(open));
    });
    return {wrap,trigger,panel};
  }

  const studyTools = menuWrap('phase1StudyTools','أدوات الدراسة ⋯');
  studyTools.trigger.id = 'phase1StudyToolsBtn';
  if (focusBtn) studyTools.panel.appendChild(focusBtn);
  if (revealBtn) studyTools.panel.appendChild(revealBtn);

  const more = menuWrap('phase1More','⋮ المزيد');
  more.trigger.id = 'phase1MoreBtn';

  const backupBtn = document.createElement('button');
  backupBtn.type = 'button';
  backupBtn.id = 'phase1BackupBtn';
  backupBtn.textContent = '💾 نسخة احتياطية';
  backupBtn.addEventListener('click', () => {
    document.querySelector('#exportMenuModal [data-menu="backup"]')?.click();
    closeMenus();
  });

  const restoreBtn = document.createElement('button');
  restoreBtn.type = 'button';
  restoreBtn.id = 'phase1RestoreBtn';
  restoreBtn.textContent = '📂 استعادة';
  restoreBtn.addEventListener('click', () => {
    document.querySelector('#exportMenuModal [data-menu="restore"]')?.click();
    closeMenus();
  });

  if (printBtn) { printBtn.textContent = '🖨 طباعة'; more.panel.appendChild(printBtn); }
  more.panel.append(backupBtn,restoreBtn);
  if (exportMenuBtn) { exportMenuBtn.textContent = '📄 تصدير CSV / خيارات أخرى'; more.panel.appendChild(exportMenuBtn); }
  if (installBtn) { installBtn.textContent = '📲 تثبيت التطبيق'; more.panel.appendChild(installBtn); }
  if (resetBtn) { resetBtn.textContent = '♻️ إعادة ضبط'; more.panel.appendChild(resetBtn); }

  secondary.append(studyTools.wrap,more.wrap);

  const quizTools = document.createElement('div');
  quizTools.className = 'phase1-quiz-tools';
  quizTools.id = 'phase1QuizTools';
  [stopBtn,quizSkipBtn,quizNavBtn,quizCountdown].filter(Boolean).forEach(el => quizTools.appendChild(el));
  secondary.appendChild(quizTools);

  const legacy = document.createElement('div');
  legacy.className = 'phase1-legacy-controls';
  legacy.id = 'phase1LegacyControls';
  legacy.hidden = true;
  [practiceBtn,examBtn,shuffleBtn,darkBtn].filter(Boolean).forEach(el => legacy.appendChild(el));

  topbar.replaceChildren(primary,secondary,legacy);

  function closeMenus(){
    [studyTools,more].forEach(menu => {
      menu.wrap.classList.remove('open');
      menu.trigger.setAttribute('aria-expanded','false');
    });
  }

  more.panel.addEventListener('click', e => {
    if (e.target.closest('button')) setTimeout(closeMenus,0);
  });

  function setPrimaryMode(mode){
    [studyBtn,quizBtn,flashBtn].forEach(btn => btn.classList.remove('active'));
    const quizLike = mode === 'quiz' || mode === 'review' || mode === 'practice' || mode === 'exam';
    if (quizLike) quizBtn.classList.add('active');
    else if (mode === 'flash') flashBtn.classList.add('active');
    else studyBtn.classList.add('active');
    studyTools.wrap.hidden = mode !== 'study';
    if (mode !== 'study') studyTools.wrap.classList.remove('open');
  }

  quizBtn.addEventListener('click', () => {
    closeMenus();
    studyV2.openQuizSetup('practice');
  });

  studyBtn.addEventListener('click', () => { closeMenus(); setPrimaryMode('study'); });
  flashBtn.addEventListener('click', () => { closeMenus(); setPrimaryMode('flash'); });
  statsBtn.addEventListener('click', closeMenus);

  document.addEventListener('click', e => {
    if (!e.target.closest('.phase1-menu-wrap')) closeMenus();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });

  const originalStarted = studyV2.onQuizStarted?.bind(studyV2);
  if (originalStarted) studyV2.onQuizStarted = ctx => { const out = originalStarted(ctx); setPrimaryMode(ctx?.mode || 'quiz'); return out; };
  const originalChanged = studyV2.onModeChanged?.bind(studyV2);
  if (originalChanged) studyV2.onModeChanged = mode => { const out = originalChanged(mode); setPrimaryMode(mode); return out; };
  const originalFinished = studyV2.onQuizFinished?.bind(studyV2);
  if (originalFinished) studyV2.onQuizFinished = result => { const out = originalFinished(result); setPrimaryMode('review'); return out; };

  setPrimaryMode('study');
})();
