const config=require('./public-config.cjs').publicConfig();
function createSharedLimiter({env=process.env,fetchImpl=fetch,purpose='chat'}={}){
 const prefix=purpose==='speech'?'bora_speech':'bora_chat';
 const base=env.SUPABASE_URL||config.supabaseUrl,key=env.SUPABASE_PUBLISHABLE_KEY||config.supabaseKey;
 return {async acquire(req){const authorization=String(req.headers.authorization||'');if(!/^Bearer [^\s]+$/.test(authorization))return {status:401,error:'Войди в аккаунт, чтобы пользоваться помощником.'};
 const call=async(name,body)=>fetchImpl(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:authorization,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
 try{const r=await call(prefix+'_acquire',{});if([401,403].includes(r.status))return {status:401,error:'Сессия истекла. Войди в аккаунт снова.'};if(!r.ok)return {status:503,error:'Не удалось проверить лимит запросов. Попробуй позже.'};const v=await r.json();if(!v.allowed)return {status:429,error:v.reason==='minute'?'Слишком много запросов за минуту. Подожди минуту и попробуй снова.':v.reason==='daily'?'Дневной лимит исчерпан. Он обновится в 03:00 по Москве.':v.reason==='concurrent'?'Помощник занят другим запросом. Попробуй через несколько секунд.':'Достигнут лимит запросов. Попробуй позже.'};if(!v.id)return {status:503,error:'Не удалось проверить лимит запросов.'};return {release:async()=>{try{await call(prefix+'_release',{p_id:v.id})}catch{console.error('Quota lease release unavailable')}}}}catch{return {status:503,error:'Не удалось проверить лимит запросов. Попробуй позже.'}}
 }};
}
module.exports={createSharedLimiter};
