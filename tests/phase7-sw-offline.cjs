/* SW lifecycle + offline routing executed in isolated VM because this runtime blocks browser HTTP navigation. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const base='https://example.invalid/university/';
const fileFromUrl=(url)=>{const u=new URL(url,base),relative=u.pathname.slice('/university/'.length);return path.join(ROOT,relative||'index.html');};
class Cache{
 constructor(){this.map=new Map();}
 async addAll(paths){for(const x of paths){const u=new URL(x,base);assert(fs.existsSync(fileFromUrl(u.href)),`missing precache ${u}`);this.map.set(u.href,new Response('cached '+u.pathname,{status:200}));}}
 async match(req,{ignoreSearch=false}={}){let u=new URL(typeof req==='string'?req:req instanceof URL?req.href:req.url,base);if(ignoreSearch)u.search='';return this.map.get(u.href);}
 async put(req,res){this.map.set(typeof req==='string'?new URL(req,base).href:req.url,res);}
}
const all=new Map([['unrelated-app',new Cache()],['university-study-v21',new Cache()]]);
const cacheApi={async open(name){if(!all.has(name))all.set(name,new Cache());return all.get(name);},async keys(){return [...all.keys()];},async delete(name){return all.delete(name);},async match(req,opt){for(const c of all.values()){let hit=await c.match(req,opt);if(hit)return hit;}return undefined;}};
let live=true;const events={};let skipped=false,claimed=false;
const context={URL,Request,Response,globalThis:null, caches:cacheApi,fetch:async()=>{if(!live)throw Error('offline');return new Response('network',{status:200});},self:{location:{origin:'https://example.invalid'},registration:{scope:base},addEventListener(name,fn){events[name]=fn;},skipWaiting(){skipped=true;},clients:{claim(){claimed=true;}}}};
context.globalThis=context;
vm.createContext(context);
context.importScripts=(...files)=>{for(const src of files)vm.runInContext(fs.readFileSync(path.join(ROOT,src),'utf8'),context,{filename:src});};
vm.runInContext(fs.readFileSync(path.join(ROOT,'sw.js'),'utf8'),context,{filename:'sw.js'});
async function fire(event,req){let promise;let response;const e={request:req,waitUntil:p=>{promise=p;},respondWith:p=>{response=p;}};events[event](e);if(promise)await promise;return response?response:undefined;}
async function main(){let n=0;
 const check=async(name,fn)=>{await fn();console.log('PASS',name);n++;};
 await check('install precaches all source files',async()=>{await fire('install');assert(skipped);assert(all.has('university-study-v26'));let c=await cacheApi.open('university-study-v26');for(let p of ['index.html','materials/learning.html','materials/qa-information-security-privacy.html','data/flutter-mcq.js','data/flutter-learning.js','assets/voice-phase7.js','assets/pwa-phase7.js','assets/pwa-icon-512.png','assets/flutter-editorial.js','assets/flutter-editorial.css'])assert(await c.match(new URL(p,base).href),p);});
 await check('activate cleans only versioned University caches',async()=>{await fire('activate');assert(claimed);assert(!all.has('university-study-v21'));assert(all.has('unrelated-app'));});
 live=false;
 await check('offline Flutter learning with query parameters',async()=>{let r=await fire('fetch',{url:base+'materials/learning.html?id=flutter-learning',method:'GET',mode:'navigate',headers:new Headers()});assert.equal((await r).status,200);});
 await check('offline question bank',async()=>{let r=await fire('fetch',{url:base+'materials/mcq-flutter.html',method:'GET',mode:'navigate',headers:new Headers()});assert.equal((await r).status,200);});
 await check('offline data and JS/CSS available',async()=>{let r=await fire('fetch',new Request(base+'assets/flutter-reading.js'));assert.equal((await r).status,200);});
 await check('offline unknown navigation falls back to home',async()=>{let r=await fire('fetch',{url:base+'nothing.html',method:'GET',mode:'navigate',headers:new Headers()});assert.equal((await r).status,200);});
 await check('external requests are not intercepted',async()=>{let r=await fire('fetch',new Request('https://another.invalid/api'));assert.equal(r,undefined);});
 await check('non GET requests are not intercepted',async()=>{let r=await fire('fetch',new Request(base+'materials/learning.html',{method:'POST'}));assert.equal(r,undefined);});
 console.log('SW RESULT',n,'PASS');}
main().catch(e=>{console.error(e);process.exit(1);});