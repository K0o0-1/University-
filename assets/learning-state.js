/* University Learning — persisted-state boundary. No DOM/UI responsibility.
 * All imported and previously saved records are untrusted.
 */
((root) => {
'use strict';
function create({BANK,BANK_BY_ID,CHAPTERS,CHAPTER,STORAGE_KEY,QUIZ_KEY,VERSION=1}) {
function defaultState(){return{version:VERSION,completedChapters:[],reviewFlags:[],questionStats:{},lastAnswers:{},quizHistory:[],cardStats:{},lastStudy:null,settings:{dark:false}};}
function plainObject(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
// Phase 1 security boundary: imported/local persisted state is untrusted JSON.
// Validate every rendered/used field before putting it into application state.
const safeInt=(n,max=1_000_000_000_000_000)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const safeEntries=(obj,max)=>plainObject(obj)&&Object.keys(obj).length<=max;
const safeQuestionId=id=>typeof id==='string'&&Object.hasOwn(BANK_BY_ID,id);
const safeChapterId=id=>typeof id==='string'&&(Object.hasOwn(CHAPTER,id)||(CHAPTERS.length===0&&id==='')); // empty chapter for chapterless materials
const validAnswer=(id,answer)=>safeQuestionId(id)&&safeInt(answer,BANK_BY_ID[id].options.length-1);
function validHistory(h){
 if(!plainObject(h)||!safeInt(h.id)||!safeInt(h.at)||!['training','exam'].includes(h.mode)||!['all','chapter','review','weak'].includes(h.source)||!safeChapterId(h.chapterId)||!Array.isArray(h.qids)||!h.qids.length||h.qids.length>BANK.length||!h.qids.every(safeQuestionId)||new Set(h.qids).size!==h.qids.length||!safeEntries(h.answers,BANK.length))return false;
 if(!Object.entries(h.answers).every(([id,a])=>h.qids.includes(id)&&validAnswer(id,a)))return false;
 if(!safeInt(h.total,BANK.length)||h.total!==h.qids.length||!safeInt(h.answered,h.total)||h.answered!==Object.keys(h.answers).length||!safeInt(h.correct,h.answered)||!safeInt(h.wrong,h.total)||h.wrong!==h.answered-h.correct||!safeInt(h.unanswered,h.total)||h.unanswered!==h.total-h.answered)return false;
 if(!safeInt(h.score,100)||!safeInt(h.accuracy,100)||!safeInt(h.duration,10_000_000))return false;
 return true;
}
function validState(x){
 if(!plainObject(x)||x.version!==VERSION||!Array.isArray(x.reviewFlags)||x.reviewFlags.length>BANK.length||!x.reviewFlags.every(safeQuestionId)||!safeEntries(x.questionStats,BANK.length)||!safeEntries(x.lastAnswers||{},BANK.length)||!Array.isArray(x.quizHistory)||x.quizHistory.length>50||!x.quizHistory.every(validHistory))return false;
 if(!Object.entries(x.questionStats).every(([id,v])=>safeQuestionId(id)&&plainObject(v)&&safeInt(v.attempts)&&safeInt(v.correct)&&safeInt(v.wrong)&&v.correct+v.wrong<=v.attempts&&(v.lastAt===undefined||safeInt(v.lastAt))))return false;
 if(!Object.entries(x.lastAnswers||{}).every(([id,v])=>validAnswer(id,v)))return false;
 if(!Array.isArray(x.completedChapters||[])||x.completedChapters.length>CHAPTERS.length||!x.completedChapters.every(safeChapterId))return false;
 if('completedTopics' in x&&(!Array.isArray(x.completedTopics)||x.completedTopics.length>500||!x.completedTopics.every(id=>typeof id==='string'&&/^ch[0-9]+-t[0-9]+$/.test(id))))return false;
 if(!safeEntries(x.cardStats||{},BANK.length)||!Object.entries(x.cardStats||{}).every(([id,v])=>safeQuestionId(id)&&(typeof v==='boolean'||safeInt(v))))return false;
 if(!plainObject(x.settings||{})||('dark' in x.settings&&typeof x.settings.dark!=='boolean'))return false;
 if(x.lastStudy!=null&&(!plainObject(x.lastStudy)||!safeChapterId(x.lastStudy.chapterId)||('questionIndex' in x.lastStudy&&!safeInt(x.lastStudy.questionIndex,Math.max(0,BANK.length-1)))))return false;
 return true;
}
function normalizeState(raw){
 if(!validState(raw))return defaultState();
 const questionStats=Object.fromEntries(Object.entries(raw.questionStats).map(([id,v])=>[id,{attempts:v.attempts,correct:v.correct,wrong:v.wrong,lastAt:v.lastAt??0}]));
 const quizHistory=raw.quizHistory.map(h=>({id:h.id,at:h.at,mode:h.mode,source:h.source,chapterId:h.chapterId,qids:[...h.qids],answers:{...h.answers},total:h.total,answered:h.answered,correct:h.correct,wrong:h.wrong,unanswered:h.unanswered,score:h.score,accuracy:h.accuracy,duration:h.duration}));
 const x={...defaultState(),completedChapters:[...new Set(raw.completedChapters||[])],reviewFlags:[...new Set(raw.reviewFlags)],questionStats,lastAnswers:{...(raw.lastAnswers||{})},quizHistory,cardStats:{...(raw.cardStats||{})},lastStudy:raw.lastStudy?{chapterId:raw.lastStudy.chapterId,questionIndex:Math.min(raw.lastStudy.questionIndex??0,Math.max(0,BANK.filter(q=>q.chapterId===raw.lastStudy.chapterId).length-1))}:null,settings:{dark:raw.settings?.dark===true}};
 if(Array.isArray(raw.completedTopics))for(const c of CHAPTERS)if(raw.completedTopics.filter(id=>id.startsWith(`${c.id}-t`)).length>=(c.legacyTopicCount||Infinity)&&!x.completedChapters.includes(c.id))x.completedChapters.push(c.id);
 return x;
}
function loadState(){try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(plainObject(raw)&&!validState(raw)&&raw.lastStudy!=null){const repaired={...raw,lastStudy:null};if(validState(repaired))return normalizeState(repaired);}return normalizeState(raw);}catch{return defaultState();}}
function loadQuiz(){try{
 const s=JSON.parse(localStorage.getItem(QUIZ_KEY)||'null');
 if(!plainObject(s)||!['training','exam'].includes(s.mode)||!Array.isArray(s.qids)||!s.qids.length||s.qids.length>BANK.length||!s.qids.every(safeQuestionId)||new Set(s.qids).size!==s.qids.length||!safeInt(s.index,s.qids.length-1)||!safeEntries(s.answers,BANK.length)||!safeEntries(s.checked,BANK.length)||!safeEntries(s.recorded,BANK.length))return null;
 if(!Object.entries(s.answers).every(([id,v])=>s.qids.includes(id)&&validAnswer(id,v))||!Object.entries(s.checked).every(([id,v])=>s.qids.includes(id)&&typeof v==='boolean')||!Object.entries(s.recorded).every(([id,v])=>s.qids.includes(id)&&typeof v==='boolean'))return null;
 if(!safeInt(s.id)||!safeInt(s.startedAt)||!safeInt(s.lastTick)||!safeInt(s.elapsed)||typeof s.paused!=='boolean'||!['none','total','question'].includes(s.timer)||!['all','chapter','review','weak'].includes(s.source)||!safeChapterId(s.chapterId))return null;
 for(const k of ['remainingTotal','remainingQuestion','perQuestionSeconds'])if(s[k]!==null&&s[k]!==undefined&&!safeInt(s[k],86_400))return null;
 return s;
 }catch{return null;}}

return {defaultState,plainObject,validState,normalizeState,loadState,loadQuiz};
}
root.LearningState=Object.freeze({create});
})(globalThis);