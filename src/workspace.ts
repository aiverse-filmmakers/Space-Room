import {parseProject} from './model.ts';
import type {Project} from './model.ts';

// Folder contents remain the durable source of truth. IndexedDB is a local fallback.
type PickerWindow = Window & {showDirectoryPicker?: (options?: {id?:string;mode?:'read'|'readwrite'})=>Promise<FileSystemDirectoryHandle>};
let folder:FileSystemDirectoryHandle|null=null;
let writes=Promise.resolve();
const safeId=(id:string)=>{if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id))throw Error('Invalid project identifier');return id;};
function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open('scene-room-workspace',1);request.onupgradeneeded=()=>request.result.createObjectStore('config');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
async function remember(handle:FileSystemDirectoryHandle){const db=await database();try{await new Promise<void>((resolve,reject)=>{const tx=db.transaction('config','readwrite');tx.objectStore('config').put(handle,'folder');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
async function remembered():Promise<FileSystemDirectoryHandle|null>{const db=await database();try{return await new Promise((resolve,reject)=>{const r=db.transaction('config','readonly').objectStore('config').get('folder');r.onsuccess=()=>resolve(r.result??null);r.onerror=()=>reject(r.error);});}finally{db.close();}}
export const hasWorkspace=()=>!!folder;
export const workspaceName=()=>folder?.name??null;
export const folderSupported=()=>typeof (window as PickerWindow).showDirectoryPicker==='function';
export async function restoreWorkspace():Promise<boolean>{
 const h=await remembered();if(!h)return false;
 const query=(h as FileSystemDirectoryHandle & {queryPermission?:(options:{mode:'readwrite'})=>Promise<PermissionState>}).queryPermission;
 if(!query||await query.call(h,{mode:'readwrite'})!=='granted')return false;
 folder=h;return true;
}
export async function chooseWorkspace():Promise<string>{
 const picker=(window as PickerWindow).showDirectoryPicker;
 if(!picker)throw Error('Folder saving requires Chrome or Edge over HTTPS.');
 const h=await picker.call(window,{id:'scene-room-workspace',mode:'readwrite'});
 folder=h;await remember(h);return h.name;
}
function root():FileSystemDirectoryHandle{if(!folder)throw Error('Connect a workspace folder first.');return folder;}
async function projectDir(id:string,create=false):Promise<FileSystemDirectoryHandle>{
 const projects=await root().getDirectoryHandle('Projects',{create});
 return projects.getDirectoryHandle(safeId(id),{create});
}
async function readJson(dir:FileSystemDirectoryHandle,name:string):Promise<Project>{
 const file=await dir.getFileHandle(name);
 return parseProject(JSON.parse(await (await file.getFile()).text()));
}
export async function readWorkspaceProject(id:string):Promise<Project>{
 const dir=await projectDir(id);
 try{return await readJson(dir,'project.json');}
 catch(e){try{return await readJson(dir,'project.backup.json');}catch{throw e;}}
}
export async function listWorkspaceProjects():Promise<{id:string;name:string}[]>{
 const out:{id:string;name:string}[]=[];
 let projects:FileSystemDirectoryHandle;
 try{projects=await root().getDirectoryHandle('Projects');}catch(e){if((e as DOMException).name==='NotFoundError')return out;throw e;}
 for await(const [id,entry] of projects.entries()){
  if(entry.kind!=='directory'||!/^[a-zA-Z0-9_-]{1,100}$/.test(id))continue;
  try{const p=await readWorkspaceProject(id);out.push({id,name:p.name});}catch{/* Leave unreadable projects intact. */}
 }
 return out.sort((a,b)=>a.name.localeCompare(b.name));
}
async function writeFile(dir:FileSystemDirectoryHandle,name:string,content:string|Blob){
 const handle=await dir.getFileHandle(name,{create:true});
 const writer=await handle.createWritable();
 try{await writer.write(content);await writer.close();}catch(e){await writer.abort().catch(()=>{});throw e;}
}
export async function writeWorkspaceProject(project:Project,id:string):Promise<void>{
 if(!folder)return;
 const snapshot=JSON.stringify(parseProject(project));
 const task=writes.catch(()=>{}).then(async()=>{
  const save=async()=>{
   const dir=await projectDir(id,true);
   try{const previous=await (await dir.getFileHandle('project.json')).getFile();await writeFile(dir,'project.backup.json',previous);}catch(e){if((e as DOMException).name!=='NotFoundError')throw e;}
   await writeFile(dir,'project.json',snapshot);
  };
  if(navigator.locks)await navigator.locks.request('scene-room-file-'+safeId(id),save);
  else await save();
 });
 writes=task;await task;
}
export async function saveGenerationFiles(id:string,jobId:string,media:Blob,metadata:string,archive?:Blob){
 if(!folder)return;
 safeId(jobId);
 const dir=await (await projectDir(id,true)).getDirectoryHandle('Generations',{create:true});
 const job=await dir.getDirectoryHandle(jobId,{create:true});
 const mime=media.type;
 const extension=mime==='image/jpeg'?'jpg':mime==='image/webp'?'webp':mime==='video/mp4'?'mp4':mime==='video/webm'?'webm':'png';
 await writeFile(job,'result.'+extension,media);
 await writeFile(job,'job.json',metadata);
 if(archive)await writeFile(job,'inputs-and-result.zip',archive);
}
