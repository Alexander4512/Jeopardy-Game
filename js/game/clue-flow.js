// Clue lifecycle: open, answer, judge, timer, group answers
const dlg=document.getElementById("dlg");
const clueOf=()=>board[current.ci].clues[current.r];
const dOf=ci=>(board[ci].diff&&DIFF[board[ci].diff])?board[ci].diff:diff;
const isImg=cl=>!!cl&&/^img/.test(cl.type||"");
const nm=i=>teamName(teams[i],i);
function answerText(cl){
  const t=cl.type||"normal";
  if(t==="tf")return T(cl.truth===false?"false":"true");
  if(t==="hl")return T(cl.target>cl.ref?"higher":"lower")+" ("+cl.target+")";
  if(t==="closest")return String(cl.target);
  if(current&&(current.mc||current.gmc)&&board[current.ci]&&board[current.ci].clues[current.r]===cl){const k=(current.mc||current.gmc).findIndex(o=>o.c);if(k>=0)return "ABCDEF"[k]+") "+(cl.ca||cl.a)}
  return cl.a;
}
const isGroup=cl=>groupOn&&cl.type&&cl.type!=="normal"&&cl.type!=="mc"&&cl.type!=="imgseq"&&cl.type!=="img1";
function openClue(ci,r,rq){try{document.getElementById("pickMsg").textContent=""}catch(e){}
  clearTimeout(idleT);document.getElementById("idleHint").hidden=true;
  if(!undoHold&&Date.now()-undoStamp>=50)pushUndo();
  current={ci,r,picker:active,turn:active,asked:0,answered:0,rq:!!rq,bonusTeam:(bonusOn&&restrictPts!==null)?bombTeam:null};
  current.undoBase=true;
  current.chR=chRestrict;chRestrict=null;
  current.mc=makeMC(board[ci].clues[r],r,board[ci].clues.length);
  const cl=board[ci].clues[r];
  document.getElementById("meta").textContent=board[ci].cat+" "+T("for")+" $"+cl.pts;
  document.getElementById("clue").textContent=cl.q;renderMC();
  document.getElementById("answer").textContent=answerText(cl);
  document.getElementById("answer").hidden=true;
  document.getElementById("clueImg").hidden=true;
  document.getElementById("act-end").hidden=true;
  document.getElementById("group").hidden=true;
  document.getElementById("perkActs").hidden=true;
  document.getElementById("act-reveal").hidden=true;
  document.getElementById("act-score").hidden=true;
  dlg.showModal();
  if(ddSet.has(ci+"-"+r)&&!isGroup(cl)&&ddOn&&!used.has(ci+"-"+r)){startDD();return}
  const perkKind=rollPerk(cl,ci,r);
  if(perkKind){showPerk(perkKind);return}
  startQuestion();
}

let redoStack=[],undoStamp=0,undoHold=false;
function snap(){return JSON.stringify({teams,used:[...used],won:[...won],dead:[...dead],hist,played,active,restrictPts,bombTeam,perkThisTurn,perkCount,bombSet:[...(bombSet||[])],bombLevel,chRestrict,mqUsed:[...mqUsed],vcol:(()=>{const v=board.find(c=>c.virt);return v||null})(),current})}
function pushUndo(){
  /* inside a question the snapshot taken when it was opened is the single undo point */
  if(current&&current.undoBase){renderUndo();return}
  undoStamp=Date.now();
  try{undoStack.push(snap());redoStack=[];if(undoStack.length>40)undoStack.shift()}catch(e){}
  renderUndo();
}
function renderUndo(){
  ["undoBtn","undoClue"].forEach(id=>{const b=document.getElementById(id);if(!b)return;b.disabled=!undoStack.length;b.title=T("undoTip");b.setAttribute("aria-label",T("undoTip"))});
  const r=document.getElementById("redoBtn");if(r){r.disabled=!redoStack.length;r.title=T("redoTip");r.setAttribute("aria-label",T("redoTip"))}
}
function doUndo(){
  if(!undoStack.length)return;
  try{redoStack.push(snap())}catch(e){}
  restoreSnap(JSON.parse(undoStack.pop()));
}
function doRedo(){
  if(!redoStack.length)return;
  try{undoStack.push(snap())}catch(e){}
  restoreSnap(JSON.parse(redoStack.pop()));
}
function restoreSnap(o){
  stopTimer();
  teams=o.teams;used=new Set(o.used);won=new Map(o.won);dead=new Set(o.dead);hist=o.hist;played=o.played;active=o.active;
  restrictPts=o.restrictPts;bombTeam=o.bombTeam;perkThisTurn=o.perkThisTurn;perkCount=o.perkCount;bombSet=new Set(o.bombSet);bombLevel=o.bombLevel;chRestrict=o.chRestrict||null;mqUsed=new Set(o.mqUsed||[]);dropVirt();if(o.vcol)board.push(o.vcol);
  const rd=document.getElementById("resDlg");if(rd&&rd.open)rd.close();
  current=o.current;
  if(current){
    const cl=clueOf();
    document.getElementById("meta").textContent=board[current.ci].cat+" "+T("for")+" $"+cl.pts;
    document.getElementById("clue").textContent=cl.q;
    document.getElementById("answer").textContent=answerText(cl);setClueImg();renderMC();
    ["act-end","group","perkActs"].forEach(id=>document.getElementById(id).hidden=true);
    if(!dlg.open)dlg.showModal();
    if(current.group){document.getElementById("act-reveal").hidden=true;document.getElementById("act-score").hidden=true;beginGroup()}
    else{document.getElementById("act-reveal").hidden=false;document.getElementById("act-score").hidden=false;beginTurn("")}
  }else if(dlg.open)dlg.close();
  renderBoard();renderTeams();renderUndo();
}
document.getElementById("undoBtn").onclick=doUndo;
document.getElementById("redoBtn").onclick=doRedo;

