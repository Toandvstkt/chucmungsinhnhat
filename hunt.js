'use strict';
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const experience = window.BirthdayExperience;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const solved = (id) => experience.progress().includes(id);
  const discover = (id) => document.dispatchEvent(new CustomEvent('birthday-discover', { detail: id }));
  const idLanguage = () => experience.language() === 'id';
  let lastFound = new Set(experience.progress());

  // 1. Draw one continuous path through three decorative constellation stars.
  const constellation = $('#constellation');
  const starPoints = [[22,76],[83,24],[148,68]];
  const starText = $$('.constellation-stars text');
  let tracing = false, orbitStep = 0, orbitPointer = null;
  function starPosition(event) {
    const r = constellation.getBoundingClientRect();
    return [(event.clientX-r.left)/r.width*170,(event.clientY-r.top)/r.height*100];
  }
  function drawOrbit(cursor = null) {
    const points = solved('orbit') ? starPoints : starPoints.slice(0, Math.max(orbitStep,1));
    let d = points.map(([x,y],i) => `${i ? 'L':'M'}${x} ${y}`).join(' ');
    if (cursor && !solved('orbit')) d += ` L${cursor[0]} ${cursor[1]}`;
    $('#constellation-line').setAttribute('d',d);
    starText.forEach((star,i) => star.classList.toggle('next',!solved('orbit') && i === orbitStep));
  }
  function orbitMove(event) {
    if (!tracing || event.pointerId !== orbitPointer || solved('orbit')) return;
    const point = starPosition(event), next = starPoints[orbitStep];
    if (next && Math.hypot(point[0]-next[0],point[1]-next[1]) < 24) orbitStep++;
    if (orbitStep === 3) { tracing = false; discover('orbit'); }
    drawOrbit(point);
  }
  constellation.addEventListener('pointerdown',event => {
    if (solved('orbit') || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const point = starPosition(event);
    if (Math.hypot(point[0]-22,point[1]-76) > 27) return;
    event.preventDefault(); constellation.setPointerCapture(event.pointerId);
    tracing = true; orbitPointer = event.pointerId; orbitStep = 1; drawOrbit(point);
  });
  constellation.addEventListener('pointermove',orbitMove);
  const endOrbit = () => { tracing = false; orbitPointer = null; if (!solved('orbit')) orbitStep=0; drawOrbit(); };
  ['pointerup','pointercancel','lostpointercapture'].forEach(name => constellation.addEventListener(name,endOrbit));
  constellation.addEventListener('keydown',event => {
    if (!['ArrowRight','ArrowLeft'].includes(event.key)) return;
    event.preventDefault(); if (solved('orbit')) return;
    orbitStep = event.key === 'ArrowLeft' ? 0 : orbitStep+1;
    if (orbitStep>=3) discover('orbit'); drawOrbit();
  });

  // 2. A watermark blooms only after an uninterrupted two-second hold.
  const ink = $('#secret-ink');
  let holdFrame = null, holdStart = 0, holdActive = false;
  function cancelHold() {
    holdActive=false; if (holdFrame) cancelAnimationFrame(holdFrame); holdFrame=null;
    ink.classList.remove('holding'); if (!solved('ink')) ink.style.setProperty('--hold','0');
  }
  function tickHold(time) {
    if (!holdActive || !$('#letter-dialog').open) { cancelHold(); return; }
    const progress=Math.min((time-holdStart)/2000,1); ink.style.setProperty('--hold',String(progress));
    if (progress>=1) { holdFrame=null; holdActive=false; ink.classList.remove('holding'); discover('ink'); }
    else holdFrame=requestAnimationFrame(tickHold);
  }
  function startHold() {
    if (solved('ink') || holdActive) return;
    holdActive=true; holdStart=performance.now(); ink.classList.add('holding'); holdFrame=requestAnimationFrame(tickHold);
  }
  ink.addEventListener('pointerdown',event=>{ if (event.pointerType==='mouse' && event.button!==0) return; event.preventDefault();ink.setPointerCapture(event.pointerId);startHold(); });
  ['pointerup','pointercancel','lostpointercapture','blur'].forEach(name=>ink.addEventListener(name,cancelHold));
  ink.addEventListener('contextmenu',event=>event.preventDefault());
  ink.addEventListener('keydown',event=>{ if ([' ','Enter'].includes(event.key)) { event.preventDefault(); if (!event.repeat) startHold(); } });
  ink.addEventListener('keyup',event=>{ if ([' ','Enter'].includes(event.key)) {event.preventDefault();cancelHold();} });
  $('#letter-dialog').addEventListener('close',cancelHold);

  // 3. Physically scratch enough of a silver postage stamp to reveal its moon.
  const stamp=$('#scratch-stamp'), scratch=$('#scratch-layer'), scratchContext=scratch.getContext('2d',{willReadFrequently:true});
  let scratching=false, scratchPointer=null, lastScratchPoint=null, keyboardRub=0;
  function coatStamp() {
    if (!scratchContext) return;
    const c=scratchContext;c.globalCompositeOperation='source-over';c.clearRect(0,0,220,152);
    c.fillStyle='#b9b4a7';c.fillRect(0,0,220,152);
    c.strokeStyle='#dfd9cb';c.lineWidth=1;
    for(let x=7;x<220;x+=11){c.beginPath();c.moveTo(x,0);c.lineTo(x-75,152);c.stroke();}
    c.strokeStyle='#958e80';c.lineWidth=2;c.strokeRect(10,10,200,132);
    c.textAlign='center';c.fillStyle='#7e7769';c.font='48px Georgia';c.fillText('✧',110,89);
    c.font='12px Arial';c.fillText('MIDNIGHT POST',110,120);
    // A faint scuff suggests that the silver is a removable surface.
    c.strokeStyle='#e9e4d8';c.lineWidth=3;c.beginPath();c.moveTo(164,22);c.lineTo(192,39);c.moveTo(170,21);c.lineTo(197,35);c.stroke();
    scratch.style.opacity='';stamp.classList.remove('cleared');keyboardRub=0;
  }
  function scratchPoint(event) {const r=stamp.getBoundingClientRect();return [(event.clientX-r.left)/r.width*220,(event.clientY-r.top)/r.height*152];}
  function rub(from,to) {
    if(!scratchContext || solved('scratch'))return;
    const c=scratchContext;c.globalCompositeOperation='destination-out';c.lineWidth=44;c.lineCap='round';
    c.beginPath();c.moveTo(...from);c.lineTo(...to);c.stroke();
    const pixels=c.getImageData(0,0,220,152).data;let clear=0,total=0;
    for(let y=8;y<144;y+=8)for(let x=8;x<212;x+=8){total++;if(pixels[(y*220+x)*4+3]<30)clear++;}
    if(clear/total>.38){scratching=false;discover('scratch');}
  }
  stamp.addEventListener('pointerdown',event=>{
    if(solved('scratch') || (event.pointerType==='mouse'&&event.button!==0))return;
    event.preventDefault();stamp.setPointerCapture(event.pointerId);scratching=true;scratchPointer=event.pointerId;lastScratchPoint=scratchPoint(event);rub(lastScratchPoint,lastScratchPoint);
  });
  stamp.addEventListener('pointermove',event=>{if(!scratching||event.pointerId!==scratchPointer)return;event.preventDefault();const next=scratchPoint(event);rub(lastScratchPoint,next);lastScratchPoint=next;});
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>stamp.addEventListener(name,()=>{scratching=false;scratchPointer=null;lastScratchPoint=null;}));
  stamp.addEventListener('keydown',event=>{
    if(![' ','Enter'].includes(event.key))return;event.preventDefault();if(event.repeat||solved('scratch'))return;
    const y=24+(keyboardRub%5)*25;keyboardRub++;rub([13,y],[207,y]);
  });

  // 4. The color sequence is revealed by the patient letter watermark.
  const gardenOrder=[1,2,0];let gardenStep=0;
  $$('.garden-flower').forEach(flower=>flower.addEventListener('click',()=>{
    flower.classList.remove('touched');void flower.offsetWidth;flower.classList.add('touched');
    if(solved('garden'))return;
    const color=Number(flower.dataset.flower);
    gardenStep=color===gardenOrder[gardenStep]?gardenStep+1:color===gardenOrder[0]?1:0;
    $$('.garden-flower').forEach(f=>f.classList.toggle('rhythm',gardenOrder.slice(0,gardenStep).includes(Number(f.dataset.flower))));
    if(gardenStep===3){discover('garden');$('#flower-wish').textContent=idLanguage()?'Irama yang tepat. Malam kecil menunggu setelah baris terakhir. ☾':'The right rhythm. A little night waits beyond the last line. ☾';}
  }));

  // 5. Peel a tiny folded corner at the end of the page, rather than click it.
  const peel=$('#footer-peel');let peeling=false,peelPointer=null,peelStart=null,peelProgress=0;
  peel.addEventListener('pointerdown',event=>{
    if(solved('moon')||(event.pointerType==='mouse'&&event.button!==0))return;
    event.preventDefault();peel.setPointerCapture(event.pointerId);peeling=true;peelPointer=event.pointerId;peelStart=[event.clientX,event.clientY];
  });
  peel.addEventListener('pointermove',event=>{
    if(!peeling||event.pointerId!==peelPointer)return;
    peelProgress=Math.max(0,Math.min((peelStart[0]-event.clientX+(peelStart[1]-event.clientY)*.3)/65,1));peel.style.setProperty('--peel',String(peelProgress));
    if(peelProgress>=1){peeling=false;discover('moon');}
  });
  const endPeel=()=>{peeling=false;peelPointer=null;if(!solved('moon')){peelProgress=0;peel.style.setProperty('--peel','0');}};
  ['pointerup','pointercancel','lostpointercapture'].forEach(name=>peel.addEventListener(name,endPeel));
  peel.addEventListener('keydown',event=>{
    if(event.key!=='ArrowLeft')return;event.preventDefault();if(solved('moon'))return;
    peelProgress=Math.min(1,peelProgress+1/3+.001);peel.style.setProperty('--peel',String(peelProgress));if(peelProgress>=1)discover('moon');
  });

  function renderSolved() {
    constellation.classList.toggle('solved',solved('orbit'));drawOrbit();
    ink.classList.toggle('bloomed',solved('ink'));$('#ink-secret').hidden=!solved('ink');
    if(solved('ink'))ink.style.setProperty('--hold','1');
    stamp.classList.toggle('cleared',solved('scratch'));
    peel.classList.toggle('peeled',solved('moon'));
    $('#garden').classList.toggle('solved',solved('garden'));
    if(solved('garden'))$$('.garden-flower').forEach(f=>f.classList.toggle('rhythm',gardenOrder.includes(Number(f.dataset.flower))));
    const current=new Set(experience.progress());
    if(current.size>lastFound.size){const button=$('#discovery-button');button.animate([{transform:'scale(1)'},{transform:'scale(1.07)'},{transform:'scale(1)'}],{duration:reduced.matches?1:450});}
    lastFound=current;
  }
  document.addEventListener('birthday-progress',renderSolved);
  document.addEventListener('birthday-reset',()=>{
    cancelHold();orbitStep=0;endOrbit();gardenStep=0;peelProgress=0;endPeel();coatStamp();
    ink.style.setProperty('--hold','0');$$('.garden-flower').forEach(f=>f.classList.remove('rhythm','touched'));renderSolved();
  });
  coatStamp();renderSolved();

  // A thin reading line, quiet drifting motes, and stardust under the pointer.
  function updateReading(){const max=document.documentElement.scrollHeight-innerHeight;$('.reading-progress').style.setProperty('--reading',(max>0?scrollY/max*100:0)+'%');}
  addEventListener('scroll',updateReading,{passive:true});addEventListener('resize',updateReading);updateReading();
  const hero=$('.hero-art');
  hero.addEventListener('pointermove',event=>{if(reduced.matches||event.pointerType!=='mouse')return;const r=hero.getBoundingClientRect();hero.style.setProperty('--mx',String((event.clientX-r.left)/r.width-.5));hero.style.setProperty('--my',String((event.clientY-r.top)/r.height-.5));});
  hero.addEventListener('pointerleave',()=>{hero.style.setProperty('--mx','0');hero.style.setProperty('--my','0');});
  const ambient=$('#ambient-magic'),a=ambient.getContext('2d');let ambientFrame=null,lastAmbient=0,mw=innerWidth,mh=innerHeight,trails=[];
  const motes=Array.from({length:25},(_,i)=>({x:Math.random(),y:Math.random(),speed:.000014+Math.random()*.000018,phase:Math.random()*6.28,size:1+Math.random()*1.5,color:i%2?'#c29a45':'#c28098'}));
  function resizeAmbient(){mw=innerWidth;mh=innerHeight;const d=Math.min(devicePixelRatio||1,2);ambient.width=mw*d;ambient.height=mh*d;if(a)a.setTransform(d,0,0,d,0,0);}
  resizeAmbient();addEventListener('resize',resizeAmbient);
  function drawAmbient(time){
    if(!a||reduced.matches||document.hidden){ambientFrame=null;return;}
    const dt=Math.min(time-lastAmbient||16,50);lastAmbient=time;a.clearRect(0,0,mw,mh);
    for(const p of motes){p.y-=p.speed*dt;if(p.y<-.02)p.y=1.02;const x=p.x*mw+Math.sin(time*.0004+p.phase)*15,y=p.y*mh;a.globalAlpha=.12+.08*Math.sin(time*.001+p.phase);a.fillStyle=p.color;a.beginPath();a.arc(x,y,p.size,0,Math.PI*2);a.fill();}
    trails=trails.filter(p=>p.life<650);
    for(const p of trails){p.life+=dt;p.y-=dt*.017;a.globalAlpha=(1-p.life/650)*.6;a.fillStyle=p.color;a.save();a.translate(p.x,p.y);a.rotate(p.life*.002);const r=p.size*(1-p.life/1000);a.beginPath();a.moveTo(0,-r);a.lineTo(r*.28,-r*.28);a.lineTo(r,0);a.lineTo(r*.28,r*.28);a.lineTo(0,r);a.lineTo(-r*.28,r*.28);a.lineTo(-r,0);a.lineTo(-r*.28,-r*.28);a.closePath();a.fill();a.restore();}a.globalAlpha=1;
    ambientFrame=requestAnimationFrame(drawAmbient);
  }
  let lastTrail=0;
  document.addEventListener('pointermove',event=>{if(reduced.matches||event.pointerType!=='mouse'||performance.now()-lastTrail<45)return;lastTrail=performance.now();trails.push({x:event.clientX,y:event.clientY,life:0,size:3+Math.random()*3,color:Math.random()>.5?'#bf8494':'#d2b063'});trails=trails.slice(-32);},{passive:true});
  document.addEventListener('pointerdown',event=>{if(reduced.matches)return;const ring=document.createElement('span');ring.className='magic-ripple';ring.setAttribute('aria-hidden','true');ring.style.left=event.clientX+'px';ring.style.top=event.clientY+'px';document.body.append(ring);ring.addEventListener('animationend',()=>ring.remove(),{once:true});setTimeout(()=>ring.remove(),800);},{passive:true});
  function startAmbient(){if(a&&!ambientFrame&&!reduced.matches&&!document.hidden){lastAmbient=performance.now();ambientFrame=requestAnimationFrame(drawAmbient);}}
  function stopAmbient(){if(ambientFrame)cancelAnimationFrame(ambientFrame);ambientFrame=null;if(a)a.clearRect(0,0,mw,mh);}
  startAmbient();

  // The reward is an actual separate scene. Fireworks live inside its dialog.
  const dialog=$('#gift-dialog'),fireworks=$('#fireworks'),f=fireworks.getContext('2d');
  let fw=innerWidth,fh=innerHeight,fireFrame=null,lastFire=0,rockets=[],sparks=[],fireTimers=[],revealTimer=null;
  function resizeFire(){fw=innerWidth;fh=innerHeight;const d=Math.min(devicePixelRatio||1,2);fireworks.width=fw*d;fireworks.height=fh*d;if(f)f.setTransform(d,0,0,d,0,0);}
  resizeFire();addEventListener('resize',resizeFire);
  const colors=['#f1ca79','#eaa4c1','#91bdd4','#c6b2ef','#f4e6c1'];
  function explode(x,y,color){for(let i=0;i<65;i++){const angle=Math.PI*2*i/65+Math.random()*.1,speed=1.4+Math.random()*3.3;sparks.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:0,max:75+Math.random()*30,color,size:1+Math.random()*1.3});}sparks=sparks.slice(-650);}
  function launch(){if(!dialog.open||!f||reduced.matches||document.hidden)return;const x=fw*(.12+Math.random()*.76),target=fh*(.13+Math.random()*.4);rockets.push({x,y:fh+20,target,color:colors[Math.floor(Math.random()*colors.length)]});if(!fireFrame){lastFire=performance.now();fireFrame=requestAnimationFrame(drawFire);}}
  function drawFire(time){
    if(!dialog.open||document.hidden||reduced.matches){stopFire();return;}const step=Math.min((time-lastFire)/16.67,2.5);lastFire=time;f.clearRect(0,0,fw,fh);
    for(const r of rockets){r.y-=12*step;f.strokeStyle=r.color;f.globalAlpha=.6;f.lineWidth=1.3;f.beginPath();f.moveTo(r.x,r.y+24);f.lineTo(r.x,r.y);f.stroke();if(r.y<=r.target){explode(r.x,r.y,r.color);r.done=true;}}
    rockets=rockets.filter(r=>!r.done);sparks=sparks.filter(p=>p.life<p.max);
    for(const p of sparks){p.x+=p.vx*step;p.y+=p.vy*step;p.vy+=.022*step;p.vx*=.992;p.life+=step;f.globalAlpha=Math.max(0,1-p.life/p.max);f.fillStyle=p.color;f.beginPath();f.arc(p.x,p.y,p.size,0,Math.PI*2);f.fill();}f.globalAlpha=1;
    if(rockets.length||sparks.length)fireFrame=requestAnimationFrame(drawFire);else{fireFrame=null;f.clearRect(0,0,fw,fh);}
  }
  function stopFire(){fireTimers.forEach(clearTimeout);fireTimers=[];if(fireFrame)cancelAnimationFrame(fireFrame);fireFrame=null;rockets=[];sparks=[];if(f)f.clearRect(0,0,fw,fh);}
  function fireworksShow(){if(!dialog.open||reduced.matches)return;stopFire();for(let i=0;i<12;i++)fireTimers.push(setTimeout(launch,i*650));}
  document.addEventListener('birthday-finale',()=>{
    clearTimeout(revealTimer);dialog.classList.remove('opening','ready');void dialog.offsetWidth;dialog.classList.add('opening');
    if(reduced.matches)dialog.classList.add('ready');else revealTimer=setTimeout(()=>dialog.classList.add('ready'),1100);
    fireworksShow();
  });
  document.addEventListener('birthday-fireworks',fireworksShow);
  dialog.addEventListener('close',()=>{clearTimeout(revealTimer);stopFire();dialog.classList.remove('ready','opening');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAmbient();stopFire();cancelHold();}else startAmbient();});
  reduced.addEventListener('change',()=>{if(reduced.matches){stopAmbient();stopFire();if(dialog.open)dialog.classList.add('ready');}else startAmbient();});
})();
