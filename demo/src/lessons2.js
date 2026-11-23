/* ===== Video lessons for the 11 concepts after Electric Charge (animated, in-page canvas) ===== */
const LINES=(c,u,L,k,y0,dy)=>{L.forEach(([s,a,sz,ck],i)=>{FADE(c,seg(u,a,a+.1));TX(c,s,40,(y0||70)+i*(dy||60),sz||20,k[ck||'fg'],'left',ck==='pri'?700:600);});FADE(c,1);};
const BAR=(c,x,yb,w,h,col,lab,val,k)=>{c.fillStyle=col;c.fillRect(x,yb-h,w,h);TX(c,lab,x+w/2,yb+16,12,k.muted);if(val!==undefined)TX(c,val,x+w/2,yb-h-12,14,k.fg);};
const PATHP=(x,y,w,h,s)=>{const P=2*(w+h);let d=(((s%1)+1)%1)*P;if(d<w)return[x+d,y];d-=w;if(d<h)return[x+w,y+d];d-=h;if(d<w)return[x+w-d,y+h];d-=w;return[x,y+h-d];};
const WIRE=(c,x,y,w,h,k)=>{c.strokeStyle=k.muted;c.lineWidth=3;c.strokeRect(x,y,w,h);};
const CELL=(c,x,y,k)=>{c.fillStyle=k.card;c.fillRect(x-12,y-14,24,28);c.strokeStyle=k.fg;c.lineWidth=3;c.beginPath();c.moveTo(x-16,y-6);c.lineTo(x+16,y-6);c.stroke();c.lineWidth=5;c.beginPath();c.moveTo(x-9,y+6);c.lineTo(x+9,y+6);c.stroke();TX(c,'+',x-26,y-6,13,k.pos,'center',700);TX(c,'−',x-26,y+8,13,k.neg,'center',700);};
const BLB=(c,x,y,r,k,g)=>{c.fillStyle=k.card;c.beginPath();c.arc(x,y,r,0,6.2832);c.fill();FADE(c,g);c.fillStyle=k.warn;c.beginPath();c.arc(x,y,r+7,0,6.2832);c.globalAlpha=Math.max(0,Math.min(1,g))*.35;c.fill();c.globalAlpha=Math.max(0,Math.min(1,g));c.beginPath();c.arc(x,y,r,0,6.2832);c.fill();FADE(c,1);c.strokeStyle=k.fg;c.lineWidth=2.5;c.beginPath();c.arc(x,y,r,0,6.2832);c.stroke();const d=r*.7;c.beginPath();c.moveTo(x-d,y-d);c.lineTo(x+d,y+d);c.moveTo(x+d,y-d);c.lineTo(x-d,y+d);c.stroke();};
const RZ=(c,x,y,len,k,lab,col)=>{c.fillStyle=k.card;c.fillRect(x-1,y-14,len+2,28);c.strokeStyle=col||k.fg;c.lineWidth=3;c.beginPath();c.moveTo(x,y);const n=6,sw=len/n;for(let i=0;i<n;i++)c.lineTo(x+sw*(i+.5),y+(i%2?12:-12));c.lineTo(x+len,y);c.stroke();if(lab)TX(c,lab,x+len/2,y-26,13,k.fg);};
const MTR=(c,x,y,ch,k,val)=>{c.fillStyle=k.card;c.beginPath();c.arc(x,y,17,0,6.2832);c.fill();c.strokeStyle=k.pri;c.lineWidth=3;c.stroke();TX(c,ch,x,y,16,k.pri,'center',700);if(val)TX(c,val,x,y+30,12,k.fg);};
const ELS=(c,x,y,w,h,k,n,spd,rev)=>{for(let i=0;i<n;i++)DOT(c,...PATHP(x,y,w,h,(rev?1:-1)*(k.t*(spd||.12))+i/n),6,k.neg);};
const BATLOOP=(c,x,y,w,h,k)=>{WIRE(c,x,y,w,h,k);CELL(c,x,y+h/2,k);};
const HEAD=(c,s,k)=>TX(c,s,320,335,15,k.fg);

