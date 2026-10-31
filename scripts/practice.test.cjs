const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const elements=new Map();
const el=id=>{if(!elements.has(id))elements.set(id,{value:id==='round-size'?'10':'',hidden:false,textContent:'',focus(){},click(){this.clicks=(this.clicks||0)+1}});return elements.get(id)};
const context={$:el,console,Math};vm.createContext(context);
vm.runInContext(`let mode='match',pool=[60,62,64],selection=[],slot=0,done=false,currentReview=null;
let plays=0,renders=0;function play(){plays++}function render(){renders++}
function topicKey(c){return c}function topicContext(){return mode+'|'+pool.join(',')}
function chord(i){return [60,63+i,67]}`,context);
vm.runInContext(readFileSync('dist/practice.js','utf8'),context);
const run=s=>vm.runInContext(s,context);
for(const mode of ['match','bass','chord','direction']){
  run(`mode='${mode}';practiceDecks.clear();lastTargets.clear()`);
  let previous='';
  for(let i=0;i<150;i++){
    const result=JSON.stringify(run('makePracticeTarget(60,pool)'));
    assert.notEqual(result,previous,mode+' must not repeat across deck boundaries');previous=result;
  }
}
run("mode='bass';selection=[];slot=0;done=false;selectPracticeAnswer(0)");
assert.equal(run('slot'),1);run('selectPracticeAnswer(1)');assert.equal(run('slot'),2);
run('selectPracticeAnswer(2)');assert.deepEqual(Array.from(run('selection')),[60,62,64]);
run('slot=0;selectPracticeAnswer(2)');assert.deepEqual(Array.from(run('selection')),[64,62,64],'can edit a filled slot');
run('selection=[];slot=0;selectPracticeAnswer(1,true)');assert.equal(run('selection.length'),0,'preview never selects');
run('beginPracticeQuestion(false,false)');
for(let i=0;i<10;i++)run('done=true;completePracticeQuestion(false,true)');
assert.equal(run('roundState.completed'),10);assert.equal(el('round-summary').hidden,false);assert.equal(el('next').textContent,'开始新一轮 →');
run('done=false;beginPracticeQuestion(false,false)');assert.equal(run('roundState.completed'),0);
run('currentReview="id";completePracticeQuestion(false,true)');assert.equal(run('roundState.completed'),0,'reviews do not affect normal round');
function event(props={}){return {key:'1',code:'Digit1',target:{closest:()=>null},preventDefault(){this.prevented=true},...props}}
context.event=event({repeat:true});run('mode="match";selection=[];currentReview=null;handlePracticeKey(event)');assert.equal(run('selection.length'),0,'held key ignored');
context.event=event({target:{closest:()=>({})}});run('handlePracticeKey(event)');assert.equal(run('selection.length'),0,'form controls ignored');
context.event=event({shiftKey:true});run('handlePracticeKey(event)');assert.equal(run('selection.length'),0,'shift previews');
context.event=event();run('handlePracticeKey(event)');assert.equal(run('selection[0]'),60);
context.event=event({key:' ',code:'Space'});run('handlePracticeKey(event)');assert.equal(el('play').clicks,1);
console.log('PASS: all-mode non-repetition, bass auto-fill/edit/preview, round completion/reset, review isolation, keyboard guards');
