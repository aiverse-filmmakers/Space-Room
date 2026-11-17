import {sensorSize} from './formats.ts';
import {Box3,Vector3,PerspectiveCamera,Euler,Mesh} from 'three';
import {buildSubject} from './setGeometry.ts';
import type {Pose,SceneObject} from './model.ts';
export type FramingPreset='Wide'|'Medium'|'Close up'|'Over shoulder';
export function subjectFraming(object:SceneObject,preset:FramingPreset,current:Pose,aspect=16/9):Pose{
 const group=buildSubject(object);group.updateMatrixWorld(true);const bounds=new Box3().setFromObject(group,true);
 group.traverse(o=>{if(o instanceof Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});
 const size=bounds.getSize(new Vector3()),target=bounds.getCenter(new Vector3());let focal=preset==='Wide'?24:preset==='Close up'?85:50;
 let back=new Vector3(...current.position).sub(target);back.y=0;if(back.lengthSq()<.01)back.set(0,0,1);back.normalize();
 let position:Vector3;
 if(preset==='Over shoulder'){
  if(object.kind!=='person')throw Error('Select a person for over-shoulder framing.');
  const facing=new Vector3(0,0,1).transformDirection(group.matrixWorld),right=new Vector3(1,0,0).transformDirection(group.matrixWorld),head=new Vector3(0,object.size[1]*.84,0).applyMatrix4(group.matrixWorld);
  position=head.clone().addScaledVector(facing,-Math.max(.6,object.size[0]*1.5)).addScaledVector(right,object.size[0]*.65);target.copy(head).addScaledVector(facing,3);
 }else{
  if(preset==='Close up'){
   const local=new Vector3(0,object.kind==='person'?object.size[1]*.91:object.kind==='flower'?Math.max(object.size[1]*.5,object.size[1]-object.size[0]*.46):object.kind==='car'?object.size[1]*.73:0,0).applyEuler(new Euler(0,object.rotation,0));target.copy(new Vector3(...object.position).add(local));
   const detail=object.kind==='person'?object.size[0]*.85:object.kind==='flower'?object.size[0]*1.05:object.kind==='car'?Math.min(object.size[0]*.5,object.size[2]*1.1):Math.max(size.x,size.y,size.z);
   bounds.setFromCenterAndSize(target,new Vector3(detail,object.kind==='person'?detail*1.25:detail,detail*.3));
  }
  const right=new Vector3(back.z,0,-back.x),up=new Vector3(0,1,0),tanX=sensorSize(aspect).width/2/focal,tanY=sensorSize(aspect).height/2/focal;let distance=.3;
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const delta=new Vector3(x,y,z).sub(target);distance=Math.max(distance,delta.dot(back)+Math.abs(delta.dot(right))/tanX,delta.dot(back)+Math.abs(delta.dot(up))/tanY);}
  position=target.clone().addScaledVector(back,distance*(preset==='Wide'?1.65:1.12));
 }
 position.y=Math.max(.12,position.y);const camera=new PerspectiveCamera();camera.position.copy(position);camera.lookAt(target);
 return {t:0,position:position.toArray(),quaternion:camera.quaternion.toArray(),focal,focus:position.distanceTo(target),aperture:current.aperture};
}
