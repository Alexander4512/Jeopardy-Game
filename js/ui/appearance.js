// Colors, theme, fonts and text size
const COLDEF={
  dark:{bg:"#14152B",tile:"#272A4F",gold:"#FF6B5A",ink:"#FFF1EC"},
  light:{bg:"#FFF3EF",tile:"#272A4F",gold:"#FF6B5A",ink:"#14152B"},
  cyber:{bg:"#0A0A0F",tile:"#14141F",gold:"#FCEE0A",ink:"#E8F9FF"}
};
const THEMES=["dark","light","cyber"];
const THEME_NAME={dark:"🌙 Dark",light:"☀ Light",cyber:"⚡ Cyberpunk 2077"};
let theme="dark",allColors={dark:{},light:{},cyber:{}};
try{
  {const t0=localStorage.getItem("jp-theme");theme=THEMES.indexOf(t0)>=0?t0:"dark"}
  const sc=JSON.parse(localStorage.getItem("jp-colors")||"{}")||{};
  allColors=(sc.dark||sc.light||sc.cyber)?{dark:sc.dark||{},light:sc.light||{},cyber:sc.cyber||{}}:{dark:sc,light:{},cyber:{}};
}catch(e){}
const curColors=()=>allColors[theme];
function saveColors(){try{localStorage.setItem("jp-colors",JSON.stringify(allColors))}catch(x){}}
function applyColors(){
  document.documentElement.dataset.theme=theme;
  const st=document.documentElement.style,c=curColors(),d=COLDEF[theme];
  const set=(k,v)=>{if(v)st.setProperty(k,v);else st.removeProperty(k)};
  set("--bg",c.bg);set("--tile",c.tile);set("--gold",c.gold);set("--ink",c.ink);
  const bg=c.bg||d.bg,tile=c.tile||d.tile,ink=c.ink||d.ink;
  set("--tile-hover",c.tile?"color-mix(in srgb,"+tile+" 80%,#fff)":null);
  if(theme!=="light"){
    const any=c.bg||c.tile;
    set("--line",any?"color-mix(in srgb,"+bg+" 55%,#000)":null);
    set("--panel",any?"color-mix(in srgb,"+bg+" 65%,"+tile+")":null);
  }else{
    set("--line",c.bg?"color-mix(in srgb,"+bg+" 78%,#000)":null);
    set("--panel",c.bg?"color-mix(in srgb,"+bg+" 92%,#000)":null);
  }
  set("--muted",c.ink?"color-mix(in srgb,"+ink+" 65%,"+bg+")":null);
}
const COLIN={bg:"colBg",tile:"colTile",gold:"colGold",ink:"colInk"};
function renderColorMenu(){Object.keys(COLIN).forEach(k=>{document.getElementById(COLIN[k]).value=curColors()[k]||COLDEF[theme][k]})}
Object.keys(COLIN).forEach(k=>{
  document.getElementById(COLIN[k]).oninput=e=>{curColors()[k]=e.target.value;saveColors();applyColors()};
});
const PALS=[
 ["Midnight coral","#14152B","#272A4F","#FF6B5A","#FFF1EC"],
 ["Forest mint","#0F2A24","#1E4D42","#7FE3C1","#F2E8CF"],
 ["Plum peach","#2A1433","#4B2560","#FFB38A","#FFD9C4"],
 ["Charcoal lime","#18181B","#2E2E35","#C6F432","#F4F4F5"],
 ["Burgundy sand","#2B0F14","#5A1F2B","#F4C9A0","#FBEFE6"],
 ["Slate teal","#1B2129","#2F3A47","#2EE6C5","#EEF2F5"],
 ["Graphite pink","#17171C","#33303D","#FF5FA2","#FFF0F6"]];
(function(){const row=document.getElementById("palRow");PALS.forEach(p=>{const b=document.createElement("button");b.type="button";b.title=p[0];b.setAttribute("aria-label",p[0]);
 b.style.cssText="width:56px;height:40px;padding:4px;border-radius:10px;border:2px solid var(--muted);background:"+p[1]+";display:flex;gap:3px;align-items:stretch";
 b.innerHTML='<i style="flex:1;border-radius:4px;background:'+p[2]+'"></i><i style="flex:1;border-radius:4px;background:'+p[3]+'"></i>';
 b.onclick=()=>{if(theme==="light")setTheme("dark");allColors[theme]={bg:p[1],tile:p[2],gold:p[3],ink:p[4]};saveColors();applyColors();renderColorMenu()};
 row.appendChild(b)})})();
