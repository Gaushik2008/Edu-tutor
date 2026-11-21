/* ===== Syllabus tab + Electric Charge video lesson (animated, in-page) ===== */
S.lessons=S.lessons||{};
const syl={open:null,filter:'all'};
const ease=u=>u<=0?0:u>=1?1:u*u*(3-2*u), seg=(u,a,b)=>ease((u-a)/(b-a)), lerp=(a,b,t)=>a+(b-a)*t;
const th=()=>{const s=getComputedStyle(document.documentElement),g=n=>s.getPropertyValue(n).trim();
  return {card:g('--card'),fg:g('--fg'),muted:g('--muted'),pos:g('--bad'),neg:g('--blue'),acc:g('--acc'),pri:g('--pri'),line:g('--line'),warn:g('--warn'),grey:g('--grey'),t:0};};
const TX=(c,s,x,y,sz,col,al,w)=>{c.fillStyle=col;c.font=`${w||600} ${sz}px Inter,system-ui,sans-serif`;c.textAlign=al||'center';c.textBaseline='middle';c.fillText(s,x,y);};
const DOT=(c,x,y,r,fill,lab,lc)=>{c.beginPath();c.arc(x,y,r,0,6.2832);c.fillStyle=fill;c.fill();if(lab)TX(c,lab,x,y+1,r*1.35,lc||'#fff','center',700);};
const ARR=(c,x1,y1,x2,y2,col,wd)=>{c.strokeStyle=col;c.fillStyle=col;c.lineWidth=wd||3;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();const a=Math.atan2(y2-y1,x2-x1);c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-10*Math.cos(a-.4),y2-10*Math.sin(a-.4));c.lineTo(x2-10*Math.cos(a+.4),y2-10*Math.sin(a+.4));c.closePath();c.fill();};
const FADE=(c,a)=>{c.globalAlpha=Math.max(0,Math.min(1,a));};