document.addEventListener("keydown",e=>{if(e.ctrlKey||e.metaKey){const k=e.key.toLowerCase(),z=k==="z"&&!e.shiftKey,y=k==="y"||(k==="z"&&e.shiftKey);if(!z&&!y)return;const t=e.target;if(t&&/^(INPUT|TEXTAREA)$/.test(t.tagName))return;e.preventDefault();z?doUndo():doRedo()}});
function startQuestion(){
  const cl=clueOf();setClueImg();
  logAct("picked",0,current.picker);
  document.getElementById("meta").textContent=board[current.ci].cat+" "+T("for")+" $"+cl.pts;
  document.getElementById("clue").textContent=cl.q;
  document.getElementById("perkActs").hidden=true;
  if(isGroup(cl)){
    current.group=cl.type;current.guesses=teams.map(()=>null);
    if(current.mc){current.gmc=current.mc;current.mc=null}
    renderMC();beginGroup();
  }else{
    document.getElementById("act-reveal").hidden=false;
    document.getElementById("act-score").hidden=false;
    beginTurn(current.delegateActive?T("delegateNote").split("{x}").join(nm(current.picker)):"");
  }
}
function bonusExtra(kind){
  return(kind==="delegate"&&current.bonusTeam!==null&&current.bonusTeam!==undefined)?" "+T(bonusBoth?"bonusBothTxt":"bonusOnlyFirst").split("{x}").join(nm(current.bonusTeam)).split("{m}").join(bonusMult):"";
}
function showPerk(kind){
  current.perk=kind;
  document.getElementById("timer").hidden=true;
  document.getElementById("answer").hidden=true;
  if(kind==="bomb"&&bombPeek){
    const cl=clueOf();
    document.getElementById("meta").textContent=board[current.ci].cat+" "+T("for")+" $"+cl.pts;
    document.getElementById("turn").textContent=T("perkBombTxt").split("{x}").join(nm(current.picker));
    document.getElementById("clue").textContent=cl.q;
    document.getElementById("answer").hidden=false;
  }else if(kind==="delegate"&&delegatePeek){
    const cl=clueOf();
    document.getElementById("meta").textContent=board[current.ci].cat+" "+T("for")+" $"+cl.pts;
    document.getElementById("turn").textContent=T("perkDelShort").split("{x}").join(nm(current.picker))+bonusExtra("delegate");
    document.getElementById("clue").textContent=cl.q;
  }else{
    document.getElementById("meta").textContent=T("perkTitle");
    document.getElementById("turn").textContent="";
    document.getElementById("clue").textContent=T(kind==="bomb"?"perkBombTxt":"perkDelTxt").split("{x}").join(nm(current.picker))+bonusExtra(kind);
  }
  const box=document.getElementById("perkActs");box.textContent="";box.hidden=false;
  const btn=(label,fn,color)=>{const b=document.createElement("button");b.type="button";b.textContent=label;if(color)b.style.boxShadow="inset 8px 0 0 "+color;b.onclick=fn;box.appendChild(b)};
  if(kind==="bomb")btn(T("cont"),perkBomb);
  else{
    teams.forEach((t,i)=>{if(i!==current.picker)btn(nm(i),()=>perkDelegate(i),teamColor(i))});
    btn(T("perkSelf"),()=>startQuestion());
  }
}
function perkBomb(){
  pushUndo();
  const pk=current.picker,pts=clueOf().pts;
  stopTimer();current=null;dlg.close();
  active=pk;
  restrictPts=bombRetry?pts:null;bombTeam=bombRetry?pk:null;
  useBomb();
  if(bombSkip){played++;perkThisTurn=false;if(auto)active=(pk+1)%teams.length}
  if(bombFixed()){bombLevel=Math.max(0,bombLevel-1);placeBombs(bombLevel)}
  renderBoard();renderTeams();
}
function perkDelegate(i){
  logPerk(current.picker,"delegate",nm(i));
  current.delegate=i;current.turn=i;current.delegateActive=true;
  startQuestion();
}
function beginGroup(){
  document.getElementById("turn").textContent=T("allPlay").split("{x}").join(nm(current.picker));
  document.getElementById("answer").hidden=true;
  document.getElementById("group").hidden=false;
  document.getElementById("groupReveal").hidden=false;
  current.revealedA=false;
  document.getElementById("groupReveal").textContent=(current.group==="img"&&!current.gmc)?rqText("Show answer","Mostrar respuesta"):T("groupReveal");
  renderGroup();
  startTimer();
}
function renderGroup(){
  const box=document.getElementById("groupRows");box.textContent="";
  const t=current.group;
  teams.forEach((tm,i)=>{
    const row=document.createElement("div");row.className="grow";row.style.borderLeftColor=teamColor(i);
    const name=document.createElement("span");name.className="nm";name.textContent=nm(i);name.style.color=teamColor(i);name.style.fontWeight="800";
    const opts=document.createElement("div");opts.className="opts";
    if(t==="img"){
      if(current.gmc){
        current.gmc.forEach((o,k)=>{const b=document.createElement("button");b.type="button";b.className="opt"+(current.guesses[i]===k?" on":"");b.textContent="ABCDEF"[k];b.onclick=()=>{current.guesses[i]=current.guesses[i]===k?null:k;renderGroup()};opts.appendChild(b)});
      }else if(current.revealedA){
        [[true,rqText("✓ Correct","✓ Correcto")],[false,rqText("✗ Wrong","✗ Incorrecto")]].forEach(v=>{const b=document.createElement("button");b.type="button";b.className="opt"+(current.guesses[i]===v[0]?" on":"");b.textContent=v[1];b.onclick=()=>{current.guesses[i]=current.guesses[i]===v[0]?null:v[0];renderGroup()};opts.appendChild(b)});
      }else{const h=document.createElement("small");h.textContent=rqText("Writing their answer…","Escribiendo su respuesta…");h.style.color="var(--muted)";opts.appendChild(h)}
    }else if(t==="closest"){
      const inp=document.createElement("input");inp.type="number";inp.step="any";inp.placeholder=T("yourNumber");
      inp.value=current.guesses[i]===null?"":current.guesses[i];
      inp.setAttribute("aria-label",nm(i));
      inp.oninput=()=>{const v=inp.value===""?null:+inp.value;current.guesses[i]=(v!==null&&Number.isFinite(v))?v:null};
      opts.appendChild(inp);
    }else{
      const vals=t==="tf"?[[true,"true"],[false,"false"]]:[["higher","higher"],["lower","lower"]];
      vals.forEach(v=>{
        const b=document.createElement("button");b.type="button";b.className="opt"+(current.guesses[i]===v[0]?" on":"");b.textContent=T(v[1]);
        b.onclick=()=>{current.guesses[i]=current.guesses[i]===v[0]?null:v[0];renderGroup()};
        opts.appendChild(b);
      });
    }
    row.append(name,opts);box.appendChild(row);
  });
}
function resolveGroup(){
  if(!current||!current.group||current.done)return;
  pushUndo();
  stopTimer();
  const cl=clueOf(),mult=DIFF[dOf(current.ci)].mult,t=current.group,res=[],winners=[];
  const guessText=g=>g===null?"":t==="img"?(current.gmc?"ABCDEF"[g]:(g?rqText("✓ Correct","✓ Correcto"):rqText("✗ Wrong","✗ Incorrecto"))):t==="tf"?T(g?"true":"false"):t==="hl"?T(g):String(g);
  let best=Infinity,second=Infinity;
  if(t==="closest")current.guesses.forEach(g=>{if(g!==null)best=Math.min(best,Math.abs(g-cl.target))});
  if(t==="closest")current.guesses.forEach(g=>{if(g!==null){const dd=Math.abs(g-cl.target);if(dd>best&&dd<second)second=dd}});
  const distTxt=g=>{const dd=Math.round(Math.abs(g-cl.target)*10000)/10000;return dd===0?T("exactTxt"):T("offBy").split("{d}").join(dd)};
  const ordn=n=>lang==="es"?n+".º":(n%100>=11&&n%100<=13?n+"th":n+({1:"st",2:"nd",3:"rd"}[n%10]||"th"));
  const dists=t==="closest"?current.guesses.map(g=>g===null?null:Math.abs(g-cl.target)):[];
  const rankOf=i=>dists[i]===null||dists[i]===undefined?0:1+dists.filter(x=>x!==null&&x<dists[i]).length;
  const tieN=i=>dists.filter(x=>x!==null&&x===dists[i]).length;
  const truth=t==="img"?(current.gmc?current.gmc.findIndex(o=>o.c):true):t==="tf"?cl.truth!==false:(cl.target>cl.ref?"higher":"lower");
  current.done=true;
  teams.forEach((tm,i)=>{
    const g=current.guesses[i];let out,d=0;
    if(g===null)out="noanswer";
    else if(t==="closest"){
      const dd=Math.abs(g-cl.target);
      if(dd===best){out="correct";d=Math.round(cl.pts*(i===current.bonusTeam?bonusMult:1));winners.push(i)}
      else if(secondOn&&secondPct>0&&dd===second){out="second";d=Math.round(cl.pts*(secondPct/100)*(i===current.bonusTeam?bonusMult:1))}
      else out="missed";
    }
    else if(g===truth){out="correct";d=Math.round(cl.pts*(i===current.bonusTeam?bonusMult:1));winners.push(i)}
    else{out="wrong";d=-cl.pts*mult}
    tm.score+=d;
    const gt=guessText(g)+((t==="closest"&&g!==null)?" · "+distTxt(g):"");
    logAct(out,d,i,gt+((out==="correct"&&i===current.bonusTeam&&bonusMult!==1)?" · ×"+bonusMult+" "+T("bonusWord"):""));
    res.push({i,out,d,g:gt,rk:t==="closest"?rankOf(i):0,tie:t==="closest"&&tieN(i)>1});
  });
  if(winners.length>0)won.set(current.ci+"-"+current.r,winners.slice());
  if(winners.length===0)current.dead=true;
  const box=document.getElementById("groupRows");box.textContent="";
  res.forEach(x=>{
    const row=document.createElement("div");row.className="grow";row.style.borderLeftColor=teamColor(x.i);
    const name=document.createElement("span");name.className="nm";name.style.color=teamColor(x.i);name.style.fontWeight="800";name.textContent=nm(x.i)+(x.g?" · "+x.g:"")+(x.rk?" · "+(x.tie?T("tiedFor"):T("placeN")).split("{r}").join(ordn(x.rk)):"");
    const r=document.createElement("span");r.className=(x.out==="correct"||x.out==="second")?"ok":x.out==="wrong"?"bad":"";
    r.textContent=T("h_"+x.out)+(x.d?" ("+(x.d>0?"+":"−")+"$"+Math.abs(x.d)+")":"");
    row.append(name,r);box.appendChild(row);
  });
  document.getElementById("answer").hidden=false;
  document.getElementById("groupReveal").hidden=true;
  document.getElementById("act-end").hidden=false;
  {let msg=T("results");const seen=new Set();
    res.forEach(x=>{if(x.rk&&x.tie&&!seen.has(x.rk)){seen.add(x.rk);msg+=" · "+T("tieSum").split("{r}").join(ordn(x.rk)).split("{x}").join(res.filter(y=>y.rk===x.rk).map(y=>nm(y.i)).join(", "))}});
    document.getElementById("turn").textContent=msg}
  renderTeams();
}
function beginTurn(note){beginTurn0(note);mcUI()}
function mcUI(){updateRR();const m=!!(current&&current.mc&&!current.done);if(m)document.getElementById("act-score").hidden=true;document.getElementById("reveal").hidden=m;renderMC()}
function beginTurn0(note){
  document.getElementById("skip").hidden=!skipOn;
  {const es=lang==="es",cl0=clueOf(),pn0=cl0.pts*DIFF[dOf(current.ci)].mult,first=current.asked===0&&current.turn===current.picker,sb=document.getElementById("skip"),sn=document.getElementById("skipNote");
   if(sb&&sn&&pn0>0){
     const pen=first?skipFirstPen:skipOthersPen;
     sb.textContent=es?(pen?"Pasar (−"+pn0+")":"Pasar (sin penalidad)"):(pen?"Skip (−"+pn0+")":"Skip (no penalty)");
     sn.textContent=es?(first?(pen?"El primer equipo debe responder: si pasa, pierde "+pn0+" puntos, igual que si responde mal.":"Si pasás no perdés puntos. Si respondés mal, perdés "+pn0+" puntos."):(pen?"Si pasás perdés "+pn0+" puntos, igual que si respondés mal.":"Si pasás no perdés puntos. Si respondés mal, perdés "+pn0+" puntos.")):(first?(pen?"The first team must answer: skipping costs "+pn0+" points, same as a wrong answer.":"Skipping costs nothing. A wrong answer costs "+pn0+" points."):(pen?"Skipping costs "+pn0+" points, same as a wrong answer.":"Skipping costs nothing. A wrong answer costs "+pn0+" points."));
   }}
  active=current.turn;renderTeams();
  document.getElementById("dlg").style.setProperty("--team",teamColor(current.turn));
  const tn=document.getElementById("turn");tn.textContent="";
  if(photosOn&&teams[current.turn].photo){const im=document.createElement("img");im.src=teams[current.turn].photo;im.alt="";im.className="tavatar";tn.appendChild(im)}
  {const ns=document.createElement("b");ns.textContent=nm(current.turn);ns.style.color=teamColor(current.turn);const tp=T("turnOf").split("{x}");if(note)tn.append(note,document.createElement("br"));tn.append(tp[0],ns,tp[1]||"")}
  document.getElementById("answer").hidden=true;
  document.getElementById("reveal").textContent=T("reveal");
  startTimer();
}
function nextTurn(note){
  current.delegateActive=false;
  current.asked++;
  if(current.asked>=teams.length){allDone();return}
  current.turn=(current.turn+1)%teams.length;
  if(current.delegate!==undefined&&current.turn===current.picker){
    current.asked++;
    if(current.asked>=teams.length){allDone();return}
    current.turn=(current.turn+1)%teams.length;
  }
  beginTurn(note);
}
function judge(kind){
  if(!current)return;
  pushUndo();
  stopTimer();
  if(current.dd){judgeDD(kind);return}
  const cl=clueOf(),sh=current.delegateActive===true,pk=current.picker,tn=current.turn;
  const via=sh?T("delegateNote").split("{x}").join(nm(pk)):"",viaP=sh?T("viaNote").split("{x}").join(nm(tn)):"";
  if(kind==="right"){
    const hasB=current.bonusTeam!==null&&current.bonusTeam!==undefined;
    const bonusFor=i=>hasB&&(i===current.bonusTeam||(bonusBoth&&sh&&(i===tn||i===pk)));
    const gain=i=>{const m=bonusFor(i)?bonusMult:1;if(current.rq&&i===pk)return rqMode==="flat"?Math.round(cl.pts*m+rqFlat):Math.round(cl.pts*rqMult*m);return Math.round(cl.pts*m)};
    const bn=i=>bonusFor(i)?"×"+bonusMult+" "+T("bonusWord"):"";
    const note=(a,b)=>[a,b].filter(Boolean).join(" · ");
    logAct("correct",gain(tn),tn,note(via,bn(tn)));teams[tn].score+=gain(tn);
    if(sh){logAct("correct",gain(pk),pk,note(viaP,bn(pk)));teams[pk].score+=gain(pk)}
    won.set(current.ci+"-"+current.r,sh?[tn,pk]:[tn]);showEnd(T("rightEnd").split("{x}").join(nm(tn))+((current.rq&&tn===pk)?"\n"+rqText("🎲 Random question bonus: +$","🎲 Bonus de pregunta al azar: +$")+(gain(tn)-cl.pts):""));return;
  }
  if(kind==="wrong"){
    const pn=cl.pts*DIFF[dOf(current.ci)].mult;
    teams[tn].score-=pn;current.answered++;logAct("wrong",-pn,tn,via);
    if(sh){teams[pk].score-=pn;logAct("wrong",-pn,pk,viaP)}
  }else{const fp=current.asked===0&&tn===pk,sp=(fp?skipFirstPen:skipOthersPen)?cl.pts*DIFF[dOf(current.ci)].mult:0;if(sp>0)teams[tn].score-=sp;logAct("skip",-sp,tn,via)}
  if(kind==="wrong"&&((tfNoPass&&slotType(cl)==="tf")||(current.mc&&!mcPass)||cl.type==="img1")){endAfterWrong();return}
  if(kind==="skip"&&((current.mc&&!mcPass)||cl.type==="img1")){current.dead=true;showEnd(rqText("Skipped. The question ends here.","Pasó. La pregunta termina acá."));return}
  nextTurn("");
}
function showEnd(msg){
  stopTimer();
  current.done=true;
  document.getElementById("turn").textContent=msg;
  document.getElementById("answer").hidden=false;
  document.getElementById("act-reveal").hidden=true;
  document.getElementById("act-score").hidden=true;
  document.getElementById("act-end").hidden=false;
  document.getElementById("timer").hidden=true;
  active=current.picker;renderTeams();
}
function endAfterWrong(){current.dead=true;showEnd(clueOf().type==="img1"?rqText("Wrong answer. Only this team could answer, so the question ends here.","Respuesta incorrecta. Solo este equipo podía responder, así que la pregunta termina aquí."):T("tfWrongEnd"))}
function allDone(){
  current.done=true;current.dead=true;
  const cl=clueOf(),pen=cl.pts*DIFF[dOf(current.ci)].mult;
  let msg;
  if(current.answered===0){
    msg=T("nobody");logAct("nobody",-pen,current.picker);
    if(pen>0){teams[current.picker].score-=pen;msg+="\n"+nm(current.picker)+" "+T("loses")+" $"+pen+"."}
  }else msg=T("nobodyGot");
  active=current.picker;renderTeams();
  document.getElementById("turn").textContent=msg;
  document.getElementById("answer").hidden=false;
  document.getElementById("act-reveal").hidden=true;
  document.getElementById("act-score").hidden=true;
  document.getElementById("act-end").hidden=false;
  document.getElementById("timer").hidden=true;
}
function endClue(){
  stopTimer();
  if(current.virt){const pk0=current.picker;current=null;dlg.close();dropVirt();active=auto?(pk0+1)%teams.length:pk0;restrictPts=null;bombTeam=null;perkThisTurn=false;renderBoard();renderTeams();return}
  played++;restrictPts=null;bombTeam=null;perkThisTurn=false;
  used.add(current.ci+"-"+current.r);
  if(current.dead)dead.add(current.ci+"-"+current.r);
  const pk=current.picker,base=(current.chR&&current.chR.by!=null)?current.chR.by:pk;current=null;dlg.close();
  active=auto?(base+1)%teams.length:pk;
  renderBoard();renderTeams();
  checkEnd();
}
function showAnswer(){const a=document.getElementById("answer");a.hidden=!a.hidden;document.getElementById("reveal").textContent=T(a.hidden?"reveal":"hide")}
function stopTimer(){clearInterval(tmr);paused=false;document.getElementById("timer").hidden=true;document.getElementById("tbox").hidden=true;document.getElementById("pauseBtn").hidden=true;document.getElementById("pauseBtn2").hidden=true}
function startTimer(){
  stopTimer();
  const el=document.getElementById("timer"),cl=board[current.ci].clues[current.r],s=(cl.time==null)?DIFF[dOf(current.ci)].time:cl.time;
  document.getElementById("right").hidden=false;
  if(!s)return;
  left=s;total=s;paused=false;el.hidden=false;document.getElementById("tbox").hidden=false;document.getElementById("pauseBtn").hidden=false;document.getElementById("pauseBtn2").hidden=false;
  const tb=document.getElementById("tbar"),pbs=[document.getElementById("pauseBtn"),document.getElementById("pauseBtn2")];pbs.forEach(x=>x.textContent=T("pause"));
  const paint=()=>{el.textContent=left+T("secs");const late=left<=Math.max(3,Math.ceil(total*.25));el.classList.toggle("late",late);tb.classList.toggle("late",late);tb.firstChild.style.width=Math.max(0,(left-1)/total*100)+"%"};
  tb.firstChild.style.transition="none";tb.firstChild.style.width="100%";void tb.offsetWidth;tb.firstChild.style.transition="";
  el.classList.remove("late");tb.classList.remove("late");el.textContent=left+T("secs");
  const run=()=>{tmr=setInterval(()=>{
    if(!current){stopTimer();return}
    left--;paint();
    if(left<=0){stopTimer();if(current&&current.group){resolveGroup()}else{pushUndo();logAct("timeout",0);nextTurn(T("timeup"))}}
  },1000);setTimeout(()=>{if(!paused&&current)tb.firstChild.style.width=Math.max(0,(left-1)/total*100)+"%"},30)};
  const tog=()=>{if(paused){paused=false;pbs.forEach(x=>x.textContent=T("pause"));run()}else{paused=true;clearInterval(tmr);pbs.forEach(x=>x.textContent=T("resume"))}};pbs.forEach(x=>x.onclick=tog);
  run();
}
document.getElementById("reveal").onclick=showAnswer;
document.getElementById("right").onclick=()=>judge("right");
document.getElementById("wrong").onclick=()=>judge("wrong");
document.getElementById("skip").onclick=()=>judge("skip");
{const sx=document.getElementById("stMultNum");
 const ssk=document.getElementById("stSkipChk");ssk.checked=st1Skip;ssk.onchange=()=>{st1Skip=ssk.checked;try{localStorage.setItem("jp-stskip",st1Skip?"1":"0")}catch(x){}renderPick()};
 const smc=document.getElementById("stMultChk");smc.checked=stMultOn;smc.onchange=()=>{stMultOn=smc.checked;sx.disabled=!stMultOn;try{localStorage.setItem("jp-stmulton",stMultOn?"1":"0")}catch(x){}updateStageTag()};sx.disabled=!stMultOn;
 ["row","col","board"].forEach(k=>{const c=document.getElementById("stK-"+k);c.checked=stK[k];c.onchange=()=>{stK[k]=c.checked;syncSt();sv5("jp-st-"+k,stK[k]?"1":"0");renderPick()}});sx.value=stMult;
 const sv5=(k,v)=>{try{localStorage.setItem(k,v)}catch(x){}};
 sx.onchange=()=>{const v=parseFloat(sx.value);if(v>0&&v<=10){stMult=v;sv5("jp-stmult",v)}else sx.value=stMult;updateStageTag()};
 ["stRow","stCol","stSkip"].forEach((id,k)=>document.getElementById(id).onclick=()=>{if(stOn&&stage===1&&!current)showStageDlg(["row","col","board"][k])})}
{const r0=document.getElementById("rrChk"),rm=document.getElementById("rrModeSel"),ru=document.getElementById("rrUsesNum");
 r0.checked=rrOn;rm.value=rrMode;ru.value=rrUses;
 const sv4=(k,v)=>{try{localStorage.setItem(k,v)}catch(x){}};
 r0.onchange=()=>{rrOn=r0.checked;sv4("jp-rr",rrOn?"1":"0");updateRR()};
 rm.onchange=()=>{rrMode=rm.value;sv4("jp-rrmode",rrMode);updateRR()};
 ru.onchange=()=>{const v=parseInt(ru.value);rrUses=(v>=0&&v<=99)?v:1;ru.value=rrUses;sv4("jp-rruses",rrUses);updateRR()};
 document.getElementById("rrBtn").onclick=useReroll}
{const mc0=document.getElementById("mqChk"),mm=document.getElementById("mqModeSel"),mu=document.getElementById("mqUsesNum");
 mc0.checked=mqOn;mm.value=mqMode;mu.value=mqUses;
 const sv3=(k,v)=>{try{localStorage.setItem(k,v)}catch(x){}};
 mc0.onchange=()=>{mqOn=mc0.checked;sv3("jp-mq",mqOn?"1":"0");updateMQ()};
 mm.onchange=()=>{mqMode=mm.value;sv3("jp-mqmode",mqMode)};
 mu.onchange=()=>{const v=parseInt(mu.value);mqUses=(v>=0&&v<=99)?v:1;mu.value=mqUses;sv3("jp-mquses",mqUses);updateMQ()};
 document.getElementById("mqBtn").onclick=useMystery}
{const cc=document.getElementById("chChk"),cm=document.getElementById("chModeSel"),cu=document.getElementById("chUsesNum");
 cc.checked=chOn;cm.value=chMode;cu.value=chUses;
 const sv2=(k,v)=>{try{localStorage.setItem(k,v)}catch(x){}};
 cc.onchange=()=>{chOn=cc.checked;sv2("jp-ch",chOn?"1":"0");updateCH()};
 cm.onchange=()=>{chMode=cm.value;sv2("jp-chmode",chMode)};
 cu.onchange=()=>{const v=parseInt(cu.value);chUses=(v>=0&&v<=99)?v:1;cu.value=chUses;sv2("jp-chuses",chUses);updateCH()};
 document.getElementById("chBtn").onclick=openChallenge}
{const c0=document.getElementById("rqChk"),ms=document.getElementById("rqModeSel"),mn=document.getElementById("rqMultNum"),fn=document.getElementById("rqFlatNum"),un=document.getElementById("rqUsesNum");
 c0.checked=rqOn;ms.value=rqMode;mn.value=rqMult;fn.value=rqFlat;un.value=rqUses;
 const sv=(k,v)=>{try{localStorage.setItem(k,v)}catch(x){}};
 c0.onchange=()=>{rqOn=c0.checked;sv("jp-rq",rqOn?"1":"0");updateRQ()};
 ms.onchange=()=>{rqMode=ms.value;sv("jp-rqmode",rqMode);updateRQ()};
 mn.onchange=()=>{const v=parseFloat(mn.value);rqMult=(v>=1&&v<=10)?v:2;mn.value=rqMult;sv("jp-rqmult",rqMult);updateRQ()};
 fn.onchange=()=>{const v=parseFloat(fn.value);rqFlat=(v>=0&&v<=10000)?v:200;fn.value=rqFlat;sv("jp-rqflat",rqFlat);updateRQ()};
 un.onchange=()=>{const v=parseInt(un.value);rqUses=(v>=0&&v<=99)?v:1;un.value=rqUses;sv("jp-rquses",rqUses);updateRQ()};
 document.getElementById("rqBtn").onclick=randomQuestion}
{const c=document.getElementById("mcChk"),n1=document.getElementById("mcMinNum"),n2=document.getElementById("mcMaxNum");
 c.checked=mcOn;n1.value=mcMin;n2.value=mcMax;
 c.onchange=()=>{mcOn=c.checked;try{localStorage.setItem("jp-mc2",mcOn?"1":"0")}catch(x){}};
 const cl=v=>Math.max(2,Math.min(6,Math.round(+v)||2));
 n1.onchange=()=>{mcMin=cl(n1.value);n1.value=mcMin;try{localStorage.setItem("jp-mcmin",mcMin)}catch(x){}};
 n2.onchange=()=>{mcMax=cl(n2.value);n2.value=mcMax;try{localStorage.setItem("jp-mcmax",mcMax)}catch(x){}}}
{const a=document.getElementById("skipFirstChk"),b=document.getElementById("skipOthersChk");
 a.checked=skipFirstPen;b.checked=skipOthersPen;
 a.onchange=()=>{skipFirstPen=a.checked;try{localStorage.setItem("jp-skipfirst",a.checked?"1":"0")}catch(x){}};
 b.onchange=()=>{skipOthersPen=b.checked;try{localStorage.setItem("jp-skipothers",b.checked?"1":"0")}catch(x){}}}
