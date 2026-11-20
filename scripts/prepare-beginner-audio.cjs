// Produce static, explicitly labelled pt-BR synthesis for original foundation texts.
// Existing native recordings are reused; punctuation-sensitive question/answer pairs
// receive separate recordings so their intonation is not collapsed by search keys.
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {synthesize}=require('../speech-api.cjs');
const c={window:{}};vm.createContext(c);
for(const name of ['courses-data','audio-manifest','lesson-content','learning-kit','comfort','lesson-photos','beginner-course'])vm.runInContext(fs.readFileSync('dist/'+name+'.js','utf8'),c);
const norm=s=>s.normalize('NFC').toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
const exact=s=>s.normalize('NFC').toLocaleLowerCase('pt-BR').replace(/\s+/g,' ').trim();
const texts=[...new Set(Object.values(c.window.BoraBeginner.units).flatMap(u=>[...u.words.map(w=>w[0]),...u.parts.filter(([pt])=>/[a-záéêãç]/i.test(pt)&&!['Ana','?'].includes(pt)).map(w=>w[0]),...u.examples.map(w=>w[0]),...u.dialogue.map(w=>w[1]),...u.practice.filter(a=>a.text).map(a=>a.text)]))];
const manifest={},normalized={};
(async()=>{for(const text of texts){const old=c.window.BoraAudioManifest[norm(text)];let item=old&&exact(old.text)===exact(text)?old:null;if(!item){const id=crypto.createHash('sha256').update('foundation-v2:'+text).digest('hex').slice(0,16),src='/assets/audio/'+id+'.mp3',path='dist'+src;if(!fs.existsSync(path))fs.writeFileSync(path,await synthesize(text,{env:{}}));if(fs.statSync(path).size<1000)throw Error('Empty audio: '+text);item={id,text,src,kind:'synthetic',voice:'pt-BR-FranciscaNeural',language:'pt-BR'};}manifest[exact(text)]=item;normalized[norm(text)]??=item;console.log('Ready:',text);}
fs.writeFileSync('dist/beginner-audio.js','// Original foundation phrases. Native records are reused, synthesis is labelled.\nwindow.BoraAudioExact='+JSON.stringify(manifest)+';\nfor(const [key,audio] of Object.entries('+JSON.stringify(normalized)+'))window.BoraAudioManifest[key]??=audio;\n');console.log('Ready:',Object.keys(manifest).length,'phrases');})().catch(e=>{console.error(e.message);process.exitCode=1;});
