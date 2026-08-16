(()=>{
  if (!('speechSynthesis' in window) || !('indexedDB' in window)) return;

  const wordToKey = new Map([
    ['わんわん','wanwan'],['にゃー','nyaa'],['ぴよぴよ','piyopiyo'],['けろけろ','kerokero'],
    ['がおー','gaoo'],['うさぎ','usagi'],['くじら','kujira'],['ぱんだ','panda'],
    ['ぶーぶー','buubuu'],['ばす','bus'],['でんしゃ','densha'],['ひこうき','hikouki'],
    ['きらきら','kirakira'],['ぼーる','ball'],['りんご','ringo'],['ばなな','banana'],
    ['いちご','ichigo'],['くま','kuma'],['あかちゃん','akachan'],['ぱぱ','papa'],['まま','mama']
  ]);

  const recorded = new Set();
  let jaVoice = null;

  function refreshVoice(){
    const voices = speechSynthesis.getVoices();
    jaVoice = voices.find(v => /^ja(?:-|_)/i.test(v.lang)) ||
              voices.find(v => v.lang === 'ja-JP') ||
              null;
  }
  refreshVoice();
  speechSynthesis.addEventListener?.('voiceschanged', refreshVoice);
  speechSynthesis.onvoiceschanged = refreshVoice;

  function openDB(){
    return new Promise((resolve,reject)=>{
      const r=indexedDB.open('kotoba-voice-db',1);
      r.onupgradeneeded=()=>{
        const db=r.result;
        if(!db.objectStoreNames.contains('voices')) db.createObjectStore('voices');
      };
      r.onsuccess=()=>resolve(r.result);
      r.onerror=()=>reject(r.error);
    });
  }

  async function refreshRecorded(){
    try{
      const db=await openDB();
      const keys=await new Promise((resolve,reject)=>{
        const r=db.transaction('voices','readonly').objectStore('voices').getAllKeys();
        r.onsuccess=()=>resolve(r.result||[]);
        r.onerror=()=>reject(r.error);
      });
      recorded.clear();
      keys.forEach(k=>recorded.add(String(k)));
    }catch(e){}
  }
  refreshRecorded();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) refreshRecorded()});
  window.addEventListener('pageshow',refreshRecorded);

  function speak(text){
    try{
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);
      u.lang='ja-JP';
      if(jaVoice) u.voice=jaVoice;
      u.rate=.72;
      u.pitch=1.02;
      u.volume=1;
      speechSynthesis.speak(u);
    }catch(e){}
  }

  document.addEventListener('pointerdown',e=>{
    const toy=e.target.closest?.('.toy');
    if(!toy) return;

    // The game's own handler updates #word synchronously before this bubbles to document.
    const text=document.getElementById('word')?.textContent?.trim();
    const key=wordToKey.get(text);
    if(!text || !key || recorded.has(key)) return;

    speak(text);
  });
})();
