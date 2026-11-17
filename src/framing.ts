import {sensorSize} from './formats.ts';
import * as T from 'three';
import type {SceneObject,Pose} from './model.ts';
export function fitReferenceSet(objects:SceneObject[],estimate:{position:number[];target:number[];focal:number},aperture=2.8,aspect=16/9):Pose{
 const bounds=new T.Box3();
 for(const o of objects){const foot=['person','flower','car'].includes(o.kind);const box=new T.Box3(new T.Vector3(-o.size[0]/2,foot?0:-o.size[1]/2,-o.size[2]/2),new T.Vector3(o.size[0]/2,foot?o.size[1]:o.size[1]/2,o.size[2]/2));box.applyMatrix4(new T.Matrix4().makeRotationY(o.rotation));box.translate(new T.Vector3(...o.position));bounds.union(box);}
 if(bounds.isEmpty())bounds.set(new T.Vector3(-2,0,-2),new T.Vector3(2,3,2));
 const target=bounds.getCenter(new T.Vector3()),back=new T.Vector3().fromArray(estimate.position).sub(new T.Vector3().fromArray(estimate.target));if(back.lengthSq()<.01)back.set(0,-.1,1);back.normalize();
 const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),back).normalize(),up=new T.Vector3().crossVectors(back,right).normalize();
 const tanX=sensorSize(aspect).width/2/estimate.focal,tanY=sensorSize(aspect).height/2/estimate.focal;let distance=1;
 for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const delta=new T.Vector3(x,y,z).sub(target),depth=delta.dot(back);distance=Math.max(distance,depth+Math.abs(delta.dot(right))/tanX,depth+Math.abs(delta.dot(up))/tanY);}
 const position=target.clone().addScaledVector(back,distance*1.12);position.y=Math.max(.12,position.y);const cam=new T.PerspectiveCamera();cam.position.copy(position);cam.lookAt(target);
 return {t:0,position:position.toArray(),quaternion:cam.quaternion.toArray(),focal:estimate.focal,focus:position.distanceTo(target),aperture};
}
