// Board editor submenu
const LVL={easy:"easy, well-known general knowledge",medium:"medium, for an average quiz player",hard:"hard, for well-informed players",impossible:"extremely hard, expert-level and obscure"};
const edOpen=new Set();
let edDirty=false;
let ed=null,sample=null;
(async()=>{try{if(window.claude){sample=await claude.use("sample");if(sample){document.getElementById("genBtn").hidden=false;document.getElementById("genEmptyBtn").hidden=false}}}catch(e){}})();
const edDlg=document.getElementById("panelEdit"),edMsg=document.getElementById("edMsg");
const mk=(tag,props,kids)=>{const n=document.createElement(tag);Object.assign(n,props||{});(kids||[]).forEach(k=>n.append(k));return n};
function field(f,c,r,val,ph,type){
  const i=mk("input",{type:type||"text",value:val==null?"":val,placeholder:ph||""});
  i.dataset.f=f;if(c!=null)i.dataset.c=c;if(r!=null)i.dataset.r=r;
  i.setAttribute("aria-label",ph||f);if(type==="number"){i.min=0;i.step="any"}
  return i;
}
const numVal=(v,f)=>{
  const isP=f.endsWith("pts"),d=isP?100:null;
  if(v===""||v==null)return d;
  const n=Math.round(+v);
  if(!isFinite(n))return d;
  return isP?Math.max(1,n):Math.max(0,n);
};
function typeSel(f,c,r){
  const sl=mk("select");sl.dataset.f=f;if(c!=null)sl.dataset.c=c;if(r!=null)sl.dataset.r=r;
  sl.setAttribute("aria-label",T("typeBulk"));
  [["",T("typeBulk")],["normal",T("ty_normal")],["tf",T("ty_tf")],["hl",T("ty_hl")],["closest",T("ty_closest")],["mc",T("ty_mc")],["img",T("ty_img")],["imgseq",T("ty_imgseq")],["img1",T("ty_img1")],["rand",T("ty_rand")],["randone",T("ty_randone")]].forEach(o=>sl.appendChild(mk("option",{value:o[0],textContent:o[1]})));
  return sl;
}
function setType(cl,t){
  if((cl.type||"normal")===t)return;
  cl.type=t==="normal"?undefined:t;
  cl.q="";cl.a="";delete cl.truth;delete cl.ref;delete cl.target;delete cl.ch;delete cl.ca;
  if(t==="mc"||/^img/.test(t))cl.ch=[];
  if(/^img/.test(t))cl.q=lang==="es"?"¿Qué es esto?":"What is this?";
  if(t==="tf")cl.truth=true;
}
const randAllTeam=()=>["tf","hl","closest"][Math.floor(Math.random()*3)];
const randOneTeam=()=>["normal","mc"][Math.floor(Math.random()*2)];
const resolveType=v=>v==="rand"?randAllTeam():v==="randone"?randOneTeam():v;
let edSel=0,edWhich=1,edStore={1:null,2:null},ed2Orig="",board2Saved=null;
try{const b=JSON.parse(localStorage.getItem("jp-board2")||"null");if(validBoard(b))board2Saved=b}catch(e){}
function defBoard2(){
  const m=stMultOn?stMult:1,inB=new Set(board.map(c=>c.lib));
  const order=LIB[lang].map((_,i)=>i).sort((a,b)=>(inB.has(a)?1:0)-(inB.has(b)?1:0)).slice(0,5);
  return order.map(i=>fromLib(lang,i,{clues:VALUES.map(p=>({pts:Math.max(1,Math.round(p*m)),time:null}))}));
}
function switchBoard(w){
  if(w===edWhich)return;
  edStore[edWhich]=ed;
  if(!edStore[w]){
    if(w===2){edStore[2]=board2Saved?JSON.parse(JSON.stringify(board2Saved)):defBoard2();ed2Orig=JSON.stringify(edStore[2])}
    else edStore[1]=JSON.parse(JSON.stringify(board));
  }
  ed=edStore[w];edWhich=w;edSel=0;renderEditor();
}
function buildBoardSw(){
  const sw=document.getElementById("boardSw");sw.textContent="";
  [[1,rqText("Board 1","Tablero 1")],[2,rqText("Board 2 (stage 2)","Tablero 2 (etapa 2)")]].forEach(([w,t])=>{
    const b=mk("button",{type:"button",className:"bsw",textContent:t});b.setAttribute("role","tab");b.setAttribute("aria-selected",w===edWhich?"true":"false");b.onclick=()=>switchBoard(w);sw.appendChild(b);
  });
  sw.appendChild(mk("small",{className:"fhint",textContent:T("b2Hint")}));
}
let edNote="";
function dupNote(idx,c){
  const cur=edWhich,oth=cur===1?2:1,B=n=>"Board "+n,Bes=n=>"Tablero "+n,w=[];
  ed.forEach((o,i)=>{if(i!==c&&o.lib===idx)w.push(rqText("column "+(i+1)+" of "+B(cur),"columna "+(i+1)+" del "+Bes(cur)))});
  const ob=edOtherBoard();(ob||[]).forEach((o,i)=>{if(o.lib===idx)w.push(rqText("column "+(i+1)+" of "+B(oth),"columna "+(i+1)+" del "+Bes(oth)))});
  if(!w.length)return"";
  const n=LIB[lang][idx].cat;
  return rqText("ℹ “"+n+"” is already in "+w.join(" and ")+". It gets a number and different questions.","ℹ “"+n+"” ya está en "+w.join(" y ")+". Se numera y usa preguntas distintas.");
}
function edOtherBoard(){const o=edWhich===1?2:1;return edStore[o]||(o===1?board:(board2Saved||[]))}
function selCol(i){
  edSel=Math.max(0,Math.min(ed.length-1,i));
  document.querySelectorAll("#edCats .catblock").forEach((b,k)=>b.hidden=k!==edSel);
  document.querySelectorAll("#colNav .cn").forEach(b=>b.setAttribute("aria-selected",+b.dataset.i===edSel?"true":"false"));
}
function stickNav(){const n=document.getElementById("colHead"),t=document.getElementById("edSub");if(n&&t)n.style.top=(t.offsetHeight-4)+"px"}
window.addEventListener("resize",()=>{try{stickNav()}catch(e){}});
function buildColNav(){
  buildBoardSw();
  const nav=document.getElementById("colNav");nav.textContent="";
  ed.forEach((c,ci)=>{
    const b=mk("button",{type:"button",className:"cn"},[mk("span",{className:"cn-n",textContent:ci+1}),mk("span",{className:"cn-t",textContent:c.cat||"—"})]);
    b.dataset.i=ci;b.setAttribute("role","tab");b.onclick=()=>selCol(ci);nav.appendChild(b);
  });
  if(ed.length<10){const a=mk("button",{type:"button",className:"cn cn-add",textContent:"＋ "+rqText("Add column","Agregar columna")});a.onclick=()=>{resizeCols(ed.length+1);selCol(ed.length-1)};nav.appendChild(a)}
  selCol(edSel);stickNav();
}
function renderEditor(){
  numberDups(ed);
  const dl=document.getElementById("catOpts");dl.textContent="";
  LIB[lang].forEach(x=>{const o=document.createElement("option");o.value=x.cat;dl.appendChild(o)});
  const rr=document.getElementById("edRows");rr.textContent="";
  rr.appendChild(mk("div",{className:"rowdef rowhead"},[mk("span",{textContent:T("row")}),mk("span",{textContent:T("pts")}),mk("span",{textContent:T("secs2")+" ("+rqText("empty = difficulty","vacío = dificultad")+")"}),mk("span",{textContent:T("typeLbl")})]));
  rowsOf(ed).forEach(r=>{
    const c0=ed.find(x=>x.clues[r]).clues[r];
    rr.appendChild(mk("div",{className:"rowdef"},[mk("span",{textContent:T("row")+" "+(r+1)}),field("rowpts",null,r,c0.pts,T("pts"),"number"),field("rowtime",null,r,c0.time,T("secs2"),"number"),typeSel("rowtype",null,r)]));
  });
  const cc=document.getElementById("edCats");cc.textContent="";
  ed.forEach((c,ci)=>{
    const b=mk("div",{className:"catblock"});
    b.appendChild(mk("div",{className:"cbhead"},[mk("span",{className:"cbnum",textContent:ci+1}),mk("strong",{textContent:rqText("Column ","Columna ")+(ci+1)})]));
    {const ps=mk("select");ps.dataset.f="poolcat";ps.dataset.c=ci;ps.setAttribute("aria-label",rqText("Category from the pool","Categoría del banco"));
      ps.appendChild(mk("option",{value:"",textContent:"✏️ "+rqText("Custom topic (typed below)","Tema propio (escrito abajo)")}));
      LIB[lang].forEach((x,idx)=>{
        if(catOff.has(idx)&&c.lib!==idx)return;
        const usedBy=ed.findIndex((o,oi)=>oi!==ci&&o.lib===idx);
        const av=c.lib===idx?0:availV(idx,ci,ed,edOtherBoard());
        const o=mk("option",{value:idx,textContent:(x.custom?"⭐ ":"")+x.cat+(av<0?" · "+rqText("no more different questions","sin más preguntas distintas"):"")});if(av<0)o.disabled=true;ps.appendChild(o);
      });
      ps.value=(c.lib==null)?"":String(c.lib);
      b.appendChild(mk("label",{className:"lab"},[mk("span",{textContent:rqText("Category from the pool","Categoría del banco")}),ps,mk("small",{className:"dupgrey",textContent:(c.lib!=null?dupNote(c.lib,ci).replace(/^ℹ “[^”]*” is /,"").replace(/^ℹ “[^”]*” ya está en /,"ya está en ").replace(/\. It gets.*$|\. Se numera.*$/,""):"")}),mk("small",{className:"fhint",textContent:rqText("Picking a category replaces this column's questions.","Elegir una categoría reemplaza las preguntas de esta columna.")})]));}
    const tin=field("cat",ci,null,c.cat,T("topic")+" "+(ci+1));tin.setAttribute("list","catOpts");{const tl=mk("label",{className:"lab topiclab"},[mk("span",{textContent:T("topic")}),tin]);tl.hidden=c.lib!=null;b.appendChild(tl)}
    const cbrow=mk("div",{className:"cbrow"});
    const dsel=mk("select");dsel.dataset.f="diff";dsel.dataset.c=ci;dsel.setAttribute("aria-label",T("diff"));
    [["",T("diffSame")]].concat(Object.keys(DIFF).map(k=>[k,T(k)])).forEach(o=>{dsel.appendChild(mk("option",{value:o[0],textContent:o[1]}))});
    dsel.value=c.diff||"";cbrow.appendChild(mk("label",{className:"lab"},[mk("span",{textContent:T("diff")}),dsel]));
    const isel=mk("select");isel.dataset.f="items";isel.dataset.c=ci;isel.setAttribute("aria-label",T("itemsLbl"));
    for(let n=1;n<=10;n++)isel.appendChild(mk("option",{value:n,textContent:n+" "+T(n===1?"nQ":"nQs")}));
    isel.value=c.clues.length;cbrow.appendChild(mk("label",{className:"lab"},[mk("span",{textContent:rqText("Number of questions","Cantidad de preguntas")}),isel]));
    cbrow.appendChild(mk("label",{className:"lab"},[mk("span",{textContent:rqText("Set all question types","Tipo de todas las preguntas")}),typeSel("coltype",ci,null)]));b.appendChild(cbrow);
    const det=mk("div",{className:"qlist"});
    det.appendChild(mk("h4",{className:"subh",textContent:rqText("✏️ Questions","✏️ Preguntas")}));
    c.clues.forEach((q,r)=>{
      const ty=q.type||"normal";
      const tsel=mk("select");tsel.dataset.f="type";tsel.dataset.c=ci;tsel.dataset.r=r;tsel.setAttribute("aria-label",T("typeLbl"));
      ["normal","tf","hl","closest","mc","img","imgseq","img1","rand","randone"].forEach(k=>tsel.appendChild(mk("option",{value:k,textContent:T("ty_"+k)})));
      tsel.value=ty;
      const kids=[tsel,field("q",ci,r,q.q,T("q")),field("img",ci,r,q.img,T("imgLbl"))];
      if(ty==="normal")kids.push(field("a",ci,r,q.a,T("a")));
      else if(/^img/.test(ty))kids.push(field("a",ci,r,q.a,T("a")),field("ch",ci,r,(q.ch||[]).join("; "),rqText("Wrong options (optional → multiple choice)","Opciones incorrectas (opcional → opción múltiple)")));
      else if(ty==="mc")kids.push(field("a",ci,r,q.a,T("a")),field("ch",ci,r,(q.ch||[]).join("; "),T("wrongOpts")));
      else if(ty==="tf"){
        const ts=mk("select");ts.dataset.f="truth";ts.dataset.c=ci;ts.dataset.r=r;ts.setAttribute("aria-label",T("truthLbl"));
        [["true",T("true")],["false",T("false")]].forEach(o=>ts.appendChild(mk("option",{value:o[0],textContent:o[1]})));
        ts.value=q.truth===false?"false":"true";kids.push(ts);
      }
      else if(ty==="hl")kids.push(field("ref",ci,r,q.ref,T("refLbl"),"number"),field("target",ci,r,q.target,T("tgtHL"),"number"));
      else kids.push(field("target",ci,r,q.target,T("tgtNum"),"number"));
      kids.push(field("pts",ci,r,q.pts,T("pts"),"number"),field("time",ci,r,q.time,T("secs2"),"number"));
      const cb=mk("input",{type:"checkbox",checked:!!q.empty});cb.dataset.f="empty";cb.dataset.c=ci;cb.dataset.r=r;cb.setAttribute("aria-label",T("emptyLbl"));
      const cap=el=>{
        const f=el.dataset.f;let inner=el;
        if(f==="pts"||f==="time"){if(f==="time")el.placeholder=rqText("Empty","Vacío");inner=mk("div",{className:"unit u-"+f},[el,mk("i",{textContent:f==="pts"?"$":"s"})]);el.inputMode="numeric"}
        const cap2=f==="time"?rqText("Time limit","Tiempo límite"):f==="pts"?T("pts"):(el.getAttribute("aria-label")||"");
        const kids=[mk("span",{textContent:cap2}),inner];
        if(f==="time"){const row=(k,v)=>mk("span",{className:"hl"},[mk("b",{textContent:k}),document.createTextNode(" "+v)]);
          kids.push(mk("small",{className:"fhint"},[row(rqText("Empty","Vacío"),rqText("→ uses the difficulty's timer","→ usa el tiempo de la dificultad")),row("0",rqText("→ no timer","→ sin tiempo")),row(rqText("A number","Un número"),rqText("→ that many seconds","→ esa cantidad de segundos"))]))}
        return mk("label",{className:"lab f-"+(f||"x")},kids);
      };
      const head=mk("div",{className:"qhead"},[mk("span",{className:"qnum"},[mk("b",{textContent:r+1}),document.createTextNode(T("row")+" "+(r+1)+" · $"+q.pts)]),mk("label",{className:"emp"},[cb,document.createTextNode(" "+T("emptyLbl"))])]);
      const qr=mk("div",{className:"qrow rc"+(r%6)},[head].concat(kids.map(cap)));
      if(q.empty)qr.querySelectorAll("input,select").forEach(i=>{if(i!==cb)i.disabled=true});
      det.appendChild(qr);
    });
    {const rowsNow=Math.max.apply(null,ed.map(x=>x.clues.length));
    if(rowsNow<10){const ar=mk("button",{type:"button",className:"addrow",textContent:"＋ "+rqText("Add row","Agregar fila")});ar.onclick=()=>{resizeEd(ed.length,rowsNow+1);document.getElementById("rowsSel").value=rowsNow+1;const rs=document.querySelectorAll("#edCats .catblock:not([hidden]) .qrow");if(rs.length)rs[rs.length-1].scrollIntoView({block:"center"})};det.appendChild(ar)}}
    b.appendChild(det);cc.appendChild(b);
  });
  buildColNav();
  edMsg.textContent=edNote;edMsg.dataset.kind=edNote?"note":"";edNote="";
  document.getElementById("colsSel").value=ed.length;
  document.getElementById("rowsSel").value=Math.max.apply(null,ed.map(c=>c.clues.length));syncSteppers();
}
edDlg.addEventListener("change",e=>{
  const t=e.target;
  if(t.dataset.f==="poolcat"){
    const c=+t.dataset.c;edDirty=true;
    if(t.value===""){ed[c].lib=null;const tl=t.closest(".catblock").querySelector(".topiclab");if(tl){tl.hidden=false;const i=tl.querySelector("input");i&&i.focus()}}else{const v=availV(+t.value,c,ed,edOtherBoard());ed[c]=fromLib(lang,+t.value,Object.assign({},ed[c],{lib:+t.value,vr:v<0?0:v}));edNote=dupNote(+t.value,c)}
    renderEditor();return;
  }
  if(t.dataset.f!=="cat")return;
  const c=+t.dataset.c,nameL=t.value.trim().toLowerCase();
  const idx=LIB[lang].findIndex(x=>x.cat.toLowerCase()===nameL);
  if(idx>=0&&ed[c].lib!==idx){const v=availV(idx,c,ed,edOtherBoard());if(v<0){edMsg.textContent=rqText("There are no more different questions for that category.","No quedan preguntas distintas para esa categoría.");t.value=ed[c].cat;return}ed[c]=fromLib(lang,idx,Object.assign({},ed[c],{lib:idx,vr:v}));edNote=dupNote(idx,c);edDirty=true;renderEditor()}
});
edDlg.addEventListener("input",e=>{
  const t=e.target,f=t.dataset.f;if(!f||f==="poolcat")return;
  edDirty=true;
  const c=+t.dataset.c,r=+t.dataset.r;
  if(f==="cat"){ed[c].cat=t.value;if(ed[c].lib!=null&&LIB[lang][ed[c].lib]&&!new RegExp("^"+escRe(LIB[lang][ed[c].lib].cat)+"( \\d+)?$").test(t.value)){ed[c].lib=null;const ps=t.closest(".catblock").querySelector('select[data-f="poolcat"]');if(ps)ps.value=""}const ct=document.querySelector('#colNav [data-i="'+c+'"] .cn-t');if(ct)ct.textContent=t.value||"—";return}
  if(f==="diff"){ed[c].diff=t.value||null;return}
  if(f==="items"){setItems(c,+t.value);return}
  if(f==="rowtype"||f==="coltype"){
    const v=t.value;if(!v)return;
    const cells=f==="rowtype"?ed.map((cc,ci)=>[ci,r]).filter(p=>ed[p[0]].clues[p[1]]):ed[c].clues.map((x,rr)=>[c,rr]);
    cells.forEach(p=>{const cl=ed[p[0]].clues[p[1]];if(!cl.empty)setType(cl,resolveType(v))});
    renderEditor();return;
  }
  if(f==="type"){setType(ed[c].clues[r],resolveType(t.value));renderEditor();return}
  if(f==="truth"){ed[c].clues[r].truth=t.value==="true";return}
  if(f==="ch"){ed[c].clues[r].ch=t.value.split(";").map(x=>x.trim()).filter(Boolean).slice(0,5);return}
  if(f==="ref"||f==="target"){const v=t.value===""?null:+t.value;ed[c].clues[r][f]=Number.isFinite(v)?v:null;return}
  if(f==="empty"){
    ed[c].clues[r].empty=t.checked;
    t.closest(".qrow").querySelectorAll("input,select").forEach(i=>{if(i!==t)i.disabled=t.checked});
    return;
  }
  if(f==="rowpts"||f==="rowtime"){
    const k=f==="rowpts"?"pts":"time";
    ed.forEach(x=>{if(x.clues[r])x.clues[r][k]=numVal(t.value,f)});
    document.querySelectorAll('#edCats [data-f="'+k+'"][data-r="'+r+'"]').forEach(i=>{i.value=t.value});
    return;
  }
  ed[c].clues[r][f]=(f==="pts"||f==="time")?numVal(t.value,f):t.value;
});
document.getElementById("cancelBtn").onclick=()=>{ed=null;edDirty=false;showTab("Game")};
document.getElementById("defBtn").onclick=()=>{
  applyPreset(lastPre);
  ed=null;newGame();showTab("Game");
};
function markInvalid(){
  document.querySelectorAll("#panelEdit .bad").forEach(e=>e.classList.remove("bad"));
  const blocks=document.querySelectorAll("#edCats .catblock");let firstBad=-1;
  ed.forEach((c,ci)=>{
    const blk=blocks[ci];if(!blk)return;
    if(firstBad<0&&(!c.cat.trim()||c.clues.some(x=>!clueOk(x))))firstBad=ci;
    if(!c.cat.trim())blk.querySelector('input[data-f="cat"]').classList.add("bad");
    c.clues.forEach((x,r)=>{
      if(clueOk(x))return;
      edOpen.add(ci);
      const det=blk.querySelector("details");if(det)det.open=true;
      const row=blk.querySelectorAll(".qrow")[r];
      if(row)row.querySelectorAll("input").forEach(i=>{
        if(i.type==="checkbox"||i.disabled)return;
        const f=i.dataset.f;
        if((f==="q"||f==="a"||f==="ref"||f==="target")&&!i.value.trim())i.classList.add("bad");
      });
    });
  });
  if(firstBad>=0){const sc=document.getElementById("edSub");try{showSub("cols")}catch(e){}selCol(firstBad)}
}
function applyEd(){
  edStore[edWhich]=ed;
  const badB=w=>edStore[w]&&edStore[w].some(c=>!c.cat.trim()||c.clues.some(x=>!clueOk(x)));
  for(const w of [1,2]){if(badB(w)){if(edWhich!==w)switchBoard(w);say(edMsg,"incomplete");markInvalid();return false}}
  for(const w of [1,2]){
    const B=edStore[w];if(!B)continue;const seen=new Map();
    for(let ci=0;ci<B.length;ci++)for(const x of B[ci].clues){
      if(x.empty||!x.q||!x.q.trim())continue;const k=x.q.trim();
      if(seen.has(k)){if(edWhich!==w)switchBoard(w);selCol(ci);edMsg.textContent=rqText("Repeated question in "+(w===1?"Board 1":"Board 2")+" (columns "+(seen.get(k)+1)+" and "+(ci+1)+"): “"+k+"”. Every question must be different.","Pregunta repetida en "+(w===1?"el Tablero 1":"el Tablero 2")+" (columnas "+(seen.get(k)+1)+" y "+(ci+1)+"): “"+k+"”. Todas las preguntas deben ser distintas.");return false}
      seen.set(k,ci);
    }
  }
  edStore[1]&&numberDups(edStore[1]);edStore[2]&&numberDups(edStore[2]);
  const b1=edStore[1]||JSON.parse(JSON.stringify(board));
  if(edStore[2]&&JSON.stringify(edStore[2])!==ed2Orig){board2Saved=JSON.parse(JSON.stringify(edStore[2]));try{localStorage.setItem("jp-board2",JSON.stringify(board2Saved))}catch(x){}}
  board=JSON.parse(JSON.stringify(b1));custom=true;
  try{localStorage.setItem("jp-board",JSON.stringify(board))}catch(x){}
  ed=null;edStore={1:null,2:null};edWhich=1;edDirty=false;newGame();showTab("Game");
  return true;
}
document.getElementById("applyBtn").onclick=()=>{applyEd()};
document.getElementById("genBtn").onclick=async()=>{
  const btn=document.getElementById("genBtn");
  const cats=ed.map(c=>c.cat.trim());
  if(cats.some(x=>!x)){say(edMsg,"needTopics");return}
  btn.disabled=true;say(edMsg,"genning");
  const slotsOf=ci=>ed[ci].clues.filter(x=>!x.empty);
  const topics=ed.map((c,ci)=>({topic:c.cat.trim(),difficulty:LVL[c.diff||diff],clues:slotsOf(ci).map(x=>aiType(x))}));
  const prompt=["Create a Jeopardy-style trivia board in "+LNAME()+".",
    "Topics, one per column, each with its difficulty level and the list of clue types to write, in order: "+JSON.stringify(topics)+".",
    "For each topic write exactly one clue for each listed type, in that order. The clues rise gradually in difficulty, while the column as a whole matches the difficulty level of its topic. For true or false clues, mix true and false statements. "+GEN_DOC,
    "Be accurate and unambiguous.",
    "Reply with only JSON in this shape: [{\"cat\":\"<topic as given>\",\"clues\":[<one clue object per listed type>]}] with one object per topic in the same order."].join("\n");
  try{
    const out=await sample.json(prompt,{cache:false});
    if(!Array.isArray(out)||out.length!==ed.length||out.some((o,ci)=>!o||!Array.isArray(o.clues)||o.clues.length!==slotsOf(ci).length||o.clues.some((x,k)=>!applyGen(Object.assign({},slotsOf(ci)[k]),x))))throw new Error("shape");
    out.forEach((o,ci)=>o.clues.forEach((x,k)=>applyGen(slotsOf(ci)[k],x)));
    ed.forEach((_,i)=>edOpen.add(i));
    edDirty=true;
    renderEditor();
    say(edMsg,"genOk");
  }catch(e){say(edMsg,"genFail")}
  btn.disabled=false;
};
document.getElementById("typeRandBtn").onclick=()=>{
  const pct=Math.min(100,Math.max(0,parseFloat(document.getElementById("typePct").value)||0));
  ed.forEach(c=>c.clues.forEach(cl=>{if(!cl.empty)setType(cl,Math.random()*100<pct?randAllTeam():"normal")}));
  edDirty=true;renderEditor();say(edMsg,"typesDone");
};
document.getElementById("genEmptyBtn").onclick=async()=>{
  const btn=document.getElementById("genEmptyBtn");
  const cols=[];
  ed.forEach((c,ci)=>{
    const slots=c.clues.filter(x=>!x.empty&&!x.q.trim());
    if(slots.length)cols.push({col:ci,topic:c.cat.trim(),difficulty:LVL[c.diff||diff],clues:slots.map(x=>aiType(x)),existing:c.clues.map(x=>x.q).filter(Boolean)});
  });
  if(!cols.length){say(edMsg,"needEmpty");return}
  if(cols.some(x=>!x.topic)){say(edMsg,"needTopics");return}
  btn.disabled=true;say(edMsg,"genning");
  const slotsOf=ci=>ed[ci].clues.filter(x=>!x.empty&&!x.q.trim());
  const prompt=["Write Jeopardy-style clues in "+LNAME()+" for the empty questions of this board.",
    "Columns, each with its topic, difficulty level, the list of clue types to write (in order) and the clues it already has: "+JSON.stringify(cols)+".",
    "For each column write exactly one clue for each listed type, in that order, and never repeat the existing clues. The clues rise gradually in difficulty. For true or false clues, mix true and false statements. "+GEN_DOC,
    "Be accurate and unambiguous.",
    "Reply with only JSON in this shape: [{\"col\":<number>,\"clues\":[<one clue object per listed type>]}] with one object per column, in the same order."].join("\n");
  try{
    const out=await sample.json(prompt,{cache:false});
    if(!Array.isArray(out)||out.length!==cols.length||out.some((o,i)=>!o||o.col!==cols[i].col||!Array.isArray(o.clues)||o.clues.length!==cols[i].clues.length||o.clues.some((x,k)=>!applyGen(Object.assign({},slotsOf(o.col)[k]),x))))throw new Error("shape");
    out.forEach(o=>{const sl=slotsOf(o.col);o.clues.forEach((x,k)=>applyGen(sl[k],x))});
    ed.forEach((_,i)=>edOpen.add(i));
    edDirty=true;renderEditor();
    say(edMsg,"genOk");
  }catch(e){say(edMsg,"genFail")}
  btn.disabled=false;
};
