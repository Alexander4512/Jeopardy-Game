// Start page: category cards (toggle on/off) + a prototype for adding your own category
let qsAddOpen=false,qsCatKey="";
const QSC_ICONS=["🎮","🔴","⚡","⚽","🎧","🎬","😂","🍻"];
/* start page: any number can be on/off; Start is locked until 3 are on */
function qsToggleCats(idxs,on){
  const nx=new Set(catOff);idxs.forEach(i=>{if(on)nx.delete(i);else nx.add(i)});
  catOff=nx;try{localStorage.setItem("jp-catoff",JSON.stringify(Array.from(catOff)))}catch(e){}
  document.getElementById("catMsg").textContent="";qsCatSay("");renderCats();
}
function qsCatSay(t){const m=document.getElementById("qsCatMsg");if(m)m.textContent=t||""}
function renderHomeCats(){
  const grid=document.getElementById("qsCatGrid");if(!grid)return;
  const L=LIB[lang],total=L.length,act=total-catOff.size;
  document.getElementById("qsCatT").textContent=rqText("Categories","Categorías");
  document.getElementById("qsCatSub").textContent=rqText("Turn categories on or off. They are used for Quick, Classic and Party boards (Friends board has its own).","Activá o desactivá categorías. Se usan en los tableros Rápido, Clásico y Fiesta (el de Amigos tiene los suyos).");
  document.getElementById("qsCatCount").textContent=act+" / "+total+" "+rqText("on","activas");
  const all=document.getElementById("qsCatAll"),idxs=L.map((_,i)=>i),allOn=idxs.every(i=>!catOff.has(i));
  all.textContent=T(allOn?"catsDisableAll":"catsEnableAll");
  all.onclick=()=>{
    if(allOn){ /* really disable all here; Start stays locked until 3 are on again */
      catOff=new Set(idxs);try{localStorage.setItem("jp-catoff",JSON.stringify(Array.from(catOff)))}catch(e){}
      document.getElementById("catMsg").textContent="";renderCats();
    }else qsToggleCats(idxs,true)};
  /* cards are built once per category list; toggling only updates classes (no flicker) */
  const key=lang+"|"+L.map(c=>c.cat+(c.custom?"*":"")).join("|");
  if(key!==qsCatKey){
    qsCatKey=key;grid.textContent="";
    L.forEach((c,i)=>{
      const b=document.createElement("button");b.type="button";b.className="qsc-card";b.dataset.i=i;
      b.innerHTML="<span class='qsc-check' aria-hidden='true'>✓</span><span class='qsc-ic'></span><b></b><small></small>";
      b.querySelector(".qsc-ic").textContent=c.custom?"⭐":(QSC_ICONS[i]||"🎲");
      b.querySelector("b").textContent=c.cat;b.title=c.cat;
      b.onclick=()=>qsToggleCats([i],catOff.has(i));
      if(c.custom){const x=document.createElement("span");x.className="qsc-del";x.textContent="✕";x.title=rqText("Delete (click twice)","Borrar (clic dos veces)");let t;
        x.onclick=e=>{e.stopPropagation();if(x.dataset.sure){clearTimeout(t);deleteCustom(i-BUILTIN_N);renderCats();return}x.dataset.sure="1";x.textContent="🗑";t=setTimeout(()=>{delete x.dataset.sure;x.textContent="✕"},2500)};
        b.appendChild(x)}
      grid.appendChild(b)});
  }
  grid.querySelectorAll(".qsc-card").forEach(b=>{const i=+b.dataset.i,c=L[i],on=!catOff.has(i);
    b.classList.toggle("on",on);b.setAttribute("aria-pressed",on);
    b.querySelector("small").textContent=c.qs.length+" "+rqText(c.qs.length===1?"question":"questions",c.qs.length===1?"pregunta":"preguntas")});
  const cm=document.getElementById("catMsg");if(cm&&cm.textContent)qsCatSay(cm.textContent);
  qsCatGuard();
  renderHomeAdd();
}
function renderHomeAdd(){
  const box=document.getElementById("qsCatAdd");if(!box||box.dataset.open===String(qsAddOpen)&&box.dataset.lang===lang)return;
  box.dataset.open=String(qsAddOpen);box.dataset.lang=lang;box.textContent="";
  if(customCats.length>=30)return;
  if(!qsAddOpen){
    const b=document.createElement("button");b.type="button";b.className="qsc-add";
    b.innerHTML="<span>＋</span>";b.append(document.createTextNode(" "+rqText("Add your own category","Agregar tu propia categoría")));
    const tag=document.createElement("em");tag.textContent=rqText("prototype","prototipo");b.appendChild(tag);
    b.onclick=()=>{qsAddOpen=true;renderHomeAdd();const n=box.querySelector("input");if(n)n.focus()};
    box.appendChild(b);return}
  const f=document.createElement("div");f.className="qsc-form";
  const name=document.createElement("input");name.type="text";name.maxLength=30;name.placeholder=rqText("Category name (e.g. Space, Dinosaurs, 90s music)","Nombre de la categoría (ej. Espacio, Dinosaurios, Música 90s)");
  const ta=document.createElement("textarea");ta.rows=6;ta.placeholder=rqText("One per line:  question | answer   (at least 5 lines)","Una por línea:  pregunta | respuesta   (mínimo 5 líneas)");
  const wrongs=new Map();
  const acts=document.createElement("div");acts.className="qsc-acts";
  const status=document.createElement("p");status.className="qsc-msg";
  if(sample){
    const g=document.createElement("button");g.type="button";g.className="ghost";g.textContent="✨ "+rqText("Write questions with Claude","Escribir preguntas con Claude");
    g.onclick=async()=>{
      if(!name.value.trim()){status.textContent=rqText("Type the category name first.","Primero escribí el nombre de la categoría.");name.focus();return}
      g.disabled=true;status.textContent=rqText("Writing questions…","Escribiendo preguntas…");
      const prompt=["Write 5 trivia questions in "+LNAME()+" for the category \""+name.value.trim()+"\", for a family quiz night in Argentina with players aged 15 to 60.",
        "Difficulty must rise smoothly from easy (first) to hard (last). Each question has one short unambiguous answer. Add 5 plausible wrong options for each (same type as the answer).",
        "Reply with only JSON: [{\"q\":\"question\",\"a\":\"answer\",\"wrong\":[\"w1\",\"w2\",\"w3\",\"w4\",\"w5\"]}] with exactly 5 items."].join("\n");
      try{
        const out=await sample.json(prompt,{cache:false});
        if(!Array.isArray(out)||out.length!==5||out.some(o=>!o||typeof o.q!=="string"||typeof o.a!=="string"))throw new Error("shape");
        wrongs.clear();out.forEach(o=>{if(Array.isArray(o.wrong))wrongs.set(o.q.trim(),o.wrong.filter(x=>typeof x==="string"))});
        ta.value=out.map(o=>o.q.replace(/\|/g,"/")+" | "+o.a.replace(/\|/g,"/")).join("\n");
        status.textContent=rqText("Done. Review the questions, then save.","Listo. Revisá las preguntas y guardá.");
      }catch(e){status.textContent=rqText("Couldn't write the questions. Try again or type them.","No se pudieron escribir las preguntas. Probá de nuevo o escribilas vos.")}
      g.disabled=false};
    acts.appendChild(g);
  }
  const save=document.createElement("button");save.type="button";save.textContent=rqText("Save category","Guardar categoría");
  save.onclick=()=>{
    const nm=name.value.trim();
    if(!nm){status.textContent=rqText("The category needs a name.","La categoría necesita un nombre.");return}
    if(LIB[lang].some(c=>c.cat.trim().toLowerCase()===nm.toLowerCase())){status.textContent=rqText("A category with that name already exists.","Ya existe una categoría con ese nombre.");return}
    const rows=ta.value.split("\n").map(l=>l.trim()).filter(Boolean).map(l=>{const p=l.split("|");return [(p[0]||"").trim(),p.slice(1).join("|").trim()]});
    if(rows.length<5||rows.some(r=>!r[0]||!r[1])){status.textContent=rqText("Write at least 5 lines, each as: question | answer.","Escribí al menos 5 líneas, cada una como: pregunta | respuesta.");return}
    customCats.push({cat:nm,qs:rows.map(r=>{const w=wrongs.get(r[0]);return w&&w.length?[r[0],r[1],w]:[r[0],r[1]]})});
    syncCustomLib();saveCustom();qsAddOpen=false;renderCats();
    qsCatSay(rqText("Category added and turned on.","Categoría agregada y activada."));
  };
  const cancel=document.createElement("button");cancel.type="button";cancel.className="ghost";cancel.textContent=rqText("Cancel","Cancelar");cancel.onclick=()=>{qsAddOpen=false;renderHomeAdd()};
  acts.append(save,cancel);f.append(name,ta,acts,status);box.appendChild(f);
}
{const _rc=renderCats;renderCats=function(){_rc.apply(this,arguments);try{renderHomeCats()}catch(e){}}}
try{renderHomeCats()}catch(e){}
/* mirror the pool messages ("keep at least 3", ...) onto the start page */
{const cm=document.getElementById("catMsg");if(cm)new MutationObserver(()=>{if(cm.textContent&&cm.textContent!==document.getElementById("qsCatMsg").textContent)qsCatSay(cm.textContent)}).observe(cm,{childList:true,characterData:true,subtree:true})}
/* the game cannot start without enough categories on: 5 for Classic/Party, 3 otherwise */
let qsPreSel="friends";
const qsCatNeed=()=>(qsPreSel==="classic"||qsPreSel==="party")?5:3;
const qsCatLow=()=>LIB[lang].length-catOff.size<qsCatNeed();
function qsShake(){ /* vibrate the counter, message and Start button so the problem is easy to see */
  document.querySelectorAll("#qsCatCount,#qsCatMsg,#qsGo,.qsc-grid .qsc-card:not(.on)").forEach(e=>{e.classList.remove("vibrate");void e.offsetWidth;e.classList.add("vibrate")});
  clearTimeout(qsShake.t);qsShake.t=setTimeout(()=>document.querySelectorAll(".vibrate").forEach(e=>{e.classList.remove("vibrate");if(e.classList.contains("qsc-card"))e.style.animation="none"}),900);
}
function qsCatGuard(shake){
  const act=LIB[lang].length-catOff.size,need=qsCatNeed(),low=act<need,go=document.getElementById("qsGo");
  const was=go&&go.classList.contains("is-locked");
  if(go){go.classList.toggle("is-locked",low);go.setAttribute("aria-disabled",low?"true":"false");
    go.title=low?rqText("Select at least "+need+" categories to start","Elegí al menos "+need+" categorías para empezar"):""}
  const cnt=document.getElementById("qsCatCount");if(cnt)cnt.classList.toggle("is-low",low);
  const g=document.getElementById("qsCatGrid");if(g)g.classList.toggle("is-low",low);
  const miss=need-act,m=document.getElementById("qsCatMsg");
  if(low){
    const by=need===5?rqText("Classic and Party need at least 5 categories. ","Clásico y Fiesta necesitan al menos 5 categorías. "):"";
    qsCatSay("⚠ "+by+rqText("Select "+miss+" more categor"+(miss===1?"y":"ies")+" to start.","Elegí "+miss+" categoría"+(miss===1?"":"s")+" más para empezar."));
    if(shake||!was)qsShake();
  }else if(m&&m.textContent.indexOf("⚠")===0)qsCatSay("");
}
{const d=document.getElementById("qsDlg");d.addEventListener("cancel",e=>{const back=document.getElementById("qsBack");if(qsCatLow()&&back&&back.hidden){e.preventDefault();qsShake()}});
 const f=document.getElementById("qsForm");
 f.addEventListener("submit",e=>{if(qsCatLow()){e.preventDefault();e.stopImmediatePropagation();qsShake()}},true);
 document.getElementById("qsGo").addEventListener("click",e=>{if(qsCatLow()){e.preventDefault();qsShake()}})}

/* home: quick-settings subtitle, "configure board" (opens the Menu) and "launch board" inside the Menu */
(function(){
  const cfg=document.getElementById("qsCfg"),launch=document.getElementById("menuLaunch"),sub=document.getElementById("qsSubT");
  const lbl=()=>{sub.textContent=rqText("Quick settings","Ajustes rápidos");cfg.textContent=rqText("⚙ Configure board","⚙ Configurar tablero");
    launch.textContent=rqText("▶ Launch board","▶ Lanzar tablero")};
  lbl();document.getElementById("qsDlg").addEventListener("toggle",lbl);
  new MutationObserver(lbl).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  cfg.onclick=()=>{lbl();menuDlg.classList.add("from-home");launch.hidden=false;document.getElementById("menuBtn").click()};
  menuDlg.addEventListener("close",()=>{menuDlg.classList.remove("from-home");launch.hidden=true});
  launch.onclick=()=>{
    document.getElementById("closeMenu").click();
    if(menuDlg.open)return; /* board editor incomplete: stay in the menu */
    document.getElementById("qsForm").requestSubmit(document.getElementById("qsGo"));
  };
})();
