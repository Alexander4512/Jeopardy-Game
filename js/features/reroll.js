// Reroll perk
let rrOn=false,rrMode="same",rrUses=1;
try{rrOn=localStorage.getItem("jp-rr")==="1";const m=localStorage.getItem("jp-rrmode");if(m==="random"||m==="choose")rrMode=m;const u=parseInt(localStorage.getItem("jp-rruses"));if(u>=0&&u<=99)rrUses=u}catch(e){}
function rrLeft(i){return rrUses===0?Infinity:Math.max(0,rrUses-((teams[i]&&teams[i].rr)||0))}
function rrAlt(){const cl=clueOf(),col=board[current.ci];if(!col||col.lib==null||(cl.type&&cl.type!=="normal"&&cl.type!=="mc")||cl.rolled)return null;const a=ALTS[lang]&&ALTS[lang][col.lib];const al=a&&a[current.r];return(al&&!col.clues.some(x=>x.q===al[0]))?al:null}
function rrRows(){const col=board[current.ci];if(!col||col.virt||(current.chR&&current.chR.row!=null))return[];const out=[];col.clues.forEach((x,r)=>{if(r!==current.r&&x&&!x.empty&&x.q&&!used.has(current.ci+"-"+r))out.push(r)});return out}
function rrCan(){
  if(!rrOn||!current||current.done||current.group||current.dd||current.asked!==0||current.turn!==current.picker||rrLeft(current.picker)===0)return false;
  return rrMode==="same"?!!rrAlt():rrRows().length>0;
}
function rrApply(newR){
  const pk=current.picker;pushUndo();
  teams[pk].rr=(teams[pk].rr||0)+1;
  if(rrMode==="same"){
    const cl=clueOf(),a=rrAlt();if(!a)return;
    cl.q=a[0];cl.a=a[1];cl.ch=a[2];cl.ca=a[3];cl.rolled=true;
    current.tried=[];current.mc=makeMC(cl,current.r,board[current.ci].clues.length);
    document.getElementById("clue").textContent=cl.q;
    document.getElementById("answer").textContent=answerText(cl);
    setClueImg();beginTurn("");
  }else{
    const ci=current.ci,rq=current.rq,chR=current.chR;
    stopTimer();current=null;
    undoHold=true;try{openClue(ci,newR,rq)}finally{undoHold=false}
    if(current)current.chR=chR;
  }
  renderTeams();
}
function useReroll(){
  if(!rrCan())return;
  if(rrMode==="choose"){
    const d=document.getElementById("chDlg"),body=document.getElementById("chBody"),err=document.getElementById("chErr");
    err.textContent="";body.textContent="";
    document.getElementById("chH").textContent=rqText("🔁 Reroll the question","🔁 Cambiar la pregunta");
    document.getElementById("chOk").textContent=rqText("Reroll","Cambiar");
    document.getElementById("chCancel").textContent=rqText("Cancel","Cancelar");
    const l=document.createElement("label");l.style.cssText="display:grid;gap:4px;font-weight:700";const sp=document.createElement("span");sp.textContent=rqText("Choose the new value","Elegí el nuevo valor");
    const sel=document.createElement("select");sel.style.cssText="font:inherit;padding:8px 10px;border-radius:8px;background:var(--bg);color:var(--ink);border:1px solid var(--muted)";
    rrRows().forEach(r=>{const o=document.createElement("option");o.value=r;o.textContent="$"+board[current.ci].clues[r].pts;sel.appendChild(o)});
    l.append(sp,sel);body.appendChild(l);
    document.getElementById("chCancel").onclick=()=>d.close();
    document.getElementById("chOk").onclick=()=>{d.close();if(rrCan())rrApply(parseInt(sel.value))};
    d.showModal();return;
  }
  if(rrMode==="random"){const rs=rrRows();rrApply(rs[Math.floor(Math.random()*rs.length)]);return}
  rrApply(null);
}
function updateRR(){
  const b=document.getElementById("rrBtn");if(!b)return;
  const ok=rrCan();b.hidden=!ok;
  if(ok){const left=rrLeft(current.picker);b.textContent=rqText("🔁 Reroll","🔁 Cambiar pregunta")+(left===Infinity?"":" · "+left)}
}
