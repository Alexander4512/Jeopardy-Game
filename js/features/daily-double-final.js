// Daily Double and final round
const wagerOpts=base=>[25,50,100].map(p=>({p,w:Math.max(10,Math.round(base*p/1000)*10)}));
function startDD(){
  document.getElementById("clueImg").hidden=true;
  const pk=current.picker,cl=clueOf();current.dd=true;
  let mx=0;board.forEach(c=>c.clues.forEach(x=>{if(x&&x.pts>mx)mx=x.pts}));
  const base=Math.max(teams[pk].score,mx);
  document.getElementById("timer").hidden=true;document.getElementById("answer").hidden=true;
  document.getElementById("meta").textContent=T("ddTitle");
  document.getElementById("turn").textContent="";
  document.getElementById("clue").textContent=T("ddAsk").split("{x}").join(nm(pk));
  const box=document.getElementById("perkActs");box.textContent="";box.hidden=false;
  wagerOpts(base).forEach(o=>{const b=document.createElement("button");b.type="button";b.textContent=T("ddWager").split("{w}").join("$"+o.w);b.onclick=()=>{current.wager=o.w;box.hidden=true;startQuestion();document.getElementById("skip").hidden=true;document.getElementById("meta").textContent=T("ddTitle")+" · $"+o.w};box.appendChild(b)});
}
function judgeDD(kind){
  const pk=current.picker,w=current.wager,key=current.ci+"-"+current.r;
  if(kind==="right"){logAct("correct",w,pk,"⭐");teams[pk].score+=w;won.set(key,[pk]);showEnd(T("ddRight").split("{x}").join(nm(pk)).split("{w}").join(w))}
  else{logAct("wrong",-w,pk,"⭐");teams[pk].score-=w;current.dead=true;showEnd(T("ddWrong").split("{x}").join(nm(pk)).split("{w}").join(w))}
}
const FINALS={
 en:[{cat:"Geography",q:"This is the largest ocean on Earth.",a:"The Pacific Ocean"},{cat:"Science",q:"This planet is known as the Red Planet.",a:"Mars"},{cat:"History",q:"In 1969, Apollo 11 landed humans on this natural satellite.",a:"The Moon"},{cat:"Animals",q:"This is the largest living mammal.",a:"The blue whale"}],
 es:[{cat:"Geografía",q:"Este es el océano más grande de la Tierra.",a:"El océano Pacífico"},{cat:"Ciencia",q:"Este planeta es conocido como el Planeta Rojo.",a:"Marte"},{cat:"Historia",q:"En 1969, el Apolo 11 llevó humanos a este satélite natural.",a:"La Luna"},{cat:"Animales",q:"Este es el mamífero vivo más grande.",a:"La ballena azul"}]
};
function startFinal(){
  finalDone=true;undoStack=[];redoStack=[];renderUndo();
  const d=document.getElementById("finDlg"),body=document.getElementById("finBody");
  const f=FINALS[lang][Math.floor(Math.random()*FINALS[lang].length)];
  const wag=teams.map(()=>0);
  document.getElementById("finH").textContent=T("finTitle");
  const mk=(t,txt,fn)=>{const b=document.createElement("button");b.type="button";b.textContent=txt;b.onclick=fn;return b};
  const msg=document.createElement("p");
  const step1=()=>{
    body.textContent="";const ask=document.createElement("p");ask.className="fin-ask";ask.textContent=T("finWagerAsk");body.appendChild(ask);
    teams.forEach((tm,i)=>{
      const row=document.createElement("div");row.className="fin-team";row.style.borderLeftColor=teamColor(i);
      const head=document.createElement("div");head.className="fin-head";
      const n=document.createElement("b");n.textContent=nm(i);n.style.color=teamColor(i);
      const sc=document.createElement("span");sc.className="fin-score";sc.textContent=(tm.score<0?"-$":"$")+Math.abs(tm.score).toLocaleString(lang);
      head.append(n,sc);row.appendChild(head);
      if(tm.score<=0){const o=document.createElement("div");o.className="fin-out";o.textContent=T("finOut");row.appendChild(o)}
      else{
        const opts=document.createElement("div");opts.className="fin-opts";
        const num=document.createElement("input");num.type="number";num.min=1;num.max=tm.score;num.step=10;num.placeholder=T("finType");num.setAttribute("aria-label",T("finType")+" "+nm(i));
        wagerOpts(tm.score).forEach(o=>{const v=Math.min(o.w,tm.score);const b=mk(0,"$"+v.toLocaleString(lang),()=>{wag[i]=v;num.value=v;[...opts.querySelectorAll("button")].forEach(x=>x.className="chip");b.className="chip on"});b.className=wag[i]===v?"chip on":"chip";b.dataset.v=v;opts.appendChild(b)});
        num.oninput=()=>{let v=Math.round(+num.value);if(!isFinite(v)||v<=0){wag[i]=0}else{v=Math.min(v,tm.score);wag[i]=v;if(+num.value>tm.score)num.value=v}[...opts.querySelectorAll("button")].forEach(x=>x.className=(+x.dataset.v===wag[i])?"chip on":"chip")};
        if(wag[i])num.value=wag[i];opts.appendChild(num);row.appendChild(opts);
      }
      body.appendChild(row);
    });
    msg.textContent="";msg.className="fin-msg";body.appendChild(msg);
    const go=mk(0,T("finStart"),()=>{if(teams.some((tm,i)=>tm.score>0&&!wag[i])){msg.textContent=T("finNeed");return}step2()});go.className="fin-go";body.appendChild(go);
  };
  const step2=()=>{
    body.textContent="";const res=teams.map(()=>null);
    const box=document.createElement("div");box.className="fin-q";
    const m=document.createElement("div");m.className="fin-cat";m.textContent=f.cat;const q=document.createElement("div");q.className="fin-clue";q.textContent=f.q;
    const a=document.createElement("div");a.className="fin-ans";a.textContent=f.a;a.hidden=true;
    const rv=mk(0,T("finReveal"),()=>{a.hidden=!a.hidden});rv.className="chip";
    box.append(m,q,a,rv);body.appendChild(box);
    teams.forEach((tm,i)=>{
      if(!wag[i])return;
      const row=document.createElement("div");row.className="fin-team fin-judge";row.style.borderLeftColor=teamColor(i);
      const n=document.createElement("b");n.textContent=nm(i);n.style.color=teamColor(i);
      const w=document.createElement("span");w.className="fin-score";w.textContent="$"+wag[i].toLocaleString(lang);
      const info=document.createElement("div");info.className="fin-info";info.append(n,w);
      const ok=mk(0,"✓",()=>{res[i]=true;ok.className="jb ok on";no.className="jb no"}),no=mk(0,"✗",()=>{res[i]=false;no.className="jb no on";ok.className="jb ok"});ok.className="jb ok";no.className="jb no";
      ok.setAttribute("aria-label",T("right"));no.setAttribute("aria-label",T("wrong"));
      const bs=document.createElement("div");bs.className="fin-btns";bs.append(ok,no);row.append(info,bs);body.appendChild(row);
    });
    const done=mk(0,T("finDone"),()=>{
      teams.forEach((tm,i)=>{
        if(!wag[i])return;const right=res[i]===true,dl=right?wag[i]:-wag[i];tm.score+=dl;
        hist.push({team:i,name:nm(i),color:teamColor(i),cat:f.cat,pts:wag[i],q:f.q,outcome:right?"correct":"wrong",delta:dl,note:"🏁"});
      });
      d.close();renderTeams();showResults();
    });done.className="fin-go";body.appendChild(done);
  };
  step1();d.showModal();
}