const L2={};
L2.electric_current={scenes:[
{t:'Current is moving charge',d:12,n:['Charges drift along a wire when a source pushes them.','Count how much charge crosses a point each second. That rate is the electric current.'],draw(c,u,k){
  c.fillStyle=k.line;c.fillRect(30,140,580,50);c.strokeStyle=k.pri;c.setLineDash([6,5]);c.lineWidth=2;c.beginPath();c.moveTo(320,110);c.lineTo(320,220);c.stroke();c.setLineDash([]);TX(c,'a point on the wire',320,98,12,k.muted);
  for(let i=0;i<9;i++)DOT(c,30+((k.t*80+i*65)%580),165,9,k.neg,'−');TX(c,'Current = charge passing per second',320,270,18,k.fg);}},
{t:'The formula I = Q / t',d:14,n:['Current I equals charge Q divided by time t.','If 12 coulombs pass in 4 seconds, I = 12 / 4 = 3 amperes.'],draw(c,u,k){
  LINES(c,u,[['I = Q / t',.05,34,'pri'],['Q = charge in coulombs (C)',.3,20],['t = time in seconds (s)',.45,20],['Example: 12 C in 4 s  →  I = 12 / 4 = 3 A',.7,18]],k,70,62);}},
{t:'The ampere',d:12,n:['Current is measured in amperes, written A.','One ampere means one coulomb passes every second.','Small currents use milliamperes: 1 mA is one thousandth of an ampere.'],draw(c,u,k){
  LINES(c,u,[['1 A = 1 C / 1 s',.05,30,'pri'],['1 mA = 10⁻³ A',.35,22],['1 µA = 10⁻⁶ A',.55,22],['Phone charger ≈ 1–2 A    LED ≈ 20 mA',.75,17]],k,75,62);}},
{t:'Two directions',d:14,n:['By convention, current is drawn from the positive terminal round to the negative terminal.','The electrons that actually move go the other way, from negative to positive.'],draw(c,u,k){
  BATLOOP(c,170,70,300,170,k);BLB(c,470,155,18,k,1);
  for(let i=0;i<4;i++){const[x,y]=PATHP(170,70,300,170,k.t*.08+i/4);ARR(c,x,y,...PATHP(170,70,300,170,k.t*.08+i/4+.02),k.pos,3);}
  ELS(c,170,70,300,170,k,6,.1,true);TX(c,'Conventional current (+ to −)',320,35,14,k.pos);TX(c,'Electrons drift the other way',320,272,14,k.neg);}},
{t:'Measuring with an ammeter',d:14,n:['An ammeter is connected in series, so the whole current passes through it.','Readings before and after a bulb are equal. Charge is not used up; energy is transferred.'],draw(c,u,k){
  BATLOOP(c,150,70,340,170,k);BLB(c,320,70,18,k,1);MTR(c,230,240,'A',k,'0.5 A');MTR(c,410,240,'A',k,'0.5 A');
  c.fillStyle=k.card;c.fillRect(210,225,40,30);c.fillRect(390,225,40,30);MTR(c,230,240,'A',k,'0.5 A');MTR(c,410,240,'A',k,'0.5 A');ELS(c,150,70,340,170,k,8,.1,true);
  TX(c,'Same current on both sides of the bulb',320,300,15,k.fg);}},
{t:'Recap',d:10,n:['Current is charge per second, I = Q / t, in amperes.','It is drawn positive to negative, and ammeters go in series.'],draw(c,u,k){
  LINES(c,u,[['I = Q / t, measured in amperes (A)',.05,18],['1 A = 1 coulomb per second',.25,18],['Conventional direction: + to −',.45,18],['Ammeter goes in series',.65,18],['Current is not used up by a bulb',.82,18]],k,70,56);}},
],checks:{0:3,1:4,4:5}};

