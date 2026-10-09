/* Flutter-only reading presentation. Uses immutable source lesson text and separate user-supplied comparison tables.
   No question bank, state, IDs, printed text or scoring is changed. */
((root)=>{
  'use strict';
  const TABLES=root.FLUTTER_COMPARISON_TABLES||{};
  const esc=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const primary=['Flutter','Dart','Firebase','Firestore','Cloud Firestore','Flutter Web'];
  const secondary=[
    'StatelessWidget','StatefulWidget','Class','Object','Widget','Widgets','BuildContext',
    'Navigator','MaterialApp','CupertinoApp','Scaffold','Container','ElevatedButton',
    'TextButton','OutlinedButton','IconButton','SQLite','SQL','NoSQL','Dart OOP','OOP',
    'State','Widget Tree','Hot Reload','Hot Restart',

    'Framework','Package','Plugin','Packages','Field','Property','Method','Constructor',
    'Inheritance','Encapsulation','Polymorphism','Abstraction','Instance','Widget','State',
    'Variables','Constants','Null Safety','Future','Database','Collection','Collections',
    'Document','Documents','Fields','Primary Key','Foreign Key','CRUD','API','REST API',
    'pubspec.yaml','main.dart','lib','assets','test','bool','String','double','int','void','final',
    'const','dynamic','var','setState','initState','dispose','async','await','BuildContext'
  ];
  const tokenTypes={};
  secondary.forEach(s=>tokenTypes[s]='secondary');primary.forEach(s=>tokenTypes[s]='primary');
  const terms=Object.keys(tokenTypes).sort((a,b)=>b.length-a.length).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  const termRx=new RegExp('(^|[^A-Za-z0-9_])('+terms.join('|')+')(?![A-Za-z0-9_])','g');
  function termsHTML(source){
    const text=String(source??'');let output='',last=0;termRx.lastIndex=0;let m;
    while((m=termRx.exec(text))!==null){
      const beginning=m.index+m[1].length;
      output+=esc(text.slice(last,beginning));
      const word=m[2],style=tokenTypes[word]==='primary'?'flutter-term--primary':'flutter-term--secondary';
      output+=`<strong class="flutter-term ${style}" dir="auto">${esc(word)}</strong>`;
      last=beginning+word.length;
      termRx.lastIndex=last;
    }
    return output+esc(text.slice(last));
  }
  // Only genuine multi-token program fragments and runnable CLI commands get a copy button.
  // Short technical terms are NEVER copy targets.
  function isCodeSnippet(text){
    const s=String(text??'').trim();
    if(/[\u0600-\u06ff]/.test(s))return false;
    return /^(?:class\s+[A-Z]\w*\b|(?:void|int|double|String|bool|final|const|var)\s+\w+\s*(?:\(|=|;)|(?:[A-Z]\w*\s+)?[a-zA-Z_]\w*\s*=|(?:Scaffold|ElevatedButton|TextButton|OutlinedButton|IconButton|Image\.(?:asset|network))\s*\(|onPressed\s*:|flutter\s+(?:doctor|create|run|clean|pub|test|analyze|devices|build|upgrade|--version)\b|dart\s+format\b)/.test(s)
      && !/\.\.\./.test(s);
  }
  const keywords=new Set('class final void if else for while do return extends implements with mixin abstract static factory late var const new this super null true false async await try catch finally throw break continue switch case default import export required'.split(' '));
  const types=new Set('int double String bool num Object Function List Map Set Future Stream Widget StatelessWidget StatefulWidget State Text Icon Scaffold ElevatedButton MaterialApp Image'.split(' '));
  function codeTokens(src){
    const s=String(src),rx=/(\/\/[^\n]*|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*|[^A-Za-z_$\d]+)/g;
    return [...s.matchAll(rx)].map(match=>{const token=match[0];let type='';
      if(token.startsWith('//'))type='com';
      else if(/^['"]/.test(token))type='str';
      else if(/^\d/.test(token))type='num';
      else if(keywords.has(token))type='kw';
      else if(types.has(token))type='type';
      return type?`<span class="flutter-tok-${type}">${esc(token)}</span>`:esc(token);
    }).join('');
  }
  function codeBlock(source){
    return `<div class="flutter-code-sample"><div class="flutter-code-head"><span>DART / CLI</span><button type="button" class="flutter-code-copy" aria-label="نسخ الكود" data-copy-flutter-code>نسخ <span aria-hidden="true">⧉</span></button></div><pre dir="ltr" class="flutter-code-body"><code>${codeTokens(source)}</code></pre></div>`;
  }
  // Full literal code expressions stay visually unified. No copy button for short snippets.
  function shortExpression(value){
    const s=String(value??'').trim();
    return /^[\w.$!?()\[\];:=/+-]+(?:\s+[\w.$!?()\[\];:=/+-]+)*$/.test(s) &&
      /[!?();=.]|\b(?:int|double|String|bool)\s+\w+/.test(s) && !isCodeSnippet(s);
  }
  function inline(source){
    const parts=String(source??'').split(/(`[^`]+`)/g);
    return parts.map((piece,index)=>{
      if(piece.startsWith('`')&&piece.endsWith('`')){
        const raw=piece.slice(1,-1);
        if(isCodeSnippet(raw))return codeBlock(raw);
        if(shortExpression(raw))return `<b class="flutter-inline-expression" dir="ltr">${esc(raw)}</b>`;
        return termsHTML(raw);
      }
      const previous=parts[index-1];
      if(previous?.startsWith('`') && previous.endsWith('`') &&
         isCodeSnippet(previous.slice(1,-1)) && piece.trim()==='.')return '';
      return termsHTML(piece);
    }).join('');
  }
  const headingOverrides={
    'ch1-s4':{key:'ch1-variables',ar:'المتغيرات والثوابت',en:'Variables & Constants'},
    'ch1-s8':{key:'ch1-null',ar:'',en:'Null Safety'},
    'ch1-s3':{key:'ch1-types',ar:'أنواع البيانات',en:'Data Types'}
  };
  function heading(chapterId,b){
    const o=headingOverrides[b.sourceSectionId];
    if(o)return {...o,title:b.title};
    return {key:chapterId+':'+(b.sectionTitle||b.title||''),ar:b.sectionTitle||'',en:'',title:b.title||''};
  }
  function isDuplicateSubhead(sub,group){
    const a=String(sub||'').toLowerCase().trim(),b=String(group.ar||'').toLowerCase().trim(),c=String(group.en||'').toLowerCase().trim();
    return !a || a===b || a===c;
  }
  function singleHeading(group,desc){
    const title=String(desc.title||'');
    if(group.en || !title || isDuplicateSubhead(title,group))return group;
    // e.g. "أنواع البيانات" with "Data Types": one bilingual line, never two headings.
    if(/[\u0600-\u06ff]/.test(group.ar) && /^[A-Za-z][A-Za-z\s&.()\/-]+$/.test(title))
      return {...group,en:title};
    // One topic in one category: most specific label only; never a second near-duplicate line.
    if(/[\u0600-\u06ff]/.test(title) && !/\bvs\b/i.test(title))
      return {...group,ar:title};
    return group;
  }
  function headingHTML(h){
    if(h.ar && h.en)return `<span>${esc(h.ar)}</span><span class="flutter-heading-english" dir="ltr">${esc(h.en)}</span>`;
    return esc(h.ar||h.en||'');
  }
  function factsForDisplay(chapterId,b){
    if(chapterId==='ch1'&&b.sourceSectionId==='ch1-s4')
       return (b.facts||[]).filter(f=>!f.startsWith('الفرق بين'));
    return b.facts||[];
  }
  function tables(chapterId,title){
    const entries=TABLES[chapterId+':'+title]||[];
    if(chapterId==='ch1' && title==='Variables & Constants'){
      const descriptions=[
        ['var','يحدد النوع عند التعيين ولا يتغير نوع المتغير.'],
        ['dynamic','يسمح بتغيير النوع.'],
        ['final','قيمته تحدد وقت التشغيل.'],
        ['const','يجب أن تكون ثابتة وقت الترجمة.']
      ];
      return [descriptions.slice(0,2),descriptions.slice(2,4)].map(pair=>
        `<div class="flutter-comparison-wrap flutter-compact-pair" role="region" tabindex="0" aria-label="مقارنة ${pair.map(p=>p[0]).join(' و ')}"><table class="flutter-comparison-table"><thead><tr>${pair.map(([name])=>`<th scope="col" dir="ltr">${esc(name)}</th>`).join('')}</tr></thead><tbody><tr>${pair.map(([,detail])=>`<td>${termsHTML(detail)}</td>`).join('')}</tr></tbody></table></div>`
      ).join('');
    }
    return entries.map(t=>`<div class="flutter-comparison-wrap" role="region" tabindex="0" aria-label="جدول مقارنة"><table class="flutter-comparison-table"><thead><tr>${t.headers.map(h=>`<th scope="col">${termsHTML(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(row=>`<tr>${row.map((v,i)=>i===0?`<th scope="row">${termsHTML(v)}</th>`:`<td>${termsHTML(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('');
  }
  function onCopyClick(e){
    const button=e.target.closest('[data-copy-flutter-code]');if(!button)return;
    const pre=button.closest('.flutter-code-sample')?.querySelector('code');if(!pre)return;
    const original=button.innerHTML;
    const show=(ok)=>{button.textContent=ok?'تم النسخ ✓':'تعذر النسخ';setTimeout(()=>{if(button.isConnected)button.innerHTML=original;},1700);};
    const value=pre.textContent;
    if(navigator.clipboard?.writeText){navigator.clipboard.writeText(value).then(()=>show(true),()=>fallback());}
    else fallback();
    function fallback(){try{const field=document.createElement('textarea');field.value=value;field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();const ok=document.execCommand('copy');field.remove();show(ok);}catch(_){show(false);}}
  }
  root.FlutterReading=Object.freeze({inline,tables,heading,headingHTML,singleHeading,isDuplicateSubhead,factsForDisplay,isCodeSnippet,codeBlock,bind:(node)=>node.addEventListener('click',onCopyClick)});
})(globalThis);