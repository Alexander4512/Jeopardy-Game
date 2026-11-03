// End of game, team picker, idle hint
function checkEnd(){if(played>0&&unplayedCount()===0){if(stageReady()){renderPick();return}if(finalOn&&!finalDone&&teams.some(t=>t.score>0))startFinal();else showResults()}}
function restartNoMenu(){if(!custom)board=defaultBoard();undoStack=[];redoStack=[];newGame();applyLang()}
document.getElementById("resNew").onclick=()=>{document.getElementById("resDlg").close();restartNoMenu()};
document.getElementById("resClose").onclick=()=>document.getElementById("resDlg").close();
document.getElementById("histRes").onclick=()=>{menuDlg.close();showResults()};
const rb=document.getElementById("reset");let rt;
rb.onclick=()=>goStart(); /* New game opens the start page; cancel there keeps the current game */


let idleT=null,idleOff=false;try{idleOff=localStorage.getItem("jp-idleoff")==="1"}catch(e){}
function armIdle(){
  clearTimeout(idleT);const h=document.getElementById("idleHint");if(!h)return;h.hidden=true;if(idleOff||played>0||used.size)return;
  idleT=setTimeout(function chk(){
    if(current||document.querySelector("dialog[open]")){idleT=setTimeout(chk,7000);return}
    document.getElementById("idleTxt").textContent=T("idleMsg");h.hidden=false;
  },7000);
}
let pickOff=false;try{pickOff=localStorage.getItem("jp-pickoff")==="1"}catch(e){}
function renderPick(){
  const box=document.getElementById("pickBox");if(!box)return;
  const fresh=!current&&used.size===0&&played===0;
  const over=played>0&&unplayedCount()===0&&!(finalOn&&!finalDone&&teams.some(t=>t.score>0))&&!(stageReady()&&false);
    {const g=document.getElementById("stBtns");if(g){const fin=unplayedCount()===0&&played>0,show=stOn&&stage===1&&!current&&(fin||st1Skip);g.hidden=!show;[["stRow","row"],["stCol","col"],["stSkip","board"]].forEach(([id,k])=>{document.getElementById(id).hidden=!stK[k]});
    document.getElementById("stRow").textContent=rqText("➕ Add row","➕ Agregar fila");document.getElementById("stCol").textContent=rqText("➕ Add column","➕ Agregar columna");
    document.getElementById("stSkip").textContent=fin?rqText("🆕 Stage 2: new board","🆕 Etapa 2: tablero nuevo"):UI[lang].stSkipBtn}}
  const sr=document.getElementById("seeRes");sr.hidden=!over;sr.textContent=T("seeRes");
  box.hidden=pickOff||over;
  document.querySelector("#rndPick .inner").textContent=T(fresh?"rndPickBtn":"rndPickBtn2").replace(/^🎲\s*/,"");
  document.getElementById("pickTip").textContent=T("pickTip");
  const c=document.getElementById("pickChk");if(c)c.checked=!pickOff;
}
function showPickMsg(){const m=document.getElementById("pickMsg");m.textContent=T(used.size===0&&played===0?"rndPicked":"rndPicked2").split("{x}").join(nm(active));m.style.color=teamColor(active)}
function setPickOff(v){pickOff=v;try{localStorage.setItem("jp-pickoff",v?"1":"0")}catch(e){}if(v)document.getElementById("pickMsg").textContent="";renderPick()}
document.getElementById("seeRes").onclick=()=>showResults();
document.getElementById("pickX").onclick=()=>setPickOff(true);
document.getElementById("pickChk").onchange=e=>setPickOff(!e.target.checked);
document.getElementById("idleX").onclick=()=>{idleOff=true;clearTimeout(idleT);document.getElementById("idleHint").hidden=true;try{localStorage.setItem("jp-idleoff","1")}catch(e){}};
let pickSpin=false;
document.getElementById("rndPick").onclick=()=>{
  if(pickSpin)return;
  const n=teams.length,win=Math.floor(Math.random()*n);
  const finish=()=>{pickSpin=false;active=win;renderTeams();showPickMsg();armIdle();
    const el=document.querySelectorAll("#teams .team")[win];
    if(el&&document.documentElement.dataset.calm!=="1"){el.classList.add("pick-win");setTimeout(()=>el.classList.remove("pick-win"),1600)}
    try{SFX.coin();confetti(50,true)}catch(e){}};
  if(document.documentElement.dataset.calm==="1"||n<2){finish();return}
  pickSpin=true;document.getElementById("rndPick").disabled=true;document.getElementById("rndPick").classList.add("rolling");
  document.getElementById("pickMsg").textContent="";
  const steps=14+((win-0+n*4)%n)+n*2; /* decelerating hops, always ends on win */
  let i=(win-steps%n+n*50)%n,k=0;
  const hop=()=>{
    const els=document.querySelectorAll("#teams .team");
    els.forEach((e,j)=>e.classList.toggle("pick-hl",j===i));
    try{SFX.tick&&SFX.tick()}catch(e){}
    if(k>=steps){document.getElementById("rndPick").disabled=false;document.getElementById("rndPick").classList.remove("rolling");els.forEach(e=>e.classList.remove("pick-hl"));finish();return}
    k++;i=(i+1)%n;
    setTimeout(hop,60+Math.pow(k/steps,3)*340);
  };
  hop();
};
