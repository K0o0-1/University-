(function(){
  'use strict';

  const engine = window.StudyEngine;
  if (!engine) { console.warn('Study Phase 2: engine API missing'); return; }

  const stats = document.querySelector('.stats');
  const filterbar = document.querySelector('.filterbar');
  const index = document.getElementById('index');
  const search = document.getElementById('search');
  const secFilter = document.getElementById('secFilter');
  const filterBy = document.getElementById('filterBy');
  const sortBy = document.getElementById('sortBy');
  const clearBtn = document.getElementById('clearBtn');
  if (!stats || !filterbar || !search || !secFilter || !filterBy || !sortBy || !clearBtn) return;

  document.body.classList.add('phase2-study-enabled');

  const style = document.createElement('style');
  style.id = 'phase2StudyStyles';
  style.textContent = `
    body.phase2-study-enabled header{
      max-width:1120px;margin:10px auto 0;padding:14px 16px 12px;border-radius:18px;
      box-shadow:0 10px 28px rgba(99,102,241,.16)
    }
    body.phase2-study-enabled header h1{font-size:1.28rem;margin-bottom:2px}
    body.phase2-study-enabled header p{font-size:.8rem;opacity:.88}
    body.phase2-study-enabled header .topbar{margin-top:10px}

    .phase2-legacy-stats{display:none!important}
    body.phase2-study-enabled>.progress-wrap{display:none}
    body.phase2-study-enabled .stats{
      display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;
      max-width:760px;margin:12px auto 0;padding:0 16px
    }
    .phase2-summary-item{
      min-width:0;padding:10px 12px;background:var(--card);border:1px solid var(--line);
      border-radius:13px;box-shadow:var(--shadow);text-align:center
    }
    .phase2-summary-item span{display:block;color:var(--muted);font-size:.78rem;font-weight:700;white-space:nowrap}
    .phase2-summary-item b{display:block;margin-top:2px;color:var(--ink);font-size:1rem;line-height:1.45}
    .phase2-summary-item.review b{color:#c2410c}

    body.phase2-study-enabled .filterbar.phase2-study-controls{
      display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:8px;align-items:center;
      max-width:900px;margin:12px auto 0;padding:0 16px
    }
    .phase2-study-controls #search{
      min-width:0;width:100%;height:44px;padding:9px 13px;border:1px solid var(--line);
      border-radius:12px;background:var(--card);color:var(--ink);font-family:inherit;
      font-size:.9rem;box-shadow:var(--shadow)
    }
    .phase2-control-btn{
      min-height:44px;padding:9px 14px;border:1px solid var(--line);border-radius:12px;
      background:var(--card);color:var(--ink);font-family:inherit;font-size:.88rem;
      font-weight:800;cursor:pointer;box-shadow:var(--shadow);white-space:nowrap
    }
    .phase2-control-btn:hover,.phase2-control-btn:focus-visible{border-color:var(--brand);color:var(--brand)}
    .phase2-control-btn.active{background:var(--brand-soft);border-color:var(--brand);color:var(--brand)}
    .phase2-control-btn:disabled{opacity:.5;cursor:not-allowed}
    .phase2-index-retired{display:none!important}

    .phase2-sheet{
      position:fixed;inset:0;z-index:360;display:none;align-items:center;justify-content:center;
      padding:20px;background:rgba(15,23,42,.45)
    }
    .phase2-sheet.show{display:flex}
    .phase2-sheet-card{
      width:min(520px,100%);max-height:min(76vh,680px);overflow:auto;background:var(--card);
      color:var(--ink);border:1px solid var(--line);border-radius:18px;padding:16px;
      box-shadow:0 24px 60px rgba(15,23,42,.28)
    }
    .phase2-sheet-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
    .phase2-sheet-head h3{margin:0;font-size:1.05rem;color:var(--ink)}
    .phase2-sheet-close{
      width:40px;height:40px;border:0;border-radius:10px;background:var(--brand-soft);
      color:var(--brand);font:800 1rem/1 inherit;cursor:pointer
    }
    .phase2-filter-fields{display:grid;gap:12px}
    .phase2-filter-fields label{display:grid;gap:6px;color:var(--muted);font-size:.82rem;font-weight:800}
    .phase2-filter-fields select{
      width:100%;min-height:44px;padding:9px 12px;border:1px solid var(--line);border-radius:11px;
      background:var(--card);color:var(--ink);font-family:inherit;font-size:.9rem
    }
    .phase2-filter-fields #clearBtn{
      min-height:44px;margin-top:2px;padding:9px 14px;border:0;border-radius:11px;
      background:var(--brand);color:#fff;font-family:inherit;font-size:.9rem;font-weight:800;cursor:pointer
    }
    .phase2-native-section-select{display:none!important}
    .phase2-section-list{display:grid;gap:7px}
    .phase2-section-item{
      width:100%;min-height:44px;padding:10px 12px;border:1px solid var(--line);border-radius:11px;
      background:var(--card);color:var(--ink);font-family:inherit;font-size:.88rem;font-weight:700;
      text-align:start;cursor:pointer
    }
    .phase2-section-item:hover,.phase2-section-item.active{background:var(--brand-soft);border-color:var(--brand);color:var(--brand)}

    @media(max-width:760px){
      body.phase2-study-enabled header{margin:0;border-radius:0;padding:11px 12px 10px;box-shadow:none}
      body.phase2-study-enabled header h1{font-size:1.12rem}
      body.phase2-study-enabled header p{font-size:.74rem}
      body.phase2-study-enabled .stats{padding:0 10px;gap:5px;margin-top:9px}
      .phase2-summary-item{padding:8px 5px;border-radius:11px}
      .phase2-summary-item span{font-size:.68rem}
      .phase2-summary-item b{font-size:.86rem}
      body.phase2-study-enabled .filterbar.phase2-study-controls{
        grid-template-columns:1fr 1fr;padding:0 10px;gap:7px;margin-top:10px
      }
      .phase2-study-controls #search{grid-column:1/-1;height:43px}
      .phase2-control-btn{min-height:44px;padding:8px 9px;font-size:.82rem}
      .phase2-sheet{align-items:flex-end;padding:0}
      .phase2-sheet-card{width:100%;max-height:78vh;border-radius:20px 20px 0 0;padding:15px 14px calc(15px + env(safe-area-inset-bottom))}
    }

    @media print{
      .phase2-sheet{display:none!important}
    }
  `;
  document.head.appendChild(style);

  /* Preserve all legacy stat targets for the engines, but remove them from the visible hierarchy. */
  const legacyStats = document.createElement('div');
  legacyStats.className = 'phase2-legacy-stats';
  legacyStats.id = 'phase2LegacyStats';
  ['statProgress','statFav','statMastered','statScore','statStreak','statTime'].forEach(id => {
    const el = document.getElementById(id);
    if (el) legacyStats.appendChild(el);
  });
  document.body.appendChild(legacyStats);

  function summaryItem(label, id, extraClass=''){
    const item = document.createElement('div');
    item.className = 'phase2-summary-item' + (extraClass ? ' ' + extraClass : '');
    item.innerHTML = `<span>${label}</span><b id="${id}">—</b>`;
    return item;
  }
  stats.replaceChildren(
    summaryItem('درست','phase2Studied'),
    summaryItem('الإتقان','phase2Mastery'),
    summaryItem('تحتاج مراجعة','phase2Review','review')
  );

  function refreshSummary(){
    const questions = engine.allQuestions();
    const state = engine.state || {};
    const total = questions.length || 0;
    const studied = questions.filter(q => !!state.revealed?.[q.id]).length;
    let mastered = questions.filter(q => !!state.mastered?.[q.id]).length;
    if (window.StudyV2?.getMastery) {
      mastered = questions.filter(q => window.StudyV2.getMastery(q.id)?.key === 'mastered').length;
    }
    const review = window.StudyV2?.getWeakQuestions
      ? window.StudyV2.getWeakQuestions().length
      : questions.filter(q => (Number(state.wrong?.[q.id]) || 0) > 0).length;
    const pct = total ? Math.round(mastered / total * 100) : 0;
    document.getElementById('phase2Studied').textContent = `${studied}/${total}`;
    document.getElementById('phase2Mastery').textContent = `${pct}%`;
    document.getElementById('phase2Mastery').title = `${mastered} من ${total}`;
    document.getElementById('phase2Review').textContent = String(review);
  }

  const statObserver = new MutationObserver(refreshSummary);
  statObserver.observe(legacyStats,{subtree:true,childList:true,characterData:true});
  refreshSummary();

  /* Build progressive-disclosure study controls while retaining original engine controls and listeners. */
  filterbar.classList.add('phase2-study-controls');
  search.placeholder = '🔍 ابحث في الأسئلة…';
  search.setAttribute('aria-label','البحث في الأسئلة');

  const filterBtn = document.createElement('button');
  filterBtn.type = 'button';
  filterBtn.id = 'phase2FilterBtn';
  filterBtn.className = 'phase2-control-btn';
  filterBtn.textContent = '☰ فلترة';
  filterBtn.setAttribute('aria-haspopup','dialog');

  const sectionsBtn = document.createElement('button');
  sectionsBtn.type = 'button';
  sectionsBtn.id = 'phase2SectionsBtn';
  sectionsBtn.className = 'phase2-control-btn';
  sectionsBtn.textContent = 'الأقسام ▾';
  sectionsBtn.setAttribute('aria-haspopup','dialog');

  filterbar.replaceChildren(search,filterBtn,sectionsBtn);

  function createSheet(id,title){
    const sheet = document.createElement('div');
    sheet.className = 'phase2-sheet';
    sheet.id = id;
    sheet.setAttribute('role','dialog');
    sheet.setAttribute('aria-modal','true');
    sheet.setAttribute('aria-label',title);
    const card = document.createElement('div');
    card.className = 'phase2-sheet-card';
    const head = document.createElement('div');
    head.className = 'phase2-sheet-head';
    const h = document.createElement('h3');
    h.textContent = title;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'phase2-sheet-close';
    close.textContent = '✕';
    close.setAttribute('aria-label','إغلاق');
    head.append(h,close);
    const body = document.createElement('div');
    card.append(head,body);
    sheet.appendChild(card);
    document.body.appendChild(sheet);
    const hide = () => { sheet.classList.remove('show'); document.body.classList.remove('phase2-sheet-open'); };
    const show = () => { sheet.classList.add('show'); document.body.classList.add('phase2-sheet-open'); };
    close.addEventListener('click',hide);
    sheet.addEventListener('click',e => { if (e.target === sheet) hide(); });
    return {sheet,body,show,hide};
  }

  const filterSheet = createSheet('phase2FilterSheet','فلترة وترتيب الأسئلة');
  const fields = document.createElement('div');
  fields.className = 'phase2-filter-fields';
  const filterLabel = document.createElement('label');
  filterLabel.textContent = 'عرض الأسئلة';
  filterLabel.appendChild(filterBy);
  const sortLabel = document.createElement('label');
  sortLabel.textContent = 'الترتيب';
  sortLabel.appendChild(sortBy);
  clearBtn.textContent = 'مسح الفلاتر';
  fields.append(filterLabel,sortLabel,clearBtn);
  filterSheet.body.appendChild(fields);

  const sectionsSheet = createSheet('phase2SectionsSheet','الأقسام');
  secFilter.classList.add('phase2-native-section-select');
  sectionsSheet.body.appendChild(secFilter);
  const sectionList = document.createElement('div');
  sectionList.className = 'phase2-section-list';
  sectionsSheet.body.appendChild(sectionList);

  function updateFilterButton(){
    const active = filterBy.value !== 'all' || sortBy.value !== 'default';
    filterBtn.classList.toggle('active',active);
    filterBtn.textContent = active ? '☰ فلترة •' : '☰ فلترة';
  }

  function updateSectionsButton(){
    const idx = secFilter.selectedIndex;
    sectionsBtn.classList.toggle('active',idx > 0);
    sectionsBtn.textContent = idx > 0 ? `القسم ${idx} ▾` : 'الأقسام ▾';
    sectionList.querySelectorAll('.phase2-section-item').forEach(btn => {
      btn.classList.toggle('active',btn.dataset.sectionValue === secFilter.value);
    });
  }

  Array.from(secFilter.options).forEach((option,idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'phase2-section-item';
    btn.dataset.sectionValue = option.value;
    btn.textContent = idx === 0 ? 'كل الأقسام' : option.textContent;
    btn.addEventListener('click',() => {
      secFilter.value = option.value;
      secFilter.dispatchEvent(new Event('change',{bubbles:true}));
      updateSectionsButton();
      sectionsSheet.hide();
    });
    sectionList.appendChild(btn);
  });

  filterBtn.addEventListener('click',() => { if (!filterBtn.disabled) filterSheet.show(); });
  sectionsBtn.addEventListener('click',() => { if (!sectionsBtn.disabled) sectionsSheet.show(); });
  filterBy.addEventListener('change',updateFilterButton);
  sortBy.addEventListener('change',updateFilterButton);
  secFilter.addEventListener('change',updateSectionsButton);
  clearBtn.addEventListener('click',() => setTimeout(() => {
    updateFilterButton();
    updateSectionsButton();
    filterSheet.hide();
  },0));

  function syncDisabled(){
    filterBtn.disabled = !!(filterBy.disabled || sortBy.disabled || clearBtn.disabled);
    sectionsBtn.disabled = !!secFilter.disabled;
    if (filterBtn.disabled) filterSheet.hide();
    if (sectionsBtn.disabled) sectionsSheet.hide();
  }
  const controlObserver = new MutationObserver(syncDisabled);
  [secFilter,filterBy,sortBy,clearBtn].forEach(el => controlObserver.observe(el,{attributes:true,attributeFilter:['disabled']}));
  syncDisabled();
  updateFilterButton();
  updateSectionsButton();

  if (index) {
    index.classList.add('phase2-index-retired');
    index.setAttribute('aria-hidden','true');
  }

  document.addEventListener('keydown',e => {
    if (e.key !== 'Escape') return;
    filterSheet.hide();
    sectionsSheet.hide();
  });

  window.StudyPhase2 = {
    refreshSummary,
    openFilters:filterSheet.show,
    openSections:sectionsSheet.show
  };
})();
