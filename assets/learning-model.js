/* University Learning — data and question-bank adapter (no DOM or storage).
 * Modules, chapters, material-wide blocks, mappings and the bank are all optional.
 * Only valid MCQ bank records are projected into the learning question model.
 */
((root) => {
'use strict';
function create(data, sourceBank) {
  if (!data || !data.meta || data.meta.kind !== 'learning') throw new Error('Invalid learning material');
  const META=data.meta;
  const MODULES=Array.isArray(data.modules)?data.modules:[];
  const CHAPTERS=Array.isArray(data.chapters)?data.chapters:[];
  const MAPPINGS=Array.isArray(data.questionMap)?data.questionMap:[];
  const SOURCE_QUESTIONS=(Array.isArray(sourceBank?.sections)?sourceBank.sections:[]).flatMap(s=>Array.isArray(s.qs)?s.qs:[]);
  if (MAPPINGS.length && SOURCE_QUESTIONS.length !== MAPPINGS.length)
    throw new Error('Learning question map does not match source bank');
  const CHAPTER=Object.fromEntries(CHAPTERS.map(c=>[c.id,c]));
  if (new Set(CHAPTERS.map(c=>c.id)).size!==CHAPTERS.length)throw new Error('Duplicate learning chapter id');
  // Flutter Learning only: source-file chapter order, but IDs are indexed by the original
  // bank record, so previous answers, flags, and quiz history still refer to the SAME text.
  const canonical=data.meta.id==='flutter-learning'?root.FLUTTER_CANONICAL_ORDER:null;
  if(canonical && (canonical.length!==SOURCE_QUESTIONS.length ||
      new Set(canonical).size!==SOURCE_QUESTIONS.length ||
      canonical.some(i=>!Number.isInteger(i)||i<0||i>=SOURCE_QUESTIONS.length)))
    throw new Error('Invalid Flutter source order');
  const ORDER=canonical||SOURCE_QUESTIONS.map((_,i)=>i);
  const localNumbers=Object.create(null);
  const BANK=ORDER.map((sourceIndex,index)=>{
    const q=SOURCE_QUESTIONS[sourceIndex];
    if (!q || typeof q.q!=='string' || !Array.isArray(q.o) || !Number.isInteger(q.a) || q.a<0 || q.a>=q.o.length)
      throw new Error('Invalid source MCQ #'+(index+1));
    const mapping=MAPPINGS[index]||{};
    const localNumber= mapping.chapterId ? (localNumbers[mapping.chapterId]=(localNumbers[mapping.chapterId]||0)+1) : index+1;
    if (mapping.chapterId!=null&&!Object.hasOwn(CHAPTER,mapping.chapterId)) throw new Error('Question points to missing chapter');
    return {id:`${META.id==='flutter-learning'?'flutter':META.id}-q${String(sourceIndex+1).padStart(3,'0')}`,
      number:index+1,sourceNumber:sourceIndex+1,chapterNumber:localNumber,chapterId:mapping.chapterId||null,sourceSectionId:mapping.sourceSectionId||null,
      prompt:q.q,options:q.o,answerIndex:q.a,correct:q.o[q.a]};
  });
  const BANK_BY_ID=Object.fromEntries(BANK.map(q=>[q.id,q]));
  const BANK_BY_CHAPTER=Object.fromEntries(CHAPTERS.map(c=>[c.id,BANK.filter(q=>q.chapterId===c.id)]));
  return {META,MODULES,CHAPTERS,MAPPINGS,CHAPTER,BANK,BANK_BY_ID,BANK_BY_CHAPTER};
}
root.LearningModel=Object.freeze({create});
})(globalThis);