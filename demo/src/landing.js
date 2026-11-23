/* ===== Cinematic landing screen: generative electric-field hero, glass cards, live teacher heatmap ===== */
const ICON={
 diag:'<svg viewBox="0 0 24 24"><path d="M9 4h6l1 2h3v14H5V6h3z"/><path d="M9 13l2 2 4-4"/></svg>',
 graph:'<svg viewBox="0 0 24 24"><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7 7l4 9M17 7l-4 9M7 6h10"/></svg>',
 mis:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M11 8.5v3M11 13.5v.1"/></svg>',
 rev:'<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2"/><path d="M20 4v5h-5M4 20v-5h5"/></svg>'};
function setScreen(name){
  document.body.dataset.screen=name;
  try{if(location.hash.slice(1)!==name)history.replaceState(null,'','#'+name);}catch(e){}
  if(name==='home'){buildHome();window.scrollTo(0,0);}else stopField();
}
function goApp(r,t){role=r;tab=t;ses=null;setScreen('app');render();window.scrollTo(0,0);}
function homeHTML(){
  const rows=classRows(),heat=rows.slice(-4).map(r=>`<div><span>${esc(r.n.length>11?r.n.slice(0,10)+'…':r.n)}</span>${r.ps.map(p=>`<i style="background:${cellCol(p)};opacity:${p===null?.5:.9}"></i>`).join('')}</div>`).join('');
  return `<section class="lp-hero" id="lp-hero"><canvas id="lp-cv" aria-hidden="true"></canvas><div class="lp-shade"></div>
  <div class="lp-in"><nav class="lp-nav"><button class="lp-logo" data-lp="home"><i></i>Learnova</button>
   <div class="lp-links"><button data-lp="syllabus">Learn</button><button data-lp="graph">Concepts</button><button data-lp="teacher">Teachers</button><a href="https://github.com/Gaushik2008/Edu-tutor#35-evidence-what-was-measured" target="_blank" rel="noopener">Evidence</a></div>
   <button class="lp-pill" data-lp="dashboard">Open the app <i>→</i></button></nav></div>
  <div class="lp-in lp-body"><div class="lp-copy"><p class="lp-eye">Class 10 physics · Electricity</p>
    <h1>Know what<br>you <em>know.</em></h1>
    <p class="lp-sub">Learnova reads your reasoning, finds the misconception behind a wrong answer, and schedules the exact revision you need. Learn smarter, understand deeper, remember longer.</p>
    <div class="lp-cta"><button class="lp-btn" data-lp="diag">Start the diagnostic <i>→</i></button><button class="lp-ghost" data-lp="lesson"><span>▶</span>Watch a lesson</button></div></div>
   <aside class="lp-card" aria-label="Example of how an answer is read"><span class="tag">Example</span>
    <h3>Voltage stays constant and resistance increases. What happens to the current?</h3>
    <p class="lp-quote">“Current increases because resistance blocks the voltage.”</p>
    <div class="lp-flag"><b>Possible misconception · 85% confidence</b>Believes current rises when resistance rises</div>
    <p class="n">Next, a 10 V question at 2 Ω then 5 Ω that targets exactly this.</p>
    <button class="lp-pill" data-lp="try">Try this question <i>→</i></button></aside></div>
  <div class="lp-strip"><div class="lp-in"><div>
   <button data-lp="diag">${ICON.diag}<span>Diagnostic<small>Find your starting point</small></span></button>
   <button data-lp="graph">${ICON.graph}<span>Concept graph<small>See what depends on what</small></span></button>
   <button data-lp="learn">${ICON.mis}<span>Misconception detection<small>From your own reasoning</small></span></button>
   <button data-lp="revision">${ICON.rev}<span>Spaced revision<small>Scheduled by performance</small></span></button></div></div></div>
  <div class="lp-scroll">Scroll</div></section>
  <section class="lp-sec"><div class="lp-in"><h2>From one wrong answer to the <em>next right one.</em></h2>
   <div class="lp-steps"><div class="lp-step"><b>1</b><h3>It reads your reasoning</h3><p>You explain your answer in your own words. The system looks at the steps, not only the final number.</p></div>
    <div class="lp-step"><b>2</b><h3>It names the misconception</h3><p>A likely mix-up is recorded with a confidence score. Unsure cases go to a teacher instead of being treated as fact.</p></div>
    <div class="lp-step"><b>3</b><h3>It schedules what is next</h3><p>A question aimed at the mix-up comes first, then a revision date that adapts to how you actually perform.</p></div></div></div></section>
  <section class="lp-sec" style="padding-top:0"><div class="lp-in"><h2>Teachers see where the class is <em>stuck.</em></h2>
   <div class="lp-heat" role="img" aria-label="Class mastery heatmap preview">${heat}</div>
   <button class="lp-pill" data-lp="teacher">Open the teacher view <i>→</i></button>
   <div class="lp-stats" style="margin-top:46px"><div><b>0</b><span>false alarms across 90 labelled explanations, with the pattern rules alone</span></div>
    <div><b>50%</b><span>of unfamiliar phrasings those rules catch on their own. The rest go to a teacher or an AI model.</span></div>
    <div><b>12</b><span>concepts in Class 10 Electricity, each with an animated lesson and checkpoint questions</span></div></div></div></section>
  <footer class="lp-in lp-foot"><span>Learnova · Learn Smarter. Understand Deeper. Remember Longer.</span><span>Class and heatmap shown are sample data. <a href="https://github.com/Gaushik2008/Edu-tutor" target="_blank" rel="noopener">Source and evidence on GitHub</a></span></footer>`;
}
function buildHome(){document.getElementById('home').innerHTML=homeHTML();startField();}

