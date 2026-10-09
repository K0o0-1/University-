(function(){
  'use strict';

  const engine = window.StudyEngine;
  const filterBy = document.getElementById('filterBy');
  if (!engine || !filterBy) return;

  document.body.classList.add('ui-hotfix-review-filter-enabled');

  const style = document.createElement('style');
  style.id = 'uiHotfixReviewMenuStyles';
  style.textContent = `
    body.phase1-navigation-enabled .phase1-menu-panel:popover-open{
      position:fixed!important;
      inset:auto!important;
      margin:0!important;
      z-index:1000!important;
      display:grid!important;
      gap:3px;
      max-width:calc(100vw - 20px)!important;
      max-height:calc(100vh - 20px)!important;
      overflow:auto
    }
  `;
  document.head.appendChild(style);

  const menuWraps = [
    document.getElementById('phase1StudyTools'),
    document.getElementById('phase1More')
  ].filter(Boolean);

  menuWraps.forEach(wrap => {
    wrap.querySelector('.phase1-menu-panel')?.setAttribute('popover','manual');
  });

  function positionMenu(wrap){
    if (!wrap?.classList.contains('open')) return;
    const trigger = wrap.querySelector('.phase1-menu-trigger');
    const panel = wrap.querySelector('.phase1-menu-panel');
    if (!trigger || !panel) return;

    const pad = 10;
    const width = Math.min(320, Math.max(235, window.innerWidth - pad * 2));
    panel.style.setProperty('width', `${width}px`, 'important');
    panel.style.setProperty('right', 'auto', 'important');
    panel.style.setProperty('bottom', 'auto', 'important');

    const triggerRect = trigger.getBoundingClientRect();
    const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
    let left = rtl ? triggerRect.right - width : triggerRect.left;
    left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
    panel.style.setProperty('left', `${left}px`, 'important');

    const height = Math.min(panel.scrollHeight || 260, window.innerHeight - pad * 2);
    let top = triggerRect.bottom + 8;
    if (top + height > window.innerHeight - pad) {
      top = Math.max(pad, triggerRect.top - height - 8);
    }
    panel.style.setProperty('top', `${top}px`, 'important');
  }

  function clearPanelPosition(panel){
    ['width','left','right','top','bottom'].forEach(prop => panel.style.removeProperty(prop));
  }

  function syncMenuPopover(wrap){
    const panel = wrap.querySelector('.phase1-menu-panel');
    if (!panel) return;
    const isOpen = wrap.classList.contains('open');
    const inTopLayer = panel.matches(':popover-open');

    if (isOpen) {
      if (!inTopLayer && typeof panel.showPopover === 'function') {
        try { panel.showPopover(); } catch (_) {}
      }
      positionMenu(wrap);
    } else {
      if (inTopLayer && typeof panel.hidePopover === 'function') {
        try { panel.hidePopover(); } catch (_) {}
      }
      clearPanelPosition(panel);
    }
  }

  menuWraps.forEach(wrap => {
    new MutationObserver(() => syncMenuPopover(wrap)).observe(wrap,{attributes:true,attributeFilter:['class']});
    wrap.querySelector('.phase1-menu-trigger')?.addEventListener('click', () => queueMicrotask(() => syncMenuPopover(wrap)));
  });

  function repositionOpenMenus(){
    menuWraps.forEach(wrap => {
      if (wrap.classList.contains('open')) positionMenu(wrap);
    });
  }
  window.addEventListener('resize', repositionOpenMenus);
  window.addEventListener('scroll', repositionOpenMenus, {passive:true});
  document.addEventListener('click', () => queueMicrotask(() => menuWraps.forEach(syncMenuPopover)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') queueMicrotask(() => menuWraps.forEach(syncMenuPopover));
  });

  const state = engine.state || {};
  state.reviewFlags = state.reviewFlags || {};

  const favOption = filterBy.querySelector('option[value="fav"]');
  if (favOption) favOption.remove();

  if (!filterBy.querySelector('option[value="review"]')) {
    const reviewOption = document.createElement('option');
    reviewOption.value = 'review';
    reviewOption.textContent = '🚩 راجع لاحقًا';
    const unmastered = filterBy.querySelector('option[value="unmastered"]');
    if (unmastered) unmastered.insertAdjacentElement('afterend', reviewOption);
    else filterBy.appendChild(reviewOption);
  }

  const nativeFilteredItems = engine.filteredItems.bind(engine);
  engine.filteredItems = function(){
    const list = nativeFilteredItems();
    if (filterBy.value !== 'review') return list;
    return list.filter(item => !!state.reviewFlags[item.id]);
  };

  function applyReviewVisibility(){
    if (filterBy.value !== 'review') return;

    const list = engine.filteredItems();
    const allowed = new Set(list.map(item => item.id));

    engine.allQuestions().forEach(item => {
      item.el.classList.toggle('hidden', !allowed.has(item.id));
    });

    document.querySelectorAll('main > section').forEach(section => {
      section.classList.toggle('hidden', !section.querySelector('.q:not(.hidden)'));
    });

    const sorted = document.getElementById('sorted-results');
    const badge = sorted?.querySelector('.sec-title .badge');
    if (badge) badge.textContent = String(list.length);

    const empty = document.getElementById('emptyMsg');
    if (empty) empty.style.display = list.length ? 'none' : 'block';
  }

  function refineAfterNative(){
    if (filterBy.value !== 'review') return;
    queueMicrotask(applyReviewVisibility);
  }

  const search = document.getElementById('search');
  const secFilter = document.getElementById('secFilter');
  const sortBy = document.getElementById('sortBy');

  filterBy.addEventListener('change', refineAfterNative);
  search?.addEventListener('input', refineAfterNative);
  secFilter?.addEventListener('change', refineAfterNative);
  sortBy?.addEventListener('change', refineAfterNative);

  document.addEventListener('click', event => {
    if (!event.target.closest('.btn-review')) return;
    queueMicrotask(() => {
      if (filterBy.value !== 'review') return;
      engine.applyFilters();
      applyReviewVisibility();
    });
  });

  window.StudyHotfixes = Object.freeze({
    ready:true,
    applyReviewVisibility,
    repositionOpenMenus
  });
})();