// Board model: validation, category library, board builders
function validBoard(b){return Array.isArray(b)&&b.length>=1&&b.length<=10&&b.every(c=>c&&typeof c.cat==="string"&&Array.isArray(c.clues)&&c.clues.length>=1&&c.clues.length<=10&&c.clues.every(x=>x&&typeof x.q==="string"&&typeof x.a==="string"&&Number.isFinite(x.pts)))}
const rowsOf=D=>Array.from({length:Math.max.apply(null,D.map(c=>c.clues.length))},(_,r)=>r);
const BUILTIN_N=LIB.en.length;
let customCats=[];
try{const cc=JSON.parse(localStorage.getItem("jp-customcats")||"[]");if(Array.isArray(cc))customCats=cc.filter(c=>c&&typeof c.cat==="string"&&Array.isArray(c.qs)&&c.qs.length>=1&&c.qs.every(x=>Array.isArray(x)&&typeof x[0]==="string"&&typeof x[1]==="string")).slice(0,30)}catch(e){}
function syncCustomLib(){
  LIB.en.length=BUILTIN_N;LIB.es.length=BUILTIN_N;
  customCats.forEach(c=>{const e={cat:c.cat,type:"normal",qs:c.qs,custom:true};LIB.en.push(e);LIB.es.push(e)});
}
syncCustomLib();
function qTexts(arr,skip){const t=new Set();(arr||[]).forEach((c,i)=>{if(i===skip)return;c.clues.forEach(x=>{if(x&&x.q)t.add(x.q.trim())})});return t}
function availV(idx,ci,arr,otherArr){
  const rows=arr[ci].clues.length,pool=poolOf(lang,idx),same=qTexts(arr,ci),oth=qTexts(otherArr,-1);
  let loose=-1;
  for(let v=0;5*v<pool.length;v++){
    const blk=pool.slice(5*v,5*v+rows).filter(Boolean);
    if(!blk.length)continue;
    if(blk.some(x=>same.has(x[0].trim())))continue;
    if(!blk.some(x=>oth.has(x[0].trim())))return v;
    if(loose<0)loose=v;
  }
  return loose;
}
const escRe=x=>x.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
function numberDups(arr){
  const g=new Map();
  arr.forEach(c=>{if(c.lib!=null&&LIB[lang][c.lib]){if(!g.has(c.lib))g.set(c.lib,[]);g.get(c.lib).push(c)}});
  g.forEach((cols,lib)=>{
    const base=LIB[lang][lib].cat,re=new RegExp("^"+escRe(base)+"( \\d+)?$");
    cols.forEach((c,i)=>{if(!re.test(c.cat))return;c.cat=cols.length>1?base+" "+(i+1):base});
  });
}
function mkClue(type,x){
  if(x&&x.t)type=x.t;
  if(type==="mc")return{type:"mc",q:x[0],a:x[1],ch:x[2]};
  if(type==="tf")return{type:"tf",q:x[0],truth:x[1],a:""};
  if(type==="hl")return{type:"hl",q:x[0],ref:x[1],target:x[2],a:""};
  if(type==="closest")return{type:"closest",q:x[0],target:x[1],a:""};
  return x[2]?{q:x[0],a:x[1],ch:x[2],ca:x[3]}:{q:x[0],a:x[1]};
}
function poolOf(l,idx){const c=LIB[l][idx];return c.qs.concat(idx<BUILTIN_N&&ALTS[l]&&ALTS[l][idx]?ALTS[l][idx]:[])}
function fromLib(l,idx,old,keep){
  const cat=LIB[l][idx],rows=old?old.clues.length:2,pool=poolOf(l,idx);
  let off=(old&&old.lib===idx&&old.vr)?5*old.vr:0;if(!pool[off])off=0;
  const col={cat:cat.cat,lib:idx,clues:[]};
  if(off)col.vr=off/5;
  if(old&&old.diff)col.diff=old.diff;
  for(let r=0;r<rows;r++){
    const o=old?old.clues[r]:null,base={pts:o?o.pts:(VALUES[r]||(r+1)*100),time:o?o.time:null};
    if(keep&&keep.has(r)&&o){col.clues.push(o);continue}
    const it=pool[off+r];
    if(it){const cl=Object.assign(base,mkClue(cat.type,it));if(o&&o.empty)cl.empty=true;col.clues.push(cl)}
    else col.clues.push(Object.assign(base,{q:"",a:"",empty:true}));
  }
  return col;
}
function builtIn(l){
  const first=[0,1,2].filter(i=>!catOff.has(i));
  const rest=LIB[l].map((_,i)=>i).filter(i=>!catOff.has(i)&&first.indexOf(i)<0);
  for(let i=rest.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=rest[i];rest[i]=rest[j];rest[j]=t}
  return first.concat(rest).slice(0,3).map(i=>fromLib(l,i,null));
}
const reLang=(b,l)=>b.map(c=>(c.lib!==undefined&&c.lib!==null&&LIB[l][c.lib])?fromLib(l,c.lib,c):c);
function rotateCol(ci,dir){
  const n=LIB[lang].length;
  const taken=new Set(board.map((c,i)=>i===ci?null:c.lib).filter(x=>x!==null&&x!==undefined));
  let cur=board[ci].lib;
  if(cur===undefined||cur===null)cur=dir>0?-1:0;
  for(let st=1;st<=n;st++){
    const idx=(((cur+dir*st)%n)+n)%n;
    if(!taken.has(idx)&&!catOff.has(idx)){
      const keep=new Set();board[ci].clues.forEach((x,r)=>{if(used.has(ci+"-"+r))keep.add(r)});
      board[ci]=fromLib(lang,idx,board[ci],keep);
      if(custom){try{localStorage.setItem("jp-board",JSON.stringify(board))}catch(e){}}
      renderBoard();renderWarn();return;
    }
  }
}
let catOff=new Set();
try{const co=JSON.parse(localStorage.getItem("jp-catoff")||"[]");if(Array.isArray(co))catOff=new Set(co.filter(x=>Number.isInteger(x)&&x>=0&&x<LIB.en.length));if(LIB.en.length-catOff.size<3)catOff=new Set()}catch(e){}
let board=null,custom=false;
try{const sb=localStorage.getItem("jp-board");if(sb){const pb=JSON.parse(sb);if(validBoard(pb)){board=pb;custom=true}}}catch(e){}
function defaultBoard(){return [0,1,2,3].filter(i=>i<LIB[lang].length).map(i=>fromLib(lang,i,{clues:VALUES.map(p=>({pts:p,time:null}))}))}
if(!board)board=defaultBoard();
