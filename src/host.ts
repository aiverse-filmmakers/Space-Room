import {hostContext} from './actions.ts';
import type {Project,Pose} from './model.ts';
export type LiveView={camera?:Pose;subjectId:string|null;shotId:string|null;takeId:string|null;time:number;mode:string;snapshot:string|null};
export type HostEvent={type:'context.changed'|'command.completed'|'command.failed'|'request.prepared';message?:string};
export type HostState={project:Project;view:LiveView;busy:boolean;instruction:string};
export type HostAdapter={read:()=>HostState;execute:(input:unknown)=>Promise<string[]>};
export function createHostBridge(adapter:HostAdapter){
 const listeners=new Set<(event:HostEvent)=>void>();let executing=false;
 const emit=(event:HostEvent)=>{for(const listener of listeners)try{listener(structuredClone(event));}catch{/* A host subscriber cannot break scene editing. */}};
 return {
  version:1 as const,
  async readContext(){const {project,view,instruction}=adapter.read();return {...await hostContext(project,instruction),view:structuredClone(view),viewRevision:JSON.stringify(view),response:{schema:'scene-room.actions.v1',baseRevision:'copy revision',expectedViewRevision:'copy viewRevision',actions:[]}};},
  async execute(input:unknown){
   if(executing||adapter.read().busy)throw Error('Wait until recording, playback or rendering finishes.');
   const expected=(input as {expectedViewRevision?:string})?.expectedViewRevision;if(expected&&expected!==JSON.stringify(adapter.read().view))throw Error('Camera or selection changed. Read fresh context.');
   executing=true;
   try{const summary=await adapter.execute(structuredClone(input));emit({type:'command.completed',message:summary.join('; ')});return {summary};}
   catch(e){emit({type:'command.failed',message:String(e)});throw e;}
   finally{executing=false;}
  },
  subscribe(listener:(event:HostEvent)=>void){listeners.add(listener);return ()=>{listeners.delete(listener);};},
  changed(){emit({type:'context.changed'});},
  request(message:string){emit({type:'request.prepared',message});}
 };
}
export type SceneRoomHost=ReturnType<typeof createHostBridge>;
declare global {interface Window {sceneRoom?:Pick<SceneRoomHost,'version'|'readContext'|'execute'|'subscribe'>}}
