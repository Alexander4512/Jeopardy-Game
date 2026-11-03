// Simple / advanced menu mode
// ---- menu mode
let menuMode="simple";try{menuMode=localStorage.getItem("jp-mode")==="adv"?"adv":"simple"}catch(e){}
(function(){
  const lab=id=>{const el=document.getElementById(id);if(!el)return;(el.closest("label")||el).classList.add("adv")};
  ["dTime","dPenChk","dMult","diffReset","photoChk","paintChk","adjChk","groupChk","tfChk","secondChk","secondNum","rotChk","rndColors","defColors","oneChk","pkQty_bomb","pkCh_bomb","retryChk","skipTurnChk","bombPeekChk","bonusChk","bonusNum","bothChk","peekChk","pkQty_delegate","pkCh_delegate","ddNum","tabCats","tabHist","colBg","colTile","colGold","colInk","colReset","fontSel","sizeRng"].forEach(lab);
  ["bombFixedHint","afterBomb","bonusNote"].forEach(k=>{const el=document.querySelector('[data-i18n="'+k+'"]');if(el)el.classList.add("adv")});
  ["exclCols","exclRows","typePct"].forEach(id=>{const el=document.getElementById(id);if(el){const g=el.closest(".grp")||el.closest(".colors");if(g)g.classList.add("adv")}});
  document.querySelectorAll('[data-i18n="typography"],[data-i18n="colors"]').forEach(el=>{const g=el.closest(".colors");if(g)g.classList.add("adv")});
})();
function applyMode(){
  const m=document.querySelector("#menuDlg .menu");if(m)m.dataset.mode=menuMode;
  const b=document.getElementById("modeBtn");if(b)b.textContent=T(menuMode==="adv"?"modeToSimple":"modeToAdv");
}
document.getElementById("modeBtn").onclick=()=>{
  menuMode=menuMode==="adv"?"simple":"adv";try{localStorage.setItem("jp-mode",menuMode)}catch(e){}
  applyMode();
  if(menuMode==="simple"){const t=document.querySelector('#menuDlg [role=tab][aria-selected=true]');if(t&&getComputedStyle(t).display==="none")showTab("Game")}
};
