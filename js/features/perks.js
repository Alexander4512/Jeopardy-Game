// Bomb and delegate perks, perk settings
let bombArmed=false,bombTimer=null;
const bombUseful=()=>board.some((c,ci)=>c.clues.some((x,r)=>!x.empty&&!used.has(ci+"-"+r)));
function renderPerks(){
  const bar=document.getElementById("perksBar");if(!bar)return;
  bar.hidden=!(perksOn&&perkCfg.bomb.on);
  const b=document.getElementById("bombBtn");
  b.textContent=T(bombArmed?"bombSure":"bomb");
  b.disabled=!!selMode||!!current||!bombUseful();
}
function useBomb(){
  const n=LIB[lang].length,pool=[];
  for(let i=0;i<n;i++)if(!catOff.has(i))pool.push(i);
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=pool[i];pool[i]=pool[j];pool[j]=t}
  const keepOf=ci=>{const k=new Set();board[ci].clues.forEach((x,r)=>{if(used.has(ci+"-"+r))k.add(r)});return k};
  const changing=board.map((c,ci)=>c.clues.some((x,r)=>!x.empty&&!keepOf(ci).has(r)));
  const fixedLibs=board.filter((c,ci)=>!changing[ci]).map(c=>c.lib);
  const curLibs=board.map(c=>c.lib);
  const free=pool.filter(i=>fixedLibs.indexOf(i)<0);
  const order=free.filter(i=>curLibs.indexOf(i)<0).concat(free.filter(i=>curLibs.indexOf(i)>=0));
  let k=0;
  board=board.map((col,ci)=>changing[ci]&&order.length?fromLib(lang,order[k++%order.length],col,keepOf(ci)):col);
  if(custom){try{localStorage.setItem("jp-board",JSON.stringify(board))}catch(e){}}
  logPerk(active,"bomb");
  say(document.getElementById("perkMsg"),"bombDone");
  if(auto&&teams.length>1)active=(active+1)%teams.length; /* using a perk consumes the turn */
  renderBoard();renderWarn();renderPerks();renderTeams();
}
document.getElementById("bombBtn").onclick=()=>{
  if(!bombArmed){
    bombArmed=true;renderPerks();clearTimeout(bombTimer);
    bombTimer=setTimeout(()=>{bombArmed=false;renderPerks()},3000);
    return;
  }
  clearTimeout(bombTimer);bombArmed=false;useBomb();
};
document.getElementById("rotChk").onchange=e=>{
  rotPlayed=e.target.checked;
  try{localStorage.setItem("jp-rot",rotPlayed?"1":"0")}catch(x){}
  renderBoard();
};
document.getElementById("bonusChk").onchange=e=>{
  bonusOn=e.target.checked;
  try{localStorage.setItem("jp-bonus",bonusOn?"1":"0")}catch(x){}
  renderRestrict();
};
document.getElementById("bonusNum").oninput=e=>{
  const v=parseFloat(e.target.value);
  if(!isFinite(v)||v<=0)return;
  bonusMult=Math.min(10,v);
  try{localStorage.setItem("jp-bonusmult",bonusMult)}catch(x){}
  renderRestrict();
};
function savePerkCfg(){try{localStorage.setItem("jp-perkcfg",JSON.stringify(perkCfg))}catch(e){}}
function savePerkExcl(){try{localStorage.setItem("jp-perkexcl",JSON.stringify({cols:Array.from(perkExcl.cols),rows:Array.from(perkExcl.rows)}))}catch(e){}placeBombs(bombLevel)}
["bomb","delegate"].forEach(k=>{
  document.getElementById("pkOn_"+k).onchange=e=>{perkCfg[k].on=e.target.checked;savePerkCfg();renderPerks();placeBombs(bombLevel)};
  document.getElementById("pkQty_"+k).oninput=e=>{const v=parseInt(e.target.value,10);if(isFinite(v)&&v>=0){perkCfg[k].qty=Math.min(99,v);savePerkCfg();if(k==="bomb"){bombLevel=perkCfg.bomb.qty;placeBombs(bombLevel)}}};
  document.getElementById("pkCh_"+k).oninput=e=>{const v=parseFloat(e.target.value);if(isFinite(v)&&v>=0&&v<=100){perkCfg[k].chance=v;savePerkCfg()}};
});
function chip(label,checked,fn){
  const l=document.createElement("label");l.className="chip";
  const cb=document.createElement("input");cb.type="checkbox";cb.checked=checked;cb.onchange=()=>fn(cb.checked);
  const sp=document.createElement("span");sp.textContent=label;
  l.append(cb,sp);return l;
}
function renderPerkCfg(){
  ["bomb","delegate"].forEach(k=>{
    document.getElementById("pkOn_"+k).checked=perkCfg[k].on;
    document.getElementById("pkQty_"+k).value=perkCfg[k].qty;
    document.getElementById("pkCh_"+k).value=perkCfg[k].chance;
  });
  const ec=document.getElementById("exclCols");ec.textContent="";
  board.forEach((c,ci)=>ec.appendChild(chip(c.cat,perkExcl.cols.has(ci),on=>{if(on)perkExcl.cols.add(ci);else perkExcl.cols.delete(ci);savePerkExcl()})));
  const er=document.getElementById("exclRows");er.textContent="";
  rowsOf(board).forEach(r=>{
    const ref=board.find(c=>c.clues[r]).clues[r];
    er.appendChild(chip(T("row")+" "+(r+1)+" ($"+ref.pts+")",perkExcl.rows.has(r),on=>{if(on)perkExcl.rows.add(r);else perkExcl.rows.delete(r);savePerkExcl()}));
  });
}
const bombFixed=()=>perkCfg.bomb.qty>0;
function placeBombs(n){
  bombSet=new Set();
  if(bombFixed()&&randPerks&&perkCfg.bomb.on&&n>0){
    const cand=[];
    board.forEach((c,ci)=>c.clues.forEach((x,r)=>{
      const key=ci+"-"+r;
      if(!x.empty&&!used.has(key)&&!perkExcl.cols.has(ci)&&!perkExcl.rows.has(r))cand.push(key);
    }));
    for(let i=cand.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=cand[i];cand[i]=cand[j];cand[j]=t}
    cand.slice(0,n).forEach(k=>bombSet.add(k));
  }
  renderBombLbl();
}
function renderBombLbl(){
  const el=document.getElementById("bombLbl");if(!el)return;
  let n=0;
  bombSet.forEach(k=>{const p=k.split("-").map(Number),c=board[p[0]]&&board[p[0]].clues[p[1]];if(c&&!c.empty&&!used.has(k))n++});
  el.hidden=!(bombFixed()&&randPerks&&perkCfg.bomb.on&&n>0);
  el.textContent="💣 ×"+n;el.title=T("bombsOnBoard");
}
function rollPerk(cl,ci,r){
  if(!randPerks||perkExcl.cols.has(ci)||perkExcl.rows.has(r))return null;
  if(onePerkTurn&&perkThisTurn)return null;
  const key=ci+"-"+r;
  if(bombFixed()&&perkCfg.bomb.on&&bombSet.has(key)){
    bombSet.delete(key);perkCount.bomb++;perkThisTurn=true;renderBombLbl();
    return "bomb";
  }
  const kinds=["bomb","delegate"].filter(k=>{
    const c=perkCfg[k];
    if(!c.on||c.chance<=0)return false;
    if(k==="bomb"&&bombFixed())return false;
    if(c.qty>0&&perkCount[k]>=c.qty)return false;
    if(k==="delegate"&&(isGroup(cl)||teams.length<2))return false;
    return true;
  });
  for(let i=kinds.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=kinds[i];kinds[i]=kinds[j];kinds[j]=t}
  for(let i=0;i<kinds.length;i++){if(Math.random()*100<perkCfg[kinds[i]].chance){perkCount[kinds[i]]++;perkThisTurn=true;return kinds[i]}}
  return null;
}
document.getElementById("peekChk").onchange=e=>{
  delegatePeek=e.target.checked;
  try{localStorage.setItem("jp-peek",delegatePeek?"1":"0")}catch(x){}
};
function saveBombOpts(){
  try{localStorage.setItem("jp-bombretry",bombRetry?"1":"0");localStorage.setItem("jp-bombskip",bombSkip?"1":"0")}catch(x){}
  document.getElementById("retryChk").checked=bombRetry;
  document.getElementById("skipTurnChk").checked=bombSkip;
  document.getElementById("bombPeekChk").checked=bombPeek;
}
document.getElementById("bombPeekChk").onchange=e=>{
  bombPeek=e.target.checked;
  try{localStorage.setItem("jp-bombpeek",bombPeek?"1":"0")}catch(x){}
};
document.getElementById("retryChk").onchange=e=>{
  bombRetry=e.target.checked;
  if(bombRetry)bombSkip=false;
  saveBombOpts();
};
document.getElementById("skipTurnChk").onchange=e=>{
  bombSkip=e.target.checked;
  if(bombSkip)bombRetry=false;
  saveBombOpts();
};
document.getElementById("randChk").onchange=e=>{
  randPerks=e.target.checked;
  try{localStorage.setItem("jp-randperks",randPerks?"1":"0")}catch(x){}
  placeBombs(bombLevel);
};
document.getElementById("perksChk").onchange=e=>{
  perksOn=e.target.checked;
  try{localStorage.setItem("jp-perks",perksOn?"1":"0")}catch(x){}
  document.getElementById("perkMsg").textContent="";
  renderPerks();
};
function renderRestrict(){
  const el=document.getElementById("restrictBar");if(!el)return;
  if(chRestrict&&teams){const cn=chRestrict.cat!=null?board[chRestrict.cat].cat:null,rv=chRestrict.row!=null?(()=>{const a=board.find(c=>c.clues[chRestrict.row]);return a?"$"+a.clues[chRestrict.row].pts:""})():null;
    const parts=[cn?rqText("category "+cn,"la categoría "+cn):"",rv?rqText("the "+rv+" row","la fila de "+rv):""].filter(Boolean).join(rqText(" and "," y "));
    el.textContent="🎯 "+rqText(nm(chRestrict.by)+" challenged "+nm(active)+": it must choose from "+parts+".",nm(chRestrict.by)+" desafió a "+nm(active)+": debe elegir de "+parts+".");el.hidden=false;return}
  if(restrictPts===null||!teams){el.hidden=true;return}
  el.textContent=T("pickSame").split("{t}").join(nm(active)).split("{x}").join(restrictPts)+(bonusOn?T("bonusInfo").split("{m}").join(bonusMult):"");
  el.hidden=false;
}
