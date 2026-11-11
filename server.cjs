const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'dist');
const routes={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/style.css':'style.css','/assets/rio.jpg':'assets/rio.jpg','/assets/city.jpg':'assets/city.jpg'};
function createServer(){return http.createServer((req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  let pathname;try{pathname=new URL(req.url,'http://localhost').pathname}catch{res.writeHead(400);return res.end()}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});return res.end()}
  if(pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(req.method==='HEAD'?undefined:JSON.stringify({status:'ok',service:'bora'}))}
  const file=routes[pathname];if(!file){res.writeHead(404);return res.end('Not found')}
  fs.readFile(path.join(root,file),(err,body)=>{if(err){res.writeHead(500);return res.end('Unable to load page')}
    res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.jpg')?'image/jpeg':'text/html; charset=utf-8','Cache-Control':file.endsWith('.jpg')?'public, max-age=86400':'no-cache'});
    res.end(req.method==='HEAD'?undefined:body);
  });
})}
if(require.main===module){const port=Number(process.env.PORT||8041);createServer().listen(port,'0.0.0.0',()=>console.log(`Bora listening on port ${port}`))}
module.exports={createServer};
