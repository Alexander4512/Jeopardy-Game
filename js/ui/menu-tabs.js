// Menu tab navigation
function showTab(k){
  ["Game","Edit","Cats","Perks","Hist","Look"].forEach(n=>{
    const on=n===k;
    document.getElementById("tab"+n).setAttribute("aria-selected",on?"true":"false");
    document.getElementById("panel"+n).hidden=!on;
  });
  if(k==="Hist")renderHistory();
  if(k==="Cats")renderCats();
  if(k==="Perks")renderPerkCfg();
  if(k==="Edit"){
    if(!ed){ed=JSON.parse(JSON.stringify(board));edDirty=false;edStore={1:null,2:null};edWhich=1;edSel=0}
    renderEditor();
    if(!sample)say(edMsg,"noAI");
  }
}
document.getElementById("tabEdit").onclick=()=>showTab("Edit");
function showSub(k){
  document.querySelectorAll("#edSub button").forEach(b=>b.setAttribute("aria-selected",b.dataset.sub===k?"true":"false"));
  document.querySelectorAll("#panelEdit .subpanel").forEach(p=>p.hidden=p.dataset.sub!==k);
  document.getElementById("panelEdit").dataset.sub=k;
  if(k==="pool")renderCats();
  if(k==="cols")stickNav();
  try{sessionStorage.setItem("jp-sub",k)}catch(e){}
}
document.querySelectorAll("#edSub button").forEach(b=>b.onclick=()=>showSub(b.dataset.sub));
document.getElementById("tabHist").onclick=()=>showTab("Hist");
document.getElementById("tabCats").onclick=()=>showTab("Cats");
document.getElementById("tabPerks").onclick=()=>showTab("Perks");
document.getElementById("tabGame").onclick=()=>showTab("Game");
document.getElementById("tabLook").onclick=()=>showTab("Look");

// Sliding bar of the vertical menu: follows the selected tab
(function(){
  const tabs=document.querySelector("#menuDlg .tabs"),bar=tabs&&tabs.querySelector(".tab-indicator");
  if(!bar)return;
  function move(){
    const b=tabs.querySelector('[aria-selected="true"]');
    if(!b||!b.offsetHeight){bar.style.height="0";return}
    const h=b.offsetHeight*0.8;
    bar.style.height=h+"px";
    bar.style.transform="translateY("+(b.offsetTop+(b.offsetHeight-h)/2)+"px)";
  }
  new MutationObserver(move).observe(tabs,{attributes:true,subtree:true,attributeFilter:["aria-selected","hidden"]});
  if(window.ResizeObserver)new ResizeObserver(move).observe(tabs);
  window.addEventListener("resize",move);
  move();
})();
