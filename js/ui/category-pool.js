// Category pool and custom categories
function setCats(idxs,on){
  const next=new Set(catOff);
  idxs.forEach(i=>{if(on)next.delete(i);else next.add(i)});
  if(LIB[lang].length-next.size<3){
    if(idxs.length>1&&!on){ // "Disable all": keep the first 3 so random boards still work
      for(let k=0;k<LIB[lang].length&&LIB[lang].length-next.size<3;k++)next.delete(k);
      catOff=next;try{localStorage.setItem("jp-catoff",JSON.stringify(Array.from(catOff)))}catch(e){}
      renderCats();say(document.getElementById("catMsg"),"catsKept3");return}
    say(document.getElementById("catMsg"),"catsMin");renderCats();return}
  catOff=next;
  try{localStorage.setItem("jp-catoff",JSON.stringify(Array.from(catOff)))}catch(e){}
  document.getElementById("catMsg").textContent="";
  renderCats();
}
const POOL_ICONS=["🎮","🔴","⚡","⚽","🎧","🎬","😂","🍻"];
let catForm=null;
function saveCustom(){try{localStorage.setItem("jp-customcats",JSON.stringify(customCats))}catch(e){}try{const dl=document.getElementById("catOpts");dl.textContent="";LIB[lang].forEach(x=>{const o=document.createElement("option");o.value=x.cat;dl.appendChild(o)})}catch(e){}}
function remapLibs(arr,idx){if(!Array.isArray(arr))return;arr.forEach(c=>{if(c&&c.lib!=null){if(c.lib===idx)c.lib=null;else if(c.lib>idx)c.lib--}})}
function deleteCustom(k){
  const idx=BUILTIN_N+k;
  customCats.splice(k,1);syncCustomLib();saveCustom();
  catOff=new Set(Array.from(catOff).filter(x=>x!==idx).map(x=>x>idx?x-1:x));
  try{localStorage.setItem("jp-catoff",JSON.stringify(Array.from(catOff)))}catch(e){}
  remapLibs(board,idx);remapLibs(board2Saved,idx);remapLibs(ed,idx);remapLibs(edStore[1],idx);remapLibs(edStore[2],idx);
  if(board2Saved){try{localStorage.setItem("jp-board2",JSON.stringify(board2Saved))}catch(e){}}
  if(custom){try{localStorage.setItem("jp-board",JSON.stringify(board))}catch(e){}}
  renderBoard();
}
function poolCard(i,opts){
  const c=LIB[lang][i],on=!catOff.has(i);
  const card=document.createElement("div");card.className="poolcard rc"+(i%6)+(on?" on":"");
  const top=document.createElement("div");top.className="pc-top";
  const ic=document.createElement("span");ic.className="pc-ic";ic.textContent=c.custom?"⭐":(POOL_ICONS[i]||"🎲");
  const nm=document.createElement("strong");nm.textContent=c.cat;nm.title=c.cat;
  const sw=document.createElement("label");sw.className="pc-sw";sw.title=rqText("Available in random boards","Disponible en tableros al azar");
  const cb=document.createElement("input");cb.type="checkbox";cb.checked=on;cb.onchange=()=>setCats([i],cb.checked);
  const knob=document.createElement("i");sw.append(cb,knob);
  top.append(ic,nm,sw);
  const meta=document.createElement("small");meta.className="pc-meta";
  meta.textContent=c.qs.length+" "+rqText(c.qs.length===1?"question":"questions",c.qs.length===1?"pregunta":"preguntas")+(c.type!=="normal"?" · "+T("ty_"+c.type).replace(/ \(.*\)/,""):"")+" · "+(on?rqText("Available","Disponible"):rqText("Hidden","Oculta"));
  card.append(top,meta);
  if(opts&&opts.k!=null){
    const act=document.createElement("div");act.className="pc-act";
    const ed1=document.createElement("button");ed1.type="button";ed1.className="ghost";ed1.textContent="✏️ "+rqText("Edit","Editar");ed1.onclick=()=>{openCatForm(opts.k)};
    const del=document.createElement("button");del.type="button";del.className="ghost pc-del";del.textContent="🗑 "+rqText("Delete","Borrar");
    let t;del.onclick=()=>{if(del.dataset.sure){clearTimeout(t);deleteCustom(opts.k);renderCats();return}del.dataset.sure="1";del.textContent=rqText("Click again to delete","Pulsa de nuevo para borrar");t=setTimeout(()=>{delete del.dataset.sure;del.textContent="🗑 "+rqText("Delete","Borrar")},3000)};
    act.append(ed1,del);card.appendChild(act);
  }
  return card;
}
function openCatForm(k){
  const c=k!=null?customCats[k]:null;
  catForm={k:k,name:c?c.cat:"",rows:c?c.qs.map(x=>({q:x[0],a:x[1],w:(x[2]||[]).join("; ")})):Array.from({length:5},()=>({q:"",a:"",w:""}))};
  renderCats();
}
function renderCatForm(box){
  const f=catForm,msg=document.getElementById("catMsg");msg.textContent="";
  const wrap=document.createElement("div");wrap.className="catform";
  const h=document.createElement("h4");h.className="subh";h.textContent=f.k!=null?rqText("✏️ Edit category","✏️ Editar categoría"):rqText("＋ New category","＋ Nueva categoría");wrap.appendChild(h);
  const lab=(t,el)=>{const l=document.createElement("label");l.className="lab";const sp=document.createElement("span");sp.textContent=t;l.append(sp,el);return l};
  const nameIn=document.createElement("input");nameIn.type="text";nameIn.value=f.name;nameIn.placeholder=rqText("e.g. Sports, History, Science…","ej. Deportes, Historia, Ciencia…");nameIn.oninput=()=>{f.name=nameIn.value};
  wrap.appendChild(lab(rqText("Category name","Nombre de la categoría"),nameIn));
  const hint=document.createElement("p");hint.className="hint";hint.textContent=rqText("Write one question per row, from easiest (top) to hardest (bottom). The wrong options are optional: they make the question work as multiple choice.","Escribí una pregunta por fila, de la más fácil (arriba) a la más difícil (abajo). Las opciones incorrectas son opcionales: sirven para jugarla como opción múltiple.");wrap.appendChild(hint);
  const list=document.createElement("div");list.className="cf-rows";
  const drawRows=()=>{
    list.textContent="";
    f.rows.forEach((r,i)=>{
      const row=document.createElement("div");row.className="cf-row rc"+(i%6);
      const hd=document.createElement("div");hd.className="qhead";
      const nb=document.createElement("span");nb.className="qnum";const b=document.createElement("b");b.textContent=i+1;nb.append(b,document.createTextNode(rqText("Question ","Pregunta ")+(i+1)));
      hd.appendChild(nb);
      if(f.rows.length>5){const x=document.createElement("button");x.type="button";x.className="ghost";x.textContent="✕ "+rqText("Remove","Quitar");x.onclick=()=>{f.rows.splice(i,1);drawRows()};hd.appendChild(x)}
      const q=document.createElement("input");q.type="text";q.value=r.q;q.oninput=()=>{r.q=q.value};
      const a=document.createElement("input");a.type="text";a.value=r.a;a.oninput=()=>{r.a=a.value};
      const w=document.createElement("input");w.type="text";w.value=r.w;w.placeholder=rqText("Wrong option 1; wrong option 2; …","Opción incorrecta 1; opción incorrecta 2; …");w.oninput=()=>{r.w=w.value};
      row.append(hd,lab(rqText("Question","Pregunta"),q),lab(rqText("Answer","Respuesta"),a),lab(rqText("Wrong options (optional)","Opciones incorrectas (opcional)"),w));
      list.appendChild(row);
    });
    if(f.rows.length<10){const add=document.createElement("button");add.type="button";add.className="addrow";add.textContent="＋ "+rqText("Add question","Agregar pregunta");add.onclick=()=>{f.rows.push({q:"",a:"",w:""});drawRows()};list.appendChild(add)}
  };
  drawRows();wrap.appendChild(list);
  const acts=document.createElement("div");acts.className="actions";
  if(sample){
    const g=document.createElement("button");g.type="button";g.textContent="✨ "+rqText("Write with Claude","Escribir con Claude");
    g.onclick=async()=>{
      if(!f.name.trim()){msg.textContent=rqText("Type the category name first.","Primero escribí el nombre de la categoría.");return}
      g.disabled=true;msg.textContent=rqText("Writing questions…","Escribiendo preguntas…");
      const n=f.rows.length;
      const prompt=["Write "+n+" trivia questions in "+LNAME()+" for the category \""+f.name.trim()+"\", for a family quiz night in Argentina with players aged 15 to 60.",
        "Difficulty must rise smoothly from easy (first) to hard (last). No impossible questions. Each question has one short unambiguous answer. Add 5 plausible wrong options for each (same type as the answer).",
        "Reply with only JSON: [{\"q\":\"question\",\"a\":\"answer\",\"wrong\":[\"w1\",\"w2\",\"w3\",\"w4\",\"w5\"]}] with exactly "+n+" items."].join("\n");
      try{
        const out=await sample.json(prompt,{cache:false});
        if(!Array.isArray(out)||out.length!==n||out.some(o=>!o||typeof o.q!=="string"||typeof o.a!=="string"))throw new Error("shape");
        f.rows=out.map(o=>({q:o.q,a:o.a,w:Array.isArray(o.wrong)?o.wrong.filter(x=>typeof x==="string").join("; "):""}));
        drawRows();msg.textContent=rqText("Done. Review the questions, then save.","Listo. Revisá las preguntas y guardá.");
      }catch(e){msg.textContent=rqText("Couldn't write the questions. Try again or type them.","No se pudieron escribir las preguntas. Probá de nuevo o escribilas vos.")}
      g.disabled=false;
    };
    acts.appendChild(g);
  }
  const save=document.createElement("button");save.type="button";save.textContent=rqText("Save category","Guardar categoría");
  save.onclick=()=>{
    const name=f.name.trim();
    if(!name){msg.textContent=rqText("The category needs a name.","La categoría necesita un nombre.");return}
    const dup=LIB[lang].some((c,i)=>c.cat.trim().toLowerCase()===name.toLowerCase()&&i!==(f.k!=null?BUILTIN_N+f.k:-1));
    if(dup){msg.textContent=rqText("A category with that name already exists.","Ya existe una categoría con ese nombre.");return}
    const rows=f.rows.filter(r=>r.q.trim()||r.a.trim()||r.w.trim());
    if(rows.length<5||rows.some(r=>!r.q.trim()||!r.a.trim())){msg.textContent=rqText("Write at least 5 questions, each with its answer.","Escribí al menos 5 preguntas, cada una con su respuesta.");return}
    const qs=rows.map(r=>{const w=r.w.split(";").map(x=>x.trim()).filter(Boolean);return w.length?[r.q.trim(),r.a.trim(),w]:[r.q.trim(),r.a.trim()]});
    if(f.k!=null)customCats[f.k]={cat:name,qs};else customCats.push({cat:name,qs});
    syncCustomLib();saveCustom();catForm=null;renderCats();
    document.getElementById("catMsg").textContent=rqText("Category saved. Use the ‹ › arrows on the board or type its name in Columns & questions to put it on the board.","Categoría guardada. Usá las flechas ‹ › del tablero o escribí su nombre en Columnas y preguntas para ponerla en el tablero.");
  };
  const cancel=document.createElement("button");cancel.type="button";cancel.className="skip";cancel.textContent=rqText("Cancel","Cancelar");cancel.onclick=()=>{catForm=null;renderCats()};
  acts.append(save,cancel);wrap.appendChild(acts);
  box.appendChild(wrap);
}
function renderCats(){
  const box=document.getElementById("catList");box.textContent="";
  if(catForm){renderCatForm(box);return}
  const total=LIB[lang].length,act=total-catOff.size;
  const sum=document.createElement("div");sum.className="poolsum";
  const t=document.createElement("strong");t.textContent=act+" / "+total+" "+rqText("categories available","categorías disponibles");
  const idxsAll=LIB[lang].map((_,i)=>i),allOn=idxsAll.every(i=>!catOff.has(i));
  const all=document.createElement("button");all.type="button";all.className="ghost";all.textContent=T(allOn?"catsDisableAll":"catsEnableAll");all.onclick=()=>setCats(idxsAll,!allOn);
  sum.append(t,all);box.appendChild(sum);
  const sec=(title,sub)=>{const h=document.createElement("div");h.className="poolh";const a=document.createElement("strong");a.textContent=title;const b=document.createElement("small");b.textContent=sub;h.append(a,b);box.appendChild(h)};
  sec(rqText("Built-in categories","Categorías incluidas"),rqText("Ready to play","Listas para jugar"));
  const g1=document.createElement("div");g1.className="poolgrid";
  for(let i=0;i<BUILTIN_N;i++)g1.appendChild(poolCard(i));
  box.appendChild(g1);
  sec(rqText("My categories","Mis categorías"),rqText("Created by you","Creadas por vos"));
  const g2=document.createElement("div");g2.className="poolgrid";
  customCats.forEach((c,k)=>g2.appendChild(poolCard(BUILTIN_N+k,{k})));
  if(!customCats.length){const e=document.createElement("p");e.className="hint";e.textContent=rqText("You haven't created any categories yet.","Todavía no creaste ninguna categoría.");box.appendChild(e)}
  box.appendChild(g2);
  if(customCats.length<30){const add=document.createElement("button");add.type="button";add.className="addrow";add.textContent="＋ "+rqText("Add new category","Agregar categoría nueva");add.onclick=()=>openCatForm(null);box.appendChild(add)}
}
