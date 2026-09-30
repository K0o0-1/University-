(function(){
  'use strict';

  const engine = window.StudyEngine;
  const studyV2 = window.StudyV2;
  const modal = document.getElementById('statsPageModal');
  const content = document.getElementById('statsPageContent');
  if (!engine || !studyV2 || !modal || !content) {
    console.warn('Study Phase 5: analytics APIs missing');
    return;
  }

  document.body.classList.add('phase5-analytics-ux-enabled');
  modal.classList.add('phase5-analytics-modal');
  modal.querySelector('.stats-page-card')?.classList.add('phase5-stats-card');

  const style = document.createElement('style');
  style.id = 'phase5AnalyticsStyles';
  style.textContent = `
    #statsPageModal.phase5-analytics-modal{padding:18px}
    #statsPageModal .phase5-stats-card{width:min(1040px,calc(100vw - 36px));max-width:1040px;max-height:92vh;padding:0;overflow:hidden;display:flex;flex-direction:column;border:1px solid var(--line);border-radius:20px;background:var(--card);box-shadow:0 20px 54px rgba(15,23,42,.16)}
    #statsPageModal .stats-page-head{flex:0 0 auto;margin:0;padding:17px 20px 9px;border-bottom:0}
    #statsPageModal .stats-page-head h3{margin:0;font-size:1.14rem}
    .phase5-stats-subtitle{flex:0 0 auto;margin:0;padding:0 20px 13px;color:var(--muted);font-size:.78rem;line-height:1.55;border-bottom:1px solid var(--line)}
    #statsPageContent{min-height:0;overflow:auto;padding:14px 18px 22px}
    .phase5-tabs{position:sticky;top:0;z-index:8;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:-2px 0 14px;padding:2px 0 9px;background:var(--card)}
    .phase5-tab{min-height:42px;padding:8px 10px;border:1px solid var(--line);border-radius:11px;background:var(--card);color:var(--ink);font-family:inherit;font-size:.8rem;font-weight:850;cursor:pointer}
    .phase5-tab.active{background:var(--brand-soft);border-color:var(--brand);color:var(--brand)}
    .phase5-panel[hidden]{display:none!important}
    .phase5-overview-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-bottom:9px}
    .phase5-highlight{min-width:0;padding:13px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}
    .phase5-highlight span{display:block;color:var(--muted);font-size:.72rem;font-weight:750;line-height:1.4}
    .phase5-highlight b{display:block;margin-top:5px;color:var(--ink);font-size:1.18rem;line-height:1.2;overflow-wrap:anywhere}
    .phase5-secondary{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:13px}
    .phase5-secondary span{display:inline-flex;gap:5px;align-items:center;padding:6px 9px;border:1px solid var(--line);border-radius:999px;background:var(--card);color:var(--muted);font-size:.72rem}
    .phase5-secondary b{color:var(--ink)}
    .phase5-panel .analytics-section{margin:0 0 12px;padding:13px;border:1px solid var(--line);border-radius:14px;background:var(--card);box-shadow:none}
    .phase5-panel .analytics-section h4{margin:0 0 9px;font-size:.9rem}
    .phase5-more-summary{margin:0 0 12px;border:1px solid var(--line);border-radius:13px;background:var(--card)}
    .phase5-more-summary>summary{padding:10px 12px;cursor:pointer;font-size:.8rem;font-weight:850;color:var(--ink)}
    .phase5-more-summary>.analytics-section{margin:0;border:0;border-top:1px solid var(--line);border-radius:0}
    .phase5-more-summary>.analytics-section>h4{display:none}
    .phase5-more-summary .analytics-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
    .phase5-more-summary .analytics-trend{margin-bottom:0}
    .phase5-weak-toggle{display:block;width:100%;min-height:40px;margin-top:9px;border:1px solid var(--line);border-radius:10px;background:var(--soft);color:var(--ink);font-family:inherit;font-size:.76rem;font-weight:800;cursor:pointer}
    .phase5-weak-collapsed .weak-list .weak-item:nth-child(n+4){display:none!important}
    .phase5-panel .plus-trend{margin-top:0}
    .phase5-panel .history-list{gap:7px}
    .phase5-panel .history-card{border-radius:11px}
    .phase5-panel .table-scroll{max-width:100%;overflow:auto;border-radius:10px}
    .phase5-panel .analytics-table{min-width:620px}
    .phase5-empty-note{margin:0;padding:18px;text-align:center;color:var(--muted)}
    @media(max-width:760px){
      #statsPageModal.phase5-analytics-modal{align-items:stretch;padding:0}
      #statsPageModal .phase5-stats-card{width:100%;max-width:none;max-height:100dvh;height:100dvh;border-radius:0;border:0}
      #statsPageModal .stats-page-head{padding:13px 14px 7px}
      .phase5-stats-subtitle{padding:0 14px 10px}
      #statsPageContent{padding:10px 10px calc(18px + env(safe-area-inset-bottom))}
      .phase5-tabs{gap:5px;margin:0 0 10px;padding-bottom:7px}
      .phase5-tab{min-height:40px;padding:7px 5px;font-size:.72rem}
      .phase5-overview-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}
      .phase5-highlight{padding:10px}.phase5-highlight b{font-size:1.05rem}
      .phase5-more-summary .analytics-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
      .phase5-panel .analytics-section{padding:11px}
    }
    @media(max-width:380px){.phase5-tab{font-size:.68rem}.phase5-highlight{padding:9px}}
    @media print{.phase5-tabs,.phase5-weak-toggle,.phase5-stats-subtitle{display:none!important}.phase5-panel[hidden]{display:block!important}}
  `;
  document.head.appendChild(style);

  const textOf = (root,selector) => root?.querySelector(selector)?.textContent?.trim() || '';
  const sectionByTitle = (sections,title) => sections.find(section => textOf(section,'h4').includes(title));

  function metricMap(summarySection){
    const result = new Map();
    summarySection?.querySelectorAll('.analytics-card').forEach(card => {
      const key = textOf(card,'span');
      const value = textOf(card,'b');
      if (key) result.set(key,value || '—');
    });
    return result;
  }

  function highlight(label,value){
    const box = document.createElement('div');
    box.className = 'phase5-highlight';
    const span = document.createElement('span');
    span.textContent = label;
    const strong = document.createElement('b');
    strong.textContent = value || '—';
    box.append(span,strong);
    return box;
  }

  function setTab(root,name){
    root.querySelectorAll('.phase5-tab').forEach(btn => {
      const active = btn.dataset.phase5Tab === name;
      btn.classList.toggle('active',active);
      btn.setAttribute('aria-selected',String(active));
      btn.tabIndex = active ? 0 : -1;
    });
    root.querySelectorAll('.phase5-panel').forEach(panel => {
      panel.hidden = panel.dataset.phase5Panel !== name;
    });
  }

  function addWeakDisclosure(section){
    if (!section) return;
    const list = section.querySelector('.weak-list');
    const items = list ? Array.from(list.querySelectorAll('.weak-item')) : [];
    section.querySelector('.phase5-weak-toggle')?.remove();
    section.classList.remove('phase5-weak-collapsed');
    if (items.length <= 3) return;
    section.classList.add('phase5-weak-collapsed');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'phase5-weak-toggle';
    btn.textContent = `عرض كل نقاط الضعف (${items.length})`;
    btn.addEventListener('click',() => {
      const collapsed = section.classList.toggle('phase5-weak-collapsed');
      btn.textContent = collapsed ? `عرض كل نقاط الضعف (${items.length})` : 'عرض أول 3 فقط';
    });
    section.appendChild(btn);
  }

  function decorate(){
    if (content.querySelector('#phase5AnalyticsRoot')) return;
    const sections = Array.from(content.children).filter(el => el.classList?.contains('analytics-section'));
    if (sections.length < 4) return;

    const summarySection = sectionByTitle(sections,'ملخص المادة');
    const sectionsSection = sectionByTitle(sections,'إحصائيات كل قسم');
    const weakSection = sectionByTitle(sections,'أهم نقاط الضعف');
    const recentSection = sectionByTitle(sections,'آخر الاختبارات');
    const trendSection = sections.find(section => section.classList.contains('plus-trend'));
    const historySection = sections.find(section => section.classList.contains('plus-history'));
    if (!summarySection || !sectionsSection || !weakSection || !recentSection) return;

    const metrics = metricMap(summarySection);
    const root = document.createElement('div');
    root.id = 'phase5AnalyticsRoot';

    const tabs = document.createElement('div');
    tabs.className = 'phase5-tabs';
    tabs.setAttribute('role','tablist');
    tabs.setAttribute('aria-label','أقسام الإحصائيات');
    tabs.innerHTML = `
      <button type="button" class="phase5-tab active" data-phase5-tab="overview" role="tab" aria-selected="true">نظرة عامة</button>
      <button type="button" class="phase5-tab" data-phase5-tab="sections" role="tab" aria-selected="false">الأقسام</button>
      <button type="button" class="phase5-tab" data-phase5-tab="tests" role="tab" aria-selected="false">الاختبارات</button>`;

    const overview = document.createElement('section');
    overview.className = 'phase5-panel';
    overview.dataset.phase5Panel = 'overview';
    const grid = document.createElement('div');
    grid.className = 'phase5-overview-grid';
    grid.append(
      highlight('تمت الدراسة',metrics.get('تمت الدراسة')),
      highlight('الإتقان الذكي',metrics.get('الإتقان الذكي')),
      highlight('نقاط الضعف',metrics.get('نقاط الضعف')),
      highlight('متوسط النتائج',metrics.get('متوسط النتائج'))
    );
    const secondary = document.createElement('div');
    secondary.className = 'phase5-secondary';
    secondary.innerHTML = `<span>الاختبارات <b>${metrics.get('عدد الاختبارات') || '0'}</b></span><span>أفضل نتيجة <b>${metrics.get('أفضل نتيجة') || '0%'}</b></span>`;
    const summaryDetails = document.createElement('details');
    summaryDetails.id = 'phase5SummaryDetails';
    summaryDetails.className = 'phase5-more-summary';
    summaryDetails.innerHTML = '<summary>كل مؤشرات الملخص</summary>';
    summaryDetails.appendChild(summarySection);
    overview.append(grid,secondary);
    if (weakSection) { addWeakDisclosure(weakSection); overview.appendChild(weakSection); }
    if (trendSection) overview.appendChild(trendSection);
    overview.appendChild(summaryDetails);

    const sectionsPanel = document.createElement('section');
    sectionsPanel.className = 'phase5-panel';
    sectionsPanel.dataset.phase5Panel = 'sections';
    sectionsPanel.hidden = true;
    sectionsPanel.appendChild(sectionsSection);

    const testsPanel = document.createElement('section');
    testsPanel.className = 'phase5-panel';
    testsPanel.dataset.phase5Panel = 'tests';
    testsPanel.hidden = true;
    testsPanel.appendChild(recentSection);
    if (historySection) testsPanel.appendChild(historySection);

    root.append(tabs,overview,sectionsPanel,testsPanel);
    content.replaceChildren(root);

    tabs.addEventListener('click',event => {
      const btn = event.target.closest('[data-phase5-tab]');
      if (btn) setTab(root,btn.dataset.phase5Tab);
    });
    tabs.addEventListener('keydown',event => {
      if (!['ArrowRight','ArrowLeft'].includes(event.key)) return;
      const buttons = Array.from(tabs.querySelectorAll('.phase5-tab'));
      const current = buttons.indexOf(document.activeElement);
      if (current < 0) return;
      const delta = event.key === 'ArrowRight' ? -1 : 1;
      const next = buttons[(current + delta + buttons.length) % buttons.length];
      next.focus();
      next.click();
      event.preventDefault();
    });

    const subtitle = modal.querySelector('.phase5-stats-subtitle') || document.createElement('p');
    subtitle.className = 'phase5-stats-subtitle';
    subtitle.textContent = 'ابدأ بالصورة العامة، وافتح تفاصيل الأقسام أو الاختبارات عند الحاجة.';
    const head = modal.querySelector('.stats-page-head');
    if (head && !subtitle.isConnected) head.insertAdjacentElement('afterend',subtitle);
    modal.querySelector('.stats-page-head h3').textContent = '📊 الإحصائيات والتقدم';
  }

  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      decorate();
    });
  });
  observer.observe(content,{childList:true});
  decorate();

  window.StudyPhase5 = {
    decorate,
    openOverview:() => { const root = content.querySelector('#phase5AnalyticsRoot'); if (root) setTab(root,'overview'); },
    openSections:() => { const root = content.querySelector('#phase5AnalyticsRoot'); if (root) setTab(root,'sections'); },
    openTests:() => { const root = content.querySelector('#phase5AnalyticsRoot'); if (root) setTab(root,'tests'); }
  };
})();
