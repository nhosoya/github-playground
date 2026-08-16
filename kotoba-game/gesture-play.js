(()=>{
  const game=document.getElementById('game');
  if(!game)return;

  const style=document.createElement('style');
  style.textContent=`
    .toy.gesture-held{animation:none!important;transition:transform .08s linear,left .03s linear,top .03s linear,filter .15s ease;filter:drop-shadow(0 14px 12px rgba(0,0,0,.2)) brightness(1.03);z-index:18}
    .trail-speck,.trail-rail,.trail-bubble{position:absolute;pointer-events:none;z-index:8;transform:translate(-50%,-50%);animation:trailFade .95s ease-out forwards}
    .trail-speck{font-size:18px;filter:drop-shadow(0 0 6px rgba(255,255,255,.75))}
    .trail-bubble{font-size:17px}
    .trail-rail{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.9);box-shadow:0 0 8px rgba(255,255,255,.65)}
    .trail-tie{position:absolute;pointer-events:none;z-index:7;width:28px;height:4px;border-radius:999px;background:rgba(126,92,66,.55);transform-origin:center;animation:trailFade .95s ease-out forwards}
    @keyframes trailFade{0%{opacity:.95;transform:translate(-50%,-50%) scale(.7)}45%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.25)}}
  `;
  document.head.appendChild(style);

  const blocked=el=>!!el?.closest?.('.toy,#recordLink,#muteGame,.sun,.cloud,button,a');
  let toyGesture=null,bgGesture=null,holdTimer=null,trailTimer=null,lastSound=0;
  let trailAudio=null,trailNoteIndex=0;

  function isMuted(){return !!window.kotobaIsMuted?.()}
  function softNote(){
    if(isMuted()||performance.now()-lastSound<165)return;
    lastSound=performance.now();
    try{
      if(!trailAudio)trailAudio=new (window.AudioContext||window.webkitAudioContext)();
      if(trailAudio.state==='suspended')trailAudio.resume();
      const notes=[523,659,784,988,784,659],f=notes[trailNoteIndex++%notes.length];
      const o=trailAudio.createOscillator(),g=trailAudio.createGain();
      o.type='sine';o.frequency.value=f;
      const now=trailAudio.currentTime;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.018,now+.015);g.gain.exponentialRampToValueAtTime(.0001,now+.12);
      o.connect(g).connect(trailAudio.destination);o.start(now);o.stop(now+.14);
    }catch(e){}
  }

  function addEl(className,x,y,text=''){
    const el=document.createElement('div');el.className=className;el.style.left=x+'px';el.style.top=y+'px';if(text)el.textContent=text;game.appendChild(el);setTimeout(()=>el.remove(),1000);return el;
  }
  function spawnTrail(x,y,mode,angle=0,withSound=true){
    if(mode===0){
      const glyphs=['✦','✨','⋆','⭐'];
      for(let i=0;i<2;i++)addEl('trail-speck',x+(Math.random()-.5)*20,y+(Math.random()-.5)*20,glyphs[Math.random()*glyphs.length|0]);
    }else if(mode===1){
      const nx=Math.cos(angle+Math.PI/2)*10,ny=Math.sin(angle+Math.PI/2)*10;
      addEl('trail-rail',x+nx,y+ny);addEl('trail-rail',x-nx,y-ny);
      const tie=addEl('trail-tie',x,y);tie.style.transform=`translate(-50%,-50%) rotate(${angle}rad)`;
    }else{
      const glyphs=['🫧','♪','·','✨'];
      addEl('trail-bubble',x+(Math.random()-.5)*16,y+(Math.random()-.5)*16,glyphs[Math.random()*glyphs.length|0]);
    }
    if(withSound)softNote();
  }

  function startBg(e){
    if(blocked(e.target))return;
    bgGesture={id:e.pointerId,mode:Math.random()*3|0,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,lastSpawn:0,angle:0};
    try{game.setPointerCapture(e.pointerId)}catch(err){}
    clearInterval(trailTimer);
    trailTimer=setInterval(()=>{
      if(!bgGesture)return;
      const jx=bgGesture.x+(Math.random()-.5)*10,jy=bgGesture.y+(Math.random()-.5)*10;
      spawnTrail(jx,jy,bgGesture.mode,bgGesture.angle,true);
    },125);
  }
  function moveBg(e){
    if(!bgGesture||e.pointerId!==bgGesture.id)return;
    const dx=e.clientX-bgGesture.lastX,dy=e.clientY-bgGesture.lastY,dist=Math.hypot(dx,dy);
    bgGesture.x=e.clientX;bgGesture.y=e.clientY;
    if(dist<7)return;
    const angle=Math.atan2(dy,dx);bgGesture.angle=angle;
    const steps=Math.min(5,Math.max(1,Math.floor(dist/12)));
    for(let i=1;i<=steps;i++){
      const t=i/steps,x=bgGesture.lastX+dx*t,y=bgGesture.lastY+dy*t;
      spawnTrail(x,y,bgGesture.mode,angle,i===steps);
    }
    bgGesture.lastX=e.clientX;bgGesture.lastY=e.clientY;
  }
  function endBg(e){
    if(!bgGesture||e.pointerId!==bgGesture.id)return;
    clearInterval(trailTimer);trailTimer=null;bgGesture=null;
    try{game.releasePointerCapture(e.pointerId)}catch(err){}
  }

  function startToy(e,toy){
    e.preventDefault();e.stopImmediatePropagation();
    const rect=toy.getBoundingClientRect();
    const startLeft=parseFloat(toy.style.left)||rect.left;
    const startTop=parseFloat(toy.style.top)||rect.top;
    toyGesture={id:e.pointerId,toy,startX:e.clientX,startY:e.clientY,startLeft,startTop,dx:0,dy:0,long:false};
    toy.classList.add('gesture-held');
    toy.style.setProperty('transform','scale(1.12)','important');
    try{toy.setPointerCapture(e.pointerId)}catch(err){}
    clearTimeout(holdTimer);
    holdTimer=setTimeout(()=>{
      if(!toyGesture||toyGesture.toy!==toy)return;
      toyGesture.long=true;
      toy.style.setProperty('transform','scale(1.26)','important');
      toy.animate([{filter:'brightness(1)'},{filter:'brightness(1.16)'},{filter:'brightness(1)'}],{duration:420});
    },360);
  }
  function moveToy(e){
    if(!toyGesture||e.pointerId!==toyGesture.id)return;
    e.preventDefault();
    const toy=toyGesture.toy;
    const rect=toy.getBoundingClientRect();
    const maxX=Math.max(0,innerWidth-rect.width);
    const minY=Math.max(0,envSafeTop());
    const maxY=Math.max(minY,innerHeight-rect.height);
    const wantedLeft=toyGesture.startLeft+(e.clientX-toyGesture.startX);
    const wantedTop=toyGesture.startTop+(e.clientY-toyGesture.startY);
    const left=Math.max(0,Math.min(maxX,wantedLeft));
    const top=Math.max(minY,Math.min(maxY,wantedTop));
    toyGesture.dx=left-toyGesture.startLeft;toyGesture.dy=top-toyGesture.startTop;
    toy.style.left=left+'px';toy.style.top=top+'px';
    const distance=Math.hypot(toyGesture.dx,toyGesture.dy),scale=toyGesture.long?1.26:1.12+Math.min(.12,distance/500);
    toy.style.setProperty('transform',`scale(${scale})`,'important');
  }
  function envSafeTop(){
    const v=getComputedStyle(document.documentElement).getPropertyValue('--safe-top');
    return parseFloat(v)||0;
  }
  function finishToy(e,fire=true){
    if(!toyGesture||e.pointerId!==toyGesture.id)return;
    const {toy,startLeft,startTop}=toyGesture;clearTimeout(holdTimer);holdTimer=null;
    try{toy.releasePointerCapture(e.pointerId)}catch(err){}
    toy.style.transition='left .22s cubic-bezier(.2,.8,.2,1.2),top .22s cubic-bezier(.2,.8,.2,1.2),transform .22s cubic-bezier(.2,.8,.2,1.2)';
    toy.style.left=startLeft+'px';toy.style.top=startTop+'px';toy.style.setProperty('transform','scale(1)','important');
    toyGesture=null;
    setTimeout(()=>{
      if(!toy.isConnected)return;
      toy.classList.remove('gesture-held');toy.style.transition='';toy.style.removeProperty('transform');
    },220);
    if(!fire||!toy.isConnected)return;
    try{toy.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,clientX:e.clientX,clientY:e.clientY,pointerType:e.pointerType||'touch',pointerId:-1}))}catch(err){}
  }

  game.addEventListener('pointerdown',e=>{
    if(!e.isTrusted)return;
    const toy=e.target.closest?.('.toy');
    if(toy){startToy(e,toy);return;}
    startBg(e);
  },{capture:true,passive:false});
  game.addEventListener('pointermove',e=>{
    if(toyGesture&&e.pointerId===toyGesture.id){moveToy(e);return;}
    moveBg(e);
  },{capture:true,passive:false});
  game.addEventListener('pointerup',e=>{
    if(toyGesture&&e.pointerId===toyGesture.id){finishToy(e,true);return;}
    endBg(e);
  },{capture:true,passive:false});
  game.addEventListener('pointercancel',e=>{
    if(toyGesture&&e.pointerId===toyGesture.id){finishToy(e,false);return;}
    endBg(e);
  },{capture:true,passive:false});
})();
