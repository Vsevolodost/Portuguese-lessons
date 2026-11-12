const https=require('node:https'),tls=require('node:tls'),fs=require('node:fs'),path=require('node:path');
// Trust the documented GigaChat CA only for this integration, not globally.
const agent=new https.Agent({keepAlive:true,ca:[...tls.rootCertificates,fs.readFileSync(path.join(__dirname,'certs/russian-trusted-root.pem'),'utf8')]});
function gigaFetch(url,options={}){
 const target=new URL(url);if(!['api.giga.chat','ngw.devices.sberbank.ru'].includes(target.hostname)||target.protocol!=='https:')throw Error('GIGACHAT_UNEXPECTED_HOST');
 return new Promise((resolve,reject)=>{const req=https.request(target,{agent,method:options.method||'GET',headers:options.headers,signal:options.signal},res=>{const chunks=[];let size=0;res.on('data',part=>{size+=part.length;if(size>2_000_000){res.destroy(Error('GIGACHAT_RESPONSE_TOO_LARGE'));return}chunks.push(part)});res.on('error',reject);res.on('end',()=>{const body=Buffer.concat(chunks).toString('utf8');resolve({ok:res.statusCode>=200&&res.statusCode<300,status:res.statusCode,json:async()=>JSON.parse(body)})})});req.on('error',reject);req.end(options.body)});
}
module.exports={gigaFetch};
