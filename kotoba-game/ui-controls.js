(()=>{
  const sound=document.getElementById('sound');
  if(sound) sound.remove();

  const record=document.getElementById('recordLink');
  if(record){
    record.style.left='auto';
    record.style.right='12px';
    record.style.bottom='max(18px, calc(env(safe-area-inset-bottom) + 8px))';
  }
})();
