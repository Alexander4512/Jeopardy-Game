// Action log helpers
function logPerk(idx,kind,note){
  hist.push({team:idx,name:nm(idx),color:teamColor(idx),cat:"",pts:0,q:"",outcome:kind,delta:0,note:note||""});
}
function logManual(idx,delta){
  hist.push({team:idx,name:nm(idx),color:teamColor(idx),cat:"",pts:0,q:"",outcome:"manual",delta:delta});
}
function logAct(outcome,delta,idx,note){
  if(!current)return;
  if(idx===undefined)idx=current.turn;
  const cl=clueOf();
  hist.push({team:idx,name:nm(idx),color:teamColor(idx),cat:board[current.ci].cat,pts:cl.pts,q:cl.q,outcome:outcome,delta:delta||0,note:note||""});
}