L2.electric_circuit={scenes:[
{t:'A circuit needs a closed path',d:14,n:['Charge can only flow round a complete loop.','With the switch open the loop is broken and the bulb stays dark. Close it and the bulb lights.'],draw(c,u,k){
  const on=u>.5;BATLOOP(c,170,70,300,170,k);c.fillStyle=k.card;c.fillRect(300,62,60,16);c.strokeStyle=k.fg;c.lineWidth=3;c.beginPath();c.moveTo(300,70);c.lineTo(on?360:345,on?70:48);c.stroke();BLB(c,470,155,18,k,on?1:0);
  if(on)ELS(c,170,70,300,170,k,8,.12,true);TX(c,on?'Switch closed: current flows':'Switch open: no current',320,300,17,k.fg);}},
{t:'Parts of a circuit',d:14,n:['A cell or battery is the source of energy.','Wires carry charge, a switch controls the path, and the bulb is the load.'],draw(c,u,k){
  BATLOOP(c,170,70,300,170,k);BLB(c,470,155,18,k,1);c.fillStyle=k.card;c.fillRect(300,62,60,16);c.strokeStyle=k.fg;c.lineWidth=3;c.beginPath();c.moveTo(300,70);c.lineTo(360,70);c.stroke();
  FADE(c,seg(u,.1,.25));TX(c,'Cell (source)',90,155,14,k.fg);FADE(c,seg(u,.3,.45));TX(c,'Switch',330,45,14,k.fg);FADE(c,seg(u,.5,.65));TX(c,'Bulb (load)',545,155,14,k.fg);FADE(c,seg(u,.7,.85));TX(c,'Connecting wires',320,265,14,k.fg);FADE(c,1);}},
{t:'Direction of current',d:14,n:['Outside the cell, conventional current runs from the positive terminal to the negative terminal.','Electrons move the opposite way.'],draw(c,u,k){
  BATLOOP(c,170,70,300,170,k);BLB(c,470,155,18,k,1);for(let i=0;i<4;i++){const s=k.t*.08+i/4;ARR(c,...PATHP(170,70,300,170,s),...PATHP(170,70,300,170,s+.02),k.pos,3);}
  TX(c,'+ terminal → round the circuit → − terminal',320,300,16,k.fg);}},
{t:'Circuit symbols',d:14,n:['Circuit diagrams use standard symbols.','Learn the cell, bulb, resistor, switch, ammeter and voltmeter.'],draw(c,u,k){
  const S=[['Cell',(x,y)=>{c.strokeStyle=k.fg;c.lineWidth=3;c.beginPath();c.moveTo(x-12,y-14);c.lineTo(x-12,y+14);c.stroke();c.lineWidth=6;c.beginPath();c.moveTo(x+2,y-7);c.lineTo(x+2,y+7);c.stroke();}],['Bulb',(x,y)=>BLB(c,x,y,14,k,0)],['Resistor',(x,y)=>{c.strokeStyle=k.fg;c.lineWidth=3;c.strokeRect(x-24,y-9,48,18);}],['Switch',(x,y)=>{c.strokeStyle=k.fg;c.lineWidth=3;c.beginPath();c.moveTo(x-22,y+8);c.lineTo(x+14,y-14);c.stroke();}],['Ammeter',(x,y)=>MTR(c,x,y,'A',k)],['Voltmeter',(x,y)=>MTR(c,x,y,'V',k)]];
  S.forEach(([n,f],i)=>{const x=110+(i%3)*210,y=110+Math.floor(i/3)*110;FADE(c,seg(u,i*.12,i*.12+.12));f(x,y);TX(c,n,x,y+42,14,k.fg);});FADE(c,1);}},
{t:'Break the loop',d:12,n:['In a series circuit one open switch stops the current everywhere.','The loop is no longer closed, so the current is zero.'],draw(c,u,k){
  const on=u<.4;BATLOOP(c,170,70,300,170,k);BLB(c,470,155,18,k,on?1:0);c.fillStyle=k.card;c.fillRect(300,62,60,16);c.strokeStyle=k.fg;c.lineWidth=3;c.beginPath();c.moveTo(300,70);c.lineTo(on?360:345,on?70:48);c.stroke();if(on)ELS(c,170,70,300,170,k,8,.12,true);
  TX(c,on?'Closed: current flows':'Opened: current is zero everywhere',320,300,16,k.fg);}},
{t:'Recap',d:10,n:['A circuit is a closed conducting path with a source.','Current runs + to − outside the cell.'],draw(c,u,k){
  LINES(c,u,[['Closed path + source = current flows',.05,18],['Parts: cell, switch, wires, load',.28,18],['Conventional current: + to −',.5,18],['Open switch → current stops',.72,18]],k,80,62);}},
],checks:{0:10,2:11,4:12}};

L2.potential_difference={scenes:[
{t:'What pushes charge?',d:14,n:['Water flows from a high tank to a low one because of a height difference.','Charge flows because of a potential difference, an electrical push.'],draw(c,u,k){
  c.fillStyle=k.line;c.fillRect(80,90,120,90);c.fillRect(440,200,120,90);c.fillStyle=k.neg;FADE(c,.6);const f=seg(u,.1,.9);c.fillRect(80,180-90*(1-f*.6),120,90*(1-f*.6));c.fillRect(440,290-90*(.3+f*.5),120,90*(.3+f*.5));FADE(c,1);
  c.strokeStyle=k.muted;c.lineWidth=3;c.beginPath();c.moveTo(200,170);c.lineTo(440,270);c.stroke();for(let i=0;i<5;i++){const p=(k.t*.4+i/5)%1;DOT(c,lerp(200,440,p),lerp(170,270,p),6,k.neg);}
  TX(c,'High level',140,75,13,k.fg);TX(c,'Low level',500,185,13,k.fg);TX(c,'Height difference ↔ potential difference',320,325,15,k.fg);}},
{t:'V = W / Q',d:14,n:['Potential difference is the work done to move one coulomb of charge between two points.','If 36 joules move 6 coulombs, V = 36 / 6 = 6 volts.'],draw(c,u,k){
  LINES(c,u,[['V = W / Q',.05,34,'pri'],['W = work done (J)    Q = charge (C)',.3,19],['Example: W = 36 J, Q = 6 C',.55,19],['V = 36 / 6 = 6 V',.75,24,'pri']],k,70,62);}},
{t:'The volt',d:12,n:['Potential difference is measured in volts.','One volt means one joule of work per coulomb.'],draw(c,u,k){
  LINES(c,u,[['1 V = 1 J / 1 C',.05,30,'pri'],['A 1.5 V cell gives 1.5 J to each coulomb',.35,19],['Mains supply in India: 230 V',.65,19]],k,90,70);}},
{t:'The cell as an energy pump',d:14,n:['Inside the cell, charges are given energy.','They give that energy up to the bulb, then return to the cell for more.'],draw(c,u,k){
  BATLOOP(c,170,70,300,170,k);BLB(c,470,155,18,k,1);for(let i=0;i<8;i++){const s=-(k.t*.1)+i/8,[x,y]=PATHP(170,70,300,170,s);const e=Math.max(0,Math.min(1,1-((s%1+1)%1)));FADE(c,.35+.65*e);DOT(c,x,y,7,k.neg);}FADE(c,1);
  TX(c,'Bright = high energy (after the cell)   Faint = low energy (after the bulb)',320,300,13,k.fg);}},
{t:'The voltmeter',d:14,n:['A voltmeter measures potential difference.','Connect it in parallel, across the component.'],draw(c,u,k){
  BATLOOP(c,150,70,340,170,k);BLB(c,320,70,18,k,1);c.strokeStyle=k.pri;c.lineWidth=2.5;c.beginPath();c.moveTo(290,70);c.lineTo(290,20);c.lineTo(350,20);c.lineTo(350,70);c.stroke();MTR(c,320,20,'V',k);ELS(c,150,70,340,170,k,8,.1,true);
  TX(c,'Voltmeter in parallel with the bulb',320,300,16,k.fg);}},
{t:'Recap',d:10,n:['V = W / Q, in volts.','A voltmeter goes in parallel.'],draw(c,u,k){
  LINES(c,u,[['V = W / Q',.05,22,'pri'],['Unit: volt, 1 V = 1 J / C',.28,18],['A cell raises the energy of charge',.5,18],['Voltmeter: connect in parallel',.72,18]],k,80,62);}},
],checks:{0:7,1:8,4:9}};

