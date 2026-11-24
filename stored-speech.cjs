const fs=require('fs'),path=require('path');const manifest=require('./frontend/src/data/audio.json');
function storedSpeech(text){const item=manifest[text.trim().toLocaleLowerCase('pt-BR')];if(!item||!/^\/assets\/audio\/[a-f0-9]{16}\.mp3$/.test(item.src))return null;try{const buffer=fs.readFileSync(path.join(__dirname,'dist',item.src));return buffer.length>=1000&&buffer.length<=1000000?buffer:null}catch{return null}}
module.exports={storedSpeech};
