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
export async function shareOperatorProject(projectId:string,context:unknown,references?:Reference[]){
 return result('share',json({projectId,context,references:references?.slice(0,3)}));
}
export const readOperatorProposal=()=>result<{proposal:OperatorProposal|null}>('proposal');
export const resolveOperatorProposal=(id:string,status:'applied'|'rejected'|'failed',message:string)=>result('resolve',json({id,status,message}));
export const stopOperatorSharing=()=>result('stop',json({}));
export const readOperatorPairing=()=>result<{code:string}>('code');
