const crypto=require('node:crypto');
const {AuthError,seal,unseal,cookies,originCheck}=require('./auth-security.cjs');
function createGoogleAuth(security){
 const {s}=security,name=s.production?'__Host-bora_google':'bora_google';
 const pending=(res,value,clear=false)=>res.setHeader('Set-Cookie',`${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear?0:600}${s.production?'; Secure':''}`);
 const callback=s.origin+'/api/auth/google-callback';
 return async function google(req,res,action){
  if(!['google-start','google-callback'].includes(action))return false;
  if(!s.googleReady)throw new AuthError(503,'Вход через Google ещё настраивается. Пока используй почту и пароль.');
  const url=new URL(req.url,s.origin);
  if(action==='google-start'){
   if(req.method!=='POST')throw new AuthError(405,'Используй POST.');
   originCheck(req,s);await security.limited(req,'google-start');
   const verifier=crypto.randomBytes(48).toString('base64url');
   pending(res,seal({verifier,created:Date.now()},s.key));
   const redirect=new URL(s.supabaseUrl+'/auth/v1/authorize');
   redirect.search=new URLSearchParams({provider:'google',redirect_to:callback,code_challenge:crypto.createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'s256',scopes:'openid email profile'}).toString();
   res.writeHead(303,{Location:redirect.href,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end();return true;
  }
  if(req.method!=='GET')throw new AuthError(405,'Используй GET.');
  const clear=()=>pending(res,'',true);
  try{
   const encrypted=cookies(req)[name];if(!encrypted||encrypted.length>2000)throw Error('missing');
   const transaction=unseal(encrypted,s.key),age=Date.now()-transaction.created;
   if(!Number.isFinite(age)||age<0||age>600000||!/^[A-Za-z0-9_-]{64}$/.test(transaction.verifier))throw Error('expired');
   const codes=url.searchParams.getAll('code');
   if(url.searchParams.has('error')||codes.length!==1||!codes[0]||codes[0].length>2048)throw Error('code');
   const result=await security.request('/auth/v1/token?grant_type=pkce',{method:'POST',body:{auth_code:codes[0],code_verifier:transaction.verifier}});
   if(!result.ok||!result.data?.access_token)throw Error('exchange');
   clear();const transactionClear=res.getHeader('Set-Cookie');
   await security.establish(res,result.data);
   res.setHeader('Set-Cookie',[transactionClear,res.getHeader('Set-Cookie')]);
   res.writeHead(303,{Location:s.origin+'/#home','Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end();return true;
  }catch{
   clear();res.writeHead(303,{Location:s.origin+'/#account/login?google_error=1','Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end();return true;
  }
 };
}
module.exports={createGoogleAuth};
