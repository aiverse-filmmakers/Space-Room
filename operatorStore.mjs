import {randomUUID} from 'node:crypto';

// Per-process, opt-in relay. No images, scenes or commands are written to disk.
export function createOperatorStore(now=()=>Date.now()){
 let shared=null, pending=null, grant=0;
 const receipts=new Map();
 const safeProject=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id);
 const current=()=>{
  if(!shared||now()-shared.at>25000)throw Error('No live Space Room tab is sharing a project. Enable sharing in Assistant and keep the tab open.');
  return shared;
 };
 const validateReferences=refs=>{
  if(!Array.isArray(refs)||refs.length>3)throw Error('Share up to three selected reference images.');
  return refs.map(r=>{
   if(!r||typeof r.id!=='string'||r.id.length>120||typeof r.name!=='string'||r.name.length>260||typeof r.data!=='string'||r.data.length>8e6||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(r.data))throw Error('Unsupported or oversized reference image.');
   return {id:r.id,name:r.name,data:r.data};
  });
 };
 return {
  share(input){
   if(!input||!safeProject(input.projectId)||!input.context||input.context.schema!=='scene-room.host-context.v1'||typeof input.context.revision!=='string'||!input.context.revision||JSON.stringify(input.context).length>240000)throw Error('Invalid project context.');
   if(shared&&shared.projectId!==input.projectId){pending=null;receipts.clear();grant++;}
   const references=input.references===undefined&&shared&&shared.projectId===input.projectId?shared.references:validateReferences(input.references??[]);
   shared={projectId:input.projectId,context:input.context,references,at:now()};
   return {projectId:shared.projectId,name:input.context.scene?.name??'Shared project',referenceCount:references.length};
  },
  revoke(){shared=null;pending=null;receipts.clear();grant++;return {shared:false};},
  grantVersion(){return grant;},
  current(){return current();},
  summary(){
   const s=current();
   return {projectId:s.projectId,revision:s.context.revision,context:s.context,references:s.references.map(({id,name})=>({id,name}))};
  },
  image(id){
   const r=current().references.find(r=>r.id===id);
   if(!r)throw Error('Reference was not found in the shared project.');
   const match=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(r.data);
   if(!match)throw Error('Unsupported image encoding.');
   return {id:r.id,name:r.name,mimeType:match[1],data:match[2]};
  },
  enqueue(kind,baseRevision,payload){
   const s=current();
   if(kind!=='scene'&&kind!=='actions')throw Error('Unsupported proposal type.');
   if(baseRevision!==s.context.revision)throw Error('Scene changed. Read the active project again before proposing changes.');
   if(pending)throw Error('There is already a proposal awaiting review in Space Room.');
   const size=JSON.stringify(payload??null);
   if(size.length>180000||size.length<5)throw Error('Invalid proposal size.');
   if(kind==='actions'&&(payload?.schema!=='scene-room.actions.v1'||payload.baseRevision!==baseRevision||!Array.isArray(payload.actions)||!payload.actions.length||payload.actions.length>40))throw Error('Actions require the current revision and a 1–40 action batch.');
   if(kind==='scene'&&(!payload||typeof payload!=='object'||!Array.isArray((payload.scene??payload).objects)))throw Error('A scene layout with objects is required.');
   const id=randomUUID();pending={id,projectId:s.projectId,baseRevision,kind,payload,created:now()};
   receipts.set(id,{id,status:'awaiting_approval',message:'Waiting for approval in Space Room'});
   if(receipts.size>20)receipts.delete(receipts.keys().next().value);
   return receipts.get(id);
  },
  pending(){if(!pending)return null;const s=current();return s.projectId===pending.projectId?pending:null;},
  resolve({id,status,message}){
   if(!pending||pending.id!==id||!['applied','rejected','failed'].includes(status))throw Error('No matching pending proposal.');
   receipts.set(id,{id,status,message:String(message??'').slice(0,300)});
   pending=null;return receipts.get(id);
  },
  receipt(id){return receipts.get(id)??{id,status:'unknown',message:'No result for this proposal'};}
 };
}
export const operatorStore=createOperatorStore();
