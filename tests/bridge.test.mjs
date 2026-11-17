import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';

test('remote bridge requires trusted origin and a paired token; paid calls remain gated',async()=>{
 process.env.SCENE_ROOM_BRIDGE_ENABLED='1';
 process.env.SCENE_ROOM_BRIDGE_ORIGIN='https://aiverse-filmmakers.github.io';
 process.env.SCENE_ROOM_ALLOW_GENERATION='0';
 process.env.SCENE_ROOM_ALLOW_PAID_AI='0';
 const {handleApi}=await import('../api.mjs?bridge-test');
 const server=createServer((req,res)=>{void handleApi(req,res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  const origin='https://aiverse-filmmakers.github.io';
  const preflight=await fetch(base+'/api/status',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Private-Network':'true'}});
  assert.equal(preflight.status,204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Private-Network'),'true');
  const blocked=await fetch(base+'/api/status',{headers:{Origin:'https://untrusted.invalid'}});
  assert.equal(blocked.status,403);
  const denied=await fetch(base+'/api/status',{headers:{Origin:origin}});
  assert.equal(denied.status,401);
  const code=readFileSync(new URL('../artifacts/service/pair-code',import.meta.url),'utf8').trim();
  assert.match(code,/^[0-9A-F]{12}$/);
  const bad=await fetch(base+'/api/bridge/pair',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({code:'NOTTHECODE00'})});
  assert.equal(bad.status,403);
  const paired=await fetch(base+'/api/bridge/pair',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({code})});
  assert.equal(paired.status,200);
  const {token}=await paired.json();assert.match(token,/^[0-9a-f]{64}$/);
  const ok=await fetch(base+'/api/status',{headers:{Origin:origin,'X-Scene-Room-Token':token}});
  assert.equal(ok.status,200);
  const status=await ok.json();assert.equal(status.generationEnabled,false);
  const paid=await fetch(base+'/api/generation/jobs',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Scene-Room-Token':token},body:'{}'});
  assert.equal(paid.status,403);
 }finally{await new Promise((resolve,reject)=>server.close(err=>err?reject(err):resolve()));}
});
