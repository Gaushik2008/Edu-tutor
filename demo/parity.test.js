// node demo/parity.test.js  -- checks the demo's JS engine against the Python engine's outputs.
const fs=require('fs'),path=require('path'),assert=require('assert');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
let js=html.match(/<script>([\s\S]*)<\/script>/)[1];
global.localStorage={getItem:()=>null,setItem(){}};
global.sessionStorage={getItem:()=>'1',setItem(){}};
global.document={addEventListener(){},getElementById:()=>({innerHTML:'',value:'',style:{}}),querySelectorAll:()=>[],createElement:()=>({style:{},setAttribute(){},addEventListener(){}}),body:{appendChild(){},style:{}}};
global.getComputedStyle=()=>({getPropertyValue:()=>'#888'});
js=js.replace('const App=document.addEventListener','const App0=document.addEventListener');
const E=eval(js+';({bktUpdate,srsSchedule,targetDifficulty,analyse})');
const V=JSON.parse(fs.readFileSync(path.join(__dirname,'../backend/tests/parity_vectors.json'),'utf8'));
const close=(a,b,m)=>assert(Math.abs(a-b)<1e-9,`${m}: ${a} vs ${b}`);
let n=0;
for(const x of V.bkt){const r=E.bktUpdate({p:x.p,att:x.att,cor:0,conf:0},x.ok,x.d,x.rq,x.nov);close(r.p,x.out,'bkt p');close(r.conf,x.conf,'bkt conf');n++;}
const T0=Date.UTC(2026,0,1);
for(const x of V.srs){const r=E.srsSchedule({reps:x.reps,ease:x.ease,interval:x.interval},x.q,T0,x.d,x.mo);
  assert.strictEqual(r.rev.reps,x.out_reps,'srs reps');close(r.rev.ease,x.out_ease,'srs ease');close(r.rev.interval,x.out_interval,'srs interval');close((r.due-T0)/864e5,x.out_days,'srs due');n++;}
for(const x of V.difficulty){assert.strictEqual(E.targetDifficulty(x.p,x.recent),x.out,'difficulty');n++;}
for(const x of V.misconception){const r=E.analyse(x.c,x.ok,x.t);assert.strictEqual(r.tag||null,x.tag,'tag for: '+x.t);n++;}
console.log(`JS/Python parity OK on ${n} vectors`);
