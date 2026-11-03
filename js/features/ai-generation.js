// AI question generation helpers
const LNAME=()=>lang==="es"?"Spanish":"English";
const GEN_DOC="Each clue object depends on its \"type\": normal -> {\"q\":\"a clue statement\",\"a\":\"the answer phrased as a question, for example: What is Mars?\"}; tf -> {\"q\":\"a statement that is clearly either true or false\",\"truth\":true or false}; hl -> {\"q\":\"a question about a real number that states a reference number and asks whether the real value is higher or lower than it\",\"ref\":the reference number,\"target\":the real number}; closest -> {\"q\":\"a question whose answer is one single number\",\"target\":that number}; mc -> {\"q\":\"a clear question with exactly one correct answer\",\"a\":\"the short correct answer\",\"wrong\":[\"five plausible but clearly wrong short options\"]}. All numbers must be plain JSON numbers, and ref must differ from target.";
const slotType=x=>x.type||"normal";
const aiType=x=>isImg(x)?"normal":slotType(x);
function applyGen(slot,x){
  if(!x||!x.q)return false;
  const t=slotType(slot);
  if(t==="normal"||/^img/.test(t)){if(!x.a)return false;slot.q=String(x.q);slot.a=String(x.a);return true}
  if(t==="mc"){if(!x.a||!Array.isArray(x.wrong)||!x.wrong.length)return false;slot.q=String(x.q);slot.a=String(x.a);slot.ch=x.wrong.map(String).slice(0,5);return true}
  if(t==="tf"){if(typeof x.truth!=="boolean")return false;slot.q=String(x.q);slot.truth=x.truth;slot.a="";return true}
  if(t==="hl"){if(!Number.isFinite(x.ref)||!Number.isFinite(x.target)||x.ref===x.target)return false;slot.q=String(x.q);slot.ref=x.ref;slot.target=x.target;slot.a="";return true}
  if(!Number.isFinite(x.target))return false;
  slot.q=String(x.q);slot.target=x.target;slot.a="";return true;
}
function clueOk(x){
  if(x.empty)return true;
  if(!x.q.trim())return false;
  const t=slotType(x);
  if(t==="tf")return typeof x.truth==="boolean";
  if(t==="hl")return Number.isFinite(x.ref)&&Number.isFinite(x.target);
  if(t==="closest")return Number.isFinite(x.target);
  if(t==="mc")return !!x.a.trim()&&Array.isArray(x.ch)&&x.ch.length>=1;
  return !!x.a.trim();
}
async function refreshFreed(keys){
  const msg=document.getElementById("teamMsg");
  if(!keys.length){msg.textContent="";return}
  if(!sample){say(msg,"freedNoAI");return}
  say(msg,"freedGen");
  const items=keys.map(k=>{const p=k.split("-").map(Number),c=board[p[0]];return{col:p[0],row:p[1],topic:c.cat,difficulty:LVL[dOf(p[0])],type:aiType(c.clues[p[1]])}});
  const avoid=[];items.forEach(it=>{board[it.col].clues.forEach(x=>{if(x.q)avoid.push(x.q)})});
  const prompt=["Write replacement Jeopardy-style clues in "+LNAME()+".",
    "For each item below write ONE new clue of the given type about its topic at its difficulty level. Every new clue must be different from these existing clues: "+JSON.stringify(avoid)+". "+GEN_DOC,
    "Be accurate and unambiguous.",
    "Items: "+JSON.stringify(items),
    "Reply with only JSON: [{\"col\":<number>,\"row\":<number>,\"clue\":<clue object for its type>}] with one object per item, in the same order."].join("\n");
  try{
    const out=await sample.json(prompt,{cache:false});
    const slot=o=>board[o.col].clues[o.row];
    if(!Array.isArray(out)||out.length!==items.length||out.some((o,k)=>!o||o.col!==items[k].col||o.row!==items[k].row||!applyGen(Object.assign({},slot(o)),o.clue)))throw new Error("shape");
    out.forEach(o=>applyGen(slot(o),o.clue));
    custom=true;
    try{localStorage.setItem("jp-board",JSON.stringify(board))}catch(e){}
    renderBoard();
    say(msg,"freedDone");
  }catch(e){say(msg,"freedFail")}
}
