(()=>{
  const section=document.getElementById('customWords');
  if(!section||document.getElementById('customPendingPreview'))return;
  const photoBtn=section.querySelector('#customPhoto'),addBtn=section.querySelector('#customAdd'),status=section.querySelector('#customPhotoName');
  if(!photoBtn||!addBtn||!status)return;

  const style=document.createElement('style');
  style.textContent=`
    #customPendingPreview{display:none;width:112px;height:112px;border-radius:22px;object-fit:cover;box-shadow:0 4px 14px #0002;margin:4px auto 2px;grid-column:1/-1}
    #customPendingPreview.show{display:block}
  `;
  document.head.appendChild(style);

  const preview=document.createElement('img');
  preview.id='customPendingPreview';
  preview.alt='選んだ写真のプレビュー';
  status.insertAdjacentElement('beforebegin',preview);

  let armedUntil=0,currentUrl='';
  photoBtn.addEventListener('click',()=>{armedUntil=Date.now()+10000},{capture:true});

  document.addEventListener('change',e=>{
    const input=e.target;
    if(Date.now()>armedUntil||!(input instanceof HTMLInputElement)||input.type!=='file'||!input.accept.includes('image'))return;
    const file=input.files?.[0];
    if(!file)return;
    armedUntil=0;
    if(currentUrl)URL.revokeObjectURL(currentUrl);
    currentUrl=URL.createObjectURL(file);
    preview.src=currentUrl;
    preview.classList.add('show');
  },{capture:true});

  addBtn.addEventListener('click',()=>setTimeout(()=>{
    // Successful additions clear the form in custom-settings.js, so clear the preview too.
    if(!section.querySelector('#customLabel')?.value.trim()){
      preview.classList.remove('show');
      preview.removeAttribute('src');
      if(currentUrl)URL.revokeObjectURL(currentUrl);
      currentUrl='';
    }
  },100));
})();