L2.ohms_law={scenes:[
{t:'Current follows voltage',d:14,n:['Increase the voltage across a wire and the current rises in step.','Plotted, voltage against current is a straight line through the origin.'],draw(c,u,k){
  c.strokeStyle=k.muted;c.lineWidth=2;c.beginPath();c.moveTo(120,40);c.lineTo(120,290);c.lineTo(560,290);c.stroke();TX(c,'V',108,45,13,k.muted);TX(c,'I',560,305,13,k.muted);
  const f=seg(u,.1,.8);c.strokeStyle=k.pri;c.lineWidth=3;c.beginPath();c.moveTo(120,290);c.lineTo(lerp(120,500,f),lerp(290,60,f));c.stroke();for(let i=1;i<=4;i++)if(f>i/4-.02)DOT(c,lerp(120,500,i/4),lerp(290,60,i/4),6,k.acc);TX(c,'Straight line: V ∝ I',400,310,14,k.fg);}},
{t:'V = I R',d:12,n:['Ohm’s law says V equals I times R, at constant temperature.','The constant R is the resistance.'],draw(c,u,k){
  LINES(c,u,[['V = I R',.05,40,'pri'],['I = V / R',.3,24],['R = V / I',.5,24],['Valid at constant temperature',.75,17,'muted']],k,70,62);}},
{t:'Same V, bigger R',d:14,n:['Keep the supply at 10 volts.','With 2 ohms the current is 5 amperes. With 5 ohms it falls to 2 amperes. More resistance, less current.'],draw(c,u,k){
  const f=seg(u,.1,.8);BAR(c,180,290,90,f*5*40,k.pri,'R = 2 Ω',f>.9?'5 A':'',k);BAR(c,380,290,90,f*2*40,k.warn,'R = 5 Ω',f>.9?'2 A':'',k);TX(c,'V = 10 V (constant)   I = V / R',320,40,15,k.fg);}},
{t:'Worked example',d:12,n:['A 12 volt supply is across a 4 ohm resistor.','I = V / R = 12 / 4 = 3 amperes.'],draw(c,u,k){
  BATLOOP(c,180,80,280,150,k);RZ(c,320,80,90,k,'4 Ω');ELS(c,180,80,280,150,k,6,.1,true);TX(c,'12 V',90,155,16,k.fg);
  FADE(c,seg(u,.4,.6));TX(c,'I = 12 / 4 = 3 A',320,275,22,k.pri,'center',700);FADE(c,1);}},
{t:'When it holds',d:10,n:['Ohm’s law holds for metallic conductors when temperature stays constant.','Some devices, like diodes, do not follow it.'],draw(c,u,k){
  LINES(c,u,[['Metal wire at fixed temperature: V ∝ I',.05,18],['Hot filament: R changes, graph curves',.35,18],['Diode, LED: not ohmic',.65,18]],k,100,62);}},
{t:'Recap',d:10,n:['V = IR.','More resistance means less current for the same voltage.'],draw(c,u,k){
  LINES(c,u,[['V = I R,  I = V / R,  R = V / I',.05,20],['V–I graph is a straight line',.3,18],['Same V: bigger R, smaller I',.55,18]],k,100,62);}},
],checks:{1:13,2:37,3:14}};

