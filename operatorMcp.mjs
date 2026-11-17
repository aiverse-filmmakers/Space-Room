import {randomBytes,timingSafeEqual} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {operatorStore} from './operatorStore.mjs';

const enabled=process.env.SCENE_ROOM_OPERATOR_ENABLED==='1';
const code=randomBytes(6).toString('hex').toUpperCase();
const sessions=new Map();
let wrongCodes=0;
if(enabled){
 const path=fileURLToPath(new URL('./artifacts/service/chatgpt-pair-code',import.meta.url));
 mkdirSync(dirname(path),{recursive:true});
 writeFileSync(path,code,{mode:0o600});
}
const equal=(a,b)=>{
 const x=Buffer.from(String(a)),y=Buffer.from(String(b));
 return x.length===y.length&&timingSafeEqual(x,y);
};
export const operatorPairCode=()=>{if(!enabled)throw Error('Operator connection is disabled.');return code;};
const tools=[
 {name:'pair_space_room',description:'Authorize access to the explicitly shared Space Room project using the 12-character code shown in Space Room. The code is not an OpenAI API key.',inputSchema:{type:'object',properties:{code:{type:'string',description:'Temporary 12-character Space Room connection code'}},required:['code']}},
 {name:'read_active_project',description:'Read current scene geometry, revisions, cameras and metadata for the project explicitly shared from the open Space Room tab. Images are separate.',inputSchema:{type:'object',properties:{}}},
 {name:'view_reference_image',description:'Retrieve one image that the user explicitly shared from the selected Space Room project, as actual image content.',inputSchema:{type:'object',properties:{id:{type:'string',description:'Reference id from read_active_project'}},required:['id']}},
 {name:'propose_scene',description:'Send an editable 3D scene reconstruction to Space Room for human approval. Does NOT apply immediately. Use the current revision.',inputSchema:{type:'object',properties:{baseRevision:{type:'string'},scene:{type:'object',description:'Valid Space Room scene-analysis JSON, including objects, room, environment, camera, analysis and assumptions'}},required:['baseRevision','scene']}},
 {name:'propose_actions',description:'Send a validated scene-room.actions.v1 action batch for human approval. Changes are NOT applied until the user accepts in Space Room.',inputSchema:{type:'object',properties:{batch:{type:'object',description:'schema, baseRevision and actions taken from current context'}},required:['batch']}},
 {name:'proposal_status',description:'Check if the user applied or rejected a previously proposed change.',inputSchema:{type:'object',properties:{id:{type:'string'}},required:['id']}}
];
const t=(v)=>({type:'text',text:typeof v==='string'?v:JSON.stringify(v)});
export async function handleOperatorMcp(req,res){
 if(new URL(req.url??'/', 'http://localhost').pathname!=='/mcp')return false;
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(!enabled){res.writeHead(404);res.end();return true;}
 if(!/^(127\.0\.0\.1|localhost):\d+$/.test(req.headers.host??'')){res.writeHead(403);res.end();return true;}
 if(req.headers.origin){res.writeHead(403);res.end();return true;}
 if(req.method==='DELETE'){sessions.delete(String(req.headers['mcp-session-id']??''));res.writeHead(204);res.end();return true;}
 if(req.method!=='POST'){res.writeHead(405);res.end();return true;}
 if(!String(req.headers['content-type']??'').startsWith('application/json')){res.writeHead(415);res.end();return true;}
 let request;
 try{
  const parts=[];let len=0;
  for await(const part of req){len+=part.length;if(len>220000)throw Error('Request too large');parts.push(part);}
  request=JSON.parse(Buffer.concat(parts).toString());
 }catch{res.writeHead(400);res.end('Invalid MCP JSON');return true;}
 const id=request?.id,method=request?.method;
 if(method==='notifications/initialized'){res.writeHead(202);res.end();return true;}
 const respond=(body,status=200,session)=>{
  res.writeHead(status,{'Content-Type':'application/json',...(session?{'Mcp-Session-Id':session}:{})});
  res.end(JSON.stringify({jsonrpc:'2.0',id,...body}));
 };
 if(id===undefined||request.jsonrpc!=='2.0'){respond({error:{code:-32600,message:'Invalid JSON-RPC request'}},400);return true;}
 if(method==='initialize'){
  for(const [k,v] of sessions)if(v.until<Date.now())sessions.delete(k);
  if(sessions.size>=64){respond({error:{code:-32002,message:'Too many MCP sessions'}},503);return true;}
  const sid=randomBytes(32).toString('hex');
  sessions.set(sid,{until:Date.now()+12*3600e3,paired:false,grant:-1});
  respond({result:{protocolVersion:'2025-03-26',capabilities:{tools:{listChanged:false}},serverInfo:{name:'space-room-local',version:'0.1.0'}}},200,sid);return true;
 }
 const session=sessions.get(String(req.headers['mcp-session-id']??''));
 if(!session||session.until<Date.now()){respond({error:{code:-32001,message:'Initialize a new MCP session first'}},400);return true;}
 if(method==='ping'){respond({result:{}});return true;}
 if(method==='tools/list'){respond({result:{tools}});return true;}
 if(method!=='tools/call'){respond({error:{code:-32601,message:'Unknown MCP method'}},404);return true;}
 const {name,arguments:arg={}}=request.params??{};
 try{
  if(name==='pair_space_room'){
   if(wrongCodes>=5||typeof arg.code!=='string'||!equal(arg.code.trim().toUpperCase(),code)){wrongCodes++;throw Error('Code incorrect or pairing locked. Restart the Mac helper if needed.');}
   operatorStore.current();session.paired=true;session.grant=operatorStore.grantVersion();
   respond({result:{content:[t('Authorized. You can now read the explicitly shared Space Room project.')],isError:false}});return true;
  }
  if(!session.paired||session.grant!==operatorStore.grantVersion())throw Error('This session is not paired with the currently shared project. Pair again.');
  let content;
  if(name==='read_active_project')content=[t(operatorStore.summary())];
  else if(name==='view_reference_image'){
   const image=operatorStore.image(arg.id);
   content=[t({id:image.id,name:image.name}),{type:'image',data:image.data,mimeType:image.mimeType}];
  }else if(name==='propose_scene')content=[t(operatorStore.enqueue('scene',arg.baseRevision,arg.scene))];
  else if(name==='propose_actions')content=[t(operatorStore.enqueue('actions',arg.batch?.baseRevision,arg.batch))];
  else if(name==='proposal_status')content=[t(operatorStore.receipt(arg.id))];
  else throw Error('Unsupported tool.');
  respond({result:{content,isError:false}});
 }catch(e){respond({result:{content:[t('Space Room: '+String(e.message))],isError:true}});}
 return true;
}
