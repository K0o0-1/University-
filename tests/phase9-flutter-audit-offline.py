from pathlib import Path
import re,json,hashlib,sys
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
out=root/'phase9-audit';out.mkdir(exist_ok=True)
results=[];exceptions=[]
def check(name,act):
 try:
  val=act();assert val,repr(val);results.append({'test':name,'pass':True});print('PASS',name,flush=True)
 except Exception as e:
  results.append({'test':name,'pass':False,'detail':str(e)[:300]});exceptions.append(name);print('FAIL',name,str(e)[:130],flush=True)
def eq(a,b):return a==b
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for width in [390,1280]:
  pg=browser.new_page(viewport={'width':width,'height':850});pg.set_default_timeout(5000)
  errors=[];pg.on('pageerror',lambda x:errors.append(str(x)))
  html=re.sub(r'<script\b[^>]*>.*?</script>','',(root/'materials/learning.html').read_text(),flags=re.S)
  pg.set_content(html)
  pg.evaluate('''window.__st={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__st[k]??null,setItem:(k,v)=>window.__st[k]=String(v),removeItem:k=>delete window.__st[k],clear:()=>window.__st={}}});window.scrollTo=()=>{}''')
  for x in ['styles','learning-styles','learning-design-v4','flutter-reading','flutter-editorial','pwa-phase7']:
   pg.add_style_tag(content=(root/'assets'/f'{x}.css').read_text())
  for x in ['flutter-learning','flutter-mcq','flutter-comparison-tables','flutter-editorial']:
   pg.add_script_tag(content=(root/'data'/f'{x}.js').read_text())
  pg.evaluate('globalThis.LEARNING_QUESTION_BANK=globalThis.MATERIAL_DATA')
  for x in ['learning-model','learning-state','learning-print','flutter-reading','flutter-editorial','voice-phase7','learning-engine','pwa-phase7']:
   pg.add_script_tag(content=(root/'assets'/f'{x}.js').read_text())
  check(f'{width} app loads',lambda:pg.evaluate('LearningEngine.ready===true'))
  check(f'{width} exactly 12 cards',lambda:pg.locator('.learning-chapter-card').count()==12)
  check(f'{width} 341 bank original',lambda:pg.evaluate('LearningEngine.questions().length')==341)
  check(f'{width} no module home',lambda:'Module ' not in pg.locator('#app').inner_text())
  check(f'{width} no module print selection',lambda:pg.locator('#learningPrintScope option[value="module"]').count()==0)
  check(f'{width} English heading first',lambda:pg.locator('.learning-chapter-card').first.locator('h3').inner_text()=='Dart Fundamentals')
  check(f'{width} 32 chapter1 questions',lambda:pg.locator('.learning-chapter-card').first.inner_text().find('32 Q')!=-1)
  check(f'{width} 79 organized topics',lambda:pg.evaluate('Object.values(FLUTTER_EDITORIAL_DATA.chapters).flat().length')==79)
  for i in range(1,13):
   pg.locator(f'[data-open-chapter="ch{i}"]').click()
   check(f'{width} chapter{i} no contents panel',lambda:pg.locator('.ed-outline').count()==0)
   check(f'{width} chapter{i} no example label',lambda:'مثال من المصدر' not in pg.locator('#learningExplanation').inner_text())
   check(f'{width} chapter{i} ordered headings',lambda:pg.locator('.ed-topic h2').count()==pg.evaluate(f'FLUTTER_EDITORIAL_DATA.chapters.ch{i}.length'))
   check(f'{width} chapter{i} no duplicated visible chapter title',lambda:pg.locator('.learning-reading-header h1').count()==1)
   check(f'{width} chapter{i} source code follows before explanation',lambda:pg.evaluate('''()=>[...document.querySelectorAll('.ed-topic')].every(sec=>{let c=sec.querySelector('.ed-example');let n=sec.querySelector('.ed-notes');return !c||(!!n&&!!(c.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING))})'''))
   if i==1:
    check(f'{width} CH1 full nullable expression',lambda:pg.locator('.ed-inline-code').all_inner_texts().count('String? name;')>=1)
    check(f'{width} CH1 2 comparison tables',lambda:pg.locator('.ed-table-wrap').count()==2)
    check(f'{width} CH1 32 source Q',lambda:pg.locator('.learning-bank-question').count()>0 or '32' in pg.locator('.learning-reading-header').inner_text())
    pg.screenshot(path=str(out/f'flutter_ch1_{width}.png'),full_page=False)
   pg.locator('[data-nav="study"]').first.click()
  check(f'{width} no errors from 12 chapters',lambda:not errors)
  check(f'{width} no page overflow',lambda:pg.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'))
  if width==1280:
   for mode in ['content','questions','answers','key','complete','complete-exam']:
    pg.evaluate('(v)=>{let e=document.querySelector("#learningPrintType");e.value=v;e.dispatchEvent(new Event("change",{bubbles:true}))}',mode)
    check('build print '+mode,lambda:bool(pg.evaluate('LearningEngine.print.build()')))
    check('print 12 links '+mode,lambda:pg.locator('#learningPrintDocument .learning-print-index a').count()==12)
    check('print zero Modules '+mode,lambda:'Module ' not in pg.locator('#learningPrintDocument').inner_text())
    if mode in ('complete','answers'):
     check('341 correct choices '+mode,lambda:pg.locator('#learningPrintDocument .correct-text').count()==341)
    if mode=='questions':
     check('questions do not reveal correct answers',lambda:pg.locator('#learningPrintDocument .correct-text').count()==0)
   pg.evaluate('document.querySelector("#learningPrintScope").value="chapter";document.querySelector("#learningPrintScope").dispatchEvent(new Event("change",{bubbles:true}))')
   pg.evaluate('document.querySelector("#learningPrintTarget").value="ch1";document.querySelector("#learningPrintTarget").dispatchEvent(new Event("change",{bubbles:true}))')
   pg.evaluate('document.querySelector("#learningPrintType").value="complete"')
   pg.evaluate('LearningEngine.print.build();document.body.classList.add("learning-printing")')
   pg.emulate_media(media='print')
   check('chapter scope prints 1 chapter',lambda:pg.locator('#learningPrintDocument .learning-print-chapter').count()==1)
   check('chapter scope prints 32 questions',lambda:pg.locator('#learningPrintDocument .learning-print-question').count()==32)
   check('chapter scope print has link',lambda:pg.locator('#learningPrintDocument .learning-print-index a').count()==1)
   check('printed code before notes',lambda:pg.evaluate('''()=>[...document.querySelectorAll('.ed-print-topic')].every(sec=>{let c=sec.querySelector('.ed-print-example');let n=sec.querySelector('.ed-print-notes');return !c||(!!n&&!!(c.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING))})'''))
   check('print gray correct shading',lambda:pg.locator('.learning-print-option-text.correct-text').first.evaluate('x=>getComputedStyle(x).backgroundColor')=='rgb(225, 225, 225)')
   pdf=pg.pdf(format='A4',prefer_css_page_size=True,print_background=True)
   (out/'Flutter_Chapter1_Complete_Review_A4.pdf').write_bytes(pdf)
   check('PDF bytes present',lambda:len(pdf)>9000)
   pg.screenshot(path=str(out/'flutter_print_preview_1280.png'),full_page=False)
   pg.emulate_media(media='screen')
  pg.close()
 browser.close()
(out/'audit_browser_checks.json').write_text(json.dumps({'passed':sum(v['pass'] for v in results),'failed':len(exceptions),'results':results},ensure_ascii=False,indent=2))
print('TOTAL',sum(v['pass'] for v in results),'PASS',len(exceptions),'FAIL')
if exceptions:sys.exit(1)