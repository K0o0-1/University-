(function(){
  'use strict';

  const current = document.currentScript;
  const base = current?.src ? new URL('.', current.src).href : '../assets/';
  const modules = [
    ['study-phase2.js','phase2'],
    ['question-card-phase3.js','phase3'],
    ['quiz-phase4.js','phase4'],
    ['analytics-phase5.js','phase5'],
    ['print-phase6.js','phase6']
  ];

  function loadModule(file,key){
    return new Promise((resolve,reject) => {
      let script = document.querySelector(`script[data-study-ui-module="${key}"]`);
      if (script) {
        if (script.dataset.loaded === 'true') { resolve(); return; }
        script.addEventListener('load',resolve,{once:true});
        script.addEventListener('error',reject,{once:true});
        return;
      }
      script = document.createElement('script');
      script.src = base + file;
      script.dataset.studyUiModule = key;
      script.addEventListener('load',() => {
        script.dataset.loaded = 'true';
        resolve();
      },{once:true});
      script.addEventListener('error',() => reject(new Error(`Failed to load ${file}`)),{once:true});
      document.body.appendChild(script);
    });
  }

  function loadExtra(file,marker){
    return new Promise((resolve,reject) => {
      let script = document.querySelector(`script[${marker}]`);
      if (script) {
        if (script.dataset.loaded === 'true') { resolve(); return; }
        script.addEventListener('load',resolve,{once:true});
        script.addEventListener('error',reject,{once:true});
        return;
      }
      script = document.createElement('script');
      script.src = base + file;
      script.setAttribute(marker,'true');
      script.addEventListener('load',() => {
        script.dataset.loaded = 'true';
        resolve();
      },{once:true});
      script.addEventListener('error',() => reject(new Error(`Failed to load ${file}`)),{once:true});
      document.body.appendChild(script);
    });
  }

  (async() => {
    try {
      for (const [file,key] of modules) await loadModule(file,key);
      await loadExtra('ui-hotfixes.js','data-study-ui-hotfix');
      await loadExtra('project-fixes.js','data-study-project-fixes');
      document.body.classList.add('phase7-cleanup-enabled');
      window.StudyPhase7 = Object.freeze({
        modules:modules.map(([,key]) => key),
        ready:true
      });
      document.dispatchEvent(new CustomEvent('study-ui-ready',{detail:{modules:window.StudyPhase7.modules}}));
    } catch (error) {
      console.error('Study UI loader failed',error);
    }
  })();
})();
