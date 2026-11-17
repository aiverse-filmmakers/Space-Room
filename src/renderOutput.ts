import type {FrameFormat} from './formats.ts';
import * as T from 'three';
import {zipSync,strToU8} from 'fflate';
import {sampleTake,trajectory} from './model.ts';
import {shotManifest} from './shot.ts';
import type {Take,Reference} from './model.ts';
export const png=(canvas:HTMLCanvasElement)=>new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Frame rendering failed')),'image/png'));
export async function recordPreview(canvas:HTMLCanvasElement,take:Take,renderAt:(time:number)=>void):Promise<Blob>{
 if(!window.MediaRecorder)throw Error('Video encoding is unavailable. Export a frame sequence instead.');
 const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));
 if(!mime)throw Error('No WebM encoder is available. Export a frame sequence instead.');
 renderAt(0);
 const stream=canvas.captureStream(30),recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8000000}),chunks:BlobPart[]=[];
 let frame=0;
 try{await new Promise<void>((resolve,reject)=>{
  recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=()=>reject(Error('Video encoding failed'));recorder.onstop=()=>resolve();recorder.start();
  const start=performance.now();function draw(){try{const time=Math.min(take.duration,(performance.now()-start)/1000);renderAt(time);if(time<take.duration)frame=requestAnimationFrame(draw);else recorder.stop();}catch(e){reject(e);}}frame=requestAnimationFrame(draw);
 });return new Blob(chunks,{type:mime});}finally{cancelAnimationFrame(frame);if(recorder.state!=='inactive')recorder.stop();stream.getTracks().forEach(t=>t.stop());}
}
export async function frameSequence(canvas:HTMLCanvasElement,take:Take,renderAt:(time:number)=>void,progress:(s:string)=>void,format:FrameFormat='16:9'){
 const files:Record<string,Uint8Array>={'camera.json':strToU8(JSON.stringify(trajectory(take,format),null,2))},count=Math.ceil(take.duration*24)+1;
 for(let i=0;i<count;i++){renderAt(Math.min(take.duration,i/24));files[`frames/${String(i).padStart(5,'0')}.png`]=new Uint8Array(await (await png(canvas)).arrayBuffer());progress(`Rendering ${i+1} / ${count}`);}
 return new Blob([zipSync(files,{level:0}) as BlobPart],{type:'application/zip'});
}
export async function shotPackage(canvas:HTMLCanvasElement,take:Take,references:Reference[],direction:string,renderAt:(time:number)=>void,progress:(s:string)=>void,format:FrameFormat='16:9'){
 const manifest=shotManifest(take,references,direction,format),files:Record<string,Uint8Array>={};
 renderAt(0);files['start.png']=new Uint8Array(await (await png(canvas)).arrayBuffer());renderAt(take.duration);files['end.png']=new Uint8Array(await (await png(canvas)).arrayBuffer());
 progress('Recording shot guidance');files['motion.webm']=new Uint8Array(await (await recordPreview(canvas,take,renderAt)).arrayBuffer());
 for(let i=0;i<references.length;i++){const encoded=references[i].data.split(',')[1],raw=atob(encoded);files[manifest.assets.appearanceReferences[i].path]=Uint8Array.from(raw,c=>c.charCodeAt(0));}
 files['shot.json']=strToU8(JSON.stringify(manifest,null,2));files['camera.json']=strToU8(JSON.stringify(trajectory(take,format),null,2));
 files['README.txt']=strToU8('SCENE ROOM — AI SHOT PACKAGE\n\n'+manifest.direction+'\n'+manifest.motionDescription+'\n\nOriginal references control appearance. Start/end images and motion.webm are rough composition and motion guides. Submit only assets supported by the chosen generation model. Camera JSON is not a universal model input. Review generated framing, movement, appearance and timing before accepting a result.\n');
 return new Blob([zipSync(files,{level:0}) as BlobPart],{type:'application/zip'});
}
