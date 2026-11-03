// Mystery question perk
let mqOn=false,mqMode="choose",mqUses=1,mqUsed=new Set();
try{mqOn=localStorage.getItem("jp-mq")==="1";mqMode=localStorage.getItem("jp-mqmode")==="random"?"random":"choose";const u=parseInt(localStorage.getItem("jp-mquses"));if(u>=0&&u<=99)mqUses=u}catch(e){}
function mqLeft(i){return mqUses===0?Infinity:Math.max(0,mqUses-((teams[i]&&teams[i].mq)||0))}
const onBoardLibs=()=>new Set(board.filter(c=>!c.virt).map(c=>c.lib).filter(x=>x!==undefined&&x!==null));
function mqCands(r){const on=onBoardLibs(),out=[];LIB[lang].forEach((c,li)=>{if(on.has(li)||catOff.has(li))return;if(c.qs[r]&&!mqUsed.has(li+"-"+r))out.push(li)});return out}
const mqRows=()=>{const nr=Math.max.apply(null,board.filter(c=>!c.virt).map(c=>c.clues.length));const rs=[];for(let r=0;r<nr;r++)if(mqCands(r).length)rs.push(r);return rs};
const rowPts=r=>{const a=board.find(c=>!c.virt&&c.clues[r]);return a?a.clues[r].pts:(r+1)*100};
function updateMQ(){
  const bar=document.getElementById("mqBar");if(!bar)return;
  const show=mqOn&&!!teams&&!!board;bar.hidden=!show;if(!show)return;
  const b=document.getElementById("mqBtn"),left=mqLeft(active);
  b.textContent=rqText("❓ Mystery question","❓ Pregunta misteriosa")+(left===Infinity?"":" · "+left);
  b.disabled=left===0||!!current||!!chRestrict||!mqRows().length;
  document.getElementById("mqMsg").textContent=left===0?rqText("No uses left for "+nm(active)+".","A "+nm(active)+" no le quedan usos."):(!mqRows().length?rqText("No mystery questions left.","No quedan preguntas misteriosas."):"");
}
function dropVirt(){
  const i=board.findIndex(c=>c.virt);if(i<0)return;
  board.splice(i,1);
  [used,dead].forEach(st=>Array.from(st).forEach(k=>{if(k.indexOf(i+"-")===0)st.delete(k)}));
  Array.from(won.keys()).forEach(k=>{if(k.indexOf(i+"-")===0)won.delete(k)});
}
function startMystery(r){
  const cands=mqCands(r);if(!cands.length)return false;
  const li=cands[Math.floor(Math.random()*cands.length)];
  dropVirt();
  const rows=[];for(let k=0;k<5;k++)rows.push({pts:rowPts(k),time:null});
  const col=fromLib(lang,li,{clues:rows});col.virt=true;
  board.push(col);mqUsed.add(li+"-"+r);
  teams[active].mq=(teams[active].mq||0)+1;
  openClue(board.length-1,r);
  if(current)current.virt=true;
  return true;
}
function useMystery(){
  if(current||chRestrict||!mqOn||mqLeft(active)===0)return;
  const rs=mqRows();if(!rs.length)return;
  if(mqMode==="random"){pushUndo();startMystery(rs[Math.floor(Math.random()*rs.length)]);return}
  const d=document.getElementById("chDlg"),body=document.getElementById("chBody"),err=document.getElementById("chErr");
  err.textContent="";body.textContent="";
  document.getElementById("chH").textContent=rqText("❓ Mystery question","❓ Pregunta misteriosa");
  document.getElementById("chOk").textContent=rqText("Reveal it!","¡Revelar!");
  document.getElementById("chCancel").textContent=rqText("Cancel","Cancelar");
  const l=document.createElement("label");l.style.cssText="display:grid;gap:4px;font-weight:700";const sp=document.createElement("span");sp.textContent=rqText("Choose the value","Elegí el valor");
  const sel=document.createElement("select");sel.style.cssText="font:inherit;padding:8px 10px;border-radius:8px;background:var(--bg);color:var(--ink);border:1px solid var(--muted)";
  rs.forEach(r=>{const o=document.createElement("option");o.value=r;o.textContent="$"+rowPts(r);sel.appendChild(o)});
  l.append(sp,sel);body.appendChild(l);
  document.getElementById("chCancel").onclick=()=>d.close();
  document.getElementById("chOk").onclick=()=>{d.close();pushUndo();startMystery(parseInt(sel.value))};
  d.showModal();
}
