// Search inside the menu: finds settings by text and jumps to them
(function(){
  const input=document.getElementById("menuSearch"),res=document.getElementById("searchRes"),menu=document.querySelector("#menuDlg .menu");
  if(!input||!res||!menu)return;
  const norm=t=>(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
  const TABS={panelGame:"Game",panelEdit:"Edit",panelCats:"Cats",panelPerks:"Perks",panelHist:"Hist",panelLook:"Look"};
  function index(){
    const out=[];
    document.querySelectorAll("#menuDlg .menu>.panel").forEach(p=>{
      const tab=TABS[p.id];if(!tab||tab==="Cats"||tab==="Hist")return;
      const tabName=(document.getElementById("tab"+tab)||{}).textContent||"";
      p.querySelectorAll("label,.grp>h3,.colors>.hint:first-child,button").forEach(el=>{
        if(el.matches("button")&&(el.closest(".subtabs,.perk-card,.chips,.avatar,.rm,#palRow,.stepper")||(el.textContent||"").trim().length<3))return;
        if(el.hidden||el.closest("[hidden]:not(.panel)"))return;
        if(menuMode==="simple"&&el.closest(".adv"))return;
        const sp=el.matches("label")?(el.querySelector(":scope>span")||el):el;
        if(el.matches("label")&&el.closest(".perk-card")){}
        const text=(sp.textContent||"").trim();if(!text)return;
        const sec=el.matches("h3,.hint")?"":((el.closest(".grp")||{}).querySelector?((el.closest(".grp").querySelector("h3,.hint")||{}).textContent||""):"");
        out.push({el,text,tab,tabName,sec:sec.trim()});
      });
    });
    return out;
  }
  function render(){
    const q=norm(input.value.trim());
    if(!q){menu.removeAttribute("data-q");res.hidden=true;return}
    const hits=index().filter(r=>norm(r.text+" "+r.sec+" "+r.tabName).includes(q));
    menu.dataset.q="1";res.hidden=false;res.replaceChildren();
    if(!hits.length){const p=document.createElement("p");p.className="hint";p.textContent=T("noRes");res.append(p);return}
    hits.slice(0,40).forEach(r=>{
      const b=document.createElement("button");b.type="button";b.className="sr-item";
      const t=document.createElement("span");t.className="sr-text";t.textContent=r.text;
      const w=document.createElement("small");w.className="sr-where";w.textContent=r.tabName+(r.sec&&r.sec!==r.text?" › "+r.sec:"");
      b.append(t,w);b.onclick=()=>go(r);res.append(b);
    });
  }
  function go(r){
    input.value="";menu.removeAttribute("data-q");res.hidden=true;
    showTab(r.tab);
    const sub=r.el.closest(".subpanel");if(sub&&typeof showSub==="function")showSub(sub.dataset.sub);
    const tgt=r.el.matches("label,button")?r.el:(r.el.closest(".grp")||r.el);
    tgt.scrollIntoView({block:"center"});tgt.classList.remove("sr-flash");void tgt.offsetWidth;tgt.classList.add("sr-flash");
    setTimeout(()=>tgt.classList.remove("sr-flash"),1600);
  }
  input.addEventListener("input",render);
  input.addEventListener("keydown",e=>{if(e.key==="Escape"&&input.value){e.stopPropagation();e.preventDefault();input.value="";render()}});
  document.getElementById("menuBtn").addEventListener("click",()=>{input.placeholder=T("searchPh");input.setAttribute("aria-label",T("searchPh"));input.value="";render()});
})();
