/* Phase 6 — printable Flutter learning material. Study data stays untouched. */
((root)=>{
'use strict';
function create({$,esc,inline,letter,weakIds,closeMore,printDialog,getState,DATA,META,MODULES,CHAPTERS,CHAPTER,BANK,BANK_BY_ID,BANK_BY_CHAPTER}){
  const $scope=()=>{const v=$('#learningPrintScope')?.value||'all';return v==='module'?'all':v;};
  const $type=()=>$('#learningPrintType')?.value||'content';
  function printSelection(){
    const type=$type(),scope=$scope(),target=$('#learningPrintTarget')?.value;
    let chapters=CHAPTERS,questions=BANK;
    if(scope==='chapter'){
      chapters=[CHAPTER[target]].filter(Boolean);
      questions=BANK_BY_CHAPTER[target]||[];
    }else if(scope==='review'||scope==='weak'){
      const ids=scope==='review'?getState().reviewFlags:weakIds();
      const chosen=new Set(ids);
      questions=BANK.filter(q=>chosen.has(q.id));
      chapters=CHAPTERS.filter(c=>questions.some(q=>q.chapterId===c.id));
    }
    return {type,scope,target,chapters,questions};
  }
  const labels={content:'الشرح فقط',questions:'الأسئلة فقط',answers:'الأسئلة + الإجابات',key:'مفتاح الإجابات',complete:'الشرح + الأسئلة + الحل', 'complete-exam':'الشرح + اختبار بدون حلول'};
  function updatePrintTargets(){
    const scope=$scope(),sel=$('#learningPrintTarget');if(!sel)return;
    let opts=[];
    if(scope==='chapter')opts=CHAPTERS.map(c=>[c.id,`Chapter ${c.num} — ${c.titleAr}`]);
    sel.innerHTML=opts.map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('');
    const wrap=$('#learningPrintTargetWrap');if(wrap)wrap.style.display=['all','review','weak'].includes(scope)?'none':'grid';
    updatePrintSummary();
  }
  function updatePrintSummary(){
    const s=printSelection(),node=$('#learningPrintSummary');if(!node)return;
    const empty=(s.scope==='review'||s.scope==='weak')&&!s.questions.length;
    node.innerHTML=`<b>${esc(labels[s.type]||'')}</b> • ${s.chapters.length} Chapter • ${s.questions.length} سؤال${empty?' • القائمة فارغة؛ لا يمكن طباعتها':''}`;
    const go=$('#learningDoPrintBtn');if(go)go.disabled=empty||(!s.chapters.length&&!s.questions.length);
  }
  function openPrint(scope=null){
    closeMore();
    if(scope){$('#learningPrintScope').value=scope;$('#learningPrintType').value='answers';}
    updatePrintTargets();
    if(typeof printDialog.showModal==='function')printDialog.showModal();else printDialog.setAttribute('open','');
  }
  const safeSrc=src=>{
    const v=String(src||'').trim();
    return /^(https:\/\/|\.\.?\/|[a-z0-9_-]+\/)/i.test(v) && !/[\s<>"'`\\]/.test(v) ? esc(v):'';
  };
  function blockHTML(b){
    const title=`${b.sectionTitle?`<h3>${esc(b.sectionTitle)}</h3>`:''}${b.title&&b.title!==b.sectionTitle?`<h4>${esc(b.title)}</h4>`:''}`;
    let body='';
    if(b.type==='code')body=`<pre dir="ltr"><code>${esc(b.code||b.text||'')}</code></pre>`;
    else if(b.type==='table'){
      const headers=Array.isArray(b.headers)?b.headers:[],rows=Array.isArray(b.rows)?b.rows:[];
      body=`<table><thead><tr>${headers.map(h=>`<th>${inline(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${(Array.isArray(r)?r:[]).map(v=>`<td>${inline(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }else if(b.type==='image'){const src=safeSrc(b.src);if(src)body=`<img src="${src}" alt="${esc(b.alt||b.title||'')}">`;}
    else if(b.type==='pdf'){const src=safeSrc(b.src);if(src)body=`<a href="${src}">فتح ملف PDF: ${esc(b.title||'المصدر')}</a>`;}
    else if(b.type==='audio'){body='<p>محتوى صوتي — يرجى الرجوع إلى الصفحة الإلكترونية للاستماع.</p>';}
    else body=`${b.text?`<p>${inline(b.text)}</p>`:''}${(b.facts||[]).length?`<ul>${b.facts.map(f=>`<li>${inline(f)}</li>`).join('')}</ul>`:''}`;
    return `<article class="learning-print-topic">${title}${body}</article>`;
  }
  // Phase 9 review gate: one real source chapter in print, without touching other chapters.
  const isPhase9Sample=(s)=>META.id==='flutter-learning'&&s.scope==='chapter'&&s.target==='ch1';
  const editorial=()=>META.id==='flutter-learning'?root.FlutterEditorial:null;
  function phase9Inline(raw){
    const parts=String(raw??'').split(/(`[^`]+`)/g);
    return parts.map(part=>{
      if(part.startsWith('`')&&part.endsWith('`')){
        const value=part.slice(1,-1);
        if(/[\u0600-\u06ff]/.test(value))return `<span>${esc(value).replace(/\b(Framework|Flutter|Dart)\b/g,(m)=>`<strong class="${m==='Flutter'||m==='Dart'?'phase9-print-keyword':'phase9-print-technical'}" dir="ltr">${m}</strong>`)}</span>`;
        const cls=/^(?:Flutter|Dart)$/.test(value)?'phase9-print-keyword':'phase9-print-inline';
        return `<strong class="${cls}" dir="ltr">${esc(value)}</strong>`;
      }
      // Color only the two approved primary terms, not ordinary English nouns.
      return esc(part).replace(/\b(Flutter|Dart)\b/g,'<strong class="phase9-print-keyword">$1</strong>');
    }).join('');
  }
  function phase9Chapter1Print(blocks){
    const sectionMap={
      'ch1-s1':['Flutter و Dart','Flutter و Dart'],
      'ch1-s2':['بنية برنامج Dart',''],
      'ch1-s3':['أنواع البيانات','Data Types'],
      'ch1-s4':['المتغيرات والثوابت','Variables & Constants'],
      'ch1-s8':['','Null Safety'],
      'ch1-s5':['المعاملات والتحكم في التدفق',''],
      'ch1-s6':['المعاملات والتحكم في التدفق',''],
      'ch1-s7':['الدوال','Functions'],
    };
    const groups=[];
    for(const b of blocks){
      const [ar,en]=sectionMap[b.sourceSectionId]||[b.sectionTitle||'',b.title||''];
      const groupKey=(ar||en);
      let g=groups[groups.length-1];
      if(!g || g.key!==groupKey){g={key:groupKey,ar,en,blocks:[]};groups.push(g);}
      g.blocks.push(b);
    }
    function comparison(){
      const arr=[[['var','يحدد النوع عند التعيين ولا يتغير نوع المتغير.'],['dynamic','يسمح بتغيير النوع.']],
                 [['final','قيمته تحدد وقت التشغيل.'],['const','يجب أن تكون ثابتة وقت الترجمة.']]];
      return arr.map(t=>`<table><thead><tr>${t.map(v=>`<th dir="ltr">${esc(v[0])}</th>`).join('')}</tr></thead><tbody><tr>${t.map(v=>`<td>${esc(v[1])}</td>`).join('')}</tr></tbody></table>`).join('');
    }
    return groups.map(group=>{
      const title=[group.ar,group.en&&group.en!==group.ar?group.en:''].filter(Boolean).map(esc).join(' <span dir="ltr">');
      const safeTitle=group.en && group.en!==group.ar ? (group.ar?`${esc(group.ar)} <span dir="ltr">${esc(group.en)}</span>`:`<span dir="ltr">${esc(group.en)}</span>`) : esc(group.ar||group.en);
      const topics=group.blocks.map(b=>{
        const nested=group.blocks.length>1&&b.title!==group.ar&&b.title!==group.en?`<h4>${esc(b.title)}</h4>`:'';
        const facts=b.sourceSectionId==='ch1-s4'?(b.facts||[]).filter(f=>!f.startsWith('الفرق بين')):b.facts||[];
        return `${nested}<ul>${facts.map(f=>`<li>${phase9Inline(f)}</li>`).join('')}</ul>${b.sourceSectionId==='ch1-s4'?comparison():''}`;
      }).join('');
      return `<article class="learning-print-topic phase9-print-topic"><h3>${safeTitle}</h3>${topics}</article>`;
    }).join('');
  }
  function printQuestion(q,hasAnswers){
    return `<article class="learning-print-question" data-print-q="${q.number}"><h3>${q.number}. ${inline(q.prompt)}</h3><ol class="learning-print-options">${q.options.map((opt,i)=>`<li><span class="learning-print-option-label${hasAnswers&&i===q.answerIndex?' correct-label':''}">${letter(i)})</span><span class="learning-print-option-cell"><span class="learning-print-option-text${hasAnswers&&i===q.answerIndex?' correct-text':''}">${inline(opt)}</span></span></li>`).join('')}</ol></article>`;
  }
  function chapterTitle(c){return `Chapter ${c.num} — ${esc(c.titleAr)}`;}
  function groupQuestions(chapters, questions){
    const ids=new Set(chapters.map(c=>c.id));
    const byChapter=new Map(chapters.map(c=>[c.id,questions.filter(q=>q.chapterId===c.id)]));
    const unmapped=questions.filter(q=>!ids.has(q.chapterId));
    return {byChapter,unmapped};
  }
  function chapterHTML(c,questions,type,module=null,phase9=false){
    const study=type==='content'||type==='complete'||type==='complete-exam';
    const quiz=type!=='content';
    const hasAnswers=type==='answers'||type==='complete';
    const blocks=study?(editorial()?editorial().print(c.id):phase9?phase9Chapter1Print(c.blocks||[]):(c.blocks||[]).map(blockHTML).join('')):'';
    const body=type==='key'?`<div class="learning-print-key">${questions.map(q=>`<span>${q.number}-${letter(q.answerIndex)}</span>`).join('')}</div>` : quiz?questions.map(q=>printQuestion(q,hasAnswers)).join(''):'';
    const heading=editorial()?`<header class="ed-print-chapter-head"><span class="ed-print-chapter-number" dir="ltr">${String(c.num).padStart(2,'0')}</span><div class="ed-print-chapter-text"><h2 id="print-${esc(c.id)}" dir="ltr">${esc(c.titleEn||c.title||('Chapter '+c.num))}</h2><p>${esc(c.titleAr)}</p></div></header>`:`<h2 id="print-${esc(c.id)}">${chapterTitle(c)}</h2>`;
    return `<section class="learning-print-chapter" data-print-chapter="${esc(c.id)}">${heading}${blocks}${quiz&&questions.length?`<h3 class="learning-print-questions-heading">أسئلة Chapter ${c.num}</h3>`:''}${body}</section>`;
  }
  function footer(){
    const cfg=root.UniversityPrintConfig||{};
    const author=typeof cfg.author==='string'?cfg.author.trim().slice(0,100):'Eng. Khalid Al-sofi';
    const url=typeof cfg.authorUrl==='string'?cfg.authorUrl:'https://wa.me/967771179020';
    const link=/^https:\/\/[^\s<>"']+$/i.test(url);
    return author?`<footer class="learning-print-footer">${link?`<a href="${esc(url)}">${esc(author)}</a>`:esc(author)}</footer>`:'';
  }
  function buildPrintDocument(){
    const s=printSelection(),doc=$('#learningPrintDocument');
    if((s.scope==='review'||s.scope==='weak')&&!s.questions.length){doc.innerHTML='';doc.dataset.count='0';return {...s,empty:true};}
    const by=groupQuestions(s.chapters,s.questions);
    // Flat chapter index using the original University's linked print-index structure.
    // Do not expose the old internal module mappings in printing or filters.
    const index=s.chapters.length?`<nav class="learning-print-index" aria-label="فهرس الفصول"><h2>فهرس الفصول</h2><ul>${s.chapters.map(c=>`<li><a href="#print-${esc(c.id)}">${chapterTitle(c)}</a></li>`).join('')}</ul></nav>`:'';
    const groups=`<section class="learning-print-chapter-group">${s.chapters.map(c=>chapterHTML(c,by.byChapter.get(c.id)||[],s.type,null,false)).join('')}</section>`;
    // Future materials may be mapped directly to modules instead of chapters.
    const otherBlocks=s.type==='content'||s.type==='complete'||s.type==='complete-exam'?[...(DATA.blocks||[]),...MODULES.flatMap(m=>m.blocks||[])].map(blockHTML).join(''):'';
    const unmapped=s.type==='content'?'':by.unmapped.length?`<section class="learning-print-unmapped"><h2 id="print-unmapped">أسئلة غير مرتبطة بفصل</h2>${s.type==='key'?`<div class="learning-print-key">${by.unmapped.map(q=>`<span>${q.number}-${letter(q.answerIndex)}</span>`).join('')}</div>`:by.unmapped.map(q=>printQuestion(q,s.type==='answers'||s.type==='complete')).join('')}</section>`:'';
    doc.innerHTML=`<header class="learning-print-header"><div>University Study Library</div><h1>${esc(META.title)}</h1><p>${esc(labels[s.type]||'')} • ${s.chapters.length} Chapter • ${s.questions.length} سؤال</p></header>${index}${groups}${otherBlocks}${unmapped}${footer()}`;
    // One print page name per Chapter: gives repeated chapter heading in A4 page margin.
    let named=$('#learningPrintNamedPages');
    if(!named){named=document.createElement('style');named.id='learningPrintNamedPages';document.head.appendChild(named);}
    const author=typeof root.UniversityPrintConfig?.author==='string'?root.UniversityPrintConfig.author.slice(0,100):'Eng. Khalid Al-sofi';
    named.textContent=isPhase9Sample(s)?`@media print{ @page{ @bottom-left{content:${JSON.stringify(author)};font:8pt Arial,sans-serif;color:#666} } }`:`@media print{ @page{ @bottom-left{content:${JSON.stringify(author)};font:8pt Arial,sans-serif;color:#666} } }`+s.chapters.map(c=>{
      const key=String(c.id).replace(/[^a-zA-Z0-9-]/g,'');
      return `@media print{ @page learning-${key}{@top-center{content:${JSON.stringify('Chapter '+c.num+' — '+c.titleAr).slice(0,170)};font:8pt Arial,sans-serif;color:#555}} #learningPrintDocument [data-print-chapter="${key}"]{page:learning-${key}} }`;
    }).join('\n');
    if(editorial())doc.dataset.phase9Editorial='1';else delete doc.dataset.phase9Editorial;
    if(isPhase9Sample(s)&&!editorial())doc.dataset.phase9Preview='ch1';else delete doc.dataset.phase9Preview;
    doc.dataset.count=String(s.questions.length);
    doc.dataset.scope=s.scope;
    doc.dataset.type=s.type;
    return s;
  }
  function doPrint(){
    const s=buildPrintDocument();
    if(s.empty||(!s.chapters.length&&!s.questions.length)){
      updatePrintSummary();return false;
    }
    if(printDialog.open)printDialog.close();
    document.body.classList.add('learning-printing');
    $('#learningPrintDocument').setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>window.print());
    return true;
  }
  return {updatePrintTargets,printSelection,updatePrintSummary,openPrint,buildPrintDocument,doPrint};
}
root.LearningPrint=Object.freeze({create});
})(globalThis);