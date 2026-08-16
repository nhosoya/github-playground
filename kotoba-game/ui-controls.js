(()=>{
  const sound=document.getElementById('sound');
  if(sound) sound.remove();

  const record=document.getElementById('recordLink');
  if(!record)return;
  record.style.left='auto';
  record.style.right='12px';
  record.style.bottom='max(18px, calc(env(safe-area-inset-bottom) + 8px))';
  record.setAttribute('aria-label','設定とカスタマイズ');

  function normalize(){
    if(record.classList.contains('armed')){
      if(record.textContent!=='もう1かい')record.textContent='もう1かい';
    }else if(record.textContent!=='⚙️ せってい'){
      record.textContent='⚙️ せってい';
    }
  }
  normalize();
  new MutationObserver(()=>queueMicrotask(normalize)).observe(record,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class']});
})();
