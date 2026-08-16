(()=>{
  if(!('indexedDB' in window))return;
  const TARGETS=new Set(['wanwan','akachan','papa','mama']);
  const DB_NAME='kotoba-photo-db',STORE='photos';

  const style=document.createElement('style');
  style.textContent=`
    .photo-actions{display:flex;gap:8px;justify-content:center;margin-top:9px;flex-wrap:wrap}
    .photo-actions button{border:0;border-radius:999px;padding:9px 12px;font-size:13px;font-weight:900;background:#fff3c8;color:#344}
    .photo-actions .remove-photo{background:#eef3f5}
    .photo-preview{width:72px;height:72px;border-radius:18px;object-fit:cover;margin:9px auto 0;display:none;box-shadow:0 3px 10px #0002}
    .photo-preview.show{display:block}
  `;
  document.head.appendChild(style);

  function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function getPhoto(key){const db=await openDB();return new Promise((resolve,reject)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}
  async function putPhoto(key,blob){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(blob,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
  async function deletePhoto(key){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}

  function resizeSquare(file){return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{
      try{
        const size=512,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
        const ctx=canvas.getContext('2d');
        const scale=Math.max(size/img.naturalWidth,size/img.naturalHeight);
        const w=img.naturalWidth*scale,h=img.naturalHeight*scale;
        ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);
        canvas.toBlob(blob=>{URL.revokeObjectURL(url);blob?resolve(blob):reject(new Error('画像を変換できませんでした'))},'image/jpeg',.86);
      }catch(e){URL.revokeObjectURL(url);reject(e)}
    };
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('画像を読み込めませんでした'))};
    img.src=url;
  })}

  async function refresh(card,key,preview,removeBtn){
    const blob=await getPhoto(key),old=preview.dataset.url;
    if(old)URL.revokeObjectURL(old);
    if(blob){const url=URL.createObjectURL(blob);preview.src=url;preview.dataset.url=url;preview.classList.add('show');removeBtn.disabled=false}
    else{preview.removeAttribute('src');preview.dataset.url='';preview.classList.remove('show');removeBtn.disabled=true}
  }

  document.querySelectorAll('.card[data-key]').forEach(card=>{
    const key=card.dataset.key;if(!TARGETS.has(key))return;
    const actions=document.createElement('div');actions.className='photo-actions';
    actions.innerHTML='<button type="button" class="choose-photo">🖼️ 写真をえらぶ</button><button type="button" class="remove-photo">写真を消す</button>';
    const preview=document.createElement('img');preview.className='photo-preview';preview.alt='登録した写真';
    card.append(actions,preview);
    const choose=actions.querySelector('.choose-photo'),remove=actions.querySelector('.remove-photo');
    const input=document.createElement('input');input.type='file';input.accept='image/*';input.hidden=true;document.body.appendChild(input);
    choose.addEventListener('click',()=>input.click());
    input.addEventListener('change',async()=>{const file=input.files?.[0];input.value='';if(!file)return;try{choose.disabled=true;choose.textContent='保存中…';const blob=await resizeSquare(file);await putPhoto(key,blob);await refresh(card,key,preview,remove)}catch(e){alert('写真を保存できませんでした')}finally{choose.disabled=false;choose.textContent='🖼️ 写真をえらぶ'}});
    remove.addEventListener('click',async()=>{if(!confirm('この写真を消しますか？'))return;await deletePhoto(key);await refresh(card,key,preview,remove)});
    refresh(card,key,preview,remove);
  });
})();
