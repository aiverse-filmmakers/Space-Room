import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
test('MCP requires pairing, carries image pixels, queues edits for browser approval and allows revocation',async()=>{
 process.env.SCENE_ROOM_OPERATOR_ENABLED='1';
 const {operatorStore}=await import('../operatorStore.mjs');
 const {handleOperatorMcp}=await import('../operatorMcp.mjs');
 const server=createServer((req,res)=>{void handleOperatorMcp(req,res);});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const call=async(body,session)=>{
  const response=await fetch(base+'/mcp',{method:'POST',headers:{'Content-Type':'application/json',...(session?{'Mcp-Session-Id':session}:{})},body:JSON.stringify({jsonrpc:'2.0',id:1,...body})});
  return {response,body:await response.json()};
 };
 try{
  const init=await call({method:'initialize',params:{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'test',version:'1'}}});
  assert.equal(init.response.status,200);
  const session=init.response.headers.get('mcp-session-id');
  assert.match(session,/^[0-9a-f]{64}$/);
  const unpaired=await call({method:'tools/call',params:{name:'read_active_project',arguments:{}}},session);
  assert.equal(unpaired.body.result.isError,true);
  const context={schema:'scene-room.host-context.v1',revision:'rev',scene:{objects:[],references:[{id:'a',name:'flower.png'}]}};
  operatorStore.share({projectId:'flower',context,references:[{id:'a',name:'flower.png',data:'data:image/png;base64,YWJj'}]});
  const wrong=await call({method:'tools/call',params:{name:'pair_space_room',arguments:{code:'AAAAAAAAAAAA'}}},session);
  assert.equal(wrong.body.result.isError,true);
  const code=readFileSync(new URL('../artifacts/service/chatgpt-pair-code',import.meta.url),'utf8').trim();
  const paired=await call({method:'tools/call',params:{name:'pair_space_room',arguments:{code}}},session);
  assert.equal(paired.body.result.isError,false);
  const read=await call({method:'tools/call',params:{name:'read_active_project',arguments:{}}},session);
  assert.match(read.body.result.content[0].text,/"revision":"rev"/);
  const img=await call({method:'tools/call',params:{name:'view_reference_image',arguments:{id:'a'}}},session);
  assert.deepEqual(img.body.result.content[1],{type:'image',data:'YWJj',mimeType:'image/png'});
  const mismatch=await call({method:'tools/call',params:{name:'propose_scene',arguments:{baseRevision:'old',scene:{objects:[]}}}},session);
  assert.equal(mismatch.body.result.isError,true);
  const proposed=await call({method:'tools/call',params:{name:'propose_scene',arguments:{baseRevision:'rev',scene:{objects:[]}}}},session);
  assert.equal(proposed.body.result.isError,false);
  const pending=operatorStore.pending();
  assert.equal(pending.kind,'scene');
  assert.equal(operatorStore.receipt(pending.id).status,'awaiting_approval');
  operatorStore.resolve({id:pending.id,status:'applied',message:'Human approved'});
  const receipt=await call({method:'tools/call',params:{name:'proposal_status',arguments:{id:pending.id}}},session);
  assert.match(receipt.body.result.content[0].text,/Human approved/);
  operatorStore.revoke();
  const after=await call({method:'tools/call',params:{name:'read_active_project',arguments:{}}},session);
  assert.equal(after.body.result.isError,true);
 }finally{operatorStore.revoke();await new Promise(resolve=>server.close(resolve));}
});