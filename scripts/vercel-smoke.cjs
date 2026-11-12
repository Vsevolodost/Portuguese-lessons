const assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
const {publicConfig}=require('../public-config.cjs');
(async()=>{const base=process.env.BORA_SITE_URL||'https://portuguese-lessons.vercel.app',config=publicConfig();
for(const path of ['/','/health','/api/config','/api/knowledge?q=saudacao']){const r=await fetch(base+path);assert.equal(r.status,200,path);console.log('PASS',path)}
const c=createClient(config.supabaseUrl,config.supabaseKey,{auth:{persistSession:false,autoRefreshToken:false}});
const login=await c.auth.signInWithPassword({email:process.env.BORA_TEST_EMAIL,password:process.env.BORA_TEST_PASSWORD});assert.ifError(login.error);
const token=login.data.session.access_token;
const progress=await c.from('bora_progress').select('revision').eq('user_id',login.data.user.id).single();assert.ifError(progress.error);console.log('PASS existing account and cloud progress');
const headers={'Content-Type':'application/json','x-pilot-code':process.env.BORA_PILOT_CODE};
const denied=await fetch(base+'/api/chat',{method:'POST',headers,body:JSON.stringify({question:'Oi'})});assert.equal(denied.status,401);console.log('PASS anonymous chat denied');
const r=await fetch(base+'/api/chat',{method:'POST',headers:{...headers,Authorization:'Bearer '+token},body:JSON.stringify({question:'Объясни по-русски разницу между ser и estar в бразильском португальском. Дай два коротких примера.',language:'pt-BR'}),signal:AbortSignal.timeout(220000)});const body=await r.json();assert.equal(r.status,200,JSON.stringify(body));assert.ok(body.answer?.length>20,JSON.stringify(body));console.log('PASS real GigaChat response with RAG',JSON.stringify(body));
await c.auth.signOut({scope:'local'});
})().catch(e=>{console.error(e.message);process.exitCode=1});
