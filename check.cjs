const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements={};const element=s=>elements[s]??=(s==='#profile'?{options:[{},{}]}:{innerHTML:'',textContent:'',className:'',disabled:false});
const storage={};let queued=null;let context;
context=vm.createContext({console,URL,Date,JSON,Number,String,Math,FormData,alert:()=>{},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},location:{hash:'#home'},window:{BoraAccount:{ready:true,signedIn:true,queue:s=>queued=JSON.parse(JSON.stringify(s)),bind:()=>{},init:()=>{}},addEventListener:()=>{},scrollTo:()=>{}},document:{querySelector:element,querySelectorAll:()=>[]}});
vm.runInContext(fs.readFileSync('dist/app.js','utf8'),context);
const run=s=>vm.runInContext(s,context);
assert.match(element('#app').innerHTML,/Ближе к Бразилии/);
run("Object.assign(user(),{name:'Ана',onboarded:true});save();location.hash='#lesson';render()");
assert.match(element('#app').innerHTML,/Первое «привет»/);
run("user().attempts.push({step:0,correct:true,at:new Date().toISOString()});user().completed=true;save();active='two';location.hash='#progress';render()");
assert.match(element('#app').innerHTML,/Диагностика ещё не пройдена/);
assert.equal(run('user().attempts.length'),0);
run("active='one'");assert.equal(run('user().attempts.length'),1);assert.equal(queued.completed,true);assert.equal(storage['bora.pilot.v1'],undefined);
run("user().name='<script>alert(1)</script>';location.hash='#home';render()");assert.ok(!element('#app').innerHTML.includes('<script>alert'));
for(const r of ['start','diagnosis','lesson','progress','home']){run(`location.hash='#${r}';render()`);assert.ok(element('#app').innerHTML.length>100)}
console.log('PASS: routes, cloud save queue, no browser progress writes, escaped user input. Browser layout and click flows require visual QA.');
