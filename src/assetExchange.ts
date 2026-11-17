import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import type {MeshAsset,SceneObject} from './model.ts';
import {uid} from './model.ts';
const LIMIT=20*1024*1024;
function binaryToBase64(bytes:Uint8Array){
 let text='';
 for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(text);
}
export function assetBuffer(asset:MeshAsset):ArrayBuffer{
 const b64=asset.data.slice(asset.data.indexOf(',')+1),raw=atob(b64),arr=new Uint8Array(raw.length);
 for(let i=0;i<raw.length;i++)arr[i]=raw.charCodeAt(i);
 return arr.buffer;
}
export async function parseAsset(asset:MeshAsset):Promise<T.Group>{
 const source=asset.data.startsWith('data:model/gltf+json')?new TextDecoder().decode(assetBuffer(asset)):assetBuffer(asset);
 return (await new GLTFLoader().parseAsync(source,'')).scene;
}
export async function importAsset(file:File):Promise<{asset:MeshAsset;object:SceneObject}>{
 if(!/\.(glb|gltf)$/i.test(file.name))throw Error('Choose a .glb or an embedded-resource .gltf file.');
 if(file.size>LIMIT||file.size<12)throw Error('3D asset must be between 12 bytes and 20 MB.');
 const buffer=await file.arrayBuffer();
 const isJson=/\.gltf$/i.test(file.name);
 if(isJson){
  const j=JSON.parse(new TextDecoder().decode(buffer));
  for(const part of [...(j.buffers??[]),...(j.images??[])]){
   if(part.uri&&!part.uri.startsWith('data:'))throw Error('This .gltf references external files. Export a self-contained .glb from Blender instead.');
  }
 }
 const asset:MeshAsset={id:uid(),name:file.name,data:(isJson?'data:model/gltf+json;base64,':'data:model/gltf-binary;base64,')+binaryToBase64(new Uint8Array(buffer))};
 const scene=await parseAsset(asset);
 const box=new T.Box3().setFromObject(scene);
 if(box.isEmpty())throw Error('The 3D file contains no visible geometry.');
 const size=box.getSize(new T.Vector3());
 if(![size.x,size.y,size.z].every(n=>Number.isFinite(n)&&n>0&&n<=1000))throw Error('Model bounds are missing or excessively large. Check scale in Blender.');
 const object:SceneObject={id:uid(),name:file.name.replace(/\.(glb|gltf)$/i,''),kind:'model',assetId:asset.id,position:[0,0,-2],size:[Math.max(.001,size.x),Math.max(.001,size.y),Math.max(.001,size.z)],color:'#ffffff',rotation:0};
 return {asset,object};
}
export async function exportSceneGLB(scene:T.Object3D):Promise<ArrayBuffer>{
 const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');
 const result=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:true});
 if(!(result instanceof ArrayBuffer))throw Error('3D exporter did not produce a GLB.');
 return result;
}
