// Perks of the active team, shown under the board with the same cards as the menu
const TP_DEFS=[
  {k:"rq",icon:"🎲",key:"pkn_rq",on:()=>rqOn,left:i=>rqLeft(i),btn:"rqBtn"},
  {k:"ch",icon:"⚔️",key:"pkn_ch",on:()=>chOn,left:i=>chLeft(i),btn:"chBtn"},
  {k:"mq",icon:"❓",key:"pkn_mq",on:()=>mqOn,left:i=>mqLeft(i),btn:"mqBtn"},
  {k:"rr",icon:"🔁",key:"pkn_rr",on:()=>rrOn,left:i=>rrLeft(i)}
];
let tpOpen=false;
function renderTeamPerks(){
  const w=document.getElementById("teamPerks");if(!w)return;
  w.textContent="";
  if(!teams||!teams.length||active==null||!teams[active]){w.hidden=true;return}
  const list=TP_DEFS.filter(d=>{try{return d.on()}catch(e){return false}});
  w.hidden=!list.length;if(!list.length)return;
  const det=document.createElement("div");det.className="tp-det"+(tpOpen?" open":"");
  const h=document.createElement("button");h.type="button";h.className="tp-title";h.setAttribute("aria-expanded",tpOpen?"true":"false");
  h.textContent="🎁 "+T("tpTitle");
  h.onclick=()=>{tpOpen=!tpOpen;det.classList.add("tp-anim");setTimeout(()=>det.classList.remove("tp-anim"),700);det.classList.toggle("open",tpOpen);h.setAttribute("aria-expanded",tpOpen?"true":"false")};
  const wrap=document.createElement("div"),inner=document.createElement("div");wrap.className="tp-wrap";inner.className="tp-inner";
  wrap.appendChild(inner);det.append(h,wrap);w.appendChild(det);
  /* one column per team, side by side, aligned with the team cards */
  const grid=document.createElement("div");grid.className="tp-teams";
  teams.forEach((t,i)=>{
    const col=document.createElement("div");col.className="tp-team"+(i===active?" is-active":"");
    const nm0=document.createElement("div");nm0.className="tp-name";nm0.textContent=teamName(t,i);nm0.style.color=teamColor(i);col.appendChild(nm0);
    const row=document.createElement("div");row.className="tp-cards";
    list.forEach(d=>{
      const left=d.left(i),has=left>0;
      const c=document.createElement("div");c.className="perk-card";
      const lb=document.createElement("label");lb.className="perk-tile";
      const inp=document.createElement("input");inp.type="checkbox";inp.className="perk-input";inp.checked=has;inp.disabled=true;
      const f=document.createElement("span");f.className="perk-face";
      f.dataset.n=left===Infinity?"∞":String(left);
      const ic=document.createElement("span");ic.className="perk-icon";ic.textContent=d.icon;ic.setAttribute("aria-hidden","true");
      const tx=document.createElement("span");tx.className="perk-label";tx.textContent=T(d.key);
      f.append(ic,tx);lb.append(inp,f);c.appendChild(lb);row.appendChild(c);
      const bt=d.btn&&document.getElementById(d.btn);
      if(i===active&&bt){lb.classList.add("tp-use");if(bt.disabled)lb.classList.add("tp-blocked");
        lb.onclick=e=>{e.preventDefault();if(!bt.disabled)bt.click()}}
      else lb.onclick=e=>e.preventDefault();
    });
    col.appendChild(row);grid.appendChild(col);
  });
  inner.appendChild(grid);
}
{const _rt=renderTeams;renderTeams=function(){_rt.apply(this,arguments);try{renderTeamPerks()}catch(e){}}}
