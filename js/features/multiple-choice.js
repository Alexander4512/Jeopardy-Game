let mcPass=true;try{mcPass=localStorage.getItem("jp-mcpass")!=="0"}catch(e){} // next team may answer after a miss
// Multiple-choice rendering and answers
let mcOn=true,mcMin=2,mcMax=6;
try{mcOn=localStorage.getItem("jp-mc2")==="1";const a=parseInt(localStorage.getItem("jp-mcmin")),b=parseInt(localStorage.getItem("jp-mcmax"));if(a>=2&&a<=6)mcMin=a;if(b>=2&&b<=6)mcMax=b}catch(e){}
function makeMC(cl,r,nr){
  if(!cl||(cl.type&&cl.type!=="normal"&&cl.type!=="mc"&&!isImg(cl))||(cl.type!=="mc"&&!isImg(cl)&&!mcOn)||!Array.isArray(cl.ch)||!cl.ch.length)return null;
  const lo=Math.min(mcMin,mcMax),hi=Math.max(mcMin,mcMax);
  let n=nr>1?Math.round(lo+(hi-lo)*r/(nr-1)):hi;
  n=Math.max(2,Math.min(n,cl.ch.length+1,6));
  const opts=cl.ch.slice(0,n-1).map(t=>({t,c:0}));opts.push({t:cl.ca||cl.a,c:1});
  for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const x=opts[i];opts[i]=opts[j];opts[j]=x}
  return opts;
}
function pickMC(i){
  if(!current||!current.mc||current.done)return;
  current.pick=i;
  if(!current.mc[i].c)(current.tried=current.tried||[]).push(i);
  document.getElementById("answer").hidden=false;
  judge(current.mc[i].c?"right":"wrong");
  renderMC();
}
function renderMC(){
  try{updateRR()}catch(e){}
  {const n=document.getElementById("rqNote");if(n){const on=!!(current&&current.rq);n.hidden=!on;if(on){const cl=clueOf();n.textContent=rqText("🎲 Random question: ","🎲 Pregunta al azar: ")+(rqMode==="flat"?rqText("correct answer from the team that took it pays $"+(cl.pts+rqFlat)+".","si responde bien el equipo que la pidió, vale $"+(cl.pts+rqFlat)+"."):rqText("correct answer from the team that took it pays $"+Math.round(cl.pts*rqMult)+".","si responde bien el equipo que la pidió, vale $"+Math.round(cl.pts*rqMult)+"."))}}}
  const box=document.getElementById("mcBox");if(!box)return;
  box.textContent="";
  const mc=current&&(current.mc||current.gmc);
  box.hidden=!mc;if(!mc)return;
  const fin=!!current.done,live=!!current.mc&&!fin;
  mc.forEach((o,i)=>{const d=document.createElement("div");d.className="mco"+(fin&&o.c?" ok":"")+(fin&&current.pick===i&&!o.c?" no":"");d.setAttribute("role","button");const tried=!fin&&(current.tried||[]).includes(i);if(tried)d.classList.add("tried");d.setAttribute("aria-disabled",(fin||tried)?"true":"false");if(live&&!tried)d.tabIndex=0;const l=document.createElement("b");l.textContent="ABCDEF"[i];d.append(l,document.createTextNode(o.t));
    if(live&&!tried){d.onclick=()=>pickMC(i);d.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pickMC(i)}}}
    box.appendChild(d)});
}