L2.resistance={scenes:[
{t:'Opposition to flow',d:14,n:['Moving electrons keep bumping into the fixed ions of the metal.','This opposition to the flow of charge is called resistance.'],draw(c,u,k){
  for(let r=0;r<4;r++)for(let q=0;q<9;q++)DOT(c,100+q*55+Math.sin(k.t*6+r+q)*2,100+r*50,10,k.grey);
  for(let i=0;i<4;i++){const x=60+((k.t*60+i*140)%520),y=125+i*50+Math.sin(k.t*9+i*2)*14;DOT(c,x,y,7,k.neg,'−');}TX(c,'Electrons collide with ions',320,320,15,k.fg);}},
{t:'R = V / I',d:14,n:['Resistance is the potential difference across a component divided by the current through it.','For 9 volts and 0.3 amperes, R = 9 / 0.3 = 30 ohms.'],draw(c,u,k){
  LINES(c,u,[['R = V / I',.05,36,'pri'],['9 V across it, 0.3 A through it',.35,19],['R = 9 / 0.3 = 30 Ω',.65,24,'pri']],k,90,70);}},
{t:'The ohm',d:10,n:['Resistance is measured in ohms, written with the Greek letter omega.','One ohm is one volt per ampere.'],draw(c,u,k){
  LINES(c,u,[['Unit: ohm (Ω)',.05,28,'pri'],['1 Ω = 1 V / 1 A',.35,24],['Symbol of a resistor:',.6,16,'muted']],k,90,62);FADE(c,seg(u,.6,.8));c.strokeStyle=k.fg;c.lineWidth=3;c.strokeRect(300,200,70,26);FADE(c,1);}},
{t:'Good and poor conductors',d:12,n:['Metals like copper have low resistance.','Alloys like nichrome resist more, and insulators resist enormously.'],draw(c,u,k){
  const f=seg(u,.1,.7);BAR(c,130,290,80,f*18,k.pri,'Copper','',k);BAR(c,280,290,80,f*100,k.warn,'Nichrome','',k);BAR(c,430,290,80,f*220,k.bad||k.pos,'Rubber (huge)','',k);TX(c,'Relative resistance (not to scale)',320,40,14,k.muted);}},
{t:'Recap',d:10,n:['R = V / I in ohms.','Resistance opposes current.'],draw(c,u,k){
  LINES(c,u,[['Resistance opposes the flow of charge',.05,18],['R = V / I,  unit ohm (Ω)',.3,18],['Low R: metals.  High R: insulators',.55,18]],k,100,62);}},
],checks:{2:18,3:17}};

L2.resistance_factors={scenes:[
{t:'Longer wire, more resistance',d:12,n:['A longer wire gives electrons more collisions on the way.','Double the length and the resistance doubles.'],draw(c,u,k){
  const f=seg(u,.1,.6);c.fillStyle=k.pri;c.fillRect(60,100,160,24);c.fillStyle=k.warn;c.fillRect(60,200,lerp(160,320,f),24);TX(c,'Length L',140,88,13,k.fg);TX(c,'Length 2L',60+lerp(160,320,f)/2,188,13,k.fg);
  FADE(c,seg(u,.6,.8));TX(c,'R',460,112,22,k.pri,'center',700);TX(c,'2R',460,212,22,k.warn,'center',700);FADE(c,1);TX(c,'R ∝ L',320,300,18,k.fg);}},
{t:'Thicker wire, less resistance',d:12,n:['A thick wire gives electrons more room, like a wide pipe.','Double the area and the resistance halves.'],draw(c,u,k){
  c.fillStyle=k.warn;c.fillRect(120,110,300,20);c.fillStyle=k.pri;c.fillRect(120,190,300,40);TX(c,'Area A',80,120,13,k.fg);TX(c,'Area 2A',72,210,13,k.fg);for(let i=0;i<5;i++){DOT(c,120+((k.t*70+i*60)%300),120,5,k.neg);DOT(c,120+((k.t*70+i*60)%300),200+(i%2)*20,5,k.neg);}
  FADE(c,seg(u,.5,.8));TX(c,'R ∝ 1 / A',320,300,18,k.fg);FADE(c,1);}},
{t:'Material and temperature',d:12,n:['Resistance also depends on the material, through its resistivity.','For metals it also rises as the temperature rises.'],draw(c,u,k){
  LINES(c,u,[['Resistivity ρ depends on the material',.05,19],['Copper: low ρ  →  good for wires',.3,19],['Nichrome: high ρ  →  heating elements',.5,19],['Metals: R rises with temperature',.72,19]],k,75,62);}},
{t:'R = ρ L / A',d:14,n:['Put it together: R equals rho times length over area.','Double the length and double the area and R stays at 8 ohms.'],draw(c,u,k){
  LINES(c,u,[['R = ρ L / A',.05,38,'pri'],['Length ×2  →  R ×2',.3,20],['Area ×2  →  R ÷2',.5,20],['Both ×2  →  R unchanged (8 Ω stays 8 Ω)',.72,19]],k,70,62);}},
{t:'Recap',d:10,n:['Resistance grows with length and falls with area.','It also depends on material and temperature.'],draw(c,u,k){
  LINES(c,u,[['R = ρ L / A',.05,22,'pri'],['Longer → more R',.3,18],['Thicker → less R',.5,18],['Material and temperature matter',.7,18]],k,90,62);}},
],checks:{0:19,1:20,3:21}};

