const {randomUUID}=require('node:crypto');
function createGigaClient({fetchImpl=require('./giga-transport.cjs').gigaFetch,env=process.env}={}){
 let token,expires=0,pending;
 async function accessToken(){
  if(token&&Date.now()<expires-60000)return token;if(pending)return pending;
  pending=(async()=>{if(!env.GIGACHAT_AUTH_KEY)throw Error('GIGACHAT_NOT_CONFIGURED');
   const r=await fetchImpl('https://ngw.devices.sberbank.ru:9443/api/v2/oauth',{method:'POST',headers:{Authorization:`Basic ${env.GIGACHAT_AUTH_KEY}`,RqUID:randomUUID(),'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body:new URLSearchParams({scope:env.GIGACHAT_SCOPE||'GIGACHAT_API_PERS'}).toString(),signal:AbortSignal.timeout(25000)});
   if(!r.ok)throw Error(`GIGACHAT_AUTH_${r.status}`);const v=await r.json();if(!v.access_token)throw Error('GIGACHAT_INVALID_TOKEN_RESPONSE');token=v.access_token;expires=Number(v.expires_at);if(expires<1e12)expires*=1000;if(!Number.isFinite(expires))expires=Date.now()+1200000;return token;
  })();try{return await pending}finally{pending=null}
 }
 async function complete(messages,maxTokens=700){for(let attempt=0;attempt<2;attempt++){
  const bearer=await accessToken(),r=await fetchImpl('https://api.giga.chat/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${bearer}`,'Content-Type':'application/json'},body:JSON.stringify({model:env.GIGACHAT_MODEL||'GigaChat-2',messages,temperature:0.25,max_tokens:maxTokens}),signal:AbortSignal.timeout(45000)});
  if(r.status===401&&attempt===0){token=null;continue}if(!r.ok)throw Error(`GIGACHAT_REQUEST_${r.status}`);const v=await r.json(),answer=v.choices?.[0]?.message?.content;if(typeof answer!=='string'||!answer.trim())throw Error('GIGACHAT_EMPTY_RESPONSE');return answer.trim();
 }throw Error('GIGACHAT_AUTH_FAILED')}
 return {complete};
}
module.exports={createGigaClient};


