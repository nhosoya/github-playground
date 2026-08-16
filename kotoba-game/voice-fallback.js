(()=>{
  if (!('speechSynthesis' in window) || !('indexedDB' in window)) return;

  const emojiToWord = new Map([
    ['🐶',['わんわん','wanwan']],['🐱',['にゃー','nyaa']],['🐥',['ぴよぴよ','piyopiyo']],
    ['🐸',['けろけろ','kerokero']],['🦁',['がおー','gaoo']],['🐰',['うさぎ','usagi']],
    ['🐳',['くじら','kujira']],['🐼',['ぱんだ','panda']],['🚗',['ぶーぶー','buubuu']],
    ['🚌',['ばす','bus']],['🚃',['でんしゃ','densha']],['✈️',['ひこうき','hikouki']],
    ['⭐',['きらきら','kirakira']],['⚽️',['ぼーる','ball']],['⚽',['ぼーる','ball']],
    ['🍎',['りんご','ringo']],['🍌',['ばなな','banana']],['🍓',['いちご','ichigo']],
    ['🧸',['くま','kuma']],['👶',['あかちゃん','akachan']],['👨',['ぱぱ','papa']],['👩',['まま','mama']]
  ]);

  const recorded = new Set();
  let jaVoice = null;

  function refreshVoice(){
    const voices = speechSynthesis.getVoices();
    jaVoice = voices.find(v => v.lang === 'ja-JP') ||
              voices.find(v => /^ja(?:-|_)/i.test(v.lang)) ||
              null;
  }
  refreshVoice();
  speechSynthesis.addEventListener?.('voiceschanged', refreshVoice);

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
      u.rate=.76;
      u.pitch=1.08;
      u.volume=1;
      speechSynthesis.speak(u);
    }catch(e){}
  }

  // Capture phase is intentional: on iOS, start SpeechSynthesis directly from the
  // user's gesture before the game's WebAudio/tap handler runs.
  document.addEventListener('pointerdown',e=>{
    const toy=e.target.closest?.('.toy');
    if(!toy) return;

    const pair=emojiToWord.get(toy.textContent.trim());
    if(!pair) return;
    const [text,key]=pair;
    if(recorded.has(key)) return;

    speak(text);
  },{capture:true,passive:true});
})();
