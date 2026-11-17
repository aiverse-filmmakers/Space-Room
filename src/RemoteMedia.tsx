import {useEffect,useState} from 'react';
import {apiFetch} from './apiClient.ts';
import {readArchivedResult} from './workspace.ts';
export function RemoteMedia({path,kind='image',alt='',onError,projectId}:{path:string;kind?:'image'|'video';alt?:string;onError?:()=>void;projectId?:string}){
 const [url,setUrl]=useState<string|null>(null);
 useEffect(()=>{
  let live=true,local:string|null=null;
  (async()=>{try{
   let blob:Blob|null=null;
   try{const response=await apiFetch(path);if(!response.ok)throw Error('Generated media unavailable');blob=await response.blob();}
   catch{const match=path.match(/^\/api\/generation\/jobs\/([a-zA-Z0-9_-]+)\/content$/);if(match&&projectId)blob=await readArchivedResult(projectId,match[1]);}
   if(!blob)throw Error('Generated media unavailable');
   if(!live)return;
   local=URL.createObjectURL(blob);setUrl(local);
  }catch{if(live){setUrl(null);onError?.();}}})();
  return()=>{live=false;if(local)URL.revokeObjectURL(local);};
 },[path,projectId]);
 if(!url)return <span className="media-loading">Loading media…</span>;
 return kind==='video'?<video src={url} controls preload="metadata"/>:<img src={url} alt={alt}/>;
}
