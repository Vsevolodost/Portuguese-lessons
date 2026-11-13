const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {searchKnowledge}=require('./knowledge.cjs');
const {createChatHandler}=require('./chat-api.cjs');
const {serveAudio}=require('./audio-server.cjs');
const defaultPublicConfig=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'supabase-public.json'),'utf8').replace(/^\uFEFF/,''));
const root=path.join(__dirname,'dist');
const routes={'/':'index.html','/index.html':'index.html','/account.js':'account.js','/supabase-vendor.js':'supabase-vendor.js','/app.js':'app.js','/assistant.js':'assistant.js','/audio.js':'audio.js','/audio-manifest.js':'audio-manifest.js','/courses.js':'courses.js','/courses-data.js':'courses-data.js','/placement.js':'placement.js','/practice.js':'practice.js','/live-practice.js':'live-practice.js','/live-audio.js':'live-audio.js','/live-mic-worklet.js':'live-mic-worklet.js','/gemini-vendor.js':'gemini-vendor.js','/speech-recorder.js':'speech-recorder.js','/style.css':'style.css','/assets/rio.jpg':'assets/rio.jpg','/assets/city.jpg':'assets/city.jpg'};
function createServer(options={}){const chat=createChatHandler({limiter:require('./shared-limiter.cjs').createSharedLimiter(),...options});return http.createServer((req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  let pathname;try{pathname=new URL(req.url,'http://localhost').pathname}catch{res.writeHead(400);return res.end()}
  if(pathname==='/api/live-session')return void require('./gemini-live.cjs').createLiveSessionHandler({env:options.env||process.env})(req,res);
  if(pathname==='/api/chat')return void chat(req,res);
  if(pathname==='/api/transcribe')return void require('./transcribe-api.cjs').createTranscribeHandler({env:options.env||process.env})(req,res);
  if(pathname==='/api/speech')return void require('./speech-api.cjs').createSpeechHandler({env:options.env||process.env})(req,res);
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end()}
  if(serveAudio(req,res,pathname))return;
  if(pathname==='/api/knowledge'){
    const params=new URL(req.url,'http://localhost').searchParams,query=(params.get('q')||'').trim(),language=params.get('language')||'pt-BR';
    if(!query||query.length>500||!['pt-BR','en'].includes(language)){res.writeHead(400,{'Content-Type':'application/json'});return res.end(JSON.stringify({error:'Use q (1–500 characters) and language pt-BR or en'}))}
    const result=searchKnowledge(query,language);res.writeHead(result.available?200:503,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(req.method==='HEAD'?undefined:JSON.stringify(result));
  }
  if(pathname==='/api/config'){const env=options.env||process.env;res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(req.method==='HEAD'?undefined:JSON.stringify(require('./public-config.cjs').publicConfig(env)))}
  if(pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(req.method==='HEAD'?undefined:JSON.stringify({status:'ok',service:'bora'}))}
  const file=routes[pathname];if(!file){res.writeHead(404);return res.end('Not found')}
  fs.readFile(path.join(root,file),(err,body)=>{if(err){res.writeHead(500);return res.end('Unable to load page')}
    res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.jpg')?'image/jpeg':'text/html; charset=utf-8','Cache-Control':file.endsWith('.jpg')?'public, max-age=86400':'no-cache'});
    res.end(req.method==='HEAD'?undefined:body);
  });
})}
if(require.main===module){const port=Number(process.env.PORT||8041);createServer().listen(port,'0.0.0.0',()=>console.log(`Bora listening on port ${port}`))}
module.exports={createServer};
