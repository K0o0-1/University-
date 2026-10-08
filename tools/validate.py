#!/usr/bin/env python3
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
errors=[]; warnings=[]
def fail(m): errors.append(m)
def warn(m): warnings.append(m)

def assignment(path,pattern):
    text=path.read_text(encoding='utf-8')
    m=re.fullmatch(pattern,text,re.S)
    if not m:
        fail(f'{path.relative_to(ROOT)}: invalid assignment wrapper')
        return None
    try:return json.loads(m.group(1))
    except Exception as exc: fail(f'{path.relative_to(ROOT)}: invalid JSON payload: {exc}'); return None

def validate_question_material(path):
    data=assignment(path,r'\s*window\.MATERIAL_DATA\s*=\s*(\{.*\});\s*')
    if not data:return
    meta=data.get('meta',{}); sections=data.get('sections',[]); qs=[q for s in sections for q in s.get('qs',[])]
    if meta.get('count')!=len(qs): fail(f'{path.relative_to(ROOT)}: meta.count mismatch')
    if not meta.get('storageKey') or not meta.get('slug'): fail(f'{path.relative_to(ROOT)}: missing storageKey/slug')
    kind=meta.get('kind'); seen=set()
    for i,q in enumerate(qs,1):
        text=str(q.get('q','')).strip(); norm=re.sub(r'\s+',' ',text)
        if not text: fail(f'{path.relative_to(ROOT)}: question {i} empty')
        if norm in seen: warn(f'{path.relative_to(ROOT)}: duplicate wording near question {i}: {norm[:80]}')
        seen.add(norm)
        if kind=='mcq':
            opts=q.get('o'); a=q.get('a')
            if not isinstance(opts,list) or len(opts)<2: fail(f'{path.relative_to(ROOT)}: question {i} needs >=2 options')
            elif not isinstance(a,int) or not 0<=a<len(opts): fail(f'{path.relative_to(ROOT)}: question {i} invalid answer index')
        elif kind=='qa':
            if not str(q.get('a','')).strip(): fail(f'{path.relative_to(ROOT)}: question {i} empty answer')
        else: fail(f'{path.relative_to(ROOT)}: unsupported kind {kind!r}')
    running=0
    for si,sec in enumerate(sections,1):
        sq=sec.get('qs',[]); badge=str(sec.get('badge','')).strip()
        if not sec.get('title'): fail(f'{path.relative_to(ROOT)}: section {si} empty title')
        if not badge: fail(f'{path.relative_to(ROOT)}: section {si} empty badge')
        expected=(running+1,running+len(sq)); m=re.fullmatch(r'(\d+)\s*[–—-]\s*(\d+)',badge)
        if m:
            start,end=map(int,m.groups())
            if start>end: fail(f'{path.relative_to(ROOT)}: section {si} reversed badge')
            elif end-start+1!=len(sq): fail(f'{path.relative_to(ROOT)}: section {si} badge length mismatch')
            elif (start,end)!=expected: warn(f'{path.relative_to(ROOT)}: section {si} badge {badge!r} is local/source range; global positions {expected[0]}–{expected[1]}')
        running=expected[1]

