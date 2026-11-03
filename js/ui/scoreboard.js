// Messages, round label and team scoreboard
const MSGKIND={"incomplete": "err", "needTopics": "err", "genFail": "err", "rndNoAI": "err", "rndFull": "err", "rndFail": "err", "freedFail": "err", "catsMin": "err", "needEmpty": "warn", "noAI": "warn", "freedNoAI": "warn", "typesDone": "warn", "genning": "info", "rndGen": "info", "freedGen": "info", "genOk": "ok", "rndDone": "ok", "freedDone": "ok", "bombDone": "ok"};
function say(el,key){
  el.textContent=T(key);
  el.classList.remove("msg-err","msg-warn","msg-ok","msg-info");
  if(MSGKIND[key])el.classList.add("msg-"+MSGKIND[key]);
}
function renderRound(){
  const el=document.getElementById("roundLbl");
  if(el&&teams&&teams.length){
    const tot=Math.max(1,Math.ceil(boardTotal()/teams.length)),cur=Math.min(Math.floor(played/teams.length)+1,tot);
    if(!el.querySelector(".rl-num")){el.innerHTML='<span class="rl-cap"></span><b class="rl-num"></b><span class="rl-of"></span><i class="rl-bar"><u></u></i>'}
    el.querySelector(".rl-cap").textContent=T("round");
    const num=el.querySelector(".rl-num");
    if(num.textContent!==String(cur)){const first=num.textContent==="";num.textContent=cur;if(!first){num.classList.remove("pop");void num.offsetWidth;num.classList.add("pop")}}
    el.querySelector(".rl-of").textContent="/ "+tot;
    const done=Math.max(0,Math.min(1,(played%teams.length)/teams.length));
    el.querySelector(".rl-bar u").style.width=Math.round(((cur-1)+done)/tot*100)+"%";
    el.setAttribute("aria-label",T("round")+" "+cur+" / "+tot);
  }
  renderWarn();renderPerks();renderRestrict();renderBombLbl()}
function renderTeams(){
  try{updateRQ();updateCH();updateMQ();renderRestrict()}catch(e){}
  renderRound();renderUndo();try{renderPick();armIdle()}catch(e){}
  const w=document.getElementById("teams");w.textContent="";
  teams.forEach((t,i)=>{
    const d=document.createElement("div");d.className="team"+(i===active?" active":"");
    const inp=document.createElement("input");inp.value=teamName(t,i);inp.setAttribute("aria-label",T("team")+" "+(i+1));inp.style.color=teamColor(i);inp.style.fontWeight="800";inp.style.textShadow="0 0 8px rgba(255,255,255,.3)";
    inp.oninput=()=>{t.name=inp.value.trim()?inp.value:null;saveTeams()};
    inp.onclick=e=>e.stopPropagation();
    const s=document.createElement("div");s.className="score"+(t.score<0?" neg":"");
    s.textContent=(t.score<0?"-$":"$")+Math.abs(t.score).toLocaleString(lang);
    const top=document.createElement("div");top.className="top";top.append(avatar(t,i,()=>pickPhoto(i)),inp);const adj=document.createElement("div");adj.className="adj";
    const amt=document.createElement("input");amt.type="number";amt.min=1;amt.step=50;amt.value=t.adj||100;amt.setAttribute("aria-label",T("adjAmount"));
    amt.oninput=()=>{t.adj=Math.max(1,Math.round(+amt.value||0))};amt.onclick=e=>e.stopPropagation();
    const mkAdj=sign=>{
      const b=document.createElement("button");b.type="button";b.textContent=sign>0?"+":"−";
      b.setAttribute("aria-label",T(sign>0?"adjAdd":"adjRemove")+" "+teamName(t,i));
      b.onclick=e=>{e.stopPropagation();const v=Math.max(1,Math.round(+amt.value||0));pushUndo();t.adj=v;t.score+=sign*v;logManual(i,sign*v);renderTeams()};
      return b;
    };
    adj.append(mkAdj(-1),amt,mkAdj(1));
    if(adjOn)d.append(top,s,adj);else d.append(top,s);
    d.style.boxShadow="inset 6px 0 0 "+teamColor(i);
    d.onclick=()=>{active=i;renderTeams();try{showPickMsg()}catch(e){}};
    w.appendChild(d);
  });
}
