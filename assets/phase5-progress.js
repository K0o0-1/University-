/* Phase 5: safe, version-compatible MCQ/Q&A progress persistence.
   Only typed, bounded fields are imported. Never trust JSON as UI markup. */
(function(){
 'use strict';
 const obj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
 const cnt = x => Number.isSafeInteger(x) && x >= 0 && x <= 1000000000;
 const id = x => typeof x === 'string' && /^(?:q[0-9]{1,6}|qid-[a-z0-9-]{1,80})$/.test(x);
 const list = (v,max,test) => Array.isArray(v) && v.length <= max && v.every(test);
 const map = (v,max,test) => obj(v) && Object.keys(v).length <= max && Object.entries(v).every(([k,x])=>id(k)&&test(x));
 const finite = x => typeof x==='number' && Number.isFinite(x) && x>=0 && x<=1e9;
 const date = x => x === null || (typeof x === 'string' && x.length <= 40 && /^\d{4}-\d{2}-\d{2}T/.test(x) && Number.isFinite(Date.parse(x)));
 const short = (x,max=200) => typeof x === 'string' && x.length <= max && !/[<>\x00-\x08\x0B\x0E-\x1F]/.test(x);
 const ids = x => list(x,1500,id) && new Set(x).size === x.length;
 const fields = (v,keys) => obj(v) && Object.keys(v).every(k=>keys.includes(k));
 const stats = x => fields(x,['attempts','correct','wrong','recent','lastAt','lastResult']) && cnt(x.attempts) && cnt(x.correct) && cnt(x.wrong) && x.correct+x.wrong===x.attempts && (x.recent===undefined||list(x.recent,5,y=>typeof y==='boolean')) && (x.lastAt===undefined||date(x.lastAt)) && (x.lastResult===undefined||x.lastResult===null||['correct','wrong'].includes(x.lastResult));
 const cfg = x => obj(x) && Object.keys(x).length<=28 && Object.entries(x).every(([k,v])=>/^[a-zA-Z][a-zA-Z0-9_-]{0,35}$/.test(k) && (v===null||typeof v==='boolean'||(short(v,200))||finite(v)|| (k==='scopeIds' && ids(v))));
 function history(x,kind){
   if (!fields(x,['id','at','material','mode','reason','total','answered','correct','wrong','unanswered','percent','accuracy','elapsedMs','avgMs','wrongIds','scopeIds','answers','config'])) return false;
   if (!short(x.id,100)||!/^quiz-[a-zA-Z0-9-]+$/.test(x.id)||!date(x.at)||!['practice','exam'].includes(x.mode)||!['completed','stopped','timeout'].includes(x.reason)|| !short(x.material,100)) return false;
   if (![x.total,x.answered,x.correct,x.wrong,x.unanswered].every(cnt)||x.total>1500||x.answered>x.total||x.correct+x.wrong!==x.answered||x.unanswered!==x.total-x.answered) return false;
   if(!cnt(x.percent)||x.percent>100||(x.accuracy!==undefined&&(!cnt(x.accuracy)||x.accuracy>100))||!cnt(x.elapsedMs)||!cnt(x.avgMs))return false;
   if(!ids(x.scopeIds)||x.scopeIds.length!==x.total||!ids(x.wrongIds)||!x.wrongIds.every(i=>x.scopeIds.includes(i)))return false;
   if (!map(x.answers,1500,v=>kind==='qa' ? ['correct','wrong'].includes(v) : Number.isInteger(v)&&v>=0&&v<=5))return false;
   if(Object.keys(x.answers).length!==x.answered||!Object.keys(x.answers).every(i=>x.scopeIds.includes(i)))return false;
   if(x.config!==undefined && !cfg(x.config))return false;
   return true;
 }
 function timer(x){
   return fields(x,['version','scopeKey','currentId','remaining','expired']) && x.version===1 && short(x.scopeKey,28000) && (x.currentId===null||id(x.currentId)) && map(x.remaining,1500,finite) && ids(x.expired) && (x.currentId===null||x.scopeKey.split('|').includes(x.currentId));
 }
 function valid(state,kind){
   if(!obj(state))return false;
   if(state.reviewFlags!==undefined&&!map(state.reviewFlags,1500,v=>typeof v==='boolean'))return false;
   if(state.questionStats!==undefined&&!map(state.questionStats,1500,stats))return false;
   if(state.quizHistory!==undefined&&!list(state.quizHistory,20,h=>history(h,kind)))return false;
   if(state.plusTimerSession!==undefined&&!timer(state.plusTimerSession))return false;
   return true;
 }
 function copy(src,dst){
   for(const key of ['reviewFlags','questionStats','quizHistory','plusTimerSession'])if(Object.prototype.hasOwnProperty.call(src,key))dst[key]=src[key];
   return dst;
 }
 window.Phase5Progress=Object.freeze({valid,copy,validSessionConfig:cfg});
})();