const SCENES=[
{t:'A balloon sticks to the wall',d:14,n:['Rub a balloon on a woollen sweater and it can stick to a wall.','The rubbing moves tiny charged particles, electrons, from the sweater onto the balloon.','The balloon is now charged, and a charged object pulls on neutral things nearby.'],
 draw(c,u,k){
  const s=seg(u,0,.4),m=seg(u,.45,.8);
  c.fillStyle=k.line;c.fillRect(540,50,100,270);TX(c,'Wall',590,70,13,k.muted);
  FADE(c,.4);c.fillStyle=k.warn;c.fillRect(30,200,130,110);FADE(c,1);TX(c,'Wool sweater',95,255,13,k.fg);
  const bx=lerp(95,480,m),by=lerp(150,175,m)+(u<.42?Math.sin(u*70)*6:0);
  DOT(c,bx,by,40,k.grey);FADE(c,s*.85);DOT(c,bx,by,40,k.neg);FADE(c,1);
  if(u<.45)for(let i=0;i<5;i++){const p=(u*5+i*.2)%1;DOT(c,lerp(55+i*22,bx-20+i*10,p),lerp(205,by+20,p),7,k.neg,'−');}
  FADE(c,seg(u,.6,.8));for(let i=0;i<4;i++)TX(c,'+',548,100+i*55,20,k.pos);FADE(c,1);
  if(m>.95){ARR(c,bx+46,by,bx+72,by,k.pri);}
  TX(c,u<.45?'Electrons move from sweater to balloon':u<.8?'The balloon is now negatively charged':'It attracts the wall and sticks',320,335,14,k.fg);
 }},
{t:'Atoms carry charge',d:16,n:['Everything is made of atoms. Each atom has a nucleus with protons and neutrons.','Protons carry positive charge, electrons carry negative charge, and neutrons carry none.','A normal atom has as many electrons as protons, so it is neutral overall.'],
 draw(c,u,k){
  const cx=320,cy=175;
  c.strokeStyle=k.line;c.lineWidth=2;c.beginPath();c.arc(cx,cy,95,0,6.2832);c.stroke();
  [[-10,-8,'p'],[10,-8,'n'],[-12,12,'n'],[12,12,'p'],[0,0,'p']].forEach(([x,y,t])=>DOT(c,cx+x,cy+y,13,t==='p'?k.pos:k.grey,t==='p'?'+':''));
  for(let i=0;i<5;i++){const a=k.t*1.3+i*1.2566;DOT(c,cx+95*Math.cos(a),cy+95*Math.sin(a),9,k.neg,'−');}
  FADE(c,seg(u,.15,.3));TX(c,'Proton: positive (+)',cx-165,cy-25,14,k.pos,'right');ARR(c,cx-160,cy-25,cx-28,cy-8,k.pos,2);
  FADE(c,seg(u,.35,.5));TX(c,'Electron: negative (−)',cx+215,cy-90,14,k.neg,'left');
  FADE(c,seg(u,.55,.7));TX(c,'Neutron: no charge',cx-165,cy+50,14,k.muted,'right');ARR(c,cx-160,cy+50,cx-30,cy+16,k.muted,2);
  FADE(c,seg(u,.8,.95));TX(c,'Equal protons and electrons: the atom is neutral',320,335,15,k.fg);FADE(c,1);
 }},
{t:'Like repel, unlike attract',d:16,n:['There are two kinds of charge, positive and negative.','Two charges of the same kind push each other apart.','Two charges of opposite kinds pull toward each other.'],
 draw(c,u,k){
  const a=seg(u,.04,.45),b=seg(u,.55,.95),y=170;
  let lx,rx,rs,rc;
  if(u<.5){lx=lerp(260,170,a);rx=lerp(380,470,a);rs='+';rc=k.pos;}else{lx=lerp(170,285,b);rx=lerp(470,355,b);rs='−';rc=k.neg;}
  DOT(c,lx,y,26,k.pos,'+');DOT(c,rx,y,26,rc,rs);
  if(u<.5){FADE(c,seg(u,0,.1));ARR(c,lx-32,y,lx-90,y,k.pri);ARR(c,rx+32,y,rx+90,y,k.pri);FADE(c,1);TX(c,'Like charges repel',320,300,18,k.fg);}
  else{FADE(c,seg(u,.5,.6));ARR(c,lx+32,y,lx+80,y,k.pri);ARR(c,rx-32,y,rx-80,y,k.pri);FADE(c,1);TX(c,'Unlike charges attract',320,300,18,k.fg);}
 }},
{t:'Charge moves, it is not made',d:14,n:['When you rub a glass rod with silk, electrons move from the glass to the silk.','The glass has lost electrons, so it ends up positive. The silk has gained them, so it is negative.','The total charge is the same before and after. Charge is transferred, never created or destroyed.'],
 draw(c,u,k){
  const prog=seg(u,.2,.7),moved=Math.min(3,Math.floor(prog*3.999)),gE=6-moved,sE=6+moved;
  const blk=(x,name,e)=>{c.strokeStyle=k.line;c.lineWidth=2;c.strokeRect(x,110,230,110);TX(c,name,x+115,98,14,k.fg);
    for(let i=0;i<6;i++)DOT(c,x+25+i*36,145,11,k.pos,'+');for(let i=0;i<e;i++)DOT(c,x+22+i*24,192,10,k.neg,'−');};
  blk(50,'Glass rod',gE);blk(360,'Silk cloth',sE);
  if(prog>0&&prog<1){const p=(prog*3)%1;DOT(c,lerp(250,400,p),lerp(192,130,Math.sin(p*3.14)),10,k.neg,'−');}
  TX(c,`Glass: net +${moved}`,165,245,15,k.pos);TX(c,`Silk: net −${moved}`,475,245,15,k.neg);
  FADE(c,seg(u,.75,.9));TX(c,'Total charge: 0 before, 0 after. Charge is conserved.',320,315,16,k.fg);FADE(c,1);
 }},
{t:'Measuring charge: the coulomb',d:18,n:['Charge is measured in coulombs, written C.','The charge on one electron is about 1.6 times ten to the minus nineteen coulomb, a very tiny amount.','So one coulomb is the charge of roughly six point two five times ten to the eighteen electrons.','To find the charge on n electrons, multiply n by e. For 500 electrons that gives 8 times ten to the minus seventeen coulomb.'],
 draw(c,u,k){
  const L=[['Q = n × e',.08],['e = 1.6 × 10⁻¹⁹ C',.28],['1 C ≈ 6.25 × 10¹⁸ electrons',.5],['Example: n = 500  →  Q = 500 × 1.6×10⁻¹⁹ = 8 × 10⁻¹⁷ C',.72]];
  L.forEach(([s,a],i)=>{FADE(c,seg(u,a,a+.1));TX(c,s,40,70+i*62,i===0?30:i===3?15:21,i===0?k.pri:k.fg,'left',i===0?700:600);});FADE(c,1);
  const n=Math.floor(seg(u,.1,.9)*40);for(let i=0;i<n;i++)DOT(c,490+(i%8)*18,250+Math.floor(i/8)*18,6,k.neg);
  TX(c,'n electrons',535,330,12,k.muted);
 }},
{t:'Conductors and insulators',d:14,n:['In a metal like copper, some electrons are free to wander, so charge can flow. That makes it a conductor.','In plastic or rubber, electrons stay bound to their atoms, so charge cannot flow easily. That makes it an insulator.'],
 draw(c,u,k){
  c.strokeStyle=k.line;c.lineWidth=2;c.strokeRect(30,110,270,120);c.strokeRect(340,110,270,120);
  TX(c,'Copper (conductor)',165,95,14,k.fg);TX(c,'Plastic (insulator)',475,95,14,k.fg);
  for(let i=0;i<8;i++){const x=45+((k.t*28+i*34)%240),y=135+((i*37)%70)+Math.sin(k.t*3+i)*6;DOT(c,x,y,8,k.neg,'−');}
  for(let i=0;i<8;i++)DOT(c,370+(i%4)*60+Math.sin(k.t*5+i)*2,140+Math.floor(i/4)*60+Math.cos(k.t*4+i)*2,8,k.neg,'−');
  FADE(c,seg(u,.3,.5));TX(c,'Free electrons drift: charge flows',165,265,13,k.fg);FADE(c,seg(u,.6,.8));TX(c,'Electrons stay put: no flow',475,265,13,k.fg);FADE(c,1);
 }},
{t:'From charge to current',d:12,n:['When charge flows past a point, we call it electric current.','If 12 coulombs pass in 4 seconds, the current is Q divided by t, which is 3 amperes.','That idea is the next concept: Electric Current.'],
 draw(c,u,k){
  c.fillStyle=k.line;c.fillRect(30,150,580,40);c.strokeStyle=k.pri;c.setLineDash([6,5]);c.lineWidth=2;c.beginPath();c.moveTo(320,120);c.lineTo(320,220);c.stroke();c.setLineDash([]);
  TX(c,'cross-section',320,108,12,k.muted);
  for(let i=0;i<10;i++)DOT(c,30+((k.t*70+i*58)%580),170,9,k.neg,'−');
  const q=Math.floor(u*12),tt=(u*4).toFixed(1);
  TX(c,`Charge passed Q = ${q} C   in   t = ${tt} s`,320,260,17,k.fg);
  FADE(c,seg(u,.85,1));TX(c,'I = Q / t = 12 C / 4 s = 3 A',320,305,20,k.pri,'center',700);FADE(c,1);
 }},
{t:'Recap',d:12,n:['Matter carries charge: protons are positive and electrons are negative.','Like charges repel and unlike charges attract. Rubbing moves electrons, and total charge is conserved.','Charge is measured in coulombs, and moving charge is current.'],
 draw(c,u,k){
  ['Protons (+) and electrons (−) carry charge','Like charges repel, unlike charges attract','Rubbing transfers electrons; total charge is conserved','Unit: coulomb (C).  Q = n e,  e = 1.6 × 10⁻¹⁹ C','Moving charge is current:  I = Q / t'].forEach((s,i)=>{FADE(c,seg(u,i*.17,i*.17+.15));DOT(c,50,70+i*56,8,k.acc);TX(c,s,72,70+i*56,17,k.fg,'left');});FADE(c,1);
 }},
];
const CHECK={2:38,3:39,4:2};
const P={i:0,t:0,playing:false,speed:1,cap:true,voice:false,raf:0,last:0,clock:0,check:null,checks:{},shown:-1};
const totalDur=()=>SCENES.reduce((a,s)=>a+s.d,0), startOf=i=>SCENES.slice(0,i).reduce((a,s)=>a+s.d,0);
const mmss=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function resetPlayer(){try{speechSynthesis.cancel();}catch(e){}Object.assign(P,{i:0,t:0,playing:false,check:null,checks:{},shown:-1,last:0});}

