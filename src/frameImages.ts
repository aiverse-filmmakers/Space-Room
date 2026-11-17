import type {Project,ShotCard,GenerationLink,FrameImageState} from './model.ts';
export function frameSource(project:Project,frame:ShotCard,override?:string[]){
 const ids=override??(frame.referenceIds?.length?frame.referenceIds:undefined);
 const references=ids===undefined?project.references:ids.map(id=>{const ref=project.references.find(r=>r.id===id);if(!ref)throw Error('A saved appearance reference is missing. Restore it before creating this frame.');return ref;});
 return {facingGuides:project.facingGuides!==false,pose:frame.pose,scene:frame.scene??project.objects,room:frame.room??project.room,environment:frame.environment??project.environment,format:project.frameFormat??'16:9',references};
}
export function framingKey(project:Project,frame:ShotCard,override?:string[]){
 const text=JSON.stringify(frameSource(project,frame,override));let h=2166136261;for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return (h>>>0).toString(16);
}
export function frameVersions(project:Project,id:string){return (project.generations??[]).filter(g=>g.kind==='image'&&g.frameId===id);}
export function completedVersions(jobs:GenerationLink[]){return jobs.filter(g=>g.status==='completed');}
export function selectedVersion(jobs:GenerationLink[],selected?:string){return jobs.find(g=>g.id===selected)??jobs.at(-1);}
export function updateFrameState(project:Project,frameId:string,patch:Partial<FrameImageState>):Project{return {...project,frameImages:[...(project.frameImages??[]).filter(f=>f.frameId!==frameId),{...(project.frameImages??[]).find(f=>f.frameId===frameId),frameId,...patch}]};}
