// Smooth switches: some panels (Edit board, category pool) redraw themselves when a switch is toggled,
// which replaces the element and cancels its animation. After the redraw we replay the move from the old state.
(function(){
  const menu=document.querySelector("#menuDlg .menu");if(!menu)return;
  let rec=null,timer=0;
  const boxes=p=>[...p.querySelectorAll('input[type=checkbox]')];
  menu.addEventListener("change",e=>{
    const t=e.target;if(!t||t.type!=="checkbox")return;
    const panel=t.closest(".panel");if(!panel)return;
    rec={panel,id:t.id||"",idx:boxes(panel).indexOf(t),state:t.checked,el:t};
    clearTimeout(timer);timer=setTimeout(()=>{rec=null},800);
  },true);
  new MutationObserver(()=>{
    if(!rec)return;
    const r=rec;
    const el=r.id?document.getElementById(r.id):boxes(r.panel)[r.idx];
    if(!el||el===r.el||el.checked!==r.state)return;
    rec=null;
    el.checked=!r.state;void el.offsetWidth;
    requestAnimationFrame(()=>{el.checked=r.state});
  }).observe(menu,{childList:true,subtree:true});
})();
