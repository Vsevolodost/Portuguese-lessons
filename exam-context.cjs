const data=require('./dist/exam-data.js');
function oralLesson(stage){if(!Number.isInteger(stage)||stage<0||stage>=data.oral.length)return null;const s=data.oral[stage];return {id:'exam-'+stage,title:s.title,idea:s.topic,examples:[[s.opening,'Вопрос для устной тренировки']],mission:'Веди интервью по теме: '+s.topic+'. Не подсказывай ответы и не исправляй во время беседы.'}}
module.exports={data,oralLesson};