L2.series_combination={scenes:[
{t:'One path, one current',d:14,n:['In series the resistors are joined end to end, so there is only one path.','The same current flows through each of them.'],draw(c,u,k){
  BATLOOP(c,120,70,400,170,k);RZ(c,200,70,70,k,'R1');RZ(c,300,70,70,k,'R2');RZ(c,400,70,70,k,'R3');ELS(c,120,70,400,170,k,9,.1,true);MTR(c,200,240,'A',k,'1 A');MTR(c,420,240,'A',k,'1 A');TX(c,'Same current everywhere',320,310,15,k.fg);}},
{t:'Voltages add up',d:14,n:['The supply voltage is shared between the resistors.','The voltages across them add up to the total.'],draw(c,u,k){
  const f=seg(u,.1,.7);BAR(c,110,290,60,f*30,k.pri,'V1','',k);BAR(c,200,290,60,f*50,k.warn,'V2','',k);BAR(c,290,290,60,f*70,k.acc,'V3','',k);BAR(c,420,290,100,f*150,k.fg,'V total','',k);TX(c,'V = V1 + V2 + V3',320,40,18,k.fg);}},
{t:'Rs = R1 + R2 + R3',d:12,n:['The equivalent resistance is the sum of the individual resistances.','For 2, 3 and 5 ohms, Rs = 10 ohms.'],draw(c,u,k){
  LINES(c,u,[['Rs = R1 + R2 + R3',.05,32,'pri'],['2 Ω + 3 Ω + 5 Ω',.35,22],['Rs = 10 Ω',.6,28,'pri'],['Rs is larger than the biggest resistor',.82,16,'muted']],k,70,62);}},
{t:'Worked example',d:12,n:['A 6 volt battery drives 2 ohm and 4 ohm resistors in series.','Rs = 6 ohms, so I = 6 / 6 = 1 ampere.'],draw(c,u,k){
  BATLOOP(c,150,80,340,150,k);RZ(c,230,80,70,k,'2 Ω');RZ(c,350,80,70,k,'4 Ω');ELS(c,150,80,340,150,k,7,.1,true);TX(c,'6 V',80,155,16,k.fg);
  FADE(c,seg(u,.4,.6));TX(c,'Rs = 6 Ω   I = 6 / 6 = 1 A',320,275,20,k.pri,'center',700);FADE(c,1);}},
{t:'Recap',d:10,n:['Series: same current, voltages add, resistances add.'],draw(c,u,k){
  LINES(c,u,[['Same current in every resistor',.05,18],['Voltages add: V = V1 + V2 + …',.3,18],['Resistances add: Rs = R1 + R2 + …',.55,18]],k,100,62);}},
],checks:{0:23,2:22,3:24}};

