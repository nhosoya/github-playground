(()=>{
  if(!('indexedDB' in window))return;
  const EMOJI_TO_KEY=new Map([['🐶','wanwan'],['👶','akachan'],['👨','papa'],['👩','mama']]);
  const DB_NAME='kotoba-photo-db',STORE='photos';
  const photoUrls=new Map();

  const style=document.createElement('style');
  style.textContent=`
    .toy.has-photo{background-position:center!important;background-size:cover!important;background-repeat:no-repeat!important;font-size:0!important;overflow:hidden}
    .toy.has-photo::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 5px rgba(255,255,255,.58);pointer-events:none}
  `;
  document.head.appendChild(style);

  function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function getAll(){try{const db=await openDB();return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),store=tx.objectStore(STORE),req=store.getAll(),keys=store.getAllKeys();let values,ks;const done=()=>{if(values&&ks)resolve(ks.map((k,i)=>[String(k),values[i]]))};req.onsuccess=()=>{values=req.result||[];done()};keys.onsuccess=()=>{ks=keys.result||[];done()};req.onerror=keys.onerror=()=>reject(req.error||keys.error)})}catch(e){return[]}}
  async function refresh(){
    photoUrls.forEach(url=>URL.revokeObjectURL(url));photoUrls.clear();
    for(const [key,blob] of await getAll())photoUrls.set(key,URL.createObjectURL(blob));
    applyAll();
  }
  function applyToy(toy){
    if(!toy||!toy.classList?.contains('toy'))return;
    // Custom cards already own their background image. Do not touch them here.
    if(toy.classList.contains('custom-photo') || String(toy.dataset.voiceKey||'').startsWith('custom:')) return;
    const emoji=toy.textContent.trim(),key=EMOJI_TO_KEY.get(emoji);
    // This helper only manages the four built-in photo-enabled cards.
    if(!key) return;
    const url=photoUrls.get(key);
    if(url){toy.classList.add('has-photo');toy.style.backgroundImage=`url("${url}")`}
    else{toy.classList.remove('has-photo');toy.style.backgroundImage=''}
  }
  function applyAll(){document.querySelectorAll('.toy').forEach(applyToy)}

  const observer=new MutationObserver(muts=>{for(const m of muts)for(const n of m.addedNodes){if(n.nodeType===1){if(n.classList?.contains('toy'))applyToy(n);n.querySelectorAll?.('.toy').forEach(applyToy)}}});
  observer.observe(document.getElementById('game')||document.body,{childList:true,subtree:true});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
  window.addEventListener('pageshow',refresh);
  refresh();
})();
