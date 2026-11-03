// Save / Load dialog: export or import the game setup as JSON.
(()=>{
const es=()=>lang==="es",L=(a,b)=>es()?b:a;
const btn=document.createElement("button");btn.className="ghost";btn.id="saveLoadBtn";btn.type="button";
document.getElementById("reset").before(btn);
const d=document.createElement("dialog");d.id="slDlg";
d.innerHTML='<div class="card qs" style="max-width:560px"><h2 id="slH"></h2><p id="slP" style="margin:0"></p><textarea id="slTa" rows="8" style="width:100%;font:12px monospace;background:rgba(0,0,0,.25);color:inherit;border:1px solid rgba(255,255,255,.3);border-radius:10px;padding:8px"></textarea><p id="slMsg" role="status" style="margin:0;min-height:1.2em;font-weight:700"></p><div class="actions"><button type="button" id="slDl"></button><button type="button" id="slCp"></button><button type="button" id="slLd"></button><button type="button" id="slFile"></button><button type="button" id="slX" class="skip"></button></div><input type="file" id="slIn" accept=".json,application/json" hidden></div>';
document.body.appendChild(d);
// Optional "save on the server" section, shown only when the Node server is reachable.
const srv=document.createElement("div");srv.id="slSrv";srv.style.cssText="display:none;gap:8px;border-top:1px solid rgba(255,255,255,.25);padding-top:10px";
srv.innerHTML='<strong id="slSrvH"></strong><div class="actions"><input id="slName" type="text" maxlength="60" style="flex:1 1 160px;font:inherit;background:rgba(0,0,0,.25);color:inherit;border:1px solid rgba(255,255,255,.3);border-radius:10px;padding:8px"><button type="button" id="slSrvSave"></button></div><div class="actions"><select id="slSrvList" style="flex:1 1 160px;font:inherit;background:rgba(0,0,0,.25);color:inherit;border:1px solid rgba(255,255,255,.3);border-radius:10px;padding:8px"></select><button type="button" id="slSrvLoad"></button><button type="button" id="slSrvDel" class="skip"></button></div>';
d.querySelector(".card").insertBefore(srv,d.querySelector(".card .actions"));
const $=id=>document.getElementById(id),msg=t=>$("slMsg").textContent=t;
function lbl(){btn.textContent=L("Save / Load","Guardar / Cargar");$("slH").textContent=L("Save or load this game setup","Guardar o cargar esta configuración");
 $("slP").textContent=L("Export copies Board 1, Board 2, your custom categories, team names and difficulty as text you can keep. To load it later, paste it here and press Load.","Exportar genera un texto con el Tablero 1, el Tablero 2, tus categorías propias, los nombres de equipos y la dificultad. Para cargarlo después, pegalo acá y apretá Cargar.");
 $("slDl").textContent=L("Export & download","Exportar y descargar");$("slCp").textContent=L("Copy","Copiar");$("slLd").textContent=L("Load from text","Cargar desde texto");$("slFile").textContent=L("Load from file","Cargar desde archivo");$("slX").textContent=L("Close","Cerrar");
 $("slSrvH").textContent=L("Saved on the server","Guardado en el servidor");$("slName").placeholder=L("Name for this board","Nombre del tablero");
 $("slSrvSave").textContent=L("Save to server","Guardar en el servidor");$("slSrvLoad").textContent=L("Load selected","Cargar elegido");$("slSrvDel").textContent=L("Delete selected","Borrar elegido")}
const snap=()=>JSON.stringify({app:"family-jeopardy",v:2,board:board.filter(c=>!c.virt),board2:board2Saved||null,customCats,diff,teams:teams.map(t=>({name:t.name||null,color:t.color||null}))},null,1);
let serverUp=false;
async function refreshServer(){
 const api=window.jpApi;if(!api){return}
 serverUp=await api.available();srv.style.display=serverUp?"grid":"none";if(!serverUp)return;
 try{const list=await api.list();const sel=$("slSrvList");sel.textContent="";
  list.forEach(b=>{const o=document.createElement("option");o.value=b.id;o.textContent=b.name+" · "+b.updatedAt.slice(0,10);sel.appendChild(o)});
  if(!list.length){const o=document.createElement("option");o.textContent=L("(nothing saved yet)","(todavía no hay nada)");o.value="";sel.appendChild(o)}
 }catch(e){msg(e.message)}
}
btn.onclick=()=>{lbl();$("slTa").value="";msg("");d.showModal();refreshServer()};
$("slX").onclick=()=>d.close();
$("slDl").onclick=async()=>{const t=snap();$("slTa").value=t;
 try{const dl=window.claude&&await claude.use("downloads");
  if(dl){await dl.save({filename:"jeopardy-board.json",data:t});msg(L("Exported.","Exportado."));return}
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t],{type:"application/json"}));a.download="jeopardy-board.json";document.body.appendChild(a);a.click();a.remove();msg(L("Exported. If no file was saved, use Copy.","Exportado. Si no se guardó un archivo, usá Copiar."))
 }catch(e){msg(e&&e.code==="declined"?L("Cancelled. You can still use Copy.","Cancelado. Todavía podés usar Copiar."):L("Use Copy and paste it into a text file.","Usá Copiar y pegalo en un archivo de texto."))}};
