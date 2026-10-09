(() => {
  'use strict';
  const params=new URLSearchParams(location.search);
  const id=params.get('id');
  const entry=globalThis.UniversityRegistry.entries(globalThis.MATERIAL_REGISTRY).find(x=>x.id===id&&x.kind==='learning');
  const fail=msg=>{const app=document.getElementById('app');if(app)app.innerHTML=`<section class="learning-error"><h1>تعذر فتح المادة</h1><p>${msg}</p><a href="../index.html">العودة للمكتبة</a></section>`;};
  const loadScript=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s);});
  if(!entry){fail('المادة غير موجودة في سجل المواد.');return;}
  document.title=entry.title;
  const title=document.getElementById('materialTitle'); if(title) title.textContent=entry.title;
  (async()=>{
    try{
      await loadScript(entry.dataUrl);
      if(!globalThis.LEARNING_MATERIAL_DATA) throw new Error('learning data');
      if(entry.bankDataUrl){
        await loadScript(entry.bankDataUrl);
        globalThis.LEARNING_QUESTION_BANK=globalThis.MATERIAL_DATA;
        try{delete globalThis.MATERIAL_DATA;}catch(_){globalThis.MATERIAL_DATA=undefined;}
      }
      if(entry.id==='flutter-learning') await loadScript('../data/flutter-source-order.js');
      await loadScript('../assets/learning-model.js');
      await loadScript('../assets/learning-state.js');
      await loadScript('../assets/learning-print.js');
      if(entry.id==='flutter-learning'){
        await loadScript('../data/flutter-comparison-tables.js');
        await loadScript('../assets/flutter-reading.js');
        await loadScript('../data/flutter-editorial.js');
        await loadScript('../assets/flutter-editorial.js');
      }
      await loadScript('../assets/learning-engine.js');
    }catch(_){fail('تعذر تحميل بيانات أو محرك المادة.');}
  })();
})();