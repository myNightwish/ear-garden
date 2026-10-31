// Records stay on this browser. No practice data is sent to the hosting service.
const RECORD_KEY='ear-garden-records-v1';
let records={topics:{},mistakes:[]},currentReview=null,reviewQueue=[],recordStorageError=false;
try{const saved=JSON.parse(localStorage.getItem(RECORD_KEY));if(saved&&saved.topics&&Array.isArray(saved.mistakes))records=saved}catch{}
const modeNames={match:'找同一个音',direction:'听高低变化',bass:'拆一条低音',chord:'认识和弦性格'};
function topicContext(){const range=['match','bass'].includes(mode)?$('difficulty').value:'all';return {mode,range,register:$('register').value,timbre:$('timbre').value}}
function topicKey(c){return [c.mode,c.range,c.register,c.timbre].join('|')}
function topicLabel(c){const option=Array.from($('difficulty').options).find(o=>o.value===c.range);return modeNames[c.mode]+(option?' · '+option.textContent:'')+' · '+(c.register==='48'?'低音区':'中音区')+' · '+(c.timbre==='pure'?'正弦音':'柔和琴音')}
function answerLabel(m,values,targetNotes){if(!values.length||values.every(n=>n===null||n===undefined))return '未作答';if(m==='direction')return ['更低','相同','更高'][values[0]]||'未作答';if(m==='chord')return values[0]===undefined?'未作答':note(targetNotes[0])+' '+['大三和弦','小三和弦'][values[0]];return values.map(n=>n===null||n===undefined?'?':note(n)).join(' → ')}
function saveRecords(){try{localStorage.setItem(RECORD_KEY,JSON.stringify(records));recordStorageError=false}catch{recordStorageError=true}}
function recordAttempt(revealed,correct,answer){
  const context=(currentReview&&records.mistakes.find(m=>m.id===currentReview)?.context)||topicContext(),key=topicKey(context);
  const topic=records.topics[key]??={context,total:0,correct:0,wrong:0,revealed:0,reviewTotal:0,reviewCorrect:0};
  const result=revealed?'revealed':correct?'correct':'wrong';
  if(currentReview){
    topic.reviewTotal++;if(result==='correct')topic.reviewCorrect++;
    const entry=records.mistakes.find(m=>m.id===currentReview);
    if(entry){entry.reviews++;entry.lastReview=new Date().toISOString();entry.lastReviewResult=result;entry.lastReviewSelection=Array.from({length:answer.length},(_,i)=>selection[i]??null);entry.resolved=result==='correct'}
  }else{
    topic.total++;topic[result]++;
    if(result!=='correct'){
      const id=key+'|'+target.join(',');let entry=records.mistakes.find(m=>m.id===id);
      if(!entry){entry={id,context,target:[...target],answer:[...answer],selection:[],occurrences:0,wrong:0,revealed:0,reviews:0,resolved:false};records.mistakes.push(entry)}
      entry.selection=Array.from({length:answer.length},(_,i)=>selection[i]??null);entry.result=result;entry.occurrences++;entry[result]++;entry.date=new Date().toISOString();entry.resolved=false;
    }
  }
  saveRecords();renderRecords();
}
function pendingMistakes(filter='all'){return records.mistakes.filter(m=>!m.resolved&&(filter==='all'||topicKey(m.context)===filter))}
function startMistake(entry){
  mode=entry.context.mode;$('difficulty').value=entry.context.range==='all'?'3':entry.context.range;$('register').value=entry.context.register;$('timbre').value=entry.context.timbre;
  document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  newQuestion(entry);$('practice-history').open=false;$('play').focus({preventScroll:true});$('title').scrollIntoView({behavior:'smooth',block:'start'});
}
function startReview(entries){reviewQueue=entries.map(e=>e.id);advanceReview()}
function advanceReview(){
  let entry;while(reviewQueue.length&&!entry){const id=reviewQueue.shift();entry=records.mistakes.find(m=>m.id===id)}
  if(entry){startMistake(entry);return}
  newQuestion();$('feedback').textContent='这轮重练已结束。未答对或直接看答案的题仍保留在待复习列表中。';
}
function setupRecordQuestion(entry){
  currentReview=entry?.id||null;
  if(!currentReview)reviewQueue=[];
  if(entry?.id)target=[...entry.target];
  $('review-banner').hidden=!currentReview;
  $('review-banner-text').textContent=currentReview?'错题重练 · 答案已隐藏 · 本题结束后还有 '+reviewQueue.length+' 题':'';
  $('next').textContent=currentReview?'继续重练 →':'下一题 →';renderRecords();
}
function element(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e}
function renderRecords(){
  const context=topicContext(),key=topicKey(context),topic=records.topics[key],pending=pendingMistakes(key).length;
  $('topic-progress').textContent=topic?'本专题：'+topic.correct+' / '+topic.total+' 首次答对 · 答错 '+topic.wrong+' · 看答案 '+topic.revealed+' · 待复习 '+pending:'本专题尚无记录，完成后会自动保存。';
  $('record-storage-note').textContent=recordStorageError?'本次保存失败：浏览器存储不可用或空间不足。当前记录仅在本页保留。':'仅保存在当前浏览器，不跨设备同步。旧版总成绩保留；过去未记录的错题无法补回。';
  const filter=$('record-filter'),old=filter.value||'all';filter.replaceChildren();const all=element('option','全部专题');all.value='all';filter.append(all);
  Object.entries(records.topics).forEach(([id,t])=>{const o=element('option',topicLabel(t.context));o.value=id;filter.append(o)});filter.value=old;if(!filter.value)filter.value='all';
  const selected=filter.value,topics=Object.entries(records.topics).filter(([id])=>selected==='all'||id===selected);
  const table=$('topic-table-body');table.replaceChildren();
  topics.forEach(([,t])=>{const row=element('tr');[topicLabel(t.context),t.total?Math.round(t.correct/t.total*100)+'% ('+t.correct+'/'+t.total+')':'—',String(t.wrong),String(t.revealed),t.reviewCorrect+'/'+t.reviewTotal].forEach(v=>row.append(element('td',v)));table.append(row)});
  $('records-empty').hidden=topics.length>0;
  const pendingAll=pendingMistakes(selected);$('review-mistakes').disabled=!pendingAll.length;$('review-mistakes').textContent='重练待复习题（'+pendingAll.length+'）';
  const list=$('mistake-list');list.replaceChildren();
  const entries=records.mistakes.filter(m=>selected==='all'||topicKey(m.context)===selected).sort((a,b)=>Number(a.resolved)-Number(b.resolved)||b.date.localeCompare(a.date));
  if(!entries.length)list.append(element('p','还没有错题或看答案的记录。','empty-record'));
  entries.forEach(m=>{
    const card=element('article',undefined,'mistake-card');const heading=element('div',undefined,'mistake-heading');
    heading.append(element('strong',topicLabel(m.context)),element('span',m.resolved?'重练已答对':m.result==='revealed'?'看过答案 · 待复习':'答错 · 待复习','record-tag'));
    card.append(heading,element('p','最近初练作答：'+answerLabel(m.context.mode,m.selection,m.target)+'　｜　正确答案：'+answerLabel(m.context.mode,m.answer,m.target)));
    const description=(m.context.mode==='direction'?'题目音符：'+m.target.map(note).join(' → ')+' · ':'')+'答错 '+m.wrong+' 次 · 看答案 '+m.revealed+' 次 · 重练 '+m.reviews+' 次 · '+new Date(m.date).toLocaleString('zh-CN');
    card.append(element('small',description));if(m.lastReviewResult)card.append(element('p','最近重练：'+(m.lastReviewResult==='revealed'?'直接看答案':answerLabel(m.context.mode,m.lastReviewSelection||[],m.target))+' · '+(m.lastReviewResult==='correct'?'已答对':m.lastReviewResult==='wrong'?'仍需复习':'待复习')));
    const b=element('button','重练这题','quiet');b.onclick=()=>startReview([m]);card.append(b);list.append(card);
  });
  $('history-summary').textContent='练习记录与错题 · '+pendingMistakes().length+' 题待复习';
}
function initRecords(){
  $('record-filter').onchange=renderRecords;
  $('review-mistakes').onclick=()=>startReview(pendingMistakes($('record-filter').value));
  $('exit-review').onclick=()=>newQuestion();
}
