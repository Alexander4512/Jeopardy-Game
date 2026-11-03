// Submenu of the vertical menu: under the open tab, one entry per section of that tab
(function(){
  const tabs=document.querySelector("#menuDlg .tabs");if(!tabs)return;
  const clean=t=>(t||"").trim();
  function items(panel){
    if(panel.id==="panelEdit")
      return [...panel.querySelectorAll("#edSub button")].filter(b=>!b.hidden).map(b=>({text:clean(b.textContent),active:b.getAttribute("aria-selected")==="true",go:()=>{showSub(b.dataset.sub)}}));
    panel.querySelectorAll(".grp.is-empty").forEach(g=>g.classList.remove("is-empty"));
    panel.querySelectorAll(".grp.perk").forEach(g=>{if(![...g.children].some(c=>c.tagName!=="H3"&&c.offsetHeight))g.classList.add("is-empty")});
    const out=[];
    panel.querySelectorAll(".grp>h3,.colors.grp>.hint:first-child").forEach(h=>{
      const g=h.parentElement;if(!g.offsetHeight)return;
      out.push({text:clean(h.textContent),el:g,go:()=>{g.scrollIntoView({behavior:"smooth",block:"start"});g.classList.remove("sr-flash");void g.offsetWidth;g.classList.add("sr-flash");setTimeout(()=>g.classList.remove("sr-flash"),1600)}});
    });
    return out;
  }
  let busy=false;
  function build(){
    if(busy)return;busy=true;
    tabs.querySelectorAll(".tab-sub").forEach(e=>e.remove());
    const b=tabs.querySelector('[role=tab][aria-selected="true"]');
    const panel=b&&document.getElementById(b.getAttribute("aria-controls"));
    if(panel&&b.offsetHeight){
      const list=items(panel);
      if(list.length>1){
        const box=document.createElement("div");box.className="tab-sub";
        const bar=document.createElement("span");bar.className="tab-sub-bar";bar.setAttribute("aria-hidden","true");box.append(bar);
        const btns=[];
        const mark=n=>{btns.forEach((x,i)=>x.classList.toggle("on",i===n));const x=btns[n];if(x&&x.offsetHeight){const h=x.offsetHeight*0.7;bar.style.height=h+"px";bar.style.transform="translateY("+(x.offsetTop+(x.offsetHeight-h)/2)+"px)"}else bar.style.height="0"};
        list.forEach((it,i)=>{const x=document.createElement("button");x.type="button";x.textContent=it.text;x.onclick=()=>{it.go();if(panel.id==="panelEdit")setTimeout(build,0);else mark(i)};box.append(x);btns.push(x)});
        b.after(box);
        let cur=list.findIndex(it=>it.active);
        if(panel.id!=="panelEdit"){
          const spy=()=>{
            const top=panel.getBoundingClientRect().top+60;let n=0;
            list.forEach((it,i)=>{if(it.el&&it.el.offsetHeight&&it.el.getBoundingClientRect().top<=top)n=i});
            if(panel.scrollTop+panel.clientHeight>=panel.scrollHeight-4)n=list.length-1;
            if(n!==cur){cur=n;mark(n)}
          };
          panel.onscroll=spy;cur=-1;spy();if(cur<0){cur=0;mark(0)}
        }else mark(cur<0?0:cur);
        requestAnimationFrame(()=>mark(Math.max(cur,0)));
      }
    }
    busy=false;
  }
  new MutationObserver(m=>{if(!busy&&m.some(r=>r.target.matches&&r.target.matches("[role=tab]")))build()}).observe(tabs,{attributes:true,subtree:true,attributeFilter:["aria-selected","hidden"]});
  document.getElementById("menuBtn").addEventListener("click",()=>setTimeout(build,60));
  document.getElementById("modeBtn").addEventListener("click",()=>setTimeout(build,60));
  const ed=document.getElementById("edSub");
  if(ed)new MutationObserver(()=>{if(!busy&&document.getElementById("tabEdit").getAttribute("aria-selected")==="true")build()}).observe(ed,{attributes:true,subtree:true,attributeFilter:["aria-selected"]});
})();

// Back-to-top button: always visible, disabled while the open panel is already at the top
(function(){
  const menu=document.querySelector("#menuDlg .menu"),btn=document.getElementById("menuTop");if(!menu||!btn)return;
  const panel=()=>menu.querySelector(".panel:not([hidden])");
  const sync=()=>{const p=panel(),off=!(p&&p.scrollTop>8);if(btn.disabled!==off)btn.disabled=off};
  menu.addEventListener("scroll",sync,true);
  new MutationObserver(sync).observe(menu,{attributes:true,subtree:true,attributeFilter:["hidden"]});
  btn.onclick=()=>{const p=panel();if(p)p.scrollTo({top:0,behavior:"smooth"})};
  document.getElementById("menuBtn").addEventListener("click",()=>setTimeout(sync,80));
})();
