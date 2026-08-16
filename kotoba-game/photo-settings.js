(()=>{
  if(!('indexedDB' in window))return;
  const TARGETS=new Map([
    ['wanwan',{label:'わんわん'}],
    ['akachan',{label:'あかちゃん'}],
    ['papa',{label:'ぱぱ'}],
    ['mama',{label:'まま'}]
  ]);
  const DB_NAME='kotoba-photo-db',STORE='photos';

  function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function getPhoto(key){const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}
  async function putPhoto(key,blob){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(blob,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
  async function deletePhoto(key){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}

  function resizeSquare(file){return new Promise((resolve,reject)=>=>{});}
})();