document.getElementById("cont").onclick=()=>endClue();
document.getElementById("groupReveal").onclick=()=>{
  if(current&&current.group==="img"&&!current.gmc&&!current.revealedA){current.revealedA=true;document.getElementById("answer").hidden=false;document.getElementById("groupReveal").textContent=rqText("Score teams","Puntuar equipos");renderGroup();return}
  resolveGroup();
};
document.getElementById("closeClue").onclick=()=>{
  if(!current)return;
  if(current.done){endClue();return}
  stopTimer();
  if(current.perk==="bomb"&&bombFixed()){bombSet.add(current.ci+"-"+current.r);perkCount.bomb=Math.max(0,perkCount.bomb-1)}
  if(current.chR&&current.answered===0)chRestrict=current.chR;
  if(current.rq&&current.answered===0&&teams[current.picker]&&teams[current.picker].rq>0)teams[current.picker].rq--;
  logAct("closed",0,current.picker);
  if(current.virt){const pk1=current.picker,pen1=current.answered===0?clueOf().pts*DIFF[dOf(current.ci)].mult:0;
    if(pen1>0&&teams[pk1]){teams[pk1].score-=pen1;logAct("nobody",-pen1,pk1)}
    current=null;dlg.close();dropVirt();active=auto?(pk1+1)%teams.length:pk1;renderBoard();renderTeams();return}
  if(current.answered>0)used.add(current.ci+"-"+current.r);
  const pk=current.picker;current=null;dlg.close();
  active=pk;renderBoard();renderTeams();
};
dlg.addEventListener("cancel",e=>{e.preventDefault();document.getElementById("closeClue").click()});

