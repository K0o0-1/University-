(function(){
  'use strict';

  const engine = window.StudyEngine;
  if (!engine) { console.warn('Study Phase 3: engine API missing'); return; }

  const questions = engine.allQuestions?.() || [];
  if (!questions.length) return;

  document.body.classList.add('phase3-question-card-enabled');

  const style = document.createElement('style');
  style.id = 'phase3QuestionCardStyles';
  style.textContent = `
    body.phase3-question-card-enabled .q .qactions{
      position:relative;display:flex;align-items:center;justify-content:flex-end;gap:5px;
      flex:0 0 auto;flex-wrap:nowrap;overflow:visible
    }
    body.phase3-question-card-enabled .q .qactions>.btn-review,
    body.phase3-question-card-enabled .q .qactions>.phase3-more-trigger{
      display:inline-flex!important;align-items:center;justify-content:center;width:40px;height:40px;
      min-width:40px;padding:0!important;margin:0!important;border:1px solid var(--line)!important;
      border-radius:10px!important;background:var(--card)!important;color:var(--ink)!important;
      box-shadow:none!important;font:800 1rem/1 inherit;cursor:pointer
    }
    body.phase3-question-card-enabled .q .qactions>.btn-review:hover,
    body.phase3-question-card-enabled .q .qactions>.btn-review:focus-visible,
    body.phase3-question-card-enabled .q .qactions>.phase3-more-trigger:hover,
    body.phase3-question-card-enabled .q .qactions>.phase3-more-trigger:focus-visible,
    body.phase3-question-card-enabled .q .qactions.phase3-menu-open>.phase3-more-trigger{
      border-color:var(--brand)!important;background:var(--brand-soft)!important;color:var(--brand)!important
    }
    body.phase3-question-card-enabled .q .qactions>.btn-review.on{
      background:#f59e0b!important;border-color:#f59e0b!important;color:#111!important
    }
    .phase3-actions-menu{
      position:absolute;z-index:180;top:calc(100% + 7px);inset-inline-end:0;display:none;
      width:225px;max-width:calc(100vw - 36px);padding:6px;background:var(--card);color:var(--ink);
      border:1px solid var(--line);border-radius:13px;box-shadow:0 16px 38px rgba(15,23,42,.22)
    }
    .qactions.phase3-menu-open>.phase3-actions-menu{display:grid;gap:3px}
    .phase3-actions-menu button{
      display:flex!important;align-items:center;justify-content:flex-start;gap:8px;width:100%!important;
      min-width:0!important;min-height:42px!important;height:auto!important;margin:0!important;padding:9px 11px!important;
      border:0!important;border-radius:9px!important;background:transparent!important;color:var(--ink)!important;
      box-shadow:none!important;text-align:start;font-family:inherit;font-size:.88rem;font-weight:800;cursor:pointer
    }
    .phase3-actions-menu button:hover,.phase3-actions-menu button:focus-visible{
      background:var(--soft)!important;color:var(--brand)!important
    }
    .phase3-actions-menu .btn-mastered.mastered-on{background:var(--brand-soft)!important;color:var(--brand)!important}
    .phase3-actions-menu .btn-mastered::after{content:'الإتقان اليدوي'}
    .phase3-actions-menu .btn-copy::after{content:'نسخ السؤال'}
    .phase3-actions-menu .btn-qstats::after{content:'إحصائيات السؤال'}
    .phase3-legacy-actions{display:none!important}
    body.phase3-question-card-enabled .q .qactions>.btn-fav,
    body.phase3-question-card-enabled .q .qactions>.btn-share{display:none!important}
    @media(max-width:760px){
      body.phase3-question-card-enabled .q .qactions{margin-inline-start:auto;max-width:none}
      body.phase3-question-card-enabled .q .qactions>.btn-review,
      body.phase3-question-card-enabled .q .qactions>.phase3-more-trigger{width:38px;height:38px;min-width:38px}
      .phase3-actions-menu{width:min(225px,calc(100vw - 28px));inset-inline-end:0}
    }
    @media print{
      body.phase3-question-card-enabled .q .qactions{display:none!important}
      .phase3-actions-menu{display:none!important}
    }
  `;
  document.head.appendChild(style);

  let openActions = null;

  function closeMenu(actions){
    if (!actions) return;
    actions.classList.remove('phase3-menu-open');
    actions.querySelector('.phase3-more-trigger')?.setAttribute('aria-expanded','false');
    if (openActions === actions) openActions = null;
  }

  function closeAllMenus(){
    document.querySelectorAll('.qactions.phase3-menu-open').forEach(closeMenu);
    openActions = null;
  }

  function decorateQuestion(q){
    const actions = q.el?.querySelector('.qactions');
    if (!actions || actions.dataset.phase3Ready === 'true') return;

    const review = actions.querySelector('.btn-review');
    const mastered = actions.querySelector('.btn-mastered');
    const copy = actions.querySelector('.btn-copy');
    const stats = actions.querySelector('.btn-qstats');
    const fav = actions.querySelector('.btn-fav');
    const share = actions.querySelector('.btn-share');
    if (!review) return;

    actions.dataset.phase3Ready = 'true';
    actions.setAttribute('aria-label','إجراءات السؤال');

    review.type = 'button';
    review.title = 'راجع لاحقًا';
    review.setAttribute('aria-label','راجع لاحقًا');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'phase3-more-trigger';
    trigger.textContent = '⋯';
    trigger.title = 'خيارات السؤال';
    trigger.setAttribute('aria-label','خيارات السؤال');
    trigger.setAttribute('aria-haspopup','menu');
    trigger.setAttribute('aria-expanded','false');

    const menu = document.createElement('div');
    menu.className = 'phase3-actions-menu';
    menu.id = `phase3QuestionMenu-${q.num}`;
    menu.setAttribute('role','menu');
    trigger.setAttribute('aria-controls',menu.id);

    if (mastered) {
      mastered.type = 'button';
      mastered.title = 'الإتقان اليدوي';
      mastered.setAttribute('aria-label','الإتقان اليدوي');
      mastered.setAttribute('role','menuitem');
      menu.appendChild(mastered);
    }
    if (copy) {
      copy.type = 'button';
      copy.title = 'نسخ السؤال';
      copy.setAttribute('aria-label','نسخ السؤال');
      copy.setAttribute('role','menuitem');
      menu.appendChild(copy);
    }
    if (stats) {
      stats.type = 'button';
      stats.title = 'إحصائيات السؤال';
      stats.setAttribute('aria-label','إحصائيات السؤال');
      stats.setAttribute('role','menuitem');
      menu.appendChild(stats);
    }

    const legacy = document.createElement('div');
    legacy.className = 'phase3-legacy-actions';
    legacy.setAttribute('aria-hidden','true');
    legacy.hidden = true;
    if (fav) legacy.appendChild(fav);
    if (share) legacy.appendChild(share);

    actions.replaceChildren(review,trigger,menu,legacy);

    trigger.addEventListener('click',e => {
      e.preventDefault();
      e.stopPropagation();
      const opening = !actions.classList.contains('phase3-menu-open');
      closeAllMenus();
      if (opening) {
        actions.classList.add('phase3-menu-open');
        trigger.setAttribute('aria-expanded','true');
        openActions = actions;
      }
    });

    menu.addEventListener('click',e => {
      if (!e.target.closest('button')) return;
      setTimeout(() => closeMenu(actions),0);
    });
  }

  questions.forEach(decorateQuestion);

  document.addEventListener('click',e => {
    if (!e.target.closest('.qactions')) closeAllMenus();
  });
  document.addEventListener('keydown',e => {
    if (e.key === 'Escape') closeAllMenus();
  });
  window.addEventListener('scroll',closeAllMenus,{passive:true});

  window.StudyPhase3 = {
    closeAllMenus,
    decorateAll:() => questions.forEach(decorateQuestion)
  };
})();
