// Clue images and CSV import
const okImg=u=>typeof u==="string"&&/^(https:\/\/|data:image\/)/i.test(u.trim());
function setClueImg(){
  const im=document.getElementById("clueImg");if(!im)return;
  const cl=current?clueOf():null;
  if(cl&&okImg(cl.img)){im.src=cl.img.trim();im.hidden=false}else{im.removeAttribute("src");im.hidden=true}
}
function parseCSV(t){
  const rows=[];let row=[],f="",q=false;
  for(let i=0;i<t.length;i++){const c=t[i];
    if(q){if(c==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;
    else if(c===","||c===";"&&false){row.push(f);f=""}
    else if(c==="\n"||c==="\r"){if(c==="\r"&&t[i+1]==="\n")i++;row.push(f);f="";if(row.some(x=>x.trim()))rows.push(row);row=[]}
    else f+=c}
  row.push(f);if(row.some(x=>x.trim()))rows.push(row);
  return rows;
}
function importCSV(text){
  const edMsg=document.getElementById("edMsg");
  let rows=parseCSV(text.replace(/^﻿/,""));
  if(rows.length&&isNaN(parseFloat(rows[0][1])))rows=rows.slice(1);
  const cats=new Map();let n=0;
  rows.forEach(r=>{
    const cat=(r[0]||"").trim(),pts=Math.round(parseFloat(r[1])),q=(r[2]||"").trim(),a=(r[3]||"").trim(),img=(r[4]||"").trim();
    if(!cat||!isFinite(pts)||!q||!a)return;
    if(!cats.has(cat)){if(cats.size>=10)return;cats.set(cat,[])}
    const arr=cats.get(cat);if(arr.length>=10)return;
    const cl={pts,time:null,q,a};if(okImg(img))cl.img=img;arr.push(cl);n++;
  });
  if(!n){say(edMsg,"csvBad");return}
  const nb=[];let maxR=0;cats.forEach(a=>{maxR=Math.max(maxR,a.length)});
  cats.forEach((arr,cat)=>{arr.sort((x,y)=>x.pts-y.pts);while(arr.length<maxR)arr.push({pts:(VALUES[arr.length]||(arr.length+1)*100),time:null,q:"",a:"",empty:true});nb.push({cat,clues:arr})});
  if(!validBoard(nb)){say(edMsg,"csvBad");return}
  board=nb;custom=true;
  try{localStorage.setItem("jp-board",JSON.stringify(board))}catch(x){}
  ed=null;edDirty=false;newGame();showTab("Game");
  const m=document.getElementById("teamMsg");if(m){m.textContent=T("csvOk").split("{n}").join(n).split("{c}").join(cats.size);m.className="hint msg-ok"}
}
document.getElementById("csvBtn").onclick=()=>document.getElementById("csvIn").click();
document.getElementById("csvIn").onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>importCSV(String(rd.result||""));rd.readAsText(f);e.target.value=""};
