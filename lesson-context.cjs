const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');let lessons;
function getLesson(id){if(!lessons){const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'dist/courses-data.js'),'utf8'),ctx);lessons=ctx.window.BoraCourses[0].lessons}const l=lessons.find(l=>l.id===id);return l?{id:l.id,title:l.title,idea:l.idea,examples:l.examples,mission:l.mission}:null}
module.exports={getLesson};
