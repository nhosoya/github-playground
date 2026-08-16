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
    #muteGame{border:0;font:inherit;font-weight:900;color:#344;background:rgba(255,255,255,.92);box-shadow:0 4px 12px rgba(0,0,0,.12);touch-action:manipulation;position:absolute;left:14px;bottom:max(16px,calc(env(safe-area-inset-bottom) + 7px));z-index:31;width:50px;height:50px;padding:0;border-radius:50%;display:grid;place-items:center;font-size:23px;line-height:1}
    #muteGame.armed{background:#fff0b8;transform:scale(1.08);font-size:17px;width:92px;border-radius:999px;padding:0 10px}
    body.night-mode #muteGame{background:rgba(248,248,255,.94);color:#20284d;box-shadow:0 4px 14px rgba(0,0,0,.3)}
  `;
  document.head.appendChild(style);

  const game=document.getElementById('game');
  let gameButton=null,armedUntil=0,resetTimer=null;

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
    if(gameButton&&!gameButton.classList.contains('armed')){
      gameButton.textContent=muted?'🔇':'🔊';
      gameButton.setAttribute('aria-pressed',muted?'true':'false');
      gameButton.setAttribute('aria-label',muted?'音を出す':'ミュートにする');
    }
  }
  updateUI();
})();
