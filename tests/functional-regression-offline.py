import re,json,traceback,sys
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]; OUT=Path('/mnt/data/university_phase2_results');OUT.mkdir(exist_ok=True)
errors=[];results=[]
html=(ROOT/'materials/learning.html').read_text();html=re.sub(r'<script\s+src="[^"]+"\s*></script>','',html)
css=(ROOT/'assets/learning-styles.css').read_text()
jsdata=(ROOT/'data/flutter-learning.js').read_text()
jsbank=(ROOT/'data/flutter-mcq.js').read_text()
jseng=(ROOT/'assets/learning-engine.js').read_text()
mock="""window.__storage=window.__storage||{};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){return window.__storage[k]??null},setItem(k,v){window.__storage[k]=String(v)},removeItem(k){delete window.__storage[k]},clear(){window.__storage={}}}}); window.scrollTo=()=>{};"""
def page_load(browser,state=None,size=None):
 page=browser.new_page(viewport=size or {'width':1280,'height':900},accept_downloads=True)
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content(html,wait_until='domcontentloaded');page.add_style_tag(content=css)
 page.evaluate(mock)
 if state:page.evaluate('(x)=>{window.__storage[x.key]=x.value}',state)
 page.add_script_tag(content=jsdata);page.add_script_tag(content=jsbank)
 page.evaluate('window.LEARNING_QUESTION_BANK=window.MATERIAL_DATA')
 page.add_script_tag(content=(ROOT/'assets/learning-model.js').read_text());page.add_script_tag(content=(ROOT/'assets/learning-state.js').read_text());page.add_script_tag(content=(ROOT/'assets/learning-print.js').read_text());page.add_script_tag(content=jseng)
 return page,errs
def check(label,cb):
 try:cb();results.append({'name':label,'status':'PASS'});print('PASS',label,flush=True)
 except Exception as e:results.append({'name':label,'status':'FAIL','error':str(e)});print('FAIL',label,(str(e).splitlines() or [repr(e)])[0][:300],flush=True)

def test_data(browser):
 p,err=page_load(browser)
 val=p.evaluate('''()=>({modules:document.querySelectorAll('.learning-module').length,chapters:document.querySelectorAll('.learning-chapter-card').length,questions:LearningEngine.questions().length,examples:JSON.stringify(LearningEngine.data).includes('"example"'),topics:JSON.stringify(LearningEngine.data).includes('"topics"'),bankId:LearningEngine.questions()[0].id})''')
 assert val=={'modules':0,'chapters':12,'questions':341,'examples':False,'topics':False,'bankId':'flutter-q001'},val
 p.locator('[data-open-chapter="ch1"]').click();assert p.locator('.learning-source-block').count()==8
 assert not p.locator('[data-open-topic]').count()
 assert not p.locator('.learning-example').count()
 assert p.locator('input[name=studyAnswer]').count()==4
 assert not err,err;p.close()

def test_study(browser):
 p,err=page_load(browser)
 p.locator('[data-open-chapter="ch1"]').click()
 qid=p.evaluate('LearningEngine.questions().filter(q=>q.chapterId==="ch1")[0].id')
 choice=p.evaluate('LearningEngine.questions().find(q=>q.id==="'+qid+'").answerIndex')
 wrong=(choice+1)%4
 p.locator('input[name=studyAnswer]').nth(wrong).check()
 assert p.locator('.learning-option.correct').count()==1
 assert p.locator('.learning-option.wrong').count()==1
 assert p.locator('.learning-error-chip').count()==1
 p.locator('[data-flag]').click();p.locator('[data-nav=review]').first.click()
 assert p.locator('.learning-review-item').count()==1
 p.locator('[data-review-tab=mistakes]').click();assert p.locator('.learning-review-item').count()==1
 p.locator('[data-review-open]').click()
 assert p.locator('input[name=studyAnswer]').count()==4
 assert p.locator('.learning-option.wrong').count()==1
 assert p.evaluate('LearningEngine.state().questionStats["'+qid+'"].wrong')==1
 assert p.locator('[data-complete-chapter]').is_disabled();assert 'ch1' not in p.evaluate('LearningEngine.state().completedChapters')
 assert not err,err
 state=p.evaluate('({key:"flutter_learning_v1",value:localStorage.getItem("flutter_learning_v1")})');p.close()
 q,err=page_load(browser,state)
 q.locator('[data-open-chapter="ch1"]').click()
 assert q.locator('.learning-option.wrong').count()==1
 assert not q.evaluate('LearningEngine.state().completedChapters.includes("ch1")')
 assert not err,err;q.close()

def test_training(browser):
 p,err=page_load(browser)
 p.locator('[data-nav="quiz"]').first.click();p.locator('#learningQuizCount').fill('2')
 p.locator('#learningStartQuizBtn').click()
 qid=p.evaluate('JSON.parse(localStorage.getItem("flutter_learning_v1_quiz")).qids[0]')
 answer=p.evaluate('LearningEngine.questions().find(x=>x.id==="'+qid+'").answerIndex')
 p.locator('input[name=quizAnswer]').nth((answer+1)%4).check()
 assert not p.locator('[data-check-quiz]').count()
 assert p.locator('.learning-option.wrong').count()==1
 assert p.locator('.learning-option.correct').count()==1
 assert p.evaluate('LearningEngine.state().questionStats["'+qid+'"].wrong')==1
 assert not err,err;p.close()

