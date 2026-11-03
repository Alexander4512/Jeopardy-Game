// Random question perk
let rqOn=false,rqMode="mult",rqMult=2,rqFlat=200,rqUses=1;
try{rqOn=localStorage.getItem("jp-rq")==="1";rqMode=localStorage.getItem("jp-rqmode")==="flat"?"flat":"mult";const a=parseFloat(localStorage.getItem("jp-rqmult")),b=parseFloat(localStorage.getItem("jp-rqflat")),c=parseInt(localStorage.getItem("jp-rquses"));if(a>=1&&a<=10)rqMult=a;if(b>=0&&b<=10000)rqFlat=b;if(c>=0&&c<=99)rqUses=c}catch(e){}
const rqText=(en,es)=>lang==="es"?es:en;
function rqLeft(i){return rqUses===0?Infinity:Math.max(0,rqUses-((teams[i]&&teams[i].rq)||0))}
function rqDesc(){return rqMode==="flat"?rqText("+$"+rqFlat+" bonus","+$"+rqFlat+" de bonus"):rqText("×"+rqMult+" points","×"+rqMult+" puntos")}
function updateRQ(){
  const bar=document.getElementById("rqBar");if(!bar)return;
  const show=rqOn&&!!teams&&!!board;bar.hidden=!show;if(!show)return;
  document.getElementById("rqHint").textContent=rqText("Perk:","Perk:");
  const b=document.getElementById("rqBtn"),left=rqLeft(active),dis=left===0||!!current;
  b.textContent=rqText("🎲 Random question ("+rqDesc()+")","🎲 Pregunta al azar ("+rqDesc()+")")+(left===Infinity?"":" · "+left);
  b.disabled=dis;
  document.getElementById("rqMsg").textContent=left===0?rqText("No uses left for "+nm(active)+".","A "+nm(active)+" no le quedan usos."):"";
}
function randomQuestion(){
  if(current||!rqOn||rqLeft(active)===0)return;
  const c=[];board.forEach((col,ci)=>col.clues.forEach((cl,r)=>{if(cl&&cl.q&&!cl.empty&&!used.has(ci+"-"+r))c.push([ci,r])}));
  if(!c.length){document.getElementById("rqMsg").textContent=rqText("No questions left.","No quedan preguntas.");return}
  const [ci,r]=c[Math.floor(Math.random()*c.length)];
  pushUndo();
  teams[active].rq=(teams[active].rq||0)+1;
  openClue(ci,r,true);
}
