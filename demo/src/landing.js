/* ===== Landing screen: cinematic hero + live engine demos ===== */
const LAND={on:false,raf:0,ptr:null,t:0,cleanup:null};
const IC=p=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const ICONS={
 graph:IC('<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M8 7l3 9M16 7l-3 9"/>'),
 quiz:IC('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>'),
 play:IC('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>'),
 scan:IC('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4-4"/>')};
const ARROW='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const MARK='<svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><circle cx="16" cy="16" r="15" fill="#2F5CFF"/><ellipse cx="16" cy="16" rx="11" ry="4.5" fill="none" stroke="#fff" stroke-width="1.4" transform="rotate(-30 16 16)"/><circle cx="16" cy="16" r="3" fill="#fff"/><circle cx="25" cy="10.5" r="2" fill="#fff"/></svg>';

/* live examples: every number below comes from the same engine the app uses */
function landExamples(){
  let st={p:.30,att:0,cor:0,conf:0};const seq=[[false,3],[false,3],[true,3],[true,3],[true,4]],pts=[st.p];
  seq.forEach(([ok,d])=>{st=bktUpdate(st,ok,d,.85);pts.push(st.p);});
  const text='Current increases because resistance blocks the voltage.';
  const an=analyse('ohms_law',false,text.toLowerCase());
  let rv={reps:0,ease:2.3,interval:0},t=0,ladder=[];
  for(let i=0;i<5;i++){const r=srsSchedule(rv,1,0,3,false);rv=r.rev;ladder.push(Math.round(rv.interval));}
  return {pts,seq,text,an,ladder};
}
function sparkSVG(pts,w=250,h=70){
  const xy=pts.map((v,i)=>[6+i*(w-12)/(pts.length-1),h-6-v*(h-12)]);
  const d=xy.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" style="display:block;width:100%;height:auto" role="img" aria-label="Mastery after each of five answers"><path d="${d} L${xy[xy.length-1][0]} ${h-6} L6 ${h-6}Z" fill="url(#lg)" opacity=".5"/><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F5CFF" stop-opacity=".55"/><stop offset="1" stop-color="#2F5CFF" stop-opacity="0"/></linearGradient></defs><path d="${d}" fill="none" stroke="#7C9CFF" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>${xy.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.4" fill="${i&&!ex_ok(i)?'#FF5C6C':'#7C9CFF'}"/>`).join('')}</svg>`;
}
let EX_SEQ=[];const ex_ok=i=>EX_SEQ[i-1]?EX_SEQ[i-1][0]:true;

function landHTML(){
  const ex=landExamples();EX_SEQ=ex.seq;
  const nid=nextConceptId(),nc=CBY[nid],st=cs(nid),p=curP(nid),has=st.att>0;
  const stat=[[ICONS.graph,CONCEPTS.length,'Concepts mapped'],[ICONS.quiz,QS.length,'Practice questions'],[ICONS.play,Object.keys(LESSONS).length,'Video lessons'],[ICONS.scan,RULES_DATA.length,'Misconception patterns']];
  const mis=ex.an.tag?MIS[ex.an.tag]:null;
  return `<canvas id="lcv" aria-hidden="true"></canvas>
  <div class="l-first">
   <nav class="l-nav" aria-label="Main"><button class="l-logo" data-l="top" aria-label="Learnova home">${MARK}<span>Learnova</span></button>
    <div class="l-links"><button data-l="student">Student</button><button data-l="teacher">Teacher</button><button data-l="lessons">Lessons</button><button data-l="how">How it works</button></div>
    <button class="l-pill sm" data-l="start">Start learning ${ARROW}</button></nav>
   <section class="l-hero">
    <p class="l-eye rv" style="--d:.05s"><i></i>Class 10 Physics <b>/</b> Electricity</p>
    <h1><span class="rv" style="--d:.15s">Learn <em>Smarter.</em></span><span class="rv" style="--d:.28s">Understand Deeper.</span><span class="rv" style="--d:.41s">Remember <em>Longer.</em></span></h1>
    <p class="l-sub rv" style="--d:.55s">An exam-prep tutor that models what you actually understand, reads your reasoning to catch misconceptions, and brings each concept back just before you forget it.</p>
    <div class="l-cta rv" style="--d:.68s"><button class="l-pill" data-l="start">Start learning <span class="ar">${ARROW}</span></button><button class="l-ghost" data-l="watch"><span class="pl" aria-hidden="true">▶</span> Watch the lesson</button></div>
   </section>
   <aside class="l-card glass" aria-label="Continue learning"><p class="l-k">${has?'Continue where you left off':'Your first concept'}</p><h3>${esc(nc.n)}</h3>
    <div class="bar2"><i style="width:${has?Math.round(p*100):0}%"></i></div><p class="l-m">${has?Math.round(p*100)+'% mastery · '+st.cor+'/'+st.att+' correct':'Not assessed yet · level '+nc.d+' of 5'}</p>
    <button class="l-pill sm full" data-l="practise" data-id="${nid}">Practise ${ARROW}</button></aside>
   <div class="l-strip glass" role="list">${stat.map(([i,n,l])=>`<div role="listitem"><span class="ic">${i}</span><b>${n}</b><small>${l}</small></div>`).join('')}</div>
  </div>
  <section class="l-how" id="l-how"><p class="l-eye"><i></i>Under the hood</p>
   <h2>Built to <em>understand</em> you, not just score you.</h2>
   <p class="l-sub2">The three cards below are computed live by the same engine that runs the app, using example inputs. Nothing here is a screenshot.</p>
   <div class="l-cards">
    <article class="glass"><p class="l-k">Mastery model</p><div class="big">${Math.round(ex.pts[ex.pts.length-1]*100)}<small>%</small></div>${sparkSVG(ex.pts)}
     <p class="l-m">Five example answers: two misses, then three correct. Mastery climbs as evidence builds, and a single miss never zeroes it.</p></article>
    <article class="glass"><p class="l-k">Misconception detection</p><blockquote>“${esc(ex.text)}”</blockquote>
     <div class="chipl">${mis?`<b>${esc(mis.label)}</b><span>${Math.round(ex.an.conf*100)}% confidence · a prediction, reviewed by a teacher when unsure</span>`:'<b>No pattern matched</b>'}</div>
     <p class="l-m">${mis?esc(mis.fix):''}</p></article>
    <article class="glass"><p class="l-k">Spaced revision</p><div class="big">${ex.ladder[ex.ladder.length-1]}<small> days</small></div>
     <ol class="ladder">${ex.ladder.map((d,i)=>`<li><i style="height:${14+Math.min(80,d*2.4)}px"></i><b>${d}d</b><small>review ${i+1}</small></li>`).join('')}</ol>
     <p class="l-m">If every review goes well, gaps between reviews stretch. A miss or an open misconception pulls the next review closer.</p></article>
   </div>
   <div class="l-end"><button class="l-pill" data-l="student">Open the student view <span class="ar">${ARROW}</span></button><button class="l-ghost" data-l="teacher">Open the teacher view</button></div>
   <p class="l-foot">Demo data stays in your browser. The class heatmap is sample data; only your own roll number is live.</p>
  </section>`;
}

/* ---------- electric-field background ---------- */
function landField(cv,still){
  const ctx=cv.getContext('2d'),dpr=Math.min(1.5,window.devicePixelRatio||1);let W=0,H=0,ps=[];const L=16;
  const fit=()=>{W=cv.clientWidth;H=cv.clientHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);};
  fit();const N=W<700?320:820;
  const src=t=>{const m=W<700;return [
    {x:W*(m?.5:.68)+Math.sin(t*.22)*W*.05,y:H*(m?.3:.40)+Math.cos(t*.3)*H*.06,q:1},
    {x:W*(m?.8:.88)+Math.cos(t*.19)*W*.03,y:H*(m?.55:.62)+Math.sin(t*.26)*H*.07,q:-1},
    {x:W*(m?.25:.5)+Math.cos(t*.17)*W*.04,y:H*(m?.7:.74)+Math.sin(t*.21)*H*.05,q:-.8}]
    .concat(LAND.ptr?[{x:LAND.ptr.x,y:LAND.ptr.y,q:-1.5}]:[]);};
  const spawn=(q,c)=>{const pos=c.filter(s=>s.q>0)[0]||c[0],a=Math.random()*6.283,r=14+Math.random()*10;
    q.x=new Float32Array(L).fill(pos.x+Math.cos(a)*r);q.y=new Float32Array(L).fill(pos.y+Math.sin(a)*r);q.age=Math.random()*40|0;q.life=420+Math.random()*460|0;};
  const c0=src(0);for(let i=0;i<N;i++){const q={};spawn(q,c0);q.age=Math.random()*q.life|0;ps.push(q);}
  const step=(dt,c)=>{for(const q of ps){let ex=0,ey=0,dead=false;const px=q.x[L-1],py=q.y[L-1];
    for(const s of c){const dx=px-s.x,dy=py-s.y,r2=dx*dx+dy*dy+60,r=Math.sqrt(r2),k=s.q*1400/(r2*r);ex+=dx*k;ey+=dy*k;if(s.q<0&&r<14)dead=true;}
    const m=Math.hypot(ex,ey)||1,sp=105+Math.min(120,m*1200);q.x.copyWithin(0,1);q.y.copyWithin(0,1);q.x[L-1]=px+ex/m*sp*dt;q.y[L-1]=py+ey/m*sp*dt;q.age++;
    if(dead||q.age>q.life||q.x[L-1]<-30||q.x[L-1]>W+30||q.y[L-1]<-30||q.y[L-1]>H+30)spawn(q,c);}};
  const draw=c=>{ctx.clearRect(0,0,W,H);
    for(const pass of [[0,.16],[L-6,.5]]){ctx.beginPath();for(const q of ps){const f=Math.min(1,q.age/30,(q.life-q.age)/40);if(f<=0)continue;ctx.moveTo(q.x[pass[0]],q.y[pass[0]]);for(let i=pass[0]+1;i<L;i++)ctx.lineTo(q.x[i],q.y[i]);}
      ctx.strokeStyle=`rgba(150,185,255,${pass[1]})`;ctx.lineWidth=1;ctx.stroke();}
    for(const s of c.slice(0,3)){const neg=s.q<0,col=neg?'47,92,255':'200,220,255',g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,58);g.addColorStop(0,`rgba(${col},1)`);g.addColorStop(.3,`rgba(${col},.4)`);g.addColorStop(1,`rgba(${col},0)`);
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.x,s.y,58,0,6.283);ctx.fill();ctx.fillStyle=neg?'#fff':'#05060B';ctx.font='700 14px Inter,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(neg?'−':'+',s.x,s.y+1);}};
  if(still){for(let i=0;i<150;i++)step(.016,src(0));draw(src(0));return ()=>{};}
  let last=0;const loop=ts=>{if(!LAND.on)return;const dt=Math.min(.05,(ts-(last||ts))/1000);last=ts;LAND.t+=dt;
    if(!document.hidden){const c=src(LAND.t);step(dt,c);draw(c);}LAND.raf=requestAnimationFrame(loop);};
  const onR=()=>{fit();};addEventListener('resize',onR);LAND.raf=requestAnimationFrame(loop);
  return ()=>{cancelAnimationFrame(LAND.raf);removeEventListener('resize',onR);};
}

