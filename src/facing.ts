import {Euler,Vector3,Quaternion,ArrowHelper,Group,Mesh,SphereGeometry,MeshBasicMaterial} from 'three';
import type {SceneObject,Vec3,Pose} from './model.ts';
export const hasFacing=(o:SceneObject)=>['person','car','flower'].includes(o.kind);
const wrap=(v:number)=>Math.atan2(Math.sin(v),Math.cos(v));
const clamp=(v:number)=>Math.max(-Math.PI*.47,Math.min(Math.PI*.47,v));
export function turnFacing(o:SceneObject,yaw:number,pitch=0):Partial<SceneObject>{
 if(o.kind==='person')return {look:[clamp((o.look?.[0]??0)+pitch),wrap((o.look?.[1]??0)+yaw)]};
 if(o.kind==='flower')return {orientation:[clamp((o.orientation?.[0]??.2)+pitch),wrap((o.orientation?.[1]??0)+yaw),o.orientation?.[2]??0]};
 if(o.kind==='car')return {rotation:wrap(o.rotation+yaw)};return {};
}
export function facingVector(o:SceneObject){
 const a=o.orientation??(o.kind==='flower'?[.2,0,0]:[0,0,0]);
 if(o.kind==='flower')return new Vector3(0,0,1).applyEuler(new Euler(a[0],a[1],a[2],'YXZ')).applyAxisAngle(new Vector3(0,1,0),o.rotation).normalize();
 const v=new Vector3(o.kind==='car'?1:0,0,o.kind==='car'?0:1);
 if(o.kind==='person')v.applyEuler(new Euler(o.look?.[0]??0,o.look?.[1]??0,0,'YXZ'));
 return v.applyEuler(new Euler(a[0],o.rotation+a[1],a[2],'XYZ')).normalize();
}
export function facingAnchor(o:SceneObject){
 const [w,h]=o.size,a=o.orientation??[0,0,0];const local=o.kind==='car'?new Vector3(w*.44,h*.55,0):new Vector3(0,o.kind==='flower'?Math.max(h*.5,h-w*.46):h*.91,0);
 if(o.kind==='flower')local.applyAxisAngle(new Vector3(0,1,0),o.rotation);else local.applyEuler(new Euler(a[0],o.rotation+a[1],a[2],'XYZ'));
 return local.add(new Vector3(...o.position));
}
export function facingArrow(o:SceneObject,interactive=false){
 const length=Math.max(.5,Math.min(2.5,Math.max(o.size[0],o.size[1]*.35)*.65)),group=new Group();group.name=`facing:${o.id}`;
 const arrow=new ArrowHelper(facingVector(o),facingAnchor(o),length,0xd58528,length*.24,length*.13);group.add(arrow);
 for(const item of [arrow.line,arrow.cone]){item.renderOrder=10;for(const material of Array.isArray(item.material)?item.material:[item.material]){material.depthTest=false;material.depthWrite=false;}item.userData.facingHandle=o.id;item.userData.objectId=o.id;}
 if(interactive){const tip=new Mesh(new SphereGeometry(length*.12,12,8),new MeshBasicMaterial({color:0xd58528,transparent:true,opacity:.35,depthTest:false,depthWrite:false}));tip.position.copy(facingAnchor(o)).addScaledVector(facingVector(o),length);tip.renderOrder=11;tip.userData.facingHandle=o.id;tip.userData.objectId=o.id;group.add(tip);}
 return group;
}
export function facingDescription(objects:SceneObject[],pose:Pose){
 const inverse=new Quaternion(...pose.quaternion).invert();return objects.filter(hasFacing).map(o=>{const d=facingVector(o).applyQuaternion(inverse);const parts=[Math.abs(d.x)>.25?(d.x>0?'image-right':'image-left'):'',Math.abs(d.y)>.25?(d.y>0?'up':'down'):'',Math.abs(d.z)>.25?(d.z>0?'toward the viewer':'away from the viewer'):''].filter(Boolean);return `${o.name}: ${o.kind==='car'?'front/nose':'face/head'} points ${parts.join(', ')}.`;}).join(' ');
}
