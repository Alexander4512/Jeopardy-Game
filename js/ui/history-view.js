// History tab
function renderHistory(){
  const sel=document.getElementById("histSel"),prev=sel.value||"all";
  sel.textContent="";
  const all=document.createElement("option");all.value="all";all.textContent=T("histAll");sel.appendChild(all);
  teams.forEach((t,i)=>{const o=document.createElement("option");o.value=i;o.textContent=teamName(t,i);sel.appendChild(o)});
  sel.value=Array.from(sel.options).some(o=>o.value===prev)?prev:"all";
  const f=sel.value==="all"?null:+sel.value;
  const rows=hist.filter(e=>f===null||e.team===f);
  const st=document.getElementById("histStats");
  if(f===null)st.textContent="";
  else{const c=l=>rows.filter(e=>l.indexOf(e.outcome)>=0).length;st.textContent="✓ "+c(["correct"])+"    ✗ "+c(["wrong"])+"    ↷ "+c(["skip","timeout","noanswer"])}
  const ol=document.getElementById("histList");ol.textContent="";
  if(!rows.length){const li=document.createElement("li");li.textContent=T("histEmpty");ol.appendChild(li);return}
  rows.slice().reverse().forEach(e=>{
    const li=document.createElement("li");li.style.borderLeftColor=e.color;
    const top=document.createElement("div");top.className="top";
    const who=document.createElement("span");who.textContent=teams[e.team]?teamName(teams[e.team],e.team):e.name;who.style.color=teams[e.team]?teamColor(e.team):e.color;who.style.fontWeight="800";
    const what=document.createElement("span");what.className="o-"+e.outcome;
    what.textContent=T("h_"+e.outcome)+(e.delta?" ("+(e.delta>0?"+":"−")+"$"+Math.abs(e.delta)+")":"")+(e.note?" · "+e.note:"");
    top.append(who,what);
    const q=document.createElement("div");q.className="q";q.textContent=e.cat+" · $"+e.pts+" — "+e.q;
    if(e.outcome==="manual"||e.outcome==="bomb"||e.outcome==="delegate")li.append(top);else li.append(top,q);
    ol.appendChild(li);
  });
}
document.getElementById("histSel").onchange=renderHistory;
document.getElementById("histClear").onclick=()=>{hist=[];renderHistory()};
