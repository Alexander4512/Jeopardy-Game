// Challenge perk
let chOn=false,chMode="choose",chUses=1,chRestrict=null;
try{chOn=localStorage.getItem("jp-ch")==="1";const m=localStorage.getItem("jp-chmode");if(["choose","both","cat","row"].indexOf(m)>=0)chMode=m;const u=parseInt(localStorage.getItem("jp-chuses"));if(u>=0&&u<=99)chUses=u}catch(e){}
const chOk=(ci,r)=>!chRestrict||((chRestrict.cat==null||chRestrict.cat===ci)&&(chRestrict.row==null||chRestrict.row===r));
function chLeft(i){return chUses===0?Infinity:Math.max(0,chUses-((teams[i]&&teams[i].ch)||0))}
const unplayed=(ci,r)=>{const c=board[ci]&&board[ci].clues[r];return !!c&&!c.empty&&!!c.q&&!used.has(ci+"-"+r)};
function updateCH(){
  const bar=document.getElementById("chBar");if(!bar)return;
  const show=chOn&&!!teams&&!!board&&teams.length>=2;bar.hidden=!show;if(!show)return;
  const b=document.getElementById("chBtn"),left=chLeft(active);
  b.textContent=rqText("🎯 Challenge another team","🎯 Desafiar a otro equipo")+(left===Infinity?"":" · "+left);
  b.disabled=left===0||!!current||!!chRestrict;
  document.getElementById("chMsg").textContent=left===0?rqText("No uses left for "+nm(active)+".","A "+nm(active)+" no le quedan usos."):"";
}
function openChallenge(){
  if(current||chRestrict||!chOn||chLeft(active)===0)return;
  const d=document.getElementById("chDlg"),body=document.getElementById("chBody"),err=document.getElementById("chErr");
  const me=active;err.textContent="";
  document.getElementById("chH").textContent=rqText("🎯 Challenge another team","🎯 Desafiar a otro equipo");
  document.getElementById("chOk").textContent=rqText("Challenge!","¡Desafiar!");
  document.getElementById("chCancel").textContent=rqText("Cancel","Cancelar");
  body.textContent="";
  const mk=(label,sel)=>{const l=document.createElement("label");l.style.cssText="display:grid;gap:4px;font-weight:700";const sp=document.createElement("span");sp.textContent=label;sel.style.cssText="font:inherit;padding:8px 10px;border-radius:8px;background:var(--bg);color:var(--ink);border:1px solid var(--muted)";l.append(sp,sel);body.appendChild(l);return l};
  const opt=(sel,v,t)=>{const o=document.createElement("option");o.value=v;o.textContent=t;sel.appendChild(o)};
  const tSel=document.createElement("select");teams.forEach((t,i)=>{if(i!==me)opt(tSel,i,nm(i))});
  mk(rqText("Team that must answer","Equipo que debe responder"),tSel);
  const tySel=document.createElement("select");
  opt(tySel,"both",rqText("Category and value (exact question)","Categoría y valor (pregunta exacta)"));
  opt(tySel,"cat",rqText("Only the category","Solo la categoría"));
  opt(tySel,"row",rqText("Only the value (row)","Solo el valor (fila)"));
  const tyL=mk(rqText("What you choose","Qué elegís"),tySel);
  if(chMode!=="choose"){tySel.value=chMode;tyL.hidden=true}
  const cSel=document.createElement("select"),rSel=document.createElement("select");
  const cL=mk(rqText("Category","Categoría"),cSel),rL=mk(rqText("Value","Valor"),rSel);
  const nr=Math.max.apply(null,board.map(c=>c.clues.length));
  const fillCats=()=>{const keep=cSel.value;cSel.textContent="";board.forEach((c,ci)=>{if(c.clues.some((x,r)=>unplayed(ci,r)))opt(cSel,ci,c.cat)});if(keep&&cSel.querySelector('option[value="'+keep+'"]'))cSel.value=keep};
  const fillRows=()=>{const keep=rSel.value,ty=tySel.value;rSel.textContent="";
    for(let r=0;r<nr;r++){
      const ok=ty==="both"?unplayed(+cSel.value,r):board.some((c,ci)=>unplayed(ci,r));
      if(ok){const any=board.find(c=>c.clues[r]&&!c.clues[r].empty);opt(rSel,r,"$"+(any?any.clues[r].pts:(r+1)*100))}
    }
    if(keep&&rSel.querySelector('option[value="'+keep+'"]'))rSel.value=keep};
  const sync=()=>{const ty=tySel.value;cL.hidden=ty==="row";rL.hidden=ty==="cat";fillCats();fillRows()};
  tySel.onchange=sync;cSel.onchange=fillRows;sync();
  document.getElementById("chCancel").onclick=()=>d.close();
  document.getElementById("chOk").onclick=()=>{
    const ty=tySel.value,target=parseInt(tSel.value);
    const cat=ty!=="row"?parseInt(cSel.value):null,row=ty!=="cat"?parseInt(rSel.value):null;
    if((ty!=="row"&&isNaN(cat))||(ty!=="cat"&&isNaN(row))||isNaN(target)){err.textContent=rqText("No questions available for that choice.","No hay preguntas disponibles para esa elección.");return}
    pushUndo();
    teams[me].ch=(teams[me].ch||0)+1;
    chRestrict={cat:cat,row:row,by:me};
    active=target;d.close();
    if(cat!==null&&row!==null){renderBoard();renderTeams();openClue(cat,row);return}
    renderBoard();renderTeams();
  };
  d.showModal();
}
