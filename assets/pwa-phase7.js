/* Phase 7: optional install/offline UX + shared accessible shortcuts. No data/state changes. */
(()=>{
  'use strict';
  const root=document.documentElement;
  const base=new URL(location.pathname.includes('/materials/')?'../':'./',location.protocol==='about:'?'http://localhost/':location.href);
  const asset=path=>new URL(path,base).href;
  const make=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text)el.textContent=text;return el;};
  const main=document.querySelector('main');
  if(main){if(!main.id)main.id='main';if(!main.hasAttribute('tabindex'))main.tabIndex=-1;const a=make('a','phase7-skip','تجاوز إلى المحتوى');a.href='#'+main.id;document.body.prepend(a);}
  const status=make('span','phase7-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const install=make('button','phase7-install','تثبيت التطبيق');install.type='button';install.hidden=true;
  const tools=make('div','phase7-tools');tools.setAttribute('aria-label','حالة التطبيق');tools.append(status,install);
  (document.querySelector('.hub-hero')||document.querySelector('.learning-appbar-inner')||document.querySelector('header')||document.body).append(tools);
  function displayStatus(){if(!navigator.onLine){status.textContent='وضع دون إنترنت';status.hidden=false;status.classList.add('offline');}
    else {status.textContent='';status.hidden=true;status.classList.remove('offline');}}
  displayStatus();window.addEventListener('online',displayStatus);window.addEventListener('offline',displayStatus);
  let deferred=null;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;install.hidden=false;});
  install.addEventListener('click',async()=>{if(!deferred)return;const p=deferred;deferred=null;install.hidden=true;try{await p.prompt();await p.userChoice;}catch(_){} });
  window.addEventListener('appinstalled',()=>{deferred=null;install.hidden=true;});
  if(matchMedia('(display-mode: standalone)').matches||navigator.standalone)install.hidden=true;
  if('serviceWorker' in navigator && ['https:','http:'].includes(location.protocol)){
    navigator.serviceWorker.register(asset('sw.js'),{scope:base.pathname}).catch(err=>console.warn('Offline installation unavailable:',err));
  }
  // Focus the logical destination after skip-link activation, without hijacking regular tabbing.
  document.querySelector('.phase7-skip')?.addEventListener('click',()=>setTimeout(()=>main?.focus({preventScroll:true}),0));
  // Existing flashcard acts as a clickable card; make its equivalent keyboard accessible.
  document.addEventListener('keydown',e=>{const flip=e.target.closest?.('[data-flip-card]');if(!flip||!['Enter',' '].includes(e.key))return;e.preventDefault();flip.click();});
  // The flashcard is rendered dynamically; ensure keyboard semantics on each screen update.
  if(main){const enhance=()=>{main.querySelectorAll('[data-flip-card]').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','إظهار أو إخفاء إجابة البطاقة');});};
    const observer=new MutationObserver(enhance);observer.observe(main,{childList:true,subtree:true});enhance();}
  root.classList.add('phase7-accessibility');
  window.UniversityPWA=Object.freeze({ready:true,cacheVersion:'v24'});
})();