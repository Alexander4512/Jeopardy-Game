// Sound, confetti and animations. Wraps core game functions after they are defined.
(()=>{
const RM=matchMedia("(prefers-reduced-motion:reduce)").matches;
let muted=true;try{muted=localStorage.getItem("jp-mute")!=="0"}catch(e){}
let ac=null;
const ctx=()=>{if(!ac){try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(ac.state==="suspended")ac.resume();return ac};
addEventListener("pointerdown",ctx,{once:true,capture:true});
function tone(f,d,o={}){if(muted)return;const a=ctx();if(!a)return;const t=a.currentTime+(o.at||0),g=a.createGain(),s=a.createOscillator();
  s.type=o.type||"sine";s.frequency.setValueAtTime(f,t);if(o.to)s.frequency.exponentialRampToValueAtTime(o.to,t+d);
  const v=(o.vol||.18);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  s.connect(g).connect(a.destination);s.start(t);s.stop(t+d+.02)}
function noise(d,o={}){if(muted)return;const a=ctx();if(!a)return;const t=a.currentTime+(o.at||0),n=a.sampleRate*d,b=a.createBuffer(1,n,a.sampleRate),c=b.getChannelData(0);
  for(let i=0;i<n;i++)c[i]=(Math.random()*2-1)*Math.pow(1-i/n,o.decay||2);
  const src=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();src.buffer=b;f.type="lowpass";f.frequency.setValueAtTime(o.f||1200,t);if(o.fto)f.frequency.exponentialRampToValueAtTime(o.fto,t+d);
  g.gain.value=o.vol||.4;src.connect(f).connect(g).connect(a.destination);src.start(t)}
const notes=(arr,step,o)=>arr.forEach((f,i)=>tone(f,o&&o.d||.18,Object.assign({},o,{at:i*step})));
const SFX={
  pick(){noise(.25,{f:600,fto:3000,vol:.15,decay:1});tone(300,.25,{to:900,type:"triangle",vol:.08})},
  reveal(){notes([784,1047,1319],.07,{type:"triangle",vol:.12,d:.35})},
  right(){notes([523,659,784,1047],.09,{type:"square",vol:.07,d:.22});tone(1568,.5,{at:.36,type:"triangle",vol:.1})},
  wrong(){tone(180,.45,{type:"sawtooth",vol:.12,to:110});tone(185,.45,{type:"sawtooth",vol:.08,to:112})},
  skip(){tone(500,.15,{to:300,type:"triangle",vol:.1})},
  tick(){tone(1200,.05,{type:"square",vol:.05})},
  timeup(){tone(220,.7,{type:"square",vol:.1});tone(233,.7,{type:"square",vol:.07})},
  dd(){notes([392,523,659,784,659,784,1047],.1,{type:"square",vol:.07,d:.2});noise(.6,{at:.7,f:4000,vol:.12,decay:3})},
  bomb(){noise(1.2,{f:900,fto:60,vol:.7,decay:1.5});tone(90,.9,{to:35,type:"sine",vol:.35})},
  delegate(){noise(.35,{f:2500,fto:400,vol:.15,decay:1});tone(700,.3,{to:350,type:"triangle",vol:.08})},
  win(){notes([523,523,523,659,784,659,784,1047],.14,{type:"square",vol:.07,d:.25});notes([262,330,392,523],.28,{type:"triangle",vol:.08,d:.5})},
  coin(){tone(988,.08,{type:"square",vol:.06});tone(1319,.25,{at:.08,type:"square",vol:.06})},
  down(){tone(400,.2,{to:200,type:"triangle",vol:.1})},
  click(){tone(900,.04,{type:"triangle",vol:.05})}
};
window.jpSFX=SFX;

/* confetti */
let cv,cx,parts=[],raf=0;
function confetti(n,burst){if(RM)return;if(!cv){cv=document.createElement("canvas");cv.id="fxCanvas";document.body.appendChild(cv);cx=cv.getContext("2d")}
  const top=document.querySelector("dialog[open]");(top||document.body).appendChild(cv);
  cv.width=innerWidth;cv.height=innerHeight;
  const cols=["#FF6B5A","#4cd6a0","#ffd166","#6ea8fe","#ff8fd1","#fff"];
  for(let i=0;i<n;i++)parts.push(burst?{x:innerWidth/2,y:innerHeight/2,vx:(Math.random()-.5)*16,vy:Math.random()*-14-4,r:Math.random()*6+4,c:cols[i%6],a:Math.random()*6,s:(Math.random()-.5)*.3,l:120}
    :{x:Math.random()*innerWidth,y:-20-Math.random()*innerHeight*.5,vx:(Math.random()-.5)*3,vy:Math.random()*3+2,r:Math.random()*6+4,c:cols[i%6],a:Math.random()*6,s:(Math.random()-.5)*.3,l:260});
  if(!raf)loop()}
function loop(){cx.clearRect(0,0,cv.width,cv.height);parts=parts.filter(p=>p.l-->0&&p.y<cv.height+30);
  parts.forEach(p=>{p.vy+=.25;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.a+=p.s;cx.save();cx.translate(p.x,p.y);cx.rotate(p.a);cx.fillStyle=p.c;cx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);cx.restore()});
  raf=parts.length?requestAnimationFrame(loop):(cx.clearRect(0,0,cv.width,cv.height),0)}

const card=()=>document.querySelector("#dlg .card");
function anim(el,cls,ms){if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);setTimeout(()=>el.classList.remove(cls),ms||900)}
const wrap=(name,fn)=>{try{const orig=eval(name);if(typeof orig!=="function")return;const w=function(...a){return fn(orig,this,a)};eval(name+"=w")}catch(e){console.warn("fx: cannot hook",name,e)}};

wrap("openClue",(o,t,a)=>{SFX.pick();return o.apply(t,a)});
wrap("judge",(o,t,a)=>{const k=a[0],dd=typeof current!=="undefined"&&current&&current.dd;const r=o.apply(t,a);
  if(k==="right"){SFX.right();anim(card(),"fx-right");confetti(dd?160:70,true)}
  else if(k==="wrong"){SFX.wrong();anim(card(),"fx-wrong",500)}
  else if(k==="skip")SFX.skip();
  return r});
wrap("resolveGroup",(o,t,a)=>{let b=null;try{b=teams.map(x=>x.score)}catch(e){}const r=o.apply(t,a);try{const up=teams.some((x,i)=>x.score>b[i]),dn=teams.some((x,i)=>x.score<b[i]);if(up){SFX.right();anim(card(),"fx-right");confetti(70,true)}else if(dn){SFX.wrong();anim(card(),"fx-wrong",500)}else SFX.reveal()}catch(e){}return r});
wrap("startDD",(o,t,a)=>{const r=o.apply(t,a);SFX.dd();anim(card(),"fx-dd",1600);return r});
wrap("showPerk",(o,t,a)=>{const r=o.apply(t,a);if(a[0]==="bomb"){SFX.bomb();anim(card(),"fx-boom",700);anim(document.querySelector("main"),"fx-boom",700)}else SFX.delegate();return r});
wrap("showAnswer",(o,t,a)=>{const r=o.apply(t,a);const el=document.getElementById("answer");if(!el.hidden){SFX.reveal();anim(el,"fx-show",500)}return r});
wrap("showEnd",(o,t,a)=>{const r=o.apply(t,a);anim(document.getElementById("answer"),"fx-show",500);return r});
wrap("showResults",(o,t,a)=>{const r=o.apply(t,a);SFX.win();confetti(250,false);setTimeout(()=>confetti(120,true),400);return r});
const deal=()=>{const b=document.getElementById("board");if(!b||RM)return;[...b.children].forEach((c,i)=>{c.style.animationDelay=(i%5)*60+Math.floor(i/5)*50+"ms"});anim(b,"fx-deal",1600)};
wrap("newGame",(o,t,a)=>{const r=o.apply(t,a);setTimeout(deal,0);return r});

/* score changes */
let prev=null;try{prev=teams.map(x=>x.score)}catch(e){}
wrap("renderTeams",(o,t,a)=>{const r=o.apply(t,a);try{
  const now=teams.map(x=>x.score),cards=document.querySelectorAll("#teams .team");
  if(prev&&prev.length===now.length)now.forEach((s,i)=>{const d=s-prev[i];if(!d||!cards[i])return;const sc=cards[i].querySelector(".score");
    anim(sc,"fx-pop",500);anim(sc,d>0?"fx-up":"fx-down",900);
    if(!RM){const f=document.createElement("div");f.className="fx-float";f.textContent=(d>0?"+$":"-$")+Math.abs(d).toLocaleString();f.style.color=d>0?"var(--good)":"var(--bad)";cards[i].appendChild(f);setTimeout(()=>f.remove(),1200)}
    if(!document.querySelector("#dlg[open]"))(d>0?SFX.coin:SFX.down)()});
  prev=now}catch(e){}return r});

/* timer ticks & time up */
const tm=document.getElementById("timer");
if(tm)new MutationObserver(()=>{if(tm.hidden)return;const n=parseInt(tm.textContent,10);
  if(n===0)SFX.timeup();else if(tm.classList.contains("late")){SFX.tick();anim(tm,"fx-tick",300)}}).observe(tm,{childList:true,characterData:true,subtree:true});

/* soft clicks on tiles and buttons */
document.addEventListener("click",e=>{const b=e.target.closest("button");if(b&&!b.closest("#dlg .actions")&&!b.classList.contains("tile"))SFX.click()},true);

/* sound switch lives in Menu > Personalize */
{const c=document.getElementById("fxSound");
if(c){c.checked=!muted;c.onchange=()=>{muted=!c.checked;try{localStorage.setItem("jp-mute",muted?"1":"0")}catch(e){}if(!muted)SFX.coin()}}}

setTimeout(deal,50);
})();
