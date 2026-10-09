"""Phase 6 offline Chromium print verification via set_content, not HTTP/browser device acceptance."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re, sys, json, hashlib
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'phase6-evidence';OUT.mkdir(exist_ok=True)
OK=[];BAD=[]
def pick(page,selector,value):
 page.evaluate("([selector,value])=>{const el=document.querySelector(selector);el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));}",[selector,value])

STORE='''window.__testStore={};Object.defineProperty(window,"localStorage",{configurable:true,value:{getItem(k){return window.__testStore[k]??null},setItem(k,v){window.__testStore[k]=String(v)},removeItem(k){delete window.__testStore[k]},clear(){window.__testStore={}}}});window.scrollTo=()=>{};'''

def load(browser,name):
    page=browser.new_page(viewport={'width':1280,'height':850});page.set_default_timeout(3000)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    file='learning.html' if name=='learning' else name+'.html'
    html=(ROOT/'materials'/file).read_text()
    html=re.sub(r'<script\b[^>]*>.*?</script>','',html, flags=re.S)
    page.set_content(html,wait_until='domcontentloaded')
    for css in ['styles.css']+(['learning-styles.css','learning-design-v4.css'] if name=='learning' else []):
      page.add_style_tag(content=(ROOT/'assets'/css).read_text())
    page.evaluate(STORE)
    if name=='learning':
      page.add_script_tag(content=(ROOT/'data/flutter-learning.js').read_text())
      page.add_script_tag(content=(ROOT/'data/flutter-mcq.js').read_text())
      page.evaluate('globalThis.LEARNING_QUESTION_BANK=window.MATERIAL_DATA')
      for js in ['learning-model','learning-state','learning-print','learning-engine']:
        page.add_script_tag(content=(ROOT/'assets'/f'{js}.js').read_text())
      assert page.evaluate('!!window.LearningEngine?.ready'), 'learning failed '+str(errors)
    else:
      dataset={'mcq-flutter':'flutter-mcq.js','enterprise-architecture':'enterprise-architecture.js','mcq-information-security-privacy':'security-mcq.js','qa-information-security-privacy':'security-qa.js'}[name]
      page.add_script_tag(content=(ROOT/'data'/dataset).read_text())
      for js in ['phase5-progress','qa-engine' if name.startswith('qa-') else 'mcq-engine','study-v2','study-plus','quiz-phase4','analytics-phase5','project-fixes','print-phase6']:
        page.add_script_tag(content=(ROOT/'assets'/f'{js}.js').read_text())
      assert page.evaluate('!!window.StudyPhase6?.prepare'),'legacy print module failed '+str(errors)
    assert not errors,errors
    return page,errors

def check(name,fn):
 try:
  fn();OK.append(name);print('PASS',name,flush=True)
 except Exception as ex:
  BAD.append((name,repr(ex)[:300]));print('FAIL',name,repr(ex)[:300],flush=True)

def learning(browser):
 page,err=load(browser,'learning')
 data=page.evaluate('''()=>({chapters:LearningEngine.chapters().length, questions:LearningEngine.questions().length})''')
 assert data=={'chapters':12,'questions':341},data
 for mode in ['content','questions','answers','key','complete','complete-exam']:
  pick(page,'#learningPrintType',mode)
  s=page.evaluate('LearningEngine.print.build()')
  assert page.locator('#learningPrintDocument .learning-print-chapter').count()==12,mode
  assert page.locator('#learningPrintDocument .learning-print-index a').count()==12,mode
  if mode in ('complete','complete-exam'):
   assert page.locator('#learningPrintDocument .learning-print-topic').count()>0
   assert page.locator('#learningPrintDocument .learning-print-question').count()==341
  if mode=='content':assert page.locator('#learningPrintDocument .learning-print-question').count()==0
  if mode=='key':assert page.locator('#learningPrintDocument .learning-print-key span').count()==341
  if mode in ('answers','complete'):
   assert page.locator('#learningPrintDocument .correct-text').count()==341
  else:assert page.locator('#learningPrintDocument .correct-text').count()==0
  assert '✓' not in page.locator('#learningPrintDocument').inner_text(),mode
  for href in page.locator('#learningPrintDocument .learning-print-index a').evaluate_all('(nodes)=>nodes.map(n=>n.getAttribute("href"))'):
   assert page.locator('[id="'+href[1:]+'"]').count()==1,(mode,href)
 pick(page,'#learningPrintScope','chapter');pick(page,'#learningPrintTarget','ch2')
 pick(page,'#learningPrintType','complete')
 page.evaluate('LearningEngine.print.build()')
 assert page.locator('#learningPrintDocument .learning-print-chapter').count()==1
 expected=page.evaluate('LearningEngine.questions().filter(q=>q.chapterId==="ch2").length')
 assert page.locator('#learningPrintDocument .learning-print-question').count()==expected
 assert page.locator('#learningPrintScope option[value="module"]').count()==0
 assert page.locator('#learningPrintDocument .learning-print-index a').count()==1
 assert 'Module ' not in page.locator('#learningPrintDocument').inner_text()
 pick(page,'#learningPrintScope','review')
 assert page.evaluate('LearningEngine.print.build().empty') is True
 assert page.locator('#learningPrintDocument').inner_text()==''
 assert page.locator('#learningDoPrintBtn').is_disabled()
 pick(page,'#learningPrintScope','all');pick(page,'#learningPrintType','complete')
 page.evaluate('LearningEngine.print.build();document.body.classList.add("learning-printing")')
 page.emulate_media(media='print')
 font_family=page.locator('#learningPrintDocument').evaluate('(node)=>getComputedStyle(node).fontFamily')
 assert 'Noto Sans Arabic' in font_family, font_family
 style=page.locator('#learningPrintDocument .learning-print-option-text.correct-text').first.evaluate('(n)=>({bg:getComputedStyle(n).backgroundColor,li:getComputedStyle(n.parentElement).backgroundColor})')
 assert style['bg']!='rgba(0, 0, 0, 0)' and style['li'] in ('rgba(0, 0, 0, 0)','rgb(255, 255, 255)'),style
 pdf=page.pdf(format='A4',print_background=True,prefer_css_page_size=True)
 assert len(pdf)>10000
 (OUT/'flutter_full_study_answers_a4.pdf').write_bytes(pdf)
 page.screenshot(path=str(OUT/'flutter_full_study_print_sample.png'),full_page=False)
 page.emulate_media(media='screen')
 pick(page,'#learningPrintScope','chapter')
 pick(page,'#learningPrintTarget','ch1')
 pick(page,'#learningPrintType','complete-exam')
 page.evaluate('LearningEngine.print.build()')
 assert page.locator('#learningPrintDocument .learning-print-question').count()>0
 assert page.locator('#learningPrintDocument .correct-text').count()==0
 page.emulate_media(media='print')
 (OUT/'flutter_chapter1_study_no_answers_a4.pdf').write_bytes(page.pdf(format='A4',print_background=True,prefer_css_page_size=True))
 page.close()

def legacy(browser,name):
 page,err=load(browser,name)
 count=page.evaluate('StudyEngine.allQuestions().length')
 for mode in ['questions','answers','key'] if not name.startswith('qa') else ['questions','answers']:
  r=page.evaluate('(mode)=>StudyPhase6.prepare({content:mode,scope:"all"}).count',mode)
  assert r==count,(name,mode,count,r)
  text=page.locator('#phase6PrintDocument').inner_text()
  assert '✓' not in text
  assert page.locator('#phase6PrintDocument .phase6-answer-mark').count()==0
  if mode=='answers' and not name.startswith('qa'):
   assert page.locator('#phase6PrintDocument .is-answer-text').count()==count
  if mode=='questions':assert page.locator('#phase6PrintDocument .is-answer-text').count()==0
  for href in page.locator('#phase6PrintDocument .phase6-print-index a').evaluate_all('(nodes)=>nodes.map(n=>n.getAttribute("href"))'):
   assert page.locator('[id="'+href[1:]+'"]').count()==1,(name,href)
 page.evaluate('StudyPhase6.prepare({content:"answers",scope:"all"}); document.body.classList.add("phase6-printing")')
 page.emulate_media(media='print')
 assert page.locator('#phase6PrintDocument').is_visible()
 style=page.locator('#phase6PrintDocument .phase6-question').first.evaluate('(n)=>getComputedStyle(n).breakInside')
 assert style in ('avoid-page','avoid'),style
 pdf=page.pdf(format='A4',print_background=True,prefer_css_page_size=True)
 assert len(pdf)>5000
 if name in ('mcq-flutter','qa-information-security-privacy'):
  (OUT/f'{name}_answers_a4.pdf').write_bytes(pdf)
 page.close()

with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 check('Flutter learning 12 chapters / six output modes / filters / empty review / A4',lambda:learning(browser))
 for name in ['enterprise-architecture','mcq-flutter','mcq-information-security-privacy','qa-information-security-privacy']:
  check('Legacy A4 bank '+name,lambda name=name:legacy(browser,name))
 browser.close()
print('TOTAL',len(OK),'PASS',len(BAD),'FAIL',flush=True)
(OUT/'phase6-offline-test-results.json').write_text(json.dumps({'ok':OK,'failed':BAD},ensure_ascii=False,indent=2))
if BAD:sys.exit(1)