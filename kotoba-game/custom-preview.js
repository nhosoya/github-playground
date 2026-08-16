(()=>{
  const section=document.getElementById('customWords');
  if(!section||document.getElementById('customPendingPreview'))return;
  const photoBtn=section.querySelector('#customPhoto'),addBtn=section.querySelector('#customAdd'),status=section.querySelector('#customPhotoName');
  if(!photoBtn||!addBtn||!status)return;

  const style=document.createElement('style');
  style.textContent=`
    #customPendingPreviewWrap{display:none;grid-column:1/-1;align-items:center;gap:10px;background:#f6f8f9;border-radius:18px;padding:10px}
    #customPendingPreviewWrap.show{display:flex}
    #customPendingPreview{width:88px;height:88px;border-radius:18px;object-fit:cover;box-shadow:0 3px 10px #0002;flex:0 0 auto}
    #customPendingPreviewText{font-size:13px;font-weight:900;color:#52656d;line-height:1.45}
  `;
  document.head.appendChild(style);

  const wrap=document.createElement('div');
  wrap.id='customPendingPreviewWrap';
  wrap.innerHTML='<img id="customPendingPreview" alt="選んだ写真のプレビュー"><div id="customPendingPreviewText">この写真で追加します</div>';
  status.insertAdjacentElement('beforebegin',wrap);
  const preview=wrap.querySelector('#customPendingPreview');

  let choosing=false,currentUrl='';
  function clearPreview(){
    wrap.classList.remove('show');
    preview.removeAttribute('src');
    if(currentUrl)URL.revokeObjectURL(currentUrl);
    currentUrl='';
  }
  function showFile(file){
    if(!file)return;
    if(currentUrl)URL.revokeObjectURL(currentUrl);
    currentUrl=URL.createObjectURL(file);
    preview.src=currentUrl;
    wrap.classList.add('show');
  }

  // custom-settings.js owns the actual hidden file input. On iOS Safari,
  // listening for its change event from document is unreliable, so capture
  // the exact image input when its click() is invoked by this button.
  photoBtn.addEventListener('click',()=>{
    choosing=true;
    setTimeout(()=>{choosing=false},1500);
  },{capture:true});

  const nativeClick=HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click=function(...args){
    if(choosing&&this.type==='file'&&(this.accept||'').includes('image')){
      choosing=false;
      this.addEventListener('change',()=>showFile(this.files?.[0]),{once:true});
    }
    return nativeClick.apply(this,args);
  };

  addBtn.addEventListener('click',()=>setTimeout(()=>{
    if(!section.querySelector('#customLabel')?.value.trim())clearPreview();
  },150));
})();
