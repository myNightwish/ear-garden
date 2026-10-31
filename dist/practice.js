let roundState=null;
const practiceDecks=new Map(),lastTargets=new Map();
function makePracticeTarget(base,notes){
  const key=topicKey(topicContext());let deck=practiceDecks.get(key);
  if(!deck?.length){
    deck=[];
    if(mode==='match')notes.forEach(n=>deck.push([n]));
    else if(mode==='bass')notes.forEach(a=>notes.forEach(b=>notes.forEach(c=>deck.push([a,b,c]))));
    else if(mode==='chord')for(let i=0;i<5;i++)for(let kind=0;kind<2;kind++)deck.push([base+i,kind]);
    else for(let i=0;i<8;i++)[-7,-4,-2,0,2,4,7].forEach(d=>deck.push([base+i,base+i+d]));
    for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}
    if(deck.length>1&&JSON.stringify(deck[0])===lastTargets.get(key)){
      const i=deck.findIndex(t=>JSON.stringify(t)!==lastTargets.get(key));[deck[0],deck[i]]=[deck[i],deck[0]];
    }
    practiceDecks.set(key,deck);
  }
  const next=deck.shift();lastTargets.set(key,JSON.stringify(next));return [...next];
}
function beginPracticeQuestion(isReview,continueRound){
  if(!isReview&&(!continueRound||!roundState))roundState={total:+$('round-size').value,completed:0,correct:0,revealed:0};
  $('round-progress').hidden=isReview;$('round-summary').hidden=true;
  $('round-size').disabled=isReview;
  if(isReview){$('question-no').textContent='错题重练'}else updateRoundProgress();
  updateShortcutHint();
}
function updateRoundProgress(){
  if(!roundState)return;
  const r=roundState;$('round-count').textContent='已完成 '+r.completed+' / '+r.total+' 题';
  $('round-score').textContent='答对 '+r.correct+' · 答错 '+(r.completed-r.correct-r.revealed)+' · 看答案 '+r.revealed;
  $('round-bar').max=r.total;$('round-bar').value=r.completed;
  $('question-no').textContent='第 '+Math.min(r.completed+(done?0:1),r.total)+' / '+r.total+' 题';
}
function completePracticeQuestion(revealed,correct){
  if(currentReview)return;
  roundState.completed++;if(revealed)roundState.revealed++;else if(correct)roundState.correct++;
  updateRoundProgress();
  if(roundState.completed===roundState.total){
    const r=roundState;$('round-summary').hidden=false;$('round-summary').textContent='本轮完成！'+r.total+' 题中答对 '+r.correct+' 题，答错 '+(r.completed-r.correct-r.revealed)+' 题，看答案 '+r.revealed+' 题。可以再练一轮，或到下方「练习记录与错题」复习。';
    $('next').textContent='开始新一轮 →';
  }
}
function nextPracticeQuestion(){
  if(currentReview){advanceReview();return}
  newQuestion(null,!!roundState&&roundState.completed<roundState.total);
}
function selectPracticeAnswer(index,preview=false){
  if(index<0)return;
  if(mode==='match'||mode==='bass'){
    if(index>=pool.length)return;
    if(preview){play([pool[index]]);return}
    if(done)return;
    selection[slot]=pool[index];play([pool[index]]);
    if(mode==='bass'){
      const empty=Array.from({length:3},(_,i)=>(slot+i+1)%3).find(i=>selection[i]===undefined);
      if(empty!==undefined)slot=empty;
    }
  }else{
    if(index>=(mode==='chord'?2:3))return;
    if(preview){if(mode==='chord')play(chord(index),true);return}
    if(done)return;selection[0]=index;
  }
  render();$('submit').focus({preventScroll:true});
}
function updateShortcutHint(){
  const count=['match','bass'].includes(mode)?pool.length:mode==='chord'?2:3;
  const keys=count>9?'1–9、0、-、=':'1–'+count;
  $('shortcut-hint').textContent='空格：重听目标 · '+keys+'：选答案 · Shift + 对应键：仅试听 · Enter：确认 / 下一题'+(mode==='bass'?' · ← →：切换音位':'')+' · 选项从左到右编号';
}
function handlePracticeKey(e){
  if(e.isComposing||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
  if(e.target?.closest?.('input,select,textarea,[contenteditable="true"],summary,#practice-history,#exit-review,#review'))return;
  if(e.key==='Enter'&&e.target?.closest?.('button')&&!e.target.closest('.practice'))return;
  if(e.key===' '||e.code==='Space'){e.preventDefault();$('play').click();return}
  if(e.key==='Enter'){e.preventDefault();done?nextPracticeQuestion():finish();return}
  if(mode==='bass'&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();slot=(slot+(e.key==='ArrowRight'?1:2))%3;render();return}
  let index=-1;
  if(/^Digit[0-9]$/.test(e.code))index=e.code==='Digit0'?9:Number(e.code.slice(-1))-1;
  else if(/^Numpad[0-9]$/.test(e.code))index=e.code==='Numpad0'?9:Number(e.code.slice(-1))-1;
  else if(e.code==='Minus')index=10;else if(e.code==='Equal')index=11;
  else index='1234567890-='.indexOf(e.key);
  if(index<0)return;
  e.preventDefault();selectPracticeAnswer(index,e.shiftKey);
}
function initPractice(){
  $('round-size').onchange=()=>newQuestion();
  document.addEventListener('keydown',handlePracticeKey);
  $('play').setAttribute('aria-keyshortcuts','Space');$('submit').setAttribute('aria-keyshortcuts','Enter');$('next').setAttribute('aria-keyshortcuts','Enter');
}
