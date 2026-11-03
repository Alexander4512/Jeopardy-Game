// Difficulty settings menu
document.getElementById("menuBtn");
function diffDesc(k){
  const d=DIFF[k];
  return (d.time>0?d.time+" "+T("secPer"):T("noTimer"))+" "+(d.mult>0?T("penX").replace("{x}",d.mult):T("noPen"));
}
function saveDiffs(){try{localStorage.setItem("jp-diffs",JSON.stringify(DIFF))}catch(e){}}
function renderDiffMenu(){
  const d=DIFF[diff];
  document.getElementById("dTime").value=d.time;
  document.getElementById("dPenChk").checked=d.mult>0;
  document.getElementById("dMult").value=d.mult;
  document.getElementById("diffInfo").textContent=diffDesc(diff);
}
document.getElementById("dTime").oninput=e=>{
  DIFF[diff].time=Math.max(0,Math.round(+e.target.value||0));
  saveDiffs();document.getElementById("diffInfo").textContent=diffDesc(diff);
};
const lastMult={};
function setMult(v){
  DIFF[diff].mult=v;
  if(v>0)lastMult[diff]=v;
  document.getElementById("dPenChk").checked=v>0;
  saveDiffs();document.getElementById("diffInfo").textContent=diffDesc(diff);
}
document.getElementById("dPenChk").onchange=e=>{
  const v=e.target.checked?(lastMult[diff]||1):0;
  document.getElementById("dMult").value=v;
  setMult(v);
};
document.getElementById("dMult").oninput=e=>{
  const v=+e.target.value;
  if(e.target.value===""||!isFinite(v)||v<0)return;
  setMult(Math.min(10,v));
};
document.getElementById("diffReset").onclick=()=>{
  Object.keys(DIFF).forEach(k=>{DIFF[k]=Object.assign({},DIFF_DEF[k])});
  saveDiffs();renderDiffMenu();
};