$("slCp").onclick=()=>{if(!$("slTa").value)$("slTa").value=snap();$("slTa").select();
 try{navigator.clipboard.writeText($("slTa").value).then(()=>msg(L("Copied.","Copiado.")),()=>{document.execCommand("copy");msg(L("Selected: press Ctrl+C.","Seleccionado: apretá Ctrl+C."))})}catch(e){msg(L("Selected: press Ctrl+C.","Seleccionado: apretá Ctrl+C."))}};
function load(txt){
 try{const o=JSON.parse(txt);if(!o||!validBoard(o.board))throw 0;
  if(Array.isArray(o.customCats)){customCats=o.customCats.filter(c=>c&&typeof c.cat==="string"&&Array.isArray(c.qs)&&c.qs.length>=1&&c.qs.every(x=>Array.isArray(x)&&typeof x[0]==="string"&&typeof x[1]==="string")).slice(0,30);syncCustomLib();try{localStorage.setItem("jp-customcats",JSON.stringify(customCats))}catch(e){}}
  board=o.board;custom=true;try{localStorage.setItem("jp-board",JSON.stringify(board))}catch(e){}
  if(o.board2&&validBoard(o.board2)){board2Saved=o.board2;try{localStorage.setItem("jp-board2",JSON.stringify(board2Saved))}catch(e){}}
  else{board2Saved=null;try{localStorage.removeItem("jp-board2")}catch(e){}}
  edStore={1:null,2:null};ed2Orig="";edWhich=1;
  if(o.diff&&DIFF[o.diff]){diff=o.diff;try{localStorage.setItem("jp-diff2",diff)}catch(e){}}
  if(Array.isArray(o.teams)&&o.teams.length>=2&&o.teams.length<=10){while(teams.length<o.teams.length)teams.push({name:null,score:0});teams=teams.slice(0,o.teams.length);teams.forEach((t,i)=>{t.name=o.teams[i].name;if(o.teams[i].color)t.color=o.teams[i].color});saveTeams()}
  undoStack=[];redoStack=[];newGame();applyLang();d.close()
 }catch(e){msg(L("That text is not a valid board.","Ese texto no es un tablero válido."))}}
$("slLd").onclick=()=>load($("slTa").value);
$("slSrvSave").onclick=async()=>{const name=$("slName").value.trim();if(!name){msg(L("Type a name first.","Escribí un nombre primero."));return}
 try{await window.jpApi.save(name,JSON.parse(snap()));msg(L("Saved on the server.","Guardado en el servidor."));$("slName").value="";refreshServer()}catch(e){msg(e.message)}};
$("slSrvLoad").onclick=async()=>{const id=$("slSrvList").value;if(!id)return;
 try{const rec=await window.jpApi.load(id);load(JSON.stringify(rec.data))}catch(e){msg(e.message)}};
$("slSrvDel").onclick=async()=>{const id=$("slSrvList").value;if(!id)return;
 try{await window.jpApi.remove(id);msg(L("Deleted.","Borrado."));refreshServer()}catch(e){msg(e.message)}};
$("slFile").onclick=()=>$("slIn").click();
$("slIn").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>load(String(r.result));r.readAsText(f);e.target.value=""};
lbl();window.addEventListener("click",()=>setTimeout(lbl,50));
})();
