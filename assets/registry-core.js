/* Registry operations shared by library UI and offline precache.
 * Adding a learning material requires a registry entry and its data files; no hub/SW code edits.
 * Paths are confined to repository-relative URLs; external resources are never precached.
 */
((root)=>{
'use strict';
const isText=s=>typeof s==='string'&&s.trim()!=='';
function entries(list){
 const seen=new Set();
 return (Array.isArray(list)?list:[]).filter(m=>{
   if(!m||m.enabled===false||!isText(m.id)||!isText(m.title)||!isText(m.href)||!isText(m.kind)||!pathFrom('./index.html',m.href)||seen.has(m.id))return false;
   seen.add(m.id);return true;
 });
}
function pathFrom(base,path){
 if(!isText(path)||/^[a-z][a-z0-9+.-]*:/i.test(path)||path.startsWith('/')||/[<>"'\\]/.test(path))return null;
 const parts=path.split(/[?#]/)[0].split('/');
 const root=base.split(/[?#]/)[0].split('/').slice(0,-1).filter(p=>p&&p!=='.');
 for(const part of parts){if(!part||part==='.')continue;if(part==='..'){if(!root.length)return null;root.pop();}else root.push(part);}
 return root.length?'./'+root.join('/'):null;
}
function offlineFiles(list){
 const out=new Set();
 for(const m of entries(list)){
   const page=pathFrom('./index.html',m.href);if(page)out.add(page);
   for(const file of m.offlineFiles||[]){const p=pathFrom('./index.html',file);if(p)out.add(p);}
   if(m.kind==='learning'){
     for(const key of ['dataUrl','bankDataUrl']){const p=pathFrom(page||'./materials/learning.html',m[key]);if(p)out.add(p);}
     for(const file of ['learning-loader.js','learning-model.js','learning-state.js','learning-print.js','learning-engine.js','learning-styles.css'])out.add('./assets/'+file);
     out.add('./data/materials-registry.js');
   }
 }
 return [...out];
}
root.UniversityRegistry=Object.freeze({entries,offlineFiles,pathFrom});
})(globalThis);