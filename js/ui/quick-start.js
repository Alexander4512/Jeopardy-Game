// Game presets and the start menu
let lastPre="friends";try{const v=localStorage.getItem("jp-preset");if(v==="classic"||v==="party"||v==="friends")lastPre=v}catch(e){}
function applyPreset(pre){
  lastPre=pre;try{localStorage.setItem("jp-preset",pre)}catch(x){}
  board=presetBoard(pre);custom=false;try{localStorage.removeItem("jp-board")}catch(x){}
  if(pre==="party"){randPerks=true;ddOn=true}else if(pre==="classic"){randPerks=false;ddOn=false}
  if(pre==="friends"){randPerks=false;ddOn=false}
  if(pre==="party"||pre==="classic"||pre==="friends"){try{localStorage.setItem("jp-randperks",randPerks?"1":"0");localStorage.setItem("jp-ddon",ddOn?"1":"0")}catch(x){}}
  finalOn=pre==="party";try{localStorage.setItem("jp-final",finalOn?"1":"0")}catch(x){}
}
function presetBoard(k){
  /* every game type is built from the categories turned on in the start page */
  const spec={friends:{cats:4,rows:5},quick:{cats:3,rows:2},classic:{cats:5,rows:5},party:{cats:5,rows:5}}[k];
  if(!spec)return builtIn(lang);
  const rows=[100,200,300,400,500].slice(0,spec.rows).map(p=>({pts:p,time:null}));
  const on=LIB[lang].map((c,i)=>i).filter(i=>!catOff.has(i));
  const pool=on.slice();
  if(pool.length>spec.cats)for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=pool[i];pool[i]=pool[j];pool[j]=t}
  return pool.slice(0,spec.cats).map(idx=>fromLib(lang,idx,{clues:rows.map(r=>Object.assign({},r))}));
}
const QS_ICON={friends:"🧑‍🤝‍🧑",quick:"⚡",classic:"🎩",party:"🎉",keep:"💾"};
const QS_DIFF_ICON={easy:"🌱",medium:"⚖️",hard:"🔥",impossible:"💀"};
function openQuickStart(fromGame){
  const d=document.getElementById("qsDlg");if(d.open)return;let cancelled=false;let n=Math.min(6,Math.max(2,teams.length));
  ["qsPre","qsDiffB","qsCount","qsNames"].forEach(id=>{document.getElementById(id).textContent=""}); /* rebuilt per opening so handlers use this call's state */
  const names=teams.map(t=>t.name||"");const cols=teams.map(t=>t.color||null);
  let pre=custom?"keep":"friends",dsel=diff;
  const set=(id,t)=>document.getElementById(id).textContent=t;
  set("qsH",T("qsWelcome"));set("qsNote",T("qsNote"));set("qsT",T("qsTeams"));set("qsN",T("qsNames"));set("qsPreL",T("qsPre"));set("qsDiffL",T("qsDiffL"));set("qsGoT",T("qsStart"));
  const drawCount=()=>{
    const c=document.getElementById("qsCount");
    if(c.children.length!==6){ /* 5 buttons + sliding highlight, built once */
      c.textContent="";const ind=document.createElement("span");ind.className="qs-ind";c.appendChild(ind);
      for(let k=2;k<=6;k++){const b=document.createElement("button");b.type="button";b.textContent=k;b.className="qs-chip";b.onclick=()=>{n=k;drawCount();drawNames()};c.appendChild(b)}
    }
    c.querySelector(".qs-ind").style.transform="translateX("+((n-2)*100)+"%)";
    c.querySelectorAll(".qs-chip").forEach((b,i)=>{const on=i+2===n;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});
  };
  const drawNames=()=>{
    const w=document.getElementById("qsNames");
    while(w.children.length>n)w.lastElementChild.remove();
    for(let i=w.children.length;i<n;i++){ /* keep existing rows; only add the new ones */
      const row=document.createElement("div");row.className="qsn";
      const num=document.createElement("span");num.className="qsn-num";num.textContent=i+1;
      const sw=document.createElement("input");sw.type="color";sw.value=cols[i]||teamColor(i);sw.setAttribute("aria-label",T("teamColor")+" "+(i+1));
      const inp=document.createElement("input");inp.type="text";inp.maxLength=24;inp.value=names[i]||"";inp.placeholder=T("team")+" "+(i+1);inp.setAttribute("aria-label",T("team")+" "+(i+1));
      const paint=()=>{row.style.setProperty("--tc",sw.value);inp.style.color=sw.value};
      sw.oninput=()=>{cols[i]=sw.value;paint()};inp.oninput=()=>{names[i]=inp.value};paint();
      row.append(num,sw,inp);w.appendChild(row)}
  };
  const drawPre=()=>{
    const g=document.getElementById("qsPre");
    const list=[["friends","qsFriends"],["quick","qsQuick"],["classic","qsClassic"],["party","qsParty"]].concat(custom?[["keep","qsKeep"]]:[]);
    if(g.children.length!==list.length){ /* built once; later calls only update the selected state */
      g.textContent="";
      list.forEach(o=>{
        const b=document.createElement("button");b.type="button";b.className="qs-card qs-pre";b.dataset.k=o[0];
        b.innerHTML="<span class='qs-check' aria-hidden='true'>✓</span><span class='qs-ic'></span><b></b><small></small>";
        b.querySelector(".qs-ic").textContent=QS_ICON[o[0]]||"🎮";b.querySelector("b").textContent=T(o[1]);b.querySelector("small").textContent=T(o[1]+"D");
        b.onclick=()=>{pre=o[0];drawPre()};g.appendChild(b)});
    }
    qsPreSel=pre;try{qsCatGuard(true)}catch(e){}
    g.querySelectorAll(".qs-card").forEach(b=>{const on=b.dataset.k===pre;b.classList.toggle("ghost",!on);b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});
  };
  const drawDiff=()=>{
    const db=document.getElementById("qsDiffB"),ks=["easy","medium","hard","impossible"];
    if(db.children.length!==5){
      db.textContent="";const ind=document.createElement("span");ind.className="qs-ind";db.appendChild(ind);
      ks.forEach(k=>{const b=document.createElement("button");b.type="button";b.className="qs-dstep";b.dataset.k=k;
        b.innerHTML="<span class='qs-dic'></span><span class='qs-dnm'></span>";b.querySelector(".qs-dic").textContent=QS_DIFF_ICON[k]||"";b.querySelector(".qs-dnm").textContent=T(k);
        b.onclick=()=>{dsel=k;drawDiff()};db.appendChild(b)});
    }
    db.dataset.level=dsel;db.querySelector(".qs-ind").style.transform="translateX("+(ks.indexOf(dsel)*100)+"%)";
    db.querySelectorAll(".qs-dstep").forEach(b=>{const on=b.dataset.k===dsel;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on)});
    const D=DIFF[dsel],inf=document.getElementById("qsDiffInfo");inf.textContent="";
    [["⏱",D.time?D.time+" "+T("secPer"):T("noTimer")],["💥",D.mult?T("penX").split("{x}").join(D.mult):T("noPen")]].forEach(x=>{
      const c=document.createElement("span");c.className="qs-stat";const i=document.createElement("i");i.textContent=x[0];c.append(i,document.createTextNode(x[1]));inf.appendChild(c)});
    inf.classList.remove("pop");void inf.offsetWidth;inf.classList.add("pop");
  };
  const draw=()=>{drawCount();drawNames();drawPre();drawDiff()};
  draw();
  const back=document.getElementById("qsBack");back.hidden=!fromGame;back.textContent="← "+T("qsBackLbl");
  back.onclick=()=>{cancelled=true;d.close()};
  d.oncancel=()=>{if(fromGame)cancelled=true};
  d.onclose=()=>{
    if(cancelled)return;
    {const need=(pre==="classic"||pre==="party")?5:3;if(LIB[lang].length-catOff.size<need){ /* safety: never start with too few categories */
      const nx=new Set(catOff);for(let k=0;k<LIB[lang].length&&LIB[lang].length-nx.size<need;k++)nx.delete(k);
      catOff=nx;try{localStorage.setItem("jp-catoff",JSON.stringify(Array.from(catOff)))}catch(x){}}}
    diff=dsel;try{localStorage.setItem("jp-diff2",diff)}catch(x){}
    while(teams.length<n)teams.push({name:null,score:0});
    teams=teams.slice(0,n);teams.forEach((t,i)=>{t.name=(names[i]||"").trim()||null;if(cols[i])t.color=cols[i]});
    saveTeams();
    if(pre!=="keep")applyPreset(pre);
    undoStack=[];redoStack=[];newGame();applyLang();
  };
  d.showModal();
  {const q=d.querySelector(".qs");if(q)q.scrollTop=0;setTimeout(()=>{if(q)q.scrollTop=0},50)}
}



/* ways back to the start page */
function goStart(){const m=document.getElementById("menuDlg");try{if(m&&m.open)m.close()}catch(e){}openQuickStart(true)}
["homeBtn","startPageBtn"].forEach(id=>{const b=document.getElementById(id);if(b)b.onclick=goStart});
{const h1=document.querySelector(".title h1");if(h1){h1.tabIndex=0;h1.setAttribute("role","button");h1.style.cursor="pointer";h1.onclick=goStart;h1.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();goStart()}}}}