def validate_learning(path):
    data=assignment(path,r'\s*globalThis\.LEARNING_MATERIAL_DATA\s*=\s*(\{.*\});\s*')
    if not data:return
    meta=data.get('meta',{}); modules=data.get('modules',[]); chapters=data.get('chapters',[]); qmap=data.get('questionMap',[])
    chapter_ids=[c.get('id') for c in chapters]; topic_list=[t for c in chapters for t in c.get('topics',[])]; topic_ids=[t.get('id') for t in topic_list]
    if len(chapter_ids)!=len(set(chapter_ids)): fail(f'{path.relative_to(ROOT)}: duplicate chapter ids')
    if len(topic_ids)!=len(set(topic_ids)): fail(f'{path.relative_to(ROOT)}: duplicate topic ids')
    if meta.get('chapterCount')!=len(chapters): fail(f'{path.relative_to(ROOT)}: chapterCount mismatch')
    if meta.get('topicCount')!=len(topic_list): fail(f'{path.relative_to(ROOT)}: topicCount mismatch')
    if meta.get('questionCount')!=len(qmap): fail(f'{path.relative_to(ROOT)}: questionCount mismatch')
    if meta.get('moduleCount')!=len(modules): fail(f'{path.relative_to(ROOT)}: moduleCount mismatch')
    module_chapters=[cid for m in modules for cid in m.get('chapters',[])]
    if set(module_chapters)!=set(chapter_ids) or len(module_chapters)!=len(chapter_ids): fail(f'{path.relative_to(ROOT)}: modules must reference every chapter exactly once')
    source_sections=[]
    for t in topic_list:
        if not t.get('titleAr') or not t.get('titleEn'): fail(f'{path.relative_to(ROOT)}: topic {t.get("id")} missing title')
        source_sections.extend(t.get('sourceSectionIds',[]))
        for b in t.get('blocks',[]):
            if b.get('type')!='source-section': fail(f'{path.relative_to(ROOT)}: topic {t.get("id")} unsupported content block')
            if 'questions' in b or 'explanation' in b: fail(f'{path.relative_to(ROOT)}: training/feedback content leaked into source block')
    if len(source_sections)!=len(set(source_sections)): fail(f'{path.relative_to(ROOT)}: source sections assigned more than once')
    for i,m in enumerate(qmap,1):
        if m.get('number')!=i: fail(f'{path.relative_to(ROOT)}: question mapping {i} number mismatch')
        if m.get('chapterId') not in chapter_ids: fail(f'{path.relative_to(ROOT)}: question mapping {i} invalid chapter')
        if m.get('topicId') not in topic_ids: fail(f'{path.relative_to(ROOT)}: question mapping {i} invalid topic')
        if not m.get('sourceSectionId'): fail(f'{path.relative_to(ROOT)}: question mapping {i} missing source section')
    if meta.get('id')=='flutter-learning':
        if len(modules)!=4 or len(chapters)!=12 or len(topic_list)!=61 or len(qmap)!=341: fail('flutter-learning: expected 4 modules, 12 chapters, 61 topics, 341 mappings')
        bank=assignment(ROOT/'data/flutter-mcq.js',r'\s*window\.MATERIAL_DATA\s*=\s*(\{.*\});\s*')
        bank_qs=[q for sec in (bank or {}).get('sections',[]) for q in sec.get('qs',[])]
        if len(bank_qs)!=341: fail('flutter-learning: source Flutter bank must contain exactly 341 questions')
        canonical=[]
        for i,q in enumerate(bank_qs,1):
            opts=q.get('o'); a=q.get('a')
            if not isinstance(opts,list) or not isinstance(a,int) or not 0<=a<len(opts): fail(f'flutter-learning: source bank question {i} invalid')
            else: canonical.append(f"{q.get('q','')}\t"+'\x1f'.join(opts)+f"\t{opts[a]}")
        h=0x811c9dc5
        for ch in '\n'.join(sorted(canonical)):
            h=((h^ord(ch))*0x01000193)&0xffffffff
        if f'0x{h:08x}'!='0x8997ebc6': fail(f'flutter-learning: source question bank hash mismatch 0x{h:08x}')
        if meta.get('sourceBankHash')!='0x8997ebc6': fail('flutter-learning: declared sourceBankHash mismatch')

def validate_registry(path):
    data=assignment(path,r'\s*globalThis\.MATERIAL_REGISTRY\s*=\s*(\[.*\]);\s*')
    if data is None:return
    ids=[]
    for i,m in enumerate(data,1):
        mid=m.get('id'); ids.append(mid)
        if not mid or not m.get('kind') or not m.get('title') or not m.get('href'): fail(f'registry item {i}: missing required fields')
        for rel in m.get('offlineFiles',[]):
            clean=rel[2:] if rel.startswith('./') else rel
            if not (ROOT/clean).exists(): fail(f'registry {mid}: missing offline file {rel}')
        if m.get('kind')=='learning':
            if not m.get('dataUrl'): fail(f'registry {mid}: learning material missing dataUrl')
            if not m.get('bankDataUrl'): fail(f'registry {mid}: learning material missing bankDataUrl')
    if len(ids)!=len(set(ids)): fail('materials registry has duplicate ids')

