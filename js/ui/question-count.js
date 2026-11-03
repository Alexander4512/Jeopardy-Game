// Question-count warnings and fixes
let dismissKey="",warnBusy=false,selMode=null,selRemove=new Set(),allocSel=[];
function boardTotal(){return board.reduce((a,c)=>a+c.clues.filter(x=>!x.empty).length,0)}
function setMode(m){
  selMode=m;selRemove=new Set();allocSel=board.map(()=>0);
  document.getElementById("warnMsg").textContent="";
  renderBoard();renderWarn();
}
function pickCol(ci){
  const n=teams.length,rem=boardTotal()%n,k=rem?n-rem:0;
  const got=allocSel.reduce((a,b)=>a+b,0);
  if(got>=k||board[ci].clues.length+allocSel[ci]>=10)return;
  allocSel[ci]++;renderBoard();renderWarn();
}
function fillN(str,v){
  const noun=(n,one,many)=>T(n===1?one:many);
  return str.split("{tq}").join(noun(v.t,"nQ","nQs")).split("{kq}").join(noun(v.k,"nQ","nQs")).split("{rq}").join(noun(v.r,"nQ","nQs")).split("{nt}").join(noun(v.n,"nT","nTs"))
    .split("{t}").join(v.t).split("{n}").join(v.n).split("{k}").join(v.k).split("{r}").join(v.r);
}
function renderWarn(){
  const bar=document.getElementById("warnBar"),$=id=>document.getElementById(id);
  if(!bar||!teams||!teams.length)return;
  const t=boardTotal(),n=teams.length,rem=t%n,k=rem?n-rem:0;
  const show=ids=>["warnAdd","warnChoose","warnRemove","warnRemoveRnd","warnIgnore","warnReset","warnConfirm","warnCancel"].forEach(i=>{$(i).hidden=ids.indexOf(i)<0});
  if(selMode&&rem===0){selMode=null;selRemove=new Set();renderBoard()}
  if(selMode==="remove"){
    const sel=selRemove.size;
    $("warnTxt").textContent=T("selRemove").split("{s}").join(sel).split("{r}").join(rem);
    $("warnConfirm").disabled=!(sel>0&&(t-sel)%n===0);
    show(["warnConfirm","warnCancel"]);bar.hidden=false;return;
  }
  if(selMode==="add"){
    const got=allocSel.reduce((a,b)=>a+b,0);
    $("warnTxt").textContent=T("selAdd").split("{s}").join(got).split("{k}").join(k);
    $("warnConfirm").disabled=got!==k||warnBusy;
    show(["warnConfirm","warnReset","warnCancel"]);bar.hidden=false;return;
  }
  if(!t||rem===0||dismissKey===t+"|"+n){bar.hidden=true;return}
  const tpl=played===0?T("warnStart"):T("warnLeft");
  const vv={t:t,n:n,k:k,r:rem};
  $("warnTxt").textContent=fillN(tpl,vv);
  $("warnAdd").textContent=fillN(T("addRnd"),vv);
  $("warnChoose").textContent=fillN(T("chooseWhere"),vv);
  $("warnRemove").textContent=fillN(T("removeN"),vv);
  $("warnRemoveRnd").textContent=fillN(T("removeRnd"),vv);
  $("warnAdd").disabled=warnBusy;
  show(["warnAdd","warnChoose","warnRemoveRnd","warnRemove","warnIgnore"]);
  bar.hidden=false;
}
function removeRandom(){
  const n=teams.length,rem=boardTotal()%n,msg=document.getElementById("warnMsg");
  if(!rem)return;
  const cand=[];
  board.forEach((c,ci)=>c.clues.forEach((x,r)=>{if(!x.empty&&!used.has(ci+"-"+r))cand.push([ci,r])}));
  if(cand.length<rem){msg.textContent=T("rndNone");renderWarn();return}
  for(let i=cand.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=cand[i];cand[i]=cand[j];cand[j]=t}
  cand.slice(0,rem).forEach(p=>{board[p[0]].clues[p[1]].empty=true});
  custom=true;
  try{localStorage.setItem("jp-board",JSON.stringify(board))}catch(e){}
  msg.textContent="";
  renderBoard();renderWarn();
}
function renderQStatus(){
  const t=boardTotal(),n=teams.length,rem=t%n,k=rem?n-rem:0;
  const fill=x=>fillN(x,{t:t,n:n,k:k,r:rem});
  document.getElementById("qStatus").textContent=fill(T(rem===0?"qBalanced":"qUneven"));
  document.getElementById("qBtns").hidden=rem===0;
  document.getElementById("qAdd").textContent=fill(T("addRnd"));
  document.getElementById("qChoose").textContent=fill(T("chooseWhere"));
  document.getElementById("qRemove").textContent=fill(T("removeN"));
  document.getElementById("qRemoveRnd").textContent=fill(T("removeRnd"));
}
function fixCount(kind){
  menuDlg.close();
  dismissKey="";
  if(kind==="random"){renderWarn();addRandom()}
  else if(kind==="removeRandom")removeRandom();
  else setMode(kind);
}
document.getElementById("qAdd").onclick=()=>fixCount("random");
document.getElementById("qChoose").onclick=()=>fixCount("add");
document.getElementById("qRemove").onclick=()=>fixCount("remove");
document.getElementById("qRemoveRnd").onclick=()=>fixCount("removeRandom");
document.getElementById("warnIgnore").onclick=()=>{
  dismissKey=boardTotal()+"|"+teams.length;
  document.getElementById("warnMsg").textContent="";
  renderWarn();
};
document.getElementById("warnAdd").onclick=()=>addRandom();
document.getElementById("warnChoose").onclick=()=>setMode("add");
document.getElementById("warnRemove").onclick=()=>setMode("remove");
document.getElementById("warnRemoveRnd").onclick=()=>removeRandom();
document.getElementById("warnCancel").onclick=()=>setMode(null);
document.getElementById("warnReset").onclick=()=>{allocSel=board.map(()=>0);renderBoard();renderWarn()};
document.getElementById("warnConfirm").onclick=()=>{
  if(selMode==="remove"){
    selRemove.forEach(key=>{const p=key.split("-").map(Number);board[p[0]].clues[p[1]].empty=true});
    custom=true;
    try{localStorage.setItem("jp-board",JSON.stringify(board))}catch(e){}
    selMode=null;selRemove=new Set();
    renderBoard();renderWarn();
  }else if(selMode==="add")addRandom(allocSel.slice());
};
async function addRandom(fixed){
  const msg=document.getElementById("warnMsg"),n=teams.length,k=n-boardTotal()%n;
  if(!sample){say(msg,"rndNoAI");return}
  const alloc=fixed||board.map(()=>0);
  for(let i=0;!fixed&&i<k;i++){
    const open=board.map((c,ci)=>ci).filter(ci=>board[ci].clues.length+alloc[ci]<10);
    if(!open.length)break;
    alloc[open[Math.floor(Math.random()*open.length)]]++;
  }
  const items=[];
  alloc.forEach((cnt,ci)=>{
    if(cnt>0){
      const live=board[ci].clues.filter(x=>!x.empty);
      items.push({col:ci,topic:board[ci].cat,difficulty:LVL[dOf(ci)],type:live.length?slotType(live[live.length-1]):"normal",count:cnt,existing:board[ci].clues.map(x=>x.q).filter(Boolean)});
    }
  });
  if(!items.length){say(msg,"rndFull");return}
  warnBusy=true;renderWarn();say(msg,"rndGen");
  const prompt=["Write new Jeopardy-style clues in "+LNAME()+" for these existing categories.",
    "For each item write exactly \"count\" new clues of its \"type\" about its topic, at its difficulty level, rising gradually in difficulty. Never repeat or closely copy the clues listed in \"existing\". "+GEN_DOC,
    "Be accurate and unambiguous.",
    "Items: "+JSON.stringify(items),
    "Reply with only JSON in this shape: [{\"col\":<number>,\"clues\":[<clue objects>]}] with one object per item, in the same order."].join("\n");
  try{
    const out=await sample.json(prompt,{cache:false});
    const probe=ty=>ty==="normal"?{}:{type:ty};
    if(!Array.isArray(out)||out.length!==items.length||out.some((o,i)=>!o||o.col!==items[i].col||!Array.isArray(o.clues)||o.clues.length!==items[i].count||o.clues.some(x=>!applyGen(probe(items[i].type),x))))throw new Error("shape");
    out.forEach((o,i)=>{
      const col=board[o.col],ty=items[i].type;
      o.clues.forEach(x=>{
        const r=col.clues.length,ref=board.find(c=>c!==col&&c.clues[r]);
        const slot={q:"",a:"",pts:ref?ref.clues[r].pts:(r+1)*100,time:ref?ref.clues[r].time:null};
        if(ty!=="normal")slot.type=ty;
        applyGen(slot,x);col.clues.push(slot);
      });
    });
    custom=true;
    try{localStorage.setItem("jp-board",JSON.stringify(board))}catch(e){}
    say(msg,"rndDone");
    selMode=null;allocSel=board.map(()=>0);
    renderBoard();
  }catch(e){say(msg,"rndFail")}
  warnBusy=false;renderWarn();
}
