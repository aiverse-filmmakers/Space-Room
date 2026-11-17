import {apiFetch} from './apiClient.ts';
import type {Reference} from './model.ts';

export type OperatorProposal={id:string;projectId:string;baseRevision:string;kind:'scene'|'actions';payload:unknown;created:number};
const json=(value:unknown)=>({method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)} as RequestInit);
async function result<T>(path:string,init?:RequestInit):Promise<T>{
 const r=await apiFetch('/api/operator/'+path,init);
 const body=await r.json();
 if(!r.ok)throw Error(body.error||'Space Room local operator bridge is unavailable.');
 return body as T;
}
// The original image stays in the project. Shrink only the temporary preview
// transferred to the explicitly authorized local bridge, when it is too large.
async function previewReference(reference:Reference):Promise<Reference>{
 if(reference.data.length<=4e6)return reference;
 const image=new Image();image.src=reference.data;
 await image.decode();
 if(!image.naturalWidth||!image.naturalHeight)throw Error('Could not read '+reference.name);
 const canvas=document.createElement('canvas');
 const ctx=canvas.getContext('2d');
 if(!ctx)throw Error('Image preview encoding is unavailable.');
 for(const maxDimension of [2048,1600,1200,960]){
  const scale=Math.min(1,maxDimension/Math.max(image.naturalWidth,image.naturalHeight));
  canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
  canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const data=canvas.toDataURL('image/webp',0.82);
  if(/^data:image\/webp;base64,/.test(data)&&data.length<7.5e6)return {...reference,data};
 }
 throw Error('The selected reference image is too large to share as a private preview.');
}
export async function shareOperatorProject(projectId:string,context:unknown,references?:Reference[]){
 const previews=references?await Promise.all(references.slice(0,3).map(previewReference)):undefined;
 return result('share',json({projectId,context,references:previews}));
}
export const readOperatorProposal=()=>result<{proposal:OperatorProposal|null}>('proposal');
export const resolveOperatorProposal=(id:string,status:'applied'|'rejected'|'failed',message:string)=>result('resolve',json({id,status,message}));
export const stopOperatorSharing=()=>result('stop',json({}));
export const readOperatorPairing=()=>result<{code:string}>('code');
