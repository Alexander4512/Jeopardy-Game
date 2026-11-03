// Reset, standings, results, Daily Double placement
function resetGame(){
  applyPreset(lastPre);ed=null;selMode=null;selRemove=new Set();dismissKey="";
  try{localStorage.removeItem("jp-board")}catch(x){}
  newGame();
}
function standings(){
  const order=teams.map((t,i)=>i).sort((a,b)=>teams[b].score-teams[a].score);
  const top=teams[order[0]].score;
  return{order:order,winners:order.filter(i=>teams[i].score===top),rank:i=>1+teams.filter(t=>t.score>teams[i].score).length};
}
const unplayedCount=()=>board.reduce((a,c,ci)=>a+c.clues.filter((x,r)=>!x.empty&&!used.has(ci+"-"+r)).length,0);
function showResults(){try{renderPick()}catch(e){}
  const st=standings(),w=document.getElementById("resWinner");
  w.textContent="";
  if(st.winners.length===1&&photosOn&&teams[st.winners[0]].photo){const im=document.createElement("img");im.src=teams[st.winners[0]].photo;im.alt="";im.className="tavatar";w.appendChild(im)}
  if(st.winners.length>1){const ns=st.winners.map(i=>nm(i)),and=lang==="es"?" y ":" and ",list=ns.slice(0,-1).join(", ")+and+ns[ns.length-1];w.style.whiteSpace="pre-line";w.append(T("tieLbl").split("{x}").join(list))}else w.style.whiteSpace="",w.append(lang==="es"?"🏆 ¡Felicitaciones, "+nm(st.winners[0])+"!\n¡Ganaron la partida! 🎉":"🏆 Congratulations, "+nm(st.winners[0])+"!\nYou won the game! 🎉");
  const ol=document.getElementById("resList");ol.textContent="";
  st.order.forEach(i=>{
    const li=document.createElement("li");li.className="grow";li.style.borderLeftColor=teamColor(i);
    const left=document.createElement("span");left.className="nm";
    const rk=document.createElement("span");rk.className="rk";{const rn=new Set(teams.map(t=>t.score).filter(s=>s>teams[i].score)).size+1;const md=["🥇","🥈","🥉"][rn-1]||"";const en=rn+((rn%100>=11&&rn%100<=13)?"th":["th","st","nd","rd"][rn%10]||"th");rk.textContent=(md?md+" ":"")+(lang==="es"?rn+".º":en)}
    {const nsp=document.createElement("span");nsp.textContent=" "+nm(i);nsp.style.color=teamColor(i);nsp.style.fontWeight="800";left.append(rk,nsp)}
    const right=document.createElement("span");
    const sc=document.createElement("span");sc.className="sc";sc.textContent=(teams[i].score<0?"-$":"$")+Math.abs(teams[i].score).toLocaleString(lang);
    const okN=hist.filter(h=>h.team===i&&h.outcome==="correct").length,badN=hist.filter(h=>h.team===i&&h.outcome==="wrong").length;
    const stt=document.createElement("span");stt.className="st";{const a=document.createElement("span"),c=document.createElement("span");a.textContent="  ✓ "+okN;a.style.cssText="color:var(--good);font-weight:800;white-space:pre";c.textContent="  ✗ "+badN;c.style.cssText="color:var(--bad);font-weight:800;white-space:pre";stt.append(a,c)}
    {const up=teams.map(t=>t.score).filter(s=>s>teams[i].score);if(up.length){const g=Math.min(...up)-teams[i].score,gp=document.createElement("span");gp.textContent=" (−$"+g.toLocaleString(lang)+")";gp.style.cssText="color:var(--bad);font-weight:800";gp.title=lang==="es"?"Distancia al puesto de arriba":"Points behind the next place";sc.after(gp);right.append(sc,gp,stt)}else right.append(sc,stt)}
    li.append(left,right);ol.appendChild(li);
  });
  document.getElementById("resDlg").showModal();
  {let fs=parseFloat(getComputedStyle(w).fontSize);w.style.fontSize="";fs=parseFloat(getComputedStyle(w).fontSize);while(w.scrollWidth>w.clientWidth&&fs>12){fs-=1;w.style.fontSize=fs+"px"}}
}

function placeDD(){
  ddSet=new Set();const ks=[];
  board.forEach((c,ci)=>c.clues.forEach((cl,r)=>{if(cl&&cl.q&&!isGroup(cl))ks.push(ci+"-"+r)}));
  for(let i=ks.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=ks[i];ks[i]=ks[j];ks[j]=t}
  if(ddOn)ks.slice(0,Math.max(1,ddNum)).forEach(k=>ddSet.add(k));
}

