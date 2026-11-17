import {frameSpec} from './formats.ts';
import type {FrameFormat} from './formats.ts';
import {Quaternion,Vector3} from 'three';
import {trajectory,sampleTake} from './model.ts';
import type {Take,Reference} from './model.ts';
export function shotManifest(take:Take,references:Reference[],direction:string,format:FrameFormat='16:9'){
 const start=sampleTake(take,0),end=sampleTake(take,take.duration);
 const travel=new Vector3().fromArray(end.position).sub(new Vector3().fromArray(start.position));
 const local=travel.clone().applyQuaternion(new Quaternion().fromArray(start.quaternion).invert());
 const evaluated=trajectory(take,format);let distance=0;for(let i=1;i<evaluated.samples.length;i++)distance+=new Vector3().fromArray(evaluated.samples[i].position).distanceTo(new Vector3().fromArray(evaluated.samples[i-1].position));
 const parts=[`${take.mode} camera, ${take.duration.toFixed(2)} seconds`,`${distance.toFixed(2)} m total travel`,`${start.focal.toFixed(0)} mm${start.focal!==end.focal?` to ${end.focal.toFixed(0)} mm`:''} on a 36 mm sensor`];
 if(Math.abs(local.z)>0.1)parts.push(`${Math.abs(local.z).toFixed(2)} m ${local.z<0?'forward':'backward'} relative to starting view`);
 if(Math.abs(local.x)>0.1)parts.push(`${Math.abs(local.x).toFixed(2)} m ${local.x<0?'left':'right'} relative to starting view`);
 if(Math.abs(travel.y)>0.1)parts.push(`${Math.abs(travel.y).toFixed(2)} m ${travel.y<0?'down':'up'}`);
 return {schema:'scene-room.shot.v1',name:take.name,direction,motionDescription:parts.join('; ')+'.',duration:take.duration,aspectRatio:format,width:frameSpec(format).width,height:frameSpec(format).height,assets:{firstFrame:'start.png',lastFrame:'end.png',motionPreview:'motion.webm',trajectory:'camera.json',appearanceReferences:references.map((r,i)=>({name:r.name,path:`references/${i+1}.${r.data.startsWith('data:image/jpeg')?'jpg':r.data.startsWith('data:image/webp')?'webp':'png'}`}))},roles:{appearance:'Original references supply appearance, identity, materials and lighting.',composition:'start.png and end.png are rough spatial guides, not final appearance.',motion:'motion.webm is a rough camera and layout guide; camera.json is explicit trajectory data.'},limitations:['Single-image hidden geometry is estimated.','Only submit inputs supported by the selected model.','A model accepting frames or video does not guarantee exact trajectory reproduction.'],camera:evaluated};
}
