const sharp=require('sharp');
const {createClient}=require('@supabase/supabase-js');
const {createSecurity,AuthError,json,readBody}=require('./auth-security.cjs');
const BUCKET='bora-avatars';
async function normalizeImage(value){
 if(typeof value!=='string'||value.length>2800000||!value.length||value.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(value))throw new AuthError(400,'Выбери фотографию JPG, PNG или WebP размером до 2 МБ.');
 const bytes=Buffer.from(value,'base64');if(bytes.length>2097152)throw new AuthError(413,'Файл слишком большой. Выбери другое фото.');
 try{const image=sharp(bytes,{limitInputPixels:16000000,failOn:'error'}),meta=await image.metadata();if(!['jpeg','png','webp'].includes(meta.format)||(meta.pages||1)>1)throw Error('format');return await image.rotate().resize(512,512,{fit:'cover',withoutEnlargement:true}).webp({quality:82}).toBuffer()}catch{throw new AuthError(400,'Не удалось прочитать фото. Выбери обычный JPG, PNG или WebP без анимации.')}
}
function createAvatarHandler({env=process.env,security=createSecurity({env}),clientFactory=createClient}={}){return async(req,res)=>{
 try{
  if(!security.s.enabled||!security.s.ready)throw new AuthError(503,'Загрузка фото пока настраивается.');
  if(!['GET','POST','DELETE'].includes(req.method))throw new AuthError(405,'Неподдерживаемое действие.');
  const i=await security.identify(req);if(i.payload.client_id)throw new AuthError(403,'Фото можно менять только на сайте Bora.');
  const path=i.user.id+'/avatar.webp',client=clientFactory(security.s.supabaseUrl,security.s.supabaseKey,{accessToken:async()=>i.token,auth:{persistSession:false,autoRefreshToken:false}}),storage=client.storage.from(BUCKET);
  if(req.method==='GET'){
   if(new URL(req.url,'https://bora.invalid').searchParams.has('meta')){const r=await security.request('/rest/v1/bora_profiles?user_id=eq.'+i.user.id+'&select=avatar_path,updated_at',{token:i.token});if(!r.ok)throw new AuthError(503,'Не удалось загрузить профиль.');return json(res,200,{avatar:r.data?.[0]?{path:r.data[0].avatar_path,updatedAt:r.data[0].updated_at}:null})}
   const r=await storage.download(path);if(r.error)throw new AuthError(404,'Фото пока не загружено.');
   res.writeHead(200,{'Content-Type':'image/webp','Content-Disposition':'inline; filename="avatar.webp"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Vary':'Cookie, Authorization'});return res.end(Buffer.from(await r.data.arrayBuffer()));
  }
  await security.limited(req,'avatar',i.user.id);
  if(req.method==='DELETE'){
   const r=await storage.remove([path]);if(r.error)throw new AuthError(503,'Не удалось удалить фото. Попробуй ещё раз.');
   const deleted=await security.request('/rest/v1/bora_profiles?user_id=eq.'+i.user.id,{token:i.token,method:'DELETE'});if(!deleted.ok)throw new AuthError(503,'Не удалось обновить профиль.');return json(res,200,{avatar:null});
  }
  const body=await readBody(req,2900000),bytes=await normalizeImage(body?.image),uploaded=await storage.upload(path,bytes,{contentType:'image/webp',upsert:true,cacheControl:'0'});
  if(uploaded.error)throw new AuthError(503,'Не удалось сохранить фото. Попробуй ещё раз.');
  const updatedAt=new Date().toISOString(),saved=await security.request('/rest/v1/bora_profiles',{token:i.token,method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:{user_id:i.user.id,avatar_path:path,updated_at:updatedAt}});
  if(!saved.ok)throw new AuthError(503,'Фото загружено, но профиль не обновился. Повтори загрузку.');
  return json(res,200,{avatar:{path,updatedAt}});
 }catch(e){return json(res,e.status||503,{error:e.status?e.message:'Фотография временно недоступна.'})}
}}
module.exports={createAvatarHandler,normalizeImage};
