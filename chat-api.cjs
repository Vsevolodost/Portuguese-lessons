const {createHash,timingSafeEqual}=require('node:crypto');
const {createTutor}=require('./tutor.cjs');
function createChatHandler({env=process.env,tutor=createTutor(),now=Date.now}={}){
 const attempts=new Map();let day='',daily=0,inflight=0;
 const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value))};
 return async(req,res)=>{
  if(req.method!=='POST')return json(res,405,{error:'Используй POST.'});
  if(!env.GIGACHAT_AUTH_KEY||!env.BORA_PILOT_CODE)return json(res,503,{error:'Помощник пока не настроен.'});
  const supplied=String(req.headers['x-pilot-code']||''),digest=x=>createHash('sha256').update(x).digest();
  if(supplied.length>200||!timingSafeEqual(digest(supplied),digest(env.BORA_PILOT_CODE)))return json(res,401,{error:'Введи код доступа к пилоту.'});
  if(!String(req.headers['content-type']||'').startsWith('application/json'))return json(res,415,{error:'Ожидается JSON.'});
  const timestamp=now(),today=new Date(timestamp).toISOString().slice(0,10);if(day!==today){day=today;daily=0}
  const ip=String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();for(const [k,v]of attempts)if(timestamp-v.start>60000)attempts.delete(k);const bucket=attempts.get(ip)||{start:timestamp,count:0};
  if(bucket.count>=6||daily>=200||inflight>=2)return json(res,429,{error:'Достигнут лимит запросов. Попробуй позже.'});
  let body='',bytes=0;try{const parts=[];for await(const part of req){bytes+=part.length;if(bytes>16000)return json(res,413,{error:'Сообщение слишком длинное.'});parts.push(part)}body=Buffer.concat(parts).toString('utf8')}catch{return json(res,400,{error:'Не удалось прочитать запрос.'})}
  let value;try{value=JSON.parse(body)}catch{return json(res,400,{error:'Некорректный JSON.'})}
  const question=typeof value?.question==='string'?value.question.trim():'',language=value?.language||'pt-BR';if(!question||question.length>1500||!['pt-BR','en'].includes(language))return json(res,400,{error:'Вопрос должен содержать от 1 до 1500 символов.'});
  const history=Array.isArray(value.history)?value.history.slice(-6).filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').map(m=>({role:m.role,content:m.content.slice(0,1800)})):[];
  const learner={};for(const k of ['goal','experience','diagnosis'])if(typeof value.learner?.[k]==='string')learner[k]=value.learner[k].slice(0,350);
  const current=attempts.get(ip)||bucket; if(current.count>=6||daily>=200||inflight>=2)return json(res,429,{error:'Достигнут лимит запросов. Попробуй позже.'}); current.count++;attempts.set(ip,current);daily++;inflight++;
  try{return json(res,200,await tutor({question,language,history,learner}))}catch(e){console.error('Tutor request failed:',/^GIGACHAT_|^KNOWLEDGE_/.test(e.message)?e.message:'UPSTREAM_CONNECTION_ERROR:'+String(e.cause?.code||e.code||e.name).replace(/[^A-Z_a-z0-9]/g,''));return json(res,502,{error:'Помощник временно не отвечает. Твой вопрос сохранён — попробуй ещё раз.'})}finally{inflight--}
 };
}
module.exports={createChatHandler};


