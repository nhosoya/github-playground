(()=>{
  if(!('speechSynthesis' in window))return;
  const VOICE_KEY='kotoba-tts-voice-uri';
  const anchor=document.querySelector('.lead');
  if(!anchor||document.getElementById('ttsSettings'))return;

  const style=document.createElement('style');
  style.textContent=`
    #ttsSettings{max-width:850px;margin:0 auto 18px;background:#ffffffd9;border-radius:22px;padding:14px 16px;box-shadow:0 6px 18px #0001}
    #ttsSettings h2{font-size:18px;margin:0 0 8px}
    #ttsSettings .tts-row{display:flex;gap:8px;align-items:center}
    #ttsSettings select{flex:1;min-width:0;border:0;border-radius:14px;padding:11px 12px;background:#eef3f5;color:#263238;font-size:15px;font-weight:700}
    #ttsSettings button{border:0;border-radius:999px;padding:11px 14px;background:#dff6ff;color:#263238;font-weight:900;white-space:nowrap}
    #ttsSettings .tts-note{font-size:12px;line-height:1.5;color:#667;margin-top:8px}
  `;
  document.head.appendChild(style);

  const box=document.createElement('section');
  box.id='ttsSettings';
  box.innerHTML='<h2>合成音声</h2><div class="tts-row"><select id="ttsVoice" aria-label="合成音声"></select><button id="ttsPreview" type="button">▶ ためす</button></div><div class="tts-note">録音がない単語だけ、この声で読み上げます。この端末で使える日本語音声から選べます。</div>';
  anchor.insertAdjacentElement('afterend',box);

  const select=box.querySelector('#ttsVoice');
  const preview=box.querySelector('#ttsPreview');
  let voices=[];

  function loadVoices(){
    voices=speechSynthesis.getVoices().filter(v=>/^ja(?:-|_)/i.test(v.lang));
    const saved=localStorage.getItem(VOICE_KEY);
    const current=select.value||saved||'';
    select.innerHTML='';
    if(!voices.length){
      const o=document.createElement('option');o.textContent='日本語音声を読み込み中…';o.value='';select.appendChild(o);select.disabled=true;return;
    }
    select.disabled=false;
    voices.forEach((v,i)=>{
      const o=document.createElement('option');
      o.value=v.voiceURI||v.name;
      o.textContent=`${v.name} (${v.lang})${v.localService?'':' · オンライン'}`;
      select.appendChild(o);
    });
    const candidate=voices.find(v=>(v.voiceURI||v.name)===current) || voices.find(v=>v.lang==='ja-JP'&&v.localService) || voices[0];
    select.value=candidate.voiceURI||candidate.name;
    if(!saved)localStorage.setItem(VOICE_KEY,select.value);
  }

  function speakSample(){
    if(!voices.length)return;
    const voice=voices.find(v=>(v.voiceURI||v.name)===select.value)||voices[0];
    speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance('わんわん。りんご。ぱぱ。まま。');
    u.lang='ja-JP';u.voice=voice;u.rate=.88;u.pitch=1.0;u.volume=1;
    speechSynthesis.speak(u);
  }

  select.addEventListener('change',()=>localStorage.setItem(VOICE_KEY,select.value));
  preview.addEventListener('click',speakSample);
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged',loadVoices);
  setTimeout(loadVoices,500);
})();