L2.parallel_combination={scenes:[
{t:'Branches share the voltage',d:14,n:['In parallel each resistor is connected directly across the same two points.','So every branch has the same potential difference.'],draw(c,u,k){
  WIRE(c,120,60,400,180,k);CELL(c,120,150,k);c.fillStyle=k.card;c.fillRect(300,55,16,190);c.strokeStyle=k.muted;c.lineWidth=3;c.beginPath();c.moveTo(308,60);c.lineTo(308,240);c.stroke();RZ(c,418,150,0,k);
  c.strokeStyle=k.muted;c.beginPath();c.moveTo(308,150);c.lineTo(520,150);c.stroke();c.fillStyle=k.card;c.fillRect(380,138,80,24);RZ(c,380,150,80,k,'R2');c.fillStyle=k.card;c.fillRect(380,48,80,24);RZ(c,380,60,80,k,'R1');
  TX(c,'Same V across each branch',320,300,15,k.fg);}},
{t:'Currents add',d:12,n:['The current from the source splits at the junction.','The branch currents add up to the total.'],draw(c,u,k){
  const f=seg(u,.1,.6);ARR(c,60,160,200,160,k.pri,5);ARR(c,200,160,330,90,k.acc,3);ARR(c,200,160,330,230,k.warn,3);TX(c,'I',130,140,20,k.pri,'center',700);TX(c,'I1',270,100,18,k.acc,'center',700);TX(c,'I2',270,235,18,k.warn,'center',700);
  FADE(c,f);TX(c,'I = I1 + I2',480,160,24,k.fg,'center',700);FADE(c,1);}},
{t:'1/Rp = 1/R1 + 1/R2',d:14,n:['For parallel resistors add the reciprocals.','With 6 and 3 ohms, one over Rp is one sixth plus one third, which is one half. Rp is 2 ohms.'],draw(c,u,k){
  LINES(c,u,[['1/Rp = 1/R1 + 1/R2 + …',.05,26,'pri'],['R1 = 6 Ω,  R2 = 3 Ω',.3,20],['1/Rp = 1/6 + 1/3 = 1/2',.5,22],['Rp = 2 Ω',.72,28,'pri']],k,70,62);}},
{t:'Rp is smaller than any branch',d:12,n:['Each new branch gives the current another path.','So the total resistance drops below the smallest branch.'],draw(c,u,k){
  const f=seg(u,.1,.7);BAR(c,150,290,80,f*6*30,k.pri,'6 Ω','',k);BAR(c,270,290,80,f*3*30,k.warn,'3 Ω','',k);BAR(c,390,290,80,f*2*30,k.acc,'Rp = 2 Ω','',k);TX(c,'Rp < smallest branch',320,45,18,k.fg);}},
{t:'Why homes use parallel',d:12,n:['Household appliances are wired in parallel.','Each gets the full supply voltage, and switching one off leaves the others on.'],draw(c,u,k){
  const off=u>.5;[0,1,2].forEach(i=>{const x=160+i*150;c.strokeStyle=k.muted;c.lineWidth=3;c.beginPath();c.moveTo(x,60);c.lineTo(x,120);c.moveTo(x,185);c.lineTo(x,240);c.stroke();BLB(c,x,152,22,k,(i===1&&off)?0:1);});
  c.beginPath();c.moveTo(100,60);c.lineTo(540,60);c.moveTo(100,240);c.lineTo(540,240);c.stroke();TX(c,off?'Middle bulb off, others still lit':'All three lit at full voltage',320,300,15,k.fg);}},
{t:'Recap',d:10,n:['Parallel: same voltage, currents add, Rp is smaller than any branch.'],draw(c,u,k){
  LINES(c,u,[['Same voltage across each branch',.05,18],['Currents add: I = I1 + I2',.3,18],['1/Rp = 1/R1 + 1/R2',.55,18]],k,100,62);}},
],checks:{0:25,2:26,3:27}};

L2.heating_effect={scenes:[
{t:'Collisions make heat',d:12,n:['Electrons hit the metal ions as they drift, and the ions vibrate faster.','Faster vibration means the wire warms up.'],draw(c,u,k){
  const a=1+u*6;for(let r=0;r<3;r++)for(let q=0;q<10;q++){const x=80+q*54+Math.sin(k.t*14+r*3+q)*a,y=120+r*50+Math.cos(k.t*13+q)*a;DOT(c,x,y,10,u>.5?k.pos:k.grey);}
  TX(c,u<.5?'Ions vibrate a little':'Ions vibrate more: the wire is hotter',320,310,16,k.fg);}},
{t:'Joule’s law: H = I²Rt',d:12,n:['The heat produced is current squared times resistance times time.','Current matters most because it is squared.'],draw(c,u,k){
  LINES(c,u,[['H = I² R t',.05,38,'pri'],['I in amperes, R in ohms, t in seconds',.3,18],['H in joules (J)',.5,18],['Current is squared: it matters most',.72,18]],k,70,62);}},
{t:'Double the current, four times the heat',d:14,n:['Try 1, 2 and 3 amperes through the same resistor for the same time.','The heat grows as 1, 4 and 9 units.'],draw(c,u,k){
  const f=seg(u,.1,.8);BAR(c,150,290,80,f*30,k.pri,'1 A',f>.9?'1×':'',k);BAR(c,270,290,80,f*120,k.warn,'2 A',f>.9?'4×':'',k);BAR(c,390,290,80,f*270,k.pos,'3 A',f>.9?'9×':'',k);}},
{t:'Worked example',d:12,n:['A 5 ohm resistor carries 2 amperes for 10 seconds.','H = 2 × 2 × 5 × 10 = 200 joules.'],draw(c,u,k){
  LINES(c,u,[['R = 5 Ω,  I = 2 A,  t = 10 s',.05,20],['H = I² R t',.3,24,'pri'],['H = 4 × 5 × 10',.5,24],['H = 200 J',.72,30,'pri']],k,70,62);}},
{t:'Uses and fuses',d:12,n:['Heaters, irons and bulb filaments use the heating effect.','A fuse wire melts if the current gets too high, protecting the circuit.'],draw(c,u,k){
  LINES(c,u,[['Heater, iron, toaster: useful heat',.05,19],['Bulb filament: glows white-hot',.3,19],['Fuse: low-melting wire that breaks in overload',.55,19]],k,90,62);}},
{t:'Recap',d:10,n:['H = I²Rt.'],draw(c,u,k){
  LINES(c,u,[['H = I² R t (Joule’s law)',.05,20],['Double I → four times the heat',.3,18],['Fuse protects against overload',.55,18]],k,100,62);}},
],checks:{2:30,3:29,4:28}};