function showLanding(){
  const el=document.getElementById('land');LAND.on=true;LAND.ptr=null;if(LAND.cleanup)LAND.cleanup();
  el.innerHTML=landHTML();el.style.display='block';el.scrollTop=0;document.body.style.overflow='hidden';
  const still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  LAND.cleanup=landField(document.getElementById('lcv'),still);
  const first=el.querySelector('.l-first');
  first.onpointermove=e=>{const r=document.getElementById('lcv').getBoundingClientRect();LAND.ptr={x:e.clientX-r.left,y:e.clientY-r.top};};
  first.onpointerleave=()=>{LAND.ptr=null;};
}
function hideLanding(){
  LAND.on=false;if(LAND.cleanup){LAND.cleanup();LAND.cleanup=null;}
  const el=document.getElementById('land');el.style.display='none';document.body.style.overflow='';
  try{sessionStorage.setItem('learnova-landing','1');}catch(e){}window.scrollTo(0,0);
}
function landGo(a,id){
  const el=document.getElementById('land');
  if(a==='top'){el.scrollTo({top:0,behavior:'smooth'});return;}
  if(a==='how'){document.getElementById('l-how').scrollIntoView({behavior:'smooth'});return;}
  hideLanding();ses=null;
  if(a==='student'){role='student';tab='dashboard';}
  else if(a==='teacher'){role='teacher';tab='class';}
  else if(a==='lessons'){role='student';tab='syllabus';syl.open=null;}
  else if(a==='start'){role='student';tab=S.diagDone?'dashboard':'diag';}
  else if(a==='watch'){role='student';tab='syllabus';syl.open='electric_charge';resetPlayer();}
  else if(a==='practise'){role='student';tab='learn';startPractice(id);}
  render();
}
(function(){
  const el=document.createElement('div');el.id='land';el.setAttribute('role','region');el.setAttribute('aria-label','Learnova introduction');el.style.display='none';document.body.appendChild(el);
  el.addEventListener('click',e=>{const b=e.target.closest('[data-l]');if(b)landGo(b.dataset.l,b.dataset.id);});
  document.addEventListener('click',e=>{if(e.target.closest('[data-home]'))showLanding();});
  let seen=false;try{seen=sessionStorage.getItem('learnova-landing')==='1';}catch(e){}
  if(!seen)showLanding();
})();
