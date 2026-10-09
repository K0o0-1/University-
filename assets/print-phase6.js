(function(){
  'use strict';

  const engine = window.StudyEngine;
  if (!engine) { console.warn('Study Phase 6: print API missing'); return; }

  const questions = () => engine.allQuestions?.() || [];
  const kind = engine.kind === 'qa' ? 'qa' : 'mcq';
  const material = engine.material || {};
  const sections = engine.sections || [];
  const printButton = document.querySelector('[data-action="print"]');
  if (!printButton) { console.warn('Study Phase 6: print button missing'); return; }

  document.body.classList.add('phase6-print-enabled');

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const letter = index => String.fromCharCode(65 + Number(index || 0));
  const sectionInfo = secId => {
    const idx = Number(String(secId || '').replace('sec','')) - 1;
    const sec = sections[idx];
    return sec ? {number:idx + 1,title:sec.title,badge:sec.badge} : {number:'',title:'القسم الحالي',badge:''};
  };
  const sectionLabel = secId => {
    const info = sectionInfo(secId);
    return info.number ? `${info.number}. ${info.title} — ${info.badge}` : info.title;
  };

  const style = document.createElement('style');
  style.id = 'phase6PrintStyles';
  style.textContent = `
    #phase6PrintModal .phase6-print-card{width:min(650px,calc(100vw - 32px));max-width:650px}
    .phase6-print-intro{margin:0 0 15px;color:var(--muted);font-size:.82rem;line-height:1.7}
    .phase6-print-group{margin:0 0 15px;padding:12px;border:1px solid var(--line);border-radius:13px;background:var(--soft)}
    .phase6-print-group h4{margin:0 0 9px;font-size:.87rem;color:var(--ink)}
    .phase6-print-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
    .phase6-print-choice{position:relative;display:block;cursor:pointer}
    .phase6-print-choice input{position:absolute;opacity:0;pointer-events:none}
    .phase6-print-choice span{display:flex;align-items:center;justify-content:center;min-height:48px;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--ink);font-size:.78rem;font-weight:800;text-align:center;line-height:1.45}
    .phase6-print-choice input:checked+span{border-color:var(--brand);background:var(--brand-soft);color:var(--brand)}
    .phase6-print-summary{margin:0 0 13px;padding:10px 12px;border:1px solid var(--line);border-radius:11px;background:var(--card);color:var(--muted);font-size:.78rem;line-height:1.65}
    .phase6-print-summary b{color:var(--ink)}
    #phase6PrintDocument{display:none}
    @media(max-width:620px){
      #phase6PrintModal{align-items:flex-end;padding:0}
      #phase6PrintModal .phase6-print-card{width:100%;max-width:none;border-radius:18px 18px 0 0;padding:16px 14px calc(14px + env(safe-area-inset-bottom))}
      .phase6-print-options{grid-template-columns:1fr}
      .phase6-print-choice span{min-height:44px}
    }
    @media print{
      @page{size:A4 portrait;margin:12mm 12mm 14mm}
      html,body{margin:0!important;padding:0!important;background:#fff!important;color:#111!important}
      body.phase6-printing>*:not(#phase6PrintDocument){display:none!important}
      body.phase6-printing #phase6PrintDocument{display:block!important;width:auto!important;max-width:none!important;margin:0!important;padding:0!important;background:#fff!important;color:#111!important;font-family:Arial,"Noto Sans Arabic",sans-serif!important;font-size:10.5pt!important;line-height:1.55!important}
      #phase6PrintDocument *{box-sizing:border-box!important;box-shadow:none!important;text-shadow:none!important}
      .phase6-print-header{padding:0 0 7mm;border-bottom:1.4pt solid #222;margin-bottom:6mm;break-after:avoid-page}
      .phase6-print-kicker{font-size:8pt;letter-spacing:.08em;color:#555;text-transform:uppercase;margin-bottom:1.5mm}
      .phase6-print-title{margin:0;font-size:17pt;line-height:1.25;color:#111}
      .phase6-print-meta{display:flex;flex-wrap:wrap;gap:2mm 5mm;margin-top:2.5mm;color:#444;font-size:8.7pt}
      .phase6-print-index{margin:0 0 7mm;padding:4mm;border:1px solid #bbb;border-radius:2mm;break-inside:avoid-page}
      .phase6-print-index h2{margin:0 0 2.5mm;font-size:11pt}
      .phase6-print-index ul{display:block;margin:0;padding:0;list-style:none;columns:auto!important;column-count:1!important}
      .phase6-print-index li{display:block;margin:0 0 1.5mm;padding:0;break-inside:avoid;font-size:9pt}
      .phase6-print-index a{display:block;padding:1.2mm 1.5mm;border-bottom:.5pt solid #ddd;color:#111!important;text-decoration:none!important;line-height:1.5}
      .phase6-print-index li:last-child a{border-bottom:0}
      .phase6-print-index a:hover,.phase6-print-index a:focus{text-decoration:underline!important}
      .phase6-print-section{margin:0 0 6mm;break-inside:auto;scroll-margin-top:8mm}
      .phase6-print-section-title{display:flex;align-items:center;gap:2.5mm;margin:0 0 3mm;padding:2mm 0;border-bottom:1pt solid #555;font-size:11.5pt;font-weight:800;break-after:avoid-page;page-break-after:avoid}
      .phase6-print-section-title small{font-size:8.5pt;font-weight:600;color:#555}
      .phase6-question{margin:0 0 3.4mm;padding:3.2mm;border:1px solid #c7c7c7;border-radius:2mm;background:#fff;break-inside:avoid-page;page-break-inside:avoid}
      .phase6-qhead{display:grid;grid-template-columns:8mm minmax(0,1fr);align-items:start;gap:2.5mm;margin-bottom:2mm}
      .phase6-qnum{display:flex;align-items:center;justify-content:center;min-width:8mm;height:8mm;border:1px solid #555;border-radius:50%;font-weight:800;font-size:8.7pt}
      .phase6-qtext{margin:0;font-size:10.5pt;font-weight:700;overflow-wrap:anywhere}
      .phase6-options{margin:0;padding-inline-start:8mm;list-style:none}
      .phase6-option{display:grid;grid-template-columns:7mm minmax(0,1fr);gap:1.5mm;align-items:start;margin:.8mm 0;padding:1mm 1.5mm;border-radius:1mm;break-inside:avoid}
      .phase6-option-label{font-weight:800}
      .phase6-option-cell{min-width:0;overflow-wrap:anywhere}
      .phase6-option.is-answer{border:0;background:transparent;font-weight:400}
      .phase6-option-text.is-answer-text{background:#e2e2e2!important;color:#111!important;font-weight:800;box-decoration-break:clone;-webkit-box-decoration-break:clone;padding:0 1mm;print-color-adjust:exact;-webkit-print-color-adjust:exact}
      .phase6-answer-mark{display:none!important}
      .phase6-qa-answer{margin:2.5mm 0 0;padding:2.5mm 3mm;border-inline-start:3pt solid #555;background:#f3f3f3;break-inside:avoid}
      .phase6-answer-key{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:2mm;margin-top:2mm}
      .phase6-key-item{padding:2mm;border:1px solid #aaa;border-radius:1.5mm;text-align:center;font-size:9pt;font-weight:800;break-inside:avoid}
      .phase6-print-section + .phase6-print-section{break-before:page}
      .phase6-print-section-title{break-inside:avoid-page}
      @page{ @bottom-center{content:counter(page);font:9pt Arial,sans-serif;color:#666;} }
      .phase6-print-footer{display:none!important;margin-top:8mm;padding-top:3mm;border-top:1px solid #aaa;text-align:center;font-size:8pt;color:#555;break-inside:avoid}
      .phase6-print-footer a{color:#444!important;text-decoration:underline!important;text-underline-offset:1.5pt}
      .phase6-print-empty{padding:15mm 0;text-align:center;color:#555}
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.id = 'phase6PrintModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-card phase6-print-card">
      <h3>🖨 إعداد الطباعة</h3>
      <p class="phase6-print-intro">اختر محتوى الطباعة ونطاقها. سيتم فتح معاينة المتصفح بصيغة مناسبة لـ A4 وPDF.</p>
      <section class="phase6-print-group">
        <h4>المحتوى</h4>
        <div class="phase6-print-options" id="phase6PrintContentOptions">
          <label class="phase6-print-choice"><input type="radio" name="phase6-content" value="questions" checked><span>الأسئلة فقط</span></label>
          <label class="phase6-print-choice"><input type="radio" name="phase6-content" value="answers"><span>الأسئلة + الإجابات</span></label>
          ${kind === 'mcq' ? '<label class="phase6-print-choice"><input type="radio" name="phase6-content" value="key"><span>مفتاح الإجابات فقط</span></label>' : ''}
        </div>
      </section>
      <section class="phase6-print-group">
        <h4>النطاق</h4>
        <div class="phase6-print-options">
          <label class="phase6-print-choice"><input type="radio" name="phase6-scope" value="all" checked><span>كل المادة</span></label>
          <label class="phase6-print-choice"><input type="radio" name="phase6-scope" value="section"><span>القسم الحالي</span></label>
          <label class="phase6-print-choice"><input type="radio" name="phase6-scope" value="filtered"><span>النتائج الحالية</span></label>
        </div>
      </section>
      <div class="phase6-print-summary" id="phase6PrintSummary"></div>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" id="phase6PrintCancel">إلغاء</button>
        <button type="button" class="btn-primary" id="phase6PrintGo">معاينة / طباعة</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const printDoc = document.createElement('article');
  printDoc.id = 'phase6PrintDocument';
  printDoc.setAttribute('aria-hidden','true');
  document.body.appendChild(printDoc);

  const checked = name => modal.querySelector(`input[name="${name}"]:checked`)?.value;

  function currentSectionId(){
    const explicit = document.getElementById('secFilter')?.value;
    if (explicit) return explicit;
    const candidates = Array.from(document.querySelectorAll('main > section:not(.hidden)')).filter(sec => sec.id && sec.id.startsWith('sec'));
    const atViewport = candidates.find(sec => {
      const r = sec.getBoundingClientRect();
      return r.top <= 180 && r.bottom > 100;
    });
    if (atViewport) return atViewport.id;
    const firstVisible = questions().find(q => !q.el.classList.contains('hidden'));
    return firstVisible?.sec || questions()[0]?.sec || 'sec1';
  }

  function resolve(scope){
    if (scope === 'filtered') return engine.filteredItems?.() || questions().filter(q => !q.el.classList.contains('hidden'));
    if (scope === 'section') {
      const secId = currentSectionId();
      return questions().filter(q => q.sec === secId);
    }
    return questions();
  }

  function scopeLabel(scope,list){
    if (scope === 'section') return sectionLabel(list[0]?.sec || currentSectionId());
    if (scope === 'filtered') return 'النتائج الحالية';
    return 'كل المادة';
  }

  function contentLabel(content){
    if (content === 'answers') return 'الأسئلة + الإجابات';
    if (content === 'key') return 'مفتاح الإجابات فقط';
    return 'الأسئلة فقط';
  }

  function grouped(list){
    const map = new Map();
    list.forEach(q => {
      if (!map.has(q.sec)) map.set(q.sec,[]);
      map.get(q.sec).push(q);
    });
    return map;
  }

  function renderIndex(list){
    const groups = grouped(list);
    const items = Array.from(groups.entries()).map(([secId]) => {
      const info = sectionInfo(secId);
      const label = info.number ? `${info.number}. ${info.title} — ${info.badge}` : info.title;
      return `<li><a href="#phase6-section-${esc(secId)}">${esc(label)}</a></li>`;
    }).join('');
    return `<nav class="phase6-print-index" aria-label="فهرس الأقسام"><h2>فهرس الأقسام</h2><ul>${items}</ul></nav>`;
  }

  function renderMcqQuestion(q,withAnswer){
    const opts = (q.o || []).map((text,index) => {
      const answer = Number(index) === Number(q.a);
      return `<li class="phase6-option${withAnswer && answer ? ' is-answer' : ''}"><span class="phase6-option-label">${letter(index)})</span><span class="phase6-option-cell"><span class="phase6-option-text${withAnswer && answer ? ' is-answer-text' : ''}">${esc(text)}</span></span></li>`;
    }).join('');
    return `<article class="phase6-question" data-phase6-qid="${esc(q.id)}"><div class="phase6-qhead"><span class="phase6-qnum">${q.num}</span><p class="phase6-qtext">${esc(q.q)}</p></div><ol class="phase6-options">${opts}</ol></article>`;
  }

  function renderQaQuestion(q,withAnswer){
    const answer = withAnswer ? `<div class="phase6-qa-answer"><div>${esc(q.a)}</div></div>` : '';
    return `<article class="phase6-question" data-phase6-qid="${esc(q.id)}"><div class="phase6-qhead"><span class="phase6-qnum">${q.num}</span><p class="phase6-qtext">${esc(q.q)}</p></div>${answer}</article>`;
  }

  function renderSections(list,content){
    const groups = grouped(list);
    return Array.from(groups.entries()).map(([secId,items]) => {
      const body = items.map(q => kind === 'mcq' ? renderMcqQuestion(q,content === 'answers') : renderQaQuestion(q,content === 'answers')).join('');
      return `<section id="phase6-section-${esc(secId)}" class="phase6-print-section" data-phase6-section="${esc(secId)}"><h2 class="phase6-print-section-title"><span>${esc(sectionLabel(secId))}</span><small>${items.length} سؤال</small></h2>${body}</section>`;
    }).join('');
  }

  function renderKey(list){
    const groups = grouped(list);
    return Array.from(groups.entries()).map(([secId,items]) => `<section id="phase6-section-${esc(secId)}" class="phase6-print-section" data-phase6-section="${esc(secId)}"><h2 class="phase6-print-section-title"><span>${esc(sectionLabel(secId))}</span><small>${items.length} إجابة</small></h2><div class="phase6-answer-key">${items.map(q => `<div class="phase6-key-item">${q.num}-${letter(q.a)}</div>`).join('')}</div></section>`).join('');
  }

  function authorFooter(){
    const cfg = window.UniversityPrintConfig || {};
    const author = typeof cfg.author === 'string' ? cfg.author.trim().slice(0,100) : 'Eng. Khalid Al-sofi';
    const link = typeof cfg.authorUrl === 'string' ? cfg.authorUrl : 'https://wa.me/967771179020';
    const validLink = /^https:\/\/[^\s<>"']+$/i.test(link);
    if (!author) return '';
    return `<footer class="phase6-print-footer">${validLink ? `<a href="${esc(link)}" rel="noopener noreferrer">${esc(author)}</a>` : esc(author)}</footer>`;
  }

  function updatePageHeaders(list){
    let node=document.getElementById('phase6NamedPages');
    if(!node){node=document.createElement('style');node.id='phase6NamedPages';document.head.appendChild(node);}
    const infos=[...grouped(list).keys()].map(secId=>({secId,label:sectionLabel(secId)}));
    // Named page margin boxes repeat the active section on every printed page (Chromium).
    const author=typeof window.UniversityPrintConfig?.author==='string'?window.UniversityPrintConfig.author.slice(0,100):'Eng. Khalid Al-sofi';
    node.textContent=`@media print{ @page{ @bottom-left{content:${JSON.stringify(author)};font:8pt Arial,sans-serif;color:#666} } }`+infos.map(({secId,label}) => {
      const key=String(secId).replace(/[^a-zA-Z0-9-]/g,'');
      const name=JSON.stringify(label.slice(0,95));
      return `@media print{ @page phase6-${key}{@top-center{content:${name};font:8pt Arial,sans-serif;color:#555}} #phase6PrintDocument [data-phase6-section="${key}"]{page:phase6-${key}} }`;
    }).join('\n');
  }

  function prepare(options={}){
    const content = options.content || checked('phase6-content') || 'questions';
    const scope = options.scope || checked('phase6-scope') || 'all';
    const safeContent = kind === 'qa' && content === 'key' ? 'questions' : content;
    const list = resolve(scope);
    const title = material.title || document.querySelector('header h1')?.textContent?.trim() || document.title;
    const index = scope === 'all' && safeContent !== 'key' && list.length ? renderIndex(list) : '';
    const body = !list.length ? '<p class="phase6-print-empty">لا توجد أسئلة في النطاق المحدد.</p>' : safeContent === 'key' ? renderKey(list) : renderSections(list,safeContent);
    printDoc.innerHTML = `
      <header class="phase6-print-header">
        <div class="phase6-print-kicker">University Study Library</div>
        <h1 class="phase6-print-title">${esc(title)}</h1>
        <div class="phase6-print-meta"><span>${esc(contentLabel(safeContent))}</span><span>${esc(scopeLabel(scope,list))}</span><span>${list.length} سؤال</span></div>
      </header>
      ${index}
      ${body}
      ${authorFooter()}`;
    updatePageHeaders(list);
    printDoc.dataset.content = safeContent;
    printDoc.dataset.scope = scope;
    printDoc.dataset.count = String(list.length);
    return {content:safeContent,scope,count:list.length,list:[...list]};
  }

  function updateSummary(){
    const content = checked('phase6-content') || 'questions';
    const scope = checked('phase6-scope') || 'all';
    const list = resolve(scope);
    document.getElementById('phase6PrintSummary').innerHTML = `<b>${esc(contentLabel(content))}</b> • ${esc(scopeLabel(scope,list))} • ${list.length} سؤال`;
  }

  function open(){
    updateSummary();
    modal.classList.add('show');
  }

  function close(){ modal.classList.remove('show'); }

  document.addEventListener('click',event => {
    const button = event.target.closest('[data-action="print"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open();
  },true);

  modal.addEventListener('change',updateSummary);
  modal.addEventListener('click',event => { if (event.target === modal) close(); });
  document.getElementById('phase6PrintCancel').addEventListener('click',close);
  document.getElementById('phase6PrintGo').addEventListener('click',() => {
    const result = prepare();
    if (!result.count) {
      engine.showToast?.('لا توجد أسئلة في النطاق المحدد');
      return;
    }
    close();
    document.body.classList.add('phase6-printing');
    printDoc.setAttribute('aria-hidden','false');
    requestAnimationFrame(() => window.print());
  });

  window.addEventListener('beforeprint',() => {
    if (!printDoc.dataset.count) prepare();
    document.body.classList.add('phase6-printing');
    printDoc.setAttribute('aria-hidden','false');
  });
  window.addEventListener('afterprint',() => {
    document.body.classList.remove('phase6-printing');
    printDoc.setAttribute('aria-hidden','true');
  });

  document.addEventListener('keydown',event => {
    if (event.key === 'Escape' && modal.classList.contains('show')) close();
  });

  updateSummary();

  window.StudyPhase6 = {
    open,
    close,
    prepare,
    currentSectionId,
    resolve,
    getSelection:() => ({content:checked('phase6-content'),scope:checked('phase6-scope')})
  };
})();