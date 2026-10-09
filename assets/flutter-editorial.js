/* Source-faithful editorial chapter layout, driven by Flutter_Chapters.md curated data.
   This module only changes display. Existing IDs, bank records, progress and scoring remain untouched. */
((root)=>{
 'use strict';
 const DATA=root.FLUTTER_EDITORIAL_DATA;
 const esc=(x)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const brand=new Set(['Flutter','Dart','Firebase','Firestore','Cloud Firestore']);
 function technical(s){
   return esc(s).replace(/\b(Cloud Firestore|Flutter|Dart|Firebase|Firestore|Framework)\b/g,(m)=>`<strong class="ed-term ${brand.has(m)?'ed-brand':'ed-ink'}" dir="ltr">${m}</strong>`);
 }
 // Derived from the supplied DeepSeek example's Dart syntax categories, but safely
 // escaped and used for genuine code/expressions only (not prose terms).
 const KW=new Set('class final void if else for while do return extends implements with mixin abstract static factory late var const new this super null true false async await try catch finally throw break continue switch case default in is as enum get set operator required external sync yield covariant typedef assert rethrow import export library part show hide on'.split(' '));
 const TYPES=new Set('int double String bool num Object Function List Map Set Future Stream Iterable Duration DateTime Widget StatelessWidget StatefulWidget State BuildContext Element Text Image Icon Container Column Row Stack Center Align Padding SizedBox Expanded Flexible ListView GridView SingleChildScrollView Wrap BoxDecoration MediaQuery Scaffold AppBar Drawer BottomNavigationBar MaterialApp CupertinoApp ElevatedButton TextButton OutlinedButton IconButton FloatingActionButton TextField Checkbox Radio Switch CircularProgressIndicator SnackBar AlertDialog Navigator'.split(' '));
 function syntax(code){
  const src=String(code??'');
  const rx=/\/\/[^\n]*|\"(?:[^\"\\]|\\.)*\"|'(?:[^'\\]|\\.)*'|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*|[^A-Za-z_$\d]/g;
  return (src.match(rx)||[]).map(tok=>{
    let type='';
    if(tok.startsWith('//'))type='com';
    else if(/^['"]/.test(tok))type='str';
    else if(/^\d/.test(tok))type='num';
    else if(KW.has(tok))type='kw';
    else if(TYPES.has(tok))type='type';
    if(type)return `<span class="ed-tok-${type}">${esc(tok)}</span>`;
    return esc(tok);
  }).join('');
 }
 function inline(text,print=false){
   const chunks=String(text??'').split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
   return chunks.map(chunk=>{
     if(chunk.startsWith('`')&&chunk.endsWith('`')){
       const c=chunk.slice(1,-1);
       return `<bdi class="ed-inline-code" dir="ltr">${syntax(c)}</bdi>`;
     }
     if(chunk.startsWith('**')&&chunk.endsWith('**')){
       const val=chunk.slice(2,-2);
       return `<strong class="ed-term ${brand.has(val)?'ed-brand':'ed-ink'}" dir="auto">${esc(val)}</strong>`;
     }
     return technical(chunk);
   }).join('');
 }

 function table(t){
  if(!t)return '';
  return t.map(row=>`<div class="ed-table-wrap" role="region" tabindex="0" aria-label="مقارنة ${esc(row.headers.join(' و '))}"><table class="ed-compare" dir="rtl"><thead><tr>${row.headers.map(h=>`<th scope="col"><bdi dir="ltr">${esc(h)}</bdi></th>`).join('')}</tr></thead><tbody>${row.rows.map(items=>`<tr>${items.map(v=>`<td>${inline(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('');
 }
 function code(value){
  if(!value)return '';
  // Code only, never definitions. Uses the approved syntax-highlighted reusable code component.
  return (/\.\.\./.test(value)?`<pre class="ed-illustration" dir="ltr"><code>${esc(value)}</code></pre>`:root.FlutterReading?.codeBlock(value))||`<pre dir="ltr"><code>${esc(value)}</code></pre>`;
 }
 function sections(id){return DATA?.chapters?.[id]||[];}
 function sectionHTML(sec,i,print){
  const pairedEnglish=(sec.ar.includes('Flutter')&&sec.ar.includes('Dart')&&/Flutter\s*&\s*Dart/i.test(sec.en))?'':sec.en;
  const notes=sec.notes.map(n=>`<li>${inline(n,print)}</li>`).join('');
  // For genuine code, display the executable expression first and source-derived
  // explanations immediately below, on screen AND on paper. No invented labels.
  const printedCode=sec.code?`<div class="ed-print-example"><pre dir="ltr"><code class="ed-full-code">${syntax(sec.code)}</code></pre></div>`:'';
  const screenCode=sec.code?`<div class="ed-example">${code(sec.code)}</div>`:'';
  if(print) return `<section class="ed-print-topic"><h3 class="ed-print-section-name">${esc(sec.ar)}${pairedEnglish&&pairedEnglish!==sec.ar?` <span dir="ltr">${esc(pairedEnglish)}</span>`:''}</h3>${printedCode}<ul class="ed-print-notes">${notes}</ul>${sec.table?table(sec.table):''}</section>`;
  return `<section class="ed-topic" id="ed-topic-${i+1}"><div class="ed-topic-head"><span class="ed-num" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><h2>${esc(sec.ar)} ${pairedEnglish?`<span class="ed-en" dir="ltr">${esc(pairedEnglish)}</span>`:''}</h2></div>${screenCode}<ul class="ed-notes">${notes}</ul>${sec.table?table(sec.table):''}</section>`;
 }
 function reading(id){const ss=sections(id);return `<div class="ed-reading"><div class="ed-section-list">${ss.map((s,i)=>sectionHTML(s,i,false)).join('')}</div></div>`;}
 function print(id){return `<div class="ed-print-reading">${sections(id).map((s,i)=>sectionHTML(s,i,true)).join('')}</div>`;}
 root.FlutterEditorial=Object.freeze({reading,print,sections,inline,table,sourceHash:DATA?.sha256||''});
})(globalThis);