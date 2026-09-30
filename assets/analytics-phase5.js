(function(){
  'use strict';
  const current = document.currentScript;
  const base = current?.src ? new URL('.', current.src).href : '../assets/';

  function load(name, marker, onload){
    if (document.querySelector(`script[${marker}]`)) { onload?.(); return; }
    const script = document.createElement('script');
    script.src = base + name;
    script.setAttribute(marker,'true');
    if (onload) script.addEventListener('load',onload,{once:true});
    document.body.appendChild(script);
  }

  load('analytics-phase5-core.js','data-phase5-core-loader',() => {
    load('print-phase6.js','data-phase6-loader');
  });
})();
