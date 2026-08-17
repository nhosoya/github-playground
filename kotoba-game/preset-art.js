(()=>{
  const ART=new Map([
    ['papa','https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh12I9T0bRiSbyRoGHzF_pD3cA8o3Tp66zFXD_ex4ViWfvNvLOqgJovGcNlqXx4wElmrbk0Jq1QjbxdXTJyD3zFXxsbAJFEv7oFP00gNBrMil8Nt-o2rPlZ_89r5cv0pmdLOyc2NdfMNg67/s195/thumbnail_talk_oyako_father.jpg'],
    ['mama','https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg66N0AjqXXR72lqSMfrcAMjo0KFiO9oApkBqJwsS1bGTYnPhKsc6_dduPTp3mX4ORXyHVivou0SUH3XU9bxxA44RmDGXo3kzBEibxs4g61XPcV6Az5j_9pIs-J1Atf01t7gL3CW0oveuZS/s400/talk_oyako_mother_daughter.png'],
    ['akachan','https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhH4Dk5O_a0Kkah9DuUMn6hfSBXB5wLTHG09sxa_vzyuU5ABs6EUfRFbRl5vMq30ZsG6gLubFlyRITTQZqb0hBgsWYICoK1uQzfyIQVoA7912hyphenhyphenyTGDBoUYjMIzYZLVho-kPotdGMqCCizT/s350/baby_side_shirt.png'],
    ['wanwan','https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgi_nfe6sUsA9El67mO1g5bzrLpAuA_l1UffQvMSIS4xJBsDm4nrEa6ud4a_TNCiEMPKzCBgIrw5B2M13Z-Pnj0xgzTEZDJG1rw5btr9IU3ZEumWF6ULJMaWV_454iU1D_0csdaE_VfW3FO/s400/animalface_inu.png'],
    ['nyaa','https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgy1hyphenhyphenHF631sgsjAsfjiJtzuE6dcw-sFOgOJ5gt9ovzqRdzMqNAFg9DVrpEkDooKDNSFGerioU3cN2EXTgBWnnbmxVD7aCzUf5fxGScZC59YuQ7tnk4h8kILzWP4RwViIVPfPwCvy14RzsB/s400/neko_osuwari.png'],
    ['densha','https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhgnfvWgrhDORFarJDU2rarAXp80P6ibP09_45IC4rL0zMTGLtEt-vyuu8lGsofmVamgHNw6MRs0IjSYpbRC8f0nxiwutvWbty8zGJDdQfqExQK28j2QpKp7oDIExlzUp1ycEa5MWyLRpo/s450/norimono_character5_densya.png']
  ]);

  const style=document.createElement('style');
  style.textContent=`
    .toy.preset-art{font-size:0!important;background-color:#fffdf8!important;background-position:center!important;background-repeat:no-repeat!important;background-size:82% auto!important}
    .toy.preset-art::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 4px rgba(255,255,255,.62);pointer-events:none}
    .toy.preset-art.has-photo{background-size:cover!important}
  `;
  document.head.appendChild(style);

  function apply(toy){
    if(!toy?.classList?.contains('toy'))return;
    if(String(toy.dataset.voiceKey||'').startsWith('custom:'))return;
    const url=ART.get(toy.dataset.voiceKey||'');
    if(!url)return;
    toy.dataset.presetArtUrl=url;
    toy.classList.add('preset-art');
    if(!toy.classList.contains('has-photo'))toy.style.backgroundImage=`url("${url}")`;
  }
  function applyAll(){document.querySelectorAll('.toy').forEach(apply)}

  const observer=new MutationObserver(muts=>{
    for(const m of muts)for(const n of m.addedNodes){
      if(n.nodeType!==1)continue;
      if(n.classList?.contains('toy'))apply(n);
      n.querySelectorAll?.('.toy').forEach(apply);
    }
  });
  observer.observe(document.getElementById('game')||document.body,{childList:true,subtree:true});
  window.addEventListener('pageshow',applyAll);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)applyAll()});
  applyAll();
})();
