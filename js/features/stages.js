// Multi-stage play: extra rows, columns and boards
let stOn=false,stMode="board",stMult=2,stMultOn=true,st1Skip=false,stage=1,stDone=false;
const stK={row:false,col:false,board:false};const syncSt=()=>{stOn=stK.row||stK.col||stK.board};
try{["row","col","board"].forEach(k=>{stK[k]=localStorage.getItem("jp-st-"+k)==="1"});syncSt();stMultOn=localStorage.getItem("jp-stmulton")!=="0";st1Skip=localStorage.getItem("jp-stskip")==="1";const m=localStorage.getItem("jp-stmode");if(m==="col"||m==="row")stMode=m;const x=parseFloat(localStorage.getItem("jp-stmult"));if(x>0&&x<=10)stMult=x}catch(e){}
function updateStageTag(){const t=document.getElementById("stageTag");if(!t)return;t.hidden=stage<2;t.textContent=stMultOn?rqText("⭐ Stage 2 · values ×"+stMult,"⭐ Etapa 2 · valores ×"+stMult):rqText("⭐ Stage 2","⭐ Etapa 2")}
function stageReady(){return stOn&&stage===1&&played>0&&unplayedCount()===0}
function showStageDlg(kind){
  const d=document.getElementById("chDlg"),body=document.getElementById("chBody"),err=document.getElementById("chErr");
  err.textContent="";body.textContent="";
  document.getElementById("chH").textContent=kind==="board"?rqText("⏭ Stage 2: new board","⏭ Etapa 2: tablero nuevo"):kind==="col"?rqText("➕ Add a column","➕ Agregar una columna"):rqText("➕ Add a row","➕ Agregar una fila");
  const sty="font:inherit;padding:8px 10px;border-radius:8px;background:var(--bg);color:var(--ink);border:1px solid var(--muted)";
  const mkL=(txt,el)=>{const l=document.createElement("label");l.style.cssText="display:grid;gap:4px;font-weight:700";const sp=document.createElement("span");sp.textContent=txt;l.append(sp,el);return l};
  const mkC=(txt,chk)=>{const l=document.createElement("label");l.style.cssText="display:flex;gap:8px;align-items:center;font-weight:700";l.append(chk,document.createTextNode(txt));return l};
  const names=LIB[lang].map(c=>c.cat),inB=new Set(board.map(c=>c.lib));
  const order=names.map((_,i)=>i).sort((a,b)=>(inB.has(a)?1:0)-(inB.has(b)?1:0));
  const D=board.filter(c=>!c.virt),curRows=Math.max.apply(null,D.map(c=>c.clues.length));
  const sels=[];let rowsIn=null;const colChks=[];
  const catSel=k=>{const sel=document.createElement("select");sel.style.cssText=sty;names.forEach((c,i)=>{const o=document.createElement("option");o.value=i;o.textContent=c;sel.appendChild(o)});sel.value=order[k%order.length];sels.push(sel);return mkL(rqText("Category "+(k+1),"Categoría "+(k+1)),sel)};
  const mon=document.createElement("input");mon.type="checkbox";mon.checked=stMultOn;
  const mult=document.createElement("input");mult.type="number";mult.min="0.5";mult.max="10";mult.step="0.5";mult.value=stMult;mult.style.cssText=sty;
  mon.onchange=()=>{mult.disabled=!mon.checked};mult.disabled=!mon.checked;
  if(kind==="board"){if(board2Saved){const n=document.createElement("p");n.className="hint";n.textContent=rqText("Your edited Board 2 will be used as stage 2.","Se usará tu Tablero 2 editado como etapa 2.");body.appendChild(n)}else for(let k=0;k<5;k++)body.appendChild(catSel(k))}
  else if(kind==="col"){
    body.appendChild(catSel(0));
    rowsIn=document.createElement("input");rowsIn.type="number";rowsIn.min="1";rowsIn.max="10";rowsIn.step="1";rowsIn.value=Math.min(10,curRows);rowsIn.style.cssText=sty;
    body.appendChild(mkL(rqText("How many rows? (1–10)","¿Cuántas filas? (1–10)"),rowsIn));
  }else{
    const box=document.createElement("div");box.style.cssText="display:grid;gap:6px";
    const h=document.createElement("span");h.style.fontWeight="700";h.textContent=rqText("Which columns get the new row?","¿En qué columnas va la fila nueva?");box.appendChild(h);
    D.forEach((c,ci)=>{const k=document.createElement("input");k.type="checkbox";k.checked=c.clues.length<10;k.disabled=c.clues.length>=10;colChks.push(k);box.appendChild(mkC(c.cat,k))});
    body.appendChild(box);
  }
  body.append(mkC(rqText("Multiply the values","Multiplicar los valores"),mon),mkL(rqText("Value multiplier","Multiplicador de valores"),mult));
  const fin=document.createElement("input");fin.type="checkbox";fin.checked=finalOn;
  body.appendChild(mkC(rqText("Final round where teams bet their points","Ronda final donde los equipos apuestan sus puntos"),fin));
  document.getElementById("chOk").textContent=rqText("Add","Agregar");
  document.getElementById("chCancel").textContent=rqText("Not now","Ahora no");
  document.getElementById("chCancel").onclick=()=>{d.close();renderPick()};
  document.getElementById("chOk").onclick=()=>{
    stMultOn=mon.checked;const m=stMultOn?parseFloat(mult.value):stMult;
    if(!(m>0&&m<=10)){err.textContent=rqText("Enter a multiplier between 0.5 and 10.","Ingresá un multiplicador entre 0,5 y 10.");return}
    let opt={};
    if(kind==="col"){const n=Math.round(parseFloat(rowsIn.value));if(!(n>=1&&n<=10)){err.textContent=rqText("Rows must be between 1 and 10.","Las filas deben ser entre 1 y 10.");return}opt.rows=n;opt.lib=+sels[0].value}
    else if(kind==="row"){opt.cols=colChks.map((k,i)=>k.checked?i:-1).filter(i=>i>=0);if(!opt.cols.length){err.textContent=rqText("Choose at least one column.","Elegí al menos una columna.");return}}
    else{opt.libs=sels.map(x=>+x.value);opt.useB2=!!board2Saved}
    stMult=m;finalOn=fin.checked;
    try{localStorage.setItem("jp-stmult",m);localStorage.setItem("jp-stmulton",stMultOn?"1":"0");localStorage.setItem("jp-final",finalOn?"1":"0")}catch(x){}
    applyStage(kind,stMultOn?m:1,opt);d.close();
  };
  d.showModal();
}
function applyStage(mode,m,opt){
  dropVirt();
  const R=v=>Math.max(1,Math.round(v*m));
  const alts=lib=>(ALTS[lang]&&ALTS[lang][lib])||[];
  if(mode==="board"){
    board=(opt.useB2&&board2Saved)?JSON.parse(JSON.stringify(board2Saved)):(()=>{const cnt={};const cols=opt.libs.map(i=>{const v=cnt[i]||0;cnt[i]=v+1;return fromLib(lang,i,{lib:i,vr:v,clues:VALUES.map(p=>({pts:R(p),time:null}))})});numberDups(cols);return cols})();
    used=new Set();won=new Map();dead=new Set();mqUsed=new Set();
  }else if(mode==="col"){
    if(board.length>=10)return;
    const base=board[0].clues.map(c=>c.pts);
    while(base.length<opt.rows){const a=base[base.length-1],b=base.length>1?base[base.length-2]:0;base.push(a+(a-b||100))}
    const col=fromLib(lang,opt.lib,{clues:base.slice(0,opt.rows).map(p=>({pts:R(p),time:null}))});
    const al=alts(opt.lib);
    for(let r=LIB[lang][opt.lib].qs.length;r<opt.rows;r++){const a=al[r-LIB[lang][opt.lib].qs.length];if(a)col.clues[r]=Object.assign({pts:col.clues[r].pts,time:null},mkClue("normal",a))}
    board.push(col);
  }else{
    const D=board.filter(c=>!c.virt),mx=Math.max.apply(null,D.map(c=>Math.max.apply(null,c.clues.map(x=>x.pts||0)))),v=R(mx);
    D.forEach((col,ci)=>{
      if(col.clues.length>=10)return;
      if(!opt.cols.includes(ci)){col.clues.push({pts:v,time:null,q:"",a:"",empty:true});return}
      const a=col.lib!=null?alts(col.lib):[];let alt=null;
      for(let k=a.length-1;k>=0;k--){if(!col.clues.some(x=>x.q===a[k][0])){alt=a[k];break}}
      col.clues.push(alt?Object.assign({pts:v,time:null},mkClue("normal",alt)):{pts:v,time:null,q:"",a:"",empty:true});
    });
  }
  stage=2;undoStack=[];redoStack=[];current=null;
  try{if(mode==="board"){placeBombs(bombLevel)}placeDD()}catch(e){}
  renderBoard();renderTeams();renderUndo();renderPick();
}
