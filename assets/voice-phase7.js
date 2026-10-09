/* Phase 7 voice reader: speak in manageable chunks; never changes text or persistence. */
((root)=>{
'use strict';
let spoken=[],utterance=null,index=0,status='idle',generation=0;
const synth=root.speechSynthesis;
const supported=!!(synth&&root.SpeechSynthesisUtterance);
const notify=()=>{
 document.querySelectorAll('[data-phase7-voice-status]').forEach(el=>{el.textContent=status==='speaking'?'جارٍ قراءة الشرح':status==='paused'?'القراءة متوقفة مؤقتًا':'';});
 document.querySelectorAll('[data-pause-speech]').forEach(el=>{el.disabled=!supported||!['speaking','paused'].includes(status);el.textContent=status==='paused'?'استئناف الصوت':'إيقاف مؤقت';el.setAttribute('aria-pressed',String(status==='paused'));});
};
const chunks=(source,max=190)=>{
 const result=[];String(source??'').replace(/`/g,'').split(/(?<=[.!؟؛\n])\s+/).forEach(part=>{
  let rest=part.trim();while(rest.length>max){let cut=rest.lastIndexOf(' ',max);if(cut<max/3)cut=max;result.push(rest.slice(0,cut).trim());rest=rest.slice(cut).trim();}
  if(rest)result.push(rest);
 });return result;
};
function stop(){generation++;try{synth?.cancel();}catch(_){}utterance=null;spoken=[];index=0;status='idle';notify();}
function run(g){if(!supported||g!==generation||status!=='speaking')return;if(index>=spoken.length){status='idle';utterance=null;notify();return;}
 const u=new SpeechSynthesisUtterance(spoken[index]);utterance=u;u.lang='ar-SA';u.rate=.92;
 const voices=synth.getVoices?.()||[];u.voice=voices.find(v=>/^ar(-|$)/i.test(v.lang||''))||null;
 u.onend=()=>{if(g!==generation||utterance!==u)return;index++;run(g);};
 u.onerror=e=>{if(g!==generation||utterance!==u)return;if(['canceled','interrupted'].includes(e.error))return;status='idle';utterance=null;notify();};
 try{synth.speak(u);}catch(_){status='idle';utterance=null;notify();}
}
function speak(source){stop();if(!supported)return false;spoken=chunks(source);if(!spoken.length)return false;status='speaking';notify();const g=generation;run(g);return true;}
function pause(){if(status==='speaking'){try{synth.pause();status='paused';notify();}catch(_){} }else if(status==='paused'){try{synth.resume();status='speaking';notify();}catch(_){}}return status;}
root.UniversityVoice=Object.freeze({speak,stop,pause,chunks,supported,state:()=>status});
})(globalThis);