L2.electric_power={scenes:[
{t:'Power is a rate',d:12,n:['Power tells you how fast energy is transferred.','A 100 watt bulb converts energy faster than a 40 watt one.'],draw(c,u,k){
  BLB(c,220,150,36,k,.45);BLB(c,420,150,36,k,1);TX(c,'40 W',220,215,18,k.fg);TX(c,'100 W',420,215,18,k.fg);TX(c,'Power = energy per second',320,290,17,k.fg);}},
{t:'P = V I',d:12,n:['Power equals voltage times current.','At 220 volts and 5 amperes the power is 1100 watts.'],draw(c,u,k){
  LINES(c,u,[['P = V I',.05,38,'pri'],['V = 220 V,  I = 5 A',.35,21],['P = 220 × 5 = 1100 W',.6,24,'pri']],k,90,70);}},
{t:'Other forms',d:14,n:['Use Ohm’s law to rewrite power.','P = I²R when you know current and resistance, and V²/R when you know voltage and resistance.'],draw(c,u,k){
  LINES(c,u,[['P = V I',.05,26,'pri'],['Put V = I R:   P = I² R',.3,22],['Put I = V / R:   P = V² / R',.55,22]],k,90,70);}},
{t:'The watt',d:10,n:['Power is measured in watts.','One watt is one joule per second, and 1000 watts is a kilowatt.'],draw(c,u,k){
  LINES(c,u,[['1 W = 1 J / 1 s',.05,28,'pri'],['1 kW = 1000 W',.35,24],['Ceiling fan ≈ 75 W    Geyser ≈ 2 kW',.65,17]],k,90,70);}},
{t:'Worked example',d:12,n:['A 60 watt lamp runs on 120 volts.','I = P / V = 60 / 120 = 0.5 amperes.'],draw(c,u,k){
  LINES(c,u,[['P = 60 W,  V = 120 V',.05,22],['I = P / V',.3,26,'pri'],['I = 60 / 120 = 0.5 A',.6,26,'pri']],k,90,70);}},
{t:'Recap',d:10,n:['P = VI = I²R = V²/R, in watts.'],draw(c,u,k){
  LINES(c,u,[['P = V I = I² R = V² / R',.05,20],['Unit: watt (W) = J / s',.3,18],['1 kW = 1000 W',.55,18]],k,100,62);}},
],checks:{1:31,3:32,4:33}};

L2.electrical_energy={scenes:[
{t:'Energy = power × time',d:12,n:['The longer an appliance runs, the more energy it uses.','Energy is power multiplied by time.'],draw(c,u,k){
  const f=seg(u,.1,.9);BAR(c,200,290,90,f*60,k.pri,'1 h','',k);BAR(c,340,290,90,f*120,k.warn,'2 h','',k);BAR(c,480,290,90,f*180,k.pos,'3 h','',k);TX(c,'Same heater, more hours, more energy',320,45,16,k.fg);}},
{t:'E = P t',d:14,n:['If power is in kilowatts and time in hours, energy comes out in kilowatt-hours.','A 2 kW heater for 3 hours uses 6 kWh.'],draw(c,u,k){
  LINES(c,u,[['E = P × t',.05,36,'pri'],['P = 2 kW,  t = 3 h',.35,22],['E = 2 × 3 = 6 kWh',.6,26,'pri']],k,90,70);}},
{t:'The kilowatt-hour',d:14,n:['The kilowatt-hour is the commercial unit of energy, one “unit” on your bill.','1 kWh = 1000 W × 3600 s = 3.6 × 10⁶ joules.'],draw(c,u,k){
  LINES(c,u,[['1 kWh = 1000 W × 1 h',.05,22],['= 1000 W × 3600 s',.3,22],['= 3.6 × 10⁶ J',.55,28,'pri']],k,90,70);}},
{t:'Reading the meter',d:12,n:['The electricity meter counts kilowatt-hours.','Units used equal the final reading minus the first reading.'],draw(c,u,k){
  const v=Math.floor(1234+u*40);c.fillStyle=k.line;c.fillRect(200,100,240,70);TX(c,String(v).padStart(5,'0'),320,135,38,k.fg,'center',700);TX(c,'kWh',320,190,16,k.muted);TX(c,'Units used = final reading − first reading',320,260,16,k.fg);}},
{t:'Which bulb resists more?',d:12,n:['For the same voltage, R = V² / P.','So the 40 watt bulb has the greater resistance.'],draw(c,u,k){
  const f=seg(u,.1,.7);BAR(c,200,290,90,f*100,k.warn,'40 W bulb','Higher R',k);BAR(c,380,290,90,f*40,k.pri,'100 W bulb','Lower R',k);TX(c,'Same voltage: R = V² / P',320,45,16,k.fg);}},
{t:'Recap',d:10,n:['E = P t; one kWh is 3.6 million joules.'],draw(c,u,k){
  LINES(c,u,[['E = P × t',.05,22,'pri'],['Commercial unit: kWh',.3,18],['1 kWh = 3.6 × 10⁶ J',.55,18]],k,100,62);}},
],checks:{1:34,2:35,4:36}};
Object.assign(LESSONS,L2);
