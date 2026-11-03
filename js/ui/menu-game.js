// Menu: game tab, language and team settings
const menuDlg=document.getElementById("menuDlg");
document.getElementById("menuBtn").onclick=()=>{renderTeamMenu();renderColorMenu();renderTypeMenu();menuDlg.showModal()};
document.getElementById("closeMenu").onclick=()=>{
  if(ed&&edDirty){if(!applyEd()){showTab("Edit");say(edMsg,"incomplete");markInvalid();return}}
  menuDlg.close();
};
function setLang(l){lang=l;try{localStorage.setItem("jp-lang",lang)}catch(x){}applyLang()}
document.getElementById("langSel").onchange=e=>setLang(e.target.value);
document.getElementById("autoChk").onchange=e=>{
  auto=e.target.checked;
  try{localStorage.setItem("jp-auto",auto?"1":"0")}catch(x){}
};

document.getElementById("ddOn").onchange=e=>{ddOn=e.target.checked;try{localStorage.setItem("jp-ddon",ddOn?"1":"0")}catch(x){}placeDD();renderBoard()};
document.getElementById("ddNum").onchange=e=>{ddNum=Math.max(1,Math.min(5,Math.round(+e.target.value||0)));e.target.value=ddNum;try{localStorage.setItem("jp-dd",ddNum)}catch(x){}placeDD();renderBoard()};
document.getElementById("finChk").onchange=e=>{finalOn=e.target.checked;try{localStorage.setItem("jp-final",finalOn?"1":"0")}catch(x){}};
document.getElementById("diffSel").onchange=e=>{
  diff=e.target.value;
  try{localStorage.setItem("jp-diff2",diff)}catch(x){}
  renderDiffMenu();
};
function saveTeams(){
  savedNames=teams.map(t=>t.name);savedPhotos=teams.map(t=>t.photo||null);savedTColors=teams.map(t=>t.color||null);
  try{localStorage.setItem("jp-tcolors",JSON.stringify(savedTColors))}catch(e){}
  try{localStorage.setItem("jp-teams",JSON.stringify(savedNames))}catch(e){}
  try{localStorage.setItem("jp-photos",JSON.stringify(savedPhotos))}catch(e){}
}
function avatar(t,i,fn){
  if(!photosOn)return document.createDocumentFragment();
  const b=document.createElement("button");b.type="button";b.className="avatar";
  b.setAttribute("aria-label",T("photo")+": "+teamName(t,i));
  if(t.photo){const im=document.createElement("img");im.src=t.photo;im.alt="";b.appendChild(im)}else b.textContent="+";
  b.onclick=e=>{e.stopPropagation();fn()};
  return b;
}
let photoIdx=0;
function pickPhoto(i){photoIdx=i;const f=document.getElementById("photoIn");f.value="";f.click()}
document.getElementById("photoIn").onchange=e=>{
  const file=e.target.files&&e.target.files[0],i=photoIdx;
  if(!file||!teams[i])return;
  const rd=new FileReader();
  rd.onload=()=>{
    const img=new Image();
    img.onload=()=>{
      const S=160,c=document.createElement("canvas");c.width=c.height=S;
      const m=Math.min(img.width,img.height);
      c.getContext("2d").drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,S,S);
      if(teams[i]){teams[i].photo=c.toDataURL("image/jpeg",0.82);saveTeams();renderTeams();renderTeamMenu()}
    };
    img.src=rd.result;
  };
  rd.readAsDataURL(file);
};
function renderTeamMenu(){
  renderQStatus();
  document.getElementById("rndMsg").textContent="";document.getElementById("rndBtn").textContent=T("random");
  document.getElementById("photoChk").checked=photosOn;
  document.getElementById("paintChk").checked=paintOn;
  document.getElementById("adjChk").checked=adjOn;
  document.getElementById("groupChk").checked=groupOn;
  document.getElementById("skipChk").checked=skipOn;document.getElementById("ddNum").value=Math.max(1,ddNum);document.getElementById("ddOn").checked=ddOn;document.getElementById("finChk").checked=finalOn;
  document.getElementById("tfChk").checked=tfNoPass;
  document.getElementById("secondChk").checked=secondOn;
  document.getElementById("secondNum").value=secondPct;
  document.getElementById("oneChk").checked=onePerkTurn;
  document.getElementById("bothChk").checked=bonusBoth;
  document.getElementById("rotChk").checked=rotPlayed;
  document.getElementById("perksChk").checked=perksOn;
  document.getElementById("randChk").checked=randPerks;
  document.getElementById("retryChk").checked=bombRetry;
  document.getElementById("skipTurnChk").checked=bombSkip;
  document.getElementById("bombPeekChk").checked=bombPeek;
  document.getElementById("peekChk").checked=delegatePeek;
  renderPerkCfg();
  document.getElementById("bonusChk").checked=bonusOn;
  document.getElementById("bonusNum").value=bonusMult;
  const sel=document.getElementById("teamsSel");sel.textContent="";
  for(let n=2;n<=10;n++){const o=document.createElement("option");o.value=n;o.textContent=n;sel.appendChild(o)}
  sel.value=teams.length;
  const nl=document.getElementById("nameList");nl.textContent="";
  teams.forEach((t,i)=>{
    const inp=document.createElement("input");inp.type="text";inp.value=teamName(t,i);
    inp.setAttribute("aria-label",T("team")+" "+(i+1));
    inp.oninput=()=>{t.name=inp.value.trim()?inp.value:null;saveTeams();renderTeams()};
    const row=document.createElement("div");row.className="nrow";
    row.appendChild(avatar(t,i,()=>pickPhoto(i)));row.appendChild(inp);
    const tc=document.createElement("input");tc.type="color";tc.value=teamColor(i);tc.setAttribute("aria-label",T("teamColor")+" "+(i+1));tc.title=T("teamColor");
    tc.oninput=()=>{inp.style.color=tc.value;t.color=tc.value;saveTeams();renderTeams();renderBoard()};
    row.appendChild(tc);
    if(photosOn&&t.photo){const rm=document.createElement("button");rm.type="button";rm.className="rm";rm.textContent="×";rm.setAttribute("aria-label",T("photoRemove"));rm.onclick=()=>{t.photo=null;saveTeams();renderTeams();renderTeamMenu()};row.appendChild(rm)}
    nl.appendChild(row);
  });
}
document.getElementById("photoChk").onchange=e=>{
  photosOn=e.target.checked;
  try{localStorage.setItem("jp-photoson",photosOn?"1":"0")}catch(x){}
  renderTeams();renderTeamMenu();
};
document.getElementById("bothChk").onchange=e=>{
  bonusBoth=e.target.checked;
  try{localStorage.setItem("jp-bonusboth",bonusBoth?"1":"0")}catch(x){}
};
document.getElementById("oneChk").onchange=e=>{
  onePerkTurn=e.target.checked;
  try{localStorage.setItem("jp-oneperk",onePerkTurn?"1":"0")}catch(x){}
};
document.getElementById("secondChk").onchange=e=>{
  secondOn=e.target.checked;
  try{localStorage.setItem("jp-second",secondOn?"1":"0")}catch(x){}
};
document.getElementById("secondNum").oninput=e=>{
  const v=parseFloat(e.target.value);
  if(!isFinite(v)||v<0||v>100)return;
  secondPct=v;
  try{localStorage.setItem("jp-secondpct",secondPct)}catch(x){}
};
document.getElementById("tfChk").onchange=e=>{
  tfNoPass=e.target.checked;
  try{localStorage.setItem("jp-tfnopass",tfNoPass?"1":"0")}catch(x){}
};
document.getElementById("mcPassChk").checked=mcPass;
document.getElementById("mcPassChk").onchange=e=>{mcPass=e.target.checked;try{localStorage.setItem("jp-mcpass",mcPass?"1":"0")}catch(x){}};
document.getElementById("skipChk").onchange=e=>{
  skipOn=e.target.checked;
  try{localStorage.setItem("jp-skip",skipOn?"1":"0")}catch(x){}
};
document.getElementById("groupChk").onchange=e=>{
  groupOn=e.target.checked;
  try{localStorage.setItem("jp-group",groupOn?"1":"0")}catch(x){}
};
document.getElementById("adjChk").onchange=e=>{
  adjOn=e.target.checked;
  try{localStorage.setItem("jp-adj",adjOn?"1":"0")}catch(x){}
  renderTeams();
};
document.getElementById("paintChk").onchange=e=>{
  paintOn=e.target.checked;
  try{localStorage.setItem("jp-paint",paintOn?"1":"0")}catch(x){}
  renderBoard();
};
document.getElementById("rndColors").onclick=()=>{
  const pool=DEFCOLORS.slice();
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const x=pool[i];pool[i]=pool[j];pool[j]=x}
  teams.forEach((t,i)=>{t.color=pool[i%pool.length]});
  saveTeams();renderTeams();renderTeamMenu();renderBoard();
};
document.getElementById("defColors").onclick=()=>{
  teams.forEach(t=>{t.color=null});
  saveTeams();renderTeams();renderTeamMenu();renderBoard();
};
document.getElementById("teamsSel").onchange=e=>{
  const n=+e.target.value;
  while(teams.length<n)teams.push({name:null,score:0});
  teams=teams.slice(0,n);
  if(active>=n)active=0;
  const freed=[];
  won.forEach((arr,key)=>{const keep=arr.filter(i=>i<n);if(keep.length===0)freed.push(key);else won.set(key,keep)});
  freed.forEach(k=>{won.delete(k);used.delete(k)});
  saveTeams();renderTeams();renderTeamMenu();renderBoard();refreshFreed(freed);
};