document.getElementById("colReset").onclick=()=>{allColors[theme]={};saveColors();applyColors();renderColorMenu()};
function renderBarBtns(){
  const tb=document.getElementById("themeBtn"),tl="Theme: "+THEME_NAME[theme];
  tb.textContent=THEME_NAME[theme];tb.setAttribute("aria-label",tl);tb.title=tl;
  {const hb=document.getElementById("homeBtn");if(hb){hb.title=T("homeTip");hb.setAttribute("aria-label",T("homeTip"))}}
  const lb=document.getElementById("langBtn"),ll=T("switchLang");
  lb.textContent=lang==="en"?"ES":"EN";lb.setAttribute("aria-label",ll);lb.title=ll;
}
function setTheme(t){
  theme=t;try{localStorage.setItem("jp-theme",t)}catch(x){}
  applyColors();renderColorMenu();renderBarBtns();try{applyType()}catch(e){}
}
document.getElementById("themeBtn").onclick=()=>setTheme(THEMES[(THEMES.indexOf(theme)+1)%THEMES.length]);
document.getElementById("langBtn").onclick=()=>setLang(lang==="en"?"es":"en");
document.getElementById("rndBtn").onclick=()=>{
  active=Math.floor(Math.random()*teams.length);
  renderTeams();
  document.getElementById("rndBtn").textContent="🎲 "+T("starts")+" "+teamName(teams[active],active);
};
applyColors();
["colsSel","rowsSel"].forEach(id=>{
  const sel=document.getElementById(id);
  for(let n=1;n<=10;n++){const o=document.createElement("option");o.value=n;o.textContent=n;sel.appendChild(o)}
  sel.onchange=()=>{id==="colsSel"?resizeCols(+sel.value):resizeEd(ed.length,+sel.value);syncSteppers()};
});
document.querySelectorAll(".dimcard .stepbtn").forEach(b=>b.onclick=()=>{
  const sel=document.getElementById(b.closest(".dimcard").dataset.for),v=Math.max(1,Math.min(10,(+sel.value||1)+(+b.dataset.d)));
  if(v===+sel.value)return;sel.value=v;sel.onchange();
});
function syncSteppers(){
  const c=+document.getElementById("colsSel").value||0,r=+document.getElementById("rowsSel").value||0;
  document.getElementById("colsVal").textContent=c;document.getElementById("rowsVal").textContent=r;
  document.querySelectorAll(".dimcard").forEach(d=>{const v=+document.getElementById(d.dataset.for).value;d.querySelector('[data-d="-1"]').disabled=v<=1;d.querySelector('[data-d="1"]').disabled=v>=10});
  const g=document.getElementById("gridPrev");if(!g)return;g.textContent="";g.style.gridTemplateColumns="repeat("+c+",1fr)";
  for(let i=0;i<c;i++){const h=document.createElement("i");h.className="ph";g.appendChild(h)}
  for(let j=0;j<r;j++)for(let i=0;i<c;i++){g.appendChild(document.createElement("i"))}
}
function setItems(ci,n){
  edDirty=true;
  const cl=ed[ci].clues;
  while(cl.length<n){const r=cl.length,ref=ed.find(x=>x.clues[r]);cl.push({q:"",a:"",pts:ref?ref.clues[r].pts:(r+1)*100,time:ref?ref.clues[r].time:null})}
  ed[ci].clues=cl.slice(0,n);
  renderEditor();
}
function resizeCols(n){
  edDirty=true;
  while(ed.length<n)ed.push({cat:"",clues:rowsOf(ed).map(r=>{const ref=ed.find(x=>x.clues[r]).clues[r];return{q:"",a:"",pts:ref.pts,time:ref.time}})});
  ed=ed.slice(0,n);
  renderEditor();
}
function resizeEd(cols,rows){
  edDirty=true;
  ed.forEach(c=>{
    while(c.clues.length<rows){const r=c.clues.length;c.clues.push({q:"",a:"",pts:(r+1)*100,time:null})}
    c.clues=c.clues.slice(0,rows);
  });
  while(ed.length<cols)ed.push({cat:"",clues:ed[0].clues.map(x=>({q:"",a:"",pts:x.pts,time:x.time}))});
  ed=ed.slice(0,cols);
  renderEditor();
}
const FONTS={
  default:['"Nunito",system-ui,sans-serif','"Nunito",system-ui,sans-serif'],
  sans:['"Helvetica Neue",Arial,sans-serif','"Helvetica Neue",Arial,sans-serif'],
  serif:['Georgia,"Times New Roman",serif','Georgia,"Times New Roman",serif'],
  classic:['"Oswald","Arial Narrow",sans-serif','"Bitter",Georgia,serif'],
  play:['"Comic Neue","Comic Sans MS",cursive','"Comic Neue","Comic Sans MS",cursive'],
  mono:['"Courier New",ui-monospace,monospace','"Courier New",ui-monospace,monospace']
};
let fontKey="default",size=100;
try{fontKey=localStorage.getItem("jp-font")||"default";size=+localStorage.getItem("jp-size")||100}catch(e){}
if(!FONTS[fontKey])fontKey="default";
size=Math.min(160,Math.max(80,size));
function applyType(){
  const st=document.documentElement.style,f=(theme==="cyber"&&fontKey==="default")?['"Orbitron","Rajdhani",system-ui,sans-serif','"Rajdhani",system-ui,sans-serif']:FONTS[fontKey];
  st.setProperty("--f-head",f[0]);st.setProperty("--f-body",f[1]);st.setProperty("--scale",size/100);
}
function renderTypeMenu(){
  const sel=document.getElementById("fontSel");sel.textContent="";
  Object.keys(FONTS).forEach(k=>{const o=document.createElement("option");o.value=k;o.textContent=T("f_"+k);sel.appendChild(o)});
  sel.value=fontKey;
  document.getElementById("sizeRng").value=size;
  document.getElementById("sizeOut").textContent=size+"%";
}
document.getElementById("fontSel").onchange=e=>{
  fontKey=e.target.value;
  try{localStorage.setItem("jp-font",fontKey)}catch(x){}
  applyType();
};
document.getElementById("sizeRng").oninput=e=>{
  size=+e.target.value;
  document.getElementById("sizeOut").textContent=size+"%";
  try{localStorage.setItem("jp-size",size)}catch(x){}
  applyType();
};
applyType();

// Reduce motion option (default OFF = animations on; ignores the OS setting)
function applyCalm(on){document.documentElement.dataset.calm=on?"1":"0"}
(function(){
  let on=false;try{on=localStorage.getItem("jp-calm")==="1"}catch(e){}
  applyCalm(on);
  const c=document.getElementById("calmChk");c.checked=on;
  c.onchange=()=>{applyCalm(c.checked);try{localStorage.setItem("jp-calm",c.checked?"1":"0")}catch(e){}};
})();
