import * as T from 'three';
import {buildSubject} from './setGeometry.ts';
import {fitReferenceSet} from './framing.ts';
import type {SceneObject,Pose} from './model.ts';
// Composition fitting is deliberately CAMERA ONLY. Object geometry, orientation,
// scale and relative depth belong to the validated spatial reading, not 2D fit.
export function calibrateReference(objects:SceneObject[],estimate?:{position:number[];target:number[];focal:number},aspect=16/9):{objects:SceneObject[];pose:Pose;error:number}|null{
 if(!objects.length||objects.some(o=>!o.screenBounds))return null;
 const initial=estimate??{position:[0,1.5,12],target:[0,2,0],focal:35};
 const seed=fitReferenceSet(objects,initial,2.8,aspect),camera=new T.PerspectiveCamera(40,aspect,.05,500);camera.filmGauge=36;camera.position.fromArray(seed.position);camera.quaternion.fromArray(seed.quaternion);
 const angles=new T.Euler().setFromQuaternion(camera.quaternion,'YXZ');
 const params=[camera.position.x,camera.position.y,camera.position.z,angles.y,angles.x,seed.focal];
 const corners=objects.map(o=>{const group=buildSubject(o);group.updateMatrixWorld(true);const b=new T.Box3().setFromObject(group),points:T.Vector3[]=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(new T.Vector3(x,y,z));group.traverse(n=>{if(n instanceof T.Mesh){n.geometry.dispose();(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>m.dispose());}});return points;});
 function update(){camera.position.set(params[0],params[1],params[2]);camera.rotation.set(params[4],params[3],0,'YXZ');camera.setFocalLength(params[5]);camera.updateProjectionMatrix();camera.updateMatrixWorld();}
 function loss(){update();let total=0,count=0;for(let i=0;i<objects.length;i++){let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;for(const point of corners[i]){const v=point.clone().project(camera);if(v.z>=1||v.z<=-1)return 1e5;const x=(v.x+1)/2,y=(1-v.y)/2;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}const actual=[left,top,right,bottom],target=objects[i].screenBounds!;for(let j=0;j<4;j++){if(j===3&&objects[i].occludedBy?.length)continue;total+=(actual[j]-target[j])**2;count++;}}
  return total/Math.max(1,count);
 }
 const span=Math.max(20,...objects.flatMap(o=>o.position.map(Math.abs)))*2;
 const min=[-span,.12,-span,-Math.PI,-1.2,24],max=[span,20,span,Math.PI,1.2,85],steps=[.6,.15,.7,.025,.025,3];let score=loss();
 for(let pass=0;pass<120;pass++){let changed=false;for(let j=0;j<params.length;j++){const old=params[j];let best=old,bestScore=score;for(const sign of [-1,1]){params[j]=T.MathUtils.clamp(old+sign*steps[j],min[j],max[j]);const candidate=loss();if(candidate<bestScore){best=params[j];bestScore=candidate;}}params[j]=best;if(best!==old)changed=true;score=bestScore;}if(!changed||pass%18===17)for(let j=0;j<steps.length;j++)steps[j]*=.7;if(Math.max(...steps)<.001)break;}
 update();const centre=new T.Box3().setFromPoints(corners.flat()).getCenter(new T.Vector3());
 return {objects:structuredClone(objects),pose:{t:0,position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),focal:params[5],focus:camera.position.distanceTo(centre),aperture:2.8},error:Math.sqrt(score)};
}
