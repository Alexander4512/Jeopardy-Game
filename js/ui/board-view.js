// Language, new game and board rendering
let skipFirstPen=true,skipOthersPen=false;
try{skipFirstPen=localStorage.getItem("jp-skipfirst")!=="0";skipOthersPen=localStorage.getItem("jp-skipothers")==="1"}catch(e){}
UI.en.pal="Color palettes";UI.es.pal="Paletas de colores";
const T=k=>UI[lang][k];
const teamName=(t,i)=>t.name===null?T("team")+" "+(i+1):t.name;

function applyLang(){
  try{applyMode()}catch(e){}
  document.documentElement.lang=lang;
  document.querySelectorAll("[data-i18n]").forEach(e=>e.textContent=T(e.dataset.i18n));
  document.getElementById("reset").textContent=T("reset");
  document.getElementById("closeClue").setAttribute("aria-label",T("closeLbl"));
  document.getElementById("board").setAttribute("aria-label",T("board"));
  document.getElementById("langSel").value=lang;
  document.getElementById("autoChk").checked=auto;
  const ds=document.getElementById("diffSel");ds.textContent="";
  Object.keys(DIFF).forEach(k=>{const o=document.createElement("option");o.value=k;o.textContent=T(k);ds.appendChild(o)});
  if(!custom)board=reLang(board,lang);
  renderTeamMenu();renderColorMenu();renderTypeMenu();renderBarBtns();
  ds.value=diff;renderDiffMenu();
  renderBoard();renderTeams();
}
function newGame(){
  undoStack=[];redoStack=[];
  teams=savedNames.map((n,i)=>({name:n,score:0,photo:savedPhotos[i]||null,color:savedTColors[i]||null}));
  won=new Map();dead=new Set();hist=[];played=0;restrictPts=null;chRestrict=null;bombTeam=null;perkCount={bomb:0,delegate:0};perkThisTurn=false;
  active=0;used=new Set();current=null;mqUsed=new Set();dropVirt();stage=1;
  bombLevel=perkCfg.bomb.qty;placeBombs(bombLevel);
  finalDone=false;{const f=document.getElementById("finDlg");if(f&&f.open)f.close()}placeDD();
  renderBoard();renderTeams();
}
const key0=(ci,r)=>ci+"-"+r;
const paintBg=cols=>{
  if(cols.length===1)return cols[0];
  const n=cols.length;
  return "linear-gradient(135deg,"+cols.map((c,i)=>c+" "+(i*100/n)+"% "+((i+1)*100/n)+"%").join(",")+")";
};
function renderBoard(){
  try{updateStageTag()}catch(e){}
  const b=document.getElementById("board");b.textContent="";
  const D=board.filter(c=>!c.virt);
  D.forEach((c,hci)=>{const d=document.createElement("div");d.className="cat";d.setAttribute("role","columnheader");
    const mid=document.createElement("div");mid.className="catmid";mid.textContent=c.cat;
    const locked=Array.from(used).some(k=>k.indexOf(hci+"-")===0);
    const arrow=(ch,dir)=>{const ab=document.createElement("button");ab.type="button";ab.className="arrow";ab.textContent=ch;ab.setAttribute("aria-label",T(dir<0?"prevCat":"nextCat")+": "+c.cat);ab.disabled=(locked&&!rotPlayed)||!!selMode||!!current;ab.onclick=e=>{e.stopPropagation();rotateCol(hci,dir)};return ab};
    d.append(arrow("‹",-1),mid,arrow("›",1));if(c.diff&&DIFF[c.diff]){const sm=document.createElement("small");sm.textContent=T(c.diff);mid.appendChild(sm)}
    if(selMode==="add"){
      d.classList.add("pick");d.tabIndex=0;d.onclick=()=>pickCol(hci);
      d.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pickCol(hci)}};
      if(allocSel[hci]){const bd=document.createElement("small");bd.className="badge";bd.textContent="+"+allocSel[hci];mid.appendChild(bd)}
    }
    b.appendChild(d)});
  b.style.gridTemplateColumns="repeat("+D.length+",minmax(var(--colmin,0px),1fr))";
  b.dataset.dense=D.length>=8?"2":D.length>=6?"1":"0";
  rowsOf(D).forEach(r=>D.forEach((c,ci)=>{if(!c.clues[r]||c.clues[r].empty){const sp=document.createElement("div");sp.className="spacer";sp.setAttribute("aria-hidden","true");b.appendChild(sp);return}const v=c.clues[r].pts;
    const t=document.createElement("button");t.className="tile";t.textContent="$"+v;
    t.setAttribute("aria-label",c.cat+" "+T("for")+" $"+v);
    t.disabled=used.has(ci+"-"+r);
    if(used.has(key0(ci,r))&&dead.has(key0(ci,r))){t.classList.add("dead");const sk=document.createElement("span");sk.className="skull";sk.textContent="💀";sk.setAttribute("aria-label",T("deadLbl"));t.appendChild(sk)}
    const wl=(won.get(ci+"-"+r)||[]).filter(i=>teams[i]);
    if(paintOn&&wl.length){
      const cols=wl.map(i=>teamColor(i)),dark=cols.reduce((a,c)=>a+lum(c),0)/cols.length>0.6;
      t.style.background=paintBg(cols);t.style.color=dark?"#111":"#fff";
      if(dark)t.style.textShadow="none";
      t.style.opacity=".65";
    }
    const key=ci+"-"+r;
    if(selMode==="remove"){
      if(selRemove.has(key))t.classList.add("sel");
      t.onclick=()=>{if(selRemove.has(key))selRemove.delete(key);else selRemove.add(key);renderBoard();renderWarn()};
    }else if(selMode==="add"){t.classList.add("inert");t.onclick=()=>{}}
    else if(chRestrict&&!chOk(ci,r)){t.classList.add("blocked");t.onclick=()=>{}}
    else if(restrictPts!==null&&c.clues[r].pts!==restrictPts){t.classList.add("blocked");t.onclick=()=>{}}
    else t.onclick=()=>openClue(ci,r);
    b.appendChild(t);
  }));
}
