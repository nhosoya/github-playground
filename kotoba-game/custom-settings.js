(()=>{
  if(!('indexedDB' in window))return;
  const DB='kotoba-custom-db',STORE='items',VOICE_DB='kotoba-voice-db',VOICE_STORE='voices';
  const grid=document.getElementById('grid');
  if(!grid||document.getElementById('customWords'))return;

  const style=document.createElement('style');
  style.textContent=`
    #customWords{max-width:850px;margin:0 auto 20px;background:#ffffffd9;border-radius:24px;padding:16px;box-shadow:0 7px 20px #0001}
    #customWords h2{font-size:21px;margin:0 0 6px}#customWords .desc{font-size:13px;line-height:1.5;color:#667;margin:0 0 12px}
    .custom-form{display:grid;grid-template-columns:1fr 1fr;gap:8px}.custom-form input[type=text],.custom-edit input[type=text]{width:100%;border:0;border-radius:14px;padding:11px 12px;background:#eef3f5;color:#263238;font:inherit;font-size:15px;-webkit-user-select:text;user-select:text}
    .custom-form .wide{grid-column:1/-1}.custom-form button,.custom-item button{border:0;border-radius:999px;padding:10px 13px;font-weight:900;background:#dff6ff;color:#344}.custom-form .add{background:#ffd95a}
    #customPending{grid-column:1/-1;display:none;align-items:center;gap:12px;background:#fff;border-radius:18px;padding:10px}
    #customPending.show{display:flex}#customPending img{width:96px;height:96px;border-radius:18px;object-fit:cover;box-shadow:0 3px 10px #0002}
    #customPending .pending-copy{font-size:13px;line-height:1.5;font-weight:800;color:#566}
    #customList{display:grid;gap:10px;margin-top:14px}.custom-item{display:grid;grid-template-columns:74px 1fr;gap:12px;align-items:center;background:#fff;border-radius:20px;padding:12px}.custom-thumb{width:74px;height:74px;border-radius:18px;object-fit:cover;background:#eef3f5;display:grid;place-items:center;font-size:36px;overflow:hidden}.custom-thumb img{width:100%;height:100%;object-fit:cover}.custom-edit{display:grid;gap:7px}.custom-actions{display:flex;gap:7px;flex-wrap:wrap}.custom-actions .danger{background:#f4e7e7}.custom-actions .recording{background:#ff7188;color:#fff}.custom-status{font-size:12px;font-weight:800;color:#667}
    @media(max-width:520px){.custom-form{grid-template-columns:1fr}.custom-form .wide,#customPending{grid-column:auto}.custom-item{grid-template-columns:64px 1fr}.custom-thumb{width:64px;height:64px}#customPending img{width:84px;height:84px}}
  `;
  document.head.appendChild(style);

  const section=document.createElement('section');section.id='customWords';
  section.innerHTML=`<h2>じぶんのことば</h2><p class="desc">好きな写真とことばを追加できます。表示する名前と、実際に読み上げることばは別々にできます。</p><div class="custom-form"><input id="customLabel" type="text" maxlength="20" placeholder="表示する名前（例：おばあちゃん）"><input id="customSpeak" type="text" maxlength="40" placeholder="読み上げることば（空なら同じ）"><button id="customPhoto" type="button">🖼️ 写真をえらぶ</button><button id="customAdd" class="add" type="button">＋ 追加</button><div id="customPending"><img id="customPendingImage" alt="選んだ写真"><div class="pending-copy">✓ この写真で追加します<br><span id="customPendingHint">別の写真を選び直すこともできます</span></div></div><div id="customPhotoName" class="wide custom-status">写真なしでも追加できます</div></div><div id="customList"></div>`;
  grid.parentNode.insertBefore(section,grid);

  const labelInput=section.querySelector('#customLabel'),speakInput=section.querySelector('#customSpeak'),photoBtn=section.querySelector('#customPhoto'),addBtn=section.querySelector('#customAdd'),photoName=section.querySelector('#customPhotoName'),pendingBox=section.querySelector('#customPending'),pendingImg=section.querySelector('#customPendingImage'),list=section.querySelector('#customList');
  const newPhotoInput=document.createElement('input');newPhotoInput.type='file';newPhotoInput.accept='image/*';newPhotoInput.hidden=true;document.body.appendChild(newPhotoInput);
  let pendingPhoto=null,pendingUrl='';

  function openCustom(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  function openVoice(){return new Promise((resolve,reject)=>{const r=indexedDB.open(VOICE_DB,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(VOICE_STORE))db.createObjectStore(VOICE_STORE)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function allItems(){const db=await openCustom();return new Promise((resolve,reject)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})}
  async function saveItem(item){const db=await openCustom();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(item);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
  async function deleteItem(id){const db=await openCustom();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
  const voiceKey=id=>'custom:'+id;
  async function getVoice(id){const db=await openVoice();return new Promise((resolve,reject)=>{const r=db.transaction(VOICE_STORE,'readonly').objectStore(VOICE_STORE).get(voiceKey(id));r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}
  async function putVoice(id,blob){const db=await openVoice();return new Promise((resolve,reject)=>{const tx=db.transaction(VOICE_STORE,'readwrite');tx.objectStore(VOICE_STORE).put(blob,voiceKey(id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
  async function removeVoice(id){const db=await openVoice();return new Promise((resolve,reject)=>{const tx=db.transaction(VOICE_STORE,'readwrite');tx.objectStore(VOICE_STORE).delete(voiceKey(id));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}

  function resizeSquare(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{try{const size=512,canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;const ctx=canvas.getContext('2d'),scale=Math.max(size/img.naturalWidth,size/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);canvas.toBlob(blob=>{URL.revokeObjectURL(url);blob?resolve(blob):reject(new Error())},'image/jpeg',.86)}catch(e){URL.revokeObjectURL(url);reject(e)}};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error())};img.src=url})}
  function clearPending(){pendingPhoto=null;if(pendingUrl){URL.revokeObjectURL(pendingUrl);pendingUrl=''}pendingImg.removeAttribute('src');pendingBox.classList.remove('show');photoName.textContent='写真なしでも追加できます'}
  function showPending(blob){if(pendingUrl)URL.revokeObjectURL(pendingUrl);pendingUrl=URL.createObjectURL(blob);pendingImg.src=pendingUrl;pendingBox.classList.add('show');photoName.textContent='✓ 写真を選びました'}

  photoBtn.addEventListener('click',()=>newPhotoInput.click());
  newPhotoInput.addEventListener('change',async()=>{const f=newPhotoInput.files?.[0];newPhotoInput.value='';if(!f)return;try{photoBtn.disabled=true;photoBtn.textContent='準備中…';pendingPhoto=await resizeSquare(f);showPending(pendingPhoto)}catch(e){alert('写真を読み込めませんでした')}finally{photoBtn.disabled=false;photoBtn.textContent='🖼️ 写真をえらぶ'}});
  addBtn.addEventListener('click',async()=>{const label=labelInput.value.trim(),speak=(speakInput.value.trim()||label);if(!label){alert('表示する名前を入力してください');return}const id=(crypto.randomUUID?.()||Date.now().toString(36)+Math.random().toString(36).slice(2));await saveItem({id,label,speak,photo:pendingPhoto||null,createdAt:Date.now()});labelInput.value='';speakInput.value='';clearPending();await render()});

  let active=null;
  async function render(){
    const items=(await allItems()).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));list.innerHTML='';
    if(!items.length){list.innerHTML='<div class="custom-status">まだ追加したことばはありません</div>';return}
    for(const item of items){
      const row=document.createElement('div');row.className='custom-item';
      const thumb=document.createElement('div');thumb.className='custom-thumb';if(item.photo){const img=document.createElement('img'),u=URL.createObjectURL(item.photo);img.src=u;img.onload=()=>URL.revokeObjectURL(u);thumb.appendChild(img)}else thumb.textContent='⭐';
      const edit=document.createElement('div');edit.className='custom-edit';edit.innerHTML=`<input class="label" type="text" maxlength="20"><input class="speak" type="text" maxlength="40"><div class="custom-actions"><button class="save" type="button">保存</button><button class="photo" type="button">🖼️ 写真</button><button class="record" type="button">● ろくおん</button><button class="play" type="button">▶ きく</button><button class="danger delete" type="button">削除</button></div><div class="custom-status"></div>`;edit.querySelector('.label').value=item.label;edit.querySelector('.speak').value=item.speak||item.label;row.append(thumb,edit);list.appendChild(row);
      const status=edit.querySelector('.custom-status'),record=edit.querySelector('.record'),play=edit.querySelector('.play');
      async function updateStatus(){const b=await getVoice(item.id);status.textContent=b?'✓ 録音あり':'録音なし → 合成音声';play.disabled=!b}await updateStatus();
      edit.querySelector('.save').addEventListener('click',async()=>{item.label=edit.querySelector('.label').value.trim()||item.label;item.speak=edit.querySelector('.speak').value.trim()||item.label;await saveItem(item);status.textContent='✓ 保存しました';setTimeout(updateStatus,700)});
      const file=document.createElement('input');file.type='file';file.accept='image/*';file.hidden=true;document.body.appendChild(file);edit.querySelector('.photo').addEventListener('click',()=>file.click());file.addEventListener('change',async()=>{const f=file.files?.[0];file.value='';if(!f)return;item.photo=await resizeSquare(f);await saveItem(item);file.remove();await render()});
      record.addEventListener('click',async()=>{if(active&&active.id!==item.id){alert('先に今の録音を止めてください');return}if(active&&active.id===item.id){active.rec.stop();return}try{const stream=await navigator.mediaDevices.getUserMedia({audio:true}),chunks=[],mime=MediaRecorder.isTypeSupported('audio/mp4')?'audio/mp4':(MediaRecorder.isTypeSupported('audio/webm')?'audio/webm':'');const mr=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream);mr.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};mr.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());await putVoice(item.id,new Blob(chunks,{type:mr.mimeType||'audio/webm'}));active=null;record.textContent='● ろくおん';record.classList.remove('recording');await updateStatus()};mr.start();active={id:item.id,rec:mr};record.textContent='■ とめる';record.classList.add('recording')}catch(e){alert('マイクを使えませんでした')}});
      play.addEventListener('click',async()=>{const b=await getVoice(item.id);if(!b)return;const u=URL.createObjectURL(b),a=new Audio(u);a.onended=()=>URL.revokeObjectURL(u);a.play().catch(()=>{})});
      edit.querySelector('.delete').addEventListener('click',async()=>{if(!confirm('このことばを削除しますか？'))return;await deleteItem(item.id);await removeVoice(item.id);await render()});
    }
  }
  render();
})();