def test_exam(browser):
 p,err=page_load(browser)
 p.locator('[data-nav="quiz"]').first.click();p.locator('[data-qcfg="mode"][data-value="exam"]').click();p.locator('#learningQuizCount').fill('2');p.locator('#learningStartQuizBtn').click()
 answer=p.evaluate('LearningEngine.questions().find(q=>q.id===JSON.parse(localStorage.getItem("flutter_learning_v1_quiz")).qids[0]).answerIndex')
 p.locator('input[name=quizAnswer]').nth(answer).check()
 assert p.locator('.learning-option.correct').count()==0
 assert p.locator('.learning-option.wrong').count()==0
 p.locator('[data-finish-quiz]').click()
 assert p.locator('.learning-result-card').count()==8
 p.locator('[data-review-result]').click()
 assert p.locator('.learning-option.correct').count()==2
 assert not err,err;p.close()

def test_print(browser):
 p,err=page_load(browser)
 p.locator('#learningMoreBtn').click();p.locator('[data-more="print"]').click();p.locator('#learningPrintType').select_option('answers')
 a=p.evaluate('LearningEngine.print.build().questions.length');assert a==341
 assert p.locator('#learningPrintDocument .learning-print-question .learning-print-option-text.correct-text').count()==341
 assert p.locator('#learningPrintDocument .learning-print-index h3').count()==0
 assert p.locator('#learningPrintDocument .learning-print-index a').count()==12
 assert 'Module ' not in p.locator('#learningPrintDocument').inner_text()
 p.emulate_media(media='print');p.evaluate('document.body.classList.add("learning-printing")')
 p.pdf(path=str(OUT/'answers.pdf'),format='A4',print_background=True,prefer_css_page_size=True)
 style=p.locator('#learningPrintDocument .learning-print-question .learning-print-option-text.correct-text').first.evaluate('e=>({color:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor,border:getComputedStyle(e).borderColor})')
 assert style['bg']!='rgba(0, 0, 0, 0)' and style['bg']!='rgb(255, 255, 255)',style
 assert not err,err;p.close()

def test_review_print(browser):
 p,err=page_load(browser)
 p.locator('[data-open-chapter="ch1"]').click();p.locator('[data-flag]').click();p.locator('[data-nav="review"]').first.click()
 p.locator('[data-print-review]').click();assert p.locator('#learningPrintScope').input_value()=='review'
 assert p.evaluate('LearningEngine.print.build().questions.length')==1
 p.emulate_media(media='print');p.evaluate('document.body.classList.add("learning-printing")')
 p.pdf(path=str(OUT/'review.pdf'),format='A4',print_background=True)
 assert not err,err;p.close()

def test_mobile(browser):
 p,err=page_load(browser,size={'width':390,'height':844})
 assert p.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
 p.locator('[data-open-chapter="ch1"]').click();assert p.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
 p.locator('#learningMoreBtn').click();p.locator('[data-more="print"]').click()
 assert p.locator('#learningPrintDialog').is_visible()
 assert not err,err;p.screenshot(path=str(OUT/'mobile.png'));p.close()

def test_backup(browser):
 p,err=page_load(browser)
 orig=p.evaluate('LearningEngine.state().completedChapters.length')
 bad={'materialId':'flutter-learning','state':{'version':1,'completedTopics':None,'reviewFlags':[],'questionStats':{},'quizHistory':[]}}
 p.locator('#learningImportInput').set_input_files({'name':'bad.json','mimeType':'application/json','buffer':json.dumps(bad).encode()})
 p.wait_for_timeout(100)
 assert p.evaluate('LearningEngine.state().completedChapters.length')==orig
 assert p.evaluate('localStorage.getItem("flutter_learning_v1")') is None
 assert not err,err;p.close()

def test_review_quiz(browser):
 p,err=page_load(browser)
 p.locator('[data-open-chapter="ch1"]').click();p.locator('[data-flag]').click()
 p.locator('[data-nav="quiz"]').first.click();p.locator('#learningStartQuizBtn').click();
 p.locator('[data-nav="review"]').first.click();p.locator('[data-review-quiz]').click()
 assert not p.locator('.learning-quiz-shell').count(), 'old session appeared'
 assert p.locator('#learningStartQuizBtn').count()==1
 p.locator('#learningStartQuizBtn').click()
 n=p.evaluate('JSON.parse(localStorage.getItem("flutter_learning_v1_quiz")).qids.length')
 assert n==1,n
 assert not err,err;p.close()

with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for label,fn in [('4/12/341 content',test_data),('study state & reload',test_study),('training immediate',test_training),('exam no pre-reveal',test_exam),('A4 print 341 answers',test_print),('review subset print PDF',test_review_print),('mobile 390',test_mobile),('backup atomic invalid',test_backup),('review quiz replaces existing',test_review_quiz)]:check(label,lambda fn=fn:fn(b))
 b.close()
(OUT/'regression-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('RESULTS',len(results),'passed',sum(x['status']=='PASS' for x in results),'failed',sum(x['status']=='FAIL' for x in results),flush=True)
sys.exit(1 if any(x['status']=='FAIL' for x in results) else 0)