/* ---- generative hero: electric field lines of a + and a − charge; the − charge follows the pointer ---- */
const FLD={raf:0,on:false,mx:null,my:null,t:0,b:{x:0,y:0},io:null};
const REDUCE=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function stopField(){FLD.on=false;cancelAnimationFrame(FLD.raf);if(FLD.io){FLD.io.disconnect();FLD.io=null;}}
function startField(){
  stopField();const cv=document.getElementById('lp-cv'),hero=document.getElementById('lp-hero');if(!cv||!hero)return;
  const c=cv.getContext('2d');let W=0,H=0,dpr=1,A,Bq;
  const fit=()=>{dpr=Math.min(2,window.devicePixelRatio||1);W=hero.clientWidth;H=hero.clientHeight;cv.width=W*dpr;cv.height=H*dpr;
    const wide=W>760;A={x:wide?W*.64:W*.8,y:wide?H*.5:H*.2};Bq={x:wide?W*.9:W*.5,y:wide?H*.18:H*.44};if(!FLD.b.x){FLD.b={x:Bq.x,y:Bq.y};}};
  fit();window.onresize=()=>{fit();if(!FLD.on)frame(0);};
  hero.onpointermove=e=>{const r=hero.getBoundingClientRect();FLD.mx=Math.max(r.width*.45,e.clientX-r.left);FLD.my=e.clientY-r.top;};
  hero.onpointerleave=()=>{FLD.mx=null;};
  const E=(x,y,p,q)=>{const dx=x-p.x,dy=y-p.y,d2=dx*dx+dy*dy+60,d=Math.pow(d2,1.5);return[q*dx/d,q*dy/d];};
  const trace=(a,b,ang)=>{const pts=[];let x=a.x+Math.cos(ang)*9,y=a.y+Math.sin(ang)*9;
    for(let i=0;i<260;i++){const e1=E(x,y,a,1),e2=E(x,y,b,-1),ex=e1[0]+e2[0],ey=e1[1]+e2[1],m=Math.hypot(ex,ey)||1;x+=ex/m*7;y+=ey/m*7;pts.push([x,y]);
      if(Math.hypot(x-b.x,y-b.y)<9||x<-20||x>W+20||y<-20||y>H+20)break;}return pts;};
  const disc=(p,s,col)=>{const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,46);g.addColorStop(0,col+'cc');g.addColorStop(1,col+'00');c.fillStyle=g;c.beginPath();c.arc(p.x,p.y,46,0,6.3);c.fill();
    c.fillStyle='#05060B';c.beginPath();c.arc(p.x,p.y,13,0,6.3);c.fill();c.strokeStyle=col;c.lineWidth=2;c.stroke();c.fillStyle='#fff';c.font='600 17px Inter,sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(s,p.x,p.y+1);};
  const frame=ts=>{FLD.t=ts/1000;const t=FLD.t,B=FLD.b;
    const tx=FLD.mx!==null?FLD.mx:Bq.x+(REDUCE?0:Math.sin(t*.5)*40),ty=FLD.my!==null?FLD.my:Bq.y+(REDUCE?0:Math.cos(t*.4)*30);
    B.x+=(tx-B.x)*.06;B.y+=(ty-B.y)*.06;
    c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);c.globalCompositeOperation='lighter';c.lineCap='round';
    const N=W>760?30:18;
    for(let i=0;i<N;i++){const ang=i/N*6.2832+.1,pts=trace(A,B,ang);if(pts.length<4)continue;
      c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(const p of pts)c.lineTo(p[0],p[1]);
      c.strokeStyle='rgba(76,134,255,.10)';c.lineWidth=6;c.stroke();c.strokeStyle='rgba(157,182,255,.40)';c.lineWidth=1.2;c.stroke();
      if(!REDUCE){const k=Math.floor(((t*38+i*23)%(pts.length+30)));if(k<pts.length){const p=pts[k];c.fillStyle='rgba(220,232,255,.95)';c.beginPath();c.arc(p[0],p[1],2.1,0,6.3);c.fill();}}}
    c.globalCompositeOperation='source-over';disc(A,'+','#FF5C6C');disc(B,'−','#4C86FF');
    if(FLD.on&&!REDUCE)FLD.raf=requestAnimationFrame(frame);};
  FLD.on=!REDUCE;
  if('IntersectionObserver' in window){FLD.io=new IntersectionObserver(es=>{const v=es[0].isIntersecting;if(v&&!FLD.on&&!REDUCE){FLD.on=true;FLD.raf=requestAnimationFrame(frame);}else if(!v){FLD.on=false;cancelAnimationFrame(FLD.raf);}});FLD.io.observe(hero);}
  FLD.raf=requestAnimationFrame(frame);if(REDUCE)frame(0);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){FLD.on=false;cancelAnimationFrame(FLD.raf);}else if(document.body.dataset.screen==='home'&&!REDUCE){startField();}});
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-lp],.brand');if(!b)return;
  if(b.classList.contains('brand')){setScreen('home');return;}
  const k=b.dataset.lp;
  if(k==='home'){window.scrollTo(0,0);return;}
  if(k==='teacher')return goApp('teacher','class');
  if(k==='lesson'){syl.open='electric_charge';resetPlayer();return goApp('student','syllabus');}
  if(k==='try'){role='student';tab='learn';startPractice('ohms_law');setScreen('app');render();window.scrollTo(0,0);return;}
  goApp('student',k);
});
window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if((h==='home'||h==='app')&&document.body.dataset.screen!==h)setScreen(h);});
function initLanding(){const h=location.hash.slice(1);setScreen(h==='app'||h==='home'?h:(S.log.length||S.roll?'app':'home'));}
