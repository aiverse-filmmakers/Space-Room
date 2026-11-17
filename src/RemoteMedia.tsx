import {useEffect,useState} from 'react';
import {apiFetch} from './apiClient.ts';
export function RemoteMedia({path,kind='image',alt='',onError}:{path:string;kind?:'image'|'video';alt?:string;onError?:()=>void}){
 const [url,setUrl]=useState<string|null>(null);
 useEffect(()=>{
  let live=true,local:string|null=null;
  (async()=>{try{
   const response=await apiFetch(path);
   if(!response.ok)throw Error('Generated media unavailable');
   const blob=await response.blob();
   if(!live)return;
   local=URL.createObjectURL(blob);setUrl(local);
  }catch{if(live){setUrl(null);onError?.();}}})();
  return()=>{live=false;if(local)URL.revokeObjectURL(local);};
 },[path]);
 if(!url)return <span className="media-loading">Loading media…</span>;
 return kind==='video'?<video src={url} controls preload="metadata"/>:<img src={url} alt={alt}/>;
}