for path in sorted((ROOT/'data').glob('*.js')):
    text=path.read_text(encoding='utf-8')
    if re.match(r'\s*window\.MATERIAL_DATA\s*=',text): validate_question_material(path)
    elif re.match(r'\s*globalThis\.LEARNING_MATERIAL_DATA\s*=',text): validate_learning(path)
    elif path.name=='materials-registry.js': validate_registry(path)
    else: fail(f'{path.relative_to(ROOT)}: unknown data format')

for rel in ['assets/study-v2.js','assets/study-plus.js','assets/study-ui-loader.js','assets/print-phase6.js','assets/project-fixes.js','assets/learning-loader.js','assets/learning-engine.js','assets/learning-styles.css','assets/materials-hub.js']:
    if not (ROOT/rel).exists(): fail(f'{rel} is required')

# Existing question-bank pages retain their legacy UI contract.
legacy_pages=[
 'materials/enterprise-architecture.html','materials/mcq-flutter.html',
 'materials/mcq-information-security-privacy.html','materials/qa-information-security-privacy.html']
for rel in legacy_pages:
    page=(ROOT/rel).read_text(encoding='utf-8')
    for required in ('id="filterBy"','id="sortBy"','id="stopQuizFloatBtn"'):
        if required not in page: fail(f'{rel}: missing required UI control {required}')
    if '../assets/study-v2.js' not in page or '../assets/study-plus.js' not in page: fail(f'{rel}: missing shared study scripts')
    if 'https://wa.me/967771179020' not in page: fail(f'{rel}: author footer is not linked to WhatsApp')

learning=(ROOT/'materials/learning.html').read_text(encoding='utf-8')
for required in ('id="app"','id="learningPrintDialog"','../data/materials-registry.js','../assets/learning-loader.js'):
    if required not in learning: fail(f'materials/learning.html: missing {required}')
if 'Feedback' in learning or 'تدريب القسم' in learning: fail('materials/learning.html: forbidden legacy training/feedback UI')

html_files=list((ROOT/'materials').glob('*.html'))+[ROOT/'index.html']
for hp in html_files:
    text=hp.read_text(encoding='utf-8')
    for ref in re.findall(r'(?:src|href)="([^"]+)"',text):
        if ref.startswith(('http://','https://','data:','#')): continue
        clean=ref.split('?',1)[0].split('#',1)[0]
        if not clean: continue
        target=(hp.parent/clean).resolve()
        try: target.relative_to(ROOT.resolve())
        except ValueError: continue
        if not target.exists(): fail(f'{hp.relative_to(ROOT)}: missing referenced file {ref}')

expected={'materials/enterprise-architecture.html':275,'materials/mcq-flutter.html':341,'materials/mcq-information-security-privacy.html':200,'materials/qa-information-security-privacy.html':100}
for rel,count in expected.items():
    if f'0/{count}' not in (ROOT/rel).read_text(encoding='utf-8'): fail(f'{rel}: initial progress counter is not 0/{count}')

loader=(ROOT/'assets/study-ui-loader.js').read_text(encoding='utf-8')
if 'project-fixes.js' not in loader: fail('study-ui-loader.js must load project-fixes.js')
index=(ROOT/'index.html').read_text(encoding='utf-8')
for ref in ('data/materials-registry.js','assets/materials-hub.js',"serviceWorker.register('./sw.js'"):
    if ref not in index: fail(f'index.html missing {ref}')
sw=(ROOT/'sw.js').read_text(encoding='utf-8')
for marker in ("importScripts('./data/materials-registry.js')",'MATERIAL_REGISTRY','ignoreSearch:true','university-study-v15'):
    if marker not in sw: fail(f'sw.js missing {marker}')

for m in warnings: print('WARN',m)
if errors:
    print('\nVALIDATION FAILED')
    for e in errors: print('ERROR',e)
    sys.exit(1)
print('Validation passed: legacy question banks, flexible material registry, learning schema, Flutter 4/12/61/341 structure, source-bank hash, local references and dynamic offline registry are consistent.')
