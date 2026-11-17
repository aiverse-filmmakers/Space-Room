import {productionRevision} from './production.ts';
import {shotPinned} from './panels.ts';
import {parseProject,refineTake,uid} from './model.ts';
import type {Project,Pose,SceneObject,Mode} from './model.ts';
// Host AI proposes data; only this catalog can change a project. No evaluated code.
export const actionCatalog={
 'project.format':'Set the single global frame format for every view and export. format: a supported frame ratio.',
 'object.update':'Update a named object by stable ID. patch: name, position, size, color, rotation, orientation, look (head pitch/yaw), description.',
 'camera.set':'Set a complete camera pose: t, position, quaternion, focal, focus, aperture.',
 'take.refine':'Create a separate take variation. takeId, smoothing (0..1), duration (0.1..600).',
 'shot.set':'Replace one existing storyboard camera by shotId, with title, purpose and complete pose. Keep all six slots.',
 'take.plan':'Create a named planned camera take. name, mode, samples (2–256 complete timed poses), pathStyle (linear or smooth), ease (boolean).',
 'shot.annotate':'Update shot title and purpose by shotId. Preserve its framing.'
};
const sceneState=(p:Project)=>({frameFormat:p.frameFormat??'16:9',objects:p.objects,room:p.room,environment:p.environment,references:p.references.map(r=>({id:r.id,name:r.name})),takes:p.takes.map(t=>({id:t.id,samples:t.samples,duration:t.duration})),storyboard:p.storyboard?.map(({thumbnail,...shot})=>shot)});
export async function projectRevision(p:Project){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(p,(key,value)=>['thumbnail','coverageSignature','coverageFormat','compass'].includes(key)?undefined:value)));return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');}
export async function hostContext(p:Project,instruction:string){return {schema:'scene-room.host-context.v1',revision:await projectRevision(p),instruction,units:'metres; radians; Y up; north -Z; east +X',scene:{...sceneState(p),takes:p.takes.map(t=>({id:t.id,name:t.name,source:t.source,mode:t.mode,duration:t.duration,sampleCount:t.samples.length}))},analysis:p.analysis,production:p.production,actions:actionCatalog,response:{schema:'scene-room.actions.v1',baseRevision:'copy revision above',actions:[]},rules:['Return a data action batch, never executable code.','Use the existing stable IDs. Omitted subjects and references are preserved.','Creative work and image interpretation belong to the host AI. This catalog only executes explicit edits.','No network, file access, credential access, publishing or paid generation is granted.']};}
function exactKeys(value:Record<string,unknown>,allowed:string[]){for(const k of Object.keys(value))if(!allowed.includes(k))throw Error(`Unsupported action field: ${k}`);}
export async function applyActions(project:Project,input:unknown):Promise<{project:Project;camera?:Pose;summary:string[]}>{
 const batch=input as {schema:string;baseRevision:string;actions:Record<string,unknown>[]};
 if(!batch||batch.schema!=='scene-room.actions.v1'||!Array.isArray(batch.actions)||!batch.actions.length||batch.actions.length>40)throw Error('Use a batch of 1–40 supported scene actions.');
 exactKeys(batch as unknown as Record<string,unknown>,['schema','baseRevision','actions','expectedViewRevision']);
 if(batch.baseRevision!==await projectRevision(project))throw Error('The project changed since these actions were prepared. Export fresh context and ask the operator to revise them.');
 const candidate=structuredClone(project),summary:string[]=[];let camera:Pose|undefined;
 for(const a of batch.actions){if(!a||typeof a!=='object'||typeof a.type!=='string'||!Object.hasOwn(actionCatalog,a.type))throw Error('Unsupported action. Current work is preserved.');
  if(a.type==='project.format'){
   exactKeys(a,['type','format']);candidate.frameFormat=a.format as Project['frameFormat'];if(typeof a.format!=='string')throw Error('A supported frame format is required.');summary.push(`Set global frame format: ${a.format}`);
  }else if(a.type==='object.update'){
   exactKeys(a,['type','objectId','patch']);const object=candidate.objects.find(o=>o.id===a.objectId);if(!object)throw Error('Object ID is missing from the current scene.');
   if(!a.patch||typeof a.patch!=='object'||Array.isArray(a.patch))throw Error('Object patch is required.');const patch=a.patch as Record<string,unknown>;exactKeys(patch,['name','position','size','color','rotation','orientation','look','description']);if(!Object.keys(patch).length)throw Error('Object patch is empty.');
   if(patch.description!==undefined&&(typeof patch.description!=='string'||patch.description.length>4000))throw Error('Invalid object description.');
   Object.assign(object,patch as Partial<SceneObject>);summary.push(`Update ${object.name}`);
  }else if(a.type==='camera.set'){exactKeys(a,['type','pose']);if(!a.pose||typeof a.pose!=='object'||Array.isArray(a.pose))throw Error('A complete camera pose is required.');camera=structuredClone(a.pose) as Pose;candidate.homeCamera=camera;summary.push('Set camera and lens');
  }else if(a.type==='take.refine'){
   exactKeys(a,['type','takeId','smoothing','duration']);const take=candidate.takes.find(t=>t.id===a.takeId);if(!take)throw Error('Take ID is missing.');if(typeof a.smoothing!=='number'||!Number.isFinite(a.smoothing)||a.smoothing<0||a.smoothing>1||typeof a.duration!=='number'||!Number.isFinite(a.duration)||a.duration<.1||a.duration>600)throw Error('Invalid take refinement settings.');
   candidate.takes.push(refineTake(take,a.smoothing,a.duration));summary.push(`Save refined variation of ${take.name}`);
  }else if(a.type==='take.plan'){
   exactKeys(a,['type','name','mode','samples','pathStyle','ease']);
   if(typeof a.name!=='string'||!a.name.trim()||a.name.length>100||!['Gimbal','FPV','Handheld','Dolly','Crane','Steady drone','Static'].includes(String(a.mode))||!Array.isArray(a.samples)||a.samples.length<2||a.samples.length>256||!['linear','smooth'].includes(String(a.pathStyle))||typeof a.ease!=='boolean')throw Error('Invalid planned take.');
   const samples=structuredClone(a.samples) as Pose[],duration=samples.at(-1)?.t;
   if(typeof duration!=='number'||!Number.isFinite(duration)||duration<.1||duration>600)throw Error('Planned duration must be 0.1–600 seconds.');
   candidate.takes.push({id:uid(),name:a.name,mode:a.mode as Mode,source:'planned',pathStyle:a.pathStyle as 'linear'|'smooth',ease:a.ease,samples,duration,created:new Date().toISOString(),scene:structuredClone(candidate.objects),room:[...candidate.room],environment:structuredClone(candidate.environment),references:structuredClone(candidate.references)});summary.push(`Create planned take: ${a.name}`);
  }else if(a.type==='shot.set'){
   exactKeys(a,['type','shotId','title','purpose','pose']);const shot=candidate.storyboard?.find(s=>s.id===a.shotId);if(!shot)throw Error('Storyboard shot ID is missing.');if(shotPinned(shot))throw Error('Unpin this shot before replacing its camera.');
   if(typeof a.title!=='string'||!a.title.trim()||a.title.length>100||typeof a.purpose!=='string'||a.purpose.length>1000||!a.pose||typeof a.pose!=='object')throw Error('Invalid cinematic shot.');
   Object.assign(shot,{title:a.title,purpose:a.purpose,pose:structuredClone(a.pose),captured:true,pinned:true,thumbnail:undefined,scene:structuredClone(candidate.objects),room:[...candidate.room],environment:structuredClone(candidate.environment),referenceIds:candidate.references.map(r=>r.id),contextRevision:productionRevision(candidate)});summary.push(`Set shot camera: ${a.title}`);
  }else if(a.type==='shot.annotate'){
   exactKeys(a,['type','shotId','title','purpose']);const shot=candidate.storyboard?.find(s=>s.id===a.shotId);if(!shot)throw Error('Storyboard shot ID is missing.');if(typeof a.title!=='string'||!a.title.trim()||a.title.length>100||typeof a.purpose!=='string'||a.purpose.length>1000)throw Error('Invalid shot notes.');shot.title=a.title;shot.purpose=a.purpose;shot.captured=true;summary.push(`Annotate ${shot.title}`);
  }
 }
 return {project:parseProject(candidate),camera,summary};
}
