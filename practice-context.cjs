const {loadLearner}=require('./gemini-live.cjs');
function summarize(state,lessonId){const r=state.v2?.lessons?.[lessonId];return {goal:String(state.goal||'Общение с бразильцами').slice(0,200),experience:String(state.experience||'С нуля').slice(0,100),lessonMistakes:Object.entries(r?.answers||{}).filter(([,a])=>a&&a.firstCorrect===false).slice(-5).map(([step,a])=>({step:String(step).slice(0,64),answer:String(a.value??'').slice(0,180),corrected:a.correct===true})),completed:!!r?.completedAt}}
async function practiceContext(req,lessonId,{env=process.env,loadState=r=>loadLearner(r,{env})}={}){if(!req.boraIdentity)return null;return summarize(await loadState(req),lessonId)}
module.exports={practiceContext,summarize};
