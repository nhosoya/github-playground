(()=>{
  if (!('speechSynthesis' in window) || !('indexedDB' in window)) return;

  const VOICE_KEY='kotoba-tts-voice-uri';
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
  let japaneseVoices=[];
  let lastSpokenKey='',lastSpokenAt=0;

  function refreshVoice(){
    const voices = speechSynthesis.getVoices();
    japaneseVoices=voices.filter(v=>/^ja(?:-|_)/i.test(v.lang));
    const saved=localStorage.getItem(VOICE_KEY);
    jaVoice=(saved && japaneseVoices.find(v=>v.voiceURI===saved || v.name===saved)) ||
      japaneseVoices.find(v=>v.lang==='ja-JP' && v.localService) ||
      japaneseVoices.find(v=>v.lang==='ja-JP') ||
      japaneseVoices.find(v=>v.localService) || japaneseVoices[0] || null;
  }
  refreshVoice();
  speechSynthesis.addEventListener?.('voiceschanged', refreshVoice);
  window.addEventListener('storage',refreshVoice);
  window.addEventListener('pageshow',()=>{refreshVoice();refreshRecorded()});

  function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('kotoba-voice-db',1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('voices'))db.createObjectStore('voices')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function refreshRecorded(){try{const db=await openDB();const keys=await new Promise((resolve,reject)=>{const r=db.transaction('voices','readonly').objectStore('voices').getAllKeys();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)});recorded.clear();keys.forEach(k=>recorded.add(String(k)))}catch(e){}}
  refreshRecorded();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshRecorded();refreshVoice()}});

  function speak(text,key){
    const now=performance.now();
    if(key===lastSpokenKey&&now-lastSpokenAt<450)return;
    lastSpokenKey=key;lastSpokenAt=now;
    try{refreshVoice();speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';if(jaVoice)u.voice=jaVoice;u.rate=.88;u.pitch=1.0;u.volume=1;speechSynthesis.speak(u)}catch(e){}
  }
  function speakToy(toy){
    if(!toy)return;
    let text=toy.dataset.speak||'',key=toy.dataset.voiceKey||'';
    if(!text||!key){const pair=emojiToWord.get(toy.textContent.trim());if(!pair)return;[text,key]=pair}
    if(recorded.has(key))return;
    speak(text,key);
  }

  document.addEventListener('pointerup',e=>speakToy(e.target.closest?.('.toy')),{capture:true,passive:true});
  document.addEventListener('kotoba-speak-toy',e=>speakToy(e.target.closest?.('.toy')),{capture:true});
})();
