(()=>{
  const game=document.getElementById('game');
  const sun=document.querySelector('.sun');
  const clouds=[...document.querySelectorAll('.cloud')];
  if(!game||!sun)return;

  const style=document.createElement('style');
  style.textContent=`
    html,body,#game,.sun,.cloud,.ground,#hint{transition:background .9s ease,background-color .9s ease,color .7s ease,opacity .7s ease,filter .7s ease,box-shadow .7s ease}
    .sun{z-index:12;display:grid;place-items:center;cursor:pointer;touch-action:manipulation}
    body.night-mode,body.night-mode #game{background:linear-gradient(180deg,#111b46 0%,#26386d 58%,#536c77 100%)}
    body.night-mode .sun{background:transparent!important;box-shadow:none!important;font-size:min(17vw,122px);filter:drop-shadow(0 0 14px rgba(255,244,188,.38))}
    body.night-mode .cloud{opacity:.28;filter:brightness(.75) drop-shadow(0 6px 8px rgba(0,0,0,.16))}
    body.night-mode .ground{background:#557a62;box-shadow:inset 0 18px 0 rgba(255,255,255,.05)}
    body.night-mode #hint{color:#f5f1dc;text-shadow:0 2px 8px rgba(0,0,0,.45)}
    .sky-star{position:absolute;z-index:2;pointer-events:none;opacity:0;transform:scale(.3);animation:starIn .8s ease forwards,twinkle 2.1s ease-in-out .8s infinite alternate;filter:drop-shadow(0 0 6px rgba(255,255,255,.55))}
    .sky-star.out{animation:starOut .45s ease forwards!important}
    .cloud-spark{position:absolute;z-index:15;pointer-events:none;font-size:24px;animation:cloudSpark .8s ease-out forwards}
    @keyframes starIn{to{opacity:.92;transform:scale(1)}}
    @keyframes starOut{to{opacity:0;transform:scale(.2)}}
    @keyframes twinkle{from{opacity:.35;transform:scale(.8)}to{opacity:1;transform:scale(1.15)}}
    @keyframes cloudSpark{0%{opacity:1;transform:translate(-50%,-50%) scale(.35)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.25) rotate(90deg)}}
  `;
  document.head.appendChild(style);

  let night=false;
  let audioCtx=null;
  const stars=[];

  function ensureAudio(){
    if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')audioCtx.resume();
  }
  function note(freq,delay,duration=.32,gain=.045,type='sine'){
    ensureAudio();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type;
    o.frequency.setValueAtTime(freq,audioCtx.currentTime+delay);
    g.gain.setValueAtTime(.0001,audioCtx.currentTime+delay);
    g.gain.exponentialRampToValueAtTime(gain,audioCtx.currentTime+delay+.025);
    g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+delay+duration);
    o.connect(g).connect(audioCtx.destination);
    o.start(audioCtx.currentTime+delay);
    o.stop(audioCtx.currentTime+delay+duration+.05);
  }
  function nightChime(){
    [523,659,784,988].forEach((f,i)=>note(f,i*.09,.38,.04,i===3?'triangle':'sine'));
  }
  function dayChime(){
    [784,659,523,659,784].forEach((f,i)=>note(f,i*.065,.25,.04,i===4?'triangle':'sine'));
  }
  function makeStars(){
    if(stars.length)return;
    const glyphs=['✦','✧','⋆','★'];
    for(let i=0;i<22;i++){
      const s=document.createElement('div');
      s.className='sky-star';
      s.textContent=glyphs[Math.random()*glyphs.length|0];
      s.style.left=(4+Math.random()*92)+'%';
      s.style.top=(8+Math.random()*57)+'%';
      s.style.fontSize=(10+Math.random()*18)+'px';
      s.style.animationDelay=(Math.random()*.65)+'s,'+(0.8+Math.random()*.8)+'s';
      game.insertBefore(s,game.firstChild);
      stars.push(s);
    }
  }
  function removeStars(){
    stars.forEach(s=>s.classList.add('out'));
    setTimeout(()=>{while(stars.length)stars.pop().remove()},520);
  }
  function setNight(value){
    night=value;
    document.body.classList.toggle('night-mode',night);
    if(night){
      sun.textContent='🌙';
      sun.setAttribute('aria-label','ひるにする');
      makeStars();
      nightChime();
    }else{
      sun.textContent='';
      sun.setAttribute('aria-label','よるにする');
      removeStars();
      dayChime();
    }
  }

  sun.setAttribute('role','button');
  sun.setAttribute('aria-label','よるにする');
  sun.addEventListener('pointerdown',e=>{
    e.preventDefault();
    e.stopPropagation();
    sun.animate([{transform:'scale(1)'},{transform:'scale(.78) rotate(-14deg)'},{transform:'scale(1.12) rotate(8deg)'},{transform:'scale(1)'}],{duration:520,easing:'ease-out'});
    setNight(!night);
  },{passive:false});

  function cloudSpark(cloud,x,y){
    const rect=cloud.getBoundingClientRect();
    const cx=x||rect.left+rect.width/2,cy=y||rect.top+rect.height/2;
    const glyphs=night?['✨','⭐','✦']:['✨','🫧','💫'];
    for(let i=0;i<5;i++){
      const p=document.createElement('div');
      p.className='cloud-spark';
      p.textContent=glyphs[Math.random()*glyphs.length|0];
      p.style.left=cx+'px';p.style.top=cy+'px';
      const a=(Math.PI*2*i/5)+(Math.random()-.5)*.5,d=35+Math.random()*70;
      p.style.setProperty('--dx',Math.cos(a)*d+'px');
      p.style.setProperty('--dy',Math.sin(a)*d+'px');
      game.appendChild(p);
      setTimeout(()=>p.remove(),850);
    }
    [659,784,988].forEach((f,i)=>note(f,i*.055,.18,.025,'triangle'));
  }
  clouds.forEach(cloud=>cloud.addEventListener('pointerdown',e=>{
    e.preventDefault();
    e.stopPropagation();
    cloud.animate([{transform:getComputedStyle(cloud).transform},{transform:'translateY(7px) scale(.94)'},{transform:getComputedStyle(cloud).transform}],{duration:380,easing:'ease-out'});
    cloudSpark(cloud,e.clientX,e.clientY);
  },{passive:false}));
})();
