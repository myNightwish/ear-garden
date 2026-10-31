const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const elements=new Map();
const $=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:''});return elements.get(id)};
const oscillators=[];
const envelope=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
const audioMock={destination:{},createGain(){return {gain:envelope(),connect(){return this}}},createOscillator(){const o={frequency:{value:0},connect(node){return node},start(){},stop(){}};oscillators.push(o);return o}};
const sandbox={$,audioMock,console,currentReview:null,nextPracticeQuestion(){},renderRecords(){},localStorage:{getItem(){return null}},document:{getElementById:$,body:{classList:{remove(){}}},querySelectorAll(){return []}}};
vm.createContext(sandbox);
const source=readFileSync('dist/app.js','utf8').replace('initRecords();initPractice();newQuestion();','');
vm.runInContext(source,sandbox);
const run=s=>vm.runInContext(s,sandbox);
run('ctx=audioMock');
const expectedHz={48:130.8127826502993,60:261.6255653005986,62:293.6647679174076,64:329.6275569128699,69:440,72:523.2511306011972};
for(const [midi,hz] of Object.entries(expectedHz))for(const timbre of ['pure','soft']){
  $('timbre').value=timbre;oscillators.length=0;run(`tone(${midi},0)`);
  assert.ok(Math.abs(oscillators[0].frequency.value-hz)<1e-9,`${midi} ${timbre} fundamental`);
  assert.equal(oscillators.length,timbre==='pure'?1:2);
  if(timbre==='soft')assert.equal(oscillators[1].frequency.value,oscillators[0].frequency.value*2,'exact octave harmonic');
}
for(const completed of [false,true]){
  run(`target=[60,62,64];selection=[62,60];slot=1;done=${completed};number=7;`);
  const before=run('JSON.stringify({target,selection,slot,done,number})');
  $('timbre').value='pure';$('timbre').onchange();
  assert.equal(run('JSON.stringify({target,selection,slot,done,number})'),before,'switch preserves question/answers/completion');
  $('timbre').value='soft';$('timbre').onchange();
  assert.equal(run('JSON.stringify({target,selection,slot,done,number})'),before);
}
console.log('PASS: standard note frequencies, same fundamental across timbres, octave-only harmonic, timbre switches preserve question and answers');
