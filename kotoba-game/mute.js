(()=>{
  const KEY='kotoba-muted';
  let muted=localStorage.getItem(KEY)==='1';
  const contexts=new Set(),activeOscillators=new Set(),activeMedia=new Set();

  window.kotobaIsMuted=()=>muted;

  function wrapAudioContext(Ctor){
    if(!Ctor)return null;
    function WrappedAudioContext(...args){
      const ctx=new Ctor(...args);
      contexts.add(ctx);
      const nativeCreateOscillator=ctx.createOscillator.bind(ctx);
      ctx.createOscillator=()=>{
        const osc=nativeCreateOscillator();
        const nativeStart=osc.start.bind(osc),nativeStop=osc.stop.bind(osc);
        let started=false,skipped=false;
        osc.start=(...startArgs)=>{
          if(muted){skipped=true;return;}
          started=true;activeOscillators.add(osc);
          osc.addEventListener('ended',()=>activeOscillators.delete(osc),{once:true});
          return nativeStart(...startArgs);
        };
        osc.stop=(...stopArgs)=>{
          if(skipped||!started)return;
          try{return nativeStop(...stopArgs)}catch(e){}
        };
        return osc;
      };
      return ctx;
    }
    WrappedAudioContext.prototype=Ctor.prototype;
    Object.setPrototypeOf(WrappedAudioContext,Ctor);
    return WrappedAudioContext;
  }

  const NativeAudioContext=window.AudioContext;
  const NativeWebkitAudioContext=window.webkitAudioContext;
  if(NativeAudioContext)window.AudioContext=wrapAudioContext(NativeAudioContext);
  if(NativeWebkitAudioContext&&NativeWebkitAudioContext!==NativeAudioContext)window.webkitAudioContext=wrapAudioContext(NativeWebkitAudioContext);
  else if(NativeAudioContext)window.webkitAudioContext=window.AudioContext;

  const nativeMediaPlay=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){
    if(muted)return Promise.resolve();
    activeMedia.add(this);
    const done=()=>activeMedia.delete(this);
    this.addEventListener('ended',done,{once:true});
    this.addEventListener('pause',done,{once:true});
    return nativeMediaPlay.apply(this,args);
  };

  let nativeSpeak=null;
  if('speechSynthesis' in window){
    nativeSpeak=window.speechSynthesis.speak.bind(window.speechSynthesis);
    try{window.speechSynthesis.speak=utterance=>{if(!muted)nativeSpeak(utterance)}}catch(e){}
  }

  function silenceNow(){
    activeOscillators.forEach(osc=>{try{osc.stop()}catch(e){}});activeOscillators.clear();
    activeMedia.forEach(media=>{try{media.pause();media.currentTime=0}catch(e){}});activeMedia.clear();
    try{window.speechSynthesis?.cancel()}catch(e){}
  }

  function setMuted(value){
    muted=!!value;
    localStorage.setItem(KEY,muted?'1':'0');
    if(muted)silenceNow();
    updateUI();
    window.dispatchEvent(new CustomEvent('kotoba-mute-change',{detail:{muted}}));
  }
  window.kotobaSetMuted=setMuted;

  const style=document.createElement('style');
  style.textContent=`
    #muteStart,#muteGame{border:0;border-radius:999px;font:inherit;font-weight:900;color:#344;background:rgba(255,255,255,.92);box-shadow:0 4px 12px rgba(0,0,0,.12);touch-action:manipulation}
    #muteStart{position:absolute;left:50%;bottom:max(14vh,calc(env(safe-area-inset-bottom) + 92px));transform:translateX(-50%);padding:11px 17px;z-index:55;white-space:nowrap}
    #muteGame{position:absolute;left:12px;bottom:max(18px,calc(env(safe-area-inset-bottom) + 8px));z-index:31;padding:11px 15px;min-width:112px}
    #muteGame.armed{background:#fff0b8;transform:scale(1.05)}
    body.night-mode #muteGame{background:rgba(248,248,255,.94);color:#20284d;box-shadow:0 4px 14px rgba(0,0,0,.3)}
  `;
  document.head.appendChild(style);

  const start=document.getElementById('start'),game=document.getElementById('game');
  let startButton=null,gameButton=null,armedUntil=0,resetTimer=null;

  if(start){
    startButton=document.createElement('button');
    startButton.id='muteStart';startButton.type='button';
    startButton.addEventListener('pointerdown',e=>e.stopPropagation());
    startButton.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setMuted(!muted)});
    start.appendChild(startButton);
  }
  if(game){
    gameButton=document.createElement('button');
    gameButton.id='muteGame';gameButton.type='button';
    gameButton.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation()},{passive:false});
    gameButton.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const now=Date.now();
      if(now<armedUntil){armedUntil=0;clearTimeout(resetTimer);gameButton.classList.remove('armed');setMuted(!muted);return;}
      armedUntil=now+1200;gameButton.classList.add('armed');gameButton.textContent='もう1かい';
      resetTimer=setTimeout(()=>{armedUntil=0;gameButton.classList.remove('armed');updateUI()},1200);
    });
    game.appendChild(gameButton);
  }

  function updateUI(){
    const text=muted?'🔇 ミュート':'🔊 おとあり';
    if(startButton){startButton.textContent=text;startButton.setAttribute('aria-pressed',muted?'true':'false')}
    if(gameButton&&!gameButton.classList.contains('armed')){gameButton.textContent=text;gameButton.setAttribute('aria-pressed',muted?'true':'false')}
  }
  updateUI();
})();