function calHTML(){
  const n=new Date(now()),y=n.getFullYear(),m=n.getMonth(),first=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate();
  const due=new Set(dueList().map(x=>{const d=new Date(x.due);return d.getFullYear()===y&&d.getMonth()===m?d.getDate():-1;}));
  let cells=['S','M','T','W','T','F','S'].map(d=>`<span class="muted" style="font-size:11px">${d}</span>`).join('');
  for(let i=0;i<first;i++)cells+='<span></span>';
  for(let d=1;d<=dim;d++)cells+=`<span class="cal ${d===n.getDate()?'today':''} ${due.has(d)?'due':''}">${d}</span>`;
  const nx=dueList().slice(0,3);
  return `<div class="card"><h3>${n.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h3><div class="calg">${cells}</div><p class="muted" style="font-size:12px;margin:8px 0 0">Filled days have a revision due.</p></div>
  <div class="card" style="margin-top:14px"><h3>Up next</h3>${nx.length?`<ul class="plain">${nx.map(x=>`<li>${esc(x.c.n)} <span class="muted">· ${fmtDay(x.due)}</span></li>`).join('')}</ul>`:'<p class="muted">Answer a few questions and revisions will appear here.</p>'}</div>`;
}
function vSyll(){
  if(syl.open==='electric_charge') return vLesson();
  if(syl.open){const c=CBY[syl.open];return `<p><button class="btn ghost" data-back>← Syllabus</button></p>${conceptPanel(syl.open)}<p class="muted">A video lesson for this concept is not available yet. Practice and notes are.</p>`;}
  const tints=['--pri','--acc','--sec'];
  const cards=CONCEPTS.filter(c=>{const b=bandOf(curP(c.id),cs(c.id).att);return syl.filter==='all'||(syl.filter==='video'&&c.id==='electric_charge')||(syl.filter==='weak'&&b==='weak')||(syl.filter==='new'&&b==='not_assessed');}).map((c,i)=>{
    const st=cs(c.id),p=curP(c.id),vid=c.id==='electric_charge',done=S.lessons[c.id]&&S.lessons[c.id].done;
    return `<div class="course" style="background:linear-gradient(135deg,color-mix(in srgb,var(${tints[i%3]}) 16%,var(--card)),var(--card))">
      <div style="min-width:0;flex:1"><h3>${esc(c.n)}</h3><p class="muted" style="margin:0 0 8px;font-size:12px">${esc(c.desc.split('. ')[0])}.</p>
      <div class="bar2"><i style="width:${st.att?Math.round(p*100):0}%"></i></div>
      <p style="margin:6px 0 0;font-size:12px"><b>${vid?'Video lesson · 2 min'+(done?' · watched':''):'Notes + practice'}</b> <span class="muted">· ${st.att?Math.round(p*100)+'% mastery':'not assessed'} · level ${c.d}/5</span></p></div>
      <button class="go" data-syl="${c.id}" aria-label="Open ${esc(c.n)}">→</button></div>`;}).join('');
  const chips=[['all','All'],['video','Video lessons'],['weak','Weak'],['new','Not started']].map(([k,l])=>`<button class="chip ${syl.filter===k?'on':''}" data-fil="${k}">${l}</button>`).join('');
  return `<h2>Syllabus · Class 10 Physics, Electricity</h2><div class="row" style="margin-bottom:12px"><span class="muted">Filter by</span>${chips}</div>
   <div class="sylgrid"><div style="display:grid;gap:12px;min-width:0">${cards||'<p class="muted">No concepts match this filter.</p>'}</div><div>${calHTML()}</div></div>`;
}
function vLesson(){
  const done=S.lessons.electric_charge&&S.lessons.electric_charge.done;
  return `<div id="lv"><p><button class="btn ghost" data-back>← Syllabus</button></p>
  <h2 style="margin-top:6px">Electric Charge · video lesson</h2>
  <p class="muted">${SCENES.length} scenes · about ${Math.round(totalDur()/60)} minutes · 3 checkpoints that feed your mastery${done?' · you have watched this':''}</p>
  <div class="grid lvgrid"><div class="card" style="padding:12px;min-width:0">
   <canvas id="cv" style="width:100%;display:block;border-radius:12px;background:var(--card)" aria-label="Lesson animation"></canvas>
   <div id="cap" class="capbar" aria-live="polite"></div><div id="ck"></div>
   <input type="range" id="scr" min="0" max="${totalDur()*10}" value="0" style="width:100%" aria-label="Seek">
   <div class="row" style="margin-top:8px"><button class="btn" id="pp">Play</button><button class="btn ghost" id="rs">Restart</button>
    <select id="spd" aria-label="Speed"><option value="0.75">0.75×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option></select>
    <label class="chk"><input type="checkbox" id="cc" checked> Captions</label><label class="chk"><input type="checkbox" id="vc"> Voice</label>
    <span id="tm" class="muted" style="margin-left:auto">0:00</span></div></div>
   <div class="card"><h3>Scenes</h3><div id="sl"></div></div></div>
  <h2>Try it: charge lab</h2><div class="card"><canvas id="lab" style="width:100%;display:block;background:var(--card);border-radius:12px"></canvas>
   <div class="row" style="margin-top:8px"><button class="btn ghost" id="s1"></button><button class="btn ghost" id="s2"></button>
   <label class="chk">Size A <input type="range" id="qa" min="1" max="3" value="2"></label><label class="chk">Size B <input type="range" id="qb" min="1" max="3" value="2"></label>
   <label class="chk">Distance <input type="range" id="dd" min="1" max="10" value="4"></label></div><p id="labtxt" style="margin:8px 0 0"></p>
   <p class="muted" style="font-size:12px;margin:4px 0 0">The distance rule (force falls to a quarter when the distance doubles) is Coulomb’s law, a step beyond the Class 10 syllabus.</p></div>
  <h2>Sources</h2><div class="card"><p style="margin:0">Aligned to the Electricity chapter of NCERT Class 10 Science (Chapter 11 in the current edition, Chapter 12 in earlier ones). Narration and diagrams here are original and paraphrased, not copied. For the full treatment read the chapter itself, or see worked solutions such as <a href="https://school.careers360.com/ncert/ncert-solutions-class-10-science-chapter-12-electricity" target="_blank" rel="noopener">Careers360</a> and <a href="https://vedantu.com/ncert-solutions/ncert-solutions-class-10-science-chapter-12-electricity" target="_blank" rel="noopener">Vedantu</a>.</p></div></div>`;
}
function initPlayer(){
  cancelAnimationFrame(P.raf);const cv=document.getElementById('cv');if(!cv)return;
  const W=640,H=360,dpr=window.devicePixelRatio||1,ctx=cv.getContext('2d'),$=id=>document.getElementById(id);
  const fit=()=>{const w=cv.clientWidth||640;cv.width=Math.round(w*dpr);cv.height=Math.round(w*dpr*9/16);cv.style.height=(w*9/16)+'px';};
  fit();window.onresize=fit;
  const speak=()=>{if(!P.voice||!window.speechSynthesis)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(SCENES[P.i].n.join(' '));u.rate=P.speed;speechSynthesis.speak(u);}catch(e){}};
  const list=()=>{$('sl').innerHTML=SCENES.map((s,i)=>`<button class="scn ${i===P.i?'on':''}" data-scene="${i}"><span>${i+1}. ${esc(s.t)}</span><span class="muted">${mmss(startOf(i))}${CHECK[i]!==undefined?(P.checks[i]?' ✓':' ?'):''}</span></button>`).join('');};
  const seekTo=sec=>{sec=Math.max(0,Math.min(totalDur()-.01,sec));let i=0;while(i<SCENES.length-1&&sec>=startOf(i+1))i++;P.i=i;P.t=sec-startOf(i);P.check=null;$('ck').innerHTML='';P.shown=-1;speak();};
  const next=()=>{if(P.i<SCENES.length-1){P.i++;P.t=0;speak();}else{P.playing=false;try{speechSynthesis.cancel();}catch(e){}S.lessons.electric_charge={done:true,t:now()};save();
    $('ck').innerHTML=`<div class="fb"><b>Lesson complete.</b> Your checkpoint answers are already counted in your mastery of Electric Charge.<div class="row" style="margin-top:8px"><button class="btn" data-learn="electric_charge">Practise this concept</button><button class="btn ghost" id="rp">Watch again</button></div></div>`;$('rp').onclick=()=>{seekTo(0);P.checks={};P.playing=true;};}};
  const openCheck=i=>{P.check=i;P.playing=false;try{speechSynthesis.cancel();}catch(e){}
    const q=QS.find(x=>x.id===CHECK[i]);let ch=null;
    const inp=q.t==='mcq'?q.o.map((o,j)=>`<button class="opt" data-copt="${j}">${esc(o)}</button>`).join(''):`<input type="text" id="cans" inputmode="decimal" placeholder="Your answer">`;
    $('ck').innerHTML=`<div class="fb" style="border-color:var(--pri)"><b>Checkpoint</b><p style="margin:4px 0">${esc(q.q)}</p>${inp}<p><button class="btn" id="cks">Submit</button> <span id="cerr" style="color:var(--bad)"></span></p><div id="cfb"></div></div>`;
    $('ck').onclick=e=>{const b=e.target.closest('[data-copt]');if(b){ch=b.dataset.copt;$('ck').querySelectorAll('.opt').forEach(x=>x.classList.toggle('sel',x===b));}};
    $('cks').onclick=()=>{const v=q.t==='mcq'?ch:$('cans').value;if(v===null||String(v).trim()===''){$('cerr').textContent='Choose or type an answer first.';return;}
      const r=evaluate(q,v,'');r.reasoning='';const before=curP(q.c),res=applyResult(q,r,15);P.checks[i]=true;list();
      $('cfb').innerHTML=`<div class="fb ${r.ok?'':'bad'}"><b>${r.ok?'Right.':'Not quite.'}</b> ${esc(q.ex)} <span class="muted">Mastery ${Math.round(before*100)}% → ${Math.round(curP(q.c)*100)}%.</span><p><button class="btn" id="cnt">Continue</button></p></div>`;
      $('cks').disabled=true;$('cnt').onclick=()=>{P.check=null;$('ck').innerHTML='';next();P.playing=true;};};};
  const draw=()=>{const k=Object.assign(th(),{t:P.clock}),sc=cv.width/W,s=SCENES[P.i];ctx.setTransform(sc,0,0,sc,0,0);ctx.globalAlpha=1;ctx.fillStyle=k.card;ctx.fillRect(0,0,W,H);
    try{s.draw(ctx,Math.min(1,P.t/s.d),k);}catch(e){}ctx.globalAlpha=1;TX(ctx,s.t,16,20,13,k.muted,'left',600);};
  const tick=ts=>{if(!$('cv')){try{speechSynthesis.cancel();}catch(e){}return;}
    const dt=Math.min(.1,(ts-(P.last||ts))/1000);P.last=ts;P.clock+=dt;
    if(P.playing&&!P.check){P.t+=dt*P.speed;const s=SCENES[P.i];if(P.t>=s.d){P.t=s.d;if(CHECK[P.i]!==undefined&&!P.checks[P.i])openCheck(P.i);else next();}}
    draw();const tot=startOf(P.i)+P.t;$('scr').value=Math.round(tot*10);$('tm').textContent=`${mmss(tot)} / ${mmss(totalDur())}`;$('pp').textContent=P.playing?'Pause':(tot>=totalDur()-.1?'Replay':'Play');
    const s=SCENES[P.i],n=s.n.length;$('cap').textContent=P.cap?s.n[Math.min(n-1,Math.floor(P.t/s.d*n))]:'';
    if(P.shown!==P.i){P.shown=P.i;list();}P.raf=requestAnimationFrame(tick);};
  $('pp').onclick=()=>{if(P.check)return;if(!P.playing&&startOf(P.i)+P.t>=totalDur()-.1){seekTo(0);P.checks={};}P.playing=!P.playing;if(P.playing)speak();else try{speechSynthesis.cancel();}catch(e){}};
  $('rs').onclick=()=>{seekTo(0);P.checks={};P.playing=false;list();};
  $('spd').onchange=e=>{P.speed=+e.target.value;};$('cc').onchange=e=>{P.cap=e.target.checked;};$('vc').onchange=e=>{P.voice=e.target.checked;if(P.voice&&P.playing)speak();else try{speechSynthesis.cancel();}catch(x){}};
  $('scr').oninput=e=>seekTo(+e.target.value/10);
  $('sl').onclick=e=>{const b=e.target.closest('[data-scene]');if(b){seekTo(startOf(+b.dataset.scene));list();}};
  $('spd').value=String(P.speed);$('cc').checked=P.cap;$('vc').checked=P.voice;
  list();P.last=0;P.raf=requestAnimationFrame(tick);initLab();
}
function initLab(){
  const cv=document.getElementById('lab');if(!cv)return;const $=id=>document.getElementById(id),L={s1:1,s2:-1};
  const W=640,H=200,dpr=window.devicePixelRatio||1,w=cv.clientWidth||640;cv.width=Math.round(w*dpr);cv.height=Math.round(w*dpr*H/W);cv.style.height=(w*H/W)+'px';const c=cv.getContext('2d');
  const run=()=>{const k=th(),a=+$('qa').value,b=+$('qb').value,d=+$('dd').value,same=L.s1===L.s2,F=a*b/(d*d);
    c.setTransform(cv.width/W,0,0,cv.width/W,0,0);c.globalAlpha=1;c.fillStyle=k.card;c.fillRect(0,0,W,H);
    const x1=320-d*28,x2=320+d*28,len=14+Math.min(80,Math.sqrt(F)*30);
    DOT(c,x1,100,10+a*5,L.s1>0?k.pos:k.neg,L.s1>0?'+':'−');DOT(c,x2,100,10+b*5,L.s2>0?k.pos:k.neg,L.s2>0?'+':'−');
    if(same){ARR(c,x1-(14+a*5),100,x1-(14+a*5)-len,100,k.pri);ARR(c,x2+(14+b*5),100,x2+(14+b*5)+len,100,k.pri);}
    else{ARR(c,x1+(14+a*5),100,x1+(14+a*5)+len,100,k.pri);ARR(c,x2-(14+b*5),100,x2-(14+b*5)-len,100,k.pri);}
    TX(c,`distance ${d}`,320,175,12,k.muted);
    $('s1').textContent=`Charge A: ${L.s1>0?'positive (+)':'negative (−)'}`;$('s2').textContent=`Charge B: ${L.s2>0?'positive (+)':'negative (−)'}`;
    $('labtxt').textContent=`${same?'Like charges repel.':'Unlike charges attract.'} Relative force ${F.toFixed(2)} units. Move them closer or make them larger to strengthen it.`;};
  $('s1').onclick=()=>{L.s1*=-1;run();};$('s2').onclick=()=>{L.s2*=-1;run();};['qa','qb','dd'].forEach(i=>{$(i).oninput=run;});run();
}
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-syl],[data-fil],[data-back]');if(!t)return;
  if(t.dataset.syl){tab='syllabus';syl.open=t.dataset.syl;if(syl.open==='electric_charge')resetPlayer();render();window.scrollTo(0,0);}
  else if(t.dataset.fil){syl.filter=t.dataset.fil;render();}
  else if(t.dataset.back!==undefined){syl.open=null;try{speechSynthesis.cancel();}catch(x){}render();}
});
