const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createServer}=require('./server.cjs');
test('Render health check, static files and request boundaries',async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{const base=`http://127.0.0.1:${server.address().port}`;
    const health=await fetch(base+'/health');assert.equal(health.status,200);assert.equal((await health.json()).status,'ok');
    for(const [route,type] of [['/','text/html'],['/app.js','text/javascript'],['/style.css','text/css'],['/assets/rio.jpg','image/jpeg']]){const r=await fetch(base+route);assert.equal(r.status,200);assert.ok(r.headers.get('content-type').startsWith(type));assert.ok((await r.arrayBuffer()).byteLength>0)}
    assert.equal((await fetch(base+'/server.cjs')).status,404);
    assert.equal((await fetch(base+'/',{method:'POST'})).status,405);
    const head=await fetch(base+'/',{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
  }finally{await new Promise(r=>server.close(r))}
});
