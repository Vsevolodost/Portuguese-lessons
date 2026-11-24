const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const files=['courses-data','audio-manifest','audio','study-tools','lesson-photos','lesson-content','learning-kit','dictionary','lessons','comfort','ui','courses','placement','exam-data','lesson-tests','assessments','beginner-course','beginner-audio'];
function setup(id='oi',user={}){
  const nodes={},groups={},ctx={window:{scrollTo(){},BoraAccount:{signedIn:true}},location:{hash:'#courses/pt/'+id},Date,URL,URLSearchParams,crypto:require('node:crypto').webcrypto,document:{querySelector:s=>nodes[s]||null,querySelectorAll:s=>groups[s]||[]}};
  vm.createContext(ctx);files.forEach(f=>vm.runInContext(fs.readFileSync('dist/'+f+'.js','utf8'),ctx,{filename:f+'.js'}));
  const api=ctx.window.BoraLessons;let snapshot;
  function render(){const html=ctx.location.hash.startsWith('#test/')?ctx.window.BoraAssess.page(user):api.page(user);Object.keys(nodes).forEach(k=>delete nodes[k]);Object.keys(groups).forEach(k=>delete groups[k]);
    for(const m of html.matchAll(/id="([^"]+)"/g))nodes['#'+m[1]]={value:'',disabled:new RegExp('id="'+m[1]+'"[^>]*disabled').test(html),textContent:''};
    groups['[data-guided-choice]']=[...html.matchAll(/data-guided-choice="(\d+)"( disabled)?/g)].map(m=>({dataset:{guidedChoice:m[1]},disabled:!!m[2]}));
    groups['[data-guided-token]']=[...html.matchAll(/data-guided-token="(\d+)"/g)].map(m=>({dataset:{guidedToken:m[1]}}));
    groups['[data-writing-check]']=[0,1,2].map(n=>({checked:false,dataset:{writingCheck:String(n)}}));
    groups['[data-guided-resume]']=[...html.matchAll(/data-guided-resume="(\d+)"/g)].map(m=>({dataset:{guidedResume:m[1]}}));
    const save=()=>snapshot=JSON.parse(JSON.stringify(user));
    if(ctx.location.hash.startsWith('#test/'))ctx.window.BoraAssess.bind(user,save,render);else api.bind(user,save,render);return html;
  }
  function answer(a){if(['choice','listen','read'].includes(a.type))groups['[data-guided-choice]'][a.answer].onclick();else if(a.type==='build'){for(let n=0;n<a.tokens.length;n++)groups['[data-guided-token]'].find(b=>+b.dataset.guidedToken===n).onclick();nodes['#guided-check-build'].onclick();}else if(a.type==='test'){if(a.options)groups['[data-guided-choice]'][a.answer].onclick();else{nodes['#guided-input'].value=a.answer[0];nodes['#guided-test-write'].onsubmit({preventDefault(){}});}}else if(a.type==='write'){nodes['#guided-text'].value='Oi! Eu sou Maria.';nodes['#guided-text'].oninput();groups['[data-writing-check]'].forEach(b=>{b.checked=true;b.onchange();});nodes['#guided-writing'].onsubmit({preventDefault(){}});}}
  return {ctx,user,api,nodes,groups,render,answer,saved:()=>snapshot};
}
test('The shipped script order installs eight gradual foundations, preserves other topic IDs and groups the catalog',()=>{
  const x=setup(),w=x.ctx.window,all=w.BoraCourses[0].lessons,ids=all.map(l=>l.id);
  assert.deepEqual(Array.from(ids.slice(0,8)),['oi','bem','voce','saudacoes','nome','chama','repetir','primeiro-dialogo']);assert.equal(all.length,36);assert.equal(new Set(ids).size,36);assert.equal(ids[8],'origem');assert.ok(ids.includes('conversa'));
  const assigned=w.BoraCourses[0].modules.flatMap(m=>m.lessons);assert.equal(assigned.length,36);assert.equal(new Set(assigned).size,36);
  const html=fs.readFileSync('dist/index.html','utf8');let last=-1;for(const file of ['learning-kit','comfort','lesson-tests','beginner-course','beginner-audio','app']){const index=html.indexOf('src="'+file+'.js');assert.ok(index>last,file);last=index;}
  assert.equal(w.BoraBeginner.units.oi.words.length,2);assert.equal(w.BoraBeginner.units['primeiro-dialogo'].words.length,0);
});
test('All required dialogue, build and answer words are taught before use; each hint belongs to its task',()=>{
  const x=setup(),w=x.ctx.window,normalize=w.BoraLessons.norm;
  for(const u of Object.values(w.BoraBeginner.units)){
    const known=new Set([...u.dictionary,...u.parts].flatMap(([pt])=>normalize(pt).split(' ')).concat(['ana','paulo']));
    const texts=[...u.dialogue.map(row=>row[1]),...u.practice.flatMap(a=>a.text?[a.text]:a.type==='build'?[a.answer]:[]),...u.tests.filter(q=>q.type==='short').flatMap(q=>q.answer)];
    for(const text of texts)for(const word of normalize(text).split(' '))assert.ok(known.has(word),u.id+': unexplained '+word);
    assert.ok(u.rule.length>100&&u.help.length>50);assert.ok(!/cidade|montanha/.test(u.dictionary.map(w=>w[0]).join(' ')));
  }
});
test('First lessons avoid mandatory pictures, spelling puzzles and free essays; eight units have tailored lengths',()=>{
  const x=setup(),w=x.ctx.window,lengths=new Set();for(const l of w.BoraCourses[0].lessons.slice(0,8)){const steps=x.api.activities(l);lengths.add(steps.length);assert.ok(!steps.some(a=>a.type==='photo'));assert.ok(!steps.some(a=>a.title==='Верни букву'));assert.equal(steps.filter(a=>a.type==='test').length,w.BoraBeginner.units[l.id].tests.length);}
  assert.ok(lengths.size>=2);assert.ok(!x.api.activities(w.BoraCourses[0].lessons[0]).some(a=>a.type==='write'));assert.match(x.render(),/Ничего угадывать не нужно/);
});
test('All eight journeys finish and advance with exact stored audio, without requiring an AI or microphone',()=>{
  const x=setup(),w=x.ctx.window;
  for(const l of w.BoraCourses[0].lessons.slice(0,8)){
    x.ctx.location.hash='#courses/pt/'+l.id;x.render();const s=x.user.courseProgress['pt/'+l.id].guided,steps=x.api.activities(l);
    while(s.index<steps.length-1){const a=steps[s.index];if(a.type==='listen'){assert.ok(a.audio,l.id);assert.ok(fs.existsSync('dist'+a.audio.src));}x.answer(a);assert.equal(x.nodes['#guided-next'].disabled,false,l.id+' '+a.type);x.nodes['#guided-next'].onclick();}
    assert.ok(s.finishedAt);assert.equal(s.testResult.correct,s.testResult.total);assert.equal(w.BoraBeginner.complete(x.user,l),true);assert.match(x.render(),/Следующее занятие/);
    const index=w.BoraCourses[0].lessons.indexOf(l);assert.equal(w.BoraStudy.next(x.user).id,w.BoraCourses[0].lessons[index+1].id);
  }
  assert.ok(x.saved().courseProgress['pt/primeiro-dialogo'].guided.finishedAt);
});
test('Old completion, answers, notes and in-progress drafts are archived rather than assigned to different steps',()=>{
  const old={version:1,index:10,answers:{3:{answer:0,passed:true}},drafts:{10:'Meu texto'},tokens:[],finishedAt:'2026-11-01T10:00:00Z'},user={courseProgress:{'pt/oi':{done:true,note:'Legacy note',correct:9,answers:{1:{passed:true}},guided:old}},vocabulary:{'oi:oi':{saved:true}}},x=setup('oi',user);
  assert.equal(x.ctx.window.BoraBeginner.complete(user,x.ctx.window.BoraCourses[0].lessons[0]),false);assert.match(x.render(),/Прежние результаты сохранены/);
  const r=user.courseProgress['pt/oi'];assert.equal(r.guidedArchive['1'],old);assert.equal(r.guidedArchive['1'].drafts[10],'Meu texto');assert.equal(r.note,'Legacy note');assert.equal(r.correct,9);assert.equal(r.answers[1].passed,true);assert.equal(r.guided.index,0);assert.equal(r.guided.version,2);assert.equal(user.vocabulary['oi:oi'].saved,true);
  r.guided.index=5;const restored=JSON.parse(JSON.stringify(user)),y=setup('oi',restored);y.render();assert.equal(restored.courseProgress['pt/oi'].guided.index,5);
});
test('Errors are retryable; skipping and returning do not trap completion or claim a successful check',()=>{
  const x=setup(),l=x.ctx.window.BoraCourses[0].lessons[0];x.render();const s=x.user.courseProgress['pt/oi'].guided,steps=x.api.activities(l);s.index=steps.findIndex(a=>a.type==='choice');x.render();const a=steps[s.index];x.groups['[data-guided-choice]'][1-a.answer].onclick();assert.equal(x.nodes['#guided-next'].disabled,true);assert.match(x.render(),/answer-wrong/);x.groups['[data-guided-choice]'][a.answer].onclick();assert.match(x.render(),/answer-correct/);
  const skipped=steps.findIndex(a=>a.type==='listen');s.index=skipped;x.render();x.nodes['#guided-skip'].onclick();while(s.index<steps.length-1){x.nodes['#guided-skip']?x.nodes['#guided-skip'].onclick():x.nodes['#guided-next'].onclick();}
  assert.equal(s.testResult.correct,0);assert.match(x.render(),/Отложенные задания/);x.groups['[data-guided-resume]'].find(b=>+b.dataset.guidedResume===skipped).onclick();assert.equal(s.index,skipped);x.answer(steps[skipped]);assert.equal(s.skipped[skipped],undefined);
});
test('Standalone short quizzes finish after their actual question count and restart stale drafts safely',()=>{
  const user={assessment:{lessonTests:{oi:{history:[],draft:{id:'old',index:4,answers:{'oi-4':'amanha'}}}}}},x=setup('oi',user);x.ctx.location.hash='#test/oi';assert.match(x.render(),/3 задания/);assert.ok(user.assessment.lessonTests.oi.draftArchive['1']);x.nodes['#test-start'].onclick();for(let n=0;n<3;n++)x.nodes['#test-unknown'].onclick();assert.equal(user.assessment.lessonTests.oi.draft,null);assert.equal(user.assessment.lessonTests.oi.last.total,3);assert.equal(user.assessment.lessonTests.oi.last.correct,0);
});
test('Dictionary, previews and real progress handle 36 lessons and do not mark legacy completion as new mastery',()=>{
  const x=setup('oi',{courseProgress:{'pt/oi':{done:true,guided:{version:1,index:18,finishedAt:'old'}}}}),w=x.ctx.window;x.ctx.location.hash='#unit/bem';assert.match(w.BoraKit.preview(x.user),/Как дела|Спро/);assert.ok(!w.BoraKit.preview(x.user).includes('мини-текст'));
  const pool=w.BoraDictionary.pool(x.user);assert.ok(pool.some(word=>word.lessons.includes('repetir')));assert.ok(pool.filter(word=>word.lessons.includes('saudacoes')).every(word=>word.level==='easy'));
  assert.match(w.BoraKit.results(x.user),/из 36/);assert.equal(w.BoraLearning.summary(x.user)[0].done,0);assert.equal(w.BoraUI.filterLessons(w.BoraCourses[0].lessons,x.user.courseProgress,{status:'done'}).length,0);assert.equal(w.BoraStudy.next(x.user).id,'oi');
});
test('Audio distinguishes question and answer intonation, preserves audio provenance without technical button captions, and serves every taught phrase',()=>{
  const w=setup().ctx.window;assert.notEqual(w.BoraAudioExact['tudo bem?'].id,w.BoraAudioExact['tudo bem.'].id);assert.equal(w.BoraAudioExact['bom dia!'].kind,'native');assert.doesNotMatch(w.BoraKit.audio('Oi!'),/Синтез речи/);
  for(const u of Object.values(w.BoraBeginner.units))for(const [,pt]of u.dialogue.map(row=>[row[0],row[1]])){const a=w.BoraAudioExact[pt.toLocaleLowerCase('pt-BR')];assert.ok(a,pt);assert.ok(fs.statSync('dist'+a.src).size>1000);}
});
test('New scripts and exact listening audio are served by the application, including byte ranges',async()=>{
  const server=require('./server.cjs').createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{const base='http://127.0.0.1:'+server.address().port;for(const path of ['/beginner-course.js','/beginner-audio.js']){const response=await fetch(base+path);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/^text\/javascript/);assert.ok((await response.text()).length>1000);}
    const audio=setup().ctx.window.BoraAudioExact['tudo bem?'];const response=await fetch(base+audio.src,{headers:{Range:'bytes=0-127'}});assert.equal(response.status,206);assert.equal((await response.arrayBuffer()).byteLength,128);assert.match(response.headers.get('content-type'),/^audio\/mpeg/);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
test('Catalog distinguishes completed and current lessons; home resumes the actual step without mutating progress',()=>{
  const user={name:'<script>student</script>',currentLesson:'bem',courseProgress:{'pt/oi':{done:true,guided:{version:2,finishedAt:'2026-11-20T12:00:00Z'}},'pt/bem':{guided:{version:2,index:2,answers:{},drafts:{},tokens:[]}}}},x=setup('bem',user),w=x.ctx.window,before=JSON.stringify(user);
  const html=w.BoraUI.catalog(user);assert.equal((html.match(/class="lesson-card is-complete"/g)||[]).length,1);assert.equal((html.match(/class="lesson-card is-current"/g)||[]).length,1);assert.match(html,/class="lesson-card is-current" data-lesson-id="bem"/);assert.ok(!html.includes('is-complete is-current'));
  const home=w.BoraUI.home(user);assert.match(home,/шаг 3 из 11/);assert.match(home,/1 \/ 36 уроков/);assert.match(home,/href="#courses\/pt\/bem"/);assert.match(home,/class="continue-cover"/);assert.ok(!home.includes('<script>student'));assert.equal(JSON.stringify(user),before);
});
