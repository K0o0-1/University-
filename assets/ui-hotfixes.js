(function(){
  'use strict';

  const engine = window.StudyEngine;
  const filterBy = document.getElementById('filterBy');
  if (!engine || !filterBy) return;

  document.body.classList.add('ui-hotfix-review-filter-enabled');

  const style = document.createElement('style');
  style.id = 'uiHotfixReviewMenuStyles';
  style.textContent = `
    body.phase1-navigation-enabled header{
      position:relative;
      z-index:250;
      overflow:visible!important
    }
    body.phase1-navigation-enabled .phase1-toolbar,
    body.phase1-navigation-enabled .phase1-secondary-row,
    body.phase1-navigation-enabled .phase1-menu-wrap{
      overflow:visible!important
    }
    body.phase1-navigation-enabled .phase1-menu-wrap.open{z-index:270}
    body.phase1-navigation-enabled .phase1-menu-panel{z-index:280!important}
    @media(max-width:760px){
      body.phase1-navigation-enabled .phase1-secondary-row{z-index:270}
      body.phase1-navigation-enabled .phase1-menu-wrap.open{z-index:280}
      body.phase1-navigation-enabled .phase1-menu-panel{z-index:290!important}
    }
  `;
  document.head.appendChild(style);

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
    applyReviewVisibility
  });
})();
