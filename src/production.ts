import type {Project,Pose,SceneObject,Environment} from './model.ts';
export const boardModes=['imagination','freeze','beats','bridge'] as const;
export type BoardMode=typeof boardModes[number];
export const boardNames:Record<BoardMode,string>={imagination:'Scene Imagination',freeze:'Frozen Moment',beats:'Four-Beat Story',bridge:'A-to-B Bridge'};
export type EntityRole='character'|'location'|'prop'|'wardrobe'|'lighting-style';
export type ProductionEntity={id:string;role:EntityRole;name:string;description:string;referenceIds:string[];objectIds:string[]};
export type StoryPanel={id:string;index:number;description:string;beat:string;camera?:Pose;thumbnail?:string;pinned:boolean;referenceId?:string;stagedShotId?:string};
export type BoardMessage={id:string;role:'user'|'assistant';text:string;created:string;taskId?:string;status?:'pending'|'answered'|'failed';baseRevision?:string};
export type StoryBoard={id:string;mode:BoardMode;sceneId:string;policy:'pending'|'script'|'improvise';intent:string;sourceId:string;endId:string;panels:StoryPanel[];messages:BoardMessage[];baseRevision?:string;frozen?:{objects:SceneObject[];room:Project['room'];environment?:Environment};versions:{created:string;panels:StoryPanel[];baseRevision?:string}[]};
export type Production={id:string;script:{id:string;title:string;text:string;revision:number};scenes:{id:string;name:string;brief:string}[];entities:ProductionEntity[];sourceId?:string;endId?:string;policy?:'pending'|'script'|'improvise';boards?:Record<BoardMode,StoryBoard>};
export function newProduction(project:Project):Production {
 return {id:crypto.randomUUID(),script:{id:crypto.randomUUID(),title:'',text:'',revision:0},scenes:[{id:crypto.randomUUID(),name:'Scene 01',brief:''}],entities:[],sourceId:project.references[0]?.id??'',endId:'',policy:'pending'};
}
export function productionRevision(project:Project){return JSON.stringify({production:project.production,references:project.references.map(r=>({id:r.id,name:r.name,bytes:r.data.length}))});}
export const requestStarters={Imagine:'Explore cinematic possibilities around the reference without changing approved shots.', 'New angles':'Recommend six varied camera angles of the same frozen moment. Preserve subjects, positions and lighting.', 'Story beats':'Recommend a coherent beginning, build, shift and resolution within the six existing shot slots.', 'A→B':'Connect the chosen opening and ending references through the six existing shot slots.'};
export function requestPrerequisites(project:Project,kind:keyof typeof requestStarters){
 const p=project.production,missing:string[]=[];
 if(!project.references.length)missing.push('Add a source reference.');
 if(p?.sourceId&&!project.references.some(r=>r.id===p.sourceId))missing.push('The chosen opening reference is missing. Select it again.');
 if(kind==='A→B'&&(!p?.endId||!project.references.some(r=>r.id===p.endId)))missing.push('Choose an ending reference in Script & references.');
 if(kind==='A→B'&&p?.endId===(p?.sourceId||project.references[0]?.id))missing.push('Choose a distinct ending reference.');
 if(kind!=='New angles'&&p?.policy!=='improvise'&&!p?.script.text.trim())missing.push('Add a script or explicitly choose creative exploration in Script & references.');
 return missing;
}
export function validateProduction(value:Production,validatePose:(p:Pose)=>void,validateObject:(o:SceneObject)=>void,validateEnvironment:(e:Environment|undefined)=>void){
 const text=(s:unknown,n=2000)=>typeof s==='string'&&s.length<=n,validId=(s:unknown)=>text(s,100)&&!!s;
 if(!value||!validId(value.id)||!value.script||!validId(value.script.id)||!text(value.script.title,200)||!text(value.script.text,200000)||!Number.isInteger(value.script.revision)||value.script.revision<0||!Array.isArray(value.scenes)||!value.scenes.length||value.scenes.length>200||!Array.isArray(value.entities)||value.entities.length>200)throw Error('Invalid production context.');
 for(const s of value.scenes)if(!validId(s.id)||!text(s.name,200)||!text(s.brief,10000))throw Error('Invalid script scene.');
 for(const e of value.entities)if(!validId(e.id)||!['character','location','prop','wardrobe','lighting-style'].includes(e.role)||!text(e.name,200)||!text(e.description,4000)||!Array.isArray(e.referenceIds)||!e.referenceIds.every(validId)||!Array.isArray(e.objectIds)||!e.objectIds.every(validId))throw Error('Invalid production entity.');
 const validatePanels=(panels:StoryPanel[])=>{if(!Array.isArray(panels)||panels.length!==0&&panels.length!==9||new Set(panels.map(p=>p.index)).size!==panels.length)throw Error('Invalid nine-panel storyboard.');for(const panel of panels){if(!validId(panel.id)||!Number.isInteger(panel.index)||panel.index<1||panel.index>9||!text(panel.description,2000)||!text(panel.beat,100)||typeof panel.pinned!=='boolean'||panel.thumbnail&&!/^data:image\/(png|jpeg|webp);base64,/.test(panel.thumbnail))throw Error('Invalid storyboard panel.');if(panel.camera)validatePose(panel.camera);}};
 if(value.policy!==undefined&&!['pending','script','improvise'].includes(value.policy)||value.sourceId!==undefined&&!text(value.sourceId,100)||value.endId!==undefined&&!text(value.endId,100))throw Error('Invalid production reference choices');
 if(value.boards)for(const mode of boardModes){const b=value.boards[mode];if(!b||b.mode!==mode||!validId(b.id)||!validId(b.sceneId)||!['pending','script','improvise'].includes(b.policy)||!text(b.intent,4000)||!text(b.sourceId,100)||!text(b.endId,100)||b.baseRevision!==undefined&&!text(b.baseRevision,1000000)||!Array.isArray(b.messages)||b.messages.length>200||!Array.isArray(b.versions)||b.versions.length>5)throw Error('Invalid storyboard workflow.');validatePanels(b.panels);for(const v of b.versions){if(!text(v.created,100))throw Error('Invalid board version');validatePanels(v.panels);}for(const m of b.messages)if(!validId(m.id)||!['user','assistant'].includes(m.role)||!text(m.text,12000)||!text(m.created,100)||m.taskId!==undefined&&!validId(m.taskId))throw Error('Invalid storyboard discussion.');if(b.frozen){if(!Array.isArray(b.frozen.objects)||b.frozen.objects.length>1000||!Array.isArray(b.frozen.room)||b.frozen.room.length!==3||b.frozen.room.some(n=>!Number.isFinite(n)||n<1||n>1000))throw Error('Invalid frozen scene');b.frozen.objects.forEach(validateObject);validateEnvironment(b.frozen.environment);}}
 return value;
}
