// Shared game state, difficulty settings and persisted options
const VALUES=[100,200,300,400,500];
const DIFF={easy:{time:0,mult:0},medium:{time:30,mult:1},hard:{time:15,mult:1},impossible:{time:8,mult:2}};
const DIFF_DEF=JSON.parse(JSON.stringify(DIFF));
try{const sd=JSON.parse(localStorage.getItem("jp-diffs")||"{}");if(localStorage.getItem("jp-diffs-v")!=="2"){if(sd.medium&&sd.medium.time===0)sd.medium.time=30;localStorage.setItem("jp-diffs-v","2")}Object.keys(DIFF).forEach(k=>{const o=sd[k];if(o&&Number.isFinite(o.time)&&Number.isFinite(o.mult))DIFF[k]={time:Math.max(0,Math.round(o.time)),mult:Math.max(0,o.mult)}})}catch(e){}
let lang="en",auto=true,diff="medium",teams,active,used,won=new Map(),dead=new Set(),hist=[],played=0,restrictPts=null,bombTeam=null,current,tmr,left,undoStack=[],paused=false,total=0,ddNum=1,ddOn=true,finalOn=true,finalDone=false,ddSet=new Set();
try{const a=localStorage.getItem("jp-dd");if(a!==null&&isFinite(+a))ddNum=Math.max(0,Math.min(5,Math.round(+a)));finalOn=localStorage.getItem("jp-final")==="1";ddOn=localStorage.getItem("jp-ddon")==="1"}catch(e){}
try{lang=localStorage.getItem("jp-lang")||"en";auto=localStorage.getItem("jp-auto")!=="0";diff=localStorage.getItem("jp-diff2")||"medium"}catch(e){}
if(!UI[lang])lang="en";
if(!DIFF[diff])diff="medium";
